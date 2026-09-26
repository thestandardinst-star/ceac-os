# CEAC OS Experience V2 — Acceptance and Handoff Protocol

Date: 26 September 2026
Status: BINDING

This protocol exists so quality and continuity survive Chat limits, Work usage limits and session changes.

## 1. Acceptance philosophy

Engineering correctness and product quality are separate gates.

A stage may pass engineering checks and still fail product acceptance.

Required categories:
- functional correctness;
- security/authority preservation;
- visual fidelity;
- responsive composition;
- interaction quality;
- accessibility;
- performance;
- continuity/documentation.

No stage is complete until the categories relevant to that stage pass.

## 2. Mandatory viewport matrix

At minimum inspect:
- 320px phone width;
- 360px;
- 375px;
- approximately 390×844;
- 414px;
- 430px;
- representative tablet/intermediate width;
- approximately 1366×768 laptop;
- 1440px+ desktop.

The purpose is not simply "no overflow." Inspect composition quality at each size.

## 3. Visual acceptance

Inspect:
- type hierarchy and optical balance;
- font weight/line-height/tracking;
- icon family consistency;
- icon optical size and alignment;
- component proportions;
- spacing rhythm;
- card/surface anatomy;
- alignment;
- content density;
- visual hierarchy;
- colour semantics;
- border/shadow restraint;
- empty-space usage;
- long labels/names;
- consistency across roles.

Reference comparison is mandatory at keystone and release gates.

## 4. Responsive acceptance

Confirm:
- no page-level horizontal overflow;
- no clipped essential content;
- no overlapping labels/actions;
- no desktop grid squeezed into unreadable mobile columns;
- tabs do not become accidental multi-line blocks;
- cards/rows change composition when necessary;
- table strategy is intentional;
- mobile navigation remains safe-area aware;
- desktop sidebar/topbar remain stable;
- 1366×768 does not look stretched, oversized or under-dense;
- content width/max-width is deliberate on large displays.

## 5. Interaction acceptance

Inspect:
- hover where relevant;
- focus-visible;
- keyboard navigation;
- touch targets;
- pressed/active states;
- selected states;
- open/close behaviour;
- drawers/sheets/modals;
- destructive confirmations;
- success/error feedback;
- scroll restoration;
- drill-in/drill-out continuity;
- calendar selection;
- table sorting/export where applicable;
- chart/table toggles where required.

## 6. Motion acceptance

Motion must:
- clarify state or spatial relationship;
- remain responsive to input;
- use consistent timing/spring language;
- avoid long decorative delays;
- survive interruption;
- not trigger unnecessary layout jank;
- respect prefers-reduced-motion.

Compare richer flows against the stored motion reference in Library.

Do not fail a stage merely because it lacks decorative animation that the stage does not yet require. Rich motion is formally added in Stage 12 after geometry is stable.

## 7. Screen-state acceptance

Each redesigned surface must intentionally handle relevant states:
- loading;
- empty;
- partial/unconfigured;
- populated;
- error;
- permission-limited;
- busy/submitting;
- success/completed;
- destructive confirmation;
- long content;
- mobile;
- laptop;
- large desktop.

A polished populated screenshot alone is not completion.

## 8. Security/function preservation

Before accepting a view refactor:
- compare affected actions and data to the pre-V2 implementation;
- verify capability/role visibility remains correct;
- do not broaden data access;
- do not move protected HR data into ordinary profiles;
- do not bypass RPC/RLS for convenience;
- do not invent data;
- preserve audit/reversibility;
- preserve no-score/no-ranking rules;
- preserve clickable/provenance requirements for authoritative figures.

If a visual concept conflicts with a security/data contract, adapt the visual concept.

## 9. Performance acceptance

Check:
- unnecessary large dependencies;
- image/video size;
- lazy loading;
- layout shift;
- excessive rerender/animation work;
- overdraw from shadows/backdrops;
- route load responsiveness;
- icon imports/tree shaking;
- no media blocking primary work.

Premium must not mean slow.

## 10. CSS architecture acceptance

Experience V2 must reduce visual entropy.

Do not:
- increase the current !important ceiling;
- add another final override/parity stylesheet;
- create a new role-specific global patch layer;
- scatter new hard-coded literals when a semantic token exists.

When a V2 component replaces a legacy visual pattern, remove the obsolete competing rules once safe.

Track debt reduction at Stage 15.

## 11. Handoff format

Every substage handoff in BUILD_STATE.md must contain:

- stage/substage;
- active branch;
- latest pushed commit SHA observed by the outgoing session;
- completed work;
- files changed;
- tests/checks run and results;
- screenshots/evidence generated;
- known defects;
- decisions made;
- unresolved questions;
- exact next action;
- files/areas the next session must not touch;
- whether there is any unpushed Work state.

Never write passwords, secrets or recovery material into a handoff.

## 12. Usage-limit / conversation-limit protocol

### If Work is about to stop and can still write
1. Finish the smallest safe unit.
2. Run relevant tests.
3. Commit and push.
4. Update BUILD_STATE.md.
5. Record exact next action.

Then Chat may continue from GitHub.

### If Work stops with unpushed changes
The next Chat session:
- must not overwrite or recreate those changes;
- may inspect the last pushed SHA;
- may plan/review;
- records that unpushed state must be recovered;
- waits for Work to recover/push before editing overlapping files.

### If Chat implements while Work is unavailable
Chat:
- inspects HEAD first;
- works only from pushed state;
- commits/pushes its changes;
- updates BUILD_STATE.md.

When Work returns it must fetch/inspect the latest HEAD before continuing.

## 13. One-writer enforcement

Do not have Chat and Work write concurrently.

If there is uncertainty about which session is the active writer, stop implementation, inspect GitHub and resolve ownership.

Planning/review may happen concurrently conceptually, but only one mode may mutate the branch.

## 14. Exact-SHA rule

All acceptance evidence must identify the exact commit it refers to.

Do not say "the branch passes" if the tested commit is not the current branch head.

If a fix changes the SHA, rerun the checks affected by that fix.

## 15. Keystone gate

For Staff Today, Manager Overview, Administration Overview and Executive Overview:

Required before Stage 10:
- exact-head build/tests;
- desktop/laptop screenshot;
- mobile screenshot;
- side-by-side reference review;
- icon consistency review;
- typography review;
- responsive review;
- product-owner acceptance of the direction.

The purpose is to stop a weak component system from spreading.

## 16. Release gate

Experience V2 release candidate must have:
- all required repository CI green;
- clean migration replay;
- Account Security green;
- cumulative SQL/security gates green;
- role acceptance journeys green;
- exact-head deployment;
- four-role real-product inspection;
- phone/laptop/desktop review;
- visual reference comparison;
- accessibility/reduced-motion review;
- performance review;
- no unresolved high-severity visual or functional defect;
- BUILD_STATE and decision/reference docs current.

## 17. Failure handling

When a gate fails:
- record the concrete failure;
- identify whether root cause is token, primitive, shell, screen composition, data/state logic or infrastructure;
- fix the lowest shared layer that correctly solves it;
- avoid local CSS patches unless the issue is truly local;
- rerun affected gates;
- do not advance the stage until resolved or explicitly waived by the product owner with rationale recorded.

## 18. Product-owner changes

If the product owner changes the desired quality direction:
- save the new reference;
- update REFERENCE_INDEX;
- update the source-of-truth;
- record the decision;
- identify affected stages/screens;
- do not silently reinterpret the old contract.