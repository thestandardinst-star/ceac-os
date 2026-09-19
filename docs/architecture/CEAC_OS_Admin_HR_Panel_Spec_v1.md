# CEAC OS — Admin & HR Panel Spec v1

**Panel 3 of 4.** Companion to `CEAC_OS_Architecture_v1.md`, Staff Spec, Manager Spec.
**User:** the Admin & HR head. One person, sitting at a laptop, responsible for the whole office.
**Device:** laptop primary. This is the heaviest panel in the system.

---

## 1. What she actually asked for

Her own words, from the first conversation:

> A single platform to monitor activity, performance, competence, and **provide valid information on each person** in the company.

Everything in this panel serves that sentence. The employee record is the centrepiece, not an afterthought — it is the screen she opens most.

Added later by Gabriel, and equally binding:

> Everything an HR needs to help build a productive company should be available on the Admin & HR panel and beyond. It's not just numbers on the screen — it's making informed decisions.

### Her two jobs

| Job | What it means |
|---|---|
| **Run the office** | Payroll, leave, contracts, documents, welfare, onboarding, policies |
| **Assess delivery** | Are the units achieving the ministry's objectives, and are the people delivering |

The panel is organised around that split.

### Deliberately excluded

**Admin & HR's own performance is not assessed inside this system.** That relationship is between her and the Group Pastor and is handled internally. Do not build a self-assessment view, and do not surface her own metrics to the Group Pastor panel as a unit scorecard.

---

## 2. Altitude — locked

| She reviews | At what level |
|---|---|
| Managers | **Projects, objectives, monthly results.** Never individual tasks. |
| Staff | Only through their manager's record and the employee file. She does not approve staff task submissions. |
| The organisation | Reporting compliance, delivery against the ministry calendar, cost |

She can *see* every task in the system by drilling down. She is never *queued* one for approval. The distinction protects her from becoming a bottleneck for sixteen units.

---

## 3. Navigation

Grouped sidebar:

```
ORGANISATION
  Home
  Units
  Projects
  Calendar

PEOPLE
  People
  Attendance & leave
  Payroll
  Performance

INSIGHT
  Cost
  Reports

SYSTEM
  Settings
```

---

## 4. Home — the organisation this morning

Ordered by what needs her, then what needs watching.

```
Needs you                              (6)
  2 leave requests escalated
  3 contracts expiring within 30 days
  1 payroll run awaiting approval

Reporting                              August
  13 of 16 units submitted
  Missing: Welfare, Ministry Material, Front Desk

The office today
  24 working · 3 on leave · 2 not started · 1 absent

Delivery
  9 projects active · 3 closed this month
  22 of 31 objectives on track

Watch
  Studio Reorganisation      1 objective at risk, 3 weeks behind
  Foundation School          no submissions in 8 days
  Kofi Mensah                present 5 days, 0 submitted
```

**Rules**
- Every row is actionable or opens the underlying rows.
- The **missing-report list names the units**, because "13 of 16" is useless without knowing which three.
- "Watch" is rule-based, not AI. Fixed thresholds, stated in Settings so she knows why something appeared. No black box.

---

## 5. Units — the department deep-dive

Gabriel's explicit requirement: *departments in the admin's dashboard, they will see a lot more about the department.*

**Unit list** — all sixteen, each row: head, headcount, active projects, objectives on track, tasks completed this month, reporting status, monthly cost.

**Unit detail** — everything about one department in one place:

- Head, staff list with presence beside output
- Active and closed projects, with objective status
- Objectives: on track / at risk / met / partly met / not met
- Reporting: submitted, late, missing, with dates
- Cost: budget, committed, actual, payroll cost for the unit
- Close reports from every project the unit has closed
- Attendance and leave summary for the unit

**Design consequence:** sixteen units across roughly thirty staff means **several units are one person**. The unit detail must render correctly for a unit of one, where the head is also the only doer.

---

## 6. People — the employee record

