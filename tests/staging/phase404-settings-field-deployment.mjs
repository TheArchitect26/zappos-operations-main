import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert(url && anonKey && serviceKey, "Missing controlled staging configuration");

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const [roleResult, stagingVehicles, stagingDevices] = await Promise.all([
  admin.from("user_roles").select("user_id,company_id").eq("role", "admin").limit(100),
  admin.from("vehicles").select("id,company_id").limit(1000),
  admin.from("devices").select("id,company_id,simulated").eq("simulated", false).limit(1000),
]);
assert.equal(roleResult.error, null);
const usersResult = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
assert.equal(usersResult.error, null);
const companyWithAssets = new Set(
  stagingVehicles.data
    ?.filter((vehicle) =>
      stagingDevices.data?.some((device) => device.company_id === vehicle.company_id),
    )
    .map((vehicle) => vehicle.company_id),
);
const adminRole =
  roleResult.data.find(
    (row) =>
      companyWithAssets.has(row.company_id) &&
      usersResult.data.users.some((user) => user.id === row.user_id && user.email),
  ) ??
  roleResult.data.find((row) =>
    usersResult.data.users.some((user) => user.id === row.user_id && user.email),
  );
assert(adminRole, "No retained admin persona is available");
const adminUser = usersResult.data.users.find((user) => user.id === adminRole.user_id);

const generated = await admin.auth.admin.generateLink({
  type: "magiclink",
  email: adminUser.email,
});
assert.equal(generated.error, null);
assert(generated.data.properties?.hashed_token, "Controlled session token was not generated");
const client = createClient(url, anonKey, { auth: { persistSession: false } });
const verified = await client.auth.verifyOtp({
  token_hash: generated.data.properties.hashed_token,
  type: "magiclink",
});
assert.equal(verified.error, null);

const companyId = adminRole.company_id;
const [company, profile, tracking] = await Promise.all([
  client.from("companies").select("*").eq("id", companyId).single(),
  client.from("profiles").select("*").eq("id", adminUser.id).single(),
  client
    .from("tracking_operational_settings")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle(),
]);
assert.equal(company.error, null);
assert.equal(profile.error, null);
assert.equal(tracking.error, null);

const profileWrite = await client.rpc("update_my_profile_settings", {
  _company_id: companyId,
  _full_name: profile.data.full_name || "ZappOS Staging Administrator",
  _phone: profile.data.phone,
});
assert.equal(profileWrite.error, null);

const companyWrite = await client.rpc("update_company_settings", {
  _company_id: companyId,
  _name: company.data.name,
  _country: company.data.country || "South Africa",
  _terminology: company.data.terminology,
  _document_expiry_warning_days: company.data.document_expiry_warning_days,
});
assert.equal(companyWrite.error, null);

const currentTracking = tracking.data ?? {
  live_seconds: 60,
  recent_seconds: 300,
  offline_seconds: 1800,
  tracking_refresh_seconds: 30,
  timezone: "UTC",
};
const trackingWrite = await client.rpc("upsert_tracking_settings", {
  _company_id: companyId,
  _live_seconds: currentTracking.live_seconds,
  _recent_seconds: currentTracking.recent_seconds,
  _offline_seconds: currentTracking.offline_seconds,
  _tracking_refresh_seconds: currentTracking.tracking_refresh_seconds,
  _timezone: currentTracking.timezone,
});
assert.equal(trackingWrite.error, null);

const notificationWrite = await client.rpc("upsert_my_notification_setting", {
  _company_id: companyId,
  _category: "system",
  _enabled: true,
  _background_allowed: false,
});
assert.equal(notificationWrite.error, null);
const persistedNotification = await client
  .from("mobile_notification_preferences")
  .select("enabled,background_allowed")
  .eq("company_id", companyId)
  .eq("user_id", adminUser.id)
  .eq("category", "system")
  .is("device_id", null)
  .single();
