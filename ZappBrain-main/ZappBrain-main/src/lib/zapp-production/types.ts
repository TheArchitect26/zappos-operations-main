/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EnvironmentName = 'local_dev' | 'demo' | 'staging' | 'production';

export interface EnvironmentProfile {
  name: EnvironmentName;
  apiBaseUrl: string;
  supabaseProjectUrl: string;
  supabaseAnonKeyPlaceholder: string;
  loggingLevel: 'debug' | 'info' | 'warn' | 'error';
  mockConnectorMode: boolean;
  realConnectorModePlaceholder: string;
  telemetrySimulationMode: boolean;
  hardwareGatewaySimulationMode: boolean;
  commercialDemoMode: boolean;
  featureFlags: FeatureFlags;
}

export interface FeatureFlags {
  demoMode: boolean;
  liveTelemetrySimulation: boolean;
  hardwareGatewaySimulation: boolean;
  oneDriveMockConnector: boolean;
  trackingProviderMockConnectors: boolean;
  mlShadowMode: boolean;
  modelExperimentLab: boolean;
  commercialPilotMode: boolean;
  fieldDeploymentMode: boolean;
  productionIntegrations: boolean;
}

export type UserRole = 
  | 'owner' 
  | 'admin' 
  | 'supervisor' 
  | 'dispatcher' 
  | 'technician' 
  | 'sales_demo' 
  | 'auditor' 
  | 'viewer';

export type UserPermission =
  | 'view_fleet'
  | 'manage_jobs'
  | 'approve_actions'
  | 'manage_devices'
  | 'manage_fitments'
  | 'manage_integrations'
  | 'view_commercial_pilot'
  | 'export_reports'
  | 'manage_users'
  | 'view_audit_logs'
  | 'change_rule_configs'
  | 'approve_model_promotion'
  | 'manage_company_settings';

export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  isActive: boolean;
  createdAt: string;
}

export interface CompanyMembership {
  companyId: string;
  companyName: string;
  tier: 'pilot' | 'commercial' | 'enterprise';
  isActive: boolean;
}

export interface SecurityAuditEvent {
  eventId: string;
  timestamp: string;
  eventType: 
    | 'login_placeholder'
    | 'logout_placeholder'
    | 'failed_permission_check'
    | 'cross_company_access_attempt'
    | 'export_generated'
    | 'connector_auth_changed'
    | 'webhook_rejected'
    | 'device_packet_rejected'
    | 'user_role_changed'
    | 'rule_config_changed'
    | 'model_approval_attempted'
    | 'report_downloaded'
    | 'backup_performed_placeholder';
  actorId: string;
  actorRole: UserRole;
  companyId: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
  ipAddressPlaceholder: string;
}

export interface ObservabilityMetrics {
  appHealth: 'healthy' | 'degraded' | 'critical';
  lastSuccessfulJobRun: string;
  failedJobCount: number;
  failedIntegrationSyncs: number;
  webhookFailures: number;
  packetRejectionCount: number;
  averageApiLatencyMs: number;
  activeUsersCount: number;
  auditViolationCount: number;
  telemetryIngestionRatePerSec: number;
  databaseHealthStatus: 'connected' | 'reconnecting' | 'failed';
  storageUsageBytes: number;
  queueBacklogCount: number;
}

export interface BackupStatus {
  lastBackupTime: string;
  databaseBackupStatus: 'success' | 'warning' | 'failed';
  backupFrequency: 'hourly' | 'daily' | 'weekly';
  restoreTestStatus: 'passed' | 'failed' | 'not_tested';
  exportedReportsBackupCount: number;
  auditLogRetentionDays: number;
  telemetryDataRetentionDays: number;
  oneDriveStagedImportRetentionDays: number;
  deviceTelemetryRetentionDays: number;
}

export interface IncidentReport {
  errorCode: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedModule: string;
  timestamp: string;
  companyId: string;
  actorId: string;
  message: string;
  suggestedFix: string;
  auditReferenceId?: string;
}

export interface SupabaseChecklistItem {
  id: string;
  category: 'auth' | 'rls' | 'tables' | 'backups' | 'scaling';
  task: string;
  description: string;
  isCompleted: boolean;
  verificationCodeSnippet?: string;
}

export interface ReleaseChecklistItem {
  id: string;
  task: string;
  category: 'testing' | 'security' | 'config' | 'compliance' | 'rollback';
  isCompleted: boolean;
  notes: string;
}
