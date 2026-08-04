import { test, expect } from "@playwright/test";

test.describe("Phase 35 authenticated driver staging", () => {
  test.skip(!process.env.ZAPPOS_RUN_PHASE35_STAGING_E2E, "Phase 35 staging validation is opt-in");
  test.beforeEach(async ({ page }) => {
    const email = process.env.ZAPPOS_STAGING_TEST_EMAIL ?? process.env.E2E_ADMIN_EMAIL;
    const password = process.env.ZAPPOS_STAGING_TEST_PASSWORD ?? process.env.E2E_ADMIN_PASSWORD;
    if (!email || !password) throw new Error("Missing staging persona credentials");
    const registeredDeviceId = process.env.PHASE35_DEVICE_ID;
    if (registeredDeviceId) {
      await page.addInitScript(
        (deviceId) => localStorage.setItem("zappos.installation_id.v1", deviceId),
        registeredDeviceId,
      );
    }
    await page.goto("/auth");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).not.toHaveURL(/auth|onboarding/);
  });
  test("opens driver home and truthful navigation", async ({ page }) => {
    await page.goto("/mobile/driver");
    await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
    await page.goto("/mobile/driver/navigation");
    await expect(page.getByRole("heading", { name: "Navigation" })).toBeVisible();
    await expect(page.getByText("turn-by-turn guidance unavailable")).toBeVisible();
  });

  test.skip("completes the persisted queue and reviewer POD slice", async ({ page }) => {
    const jobId = process.env.PHASE35_JOB_ID;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!jobId || !supabaseUrl || !supabaseKey)
      throw new Error("Missing persisted slice fixture variables");
    await page.goto("/mobile/driver");
    await expect(page.getByText(/PHASE35_PERSISTED_SLICE.*-JOB/)).toBeVisible();
    await page.getByRole("button", { name: "Accept Job" }).click();
    await expect(page.getByRole("button", { name: "Start Trip" })).toBeVisible();
    await page.getByRole("button", { name: "Start Trip" }).click();
    const started = await page.evaluate(
      async ({ url, key, id }) => {
        const tokenKey = Object.keys(localStorage).find((name) => name.endsWith("-auth-token"));
        const session = tokenKey
          ? JSON.parse(localStorage.getItem(tokenKey) || "{}").access_token
          : null;
        const response = await fetch(`${url}/rest/v1/jobs?select=status,started_at&id=eq.${id}`, {
          headers: { apikey: key, Authorization: `Bearer ${session}` },
        });
        return (await response.json())[0];
      },
      { url: supabaseUrl, key: supabaseKey, id: jobId },
    );
    expect(started.status).toBe("in_progress");
    expect(started.started_at).toBeTruthy();
    await page.reload();
    await expect(page.getByRole("button", { name: "Start Trip" })).not.toBeVisible();
    await page.goto("/mobile/driver/pod");
    await page.getByLabel("Recipient").fill("Staging Reviewer");
    await page.getByRole("button", { name: "Queue arrival" }).click();
    await page.getByRole("button", { name: "Queue POD" }).click();
    await expect(page.getByRole("button", { name: "Queued" })).toBeVisible();
    await page.getByRole("button", { name: "Reconnect and sync" }).click();
    await expect(page.getByText("All server queue items acknowledged")).toBeVisible({
      timeout: 20_000,
    });

    const proofId = await page.evaluate(
      async ({ url, key, id }) => {
        const tokenKey = Object.keys(localStorage).find((name) => name.endsWith("-auth-token"));
        const session = tokenKey
          ? JSON.parse(localStorage.getItem(tokenKey) || "{}").access_token
          : null;
        const response = await fetch(
          `${url}/rest/v1/job_proofs?select=id&job_id=eq.${id}&order=created_at.desc&limit=1`,
          {
            headers: { apikey: key, Authorization: `Bearer ${session}` },
          },
        );
        const rows = await response.json();
        return rows[0]?.id;
      },
      { url: supabaseUrl, key: supabaseKey, id: jobId },
    );
    expect(proofId).toBeTruthy();
    await page.evaluate(
      async ({ url, key, proof }) => {
        const tokenKey = Object.keys(localStorage).find((name) => name.endsWith("-auth-token"));
        const session = tokenKey
          ? JSON.parse(localStorage.getItem(tokenKey) || "{}").access_token
          : null;
        const response = await fetch(`${url}/rest/v1/rpc/review_driver_pod`, {
          method: "POST",
          headers: {
            apikey: key,
            Authorization: `Bearer ${session}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ _proof_id: proof, _decision: "accept" }),
        });
        if (!response.ok) throw new Error(await response.text());
      },
      { url: supabaseUrl, key: supabaseKey, proof: proofId },
    );
    await page.reload();
    await page.getByRole("button", { name: "Queue departure" }).click();
    await page.getByRole("button", { name: "Queue completion" }).click();
    await page.getByRole("button", { name: "Reconnect and sync" }).click();
    await expect(page.getByText("All server queue items acknowledged")).toBeVisible({
      timeout: 20_000,
    });
    await page.goto("/mobile/driver");
    await expect(page.getByText("No assigned job")).toBeVisible();
  });
});
