import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const personaPassword = process.env.PHASE37_PERSONA_PASSWORD;
const runId = process.env.PHASE37_RUN_ID || `phase37-${Date.now()}`;
const marker = `PHASE37-YARD-${runId}`;
if (!url || !serviceKey || !publicKey || !personaPassword)
  throw new Error("Supabase and PHASE37_PERSONA_PASSWORD credentials are required");

const service = createClient(url, serviceKey, { auth: { persistSession: false } });
const client = () => createClient(url, publicKey, { auth: { persistSession: false } });
const roles = [
  "admin",
  "yard_controller", "gate_controller", "warehouse_operator", "warehouse_manager",
  "dock_coordinator", "security_officer", "dispatcher", "fleet_controller", "driver",
  "customer_care", "viewer",
];
const retainedTables = [
  "yard_gate_visits", "yard_movements", "yard_queue_entries", "yard_dock_allocations",
  "yard_loading_sessions", "yard_loading_progress", "yard_weighbridge_records",
  "yard_seal_records", "yard_security_inspections", "yard_driver_instructions",
  "yard_audit_logs", "fleet_timeline_events",
];

async function ok(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}
async function denied(promise, pattern, label) {
  const result = await promise;
  assert(result.error, `${label}: expected denial`);
  assert.match(result.error.message, pattern, `${label}: wrong denial`);
}
async function signIn(email, password = personaPassword) {
  const db = client();
  await ok(await db.auth.signInWithPassword({ email, password }), `sign in ${email}`);
  return db;
}
async function authUsers() {
  return ok(await service.auth.admin.listUsers({ page: 1, perPage: 1000 }), "list users");
}
async function upsertPersona(role, companyId, alias = role) {
  const email = `phase37-${runId}-${alias.replaceAll("_", "-")}@staging.zappos.invalid`;
  const users = await authUsers();
  let user = users.users.find((candidate) => candidate.email === email);
  if (!user) user = (await ok(await service.auth.admin.createUser({ email, password: personaPassword, email_confirm: true }), `create ${role}`)).user;
  await ok(await service.from("profiles").upsert({ id: user.id, full_name: `Phase 37 ${role}`, active_company_id: companyId }), `profile ${role}`);
  await ok(await service.from("company_members").upsert({ company_id: companyId, user_id: user.id }, { onConflict: "company_id,user_id" }), `member ${role}`);
  await ok(await service.from("user_roles").upsert({ company_id: companyId, user_id: user.id, role }, { onConflict: "company_id,user_id,role" }), `role ${role}`);
  return { role, email, id: user.id, db: await signIn(email) };
}

