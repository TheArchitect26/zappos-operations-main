import { describe, expect, it } from "vitest";
import {
  arrivalConfidence,
  batteryPolicy,
  conflictClass,
  downloadEligible,
  navigationAvailability,
  nextJobAction,
  offlineReady,
  orderSyncItems,
  podCompleteness,
  routePackState,
  safeDrivingMode,
  syncPriority,
  validateRoutePack,
  routePackTransition,
  queueSummary,
  photoEvidenceValid,
  scanScopeValid,
  documentStatus,
  runPersistedDriverJourney,
} from "@/lib/driver-experience";
describe("Phase 35 driver pure logic", () => {
  it("controls job sequence and blocked evidence", () => {
    expect(nextJobAction("assigned").next).toBe("accepted");
    expect(nextJobAction("service_completed", { hasPod: false }).allowed).toBe(false);
  });
  it("activates safe driving at configured threshold while preserving emergency policy", () => {
    expect(safeDrivingMode(10)).toBe("safe_driving");
    expect(safeDrivingMode(9)).toBe("normal");
  });
  it("keeps route-pack lifecycle truthful", () => {
    expect(
      routePackState({
        downloadedBytes: 0,
        expectedBytes: 100,
        expiresAt: null,
        failed: false,
        superseded: false,
        queued: false,
      }),
    ).toBe("not_downloaded");
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
  });
  it("enforces download rules", () => {
    expect(
      downloadEligible({
        wifi: false,
        wifiOnly: true,
        batteryPercent: 90,
        minimumBattery: 20,
        availableBytes: 100,
        expectedBytes: 10,
        mobileDataAllowed: true,
      }).allowed,
    ).toBe(false);
    expect(
      downloadEligible({
        wifi: true,
        wifiOnly: true,
        batteryPercent: 90,
        minimumBattery: 20,
        availableBytes: 100,
        expectedBytes: 10,
        mobileDataAllowed: true,
      }).allowed,
    ).toBe(true);
  });
  it("does not invent offline turn-by-turn", () => {
    expect(navigationAvailability(false).message).toContain("unavailable");
    expect(offlineReady({ routePack: "ready", hasStops: true, hasDestination: true })).toBe(true);
  });
  it("scores arrival and POD evidence", () => {
    expect(arrivalConfidence({ geofence: true, driverConfirmed: true, accuracyMetres: 10 })).toBe(
      "high",
    );
    expect(
      podCompleteness({
        recipient: "",
        outcome: "delivered",
        signature: false,
        photos: 0,
        gps: false,
      }).complete,
    ).toBe(false);
  });
  it("orders safety before evidence and analytics", () => {
    const items = [
      { priority: "analytics" as const, createdAt: "2024-01-01" },
      { priority: "safety" as const, createdAt: "2024-01-02" },
    ];
    expect(orderSyncItems(items)[0].priority).toBe("safety");
    expect(syncPriority("pod")).toBeLessThan(syncPriority("photo"));
  });
  it("classifies conflicts and battery policy", () => {
    expect(conflictClass("job_cancelled")).toBe("requires_review");
    expect(batteryPolicy(10).retainSafety).toBe(true);
  });
  it("validates route-pack persistence and transitions", () => {
    const pack = {
      companyId: "c",
      driverId: "d",
      version: 1,
      routeGeometry: [
        { latitude: 1, longitude: 1 },
        { latitude: 2, longitude: 2 },
      ],
      stops: [{ reference: "S1", address: "Depot" }],
      integrityHash: "abcdef12",
    };
    expect(validateRoutePack(pack).valid).toBe(true);
    expect(routePackTransition("queued", "download_started")).toBe("downloading");
  });
  it("keeps evidence, scan, documents and sync truthful", () => {
    expect(queueSummary([{ state: "queued" }, { state: "conflict" }]).allSynced).toBe(false);
    expect(
      photoEvidenceValid({ mimeType: "image/png", bytes: 10, checksum: "abcdef12" }).valid,
    ).toBe(true);
    expect(
      scanScopeValid({
        companyId: "c",
        expectedCompanyId: "c",
        jobId: "j",
        expectedJobId: "j",
        value: "S1",
      }),
    ).toBe(true);
    expect(documentStatus({ cached: false, expired: false, superseded: false })).toBe(
      "server_only",
    );
  });
  it("runs the complete persisted journey in owning-domain order", async () => {
    const calls: string[] = [];
    const gateway = {
      createRoutePack: async () => void calls.push("route-pack:create"),
      markRoutePackReady: async () => void calls.push("route-pack:ready"),
      transition: async (action: "accept" | "start" | "arrive") => void calls.push(`job:${action}`),
      recordInspection: async () => void calls.push("inspection"),
      queue: async (item: { id: string }) => void calls.push(`queue:${item.id}`),
      reconnect: async () => void calls.push("reconnect"),
      processQueue: async (items: readonly { id: string }[]) => {
        calls.push(`process:${items.map((item) => item.id).join(",")}`);
        return { acknowledged: items.map((item) => item.id), conflicts: [] };
      },
      submitPod: async () => void calls.push("pod:submit"),
      completeJob: async () => void calls.push("job:complete"),
    };
    const result = await runPersistedDriverJourney(
      gateway,
      {
        companyId: "company",
        driverId: "driver",
        version: 1,
        routeGeometry: [
          { latitude: 1, longitude: 1 },
          { latitude: 2, longitude: 2 },
        ],
        stops: [{ reference: "STOP-1", address: "Depot" }],
        integrityHash: "abcdef12",
      },
      [
        { id: "pod", priority: "pod", createdAt: "2024-01-03", state: "queued" },
        { id: "arrival", priority: "trip", createdAt: "2024-01-01", state: "queued" },
        { id: "delivery", priority: "trip", createdAt: "2024-01-02", state: "queued" },
      ],
    );
    expect(result.allSynced).toBe(true);
    expect(result.steps.at(-1)).toBe("job_completed");
    expect(calls).toContain("process:arrival,delivery,pod");
    expect(calls.at(-1)).toBe("job:complete");
  });
});
