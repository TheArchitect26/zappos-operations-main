/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DocumentType } from './types';

/**
 * Classifies a document's type based on its filename and content hints.
 */
export function classifyDocument(filename: string, content: string): DocumentType {
  const f = filename.toLowerCase();
  const c = content.toLowerCase();

  // Excel Workbooks
  if (f.endsWith('.xlsx') || f.endsWith('.xls') || c.includes('workbook') || c.includes('xml spreadsheet')) {
    if (c.includes('fleet') || c.includes('vehicle count') || c.includes('drivers')) {
      return 'excel_workbook';
    }
    return 'customer_spreadsheet';
  }

  // CSV Exports
  if (f.endsWith('.csv') || c.includes('csv,') || c.includes('","')) {
    if (c.includes('latitude') || c.includes('longitude') || c.includes('gps')) {
      return 'gps_export';
    }
    if (c.includes('plate') || c.includes('license_expiry') || c.includes('prdp')) {
      return 'fleet_export_csv';
    }
    return 'customer_spreadsheet';
  }

  // Image files (OCR simulated)
  if (f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png')) {
    if (c.includes('licence') || c.includes('driving permit') || c.includes('code ec')) {
      return 'driver_licence';
    }
    if (c.includes('prdp') || c.includes('professional driving permit')) {
      return 'prdp_certificate';
    }
    if (c.includes('fuel') || c.includes('litres') || c.includes('diesel')) {
      return 'fuel_slip';
    }
    return 'unknown';
  }

  // PDFs / Documents
  if (f.endsWith('.pdf') || c.includes('%pdf')) {
    if (c.includes('invoice') || c.includes('workshop') || c.includes('parts') || c.includes('labour')) {
      return 'service_invoice';
    }
    if (c.includes('certificate of fitness') || c.includes('cof') || c.includes('roadworthy')) {
      return 'cof';
    }
    if (c.includes('registration certificate') || c.includes('chassis')) {
      return 'vehicle_registration';
    }
    if (c.includes('delivery note') || c.includes('received by')) {
      return 'delivery_note';
    }
    if (c.includes('proof of delivery') || c.includes('pod') || c.includes('delivered in good order')) {
      return 'pod';
    }
    if (c.includes('accident') || c.includes('collision') || c.includes('damage') || c.includes('insurance')) {
      return 'incident_report';
    }
    if (c.includes('inspection') || c.includes('checklist') || c.includes('tyre pressure')) {
      return 'inspection_sheet';
    }
    if (c.includes('workshop report') || c.includes('diagnostics')) {
      return 'workshop_report';
    }
    return 'unknown';
  }

  // Heuristic string matches
  if (c.includes('invoice') || c.includes('bill to')) return 'service_invoice';
  if (c.includes('licence') || c.includes('permit')) return 'driver_licence';
  if (c.includes('certificate of fitness')) return 'cof';
  if (c.includes('delivery note')) return 'delivery_note';

  return 'unknown';
}
