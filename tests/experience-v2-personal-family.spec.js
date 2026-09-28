import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const password = process.env.ROLE_FIXTURE_PASSWORD;

const roles = [
  { key: "staff", email: "staff@ceac.local.test", app: ".staff-app", personalDomains: true },
  { key: "manager", email: "manager@ceac.local.test", app: ".manager-app", personalDomains: true },
  { key: "admin", email: "admin@ceac.local.test", app: ".office-app", personalDomains: false },
  { key: "executive", email: "exec@ceac.local.test", app: ".executive-app", personalDomains: false },
];

async function openHub(browser, role, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill(role.email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(role.app)).toBeVisible({ timeout: 15000 });
  await page.goto("/?tab=me");
  await expect(page.locator(".ev2-personal-hub")).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: "My Hub", exact: true })).toBeVisible();
  return { context, page };
}

test("Stage 10 Family G2 preserves My Hub personal authority while establishing V2 personal-family presentation", async () => {
  const family = readFileSync("src/experience-v2/personal-family/PersonalFamilyV2.jsx", "utf8");
  const css = readFileSync("src/experience-v2/personal-family/personal-family.css", "utf8");
  const me = readFileSync("src/screens/Me.jsx", "utf8");
  const main = readFileSync("src/main.jsx", "utf8");
  const classifier = readFileSync("scripts/ci/classify-verification.mjs", "utf8");
  const levelA = readFileSync("scripts/ci/run-level-a-browser.sh", "utf8");

  for (const symbol of [
    "PersonalPageHeader",
    "PersonalDestinationGrid",
    "PersonalDestinationCard",
    "PersonalTabs",
    "PersonalSection",
    "PersonalRecordRow",
    "PersonalEmpty",
    "PersonalDetailGrid",
    "PersonalBoundary",
  ]) {
    expect(family).toContain(`export function ${symbol}`);
  }

  expect(main).toContain('import "./experience-v2/personal-family/personal-family.css";');
  expect(me).toContain('supabase.rpc("update_my_personal_details"');
  expect(me).toContain('supabase.from("personal_goals")');
  expect(me).toContain('supabase.from("personal_reminders")');
  expect(me).toContain('supabase.from("profile_personal_details")');
  expect(me).toContain('supabase.from("profiles")');
  expect(me).toContain("Your personal goals are not counted in CEAC reports");
  expect(me).toContain("Protected HR records");
  expect(me).toContain("Editing is disabled so unseen emergency-contact or address information cannot be overwritten with blanks.");
  expect(me).not.toContain("staff-page-intro");
  expect(me).not.toContain("hub-entry-grid");
  expect(css).toContain(".ev2-personal-page");
  expect(css).not.toContain("!important");

  expect(classifier).toContain('["personal", /personal-family');
  expect(classifier).toContain("person(?!al)");
  expect(levelA).toContain("personal)");
  expect(levelA).toContain("tests/experience-v2-personal-*.spec.js");
});

test("Stage 10 Family G2 keeps a failed private-details read from becoming an editable blank profile", async ({ browser }) => {
  const role = roles[0];
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  await page.goto("/");
  await page.getByPlaceholder("Work email").fill(role.email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(role.app)).toBeVisible({ timeout: 15000 });

  await page.route("**/rest/v1/profile_personal_details*", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "fixture private details read failed" }),
    });
  });

  await page.goto("/?tab=me");
  await expect(page.locator(".ev2-personal-hub")).toBeVisible({ timeout: 15000 });
  await page.getByRole("tab", { name: "Personal", exact: true }).click();

  await expect(page.getByText("Private contact details could not be loaded", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit personal details", exact: true })).toBeDisabled();
  await expect(page.getByText(/cannot be overwritten with blanks/i)).toBeVisible();
  await context.close();
});

