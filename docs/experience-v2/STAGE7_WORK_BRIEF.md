# CEAC OS Experience V2 — Stage 7 Work Brief

Date: 27 September 2026
Status: BINDING FOR STAGE 7
Stage: 7 — Keystone 3: Administration Overview

## 1. Purpose

Stage 7 proves the hardest operational-console pattern.

This stage rebuilds the visible Administration Overview only.

It does not redesign People, Administration Work, Time & Leave, Finance, Reports, Control Center, Messages, My Hub or Executive screens.

The accepted Stage 4 shell remains the navigation contract.

## 2. Authority and data boundary

`src/screens/AdminHome.jsx` currently contains live Administration business logic. Keep that logic authoritative unless a concrete defect requires a domain-level correction.

Preserve without semantic change:
- organisation units and Unit Head context;
- pending invitations;
- seven-day completed-output counts by unit;
- open unit alerts;
- Administration alerts;
- cross-unit blockers;
- pending/escalated leave queue;
- ready workflow checks filtered by the administrator's capabilities;
- Administration's own open work;
- primary office-location configuration state;
- active people count;
- current work-session and approved-leave context;
- project and objective records;
- current reporting-period coverage;
- recent submission facts used by existing rule-based silence checks;
- upcoming organisation/unit/project meetings;
- Staff invitation flow through `inviteByEmail`;
- explicit leave decision through `workforce_leave_action`;
- work, meeting, settings, units and destination drill-ins;
- current auth, capability, RLS and RPC authority.

Do not:
- rank staff or units;
- create an employee or unit score;
- treat attendance/session state as output or performance;
- infer underperformance from one silence signal;
- convert rule-based attention checks into disciplinary conclusions;
- invent reporting, project, workforce or finance data;
- bypass the existing capability model;
- change RLS/RPC/auth boundaries for presentation convenience.

## 3. Current implementation audit

Current business/data container:
- `src/screens/AdminHome.jsx`

Current visible layer still depends on:
- `admin-command-surface` legacy scenic hero;
- `DashboardCalendar`;
- `ReferenceFocusPanel`;
- `ReferenceModuleStrip`;
- legacy `Stat`, `StatRow`, `StatusDistribution`, `ProgressMeter`, `SectionHeader`, `ProductNotice` and `EmptyState`;
- a long stack of unrelated `admin-home-section` cards.

Exact-head desktop proof shows:
- the scenic hero and right calendar rail consume space before the operational inbox;
- organisation pulse duplicates information later repeated by Office context and Organisation movement;
- Needs you is visually lower than pulse/context even though it contains Administration authority;
- reporting, delivery risk, office context, movement, meetings and units are broken into many equal-weight cards;
- the Explore CEAC OS strip duplicates shell navigation;
- vertical length is high even when data is quiet.

Exact-head 390px proof shows a genuine composition failure:
- the two-column organisation pulse is squeezed into phone width;
- labels and helper text collide across card boundaries;
- the reference focus panel and legacy hero remain desktop-shaped;
- the fixed mobile navigation crosses the long stacked page while duplicated in-page navigation remains below;
- the screen is technically within the viewport but is not an accepted mobile recomposition.

Stage 7 must fix the composition, not hide the problem with smaller type.

## 4. Administration Overview product question

Administration Overview answers:

**What requires Administration authority, what is not configured or missing, and what organisation-wide context needs attention?**

Unit-level daily management stays with managers unless Administration deliberately drills into a record.

## 5. Locked information hierarchy

Visible order:

1. Administration/date context;
2. primary create/invite or relevant Administration action only when authorised;
3. Operational inbox — Needs Administration;
4. Setup and access gaps;
5. Reporting coverage;
6. Organisation pulse — projects/objectives and units;
7. Workforce context — working/leave/no-session/headcount, explicitly non-performance;
8. Cross-unit delivery attention;
9. Upcoming meetings;
10. Administration's own work when present;
11. lower-priority unit summary/context.

The ordinary Overview must not render the duplicate Explore/module navigation strip.

## 6. Operational inbox

This is the Stage 7 keystone.

Sources include:
- leave requests awaiting Administration;
- ready workflow checks the current administrator is authorised to act on;
- Administration alerts;
- configuration/setup gaps;
- units without an active head when that requires action.

Rows must expose only factual identity, provenance, age/date and the exact available action.

Leave actions must preserve the existing `workforce_leave_action` write path.

Workflow checks should drill to the existing workflow/control surface rather than duplicating workflow execution on Overview unless the current domain contract already permits the exact action.

## 7. Setup and access state

Make configuration gaps visible without turning the Overview into the Control Center.

Examples already present:
- missing primary office location;
- unit without head;
- pending invitation.

Invitation rules remain:
- every new invitation begins as Staff;
- Unit Head authority is assigned explicitly after activation through the existing Administration flow.

Do not imply that sending an invitation itself grants manager authority.

## 8. Reporting coverage

Use the current open reporting period and submitted/confirmed unit coverage.

Required:
- open period label when present;
- submitted/total;
- outstanding units;
- explicit empty state when no period is open;
- drill to Reports for detail.

Do not infer report quality from submission presence.

## 9. Organisation pulse

Keep factual organisation movement compact.

Projects/objectives may show:
- active projects;
- projects closed this month from existing close records;
- objective status distribution;
- objective count.

Unit summary may show:
- unit name;
- current head or pending invitation state;
- seven-day finished-output count;
- open-alert count when present.

Do not rank units by output or alerts.

