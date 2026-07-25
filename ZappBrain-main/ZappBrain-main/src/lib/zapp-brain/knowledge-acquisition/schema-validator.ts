/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DocumentType, ExtractedField } from './types';

export interface ValidationRule {
  required: boolean;
  type: 'string' | 'number' | 'date' | 'boolean';
  regex?: RegExp;
}

export const DOCUMENT_SCHEMAS: Record<DocumentType, Record<string, ValidationRule>> = {
  driver_licence: {
    driver_name: { required: true, type: 'string' },
    license_number: { required: true, type: 'string' },
    license_code: { required: true, type: 'string' },
    expiry_date: { required: true, type: 'date' }
  },
  prdp_certificate: {
    prdp_number: { required: true, type: 'string' },
    prdp_expiry: { required: true, type: 'date' },
    prdp_status: { required: false, type: 'string' }
  },
  cof: {
    cof_number: { required: true, type: 'string' },
    expiry_date: { required: true, type: 'date' },
    status: { required: true, type: 'string' }
  },
  vehicle_registration: {
    vehicle_id: { required: true, type: 'string' },
    chassis_number: { required: false, type: 'string' },
    make: { required: false, type: 'string' },
    model: { required: false, type: 'string' }
  },
  service_invoice: {
    vehicle_id: { required: true, type: 'string' },
    workshop_name: { required: true, type: 'string' },
    cost: { required: true, type: 'number' },
    fault_description: { required: false, type: 'string' },
    parts_list: { required: false, type: 'string' }
  },
  workshop_report: {
    vehicle_id: { required: true, type: 'string' },
    findings: { required: true, type: 'string' }
  },
  delivery_note: {
    delivery_note_id: { required: true, type: 'string' },
    customer_id: { required: true, type: 'string' }
  },
  pod: {
    pod_id: { required: true, type: 'string' },
    job_id: { required: true, type: 'string' },
    signee_name: { required: true, type: 'string' },
    status: { required: true, type: 'string' }
  },
  fuel_slip: {
    fuel_litres: { required: true, type: 'number' },
    fuel_cost: { required: true, type: 'number' }
  },
  inspection_sheet: {
    vehicle_id: { required: true, type: 'string' },
    inspector_name: { required: true, type: 'string' }
  },
  incident_report: {
    incident_id: { required: true, type: 'string' },
    vehicle_id: { required: true, type: 'string' },
    driver_id: { required: true, type: 'string' }
  },
  customer_spreadsheet: {
    customer_id: { required: true, type: 'string' },
    average_delay_minutes: { required: true, type: 'number' }
  },
  gps_export: {
    session_id: { required: true, type: 'string' },
    coverage_percentage: { required: true, type: 'number' }
  },
  fleet_export_csv: {
    vehicleCount: { required: true, type: 'number' },
    driversCount: { required: true, type: 'number' }
  },
  excel_workbook: {
    vehicleCount: { required: true, type: 'number' },
    driversCount: { required: true, type: 'number' }
  },
  unknown: {}
};

/**
 * Validates fields against schema rules and registers validation errors.
 */
export function validateFields(
  documentType: DocumentType,
  fields: Record<string, ExtractedField>
): { isValid: boolean; missingRequired: string[]; invalidTypes: string[] } {
  const schema = DOCUMENT_SCHEMAS[documentType];
  const missingRequired: string[] = [];
  const invalidTypes: string[] = [];

  if (!schema) {
    return { isValid: true, missingRequired, invalidTypes };
  }

  Object.entries(schema).forEach(([fieldKey, rule]) => {
    const field = fields[fieldKey];

    // 1. Check required fields
    if (rule.required && (!field || field.value === undefined || field.value === null || field.value === '')) {
      missingRequired.push(fieldKey);
      return;
    }

    if (!field) return;

    // 2. Check types
    const val = field.value;
    if (rule.type === 'number') {
      const num = parseFloat(val);
      if (isNaN(num)) {
        invalidTypes.push(fieldKey);
      }
    } else if (rule.type === 'date') {
      const dateVal = new Date(val);
      if (isNaN(dateVal.getTime())) {
        invalidTypes.push(fieldKey);
      }
    }
  });

  const isValid = missingRequired.length === 0 && invalidTypes.length === 0;
  return { isValid, missingRequired, invalidTypes };
}
