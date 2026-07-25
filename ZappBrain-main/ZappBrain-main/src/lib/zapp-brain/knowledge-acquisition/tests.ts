/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { classifyDocument } from './document-classifier';
import { parseCSV, importFleetCSV } from './csv-importer';
import { importExcelWorkbook } from './excel-importer';
import { importPDFDocument } from './pdf-importer';
import { importImageOCR } from './image-parser';
import { normalizeDate, normalizeCurrency, normalizeLicensePlate, normalizeName } from './data-normalizer';
import { validateFields } from './schema-validator';
import { KnowledgeAcquisitionLayer, queryKnowledgeGraph } from './knowledge-extractor';

/**
 * Runs the Phase 22 Knowledge Acquisition validation suite.
 */
export function runKnowledgeAcquisitionTests(): void {
  console.log('🧪 Starting Zapp Brain Phase 22 Knowledge Acquisition Tests...');

  // 1. Classification Tests
  const csvContent = 'Plate,License_Expiry,PrDP_Expiry,driver_name,cof_status,risk_score\nCA 123-456,2028-04-18,2027-04-18,Sipho Nene,Valid,15';
  const classifiedCSV = classifyDocument('Fleet.csv', csvContent);
  if (classifiedCSV !== 'fleet_export_csv') {
    throw new Error(`Classifier failed on CSV. Expected "fleet_export_csv", got "${classifiedCSV}"`);
  }

  const invoicePDF = '%PDF-1.4\nWorkshop: ABC Diesel\nFault: Turbo Failure\nParts: Turbocharger\nLabour: 8 hours\nCost: R42,100\nNext Service: 15,000 km';
  const classifiedPDF = classifyDocument('WorkshopInvoice.pdf', invoicePDF);
  if (classifiedPDF !== 'service_invoice') {
    throw new Error(`Classifier failed on service invoice PDF. Expected "service_invoice", got "${classifiedPDF}"`);
  }

  const licJPG = 'License Class: Code EC\nDriver: Sipho Nene\nExpiry Date: 2027-04-18\nLicense No: EC123456';
  const classifiedJPG = classifyDocument('driver_license.jpg', licJPG);
  if (classifiedJPG !== 'driver_licence') {
    throw new Error(`Classifier failed on JPEG licence. Expected "driver_licence", got "${classifiedJPG}"`);
  }
  console.log('✅ Document Classification successfully validated.');

  // 2. CSV Parser Tests
  const parsedRows = parseCSV('h1,h2\n"v1,with,comma",v2');
  if (parsedRows[1][0] !== 'v1,with,comma') {
    throw new Error('CSV parser failed to account for enclosing double quotes.');
  }
  console.log('✅ CSV Parser successfully validated.');

  // 3. Normalizer Tests
  const dateVal = normalizeDate('18/04/2027');
  if (dateVal !== '2027-04-18') {
    throw new Error(`Date normalizer returned incorrect format: ${dateVal}`);
  }

  const currencyVal = normalizeCurrency('R 42,100.00');
  if (currencyVal !== 42100.00) {
    throw new Error(`Currency normalizer returned incorrect float: ${currencyVal}`);
  }

  const nameVal = normalizeName('  sipho   nene  ');
  if (nameVal !== 'Sipho Nene') {
    throw new Error(`Name normalizer failed. Got "${nameVal}"`);
  }
  console.log('✅ Data Normalizers successfully validated.');

  // 4. Schema Validator Tests
  const validLicenceFields = {
    driver_name: { value: 'Sipho Nene', confidence: 95, source: 'lic.jpg', extractionMethod: 'ocr' as const, verificationStatus: 'unverified' as const },
    license_number: { value: 'EC123456', confidence: 98, source: 'lic.jpg', extractionMethod: 'ocr' as const, verificationStatus: 'unverified' as const },
    license_code: { value: 'EC', confidence: 92, source: 'lic.jpg', extractionMethod: 'ocr' as const, verificationStatus: 'unverified' as const },
    expiry_date: { value: '2027-04-18', confidence: 97, source: 'lic.jpg', extractionMethod: 'ocr' as const, verificationStatus: 'unverified' as const }
  };
  const { isValid } = validateFields('driver_licence', validLicenceFields);
  if (!isValid) {
    throw new Error('Schema validation failed for clean, complete driver licence fields.');
  }
  console.log('✅ Schema Validation successfully validated.');

  // 5. PDF & Image Extraction Verification
  const pdfExtracted = importPDFDocument(invoicePDF, 'WorkshopInvoice.pdf');
  if (!pdfExtracted['workshop_name'] || pdfExtracted['workshop_name'].value !== 'ABC Diesel') {
    throw new Error('PDF Importer failed to parse workshop name.');
  }
  if (!pdfExtracted['cost'] || normalizeCurrency(pdfExtracted['cost'].value) !== 42100) {
    throw new Error('PDF Importer failed to parse invoice cost.');
  }

  const imgExtracted = importImageOCR(licJPG, 'driver_license.jpg');
  if (!imgExtracted['driver_name'] || imgExtracted['driver_name'].value !== 'Sipho Nene') {
    throw new Error('Image OCR Parser failed to parse driver name.');
  }
  console.log('✅ Document Extraction algorithms successfully validated.');

  // 6. Knowledge Graph & Acquisition Orchestrator Tests
  const layer = new KnowledgeAcquisitionLayer();
  
  // Ingest clean PDF document to trigger high-confidence Graph nodes & edges
  const invoiceDoc = `Workshop: ABC Diesel Services\nVehicle ID: vh_actros_1\nCost: R42100\nFault: Turbo Failure`;
  const resultPDF = layer.ingestDocument('WorkshopInvoice.pdf', invoiceDoc);
  if (resultPDF.verificationRequired) {
    throw new Error('Ingester flagged high-confidence service invoice for verification unexpectedly.');
  }

  // Query graph
  const relationships = layer.queryRelationships('vh_actros_1');
  const relationsStr = relationships.join('\n');
  if (!relationsStr.includes('SERVICED_AT_WORKSHOP') && !relationsStr.includes('REPAIRS_COMPLETED_ON')) {
    throw new Error('Knowledge Graph did not establish mechanical relations for serviced vehicle.');
  }
  console.log('✅ Knowledge Graph Relationships successfully validated.');

  // 7. Manual Verification Queue & Learning Loop Tests
  const lowConfidenceLicense = `License Class: Code EC\nDriver: Sipho Nene\nExpiry Date: 2027-04-18\nLicense No: EC123???`; // bad ocr
  const resultIMG = layer.ingestDocument('driver_license.jpg', lowConfidenceLicense);
  
  // Confirm it entered verification queue
  const queue = layer.getVerificationQueue();
  const badLicItem = queue.find(q => q.fieldKey === 'license_number');
  if (!badLicItem) {
    throw new Error('Low-confidence field failed to trigger manual verification queue routing.');
  }

  // Submit correction
  layer.submitCorrection(badLicItem.id, 'EC123456');

  // Verify queue cleared
  if (layer.getVerificationQueue().length !== 0) {
    throw new Error('Verification item remained in queue after dispatcher correction.');
  }

  // Verify learning rule logged
  const rules = layer.getLearningRules();
  const rule = rules.find(r => r.fieldKey === 'license_number' && r.matchPattern === 'EC123???');
  if (!rule || rule.replacementValue !== 'EC123456') {
    throw new Error('Learning feedback loop failed to persist correction rule.');
  }

  // Ingest identical document again to check if rule auto-corrects and bypasses verification!
  const secondAcquisition = layer.ingestDocument('driver_license_2.jpg', lowConfidenceLicense);
  if (secondAcquisition.extractedFields['license_number'].value !== 'EC123456' || secondAcquisition.extractedFields['license_number'].verificationStatus !== 'corrected') {
    throw new Error('Correction Learning Loop failed to auto-correct low-confidence duplicate OCR patterns.');
  }

  console.log('✅ Verification Queue and Deterministic Learning Loop successfully validated.');
  console.log('🎉 All Zapp Brain Phase 22 Knowledge Acquisition Tests Passed!');
}
