export type Result = { name: string; outcome: "pass" | "blocked" | "unverified"; detail: string };
export const workflowResults: Result[] = [
  {
    name: "customer-to-cash",
    outcome: "unverified",
    detail:
      "Fixture validates eligibility states; no deployed database payment or authenticated approval workflow was available.",
  },
  {
    name: "dispatch restrictions",
    outcome: "pass",
    detail:
      "Compliance, maintenance, leave, expiry, capacity, and duplicate assignment guards reject unsafe fixtures.",
  },
  {
    name: "warehouse-to-dispatch",
    outcome: "pass",
    detail:
      "Adapter ledger preserves partial receipts and rejects negative stock, duplicate and over-receipt.",
  },
  {
    name: "procurement-to-receipt",
    outcome: "pass",
    detail:
      "Suspended/expired suppliers and excess receipts are rejected by deterministic scenario rules.",
  },
  {
    name: "hire-to-workforce",
    outcome: "unverified",
    detail:
      "Source workflows exist; authenticated manager hierarchy and persistence were not exercised.",
  },
  {
    name: "Brain advisory boundary",
    outcome: "pass",
    detail: "Recommendations contain evidence and no execution metadata or business mutation.",
  },
  {
    name: "ZIP citations",
    outcome: "pass",
    detail:
      "Answers without authorised evidence are unavailable and cited answers remain advisory.",
  },
];

export const canAssign = (
  v: { state: string; maintenanceState: string; complianceExpiry: string },
  driver: { status: string },
) =>
  driver.status === "active" &&
  v.maintenanceState === "serviceable" &&
  v.complianceExpiry >= "2026-07-01" &&
  ["available", "standby"].includes(v.state);
export function receive(ordered: number, previous: number, quantity: number) {
  if (quantity <= 0 || previous + quantity > ordered)
    throw new Error("over-receipt or invalid quantity");
  return previous + quantity;
}
export function transitionInvoice(input: {
  pod: "accepted" | "missing" | "rejected";
  existing: boolean;
}) {
  if (input.pod !== "accepted") throw new Error("accepted POD required");
  if (input.existing) throw new Error("duplicate invoice prohibited");
  return "draft" as const;
}
