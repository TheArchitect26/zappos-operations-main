/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  EnvironmentName, EnvironmentProfile, UserRole, UserPermission,
  UserProfile, CompanyMembership, SecurityAuditEvent, ObservabilityMetrics,
  BackupStatus, IncidentReport, SupabaseChecklistItem, ReleaseChecklistItem, FeatureFlags
} from './types';

const ROLE_PERMISSIONS: Record<UserRole, UserPermission[]> = {
  owner: [
    'view_fleet', 'manage_jobs', 'approve_actions', 'manage_devices', 
    'manage_fitments', 'manage_integrations', 'view_commercial_pilot', 
    'export_reports', 'manage_users', 'view_audit_logs', 'change_rule_configs', 
    'approve_model_promotion', 'manage_company_settings'
  ],
  admin: [
    'view_fleet', 'manage_jobs', 'approve_actions', 'manage_devices', 
    'manage_fitments', 'manage_integrations', 'view_commercial_pilot', 
    'export_reports', 'manage_users', 'view_audit_logs', 'change_rule_configs', 
    'approve_model_promotion'
  ],
  supervisor: [
    'view_fleet', 'manage_jobs', 'approve_actions', 'manage_devices', 
    'manage_fitments', 'view_commercial_pilot', 'export_reports', 'view_audit_logs'
  ],
  dispatcher: [
    'view_fleet', 'manage_jobs', 'view_commercial_pilot'
  ],
  technician: [
    'view_fleet', 'manage_devices', 'manage_fitments'
  ],
  sales_demo: [
    'view_fleet', 'view_commercial_pilot'
  ],
  auditor: [
    'view_audit_logs', 'export_reports'
  ],
  viewer: [
    'view_fleet'
  ]
};

const ENVIRONMENT_PROFILES: Record<EnvironmentName, EnvironmentProfile> = {
  local_dev: {
    name: 'local_dev',
    apiBaseUrl: 'http://localhost:3000/api',
    supabaseProjectUrl: 'http://localhost:54321',
    supabaseAnonKeyPlaceholder: 'local-dev-anon-key-placeholder-30219',
    loggingLevel: 'debug',
    mockConnectorMode: true,
    realConnectorModePlaceholder: 'disabled',
    telemetrySimulationMode: true,
    hardwareGatewaySimulationMode: true,
    commercialDemoMode: true,
    featureFlags: {
      demoMode: true,
      liveTelemetrySimulation: true,
      hardwareGatewaySimulation: true,
      oneDriveMockConnector: true,
      trackingProviderMockConnectors: true,
      mlShadowMode: true,
      modelExperimentLab: true,
      commercialPilotMode: true,
      fieldDeploymentMode: true,
      productionIntegrations: false
    }
  },
  demo: {
    name: 'demo',
    apiBaseUrl: 'https://ais-dev-lpe2la33pp6al2n6gsbcx5-547853403521.europe-west2.run.app/api',
    supabaseProjectUrl: 'https://demo-supabase-placeholder.supabase.co',
    supabaseAnonKeyPlaceholder: 'sb-demo-anon-key-safebound-9941a',
    loggingLevel: 'info',
    mockConnectorMode: true,
    realConnectorModePlaceholder: 'sandbox_configured',
    telemetrySimulationMode: true,
    hardwareGatewaySimulationMode: true,
    commercialDemoMode: true,
    featureFlags: {
      demoMode: true,
      liveTelemetrySimulation: true,
      hardwareGatewaySimulation: true,
      oneDriveMockConnector: true,
      trackingProviderMockConnectors: true,
      mlShadowMode: true,
      modelExperimentLab: true,
      commercialPilotMode: true,
      fieldDeploymentMode: true,
      productionIntegrations: false
    }
  },
  staging: {
    name: 'staging',
    apiBaseUrl: 'https://staging-api.zappos.co/api',
    supabaseProjectUrl: 'https://staging-supabase-project.supabase.co',
    supabaseAnonKeyPlaceholder: 'sb-staging-anon-key-01928374abcdef',
    loggingLevel: 'info',
    mockConnectorMode: false,
    realConnectorModePlaceholder: 'staging_active',
    telemetrySimulationMode: true,
    hardwareGatewaySimulationMode: false,
    commercialDemoMode: false,
    featureFlags: {
      demoMode: false,
      liveTelemetrySimulation: true,
      hardwareGatewaySimulation: false,
      oneDriveMockConnector: false,
      trackingProviderMockConnectors: false,
      mlShadowMode: true,
      modelExperimentLab: true,
      commercialPilotMode: false,
      fieldDeploymentMode: true,
      productionIntegrations: true
    }
  },
  production: {
    name: 'production',
    apiBaseUrl: 'https://api.zappos.co/api',
    supabaseProjectUrl: 'https://live-production-supabase-db.supabase.co',
    supabaseAnonKeyPlaceholder: 'sb-prod-anon-key-secured-jwt-only',
    loggingLevel: 'error',
    mockConnectorMode: false,
    realConnectorModePlaceholder: 'production_direct_integration',
    telemetrySimulationMode: false,
    hardwareGatewaySimulationMode: false,
    commercialDemoMode: false,
    featureFlags: {
      demoMode: false,
      liveTelemetrySimulation: false,
      hardwareGatewaySimulation: false,
      oneDriveMockConnector: false,
      trackingProviderMockConnectors: false,
      mlShadowMode: false,
      modelExperimentLab: false,
      commercialPilotMode: false,
      fieldDeploymentMode: false,
      productionIntegrations: true
    }
  }
};

