/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CompanyOnboardingInput,
  OnboardingOutput,
  PilotWeekPlan,
  PricingCalculatorInput,
  PricingCalculatorOutput,
  ROIDashboardOutput,
  CommercialProposal,
  CustomerSuccessScorecard,
  ObjectionHandlingItem,
  SalesDemoStep,
  CommercialReadinessChecklist,
  SupportProcessCard
} from './types';

export class ZappCommercialService {

  // ----------------------------------------------------
  // 1. DEMO TENANT MODE
  // ----------------------------------------------------
  public static getDemoTenantData() {
    return {
      metadata: {
        is_simulated: true,
        environment: "Commercial Sandbox Mockup - Phase 14",
        generated_at: new Date().toISOString()
      },
      vehicles: [
        { id: "DEMO_VH_01", plate: "KCD 104X", type: "Scania Heavy Tipper", state: "active", fuel_level_pct: 82, current_depot: "Nairobi Industrial Depot" },
        { id: "DEMO_VH_02", plate: "KBY 980P", type: "Volvo Fuel Tanker", state: "active", fuel_level_pct: 65, current_depot: "Mombasa Terminal" },
        { id: "DEMO_VH_03", plate: "KAA 092C", type: "Isuzu Medium Box", state: "active", fuel_level_pct: 90, current_depot: "Nairobi Industrial Depot" },
        { id: "DEMO_VH_04", plate: "KCD 203B", type: "Mercedes Cargo Carrier", state: "delayed", fuel_level_pct: 44, current_depot: "Nakuru Highway Hub" },
        { id: "DEMO_VH_05", plate: "KBZ 778Y", type: "FAW 10-Wheeler Tipper", state: "maintenance", fuel_level_pct: 12, current_depot: "Nairobi Workshop" },
        { id: "DEMO_VH_06", plate: "KBA 445L", type: "Toyota Hilux Escort", state: "active", fuel_level_pct: 78, current_depot: "Mombasa Terminal" },
        { id: "DEMO_VH_07", plate: "KCB 901M", type: "Scania Fuel Tanker", state: "active", fuel_level_pct: 54, current_depot: "Mombasa Terminal" },
        { id: "DEMO_VH_08", plate: "KCC 123D", type: "Isuzu Heavy Tipper", state: "active", fuel_level_pct: 35, current_depot: "Nakuru Highway Hub" },
        { id: "DEMO_VH_09", plate: "KCD 456E", type: "Volvo Cargo Carrier", state: "maintenance_fault", fuel_level_pct: 50, current_depot: "Nairobi Workshop" },
        { id: "DEMO_VH_10", plate: "KCE 789F", type: "Mercedes Fuel Tanker", state: "offline", fuel_level_pct: 0, current_depot: "Unknown Route Area" }
      ],
      devices: [
        { serial: "DEMO_DEV_P1_001", model: "Zapp Box P1 Pro", status: "online", signal_strength_dbm: -64, firmware: "v2.4.13-pilot", battery_voltage: "12.8V" },
        { serial: "DEMO_DEV_P1_002", model: "Zapp Box P1 Pro", status: "online", signal_strength_dbm: -70, firmware: "v2.4.13-pilot", battery_voltage: "12.6V" },
        { serial: "DEMO_DEV_P1_003", model: "Zapp Box P1 Pro", status: "online", signal_strength_dbm: -58, firmware: "v2.4.13-pilot", battery_voltage: "13.1V" },
        { serial: "DEMO_DEV_P1_004", model: "Zapp Box P1 Pro", status: "intermittent", signal_strength_dbm: -92, firmware: "v2.4.13-pilot", battery_voltage: "11.9V" },
        { serial: "DEMO_DEV_P1_005", model: "Zapp Box P1 Lite", status: "maintenance", signal_strength_dbm: -105, firmware: "v2.4.11-pilot", battery_voltage: "10.4V" },
        { serial: "DEMO_DEV_P1_006", model: "Zapp Box P1 Pro", status: "online", signal_strength_dbm: -61, firmware: "v2.4.13-pilot", battery_voltage: "12.9V" },
        { serial: "DEMO_DEV_P1_007", model: "Zapp Box P1 Pro", status: "online", signal_strength_dbm: -68, firmware: "v2.4.13-pilot", battery_voltage: "12.7V" },
        { serial: "DEMO_DEV_P1_008", model: "Zapp Box P1 Lite", status: "online", signal_strength_dbm: -75, firmware: "v2.4.11-pilot", battery_voltage: "12.2V" },
        { serial: "DEMO_DEV_P1_009", model: "Zapp Box P1 Pro", status: "faulty_power", signal_strength_dbm: -110, firmware: "v2.4.13-pilot", battery_voltage: "8.5V" },
        { serial: "DEMO_DEV_P1_010", model: "Zapp Box P1 Pro", status: "offline", signal_strength_dbm: -120, firmware: "v2.4.13-pilot", battery_voltage: "0.0V" }
      ],
      drivers: [
        { id: "DEMO_DR_01", name: "John Kamau", license: "Class A, B, C, E", prdp_expiry: "2026-12-01", status: "on_duty", current_vehicle: "KCD 104X" },
        { id: "DEMO_DR_02", name: "David Mwangi", license: "Class B, C", prdp_expiry: "2026-08-15", status: "on_duty", current_vehicle: "KBY 980P" },
        { id: "DEMO_DR_03", name: "Sarah Wangari", license: "Class B, C, E", prdp_expiry: "2026-09-11", status: "on_duty", current_vehicle: "KAA 092C" },
        { id: "DEMO_DR_04", name: "Hassan Juma", license: "Class A, B, C", prdp_expiry: "2026-11-20", status: "on_duty", current_vehicle: "KCD 203B" },
        { id: "DEMO_DR_05", name: "Alex Kiptoo", license: "Class B, C, Heavy Tanker", prdp_expiry: "2026-07-30", status: "on_duty", current_vehicle: "KCB 901M" },
        { id: "DEMO_DR_06", name: "Grace Muthoni", license: "Class B, C", prdp_expiry: "2026-05-10", status: "suspended_compliance", current_vehicle: "None" },
        { id: "DEMO_DR_07", name: "Peter Ochieng", license: "Class A, B, C", prdp_expiry: "2027-01-14", status: "off_duty", current_vehicle: "None" },
        { id: "DEMO_DR_08", name: "Fatma Ali", license: "Class B, C, E", prdp_expiry: "2026-10-05", status: "on_duty", current_vehicle: "KBA 445L" },
        { id: "DEMO_DR_09", name: "Joseph Nganga", license: "Class B, C", prdp_expiry: "2026-09-30", status: "on_duty", current_vehicle: "KCC 123D" },
        { id: "DEMO_DR_10", name: "Daniel Wambua", license: "Class B, C", prdp_expiry: "2026-07-01", status: "expired_prdp", current_vehicle: "None" },
        { id: "DEMO_DR_11", name: "Lucy Njeri", license: "Class A, B", prdp_expiry: "2027-03-02", status: "off_duty", current_vehicle: "None" },
        { id: "DEMO_DR_12", name: "Moses Simiyu", license: "Class B, C, E", prdp_expiry: "2026-11-15", status: "on_duty", current_vehicle: "KCE 789F" }
      ],
      dispatchers: [
        { id: "DEMO_DSP_01", name: "James Mwangi", shift: "Morning", active_jobs: 4 },
        { id: "DEMO_DSP_02", name: "Esther Wanjiku", shift: "Afternoon", active_jobs: 3 },
        { id: "DEMO_DSP_03", name: "Hillary Kiprop", shift: "Night", active_jobs: 1 }
      ],
      supervisors: [
        { id: "DEMO_SUP_01", name: "Director Francis Ndegwa", region: "East Africa Hub" },
        { id: "DEMO_SUP_02", name: "Manager Alice Achieng", region: "Nairobi Command" }
      ],
      customers: [
        { id: "DEMO_CST_01", name: "Mombasa Maritime Logistics", sector: "Import/Export", priority: "critical" },
        { id: "DEMO_CST_02", name: "Kisumu Agro Foods", sector: "Agriculture", priority: "high" },
        { id: "DEMO_CST_03", name: "Nairobi Retail Hubs Ltd", sector: "Consumer Goods", priority: "medium" },
        { id: "DEMO_CST_04", name: "East African Breweries Agent", sector: "Beverages", priority: "high" },
        { id: "DEMO_CST_05", name: "Lake Basin Petrol Consortium", sector: "Petroleum", priority: "critical" }
      ],
      depots: [
        { id: "DEP_NBO", name: "Nairobi Industrial Depot", capacity_vehicles: 40, active_now: 15 },
        { id: "DEP_MSA", name: "Mombasa Terminal", capacity_vehicles: 30, active_now: 8 },
        { id: "DEP_NKR", name: "Nakuru Highway Hub", capacity_vehicles: 20, active_now: 4 }
      ],
      jobs: [
        { id: "JOB_DEMO_901", vehicle: "KCD 104X", driver: "John Kamau", route: "Nairobi Industrial ➔ Mombasa Terminal", status: "in_transit", eta: "14:30", delay: "none" },
        { id: "JOB_DEMO_902", vehicle: "KAA 092C", driver: "Sarah Wangari", route: "Nairobi Industrial ➔ Nakuru Highway Hub", status: "completed", eta: "09:15", delay: "none" },
        { id: "JOB_DEMO_903", vehicle: "KCD 203B", driver: "Hassan Juma", route: "Mombasa Terminal ➔ Nairobi Industrial Depot", status: "delayed", eta: "17:45", delay: "cellular_dropout_holding" },
        { id: "JOB_DEMO_904", vehicle: "KCB 901M", driver: "Alex Kiptoo", route: "Mombasa Terminal ➔ Kisumu Depot Hub", status: "in_transit", eta: "21:00", delay: "minor_traffic" }
      ],
      deviations: [
        { id: "DEV_01", job_id: "JOB_DEMO_903", type: "Geofence Exit Bypass", location: "Maungu Transit Point", severity: "warning", message: "Vehicle left designated trade-route corridor; supervisor dispatch logs override detected." }
      ],
      device_issues: [
        { id: "DI_01", serial: "DEMO_DEV_P1_004", fault: "Intermittent GPS connection lock", severity: "warning", recommended: "Check external patch antenna mounting on terminal bracket." },
        { id: "DI_02", serial: "DEMO_DEV_P1_009", fault: "Low primary battery input line", severity: "critical", recommended: "Alert mechanic, potential alternator regulator malfunction." }
      ],
      compliance_warnings: [
        { id: "CW_01", entity: "Grace Muthoni (Driver)", issue: "Expired PrDP License", deadline: "Expired May 10, 2026", severity: "critical" },
        { id: "CW_02", entity: "KCD 104X (Vehicle)", issue: "Certificate of Fitness Renewal Pending", deadline: "Expires in 4 days", severity: "warning" }
      ],
      maintenance_dtc: [
        { id: "DTC_01", vehicle: "KBY 980P", code: "SPN 94 FMI 17", system: "Engine Fuel Delivery", severity: "warning", description: "Low Fuel Delivery Pressure - diagnostic recommendation for filter change." },
        { id: "DTC_02", vehicle: "KCD 456E", code: "SPN 111 FMI 1", system: "Cooling Circuit", severity: "critical", description: "Coolant Level Critical Low - vehicle workshop booking triggered." }
      ],
      incidents: [
        {
          id: "INC_DEMO_SOS_01",
          type: "SOS PANIC BYPASS",
          vehicle: "KBY 980P",
          driver: "David Mwangi",
          status: "investigating_supervisor_review",
          zapp_brain_insight: "Panic loop active. Primary battery input stable at 12.6V. Driver triggered cabin safety switch. Cellular connection good (-70dBm). Zapp Brain recommends immediate supervisor call back to avoid false security alarm dispatch.",
          timeline: [
            { time: "08:15", event: "Driver switch press detected" },
            { time: "08:16", event: "Automated packet ingestion verifies battery line is normal" },
            { time: "08:17", event: "Zapp Brain registers diagnostic bypass advice" }
          ]
        },
        {
          id: "INC_DEMO_RESOLVED_01",
          type: "Cellular Outage Blackout",
          vehicle: "KAA 092C",
          driver: "Sarah Wangari",
          status: "resolved",
          zapp_brain_insight: "Recovered successfully. Cellular signal dropped below -112dBm for 18 minutes during Nakuru Rift valley descent. Lightstream stored 14 diagnostic packets in memory and flushed upon reconnection.",
          timeline: [
            { time: "Yesterday 16:10", event: "Signal connection lost" },
            { time: "Yesterday 16:28", event: "Signal recovered, packet cache successfully uploaded" },
            { time: "Yesterday 16:30", event: "Incident resolved manually by Dispatcher James" }
          ],
          resolution: "Verified as geographic network shadow zone during Rift descent. Telemetry completed. Asset delivered on-time."
        }
      ],
      audits: [
        { timestamp: "2026-07-11T07:15:00Z", operator: "James Mwangi (Dispatcher)", action: "Acknowledge Panic Case INC_DEMO_SOS_01" },
        { timestamp: "2026-07-11T06:30:00Z", operator: "Alice Achieng (Supervisor)", action: "Registered custom geofence trade corridor for Mombasa Petroleum Pipeline route" },
        { timestamp: "2026-07-11T05:10:00Z", operator: "James Mwangi (Dispatcher)", action: "Approved vehicle KCD 104X daily dispatch checklist" }
      ]
    };
  }

