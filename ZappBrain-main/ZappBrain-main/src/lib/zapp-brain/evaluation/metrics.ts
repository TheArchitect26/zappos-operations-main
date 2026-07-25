/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EvaluationResult } from './types';

/**
 * Calculates a complete suite of classification and accuracy metrics.
 * 
 * Formulas:
 * - Accuracy: (TP + TN) / (TP + TN + FP + FN)
 * - Precision: TP / (TP + FP)
 * - Recall: TP / (TP + FN)
 * - Specificity: TN / (TN + FP)
 * - F1 Score: 2 * (Precision * Recall) / (Precision + Recall)
 * - Balanced Accuracy: (Recall + Specificity) / 2
 * - False Positive Rate: FP / (FP + TN)
 * - False Negative Rate: FN / (TP + FN)
 * - MCC: (TP * TN - FP * FN) / sqrt((TP + FP) * (TP + FN) * (TN + FP) * (TN + FN))
 */
export function calculateAccuracyMetrics(
  tp: number,
  fp: number,
  tn: number,
  fn: number
): EvaluationResult {
  const total = tp + fp + tn + fn;

  // 1. Accuracy
  const accuracy = total > 0 ? (tp + tn) / total : 1.0;

  // 2. Precision
  const precision = (tp + fp) > 0 ? tp / (tp + fp) : 1.0;

  // 3. Recall (Sensitivity)
  const recall = (tp + fn) > 0 ? tp / (tp + fn) : 1.0;

  // 4. Specificity
  const specificity = (tn + fp) > 0 ? tn / (tn + fp) : 1.0;

  // 5. F1 Score
  const f1Score = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 1.0;

  // 6. Balanced Accuracy
  const balancedAccuracy = (recall + specificity) / 2;

  // 7. False Positive Rate
  const falsePositiveRate = (fp + tn) > 0 ? fp / (fp + tn) : 0.0;

  // 8. False Negative Rate
  const falseNegativeRate = (fn + tp) > 0 ? fn / (fn + tp) : 0.0;

  // 9. Matthews Correlation Coefficient (MCC)
  const mccDenominator = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn));
  const mcc = mccDenominator > 0 ? (tp * tn - fp * fn) / mccDenominator : 0.0;

  return {
    accuracy: Math.round(accuracy * 100),
    precision: Math.round(precision * 100),
    recall: Math.round(recall * 100),
    specificity: Math.round(specificity * 100),
    f1Score: Math.round(f1Score * 100),
    balancedAccuracy: Math.round(balancedAccuracy * 100),
    falsePositiveRate: Math.round(falsePositiveRate * 100),
    falseNegativeRate: Math.round(falseNegativeRate * 100),
    mcc: Number(mcc.toFixed(4)),
  };
}
