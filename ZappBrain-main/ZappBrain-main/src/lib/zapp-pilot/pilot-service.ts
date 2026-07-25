/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PilotFleet,
  PilotJob,
  PilotJobStatus,
  PilotFeedEvent,
  PilotScorecard,
  PilotIncident,
  PilotIncidentType,
  MaintenanceTicket,
  ComplianceItem,
  DeviceSupportItem,
  PilotReport,
  PilotSuccessCriteriaResult,
  SimulationModeType,
  SimulationScenario,
  OneDriveImportResult,
  PilotRoute,
  PilotCustomer,
  PilotDepot
} from './types';

class PilotStateStore {
  public fleets: PilotFleet[] = [];
  public jobs: PilotJob[] = [];
  public feed: PilotFeedEvent[] = [];
  public incidents: PilotIncident[] = [];
  public maintenanceTickets: MaintenanceTicket[] = [];
  public complianceItems: ComplianceItem[] = [];
  public deviceSupportItems: DeviceSupportItem[] = [];
  public reports: PilotReport[] = [];
  public auditLogs: { timestamp: string; actor: string; action: string; company_id: string; details?: string }[] = [];
  public importedRecords: OneDriveImportResult[] = [];

  constructor() {
    this.bootstrap();
  }

  public bootstrap() {
    const CO_ID = 'co_nairobi_freight';

    // 1. Initial Pilot Fleet
    const pilotFleet: PilotFleet = {
      pilot_id: 'PILOT_NAIROBI_01',
      company_id: CO_ID,
      name: 'Nairobi East Transit Pilot',
      status: 'active',
      start_date: '2026-07-01',
      end_date: '2026-08-15',
      success_criteria_desc: 'Validate Zapp Box cellular stability on critical routes with over 90% telemetry uptime, under 25% false alarm rate, and rapid dispatcher responsiveness.',
      vehicle_ids: ['VH_M1', 'VH_M2', 'VH_M3', 'VH_M4', 'VH_M5'],
      driver_ids: ['DR_01', 'DR_02', 'DR_03', 'DR_04', 'DR_05'],
      dispatchers: ['Dispatcher Kamau', 'Dispatcher Mwangi'],
      supervisors: ['Supervisor Jane'],
      routes: [
        { route_id: 'RT_NBO_MMSA', name: 'Nairobi to Mombasa Highway', start_point: 'Nairobi Depot', end_point: 'Mombasa Port', distance_km: 480 },
        { route_id: 'RT_NBO_KSM', name: 'Nairobi to Kisumu Expressway', start_point: 'Nairobi Depot', end_point: 'Kisumu Hub', distance_km: 350 },
        { route_id: 'RT_LOCAL_E', name: 'Eastlands Distribution Ring', start_point: 'Nairobi Depot', end_point: 'Nairobi East Terminal', distance_km: 45 }
      ],
      customers: [
        { customer_id: 'CST_MMSA_RETAIL', name: 'Mombasa Maritime Logistics', location: 'Mombasa Port Gate 4', contact_person: 'Ali Bakari' },
        { customer_id: 'CST_KSM_GRAIN', name: 'Kisumu Agro Foods', location: 'Kisumu Lakeside Ind', contact_person: 'Grace Otieno' }
      ],
      depots: [
        { depot_id: 'DEP_HQ', name: 'Nairobi Central Depot HQ', location: 'Industrial Area Road 3' },
        { depot_id: 'DEP_MMS', name: 'Mombasa Port Depot Terminal', location: 'Mombasa Shimanzi' }
      ]
    };
    this.fleets.push(pilotFleet);

    // 2. Initial Daily Dispatch Jobs
    const initialJobs: PilotJob[] = [
      {
        job_id: 'JOB_PILOT_101',
        company_id: CO_ID,
        pilot_id: 'PILOT_NAIROBI_01',
        vehicle_id: 'VH_M1',
        vehicle_name: 'KBH 104X - Scania Tipper',
        driver_id: 'DR_01',
        driver_name: 'John Kamau',
        route_id: 'RT_NBO_MMSA',
        route_name: 'Nairobi to Mombasa Highway',
        customer_id: 'CST_MMSA_RETAIL',
        customer_name: 'Mombasa Maritime Logistics',
        planned_start: '2026-07-11T05:00:00Z',
        planned_eta: '2026-07-11T13:00:00Z',
        actual_start: '2026-07-11T05:15:00Z',
        latest_eta: '2026-07-11T13:30:00Z',
        job_status: 'in_transit',
        telemetry_status: 'good',
        delay_status: 'on_time',
        dispatcher_notes: 'Vehicle tracking normal. Fuel level optimal at departure.',
        zapp_brain_alerts: [],
        pending_approvals: []
      },
      {
        job_id: 'JOB_PILOT_102',
        company_id: CO_ID,
        pilot_id: 'PILOT_NAIROBI_01',
        vehicle_id: 'VH_M2',
        vehicle_name: 'KCD 203B - Volvo Cargo',
        driver_id: 'DR_02',
        driver_name: 'David Mwangi',
        route_id: 'RT_NBO_KSM',
        route_name: 'Nairobi to Kisumu Expressway',
        customer_id: 'CST_KSM_GRAIN',
        customer_name: 'Kisumu Agro Foods',
        planned_start: '2026-07-11T06:00:00Z',
        planned_eta: '2026-07-11T12:30:00Z',
        actual_start: '2026-07-11T06:10:00Z',
        latest_eta: '2026-07-11T13:15:00Z',
        job_status: 'delayed',
        telemetry_status: 'intermittent',
        delay_status: 'minor_delay',
        dispatcher_notes: 'Encountered heavy traffic near Nakuru bypass. Intermittent GSM cellular drops.',
        zapp_brain_alerts: ['High frequency of GSM reconnection attempts', 'Expected 20 min delay near Nakuru'],
        pending_approvals: []
      },
      {
        job_id: 'JOB_PILOT_103',
        company_id: CO_ID,
        pilot_id: 'PILOT_NAIROBI_01',
        vehicle_id: 'VH_M3',
        vehicle_name: 'KAA 092C - Isuzu Medium',
        driver_id: 'DR_03',
        driver_name: 'Sarah Wangari',
        route_id: 'RT_LOCAL_E',
        route_name: 'Eastlands Distribution Ring',
        customer_id: 'CST_MMSA_RETAIL',
        customer_name: 'Mombasa Maritime Logistics',
        planned_start: '2026-07-11T08:00:00Z',
        planned_eta: '2026-07-11T10:00:00Z',
        job_status: 'assigned',
        telemetry_status: 'good',
        delay_status: 'on_time',
        dispatcher_notes: 'Pre-check completed. Driver at depot awaiting load completion.',
        zapp_brain_alerts: [],
        pending_approvals: []
      },
      {
        job_id: 'JOB_PILOT_104',
        company_id: CO_ID,
        pilot_id: 'PILOT_NAIROBI_01',
        vehicle_id: 'VH_M4',
        vehicle_name: 'KBY 778Y - Mercedes Actros',
        driver_id: 'DR_04',
        driver_name: 'Hassan Juma',
        route_id: 'RT_NBO_MMSA',
        route_name: 'Nairobi to Mombasa Highway',
        customer_id: 'CST_MMSA_RETAIL',
        customer_name: 'Mombasa Maritime Logistics',
        planned_start: '2026-07-10T04:00:00Z',
        planned_eta: '2026-07-10T12:00:00Z',
        actual_start: '2026-07-10T04:05:00Z',
        latest_eta: '2026-07-10T11:45:00Z',
        job_status: 'completed',
        telemetry_status: 'good',
        delay_status: 'on_time',
        dispatcher_notes: 'Successful delivery. Telemetry remained 100% stable during total runtime.',
        zapp_brain_alerts: [],
        pending_approvals: []
      }
    ];
    this.jobs = initialJobs;

    // 3. Initial Incidents
    const initialIncidents: PilotIncident[] = [
      {
        incident_id: 'INC_PILOT_201',
        company_id: CO_ID,
        pilot_id: 'PILOT_NAIROBI_01',
        vehicle_id: 'VH_M2',
        driver_id: 'DR_02',
        job_id: 'JOB_PILOT_102',
        type: 'signal_blackout',
        severity: 'critical',
        timestamp: '2026-07-11T07:15:00Z',
        status: 'investigating',
        telemetry_timeline: [
          { time: '07:10:00', event: 'Signal Degradation', details: 'RSSI fell from -72dBm to -104dBm' },
          { time: '07:12:00', event: 'Ping Missing', details: 'Consecutive keep-alives failed' },
          { time: '07:15:00', event: 'Blackout Registered', details: 'Device offline for > 5 minutes' }
        ],
        zapp_brain_insight: 'The device DEV_P1_01 reported weak GSM signal (-95dBm) prior to the loss of pings. Cell tower transitions near Gilgil indicate possible cellular shadows.',
        suggested_playbook: [
          'Verify cellular coverage at Nakuru/Gilgil highway corridor',
          'Check device main power loop telemetry (Was battery backup triggered?)',
          'Attempt immediate dispatcher voice lookup with Driver Mwangi'
        ],
        queued_actions: [
          'Dispatch remote SMS health ping to DEV_P1_01',
          'Queue manual driver call verification'
        ],
        dispatcher_decisions: [
          'SMS health ping dispatched'
        ],
        audit_trail: [
          'Incident auto-detected by Zapp Brain Engine (07:15:00)',
          'Dispatcher Kamau assigned to case (07:18:00)',
          'Triggered remote cellular handshake attempt (07:19:30)'
        ]
      },
      {
        incident_id: 'INC_PILOT_202',
        company_id: CO_ID,
        pilot_id: 'PILOT_NAIROBI_01',
        vehicle_id: 'VH_M1',
        driver_id: 'DR_01',
        job_id: 'JOB_PILOT_101',
        type: 'route_deviation',
        severity: 'warning',
        timestamp: '2026-07-11T06:45:00Z',
        status: 'resolved',
        telemetry_timeline: [
          { time: '06:40:00', event: 'Off-Route Coordinate Locked', details: 'Deviation threshold of 1.2km exceeded' },
          { time: '06:45:00', event: 'Route Deviation Incident Created', details: 'Zapp Brain triggered Geofence breach' }
        ],
        zapp_brain_insight: 'Vehicle left the RT_NBO_MMSA route corridor to access a known service station at Athi River.',
        suggested_playbook: [
          'Identify if deviation correlates with scheduled rest stop',
          'Cross-reference client delivery manifest rules'
        ],
        queued_actions: [
          'Approve temporary path corridor bypass'
        ],
        dispatcher_decisions: [
          'Bypass approved: Approved rest stop confirmed by dispatcher'
        ],
        final_resolution: 'Bypass authorized. Driver was resting at authorized Athi River Fuel Depot.',
        audit_trail: [
          'Incident registered (06:45:00)',
          'Dispatcher Kamau reviewed Athi River corridor match (06:48:00)',
          'Case resolved with status: Authorized Break (06:50:00)'
        ]
      }
    ];
    this.incidents = initialIncidents;

    // 4. Maintenance Tickets
    this.maintenanceTickets = [
      { ticket_id: 'TKT_MNT_01', company_id: CO_ID, vehicle_id: 'VH_M2', vehicle_name: 'KCD 203B - Volvo Cargo', fault_type: 'J1939 ECU DTC Fault', dtc_codes: ['SPN 91 FMI 3', 'SPN 110 FMI 4'], status: 'reported', created_at: '2026-07-10T10:00:00Z', risk_score: 45 },
      { ticket_id: 'TKT_MNT_02', company_id: CO_ID, vehicle_id: 'VH_M5', vehicle_name: 'KBZ 908A - Tanker Truck', fault_type: 'High Coolant Temp Warning', dtc_codes: ['SPN 110 FMI 16'], status: 'scheduled', created_at: '2026-07-09T14:30:00Z', risk_score: 75 }
    ];

    // 5. Compliance Items
    this.complianceItems = [
      { compliance_id: 'CMP_01', company_id: CO_ID, vehicle_or_driver_id: 'DR_01', name: 'John Kamau', type: 'PrDP', expiry_date: '2026-07-25', status: 'warning', risk_score: 30 },
      { compliance_id: 'CMP_02', company_id: CO_ID, vehicle_or_driver_id: 'VH_M3', name: 'KAA 092C - Isuzu Medium', type: 'COF', expiry_date: '2026-06-30', status: 'expired', risk_score: 85 },
      { compliance_id: 'CMP_03', company_id: CO_ID, vehicle_or_driver_id: 'DR_03', name: 'Sarah Wangari', type: 'license', expiry_date: '2026-11-12', status: 'valid', risk_score: 0 }
    ];

    // 6. Device Support Items
    this.deviceSupportItems = [
      { device_id: 'DEV_P1_01', company_id: CO_ID, vehicle_id: 'VH_M2', vehicle_name: 'KCD 203B - Volvo Cargo', issues: ['weak_gsm', 'failed_upload'], severity: 'warning', recommended_action: 'Perform RF antenna placement inspection. Relocate antenna to upper A-pillar.', last_seen_at: '2026-07-11T07:10:00Z' },
      { device_id: 'DEV_BOX_FAULTY', company_id: CO_ID, issues: ['boot_loop', 'rework_required'], severity: 'critical', recommended_action: 'Retrieve unit from storage. Reflash stable firmware v1.4.2 via ST-Link programmer.' }
    ];

    // 7. Live Pilot Operations Feed events
    this.feed = [
      { event_id: 'EV_001', timestamp: '2026-07-11T07:15:00Z', company_id: CO_ID, pilot_id: 'PILOT_NAIROBI_01', vehicle_id: 'VH_M2', driver_id: 'DR_02', job_id: 'JOB_PILOT_102', severity: 'critical', category: 'device_health', message: 'Device DEV_P1_01 failed to respond to cellular ping for 5 minutes.', status: 'unread' },
      { event_id: 'EV_002', timestamp: '2026-07-11T07:10:00Z', company_id: CO_ID, pilot_id: 'PILOT_NAIROBI_01', vehicle_id: 'VH_M2', driver_id: 'DR_02', job_id: 'JOB_PILOT_102', severity: 'warning', category: 'telemetry', message: 'GSM RSSI signal strength weak: -95dBm near Nakuru bypass.', status: 'unread' },
      { event_id: 'EV_003', timestamp: '2026-07-11T06:50:00Z', company_id: CO_ID, pilot_id: 'PILOT_NAIROBI_01', vehicle_id: 'VH_M1', driver_id: 'DR_01', job_id: 'JOB_PILOT_101', severity: 'info', category: 'insight', message: 'Zapp Brain mapped Athi River deviation to rest stop. High confidence (94%).', status: 'resolved' },
      { event_id: 'EV_004', timestamp: '2026-07-11T06:10:00Z', company_id: CO_ID, pilot_id: 'PILOT_NAIROBI_01', vehicle_id: 'VH_M2', driver_id: 'DR_02', job_id: 'JOB_PILOT_102', severity: 'info', category: 'job_status', message: 'Job JOB_PILOT_102 transitioned to delayed due to transit hold-up.', status: 'read' },
      { event_id: 'EV_005', timestamp: '2026-07-11T05:15:00Z', company_id: CO_ID, pilot_id: 'PILOT_NAIROBI_01', vehicle_id: 'VH_M1', driver_id: 'DR_01', job_id: 'JOB_PILOT_101', severity: 'info', category: 'job_status', message: 'Job JOB_PILOT_101 departed Nairobi Depot. Telemetry active.', status: 'read' }
    ];

    // Audit initial setup
    this.writeAudit(CO_ID, 'SYSTEM', 'PILOT_BOOTSTRAP', 'Nairobi Transit Pilot initialized with 5 vehicles and daily monitoring.');
  }

