import { test, expect } from "@playwright/test";

const rolePassword = process.env.ROLE_FIXTURE_PASSWORD;

test.describe.configure({ mode: "serial" });

test("Authentication shell matches the PWA responsive contract", async ({ browser }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByPlaceholder("Work email")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    if (viewport.width >= 901) {
      await expect(page.getByText("Know what matters.")).toBeVisible();
      await expect(page.getByText("Today", { exact: true })).toBeVisible();
      await expect(page.getByText("Pulse", { exact: true })).toBeVisible();
      await expect(page.getByText("Insight", { exact: true })).toBeVisible();
    } else {
      await expect(page.getByText("CEAC OS", { exact: true }).first()).toBeVisible();
    }
    await context.close();
  }
});

async function openAs(browser, email, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({
    viewport,
    geolocation: { latitude: 5.6037, longitude: -0.1870 },
    permissions: ["geolocation"],
  });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill(email);
  await page.getByPlaceholder("Password").fill(rolePassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".app")).toBeVisible({ timeout: 15000 });
  return { context, page };
}

async function go(page, name) {
  await page.locator(".side nav").getByRole("button", { name, exact: true }).click();
}

async function assignTask(page, title, step = null) {
  await page.getByRole("button", { name: "Give out work" }).click();
  await page.getByPlaceholder("What needs doing").fill(title);
  await page.getByPlaceholder("Why this matters — who it is for, what happens if it is late").fill("Acceptance test purpose");
  await page.getByPlaceholder("Describe the finished result").fill("Acceptance test finished result");
  if (step) await page.getByPlaceholder("Step 1").fill(step);
  else await page.getByLabel(/No steps needed/).check();
  const assignee = page.locator("select.field").filter({ has: page.locator("option", { hasText: "Staff Fixture" }) });
  await assignee.selectOption({ label: "Staff Fixture" });
  await page.getByRole("button", { name: "Give it out" }).click();
  await expect(page.getByText(/is with them/)).toBeVisible();
}

test("Staff and Manager complete the real work loop, including return and approval", async ({ browser }) => {
  const title = "Acceptance task — review loop";
  const step = "Acceptance step one";

  {
    const { context, page } = await openAs(browser, "manager@ceac.local.test");
    await assignTask(page, title, step);
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "staff@ceac.local.test");

    await page.getByRole("button", { name: "Start work", exact: true }).click();
    const startDialog = page.getByRole("dialog");
    await expect(startDialog).toBeFocused();
    await startDialog.getByRole("button", { name: "At the office" }).click();
    await startDialog.getByRole("button", { name: "Start work", exact: true }).click();
    await expect(page.getByRole("button", { name: "End work" })).toBeVisible();

    await go(page, "Work");
    await page.getByText(title, { exact: true }).click();
    await expect(page.getByText("Why this matters")).toBeVisible();
    await expect(page.getByText("What finished looks like")).toBeVisible();
    await page.getByRole("button", { name: new RegExp(step) }).click();
    await page.getByRole("button", { name: "Send for review" }).click();
    const sendDialog = page.getByRole("dialog");
    await sendDialog.getByPlaceholder("Anything they should know (optional)").fill("First submission");
    await sendDialog.getByRole("button", { name: "Send", exact: true }).click();
    await expect(page.getByText("Sent in")).toBeVisible();

    await page.getByRole("button", { name: "← Back" }).click();
    await go(page, "Home");
    await page.getByRole("button", { name: "End work" }).click();
    await expect(page.getByRole("button", { name: "Start work", exact: true })).toBeVisible();
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "manager@ceac.local.test");
    const reviewRow = page.locator(".home-action-row").filter({ hasText: title });
    await expect(reviewRow).toBeVisible();
    await reviewRow.getByRole("button", { name: "Return" }).click();
    const returnDialog = page.getByRole("dialog");
    const redo = returnDialog.getByRole("button", { name: new RegExp(step) });
    if (await redo.count()) await redo.click();
    await returnDialog.getByPlaceholder("What needs changing").fill("Please correct the acceptance item.");
    await returnDialog.getByRole("button", { name: "Return", exact: true }).click();
    await expect(page.locator(".home-action-row").filter({ hasText: title })).toHaveCount(0);
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "staff@ceac.local.test");
    await go(page, "Work");
    await page.getByText(title, { exact: true }).click();
    await expect(page.getByText("Sent back by your manager")).toBeVisible();
    await expect(page.getByText("Please correct the acceptance item.")).toBeVisible();

    const check = page.getByRole("button", { name: new RegExp(step) });
    const klass = await check.getAttribute("class");
    if (!String(klass).includes("done")) {
      await page.getByRole("button", { name: "← Back" }).click();
      await go(page, "Home");
      await page.getByRole("button", { name: "Start work", exact: true }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("button", { name: "At the office" }).click();
      await dialog.getByRole("button", { name: "Start work", exact: true }).click();
      await go(page, "Work");
      await page.getByText(title, { exact: true }).click();
      await page.getByRole("button", { name: new RegExp(step) }).click();
    }

    await page.getByRole("button", { name: "Send for review" }).click();
    const resubmitDialog = page.getByRole("dialog");
    const send = resubmitDialog.getByRole("button", { name: /^(Send|Send outside session)$/ });
    await send.click();
    await expect(page.getByText("Sent in")).toBeVisible();
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "manager@ceac.local.test");
    const reviewRow = page.locator(".home-action-row").filter({ hasText: title });
    await expect(reviewRow).toBeVisible();
    await reviewRow.getByRole("button", { name: "Approve" }).click();
    const approveDialog = page.getByRole("dialog");
    await approveDialog.getByRole("button", { name: "Approve", exact: true }).click();
    await expect(page.locator(".home-action-row").filter({ hasText: title })).toHaveCount(0);
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "staff@ceac.local.test");
    await go(page, "Record");
    await expect(page.getByText(title, { exact: true })).toBeVisible();
    await go(page, "Home");
    const endWork = page.getByRole("button", { name: "End work" });
    if (await endWork.count()) await endWork.click();
    await context.close();
  }
});

