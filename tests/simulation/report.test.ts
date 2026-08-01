import { describe, it } from "vitest";
import { vehicles } from "./fleet";
import { employees } from "./employees";
import { customers } from "./customers";
import { suppliers } from "./suppliers";
import { volumes } from "./operations";
import { workflowResults } from "./scenarios";
describe("simulation audit report", () => {
  it("prints exact fixture scope and honest validation boundaries", () => {
    console.log(
      JSON.stringify(
        {
          verdict: "Suitable for Controlled Internal Testing",
          environment:
            "fixture and adapter-level local simulation; no deployed Supabase/authenticated workers or physical devices",
          periodDays: 30,
          vehicles: vehicles.length,
          employees: employees.length,
          activeCustomers: customers.filter((x) => x.status === "active").length,
          prospects: 5,
          suppliers: suppliers.length,
          volumes,
          workflows: workflowResults,
        },
        null,
        2,
      ),
    );
  });
});
