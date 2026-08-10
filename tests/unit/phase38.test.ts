import { describe, expect, it } from "vitest";
import {
  appointmentActions,
  arrivingSoon,
  customerActions,
  customerAnalytics,
  customerPermission,
  customerSafeException,
  customerTrackingProjection,
  deliveryWindow,
  deriveCustomerMilestones,
  notificationEligible,
  podAvailability,
  safeDelayReason,
  sensitiveCargoVisibility,
  significantEtaChange,
  trackingLinkEligibility,
  validateFeedback,
} from "@/lib/customer-visibility/phase38";

describe("Phase 38 Customer Visibility 3.0 pure logic", () => {
  it("derives only relevant ordered milestones", () => {
    expect(
      deriveCustomerMilestones({
        status: "in_progress",
        warehousePreparing: true,
        vehicleAssigned: true,
        loading: true,
      }),
    ).toEqual([
      "booked",
      "confirmed",
      "warehouse_preparing",
      "vehicle_assigned",
      "loading",
      "departed",
      "in_transit",
    ]);
    expect(deriveCustomerMilestones({ status: "completed", podAvailable: true })).toContain(
      "pod_available",
    );
  });
  it("governs customer-safe delay language", () => {
    expect(safeDelayReason("dock_congestion_priority_resequence")).toBe(
      "Loading is taking longer than expected.",
    );
    expect(safeDelayReason("driver_hours_rest_required")).not.toMatch(/driver|rest/i);
    expect(safeDelayReason("unknown_internal_score")).not.toMatch(/score/i);
  });
  it("widens ETA windows as confidence drops", () => {
    const eta = "2026-08-10T14:30:00.000Z";
    const high = deliveryWindow({ eta, confidence: "high" });
    const low = deliveryWindow({ eta, confidence: "low" });
    expect(Date.parse(low.end!) - Date.parse(low.start!)).toBeGreaterThan(
      Date.parse(high.end!) - Date.parse(high.start!),
    );
    expect(deliveryWindow({ eta: null, confidence: "unavailable" }).start).toBeNull();
  });
  it("detects meaningful ETA changes without false precision", () => {
    expect(significantEtaChange("2026-08-10T14:00:00Z", "2026-08-10T14:13:00Z", 10)).toEqual({
      significant: true,
      changeMinutes: 13,
    });
    expect(
      significantEtaChange("2026-08-10T14:00:00Z", "2026-08-10T14:04:00Z", 10).significant,
    ).toBe(false);
  });
  it("classifies arriving soon by time or distance", () => {
    const now = Date.parse("2026-08-10T14:00:00Z");
    expect(
      arrivingSoon({ eta: "2026-08-10T14:25:00Z", now, thresholdMinutes: 30 }).arrivingSoon,
    ).toBe(true);
    expect(
      arrivingSoon({ eta: null, now, thresholdMinutes: 30, distanceKm: 4, distanceThresholdKm: 5 })
        .arrivingSoon,
    ).toBe(true);
  });
  it.each([
    "hidden",
    "milestone_only",
    "approximate_area",
    "exact_location",
    "delayed_location",
    "delivery_window_only",
  ] as const)("server-projects %s tracking", (mode) => {
    const projection = customerTrackingProjection({
      mode,
      latitude: -29.12345,
      longitude: 30.98765,
      generalArea: "Harrismith",
      observedAt: "2026-08-10T12:00:00Z",
      now: Date.parse("2026-08-10T14:00:00Z"),
      delayMinutes: 30,
    });
    if (["hidden", "milestone_only", "delivery_window_only"].includes(mode))
      expect(projection.latitude).toBeNull();
    if (mode === "approximate_area") expect(projection.latitude).toBe(-29.12);
    if (["exact_location", "delayed_location"].includes(mode))
      expect(projection.latitude).toBe(-29.12345);
  });
  it("withholds delayed tracking until the delay has elapsed", () => {
    expect(
      customerTrackingProjection({
        mode: "delayed_location",
        latitude: 1,
        longitude: 2,
        observedAt: "2026-08-10T13:50:00Z",
        now: Date.parse("2026-08-10T14:00:00Z"),
        delayMinutes: 30,
      }).latitude,
    ).toBeNull();
  });
  it("lets sensitive-cargo policy override preference", () => {
    expect(sensitiveCargoVisibility("exact_location", "high_value")).toBe("approximate_area");
    expect(sensitiveCargoVisibility("exact_location", "hidden_until_delivery")).toBe("hidden");
  });
  it("respects consent, quiet hours and provider readiness", () => {
    expect(
      notificationEligible({
        enabled: true,
        consent: true,
        configured: false,
        meaningful: true,
        quietHours: false,
        priority: false,
      }).state,
    ).toBe("provider_not_configured");
    expect(
      notificationEligible({
        enabled: true,
        consent: true,
        configured: true,
        meaningful: true,
        quietHours: true,
        priority: false,
      }).state,
    ).toBe("quiet_hours");
    expect(
      notificationEligible({
        enabled: true,
        consent: true,
        configured: true,
        meaningful: true,
        quietHours: true,
        priority: true,
      }).eligible,
    ).toBe(true);
  });
  it("derives the customer action centre", () => {
    expect(
      customerActions({
        appointmentNeedsConfirmation: true,
        requiredDocument: true,
        podAvailable: false,
      }),
    ).toEqual(["appointmentNeedsConfirmation", "requiredDocument"]);
  });
  it("sanitizes exception types and text", () => {
    const safe = customerSafeException({ type: "internal_security_hold", status: "open" });
    expect(safe.type).toBe("other");
    expect(safe.summary).not.toMatch(/security/i);
  });
  it("requires customer, branch, finalized and visible POD authority", () => {
    expect(
      podAvailability({
        sameCustomer: true,
        sameBranch: true,
        finalized: true,
        customerVisible: true,
      }),
    ).toBe(true);
    expect(
      podAvailability({
        sameCustomer: false,
        sameBranch: true,
        finalized: true,
        customerVisible: true,
      }),
    ).toBe(false);
  });
  it("keeps appointment schedule mutation controlled", () => {
    expect(appointmentActions({ status: "pending", changeAllowed: true })).toEqual({
      canConfirm: true,
      canRequestChange: true,
      directScheduleMutation: false,
    });
  });
  it("validates feedback without directly scoring drivers", () => {
    expect(validateFeedback({ rating: 5, completed: true }).valid).toBe(true);
    expect(validateFeedback({ rating: 6, completed: true }).errors).toContain(
      "rating_out_of_range",
    );
  });
  it("requires expiring, revocable, non-exact tracking-link foundations", () => {
    const now = Date.parse("2026-08-10T14:00:00Z");
    expect(
      trackingLinkEligibility({
        companyAllows: true,
        singleShipment: true,
        expiresAt: "2026-08-11T14:00:00Z",
        mode: "milestone_only",
        now,
      }),
    ).toBe(true);
    expect(
      trackingLinkEligibility({
        companyAllows: true,
        singleShipment: true,
        expiresAt: "2026-08-11T14:00:00Z",
        mode: "exact_location",
        now,
      }),
    ).toBe(false);
  });
  it("aggregates only the supplied customer records", () => {
    expect(
      customerAnalytics([
        { onTime: true, durationHours: 2, podAvailable: true },
        { onTime: false, durationHours: 4, delayed: true, support: true },
      ]),
    ).toMatchObject({ shipments: 2, onTimePercent: 50, averageDeliveryHours: 3 });
  });
  it("enforces manager and viewer boundaries", () => {
    expect(customerPermission("manager", "manage_team").allowed).toBe(true);
    expect(customerPermission("viewer", "manage_team").allowed).toBe(false);
    expect(customerPermission("viewer", "read").readOnly).toBe(true);
  });
});
