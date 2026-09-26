# CEAC OS Experience V2 — Implementation Sequence

Date: 26 September 2026
Status: BINDING SEQUENCE

The stages below are gates. Do not skip ahead. Do not run multiple implementation stages in parallel. A later stage may be planned while an earlier one is active, but it may not write product code until the current stage passes.

## Stage 1 — Continuity, source-of-truth and reference lock

Purpose:
Make the programme independent of any single Chat or Work session.

Work:
- isolate the Experience V2 branch from the exact green PR #69 head;
- persist START_HERE, BUILD_STATE, product source-of-truth, sequence and acceptance protocol;
- store the visual/motion references needed for continuity;
- update AGENTS.md so every coding session enters through Experience V2;
- record PR #69 and frozen PR #71 boundaries;
- run inherited baseline checks after documentation/reference import.

Exit gate:
A new session with no access to the prior conversation can inspect GitHub and correctly identify the branch, current stage, quality bar, references, protected boundaries and next action.

## Stage 2 — Design Foundation V2

Purpose:
Create one coherent visual language before rebuilding screens.

Work:
- semantic colour tokens;
- typography tokens and responsive scale;
- spacing/grid tokens;
- radius/elevation tokens;
- control heights and touch targets;
- content width/gutter rules;
- one production icon family and icon registry;
- image/media tokens;
- base motion tokens and reduced-motion rules;
- component layering/cascade strategy;
- migration plan away from legacy/premium/parity CSS debt.

Required proof:
- a V2 primitives/gallery route or equivalent development surface;
- desktop/laptop and mobile inspection;
- no new role-specific visual system;
- no increase in legacy visual-debt ceilings.

Exit gate:
Typography, iconography and base geometry visibly match the quality direction before any keystone screen is rebuilt.

## Stage 3 — Core Component System

Purpose:
Give every later screen stable reusable parts.

Build/standardise:
- buttons;
- icon buttons;
- inputs/selects/textareas;
- segmented controls/tabs;
- badges/status;
- avatars;
- stat/KPI tile;
- queue row;
- record/list row;
- action/focus card;
- information panel;
- data panel;
- table;
- timeline;
- progress/status distribution;
- tooltip/popover;
- dropdown/menu;
- drawer/sheet;
- modal/dialog;
- skeleton/loading;
- empty/error/configuration states;
- toast/confirmation.

Exit gate:
Components work at required widths, keyboard/touch states are usable, and role screens can be composed without inventing new component geometry.

## Stage 4 — Shell V2

Purpose:
Make navigation and workspace composition premium and stable before page redesign.

Desktop/laptop:
- sidebar;
- CEAC mark/identity;
- role navigation;
- search/context;
- create action;
- account/profile;
- workspace grid;
- sticky/fixed behaviour;
- correct 1366×768 composition.

Mobile:
- top identity/context;
- primary actions;
- five-destination bottom navigation maximum;
- More surface;
- safe-area handling;
- separately composed workspace.

Exit gate:
All four roles can move through their authorised destinations without shell overflow, clipping or visual inconsistency at phone, laptop and large desktop widths.

## Stage 5 — Keystone 1: Staff Today

Purpose:
Prove the personal-workspace quality bar.

Preserve:
- current Staff data and work-session behaviour;
- alerts, work, meetings, announcements and dependencies;
- existing authority/security.

Rebuild:
- information hierarchy;
- dominant next action;
- work-session state;
- attention/waiting/coming-up composition;
- compact calendar/schedule context;
- responsive composition;
- icons and motion-ready structure.

Exit gate:
Phone and laptop pass direct reference-quality review.

## Stage 6 — Keystone 2: Manager Overview

Purpose:
Prove the command-centre pattern and the original CEAC mockup direction.

Preserve:
- current manager queries, decisions, workload/project/finance/reporting logic;
- drill-down behaviour.

Rebuild:
- decision-first hierarchy;
- stat/data density;
- focus/schedule relationship;
- team/work/project attention;
- budget/finance snapshot;
- calendar/schedule rail;
- responsive grid.

Exit gate:
The screen is visibly at the approved premium quality on laptop and mobile, with no desktop-compressed mobile composition.

## Stage 7 — Keystone 3: Administration Overview

Purpose:
Prove the hardest operational-console pattern.

Preserve:
- people/workforce/finance/reporting/setup data and actions;
- capability boundaries.

Rebuild:
- operational inbox;
- organisation pulse;
- setup/configuration state;
- workforce/reporting context;
- high-density information patterns;
- mobile composition that replaces squeezed two-column panels.

Exit gate:
No collisions/wrapping failures; hierarchy and density match the quality reference; desktop and mobile both pass.

## Stage 8 — Keystone 4: Executive Overview

Purpose:
Prove the executive briefing pattern.

Preserve:
- ministry, portfolio, finance, reporting and meeting data;
- drill-down and authority.

Rebuild:
- attention first;
- ministry movement;
- department/project context;
- finance/reporting;
- schedule;
- restrained executive visual language.

Exit gate:
Executive feels related to the same V2 system but appropriately distinct in density and emphasis.

## Stage 9 — Keystone Quality Gate and System Ratification

Purpose:
Prevent weak design from propagating.

