import { describe, expect, it } from "vitest";
import {
  assertSimulationSeedGuard,
  simulationCompany,
  SIMULATION_COMPANY_ID,
} from "./company-fixture";
import { vehicles } from "./fleet";
import { employees, roleCounts } from "./employees";
import { customers } from "./customers";
import { suppliers, subcontractors } from "./suppliers";
import { records, telemetryPoints, volumes } from "./operations";
import { canAssign, receive, transitionInvoice } from "./scenarios";
describe("30-day 50-vehicle deterministic operational simulation", () => {
  it("requires an explicit non-production seed guard", () => {
    expect(() =>
      assertSimulationSeedGuard({
        NODE_ENV: "test",
        ZAPPOS_ENABLE_SIMULATION_SEED: "false",
      } as NodeJS.ProcessEnv),
    ).toThrow();
    expect(() =>
      assertSimulationSeedGuard({
        NODE_ENV: "production",
        ZAPPOS_ENABLE_SIMULATION_SEED: "true",
      } as NodeJS.ProcessEnv),
    ).toThrow();
    expect(() =>
      assertSimulationSeedGuard({
        NODE_ENV: "test",
        ZAPPOS_ENABLE_SIMULATION_SEED: "true",
      } as NodeJS.ProcessEnv),
    ).not.toThrow();
  });
  it("creates the requested marked structure and exact fleet", () => {
    expect(simulationCompany.branches).toHaveLength(4);
    expect(simulationCompany.warehouses).toHaveLength(3);
    expect(vehicles).toHaveLength(50);
    expect(
      vehicles.every((x) => x.marker === "simulation" && x.companyId === SIMULATION_COMPANY_ID),
    ).toBe(true);
    const counts = vehicles.reduce<Record<string, number>>(
      (a, v) => ((a[v.vehicleClass] = (a[v.vehicleClass] ?? 0) + 1), a),
      {},
    );
    expect(counts).toMatchObject({
      articulated: 18,
      rigid: 10,
      refrigerated: 8,
      delivery_van: 6,
      bakkie: 4,
      forklift: 2,
      standby: 2,
    });
  });
  it("creates full fictional workforce and trading parties", () => {
    expect(roleCounts.driver).toBe(60);
    expect(employees.length).toBeGreaterThan(100);
    expect(employees.every((e) => e.email.endsWith(".invalid"))).toBe(true);
    expect(customers.filter((c) => c.status === "active")).toHaveLength(15);
    expect(customers.filter((c) => c.status === "prospect")).toHaveLength(5);
    expect(suppliers).toHaveLength(10);
    expect(subcontractors).toHaveLength(3);
  });
  it("generates bounded marked volumes", () => {
    expect(records("shipments")).toHaveLength(volumes.shipments);
    const points = telemetryPoints();
    expect(points).toHaveLength(27000);
    expect(
      points.every((p) => p.source === "simulator" && p.eventBoundary === "phase22_event_bus"),
    ).toBe(true);
  });
  it("blocks unsafe dispatch, stock and invoicing", () => {
    expect(canAssign(vehicles[0], employees.find((e) => e.role === "driver")!)).toBe(true);
    expect(
      canAssign(
        vehicles.find((v) => v.maintenanceState === "blocked")!,
        employees.find((e) => e.role === "driver")!,
      ),
    ).toBe(false);
    expect(receive(10, 3, 4)).toBe(7);
    expect(() => receive(10, 8, 3)).toThrow(/over-receipt/);
    expect(transitionInvoice({ pod: "accepted", existing: false })).toBe("draft");
    expect(() => transitionInvoice({ pod: "missing", existing: false })).toThrow();
    expect(() => transitionInvoice({ pod: "accepted", existing: true })).toThrow(/duplicate/);
  });
});
