import { test, expect } from "@playwright/test";

const password = process.env.ROLE_FIXTURE_PASSWORD;

async function openAdminGallery(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill("admin@ceac.local.test");
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".app")).toBeVisible({ timeout: 15000 });
  await page.goto("/?tab=primitives");
  const gallery = page.locator(".ev2-gallery");
  await expect(gallery).toBeVisible({ timeout: 15000 });
  return { context, page, gallery };
}

for (const proof of [
  { name: "phone-390x844", viewport: { width: 390, height: 844 } },
  { name: "laptop-1366x768", viewport: { width: 1366, height: 768 } },
  { name: "desktop-1440x900", viewport: { width: 1440, height: 900 } },
]) {
  test(`Experience V2 foundation proof composes at ${proof.name}`, async ({ browser }) => {
    const { context, page, gallery } = await openAdminGallery(browser, proof.viewport);

    // Stage 2 evidence isolates the V2 foundation from the still-legacy shell.
    // Shell quality is rebuilt and accepted separately in Stage 4.
    await page.addStyleTag({
      content: ".premium-topbar,.premium-mobile-topbar,.premium-tabs{display:none!important}",
    });

    const pageOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(pageOverflow).toBeLessThanOrEqual(1);

    const density = gallery.locator(".ev2-density-priority");
    await expect(density).toBeVisible();

    const densityOverflow = await density.evaluate((node) => node.scrollWidth - node.clientWidth);
    expect(densityOverflow).toBeLessThanOrEqual(1);

    await page.screenshot({
      path: `test-artifacts/ev2-foundation-context-${proof.name}.png`,
      fullPage: false,
    });

    // Keep the real shell geometry while removing fixed chrome from the
    // diagnostic-only proof image so typography and spacing can be judged
    // without a sticky top bar or mobile tab bar covering the gallery.
    await page.addStyleTag({
      content: `
        .premium-topbar,
        .premium-mobile-topbar,
        .premium-tabs {
          visibility: hidden;
        }
      `,
    });

    await gallery.screenshot({
      path: `test-artifacts/ev2-foundation-${proof.name}.png`,
    });

    if (proof.name === "laptop-1366x768") {
      const motionTrigger = gallery.locator(".ev2-motion-trigger");
      await motionTrigger.click();
      await expect(motionTrigger).toHaveAttribute("aria-expanded", "true");
      await expect(gallery.getByText("Reference state expanded")).toBeVisible();
      await gallery.screenshot({
        path: "test-artifacts/ev2-foundation-laptop-1366x768-expanded.png",
      });
    }

    await context.close();
  });
}
