import { describe, it, expect } from "vitest";
import {
  transitionSupplier,
  transitionOrder,
  receiveOrder,
  supplierPerformance,
  procurementCapabilities,
} from "@/lib/procurement/phase20";
describe("Phase 20 procurement", () => {
  it("enforces supplier onboarding", () => {
    expect(transitionSupplier("prospective", "application_submitted")).toBe(
      "application_submitted",
    );
    expect(() => transitionSupplier("prospective", "active")).toThrow("Illegal");
  });
  it("enforces PO workflow and receiving", () => {
    expect(transitionOrder("approved", "ordered")).toBe("ordered");
    expect(receiveOrder(10, 4)).toBe("partially_received");
    expect(() => receiveOrder(10, 11)).toThrow("Invalid");
  });
  it("calculates supplier performance and permissions", () => {
    expect(
      supplierPerformance({ ordered: 10, onTime: 8, accepted: 9, responseHours: 4, leadDays: 3 })
        .onTimeDelivery,
    ).toBe(80);
    expect(procurementCapabilities(["warehouse_manager"]).canReceive).toBe(true);
    expect(procurementCapabilities(["driver"]).canRead).toBe(false);
  });
});
