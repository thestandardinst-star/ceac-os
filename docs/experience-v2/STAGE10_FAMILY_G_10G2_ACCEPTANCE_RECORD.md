# CEAC OS Experience V2 — Stage 10 Family G 10G2 Acceptance Record

Date: 28 September 2026
Stage: 10 — Operational Screen Families
Family: G — My Hub / Account
Substage: 10G2 — My Hub foundation, profile, private goals and reminders
Status: ACCEPTED AND COMPLETE

## Accepted application head

`05ad969d0586c4f94fba43f13096e7c45c2e6acb`

This is the exact Level B My Hub application SHA.

## Exact-head Level B gates

- CI PASS — run `36439231728` (#1265);
- Migration Replay PASS — run `36439231642` (#876);
- Account Security PASS — run `36439231356` (#1048);
- Complete Quality Gate PASS — run `36439231293` (#1074);
- 395/395 Playwright tests passed across four isolated browser shards;
- Level B SQL/RLS/authority contracts PASS;
- merged exact-head product evidence PASS;
- role-and-RLS coordinator PASS.

## Vercel status

The exact application SHA received Vercel's known external daily deployment-rate-limit status:

`api-deployments-free-per-day`

This is an external deployment-capacity failure rather than an application build, runtime, security or acceptance failure. Local production build, exact-head CI and the complete Level B gate passed. No Vercel billing, environment, domain, project setting or application configuration was changed.

Per the product-owner continuation instruction, this known external rate limit does not stop the canonical Experience V2 sequence. Deployment reconciliation remains pending and must be recorded when Vercel accepts a later checkpoint with identical or superseding application code.

## Accepted My Hub character

My Hub now uses an isolated Experience V2 personal-family presentation while preserving its existing personal domain contracts.

Accepted hierarchy:
1. personal identity and role context;
2. purposeful links into authorised personal domain surfaces;
3. private goals, reminders and personal leave tabs;
4. ordinary personal/employment facts;
5. explicit protected-HR boundary;
6. self-editing through the existing attributable profile RPC;
7. truthful loading, empty, partial-error, busy and success states.

## Authority and privacy preserved

No schema, migration, RLS policy, RPC definition, authentication configuration or capability grant changed.

Preserved:
- `update_my_personal_details` remains the only ordinary self-profile mutation path;
- protected HR records remain outside ordinary profile details;
- private goals/reminders remain owner-only and outside CEAC reporting;
- a failed private-details read disables editing so unseen emergency-contact or address data cannot be overwritten with blanks;
- Staff and Manager keep authorised links into development, workforce, learning, assets and compliance;
- Administration and Executive do not gain Staff/Manager personal-domain links;
- no score, ranking, learning inference, compliance inference or asset-ownership inference was introduced.

## Responsive and product acceptance

Exact-head evidence was directly inspected at:
- 320×844;
- 360×800;
- 375×812;
- approximately 390×844;
- 414×896;
- 430×932;
- 900×900;
- 1366×768;
- 1440×900.

Direct inspection found:
- no page-level horizontal overflow;
- no clipped essential labels or actions;
- practical touch targets at the required minimum;
- no visible operational text below 12px;
- deliberate phone recomposition rather than squeezed desktop geometry;
- coherent role-limited presentation for Staff, Manager, Administration and Executive;
- private goals/reminders clearly distinguished from organisational evidence;
- no product or authority regression visible in the accepted evidence.

Quality Gate evidence:
- `redesign-r7-product-inspection`;
- artifact ID `10978536081`;
- digest `sha256:b2bde54e9c84b4349daf30e9abc1b4472514bff4b476a5d5d71a63809955c9de`;
- exact application head `05ad969d0586c4f94fba43f13096e7c45c2e6acb`.

## Exit decision

10G2 — My Hub foundation, profile, private goals and reminders is ACCEPTED AND COMPLETE.

10G3 — Personal leave in My Hub may begin after this documentation checkpoint is persisted.
10G4–10G8 have not started.
Family H has not started.
PR #72 remains OPEN + DRAFT.
PR #71 remains frozen.
