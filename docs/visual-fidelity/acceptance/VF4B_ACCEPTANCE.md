# CEAC OS — VF4B Acceptance Record

Substage: VF4B — Administration People and Employee workspace
Accepted application SHA: `1348923a3dc11938a92f52440af6fee8df467c31`
Date: 2 October 2026

## Target

Binding references:
- `docs/visual-fidelity/VISUAL_FIDELITY_CONTRACT.md`
- `docs/visual-fidelity/VISUAL_ACCEPTANCE_PROTOCOL.md`
- `docs/visual-fidelity/IMPLEMENTATION_SEQUENCE.md`
- `docs/visual-fidelity/VF0C_WHOLE_SYSTEM_VISUAL_GAP_MAP.md`
- `docs/architecture/CEAC_OS_Admin_HR_Panel_Spec_v1.md`
- `docs/architecture/CEAC_OS_Architecture_Approved_Amendment_2026-09-20.md`
- protected-HR and People/Work security contracts already bound by AGENTS.md.

VF4B requirement: Administration People must operate as a factual people-operations directory, and Employee must read as a persistent identity/employment workspace with detailed authorised records. The experience must not collapse into repeated cards or infer performance, discipline, pay or protected-HR values.

## Level A

PASS during implementation.

The implementation remained presentation-focused:
- People search/filter controls were consolidated into one operating band;
- unit groups became ledger-like record sections rather than floating card stacks;
- the Employee workspace gained a persistent identity/employment rail on larger screens;
- employment facts, history, work/session context, leave and protected-HR state were visually flattened into readable record structures;
- the visible stray People control text artifact was removed before the exact-head acceptance gate.

No People, employment, protected-HR, leave, work, RLS/RPC, capability, privacy or audit semantics were intentionally changed.

## Level B — exact head

PASS.

Exact-head evidence:
- CI `36948553087`: PASS
- Migration Replay `36948553203`: PASS
- Account Security `36948553125`: PASS
- Quality Gate `36948553171`: PASS
- Level B SQL and authority contracts: PASS
- Level B browser shards 1–4: PASS
- role-and-RLS coordinator: PASS
- Vercel exact-head deployment status: PASS

Exact accepted application head:
`1348923a3dc11938a92f52440af6fee8df467c31`

## Level C — Product Fidelity

PASS.

### People directory

Exact evidence:
- `redesign-r7-stage10b5a-admin-people-phone-320.png`
- `redesign-r7-stage10b5a-admin-people-phone-390.png`
- `redesign-r7-stage10b5a-admin-people-laptop.png`
- `redesign-r7-stage10b5a-admin-people-desktop-1440.png`
- artifact `11203088816`
- route-matrix screenshot `visual-parity-administration-people.png`
- artifact `11203297774`

Observed result:
- People reads as a searchable/filterable employee ledger rather than a generic dashboard;
- unit grouping remains factual and scan-friendly;
- search and filters use laptop/desktop width deliberately;
- phone keeps the same hierarchy and touch targets without desktop compression;
- work/submission context is explicitly labelled as factual context rather than ranking or disciplinary judgement.

### Employee workspace

Exact evidence:
- `redesign-r7-stage10b5b-admin-employee-laptop.png`
- `redesign-r7-stage10b5b-admin-employee-desktop-1440.png`
- `redesign-r7-stage10b5c-admin-employee-phone-360.png`
- `redesign-r7-stage10b5c-admin-employee-phone-375.png`
- `redesign-r7-stage10b5c-admin-employee-phone-414.png`
- `redesign-r7-stage10b5c-admin-employee-phone-430.png`
- artifact `11203088816`

Observed result:
- identity and authorised employment state remain persistent beside the detailed record on larger screens;
- employment history is attributable and remains visibly separate from current state;
- factual work/session context is present without a score, ranking or productivity conclusion;
- leave records remain factual when entitlement policy is unconfigured;
- protected-HR remains visibly isolated and unconfigured values are not invented;
- payroll remains explicitly blocked rather than inferred from role, attendance or work;
- phone deliberately stacks the record in priority order while retaining clear section boundaries and accessible actions.

Unresolved material drift: none for VF4B.

## Decision

TECHNICALLY ACCEPTED: YES
VISUALLY / PRODUCT-EXPERIENCE ACCEPTED: YES

Next canonical substage: **VF4C — Attendance / Leave / Workforce**.
