import { describe, expect, it } from "vitest";
import {
  eventValid,
  exportTransition,
  healthStatus,
  importValid,
  integrationCapabilities,
  mappingValid,
  retryPlan,
  syncTransition,
  webhookTransition,
} from "@/lib/integrations/phase22";
describe("Phase 22 integration platform", () => {
  it("enforces webhook, sync and export lifecycles", () => {
    expect(webhookTransition("queued", "delivering")).toBe("delivering");
    expect(() => webhookTransition("succeeded", "queued")).toThrow();
    expect(syncTransition("running", "succeeded")).toBe("succeeded");
    expect(exportTransition("requested", "running")).toBe("running");
  });
  it("uses finite deterministic retries and DLQ exhaustion", () => {
    expect(retryPlan(1, 3, new Date("2026-01-01")).delaySeconds).toBe(60);
    expect(retryPlan(3, 3).status).toBe("exhausted");
  });
  it("validates health, mappings, imports, events and permissions", () => {
    expect(healthStatus({ rateLimitExceeded: true })).toBe("critical");
    expect(
      mappingValid({
        sourceField: "id",
        destinationField: "external_id",
        transform: "direct",
        required: true,
      }),
    ).toBe(true);
    expect(importValid("customers", "csv")).toBe(true);
    expect(importValid("medical", "csv")).toBe(false);
    expect(eventValid("warehouse", "receipt", "abc")).toBe(true);
    expect(integrationCapabilities(["viewer"]).canManage).toBe(false);
    expect(integrationCapabilities(["driver"]).canRead).toBe(false);
  });
});
