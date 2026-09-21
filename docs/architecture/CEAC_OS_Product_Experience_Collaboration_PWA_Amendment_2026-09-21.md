# CEAC OS — Product Experience, Collaboration & PWA Architecture Amendment

**Date:** 21 September 2026  
**Status:** APPROVED PRODUCT EXPERIENCE DECISION — binding  
**Decision owner:** CEAC product owner  
**Applies to:** Staff, Manager, Administration & HR, Group Pastor, shared navigation, future Rooms, and future meeting experience.

## 0. Precedence and safety boundary

Read this after `CEAC_OS_Architecture_Approved_Amendment_2026-09-20.md`.

The 20 September amendment remains authoritative for database contracts, RLS/security, work types, deterministic intelligence, HR protection, reporting/evidence, and the no-generative-AI product rule.

This amendment governs:
- product experience and visual hierarchy;
- role-specific information density;
- progressive disclosure;
- responsive/PWA behaviour;
- future Rooms;
- future meeting workflow;
- how existing deterministic intelligence is surfaced.

Do not remove, weaken, or rewrite working business logic merely to match a visual concept.

---

## 1. Product definition

CEAC OS is the operating environment where CEAC work is:

1. understood;
2. coordinated;
3. executed;
4. recorded;
5. reviewed;
6. turned into transparent organisational intelligence.

**Locked product principle:** CEAC OS should become the place where work happens, not merely the place where work is reported.

The system may be complex underneath, but must feel simple to each role.

---

## 2. Four product layers

### 2.1 Work layer
Existing approved operational structures remain authoritative:
- the seven Work Engine behaviours;
- Projects and Objectives;
- work sessions / attendance;
- leave;
- finance;
- reports.

### 2.2 Collaboration layer
Approved direction:
- Project Rooms;
- Unit Rooms;
- Meeting threads;
- mentions and references;
- files/links where existing permissions allow them;
- communication tied to work, projects, objectives, decisions, requests and dependencies.

The collaboration layer is not a general social network and is not intended to recreate WhatsApp.

Initial scope should prioritise Project Rooms, Unit Rooms and Meeting threads before considering general direct messaging.

### 2.3 Record layer
Normal operations should leave attributable records:
- submissions and reviews;
- approvals and returns;
- decisions and rationale;
- meeting outcomes;
- blockers/dependencies;
- reports;
- finance records;
- activity history.

### 2.4 Intelligence layer
Intelligence remains deterministic and evidence-first.

The system should surface:
- attention;
- trends;
- bottlenecks;
- changes;
- exceptions;
- evidence and factual organisational patterns.

No employee score, ranking, hidden judgement, inferred motivation, or black-box assessment.

---

## 3. Information model — progressive disclosure

CEAC OS may hold substantial information without showing all of it at once.

Every role surface should follow four levels:

### Level 1 — What needs my attention?
Only the most relevant actionable exceptions.

### Level 2 — What is happening?
Compact factual signals and summaries.

### Level 3 — Why is the system telling me this?
Expose the rule and supporting evidence.

### Level 4 — Show me the record
Open the underlying work, project, submission, report, attendance record, blocker or other source.

**Locked rule:** the product should contain a lot of intelligence but expose very little noise.

---

## 4. Role-specific experience

### 4.1 Staff
Staff is a personal work environment, not a management dashboard.

The daily loop is:

**Understand today → communicate → do the work → attend what matters → record the outcome → move on.**

Staff Home should prioritise:
1. work-session/current-work state;
2. What changed / new responses;
3. Your next move;
4. Waiting on others;
5. Coming up;
6. relevant communication;
7. quieter team/organisation context;
8. factual progress.

The staff experience should feel lighter, more personal and more consumer-grade in usability than Manager/Admin surfaces while remaining professional.

### 4.2 Manager
Manager Home is an operational command surface.

Primary hierarchy:
1. Immediate attention / decisions;
2. Today;
3. Team pulse;
4. Delivery / projects;
5. Dependencies;
6. Personal work;
7. Recent movement / current week.

Management signals must open to evidence rather than asserting conclusions.