The screen that answers *provide valid information on each person*. Everything about one human being, assembled from work that already happened.

```
Identity        name, photo, job title, unit, manager, staff ID
Employment      start date, contract type, contract end, status,
                employment history, promotions
Documents       contract, certificates, ID, appraisals — with expiry alerts
Work            tasks completed, on time, first-time approved,
                assigned vs self-created, projects contributed to
Attendance      days present, average start, session history, lateness pattern
Leave           entitlement, taken, remaining, history, current requests
Pay             salary record, allowances, payslip history
Performance     objectives met, manager feedback log, appraisal history
Welfare         requests and outcomes
Training        completed
```

**Rules**
- **Every figure opens its rows.** "Completed 41" opens the 41 tasks with dates, projects and evidence.
- **Assigned and self-created are shown separately** so appraisal cannot be inflated by trivial self-entered tasks.
- **Nothing is recorded about a person that they cannot see** in their own Record and Me tabs. If CEAC later wants private manager notes, that is a separate object and a separate decision.
- Editing employment fields — job title, unit, contract, salary — is Admin & HR only.

**People list** filters: unit, status, contract type, contract expiring, on leave, no submissions in N days.

---

## 7. Attendance & leave

**Attendance** — organisation-wide. Present today, average start time by unit, lateness patterns, absence, session history. Flagged sessions surfaced: `outside_session`, `idle_ended`, `claimed_continuation`, GPS/IP mismatch, velocity anomaly.

> **Flags are shown as flags, never as findings.** The screen says what was recorded, not what it means. No language implying dishonesty anywhere in the interface.

**Leave** — requests escalated from managers, balances and liability across the office, calendar of who is away when, policy configuration (entitlement by contract type, accrual, carry-over).

**Hours** are displayed as *time on the platform*, with the same one-line note as every other panel: a record of activity, not a basis for pay.

---

## 8. Payroll

The heaviest module. Build it properly, but keep tax law out of the code.

### Statutory rates as configurable data

```
statutory_rates
  name            SSNIT Tier 1 | Tier 2 | Tier 3 | PAYE band | other
  rate / band     jsonb
  effective_from  date
  confirmed_by    user
  confirmed_at    timestamp
  source_note     free text — where the rate came from
```

Rates are **data, editable by Admin & HR**, never constants in code. The system computes correctly; CEAC owns the rates. When they change, she updates the table without waiting on TSI, and the record shows who confirmed them and when.

The payroll screen displays the active rate set with its effective date and confirmation stamp at the top of every run. She always knows what she is computing with.

### Payroll run

```
Draft → Review → Approve → Payslips issued
```

- Draft assembles from salary records, allowances, deductions, and any leave-without-pay in the period
- Review shows the register: per person gross, allowances, each deduction itemised, net
- Variance against the previous month is highlighted per line, with a reason where the system knows one (new hire, salary change, unpaid leave)
- Approve locks the run. Locked runs are immutable; corrections are a new adjustment entry, never an edit
- Payslips generate as PDFs and appear in each staff member's Pay tab

### Payroll views
Cost by unit, month-on-month movement, headcount cost trend, allowance and deduction breakdown.

---

## 9. Performance

Appraisals built from accumulated evidence rather than recollection. This is the module that justifies the whole system to her.

**Per person, auto-assembled:**
- Tasks completed, on time, first-time approved
- Assigned vs self-created split
- Objectives met
- Reporting compliance
- Manager feedback log with dates
- Attendance pattern
- Training completed

**Appraisal cycle:** she opens a cycle, the evidence pack generates for each person, the manager adds assessment and development notes, the staff member sees the result. Stored to the employee record.

**Rules**
- **No composite score.** Do not compute an overall percentage from these components — the weighting would be invented, and an invented number attached to a person is the most damaging thing this system could produce.
- Show the components. Let the human judge.
- **No ranking across staff.** She may sort a list; the system never publishes a league table.

