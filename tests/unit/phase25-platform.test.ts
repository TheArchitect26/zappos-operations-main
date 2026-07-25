import { describe, expect, it } from "vitest";
import {
  applyTwinDelta,
  calculateDeviceHealth,
  edgeActionDecision,
  firmwareRolloutDecision,
  predictiveOperationsAdvisory,
  provisioningDecision,
  validateTelemetryEnvelope,
  ZAPP_BOX_P1_CAPABILITIES,
} from "@/lib/platform";

describe("Phase 25 Zapp Platform core", () => {
  it("declares the Zapp Box P1 production-hardware capability contract", () => {
    expect(ZAPP_BOX_P1_CAPABILITIES).toEqual(
      expect.arrayContaining(["gps", "ignition", "ota", "offline_buffering", "obd_ii", "j1939"]),
    );
  });

  it("requires verified identity, certificate reference, a token hash, and human approval before provisioning", () => {
    expect(
      provisioningDecision({
        deviceStatus: "inventory",
        identityVerified: true,
        certificateReference: "vault:certificate/zapp-box-1",
        provisioningTokenHash: "hashed-token",
        approvedByHuman: true,
      }).allowed,
    ).toBe(true);
    expect(
      provisioningDecision({
        deviceStatus: "inventory",
        identityVerified: false,
        certificateReference: null,
        provisioningTokenHash: null,
        approvedByHuman: false,
      }).allowed,
    ).toBe(false);
  });

  it("validates telemetry identity, sequence, schema and restricted fields", () => {
    const envelope = {
      eventId: "event-1",
      deviceId: "device-1",
      companyId: "company-1",
      transport: "mqtt" as const,
      observedAt: "2026-07-25T08:00:00.000Z",
      sequence: 1,
      schemaVersion: 1,
      payload: { ignition: true, battery_percent: 80 },
      compressed: true,
      delta: true,
      offlineBuffered: false,
    };
    const valid = validateTelemetryEnvelope(envelope);
    expect(valid.valid).toBe(true);
    const blocked = validateTelemetryEnvelope({
      ...envelope,
      eventId: "event-2",
      transport: "https",
      sequence: -1,
      payload: { medical_record: "no" },
      compressed: false,
      delta: false,
      offlineBuffered: false,
    });
    expect(blocked.valid).toBe(false);
  });

  it("never starts an unsigned or unapproved firmware rollout", () => {
    expect(
      firmwareRolloutDecision({
        firmwareStatus: "approved",
        rolloutStatus: "scheduled",
        signatureReference: "kms:firmware/zapp-box-p1",
        targetDeviceCount: 5,
        approvedByHuman: true,
      }).allowed,
    ).toBe(true);
    expect(
      firmwareRolloutDecision({
        firmwareStatus: "draft",
        rolloutStatus: "draft",
        signatureReference: null,
        targetDeviceCount: 0,
        approvedByHuman: false,
      }).allowed,
    ).toBe(false);
  });

  it("applies only allow-listed nonrestricted twin deltas and keeps predictions advisory", () => {
    const delta = applyTwinDelta({
      current: { ignition: false },
      delta: { ignition: true, secret: "blocked" },
      allowedKeys: ["ignition"],
    });
    expect(delta.next).toEqual({ ignition: true });
    expect(delta.rejected).toContain("secret");
    const advisory = predictiveOperationsAdvisory({
      signal: "battery",
      evidenceCount: 2,
      confidence: 80,
      freshness: "live",
    });
    expect(advisory.advisoryOnly).toBe(true);
    expect(advisory.requiresHumanApproval).toBe(true);
  });

  it("uses health as an advisory signal and rejects autonomous edge business actions", () => {
    expect(
      calculateDeviceHealth({
        lastTelemetryAt: null,
        now: "2026-07-25T08:00:00.000Z",
        batteryPercent: 10,
        signalPercent: 10,
        faultCount: 2,
      }).state,
    ).toBe("offline");
    expect(
      edgeActionDecision({
        operation: "dispatch vehicle",
        online: false,
        cachedRecommendation: true,
      }).allowed,
    ).toBe(false);
    expect(
      edgeActionDecision({
        operation: "compress telemetry",
        online: false,
        cachedRecommendation: true,
      }).allowed,
    ).toBe(true);
  });
});
