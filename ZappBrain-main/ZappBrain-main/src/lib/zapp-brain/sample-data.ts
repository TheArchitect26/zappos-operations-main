/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappBrainInput } from './types';

// Anchor date: 2026-07-07
export const SAMPLING_NOW = '2026-07-07T12:00:00Z';

export const sampleZappBrainInput: ZappBrainInput = {
  companies: [
    {
      id: 'co_zapp_sa',
      name: 'Zapp Logistics South Africa',
      country: 'South Africa',
      timezone: 'Africa/Johannesburg',
      created_at: '2025-01-15T08:00:00Z',
    },
  ],
  drivers: [
    {
      id: 'dr_sipho',
      name: 'Sipho Ndlovu',
      license_number: 'EC-948572019-2',
      license_expiry: '2026-06-15', // EXPIRED!
      status: 'active',
      phone: '+27 82 111 2222',
    },
    {
      id: 'dr_pieter',
      name: 'Pieter Oosthuizen',
      license_number: 'EC-294857102-4',
      license_expiry: '2028-11-20',
      status: 'active',
      phone: '+27 83 222 3333',
    },
    {
      id: 'dr_thabo',
      name: 'Thabo Mokoena',
      license_number: 'EC-582910485-1',
      license_expiry: '2027-04-12',
      status: 'active',
      phone: '+27 72 333 4444',
    },
    {
      id: 'dr_lerato',
      name: 'Lerato Molefe',
      license_number: 'EC-857291048-3',
      license_expiry: '2026-07-30', // EXPIRING SOON!
      status: 'active',
      phone: '+27 71 444 5555',
    },
    {
      id: 'dr_chantal',
      name: 'Chantal Govender',
      license_number: 'EC-102948572-9',
      license_expiry: '2029-03-05',
      status: 'active',
      phone: '+27 84 555 6666',
    },
  ],
  vehicles: [
    {
      id: 'vh_actros_1',
      plate_number: 'CA 123-456',
      make: 'Mercedes-Benz',
      model: 'Actros 2646',
      status: 'active',
      odometer: 425000,
      current_faults: ['EBS Brake Fault - Sensor Signal Intermittent', 'Engine Oil Level Low Warning'], // REPEATED FAULTS & Safety hazard
    },
    {
      id: 'vh_fh16_2',
      plate_number: 'GP 987-654',
      make: 'Volvo',
      model: 'FH16 600',
      status: 'active',
      odometer: 310200,
      current_faults: ['Trailer ABS Connection Lost'],
    },
    {
      id: 'vh_scania_3',
      plate_number: 'ND 456-789',
      make: 'Scania',
      model: 'R500 V8',
      status: 'active',
      odometer: 185400,
      current_faults: [],
    },
    {
      id: 'vh_tgx_4',
      plate_number: 'CY 852-963',
      make: 'MAN',
      model: 'TGX 26.540',
      status: 'active',
      odometer: 290150,
      current_faults: [], // Missing COF document in document list
    },
    {
      id: 'vh_fuso_5',
      plate_number: 'KZN 741-852',
      make: 'Fuso',
      model: 'Canter FE8-150',
      status: 'maintenance',
      odometer: 98400,
      current_faults: ['Coolant Temperature Sensor Malfunction'],
    },
    {
      id: 'vh_gmc_6',
      plate_number: 'L 963-147',
      make: 'Isuzu',
      model: 'FTR 850',
      status: 'active',
      odometer: 154000,
      current_faults: [],
    },
  ],
  customers: [
    {
      id: 'cu_shoprite_ct',
      name: 'Shoprite Cape Town DC',
      contact_email: 'logistics@shoprite.co.za',
      address: 'Brackenfell Blvd, Brackenfell, Cape Town, 7560',
      latitude: -33.8821,
      longitude: 18.6942,
    },
    {
      id: 'cu_pnp_jhb',
      name: 'Pick n Pay Johannesburg DC',
      contact_email: 'receiving@pnp.co.za',
      address: 'Milner St, Alliance, Benoni, 1501',
      latitude: -26.1912,
      longitude: 28.3142,
    },
    {
      id: 'cu_woolworths_dbn',
      name: 'Woolworths Durban DC',
      contact_email: 'dc_ops@woolworths.co.za',
      address: 'Prospecton Rd, Prospecton, Durban, 4110',
      latitude: -29.9854,
      longitude: 30.9125,
    },
    {
      id: 'cu_anglo_rust',
      name: 'Anglo Platinum Rustenburg Mine',
      contact_email: 'receiving_rust@anglo.com',
      address: 'Bleskop Division, Rustenburg, 0300',
      latitude: -25.6842,
      longitude: 27.2415,
    },
    {
      id: 'cu_sasol_secunda',
      name: 'Sasol Secunda Synfuels DC',
      contact_email: 'secunda.receiving@sasol.com',
      address: 'Charlie 1 Road, Secunda, 2302',
      latitude: -26.5124,
      longitude: 29.1842,
    },
    {
      id: 'cu_spar_pe',
      name: 'Spar Port Elizabeth DC',
      contact_email: 'pe_dc@spar.co.za',
      address: 'Grahamstown Rd, Deal Party, Gqeberha, 6001',
      latitude: -33.9124,
      longitude: 25.6142,
    },
  ],
  documents: [
    // Sipho's driving license (Expired)
    {
      id: 'doc_sipho_license',
      entity_type: 'driver',
      entity_id: 'dr_sipho',
      document_type: 'Professional Driving Permit (PrDP)',
      document_number: 'DL-SIPHO-7729',
      expiry_date: '2026-06-15', // Expired!
      status: 'expired',
    },
    // Chantal's driving license (Active)
    {
      id: 'doc_chantal_license',
      entity_type: 'driver',
      entity_id: 'dr_chantal',
      document_type: 'Professional Driving Permit (PrDP)',
      document_number: 'DL-CHANTAL-4102',
      expiry_date: '2029-03-05',
      status: 'active',
    },
    // Lerato's license (Expiring soon)
    {
      id: 'doc_lerato_license',
      entity_type: 'driver',
      entity_id: 'dr_lerato',
      document_type: 'Professional Driving Permit (PrDP)',
      document_number: 'DL-LERATO-0092',
      expiry_date: '2026-07-30', // Expiring soon (within 30 days)
      status: 'expiring_soon',
    },
    // Vehicle CA 123-456 Certificate of Fitness (Active)
    {
      id: 'doc_actros_cof',
      entity_type: 'vehicle',
      entity_id: 'vh_actros_1',
      document_type: 'Certificate of Fitness (COF)',
      document_number: 'COF-ACT-8827',
      expiry_date: '2027-01-10',
      status: 'active',
    },
    // Vehicle GP 987-654 Certificate of Fitness (Expiring soon)
    {
      id: 'doc_fh16_cof',
      entity_type: 'vehicle',
      entity_id: 'vh_fh16_2',
      document_type: 'Certificate of Fitness (COF)',
      document_number: 'COF-FH16-1029',
      expiry_date: '2026-07-15', // Expiring soon
      status: 'expiring_soon',
    },
    // Vehicle ND 456-789 Certificate of Fitness (Active)
    {
      id: 'doc_scania_cof',
      entity_type: 'vehicle',
      entity_id: 'vh_scania_3',
      document_type: 'Certificate of Fitness (COF)',
      document_number: 'COF-SCA-0982',
      expiry_date: '2026-12-18',
      status: 'active',
    },
    // Note: Vehicle CY 852-963 lacks COF entirely in list, triggering "Missing COF" insight!
  ],
  incidents: [
    {
      id: 'inc_1',
      company_id: 'co_zapp_sa',
      job_id: 'job_pieter_fail_1',
      driver_id: 'dr_pieter',
      vehicle_id: 'vh_fh16_2',
      severity: 'high',
      description: 'Minor bumper bashing during gate entry maneuver. Damaged customer perimeter gate.',
      occurred_at: '2026-07-05T09:30:00Z',
      reported_by: 'Pieter Oosthuizen',
    },
    {
      id: 'inc_2',
      company_id: 'co_zapp_sa',
      job_id: 'job_pieter_fail_2',
      driver_id: 'dr_pieter',
      vehicle_id: 'vh_fh16_2',
      severity: 'critical', // CRITICAL incident!
      description: 'Trailer rollover on ramp due to high entry speed. Destroyed cargo pallets.',
      occurred_at: '2026-07-06T14:15:00Z',
      reported_by: 'Mine Gate Security',
    },
  ],
  maintenanceTasks: [
    {
      id: 'mt_1',
      vehicle_id: 'vh_actros_1',
      task_type: 'Brake Disc Replacement & Fluid Flush',
      scheduled_date: '2026-07-01T08:00:00Z', // OVERDUE!
      completed_date: null,
      cost: 15400,
      status: 'overdue',
      notes: 'Brake sensor has intermittent signal fault. Essential replacement scheduled but deferred.',
    },
    {
      id: 'mt_2',
      vehicle_id: 'vh_scania_3',
      task_type: 'Regular 150k km Service',
      scheduled_date: '2026-06-20T07:30:00Z',
      completed_date: '2026-06-20T16:00:00Z',
      cost: 8500,
      status: 'completed',
      notes: 'All filters changed, brake pad check passed, oil refilled.',
    },
  ],
  trackingSessions: [
    {
      id: 'ts_active_1',
      job_id: 'job_sipho_active_ct',
      driver_id: 'dr_sipho',
      vehicle_id: 'vh_actros_1',
      start_time: '2026-07-07T05:30:00Z',
      end_time: null,
      status: 'active',
    },
    {
      id: 'ts_ended_2',
      job_id: 'job_lerato_late_1',
      driver_id: 'dr_lerato',
      vehicle_id: 'vh_gmc_6',
      start_time: '2026-07-06T08:00:00Z',
      end_time: '2026-07-06T13:30:00Z',
      status: 'ended',
    },
  ],
  trackingSummaries: [
    {
      id: 'ts_sum_1',
      tracking_session_id: 'ts_active_1',
      total_distance_km: 420,
      average_speed_kmh: 78,
      telemetry_points_count: 5, // CRITICAL DROP! (Expected 120 points)
      expected_points_count: 120,
      stationary_duration_minutes: 15,
      GPS_coverage_percentage: 40, // Low GPS coverage
      rejected_telemetry_percentage: 45, // High noise/rejected
    },
    {
      id: 'ts_sum_2',
      tracking_session_id: 'ts_ended_2',
      total_distance_km: 380,
      average_speed_kmh: 70,
      telemetry_points_count: 320,
      expected_points_count: 350,
      stationary_duration_minutes: 180, // Excessive stationary duration (>120 mins)
      GPS_coverage_percentage: 92,
      rejected_telemetry_percentage: 2,
    },
  ],
  jobs: [
    // 1. Jobs for Sipho Ndlovu
    {
      id: 'job_sipho_1',
      company_id: 'co_zapp_sa',
      title: 'Beverage Pallet Distribution CT',
      status: 'completed',
      driver_id: 'dr_sipho',
      vehicle_id: 'vh_actros_1',
      customer_id: 'cu_shoprite_ct',
      planned_start_time: '2026-07-02T06:00:00Z',
      actual_start_time: '2026-07-02T06:55:00Z', // Started 55m LATE! (Sipho late start)
      planned_end_time: '2026-07-02T10:00:00Z',
      actual_end_time: '2026-07-02T11:45:00Z', // Completed late.
      destination_address: 'Brackenfell Blvd, Brackenfell, Cape Town, 7560',
      created_at: '2026-07-01T12:00:00Z',
    },
    {
      id: 'job_sipho_2',
      company_id: 'co_zapp_sa',
      title: 'General Foodstuff Shoprite Brackenfell',
      status: 'completed',
      driver_id: 'dr_sipho',
      vehicle_id: 'vh_actros_1', // Vehicle CA 123-456 used again with brake fault!
      customer_id: 'cu_shoprite_ct', // Repeated delay at Shoprite CT!
      planned_start_time: '2026-07-04T07:00:00Z',
      actual_start_time: '2026-07-04T07:50:00Z', // Started 50m LATE! (Sipho late start)
      planned_end_time: '2026-07-04T11:00:00Z',
      actual_end_time: '2026-07-04T12:35:00Z', // Completed 95m late.
      destination_address: 'Brackenfell Blvd, Brackenfell, Cape Town, 7560',
      created_at: '2026-07-03T12:00:00Z',
    },
    {
      id: 'job_sipho_active_ct',
      company_id: 'co_zapp_sa',
      title: 'Shoprite Ambient Stock Delivery',
      status: 'active',
      driver_id: 'dr_sipho',
      vehicle_id: 'vh_actros_1',
      customer_id: 'cu_shoprite_ct',
      planned_start_time: '2026-07-07T05:00:00Z',
      actual_start_time: '2026-07-07T05:30:00Z', // Started 30m late.
      planned_end_time: '2026-07-07T09:00:00Z',
      actual_end_time: null,
      destination_address: 'Brackenfell Blvd, Brackenfell, Cape Town, 7560',
      created_at: '2026-07-06T15:00:00Z',
    },

    // 2. Jobs for Pieter Oosthuizen
    {
      id: 'job_pieter_fail_1',
      company_id: 'co_zapp_sa',
      title: 'Bulk Ore Transfer JHB',
      status: 'failed', // Failed job 1
      driver_id: 'dr_pieter',
      vehicle_id: 'vh_fh16_2',
      customer_id: 'cu_anglo_rust',
      planned_start_time: '2026-07-05T06:00:00Z',
      actual_start_time: '2026-07-05T06:10:00Z',
      planned_end_time: '2026-07-05T10:00:00Z',
      actual_end_time: null,
      destination_address: 'Bleskop Division, Rustenburg, 0300',
      created_at: '2026-07-04T10:00:00Z',
    },
    {
      id: 'job_pieter_fail_2',
      company_id: 'co_zapp_sa',
      title: 'Industrial Heavy Load Rustenburg',
      status: 'failed', // Failed job 2
      driver_id: 'dr_pieter',
      vehicle_id: 'vh_fh16_2', // Repeated vehicle incident link
      customer_id: 'cu_anglo_rust', // Repeated customer failed delivery
      planned_start_time: '2026-07-06T08:00:00Z',
      actual_start_time: '2026-07-06T08:15:00Z',
      planned_end_time: '2026-07-06T13:00:00Z',
      actual_end_time: null,
      destination_address: 'Bleskop Division, Rustenburg, 0300',
      created_at: '2026-07-05T14:00:00Z',
    },

    // 3. Jobs for Thabo Mokoena
    {
      id: 'job_thabo_1',
      company_id: 'co_zapp_sa',
      title: 'Durban Cold Chain Woolworths',
      status: 'completed',
      driver_id: 'dr_thabo',
      vehicle_id: 'vh_scania_3',
      customer_id: 'cu_woolworths_dbn',
      planned_start_time: '2026-07-03T05:00:00Z',
      actual_start_time: '2026-07-03T05:02:00Z', // On time!
      planned_end_time: '2026-07-03T09:00:00Z',
      actual_end_time: '2026-07-03T08:55:00Z', // Completed ahead of schedule!
      destination_address: 'Prospecton Rd, Prospecton, Durban, 4110',
      created_at: '2026-07-02T08:00:00Z',
    },
    {
      id: 'job_thabo_2',
      company_id: 'co_zapp_sa',
      title: 'Durban Fresh Produce Delivery',
      status: 'completed',
      driver_id: 'dr_thabo',
      vehicle_id: 'vh_scania_3',
      customer_id: 'cu_woolworths_dbn',
      planned_start_time: '2026-07-05T05:00:00Z',
      actual_start_time: '2026-07-05T05:05:00Z', // On time!
      planned_end_time: '2026-07-05T09:00:00Z',
      actual_end_time: '2026-07-05T08:50:00Z', // On time!
      destination_address: 'Prospecton Rd, Prospecton, Durban, 4110',
      created_at: '2026-07-04T08:00:00Z',
    },

    // 4. Jobs for Lerato Molefe
    {
      id: 'job_lerato_late_1',
      company_id: 'co_zapp_sa',
      title: 'Secunda Gas Cylinder Refill',
      status: 'completed',
      driver_id: 'dr_lerato',
      vehicle_id: 'vh_gmc_6',
      customer_id: 'cu_sasol_secunda',
      planned_start_time: '2026-07-06T06:00:00Z',
      actual_start_time: '2026-07-06T08:00:00Z', // Started 120 mins late! (Lerato late start 1)
      planned_end_time: '2026-07-06T10:00:00Z',
      actual_end_time: '2026-07-06T13:30:00Z', // Finished 210 mins late (Stationary time was high)
      destination_address: 'Charlie 1 Road, Secunda, 2302',
      created_at: '2026-07-05T12:00:00Z',
    },
    {
      id: 'job_lerato_late_2',
      company_id: 'co_zapp_sa',
      title: 'Secunda Synfuels Bulk Feed',
      status: 'completed',
      driver_id: 'dr_lerato',
      vehicle_id: 'vh_gmc_6',
      customer_id: 'cu_sasol_secunda', // Repeated customer delays!
      planned_start_time: '2026-07-07T06:00:00Z',
      actual_start_time: '2026-07-07T07:15:00Z', // Started 75 mins late! (Lerato late start 2)
      planned_end_time: '2026-07-07T10:00:00Z',
      actual_end_time: '2026-07-07T12:30:00Z', // Completed 150 mins late.
      destination_address: 'Charlie 1 Road, Secunda, 2302',
      created_at: '2026-07-06T12:00:00Z',
    },

    // 5. Jobs for Chantal Govender
    {
      id: 'job_chantal_1',
      company_id: 'co_zapp_sa',
      title: 'Spar DC Port Elizabeth Retail Load',
      status: 'completed',
      driver_id: 'dr_chantal',
      vehicle_id: 'vh_tgx_4',
      customer_id: 'cu_spar_pe',
      planned_start_time: '2026-07-04T07:00:00Z',
      actual_start_time: '2026-07-04T07:05:00Z',
      planned_end_time: '2026-07-04T12:00:00Z',
      actual_end_time: '2026-07-04T12:10:00Z',
      destination_address: 'Grahamstown Rd, Deal Party, Gqeberha, 6001',
      created_at: '2026-07-03T09:00:00Z',
    },

    // 6. Generic historical data points to populate total metrics (14 more simple jobs)
    ...Array.from({ length: 14 }).map((_, index) => {
      const idNum = index + 10;
      const day = (idNum % 4) + 1; // 1 to 4 July
      const driverId = ['dr_thabo', 'dr_chantal', 'dr_lerato'][index % 3];
      const vehicleId = ['vh_scania_3', 'vh_tgx_4', 'vh_gmc_6'][index % 3];
      const customerId = ['cu_woolworths_dbn', 'cu_spar_pe', 'cu_pnp_jhb'][index % 3];

      return {
        id: `job_hist_${idNum}`,
        company_id: 'co_zapp_sa',
        title: `Standard Distribution Trip #${idNum}`,
        status: 'completed' as const,
        driver_id: driverId,
        vehicle_id: vehicleId,
        customer_id: customerId,
        planned_start_time: `2026-07-0${day}T08:00:00Z`,
        actual_start_time: `2026-07-0${day}T08:05:00Z`,
        planned_end_time: `2026-07-0${day}T12:00:00Z`,
        actual_end_time: `2026-07-0${day}T11:58:00Z`,
        destination_address: 'Gauteng & Durban Inter-city Highways',
        created_at: `2026-06-30T10:00:00Z`,
      };
    }),
  ],
  jobEvents: [
    {
      id: 'je_1',
      job_id: 'job_sipho_1',
      event_type: 'started',
      timestamp: '2026-07-02T06:55:00Z',
      payload: { description: 'Driver Sipho departed late due to loading dock bottlenecks at dispatch.' },
    },
    {
      id: 'je_2',
      job_id: 'job_sipho_1',
      event_type: 'delay_logged',
      timestamp: '2026-07-02T09:30:00Z',
      payload: { description: 'Vehicle waiting at customer gate entrance.', reason: 'Waiting in queue at Brackenfell' },
    },
    {
      id: 'je_3',
      job_id: 'job_sipho_2',
      event_type: 'delay_logged',
      timestamp: '2026-07-04T10:15:00Z',
      payload: { description: 'Driver reports 90-minute delay due to customer offload computer crash.', reason: 'customer_delay' },
    },
    {
      id: 'je_4',
      job_id: 'job_pieter_fail_1',
      event_type: 'failed',
      timestamp: '2026-07-05T09:30:00Z',
      payload: { description: 'Collision at mine terminal gate.', reason: 'incident' },
    },
    {
      id: 'je_5',
      job_id: 'job_pieter_fail_2',
      event_type: 'failed',
      timestamp: '2026-07-06T14:15:00Z',
      payload: { description: 'Vehicle rollover on exit ramp.', reason: 'safety_incident' },
    },
    {
      id: 'je_6',
      job_id: 'job_lerato_late_1',
      event_type: 'delay_logged',
      timestamp: '2026-07-06T11:00:00Z',
      payload: { description: 'Vehicle stationary at N1 service depot.', reason: 'unloading_delay' },
    },
  ],
};
