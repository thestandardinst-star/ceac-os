# CEAC OS — Group Pastor Panel Spec v1

**Panel 4 of 4.** Companion to Architecture v1, Staff, Manager and Admin & HR specs.
**User:** the Group Pastor. One person. Top of the organisation.
**Devices:** Telegram first, phone second, laptop for the deep sessions.

---

## 1. The design problem

He is not short of information. He is short of time and of a trustworthy summary.

The panel has to **earn the visit**. It gets opened if it tells him something he cannot get by calling someone, and it gets ignored if it doesn't. Every decision below is measured against that.

**Telegram is his primary interface.** He asks a question between meetings and gets an answer in the chat. The panel is where he goes when he wants to see what is behind the answer. Build the query layer as his main product and the panel as the drill-down.

---

## 2. What changed — he owns the objectives

This **overrules** the Admin & HR spec, where ministry objectives sat in Settings.

```
GO sets ministry objectives
        ↓
Admin & HR translates them into what each unit owes
        ↓
Managers create projects, each linked to a ministry objective
        ↓
Project objectives → tasks → completion
```

**Consequences**

- Every project on his screen answers *which of my objectives does this serve*.
- A project linked to **no** ministry objective is surfaced as exactly that — work happening for reasons nobody wrote down. That is a useful thing to show a leader, not an error state.
- Admin & HR administers the objectives; the GO owns them. Move creation and editing to his panel; leave administration on hers.

---

## 3. What he assigns — never to a staff member

| He creates | To whom | Lands as |
|---|---|---|
| Ministry objective | The organisation | What unit projects link to |
| Project | A manager or Admin & HR | Their project, in their unit, marked GO-assigned |
| Responsibility or task | A manager or Admin & HR **only** | Their own work item |

If he wants something done in Media, it goes to Ama, not to Kwame. This preserves the chain and keeps managers accountable for their own teams.

### The bypass problem — solved by visibility, not by blocking

A word from the Group Pastor outranks everything on a manager's list. Today that arrives as a phone call and **nothing anywhere reflects it** — which makes it the single largest source of untracked work in the office.

**Rule:** GO assignments go **directly** to the manager, and are stamped `assigned_by_go`. They appear immediately on Admin & HR's panel with that marker.

Nobody is blocked. Admin always knows. Her reporting stays accurate because the instruction is now a record instead of a call.

> Do not route his assignments through Admin for allocation. He will not use it, and he will go back to the phone.

---

## 4. Approvals — a real queue, not a watch list

He approves:

| Item | Source |
|---|---|
| Budget above threshold | Admin & HR or a manager raises it; threshold set in Settings |
| Senior hires | Admin & HR |
| Major project sign-off | Manager submits at project close |
| Projects he assigned | He is on the approval path for every one, by default |

Each item is actionable in place — approve, decline, or return with a comment. Every decision is recorded with actor and timestamp and is visible to Admin & HR.

**Ceiling: five items.** If the queue exceeds five, the threshold is set too low and Settings should say so. His queue becoming a chore is the failure mode that kills the panel.

---

## 5. Home — one screen

No navigation tree. Everything he needs on one view, in this order.

```
THE MONTH IN A LINE
  412 tasks completed · 9 of 14 objectives met · 92% attendance
  · GHS 260,600 spent, 96% of budget

NEEDS YOU                                    (4)
  Facility budget increase, GHS 40,000       [approve] [decline]
  Senior hire, Foundation School coordinator [review]
  Youth Convention Media — close sign-off    [review]
  Kumasi outreach report, 9 days overdue     [chase]

MINISTRY OBJECTIVES                          31
  22 on track · 6 at risk · 3 not met
  [ bar, clickable to the objectives behind each segment ]

SILENCE                                      (4)
  Welfare              no report in 2 months
  Ministry Material    no report in 2 months
  Front Desk           no report in 2 months
  Studio Reorganisation no movement in 6 weeks

THE OFFICE TODAY
  24 working — 18 at the office, 6 off-site
  3 on leave · 2 not started · 1 absent
  Exception: Foundation School, nobody present 3 days this month

DELIVERY AND COST BY UNIT
  [ sixteen rows: unit, tasks done, objectives, reported, cost ]

ANNOUNCEMENTS
  [ post to the whole office ]
```

### Silence detection — the thing only this system can tell him

Not performance scores. **Silence.** Which units have not reported, which projects have not moved, which objectives have had no activity in six weeks.

A church office fails quietly long before it fails visibly, and today nobody finds out until the quarter closes. This is the single most valuable block on his panel and the reason he will open it.

Rule-based, thresholds visible in Settings. No AI, no black box.

---

## 6. Objectives and projects

Grouped **by ministry objective, not by unit** — so he reads the ministry's intent rather than its org chart.

```
OBJ-1  Strengthen the cell system across all branches
       Cell Ministry    Q3 cell leader training      on track   14 of 18 tasks
       Programs         Cell convention logistics    at risk     6 of 15 tasks
       Media            Cell training video series   on track    9 of 11 tasks

OBJ-2  Reach 2,000 first-time visitors this year
       First Timers     Follow-up system rebuild     on track   22 of 24 tasks
       Partnership      Visitor welcome packs        met        8 of 8 tasks

NOT LINKED TO ANY OBJECTIVE                                              2
       Facility         Generator replacement
       Front Desk       Filing system overhaul
```

