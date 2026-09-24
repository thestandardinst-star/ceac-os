# CEAC OS — Experience & Data Architecture v2

Supersedes nothing. Extends `CEAC_OS_Design_System_v1.md` and the panel
specs. Written after a page-by-page review of all 58 screens with CEAC's
own reporting workbooks and SOPs in hand.

Everything here is a decision already taken. Where a decision is still
open it says so explicitly and must not be guessed.

---

## Part 1 — The diagnosis this responds to

Measured across 58 screens:

- **1 screen contains a chart or any SVG.** None contains a data table.
- 12 primitives (`card`, `row`, `field`, `btn`, `sec`, `flag`) are used
  over 2,000 times. `field` alone appears 479 times.
- 3,673 lines of CSS and 95 tokens exist — so there is a design system.
  It only knows how to produce one shape.

The result is that a profit-and-loss, a decision queue, a calendar and a
staff directory all render as cards containing form fields. The problem
is not that it is ugly. It is **monotonous**, and monotony is why it
reads as machine-generated rather than designed.

**No colour change fixes this.** The system is missing primitives.

---

## Part 2 — Design system additions (build these first)

Nothing else in this document can be built well until these exist,
because without them every screen becomes cards again.

### 2.1 `Table`
Real tabular data. Dense rows, aligned numerics, sticky header, sortable
columns, CSV export. Horizontal scroll inside its own container on
mobile — the page body never scrolls sideways.

Used by: Finance, Cost, Attendance, registers, payroll, any ledger.

### 2.2 `Chart`
Inline, small, part of a sentence rather than a dashboard widget. Four
kinds only:

| Kind | Use |
|---|---|
| Line | one measure over time — completion rate by week |
| Bar | comparison across things — spend by unit, score by department |
| Paired bar | two conditions of the same thing — Sunday vs midweek |
| Donut | composition, 2–5 parts only, never more |

**Chart / table toggle is mandatory** on every chart. Some people read
shapes, others read numbers, and the same data must be available both
ways. Default to whichever answers the screen's question faster.

No chart library with its own visual opinion. Inline SVG using the
existing colour tokens.

### 2.3 `Stat`
A figure with a label. **Always a link.** There is no such thing as a
number in this system that cannot be opened. If a figure has no rows
behind it, it must not be displayed.

### 2.4 `QueueRow`
For anything awaiting a decision. Dense — twelve visible on one screen,
not four. Always shows: **age**, who, what, amount if money, and the
action inline. Oldest first. Age is the most important column on a
decision queue and is currently absent everywhere.

### 2.5 Iconography
Contemporary, consistent, single-weight line icons from one set. Icons
carry meaning (unit, person, money, service, project, warning), never
decoration. No emoji in production surfaces.

### 2.6 `Map`
Where location is the point, not a coordinate in text: office pin and
radius in Settings, sign-in locations on Admin Home, camp or event
venues. Static, light, no heavy mapping dependency.

### 2.7 Density and contrast
Raise both. The current palette is near-white on near-white; the primary
action on Assign is effectively invisible. One accent colour means
"act on this" and is used for nothing else.

---

## Part 3 — Screen archetypes

Every screen is assigned exactly one. The archetype decides the layout;
the layout is not chosen per screen.

| Archetype | Shape | Screens |
|---|---|---|
| **Decision queue** | QueueRow list, age-sorted, action inline | Manager approvals, leave queue, finance requests, workflow checks |
| **Monitor** | Chart-led, Stats across the top, narrative beneath | Manager Overview, Admin Home, Group Pastor, Reports |
| **Record** | Profile shape — identity, then sections | Person, Project, Unit, Asset |
| **Entry** | Required fields only; everything else behind "Add more" | Assign, spend, registration |
| **Ledger** | Table, sortable, exportable | Finance, Cost, Attendance, registers |

Most screens need the correct primitive substituted, not a rewrite.

---

## Part 4 — Navigation

Features are currently discoverable only by someone who already knows
they exist. Projects can run a camp; nobody could tell from the screen.

- **Entry points name outcomes, not modules.** "Run an event", "Close a
  project", "Start a report" — surfaced where the person already is.
- **Work reaches people; people do not go looking for work.** A PFCC
  leader never opens a camp module. They see "9 of your 23 campers have
  not completed payment" on their own Home.
- **My Hub must appear in the sidebar.** It is currently reachable only
  by clicking your own name, which is a dead end.
- **One door to Messages**, not three.
- Every figure opens its rows. No exceptions.

---

## Part 5 — Ministry layer (the largest content gap)

The system reports on itself. It knows tasks and sessions; it knows
nothing about what the church did. Pastor Claude currently cannot see
his church in it.

### 5.1 Recurring ministry numbers
`recurring_operations` and `operation_occurrences` already exist, carry
`records_value` and `value_label`, and have never been used. This is
wiring, not building.

Each unit owes recurring numbers on a cadence — cells met, fellowships
held, offerings received, first timers, salvations.

**OPEN — CEAC must answer:** which unit owes which numbers, and how
often. Do not invent this list.

### 5.2 Service scoring
Distinct from the above and needs its own structure. Per service session
(Sunday, Midweek, Program), each serving department is scored 1–5 on:
expected personnel, present by cutoff, punctuality, coordination,
appearance and uniformity, set-up, teamwork.

The signal is **Sunday versus midweek**, not the absolute. In the August
data, Media scores 0.72 on Sunday and 0.067 midweek; Venue is consistent
at 0.90 and 0.88. Paired bars, with the existing "Stronger Sunday, weak
midweek" language.

A narrative field sits beside the numbers, as CEAC's own sheet does.

