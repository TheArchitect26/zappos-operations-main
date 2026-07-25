/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimState, SimIncident } from '../zapp-simulator/types';
import { ExperienceMemoryStore } from '../zapp-brain-experience/memory';
import { SimilaritySearchResult } from './types';

/**
 * Causal Intelligence & Historical Similarity Search Engine.
 */
export class CausalReasoningEngine {
  private memoryStore: ExperienceMemoryStore;

  constructor(memoryStore: ExperienceMemoryStore) {
    this.memoryStore = memoryStore;
  }

  /**
   * Searches historical experience logs to locate incidents matching a target criteria.
   */
  public searchSimilarIncidents(
    targetDescription: string,
    state: SimState
  ): SimilaritySearchResult[] {
    const records = this.memoryStore.getAllRecords();
    const desc = targetDescription.toLowerCase();

    // Check if we have records in memory; if none, simulate historical matches
    if (records.length === 0) {
      return this.generateSyntheticSimilarityResults(desc);
    }

    const matches: SimilaritySearchResult[] = [];

    records.forEach(record => {
      // Basic match logic: scenarios categorized as similar
      let similarityScore = 50;
      let matchedTerm = 'General Operations';

      if (desc.includes('coolant') || desc.includes('overheating')) {
        if (record.scenario.categories.includes('mechanical') || record.scenario.description.toLowerCase().includes('engine')) {
          similarityScore = 85 + Math.round(Math.random() * 10);
          matchedTerm = 'Coolant Leak & Service Delay';
        }
      } else if (desc.includes('theft') || desc.includes('siphoning') || desc.includes('fuel')) {
        if (record.scenario.categories.includes('compliance') || record.scenario.description.toLowerCase().includes('fuel')) {
          similarityScore = 80 + Math.round(Math.random() * 15);
          matchedTerm = 'Fuel Drop / Siphoning Theft';
        }
      } else if (desc.includes('storm') || desc.includes('flood') || desc.includes('weather')) {
        if (record.scenario.categories.includes('weather') || record.scenario.description.toLowerCase().includes('rain')) {
          similarityScore = 90 + Math.round(Math.random() * 8);
          matchedTerm = 'Heavy Rain Flooding Bypass';
        }
      }

      if (similarityScore >= 70) {
        matches.push({
          experienceId: record.id,
          similarityScore,
          incidentDescription: record.scenario.description,
          actionTaken: record.recommendations[0] || 'Reroute to Depot B',
          successRate: record.finalOutcome.wasSuccess ? 95 : 45,
          lessonsLearned: [
            record.lessonsLearned?.whyDidItHappen || 'Environmental conditions created transit blockages.',
            record.lessonsLearned?.earlierDetectionStrategy || 'Calibrate telematics early warnings.'
          ],
          timeToRecoveryMinutes: record.finalOutcome.totalDelayMinutes || 45,
        });
      }
    });

    // Fallback if no matching records are populated in database
    if (matches.length === 0) {
      return this.generateSyntheticSimilarityResults(desc);
    }

    return matches.sort((a, b) => b.similarityScore - a.similarityScore);
  }

  private generateSyntheticSimilarityResults(desc: string): SimilaritySearchResult[] {
    if (desc.includes('coolant') || desc.includes('overheating') || desc.includes('temp')) {
      return [
        {
          experienceId: 'exp_hist_902',
          similarityScore: 92,
          incidentDescription: 'Scania R450 logged critical engine coolant warning DTC_523 at N1 Tugela Corridor.',
          actionTaken: 'Dispatcher ordered immediate stand-down and flatbed tow to Harrismith workshop.',
          successRate: 98,
          lessonsLearned: [
            'Avoided complete engine seizure saving R150,000.',
            'Identified root cause as aged radiator coolant hose worn under extreme ascent load.',
          ],
          timeToRecoveryMinutes: 75,
        },
        {
          experienceId: 'exp_hist_113',
          similarityScore: 78,
          incidentDescription: 'Volvo FH16 reported high intake valve manifold thermal warning.',
          actionTaken: 'Instructed driver to switch off auxiliary cabin cooling and proceed at lower gear.',
          successRate: 65,
          lessonsLearned: [
            'Slightly reduced engine heat but triggered en route failure 12km later.',
            'Proved continue-operating strategy creates critical safety exposure.',
          ],
          timeToRecoveryMinutes: 145,
        }
      ];
    }

    if (desc.includes('theft') || desc.includes('siphoning') || desc.includes('fuel')) {
      return [
        {
          experienceId: 'exp_hist_443',
          similarityScore: 94,
          incidentDescription: 'MAN TGX reported steep 80L stationary fuel drop in high-risk Ladysmith layover.',
          actionTaken: 'Dispatched tactical corridor security patrol escort to the parked GPS point.',
          successRate: 95,
          lessonsLearned: [
            'Secured remaining fuel tank volume within 15 minutes of trigger.',
            'Identified local siphoning crime syndicate operating in unapproved rest stops.',
          ],
          timeToRecoveryMinutes: 20,
        }
      ];
    }

    // Default Fallback
    return [
      {
        experienceId: 'exp_hist_def',
        similarityScore: 85,
        incidentDescription: 'Routine corridor delay due to regional highway construction traffic queues.',
        actionTaken: 'Automated GPS reroute navigation bypassed toll bottlenecks.',
        successRate: 90,
        lessonsLearned: [
          'Saved average 25 minutes trip transit variance.',
        ],
        timeToRecoveryMinutes: 15,
      }
    ];
  }
}
