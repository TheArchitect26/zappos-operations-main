import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  buildCustomerTimeline,
  getCustomerVisibleDocuments,
  isProofAccessible,
  isTrackingVisible,
} from "../../src/lib/customer-portal";

const migration = readFileSync(
  "supabase/migrations/20260801000000_phase26_customer_experience.sql",
  "utf8",
);

describe("Phase 26 customer experience contracts", () => {
  it("keeps internal event text out of the customer timeline", () => {
    const timeline = buildCustomerTimeline({
      jobStatus: "in_progress",
      proofAvailable: false,
      scheduledAt: "2026-08-01T08:00:00Z",
      startedAt: "2026-08-01T09:00:00Z",
      events: [
        {
          event_type: "delay_update",
          message: "internal dispatch root cause",
          created_at: "2026-08-01T10:00:00Z",
        },
        {
          event_type: "dispatcher_private_note",
          message: "restricted",
          created_at: "2026-08-01T10:01:00Z",
        },
      ],
    });
    expect(timeline.some((entry) => entry.description.includes("internal dispatch"))).toBe(false);
    expect(timeline.some((entry) => entry.title === "Delay update")).toBe(true);
    expect(timeline.some((entry) => entry.source === "dispatcher_private_note")).toBe(false);
  });

  it("allows only explicitly customer-visible documents and finalized proof", () => {
    expect(
      getCustomerVisibleDocuments([{ visibility: "internal" }, { visibility: "customer_visible" }]),
    ).toHaveLength(1);
    expect(
      isProofAccessible({ jobStatus: "completed", proofVisible: true, proofFinalized: true }),
    ).toBe(true);
    expect(
      isProofAccessible({ jobStatus: "completed", proofVisible: true, proofFinalized: false }),
    ).toBe(false);
  });

  it("never exposes tracking after shipment completion", () => {
    expect(isTrackingVisible({ jobStatus: "in_progress", visibility: "approximate" })).toBe(true);
    expect(isTrackingVisible({ jobStatus: "completed", visibility: "exact" })).toBe(false);
  });

  it("uses CRM references rather than creating a duplicate quote authority", () => {
    expect(migration).toContain("source_quote_id UUID REFERENCES public.crm_quotes");
    expect(migration).not.toContain("CREATE TABLE public.customer_portal_quotes");
  });

  it("enforces deterministic cited ZIP and refuses restricted subjects", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.portal_zip_answer");
    expect(migration).toContain("jsonb_array_length(refs)=0");
    expect(migration).toMatch(
      /brain\|employee\|payroll\|internal bi\|pricing rule\|other customer/,
    );
    expect(migration).toContain("'deterministic',true");
  });

  it("shows API secrets once and stores only their hash", () => {
    expect(migration).toContain("token_hash TEXT NOT NULL");
    expect(migration).toContain("encode(extensions.digest(token,'sha256'),'hex')");
    expect(migration).not.toMatch(/token_plaintext|secret_value TEXT/);
  });
});
