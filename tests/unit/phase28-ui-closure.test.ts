import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const dashboard = readFileSync(
  "src/components/fleet-intelligence/fleet-intelligence-dashboard.tsx",
  "utf8",
);
const command = readFileSync("src/routes/_authenticated/command-centre.tsx", "utf8");

describe("Phase 28 missing UI closure", () => {
  it("provides driver-own dispute submission without source mutation", () => {
    expect(dashboard).toContain("fleet_intelligence_feedback");
    expect(dashboard).toContain("Submit for human review");
    expect(dashboard).toContain("Source evidence was not changed");
    expect(dashboard).not.toContain('.from("driver_performance_assessments").update');
  });

  it("provides a persisted advisory Fleet Planning presentation", () => {
    expect(dashboard).toContain("fleet_planning_assessments");
    expect(dashboard).toContain('data-testid="fleet-planning"');
    expect(dashboard).toContain("Planning remains advisory");
  });

  it("renders complete Fleet Intelligence Command Centre card metadata", () => {
    for (const field of [
      "subject_type",
      "priority",
      "confidence",
      "evidence_count",
      "freshness",
      "domain",
      "owner",
      "status",
      "source_record_type",
      "source_record_id",
    ])
      expect(command).toContain(field);
    expect(command).not.toMatch(
      /Schedule maintenance|Suspend driver|Restrict vehicle|Change route/,
    );
  });
});
