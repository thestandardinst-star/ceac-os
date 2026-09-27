import fs from "node:fs";
import { test, expect } from "@playwright/test";

const password = process.env.ROLE_FIXTURE_PASSWORD;

async function openManager(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill("manager@ceac.local.test");
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".manager-app")).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".managerv2")).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".managerv2-main")).toBeVisible({ timeout: 15000 });
  return { context, page };
}

test.describe.configure({ mode: "serial" });

test("Stage 6 Manager Overview is isolated V2 presentation on preserved manager authority", async () => {
  for (const path of [
    "src/experience-v2/manager-overview/ManagerOverviewV2.jsx",
    "src/experience-v2/manager-overview/manager-overview.css",
  ]) {
    expect(fs.existsSync(path), path).toBeTruthy();
  }

  const home = fs.readFileSync("src/screens/ManagerHome.jsx", "utf8");
  const view = fs.readFileSync("src/experience-v2/manager-overview/ManagerOverviewV2.jsx", "utf8");
  const css = fs.readFileSync("src/experience-v2/manager-overview/manager-overview.css", "utf8");
  const main = fs.readFileSync("src/main.jsx", "utf8");

  expect(home).toContain('from "../experience-v2/manager-overview/ManagerOverviewV2"');
  expect(home).toContain('supabase.rpc("unit_budget_position"');
  expect(home).toContain('supabase.rpc("respond_to_blocker"');
  expect(home).toContain('supabase.rpc("resolve_blocker"');
  expect(home).not.toContain("ReferenceFocusPanel");
  expect(home).not.toContain("DashboardCalendar");
  expect(home).not.toContain("ReferenceModuleStrip");
  expect(home).not.toContain('from "../components/primitives"');

  expect(view).toContain('from "../components"');
  expect(view).toContain('from "../icons"');
  expect(view).toContain("Needs your decision");
  expect(view).toContain("Availability is context, not a performance measure.");
  expect(view).toContain("This is not a performance score.");
  expect(view).not.toContain("components/bits");
  expect(view).not.toContain("ReferenceDashboard");

  expect((css.match(/!important\b/g) || []).length).toBe(0);
  expect(css).toContain(".managerv2");
  expect(css).not.toContain(".manager-app");
  expect(css).not.toContain(".premium-");
  expect(css).not.toContain(".home-panel");

  const staffCss = main.indexOf('import "./experience-v2/staff-today/staff-today.css";');
  const managerCss = main.indexOf('import "./experience-v2/manager-overview/manager-overview.css";');
  expect(staffCss).toBeGreaterThan(-1);
  expect(managerCss).toBeGreaterThan(staffCss);
});

for (const viewport of [
  { width: 320, height: 844, name: "320" },
  { width: 390, height: 844, name: "390" },
  { width: 1366, height: 768, name: "laptop" },
  { width: 1440, height: 900, name: "desktop" },
]) {
  test(`Stage 6 Manager Overview composes cleanly at ${viewport.name}`, async ({ browser }) => {
    const { context, page } = await openManager(browser, { width: viewport.width, height: viewport.height });

    await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening), Manager/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Give out work", exact: true })).toBeVisible();
    await expect(page.locator(".managerv2-decisions")).toBeVisible();
    await expect(page.locator(".managerv2-team")).toBeVisible();
    await expect(page.locator(".managerv2-delivery")).toBeVisible();
    await expect(page.locator(".managerv2-finance")).toBeVisible();
    await expect(page.locator(".reference-module-strip")).toHaveCount(0);
    await expect(page.locator(".manager-command-surface")).toHaveCount(0);

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);

    if (viewport.width <= 599) {
      const compactHeights = await page.locator(".managerv2 .ev2c-button-compact:visible").evaluateAll((buttons) =>
        buttons.map((button) => button.getBoundingClientRect().height)
      );
      for (const height of compactHeights) expect(height).toBeGreaterThanOrEqual(44);
    }

    if (viewport.width === 320) {
      const decisionRow = page.locator(".managerv2-decision-row").first();
      await expect(decisionRow).toBeVisible();
      const geometry = await decisionRow.evaluate((row) => {
        const copy = row.querySelector(".managerv2-decision-copy");
        const rowBox = row.getBoundingClientRect();
        const copyBox = copy.getBoundingClientRect();
        return {
          rowWidth: rowBox.width,
          copyWidth: copyBox.width,
          copyOffset: copyBox.left - rowBox.left,
        };
      });
      expect(geometry.copyWidth).toBeGreaterThanOrEqual(geometry.rowWidth * 0.65);
      expect(geometry.copyOffset).toBeLessThanOrEqual(56);
    }

    await page.screenshot({
      path: `test-artifacts/redesign-r7-stage6-manager-${viewport.name}.png`,
      fullPage: true,
    });
    await context.close();
  });
}