  // ----------------------------------------------------
  // 2. CUSTOMER ONBOARDING FLOW & Setup Optimizer
  // ----------------------------------------------------
  public static calculateOnboardingOutput(input: CompanyOnboardingInput): OnboardingOutput {
    const missing: string[] = [];
    if (!input.companyName.trim()) missing.push("Company Name");
    if (input.vehicleTypes.length === 0) missing.push("Vehicle Type Classification");
    if (!input.currentTracker) missing.push("Current Tracking Provider Detail");
    if (input.topPainPoints.length === 0) missing.push("Operational Pain Points Selection");
    if (input.selectedVehicleCount <= 0) missing.push("Identified Pilot Vehicles");

    const Complexity = input.fleetSize > 100 || input.deviceReadinessStatus === 'needs_procurement' ? 'high'
      : input.fleetSize > 30 || input.deviceReadinessStatus === 'mixed' ? 'medium' : 'low';

    let recSimPlan = "Standard Regional Logistics Template";
    if (input.topPainPoints.includes("Frequent Route Deviations") || input.complianceNeeds.includes("Custom geofencing")) {
      recSimPlan = "Geofencing & Route Adherence Compliance Stress Simulation";
    } else if (input.topPainPoints.includes("Poor cellular tracking") || input.topPainPoints.includes("High delays on routes")) {
      recSimPlan = "Lightstream Carrier Blackout Recovery Simulation";
    } else if (input.maintenanceNeeds.includes("DTC diagnostic codes")) {
      recSimPlan = "J1939 CAN Diagnostic Telemetry simulation";
    }

    const recVehiclesCount = Math.max(5, Math.min(20, input.selectedVehicleCount));

    return {
      summary: `Onboarding analysis for ${input.companyName || "Untitled Prospect"} completed. Identified ${input.fleetSize} total fleet size in the ${input.operatingRegion} operating region. Standard pilot setup will consist of ${recVehiclesCount} fitted vehicles.`,
      recommendedPilotSetup: {
        pilotVehiclesCount: recVehiclesCount,
        suggestedDevices: `Zapp Box P1 Pro with external cellular whip antennas (${recVehiclesCount} units)`,
        suggestedSimPlan: recSimPlan,
        regionalFocus: `${input.operatingRegion} Highway Transit Corridors`
      },
      missingInfoChecklist: missing,
      estimatedComplexity: Complexity
    };
  }

