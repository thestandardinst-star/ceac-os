# EXPERIENCE V2 IS THE ACTIVE PRODUCT-EXPERIENCE PROGRAMME

This section supersedes conflicting older UI/redesign sequencing text below. Security, RLS, data-integrity, audit, protected-HR, work-behaviour and enterprise authority contracts remain binding.

Before ANY UI/product-experience change, read in this order:

1. docs/experience-v2/START_HERE.md
2. docs/experience-v2/BUILD_STATE.md
3. docs/experience-v2/CEAC_OS_EXPERIENCE_V2_SOURCE_OF_TRUTH.md
4. docs/experience-v2/IMPLEMENTATION_SEQUENCE.md
5. docs/experience-v2/REFERENCE_INDEX.md
6. docs/experience-v2/ACCEPTANCE_AND_HANDOFF.md
7. docs/experience-v2/DECISION_LOG.md
8. this AGENTS.md file in full
9. the current domain/security contract for the capability being touched.

Mandatory continuation rule:
- GitHub is the build source of truth, not Chat/Work memory.
- Chat and Work may alternate, but only ONE active writer may mutate the Experience V2 branch at a time.
- An incoming session MUST inspect the current branch HEAD and BUILD_STATE.md before editing.
- If Work stops with unpushed changes, Chat MUST NOT overwrite/recreate them; recover and push that state first.
- Every meaningful substage ends in a pushed commit, relevant tests, and an updated BUILD_STATE.md.
- No important design decision, reference, defect, blocker or TODO may live only in a conversation.

Active Experience V2 branch:
chatgpt/experience-v2-2026-09-26

Experience V2 baseline:
1a0fb33d3fff18ddae63e6523547b4f4d5d5c883

PR #71 Stage 12 remains frozen while Experience V2 is active. Do not update, merge, rebuild or discard it unless the product owner explicitly changes this programme.

The Experience V2 implementation sequence is a gate sequence. Do not propagate redesign work past the current stage recorded in BUILD_STATE.md.

The user-supplied visual and motion references are persisted outside chat and mapped by REFERENCE_INDEX.md. Do not substitute from memory if they are unavailable.

---

# CEAC OS — instructions for coding agents

## PREMIUM REDESIGN PROGRAMME — READ THIS BEFORE ANY UI WORK

The product owner has explicitly replaced the current visible product direction with the premium redesign programme on this branch.

Before changing any route, role shell, navigation, page composition, styling, iconography, messaging surface or interaction pattern, read in this order:

1. `docs/design/CEAC_OS_PREMIUM_REDESIGN_SOURCE_OF_TRUTH_2026-09-23.md`
2. `docs/handoff/CEAC_OS_PREMIUM_REDESIGN_HANDOFF_2026-09-23.md`
3. this file in full;
4. the existing security/data/domain contract for the capability being surfaced.

The premium redesign contract supersedes conflicting older **UX/navigation/visual** decisions on this redesign branch. It does **not** supersede security, RLS, data-integrity, audit, protected-HR, work-behaviour or capability-authority contracts.

The approved master mockup and the source-of-truth document are binding. Do not substitute icons, palette, information architecture, role composition or generic admin-template UI because it is easier to implement. Any deliberate visual/product deviation requires explicit product-owner approval and a contract update first.

The redesign sequence is R0 shell/design foundation → R1 Staff → R2 Manager → R3 Administration/HR → R4 Group Pastor/CEO → R5 communication consolidation → R6 whole-system visual consistency → R7 closure. Do not run multiple redesign tranches in parallel.

**Stage 12 remains paused while the redesign programme is active unless the product owner explicitly resumes enterprise expansion.**


A staff operating system for CEAC, a church in Accra. Four surfaces:
staff, unit manager, Administration & HR, Group Pastor.

Stack: React + Vite (plain JavaScript, no TypeScript) → GitHub → Vercel
(auto-deploys `main`) → Supabase `efjljhftsesssumtshvp`.


## Enterprise expansion programme — read this first

The current whole-system expansion programme is governed by:

1. `docs/handoff/CEAC_OS_ENTERPRISE_EXPANSION_HANDOFF_2026-09-22.md`
2. `docs/architecture/CEAC_OS_Enterprise_Expansion_Architecture_2026-09-22.md`
3. the current domain-specific architecture/security document for the work being changed.

The enterprise expansion architecture is the newest approved whole-system sequencing contract. Its stages are gates. Do not start Stage 1 or later work while Stage 0 is open, and do not build a later enterprise stage in parallel with an unfinished earlier stage.

For every consequential feature use this order: purpose → authority → data → sensitive-data classification → lifecycle → audit → reversal → migration/RLS/RPC → tests → UI → acceptance → handoff. A screen is not proof that a feature exists securely.


