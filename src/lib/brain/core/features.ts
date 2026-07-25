export interface BrainOperationalSignal {
  sourceRecordId: string;
  sourceRecordType: string;
  state: string;
  observedAt: string;
  qualityScore?: number | null;
}

export function aggregateOperationalSignals(signals: readonly BrainOperationalSignal[]) {
  const usable = signals.filter(
    (signal) => Boolean(signal.sourceRecordId) && !Number.isNaN(Date.parse(signal.observedAt)),
  );
  const stateCounts = usable.reduce<Record<string, number>>((counts, signal) => {
    counts[signal.state] = (counts[signal.state] ?? 0) + 1;
    return counts;
  }, {});
  const quality = usable
    .map((signal) => signal.qualityScore)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return {
    observationCount: usable.length,
    stateCounts,
    averageQualityScore: quality.length
      ? Math.round(quality.reduce((sum, value) => sum + value, 0) / quality.length)
      : null,
  };
}
