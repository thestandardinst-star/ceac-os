import { test, expect } from "@playwright/test";

const rolePassword = process.env.ROLE_FIXTURE_PASSWORD;

async function openAs(browser, email) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill(email);
  await page.getByPlaceholder("Password").fill(rolePassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".side")).toBeVisible({ timeout: 15000 });
  return { context, page };
}

test("Staff navigation stays inside the employee boundary", async ({ browser }) => {
  const { context, page } = await openAs(browser, "staff@ceac.local.test");
  const nav = page.locator(".side nav");
  await expect(nav).toContainText("Home");
  await expect(nav).toContainText("Work");
  await expect(nav).toContainText("Team");
  await expect(nav).not.toContainText("Record");
  await expect(nav).not.toContainText("Units");
  await expect(nav).not.toContainText("Reporting");
  await expect(nav).not.toContainText("Audit");
  await expect(nav).not.toContainText("Authority");
  await expect(nav).not.toContainText("Events");
  await expect(nav).not.toContainText("Workflows");
  await expect(nav).not.toContainText("Policies & rules");
  await expect(nav).not.toContainText("Integrations");
  await expect(nav).not.toContainText("Employee lifecycle");
  await expect(nav).not.toContainText("Delivery");
  await expect(nav).not.toContainText("Workload");
  await expect(nav).not.toContainText("Performance & development");
  await expect(nav).toContainText("Learning");
  await context.close();
});

test("Manager gets Manager destinations but not Administration authoring", async ({ browser }) => {
  const { context, page } = await openAs(browser, "manager@ceac.local.test");
  const nav = page.locator(".side nav");
  await expect(nav).toContainText("My work");
  await expect(nav).toContainText("Projects");
  await expect(nav).toContainText("Calendar");
  await expect(nav).toContainText("Reports");
  await expect(nav).not.toContainText("Units");
  await expect(nav).not.toContainText("People");
  await expect(nav).toContainText("Workforce");
  await expect(nav).not.toContainText("Audit");
  await expect(nav).not.toContainText("Authority");
  await expect(nav).not.toContainText("Events");
  await expect(nav).not.toContainText("Workflows");
  await expect(nav).not.toContainText("Policies & rules");
  await expect(nav).not.toContainText("Integrations");
  await expect(nav).not.toContainText("Employee lifecycle");
  await expect(nav).toContainText("Delivery");
  await expect(nav).toContainText("Workload");
  await expect(nav).toContainText("Performance & development");
  await expect(nav).toContainText("Learning");
  await context.close();
});

test("Administration gets Administration authoring", async ({ browser }) => {
  const { context, page } = await openAs(browser, "admin@ceac.local.test");
  const nav = page.locator(".side nav");
  await expect(nav).toContainText("Units");
  await expect(nav).toContainText("People");
  await expect(nav).toContainText("Workforce");
  await expect(nav).toContainText("Reports");
  await expect(nav).toContainText("Audit");
  await expect(nav).toContainText("Authority");
  await expect(nav).toContainText("Events");
  await expect(nav).toContainText("Workflows");
  await expect(nav).toContainText("Policies & rules");
  await expect(nav).toContainText("Integrations");
  await expect(nav).toContainText("Employee lifecycle");
  await expect(nav).toContainText("Delivery");
  await expect(nav).toContainText("Workload");
  await expect(nav).toContainText("Performance & development");
  await expect(nav).toContainText("Learning");
  await expect(nav).toContainText("Settings");
  await context.close();
});

test("Group Pastor has a dedicated non-Admin navigation boundary", async ({ browser }) => {
  const { context, page } = await openAs(browser, "exec@ceac.local.test");
  const nav = page.locator(".side nav");
  await expect(nav).toContainText("Home");
  await expect(nav).toContainText("Announcements");
  await expect(nav).toContainText("Me");
  await expect(nav).not.toContainText("Units");
  await expect(nav).not.toContainText("People");
  await expect(nav).not.toContainText("Workforce");
  await expect(nav).not.toContainText("Cost");
  await expect(nav).not.toContainText("Finance");
  await expect(nav).not.toContainText("Reporting");
  await expect(nav).not.toContainText("Audit");
  await expect(nav).not.toContainText("Authority");
  await expect(nav).not.toContainText("Events");
  await expect(nav).not.toContainText("Workflows");
  await expect(nav).not.toContainText("Policies & rules");
  await expect(nav).not.toContainText("Integrations");
  await expect(nav).not.toContainText("Employee lifecycle");
  await expect(nav).toContainText("Delivery");
  await expect(nav).not.toContainText("Workload");
  await expect(nav).not.toContainText("Performance & development");
  await expect(nav).not.toContainText("Learning");
  await expect(nav).not.toContainText("Settings");
  await context.close();
});
