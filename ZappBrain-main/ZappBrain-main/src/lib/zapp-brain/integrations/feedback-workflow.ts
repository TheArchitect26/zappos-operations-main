/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createInsightFeedback, applyFeedbackToInsight } from '../feedback';
import { localDbStore, PersistentInsight } from './persistence';
import { FeedbackStatus, FeedbackReason, LearningRecord } from '../types';

/**
 * Storage key for learning records & feedback log audit
 */
const LEARNING_RECORDS_KEY = 'zapp_brain_db_learning_records';

export function getSavedLearningRecords(): LearningRecord[] {
  try {
    const data = localStorage.getItem(LEARNING_RECORDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLearningRecord(record: LearningRecord): void {
  try {
    const records = getSavedLearningRecords();
    records.unshift(record);
    localStorage.setItem(LEARNING_RECORDS_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save learning record:', e);
  }
}

/**
 * Workflow Action: Dispatcher submits manual operational feedback
 * This action:
 * 1. Creates a formal `InsightFeedback` record
 * 2. Applies it to the PersistentInsight state in the database
 * 3. Generates and stores immutable `LearningRecord` inputs for model fine-tuning
 * 4. Persists the modified states
 */
export function handleDispatcherFeedback(params: {
  insightId: string;
  status: FeedbackStatus;
  reason: FeedbackReason;
  comments: string;
  dispatcherName: string;
}): {
  updatedInsight: PersistentInsight;
  learningRecord: LearningRecord | null;
} {
  const { insightId, status, reason, comments, dispatcherName } = params;

  // Retrieve current persistent state
  const insights = localDbStore.getInsights();
  const index = insights.findIndex(i => i.id === insightId);

  if (index === -1) {
    throw new Error(`Insight with ID ${insightId} not found in persistent store.`);
  }

  const existingInsight = insights[index];

  // 1. Create feedback payload
  const feedbackObj = createInsightFeedback(
    insightId,
    status,
    reason,
    comments,
    dispatcherName || 'operator'
  );

  // 2. Apply feedback to retrieve updated insight and learning record structures
  const { updatedInsight, learningRecord } = applyFeedbackToInsight(existingInsight, feedbackObj);

  // Map specific user feedback action into the persistent database statuses if appropriate
  let finalStatus: PersistentInsight['status'] = updatedInsight.status as any;
  if (status === 'false_alarm') {
    finalStatus = 'archived'; // Archive false alarms
  } else if (status === 'resolved') {
    finalStatus = 'resolved';
  } else if (status === 'needs_follow_up') {
    finalStatus = 'investigating';
  } else if (status === 'correct') {
    finalStatus = 'investigating'; // Under investigation
  }

  const persistentUpdated: PersistentInsight = {
    ...existingInsight,
    ...updatedInsight,
    status: finalStatus,
    updated_at: new Date().toISOString(),
  };

  // 3. Save modified insight
  insights[index] = persistentUpdated;
  localDbStore.saveInsights(insights);

  // 4. Record learning record if generated
  if (learningRecord) {
    saveLearningRecord(learningRecord);
  }

  return {
    updatedInsight: persistentUpdated,
    learningRecord,
  };
}

/**
 * Clear all persistent workflow history (for diagnostics & testing reset)
 */
export function clearPersistentWorkflowStore(): void {
  localDbStore.clear();
  try {
    localStorage.removeItem(LEARNING_RECORDS_KEY);
  } catch {}
}
