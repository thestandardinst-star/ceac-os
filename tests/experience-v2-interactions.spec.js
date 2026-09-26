import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const root = "src/experience-v2/components";
const password = process.env.ROLE_FIXTURE_PASSWORD;

test("Stage 3C interaction and state primitives exist in the shared V2 area", async () => {
  expect(fs.existsSync(path.join(root, "Interactions.jsx"))).toBeTruthy();
  const index = fs.readFileSync(path.join(root, "index.js"), "utf8");
  for (const name of [
    "Tooltip", "PopoverMenu", "Drawer", "ModalDialog", "ConfirmDialog",
    "Skeleton", "StatePanel", "Toast",
  ]) {
    expect(index, name + " must be exported").toContain(name);
  }
});

test("Stage 3C overlays include keyboard, focus and modal semantics", async () => {
  const source = fs.readFileSync(path.join(root, "Interactions.jsx"), "utf8");
  expect(source).toContain('event.key === "Escape"');
  expect(source).toContain('event.key !== "Tab"');
  expect(source).toContain('role="dialog"');
  expect(source).toContain('aria-modal="true"');
  expect(source).toContain('role="menu"');
  expect(source).toContain('role="menuitem"');
  expect(source).toContain('role="tooltip"');
  expect(source).toContain("aria-live");
});

test("Stage 3C CSS stays scoped, tokenized and override-free", async () => {
  const css = fs.readFileSync(path.join(root, "components.css"), "utf8");
  expect(css).toContain(".ev2c-overlay");
  expect(css).toContain(".ev2c-modal");
  expect(css).toContain(".ev2c-drawer");
  expect(css).toContain(".ev2c-toast");
  expect(css).toContain(".ev2c-state");
  expect((css.match(/!important\b/g) || []).length).toBe(0);
  expect(css).not.toContain(".staff-app");
  expect(css).not.toContain(".manager-app");
  expect(css).not.toContain(".office-app");
  expect(css).not.toContain(".executive-app");
});

async function openGallery(page) {
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill("admin@ceac.local.test");
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".app")).toBeVisible({ timeout: 15000 });
  await page.goto("/?tab=primitives");
  await expect(page.locator(".ev2-gallery")).toBeVisible({ timeout: 15000 });
}

test("Stage 3C menu and modal restore keyboard context", async ({ page }) => {
  await openGallery(page);

  const menuTrigger = page.getByRole("button", { name: "Reference menu" });
  await menuTrigger.click();
  const firstItem = page.getByRole("menuitem", { name: "Open reference item" });
  await expect(firstItem).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menuTrigger).toBeFocused();

  const modalTrigger = page.getByRole("button", { name: "Open modal" });
  await modalTrigger.click();
  const dialog = page.getByRole("dialog", { name: "Reference modal" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(modalTrigger).toBeFocused();
});

test("Stage 3C drawer and confirmation can be dismissed safely", async ({ page }) => {
  await openGallery(page);

  await page.getByRole("button", { name: "Open drawer" }).click();
  await expect(page.getByRole("dialog", { name: "Reference drawer" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Reference drawer" })).toBeHidden();

  await page.getByRole("button", { name: "Confirm action" }).click();
  const confirm = page.getByRole("dialog", { name: "Confirm reference action" });
  await expect(confirm).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(confirm).toBeHidden();
});

test("Stage 3C proof remains gallery-only", async () => {
  const gallery = fs.readFileSync("src/experience-v2/ExperienceV2FoundationGallery.jsx", "utf8");
  expect(gallery).toContain("<Drawer");
  expect(gallery).toContain("<ModalDialog");
  expect(gallery).toContain("<StatePanel");
  expect(gallery).toContain("<Toast");

  for (const roleFile of [
    "src/screens/Home.jsx",
    "src/screens/ManagerHome.jsx",
    "src/screens/AdminHome.jsx",
    "src/screens/ExecutiveHome.jsx",
  ]) {
    const source = fs.readFileSync(roleFile, "utf8");
    expect(
      /from\s+["'][^"']*experience-v2\/components(?:\/[^"']*)?["']/.test(source),
      roleFile + " imported V2 components during Stage 3C"
    ).toBeFalsy();
  }
});
