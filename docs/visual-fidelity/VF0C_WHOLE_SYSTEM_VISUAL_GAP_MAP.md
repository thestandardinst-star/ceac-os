# CEAC OS — VF0C Whole-System Visual Gap Map

Status: ACCEPTED AUDIT
Date: 1 October 2026
Programme: Visual Fidelity & Interaction Closure
Substage: VF0C
Audited application state: post-Experience-V2 application tree represented by `4a457173940307bb93e98ca8b59b780d129755ef`, preserved through protected main `132cc4e3bd30374cc164ab425c41a79a2bd1e399`.
Programme branch checkpoint inspected: `90333066a846a03da975cf7a11732d4a7d0ff67c`.

## 1. Evidence used

The audit was completed against the repository-owned target and accepted-product evidence, not memory.

Target authority:
- `docs/visual-fidelity/VISUAL_FIDELITY_CONTRACT.md`
- `docs/visual-fidelity/REFERENCE_MANIFEST.md`
- `docs/visual-fidelity/targets/CEAC_PREMIUM_COMPOSITION_TARGET.html`
- `docs/visual-fidelity/references/CEAC_original_premium_mockup_reference.jpg`

Accepted implementation evidence:
- Quality Gate run `36851322487` at application head `4a457173940307bb93e98ca8b59b780d129755ef`
- `visual-parity-all-pages` artifact `11155139632`: 57 route screenshots across Staff, Manager, Administration and Executive
- `laptop-density-inspection` artifact `11155538765`: representative 1180/1366 laptop evidence
- `redesign-r7-product-inspection` artifact `11155458929`: accepted phone/intermediate/laptop/desktop evidence including 320/360/375/390/414/430, 900, 1366 and 1440 captures

The later handoff and VF branch commits inspected before this audit are documentation-only relative to the accepted application tree, so the accepted screenshots remain representative of the current visible product.

## 2. Route / surface inventory

### Staff — 13 primary route captures
1. Today / Home
2. Work
3. Team
4. Calendar
5. Messages
6. My Hub
7. Record
8. Workforce / Time & Leave
9. Performance / Reviews & development
10. Learning
11. Assets
12. Compliance
13. Announcements

Shared overlays/surfaces also used by Staff:
- Work detail
- Meeting
- Room / work-scoped discussion
- Account / security activity

### Manager — 17 primary route captures
1. Overview
2. Work
3. Team
4. Projects
5. Calendar
6. Finance
7. Reports
8. Messages / Announcements
9. My Hub / Record
10. Strategy
11. Delivery
12. Resource & Workload
13. Performance
14. Learning
15. Workforce
16. Assets
17. Compliance

Shared overlays/surfaces:
- Assignment composer
- Person workspace
- Project workspace
- Meeting
- Room / work-scoped discussion

### Administration / HR — 20 primary route captures
1. Overview
2. People
3. Work
4. Time & Leave / Workforce
5. Finance
6. Expenses / Cost
7. Reports
8. Units
9. Projects
10. Calendar
11. Lifecycle
12. Protected HR
13. Audit
14. Events
15. Workflows
16. Policies
17. Integrations
18. Authority
19. Control Center
20. Organisation settings

Shared overlays/surfaces:
- Employee workspace/editor
- Assignment composer
- Meeting
- Room / work-scoped discussion
- Account / security activity

### Executive / Group Pastor — 7 primary route captures
1. Overview / Ministry overview
2. Work
3. Ministry / Strategy
4. Portfolio / Delivery
5. Organisation
6. Finance
7. Reports

Shared overlays/surfaces:
- Assignment composer to manager/Admin altitude
- Meeting
- Room / work-scoped discussion
- Account / security activity

## 3. System-wide findings

### What is already strong and must be preserved

- The persistent dark CEAC navigation identity is established.
- Active navigation state is strong and recognisable.
- Instrument Sans and the Lucide-backed semantic icon language are already in place.
- The command/search/create layer exists on desktop/laptop.
- Mobile has a separate shell and bottom navigation rather than merely shrinking the desktop sidebar.
- Semantic state colours are restrained and generally truthful.
- Existing screens are accessible enough to have passed the accepted engineering/role suites.
- The app already avoids invented KPI scores and preserves truthful empty/unconfigured states.
- Existing application logic, security and role authority are materially stronger than the visual composition and must not be disturbed for cosmetic reasons.

### P0 shared drift — must be fixed before role families can reach the target

