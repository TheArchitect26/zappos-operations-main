-- Phase 25: Zapp Platform Ecosystem. These records describe controlled platform capability;
-- operational fleet/warehouse/CRM data remains owned by its existing module.

CREATE TABLE public.platform_tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  tenant_status TEXT NOT NULL DEFAULT 'provisioning' CHECK(tenant_status IN ('provisioning','active','suspended','closed')),
  region_code TEXT NOT NULL DEFAULT 'za', data_residency_region TEXT NOT NULL DEFAULT 'za', branding_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(branding_metadata)='object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.platform_feature_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, feature_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disabled' CHECK(status IN ('trial','enabled','suspended','disabled')), starts_at TIMESTAMPTZ, expires_at TIMESTAMPTZ, limits_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(limits_metadata)='object'), approved_by UUID REFERENCES auth.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id,feature_code)
);
CREATE TABLE public.platform_usage_meters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, meter_code TEXT NOT NULL, period_start TIMESTAMPTZ NOT NULL, period_end TIMESTAMPTZ NOT NULL, quantity NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK(quantity >= 0), unit TEXT NOT NULL, source_reference TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), CHECK(period_start <= period_end), UNIQUE(company_id,meter_code,period_start,period_end)
);

CREATE TABLE public.platform_device_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), model_code TEXT NOT NULL UNIQUE, device_kind TEXT NOT NULL CHECK(device_kind IN ('zapp_box_p1','zapp_home','zapp_pocket','mesh_node','outdoor_cpe','industrial_gateway','vehicle_tracker','forklift','router','ups','solar_unit','warehouse_robot','sensor_gateway')),
  manufacturer TEXT NOT NULL, hardware_revision TEXT NOT NULL, capabilities JSONB NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(capabilities)='array'), status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','retired')), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.platform_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, device_model_id UUID NOT NULL REFERENCES public.platform_device_models(id) ON DELETE RESTRICT,
  serial_number TEXT NOT NULL, device_kind TEXT NOT NULL CHECK(device_kind IN ('zapp_box_p1','zapp_home','zapp_pocket','mesh_node','outdoor_cpe','industrial_gateway','vehicle_tracker','forklift','router','ups','solar_unit','warehouse_robot','sensor_gateway')),
  status TEXT NOT NULL DEFAULT 'inventory' CHECK(status IN ('inventory','provisioning','active','suspended','retired','rma')), identity_public_key_reference TEXT, certificate_reference TEXT, assigned_asset_type TEXT, assigned_asset_id UUID,
  installed_at TIMESTAMPTZ, activated_at TIMESTAMPTZ, last_seen_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id,serial_number), UNIQUE(company_id,id)
);
CREATE TABLE public.platform_device_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL, device_id UUID NOT NULL, credential_type TEXT NOT NULL CHECK(credential_type IN ('provisioning_token','certificate','mqtt_identity','api_identity')), secret_reference TEXT NOT NULL CHECK(secret_reference ~ '^(vault|kms|keychain|external|secret-manager):'), token_hash TEXT, status TEXT NOT NULL DEFAULT 'issued' CHECK(status IN ('issued','active','revoked','expired')), expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(company_id,device_id) REFERENCES public.platform_devices(company_id,id) ON DELETE CASCADE, UNIQUE(company_id,device_id,credential_type)
);
CREATE TABLE public.platform_device_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, name TEXT NOT NULL, purpose TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id,name), UNIQUE(company_id,id)
);
CREATE TABLE public.platform_device_group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL, group_id UUID NOT NULL, device_id UUID NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(company_id,group_id) REFERENCES public.platform_device_groups(company_id,id) ON DELETE CASCADE, FOREIGN KEY(company_id,device_id) REFERENCES public.platform_devices(company_id,id) ON DELETE CASCADE, UNIQUE(company_id,group_id,device_id)
);
CREATE TABLE public.platform_firmware_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), device_model_id UUID NOT NULL REFERENCES public.platform_device_models(id) ON DELETE RESTRICT, version TEXT NOT NULL, artifact_reference TEXT NOT NULL CHECK(artifact_reference ~ '^(storage|artifact|external):'), signature_reference TEXT NOT NULL CHECK(signature_reference ~ '^(vault|kms|keychain|external|secret-manager):'), release_notes_redacted TEXT, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','under_review','approved','retired')), owner_id UUID REFERENCES auth.users(id), reviewer_id UUID REFERENCES auth.users(id), approved_by UUID REFERENCES auth.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(device_model_id,version)
);
CREATE TABLE public.platform_firmware_rollouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, firmware_release_id UUID NOT NULL REFERENCES public.platform_firmware_releases(id) ON DELETE RESTRICT, target_group_id UUID REFERENCES public.platform_device_groups(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','scheduled','running','paused','completed','cancelled')), scheduled_at TIMESTAMPTZ, rollout_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(rollout_metadata)='object'), approved_by UUID REFERENCES auth.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id,id)
);
CREATE TABLE public.platform_device_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL, device_id UUID NOT NULL, version INTEGER NOT NULL CHECK(version > 0), configuration_redacted JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(configuration_redacted)='object'), status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','applied','failed','revoked')), approved_by UUID REFERENCES auth.users(id), applied_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), FOREIGN KEY(company_id,device_id) REFERENCES public.platform_devices(company_id,id) ON DELETE CASCADE, UNIQUE(company_id,device_id,version)
);
CREATE TABLE public.platform_device_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL, device_id UUID NOT NULL, command_type TEXT NOT NULL CHECK(command_type IN ('diagnostics','configuration_sync','firmware_check','health_check')), status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','queued','completed','failed','cancelled')), requested_by UUID REFERENCES auth.users(id), result_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(result_metadata)='object'), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), completed_at TIMESTAMPTZ, FOREIGN KEY(company_id,device_id) REFERENCES public.platform_devices(company_id,id) ON DELETE CASCADE
);
CREATE TABLE public.platform_device_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL, device_id UUID NOT NULL, observed_at TIMESTAMPTZ NOT NULL, health_state TEXT NOT NULL CHECK(health_state IN ('healthy','degraded','offline','unknown')), health_score NUMERIC(5,2) CHECK(health_score BETWEEN 0 AND 100), battery_percent NUMERIC(5,2) CHECK(battery_percent BETWEEN 0 AND 100), connectivity_percent NUMERIC(5,2) CHECK(connectivity_percent BETWEEN 0 AND 100), diagnostics_redacted JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(diagnostics_redacted)='object'), FOREIGN KEY(company_id,device_id) REFERENCES public.platform_devices(company_id,id) ON DELETE CASCADE, UNIQUE(company_id,device_id,observed_at)
);
CREATE TABLE public.platform_telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL, device_id UUID NOT NULL, event_id UUID NOT NULL, transport TEXT NOT NULL CHECK(transport IN ('mqtt','https','websocket','binary','offline_sync')), observed_at TIMESTAMPTZ NOT NULL, received_at TIMESTAMPTZ NOT NULL DEFAULT now(), sequence_number BIGINT NOT NULL CHECK(sequence_number >= 0), schema_version INTEGER NOT NULL CHECK(schema_version > 0), payload_redacted JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(payload_redacted)='object'), compression_type TEXT CHECK(compression_type IN ('none','lightstream','gzip','delta')), delta BOOLEAN NOT NULL DEFAULT false, offline_buffered BOOLEAN NOT NULL DEFAULT false, processing_state TEXT NOT NULL DEFAULT 'received' CHECK(processing_state IN ('received','accepted','rejected','correlated','dead_letter')), rejection_reason TEXT, FOREIGN KEY(company_id,device_id) REFERENCES public.platform_devices(company_id,id) ON DELETE CASCADE, UNIQUE(company_id,event_id), UNIQUE(company_id,device_id,sequence_number)
);