## 10. Workforce context

Availability/session facts are operational context only.

May show:
- working now;
- approved leave today;
- no session started;
- people on record.

The UI must explicitly preserve the existing statement that these do not measure output or performance.

Do not merge these into a score or red/green employee judgement.

## 11. Delivery attention

Keep the existing rule-based attention inputs factual:
- units with no recent submissions under the existing rule;
- people with multiple recent session days and no submission under the existing rule;
- at-risk objectives;
- cross-unit blockers.

Presentation must label these as recorded signals/rules, not conclusions about competence or performance.

Cross-unit blocker rows remain drillable to the authoritative work item.

## 12. Meetings and personal work

Preserve:
- next-14-day meetings;
- organisation meeting scheduling;
- meeting opening;
- Administration's own work when present.

These are supporting context after the operational inbox, not a fixed calendar rail.

## 13. V2 component boundary

New Administration Overview presentation should prefer:
- `Surface`;
- `Button`;
- `StatusBadge`;
- `StatTile`;
- `DataPanel`;
- `QueueRow`;
- `RecordRow`;
- `ProgressDistribution` or a compact factual progress treatment when appropriate;
- `StatePanel`;
- `Skeleton`;
- `CeacIcon` from the central registry.

Safest architecture:
- keep queries, derivation and write functions in `AdminHome.jsx`;
- move the visible V2 composition to `src/experience-v2/admin-overview/AdminOverviewV2.jsx`;
- add isolated `src/experience-v2/admin-overview/admin-overview.css`;
- load it after shared V2 component/shell and earlier keystone styles;
- no global parity layer;
- no new `!important`;
- no new icon dictionary.

The existing invitation Sheet may remain on its proven workflow path during Stage 7 unless direct visual acceptance proves it materially breaks the V2 experience.

## 14. Desktop/laptop composition

1366×768 is the primary Administration working target.

Recommended composition:
- compact context header;
- dominant operational inbox;
- adjacent compact setup/reporting state;
- second region for organisation pulse and workforce context;
- lower support for delivery attention, meetings, units and personal work.

Avoid:
- scenic hero before operational work;
- fixed calendar rail;
- wall of equal-size cards;
- repeated metrics in multiple sections;
- duplicate navigation.

## 15. Mobile composition

Required widths:
- 320;
- 360;
- 375;
- approximately 390×844;
- 414;
- 430.

Mobile must be recomposed.

Required:
- operational inbox before organisation pulse;
- all pulse/context grids collapse intentionally to one column or readable two-up facts;
- no text collision or overlapping helper copy;
- no desktop hero/calendar rail;
- no ReferenceFocusPanel;
- no duplicate Explore module strip;
- practical 44px controls;
- bottom navigation remains usable;
- no horizontal overflow;
- no visible text below the 12px operational floor.

## 16. Visual references

Required comparison:
- `CEAC_original_premium_mockup.jpeg`;
- `quality_reference_dashboard.jpeg`;
- `quality_reference_typography_cards_icons.jpeg`;
- `quality_reference_mobile_spacing.jpeg`;
- `quality_reference_mobile_navigation.jpeg`.

Use them for:
- operational hierarchy;
- dense but readable information architecture;
- restrained surfaces;
- typography;
- card proportion;
- icon weight;
- mobile recomposition.

Do not copy decorative metrics or unrelated branding.

Accepted Stage 5 Staff Today and Stage 6 Manager Overview are local reference implementations for:
- V2 component use;
- isolation of presentation from authority;
- conditional sections;
- phone recomposition;
- visual regression re-baselining after intentional keystone migration.

Administration should be denser than Staff Today and more operationally broad than Manager Overview.

## 17. Focused Stage 7 acceptance

Engineering:
- CI PASS;
- Migration Replay PASS;
- Account Security PASS;
- Complete Quality Gate PASS;
- Vercel PASS.

Functional:
- invited account still begins as Staff;
- Administration can still approve/decline escalated/pending leave through the existing RPC;
- workflow-check drill-in remains capability filtered;
- office-location setup drill remains available;
- units/Unit Head context remains available;
- reporting coverage drills to Reports;
- cross-unit blocker drill remains available;
- meeting schedule/open remains available;
- People actions remain capability-safe;
- Administration own work remains accessible.

Visual:
- 320px phone;
- approximately 390×844 phone;
- 1366×768 laptop;
- 1440×900 desktop stretch control;
- populated inbox state;
- quiet inbox state where fixture data permits;
- setup-gap state;
- no horizontal overflow;
- no text collision;
- no sub-12px visible text;
- no legacy ReferenceModuleStrip, DashboardCalendar or ReferenceFocusPanel in the new Administration Overview;
- direct reference comparison.

Test readiness:
- Administration Overview tests must wait for the stable V2 Overview surface;
- legacy class assertions may be migrated only where Stage 7 intentionally replaces that exact presentation;
- authority/security assertions may not be weakened;
- visual regression must be deliberately re-baselined after direct acceptance, not bypassed.

## 18. Exit gate

Stage 7 is accepted only when:
- Administration Overview is visibly a V2 operational console;
- Administration authority/configuration gaps dominate the hierarchy;
- workforce context remains non-evaluative;
- current invitation/leave/reporting/workflow/blocker/meeting authority remains green;
- phone and laptop proof are directly inspected;
- reference comparison passes;
- exact-head engineering gates are green;
- no high-severity visual or functional defect remains.

Only then may Stage 8 — Executive Overview begin.
