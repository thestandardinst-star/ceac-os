# CEAC OS — Premium Redesign Source of Truth

**Date:** 23 September 2026
**Status:** SUPERSEDED FOR FINAL VISUAL/INTERACTION DIRECTION by `docs/architecture/CEAC_OS_Design_Foundation_v2_2026-09-24.md`. Retained for premium-redesign history, role composition and capability-preservation context.
**Product owner direction:** The 24 September Design Foundation v2 is now the visual authority. The earlier premium mockup is a historical reference where it conflicts with v2. Existing functional, security, data, audit and permission contracts remain protected.

## 0. Critical boundary

This document governs **experience, information architecture, interaction design and visual design** for the premium redesign.

It does **not** supersede:
- security/RLS contracts;
- append-only/audit requirements;
- approved data integrity rules;
- protected-HR boundaries;
- authority/capability restrictions;
- work-type behavioural contracts;
- stage-specific database contracts.

Where an old UX/navigation document conflicts with this document, this document is the redesign source of truth. Where a security/data contract conflicts with a visual idea, the security/data contract wins and the UX must be adapted without degrading the approved design quality.

Do not delete working capability simply because it is no longer a top-level tab. Embed it contextually.

## 1. Master visual reference

Canonical mockup identity:

- name: **CEAC OS Premium Redesign — Messaging Integrated**
- reference canvas: **1536 × 1024**
- master raster SHA-256: **f3f867faa8f35a3be46f995ecd915743241ddd7a57632fb677205640c069febd**
- visual direction: dark premium navigation shell, cool off-white workspace, electric blue primary action, restrained semantic colors, modern outline iconography, high information clarity, contextual messaging, compact visual analytics, premium desktop + mobile coherence.

The approved master mockup is the visual source of truth. Any developer receiving the raster should verify the SHA-256 above before treating it as canonical.

**No silent visual substitution.** Do not casually replace:
- icon family/style;
- primary colors;
- navigation proportions;
- surface treatment;
- typography hierarchy;
- imagery treatment;
- density;
- chart treatment;
- messaging placement;
- role composition.

Any deviation requires explicit product-owner approval and must be documented before implementation.

## 2. Product principle

CEAC OS is not a catalogue of enterprise modules.

> **The product exposes the job the person is trying to accomplish; the architecture stays underneath.**

The same capability may have different role-appropriate surfaces:
- Staff sees **My equipment**.
- Manager sees **Person → Equipment**.
- Administration sees **Assets & equipment**.

Do not duplicate systems to achieve this. Reuse the same authorised underlying data/contracts.

## 3. Global shell

### Desktop
- deep navy left navigation;
- CEAC OS mark + product line at top;
- global search across authorised people/work/projects/messages/files;
- prominent blue **+ Create** control;
- message/inbox affordance with unread state;
- notifications;
- user avatar/profile;
- role-appropriate sidebar;
- contextual favourites/quick access only where useful;
- responsive main workspace.

### Mobile
Mobile is separately composed, not desktop compressed.
- top identity/search/message affordances;
- maximum five primary bottom-navigation destinations;
- role-appropriate More surface for secondary destinations;
- preserved premium spacing and hierarchy;
- communication remains one tap away.

## 4. Role shells

### 4.1 Staff
Product character: calm personal workspace.

Primary desktop navigation:
1. Today
2. Work
3. Team
4. Calendar
5. Messages
6. My Hub

Mobile primary navigation should remain compact; Messages may be a top action plus bottom destination depending viewport/usage testing.

**Today**
- greeting and date;
- one dominant next action;
- Needs your attention;
- Waiting on others;
- Coming up;
- Recent messages;
- compact week context.

**Work**
- Assigned;
- Agreed;
- Private.
Work objects show status, due date, context, progress and next action.

**Team**
- People;
- Room;
- Resources.
Manager-only extensions must not leak into Staff.

**My Hub**
- Profile;
- Leave;
- Development;
- Learning;
- My equipment;
- Policies & requirements;
- History/Record.

### 4.2 Manager
Product character: team command centre.

Primary desktop navigation:
1. Overview
2. Work
3. Team
4. Projects
5. Calendar
6. Budget
7. Reports

Messaging remains globally visible and contextual in Team/Project/Work.

**Overview**
- decisions first;
- delegated work;
- team workload;
- project attention;
- budget snapshot;
- upcoming commitments;
- relevant communication.

