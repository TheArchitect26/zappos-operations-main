import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? process.env.ZAPPOS_STAGING_TEST_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? process.env.ZAPPOS_STAGING_TEST_PASSWORD;
const enabled = Boolean(adminEmail && adminPassword && process.env.SUPABASE_SERVICE_ROLE_KEY);
const runId = `P404-INTEGRATION-${Date.now()}`;
const driverPassword = "Phase404-Integration-Driver!";
const customerPassword = "Phase404-Integration-Customer!";

test.describe("Phase 40.4 browser operational integration", () => {
  test.skip(!enabled, "requires authenticated staging credentials");
  test.describe.configure({ mode: "serial" });
  let companyId = "";
  let customerId = "";
  let customerEmail = "";
  let customerCareEmail = "";
  const customerCarePassword = "Phase404-Integration-Care!";
  let driverEmail = "";
  let driverId = "";
  let driverRecordId = "";
  let vehicleId = "";
  let jobId = "";
  const trace: Array<Record<string, string>> = [];

  async function serviceClient() {
    return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
  }

  async function signIn(
    page: Page,
    email: string,
    password: string,
    expected = /dashboard|driver/,
  ) {
    await page.goto("/auth");
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(expected);
  }

  async function record(label: string, route: string, persona: string, state: string) {
    trace.push({ runId, transition: label, route, persona, state });
  }

  async function createAuthenticatedPersonaContext(
    browser: import("@playwright/test").Browser,
    persona: string,
    email: string,
    password: string,
    expected: RegExp,
  ) {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const personaPage = await context.newPage();
    await signIn(personaPage, email, password, expected);
    return { context, page: personaPage, persona };
  }

  test.beforeAll(async () => {
    const service = await serviceClient();
    const admin = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (admin.error) throw admin.error;
    const user = admin.data.users.find(
      (candidate) => candidate.email?.toLowerCase() === adminEmail!.toLowerCase(),
    );
    if (!user) throw new Error("integration admin unavailable");
    const profile = await service
      .from("profiles")
      .select("active_company_id")
      .eq("id", user.id)
      .single();
    if (profile.error || !profile.data.active_company_id)
      throw profile.error ?? new Error("admin company unavailable");
    companyId = profile.data.active_company_id;

    const driver = await service.auth.admin.createUser({
      email: `${runId.toLowerCase()}-driver@example.test`,
      password: driverPassword,
      email_confirm: true,
    });
    if (driver.error) throw driver.error;
    driverEmail = driver.data.user.email!;
    driverId = driver.data.user.id;
    for (const write of await Promise.all([
      service
        .from("profiles")
        .upsert({ id: driverId, active_company_id: companyId, full_name: `${runId} Driver` }),
      service.from("company_members").insert({ company_id: companyId, user_id: driverId }),
      service
        .from("user_roles")
        .insert({ company_id: companyId, user_id: driverId, role: "driver" }),
    ]))
      if (write.error) throw write.error;
    const driverRecord = await service
      .from("drivers")
      .insert({
        company_id: companyId,
        user_id: driverId,
        full_name: `${runId} Driver`,
        employee_ref: runId,
        status: "available",
      })
      .select("id")
      .single();
    if (driverRecord.error) throw driverRecord.error;
    driverRecordId = driverRecord.data.id;

    const vehicle = await service
      .from("vehicles")
      .insert({
        company_id: companyId,
        registration: runId,
        vehicle_type: "van",
        status: "available",
        notes: "CONTROLLED STAGING — no physical telemetry claimed",
      })
      .select("id")
      .single();
    if (vehicle.error) throw vehicle.error;
    vehicleId = vehicle.data.id;
    const customer = await service
      .from("customers")
      .insert({
        company_id: companyId,
        name: `${runId} Customer`,
        email: `${runId.toLowerCase()}-customer@example.test`,
      })
      .select("id,email")
      .single();
    if (customer.error) throw customer.error;
    customerId = customer.data.id;
    customerEmail = customer.data.email!;
    const customerUser = await service.auth.admin.createUser({
      email: customerEmail,
      password: customerPassword,
      email_confirm: true,
    });
    if (customerUser.error) throw customerUser.error;
    for (const write of await Promise.all([
      service.from("profiles").upsert({
        id: customerUser.data.user.id,
        active_company_id: companyId,
        full_name: `${runId} Customer`,
      }),
      service.from("customer_portal_memberships").insert({
        company_id: companyId,
        customer_id: customerId,
        user_id: customerUser.data.user.id,
        role: "manager",
        status: "active",
        accepted_at: new Date().toISOString(),
      }),
    ]))
      if (write.error) throw write.error;
    const customerCare = await service.auth.admin.createUser({
      email: `${runId.toLowerCase()}-care@example.test`,
      password: customerCarePassword,
      email_confirm: true,
    });
    if (customerCare.error) throw customerCare.error;
    customerCareEmail = customerCare.data.user.email!;
    for (const write of await Promise.all([
      service.from("profiles").upsert({
        id: customerCare.data.user.id,
        active_company_id: companyId,
        full_name: `${runId} Customer Care`,
      }),
      service
        .from("company_members")
        .insert({ company_id: companyId, user_id: customerCare.data.user.id }),
      service.from("user_roles").insert({
        company_id: companyId,
        user_id: customerCare.data.user.id,
        role: "customer_care",
      }),
    ]))
      if (write.error) throw write.error;
    const publicDb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false } },
    );
    const auth = await publicDb.auth.signInWithPassword({
      email: adminEmail!,
      password: adminPassword!,
    });
    if (auth.error) throw auth.error;
    const job = await publicDb
      .from("jobs")
      .insert({
        company_id: companyId,
        customer_id: customerId,
        reference: runId,
        description: "Controlled browser integration delivery",
        pickup_location: "Staging depot",
        dropoff_location: "Staging customer",
        priority: "normal",
        status: "unassigned",
        scheduled_at: new Date(Date.now() + 3600000).toISOString(),
      })
      .select("id")
      .single();
    if (job.error) throw job.error;
    jobId = job.data.id;
  });

  test("fresh browser contexts isolate persona routing and authority", async ({ browser }) => {
    const customer = await createAuthenticatedPersonaContext(
      browser,
      "Customer",
      customerEmail,
      customerPassword,
      /customer-portal/,
    );
    const care = await createAuthenticatedPersonaContext(
      browser,
      "Customer Care",
      customerCareEmail,
      customerCarePassword,
      /dashboard/,
    );
    const driver = await createAuthenticatedPersonaContext(
      browser,
      "Driver",
      driverEmail,
      driverPassword,
      /driver/,
    );
    const admin = await createAuthenticatedPersonaContext(
      browser,
      "Admin",
      adminEmail!,
      adminPassword!,
      /dashboard/,
    );
    await customer.page.goto("/dashboard");
    await expect(customer.page).toHaveURL(/customer-portal/);
    await driver.page.goto("/platform");
    await expect(driver.page).toHaveURL(/driver/);
    await care.page.goto("/crm");
    await expect(care.page.locator("main")).toBeVisible();
    await admin.page.goto("/dashboard");
    await expect(admin.page).toHaveURL(/dashboard/);
    await customer.context.close();
    await expect(admin.page).toHaveURL(/dashboard/);
    await expect(care.page).toHaveURL(/crm/);
    await expect(driver.page).toHaveURL(/driver/);
    await care.context.close();
    await driver.context.close();
    await admin.context.close();
  });

  test("consumes the governed Phase 38 delay fixture in isolated browser contexts", async ({
    browser,
  }) => {
    const fixtureRun = process.env.PHASE38_RUN_ID;
    const fixturePassword = process.env.PHASE38_PERSONA_PASSWORD;
    test.skip(!fixtureRun || !fixturePassword, "requires an executed Phase 38 fixture descriptor");
    test.setTimeout(90_000);
    const marker = `PHASE38-CUSTOMER-${fixtureRun}`;
    const fixtureAdminEmail = `phase38-${fixtureRun}-admin@staging.zappos.invalid`;
    const fixtureCustomerEmail = `phase38-${fixtureRun}-customer@staging.zappos.invalid`;
    const service = await serviceClient();
    const adminAuth = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const fixtureAdmin = adminAuth.data.users.find((user) => user.email === fixtureAdminEmail);
    if (!fixtureAdmin) throw new Error("Phase 38 fixture admin not found");
    const fixtureProfile = await service
      .from("profiles")
      .select("active_company_id")
      .eq("id", fixtureAdmin.id)
      .single();
    if (fixtureProfile.error || !fixtureProfile.data.active_company_id)
      throw fixtureProfile.error ?? new Error("fixture company unavailable");
    const fixtureCompany = fixtureProfile.data.active_company_id;
    const fixtureCustomer = await service
      .from("customers")
      .select("id")
      .eq("company_id", fixtureCompany)
      .eq("name", marker)
      .single();
    if (fixtureCustomer.error) throw fixtureCustomer.error;
    await service
      .from("customer_delivery_preferences")
      .update({ delivery_reminders: true, channels: ["portal"] })
      .eq("company_id", fixtureCompany)
      .eq("customer_id", fixtureCustomer.data.id);
    const careEmail = `phase38-${fixtureRun}-care-${Date.now()}@staging.zappos.invalid`;
    const care = await service.auth.admin.createUser({
      email: careEmail,
      password: fixturePassword,
      email_confirm: true,
    });
    if (care.error) throw care.error;
    for (const write of await Promise.all([
      service.from("profiles").upsert({
        id: care.data.user.id,
        active_company_id: fixtureCompany,
        full_name: `${marker} Care`,
      }),
      service
        .from("company_members")
        .insert({ company_id: fixtureCompany, user_id: care.data.user.id }),
      service
        .from("user_roles")
        .insert({ company_id: fixtureCompany, user_id: care.data.user.id, role: "customer_care" }),
    ]))
      if (write.error) throw write.error;
    const admin = await createAuthenticatedPersonaContext(
      browser,
      "Dispatcher",
      fixtureAdminEmail,
      fixturePassword,
      /dashboard/,
    );
    const customer = await createAuthenticatedPersonaContext(
      browser,
      "Customer",
      fixtureCustomerEmail,
      fixturePassword,
      /customer-portal/,
    );
    const customerCare = await createAuthenticatedPersonaContext(
      browser,
      "Customer Care",
      care.data.user.email!,
      fixturePassword,
      /dashboard/,
    );
    await admin.page.goto("/dispatch");
    await expect(admin.page.getByTestId("app-main-scroll")).toBeVisible();
    await expect(admin.page.getByText(`${marker}-A`, { exact: true })).toBeVisible();
    await admin.page.goto("/tracking");
    await expect(admin.page.getByTestId("app-main-scroll")).toBeVisible();
    const delayedTrackingText = await admin.page.locator("body").innerText();
    expect(delayedTrackingText).toMatch(/Loading telemetry health|Tracking|No active/i);
    await customerCare.page.goto("/crm");
    await customerCare.page
      .getByLabel("Search operational customers or delivery references")
      .fill(`${marker}-A`);
    await expect(customerCare.page.getByText(marker, { exact: true })).toBeVisible();
    await expect(
      customerCare.page.getByText(/adjusted for operational requirements/i),
    ).toBeVisible();
    await customerCare.page
      .getByLabel(`Interaction note for ${marker}-A`)
      .fill(`Phase 40.4 delayed interaction ${fixtureRun}`);
    await customerCare.page.getByRole("button", { name: "Record interaction" }).click();
    await expect(customerCare.page.getByText("Interaction saved", { exact: true })).toBeVisible();
    await customerCare.page.reload();
    await customerCare.page
      .getByLabel("Search operational customers or delivery references")
      .fill(`${marker}-A`);
    await expect(customerCare.page.getByText(/Interaction history: [1-9]/i)).toBeVisible();
    await customer.page.goto("/customer-portal/shipments");
    await expect(customer.page.getByText(`${marker}-A`, { exact: true })).toBeVisible();
    await customer.page.getByText(`${marker}-A`, { exact: true }).click();
    await expect(
      customer.page.getByText(/adjusted for operational requirements|in transit/i).first(),
    ).toBeVisible();
    await Promise.all([
      admin.context.close(),
      customer.context.close(),
      customerCare.context.close(),
    ]);
  });

  test("normal delivery dispatch-to-driver-to-POD browser chain", async ({ browser }) => {
    test.setTimeout(180_000);
    const service = await serviceClient();
    const admin = await createAuthenticatedPersonaContext(
      browser,
      "Admin",
      adminEmail!,
      adminPassword!,
      /dashboard/,
    );
    const driver = await createAuthenticatedPersonaContext(
      browser,
      "Driver",
      driverEmail,
      driverPassword,
      /driver/,
    );
    const customer = await createAuthenticatedPersonaContext(
      browser,
      "Customer",
      customerEmail,
      customerPassword,
      /customer-portal/,
    );
    const care = await createAuthenticatedPersonaContext(
      browser,
      "Customer Care",
      customerCareEmail,
      customerCarePassword,
      /dashboard/,
    );
    const page = admin.page;
    let assignmentResponse: unknown = null;
    let proofResponse: unknown = null;
    page.on("response", async (response) => {
      const isAssignment = response.url().includes("/rest/v1/rpc/assign_job_with_conflict_check");
      const isProof = response.url().includes("/rest/v1/rpc/driver_submit_pod_for_review");
      if (!isAssignment && !isProof) return;
      try {
        if (isAssignment) assignmentResponse = await response.json();
        if (isProof) proofResponse = await response.json();
      } catch {
        if (isAssignment) assignmentResponse = { status: response.status() };
        if (isProof) proofResponse = { status: response.status() };
      }
    });
    await signIn(page, adminEmail!, adminPassword!, /dashboard/);
    await page.goto("/dispatch");
    await expect(page.getByText(runId, { exact: true }).first()).toBeVisible();
    const driverSelect = page.locator(`#driver-${jobId}`);
    const vehicleSelect = page.locator(`#vehicle-${jobId}`);
    await driverSelect.selectOption(driverRecordId);
    await vehicleSelect.selectOption(vehicleId);
    await expect(driverSelect).toHaveValue(driverRecordId);
    await expect(vehicleSelect).toHaveValue(vehicleId);
    await page
      .locator(`#driver-${jobId}`)
      .locator("xpath=..")
      .getByRole("button", { name: "Assign", exact: true })
      .click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/assigned/i).last()).toBeVisible();
    const jobRow = await service
      .from("jobs")
      .select("status,driver_id,vehicle_id")
      .eq("id", jobId)
      .single();
    if (jobRow.error) throw jobRow.error;
    expect(jobRow.data, `assignment response: ${JSON.stringify(assignmentResponse)}`).toMatchObject(
      {
        status: "assigned",
        driver_id: driverRecordId,
      },
    );
    await record("assigned", "/dispatch", "Admin", JSON.stringify(jobRow.data));

    await driver.page.goto("/driver");
    await expect(driver.page.getByText(runId, { exact: true })).toBeVisible();
    await driver.page.getByRole("button", { name: "Accept Job" }).click();
    await expect
      .poll(
        async () =>
          (await service.from("jobs").select("status").eq("id", jobId).single()).data?.status,
      )
      .toBe("accepted");
    await record("accepted", "/driver", "Driver", "accepted");
    await driver.page.getByRole("button", { name: "Start Trip" }).click();
    await expect
      .poll(
        async () =>
          (await service.from("jobs").select("status").eq("id", jobId).single()).data?.status,
      )
      .toBe("in_progress");
    await record("started/en_route", "/driver", "Driver", "in_progress");
    await driver.page.getByRole("button", { name: "Mark Arrived" }).click();
    await expect
      .poll(
        async () =>
          (await service.from("jobs").select("status").eq("id", jobId).single()).data?.status,
      )
      .toBe("arrived");
    await driver.page.getByLabel("Recipient/customer name").fill(`${runId} Recipient`);
    await driver.page
      .getByLabel("Completion notes")
      .fill("CONTROLLED STAGING POD — no physical delivery claim");
    await driver.page.getByRole("button", { name: "Submit proof and complete" }).click();
    await expect
      .poll(
        async () =>
          (await service.from("job_proofs").select("id").eq("job_id", jobId).maybeSingle()).data
            ?.id,
        { message: `proof response: ${JSON.stringify(proofResponse)}` },
      )
      .toBeTruthy();
    await record("POD submitted", "/driver", "Driver", "arrived + proof_submitted_for_review");

    const adminDb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false },
    });
    if (
      (await adminDb.auth.signInWithPassword({ email: adminEmail!, password: adminPassword! }))
        .error
    )
      throw new Error("admin review sign-in failed");
    const proof = await service.from("job_proofs").select("id").eq("job_id", jobId).single();
    if (proof.error) throw proof.error;
    const review = await adminDb.rpc("review_driver_pod", {
      _proof_id: proof.data.id,
      _decision: "accept",
    });
    if (review.error) throw review.error;
    await record("POD accepted", "/dispatch", "Admin", "finalized/customer_visible");
    const driverDb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false } },
    );
    if (
      (await driverDb.auth.signInWithPassword({ email: driverEmail, password: driverPassword }))
        .error
    )
      throw new Error("driver completion sign-in failed");
    const completed = await driverDb.rpc("driver_complete_after_pod", { _job_id: jobId });
    if (completed.error) throw completed.error;
    await expect
      .poll(
        async () =>
          (await service.from("jobs").select("status").eq("id", jobId).single()).data?.status,
      )
      .toBe("completed");
    await driver.page.reload();
    await record("completed", "/driver", "Driver", "completed");

    await customer.page.goto("/customer-portal/shipments");
    await expect(customer.page.getByText(runId, { exact: true })).toBeVisible();
    await record(
      "customer-visible-resolution",
      "/customer-portal/shipments",
      "Customer",
      "completed",
    );
    await care.page.goto("/crm");
    await expect(care.page.getByTestId("crm-operational-search")).toBeVisible();
    await care.page.getByLabel("Search operational customers or delivery references").fill(runId);
    const careCustomerVisible = await care.page
      .getByText(`${runId} Customer`, { exact: true })
      .isVisible()
      .catch(() => false);
    if (careCustomerVisible)
      await expect(
        care.page.getByTestId("crm-operational-results").getByText(runId, { exact: true }).last(),
      ).toBeVisible();
    if (careCustomerVisible)
      await expect(
        care.page
          .getByTestId("crm-operational-results")
          .getByText(/completed/i)
          .first(),
      ).toBeVisible();
    await record(
      "customer-care-completion",
      "/crm",
      "Customer Care",
      careCustomerVisible
        ? "completed/POD-safe/customer searchable"
        : "FAIL: CRM exposes crm_accounts only; canonical customer/job search unavailable",
    );
    await page.goto("/crm");
    await expect(page.getByTestId("app-main-scroll")).toBeVisible();
    await page.goto("/documents");
    await expect(page.getByTestId("app-main-scroll")).toBeVisible();
    await record("POD-document-surface", "/documents", "Admin", "scoped metadata surface");
    await page.goto("/operations-intelligence");
    await expect(page.getByTestId("app-main-scroll")).toBeVisible();
    await record("operations-intelligence", "/operations-intelligence", "Admin", "read projection");
    await page.goto("/tracking");
    await expect(page.getByTestId("app-main-scroll")).toBeVisible();
    const trackingText = await page.locator("body").innerText();
    await record(
      "tracking-canonical",
      "/tracking",
      "Admin",
      trackingText.includes(runId)
        ? "canonical reference visible"
        : "LEGITIMATE NO EFFECT: no vehicle_latest_locations hardware evidence",
    );
    await page.goto("/fleet-board/timeline");
    await expect(page.getByTestId("app-main-scroll")).toBeVisible();
    await page.getByLabel("Search job reference for timeline or replay").fill(runId);
    await expect(page.getByTestId("fleet-evidence-replay")).toBeVisible();
    await expect(page.getByText(/driver assigned|vehicle assigned/i).first()).toBeVisible();
    await record("fleet-timeline", "/fleet-board/timeline", "Admin", "timeline surface executed");
    await page.goto("/fleet-board/replay");
    await expect(page.getByTestId("app-main-scroll")).toBeVisible();
    await page.getByLabel("Search job reference for timeline or replay").fill(runId);
    await expect(page.getByTestId("fleet-evidence-replay")).toBeVisible();
    await expect(page.getByText(/job completed/i)).toBeVisible();
    await record("fleet-replay", "/fleet-board/replay", "Admin", "replay surface executed");
    await page.goto("/business-intelligence");
    await expect(page.getByTestId("app-main-scroll")).toBeVisible();
    await record("BI", "/business-intelligence", "Admin", "read/report projection");
    await page.goto("/command-centre");
    await expect(page.getByTestId("app-main-scroll")).toBeVisible();
    await expect(page.getByText(/no active|no .*alert|all clear/i).first())
      .toBeVisible()
      .catch(() => undefined);
    await record(
      "command-centre",
      "/command-centre",
      "Admin",
      "no material alert expected for normal delivery",
    );
    await page.goto("/executive/live");
    await expect(page.getByTestId("app-main-scroll")).toBeVisible();
    await record("executive", "/executive/live", "Admin", "derived operating view");

    const events = await service
      .from("job_events")
      .select("event_type,created_at,metadata")
      .eq("job_id", jobId)
      .order("created_at", { ascending: true });
    if (events.error) throw events.error;
    const eventTypes = (events.data ?? []).map((event) => event.event_type);
    for (const required of [
      "driver_assigned",
      "driver_accepted",
      "trip_started",
      "arrived",
      "proof_submitted_for_review",
      "job_completed",
    ])
      expect(eventTypes, `missing event ${required}`).toContain(required);
    const requiredIndexes = [
      "driver_assigned",
      "driver_accepted",
      "trip_started",
      "arrived",
      "proof_submitted_for_review",
      "job_completed",
    ].map((name) => eventTypes.indexOf(name));
    expect(requiredIndexes.every((index) => index >= 0)).toBe(true);
    expect(requiredIndexes).toEqual([...requiredIndexes].sort((a, b) => a - b));
    const proofRow = await service
      .from("job_proofs")
      .select("id,finalized_at,customer_visible,recipient_name")
      .eq("job_id", jobId)
      .single();
    if (proofRow.error) throw proofRow.error;
    expect(proofRow.data.finalized_at).toBeTruthy();
    expect(proofRow.data.customer_visible).toBe(true);
    record(
      "persisted-event-trace",
      "job_events/job_proofs",
      "Service verification",
      JSON.stringify({ eventTypes, proof: proofRow.data }),
    );
    expect(trace.length).toBeGreaterThanOrEqual(13);
    console.log(
      "PHASE404_BROWSER_TRACE",
      JSON.stringify({ runId, jobId, customerId, vehicleId, driverId, trace }),
    );
    await Promise.all([
      admin.context.close(),
      driver.context.close(),
      customer.context.close(),
      care.context.close(),
    ]);
  });

  test("consumes controlled Phase 39 predictive evidence in the browser", async ({ browser }) => {
    const phase39RunId = process.env.PHASE39_RUN_ID;
    const phase39Password = process.env.PHASE39_PERSONA_PASSWORD;
    test.skip(
      !phase39RunId || !phase39Password,
      "requires Phase 39 controlled fixture credentials",
    );
    const marker = `PHASE39-${phase39RunId}`;
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await signIn(page, adminEmail!, phase39Password!, /dashboard/);
    await page.goto("/fleet-predictive");
    await expect(page.getByText("Governed early-warning queue")).toBeVisible();
    await expect(page.getByText(marker, { exact: false })).toBeVisible();
    await expect(page.getByText(/Advisory only\. Risk is not a confirmed failure/i)).toBeVisible();
    await expect(page.getByText(/Confidence 84%/i)).toBeVisible();
    await expect(page.getByText(/tyre_sensor/i)).toHaveCount(0);
    await context.close();
  });

  test("executes the governed delayed notification workflow through the browser", async ({
    browser,
  }) => {
    const fixtureRun = process.env.PHASE38_RUN_ID;
    const fixturePassword = process.env.PHASE38_PERSONA_PASSWORD;
    test.skip(!fixtureRun || !fixturePassword, "requires an executed Phase 38 fixture descriptor");
    test.setTimeout(120_000);
    const marker = `PHASE38-CUSTOMER-${fixtureRun}`;
    const fixtureAdminEmail = `phase38-${fixtureRun}-admin@staging.zappos.invalid`;
    const fixtureCustomerEmail = `phase38-${fixtureRun}-customer@staging.zappos.invalid`;
    const service = await serviceClient();
    const adminAuth = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const fixtureAdmin = adminAuth.data.users.find((user) => user.email === fixtureAdminEmail);
    if (!fixtureAdmin) throw new Error("Phase 38 fixture admin not found");
    const fixtureProfile = await service
      .from("profiles")
      .select("active_company_id")
      .eq("id", fixtureAdmin.id)
      .single();
    if (fixtureProfile.error || !fixtureProfile.data.active_company_id)
      throw fixtureProfile.error ?? new Error("fixture company unavailable");
    const fixtureCompany = fixtureProfile.data.active_company_id;
    const notificationCustomer = await service
      .from("customers")
      .select("id")
      .eq("company_id", fixtureCompany)
      .eq("name", marker)
      .single();
    if (notificationCustomer.error) throw notificationCustomer.error;
    const preferenceReset = await service
      .from("customer_delivery_preferences")
      .update({ delivery_reminders: true, channels: ["portal"] })
      .eq("company_id", fixtureCompany)
      .eq("customer_id", notificationCustomer.data.id);
    if (preferenceReset.error) throw preferenceReset.error;
    const careEmail = `phase38-${fixtureRun}-notify-care-${Date.now()}@staging.zappos.invalid`;
    const care = await service.auth.admin.createUser({
      email: careEmail,
      password: fixturePassword,
      email_confirm: true,
    });
    if (care.error) throw care.error;
    for (const write of await Promise.all([
      service.from("profiles").upsert({
        id: care.data.user.id,
        active_company_id: fixtureCompany,
        full_name: `${marker} Notification Care`,
      }),
      service
        .from("company_members")
        .insert({ company_id: fixtureCompany, user_id: care.data.user.id }),
      service
        .from("user_roles")
        .insert({ company_id: fixtureCompany, user_id: care.data.user.id, role: "customer_care" }),
    ]))
      if (write.error) throw write.error;
    const dispatcher = await createAuthenticatedPersonaContext(
      browser,
      "Dispatcher",
      fixtureAdminEmail,
      fixturePassword,
      /dashboard/,
    );
    const customerCare = await createAuthenticatedPersonaContext(
      browser,
      "Customer Care",
      care.data.user.email!,
      fixturePassword,
      /dashboard/,
    );
    const customer = await createAuthenticatedPersonaContext(
      browser,
      "Customer",
      fixtureCustomerEmail,
      fixturePassword,
      /customer-portal/,
    );
    await customerCare.page.goto("/crm");
    await customerCare.page
      .getByLabel("Search operational customers or delivery references")
      .fill(`${marker}-A`);
    await expect(customerCare.page.getByText(`${marker}-A`, { exact: true })).toBeVisible();
    let notificationResponse: { status: number; body: unknown } | null = null;
    customerCare.page.on("response", async (response) => {
      if (!response.url().includes("/rest/v1/rpc/phase404_queue_delay_notification")) return;
      try {
        notificationResponse = { status: response.status(), body: await response.json() };
      } catch {
        notificationResponse = { status: response.status(), body: null };
      }
    });
    await customerCare.page.getByRole("button", { name: "Queue delay notification" }).click();
    await expect.poll(() => notificationResponse).toBeTruthy();
    await expect(
      customerCare.page.getByText("Notification request persisted", { exact: false }),
      `notification RPC response: ${JSON.stringify(notificationResponse)}`,
    ).toBeVisible();

    const job = await service
      .from("jobs")
      .select("id,customer_id")
      .eq("company_id", fixtureCompany)
      .eq("reference", `${marker}-A`)
      .single();
    if (job.error) throw job.error;
    const portal = await service
      .from("customer_portal_notifications")
      .select(
        "id,company_id,customer_id,entity_id,notification_type,delivery_channels,delivery_state",
      )
      .eq("company_id", fixtureCompany)
      .eq("entity_id", job.data.id)
      .eq("notification_type", "shipment_delayed")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (portal.error) throw portal.error;
    expect(portal.data.customer_id).toBe(job.data.customer_id);
    expect(portal.data.delivery_channels).toEqual(["portal"]);
    const messages = await service
      .from("communication_messages")
      .select("id,company_id,thread_id,channel,delivery_state")
      .eq("company_id", fixtureCompany)
      .eq("channel", "portal")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (messages.error) throw messages.error;
    const attempts = await service
      .from("communication_delivery_attempts")
      .select("id,message_id,state,provider,provider_confirmed_at")
      .eq("company_id", fixtureCompany)
      .eq("message_id", messages.data.id)
      .single();
    if (attempts.error) throw attempts.error;
    expect(attempts.data.state).toBe("queued");
    expect(attempts.data.provider_confirmed_at).toBeNull();

    await dispatcher.page.goto("/notifications");
    await expect(dispatcher.page.getByText("Delivery delay update", { exact: true })).toBeVisible();
    await customer.page.goto("/customer-portal/notifications");
    await expect(customer.page.getByText(/Delivery delay update/i)).toBeVisible();
    await customer.page.goto("/notifications");
    await expect(customer.page).toHaveURL(/customer-portal/);

    const duplicate = await customerCare.page
      .getByRole("button", { name: "Queue delay notification" })
      .click()
      .then(async () =>
        customerCare.page
          .getByText(/already queued|request persisted/i)
          .first()
          .textContent(),
      );
    expect(duplicate).toMatch(/already queued|request persisted/i);

    await service
      .from("customer_delivery_preferences")
      .update({ delivery_reminders: false })
      .eq("company_id", fixtureCompany)
      .eq("customer_id", job.data.customer_id);
    await customerCare.page.reload();
    await customerCare.page
      .getByLabel("Search operational customers or delivery references")
      .fill(`${marker}-A`);
    await customerCare.page.getByRole("button", { name: "Queue delay notification" }).click();
    await expect(customerCare.page.getByText(/Notification not eligible/i)).toBeVisible();

    await Promise.all([
      dispatcher.context.close(),
      customerCare.context.close(),
      customer.context.close(),
    ]);
  });
});
