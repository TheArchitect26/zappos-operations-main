/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DocumentType =
  | 'driver_licence'
  | 'prdp_certificate'
  | 'cof' // Certificate of Fitness
  | 'vehicle_registration'
  | 'service_invoice'
  | 'workshop_report'
  | 'delivery_note'
  | 'pod' // Proof of Delivery
  | 'fuel_slip'
  | 'inspection_sheet'
  | 'incident_report'
  | 'customer_spreadsheet'
  | 'gps_export'
  | 'fleet_export_csv'
  | 'excel_workbook'
  | 'unknown';

export type ExtractionMethod = 'ocr' | 'text_parsing' | 'regex' | 'heuristic' | 'manual_input';

export type VerificationStatus = 'unverified' | 'verified' | 'corrected';

export interface ExtractedField<T = any> {
  value: T;
  confidence: number; // 0 to 100
  source: string;
  extractionMethod: ExtractionMethod;
  verificationStatus: VerificationStatus;
}

export type EntityType =
  | 'vehicle'
  | 'driver'
  | 'route'
  | 'customer'
  | 'depot'
  | 'workshop'
  | 'incident'
  | 'maintenance'
  | 'telemetry';

export interface KnowledgeGraphNode {
  id: string;
  type: EntityType;
  properties: Record<string, any>;
  sourceDocId?: string;
}

export interface KnowledgeGraphEdge {
  sourceId: string;
  targetId: string;
  relationType: string;
  weight: number;
  properties: Record<string, any>;
}

export interface KnowledgeGraph {
  nodes: Record<string, KnowledgeGraphNode>;
  edges: KnowledgeGraphEdge[];
}

export interface VerificationItem {
  id: string;
  documentId: string;
  documentType: DocumentType;
  fieldKey: string;
  originalValue: string;
  currentValue: string;
  confidence: number;
  status: 'pending' | 'verified' | 'corrected';
  reason: string;
}

export interface CorrectionLearningRule {
  id: string;
  documentType: DocumentType;
  fieldKey: string;
  matchPattern: string; // Regex or string pattern to detect error
  replacementValue: string; // Corrected mapped value
  correctionCount: number;
}

export interface DocumentAcquisitionResult {
  documentId: string;
  documentType: DocumentType;
  rawSize: number;
  extractedFields: Record<string, ExtractedField>;
  verificationRequired: boolean;
}