  // ----------------------------------------------------
  // 3. 30-DAY PILOT PLAN GENERATOR
  // ----------------------------------------------------
  public static generate30DayPilotPlan(companyName: string): PilotWeekPlan[] {
    return [
      {
        week: 1,
        title: "Setup, Onboarding & Baseline Configuration",
        objectives: [
          "Complete profile ingestion and register core master lists (vehicles, drivers, depots).",
          "Identify and isolate 5-10 pilot test vehicles for Zapp Box device fitment.",
          "Establish dispatcher desktop access credentials and run a full walkthrough of the Demo Tenant Environment."
        ],
        tasks: [
          {
            task_id: "W1_01",
            title: "Fleet Master Data Import",
            description: "Map vehicle chassis types, fuel tank shapes, and driver cellular details into the ZappOS staging directory.",
            customer_resp: "Upload fleet spreadsheet (.csv or .json) outlining pilot assets.",
            zapp_resp: "Validate schemas and pre-populate local sandbox database slots.",
            success_metric: "All pilot vehicles and active drivers loaded without schema overlap.",
            deliverable: "Fleet Registry Ingestion Report"
          },
          {
            task_id: "W1_02",
            title: "Fitment & Mounting Inspection",
            description: "Plan physical installation locations for mock Zapp Box telemetry hardware.",
            customer_resp: "Complete vehicle access scheduling at the primary Nairobi depot.",
            zapp_resp: "Verify power lines and external mounting points via digital checklists.",
            success_metric: "All pilot vehicles assigned designated hardware serial profiles.",
            deliverable: "Fitment Readiness Protocol"
          }
        ],
        risks: [
          "Vehicle unavailability due to urgent ad-hoc deliveries.",
          "Missing or incomplete driver Professional Permit (PrDP) records in customer files."
        ]
      },
      {
        week: 2,
        title: "Live Dispatch, Signal Audits & Telemetry Testing",
        objectives: [
          "Verify consistent browser-to-server data ingestion rates across regional highway corridors.",
          "Conduct simulated cellular dropout audits using the Lightstream compression simulator.",
          "Validate dispatcher panel UI notifications for route delayed states."
        ],
        tasks: [
          {
            task_id: "W2_01",
            title: "Uptime & Packet Delivery Analysis",
            description: "Track live packet count ingestion to verify network stability on standard cargo routes.",
            customer_resp: "Keep dispatchers logged into the console during daily shifts.",
            zapp_resp: "Monitor telemetry packet loss ratio and output telemetry quality scorecard.",
            success_metric: "Average telemetry signal uptime exceeding 85% on trade corridors.",
            deliverable: "Weekly Signal & Ingestion Quality Ledger"
          },
          {
            task_id: "W2_02",
            title: "Zapp Brain Alert Verification",
            description: "Simulate cargo delay scenarios to check intelligent advisory message generation.",
            customer_resp: "Dispatcher reviews recommended playbooks when alert indicators flash.",
            zapp_resp: "Run simulated Nakuru traffic bottlenecks to trigger warning overlays.",
            success_metric: "Dispatchers acknowledge generated playbook warnings within 5 minutes of trigger.",
            deliverable: "Advisory Reaction Audit Logs"
          }
        ],
        risks: [
          "High cellular roaming latency in border terminal sectors.",
          "Dispatcher resistance to utilizing new browser notifications during busy hours."
        ]
      },
      {
        week: 3,
        title: "Regulatory Compliance, Maintenance & Support Integration",
        objectives: [
          "Integrate vehicle engine fault DTC indicators to test early warning maintenance checklists.",
          "Set up regulatory permit tracking (Certificate of Fitness, Speed Governor calibration).",
          "Conduct mock technician helpdesk support escalation exercises."
        ],
        tasks: [
          {
            task_id: "W3_01",
            title: "Vehicle DTC Diagnostic Mapping",
            description: "Audit engine cooling, transmission, and exhaust error codes on the maintenance sub-board.",
            customer_resp: "Flag vehicles showing physical oil or dashboard warning indicators.",
            zapp_resp: "Match raw simulated SPN/FMI warning metrics with clear human explanation cards.",
            success_metric: "Critical cooling circuit alarms successfully route to the active maintenance ticket queue.",
            deliverable: "Pilot Maintenance Diagnostic Matrix"
          },
          {
            task_id: "W3_02",
            title: "Regulatory Compliance Enforcement",
            description: "Enable system alerts for expired driver licenses and out-of-date speed gov safety certs.",
            customer_resp: "Verify validity dates against local transport authority lists.",
            zapp_resp: "Flag out-of-compliance operators on the main dispatcher command feed.",
            success_metric: "100% of expired operating permits flagged before vehicle dispatch.",
            deliverable: "Compliance Risk Assessment Summary"
          }
        ],
        risks: [
          "Lack of direct CAN engine telemetry data on older heavy trucks.",
          "Delay in receiving renewed driver credentials from HR database."
        ]
      },
      {
        week: 4,
        title: "ROI Ingestion, Performance Audit & Enterprise Scaling Decisions",
        objectives: [
          "Quantify overall pilot delay reductions, fuel idling optimizations, and speed compliance rates.",
          "Compare live pilot success scorecard with pre-onboarding performance benchmarks.",
          "Generate final scale-readiness index reports for board-level review."
        ],
        tasks: [
          {
            task_id: "W4_01",
            title: "Honest ROI Calculation Review",
            description: "Calculate proven financial savings based on reduced missed deliveries and dispatcher productivity gains.",
            customer_resp: "Provide baseline average cost parameters for delayed deliveries and idle fuel consumption.",
            zapp_resp: "Run ROI simulation reports contrasting pilot performance with typical baseline rates.",
            success_metric: "Calculated payback period on pilot costs is proven to be under 6 months.",
            deliverable: "Custom Board-Ready ROI Presentation PDF"
          },
          {
            task_id: "W4_02",
            title: "Enterprise Scaling Assessment",
            description: "Review outstanding telemetry, hardware, or process blockages before full fleet roll-out.",
            customer_resp: "Executive leadership reviews the ZappOS 30-Day commercial offer.",
            zapp_resp: "Formulate recommended corrective fixes for any flagged scaling blockers.",
            success_metric: "Overall Scaling Readiness Index scores above 85/100 points.",
            deliverable: "Phase 14 Pilot Final Completion Report"
          }
        ],
        risks: [
          "Skepticism of ROI assumptions if baseline customer historical data was highly inaccurate.",
          "Budget procurement delays for the wider multi-region hardware expansion."
        ]
      }
    ];
  }

