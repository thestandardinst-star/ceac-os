import { test, expect } from "@playwright/test";

const password = process.env.ROLE_FIXTURE_PASSWORD;

async function signIn(browser, email, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".app")).toBeVisible({ timeout: 15000 });
  return { context, page };
}

async function expectNoPageOverflow(page) {
  const overflow = await page.evaluate(() => ({
    html: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.body.clientWidth,
  }));
  expect(overflow.html).toBeLessThanOrEqual(1);
  expect(overflow.body).toBeLessThanOrEqual(1);
}

test.describe.configure({ mode: "serial" });

for (const [width, expectedColumns] of [[1024, 1], [1180, 2], [1366, 2]]) {
  test(`Manager Overview keeps laptop proportions at ${width}px`, async ({ browser }) => {
    const { context, page } = await signIn(browser, "manager@ceac.local.test", { width, height: 820 });

    const dashboard = page.locator(".manager-app .home-dashboard");
    await expect(dashboard).toBeVisible();

    const geometry = await page.evaluate(() => {
      const body = document.querySelector(".manager-app .app-content > .body");
      const dashboard = document.querySelector(".manager-app .home-dashboard");
      const rail = document.querySelector(".manager-app .reference-rail");
      const rowTitle = document.querySelector(".manager-app .row-t");
      return {
        bodyWidth: body?.getBoundingClientRect().width || 0,
        columns: dashboard ? getComputedStyle(dashboard).gridTemplateColumns.split(" ").filter(Boolean).length : 0,
        railPosition: rail ? getComputedStyle(rail).position : null,
        rowTitleSize: rowTitle ? parseFloat(getComputedStyle(rowTitle).fontSize) : null,
      };
    });

    expect(geometry.bodyWidth).toBeLessThanOrEqual(1281);
    expect(geometry.columns).toBe(expectedColumns);
    if (geometry.railPosition) expect(geometry.railPosition).toBe("relative");
    if (geometry.rowTitleSize !== null) expect(geometry.rowTitleSize).toBeGreaterThanOrEqual(13);
    await expectNoPageOverflow(page);

    if (width === 1180) {
      await page.screenshot({ path: "test-artifacts/laptop-density-manager-1180.png", fullPage: true });
    }
    if (width === 1366) {
      await page.screenshot({ path: "test-artifacts/laptop-density-manager-1366.png", fullPage: true });
    }

    await context.close();
  });
}

test("Administration Learning remains centred and readable on a laptop", async ({ browser }) => {
  const { context, page } = await signIn(browser, "admin@ceac.local.test", { width: 1180, height: 820 });
  await page.goto("/?tab=learning");
  await expect(page.getByRole("heading", { name: "Learning", exact: true })).toBeVisible({ timeout: 15000 });

  const geometry = await page.evaluate(() => {
    const body = document.querySelector(".office-app .app-content > .body");
    const heading = document.querySelector(".office-app .h1");
    return {
      bodyWidth: body?.getBoundingClientRect().width || 0,
      headingSize: heading ? parseFloat(getComputedStyle(heading).fontSize) : 0,
    };
  });

  expect(geometry.bodyWidth).toBeLessThanOrEqual(1281);
  expect(geometry.headingSize).toBeGreaterThanOrEqual(30);
  await expectNoPageOverflow(page);
  await page.screenshot({ path: "test-artifacts/laptop-density-admin-learning-1180.png", fullPage: true });

  await context.close();
});

test("Wide desktop content still respects the 1280px reading measure", async ({ browser }) => {
  const { context, page } = await signIn(browser, "manager@ceac.local.test", { width: 1600, height: 900 });
  const width = await page.locator(".manager-app .app-content > .body").evaluate((el) => el.getBoundingClientRect().width);
  expect(width).toBeLessThanOrEqual(1281);
  await expectNoPageOverflow(page);
  await context.close();
});
