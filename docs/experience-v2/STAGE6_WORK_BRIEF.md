# CEAC OS Experience V2 — Stage 6 Work Brief

Date: 27 September 2026
Status: BINDING FOR STAGE 6
Stage: 6 — Keystone 2: Manager Overview

## 1. Purpose

Stage 6 proves the manager command-centre pattern and the original CEAC operational-dashboard direction.

This stage rebuilds the visible Manager Overview only.

It does not redesign Manager Work, Team, Projects, Calendar, Finance, Reports, Messages, My Hub, Administration/HR or Executive content.

The accepted Stage 4 shell remains the navigation contract.

## 2. Authority and data boundary

`src/screens/ManagerHome.jsx` currently contains substantial live business logic. That logic is not to be rewritten for visual convenience.

Preserve without semantic change:

- work submissions awaiting manager review;
- approve and return-for-correction decisions;
- submission evidence/checklist handling;
- pending leave requests;
- manager leave approval/decline/escalation limit behaviour;
- incoming and outgoing blockers/dependencies;
- acknowledge/disagree/resolve blocker actions;
- review/blocker follow-up alerts;
- team presence and approved-leave context;
- completed/submitted work movement;
- manager's own urgent work;
- unit projects/objectives/deliverables;
- upcoming project dates;
- meetings and meeting scheduling;
- incoming cross-unit work requests;
- recurring operations;
- recent work movement;
- `unit_budget_position` finance RPC data;
- factual Sunday-versus-midweek movement;
- existing drill-in to work, people, projects and meetings;
- current auth, capability, RLS and RPC authority.

Do not:

- infer a performance score from presence, completion counts or submissions;
- rank staff;
- compare staff as better/worse;
- convert availability into performance judgement;
- invent project risk, financial or productivity data;
- weaken manager/admin boundaries;
- change RLS/RPC authority;
- duplicate reporting logic.

## 3. Current implementation audit

Current business/data container:
- `src/screens/ManagerHome.jsx`

Current visible layer still depends heavily on legacy presentation:
- `ReferenceFocusPanel`;
- `DashboardCalendar`;
- `ReferenceModuleStrip`;
- legacy `Stat`, `StatRow`, `QueueRow` and `Chart`;
- legacy home-panel/card mosaic classes;
- legacy Sheet decision presentation.

The exact pre-Stage-6 rendered proof shows a real product-design problem even though functionality is strong:

Desktop/laptop:
- the scenic hero consumes disproportionate command-centre space;
- a separate fixed-style calendar rail competes with the main decision area;
- many equal-weight cards fragment attention across decisions, movement, projects, blockers, team context, week, own work, requests, routines and recent movement;
- large empty regions appear because the mosaic does not rebalance when sections are quiet;
- the factual Sunday/midweek chart is visually oversized relative to its small data volume;
- the Explore CEAC OS module strip duplicates navigation already owned by the V2 shell;
- priority/decision work is not visually dominant enough.

Mobile:
- desktop/reference compositions are effectively stacked rather than intentionally recomposed;
- the hero remains too dominant;
- schedule appears before the manager's actual decision queue;
- the old Next up reference card is visually awkward when stacked;
- the duplicate Explore module grid appears below the fixed mobile navigation;
- the current R2 mobile proof can capture an intermediate loading state because its acceptance test does not wait for a stable Manager Overview state.

These are presentation/test-readiness problems, not reasons to rewrite manager domain logic.

## 4. Manager Overview product question

Manager Overview answers:

**What needs my decision, what is at risk, and what should I look at next?**

The screen must make decision authority obvious without turning team context into staff scoring.

## 5. Locked information hierarchy

The visible order for Stage 6 is:

1. Manager/unit/date context;
2. compact primary manager action — Give out work;
3. Decisions needing you;
4. Today/next schedule context;
5. Team context — availability separated from work movement;
6. Delivery risk — projects and dependencies;
7. Requests to your unit;
8. Finance/budget position;
9. Coming up — meetings/project dates/week;
10. factual recorded movement when data exists;
11. manager's own work;
12. recurring operations and recent movement as lower-priority context.

Sections with no meaningful content should become quiet concise states rather than permanent equal-sized cards.

The ordinary Overview must not render the duplicate Explore/module navigation strip.

## 6. Decisions needing you

This is the command-centre keystone.

Decision sources include:
- submitted work awaiting review;
- pending leave requiring manager action;
- follow-up alerts that require attention;
- incoming blocker claims requiring acknowledge/disagree.

Use a single coherent decision queue ordered by actual actionable state, not by invented scoring.

Each row must preserve:
- person/work/request identity;
- factual timing/provenance;
- exact available action;
- drill-in to the authoritative record.

Existing review/leave/blocker workflows must remain reversible and human-controlled.

## 7. Team context

Keep availability separate from output.

Availability may show factual:
- present today;
- approved leave today.

Work movement may show factual:
- completed today;
- submitted today;
- awaiting review.

Do not combine these into a score, colour grade or ranking.

People drill-in may remain available from factual groups.

## 8. Delivery risk

Combine related operational risk instead of scattering it across unrelated cards:

- projects with at-risk/not-met objectives;
- objectives with no active work;
- open deliverables;
- projects ending soon;
- blockers/dependencies;
- incoming requests where another unit is waiting.

Use explicit counts and record links only from stored facts.

