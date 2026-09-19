# CEAC OS — Architecture v4

**Client:** CEAC (church office, Ghana) · ~30 staff · 16 units · 4 levels
**Built by:** The Standard Institute — The Standard Solution
**Supersedes:** v3, v2, v1. Panel specs (Staff, Manager, Admin & HR, Group Pastor) remain current beneath this document.
**Stack:** Lovable (React front end, installed as a PWA) · Supabase (Postgres, Auth, RLS, Edge Functions, pg_cron, Realtime, Storage) · Google Drive API · Telegram Bot API · Claude API

### What changed from v3

| # | Change | Why |
|---|---|---|
| 1 | **§3 Design for the person who has never done this before** — new governing section | The system must teach HR practice, not assume it |
| 2 | **§4 Plain-language translation table** | "Accrual", "pro-rata", "statutory" are barriers, not vocabulary |
| 3 | **§13 Payroll rewritten** — guided run, validation pass, reversal by adjustment | CEAC runs payroll alone, permanently |
| 4 | **§14 Reversibility** — new section, applies system-wide | Errors made safe rather than prevented |
| 5 | **§15 Explain this** — new section | Every number, flag and threshold accounts for itself |
| 6 | **Guided flows replace forms** for anything over three steps | A blank form is where a new administrator gets stuck |
| 7 | **Handover readiness test** (§21.4) | She runs one cycle alone before the build is signed off |

---

## 1. What this is

A **staff work platform** for the CEAC office.

> The place where CEAC's office staff do their work, submit it, and get it reviewed — so leadership sees what was actually achieved rather than what people remember at month end.

Not an HR system that records employees. Not a task app. The join of the two: **the work lives on the platform, and the personnel record is built from it.**

### The second promise, equal to the first

> **CEAC runs this system without TSI. Permanently.**

Not "with training available". Not "with a support line". The administrator opens it on a Monday, does the month's work, and never needs to ask anyone anything. If she cannot, the build is not finished, regardless of what it does.

### Out of scope for v1

| Excluded | Reason |
|---|---|
| PCF / fellowship-leader portal | Removed by Admin & HR — volunteers will not sustain it |
| Tithe receipting, member giving records | Belongs to Finance |
| General-purpose chat | Threads attached to work only |
| Manager-posted financial entries | Manager finance views are read-only |
| Video training library | Guidance is attached to the work itself |
| Continuous location tracking | Location captured at session start only |
| Admin & HR self-assessment | Between her and the Group Pastor |
| **Automatic payroll approval** | A human looks at thirty people's pay before it goes out (§13.6) |

---

## 2. Locked principles

1. **Nothing is ever invented.** Every figure traces to a row submitted by a named person on a recorded date.
2. **Every number is clickable, and every number can explain itself** (§15).
3. **Presence, availability and output are three separate things.** None infers another.
4. **Flag, never block.** Anomalies surface as a conversation, never a verdict.
5. **Presence is audited against output.**
6. **Nobody reports anything twice.** Ticking a checklist *is* the data entry.
7. **The platform is the system of record.** Drive holds files; Telegram carries notifications.
8. **Telegram never writes final state.**
9. **Nothing comparative is shown to staff.**
10. **No composite performance score.**
11. **Nothing is recorded about a person that they cannot see.**
12. **Silence is never the failure mode** (§11).
13. **One reminder, one follow-up, then stop.**
14. **The platform writes only what it created.**
15. **The ministry's data belongs to the ministry.**
16. **Every accountability path terminates in a human review.**
17. **Assume no prior HR experience** (§3).
18. **Every mistake has a way back** (§14).

---

## 3. Design for the person who has never done this before

**This section governs every screen in the system. Where it conflicts with anything else, it wins.**

The administrator may be new to HR, new to payroll, new to software of this kind, or all three. The system's job is not to expose HR functionality — it is to make someone competent at HR administration who was not competent yesterday, and to make the work feel light rather than heavy.

### 3.1 The ten rules

**1 · Every screen says what it is for, in one line.**
Under the title, in plain words: *"This is where you check everyone's pay before it goes out."* Not a tooltip. Not help text behind an icon. Always visible.

