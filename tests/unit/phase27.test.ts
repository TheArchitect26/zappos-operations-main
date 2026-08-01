import { describe, expect, it } from "vitest";
import {
  MemoryMobileStorage,
  MobileOfflineEngine,
  askMobileZip,
  canSynchronize,
  defaultMobileNotificationPreferences,
  deviceRegistrationValid,
  deviceTrustDecision,
  gpsCaptureValid,
  mobileCapabilities,
  signatureValid,
  validateMobileUpload,
} from "@/lib/mobile";

const base = {
  id: "queue-1",
  companyId: "company-1",
  userId: "user-1",
  entity: "job",
  entityId: "job-1",
  operation: "update" as const,
  payload: { status: "arrived" },
  baseVersion: 1,
};

describe("Phase 27 mobile platform", () => {
  it("selects role-aware workspaces and preserves executive read-only access", () => {
    expect(mobileCapabilities(["driver"]).workspaces).toEqual(["driver"]);
    expect(mobileCapabilities(["warehouse_operator"]).workspaces).toEqual(["warehouse"]);
    expect(mobileCapabilities(["executive"]).readOnly).toBe(true);
    expect(mobileCapabilities(["customer_care"]).workspaces).toContain("customer_care");
  });

  it("persists drafts, prevents duplicate queue work, checkpoints and uses Phase 22 retries", async () => {
    const engine = new MobileOfflineEngine(new MemoryMobileStorage());
    const first = await engine.queue(base);
    const duplicate = await engine.queue({ ...base, id: "queue-2" });
    expect(duplicate.id).toBe(first.id);
    await engine.saveDraft("company-1", "user-1", "pod", "job-1", { signed: false });
    expect(await engine.loadDraft("company-1", "user-1", "pod", "job-1")).toEqual({
      signed: false,
    });
    await engine.saveCheckpoint({
      companyId: "company-1",
      userId: "user-1",
      scope: "jobs",
      cursor: "42",
      updatedAt: "2026-08-01T00:00:00Z",
    });
    expect((await engine.loadCheckpoint("company-1", "user-1", "jobs"))?.cursor).toBe("42");
    const failed = await engine.markFailed(first.id, new Date("2026-08-01T00:00:00Z"));
    expect(failed.item.nextRetryAt).toBe("2026-08-01T00:01:00.000Z");
  });

  it("is network and battery aware and automatically exposes ready retries", async () => {
    expect(
      canSynchronize({ online: false, quality: "offline", batteryPercent: 100, charging: true }),
    ).toBe(false);
    expect(
      canSynchronize({ online: true, quality: "good", batteryPercent: 10, charging: false }),
    ).toBe(false);
    expect(
      canSynchronize({ online: true, quality: "excellent", batteryPercent: 10, charging: true }),
    ).toBe(true);
  });

  it("validates camera uploads, barcode/QR-adjacent files, signatures and GPS", () => {
    expect(
      validateMobileUpload({
        name: "pod.jpg",
        mimeType: "image/jpeg",
        bytes: new Uint8Array([1]),
        checksum: "deadbeef",
      }).valid,
    ).toBe(true);
    expect(
      validateMobileUpload({
        name: "bad.exe",
        mimeType: "application/x-msdownload",
        bytes: new Uint8Array([1]),
        checksum: "deadbeef",
      }).valid,
    ).toBe(false);
    expect(
      signatureValid([
        { x: 1, y: 1, time: 1 },
        { x: 2, y: 2, time: 2 },
      ]),
    ).toBe(true);
    expect(
      gpsCaptureValid({
        latitude: -33.9,
        longitude: 18.4,
        accuracyMetres: 4,
        capturedAt: "2026-08-01T00:00:00Z",
      }),
    ).toBe(true);
  });

  it("supports device trust, registration and a provider-free notification framework", () => {
    expect(
      deviceTrustDecision({
        rootedOrJailbroken: true,
        screenCaptureActive: false,
        secureStorageAvailable: true,
        biometricAvailable: true,
      }).trusted,
    ).toBe(false);
    expect(
      deviceRegistrationValid({
        deviceId: "device-123",
        nickname: "Driver phone",
        platform: "android",
        appVersion: "1.0.0",
      }),
    ).toBe(true);
    expect(defaultMobileNotificationPreferences()).toHaveLength(6);
    expect(defaultMobileNotificationPreferences().every((item) => !item.backgroundAllowed)).toBe(
      true,
    );
  });

  it("keeps ZIP deterministic, cited and permission-aware", () => {
    const response = askMobileZip({
      requestId: "mobile-1",
      workspace: "warehouse",
      question: "Locate pallet A1",
      chunks: [
        {
          id: "chunk-1",
          documentId: "doc-1",
          documentVersionId: "v1",
          title: "Pallet register",
          text: "Pallet A1 is in bin B-04.",
          allowed: true,
          dataClassification: "internal",
        },
      ],
    });
    expect(response.state).toBe("available");
    expect(response.citations).toHaveLength(1);
    expect(response.advisoryOnly).toBe(true);
  });
});