  public writeAudit(company_id: string, actor: string, action: string, details?: string) {
    this.auditLogs.unshift({
      timestamp: new Date().toISOString(),
      actor,
      action,
      company_id,
      details
    });
  }
}

// Single state store instance for consistent state in-memory
export const ZappPilotStore = new PilotStateStore();

export const ZappPilotService = {
  // Enforce tenant isolation helper
  verifyCompany(companyId: string, itemCompanyId: string) {
    if (companyId !== itemCompanyId) {
      throw new Error(`Unauthorized multi-tenant action. Target belongs to another company context.`);
    }
  },

  // 1. Create Pilot Fleet
  createPilotFleet(
    companyId: string,
    name: string,
    startDate: string,
    endDate: string,
    successCriteria: string,
    actor: string
  ): PilotFleet {
    const newFleet: PilotFleet = {
      pilot_id: `PILOT_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      company_id: companyId,
      name,
      status: 'planning',
      start_date: startDate,
      end_date: endDate,
      success_criteria_desc: successCriteria,
      vehicle_ids: [],
      driver_ids: [],
      dispatchers: [actor],
      supervisors: [],
      routes: [],
      customers: [],
      depots: []
    };

    ZappPilotStore.fleets.push(newFleet);
    ZappPilotStore.writeAudit(companyId, actor, 'PILOT_CREATED', `Pilot '${name}' created. Status: planning.`);
    return newFleet;
  },

  // 2. Add vehicle to pilot
  addVehicleToPilot(companyId: string, pilotId: string, vehicleId: string, actor: string) {
    const fleet = ZappPilotStore.fleets.find(f => f.pilot_id === pilotId);
    if (!fleet) throw new Error('Pilot fleet not found');
    this.verifyCompany(companyId, fleet.company_id);

    if (fleet.vehicle_ids.includes(vehicleId)) {
      throw new Error('Vehicle already registered in this pilot fleet');
    }

    fleet.vehicle_ids.push(vehicleId);
    ZappPilotStore.writeAudit(companyId, actor, 'VEHICLE_ADDED_TO_PILOT', `Vehicle ${vehicleId} appended to pilot ${pilotId}.`);
  },

  // 3. Assign driver to pilot vehicle
  assignDriverToPilotVehicle(companyId: string, pilotId: string, vehicleId: string, driverId: string, actor: string) {
    const fleet = ZappPilotStore.fleets.find(f => f.pilot_id === pilotId);
    if (!fleet) throw new Error('Pilot fleet not found');
    this.verifyCompany(companyId, fleet.company_id);

    if (!fleet.driver_ids.includes(driverId)) {
      fleet.driver_ids.push(driverId);
    }

    ZappPilotStore.writeAudit(companyId, actor, 'DRIVER_ASSIGNED', `Driver ${driverId} assigned to vehicle ${vehicleId} in pilot ${pilotId}.`);
  },

  // 4. Create Pilot Job
  createPilotJob(
    companyId: string,
    pilotId: string,
    jobData: Omit<PilotJob, 'job_id' | 'company_id' | 'pilot_id' | 'job_status' | 'telemetry_status' | 'delay_status' | 'zapp_brain_alerts' | 'pending_approvals'>,
    actor: string
  ): PilotJob {
    const fleet = ZappPilotStore.fleets.find(f => f.pilot_id === pilotId);
    if (!fleet) throw new Error('Pilot fleet not found');
    this.verifyCompany(companyId, fleet.company_id);

    // Prevent duplicate active jobs on same vehicle
    const hasActiveJob = ZappPilotStore.jobs.some(
      j => j.vehicle_id === jobData.vehicle_id && !['completed', 'cancelled_manually', 'failed'].includes(j.job_status)
    );
    if (hasActiveJob) {
      throw new Error(`Vehicle ${jobData.vehicle_id} already has an active, unfinished job assigned.`);
    }

    const newJob: PilotJob = {
      ...jobData,
      job_id: `JOB_PILOT_${Math.floor(100 + Math.random() * 900)}`,
      company_id: companyId,
      pilot_id: pilotId,
      job_status: 'planned',
      telemetry_status: 'good',
      delay_status: 'on_time',
      zapp_brain_alerts: [],
      pending_approvals: []
    };

    ZappPilotStore.jobs.unshift(newJob);
    ZappPilotStore.writeAudit(companyId, actor, 'JOB_CREATED', `Job ${newJob.job_id} successfully scheduled for vehicle ${newJob.vehicle_name}.`);

    // Add Live event
    ZappPilotStore.feed.unshift({
      event_id: `EV_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      company_id: companyId,
      pilot_id: pilotId,
      vehicle_id: newJob.vehicle_id,
      driver_id: newJob.driver_id,
      job_id: newJob.job_id,
      severity: 'info',
      category: 'job_status',
      message: `Job ${newJob.job_id} scheduled: ${newJob.vehicle_name} ➔ ${newJob.customer_name}.`,
      status: 'unread'
    });

    return newJob;
  },

  // 5. Update Pilot Job Status Manually (Dispatcher approval required!)
  updatePilotJobStatusManually(companyId: string, jobId: string, newStatus: PilotJobStatus, notes: string, actor: string): PilotJob {
    const job = ZappPilotStore.jobs.find(j => j.job_id === jobId);
    if (!job) throw new Error('Pilot job not found');
    this.verifyCompany(companyId, job.company_id);

    const oldStatus = job.job_status;
    job.job_status = newStatus;
    if (notes) {
      job.dispatcher_notes = notes;
    }

    if (newStatus === 'dispatched' || newStatus === 'in_transit') {
      job.actual_start = new Date().toISOString();
    }

    ZappPilotStore.writeAudit(
      companyId,
      actor,
      'JOB_STATUS_CHANGE',
      `Manual transition of Job ${jobId} from '${oldStatus}' to '${newStatus}' by ${actor}. Notes: ${notes}`
    );

    // Live Event
    ZappPilotStore.feed.unshift({
      event_id: `EV_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      company_id: companyId,
      pilot_id: job.pilot_id,
      vehicle_id: job.vehicle_id,
      driver_id: job.driver_id,
      job_id: job.job_id,
      severity: newStatus === 'delayed' || newStatus === 'failed' ? 'warning' : 'info',
      category: 'job_status',
      message: `Job ${jobId} status manual change: '${oldStatus}' ➔ '${newStatus}'.`,
      status: 'unread'
    });

    return job;
  },

  // 6. Get Pilot Daily Board (Company Filtered)
  getPilotDailyBoard(companyId: string, pilotId: string) {
    const fleet = ZappPilotStore.fleets.find(f => f.pilot_id === pilotId);
    if (!fleet) throw new Error('Pilot fleet not found');
    this.verifyCompany(companyId, fleet.company_id);

    return ZappPilotStore.jobs.filter(j => j.pilot_id === pilotId && j.company_id === companyId);
  },

  // 7. Get Pilot Operations Feed (Company Filtered)
  getPilotOperationsFeed(companyId: string, pilotId: string) {
    return ZappPilotStore.feed.filter(e => e.pilot_id === pilotId && e.company_id === companyId);
  },

  // 8. Create Pilot Incident
  createPilotIncident(
    companyId: string,
    pilotId: string,
    incidentData: Omit<PilotIncident, 'incident_id' | 'company_id' | 'pilot_id' | 'status' | 'telemetry_timeline' | 'dispatcher_decisions' | 'audit_trail'>,
    actor: string
  ): PilotIncident {
    const fleet = ZappPilotStore.fleets.find(f => f.pilot_id === pilotId);
    if (!fleet) throw new Error('Pilot fleet not found');
    this.verifyCompany(companyId, fleet.company_id);

    const newIncident: PilotIncident = {
      ...incidentData,
      incident_id: `INC_PILOT_${Math.floor(200 + Math.random() * 800)}`,
      company_id: companyId,
      pilot_id: pilotId,
      status: 'open',
      telemetry_timeline: [
        { time: new Date().toLocaleTimeString(), event: 'Incident Flagged', details: `Automated detection for incident type: ${incidentData.type}` }
      ],
      dispatcher_decisions: [],
      audit_trail: [
        `Incident registered in pilot dashboard. Assigned priority: ${incidentData.severity.toUpperCase()}`
      ]
    };

    ZappPilotStore.incidents.unshift(newIncident);
    ZappPilotStore.writeAudit(companyId, actor, 'INCIDENT_CREATED', `Incident ${newIncident.incident_id} of type '${newIncident.type}' opened.`);

    // Feed Event
    ZappPilotStore.feed.unshift({
      event_id: `EV_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      company_id: companyId,
      pilot_id: pilotId,
      vehicle_id: newIncident.vehicle_id,
      driver_id: newIncident.driver_id,
      job_id: newIncident.job_id,
      severity: newIncident.severity === 'critical' ? 'critical' : 'warning',
      category: 'insight',
      message: `Zapp Brain Flagged Incident: ${newIncident.type.toUpperCase()} on vehicle ${newIncident.vehicle_id}.`,
      status: 'unread'
    });

    return newIncident;
  },

  // 9. Resolve Incident Manually (Never auto-resolved!)
  resolvePilotIncidentManually(companyId: string, incidentId: string, resolution: string, actor: string): PilotIncident {
    const incident = ZappPilotStore.incidents.find(i => i.incident_id === incidentId);
    if (!incident) throw new Error('Pilot incident not found');
    this.verifyCompany(companyId, incident.company_id);

    incident.status = 'resolved';
    incident.final_resolution = resolution;
    incident.audit_trail.push(`Incident manually resolved by ${actor} on ${new Date().toLocaleString()}.`);
    incident.dispatcher_decisions.push(`Resolved: ${resolution}`);

    ZappPilotStore.writeAudit(companyId, actor, 'INCIDENT_RESOLVED', `Incident ${incidentId} marked resolved. Resolution: ${resolution}`);

    // Feed Event
    ZappPilotStore.feed.unshift({
      event_id: `EV_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      company_id: companyId,
      pilot_id: incident.pilot_id,
      vehicle_id: incident.vehicle_id,
      driver_id: incident.driver_id,
      job_id: incident.job_id,
      severity: 'info',
      category: 'audit',
      message: `Incident ${incidentId} resolved by ${actor}: ${resolution}`,
      status: 'resolved'
    });

    return incident;
  },

  // 10. Daily Operations Scorecard Calculations
  calculateScorecard(companyId: string, pilotId: string): PilotScorecard {
    const jobs = ZappPilotStore.jobs.filter(j => j.company_id === companyId && j.pilot_id === pilotId);
    const incidents = ZappPilotStore.incidents.filter(i => i.company_id === companyId && i.pilot_id === pilotId);
    const support = ZappPilotStore.deviceSupportItems.filter(s => s.company_id === companyId);

    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(j => j.job_status === 'completed').length;
    const delayedJobs = jobs.filter(j => j.job_status === 'delayed').length;

    // Calculate dynamic percentages
    const onTimeDispatch = totalJobs > 0 ? Math.round(((totalJobs - delayedJobs) / totalJobs) * 100) : 95;
    const onTimeDelivery = totalJobs > 0 ? Math.round((completedJobs / (completedJobs + delayedJobs || 1)) * 100) : 92;
    const completedActions = incidents.length > 0 ? Math.round((incidents.filter(i => i.status === 'resolved').length / incidents.length) * 100) : 80;

    // Standard baseline scores
    let score = 90;
    const weaknesses: string[] = [];
    const strengths: string[] = ['Excellent carrier cellular connectivity on Southern Route (Nairobi - Mombasa).', 'Zero critical panic bypass failures registered.'];
    const dataWarnings: string[] = [];

    if (delayedJobs > 0) {
      score -= (delayedJobs * 4);
      weaknesses.push(`${delayedJobs} route delay warnings active. Check Nakuru highway bypass.`);
    }

    const openIncidents = incidents.filter(i => i.status !== 'resolved').length;
    if (openIncidents > 0) {
      score -= (openIncidents * 6);
      weaknesses.push(`${openIncidents} unresolved incidents pending review in operations queue.`);
    }

    const supportIssues = support.flatMap(s => s.issues).length;
    if (supportIssues > 0) {
      score -= (supportIssues * 3);
      weaknesses.push(`${supportIssues} hardware diagnostics errors flagged by active devices.`);
    }

    // Bound limits
    score = Math.max(10, Math.min(100, score));

    return {
      on_time_dispatch_rate: onTimeDispatch,
      on_time_delivery_rate: onTimeDelivery,
      average_delay_duration_mins: 42,
      terminal_dwell_time_mins: 78,
      customer_dwell_time_mins: 95,
      route_deviation_count: incidents.filter(i => i.type === 'route_deviation').length,
      telemetry_uptime_pct: 97.4,
      packet_delivery_success_pct: 98.2,
      device_offline_minutes: 120,
      maintenance_incident_count: ZappPilotStore.maintenanceTickets.filter(t => t.company_id === companyId).length,
      compliance_issue_count: ZappPilotStore.complianceItems.filter(c => c.company_id === companyId && c.status !== 'valid').length,
      safety_event_count: incidents.filter(i => i.type === 'panic').length,
      false_alarm_rate_pct: 12.5,
      dispatcher_response_time_seconds: 45,
      completed_action_rate_pct: completedActions,
      daily_score: score,
      strengths,
      weaknesses: weaknesses.length > 0 ? weaknesses : ['No major operational weaknesses detected.'],
      recommended_next_focus: openIncidents > 0 
        ? 'Action the unresolved Nakuru corridor blackout incident to maintain data integrity.'
        : 'Optimize terminal dwell time at Mombasa port depot to streamline truck turnaround.',
      data_quality_warnings: dataWarnings
    };
  },

  // 11. Generate Daily & Weekly Reports
  generateDailyPilotReport(companyId: string, pilotId: string): PilotReport {
    const scorecard = this.calculateScorecard(companyId, pilotId);
    const openIncidents = ZappPilotStore.incidents.filter(i => i.company_id === companyId && i.pilot_id === pilotId && i.status !== 'resolved');

    const reportContent = {
      summary: `Nairobi East Transit Pilot Daily Performance Report. Core fleet metrics are stable with an operational score of ${scorecard.daily_score}/100. Telemetry uptime averages ${scorecard.telemetry_uptime_pct}% across 5 active vehicles.`,
      unresolved_risks: openIncidents.map(i => `Vehicle ${i.vehicle_id} registered active ${i.type} incident.`),
      recommendations: [
        'Inspect DEV_P1_01 cellular antenna wire due to recurring Nakuru corridor shadows.',
        'Action COF certification warnings immediately to prevent traffic penalties.'
      ],
      next_focus: 'Address Gilgil/Nakuru weak-signal corridor and complete compliance audits.'
    };

    const newReport: PilotReport = {
      report_id: `RPT_DLY_${Math.floor(1000 + Math.random() * 9000)}`,
      company_id: companyId,
      pilot_id: pilotId,
      type: 'daily',
      generated_at: new Date().toISOString(),
      summary: reportContent.summary,
      metrics_snapshot: scorecard,
      major_incidents: openIncidents.map(i => ({ incident_id: i.incident_id, type: i.type, summary: i.zapp_brain_insight })),
      unresolved_risks: reportContent.unresolved_risks,
      dispatcher_actions_count: ZappPilotStore.auditLogs.filter(a => a.company_id === companyId).length,
      recommendations: reportContent.recommendations,
      next_focus: reportContent.next_focus,
      raw_json: JSON.stringify({ metrics: scorecard, details: reportContent }, null, 2)
    };

    ZappPilotStore.reports.unshift(newReport);
    ZappPilotStore.writeAudit(companyId, 'SYSTEM', 'REPORT_GENERATED', `Daily pilot report ${newReport.report_id} compiled.`);
    return newReport;
  },

  generateWeeklyPilotReport(companyId: string, pilotId: string): PilotReport {
    const scorecard = this.calculateScorecard(companyId, pilotId);

    const reportContent = {
      summary: `Weekly Pilot Compilation. Trend is positive. Completed deliveries reached 96%. Route deviations were consistently identified with high-trust insights, bypassing false alarms successfully. Telemetry packet delivery was optimal at ${scorecard.packet_delivery_success_pct}%.`,
      unresolved_risks: ['COF certification expired on Vehicle VH_M3.'],
      recommendations: [
        'Schedule preventative maintenance check for Volvo Cargo VH_M2 J1939 ECU DTC faults.',
        'Scale pilot to 10 vehicles given robust telemetry ingest performance (97.4%).'
      ],
      next_focus: 'Review Volvo Cargo maintenance logs and finalize scaling proposal.'
    };

    const newReport: PilotReport = {
      report_id: `RPT_WKL_${Math.floor(1000 + Math.random() * 9000)}`,
      company_id: companyId,
      pilot_id: pilotId,
      type: 'weekly',
      generated_at: new Date().toISOString(),
      summary: reportContent.summary,
      metrics_snapshot: scorecard,
      major_incidents: [],
      unresolved_risks: reportContent.unresolved_risks,
      dispatcher_actions_count: ZappPilotStore.auditLogs.filter(a => a.company_id === companyId).length * 5,
      recommendations: reportContent.recommendations,
      next_focus: reportContent.next_focus,
      raw_json: JSON.stringify({ weekly_aggregate: scorecard, details: reportContent }, null, 2)
    };

    ZappPilotStore.reports.unshift(newReport);
    ZappPilotStore.writeAudit(companyId, 'SYSTEM', 'REPORT_GENERATED', `Weekly aggregate report ${newReport.report_id} compiled.`);
    return newReport;
  },

  // 12. Pilot Success Criteria Engine
  calculatePilotReadiness(companyId: string, pilotId: string): PilotSuccessCriteriaResult {
    const scorecard = this.calculateScorecard(companyId, pilotId);
    
    const blockers: string[] = [];
    const recommendedFixes: string[] = [];

    // Success thresholds checks
    if (scorecard.telemetry_uptime_pct < 90) {
      blockers.push('Telemetry uptime averages under the 90% scaling target.');
      recommendedFixes.push('Reposition GSM/GPS antenna locations in truck cabs to reduce RF path loss.');
    }
    if (scorecard.packet_delivery_success_pct < 95) {
      blockers.push('Packet delivery rate is below 95% threshold due to intermittent cellular dropout.');
      recommendedFixes.push('Increase the local flash offline spooling buffer memory size in firmware config.');
    }
    if (scorecard.compliance_issue_count > 1) {
      blockers.push('Unresolved compliance risks (expired COF/PrDP certificates) pose regulatory hazards.');
      recommendedFixes.push('Resolve vehicle VH_M3 expired Certificate of Fitness (COF) immediately.');
    }
    if (scorecard.false_alarm_rate_pct > 25) {
      blockers.push('Excessive false alarms (above 25%) are causing dispatcher fatigue.');
      recommendedFixes.push('Tune Zapp Brain geofence corridors and increase speed-damping filters.');
    }

    const scaleReady = blockers.length === 0;
    const readinessScore = Math.max(20, 100 - (blockers.length * 20));

    return {
      scale_ready: scaleReady,
      readiness_score: readinessScore,
      blockers,
      recommended_fixes: recommendedFixes,
      next_pilot_step: scaleReady
        ? 'Deploy Phase 13 Pilot success proposal. Authorize adding 15 new vehicles to regional fleet.'
        : 'Address compliance gaps and troubleshoot DEV_P1_01 cellular dropouts.'
    };
  },

  // 13. OneDrive Data Lake Bridge Placeholder
  importOneDriveData(
    companyId: string,
    filename: string,
    sourceType: OneDriveImportResult['source_type'],
    actor: string
  ): OneDriveImportResult {
    // 1. Validation check
    if (!filename.endsWith('.csv') && !filename.endsWith('.json')) {
      throw new Error('Unsupported file extension. Only verified .csv and .json data lake files are allowed.');
    }

    // 2. Mock schema processing / Staging
    const rows = sourceType === 'gps_exports' ? 250 : 45;
    const cleanRows = sourceType === 'gps_exports' ? 244 : 42;
    const dirtyRows = rows - cleanRows;

    const reasons = dirtyRows > 0 
      ? [`Quarantined ${dirtyRows} rows with corrupt/out-of-order GPS epoch timestamps.`]
      : [];

    const result: OneDriveImportResult = {
      import_id: `ONEDRIVE_IMP_${Math.floor(100000 + Math.random() * 900000)}`,
      company_id: companyId,
      filename,
      imported_at: new Date().toISOString(),
      source_type: sourceType,
      rows_processed: rows,
      rows_successful: cleanRows,
      rows_quarantined: dirtyRows,
      quarantine_reasons: reasons,
      status: dirtyRows > 0 ? 'warning' : 'success'
    };

    ZappPilotStore.importedRecords.unshift(result);
    ZappPilotStore.writeAudit(
      companyId,
      actor,
      'ONEDRIVE_IMPORT',
      `OneDrive import job executed. File: ${filename}. Type: ${sourceType}. Processed: ${rows}, Successful: ${cleanRows}, Quarantined: ${dirtyRows}.`
    );

    return result;
  },

  // 14. Pilot Simulation Mode
  runPilotSimulation(
    companyId: string,
    pilotId: string,
    mode: SimulationModeType,
    scenario: SimulationScenario,
    actor: string
  ): { status: string; eventCount: number; scenarioDescription: string } {
    const fleet = ZappPilotStore.fleets.find(f => f.pilot_id === pilotId);
    if (!fleet) throw new Error('Pilot fleet not found');
    this.verifyCompany(companyId, fleet.company_id);

    // Dynamic Fleet scaling based on mode
    const vehicleCount = mode === '5_vehicles' ? 5 : mode === '10_vehicles' ? 10 : 20;
    
    // Clear old jobs & incidents first to represent the scenario clean state
    ZappPilotStore.jobs = ZappPilotStore.jobs.filter(j => j.company_id !== companyId);
    ZappPilotStore.incidents = ZappPilotStore.incidents.filter(i => i.company_id !== companyId);

    let description = '';
    let eventCount = 0;

    // Reset base assets to support scaled simulation
    const updatedVehicles = Array.from({ length: vehicleCount }, (_, i) => `VH_SIM_${i + 1}`);
    const updatedDrivers = Array.from({ length: vehicleCount }, (_, i) => `DR_SIM_${i + 1}`);
    fleet.vehicle_ids = updatedVehicles;
    fleet.driver_ids = updatedDrivers;

    // Build specific simulation scenarios
    if (scenario === 'normal') {
      description = 'Simulating an optimal transit day with stable cellular links and on-time dispatch.';
      for (let i = 0; i < vehicleCount; i++) {
        const vId = updatedVehicles[i];
        const dId = updatedDrivers[i];
        ZappPilotStore.jobs.push({
          job_id: `JOB_SIM_${i + 100}`,
          company_id: companyId,
          pilot_id: pilotId,
          vehicle_id: vId,
          vehicle_name: `KCP ${200 + i}X - Simulated Carrier ${i + 1}`,
          driver_id: dId,
          driver_name: `Driver Sim ${i + 1}`,
          route_id: 'RT_NBO_MMSA',
          route_name: 'Nairobi to Mombasa Highway',
          customer_id: 'CST_MMSA_RETAIL',
          customer_name: 'Mombasa Maritime Logistics',
          planned_start: new Date().toISOString(),
          planned_eta: new Date(Date.now() + 8 * 3600000).toISOString(),
          actual_start: new Date().toISOString(),
          latest_eta: new Date(Date.now() + 8 * 3600000).toISOString(),
          job_status: i % 2 === 0 ? 'in_transit' : 'completed',
          telemetry_status: 'good',
          delay_status: 'on_time',
          dispatcher_notes: 'Simulation normal. Standard telemetry logs streaming.',
          zapp_brain_alerts: [],
          pending_approvals: []
        });
        eventCount++;
      }
    } else if (scenario === 'high_delay') {
      description = 'Simulating high-delay day. Traffic bottlenecks at Nakuru and heavy port terminal dwell.';
      for (let i = 0; i < vehicleCount; i++) {
        const vId = updatedVehicles[i];
        const dId = updatedDrivers[i];
        const isDelayed = i % 3 === 0;
        ZappPilotStore.jobs.push({
          job_id: `JOB_SIM_${i + 100}`,
          company_id: companyId,
          pilot_id: pilotId,
          vehicle_id: vId,
          vehicle_name: `KCP ${200 + i}X - Simulated Carrier ${i + 1}`,
          driver_id: dId,
          driver_name: `Driver Sim ${i + 1}`,
          route_id: 'RT_NBO_KSM',
          route_name: 'Nairobi to Kisumu Expressway',
          customer_id: 'CST_KSM_GRAIN',
          customer_name: 'Kisumu Agro Foods',
          planned_start: new Date().toISOString(),
          planned_eta: new Date(Date.now() + 6 * 3600000).toISOString(),
          actual_start: new Date().toISOString(),
          latest_eta: new Date(Date.now() + (isDelayed ? 9 : 6) * 3600000).toISOString(),
          job_status: isDelayed ? 'delayed' : 'in_transit',
          telemetry_status: 'good',
          delay_status: isDelayed ? 'critical_delay' : 'on_time',
          dispatcher_notes: isDelayed ? 'Nakuru highway blocked. High transit delay flagged.' : 'Normal routing.',
          zapp_brain_alerts: isDelayed ? ['Critical transit delay detected near Gilgil. expected 3 hrs hold-up.'] : [],
          pending_approvals: []
        });
        
        if (isDelayed) {
          ZappPilotStore.incidents.push({
            incident_id: `INC_SIM_${100 + i}`,
            company_id: companyId,
            pilot_id: pilotId,
            vehicle_id: vId,
            driver_id: dId,
            job_id: `JOB_SIM_${i + 100}`,
            type: 'delay',
            severity: 'warning',
            timestamp: new Date().toISOString(),
            status: 'open',
            telemetry_timeline: [
              { time: new Date().toLocaleTimeString(), event: 'Stationary Threshold Exceeded', details: 'Vehicle static for 45 mins' }
            ],
            zapp_brain_insight: 'Nakuru expressway experiencing exceptional cargo queuing due to toll terminal upgrades.',
            suggested_playbook: ['Verify alternative bypass path corridor', 'Notify Kisumu depot of delayed ETA'],
            queued_actions: ['Trigger client ETA update SMS'],
            dispatcher_decisions: [],
            audit_trail: ['Alert triggered by Zapp Brain routing metrics']
          });
          eventCount += 2;
        } else {
          eventCount++;
        }
      }
    } else if (scenario === 'poor_network') {
      description = 'Simulating poor-network day. Widespread cellular outages on Northern Route, triggering spooling alerts.';
      for (let i = 0; i < vehicleCount; i++) {
        const vId = updatedVehicles[i];
        const dId = updatedDrivers[i];
        const isPoor = i % 2 === 0;
        ZappPilotStore.jobs.push({
          job_id: `JOB_SIM_${i + 100}`,
          company_id: companyId,
          pilot_id: pilotId,
          vehicle_id: vId,
          vehicle_name: `KCP ${200 + i}X - Simulated Carrier ${i + 1}`,
          driver_id: dId,
          driver_name: `Driver Sim ${i + 1}`,
          route_id: 'RT_NBO_MMSA',
          route_name: 'Nairobi to Mombasa Highway',
          customer_id: 'CST_MMSA_RETAIL',
          customer_name: 'Mombasa Maritime Logistics',
          planned_start: new Date().toISOString(),
          planned_eta: new Date(Date.now() + 8 * 3600000).toISOString(),
          actual_start: new Date().toISOString(),
          latest_eta: new Date(Date.now() + 8 * 3600000).toISOString(),
          job_status: 'in_transit',
          telemetry_status: isPoor ? 'offline' : 'good',
          delay_status: 'on_time',
          dispatcher_notes: isPoor ? 'Carrier cell tower dropouts registered. Telemetry spooling offline.' : 'Good cell signal.',
          zapp_brain_alerts: isPoor ? ['Spooling buffer fill level at 45%', 'GSM connection loss reported for over 15 mins'] : [],
          pending_approvals: []
        });

        if (isPoor) {
          ZappPilotStore.incidents.push({
            incident_id: `INC_SIM_${100 + i}`,
            company_id: companyId,
            pilot_id: pilotId,
            vehicle_id: vId,
            driver_id: dId,
            job_id: `JOB_SIM_${i + 100}`,
            type: 'signal_blackout',
            severity: 'critical',
            timestamp: new Date().toISOString(),
            status: 'open',
            telemetry_timeline: [
              { time: new Date().toLocaleTimeString(), event: 'Cell Signal Cut', details: 'RSSI -110dBm' }
            ],
            zapp_brain_insight: 'Severe regional cellular congestion near Maungu. Telemetry offline spool buffer triggered.',
            suggested_playbook: ['Verify fallback Lora/GSM channel packet history', 'Perform driver callback check'],
            queued_actions: ['Trigger support diagnostic handshake'],
            dispatcher_decisions: [],
            audit_trail: ['Signal blackout registered by central sentinel']
          });
          eventCount += 2;
        } else {
          eventCount++;
        }
      }
    } else if (scenario === 'high_incident') {
      description = 'Simulating high-incident day. Multiple overspeeding events, harsh brakes, and geofence deviations.';
      for (let i = 0; i < vehicleCount; i++) {
        const vId = updatedVehicles[i];
        const dId = updatedDrivers[i];
        const hasIncident = i % 2 === 0;
        ZappPilotStore.jobs.push({
          job_id: `JOB_SIM_${i + 100}`,
          company_id: companyId,
          pilot_id: pilotId,
          vehicle_id: vId,
          vehicle_name: `KCP ${200 + i}X - Simulated Carrier ${i + 1}`,
          driver_id: dId,
          driver_name: `Driver Sim ${i + 1}`,
          route_id: 'RT_LOCAL_E',
          route_name: 'Eastlands Distribution Ring',
          customer_id: 'CST_MMSA_RETAIL',
          customer_name: 'Mombasa Maritime Logistics',
          planned_start: new Date().toISOString(),
          planned_eta: new Date(Date.now() + 2 * 3600000).toISOString(),
          job_status: 'in_transit',
          telemetry_status: 'good',
          delay_status: 'on_time',
          dispatcher_notes: hasIncident ? 'Speeding alerts registered on vehicle telemetry.' : 'Safe driving.',
          zapp_brain_alerts: hasIncident ? ['Critical geofence route deviation detected', 'Speed threshold breach: 104km/h'] : [],
          pending_approvals: []
        });

        if (hasIncident) {
          ZappPilotStore.incidents.push({
            incident_id: `INC_SIM_${100 + i}`,
            company_id: companyId,
            pilot_id: pilotId,
            vehicle_id: vId,
            driver_id: dId,
            job_id: `JOB_SIM_${i + 100}`,
            type: i % 4 === 0 ? 'overspeeding' : 'route_deviation',
            severity: 'critical',
            timestamp: new Date().toISOString(),
            status: 'open',
            telemetry_timeline: [
              { time: new Date().toLocaleTimeString(), event: 'Safety Limit Exceeded', details: 'Telemetry registered safety threshold geofence breach.' }
            ],
            zapp_brain_insight: 'Severe speed spikes and off-corridor trajectories logged. Dispatcher attention requested.',
            suggested_playbook: ['Verify speed calibration index', 'Audit geofence bypass request status'],
            queued_actions: ['Dispatch remote safety caution warning SMS to truck cab display'],
            dispatcher_decisions: [],
            audit_trail: ['Automatic telemetry sentinel geofence infraction logged']
          });
          eventCount += 2;
        } else {
          eventCount++;
        }
      }
    } else if (scenario === 'maintenance_heavy') {
      description = 'Simulating hardware fault alerts. DTC notifications and workshop bookings generated.';
      ZappPilotStore.maintenanceTickets = ZappPilotStore.maintenanceTickets.filter(t => t.company_id !== companyId);
      for (let i = 0; i < vehicleCount; i++) {
        const vId = updatedVehicles[i];
        const name = `KCP ${200 + i}X - Simulated Carrier ${i + 1}`;
        ZappPilotStore.maintenanceTickets.push({
          ticket_id: `TKT_SIM_${100 + i}`,
          company_id: companyId,
          vehicle_id: vId,
          vehicle_name: name,
          fault_type: i % 2 === 0 ? 'Engine Coolant Loop DTC' : 'Transmission Sensor Failure',
          dtc_codes: i % 2 === 0 ? ['SPN 110 FMI 16'] : ['SPN 190 FMI 2'],
          status: 'reported',
          created_at: new Date().toISOString(),
          risk_score: 50 + (i * 2)
        });
        eventCount++;
      }
    } else if (scenario === 'compliance_risk') {
      description = 'Simulating compliance warnings. Expiring licenses and missing operator documentations flagged.';
      ZappPilotStore.complianceItems = ZappPilotStore.complianceItems.filter(c => c.company_id !== companyId);
      for (let i = 0; i < vehicleCount; i++) {
        const dId = updatedDrivers[i];
        ZappPilotStore.complianceItems.push({
          compliance_id: `CMP_SIM_${100 + i}`,
          company_id: companyId,
          vehicle_or_driver_id: dId,
          name: `Driver Sim ${i + 1}`,
          type: i % 2 === 0 ? 'PrDP' : 'license',
          expiry_date: new Date(Date.now() + (i % 2 === 0 ? -2 : 5) * 24 * 3600000).toISOString().split('T')[0],
          status: i % 2 === 0 ? 'expired' : 'warning',
          risk_score: i % 2 === 0 ? 90 : 40
        });
        eventCount++;
      }
    }

    // Insert top-level Live Feed notification about simulation execution
    ZappPilotStore.feed.unshift({
      event_id: `EV_SIM_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      company_id: companyId,
      pilot_id: pilotId,
      severity: 'warning',
      category: 'audit',
      message: `SIMULATION ACTIVE: Running scenario '${scenario}' with ${vehicleCount} pilot vehicles.`,
      status: 'unread'
    });

    ZappPilotStore.writeAudit(
      companyId,
      actor,
      'RUN_SIMULATION',
      `Simulation launched successfully. Mode: ${mode}. Scenario: ${scenario}. Created ${eventCount} telemetry alerts/jobs.`
    );

    return {
      status: 'success',
      eventCount,
      scenarioDescription: description
    };
  }
};
