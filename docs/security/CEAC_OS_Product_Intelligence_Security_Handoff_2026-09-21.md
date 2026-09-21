# CEAC OS — Product Intelligence Security & Handoff Contract

**Date:** 21 September 2026
**Status:** BINDING SECURITY CONTRACT for all future builders, including ChatGPT, Codex, Claude, contractors and maintainers.

## 1. Security precedence
Existing live RLS, audit, Work Engine, finance, reporting and protected-HR contracts remain authoritative.
No redesign may weaken a backend permission simply because a screen hides or moves a control.
UI visibility is never an access-control boundary.

## 2. Backend-first authority
Every consequential action must be authorised by the database or an approved server-side function.
Examples include:
- assigning work;
- changing roles/authority;
- approving/returning work;
- leave decisions;
- finance actions;
- scheduling or managing meetings;
- writing shared decisions;
- changing organisation configuration;
- protected-HR access.

## 3. Protected HR
Do not place Ghana Card, SSNIT, tax identifiers, banking information, salary/payroll details, contracts or payslips into ordinary profiles.
Protected HR requires separate tables, explicit RLS, narrow read/write authority, attributable changes and security tests before UI exposure.

## 4. Configuration persistence
Any setting presented as configurable must:
1. persist to an authoritative row;
2. return the saved row or otherwise verify persistence;
3. surface a clear failure if zero rows were changed;
4. be tested by save → reload → verify.

## 5. Evidence and intelligence
Management intelligence must derive from explicit recorded rows and clear time windows.
Do not infer competence, effort, motivation, intent or employee worth.
No composite employee or unit score.
Every alert/trend must be explainable and drillable to evidence.

## 6. Meetings
Meeting scope and participation do not automatically grant access to every meeting record.

Required data separation:
- agenda: shared with authorised participants;
- private note: readable only by author and narrowly authorised maintenance/service paths;
- shared decision: visible to authorised participants according to meeting authority;
- action: converted to authoritative CEAC Work with existing Work Engine permissions;
- meeting outcome: attributable CEAC record.

Before the scheduled start, ordinary participants may prepare/view agenda but must not be able to create during-meeting records unless a future explicit rule says otherwise.

Private notes require a dedicated storage contract or equivalent RLS that guarantees author-only reads. Existing shared meeting_records.note behaviour is not sufficient and must be migrated before the redesigned experience is considered complete.

## 7. Meeting provider security
Provider credentials, SDK secrets, API secrets and signature-generation keys must never enter browser code or repository source.
Generate provider signatures/tokens server-side through an approved server function/edge function with authenticated caller checks.
CEAC meeting records remain provider-independent.

## 8. Multi-unit audiences
Audience expansion must be resolved server-side or by a security-definer RPC that validates the organiser's authority for every selected scope.
Selecting a unit must not allow an organiser to invite people they could not otherwise legitimately schedule.
Resolved participants must be persisted so later membership changes do not silently rewrite the historical audience.

## 9. Audit integrity
Submitted reports, submitted project closes, authoritative activity history, meeting decisions/outcomes and other immutable records must not gain ordinary edit/delete paths.
Corrections should normally be new attributable versions or approved correction events.
Maintenance deletion of known test data is exceptional and must not weaken normal triggers or policies.

## 10. Finance
Money remains currency + amount_minor.
Never combine currencies into one total without an approved conversion policy.
No client-side currency conversion is authoritative.

## 11. Responsive security
Mobile and desktop may have different composition, but the same authority boundary.
Do not expose a control on one form factor that bypasses restrictions present on another.

## 12. AI boundary
AI remains assistive only under the approved architecture.
It may transcribe, extract structure or draft for review where explicitly allowed.
It may not score/rank people, approve HR/finance/access actions, make hidden performance judgements, or silently write consequential records.
Provider credentials remain server-side.

## 13. Migration ownership
Only one active migration owner at a time.
Before creating a migration, read the current handoff state and latest migration numbers.
Never recreate or renumber already-applied migrations.
Every new migration must replay from a clean database in CI.

## 14. Mandatory gates
A redesign tranche is not complete until the relevant checks are green:
- npm/build CI;
- clean migration replay;
- SQL RLS tests;
- Admin & HR security gate where applicable;
- Meeting authority gate where applicable;
- role/browser acceptance;
- responsive viewport acceptance;
- persistence acceptance for changed settings.

## 15. Handoff rule
Future builders must read, in order:
1. AGENTS.md
2. current system handoff
3. 20 September architecture amendment
4. Product Intelligence & Experience Amendment
5. this security contract
6. relevant role/panel spec
7. Design System source of truth
8. security document for the affected domain.

Conflicts are resolved in favour of the newest explicitly approved amendment for that topic, except that no newer product/design document may silently weaken a security/database contract.