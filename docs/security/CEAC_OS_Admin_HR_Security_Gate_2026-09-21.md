# CEAC OS — Administration & HR Security Gate

**Date:** 21 September 2026  
**Branch:** `codex/admin-hr-completion`  
**Purpose:** establish the security boundary before protected Administration & HR features are built.

## Gate rule

No new Administration & HR feature screen that handles protected employee information should be built until this gate passes.

The gate is intentionally narrower than the product build. It does not add salary, Ghana Card, SSNIT, tax, banking, contracts, payslips or protected employee documents. It makes it harder to add those things insecurely.

## Current verified baseline

At the start of this gate:

- live Supabase project: `efjljhftsesssumtshvp`;
- repository/live migrations: 001–066;
- all ordinary `public` application tables have RLS enabled;
- 86 public SECURITY DEFINER functions exist;
- 68 are intentionally callable by `authenticated`;
- 0 are callable by `anon`;
- all inspected SECURITY DEFINER functions have a fixed `search_path`;
- no Supabase Storage buckets exist;
- no protected HR fields are present in `public.profiles`;
- `profile_personal_details` is owner/Admin only;
- leaked-password protection is still a Supabase Auth configuration item to enable before real-user rollout.

## Migration 067

Migration 067 makes two narrow changes.

### 1. Cross-organisation threshold hardening

`app_threshold(org_id,...)` is a SECURITY DEFINER helper. Before 067, a signed-in user could supply an arbitrary organisation ID. The threshold values are low-sensitivity configuration, but that pattern is unacceptable before payroll/HR expansion.

067 requires signed-in callers to use their own organisation ID. Trusted service/scheduled contexts remain able to process organisation-scoped checks.

### 2. Secure defaults for future functions

Postgres grants function EXECUTE broadly by default unless default privileges are changed.

067 revokes default EXECUTE for future public-schema functions from:

- PUBLIC;
- anon;
- authenticated.

Any future client-callable RPC must therefore grant EXECUTE deliberately in its own migration.

Existing RPC privileges are not bulk-changed by 067.

## Permanent test gate

`supabase/tests/admin_hr_security_gate.sql` is run by the GitHub Quality Gate after the existing RLS smoke test.

It fails when:

- a public application table lacks RLS;
- an anonymous caller can execute a SECURITY DEFINER function;
- a SECURITY DEFINER function lacks a fixed search path;
- the authenticated SECURITY DEFINER surface grows above the accepted 68 without deliberate gate review;
- a newly created function receives broad EXECUTE by default;
- sensitive HR fields are added to `public.profiles`;
- an HR/protected-document bucket is public;
- Staff can use `app_threshold` across organisations;
- Staff or Manager can invoke Admin People aggregation;
- Staff can self-promote to Administration;
- Manager can read Staff-private personal details;
- Executive can read HR-private personal details by default;
- Executive can invoke Administration-only People aggregation;
- Administration loses its legitimate access.

## HR data architecture locked by this gate

### Ordinary operational profile

`public.profiles` remains for ordinary identity/employment facts required by the operating system.

It must not become the home of:

- Ghana Card / national ID;
- SSNIT / tax identifiers;
- bank/payment account information;
- salary/payroll data;
- payslips;
- protected contracts/documents.

### Protected HR data

Protected HR will be designed as a separate boundary. The implementation must use narrowly scoped tables/RPCs and explicit authority checks instead of assuming that a higher navigation role may read everything.

### Protected documents

When document storage is introduced:

- the bucket must be private;
- no public object URLs;
- Storage access must use RLS;
- Staff access is limited to documents explicitly belonging to them where product rules allow;
- Administration access is explicit;
- Group Pastor/Executive access is not inherited automatically from leadership status;
- signed URLs, if used, must be short-lived and created only after an authorised request.

## Remaining production security tasks

This gate does not silently claim the whole system is production-hardened.

Still required later:

1. formal function-by-function least-privilege review of the current authenticated RPC surface;
2. enable Supabase leaked-password protection before real-user rollout;
3. add GitHub branch protection / required checks for `main`;
4. design protected HR tables and private Storage before protected documents are implemented;
5. define payroll approval/reversal authority before payroll writes are built;
6. final backup/restore and CEAC ownership handover.

## Build rule

Administration & HR implementation may proceed only after migration replay, Account Security, Quality Gate, and this Admin/HR security gate all pass.

Any later migration that expands protected data or authenticated SECURITY DEFINER access must extend this gate in the same pull request.
