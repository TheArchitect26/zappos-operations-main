export function feedbackScore(items: readonly { feedback: string }[]) {
  if (!items.length) return { accuracyPercent: null, confirmed: 0, rejected: 0 };
  const confirmed = items.filter((item) =>
    ["useful", "correct", "resolved"].includes(item.feedback),
  ).length;
  const rejected = items.filter((item) =>
    ["not_useful", "false_alarm"].includes(item.feedback),
  ).length;
  return {
    accuracyPercent: Math.round((confirmed / items.length) * 1000) / 10,
    confirmed,
    rejected,
  };
}