CREATE TABLE public.platform_digital_twins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, twin_type TEXT NOT NULL CHECK(twin_type IN ('vehicle','forklift','router','ups','solar_unit','warehouse_robot','sensor_gateway','connected_device')), asset_id UUID, device_id UUID, state_redacted JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(state_redacted)='object'), configuration_redacted JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(configuration_redacted)='object'), health_state TEXT NOT NULL DEFAULT 'unknown' CHECK(health_state IN ('healthy','degraded','offline','unknown')), firmware_version TEXT, last_telemetry_at TIMESTAMPTZ, predicted_maintenance_advisory JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(predicted_maintenance_advisory)='object'), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), FOREIGN KEY(company_id,device_id) REFERENCES public.platform_devices(company_id,id) ON DELETE SET NULL, UNIQUE(company_id,twin_type,asset_id), UNIQUE(company_id,id)
);
CREATE TABLE public.platform_twin_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL, from_twin_id UUID NOT NULL, to_twin_id UUID NOT NULL, relationship_type TEXT NOT NULL CHECK(relationship_type IN ('installed_on','powered_by','connected_to','located_at','controls','depends_on')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), FOREIGN KEY(company_id,from_twin_id) REFERENCES public.platform_digital_twins(company_id,id) ON DELETE CASCADE, FOREIGN KEY(company_id,to_twin_id) REFERENCES public.platform_digital_twins(company_id,id) ON DELETE CASCADE, CHECK(from_twin_id <> to_twin_id), UNIQUE(company_id,from_twin_id,to_twin_id,relationship_type)
);
CREATE TABLE public.platform_twin_state_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL, twin_id UUID NOT NULL, source_telemetry_id UUID, state_redacted JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(state_redacted)='object'), observed_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), FOREIGN KEY(company_id,twin_id) REFERENCES public.platform_digital_twins(company_id,id) ON DELETE CASCADE, FOREIGN KEY(company_id,source_telemetry_id) REFERENCES public.platform_telemetry_events(company_id,id) ON DELETE SET NULL
);