  // ----------------------------------------------------
  // 4. PRICING CALCULATOR
  // ----------------------------------------------------
  public static calculatePricing(input: PricingCalculatorInput): PricingCalculatorOutput {
    const ratePerVehicle = 15; // USD/mo
    const ratePerDevice = 25;  // USD/mo
    const ratePerSeat = 50;    // USD/mo

    const setupFeeConst = input.includeSetupFee ? 500 : 0;
    const fitmentFeeConst = input.includeFitmentFee ? (75 * input.vehicleCount) : 0;
    
    let supportFee = 0;
    if (input.premiumSupportLevel === 'standard') supportFee = 150;
    if (input.premiumSupportLevel === 'enterprise_24_7') supportFee = 450;

    // Monthly recurring calculations
    let mrr = (input.vehicleCount * ratePerVehicle) + 
              (input.activeDeviceCount * ratePerDevice) + 
              (input.dispatcherSeatsCount * ratePerSeat) +
              supportFee;

    if (input.isEnterpriseCustom) {
      mrr = mrr * 0.90; // 10% volume discount
    }

    const onceOffSetup = setupFeeConst + fitmentFeeConst;

    // Let's assume a standard 30-day pilot discount is applied to setup
    const pilotDiscount = input.vehicleCount > 10 ? 25 : 15; // percent discount on setup

    const discountedSetup = onceOffSetup * (1 - pilotDiscount / 100);

    const projectedACV = mrr * 12;
    const grossRevenueEstimate = discountedSetup + (mrr * 12);

    return {
      monthlyRecurringRevenue: Math.round(mrr),
      onceOffSetupRevenue: Math.round(discountedSetup),
      pilotDiscount: pilotDiscount,
      projectedAnnualContractValue: Math.round(projectedACV),
      grossRevenueEstimate: Math.round(grossRevenueEstimate)
    };
  }