export class ProductionService {
  private currentEnv: EnvironmentName = 'demo';
  private securityLogs: SecurityAuditEvent[] = [];
  private mockUsers: UserProfile[] = [];
  private mockCompanies: CompanyMembership[] = [];
  private metrics: ObservabilityMetrics;
  private backupInfo: BackupStatus;
  private incidents: IncidentReport[] = [];
  private supabaseChecklist: SupabaseChecklistItem[] = [];
  private releaseChecklist: ReleaseChecklistItem[] = [];
  private adminOverrideEnabled = false;

  constructor() {
    this.initializeBaselineData();
    this.metrics = this.getInitialMetrics();
    this.backupInfo = this.getInitialBackupStatus();
  }

  private initializeBaselineData() {
    // Standard sandbox baseline
    this.mockCompanies = [
      { companyId: 'comp-zapp-demo', companyName: 'Zapp Logistics Ltd (Demo)', tier: 'commercial', isActive: true },
      { companyId: 'comp-alpha-freight', companyName: 'Alpha Cargo Express', tier: 'enterprise', isActive: true },
      { companyId: 'comp-omega-trans', companyName: 'Omega International Hauliers', tier: 'pilot', isActive: true }
    ];

    this.mockUsers = [
      { userId: 'user-01', email: 'msarhsig@gmail.com', name: 'Zapp Lead Admin', role: 'owner', companyId: 'comp-zapp-demo', isActive: true, createdAt: '2026-01-10T12:00:00Z' },
      { userId: 'user-02', email: 'supervisor@zapp.co', name: 'Kiprotich Sang', role: 'supervisor', companyId: 'comp-zapp-demo', isActive: true, createdAt: '2026-02-15T09:30:00Z' },
      { userId: 'user-03', email: 'dispatcher-nbi@zapp.co', name: 'Wanjiku Kamau', role: 'dispatcher', companyId: 'comp-zapp-demo', isActive: true, createdAt: '2026-03-01T14:20:00Z' },
      { userId: 'user-04', email: 'tech-field@zapp.co', name: 'Juma Mwangi', role: 'technician', companyId: 'comp-zapp-demo', isActive: true, createdAt: '2026-04-18T11:15:00Z' },
      { userId: 'user-05', email: 'auditor-external@compliancy.com', name: 'Sarah Patel', role: 'auditor', companyId: 'comp-zapp-demo', isActive: true, createdAt: '2026-05-02T16:45:00Z' },
      { userId: 'user-06', email: 'visitor-preview@gmail.com', name: 'Demo Spectator', role: 'viewer', companyId: 'comp-alpha-freight', isActive: true, createdAt: '2026-06-20T10:00:00Z' }
    ];

    this.supabaseChecklist = [
      {
        id: 'sb-01',
        category: 'auth',
        task: 'Enable MFA for Admin Access',
        description: 'Enforce multi-factor authentication policies for all members holding Admin or Owner roles to safeguard schema operations.',
        isCompleted: true,
        verificationCodeSnippet: 'SELECT auth.mfa_enabled_for_user(user_id);'
      },
      {
        id: 'sb-02',
        category: 'rls',
        task: 'Define Tenant Isolation RLS Policies',
        description: 'Verify row-level security is active on all core tables to automatically filter records matching current company_id claim in JWT.',
        isCompleted: true,
        verificationCodeSnippet: 'CREATE POLICY company_isolation ON trips\nFOR ALL TO authenticated\nUSING (company_id = (auth.jwt() ->> \'company_id\')::text);'
      },
      {
        id: 'sb-03',
        category: 'rls',
        task: 'Restrict Direct Schema Modifications',
        description: 'Disable standard user access to pg_catalog or raw db manipulation triggers without passing authorization middleware checks.',
        isCompleted: false,
        verificationCodeSnippet: 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;'
      },
      {
        id: 'sb-04',
        category: 'tables',
        task: 'Company Membership mapping triggers',
        description: 'Construct transactional hook to mirror new user invitations into both profile registries and user role lists.',
        isCompleted: true,
        verificationCodeSnippet: 'CREATE TRIGGER on_auth_user_created\nAFTER INSERT ON auth.users\nFOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();'
      },
      {
        id: 'sb-05',
        category: 'backups',
        task: 'Enable Physical Point-in-Time Recovery (PITR)',
        description: 'Enable PostgreSQL WAL archiving on Cloud SQL or Supabase Pro settings to facilitate transaction-level rollback precision.',
        isCompleted: false
      }
    ];

    this.releaseChecklist = [
      { id: 'rel-01', task: 'All diagnostic unit tests green', category: 'testing', isCompleted: true, notes: 'Phase 1-15 test suits successfully verified.' },
      { id: 'rel-02', task: 'Linter and compiler validation checks passed', category: 'testing', isCompleted: true, notes: 'Zero typescript compiler issues detected.' },
      { id: 'rel-03', task: 'No raw client-side API Keys stored in bundle', category: 'security', isCompleted: true, notes: 'Checked and verified. All secrets proxy server-side.' },
      { id: 'rel-04', task: 'Row-Level Security policies active on all staging tables', category: 'security', isCompleted: false, notes: 'Need confirmation on direct schema access limits.' },
      { id: 'rel-05', task: 'Verify safety isolation banner status', category: 'compliance', isCompleted: true, notes: 'Banners accurately adjust per active environment tier.' },
      { id: 'rel-06', task: 'Perform and audit a test-restore backup loop', category: 'rollback', isCompleted: false, notes: 'Restore testing outstanding on simulation server.' }
    ];

    // Seed basic security log history
    this.addSecurityLog(
      'user-01', 'owner', 'comp-zapp-demo',
      'login_placeholder',
      'User authenticated successfully via Sandbox login proxy. Session ID: sess-sb-2026-0941',
      'info'
    );
  }

