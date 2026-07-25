/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DTCFaultSignal } from './types';

export interface PredefinedDTC {
  code: string;
  description: string;
  severity: DTCFaultSignal['severity'];
}

export const PREDEFINED_FAULTS: Record<string, PredefinedDTC> = {
  SPN_190_FMI_0: {
    code: 'SPN_190_FMI_0',
    description: 'Engine Crankshaft Speed Sensor: High Anomaly Extreme Overspeed',
    severity: 'high'
  },
  SPN_611_FMI_2: {
    code: 'SPN_611_FMI_2',
    description: 'Braking Mechanical System: Brake Cylinder Sensor Calibration Discrepancy',
    severity: 'critical'
  },
  SPN_168_FMI_1: {
    code: 'SPN_168_FMI_1',
    description: 'Alternator Charging Module: Main Power Bus Bar Voltage Too Low',
    severity: 'medium'
  },
  SPN_629_FMI_12: {
    code: 'SPN_629_FMI_12',
    description: 'Trailer Coupling Lock Controller: Solenoid Relay Valve Fault',
    severity: 'high'
  },
  SPN_111_FMI_1: {
    code: 'SPN_111_FMI_1',
    description: 'Radiator Coolant Level: Coolant Volume Critically Depleted',
    severity: 'critical'
  },
  SPN_TAMPER: {
    code: 'SPN_TAMPER',
    description: 'Enclosure Enclosure Interlock: Hardware Tamper Loop Broken',
    severity: 'critical'
  }
};

/**
 * Triggers a diagnostic fault, tracking its occurrence frequency and timestamp history.
 */
export function triggerDTCFault(activeFaults: DTCFaultSignal[], code: string): DTCFaultSignal[] {
  const existing = activeFaults.find(f => f.code === code);
  const now = new Date().toISOString();

  if (existing) {
    existing.occurrence_count++;
    existing.last_seen_at = now;
    existing.is_active = true;
    return [...activeFaults];
  }

  const faultDef = PREDEFINED_FAULTS[code] || {
    code,
    description: `Unknown J1939 system warning: ${code}`,
    severity: 'medium' as const
  };

  const newFault: DTCFaultSignal = {
    code,
    severity: faultDef.severity,
    first_seen_at: now,
    last_seen_at: now,
    occurrence_count: 1,
    is_active: true
  };

  return [...activeFaults, newFault];
}

/**
 * Clears or deactivates a diagnostic fault without deleting its history records.
 */
export function clearDTCFault(activeFaults: DTCFaultSignal[], code: string): DTCFaultSignal[] {
  return activeFaults.map(f => {
    if (f.code === code) {
      return { ...f, is_active: false };
    }
    return f;
  });
}
