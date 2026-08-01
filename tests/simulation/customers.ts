import { SIMULATION_COMPANY_ID } from "./company-fixture";
const types = [
  "retail",
  "manufacturing",
  "agriculture",
  "fmcg",
  "mining_supply",
  "medical_distribution",
  "e-commerce",
  "construction",
  "general_freight",
];
export const customers = Array.from({ length: 20 }, (_, i) => ({
  id: `sim-customer-${i + 1}`,
  companyId: SIMULATION_COMPANY_ID,
  marker: "simulation" as const,
  name: `Simulation Customer ${i + 1}`,
  type: types[i % types.length],
  status: i < 15 ? "active" : "prospect",
  contact: `contact.${i + 1}@simulation.invalid`,
}));
