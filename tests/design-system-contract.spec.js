import fs from "node:fs";
import { test, expect } from "@playwright/test";

const premiumCssFiles = [
  "src/premium.css",
  "src/premium-staff.css",
  "src/premium-manager.css",
  "src/premium-admin.css",
  "src/premium-executive.css",
  "src/premium-parity.css",
];

test("premium CSS preserves the 12px operational text floor", async () => {
  const violations = [];
  for (const path of premiumCssFiles) {
    const css = fs.readFileSync(path, "utf8");
    for (const match of css.matchAll(/font-size\s*:\s*([0-9]*\.?[0-9]+)px\b/g)) {
      const size = Number(match[1]);
      if (size < 12) violations.push({ path, size, declaration: match[0] });
    }
  }
  expect(violations).toEqual([]);
});

test("role CSS remains isolated and the important-debt budget does not grow", async () => {
  const executive = fs.readFileSync("src/premium-executive.css", "utf8");
  for (const leakedSelector of [".staff-app", ".manager-app", ".office-app", ".premium-side", ".reference-"]) {
    expect(executive.includes(leakedSelector)).toBeFalsy();
  }

  const allCss = [
    "src/styles.css",
    ...premiumCssFiles,
  ].map((path) => fs.readFileSync(path, "utf8")).join("\n");
  const importantCount = (allCss.match(/!important\b/g) || []).length;
  expect(importantCount).toBeLessThanOrEqual(1129);
});

test("Instrument Sans is the premium body family and PWA icons are shipped", async ({ page }) => {
  await page.goto("/");
  const bodyFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(bodyFamily.toLowerCase().startsWith('"instrument sans"') || bodyFamily.toLowerCase().startsWith("instrument sans")).toBeTruthy();

  const manifest = await page.evaluate(async () => {
    const response = await fetch("/manifest.webmanifest");
    return response.json();
  });
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ src: "/ceac-icon-192.png", sizes: "192x192", type: "image/png" }),
    expect.objectContaining({ src: "/ceac-icon-512.png", sizes: "512x512", type: "image/png" }),
  ]));

  for (const icon of ["/ceac-icon-192.png", "/ceac-icon-512.png", "/apple-touch-icon.png"]) {
    const result = await page.evaluate(async (src) => {
      const response = await fetch(src);
      return { ok: response.ok, type: response.headers.get("content-type"), bytes: (await response.arrayBuffer()).byteLength };
    }, icon);
    expect(result.ok).toBeTruthy();
    expect(result.type).toContain("image/png");
    expect(result.bytes).toBeGreaterThan(1000);
  }
});
