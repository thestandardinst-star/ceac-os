# CEAC OS — Stage 1D Event Framework

**Date:** 22 September 2026
**Status:** IMPLEMENTATION CONTRACT
**Programme stage:** 1D — Platform Foundation v2
**Base:** Stage 1C green head `4f9f4c7e61e89a6df674a67ba839e7a814eb6045`

## Purpose

CEAC OS needs a durable internal event stream so workflows, integrations, notifications and later intelligence can react to business events without coupling every feature directly to every other feature.

## Users

- End users do not author system events directly.
- Administration users with `audit.view` may inspect the event stream for diagnostics and governance.
- Domain functions, reviewed triggers and later service integrations may emit events.

## Authority

Browser roles cannot directly insert, update or delete event rows.

The internal emitter is not executable by `anon` or `authenticated`; it is called from trusted database functions/triggers and may be executed by `service_role`.

## Data

`platform_event_definitions`
- canonical event type;
- label;
- description;
- source domain;
- payload version;
- active flag.

`platform_events`
- event type;
- organisation;
- actor;
- subject person;
- aggregate type/id;
- payload;
- payload version;
- correlation id;
- causation event id;
- idempotency key;
- occurred time;
- recorded time.

The initial catalogue includes:
- `activity.recorded`
- `employment.changed`
- `authority.granted`
- `authority.revoked`

Later stages extend the catalogue without changing the event contract.

## Sensitive data

Event payloads are intentionally small and contextual. Protected HR, payroll values, secrets, credentials, bank data, national identifiers and arbitrary row snapshots are prohibited from the ordinary event stream.

## Lifecycle

Events are append-only and immutable.

Definitions may be deactivated but event type strings and payload versions are never repurposed.

## Audit

Event creation itself is not treated as another product action in the ordinary audit feed; the originating domain change remains the audit source of truth. Event records preserve actor/source/correlation metadata for traceability.

## Correction and reversal

Events are never edited or deleted by application roles. A correction or reversal is represented by a new domain event linked through `causation_event_id` and/or `correlation_id`.

## Integrations

Stage 1D does not deliver events externally. Stage 1G will consume this event stream through the integration gateway.

## UI

Administration gains a read-only System Events screen, capability-gated by `audit.view`, showing:
- event type;
- actor;
- aggregate;
- subject;
- correlation;
- occurrence time;
- safe payload fields.

## Tests

Required:
- clean replay;
- RLS on definitions/events;
- no anonymous access;
- no direct authenticated event writes;
- internal emitter inaccessible to browser roles;
- append-only event history;
- idempotency enforcement;
- semantic bridge from activity, employment and authority changes;
- `audit.view` read boundary;
- Stage 1D event SQL gate;
- browser event-screen acceptance;
- all earlier Stage 1 gates remain green.

## Acceptance

Stage 1D passes when a reviewed domain action creates a durable event, the event survives reload, duplicate idempotency is blocked, a user without `audit.view` cannot read it, and the event cannot be edited/deleted through browser authority.

No Stage 1E work begins until Stage 1D is green.
