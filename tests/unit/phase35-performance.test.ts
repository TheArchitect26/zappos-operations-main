import { describe, expect, it } from "vitest";
import {
  conflictGroups,
  orderSyncItems,
  routePackState,
  stopProgress,
} from "@/lib/driver-experience";
describe("Phase 35 bounded performance contracts", () => {
  it("processes 20 and 100 stop routes within 100ms", () => {
    for (const count of [20, 100]) {
      const started = performance.now();
      const stops = Array.from({ length: count }, (_, index) => ({
        status: index === 0 ? "completed" : "planned",
      }));
      expect(stopProgress(stops).remaining).toBe(count - 1);
      expect(performance.now() - started).toBeLessThan(100);
    }
  });
  it("sorts 1000 GPS and 100 evidence queue records within 100ms", () => {
    const started = performance.now();
    const items = Array.from({ length: 1100 }, (_, index) => ({
      priority: index % 2 ? ("gps" as const) : ("photo" as const),
      createdAt: new Date(index).toISOString(),
    }));
    expect(orderSyncItems(items)).toHaveLength(1100);
    expect(performance.now() - started).toBeLessThan(100);
  });
  it("groups mixed reconnect conflicts within 100ms", () => {
    const started = performance.now();
    const conflicts = Array.from({ length: 100 }, (_, index) => ({
      conflictType: index % 2 ? "dispatch_changed" : "pod_already_submitted",
      createdAt: new Date(index).toISOString(),
    }));
    expect(conflictGroups(conflicts)).toHaveLength(100);
    expect(performance.now() - started).toBeLessThan(100);
  });
  it("parses route-pack metadata without claiming tiles", () => {
    const started = performance.now();
    expect(
      routePackState({
        downloadedBytes: 100,
        expectedBytes: 100,
        expiresAt: null,
        failed: false,
        superseded: false,
        queued: false,
      }),
    ).toBe("ready");
    expect(performance.now() - started).toBeLessThan(20);
  });
});
