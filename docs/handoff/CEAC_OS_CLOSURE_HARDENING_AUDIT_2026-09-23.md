# CEAC OS — Closure & Production Hardening Audit

**Date:** 23 September 2026  
**Programme:** Premium redesign closure corridor  
**Branch:** `chatgpt/ceac-experience-recovery-architecture-2026-09-23`  
**Stage 11 merged baseline:** `732cc5a9e9d24e7085a65d8069bba73502190ad8`  
**Status:** FINAL INTEGRATION GATE PENDING

## 1. Closure rule

Feature expansion is paused. This corridor may only:
- diagnose confirmed bugs, security defects, integrity gaps and production-risk issues;
- add regression coverage for those defects;
- fix confirmed defects without redesigning the product architecture;
- reconcile the premium redesign onto merged Stage 11;
- freeze, verify and merge the resulting R7 baseline.

Stage 12 is not part of this branch.

## 2. Deployment inspection exception

The product owner explicitly instructed the programme to skip the inaccessible Vercel live-preview step and continue from hardening.

This is recorded as an **owner-approved deployment-inspection waiver**, not as a successful deployed-product inspection.

Known external condition:
- Vercel reported a build-rate-limit failure for redesign heads;
- the connected Vercel account exposed no authorised teams.

Repository/browser/security gates remain mandatory.

## 3. Production hardening findings and disposition

### 3.1 Deployment configuration could silently target the wrong Supabase project — FIXED

Previous client configuration included a hardcoded Supabase URL/publishable-key fallback.

Risk:
- a preview/production environment missing variables could silently connect to a specific project.

Fix:
- `src/lib/supabase.js` now requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`;
- missing deployment configuration fails closed.

The publishable key was not a service-role secret; the defect was environment isolation, not privileged-key exposure.

### 3.2 Baseline browser security headers were missing — FIXED

`vercel.json` now sets baseline headers:
- X-Content-Type-Options;
- Referrer-Policy;
- X-Frame-Options;
- Permissions-Policy;
- Cross-Origin-Opener-Policy.

The Permissions-Policy explicitly preserves CEAC OS capabilities already in use:
- geolocation: self;
- microphone: self;
- camera: disabled.

This prevents hardening from breaking attendance/location context or voice input.

### 3.3 Production dependency audit was not enforced — FIXED

CI now runs:
`npm audit --audit-level=high`

A high-severity production/dependency advisory therefore blocks the build instead of remaining invisible.

### 3.4 Finance request authority helper could expose another organisation's approval path — FIXED

`finance_request_path` is now:
- bound to `app_org_id()`;
- unavailable directly to authenticated browser callers;
- retained only as a server-internal authority helper.

The production hardening SQL gate proves both constraints.

### 3.5 Finance-request cancellation could rewrite recorded request facts — FIXED

A submitted request may still transition to cancelled, but cancellation can no longer rewrite:
- organisation;
- unit/project;
- requester;
- title/justification;
- amount/currency;
- needed date;
- original timestamps;
- fulfilment facts.

A trigger protects the transition and the hardening gate proves the trigger exists.

### 3.6 Spend reversals inflated some aggregate positions — FIXED

The budget-position RPC and Executive Finance now net append-only reversal entries instead of adding reversal values as new spend.

Historical entries remain preserved.

### 3.7 Finance approval contract existed in SQL but lacked a complete human operating surface — FIXED

The database already supported:
- manager request;
- Administration decision;
- Finance decision;
- Group Pastor decision;
- approved-request fulfilment into actual spend.

The premium UI did not expose the whole path.

A governed Finance decision queue now exposes only the existing server-authorised stage:
- Administration → Administration Finance;
- Finance → manager in a finance-handling unit;
- Group Pastor → Executive Finance.

The server RPC remains authoritative. Client-side stage display is not permission.

Approved requests may be converted into actual spend only through the existing fulfilment RPC.

The fulfilment UI requires a source/evidence reference such as a receipt, voucher or payment reference and records it with the spend line. This does **not** claim that a receipt file has been uploaded.

### 3.8 Anonymous SECURITY DEFINER execution — GATED

The production hardening SQL gate fails if any public SECURITY DEFINER function is executable by `anon`.

Existing Stage 1–11 RLS/RPC gates remain cumulative.

## 4. End-to-end pressure test

The browser acceptance suite is serial and now pressure-tests the actual persisted system across the operating chain.

Existing real-data browser flows cover:
- employee/employment history and lifecycle;
- protected HR;
- manager assignment → Staff execution → review/return → resubmission → approval → work history;
- contextual rooms and attributable mentions;
- meeting scheduling, audiences and contextual discussion;
- leave/schedule/correction lifecycle;
- performance/review/development;
- learning assignment/completion;
- asset custody/transfer/return/service/retirement;
- compliance policy → acknowledgement → evidence → exception → Administration review.

Closure additions cover:
- low-value manager finance request → Administration approval → actual spend → evidence reference;
- high-value manager finance request → Finance approval → Group Pastor approval → actual spend → evidence reference;
- final cross-module continuity checks on the Staff Fixture to confirm records created earlier in the suite remain visible through later product surfaces.

## 5. Destructive-action assessment

Core reviewed domains use one of:
- append-only history;
- explicit state transitions;
- reversing/correcting entries;
- reviewed RPCs.

No hard-delete workflow was introduced by the redesign or hardening corridor.

Protected-HR temporary storage cleanup is limited to a failed upload transaction; historical protected records use version replacement rather than deletion.

## 6. Accessibility/responsive state

R7 covers:
- named interactive controls across all four role shells;
- reduced-motion preference;
- supported mobile widths;
- no page-level horizontal overflow on the tested role surfaces;
- focus-managed Sheets with Escape and Tab trapping.

This is a practical closure gate, not a claim of formal WCAG certification.

## 7. Performance state

Recorded pre-hardening build:
- CSS approximately 255.76 kB / 42.37 kB gzip;
- JS approximately 1,179.48 kB / 277.63 kB gzip.

Vite reports the primary JavaScript chunk above 500 kB.

Disposition:
- accepted as explicit performance debt for this closure;
- route/module code splitting should be completed before Search/Intelligence and Assistive AI materially expand the browser bundle.

## 8. Remaining non-blocking debt / future gates

These are not silently classified as complete:
- live deployed-preview inspection was waived by the product owner because Vercel access/rate-limit blocked it;
- finance evidence is currently a recorded source/reference, not a secure receipt-file workflow;
- application observability/error telemetry is not yet a dedicated external subsystem;
- route-level code splitting remains performance debt;
- Stage 12 must define real provider auth, secret storage, token refresh, scopes, webhook/sync, idempotency, retry and disconnection contracts before calling Connected Apps a complete integration layer;
- Stage 13 remains blocked until CEAC payroll policy is explicitly confirmed.

## 9. Merge requirements

Before premium redesign merge:
1. exact final R7/hardening head CI green;
2. Migration Replay green;
3. Account Security green;
4. clean cumulative Quality Gate green including production-hardening SQL gate and browser journeys;
5. PR based directly on merged Stage 11 main;
6. no unresolved merge conflict;
7. final R7 SHA frozen and recorded.

After merge, that merge SHA becomes the Stage 12 baseline.