### 4.3 Administration & HR
Administration sees organisation-wide administrative exceptions, staffing/presence, reporting compliance, cross-unit dependencies, authority/setup gaps and approved HR operations.

Do not redesign Claude-owned Administration files without explicit ownership handoff.

### 4.4 Group Pastor / Executive
Executive surfaces should be intentionally sparse:
- organisational health;
- delivery against objectives;
- major exceptions;
- meaningful changes over time;
- relevant resource/financial context.

Do not expose employee task walls or synthetic performance scores.

---

## 5. Rooms — approved product architecture direction

Rooms are contextual work communication, not generic chat.

### Initial room types
1. Project Room
2. Unit Room
3. Meeting thread

### Rules
- access must inherit existing project/unit authority and RLS boundaries;
- no separate permissive messaging authority should bypass CEAC visibility rules;
- messages may reference CEAC objects such as Work items, Projects, Objectives, Decisions, Requests, Deliverables and Dependencies;
- a Room should preserve work context without automatically converting every message into a formal record;
- formal decisions/actions should be explicitly promoted into authoritative CEAC records;
- Rooms must not expose private work, protected HR, finance or other restricted records merely because a user shares a link/reference.

General direct messaging is deferred until usage proves it is necessary.

---

## 6. Meetings — approved product architecture direction

CEAC should not build its own video-conferencing platform.

A meeting should be an operational object around an external meeting provider such as Zoom.

### Before meeting
- title;
- date/time;
- participants;
- project/unit context;
- agenda;
- previous actions;
- related files/links.

### During meeting
- join meeting;
- notes;
- decisions;
- action items.

### After meeting
- meeting outcome;
- decisions recorded;
- actions converted into CEAC work;
- unresolved items/dependencies;
- attributable notes/evidence.

The existing `meeting_outcome` Work Engine behaviour is the authoritative bridge between meetings and the record layer.

Any future Zoom or meeting-provider credentials must be handled server-side. Secrets must never be embedded in browser code.

AI transcription/notetaking is not part of CEAC OS under the current no-generative-AI architecture. Any future change would require a new explicit product decision.

---

## 7. Design system direction

The visual direction is a balanced dark/light premium operating system, not full dark mode and not bright-white dashboard styling.

### Structural palette
- deep charcoal/slate navigation shell;
- soft blue-grey workspace;
- off-white working surfaces;
- near-black navy primary text;
- slate secondary text;
- restrained teal primary action/accent;
- restrained indigo secondary accent;
- amber only for attention/warning;
- red only for genuine error/destructive/overdue states;
- green only for healthy/completed/on-track states.

Avoid rainbow card colouring.

### Visual hierarchy
Premium feel should come from:
- typography;
- spacing;
- information hierarchy;
- interaction;
- restrained depth;
- icon consistency;
- excellent responsive behaviour.

Do not rely on decorative stock imagery as the main source of polish.

### Icons
Use one consistent outline icon family throughout. Icons are semantic navigation/interaction aids, not decoration.

### Motion
Motion must communicate state and orientation:
- approximately 150–250ms for ordinary transitions;
- drawers, sheets, expansion, approvals and navigation may animate;
- avoid decorative bouncing/floating motion.

---

## 8. PWA and responsive architecture — binding

CEAC OS is **mobile-first, PWA-first, and zero-horizontal-overflow by default**.

Desktop is an enhanced layout, not a stretched mobile layout.

### 8.1 Zero-overflow rule
No primary screen may require accidental horizontal scrolling on a phone.

Acceptance widths include at minimum:
- 320px
- 360px
- 375px
- 390px
- 414px
- 430px

At each width:
- the document width must not exceed the visual viewport;
- no primary text or control may be clipped horizontally;
- long titles, names, references, URLs and notes must wrap safely;
- flex/grid children must be allowed to shrink;
- cards and panels must respect `max-width: 100%`;
- multi-column content must stack before becoming cramped.

### 8.2 Typography
Typography must scale responsively with bounded sizes. Enlarging browser/system text must not force horizontal scrolling or hide essential controls.