Any project opens to its objectives, tasks, evidence, cost and close report. Clickable-number rule holds all the way to a single submitted file.

**He should never land on a task by default.** Tasks are the manager's altitude; if he is reading task rows, the accountability chain has collapsed. He can drill to anything; the default path never puts him there.

---

## 7. The retrospective calendar

Every calendar in the system so far looks forward. This one looks **backward, by project**.

What was achieved, and when. Project starts, milestones and closes plotted across the period, each opening to its close report.

Six months of the ministry's work on one screen. **Nobody at CEAC can produce this today at any cost.**

- Period selector: last month, quarter, six months, year
- Grouped by ministry objective, so achievement reads against intent
- Not tasks, not deadlines — projects and milestones only

---

## 8. People, presence and pay

**Presence as distribution, not roster.**

- The office today: working, at the office, off-site, on leave, not started, absent
- Exceptions by unit — "Foundation School, nobody present three days this month"
- Drill-down to any individual, deliberately, when he searches for them

> **Not on the default screen:** a roster of named individuals with clock-in times. The moment the top of the organisation opens on that view, this stops being a work platform and becomes a monitoring instrument pointed downward. Thirty staff will feel it within a week and adoption will not recover.

**Pay — confirmed, he sees individual salaries.** Full payroll register, individual salary records, cost by unit, month-on-month movement. Same data as Admin & HR's payroll module, read-only. He does not run or approve payroll runs; that stays with Admin.

---

## 9. Money

The church office is a **cost centre, not a profit centre.** What can be shown honestly:

- Payroll by unit and in total
- Unit and project spend against budget
- **Cost beside delivery on the same screen** — the pairing that lets him ask whether a unit is worth what it costs
- Any income the office is responsible for, Partnership being the obvious case

> **Open:** a true P&L needs Finance's income data. Until we know whether that exists digitally, do not label anything in the product "P&L". Call it what it is — cost against delivery.

---

## 10. Communication

- **Direct thread** with each manager and with Admin & HR
- **Thread on any project he assigned**
- **Announcements** — one-to-all, landing on every panel and pushed to Telegram

**Deliberately absent: a direct thread with individual staff.** If he messages Kwame directly, Ama learns her editor's priorities changed from Kwame rather than from the system. The direct line stops at managers.

He will use WhatsApp anyway; that is fine and unavoidable. The point is that the app does not build a channel that routes around the managers he is holding accountable.

---

## 11. Reports

Any period: last week, three weeks, month, three months, quarter, six months, year, custom.

Cheap to build — every figure is already a live query, so a period is a filter.

- Visual: delivery trend, unit comparison, objective status, cost against delivery, retrospective project timeline
- Every chart clickable to its rows
- Branded PDF export, printable
- **AI interpretation:** one button, on demand, one Edge Function call, reads only submitted rows. Never a prediction, never a figure absent from the data, never in the render path.

---

## 12. Telegram — his primary interface

| Capability | Example |
|---|---|
| Query | *How is the ministry doing this month? · Which units have not reported? · What is Media working on? · How much have we spent against budget?* |
| Approve | Inline buttons on budget, hire and sign-off requests |
| Announce | Voice note or text → drafted announcement → confirm in app → posted to all |
| Digest | Monday morning, unprompted, three lines |

**Hard rule, unchanged:** Telegram never writes final state. Announcements and assignments captured by bot land as drafts requiring in-app confirmation.

---

## 13. Test gates

1. **Objective ownership** — only the GO creates or edits ministry objectives; Admin administers.
2. **Unlinked projects surface** — a project with no ministry objective appears in its own group, not hidden.
3. **GO assignment** — lands directly with the manager, stamped `assigned_by_go`, appears on Admin's panel with that marker, blocks nobody.
4. **No staff assignment** — the assignee picker offers managers and Admin only.
5. **No staff thread** — direct messaging is available to managers and Admin only.
6. **Default altitude** — no task row appears on any default view; all are reachable by drill-down.
7. **Presence** — the default view shows distribution and unit exceptions, never a named roster with times.
8. **Approval queue ceiling** — if the queue exceeds five items, Settings surfaces a threshold warning.
9. **Period reports** — every period from one week to one year renders from live queries with no stored summaries.
10. **Retrospective calendar** — shows projects and milestones only; never tasks or deadlines.

---

## 14. Open items

| # | Question | Blocks |
|---|---|---|
| 1 | Budget approval threshold in GHS | Approval queue |
| 2 | Does Finance hold income data digitally? | Whether cost-vs-delivery can become a P&L |
| 3 | Does CEAC set formal annual objectives, or is planning monthly and rolling? | Whether the year view is strategic or a rolling twelve months |
| 4 | Silence thresholds — how many days of no report or no movement counts? | Silence detection defaults |

---

*Group Pastor Panel Spec v1. All four panels specified. Next: costed proposal, then Phase 0.*
