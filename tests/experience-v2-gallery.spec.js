import fs from "node:fs";
import { test, expect } from "@playwright/test";

const galleryPath = "src/experience-v2/ExperienceV2FoundationGallery.jsx";

test("Stage 2 gallery is mounted only through the protected primitives diagnostic surface", async () => {
  const screen = fs.readFileSync("src/screens/DesignPrimitives.jsx", "utf8");
  const app = fs.readFileSync("src/App.jsx", "utf8");

  expect(screen).toContain('from "../experience-v2/ExperienceV2FoundationGallery"');
  expect(screen).toContain("<ExperienceV2FoundationGallery />");
  expect(app).toContain('tab === "primitives" && isAdmin');
});

test("Stage 2 gallery uses the CEAC registry rather than direct Lucide imports", async () => {
  const source = fs.readFileSync(galleryPath, "utf8");

  expect(source).toContain('from "./icons"');
  expect(source).toContain("CeacIcon");
  expect(source).not.toContain('from "lucide-react"');
  expect(source).not.toContain("components/primitives/Icon");
});

test("Stage 2 gallery proves layout motion without autoplay decoration", async () => {
  const source = fs.readFileSync(galleryPath, "utf8");

  expect(source).toContain('from "motion/react"');
  expect(source).toContain("AnimatePresence");
  expect(source).toContain("layout");
  expect(source).toContain("EV2_TRANSITIONS");
  expect(source).toContain("onClick");
  expect(source).not.toContain("repeat: Infinity");
  expect(source).not.toContain("autoPlay");
});

test("Stage 2 gallery explicitly separates reference samples from live CEAC data", async () => {
  const source = fs.readFileSync(galleryPath, "utf8");
  expect(source).toContain("Reference only");
  expect(source).toContain("not live CEAC operational data");
  expect(source).toContain("Sample value — not live data");
});

test("Stage 2 gallery CSS stays scoped and avoids important overrides", async () => {
  const css = fs.readFileSync("src/experience-v2.css", "utf8");
  const galleryStart = css.indexOf("Experience V2 foundation gallery — protected diagnostic proof only.");
  expect(galleryStart).toBeGreaterThan(-1);
  const galleryCss = css.slice(galleryStart);

  expect(galleryCss).toContain(".ev2-gallery");
  expect(galleryCss).toContain("@media (max-width: 599px)");
  expect(galleryCss).not.toContain("!important");
  for (const legacySelector of [".staff-app", ".manager-app", ".office-app", ".executive-app"]) {
    expect(galleryCss.includes(legacySelector)).toBeFalsy();
  }
});
