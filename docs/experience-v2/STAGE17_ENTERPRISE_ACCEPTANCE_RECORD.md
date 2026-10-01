# CEAC OS Experience V2 — Stage 17 Enterprise Reconciliation Acceptance

Date: 1 October 2026
Programme: Experience V2
Stage: 17 — Merge V2 and Reconcile Enterprise Sequence
Enterprise PR: #71
Status: ACCEPTED FOR PROTECTED-MAIN MERGE

## Exact accepted application head

`1cc76a013c8dc3904bdc09f00fe2bded3a12904a`

This is the accepted enterprise reconciliation application SHA. Documentation commits after this checkpoint do not replace the accepted application SHA.

## Reconciliation result

Experience V2 was already merged to protected `main` through PR #72 at:

`1b3d6b4f62c93f9de41462fe0dbcef920077b3bd`

PR #71 was then reconciled forward from that accepted V2 main. The reconciliation preserves the Stage 12 secure integration architecture while resolving the Connected Apps product surface in favour of the accepted Experience V2 system.

The accepted branch contains:
- the Stage 1G Integration Gateway extension rather than a parallel connector framework;
- migration 099 for the secure integration runtime;
- migration 100 for browser-role table privilege hardening;
- Supabase Vault-backed provider secret storage;
- explicit provider capability and connection-state contracts;
- server-owned connection, health, subscription, disconnect and delivery operations;
- retry/idempotency and delivery-attempt evidence;
- inbound duplicate suppression;
- Telegram as the first provider adapter;
- the V2 Administration → Control Center → Connected Apps surface;
- cumulative SQL/security, runtime and browser acceptance coverage.

## Exact-head gates

All required exact-head gates passed on `1cc76a013c8dc3904bdc09f00fe2bded3a12904a`:

- CI PASS — run `36847312410` (#1521);
- Migration Replay PASS — run `36847312471` (#1131);
- Account Security PASS — run `36847312561` (#1303);
- complete Level B Quality Gate PASS — run `36847312429` (#1329);
- Level B SQL/RLS/security contracts PASS;
- browser shard 1/4 PASS;
- browser shard 2/4 PASS;
- browser shard 3/4 PASS;
- browser shard 4/4 PASS;
- merged exact-head product evidence PASS;
- role-and-RLS coordinator PASS;
- Vercel PASS.

## Product evidence

Exact-head Connected Apps artifact:

- artifact: `stage12-connected-apps-inspection`;
- artifact id: `11154127943`;
- digest: `sha256:2d465b2a740a53aefaf592422d85f6f5ed10256d3f4791ec734d020f67590cc6`.

Direct inspection covered Administration desktop and mobile Connected Apps output.

The inspected product remains truthful in the disconnected state:
- Telegram is labelled Not connected;
- no connected account is fabricated;
- no capability or provider permission is claimed before verification;
- Connect remains the explicit activation action;
- diagnostics expose no secret values;
- desktop and mobile composition remain within the accepted V2 shell.

No unresolved deterministic product regression was found in the exact-head Connected Apps evidence.

## Live Supabase validation

Live project `efjljhftsesssumtshvp` is healthy.

The live migration ledger contains:
- `099_integration_runtime`;
- `100_integration_table_privilege_hardening`.

The live `integration-runtime` Edge Function is ACTIVE with `verify_jwt=true`.

The deployed `index.ts` and `telegram.mjs` contents match the accepted repository files at `1cc76a013c8dc3904bdc09f00fe2bded3a12904a`.

Live privilege validation confirmed:
- authenticated has SELECT-only access to the seven public integration metadata/diagnostic tables;
- authenticated has no INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER privilege on those tables;
- anon has no integration table privilege;
- browser roles cannot execute the service-owned secret/read/claim functions;
- browser roles cannot use `integration_private`;
- the server worker authentication secret exists in Vault.

## Provider activation state

The live provider catalogue contains Telegram, but there is currently no production Telegram connector, active subscription or queued delivery.

That is an explicit provider activation dependency, not a false success state.

No CEAC Telegram bot token or destination has been supplied for production activation, so acceptance does not fabricate a connected provider or send an external test message.

This satisfies the Stage 12 exit rule allowing deployment validation plus an explicit provider-only activation record. Telegram must remain shown as Not connected until an authorised CEAC administrator supplies and verifies the real provider credential and destination through Connected Apps.

## Security and authority boundaries preserved

The accepted reconciliation does not:
- expose provider credentials to the browser;
- broaden Staff, Manager or Executive provider-administration authority;
- grant browser roles service/worker authority;
- weaken RLS/RPC/auth or capability checks;
- send raw CEAC event payloads to Telegram;
- allow provider capability to expand CEAC HR, Finance, Compliance or Access authority;
- reopen Payroll;
- restore superseded V2 visual debt.

## Decision

The reconciled enterprise integration sequence is accepted for protected-main squash merge.

After the merge, Stage 17 must record the exact merged main SHA, reconcile BUILD_STATE on main, and close the programme only after that documentation checkpoint is merged.
