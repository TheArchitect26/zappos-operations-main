/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimDriver, SimVehicle } from './types';

export interface ComplianceViolation {
  entityId: string;
  type: 'driver_licence' | 'prdp' | 'cof' | 'maintenance';
  severity: 'medium' | 'high' | 'critical';
  details: string;
}

/**
 * Sweeps all drivers and vehicles to audit compliance.
 */
export function auditFleetCompliance(
  drivers: SimDriver[],
  vehicles: SimVehicle[],
  currentDateStr: string
): ComplianceViolation[] {
  const violations: ComplianceViolation[] = [];
  const today = new Date(currentDateStr);

  drivers.forEach(dr => {
    const licExpiry = new Date(dr.licenseExpiry);
    const prdpExpiry = new Date(dr.prdpExpiry);

    if (licExpiry < today) {
      violations.push({
        entityId: dr.id,
        type: 'driver_licence',
        severity: 'critical',
        details: `Driver ${dr.name} is operating with an EXPIRED license (Expired ${dr.licenseExpiry}).`
      });
    }

    if (prdpExpiry < today) {
      violations.push({
        entityId: dr.id,
        type: 'prdp',
        severity: 'high',
        details: `Driver ${dr.name} is operating with an EXPIRED PrDP (Expired ${dr.prdpExpiry}).`
      });
    }
  });

  vehicles.forEach(vh => {
    if (vh.overdueService) {
      violations.push({
        entityId: vh.id,
        type: 'maintenance',
        severity: 'medium',
        details: `Vehicle ${vh.plateNumber} has exceeded its recommended maintenance odometer threshold.`
      });
    }
  });

  return violations;
}
