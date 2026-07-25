import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20260720050000_phase21_security_completion.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("Phase 21 BI database security migration", () => {
  it("defines database policies for every BI persistence table", () => {
    [
      "bi_kpi_definitions",
      "bi_kpi_targets",
      "bi_kpi_snapshots",
      "bi_report_datasets",
      "bi_saved_reports",
      "bi_report_schedules",
      "bi_report_commentary",
      "bi_dashboard_layouts",
      "bi_dashboard_widgets",
      "bi_scorecards",
      "bi_scorecard_items",
      "bi_data_quality_issues",
      "bi_alerts",
      "bi_report_runs",
      "bi_report_exports",
      "bi_report_signoffs",
      "bi_audit_logs",
    ].forEach((table) => expect(migration).toContain(`ON public.${table}`));
  });

  it("contains the non-negotiable tenant, sensitivity, ownership and immutability controls", () => {
    expect(migration).toContain("public.bi_dataset_allowed(company_id, dataset_code)");
    expect(migration).toContain(
      "lower(dataset.sensitivity) NOT IN ('medical','health','medical_data')",
    );
    expect(migration).toContain("public.bi_department_scope_allowed");
    expect(migration).toContain("public.bi_can_write_report(report_id)");
    expect(migration).toContain("Signed reports are immutable");
    expect(migration).toContain("bi_append_audit");
    expect(migration).toContain("REVOKE ALL ON TABLE");
  });

  it("prevents viewers from requesting generated files and enforces truthful lifecycle states", () => {
    expect(migration).toContain("run.status = 'generated'");
    expect(migration).toContain("public.bi_can_write_report(run.report_id)");
    expect(migration).toContain("Invalid report-run lifecycle transition");
    expect(migration).toContain("Ready exports require verified delivery metadata");
  });
});
