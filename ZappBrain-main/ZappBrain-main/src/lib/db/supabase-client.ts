/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TenantAccessViolationError, PermissionDeniedError, PostgrestError } from './errors';
import { productionService } from '../zapp-production/production-service';
import { UserRole, UserPermission } from '../zapp-production/types';

// Active session structure
export interface AuthenticatedSession {
  userId: string;
  email: string;
  name: string;
  activeCompanyId: string;
  role: UserRole;
  memberships: { companyId: string; companyName: string; status: string }[];
}

// Global in-memory relational store
export class InMemoryPostgresDatabase {
  public tables: Record<string, any[]> = {
    companies: [],
    user_profiles: [],
    company_memberships: [],
    role_assignments: [],
    audit_logs: [],
    vehicles: [],
    drivers: [],
    customers: [],
    depots: [],
    terminals: [],
    routes: [],
    jobs: [],
    job_events: [],
    dispatcher_notes: [],
    devices: [],
    sims: [],
    device_assignments: [],
    telemetry_events: [],
    telemetry_batches: [],
    telemetry_quality_reports: [],
    device_health_reports: [],
    zapp_brain_runs: [],
    zapp_brain_insights: [],
    zapp_brain_feedback: [],
    zapp_brain_learning_records: [],
    zapp_brain_rule_config: [],
    zapp_brain_rule_performance: [],
    zapp_brain_calibration_suggestions: [],
    operational_cases: [],
    manual_action_queue: [],
    maintenance_tickets: [],
    compliance_tasks: [],
    support_diagnostics: [],
    fitment_jobs: [],
    fitment_checklists: [],
    fitment_test_results: [],
    pilot_fleets: [],
    pilot_jobs: [],
    pilot_incidents: [],
    pilot_reports: [],
    commercial_onboarding_profiles: [],
    commercial_roi_assumptions: [],
    commercial_proposals: [],
    integration_connectors: [],
    integration_sync_runs: [],
    integration_mappings: [],
    webhook_events: [],
    import_file_registry: [],
    import_reports: []
  };

  private static instance: InMemoryPostgresDatabase | null = null;

  public static getInstance(): InMemoryPostgresDatabase {
    if (!InMemoryPostgresDatabase.instance) {
      InMemoryPostgresDatabase.instance = new InMemoryPostgresDatabase();
    }
    return InMemoryPostgresDatabase.instance;
  }

  private constructor() {}

  public clearAll() {
    Object.keys(this.tables).forEach(k => {
      this.tables[k] = [];
    });
  }
}

export const dbInstance = InMemoryPostgresDatabase.getInstance();

// Detect environment configuration from Vite env variables
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export const isRealSupabaseConfigured = 
  supabaseUrl && 
  !supabaseUrl.includes('placeholder') && 
  !supabaseUrl.includes('your-supabase') &&
  supabaseAnonKey && 
  !supabaseAnonKey.includes('placeholder') &&
  !supabaseAnonKey.includes('anon-key');

// Initialize the real Supabase SDK client if keys are provided
export const realSupabase: SupabaseClient | null = isRealSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Simulated Client Session Management
class SupabaseAuthModule {
  private currentSession: AuthenticatedSession | null = null;
  private breakGlassReason: string | null = null;
  private breakGlassActive = false;
  private useRealAuth = false;

  constructor() {
    this.resetToDefaultUser();
    this.detectEnvironment();
    this.listenToRealAuth();
  }

  private detectEnvironment() {
    if (isRealSupabaseConfigured) {
      this.useRealAuth = true;
      // Determine staging vs production based on URL or variables
      const isStaging = supabaseUrl.includes('staging') || (import.meta as any).env.VITE_ENV === 'staging';
      const isProd = supabaseUrl.includes('prod') || (import.meta as any).env.VITE_ENV === 'production';
      
      const targetEnv = isProd ? 'production' : 'staging';
      productionService.setEnvironment(targetEnv);
      
      productionService.addSecurityLog(
        'SYSTEM_DAEMON', 'admin', 'co_nairobi_freight',
        'rule_config_changed',
        `REAL SUPABASE CLIENT DETECTED. Environment profile set to: "${targetEnv.toUpperCase()}". Connecting to: ${supabaseUrl}`,
        'warning'
      );
    } else {
      this.useRealAuth = false;
      productionService.setEnvironment('demo');
      productionService.addSecurityLog(
        'SYSTEM_DAEMON', 'admin', 'co_nairobi_freight',
        'rule_config_changed',
        'REAL SUPABASE CONFIGURATION MISSING OR USING PLACEHOLDERS. App running in offline-first DEMO MODE.',
        'info'
      );
    }
  }

