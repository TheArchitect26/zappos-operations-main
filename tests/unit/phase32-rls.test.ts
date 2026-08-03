import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const sql = readFileSync(
  "supabase/migrations/20260805000000_phase32_enterprise_security.sql",
  "utf8",
);
describe("Phase 32 security schema", () => {
  it("extends Supabase Auth and existing RBAC", () => {
    expect(sql).toContain("REFERENCES auth.users");
    expect(sql).toContain("has_any_role");
    expect(sql).not.toContain("CREATE TYPE public.app_role");
  });
  it("enables RLS across security records", () => {
    for (const table of [
      "security_identities",
      "security_sessions",
      "security_trusted_devices",
      "security_api_identities",
      "security_events",
      "security_legal_holds",
      "security_privacy_requests",
    ])
      expect(sql).toContain(`'${table}'`);
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
  });
  it("denies driver and customer internal access", () => {
    expect(sql).toContain("ARRAY['driver']");
    expect(sql).toContain("customer_portal_memberships");
  });
  it("keeps events append-only and active legal holds immutable", () => {
    expect(sql).toContain("security_events_append_only");
    expect(sql).toContain("Active legal holds are immutable");
  });
  it("prohibits plaintext credential shapes", () => {
    expect(sql).toContain("plaintext tokens are prohibited");
    expect(sql).toContain("Secret values and credentials are prohibited");
  });
});
