/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { dbInstance } from './supabase-client';
import { UserRole } from '../zapp-production/types';

/**
 * Seeds our virtual PostgreSQL instance with isolated, multi-tenant records
 * depending on the environment profile.
 */
export function seedAllDatabase(envName = 'demo') {
  dbInstance.clearAll();

  const now = new Date();
  const getPastISO = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60 * 1000).toISOString();

  console.log(`[SEED SERVICE] Initializing virtual PostgreSQL seed tables for environment: "${envName.toUpperCase()}"`);

  // ---------------------------------------------------------------------------
  // 1. COMPANIES (TENANTS)
  // ---------------------------------------------------------------------------
  dbInstance.tables.companies = [
    { company_id: 'co_nairobi_freight', name: 'Nairobi Freight Logistics', tier: 'enterprise', is_active: true },
    { company_id: 'co_zapp_sa', name: 'SA Logistics Hub', tier: 'commercial', is_active: true },
    { company_id: 'co_zapp_intl', name: 'Zapp International Shipping', tier: 'enterprise', is_active: true },
    { company_id: 'co_zapp_east', name: 'East Coast Freight', tier: 'pilot', is_active: true }
  ];

  // ---------------------------------------------------------------------------
  // 2. USER PROFILES
  // ---------------------------------------------------------------------------
  dbInstance.tables.user_profiles = [
    { user_id: 'user-01', email: 'msarhsig@gmail.com', name: 'Zapp Lead Admin', avatar_url: null, is_active: true },
    { user_id: 'user-02', email: 'dispatcher@nairobi.co', name: 'Nairobi Operations Lead', avatar_url: null, is_active: true },
    { user_id: 'user-03', email: 'tech@sa.hub', name: 'Johannesburg Hardware Tech', avatar_url: null, is_active: true },
    { user_id: 'user-04', email: 'auditor@intl.com', name: 'Global Compliance Auditor', avatar_url: null, is_active: true },
    { user_id: 'user-05', email: 'viewer@demo.com', name: 'Stakeholder Spectator', avatar_url: null, is_active: true }
  ];

  // ---------------------------------------------------------------------------
  // 3. COMPANY MEMBERSHIPS (TENANT MEMBERSHIPS)
  // ---------------------------------------------------------------------------
  dbInstance.tables.company_memberships = [
    // Lead Admin belongs to all
    { membership_id: 'm-1', company_id: 'co_nairobi_freight', user_id: 'user-01', status: 'active' },
    { membership_id: 'm-2', company_id: 'co_zapp_sa', user_id: 'user-01', status: 'active' },
    { membership_id: 'm-3', company_id: 'co_zapp_intl', user_id: 'user-01', status: 'active' },
    { membership_id: 'm-4', company_id: 'co_zapp_east', user_id: 'user-01', status: 'active' },
    
    // Scoped Members
    { membership_id: 'm-5', company_id: 'co_nairobi_freight', user_id: 'user-02', status: 'active' },
    { membership_id: 'm-6', company_id: 'co_zapp_sa', user_id: 'user-03', status: 'active' },
    { membership_id: 'm-7', company_id: 'co_zapp_intl', user_id: 'user-04', status: 'active' },
    { membership_id: 'm-8', company_id: 'co_zapp_east', user_id: 'user-05', status: 'active' }
  ];

  // ---------------------------------------------------------------------------
  // 4. ROLE ASSIGNMENTS
  // ---------------------------------------------------------------------------
  dbInstance.tables.role_assignments = [
    { role_assignment_id: 'ra-1', company_id: 'co_nairobi_freight', user_id: 'user-01', role: 'owner', assigned_by: 'system', assigned_at: getPastISO(500), revoked_at: null },
    { role_assignment_id: 'ra-2', company_id: 'co_zapp_sa', user_id: 'user-01', role: 'owner', assigned_by: 'system', assigned_at: getPastISO(500), revoked_at: null },
    { role_assignment_id: 'ra-3', company_id: 'co_zapp_intl', user_id: 'user-01', role: 'owner', assigned_by: 'system', assigned_at: getPastISO(500), revoked_at: null },
    { role_assignment_id: 'ra-4', company_id: 'co_zapp_east', user_id: 'user-01', role: 'owner', assigned_by: 'system', assigned_at: getPastISO(500), revoked_at: null },

    { role_assignment_id: 'ra-5', company_id: 'co_nairobi_freight', user_id: 'user-02', role: 'dispatcher', assigned_by: 'user-01', assigned_at: getPastISO(400), revoked_at: null },
    { role_assignment_id: 'ra-6', company_id: 'co_zapp_sa', user_id: 'user-03', role: 'technician', assigned_by: 'user-01', assigned_at: getPastISO(400), revoked_at: null },
    { role_assignment_id: 'ra-7', company_id: 'co_zapp_intl', user_id: 'user-04', role: 'auditor', assigned_by: 'user-01', assigned_at: getPastISO(400), revoked_at: null },
    { role_assignment_id: 'ra-8', company_id: 'co_zapp_east', user_id: 'user-05', role: 'viewer', assigned_by: 'user-01', assigned_at: getPastISO(400), revoked_at: null }
  ];

  // ---------------------------------------------------------------------------
  // 5. AUDIT LOGS
  // ---------------------------------------------------------------------------
  dbInstance.tables.audit_logs = [
    { audit_id: 'a-1', company_id: 'co_nairobi_freight', actor_id: 'user-01', actor_role: 'owner', action: 'login_placeholder', target_type: 'System', target_id: null, reason: 'Nairobi Freight Admin system login', created_at: getPastISO(180) },
    { audit_id: 'a-2', company_id: 'co_nairobi_freight', actor_id: 'user-02', actor_role: 'dispatcher', action: 'job_note_attached', target_type: 'Job', target_id: 'jb_101', reason: 'Attached route notes regarding road construction delay.', created_at: getPastISO(10) }
  ];

  // ---------------------------------------------------------------------------
  // 6. VEHICLES (TENANT ISOLATED)
  // ---------------------------------------------------------------------------
  dbInstance.tables.vehicles = [
    // Nairobi Freight
    { vehicle_id: 'vh_nairobi_1', company_id: 'co_nairobi_freight', plate_number: 'KBH 912K', make: 'Scania', model: 'R500 Highline', year: 2022, odometer: 124500.0, status: 'active', current_faults: [] },
    { vehicle_id: 'vh_nairobi_2', company_id: 'co_nairobi_freight', plate_number: 'KCD 445L', make: 'Mercedes-Benz', model: 'Actros 2645', year: 2023, odometer: 84000.0, status: 'active', current_faults: ['SPN-102 FMI-3 Boost Pressure Fault'] },
    { vehicle_id: 'vh_nairobi_3', company_id: 'co_nairobi_freight', plate_number: 'KBX 220X', make: 'Volvo', model: 'FH16 750', year: 2021, odometer: 198000.0, status: 'maintenance', current_faults: ['SPN-641 FMI-12 VGT Controller failure'] },
    
    // SA Hub
    { vehicle_id: 'vh_sa_1', company_id: 'co_zapp_sa', plate_number: 'GP 456 ZW', make: 'Isuzu', model: 'FTR 850', year: 2021, odometer: 215000.0, status: 'active', current_faults: [] },
    { vehicle_id: 'vh_sa_2', company_id: 'co_zapp_sa', plate_number: 'CA 112-901', make: 'Fuso', model: 'Canter 715', year: 2023, odometer: 42000.0, status: 'active', current_faults: [] }
  ];

  // ---------------------------------------------------------------------------
  // 7. DRIVERS
  // ---------------------------------------------------------------------------
  dbInstance.tables.drivers = [
    { driver_id: 'dr_nairobi_1', company_id: 'co_nairobi_freight', name: 'John Kamau', phone: '+254711223344', license_number: 'DL-KEN-88912', license_expiry: '2029-04-12', status: 'active' },
    { driver_id: 'dr_nairobi_2', company_id: 'co_nairobi_freight', name: 'Fatuma Juma', phone: '+254722556677', license_number: 'DL-KEN-44012', license_expiry: '2028-11-20', status: 'active' },
    { driver_id: 'dr_sa_1', company_id: 'co_zapp_sa', name: 'Sipho Ndlovu', phone: '+27821112222', license_number: 'DL-ZAF-99120', license_expiry: '2027-06-15', status: 'active' }
  ];

  // ---------------------------------------------------------------------------
  // 8. CUSTOMERS
  // ---------------------------------------------------------------------------
  dbInstance.tables.customers = [
    { customer_id: 'cu_nairobi_tea', company_id: 'co_nairobi_freight', name: 'Mombasa Tea Auctions Ltd', contact_email: 'logistics@mombasatea.co', address: 'Mombasa Shimanzi Yard Road, Kenya', latitude: -4.0531, longitude: 39.6644 },
    { customer_id: 'cu_sa_grain', company_id: 'co_zapp_sa', name: 'Randburg Maize Millers', contact_email: 'delivery@randmaize.co.za', address: '12 Hans Strijdom Dr, Johannesburg', latitude: -26.0911, longitude: 27.9712 }
  ];

  // ---------------------------------------------------------------------------
  // 9. DEPOTS
  // ---------------------------------------------------------------------------
  dbInstance.tables.depots = [
    { depot_id: 'dep_nairobi_main', company_id: 'co_nairobi_freight', name: 'Nairobi Embakasi Gateway Depot', address: 'Outering Road, Embakasi, Nairobi' },
    { depot_id: 'dep_sa_main', company_id: 'co_zapp_sa', name: 'Midrand Central Terminal', address: '16 Richards Dr, Midrand' }
  ];

  // ---------------------------------------------------------------------------
  // 10. TERMINALS
  // ---------------------------------------------------------------------------
  dbInstance.tables.terminals = [
    { terminal_id: 't_nairobi_cargo', company_id: 'co_nairobi_freight', name: 'Terminal A - Bulk Loading Bay', depot_id: 'dep_nairobi_main' }
  ];

  // ---------------------------------------------------------------------------
  // 11. ROUTES
  // ---------------------------------------------------------------------------
  dbInstance.tables.routes = [
    { route_id: 'rt_nairobi_mombasa', company_id: 'co_nairobi_freight', start_point: 'Nairobi Depot', end_point: 'Mombasa Tea Auctions', distance_km: 485.5, estimated_duration_minutes: 480 }
  ];

  // ---------------------------------------------------------------------------
  // 12. JOBS (TRIPS)
  // ---------------------------------------------------------------------------
  dbInstance.tables.jobs = [
    { job_id: 'jb_nairobi_101', company_id: 'co_nairobi_freight', vehicle_id: 'vh_nairobi_1', driver_id: 'dr_nairobi_1', customer_id: 'cu_nairobi_tea', route_id: 'rt_nairobi_mombasa', start_time: getPastISO(240), end_time: null, scheduled_eta: getPastISO(-180), current_stage: 'En Route', status: 'active' },
    { job_id: 'jb_nairobi_102', company_id: 'co_nairobi_freight', vehicle_id: 'vh_nairobi_2', driver_id: 'dr_nairobi_2', customer_id: 'cu_nairobi_tea', route_id: 'rt_nairobi_mombasa', start_time: null, end_time: null, scheduled_eta: getPastISO(-400), current_stage: 'Scheduled', status: 'active' }
  ];

  // ---------------------------------------------------------------------------
  // 13. JOB NOTES
  // ---------------------------------------------------------------------------
  dbInstance.tables.dispatcher_notes = [
    { note_id: 'n-1', job_id: 'jb_nairobi_101', company_id: 'co_nairobi_freight', dispatcher_id: 'user-02', note_text: 'Driver reported heavy traffic jam on Mombasa Road near Athi River.', created_at: getPastISO(60) }
  ];

  // ---------------------------------------------------------------------------
  // 14. DEVICES (HARDWARE)
  // ---------------------------------------------------------------------------
  dbInstance.tables.devices = [
    { device_id: 'dev_scania_g10', company_id: 'co_nairobi_freight', imei: '861022904556121', model: 'Zapp-X1 Gateway PRO', firmware_version: 'v4.15-PRO', status: 'active' },
    { device_id: 'dev_actros_g11', company_id: 'co_nairobi_freight', imei: '861022904556133', model: 'Zapp-X1 Gateway PRO', firmware_version: 'v4.12-STD', status: 'active' },
    { device_id: 'dev_volvo_g12', company_id: 'co_nairobi_freight', imei: '861022904556149', model: 'Zapp-X1 Gateway PRO', firmware_version: 'v4.15-PRO', status: 'active' },
    { device_id: 'dev_sa_g20', company_id: 'co_zapp_sa', imei: '861022904556999', model: 'Zapp-X1 Gateway PRO', firmware_version: 'v4.15-PRO', status: 'active' }
  ];

  // ---------------------------------------------------------------------------
  // 15. SIMS
  // ---------------------------------------------------------------------------
  dbInstance.tables.sims = [
    { sim_id: 'sim_safaricom_1', company_id: 'co_nairobi_freight', iccid: '892540101122334455F', phone_number: '+254701222333', carrier: 'Safaricom Ltd', status: 'active' },
    { sim_id: 'sim_mtn_za_1', company_id: 'co_zapp_sa', iccid: '892701011223344559F', phone_number: '+27835554444', carrier: 'MTN South Africa', status: 'active' }
  ];

  // ---------------------------------------------------------------------------
  // 16. DEVICE ASSIGNMENTS
  // ---------------------------------------------------------------------------
  dbInstance.tables.device_assignments = [
    { assignment_id: 'da-1', device_id: 'dev_scania_g10', sim_id: 'sim_safaricom_1', vehicle_id: 'vh_nairobi_1', company_id: 'co_nairobi_freight', assigned_by: 'user-01', assigned_at: getPastISO(500), unassigned_at: null }
  ];

  // ---------------------------------------------------------------------------
  // 17. TELEMETRY EVENTS
  // ---------------------------------------------------------------------------
  dbInstance.tables.telemetry_events = [
    { telemetry_id: 't-ev-1', device_id: 'dev_scania_g10', company_id: 'co_nairobi_freight', vehicle_id: 'vh_nairobi_1', latitude: -1.2921, longitude: 36.8219, speed_kmh: 74.5, odometer_km: 124500.5, battery_level_pct: 98, signal_strength_dbm: -78, sim_status: 'CONNECTED', ignition_on: true, spn_faults: [], timestamp: getPastISO(5) },
    { telemetry_id: 't-ev-2', device_id: 'dev_scania_g10', company_id: 'co_nairobi_freight', vehicle_id: 'vh_nairobi_1', latitude: -1.3033, longitude: 36.8402, speed_kmh: 0.0, odometer_km: 124500.5, battery_level_pct: 98, signal_strength_dbm: -80, sim_status: 'CONNECTED', ignition_on: true, spn_faults: [], timestamp: getPastISO(15) }
  ];

  // ---------------------------------------------------------------------------
  // 18. TELEMETRY QUALITY REPORTS
  // ---------------------------------------------------------------------------
  dbInstance.tables.telemetry_quality_reports = [
    { report_id: 'qr-1', company_id: 'co_nairobi_freight', device_id: 'dev_scania_g10', total_packets_received: 1420, packet_loss_rate_pct: 0.12, boot_loop_count: 0, sim_dropouts_count: 1, grade: 'A+' }
  ];

  // ---------------------------------------------------------------------------
  // 19. DEVICE HEALTH REPORTS
  // ---------------------------------------------------------------------------
  dbInstance.tables.device_health_reports = [
    { report_id: 'hr-1', device_id: 'dev_scania_g10', company_id: 'co_nairobi_freight', battery_health: 'Nominal', signal_health: 'Excellent', diagnostics_status: 'PASSED', recommended_action: null }
  ];

  // ---------------------------------------------------------------------------
  // 20. ZAPP BRAIN INSIGHTS (TENANT ISOLATED)
  // ---------------------------------------------------------------------------
  dbInstance.tables.zapp_brain_insights = [
    {
      insight_id: 'ins_nairobi_1',
      company_id: 'co_nairobi_freight',
      run_id: 'run_diagnose_88',
      category: 'telemetry_coverage',
      title: 'Repeated Sim Dropout Warnings',
      explanation: 'Vehicle Mercedes-Benz (KCD 445L) logged 12 network dropouts across the Tsavo-Voi road segment during peak cargo hours.',
      recommendation: 'Schedule a tech hardware terminal check to verify wire fitting & swap dual-network SIM roaming profiles.',
      severity: 'high',
      confidence: '94% Confidence',
      confidence_score: 94,
      status: 'new',
      fingerprint: 'fp_sim_dropout_mercedes',
      evidence: { dropouts_count: 12, coordinate: [-3.398, 38.556] },
      affected_entities: [{ type: 'vehicle', id: 'vh_nairobi_2', name: 'Mercedes-Benz (KCD 445L)' }]
    },
    {
      insight_id: 'ins_nairobi_2',
      company_id: 'co_nairobi_freight',
      run_id: 'run_diagnose_88',
      category: 'late_job_start',
      title: 'Critical Late Departure Risk',
      explanation: 'Job #jb_nairobi_102 scheduled to depart Mombasa for Nairobi is currently late by 4 hours. Vehicle remains ignition:OFF in depot.',
      recommendation: 'Dispatcher supervisor check required. Verify driver assignment state and coordinate shift schedule.',
      severity: 'critical',
      confidence: '99% Confidence',
      confidence_score: 99,
      status: 'new',
      fingerprint: 'fp_late_depart_102',
      evidence: { delay_minutes: 240, stage: 'Scheduled' },
      affected_entities: [{ type: 'job', id: 'jb_nairobi_102', name: 'Job #jb_nairobi_102' }]
    }
  ];

  // ---------------------------------------------------------------------------
  // 21. ZAPP BRAIN RULES CONFIG
  // ---------------------------------------------------------------------------
  dbInstance.tables.zapp_brain_rule_config = [
    { rule_id: 'late_job_start', company_id: 'co_nairobi_freight', rule_name: 'Late Job Start Warning', category: 'performance', threshold_value: 30.0, enabled: true },
    { rule_id: 'excessive_stationary_duration', company_id: 'co_nairobi_freight', rule_name: 'Excessive Stationary Duration', category: 'efficiency', threshold_value: 120.0, enabled: true },
    { rule_id: 'telemetry_signal_drop', company_id: 'co_nairobi_freight', rule_name: 'Telemetry Coverage Drop', category: 'safety', threshold_value: 5.0, enabled: true }
  ];

  // ---------------------------------------------------------------------------
  // 22. CALIBRATION SUGGESTIONS
  // ---------------------------------------------------------------------------
  dbInstance.tables.zapp_brain_calibration_suggestions = [
    { suggestion_id: 'cs-1', rule_id: 'telemetry_signal_drop', company_id: 'co_nairobi_freight', current_value: 5.0, suggested_value: 12.0, rationale: 'Voi-Mombasa corridor suffers from high standard mountain signal attenuation. Increasing threshold prevents false alarms.', impact: 'Reduces signal dropout false-positives by 34%', is_applied: false }
  ];

  // ---------------------------------------------------------------------------
  // 23. OPERATIONAL CASES & MANUAL APPROVAL ACTION QUEUES
  // ---------------------------------------------------------------------------
  dbInstance.tables.operational_cases = [
    { case_id: 'case_nairobi_2001', company_id: 'co_nairobi_freight', title: 'Volvo VGT Controller Failure', description: 'Odometer 198,000km Volvo truck FH16 triggered critical turbo boost fault SPN-641 FMI-12.', severity: 'high', status: 'open' }
  ];

  dbInstance.tables.manual_action_queue = [
    { action_id: 'act-na-101', company_id: 'co_nairobi_freight', case_id: 'case_nairobi_2001', action_type: 'Schedule Maintenance', payload: { vehicle_id: 'vh_nairobi_3', technician: 'Nairobi Truck Care', date: '2026-07-15' }, status: 'pending_approval', approved_by: null, approved_at: null }
  ];

  // ---------------------------------------------------------------------------
  // 24. MAINTENANCE TICKETS
  // ---------------------------------------------------------------------------
  dbInstance.tables.maintenance_tickets = [
    { ticket_id: 'tkt_nairobi_500', company_id: 'co_nairobi_freight', vehicle_id: 'vh_nairobi_3', description: 'Volvo FH16 Variable Geometry Turbocharger Repair', severity: 'high', status: 'scheduled', cost_estimate: 2450.00, scheduled_date: '2026-07-15' }
  ];

  // ---------------------------------------------------------------------------
  // 25. COMPLIANCE TASKS
  // ---------------------------------------------------------------------------
  dbInstance.tables.compliance_tasks = [
    { task_id: 'cmp_nairobi_311', company_id: 'co_nairobi_freight', entity_type: 'driver', entity_id: 'dr_nairobi_2', requirement_name: 'Kenya Heavy Carrier License Renewal', due_date: '2028-11-20', status: 'pending' }
  ];

  // ---------------------------------------------------------------------------
  // 26. FITMENT JOBS (INSTALLS)
  // ---------------------------------------------------------------------------
  dbInstance.tables.fitment_jobs = [
    { fitment_id: 'fit_nairobi_901', company_id: 'co_nairobi_freight', vehicle_id: 'vh_nairobi_2', device_id: 'dev_actros_g11', technician_name: 'Cyrus Mwangi', current_stage: 'Wiring & Ignition Verification', status: 'pending' }
  ];

  dbInstance.tables.fitment_checklists = [
    { checklist_id: 'chk-1', fitment_id: 'fit_nairobi_901', company_id: 'co_nairobi_freight', pre_install_ok: true, wiring_ok: true, mount_ok: true, ignition_test_ok: true, power_test_ok: true, gps_test_ok: false, gsm_test_ok: false, panic_test_ok: false, port_test_ok: false }
  ];

  // ---------------------------------------------------------------------------
  // 27. PILOT AND COMMERCIAL ASSUMPTIONS
  // ---------------------------------------------------------------------------
  dbInstance.tables.pilot_fleets = [
    { pilot_fleet_id: 'pf_nairobi_lead', company_id: 'co_nairobi_freight', fleet_size: 15, active_devices_count: 3, onboarding_completed_pct: 20.0 }
  ];

  dbInstance.tables.pilot_reports = [
    { report_id: 'rep_nairobi_pil', pilot_fleet_id: 'pf_nairobi_lead', company_id: 'co_nairobi_freight', author_name: 'Cyrus Mwangi', summary: 'Nairobi Freight completed phase 1 hardware testing on 3 long-haul vehicles with outstanding data consistency.', grade: 'A', is_ready_for_commercial: true }
  ];

  dbInstance.tables.commercial_roi_assumptions = [
    { company_id: 'co_nairobi_freight', monthly_subscription_cost: 45.00, est_fuel_savings_pct: 14.50, est_theft_reduction_pct: 55.0, est_accident_reduction_pct: 30.0 }
  ];

  dbInstance.tables.commercial_proposals = [
    { proposal_id: 'prp_nairobi_commercial_1', company_id: 'co_nairobi_freight', quoted_price_per_device: 39.50, estimated_monthly_value: 1240.00, status: 'draft' }
  ];

  dbInstance.tables.commercial_onboarding_profiles = [
    { company_id: 'co_nairobi_freight', onboarding_stage: 'Pricing Proposal Approval', legal_signed: false, billing_configured: false }
  ];

  // ---------------------------------------------------------------------------
  // 28. INTEGRATION CONNECTORS
  // ---------------------------------------------------------------------------
  dbInstance.tables.integration_connectors = [
    { connector_id: 'conn_nairobi_sap', company_id: 'co_nairobi_freight', connector_type: 'SAP Logistics Proxy', name: 'Nairobi Enterprise SAP ERP Gateway', auth_config: { endpoint: 'https://sap.nairobi.co/api/v1' }, status: 'active' },
    { connector_id: 'conn_nairobi_onedrive', company_id: 'co_nairobi_freight', connector_type: 'OneDrive File Sync', name: 'OneDrive Staging Sync Folder', auth_config: { folder: '/ZappOS/StagingTemplates' }, status: 'inactive' }
  ];

  dbInstance.tables.integration_sync_runs = [
    { sync_id: 'sr-1', connector_id: 'conn_nairobi_sap', company_id: 'co_nairobi_freight', records_synced_count: 42, status: 'success', error_message: null }
  ];

  dbInstance.tables.webhook_events = [
    { webhook_id: 'wh-1', company_id: 'co_nairobi_freight', source_provider: 'Nairobi Gate GPS Gateway', payload: { device_id: 'dev_scania_g10', lat: -1.29, lon: 36.8 }, validation_status: 'valid', rejection_reason: null }
  ];

  dbInstance.tables.import_file_registry = [
    { file_id: 'f-reg-1', company_id: 'co_nairobi_freight', filename: 'driver_onboarding_template_july.csv', file_size_bytes: 4204, status: 'imported', uploaded_by: 'user-02' }
  ];

  console.log(`[SEED SERVICE] Seeding completed. Loaded total ${dbInstance.tables.vehicles.length} vehicles, ${dbInstance.tables.user_profiles.length} users, ${dbInstance.tables.zapp_brain_insights.length} insights.`);
}
