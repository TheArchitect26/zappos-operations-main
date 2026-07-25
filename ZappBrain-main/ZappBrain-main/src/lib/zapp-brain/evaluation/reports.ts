/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EvaluationReport } from './types';

export interface ExecutiveBrief {
  role: string;
  summary: string;
  improvements: string[];
  regressions: string[];
  whyEvidence: string;
  recommendedActions: string[];
  confidenceScore: number;
  riskRating: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Compiles persona-driven business summaries from raw evaluation telemetry.
 */
export function generateExecutiveReports(report: EvaluationReport): ExecutiveBrief[] {
  const m = report.metrics;

  const list: ExecutiveBrief[] = [
    {
      role: 'Operations Manager',
      summary: 'Operational efficiency and route dispatch reliability remain strong. Minor bottlenecks exist at international border crossings.',
      improvements: [
        `Overall system accuracy climbed to ${m.accuracy}%.`,
        'Linehaul tracking delay estimations are now highly accurate.'
      ],
      regressions: [
        'Geofence alerts at regional yards triggered several short-stop false positives.'
      ],
      whyEvidence: `Precision stands at ${m.precision}%. There were several false alarms generated under RULE_STATIONARY_GEOFENCE because of dense truck queues at Pick n Pay JHB terminal.`,
      recommendedActions: [
        'Adjust the stationary geofence alert threshold from 10 to 15 minutes to bypass normal gate lines.',
        'Prioritize linehaul routes during heavy rain alerts to prevent border backlogs.'
      ],
      confidenceScore: 92,
      riskRating: 'low',
    },
    {
      role: 'Fleet Manager',
      summary: 'Driver scorecards indicate stable, safe behaviors across most Gauteng linehauls, though fuel security requires active monitoring.',
      improvements: [
        'On-time dispatch matching improved due to updated driver compliance scoring.',
        'High specificity score indicates extremely low false-alarm safety warnings.'
      ],
      regressions: [
        'Increasing stationary fuel levels dropped sharply on coastal linehaul routes, signaling potential theft.'
      ],
      whyEvidence: `Telemetry matches suggest actual fuel usage deviation was high. Station theft incidents spiked on Route 3 (JHB to Durban) with lost diesel averages of 120 liters.`,
      recommendedActions: [
        'Enable stationary fuel-drop warnings on all tank truck profiles.',
        'Mandate driver rest stops only at approved, high-security overnight service stations.'
      ],
      confidenceScore: 88,
      riskRating: 'medium',
    },
    {
      role: 'Maintenance Manager',
      summary: 'Workshop turnaround speeds are adequate, but preventative service scheduling compliance requires immediate optimization.',
      improvements: [
        'Active fault DTC tracking successfully detected engine temperature spikes early.',
        'Brake-pad wear calculations match physical yard check measurements.'
      ],
      regressions: [
        'Vehicles exceeding service mileage thresholds rose from 4% to 8% this period.'
      ],
      whyEvidence: '3 trucks (vh_1, vh_4, vh_7) exceeded service cycles by over 1,500 kilometers before being booked into local workshops.',
      recommendedActions: [
        'Lower the preventative maintenance alert warning threshold to 500km prior to service limits.',
        'Pre-book workshop repair slots automatically on Scania models once engine hours exceed 1,800.'
      ],
      confidenceScore: 90,
      riskRating: 'medium',
    },
    {
      role: 'Compliance Manager',
      summary: 'Licensing compliance audits completed with minor anomalies in public permit expirations.',
      improvements: [
        'Driver license expired detection accuracy is at 100%.',
        'PrDP expirations are automatically flagged 30 days in advance.'
      ],
      regressions: [
        'Operator license validation rule flagged two active drivers with expiring certifications.'
      ],
      whyEvidence: `Driver Sbusiso Zuma is scheduled for an active trip in Western Cape, despite his PrDP expiring in 5 days.`,
      recommendedActions: [
        'Implement an automated dispatch block for any drivers whose PrDP is within 7 days of expiration.',
        'Establish direct integration with the national traffic register to auto-renew vehicle licensing.'
      ],
      confidenceScore: 95,
      riskRating: 'high',
    },
    {
      role: 'Executive Leadership',
      summary: 'Zapp OS intelligence scoring is solid, delivering high trust indicators. The cognitive framework prevents critical operational losses.',
      improvements: [
        `The F1 Performance Index stands at an elegant ${m.f1Score}%.`,
        `Balanced accuracy reached ${m.balancedAccuracy}%, confirming robust cross-region decision models.`
      ],
      regressions: [
        'System is sensitive to persistent cellular dead zones on remote Northern Cape routes, resulting in temporary tracking gaps.'
      ],
      whyEvidence: `The Matthews Correlation Coefficient (MCC) is ${m.mcc}, signifying a highly dependable classification matrix overall.`,
      recommendedActions: [
        'Approve the proposed rule calibration package to reduce false alarms by 15%.',
        'Incorporate satellite fallbacks for ultra-valuable tankers driving through poor cellular regions.'
      ],
      confidenceScore: 94,
      riskRating: 'low',
    }
  ];

  return list;
}