Work:
- side-by-side screenshot review of all four keystones;
- typography audit;
- icon audit;
- spacing/geometry audit;
- responsive audit;
- information-density audit;
- accessibility/focus audit;
- performance check;
- cross-role consistency review;
- user/product-owner review.

If a keystone misses the bar, fix the system/component causing the defect before proceeding.

Exit gate:
Product owner accepts the keystone quality direction.

## Stage 10 — Operational Screen Families

Rebuild by shared family, not role-by-role duplication:

A. Work
- lists/queues;
- Work Detail;
- assignment/review/return/dependency states.

B. People/Team
- Staff Team;
- Manager Team;
- Person workspace;
- Admin People/employee workspace.

C. Projects/Portfolio
- Manager Projects;
- Admin Projects;
- Executive Portfolio;
- project detail/workspace.

D. Time & Leave / Workforce
- Staff views;
- Manager context;
- Administration operations.

E. Finance
- Manager finance read-only;
- Administration finance;
- Executive finance;
- requests/expenses/budget contexts.

F. Reports
- role-appropriate reporting;
- traceable rows/charts.

G. My Hub / account
- profile;
- leave;
- development;
- learning;
- assets/compliance;
- account activity.

H. Ministry / Organisation / Control Center
- role-appropriate system/admin surfaces;
- connected apps later reconciled with frozen Stage 12.

Each family gets its own acceptance checkpoint.

## Stage 11 — Calendar and Data Visualisation

Purpose:
Raise the areas explicitly called out by the product owner.

Calendar:
- month/week/day behaviour only where supported;
- selected-date state;
- schedule detail;
- event/meeting relationship;
- responsive layout;
- keyboard/touch states;
- transitions.

Charts/data:
- coherent CEAC chart language;
- tooltips/focus states;
- chart/table parity where required;
- finance/workload/reporting visualisations;
- no decorative or invented data.

Exit gate:
Calendar and charts feel native to V2, not embedded/legacy widgets.

## Stage 12 — Motion and Interaction Quality

Purpose:
Apply the interaction quality demonstrated by the stored motion reference after geometry is stable.

Implement:
- layout reflow transitions;
- expand/collapse;
- drawers/sheets;
- tab/segment indicator movement;
- calendar selection/period transitions;
- state-change confirmation;
- shared-element transitions only where they clarify continuity;
- enter/exit behaviour;
- reduced-motion alternative.

Exit gate:
Motion improves comprehension, remains responsive and does not slow routine work.

## Stage 13 — Visual Assets and Media

Purpose:
Complete any surfaces that genuinely need imagery/illustration/video.

Rules:
- prefer CEAC-owned/authentic imagery where context matters;
- generated CEAC-specific visuals are allowed;
- licensed/free stock only when appropriate;
- optimise image/video delivery;
- no decorative media bloat;
- unresolved CEAC-specific asset needs are recorded, not faked.

## Stage 14 — Whole-System Responsive and State Pass

Inspect every authorised role route at:
- 320;
- 360;
- 375;
- approximately 390×844;
- 414;
- 430;
- representative tablet/intermediate width;
- approximately 1366×768;
- 1440px+.

Inspect:
- loading;
- empty;
- partial/unconfigured;
- populated;
- error;
- permission-limited;
- completed/success;
- destructive/action confirmation;
- long names/content;
- keyboard and touch behaviour.

## Stage 15 — Performance, Accessibility and CSS-Debt Closure

Purpose:
Ensure the premium layer is sustainable.

Work:
- bundle/media review;
- remove obsolete competing CSS;
- reduce !important debt;
- remove duplicate icon implementations;
- remove dead visual components;
- ensure semantic focus/keyboard behaviour;
- verify contrast and reduced motion;
- inspect layout shift and responsive image behaviour;
- confirm no role file became a hidden global override layer.

Exit gate:
V2 no longer depends on the old parity patch architecture for ordinary product rendering.

## Stage 16 — Release Candidate and Product Acceptance

Required:
- full CI;
- clean migration replay;
- Account Security;
- cumulative SQL/security gates;
- Playwright role journeys;
- visual/responsive acceptance;
- exact-head deployment;
- real product inspection across all four roles;
- comparison against stored references;
- no unresolved high-severity product defect;
- updated handoff/decision log.

## Stage 17 — Merge V2 and Reconcile Enterprise Sequence

After V2 acceptance:
- merge Experience V2 to main using the repository's approved merge method;
- record exact merged main SHA;
- close/supersede PR #69 appropriately;
- update frozen Stage 12 branch/PR #71 from the new main without rebuilding its security architecture;
- resolve Connected Apps/Admin visual conflicts using V2;
- rerun all Stage 12 security and product gates;
- inspect Telegram/Connected Apps;
- merge Stage 12 only when green.

Then continue:
Stage 13 Payroll only after CEAC rules are confirmed → Stage 14 Search & Intelligence → Stage 15 Assistive AI → whole-system inspection → production closure.

## Writer rule for every stage

Chat and Work may alternate, but:
- one active writer at a time;
- repository HEAD is authoritative;
- every substage ends in a pushed commit;
- BUILD_STATE.md is updated;
- incoming mode inspects GitHub before acting;
- no important design or implementation decision may exist only in conversation history.