  // ----------------------------------------------------
  // 5. ROI DASHBOARD ESTIMATOR
  // ----------------------------------------------------
  public static estimateROI(vehicleCount: number, avgDailyTripsPerVehicle: number): ROIDashboardOutput {
    const costPerDelayHour = 45; // USD
    const costPerMissedDelivery = 180; // USD
    const costPerGallonFuel = 4.8; // USD
    
    // Monthly assumptions
    const delaysPrevented = vehicleCount * 1.8; // trips saved from major delays/mo
    const delayHoursSaved = delaysPrevented * 2.5; // hours saved per delayed trip
    const reducedDelaysSavings = delayHoursSaved * costPerDelayHour;

    const idleHoursSavedPerVeh = 8; // hours of idle time eliminated/mo per vehicle
    const fuelSavedPerVehGallons = idleHoursSavedPerVeh * 0.8; // gallons saved
    const idleTimeSavings = fuelSavedPerVehGallons * costPerGallonFuel * vehicleCount;

    const missedDeliveriesAvoided = Math.max(1, Math.round(vehicleCount * 0.15));
    const missedDeliveriesSavings = missedDeliveriesAvoided * costPerMissedDelivery;

    const fasterIncidentResponseSavings = vehicleCount * 12; // safety insurance discount factor
    const predictiveMaintenanceSavings = vehicleCount * 25; // break-downs avoided
    const complianceSavings = vehicleCount * 10; // fines avoided
    const dispatcherSavings = 150; // administrative work saved

    const monthlyTotal = reducedDelaysSavings + idleTimeSavings + missedDeliveriesSavings + 
                         fasterIncidentResponseSavings + predictiveMaintenanceSavings + 
                         complianceSavings + dispatcherSavings;
    
    const annualTotal = monthlyTotal * 12;

    // Monthly cost estimate for ROI Ratio (e.g. assume typical ZappOS pilot cost for vehicleCount)
    const monthlyZappOSCost = (vehicleCount * 15) + (vehicleCount * 25) + (3 * 50); // standard pricing
    const roiRatio = Number((monthlyTotal / monthlyZappOSCost).toFixed(2));
    const paybackPeriod = Number((monthlyZappOSCost / (monthlyTotal || 1)).toFixed(2));

    return {
      monthlySavings: {
        reducedDelays: Math.round(reducedDelaysSavings),
        idleTimeOptimization: Math.round(idleTimeSavings),
        missedDeliveriesPrevention: Math.round(missedDeliveriesSavings),
        fasterIncidentResolution: Math.round(fasterIncidentResponseSavings),
        predictiveMaintenance: Math.round(predictiveMaintenanceSavings),
        regulatoryCompliance: Math.round(complianceSavings),
        dispatcherProductivity: Math.round(dispatcherSavings)
      },
      estimatedMonthlySavings: Math.round(monthlyTotal),
      estimatedAnnualSavings: Math.round(annualTotal),
      roiRatio: roiRatio,
      paybackPeriodMonths: Math.max(0.1, paybackPeriod),
      assumptions: [
        `Delayed hours valued at $${costPerDelayHour}/hour representing driver wage and operator penalty rates.`,
        `Fuel consumption rated at 0.8 gallons/hour during heavy truck idle states, fuel priced at $${costPerGallonFuel}/gal.`,
        `Failed or missed delivery penalty capped at $${costPerMissedDelivery}/incident in direct cargo recovery and logistics penalties.`,
        `Predictive maintenance offsets catastrophic cooling or transmission failures, valued at a conservative $25/vehicle per month savings.`
      ],
      confidenceLevel: vehicleCount > 15 ? 'high' : vehicleCount > 5 ? 'medium' : 'low',
      dataQualityWarning: vehicleCount <= 5 ? "Confidence level low: calculations are based on a very small pilot vehicle pool. Larger fleet arrays provide more stable compliance and fuel efficiency benchmarks." : undefined
    };
  }

