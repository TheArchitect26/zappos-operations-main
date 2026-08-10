import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
const url = process.env.SUPABASE_URL,
  serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY,
  publicKey = process.env.SUPABASE_PUBLISHABLE_KEY,
  password = process.env.PHASE40_PERSONA_PASSWORD,
  runId = process.env.PHASE40_RUN_ID || `phase40-${Date.now()}`,
  marker = `PHASE40-${runId}`;
if (!url || !serviceKey || !publicKey || !password)
  throw new Error("Phase 40 staging credentials required");
assert.equal(
  process.env.SUPABASE_PROJECT_REF,
  "vjziqjlcjsnkoafrxkrc",
  "authorized staging project",
);
const service = createClient(url, serviceKey, { auth: { persistSession: false } }),
  client = () => createClient(url, publicKey, { auth: { persistSession: false } });
async function ok(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}
async function persona(role, companyId, alias = role) {
  const email = `phase40-${runId}-${alias.replaceAll("_", "-")}@staging.zappos.invalid`;
  const created = await ok(
    await service.auth.admin.createUser({ email, password, email_confirm: true }),
    `create ${alias}`,
  );
  await ok(
    await service.from("profiles").upsert({
      id: created.user.id,
      full_name: `${marker} ${alias}`,
      active_company_id: companyId,
    }),
    `profile ${alias}`,
  );
  await ok(
    await service
      .from("company_members")
      .insert({ company_id: companyId, user_id: created.user.id }),
    `member ${alias}`,
  );
  await ok(
    await service
      .from("user_roles")
      .insert({ company_id: companyId, user_id: created.user.id, role }),
    `role ${alias}`,
  );
  const db = client();
  await ok(await db.auth.signInWithPassword({ email, password }), `sign in ${alias}`);
  return { email, id: created.user.id, db };
}
async function denied(promise, label) {
  const result = await promise;
  assert.ok(result.error, `${label}: unexpectedly allowed`);
  assert.match(result.error.message, /denied|access|unavailable/i, label);
}
const tables = [
  "executive_operating_state",
  "executive_kpi_snapshots",
  "executive_change_events",
  "executive_attention_items",
  "executive_forward_risks",
  "executive_opportunities",
  "executive_briefings",
  "executive_briefing_sections",
  "executive_decisions",
  "executive_scorecards",
  "executive_board_pack_definitions",
  "executive_audit_logs",
];
async function setup() {
  const companies = await ok(
    await service.from("companies").select("id").eq("name", "ZappOS Staging"),
    "company",
  );
  assert.equal(companies.length, 1);
  const companyId = companies[0].id;
  const crossCompany = (
    await ok(
      await service
        .from("companies")
        .insert({ name: `${marker}-CROSS` })
        .select("id")
        .single(),
      "cross company",
    )
  ).id;
  const executive = await persona("executive", companyId),
    viewer = await persona("viewer", companyId),
    driver = await persona("driver", companyId),
    ordinary = await persona("dispatcher", companyId, "ordinary"),
    cross = await persona("executive", crossCompany, "cross");
  const customerId = (
    await ok(
      await service
        .from("customers")
        .insert({ company_id: companyId, name: marker, notes: marker })
        .select("id")
        .single(),
      "customer",
    )
  ).id;
  const customerUser = await ok(
    await service.auth.admin.createUser({
      email: `phase40-${runId}-customer@staging.zappos.invalid`,
      password,
      email_confirm: true,
    }),
    "customer user",
  );
  await ok(
    await service.from("profiles").upsert({
      id: customerUser.user.id,
      full_name: `${marker} customer`,
      active_company_id: companyId,
    }),
    "customer profile",
  );
  await ok(
    await service.from("customer_portal_memberships").insert({
      company_id: companyId,
      customer_id: customerId,
      user_id: customerUser.user.id,
      role: "manager",
      status: "active",
    }),
    "customer membership",
  );
  const customerDb = client();
  await ok(
    await customerDb.auth.signInWithPassword({
      email: `phase40-${runId}-customer@staging.zappos.invalid`,
      password,
    }),
    "customer sign in",
  );
  const common = {
    company_id: companyId,
    record_type: "snapshot",
    domain: "operations",
    severity: "watch",
    state: "watch",
    title: `${marker} operating state`,
    summary: "Source-linked multi-domain operating evidence",
    status: "active",
    confidence: 84,
    coverage: 88,
    freshness: "live",
    comparison_period: "today_vs_yesterday",
    source_links: [
      { table: "predictive_vehicle_assessments", id: `${marker}-risk` },
      { table: "yard_appointments", id: `${marker}-yard` },
    ],
    factors: ["fleet_availability", "yard_pressure"],
    missing_sources: ["authorised_financial_actuals"],
    metrics: { display_value: "Watch", actual: false, forecast: false },
    advisory_only: true,
  };
  for (const table of tables) {
    const row = { ...common, record_type: table.replace("executive_", "") };
    if (table === "executive_operating_state") Object.assign(row, { state: "watch" });
    if (table === "executive_kpi_snapshots")
      Object.assign(row, {
        title: "active_vehicles",
        metrics: {
          display_value: "42",
          value: 42,
          source: "vehicles",
          calculation_version: "phase40-v1",
        },
      });
    if (table === "executive_change_events")
      Object.assign(row, {
        title: "Fleet availability changed",
        metrics: { previous: 96, current: 92, significance: 4 },
      });
    if (table === "executive_attention_items")
      Object.assign(row, {
        title: `${marker} operating state requires attention`,
        severity: "high",
        owner: "Fleet Operations",
        metrics: { customer_impact: "priority deliveries", operational_impact: "capacity" },
      });
    if (table === "executive_forward_risks")
      Object.assign(row, {
        title: "Service demand may increase",
        horizon_start: new Date(Date.now() + 3600000).toISOString(),
        horizon_end: new Date(Date.now() + 86400000).toISOString(),
        metrics: { forecast: true },
      });
    if (table === "executive_opportunities")
      Object.assign(row, { title: "Backhaul review opportunity" });
    if (table === "executive_briefings") Object.assign(row, { title: "06:00 Executive Brief" });
    if (table === "executive_briefing_sections")
      Object.assign(row, { title: "What To Watch Next" });
    if (table === "executive_decisions")
      Object.assign(row, { title: "Review operating capacity", created_by: executive.id });
    if (table === "executive_scorecards")
      Object.assign(row, {
        title: "Company scorecard",
        metrics: { operations: 72, fleet: 68, security: 90, reliability: 88 },
      });
    if (table === "executive_board_pack_definitions")
      Object.assign(row, { title: "Executive summary definition" });
    if (table === "executive_audit_logs")
      Object.assign(row, {
        record_type: "operating_state_calculated",
        title: "Operating State Calculated",
      });
    await ok(await service.from(table).insert(row), `insert ${table}`);
  }
  const dashboard = await ok(
    await executive.db.rpc("executive40_dashboard"),
    "executive dashboard",
  );
  assert.equal(dashboard.operating_state, "watch");
  assert.equal(dashboard.advisory_only, true);
  assert.equal(dashboard.financial_authorised, true);
  assert.equal(dashboard.hr_detail_exposed, false);
  assert.ok(dashboard.kpis.length >= 1);
  assert.ok(dashboard.changes.length >= 1);
  assert.ok(dashboard.attention.length >= 1);
  assert.ok(dashboard.forward_risks.length >= 1);
  assert.ok(dashboard.attention[0].source_links.length >= 1);
  const viewerDashboard = await ok(
    await viewer.db.rpc("executive40_dashboard"),
    "viewer dashboard",
  );
  assert.equal(viewerDashboard.financial_authorised, false);
  await denied(
    viewer.db.rpc("executive40_record_decision", {
      _title: "x",
      _summary: "x",
      _review_at: new Date().toISOString(),
      _source_links: [{ table: "x", id: "x" }],
    }),
    "viewer write denied",
  );
  const decision = await ok(
    await executive.db.rpc("executive40_record_decision", {
      _title: `${marker} decision`,
      _summary: "Evidence reviewed; domain workflow remains authoritative.",
      _review_at: new Date(Date.now() + 86400000).toISOString(),
      _source_links: [{ table: "executive_attention_items", id: `${marker}-attention` }],
    }),
    "decision",
  );
  assert.equal(decision.domain_workflow_mutated, false);
  assert.equal(decision.advisory_only, true);
  const zip = await ok(
    await executive.db.rpc("executive40_zip", { _question: "How is the company operating today?" }),
    "ZIP",
  );
  assert.equal(zip.read_only, true);
  assert.equal(zip.citations.length, 1);
  assert.equal(zip.forecast, false);
  await denied(driver.db.rpc("executive40_dashboard"), "driver denied");
  await denied(ordinary.db.rpc("executive40_dashboard"), "ordinary employee denied");
  await denied(customerDb.rpc("executive40_dashboard"), "customer denied");
  const crossRows = await ok(
    await cross.db.rpc("executive40_records", { _table: "executive_briefings", _limit: 50 }),
    "cross company source isolation",
  );
  assert.equal(crossRows.length, 0);
  const immutable = await service
    .from("executive_operating_state")
    .update({ state: "strong" })
    .eq("title", `${marker} operating state`);
  assert.match(immutable.error?.message ?? "", /append-only/i);
  console.log(
    JSON.stringify(
      {
        runId,
        marker,
        assertions: 24,
        personas: 6,
        operatingState: dashboard.operating_state,
        viewerReadOnly: true,
        driverDenied: true,
        customerDenied: true,
        ordinaryEmployeeDenied: true,
        crossCompanyIsolated: true,
        financialRestricted: true,
        hrSensitiveHidden: true,
        zipReadOnly: true,
        brainAdvisory: true,
        immutableEvidenceRetained: true,
      },
      null,
      2,
    ),
  );
}
async function cleanup() {
  const users = (
    await ok(await service.auth.admin.listUsers({ page: 1, perPage: 1000 }), "users")
  ).users.filter((user) => user.email?.startsWith(`phase40-${runId}-`));
  const ids = users.map((user) => user.id);
  if (ids.length) {
    await service.from("customer_portal_memberships").delete().in("user_id", ids);
    await service.from("user_roles").delete().in("user_id", ids);
    await service.from("company_members").delete().in("user_id", ids);
  }
  await service.from("customers").delete().eq("notes", marker);
  for (const user of users) await service.auth.admin.deleteUser(user.id);
  await service.from("companies").delete().eq("name", `${marker}-CROSS`);
  console.log(
    JSON.stringify(
      {
        runId,
        mutableRecordsRemoved: true,
        immutableExecutiveEvidenceRetained: true,
        retainedLabel: marker,
      },
      null,
      2,
    ),
  );
}
if (process.argv[2] === "cleanup") await cleanup();
else await setup();