**2 · The system proposes; the person confirms.**
Never a blank page. Payroll opens as a draft. Reports arrive pre-filled. A new staff record opens with sensible defaults already chosen. The work is checking, not composing.

**3 · Anything over three steps is a guided flow, not a form.**
One question per screen, a progress line, back always available, and nothing saved until the end. Applies to: running payroll, adding a staff member, setting up leave policy, changing a statutory rate, opening an appraisal cycle, closing the month.

**4 · Every consequential action says what will happen before it happens.**
> *Approving this run will issue 28 payslips and lock the figures. You can still make a correction afterwards — it will appear as a separate adjustment.*

**5 · Nothing is irreversible, and the way back is stated on the screen** (§14).

**6 · Plain English only. No HR jargon** (§4).

**7 · Show what is needed now; hide the rest.**
A new staff member needs six fields, not thirty. Everything else sits behind *Add more details*, which can be done later or never. Progressive disclosure everywhere.

**8 · No dead ends.**
Every error, empty state and warning includes the next action. Never *"No data found."* Always *"Nothing here yet. Add your first unit to get started."*

**9 · Explain on demand, never by default.**
Every figure and every flag carries a quiet *Why?* (§15). The screen stays clean for someone who knows; the answer is one tap away for someone who does not.

**10 · Calm, not congratulatory.**
Enjoyable means fast, clear and finished — not confetti. No streaks, no badges, no celebration copy. The reward is that the work is done and the person can see it is done.

### 3.2 Guided flows to build

| Flow | Steps |
|---|---|
| **Run payroll** | Check people → check changes → review flags → preview → approve (§13) |
| **Add a staff member** | Who they are → where they work → their contract → invite them |
| **Set up leave** | How much per year → does it carry over → who approves |
| **Change a statutory rate** | What is changing → from when → see the effect → confirm |
| **Open an appraisal cycle** | Who → what period → the evidence is assembled → send to managers |
| **Close the month** | What is outstanding → reports in → payroll done → generate the report up |

### 3.3 The first-week experience

The system opens on a **setup checklist**, not an empty dashboard. Six items, ticked as done, with the estimated time beside each:

```
Getting started                                  2 of 6 done
  ✓  Your units are set up                             16 units
  ✓  Your people are added                             28 people
  ☐  Set your leave policy                             about 5 minutes
  ☐  Confirm your SSNIT and PAYE rates                 about 5 minutes
  ☐  Invite your managers                              about 10 minutes
  ☐  Run a practice payroll (nothing is paid)          about 15 minutes
```

The checklist disappears once complete and can be reopened from Settings.

---

## 4. Language

### 4.1 Locked user-facing vocabulary

| Term | Meaning |
|---|---|
| **Start work / End work** | Opening and closing a work session. Never "clock in". |
| **Things to do** | Active tasks |
| **Completion checklist** | What proper completion looks like |
| **Submit for review** | Sending finished work to the manager |
| **Returned** | Work sent back with a comment. Never "rejected" or "failed". |
| **Weekly return** | A unit's periodic report |
| **Project close** | The manager's end-of-project submission |
| **Ministry objective** | Set by the Group Pastor |
| **Needs you** | The action queue |
| **Silence** | Units or projects past an inactivity threshold |
| **Hours on the platform** | Session time, always with *a record of activity, not a basis for pay* |
| **My record** | A staff member's own evidence |

### 4.2 Plain-language translation — NEW

HR jargon is a barrier for a new administrator. These words do not appear in the interface; the right-hand column does.

| Never write | Write instead |
|---|---|
| Accrual | Leave that builds up each month |
| Pro-rata | Worked out for part of the year |
| Statutory deductions | SSNIT and income tax |
| Gross / net | Before deductions / what they take home |
| Emolument, remuneration | Pay |
| Termination | When someone leaves |
| Onboarding | Adding a new staff member |
| Headcount | Number of staff |
| Attrition | Staff who left |
| Reconciliation | Checking two sets of figures match |
| Variance | The difference from last month |
| Compliance | Following the rules |
| Appraisal cycle | Review period |

### 4.3 Forbidden in UI copy

