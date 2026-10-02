# CEAC OS — VF4C Acceptance Record

Substage: VF4C — Administration Attendance / Leave / Workforce
Accepted application SHA: `aaddcc62bf3ecc8e77e818008c36040240b5d6a3`
Date: 2 October 2026

## Target

Binding references:
- `docs/visual-fidelity/VISUAL_FIDELITY_CONTRACT.md`
- `docs/visual-fidelity/VISUAL_ACCEPTANCE_PROTOCOL.md`
- `docs/visual-fidelity/IMPLEMENTATION_SEQUENCE.md`
- `docs/visual-fidelity/VF0C_WHOLE_SYSTEM_VISUAL_GAP_MAP.md`
- `docs/architecture/CEAC_OS_Admin_HR_Panel_Spec_v1.md`
- `docs/architecture/CEAC_OS_Architecture_Approved_Amendment_2026-09-20.md`
- workforce/security contracts already bound by `AGENTS.md`.

VF4C requirement: Administration Attendance / Leave / Workforce must read as a dense evidence-and-workflow console rather than a dashboard-card collection, while keeping recorded session, schedule, leave and correction evidence factual and separate from performance, discipline and payroll conclusions.

## Level A

PASS during implementation.

The implementation remained presentation-focused:
- Administration workforce tabs became one compact operating control;
- rows and decision queues were tightened into ledger-like evidence;
- leave decisions remain ahead of general organisation context;
- phone calendar became a horizontally scrollable seven-day rail rather than seven full-width stacked day panels;
- laptop/desktop calendar was expanded to a two-column weekly canvas;
- all existing schedules, recorded sessions, leave, corrections and policy controls remained in their existing authority paths.

No workforce query, leave route, correction RPC, policy authority, organisation scope, audit, privacy or payroll semantics were intentionally changed.

## Level B — exact head

PASS after one material product-layout correction.

Exact-head evidence:
- CI `36954442750`: PASS
- Migration Replay `36954442781`: PASS
- Account Security `36954442876`: PASS
- Quality Gate `36954442778`: PASS
- Level B SQL and authority contracts: PASS
- Level B browser shards 1–4: PASS
- merged exact-head product evidence: PASS
- Vercel exact-head deployment status: PASS

A prior exact-head Quality Gate failed one legitimate laptop geometry assertion:
- `tests/experience-v2-workforce-admin.spec.js`
- Administration Workforce at 1366px expected the first two calendar days on one row;
- received vertical separation of roughly 783px instead.

Root cause:
- literal JSX `\\n` text on both sides of the seven-day loop became anonymous CSS-grid items;
- that anonymous item consumed the first grid column, placing the first real day in column two and forcing the second real day onto the next row.

Smallest correct fix:
- application head `aaddcc62bf3ecc8e77e818008c36040240b5d6a3` replaced only the literal `\\n` text nodes with real source line breaks;
- no test assertion was weakened;
- no workforce data, authority, layout breakpoint or calendar semantics changed.

The corrected exact head passed the complete gate, including the previously failing shard 4.

## Level C — Product Fidelity

PASS.

Exact evidence inspected:
- `redesign-r7-stage10d4-admin-workforce-phone-390.png`
- `redesign-r7-stage10d4-admin-workforce-laptop-1366.png`
- `vf4c-admin-workforce-calendar-phone-390.png`
- `vf4c-admin-workforce-calendar-laptop-1366.png`
- `vf4c-admin-workforce-leave-phone-390.png`
- all above in shard artifact `11206070786`
- full route-matrix artifact `11205267361`

Observed result:
- Administration Workforce opens with factual policy state and Administration decisions before broader organisation context;
- workforce records read as operational evidence rows rather than equal dashboard cards;
- phone preserves touch targets and uses a deliberate horizontal calendar rail instead of serialising seven organisation days vertically;
- laptop uses a real two-column seven-day calendar canvas, reducing unused width and excessive vertical length;
- leave is presented as decision queue + attributable resolved/history records;
- recorded sessions and configured schedule context remain explicitly descriptive;
- missing sessions are not converted into automatic absence, lateness or performance findings;
- no employee score, ranking or inferred productivity judgement exists;
- no recorded activity is treated as payroll time;
- payroll remains blocked until CEAC payroll rules are explicitly confirmed.

Unresolved material drift: none for VF4C.

## Decision

TECHNICALLY ACCEPTED: YES
VISUALLY / PRODUCT-EXPERIENCE ACCEPTED: YES

Next canonical substage: **VF4D — Money / Reports / Organisation / Settings**.
