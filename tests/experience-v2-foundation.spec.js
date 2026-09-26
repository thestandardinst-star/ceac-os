import fs from "node:fs";
import { test, expect } from "@playwright/test";

const foundationPath = "src/experience-v2.css";

test("Experience V2 foundation is loaded after compatibility CSS", async () => {
  const main = fs.readFileSync("src/main.jsx", "utf8");
  const parity = main.indexOf('import "./premium-parity.css";');
  const v2 = main.indexOf('import "./experience-v2.css";');

  expect(parity).toBeGreaterThan(-1);
  expect(v2).toBeGreaterThan(parity);
});

test("Experience V2 foundation exposes the ratified semantic tokens", async () => {
  const css = fs.readFileSync(foundationPath, "utf8");
  const required = [
    "--ev2-font-sans",
    "--ev2-type-page-mobile",
    "--ev2-type-page-desktop",
    "--ev2-type-body-mobile",
    "--ev2-space-4",
    "--ev2-bg",
    "--ev2-surface",
    "--ev2-shell",
    "--ev2-text",
    "--ev2-identity",
    "--ev2-action",
    "--ev2-success",
    "--ev2-warning",
    "--ev2-danger",
    "--ev2-radius-card",
    "--ev2-shadow-1",
    "--ev2-duration-fast",
    "--ev2-duration-standard",
    "--ev2-ease-standard",
    "--ev2-phone-gutter",
    "--ev2-control-min",
  ];

  for (const token of required) expect(css, token + " must remain defined").toContain(token);
});

test("Experience V2 foundation does not become another important override layer", async () => {
  const css = fs.readFileSync(foundationPath, "utf8");
  expect((css.match(/!important\b/g) || []).length).toBe(0);
});

test("Experience V2 operational text floor remains at least 12px", async () => {
  const css = fs.readFileSync(foundationPath, "utf8");
  const sizes = [...css.matchAll(/--ev2-type-[^:]+:\s*([0-9]*\.?[0-9]+)(rem|px)/g)]
    .map((match) => {
      const value = Number(match[1]);
      return match[2] === "rem" ? value * 16 : value;
    });

  expect(sizes.length).toBeGreaterThan(0);
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(12);
});

test("Experience V2 reduced-motion foundation is explicit", async () => {
  const css = fs.readFileSync(foundationPath, "utf8");
  expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  expect(css).toContain("--ev2-duration-fast: 0ms");
  expect(css).toContain("--ev2-duration-surface: 0ms");
});

test("Experience V2 foundation stays opt-in while legacy screens are unmigrated", async () => {
  const css = fs.readFileSync(foundationPath, "utf8");
  for (const legacySelector of [
    ".staff-app",
    ".manager-app",
    ".office-app",
    ".executive-app",
    ".premium-side",
    ".premium-topbar",
    ".home-",
    ".admin-",
    ".manager-",
    ".exec-",
  ]) {
    expect(css.includes(legacySelector), legacySelector + " must not be patched from V2 foundation").toBeFalsy();
  }
});
