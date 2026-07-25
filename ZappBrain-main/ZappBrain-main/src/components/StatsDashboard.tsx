/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataQualitySummary, ZappBrainInsight } from '../lib/zapp-brain/types';
import { AlertTriangle, CheckCircle, Database, HelpCircle, ShieldAlert } from 'lucide-react';

interface StatsDashboardProps {
  dataQuality: DataQualitySummary;
  insights: ZappBrainInsight[];
  entityCounts: {
    drivers: number;
    vehicles: number;
    customers: number;
    jobs: number;
    documents: number;
  };
}

export default function StatsDashboard({ dataQuality, insights, entityCounts }: StatsDashboardProps) {
  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const criticalCount = insights.filter(i => i.severity === 'critical').length;
  const highCount = insights.filter(i => i.severity === 'high').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* 1. Core Ingestion Statistics */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-100">
            <Database size={20} id="stat-db-icon" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Ingested State Entities</h3>
            <p className="text-xs text-gray-400">Linked ZappOS production tables</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-xs text-gray-500 block">Assigned Jobs</span>
            <span className="text-lg font-semibold text-slate-800 font-display">{entityCounts.jobs}</span>
          </div>
          <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-xs text-gray-500 block">Active Drivers</span>
            <span className="text-lg font-semibold text-slate-800 font-display">{entityCounts.drivers}</span>
          </div>
          <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-xs text-gray-500 block">Fleet Vehicles</span>
            <span className="text-lg font-semibold text-slate-800 font-display">{entityCounts.vehicles}</span>
          </div>
          <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-xs text-gray-500 block">Customers</span>
            <span className="text-lg font-semibold text-slate-800 font-display">{entityCounts.customers}</span>
          </div>
        </div>
      </div>

      {/* 2. Zapp Brain Engine State */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
            <ShieldAlert size={20} id="stat-alert-icon" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Engine Output Overview</h3>
            <p className="text-xs text-gray-400">Prioritized operational warnings</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center p-2.5 bg-rose-50/30 rounded-lg border border-rose-100/50">
            <span className="text-xs text-rose-700 font-medium">Critical Action Items</span>
            <span className="text-base font-bold text-rose-700 font-display">{criticalCount}</span>
          </div>
          <div className="flex justify-between items-center p-2.5 bg-amber-50/30 rounded-lg border border-amber-100/50">
            <span className="text-xs text-amber-700 font-medium">High Severity Issues</span>
            <span className="text-base font-bold text-amber-700 font-display">{highCount}</span>
          </div>
          <div className="flex justify-between items-center p-2.5 bg-blue-50/30 rounded-lg border border-blue-100/50">
            <span className="text-xs text-blue-700 font-medium">Total Active Insights</span>
            <span className="text-base font-bold text-blue-700 font-display">{insights.length}</span>
          </div>
        </div>
      </div>

      {/* 3. Data Quality Grade */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Telemetry & Data Quality</h3>
              <p className="text-xs text-gray-400">Link integrity & telemetry coverage</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${getQualityColor(dataQuality.overall_score)}`}>
              {dataQuality.overall_score >= 80 ? 'Grade A' : dataQuality.overall_score >= 60 ? 'Grade B' : 'Grade C'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold font-display text-slate-800">{dataQuality.overall_score}</span>
            <span className="text-sm text-gray-400">/ 100</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 text-xs space-y-1.5 text-gray-500">
          <div className="flex justify-between">
            <span>Average GPS Coverage:</span>
            <span className="font-semibold text-slate-700">{dataQuality.telemetry_coverage_average}%</span>
          </div>
          <div className="flex justify-between">
            <span>Missing Database References:</span>
            <span className={`font-semibold ${dataQuality.missing_fields_count > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {dataQuality.missing_fields_count} gaps
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
