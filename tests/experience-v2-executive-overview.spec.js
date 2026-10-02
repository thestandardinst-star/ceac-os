import fs from "node:fs";
import { test, expect } from "@playwright/test";

const password = process.env.ROLE_FIXTURE_PASSWORD;

async function openExecutive(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill("exec@ceac.local.test");
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".executive-app")).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".executivev2")).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".executivev2-main")).toBeVisible({ timeout: 15000 });
  return { context, page };
}

test.describe.configure({ mode: "serial" });

test("Stage 8 Executive Overview is isolated V2 presentation on preserved Executive authority", async () => {
  for (const path of [
    "src/experience-v2/executive-overview/ExecutiveOverviewV2.jsx",
    "src/experience-v2/executive-overview/executive-overview.css",
  ]) expect(fs.existsSync(path), path).toBeTruthy();

  const home = fs.readFileSync("src/screens/ExecutiveHome.jsx", "utf8");
  const view = fs.readFileSync("src/experience-v2/executive-overview/ExecutiveOverviewV2.jsx", "utf8");
  const css = fs.readFileSync("src/experience-v2/executive-overview/executive-overview.css", "utf8");
  const main = fs.readFileSync("src/main.jsx", "utf8");

  expect(home).toContain('from "../experience-v2/executive-overview/ExecutiveOverviewV2"');
  expect(home).toContain('supabase.from("recurring_operations")');
  expect(home).toContain('supabase.from("operation_occurrences")');
  expect(home).toContain('supabase.from("meeting_sessions")');
  expect(home).toContain('scheduleMeeting?.({ scope:"organisation", organisation:true })');
  expect(home).not.toContain("DashboardCalendar");
  expect(home).not.toContain("ReferenceModuleStrip");
  expect(home).not.toContain('from "../components/primitives"');

  expect(view).toContain('from "../components"');
  expect(view).toContain('from "../icons"');
  expect(view).toContain("Senior attention");
  expect(view).toContain("These are records, not scores");
  expect(view).toContain("Remains with authorised managers unless escalated");
  expect(view).not.toContain("ReferenceDashboard");
  expect(view).not.toContain("components/primitives");

  expect((css.match(/!important\b/g) || []).length).toBe(0);
  expect(css).toContain(".executivev2");
  expect(css).not.toContain(".executive-app");
  expect(css).not.toContain(".premium-");
  expect(css).not.toContain(".executive-command-surface");

  const adminCss = main.indexOf('import "./experience-v2/admin-overview/admin-overview.css";');
  const executiveCss = main.indexOf('import "./experience-v2/executive-overview/executive-overview.css";');
  expect(adminCss).toBeGreaterThan(-1);
  expect(executiveCss).toBeGreaterThan(adminCss);
});

for (const viewport of [
  { width: 320, height: 844, name: "320" },
  { width: 390, height: 844, name: "390" },
  { width: 1366, height: 768, name: "laptop" },
  { width: 1440, height: 900, name: "desktop" },
]) {
  test(`Stage 8 Executive Overview composes cleanly at ${viewport.name}`, async ({ browser }) => {
    const { context, page } = await openExecutive(browser, { width: viewport.width, height: viewport.height });

    await expect(page.getByRole("heading", { name: "Ministry overview", exact: true })).toBeVisible();
    await expect(page.locator(".executivev2-attention")).toBeVisible();
    await expect(page.locator(".executivev2-movement")).toBeVisible();
    await expect(page.locator(".executivev2-direction")).toBeVisible();
    await expect(page.locator(".executivev2-governance")).toBeVisible();
    await expect(page.locator(".executivev2-delivery")).toBeVisible();
    await expect(page.locator(".executive-command-surface")).toHaveCount(0);
    await expect(page.locator(".reference-calendar-card")).toHaveCount(0);
    await expect(page.locator(".reference-module-strip")).toHaveCount(0);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    if (viewport.width <= 599) {
      const compactHeights = await page.locator(".executivev2 .ev2c-button-compact:visible").evaluateAll((buttons) =>
        buttons.map((button) => button.getBoundingClientRect().height)
      );
      for (const height of compactHeights) expect(height).toBeGreaterThanOrEqual(44);
    }

    await page.screenshot({
      path: `test-artifacts/redesign-r7-stage8-executive-${viewport.name}.png`,
      fullPage: true,
    });
    await context.close();
  });
}


