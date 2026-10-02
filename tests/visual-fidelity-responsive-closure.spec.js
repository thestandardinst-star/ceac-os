import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const password = process.env.ROLE_FIXTURE_PASSWORD;

const roles = [
  { key: "staff", email: "staff@ceac.local.test", app: ".staff-app", ready: ".staffv2" },
  { key: "manager", email: "manager@ceac.local.test", app: ".manager-app", ready: ".managerv2-main" },
  { key: "administration", email: "admin@ceac.local.test", app: ".office-app", ready: ".adminv2-main" },
  { key: "executive", email: "exec@ceac.local.test", app: ".executive-app", ready: ".executivev2-main" },
];

async function signIn(page, role) {
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill(role.email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(role.app)).toBeVisible({ timeout: 15000 });
  await expect(page.locator(role.ready).first()).toBeVisible({ timeout: 15000 });
}

test("VF8A Administration phone composition does not use unequal-height full-panel rails", async () => {
  const css = readFileSync("src/experience-v2/admin-overview/admin-overview.css", "utf8");
  expect(css).toContain("@media (max-width: 599px)");
  expect(css).toContain("grid-template-columns: 1fr");
  expect(css).not.toContain("flex: 0 0 calc(100% - 2rem)");
  expect(css).not.toContain("scroll-snap-type: x proximity");
});

test("VF8A 320–430 phone matrix preserves all four role shells and deliberate mobile composition", async ({ browser }) => {
  test.setTimeout(300000);
  const widths = [320, 360, 375, 390, 414, 430];

  for (const width of widths) {
    for (const role of roles) {
      const context = await browser.newContext({ viewport: { width, height: 844 } });
      const page = await context.newPage();
      await signIn(page, role);
      await page.evaluate(() => document.fonts.ready);

      await expect(page.locator(".ev2s-mobile-topbar")).toBeVisible();
      await expect(page.locator(".ev2s-mobile-nav")).toBeVisible();
      await expect(page.locator(".ev2s-sidebar")).toBeHidden();
      await expect(page.locator(".ev2s-topbar")).toBeHidden();

      const geometry = await page.evaluate(() => {
        const body = document.querySelector(".app-content .body");
        const nav = document.querySelector(".ev2s-mobile-nav");
        const topbar = document.querySelector(".ev2s-mobile-topbar");
        const navButtons = [...document.querySelectorAll(".ev2s-mobile-nav button")];
        const bodyRect = body?.getBoundingClientRect();
        return {
          documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          bodyOverflow: document.body.scrollWidth - document.body.clientWidth,
          bodyLeft: bodyRect?.left ?? 0,
          bodyRight: bodyRect ? bodyRect.right - window.innerWidth : 0,
          navRight: nav ? nav.getBoundingClientRect().right - window.innerWidth : 0,
          topbarRight: topbar ? topbar.getBoundingClientRect().right - window.innerWidth : 0,
          navCount: navButtons.length,
          minNavHeight: navButtons.length
            ? Math.min(...navButtons.map((button) => button.getBoundingClientRect().height))
            : 0,
        };
      });

      expect(geometry.documentOverflow, `${role.key} document overflow at ${width}px`).toBeLessThanOrEqual(1);
      expect(geometry.bodyOverflow, `${role.key} body overflow at ${width}px`).toBeLessThanOrEqual(1);
      expect(geometry.bodyLeft, `${role.key} body starts outside ${width}px`).toBeGreaterThanOrEqual(-1);
      expect(geometry.bodyRight, `${role.key} body ends outside ${width}px`).toBeLessThanOrEqual(1);
      expect(Math.abs(geometry.navRight), `${role.key} nav edge at ${width}px`).toBeLessThanOrEqual(1);
      expect(Math.abs(geometry.topbarRight), `${role.key} topbar edge at ${width}px`).toBeLessThanOrEqual(1);
      expect(geometry.navCount).toBe(5);
      expect(geometry.minNavHeight, `${role.key} mobile nav touch floor at ${width}px`).toBeGreaterThanOrEqual(44);

      if (role.key === "administration") {
        const grids = page.locator(".adminv2-context-grid, .adminv2-support-grid");
        expect(await grids.count()).toBeGreaterThanOrEqual(3);
        const layouts = await grids.evaluateAll((nodes) => nodes.map((node) => ({
          display: getComputedStyle(node).display,
          columns: getComputedStyle(node).gridTemplateColumns,
          overflow: node.scrollWidth - node.clientWidth,
        })));
        for (const layout of layouts) {
          expect(layout.display).toBe("grid");
          expect(layout.columns.split(" ").filter(Boolean)).toHaveLength(1);
          expect(layout.overflow).toBeLessThanOrEqual(1);
        }
      }

      if (width === 320 || width === 430) {
        await page.screenshot({
          path: `test-artifacts/vf8a-${role.key}-phone-${width}.png`,
          fullPage: true,
        });
      }

      await context.close();
    }
  }
});