**Work**
Views:
- Mine;
- Given out;
- Needs review;
- Team work.

Delegation history must remain attributable. Do not treat one current `assigned_by` value as sufficient if future reassignment/delegation requires a chain.

**Team**
Views:
- People;
- Workload;
- Availability;
- Room;
- Resources.

**Person workspace (Manager)**
- Overview;
- Work;
- Availability;
- Development;
- Learning;
- Equipment;
- Feedback.

### 4.3 Administration / HR
Product character: organisation operations console.

Primary desktop navigation:
1. Overview
2. People
3. Work
4. Time & Leave
5. Finance
6. Reports
7. Control Center

Do not recreate the current 20+ item architecture sidebar.

**Overview**
Operational inbox:
- leave/action decisions;
- incomplete employee setup;
- expiring documents;
- onboarding/offboarding actions;
- expenses/requests;
- structural setup gaps;
- reporting gaps;
- alerts requiring Administration.

**People**
Flagship employee directory/workspace.

Admin/HR employee workspace:
- Overview;
- Employment;
- Time & Leave;
- Development;
- Learning;
- Equipment;
- Documents;
- Private HR;
- History.

Lifecycle actions begin contextually from the employee:
- promotion;
- transfer;
- manager change;
- employment-type change;
- offboarding;
- correction.

A central People Operations queue may aggregate active onboarding/offboarding workflows, but “Employee lifecycle” is not an everyday architectural label.

**Time & Leave**
- Today;
- Schedule;
- Leave;
- Corrections;
- History.

One intelligent setup state replaces repeated “not configured” boxes.

**Finance**
- Overview;
- Expenses;
- Requests & approvals;
- Budgets;
- Transfers;
- Income.

Finance and Cost become one coherent product experience without merging distinct financial facts underneath.

**Control Center**
- Organisation;
- Access & permissions;
- Policies & compliance administration;
- Automations;
- Connected Apps;
- Activity Log;
- Advanced diagnostics.

System Events, delivery queues and connector internals belong in Advanced diagnostics.

### 4.4 Group Pastor / CEO
Product character: executive briefing + delegation.

Primary desktop navigation:
1. Overview
2. Work
3. Ministry
4. Portfolio
5. Organisation
6. Finance
7. Reports

**Overview**
- Needs your attention;
- ministry movement;
- departments needing attention;
- major projects;
- priorities;
- financial context;
- reporting;
- upcoming commitments.

**Work**
Must include delegated work and decisions, not only personal assignments.

**Ministry**
Replaces generic “Strategy” as the executive surface:
- direction;
- priorities/goals;
- major initiatives;
- progress;
- risks.

**Portfolio**
Major programmes/projects and their movement.

## 5. Communication architecture

Communication is a first-class layer, not a hidden feature and not a separate Slack clone.

### Global Inbox / Messages
Accessible from the shell with unread count.

Recommended views:
- All;
- Rooms;
- Mentions;
- Work;
- Announcements.

Direct-person messaging is not required by this design contract unless separately approved. The product may expose a “Direct” concept only after the privacy/authority model is deliberately specified.

### Contextual conversation
- Team → Room
- Project → Room
- Work item → Conversation
- Meeting → discussion/actions

### Quick compose
The Create control may include:
- new work;
- meeting;
- expense/claim;
- message/post;
- project;
- announcement where authorised.

### Conversion
Where safe and authorised, a room message may initiate creation of work, meeting or other structured action. The structured record must be explicit and attributable; chat text must not silently become authoritative work.

## 6. Visual language

### Core sampled palette from the approved mockup
These are baseline tokens derived from the canonical raster; implementation may refine only after screenshot comparison.

- Workspace background: **#F5F7FA**
- Primary navigation ink: **#0F1723**
- Secondary deep navy: **#172F51**
- Primary action blue: **#0C5DF9**
- Blue support: **#6498F9**
- Success green: **#0CB167**
- Attention amber: **#FCAF2E**
- Critical coral/red: **#F75E61**
- Accent violet: **#9565F5**
- Muted text family: approximately **#67738B / #7489A0 / #99A0AD**

Do not treat these as permission to invent a new palette. The master mockup remains the reference.

