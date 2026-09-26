# CEAC OS Experience V2 — Stage 3 Work Brief

Date: 26 September 2026
Status: ACTIVE
Stage: 3 — Core Component System
Start SHA: f1d53018000d4359809b9ff8ab0c85e4c84912d3

## Purpose

Turn the accepted Stage 2 design foundation into a reusable production component system so later screens cannot invent their own geometry, typography, icon treatment or interaction patterns.

Stage 3 does not rebuild role screens.

## Mandatory preflight

Before editing:
1. inspect PR #72 exact HEAD and checks;
2. read START_HERE.md and BUILD_STATE.md;
3. read DESIGN_FOUNDATION_V2.md;
4. read VISUAL_MIGRATION_BOUNDARY.md;
5. read STAGE2_ACCEPTANCE_RECORD.md;
6. inspect the persistent quality references if a visual choice is uncertain;
7. confirm no other writer is active.

## Component location

Use one V2 shared component area:
src/experience-v2/components/

Do not add V2 production primitives to:
- src/components/bits.jsx;
- legacy src/components/primitives;
- role screen files.

A small index export is allowed after the primitives are stable.

## 3A — Core controls and surfaces

Build first:
- Button
- IconButton
- Input
- Textarea
- Select
- Status/Badge
- Surface/Panel
- Tabs/Segmented control foundation
- Avatar

Requirements:
- consume Stage 2 tokens;
- consume CeacIcon registry, never Lucide directly;
- minimum touch targets respected;
- focus-visible;
- disabled/busy/invalid where relevant;
- semantic variants, not arbitrary colour props;
- no !important;
- no role-specific CSS;
- no invented one-off radius/shadow values.

Suggested semantic variants:
Button: primary, secondary, quiet, danger.
Surface: plain, soft, raised, feature.
Status: neutral, action, success, warning, danger.
Avatar: image, initials fallback, size roles.

Do not create ten variants because a future screen might need them. Add only reusable patterns supported by CEAC needs.

## 3A proof

Extend the protected Experience V2 gallery only.

Show:
- normal/hover/focus/disabled button states;
- icon button;
- form controls;
- invalid/help text;
- segmented/tabs;
- status badges;
- surface variants;
- avatar image/fallback proof.

Use reference-only content, not invented live CEAC facts.

Required screenshots:
- 390×844
- 1366×768
- 1440×900

## 3B — Operational/data primitives

After 3A passes, build:
- Stat/KPI tile;
- QueueRow;
- RecordRow;
- Action/Focus card;
- DataPanel;
- Table shell;
- progress/status distribution;
- timeline foundation where needed.

Rules:
- every authoritative number must remain drillable when used in real screens later;
- tables and rows must remain keyboard accessible;
- density should resemble the quality references, not oversized dashboard cards.

## 3C — Interaction/state primitives

After 3B passes, build:
- Tooltip/Popover/Menu;
- Drawer/Sheet;
- Modal/Dialog;
- Skeleton/Loading;
- Empty/Error/Configuration states;
- Toast/Confirmation.

Rules:
- focus management;
- escape/close behaviour;
- safe destructive actions;
- mobile sheet behaviour;
- no database jargon;
- Motion only where it clarifies state.

## Tests

Add architecture/component tests protecting:
- no direct lucide-react imports outside icons.jsx;
- no legacy icon imports;
- no !important in V2 component CSS;
- minimum semantic control geometry;
- keyboard/focus behaviour where practical;
- protected gallery mounting only;
- no role-screen migration during Stage 3.

Run full existing gates at each accepted substage.

## Visual quality gate

A component is not accepted because it renders.

Judge against the stored references for:
- typography;
- icon optical alignment;
- padding;
- control height;
- border/radius restraint;
- information density;
- responsive composition;
- focus/active state polish.

If a component needs a local hack in the gallery, fix the component/token instead.

## Do not touch

Stage 3 must not:
- change Supabase schema/migrations/RLS/RPC;
- change production data;
- modify frozen PR #71;
- rebuild Staff/Manager/Admin/Executive screens;
- rebuild the shell;
- start calendar/chart work;
- start Stage 12 enterprise integration work;
- start Stage 13 payroll.

## Exit gate

Stage 3 exits only when:
- all 3A/3B/3C primitives are implemented and visually inspected;
- V2 gallery proves them on phone/laptop/desktop;
- engineering gates are green;
- migration boundary remains clean;
- BUILD_STATE records exact accepted SHA and evidence.

Then Stage 4 may rebuild the shared shell.