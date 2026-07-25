import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const schema = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260728000000_phase25_platform_ecosystem.sql"),
  "utf8",
);
const security = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260728010000_phase25_platform_security.sql"),
  "utf8",
);

describe("Phase 25 platform database security contract", () => {
  it("sets RLS and revokes anonymous/public access", () => {
    expect(security).toContain("ENABLE ROW LEVEL SECURITY");
    expect(security).toContain("REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon");
    expect(security).toContain("platform_audit_logs");
  });

  it("enforces secure device identities, service-only telemetry, portal separation and no autonomous edge actions", () => {
    expect(security).toContain("Device identity is immutable");
    expect(security).toContain("controlled telemetry gateway service");
    expect(security).toContain("platform_is_mobile_user");
    expect(security).toContain("Edge rules may not execute autonomous business actions");
  });

  it("stores only references for credentials and constrains operational records", () => {
    expect(schema).toContain("secret_reference TEXT NOT NULL CHECK(secret_reference ~");
    expect(schema).toContain(
      "command_type TEXT NOT NULL CHECK(command_type IN ('diagnostics','configuration_sync','firmware_check','health_check'))",
    );
    expect(schema).toContain(
      "compression_type TEXT CHECK(compression_type IN ('none','lightstream','gzip','delta'))",
    );
    expect(schema).toContain("status TEXT NOT NULL DEFAULT 'inventory'");
  });
});
