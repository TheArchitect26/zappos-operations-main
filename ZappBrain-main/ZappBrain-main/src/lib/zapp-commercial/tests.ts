/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappCommercialService } from './commercial-service';

export interface TestCaseResult {
  name: string;
  status: 'passed' | 'failed';
  message?: string;
}

export function runZappCommercialTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  // Test 1: Demo Tenant Generation
  try {
    const data = ZappCommercialService.getDemoTenantData();
    if (!data.metadata.is_simulated) {
      throw new Error("Demo tenant is not marked as simulated.");
    }
    if (data.vehicles.length !== 10) {
      throw new Error(`Expected exactly 10 demo vehicles, got ${data.vehicles.length}`);
    }
    if (data.devices.length !== 10) {
      throw new Error(`Expected exactly 10 demo devices, got ${data.devices.length}`);
    }
    if (data.drivers.length !== 12) {
      throw new Error(`Expected exactly 12 demo drivers, got ${data.drivers.length}`);
    }
    results.push({ name: "Demo Tenant Mode Generation Integrity", status: "passed" });
  } catch (err: any) {
    results.push({ name: "Demo Tenant Mode Generation Integrity", status: "failed", message: err.message });
  }

  // Test 2: Onboarding Summary Generation
  try {
    const output = ZappCommercialService.calculateOnboardingOutput({
      companyName: "Freight Masters",
      fleetSize: 45,
      operatingRegion: "East Africa Corridor",
      vehicleTypes: ["Tipper Trucks"],
      currentTracker: "Cartrack",
      dispatchWorkflow: "Manual Call Sheets",
      topPainPoints: ["Frequent Route Deviations"],
      complianceNeeds: ["Speed Gov Certs"],
      maintenanceNeeds: ["DTC diagnostic codes"],
      pilotGoals: ["Lower operating costs"],
      selectedVehicleCount: 8,
      userRolesCount: { dispatchers: 2, supervisors: 1, technicians: 1 },
      dataImportPreference: "csv",
      deviceReadinessStatus: "mixed"
    });

    if (!output.summary.includes("Freight Masters")) {
      throw new Error("Onboarding output is missing the company name in its summary.");
    }
    if (output.estimatedComplexity !== 'medium') {
      throw new Error(`Expected medium complexity for fleetSize 45 and mixed hardware, got ${output.estimatedComplexity}`);
    }
    results.push({ name: "Onboarding Ingestion & Setup Recommendation", status: "passed" });
  } catch (err: any) {
    results.push({ name: "Onboarding Ingestion & Setup Recommendation", status: "failed", message: err.message });
  }

  // Test 3: 30-Day Pilot Plan Generation
  try {
    const plan = ZappCommercialService.generate30DayPilotPlan("Airtel Logistics");
    if (plan.length !== 4) {
      throw new Error(`Expected 4 weeks of pilot plan, got ${plan.length}`);
    }
    plan.forEach((p, idx) => {
      if (p.week !== idx + 1) {
        throw new Error(`Week sequence error: expected ${idx + 1}, got ${p.week}`);
      }
      if (p.tasks.length === 0) {
        throw new Error(`Expected tasks defined for week ${p.week}`);
      }
    });
    results.push({ name: "30-Day Pilot Plan Generator Sequence validation", status: "passed" });
  } catch (err: any) {
    results.push({ name: "30-Day Pilot Plan Generator Sequence validation", status: "failed", message: err.message });
  }

  // Test 4: Pricing Calculator Math
  try {
    const pricing = ZappCommercialService.calculatePricing({
      vehicleCount: 10,
      activeDeviceCount: 10,
      dispatcherSeatsCount: 3,
      includeSetupFee: true,
      includeFitmentFee: true,
      premiumSupportLevel: 'standard',
      isEnterpriseCustom: false
    });

    // 10 * 15 (vehicles) = 150
    // 10 * 25 (devices) = 250
    // 3 * 50 (dispatchers) = 150
    // Standard support level = 150
    // MRR = 150 + 250 + 150 + 150 = 700. Let's verify.
    if (pricing.monthlyRecurringRevenue !== 700) {
      throw new Error(`Expected monthly recurring revenue to be 700, got ${pricing.monthlyRecurringRevenue}`);
    }
    // setup fee = 500
    // fitment fee = 10 * 75 = 750
    // total raw setup = 1250
    // pilot discount on 10 vehicles is 15%.
    // setup = 1250 * 0.85 = 1062.5 -> rounded to 1063.
    if (pricing.onceOffSetupRevenue !== 1063) {
      throw new Error(`Expected setup revenue to be 1063, got ${pricing.onceOffSetupRevenue}`);
    }
    results.push({ name: "Pricing Model & Setup Discount Calculations", status: "passed" });
  } catch (err: any) {
    results.push({ name: "Pricing Model & Setup Discount Calculations", status: "failed", message: err.message });
  }

  // Test 5: ROI Assumption Calculations
  try {
    const roi = ZappCommercialService.estimateROI(10, 4);
    if (roi.estimatedMonthlySavings <= 0) {
      throw new Error("Expected positive monthly savings estimate.");
    }
    if (roi.estimatedAnnualSavings !== roi.estimatedMonthlySavings * 12) {
      throw new Error("Annual savings do not match monthly product projection.");
    }
    if (roi.assumptions.length === 0) {
      throw new Error("Expected explicit assumptions listed in ROI dashboard.");
    }
    results.push({ name: "Transparent ROI Savings Estimations", status: "passed" });
  } catch (err: any) {
    results.push({ name: "Transparent ROI Savings Estimations", status: "failed", message: err.message });
  }

  // Test 6: Proposal Generation & Safety Limitations Included
  try {
    const prop = ZappCommercialService.generateProposal("Inter-Carrier Logistics Ltd", 20);
    if (!prop.proposalId.startsWith("PROP_ZAPP_")) {
      throw new Error("Expected standard prefix for pilot proposals.");
    }
    if (prop.safetyLimitations.length === 0) {
      throw new Error("Safety limitations are missing from commercial proposal.");
    }
    // Verify no autonomous AI claims
    prop.safetyLimitations.forEach(lim => {
      if (lim.toLowerCase().includes("autonomous dispatch") || lim.toLowerCase().includes("self-steering")) {
        throw new Error("Unpermitted autonomous AI claim found in safety section.");
      }
    });
    results.push({ name: "Proposal Generation & Safety Disclaimers Audit", status: "passed" });
  } catch (err: any) {
    results.push({ name: "Proposal Generation & Safety Disclaimers Audit", status: "failed", message: err.message });
  }

  // Test 7: Customer Success Scorecard
  try {
    const sc = ZappCommercialService.calculateCustomerSuccess("CO_SAMPLE", "PL_NAIROBI_01");
    if (sc.overallScore !== 84) {
      throw new Error(`Expected customer success score to be 84, got ${sc.overallScore}`);
    }
    if (sc.whatIsWorking.length === 0 || sc.whatNeedsAttention.length === 0) {
      throw new Error("Expected active indicators for customer pilot scorecard.");
    }
    results.push({ name: "Customer-Facing Scorecard Ingestion Rate", status: "passed" });
  } catch (err: any) {
    results.push({ name: "Customer-Facing Scorecard Ingestion Rate", status: "failed", message: err.message });
  }

  // Test 8: Commercial Readiness Checklist
  try {
    const checklist = ZappCommercialService.getCommercialChecklist("Siginon Cargo", 15);
    if (!checklist.onboardingQuestionsComplete || !checklist.billingContractMarkedFuture) {
      throw new Error("Ready flags are configured incorrectly in commercial checklist.");
    }
    if (checklist.successCriteriaAgreed) {
      throw new Error("Success criteria should remain un-agreed until customer manually ticks it.");
    }
    results.push({ name: "Commercial Launch Readiness Checklist Rules", status: "passed" });
  } catch (err: any) {
    results.push({ name: "Commercial Launch Readiness Checklist Rules", status: "failed", message: err.message });
  }

  // Test 9: Sales Demo Script
  try {
    const steps = ZappCommercialService.getSalesDemoScript();
    if (steps.length === 0) {
      throw new Error("No sales steps available in the guided script.");
    }
    steps.forEach(s => {
      if (!s.section || !s.customerValue) {
        throw new Error("Sales demo step does not contain required talking descriptors.");
      }
    });
    results.push({ name: "Sales Demo Playbook Script Integrity", status: "passed" });
  } catch (err: any) {
    results.push({ name: "Sales Demo Playbook Script Integrity", status: "failed", message: err.message });
  }

  // Test 10: Objection Handling Library
  try {
    const objections = ZappCommercialService.getObjectionLibrary();
    if (objections.length === 0) {
      throw new Error("Objection handling list is empty.");
    }
    objections.forEach(obj => {
      if (obj.rebuttalText.length === 0 || obj.talkingPoints.length === 0) {
        throw new Error("Missing objection answer contents.");
      }
    });
    results.push({ name: "Objection Handling Playbook Library", status: "passed" });
  } catch (err: any) {
    results.push({ name: "Objection Handling Playbook Library", status: "failed", message: err.message });
  }

  // Test 11: Safety Limitations & No Autonomous Claims Verification
  try {
    const objections = ZappCommercialService.getObjectionLibrary();
    const aiObjection = objections.find(o => o.objection.toLowerCase().includes("trust"));
    if (!aiObjection) {
      throw new Error("No AI trust objection card found.");
    }
    const txt = aiObjection.rebuttalText.toLowerCase();
    if (txt.includes("fully autonomous") || txt.includes("unsupervised tracking")) {
      throw new Error("Autonomous claim violation in objection handling library!");
    }
    results.push({ name: "Safety & Supervised-Only AI Positioning Verification", status: "passed" });
  } catch (err: any) {
    results.push({ name: "Safety & Supervised-Only AI Positioning Verification", status: "failed", message: err.message });
  }

  return results;
}