### Iconography
- one coherent modern outline family;
- approximately 18–20 px nav icons;
- consistent geometry and optical weight;
- clear active/filled state where appropriate;
- no emoji as navigation;
- no mixed weak stock styles.

### Typography
- modern grotesk/enterprise sans character;
- strong but restrained hierarchy;
- large type reserved for major workspace moments;
- compact operational headings;
- readable dense tables/lists where the job requires density.

### Surfaces
Do not use cards everywhere.

Approved patterns:
- flat lists;
- split views;
- drawers;
- tables;
- timelines;
- calendar grids;
- project tracks;
- status distributions;
- workload bars;
- finance comparisons;
- activity feeds;
- contextual cards only where meaningful.

### Motion
Purposeful, restrained, typically ~150–220ms:
- drawer transitions;
- status movement;
- period/chart transitions;
- contextual drill-in/out;
- success confirmation.
Respect reduced-motion preferences.

## 7. Visualisation rule

Use a chart only when visual comparison is faster than reading records.

Strong uses:
- trend over time;
- budget vs actual;
- workload distribution;
- project timeline;
- reporting completion;
- attendance calendar;
- ministry-priority movement.

Do not create decorative graphs to fill empty space.

## 8. Self-explaining language

Use plain human language and contextual teaching.

Examples:
- **Request funds** — use before money is spent.
- **Submit expense** — use after money was spent and evidence exists.
- **Given out** — work you assigned to other people.
- **Workload** — what your team is currently carrying.

Complex setup should use short guided flows, not architecture terminology.

## 9. Financial experience rule

The UI must visibly distinguish:
- request;
- approval/commitment;
- expense submission/claim;
- recorded expenditure;
- reimbursement;
- budget;
- transfer;
- income.

A Staff expense submission is not automatically authoritative organisational spend.

Do not change existing currency/minor-unit/data integrity rules to achieve a simpler UI.

## 10. Protected information

Private HR appears contextually in authorised employee workspaces. Do not expose protected data through ordinary profiles.

Human inputs should be normal:
- display/type GHS 6,500.00;
- convert to amount_minor internally.

Never expose database-storage language to ordinary users.

## 11. Connected Apps

Replace engineering-facing integration UI with branded Connected App cards:
- Google Workspace;
- Google Calendar;
- Google Meet;
- Zoom;
- Google Drive;
- Telegram;
- other approved systems.

Each surface shows:
- connection status;
- account;
- what CEAC OS can do;
- permissions;
- reconnect;
- disconnect.

Connector internals remain Advanced diagnostics.

## 12. Meetings

Visible provider choices:
- Google Meet;
- Zoom;
- Other link.

A pasted link is not a full provider integration. Automated meeting creation should appear only after a real connected-app capability exists.

## 13. Keystone screens

Do not redesign 47 screens independently first.

The quality bar is established through these keystone experiences:
1. Staff Today
2. Staff Work + Work Detail
3. Team + Room
4. Manager Overview
5. Manager Work
6. Manager Team/Person
7. Administration Overview
8. Administration People/Employee Workspace
9. Administration Finance
10. Project Workspace
11. Messages/Inbox
12. Group Pastor Overview

Other screens inherit the system after these pass product review.

## 14. Screen-state quality

Every redesigned surface must intentionally cover:
- loading;
- empty;
- partial/configuration missing;
- error;
- populated;
- permission-limited;
- completed/success;
- mobile;
- desktop.

Passing tests without product inspection is insufficient.

## 15. Fidelity gate

Before a redesign tranche can be accepted:
- screenshot compare against the approved mockup/design contract;
- correct role shell;
- correct icons and state treatment;
- correct visual density;
- no old architecture terminology leaking into the primary UX;
- no capability loss;
- responsive/mobile inspection;
- accessibility inspection;
- existing role/RLS/security gates remain green.

## 16. Change control

Any deliberate deviation from this design contract must:
1. state the reason;
2. identify affected screens/roles;
3. show the proposed replacement;
4. preserve underlying capability/security;
5. receive explicit product-owner approval;
6. update this document before implementation.

“No time,” “easier to code,” or “the old component already exists” is not sufficient justification.

## 17. Implementation prohibition

Do not start Stage 12 feature expansion while this redesign programme is active unless the product owner explicitly resumes it.

The redesign must not be used to invent new business rules. Where CEAC policy is unknown, preserve the existing safe unconfigured state and redesign that state clearly.
