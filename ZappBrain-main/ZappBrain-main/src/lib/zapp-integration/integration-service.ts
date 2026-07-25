/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Connector, ConnectorStatus, TelemetryNormalizedData, CSVImportTemplate, 
  FileStageRecord, WebhookRecord, HardwarePacketRecord, CommunicationDraft, 
  FieldMapping, IntegrationHealthMetric, IntegrationAuditLog 
} from './types';

class IntegrationService {
  private connectors: Connector[] = [];
  private fileStageRecords: FileStageRecord[] = [];
  private webhookRecords: WebhookRecord[] = [];
  private hardwarePackets: HardwarePacketRecord[] = [];
  private communicationDrafts: CommunicationDraft[] = [];
  private fieldMappings: FieldMapping[] = [];
  private auditLogs: IntegrationAuditLog[] = [];
  private healthMetrics: Map<string, IntegrationHealthMetric> = new Map(); // key is connector_id

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    const defaultCompanyId = 'comp-zapp-demo';

    // 1. Default Connectors
    const initialConnectors: Omit<Connector, 'created_at' | 'updated_at'>[] = [
      {
        connector_id: 'conn-cartrack-01',
        company_id: defaultCompanyId,
        connector_type: 'vehicle_tracker',
        provider_name: 'Cartrack API Adapter',
        status: 'connected',
        last_sync_at: new Date(Date.now() - 5 * 60000).toISOString(),
        auth_status: 'authorized',
        supported_data_types: ['GPS', 'Ignition', 'Speed', 'Odometer', 'Driver RFID'],
        sync_direction: 'import',
        data_quality_score: 96
      },
      {
        connector_id: 'conn-netstar-02',
        company_id: defaultCompanyId,
        connector_type: 'vehicle_tracker',
        provider_name: 'Netstar Fleet Gateway',
        status: 'configured',
        last_sync_at: new Date(Date.now() - 15 * 60000).toISOString(),
        auth_status: 'authorized',
        supported_data_types: ['GPS', 'Ignition', 'Speed', 'Harsh Braking'],
        sync_direction: 'import',
        data_quality_score: 92
      },
      {
        connector_id: 'conn-mix-03',
        company_id: defaultCompanyId,
        connector_type: 'vehicle_tracker',
        provider_name: 'MiX Telematics Adapter',
        status: 'failed',
        last_sync_at: new Date(Date.now() - 120 * 60000).toISOString(),
        last_error: 'API rate limits exceeded (HTTP 429)',
        auth_status: 'expired',
        supported_data_types: ['GPS', 'Speed', 'Fuel Telemetry'],
        sync_direction: 'import',
        data_quality_score: 64
      },
      {
        connector_id: 'conn-ctrack-04',
        company_id: defaultCompanyId,
        connector_type: 'vehicle_tracker',
        provider_name: 'Ctrack Telematics Link',
        status: 'planned',
        auth_status: 'none',
        supported_data_types: ['GPS', 'Ignition', 'Odometer'],
        sync_direction: 'import',
        data_quality_score: 0
      },
      {
        connector_id: 'conn-webfleet-05',
        company_id: defaultCompanyId,
        connector_type: 'vehicle_tracker',
        provider_name: 'Webfleet Connect Adapter',
        status: 'mock',
        last_sync_at: new Date().toISOString(),
        auth_status: 'authorized',
        supported_data_types: ['GPS', 'Odometer', 'Trip Records'],
        sync_direction: 'bidirectional',
        data_quality_score: 100
      },
      {
        connector_id: 'conn-sheet-import',
        company_id: defaultCompanyId,
        connector_type: 'spreadsheet_import',
        provider_name: 'Standard CSV & Excel Uploader',
        status: 'connected',
        last_sync_at: new Date(Date.now() - 180 * 60000).toISOString(),
        auth_status: 'authorized',
        supported_data_types: ['Vehicles', 'Drivers', 'Jobs', 'Maintenance Logs'],
        sync_direction: 'import',
        data_quality_score: 94
      },
      {
        connector_id: 'conn-onedrive-lake',
        company_id: defaultCompanyId,
        connector_type: 'onedrive_lake',
        provider_name: 'OneDrive Data Lake Staging',
        status: 'configured',
        last_sync_at: new Date(Date.now() - 60 * 60000).toISOString(),
        auth_status: 'authorized',
        supported_data_types: ['All Telemetry Archives', 'Compliance Documents'],
        sync_direction: 'import',
        data_quality_score: 90
      },
      {
        connector_id: 'conn-webhook-listener',
        company_id: defaultCompanyId,
        connector_type: 'notifications',
        provider_name: 'ZappOS Webhook Ingestion Receiver',
        status: 'mock',
        auth_status: 'none',
        supported_data_types: ['Event Webhooks', 'Third Party Updates'],
        sync_direction: 'import',
        data_quality_score: 100
      },
      {
        connector_id: 'conn-zappbox-gateway',
        company_id: defaultCompanyId,
        connector_type: 'hardware_gateway',
        provider_name: 'Zapp Box P1 Hardware Ingestion Gateway',
        status: 'mock',
        auth_status: 'none',
        supported_data_types: ['Raw UDP Streams', 'HMAC Cryptographic Telemetry'],
        sync_direction: 'import',
        data_quality_score: 100
      }
    ];

    const nowStr = new Date().toISOString();
    initialConnectors.forEach(c => {
      this.connectors.push({
        ...c,
        created_at: nowStr,
        updated_at: nowStr
      });
    });

