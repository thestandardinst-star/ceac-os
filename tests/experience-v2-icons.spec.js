import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const registryPath = "src/experience-v2/icons.jsx";
const v2Root = "src/experience-v2";

function filesUnder(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return filesUnder(full);
    return [full];
  });
}

test("Experience V2 has one Lucide-backed semantic icon registry", async () => {
  expect(fs.existsSync(registryPath)).toBeTruthy();
  const source = fs.readFileSync(registryPath, "utf8");

  expect(source).toContain('from "lucide-react"');
  expect(source).toContain("export const CEAC_ICONS");
  expect(source).toContain("export const CEAC_ICON_SIZES");
  expect(source).toContain("export function CeacIcon");
  expect(source).toContain("export const CEAC_ICON_STROKE_WIDTH = 1.75");
  expect(source).toContain('focusable="false"');
  expect(source).toContain("aria-hidden");
  expect(source).toContain("aria-label");
});

test("Experience V2 registry covers the required CEAC semantic vocabulary", async () => {
  const source = fs.readFileSync(registryPath, "utf8");
  const required = [
    "home", "work", "team", "people", "person", "record", "calendar",
    "projects", "portfolio", "ministry", "organisation", "finance",
    "reports", "messages", "learning", "assets", "compliance", "time",
    "account", "settings", "control", "search", "create", "add", "edit",
    "delete", "close", "more", "menu", "filter", "sort", "download",
    "upload", "external", "refresh", "expand", "collapse", "arrowRight",
    "arrowLeft", "chevronRight", "chevronLeft", "chevronDown", "chevronUp",
    "check", "checkCircle", "warning", "info", "error", "notification",
    "lock", "unlock", "clock", "pending", "chart", "table", "location",
    "file", "folder", "link", "meeting", "goal", "task", "budget",
  ];

  for (const key of required) {
    expect(source, `missing semantic icon key: ${key}`).toMatch(
      new RegExp(`\\b${key}\\s*:`)
    );
  }
});

test("Only the V2 icon registry imports lucide-react", async () => {
  const files = filesUnder(v2Root).filter((file) => /\.(js|jsx|ts|tsx)$/.test(file));

  for (const file of files) {
    if (file === registryPath) continue;
    const source = fs.readFileSync(file, "utf8");
    expect(
      source.includes('from "lucide-react"') || source.includes("from 'lucide-react'"),
      `${file} must consume the CEAC icon registry instead of importing Lucide directly`
    ).toBeFalsy();
  }
});

test("V2 files do not import either legacy CEAC icon implementation", async () => {
  const files = filesUnder(v2Root).filter((file) => /\.(js|jsx|ts|tsx)$/.test(file));

  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    expect(source.includes("components/primitives/Icon"), `${file} imports legacy primitive Icon`).toBeFalsy();
    expect(source.includes("components/bits"), `${file} imports legacy bits icon surface`).toBeFalsy();
  }
});
