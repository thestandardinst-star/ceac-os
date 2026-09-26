# CEAC OS — Stage 12 Integrations Architecture

**Date:** 26 September 2026
**Status:** IMPLEMENTATION CONTRACT — STAGE 12 ACTIVE
**Repository:** `thestandardinst-star/ceac-os`
**Baseline main:** `225185e75050085ccc14026b46947eead3e52167`
**Baseline state:** Stage 1–11 + premium redesign + subsequent experience/design corrections through current main merged
**Latest migration at activation:** 096
**Active branch:** `chatgpt/enterprise-expansion-stage-12-integrations-2026-09-26`

## 1. Purpose

Stage 12 turns the existing Stage 1G Integration Gateway and the premium **Connected Apps** experience into real, secure provider integrations.

Stage 1G already provides:
- connector metadata;
- event subscriptions;
- an integration outbox;
- queue ownership boundaries;
- audit/event foundations.

Stage 12 must build on that foundation. It must not create a parallel connector framework.

A branded card, pasted URL, or enabled connector row is **not** proof that an integration exists.

## 2. Stage 12 boundaries

Stage 12 may implement:
- provider connection/authentication lifecycle;
- secure server-side credential/token handling;
- provider capability/scopes;
- token refresh/reconnect;
- outbound delivery workers;
- inbound webhook verification and normalisation;
- idempotency and duplicate protection;
- retry/backoff and terminal failure handling;
- provider health state;
- disconnect/revoke flows;
- user-facing Connected Apps administration;
- audited provider actions;
- automatic meeting creation only where a real provider connection supports it.

Stage 12 must not implement:
- Payroll;
- Search/Intelligence;
- Assistive AI;
- employee scoring/ranking;
- HR/finance/access decisions by an integration;
- unrestricted direct messages;
- provider secrets in browser code or browser-readable tables.

Stage 13 remains blocked until CEAC payroll rules are explicitly confirmed.

## 3. Initial provider families

Stage 12 was explicitly resumed by the product owner on 26 September 2026 after the premium/design work had already merged. The live Supabase project is at migration 096, Supabase Vault is installed, and no Edge Functions are deployed at activation. Migration 097 is therefore the first Stage 12 migration owner.

The first provider adapter is **Telegram**:
- bot token is entered only into the server connection flow and stored encrypted in Supabase Vault;
- browser-readable tables never contain the token;
- the first advertised provider capability is `send_notification`;
- destination chat ID is non-secret connection metadata;
- outbound notifications use selected existing CEAC platform events and default to privacy-safe event labels rather than raw event payloads;
- connection is not called `connected` until Telegram validates the bot token.

Google Calendar/Meet, Google Drive and Zoom follow only after the common contract and Telegram adapter pass.

The product architecture currently exposes or anticipates these provider families:
- Google Workspace;
- Google Calendar;
- Google Meet;
- Google Drive;
- Zoom;
- Telegram.

This list defines approved product direction, not a requirement to ship every provider in one commit.

Each provider must be implemented and accepted independently against the common Stage 12 contract before being called connected.

## 4. Connection lifecycle

Canonical connection states:
- `not_connected`;
- `connecting`;
- `connected`;
- `needs_reconnect`;
- `disabled`;
- `revoked`;
- `error`.

Every state transition must be attributable and audited.

A connection record may expose non-secret metadata such as:
- provider key;
- organisation;
- connected account display name/email where provider policy allows;
- capabilities/scopes granted;
- connection state;
- last successful health check;
- last error category;
- created/updated actor/time.

It must not expose:
- access tokens;
- refresh tokens;
- client secrets;
- webhook signing secrets;
- provider private keys.

## 5. Secret boundary

Provider credentials and tokens are server-side only.

Requirements:
- no provider secret in React source;
- no secret in localStorage/sessionStorage;
- no secret in browser-readable Supabase tables;
- no secret in audit/event payloads;
- no secret in client-visible error messages;
- minimum necessary provider scope;
- rotation/revocation path documented;
- production secret ownership/recovery documented outside repository content.

If the chosen deployment secret store cannot satisfy these constraints, stop Stage 12 rather than weakening the boundary.

## 6. OAuth / provider authorisation

Where a provider uses OAuth:
- initiation must originate from an authorised CEAC administrator/integration manager;
- callback handling is server-side;
- anti-forgery state must be validated;
- returned organisation/account identity must be bound to the initiating CEAC organisation;
- requested scopes must be explicit and minimal;
- failed/denied authorisation must leave no false `connected` state;
- refresh/reconnect must not require exposing tokens to the browser.

A successful OAuth redirect alone does not prove the provider is usable; capability verification/health must pass.

## 7. Provider capabilities

Connections advertise explicit capabilities, for example:
- create calendar event;
- create meeting;
- read approved calendar metadata;
- read/write approved Drive resources;
- send approved Telegram notification.

The client must not infer capability from provider name.

UI actions must appear only when:
1. CEAC authority allows the action; and
2. the provider connection advertises the required capability.

Provider capability never broadens CEAC business authority.

## 8. Outbound delivery

Stage 12 must use the existing integration outbox rather than sending external requests directly from ordinary product screens.

Delivery worker requirements:
- server-owned execution;
- exactly-once business intent through idempotency keys;
- retryable vs terminal error classification;
- bounded retry/backoff;
- attempt history;
- no browser mutation of delivery state;
- no duplicate provider action after worker retry;
- audit trail for consequential deliveries.

A failed provider delivery must not silently mark the CEAC business action as externally completed.

## 9. Inbound webhooks

Inbound provider webhooks:
- terminate at a server-side endpoint;
- validate provider signature/authenticity where supported;
- reject replay/duplicate events;
- record provider event identity/idempotency key;
- normalise into a provider-neutral event record;
- never directly grant CEAC authority;
- never directly overwrite protected HR, finance, access or compliance facts.

