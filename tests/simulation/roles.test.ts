import { describe, expect, it } from "vitest";
import { authorise, roleAccess } from "./assertions";
describe("simulation role workspaces", () => {
  it("covers all required personas", () => {
    expect(Object.keys(roleAccess)).toHaveLength(25);
  });
  it("keeps sensitive modules separated", () => {
    expect(authorise("customer_care", "finance")).toBe(false);
    expect(authorise("driver", "fleet")).toBe(false);
    expect(authorise("warehouse_operator", "commercial")).toBe(false);
    expect(authorise("finance", "compliance")).toBe(false);
    expect(authorise("procurement", "hr")).toBe(false);
    expect(authorise("viewer", "operations")).toBe(false);
  });
  it("gives controllers the operational surface without administration", () => {
    for (const module of ["operations", "fleet", "tracking", "incidents", "brain"])
      expect(authorise("fleet_controller", module)).toBe(true);
    expect(authorise("fleet_controller", "administration")).toBe(false);
  });
  it("gives customer care customer-safe tasks, not margin", () => {
    for (const module of ["crm", "shipments", "pod", "support"])
      expect(authorise("customer_care", module)).toBe(true);
    expect(authorise("customer_care", "finance")).toBe(false);
  });
});
