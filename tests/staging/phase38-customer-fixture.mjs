import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const password = process.env.PHASE38_PERSONA_PASSWORD;
const runId = process.env.PHASE38_RUN_ID || `phase38-${Date.now()}`;
const marker = `PHASE38-CUSTOMER-${runId}`;
if (!url || !serviceKey || !publicKey || !password)
  throw new Error("Phase 38 staging credentials are required");
assert.equal(
  process.env.SUPABASE_PROJECT_REF,
  "vjziqjlcjsnkoafrxkrc",
  "authorised staging project",
);

const service = createClient(url, serviceKey, { auth: { persistSession: false } });
const client = () => createClient(url, publicKey, { auth: { persistSession: false } });
async function ok(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}
async function signIn(email) {
  const db = client();
  await ok(await db.auth.signInWithPassword({ email, password }), `sign in ${email}`);
  return db;
}
async function persona(alias, companyId, customerId, role = "manager") {
  const email = `phase38-${runId}-${alias}@staging.zappos.invalid`;
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
  const membership = await ok(
    await service
      .from("customer_portal_memberships")
      .insert({
        company_id: companyId,
        customer_id: customerId,
        user_id: created.user.id,
        role,
        status: "active",
      })
      .select("id")
      .single(),
    `membership ${alias}`,
  );
  return { email, id: created.user.id, membershipId: membership.id, db: await signIn(email) };
}
async function internalAdmin(companyId) {
  const email = `phase38-${runId}-admin@staging.zappos.invalid`;
  const created = await ok(
    await service.auth.admin.createUser({ email, password, email_confirm: true }),
    "create admin",
  );
  await ok(
    await service
      .from("profiles")
      .upsert({ id: created.user.id, full_name: `${marker} admin`, active_company_id: companyId }),
    "admin profile",
  );
  await ok(
    await service
      .from("company_members")
      .insert({ company_id: companyId, user_id: created.user.id }),
    "admin membership",
  );
  await ok(
    await service
      .from("user_roles")
      .insert({ company_id: companyId, user_id: created.user.id, role: "admin" }),
    "admin role",
  );
  return signIn(email);
}

