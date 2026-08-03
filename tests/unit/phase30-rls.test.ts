import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const sql = readFileSync("supabase/migrations/20260803000000_phase30_zapp_connect.sql", "utf8");
const securitySql = readFileSync(
  "supabase/migrations/20260803010000_phase30_security_completion.sql",
  "utf8",
);
const tables = [
  "communication_threads",
  "communication_participants",
  "communication_messages",
  "communication_delivery_attempts",
  "team_channels",
  "team_channel_members",
  "work_tasks",
  "work_task_dependencies",
  "work_approvals",
  "work_escalations",
  "communication_templates",
  "communication_template_versions",
  "communication_preferences",
  "workflow_automation_definitions",
  "workflow_automation_versions",
  "workflow_automation_runs",
  "workflow_automation_actions",
  "communication_audit_logs",
];
describe("Phase 30 RLS and governance", () => {
  it("enables RLS and blocks anonymous access for every new table", () => {
    for (const table of tables) {
      expect(sql).toContain(`public.${table}`);
      expect(sql).toContain(`'${table}'`);
    }
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("REVOKE ALL ON public.%I FROM PUBLIC,anon");
  });
  it("enforces company, participant and channel boundaries", () => {
    expect(sql).toContain("public.is_company_member(company_id)");
    expect(sql).toContain("connect_thread_access");
    expect(sql).toContain("connect_messages_participant_read");
    expect(sql).toContain("team_channel_members");
    expect(securitySql).toContain("p.participant_type='customer' AND t.visibility='customer'");
    expect(securitySql).toContain("p.participant_type='supplier' AND t.visibility='supplier'");
    expect(securitySql).toContain("connect_can_write");
    expect(securitySql).toContain("thread_company_fk");
    const customerSql = readFileSync(
      "supabase/migrations/20260803020000_phase30_customer_visibility.sql",
      "utf8",
    );
    expect(customerSql).toContain("customer_portal_memberships");
    expect(customerSql).toContain("m.status='active'");
  });
  it("blocks direct approval mutation and external sending without provider configuration", () => {
    expect(sql).toContain("Decisions must execute owning_rpc");
    expect(sql).not.toMatch(/GRANT INSERT,UPDATE ON public\.work_approvals/);
    expect(sql).toContain("connect_provider_ready");
    expect(sql).toContain("delivery_state='draft'");
  });
  it("reuses Phase 22 event bus, retry queue and DLQ", () => {
    expect(sql).toContain("REFERENCES public.integration_event_bus");
    expect(sql).toContain("REFERENCES public.integration_retry_queue");
    expect(sql).toContain("REFERENCES public.integration_dead_letter_queue");
    expect(sql).not.toContain("communication_retry_queue");
  });
  it("keeps attempts, audit, approved versions and handovers immutable", () => {
    expect(sql).toContain("delivery_attempts_append_only");
    expect(sql).toContain("communication_audit_append_only");
    expect(sql).toContain("Approved versions are immutable");
    expect(sql).toContain("Phase 10 authoritative shift handovers");
    expect(sql).toContain("acknowledgement RPCs, append-only items");
  });
  it("allow-lists human-gated automation actions", () => {
    expect(sql).toContain("request_human_acknowledgement");
    for (const prohibited of [
      "dispatch_vehicle",
      "suspend_driver",
      "approve_payment",
      "terminate_employee",
    ])
      expect(sql).not.toMatch(new RegExp(`action_type[^\\n]+${prohibited}`));
  });
  it("stores provider references instead of secrets", () => {
    expect(sql).toContain("provider_reference");
    expect(sql).not.toMatch(/mailbox_password|provider_secret|whatsapp_token/);
  });
});
