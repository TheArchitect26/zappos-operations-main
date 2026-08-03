import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const sql = readFileSync(
  "supabase/migrations/20260802000000_phase29_unified_work_experience.sql",
  "utf8",
);

describe("Phase 29 permission boundaries", () => {
  it("enables RLS and blocks anonymous access on every Phase 29 table", () => {
    for (const table of [
      "unified_workspace_preferences",
      "unified_saved_views",
      "unified_search_history",
      "unified_experience_events",
      "company_experience_settings",
    ])
      expect(sql).toContain(`'${table}'`);
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("REVOKE ALL ON public.%I FROM PUBLIC,anon");
  });

  it("isolates personal memory, searches, and views by auth.uid", () => {
    expect(sql).toContain("user_id=auth.uid() AND public.is_company_member(company_id)");
    expect(sql).toContain("owner_id=auth.uid()");
    expect(sql).toContain("visibility='personal'");
  });

  it("limits company configuration and prohibits invasive analytics payloads", () => {
    expect(sql).toContain("company_experience_admin_write");
    expect(sql).toContain("'system_administrator'");
    expect(sql).toContain(
      "NOT(metadata ?| ARRAY['email','phone','name','description','body','content','payload'])",
    );
  });
});