  private getInitialMetrics(): ObservabilityMetrics {
    return {
      appHealth: 'healthy',
      lastSuccessfulJobRun: new Date().toISOString(),
      failedJobCount: 0,
      failedIntegrationSyncs: 0,
      webhookFailures: 0,
      packetRejectionCount: 0,
      averageApiLatencyMs: 14,
      activeUsersCount: 6,
      auditViolationCount: 0,
      telemetryIngestionRatePerSec: 1.2,
      databaseHealthStatus: 'connected',
      storageUsageBytes: 30421900,
      queueBacklogCount: 0
    };
  }

  private getInitialBackupStatus(): BackupStatus {
    return {
      lastBackupTime: new Date(Date.now() - 3600 * 4 * 1000).toISOString(), // 4 hours ago
      databaseBackupStatus: 'success',
      backupFrequency: 'daily',
      restoreTestStatus: 'passed',
      exportedReportsBackupCount: 14,
      auditLogRetentionDays: 365,
      telemetryDataRetentionDays: 90,
      oneDriveStagedImportRetentionDays: 30,
      deviceTelemetryRetentionDays: 180
    };
  }

  // --- Environment API ---
  public getActiveEnvironment(): EnvironmentProfile {
    return ENVIRONMENT_PROFILES[this.currentEnv];
  }

  public setEnvironment(env: EnvironmentName) {
    this.currentEnv = env;
    this.addSecurityLog(
      'SYSTEM_DAEMON', 'admin', 'comp-zapp-demo',
      'rule_config_changed',
      `Target environment changed to: ${env.toUpperCase()}. Adjusting safety banners and connector pipelines.`,
      'warning'
    );
  }

  public getAllEnvironments(): EnvironmentProfile[] {
    return Object.values(ENVIRONMENT_PROFILES);
  }

