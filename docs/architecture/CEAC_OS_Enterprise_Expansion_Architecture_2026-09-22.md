# CEAC OS — Enterprise Expansion Architecture

**Date:** 22 September 2026  
**Status:** APPROVED / BINDING  
**Programme:** CEAC OS Platform Kernel → Enterprise HCM + Work Management expansion  
**Baseline main:** `c17edf2dacc0f554f12a7ed2834ecc2afde1b0ce`  
**Precedence:** This is the newest approved whole-system expansion architecture. It supplements the 20 September Architecture Amendment and the 21 September Product Intelligence, Collaboration/PWA, Assistive Input and security contracts. It does not weaken existing RLS, protected-HR, Work Engine, finance, evidence, meeting-authority or audit requirements.

## 1. Product definition

CEAC OS is the operating system for CEAC's people, work and ministry operations.

It connects:
- employee lifecycle;
- organisation structure;
- attendance and leave;
- goals and objectives;
- projects, campaigns and events;
- work execution and evidence;
- collaboration and meetings;
- performance and development;
- learning;
- assets;
- governance and compliance;
- finance/payroll where approved;
- reporting and leadership intelligence;
- integrations and assistive AI.

It is not intended to clone Workday, Rippling, BambooHR, Asana or Monday feature-for-feature. It adopts proven enterprise patterns while preserving CEAC's operating model and existing product principles.

## 2. Platform model

All future modules attach to shared platform services rather than inventing separate implementations.

### Shared platform services

1. People & Employment
2. Authority & Permissions
3. Audit & History
4. Policies & Rules
5. Events & Workflows
6. Integrations
7. Notifications
8. Search & Intelligence

### Enterprise domains

| Domain | Capabilities |
|---|---|
| People | People, employment, organisation structure, documents |
| Lifecycle | onboarding, transfers, promotions, manager changes, offboarding |
| Workforce | schedules, attendance, leave, corrections, capacity |
| Talent | goals, performance, feedback, development, learning |
| Work | work engine, projects, programmes, portfolios, milestones, dependencies |
| Planning | workload, resources, risks, issues, capacity |
| Collaboration | Rooms, meetings, announcements |
| Assets | devices, equipment, assignment history |
| Governance | policies, compliance, approvals, audit |
| Finance | budgets, spend, compensation, payroll when approved |
| Intelligence | reporting, organisation pulse, executive insight |
| Platform | workflows, integrations, search, notifications, assistive AI |

## 3. Non-negotiable build rule

No consequential feature may be built UI-first.

For every feature, implementation order is:

```
Purpose
→ authority model
→ data contract
→ sensitive-data classification
→ lifecycle/state machine
→ audit contract
→ correction/reversal contract
→ migration/RLS/RPC
→ automated security tests
→ UI
→ browser/responsive acceptance
→ handoff
```

UI visibility is never access control.

## 4. Feature build contract

Every future build brief must define all twelve items:

1. **Purpose** — real CEAC problem being solved.
2. **Users** — roles using the capability.
3. **Authority** — who may read, create, modify, approve and reverse.
4. **Data** — objects, tables, fields and relationships.
5. **Sensitive data** — protected storage/classification requirements.
6. **Lifecycle** — valid object states and transitions.
7. **Audit** — permanent events required.
8. **Reversal** — how mistakes are corrected without rewriting history.
9. **Integrations** — external systems and data boundaries.
10. **UI** — required guided flows/screens.
11. **Tests** — security, persistence, browser, responsive and migration tests.
12. **Acceptance** — real-world journey proving completion.

A feature brief missing any item is incomplete.

## 5. Definition of done

A feature is complete only when all applicable items pass:

- architecture defined;
- migration created;
- clean migration replay passes;
- RLS/authority enforced;
- audit behaviour implemented;
- correction/reversal defined;
- UI implemented;
- desktop tested;
- mobile tested;
- intended role tested;
- unauthorised role tested;
- error states tested;
- persistence tested after reload;
- relevant security gate passes;
- production/preview inspected as a product;
- architecture/handoff updated.

A visible screen alone is never completion.

