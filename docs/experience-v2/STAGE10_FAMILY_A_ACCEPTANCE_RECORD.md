# CEAC OS Experience V2 — Stage 10 Family A Acceptance Record

Date: 27 September 2026
Status: ACCEPTED AND COMPLETE
Stage: 10 — Operational Screen Families
Family: A — Work

## Accepted exact head

Family A final acceptance head:

`09305e679bca08edb08881d90991f1e4b45b25c3`

The final product implementation underneath the acceptance matrix is anchored by:
- 10A1 Work lists/queues: `da4d690a6a0268f47b743798009658993aed068e`;
- 10A2 Work Detail: `74fddf56d096f3bf2125de76810935c0ca5870c8`;
- 10A3 assignment/review/return/dependency: `c54ad9a73088372ff24db7e4f510005b3fb641a6`.

The final head adds the acceptance matrix and documentation only on top of the accepted implementation.

## Engineering gates

Exact-head status:
- CI PASS — run `36339639970`;
- Migration Replay PASS — run `36339640003`;
- Account Security PASS — run `36339639976`;
- Quality Gate PASS — run `36339640009`;
- Vercel PASS.

Quality Gate:
- 213 Playwright tests passed;
- runtime approximately 10.7 minutes;
- no retry, skipped regression, threshold increase or weakened authority assertion was used to obtain acceptance.

## Family A outcomes

### Work lists and queues

One coherent Experience V2 Work-family presentation now serves:
- Staff Work — Assigned / Agreed / Private;
- Manager Work — Given out / Needs review / Team work / Mine;
- Administration Work — Given out / Needs review / Organisation / Mine;
- Executive Work — Given out / Needs review / Mine.

Role-specific data scope and authority remain unchanged.

### Work Detail

Work Detail now follows the approved working hierarchy:
1. identity and status;
2. returned/dependency state when present;
3. why this matters;
4. what finished looks like;
5. instructions/type-specific contract;
6. checklist/type-specific action;
7. submit/resolve/respond/review action;
8. supporting history.

All existing work kinds remain supported:
- task;
- routine;
- case;
- request;
- decision;
- meeting outcome;
- deliverable.

### Assignment / review / return / dependency

Assignment uses intent-first progressive disclosure while preserving the existing create/RPC paths.

Manager Work now has direct review continuity:
- Needs review → Work Detail → evidence-first review;
- Approve remains on `approve_work_submission`;
- Return remains on `return_work_for_correction`;
- return requires a concrete comment;
- selected checklist points may identify work to redo.

Returned work and dependency states now use explicit V2 state panels.

Existing blocker paths remain unchanged, including acknowledgement/dispute/resolution and lateness-pause semantics.

Administration and Executive received no new manager-review authority.

## Security and trust boundary confirmation

Family A introduced no:
- schema change;
- migration;
- RLS weakening;
- RPC grant broadening;
- authentication/session change;
- private-work exposure;
- protected-HR exposure;
- invented progress, score, ranking or delegation history.

PR #71 remains frozen and untouched.

Stage 13 Payroll remains blocked pending confirmed CEAC payroll rules.

## Responsive and visual acceptance

Exact-head Family A proof covers:
- 320px;
- 360px;
- 375px;
- approximately 390×844;
- 414px;
- 430px;
- representative 900px intermediate/tablet;
- 1366×768;
- 1440×900.

All four role Work list surfaces were directly proven at 320px and 1366×768, then re-proven at approximately 390px and 1440px.

Staff Work Detail and Manager assignment were directly proven at narrow phone, laptop and final 390/1440 acceptance widths.

Returned and dependency states were inspected directly from exact-head rendered evidence.

Observed mobile full-page screenshots may show the fixed bottom navigation part-way through the captured long document. That is the screenshot tool preserving a fixed viewport element during full-page capture, not a viewport composition defect.

No high-severity Work-family visual, overflow, typography, hierarchy or interaction defect remains in the accepted evidence.

## Typography and component rules

Accepted Work family:
- uses Instrument Sans;
- uses Experience V2 semantic tokens;
- uses the CEAC Lucide registry;
- keeps operational text at or above 12px;
- does not add `!important` to the shared Work-family stylesheet;
- uses deliberate mobile recomposition rather than reduced text size.

A cumulative Quality Gate during Family A also exposed and corrected a pre-existing populated Compliance metadata typography-floor defect. Its source rule is now regression-guarded.

## Persistent evidence

Final exact-head evidence is persisted at:

`CEAC OS / Experience V2 / Evidence / Stage 10 / Family A / Final / 09305e679bca08edb08881d90991f1e4b45b25c3 / stage10-family-a-final-r7.zip`

Final Quality Gate artifact:
- `redesign-r7-product-inspection`;
- artifact ID `10938811921`;
- workflow run `36339640009`.

## Exit decision

Stage 10 Family A — Work is ACCEPTED AND COMPLETE.

Family B — People/Team may now begin.

Family A should not be reopened generically. Later changes require a concrete cross-family defect or a separately approved product requirement.