  // --- Role & Permission Model ---
  public hasPermission(role: UserRole, permission: UserPermission): boolean {
    const list = ROLE_PERMISSIONS[role];
    if (!list) return false;
    return list.includes(permission);
  }

  public getRolePermissions(role: UserRole): UserPermission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  // --- Tenant Isolation Guard ---
  public validateTenantAccess(
    actorId: string,
    actorRole: UserRole,
    actorCompanyId: string,
    recordCompanyId: string,
    operation: string
  ): boolean {
    if (actorCompanyId === recordCompanyId) {
      return true;
    }

    // Support / Admin override bypass check
    if (this.adminOverrideEnabled && (actorRole === 'owner' || actorRole === 'admin')) {
      this.addSecurityLog(
        actorId, actorRole, actorCompanyId,
        'cross_company_access_attempt',
        `BYPASS ALLOWED: Actor accessed scoped company record [${recordCompanyId}] via elevated support/admin bypass for: ${operation}`,
        'warning'
      );
      return true;
    }

    // Violation!
    this.metrics.auditViolationCount += 1;
    this.addSecurityLog(
      actorId, actorRole, actorCompanyId,
      'cross_company_access_attempt',
      `CRITICAL SECURITY VIOLATION: Access denied. Actor scoped to company [${actorCompanyId}] attempted unauthorized cross-company [${recordCompanyId}] read/write on operation: ${operation}`,
      'critical'
    );
    return false;
  }

  public toggleAdminOverride(enabled: boolean, actorId: string, role: UserRole) {
    this.adminOverrideEnabled = enabled;
    this.addSecurityLog(
      actorId, role, 'comp-zapp-demo',
      'rule_config_changed',
      `Support Admin tenant override changed to: ${enabled ? 'ENABLED' : 'DISABLED'}`,
      enabled ? 'critical' : 'info'
    );
  }

  public isAdminOverrideActive(): boolean {
    return this.adminOverrideEnabled;
  }

