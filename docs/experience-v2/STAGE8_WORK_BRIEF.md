# CEAC OS Experience V2 — Stage 8 Work Brief

Date: 27 September 2026
Status: BINDING FOR STAGE 8
Stage: 8 — Keystone 4: Executive Overview

## 1. Purpose

Stage 8 proves the Executive briefing pattern.

This stage rebuilds the visible Executive Overview only.

It does not redesign Executive Work, Ministry, Portfolio, Organisation, Finance, Reports, Messages or My Hub. The accepted Stage 4 shell remains the navigation contract.

Executive Overview must answer:

**What requires senior attention, what is moving across the ministry, and where should I drill in?**

The result must be quieter and higher-level than Manager or Administration Overview while remaining operational, factual and drillable.

## 2. Authority and data boundary

`src/screens/ExecutiveHome.jsx` currently contains the authoritative Executive Overview queries and derivation. Keep that file as the data/action controller unless a concrete functional defect requires a domain correction.

Preserve without semantic change:
- organisation-scoped completed Task/Deliverable counts for this and the previous week;
- objective count and explicit objective statuses;
- active project count;
- unresolved blocker count;
- work items in manager review, clearly labelled as manager-owned context rather than an Executive queue;
- the next 14 days of visible non-cancelled meetings;
- active recurring ministry operations and append-only occurrence history;
- current reporting-period coverage by unit;
- Executive drill-ins to Work, Ministry, Portfolio, Organisation, Finance and Reports;
- meeting open and organisation-meeting scheduling behaviour;
- current auth, session, RLS and RPC authority.

The Executive Overview is read-only apart from invoking the already-authorised meeting scheduling flow. It must not introduce a new write path.

Do not:
- rank staff, managers, units, objectives or projects;
- invent an Executive score, project-health percentage or ministry-performance index;
- infer the cause or quality of recorded ministry movement;
- represent manager-owned review items as requiring Executive approval;
- combine availability, attendance and output;
- expose raw staff-task lists by default;
- convert currencies or combine different currencies;
- create a local Executive interpretation of Finance;
- change RLS, RPC, auth or data ownership for presentation convenience.

## 3. Exact current implementation audit

Current business/data container:
- `src/screens/ExecutiveHome.jsx`

Current visible layer still depends on:
- `executive-command-surface` scenic legacy hero;
- `DashboardCalendar` as a fixed early rail;
- `ReferenceModuleStrip` duplicating shell navigation;
- legacy `Chart`, `Stat`, `StatRow`, `Table`, `StatusDistribution`, `ProgressMeter`, `SectionHeader`, `ProductNotice` and `EmptyState`;
- `src/premium-executive.css` for the current home composition.

Current query and derivation inventory:
- `work_items` counts completed or self-certified Task/Deliverable output this week and last week;
- `objectives` counts and explicit status distribution;
- `projects` active count;
- unresolved `blockers` count;
- `work_items` in-review count;
- `meeting_sessions` for the next 14 days;
- current open `report_periods` plus latest unit-scoped report versions;
- active `units` for the reporting denominator;
- active value-recording `recurring_operations` and their last 90 days of `operation_occurrences`;
- derived current-week ministry occurrences, contributing units, latest recorded values and six eligible factual trend series.

No direct Overview mutation or Executive-only RPC is present. `scheduleMeeting` and `openMeeting` are injected by the existing application controller.

## 4. Evidence from exact-head rendering

The Stage 8A audit inspected the exact `887ace356224e81512f9a6ecdddef29d2f3d3059` Quality Gate evidence at phone, laptop and desktop sizes.

Observed strengths:
- source facts are clearly qualified as unit-entered records;
- explicit objective statuses are not converted into inferred performance;
- the completed-output comparison uses the canonical Task/Deliverable contract;
- meeting, ministry, work, portfolio and reporting drill-ins remain available;
- currency is not aggregated or converted on the Overview.

Observed composition problems:
- the scenic hero consumes the highest-value space without presenting a senior decision or movement;
- a full ministry-record table dominates before attention, objectives, portfolio or reporting context;
- the static calendar rail competes with more important Executive evidence;
- objectives, reporting, meetings, delivery totals and exception rows are a long sequence of equal-weight surfaces;
- the Explore CEAC OS strip duplicates the accepted shell navigation;
- manager-owned review work is visually mixed with Executive-level attention;
- the phone view is a squeezed version of the long desktop stack rather than an Executive mobile briefing;
- the desktop page is substantially longer than the accepted Staff, Manager and Administration keystones without a corresponding gain in decision clarity.

The problem is hierarchy and composition, not missing decorative treatment.

## 5. Reference comparison

Stage 8A compared the exact current screen against:
- `CEAC_original_premium_mockup.jpeg`;
- `quality_reference_dashboard.jpeg`;
- `quality_reference_typography_cards_icons.jpeg`;
- `quality_reference_mobile_spacing.jpeg`;
- `quality_reference_mobile_navigation.jpeg`;
- `quality_reference_board.jpg`;
- accepted Staff Today, Manager Overview and Administration Overview V2 implementations.

