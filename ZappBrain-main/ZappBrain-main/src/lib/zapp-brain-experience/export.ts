/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExperienceRecord } from './types';

/**
 * Exporter system serializing experience records into transportable schemas.
 */
export class SyntheticExperienceExporter {

  /**
   * Serializes a collection of records to raw JSON.
   */
  public toJSON(records: ExperienceRecord[]): string {
    return JSON.stringify(records, null, 2);
  }

  /**
   * Serializes records to JSONL (Newline-delimited JSON) format for machine learning training ingestion.
   */
  public toJSONL(records: ExperienceRecord[]): string {
    return records.map(r => JSON.stringify(r)).join('\n');
  }

  /**
   * Serializes records into clean tabular CSV.
   */
  public toCSV(records: ExperienceRecord[]): string {
    const headers = [
      'Record ID',
      'Seed',
      'Scenario',
      'Fleet Scale',
      'On Time Rate',
      'Incident Count',
      'Delay Minutes',
      'Total Cost',
      'Safety Score',
      'Customer Satisfaction',
      'Difficulty',
      'Novelty',
      'Learning Value',
      'Historical Importance',
    ];

    const lines = [headers.join(',')];

    records.forEach(r => {
      const row = [
        r.id,
        r.seed,
        `"${r.scenario.name.replace(/"/g, '""')}"`,
        r.initialConditions.fleetScale,
        r.finalOutcome.onTimeRate,
        r.finalOutcome.incidentCount,
        r.finalOutcome.totalDelayMinutes,
        r.finalOutcome.totalCost,
        r.finalOutcome.safetyScore,
        r.finalOutcome.customerSatisfaction,
        r.score.operationalDifficulty,
        r.score.noveltyScore,
        r.score.learningValue,
        r.score.historicalImportance,
      ];
      lines.push(row.join(','));
    });

    return lines.join('\n');
  }
}
