import { describe, expect, it } from "vitest";
import {
  recomputeYardQueue,
  recommendDock,
  searchYardVehicles,
  transformYardReplay,
  transformYardWall,
  type YardPerformanceVehicle,
} from "@/lib/yard/phase37";

function vehicles(count: number): YardPerformanceVehicle[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `vehicle-${index.toString().padStart(4, "0")}`,
    registration: `T${index.toString().padStart(4, "0")}`,
    state: ["queue", "parking", "dock", "loading", "ready"][index % 5],
    waitingMinutes: (index * 17) % 480,
    dockId: index % 3 === 0 ? `dock-${index % 100}` : null,
  }));
}

function measured<T>(name: string, operation: () => T) {
  const start = performance.now();
  const result = operation();
  const elapsedMs = performance.now() - start;
  console.info(`[phase37-performance] ${name}: ${elapsedMs.toFixed(3)}ms (in-process)`);
  return { result, elapsedMs };
}

describe("Phase 37 deterministic in-process performance", () => {
  it("transforms the 50-vehicle live yard wall", () => {
    const { result, elapsedMs } = measured("50 vehicle wall", () =>
      transformYardWall(vehicles(50)),
    );
    expect(result.reduce((sum, item) => sum + item.count, 0)).toBe(50);
    expect(elapsedMs).toBeLessThan(100);
  });

  it("searches and filters 250 vehicles and trailers", () => {
    const data = vehicles(250);
    const { result, elapsedMs } = measured("250 vehicle search/filter", () =>
      searchYardVehicles(data, "T00", "queue"),
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.state === "queue")).toBe(true);
    expect(elapsedMs).toBeLessThan(100);
  });

  it("recomputes a 1,000-appointment queue", () => {
    const { result, elapsedMs } = measured("1,000 appointment queue", () =>
      recomputeYardQueue(vehicles(1_000)),
    );
    expect(result).toHaveLength(1_000);
    expect(result[0].priorityScore).toBeGreaterThanOrEqual(result[999].priorityScore);
    expect(elapsedMs).toBeLessThan(250);
  });

  it("ranks 100 docks without assigning one", () => {
    const docks = Array.from({ length: 100 }, (_, index) => ({
      id: `dock-${index}`,
      compatible: index % 4 !== 0,
      available: index % 7 !== 0,
      queueImpact: index % 12,
      readiness: 100 - (index % 25),
    }));
    const before = structuredClone(docks);
    const { result, elapsedMs } = measured("100 dock recommendation", () => recommendDock(docks));
    expect(result.length).toBeGreaterThan(0);
    expect(docks).toEqual(before);
    expect(elapsedMs).toBeLessThan(100);
  });

  it("replays and transforms 10,000 loading scan events", () => {
    const events = Array.from({ length: 10_000 }, (_, index) => ({
      id: `scan-${index}`,
      sequence: 10_000 - index,
      occurredAt: new Date(Date.UTC(2026, 7, 10, 0, 0, 0, 10_000 - index)).toISOString(),
      units: 1,
    }));
    const { result, elapsedMs } = measured("10,000 loading scan replay", () =>
      transformYardReplay(events),
    );
    expect(result).toHaveLength(10_000);
    expect(result[0].sequence).toBe(1);
    expect(elapsedMs).toBeLessThan(500);
  });
});
