# CEAC OS — Premium Redesign Execution & Handoff

**Date:** 23 September 2026
**Active redesign branch:** `chatgpt/ceac-experience-recovery-architecture-2026-09-23`
**Redesign baseline:** frozen Stage 11 head `b96aee835a1b08233ef7dc552d7bebc5568ca36b`
**Current main:** `ec2801895c66dfec082d04901b4743bfeb9a2c4c` (Stage 10)
**Stage 11 PR:** #42, open/draft, frozen and functionally green; do not mutate from redesign work.

## 1. Why this branch exists

This branch is the controlled redesign programme for the entire visible CEAC OS experience.

It exists so that:
- production `main` remains safe;
- the frozen Stage 11 implementation remains untouched;
- redesign decisions can be versioned;
- all roles can be rebuilt coherently;
- Codex/Claude/ChatGPT can continue from the same source of truth;
- no future implementer invents a new visual direction.

The governing UX contract is:

`docs/design/CEAC_OS_PREMIUM_REDESIGN_SOURCE_OF_TRUTH_2026-09-23.md`

Read it before changing any UI.

## 2. Branch safety

Until Stage 11 is merged:
- do not merge this redesign branch to `main`;
- do not rebase Stage 11 onto this redesign;
- do not modify PR #42 from this redesign branch;
- do not add database migrations unless a redesign requirement absolutely requires a data-contract change and that change has separate approval;
- prefer UI composition over schema change.

After Stage 11 merges:
1. compare this branch to the merged main;
2. replay/reconcile only the Stage 11 merge delta if necessary;
3. preserve the redesign commits;
4. do not overwrite the frozen Stage 11 contracts;
5. retarget final redesign integration toward fresh main only after validation.

## 3. Programme strategy

This is **not** a big-bang rewrite.

The redesign ships in controlled tranches. Each tranche:
- preserves functionality;
- keeps underlying data/security contracts;
- has a narrow visual/product scope;
- passes build + acceptance;
- is inspected in a real browser;
- is compared with the design source of truth;
- does not begin the next tranche while a severe regression is open.

## 4. Redesign sequence

### R0 — Design foundation / shell
No business-feature expansion.

Build:
- tokens;
- typography;
- icon system;
- desktop shell;
- mobile shell;
- global search affordance;
- Create control;
- inbox/messages affordance;
- shared drawers/panels;
- chart primitives;
- layout primitives.

Exit:
- all four role shells render;
- no capability loss;
- desktop/mobile responsive;
- old shell can be removed only after all routed screens remain reachable;
- screenshot product inspection.

### R1 — Staff
Redesign:
- Today;
- Work;
- Work Detail;
- Team;
- Team Room;
- Calendar;
- Messages/Inbox;
- My Hub / Record integration.

Do not redesign Manager/Admin through Staff components by accident.

### R2 — Manager
Redesign:
- Overview;
- Work: Mine / Given out / Needs review / Team work;
- Team: People / Workload / Availability / Room / Resources;
- Manager Person workspace;
- Projects;
- Calendar;
- Budget;
- Reports.

If current data cannot truthfully support “Given out” history beyond current `assigned_by`, show the supported record and document the gap rather than inventing delegation history.

### R3 — Administration / HR
Redesign:
- Overview;
- People;
- employee workspace;
- contextual employment/lifecycle actions;
- Time & Leave;
- Finance;
- Reports;
- Control Center;
- Access & permissions;
- Connected Apps;
- Activity Log;
- Advanced diagnostics.

Do not expose System Events/connector internals in primary navigation.

### R4 — Group Pastor / CEO
Redesign:
- Overview;
- Work;
- Ministry;
- Portfolio;
- Organisation;
- Finance;
- Reports;
- executive calendar/commitments as appropriate.

Must be an executive product, not an Admin skin.

### R5 — Cross-product communication
Complete/standardise:
- global Inbox;
- room surfaces;
- work conversation;
- project room;
- meeting discussion/action context;
- mentions;
- message-to-structured-action flows where explicitly authorised.

Do not add unrestricted DMs without a separate decision.

### R6 — Whole-system visual consistency
Audit every routed screen and state:
- keep;
- redesign;
- merge;
- embed;
- advanced-only;
- retire.

Remove legacy UI only after replacement coverage is proven.

### R7 — Closure
- complete acceptance suite;
- cumulative security/RLS gates;
- mobile/desktop inspection;
- accessibility;
- performance;
- live preview inspection;
- compare against design source of truth;
- product-owner acceptance;
- only then plan merge.

## 5. Current feature mapping principles

Do not map one current screen to one new tab by default.

Examples:
- Strategy → executive Ministry + contextual goal associations.
- Delivery → intelligence embedded in Projects/Home/Reports.
- Workload → Manager Team → Workload.
- Workforce/Attendance → Time & Leave + contextual availability.
- Performance → person/employee Development surfaces + central cycle admin where needed.
- Learning → personal/person contextual views + central admin.
- Assets → My equipment / Person equipment / Admin register.
- Compliance → Staff policies & requirements / contextual Manager actions / Admin policies & compliance.
- Lifecycle → employee actions + central People Operations queue.
- Protected HR → employee Private HR.
- Authority → Access & permissions.
- Workflows → Automations.
- Audit → Activity Log.
- Events/connector queues → Advanced diagnostics.
- Integrations → Connected Apps.
- Finance + Cost → one coherent Finance UX, separate underlying facts retained.

## 6. Rules for every future developer

1. Inspect GitHub state before editing.
2. Read `AGENTS.md`, `CLAUDE.md` if applicable, and the premium redesign source of truth.
3. Do not use old screen layout as the design reference.
4. Do not invent a new visual style.
5. Do not change the master palette/icons/layout direction without approval.
6. Do not expose architecture nouns simply because the capability exists.
7. Preserve all security, audit and data-integrity contracts.
8. Do not add a new migration for a UI problem.
9. Do not merge a tranche based only on tests; inspect the product.
10. Do not declare “done” while mobile, empty, error or permission states are visibly sub-standard.
11. Do not start another enterprise expansion stage inside the redesign branch.
12. Leave a precise handoff with branch, SHA, changed screens, test state, preview state and next tranche.

## 7. Acceptance evidence required per tranche

Each tranche must record:
- exact head SHA;
- files/screens changed;
- build result;
- relevant SQL/security results;
- role acceptance result;
- responsive result;
- browser screenshots;
- unresolved deviations from mockup;
- known data gaps;
- approval state.

## 8. Current known gaps to handle deliberately

- current Manager Work defaults to assignee=self; redesign needs role-specific views;
- current delegation field is not a full reassignment chain;
- Manager Finance currently requests funds but does not provide the proposed expense workflow;
- Staff expense submission policy is not yet confirmed;
- direct DMs remain unapproved;
- Google Meet/Zoom are not yet full connected-provider integrations;
- some existing screens duplicate old/new workforce concepts;
- Stage 11 remains unmerged until its external merge gate is resolved.

Do not hide these gaps with mock data in production.

## 9. Definition of safe progress

The redesign is progressing safely when:
- production is unchanged;
- Stage 11 remains intact;
- only one redesign tranche has active UI ownership;
- capability remains available during replacement;
- every removed destination has a validated new home;
- no security/data contract is weakened;
- future agents can identify exactly where to continue.

## 10. Next implementation step

The first code tranche is **R0 Design Foundation / Shell**.

R0 must not rewrite business logic. It creates the premium design primitives and role shells first, allowing later screens to migrate onto a stable system instead of each inventing a new layout.