  // --- Security Audit Logging ---
  public addSecurityLog(
    actorId: string,
    actorRole: UserRole,
    companyId: string,
    eventType: SecurityAuditEvent['eventType'],
    details: string,
    severity: SecurityAuditEvent['severity'] = 'info'
  ): SecurityAuditEvent {
    const log: SecurityAuditEvent = {
      eventId: `sec-log-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      eventType,
      actorId,
      actorRole,
      companyId,
      details,
      severity,
      ipAddressPlaceholder: '192.168.10.45'
    };
    this.securityLogs.unshift(log);
    return log;
  }

  public getSecurityLogs(companyId?: string): SecurityAuditEvent[] {
    if (!companyId) return this.securityLogs;
    return this.securityLogs.filter(l => l.companyId === companyId);
  }

  // --- Mock Incident / Custom Error Handler ---
  public raiseIncident(error: Omit<IncidentReport, 'timestamp'>): IncidentReport {
    const incident: IncidentReport = {
      ...error,
      timestamp: new Date().toISOString()
    };
    this.incidents.unshift(incident);

    // Track dynamic metric increments
    if (error.errorCode === 'ERR_INTEG_SYNC') {
      this.metrics.failedIntegrationSyncs += 1;
    } else if (error.errorCode === 'ERR_WEBHOOK_REPLAY' || error.errorCode === 'ERR_WEBHOOK_HASH') {
      this.metrics.webhookFailures += 1;
      this.addSecurityLog(error.actorId, 'dispatcher', error.companyId, 'webhook_rejected', error.message, 'warning');
    } else if (error.errorCode === 'ERR_PACKET_CHECKSUM' || error.errorCode === 'ERR_PACKET_HMAC') {
      this.metrics.packetRejectionCount += 1;
      this.addSecurityLog(error.actorId, 'dispatcher', error.companyId, 'device_packet_rejected', error.message, 'critical');
    }

    return incident;
  }

  public getIncidents(companyId?: string): IncidentReport[] {
    if (!companyId) return this.incidents;
    return this.incidents.filter(i => i.companyId === companyId);
  }

  // --- Observability Metrics API ---
  public getObservabilityMetrics(): ObservabilityMetrics {
    return this.metrics;
  }

  public triggerDiagnosticTick() {
    // Simulates a scheduler cycle tick
    this.metrics.lastSuccessfulJobRun = new Date().toISOString();
    this.metrics.telemetryIngestionRatePerSec = parseFloat((1.0 + Math.random() * 2).toFixed(2));
    this.metrics.averageApiLatencyMs = Math.round(10 + Math.random() * 8);
    this.metrics.queueBacklogCount = Math.floor(Math.random() * 3);
  }

  // --- User Management API ---
  public getUsers(companyId?: string): UserProfile[] {
    if (!companyId) return this.mockUsers;
    return this.mockUsers.filter(u => u.companyId === companyId);
  }

  public updateUserRole(actorId: string, actorRole: UserRole, targetUserId: string, newRole: UserRole) {
    if (!this.hasPermission(actorRole, 'manage_users')) {
      this.raiseIncident({
        errorCode: 'ERR_PERMISSION_DENIED',
        severity: 'high',
        affectedModule: 'User Management',
        companyId: 'comp-zapp-demo',
        actorId,
        message: 'Permission check failed. Actor attempted to modify user roles without user_manage clearance.',
        suggestedFix: 'Assign owner or admin role to actor before executing administrative user promotions.'
      });
      this.addSecurityLog(
        actorId, actorRole, 'comp-zapp-demo',
        'failed_permission_check',
        `Access blocked: User modifier attempted to promote user ${targetUserId} to role ${newRole.toUpperCase()} lacking credentials.`,
        'critical'
      );
      throw new Error('Access Denied: Lacking permission "manage_users"');
    }

    const u = this.mockUsers.find(user => user.userId === targetUserId);
    if (u) {
      const oldRole = u.role;
      u.role = newRole;
      this.addSecurityLog(
        actorId, actorRole, u.companyId,
        'user_role_changed',
        `Role assignment modified: Promoted user ${u.name} from ${oldRole.toUpperCase()} to ${newRole.toUpperCase()}`,
        'warning'
      );
    }
  }

  public inviteUserSimulated(actorId: string, actorRole: UserRole, companyId: string, name: string, email: string, role: UserRole) {
    if (!this.hasPermission(actorRole, 'manage_users')) {
      throw new Error('Access Denied: Lacking permission "manage_users"');
    }

    const newUser: UserProfile = {
      userId: `user-${Math.random().toString(36).substr(2, 5)}`,
      email,
      name,
      role,
      companyId,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    this.mockUsers.push(newUser);
    this.addSecurityLog(
      actorId, actorRole, companyId,
      'user_role_changed',
      `Invited new member into company workspace: ${name} (${role.toUpperCase()})`,
      'info'
    );
  }

  public toggleUserActive(actorId: string, actorRole: UserRole, targetUserId: string) {
    if (!this.hasPermission(actorRole, 'manage_users')) {
      throw new Error('Access Denied: Lacking permission "manage_users"');
    }

    const u = this.mockUsers.find(user => user.userId === targetUserId);
    if (u) {
      u.isActive = !u.isActive;
      this.addSecurityLog(
        actorId, actorRole, u.companyId,
        'user_role_changed',
        `User active status toggled. User: ${u.name}, New Status: ${u.isActive ? 'ACTIVE' : 'DEACTIVATED'}`,
        'warning'
      );
    }
  }

  // --- Supabase checklists ---
  public getSupabaseChecklist(): SupabaseChecklistItem[] {
    return this.supabaseChecklist;
  }

  public toggleSupabaseTask(id: string) {
    const item = this.supabaseChecklist.find(t => t.id === id);
    if (item) {
      item.isCompleted = !item.isCompleted;
    }
  }

  // --- Release checklists ---
  public getReleaseChecklist(): ReleaseChecklistItem[] {
    return this.releaseChecklist;
  }

  public toggleReleaseTask(id: string) {
    const item = this.releaseChecklist.find(t => t.id === id);
    if (item) {
      item.isCompleted = !item.isCompleted;
    }
  }

  // --- Backup and recovery planner ---
  public getBackupStatus(): BackupStatus {
    return this.backupInfo;
  }

  public triggerMockBackup(actorId: string, role: UserRole, companyId: string) {
    this.backupInfo.lastBackupTime = new Date().toISOString();
    this.backupInfo.databaseBackupStatus = 'success';
    this.addSecurityLog(
      actorId, role, companyId,
      'backup_performed_placeholder',
      'Database WAL snapshot backup performed successfully. Uploaded to secure GCS bucket replication target.',
      'info'
    );
  }

  public updateBackupRetention(key: keyof BackupStatus, value: number) {
    if (typeof this.backupInfo[key] === 'number') {
      (this.backupInfo as any)[key] = value;
    }
  }
}

export const productionService = new ProductionService();
