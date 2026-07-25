/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappBrainInput, AffectedEntity } from '../types';

export type QueryIntent =
  | 'unreliable_vehicles'
  | 'improving_drivers'
  | 'costly_customer_delays'
  | 'fleet_health_drop'
  | 'depot_delays'
  | 'risky_routes'
  | 'upcoming_maintenance'
  | 'worst_telemetry_jobs'
  | 'repeated_customer_delays'
  | 'maintenance_trends_increasing'
  | 'general_status'
  | 'unknown';

export interface QueryPlan {
  intent: QueryIntent;
  targetEntities: string[];
  metricsNeeded: string[];
  steps: string[];
}

export interface QueryResponse {
  answer: string;
  confidence: number; // 0 to 100
  evidence: string[];
  recommendations: string[];
  relatedEntities: AffectedEntity[];
  analysisDetails?: any;
}

export interface AskZappBrainOptions {
  input: ZappBrainInput;
  companyId?: string;
  question: string;
}
