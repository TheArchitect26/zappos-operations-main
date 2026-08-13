import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const enabled = process.env.ZAPPOS_RUN_ONBOARDING_STAGING_E2E === "true";
const baseEmail = process.env.E2E_ADMIN_EMAIL || process.env.ZAPPOS_STAGING_TEST_EMAIL || "";
const password = process.env.ONBOARDING_PERSONA_PASSWORD || "";
const supabaseUrl = process.env.SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

test.describe("new-user authentication and workspace staging journey", () => {
  test.skip(!enabled, "Set ZAPPOS_RUN_ONBOARDING_STAGING_E2E=true for controlled staging run");

  test("signup, real callback, workspace, reload and later sign-in", async ({ page, baseURL }) => {
    expect(baseEmail).not.toBe("");
    expect(password).not.toBe("");
    expect(serviceKey).not.toBe("");
    const runId = `browser-${Date.now()}`;
    const [local, domain] = baseEmail.split("@");
    const email = `${local}+onboarding-${runId}@${domain}`;
    const workspace = `ZappOS onboarding evidence ${runId}`;
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    let signupStatus = 0;

    page.on("response", (response) => {
      if (response.url().includes("/auth/v1/signup")) signupStatus = response.status();
    });

    await page.goto("/auth");
    await page.getByRole("tab", { name: /sign up/i }).click();
    await page.getByLabel("Full name").fill("ZappOS Onboarding Staging");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByText("Confirm your email")).toBeVisible();
    expect(signupStatus).toBe(200);

    const generated = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${baseURL}/auth/callback` },
    });
    expect(generated.error).toBeNull();
    expect(generated.data.properties?.action_link).toBeTruthy();

    await page.goto(generated.data.properties.action_link);
    await expect(page).toHaveURL(/\/onboarding$/, { timeout: 20_000 });
    await expect(page.getByText("Set up your company workspace")).toBeVisible();
    await page.getByLabel("Company name").fill(workspace);
    await page.getByRole("button", { name: /create workspace/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
    await expect(page).toHaveTitle(/ZappOS/);

    await page.reload();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });

    await page.evaluate(async () => {
      const key = Object.keys(localStorage).find((candidate) => candidate.includes("auth-token"));
      if (key) localStorage.removeItem(key);
    });
    await page.goto("/auth");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });

    const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = users.users.find((candidate) => candidate.email === email);
    expect(user?.email_confirmed_at).toBeTruthy();
    const [company, membership, role, profile] = await Promise.all([
      admin.from("companies").select("id,name").eq("created_by", user?.id).single(),
      admin.from("company_members").select("id,company_id").eq("user_id", user?.id),
      admin.from("user_roles").select("role,company_id").eq("user_id", user?.id),
      admin.from("profiles").select("active_company_id").eq("id", user?.id).single(),
    ]);
    expect(company.data?.name).toBe(workspace);
    expect(membership.data).toHaveLength(1);
    expect(role.data).toEqual([expect.objectContaining({ role: "admin" })]);
    expect(profile.data?.active_company_id).toBe(company.data?.id);
  });
});
