import { describe, expect, it } from "vitest";
import { fleetIntelligenceTrend } from "@/lib/fleet-intelligence";

describe("Phase 28 persisted BI trends", () => {
  it("builds trends only from persisted assessment points", () => {
    const result = fleetIntelligenceTrend(
      [
        {
          metricCode: "fleet_utilisation_rate",
          calculatedAt: "2026-07-01T00:00:00Z",
          value: 65,
          quality: "high",
          sourceCount: 20,
        },
        {
          metricCode: "fleet_utilisation_rate",
          calculatedAt: "2026-08-01T00:00:00Z",
          value: 72,
          quality: "high",
          sourceCount: 22,
        },
      ],
      "fleet_utilisation_rate",
    );
    expect(result).toMatchObject({
      state: "available",
      change: 7,
      sourceCount: 42,
      persistedOnly: true,
    });
  });

  it("returns unavailable rather than fabricating a trend", () => {
    expect(fleetIntelligenceTrend([], "fuel_efficiency")).toMatchObject({
      state: "unavailable",
      change: null,
    });
  });
});
