/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KnowledgeTopic, ExperienceRecord } from './types';

export const KNOWLEDGE_CATEGORIES = [
  'Fleet',
  'Vehicles',
  'Drivers',
  'Customers',
  'Routes',
  'Depots',
  'Maintenance',
  'Fuel',
  'Compliance',
  'Safety',
  'Telemetry',
  'Weather',
  'Border Operations',
  'Communication',
  'Incidents',
  'Recovery',
  'Emergency Response',
];

/**
 * Aggregates operational experiences into a highly structured knowledge base.
 */
export class SyntheticKnowledgeLibrary {
  private library: Record<string, KnowledgeTopic> = {};

  constructor() {
    this.initializeLibrary();
  }

  private initializeLibrary(): void {
    KNOWLEDGE_CATEGORIES.forEach(cat => {
      this.library[cat] = {
        category: cat,
        commonPatterns: [],
        historicalExamples: [],
        frequentCauses: [],
        bestResponses: [],
        successRates: 100,
        lessonsLearned: [],
        relatedExperiences: [],
      };
    });

    // Populate initial historical base insights
    this.library['Fuel'].commonPatterns.push('Stationary fuel level drops on Friday evenings in remote N3 rest stops.');
    this.library['Fuel'].frequentCauses.push('Security monitoring gaps', 'Extended unapproved driver overnight layovers');
    this.library['Fuel'].bestResponses.push('Immediate dispatch of route security patrol', 'Automatic OBD fuel slope notifications');

    this.library['Weather'].commonPatterns.push('Severe coastal rainfall causing 120+ min logistics delay margins.');
    this.library['Weather'].frequentCauses.push('Inadequate drainage near low-lying trade routes');
    this.library['Weather'].bestResponses.push('Pre-emptive route diversion via N2/N1', 'Automated ETA delay alerts to clients');
  }

  /**
   * Absorb a new experience record to update the library metrics dynamically.
   */
  public absorbExperience(record: ExperienceRecord): void {
    const isSuccess = record.finalOutcome.wasSuccess;
    
    // Select relevant categories based on scenario hazard categories
    const categoriesToUpdate = ['Fleet'];
    
    if (record.scenario.categories.includes('weather')) categoriesToUpdate.push('Weather');
    if (record.scenario.categories.includes('traffic')) categoriesToUpdate.push('Routes');
    if (record.scenario.categories.includes('mechanical')) {
      categoriesToUpdate.push('Vehicles', 'Maintenance');
    }
    if (record.scenario.categories.includes('operational')) {
      categoriesToUpdate.push('Drivers', 'Customers', 'Fuel');
    }
    if (record.scenario.categories.includes('telematics')) categoriesToUpdate.push('Telemetry');
    if (record.scenario.categories.includes('compliance')) categoriesToUpdate.push('Compliance');
    if (record.scenario.categories.includes('emergency')) {
      categoriesToUpdate.push('Safety', 'Emergency Response', 'Incidents', 'Recovery');
    }

    categoriesToUpdate.forEach(cat => {
      const topic = this.library[cat];
      if (!topic) return;

      // Add experience ID link
      if (!topic.relatedExperiences.includes(record.id)) {
        topic.relatedExperiences.push(record.id);
      }

      // Add historical summary snippet
      if (topic.historicalExamples.length < 10) {
        topic.historicalExamples.push({
          simId: record.id,
          summary: `${record.scenario.name} - ${record.finalOutcome.wasSuccess ? 'Success' : 'Failure'} (Difficulty: ${record.scenario.difficultyRating})`,
        });
      }

      // Dynamic success rate formula integration
      const totalExperiences = topic.relatedExperiences.length;
      const successes = isSuccess ? 1 : 0;
      topic.successRates = Math.round(
        ((topic.successRates * (totalExperiences - 1)) + (successes * 100)) / totalExperiences
      );

      // Extract new causes and responses from lessons
      if (record.lessonsLearned.whyDidItHappen && !topic.frequentCauses.includes(record.lessonsLearned.whyDidItHappen)) {
        if (topic.frequentCauses.length < 5) {
          topic.frequentCauses.push(record.lessonsLearned.whyDidItHappen);
        }
      }
      record.lessonsLearned.effectiveRecommendations.forEach(rec => {
        if (!topic.bestResponses.includes(rec) && topic.bestResponses.length < 5) {
          topic.bestResponses.push(rec);
        }
      });
    });
  }

  public getTopic(category: string): KnowledgeTopic | undefined {
    return this.library[category];
  }

  public getFullLibrary(): Record<string, KnowledgeTopic> {
    return this.library;
  }
}