Any mutation of core CEAC data must pass through a reviewed, authorised domain command/RPC with its own audit rules.

## 10. Meeting providers

Meeting UI may continue to offer:
- Google Meet;
- Zoom;
- Other link.

Rules:
- **Other link** remains a user-provided URL and is not an integration.
- Google Meet/Zoom may be labelled automatically created only when the corresponding connected provider capability succeeds.
- failed provider creation must leave the CEAC meeting record in a truthful recoverable state;
- provider meeting IDs and join URLs are metadata, not authority;
- provider credentials are never exposed in meeting records.

## 11. Connected Apps UX

Premium redesign remains locked.

Administration → Control Center → Connected Apps must show human-facing cards with:
- provider identity;
- connection status;
- connected account;
- what CEAC OS can do;
- required/granted permissions;
- last health state;
- connect/reconnect/disconnect;
- clear error/recovery guidance.

Technical fields such as raw tokens, webhook payloads, queue IDs and retry internals belong only in authorised Advanced diagnostics.

Do not recreate the old engineering-facing Integrations screen as the primary experience.

## 12. Authority

`integration.manage` remains the organisation-level management capability unless a provider-specific contract explicitly requires a narrower capability.

Rules:
- Staff cannot connect/disconnect organisation providers;
- Unit Manager status alone does not grant provider administration;
- Executive status alone does not grant provider administration;
- browser roles cannot mutate outbox/service-owned state;
- integration worker/service authority does not imply HR, Finance, Compliance or Access authority.

## 13. Audit and observability

At minimum audit:
- connection initiated;
- connected;
- reconnect required;
- disabled;
- revoked/disconnected;
- scope/capability change;
- subscription change;
- provider delivery final failure;
- inbound event accepted/rejected when consequential.

Operational diagnostics must support:
- connector health;
- last successful provider action;
- pending/retry/failed deliveries;
- provider error category;
- webhook verification failures;
- duplicate suppression.

Never log secrets.

## 14. Failure behaviour

CEAC OS core work must remain usable when a provider is unavailable.

A provider outage must:
- not block unrelated CEAC work;
- preserve the CEAC source record;
- show truthful pending/failed external state;
- permit safe retry where appropriate;
- not duplicate provider actions;
- not silently fall back to a different provider.

## 15. Data / migration rule

Before creating migration 097:
- inspect current migration list;
- reuse Stage 1G tables where possible;
- extend instead of duplicating connector/subscription/outbox concepts;
- classify every new field as secret or non-secret;
- document RLS/RPC/service ownership;
- prove no browser secret access.

Only one Stage 12 migration owner at a time.

## 16. Test requirements

Every implemented provider must add:
- migration replay coverage;
- RLS/no-anon coverage;
- no browser secret exposure;
- integration.manage authority checks;
- cross-organisation isolation;
- connection-state lifecycle tests;
- idempotency/duplicate tests;
- retry/final-failure tests;
- disconnect/revoke tests;
- audit coverage;
- browser acceptance for Connected Apps;
- responsive product inspection;
- all previous Stage 1–11 + hardening gates.

Provider-specific tests must also cover its auth/webhook/signature rules.

## 17. Stage 12 implementation order

Build in this order:

1. Stage 12 common secure connection contract.
2. Secret/token server boundary.
3. Provider capability model.
4. Delivery worker + idempotency/retry contract.
5. Inbound webhook verification/normalisation contract.
6. Connected Apps product surface over the real connection model.
7. First provider adapter.
8. Validate end-to-end before adding the next provider.
9. Add remaining approved providers sequentially.
10. Whole Stage 12 cumulative inspection and closure.

Do not build multiple provider adapters in parallel until the common contract has passed.

## 18. Stage 12 exit gate

Stage 12 is complete only when:
- every shipped provider uses the common secure connection contract;
- no provider secret is client-readable or committed;
- provider scopes/capabilities are explicit;
- token refresh/reconnect works where applicable;
- outbound delivery is idempotent and retry-safe;
- inbound webhooks are authenticated and duplicate-safe where applicable;
- disconnect/revoke is truthful and audited;
- provider failure does not corrupt CEAC source records;
- Connected Apps reflects real connection state;
- automatic Meet/Zoom creation is only claimed when actually provider-created;
- CI, dependency audit, Migration Replay, Account Security and cumulative Quality Gate pass;
- Stage 1–11 + production-hardening gates remain green;
- browser acceptance and desktop/mobile product inspection pass;
- deployment validation or explicit provider-only blocker record exists;
- Stage 12 is merged to main before Stage 13 begins.

## 19. Stage 12 restart checkpoint — 26 September 2026

The earlier PR #45 contained only documentation and diverged from current main after later product/design work. It was closed without merge. This contract is the clean restart from current main.

Live activation facts:
- Supabase project: `efjljhftsesssumtshvp`;
- current live migration head: 096;
- `supabase_vault` is installed;
- no Supabase Edge Functions are deployed yet;
- current Integration Gateway tables from Stage 1G are live and must be extended, not replaced;
- the existing `AdminIntegrations` screen is still an engineering-facing Stage 1G surface and must become the premium Control Center → Connected Apps experience.

## 20. Current baseline debt carried into Stage 12

Stage 12 must not silently hide these known baseline items:
- Vercel live-preview access/rate-limit prevented direct closure inspection and was explicitly waived by the product owner;
- route/module code splitting remains performance debt and should be addressed before Stage 14/15 materially expand the bundle;
- finance evidence is a source/reference, not yet a secure receipt-file workflow;
- dedicated external application observability/error telemetry is not yet a standalone subsystem.

None of these permits weakening Stage 12 security or authority boundaries.