Adopt from those references:
- one legible dominant reading path;
- compact context before content;
- restrained surface contrast and icon weight;
- progressive disclosure instead of simultaneous equal cards;
- factual micro-visuals where the denominator or historical series exists;
- mobile recomposition with clear priority order;
- calm quiet and empty states.

Do not copy their fake data, branding, decorative charts or unrelated navigation.

## 6. Locked information hierarchy

Visible order:

1. Executive/date context and one restrained schedule action;
2. Senior attention — only factual signals that justify Executive drill-in;
3. Ministry movement — current recorded ministry activity and trends;
4. Direction and portfolio — objective status plus active-project context;
5. Reporting and financial context;
6. Organisation delivery movement — completed outputs, blockers and manager-owned review context;
7. Upcoming meetings;
8. lower-priority latest ministry records and supporting context.

The ordinary Overview must not render the legacy scenic hero, fixed calendar rail or duplicate Explore/module strip.

## 7. Senior attention contract

Senior attention may include:
- objectives explicitly recorded as `at_risk` or `not_met`;
- unresolved blockers as factual organisation-wide delivery holds;
- an open reporting period with outstanding unit reports;
- finance context only through the existing authoritative Finance surface or an existing authorised aggregate contract;
- other explicitly recorded Executive-authority items only when a current backend contract identifies them.

Every item must expose:
- the exact factual basis;
- a neutral label;
- a drill-in to the authoritative destination.

Items in `in_review` remain with authorised managers unless escalated by an existing rule. The Overview may show their count as lower-priority organisation context, but must not present them as Executive decisions.

An empty attention state should be compact and calm.

## 8. Ministry movement

Use the existing recurring-operation and occurrence history.

Required:
- number of active ministry measures;
- records entered this week;
- units contributing records this week;
- latest factual values with unit, date, value label and recorded note when present;
- trend treatment only where at least two actual occurrence records exist;
- clear statement that unit-entered figures are records, not scores or inferred causes.

The full ministry record remains available as supporting evidence, not the first dominant surface.

Do not create a synthetic ministry trend, target or sentiment.

## 9. Direction, portfolio and reporting

Objectives:
- show total objectives and explicit recorded status distribution;
- keep `at_risk` and `not_met` visible as recorded attention states;
- drill to Ministry;
- do not invent completion percentages for descriptive objectives.

Portfolio:
- show the existing active-project count and drill to Portfolio;
- do not infer health from project status alone;
- do not add a raw project list without an authoritative query and product need.

Reporting:
- show the current open period label, filed-unit count and total active-unit denominator;
- show outstanding coverage factually;
- show a truthful quiet state when no period is open;
- drill to Reports;
- do not infer report quality from filing state.

## 10. Finance boundary

Finance is an Executive destination with its own authoritative read model.

The Overview may:
- expose a clear Finance drill-in;
- show an existing authorised aggregate only if it is retrieved through the same organisation-scoped contracts and currency-separation rules used by Executive Finance;
- show a truthful unavailable/quiet state when no authoritative financial context is loaded.

The Overview must not:
- duplicate the complete Executive Finance page;
- independently reinterpret reversals, requests, budgets or spend;
- show a cross-currency total;
- use a default GHS assumption for missing currency;
- imply a bank balance.

Stage 8B should prefer a concise Finance drill-in over adding new finance queries unless direct product verification proves that an existing authoritative aggregate is necessary for the Executive briefing.

## 11. Organisation delivery movement

Use the existing factual counts:
- completed Task/Deliverable outputs this week;
- completed Task/Deliverable outputs last week;
- unresolved blockers;
- work currently in manager review.

The week comparison may state the arithmetic change. It must not interpret the change as improvement, decline, effort or quality.

The panel must repeat that manager review remains with the authorised manager unless escalated by an existing rule.

## 12. Meetings

Preserve:
- next-14-day non-cancelled meetings;
- open meeting detail;
- schedule organisation meeting through the existing handler.

Meetings are supporting context. They must not occupy a fixed calendar rail ahead of ministry and portfolio evidence.

Date/time display must remain in Africa/Accra.

## 13. V2 component and code boundary

Preferred implementation:
- keep queries, derivation and action handlers in `ExecutiveHome.jsx`;
- move visible composition to `src/experience-v2/executive-overview/ExecutiveOverviewV2.jsx`;
- add isolated `src/experience-v2/executive-overview/executive-overview.css`;
- load that stylesheet after shared V2 components/shell and the prior keystone styles;
- pass already-derived data and existing handlers as explicit props.

Prefer:
- `Surface`;
- `Button`;
- `StatusBadge`;
- `StatTile`;
- `DataPanel`;
- `QueueRow` or a focused Executive record row;
- `ProgressDistribution` for explicit status/coverage composition;
- `StatePanel`;
- `Skeleton`;
- `CeacIcon` from `src/experience-v2/icons.jsx`.

