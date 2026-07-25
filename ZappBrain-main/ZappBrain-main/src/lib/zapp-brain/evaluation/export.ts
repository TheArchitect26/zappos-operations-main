/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EvaluationReport } from './types';

/**
 * Serializes intelligence evaluation summaries into different target string formats.
 */
export class EvaluationExportEngine {
  
  /**
   * Serializes to standard indented JSON.
   */
  public exportToJSON(report: EvaluationReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Serializes to JSON Lines (JSONL) format for analytics pipeline streaming.
   */
  public exportToJSONL(report: EvaluationReport): string {
    const lines: string[] = [];
    lines.push(JSON.stringify({ type: 'header', id: report.id, timestamp: report.timestamp }));
    lines.push(JSON.stringify({ type: 'metrics', ...report.metrics }));
    report.ruleScores.forEach(r => {
      lines.push(JSON.stringify({ type: 'rule_score', ...r }));
    });
    report.benchmarks.forEach(b => {
      lines.push(JSON.stringify({ type: 'benchmark', ...b }));
    });
    report.calibrationSuggestions.forEach(c => {
      lines.push(JSON.stringify({ type: 'calibration', ...c }));
    });
    return lines.join('\n');
  }

  /**
   * Formats rule performance stats into structured CSV.
   */
  public exportRuleScoresToCSV(report: EvaluationReport): string {
    const headers = ['RuleID', 'Triggers', 'Confirmations', 'FalseAlarms', 'MissedDetections', 'Score', 'AvgConfidence', 'AvgTrust'];
    const rows = report.ruleScores.map(r => [
      r.ruleId,
      r.triggerCount,
      r.confirmationCount,
      r.falseAlarms,
      r.missedDetections,
      r.score,
      r.averageConfidence,
      r.averageTrust,
    ]);
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Generates a fully compliant, self-contained TypeScript file declaration.
   */
  public exportToTypeScript(report: EvaluationReport): string {
    return `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Generated Evaluation Report Export
 */

import { EvaluationReport } from './types';

export const EXPORTED_EVALUATION_REPORT: EvaluationReport = ${JSON.stringify(report, null, 2)};
`;
  }

  /**
   * Formats a gorgeous, clean Markdown summary report of the intelligence evaluation.
   */
  public exportToMarkdown(report: EvaluationReport): string {
    const m = report.metrics;
    let md = `# 🌐 Zapp OS - Evaluation Report\n\n`;
    md += `**Report ID:** \`${report.id}\`  \n`;
    md += `**Timestamp:** \`${report.timestamp}\`  \n`;
    md += `**Target Scenario:** \`${report.scenarioName}\`  \n\n`;

    md += `## 📊 Core Performance Metrics\n\n`;
    md += `| Metric | Value | Definition |\n`;
    md += `| :--- | :---: | :--- |\n`;
    md += `| **Accuracy** | ${m.accuracy}% | Overall correct classification ratio |\n`;
    md += `| **Precision** | ${m.precision}% | Ratio of valid positive triggers |\n`;
    md += `| **Recall** | ${m.recall}% | Sensitivity score (capture rate) |\n`;
    md += `| **Specificity** | ${m.specificity}% | Ratio of correctly identified clean states |\n`;
    md += `| **F1 Score** | ${m.f1Score}% | Harmonic mean of Precision and Recall |\n`;
    md += `| **Balanced Accuracy** | ${m.balancedAccuracy}% | Mean of Recall and Specificity |\n`;
    md += `| **False Positive Rate** | ${m.falsePositiveRate}% | System noise metric |\n`;
    md += `| **False Negative Rate** | ${m.falseNegativeRate}% | Missed detection risk metric |\n`;
    md += `| **Matthews Correlation Coefficient** | ${m.mcc} | Binary classification index |\n\n`;

    md += `## 📜 Rule Performance Scorecard\n\n`;
    md += `| Rule ID | Triggers | Confirmations | False Alarms | Missed | Score (0-100) |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: | :---: |\n`;
    report.ruleScores.forEach(r => {
      md += `| \`${r.ruleId}\` | ${r.triggerCount} | ${r.confirmationCount} | ${r.falseAlarms} | ${r.missedDetections} | **${r.score}** |\n`;
    });
    md += `\n`;

    md += `## 🛠️ Calibration Recommendations\n\n`;
    report.calibrationSuggestions.forEach(c => {
      md += `### 🔧 ${c.title} (Impact: **${c.estimatedImpact.toUpperCase()}**)\n`;
      md += `- **Rule Affected:** \`${c.ruleId}\`\n`;
      md += `- **Recommendation:** Change \`${c.currentValue}\` to \`${c.suggestedValue}\`\n`;
      md += `- **Supporting Evidence:** ${c.supportingEvidence}\n`;
      md += `- **Expected Benefit:** ${c.expectedBenefit}\n`;
      md += `- **Calibrator Confidence:** ${c.confidence}%\n\n`;
    });

    if (report.driftAlerts.length > 0) {
      md += `## ⚠️ Intelligence Drift Alerts\n\n`;
      report.driftAlerts.forEach(a => {
        md += `- ${a}\n`;
      });
      md += `\n`;
    }

    return md;
  }
}