## 6. Sequential programme

Stages are gates. Do not begin a later stage while an earlier stage has a known security, persistence, authority or migration defect.

### Stage 0 — Platform baseline and production security closure

No new enterprise product functionality.

Required:
- record exact production baseline;
- protect `main` with PR/required-check enforcement;
- disable force pushes/deletion where supported;
- secure privileged GitHub/Supabase/deployment/Workspace accounts with MFA;
- enable Supabase leaked-password protection before real-user rollout;
- formal least-privilege review of authenticated SECURITY DEFINER functions;
- secret/credential audit;
- verify private Storage boundaries;
- establish backup and tested restore procedure;
- document production ownership and recovery;
- confirm CI/security gates against the exact baseline.

Completion is required before Stage 1.

### Stage 1 — Platform Foundation v2

Build shared enterprise substrate before feature modules.

#### 1A Employment history
Preserve joining, employment type, title, unit, manager, role, working pattern, contract changes, transfers, promotions, status changes and exit as history rather than destructive overwrites.

#### 1B Platform audit
Extend append-only attributable audit behaviour to consequential system changes. Audit records must not be editable/deletable through normal application authority.

#### 1C Capability-based authority
Introduce explicit capabilities such as people management, protected-HR access, attendance correction, performance administration, payroll preparation/approval and audit viewing. High-level role alone must not imply access to every sensitive capability.

#### 1D Event framework
Provide authoritative internal events such as employee.created, employee.transferred, leave.approved, project.at_risk, review.opened and device.assigned.

#### 1E Workflow Engine v1
Support controlled triggers, conditions and approved actions. Do not permit arbitrary user-supplied code execution.

#### 1F Policy/rules engine
Version rules by effective date and scope. Historical calculations must resolve against the policy that applied at the relevant time.

#### 1G Integration gateway
All external integrations use server-side credentials, explicit scopes, attributable writes, failure/retry handling and audit. Screens do not embed provider secrets or independently implement privileged external calls.

### Stage 2 — Employee Lifecycle

Build:
- guided new-employee flow;
- onboarding templates;
- onboarding dashboard;
- transfers;
- manager/title/role changes;
- promotions;
- offboarding;
- handover;
- access and equipment return.

Offboarding must not be equivalent to merely setting `active=false`.

### Stage 3 — Protected HR

Expand `hr_private` for confirmed product requirements:
- protected employee identifiers;
- protected documents;
- employment terms/contracts;
- compensation history;
- payment details;
- sensitive access events.

Do not place Ghana Card, SSNIT/tax identifiers, bank data, salary, payroll or payslips in ordinary profiles.

Executive/Group Pastor status does not automatically grant protected-HR access.

### Stage 4 — Goals and Strategy

Implement a flexible hierarchy:

```
Ministry Direction
→ Ministry Objective
→ Unit Objective
→ Programme / Portfolio
→ Project
→ Milestone
→ Work
```

Support descriptive and numeric goals. Never derive fake percentages from descriptive sentences.

### Stage 5 — Work Management 2.0

Add:
- portfolios/programmes;
- mature project metadata;
- milestones;
- work/milestone/project dependencies;
- risks;
- issues;
- portfolio reporting.

Do not overbuild a full generic project-scheduling engine when CEAC does not need it.

### Stage 6 — Resource and Workload Management

Build planning capacity from:
- working patterns;
- approved leave;
- routine responsibilities;
- estimated effort;
- project commitments.

Attendance hours are context, not the sole capacity/performance measure.

### Stage 7 — Performance & Development

Build:
- review cycles;
- automatically assembled evidence packs;
- employee reflection;
- manager narrative assessment;
- review conversation record;
- development plans;
- continuous factual feedback.

No composite employee score, ranking or hidden algorithmic judgement.

### Stage 8 — Learning

Build a focused learning layer:
- catalogue;
- courses/modules/resources;
- assignments by person/role/unit/onboarding template;
- completion;
- optional quizzes/certifications/expiry later;
- skills linkage when evidence supports it.

### Stage 9 — Workforce Management 2.0

