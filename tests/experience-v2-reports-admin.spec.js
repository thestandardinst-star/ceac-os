import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const password = process.env.ROLE_FIXTURE_PASSWORD;

async function openAdminReports(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill("admin@ceac.local.test");
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".office-app")).toBeVisible({ timeout: 15000 });
  await page.goto("/?tab=reporting");
  await expect(page.locator(".ev2-reporting-admin")).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Reports", exact: true })).toBeVisible();
  return { context, page };
}

test("Stage 10 Family F3 preserves Administration reporting authority and truthful coverage semantics", async () => {
  const family = readFileSync("src/experience-v2/reporting-family/ReportingFamilyV2.jsx", "utf8");
  const css = readFileSync("src/experience-v2/reporting-family/reporting-family.css", "utf8");
  const reports = readFileSync("src/screens/Reports.jsx", "utf8");

  for (const symbol of ["ReportingPageHeader", "ReportingSection", "ReportingEvidenceGrid", "ReportingEvidenceCard", "ReportingRecordRow", "ReportingEmpty", "ReportingFootnote"]) {
    expect(family).toContain(`export function ${symbol}`);
  }

  expect(reports).toContain('supabase.from("report_periods").insert');
  expect(reports).toContain('supabase.from("report_periods").update');
  expect(reports).toContain('supabase.from("reports").select');
  expect(reports).toContain('scope === "unit"');
  expect(reports).toContain("not a performance score");
  expect(reports).toContain("ev2-reporting-admin");
  expect(reports).toContain("Reporting records could not be loaded");
  expect(reports).not.toContain("<Chart");
  expect(reports).not.toContain('kind="donut"');
  expect(reports).not.toContain(".delete(");
  expect(reports).not.toContain('scope: "person"');
  expect(css).toContain(".ev2-reporting-admin");
  expect(css).not.toContain("!important");
});

test("Stage 10 Family F3 keeps a failed Administration reporting read distinct from zero coverage", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill("admin@ceac.local.test");
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".office-app")).toBeVisible({ timeout: 15000 });

  await page.route("**/rest/v1/report_periods*", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "fixture reporting read failed" }),
    });
  });

  await page.goto("/?tab=reporting");
  await expect(page.getByText("Reporting records could not be loaded", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again", exact: true })).toBeVisible();
  await expect(page.getByText("No reporting periods recorded", { exact: true })).toHaveCount(0);
  await context.close();
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
  test(`Stage 10 Family F3 Administration Reports composes at ${viewport.name}`, async ({ browser }) => {
    const { context, page } = await openAdminReports(browser, { width: viewport.width, height: viewport.height });

    const openPeriod = page.getByRole("button", { name: "Open reporting period", exact: true });
    await expect(openPeriod).toBeVisible();
    const buttonBox = await openPeriod.boundingBox();
    expect(buttonBox?.height || 0).toBeGreaterThanOrEqual(44);

    await expect(page.getByText(/not a performance score/i).last()).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `Administration Reports overflowed ${viewport.width}px viewport`).toBeLessThanOrEqual(1);

    const smallest = await page.locator(".ev2-reporting-admin").evaluate((root) => {
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

    await page.screenshot({ path: `test-artifacts/redesign-r7-stage10f3-admin-reports-${viewport.name}.png`, fullPage: true });
    await context.close();
  });
}
