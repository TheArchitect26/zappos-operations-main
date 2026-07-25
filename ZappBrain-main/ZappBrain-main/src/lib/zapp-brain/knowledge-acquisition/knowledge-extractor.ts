/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DocumentType,
  ExtractedField,
  KnowledgeGraph,
  KnowledgeGraphNode,
  KnowledgeGraphEdge,
  VerificationItem,
  CorrectionLearningRule,
  DocumentAcquisitionResult,
  EntityType
} from './types';
import { classifyDocument } from './document-classifier';
import { importFleetCSV } from './csv-importer';
import { importExcelWorkbook } from './excel-importer';
import { importPDFDocument } from './pdf-importer';
import { importImageOCR } from './image-parser';
import { normalizeDate, normalizeCurrency, normalizeLicensePlate, normalizeName } from './data-normalizer';
import { validateFields } from './schema-validator';

export class KnowledgeAcquisitionLayer {
  private documents: Record<string, DocumentAcquisitionResult> = {};
  private graph: KnowledgeGraph = { nodes: {}, edges: [] };
  private verificationQueue: VerificationItem[] = [];
  private learningRules: CorrectionLearningRule[] = [];

  constructor() {
    this.initializeBaselineGraph();
  }

  /**
   * Pre-populates the Knowledge Graph with base fleet relationships.
   */
  private initializeBaselineGraph(): void {
    const baseNodes: KnowledgeGraphNode[] = [
      { id: 'vh_actros_1', type: 'vehicle', properties: { plate_number: 'CA 123-456', make: 'Mercedes-Benz', model: 'Actros' } },
      { id: 'vh_scania_3', type: 'vehicle', properties: { plate_number: 'GP-SCALE-3', make: 'Scania', model: 'R500' } },
      { id: 'dr_sipho_nene', type: 'driver', properties: { name: 'Sipho Nene', license: 'EC' } },
      { id: 'rt_n1_cpt_jhb', type: 'route', properties: { from: 'Cape Town', to: 'Johannesburg', average_speed: 82 } },
      { id: 'cu_shoprite_ct', type: 'customer', properties: { name: 'Shoprite CPT Depot', delay_index: 25 } },
      { id: 'dp_jhb_terminal', type: 'depot', properties: { name: 'JHB Linehaul Terminal', congestion: 'high' } },
      { id: 'ws_abc_diesel', type: 'workshop', properties: { name: 'ABC Diesel Services', location: 'Johannesburg' } }
    ];

    baseNodes.forEach(node => {
      this.graph.nodes[node.id] = node;
    });

    const baseEdges: KnowledgeGraphEdge[] = [
      { sourceId: 'dr_sipho_nene', targetId: 'vh_actros_1', relationType: 'assigned_to_vehicle', weight: 1.0, properties: {} },
      { sourceId: 'vh_actros_1', targetId: 'rt_n1_cpt_jhb', relationType: 'routes_on', weight: 1.0, properties: {} },
      { sourceId: 'rt_n1_cpt_jhb', targetId: 'cu_shoprite_ct', relationType: 'services_customer', weight: 1.0, properties: {} },
      { sourceId: 'cu_shoprite_ct', targetId: 'dp_jhb_terminal', relationType: 'delivers_to_depot', weight: 1.0, properties: {} },
      { sourceId: 'vh_actros_1', targetId: 'ws_abc_diesel', relationType: 'serviced_at_workshop', weight: 0.8, properties: {} }
    ];

    this.graph.edges.push(...baseEdges);
  }

