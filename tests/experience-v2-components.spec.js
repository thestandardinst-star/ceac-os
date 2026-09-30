import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const componentRoot = "src/experience-v2/components";

function componentFiles() {
  return fs.readdirSync(componentRoot)
    .filter((name) => /\.(js|jsx)$/.test(name))
    .map((name) => path.join(componentRoot, name));
}

test("Experience V2 production components live in one shared area", async () => {
  for (const expected of [
    "Avatar.jsx",
    "Button.jsx",
    "Fields.jsx",
    "SegmentedControl.jsx",
    "StatusBadge.jsx",
    "Surface.jsx",
    "index.js",
    "components.css",
  ]) {
    expect(fs.existsSync(path.join(componentRoot, expected)), expected).toBeTruthy();
  }
});

test("Experience V2 components consume the CEAC icon registry rather than Lucide directly", async () => {
  for (const file of componentFiles()) {
    const source = fs.readFileSync(file, "utf8");
    expect(source.includes('from "lucide-react"'), `${file} imports Lucide directly`).toBeFalsy();
    expect(source.includes("components/primitives/Icon"), `${file} imports legacy icon primitive`).toBeFalsy();
    expect(source.includes("components/bits"), `${file} imports legacy bits surface`).toBeFalsy();
  }

  expect(fs.readFileSync(path.join(componentRoot, "Button.jsx"), "utf8")).toContain('from "../icons"');
  expect(fs.readFileSync(path.join(componentRoot, "Fields.jsx"), "utf8")).toContain('from "../icons"');
});

test("Experience V2 component CSS remains tokenized and does not create an override layer", async () => {
  const css = fs.readFileSync(path.join(componentRoot, "components.css"), "utf8");
  expect((css.match(/!important\b/g) || []).length).toBe(0);
  expect(css).not.toContain(".staff-app");
  expect(css).not.toContain(".manager-app");
  expect(css).not.toContain(".office-app");
  expect(css).not.toContain(".executive-app");
  expect(css).toContain("var(--ev2-control-min)");
  expect(css).toContain("var(--ev2-radius-control)");
  expect(css).toContain("var(--ev2-action)");
});

test("Experience V2 core controls expose accessible production states", async () => {
  const button = fs.readFileSync(path.join(componentRoot, "Button.jsx"), "utf8");
  const fields = fs.readFileSync(path.join(componentRoot, "Fields.jsx"), "utf8");
  const segmented = fs.readFileSync(path.join(componentRoot, "SegmentedControl.jsx"), "utf8");

  expect(button).toContain("aria-busy");
  expect(button).toContain("aria-label");
  expect(fields).toContain("aria-invalid");
  expect(fields).toContain("aria-describedby");
  expect(segmented).toContain('role="tablist"');
  expect(segmented).toContain('role="tab"');
  expect(segmented).toContain("aria-selected");
});

test("Experience V2 component styles load after the Stage 2 foundation", async () => {
  const main = fs.readFileSync("src/main.jsx", "utf8");
  const foundation = main.indexOf('import "./experience-v2.css";');
  const components = main.indexOf('import "./experience-v2/components/components.css";');
  expect(foundation).toBeGreaterThan(-1);
  expect(components).toBeGreaterThan(foundation);
});

test("Stage 3A remains gallery-only and does not migrate role screens", async () => {
  const gallery = fs.readFileSync("src/experience-v2/ExperienceV2FoundationGallery.jsx", "utf8");
  expect(gallery).toContain('from "./components"');

  for (const roleFile of [
    "src/screens/Home.jsx",
    "src/screens/ManagerHome.jsx",
    "src/screens/AdminHome.jsx",
    "src/screens/ExecutiveHome.jsx",
  ]) {
    const source = fs.readFileSync(roleFile, "utf8");
    expect(source.includes("experience-v2/components"), `${roleFile} migrated during Stage 3A`).toBeFalsy();
  }
});
