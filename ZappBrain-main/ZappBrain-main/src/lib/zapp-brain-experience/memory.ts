/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExperienceRecord } from './types';

/**
 * Immutable in-memory database store for Zapp Brain's operational experiences.
 */
export class ExperienceMemoryStore {
  private records: Map<string, ExperienceRecord> = new Map();
  private maxRecordsLimit: number = 50000; // soft cap for memory safety in browser runtimes

  /**
   * Adds an experience record to the immutable database.
   * Ensures that once created, a record can never be modified or overwritten.
   */
  public addRecord(record: ExperienceRecord): void {
    if (this.records.has(record.id)) {
      throw new Error(`CRITICAL: Attempted violation of immutability. Record ID ${record.id} already exists.`);
    }

    // Keep memory clean for long running tests / UI sessions
    if (this.records.size >= this.maxRecordsLimit) {
      const oldestId = this.records.keys().next().value;
      if (oldestId) {
        this.records.delete(oldestId);
      }
    }

    this.records.set(record.id, Object.freeze(record));
  }

  public getRecord(id: string): ExperienceRecord | undefined {
    return this.records.get(id);
  }

  public getAllRecords(): ExperienceRecord[] {
    return Array.from(this.records.values());
  }

  public searchRecords(filter: {
    scenarioId?: string;
    fleetScale?: 'small' | 'medium' | 'enterprise';
    wasSuccess?: boolean;
    minDifficulty?: number;
    maxDifficulty?: number;
  }): ExperienceRecord[] {
    const results: ExperienceRecord[] = [];
    for (const record of this.records.values()) {
      if (filter.scenarioId && record.scenario.id !== filter.scenarioId) continue;
      if (filter.fleetScale && record.initialConditions.fleetScale !== filter.fleetScale) continue;
      if (filter.wasSuccess !== undefined && record.finalOutcome.wasSuccess !== filter.wasSuccess) continue;
      if (filter.minDifficulty !== undefined && record.scenario.difficultyRating < filter.minDifficulty) continue;
      if (filter.maxDifficulty !== undefined && record.scenario.difficultyRating > filter.maxDifficulty) continue;
      results.push(record);
    }
    return results;
  }

  public size(): number {
    return this.records.size;
  }

  public clear(): void {
    this.records.clear();
  }
}