### Locked continuation sequence — do not skip or parallelise

From the current programme state onward, the only approved enterprise build sequence is:

`Stage 5 Work Management 2.0 → merge to main → Stage 6 Resource & Workload → merge → Stage 7 Performance & Development → merge → Stage 8 Learning → merge → Stage 9 Workforce Management 2.0 → merge → Stage 10 Assets & Devices → merge → Stage 11 Compliance & Policy → merge → Stage 12 Integrations → merge → Stage 13 Payroll only after CEAC payroll rules are formally confirmed → merge → Stage 14 Search & Intelligence → merge → Stage 15 Assistive AI → merge → whole-system inspection → production closure.`

Rules for every future agent:
- inspect GitHub before editing; `main` is the source of truth;
- never start stage N+1 until stage N is fully green and merged into `main`;
- branch the next stage from the latest merged `main`, never from an older stage branch;
- do not carry forward failed, stale or stacked PR history;
- each stage must pass CI, clean migration replay, Account Security, all cumulative SQL/security gates, browser/role acceptance, persistence/responsive checks and deployment validation before merge;
- update the enterprise handoff after each merge with exact main SHA, latest migration and next stage;
- if a stage depends on unconfirmed CEAC policy, stop at that gate instead of inventing rules;
- Stage 13 Payroll is explicitly blocked until CEAC confirms the payroll rule set listed in the architecture;
- after Stage 15, do not declare the product complete until the whole-system inspection and production-closure checklist pass.

This sequence is binding unless the product owner explicitly changes it.

## Read the specification before building a screen

`docs/architecture/` holds the real specifications. **Read
`docs/architecture/CEAC_OS_Architecture_Approved_Amendment_2026-09-20.md`
first for any work touching work types, templates, people/profile, reports,
Manager Home, Team, or Admin & HR People.** It is a binding approved
architecture amendment and supersedes conflicting older text. Then read
the panel spec for the surface you are touching **before** writing code,
not after.

**For the current redesign phase, read these before changing any role surface:**
1. `docs/handoff/CEAC_OS_PRODUCT_INTELLIGENCE_REDESIGN_HANDOFF_2026-09-21.md`
2. `docs/architecture/CEAC_OS_Product_Intelligence_Experience_Amendment_2026-09-21.md`
3. `docs/security/CEAC_OS_Product_Intelligence_Security_Handoff_2026-09-21.md`
4. the relevant panel spec;
5. `docs/architecture/CEAC_OS_Design_System_v1.md`.

For Staff/Manager responsive/PWA/Rooms work also read `docs/architecture/CEAC_OS_Product_Experience_Collaboration_PWA_Amendment_2026-09-21.md`. For voice, assistive AI, Rooms 2.0, sub-team communication, meeting audiences or Calendar interaction, also read `docs/architecture/CEAC_OS_Assistive_Input_Collaboration_Amendment_2026-09-21.md`.

The Product Intelligence & Experience amendment is the newest approved product-experience decision and supersedes conflicting older product/meeting UX text. It does not weaken older security/database contracts.**

Both previous agents skipped this and built from memory. The result was a
screen asking a church administrator to paste GPS coordinates, and a
manager panel missing most of its function. Every hour spent rebuilding
those came from not reading a file that was already there.

## Rules

1. **Read the approved 20 September architecture amendment and the spec
   for the panel you are changing first.** See above.

2. **Never invent data.** If a table does not exist, say the feature is
   not yet in the system. Do not render an empty shell that looks
   built, and do not compute a number from nothing. A church will make
   real decisions about real people from these screens.

3. **No score, rating, ranking, or league table attached to a person.**
   The brief calls an invented weighted number the most damaging thing
   this system could produce. There is deliberately no column to store
   one. Show components; leave judgement to humans.

4. **Plain English on every screen.** The users are church
   administrators, not developers. No "threshold", "heartbeat", "job
   run", "sync", "payload", or coordinates. If a ten-year-old would not
   understand the sentence, rewrite it.

5. **Database migrations must have one active owner at a time.** Read the
   current redesign handoff and latest migration list before creating another
   migration. Never number migrations independently, create a parallel migration
   sequence, or recreate an applied migration.

6. **`npm ci && npm run build` must pass before you push.** Vercel
   deploys `main` automatically, so a broken push is a broken live site
   that a real church is using.

7. **Pull before you push, and never write back a file you only partly
   read.** A known connector bug silently truncates long files and
   commits the damage.

8. **AI is assistive only.** The approved 21 September Assistive Input &
   Collaboration amendment supersedes the earlier blanket no-AI rule.
   Server-side inference may be used for transcription, structured extraction
   and user-reviewed drafting. It may not score/rank people, make HR/finance/
   access decisions, approve work, or silently write consequential records.
   Never expose provider credentials in the browser. Core operation must still
   work when inference is unavailable.

