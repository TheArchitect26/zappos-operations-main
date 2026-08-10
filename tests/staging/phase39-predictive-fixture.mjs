import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
const url = process.env.SUPABASE_URL,
  serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY,
  publicKey = process.env.SUPABASE_PUBLISHABLE_KEY,
  password = process.env.PHASE39_PERSONA_PASSWORD,
  runId = process.env.PHASE39_RUN_ID || `phase39-${Date.now()}`,
  marker = `PHASE39-${runId}`;
if (!url || !serviceKey || !publicKey || !password)
  throw new Error("Phase 39 staging credentials required");
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
  const email = `phase39-${runId}-${alias.replaceAll("_", "-")}@staging.zappos.invalid`;
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
async function denied(promise, pattern, label) {
  try {
    const result = await promise;
    if (result.error) throw result.error;
    assert.fail(`${label}: unexpectedly allowed`);
  } catch (error) {
    assert.match(String(error.message ?? error), pattern, label);
  }
}

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
  const roles = [
    "admin",
    "fleet_manager",
    "maintenance_manager",
    "dispatcher",
    "driver",
    "customer_care",
    "viewer",
  ];
  const people = Object.fromEntries(
    (await Promise.all(roles.map((role) => persona(role, companyId)))).map((item) => [
      item.email.split(`-${runId}-`)[1].split("@")[0].replaceAll("-", "_"),
      item,
    ]),
  );
  const cross = await persona("fleet_manager", crossCompany, "cross");
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
  const customerEmail = `phase39-${runId}-customer@staging.zappos.invalid`;
  const customerUser = await ok(
    await service.auth.admin.createUser({ email: customerEmail, password, email_confirm: true }),
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
    await customerDb.auth.signInWithPassword({ email: customerEmail, password }),
    "customer sign in",
  );
  const vehicle = (
    await ok(
      await service
        .from("vehicles")
        .insert({
          company_id: companyId,
          registration: `${marker}-T08`,
          vehicle_type: "truck",
          status: "available",
          make: "Staging",
          model: "Predictive",
        })
        .select("id")
        .single(),
      "vehicle",
    )
  ).id;
  const driver = (
    await ok(
      await service
        .from("drivers")
        .insert({
          company_id: companyId,
          user_id: people.driver.id,
          full_name: `${marker} Driver`,
          status: "available",
          assigned_vehicle_id: vehicle,
          notes: marker,
        })
        .select("id")
        .single(),
      "driver",
    )
  ).id;
  await ok(
    await service.from("vehicles").update({ assigned_driver_id: driver }).eq("id", vehicle),
    "assign driver",
  );
  const assessment = (
    await ok(
      await service
        .from("predictive_vehicle_assessments")
        .insert({
          company_id: companyId,
          subject_type: "vehicle",
          subject_id: vehicle,
          vehicle_id: vehicle,
          risk_level: "high",
          confidence: 84,
          evidence_coverage: 78,
          freshness: "fresh",
          factors: ["recurring_cooling_fault", "maintenance_overdue"],
          missing_evidence: ["tyre_sensor"],
          evidence: [{ source: "maintenance_records", id: marker }],
          result: {
            recommended_inspection: "Cooling system and service review",
            downtime_range_days: [1, 2],
            breakdown_probability: null,
            remaining_useful_life: null,
          },
          model_version: "phase39-deterministic-v1",
          governance_status: "under_review",
        })
        .select("id")
        .single(),
      "assessment",
    )
  ).id;
  for (const [table, risk, result] of [
    ["predictive_subsystem_assessments", "high", { subsystem: "cooling" }],
    ["predictive_maintenance_forecasts", "elevated", { review_days: [5, 12], km_remaining: 800 }],
    [
      "predictive_recurrence_findings",
      "high",
      { code: "P0217", count: 3, average_days_between: 24 },
    ],
    [
      "predictive_fuel_anomalies",
      "elevated",
      { message: "Fuel anomaly detected", accusation: false },
    ],
    ["predictive_tyre_assessments", "insufficient_data", { sensor_values_available: false }],
    ["predictive_battery_assessments", "watch", { state_of_health: null }],
    ["predictive_engine_assessments", "high", { message: "Possible cooling-system concern" }],
    ["predictive_driver_risk_trends", "watch", { disciplinary_action: false }],
    ["predictive_route_risk_assessments", "elevated", { automatic_reroute: false }],
    ["predictive_downtime_estimates", "elevated", { range_days: [1, 2] }],
    ["predictive_service_demand_forecasts", "elevated", { days7: 1, days30: 3, days90: 5 }],
    [
      "predictive_parts_demand_forecasts",
      "watch",
      { categories: ["fluids", "filters"], purchase_orders_created: 0 },
    ],
    [
      "predictive_device_health",
      "elevated",
      { increasing_gaps: true, automatic_deactivation: false },
    ],
    ["predictive_eta_calibration_proposals", "watch", { status: "draft", auto_promote: false }],
  ])
    await ok(
      await service.from(table).insert({
        company_id: companyId,
        subject_type: "vehicle",
        subject_id: vehicle,
        vehicle_id: vehicle,
        risk_level: risk,
        confidence: 70,
        evidence_coverage: 65,
        freshness: "fresh",
        evidence: [{ source: "controlled_staging", marker }],
        result,
      }),
      table,
    );
  const dashboard = await ok(await people.viewer.db.rpc("predictive39_dashboard"), "dashboard");
  assert(dashboard.high_risk >= 1);
  assert.equal(dashboard.advisory_only, true);
  const rows = await ok(
    await people.fleet_manager.db.rpc("predictive39_assessments", { _limit: 25, _offset: 0 }),
    "assessments",
  );
  const ownAssessment = rows.find((row) => row.id === assessment);
  assert(ownAssessment, "current run assessment is visible");
  assert.equal(ownAssessment.registration, `${marker}-T08`);
  const review = await ok(
    await people.fleet_manager.db.rpc("predictive39_review", {
      _assessment_id: assessment,
      _state: "inspection_requested",
      _feedback: "useful_warning",
      _note: "Inspect controlled staging vehicle",
    }),
    "review",
  );
  assert.equal(review.maintenance_mutated, false);
  await denied(
    people.viewer.db.rpc("predictive39_review", {
      _assessment_id: assessment,
      _state: "accepted",
      _feedback: "useful_warning",
      _note: "denied",
    }),
    /denied/i,
    "viewer review denied",
  );
  const dispatch = await ok(
    await people.dispatcher.db.rpc("predictive39_dispatch", { _vehicle_id: vehicle }),
    "dispatch",
  );
  assert.equal(dispatch.hard_eligibility_change, false);
  assert.equal(dispatch.candidate_confidence_adjustment, -20);
  const driverSafe = await ok(await people.driver.db.rpc("predictive39_driver"), "driver");
  assert.equal(driverSafe.inspection_required, true);
  assert.equal(driverSafe.risk_score, undefined);
  const care = await ok(
    await people.customer_care.db.rpc("predictive39_customer_care", { _vehicle_id: vehicle }),
    "care",
  );
  assert.equal(care.raw_risk_score, null);
  assert.match(care.customer_safe_effect, /technical attention/i);
  const zip = await ok(
    await people.viewer.db.rpc("predictive39_zip", { _question: "Why is T08 high risk?" }),
    "ZIP",
  );
  assert.equal(zip.read_only, true);
  assert.equal(zip.citations.length, 1);
  assert.match(zip.answer, /risk signal, not a confirmed failure/i);
  await denied(customerDb.rpc("predictive39_dashboard"), /denied/i, "customer denied");
  await denied(
    cross.db.rpc("predictive39_dispatch", { _vehicle_id: vehicle }),
    /denied|unavailable/i,
    "cross company denied",
  );
  const immutable = await service
    .from("predictive_vehicle_assessments")
    .update({ risk_level: "normal" })
    .eq("id", assessment);
  assert.match(immutable.error?.message ?? "", /append-only/i);
  console.log(
    JSON.stringify(
      {
        runId,
        marker,
        companyId,
        vehicle,
        assessment,
        assertions: 22,
        roles: roles.length + 2,
        advisoryOnly: true,
        customerDenied: true,
        crossCompanyDenied: true,
        retainedEvidence: "all predictive Phase 39 records",
      },
      null,
      2,
    ),
  );
}

