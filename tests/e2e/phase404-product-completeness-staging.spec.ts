import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const email = process.env.E2E_ADMIN_EMAIL ?? process.env.ZAPPOS_STAGING_TEST_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD ?? process.env.ZAPPOS_STAGING_TEST_PASSWORD;
const enabled =
  process.env.ZAPPOS_RUN_PHASE404_STAGING_E2E === "true" || Boolean(email && password);
const technicianPassword = "Phase404-Technician-Only!";
const notificationCategories = ["jobs", "incidents", "messages", "compliance", "sync", "system"];
const runId = Date.now();
let companyId = "";
let vehicleId = "";
let deviceId = "";
let technicianId = "";
let technicianEmail = "";
let reference = "";
let adminId = "";
let jobId = "";

async function requireNoError<T extends { error: unknown }>(result: T) {
  if (result.error) throw result.error;
  return result;
}

async function signIn(page: Page) {
  if (!email || !password) throw new Error("Missing Phase 40.4 staging credentials");
  await page.goto("/auth");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.waitForLoadState("networkidle");
}

test.describe("Phase 40.4 authenticated product completion", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!enabled, "requires explicit Phase 40.4 staging opt-in");
  test.beforeAll(async () => {
    if (!email || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
      throw new Error("Missing Phase 40.4 fixture authority");
    const service = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    const users = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (users.error) throw users.error;
    const admin = users.data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email.toLowerCase(),
    );
    if (!admin) throw new Error("Phase 40.4 browser administrator is unavailable");
    adminId = admin.id;
    const profile = await requireNoError(
      await service.from("profiles").select("active_company_id").eq("id", admin.id).single(),
    );
    companyId = profile.data.active_company_id;
    if (!companyId) throw new Error("Phase 40.4 browser administrator has no active company");

    technicianEmail = `phase404-technician-${runId}@example.test`;
    const technician = await service.auth.admin.createUser({
      email: technicianEmail,
      password: technicianPassword,
      email_confirm: true,
      user_metadata: { controlled_staging: true },
    });
    if (technician.error) throw technician.error;
    technicianId = technician.data.user.id;
    for (const write of await Promise.all([
      service.from("profiles").upsert({
        id: technicianId,
        active_company_id: companyId,
        full_name: "Phase 40.4 Controlled Staging Technician",
      }),
      service.from("company_members").insert({ company_id: companyId, user_id: technicianId }),
      service
        .from("user_roles")
        .insert({ company_id: companyId, user_id: technicianId, role: "technician" }),
    ]))
      if (write.error) throw write.error;

    const vehicle = await requireNoError(
      await service
        .from("vehicles")
        .insert({
          company_id: companyId,
          registration: `P404-${runId}`,
          vehicle_type: "van",
          status: "available",
          notes: "CONTROLLED STAGING FIXTURE",
        })
        .select("id")
        .single(),
    );
    vehicleId = vehicle.data.id;
    const device = await requireNoError(
      await service
        .from("devices")
        .insert({
          company_id: companyId,
          serial_number: `P404DEVICE${runId}`,
          device_type: "ZAPP_BOX",
          hardware_model: "ZAPP_BOX_PHASE404",
          firmware_version: "40.4.0-staging",
          simulated: false,
          simulation_label: "CONTROLLED STAGING RECORD — PHYSICAL HARDWARE UNAVAILABLE",
          status: "unprovisioned",
          telemetry_source: "ZAPP_BOX",
          metadata: { controlled_staging: true, physical_hardware_available: false },
        })
        .select("id,hardware_model_normalized")
        .single(),
    );
    deviceId = device.data.id;
    if (!password || !process.env.SUPABASE_PUBLISHABLE_KEY)
      throw new Error("Missing browser administrator password or publishable key");
    const governedAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: false } },
    );
    await requireNoError(await governedAdmin.auth.signInWithPassword({ email, password }));
    const existingFirmware = await requireNoError(
      await governedAdmin
        .from("device_firmware_versions")
        .select("id")
        .eq("company_id", companyId)
        .eq("hardware_model", "ZAPP_BOX_PHASE404")
        .eq("version", "40.4.0-staging")
        .eq("channel", "stable")
        .maybeSingle(),
    );
    if (!existingFirmware.data)
      await requireNoError(
        await governedAdmin.from("device_firmware_versions").insert({
          company_id: companyId,
          hardware_model: "ZAPP_BOX_PHASE404",
          version: "40.4.0-staging",
          channel: "stable",
          status: "approved",
          approved_by: admin.id,
          approved_at: new Date().toISOString(),
          release_notes: "Controlled staging compatibility record",
        }),
      );
    reference = `PHASE404-BROWSER-${runId}`;
  });

  test("Field Deployment loads its real authority without browser or network errors", async ({
    page,
  }) => {
    const browserErrors: string[] = [];
    const failedRequests: string[] = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText ?? "";
      const expectedGuardCancellation =
        request.method() === "HEAD" &&
        failure === "net::ERR_ABORTED" &&
        /\/(company_members|customer_portal_memberships)\?/.test(request.url());
      if (!expectedGuardCancellation)
        failedRequests.push(`${request.method()} ${request.url()} ${failure}`);
    });

    await signIn(page);
    await page.goto("/field-deployment");
    await expect(page.getByRole("heading", { name: "Fitment operations" })).toBeVisible();
    await expect(page.getByText("Deployment planning")).toBeVisible();
    await expect(page.getByLabel("Search deployments")).toBeVisible();
    await expect(page.getByRole("button", { name: "Technician work" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Checklist" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tests" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Supervisor" })).toBeVisible();

    expect(browserErrors, browserErrors.join("\n")).toEqual([]);
    expect(failedRequests, failedRequests.join("\n")).toEqual([]);
  });

  test("admin creates the assigned deployment and technician progress survives reauthentication", async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await signIn(page);
    await page.goto("/field-deployment");
    await page.getByRole("button", { name: "Create deployment" }).click();
    await page.getByLabel("Deployment reference").fill(reference);
    await page.getByLabel("Deployment project").fill("CONTROLLED STAGING — hardware unavailable");
    await page.getByLabel("Deployment site").fill("Phase 40.4 isolated staging site");
    await page.getByLabel("Deployment vehicle").selectOption(vehicleId);
    await page.getByLabel("Deployment physical device").selectOption(deviceId);
    await page.getByLabel("Deployment technician").selectOption(technicianId);
    await page
      .getByLabel("Deployment scheduled start")
      .fill(new Date(Date.now() + 3_600_000).toISOString().slice(0, 16));
    await page.getByLabel("Deployment installer notes").fill("CONTROLLED STAGING FIXTURE");
    await page.getByRole("button", { name: "Create deployment", exact: true }).last().click();
    await expect(page.getByText(reference, { exact: true }).first()).toBeVisible();
    await expect(page.getByText("technician assigned", { exact: true }).last()).toBeVisible();
    const service = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
    const createdJob = await requireNoError(
      await service
        .from("device_fitment_jobs")
        .select("id")
        .eq("company_id", companyId)
        .eq("reference", reference)
        .single(),
    );
    jobId = createdJob.data.id;
    const adminApi = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false } },
    );
    await requireNoError(
      await adminApi.auth.signInWithPassword({ email: email!, password: password! }),
    );
    await requireNoError(
      await adminApi.rpc("mark_field_deployment_controlled_staging", {
        _company_id: companyId,
        _fitment_job_id: jobId,
        _reason: "Phase 40.4 isolated browser validation; physical hardware unavailable",
      }),
    );

    await page.getByRole("button", { name: "Sign out" }).first().click();
    await expect(page).toHaveURL(/\/auth$/);
    await page.getByLabel("Email").fill(technicianEmail);
    await page.getByLabel("Password").fill(technicianPassword);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/field-deployment");
    await expect(page.getByText(reference, { exact: true })).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Create deployment" })).toHaveCount(0);
    await page.getByRole("button", { name: "Mark en route" }).click();
    await page.getByRole("button", { name: "Mark on site" }).click();
    await page.getByRole("button", { name: "Start installation" }).click();
    await page.getByRole("button", { name: "Block" }).click();
    await page.getByRole("button", { name: "Require revisit" }).click();
    await page.reload();
    await expect(page.getByText("revisit required", { exact: true }).last()).toBeVisible();
    await page.getByRole("button", { name: "Reschedule revisit" }).click();
    await page.getByRole("button", { name: "Mark en route" }).click();
    await page.getByRole("button", { name: "Mark on site" }).click();
    await page.getByRole("button", { name: "Start installation" }).click();

    await page.getByRole("button", { name: "Checklist" }).click();
    const passButtons = page.getByRole("button", { name: "Pass step" });
    const pendingSteps = await passButtons.count();
    for (let remaining = pendingSteps; remaining > 0; remaining -= 1) {
      await expect(passButtons.first()).toBeEnabled();
      await passButtons.first().click();
      await expect(passButtons).toHaveCount(remaining - 1);
    }
    await page.reload();
    await page.getByRole("button", { name: "Checklist" }).click();
    await expect(page.getByText("passed", { exact: true })).toHaveCount(14);

    await page.getByRole("button", { name: "Sign out" }).first().click();
    await page.getByLabel("Email").fill(technicianEmail);
    await page.getByLabel("Password").fill(technicianPassword);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.waitForLoadState("networkidle");
    await page.goto("/field-deployment");
    await expect(page.getByText("installation started", { exact: true }).last()).toBeVisible();

    const missingEvidenceResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/rest/v1/rpc/transition_field_deployment_stage") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Confirm hardware installed" }).click();
    const missingEvidence = await missingEvidenceResponse;
    expect(missingEvidence.status()).toBe(400);
    expect((await missingEvidence.json()).message).toContain("Installation evidence is required");
    await expect(
      page.getByText("Installation evidence is required before advancing"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Retry" }).click();
    await page.getByRole("button", { name: "Supervisor" }).click();
    await page.getByLabel("Installation evidence file").setInputFiles({
      name: "controlled-staging-installation.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("CONTROLLED STAGING EVIDENCE — physical hardware unavailable"),
    });
    await expect(page.getByText("technician declaration", { exact: true })).toBeVisible();
    await page.getByLabel("Installation evidence file").setInputFiles([]);
    await page.getByLabel("Installation evidence file").setInputFiles({
      name: "controlled-staging-installation.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("CONTROLLED STAGING EVIDENCE — physical hardware unavailable"),
    });
    await expect
      .poll(async () => {
        const evidenceRows = await requireNoError(
          await service
            .from("fitment_evidence")
            .select("id", { count: "exact", head: true })
            .eq("company_id", companyId)
            .eq("fitment_job_id", jobId),
        );
        return evidenceRows.count;
      })
      .toBe(1);

    await page.getByRole("button", { name: "Fitment jobs" }).click();
    await page.getByRole("button", { name: "Confirm hardware installed" }).click();
    await expect(page.getByText("hardware installed", { exact: true }).last()).toBeVisible();
    await page.getByRole("button", { name: "Tests" }).click();
    const recordControlledTest = async (category: string, value: string, unit: string) => {
      const recordedCards = page.getByText(`${category} - ${category} field check`, {
        exact: true,
      });
      const before = await recordedCards.count();
      await page.getByLabel("Test category").selectOption(category);
      await page.getByLabel("Test result").selectOption("passed");
      await page.getByLabel("Test measured value").fill(value);
      await page.getByLabel("Test unit").fill(unit);
      await page.getByLabel("Test technician notes").fill("Controlled staging observation");
      if (!(await page.getByLabel("Controlled staging hardware unavailable").isChecked()))
        await page.getByLabel("Controlled staging hardware unavailable").check();
      await expect(page.getByLabel("Test category")).toHaveValue(category);
      await expect(page.getByLabel("Test result")).toHaveValue("passed");
      await expect(page.getByLabel("Controlled staging hardware unavailable")).toBeChecked();
      await page.waitForTimeout(100);
      const acknowledged = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          response.url().includes("/rest/v1/fitment_test_results"),
      );
      await page.getByRole("button", { name: "Record immutable test" }).click();
      const response = await acknowledged;
      expect(response.ok()).toBe(true);
      const submitted = response.request().postDataJSON();
      expect(submitted.test_category).toBe(category);
      expect(submitted.result).toBe("passed");
      expect(submitted.metadata.controlled_staging).toBe(true);
      await expect(recordedCards).toHaveCount(before + 1);
    };
    await recordControlledTest("power", "12.4", "V");
    await recordControlledTest("ignition", "1", "observed transition");
    await recordControlledTest("connectivity", "1", "controlled observation");
    await recordControlledTest("gnss", "1", "controlled observation");
    await recordControlledTest("telemetry", "1", "controlled observation");
    await page.getByRole("button", { name: "Record hardware-unavailable road test" }).click();
    await expect(page.getByText("Hardware unavailable — not activation eligible")).toBeVisible();

    await page.getByRole("button", { name: "Fitment jobs" }).click();
    await page.getByRole("button", { name: "Verify connectivity" }).click();
    await page.getByRole("button", { name: "Verify GPS" }).click();
    await page.getByRole("button", { name: "Verify telemetry" }).click();
    await page.getByRole("button", { name: "Submit for QA review" }).click();
    await expect(page.getByText("qa review", { exact: true }).last()).toBeVisible();
    await expect(page.getByRole("button", { name: "Activate" })).toHaveCount(0);

    const technicianApi = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false } },
    );
    await requireNoError(
      await technicianApi.auth.signInWithPassword({
        email: technicianEmail,
        password: technicianPassword,
      }),
    );
    const authorisedJobs = await requireNoError(
      await technicianApi
        .from("device_fitment_jobs")
        .select("id,technician_user_id")
        .eq("company_id", companyId),
    );
    expect(authorisedJobs.data.length).toBeGreaterThan(0);
    expect(authorisedJobs.data.every((job) => job.technician_user_id === technicianId)).toBe(true);
    const deniedActivation = await technicianApi.rpc("transition_field_deployment_stage", {
      _company_id: companyId,
      _fitment_job_id: jobId,
      _next_stage: "activated",
      _reason: null,
    });
    expect(deniedActivation.error?.message).toContain("Manager approval");
    const wrongDeployment = await technicianApi.rpc("transition_field_deployment_stage", {
      _company_id: companyId,
      _fitment_job_id: crypto.randomUUID(),
      _next_stage: "en_route",
      _reason: null,
    });
    expect(wrongDeployment.error?.message).toContain("Deployment was not found");
    const wrongCompany = await technicianApi.rpc("transition_field_deployment_stage", {
      _company_id: crypto.randomUUID(),
      _fitment_job_id: jobId,
      _next_stage: "activated",
      _reason: null,
    });
    expect(wrongCompany.error?.message).toContain("Deployment was not found");

    await page.getByRole("button", { name: "Sign out" }).first().click();
    await signIn(page);
    await page.goto("/field-deployment");
    await page.getByLabel("Search deployments").fill(reference);
    await page.getByText(reference, { exact: true }).first().click();
    await page.getByRole("button", { name: "Activate" }).click();
    await page.getByRole("button", { name: "Complete and hand over" }).click();
    await expect(page.getByText("completed", { exact: true }).last()).toBeVisible();
    await page.getByRole("button", { name: "Inventory" }).click();
    await expect(page.getByText("ZAPP_BOX_PHASE404", { exact: true })).toBeVisible();
    await expect(page.getByText(`Assigned vehicle P404-${runId}`, { exact: true })).toBeVisible();
    await expect(page.getByText("Physical device candidate", { exact: true })).toBeVisible();

    const persisted = await requireNoError(
      await service
        .from("device_vehicle_assignments")
        .select("device_id,vehicle_id,status,simulated,reason")
        .eq("company_id", companyId)
        .eq("device_id", deviceId)
        .eq("vehicle_id", vehicleId)
        .eq("status", "active")
        .single(),
    );
    expect(persisted.data.simulated).toBe(true);
    expect(persisted.data.reason).toContain("CONTROLLED STAGING");
    const device = await requireNoError(
      await service.from("devices").select("status").eq("id", deviceId).single(),
    );
    expect(device.data.status).toBe("unprovisioned");

    const failedJob = await requireNoError(
      await adminApi
        .from("device_fitment_jobs")
        .insert({
          company_id: companyId,
          reference: `${reference}-FAILED-HARDWARE`,
          vehicle_id: vehicleId,
          device_id: deviceId,
          technician_user_id: technicianId,
          status: "awaiting_supervisor",
          workflow_stage: "qa_review",
          controlled_staging: true,
          scheduled_at: new Date().toISOString(),
          notes: "CONTROLLED STAGING NEGATIVE FIXTURE — critical hardware failure",
        })
        .select("id")
        .single(),
    );
    await requireNoError(
      await adminApi.from("fitment_test_results").insert({
        company_id: companyId,
        fitment_job_id: failedJob.data.id,
        technician_user_id: technicianId,
        test_category: "power",
        test_type: "critical negative activation gate",
        critical: true,
        result: "failed",
        source: "manual_measurement",
        notes: "Controlled negative fixture; no physical result claimed",
        metadata: { controlled_staging: true, physical_hardware_available: false },
      }),
    );
    const failedHardwareActivation = await adminApi.rpc("transition_field_deployment_stage", {
      _company_id: companyId,
      _fitment_job_id: failedJob.data.id,
      _next_stage: "activated",
      _reason: "negative activation-gate proof",
    });
    expect(failedHardwareActivation.error?.message).toMatch(/critical (hardware )?tests/i);
    const repeatCompletion = await adminApi.rpc("transition_field_deployment_stage", {
      _company_id: companyId,
      _fitment_job_id: jobId,
      _next_stage: "completed",
      _reason: null,
    });
    expect(repeatCompletion.error?.message).toContain("Invalid deployment stage transition");
  });

  test("Settings persists every editable admin value across refresh and reauthentication", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await signIn(page);
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    const saveWithRpc = async (rpcName: string) => {
      const acknowledged = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          response.url().includes(`/rest/v1/rpc/${rpcName}`),
      );
      await page.getByRole("button", { name: "Save changes" }).click();
      expect((await acknowledged).ok()).toBe(true);
      await expect(page.getByText("Settings saved").last()).toBeVisible();
      await expect(page.getByRole("button", { name: "Save changes" })).toBeEnabled();
    };

    const suffix = String(runId).slice(-6);
    const expected = {
      fullName: `Phase 40.4 Admin ${suffix}`,
      phone: `+1555${suffix}`,
      companyName: `Phase 40.4 Company ${suffix}`,
      country: "Controlled staging",
      terminology: "deliveries",
      warningDays: "47",
      liveSeconds: "75",
      recentSeconds: "360",
      offlineSeconds: "2100",
      refreshSeconds: "45",
      timezone: "Etc/UTC",
    };

    await page.getByLabel("Full name").fill(expected.fullName);
    await page.getByLabel("Phone").fill(expected.phone);
    await saveWithRpc("update_my_profile_settings");

    await page.getByRole("tab", { name: "Company" }).click();
    await page.getByLabel("Company name").fill(expected.companyName);
    await page.getByLabel("Country").fill(expected.country);
    await page.getByLabel("Terminology").selectOption(expected.terminology);
    await page.getByLabel("Document expiry warning (days)").fill(expected.warningDays);
    await saveWithRpc("update_company_settings");

    await page.getByRole("tab", { name: "Operations" }).click();
    await page.getByLabel("Live threshold (seconds)").fill(expected.liveSeconds);
    await page.getByLabel("Recent threshold (seconds)").fill(expected.recentSeconds);
    await page.getByLabel("Offline threshold (seconds)").fill(expected.offlineSeconds);
    await page.getByLabel("Map refresh (seconds)").fill(expected.refreshSeconds);
    await page.getByLabel("Timezone").fill(expected.timezone);
    await saveWithRpc("upsert_tracking_settings");

    await page.getByRole("tab", { name: "Notifications" }).click();
    const notificationExpected = new Map<string, boolean>();
    for (const category of notificationCategories) {
      const enabled = page.getByLabel(`Enable ${category} notifications`);
      const background = page.getByLabel(`Allow ${category} in background`);
      const nextEnabled = !(await enabled.isChecked());
      const nextBackground = !(await background.isChecked());
      notificationExpected.set(`enabled:${category}`, nextEnabled);
      notificationExpected.set(`background:${category}`, nextBackground);
      await enabled.setChecked(nextEnabled);
      await background.setChecked(nextBackground);
    }
    const notificationResponses: number[] = [];
    page.on("response", (response) => {
      if (response.url().includes("/rest/v1/rpc/upsert_my_notification_setting"))
        notificationResponses.push(response.status());
    });
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Settings saved").last()).toBeVisible();
    await expect(page.getByRole("button", { name: "Save changes" })).toBeEnabled();
    await expect.poll(() => notificationResponses.length).toBe(6);
    expect(notificationResponses).toEqual([200, 200, 200, 200, 200, 200]);

    await page.reload();
    await page.getByRole("tab", { name: "Company" }).click();
    await expect(page.getByLabel("Company name")).toHaveValue(expected.companyName);
    await page.getByRole("tab", { name: "Operations" }).click();
    await expect(page.getByLabel("Timezone")).toHaveValue(expected.timezone);
    await page.getByRole("tab", { name: "Notifications" }).click();
    for (const category of notificationCategories) {
      await expect(page.getByLabel(`Enable ${category} notifications`)).toHaveAttribute(
        "data-state",
        notificationExpected.get(`enabled:${category}`) ? "checked" : "unchecked",
      );
      await expect(page.getByLabel(`Allow ${category} in background`)).toHaveAttribute(
        "data-state",
        notificationExpected.get(`background:${category}`) ? "checked" : "unchecked",
      );
    }

    await page.getByRole("button", { name: "Sign out" }).first().click();
    await signIn(page);
    await page.goto("/settings");
    await expect(page.getByLabel("Full name")).toHaveValue(expected.fullName);
    await expect(page.getByLabel("Phone")).toHaveValue(expected.phone);
    await page.getByRole("tab", { name: "Company" }).click();
    await expect(page.getByLabel("Company name")).toHaveValue(expected.companyName);
    await expect(page.getByLabel("Country")).toHaveValue(expected.country);
    await expect(page.getByLabel("Terminology")).toHaveValue(expected.terminology);
    await expect(page.getByLabel("Document expiry warning (days)")).toHaveValue(
      expected.warningDays,
    );
    await page.getByRole("tab", { name: "Operations" }).click();
    await expect(page.getByLabel("Live threshold (seconds)")).toHaveValue(expected.liveSeconds);
    await expect(page.getByLabel("Recent threshold (seconds)")).toHaveValue(expected.recentSeconds);
    await expect(page.getByLabel("Offline threshold (seconds)")).toHaveValue(
      expected.offlineSeconds,
    );
    await expect(page.getByLabel("Map refresh (seconds)")).toHaveValue(expected.refreshSeconds);
    await expect(page.getByLabel("Timezone")).toHaveValue(expected.timezone);
    await page.getByRole("tab", { name: "Notifications" }).click();
    for (const category of notificationCategories) {
      await expect(page.getByLabel(`Enable ${category} notifications`)).toHaveAttribute(
        "data-state",
        notificationExpected.get(`enabled:${category}`) ? "checked" : "unchecked",
      );
      await expect(page.getByLabel(`Allow ${category} in background`)).toHaveAttribute(
        "data-state",
        notificationExpected.get(`background:${category}`) ? "checked" : "unchecked",
      );
    }
  });

  test("Settings exposes member preferences but server-denies technician administration", async ({
    page,
  }) => {
    await page.goto("/auth");
    await page.getByLabel("Email").fill(technicianEmail);
    await page.getByLabel("Password").fill(technicianPassword);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/settings");
    await expect(page.getByRole("tab", { name: "My account" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Notifications" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Company" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Operations" })).toHaveCount(0);

    const technicianApi = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false } },
    );
    await requireNoError(
      await technicianApi.auth.signInWithPassword({
        email: technicianEmail,
        password: technicianPassword,
      }),
    );
    const companyDenied = await technicianApi.rpc("update_company_settings", {
      _company_id: companyId,
      _name: "Denied technician write",
      _country: "Denied",
      _terminology: "jobs",
      _document_expiry_warning_days: 30,
    });
    expect(companyDenied.error?.message).toContain("Administrator access is required");
    const operationsDenied = await technicianApi.rpc("upsert_tracking_settings", {
      _company_id: companyId,
      _live_seconds: 60,
      _recent_seconds: 300,
      _offline_seconds: 1800,
      _tracking_refresh_seconds: 30,
      _timezone: "Etc/UTC",
    });
    expect(operationsDenied.error?.message).toContain("Fleet administrator access is required");
  });
});
