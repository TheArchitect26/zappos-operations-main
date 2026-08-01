export const SIMULATION_SEED = 20260701;
export const SIMULATION_CLOCK = "2026-07-01T04:00:00.000Z";
export const SIMULATION_COMPANY_ID = "00000000-0000-4000-8000-000000000050";

export const simulationCompany = {
  id: SIMULATION_COMPANY_ID,
  name: "Zapp Logistics Simulation (Pty) Ltd",
  marker: "simulation" as const,
  branches: ["Durban Head Office", "Johannesburg Depot", "Cape Town Depot", "Gqeberha Depot"],
  warehouses: [
    "Durban Distribution Centre",
    "Johannesburg Cross-Dock",
    "Cape Town Regional Warehouse",
  ],
  routes: [
    ["Durban", "Johannesburg", 568],
    ["Johannesburg", "Durban", 568],
    ["Durban", "Cape Town", 1635],
    ["Johannesburg", "Cape Town", 1402],
    ["Durban", "Gqeberha", 912],
    ["Gqeberha", "Cape Town", 748],
    ["Local Durban", "Local Durban", 85],
    ["Local Johannesburg", "Local Johannesburg", 95],
  ] as const,
};

export function assertSimulationSeedGuard(env = process.env) {
  if (env.NODE_ENV === "production") throw new Error("Simulation seed is forbidden in production");
  if (env.ZAPPOS_ENABLE_SIMULATION_SEED !== "true")
    throw new Error("Set ZAPPOS_ENABLE_SIMULATION_SEED=true explicitly");
}
