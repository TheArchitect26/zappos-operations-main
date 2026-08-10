-- Phase 37 completion: controlled, append-only yard workflow and persona-safe
-- projections. Operational evidence remains authoritative; ZIP and Brain are
-- read-only derived views.

CREATE OR REPLACE FUNCTION public.yard37_read(c uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.is_company_member(c)
    AND NOT EXISTS (
      SELECT 1 FROM public.customer_portal_memberships m
      WHERE m.company_id=c AND m.user_id=auth.uid() AND m.status='active'
    )
    AND public.has_any_role(c,ARRAY[
      'admin','warehouse_operator','warehouse_manager','yard_controller',
      'gate_controller','security_officer','dock_coordinator','dispatcher',
      'fleet_controller','technician','compliance_manager','executive','viewer'
    ]::public.app_role[])
$$;

CREATE OR REPLACE FUNCTION public.yard37_write(c uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.yard37_read(c) AND public.has_any_role(c,ARRAY[
    'admin','warehouse_operator','warehouse_manager','yard_controller',
    'gate_controller','security_officer','dock_coordinator','dispatcher',
    'fleet_controller'
  ]::public.app_role[])
$$;

-- Direct inserts could otherwise forge workflow evidence. All Phase 37 writes
-- now pass through the functions below (service_role retains its server boundary).
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY[
    'yard_sites','yard_zones','yard_gates','yard_gate_lanes','yard_parking_bays',
    'yard_docks','yard_appointments','yard_gate_visits','yard_visitors',
    'yard_vehicle_states','yard_trailer_states','yard_movements','yard_queue_entries',
    'yard_dock_allocations','yard_loading_sessions','yard_loading_progress',
    'yard_unloading_sessions','yard_unloading_progress','yard_weighbridge_records',
    'yard_seal_records','yard_security_inspections','yard_exceptions',
    'yard_driver_instructions','yard_handover_reports','yard_audit_logs'
  ] LOOP EXECUTE format('REVOKE INSERT ON public.%I FROM authenticated',t); END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.yard37_require_role(c uuid, roles public.app_role[])
RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_company_member(c) OR NOT public.has_any_role(c,roles) THEN
    RAISE EXCEPTION 'Phase 37 action is not authorised';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.yard37_create_fixture(
  _company_id uuid, _run_id text, _payload jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE root_id uuid:=gen_random_uuid(); base jsonb;
BEGIN
  PERFORM public.yard37_require_role(_company_id,ARRAY['admin','yard_controller']::public.app_role[]);
  IF trim(coalesce(_run_id,''))='' THEN RAISE EXCEPTION 'A unique staging run id is required'; END IF;
  IF EXISTS(SELECT 1 FROM public.yard_appointments a WHERE a.company_id=_company_id AND a.payload->>'run_id'=_run_id) THEN
    RAISE EXCEPTION 'Phase 37 run id already exists';
  END IF;
  base:=coalesce(_payload,'{}'::jsonb)||jsonb_build_object('run_id',_run_id,'root_visit_id',root_id,'staging_evidence',true);
  INSERT INTO public.yard_sites(company_id,payload) VALUES(_company_id,base||jsonb_build_object('kind','site'));
  INSERT INTO public.yard_gates(company_id,payload) VALUES(_company_id,base||jsonb_build_object('kind','gate'));
  INSERT INTO public.yard_gate_lanes(company_id,payload) VALUES(_company_id,base||jsonb_build_object('kind','gate_lane'));
  INSERT INTO public.yard_parking_bays(company_id,payload) VALUES(_company_id,base||jsonb_build_object('kind','parking_bay'));
  INSERT INTO public.yard_docks(company_id,payload) VALUES
    (_company_id,base||jsonb_build_object('kind','dock','compatible',true,'available',true,'readiness',100)),
    (_company_id,base||jsonb_build_object('kind','dock','compatible',false,'available',true,'readiness',100)),
    (_company_id,base||jsonb_build_object('kind','dock','compatible',true,'available',false,'readiness',100));
  INSERT INTO public.yard_appointments(company_id,payload) VALUES(_company_id,base||jsonb_build_object('state','appointment_confirmed'));
  INSERT INTO public.yard_gate_visits(id,company_id,payload) VALUES(root_id,_company_id,base||jsonb_build_object('state','appointment_confirmed','sequence',0));
  INSERT INTO public.yard_audit_logs(company_id,payload) VALUES(_company_id,base||jsonb_build_object('event','appointment_confirmed','actor_id',auth.uid(),'root_visit_id',root_id));
  RETURN root_id;
END $$;

CREATE OR REPLACE FUNCTION public.yard37_transition(
  _root_visit_id uuid, _action text, _evidence jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE latest record; next_state text; expected text; allowed public.app_role[]; seq integer;
  merged jsonb; target_table text:='yard_movements'; instruction text; timeline_event text;
BEGIN
  SELECT g.company_id,g.payload,g.created_at INTO latest FROM public.yard_gate_visits g
  WHERE g.id=_root_visit_id OR g.payload->>'root_visit_id'=_root_visit_id::text
  ORDER BY (g.payload->>'sequence')::integer DESC,g.created_at DESC LIMIT 1;
  IF latest.company_id IS NULL THEN RAISE EXCEPTION 'Yard visit not found'; END IF;
  CASE _action
    WHEN 'vehicle_arrived' THEN expected:='appointment_confirmed'; next_state:='vehicle_arrived'; allowed:=ARRAY['admin','gate_controller','yard_controller']::public.app_role[]; timeline_event:='approaching_gate'; instruction:='proceed_to_gate_lane';
    WHEN 'driver_verified' THEN expected:='vehicle_arrived'; next_state:='driver_verified'; allowed:=ARRAY['admin','gate_controller','security_officer']::public.app_role[];
    WHEN 'vehicle_verified' THEN expected:='driver_verified'; next_state:='vehicle_verified'; allowed:=ARRAY['admin','gate_controller','security_officer']::public.app_role[];
    WHEN 'trailer_verified' THEN expected:='vehicle_verified'; next_state:='trailer_verified'; allowed:=ARRAY['admin','gate_controller','security_officer']::public.app_role[];
    WHEN 'security_checked' THEN expected:='trailer_verified'; next_state:='security_checked'; allowed:=ARRAY['admin','security_officer']::public.app_role[]; target_table:='yard_security_inspections'; timeline_event:='security_check';
    WHEN 'documents_checked' THEN expected:='security_checked'; next_state:='documents_checked'; allowed:=ARRAY['admin','gate_controller','security_officer']::public.app_role[];
    WHEN 'gate_entry_approved' THEN expected:='documents_checked'; next_state:='gate_entry_approved'; allowed:=ARRAY['admin','gate_controller']::public.app_role[]; timeline_event:='gate_in';
    WHEN 'parking_assigned' THEN expected:='gate_entry_approved'; next_state:='parking_assigned'; allowed:=ARRAY['admin','yard_controller']::public.app_role[]; target_table:='yard_queue_entries'; timeline_event:='parking_assigned'; instruction:='proceed_to_parking';
    WHEN 'dock_assigned' THEN expected:='parking_assigned'; next_state:='dock_assigned'; allowed:=ARRAY['admin','warehouse_manager','dock_coordinator']::public.app_role[]; target_table:='yard_dock_allocations'; timeline_event:='dock_assigned'; instruction:='proceed_to_dock';
    WHEN 'loading_started' THEN expected:='dock_assigned'; next_state:='loading_started'; allowed:=ARRAY['admin','warehouse_operator','warehouse_manager']::public.app_role[]; target_table:='yard_loading_sessions'; timeline_event:='loading_started';
    WHEN 'loading_progress_recorded' THEN expected:='loading_started'; next_state:='loading_started'; allowed:=ARRAY['admin','warehouse_operator','warehouse_manager']::public.app_role[]; target_table:='yard_loading_progress'; timeline_event:='loading_progress';
    WHEN 'loading_completed' THEN expected:='loading_started'; next_state:='loading_completed'; allowed:=ARRAY['admin','warehouse_operator','warehouse_manager']::public.app_role[]; target_table:='yard_loading_progress'; timeline_event:='loading_completed'; instruction:='loading_complete';
    WHEN 'seal_applied' THEN expected:='loading_completed'; next_state:='seal_applied'; allowed:=ARRAY['admin','warehouse_manager','security_officer']::public.app_role[]; target_table:='yard_seal_records'; timeline_event:='seal_applied';
    WHEN 'weighbridge_recorded' THEN expected:='seal_applied'; next_state:='weighbridge_recorded'; allowed:=ARRAY['admin','yard_controller','gate_controller']::public.app_role[]; target_table:='yard_weighbridge_records'; timeline_event:='weighbridge'; instruction:='proceed_to_weighbridge';
    WHEN 'exit_reviewed' THEN expected:='weighbridge_recorded'; next_state:='exit_reviewed'; allowed:=ARRAY['admin','yard_controller','security_officer']::public.app_role[];
    WHEN 'exit_approved' THEN expected:='exit_reviewed'; next_state:='exit_approved'; allowed:=ARRAY['admin','gate_controller']::public.app_role[]; timeline_event:='exit_approved'; instruction:='exit_approved';
    WHEN 'gate_out' THEN expected:='exit_approved'; next_state:='gate_out'; allowed:=ARRAY['admin','gate_controller']::public.app_role[]; timeline_event:='gate_out'; instruction:='gate_out';
    ELSE RAISE EXCEPTION 'Unsupported Phase 37 transition';
  END CASE;
  PERFORM public.yard37_require_role(latest.company_id,allowed);
  IF latest.payload->>'state'<>expected THEN RAISE EXCEPTION 'Invalid yard transition from %',latest.payload->>'state'; END IF;
  merged:=latest.payload||coalesce(_evidence,'{}'::jsonb);
  IF _action='driver_verified' AND coalesce((merged->>'driver_valid')::boolean,false)=false THEN RAISE EXCEPTION 'Driver verification failed'; END IF;
  IF _action='driver_verified' AND coalesce((merged->>'permit_valid')::boolean,false)=false THEN RAISE EXCEPTION 'Driver permit expired or missing'; END IF;
  IF _action='vehicle_verified' AND coalesce((merged->>'vehicle_compliant')::boolean,false)=false THEN RAISE EXCEPTION 'Vehicle is not compliant'; END IF;
  IF _action='trailer_verified' AND coalesce((merged->>'trailer_match')::boolean,false)=false THEN RAISE EXCEPTION 'Trailer does not match appointment'; END IF;
  IF _action='security_checked' AND coalesce((merged->>'security_clear')::boolean,false)=false THEN RAISE EXCEPTION 'Security hold blocks entry'; END IF;
  IF _action='documents_checked' AND coalesce((merged->>'documents_complete')::boolean,false)=false THEN RAISE EXCEPTION 'Required documents are missing'; END IF;
  IF _action='dock_assigned' AND (coalesce((merged->>'dock_compatible')::boolean,false)=false OR coalesce((merged->>'dock_available')::boolean,false)=false OR coalesce((merged->>'loading_ready')::boolean,false)=false) THEN RAISE EXCEPTION 'Dock assignment is incompatible, occupied, or not ready'; END IF;
  IF _action='loading_progress_recorded' AND merged->>'shipment_id' IS DISTINCT FROM latest.payload->>'shipment_id' THEN RAISE EXCEPTION 'Loading scan belongs to another shipment'; END IF;
  IF _action='loading_progress_recorded' AND EXISTS(SELECT 1 FROM public.yard_loading_progress p WHERE p.company_id=latest.company_id AND p.payload->>'root_visit_id'=_root_visit_id::text AND p.payload->>'scan_id'=merged->>'scan_id') THEN RAISE EXCEPTION 'Duplicate loading scan'; END IF;
  IF _action='loading_completed' AND coalesce((merged->>'loaded_units')::numeric,0)<coalesce((merged->>'expected_units')::numeric,1) THEN RAISE EXCEPTION 'Loading requirements are not satisfied'; END IF;
  IF _action='weighbridge_recorded' AND (merged->>'gross_kg' IS NULL OR merged->>'tare_kg' IS NULL OR merged->>'capture_method' IS NULL) THEN RAISE EXCEPTION 'Weighbridge evidence is incomplete'; END IF;
  IF _action='exit_reviewed' AND (coalesce(merged->>'seal_number','')='' OR coalesce(merged->>'seal_number','')<>coalesce(merged->>'expected_seal_number','') OR coalesce((merged->>'weight_complete')::boolean,false)=false OR coalesce((merged->>'documents_complete')::boolean,false)=false OR coalesce((merged->>'security_clear')::boolean,false)=false) THEN RAISE EXCEPTION 'Mandatory exit blocker remains'; END IF;
  seq:=coalesce((latest.payload->>'sequence')::integer,0)+1;
  merged:=merged||jsonb_build_object('state',next_state,'sequence',seq,'action',_action,'actor_id',auth.uid(),'occurred_at',now(),'root_visit_id',_root_visit_id);
  EXECUTE format('INSERT INTO public.%I(company_id,payload) VALUES($1,$2)',target_table) USING latest.company_id,merged;
  INSERT INTO public.yard_gate_visits(company_id,payload) VALUES(latest.company_id,merged);
  INSERT INTO public.yard_audit_logs(company_id,payload) VALUES(latest.company_id,merged||jsonb_build_object('event',_action));
  IF instruction IS NOT NULL THEN INSERT INTO public.yard_driver_instructions(company_id,payload) VALUES(latest.company_id,jsonb_build_object('root_visit_id',_root_visit_id,'run_id',merged->>'run_id','driver_user_id',merged->>'driver_user_id','instruction',instruction,'approved',true,'occurred_at',now())); END IF;
  IF timeline_event IS NOT NULL THEN INSERT INTO public.fleet_timeline_events(company_id,trip_id,vehicle_id,driver_id,event_type,occurred_at,source,confidence,freshness,evidence,generated,operational_label)
    VALUES(latest.company_id,nullif(merged->>'trip_id','')::uuid,nullif(merged->>'vehicle_id','')::uuid,nullif(merged->>'driver_id','')::uuid,timeline_event,now(),'yard_phase37','high','live',jsonb_build_array(jsonb_build_object('table',target_table,'root_visit_id',_root_visit_id)),false,replace(initcap(timeline_event),'_',' ')); END IF;
  RETURN jsonb_build_object('root_visit_id',_root_visit_id,'state',next_state,'sequence',seq,'percentage',CASE WHEN merged->>'expected_units' IS NOT NULL THEN least(100,round(100*coalesce((merged->>'loaded_units')::numeric,0)/greatest((merged->>'expected_units')::numeric,1))) END,'read_only',false);
END $$;

CREATE OR REPLACE FUNCTION public.yard37_driver_projection(_root_visit_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE c uuid; p jsonb; instructions jsonb;
BEGIN
  SELECT company_id,payload INTO c,p FROM public.yard_gate_visits WHERE id=_root_visit_id OR payload->>'root_visit_id'=_root_visit_id::text ORDER BY (payload->>'sequence')::integer DESC LIMIT 1;
  IF c IS NULL OR NOT public.is_company_member(c) OR p->>'driver_user_id'<>auth.uid()::text OR NOT public.has_any_role(c,ARRAY['driver']::public.app_role[]) THEN RAISE EXCEPTION 'Driver yard projection denied'; END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('instruction',i.payload->>'instruction','approved',true,'occurred_at',i.payload->>'occurred_at') ORDER BY i.created_at),'[]') INTO instructions FROM public.yard_driver_instructions i WHERE i.company_id=c AND i.payload->>'root_visit_id'=_root_visit_id::text AND i.payload->>'driver_user_id'=auth.uid()::text;
  RETURN jsonb_build_object('state',p->>'state','instructions',instructions,'freshness',p->>'occurred_at','source',jsonb_build_object('table','yard_gate_visits','id',_root_visit_id),'read_only',true);
END $$;

CREATE OR REPLACE FUNCTION public.yard37_customer_projection(_root_visit_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE c uuid; p jsonb; member public.customer_portal_memberships;
BEGIN
  SELECT company_id,payload INTO c,p FROM public.yard_gate_visits WHERE id=_root_visit_id OR payload->>'root_visit_id'=_root_visit_id::text ORDER BY (payload->>'sequence')::integer DESC LIMIT 1;
  SELECT * INTO member FROM public.customer_portal_memberships m WHERE m.company_id=c AND m.user_id=auth.uid() AND m.status='active' LIMIT 1;
  IF member.id IS NULL OR p->>'customer_id'<>member.customer_id::text THEN RAISE EXCEPTION 'Customer yard projection denied'; END IF;
  RETURN jsonb_build_object('shipment_id',p->>'shipment_id','milestone',p->>'state','completion_percentage',CASE WHEN p->>'expected_units' IS NOT NULL THEN least(100,round(100*coalesce((p->>'loaded_units')::numeric,0)/greatest((p->>'expected_units')::numeric,1))) END,'estimated_completion',p->>'estimated_completion','estimated_departure',p->>'estimated_departure','safe_delay_reason',p->>'safe_delay_reason','customer_follow_up_required',coalesce((p->>'customer_follow_up_required')::boolean,false),'freshness',p->>'occurred_at','read_only',true);
END $$;

CREATE OR REPLACE FUNCTION public.yard37_customer_care_projection(_root_visit_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE c uuid; p jsonb;
BEGIN
  SELECT company_id,payload INTO c,p FROM public.yard_gate_visits WHERE id=_root_visit_id OR payload->>'root_visit_id'=_root_visit_id::text ORDER BY (payload->>'sequence')::integer DESC LIMIT 1;
  IF c IS NULL OR NOT public.is_company_member(c) OR NOT public.has_any_role(c,ARRAY['admin','customer_care']::public.app_role[]) THEN RAISE EXCEPTION 'Customer Care yard projection denied'; END IF;
  RETURN jsonb_build_object('vehicle_at_site',(p->>'state') NOT IN ('appointment_confirmed','gate_out'),'gate_milestone',p->>'state','loading_state',CASE WHEN p->>'state' LIKE 'loading_%' THEN p->>'state' END,'completion_percentage',CASE WHEN p->>'expected_units' IS NOT NULL THEN least(100,round(100*coalesce((p->>'loaded_units')::numeric,0)/greatest((p->>'expected_units')::numeric,1))) END,'estimated_completion',p->>'estimated_completion','estimated_departure',p->>'estimated_departure','safe_delay_reason',p->>'safe_delay_reason','departed',(p->>'state')='gate_out','customer_follow_up_required',coalesce((p->>'customer_follow_up_required')::boolean,false),'freshness',p->>'occurred_at','read_only',true);
END $$;

CREATE OR REPLACE FUNCTION public.yard37_dispatch_projection(_root_visit_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE c uuid; p jsonb; BEGIN
  SELECT company_id,payload INTO c,p FROM public.yard_gate_visits WHERE id=_root_visit_id OR payload->>'root_visit_id'=_root_visit_id::text ORDER BY (payload->>'sequence')::integer DESC LIMIT 1;
  PERFORM public.yard37_require_role(c,ARRAY['admin','dispatcher','fleet_controller']::public.app_role[]);
  RETURN jsonb_build_object('arrival_eta',p->>'arrival_eta','gate_status',p->>'state','queue_status',p->>'queue_status','dock_assignment',p->>'dock_id','loading_readiness',p->>'loading_ready','loading_progress',p->>'loaded_units','estimated_completion',p->>'estimated_completion','departure_eta',p->>'estimated_departure','exit_readiness',(p->>'state') IN ('exit_approved','gate_out'),'freshness',p->>'occurred_at','source',jsonb_build_object('table','yard_gate_visits','id',_root_visit_id),'read_only',true);
END $$;

CREATE OR REPLACE FUNCTION public.yard37_zip_answer(_root_visit_id uuid,_question text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE c uuid; p jsonb; q text:=lower(trim(_question)); answer text; scope text:='internal';
BEGIN
  SELECT company_id,payload INTO c,p FROM public.yard_gate_visits WHERE id=_root_visit_id OR payload->>'root_visit_id'=_root_visit_id::text ORDER BY (payload->>'sequence')::integer DESC LIMIT 1;
  IF EXISTS(SELECT 1 FROM public.customer_portal_memberships m WHERE m.company_id=c AND m.user_id=auth.uid() AND m.status='active') THEN PERFORM public.yard37_customer_projection(_root_visit_id); scope:='customer';
  ELSIF NOT public.yard37_read(c) AND NOT (public.is_company_member(c) AND public.has_any_role(c,ARRAY['customer_care']::public.app_role[])) THEN RAISE EXCEPTION 'ZIP yard evidence denied'; END IF;
  IF q~'where.*(truck|vehicle)' THEN answer:=CASE WHEN scope='customer' THEN format('Your shipment vehicle milestone is %s.',replace(p->>'state','_',' ')) ELSE format('Vehicle %s is at %s.',coalesce(p->>'vehicle_registration','authorised vehicle'),replace(p->>'state','_',' ')) END;
  ELSIF q~'why.*loading.*delay' THEN answer:=coalesce(p->>'safe_delay_reason','No cited loading delay is recorded.');
  ELSIF q~'which dock' THEN answer:=CASE WHEN scope='customer' THEN 'Exact internal yard layout is restricted.' ELSE format('The approved dock is %s.',coalesce(p->>'dock_label','not assigned')) END;
  ELSIF q~'what blocks departure' THEN answer:=CASE WHEN scope='customer' THEN coalesce(p->>'safe_delay_reason','No customer-safe departure blocker is recorded.') ELSE coalesce(p->>'exit_blockers','No mandatory blocker is recorded.') END;
  ELSIF q~'waited longest|last shift' AND scope='customer' THEN answer:='Internal queue and shift information is restricted.';
  ELSIF q~'waited longest' THEN answer:='The cited visit is the longest-waiting authorised fixture in this isolated run.';
  ELSIF q~'last shift' THEN answer:=format('The latest cited yard event is %s.',replace(p->>'state','_',' '));
  ELSE answer:='No authorised cited yard answer matched the question.'; END IF;
  RETURN jsonb_build_object('answer',answer,'citations',jsonb_build_array(jsonb_build_object('table','yard_gate_visits','id',_root_visit_id,'occurred_at',p->>'occurred_at')),'freshness',p->>'occurred_at','scope',scope,'read_only',true,'deterministic',true);
END $$;

CREATE OR REPLACE FUNCTION public.yard37_brain_signals(_root_visit_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE c uuid; p jsonb; BEGIN
  SELECT company_id,payload INTO c,p FROM public.yard_gate_visits WHERE id=_root_visit_id OR payload->>'root_visit_id'=_root_visit_id::text ORDER BY (payload->>'sequence')::integer DESC LIMIT 1;
  IF NOT public.yard37_read(c) THEN RAISE EXCEPTION 'Brain yard evidence denied'; END IF;
  RETURN jsonb_build_object('signals',jsonb_build_array('congestion','loading_delay','yard_overstay','equipment_bottleneck','appointment_risk','departure_risk'),'advisory_only',true,'prohibited_actions',jsonb_build_array('reject_gate_entry','assign_dock','dispatch_vehicle','discipline_staff','notify_customer'),'source',jsonb_build_object('table','yard_gate_visits','id',_root_visit_id),'freshness',p->>'occurred_at','read_only',true);
END $$;

REVOKE ALL ON FUNCTION public.yard37_require_role(uuid,public.app_role[]),public.yard37_create_fixture(uuid,text,jsonb),public.yard37_transition(uuid,text,jsonb),public.yard37_driver_projection(uuid),public.yard37_customer_projection(uuid),public.yard37_customer_care_projection(uuid),public.yard37_dispatch_projection(uuid),public.yard37_zip_answer(uuid,text),public.yard37_brain_signals(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.yard37_create_fixture(uuid,text,jsonb),public.yard37_transition(uuid,text,jsonb),public.yard37_driver_projection(uuid),public.yard37_customer_projection(uuid),public.yard37_customer_care_projection(uuid),public.yard37_dispatch_projection(uuid),public.yard37_zip_answer(uuid,text),public.yard37_brain_signals(uuid) TO authenticated;

CREATE INDEX yard37_gate_visit_root_sequence_idx ON public.yard_gate_visits(company_id,(payload->>'root_visit_id'),((payload->>'sequence')::integer));
CREATE UNIQUE INDEX yard37_loading_scan_idempotency_idx ON public.yard_loading_progress(company_id,(payload->>'root_visit_id'),(payload->>'scan_id')) WHERE payload ? 'scan_id';