for (const role of roles) {
  for (const viewport of [
    { name: "phone-390", width: 390, height: 844 },
    { name: "laptop-1366", width: 1366, height: 768 },
  ]) {
    test(`Stage 10 Family G2 ${role.key} My Hub preserves role-specific personal destinations at ${viewport.name}`, async ({ browser }) => {
      const { context, page } = await openHub(browser, role, { width: viewport.width, height: viewport.height });

      await expect(page.getByRole("button", { name: "My work history", exact: true })).toBeVisible();
      for (const label of ["Reviews & development", "My workforce context", "Learning", "My assets", "My compliance"]) {
        const button = page.getByRole("button", { name: label, exact: true });
        if (role.personalDomains) await expect(button).toBeVisible();
        else await expect(button).toHaveCount(0);
      }

      for (const tab of ["Goals", "Leave", "Personal"]) {
        await expect(page.getByRole("tab", { name: tab, exact: true })).toBeVisible();
      }

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${role.key} My Hub overflowed ${viewport.width}px viewport`).toBeLessThanOrEqual(1);

      await page.screenshot({
        path: `test-artifacts/redesign-r7-stage10g2-${role.key}-${viewport.name}.png`,
        fullPage: true,
      });
      await context.close();
    });
  }
}

for (const viewport of [
  { name: "phone-320", width: 320, height: 844 },
  { name: "phone-360", width: 360, height: 800 },
  { name: "phone-375", width: 375, height: 812 },
  { name: "phone-390", width: 390, height: 844 },
  { name: "phone-414", width: 414, height: 896 },
  { name: "phone-430", width: 430, height: 932 },
  { name: "intermediate-900", width: 900, height: 900 },
  { name: "laptop-1366", width: 1366, height: 768 },
  { name: "desktop-1440", width: 1440, height: 900 },
]) {
  test(`Stage 10 Family G2 richest Staff My Hub composes at ${viewport.name}`, async ({ browser }) => {
    const { context, page } = await openHub(browser, roles[0], { width: viewport.width, height: viewport.height });

    await expect(page.getByText(/personal goals are not counted in CEAC reports/i)).toBeVisible();

    const destinationHeights = await page.locator(".ev2pf-destination").evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().height)
    );
    expect(Math.min(...destinationHeights)).toBeGreaterThanOrEqual(44);

    const tabHeights = await page.locator(".ev2pf-tabs .ev2c-segmented-item").evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().height)
    );
    expect(Math.min(...tabHeights)).toBeGreaterThanOrEqual(44);

    const compactActionHeights = await page.locator(".ev2pf-section-action .ev2c-button:visible, .ev2pf-row-action .ev2c-button:visible").evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().height)
    );
    if (compactActionHeights.length) expect(Math.min(...compactActionHeights)).toBeGreaterThanOrEqual(44);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `Staff My Hub overflowed ${viewport.width}px viewport`).toBeLessThanOrEqual(1);

    const smallest = await page.locator(".ev2-personal-hub").evaluate((root) => {
      const values = [...root.querySelectorAll("*")]
        .filter((node) => {
          const style = getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0 && (node.textContent || "").trim();
        })
        .map((node) => parseFloat(getComputedStyle(node).fontSize))
        .filter((value) => Number.isFinite(value));
      return Math.min(...values);
    });
    expect(smallest).toBeGreaterThanOrEqual(12);

    await page.screenshot({
      path: `test-artifacts/redesign-r7-stage10g2-staff-${viewport.name}.png`,
      fullPage: true,
    });
    await context.close();
  });
}


test("Stage 10 Family G3 keeps personal leave inside established workforce authority", async () => {
  const me = readFileSync("src/screens/Me.jsx", "utf8");

  expect(me).toContain('supabase.rpc("workforce_request_leave"');
  expect(me).toContain('supabase.rpc("workforce_leave_action"');
  expect(me).toContain('p_action: "cancelled_by_employee"');
  expect(me).toContain("Manager and Administration decisions remain in Time & Leave.");
  expect(me).toContain("Open Time & Leave");
  expect(me).toContain("CEAC OS will not invent leave entitlement or remaining-day figures.");
  expect(me).toContain("It does not guess working-day totals, entitlement or payroll consequences here.");
  expect(me).not.toContain("manager_approved");
  expect(me).not.toContain("admin_approved");
  expect(me).not.toContain('className="leave-summary"');
  expect(me).not.toContain('className="leave-request-row"');
  expect(me).not.toContain("<Sheet");
  expect(me).not.toContain("<FieldGroup");
});

for (const viewport of [
  { name: "phone-320", width: 320, height: 844 },
  { name: "phone-360", width: 360, height: 800 },
  { name: "phone-375", width: 375, height: 812 },
  { name: "phone-390", width: 390, height: 844 },
  { name: "phone-414", width: 414, height: 896 },
  { name: "phone-430", width: 430, height: 932 },
  { name: "intermediate-900", width: 900, height: 900 },
  { name: "laptop-1366", width: 1366, height: 768 },
  { name: "desktop-1440", width: 1440, height: 900 },
]) {
  test(`Stage 10 Family G3 Staff personal leave composes at ${viewport.name}`, async ({ browser }) => {
    const { context, page } = await openHub(browser, roles[0], { width: viewport.width, height: viewport.height });

    await page.getByRole("tab", { name: "Leave", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Leave", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ask for leave", exact: true })).toBeVisible();
    await expect(page.getByText(/Manager and Administration decisions remain in Time & Leave/i)).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `Personal leave overflowed ${viewport.width}px viewport`).toBeLessThanOrEqual(1);

    const actionHeights = await page.locator(".ev2pf-section-action .ev2c-button:visible, .ev2pf-row-action .ev2c-button:visible").evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().height)
    );
    if (actionHeights.length) expect(Math.min(...actionHeights)).toBeGreaterThanOrEqual(44);

    await page.screenshot({
      path: `test-artifacts/redesign-r7-stage10g3-staff-${viewport.name}.png`,
      fullPage: true,
    });
    await context.close();
  });
}

test("Stage 10 Family G3 leave request uses the V2 guided modal without inventing day totals", async ({ browser }) => {
  const { context, page } = await openHub(browser, roles[0], { width: 390, height: 844 });

  await page.getByRole("tab", { name: "Leave", exact: true }).click();
  await page.getByRole("button", { name: "Ask for leave", exact: true }).click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ask for leave", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Annual", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sick", exact: true })).toBeVisible();
  await expect(page.getByLabel("Leave starts", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Leave ends", { exact: true })).toBeVisible();
  await expect(page.getByText(/does not guess working-day totals, entitlement or payroll consequences/i)).toBeVisible();
  await expect(page.getByText(/That is .* day/i)).toHaveCount(0);

  await page.screenshot({
    path: "test-artifacts/redesign-r7-stage10g3-staff-phone-390-leave-modal.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await context.close();
});


for (const role of roles) {
  test(`Stage 10 Family G3 preserves personal Time & Leave deep-link scope for ${role.key}`, async ({ browser }) => {
    const { context, page } = await openHub(browser, role, { width: 390, height: 844 });
    await page.getByRole("tab", { name: "Leave", exact: true }).click();

    const link = page.getByRole("button", { name: "Open Time & Leave", exact: true });
    if (role.personalDomains) await expect(link).toBeVisible();
    else await expect(link).toHaveCount(0);

    await context.close();
  });
}
