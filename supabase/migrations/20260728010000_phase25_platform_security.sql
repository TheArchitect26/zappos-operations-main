-- Phase 25 security: device identities, telemetry and commercial records fail closed.
CREATE OR REPLACE FUNCTION public.platform_is_reader(_company_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.brain_is_ops_reader(_company_id)
$$;
CREATE OR REPLACE FUNCTION public.platform_is_admin(_company_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.platform_is_reader(_company_id) AND public.has_any_role(_company_id, ARRAY['admin','system_administrator','technical_administrator','integration_manager','brain_administrator']::public.app_role[])
$$;
CREATE OR REPLACE FUNCTION public.platform_is_device_manager(_company_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.platform_is_admin(_company_id) OR (public.platform_is_reader(_company_id) AND public.has_any_role(_company_id, ARRAY['fleet_manager','warehouse_manager','warehouse_supervisor','operations_manager','supervisor','quality_manager']::public.app_role[]))
$$;
CREATE OR REPLACE FUNCTION public.platform_is_finance_manager(_company_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.platform_is_admin(_company_id) OR (public.platform_is_reader(_company_id) AND public.has_any_role(_company_id, ARRAY['finance_manager','finance_officer']::public.app_role[]))
$$;
CREATE OR REPLACE FUNCTION public.platform_is_service(_company_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.brain_is_service(_company_id) $$;
CREATE OR REPLACE FUNCTION public.platform_is_global_admin() RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role IN ('admin','system_administrator','technical_administrator','brain_administrator'))
$$;
CREATE OR REPLACE FUNCTION public.platform_is_global_reader() RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role IN ('admin','system_administrator','technical_administrator','integration_manager','brain_administrator','brain_analyst','brain_reviewer','fleet_manager','dispatcher','warehouse_manager','warehouse_supervisor','operations_manager','quality_manager','procurement_manager','compliance_manager','finance_manager','finance_officer','executive','managing_director','analyst','viewer'))
$$;
CREATE OR REPLACE FUNCTION public.platform_is_mobile_user(_company_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.is_company_member(_company_id) AND NOT public.has_any_role(_company_id, ARRAY['customer']::public.app_role[])
$$;
REVOKE ALL ON FUNCTION public.platform_is_reader(UUID),public.platform_is_admin(UUID),public.platform_is_device_manager(UUID),public.platform_is_finance_manager(UUID),public.platform_is_service(UUID),public.platform_is_global_admin(),public.platform_is_global_reader(),public.platform_is_mobile_user(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.platform_is_reader(UUID),public.platform_is_admin(UUID),public.platform_is_device_manager(UUID),public.platform_is_finance_manager(UUID),public.platform_is_service(UUID),public.platform_is_global_admin(),public.platform_is_global_reader(),public.platform_is_mobile_user(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.platform_phase25_restricted_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF to_jsonb(NEW)::text ~* '(password|access[_-]?token|bearer[_-]?token|api[_-]?key|medical|diagnos|payroll|bank.*(account|number)|identity.*number|id[_-]?number|home.*address|personal.*(email|phone|contact))' THEN
    RAISE EXCEPTION 'Platform records must contain redacted telemetry and metadata only';
  END IF;
  RETURN NEW;
END $$;
GRANT INSERT,UPDATE,DELETE ON public.platform_tenant_settings,public.platform_feature_licenses,public.platform_devices,public.platform_device_credentials,public.platform_device_groups,public.platform_device_group_memberships,public.platform_firmware_rollouts,public.platform_device_configurations,public.platform_device_commands,public.platform_digital_twins,public.platform_twin_relationships,public.platform_mobile_installations,public.platform_partner_applications,public.platform_partner_subscriptions,public.platform_plugin_installations,public.platform_subscriptions,public.platform_billing_statements,public.platform_rma_cases,public.platform_edge_profiles,public.platform_pilot_projects,public.platform_pilot_installations TO authenticated;
GRANT INSERT,UPDATE ON public.platform_mobile_sync_envelopes,public.platform_pilot_feedback TO authenticated;
GRANT INSERT,UPDATE,DELETE ON public.platform_device_models,public.platform_firmware_releases,public.platform_mobile_app_releases,public.platform_marketplace_plugins,public.platform_billing_plans,public.platform_bom_revisions,public.platform_pcb_revisions,public.platform_manufacturing_batches,public.platform_manufactured_units TO authenticated;
CREATE OR REPLACE FUNCTION public.platform_phase25_device_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' AND NEW.status <> 'inventory' THEN RAISE EXCEPTION 'Devices must enter the registry as inventory'; END IF;
  IF TG_OP='UPDATE' AND (NEW.serial_number IS DISTINCT FROM OLD.serial_number OR NEW.device_model_id IS DISTINCT FROM OLD.device_model_id OR NEW.device_kind IS DISTINCT FROM OLD.device_kind) THEN RAISE EXCEPTION 'Device identity is immutable'; END IF;
  IF TG_OP='UPDATE' AND NEW.status <> OLD.status AND NOT ((OLD.status='inventory' AND NEW.status IN ('provisioning','retired','rma')) OR (OLD.status='provisioning' AND NEW.status IN ('active','suspended','retired')) OR (OLD.status='active' AND NEW.status IN ('suspended','retired','rma')) OR (OLD.status='suspended' AND NEW.status IN ('active','retired','rma')) OR (OLD.status='rma' AND NEW.status IN ('inventory','retired')) OR (OLD.status='retired' AND NEW.status='retired')) THEN RAISE EXCEPTION 'Invalid device lifecycle transition'; END IF;
  IF NEW.status IN ('provisioning','active') AND (NEW.identity_public_key_reference IS NULL OR NEW.certificate_reference IS NULL) THEN RAISE EXCEPTION 'Provisioned devices require identity and certificate references'; END IF;
  IF NEW.status IN ('provisioning','active') AND NOT EXISTS(SELECT 1 FROM public.platform_device_credentials credential WHERE credential.company_id=NEW.company_id AND credential.device_id=NEW.id AND credential.credential_type='provisioning_token' AND credential.token_hash IS NOT NULL AND credential.status IN ('issued','active')) THEN RAISE EXCEPTION 'Provisioned devices require an issued hashed provisioning credential'; END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.platform_phase25_configuration_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' AND NEW.status <> 'draft' THEN RAISE EXCEPTION 'Device configurations must begin as drafts'; END IF;
  IF TG_OP='UPDATE' AND NEW.status <> OLD.status AND NOT ((OLD.status='draft' AND NEW.status IN ('approved','revoked')) OR (OLD.status='approved' AND NEW.status IN ('applied','failed','revoked')) OR (OLD.status='failed' AND NEW.status='approved')) THEN RAISE EXCEPTION 'Invalid device configuration lifecycle transition'; END IF;
  IF NEW.status='approved' AND NEW.approved_by IS NULL THEN RAISE EXCEPTION 'Device configuration requires human approval'; END IF;
  IF NEW.status='applied' AND NOT public.platform_is_service(NEW.company_id) THEN RAISE EXCEPTION 'Only the controlled device service may mark configuration applied'; END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.platform_phase25_firmware_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_TABLE_NAME='platform_firmware_releases' AND TG_OP='UPDATE' AND OLD.status IN ('approved','retired') AND NEW IS DISTINCT FROM OLD THEN RAISE EXCEPTION 'Approved and retired firmware releases are immutable'; END IF;
  IF TG_TABLE_NAME='platform_firmware_releases' AND NEW.status='approved' AND (NEW.owner_id IS NULL OR NEW.reviewer_id IS NULL OR NEW.approved_by IS NULL OR NEW.owner_id=NEW.reviewer_id OR NEW.owner_id=NEW.approved_by OR NEW.reviewer_id=NEW.approved_by OR NEW.approved_by IS DISTINCT FROM auth.uid() OR NOT public.platform_is_global_admin()) THEN RAISE EXCEPTION 'Firmware approval requires separate owner, reviewer and authorised approver'; END IF;
  IF TG_TABLE_NAME='platform_firmware_rollouts' AND NEW.status IN ('scheduled','running') AND (NEW.approved_by IS NULL OR NOT EXISTS(SELECT 1 FROM public.platform_firmware_releases release WHERE release.id=NEW.firmware_release_id AND release.status='approved')) THEN RAISE EXCEPTION 'Firmware rollout requires approved firmware and a human approver'; END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.platform_phase25_telemetry_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.observed_at > now() + interval '10 minutes' THEN RAISE EXCEPTION 'Telemetry timestamp is too far in the future'; END IF;
  IF NEW.schema_version < 1 OR NEW.sequence_number < 0 THEN RAISE EXCEPTION 'Telemetry schema and sequence are invalid'; END IF;
  IF NEW.payload_redacted::text ~* '(password|secret|token|medical|payroll|bank|identity)' THEN RAISE EXCEPTION 'Restricted fields cannot enter telemetry'; END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.platform_phase25_twin_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.predicted_maintenance_advisory ? 'automatic_action' AND (NEW.predicted_maintenance_advisory->>'automatic_action')::boolean THEN RAISE EXCEPTION 'Predictive operations are advisory only'; END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.platform_phase25_edge_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.local_rules_redacted::text ~* '(dispatch|assign|payment|approve|discipline|delete|unlock)' THEN RAISE EXCEPTION 'Edge rules may not execute autonomous business actions'; END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.platform_phase25_append_audit() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE scoped_company UUID; scoped_entity UUID;
BEGIN
  IF TG_OP='DELETE' THEN scoped_company:=OLD.company_id; scoped_entity:=OLD.id; ELSE scoped_company:=NEW.company_id; scoped_entity:=NEW.id; END IF;
  INSERT INTO public.platform_audit_logs(company_id,entity_type,entity_id,event_type,actor_id,metadata) VALUES(scoped_company,TG_TABLE_NAME,scoped_entity,'platform.'||lower(TG_OP),auth.uid(),jsonb_build_object('phase','25','autonomous_action',false));
  IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.platform_phase25_publish_telemetry_event() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.processing_state IN ('accepted','correlated') THEN
    INSERT INTO public.integration_event_bus(company_id,event_type,aggregate_type,aggregate_id,source_module,payload_metadata)
    VALUES(NEW.company_id,'platform.telemetry.'||NEW.processing_state,'platform_device',NEW.device_id,'tracking',jsonb_build_object('telemetry_event_id',NEW.id,'transport',NEW.transport,'delta',NEW.delta,'compression_type',NEW.compression_type));
  END IF;
  RETURN NEW;
END $$;

DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY['platform_tenant_settings','platform_feature_licenses','platform_usage_meters','platform_devices','platform_device_credentials','platform_device_groups','platform_device_group_memberships','platform_firmware_rollouts','platform_device_configurations','platform_device_commands','platform_device_health_snapshots','platform_telemetry_events','platform_digital_twins','platform_twin_relationships','platform_twin_state_history','platform_mobile_installations','platform_mobile_sync_envelopes','platform_partner_applications','platform_partner_subscriptions','platform_plugin_installations','platform_subscriptions','platform_billing_statements','platform_rma_cases','platform_edge_profiles','platform_edge_sync_states','platform_pilot_projects','platform_pilot_installations','platform_pilot_feedback','platform_audit_logs'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon',table_name);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated',table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role',table_name);
    IF table_name <> 'platform_audit_logs' THEN EXECUTE format('CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.platform_phase25_append_audit()',table_name||'_audit',table_name); END IF;
  END LOOP;
END $$;
DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY['platform_device_models','platform_firmware_releases','platform_mobile_app_releases','platform_marketplace_plugins','platform_billing_plans','platform_bom_revisions','platform_pcb_revisions','platform_manufacturing_batches','platform_manufactured_units'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon',table_name);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated',table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role',table_name);
  END LOOP;
END $$;

CREATE POLICY platform_tenant_admin ON public.platform_tenant_settings FOR ALL TO authenticated USING(public.platform_is_admin(company_id)) WITH CHECK(public.platform_is_admin(company_id));
CREATE POLICY platform_features_read ON public.platform_feature_licenses FOR SELECT TO authenticated USING(public.platform_is_reader(company_id));
CREATE POLICY platform_features_admin ON public.platform_feature_licenses FOR ALL TO authenticated USING(public.platform_is_admin(company_id)) WITH CHECK(public.platform_is_admin(company_id));
CREATE POLICY platform_usage_finance_read ON public.platform_usage_meters FOR SELECT TO authenticated USING(public.platform_is_finance_manager(company_id));
CREATE POLICY platform_usage_service ON public.platform_usage_meters FOR ALL TO authenticated USING(public.platform_is_service(company_id)) WITH CHECK(public.platform_is_service(company_id));
CREATE POLICY platform_devices_read ON public.platform_devices FOR SELECT TO authenticated USING(public.platform_is_reader(company_id));
CREATE POLICY platform_devices_manager ON public.platform_devices FOR ALL TO authenticated USING(public.platform_is_device_manager(company_id)) WITH CHECK(public.platform_is_device_manager(company_id));
CREATE POLICY platform_credentials_admin ON public.platform_device_credentials FOR ALL TO authenticated USING(public.platform_is_admin(company_id)) WITH CHECK(public.platform_is_admin(company_id));
CREATE POLICY platform_groups_read ON public.platform_device_groups FOR SELECT TO authenticated USING(public.platform_is_reader(company_id));
CREATE POLICY platform_groups_manager ON public.platform_device_groups FOR ALL TO authenticated USING(public.platform_is_device_manager(company_id)) WITH CHECK(public.platform_is_device_manager(company_id));
CREATE POLICY platform_group_members_read ON public.platform_device_group_memberships FOR SELECT TO authenticated USING(public.platform_is_reader(company_id));
CREATE POLICY platform_group_members_manager ON public.platform_device_group_memberships FOR ALL TO authenticated USING(public.platform_is_device_manager(company_id)) WITH CHECK(public.platform_is_device_manager(company_id));
CREATE POLICY platform_rollouts_read ON public.platform_firmware_rollouts FOR SELECT TO authenticated USING(public.platform_is_reader(company_id));
CREATE POLICY platform_rollouts_admin ON public.platform_firmware_rollouts FOR ALL TO authenticated USING(public.platform_is_admin(company_id)) WITH CHECK(public.platform_is_admin(company_id));
CREATE POLICY platform_config_read ON public.platform_device_configurations FOR SELECT TO authenticated USING(public.platform_is_reader(company_id));
CREATE POLICY platform_config_manager ON public.platform_device_configurations FOR ALL TO authenticated USING(public.platform_is_device_manager(company_id)) WITH CHECK(public.platform_is_device_manager(company_id));
CREATE POLICY platform_commands_read ON public.platform_device_commands FOR SELECT TO authenticated USING(public.platform_is_reader(company_id));
CREATE POLICY platform_commands_manager ON public.platform_device_commands FOR INSERT TO authenticated WITH CHECK(public.platform_is_device_manager(company_id) AND requested_by=auth.uid());
CREATE POLICY platform_commands_service ON public.platform_device_commands FOR UPDATE TO authenticated USING(public.platform_is_service(company_id)) WITH CHECK(public.platform_is_service(company_id));
CREATE POLICY platform_health_read ON public.platform_device_health_snapshots FOR SELECT TO authenticated USING(public.platform_is_reader(company_id));
CREATE POLICY platform_health_service ON public.platform_device_health_snapshots FOR ALL TO authenticated USING(public.platform_is_service(company_id)) WITH CHECK(public.platform_is_service(company_id));
CREATE POLICY platform_telemetry_read ON public.platform_telemetry_events FOR SELECT TO authenticated USING(public.platform_is_reader(company_id));
CREATE POLICY platform_telemetry_service ON public.platform_telemetry_events FOR ALL TO authenticated USING(public.platform_is_service(company_id)) WITH CHECK(public.platform_is_service(company_id));
CREATE POLICY platform_twins_read ON public.platform_digital_twins FOR SELECT TO authenticated USING(public.platform_is_reader(company_id));
CREATE POLICY platform_twins_service ON public.platform_digital_twins FOR ALL TO authenticated USING(public.platform_is_service(company_id) OR public.platform_is_device_manager(company_id)) WITH CHECK(public.platform_is_service(company_id) OR public.platform_is_device_manager(company_id));
CREATE POLICY platform_twin_rel_read ON public.platform_twin_relationships FOR SELECT TO authenticated USING(public.platform_is_reader(company_id));
CREATE POLICY platform_twin_rel_manager ON public.platform_twin_relationships FOR ALL TO authenticated USING(public.platform_is_device_manager(company_id)) WITH CHECK(public.platform_is_device_manager(company_id));
CREATE POLICY platform_twin_history_read ON public.platform_twin_state_history FOR SELECT TO authenticated USING(public.platform_is_reader(company_id));
CREATE POLICY platform_twin_history_service ON public.platform_twin_state_history FOR ALL TO authenticated USING(public.platform_is_service(company_id)) WITH CHECK(public.platform_is_service(company_id));
CREATE POLICY platform_mobile_own ON public.platform_mobile_installations FOR ALL TO authenticated USING(user_id=auth.uid() AND public.platform_is_mobile_user(company_id)) WITH CHECK(user_id=auth.uid() AND public.platform_is_mobile_user(company_id));
CREATE POLICY platform_mobile_admin_read ON public.platform_mobile_installations FOR SELECT TO authenticated USING(public.platform_is_admin(company_id));
CREATE POLICY platform_mobile_sync_own ON public.platform_mobile_sync_envelopes FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.platform_mobile_installations installation WHERE installation.id=installation_id AND installation.company_id=platform_mobile_sync_envelopes.company_id AND installation.user_id=auth.uid()));
CREATE POLICY platform_mobile_sync_insert ON public.platform_mobile_sync_envelopes FOR INSERT TO authenticated WITH CHECK(EXISTS(SELECT 1 FROM public.platform_mobile_installations installation WHERE installation.id=installation_id AND installation.company_id=platform_mobile_sync_envelopes.company_id AND installation.user_id=auth.uid()));
CREATE POLICY platform_mobile_sync_service ON public.platform_mobile_sync_envelopes FOR ALL TO authenticated USING(public.platform_is_service(company_id)) WITH CHECK(public.platform_is_service(company_id));
CREATE POLICY platform_partner_admin ON public.platform_partner_applications FOR ALL TO authenticated USING(public.platform_is_admin(company_id)) WITH CHECK(public.platform_is_admin(company_id));
CREATE POLICY platform_partner_subscriptions_admin ON public.platform_partner_subscriptions FOR ALL TO authenticated USING(public.platform_is_admin(company_id)) WITH CHECK(public.platform_is_admin(company_id));
CREATE POLICY platform_plugins_read ON public.platform_plugin_installations FOR SELECT TO authenticated USING(public.platform_is_reader(company_id));
CREATE POLICY platform_plugins_admin ON public.platform_plugin_installations FOR ALL TO authenticated USING(public.platform_is_admin(company_id)) WITH CHECK(public.platform_is_admin(company_id));
CREATE POLICY platform_subscriptions_finance ON public.platform_subscriptions FOR ALL TO authenticated USING(public.platform_is_finance_manager(company_id)) WITH CHECK(public.platform_is_finance_manager(company_id));
CREATE POLICY platform_statements_finance ON public.platform_billing_statements FOR ALL TO authenticated USING(public.platform_is_finance_manager(company_id)) WITH CHECK(public.platform_is_finance_manager(company_id));
CREATE POLICY platform_rma_read ON public.platform_rma_cases FOR SELECT TO authenticated USING(company_id IS NULL OR public.platform_is_device_manager(company_id));
CREATE POLICY platform_rma_manager ON public.platform_rma_cases FOR ALL TO authenticated USING(company_id IS NULL OR public.platform_is_device_manager(company_id)) WITH CHECK(company_id IS NULL OR public.platform_is_device_manager(company_id));
CREATE POLICY platform_edge_read ON public.platform_edge_profiles FOR SELECT TO authenticated USING(public.platform_is_reader(company_id));
CREATE POLICY platform_edge_admin ON public.platform_edge_profiles FOR ALL TO authenticated USING(public.platform_is_admin(company_id)) WITH CHECK(public.platform_is_admin(company_id));
CREATE POLICY platform_edge_states_read ON public.platform_edge_sync_states FOR SELECT TO authenticated USING(public.platform_is_reader(company_id));
CREATE POLICY platform_edge_states_service ON public.platform_edge_sync_states FOR ALL TO authenticated USING(public.platform_is_service(company_id)) WITH CHECK(public.platform_is_service(company_id));
CREATE POLICY platform_pilots_read ON public.platform_pilot_projects FOR SELECT TO authenticated USING(public.platform_is_reader(company_id));
CREATE POLICY platform_pilots_manager ON public.platform_pilot_projects FOR ALL TO authenticated USING(public.platform_is_device_manager(company_id)) WITH CHECK(public.platform_is_device_manager(company_id));
CREATE POLICY platform_pilot_install_read ON public.platform_pilot_installations FOR SELECT TO authenticated USING(public.platform_is_reader(company_id));
CREATE POLICY platform_pilot_install_manager ON public.platform_pilot_installations FOR ALL TO authenticated USING(public.platform_is_device_manager(company_id)) WITH CHECK(public.platform_is_device_manager(company_id));
CREATE POLICY platform_pilot_feedback_read ON public.platform_pilot_feedback FOR SELECT TO authenticated USING(public.platform_is_device_manager(company_id));
CREATE POLICY platform_pilot_feedback_insert ON public.platform_pilot_feedback FOR INSERT TO authenticated WITH CHECK(public.platform_is_reader(company_id) AND submitted_by=auth.uid());
CREATE POLICY platform_audit_admin_read ON public.platform_audit_logs FOR SELECT TO authenticated USING(company_id IS NULL OR public.platform_is_admin(company_id));

CREATE POLICY platform_models_global ON public.platform_device_models FOR ALL TO authenticated USING(public.platform_is_global_admin()) WITH CHECK(public.platform_is_global_admin());
CREATE POLICY platform_models_internal_read ON public.platform_device_models FOR SELECT TO authenticated USING(public.platform_is_global_reader());
CREATE POLICY platform_firmware_global ON public.platform_firmware_releases FOR ALL TO authenticated USING(public.platform_is_global_admin()) WITH CHECK(public.platform_is_global_admin());
CREATE POLICY platform_firmware_internal_read ON public.platform_firmware_releases FOR SELECT TO authenticated USING(public.platform_is_global_reader());
CREATE POLICY platform_mobile_releases_global ON public.platform_mobile_app_releases FOR ALL TO authenticated USING(public.platform_is_global_admin()) WITH CHECK(public.platform_is_global_admin());
CREATE POLICY platform_mobile_releases_internal_read ON public.platform_mobile_app_releases FOR SELECT TO authenticated USING(public.platform_is_global_reader());
CREATE POLICY platform_mobile_releases_authenticated_read ON public.platform_mobile_app_releases FOR SELECT TO authenticated USING(true);
CREATE POLICY platform_marketplace_global ON public.platform_marketplace_plugins FOR ALL TO authenticated USING(public.platform_is_global_admin()) WITH CHECK(public.platform_is_global_admin());
CREATE POLICY platform_marketplace_internal_read ON public.platform_marketplace_plugins FOR SELECT TO authenticated USING(public.platform_is_global_reader());
CREATE POLICY platform_plans_global ON public.platform_billing_plans FOR ALL TO authenticated USING(public.platform_is_global_admin()) WITH CHECK(public.platform_is_global_admin());
CREATE POLICY platform_plans_internal_read ON public.platform_billing_plans FOR SELECT TO authenticated USING(public.platform_is_global_reader());
CREATE POLICY platform_bom_global ON public.platform_bom_revisions FOR ALL TO authenticated USING(public.platform_is_global_admin()) WITH CHECK(public.platform_is_global_admin());
CREATE POLICY platform_bom_internal_read ON public.platform_bom_revisions FOR SELECT TO authenticated USING(public.platform_is_global_reader());
CREATE POLICY platform_pcb_global ON public.platform_pcb_revisions FOR ALL TO authenticated USING(public.platform_is_global_admin()) WITH CHECK(public.platform_is_global_admin());
CREATE POLICY platform_pcb_internal_read ON public.platform_pcb_revisions FOR SELECT TO authenticated USING(public.platform_is_global_reader());
CREATE POLICY platform_batches_global ON public.platform_manufacturing_batches FOR ALL TO authenticated USING(public.platform_is_global_admin()) WITH CHECK(public.platform_is_global_admin());
CREATE POLICY platform_batches_internal_read ON public.platform_manufacturing_batches FOR SELECT TO authenticated USING(public.platform_is_global_reader());
CREATE POLICY platform_units_global ON public.platform_manufactured_units FOR ALL TO authenticated USING(public.platform_is_global_admin()) WITH CHECK(public.platform_is_global_admin());
CREATE POLICY platform_units_internal_read ON public.platform_manufactured_units FOR SELECT TO authenticated USING(public.platform_is_global_reader());

CREATE TRIGGER platform_devices_guard BEFORE INSERT OR UPDATE ON public.platform_devices FOR EACH ROW EXECUTE FUNCTION public.platform_phase25_device_guard();
CREATE TRIGGER platform_configurations_guard BEFORE INSERT OR UPDATE ON public.platform_device_configurations FOR EACH ROW EXECUTE FUNCTION public.platform_phase25_configuration_guard();
CREATE TRIGGER platform_firmware_releases_guard BEFORE INSERT OR UPDATE ON public.platform_firmware_releases FOR EACH ROW EXECUTE FUNCTION public.platform_phase25_firmware_guard();
CREATE TRIGGER platform_firmware_rollouts_guard BEFORE INSERT OR UPDATE ON public.platform_firmware_rollouts FOR EACH ROW EXECUTE FUNCTION public.platform_phase25_firmware_guard();
CREATE TRIGGER platform_telemetry_guard BEFORE INSERT OR UPDATE ON public.platform_telemetry_events FOR EACH ROW EXECUTE FUNCTION public.platform_phase25_telemetry_guard();
CREATE TRIGGER platform_telemetry_event_publish AFTER INSERT OR UPDATE ON public.platform_telemetry_events FOR EACH ROW EXECUTE FUNCTION public.platform_phase25_publish_telemetry_event();
CREATE TRIGGER platform_twins_guard BEFORE INSERT OR UPDATE ON public.platform_digital_twins FOR EACH ROW EXECUTE FUNCTION public.platform_phase25_twin_guard();
CREATE TRIGGER platform_edge_guard BEFORE INSERT OR UPDATE ON public.platform_edge_profiles FOR EACH ROW EXECUTE FUNCTION public.platform_phase25_edge_guard();
DO $$ DECLARE table_name TEXT; BEGIN FOREACH table_name IN ARRAY ARRAY['platform_tenant_settings','platform_feature_licenses','platform_usage_meters','platform_devices','platform_device_credentials','platform_device_groups','platform_device_group_memberships','platform_firmware_rollouts','platform_device_configurations','platform_device_commands','platform_device_health_snapshots','platform_telemetry_events','platform_digital_twins','platform_twin_relationships','platform_twin_state_history','platform_mobile_installations','platform_mobile_sync_envelopes','platform_partner_applications','platform_partner_subscriptions','platform_plugin_installations','platform_subscriptions','platform_billing_statements','platform_rma_cases','platform_edge_profiles','platform_edge_sync_states','platform_pilot_projects','platform_pilot_installations','platform_pilot_feedback'] LOOP EXECUTE format('CREATE TRIGGER %I BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.platform_phase25_restricted_guard()',table_name||'_redaction',table_name); END LOOP; END $$;

CREATE OR REPLACE FUNCTION public.platform_start_device_provisioning(_company_id UUID,_device_id UUID,_certificate_reference TEXT,_identity_reference TEXT,_token_hash TEXT) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE credential_id UUID;
BEGIN
  IF NOT public.platform_is_device_manager(_company_id) THEN RAISE EXCEPTION 'Device provisioning requires platform device authority'; END IF;
  IF _certificate_reference !~ '^(vault|kms|keychain|external|secret-manager):' OR _identity_reference !~ '^(vault|kms|keychain|external|secret-manager):' OR length(_token_hash) < 16 THEN RAISE EXCEPTION 'Secure provisioning references and token hash are required'; END IF;
  INSERT INTO public.platform_device_credentials(company_id,device_id,credential_type,secret_reference,token_hash,status) VALUES(_company_id,_device_id,'provisioning_token',_certificate_reference,_token_hash,'issued') RETURNING id INTO credential_id;
  UPDATE public.platform_devices SET identity_public_key_reference=_identity_reference,certificate_reference=_certificate_reference,status='provisioning' WHERE id=_device_id AND company_id=_company_id AND status='inventory';
  IF NOT FOUND THEN RAISE EXCEPTION 'Inventory device not found or not eligible for provisioning'; END IF;
  RETURN credential_id;
END $$;
REVOKE ALL ON FUNCTION public.platform_start_device_provisioning(UUID,UUID,TEXT,TEXT,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.platform_start_device_provisioning(UUID,UUID,TEXT,TEXT,TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.platform_ingest_device_telemetry(_company_id UUID,_device_id UUID,_event_id UUID,_transport TEXT,_observed_at TIMESTAMPTZ,_sequence_number BIGINT,_schema_version INTEGER,_payload_redacted JSONB,_compression_type TEXT DEFAULT 'lightstream',_delta BOOLEAN DEFAULT false,_offline_buffered BOOLEAN DEFAULT false) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE telemetry_id UUID;
BEGIN
  IF NOT public.platform_is_service(_company_id) THEN RAISE EXCEPTION 'Device telemetry is accepted only through the controlled telemetry gateway service'; END IF;
  IF _transport NOT IN ('mqtt','https','websocket','binary','offline_sync') OR _compression_type NOT IN ('none','lightstream','gzip','delta') OR _schema_version < 1 OR _sequence_number < 0 THEN RAISE EXCEPTION 'Invalid telemetry transport, compression, schema, or sequence'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.platform_devices device WHERE device.id=_device_id AND device.company_id=_company_id AND device.status='active') THEN RAISE EXCEPTION 'Only active provisioned devices may send telemetry'; END IF;
  INSERT INTO public.platform_telemetry_events(company_id,device_id,event_id,transport,observed_at,sequence_number,schema_version,payload_redacted,compression_type,delta,offline_buffered,processing_state)
  VALUES(_company_id,_device_id,_event_id,_transport,_observed_at,_sequence_number,_schema_version,_payload_redacted,_compression_type,_delta,_offline_buffered,'accepted') RETURNING id INTO telemetry_id;
  UPDATE public.platform_devices SET last_seen_at=GREATEST(COALESCE(last_seen_at,_observed_at),_observed_at) WHERE id=_device_id AND company_id=_company_id;
  RETURN telemetry_id;
END $$;
REVOKE ALL ON FUNCTION public.platform_ingest_device_telemetry(UUID,UUID,UUID,TEXT,TIMESTAMPTZ,BIGINT,INTEGER,JSONB,TEXT,BOOLEAN,BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.platform_ingest_device_telemetry(UUID,UUID,UUID,TEXT,TIMESTAMPTZ,BIGINT,INTEGER,JSONB,TEXT,BOOLEAN,BOOLEAN) TO service_role;
