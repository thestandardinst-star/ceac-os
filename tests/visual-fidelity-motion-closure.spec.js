import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const password = process.env.ROLE_FIXTURE_PASSWORD;
const unitA = "20000000-0000-4000-8000-000000000011";

async function signInManager(page, viewport = { width: 1366, height: 768 }) {
  await page.setViewportSize(viewport);
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill("manager@ceac.local.test");
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".manager-app")).toBeVisible({ timeout: 15000 });
}

test("VF7A route continuity uses the accepted motion vocabulary without changing routing", async () => {
  const route = readFileSync("src/experience-v2/RouteTransition.jsx", "utf8");
  const app = readFileSync("src/App.jsx", "utf8");
  const shell = readFileSync("src/experience-v2/shell/shell.css", "utf8");

  expect(route).toContain('from "motion/react"');
  expect(route).toContain("AnimatePresence");
  expect(route).toContain("useReducedMotion");
  expect(route).toContain("EV2_TRANSITIONS.fast");
  expect(route).toContain('mode="wait"');
  expect(route).not.toMatch(/duration:\s*0\.[0-9]+/);

  for (const key of ["item:", "project:", "person:", "room:", "meeting:", "tab:"]) {
    expect(app).toContain(key);
  }
  expect(app).toContain("<RouteTransition routeKey={routeTransitionKey}>");
  expect(shell).toContain(".ev2-route-transition");
  expect(shell).not.toContain(".ev2-route-transition *");
});

test("VF7A preserves destination and Room URL/back context on the live shell", async ({ page }) => {
  await signInManager(page);

  const homeTransition = page.locator('.ev2-route-transition[data-route-key="tab:home"]');
  await expect(homeTransition).toBeVisible();

  await page.locator(".ev2s-sidebar").getByRole("button", { name: "Projects", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
  await expect(page.locator('.ev2-route-transition[data-route-key="tab:projects"]')).toBeVisible();
  expect(new URL(page.url()).searchParams.get("tab")).toBe("projects");

  await page.goto(`/?tab=messages&roomKind=unit&room=${unitA}`);
  await expect(page.locator(".room-screen")).toBeVisible({ timeout: 15000 });
  await expect(page.locator(`.ev2-route-transition[data-route-key="room:unit:${unitA}"]`)).toBeVisible();
  expect(new URL(page.url()).searchParams.get("roomKind")).toBe("unit");
  expect(new URL(page.url()).searchParams.get("room")).toBe(unitA);

  await page.locator(".room-back").click();
  await expect(page.locator(".room-screen")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Messages", exact: true })).toBeVisible();
  await expect(page.locator('.ev2-route-transition[data-route-key="tab:messages"]')).toBeVisible();
  expect(new URL(page.url()).searchParams.has("roomKind")).toBe(false);
  expect(new URL(page.url()).searchParams.has("room")).toBe(false);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await page.screenshot({ path: "test-artifacts/vf7a-route-context-laptop-1366.png", fullPage: true });
});


test("VF7B legacy Sheet shares the semantic motion vocabulary and touch floor", async () => {
  const bits = readFileSync("src/components/bits.jsx", "utf8");
  const styles = readFileSync("src/styles.css", "utf8");

  expect(bits).toContain('AnimatePresence, motion, useReducedMotion');
  expect(bits).toContain('EV2_TRANSITIONS');
  expect(bits).toContain('EV2_TRANSITIONS.fast');
  expect(bits).toContain('EV2_TRANSITIONS.panel');
  expect(bits).toContain('onExitComplete');
  expect(bits).toContain('requestClose');
  expect(bits).not.toMatch(/duration:\s*0\.[0-9]+/);

  expect(styles).not.toContain("ev2-sheet-backdrop-in");
  expect(styles).not.toContain("ev2-sheet-surface-in");
  expect(styles).toContain(".sheet-close{position:absolute;top:10px;right:12px;width:44px;height:44px");
});

for (const viewport of [
  { name: "phone-390", width: 390, height: 844 },
  { name: "laptop-1366", width: 1366, height: 768 },
]) {
  test(`VF7B Sheet and operational details preserve focused-work semantics at ${viewport.name}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    await page.goto("/");
    await page.getByPlaceholder("Work email").fill("manager@ceac.local.test");
    await page.getByPlaceholder("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator(".manager-app")).toBeVisible({ timeout: 15000 });

    await page.goto("/?tab=calendar");
    const calendar = page.locator(".ev2cal-manager-page");
    await expect(calendar).toBeVisible({ timeout: 15000 });
    const trigger = calendar.getByRole("button", { name: "View All", exact: true });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const sheet = page.locator(".sheet[role='dialog']");
    await expect(sheet).toBeVisible();
    const close = sheet.getByRole("button", { name: "Close dialog", exact: true });
    const closeBox = await close.boundingBox();
    expect(closeBox?.width || 0).toBeGreaterThanOrEqual(44);
    expect(closeBox?.height || 0).toBeGreaterThanOrEqual(44);
    await expect(sheet).toHaveCSS("opacity", "1");

    const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(pageOverflow).toBeLessThanOrEqual(1);

    await page.screenshot({
      path: `test-artifacts/vf7b-manager-calendar-sheet-${viewport.name}.png`,
      fullPage: false,
    });

    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await page.goto("/?tab=manager-finance");
    const finance = page.locator(".ev2-finance-manager");
    await expect(finance).toBeVisible({ timeout: 15000 });
    const summaries = finance.locator("details.finance-section > summary");
    await expect(summaries.first()).toBeVisible({ timeout: 15000 });
    expect(await summaries.count()).toBeGreaterThan(0);
    const heights = await summaries.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);

    await context.close();
  });
}