  /**
   * Orchestrates the document loading and knowledge extraction pipeline.
   */
  public ingestDocument(filename: string, rawContent: string): DocumentAcquisitionResult {
    const documentId = `doc_${Math.random().toString(36).substring(2, 9)}`;
    const documentType = classifyDocument(filename, rawContent);
    const rawSize = rawContent.length;

    let extractedFields: Record<string, ExtractedField> = {};

    // 1. Parse content based on classified DocumentType
    switch (documentType) {
      case 'fleet_export_csv':
        extractedFields = importFleetCSV(rawContent, filename);
        break;
      case 'excel_workbook':
        extractedFields = importExcelWorkbook(rawContent, filename);
        break;
      case 'service_invoice':
      case 'cof':
      case 'vehicle_registration':
        extractedFields = importPDFDocument(rawContent, filename);
        break;
      case 'driver_licence':
      case 'prdp_certificate':
      case 'fuel_slip':
        extractedFields = importImageOCR(rawContent, filename);
        break;
      default:
        // Generic text fallback extraction
        extractedFields = {};
    }

    // 2. Perform Data Normalization on fields
    Object.keys(extractedFields).forEach(key => {
      const field = extractedFields[key];
      
      // Apply learned rules first (deterministic correction learning)
      const rule = this.learningRules.find(r => r.documentType === documentType && r.fieldKey === key && String(field.value) === r.matchPattern);
      if (rule) {
        field.value = rule.replacementValue;
        field.confidence = 100;
        field.verificationStatus = 'corrected';
      }

      // Format normalization
      if (key.includes('date') || key.includes('expiry')) {
        field.value = normalizeDate(String(field.value));
      } else if (key.includes('cost') || key.includes('litres')) {
        field.value = normalizeCurrency(field.value);
      } else if (key.includes('plate') || key.includes('registration') || key === 'vehicle_id') {
        field.value = normalizeLicensePlate(String(field.value));
      } else if (key.includes('name') || key === 'driver') {
        field.value = normalizeName(String(field.value));
      }
    });

    // 3. Schema Validation
    const { isValid, missingRequired } = validateFields(documentType, extractedFields);

    // 4. Verification Queue populating for low confidence (< 90%) or invalid schemas
    let verificationRequired = !isValid;
    Object.entries(extractedFields).forEach(([key, field]) => {
      if (field.confidence < 90) {
        verificationRequired = true;
        this.verificationQueue.push({
          id: `ver_${Math.random().toString(36).substring(2, 9)}`,
          documentId,
          documentType,
          fieldKey: key,
          originalValue: String(field.value),
          currentValue: String(field.value),
          confidence: field.confidence,
          status: 'pending',
          reason: `Confidence is below threshold: ${field.confidence}%`
        });
      }
    });

    if (missingRequired.length > 0) {
      missingRequired.forEach(reqKey => {
        this.verificationQueue.push({
          id: `ver_${Math.random().toString(36).substring(2, 9)}`,
          documentId,
          documentType,
          fieldKey: reqKey,
          originalValue: '',
          currentValue: '',
          confidence: 0,
          status: 'pending',
          reason: `Missing mandatory schema field: ${reqKey}`
        });
      });
    }

    // 5. Update Knowledge Graph with newly verified High-Confidence links
    if (!verificationRequired) {
      this.updateKnowledgeGraphFromFields(documentType, extractedFields, documentId);
    }

    const result: DocumentAcquisitionResult = {
      documentId,
      documentType,
      rawSize,
      extractedFields,
      verificationRequired
    };

    this.documents[documentId] = result;
    return result;
  }

