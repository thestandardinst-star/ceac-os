import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const password = process.env.ROLE_FIXTURE_PASSWORD;

async function openStaffTeam(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill("staff@ceac.local.test");
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".staff-app")).toBeVisible({ timeout: 15000 });
  await page.goto("/?tab=team");
  await expect(page.locator(".ev2-people-page.ev2-people-staff")).toBeVisible({ timeout: 15000 });
  return { context, page };
}

test("Stage 10 Family B2 Staff Team uses the shared People family without authority drift", () => {
  const screen = readFileSync("src/screens/StaffTeam.jsx", "utf8");
  const shared = readFileSync("src/experience-v2/people-family/PeopleFamilyV2.jsx", "utf8");
  const css = readFileSync("src/experience-v2/people-family/people-family.css", "utf8");
  const main = readFileSync("src/main.jsx", "utf8");

  for (const symbol of [
    "PeoplePageHeader",
    "PeopleRoomCard",
    "PeopleSection",
    "PeoplePersonRow",
    "PeopleFactRow",
    "PeopleResourceRow",
  ]) {
    expect(shared).toContain(`export function ${symbol}`);
    expect(screen).toContain(symbol);
  }

  for (const protectedPath of [
    'from("unit_memberships")',
    'rpc("list_unit_approved_leave"',
    'from("sub_teams")',
    'from("unit_resources")',
  ]) {
    expect(screen).toContain(protectedPath);
  }

  expect(screen).toContain("ev2-people-page");
  expect(screen).not.toContain("team-primary-tabs");
  expect(screen).not.toContain("team-section-toggle");
  expect(css).toContain(".ev2-people-page");
  expect(css).not.toContain("!important");
  expect(main).toContain('import "./experience-v2/people-family/people-family.css";');
});

for (const viewport of [
  { name: "phone-320", width: 320, height: 844 },
  { name: "phone-390", width: 390, height: 844 },
  { name: "laptop", width: 1366, height: 768 },
  { name: "desktop-1440", width: 1440, height: 900 },
]) {
  test(`Stage 10 Family B2 Staff Team composes at ${viewport.name}`, async ({ browser }) => {
    const { context, page } = await openStaffTeam(browser, { width: viewport.width, height: viewport.height });

    await expect(page.getByRole("heading", { name: "Team", exact: true })).toBeVisible();
    await expect(page.getByText("People", { exact: true }).first()).toBeVisible();

    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

    const smallest = await page.locator(".ev2-people-page").evaluate((root) => {
      const values = [...root.querySelectorAll("*")]
        .filter((node) => {
          const style = getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return style.visibility !== "hidden"
            && style.display !== "none"
            && rect.width > 0
            && rect.height > 0
            && (node.textContent || "").trim();
        })
        .map((node) => parseFloat(getComputedStyle(node).fontSize))
        .filter((value) => Number.isFinite(value));
      return Math.min(...values);
    });
    expect(smallest).toBeGreaterThanOrEqual(12);

    const actionable = page.locator(".ev2p-room:visible, .ev2p-section-toggle:visible, .ev2p-resource-row:visible");
    const count = await actionable.count();
    for (let index = 0; index < count; index += 1) {
      const box = await actionable.nth(index).boundingBox();
      expect(box?.height || 0).toBeGreaterThanOrEqual(44);
    }

    await page.screenshot({
      path: `test-artifacts/redesign-r7-stage10b2-staff-team-${viewport.name}.png`,
      fullPage: true,
    });
    await context.close();
  });
}