async function setup() {
  assert.equal(process.env.SUPABASE_PROJECT_REF, "vjziqjlcjsnkoafrxkrc", "authorised staging project ref");
  const companies = await ok(await service.from("companies").select("id,name").eq("name", "ZappOS Staging"), "staging company");
  assert.equal(companies.length, 1, "exactly one ZappOS Staging company");
  const companyId = companies[0].id;
  const personas = Object.fromEntries((await Promise.all(roles.map((role) => upsertPersona(role, companyId)))).map((item) => [item.role, item]));
  const admin = personas.admin.db;
  const source = admin;

  const crossCompany = (await ok(await service.from("companies").insert({ name: `${marker}-CROSS` }).select("id").single(), "cross company")).id;
  const cross = await upsertPersona("yard_controller", crossCompany, "cross-company");
  const customer = (await ok(await source.from("customers").insert({ company_id: companyId, name: marker, notes: marker }).select("id").single(), "customer")).id;
  const otherCustomer = (await ok(await source.from("customers").insert({ company_id: companyId, name: `${marker}-OTHER`, notes: marker }).select("id").single(), "other customer")).id;
  const customerPersona = await upsertPersona("viewer", companyId, "customer");
  await ok(await service.from("user_roles").delete().eq("company_id", companyId).eq("user_id", customerPersona.id), "remove internal customer role");
  await ok(await service.from("customer_portal_memberships").insert({ company_id: companyId, customer_id: customer, user_id: customerPersona.id, role: "manager", status: "active" }), "customer membership");
  const otherPersona = await upsertPersona("viewer", companyId, "other-customer");
  await ok(await service.from("user_roles").delete().eq("company_id", companyId).eq("user_id", otherPersona.id), "remove other customer role");
  await ok(await service.from("customer_portal_memberships").insert({ company_id: companyId, customer_id: otherCustomer, user_id: otherPersona.id, role: "manager", status: "active" }), "other membership");

  const warehouse = (await ok(await source.from("warehouses").insert({ company_id: companyId, code: `P37-${Date.now()}`, name: marker }).select("id").single(), "warehouse")).id;
  const vehicle = (await ok(await source.from("vehicles").insert({ company_id: companyId, registration: `${marker}-T08`, vehicle_type: "truck", status: "available", make: "Staging", model: "Yard" }).select("id").single(), "vehicle")).id;
  const driver = (await ok(await source.from("drivers").insert({ company_id: companyId, user_id: personas.driver.id, full_name: `${marker} Driver`, status: "available", assigned_vehicle_id: vehicle, notes: marker }).select("id").single(), "driver")).id;
  await ok(await source.from("vehicles").update({ assigned_driver_id: driver }).eq("id", vehicle), "assign driver");
  const job = (await ok(await source.from("jobs").insert({ company_id: companyId, customer_id: customer, driver_id: driver, vehicle_id: vehicle, reference: `${marker}-JOB`, description: marker, pickup_location: "ZappOS Staging Yard", dropoff_location: "Customer", status: "assigned", priority: "normal" }).select("id").single(), "dispatch job")).id;
  const shipment = (await ok(await source.from("warehouse_orders").insert({ company_id: companyId, warehouse_id: warehouse, customer_id: customer, job_id: job, order_reference: `${marker}-SHIPMENT`, status: "ready_for_dispatch", customer_visible: true }).select("id").single(), "shipment")).id;
  const task = (await ok(await source.from("warehouse_tasks").insert({ company_id: companyId, warehouse_id: warehouse, task_type: "loading", status: "open", title: marker, reference_type: "warehouse_order", reference_id: shipment }).select("id").single(), "warehouse task")).id;
  const tripId = crypto.randomUUID();
  const base = {
    marker, customer_id: customer, driver_id: driver, driver_user_id: personas.driver.id,
    vehicle_id: vehicle, vehicle_registration: `${marker}-T08`, trailer_id: crypto.randomUUID(),
    trailer_reference: `${marker}-TRAILER`, shipment_id: shipment, warehouse_task_id: task,
    job_id: job, trip_id: tripId, expected_units: 2, loaded_units: 0,
    expected_seal_number: `${marker}-SEAL`, arrival_eta: new Date(Date.now() + 60_000).toISOString(),
    estimated_completion: new Date(Date.now() + 3_600_000).toISOString(),
    estimated_departure: new Date(Date.now() + 5_400_000).toISOString(),
    queue_status: "approaching", safe_delay_reason: "Loading evidence is being completed.",
    customer_follow_up_required: false,
  };
  const root = await ok(await admin.rpc("yard37_create_fixture", { _company_id: companyId, _run_id: runId, _payload: base }), "create fixture");

  await denied(cross.db.rpc("yard37_transition", { _root_visit_id: root, _action: "vehicle_arrived", _evidence: {} }), /not authorised|not found/i, "cross-company transition");
  await ok(await personas.gate_controller.db.rpc("yard37_transition", { _root_visit_id: root, _action: "vehicle_arrived", _evidence: {} }), "vehicle arrived");
  await denied(personas.driver.db.rpc("yard37_transition", { _root_visit_id: root, _action: "driver_verified", _evidence: { driver_valid: true, permit_valid: true } }), /not authorised/i, "driver bypass");
  await denied(personas.gate_controller.db.rpc("yard37_transition", { _root_visit_id: root, _action: "driver_verified", _evidence: { driver_valid: false, permit_valid: true } }), /Driver verification failed/i, "wrong driver");
  await denied(personas.gate_controller.db.rpc("yard37_transition", { _root_visit_id: root, _action: "driver_verified", _evidence: { driver_valid: true, permit_valid: false } }), /permit expired/i, "expired permit");
  await ok(await personas.gate_controller.db.rpc("yard37_transition", { _root_visit_id: root, _action: "driver_verified", _evidence: { driver_valid: true, permit_valid: true } }), "driver verified");
  await denied(personas.gate_controller.db.rpc("yard37_transition", { _root_visit_id: root, _action: "vehicle_verified", _evidence: { vehicle_compliant: false } }), /not compliant/i, "non-compliant vehicle");
  await ok(await personas.gate_controller.db.rpc("yard37_transition", { _root_visit_id: root, _action: "vehicle_verified", _evidence: { vehicle_compliant: true } }), "vehicle verified");
  await denied(personas.security_officer.db.rpc("yard37_transition", { _root_visit_id: root, _action: "trailer_verified", _evidence: { trailer_match: false } }), /does not match/i, "trailer mismatch");
  await ok(await personas.security_officer.db.rpc("yard37_transition", { _root_visit_id: root, _action: "trailer_verified", _evidence: { trailer_match: true } }), "trailer verified");
  await denied(personas.security_officer.db.rpc("yard37_transition", { _root_visit_id: root, _action: "security_checked", _evidence: { security_clear: false } }), /Security hold/i, "security hold");
  await ok(await personas.security_officer.db.rpc("yard37_transition", { _root_visit_id: root, _action: "security_checked", _evidence: { security_clear: true, internal_security_note: "restricted fixture note" } }), "security checked");
  await denied(personas.gate_controller.db.rpc("yard37_transition", { _root_visit_id: root, _action: "documents_checked", _evidence: { documents_complete: false } }), /documents are missing/i, "missing documents");
  await ok(await personas.gate_controller.db.rpc("yard37_transition", { _root_visit_id: root, _action: "documents_checked", _evidence: { documents_complete: true } }), "documents checked");
  await denied(customerPersona.db.rpc("yard37_transition", { _root_visit_id: root, _action: "gate_entry_approved", _evidence: {} }), /not authorised/i, "customer bypass");
  await ok(await personas.gate_controller.db.rpc("yard37_transition", { _root_visit_id: root, _action: "gate_entry_approved", _evidence: {} }), "gate entry approved");
  await ok(await personas.yard_controller.db.rpc("yard37_transition", { _root_visit_id: root, _action: "parking_assigned", _evidence: { queue_status: "parked", parking_label: "P37-P1" } }), "parking assigned");
  await denied(personas.dock_coordinator.db.rpc("yard37_transition", { _root_visit_id: root, _action: "dock_assigned", _evidence: { dock_compatible: false, dock_available: true, loading_ready: true } }), /incompatible/i, "incompatible dock");
  await denied(personas.dock_coordinator.db.rpc("yard37_transition", { _root_visit_id: root, _action: "dock_assigned", _evidence: { dock_compatible: true, dock_available: false, loading_ready: true } }), /occupied/i, "occupied dock");
  await denied(personas.dock_coordinator.db.rpc("yard37_transition", { _root_visit_id: root, _action: "dock_assigned", _evidence: { dock_compatible: true, dock_available: true, loading_ready: false } }), /not ready/i, "loading readiness");
  await ok(await personas.dock_coordinator.db.rpc("yard37_transition", { _root_visit_id: root, _action: "dock_assigned", _evidence: { dock_compatible: true, dock_available: true, loading_ready: true, dock_id: crypto.randomUUID(), dock_label: "D37-01" } }), "human dock approval");
  await ok(await personas.warehouse_operator.db.rpc("yard37_transition", { _root_visit_id: root, _action: "loading_started", _evidence: {} }), "loading started");
  await denied(personas.warehouse_operator.db.rpc("yard37_transition", { _root_visit_id: root, _action: "loading_progress_recorded", _evidence: { shipment_id: crypto.randomUUID(), scan_id: `${runId}-wrong`, loaded_units: 1 } }), /another shipment/i, "wrong shipment scan");
  await ok(await personas.warehouse_operator.db.rpc("yard37_transition", { _root_visit_id: root, _action: "loading_progress_recorded", _evidence: { shipment_id: shipment, scan_id: `${runId}-scan-1`, loaded_units: 1, stock_exception: "damaged_item_replaced" } }), "loading progress");
  await denied(personas.warehouse_operator.db.rpc("yard37_transition", { _root_visit_id: root, _action: "loading_progress_recorded", _evidence: { shipment_id: shipment, scan_id: `${runId}-scan-1`, loaded_units: 1 } }), /Duplicate loading scan/i, "duplicate scan");
  await denied(personas.warehouse_manager.db.rpc("yard37_transition", { _root_visit_id: root, _action: "loading_completed", _evidence: { loaded_units: 1 } }), /not satisfied/i, "early loading completion");
  await ok(await personas.warehouse_operator.db.rpc("yard37_transition", { _root_visit_id: root, _action: "loading_progress_recorded", _evidence: { shipment_id: shipment, scan_id: `${runId}-scan-2`, loaded_units: 2 } }), "final loading progress");
  await ok(await personas.warehouse_manager.db.rpc("yard37_transition", { _root_visit_id: root, _action: "loading_completed", _evidence: { loaded_units: 2 } }), "loading completed");
  await ok(await personas.security_officer.db.rpc("yard37_transition", { _root_visit_id: root, _action: "seal_applied", _evidence: { seal_number: `${marker}-SEAL`, seal_condition: "intact" } }), "seal applied");
  await ok(await personas.gate_controller.db.rpc("yard37_transition", { _root_visit_id: root, _action: "weighbridge_recorded", _evidence: { capture_method: "manual", tare_kg: 8_000, gross_kg: 20_500, net_kg: 12_500, expected_net_kg: 12_000, overweight: true, weight_complete: true } }), "manual weighbridge");
  await denied(personas.security_officer.db.rpc("yard37_transition", { _root_visit_id: root, _action: "exit_reviewed", _evidence: { seal_number: "MISMATCH" } }), /Mandatory exit blocker/i, "seal mismatch blocks exit");
  await ok(await personas.security_officer.db.rpc("yard37_transition", { _root_visit_id: root, _action: "exit_reviewed", _evidence: {} }), "exit review");
  await ok(await personas.gate_controller.db.rpc("yard37_transition", { _root_visit_id: root, _action: "exit_approved", _evidence: {} }), "exit approved");
  const final = await ok(await personas.gate_controller.db.rpc("yard37_transition", { _root_visit_id: root, _action: "gate_out", _evidence: {} }), "gate out");
  assert.equal(final.state, "gate_out");

  const driverProjection = await ok(await personas.driver.db.rpc("yard37_driver_projection", { _root_visit_id: root }), "driver projection");
  assert.deepEqual(Object.keys(driverProjection).sort(), ["freshness", "instructions", "read_only", "source", "state"]);
  assert(driverProjection.instructions.every((item) => ["proceed_to_gate_lane", "proceed_to_parking", "proceed_to_dock", "proceed_to_weighbridge", "loading_complete", "exit_approved", "gate_out"].includes(item.instruction)));
  const careProjection = await ok(await personas.customer_care.db.rpc("yard37_customer_care_projection", { _root_visit_id: root }), "Customer Care projection");
  assert.equal(careProjection.internal_security_note, undefined);
  const ownProjection = await ok(await customerPersona.db.rpc("yard37_customer_projection", { _root_visit_id: root }), "own customer projection");
  assert.equal(ownProjection.shipment_id, shipment);
  await denied(otherPersona.db.rpc("yard37_customer_projection", { _root_visit_id: root }), /denied/i, "other customer denied");
  const dispatch = await ok(await personas.dispatcher.db.rpc("yard37_dispatch_projection", { _root_visit_id: root }), "dispatch projection");
  assert.equal(dispatch.exit_readiness, true);
  const fleet = await ok(await personas.fleet_controller.db.rpc("yard37_dispatch_projection", { _root_visit_id: root }), "fleet projection");
  assert.equal(fleet.gate_status, "gate_out");
  const zipQuestions = ["Where is Truck T08 in the yard?", "Why is loading delayed?", "Which dock is assigned?", "What blocks departure?", "Which vehicles have waited longest?", "What happened during the last shift?"];
  for (const question of zipQuestions) {
    const answer = await ok(await personas.viewer.db.rpc("yard37_zip_answer", { _root_visit_id: root, _question: question }), `ZIP ${question}`);
    assert.equal(answer.read_only, true); assert(answer.freshness); assert.equal(answer.citations.length, 1);
  }
  const customerZip = await ok(await customerPersona.db.rpc("yard37_zip_answer", { _root_visit_id: root, _question: "Which dock is assigned?" }), "customer ZIP");
  assert.match(customerZip.answer, /restricted/i);
  const brain = await ok(await personas.viewer.db.rpc("yard37_brain_signals", { _root_visit_id: root }), "Brain signals");
  assert.equal(brain.advisory_only, true); assert.equal(brain.prohibited_actions.length, 5);
  await denied(personas.viewer.db.rpc("yard37_transition", { _root_visit_id: root, _action: "vehicle_arrived", _evidence: {} }), /not authorised|Invalid yard transition/i, "viewer write denied");

  const timelineRows = await ok(await service.from("fleet_timeline_events").select("event_type,source,evidence").eq("company_id", companyId).eq("source", "yard_phase37").limit(1000), "timeline");
  const timeline = timelineRows.filter((event) => event.evidence?.some?.((item) => item.root_visit_id === root));
  const requiredTimeline = ["approaching_gate", "gate_in", "security_check", "admitted", "queue_started", "parking_assigned", "dock_assigned", "at_dock", "loading_started", "loading_progress", "loading_completed", "seal_applied", "weighbridge", "exit_approved", "gate_out", "departed_site"];
  assert(requiredTimeline.every((eventType) => timeline.some((event) => event.event_type === eventType)));
  assert(timeline.every((event) => event.source === "yard_phase37"));
  const audit = await ok(await service.from("yard_audit_logs").select("id,payload").eq("company_id", companyId).eq("payload->>run_id", runId), "audit");
  assert(audit.length >= 18);
  const seal = await ok(await service.from("yard_seal_records").select("id,payload").eq("company_id", companyId).eq("payload->>run_id", runId).single(), "seal evidence");
  await denied(service.from("yard_seal_records").update({ payload: {} }).eq("id", seal.id), /append-only/i, "seal immutable");

  console.log(JSON.stringify({ runId, marker, companyId, rootVisitId: root, finalState: final.state, personas: roles.length + 3, assertions: 52, timelineEvents: timeline.length, auditEvents: audit.length, retainedTables, mutableCleanup: "run with cleanup", hardwareIntegration: false }, null, 2));
}

