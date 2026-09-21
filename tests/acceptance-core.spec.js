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
  await page.getByLabel("Work to complete").fill(title);
  await page.getByLabel("Why this matters").fill("Acceptance test purpose");
  await page.getByLabel("Finished result").fill("Acceptance test finished result");
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
    await reviewRow.getByRole("button", { name: "Review" }).click();
    const returnDialog = page.getByRole("dialog");
    await expect(returnDialog.getByText("Evidence-first review")).toBeVisible();
    await returnDialog.getByRole("button", { name: "Return for correction" }).click();
    const redo = returnDialog.getByRole("button", { name: new RegExp(step) });
    if (await redo.count()) await redo.click();
    await returnDialog.getByPlaceholder("Explain exactly what needs changing").fill("Please correct the acceptance item.");
    await returnDialog.getByRole("button", { name: "Return work", exact: true }).click();
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
    await reviewRow.getByRole("button", { name: "Review" }).click();
    const approveDialog = page.getByRole("dialog");
    await expect(approveDialog.getByText("Evidence-first review")).toBeVisible();
    await approveDialog.getByRole("button", { name: "Approve", exact: true }).click();
    await approveDialog.getByRole("button", { name: "Confirm approval", exact: true }).click();
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
    await expect(page.getByRole("button", { name: "Start work", exact: true })).toBeVisible();

    await go(page, "Work");
    await page.getByText(title, { exact: true }).click();
    const waitingAction = page.getByRole("button", { name: "I am waiting on someone" });
    await expect(waitingAction).toBeEnabled();
    await waitingAction.click();
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
    await context.close();
  }
});

