import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const authenticated = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY);
const email = process.env.PHASE35_DRIVER_EMAIL || process.env.E2E_ADMIN_EMAIL;
const password = process.env.PHASE35_DRIVER_PASSWORD;
const runId = process.env.PHASE35_RUN_ID || `${Date.now()}`;
const marker = `PHASE35_PERSISTED_SLICE-${runId}`;

if (!password) throw new Error("PHASE35_DRIVER_PASSWORD is required");

async function findOrCreateUser() {
  const users = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (users.error) throw users.error;
  const existing = users.data.users.find((user) => user.email === email);
  if (existing) {
    const updated = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (updated.error) throw updated.error;
    return { id: existing.id, created: false };
  }
  const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data.user)
    throw created.error || new Error("Auth user was not created");
  return { id: created.data.user.id, created: true };
}

async function setup() {
  const user = await findOrCreateUser();
  const userId = user.id;
  const signedIn = await authenticated.auth.signInWithPassword({ email, password });
  if (signedIn.error) throw signedIn.error;
  const db = authenticated;
  const { data: membership, error: companyError } = await db
    .from("company_members")
    .select("company_id")
    .eq("user_id", userId)
    .limit(1)
    .single();
  if (companyError) throw companyError;
  const companyId = membership.company_id;
  if (user.created) {
    await db.from("company_members").upsert({ company_id: companyId, user_id: userId });
    await db.from("user_roles").upsert({ company_id: companyId, user_id: userId, role: "driver" });
  }
  const { error: profileError } = await db
    .from("profiles")
    .upsert({ id: userId, full_name: "Phase 35 Driver", active_company_id: companyId });
  if (profileError) throw profileError;
  const vehicleRegistration = `${marker}-VEHICLE-${Date.now()}`;
  const { data: vehicle, error: vehicleError } = await db
    .from("vehicles")
    .insert({
      company_id: companyId,
      registration: vehicleRegistration,
      vehicle_type: "truck",
      status: "available",
      make: "Simulation",
      model: "Driver Slice",
    })
    .select("id")
    .single();
  if (vehicleError) throw vehicleError;
  const { data: driver, error: driverError } = await db
    .from("drivers")
    .insert({
      company_id: companyId,
      user_id: userId,
      full_name: "Phase 35 Driver",
      status: "available",
      assigned_vehicle_id: vehicle.id,
      notes: marker,
    })
    .select("id")
    .single();
  if (driverError) throw driverError;
  await db.from("vehicles").update({ assigned_driver_id: driver.id }).eq("id", vehicle.id);
  const { data: job, error: jobError } = await db
    .from("jobs")
    .insert({
      company_id: companyId,
      driver_id: driver.id,
      vehicle_id: vehicle.id,
      reference: `${marker}-JOB`,
      description: marker,
      pickup_location: "Staging depot",
      dropoff_location: "Staging customer",
      status: "assigned",
      priority: "normal",
    })
    .select("id")
    .single();
  if (jobError) throw jobError;
  const { data: device, error: deviceError } = await db
    .from("driver_app_devices")
    .insert({
      company_id: companyId,
      driver_id: driver.id,
      device_id: `${marker}-DEVICE`,
      app_version: "phase35-test",
    })
    .select("id")
    .single();
  if (deviceError) throw deviceError;
  const { data: session, error: sessionError } = await db
    .from("driver_navigation_sessions")
    .insert({
      company_id: companyId,
      driver_id: driver.id,
      state: "active",
      gps_state: "unknown",
      metadata: { marker },
    })
    .select("id")
    .single();
  if (sessionError) throw sessionError;
  const { data: routePack, error: routeError } = await db
    .from("driver_route_packs")
    .insert({
      company_id: companyId,
      driver_id: driver.id,
      trip_id: null,
      version: 1,
      state: "ready",
      expected_bytes: 128,
      downloaded_bytes: 128,
      integrity_hash: "abcdef1234567890",
      metadata: { marker, simulated: true },
    })
    .select("id")
    .single();
  if (routeError) throw routeError;
  await db.from("driver_route_pack_versions").insert({
    company_id: companyId,
    route_pack_id: routePack.id,
    version: 1,
    route_geometry: [
      { latitude: -29.85, longitude: 31.02 },
      { latitude: -29.86, longitude: 31.03 },
    ],
    stops: [{ reference: `${marker}-STOP`, address: "Staging customer", job_id: job.id }],
    destination: { address: "Staging customer" },
    metadata: { marker, simulated: true },
    integrity_hash: "abcdef1234567890",
  });
  console.log(
    JSON.stringify({
      marker,
      companyId,
      userId,
      driverId: driver.id,
      vehicleId: vehicle.id,
      jobId: job.id,
      deviceId: device.id,
      sessionId: session.id,
      routePackId: routePack.id,
    }),
  );
}

async function cleanup() {
  const { data: userPage } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = userPage?.users.find((candidate) => candidate.email === email);
  const { data: drivers } = await supabase
    .from("drivers")
    .select("id,company_id")
    .eq("notes", marker);
  const driverIds = (drivers || []).map((driver) => driver.id);
  if (driverIds.length) {
    await supabase.from("driver_offline_queue_items").delete().in("driver_id", driverIds);
    await supabase.from("driver_route_packs").delete().in("driver_id", driverIds);
    await supabase.from("driver_navigation_sessions").delete().in("driver_id", driverIds);
    await supabase.from("driver_app_devices").delete().in("driver_id", driverIds);
    await supabase.from("jobs").delete().in("driver_id", driverIds);
    await supabase.from("vehicles").delete().in("assigned_driver_id", driverIds);
    await supabase.from("drivers").delete().in("id", driverIds);
  }
  await supabase.from("vehicles").delete().like("registration", `${marker}%`);
  if (user && user.email !== process.env.E2E_ADMIN_EMAIL) {
    const companyIds = [...new Set((drivers || []).map((driver) => driver.company_id))];
    if (companyIds.length) {
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user.id)
        .in("company_id", companyIds);
      await supabase
        .from("company_members")
        .delete()
        .eq("user_id", user.id)
        .in("company_id", companyIds);
    }
    await supabase.from("profiles").delete().eq("id", user.id);
    await supabase.auth.admin.deleteUser(user.id);
  }
}

if (process.argv[2] === "cleanup") await cleanup();
else await setup();