Score · ranking · leaderboard · streak · badge · points · any percentage attached to a person · "you missed" · "failed" · "violation" · any phrasing implying dishonesty · any comparison of one staff member to another.

Percentages permitted **only** against a stated denominator: *12 of 14 on time*, never *86% performance*.

---

## 5. Organisation model

### 5.1 Hierarchy
```
Group Pastor → Admin & HR → Managers / Unit Heads → Mid-level staff
```

### 5.2 Units (16)
PFCC · Cell Ministry · Church Ministry · HR & Admin · Media and Technical · OFTGP Secretariat · Children's Ministry · Welfare · Foundation School · Partnership · Sacrament and Ceremonies · Facility, Procurement and Logistics · Programs · First Timers and Salvation · Ministry Material · Front Desk · Finance

Several units are one person, who is both head and only doer. Every screen renders for a unit of one.

### 5.3 Day types
Editable per unit, never hard-coded.

| Day type | Behaviour |
|---|---|
| **Normal day** | Standard expectations and reminders |
| **Church day** (Wednesday) | Work ends 5:15pm. An early end is **not** a short day. Reminders stop at 5:00pm. |
| **Sunday** | Read-only for most units. **Media, Programs, Sacrament and Ceremonies are working** — their heaviest day. |
| **Convention week** | Normal deadlines suspended; expected output is the event. |

### 5.4 Authentication
**Invite by work email** — confirmed, CEAC staff use work email regularly. Admin invites managers; managers invite staff.

---

## 6. Core object model

```
MINISTRY OBJECTIVE        ← set by the Group Pastor
   └── PROJECT            ← manager-created, linked to a ministry objective
          └── OBJECTIVE   ← project-level, descriptive
                 └── TASK
                        ├── CHECKLIST ITEM
                        └── SUBMISSION → FILES → REVIEW → approved | returned
```

**The work loop:** manager assigns with context and checklist → staff accepts, starts work, executes → ticks checklist → submits → manager approves or returns → lands simultaneously in the weekly report, the person's record and the unit's numbers.

**Task origin:** manager-assigned · staff self-created (requires ≥1 checklist item, no approval, displayed separately) · GO-assigned to a manager only, stamped `assigned_by_go`.

**Objectives are descriptive.** Never compute a percentage against a sentence. Task progress (*8 of 10 tasks*) and manager-set status only.

**Project close** captures deliverables, objectives with status, cost, challenges, what to do differently — pre-filled where possible.

**Review mode.** `units.review_mode` = `task_review` (two or more people) or `weekly_return` (units of one, reviewed by Admin & HR). No unit reviews only itself.

**Stalled reviews.** A submission unreviewed after 5 working days appears on Admin's *Needs you* list, naming the manager and the age.

**Checklist integrity.** Submit is gated on a complete checklist; the defence against ticking-without-doing is the return loop and `first_time_approved`, watched at the Phase 1.5 gate.

---

## 7. Presence and work sessions

**Start Work / End Work** gates all submission actions. Leave application is never gated.

**Capture:** on-site → location at session start only, geofence ~150m. Off-site → session bound to a task. Offline → GPS works without data.

**Integrity:** idle prompt after 30 min, `idle_ended` at last activity, never silent logout · forgotten sessions accepted and flagged `outside_session` · store `device_time` and `server_received_at` · IP binding if CEAC has a static IP · plausibility checks server-side.

**Hours are evidence, not payroll.** Stated in the product.

---

## 8. Capacity check and estimate correction

`estimate_minutes` set by the manager at assignment, optional. Verdict in plain words:

> 47 hours assigned this week across three people. Their day types give about 90 hours. It fits.

Appears only when enough tasks carry an estimate. Correction factors derived after ~20–30 completed tasks per person per task type, applied at planning, **never in the appraisal pack**.

---

## 9. Submissions and Google Drive

Platform holds the record; Drive holds the file. Upload path pushes to Drive via Edge Function; link path stores the URL. Service account scoped to CEAC folders. Folders auto-created `Department → Year → Project → Task`. **Drive owned by CEAC's Workspace account.**

