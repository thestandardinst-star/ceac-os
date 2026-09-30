# CEAC OS Experience V2 — Stage 10 Family G Acceptance Record

Date: 28 September 2026
Stage: 10 — Operational Screen Families
Family: G — My Hub / Account
Status: ACCEPTED AND COMPLETE

## Accepted application head

`910878c2298713c1fa75aba909d43deda2341c87`

This exact application SHA is the canonical Family G acceptance head.

## Acceptance scope

Family G acceptance closes the remaining personal/account substages on one exact, fully verified application head:

- 10G3 — Personal leave in My Hub;
- 10G4 — Personal development;
- 10G5 — Personal learning;
- 10G6 — Personal assets and compliance;
- 10G7 — Account activity and session security;
- 10G8 — Family G final acceptance.

10G2 was previously accepted at `05ad969d0586c4f94fba43f13096e7c45c2e6acb`. The substages above were completed on canonical history and are accepted together here because the current exact head passed the complete Level B boundary with the complete Family G implementation and acceptance coverage present.

## Exact-head Level B

Quality Gate run `36481141060` (#1154) passed on the accepted application head.

- CI PASS — run `36481141199` (#1345);
- Migration Replay PASS — run `36481141002` (#956);
- Account Security PASS — run `36481141005` (#1128);
- Complete Quality Gate PASS — run `36481141060` (#1154);
- Level B SQL and authority contracts PASS;
- browser shard 1/4 PASS;
- browser shard 2/4 PASS;
- browser shard 3/4 PASS;
- browser shard 4/4 PASS;
- merged exact-head product evidence PASS;
- role-and-RLS coordinator PASS;
- Vercel exact-head deployment PASS.

## Exact-head evidence

Merged artifact:
- `redesign-r7-product-inspection`;
- artifact ID `10997285580`;
- digest `sha256:63156b36c1d79b4c84d89cfc8d6bdd57f42cb541e9a24444e5e3cd99a1f24438`;
- head SHA `910878c2298713c1fa75aba909d43deda2341c87`.

The artifact contains Family G proof across the required responsive matrix, including My Hub, personal leave, reviews/development, learning, assets, compliance and account security.

Direct product inspection on the exact artifact confirmed representative keystone states:
- 390px leave-request sheet remains readable, preserves the Family D decision boundary and keeps unconfirmed leave math unavailable;
- 1366px Reviews & development uses the evidence-first V2 hierarchy and explicitly retains the no-score/no-ranking contract;
- 1366px Assets & devices presents factual custody only and makes the no-remote-device-management boundary explicit;
- 320px and 1366px Your account retain the same V2 personal-family hierarchy without page-level horizontal overflow;
- the account surface keeps sessions and activity visibly self-only and preserves explicit local/global sign-out actions;
- long seeded account histories remain readable rather than collapsing or clipping the page.

## Authority and truth preserved

No schema, migration, RLS policy, RPC definition, authentication configuration or capability grant changed as part of Family G presentation work.

Preserved:
- ordinary self profile mutation through `update_my_personal_details`;
- owner-only personal goals/reminders;
- protected-HR separation;
- `workforce_request_leave` and employee cancellation only from My Hub;
- Manager/Administration leave decisions remain in accepted Family D;
- evidence-first Performance & Development with no employee score/ranking;
- factual Learning completion with no skill/potential inference;
- asset custody history without inferred ownership or remote-device-management claims;
- personal compliance acknowledgement/evidence/exception paths without a compliance score;
- self-only `my_sessions()` and `my_account_activity(p_limit)`;
- local and global sign-out semantics.

The final 10G7 correction also keeps sessions-RPC failure distinct from a truthful empty sessions state and account-activity-RPC failure distinct from a truthful empty audit trail.

## Exit decision

Stage 10 Family G — My Hub / Account is ACCEPTED AND COMPLETE.

Family H may now be accepted or continued from the already-present canonical implementation only after its own authority, responsive and exact-head evidence are reconciled. No newer Family H work should overwrite this accepted Family G boundary.