test("A blocker can be raised, acknowledged by the manager, and resolved", async ({ browser }) => {
  const title = "Acceptance task — blocker";

  {
    const { context, page } = await openAs(browser, "manager@ceac.local.test");
    await assignTask(page, title);
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "staff@ceac.local.test");
    await page.getByRole("button", { name: "Start work", exact: true }).click();
    const startDialog = page.getByRole("dialog");
    await startDialog.getByRole("button", { name: "At the office" }).click();
    await startDialog.getByRole("button", { name: "Start work", exact: true }).click();

    await go(page, "Work");
    await page.getByText(title, { exact: true }).click();
    await page.getByRole("button", { name: "I am waiting on someone" }).click();
    const blockerDialog = page.getByRole("dialog");
    await blockerDialog.getByPlaceholder("What you need, and from whom").fill("Manager confirmation");
    await blockerDialog.getByRole("button", { name: "Test Unit A" }).click();
    await blockerDialog.getByRole("button", { name: "Mark as waiting" }).click();
    await expect(page.getByText(/Waiting on Test Unit A/)).toBeVisible();
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "manager@ceac.local.test");
    const blockerRow = page.locator(".home-blocker-row").filter({ hasText: title });
    await expect(blockerRow).toBeVisible();
    await blockerRow.getByRole("button", { name: "Acknowledge" }).click();
    await expect(page.locator(".home-blocker-row").filter({ hasText: title })).toContainText("acknowledged");
    const acknowledgedRow = page.locator(".home-blocker-row").filter({ hasText: title });
    await acknowledgedRow.getByRole("button", { name: "Mark resolved" }).click();
    await expect(page.locator(".home-blocker-row").filter({ hasText: title })).toHaveCount(0);
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "staff@ceac.local.test");
    await go(page, "Work");
    await page.getByText(title, { exact: true }).click();
    await expect(page.getByText(/Waiting on Test Unit A/)).toHaveCount(0);
    await page.getByRole("button", { name: "← Back" }).click();
    await go(page, "Home");
    const endWork = page.getByRole("button", { name: "End work" });
    if (await endWork.count()) await endWork.click();
    await context.close();
  }
});

