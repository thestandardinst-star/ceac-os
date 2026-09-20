# CEAC OS — instructions for coding agents

A staff operating system for CEAC, a church in Accra. Four surfaces:
staff, unit manager, Administration & HR, Group Pastor.

Stack: React + Vite (plain JavaScript, no TypeScript) → GitHub → Vercel
(auto-deploys `main`) → Supabase `efjljhftsesssumtshvp`.

## Read the specification before building a screen

`docs/architecture/` holds the real specifications. **Read
`docs/architecture/CEAC_OS_Architecture_Approved_Amendment_2026-09-20.md`
first for any work touching work types, templates, people/profile, reports,
Manager Home, Team, or Admin & HR People.** It is a binding approved
architecture amendment and supersedes conflicting older text. Then read
the panel spec for the surface you are touching **before** writing code,
not after.

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

5. **Claude applies all database migrations.** Ask for what you need and
   why. Two agents numbering migrations independently will collide and
   one will be lost.

6. **`npm ci && npm run build` must pass before you push.** Vercel
   deploys `main` automatically, so a broken push is a broken live site
   that a real church is using.

7. **Pull before you push, and never write back a file you only partly
   read.** A known connector bug silently truncates long files and
   commits the damage.

8. **No generative AI in CEAC OS.** Do not add Claude, OpenAI, another
   LLM, AI summaries, AI task breakdown, or an inference dependency.
   Intelligence is deterministic: context, rules, templates, recurrence,
   calculations, prefill and exception detection.

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

## Who owns which files

Claude owns the Administration & HR surface:
`AdminHome.jsx`, `Units.jsx`, `People.jsx`, `Attendance.jsx`,
`Cost.jsx`, `OfficeSettings.jsx`, `ExecutiveHome.jsx`

Codex owns the manager and staff surfaces:
`ManagerHome.jsx`, `ManagerDelivery.jsx`, `ManagerProjects.jsx`,
`Assign.jsx`, `Team.jsx`, `Home.jsx`, `Work.jsx`, `Item.jsx`,
`Record.jsx`, `Me.jsx`, `StaffTeam.jsx`, `Goals.jsx`

`src/App.jsx` and `src/components/bits.jsx` are shared — they hold the
menu and the routing. Add your own lines only. Never reorder or rewrite
them.

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
