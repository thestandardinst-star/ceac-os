# CEAC OS — Manager Panel Spec v1

**Panel 2 of 4.** Companion to `CEAC_OS_Architecture_v1.md` and `CEAC_OS_Staff_Panel_Spec_v1.md`.
**User:** unit head / manager. Sixteen units, roughly thirty staff — most units are one to four people.
**Device:** laptop primary, phone secondary. This is the panel someone sits down with.

---

## 1. The accountability model — locked

The unit of accountability changes with the level. This governs everything below.

| Level | Accountable for | Reviewed by | At what altitude |
|---|---|---|---|
| Staff | Task completion | Their manager | Task by task |
| **Manager** | **Objectives met, projects delivered, monthly results** | **Admin & HR** | **Project and period, never task** |
| Admin & HR | Organisation-wide delivery | Group Pastor | Period and project |

**Consequences:**

- A manager's own tasks **self-certify**. Nobody approves a media manager's individual to-dos.
- **The project close is the manager's real submission.** It is what Admin & HR review, and what rolls into the monthly and annual report.
- A manager's job is to *see work completed*, not to gatekeep what gets entered.

---

## 2. Two ways a task is born — both legitimate

| Path | Carries | Manager action |
|---|---|---|
| **Manager assigns** | Purpose, checklist, due date, resources | — |
| **Staff enters what they agreed to carry** | Project, description, due date, at least one checklist item | Appears in the manager's view. May add checklist items or adjust the date. |

The second path is likely **more common** at CEAC, where responsibilities are agreed verbally in meetings. Design accordingly:

- Staff task creation must take **about twenty seconds** — project, what I am doing, by when. Not a form.
- Staff assign only to themselves, only to projects in their own unit.
- No approval required. Managers see it appear; they do not gate it.
- Stored `origin = assigned | self_created`. Counted in completion, **displayed separately** in the record so appraisal cannot be inflated by trivial self-created tasks: *14 completed — 11 assigned, 3 self-created.*
- **At least one checklist item is required** on self-created tasks, so that ticking remains the data entry and no task completes with zero evidence.

---

## 3. Objectives — descriptive with a handle

CEAC's objectives are written in words, not numbers. Do not force a numeric target.

```
objectives
  id
  project_id
  ref            e.g. "OBJ-3"        auto, for navigation
  name           e.g. "48-hour publishing"    short handle
  statement      e.g. "Every Sunday service published within 48 hours"
  measure        optional, free text
  status         on_track | at_risk | met | partly_met | not_met
  closed_note    manager's assessment at project close
```

**Progress is never invented from a descriptive statement.** Two honest signals only:

1. **Task progress** — tasks completed against tasks planned under this objective. Computed, factual.
2. **Manager status** — the manager sets on track / at risk, and at close records met / partly met / not met with a note.

A progress bar may only ever represent task completion, and must be labelled as such: *6 of 9 tasks*. Never a percentage against a descriptive statement.

---

## 4. Project close — the manager's submission

Captures five things. Locked for v1; more may be added later.

```
1  Deliverables        what was actually produced
2  Objectives          each marked met | partly met | not met, with a note
3  Cost                planned against actual
4  Challenges          what got in the way
5  What to do          differently next time
```

**Pre-filled where possible.** Deliverables draw from approved submissions in the project. Cost draws from the unit finance record. Objectives list themselves with their task progress attached. The manager confirms, corrects, and writes the narrative.

On close: project status → `closed`, close report generated as a record, visible to Admin & HR and included in monthly and annual reporting.

> **Open:** if Programs or OFTGP Secretariat already uses a post-event report format, match it rather than inventing one. Ask before building the template.

---

## 5. Navigation

Sidebar, laptop:

```
Home
My work
Team
Projects
Calendar
Finance
Reports
Messages
Me
```

On phone the same panel collapses to five tabs — Home, Work, Team, Projects, More.

**Home ordering principle: unblock others before yourself.** A stalled approval blocks a colleague; the manager's own overdue task blocks only them. Approvals sit above the manager's own work on the screen, always.

---

## 6. Home

```
Waiting on you                    (4)
   3 submissions to review
   1 leave request

Your team today
   6 present · 1 on leave · 1 not started

Your own work                     (2)
   Quarterly media plan      due today
   Studio inventory          overdue 1 day

Projects needing attention        (2)
   Youth Convention Media    2 objectives at risk
   September Services        closes Friday

This week
   14 tasks due · 9 completed · 3 overdue
```

Every row is actionable in place — approve, return, open — without leaving Home.

---

## 7. My work

Identical to the staff panel's Work tab. Same task detail screen, same checklist, same submission flow.

**Difference:** on submit, a manager's task is marked `self_certified` rather than routed for review. Recorded, visible, never queued to anyone.

---

## 8. Team

A **list**, not a dashboard — most units are one to four people.

Each member as a row, presence beside output:

