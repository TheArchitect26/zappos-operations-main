import { describe, expect, it } from "vitest";
import {
  aggregateVehicleRisk,
  recurrenceDetection,
  serviceDemand,
} from "@/lib/predictive-fleet/phase39";
const measured = <T>(run: () => T) => {
  const start = performance.now();
  const result = run();
  return { result, elapsedMs: performance.now() - start };
};
describe("Phase 39 bounded in-process performance", () => {
  it.each([100, 1000, 10000])("evaluates %i pre-aggregated vehicles", (count) => {
    const { result, elapsedMs } = measured(() =>
      Array.from({ length: count }, (_, index) =>
        aggregateVehicleRisk({
          subsystems: [
            { name: "service", score: index % 100, confidence: 80 },
            { name: "device", score: index % 40, confidence: 70 },
          ],
          evidence: [{ source: "aggregate", observedAt: "2026-08-10T10:00:00Z" }],
          now: Date.parse("2026-08-10T11:00:00Z"),
        }),
      ),
    );
    console.info(`phase39 performance: ${count} vehicles ${elapsedMs.toFixed(2)}ms`);
    expect(result).toHaveLength(count);
    expect(elapsedMs).toBeLessThan(1000);
  });
  it("processes one million pre-aggregated observations without browser telemetry", () => {
    const observations = Array.from({ length: 1_000_000 }, (_, index) => ({
      dueDays: index % 120,
      category: index % 3 ? "service" : "tyre",
    }));
    const { result, elapsedMs } = measured(() => serviceDemand(observations));
    console.info(`phase39 performance: 1,000,000 observations ${elapsedMs.toFixed(2)}ms`);
    expect(result.days90).toBeGreaterThan(0);
    expect(elapsedMs).toBeLessThan(2000);
  });
  it("detects recurrence in 10,000 bounded events", () => {
    const events = Array.from({ length: 10_000 }, (_, index) => ({
      code: `F${index % 25}`,
      occurredAt: new Date(1_700_000_000_000 + index * 60_000).toISOString(),
    }));
    const { result, elapsedMs } = measured(() => recurrenceDetection(events));
    console.info(`phase39 performance: 10,000 recurrence events ${elapsedMs.toFixed(2)}ms`);
    expect(result).toHaveLength(25);
    expect(elapsedMs).toBeLessThan(500);
  });
});
