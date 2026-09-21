# CEAC OS — Current Build / Security Baseline

**Checkpoint:** 21 September 2026
**Repository:** `thestandardinst-star/ceac-os`
**Stable branch:** `main`
**Active development branch:** `codex/admin-hr-completion`
**Supabase project:** `efjljhftsesssumtshvp`
**Owner-facing URL:** <https://ceac-os-git.vercel.app>

This file is the current handoff baseline for ChatGPT, Codex, Claude, or a human developer. Read it before changing CEAC OS.

## Current main

Latest secured main checkpoint at the time of this document:

`f1d9cd35895cb6dc582c6859a8bcfd59c6b99332`

PRs completed during takeover:

- PR #4 — Staff / Manager operating surface and acceptance baseline — merged.
- PR #5 — Admin & HR security gate — merged.
- PR #6 — protected HR foundation — merged.
- PR #7 — frontend dependency and CI security hardening — merged.

Vercel reported successful deployment for the latest merged main.

## Live database

Logical migration baseline: **001–068**.

The two latest live security migrations are:

- 067 — Admin & HR security gate;
- 068 — protected HR foundation.

A clean local Supabase database replays the full migration history successfully.

## Staff / Manager acceptance baseline

The accepted browser tests cover:

- Manager assigns work;
- Staff receives and completes it;
- Staff submits;
- Manager returns it;
- Staff corrects and resubmits;
- Manager approves;
- completed work appears in Staff Record;
- blockers can be raised, acknowledged and resolved;
- personal details persist;
- private work is isolated;
- typed work creation is covered;
- mobile Staff rendering is covered;
- Administration and Group Pastor shared-route regressions are smoke-tested.

The original duplicate Manager review-row defect discovered by these tests was fixed.

## Database security baseline

### RLS / role separation

- public application tables use RLS;
- anonymous users cannot execute public SECURITY DEFINER functions;
- privileged functions have fixed search paths;
- signed-in privileged RPCs must show an approved actor / authority / visibility binding;
- Staff cannot self-promote;
- official Unit Head assignment remains Administration-controlled;
- Staff/Manager/Executive do not inherit protected HR-private access merely from navigation or seniority;
- private Staff work remains owner-only.

### Cross-organisation protection

`app_threshold(...)` now rejects signed-in attempts to read another organisation's threshold configuration.

### Future RPC defaults

PostgreSQL default function privileges were hardened.

New public functions are not automatically executable by PUBLIC, `anon`, or `authenticated`. Any future browser-callable RPC must grant EXECUTE deliberately in its migration.

## Protected HR foundation

Protected employee data must not be added to `public.profiles`.

A non-browser-exposed schema now exists:

`hr_private`

Browser roles have no schema usage or direct table access.

Initial protected structures:

- `hr_private.documents` — protected HR document metadata;
- `hr_private.audit_events` — append-only sensitive HR/security history.

The audit ledger rejects UPDATE and DELETE.

### Protected files

Private Supabase Storage bucket:

`ceac-hr-private`

Current condition:

- private;
- no direct browser Storage policy;
- no public object access.

Document access must be introduced later through explicit, tested Staff/Admin/Executive rules rather than opening the bucket broadly.

## HR/pay data that must remain out of ordinary profiles

Do not place the following in `public.profiles`:

- Ghana Card / national ID;
- SSNIT or tax identifiers;
- bank/payment details;
- salary/payroll records;
- payslips;
- protected contracts/documents.

The permanent Admin/HR security gate fails if protected HR fields are added to the ordinary profile model.

## Security gates

The repository currently enforces through GitHub Actions:

- application build;
- `npm audit --audit-level=high`;
- migration replay;
- invited-account lifecycle;
- SQL RLS smoke tests;
- Admin/HR security gate;
- role-routing / browser smoke tests.

The Supabase CLI used by security workflows is pinned instead of resolving `latest`, reducing CI failures caused by external rate limits.

## Frontend dependency baseline

Resolved secured toolchain:

- Vite 8.3.0;
- @vitejs/plugin-react 6.1.1;
- Node >=22.12 <23.

The earlier high-severity dependency audit finding from the old Vite/esbuild chain is no longer present in the resolved lockfile.

The CI build now fails on high or critical npm audit findings.

Dependabot monitoring is enabled for npm and GitHub Actions dependency updates.

## Live security verification

After migrations 067–068, live Supabase verification confirmed:

- `hr_private` exists;
- `anon` cannot use it;
- `authenticated` cannot use it;
- protected HR tables have RLS enabled;
- `ceac-hr-private` is private;
- no browser policy currently targets that bucket;
- HR audit immutability trigger exists;
- anonymous SECURITY DEFINER execution count is zero;
- authenticated SECURITY DEFINER functions without an approved actor/authority binding: zero.

## Supabase advisor findings that are intentional

The security advisor still reports:

1. RLS-with-no-policy on the two reference-counter tables and the two `hr_private` tables. This is intentional: the counter tables are RPC-only and the HR-private tables are deliberately inaccessible directly.
2. Authenticated SECURITY DEFINER functions. These are intentional application RPCs / RLS helpers and are now structurally checked by the Admin/HR security gate.

Do not bulk-revoke them merely to clear the advisor.

## Account-level controls that still require owner console access

These are not code/database gaps, but the current connectors cannot change them.

### Supabase leaked-password protection

Supabase Auth still reports leaked-password protection disabled.

Enable it in the Supabase Auth password-security settings before real CEAC user rollout.

### GitHub main-branch protection

The repository currently exposes no GitHub ruleset through the connected integration.

Before multiple builders are allowed to work independently against production, configure `main` so changes require a pull request and the relevant green checks.

The connected GitHub integration used here does not have permission to create/read branch-protection rules, so this cannot be truthfully marked complete from this session.

## What is deliberately not built yet

Security foundation does not equal the Admin/HR product build.

Still to be designed/implemented on top of this foundation:

- salary structure;
- statutory rate/version model;
- allowances and deductions;
- payroll runs and immutable corrections;
- protected employee identifiers;
- protected document upload/download policies;
- contract expiry workflows;
- appraisal/review cycles;
- detailed Admin/HR screens;
- final Group Pastor drilldown rules for protected HR/pay information;
- payroll practice environment.

Those features must extend the security tests in the same PR that introduces their access.

## Next development step

The secure code/database foundation is now ready for the Administration & HR product phase.

Before adding any protected HR capability:

1. define exactly who may read/write it;
2. add database/RPC rules first;
3. extend `supabase/tests/admin_hr_security_gate.sql`;
4. then build the UI;
5. run the full gate before merge.

Claude may return later as reviewer/contributor. Work from this baseline, not from the older file-ownership notes or pre-067 architecture assumptions.
