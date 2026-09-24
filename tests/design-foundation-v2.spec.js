import { test, expect } from "@playwright/test";

const password = process.env.ROLE_FIXTURE_PASSWORD;

test("Design Foundation v2 tokens and primitives are active", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await page.goto("/");
  await page.getByPlaceholder("Work email").fill("admin@ceac.local.test");
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".office-app")).toBeVisible({ timeout: 15000 });

  await page.goto("/?tab=primitives");
  await expect(page.locator(".office-app")).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Design primitives", exact: true })).toBeVisible();

  const foundation = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);
    return {
      canvas: root.getPropertyValue("--ceac-canvas").trim().toUpperCase(),
      shell: root.getPropertyValue("--ceac-shell").trim().toUpperCase(),
      primary: root.getPropertyValue("--ceac-primary").trim().toUpperCase(),
      ministry: root.getPropertyValue("--ceac-ministry").trim().toUpperCase(),
      font: body.fontFamily,
    };
  });

  expect(foundation.canvas).toBe("#F4F6F8");
  expect(foundation.shell).toBe("#0B1A2E");
  expect(foundation.primary).toBe("#0C5DF9");
  expect(foundation.ministry).toBe("#168B82");
  expect(foundation.font).toContain("Instrument Sans");
  expect(foundation.font).not.toMatch(/^Inter(?:,|$)/);

  const stats = page.locator(".stat");
  await expect(stats.first()).toBeVisible();
  await stats.first().click();
  await expect(page.locator(".ceac-toast")).toBeVisible();

  await expect(page.locator(".ch").first()).toBeVisible();
  await expect(page.locator(".tbl-wrap").first()).toBeVisible();
  await context.close();
});
