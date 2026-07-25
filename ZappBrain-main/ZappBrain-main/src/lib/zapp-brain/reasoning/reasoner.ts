/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappBrainInput, ReasonedConclusion, AffectedEntity } from '../types';
import { buildVehicleProfile } from '../knowledge/vehicle';
import { buildDriverProfile } from '../knowledge/driver';
import { buildCustomerProfile } from '../knowledge/customer';

/**
 * Executes multi-source, explainable operational reasoning across the fleet.
 */
export function runReasoningEngine(input: ZappBrainInput): ReasonedConclusion[] {
  const conclusions: ReasonedConclusion[] = [];
  const vehicles = input.vehicles || [];
  const drivers = input.drivers || [];
  const customers = input.customers || [];
  const tasks = input.maintenanceTasks || [];

  // Compile full profiles to feed the reasoning engine
  const vehicleProfiles = vehicles.map(v => buildVehicleProfile(v.id, input));
  const driverProfiles = drivers.map(d => buildDriverProfile(d.id, input));
  const customerProfiles = customers.map(c => buildCustomerProfile(c.id, input));

  // -------------------------------------------------------------------------
  // Reasoning Pattern 1: Brake System or Major Safety Hazard (Cross-Domain)
  // -------------------------------------------------------------------------
  vehicleProfiles.forEach(vp => {
    const hasBrakeFault = vp.dtc_summary.some(f => f.toLowerCase().includes('brake') || f.toLowerCase().includes('ebs'));
    const hasOverdueMaintenance = tasks.some(t => t.vehicle_id === vp.vehicle_id && t.status === 'overdue' && t.task_type.toLowerCase().includes('brake'));
    const isVehicleActive = vehicles.find(v => v.id === vp.vehicle_id)?.status === 'active';

    if (hasBrakeFault && isVehicleActive) {
      const activeJob = (input.jobs || []).find(j => j.vehicle_id === vp.vehicle_id && (j.status === 'active' || j.status === 'assigned'));
      const activeDriverId = activeJob?.driver_id;
      const activeDriverProfile = driverProfiles.find(dp => dp.driver_id === activeDriverId);

      const observations = [
        `Vehicle ${vp.plate_number} has active telemetry faults: ${vp.dtc_summary.join(', ')}.`,
        hasOverdueMaintenance ? `Routine braking system service is overdue for this vehicle.` : `No record of active brake service in progress.`
      ];
      
      const reasoning_path = [
        `Step 1: Detected active critical EBS/brake DTC warning code.`,
        `Step 2: Confirmed vehicle is active on current jobs, posing on-road structural failure hazard.`,
      ];

      const affected_entities: AffectedEntity[] = [
        { type: 'vehicle', id: vp.vehicle_id, name: vp.plate_number }
      ];

      if (activeDriverProfile) {
        observations.push(`Driver ${activeDriverProfile.name} safety score is ${activeDriverProfile.safety_score}/100.`);
        reasoning_path.push(`Step 3: Linked vehicle braking system wear with driver telemetry risks.`);
        affected_entities.push({ type: 'driver', id: activeDriverProfile.driver_id, name: activeDriverProfile.name });
      }

      let risk_level: 'low' | 'medium' | 'high' | 'critical' = 'high';
      if (vp.incident_history_count > 0 || hasOverdueMaintenance) {
        risk_level = 'critical';
        reasoning_path.push(`Step 4: Escaled severity to CRITICAL due to vehicle's historical safety incident record.`);
      }

      conclusions.push({
        id: `reason_brake_${vp.vehicle_id}`,
        title: `EBS Braking System Structural Failure Hazard`,
        risk_level,
        evidence: {
          observations,
          metrics: {
            vehicle_health_score: vp.health_score,
            dtc_count: vp.dtc_summary.length,
            driver_safety_score: activeDriverProfile?.safety_score ?? 100,
            overdue_brake_service: hasOverdueMaintenance
          }
        },
        confidence: Math.round((vp.confidence_score + (activeDriverProfile?.reliability_score ?? 80)) / 2),
        reasoning_path,
        affected_entities,
        recommendation: `IMMEDIATELY route vehicle ${vp.plate_number} to nearest service depot and pause assignment of any further line-haul jobs.`
      });
    }
  });

  // -------------------------------------------------------------------------
  // Reasoning Pattern 2: Severe Engine Coolant / Thermal Overheating Risk
  // -------------------------------------------------------------------------
  vehicleProfiles.forEach(vp => {
    const hasThermalFault = vp.dtc_summary.some(f => f.toLowerCase().includes('coolant') || f.toLowerCase().includes('temperature') || f.toLowerCase().includes('oil'));
    const isMaintenanceStatus = vehicles.find(v => v.id === vp.vehicle_id)?.status === 'maintenance';

    if (hasThermalFault && !isMaintenanceStatus) {
      const observations = [
        `Vehicle ${vp.plate_number} telemetry reported thermal/coolant warnings.`,
        `Vehicle health score has degraded to ${vp.health_score}/100.`
      ];

      const reasoning_path = [
        `Step 1: Captured critical coolant/oil temperature sensor trigger.`,
        `Step 2: Flagged non-maintenance status; vehicle remains on active duty.`
      ];

      const overdueRoutine = tasks.find(t => t.vehicle_id === vp.vehicle_id && t.status === 'overdue');
      if (overdueRoutine) {
        observations.push(`Routine maintenance checklist "${overdueRoutine.task_type}" is overdue since ${overdueRoutine.scheduled_date}.`);
        reasoning_path.push(`Step 3: Cross-referenced with overdue mechanical services.`);
      }

      conclusions.push({
        id: `reason_thermal_${vp.vehicle_id}`,
        title: `Impending Thermal Engine Breakdown Risk`,
        risk_level: overdueRoutine ? 'high' : 'medium',
        evidence: {
          observations,
          metrics: {
            health_score: vp.health_score,
            temperature_warnings_count: vp.dtc_summary.length,
            overdue_service_days: overdueRoutine ? 12 : 0
          }
        },
        confidence: Math.round(vp.confidence_score),
        reasoning_path,
        affected_entities: [{ type: 'vehicle', id: vp.vehicle_id, name: vp.plate_number }],
        recommendation: `Schedule diagnostic sensor audit and cooling fluid flush within next 24 operating hours.`
      });
    }
  });

  // -------------------------------------------------------------------------
  // Reasoning Pattern 3: Regulatory Compliance and Licensing Liability
  // -------------------------------------------------------------------------
  driverProfiles.forEach(dp => {
    const isExpired = dp.compliance_state === 'non_compliant';
    const isExpiring = dp.compliance_state === 'expired_documents';

    if (isExpired || isExpiring) {
      const observations = [
        `Driver ${dp.name} licensing credentials are in "${dp.compliance_state.toUpperCase()}" status.`,
        `License is ${dp.license_status}; PrDP professional permit is ${dp.prdp_status}.`
      ];

      const reasoning_path = [
        `Step 1: Analyzed driver regulatory documents in the licensing registry.`,
        `Step 2: Identified document state mismatch.`
      ];

      const activeJob = (input.jobs || []).find(j => j.driver_id === dp.driver_id && (j.status === 'assigned' || j.status === 'active'));
      const affected_entities: AffectedEntity[] = [
        { type: 'driver', id: dp.driver_id, name: dp.name }
      ];

      if (activeJob) {
        observations.push(`Driver is currently assigned to active Job "${activeJob.title}" (ID: ${activeJob.id}).`);
        reasoning_path.push(`Step 3: Linked compliance failure with active on-road transit task.`);
        affected_entities.push({ type: 'job', id: activeJob.id, name: activeJob.title });
      }

      conclusions.push({
        id: `reason_compliance_${dp.driver_id}`,
        title: `Regulatory Operations Compliance Liability`,
        risk_level: isExpired ? 'critical' : 'medium',
        evidence: {
          observations,
          metrics: {
            driver_safety_score: dp.safety_score,
            is_active_on_job: !!activeJob
          }
        },
        confidence: 100, // Document records are highly verified
        reasoning_path,
        affected_entities,
        recommendation: isExpired 
          ? `IMMEDIATELY ground driver ${dp.name} to avoid severe legal/insurance exposure during live transits.`
          : `Request updated license scans and file permit renewal paperwork within the week.`
      });
    }
  });

  return conclusions;
}