Do not add:
- a new local icon dictionary;
- a new global role CSS patch;
- new `!important` rules;
- a second Executive data engine;
- client-side persistence;
- a duplicate shell-navigation surface.

Legacy Executive destination styles may remain for routes outside Overview. Stage 8 removes legacy dependencies from `ExecutiveHome.jsx` only.

## 14. Laptop and desktop composition

1366×768 is a first-class Executive target.

Recommended composition:
- compact Executive/date header;
- attention panel paired with a concise ministry-movement summary;
- direction/portfolio and reporting/Finance panels as a quieter second band;
- organisation movement and meetings below;
- latest ministry records and eligible trends as progressive supporting evidence.

1440×900 is a stretch-control target, not permission for oversized cards or scenic whitespace.

Avoid:
- a scenic hero;
- a fixed calendar rail;
- equal card walls;
- raw task or people lists;
- repeated totals;
- duplicated navigation.

## 15. Mobile composition

Required widths:
- 320;
- approximately 390×844.

Required order:
1. Executive context and concise attention summary;
2. senior-attention records;
3. ministry movement;
4. direction/portfolio and reporting context;
5. organisation delivery movement;
6. meetings;
7. supporting ministry records.

Mobile requirements:
- intentionally single-column briefing flow;
- no desktop hero or calendar rail;
- no data table that forces document overflow;
- essential values and labels wrap without clipping;
- practical 44px controls;
- accepted shell navigation remains usable;
- no visible text below the 12px operational floor;
- no page-level horizontal overflow.

## 16. Loading, error, empty and quiet states

Loading:
- use V2 skeleton surfaces that resemble the final hierarchy;
- do not flash legacy cards before the V2 view resolves.

Error:
- state that Executive Overview could not finish loading;
- keep the existing retry behaviour;
- do not show missing data as zero after query failure.

Quiet:
- reduce surface weight when there is no senior-attention signal;
- state that no recorded signal currently needs Executive drill-in;
- do not celebrate or imply performance.

Empty:
- explain when no ministry measures, no open reporting period or no meetings are recorded;
- direct the Executive to the authoritative destination only where an action exists.

## 17. Test migration boundary

Add focused Stage 8 tests for:
- isolated V2 component/CSS boundary;
- preserved Executive query and handler authority;
- absence of the legacy scenic hero, fixed calendar rail and duplicate module strip;
- 320px, 390×844, 1366×768 and 1440×900 composition;
- no page-level horizontal overflow;
- practical mobile controls;
- factual Executive language and manager-review ownership;
- authoritative drill-ins.

Legacy presentation assertions in `premium-redesign-r4.spec.js`, `premium-redesign-r7.spec.js` and visual fingerprints may be migrated only where Stage 8 intentionally replaces that exact composition.

Do not weaken:
- Executive role/auth assertions;
- meeting workflow assertions;
- ministry-record functional assertions;
- route and authority boundaries;
- global 12px and overflow checks;
- visual-regression thresholds.

The Executive visual baseline must be deliberately re-recorded only after direct inspection accepts the new exact-head rendering.

## 18. Stage 8 acceptance

Engineering:
- CI PASS;
- Migration Replay PASS;
- Account Security PASS;
- Complete Quality Gate PASS;
- Vercel PASS.

Functional:
- ministry records and trends remain factual and available;
- objective status and Portfolio drill-ins remain intact;
- reporting coverage remains accurate and drillable;
- Finance remains authoritative and currency-safe;
- organisation delivery movement remains based on canonical Task/Deliverable completion;
- manager-owned review is not reframed as Executive approval;
- meeting schedule/open remains intact;
- no RLS, RPC, auth, session or ownership change.

Visual:
- Executive 320px phone;
- Executive approximately 390×844 phone;
- Executive 1366×768 laptop;
- Executive 1440×900 desktop;
- no horizontal overflow;
- no clipped essential labels/actions;
- no sub-12px visible operational text;
- no duplicate shell navigation inside the page;
- no legacy scenic hero or fixed calendar rail;
- deliberate loading, error, empty and quiet states;
- direct comparison with persistent quality references.

## 19. Exit gate

Stage 8 is accepted only when:
- Executive Overview reads as a concise senior briefing rather than a generic dashboard;
- attention, movement and authoritative drill-in order are clear;
- all current ministry, portfolio, reporting, Finance and meeting contracts remain intact;
- phone, laptop and desktop proof are directly inspected;
- the Executive visual baseline is accepted and persisted;
- exact-head engineering gates are green;
- no high-severity visual or functional defect remains;
- `docs/experience-v2/STAGE8_ACCEPTANCE_RECORD.md` and `BUILD_STATE.md` name the exact accepted SHA.

Only then may Stage 9 begin.