Do not infer a risk probability.

## 9. Finance snapshot

Use the existing `unit_budget_position` RPC result.

Manager Overview should show a compact unit financial position, not recreate the full Finance screen.

Required:
- currency identity;
- approved/available/committed/spent values only as supplied by the existing RPC;
- link/drill to Finance for detail.

No calculated financial KPI should be added unless already defined by authoritative data.

## 10. Schedule and coming up

Replace the legacy right rail with a compact V2 schedule/coming-up treatment.

Preserve:
- upcoming meetings;
- meeting scope/project context;
- meeting opening;
- manager Schedule meeting action;
- upcoming project end dates.

The schedule must support the command centre rather than becoming a second dashboard.

## 11. Recorded movement

The existing Sunday-versus-midweek comparison is factual and may remain when data exists.

It must continue to state that it is recorded work movement, not a performance score.

Prefer a compact V2 comparison treatment proportional to the amount of data.

Do not create decorative charts without meaningful data.

## 12. V2 component boundary

New Manager Overview presentation should prefer the accepted V2 system:

- `Surface`;
- `Button`;
- `StatusBadge`;
- `StatTile`;
- `ActionFocusCard` only where one dominant action genuinely exists;
- `DataPanel`;
- `QueueRow`;
- `RecordRow`;
- `TableShell` when tabular structure is real;
- `StatePanel`;
- `Skeleton`;
- `CeacIcon` from the central registry.

Safest architecture:

- keep queries, derived state and decision functions in `ManagerHome.jsx`;
- move the new visible composition to `src/experience-v2/manager-overview/ManagerOverviewV2.jsx`;
- add isolated `src/experience-v2/manager-overview/manager-overview.css`;
- load that stylesheet after shared V2 component/shell styles;
- no new global parity layer;
- no new `!important`;
- no new icon dictionary.

Existing decision Sheets may remain on their proven workflow path during Stage 6 unless direct visual acceptance proves they materially break the V2 experience. Do not rewrite authority flows merely for styling.

## 13. Desktop/laptop composition

1366×768 is the primary manager target.

Use a deliberate content max width.

Recommended composition:
- compact context/action header;
- first operational region: decision queue plus schedule/next context;
- second region: team context plus delivery risk;
- compact finance and coming-up support;
- lower-priority movement/own-work/routines below.

Do not produce a wall of equal dashboard cards.

No fixed secondary content rail should force the working area to become narrow.

## 14. Mobile composition

Required widths:
- 320;
- 360;
- 375;
- approximately 390×844;
- 414;
- 430.

Mobile is recomposed.

Required:
- decision queue before secondary dashboard context;
- Give out work remains easy to reach;
- schedule/coming-up becomes a normal one-column panel;
- no desktop scenic hero treatment dominating the viewport;
- no duplicate Explore/module navigation;
- no fixed right-rail remnants;
- 44px practical controls;
- bottom navigation remains unobstructed;
- no horizontal overflow;
- no text below the 12px operational floor.

## 15. Visual references

Required comparison:
- `CEAC_original_premium_mockup.jpeg`;
- `quality_reference_dashboard.jpeg`;
- `quality_reference_typography_cards_icons.jpeg`;
- `quality_reference_mobile_spacing.jpeg`;
- `quality_reference_mobile_navigation.jpeg`.

Use them for:
- command-centre hierarchy;
- density;
- card proportion;
- restrained surfaces;
- icon weight;
- typography;
- responsive composition.

Do not copy unrelated branding, fake metrics or decorative charts.

The accepted Stage 5 Staff Today is also a local reference for:
- V2 surface restraint;
- conditional sections;
- phone recomposition;
- separation of business logic from presentation.

Manager Overview should remain denser and more operational than Staff Today.

## 16. Focused Stage 6 acceptance

Engineering:
- CI PASS;
- Migration Replay PASS;
- Account Security PASS;
- Complete Quality Gate PASS;
- Vercel PASS.

Functional:
- Give out work remains reachable;
- submitted work can still be opened, approved and returned;
- leave can still be approved/declined/escalated according to existing limit;
- blocker claims can still be acknowledged/disagreed/resolved;
- manager can open work, person, project and meeting records;
- meeting scheduling remains available;
- finance snapshot drills to Manager Finance;
- existing manager real-work-loop acceptance remains green.

Visual:
- 320px phone;
- approximately 390×844 phone;
- 1366×768 laptop;
- 1440×900 desktop stretch control;
- populated decision state;
- quiet/no-decision state where fixture data permits;
- no horizontal overflow;
- no sub-12px visible text;
- no legacy ReferenceModuleStrip in the new Manager Overview;
- no local/legacy icon dictionary in the new presentation;
- direct reference comparison.

Test readiness:
- Manager Overview visual tests must wait for a stable loaded state before screenshotting;
- legacy class assertions may be migrated only where Stage 6 intentionally replaces that exact presentation;
- functional, security and authority assertions may not be weakened.

## 17. Exit gate

Stage 6 is accepted only when:

- Manager Overview is visibly a V2 command centre;
- decisions are the dominant hierarchy;
- team presence/output remain semantically separate;
- preserved manager actions remain green;
- phone and laptop proof are directly inspected;
- reference comparison passes;
- exact-head engineering gates are green;
- no high-severity visual or functional defect remains.

Only then may Stage 7 — Administration Overview begin.
