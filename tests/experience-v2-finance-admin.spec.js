import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const password = process.env.ROLE_FIXTURE_PASSWORD;

async function openAdminFinance(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill("admin@ceac.local.test");
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".office-app")).toBeVisible({ timeout: 15000 });
  await page.goto("/?tab=finance");
  await expect(page.locator(".ev2-finance-admin")).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Finance", exact: true })).toBeVisible();
  return { context, page };
}

test("Stage 10 Family E3 preserves Administration finance authority and ledger semantics", async () => {
  const family = readFileSync("src/experience-v2/finance-family/FinanceFamilyV2.jsx", "utf8");
  const css = readFileSync("src/experience-v2/finance-family/finance-family.css", "utf8");
  const finance = readFileSync("src/screens/Finance.jsx", "utf8");

  expect(family).toContain("export function FinanceTabs");
  expect(family).not.toContain('name="money"');
  expect(family).not.toContain('icon="money"');
  expect(finance).toContain('authority="admin" canFulfil');
  expect(finance).toContain('supabase.from("income_lines").insert');
  expect(finance).toContain('supabase.from("internal_transfers").insert');
  expect(finance).toContain('supabase.from("internal_transfers").update');
  expect(finance).toContain("Currencies are never converted");
  expect(finance).not.toContain("Enter an amount in cedis.");
  expect(finance).toContain("not a bank balance");
  expect(finance).toContain("unconfirmed transfers are not counted as confirmed money in");
  expect(finance).toContain("ev2-finance-admin");
  expect(finance).toContain("const [loadError, setLoadError]");
  expect(finance).toContain("results.find((result) => result.error)");
  expect(finance).toContain('title="Finance records could not be loaded"');
  expect(finance).toContain("const hasBudget = budgets.some");
  expect(finance).toContain('"Not recorded"');
  expect(finance).not.toContain(".delete(");
  expect(css).toContain(".ev2-finance-admin");
  expect(css).not.toContain("!important");
});

test("Stage 10 Family E3 keeps a failed finance read distinct from a truthful empty ledger", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill("admin@ceac.local.test");
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".office-app")).toBeVisible({ timeout: 15000 });

  await page.route("**/rest/v1/budgets*", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "fixture finance read failed" }),
    });
  });

  await page.goto("/?tab=finance");
  await expect(page.locator(".ev2-finance-admin")).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Finance records could not be loaded", { exact: true })).toBeVisible();
  await expect(page.getByText("No finance records yet", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Try again", exact: true })).toBeVisible();
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
  test(`Stage 10 Family E3 Administration Finance composes at ${viewport.name}`, async ({ browser }) => {
    const { context, page } = await openAdminFinance(browser, { width: viewport.width, height: viewport.height });

    const financeTabs = page.locator(".ev2fin-tabs");
    for (const tab of ["Overview", "Money in", "Money out", "Between departments"]) {
      await expect(financeTabs.getByRole("button", { name: tab, exact: true })).toBeVisible();
    }
    await expect(financeTabs.getByRole("button", { name: "Overview", exact: true })).toHaveAttribute("aria-pressed", "true");

    const tabBounds = await financeTabs.evaluate((container) => {
      const parent = container.getBoundingClientRect();
      return [...container.querySelectorAll("button")].map((button) => {
        const rect = button.getBoundingClientRect();
        return { left: rect.left - parent.left, right: parent.right - rect.right };
      });
    });
    for (const bounds of tabBounds) {
      expect(bounds.left, `Finance section starts outside ${viewport.width}px tab area`).toBeGreaterThanOrEqual(-1);
      expect(bounds.right, `Finance section ends outside ${viewport.width}px tab area`).toBeGreaterThanOrEqual(-1);
    }
    if (viewport.width <= 760) {
      await expect(financeTabs).toHaveCSS("display", "grid");
    }
    await expect(page.getByText("Requests needing Administration", { exact: true })).toBeVisible();
    await expect(page.getByText(/not a bank balance/i).first()).toBeVisible();

    await financeTabs.getByRole("button", { name: "Money in", exact: true }).click();
    await expect(page.getByRole("button", { name: "Record money received", exact: true })).toBeVisible();

    await financeTabs.getByRole("button", { name: "Money out", exact: true }).click();
    await expect(page.getByText("Money spent", { exact: true })).toBeVisible();

    await financeTabs.getByRole("button", { name: "Between departments", exact: true }).click();
    await expect(page.getByRole("button", { name: "Record money sent", exact: true })).toBeVisible();
    await expect(page.getByText(/two-sided/i).first()).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `Administration Finance overflowed ${viewport.width}px viewport`).toBeLessThanOrEqual(1);

    const tabHeights = await page.locator(".ev2fin-tabs button").evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));
    expect(Math.min(...tabHeights)).toBeGreaterThanOrEqual(44);

    const smallest = await page.locator(".ev2-finance-admin").evaluate((root) => {
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

    await financeTabs.getByRole("button", { name: "Overview", exact: true }).click();
    await page.screenshot({ path: `test-artifacts/redesign-r7-stage10e3-admin-finance-${viewport.name}.png`, fullPage: true });
    await context.close();
  });
}
