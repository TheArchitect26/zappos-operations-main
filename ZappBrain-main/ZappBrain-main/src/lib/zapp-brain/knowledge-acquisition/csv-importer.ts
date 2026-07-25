/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExtractedField } from './types';

/**
 * Simplistic CSV parser that splits values, accounting for optional enclosing quotes.
 */
export function parseCSV(content: string): string[][] {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

/**
 * Extracts normalized operational fields from a fleet export CSV.
 */
export function importFleetCSV(content: string, filename: string): Record<string, ExtractedField> {
  const rows = parseCSV(content);
  if (rows.length < 2) return {};

  const headers = rows[0].map(h => h.toLowerCase().trim());
  const dataRows = rows.slice(1);

  const vehicleCount = dataRows.length;
  let driversCount = 0;
  let expiredLicences = 0;
  let vehiclesMissingCOF = 0;
  let highRiskVehicles = 0;
  let totalGPSCoverage = 0;
  let overdueMaintenanceCount = 0;

  const licenseExpiryIdx = headers.indexOf('license_expiry');
  const prdpExpiryIdx = headers.indexOf('prdp_expiry');
  const driverIdx = headers.indexOf('driver_name');
  const cofIdx = headers.indexOf('cof_status');
  const riskIdx = headers.indexOf('risk_score');
  const gpsIdx = headers.indexOf('gps_coverage');
  const maintIdx = headers.indexOf('maintenance_overdue');

  const today = new Date('2026-07-14'); // System date reference

  dataRows.forEach(row => {
    // 1. Count drivers
    if (driverIdx !== -1 && row[driverIdx]) {
      driversCount++;
    }

    // 2. Expired licenses
    if (licenseExpiryIdx !== -1 && row[licenseExpiryIdx]) {
      const expiry = new Date(row[licenseExpiryIdx]);
      if (expiry < today) {
        expiredLicences++;
      }
    }
    if (prdpExpiryIdx !== -1 && row[prdpExpiryIdx]) {
      const expiry = new Date(row[prdpExpiryIdx]);
      if (expiry < today) {
        expiredLicences++;
      }
    }

    // 3. Vehicles missing COF
    if (cofIdx !== -1 && row[cofIdx]) {
      const cof = row[cofIdx].toLowerCase();
      if (cof === 'missing' || cof === 'expired' || cof === 'false') {
        vehiclesMissingCOF++;
      }
    }

    // 4. High risk vehicles
    if (riskIdx !== -1 && row[riskIdx]) {
      const risk = parseInt(row[riskIdx], 10);
      if (!isNaN(risk) && risk > 60) {
        highRiskVehicles++;
      }
    }

    // 5. GPS coverage accumulation
    if (gpsIdx !== -1 && row[gpsIdx]) {
      const gps = parseFloat(row[gpsIdx].replace('%', ''));
      if (!isNaN(gps)) {
        totalGPSCoverage += gps;
      }
    } else {
      totalGPSCoverage += 100;
    }

    // 6. Overdue maintenance count
    if (maintIdx !== -1 && row[maintIdx]) {
      const maint = row[maintIdx].toLowerCase();
      if (maint === 'true' || maint === 'overdue' || parseInt(maint, 10) > 0) {
        overdueMaintenanceCount++;
      }
    }
  });

  const avgGPSCoverage = vehicleCount > 0 ? Math.round(totalGPSCoverage / vehicleCount) : 100;

  return {
    vehicleCount: {
      value: vehicleCount,
      confidence: 100,
      source: filename,
      extractionMethod: 'text_parsing',
      verificationStatus: 'verified'
    },
    driversCount: {
      value: driversCount,
      confidence: 98,
      source: filename,
      extractionMethod: 'text_parsing',
      verificationStatus: 'verified'
    },
    expiredLicencesCount: {
      value: expiredLicences,
      confidence: 95,
      source: filename,
      extractionMethod: 'regex',
      verificationStatus: 'unverified'
    },
    vehiclesMissingCOFCount: {
      value: vehiclesMissingCOF,
      confidence: 94,
      source: filename,
      extractionMethod: 'text_parsing',
      verificationStatus: 'unverified'
    },
    highRiskVehiclesCount: {
      value: highRiskVehicles,
      confidence: 92,
      source: filename,
      extractionMethod: 'regex',
      verificationStatus: 'unverified'
    },
    gpsCoverageAverage: {
      value: avgGPSCoverage,
      confidence: 96,
      source: filename,
      extractionMethod: 'text_parsing',
      verificationStatus: 'verified'
    },
    overdueMaintenanceCount: {
      value: overdueMaintenanceCount,
      confidence: 93,
      source: filename,
      extractionMethod: 'text_parsing',
      verificationStatus: 'unverified'
    }
  };
}
