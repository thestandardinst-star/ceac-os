# CEAC OS — instructions for coding agents

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