| Area | Current evidence | Gap against target | Priority |
|---|---|---|---|
| Surface architecture | Most routes are stacks/grids of white bordered rounded rectangles | Cards are the default container rather than one tool among queues, tables, timelines, split views and flat sections | P0 |
| Hierarchy | Many sections have similar weight, radius, border and padding | Primary decision/action does not dominate enough; secondary context competes visually | P0 |
| Density | Laptop screenshots show under-used horizontal space while content stacks vertically | Dense-but-readable composition target is not met consistently | P0 |
| Page openings | Many routes open with title + explanatory sentence + one generic panel | Target calls for compact role context and operational composition, not title-only canvases | P0 |
| Responsive recomposition | Mobile is technically responsive but often becomes a long serial stack of desktop cards | Mobile needs stronger prioritisation, flatter rows, sticky decision points and deliberate sequence | P0 |
| Role distinctiveness | Shared shell is coherent, but many inner pages look interchangeable across roles | Staff, Manager, Administration and Executive need recognisably different composition and information altitude | P0 |
| Interaction continuity | Drill-down works, but many destinations still feel like page swaps rather than persistent workspaces | Use drawers/sheets/split contexts where appropriate without changing authority | P1 |
| Motion | Motion primitives exist but are not consistently felt across navigation, disclosure and success states | VF7 must create one restrained spatial vocabulary and verify reduced motion | P1 |

## 4. Role-family gap classification

### Staff

Current character: closest of the four roles to the intended direction.

Strengths:
- phone-first shell exists;
- clear Start work action;
- low analytical complexity;
- Today, Work, Team and My Hub are understandable;
- mobile bottom navigation is clear.

Material drift:
- Today still reads as a sequence of similarly styled cards rather than one dominant next-action composition with lighter supporting zones;
- Schedule, weekly context and recurring numbers consume more vertical space than their current decision value warrants;
- secondary Staff routes frequently revert to title + one card/empty panel, creating large low-information canvases;
- Work and Record need stronger list/ledger rhythm and less card framing;
- fixed mobile navigation can visually interrupt long full-page captures, so content spacing and sticky behaviour need explicit closure.

Staff priority:
1. Today: dominant next action + Needs you / Waiting / Coming up composition.
2. Work: denser grouped rows, state visibility and context-preserving detail.
3. Team/Record/Me: flatter records, clearer personal evidence, lighter navigation burden.
4. Secondary capability routes: unify empty/state treatment without turning Staff into an analytics dashboard.

### Manager

Current character: functional but still materially below “team command centre.”

Strengths:
- “Needs your decision” exists and is correctly first;
- team, project, money and schedule data are already separated semantically;
- desktop/laptop has enough canvas for a command-centre composition.

Material drift:
- Overview at 1180/1366 is dominated by many equal white cards;
- Team context is rendered as nested stat tiles instead of a compact workload/availability operating view;
- schedule is visually isolated rather than acting as useful context rail;
- Work horizon, Finance snapshot, own work and routines have nearly equal visual weight;
- the “Give out work” action exists but the page does not visually organise around delegation and decisions;
- mobile Manager Overview is a very long stack of cards and loses command-centre character;
- Team/Projects/Reports vary between sparse canvases and generic form/card composition.

Manager priority:
1. Home: decision-first command centre with dominant queue, given-out work, team workload and contextual schedule.
2. Work: clear separation between My work / Given out / Needs review / Team work.
3. Team + Person: persistent person context, dense rows, workload/availability without person scoring.
4. Projects/Calendar/Money/Reports: specialised operational surfaces rather than generic cards.

### Administration / HR

Current character: broad functionality exists, but composition is still too dashboard/card oriented.

Strengths:
- operational authority is visible;
- direct links to People and Control Center exist;
- configuration state is truthful;
- delivery signals, reporting, workforce and units are factually separated.

Material drift:
- Overview is a long series of large cards instead of an operations console with queues, split context and dense resolvable rows;
- People/Workforce/Finance/Reports/Control Center have useful functionality but inconsistent density and surface anatomy;
- many administrative routes use full-width forms or generic panels where a table, ledger, split view or grouped settings list would scan faster;
- mobile Admin Overview becomes a very long serial feed, making the highest-authority actions harder to retain in context;
- configuration/setup information occupies premium space even when the operational inbox should dominate.

