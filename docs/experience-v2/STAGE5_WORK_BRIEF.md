# CEAC OS Experience V2 — Stage 5 Work Brief

Date: 27 September 2026
Status: BINDING FOR STAGE 5
Stage: 5 — Keystone 1: Staff Today

## 1. Purpose

Stage 5 proves the personal-workspace quality bar on Staff Today.

This stage rebuilds the visible Staff Today composition only. It does not redesign Staff Work, Team, Calendar, Messages, My Hub, Manager, Administration/HR or Executive content.

The accepted Stage 4 shell remains the navigation contract.

## 2. Authority and data boundary

The existing Staff Today data and actions remain authoritative.

Preserve without semantic change:

- current work-session start/end/reconciliation behaviour;
- current `startWork`, `endWork` and `reconcileWorkSession` paths;
- assigned active work;
- completed-this-week evidence;
- alerts;
- feedback;
- announcements and acknowledgement attention;
- ministry events;
- upcoming meetings;
- room mentions;
- birthdays;
- leave decisions and upcoming approved leave;
- review submissions and bounded review follow-ups;
- blockers/dependencies and bounded dependency follow-ups;
- current role/RLS/RPC/auth boundaries;
- current click-through behaviour to work items, meetings, Rooms, announcements and related records.

Do not:

- add or alter Supabase queries merely for visual convenience;
- invent new counts or inferred performance measures;
- create staff ranking, comparison or an overall score;
- turn presence/work-session data into a performance judgement;
- remove provenance/drill-in from authoritative information;
- broaden route or data authority.

## 3. Existing implementation audit

Current data/business logic lives in `src/screens/Home.jsx`.

The screen currently performs the required Staff Today data loading and derives:

- returned, overdue and due-today work;
- active work;
- waiting-for-review work;
- waiting-on-dependency work;
- due-soon work;
- announcement acknowledgement attention;
- update/movement context;
- current and stale work-session state;
- next work and next meeting.

That logic is not the design problem and should stay in place.

The visible layer is the problem.

The exact pre-Stage-5 rendered proof shows:

- the page is too long for a daily personal workspace;
- hero, calendar, next-work card, attention, waiting, coming-up, weekly record, ministry record and Explore modules compete rather than forming one clear hierarchy;
- the desktop composition still carries legacy reference components rather than the accepted V2 component language;
- the mobile page repeats secondary/navigation content and requires excessive scrolling before the user reaches the end;
- the work-session panel competes visually with the hero image and loses clarity at phone width;
- legacy icon/components remain inside the Today page even though the shell is now V2;
- empty secondary sections occupy space instead of allowing the page to become calmer;
- the current module strip duplicates navigation already provided by the accepted Stage 4 shell.

These are presentation defects, not reasons to rewrite domain logic.

## 4. Product hierarchy

Staff Today answers one question:

**What do I need to do now?**

The visible order is locked for Stage 5:

1. identity/context and greeting;
2. current work-session state and its one immediate action;
3. one dominant next work/meeting action;
4. today's immediate schedule/context;
5. Needs your attention — render only when there is actual attention;
6. Updates — render only when something changed;
7. Waiting on others — render only when something is actually waiting;
8. Coming up — next few days;
9. This week — compact factual personal evidence with drill-in;
10. Announcements — only when records exist.

The ordinary page must not render a duplicate Explore/navigation module.

The ordinary page must not make recurring ministry-number capture compete with the daily personal-work hierarchy. Stage 5 does not delete that underlying capability or data; it removes it from the Staff Today keystone composition.

## 5. Dominant next action

Use one clear focus surface.

Priority:

1. returned work;
2. overdue work;
3. due-today work;
4. active in-progress work;
5. due-soon work;
6. next meeting when no work item requires action;
7. calm clear state when none applies.

Do not claim urgency beyond the facts already stored.

The focus action must open the exact authoritative work/meeting record.

## 6. Work-session surface

The work-session state remains visible near the top.

Required states:

- not working → **Start work**;
- active → elapsed/working context + **End work**;
- stale session → **Review** plus existing reconciliation path.

Existing start/recovery overlays may remain on the proven workflow path during Stage 5; changing their data behaviour is out of scope.

The surface may not imply continuous location tracking.

## 7. V2 component boundary

New Staff Today presentation should prefer the accepted Stage 3 primitives:

