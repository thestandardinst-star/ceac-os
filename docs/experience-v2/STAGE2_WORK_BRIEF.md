# CEAC OS Experience V2 — Stage 2 Work Brief

Status: ACTIVE
Stage: 2 — Design Foundation V2
Current implementation line: draft PR #72

## Before editing

Read:
1. docs/experience-v2/START_HERE.md
2. docs/experience-v2/BUILD_STATE.md
3. docs/experience-v2/DESIGN_FOUNDATION_V2.md
4. docs/experience-v2/REFERENCE_INDEX.md
5. docs/experience-v2/ACCEPTANCE_AND_HANDOFF.md
6. docs/experience-v2/DECISION_LOG.md
7. AGENTS.md

Inspect the exact branch HEAD and current checks first.

## Already completed in Stage 2

- design-foundation contract created;
- Instrument Sans retained and token hierarchy ratified;
- Lucide React selected as the single production icon family;
- Motion for React selected as the production motion library;
- src/experience-v2.css added as an isolated opt-in foundation layer;
- the V2 CSS foundation is loaded after premium-parity.css;
- V2 foundation contract tests added;
- no role screen has been rebuilt yet.

## Next implementation actions

Do these in order.

### 2B — Install the selected dependencies

From the latest Experience V2 branch:
- install lucide-react;
- install motion;
- update package.json and package-lock.json together;
- use normal npm dependency resolution;
- do not hand-edit lockfile versions;
- do not install Motion+;
- do not add a second icon package.

Run:
- npm ci;
- npm run build;
- npm audit --audit-level=high.

Commit and push before moving to 2C.

### 2C — Create the single CEAC V2 icon registry

Create a V2 registry under a clearly named V2/shared path.

Requirements:
- screens consume semantic CEAC icon names through the registry;
- only the registry imports Lucide components;
- default strokeWidth 1.75;
- semantic sizes follow DESIGN_FOUNDATION_V2.md;
- currentColor;
- accessible title/label support when an icon is meaningful by itself;
- decorative icons are aria-hidden;
- do not delete legacy icon systems yet;
- do not add new names to legacy hand-built dictionaries.

Registry should cover, at minimum:
home, work, team/people, person, record, calendar, projects, portfolio, ministry, organisation, finance, reports, messages, search, plus/create, notifications, more, settings/control, learning, assets, compliance, time/clock, warning, check, arrow/chevron, location, chart, table.

Commit and push.

### 2D — Add app-level motion policy

Use Motion for React from motion/react.

Requirements:
- central MotionConfig;
- reducedMotion="user" or equivalent user-preference-respecting behaviour;
- do not animate the whole existing app;
- expose reusable V2 transition/spring constants matching DESIGN_FOUNDATION_V2.md;
- keep CSS transitions for simple colour/hover changes;
- reserve Motion for layout/state/enter-exit/shared-element behaviour.

Commit and push.

### 2E — Build a contained V2 foundation gallery/proof

Do not rebuild role screens.

The gallery must demonstrate:
- typography roles;
- spacing;
- neutral/semantic surfaces;
- primary and secondary controls;
- Lucide icon sizing and optical weight;
- status treatment;
- one compact operational row;
- one stat surface;
- one layout transition using Motion;
- reduced-motion behaviour;
- phone and laptop composition.

It may reuse the existing Primitives diagnostic route or create a clearly development-only V2 foundation surface. Do not add a new primary navigation destination for ordinary CEAC users.

### 2F — Stage 2 quality gate

Inspect the foundation against the persistent Library references:
CEAC OS / Experience V2 / References / Original Quality References

Required evidence:
- approximately 390×844;
- approximately 1366×768;
- 1440px+ if available.

Judge:
- typography;
- iconography;
- spacing;
- geometry;
- surface treatment;
- control proportions;
- information density;
- motion feel;
- reduced motion;
- no legacy-screen visual regressions.

Then run:
- CI;
- Migration Replay;
- Account Security;
- full Quality Gate;
- exact-head Vercel status.

Update BUILD_STATE.md with:
- exact accepted SHA;
- dependency versions actually installed;
- files changed;
- visual evidence location;
- remaining issues.

Do not start Stage 3 until Stage 2 is visually accepted.

## Do not touch in Stage 2

- Supabase schema/migrations;
- RLS/RPC;
- production data;
- frozen PR #71;
- enterprise Stage 12 code;
- Staff/Manager/Admin/Executive role-screen composition;
- payroll/search/AI stages;
- legacy CSS except where a build break requires a narrowly justified correction.

## Stop conditions

Stop rather than guess if:
- current branch HEAD differs from BUILD_STATE and cannot be reconciled;
- another writer is actively modifying the same branch;
- npm resolution introduces a high-severity dependency problem;
- the selected icon or motion package cannot work with the current React/Vite stack;
- a change would require altering CEAC security/data contracts.

At every stop, push recoverable work and update BUILD_STATE.md.