Administration priority:
1. Home: operational inbox first; configuration and monitoring context subordinated.
2. People + employee workspace: table/list + persistent employee context, not nested cards.
3. Workforce: schedule/leave/attendance composition with direct resolution and useful density.
4. Money/Reports/Organisation/Settings: ledger, table, split-view and grouped-settings patterns.

### Executive / Group Pastor

Current character: summarised and truthful, but still resembles a simplified Admin dashboard.

Strengths:
- no task-level default;
- executive attention and ministry movement are semantically separated;
- reporting and financial authority are clearly described;
- the product avoids unsupported scores and invented trends.

Material drift:
- Overview is still a sequence of card blocks with limited visual briefing hierarchy;
- “Senior attention” should dominate more strongly as the decision queue;
- ministry movement and recorded direction need a more executive briefing composition, with visualisation only when authoritative comparison benefits;
- supporting evidence and meetings compete with more important movement/context;
- Finance and Reports are sparse rather than executive summaries with clear drill-down;
- phone experience is accurate but overly long and card-heavy.

Executive priority:
1. Overview: briefing-first, exception-led composition.
2. Ministry/Portfolio: goal → portfolio relationship visible at executive altitude.
3. Finance/Reports/Calendar: summarise first, drill down second, preserve currency separation and provenance.

## 5. Route-specific gap map

Legend:
- H = hierarchy
- C = composition
- D = density
- S = surface/card discipline
- R = responsive recomposition
- I = interaction/context
- V = visualisation
- T = typography/optical hierarchy

### Staff
| Route | Main drift | Priority |
|---|---|---|
| Today | H/C/S/R — good foundation, still too many equal cards | P0 |
| Work | D/S/I — needs denser grouped rows and stronger state hierarchy | P0 |
| Team | D/S — roster should read as a lightweight directory/work context | P1 |
| Calendar | C/I/R — functional calendar; strengthen selected-date/schedule relationship | P1 |
| Record | D/S/T — evidence ledger should be flatter and easier to scan | P1 |
| My Hub | H/S — many equal destination cards; needs personal hierarchy | P1 |
| Messages | D/I — sparse workspace; room context should carry more continuity | P1 |
| Workforce | C/D/R — too form/card heavy on phone | P1 |
| Performance | C/S — sparse and generic in empty state | P2 |
| Learning | C/S — sparse and generic in empty state | P2 |
| Assets | C/S — sparse and generic in empty state | P2 |
| Compliance | C/S — sparse and generic in empty state | P2 |
| Announcements | C/D — excessively empty at baseline state | P2 |

### Manager
| Route | Main drift | Priority |
|---|---|---|
| Overview | H/C/D/S/R — largest command-centre gap | P0 |
| Work | H/D/S/I — needs operational lane structure | P0 |
| Team | D/S/I — flatten roster and strengthen person continuity | P0 |
| Projects | D/S/I — portfolio rows and project workspace need stronger composition | P0 |
| Calendar | C/I/R — useful component, needs tighter command-centre connection | P1 |
| Finance | D/S — ledger/financial context should replace generic panels | P1 |
| Reports | D/S/V — reporting should scan as evidence, not stacked cards | P1 |
| Workload | D/V — excellent candidate for truthful workload visual/table pairing | P1 |
| Delivery | C/D/S — complex but card-heavy | P1 |
| Record | D/S — flatten evidence history | P1 |
| Strategy | C/S — sparse | P2 |
| Performance | C/S — sparse/empty-state generic | P2 |
| Learning | C/S — sparse/empty-state generic | P2 |
| Workforce | C/D/R — dense functionality needs better hierarchy | P1 |
| Assets | C/S — sparse/empty-state generic | P2 |
| Compliance | C/S — sparse/empty-state generic | P2 |
| Announcements | C/D — excessively empty at baseline state | P2 |