- `Surface`;
- `Button`;
- `StatusBadge`;
- `ActionFocusCard`;
- `DataPanel`;
- `QueueRow`;
- `StatePanel` only where an explicit state panel adds value;
- `CeacIcon` from the central V2 icon registry.

Do not import the legacy hand-built icon dictionary into new Stage 5 presentation code.

The safest architecture is:

- keep data fetching and work-session business actions in `Home.jsx`;
- move the new visible composition into an isolated Experience V2 Staff Today presentation component;
- add an isolated Stage 5 stylesheet under `src/experience-v2/staff-today/`;
- load that stylesheet after the shared V2 component/shell styles;
- do not add another global parity stylesheet;
- do not add new `!important`.

## 8. Desktop/laptop composition

1366×768 is a first-class target.

Use a deliberate content max width rather than stretching across the full workspace.

Recommended composition:

- compact page intro;
- work-session surface directly under/alongside the intro without image-text collision;
- primary two-column focus region:
  - dominant next action left;
  - today's schedule/context right;
- operational content below in a balanced grid where information relationships justify it;
- no oversized dashboard-card wall;
- no content that requires horizontal scrolling.

The page should feel denser than a marketing dashboard but calmer than a manager/admin console.

## 9. Mobile composition

Phone widths: 320, 360, 375, approximately 390×844, 414 and 430.

Mobile is recomposed, not desktop squeezed.

Required:

- one column;
- 16px gutter, 12px permitted at 320 only if required;
- work-session action stays obvious;
- dominant focus appears before secondary context;
- attention rows remain readable without truncating essential meaning;
- no duplicate shell/navigation shortcuts inside page content;
- bottom shell navigation remains unobstructed;
- no horizontal overflow;
- 44px practical touch targets;
- sections with no meaningful content disappear rather than becoming empty card clutter.

## 10. Typography and icon rules

Use Instrument Sans and V2 semantic type roles.

12px remains the operational floor.

Use one Lucide-backed CEAC icon language.

No smaller text to solve density.

No new local icon dictionary.

## 11. Visual reference comparison

Required references:

- `CEAC_original_premium_mockup.jpeg`;
- `quality_reference_dashboard.jpeg`;
- `quality_reference_typography_cards_icons.jpeg`;
- `quality_reference_mobile_spacing.jpeg`;
- `quality_reference_mobile_navigation.jpeg`.

Use them for:

- hierarchy;
- spacing;
- card/surface proportion;
- icon optical weight;
- density;
- mobile composition;
- restrained premium treatment.

Do not copy unrelated product branding or decorative data.

The historical Staff Panel mockup/spec may inform the Home principles of calm hierarchy, one obvious next action and attention-first personal work, but it does not override the accepted Stage 4 navigation contract or current CEAC domain/security architecture.

## 12. Focused Stage 5 acceptance

Engineering:

- CI PASS;
- Migration Replay PASS;
- Account Security PASS;
- Complete Quality Gate PASS;
- Vercel PASS.

Functional proof:

- not-working Staff can open Start work;
- active session exposes End work;
- stale-session recovery remains available;
- next authoritative work opens;
- next meeting opens when used as focus;
- attention rows open their record;
- waiting rows preserve bounded follow-up behaviour;
- announcements remain reachable;
- existing Staff/Manager real-work-loop acceptance remains green.

Visual proof:

- 320px phone;
- approximately 390×844 phone;
- 1366×768 laptop;
- 1440×900 desktop for stretch control;
- populated state;
- calm/low-content state where fixture data permits;
- no horizontal overflow;
- no sub-12px visible text;
- no legacy icon inside the new Staff Today presentation;
- direct side-by-side review against stored references.

## 13. Test migration rule

Existing legacy visual tests that assert the old Staff Today class names may be updated only when the new Stage 5 contract replaces that exact presentation.

Do not weaken:

- role assertions;
- functional actions;
- data assertions;
- accessibility assertions;
- overflow checks;
- security/RLS/RPC tests.

A test may change from a legacy selector to the new V2 Staff Today selector, but not from a real assertion to a placeholder.

## 14. Exit gate

Stage 5 is accepted only when:

- the Staff Today visible layer is genuinely V2;
- preserved Staff Today behaviour remains green;
- phone and laptop proof are directly inspected;
- reference comparison passes;
- exact-head engineering gates are green;
- no high-severity visual or functional defect remains.

Only then may Stage 6 — Manager Overview begin.
