# CEAC OS Experience V2 — Stage 17 Acceptance Record

Date: 1 October 2026
Stage: 17 — Merge V2 and Reconcile Enterprise Sequence
Status: ACCEPTED AND COMPLETE

## Canonical release sequence

Experience V2 and the authorised enterprise integration reconciliation are complete.

1. Stage 16 release candidate was accepted at application SHA:
   `fbc3562022dac6b0ee94e75261087263c0ae1aa3`.
2. Experience V2 PR #72 was squash-merged to protected `main` at:
   `1b3d6b4f62c93f9de41462fe0dbcef920077b3bd`.
3. Superseded recovery/reference PR #69 was closed without merge.
4. The enterprise integration sequence was reconciled forward from accepted V2 main.
5. The exact accepted enterprise application SHA was:
   `1cc76a013c8dc3904bdc09f00fe2bded3a12904a`.
6. Stage 17 enterprise acceptance documentation passed its documentation integrity gate at:
   `5864cb39339ee0560d1834d695cfdad82ff45571`.
7. PR #71 was squash-merged to protected `main` at the verified commit:
   `3a287ea4d7be1305970c0224abc3d28800f73d45`.

The Git tree at PR #71 head `5864cb39339ee0560d1834d695cfdad82ff45571` and merged main `3a287ea4d7be1305970c0224abc3d28800f73d45` is identical:

`b7933e0cf41e9178f7556b462ce4ca9349026d44`.

Therefore the protected-main squash preserved the accepted enterprise tree exactly.

## Enterprise exact-head acceptance

Application SHA `1cc76a013c8dc3904bdc09f00fe2bded3a12904a` passed:

- CI — run `36847312410` (#1521);
- Migration Replay — run `36847312471` (#1131);
- Account Security — run `36847312561` (#1303);
- complete Level B Quality Gate — run `36847312429` (#1329);
- all four browser shards;
- SQL/RLS/security contracts;
- merged exact-head product evidence;
- role-and-RLS coordinator;
- Vercel.

Connected Apps exact-head evidence:
- artifact `stage12-connected-apps-inspection`;
- artifact id `11154127943`;
- digest `sha256:2d465b2a740a53aefaf592422d85f6f5ed10256d3f4791ec734d020f67590cc6`.

Direct desktop/mobile inspection found no unresolved deterministic high-severity Connected Apps regression.

## Live integration deployment

Supabase project `efjljhftsesssumtshvp` was validated after the enterprise acceptance gate.

Live facts:
- project status is healthy;
- migration `099_integration_runtime` is present;
- migration `100_integration_table_privilege_hardening` is present;
- `integration-runtime` Edge Function is ACTIVE with JWT verification enabled;
- deployed `index.ts` and `telegram.mjs` match the accepted repository source;
- authenticated browser users retain SELECT-only access to authorised public integration metadata;
- browser roles have no direct integration table mutation/TRUNCATE privilege;
- anon has no integration table privilege;
- browser roles cannot use `integration_private`;
- browser roles cannot execute service-owned provider-secret or worker functions;
- the integration worker authentication secret exists in Vault.

## Telegram activation state

Telegram is the first implemented provider adapter.

Production remains truthfully **Not connected** because no authorised CEAC production bot token and destination chat have been supplied and verified.

No credential, provider connection, subscription, external message or delivery record was fabricated to close Stage 17.

Future Telegram activation is an operational provider-configuration action through Administration → Control Center → Connected Apps. It is not unfinished Stage 17 implementation.

## Protected boundaries

Stage 17 did not:
- weaken RLS, RPC, authentication or capability checks;
- expose provider credentials to browser-readable storage;
- grant provider management to Staff, Unit Managers or Executive by role alone;
- allow the integration worker to inherit HR, Finance, Compliance or Access authority;
- send raw CEAC event payloads to Telegram;
- restore superseded visual/parity architecture;
- open Payroll.

Payroll remains BLOCKED until CEAC payroll rules are explicitly confirmed.

## Final decision

Stage 17 — Merge V2 and Reconcile Enterprise Sequence is ACCEPTED AND COMPLETE.

The canonical application line is protected `main`, with the accepted enterprise application tree merged at `3a287ea4d7be1305970c0224abc3d28800f73d45`.

This closure commit contains documentation only. It does not create a Stage 18 or reopen feature expansion.
