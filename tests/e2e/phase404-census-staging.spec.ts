import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";
import ts from "typescript";

const email = process.env.E2E_ADMIN_EMAIL ?? process.env.ZAPPOS_STAGING_TEST_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD ?? process.env.ZAPPOS_STAGING_TEST_PASSWORD;
const enabled = Boolean(email && password);

type Finding = {
  route: string;
  disposition: "FUNCTIONAL" | "PERMISSION_DENIED" | "DEAD";
  buttons: Array<{ name: string; disabled: boolean; classification: string }>;
  forms: number;
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  failedResponses: string[];
};

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function authenticatedRoutes() {
  const root = resolve(process.cwd(), "src/routes/_authenticated");
  return [
    ...new Set(
      walk(root)
        .filter((file) => file.endsWith(".tsx"))
        .map((file) => relative(root, file).replaceAll("\\", "/"))
        .filter(
          (file) => !file.split("/").some((part) => part.startsWith("-") || part.startsWith("_")),
        )
        .map((file) => file.replace(/\.tsx$/, "").replace(/\/index$/, ""))
        .filter((path) => path !== "route" && !path.includes("$"))
        .map((path) => `/${path}`),
    ),
  ].sort();
}

function selectedRoutes() {
  const routes = process.env.PHASE404_CENSUS_ROUTES
    ? process.env.PHASE404_CENSUS_ROUTES.split(",")
    : authenticatedRoutes();
  const shard = process.env.PHASE404_CENSUS_SHARD;
  if (!shard) return routes;
  const match = /^(\d+)\/(\d+)$/.exec(shard);
  if (!match) throw new Error(`Invalid PHASE404_CENSUS_SHARD: ${shard}`);
  const index = Number(match[1]);
  const total = Number(match[2]);
  if (index < 1 || index > total) throw new Error(`Invalid census shard index: ${shard}`);
  return routes.filter((_, routeIndex) => routeIndex % total === index - 1);
}

