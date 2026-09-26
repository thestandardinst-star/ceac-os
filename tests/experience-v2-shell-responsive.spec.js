import { test, expect } from "@playwright/test";
import {
  getMobilePrimaryNavigation,
  getShellNavigation,
  hasMultipleUnits,
} from "../src/experience-v2/shell/navigation.js";

const password = process.env.ROLE_FIXTURE_PASSWORD;
const unitA = "20000000-0000-4000-8000-000000000011";

const roles = [
  { key: "staff", email: "staff@ceac.local.test", app: ".staff-app" },
  { key: "manager", email: "manager@ceac.local.test", app: ".manager-app" },
  { key: "admin", email: "admin@ceac.local.test", app: ".office-app" },
  { key: "executive", email: "exec@ceac.local.test", app: ".executive-app" },
];

async function signIn(page, role) {
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill(role.email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(role.app)).toBeVisible({ timeout: 15000 });
}

function roleContext(key, me = { capabilities: [] }) {
  return {
    me,
    isAdmin: key === "admin",
    isExec: key === "executive",
    isManager: key === "manager",
  };
}

test.describe.configure({ mode: "serial" });

test("Stage 4C capability and multi-unit policies remain explicit", async () => {
  const limitedAdmin = getShellNavigation(roleContext("admin", { capabilities: [] }));
  const limitedAdminLabels = limitedAdmin.map((item) => item.label);

  expect(limitedAdminLabels).not.toContain("People");
  for (const label of [
    "Overview",
    "Work",
    "Time & Leave",
    "Finance",
    "Reports",
    "Control Center",
    "Messages",
    "My Hub",
    "Your account",
  ]) {
    expect(limitedAdminLabels).toContain(label);
  }

  const authorisedAdmin = getShellNavigation(
    roleContext("admin", { capabilities: ["people.manage"] })
  );
  expect(authorisedAdmin.map((item) => item.label)).toContain("People");

  const twoUnits = {
    memberships: [
      { unit_id: "unit-a", unit_name: "Unit A", role: "staff" },
      { unit_id: "unit-b", unit_name: "Unit B", role: "staff" },
    ],
  };
  expect(hasMultipleUnits(twoUnits, roleContext("staff"))).toBe(true);
  expect(hasMultipleUnits(twoUnits, roleContext("admin"))).toBe(false);
  expect(hasMultipleUnits(twoUnits, roleContext("executive"))).toBe(false);
  expect(hasMultipleUnits({ memberships: twoUnits.memberships.slice(0, 1) }, roleContext("staff"))).toBe(false);

  for (const key of ["staff", "manager", "admin", "executive"]) {
    expect(getMobilePrimaryNavigation(roleContext(key, key === "admin"
      ? { capabilities: ["people.manage"] }
      : { capabilities: [] })).length).toBeLessThanOrEqual(4);
  }
});

test("Stage 4C Staff shell holds every supported phone width", async ({ browser }) => {
  const widths = [320, 360, 375, 390, 414, 430];

  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    await signIn(page, roles[0]);

    const mobileTopbar = page.locator(".ev2s-mobile-topbar");
    const mobileNav = page.locator(".ev2s-mobile-nav");

    await expect(mobileTopbar).toBeVisible();
    await expect(mobileNav).toBeVisible();
    await expect(page.locator(".ev2s-sidebar")).toBeHidden();
    await expect(page.locator(".ev2s-topbar")).toBeHidden();
    await expect(mobileNav.getByRole("button")).toHaveCount(5);

    const geometry = await page.evaluate(() => {
      const nav = document.querySelector(".ev2s-mobile-nav");
      const topbar = document.querySelector(".ev2s-mobile-topbar");
      const buttons = [...document.querySelectorAll(".ev2s-mobile-nav button")];
      return {
        documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        bodyOverflow: document.body.scrollWidth - document.body.clientWidth,
        navRight: nav ? nav.getBoundingClientRect().right - window.innerWidth : 0,
        navBottom: nav ? nav.getBoundingClientRect().bottom - window.innerHeight : 0,
        topbarRight: topbar ? topbar.getBoundingClientRect().right - window.innerWidth : 0,
        minButtonHeight: buttons.length
          ? Math.min(...buttons.map((button) => button.getBoundingClientRect().height))
          : 0,
      };
    });

    expect(geometry.documentOverflow, `document overflow at ${width}px`).toBeLessThanOrEqual(1);
    expect(geometry.bodyOverflow, `body overflow at ${width}px`).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.navRight), `mobile nav right edge at ${width}px`).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.navBottom), `mobile nav bottom edge at ${width}px`).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.topbarRight), `mobile topbar right edge at ${width}px`).toBeLessThanOrEqual(1);
    expect(geometry.minButtonHeight, `mobile touch target at ${width}px`).toBeGreaterThanOrEqual(44);

    await page.screenshot({
      path: `test-artifacts/redesign-r7-stage4c-staff-${width}.png`,
      fullPage: true,
    });
    await context.close();
  }
});

