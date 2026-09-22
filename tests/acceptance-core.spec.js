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
    await go(page, "Me");
    await page.getByRole("button", { name: /My work history/ }).click();
    await expect(page.getByRole("heading", { name: "My work history" })).toBeVisible();
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
    await expect(page.getByText(privateTitle, { exact: true })).toBeVisible({ timeout: 15000 });
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
    for (const destination of ["Units", "People", "Attendance", "Cost", "Reports", "Settings"]) {
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
  const destinations = ["Home", "Work", "Team", "Me"];

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

      if (destination === "Me") {
        await page.getByRole("button", { name: /My work history/ }).click();
        await expect(page.getByRole("heading", { name: "My work history" })).toBeVisible();
        const historyOverflow = await page.evaluate(() => ({
          document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          body: document.body.scrollWidth - document.body.clientWidth,
        }));
        expect(historyOverflow.document, `My work history overflowed the ${width}px viewport`).toBeLessThanOrEqual(1);
        expect(historyOverflow.body, `My work history body overflowed the ${width}px viewport`).toBeLessThanOrEqual(1);
      }
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
    await expect(page.getByRole("button", { name: /Staff Fixture/ })).toBeVisible({ timeout: 15000 });
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
    await expect(page.getByRole("heading", { name: "Meeting workspace" })).toBeVisible();
    await expect(page.getByText("Notes open when the meeting starts", { exact: true })).toBeVisible();
    await expect(page.getByText("My notes", { exact: true })).toHaveCount(0);
    await context.close();
  }
});