test("Nested Work navigation survives refresh and browser Back", async ({ browser }) => {
  const title = "Acceptance task — deep link";

  {
    const { context, page } = await openAs(browser, "manager@ceac.local.test");
    await assignTask(page, title);
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "staff@ceac.local.test");
    await go(page, "Work");
    await page.getByText(title, { exact: true }).click();
    await expect(page).toHaveURL(/(?:\?|&)item=/);
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();

    await page.reload();
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
    await expect(page).toHaveURL(/(?:\?|&)item=/);

    await page.goBack();
    await expect(page).toHaveURL(/(?:\?|&)tab=work/);
    await expect(page.getByText(title, { exact: true })).toBeVisible();
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

test("Assistive voice controls are real interaction affordances and proposals require review", async ({ browser }) => {
  const { context, page } = await openAs(browser, "manager@ceac.local.test", { width: 390, height: 844 });
  await page.getByRole("button", { name: "Give out work" }).click();
  const mic = page.getByRole("button", { name: "Speak your instruction" });
  await expect(mic).toBeVisible();
  await expect(page.getByText("Apply proposal", { exact: true })).toHaveCount(0);
  await context.close();
});

test("Typed work can be created and reaches the Staff work surface", async ({ browser }) => {
  const created = [
    { kind: "Routine", intent: "Set repeating work", title: "Acceptance routine", button: "Create routine" },
    { kind: "Case", intent: "Track an ongoing matter", title: "Acceptance case", button: "Open case" },
    { kind: "Request", intent: "Ask for something", title: "Acceptance request", button: "Send request" },
    { kind: "Decision", intent: "Get a decision", title: "Acceptance decision", button: "Ask for decision" },
    { kind: "Meeting outcome", intent: "Follow up from a meeting", title: "Acceptance meeting outcome", button: "Record meeting outcome" },
    { kind: "Deliverable", intent: "Get a finished output", title: "Acceptance deliverable", button: "Give deliverable" },
  ];

  const { context, page } = await openAs(browser, "manager@ceac.local.test");
  await page.getByRole("button", { name: "Give out work" }).click();

  for (const item of created) {
    await page.getByRole("radio", { name: new RegExp(item.intent) }).click();

    if (item.kind === "Routine") await page.getByLabel("Repeating responsibility").fill(item.title);
    if (item.kind === "Case") await page.getByLabel("Matter to track").fill(item.title);
    if (item.kind === "Request") await page.getByLabel("What you need").fill(item.title);
    if (item.kind === "Decision") {
      await page.getByLabel("Decision needed").fill(item.title);
      await page.getByLabel("Decision question").fill("Acceptance decision question");
    }
    if (item.kind === "Meeting outcome") {
      await page.getByLabel("Commitment agreed").fill(item.title);
      await page.getByLabel("Meeting title").fill("Acceptance meeting");
    }
    if (item.kind === "Deliverable") {
      await page.getByLabel("Output to produce").fill(item.title);
      await page.getByLabel("Finished output").fill("Acceptance finished deliverable");
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
    await expect(page).toHaveURL(/roomKind=unit/);
    await expect(page.getByRole("heading", { name: "Test Unit A" })).toBeVisible();
    await page.reload();
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

test("Rooms 2.0 resolves real mentions and supports Sub-team context without DMs", async ({ browser }) => {
  const message = "Please confirm the camera setup";

  {
    const { context, page } = await openAs(browser, "manager@ceac.local.test", { width: 390, height: 844 });
    await page.locator(".tabs").getByRole("button", { name: "Team", exact: true }).click();
    await page.getByRole("button", { name: /Unit Room/ }).click();

    await expect(page.getByRole("button", { name: "Fixture Video Team", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Fixture Video Team", exact: true }).click();
    await expect(page).toHaveURL(/roomKind=sub_team/);
    await expect(page.getByText("Sub-team Room", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText("Sub-team Room", { exact: true })).toBeVisible();

    const composer = page.getByPlaceholder("Message Fixture Video Team");
    await composer.fill("@Sta");
    await expect(page.getByRole("button", { name: /Staff Fixture/ })).toBeVisible();
    await page.getByRole("button", { name: /Staff Fixture/ }).click();
    await composer.fill((await composer.inputValue()) + message);
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(page.getByText(/Staff Fixture.*Please confirm the camera setup/)).toBeVisible();

    await page.getByRole("button", { name: "Add context or action" }).click();
    await expect(page.getByText("Schedule meeting", { exact: true })).toBeVisible();
    await expect(page.getByText("Direct message", { exact: true })).toHaveCount(0);
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "sameunit@ceac.local.test", { width: 390, height: 844 });
    await page.locator(".tabs").getByRole("button", { name: "Team", exact: true }).click();
    await page.getByRole("button", { name: /Unit Room/ }).click();
    await expect(page.getByRole("button", { name: "Fixture Video Team", exact: true })).toHaveCount(0);
    await context.close();
  }
});

test("A Manager can schedule a Unit meeting with an explicit audience and Staff can open it", async ({ browser }) => {
  const title = "Acceptance unit meeting";
  const tomorrow = new Date(Date.now() + 86400000);
  const pad = (value) => String(value).padStart(2, "0");
  const localValue = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth()+1)}-${pad(tomorrow.getDate())}T10:30`;

  {
    const { context, page } = await openAs(browser, "manager@ceac.local.test", { width: 390, height: 844 });
    await page.locator(".tabs").getByRole("button", { name: "More", exact: true }).click();
    await page.getByRole("menuitem", { name: /Calendar/ }).click();

    await expect(page.getByRole("button", { name: "Month", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Week", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /View All/ })).toBeVisible();
    await page.getByRole("button", { name: /View All/ }).click();
    const filterDialog = page.getByRole("dialog");
    await filterDialog.getByRole("button", { name: "Meetings", exact: true }).click();

    await page.getByRole("button", { name: "Schedule meeting" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder("What is this meeting for?").fill(title);
    await dialog.locator('input[type="datetime-local"]').first().fill(localValue);
    await dialog.getByPlaceholder("Join link (optional)").fill("https://zoom.us/j/123456789");
    await dialog.getByPlaceholder("What should this meeting cover?").fill("Review current work and record actions.");

    const unitAudience = dialog.getByRole("button", { name: /Everyone in this unit/ });
    if (!(await unitAudience.getAttribute("class") || "").includes("on")) await unitAudience.click();

    await dialog.getByRole("button", { name: "Schedule and notify" }).click();
    await expect(page).toHaveURL(/(?:\?|&)meeting=/);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByRole("link", { name: /Join Zoom/ })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
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

test("Manager primary surfaces stay usable across supported phone widths", async ({ browser }) => {
  test.setTimeout(120000);
  const widths = [320, 360, 375, 390, 414, 430];
  const destinations = ["Home", "Work", "Team", "Projects", "Calendar", "Finance", "Reports"];

  for (const width of widths) {
    const { context, page } = await openAs(browser, "manager@ceac.local.test", { width, height: 844 });
    for (const destination of destinations) {
      if (destination !== "Home") {
        const direct = page.locator(".tabs").getByRole("button", { name: destination, exact: true });
        if (await direct.count()) await direct.click();
        else {
          const more = page.locator(".tabs").getByRole("button", { name: "More", exact: true });
          await more.click();
          await page.getByRole("menuitem", { name: destination, exact: true }).click();
        }
      } else {
        const home = page.locator(".tabs").getByRole("button", { name: "Home", exact: true });
        if (await home.count()) await home.click();
      }
      await expect(page.locator(".body")).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        bodyWidth: document.querySelector(".body")?.getBoundingClientRect().width || 0,
      }));
      expect(dimensions.overflow, `Manager / ${destination} overflowed at ${width}px`).toBeLessThanOrEqual(1);
      expect(dimensions.bodyWidth, `Manager / ${destination} collapsed at ${width}px`).toBeGreaterThan(250);
    }
    await context.close();
  }
});

test("Administration surfaces use policy-safe HR states and real employee records", async ({ browser }) => {
  test.setTimeout(150000);
  const { context, page } = await openAs(browser, "admin@ceac.local.test", { width: 1280, height: 900 });

  await expect(page.getByRole("heading", { name: "Administration", exact: true })).toBeVisible();
  await expect(page.getByText("Need your action", { exact: true })).toBeVisible();
  await expect(page.getByText("Reporting gaps", { exact: true })).toBeVisible();
  await expect(page.getByText("Delivery risks", { exact: true })).toBeVisible();
  await expect(page.getByText("Administration could not finish loading", { exact: true })).toHaveCount(0);

  await go(page, "Units");
  await expect(page.getByRole("heading", { name: "Units", exact: true })).toBeVisible();
  const unitCard = page.locator(".admin-unit-card").filter({ hasText: "Test Unit A" });
  await expect(unitCard).toBeVisible();
  await unitCard.click();
  const unitWorkspace = page.getByRole("navigation", { name: "Unit workspace" });
  await expect(unitWorkspace).toBeVisible();
  await expect(unitWorkspace.getByRole("button", { name: "Reporting", exact: true })).toBeVisible();
  await expect(unitWorkspace.getByRole("button", { name: "Attendance", exact: true })).toBeVisible();
  await expect(unitWorkspace.getByRole("button", { name: "Cost", exact: true })).toBeVisible();

  await go(page, "People");
  await expect(page.getByRole("heading", { name: "People", exact: true })).toBeVisible();
  await page.getByLabel("Find a person").fill("Staff Fixture");
  await page.getByRole("button", { name: /Staff Fixture/ }).click();
  await expect(page.getByText("Protected HR", { exact: true })).toBeVisible();
  await expect(page.getByText("Awaiting CEAC salary structure", { exact: true })).toBeVisible();
  await expect(page.getByText(/entitlement not configured/i)).toBeVisible();

  await go(page, "Attendance");
  await expect(page.getByText("Leave policy not configured", { exact: true })).toBeVisible();
  await expect(page.getByText(/not a performance judgement/i)).toBeVisible();

  await go(page, "Settings");
  await expect(page.getByText("Leave policy not configured", { exact: true })).toBeVisible();
  await expect(page.getByText("Awaiting CEAC policy", { exact: true }).first()).toBeVisible();
  await expect(page.getByPlaceholder("Not configured").first()).toHaveValue("");
  await page.getByLabel("Annual leave days").fill("20");
  await page.getByLabel("Sick leave days").fill("10");
  await page.getByLabel("Maximum carry-over").fill("4");
  await page.getByLabel("Manager approval limit").fill("3");
  await page.getByRole("button", { name: "Confirm leave policy", exact: true }).click();
  await expect(page.getByText("Leave policy confirmed", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Annual leave days")).toHaveValue("20");
  await expect(page.getByLabel("Sick leave days")).toHaveValue("10");
  await expect(page.getByLabel("Maximum carry-over")).toHaveValue("4");
  await expect(page.getByLabel("Manager approval limit")).toHaveValue("3");

  const attentionRule = page.locator(".office-threshold-row").filter({ hasText: "active work has not moved for" });
  const attentionInput = attentionRule.locator("input");
  await attentionInput.fill("9");
  await attentionRule.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Attention rule updated", { exact: true })).toBeVisible();
  await page.reload();
  const reloadedRule = page.locator(".office-threshold-row").filter({ hasText: "active work has not moved for" });
  await expect(reloadedRule.locator("input")).toHaveValue("9");

  await expect(page.getByRole("button", { name: /Office location/ }).first()).toBeVisible();

  await context.close();
});

test("Administration primary surfaces stay within supported phone widths", async ({ browser }) => {
  test.setTimeout(120000);
  const widths = [320, 360, 375, 390, 414, 430];
  const destinations = ["Home", "People", "Attendance", "Reports", "Units", "Cost", "Finance", "Settings"];

  for (const width of widths) {
    const { context, page } = await openAs(browser, "admin@ceac.local.test", { width, height: 844 });

    for (const destination of destinations) {
      if (destination !== "Home") {
        const direct = page.locator(".tabs").getByRole("button", { name: destination, exact: true });
        if (await direct.count()) await direct.click();
        else {
          const more = page.locator(".tabs").getByRole("button", { name: "More", exact: true });
          await more.click();
          await page.getByRole("menuitem", { name: destination, exact: true }).click();
        }
      } else {
        const home = page.locator(".tabs").getByRole("button", { name: "Home", exact: true });
        if (await home.count()) await home.click();
      }

      await expect(page.locator(".body")).toBeVisible();
      const geometry = await page.evaluate(() => {
        const app = document.querySelector(".office-app")?.getBoundingClientRect();
        const body = document.querySelector(".office-app .body")?.getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          viewport: window.innerWidth,
          appLeft: app?.left ?? null,
          appRight: app?.right ?? null,
          bodyLeft: body?.left ?? null,
          bodyRight: body?.right ?? null,
        };
      });
      expect(geometry.overflow, `Administration / ${destination} overflowed at ${width}px`).toBeLessThanOrEqual(1);
      expect(Math.abs(geometry.appLeft ?? 0), `Administration shell left a gap at ${width}px`).toBeLessThanOrEqual(1);
      expect(Math.abs((geometry.appRight ?? geometry.viewport) - geometry.viewport), `Administration shell left a right-side gap at ${width}px`).toBeLessThanOrEqual(1);
      expect(Math.abs(geometry.bodyLeft ?? 0), `Administration body left a gap at ${width}px`).toBeLessThanOrEqual(1);
      expect(Math.abs((geometry.bodyRight ?? geometry.viewport) - geometry.viewport), `Administration body left a right-side gap at ${width}px`).toBeLessThanOrEqual(1);
    }
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
