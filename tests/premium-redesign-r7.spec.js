import { test, expect } from "@playwright/test";

const password = process.env.ROLE_FIXTURE_PASSWORD;
const roles = [
  ["staff@ceac.local.test", ".staff-app", "Staff", ".staff-home-dashboard"],
  ["manager@ceac.local.test", ".manager-app", "Manager", ".home-dashboard"],
  ["admin@ceac.local.test", ".office-app", "Administration", ".admin-home-section"],
  ["exec@ceac.local.test", ".executive-app", "Executive", ".executive-intelligence-grid"],
];

async function openRole(browser, email, appClass, readySelector, reducedMotion = "no-preference", viewport = { width: 1440, height: 960 }) {
  const context = await browser.newContext({ viewport, reducedMotion });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  const started = Date.now();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(appClass)).toBeVisible({ timeout: 15000 });
  await expect(page.locator(readySelector).first()).toBeVisible({ timeout: 15000 });
  return { context, page, openMs: Date.now() - started };
}

test.describe("Premium redesign R7 closure", () => {
  for (const [email, appClass, label, readySelector] of roles) {
    test(`${label} shell matches the approved dashboard composition and opens fully`, async ({ browser }) => {
      const { context, page, openMs } = await openRole(browser, email, appClass, readySelector);
      expect(openMs).toBeLessThan(15000);

      await expect(page.locator(".premium-side")).toBeVisible();
      await expect(page.locator(".premium-topbar")).toBeVisible();
      await expect(page.locator(".reference-quick-create")).toBeVisible();
      await expect(page.locator(".reference-rail")).toBeVisible();
      await expect(page.locator(".reference-calendar-card")).toBeVisible();
      await expect(page.locator(".premium-create")).toBeVisible();

      const command = label === "Staff" ? ".staff-command-surface"
        : label === "Manager" ? ".manager-command-surface"
        : label === "Administration" ? ".admin-command-surface"
        : ".executive-command-surface";
      await expect(page.locator(command)).toBeVisible();

      const heroBackground = await page.locator(command).evaluate((el) => getComputedStyle(el).backgroundImage);
      expect(heroBackground).toContain("ceac-hero-landscape.svg");

      if (label === "Staff") {
        await expect(page.locator(".reference-module-strip")).toBeVisible();
        await expect(page.locator(".reference-module-grid button")).toHaveCount(5);
        await expect(page.locator(".reference-focus-grid")).toHaveCount(1);
        await expect(page.locator(".reference-focus-row")).toHaveCount(0);
        await expect(page.locator(".home-panel-waiting")).toBeVisible();
        await expect(page.locator(".home-panel-coming")).toBeVisible();
      }

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

  test("Staff mobile keeps the reference hierarchy without desktop chrome", async ({ browser }) => {
    const { context, page } = await openRole(browser, "staff@ceac.local.test", ".staff-app", ".staff-home-dashboard", "no-preference", { width: 390, height: 844 });
    await expect(page.locator(".premium-side")).toBeHidden();
    await expect(page.locator(".desktop-topbar")).toBeHidden();
    await expect(page.locator(".premium-mobile-topbar")).toBeVisible();
    await expect(page.locator(".staff-command-surface")).toBeVisible();
    await expect(page.locator(".reference-schedule-card")).toBeVisible();
    await expect(page.locator(".reference-module-strip")).toBeVisible();
    await expect(page.locator(".premium-tabs")).toBeVisible();
    await page.screenshot({ path: "test-artifacts/redesign-r7-staff-mobile.png", fullPage: true });
    await context.close();
  });

  test("Command K opens the navigation palette", async ({ browser }) => {
    const { context, page } = await openRole(browser, "staff@ceac.local.test", ".staff-app", ".staff-home-dashboard");
    await page.keyboard.press("Meta+K");
    await expect(page.locator(".premium-search-popover")).toBeVisible();
    await context.close();
  });

  test("Reduced-motion preference suppresses premium transitions", async ({ browser }) => {
    const { context, page } = await openRole(browser, "staff@ceac.local.test", ".staff-app", ".staff-home-dashboard", "reduce");
    const duration = await page.locator(".premium-create").evaluate((el) => getComputedStyle(el).transitionDuration);
    const values = duration.split(",").map((value) => parseFloat(value) || 0);
    expect(Math.max(...values)).toBeLessThanOrEqual(0.01);
    await context.close();
  });
});
