import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const sql = readFileSync(
  "supabase/migrations/20260801000000_phase26_customer_experience.sql",
  "utf8",
);

const portalTables = [
  "customer_portal_branches",
  "customer_portal_membership_branches",
  "customer_portal_booking_requests",
  "customer_portal_financial_documents",
  "customer_portal_conversations",
  "customer_portal_messages",
  "customer_portal_notifications",
  "customer_portal_profiles",
  "customer_portal_api_keys",
  "customer_portal_security_events",
  "customer_portal_zip_queries",
];

describe("Phase 26 customer isolation and RLS", () => {
  it("enables RLS and revokes anonymous access for every portal table", () => {
    expect(sql).toContain("ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("REVOKE ALL ON public.%I FROM PUBLIC,anon");
    for (const table of portalTables) expect(sql).toContain(`'${table}'`);
  });

  it("applies company, customer and branch scope to portal access", () => {
    expect(sql).toContain("public.portal_has_access(_company,_customer)");
    expect(sql).toContain("public.portal_branch_visible");
    expect(sql).toContain("mb.can_view_all_branches");
    expect(sql).toContain("mb.branch_id=_branch");
  });

  it("isolates API keys, messages, notifications, analytics and ZIP", () => {
    expect(sql).toContain("portal_api_keys_self");
    expect(sql).toContain("portal_messages_read");
    expect(sql).toContain("portal_notifications_self");
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.portal_analytics");
    expect(sql).toContain("portal_zip_self");
  });

  it("keeps customer history append-only", () => {
    expect(sql).toContain("portal_security_immutable");
    expect(sql).toContain("portal_zip_immutable");
    expect(sql).toContain("portal_messages_immutable");
    expect(sql).toContain("Customer portal history is append-only");
  });

  it("uses private storage links and signed URLs rather than public buckets", () => {
    expect(sql).toContain("customer_document_links");
    expect(sql).toContain("d.visibility='customer_visible'");
    expect(sql).not.toMatch(/UPDATE storage\.buckets SET public=true/i);
  });
});