**Write-lane rule:** the platform writes only into folders it created, and never modifies, moves, renames or deletes any file it did not create. Enforced server-side by checking the target's parent chain.

---

## 10. Telegram layer

Closes the iOS push gap. Free, instant, universal. Direct official API, no middleware.

**Security:** verify `x-telegram-bot-api-secret-token` (401 on mismatch) and sender `telegram_user_id` against `telegram_links` (silent 200 on mismatch).

**Build:** notifications with inline buttons · plain-language queries from real rows · voice capture → draft → in-app confirmation · Monday digest · one-tap actions.

**Do not build:** ambient group listening · file submission via bot (20MB cap).

**Reminder discipline:** one reminder, one follow-up, then `raised_at_review` and it becomes a line on a screen. Day-type aware.

**Failure path:** in-app notification centre carries every notification independently · weekly `telegram-link-check` verifies each link still resolves · queue holds and heartbeat reports if the API fails.

---

## 11. Reliability

```
job_runs — id, job_name, scheduled_for, ran_at, status (ok|failed), error, meta
```

Every scheduled function writes a row on every run. **heartbeat** runs every 30 minutes; a job more than 15 minutes late or failed sends a plain notice to the admin Telegram naming the job.

| Job | Cadence |
|---|---|
| `reminder-queue` | 15 min, day-type aware |
| `weekly-digest` | Monday, per role |
| `report-window` | Opens/closes reporting periods |
| `silence-scan` | Daily |
| `stalled-reviews` | Daily |
| `payroll-draft` | 25th monthly (§13.2) |
| `telegram-link-check` | Weekly |
| `heartbeat` | 30 min |

Build the heartbeat in the same week as the first scheduled job.

---

## 12. Reporting engine

One engine, four scopes. Periods from a week to a year — a period is a filter, because every figure is a live query.

**Pre-fill principle:** reports arrive filled; the author confirms, corrects, adds narrative.

**Visual layer:** trend lines, comparison bars, composition donuts, activity heat maps, retrospective project timeline. **Every chart clickable to its rows.**

**Search:** Postgres full-text across projects, tasks, submissions, reports and closes, respecting RLS.

**AI interpretation:** one button, on demand, one Edge Function call, reads only submitted rows, never in the render path.

---

## 13. Payroll — built for someone who has never run one

CEAC runs payroll alone, permanently. TSI is not in the monthly loop and is not the fallback when something goes wrong.

### 13.1 What already made her independent

Statutory rates are **data she owns and edits**, not constants in code. Every run displays which rate set produced it, when it took effect, and who confirmed it. A SSNIT or PAYE change does not wait on TSI.

### 13.2 The guided run

Drafted automatically on the 25th by `payroll-draft`. She then walks five screens:

**Step 1 · Who is being paid**
28 people listed, each with what they will take home. Anyone new, anyone who left, anyone with no salary record on file — surfaced here, not discovered later.

**Step 2 · What changed since last month**
Only the lines that moved, each with the reason the system knows:
> *Esther Owusu — up GHS 520. Her salary changed on 1 August.*
> *Daniel Tetteh — down GHS 310. Three days of unpaid leave.*
> *Comfort Baidoo — up GHS 180. We do not know why. Please check.*

That third line matters more than the first two. **The system says when it does not know.**

**Step 3 · Things to check** — the validation pass (§13.3)

**Step 4 · Preview**
One payslip shown in full, exactly as the staff member will see it. Any person can be previewed.

**Step 5 · Approve**
> *This will issue 28 payslips and lock the figures for August. You can still correct a mistake afterwards — it appears as a separate adjustment, and nothing is hidden.*

### 13.3 The validation pass

Before approval, in plain words, never technical:

| Flag | Wording |
|---|---|
| Large movement | *Comfort's pay changed by more than 20% and we cannot see why.* |
| Missing salary record | *Peter Adom has no pay set. He would receive nothing.* |
| Expired rate set | *Your SSNIT rates were confirmed in January. Please check they are still correct.* |
| Negative or zero net | *Mary's take-home comes to zero. Please check her deductions.* |
| Duplicate | *Two records for the same person.* |
| Leave not applied | *Daniel has 3 days of unpaid leave that has not been deducted.* |