test("VF5A Executive briefing locks senior-attention-first mobile composition", async ({ browser }) => {
  const { context, page } = await openExecutive(browser, { width: 390, height: 844 });

  const attention = page.locator(".executivev2-attention");
  const movement = page.locator(".executivev2-movement");
  const [attentionBox, movementBox] = await Promise.all([attention.boundingBox(), movement.boundingBox()]);
  expect(attentionBox?.y || 0).toBeLessThan(movementBox?.y || Number.POSITIVE_INFINITY);

  const movementMetrics = await page.locator(".executivev2-movement .executivev2-stat-grid").evaluate((node) => ({
    scroll: node.scrollWidth,
    client: node.clientWidth,
    height: node.getBoundingClientRect().height,
  }));
  expect(movementMetrics.height).toBeLessThanOrEqual(120);

  for (const selector of [".executivev2-context-grid", ".executivev2-support-grid"]) {
    const rail = await page.locator(selector).evaluate((node) => ({
      scroll: node.scrollWidth,
      client: node.clientWidth,
    }));
    expect(rail.scroll).toBeGreaterThan(rail.client);
  }

  const delivery = await page.locator(".executivev2-delivery-grid").evaluate((node) => ({
    scroll: node.scrollWidth,
    client: node.clientWidth,
  }));
  expect(delivery.scroll).toBeGreaterThan(delivery.client);

  await context.close();
});

test("VF5B Executive Work and Ministry keep leadership records factual and role-specific", async () => {
  const work = fs.readFileSync("src/screens/ExecutiveWork.jsx", "utf8");
  const strategy = fs.readFileSync("src/screens/Strategy.jsx", "utf8");
  const css = fs.readFileSync("src/experience-v2/executive-overview/executive-surfaces.css", "utf8");
  const main = fs.readFileSync("src/main.jsx", "utf8");

  expect(work).toContain('eq("assigned_by", me.id)');
  expect(work).toContain('eq("work_items.status", "in_review")');
  expect(work).toContain('className="body executive-work premium-exec-page ev2-work-page ev2-work-executive"');
  expect(strategy).toContain('supabase.from("strategy_nodes")');
  expect(strategy).toContain('supabase.from("strategy_delivery_links")');
  expect(strategy).toContain("Descriptive objective — no percentage is generated.");
  expect(strategy).toContain("ev2-executive-ministry");
  expect(strategy).toContain("ev2ex-ministry-direction");
  expect(strategy).toContain("ev2ex-unit-objective");
  expect(css).toContain("/* VF5B — Executive Work / Ministry */");
  expect((css.match(/!important\\b/g) || []).length).toBe(0);

  const workCss = main.indexOf('import "./experience-v2/work-family/work-family.css";');
  const executiveSurfaceCss = main.indexOf('import "./experience-v2/executive-overview/executive-surfaces.css";');
  expect(workCss).toBeGreaterThan(-1);
  expect(executiveSurfaceCss).toBeGreaterThan(workCss);
});

for (const viewport of [
  { width: 390, height: 844, name: "phone-390" },
  { width: 1366, height: 768, name: "laptop-1366" },
]) {
  test(`VF5B Executive Work and Ministry compose as leadership surfaces at ${viewport.name}`, async ({ browser }) => {
    const { context, page } = await openExecutive(browser, { width: viewport.width, height: viewport.height });

    await page.goto("/?tab=work");
    await expect(page.locator(".ev2-work-executive")).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Work", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Given out/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Needs review/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Mine/ })).toBeVisible();
    let overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({
      path: `test-artifacts/vf5b-executive-work-${viewport.name}.png`,
      fullPage: true,
    });

    await page.goto("/?tab=strategy");
    await expect(page.locator(".ev2-executive-ministry")).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Ministry", exact: true })).toBeVisible();
    await expect(page.getByText("Strategic hierarchy", { exact: true })).toBeVisible();
    overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    if (viewport.width <= 599) {
      const actionHeights = await page.locator(".ev2-executive-ministry .btn:visible").evaluateAll((buttons) =>
        buttons.map((button) => button.getBoundingClientRect().height)
      );
      for (const height of actionHeights) expect(height).toBeGreaterThanOrEqual(44);
    }

    await page.screenshot({
      path: `test-artifacts/vf5b-executive-ministry-${viewport.name}.png`,
      fullPage: true,
    });

    await context.close();
  });
}
