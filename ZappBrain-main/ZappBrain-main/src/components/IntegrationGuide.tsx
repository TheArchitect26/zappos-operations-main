/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Database, Code, BookOpen, Layers, Check } from 'lucide-react';

export default function IntegrationGuide() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const integrationCode = `import { runZappBrain } from './lib/zapp-brain/engine';

// Querying current ZappOS domain state
const companies = await db.from('companies').select('*');
const jobs = await db.from('jobs').select('*');
const drivers = await db.from('drivers').select('*');
const vehicles = await db.from('vehicles').select('*');
const customers = await db.from('customers').select('*');
const documents = await db.from('documents').select('*');
const incidents = await db.from('incidents').select('*');
const maintenanceTasks = await db.from('maintenance_tasks').select('*');
const trackingSessions = await db.from('tracking_sessions').select('*');
const trackingSummaries = await db.from('tracking_summaries').select('*');
const jobEvents = await db.from('job_events').select('*');

// Execute pure, side-effect-free diagnostic intelligence
const brainResult = runZappBrain({
  companies,
  jobs,
  drivers,
  vehicles,
  customers,
  documents,
  incidents,
  maintenanceTasks,
  trackingSessions,
  trackingSummaries,
  jobEvents
});

// Upsert findings securely into ZappOS DB
for (const insight of brainResult.insights) {
  await db.from('zapp_brain_insights').upsert({
    id: insight.id,
    company_id: insight.company_id,
    category: insight.category,
    severity: insight.severity,
    title: insight.title,
    explanation: insight.explanation,
    evidence: insight.evidence,
    recommendation: insight.recommendation,
    confidence: insight.confidence,
    confidence_score: insight.confidence_score,
    affected_entities: insight.affected_entities,
    status: 'new'
  });
}`;

  const postgresSchema = `-- Database schema extension for Zapp Brain Intelligence Module

-- 1. Main Insights Table
CREATE TABLE zapp_brain_insights (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(id),
    category VARCHAR(25) NOT NULL, -- 'delay', 'maintenance', 'safety', etc.
    severity VARCHAR(15) NOT NULL, -- 'info', 'low', 'medium', 'high', 'critical'
    title VARCHAR(255) NOT NULL,
    explanation TEXT NOT NULL,
    evidence JSONB NOT NULL, -- Stores metrics & observations arrays
    recommendation TEXT NOT NULL,
    confidence VARCHAR(20) NOT NULL, -- 'insufficient_data', 'low', 'medium', 'high'
    confidence_score INT NOT NULL, -- 0 to 100
    affected_entities JSONB NOT NULL, -- List of {type, id, name}
    status VARCHAR(20) NOT NULL DEFAULT 'new', -- 'new', 'investigating', 'resolved', 'archived'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Human Operator Feedback Logs
CREATE TABLE zapp_brain_feedback (
    id VARCHAR(50) PRIMARY KEY,
    insight_id VARCHAR(50) REFERENCES zapp_brain_insights(id) ON DELETE CASCADE,
    status VARCHAR(25) NOT NULL, -- 'useful', 'not_useful', 'correct', 'false_alarm', 'resolved'
    reason_label VARCHAR(30) NOT NULL, -- 'traffic', 'customer_delay', 'vehicle_issue', etc.
    comments TEXT,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Downstream Training / Learning Records
CREATE TABLE zapp_brain_learning_records (
    id VARCHAR(50) PRIMARY KEY,
    insight_id VARCHAR(50) REFERENCES zapp_brain_insights(id),
    category VARCHAR(25) NOT NULL,
    applied_feedback VARCHAR(25) NOT NULL,
    feedback_reason VARCHAR(30) NOT NULL,
    action_taken TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`;

  return (
    <div className="space-y-6">
      {/* Blueprint Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            title: '1. Observe',
            desc: 'Aggregate raw, multi-system operational event logs and telemetry points without modifying original states.',
            bg: 'bg-blue-50/50 border-blue-100 text-blue-700',
          },
          {
            title: '2. Explain',
            desc: 'Derive pattern consistency factors, compute analytical vectors, and isolate root causes using rule heuristics.',
            bg: 'bg-indigo-50/50 border-indigo-100 text-indigo-700',
          },
          {
            title: '3. Recommend',
            desc: 'Formulate precise operational advice and list affected entities to empower human dispatchers.',
            bg: 'bg-violet-50/50 border-violet-100 text-violet-700',
          },
          {
            title: '4. Learn',
            desc: 'Log operator feedback logs (correct, false_alarm) as downstream learning records to train models stateless.',
            bg: 'bg-emerald-50/50 border-emerald-100 text-emerald-700',
          },
        ].map((p, idx) => (
          <div key={idx} className={`p-4 rounded-xl border ${p.bg}`}>
            <h3 className="font-bold text-sm mb-1 font-display">{p.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Block Integration */}
        <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-lg flex flex-col h-[520px]">
          <div className="bg-slate-950 px-4 py-3 flex justify-between items-center border-b border-slate-800">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-mono font-bold">
              <Code size={14} className="text-sky-400" />
              INTEGRATION_RUNNER.TS
            </div>
            <button
              onClick={() => copyToClipboard(integrationCode, 'ts')}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono px-2 py-1 rounded cursor-pointer transition-colors"
            >
              {copiedSection === 'ts' ? 'Copied ✓' : 'Copy Code'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300 leading-relaxed">
            <pre>{integrationCode}</pre>
          </div>
        </div>

        {/* SQL Schema Block */}
        <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-lg flex flex-col h-[520px]">
          <div className="bg-slate-950 px-4 py-3 flex justify-between items-center border-b border-slate-800">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-mono font-bold">
              <Database size={14} className="text-emerald-400" />
              POSTGRES_SCHEMA.SQL
            </div>
            <button
              onClick={() => copyToClipboard(postgresSchema, 'sql')}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono px-2 py-1 rounded cursor-pointer transition-colors"
            >
              {copiedSection === 'sql' ? 'Copied ✓' : 'Copy SQL'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300 leading-relaxed">
            <pre>{postgresSchema}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
