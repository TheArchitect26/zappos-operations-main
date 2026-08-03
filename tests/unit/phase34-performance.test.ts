import { describe, expect, it } from "vitest";
import { replayFrames, shouldCluster } from "../../src/lib/live-tracking/phase34";
describe("Phase 34 bounded tracking performance", () => {
  for (const count of [5, 50, 250, 500])
    it(`processes ${count} viewport vehicles`, () => {
      const start = performance.now();
      expect(shouldCluster(count, 50)).toBe(count >= 50);
      const points = Array.from({ length: count }, (_, i) => ({
        latitude: -26 + i / 10000,
        longitude: 28 + i / 10000,
        deviceTimestamp: new Date(i * 1000).toISOString(),
        sequence: i,
      }));
      expect(replayFrames(points)).toHaveLength(count);
      expect(performance.now() - start).toBeLessThan(250);
    });
});
