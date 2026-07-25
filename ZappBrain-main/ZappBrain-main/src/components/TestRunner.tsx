/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { runZappBrainTests, TestCaseResult } from '../lib/zapp-brain/tests';
import { CheckCircle, AlertCircle, Play, RefreshCw, Terminal } from 'lucide-react';
import { motion } from 'motion/react';

export default function TestRunner() {
  const [results, setResults] = useState<TestCaseResult[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const executeSuite = () => {
    setIsRunning(true);
    setResults(null);
    setTimeout(() => {
      const suiteResults = runZappBrainTests();
      setResults(suiteResults);
      setIsRunning(false);
    }, 600);
  };

  const passCount = results ? results.filter(r => r.status === 'passed').length : 0;
  const failCount = results ? results.filter(r => r.status === 'failed').length : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-6 mb-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 pb-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
            <Terminal size={20} className="text-indigo-600" />
            Integrity Verification & Unit Tests
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Validate heuristic rules, telemetry analysis, and feedback logic against operational mocks.
          </p>
        </div>

        <button
          onClick={executeSuite}
          disabled={isRunning}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          {isRunning ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Compiling & Running...
            </>
          ) : (
            <>
              <Play size={16} />
              {results ? 'Re-run Test Suite' : 'Run Diagnostic Suite'}
            </>
          )}
        </button>
      </div>

      {!results && !isRunning && (
        <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <p className="text-sm text-gray-500">No test results loaded yet.</p>
          <p className="text-xs text-gray-400 mt-1">Click the button above to run the 8 deterministic test criteria requested for v0.</p>
        </div>
      )}

      {isRunning && (
        <div className="text-center py-12">
          <div className="inline-block relative w-10 h-10">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-xs text-slate-500 mt-4 font-mono">Running Zapp Brain rule assertions...</p>
        </div>
      )}

      {results && !isRunning && (
        <div>
          {/* Summary Row */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="text-sm font-semibold text-slate-700">Test Suite Summary:</div>
            <div className="flex gap-3 text-xs">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5">
                <CheckCircle size={14} /> Passed: {passCount} / {results.length}
              </span>
              {failCount > 0 && (
                <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5">
                  <AlertCircle size={14} /> Failed: {failCount}
                </span>
              )}
            </div>
          </div>

          {/* Test Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={`p-4 rounded-xl border flex items-start gap-3 transition-shadow hover:shadow-xs ${
                  r.status === 'passed'
                    ? 'bg-white border-gray-100 hover:border-emerald-100'
                    : 'bg-rose-50/10 border-rose-100 hover:border-rose-200'
                }`}
              >
                <div className="mt-0.5">
                  {r.status === 'passed' ? (
                    <CheckCircle className="text-emerald-500" size={18} />
                  ) : (
                    <AlertCircle className="text-rose-500" size={18} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wide">
                      {r.name.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm ${
                        r.status === 'passed' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {r.status === 'passed'
                      ? `Verified criteria successfully. Underflow parameters and deterministic assertions resolved fully.`
                      : r.message}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
