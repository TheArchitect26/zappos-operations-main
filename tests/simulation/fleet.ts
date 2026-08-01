import { SIMULATION_COMPANY_ID } from "./company-fixture";

const composition = [
  ["articulated", 18],
  ["rigid", 10],
  ["refrigerated", 8],
  ["delivery_van", 6],
  ["bakkie", 4],
  ["forklift", 2],
  ["standby", 2],
] as const;
const states = [
  "available",
  "assigned",
  "in_transit",
  "loading",
  "unloading",
  "under_maintenance",
  "temporarily_unavailable",
  "compliance_restricted",
  "standby",
] as const;
const depots = ["Durban Head Office", "Johannesburg Depot", "Cape Town Depot", "Gqeberha Depot"];

export const vehicles = composition.flatMap(([vehicleClass, count]) =>
  Array.from({ length: count }, (_, offset) => {
    const n =
      composition
        .slice(
          0,
          composition.findIndex(([c]) => c === vehicleClass),
        )
        .reduce((s, [, c]) => s + c, 0) +
      offset +
      1;
    const roadVehicle = vehicleClass !== "forklift";
    return {
      id: `sim-vehicle-${String(n).padStart(2, "0")}`,
      companyId: SIMULATION_COMPANY_ID,
      marker: "simulation" as const,
      fleetNumber: `SIM-${String(n).padStart(3, "0")}`,
      registration: `SIM-${String(n).padStart(3, "0")}-ZA`,
      vin: `SIMULATIONVIN${String(n).padStart(4, "0")}`,
      vehicleClass,
      capacityKg: roadVehicle ? 1200 + n * 410 : 2500,
      odometerKm: roadVehicle ? 45000 + n * 1731 : 3000 + n * 20,
      depot: depots[n % depots.length],
      fuelType: vehicleClass === "forklift" ? "electric" : "diesel",
      serviceIntervalKm: 15000,
      complianceExpiry: n % 17 === 0 ? "2026-06-30" : "2027-06-30",
      insuranceExpiry: "2027-03-31",
      state: states[(n - 1) % states.length],
      maintenanceState: n % 13 === 0 ? "blocked" : "serviceable",
      deviceId: roadVehicle ? `sim-device-${String(n).padStart(2, "0")}` : null,
    };
  }),
);