Build:
- schedules/day types;
- expected-vs-actual work context;
- attendance corrections;
- approval/reversal history;
- leave policy engine;
- balances once CEAC policy is confirmed;
- organisational workforce calendar.

No-session-recorded must never automatically mean absence.

### Stage 10 — Assets and Devices

Build native asset/device inventory and lifecycle:
- asset ID;
- device details;
- purchase/warranty;
- unit/location;
- assignment history;
- repair/return/retirement.

Do not build OS-level MDM enforcement initially. Integrate a specialist provider later if CEAC needs remote wipe, encryption enforcement or endpoint configuration.

### Stage 11 — Compliance & Policy Management

Build compliance as rules + evidence + exceptions, not a decorative dashboard:
- versioned policies;
- applicability;
- acknowledgements;
- requirements;
- evidence;
- expiries;
- approved exceptions;
- resolution.

No employee compliance score.

### Stage 12 — Integrations

Expand only through the Integration Gateway.

Priority:
1. Google Workspace / Drive / Calendar / email / Telegram.
2. Accounting/payroll/payment, MDM, identity and meeting providers only where CEAC has a confirmed use case.

Every integration must define data leaving CEAC OS, data returning, scopes, trigger authority, retries/idempotency and audit.

### Stage 13 — Payroll

Do not implement until CEAC formally confirms:
- salary basis;
- allowances;
- deductions;
- SSNIT/PAYE handling;
- approval authority;
- payment process;
- correction/reversal process;
- pay periods;
- payslip requirements.

Required lifecycle:

```
Period
→ draft
→ employee changes
→ calculation
→ flags
→ human review
→ approval
→ immutable approved run
→ payslips/payment/export
→ attributable adjustments/reversals
```

Automatic payroll approval remains prohibited.

### Stage 14 — Search and Intelligence

Permission-aware search across authorised CEAC records.

Evidence-backed operational intelligence may surface:
- stalled work;
- cross-unit dependencies;
- missing reports;
- objectives without active delivery;
- overloaded future capacity;
- expiring contracts/documents;
- incomplete onboarding;
- approaching milestones.

Every insight must explain why it appeared and open to supporting facts.

### Stage 15 — Assistive AI

Only after authoritative data, permissions and workflows are mature.

AI may:
- search authorised context;
- summarise;
- draft;
- extract structure;
- identify recorded patterns;
- explain evidence;
- prepare reports/work for confirmation.

AI may not independently:
- approve payroll;
- change salary;
- change permissions;
- terminate staff;
- approve leave;
- make disciplinary decisions;
- score/rank employees;
- silently write protected or consequential state.

## 7. Environment progression

Before sensitive HR/payroll data is introduced, use logical separation:

```
Development
→ automated migration/security tests
→ Staging with synthetic data
→ browser/role acceptance
→ Production
```

Real salary, bank details and national identifiers must not be copied into development test data.

Production database changes must originate from reviewed migrations except for documented emergency recovery.

## 8. Security principles carried forward

The following existing rules remain binding:
- RLS/database authority is the security boundary;
- no sensitive HR in ordinary profiles;
- private files remain private;
- service credentials remain server-side;
- anonymous SECURITY DEFINER execution remains prohibited;
- authenticated privileged RPC growth requires deliberate review;
- consequential changes are attributable;
- authoritative history is append-only or corrected by version/reversal;
- money remains amount_minor + currency unless an explicit conversion policy exists;
- AI is assistive only;
- no employee composite score/ranking;
- attendance is context, not performance;
- every important number/flag must be explainable from recorded evidence.

## 9. Implementation ownership

One active implementation owner/tranche at a time.

Before any migration:
1. read AGENTS.md;
2. read current handoff;
3. confirm current main SHA;
4. confirm latest migration number;
5. confirm no parallel migration owner;
6. read this architecture and the relevant domain/security spec.

Shared schema/platform contracts require whole-system review because they affect all four role surfaces.

## 10. Immediate programme state

The enterprise programme begins with Stage 0 only.

No Stage 1 schema or enterprise feature UI should be merged until Stage 0 production-security closure is documented as passed.

