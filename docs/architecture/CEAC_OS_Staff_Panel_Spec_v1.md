# CEAC OS — Staff Panel Spec v1

**Panel 1 of 4.** Companion to `CEAC_OS_Architecture_v1.md`.
**User:** mid-level staff member in a CEAC unit.
**Device:** phone first. Desktop is the same layout, wider.
**Reference feel:** Emerald OS / BlossomBox — neat, calm, few things per screen. Explicitly **not** Monday.com.

---

## 1. Design rules for this panel

1. **Four destinations, no more.** Home · Work · Record · Me. Anything that doesn't belong to one of them doesn't belong in v1.
2. **One primary action per screen.** The staff member should never wonder what to do next.
3. **Nothing comparative.** No rankings, no scores against colleagues, no leaderboards. Their own trend only.
4. **The checklist is the data entry.** Never ask a staff member to describe work they have already ticked off.
5. **Every disabled control explains itself.** "Start work to submit" — never a greyed button with no reason.
6. **Offline is a state, not an error.** *Saved — will sync* is the message. Never a failure toast.
7. **No number without a way in.** Even on the staff panel, a count opens to the rows.

### Navigation

Bottom bar, four tabs, always visible:

```
[ Home ]   [ Work ]   [ Record ]   [ Me ]
```

Badge counts on Home (attention items) and Work (returned work only — never on total tasks, which would nag).

---

## 2. The Work Session bar — the most important component

Persistent, pinned below the header on every screen. It is the gate for everything.

### States

| State | Appearance | Actions |
|---|---|---|
| **Not started** | Neutral. "Not working" + primary **Start Work** button | Start Work |
| **Starting** | Capturing location, brief spinner | — |
| **Active** | Accent bar, elapsed time counting, task name if session is task-bound | End Work · Switch task |
| **Idle prompt** | Amber. "Still working?" | Yes, continue · End session |
| **Idle-ended** | Neutral with note: "Session ended at 14:20 — reopen if you were still working" | Reopen · Start new |
| **Offline** | Active appearance + small cloud icon: *saved — will sync* | End Work (also queued) |

### Start Work flow

1. Tap **Start Work**
2. Choose context:
   - **At the office** — location captured once, geofence checked
   - **Working off-site** — must select the task being worked on; location captured once and attached to that task
3. Session opens. `started_at`, `device_time`, `server_received_at`, `lat`, `lng`, `ip` recorded.

Off-site sessions are bound to a task by design: **location attaches to work, not to the person.** Staff should be told this in onboarding, and the screen should say it: *"We record where you started this job. We do not track you during the day."*

### Idle handling

After 30 minutes with no interaction, prompt *Still working?*

- **No response within 10 minutes** → session marked `idle_ended`, `ended_at` = last activity timestamp. **Not logged out.**
- **Reopen** → new session linked to the previous one, flagged `claimed_continuation`, visible to the manager.

> This exists because a media editor inside Premiere for three hours is not idle. Recording that as thirty minutes is the system lying about someone who worked, and it is the fastest way to lose staff trust.

### What the gate covers

| Available without a session | Requires an active session |
|---|---|
| View assignments and detail | Tick checklist items |
| Read messages | Submit work |
| View projects, record, profile | Attach files or links |
| Apply for leave | Mark a task complete |
| Read announcements | Respond to returned work |

**Forgotten session:** if a staff member attempts to submit with no session, do not refuse. Show: *"You don't have a work session open. Submit anyway?"* → accepted, stored with `outside_session = true`, flagged to the manager. **Flag, never block.**

---

## 3. Home

The answer to *what do I need to do right now.*

```
Good morning, Kwame
Media and Technical · Thursday 4 September

┌─────────────────────────────────────┐
│  Not working          [ Start Work ]│
└─────────────────────────────────────┘

NEEDS YOUR ATTENTION            (3)
  ↩  Conference opener — returned
     "Colour grade is too warm, see note"
  💬 Ama replied on Sunday livestream
  🕐 Social cutdowns — overdue 2 days

DUE TODAY                        (2)
  Sunday service edit        5:00 PM
  Upload week 34 stills      6:00 PM

THIS WEEK
  4 active  ·  2 submitted  ·  1 awaiting review

ANNOUNCEMENTS                    (1)
  Staff meeting moved to Friday 9am
```

### Rules

- **Attention block is always first** and disappears entirely when empty (no "nothing to see here" clutter — the section is simply absent).
- Attention items are: returned work, unread messages on your tasks, overdue tasks, leave decision.
- **Due Today** shows only today and overdue. Not the whole week — that lives in Work.
- **This Week** counts are tappable, opening Work pre-filtered.
- Announcements: unit-level and organisation-level, latest three, tappable to full text.

### Empty state

If a staff member has no assigned work: *"No tasks assigned yet. Your manager will assign work here."* — plus their unit and manager name so they know who to ask.