  private listenToRealAuth() {
    if (!realSupabase) return;

    realSupabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[SUPABASE AUTH] Event triggered: ${event}`);
      if (session?.user) {
        await this.syncWithRealSupabaseUser(session.user);
      } else {
        this.resetToDefaultUser();
      }
    });
  }

  public async syncWithRealSupabaseUser(user: any) {
    if (!realSupabase) return;

    try {
      // 1. Fetch or auto-create User Profile in real Supabase
      let { data: profile, error: profileErr } = await realSupabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileErr || !profile) {
        // Auto-provision user profile for seamless onboarding
        const newProfile = {
          user_id: user.id,
          email: user.email || 'user@example.com',
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Staging Operator',
          is_active: true
        };
        await realSupabase.from('user_profiles').insert(newProfile);
        profile = newProfile;
      }

      // 2. Fetch company memberships and roles
      const { data: memberships } = await realSupabase
        .from('company_memberships')
        .select('company_id, status')
        .eq('user_id', user.id);

      const { data: roles } = await realSupabase
        .from('role_assignments')
        .select('company_id, role')
        .eq('user_id', user.id)
        .is('revoked_at', null);

      // 3. Fallback provisioning of a default company if none exists
      let userMemberships = memberships || [];
      let userRoles = roles || [];

      if (userMemberships.length === 0) {
        // Create default Nairobi Freight membership on-the-fly for staging testing
        const defaultCo = { company_id: 'co_nairobi_freight', name: 'Nairobi Freight Logistics', tier: 'enterprise' };
        await realSupabase.from('companies').upsert(defaultCo);

        const defaultMember = { company_id: 'co_nairobi_freight', user_id: user.id, status: 'active' };
        await realSupabase.from('company_memberships').insert(defaultMember);

        const defaultRole = {
          company_id: 'co_nairobi_freight',
          user_id: user.id,
          role: 'owner',
          assigned_by: 'system_auto'
        };
        await realSupabase.from('role_assignments').insert(defaultRole);

        userMemberships = [defaultMember];
        userRoles = [defaultRole];
      }

      // Fetch company details to enrich name field
      const { data: companies } = await realSupabase
        .from('companies')
        .select('company_id, name');

      const enrichedMemberships = userMemberships.map(m => {
        const coName = companies?.find(c => c.company_id === m.company_id)?.name || 'Staging Company';
        return {
          companyId: m.company_id,
          companyName: coName,
          status: m.status
        };
      });

      const activeCoId = enrichedMemberships[0]?.companyId || 'co_nairobi_freight';
      const activeRole = (userRoles.find(r => r.company_id === activeCoId)?.role as UserRole) || 'owner';

      this.currentSession = {
        userId: user.id,
        email: user.email || '',
        name: profile.name || 'Staging Operator',
        activeCompanyId: activeCoId,
        role: activeRole,
        memberships: enrichedMemberships
      };

      productionService.addSecurityLog(
        user.id, activeRole, activeCoId,
        'login_placeholder',
        `Successfully logged in and synchronized session via Supabase Auth: ${user.email}`,
        'info'
      );
    } catch (err) {
      console.error('[SUPABASE AUTH SYNC ERROR]', err);
    }
  }

  public resetToDefaultUser() {
    this.currentSession = {
      userId: 'user-01',
      email: 'msarhsig@gmail.com',
      name: 'Zapp Lead Admin',
      activeCompanyId: 'co_nairobi_freight',
      role: 'owner',
      memberships: [
        { companyId: 'co_nairobi_freight', companyName: 'Nairobi Freight Logistics (Demo)', status: 'active' },
        { companyId: 'co_zapp_sa', companyName: 'SA Logistics Hub (Demo)', status: 'active' },
        { companyId: 'co_zapp_intl', companyName: 'Zapp International Shipping (Demo)', status: 'active' },
        { companyId: 'co_zapp_east', companyName: 'East Coast Freight (Demo)', status: 'active' }
      ]
    };
    this.breakGlassActive = false;
    this.breakGlassReason = null;
  }

  public getCurrentSession(): AuthenticatedSession | null {
    return this.currentSession;
  }

  public setSession(session: AuthenticatedSession | null) {
    this.currentSession = session;
  }

  public switchActiveCompany(companyId: string) {
    if (!this.currentSession) throw new Error('No active authentication session found.');
    
    // Validate membership
    const membership = this.currentSession.memberships.find(m => m.companyId === companyId);
    if (!membership && !this.breakGlassActive) {
      productionService.addSecurityLog(
        this.currentSession.userId,
        this.currentSession.role,
        this.currentSession.activeCompanyId,
        'cross_company_access_attempt',
        `Unauthorized company switch attempt to: ${companyId}. Blocking access.`,
        'critical'
      );
      throw new Error(`Unauthorized: User "${this.currentSession.userId}" is not a member of company [${companyId}]`);
    }

    this.currentSession.activeCompanyId = companyId;
    
    // Synchronize simulator role from role assignments
    const db = InMemoryPostgresDatabase.getInstance();
    const assignment = db.tables.role_assignments.find(
      r => r.user_id === this.currentSession?.userId && r.company_id === companyId && !r.revoked_at
    );
    if (assignment) {
      this.currentSession.role = assignment.role;
    }

    productionService.addSecurityLog(
      this.currentSession.userId,
      this.currentSession.role,
      companyId,
      'login_placeholder',
      `Switched company context successfully to: ${membership?.companyName || companyId}`,
      'info'
    );
  }

  public activateBreakGlass(reason: string) {
    if (!this.currentSession) throw new Error('Auth required for break-glass activation.');
    if (this.currentSession.role !== 'owner' && this.currentSession.role !== 'admin') {
      throw new Error('Break-Glass error: Only owner or admin roles may initiate cross-tenant administrative override.');
    }
    if (!reason || reason.trim().length < 5) {
      throw new Error('Break-Glass error: Explicit justification (minimum 5 characters) is required to authorize bypass.');
    }

    this.breakGlassActive = true;
    this.breakGlassReason = reason;

    // Turn on the production readiness admin override state
    productionService.toggleAdminOverride(true, this.currentSession.userId, this.currentSession.role);
    
    productionService.addSecurityLog(
      this.currentSession.userId,
      this.currentSession.role,
      this.currentSession.activeCompanyId,
      'rule_config_changed',
      `BREAK-GLASS ADVANCED OVERRIDE GRANTED. Purpose: "${reason}"`,
      'critical'
    );
  }

  public deactivateBreakGlass() {
    this.breakGlassActive = false;
    this.breakGlassReason = null;
    if (this.currentSession) {
      productionService.toggleAdminOverride(false, this.currentSession.userId, this.currentSession.role);
    }
  }

  public isBreakGlassActive(): boolean {
    return this.breakGlassActive;
  }

  public getBreakGlassReason(): string | null {
    return this.breakGlassReason;
  }
}

export const supabaseAuth = new SupabaseAuthModule();

// Table permissions metadata defining which roles have write clearance
const TABLE_WRITE_PERMISSIONS: Record<string, UserPermission> = {
  vehicles: 'manage_jobs',
  drivers: 'manage_jobs',
  jobs: 'manage_jobs',
  job_events: 'manage_jobs',
  dispatcher_notes: 'manage_jobs',
  devices: 'manage_devices',
  sims: 'manage_devices',
  device_assignments: 'manage_devices',
  zapp_brain_feedback: 'approve_actions',
  zapp_brain_rule_config: 'change_rule_configs',
  manual_action_queue: 'approve_actions',
  maintenance_tickets: 'manage_fitments',
  compliance_tasks: 'manage_company_settings',
  fitment_jobs: 'manage_fitments',
  fitment_checklists: 'manage_fitments',
  commercial_proposals: 'approve_model_promotion',
  role_assignments: 'manage_users',
  company_memberships: 'manage_users'
};

// Chained Postgrest-compatible dual-mode query builder
export class PostgrestQueryBuilder<T = any> {
  private table: string;
  private filters: Array<(row: any) => boolean> = [];
  private filtersData: Array<{ type: 'eq'; column: string; value: any }> = [];
  private orderCol: string | null = null;
  private orderAsc = true;
  private operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' = 'SELECT';
  private payload: any = null;

  constructor(table: string) {
    // Only throw in mock mode if table does not exist
    if (!isRealSupabaseConfigured && !dbInstance.tables[table]) {
      throw new Error(`PostgreSQL Table error: relation "${table}" does not exist.`);
    }
    this.table = table;
  }

  public eq(column: string, value: any): this {
    this.filters.push(row => row[column] === value);
    this.filtersData.push({ type: 'eq', column, value });
    return this;
  }

  public order(column: string, { ascending = true } = {}): this {
    this.orderCol = column;
    this.orderAsc = ascending;
    return this;
  }

  private enforceRLS(operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE', inputRows?: any[]) {
    const session = supabaseAuth.getCurrentSession();

    if (!session) {
      throw new PostgrestError('Authentication required to execute query.', 'PGRST_AUTH_REQUIRED');
    }

    const actorRole = session.role;
    const actorCompanyId = session.activeCompanyId;

    // Mutate commands (INSERT, UPDATE, DELETE) must fail client-side as defense-in-depth
    if (['INSERT', 'UPDATE', 'DELETE'].includes(operation)) {
      if (actorRole === 'viewer') {
        throw new PermissionDeniedError(actorRole, 'mutate_records');
      }
      if (actorRole === 'auditor') {
        throw new PermissionDeniedError(actorRole, 'mutate_records');
      }

      // Check forged company_id attempt
      if (inputRows) {
        for (const row of inputRows) {
          if (row.company_id && row.company_id !== actorCompanyId && !supabaseAuth.isBreakGlassActive()) {
            productionService.addSecurityLog(
              session.userId, actorRole, actorCompanyId,
              'cross_company_access_attempt',
              `FORGED TENTANT WRITE BLOCKED: Tried inserting row into [${this.table}] with company_id: ${row.company_id}`,
              'critical'
            );
            throw new TenantAccessViolationError(session.userId, row.company_id, `${operation} on ${this.table}`);
          }
        }
      }

      const requiredPermission = TABLE_WRITE_PERMISSIONS[this.table];
      if (requiredPermission && !supabaseAuth.isBreakGlassActive()) {
        const hasPerm = productionService.hasPermission(actorRole, requiredPermission);
        if (!hasPerm) {
          productionService.addSecurityLog(
            session.userId, actorRole, actorCompanyId,
            'failed_permission_check',
            `Access Denied: Role [${actorRole.toUpperCase()}] lacks clearance "${requiredPermission}" to write to table "${this.table}"`,
            'critical'
          );
          throw new PermissionDeniedError(actorRole, requiredPermission);
        }
      }
    }
  }

  public select(columns = '*'): this {
    this.operation = 'SELECT';
    return this;
  }

  public insert(data: any | any[]): this {
    this.operation = 'INSERT';
    this.payload = data;
    return this;
  }

  public update(data: any): this {
    this.operation = 'UPDATE';
    this.payload = data;
    return this;
  }

  public delete(): this {
    this.operation = 'DELETE';
    return this;
  }

  private async executeRealSupabase(): Promise<{ data: T[] | null; error: any }> {
    if (!realSupabase) throw new Error('Real Supabase client is not initialized.');

    try {
      let query: any;

      if (this.operation === 'SELECT') {
        query = realSupabase.from(this.table).select('*');
      } else if (this.operation === 'INSERT') {
        query = realSupabase.from(this.table).insert(this.payload).select();
      } else if (this.operation === 'UPDATE') {
        query = realSupabase.from(this.table).update(this.payload).select();
      } else if (this.operation === 'DELETE') {
        query = realSupabase.from(this.table).delete().select();
      }

      // Apply equality filters
      for (const filter of this.filtersData) {
        if (filter.type === 'eq') {
          query = query.eq(filter.column, filter.value);
        }
      }

      // Apply ordering
      if (this.orderCol) {
        query = query.order(this.orderCol, { ascending: this.orderAsc });
      }

      const { data, error } = await query;
      if (error) {
        throw new Error(`[Supabase Error ${error.code}]: ${error.message}`);
      }

      return { data: data as T[], error: null };
    } catch (e: any) {
      console.error(`[REAL SUPABASE DUAL-MODE FAILURE ON ${this.table}]`, e);
      // Fail loudly if real mode is active, as we don't want secret data sync bugs
      return { data: null, error: e };
    }
  }

  private async executeMock(): Promise<{ data: T[] | null; error: any }> {
    try {
      const session = supabaseAuth.getCurrentSession();
      const actorCompanyId = session?.activeCompanyId || 'co_nairobi_freight';

      if (this.operation === 'INSERT') {
        const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
        this.enforceRLS('INSERT', rows);

        const tableData = dbInstance.tables[this.table] || [];
        const insertedRows = rows.map(r => ({
          ...r,
          created_at: r.created_at || new Date().toISOString(),
          updated_at: r.updated_at || new Date().toISOString()
        }));

        tableData.push(...insertedRows);
        return { data: insertedRows, error: null };
      }

      if (this.operation === 'UPDATE') {
        const tableData = dbInstance.tables[this.table] || [];
        let matchedIndices: number[] = [];
        
        tableData.forEach((row, idx) => {
          let match = true;
          for (const filter of this.filters) {
            if (!filter(row)) {
              match = false;
              break;
            }
          }
          if (match) matchedIndices.push(idx);
        });

        const rowsToUpdate = matchedIndices.map(idx => tableData[idx]);
        this.enforceRLS('UPDATE', rowsToUpdate);

        const updatedRows = matchedIndices.map(idx => {
          tableData[idx] = {
            ...tableData[idx],
            ...this.payload,
            updated_at: new Date().toISOString()
          };
          return tableData[idx];
        });

        return { data: updatedRows, error: null };
      }

      if (this.operation === 'DELETE') {
        const tableData = dbInstance.tables[this.table] || [];
        let remainingRows: any[] = [];
        let deletedRows: any[] = [];

        tableData.forEach(row => {
          let match = true;
          for (const filter of this.filters) {
            if (!filter(row)) {
              match = false;
              break;
            }
          }
          if (match) {
            deletedRows.push(row);
          } else {
            remainingRows.push(row);
          }
        });

        this.enforceRLS('DELETE', deletedRows);

        dbInstance.tables[this.table] = remainingRows;
        return { data: deletedRows, error: null };
      }

      // SELECT OPERATION
      this.enforceRLS('SELECT');
      let result = [...(dbInstance.tables[this.table] || [])];
      
      // Apply filters
      for (const filter of this.filters) {
        result = result.filter(filter);
      }

      // Sort
      if (this.orderCol) {
        result.sort((a, b) => {
          const valA = a[this.orderCol!];
          const valB = b[this.orderCol!];
          if (valA < valB) return this.orderAsc ? -1 : 1;
          if (valA > valB) return this.orderAsc ? 1 : -1;
          return 0;
        });
      }

      return { data: result, error: null };
    } catch (e: any) {
      return { data: [], error: e };
    }
  }

  public async execute(): Promise<{ data: T[] | null; error: any }> {
    const isStagingOrProduction = 
      productionService.getActiveEnvironment().name === 'staging' || 
      productionService.getActiveEnvironment().name === 'production';

    if (isRealSupabaseConfigured && isStagingOrProduction) {
      return this.executeRealSupabase();
    } else {
      return this.executeMock();
    }
  }

  // Promise-compatible then block so clients can await builder directly
  public then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any): Promise<any> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// Global entrypoint mimicking Supabase SDK
export const supabase = {
  from<T = any>(table: string) {
    return new PostgrestQueryBuilder<T>(table);
  },
  auth: {
    async getUser() {
      if (realSupabase && isRealSupabaseConfigured) {
        return realSupabase.auth.getUser();
      }
      
      const s = supabaseAuth.getCurrentSession();
      if (!s) return { data: { user: null }, error: new Error('Unauthenticated') };
      return {
        data: {
          user: {
            id: s.userId,
            email: s.email,
            user_metadata: { name: s.name },
            aud: 'authenticated',
            role: 'authenticated'
          }
        },
        error: null
      };
    },
    async getSession() {
      if (realSupabase && isRealSupabaseConfigured) {
        return realSupabase.auth.getSession();
      }
      
      const s = supabaseAuth.getCurrentSession();
      if (!s) return { data: { session: null }, error: null };
      return {
        data: {
          session: {
            user: { id: s.userId, email: s.email },
            expires_at: 9999999999
          }
        },
        error: null
      };
    },
    async signInWithPassword(credentials: any) {
      if (realSupabase && isRealSupabaseConfigured) {
        return realSupabase.auth.signInWithPassword(credentials);
      }
      
      // Simulated successful sign in
      const session = supabaseAuth.getCurrentSession() || {
        userId: 'user-01',
        email: credentials.email || 'msarhsig@gmail.com',
        name: 'Zapp Lead Admin',
        activeCompanyId: 'co_nairobi_freight',
        role: 'owner',
        memberships: [{ companyId: 'co_nairobi_freight', companyName: 'Nairobi Freight Logistics (Demo)', status: 'active' }]
      };
      return { data: { user: { id: session.userId, email: session.email }, session: { access_token: 'mock-token' } }, error: null };
    },
    async signUp(credentials: any) {
      if (realSupabase && isRealSupabaseConfigured) {
        return realSupabase.auth.signUp(credentials);
      }
      return { data: { user: { id: 'new-user-id', email: credentials.email } }, error: null };
    },
    async signOut() {
      if (realSupabase && isRealSupabaseConfigured) {
        await realSupabase.auth.signOut();
      }
      supabaseAuth.resetToDefaultUser();
      return { error: null };
    }
  }
};
