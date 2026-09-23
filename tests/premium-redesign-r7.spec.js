import { test, expect } from "@playwright/test";

const password = process.env.ROLE_FIXTURE_PASSWORD;
const roles = [
  ["staff@ceac.local.test", ".staff-app", "Staff"],
  ["manager@ceac.local.test", ".manager-app", "Manager"],
  ["admin@ceac.local.test", ".office-app", "Administration"],
  ["exec@ceac.local.test", ".executive-app", "Executive"],
];

async function openRole(browser, email, appClass, reducedMotion = "no-preference") {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  const started = Date.now();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(appClass)).toBeVisible({ timeout: 15000 });
  return { context, page, openMs: Date.now() - started };
}

test.describe("Premium redesign R7 closure", () => {
  for (const [email, appClass, label] of roles) {
    test(`${label} shell has named interactive controls and a bounded authenticated open`, async ({ browser }) => {
      const { context, page, openMs } = await openRole(browser, email, appClass);
      expect(openMs).toBeLessThan(15000);
      const unnamed = await page.evaluate(() => [...document.querySelectorAll("button,a,input,select,textarea")]
        .filter((el) => {
          const text = (el.textContent || "").trim();
          const aria = (el.getAttribute("aria-label") || "").trim();
          const labelled = (el.getAttribute("aria-labelledby") || "").trim();
          const title = (el.getAttribute("title") || "").trim();
          const placeholder = (el.getAttribute("placeholder") || "").trim();
          const alt = (el.getAttribute("alt") || "").trim();
          return !text && !aria && !labelled && !title && !placeholder && !alt;
        })
        .map((el) => el.outerHTML.slice(0, 180)));
      expect(unnamed, `Unnamed interactive controls: ${unnamed.join(" | ")}`).toEqual([]);
      await page.screenshot({ path: `test-artifacts/redesign-r7-${label.toLowerCase()}-desktop.png`, fullPage: true });
      await context.close();
    });
  }

  test("Reduced-motion preference suppresses premium transitions", async ({ browser }) => {
    const { context, page } = await openRole(browser, "staff@ceac.local.test", ".staff-app", "reduce");
    const duration = await page.locator(".premium-create").evaluate((el) => getComputedStyle(el).transitionDuration);
    const values = duration.split(",").map((value) => parseFloat(value) || 0);
    expect(Math.max(...values)).toBeLessThanOrEqual(0.01);
    await context.close();
  });
});
