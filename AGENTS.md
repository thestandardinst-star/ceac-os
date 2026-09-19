# CEAC OS — instructions for coding agents

A staff operating system for CEAC, a church in Accra. Four surfaces:
staff, unit manager, Administration & HR, Group Pastor.

Stack: React + Vite (plain JavaScript, no TypeScript) → GitHub → Vercel
(auto-deploys `main`) → Supabase `efjljhftsesssumtshvp`.

## Read the specification before building a screen

`docs/architecture/` holds the real specifications. Read the panel spec
for the surface you are touching **before** writing code, not after.

Both previous agents skipped this and built from memory. The result was a
screen asking a church administrator to paste GPS coordinates, and a
manager panel missing most of its function. Every hour spent rebuilding
those came from not reading a file that was already there.

## Rules

1. **Read the spec for the panel you are changing first.** See above.

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
  deliverable. **Only `task` uses a checklist** — guard the insert, not
  just the display.
- `blockers.state` is claimed | acknowledged | disputed | resolved.
  There is no `open`.
- Money is stored in pesewas as integers, shown in cedis.
- Waiting-on is two-sided: the person waiting and the unit being waited
  on both see it.
- Sub-teams are work lanes, not groups of people. A sub-team can hold
  work with nobody in it. A person can work across units.
- Media is the pilot unit, not the template. Nothing may be hard-coded
  to Media.

## Blocked, awaiting answers from CEAC — do not guess

- **Payroll**: which allowances and deductions beyond SSNIT and PAYE.
- **Leave entitlement by contract type**: one org-wide figure today.
- **Ministry calendar**: no document defines what it contains.