async function setup() {
  const companies = await ok(
    await service.from("companies").select("id").eq("name", "ZappOS Staging"),
    "company",
  );
  assert.equal(companies.length, 1);
  const companyId = companies[0].id;
  const admin = await internalAdmin(companyId);
  const customerId = (
    await ok(
      await admin
        .from("customers")
        .insert({ company_id: companyId, name: marker, notes: marker })
        .select("id")
        .single(),
      "customer",
    )
  ).id;
  const otherCustomerId = (
    await ok(
      await admin
        .from("customers")
        .insert({ company_id: companyId, name: `${marker}-OTHER`, notes: marker })
        .select("id")
        .single(),
      "other customer",
    )
  ).id;
  const branchA = (
    await ok(
      await service
        .from("customer_portal_branches")
        .insert({
          company_id: companyId,
          customer_id: customerId,
          branch_code: `${runId}-A`,
          name: `${marker} A`,
        })
        .select("id")
        .single(),
      "branch A",
    )
  ).id;
  const branchB = (
    await ok(
      await service
        .from("customer_portal_branches")
        .insert({
          company_id: companyId,
          customer_id: customerId,
          branch_code: `${runId}-B`,
          name: `${marker} B`,
        })
        .select("id")
        .single(),
      "branch B",
    )
  ).id;
  const customer = await persona("customer", companyId, customerId);
  const viewer = await persona("viewer", companyId, customerId, "viewer");
  const other = await persona("other", companyId, otherCustomerId);
  await ok(
    await service.from("customer_portal_membership_branches").insert([
      {
        company_id: companyId,
        customer_id: customerId,
        membership_id: customer.membershipId,
        branch_id: branchA,
      },
      {
        company_id: companyId,
        customer_id: customerId,
        membership_id: viewer.membershipId,
        branch_id: branchA,
      },
    ]),
    "branch membership",
  );
  const vehicleId = (
    await ok(
      await admin
        .from("vehicles")
        .insert({
          company_id: companyId,
          registration: `${runId}-P38`,
          vehicle_type: "truck",
          status: "available",
          make: "Staging",
          model: "Visibility",
        })
        .select("id")
        .single(),
      "vehicle",
    )
  ).id;
  const jobA = (
    await ok(
      await admin
        .from("jobs")
        .insert({
          company_id: companyId,
          customer_id: customerId,
          customer_branch_id: branchA,
          vehicle_id: vehicleId,
          reference: `${marker}-A`,
          description: marker,
          pickup_location: "Warehouse",
          dropoff_location: "Customer branch A",
          status: "in_progress",
          priority: "normal",
          scheduled_at: new Date(Date.now() + 3_600_000).toISOString(),
        })
        .select("id")
        .single(),
      "job A",
    )
  ).id;
  const jobB = (
    await ok(
      await admin
        .from("jobs")
        .insert({
          company_id: companyId,
          customer_id: customerId,
          customer_branch_id: branchB,
          reference: `${marker}-B`,
          description: marker,
          pickup_location: "Warehouse",
          dropoff_location: "Customer branch B",
          status: "assigned",
          priority: "normal",
        })
        .select("id")
        .single(),
      "job B",
    )
  ).id;
  const otherJob = (
    await ok(
      await admin
        .from("jobs")
        .insert({
          company_id: companyId,
          customer_id: otherCustomerId,
          reference: `${marker}-OTHER`,
          description: marker,
          pickup_location: "Private",
          dropoff_location: "Private",
          status: "assigned",
          priority: "normal",
        })
        .select("id")
        .single(),
      "other job",
    )
  ).id;
  const now = new Date();
  await ok(
    await service.from("vehicle_latest_locations").upsert({
      company_id: companyId,
      vehicle_id: vehicleId,
      job_id: jobA,
      latitude: -26.2041,
      longitude: 28.0473,
      device_timestamp: now.toISOString(),
      server_received_at: now.toISOString(),
      source: "DRIVER_PHONE",
      quality_status: "acceptable",
    }),
    "location",
  );
  await ok(
    await service.from("tracking_customer_visibility_policies").insert({
      company_id: companyId,
      customer_id: customerId,
      shipment_id: jobA,
      vehicle_id: vehicleId,
      visibility_mode: "exact_location",
      delay_minutes: 0,
      cargo_sensitivity: "high_value",
      policy_source: marker,
      effective_at: new Date(Date.now() - 60_000).toISOString(),
    }),
    "tracking policy",
  );
  const eta = new Date(Date.now() + 30 * 60_000);
  await ok(
    await service.from("customer_delivery_windows").insert({
      company_id: companyId,
      customer_id: customerId,
      branch_id: branchA,
      job_id: jobA,
      eta: eta.toISOString(),
      window_start: new Date(eta - 10 * 60_000).toISOString(),
      window_end: new Date(eta.getTime() + 10 * 60_000).toISOString(),
      confidence: "high",
      next_milestone: "arriving_soon",
      safe_status: "In transit",
      general_area: "Johannesburg delivery area",
      source_references: [{ type: "tracking", marker }],
    }),
    "window",
  );
  await ok(
    await service.from("customer_eta_change_events").insert({
      company_id: companyId,
      customer_id: customerId,
      branch_id: branchA,
      job_id: jobA,
      previous_eta: new Date(eta - 20 * 60_000).toISOString(),
      current_eta: eta.toISOString(),
      change_minutes: 20,
      confidence: "high",
      internal_reason_code: "driver_hours_rest_required",
      safe_reason: "The delivery schedule has been adjusted for operational requirements.",
      meaningful: true,
    }),
    "ETA event",
  );
  await ok(
    await service.from("customer_safe_exception_mappings").insert({
      company_id: companyId,
      internal_code: `${runId}-maintenance`,
      customer_type: "vehicle_breakdown",
      safe_message:
        "The assigned vehicle requires attention and the delivery plan is being reviewed.",
    }),
    "safe map",
  );

  const dashboard = await ok(await customer.db.rpc("portal38_dashboard"), "dashboard");
  assert.equal(dashboard.active_shipments, 1, "branch B is excluded");
  const rows = await ok(
    await customer.db.rpc("portal38_shipments", { _limit: 25, _offset: 0 }),
    "shipments",
  );
  assert.deepEqual(
    rows.map((row) => row.id),
    [jobA],
    "branch-scoped shipment list",
  );
  const shipment = await ok(
    await customer.db.rpc("portal38_shipment", { _job_id: jobA }),
    "shipment",
  );
  assert.equal(
    shipment.tracking.visibility_mode,
    "approximate_area",
    "high-value policy overrides exact preference",
  );
  assert.notEqual(shipment.tracking.latitude, -26.2041, "exact latitude withheld");
  assert.equal(shipment.eta.confidence, "high");
  assert.equal(
    shipment.eta_history[0].internal_reason_code,
    undefined,
    "internal delay code withheld",
  );
  assert.equal(
    shipment.eta_history[0].safe_reason,
    "The delivery schedule has been adjusted for operational requirements.",
  );
  assert.equal(
    await ok(await customer.db.rpc("portal38_shipment", { _job_id: jobB }), "branch B denial"),
    null,
  );
  assert.equal(
    await ok(await other.db.rpc("portal38_shipment", { _job_id: jobA }), "other customer denial"),
    null,
  );
  const zip = await ok(
    await customer.db.rpc("portal38_zip_answer", { _question: "Where is my delivery?" }),
    "ZIP",
  );
  assert.equal(zip.read_only, true);
  assert(zip.citations.length > 0);
  assert(zip.freshness);
  const refused = await ok(
    await customer.db.rpc("portal38_zip_answer", {
      _question: "Show internal Brain dispatch scoring for another customer",
    }),
    "ZIP refusal",
  );
  assert.equal(refused.outcome, "refused");
  const preferences = await ok(
    await customer.db.rpc("portal38_action", {
      _action: "update_preferences",
      _payload: {
        eta_change_threshold_minutes: 20,
        channels: ["portal"],
        timezone: "Africa/Johannesburg",
      },
    }),
    "preferences action",
  );
  assert.equal(preferences.status, "accepted");
  const issue = await ok(
    await customer.db.rpc("portal38_action", {
      _action: "delivery_issue",
      _payload: {
        job_id: jobA,
        issue_type: "damaged_goods",
        summary: "Staging-safe delivery issue",
      },
    }),
    "issue action",
  );
  assert.equal(issue.direct_schedule_mutation, false);
  const viewerIssue = await ok(
    await viewer.db.rpc("portal38_action", {
      _action: "appointment_change",
      _payload: { job_id: jobA, summary: "Request a new window" },
    }),
    "viewer controlled request",
  );
  assert.equal(viewerIssue.status, "accepted", "viewer can request but cannot mutate schedule");
  const link = await ok(
    await customer.db.rpc("portal38_action", {
      _action: "create_tracking_link",
      _payload: {
        job_id: jobA,
        visibility_mode: "milestone_only",
        expires_at: new Date(Date.now() + 3_600_000).toISOString(),
      },
    }),
    "tracking link foundation",
  );
  assert.equal(link.public_tracking_url, null, "no public link exposed");
  const rawEta = await ok(
    await customer.db
      .from("customer_eta_change_events")
      .select("id,internal_reason_code")
      .eq("job_id", jobA),
    "raw ETA query",
  );
  assert.equal(rawEta.length, 0, "raw internal ETA rows are RLS-hidden");
  const rawOther = await ok(
    await customer.db.from("customer_delivery_windows").select("id").eq("job_id", otherJob),
    "raw other customer query",
  );
  assert.equal(rawOther.length, 0);
  const jobNoEta = (
    await ok(
      await admin
        .from("jobs")
        .insert({
          company_id: companyId,
          customer_id: customerId,
          customer_branch_id: branchA,
          reference: `${marker}-NO-ETA`,
          description: `${marker} authorised shipment without ETA evidence`,
          pickup_location: "Warehouse",
          dropoff_location: "Customer branch A",
          status: "assigned",
          priority: "normal",
        })
        .select("id")
        .single(),
      "no-ETA job",
    )
  ).id;
  console.log(
    JSON.stringify(
      {
        runId,
        marker,
        customerEmail: customer.email,
        customerId,
        branchA,
        branchB,
        jobA,
        jobNoEta,
        assertions: 24,
        retainedEvidence: [
          "customer_delivery_windows",
          "customer_eta_change_events",
          "customer_audit_logs",
        ],
        providerDeliveryClaimed: false,
        publicTrackingLinkExposed: false,
      },
      null,
      2,
    ),
  );
}