**Correction to a previous rule:** scoring a *department's service
delivery* is normal operational practice and is permitted. Scoring a
*person* remains forbidden. The earlier blanket ban was over-applied.

**OPEN — CEAC must answer:** who records the scores, and when.

### 5.3 Service department SOPs
The SOP skeleton (due end September) defines **expected personnel per
service**, which is the denominator scoring already depends on. SOPs are
therefore a data source, not a document.

Also supplies: standard reporting times (the punctuality baseline),
sub-units and roles, training processes, and a **solicitation trigger** —
when a department's personnel falls below its threshold, raise a flag.

**OPEN — two rulings needed:**
- The SOP defines seven per-person growth levels (Brefos → Pater). This
  is a discipleship ladder, not a performance score. Permitted?
- The SOP asks for award systems for high achievers. The brief forbids
  gamification. Recommendation: recognise departments, never rank
  individuals. Confirm.

### 5.4 Group Pastor's view
Cells met against expected, fellowships held, offerings by service and
currency, service scores across weeks, first timers and salvations —
as charts. Office delivery sits **beneath** this, not above it.

---

## Part 6 — Register and events

The camp is **not a feature and not a tab. It is a project.** Projects
already have a lead unit, participating units, phases, objectives,
budget, work and a close report.

### 6.1 Project register
A project may carry a register: a list of people, what each owes, what
each has paid, and their position in a chain of custody. One capability,
reused for camps, conferences, family services — anything the church
charges for.

**Ruled: the register belongs to projects generally**, not to a separate
events module. Fewer concepts, more reuse.

### 6.2 Money chain
EYC's four stages — camper pays representative, representative remits,
representative submits proof, records committee reconciles — are the
**two-sided transfer already in the system**, applied to many small
payments instead of one. Sender records, only receiver confirms, gap
visible to both.

The value made concrete: last year GHS 73,250 was collected and 68,791
remitted. That 4,459 gap was found by reconciling spreadsheets after
camp. Here it is visible on the day it opens, to the person responsible
and the committee above them.

### 6.3 Slots
Room types carry inventory (1,900 dormitory, 1,400 hostel). Full payment
only secures a slot. Allocation is decentralised to churches;
the central committee allocates only against full payment.

### 6.4 External portal — later
A public portal for registration and payment will come later and will
**feed this system as a data source**, exactly as the cell ministry
collection does. Build the register and its import seam now; the portal
plugs in without rework. Do not build the portal yet.

---

## Part 7 — Work capture and breakdown

### 7.1 Give out work stays primary
Corrected from an earlier proposal: **rooms do not replace "Give out
work."** The room is a side capture for work born in conversation. It
supplements; it does not become the main surface.

### 7.2 Capture from a room
When a manager states an expectation in a room, offer "Make this a
responsibility?" — one tap, assigned, traceable back to the message.

### 7.3 Required fields
Only four are mandatory on an assignment: **what needs doing, why it
matters, who, when.** Everything else — including the checklist — is
optional. Managers frequently give an outcome and let the person find
the method; the form must allow that.

### 7.4 Staff subtasks and the recipe library
Staff break their own work into subtasks.

The system suggests steps **from what that unit did last time** — not
from AI. A language model produces generic steps ("research, draft,
review"); what is valuable is the unit's own previous method.

Starts empty, learns from use, optionally pre-seeded by a manager.
Fully offline-reliable. After ten repetitions CEAC owns an institutional
method that survives the person leaving.

AI may later assist the cold-start case only, clearly labelled as a
suggestion. **No hosting change is required for this** — Vercel stays.

### 7.5 Projects
Manager-created. Staff may **propose** a project in one tap; the manager
confirms. Protects the accountability model without killing the flow.

---

## Part 8 — Finance corrections

- Departments must be able to **record their own spending** and see
  **where their funds came from**. Currently neither is possible.
- A **unit P&L** is required: in, out, committed, remaining — per
  currency, never summed across currencies.
- Transfers already record sender, receiver and purpose; they are simply
  not surfaced to the manager.

**OPEN — CEAC must answer:** if managers record their own spend, who
verifies it? Manager Finance was made read-only precisely so the person
recording money was not the only person seeing it.

---

## Part 9 — Known interface defects

- Workflows: machine language throughout ("Engine", "Workflow inbox",
  "Complete step"). Rename to **Checks**. Surface the count on Admin
  Home under *Needs you*. Show age on every row. "No — I did not
  approve this" must do something, not merely log.
- Overview: "1 needs decision" and "0 for project attention" are not
  clickable.
- Assign: primary action invisible against the background; voice input
  not enabled; section descriptions unclear.
- Team: "Give work" appears twice with no explanation of the difference.
  Team setup should precede People.
- Calendar: visually weak, especially on mobile. **Per-person Google
  Calendar sync belongs here**, in the manager's own hands — not hidden
  in an admin-only integrations screen.
- Finance tab labelled "Budget"; screen says something else.

---

## Part 10 — Sequence

1. **Design system primitives** (Part 2). Nothing else first.
2. **Ministry layer** (Part 5) — in parallel, since it supplies what the
   charts will show. Designing charts before the data exists repeats the
   original mistake.
3. **One screen rebuilt properly** — Manager Overview — as proof of
   direction, reviewed before any wave.
4. **Archetype waves** (Part 3).
5. **Register and events** (Part 6).
6. **Finance corrections** (Part 8).

---

## Part 11 — Open rulings, consolidated

Do not guess any of these.

1. Which recurring numbers each unit owes, and how often.
2. Who records service scores, and when.
3. Are per-person growth levels (Brefos → Pater) permitted?
4. Award systems — department recognition only, or individual?
5. If managers record their own spend, who verifies it?
6. Which report shapes exist beyond the three identified (office task,
   service performance, event register)?