```
Kwame Asante        present 5 days   3 completed   1 overdue   2 awaiting you
Ama Owusu           present 4 days   5 completed   0 overdue   —
Kofi Mensah         present 5 days   0 completed   0 overdue   —      ⚠
```

**The third row is the point.** Present all week, nothing submitted. The system draws no conclusion and makes no accusation — it surfaces the pattern and leaves the conversation to the manager. This is the only anti-gaming signal that cannot be defeated by a spoofed location or a shared code.

Click a person → their workload, completion and on-time rate, first-time-approval rate, objectives, session history, feedback log, and a box to write feedback (visible to the staff member — nothing is recorded about a person that they cannot see).

---

## 9. Projects — the manager's most important screen

```
Project              Objectives    Tasks        Cost           Status
September Services   3             18 of 24     4,200 / 5,000  Active
Youth Convention     4             31 of 31     11,800/10,000  Ready to close
Studio Reorg         2             5 of 14      600 / 2,000    At risk
```

Project detail:

- Purpose, dates, budget, assigned team
- **Objectives**, each with ref, name, statement, status, and task progress
- **Tasks** grouped under their objective — who holds each, status, due date, evidence attached
- **Cost** planned against actual
- **Discussion** thread scoped to the project
- **Close project** → the five-part close report

**Create project** → name, purpose, dates, budget, team. Then add objectives. Then assign tasks under objectives.

---

## 10. Calendar

Ministry calendar, unit activities, project milestones, task deadlines, team leave — in one view, filterable by layer.

Month and week views. Click any entry to open the underlying project, task or leave request.

> **Open:** the ministry calendar needs a single owner — OFTGP Secretariat or Programs. Everything else hangs off it.

---

## 11. Finance — read-only in v1

Unit budget against spend. Per project: planned, committed, actual. Requests submitted, approved, outstanding.

**Managers do not post entries.** The moment they do, this becomes an accounting system in conflict with Finance's own records. Read-only, sourced from Finance, for the manager to see their position.

---

## 12. Messages

Threads scoped to work, not general chat:

- One thread per **task**
- One thread per **project**
- One **direct** thread per team member

A message appears in real time on the recipient's panel and is pushed to Telegram. Supabase Realtime handles delivery natively — no third-party chat service.

Deliberately not a Slack replacement. Conversation stays attached to the work it concerns, which is more useful and far cheaper to build.

---

## 13. Reports

Generate for the unit: weekly, monthly, or per project.

**Pre-filled** from what the period already contains — completed tasks, project progress, attendance, submissions. The manager confirms, corrects, and adds narrative and challenges. Composing from memory is what produces fabricated and skipped reports.

**Visual layer:** trend as a line, comparison as bars, composition as a donut, activity as a calendar heat map. **Every chart clickable to the rows behind it.**

Output: in-app, or branded PDF export.

**AI interpretation** — one button, on demand. Single Edge Function call. Reads only submitted rows; states what moved, what fell, what is stuck. Never a prediction, never a figure absent from the data. **Never in the render path.**

---

## 14. Work-session gating for managers

| Action | Gated? |
|---|---|
| Review, approve, return | **No** |
| Approve leave | **No** |
| Assign a task, create a project | **No** |
| Send a message | **No** |
| Submit the manager's *own* work | **Yes** |
| Tick a checklist on the manager's own task | **Yes** |

Approvals unblock other people. Requiring a session to clear a queue creates exactly the bottleneck the system exists to remove. The manager's own submissions are gated like everyone else's.

---

## 15. Test gates

1. **Dual role** — one account holding manager and staff roles sees both My work and Team, with no leakage between units.
2. **Self-certification** — manager submits own task → `self_certified`, appears in no review queue, visible to Admin & HR at project level only.
3. **Staff-created task** — created in under twenty seconds, appears in the manager's Projects view without an approval step, stored `origin = self_created`, counted separately in the record.
4. **Return loop** — manager returns work with a comment → flagged checklist items un-tick on the staff panel → `first_time_approved` set false.
5. **Presence vs output** — a member present all week with zero submissions surfaces on the Team list without any accusatory language.
6. **Project close** — pre-fills deliverables from approved submissions and cost from finance; generates a report visible to Admin & HR.
7. **No invented progress** — no percentage is ever displayed against a descriptive objective. Task-count progress only, labelled as such.
8. **Clickable numbers** — every figure on every screen opens to its underlying rows.
9. **RLS** — a manager cannot read another unit's tasks, team, projects or finance.

---

## 16. Open items

| # | Question | Blocks |
|---|---|---|
| 1 | Headcount per unit | Confirms list-not-dashboard for Team |
| 2 | Existing post-event report format (Programs / OFTGP)? | Project close template |
| 3 | Who owns the ministry calendar? | Calendar module |
| 4 | Where does unit budget data come from — does Finance keep it digitally? | Finance module; may need manual entry by Admin |
| 5 | Do managers set their own objectives, or does Admin & HR set them from the ministry calendar? | Objective creation permissions |

---

*Manager Panel Spec v1. Next: Admin & HR panel, then Group Pastor.*