test("Staff personal details persist and private work stays out of another staff account", async ({ browser }) => {
  const privateTitle = "Private acceptance work";

  {
    const { context, page } = await openAs(browser, "staff@ceac.local.test");
    await go(page, "Me");
    await page.getByRole("tab", { name: "Personal" }).click();
    await page.getByRole("button", { name: "Edit" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Preferred name").fill("Staff Preferred");
    await dialog.getByLabel("Phone", { exact: true }).fill("+233200000001");
    await dialog.getByPlaceholder("Contact name").fill("Emergency Fixture");
    await dialog.getByLabel("Address or ordinary contact information").fill("Fixture address");
    await dialog.getByRole("button", { name: "Save personal details" }).click();
    await expect(dialog.getByRole("button", { name: "Save personal details" })).toBeEnabled();
    await dialog.getByRole("button", { name: "Close dialog" }).click();

    await page.getByRole("button", { name: "Edit" }).click();
    const reopened = page.getByRole("dialog");
    await expect(reopened.getByLabel("Preferred name")).toHaveValue("Staff Preferred");
    await expect(reopened.getByPlaceholder("Contact name")).toHaveValue("Emergency Fixture");
    await expect(reopened.getByLabel("Address or ordinary contact information")).toHaveValue("Fixture address");
    await reopened.getByRole("button", { name: "Close dialog" }).click();

    await go(page, "Work");
    await page.getByRole("button", { name: "Add private work" }).click();
    const privateDialog = page.getByRole("dialog");
    await privateDialog.getByPlaceholder("What are you doing?").fill(privateTitle);
    await privateDialog.getByPlaceholder("What should be true when this is finished?").fill("Private acceptance outcome");
    await privateDialog.getByLabel(/No steps needed/).check();
    await privateDialog.getByRole("button", { name: "Add private work" }).click();
    await expect(page.getByText(/added as private work/)).toBeVisible();
    await expect(page.getByText(privateTitle, { exact: true })).toBeVisible();
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "other@ceac.local.test");
    await go(page, "Work");
    await expect(page.getByText(privateTitle, { exact: true })).toHaveCount(0);
    await context.close();
  }
});

test("Typed work can be created and reaches the Staff work surface", async ({ browser }) => {
  const created = [
    { kind: "Routine", title: "Acceptance routine", button: "Create routine", fields: [] },
    { kind: "Case", title: "Acceptance case", button: "Open case", fields: [] },
    { kind: "Request", title: "Acceptance request", button: "Send request", fields: ["requestUnit"] },
    { kind: "Decision", title: "Acceptance decision", button: "Ask for decision", fields: ["decision"] },
    { kind: "Meeting outcome", title: "Acceptance meeting outcome", button: "Record meeting outcome", fields: ["meeting"] },
    { kind: "Deliverable", title: "Acceptance deliverable", button: "Give deliverable", fields: ["deliverable"] },
  ];

  const { context, page } = await openAs(browser, "manager@ceac.local.test");
  await page.getByRole("button", { name: "Give out work" }).click();

  for (const item of created) {
    await page.locator("select.field").first().selectOption({ label: item.kind });

    if (item.kind === "Routine") await page.getByPlaceholder("What repeats?").fill(item.title);
    if (item.kind === "Case") await page.getByPlaceholder("What matter needs to stay open?").fill(item.title);
    if (item.kind === "Request") await page.getByPlaceholder("What do you need?").fill(item.title);
    if (item.kind === "Decision") {
      await page.getByPlaceholder("What decision is needed?").fill(item.title);
      await page.getByPlaceholder("Decision question").fill("Acceptance decision question");
    }
    if (item.kind === "Meeting outcome") {
      await page.getByPlaceholder("What was agreed?").fill(item.title);
      await page.getByPlaceholder("Meeting title").fill("Acceptance meeting");
    }
    if (item.kind === "Deliverable") {
      await page.getByPlaceholder("What must be produced?").fill(item.title);
      await page.getByPlaceholder("Describe exactly what must be delivered").fill("Acceptance finished deliverable");
    }

    if (item.kind === "Request") {
      const unitSelect = page.locator("select.field").filter({ has: page.locator("option", { hasText: "Test Unit A" }) }).first();
      await unitSelect.selectOption({ label: "Test Unit A" });
    } else {
      const assignee = page.locator("select.field").filter({ has: page.locator("option", { hasText: "Staff Fixture" }) });
      await assignee.selectOption({ label: "Staff Fixture" });
    }

    await page.getByRole("button", { name: item.button }).click();
    await expect(page.getByText(/is with them/)).toBeVisible();
    await page.getByRole("button", { name: "Give out something else" }).click();
  }

  await context.close();

  const staff = await openAs(browser, "staff@ceac.local.test");
  await go(staff.page, "Work");
  for (const item of created.filter((entry) => entry.kind !== "Request")) {
    await expect(staff.page.getByText(item.title, { exact: true })).toBeVisible();
  }
  await staff.context.close();
});

test("Mobile Staff and desktop Admin/Executive surfaces render without obvious regression", async ({ browser }) => {
  {
    const { context, page } = await openAs(browser, "staff@ceac.local.test", { width: 390, height: 844 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page.locator(".tabs")).toBeVisible();
    const activeEnd = page.getByRole("button", { name: "End work" });
    if (await activeEnd.count()) await activeEnd.click();
    await page.getByRole("button", { name: "Start work", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "admin@ceac.local.test");
    for (const destination of ["Units", "People", "Attendance", "Cost", "Reporting", "Settings"]) {
      await go(page, destination);
      await expect(page.locator(".body")).toBeVisible();
      await expect(page.locator(".flag-brick")).toHaveCount(0);
    }
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "exec@ceac.local.test");
    await expect(page.locator(".body")).toBeVisible();
    await go(page, "Announcements");
    await expect(page.locator(".body")).toBeVisible();
    await go(page, "Me");
    await expect(page.locator(".body")).toBeVisible();
    await context.close();
  }
});


test("Staff PWA layout has no page-level horizontal overflow at supported phone widths", async ({ browser }) => {
  test.setTimeout(90000);
  const widths = [320, 360, 375, 390, 414, 430];
  const destinations = ["Home", "Work", "Team", "Record", "Me"];

  for (const width of widths) {
    const { context, page } = await openAs(browser, "staff@ceac.local.test", { width, height: 844 });
    for (const destination of destinations) {
      if (destination !== "Home") {
        await page.locator(".tabs").getByRole("button", { name: destination, exact: true }).click();
      }
      await expect(page.locator(".body")).toBeVisible();
      const overflow = await page.evaluate(() => ({
        document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        body: document.body.scrollWidth - document.body.clientWidth,
      }));
      expect(overflow.document, `${destination} overflowed the ${width}px viewport`).toBeLessThanOrEqual(1);
      expect(overflow.body, `${destination} body overflowed the ${width}px viewport`).toBeLessThanOrEqual(1);
    }
    await context.close();
  }
});


test("Unit Rooms carry attributable communication between Manager and Staff", async ({ browser }) => {
  const message = "Room acceptance — confirm Sunday setup";

  {
    const { context, page } = await openAs(browser, "manager@ceac.local.test", { width: 390, height: 844 });
    await page.locator(".tabs").getByRole("button", { name: "Team", exact: true }).click();
    await page.getByRole("button", { name: /Unit Room/ }).click();
    await expect(page.getByRole("heading", { name: "Test Unit A" })).toBeVisible();
    await page.getByPlaceholder("Message your unit").fill(message);
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(page.getByText(message, { exact: true })).toBeVisible();
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "staff@ceac.local.test", { width: 390, height: 844 });
    await page.locator(".tabs").getByRole("button", { name: "Team", exact: true }).click();
    await page.getByRole("button", { name: /Unit Room/ }).click();
    await expect(page.getByText(message, { exact: true })).toBeVisible();
    await context.close();
  }
});

test("A Manager can schedule a Unit meeting and Staff can open its operational record", async ({ browser }) => {
  const title = "Acceptance unit meeting";
  const tomorrow = new Date(Date.now() + 86400000);
  const pad = (value) => String(value).padStart(2, "0");
  const localValue = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth()+1)}-${pad(tomorrow.getDate())}T10:30`;

  {
    const { context, page } = await openAs(browser, "manager@ceac.local.test", { width: 390, height: 844 });
    await page.locator(".tabs").getByRole("button", { name: "More", exact: true }).click();
    await page.getByRole("menuitem", { name: /Calendar/ }).click();
    await page.getByRole("button", { name: "Schedule meeting" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder("Meeting title").fill(title);
    await dialog.locator('input[type="datetime-local"]').first().fill(localValue);
    await dialog.getByPlaceholder("Zoom join link (optional)").fill("https://zoom.us/j/123456789");
    await dialog.getByPlaceholder("Agenda (optional)").fill("Review current work and record actions.");
    await dialog.getByRole("button", { name: "Schedule meeting" }).click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByRole("link", { name: /Join Zoom/ })).toBeVisible();
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "staff@ceac.local.test", { width: 390, height: 844 });
    const meetingRow = page.locator(".home-meeting-row").filter({ hasText: title });
    await expect(meetingRow).toBeVisible();
    await meetingRow.click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByText("Notes & decisions", { exact: true })).toBeVisible();
    await context.close();
  }
});

test("Role shells stay within the phone viewport", async ({ browser }) => {
  const roles = [
    ["manager@ceac.local.test", ["Home", "Work", "Team", "Projects"]],
    ["admin@ceac.local.test", ["Home", "People", "Attendance", "Reports"]],
    ["exec@ceac.local.test", ["Home", "Announcements", "Me"]],
  ];

  for (const [email, destinations] of roles) {
    const { context, page } = await openAs(browser, email, { width: 390, height: 844 });
    for (const destination of destinations) {
      if (destination !== "Home") {
        const direct = page.locator(".tabs").getByRole("button", { name: destination, exact: true });
        if (await direct.count()) await direct.click();
        else {
          const more = page.locator(".tabs").getByRole("button", { name: "More", exact: true });
          await more.click();
          await page.getByRole("menuitem", { name: destination, exact: true }).click();
        }
      }
      await expect(page.locator(".body")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${email} / ${destination} overflowed the phone viewport`).toBeLessThanOrEqual(1);
    }
    await context.close();
  }
});