CREATE TABLE public.platform_mobile_app_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), app_code TEXT NOT NULL CHECK(app_code IN ('driver','dispatch','technician','warehouse','customer','executive')), platform TEXT NOT NULL CHECK(platform IN ('ios','android','pwa')), version TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','released','retired')), artifact_reference TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(app_code,platform,version)
);
CREATE TABLE public.platform_mobile_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES auth.users(id), app_release_id UUID REFERENCES public.platform_mobile_app_releases(id) ON DELETE SET NULL, installation_token_hash TEXT NOT NULL, device_platform TEXT NOT NULL CHECK(device_platform IN ('ios','android','web')), push_token_reference TEXT, offline_sync_state TEXT NOT NULL DEFAULT 'idle' CHECK(offline_sync_state IN ('idle','syncing','offline','failed')), last_sync_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id,user_id,installation_token_hash)
);
CREATE TABLE public.platform_mobile_sync_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL, installation_id UUID NOT NULL, direction TEXT NOT NULL CHECK(direction IN ('upload','download')), payload_hash TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','applied','rejected','failed')), conflict_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(conflict_metadata)='object'), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), FOREIGN KEY(company_id,installation_id) REFERENCES public.platform_mobile_installations(company_id,id) ON DELETE CASCADE
);

CREATE TABLE public.platform_partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, name TEXT NOT NULL, partner_name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','under_review','approved','suspended','retired')), oauth_client_reference TEXT, allowed_scopes JSONB NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(allowed_scopes)='array'), rate_limit_per_minute INTEGER NOT NULL DEFAULT 60 CHECK(rate_limit_per_minute > 0), owner_id UUID REFERENCES auth.users(id), approved_by UUID REFERENCES auth.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id,name)
);
CREATE TABLE public.platform_partner_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL, partner_application_id UUID NOT NULL, event_type TEXT NOT NULL, webhook_reference TEXT NOT NULL CHECK(webhook_reference ~ '^https://'), status TEXT NOT NULL DEFAULT 'enabled' CHECK(status IN ('enabled','disabled','failed')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), FOREIGN KEY(company_id,partner_application_id) REFERENCES public.platform_partner_applications(company_id,id) ON DELETE CASCADE, UNIQUE(company_id,partner_application_id,event_type,webhook_reference)
);
CREATE TABLE public.platform_marketplace_plugins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), plugin_code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, category TEXT NOT NULL CHECK(category IN ('fuel','insurance','mapping','fleet_hardware','mining','erp','analytics','other')), manifest_reference TEXT NOT NULL CHECK(manifest_reference ~ '^(storage|artifact|external):'), status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','published','retired')), publisher TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.platform_plugin_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, plugin_id UUID NOT NULL REFERENCES public.platform_marketplace_plugins(id) ON DELETE RESTRICT, status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','approved','enabled','disabled','removed')), configuration_redacted JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(configuration_redacted)='object'), approved_by UUID REFERENCES auth.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id,plugin_id)
);

CREATE TABLE public.platform_billing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), plan_code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','retired')), pricing_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(pricing_metadata)='object'), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.platform_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, billing_plan_id UUID NOT NULL REFERENCES public.platform_billing_plans(id) ON DELETE RESTRICT, status TEXT NOT NULL DEFAULT 'trial' CHECK(status IN ('trial','active','past_due','suspended','cancelled')), trial_ends_at TIMESTAMPTZ, started_at TIMESTAMPTZ NOT NULL DEFAULT now(), ended_at TIMESTAMPTZ, discount_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(discount_metadata)='object'), partner_revenue_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(partner_revenue_metadata)='object'), UNIQUE(company_id,billing_plan_id)
);
CREATE TABLE public.platform_billing_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, subscription_id UUID NOT NULL REFERENCES public.platform_subscriptions(id) ON DELETE RESTRICT, period_start TIMESTAMPTZ NOT NULL, period_end TIMESTAMPTZ NOT NULL, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending_review','issued','void','unavailable')), external_invoice_reference TEXT, line_metadata JSONB NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(line_metadata)='array'), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), CHECK(period_start <= period_end), UNIQUE(company_id,subscription_id,period_start,period_end)
);

