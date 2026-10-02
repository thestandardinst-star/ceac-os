# CEAC OS — VF3D Acceptance Record

Substage: VF3D — Manager Projects / Calendar / Money / Reports
Accepted application SHA: `1ad80d1cf3e6bbe6d41c0e0c3f2f59bebf4e28af`
Date: 1 October 2026

## Target

Binding references:
- `docs/visual-fidelity/VISUAL_FIDELITY_CONTRACT.md`
- `docs/visual-fidelity/VISUAL_ACCEPTANCE_PROTOCOL.md`
- `docs/visual-fidelity/IMPLEMENTATION_SEQUENCE.md`
- `docs/visual-fidelity/VF0C_WHOLE_SYSTEM_VISUAL_GAP_MAP.md`

Manager VF3D requirement: complete the operational Manager environment across Projects, Calendar, Finance and Reports; use laptop/desktop width intentionally; keep phone deliberately recomposed; preserve factual project/work, calendar/meeting, finance, reporting and security authority.

## Level A

PASS during implementation and provisional preparation.

The changes remained presentation-focused:
- Projects were flattened from repeated floating cards into a denser operational ledger;
- Calendar kept the calendar and selected-date agenda primary while Google Calendar linking became supporting context;
- Finance paired factual operating and budget positions on wide screens while preserving currency separation;
- Reports made traceable evidence the primary visual structure and used wide-screen space for authoring.

No query, RLS/RPC, capability, finance, reporting, privacy, audit or integration authority was intentionally changed.

## Level B — exact head

PASS.

Exact-head evidence:
- CI `36907758489`: PASS
- Migration Replay `36907758564`: PASS
- Account Security `36907758180`: PASS
- Quality Gate `36907760480`, attempt 2: PASS
- Level B SQL and authority contracts: PASS
- Level B browser shards 1–4: PASS
- merged exact-head product evidence: PASS
- role-and-RLS coordinator: PASS
- Vercel exact-head deployment status: PASS

The first Quality Gate attempt for this SHA was cancelled by workflow/concurrency infrastructure. Its coordinator log recorded cancelled upstream jobs rather than a product/security assertion failure. The unchanged exact head was rerun; attempt 2 passed the full gate.

## Level C — Product Fidelity

PASS after one material correction.

### Projects

Initial VF3D evidence showed the Manager Projects phone section header forced into the shared vertical mobile section-header pattern. “Unit delivery”, “Your unit’s projects” and the count became a centered stacked block with unnecessary vertical waste.

Root cause:
- the shared Project-family phone rule switched all section headers to a column;
- Manager Projects only needed a compact title/count relationship in this location.

Smallest correct fix:
- Manager-only mobile override keeps the section heading and count on one row;
- a regression assertion caps the phone section-header height;
- Administration, Executive and project-workspace section behavior remains unchanged.

Exact-head corrected evidence:
- `redesign-r7-stage10c2-manager-projects-phone-320.png`
- `redesign-r7-stage10c2-manager-projects-phone-390.png`
- `redesign-r7-stage10c2-manager-projects-laptop.png`
- `redesign-r7-stage10c2-manager-projects-desktop-1440.png`
- shard artifact `11185869576`

Observed result:
- phone hierarchy is compact and left-aligned;
- count remains attached to the section context;
- project rows retain readable factual status/cost context;
- laptop/desktop remain a dense portfolio ledger rather than floating dashboard cards.

### Calendar

Observed result:
- schedule is the dominant operational surface;
- selected-date agenda remains adjacent on larger screens;
- Google Calendar linking is supporting context instead of competing with the calendar;
- mobile maintains usable controls and selected-date continuity.

### Finance

Observed result:
- actual operating position and budget planning position use wide-screen canvas deliberately;
- every currency remains separate;
- no conversion is implied;
- “remaining” retains its documented operational/budget meaning and is not presented as a bank balance;
- finance drill-down remains tied to factual records.

### Reports

Observed result:
- factual evidence is visually primary;
- counts remain traceable to supporting rows;
- optional charts remain conditional on real comparable data and retain table/drill equivalence;
- authoring gains wide-screen space without displacing evidence;
- no unsupported trend, score or decorative KPI was introduced.

Exact-head route matrix:
- `visual-parity-all-pages` artifact `11186326350`
- R2 Manager inspection artifact `11186571214`
- R7 closure inspection artifact `11186331345`

Vercel confirms the exact accepted application SHA deployed successfully. The preview is access-protected for this connector session; authenticated final deployed-product inspection remains mandatory at VF10D.

Unresolved material drift: none for VF3D.

## Decision

TECHNICALLY ACCEPTED: YES
VISUALLY / PRODUCT-EXPERIENCE ACCEPTED: YES

Next canonical substage: **VF4A — Administration Home operational inbox**.