    // 2. Default Field Mappings
    const initialMappings: FieldMapping[] = [
      {
        mapping_id: 'map-01',
        source_field: 'external_vehicle_reg',
        target_field: 'vehicle.registration_number',
        sample_value: 'KCD 412X',
        validation_status: 'valid',
        confidence_pct: 100,
        manual_override: false
      },
      {
        mapping_id: 'map-02',
        source_field: 'tracker_device_id',
        target_field: 'device.external_id',
        sample_value: 'CT-9941-Z',
        validation_status: 'valid',
        confidence_pct: 95,
        manual_override: false
      },
      {
        mapping_id: 'map-03',
        source_field: 'driver_name',
        target_field: 'driver.full_name',
        sample_value: 'John Kiprop',
        validation_status: 'valid',
        confidence_pct: 90,
        manual_override: false
      },
      {
        mapping_id: 'map-04',
        source_field: 'planned_eta',
        target_field: 'job.planned_eta',
        sample_value: '2026-07-12T14:30:00Z',
        validation_status: 'valid',
        confidence_pct: 85,
        manual_override: false
      },
      {
        mapping_id: 'map-05',
        source_field: 'gps_latitude_val',
        target_field: 'telemetry.coordinates.latitude',
        sample_value: '-1.2921',
        validation_status: 'valid',
        confidence_pct: 98,
        manual_override: false
      },
      {
        mapping_id: 'map-06',
        source_field: 'ign_raw',
        target_field: 'telemetry.ignition_state',
        sample_value: '1',
        validation_status: 'warning',
        confidence_pct: 75,
        manual_override: false
      }
    ];
    this.fieldMappings = initialMappings;

    // 3. Setup default health metrics
    this.connectors.forEach(c => {
      this.recalculateHealthForConnector(c.connector_id);
    });

