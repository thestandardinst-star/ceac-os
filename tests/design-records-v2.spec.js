import { test, expect } from "@playwright/test";

const rolePassword = process.env.ROLE_FIXTURE_PASSWORD;

async function openAs(browser, email, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill(email);
  await page.getByPlaceholder("Password").fill(rolePassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".app")).toBeVisible({ timeout: 15000 });
  return { context, page };
}

async function side(page, label) {
  await page.locator(".premium-side").getByRole("button", { name: label, exact: true }).click();
  await expect(page.locator(".body")).toBeVisible({ timeout: 15000 });
}

test.describe.configure({ mode: "serial" });

test("Manager Person Detail uses the shared Record frame", async ({ browser }) => {
  const { context, page } = await openAs(browser, "manager@ceac.local.test");
  await side(page, "Team");
  const person = page.locator(".manager-person-card").filter({ hasText: "Staff Fixture" }).first();
  await expect(person).toBeVisible();
  await person.locator(".manager-person-main").click();
  await expect(page.locator(".manager-person-detail.ceac-record")).toBeVisible();
  await expect(page.locator(".manager-person-detail .ceac-record-layout")).toBeVisible();
  await expect(page.locator(".manager-person-detail .ceac-record-rail")).toBeVisible();
  await expect(page.getByText("Current context", { exact: true })).toBeVisible();
  await context.close();
});

test("Work Detail keeps work primary and factual context beside it", async ({ browser }) => {
  const title = "Design Wave 3 record task";
  {
    const { context, page } = await openAs(browser, "manager@ceac.local.test");
    await page.getByRole("button", { name: "Give out work" }).click();
    await page.getByLabel("Work to complete").fill(title);
    await page.getByLabel("Why this matters").fill("Verify the Record archetype without changing work authority.");
    await page.getByLabel(/No steps needed/).check();
    const assignee = page.locator("select.field").filter({ has: page.locator("option", { hasText: "Staff Fixture" }) });
    await assignee.selectOption({ label: "Staff Fixture" });
    await page.locator('input[type="datetime-local"]').last().fill(new Date(Date.now() + 2 * 86400000).toISOString().slice(0,16));
    await page.getByRole("button", { name: "Give it out", exact: true }).click();
    await expect(page.getByText(/is with them/)).toBeVisible();
    await context.close();
  }
  {
    const { context, page } = await openAs(browser, "staff@ceac.local.test");
    await side(page, "Work");
    await page.getByText(title, { exact: true }).click();
    await expect(page.locator(".staff-work-detail.ceac-record .ceac-record-layout")).toBeVisible();
    await expect(page.locator(".staff-work-detail .ceac-record-rail")).toBeVisible();
    await expect(page.getByText("Work context", { exact: true })).toBeVisible();
    await context.close();
  }
});

test("Room shows membership context without claiming realtime presence", async ({ browser }) => {
  const { context, page } = await openAs(browser, "manager@ceac.local.test");
  await side(page, "Team");
  await page.getByRole("button", { name: /Unit Room/ }).click();
  await expect(page.locator(".room-screen.ceac-record .room-record-grid")).toBeVisible();
  await expect(page.getByText("People in this Room", { exact: true })).toBeVisible();
  await expect(page.getByText(/not an online-presence indicator/i)).toBeVisible();
  await context.close();
});

test("Meeting uses the shared Record frame and context rail", async ({ browser }) => {
  const title = "Design Wave 3 meeting";
  const starts = new Date(Date.now() + 86400000).toISOString().slice(0,16);
  const { context, page } = await openAs(browser, "manager@ceac.local.test");
  await side(page, "Calendar");
  await page.getByRole("button", { name: "Schedule meeting" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("What is this meeting for?").fill(title);
  await dialog.locator('input[type="datetime-local"]').first().fill(starts);
  const unitAudience = dialog.getByRole("button", { name: /Everyone in this unit/ });
  if (!(await unitAudience.getAttribute("class") || "").includes("on")) await unitAudience.click();
  await dialog.getByRole("button", { name: "Schedule and notify" }).click();
  await expect(page.locator(".meeting-screen.ceac-record .ceac-record-layout")).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Meeting context", { exact: true })).toBeVisible();
  await context.close();
});