### 8.3 Navigation
- desktop may use a persistent sidebar;
- phone uses bottom navigation and/or controlled drawers/menus;
- navigation must not expand the page width;
- active/overflow destinations must remain reachable without precision gestures.

### 8.4 Safe areas and standalone PWA
Respect:
- `env(safe-area-inset-top)`;
- `env(safe-area-inset-bottom)`;
- display-mode standalone;
- mobile browser chrome;
- dynamic viewport height;
- on-screen keyboards.

Bottom navigation and primary actions must never sit underneath system UI.

### 8.5 Forms, sheets and dialogs
- fit within the viewport;
- scroll internally where necessary;
- do not enlarge the page;
- remain usable while the software keyboard is visible.

### 8.6 Dense data
Desktop tables/metrics must not simply shrink onto phone screens. Convert to stacked rows/cards, summaries or progressive disclosure.

### 8.7 Accessibility/resilience
The interface must remain understandable under:
- larger text;
- reduced-motion preference;
- loading;
- empty state;
- failure/retry;
- poor connectivity;
- installed-PWA and browser contexts.

---

## 9. Feature-fit test

Before adding a new feature, ask:

**Does this materially help people coordinate, execute, record, or understand work already happening in CEAC?**

If yes, it may belong.

If it creates a new unrelated behaviour category, it should normally remain outside CEAC OS.

Examples currently outside the product direction:
- social feed;
- generic document editor;
- employee marketplace;
- elaborate gamification;
- custom email platform;
- custom video-conferencing stack;
- generic consumer chat unrelated to work.

---

## 10. Implementation order

After security/stabilisation baseline is confirmed:

1. lock design tokens and responsive/PWA foundation;
2. Staff Home and Staff navigation;
3. Staff Work/detail experience;
4. Staff Team/Me/Record consistency;
5. Manager Home;
6. remaining Manager surfaces;
7. shared component extraction;
8. responsive/accessibility regression pass;
9. only then expand to Admin/Executive with explicit ownership coordination;
10. Rooms and meeting collaboration are separate future implementation packages, not prerequisites for the visual redesign.

Every implementation batch must preserve existing functionality, security boundaries and authoritative records.



---

## 11. Universal orientation model — Today → Pulse → Insight

Across all roles, CEAC OS should organise information around three human questions:

### Today
What matters now? What needs action, attention or awareness today?

### Pulse
Is my area functioning normally? What is happening across people, work, projects and dependencies?

### Insight
What is changing over time? What patterns, recurring bottlenecks or improvements are visible from recorded evidence?

This model is not a requirement that every screen expose three literal tabs. It is a product-navigation and information-design principle.

Role-specific examples:
- Staff: Today dominates; Pulse is light; Insight is personal and factual.
- Manager: Today and Pulse dominate; Insight appears through team/project trends.
- Administration: Pulse and exceptions dominate; Insight focuses on organisation-wide operations.
- Executive: Pulse and Insight dominate; Today is limited to major decisions/exceptions.

---

## 12. Staff utility principles — binding

### 12.1 Contextual quick actions
Staff should not have to hunt through menus for common next steps.

Where context permits, surface actions such as:
- Start work;
- Continue current work;
- Open today's next item;
- Submit finished work;
- Respond to returned work;
- Ask for help / raise a dependency;
- Follow up where the approved follow-up rule allows it;
- Request leave;
- Join an upcoming meeting;
- Open the relevant Project/Unit Room once Rooms exist.

Quick actions must be contextual. Do not show actions the user cannot validly perform.

### 12.2 Factual progress/orientation
Staff may see simple factual orientation such as:
- 3 of 5 commitments completed this week;
- 2 items awaiting review;
- 1 returned item needs action;
- 2 dependencies are waiting on another unit.

This is not gamification, ranking, or performance scoring.

### 12.3 Communication signals
When Rooms exists, Staff Home may surface high-value communication signals such as:
- you were mentioned;
- a manager responded;
- a dependency response arrived;
- a Project Room has an important update;
- a meeting starts soon;
- an action was assigned from a meeting.

Do not surface every Room message on Home.

---

## 13. Notification and Rooms discipline

Rooms must not become a noise engine.

