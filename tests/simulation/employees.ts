import { SIMULATION_COMPANY_ID } from "./company-fixture";

export const roleCounts = {
  executive: 1,
  admin: 1,
  system_admin: 1,
  bi_analyst: 1,
  operations_manager: 1,
  fleet_controller: 4,
  dispatcher: 4,
  shift_supervisor: 2,
  customer_care: 4,
  fleet_manager: 1,
  workshop_manager: 1,
  mechanic: 4,
  maintenance_coordinator: 2,
  field_technician: 2,
  driver: 60,
  warehouse_manager: 3,
  warehouse_supervisor: 3,
  receiving_clerk: 4,
  inventory_controller: 3,
  picker: 6,
  packer: 5,
  forklift_operator: 4,
  loading_staff: 6,
  hr_manager: 1,
  hr_officer: 1,
  commercial_manager: 1,
  finance_manager: 1,
  finance_officer: 1,
  crm_manager: 1,
  sales_representative: 3,
  customer_success_manager: 1,
  compliance_manager: 1,
  safety_officer: 1,
  quality_manager: 1,
  procurement_manager: 1,
  procurement_officer: 1,
  integration_manager: 1,
  brain_administrator: 1,
  brain_analyst: 1,
  brain_reviewer: 1,
} as const;

export const employees = Object.entries(roleCounts).flatMap(([role, count]) =>
  Array.from({ length: count }, (_, i) => ({
    id: `sim-employee-${role}-${i + 1}`,
    companyId: SIMULATION_COMPANY_ID,
    marker: "simulation" as const,
    role,
    name: `Simulation ${role.replaceAll("_", " ")} ${i + 1}`,
    email: `${role}.${i + 1}@simulation.invalid`,
    status:
      role === "driver" && i === 57
        ? "leave"
        : role === "driver" && i === 58
          ? "training"
          : "active",
  })),
);