---

## 4. Work

### Work list

Filter chips: **Active** (default) · Submitted · Returned · Approved · All

Grouped by project, collapsed by default when more than one project. Loose tasks not attached to a project group under **Other work**.

Task row:
```
Sunday service edit                    ● In progress
Project: September Services  ·  Due today 5:00 PM
```

Status colours: assigned (neutral) · in progress (blue) · submitted (amber) · returned (red) · approved (green).

### Task detail — the core screen

This is where guidance, execution and capture happen in one place.

```
← Back

SUNDAY SERVICE EDIT
Media and Technical  ·  Assigned by Ama Boateng
Due Thursday 4 Sep, 5:00 PM              ● In progress

PART OF
  Project: September Services
  Objective: Every service published within 48 hours

WHY THIS MATTERS
  The edit goes to the online congregation who could
  not attend. Late publishing means people miss the
  week's message entirely.

WHAT TO DO
  1. Pull raw footage from the Sunday folder
  2. Cut to the sermon start and end
  3. Colour grade to house profile
  4. Add lower thirds and closing card
  5. Export at 1080p, upload to Drive

COMPLETION CHECKLIST                    2 of 5
  ☑ Footage pulled and synced
  ☑ Sermon cut to length
  ☐ Colour graded
  ☐ Lower thirds and closing card added
  ☐ Exported and uploaded

RESOURCES
  📄 House colour profile
  📄 Lower-thirds template
  📁 Sunday raw footage (Drive)

DISCUSSION                              (2)
  Ama: Use the new closing card from August
  You: Noted

┌─────────────────────────────────────┐
│      Submit for review               │
└─────────────────────────────────────┘

ACTIVITY
  Assigned by Ama — Mon 09:14
  Accepted — Mon 09:40
  Started work — Thu 08:02
```

### Rules

- **"Why this matters" and "What to do" are populated by the manager at assignment** and stored on the task. If a task is recurring, they are inherited from the template. This is the training layer — no separate module.
- **Checklist ticks are individually timestamped** and linked to the active session. Ticking is the data entry.
- Checklist progress drives task status: first tick moves `assigned → in_progress`.
- **Submit is disabled until every checklist item is ticked**, with the reason shown: *"Complete the checklist to submit."* Manager can mark a task as allowing partial submission where appropriate.
- Discussion thread is scoped to this task. Messages appear on the manager's panel in real time.
- Activity log is read-only and shows every state change with actor and timestamp.

### Returned work

When returned, the reviewer's comment sits **above the checklist**, in a red-bordered block, unmissable:

```
⚠ RETURNED BY AMA — Thu 4 Sep, 6:12 PM
  "Colour grade is too warm. Match the August
   profile, not the default. Everything else is good."
```

Checklist items the reviewer flagged are un-ticked automatically. `first_time_approved` is set false permanently — this is the quality signal that feeds appraisal.

### Submission flow

```
SUBMIT — Sunday service edit

Note to your manager (optional)
  ┌───────────────────────────────┐
  │ Exported at 1080p. File is    │
  │ 3.2GB so I've linked it.      │
  └───────────────────────────────┘

Attach your work
  ( ) Upload a file
  (•) Paste a link
      https://drive.google.com/...

  ⓘ Large files (over ~100MB) — paste a link
    instead of uploading

┌─────────────────────────────────────┐
│           Submit                     │
└─────────────────────────────────────┘
```

- **Upload path:** file goes through the app → Edge Function → CEAC Drive at `Department/Year/Project/Task`. Row stores Drive file ID, link, name, type, size.
- **Link path:** URL stored with the same metadata. No transfer.
- On submit: task → `submitted`, manager notified in-app and by Telegram.
- **Offline:** submission queued locally, note and link preserved, shown as *pending sync*. File uploads queue but only flush on reconnect.

---

## 5. Record

The staff member's own evidence. This is the screen that earns their trust in the system — what they will want in front of them at appraisal.

```
MY RECORD                    September ▾

WORK
  Tasks completed        14
  Submitted on time      12 of 14
  Approved first time    11 of 14
  Currently active        4

TIME
  Days worked            18
  Hours on platform      96h 20m
  Average start          08:11

PROJECTS
  September Services         6 tasks  ·  ongoing
  Youth Convention Media     5 tasks  ·  completed
  Studio Reorganisation      3 tasks  ·  ongoing

OBJECTIVES
  Every service published within 48 hours
  ▓▓▓▓▓▓▓▓░░  8 of 10 services

FEEDBACK FROM YOUR MANAGER
  Ama Boateng — 28 August
  "Turnaround has improved a lot this month.
   Watch the colour consistency across the series."

TRAINING COMPLETED
  ✓ House brand standards
  ✓ Livestream failover procedure
```

### Rules