test("Stage 4C all four mobile role shells stay within the 390px viewport", async ({ browser }) => {
  for (const role of roles) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await signIn(page, role);

    const mobileNav = page.locator(".ev2s-mobile-nav");
    await expect(mobileNav).toBeVisible();
    await expect(mobileNav.getByRole("button")).toHaveCount(5);

    const overflow = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      body: document.body.scrollWidth - document.body.clientWidth,
    }));
    expect(overflow.document, `${role.key} document overflow`).toBeLessThanOrEqual(1);
    expect(overflow.body, `${role.key} body overflow`).toBeLessThanOrEqual(1);

    await page.screenshot({
      path: `test-artifacts/redesign-r7-stage4c-${role.key}-390.png`,
      fullPage: true,
    });
    await context.close();
  }
});

test("Stage 4C 1366x768 laptop shell keeps navigation and account chrome stable", async ({ browser }) => {
  for (const role of roles) {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    await signIn(page, role);

    const sidebar = page.locator(".ev2s-sidebar");
    const topbar = page.locator(".ev2s-topbar");
    const nav = page.locator(".ev2s-sidebar-nav");
    const profile = page.locator(".ev2s-sidebar-profile");

    await expect(sidebar).toBeVisible();
    await expect(topbar).toBeVisible();
    await expect(profile).toBeVisible();

    const geometry = await page.evaluate(() => {
      const side = document.querySelector(".ev2s-sidebar");
      const navNode = document.querySelector(".ev2s-sidebar-nav");
      const profileNode = document.querySelector(".ev2s-sidebar-profile");
      const top = document.querySelector(".ev2s-topbar");
      const rect = (node) => node?.getBoundingClientRect();
      return {
        documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        sidebarOverflow: side ? side.scrollWidth - side.clientWidth : 0,
        navOverflowY: navNode ? getComputedStyle(navNode).overflowY : "",
        navBottom: rect(navNode)?.bottom || 0,
        profileBottom: rect(profileNode)?.bottom || 0,
        viewportHeight: window.innerHeight,
        topbarRight: (rect(top)?.right || window.innerWidth) - window.innerWidth,
      };
    });

    expect(geometry.documentOverflow, `${role.key} laptop document overflow`).toBeLessThanOrEqual(1);
    expect(geometry.sidebarOverflow, `${role.key} laptop sidebar overflow`).toBeLessThanOrEqual(1);
    expect(["auto", "scroll"]).toContain(geometry.navOverflowY);
    expect(geometry.navBottom).toBeLessThanOrEqual(geometry.profileBottom);
    expect(geometry.profileBottom).toBeLessThanOrEqual(geometry.viewportHeight + 1);
    expect(Math.abs(geometry.topbarRight)).toBeLessThanOrEqual(1);

    await page.screenshot({
      path: `test-artifacts/redesign-r7-stage4c-${role.key}-laptop.png`,
      fullPage: true,
    });
    await context.close();
  }
});