Each flag is **dismissed with a reason**, recorded in the audit log. Flags never block approval — she may know something the system does not.

### 13.4 Practice mode

A payroll run can be marked **practice**. Everything computes, nothing issues, nobody is paid, and it is clearly labelled throughout.

This is how she learns the flow without risk, how a new administrator is trained years from now, and how any change is tested before it touches real pay. **A practice run is item six on the setup checklist** (§3.3).

### 13.5 Corrections — the thing that removes the phone call

An approved run stays immutable, because audit requires it. But immutable-with-no-way-back is exactly what makes someone call for help on the 28th.

**She reverses her own mistakes:**

```
Approved run  →  Add a correction  →  reason, amount, who  →  Approve correction
                                                                     ↓
                                              Adjustment entry against the run
                                              Original untouched. Both visible.
                                              Appears on the next payslip.
```

A whole run can be reversed the same way — a **reversing entry**, never a deletion. The original run, the reversal and the reason all remain visible.

**Every error has a path out that does not involve a phone call.** This single design choice does more to remove TSI from the monthly loop than any amount of automation.

### 13.6 What is deliberately not automated

**Approval stays human.** The draft generates itself; issuing payslips does not.

A wrong rate quietly paid for four months is far worse than a run that sits unapproved for a day. The failure mode of automated payroll is silent and expensive, and thirty people's pay warrants one person looking at it. This is the same reason banks separate the person who prepares from the person who approves.

### 13.7 The second pair of hands

The single point of failure is now the administrator, not TSI.

**A second person at CEAC holds a payroll-capable role** — able to run and approve if she is ill or away. Named during onboarding, not after the first emergency.

---

## 14. Reversibility — NEW

> **Rule: nothing in this system is irreversible, and the way back is stated on the screen that does the thing.**

Prevention makes people afraid to act. Reversibility makes them confident, and confidence is what makes a novice administrator fast.

| Action | How it is undone |
|---|---|
| Approved payroll run | Correction or reversing adjustment (§13.5). Original preserved. |
| Statutory rate change | Superseded, never deleted. Prior rate sets stay with their dates. |
| Approved submission | Manager reopens with a reason; recorded in the activity log |
| Closed project | Reopened by the manager; the close report is versioned, not overwritten |
| Deactivated staff member | Reactivated. Records were never deleted. |
| Leave approval | Cancelled, with the balance restored and the change recorded |
| Deleted task, project, unit | Soft-deleted with a 30-day restore window, then archived, never hard-deleted |
| Imported data batch | Whole batch rolled back by `import_batch_id` |
| Sent announcement | Withdrawn — removed from panels, marked withdrawn in Telegram |

**Two things that stay immutable, by design:** the audit log, and the *record* of a payroll run (its figures at the moment of approval). Both can be corrected forward. Neither can be edited backward.

**Wording rule:** every destructive-looking control carries the way back in its confirmation.
> *Remove Kofi from Media? He keeps his record and his history. You can add him back at any time.*

---

## 15. Explain this — NEW

> **Rule: every number, flag and threshold in the system can account for itself in plain language, on demand.**

A new administrator trusts a system she can interrogate. One that presents figures without provenance gets quietly worked around in a spreadsheet.

### 15.1 The affordance

Every figure carries a quiet **Why?**. Tapping it opens a panel with three things, in this order:

```
1  What this means, in one sentence
     "Everyone who worked at least one day in August."

2  How it was worked out
     "28 people with an active contract, minus 1 who left on 14 August,
      plus 1 who started on 3 August."

3  The rows themselves
     [the 28 people, opening to each record]
```

Not a tooltip. A panel that ends in the underlying data — which is the same clickable-number rule, made legible.

### 15.2 Where it is required

- Every payroll line and every deduction
- Every flag in the validation pass, including the threshold that triggered it
- Every figure on Admin, Manager and Group Pastor dashboards
- Every entry in the Silence list — what the threshold is and when it was crossed
- Every capacity verdict — which tasks and which day types produced the number
- Every appraisal evidence figure

### 15.3 Thresholds are visible and editable

Nothing fires from a hidden rule. Settings shows every threshold in plain words, editable:

