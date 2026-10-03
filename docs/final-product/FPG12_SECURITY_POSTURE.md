# FPG12 — Security Posture Classification

Date: 3 October 2026

## Direct protected-HR access
Supabase advisor reports RLS-enabled/no-policy information on protected HR tables. This is intentional deny-direct-access posture: live inspection confirms `anon` and `authenticated` hold no direct SELECT/INSERT/UPDATE/DELETE privileges on protected HR tables. Access remains through capability-gated protected RPCs.

## Internal reference counters
`objective_ref_counters` and `work_ref_counters` were RLS-protected but still carried broad direct table grants to `anon` and `authenticated`. They are internal implementation tables used by SECURITY DEFINER reference generators. FPG12 revokes those unnecessary client grants while preserving the accepted generator functions.

## SECURITY DEFINER advisor findings
Supabase flags authenticated-callable SECURITY DEFINER RPCs generically. CEAC intentionally uses definer RPCs for controlled operations, with authority checks enforced inside accepted functions and cumulative SQL/role/RLS gates. FPG12 does not perform a broad invoker/definer rewrite because that would change accepted authority semantics.

## Release posture
- no weakened RLS;
- no widened protected-HR access;
- no new public secrets;
- no new permission/audit/workflow engine;
- exact-head Level B verification required after this hardening.