assert.deepEqual(persistedNotification.data, { enabled: true, background_allowed: false });

const audit = await client
  .from("settings_audit_logs")
  .select("event_type")
  .eq("company_id", companyId)
  .in("event_type", [
    "profile_settings_updated",
    "company_settings_updated",
    "tracking_settings_updated",
    "notification_setting_updated",
  ]);
assert.equal(audit.error, null);
assert.equal(new Set(audit.data.map((row) => row.event_type)).size, 4);

const [vehicles, devices, activeJobs] = await Promise.all([
  admin.from("vehicles").select("id").eq("company_id", companyId).limit(20),
  admin
    .from("devices")
    .select("id,simulated")
    .eq("company_id", companyId)
    .eq("simulated", false)
    .limit(50),
  admin
    .from("device_fitment_jobs")
    .select("device_id")
    .eq("company_id", companyId)
    .not("workflow_stage", "in", "(completed,cancelled,removed,replaced)"),
]);
const activeDeviceIds = new Set(activeJobs.data?.map((row) => row.device_id));
let device = devices.data?.find((row) => !activeDeviceIds.has(row.id));
let vehicle = vehicles.data?.[0];
let fixtureDeviceId;
let fixtureVehicleId;
const fixtureId = Date.now();
if (!vehicle) {
  const inserted = await admin
    .from("vehicles")
    .insert({
      company_id: companyId,
      registration: `P404-${fixtureId}`,
      vehicle_type: "van",
      status: "available",
    })
    .select("id")
    .single();
  assert.equal(inserted.error, null);
  fixtureVehicleId = inserted.data.id;
  vehicle = inserted.data;
}
if (!device) {
  const inserted = await admin
    .from("devices")
    .insert({
      company_id: companyId,
      serial_number: `P404DEVICE${fixtureId}`,
      device_type: "ZAPP_BOX",
      hardware_model: "ZAPP_BOX_P404_FIXTURE",
      simulated: false,
      status: "unprovisioned",
      telemetry_source: "ZAPP_BOX",
    })
    .select("id,simulated")
    .single();
  assert.equal(inserted.error, null);
  fixtureDeviceId = inserted.data.id;
  device = inserted.data;
}
let deploymentId;
if (device && vehicle) {
  const reference = `PHASE404-${Date.now()}`;
  try {
    const created = await client.rpc("create_field_deployment", {
      _company_id: companyId,
      _reference: reference,
      _project_name: "Phase 40.4 controlled staging evidence",
      _vehicle_id: vehicle.id,
      _device_id: device.id,
      _sim_id: null,
      _technician_user_id: null,
      _scheduled_at: new Date(Date.now() + 86_400_000).toISOString(),
      _appointment_end_at: null,
      _site_name: "Controlled staging site",
      _notes: "Temporary controlled validation record",
    });
    assert.equal(created.error, null);
    deploymentId = created.data.id;
    assert.equal(created.data.workflow_stage, "scheduled");
    const transitioned = await client.rpc("transition_field_deployment_stage", {
      _company_id: companyId,
      _fitment_job_id: deploymentId,
      _next_stage: "technician_assigned",
      _reason: null,
    });
    assert.equal(transitioned.error, null);
    assert.equal(transitioned.data.workflow_stage, "technician_assigned");
  } finally {
    if (deploymentId) {
      await admin.from("field_audit_ledger").delete().eq("entity_id", deploymentId);
      await admin.from("device_fitment_jobs").delete().eq("id", deploymentId);
    }
    if (fixtureDeviceId) await admin.from("devices").delete().eq("id", fixtureDeviceId);
    if (fixtureVehicleId) await admin.from("vehicles").delete().eq("id", fixtureVehicleId);
  }
  console.log("Field deployment create and governed transition: PASS");
} else {
  console.log(
    "Field deployment create: NOT RUN (no unallocated physical staging device/vehicle pair)",
  );
}

console.log("Settings governed persistence and audit: PASS");