test("Administration can combine multiple units into one meeting audience", async ({ browser }) => {
  const title = "Acceptance multi-unit meeting";
  const tomorrow = new Date(Date.now() + 2 * 86400000);
  const pad = (value) => String(value).padStart(2, "0");
  const localValue = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth()+1)}-${pad(tomorrow.getDate())}T09:00`;

  const { context, page } = await openAs(browser, "admin@ceac.local.test");
  await go(page, "Home");
  await page.getByRole("button", { name: "Schedule", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("What is this meeting for?").fill(title);
  await dialog.locator('input[type="datetime-local"]').first().fill(localValue);

  await dialog.getByRole("button", { name: /Test Unit A/ }).click();
  await dialog.getByRole("button", { name: /Test Unit B/ }).click();
  await expect(dialog.getByText(/participant/).first()).toBeVisible();
  await dialog.getByRole("button", { name: "Schedule and notify" }).click();

  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText(/participant/).first()).toBeVisible();
  await context.close();
});

test("Manager primary surfaces stay usable across supported phone widths", async ({ browser }) => {
  test.setTimeout(120000);
  const widths = [320, 360, 375, 390, 414, 430];
  const destinations = ["Home", "Work", "Team", "Projects", "Calendar", "Strategy", "Delivery", "Workload", "Performance & development", "Learning", "Finance", "Reports"];

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

test("Goals and Strategy preserves factual hierarchy and manager authority", async ({ browser }) => {
  test.setTimeout(120000);

  {
    const { context, page } = await openAs(browser, "admin@ceac.local.test", { width: 1280, height: 900 });
    await go(page, "Strategy");
    await expect(page.getByRole("heading", { name: "Strategy", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Add Ministry Direction", exact: true }).click();
    let dialog = page.getByRole("dialog");
    await dialog.getByLabel("Strategy name").fill("Acceptance ministry direction");
    await dialog.getByLabel("Strategy statement").fill("Build reliable ministry systems while reaching and serving people.");
    await dialog.getByLabel("Strategy change reason").fill("Acceptance Stage 4 direction");
    await dialog.getByRole("button", { name: "Create strategy record", exact: true }).click();
    await expect(page.getByText("Strategy record created.", { exact: true })).toBeVisible();

    const direction = page.locator("section.card").filter({ hasText: "Acceptance ministry direction" });
    await expect(direction).toBeVisible();
    await direction.getByRole("button", { name: "Add Ministry Objective", exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Strategy name").fill("Acceptance ministry objective");
    await dialog.getByLabel("Strategy statement").fill("Make weekly ministry delivery more reliable across participating units.");
    await dialog.getByLabel("Strategy change reason").fill("Acceptance Stage 4 ministry objective");
    await dialog.getByRole("button", { name: "Create strategy record", exact: true }).click();

    await page.getByRole("button", { name: "Add Unit Objective", exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Strategy unit").selectOption("20000000-0000-4000-8000-000000000011");
    await dialog.getByLabel("Strategy name").fill("Acceptance Unit A objective");
    await dialog.getByLabel("Strategy statement").fill("Record completed readiness outcomes for the agreed weekly schedule.");
    await dialog.getByLabel("Strategy measurement").selectOption("numeric");
    await dialog.getByLabel("Strategy measure label").fill("Completed readiness outcomes");
    await dialog.getByLabel("Strategy target value").fill("12");
    await dialog.getByLabel("Strategy target unit").fill("outcomes");
    await dialog.getByLabel("Strategy current value").fill("3");
    await dialog.getByLabel("Strategy change reason").fill("Acceptance Stage 4 unit objective");
    await dialog.getByRole("button", { name: "Create strategy record", exact: true }).click();

    await expect(page.getByText(/current 3 outcomes · target 12 outcomes/)).toBeVisible();
    await page.reload();
    await expect(page.getByText("Acceptance ministry direction", { exact: true })).toBeVisible();
    await expect(page.getByText(/Acceptance Unit A objective/)).toBeVisible();
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "manager@ceac.local.test", { width: 1280, height: 900 });
    await go(page, "Strategy");
    const unitObjective = page.locator(".row").filter({ hasText: "Acceptance Unit A objective" });
    await expect(unitObjective).toBeVisible();
    await unitObjective.getByRole("button", { name: "Revise", exact: true }).click();
    let dialog = page.getByRole("dialog");
    await dialog.getByLabel("Strategy current value").fill("5");
    await dialog.getByLabel("Strategy change reason").fill("Acceptance factual result update");
    await dialog.getByRole("button", { name: "Record revision", exact: true }).click();
    await expect(page.getByText(/current 5 outcomes · target 12 outcomes/)).toBeVisible();

    await unitObjective.getByRole("button", { name: "Link project", exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Strategy delivery project").selectOption({ label: "Stage 4 Browser Project" });
    await dialog.getByLabel("Strategy delivery reason").fill("Acceptance project supports this Unit Objective");
    await dialog.getByRole("button", { name: "Link project", exact: true }).click();
    await expect(page.getByText("Stage 4 Browser Project", { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByText(/current 5 outcomes · target 12 outcomes/)).toBeVisible();
    await expect(page.getByText("Stage 4 Browser Project", { exact: true })).toBeVisible();
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "staff@ceac.local.test", { width: 390, height: 844 });
    await page.locator(".tabs").getByRole("button", { name: "Strategy", exact: true }).click();
    await expect(page.getByText("Acceptance ministry direction", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Ministry Direction", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Revise", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Link project", exact: true })).toHaveCount(0);
    await context.close();
  }
});

test("Stage 5 Delivery manages programmes, milestones, dependencies and project register without hidden scoring", async ({ browser }) => {
  test.setTimeout(150000);

  {
    const { context, page } = await openAs(browser, "manager@ceac.local.test", { width: 1280, height: 900 });
    await go(page, "Delivery");
    await expect(page.getByRole("heading", { name: "Delivery", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "New Programme / Portfolio", exact: true }).click();
    let dialog = page.getByRole("dialog");
    await dialog.getByLabel("Delivery group name").fill("Acceptance Unit A Programme");
    await dialog.getByLabel("Delivery group purpose").fill("Coordinate the Stage 5 browser delivery journey.");
    await dialog.getByLabel("Delivery group reason").fill("Acceptance Stage 5 programme");
    await dialog.getByRole("button", { name: "Create Programme / Portfolio", exact: true }).click();
    await expect(page.getByText("Programme / Portfolio created.", { exact: true })).toBeVisible();
    await expect(page.locator(".row-t").filter({ hasText: /^Acceptance Unit A Programme$/ }).first()).toBeVisible();

    await page.getByRole("button", { name: /Stage 4 Browser Project/ }).first().click();
    await page.getByLabel("Delivery project priority").selectOption("high");
    await page.getByLabel("Delivery project health").selectOption("watch");
    await page.getByLabel("Delivery metadata reason").fill("Acceptance explicit project health");
    await page.getByRole("button", { name: "Save project state", exact: true }).click();
    await expect(page.getByText("Project delivery metadata updated.", { exact: true })).toBeVisible();

    await page.getByLabel("Delivery group link", { exact: true }).selectOption({ label: "Acceptance Unit A Programme" });
    await page.getByLabel("Delivery group link reason").fill("Acceptance project belongs to programme");
    await page.getByRole("button", { name: "Link project", exact: true }).click();
    await expect(page.getByText("Project linked to Programme / Portfolio.", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Add milestone", exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Milestone name").fill("Acceptance Foundation milestone");
    await dialog.getByLabel("Milestone description").fill("Foundation delivery checkpoint.");
    await dialog.getByLabel("Milestone status").selectOption("in_progress");
    await dialog.getByLabel("Milestone reason").fill("Acceptance first milestone");
    await dialog.getByRole("button", { name: "Save milestone", exact: true }).click();
    await expect(page.getByText("Milestone recorded.", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Add milestone", exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Milestone name").fill("Acceptance Launch milestone");
    await dialog.getByLabel("Milestone description").fill("Launch delivery checkpoint.");
    await dialog.getByLabel("Milestone reason").fill("Acceptance second milestone");
    await dialog.getByRole("button", { name: "Save milestone", exact: true }).click();

    const foundation = page.locator(".row").filter({ hasText: "Acceptance Foundation milestone" });
    await foundation.getByRole("button", { name: "Revise", exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Milestone status").selectOption("achieved");
    await dialog.getByLabel("Milestone reason").fill("Acceptance foundation achieved");
    await dialog.getByRole("button", { name: "Record milestone revision", exact: true }).click();
    await expect(page.getByText("Milestone revised.", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Add risk", exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Register item title").fill("Acceptance dependency risk");
    await dialog.getByLabel("Register item description").fill("A predecessor delay could affect launch.");
    await dialog.getByLabel("Register item severity").selectOption("high");
    await dialog.getByLabel("Register item likelihood").selectOption("medium");
    await dialog.getByLabel("Register item response plan").fill("Review predecessor movement weekly.");
    await dialog.getByLabel("Register item reason").fill("Acceptance Stage 5 risk");
    await dialog.getByRole("button", { name: "Save risk", exact: true }).click();
    await expect(page.getByText("Risk recorded.", { exact: true })).toBeVisible();

    await page.getByLabel("Project dependency predecessor").selectOption({ label: "Stage 5 Dependency Project" });
    await page.getByLabel("Project dependency reason").fill("Acceptance project dependency");
    await page.getByRole("button", { name: "Add project dependency", exact: true }).click();
    await expect(page.getByText("Project dependency recorded.", { exact: true })).toBeVisible();

    await page.getByLabel("Milestone dependency successor").selectOption({ label: "Acceptance Launch milestone" });
    await page.getByLabel("Milestone dependency predecessor").selectOption({ label: "Acceptance Foundation milestone" });
    await page.getByLabel("Milestone dependency reason").fill("Acceptance milestone dependency");
    await page.getByRole("button", { name: "Add milestone dependency", exact: true }).click();
    await expect(page.getByText("Milestone dependency recorded.", { exact: true })).toBeVisible();

    await page.getByLabel("Work dependency successor").selectOption("26000000-0000-4000-8000-000000000012");
    await page.getByLabel("Work dependency predecessor").selectOption("26000000-0000-4000-8000-000000000011");
    await page.getByLabel("Work dependency reason").fill("Acceptance work dependency");
    await page.getByRole("button", { name: "Add work dependency", exact: true }).click();
    await expect(page.getByText("Work dependency recorded.", { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Delivery", exact: true })).toBeVisible();
    await expect(page.locator(".row-t").filter({ hasText: /^Acceptance Unit A Programme$/ }).first()).toBeVisible();
    await page.getByRole("button", { name: /Stage 4 Browser Project/ }).first().click();
    await expect(page.locator(".row-t").filter({ hasText: /^Acceptance Foundation milestone$/ }).first()).toBeVisible();
    await expect(page.getByText("Acceptance dependency risk", { exact: true })).toBeVisible();
    await expect(page.getByText(/Depends on Stage 5 Dependency Project/)).toBeVisible();
    await expect(page.getByText(/Acceptance Launch milestone depends on Acceptance Foundation milestone/)).toBeVisible();
    await expect(page.getByText(/Stage 5 dependent work depends on Stage 5 predecessor work/)).toBeVisible();
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "exec@ceac.local.test", { width: 1280, height: 900 });
    await go(page, "Delivery");
    await expect(page.getByRole("heading", { name: "Delivery", exact: true })).toBeVisible();
    await expect(page.locator(".row-t").filter({ hasText: /^Acceptance Unit A Programme$/ }).first()).toBeVisible();
    await expect(page.getByText(/hidden project score/i)).toBeVisible();
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "staff@ceac.local.test", { width: 390, height: 844 });
    await page.goto("/?tab=delivery");
    await expect(page.getByRole("heading", { name: "Delivery", exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Goals & development", exact: true })).toBeVisible();
    await context.close();
  }
});

test("Stage 6 Workload keeps capacity components factual and manager-scoped", async ({ browser }) => {
  test.setTimeout(120000);

  {
    const { context, page } = await openAs(browser, "manager@ceac.local.test", { width: 1280, height: 900 });
    await go(page, "Workload");
    await expect(page.getByRole("heading", { name: "Workload", exact: true })).toBeVisible();
    await expect(page.getByText(/does not turn these components into an employee score/i)).toBeVisible();

    await page.getByLabel("Workload person").selectOption("31000000-0000-4000-8000-000000000001");
    await page.getByLabel("Planning hours per week").fill("35");
    await page.getByLabel("Planning capacity reason").fill("Acceptance Stage 6 planning capacity");
    await page.getByRole("button", { name: "Record capacity version", exact: true }).click();
    await expect(page.getByText("Planning capacity recorded.", { exact: true })).toBeVisible();

    await page.getByLabel("Workload project").selectOption({ label: "Stage 4 Browser Project" });
    await page.getByLabel("Project commitment hours per week").fill("10");
    await page.getByLabel("Project commitment reason").fill("Acceptance Stage 6 project commitment");
    await page.getByRole("button", { name: "Record commitment version", exact: true }).click();
    await expect(page.getByText("Project commitment recorded.", { exact: true })).toBeVisible();

    await page.reload();
    await page.getByLabel("Workload person").selectOption("31000000-0000-4000-8000-000000000001");
    await expect(page.getByText("35 h", { exact: true }).first()).toBeVisible();

    const capacityMetric = page.getByRole("button", { name: /weekly planning capacity/i }).last();
    await capacityMetric.click();
    await expect(page.getByText("Planning capacity history", { exact: true })).toBeVisible();
    await expect(page.getByText("Acceptance Stage 6 planning capacity", { exact: true })).toBeVisible();

    const commitmentMetric = page.getByRole("button", { name: /project commitment \/ week/i }).last();
    await commitmentMetric.click();
    await expect(page.getByText("Project commitments overlapping this horizon", { exact: true })).toBeVisible();
    await expect(page.getByText("10 h \/ week", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Acceptance Stage 6 project commitment", { exact: true })).toBeVisible();
    await page.screenshot({ path: "test-artifacts/stage6-workload-desktop.png", fullPage: true });
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "manager@ceac.local.test", { width: 390, height: 844 });
    await page.locator(".tabs").getByRole("button", { name: "More", exact: true }).click();
    await page.getByRole("menuitem", { name: "Workload", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Workload", exact: true })).toBeVisible();
    await page.screenshot({ path: "test-artifacts/stage6-workload-mobile.png", fullPage: true });
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "staff@ceac.local.test", { width: 390, height: 844 });
    await page.goto("/?tab=workload");
    await expect(page.getByRole("heading", { name: "Workload", exact: true })).toHaveCount(0);
    await context.close();
  }
});

test("Stage 7 Reviews & development keeps appraisal evidence factual, visible and human-judged", async ({ browser }) => {
  test.setTimeout(180000);
  const cycleName = "Acceptance Stage 7 review";
  const reflectionText = "I completed the recorded work and want to improve how I plan the next cycle.";
  const assessmentText = "The recorded outcomes show reliable completion. The next focus is clearer planning before deadlines.";
  const conversationText = "We reviewed the evidence together and agreed to make weekly commitments explicit before execution.";
  const planFocus = "Planning before execution";
  const planOutcome = "Make weekly commitments explicit before work starts.";
  const planSteps = "Set the week plan on Monday, review it with the manager, and record changes.";
  const feedbackText = "Keep the planning note attached to the work before execution starts.";
  const staffReply = "I agree with the next step and will record changes during the week.";
  const feedbackReply = "Understood. I will keep the planning note with the work record.";

  const today = new Date();
  const start = new Date(today.getTime() - 30 * 86400000);
  const iso = (value) => value.toISOString().slice(0, 10);

  {
    const { context, page } = await openAs(browser, "admin@ceac.local.test", { width: 1280, height: 900 });
    await go(page, "Performance & development");
    await expect(page.getByRole("heading", { name: "Reviews & development", exact: true })).toBeVisible();
    await expect(page.getByText(/no employee score or ranking/i)).toBeVisible();

    await page.getByRole("button", { name: "Open review period", exact: true }).click();
    let dialog = page.getByRole("dialog");
    await dialog.getByLabel("Review period name").fill(cycleName);
    await dialog.getByRole("button", { name: "Continue", exact: true }).click();
    await dialog.getByLabel("Review period start").fill(iso(start));
    await dialog.getByLabel("Review period end").fill(iso(today));
    await dialog.getByRole("button", { name: "Continue", exact: true }).click();
    await dialog.getByLabel("Review period reason").fill("Acceptance Stage 7 evidence-first review");
    await dialog.getByRole("button", { name: "Open review period", exact: true }).click();

    await expect(page.getByText("Review period opened and factual evidence packs assembled.", { exact: true })).toBeVisible();
    await expect(page.getByText(cycleName, { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Staff Fixture", { exact: true }).first()).toBeVisible();
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "staff@ceac.local.test", { width: 390, height: 844 });
    await page.locator(".tabs").getByRole("button", { name: "Me", exact: true }).click();
    await page.getByRole("button", { name: /Reviews & development/ }).click();
    await expect(page.getByRole("heading", { name: "Reviews & development", exact: true })).toBeVisible();
    await expect(page.getByText(cycleName, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Activity sessions are shown only as context/i)).toBeVisible();

    await page.getByLabel("Employee reflection").fill(reflectionText);
    await page.getByRole("button", { name: "Submit reflection", exact: true }).click();
    await expect(page.getByText("Reflection recorded.", { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Employee reflection")).toHaveValue(reflectionText);
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "manager@ceac.local.test", { width: 1280, height: 900 });
    await go(page, "Performance & development");
    await expect(page.getByRole("heading", { name: "Reviews & development", exact: true })).toBeVisible();
    const staffCase = page.locator(".performance-case-row").filter({ hasText: "Staff Fixture" });
    await expect(staffCase).toBeVisible();
    await staffCase.click();
    await expect(page.getByText(reflectionText, { exact: true })).toBeVisible();

    await page.getByLabel("Manager assessment").fill(assessmentText);
    await page.getByRole("button", { name: "Record assessment", exact: true }).click();
    await expect(page.getByText("Manager assessment recorded.", { exact: true })).toBeVisible();

    await page.getByLabel("Review conversation record").fill(conversationText);
    await page.getByRole("button", { name: "Record conversation", exact: true }).click();
    await expect(page.getByText("Review conversation recorded.", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Create plan", exact: true }).click();
    let dialog = page.getByRole("dialog");
    await dialog.getByLabel("Development focus").fill(planFocus);
    await dialog.getByLabel("Development desired outcome").fill(planOutcome);
    await dialog.getByRole("button", { name: "Continue", exact: true }).click();
    await dialog.getByLabel("Development next steps").fill(planSteps);
    await dialog.getByRole("button", { name: "Continue", exact: true }).click();
    await dialog.getByLabel("Development start").fill(iso(today));
    const target = new Date(today.getTime() + 30 * 86400000);
    await dialog.getByLabel("Development target").fill(iso(target));
    await dialog.getByLabel("Development change reason").fill("Acceptance development plan agreed in review");
    await dialog.getByRole("button", { name: "Record development plan", exact: true }).click();
    await expect(page.getByText("Development plan recorded.", { exact: true })).toBeVisible();

    await page.getByLabel("Feedback type").selectOption("guidance");
    await page.getByLabel("Visible feedback").fill(feedbackText);
    await page.getByRole("button", { name: "Record feedback", exact: true }).click();
    await expect(page.getByText("Visible feedback recorded.", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Mark as shared", exact: true }).click();
    await expect(page.getByText("Review marked shared.", { exact: true })).toBeVisible();

    await page.reload();
    const reloadedCase = page.locator(".performance-case-row").filter({ hasText: "Staff Fixture" });
    await reloadedCase.click();
    await expect(page.locator(".performance-narrative p").filter({ hasText: assessmentText }).first()).toBeVisible();
    await expect(page.getByText(planFocus, { exact: true })).toBeVisible();
    await expect(page.getByText(feedbackText, { exact: true })).toBeVisible();
    await page.screenshot({ path: "test-artifacts/stage7-performance-manager.png", fullPage: true });
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "staff@ceac.local.test", { width: 390, height: 844 });
    await page.locator(".tabs").getByRole("button", { name: "Me", exact: true }).click();
    await page.getByRole("button", { name: /Reviews & development/ }).click();
    await expect(page.getByText(assessmentText, { exact: true })).toBeVisible();
    await expect(page.getByText(conversationText, { exact: true })).toBeVisible();
    await expect(page.getByText(planFocus, { exact: true })).toBeVisible();
    await expect(page.getByText(feedbackText, { exact: true })).toBeVisible();

    await page.getByLabel("Review response").fill(staffReply);
    await page.getByRole("button", { name: "Record response", exact: true }).first().click();
    await expect(page.getByText("Your response was recorded.", { exact: true })).toBeVisible();

    const feedbackCard = page.locator(".performance-feedback-card").filter({ hasText: feedbackText });
    await feedbackCard.getByRole("button", { name: "Respond", exact: true }).click();
    await feedbackCard.getByLabel("Feedback response").fill(feedbackReply);
    await feedbackCard.getByRole("button", { name: "Record response", exact: true }).click();
    await expect(page.getByText("Your feedback response was recorded.", { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByText(staffReply, { exact: true })).toBeVisible();
    await expect(page.getByText(feedbackReply, { exact: true })).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "Stage 7 Staff review overflowed the 390px viewport").toBeLessThanOrEqual(1);
    await page.screenshot({ path: "test-artifacts/stage7-performance-staff-mobile.png", fullPage: true });
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "admin@ceac.local.test", { width: 1280, height: 900 });
    await go(page, "Performance & development");
    await page.getByText(cycleName, { exact: true }).first().click();
    await page.getByRole("button", { name: "Close selected period", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Review period close reason").fill("Acceptance Stage 7 review period completed");
    await dialog.getByRole("button", { name: "Close review period", exact: true }).click();
    await expect(page.getByText("Review period closed.", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText("Closed", { exact: true }).first()).toBeVisible();
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "exec@ceac.local.test", { width: 1280, height: 900 });
    await page.goto("/?tab=performance");
    await expect(page.getByRole("heading", { name: "Reviews & development", exact: true })).toHaveCount(0);
    await context.close();
  }
});

test("Stage 8 Learning publishes structured learning and preserves factual completion", async ({ browser }) => {
  test.setTimeout(180000);
  const courseTitle = "Acceptance Stage 8 Learning";
  const courseSummary = "A practical course used to verify structured learning.";
  const moduleTitle = "Acceptance required module";
  const resourceTitle = "Acceptance learning resource";
  const assignmentReason = "Acceptance learning for Staff Fixture";

  {
    const { context, page } = await openAs(browser, "admin@ceac.local.test", { width: 1280, height: 900 });
    await go(page, "Learning");
    await expect(page.getByRole("heading", { name: "Learning", exact: true })).toBeVisible();
    await expect(page.getByText(/does not turn learning activity into a skill, performance or potential score/i)).toBeVisible();

    await page.getByRole("button", { name: "Create course", exact: true }).click();
    let dialog = page.getByRole("dialog");
    await dialog.getByLabel("Learning course title").fill(courseTitle);
    await dialog.getByLabel("Learning course summary").fill(courseSummary);
    await dialog.getByLabel("Learning course minutes").fill("30");
    await dialog.getByRole("button", { name: "Create draft course", exact: true }).click();
    await expect(page.getByText("Draft course created.", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Add module", exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Learning module title").fill(moduleTitle);
    await dialog.getByLabel("Learning module summary").fill("One required module with one reviewed resource.");
    await dialog.getByLabel("Learning module minutes").fill("30");
    await dialog.getByRole("button", { name: "Add module", exact: true }).click();
    await expect(page.getByText("Course module added.", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Add resource", exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Learning resource type").selectOption("link");
    await dialog.getByLabel("Learning resource title").fill(resourceTitle);
    await dialog.getByLabel("Learning resource URL").fill("https://example.com/stage8-learning");
    await dialog.getByRole("button", { name: "Add resource", exact: true }).click();
    await expect(page.getByText("Learning resource added.", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Publish course", exact: true }).click();
    await expect(page.getByText("Course published.", { exact: true })).toBeVisible();
    await expect(page.getByText("Published", { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: "Create assignment rule", exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Learning target kind").selectOption("person");
    await dialog.getByLabel("Learning target person").selectOption({ label: "Staff Fixture" });
    await dialog.getByLabel("Learning due days").fill("14");
    await dialog.getByLabel("Learning assignment reason").fill(assignmentReason);
    await dialog.getByRole("button", { name: "Create assignment rule", exact: true }).click();
    await expect(page.getByText("Learning assignment rule created.", { exact: true })).toBeVisible();
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "staff@ceac.local.test", { width: 390, height: 844 });
    await page.locator(".tabs").getByRole("button", { name: "Learning", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Learning", exact: true })).toBeVisible();
    await expect(page.getByText(courseTitle, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(moduleTitle, { exact: true })).toBeVisible();
    await expect(page.getByText(resourceTitle, { exact: true })).toBeVisible();
    await expect(page.getByText("0 of 1 required modules complete", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Complete module", exact: true }).click();
    await expect(page.getByText("Module completion recorded.", { exact: true })).toBeVisible();
    await expect(page.getByText("1 of 1 required modules complete", { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByText(courseTitle, { exact: true }).first()).toBeVisible();
    await expect(page.getByText("1 of 1 required modules complete", { exact: true })).toBeVisible();

    await page.locator(".learning-mode-tabs").getByRole("button", { name: "Completed learning", exact: true }).click();
    await expect(page.getByText(courseTitle, { exact: true })).toBeVisible();
    await expect(page.getByText("CEAC OS course", { exact: true })).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "Stage 8 Staff learning overflowed the 390px viewport").toBeLessThanOrEqual(1);
    await page.screenshot({ path: "test-artifacts/stage8-learning-staff-mobile.png", fullPage: true });
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "manager@ceac.local.test", { width: 1280, height: 900 });
    await go(page, "Learning");
    await page.locator(".learning-mode-tabs").getByRole("button", { name: "Team learning", exact: true }).click();
    const staffLearning = page.locator(".learning-assignment-card").filter({ hasText: "Staff Fixture" });
    await expect(staffLearning).toBeVisible();
    await expect(staffLearning.getByText(courseTitle, { exact: true })).toBeVisible();
    await expect(staffLearning.getByText("Completed", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create course", exact: true })).toHaveCount(0);
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "admin@ceac.local.test", { width: 1280, height: 900 });
    await go(page, "Learning");
    await page.locator(".learning-mode-tabs").getByRole("button", { name: "Progress", exact: true }).click();
    const staffLearning = page.locator(".learning-assignment-card").filter({ hasText: "Staff Fixture" });
    await expect(staffLearning).toBeVisible();
    await staffLearning.click();
    await expect(page.getByText("1 of 1 required modules complete", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Correct completion", exact: true })).toBeVisible();
    await page.screenshot({ path: "test-artifacts/stage8-learning-admin.png", fullPage: true });
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "exec@ceac.local.test", { width: 1280, height: 900 });
    await page.goto("/?tab=learning");
    await expect(page.getByRole("heading", { name: "Learning", exact: true })).toHaveCount(0);
    await context.close();
  }
});

test("Stage 9 Workforce keeps schedule, session and leave context factual across roles", async ({ browser }) => {
  test.setTimeout(180000);
  const dayTypeName = "Acceptance working day";
  const scheduleReason = "Acceptance Stage 9 workforce schedule";
  const weekday = ["sun","mon","tue","wed","thu","fri","sat"][new Date().getDay()];

  {
    const { context, page } = await openAs(browser, "admin@ceac.local.test", { width: 1280, height: 900 });
    await go(page, "Workforce");
    await expect(page.getByRole("heading", { name: "Workforce", exact: true })).toBeVisible();
    await expect(page.getByText(/No session recorded.*not an automatic absence/i)).toBeVisible();

    await page.getByRole("tab", { name: "Schedules & policy", exact: true }).click();
    await page.getByRole("button", { name: "Add day type", exact: true }).click();
    let dialog = page.getByRole("dialog");
    await dialog.getByLabel("Day type name").fill(dayTypeName);
    await dialog.getByLabel("Day type description").fill("Acceptance day with recorded session context");
    await dialog.getByRole("button", { name: "Record day type", exact: true }).click();
    await expect(page.getByText("Day type recorded.", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Record schedule", exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Schedule person").selectOption("31000000-0000-4000-8000-000000000001");
    await dialog.getByLabel("Schedule weekday").selectOption(weekday);
    await dialog.getByLabel("Schedule day type").selectOption({ label: dayTypeName });
    await dialog.getByLabel("Schedule reason").fill(scheduleReason);
    await dialog.getByRole("button", { name: "Record schedule", exact: true }).click();
    await expect(page.getByText("Workforce schedule recorded.", { exact: true })).toBeVisible();

    await page.getByRole("tab", { name: "Today", exact: true }).click();
    const staffCard = page.locator(".workforce-person").filter({ hasText: "Staff Fixture" });
    await expect(staffCard).toBeVisible();
    await expect(staffCard.getByText(dayTypeName, { exact: true })).toBeVisible();
    await expect(staffCard.getByText("No session recorded", { exact: true })).toBeVisible();
    await page.screenshot({ path: "test-artifacts/stage9-workforce-admin.png", fullPage: true });
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "manager@ceac.local.test", { width: 1280, height: 900 });
    await go(page, "Workforce");
    await expect(page.getByRole("heading", { name: "Workforce", exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Schedules & policy", exact: true })).toHaveCount(0);
    await page.getByRole("tab", { name: "Corrections", exact: true }).click();
    await expect(page.getByRole("button", { name: "Record correction", exact: true })).toHaveCount(0);
    await context.close();
  }

  {
    const { context, page } = await openAs(browser, "staff@ceac.local.test", { width: 390, height: 844 });
    await page.locator(".tabs").getByRole("button", { name: "Me", exact: true }).click();
    await page.getByRole("button", { name: /My workforce context/ }).click();
    await expect(page.getByRole("heading", { name: "Workforce", exact: true })).toBeVisible();
    await expect(page.getByText("Staff Fixture", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Manager Fixture", { exact: true })).toHaveCount(0);
    await expect(page.getByText(dayTypeName, { exact: true }).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "Stage 9 Staff workforce overflowed the 390px viewport").toBeLessThanOrEqual(1);
    await page.screenshot({ path: "test-artifacts/stage9-workforce-staff-mobile.png", fullPage: true });
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
  const peopleMain = page.getByRole("main");
  await expect(peopleMain.getByText("Protected HR", { exact: true })).toBeVisible();
  await expect(peopleMain.getByText("Awaiting CEAC salary structure", { exact: true })).toBeVisible();
  await expect(page.getByText(/entitlement not configured/i)).toBeVisible();
  await expect(page.getByText("Employment record", { exact: true })).toBeVisible();
  await expect(page.getByText("Employment history", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Record change", exact: true }).click();
  const employmentDialog = page.getByRole("dialog");
  await expect(employmentDialog.locator(".h2").filter({ hasText: /^Record employment change$/ })).toBeVisible();
  await employmentDialog.getByLabel("Change").selectOption("working_pattern_changed");
  await employmentDialog.getByLabel("Working pattern", { exact: true }).selectOption("flexible");
  await employmentDialog.getByLabel("Reason / context").fill("Acceptance employment history change");
  await employmentDialog.getByRole("button", { name: "Record employment change", exact: true }).click();
  await expect(page.getByText("Working pattern changed", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Acceptance employment history change", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "← All people", exact: true }).click();
  await page.getByLabel("Find a person").fill("Staff Fixture");
  await page.getByRole("button", { name: /Staff Fixture/ }).click();
  await expect(page.getByText("Acceptance employment history change", { exact: true })).toBeVisible();

  await go(page, "Employee lifecycle");
  await expect(page.getByRole("heading", { name: "Employee lifecycle", exact: true })).toBeVisible();
  await page.getByLabel("Lifecycle employee").selectOption("31000000-0000-4000-8000-000000000006");
  await page.getByLabel("Lifecycle type").selectOption("onboarding");
  await page.getByLabel("Lifecycle reason").fill("Acceptance onboarding lifecycle");
  await page.getByRole("button", { name: "Start lifecycle case", exact: true }).click();
  await expect(page.getByText("Employee lifecycle case started.", { exact: true })).toBeVisible();
  for (let step = 1; step <= 4; step += 1) {
    await page.getByLabel("Lifecycle completion note").fill("Acceptance lifecycle step " + step);
    await page.getByRole("button", { name: "Complete current step", exact: true }).click();
    await expect(page.getByText("Lifecycle step completed.", { exact: true })).toBeVisible();
  }
  await page.reload();
  await expect(page.getByText(/Same Unit Fixture · Onboarding/).first()).toBeVisible();
  await expect(page.getByText(/Completed · effective/).first()).toBeVisible();

  await go(page, "Protected HR");
  await expect(page.getByRole("heading", { name: "Protected HR", exact: true })).toBeVisible();
  await page.getByLabel("Protected HR employee").selectOption("31000000-0000-4000-8000-000000000001");
  await page.getByLabel("Protected HR record type").selectOption("identifier");
  await page.getByLabel("Identifier type").fill("Acceptance ID");
  await page.getByLabel("Identifier value").fill("ACCEPTANCE-001");
  await page.getByLabel("Protected HR reason").fill("Acceptance protected HR record");
  await page.getByRole("button", { name: "Save protected record", exact: true }).click();
  await expect(page.getByText("Protected HR record saved.", { exact: true })).toBeVisible();
  await expect(page.getByText(/Acceptance ID · Active/).first()).toBeVisible();
  await expect(page.getByText("ACCEPTANCE-001", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("ACCEPTANCE-001", { exact: true })).toBeVisible();

  await go(page, "Workflows");
  await expect(page.getByRole("heading", { name: "Workflows", exact: true })).toBeVisible();
  const employmentWorkflow = page.getByRole("button", { name: /Review employment change/ }).first();
  await expect(employmentWorkflow).toBeVisible();
  await employmentWorkflow.click();
  await page.getByLabel("Workflow review note").fill("Acceptance workflow review");
  await page.getByRole("button", { name: "Complete step", exact: true }).click();
  await expect(page.getByText("Workflow step completed.", { exact: true })).toBeVisible();

  await go(page, "Authority");
  await expect(page.getByRole("heading", { name: "Authority", exact: true })).toBeVisible();
  await page.getByLabel("Authority person").selectOption({ label: "Staff Fixture · staff@ceac.local.test" });
  await page.getByLabel("Capability", { exact: true }).selectOption("performance.admin");
  await page.getByLabel("Grant reason").fill("Acceptance temporary performance authority");
  await page.getByRole("button", { name: "Grant capability", exact: true }).click();
  await expect(page.getByText("Capability granted.", { exact: true })).toBeVisible();
  await page.getByLabel("Revocation reason").fill("Acceptance authority cleanup");
  await page.getByRole("button", { name: "Revoke", exact: true }).click();
  await expect(page.getByText("Capability revoked.", { exact: true })).toBeVisible();

  await go(page, "Policies & rules");
  await expect(page.getByRole("heading", { name: "Policies & rules", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Work quiet days/ }).click();
  await page.getByLabel("Policy rule value").fill("6");
  await page.getByLabel("Policy reason").fill("Acceptance policy rule version");
  await page.getByRole("button", { name: "Record new version", exact: true }).click();
  await expect(page.getByText("Policy rule recorded.", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /Work quiet days/ }).click();
  await expect(page.getByText("Acceptance policy rule version", { exact: true })).toBeVisible();

  await go(page, "Integrations");
  await expect(page.getByRole("heading", { name: "Integrations", exact: true })).toBeVisible();
  await page.getByLabel("Integration connector name").fill("Acceptance Connector");
  await page.getByLabel("Integration connector key").fill("acceptance-connector");
  await page.getByRole("button", { name: "Create connector", exact: true }).click();
  await expect(page.getByText("Connector created.", { exact: true })).toBeVisible();
  const connectorRow = page.locator(".row").filter({ hasText: "Acceptance Connector" }).first();
  await connectorRow.getByRole("button", { name: "Enable", exact: true }).click();
  await expect(page.getByText("Connector enabled.", { exact: true })).toBeVisible();
  await page.getByLabel("Integration subscription connector").selectOption({ label: "Acceptance Connector" });
  await page.getByLabel("Integration subscription event").selectOption("policy.rule_changed");
  await page.getByRole("button", { name: "Create subscription", exact: true }).click();
  await expect(page.getByText("Event subscription created.", { exact: true })).toBeVisible();

  await go(page, "Audit");
  await expect(page.getByRole("heading", { name: "Audit", exact: true })).toBeVisible();
  await expect(page.getByText("Recent changes", { exact: true })).toBeVisible();
  await expect(page.getByText(/Employment (Record · Update|History · Insert)/).first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Audit", exact: true })).toBeVisible();

  await go(page, "Events");
  await expect(page.getByRole("heading", { name: "System events", exact: true })).toBeVisible();
  await expect(page.getByText("Event stream", { exact: true })).toBeVisible();
  await expect(page.getByText("Employment · Changed", { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "System events", exact: true })).toBeVisible();

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
  const destinations = ["Home", "Strategy", "Delivery", "Workload", "People", "Employee lifecycle", "Protected HR", "Attendance", "Reports", "Units", "Projects", "Calendar", "Cost", "Finance", "Audit", "Events", "Workflows", "Authority", "Policies & rules", "Integrations", "Settings"];

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
    ["manager@ceac.local.test", ["Home", "Work", "Team", "Projects", "Delivery", "Workload"]],
    ["admin@ceac.local.test", ["Home", "People", "Attendance", "Reports"]],
    ["exec@ceac.local.test", ["Home", "Delivery", "Announcements", "Me"]],
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