---

## 10. Cost

Unit budgets against actual. Project cost. Payroll cost by unit. Welfare spend. Answers *what does this unit cost and what did it produce* by putting cost beside delivery on the same screen.

> **Open — needs an answer before build.** Where does budget and spend data come from? If Finance does not keep it digitally, the interim is: Admin & HR sets budgets per unit and project in the system, and the Finance unit enters spend lines through a simple entry screen. Managers stay read-only either way. Confirm before building this module.

---

## 11. Reports

One engine, already specified. Admin & HR's scope is organisation-wide.

- Periods: weekly, monthly, per project, annual
- **Pre-filled** from what the period contains; she confirms, corrects, adds narrative
- Charts sized to the question: trend as a line, unit comparison as bars, composition as a donut, activity as a heat map — **every chart clickable to its rows**
- Export as branded PDF
- **The monthly report to the Group Pastor is generated here**, not written from scratch
- Annual report assembles from project close reports already produced

**AI interpretation:** one button, on demand, one Edge Function call. Reads only submitted rows. States what moved, what fell, what is stuck. Never a prediction, never a figure absent from the data, never in the render path.

---

## 12. Settings

The system's control room. Admin & HR owns it.

- **People and access** — invite staff and managers by email, assign unit and role, deactivate leavers
- **Units** — create, rename, assign heads, set parent relationships
- **Ministry objectives** — the annual and monthly objectives that unit projects link to (see open item below)
- **Statutory rates** — the table above
- **Leave policy** — entitlement by contract type, accrual, carry-over, approval chain
- **Report templates and periods** — what each unit owes and when
- **Watch thresholds** — the rules behind the Home "Watch" block, visible and editable
- **Telegram** — bot connection status per user
- **Drive** — connected CEAC Workspace folder, structure

> **Open — needs an answer.** Do managers set their own project objectives, or does Admin & HR set ministry objectives that unit projects link to?
> **Recommendation:** Admin & HR sets ministry-level objectives from the ministry calendar; managers create project objectives and link them to a ministry objective where relevant. This is what makes the Group Pastor panel meaningful — otherwise there is nothing organisation-wide to roll up to.

---

## 13. Test gates

1. **Altitude** — Admin & HR is never queued a staff task for approval, but can drill from a unit to any individual task and its evidence.
2. **Clickable everywhere** — every figure on every screen opens its underlying rows. No stored summary totals.
3. **Missing reports named** — the reporting block lists which units are missing, not just a count.
4. **Rate table** — changing a SSNIT rate with an effective date changes the next payroll run and not a past one; the run displays which rate set it used and who confirmed it.
5. **Payroll immutability** — an approved run cannot be edited; a correction creates an adjustment entry.
6. **No composite score** — no screen anywhere displays a single overall performance number for a person.
7. **Evidence pack** — opening an appraisal assembles from real rows only, with zero placeholder or sample figures.
8. **Contract expiry** — a contract ending within 30 days appears on Home without anyone querying for it.
9. **Unit of one** — a single-person unit renders correctly everywhere, with the head as the only member.
10. **RLS** — Admin & HR sees all units; no manager or staff member can reach payroll, salary records, or another unit's people data by any route.

---

## 14. Open items

| # | Question | Blocks |
|---|---|---|
| 1 | Do managers set objectives, or does Admin set ministry objectives they link to? | Objective ownership, Group Pastor roll-up |
| 2 | Does Finance keep budget and spend digitally? If not, who enters it? | Cost module |
| 3 | Leave entitlement by contract type, accrual, carry-over | Leave policy config |
| 4 | Current appraisal format and frequency | Performance module |
| 5 | Existing salary structure — grades, or individual? | Payroll data model |
| 6 | Which allowances and deductions exist beyond statutory | Payroll |
| 7 | Headcount per unit | Confirms unit-of-one rendering |

---

*Admin & HR Panel Spec v1. Next and last: Group Pastor.*