  // ----------------------------------------------------
  // 6. PROPOSAL GENERATOR
  // ----------------------------------------------------
  public static generateProposal(companyName: string, fleetSize: number): CommercialProposal {
    const calcPricing = this.calculatePricing({
      vehicleCount: Math.min(10, fleetSize),
      activeDeviceCount: Math.min(10, fleetSize),
      dispatcherSeatsCount: 3,
      includeSetupFee: true,
      includeFitmentFee: true,
      premiumSupportLevel: 'standard',
      isEnterpriseCustom: false
    });

    const calcROI = this.estimateROI(Math.min(10, fleetSize), 4);

    return {
      proposalId: `PROP_ZAPP_${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: companyName || "Prospective Logistics Partner Ltd",
      problemStatement: `Inefficiencies in heavy cargo dispatch, cellular tracking dropout zones, blind spots on regional road corridors, slow geofence exit validations, and lag in manual driver dispatch loop reporting leading to high operating costs and customer delivery delays.`,
      proposedScope: `Deploy the ZappOS Fleet Command platform as a 30-day supervised pilot across a focused subset of vehicles, testing Lightstream transmission protocols, Zapp Brain diagnostic playbooks, and dispatcher integration controls.`,
      fleetSize: Math.min(10, fleetSize),
      featuresIncluded: [
        "Regional Live Telemetry Console & Dispatcher Maps",
        "Lightstream Cached Transmission for Network Dropout Zones",
        "Zapp Brain Intelligent Operational Playbooks & Diagnostics",
        "Vehicle DTC Engine Diagnostic Board Mapping",
        "Driver Compliance & Licensing Validity Reminders",
        "Staging Bridge for OneDrive Historical Log Verification"
      ],
      timelineWeeks: 4,
      responsibilities: {
        customer: [
          "Provide pilot vehicles for diagnostic hardware simulation mapping.",
          "Keep designated dispatch operators active on the tracking web console.",
          "Log resolution decisions within the incident management workspace.",
          "Review final Week 4 ROI outputs and scale-readiness scorecards."
        ],
        zappos: [
          "Deploy sandbox demo tenant mode pre-populated with regional routes.",
          "Support operators with standard technician helpdesk workflows.",
          "Analyze incoming simulation metrics and generate final scaling indices.",
          "Provide copy-ready telemetry, compliance, and maintenance logs."
        ]
      },
      successCriteria: [
        "Telemetry connection signal coverage exceeding 90% across monitored corridors.",
        "Average dispatcher reaction time to route delays under 10 minutes.",
        "100% of expired driving certifications (PrDP/COF) successfully flagged before routing.",
        "Demonstrated projected payback period of ZappOS software licensing under 6 months."
      ],
      pricingSnapshot: {
        setupFee: calcPricing.onceOffSetupRevenue,
        monthlyFee: calcPricing.monthlyRecurringRevenue,
        contractValue: calcPricing.projectedAnnualContractValue
      },
      safetyLimitations: [
        "No Autonomous AI Mutations: Zapp Brain generates explanatory advisory playbooks; all steering, routing, and dispatch decisions remain fully under human dispatcher authority.",
        "Simulated Devices: Telemetry hardware status and signal drops are simulated on-screen for validation purposes and do not represent physical hardware installation pending cellular provider billing integrations.",
        "Sandbox Scoping: Billing, payment, and direct production cloud databases are not provisioned in this Phase 14 pilot. Pricing is an analytical estimate only."
      ],
      nextSteps: [
        "1. Confirm pilot vehicle list & active drivers.",
        "2. Conduct Week 1 Dispatcher Onboarding walk-through.",
        "3. Trigger Week 2 Route Ingestion & Dropout simulations.",
        "4. Conduct Week 4 Board-level ROI Review."
      ]
    };
  }

  // ----------------------------------------------------
  // 7. CUSTOMER SUCCESS SCORECARD
  // ----------------------------------------------------
  public static calculateCustomerSuccess(companyId: string, pilotId: string): CustomerSuccessScorecard {
    // Fictional, highly realistic calculation metrics based on pilot outcomes
    const score = 84; // Good pilot progress
    return {
      overallScore: score,
      metrics: {
        telemetryUptime: 92.4,
        dispatchUsageRate: 88.0,
        incidentResponseTimeMins: 6.8,
        delayedJobsReductionPct: 24.5,
        actionQueueCompletionPct: 91.2,
        maintenanceVisibilityPct: 80.0,
        complianceVisibilityPct: 100.0,
        deviceReliabilityPct: 95.0,
        dispatcherAdoptionPct: 85.0
      },
      whatIsWorking: [
        "Strong telemetry connection signal rate (92.4% uptime) across key transit routes.",
        "Immediate compliance tracking, successfully catching and blocking vehicles with expired Certificates of Fitness.",
        "Excellent dispatcher console adoption, with 88% of daily jobs managed inside ZappOS."
      ],
      whatNeedsAttention: [
        "Nairobi-Mombasa descent shadow zone still causes brief telemetry dropouts.",
        "Delayed job response times could be optimized further by adopting Zapp Brain playbooks faster.",
        "Older vehicles show frequent engine cooling SPN alarms that require mechanic workshop booking audits."
      ],
      recommendedActions: [
        "Enable predictive maintenance notifications on the sub-board to pre-empt coolant circuit failures.",
        "Schedule brief refresher training for Dispatcher Hillary to speed up incident timeline logs.",
        "Review final Week 4 ROI savings report with financial stakeholders to begin Phase 15 production planning."
      ]
    };
  }

  // ----------------------------------------------------
  // 8. SALES DEMO SCRIPT
  // ----------------------------------------------------
  public static getSalesDemoScript(): SalesDemoStep[] {
    return [
      {
        step: 1,
        section: "Fleet Live Overview",
        talkingPoints: [
          "Welcome to ZappOS. We begin by looking at the core dispatch console, which serves as the central command hub.",
          "Here, operators see an instant bird's-eye view of all active pilot vehicles, signal strengths, and daily cargo statuses.",
          "Our system is optimized to show high-density metrics clearly, with zero administrative clutter."
        ],
        demoActions: [
          "Select the active Demo Tenant pilot fleet.",
          "Hover over the 10-vehicle list to show fuel levels and current depot locations."
        ],
        customerValue: "Immediate visual awareness of operational layout. Replaces chaotic spreadsheets with a single-screen real-time command deck.",
        objectionNotes: "If asked if this integrates with older physical systems, explain that Phase 14 establishes standard data schema bridges that can accept traditional tracker APIs."
      },
      {
        step: 2,
        section: "Zapp Brain Heuristics & Playbooks",
        talkingPoints: [
          "When anomalies like route deviations or cellular outages occur, ZappOS does not leave the operator guessing.",
          "The Zapp Brain engine compiles telemetry indicators and outputs natural language diagnostics and dispatcher playbooks.",
          "Crucially, ZappOS does not perform autonomous steering; all operational decisions are human-supervised."
        ],
        demoActions: [
          "Click on active Panic Switch incident Case INC_DEMO_SOS_01.",
          "Point out the Zapp Brain Diagnostic advice and step-by-step playbook actions on the panel."
        ],
        customerValue: "Speeds up dispatcher decision-making by 40% under stressful dropout or panic circumstances.",
        objectionNotes: "If customer says 'We don't trust AI', highlight that Zapp Brain is positioned solely as a diagnostic assistant—the human dispatcher has full manual override authority."
      },
      {
        step: 3,
        section: "Support Registers & Compliance",
        talkingPoints: [
          "Beyond simple coordinate tracking, we map core risk vectors.",
          "Our maintenance sub-boards parse vehicle engine fault SPN/FMI DTC codes to warn you of imminent breakdowns.",
          "Simultaneously, we monitor critical road-worthiness certs and driver professional licenses (PrDP) to ensure zero legal liability."
        ],
        demoActions: [
          "Navigate to the Support Registers sub-tabs.",
          "Toggle between Maintenance, Compliance, and Device Diagnostics to show warning flags."
        ],
        customerValue: "Protects logistics companies from heavy statutory fines and prevents catastrophic highway engine blowouts.",
        objectionNotes: "If asked about hardware warranty, explain that our device diagnostics monitor voltage lines to flag faulty units before a truck leaves the depot."
      },
      {
        step: 4,
        section: "Honest ROI & Pricing Calculator",
        talkingPoints: [
          "We want your transition to ZappOS to be highly profitable.",
          "By inputting your active fleet metrics, we can estimate direct monthly savings from minimized delays and lower engine idle times.",
          "We back every estimate with transparent, conservative operational assumptions."
        ],
        demoActions: [
          "Input custom vehicle size in the pricing and ROI interactive forms.",
          "Show monthly ACV revenue vs estimated annual fuel savings."
        ],
        customerValue: "Provides clear, board-ready financial proof of cost-efficiency. Proves average pilot payback in under 6 months.",
        objectionNotes: "Emphasize that the calculator is an analytical tool, and no active billing or subscription contracts are processed during this pilot phase."
      }
    ];
  }

  // ----------------------------------------------------
  // 9. OBJECTION HANDLING LIBRARY
  // ----------------------------------------------------
  public static getObjectionLibrary(): ObjectionHandlingItem[] {
    return [
      {
        objection: "We already have Cartrack / Netstar / MiX Telematics.",
        category: "Competition",
        talkingPoints: [
          "Traditional trackers focus primarily on GPS dots on a map and historical driver behavior scores.",
          "ZappOS is not a simple tracker; it is an intelligent dispatch orchestration platform.",
          "We parse engine diagnostic DTC codes, correlate driver compliance licenses, and output natural language dispatch playbooks."
        ],
        rebuttalText: "We complement or replace existing units. Instead of looking at raw coordinate charts, ZappOS provides clear diagnostic directions on what dispatchers must do when a delay occurs."
      },
      {
        objection: "We do not trust automated AI systems to control our fleet.",
        category: "Trust & Safety",
        talkingPoints: [
          "We completely agree. In heavy logistics and hazardous transport, autonomous software decisions are dangerous.",
          "ZappOS is strictly dispatcher-supervised. We generate diagnostic advices and playbooks.",
          "Our software cannot autonomously steer, reroute, suspend drivers, or cancel shipments without manual human logs."
        ],
        rebuttalText: "Human dispatchers retain 100% decision authority. Zapp Brain acts solely as an operational helper to structure checklists."
      },
      {
        objection: "Our dispatchers are used to WhatsApp / paper and won't use this.",
        category: "User Adoption",
        talkingPoints: [
          "We design for high simplicity. The dispatch board acts like a checklist that replaces messy notebooks.",
          "We incorporate quick single-click status updates and copy-ready summary text templates.",
          "By removing duplicate administrative steps, we give dispatchers up to 2 hours of free time back per shift."
        ],
        rebuttalText: "We include dedicated dispatcher-level onboarding in Week 1. The software is so simple that anyone who can use WhatsApp can master ZappOS in 30 minutes."
      },
      {
        objection: "Physical hardware installation and fitment is too expensive.",
        category: "Cost & Logistics",
        talkingPoints: [
          "Hardware fitment can represent a high upfront cost, which is why we offer a flexible, low setup structure.",
          "During the 30-day pilot, we offer a high setup discount (up to 25%) to minimize barrier of entry.",
          "Physical installation takes less than 45 minutes per vehicle, scheduled during standard terminal down-time."
        ],
        rebuttalText: "We minimize upfront friction. Our commercial pilot plan bundles fitment fees and provides immediate ROI to offset costs in Week 1."
      },
      {
        objection: "We have very poor network coverage on some rural highway sectors.",
        category: "Technical Coverage",
        talkingPoints: [
          "Traditional tracking units lose data or crash when cellular signals are lost.",
          "Our system uses lightweight Lightstream cached packets to save coordinates locally in device memory.",
          "Upon signal recovery, the device flushes the cache, populating the dispatcher feed with zero data gaps."
        ],
        rebuttalText: "Your data is safe in blackout zones. Lightstream ensures full coordinate logs are delivered even in deep rural shadow sectors."
      }
    ];
  }

  // ----------------------------------------------------
  // 10. SUPPORT PROCESS BLUEPRINT
  // ----------------------------------------------------
  public static getSupportBlueprint(): SupportProcessCard[] {
    return [
      {
        role: "Dispatcher Console Support",
        severity: "medium",
        description: "Assists operators experiencing browser slowness, missing vehicle details, or login token problems.",
        workflowSteps: [
          "1. Dispatcher logs console issue via support widget.",
          "2. Helpdesk technician checks browser session memory logs.",
          "3. Verifies internet gateway state; suggests standard browser cache clear workaround.",
          "4. Logs manual ticket resolution in the operational audit file."
        ],
        resolutionSLA: "Under 30 Minutes"
      },
      {
        role: "Zapp Box Device Support",
        severity: "critical",
        description: "Manages hardware-level issues including signal loss, low battery lines, and external antenna physical faults.",
        workflowSteps: [
          "1. Diagnostic alarm SPN 94 or low voltage flags a faulty device.",
          "2. Support triggers automated over-the-air (OTA) remote ping checks.",
          "3. If remote recovery fails, flags vehicle for physical depot inspection.",
          "4. Coordinates with regional fitment technician for terminal check."
        ],
        resolutionSLA: "Under 4 Hours"
      },
      {
        role: "OneDrive Data Import Support",
        severity: "low",
        description: "Validates driver rosters, historical route coordinate spreadsheets, and customer logs uploaded to the staging folder.",
        workflowSteps: [
          "1. Customer uploads pilot Excel/JSON logs to the OneDrive staging folder.",
          "2. ZappOS data ingestion check triggers schema validation reviews.",
          "3. Formulates missing parameter checklists for any corrupted records.",
          "4. Flushes validated rows to local pilot tenant space."
        ],
        resolutionSLA: "Within 24 Hours"
      }
    ];
  }

  // ----------------------------------------------------
  // 11. COMMERCIAL READINESS CHECKLIST STATE
  // ----------------------------------------------------
  public static getCommercialChecklist(companyName: string, fleetSize: number): CommercialReadinessChecklist {
    return {
      demoTenantPrepared: true,
      pilotPlanGenerated: companyName.length > 0,
      pricingAssumptionsConfigured: true,
      roiAssumptionsReviewed: fleetSize > 0,
      onboardingQuestionsComplete: companyName.length > 0 && fleetSize > 0,
      supportProcessDefined: true,
      safetyLimitationsStated: true,
      hardwareStatusStated: true,
      dataImportStatusStated: true,
      proposalGenerated: companyName.length > 0,
      successCriteriaAgreed: false, // Must be signed off manually by customer
      billingContractMarkedFuture: true // Strictly no automated pricing activation yet
    };
  }
}