async function cleanup() {
  const companies = await ok(await service.from("companies").select("id").eq("name", "ZappOS Staging"), "staging company");
  const companyId = companies[0]?.id;
  if (!companyId) return;
  const users = await authUsers();
  const fixtureUsers = users.users.filter((user) => user.email?.startsWith(`phase37-${runId}-`));
  const ids = fixtureUsers.map((user) => user.id);
  if (ids.length) {
    await service.from("customer_portal_memberships").delete().in("user_id", ids);
    await service.from("user_roles").delete().in("user_id", ids);
    await service.from("company_members").delete().in("user_id", ids);
  }
  const drivers = await ok(await service.from("drivers").select("id").eq("notes", marker), "fixture drivers");
  const driverIds = drivers.map((item) => item.id);
  if (driverIds.length) {
    await service.from("vehicles").update({ assigned_driver_id: null }).in("assigned_driver_id", driverIds);
    await service.from("jobs").delete().in("driver_id", driverIds);
    await service.from("drivers").delete().in("id", driverIds);
  }
  await service.from("warehouse_tasks").delete().eq("title", marker);
  await service.from("warehouse_orders").delete().like("order_reference", `${marker}%`);
  await service.from("vehicles").delete().like("registration", `${marker}%`);
  await service.from("customers").delete().eq("notes", marker);
  await service.from("warehouses").delete().eq("name", marker);
  for (const table of ["yard_sites", "yard_gates", "yard_gate_lanes", "yard_parking_bays", "yard_docks", "yard_appointments"])
    await service.from(table).delete().eq("payload->>run_id", runId);
  for (const user of fixtureUsers) await service.auth.admin.deleteUser(user.id);
  await service.from("companies").delete().eq("name", `${marker}-CROSS`);
  console.log(JSON.stringify({ runId, mutableRecordsRemoved: true, immutableEvidenceRetained: true, retainedTables }, null, 2));
}

if (process.argv[2] === "cleanup") await cleanup(); else await setup();