CREATE TABLE public.platform_bom_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_code TEXT NOT NULL, revision TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','retired')), components_redacted JSONB NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(components_redacted)='array'), approved_by UUID REFERENCES auth.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(product_code,revision)
);
CREATE TABLE public.platform_pcb_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_code TEXT NOT NULL, revision TEXT NOT NULL, design_reference TEXT NOT NULL CHECK(design_reference ~ '^(storage|artifact|external):'), status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','retired')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(product_code,revision)
);
CREATE TABLE public.platform_manufacturing_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), batch_code TEXT NOT NULL UNIQUE, product_code TEXT NOT NULL, bom_revision_id UUID REFERENCES public.platform_bom_revisions(id) ON DELETE RESTRICT, pcb_revision_id UUID REFERENCES public.platform_pcb_revisions(id) ON DELETE RESTRICT, status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','in_progress','qa_hold','released','cancelled')), quantity_planned INTEGER NOT NULL CHECK(quantity_planned > 0), quantity_passed INTEGER NOT NULL DEFAULT 0 CHECK(quantity_passed >= 0), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.platform_manufactured_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), manufacturing_batch_id UUID NOT NULL REFERENCES public.platform_manufacturing_batches(id) ON DELETE RESTRICT, serial_number TEXT NOT NULL UNIQUE, qa_status TEXT NOT NULL DEFAULT 'pending' CHECK(qa_status IN ('pending','passed','failed','rework')), warranty_expires_at TIMESTAMPTZ, device_id UUID REFERENCES public.platform_devices(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.platform_rma_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL, manufactured_unit_id UUID NOT NULL REFERENCES public.platform_manufactured_units(id) ON DELETE RESTRICT, status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','approved','received','repaired','replaced','rejected','closed')), reason_redacted TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.platform_edge_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, device_model_id UUID REFERENCES public.platform_device_models(id) ON DELETE SET NULL, profile_name TEXT NOT NULL, local_rules_redacted JSONB NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(local_rules_redacted)='array'), compression_policy TEXT NOT NULL DEFAULT 'lightstream' CHECK(compression_policy IN ('lightstream','gzip','none')), status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','deployed','retired')), approved_by UUID REFERENCES auth.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id,profile_name)
);
CREATE TABLE public.platform_edge_sync_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL, device_id UUID NOT NULL, edge_profile_id UUID REFERENCES public.platform_edge_profiles(id) ON DELETE SET NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','synchronised','offline_buffering','failed')), last_sync_at TIMESTAMPTZ, buffered_event_count BIGINT NOT NULL DEFAULT 0 CHECK(buffered_event_count >= 0), cached_recommendations_redacted JSONB NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(cached_recommendations_redacted)='array'), FOREIGN KEY(company_id,device_id) REFERENCES public.platform_devices(company_id,id) ON DELETE CASCADE, UNIQUE(company_id,device_id)
);

CREATE TABLE public.platform_pilot_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'onboarding' CHECK(status IN ('onboarding','installation','acceptance','active','paused','completed','cancelled')), customer_onboarding_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(customer_onboarding_metadata)='object'), success_metrics JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(success_metrics)='object'), owner_id UUID REFERENCES auth.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id,name)
);
CREATE TABLE public.platform_pilot_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL, pilot_project_id UUID NOT NULL, device_id UUID NOT NULL, technician_id UUID REFERENCES auth.users(id), status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','installed','accepted','failed','removed')), acceptance_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(acceptance_metadata)='object'), installed_at TIMESTAMPTZ, accepted_at TIMESTAMPTZ, FOREIGN KEY(company_id,pilot_project_id) REFERENCES public.platform_pilot_projects(company_id,id) ON DELETE CASCADE, FOREIGN KEY(company_id,device_id) REFERENCES public.platform_devices(company_id,id) ON DELETE RESTRICT, UNIQUE(company_id,pilot_project_id,device_id)
);
CREATE TABLE public.platform_pilot_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL, pilot_project_id UUID NOT NULL, submitted_by UUID REFERENCES auth.users(id), feedback_type TEXT NOT NULL CHECK(feedback_type IN ('product','installation','support','success_metric')), sentiment TEXT NOT NULL CHECK(sentiment IN ('positive','neutral','negative')), note_redacted TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), FOREIGN KEY(company_id,pilot_project_id) REFERENCES public.platform_pilot_projects(company_id,id) ON DELETE CASCADE
);
CREATE TABLE public.platform_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, entity_type TEXT NOT NULL, entity_id UUID NOT NULL, event_type TEXT NOT NULL, actor_id UUID REFERENCES auth.users(id), metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(metadata)='object'), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX platform_device_company_status_idx ON public.platform_devices(company_id,status,last_seen_at DESC);
CREATE INDEX platform_telemetry_device_observed_idx ON public.platform_telemetry_events(company_id,device_id,observed_at DESC);
CREATE INDEX platform_twin_company_health_idx ON public.platform_digital_twins(company_id,health_state,updated_at DESC);
CREATE INDEX platform_health_device_observed_idx ON public.platform_device_health_snapshots(company_id,device_id,observed_at DESC);
