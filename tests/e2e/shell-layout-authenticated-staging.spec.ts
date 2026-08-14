import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const enabled = process.env.ZAPPOS_RUN_SHELL_LAYOUT_E2E === "true";

test.describe("authenticated application shell layout", () => {
  test.skip(!enabled, "requires explicit shell-layout staging opt-in");

  test("keeps navigation and operational content independently scrollable", async ({
    page,
    baseURL,
  }) => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey || !baseURL)
      throw new Error("Missing controlled staging setup");

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const profiles = await admin
      .from("profiles")
      .select("id")
      .not("active_company_id", "is", null)
      .limit(20);
    expect(profiles.error).toBeNull();
    const users = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    expect(users.error).toBeNull();
    const workspaceUserIds = new Set(profiles.data?.map(({ id }) => id));
    const workspaceUser = users.data.users.find(
      ({ id, email }) => workspaceUserIds.has(id) && email,
    );
    expect(workspaceUser?.email).toBeTruthy();

    const generated = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: workspaceUser!.email!,
      options: { redirectTo: `${baseURL}/auth/callback` },
    });
    expect(generated.error).toBeNull();
    await page.goto(generated.data.properties!.action_link);
    await expect(page).toHaveURL(/\/dashboard$/);

    const viewports = [
      { width: 1440, height: 600 },
      { width: 1100, height: 700 },
      { width: 1024, height: 600 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto("/dashboard");

      const header = page.getByTestId("desktop-topbar");
      const sidebar = page.getByTestId("desktop-sidebar");
      const sidebarNav = page.getByTestId("desktop-sidebar-nav");
      const main = page.getByTestId("app-main-scroll");
      await expect(header).toBeVisible();
      await expect(sidebar).toBeVisible();

      const initial = await Promise.all([
        header.boundingBox(),
        sidebar.boundingBox(),
        sidebarNav.evaluate((element) => element.scrollTop),
      ]);
      await main.evaluate((element) => {
        element.scrollTop = Math.min(300, element.scrollHeight - element.clientHeight);
      });

      expect(await header.boundingBox()).toEqual(initial[0]);
      expect(await sidebar.boundingBox()).toEqual(initial[1]);
      expect(await sidebarNav.evaluate((element) => element.scrollTop)).toBe(initial[2]);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);

      const mainScrollTop = await main.evaluate((element) => element.scrollTop);
      expect(mainScrollTop).toBeGreaterThan(0);
      const firstItem = sidebarNav.locator("a").first();
      const firstItemTop = (await firstItem.boundingBox())?.y;
      await sidebarNav.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });

      expect(await sidebarNav.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
      expect((await firstItem.boundingBox())?.y).toBeLessThan(firstItemTop ?? 0);
      expect(await main.evaluate((element) => element.scrollTop)).toBe(mainScrollTop);
      await expect(sidebarNav.locator("a").last()).toBeInViewport();
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    await expect(page.getByTestId("desktop-sidebar")).toBeHidden();
    await page.getByRole("button", { name: "Open menu" }).click();
    const mobileNav = page.getByTestId("mobile-sidebar-nav");
    await expect(mobileNav).toBeVisible();
    await mobileNav.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    expect(await mobileNav.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await expect(mobileNav.locator("a").last()).toBeInViewport();
  });
});