### Default high-value notification triggers
Prefer:
- direct mention;
- reply to the user's message where materially relevant;
- assigned action;
- request for decision/response;
- dependency response;
- meeting start/reminder;
- important project/unit announcement.

Avoid notifying for every ordinary message.

Users should be able to open Rooms and read ambient conversation without every line becoming an interrupt.

Room unread counts may exist, but the main Home attention layer should prioritise meaningful actions over raw unread volume.

---

## 14. Trend intelligence — deterministic and evidence-first

CEAC OS should develop useful historical management facts from its own records.

Approved examples include:
- approval turnaround over time;
- returned-work frequency over comparable periods;
- recurring blockers/dependencies;
- units that repeatedly wait on one another;
- objectives repeatedly lacking active supporting work;
- project end-date pressure and unfinished deliverables;
- reporting timeliness;
- recurring operation completion consistency;
- changes in work completion/submission volume across comparable periods;
- whether known exception counts are improving or worsening.

Every trend must:
1. be based on explicit recorded rows;
2. use a clear time window;
3. be explainable;
4. open to supporting evidence;
5. avoid inferring motives, competence or effort.

Do not convert trends into composite employee or unit scores.

---

## 15. Executive change-over-time rule

Executive views should not rely mainly on static totals.

Where meaningful, show:
- what changed since the previous comparable period;
- which major exceptions are new, resolved or persistent;
- which objectives/projects moved into or out of attention;
- material delivery/reporting/financial changes supported by evidence.

A static total may appear, but context and movement are more useful than raw accumulation.

---

## 16. Mobile composition is independent

Responsive design does not mean shrinking the same composition.

Mobile may:
- reorder sections;
- collapse secondary information;
- replace desktop tables with cards/rows;
- convert toolbars to contextual action menus;
- use bottom navigation instead of side navigation;
- move detail into sheets/drill-down views.

The information contract remains the same, but composition may differ by form factor.

**Locked rule:** mobile is a first-class product surface, not a compressed desktop screenshot.

---

## 17. Design System v1 — required before broad visual rollout

Before the redesign is applied widely, create a design-system source of truth containing at minimum:

### 17.1 Tokens
- exact colour values;
- typography families, weights and size scale;
- spacing scale;
- radius scale;
- shadows/elevation;
- motion durations/easing;
- breakpoints;
- z-index/layer rules.

### 17.2 Components
Define visual and interaction contracts for:
- navigation;
- buttons;
- icon buttons;
- cards/panels;
- grouped rows;
- status pills;
- alerts;
- metric/stat blocks;
- progress;
- filters/segments;
- inputs/selects/textareas;
- sheets/dialogs;
- empty/loading/error states;
- timelines/activity;
- avatars/people rows;
- Room/message surfaces when implemented;
- meeting surfaces when implemented.

### 17.3 States
Every interactive component should define:
- default;
- hover where relevant;
- focus-visible;
- active/pressed;
- disabled;
- loading;
- error/success where relevant.

### 17.4 Icon family
Use one consistent outline icon family across the product. The chosen implementation library should be confirmed against the existing dependency/security baseline before introduction.

---

## 18. Meetings — implementation boundary

The product direction for meetings is locked, but provider-specific implementation details are intentionally deferred.

Before implementation:
- verify the current supported Zoom/provider SDK/API;
- confirm desktop/mobile/PWA behaviour;
- confirm authentication and server-side credential handling;
- confirm participant/recording/privacy implications;
- map provider events into CEAC records without weakening existing authority boundaries.

Provider integration must remain replaceable. CEAC records, actions, decisions and meeting outcomes are the durable system of record; the external meeting provider is a transport layer.

---

## 19. Architecture completion statement

With sections 1–18, the product-experience direction discussed on 21 September 2026 is considered locked for the current redesign phase.

Implementation may refine visual detail, but must not silently change these product principles.

Any later change to:
- no-generative-AI;
- evidence-first intelligence;
- role-specific information density;
- Rooms scope;
- meeting operating model;
- zero-horizontal-overflow/PWA-first rule;
- no-ranking/no-scoring boundary

requires an explicit architecture decision rather than an incidental code change.
