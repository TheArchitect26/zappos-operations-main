import { describe, expect, it } from "vitest";
import {
  actionAllowed,
  brainConnectBoundary,
  canAccessThread,
  canMention,
  classifyRetry,
  conditionsPass,
  deliveryTransition,
  detectsLoop,
  duplicateKey,
  escalationPriority,
  evaluatePreference,
  generateDryRun,
  handoverCompleteness,
  renderTemplate,
  resolveRecipients,
  triggerMatches,
  validateVariables,
  withinRateLimit,
  zipConnectBoundary,
} from "../../src/lib/connect/phase30";

describe("Phase 30 Zapp Connect pure logic", () => {
  const internal = {
    id: "u1",
    companyId: "c1",
    kind: "user" as const,
    roles: ["dispatcher"],
    teams: ["dispatch"],
    branchId: "b1",
  };
  it("resolves same-company user, role, team and branch mentions", () => {
    const candidates = [internal, { ...internal, id: "u2", companyId: "c2" }];
    expect(resolveRecipients({ kind: "role", id: "dispatcher" }, candidates, "c1")).toEqual([
      internal,
    ]);
    expect(resolveRecipients({ kind: "team", id: "dispatch" }, candidates, "c1")).toEqual([
      internal,
    ]);
    expect(resolveRecipients({ kind: "branch", id: "b1" }, candidates, "c1")).toEqual([internal]);
  });
  it("enforces participant and company thread permissions", () => {
    expect(
      canAccessThread({
        actorCompanyId: "c1",
        threadCompanyId: "c1",
        actorId: "u1",
        participantIds: ["u1"],
        visibility: "internal",
        actorKind: "internal",
      }),
    ).toEqual({ canRead: true, canWrite: true });
    expect(
      canAccessThread({
        actorCompanyId: "c2",
        threadCompanyId: "c1",
        actorId: "u1",
        participantIds: ["u1"],
        visibility: "internal",
        actorKind: "internal",
      }).canRead,
    ).toBe(false);
  });
  it("isolates customer and supplier visibility", () => {
    expect(
      canAccessThread({
        actorCompanyId: "c1",
        threadCompanyId: "c1",
        actorId: "customer",
        participantIds: ["customer"],
        visibility: "internal",
        actorKind: "customer",
      }).canRead,
    ).toBe(false);
    expect(
      canAccessThread({
        actorCompanyId: "c1",
        threadCompanyId: "c1",
        actorId: "supplier",
        participantIds: ["supplier"],
        visibility: "supplier",
        actorKind: "supplier",
      }).canRead,
    ).toBe(true);
  });
  it("prevents external users mentioning hidden internal identities", () => {
    const customer = { id: "customer", companyId: "c1", kind: "customer" as const };
    expect(canMention(customer, internal, [])).toBe(false);
    expect(canMention(customer, internal, ["u1"])).toBe(true);
    expect(canMention(internal, { ...internal, visible: false }, ["u1"])).toBe(false);
  });
  it("honours consent, opt-out, marketing and quiet hours", () => {
    expect(
      evaluatePreference({
        preference: { enabled: true, marketingConsent: false },
        messageKind: "marketing",
        localHour: 12,
      }).reason,
    ).toBe("marketing_consent_required");
    expect(
      evaluatePreference({
        preference: { enabled: true, quietStart: 22, quietEnd: 6 },
        messageKind: "transactional",
        localHour: 23,
      }).reason,
    ).toBe("quiet_hours");
    expect(
      evaluatePreference({
        preference: { enabled: true, quietStart: 22, quietEnd: 6 },
        messageKind: "transactional",
        localHour: 23,
        emergencyOverride: true,
      }).allowed,
    ).toBe(true);
  });
  it("validates and renders governed template variables", () => {
    expect(validateVariables("Hi {{name}}, job {{job.id}}", { name: "A" }).missing).toEqual([
      "job.id",
    ]);
    expect(renderTemplate("Hi {{name}}", { name: "A" })).toBe("Hi A");
    expect(() => renderTemplate("{{missing}}", {})).toThrow();
  });
  it("requires provider confirmation for delivery truth", () => {
    expect(deliveryTransition("draft", "queued")).toBe("queued");
    expect(() => deliveryTransition("sent", "delivered")).toThrow("Provider confirmation");
    expect(deliveryTransition("sent", "delivered", true)).toBe("delivered");
    expect(() => deliveryTransition("queued", "read", true)).toThrow("Illegal");
  });
  it("classifies retries into the existing Phase 22 queue and DLQ", () => {
    expect(classifyRetry("timeout", 1, 3).destination).toBe("phase22_retry_queue");
    expect(classifyRetry("timeout", 3, 3).destination).toBe("phase22_dlq");
    expect(classifyRetry("opted_out", 1, 3).retryable).toBe(false);
  });
  it("suppresses duplicates deterministically", () => {
    expect(
      duplicateKey({
        companyId: "c",
        channel: "sms",
        recipientId: "r",
        templateVersionId: "v",
        relatedId: "j",
      }),
    ).toBe(
      duplicateKey({
        companyId: "c",
        channel: "sms",
        recipientId: "r",
        templateVersionId: "v",
        relatedId: "j",
      }),
    );
  });
  it("enforces rate limits by time window", () => {
    expect(withinRateLimit([50, 80], 100, 60, 2)).toEqual({
      allowed: false,
      used: 2,
      remaining: 0,
    });
    expect(withinRateLimit([1], 100, 60, 2).allowed).toBe(true);
  });
  it("prioritises severity and SLA age", () =>
    expect(escalationPriority("critical", 60, 60)).toBeGreaterThan(
      escalationPriority("high", 60, 60),
    ));
  it("requires complete handovers", () => {
    expect(
      handoverCompleteness([
        { required: true, complete: true },
        { required: true, complete: false },
      ]),
    ).toEqual({ complete: false, percentage: 50 });
    expect(handoverCompleteness([])).toEqual({ complete: true, percentage: 100 });
  });
  it("matches Phase 22 triggers and conditions deterministically", () => {
    expect(
      triggerMatches(
        { event: "shipment.delayed", company: "c" },
        { event: "shipment.delayed", company: "c", delay: 20 },
      ),
    ).toBe(true);
    expect(conditionsPass([{ field: "delay", operator: "gt", value: 10 }], { delay: 20 })).toBe(
      true,
    );
  });
  it("allows only human-gated coordination actions", () => {
    expect(actionAllowed("create_task")).toBe(true);
    for (const prohibited of [
      "dispatch_vehicle",
      "change_route",
      "suspend_driver",
      "approve_payment",
      "terminate_employee",
      "close_incident",
    ])
      expect(actionAllowed(prohibited)).toBe(false);
  });
  it("detects self-triggering and excessive-depth loops", () => {
    expect(detectsLoop(["a"], "a")).toBe(true);
    expect(detectsLoop(["a", "b", "c", "d", "e"], "f")).toBe(true);
    expect(detectsLoop(["a"], "b")).toBe(false);
  });
  it("generates non-mutating dry runs and reports safety failures", () => {
    const result = generateDryRun({
      triggerMatched: true,
      conditionsPassed: true,
      actions: ["create_task", "approve_payment"],
      recordIds: ["r"],
    });
    expect(result.actionsThatWouldOccur).toEqual(["create_task"]);
    expect(result.safetyFailures).toContain("Prohibited action: approve_payment");
    expect(result).toMatchObject({ mutated: false, sent: false });
  });
  it("keeps ZIP read-only and Brain advisory", () => {
    expect(zipConnectBoundary()).toMatchObject({ canSend: false, canMutate: false });
    expect(brainConnectBoundary()).toMatchObject({
      advisory: true,
      canSend: false,
      canEscalate: false,
      canMutate: false,
    });
  });
});
