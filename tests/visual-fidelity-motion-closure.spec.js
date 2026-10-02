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
