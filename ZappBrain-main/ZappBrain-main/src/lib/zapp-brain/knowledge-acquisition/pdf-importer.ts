/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExtractedField } from './types';

/**
 * Extracts structured fields from simulated PDF text lines.
 */
export function importPDFDocument(content: string, filename: string): Record<string, ExtractedField> {
  const fields: Record<string, ExtractedField> = {};
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Helper to extract values using regex patterns
  const extractWithPatterns = (patterns: RegExp[], line: string): string | null => {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  };

  // Workshop / Service Invoice Patterns
  const invoicePatterns = {
    vehicle_id: [/(?:vehicle|truck|registration|reg)(?:\s+id|:|\s+number)?\s*[:\-]?\s*([A-Z0-9\-]{3,15})/i],
    workshop_name: [/(?:workshop|provider|serviced\s+by|service\s+center)\s*[:\-]?\s*([A-Za-z0-9\s,&]{3,30})/i],
    fault_description: [/(?:fault|complaint|defect|reported\s+issue)\s*[:\-]?\s*([A-Za-z0-9\s,\.\-]{5,50})/i],
    parts_list: [/(?:parts|parts\s+replaced|materials)\s*[:\-]?\s*([A-Za-z0-9\s,\+\/\-]{3,50})/i],
    labour_hours: [/(?:labour|labor|hours|time\s+spent)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:hours|hrs)?/i],
    cost: [/(?:cost|total|amount|invoice\s+total|price)\s*[:\-]?\s*(?:R|R$)?\s*(\d+(?:[,\.]\d{2})?)/i],
    next_service_interval: [/(?:next\s+service|service\s+due|interval)\s*[:\-]?\s*([A-Za-z0-9\s,]{3,30})/i],
  };

  // Certificate of Fitness (COF) Patterns
  const cofPatterns = {
    cof_number: [/(?:certificate|cof|cert|license\s+number)\s*[:\-]?\s*([A-Za-z0-9\-\/]{5,20})/i],
    expiry_date: [/(?:expiry|expires|valid\s+until|expiry\s+date)\s*[:\-]?\s*(\d{4}[\-\/]\d{2}[\-\/]\d{2})/i],
    status: [/(?:status|result|class)\s*[:\-]?\s*(pass|fail|compliant|non-compliant|valid|expired)/i]
  };

  lines.forEach(line => {
    // 1. Try Service Invoice patterns
    Object.entries(invoicePatterns).forEach(([key, regexes]) => {
      const val = extractWithPatterns(regexes, line);
      if (val && !fields[key]) {
        fields[key] = {
          value: val,
          confidence: 94,
          source: filename,
          extractionMethod: 'regex',
          verificationStatus: 'unverified'
        };
      }
    });

    // 2. Try COF patterns
    Object.entries(cofPatterns).forEach(([key, regexes]) => {
      const val = extractWithPatterns(regexes, line);
      if (val && !fields[key]) {
        fields[key] = {
          value: val,
          confidence: 96,
          source: filename,
          extractionMethod: 'regex',
          verificationStatus: 'unverified'
        };
      }
    });
  });

  // Provide high-fidelity defaults if specific elements are matched conceptually
  if (content.toLowerCase().includes('invoice') || content.toLowerCase().includes('diesel')) {
    // Fill fallback fields with lower confidence if not caught by regex
    if (!fields['vehicle_id']) {
      const vMatch = content.match(/(TRK-\d+|[A-Z]{2}\s\d{3}-\d{3})/i);
      if (vMatch) {
        fields['vehicle_id'] = { value: vMatch[0], confidence: 90, source: filename, extractionMethod: 'heuristic', verificationStatus: 'unverified' };
      }
    }
    if (!fields['cost']) {
      const costMatch = content.match(/(?:R|R$)?\s*(\d+,\d{2}|\d+\s\d{2}|\d{3,6})/i);
      if (costMatch) {
        fields['cost'] = { value: costMatch[0], confidence: 85, source: filename, extractionMethod: 'heuristic', verificationStatus: 'unverified' };
      }
    }
  }

  return fields;
}
