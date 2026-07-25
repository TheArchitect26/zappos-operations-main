/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  InsightFeedback,
  FeedbackStatus,
  FeedbackReason,
  ZappBrainInsight,
  LearningRecord,
} from './types';

/**
 * Creates a new feedback record for an insight.
 */
export function createInsightFeedback(
  insightId: string,
  status: FeedbackStatus,
  reasonLabel: FeedbackReason,
  comments?: string,
  createdBy: string = 'human_operator'
): InsightFeedback {
  return {
    id: `fb_${Math.random().toString(36).substr(2, 9)}`,
    insight_id: insightId,
    status,
    reason_label: reasonLabel,
    comments,
    created_by: createdBy,
    created_at: new Date().toISOString(),
  };
}

/**
 * Applies a feedback record to an insight, updating its status list
 * and optionally returning a new learning record to train the rules engine over time.
 */
export function applyFeedbackToInsight(
  insight: ZappBrainInsight,
  feedback: InsightFeedback
): { updatedInsight: ZappBrainInsight; learningRecord: LearningRecord | null } {
  // Add feedback to the list
  const feedbacks = insight.feedback ? [...insight.feedback, feedback] : [feedback];
  
  // Update status based on the feedback status
  let updatedStatus = insight.status;
  if (feedback.status === 'resolved') {
    updatedStatus = 'resolved';
  } else if (feedback.status === 'needs_follow_up') {
    updatedStatus = 'investigating';
  }

  const updatedInsight: ZappBrainInsight = {
    ...insight,
    status: updatedStatus,
    feedback: feedbacks,
  };

  // Convert to a learning record if it's high quality feedback (e.g. correct, false alarm, useful)
  let learningRecord: LearningRecord | null = null;
  if (['useful', 'not_useful', 'correct', 'false_alarm'].includes(feedback.status)) {
    learningRecord = {
      id: `lr_${Math.random().toString(36).substr(2, 9)}`,
      insight_id: insight.id,
      category: insight.category,
      applied_feedback: feedback.status,
      feedback_reason: feedback.reason_label,
      action_taken: feedback.comments,
      timestamp: new Date().toISOString(),
    };
  }

  return { updatedInsight, learningRecord };
}

/**
 * Summarizes feedback on insights for reporting and model learning.
 */
export function summarizeFeedback(feedbacks: InsightFeedback[]): {
  total: number;
  usefulCount: number;
  notUsefulCount: number;
  accuracyRate: number; // useful / total
  commonReasons: Record<FeedbackReason, number>;
} {
  const total = feedbacks.length;
  if (total === 0) {
    return {
      total: 0,
      usefulCount: 0,
      notUsefulCount: 0,
      accuracyRate: 1.0,
      commonReasons: {} as Record<FeedbackReason, number>,
    };
  }

  let usefulCount = 0;
  let notUsefulCount = 0;
  const commonReasons = {} as Record<FeedbackReason, number>;

  feedbacks.forEach(f => {
    if (f.status === 'useful' || f.status === 'correct' || f.status === 'resolved') {
      usefulCount++;
    } else if (f.status === 'not_useful' || f.status === 'false_alarm') {
      notUsefulCount++;
    }

    if (f.reason_label) {
      commonReasons[f.reason_label] = (commonReasons[f.reason_label] || 0) + 1;
    }
  });

  return {
    total,
    usefulCount,
    notUsefulCount,
    accuracyRate: Math.round((usefulCount / total) * 100) / 100,
    commonReasons,
  };
}
