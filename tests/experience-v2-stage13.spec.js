import fs from "node:fs";
import { expect, test } from "@playwright/test";

const password = process.env.ROLE_FIXTURE_PASSWORD;

function source(path) {
  return fs.readFileSync(path, "utf8");
}

async function expectLoadedBrandMark(locator) {
  await expect(locator).toBeVisible();
  const state = await locator.evaluate((image) => ({
    complete: image.complete,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    renderedWidth: image.getBoundingClientRect().width,
    renderedHeight: image.getBoundingClientRect().height,
  }));
  expect(state.complete).toBeTruthy();
  expect(state.naturalWidth).toBeGreaterThan(0);
  expect(state.naturalHeight).toBeGreaterThan(0);
  expect(state.renderedWidth).toBeGreaterThanOrEqual(30);
  expect(state.renderedHeight).toBeGreaterThanOrEqual(30);
  expect(Math.abs(state.renderedWidth - state.renderedHeight)).toBeLessThanOrEqual(1);
}

async function expectNoPageOverflow(page, label) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow, `${label} has page-level horizontal overflow`).toBeLessThanOrEqual(1);
}

async function signIn(page, email) {
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".app")).toBeVisible({ timeout: 15000 });
}

test("Stage 13B uses the existing lightweight CEAC application mark as one identity asset", async () => {
  for (const path of [
    "public/ceac-icon-192.png",
    "public/ceac-icon-512.png",
    "public/apple-touch-icon.png",
    "public/manifest.webmanifest",
    "src/experience-v2/components/BrandMark.jsx",
  ]) {
    expect(fs.existsSync(path), path).toBeTruthy();
  }

  expect(fs.statSync("public/ceac-icon-192.png").size).toBeLessThan(128 * 1024);
  expect(fs.statSync("public/ceac-icon-512.png").size).toBeLessThan(256 * 1024);

  const manifest = JSON.parse(source("public/manifest.webmanifest"));
  expect(manifest.icons.map((icon) => icon.src)).toEqual(
    expect.arrayContaining(["/ceac-icon-192.png", "/ceac-icon-512.png"])
  );

  const brand = source("src/experience-v2/components/BrandMark.jsx");
  const auth = source("src/components/AuthFrame.jsx");
  const shell = source("src/experience-v2/shell/ShellV2.jsx");
  const index = source("index.html");
  const styles = source("src/styles.css");
  const shellCss = source("src/experience-v2/shell/shell.css");

  expect(brand).toContain('src="/ceac-icon-192.png"');
  expect(brand).toContain("width={pixels}");
  expect(brand).toContain("height={pixels}");
  expect(brand).toContain('decoding="async"');
  expect(brand).not.toContain('loading="lazy"');

  expect(auth).toContain('BrandMark size="lg"');
  expect(auth).not.toContain("function CEACMark");
  expect(shell).toContain('BrandMark size="md"');
  expect(shell).toContain('BrandMark size="sm"');
  expect(shell).not.toContain("function ShellMark");

  expect(index).toContain('rel="icon" type="image/png" sizes="192x192" href="/ceac-icon-192.png"');
  expect(styles).not.toContain(".ceac-mark-core");
  expect(styles).not.toContain(".ceac-mark-dot");
  expect(shellCss).not.toContain(".ev2s-brand-mark > span");
  expect(shellCss).not.toContain(".ev2s-brand-mark > i");

  expect(auth).not.toContain("<video");
  expect(shell).not.toContain("<video");
});

for (const viewport of [
  { name:"phone-390", width:390, height:844 },
  { name:"laptop-1366", width:1366, height:768 },
]) {
  test(`Stage 13B sign-in brand mark is stable at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width:viewport.width, height:viewport.height });
    await page.goto("/");

    await expect(page.getByPlaceholder("Work email")).toBeVisible();
    const mark = page.locator("img.ev2c-brand-mark:visible").first();
    await expectLoadedBrandMark(mark);
    await expectNoPageOverflow(page, `Stage 13B sign-in ${viewport.name}`);

    await page.screenshot({
      path:`test-artifacts/redesign-r7-stage13b-auth-${viewport.name}.png`,
      fullPage:true,
    });
  });
}

test("Stage 13B mobile shell uses the same loaded CEAC application mark", async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  await signIn(page, "staff@ceac.local.test");

  const mark = page.locator(".ev2s-mobile-topbar img.ev2s-brand-mark");
  await expectLoadedBrandMark(mark);
  await expectNoPageOverflow(page, "Stage 13B mobile shell");

  await page.screenshot({
    path:"test-artifacts/redesign-r7-stage13b-shell-phone-390.png",
    fullPage:true,
  });
});

test("Stage 13B desktop shell uses the same loaded CEAC application mark", async ({ page }) => {
  await page.setViewportSize({ width:1366, height:768 });
  await signIn(page, "admin@ceac.local.test");

  const mark = page.locator(".ev2s-sidebar img.ev2s-brand-mark");
  await expectLoadedBrandMark(mark);
  await expectNoPageOverflow(page, "Stage 13B desktop shell");

  await page.screenshot({
    path:"test-artifacts/redesign-r7-stage13b-shell-laptop-1366.png",
    fullPage:true,
  });
});