```
Tell me when...
  a unit has not reported for          [ 14 ] days
  a project has had no movement for    [ 6 ] weeks
  a submission has waited for          [ 5 ] working days
  someone's pay changes by more than   [ 20 ] %
```

### 15.4 The system explains its own jobs

Settings lists every scheduled job in plain words — what it does, when it last ran, whether it worked:

> *Payroll draft · prepares next month's payroll on the 25th · last ran 25 August, worked*

The `job_runs` table (§11) already holds this. Surfacing it turns invisible machinery into something a non-technical administrator can check herself — and is the difference between "it's broken, call Gabriel" and "the payroll draft did not run last night."

---

## 16. HR beyond payroll

Full detail in the Admin & HR panel spec. Everything in §3, §14 and §15 applies equally to: adding a staff member, leave policy setup, appraisal cycles, contract expiry, welfare, and the monthly close.

**Appraisals** assemble from accumulated evidence — completion, on-time rate, first-time-approval rate, objectives met, reporting compliance, feedback log, training. **No composite score.** Components shown; the human judges.

---

## 17. Data model

Six domains. `organization_id` on every table from row one.

### Organisation
```
organizations · units (review_mode) · user_profiles · unit_memberships (role) · employment
unit_day_types · ministry_objectives · setup_checklist
```

### Work
```
projects · objectives · tasks (estimate_minutes, actual_minutes, origin)
task_checklist_items
task_checklist_ticks      ← append-only events (item_id, user_id, ticked_at,
                             session_id, device_id, undone_at)
submissions (outside_session) · submission_files (drive_file_id, url)
reviews · project_closes (versioned) · weekly_returns · estimate_factors
```

### Presence
```
work_sessions (started_at, ended_at, end_reason, lat, lng, ip,
               device_time, server_received_at, flags jsonb)
session_events
```

### HR and payroll
```
leave_types · leave_requests · leave_balances (opening_balance_date)
salary_records · statutory_rates (effective_from, confirmed_by, superseded_by)
payroll_runs (status: draft|practice|approved|reversed)
payroll_lines · payslips
payroll_adjustments       ← NEW §13.5 (run_id, person_id, amount, reason,
                             created_by, approved_at, reverses_run_id nullable)
payroll_flags             ← NEW §13.3 (run_id, person_id, flag_type, message,
                             dismissed_by, dismissal_reason)
appraisals · feedback · documents
```

### Communication and reporting
```
threads · messages · announcements (withdrawn_at)
report_templates · report_periods · reports
telegram_links (last_verified_at) · telegram_drafts
notifications (followups_sent, delivered_in_app, delivered_telegram)
```

### System
```
activity_events · job_runs · audit_log (append-only)
import_batches · soft_deletes (object_type, object_id, deleted_at, restore_by)
thresholds                ← NEW §15.3 (name, value, unit, updated_by)
```

---

## 18. Permissions

| Role | Sees |
|---|---|
| Staff | Own record, own work, own unit's projects, threads they are in |
| Manager | The above + all unit members and unit work, unit finance read-only |
| Admin & HR | All units, all HR data, payroll, org-wide reporting, single-person unit returns |
| **Payroll deputy** | Payroll only — run, review, approve, correct (§13.7) |
| Group Pastor | Org-wide aggregates with drill-down; full payroll register, read-only |

RLS written by hand as **migrations**, never through a UI. Login-path policies pure `auth.uid()` with zero function calls. Search respects RLS.

---

## 19. PWA and offline

Installed from a link via *Add to Home Screen*. Manifest, service worker, local store, sync queue.

Offline writes queue as `pending` and flush on reconnect. User sees *saved — will sync*, never a failure. Checklist ticks are append-only events so concurrent offline edits merge rather than overwrite.

No iOS background sync → **sync on open**; Telegram carries anything that must arrive. All timestamps stored UTC, displayed `Africa/Accra` — Ghana has no daylight saving.

---

## 20. Build structure

Lovable builds the front end. **The system does not live in Lovable.**

