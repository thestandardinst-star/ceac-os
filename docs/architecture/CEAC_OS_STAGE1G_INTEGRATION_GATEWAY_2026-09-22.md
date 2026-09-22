# CEAC OS — Stage 1G Integration Gateway

**Date:** 22 September 2026
**Status:** IMPLEMENTATION CONTRACT
**Programme stage:** 1G — Platform Foundation v2
**Base:** Stage 1F green head `7a07b1a9f7372dfe13e172d2bbe5f730114fd5cd`

## Purpose

CEAC OS needs one controlled boundary for external integrations so later connectors do not read arbitrary product tables or embed credentials in browser code.

## Authority

- `integration.manage` controls connector/subscription configuration.
- Browser users never see or write integration secrets.
- Event delivery queue state is service-owned.
- Connectors are disabled by default.

## Data

`integration_connectors`
- organisation;
- connector key/type;
- display name;
- enabled state;
- non-secret configuration only;
- creator/time.

`integration_subscriptions`
- connector;
- platform event type;
- active flag;
- creation metadata.

`integration_outbox`
- platform event;
- connector/subscription;
- delivery state;
- attempt count;
- next attempt;
- last error category/message;
- timestamps.

Secrets remain outside public browser tables and are supplied only to a future server-side delivery worker.

## Lifecycle

Connector: `disabled ↔ enabled`.

Subscription: `active ↔ inactive`.

Outbox delivery: `pending → processing → delivered`, with `failed` retry state.

Stage 1G creates and governs the queue; it does not send real external requests.

## Events and audit

Connector/subscription changes are audited. Platform events matching active subscriptions enqueue exactly one outbox row per subscription/event pair.

## UI

Administration gains Integrations:
- view connector catalogue;
- register non-secret connector metadata;
- enable/disable connectors;
- subscribe enabled connectors to approved event types;
- see queued/delivered/failed delivery state.

## Tests

Required:
- RLS;
- no anonymous access;
- no browser secret columns;
- explicit `integration.manage` authority;
- browser cannot mutate outbox;
- matching event creates one queue item;
- duplicate queue creation prevented;
- disabled connector/subscription does not enqueue;
- audit coverage;
- browser acceptance;
- all previous gates remain green.

## Acceptance

Stage 1G passes when an authorised integration manager configures a connector/subscription, a matching platform event creates an outbox delivery record, the queue is immutable to browser roles, and no integration secret is exposed through public tables or client code.
