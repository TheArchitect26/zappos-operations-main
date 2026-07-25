import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260727010000_phase24_zip_security.sql"),
  "utf8",
);
const schema = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260727000000_phase24_zip_schema.sql"),
  "utf8",
);

describe("Phase 24 ZIP database security contract", () => {
  it("enables RLS and removes anonymous/public access for every ZIP table", () => {
    expect(migration).toContain("ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon");
    expect(migration).toContain("zip_audit_no_mutation");
  });

  it("protects source permission, memory ownership, citation publication, and provider execution", () => {
    expect(migration).toContain("zip_knowledge_source_visible");
    expect(migration).toContain("Session memory must belong to the current user");
    expect(migration).toContain("Available ZIP responses require persisted evidence citations");
    expect(migration).toContain("Provider execution is not enabled by Phase 24 database records");
  });

  it("has database constraints for production-disabled providers and non-autonomous agents", () => {
    expect(schema).toContain("CHECK(NOT production_enabled)");
    expect(schema).toContain("CHECK(NOT autonomous_actions_allowed)");
    expect(schema).toContain("CHECK(advisory_only)");
  });
});
