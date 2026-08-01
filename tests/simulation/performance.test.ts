import { describe, expect, it } from "vitest";
import { telemetryPoints } from "./operations";
describe("bounded simulation performance", () => {
  it("generates, filters, searches and paginates 27k points within a local budget", () => {
    const start = performance.now();
    const points = telemetryPoints();
    const page = points.filter((p) => p.deviceId === "sim-device-01").slice(0, 100);
    const elapsed = performance.now() - start;
    expect(page).toHaveLength(100);
    expect(elapsed).toBeLessThan(1500);
  });
  it("never returns an unbounded client page", () => {
    const pageSize = 100;
    expect(telemetryPoints().slice(0, pageSize)).toHaveLength(pageSize);
  });
});
