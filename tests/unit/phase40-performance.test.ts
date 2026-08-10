import { describe, expect, it } from "vitest";
import { alertFatigueFilter, briefingSections, operatingState } from "@/lib/executive/phase40";
const measured = <T>(run: () => T) => {
  const start = performance.now();
  const result = run();
  return { result, elapsedMs: performance.now() - start };
};
describe("Phase 40 bounded in-process performance", () => {
  it.each([100, 1000])("aggregates %i vehicle KPI inputs", (count) => {
    const { result, elapsedMs } = measured(() =>
      operatingState(
        Array.from({ length: count }, (_, i) => ({
          domain: `vehicle-${i}`,
          score: 70 + (i % 20),
          weight: 1,
          confidence: 80,
          observedAt: "2026-08-10T11:58:00Z",
        })),
        Date.parse("2026-08-10T12:00:00Z"),
      ),
    );
    console.info(`phase40 performance: ${count} vehicles ${elapsedMs.toFixed(2)}ms`);
    expect(result.state).not.toBe("unknown");
    expect(elapsedMs).toBeLessThan(500);
  });
  it("ranks 10,000 job attention aggregates", () => {
    const { result, elapsedMs } = measured(() =>
      alertFatigueFilter(
        Array.from({ length: 10_000 }, (_, i) => ({
          severity: i % 10 ? ("elevated" as const) : ("critical" as const),
          customerImpact: i % 100,
          operationalImpact: 50,
          persistenceHours: i % 24,
          repeated: i % 5,
          owned: i % 2 === 0,
          confidence: 80,
        })),
        50,
      ),
    );
    console.info(`phase40 performance: 10,000 jobs ${elapsedMs.toFixed(2)}ms`);
    expect(result).toHaveLength(50);
    expect(elapsedMs).toBeLessThan(1000);
  });
  it("transforms 100,000 pre-aggregated events into a briefing", () => {
    const changes = Array.from({ length: 100_000 }, (_, i) => `event-${i}`);
    const { result, elapsedMs } = measured(() =>
      briefingSections({
        changes,
        attention: changes.slice(0, 100),
        risks: changes.slice(0, 100),
        opportunities: changes.slice(0, 100),
      }),
    );
    console.info(`phase40 performance: 100,000 events ${elapsedMs.toFixed(2)}ms`);
    expect(result).toHaveLength(6);
    expect(elapsedMs).toBeLessThan(500);
  });
  it("builds 50 bounded branch views", () => {
    const { result, elapsedMs } = measured(() =>
      Array.from({ length: 50 }, (_, i) => ({
        branch: i,
        kpis: Array.from({ length: 20 }, (_, x) => x),
      })),
    );
    console.info(`phase40 performance: 50 branches ${elapsedMs.toFixed(2)}ms`);
    expect(result).toHaveLength(50);
    expect(elapsedMs).toBeLessThan(100);
  });
});