    // 4. Create Initial Audit Logs
    this.addAuditLog(
      defaultCompanyId,
      'SYSTEM',
      'connector_created',
      'Integration Hub default connector registry bootstrapped securely.',
      'info'
    );
  }

  // List of standard CSV import templates
  public getCSVTemplates(): CSVImportTemplate[] {
    return [
      {
        template_id: 'tmpl-vehicles',
        name: 'Vehicles Template',
        required_columns: [
          { name: 'registration_number', required: true, type: 'string', validation_rule: 'Non-empty alphanumeric registration' },
          { name: 'vehicle_type', required: true, type: 'string', validation_rule: 'Must match Truck/Van/Bike' },
          { name: 'status', required: true, type: 'string', validation_rule: 'active | maintenance | inactive' }
        ],
        optional_columns: [
          { name: 'make', required: false, type: 'string', validation_rule: 'Any manufacturer string' },
          { name: 'model', required: false, type: 'string', validation_rule: 'Model name string' },
          { name: 'capacity_kg', required: false, type: 'number', validation_rule: 'Positive number representing payload' }
        ],
        example_row: {
          registration_number: 'KBA 123A',
          vehicle_type: 'Truck',
          status: 'active',
          make: 'Isuzu',
          model: 'FVR',
          capacity_kg: '15000'
        }
      },
      {
        template_id: 'tmpl-drivers',
        name: 'Drivers Template',
        required_columns: [
          { name: 'full_name', required: true, type: 'string', validation_rule: 'Non-empty full name string' },
          { name: 'license_number', required: true, type: 'string', validation_rule: 'Valid professional driving permit ID' },
          { name: 'status', required: true, type: 'string', validation_rule: 'active | offline | suspended' }
        ],
        optional_columns: [
          { name: 'phone_number', required: false, type: 'string', validation_rule: 'International or local cellular number format' },
          { name: 'hire_date', required: false, type: 'date', validation_rule: 'Valid ISO date format' }
        ],
        example_row: {
          full_name: 'Erick Ndwiga',
          license_number: 'DL-NAI-99212',
          status: 'active',
          phone_number: '+254711223344',
          hire_date: '2024-03-15'
        }
      },
      {
        template_id: 'tmpl-jobs',
        name: 'Jobs & Assignments Template',
        required_columns: [
          { name: 'job_id', required: true, type: 'string', validation_rule: 'Unique alphanumeric job identifier' },
          { name: 'customer_name', required: true, type: 'string', validation_rule: 'Non-empty client company name' },
          { name: 'destination_address', required: true, type: 'string', validation_rule: 'Valid geographic address' },
          { name: 'planned_eta', required: true, type: 'date', validation_rule: 'ISO date representing target arrival' }
        ],
        optional_columns: [
          { name: 'cargo_type', required: false, type: 'string', validation_rule: 'Type of cargo (e.g., Perishable, Fuel)' },
          { name: 'urgency', required: false, type: 'string', validation_rule: 'standard | high | critical' }
        ],
        example_row: {
          job_id: 'JOB-2026-9041',
          customer_name: 'East African Breweries Ltd',
          destination_address: 'Thika Road Terminal Depot, Nairobi',
          planned_eta: '2026-07-12T18:00:00Z',
          cargo_type: 'Beverages',
          urgency: 'high'
        }
      },
      {
        template_id: 'tmpl-maintenance',
        name: 'Maintenance Records Template',
        required_columns: [
          { name: 'registration_number', required: true, type: 'string', validation_rule: 'Must link to a registered vehicle' },
          { name: 'maintenance_type', required: true, type: 'string', validation_rule: 'scheduled | emergency | repair' },
          { name: 'cost_amount', required: true, type: 'number', validation_rule: 'Non-negative currency value' },
          { name: 'service_date', required: true, type: 'date', validation_rule: 'ISO date of service' }
        ],
        optional_columns: [
          { name: 'notes', required: false, type: 'string', validation_rule: 'Brief service details string' }
        ],
        example_row: {
          registration_number: 'KCD 412X',
          maintenance_type: 'scheduled',
          cost_amount: '45000',
          service_date: '2026-06-25',
          notes: 'Oil filter replacement and brake caliper adjustments.'
        }
      },
      {
        template_id: 'tmpl-dwell',
        name: 'Dwell Times Template',
        required_columns: [
          { name: 'site_id', required: true, type: 'string', validation_rule: 'Site or depot identifier' },
          { name: 'registration_number', required: true, type: 'string', validation_rule: 'Vehicle identifier' },
          { name: 'arrival_time', required: true, type: 'date', validation_rule: 'ISO date of entry' },
          { name: 'departure_time', required: true, type: 'date', validation_rule: 'ISO date of exit' }
        ],
        optional_columns: [
          { name: 'site_type', required: false, type: 'string', validation_rule: 'terminal | customer | checkpoint' }
        ],
        example_row: {
          site_id: 'DEPOT-MOMBASA-01',
          registration_number: 'KBX 293B',
          arrival_time: '2026-07-10T10:15:00Z',
          departure_time: '2026-07-10T13:45:00Z',
          site_type: 'terminal'
        }
      }
    ];
  }

  // Recalculate health metrics for a connector
  private recalculateHealthForConnector(connectorId: string) {
    const conn = this.connectors.find(c => c.connector_id === connectorId);
    if (!conn) return;

    let score = conn.data_quality_score;
    let warnings: string[] = [];
    let fixes: string[] = [];
    let level: 'not_ready' | 'pilot_ready' | 'production_ready' = 'not_ready';

    // Simulated calculation variations based on status
    if (conn.status === 'connected') {
      level = score > 95 ? 'production_ready' : 'pilot_ready';
      if (score < 90) {
        warnings.push(`Stale telemetry frequency detected on ${conn.provider_name}.`);
        fixes.push('Check external gateway API polling rate.');
      }
    } else if (conn.status === 'mock' || conn.status === 'configured') {
      level = 'pilot_ready';
      warnings.push(`Connector '${conn.provider_name}' is in simulated or staging mode.`);
      fixes.push('Update authentication configuration and test with production credentials.');
    } else if (conn.status === 'failed') {
      level = 'not_ready';
      score = Math.max(10, score - 30);
      warnings.push(`Connector has active connection faults: ${conn.last_error || 'Unknown network error'}`);
      fixes.push('Verify credentials validity, network firewall paths, or service rates.');
    } else {
      level = 'not_ready';
      score = 0;
      warnings.push('Connector is planned or disabled.');
      fixes.push('Complete the system onboarding mapping checklist.');
    }

    // Records imported details
    const imported = conn.status === 'connected' ? 2450 : conn.status === 'mock' ? 120 : 0;
    const rejected = conn.status === 'connected' ? 12 : conn.status === 'mock' ? 2 : 0;
    const duplicateRate = conn.status === 'connected' ? 0.4 : conn.status === 'mock' ? 0.0 : 0.0;

    const metric: IntegrationHealthMetric = {
      connector_id: connectorId,
      records_imported: imported,
      records_rejected: rejected,
      duplicate_rate_pct: duplicateRate,
      missing_required_fields_rate_pct: conn.status === 'failed' ? 14.5 : 0.5,
      stale_data_rate_pct: conn.status === 'failed' ? 24.0 : 1.2,
      invalid_coordinates_count: conn.status === 'failed' ? 8 : 0,
      invalid_dates_count: conn.status === 'failed' ? 4 : 0,
      unmatched_vehicles_count: conn.status === 'failed' ? 12 : 1,
      unmatched_drivers_count: conn.status === 'failed' ? 5 : 0,
      unmatched_jobs_count: conn.status === 'failed' ? 9 : 0,
      last_sync_age_seconds: conn.last_sync_at ? Math.floor((Date.now() - new Date(conn.last_sync_at).getTime()) / 1000) : 999999,
      sync_failure_rate_pct: conn.status === 'failed' ? 45.0 : conn.status === 'connected' ? 1.5 : 0.0,
      health_score: score,
      warnings,
      recommended_fixes: fixes,
      readiness_level: level
    };

    this.healthMetrics.set(connectorId, metric);
  }

  // --- Core API Interfaces for Tenant-Isolated Integration ---

  // 1. Get all connectors isolated by company
  public getConnectors(companyId: string): Connector[] {
    return this.connectors.filter(c => c.company_id === companyId);
  }

  // 2. Add custom connector
  public createConnector(companyId: string, operatorId: string, payload: Omit<Connector, 'connector_id' | 'company_id' | 'created_at' | 'updated_at' | 'data_quality_score' | 'auth_status'>): Connector {
    const newConnector: Connector = {
      connector_id: `conn-custom-${Math.random().toString(36).substr(2, 9)}`,
      company_id: companyId,
      connector_type: payload.connector_type,
      provider_name: payload.provider_name,
      status: payload.status,
      last_sync_at: payload.last_sync_at,
      last_error: payload.last_error,
      auth_status: 'none',
      supported_data_types: payload.supported_data_types,
      sync_direction: payload.sync_direction,
      data_quality_score: 100, // Starts fresh with high confidence
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.connectors.push(newConnector);
    this.recalculateHealthForConnector(newConnector.connector_id);

    this.addAuditLog(
      companyId,
      operatorId,
      'connector_created',
      `Registered new integration connector '${newConnector.provider_name}' of type '${newConnector.connector_type}'.`,
      'info'
    );

    return newConnector;
  }

  // 3. Toggle/Configure connector status
  public updateConnectorStatus(companyId: string, operatorId: string, connectorId: string, newStatus: ConnectorStatus): Connector | null {
    const connIndex = this.connectors.findIndex(c => c.connector_id === connectorId && c.company_id === companyId);
    if (connIndex === -1) return null;

    const conn = this.connectors[connIndex];
    const oldStatus = conn.status;
    conn.status = newStatus;
    conn.updated_at = new Date().toISOString();

    if (newStatus === 'connected') {
      conn.last_sync_at = new Date().toISOString();
      conn.last_error = undefined;
      conn.auth_status = 'authorized';
    } else if (newStatus === 'disabled') {
      conn.auth_status = 'none';
    }

    this.recalculateHealthForConnector(connectorId);

    this.addAuditLog(
      companyId,
      operatorId,
      newStatus === 'disabled' ? 'connector_disabled' : 'sync_completed',
      `Connector '${conn.provider_name}' state migrated from '${oldStatus}' to '${newStatus}'.`,
      'info'
    );

    return conn;
  }

  // 4. Run Mock Synchronization for a connector
  public triggerSync(companyId: string, operatorId: string, connectorId: string): { success: boolean; message: string; connector?: Connector } {
    const conn = this.connectors.find(c => c.connector_id === connectorId && c.company_id === companyId);
    if (!conn) {
      return { success: false, message: 'Connector not found or unauthorized.' };
    }

    if (conn.status === 'disabled') {
      return { success: false, message: 'Cannot sync disabled connectors.' };
    }

    const nowStr = new Date().toISOString();
    this.addAuditLog(companyId, operatorId, 'sync_started', `Initiated manual sync request on connector: ${conn.provider_name}`, 'info');

    // Handle failure modes mock
    if (conn.connector_id === 'conn-mix-03') {
      conn.last_sync_at = nowStr;
      conn.last_error = 'API connection rejected: Credentials expired or rate limit triggered (HTTP 429)';
      conn.status = 'failed';
      conn.updated_at = nowStr;
      this.recalculateHealthForConnector(connectorId);

      this.addAuditLog(companyId, operatorId, 'sync_failed', `Sync execution failed for '${conn.provider_name}': Rate limit hit.`, 'error');
      return { success: false, message: 'Synchronization triggered a rate limit fault (Mock).', connector: conn };
    }

    // Success Simulation
    conn.last_sync_at = nowStr;
    conn.last_error = undefined;
    conn.updated_at = nowStr;
    
    // Slight shift in data quality as sync completes
    conn.data_quality_score = Math.min(100, Math.max(80, conn.data_quality_score + (Math.random() > 0.5 ? 2 : -2)));
    this.recalculateHealthForConnector(connectorId);

    this.addAuditLog(companyId, operatorId, 'sync_completed', `Completed integration ingestion on '${conn.provider_name}'. Staged new telemetry event sequences safely.`, 'info');

    return { success: true, message: 'Sync completed successfully (Mock).', connector: conn };
  }

  // 5. Tracking Provider Mock Adapter Normalizer
  public normalizeTrackingSignals(providerName: string, rawData: any): TelemetryNormalizedData {
    // Normalizes Cartrack / Netstar / MiX etc data layouts to compliant structure.
    // Ensure we safeguard telemetry values gracefully (e.g. coordinates fallback safely)
    const normalized: TelemetryNormalizedData = {
      vehicle_id: rawData.vehicle_id || rawData.reg_no || rawData.registration_number || 'UNKNOWN_VEHICLE',
      latitude: Number(rawData.lat || rawData.latitude || -1.2921),
      longitude: Number(rawData.lon || rawData.lng || rawData.longitude || 36.8219),
      speed_kmh: Math.max(0, Number(rawData.speed || rawData.speed_kmh || 0)),
      heading_deg: Math.max(0, Math.min(360, Number(rawData.heading || rawData.course || 0))),
      ignition_state: rawData.ignition === 'on' || rawData.ignition === 1 || rawData.ignition_state === 'on' ? 'on' : 'off',
      trip_status: rawData.status === 'moving' ? 'moving' : rawData.status === 'idle' ? 'idle' : 'unknown',
      driver_assignment_id: rawData.driver_rfid || rawData.driver_id || undefined,
      event_alerts: Array.isArray(rawData.alerts) ? rawData.alerts : [],
      odometer_km: Math.max(0, Number(rawData.odometer || rawData.odo || 120500)),
      device_health: 'good',
      signal_status: 'excellent'
    };

    return normalized;
  }

  // 6. CSV Template Parse and Validation Simulator
  public simulateCSVImport(companyId: string, operatorId: string, templateId: string, fileContentRows: Record<string, string>[]): {
    success: boolean;
    records_added: number;
    records_rejected: number;
    quarantine_list: Array<{ row_index: number; reason: string; data: Record<string, string> }>;
    report: FileStageRecord;
  } {
    const template = this.getCSVTemplates().find(t => t.template_id === templateId);
    if (!template) {
      throw new Error(`CSV Template '${templateId}' not found.`);
    }

    let recordsAdded = 0;
    let recordsRejected = 0;
    const quarantineList: Array<{ row_index: number; reason: string; data: Record<string, string> }> = [];

    // Deduplication mock tracking
    const seenIds = new Set<string>();

    fileContentRows.forEach((row, index) => {
      let hasError = false;
      let errorReason = '';

      // Required columns check
      for (const col of template.required_columns) {
        const val = row[col.name];
        if (val === undefined || val === null || val.trim() === '') {
          hasError = true;
          errorReason = `Missing required column: '${col.name}'`;
          break;
        }

        // Simple validation checks
        if (col.type === 'number' && isNaN(Number(val))) {
          hasError = true;
          errorReason = `Column '${col.name}' must be a valid number, got '${val}'`;
          break;
        }

        if (col.type === 'date' && isNaN(Date.parse(val))) {
          hasError = true;
          errorReason = `Column '${col.name}' must be a valid date, got '${val}'`;
          break;
        }
      }

      // Check duplicate ID if present (e.g., job_id, registration_number)
      if (!hasError) {
        const primaryKeyCol = template.required_columns[0]?.name;
        if (primaryKeyCol) {
          const pkValue = row[primaryKeyCol];
          if (pkValue) {
            if (seenIds.has(pkValue)) {
              hasError = true;
              errorReason = `Deduplication Check Failed: Duplicate primary key '${pkValue}' within sheet.`;
            } else {
              seenIds.add(pkValue);
            }
          }
        }
      }

      if (hasError) {
        recordsRejected++;
        quarantineList.push({
          row_index: index + 1,
          reason: errorReason,
          data: row
        });
      } else {
        recordsAdded++;
      }
    });

    const mockChecksum = `sha256-${Math.random().toString(36).substring(2, 10)}`;
    const isDuplicateFile = this.fileStageRecords.some(r => r.checksum === mockChecksum);

    const stageRecord: FileStageRecord = {
      file_name: `import_${template.template_id}_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`,
      file_size_bytes: fileContentRows.length * 150,
      checksum: mockChecksum,
      staged_at: new Date().toISOString(),
      total_rows: fileContentRows.length,
      processed_rows: recordsAdded,
      quarantined_rows: recordsRejected,
      duplicate_detected: isDuplicateFile,
      status: recordsRejected > 0 ? 'quarantined' : 'processed',
      report_summary: `Imported ${recordsAdded} records cleanly to stage, quarantined ${recordsRejected} invalid rows for supervisor remediation.`
    };

    if (!isDuplicateFile) {
      this.fileStageRecords.push(stageRecord);
      this.addAuditLog(
        companyId,
        operatorId,
        recordsRejected > 0 ? 'file_quarantined' : 'file_imported',
        `Import processed for sheet '${stageRecord.file_name}'. Status: ${stageRecord.status.toUpperCase()}. Quarantined Count: ${recordsRejected}`,
        recordsRejected > 0 ? 'warning' : 'info'
      );
    } else {
      this.addAuditLog(
        companyId,
        operatorId,
        'file_quarantined',
        `Ignored spreadsheet import: Duplicate file checksum detected. MD5 already archived.`,
        'warning'
      );
    }

    return {
      success: recordsAdded > 0,
      records_added: recordsAdded,
      records_rejected: recordsRejected,
      quarantine_list: quarantineList,
      report: stageRecord
    };
  }

  // 7. OneDrive Data Lake Staging Scan Simulator
  public scanOneDriveStaging(companyId: string, operatorId: string): { scanned_files_count: number; records: FileStageRecord[] } {
    // Generate some simulated OneDrive file arrivals
    const currentCount = this.fileStageRecords.length;
    
    // Simulate finding 2 staged files if we have low records
    if (currentCount < 2) {
      const mockStagedFiles: FileStageRecord[] = [
        {
          file_name: 'onedrive_raw_telemetry_weekly_01.csv',
          file_size_bytes: 40960,
          checksum: 'onedrive-md5-99824',
          staged_at: new Date(Date.now() - 30 * 60000).toISOString(),
          total_rows: 500,
          processed_rows: 495,
          quarantined_rows: 5,
          duplicate_detected: false,
          status: 'quarantined',
          report_summary: 'OneDrive Staging scan auto-processed. 5 bad telemetry structures quarantined.'
        },
        {
          file_name: 'onedrive_driver_compliance_manifest.csv',
          file_size_bytes: 12040,
          checksum: 'onedrive-md5-11041',
          staged_at: new Date(Date.now() - 10 * 60000).toISOString(),
          total_rows: 150,
          processed_rows: 150,
          quarantined_rows: 0,
          duplicate_detected: false,
          status: 'processed',
          report_summary: 'OneDrive Driver list parsed and staged cleanly. Sync 100% compliant.'
        }
      ];

      mockStagedFiles.forEach(f => {
        this.fileStageRecords.push(f);
        this.addAuditLog(
          companyId,
          operatorId,
          'file_imported',
          `OneDrive automated staging parser verified and registered file '${f.file_name}'.`,
          'info'
        );
      });
    }

    return {
      scanned_files_count: 2,
      records: this.fileStageRecords
    };
  }

  // 8. Future-Ready Webhook Receiver Simulation (idempotent, validated)
  public receiveMockWebhook(companyId: string, provider: string, payload: any, idempotencyKey: string): WebhookRecord {
    const receivedTime = new Date().toISOString();

    // Check duplicate idempotency key
    const duplicate = this.webhookRecords.find(w => w.idempotency_key === idempotencyKey);
    if (duplicate) {
      const rejectedRecord: WebhookRecord = {
        webhook_id: `wh-rejected-${Math.random().toString(36).substr(2, 9)}`,
        provider_name: provider,
        event_type: payload.event_type || 'unspecified_event',
        idempotency_key: idempotencyKey,
        received_at: receivedTime,
        status: 'rejected_duplicate',
        payload_summary: `REJECTED: Duplicate Webhook with idempotency key '${idempotencyKey}' already parsed.`
      };
      this.webhookRecords.push(rejectedRecord);
      this.addAuditLog(companyId, 'WEBHOOK_GATEWAY', 'webhook_rejected', `Webhook from ${provider} rejected: Duplicate message id.`, 'warning');
      return rejectedRecord;
    }

    // Mock Payload validator signature block
    const isSignatureValid = payload.mock_signature !== 'INVALID';

    if (!isSignatureValid) {
      const badSigRecord: WebhookRecord = {
        webhook_id: `wh-rejected-${Math.random().toString(36).substr(2, 9)}`,
        provider_name: provider,
        event_type: payload.event_type || 'unspecified_event',
        idempotency_key: idempotencyKey,
        received_at: receivedTime,
        status: 'rejected_signature',
        payload_summary: 'REJECTED: Cryptographic signature mismatch. Source failed handshake.'
      };
      this.webhookRecords.push(badSigRecord);
      this.addAuditLog(companyId, 'WEBHOOK_GATEWAY', 'webhook_rejected', `Webhook signature validation failed on provider ${provider}.`, 'error');
      return badSigRecord;
    }

    // Processed cleanly
    const successRecord: WebhookRecord = {
      webhook_id: `wh-success-${Math.random().toString(36).substr(2, 9)}`,
      provider_name: provider,
      event_type: payload.event_type || 'unspecified_event',
      idempotency_key: idempotencyKey,
      received_at: receivedTime,
      processed_at: receivedTime,
      status: 'processed',
      payload_summary: `Processed ${payload.event_type || 'telemetry'} event payload safely. Handled in dispatcher sandbox.`
    };

    this.webhookRecords.push(successRecord);
    this.addAuditLog(
      companyId,
      'WEBHOOK_GATEWAY',
      'webhook_received',
      `Webhook verified & ingested: ${provider} - ${successRecord.event_type}`,
      'info'
    );

    return successRecord;
  }

  // 9. Future Hardware Gateway Zapp Box/P1 Ingestion Simulator
  public ingestHardwarePacket(companyId: string, packet: {
    device_id: string;
    sequence_number: number;
    packet_checksum: string;
    raw_lightstream_data: string;
    mock_hmac?: string;
  }): HardwarePacketRecord {
    const receivedTime = new Date().toISOString();

    // Check Replay attack sequence check
    const lastPackets = this.hardwarePackets.filter(p => p.device_id === packet.device_id);
    const hasReplay = lastPackets.some(p => p.sequence_number === packet.sequence_number);

    let hmacStatus: 'valid_mock' | 'invalid' | 'future_required' = 'valid_mock';
    if (packet.mock_hmac === 'INVALID_KEY') {
      hmacStatus = 'invalid';
    }

    let isDecompressed = packet.raw_lightstream_data !== 'MALFORMED_COMPRESSION';

    // Build normalised telemetry output mapped to existing structures
    let outputTelemetry: TelemetryNormalizedData | undefined;
    if (!hasReplay && hmacStatus === 'valid_mock' && isDecompressed) {
      outputTelemetry = {
        vehicle_id: `V-ZAPP-${packet.device_id.substring(4)}`,
        latitude: -1.2921 + (packet.sequence_number * 0.0001),
        longitude: 36.8219 - (packet.sequence_number * 0.0001),
        speed_kmh: 42,
        heading_deg: 180,
        ignition_state: 'on',
        trip_status: 'moving',
        event_alerts: [],
        odometer_km: 12504.5 + packet.sequence_number,
        device_health: 'good',
        signal_status: 'excellent'
      };
    }

    const record: HardwarePacketRecord = {
      device_id: packet.device_id,
      company_id: companyId,
      sequence_number: packet.sequence_number,
      packet_checksum: packet.packet_checksum,
      hmac_signature_status: hmacStatus,
      replay_window_status: hasReplay ? 'replay_detected' : 'ok',
      decoded_lightstream_status: isDecompressed ? 'success' : 'decompression_failed',
      ingested_telemetry_event: outputTelemetry,
      received_at: receivedTime
    };

    this.hardwarePackets.push(record);

    if (outputTelemetry) {
      this.addAuditLog(
        companyId,
        'HARDWARE_GATEWAY',
        'packet_accepted',
        `Hardware Gateway decoded Lightstream frame from ${packet.device_id}. Sequence: ${packet.sequence_number}`,
        'info'
      );
    } else {
      this.addAuditLog(
        companyId,
        'HARDWARE_GATEWAY',
        'packet_rejected',
        `Hardware Gateway rejected packet from ${packet.device_id}. Faults: Replay:${hasReplay}, HMAC_Fault:${hmacStatus === 'invalid'}, Decrypt_Fault:${!isDecompressed}`,
        'error'
      );
    }

    return record;
  }

  // 10. Manual Communication Workflow Draft Builder (Safe, Non-autonomous, review first)
  public generateCommunicationDraft(
    companyId: string, 
    operatorId: string, 
    type: CommunicationDraft['type'], 
    recipient: string, 
    context: { vehicle_reg?: string; driver_name?: string; job_id?: string; delay_reason?: string; eta?: string }
  ): CommunicationDraft {
    let subject = '';
    let body = '';

    const dispatcherSignoff = `\n\n---\nDraft prepared by Zapp Brain dispatcher assistance. Please review and edit before copying to clipboard or sending externally.`;

    switch(type) {
      case 'email_dispatch':
        subject = `[ZappOS] Operational Dispatch Advisory: ${context.vehicle_reg || 'Fleet Unit'}`;
        body = `Dear Logistics Supervisor,\n\nWe would like to coordinate telemetry updates regarding vehicle ${context.vehicle_reg || 'N/A'}. Details follow:\n- Assigned Driver: ${context.driver_name || 'Unassigned'}\n- Current Trip Status: Monitored dispatcher track\n- Operations Reference: ${context.job_id || 'N/A'}\n\nPlease audit this assignment sequence.\n\nBest regards,\nOperations Dispatch Team${dispatcherSignoff}`;
        break;

      case 'whatsapp_driver':
        body = `*Zapp Dispatch Advisory*\nTo: ${context.driver_name || 'Driver'}\nVehicle: ${context.vehicle_reg || 'Unit'}\nPlease check in with dispatch regarding Job: ${context.job_id || 'N/A'}.\nEnsure GPS tracker module is secure and active. Safe travel!${dispatcherSignoff}`;
        break;

      case 'customer_eta':
        subject = `Zapp Delivery Status Update: Job ${context.job_id || 'Reference'}`;
        body = `Dear Customer,\n\nOur dispatcher is monitoring your shipment under Job ${context.job_id || 'N/A'}.\n- Expected ETA: ${context.eta || 'Calculating'}\n- Transit Advisory Notes: ${context.delay_reason || 'In progress'}\n\nWe value your partnership.\n\nZappOS Operations Portal${dispatcherSignoff}`;
        break;

      case 'driver_instruction':
        body = `INSTRUCTION FOR DRIVER ${context.driver_name || 'N/A'}:\nRoute adjustment recommended due to terminal dwell congestion. Proceed to secondary terminal point and log arrival. Confirm receipt of this direction with dispatcher.${dispatcherSignoff}`;
        break;

      case 'supervisor_escalation':
        subject = `ALERT: Operations Escalation - Unit ${context.vehicle_reg || 'N/A'}`;
        body = `LOGISTICS ESCALATION NOTICE\n\nSupervisor attention requested:\n- Vehicle: ${context.vehicle_reg || 'N/A'}\n- Assigned Driver: ${context.driver_name || 'N/A'}\n- System Alarm Code: High terminal dwell duration detected.\n\nManual log oversight is required to override automated routing paths.${dispatcherSignoff}`;
        break;
    }

    const draft: CommunicationDraft = {
      draft_id: `comm-draft-${Math.random().toString(36).substr(2, 9)}`,
      type,
      recipient,
      subject: subject || undefined,
      body_text: body,
      auditable_copied: false,
      created_at: new Date().toISOString()
    };

    this.communicationDrafts.push(draft);
    this.addAuditLog(companyId, operatorId, 'draft_copied', `Generated communication draft for recipient ${recipient}. Draft ID: ${draft.draft_id}`, 'info');

    return draft;
  }

  // Mark draft as copied
  public markDraftAsCopied(companyId: string, operatorId: string, draftId: string): boolean {
    const draft = this.communicationDrafts.find(d => d.draft_id === draftId);
    if (draft) {
      draft.auditable_copied = true;
      this.addAuditLog(companyId, operatorId, 'draft_copied', `Dispatcher copied communication template ${draftId} to clipboard. Safety record logged.`, 'info');
      return true;
    }
    return false;
  }

  // 11. External API Boundary contract implementation (tenant isolated, secure)
  public ingestTrackingEvent(companyId: string, apiKey: string, payload: any): { success: boolean; message: string; event_id?: string } {
    if (!apiKey || apiKey !== 'zapp_api_key_sandbox') {
      return { success: false, message: 'Invalid API Key authentication.' };
    }

    // Tenant isolation verification
    if (!companyId || companyId !== 'comp-zapp-demo') {
      return { success: false, message: 'Tenant company_id isolation violation.' };
    }

    if (!payload.vehicle_reg) {
      return { success: false, message: 'Payload missing required field: vehicle_reg' };
    }

    const eventId = `api-evt-${Math.random().toString(36).substr(2, 9)}`;
    this.addAuditLog(
      companyId,
      'EXTERNAL_API',
      'webhook_received',
      `API Event Boundary: Ingested tracking event for ${payload.vehicle_reg}. Telemetry logged in backup store.`,
      'info'
    );

    return { success: true, message: 'Telemetry event accepted at external staging gate.', event_id: eventId };
  }

  public ingestJobUpdate(companyId: string, apiKey: string, payload: any): { success: boolean; message: string } {
    if (apiKey !== 'zapp_api_key_sandbox') return { success: false, message: 'Unauthorized' };
    if (!payload.job_id || !payload.status) {
      return { success: false, message: 'Missing job_id or status parameter.' };
    }

    this.addAuditLog(
      companyId,
      'EXTERNAL_API',
      'webhook_received',
      `API Job Update: Received status for Job ${payload.job_id}. Sandbox isolation holds: live operations require supervisor approval.`,
      'info'
    );

    return { success: true, message: 'Job status staged in integration hub queues.' };
  }

  public ingestMaintenanceRecord(companyId: string, apiKey: string, payload: any): { success: boolean; message: string } {
    if (apiKey !== 'zapp_api_key_sandbox') return { success: false, message: 'Unauthorized' };
    this.addAuditLog(companyId, 'EXTERNAL_API', 'webhook_received', `API Maintenance Log Ingest: Staged records for ${payload.vehicle_reg || 'unspecified vehicle'}.`, 'info');
    return { success: true, message: 'Maintenance payload validated and stored.' };
  }

  public ingestComplianceDocument(companyId: string, apiKey: string, payload: any): { success: boolean; message: string } {
    if (apiKey !== 'zapp_api_key_sandbox') return { success: false, message: 'Unauthorized' };
    this.addAuditLog(companyId, 'EXTERNAL_API', 'webhook_received', `API Compliance Document: Registered link for document ${payload.doc_title || 'unspecified'}.`, 'info');
    return { success: true, message: 'Compliance payload registered.' };
  }

  public ingestDispatcherNote(companyId: string, apiKey: string, payload: any): { success: boolean; message: string } {
    if (apiKey !== 'zapp_api_key_sandbox') return { success: false, message: 'Unauthorized' };
    this.addAuditLog(companyId, 'EXTERNAL_API', 'webhook_received', `API Dispatch Note Ingested: '${payload.note_text || ''}'`, 'info');
    return { success: true, message: 'Note registered in logs.' };
  }

  public ingestCustomerSiteUpdate(companyId: string, apiKey: string, payload: any): { success: boolean; message: string } {
    if (apiKey !== 'zapp_api_key_sandbox') return { success: false, message: 'Unauthorized' };
    this.addAuditLog(companyId, 'EXTERNAL_API', 'webhook_received', `API Customer Site Update for ${payload.site_name || 'N/A'}.`, 'info');
    return { success: true, message: 'Site metadata recorded.' };
  }

  public exportPilotReport(companyId: string, reportType: string): { success: boolean; json_data: string } {
    const reportPayload = {
      company_id: companyId,
      exported_at: new Date().toISOString(),
      report_type: reportType,
      active_connectors_count: this.connectors.filter(c => c.status === 'connected').length,
      staged_files_count: this.fileStageRecords.length,
      integration_health: Array.from(this.healthMetrics.values()),
      system_note: 'This export represents staged sandbox integration status under supervisor authority.'
    };

    this.addAuditLog(companyId, 'SYSTEM', 'export_generated', `Generated integration hub export report: ${reportType}`, 'info');

    return { success: true, json_data: JSON.stringify(reportPayload, null, 2) };
  }

  public exportActionQueueSummary(companyId: string): string {
    const data = {
      company_id: companyId,
      timestamp: new Date().toISOString(),
      queue: [
        { id: 'AQ-101', type: 'quarantine_resolve', item: 'onedrive_raw_telemetry_weekly_01.csv - Row #12 missing license ID' },
        { id: 'AQ-102', type: 'webhook_retry', item: 'MiX Telematics sync rate limit timeout' }
      ]
    };
    return JSON.stringify(data, null, 2);
  }

  public getIntegrationStatus(companyId: string, connectorId: string): IntegrationHealthMetric | null {
    return this.healthMetrics.get(connectorId) || null;
  }

  public retryFailedIntegrationSync(companyId: string, operatorId: string, connectorId: string): { success: boolean; message: string } {
    return this.triggerSync(companyId, operatorId, connectorId);
  }

  // 12. Mapping Update Tool with Manual Override
  public updateMappingOverride(companyId: string, operatorId: string, mappingId: string, customTarget: string, confidence: number): boolean {
    const mapping = this.fieldMappings.find(m => m.mapping_id === mappingId);
    if (mapping) {
      const oldTarget = mapping.target_field;
      mapping.target_field = customTarget;
      mapping.manual_override = true;
      mapping.confidence_pct = confidence;
      mapping.validation_status = 'valid';

      this.addAuditLog(
        companyId,
        operatorId,
        'mapping_changed',
        `Field mapping override saved. Mapped source '${mapping.source_field}' from targets: '${oldTarget}' to '${customTarget}'`,
        'warning'
      );
      return true;
    }
    return false;
  }

  public getFieldMappings(): FieldMapping[] {
    return this.fieldMappings;
  }

  // 13. Audit Logging helpers
  public addAuditLog(companyId: string, operatorId: string, actionType: IntegrationAuditLog['action_type'], details: string, severity: IntegrationAuditLog['severity']) {
    const log: IntegrationAuditLog = {
      log_id: `log-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      company_id: companyId,
      operator_id: operatorId,
      action_type: actionType,
      details,
      severity
    };
    this.auditLogs.unshift(log); // newest first
  }

  public getAuditLogs(companyId: string): IntegrationAuditLog[] {
    return this.auditLogs.filter(l => l.company_id === companyId);
  }

  public getFileStageRecords(): FileStageRecord[] {
    return this.fileStageRecords;
  }

  public getWebhookRecords(): WebhookRecord[] {
    return this.webhookRecords;
  }

  public getHardwarePackets(): HardwarePacketRecord[] {
    return this.hardwarePackets;
  }

  public getCommunicationDrafts(): CommunicationDraft[] {
    return this.communicationDrafts;
  }

  public getHealthMetrics(): IntegrationHealthMetric[] {
    return Array.from(this.healthMetrics.values());
  }

  public clearAllSimulatedData() {
    this.fileStageRecords = [];
    this.webhookRecords = [];
    this.hardwarePackets = [];
    this.communicationDrafts = [];
    this.auditLogs = [];
    this.initializeDefaultData();
  }
}

export const integrationService = new IntegrationService();
