import { test, expect } from "@playwright/test";

const rolePassword = process.env.ROLE_FIXTURE_PASSWORD;

async function openAdmin(browser, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill("admin@ceac.local.test");
  await page.getByPlaceholder("Password").fill(rolePassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".office-app")).toBeVisible({ timeout: 15000 });
  return { context, page };
}

const routes = {
  People: "people",
  Units: "units",
  Workforce: "attendance",
  "Assets & devices": "assets",
  Compliance: "compliance",
};

async function openSurface(page, label) {
  const route = routes[label];
  if (!route) throw new Error(`No Ledger route for ${label}`);
  await page.goto(`/?tab=${route}`);
  await expect(page.locator(".body")).toBeVisible({ timeout: 15000 });
}

async function expectLedgerOrEmpty(page) {
  await expect(page.locator(".tbl-wrap, .ceac-empty-state").first()).toBeVisible();
}

test.describe.configure({ mode: "serial" });

test("Wave 4A operational surfaces use the shared Ledger contract", async ({ browser }) => {
  const { context, page } = await openAdmin(browser);

  await openSurface(page, "People");
  await expect(page.locator(".tbl-wrap")).toBeVisible();
  await expect(page.locator(".people-directory-row")).toHaveCount(0);
  await page.screenshot({ path: "test-artifacts/design-v2-ledger-people.png", fullPage: true });

  await openSurface(page, "Units");
  await expect(page.locator(".tbl-wrap")).toBeVisible();
  await expect(page.locator(".admin-unit-card")).toHaveCount(0);
  await page.screenshot({ path: "test-artifacts/design-v2-ledger-units.png", fullPage: true });

  await openSurface(page, "Workforce");
  await expect(page.locator(".tbl-wrap")).toBeVisible();
  await expect(page.locator(".workforce-person")).toHaveCount(0);
  await page.screenshot({ path: "test-artifacts/design-v2-ledger-workforce.png", fullPage: true });

  await openSurface(page, "Assets & devices");
  await expectLedgerOrEmpty(page);
  await expect(page.locator(".asset-grid")).toHaveCount(0);
  await page.screenshot({ path: "test-artifacts/design-v2-ledger-assets.png", fullPage: true });

  await openSurface(page, "Compliance");
  await expectLedgerOrEmpty(page);
  await expect(page.locator(".compliance-policy-grid")).toHaveCount(0);
  await page.screenshot({ path: "test-artifacts/design-v2-ledger-compliance.png", fullPage: true });

  await context.close();
});

test("Ledger rows are keyboard-operable without turning nested actions into row opens", async ({ browser }) => {
  const { context, page } = await openAdmin(browser);
  await openSurface(page, "Units");

  const unitRow = page.locator(".tbl tbody tr").filter({ hasText: "Test Unit A" }).first();
  await expect(unitRow).toBeVisible();
  await unitRow.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("navigation", { name: "Unit workspace" })).toBeVisible();

  await context.close();
});

test("Wave 4A Ledger surfaces contain horizontal scrolling on phone widths", async ({ browser }) => {
  const { context, page } = await openAdmin(browser, { width: 390, height: 844 });
  for (const label of ["People", "Units", "Workforce", "Assets & devices", "Compliance"]) {
    await openSurface(page, label);
    await expectLedgerOrEmpty(page);
    const overflow = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      body: document.body.scrollWidth - document.body.clientWidth,
    }));
    expect(overflow.document, `${label} overflowed the phone viewport`).toBeLessThanOrEqual(1);
    expect(overflow.body, `${label} body overflowed the phone viewport`).toBeLessThanOrEqual(1);
  }
  await page.screenshot({ path: "test-artifacts/design-v2-ledger-mobile.png", fullPage: true });
  await context.close();
});
