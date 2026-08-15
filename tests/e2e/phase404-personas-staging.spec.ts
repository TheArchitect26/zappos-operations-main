import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? process.env.ZAPPOS_STAGING_TEST_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? process.env.ZAPPOS_STAGING_TEST_PASSWORD;
const enabled = Boolean(adminEmail && adminPassword && process.env.SUPABASE_SERVICE_ROLE_KEY);
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabaseOrigin = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).origin : "";
const password = "Phase404-Persona-Browser!";
const runId = Date.now();
const personas = new Map<string, { email: string; id: string }>();
let companyId = "";
let customerShipmentId = "";
let driverRecordId = "";
let driverCompletionJobId = "";

const customerRoutes = [
  "/customer-portal",
  "/customer-portal/action-centre",
  "/customer-portal/analytics",
  "/customer-portal/api",
  "/customer-portal/appointments",
  "/customer-portal/assistant",
  "/customer-portal/deliveries",
  "/customer-portal/documents",
  "/customer-portal/exceptions",
  "/customer-portal/invoices",
  "/customer-portal/messages",
  "/customer-portal/notifications",
  "/customer-portal/preferences",
  "/customer-portal/profile",
  "/customer-portal/quotes",
  "/customer-portal/requests",
  "/customer-portal/security",
  "/customer-portal/settings",
  "/customer-portal/shipments",
  "/customer-portal/tracking",
] as const;

const mobileRoutes = [
  "/mobile",
  "/mobile/driver",
  "/mobile/driver/issues",
  "/mobile/driver/messages",
  "/mobile/driver/navigation",
  "/mobile/driver/offline",
  "/mobile/driver/pod",
  "/mobile/driver/stops",
] as const;

function isExpectedNavigationCancellation(url: string, failure?: string | null) {
  return (
    failure === "net::ERR_ABORTED" &&
    (url.startsWith("http://127.0.0.1:") ||
      (Boolean(supabaseOrigin) && url.startsWith(supabaseOrigin)))
  );
}