- **Every count is tappable** and opens the underlying rows — the 14 completed tasks, the 2 that were late, the 18 days worked.
- Month selector allows looking back. Default is current month.
- **Hours on platform** carries a one-line explanation on tap: *"Time with a work session open. This is a record of activity, not a basis for pay."* Set the expectation in the product, not just in the proposal.
- **Nothing comparative.** No unit average, no ranking, no "you are 3rd of 8."
- Feedback is manager-written and visible to the staff member. Nothing about a person is recorded that they cannot see.

---

## 6. Me

Everything personal and administrative. Grouped, mostly read-only, with three actions.

```
KWAME ASANTE
Video Editor  ·  Media and Technical
Manager: Ama Boateng
Joined: 12 March 2023

PROFILE
  Personal information            →
  Emergency contact               →

EMPLOYMENT
  Contract: Permanent
  Documents (4)                   →
  Ministry policies               →

LEAVE
  Annual leave      12 of 20 remaining
  [ Apply for leave ]
  Pending: 2 days, 15–16 Sep — awaiting Ama

WELFARE
  [ Make a welfare request ]
  History (2)                     →

PAY
  Payslips                        →
  August 2026 · July 2026 · June 2026

SETTINGS
  Telegram          ✓ Connected
  Notifications                   →
  Install app to home screen      →
```

### Rules

- **Leave application:** type · dates · reason · submit. Routes to the unit manager; escalates to Admin & HR per policy. Status visible until resolved. **Not gated by a work session** — a sick person cannot start work to apply for sick leave.
- **Payslips** are read-only PDFs generated by Admin & HR. Staff never see salary structure or deductions logic, only their own payslip.
- **Telegram connection:** one-tap deep link that binds `telegram_user_id` to the account. Until connected, show a prominent prompt — this is how they receive notifications, and on iPhone it is the *only* reliable way.
- Personal information is editable by the staff member; job title, contract and unit are not (Admin & HR only).

---

## 7. Offline behaviour

| Action | Offline | On reconnect |
|---|---|---|
| Start Work | Queued with device time + GPS | Synced; server time recorded alongside |
| Tick checklist | Written locally, ticks preserved with timestamps | Flushed in order |
| Submit (link) | Queued, shows *pending sync* | Sent, manager notified |
| Submit (upload) | Queued; file held locally | Uploaded to Drive, then row created |
| Apply for leave | Queued | Sent |
| Read anything | Served from cache, with *last updated* time | Refreshed |

Sync happens **on app open** and on regaining connection. Never rely on iOS background sync.

A small persistent chip shows `3 items waiting to sync` when the queue is non-empty. Tapping it lists them.

---

## 8. Notifications

| Event | In-app | Telegram |
|---|---|---|
| Task assigned to you | ✓ | ✓ |
| Work returned | ✓ | ✓ |
| Message on your task | ✓ | ✓ |
| Leave approved or declined | ✓ | ✓ |
| Task due tomorrow | ✓ | ✓ |
| Task overdue | ✓ | ✓ |
| Payslip available | ✓ | ✓ |

Telegram is the delivery guarantee, not a duplicate. One-tap actions from the notification where sensible (Start Work, mark done).

---

## 9. Test gates

Do not move to the manager panel until all of these pass on a real phone.

1. **Gate holds** — with no session, submit controls are disabled and explain why; assignments remain readable.
2. **Offline round trip** — airplane mode → Start Work → tick three checklist items → submit with a link → reconnect → all rows present in Supabase in correct order, with both device and server timestamps.
3. **Idle does not lie** — leave the app untouched for 45 minutes → session shows `idle_ended` at last activity, not logged out; reopening records a claimed continuation visible to the manager.
4. **Outside-session submission** — submit with no session → accepted, flagged, visible to manager.
5. **Return loop** — manager returns work → comment appears above the checklist, flagged items un-ticked, `first_time_approved` false.
6. **Drive write** — upload a file → lands in `Department/Year/Project/Task` in CEAC's Drive → row holds a working link.
7. **RLS** — a staff member cannot read another staff member's tasks, record, or payslips by any route.
8. **Install** — PWA installs from a Telegram link and opens full screen with no browser chrome.

---

## 10. Open items for this panel

| # | Question | Affects |
|---|---|---|
| 1 | Idle threshold — is 30 minutes right for CEAC's work patterns? | Session integrity |
| 2 | Can staff create their own tasks, or only accept assigned ones? | You mentioned staff adding tasks agreed in meetings — needs a decision. Recommend: yes, but flagged `self_assigned` and requiring manager acknowledgement. |
| 3 | Does a manager also use this panel for their own work? | Likely yes given unit sizes — the two panels must coexist for one person |
| 4 | Welfare request types and routing | Welfare module |
| 5 | Leave policy — entitlement, approval chain, escalation | Leave module |

---

*Staff Panel Spec v1. Next: Manager Panel — blocked on headcount per unit and whether managers submit work upward.*