| Layer | Written where |
|---|---|
| Schema, constraints, triggers | Supabase SQL editor, as migration files |
| RLS policies | Supabase SQL editor, as migrations |
| Edge Functions | Supabase CLI / dashboard |
| pg_cron schedules | Supabase SQL |
| Service worker + sync queue | By hand, in the repo |
| React screens, guided flows, charts | Lovable, one prompt at a time |

**Lovable will fake:** RLS, service workers, sync queues, webhook verification, anything involving a secret. Verified by reading files back at the commit SHA, never by its summary.

**Repo owned by TSI** from day one. **Secrets in Supabase Cloud Secrets only**, never in a Lovable prompt.

### Prompting

One prompt at a time. A test gate between every prompt. Upload this architecture as context first. Read every proposed migration before approving. Never re-run an earlier prompt. Build the staff panel first and clone its patterns.

**Prompt anatomy:** what screen and who uses it → exact tables and columns → layout top to bottom → empty, loading and offline states → which controls are disabled when and the exact disabled text → the §4 vocabulary constraints → **what not to build in this prompt.**

**Standing constraint block, appended to every UI prompt:**

```
Constraints:
- Never display: score, ranking, leaderboard, streak, badge, points.
- Never show a percentage attached to a person. Use "12 of 14" form.
- Never compare one staff member to another.
- Use plain English. No HR jargon — see the translation table.
- Every screen has a one-line description of what it is for, always visible.
- Every disabled control must state why it is disabled.
- Every destructive control states how to undo it, in the confirmation.
- Every figure has a quiet "Why?" affordance.
- Offline is a state, not an error: "saved — will sync", never a failure.
- Do not add navigation, settings, search or notification UI unless asked.
- Do not write RLS policies, service workers or edge functions.
```

---

## 21. Build sequence

### Phase 0 — Foundation
Supabase project + staging branch. Schema, constraints, RLS as migrations. Invite-gated email auth. Units, day types, review modes, thresholds, org seed. Secrets. TSI-owned repo. Import of units, people and leave balances.

### Phase 1 — The vertical slice
One manager, one staff member, one week — assignment through to a pre-filled report, with presence beside output. Ships with the Telegram webhook, `job_runs` and heartbeat.

### Phase 1.5 — The two-week gate
One unit uses it for two full weeks. Change nothing but bugs. Watch whether sessions get started, whether checklists get ticked or bypassed, whether the manager clears the queue, whether anyone opens the pre-filled report.

### Phase 2 — Widen
All units. Full manager panel, weekly returns for single-person units, capacity check.

### Phase 3 — Admin & HR
People, attendance, leave, **payroll with the guided run, validation pass, practice mode and corrections**, cost, appraisal from evidence, search. Staging and restore tested before payroll goes live.

### Phase 4 — Executive
Group Pastor panel, ministry objectives, retrospective view, silence detection, period reports, Telegram query layer, AI interpretation.

### 21.4 Handover readiness test — NEW

**The build is not signed off until the administrator completes, alone, with Gabriel present but silent:**

1. Adds a staff member and invites them
2. Approves a leave request
3. Changes a statutory rate and sees its effect before confirming
4. Runs a **practice** payroll end to end
5. Runs a **real** payroll end to end
6. Makes a deliberate mistake and corrects it herself
7. Checks in Settings whether last night's scheduled jobs ran

**If she cannot do all seven without help, the system is not finished.** This is the acceptance test, not a training session — and it is the only honest way to promise CEAC that they do not need TSI monthly.

### Phase 5 — Deferred
Rotating front-desk code / NFC if gaming appears. Estimate correction factors. PCF fellowship layer, only once the staff layer is live and trusted.

---

## 22. Operations

**Backup:** confirm what the Supabase plan includes; decide whether PITR is needed and price it. **Test a restore before go-live.** Nightly logical export of the HR domain.

**Staging:** Supabase branching or a second project, with anonymised data. Mandatory before payroll goes live. All migrations run on staging first.

**Audit log:** append-only, no update or delete path from the application. Logs salary changes, role changes, payroll approval, **flag dismissals with their reasons**, rate changes, leave adjustments, deactivations, permission changes, admin overrides. Readable by Admin & HR and the Group Pastor.