  /**
   * Deterministically links entities in the Knowledge Graph based on valid extracted fields.
   */
  private updateKnowledgeGraphFromFields(
    docType: DocumentType,
    fields: Record<string, ExtractedField>,
    sourceDocId: string
  ): void {
    if (docType === 'service_invoice') {
      const vId = fields['vehicle_id']?.value || 'vh_actros_1';
      const wsName = fields['workshop_name']?.value || 'ABC Diesel Services';
      const wsId = `ws_${wsName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const cost = fields['cost']?.value || 0;

      // Ensure nodes exist
      if (!this.graph.nodes[vId]) {
        this.graph.nodes[vId] = { id: vId, type: 'vehicle', properties: { plate_number: vId }, sourceDocId };
      }
      if (!this.graph.nodes[wsId]) {
        this.graph.nodes[wsId] = { id: wsId, type: 'workshop', properties: { name: wsName }, sourceDocId };
      }

      // Add a service maintenance ticket node
      const maintId = `maint_invoice_${sourceDocId}`;
      this.graph.nodes[maintId] = { id: maintId, type: 'maintenance', properties: { cost, details: fields['fault_description']?.value || 'Routine check' }, sourceDocId };

      // Link them together
      this.graph.edges.push({ sourceId: vId, targetId: wsId, relationType: 'serviced_at_workshop', weight: 1.0, properties: { cost } });
      this.graph.edges.push({ sourceId: maintId, targetId: vId, relationType: 'repairs_completed_on', weight: 1.0, properties: {} });
    } else if (docType === 'driver_licence') {
      const dName = fields['driver_name']?.value || 'Unknown Driver';
      const dId = `dr_${dName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const licNo = fields['license_number']?.value || '';

      if (!this.graph.nodes[dId]) {
        this.graph.nodes[dId] = { id: dId, type: 'driver', properties: { name: dName, license_number: licNo }, sourceDocId };
      }
    }
  }

  /**
   * Returns a complete, unified relationship summary from the Knowledge Graph.
   */
  public queryRelationships(entityId: string): string[] {
    const relationships: string[] = [];
    const node = this.graph.nodes[entityId];
    if (!node) return [`Entity ${entityId} not found in Knowledge Graph.`];

    this.graph.edges.forEach(edge => {
      if (edge.sourceId === entityId) {
        const targetNode = this.graph.nodes[edge.targetId];
        relationships.push(`Node **${entityId}** (${node.type.toUpperCase()}) -> ${edge.relationType.toUpperCase()} -> **${edge.targetId}** (${targetNode ? targetNode.type.toUpperCase() : 'UNKNOWN'})`);
      } else if (edge.targetId === entityId) {
        const sourceNode = this.graph.nodes[edge.sourceId];
        relationships.push(`Node **${edge.sourceId}** (${sourceNode ? sourceNode.type.toUpperCase() : 'UNKNOWN'}) -> ${edge.relationType.toUpperCase()} -> **${entityId}** (${node.type.toUpperCase()})`);
      }
    });

    return relationships;
  }

  /**
   * Completes verification correction, logging feedback rules to improve future OCR matches.
   */
  public submitCorrection(verificationId: string, correctedValue: string): void {
    const index = this.verificationQueue.findIndex(v => v.id === verificationId);
    if (index === -1) return;

    const item = this.verificationQueue[index];
    item.currentValue = correctedValue;
    item.status = 'corrected';

    // Learning Loop: Log a correction pattern to build future deterministic rules
    const ruleId = `rule_${Math.random().toString(36).substring(2, 9)}`;
    const existingRule = this.learningRules.find(r => r.documentType === item.documentType && r.fieldKey === item.fieldKey && r.matchPattern === item.originalValue);

    if (existingRule) {
      existingRule.correctionCount++;
    } else {
      this.learningRules.push({
        id: ruleId,
        documentType: item.documentType,
        fieldKey: item.fieldKey,
        matchPattern: item.originalValue,
        replacementValue: correctedValue,
        correctionCount: 1
      });
    }

    // Remove item from active verification queue
    this.verificationQueue.splice(index, 1);

    // Update document registry
    const doc = this.documents[item.documentId];
    if (doc && doc.extractedFields[item.fieldKey]) {
      doc.extractedFields[item.fieldKey].value = correctedValue;
      doc.extractedFields[item.fieldKey].confidence = 100;
      doc.extractedFields[item.fieldKey].verificationStatus = 'corrected';
    }
  }

  public getVerificationQueue(): VerificationItem[] {
    return this.verificationQueue;
  }

  public getLearningRules(): CorrectionLearningRule[] {
    return this.learningRules;
  }

  public getGraph(): KnowledgeGraph {
    return this.graph;
  }
}

/**
 * Universal Knowledge Graph Query function.
 */
export function queryKnowledgeGraph(layer: KnowledgeAcquisitionLayer, startEntityId: string): string {
  const traces = layer.queryRelationships(startEntityId);
  return `### 🕸️ Knowledge Graph Connections for: ${startEntityId}\n${traces.map(t => `- ${t}`).join('\n')}`;
}
