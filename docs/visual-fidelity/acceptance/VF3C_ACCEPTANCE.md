# CEAC OS — VF3C Acceptance Record

Substage: VF3C — Manager Team and Person workspace
Accepted application SHA: `cb761b751f41a9f54b038b197dbe4f1861c843c0`
Date: 1 October 2026

## Target

Binding references:
- `docs/visual-fidelity/VISUAL_FIDELITY_CONTRACT.md`
- `docs/visual-fidelity/VISUAL_ACCEPTANCE_PROTOCOL.md`
- `docs/visual-fidelity/IMPLEMENTATION_SEQUENCE.md`
- `docs/visual-fidelity/VF0C_WHOLE_SYSTEM_VISUAL_GAP_MAP.md`

Manager Team/Person requirement: make Team an operating roster rather than stacked dashboard cards; keep factual availability, responsibilities, review and outcome evidence scannable without judgement; keep Work lanes supporting; preserve persistent person context on laptop/desktop; reduce phone vertical waste; preserve unit scope, private-work exclusion, visible feedback and all People/Work authority.

## Level A

PASS during implementation.

Implementation stayed in Manager Team/Person presentation and the shared People-family presentation contract. Existing unit-scoped queries, private-work exclusion, visible-feedback behaviour, Work Engine authority, RLS/RPC and protected-HR boundaries were preserved.

## Level B — exact head

PASS.

Exact-head evidence:
- CI `36904235362`: PASS
- Migration Replay `36904235825`: PASS
- Account Security `36904235461`: PASS
- Quality Gate `36904235561`: PASS
- SQL/RLS/security contracts: PASS
- Level B browser shards 1–4: PASS
- merged exact-head product evidence: PASS
- Vercel exact-head status: PASS

## Level C — Product Fidelity

PASS after one material correction.

Initial inspection of application head `efa372496e8414043898c91a3c56ca6beda2cd58` found a real phone-density defect: every person expanded five factual evidence buttons into multiple rows, creating excessive vertical waste and pushing Work lanes too far down the route.

Root cause:
- the Manager evidence strip switched from five desktop columns to a two-column grid on phone, and to a one-column stack below 360px.

Smallest correct fix:
- application head `cb761b751f41a9f54b038b197dbe4f1861c843c0` keeps all five factual evidence buttons and their existing drill-downs;
- phone uses one horizontally scrollable evidence rail with the same readable labels and touch targets;
- a regression assertion now caps the mobile evidence-strip height while preserving the five factual controls.

Exact-head Level C evidence inspected:
- Manager Team phone 320: `redesign-r7-stage10b3-manager-team-phone-320.png`
- Manager Team phone 390: `redesign-r7-stage10b3-manager-team-phone-390.png`
- Manager Team laptop: `redesign-r7-stage10b3-manager-team-laptop.png`
- Manager Team desktop 1440: `redesign-r7-stage10b3-manager-team-desktop-1440.png`
- Manager Person phone 320/390 and laptop/desktop: `redesign-r7-stage10b4-manager-person-*.png`
- shard artifact containing the exact-head Team/Person evidence: `11184020120`
- route-matrix artifact: `11183601128`

Observed result:
- Team reads as a roster with people as the dominant operating surface rather than independent dashboard cards;
- factual presence, current responsibilities and outcome/review evidence remain directly inspectable;
- Work lanes remain visible supporting context and do not create a new people/permission boundary;
- phone roster height is materially reduced without hiding factual drill-downs;
- Person keeps identity and factual operating context persistent on large screens while responsibilities, outcomes, submissions, objectives, activity and visible feedback remain the detailed record;
- Person phone composition remains dense but readable and preserves the factual operating hierarchy;
- private work remains excluded;
- unit scope remains preserved;
- visible feedback remains attributable and visible to the staff member;
- no employee score, ranking, inferred productivity rating or hidden judgement was introduced;
- page-level overflow, text-floor and touch-target contracts pass the exact-head browser suite.

Unresolved material drift: none for VF3C.

## Decision

TECHNICALLY ACCEPTED: YES
VISUALLY / PRODUCT-EXPERIENCE ACCEPTED: YES

Next canonical substage: **VF3D — Projects / Calendar / Money / Reports**.