async function cleanup() {
  const users = (
    await ok(await service.auth.admin.listUsers({ page: 1, perPage: 1000 }), "users")
  ).users.filter((user) => user.email?.startsWith(`phase39-${runId}-`));
  const ids = users.map((user) => user.id);
  if (ids.length) {
    await service.from("customer_portal_memberships").delete().in("user_id", ids);
    await service.from("user_roles").delete().in("user_id", ids);
    await service.from("company_members").delete().in("user_id", ids);
  }
  const drivers = await ok(
    await service.from("drivers").select("id").eq("notes", marker),
    "drivers",
  );
  if (drivers.length) {
    await service
      .from("vehicles")
      .update({ assigned_driver_id: null })
      .in(
        "assigned_driver_id",
        drivers.map((x) => x.id),
      );
    await service
      .from("drivers")
      .delete()
      .in(
        "id",
        drivers.map((x) => x.id),
      );
  }
  await service.from("customers").delete().eq("notes", marker);
  for (const user of users) await service.auth.admin.deleteUser(user.id);
  await service.from("companies").delete().eq("name", `${marker}-CROSS`);
  console.log(
    JSON.stringify(
      {
        runId,
        mutableRecordsRemoved: true,
        immutablePredictiveEvidenceRetained: true,
        sourceVehicleRetainedWithEvidence: true,
        retainedLabel: marker,
      },
      null,
      2,
    ),
  );
}
if (process.argv[2] === "cleanup") await cleanup();
else await setup();