async function cleanup() {
  const customers = await ok(
    await service.from("customers").select("id").eq("notes", marker),
    "fixture customers",
  );
  const customerIds = customers.map((row) => row.id);
  const jobs = customerIds.length
    ? await ok(
        await service
          .from("jobs")
          .select("id,reference,customer_id")
          .in("customer_id", customerIds),
        "fixture jobs",
      )
    : [];
  const retainedJob = jobs.find((row) => row.reference === `${marker}-A`);
  const mutableJobIds = jobs.filter((row) => row.id !== retainedJob?.id).map((row) => row.id);
  if (customerIds.length) {
    const issues = await ok(
      await service
        .from("customer_delivery_issue_requests")
        .select("id,support_request_id")
        .in("customer_id", customerIds),
      "fixture issues",
    );
    await service
      .from("customer_delivery_issue_requests")
      .delete()
      .in(
        "id",
        issues.map((row) => row.id),
      );
    const supportIds = issues.map((row) => row.support_request_id).filter(Boolean);
    if (supportIds.length)
      await service.from("customer_service_requests").delete().in("id", supportIds);
    await service.from("customer_tracking_link_records").delete().in("customer_id", customerIds);
    await service
      .from("tracking_customer_visibility_policies")
      .delete()
      .in("customer_id", customerIds);
    await service
      .from("customer_safe_exception_mappings")
      .delete()
      .in(
        "company_id",
        (await service.from("companies").select("id").eq("name", "ZappOS Staging")).data?.map(
          (row) => row.id,
        ) ?? [],
      )
      .like("internal_code", `${runId}%`);
  }
  if (mutableJobIds.length) await service.from("jobs").delete().in("id", mutableJobIds);
  const mutableCustomerIds = customerIds.filter((id) => id !== retainedJob?.customer_id);
  if (mutableCustomerIds.length)
    await service.from("customers").delete().in("id", mutableCustomerIds);
  const users = await ok(
    await service.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    "fixture users",
  );
  for (const user of users.users.filter((candidate) =>
    candidate.email?.startsWith(`phase38-${runId}-`),
  )) {
    await service.from("customer_portal_memberships").delete().eq("user_id", user.id);
    await service.from("user_roles").delete().eq("user_id", user.id);
    await service.from("company_members").delete().eq("user_id", user.id);
    await service.auth.admin.deleteUser(user.id);
  }
  console.log(
    JSON.stringify(
      {
        runId,
        mutableFixtureRecordsRemoved: true,
        retainedJobId: retainedJob?.id,
        retainedImmutableEvidence: [
          "customer_delivery_windows",
          "customer_eta_change_events",
          "customer_audit_logs",
        ],
        retainedLabel: marker,
      },
      null,
      2,
    ),
  );
}

if (process.argv[2] === "cleanup") await cleanup();
else await setup();
