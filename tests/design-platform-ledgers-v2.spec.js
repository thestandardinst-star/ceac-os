import { test, expect } from "@playwright/test";

const rolePassword = process.env.ROLE_FIXTURE_PASSWORD;
const routes = {
  Authority: "authority",
  "System rules": "policies",
  Integrations: "integrations",
  Events: "events",
  Announcements: "announcements",
};

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

async function openSurface(page, label) {
  const route = routes[label];
  if (!route) throw new Error(`No platform Ledger route for ${label}`);
  await page.goto(`/?tab=${route}`);
  await expect(page.locator(".body")).toBeVisible({ timeout: 15000 });
}

async function expectLedgerOrEmpty(page) {
  await expect(page.locator(".tbl-wrap, .ceac-empty-state").first()).toBeVisible();
}

test.describe.configure({ mode: "serial" });

test("Wave 4B platform surfaces use the shared Ledger contract", async ({ browser }) => {
  const { context, page } = await openAdmin(browser);
  const cases = [
    ["Authority", "Authority", "design-v2-platform-ledger-authority.png"],
    ["System rules", "Policies & rules", "design-v2-platform-ledger-rules.png"],
    ["Integrations", "Integrations", "design-v2-platform-ledger-integrations.png"],
    ["Events", "System events", "design-v2-platform-ledger-events.png"],
    ["Announcements", "Announcements", "design-v2-platform-ledger-announcements.png"],
  ];

  for (const [label, heading, shot] of cases) {
    await openSurface(page, label);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expectLedgerOrEmpty(page);
    await page.screenshot({ path: `test-artifacts/${shot}`, fullPage: true });
  }

  await context.close();
});

test("Policy catalogue keeps direct rule selection inside the Ledger", async ({ browser }) => {
  const { context, page } = await openAdmin(browser);
  await openSurface(page, "System rules");
  const rule = page.getByRole("button", { name: /Work quiet days/ }).first();
  await expect(rule).toBeVisible();
  await rule.click();
  await expect(page.getByText("Record version", { exact: true })).toBeVisible();
  await context.close();
});

test("Wave 4B platform Ledgers stay inside the phone viewport", async ({ browser }) => {
  const { context, page } = await openAdmin(browser, { width: 390, height: 844 });
  for (const label of Object.keys(routes)) {
    await openSurface(page, label);
    await expectLedgerOrEmpty(page);
    const overflow = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      body: document.body.scrollWidth - document.body.clientWidth,
    }));
    expect(overflow.document, `${label} overflowed the phone viewport`).toBeLessThanOrEqual(1);
    expect(overflow.body, `${label} body overflowed the phone viewport`).toBeLessThanOrEqual(1);
  }
  await page.screenshot({ path: "test-artifacts/design-v2-platform-ledger-mobile.png", fullPage: true });
  await context.close();
});
