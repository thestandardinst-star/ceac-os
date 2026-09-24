import { test, expect } from "@playwright/test";

const password = process.env.ROLE_FIXTURE_PASSWORD;

async function openAs(browser, email, viewport = { width: 1440, height: 960 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".app")).toBeVisible({ timeout: 15000 });
  return { context, page };
}

test("Design Foundation v2 desktop shell uses the approved quiet chrome", async ({ browser }) => {
  const { context, page } = await openAs(browser, "manager@ceac.local.test");

  await expect(page.locator(".premium-brand").getByText("CEAC OS", { exact: true })).toBeVisible();
  await expect(page.locator(".premium-brand-mark")).toHaveCount(0);
  await expect(page.locator(".premium-topbar-context")).toHaveCount(0);
  await expect(page.getByLabel("Current date and time")).toHaveCount(0);

  await expect(page.getByPlaceholder("Search your workspace…")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create", exact: true })).toBeVisible();
  await expect(page.locator(".premium-topbar").getByRole("button", { name: "Messages", exact: true })).toBeVisible();
  await expect(page.locator(".premium-topbar").getByRole("button", { name: "Open profile", exact: true })).toBeVisible();

  const search = await page.locator(".premium-search-wrap").boundingBox();
  expect(search).not.toBeNull();
  expect(Math.abs((search.x + search.width / 2) - 720)).toBeLessThan(120);

  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await context.close();
});

test("Design Foundation v2 mobile shell keeps communication one tap away", async ({ browser }) => {
  const { context, page } = await openAs(browser, "staff@ceac.local.test", { width: 390, height: 844 });
  const mobile = page.locator(".premium-mobile-topbar");

  await expect(mobile.getByText("CEAC OS", { exact: true })).toBeVisible();
  await expect(mobile.locator(".premium-brand-mark")).toHaveCount(0);
  await expect(mobile.getByRole("button", { name: "Messages", exact: true })).toBeVisible();
  await expect(mobile.getByRole("button", { name: "Open profile", exact: true })).toBeVisible();

  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await context.close();
});
