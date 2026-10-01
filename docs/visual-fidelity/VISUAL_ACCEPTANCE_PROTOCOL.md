# CEAC OS — Visual Acceptance Protocol

Status: BINDING
Date: 1 October 2026

This protocol closes the acceptance gap that remained after Experience V2.

## 1. Three acceptance levels

### Level A — affected-scope development gate

Use the existing V2 Level A protocol for fast implementation feedback.

It cannot accept a VF substage.

### Level B — complete technical acceptance gate

Use the existing V2 Level B protocol.

Level B must continue to prove:
- CI/build/dependency safety;
- cumulative SQL/RLS/security contracts;
- Migration Replay where applicable;
- Account Security;
- complete browser/role acceptance;
- exact-head evidence;
- Vercel exact-head status.

Level B green is necessary but not sufficient.

### Level C — Product Fidelity gate

Level C is mandatory for every visual-fidelity substage and family.

Level C answers:
“Does the actual product now meet the intended CEAC premium experience at the relevant viewports?”

A substage may not be marked accepted unless both Level B and Level C pass.

## 2. Required Level C evidence

For every changed major route capture actual product evidence at relevant canonical widths:

- 320
- 360
- 375
- 390
- 414
- 430
- 768
- 1024
- 1366×768
- 1440×900

Not every route needs every width, but every role family must cover phone, laptop and large desktop before family acceptance.

For each route/substage persist:
- target/reference;
- actual screenshot;
- role;
- viewport;
- state/fixture;
- visual-fidelity findings;
- interaction findings where applicable;
- PASS / DRIFT / BLOCKER per criterion;
- exact application SHA.

## 3. Level C criteria

Each major screen must be reviewed for:

1. Role character
2. Primary-action clarity
3. Information hierarchy
4. Composition
5. Density
6. Surface variety / card discipline
7. Typography
8. Iconography
9. Semantic colour/state clarity
10. Data visualisation truthfulness
11. Responsive recomposition
12. Touch/control ergonomics
13. Empty/loading/error/unconfigured states
14. Context preservation
15. Motion/interaction where relevant
16. CEAC distinctiveness

No averaging.

A material BLOCKER in any criterion prevents acceptance.

A DRIFT item may be accepted only if explicitly non-material, documented, and does not contradict the canonical target.

## 4. Mandatory comparison rule

Do not visually inspect a screenshot in isolation.

Compare:
current product → repository-owned CEAC target → Visual Fidelity Contract.

When a source inspiration is not stored in GitHub, use the distilled repository parameters in REFERENCE_MANIFEST. Do not substitute memory.

## 5. Generic-dashboard rejection test

Before acceptance ask:

- Could this screen plausibly be a generic HR/admin template with CEAC labels swapped in?
- Is the page mostly repeated white bordered cards?
- Is the primary decision/action visually obvious within five seconds?
- Does the role feel materially different from the other roles?
- Is useful context hidden simply to create empty whitespace?
- Does mobile feel deliberately composed rather than compressed?

If the first two are materially true, or the remaining questions are materially false, Level C fails.

## 6. Motion evidence

For VF7 and any earlier substage that materially changes interaction, static screenshots are insufficient.

Persist short interaction evidence for:
- drawers/sheets;
- work-state changes;
- person/project drill-down continuity;
- success confirmation;
- responsive navigation transitions where relevant.

## 7. Acceptance record

Every VF substage acceptance record must include:

- substage;
- exact application SHA;
- Level B run/evidence;
- Level C evidence location;
- target reference used;
- unresolved drift;
- explicit statement:
  - TECHNICALLY ACCEPTED: YES/NO
  - VISUALLY ACCEPTED: YES/NO

Acceptance record must explicitly state:
- TECHNICALLY ACCEPTED: YES / NO
- VISUALLY / PRODUCT-EXPERIENCE ACCEPTED: YES / NO

Only YES/YES may advance the sequence.

A technically correct screen that still reads as a generic enterprise dashboard is not visually accepted.
