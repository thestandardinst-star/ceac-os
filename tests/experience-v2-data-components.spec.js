import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const root = "src/experience-v2/components";

test("Stage 3B operational primitives exist in the shared V2 component area", async () => {
  for (const file of ["DataComponents.jsx", "TableShell.jsx"]) {
    expect(fs.existsSync(path.join(root, file)), file).toBeTruthy();
  }

  const index = fs.readFileSync(path.join(root, "index.js"), "utf8");
  for (const name of [
    "StatTile", "QueueRow", "RecordRow", "ActionFocusCard",
    "DataPanel", "ProgressDistribution", "Timeline", "TableShell",
  ]) {
    expect(index, name + " must be exported").toContain(name);
  }
});

test("Stage 3B components preserve traceability and accessibility hooks", async () => {
  const data = fs.readFileSync(path.join(root, "DataComponents.jsx"), "utf8");
  const table = fs.readFileSync(path.join(root, "TableShell.jsx"), "utf8");

  expect(data).toContain("href");
  expect(data).toContain("onClick");
  expect(data).toContain('role="progressbar"');
  expect(data).toContain("aria-valuenow");
  expect(table).toContain("<caption");
  expect(table).toContain('scope="col"');
});

test("Stage 3B continues to use the CEAC icon registry", async () => {
  for (const file of ["DataComponents.jsx", "TableShell.jsx"]) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    expect(source.includes('from "lucide-react"')).toBeFalsy();
    expect(source.includes("components/primitives/Icon")).toBeFalsy();
    expect(source.includes("components/bits")).toBeFalsy();
  }
  expect(fs.readFileSync(path.join(root, "DataComponents.jsx"), "utf8")).toContain('from "../icons"');
});

test("Stage 3B CSS remains tokenized and override-free", async () => {
  const css = fs.readFileSync(path.join(root, "components.css"), "utf8");
  expect((css.match(/!important\b/g) || []).length).toBe(0);
  expect(css).toContain(".ev2c-stat");
  expect(css).toContain(".ev2c-queue-row");
  expect(css).toContain(".ev2c-table");
  expect(css).toContain("var(--ev2-line)");
  expect(css).not.toContain(".staff-app");
  expect(css).not.toContain(".manager-app");
  expect(css).not.toContain(".office-app");
  expect(css).not.toContain(".executive-app");
});

test("Stage 3B proof remains on the protected gallery only", async () => {
  const gallery = fs.readFileSync("src/experience-v2/ExperienceV2FoundationGallery.jsx", "utf8");
  expect(gallery).toContain("Operational data");
  expect(gallery).toContain("<StatTile");
  expect(gallery).toContain("<QueueRow");
  expect(gallery).toContain("<TableShell");
  expect(gallery).toContain("<Timeline");

  for (const roleFile of [
    "src/screens/Home.jsx",
    "src/screens/ManagerHome.jsx",
    "src/screens/AdminHome.jsx",
    "src/screens/ExecutiveHome.jsx",
  ]) {
    const source = fs.readFileSync(roleFile, "utf8");
    expect(source.includes("StatTile"), roleFile + " migrated during Stage 3B").toBeFalsy();
    expect(source.includes("QueueRow"), roleFile + " migrated during Stage 3B").toBeFalsy();
    expect(source.includes("TableShell"), roleFile + " migrated during Stage 3B").toBeFalsy();
  }
});