### Administration / HR
| Route | Main drift | Priority |
|---|---|---|
| Overview | H/C/D/S/R — must become operations console | P0 |
| People | D/S/I — table + employee workspace needed | P0 |
| Workforce | H/C/D/R — direct-resolution operational surface | P0 |
| Finance | D/S — ledger/review patterns | P0 |
| Reports | D/S/V — evidence and periods need stronger structure | P0 |
| Units | D/S/I — organisation table/detail relationship | P1 |
| Projects | D/S/I — portfolio list/workspace | P1 |
| Calendar | C/I/R — role schedule context | P1 |
| Work | D/S — operational queue/list | P1 |
| Lifecycle | C/S — guided operational flows over generic panels | P1 |
| Protected HR | C/S — record-led, privacy-first workspace | P1 |
| Expenses | D/S — ledger and approval queue | P1 |
| Audit | D/S — event ledger/table | P1 |
| Events | D/S — event ledger/table | P1 |
| Workflows | D/S — process table + detail | P1 |
| Policies | D/S — policy register, not card gallery | P1 |
| Integrations | C/S — connected-app states need clearer operational grouping | P1 |
| Authority | D/S — grants/register pattern | P1 |
| Control Center | H/C/S — grouped settings architecture, fewer card islands | P1 |
| Organisation settings | H/C/S — compact settings sections and progressive disclosure | P1 |

### Executive
| Route | Main drift | Priority |
|---|---|---|
| Overview | H/C/S/V/R — briefing hierarchy not yet premium enough | P0 |
| Work | H/D/S — executive delegation queue, not generic work list | P1 |
| Ministry | H/C/V — direction/goals relationship too sparse | P0 |
| Portfolio | H/C/D/V — strong data, but needs executive portfolio composition | P0 |
| Organisation | C/D/V — currently sparse | P1 |
| Finance | H/C/D/V — summary first, currency-safe drill-down | P0 |
| Reports | H/C/D/V — summary/exception-first reporting | P0 |

## 6. Responsive findings

### 320–430
- Separate mobile shell exists and is stable.
- Primary failure is not overflow; it is excessive serial card stacking.
- Home routes need a shorter first viewport with one dominant action/decision.
- Flat rows, section dividers and progressive disclosure should replace many nested cards.
- Bottom navigation must continue to reserve safe-area/content clearance.

### 768–1024
- Intermediate layouts often inherit either phone stacking or desktop columns without enough dedicated composition.
- Split views should become one-primary/one-context layouts instead of simply collapsing everything.
- Tables require deliberate column reduction and row-detail access.

### 1366×768
- Current pages often under-use width while still requiring significant vertical scrolling.
- This is the key Manager/Admin operating viewport and should carry the highest operational density.
- The 1180/1366 Manager evidence shows equal-card weighting and unused canvas clearly.

### 1440×900+
- Large desktop should not merely enlarge gaps or card widths.
- Use the extra width for schedule/context rails, split detail, tables and meaningful comparison.

## 7. Interaction and motion findings

Existing foundations:
- drawers/sheets/popovers and motion utilities exist;
- reduced-motion support exists;
- route overlays preserve some URL context.

Required closure:
- navigation/context transitions should feel spatially related;
- person/project detail should preserve list context visibly;
- drawer/sheet open/close patterns need one timing/easing vocabulary;
- success/status transitions need restrained acknowledgement;
- reduced-motion must retain all state information;
- no animation may compensate for weak geometry.

## 8. Data visualisation findings

The current product is appropriately conservative about charts, but some routes now have enough authoritative data for carefully chosen visual comparisons.

Use visualisation only where faster than rows:
- Manager workload distribution;
- budget vs actual within a single currency;
- reporting completion;
- project timeline;
- attendance calendar;
- executive ministry/portfolio movement when authoritative period data exists.

Every chart must retain a row/table equivalent where required and must not infer a score, trend or combined-currency total.

## 9. Acceptance priorities carried into implementation

System-wide/shared first:
1. shell/composition contract;
2. typography/spacing/surface discipline;
3. responsive/motion primitives.

Role families:
1. Staff;
2. Manager;
3. Administration / HR;
4. Executive.

Cross-role:
1. Project workspace;
2. Money;
3. Calendar / meetings;
4. Connected Apps/shared operational surfaces.

Closure:
1. interaction/motion;
2. responsive matrices;
3. accessibility/CSS/performance/state debt;
4. final route matrix and deployed inspection.

## 10. VF0C decision

The gap is now explicit enough to proceed without inventing a new design direction.

The highest-risk implementation mistake would be to “polish” the existing card architecture. The correct next move is VF1A: preserve the accepted business/security foundation while changing shared composition so role families can become materially different and more operational.

Current product status:
- TECHNICAL FOUNDATION: ACCEPTED
- CURRENT VISUAL FIDELITY TO PREMIUM TARGET: MATERIAL DRIFT RECORDED
- VF0C AUDIT COMPLETENESS: ACCEPTED

Next canonical substage: **VF1A — Shell / navigation / command layer**.