**Support:** a written runbook for someone who is not Gabriel — running payroll, restoring a backup, resetting an account, re-pointing the Telegram webhook, rotating a secret. A defined support arrangement in the contract covering uptime, backups and response window — **infrastructure insurance, not payroll processing**, since CEAC now runs payroll alone.

---

## 23. Data protection — Ghana Act 843

Registration with the Data Protection Commission is required **before** processing personal data and applies to controllers **and processors**. Registration is required within 20 days of commencement and renews every two years. Processing without registration is an offence carrying a fine or imprisonment.

**CEAC is the controller. TSI is the processor.**

1. Confirm TSI's own registration before Phase 0.
2. Confirm CEAC's registration — raise carefully, most Ghanaian churches have not registered.
3. A written data processing agreement in the contract.
4. A retention policy for leaver records, session location data and payroll history.
5. A privacy notice to staff at onboarding.

---

## 24. Known risks

| Risk | Mitigation |
|---|---|
| Administrator overwhelmed, reverts to spreadsheets | §3 governs every screen; guided flows; setup checklist; practice mode |
| Payroll error she cannot fix | Corrections and reversing adjustments (§13.5) |
| Administrator unavailable | Payroll deputy role (§13.7) |
| System distrusted because figures are opaque | Explain-this on every number (§15) |
| Scheduled job dies silently | `job_runs` + heartbeat; visible in Settings (§15.4) |
| Notification fatigue | One reminder, one follow-up |
| Telegram unavailable or link broken | In-app notification centre, weekly link check |
| Manager queue stalls | 5-day escalation to Admin |
| Single-person units unreviewed | Weekly return to Admin |
| Checklist ticked without work | Return loop + `first_time_approved`; watched at Phase 1.5 |
| Offline ticks lost | Append-only tick events |
| System launches empty | Import path + named CEAC owner |
| Payroll error on live data | Staging mandatory; practice mode |
| Data loss | Tested restore before go-live |
| Lovable lock-in | TSI-owned repo |
| Regulatory exposure | Act 843 registration and processing agreement |
| Adoption fails quietly | Phase 1.5 gate |

---

## 25. Open questions

| # | Question | Blocks |
|---|---|---|
| 1 | Headcount per unit | Views; which units are `weekly_return` |
| 2 | Who counts as a manager; do managers submit upward? | Role model, RLS |
| 3 | One real example of a unit's report to Admin | Report templates, pre-fill |
| 4 | How is work assigned today? | Onboarding design |
| 5 | Current appraisal format and frequency | Performance module |
| 6 | What happens today when someone is late? | Attendance precision vs visibility |
| 7 | Static IP at the office, and provider | Anti-gaming |
| 8 | Ministry calendar owner — OFTGP or Programs? | Calendar |
| 9 | Does CEAC own a Google Workspace account? | Drive |
| 10 | Does Finance hold budget and income data digitally? | Cost module |
| 11 | Budget approval threshold in GHS | GO approval queue |
| 12 | Leave entitlement, accrual, carry-over | Leave policy |
| 13 | Salary structure — grades or individual | Payroll data model |
| 14 | Allowances and deductions beyond statutory | Payroll |
| 15 | Which units work Sundays, and their hours | Day types |
| 16 | PCF and PFCC in full | Terminology |
| 17 | Where do leave balances live, as at what date? | Import |
| 18 | Who at CEAC owns the initial data load, by when? | Phase 0 |
| 19 | Is CEAC registered with the DPC? | §23 |
| 20 | **Who is the payroll deputy?** | §13.7, permissions |
| 21 | **How experienced is the administrator with payroll today?** | Depth of guidance and how much §3 needs to carry |

**Resolved:** email authentication — CEAC staff use work email regularly.

---

## 26. Commercial status

No deposit, no signed scope, no price submitted. **Commitment before build.** Phase 0 does not begin until a deposit or signed scope is in place.

The contract must include scope by phase, the data processing agreement, the support arrangement, data ownership and handover terms, the handover readiness test (§21.4) as the acceptance criterion, and what is explicitly out of scope.

---

*CEAC OS — Architecture v4. Supersedes v3, v2, v1. Panel specs remain current beneath it.*
