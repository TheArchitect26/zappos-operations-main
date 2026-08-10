-- Phase 40: Executive Operations Centre. Derived, advisory and source-linked.
CREATE OR REPLACE FUNCTION public.executive40_read(c uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT public.is_company_member(c) AND public.has_any_role(c,ARRAY['admin','executive','managing_director','viewer']::public.app_role[])
 AND NOT public.has_any_role(c,ARRAY['driver']::public.app_role[])
 AND NOT EXISTS(SELECT 1 FROM public.customer_portal_memberships m WHERE m.company_id=c AND m.user_id=auth.uid() AND m.status='active')
$$;
CREATE OR REPLACE FUNCTION public.executive40_write(c uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT public.executive40_read(c) AND public.has_any_role(c,ARRAY['admin','executive','managing_director']::public.app_role[])
$$;
REVOKE ALL ON FUNCTION public.executive40_read(uuid),public.executive40_write(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.executive40_read(uuid),public.executive40_write(uuid) TO authenticated;

DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY[
 'executive_operating_state','executive_kpi_snapshots','executive_change_events','executive_attention_items','executive_forward_risks','executive_opportunities','executive_briefings','executive_briefing_sections','executive_decisions','executive_scorecards','executive_board_pack_definitions','executive_audit_logs'
] LOOP EXECUTE format($ddl$
 CREATE TABLE public.%I(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id uuid,record_type text NOT NULL,domain text NOT NULL,severity text NOT NULL DEFAULT 'normal' CHECK(severity IN('normal','watch','elevated','high','critical','unknown')),
  state text NOT NULL DEFAULT 'unknown',title text NOT NULL,summary text NOT NULL,owner text,status text NOT NULL DEFAULT 'new',
  confidence numeric NOT NULL DEFAULT 0 CHECK(confidence BETWEEN 0 AND 100),coverage numeric NOT NULL DEFAULT 0 CHECK(coverage BETWEEN 0 AND 100),freshness text NOT NULL DEFAULT 'unavailable' CHECK(freshness IN('live','recent','stale','historical','unavailable')),
  comparison_period text,effective_at timestamptz NOT NULL DEFAULT now(),horizon_start timestamptz,horizon_end timestamptz,
  source_links jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(source_links)='array'),factors jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(factors)='array'),missing_sources jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(missing_sources)='array'),metrics jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(metrics)='object'),
  advisory_only boolean NOT NULL DEFAULT true CHECK(advisory_only),created_by uuid REFERENCES auth.users(id),created_at timestamptz NOT NULL DEFAULT now()
 )$ddl$,t);
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
 EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t);
 EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
 EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING(public.executive40_read(company_id))',t||'_read',t);
 EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK(public.brain_is_service(company_id))',t||'_brain_insert',t);
 EXECUTE format('CREATE INDEX %I ON public.%I(company_id,effective_at DESC)',t||'_company_time',t);
 END LOOP; END $$;

CREATE OR REPLACE FUNCTION public.executive40_immutable() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$BEGIN RAISE EXCEPTION 'Phase 40 executive evidence is append-only';END$$;
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY[
 'executive_operating_state','executive_kpi_snapshots','executive_change_events','executive_attention_items','executive_forward_risks','executive_opportunities','executive_briefings','executive_briefing_sections','executive_decisions','executive_scorecards','executive_board_pack_definitions','executive_audit_logs'
] LOOP EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.executive40_immutable()',t||'_immutable',t);END LOOP;END$$;

CREATE OR REPLACE FUNCTION public.executive40_dashboard() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$DECLARE c uuid;s record;BEGIN
 SELECT active_company_id INTO c FROM public.profiles WHERE id=auth.uid();IF NOT public.executive40_read(c) THEN RAISE EXCEPTION 'Executive access denied';END IF;
 SELECT * INTO s FROM public.executive_operating_state WHERE company_id=c ORDER BY effective_at DESC LIMIT 1;
 RETURN jsonb_build_object('operating_state',coalesce(s.state,'unknown'),'confidence',coalesce(s.confidence,0),'freshness',coalesce(s.freshness,'unavailable'),'coverage',coalesce(s.coverage,0),'factors',coalesce(s.factors,'[]'),'missing_sources',coalesce(s.missing_sources,'[]'),
 'kpis',(SELECT coalesce(jsonb_agg(to_jsonb(k)),'[]') FROM(SELECT id,title,state,severity,confidence,coverage,freshness,comparison_period,effective_at,source_links,metrics FROM public.executive_kpi_snapshots WHERE company_id=c ORDER BY effective_at DESC LIMIT 24)k),
 'changes',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM(SELECT id,title,summary,severity,confidence,freshness,effective_at,source_links,metrics FROM public.executive_change_events WHERE company_id=c ORDER BY effective_at DESC LIMIT 10)x),
 'attention',(SELECT coalesce(jsonb_agg(to_jsonb(a)),'[]') FROM(SELECT id,title,summary,domain,severity,owner,status,confidence,freshness,source_links,metrics FROM public.executive_attention_items WHERE company_id=c ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'elevated' THEN 3 ELSE 4 END,effective_at DESC LIMIT 10)a),
 'forward_risks',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') FROM(SELECT id,title,summary,domain,severity,confidence,freshness,horizon_start,horizon_end,source_links FROM public.executive_forward_risks WHERE company_id=c ORDER BY horizon_start LIMIT 10)r),
 'advisory_only',true,'financial_authorised',public.has_any_role(c,ARRAY['admin','executive','managing_director']::public.app_role[]),'hr_detail_exposed',false);END$$;

