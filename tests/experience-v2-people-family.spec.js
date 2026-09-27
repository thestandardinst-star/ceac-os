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


async function openManagerTeam(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill("manager@ceac.local.test");
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".manager-app")).toBeVisible({ timeout: 15000 });
  await page.goto("/?tab=team");
  await expect(page.locator(".ev2-people-page.ev2-people-manager")).toBeVisible({ timeout: 15000 });
  return { context, page };
}

test("Stage 10 Family B3 Manager Team preserves factual unit scope without scoring", () => {
  const screen = readFileSync("src/screens/Team.jsx", "utf8");
  const shared = readFileSync("src/experience-v2/people-family/PeopleFamilyV2.jsx", "utf8");
  const css = readFileSync("src/experience-v2/people-family/people-family.css", "utf8");

  expect(shared).toContain("export function PeopleEvidencePerson");
  expect(screen).toContain("PeopleEvidencePerson");
  expect(screen).toContain('from("unit_memberships")');
  expect(screen).toContain('.eq("unit_id", me.unit_id)');
  expect(screen).toContain('from("work_items")');
  expect(screen).toContain('.neq("visibility", "private")');
  expect(screen).toContain('from("work_sessions")');
  expect(screen).toContain('from("submissions")');
  expect(screen).toContain('from("leave_requests")');
  expect(screen).toContain('from("pending_invitations")');
  expect(screen).toContain('from("unit_resources")');
  expect(screen).toContain('rpc("swap_sub_team_positions"');
  expect(screen).toContain('rpc("save_unit_resource"');
  expect(screen).toContain('rpc("set_unit_resource_active"');
  expect(screen).toContain("They are not a score or judgement about a person.");
  expect(screen).not.toMatch(/productivity score|performance score|ranking/i);
  expect(css).toContain(".ev2p-evidence-person");
  expect(css).not.toContain("!important");
});

for (const viewport of [
  { name: "phone-320", width: 320, height: 844 },
  { name: "phone-390", width: 390, height: 844 },
  { name: "laptop", width: 1366, height: 768 },
  { name: "desktop-1440", width: 1440, height: 900 },
]) {
  test(`Stage 10 Family B3 Manager Team composes at ${viewport.name}`, async ({ browser }) => {
    const { context, page } = await openManagerTeam(browser, { width: viewport.width, height: viewport.height });

    await expect(page.getByRole("heading", { name: "Your team", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Unit Room/ })).toBeVisible();
    await expect(page.getByText("People", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Work lanes", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Team setup", exact: true })).toBeVisible();

    const peopleSection = page.locator(".ev2p-section").filter({ hasText: /^People/ }).first();
    const setupHeading = page.getByRole("heading", { name: "Team setup", exact: true });
    const [peopleBox, setupBox] = await Promise.all([peopleSection.boundingBox(), setupHeading.boundingBox()]);
    expect(peopleBox?.y || 0).toBeLessThan(setupBox?.y || Number.POSITIVE_INFINITY);

    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

    const smallest = await page.locator(".ev2-people-manager").evaluate((root) => {
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

    const person = page.locator(".ev2p-evidence-person").filter({ hasText: "Staff Fixture" }).first();
    await expect(person).toBeVisible();
    const factualButtons = person.locator(".ev2p-evidence-strip button");
    expect(await factualButtons.count()).toBe(5);
    const count = await factualButtons.count();
    for (let index = 0; index < count; index += 1) {
      const box = await factualButtons.nth(index).boundingBox();
      expect(box?.height || 0).toBeGreaterThanOrEqual(44);
    }

    await page.screenshot({
      path: `test-artifacts/redesign-r7-stage10b3-manager-team-${viewport.name}.png`,
      fullPage: true,
    });
    await context.close();
  });
}

test("Stage 10 Family B3 Manager Team evidence opens the existing unit-scoped person workspace", async ({ browser }) => {
  const { context, page } = await openManagerTeam(browser, { width: 1366, height: 768 });
  const person = page.locator(".ev2p-evidence-person").filter({ hasText: "Staff Fixture" }).first();
  await expect(person).toBeVisible();
  await person.locator(".ev2p-evidence-strip button").filter({ hasText: "overdue" }).click();
  await expect(page.locator(".manager-person-detail")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Staff Fixture", exact: true })).toBeVisible();
  await expect(page.getByText(/operational context only/i)).toBeVisible();
  await context.close();
});
