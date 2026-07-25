/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExtractedField } from './types';

/**
 * Simulates OCR-based parsing of images (licenses, PrDP certs, fuel receipts).
 */
export function importImageOCR(content: string, filename: string): Record<string, ExtractedField> {
  const fields: Record<string, ExtractedField> = {};
  const c = content.toLowerCase();

  // Driver License OCR Patterns
  if (c.includes('licence') || c.includes('permit') || c.includes('code ec')) {
    // Driver Name
    const nameMatch = content.match(/(?:name|driver|operator)\s*[:\-]?\s*([A-Za-z\s]{3,30})/i);
    fields['driver_name'] = {
      value: nameMatch ? nameMatch[1].trim() : 'Sipho Nene',
      confidence: nameMatch ? 95 : 88,
      source: filename,
      extractionMethod: 'ocr',
      verificationStatus: 'unverified'
    };

    // Licence Number
    const licMatch = content.match(/(?:licence|license|permit\s+no|number)\s*[:\-]?\s*([A-Za-z0-9\s\-\/]{6,20})/i);
    fields['license_number'] = {
      value: licMatch ? licMatch[1].trim() : 'EC123456',
      confidence: licMatch ? 98 : 80,
      source: filename,
      extractionMethod: 'ocr',
      verificationStatus: 'unverified'
    };

    // Licence Code
    const codeMatch = content.match(/(?:code|class|type)\s*[:\-]?\s*([A-Z0-9\s]{2,10})/i);
    fields['license_code'] = {
      value: codeMatch ? codeMatch[1].trim() : 'EC',
      confidence: codeMatch ? 92 : 85,
      source: filename,
      extractionMethod: 'ocr',
      verificationStatus: 'unverified'
    };

    // Expiry Date
    const expMatch = content.match(/(?:expiry|expires|valid\s+until|valid\s+to)\s*[:\-]?\s*(\d{4}[\-\/]\d{2}[\-\/]\d{2})/i);
    fields['expiry_date'] = {
      value: expMatch ? expMatch[1].trim() : '2027-04-18',
      confidence: expMatch ? 97 : 82,
      source: filename,
      extractionMethod: 'ocr',
      verificationStatus: 'unverified'
    };
  }

  // PrDP Certificate OCR Patterns
  if (c.includes('prdp') || c.includes('professional driving permit')) {
    const prdpMatch = content.match(/(?:prdp\s+no|permit|prdp)\s*[:\-]?\s*([A-Za-z0-9\s\-\/]{5,25})/i);
    fields['prdp_number'] = {
      value: prdpMatch ? prdpMatch[1].trim() : 'PRDP-98765-A',
      confidence: prdpMatch ? 96 : 85,
      source: filename,
      extractionMethod: 'ocr',
      verificationStatus: 'unverified'
    };

    const expMatch = content.match(/(?:expiry|expires|valid\s+to|valid\s+until)\s*[:\-]?\s*(\d{4}[\-\/]\d{2}[\-\/]\d{2})/i);
    fields['prdp_expiry'] = {
      value: expMatch ? expMatch[1].trim() : '2027-04-18',
      confidence: expMatch ? 98 : 83,
      source: filename,
      extractionMethod: 'ocr',
      verificationStatus: 'unverified'
    };

    fields['prdp_status'] = {
      value: 'valid',
      confidence: 90,
      source: filename,
      extractionMethod: 'heuristic',
      verificationStatus: 'unverified'
    };
  }

  // Fuel Slip Patterns
  if (c.includes('fuel') || c.includes('litres') || c.includes('diesel')) {
    const litresMatch = content.match(/(?:litres|liters|qty|volume)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i);
    fields['fuel_litres'] = {
      value: litresMatch ? parseFloat(litresMatch[1]) : 180,
      confidence: litresMatch ? 95 : 80,
      source: filename,
      extractionMethod: 'ocr',
      verificationStatus: 'unverified'
    };

    const amountMatch = content.match(/(?:total|amount|cost|paid|sale)\s*[:\-]?\s*(?:R|R$)?\s*(\d+(?:\.\d+)?)/i);
    fields['fuel_cost'] = {
      value: amountMatch ? parseFloat(amountMatch[1]) : 3600.00,
      confidence: amountMatch ? 94 : 82,
      source: filename,
      extractionMethod: 'ocr',
      verificationStatus: 'unverified'
    };
  }

  return fields;
}
