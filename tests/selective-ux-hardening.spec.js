import { test, expect } from "@playwright/test";

const password = process.env.ROLE_FIXTURE_PASSWORD;

async function openAdmin(browser) {
  const context = await browser.newContext({ viewport: { width: 1180, height: 820 } });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill("admin@ceac.local.test");
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".app")).toBeVisible({ timeout: 15000 });
  return { context, page };
}

test("retained UX primitives work inside the restored CEAC visual system", async ({ browser }) => {
  const { context, page } = await openAdmin(browser);
  await page.goto("/?tab=primitives");
  await expect(page.getByRole("heading", { name: "Design primitives" })).toBeVisible({ timeout: 15000 });

  const stat = page.getByRole("button", { name: /Needs a decision/ }).first();
  await expect(stat).toBeVisible();
  await stat.click();
  await expect(page.locator(".ceac-toast")).toBeVisible();
  await expect(page.locator(".ceac-toast")).toContainText("Opened queue");
  await page.getByRole("button", { name: "Dismiss" }).click();
  await expect(page.locator(".ceac-toast")).toHaveCount(0);

  const clickableRow = page.locator(".tbl tbody tr.clickable").first();
  await expect(clickableRow).toBeVisible();
  await expect(clickableRow).toHaveAttribute("tabindex", "0");
  await clickableRow.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".ceac-toast")).toBeVisible();
  await expect(page.locator(".ceac-toast")).toContainText("Opened");

  const focusOutline = await clickableRow.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(focusOutline).not.toBe("none");

  await page.screenshot({ path: "test-artifacts/selective-ux-primitives.png", fullPage: true });
  await context.close();
});
