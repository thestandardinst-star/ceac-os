import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const legacyCeilings = Object.freeze({
  "src/premium-admin.css": 128,
  "src/premium-executive.css": 12,
  "src/premium-manager.css": 75,
  "src/premium-parity.css": 377,
  "src/premium-staff.css": 64,
  "src/premium.css": 50,
  "src/styles.css": 121,
});

function countImportant(source) {
  return (source.match(/!important\b/g) || []).length;
}

function walk(dir, predicate) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full, predicate));
    else if (predicate(full)) results.push(full);
  }
  return results;
}

test("Stage 15A prevents legacy important debt from increasing", () => {
  let total = 0;
  for (const [file, ceiling] of Object.entries(legacyCeilings)) {
    const source = fs.readFileSync(file, "utf8");
    const count = countImportant(source);
    total += count;
    expect(count, file).toBeLessThanOrEqual(ceiling);
  }
  expect(total, "legacy !important total").toBeLessThanOrEqual(827);
});

test("Stage 15A keeps Experience V2 free of hidden role override debt", () => {
  const cssFiles = walk("src/experience-v2", (file) => file.endsWith(".css"));
  expect(cssFiles.length).toBeGreaterThan(0);

  for (const file of cssFiles) {
    const source = fs.readFileSync(file, "utf8");
    expect(countImportant(source), file).toBe(0);
    expect(source, file).not.toMatch(/\.(staff-app|manager-app|office-app|executive-app)\b/);
  }
});

test("Stage 15A preserves one V2 icon registry boundary", () => {
  const files = walk("src/experience-v2", (file) => /\.(js|jsx)$/.test(file));
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    if (file.endsWith(path.join("experience-v2", "icons.jsx"))) {
      expect(source).toContain('from "lucide-react"');
      continue;
    }
    expect(source, file).not.toContain('from "lucide-react"');
    expect(source, file).not.toContain("components/primitives/Icon");
    expect(source, file).not.toContain("components/bits");
  }
});

test("Stage 15A keeps V2 loaded after the legacy compatibility stack", () => {
  const main = fs.readFileSync("src/main.jsx", "utf8");
  const parity = main.indexOf('import "./premium-parity.css";');
  const foundation = main.indexOf('import "./experience-v2.css";');
  const shell = main.indexOf('import "./experience-v2/shell/shell.css";');

  expect(parity).toBeGreaterThan(-1);
  expect(foundation).toBeGreaterThan(parity);
  expect(shell).toBeGreaterThan(foundation);
});

test("Stage 15A retains the accepted focus, touch and reduced-motion contracts", () => {
  const interactions = fs.readFileSync("tests/experience-v2-interactions.spec.js", "utf8");
  const shell = fs.readFileSync("tests/experience-v2-shell-responsive.spec.js", "utf8");
  const motion = fs.readFileSync("tests/experience-v2-motion.spec.js", "utf8");
  const provider = fs.readFileSync("src/experience-v2/ExperienceV2MotionProvider.jsx", "utf8");

  expect(interactions).toContain('page.keyboard.press("Escape")');
  expect(interactions).toContain("restore keyboard context");
  expect(shell).toContain("mobile touch target");
  expect(shell).toContain('page.keyboard.press("Control+K")');
  expect(motion).toContain("reduced");
  expect(provider).toContain('reducedMotion="user"');
});