CREATE OR REPLACE FUNCTION public.executive40_records(_table text,_limit int DEFAULT 50) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$DECLARE c uuid;allowed text[]:=ARRAY['executive_opportunities','executive_briefings','executive_briefing_sections','executive_decisions','executive_scorecards','executive_board_pack_definitions','executive_audit_logs'];result jsonb;BEGIN
 SELECT active_company_id INTO c FROM public.profiles WHERE id=auth.uid();IF NOT public.executive40_read(c) THEN RAISE EXCEPTION 'Executive access denied';END IF;IF NOT _table=ANY(allowed) THEN RAISE EXCEPTION 'Executive source unavailable';END IF;
 EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(x)),''[]'') FROM(SELECT * FROM public.%I WHERE company_id=$1 ORDER BY effective_at DESC LIMIT $2)x',_table) INTO result USING c,least(greatest(_limit,1),100);RETURN result;END$$;

CREATE OR REPLACE FUNCTION public.executive40_record_decision(_title text,_summary text,_review_at timestamptz,_source_links jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$DECLARE c uuid;i uuid;BEGIN
 SELECT active_company_id INTO c FROM public.profiles WHERE id=auth.uid();IF NOT public.executive40_write(c) THEN RAISE EXCEPTION 'Executive decision denied';END IF;IF jsonb_typeof(_source_links)<>'array' OR jsonb_array_length(_source_links)=0 THEN RAISE EXCEPTION 'Decision evidence required';END IF;
 INSERT INTO public.executive_decisions(company_id,record_type,domain,severity,state,title,summary,owner,status,confidence,coverage,freshness,horizon_start,source_links,created_by) VALUES(c,'decision','executive','watch','recorded',left(_title,200),left(_summary,2000),auth.uid()::text,'recorded',100,100,'recent',_review_at,_source_links,auth.uid()) RETURNING id INTO i;
 INSERT INTO public.executive_audit_logs(company_id,record_type,domain,severity,state,title,summary,status,confidence,coverage,freshness,source_links,created_by) VALUES(c,'decision_recorded','audit','normal','recorded','Decision Recorded','Controlled executive decision record','recorded',100,100,'recent',jsonb_build_array(jsonb_build_object('table','executive_decisions','id',i)),auth.uid());
 RETURN jsonb_build_object('id',i,'advisory_only',true,'domain_workflow_mutated',false);END$$;

CREATE OR REPLACE FUNCTION public.executive40_zip(_question text) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$DECLARE c uuid;s record;BEGIN
 SELECT active_company_id INTO c FROM public.profiles WHERE id=auth.uid();IF NOT public.executive40_read(c) THEN RAISE EXCEPTION 'Executive ZIP denied';END IF;SELECT * INTO s FROM public.executive_operating_state WHERE company_id=c ORDER BY effective_at DESC LIMIT 1;
 RETURN CASE WHEN s.id IS NULL THEN jsonb_build_object('answer','Executive operating state is unavailable because no authorised snapshot exists.','citations','[]'::jsonb,'freshness','unavailable','confidence',0,'missing_data',jsonb_build_array('operating state'),'read_only',true,'forecast',false) ELSE jsonb_build_object('answer',format('The governed company operating state is %s. This is advisory and evidence-based.',s.state),'citations',jsonb_build_array(jsonb_build_object('table','executive_operating_state','id',s.id)),'freshness',s.freshness,'confidence',s.confidence,'missing_data',s.missing_sources,'read_only',true,'forecast',false) END;END$$;

REVOKE ALL ON FUNCTION public.executive40_dashboard(),public.executive40_records(text,int),public.executive40_record_decision(text,text,timestamptz,jsonb),public.executive40_zip(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.executive40_dashboard(),public.executive40_records(text,int),public.executive40_record_decision(text,text,timestamptz,jsonb),public.executive40_zip(text) TO authenticated;
COMMENT ON TABLE public.executive_operating_state IS 'Phase 40 governed aggregate referencing authoritative domain evidence; never an operational source.';