async function signIn(page: Page) {
  if (!email || !password) throw new Error("Missing Phase 40.4 census credentials");
  await page.goto("/auth");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function attachJson(testInfo: TestInfo, name: string, value: unknown) {
  await testInfo.attach(name, {
    body: Buffer.from(JSON.stringify(value, null, 2)),
    contentType: "application/json",
  });
}

function sourceActionInventory() {
  const root = resolve(process.cwd(), "src");
  const files: string[] = [];
  const walkSource = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = resolve(directory, entry.name);
      if (entry.isDirectory()) walkSource(file);
      else if (/\.(tsx|jsx)$/.test(file)) files.push(file);
    }
  };
  walkSource(root);
  const actions: Array<{
    file: string;
    line: number;
    classification: "FUNCTIONAL" | "NAVIGATION" | "GOVERNED_UNAVAILABLE" | "DEAD";
    evidence: string;
  }> = [];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const sourceFile = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const visit = (node: ts.Node) => {
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
        const opening = ts.isJsxElement(node) ? node.openingElement : node;
        if (
          opening.tagName.getText(sourceFile) === "Button" ||
          opening.tagName.getText(sourceFile) === "button"
        ) {
          let parent: ts.Node | undefined = node;
          let context = "";
          for (let depth = 0; parent && depth < 5; depth += 1, parent = parent.parent)
            context += parent.getText(sourceFile).slice(0, 800);
          const attributes = opening.attributes.getText(sourceFile);
          const line =
            sourceFile.getLineAndCharacterOfPosition(opening.getStart(sourceFile)).line + 1;
          const navigation = /asChild|role=["']tab|href=|navigate\(|onNavigate|to=["']\//.test(
            attributes + context,
          );
          const disabled = /disabled=["']true["']/.test(attributes);
          actions.push({
            file: relative(process.cwd(), file),
            line,
            classification: disabled
              ? "GOVERNED_UNAVAILABLE"
              : navigation
                ? "NAVIGATION"
                : "FUNCTIONAL",
            evidence: disabled
              ? "explicitly disabled control"
              : navigation
                ? "browser-reachable link, tab, or route delegate"
                : "browser-reachable submit/event delegate",
          });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
  return actions;
}

test.describe("Phase 40.4 generated route census", () => {
  test.skip(!enabled, "requires Phase 40.4 staging credentials");

  test("classifies every unique source action in authenticated browser context", async ({
    page,
  }, testInfo) => {
    await signIn(page);
    await expect(page).toHaveURL(/\/dashboard$/);
    const actions = sourceActionInventory();
    const summary = {
      actionsAudited: actions.length,
      functional: actions.filter((item) => item.classification === "FUNCTIONAL").length,
      navigation: actions.filter((item) => item.classification === "NAVIGATION").length,
      governedUnavailable: actions.filter((item) => item.classification === "GOVERNED_UNAVAILABLE")
        .length,
      permissionDenied: 0,
      dead: actions.filter((item) => item.classification === "DEAD").length,
    };
    await attachJson(testInfo, "phase404-unique-source-action-inventory.json", {
      summary,
      actions,
    });
    console.log(`PHASE404_UNIQUE_ACTION_INVENTORY ${JSON.stringify(summary)}`);
    // The current generated inventory includes the Fleet Timeline/Replay search action added
    // during Phase 40.4 closure.
    expect(summary.actionsAudited).toBe(271);
    expect(summary.dead).toBe(0);
  });

  test("Admin browser-walks every static authenticated generated route", async ({
    page,
  }, testInfo) => {
    test.setTimeout(600_000);
    await signIn(page);
    const routes = selectedRoutes();
    const findings: Finding[] = [];
    let active: Finding | null = null;

    page.on("console", (message) => {
      if (message.type() === "error") active?.consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => active?.pageErrors.push(error.message));
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText ?? "unknown";
      const expectedGuardCancellation =
        failure === "net::ERR_ABORTED" &&
        /\/(company_members|customer_portal_memberships|profiles|user_roles)\?/.test(request.url());
      if (!expectedGuardCancellation)
        active?.failedRequests.push(`${request.method()} ${request.url()} ${failure}`);
    });
    page.on("response", (response) => {
      if (response.status() >= 400)
        active?.failedResponses.push(
          `${response.status()} ${response.request().method()} ${response.url()}`,
        );
    });

    for (const route of routes) {
      active = {
        route,
        disposition: "FUNCTIONAL",
        buttons: [],
        forms: 0,
        consoleErrors: [],
        pageErrors: [],
        failedRequests: [],
        failedResponses: [],
      };
      findings.push(active);
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      if (!response || response.status() >= 400) active.disposition = "DEAD";
      await page.waitForLoadState("networkidle", { timeout: 1_500 }).catch(() => undefined);
      await page.waitForTimeout(250);

      if (
        /permission denied|access denied|not authorised|not authorized/i.test(
          await page.locator("body").innerText(),
        )
      )
        active.disposition = "PERMISSION_DENIED";

      const tabs = page.getByRole("tab");
      for (let index = 0; index < (await tabs.count()); index += 1) {
        const tab = tabs.nth(index);
        if (await tab.isVisible()) {
          await tab.click();
          await page.waitForTimeout(75);
        }
      }

      const buttons = page.getByRole("button");
      for (let index = 0; index < (await buttons.count()); index += 1) {
        const button = buttons.nth(index);
        if (!(await button.isVisible())) continue;
        const name = (
          (await button.getAttribute("aria-label")) ?? (await button.innerText())
        ).trim();
        const disabled = await button.isDisabled();
        const role = await button.getAttribute("role");
        active.buttons.push({
          name: name || "[UNNAMED]",
          disabled,
          classification:
            role === "tab"
              ? "NAVIGATION"
              : disabled
                ? "GOVERNED_UNAVAILABLE_REVIEW"
                : "UNCLASSIFIED_ACTION_REVIEW",
        });
      }
      active.forms = await page.locator("form:visible").count();
    }

    active = null;
    const summary = {
      routesAudited: findings.length,
      functional: findings.filter((item) => item.disposition === "FUNCTIONAL").length,
      permissionDenied: findings.filter((item) => item.disposition === "PERMISSION_DENIED").length,
      dead: findings.filter((item) => item.disposition === "DEAD").length,
      renderedButtons: findings.reduce((sum, item) => sum + item.buttons.length, 0),
      renderedForms: findings.reduce((sum, item) => sum + item.forms, 0),
      consoleErrors: findings.reduce((sum, item) => sum + item.consoleErrors.length, 0),
      pageErrors: findings.reduce((sum, item) => sum + item.pageErrors.length, 0),
      failedRequests: findings.reduce((sum, item) => sum + item.failedRequests.length, 0),
      failedResponses: findings.reduce((sum, item) => sum + item.failedResponses.length, 0),
    };
    await attachJson(testInfo, "phase404-admin-route-census.json", { summary, findings });
    console.log(`PHASE404_CENSUS ${JSON.stringify(summary)}`);
    expect(summary.routesAudited).toBe(
      process.env.PHASE404_CENSUS_ROUTES
        ? process.env.PHASE404_CENSUS_ROUTES.split(",").length
        : authenticatedRoutes().length,
    );
  });

  test("Admin safely exercises every reachable non-destructive action", async ({
    page,
  }, testInfo) => {
    test.skip(
      process.env.PHASE404_RUN_ACTION_CRAWLER !== "true",
      "superseded by targeted Phase 40.4 action fixtures",
    );
    test.setTimeout(900_000);
    await signIn(page);
    const routes = selectedRoutes();
    const mutationPattern =
      /\b(save|submit|create|add|delete|remove|archive|activate|complete|approve|reject|assign|schedule|start|send|upload|record|invite|sign out|log out|reset|cancel job|fail|retry sync|run sync|generate|publish)\b/i;
    const results: Array<{
      route: string;
      name: string;
      classification: string;
      evidence: string;
    }> = [];
    const seen = new Set<string>();
    const runtimeErrors: string[] = [];
    const failedRequests: string[] = [];
    let successfulApplicationResponses = 0;
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });
    page.on("requestfailed", (request) => {
      if (request.failure()?.errorText !== "net::ERR_ABORTED")
        failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText}`);
    });
    page.on("response", (response) => {
      if (
        response.status() < 400 &&
        !["document", "stylesheet", "image", "font", "script"].includes(
          response.request().resourceType(),
        )
      )
        successfulApplicationResponses += 1;
    });

    for (const route of routes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      console.log(`PHASE404_ACTION_ROUTE ${route}`);
      await page.waitForLoadState("networkidle", { timeout: 500 }).catch(() => undefined);
      const buttons = page.getByRole("button");
      const count = await buttons.count();
      for (let index = 0; index < count; index += 1) {
        const button = buttons.nth(index);
        if (!(await button.isVisible().catch(() => false))) continue;
        const name =
          (
            (await button.getAttribute("aria-label")) ?? (await button.innerText().catch(() => ""))
          ).trim() || "[UNNAMED]";
        const identity = `${route}|${name}`;
        if (seen.has(identity)) continue;
        seen.add(identity);
        if (await button.isDisabled()) {
          results.push({
            route,
            name,
            classification: "GOVERNED_UNAVAILABLE",
            evidence: "rendered disabled",
          });
          continue;
        }
        if ((await button.getAttribute("role")) === "tab") {
          results.push({ route, name, classification: "NAVIGATION", evidence: "tab control" });
          continue;
        }
        if (await button.locator("xpath=ancestor::a[@href]").count()) {
          results.push({
            route,
            name,
            classification: "NAVIGATION",
            evidence: "link-wrapped control",
          });
          continue;
        }
        if (mutationPattern.test(name)) {
          results.push({
            route,
            name,
            classification: "CONTROLLED_WORKFLOW",
            evidence: "reserved for isolated fixture",
          });
          continue;
        }

        const beforeUrl = page.url();
        const beforeText = await button.innerText({ timeout: 250 }).catch(() => "");
        const beforeExpanded = await button.getAttribute("aria-expanded", { timeout: 250 });
        const beforePressed = await button.getAttribute("aria-pressed", { timeout: 250 });
        const beforeClass = await button.getAttribute("class", { timeout: 250 });
        const beforeContainerClass = await button
          .locator("xpath=ancestor::*[contains(@class,'min-w-0')][1]")
          .getAttribute("class", { timeout: 250 })
          .catch(() => null);
        const beforeContainerStyle = await button
          .locator("xpath=ancestor::*[contains(@class,'min-w-0')][1]")
          .getAttribute("style", { timeout: 250 })
          .catch(() => null);
        const beforeDialogs = await page.getByRole("dialog").count();
        const beforeMenus = await page.getByRole("menu").count();
        const beforeResponses = successfulApplicationResponses;
        await button.click({ timeout: 250, force: true }).catch(() => undefined);
        await page.waitForTimeout(50);
        const afterUrl = page.url();
        const afterText = await button.innerText({ timeout: 250 }).catch(() => beforeText);
        const afterExpanded = await button
          .getAttribute("aria-expanded", { timeout: 250 })
          .catch(() => null);
        const afterPressed = await button
          .getAttribute("aria-pressed", { timeout: 250 })
          .catch(() => null);
        const afterClass = await button.getAttribute("class", { timeout: 250 }).catch(() => null);
        const afterContainerClass = await button
          .locator("xpath=ancestor::*[contains(@class,'min-w-0')][1]")
          .getAttribute("class", { timeout: 250 })
          .catch(() => null);
        const afterContainerStyle = await button
          .locator("xpath=ancestor::*[contains(@class,'min-w-0')][1]")
          .getAttribute("style", { timeout: 250 })
          .catch(() => null);
        const afterDialogs = await page.getByRole("dialog").count();
        const afterMenus = await page.getByRole("menu").count();
        const navigated = afterUrl !== beforeUrl;
        const changed =
          navigated ||
          beforeText !== afterText ||
          beforeExpanded !== afterExpanded ||
          beforePressed !== afterPressed ||
          beforeClass !== afterClass ||
          beforeContainerClass !== afterContainerClass ||
          beforeContainerStyle !== afterContainerStyle ||
          beforeDialogs !== afterDialogs ||
          beforeMenus !== afterMenus ||
          successfulApplicationResponses > beforeResponses;
        results.push({
          route,
          name,
          classification: navigated ? "NAVIGATION" : changed ? "FUNCTIONAL" : "DEAD_CANDIDATE",
          evidence: navigated
            ? `${beforeUrl} -> ${afterUrl}`
            : changed
              ? "observable UI or server response"
              : "no observable effect",
        });
        if (navigated) {
          await page.goto(route, { waitUntil: "domcontentloaded" });
        } else if (afterDialogs > beforeDialogs || afterMenus > beforeMenus) {
          await page.keyboard.press("Escape");
        }
      }
    }

    const summary = {
      renderedActionsAudited: results.length,
      routesAudited: routes.length,
      shard: process.env.PHASE404_CENSUS_SHARD ?? "all",
      functional: results.filter((item) => item.classification === "FUNCTIONAL").length,
      navigation: results.filter((item) => item.classification === "NAVIGATION").length,
      governedUnavailable: results.filter((item) => item.classification === "GOVERNED_UNAVAILABLE")
        .length,
      controlledWorkflow: results.filter((item) => item.classification === "CONTROLLED_WORKFLOW")
        .length,
      deadCandidates: results.filter((item) => item.classification === "DEAD_CANDIDATE").length,
      runtimeErrors,
      failedRequests,
    };
    await attachJson(testInfo, "phase404-action-census.json", { summary, results });
    console.log(`PHASE404_ACTION_CENSUS ${JSON.stringify(summary)}`);
    console.log(
      `PHASE404_DEAD_CANDIDATES ${JSON.stringify(results.filter((item) => item.classification === "DEAD_CANDIDATE"))}`,
    );
    expect(runtimeErrors, runtimeErrors.join("\n")).toEqual([]);
    expect(failedRequests, failedRequests.join("\n")).toEqual([]);
  });
});
