import { SIMULATION_COMPANY_ID } from "./company-fixture";
const categories = [
  "fuel",
  "tyres",
  "vehicle_parts",
  "ppe",
  "warehouse_equipment",
  "it_equipment",
  "maintenance_services",
];
export const suppliers = Array.from({ length: 10 }, (_, i) => ({
  id: `sim-supplier-${i + 1}`,
  companyId: SIMULATION_COMPANY_ID,
  marker: "simulation" as const,
  name: `Simulation Supplier ${i + 1}`,
  category: categories[i % categories.length],
  status: i === 8 ? "suspended" : "active",
  compliance: i === 9 ? "expired" : "valid",
}));
export const subcontractors = Array.from({ length: 3 }, (_, i) => ({
  id: `sim-subcontractor-${i + 1}`,
  companyId: SIMULATION_COMPANY_ID,
  marker: "simulation" as const,
  name: `Simulation Transporter ${i + 1}`,
}));