async function signIn(page: Page, email: string, expected: RegExp = /\/dashboard$/) {
  await page.goto("/auth");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(email === adminEmail ? adminPassword! : password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(expected);
}

async function clearBrowserSession(page: Page) {
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.context().clearCookies();
  await page.goto("/auth");
}

test.describe("Phase 40.4 nine-persona browser walkthrough", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!enabled, "requires staging persona authority");

  test.beforeAll(async () => {
    const service = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false },
      },
    );
    const users = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (users.error) throw users.error;
    const admin = users.data.users.find(
      (candidate) => candidate.email?.toLowerCase() === adminEmail?.toLowerCase(),
    );
    if (!admin) throw new Error("Admin fixture is unavailable");
    const profile = await service
      .from("profiles")
      .select("active_company_id")
      .eq("id", admin.id)
      .single();
    if (profile.error || !profile.data.active_company_id)
      throw profile.error ?? new Error("No company");
    companyId = profile.data.active_company_id;
    personas.set("admin", { email: adminEmail!, id: admin.id });

    for (const role of [
      "dispatcher",
      "fleet_manager",
      "customer_care",
      "warehouse_manager",
      "technician",
      "driver",
      "viewer",
    ] as const) {
      const email = `phase404-${role}-${runId}@example.test`;
      const created = await service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { phase404_persona: role },
      });
      if (created.error) throw created.error;
      const id = created.data.user.id;
      personas.set(role, { email, id });
      for (const write of await Promise.all([
        service.from("profiles").upsert({
          id,
          active_company_id: companyId,
          full_name: `Phase 40.4 ${role.replaceAll("_", " ")}`,
        }),
        service.from("company_members").insert({ company_id: companyId, user_id: id }),
        service.from("user_roles").insert({ company_id: companyId, user_id: id, role }),
      ]))
        if (write.error) throw write.error;
      if (role === "driver") {
        const driver = await service
          .from("drivers")
          .insert({
            company_id: companyId,
            user_id: id,
            full_name: "Phase 40.4 Browser Driver",
            employee_ref: `P404-${runId}`,
            status: "available",
          })
          .select("id")
          .single();
        if (driver.error) throw driver.error;
        driverRecordId = driver.data.id;
      }
    }

    const customerEmail = `phase404-customer-${runId}@example.test`;
    const customerUser = await service.auth.admin.createUser({
      email: customerEmail,
      password,
      email_confirm: true,
      user_metadata: { phase404_persona: "customer" },
    });
    if (customerUser.error) throw customerUser.error;
    const customer = await service
      .from("customers")
      .insert({ company_id: companyId, name: "Phase 40.4 Browser Customer", email: customerEmail })
      .select("id")
      .single();
    if (customer.error) throw customer.error;
    if (!publishableKey) throw new Error("SUPABASE_PUBLISHABLE_KEY is required");
    const adminDb = createClient(process.env.SUPABASE_URL!, publishableKey, {
      auth: { persistSession: false },
    });
    const adminSignIn = await adminDb.auth.signInWithPassword({
      email: adminEmail!,
      password: adminPassword!,
    });
    if (adminSignIn.error) throw adminSignIn.error;
    const shipment = await adminDb
      .from("jobs")
      .insert({
        company_id: companyId,
        customer_id: customer.data.id,
        reference: `P404-PORTAL-${runId}`,
        description: "Phase 40.4 customer-owned route audit fixture",
        pickup_location: "Controlled staging origin",
        dropoff_location: "Controlled staging destination",
        priority: "normal",
        status: "assigned",
        scheduled_at: new Date(Date.now() + 3_600_000).toISOString(),
      })
      .select("id")
      .single();
    if (shipment.error) throw shipment.error;
    customerShipmentId = shipment.data.id;
    const driverCompletion = await adminDb
      .from("jobs")
      .insert({
        company_id: companyId,
        customer_id: customer.data.id,
        driver_id: driverRecordId,
        reference: `P404-DRIVER-PROOF-${runId}`,
        description: "Controlled staging driver completion fixture; no physical delivery claimed",
        pickup_location: "Controlled staging origin",
        dropoff_location: "Controlled staging destination",
        priority: "normal",
        status: "arrived",
        scheduled_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        arrived_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (driverCompletion.error) throw driverCompletion.error;
    driverCompletionJobId = driverCompletion.data.id;
    const membership = await service.from("customer_portal_memberships").insert({
      company_id: companyId,
      customer_id: customer.data.id,
      user_id: customerUser.data.user.id,
      role: "manager",
      status: "active",
      accepted_at: new Date().toISOString(),
    });
    if (membership.error) throw membership.error;
    personas.set("customer", { email: customerEmail, id: customerUser.data.user.id });
  });

  test("Admin, Dispatcher, Fleet Manager, Customer Care, Warehouse/Yard, Technician, Driver and Viewer", async ({
    page,
  }) => {
    test.setTimeout(240_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await signIn(page, personas.get("admin")!.email);
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
    await clearBrowserSession(page);

    await signIn(page, personas.get("dispatcher")!.email);
    await expect(page.getByRole("link", { name: "Dispatch" })).toBeVisible();
    await page.goto("/dispatch");
    await expect(page.locator("main")).toBeVisible();
    await clearBrowserSession(page);

    await signIn(page, personas.get("fleet_manager")!.email);
    await expect(page.getByRole("link", { name: "Tracking" })).toBeVisible();
    await page.goto("/settings");
    await expect(page.getByRole("tab", { name: "Operations" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Company" })).toHaveCount(0);
    await clearBrowserSession(page);

    await signIn(page, personas.get("customer_care")!.email);
    await expect(page.getByRole("link", { name: "CRM" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Tracking" })).toBeVisible();
    await page.goto("/tracking/customer-care");
    await expect(page.getByTestId("tracking-customer-care")).toBeVisible();
    await clearBrowserSession(page);

    await signIn(page, personas.get("warehouse_manager")!.email);
    await expect(page.getByRole("link", { name: "Warehouse" })).toBeVisible();
    await page.goto("/yard");
    await expect(page.locator("main")).toBeVisible();
    await clearBrowserSession(page);

    await signIn(page, personas.get("technician")!.email);
    await expect(page.getByRole("link", { name: "Field deployment" })).toBeVisible();
    await page.goto("/field-deployment");
    await expect(page.getByRole("button", { name: "Create deployment" })).toHaveCount(0);
    await clearBrowserSession(page);

    await signIn(page, personas.get("driver")!.email);
    await expect(page.getByRole("link", { name: "Driver" })).toBeVisible();
    await page.goto("/platform");
    await expect(page).toHaveURL(/\/driver(?:[/?#]|$)/);
    await expect(page.getByRole("link", { name: "Zapp Platform" })).toHaveCount(0);
    await clearBrowserSession(page);

    await signIn(page, personas.get("viewer")!.email);
    await page.goto("/field-deployment");
    await expect(page.getByRole("button", { name: "Create deployment" })).toHaveCount(0);
    await page.goto("/settings");
    await expect(page.getByRole("tab", { name: "Company" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Operations" })).toHaveCount(0);
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("Customer is confined to the customer portal", async ({ page }) => {
    await signIn(page, personas.get("customer")!.email, /\/customer-portal/);
    await expect(page.getByRole("link", { name: "Shipments", exact: true })).toBeVisible();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/customer-portal/);
    await expect(page.getByRole("link", { name: "Settings", exact: true })).toHaveAttribute(
      "href",
      "/customer-portal/settings",
    );
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/customer-portal/);
  });

  test("Customer browser-walks every static portal route", async ({ page }) => {
    test.setTimeout(180_000);
    const runtimeErrors: string[] = [];
    const failedRequests: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText;
      if (!isExpectedNavigationCancellation(request.url(), failure))
        failedRequests.push(`${request.method()} ${request.url()} ${failure}`);
    });
    await signIn(page, personas.get("customer")!.email, /\/customer-portal/);
    const inventory: Array<{ route: string; buttons: number; forms: number }> = [];
    for (const route of customerRoutes) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status(), route).toBeLessThan(400);
      await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);
      const expectedRoute =
        route === "/customer-portal/preferences" ? "/customer-portal/settings" : route;
      await expect(page).toHaveURL(new RegExp(`${expectedRoute.replaceAll("/", "\\/")}(?:[?#]|$)`));
      await expect(page.locator("body")).toBeVisible();
      inventory.push({
        route,
        buttons: await page.getByRole("button").count(),
        forms: await page.locator("form").count(),
      });
    }
    const detailRoute = `/customer-portal/shipments/${customerShipmentId}`;
    const detailResponse = await page.goto(detailRoute, { waitUntil: "domcontentloaded" });
    expect(detailResponse?.status(), detailRoute).toBeLessThan(400);
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);
    await expect(page).toHaveURL(new RegExp(`${detailRoute.replaceAll("/", "\\/")}(?:[?#]|$)`));
    await expect(page.getByText(`P404-PORTAL-${runId}`)).toBeVisible();
    inventory.push({
      route: "/customer-portal/shipments/$jobId",
      buttons: await page.getByRole("button").count(),
      forms: await page.locator("form").count(),
    });
    console.log(`PHASE404_CUSTOMER_CENSUS ${JSON.stringify(inventory)}`);
    expect(runtimeErrors, runtimeErrors.join("\n")).toEqual([]);
    expect(failedRequests, failedRequests.join("\n")).toEqual([]);
  });

  test("Driver browser-walks every mobile route at phone viewport", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 390, height: 844 });
    const runtimeErrors: string[] = [];
    const failedRequests: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText;
      if (!isExpectedNavigationCancellation(request.url(), failure))
        failedRequests.push(`${request.method()} ${request.url()} ${failure}`);
    });
    await signIn(page, personas.get("driver")!.email, /\/driver$/);
    const inventory: Array<{ route: string; buttons: number; forms: number }> = [];
    for (const route of mobileRoutes) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status(), route).toBeLessThan(400);
      await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);
      await expect(page).toHaveURL(new RegExp(`${route.replaceAll("/", "\\/")}(?:[?#]|$)`));
      const bodyWidth = await page.locator("body").evaluate((body) => body.scrollWidth);
      expect(bodyWidth, `${route} horizontal overflow`).toBeLessThanOrEqual(390);
      inventory.push({
        route,
        buttons: await page.getByRole("button").count(),
        forms: await page.locator("form").count(),
      });
    }
    console.log(`PHASE404_MOBILE_CENSUS ${JSON.stringify(inventory)}`);
    expect(runtimeErrors, runtimeErrors.join("\n")).toEqual([]);
    expect(failedRequests, failedRequests.join("\n")).toEqual([]);
  });

  test("Customer portal forms validate, acknowledge and persist", async ({ page }) => {
    test.setTimeout(180_000);
    await signIn(page, personas.get("customer")!.email, /\/customer-portal/);
    const marker = `P404-FORM-${runId}`;
    const acknowledgedPost = () =>
      page.waitForResponse(
        (response) =>
          response.url().includes("/rest/v1/rpc/") &&
          response.request().method() === "POST" &&
          response.status() < 400,
        { timeout: 15_000 },
      );

    await page.goto("/customer-portal/quotes");
    const quoteForm = page.locator("form");
    expect(await quoteForm.evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(false);
    await page.getByPlaceholder("Your reference").fill(marker);
    await page.getByPlaceholder("Pickup summary").fill("Controlled staging origin");
    await page.getByPlaceholder("Delivery summary").fill("Controlled staging destination");
    await page.getByPlaceholder("Cargo summary").fill("Controlled non-physical form fixture");
    await Promise.all([
      acknowledgedPost(),
      page.getByRole("button", { name: "Submit for internal review" }).click(),
    ]);
    await expect(page.getByText(marker)).toBeVisible();
    await page.reload();
    await expect(page.getByText(marker)).toBeVisible();

    await page.goto("/customer-portal/messages");
    const conversationForm = page.locator("form");
    expect(await conversationForm.evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(
      false,
    );
    await page.getByPlaceholder("Conversation subject").fill(`${marker}-conversation`);
    await Promise.all([
      acknowledgedPost(),
      page.getByRole("button", { name: "Start conversation" }).click(),
    ]);
    await expect(page.getByText(`${marker}-conversation`)).toBeVisible();
    await page.reload();
    await expect(page.getByText(`${marker}-conversation`)).toBeVisible();

    await page.goto("/customer-portal/assistant");
    const assistantForm = page.locator("form");
    expect(await assistantForm.evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(
      false,
    );
    await page.getByPlaceholder("Where is my shipment?").fill(`Where is ${marker}?`);
    await Promise.all([acknowledgedPost(), assistantForm.getByRole("button").click()]);
    await expect(page.getByText(/deterministic/i).first()).toBeVisible();

    await page.goto("/customer-portal/api");
    const apiForm = page.locator("form");
    expect(await apiForm.evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(false);
    await page.getByPlaceholder("Key name").fill(`${marker}-key`);
    await Promise.all([acknowledgedPost(), page.getByRole("button", { name: "Create" }).click()]);
    await expect(page.getByText(/copy now/i)).toBeVisible();
    await expect(page.getByText(`${marker}-key`)).toBeVisible();
    await page.reload();
    await expect(page.getByText(`${marker}-key`)).toBeVisible();
    await expect(page.getByText(/copy now/i)).toHaveCount(0);

    await page.goto("/customer-portal/profile");
    const profileValue = `${marker} customer welcome`;
    await page.getByPlaceholder("Portal welcome").fill(profileValue);
    await Promise.all([
      acknowledgedPost(),
      page.getByRole("button", { name: "Save profile" }).click(),
    ]);
    await expect(page.getByText("Saved", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByPlaceholder("Portal welcome")).toHaveValue(profileValue);

    await page.goto("/customer-portal/requests");
    const requestForm = page.locator("form");
    expect(await requestForm.evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(false);
    await page.getByPlaceholder("What do you need help with?").fill(`${marker}-request`);
    await page.getByPlaceholder("Add details (optional)").fill("Controlled form persistence proof");
    await Promise.all([
      acknowledgedPost(),
      page.getByRole("button", { name: "Create request" }).click(),
    ]);
    await expect(page.getByText(`${marker}-request`)).toBeVisible();
    await page.reload();
    await expect(page.getByText(`${marker}-request`)).toBeVisible();
  });

  test("Admin core CRUD forms validate, acknowledge and persist", async ({ page }) => {
    test.setTimeout(180_000);
    await signIn(page, personas.get("admin")!.email);
    const marker = `P404-CRUD-${runId}`;
    const tablePost = (table: string) =>
      page.waitForResponse(
        (response) =>
          response.url().includes(`/rest/v1/${table}`) && response.request().method() === "POST",
        { timeout: 15_000 },
      );

    await page.goto("/customers");
    await page.getByRole("button", { name: "Add customer" }).first().click();
    let form = page.getByRole("dialog").locator("form");
    expect(await form.evaluate((node: HTMLFormElement) => node.checkValidity())).toBe(false);
    await page.getByPlaceholder("e.g., ABC Logistics Ltd").fill(`${marker} Customer`);
    let [writeResponse] = await Promise.all([
      tablePost("customers"),
      page.getByRole("button", { name: "Save customer" }).click(),
    ]);
    expect(writeResponse.status()).toBeLessThan(400);
    await expect(page.getByText("Customer created")).toBeVisible();
    await page.reload();
    await page.getByPlaceholder(/Search by name/).fill(marker);
    await expect(page.getByRole("cell", { name: `${marker} Customer` })).toBeVisible();

    await page.goto("/drivers");
    await page.getByRole("button", { name: "Add driver" }).first().click();
    form = page.getByRole("dialog").locator("form");
    expect(await form.evaluate((node: HTMLFormElement) => node.checkValidity())).toBe(false);
    await page.getByPlaceholder("e.g., John Smith").fill(`${marker} Driver`);
    await page.getByPlaceholder("e.g., EMP-001").fill(`${marker}-EMP`);
    expect(await form.evaluate((node: HTMLFormElement) => node.checkValidity())).toBe(true);
    [writeResponse] = await Promise.all([
      tablePost("drivers"),
      page.getByRole("button", { name: "Save driver" }).click(),
    ]);
    expect(writeResponse.status()).toBeLessThan(400);
    await expect(page.getByText("Driver created")).toBeVisible();
    await page.reload();
    await page.getByPlaceholder(/Search by name/).fill(marker);
    await expect(page.getByRole("cell", { name: `${marker} Driver` })).toBeVisible();

    await page.goto("/vehicles");
    await page.getByRole("button", { name: "Add vehicle" }).first().click();
    form = page.getByRole("dialog").locator("form");
    expect(await form.evaluate((node: HTMLFormElement) => node.checkValidity())).toBe(false);
    await page.getByPlaceholder("e.g., ABC 123").fill(`${marker}-REG`);
    await page.getByPlaceholder("e.g., Volvo").fill("Controlled");
    await page.getByPlaceholder("e.g., FH16").fill("Browser fixture");
    expect(await form.evaluate((node: HTMLFormElement) => node.checkValidity())).toBe(true);
    [writeResponse] = await Promise.all([
      tablePost("vehicles"),
      page.getByRole("button", { name: "Save vehicle" }).click(),
    ]);
    expect(writeResponse.status()).toBeLessThan(400);
    await expect(page.getByText("Vehicle created")).toBeVisible();
    await page.reload();
    await page.getByPlaceholder(/Search by registration/).fill(marker);
    await expect(page.getByRole("cell", { name: `${marker}-REG` })).toBeVisible();

    await page.goto("/operations");
    await page.getByRole("button", { name: /^New / }).first().click();
    form = page.getByRole("dialog").locator("form");
    await page.getByLabel("Reference").fill(`${marker}-JOB`);
    await page.getByPlaceholder("Pickup address").fill("Controlled staging origin");
    await page.getByPlaceholder("Delivery address").fill("Controlled staging destination");
    expect(await form.evaluate((node: HTMLFormElement) => node.checkValidity())).toBe(true);
    [writeResponse] = await Promise.all([
      tablePost("jobs"),
      page.getByRole("button", { name: "Save", exact: true }).click(),
    ]);
    expect(writeResponse.status()).toBeLessThan(400);
    await expect(page.getByText(/created/i).last()).toBeVisible();
    await page.reload();
    await page.getByPlaceholder(/Search by reference/).fill(marker);
    await expect(page.getByRole("cell", { name: `${marker}-JOB` })).toBeVisible();
  });

  test("Admin maintenance, incident and document forms persist", async ({ page }) => {
    test.setTimeout(180_000);
    await signIn(page, personas.get("admin")!.email);
    const marker = `P404-OPSFORM-${runId}`;
    const tablePost = (table: string) =>
      page.waitForResponse(
        (response) =>
          response.url().includes(`/rest/v1/${table}`) && response.request().method() === "POST",
        { timeout: 15_000 },
      );

    await page.goto("/maintenance");
    await page.getByRole("button", { name: "New task" }).click();
    let form = page.locator("form");
    expect(await form.evaluate((node: HTMLFormElement) => node.checkValidity())).toBe(false);
    await page.locator("#vehicle").selectOption({ index: 1 });
    await page.getByLabel("Title").fill(`${marker} Maintenance`);
    expect(await form.evaluate((node: HTMLFormElement) => node.checkValidity())).toBe(true);
    let [writeResponse] = await Promise.all([
      tablePost("maintenance"),
      page.getByRole("button", { name: "Create task" }).click(),
    ]);
    expect(writeResponse.status()).toBeLessThan(400);
    await expect(page.getByText("Maintenance task created")).toBeVisible();
    await page.reload();
    await expect.poll(() => page.getByText(`${marker} Maintenance`).count()).toBeGreaterThan(0);

    await page.goto("/incidents");
    await page.getByRole("button", { name: "Report incident" }).click();
    form = page.locator("form");
    expect(await form.evaluate((node: HTMLFormElement) => node.checkValidity())).toBe(false);
    await page.getByLabel("Description").fill(`${marker} Incident`);
    expect(await form.evaluate((node: HTMLFormElement) => node.checkValidity())).toBe(true);
    [writeResponse] = await Promise.all([
      tablePost("incidents"),
      page.getByRole("button", { name: "Submit", exact: true }).click(),
    ]);
    expect(writeResponse.status()).toBeLessThan(400);
    await expect(page.getByText("Incident reported")).toBeVisible();
    await page.reload();
    await expect.poll(() => page.getByText(`${marker} Incident`).count()).toBeGreaterThan(0);

    await page.goto("/documents");
    await page.getByRole("button", { name: "Add document" }).first().click();
    form = page.getByRole("dialog").locator("form");
    expect(await form.evaluate((node: HTMLFormElement) => node.checkValidity())).toBe(false);
    await page.getByPlaceholder("Licence, insurance, permit...").fill("controlled_audit");
    await page.getByPlaceholder("Registration certificate").fill(`${marker} Document`);
    expect(await form.evaluate((node: HTMLFormElement) => node.checkValidity())).toBe(true);
    [writeResponse] = await Promise.all([
      tablePost("documents"),
      page.getByRole("button", { name: "Save document" }).click(),
    ]);
    expect(writeResponse.status()).toBeLessThan(400);
    await expect(page.getByText("Document uploaded")).toBeVisible();
    await page.reload();
    await expect.poll(() => page.getByText(`${marker} Document`).count()).toBeGreaterThan(0);
  });

  test("Driver proof form persists truthful controlled proof for review", async ({ page }) => {
    test.setTimeout(120_000);
    await signIn(page, personas.get("driver")!.email, /\/driver$/);
    await expect(page.getByText(`P404-DRIVER-PROOF-${runId}`)).toBeVisible();
    const form = page.locator("#proof-form form");
    expect(await form.evaluate((node: HTMLFormElement) => node.checkValidity())).toBe(false);
    await page.getByLabel("Recipient/customer name").fill("Controlled staging reviewer");
    await page
      .getByLabel("Completion notes")
      .fill(
        "Controlled staging form proof only; no physical delivery, photo, GPS, or signature claimed.",
      );
    expect(await form.evaluate((node: HTMLFormElement) => node.checkValidity())).toBe(true);
    const [response] = await Promise.all([
      page.waitForResponse(
        (candidate) =>
          candidate.url().includes("/rest/v1/rpc/driver_submit_pod_for_review") &&
          candidate.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Submit proof and complete" }).click(),
    ]);
    expect(response.status()).toBeLessThan(400);
    await expect(page.getByText("POD submitted for review")).toBeVisible();
    await page.reload();
    await expect(page.locator("#proof-form")).toHaveCount(1);

    const service = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false },
      },
    );
    const persisted = await service
      .from("jobs")
      .select("status")
      .eq("id", driverCompletionJobId)
      .single();
    if (persisted.error) throw persisted.error;
    expect(persisted.data.status).toBe("arrived");
    const proof = await service
      .from("job_proofs")
      .select("recipient_name,photo_url,signature_url,notes")
      .eq("job_id", driverCompletionJobId)
      .single();
    if (proof.error) throw proof.error;
    expect(proof.data).toMatchObject({
      recipient_name: "Controlled staging reviewer",
      photo_url: null,
      signature_url: null,
    });
    expect(proof.data.notes).toContain("no physical delivery");
  });

  test("Unified shipment quick action opens its authoritative module", async ({ page }) => {
    await signIn(page, adminEmail!);
    await page.getByRole("button", { name: /search everything/i }).click();
    await page.getByLabel("Universal search").fill(`P404-PORTAL-${runId}`);
    const shipmentResult = page
      .getByRole("dialog", { name: "Command palette" })
      .getByRole("button")
      .filter({ hasText: `P404-PORTAL-${runId}` });
    await expect(shipmentResult).toBeVisible();
    await shipmentResult.click();
    await page.getByRole("button", { name: "Message customer" }).click();
    await expect(page).toHaveURL(/\/connect$/);
  });
});
