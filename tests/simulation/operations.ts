import { SIMULATION_CLOCK, SIMULATION_COMPANY_ID } from "./company-fixture";

export const volumes = {
  shipments: 650,
  movements: 900,
  operationalEvents: 5400,
  telemetry: 27000,
  maintenance: 120,
  incidents: 60,
  supportCases: 120,
  receipts: 120,
  pickingTasks: 240,
  packingTasks: 180,
  loadingOperations: 120,
  purchaseRequests: 60,
  purchaseOrders: 36,
  expenseClaims: 120,
  invoiceDrafts: 110,
  issuedInvoiceMetadata: 82,
} as const;

export type SimulationRecord = {
  id: string;
  companyId: string;
  marker: "simulation";
  day: number;
  status: string;
};
export function records(
  kind: keyof typeof volumes,
  status = (i: number) => (i % 11 === 0 ? "exception" : "completed"),
): SimulationRecord[] {
  return Array.from({ length: volumes[kind] }, (_, i) => ({
    id: `sim-${kind}-${i + 1}`,
    companyId: SIMULATION_COMPANY_ID,
    marker: "simulation",
    day: i % 30,
    status: status(i),
  }));
}
export function telemetryPoints() {
  return Array.from({ length: volumes.telemetry }, (_, i) => ({
    id: `sim-telemetry-${i + 1}`,
    companyId: SIMULATION_COMPANY_ID,
    marker: "simulation" as const,
    deviceId: `sim-device-${String((i % 48) + 1).padStart(2, "0")}`,
    recordedAt: new Date(
      Date.parse(SIMULATION_CLOCK) + (i % 30) * 86400000 + i * 1000,
    ).toISOString(),
    sequence: i % 997 === 0 ? i - 2 : i,
    quality:
      i % 401 === 0
        ? "duplicate"
        : i % 307 === 0
          ? "out_of_order"
          : i % 251 === 0
            ? "stale"
            : i % 199 === 0
              ? "offline_recovery"
              : "accepted",
    latitude: -29.8587 + (i % 100) * 0.001,
    longitude: 31.0218 + (i % 100) * 0.001,
    source: "simulator" as const,
    eventBoundary: "phase22_event_bus" as const,
  }));
}