test("Stage 4C long identity strings cannot widen shell chrome", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await signIn(page, roles[1]);

  await page.evaluate(() => {
    const longName = "A Deliberately Very Long CEAC Team Member Name That Must Truncate Safely";
    const longUnit = "A Deliberately Very Long Ministry Unit Name That Must Never Widen The Shell";
    document.querySelectorAll(".ev2s-sidebar-profile-copy strong, .ev2s-profile-button strong")
      .forEach((node) => { node.textContent = longName; });
    document.querySelectorAll(".ev2s-sidebar-profile-copy small, .ev2s-profile-button small")
      .forEach((node) => { node.textContent = longUnit; });
  });

  const desktop = await page.evaluate(() => {
    const side = document.querySelector(".ev2s-sidebar");
    const top = document.querySelector(".ev2s-topbar");
    const name = document.querySelector(".ev2s-sidebar-profile-copy strong");
    return {
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      sidebarOverflow: side ? side.scrollWidth - side.clientWidth : 0,
      topbarOverflow: top ? top.scrollWidth - top.clientWidth : 0,
      textOverflow: name ? getComputedStyle(name).textOverflow : "",
      whiteSpace: name ? getComputedStyle(name).whiteSpace : "",
    };
  });

  expect(desktop.documentOverflow).toBeLessThanOrEqual(1);
  expect(desktop.sidebarOverflow).toBeLessThanOrEqual(1);
  expect(desktop.topbarOverflow).toBeLessThanOrEqual(1);
  expect(desktop.textOverflow).toBe("ellipsis");
  expect(desktop.whiteSpace).toBe("nowrap");

  await page.setViewportSize({ width: 320, height: 844 });
  await page.evaluate(() => {
    const context = document.querySelector(".ev2s-mobile-identity small");
    if (context) context.textContent =
      "A Deliberately Very Long Ministry Unit Name That Must Truncate Safely · Manager";
  });

  const mobile = await page.evaluate(() => {
    const top = document.querySelector(".ev2s-mobile-topbar");
    const context = document.querySelector(".ev2s-mobile-identity small");
    return {
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      topbarOverflow: top ? top.scrollWidth - top.clientWidth : 0,
      textOverflow: context ? getComputedStyle(context).textOverflow : "",
      whiteSpace: context ? getComputedStyle(context).whiteSpace : "",
    };
  });

  expect(mobile.documentOverflow).toBeLessThanOrEqual(1);
  expect(mobile.topbarOverflow).toBeLessThanOrEqual(1);
  expect(mobile.textOverflow).toBe("ellipsis");
  expect(mobile.whiteSpace).toBe("nowrap");
});

test("Stage 4C destination search stays keyboard-usable and truthful", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await signIn(page, roles[0]);

  await page.keyboard.press("Control+K");
  const search = page.getByPlaceholder("Find a destination…");
  await expect(search).toBeFocused();

  await search.fill("Messages");
  const palette = page.getByRole("dialog", { name: "Find a destination" });
  await expect(palette).toBeVisible();
  await expect(palette.getByRole("button", { name: "Messages", exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(palette).toBeHidden();
  await expect(search).toBeFocused();

  await search.fill("Messages");
  await palette.getByRole("button", { name: "Messages", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Messages", exact: true })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("tab")).toBe("messages");
});

test("Stage 4C canonical mobile overlays hide bottom navigation and return cleanly", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, roles[0]);

  await page.goto(`/?roomKind=unit&room=${unitA}`);
  await expect(page.locator(".room-screen")).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".ev2s-mobile-nav")).toHaveCount(0);

  await page.locator(".room-back").click();
  await expect(page.locator(".room-screen")).toHaveCount(0);
  await expect(page.locator(".ev2s-mobile-nav")).toBeVisible();
  expect(new URL(page.url()).searchParams.has("roomKind")).toBe(false);
  expect(new URL(page.url()).searchParams.has("room")).toBe(false);
});
