import { test, expect } from "@playwright/test";

const password = process.env.ROLE_FIXTURE_PASSWORD;

async function openRole(browser, email, appClass, viewport = { width: 390, height: 844 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(appClass)).toBeVisible({ timeout: 15000 });
  return { context, page };
}

async function openMore(page) {
  await page.locator(".premium-tabs").getByRole("button", { name: "More", exact: true }).click();
  await expect(page.locator(".premium-mobile-menu")).toBeVisible();
}

const legacyLabels = [
  "Strategy", "Delivery", "Workload", "Workforce", "Assets & devices",
  "Employee lifecycle", "Performance & development", "Protected HR",
  "Cost", "Audit", "Events", "Workflows", "Authority", "System rules", "Integrations"
];

test.describe("Premium redesign R6 whole-system consistency", () => {
  test("Staff mobile More contains only approved shell destinations", async ({ browser }) => {
    const { context, page } = await openRole(browser, "staff@ceac.local.test", ".staff-app");
    await openMore(page);
    for (const label of legacyLabels) await expect(page.getByRole("menuitem", { name: label, exact: true })).toHaveCount(0);
    await expect(page.getByRole("menuitem", { name: "Calendar", exact: true })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Messages", exact: true })).toBeVisible();
    await page.screenshot({ path: "test-artifacts/redesign-r6-staff-mobile-more.png", fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await context.close();
  });

  test("Manager mobile More is not a legacy module catalogue", async ({ browser }) => {
    const { context, page } = await openRole(browser, "manager@ceac.local.test", ".manager-app");
    await openMore(page);
    for (const label of legacyLabels) await expect(page.getByRole("menuitem", { name: label, exact: true })).toHaveCount(0);
    for (const label of ["Calendar", "Budget", "Reports", "Messages"]) await expect(page.getByRole("menuitem", { name: label, exact: true })).toBeVisible();
    await page.screenshot({ path: "test-artifacts/redesign-r6-manager-mobile-more.png", fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await context.close();
  });

  test("Administration mobile More exposes role shell destinations and Control Center", async ({ browser }) => {
    const { context, page } = await openRole(browser, "admin@ceac.local.test", ".office-app");
    await openMore(page);
    for (const label of legacyLabels) await expect(page.getByRole("menuitem", { name: label, exact: true })).toHaveCount(0);
    for (const label of ["Reports", "Control Center", "Messages"]) await expect(page.getByRole("menuitem", { name: label, exact: true })).toBeVisible();
    await page.screenshot({ path: "test-artifacts/redesign-r6-admin-mobile-more.png", fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await context.close();
  });

  test("Executive mobile More stays within the approved executive shell", async ({ browser }) => {
    const { context, page } = await openRole(browser, "exec@ceac.local.test", ".executive-app");
    await openMore(page);
    for (const label of legacyLabels) await expect(page.getByRole("menuitem", { name: label, exact: true })).toHaveCount(0);
    for (const label of ["Organisation", "Finance", "Reports", "Messages"]) await expect(page.getByRole("menuitem", { name: label, exact: true })).toBeVisible();
    await page.screenshot({ path: "test-artifacts/redesign-r6-executive-mobile-more.png", fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await context.close();
  });
});