9. **The seven work kinds are behaviours, not labels.** Keep one shared
   Work Engine, but implement the type-specific contracts in the approved
   20 September amendment. Do not collapse everything into Task.

10. **Security migrations 034–039 are live. Do not recreate or weaken
    them.** Profile privilege fields are protected, client writes to
    `activity_events` are blocked, routine occurrences are append-only,
    project reports stay at the manager's unit altitude, background jobs
    are service-only, and reference RPCs validate caller scope. Read
    `docs/security/CEAC_OS_Security_Hardening_2026-09-20.md` before
    changing any of those contracts.

## Current implementation ownership

The historical Claude-vs-Codex file split is retired for the Product Intelligence & Experience phase.

**One active implementation owner at a time** may change a tranche. The current handoff document records the active branch and sequence. A new agent must inspect the branch/PR state before editing and must not start a parallel redesign branch from stale main.

Shared shell files such as `src/App.jsx`, `src/components/bits.jsx`, shared styles, navigation, routing and schema contracts require whole-system review because they affect all four roles.

Before touching database migrations, confirm the latest applied migration and current migration owner. Before touching a role surface, read that role's panel spec plus the current Product Intelligence amendment.

## Work references

Use the database function. Never calculate the next number in the client
with `count + 1` — concurrent managers get the same reference, and
cancelled work reuses numbers.

```js
const { data: ref, error } = await supabase
  .rpc("next_work_ref", { p_unit_id: unitId, p_sub_team_id: subTeamId || null });
```

Returns `MED-014`, or `MED-GFX-014` with a sub-team. `units.code` is
canonical — never derive a code from the initials of a unit name.

## Things that are true about this codebase

- Work kinds: task, routine, case, request, decision, meeting_outcome,
  deliverable. They have different approved behaviours. **Only `task`
  uses the existing completion checklist today**; do not silently give
  another type Task semantics. Routine means recurrence and must build on
  `recurring_operations` / `operation_occurrences` rather than a duplicate
  recurrence engine.
- `blockers.state` is claimed | acknowledged | disputed | resolved.
  There is no `open`.
- Money records carry `currency` + `amount_minor`. Never assume GHS,
  never combine different currencies into one total, and do not perform
  currency conversion in the client.
- Waiting-on is two-sided: the person waiting and the unit being waited
  on both see it.
- Sub-teams are work lanes, not rigid people silos. A sub-team can hold
  work with nobody in it and a person can work across units/sub-teams.
  Team and Admin People still group people by their actual sub-team
  memberships for understandable presentation; that grouping does not
  create a new permission boundary.
- Media is the pilot unit, not the template. Nothing may be hard-coded
  to Media.
- Do not add Ghana Card, SSNIT, tax, banking or other protected HR data
  to `profiles`. The approved HR architecture requires a separate
  protected contract. New `profiles` columns are not automatically
  protected by the current self-update guard.
- `activity_events` is authoritative history. Application clients read
  permitted events but do not insert them directly; use an authorised
  server-side RPC/trigger when a new event type is implemented.
- `operation_occurrences` is append-only to application users until an
  attributable correction path is built.

## Blocked, awaiting answers from CEAC — do not guess

- **Payroll**: which allowances and deductions beyond SSNIT and PAYE.
- **Leave entitlement by contract type**: one org-wide figure today.

## Continuing without Claude

Everything needed is in the repository. No step requires asking Claude.

1. `docs/architecture/CEAC_OS_Experience_Data_Architecture_v2.md` — every
   design and product decision, in build sequence, with the reasoning.
2. `docs/reference/manager-overview.html` — the approved visual target.
   Open it in a browser and match it.
3. `src/components/primitives/` — the six built primitives. `System →
   Primitives` in the app demonstrates each against live data.
4. `docs/QUESTIONS_FOR_CEAC.md` — the remaining open questions. They are
   not gates for the redesign; build with the documented defaults and keep
   the switches reversible.

Before adding a migration, inspect the repository and production migration
history, use the next available version, and keep the schema change inside
the staged PR that requires it. Never invent CEAC policy to justify a migration.
## Before designing or rebuilding any screen

Read `docs/architecture/CEAC_OS_Experience_Data_Architecture_v2.md`.

It records a page-by-page review of all 58 screens and every design and
product decision taken since. Two findings drive it: only 1 screen
contains a chart, none contains a table, and 12 primitives are used over
2,000 times — so every screen renders as cards of form fields whatever
its job.

Build the missing primitives first (table, chart with a mandatory
chart/table toggle, linked stat, dense queue row, icon set, map). Until
they exist, any redesign becomes cards again.

Part 11 lists two open questions that do not block the redesign. Use the documented defaults; do not invent additional CEAC policy.
