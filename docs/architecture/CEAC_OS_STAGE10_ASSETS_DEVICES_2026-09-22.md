# CEAC OS — Stage 10 Assets & Devices Architecture

**Date:** 22 September 2026
**Stage:** 10 — Assets & Devices
**Baseline main:** `b8d32f0a6a28716b1eb178feab160ca45bad1e17`
**Branch:** `chatgpt/enterprise-expansion-stage-10-assets-devices-2026-09-22`

## Purpose

Stage 10 adds a native, auditable CEAC asset/device register and custody lifecycle.

It covers:
- CEAC asset ID / asset tag;
- category and device/equipment details;
- manufacturer, model and serial number where applicable;
- purchase date, vendor, original purchase amount/currency and warranty expiry;
- current unit and physical/location context;
- assignment/custody history;
- return history;
- repair start/completion;
- warranty-claim record;
- retirement.

Stage 10 does **not** implement operating-system or endpoint-management controls. There is no remote wipe, encryption enforcement, endpoint configuration, background device agent or MDM policy engine. A specialist integration belongs to a later integration decision if CEAC requires it.

## Authority

New explicit capability:

`asset.manage`

Authority rules:
- Administration with organisation-scoped `asset.manage` may create/edit inventory metadata and perform custody/lifecycle actions across the organisation.
- Unit managers may read assets whose current unit is one of their managed units and the corresponding assignment/lifecycle history. Manager role alone does not grant write authority.
- Staff may read only assets currently assigned to themselves plus their own custody history.
- Executive status does not imply asset-management write authority.
- Anonymous users have no asset access.
- Browser roles never directly write Stage 10 tables; reviewed RPCs own all mutations.

## Data model

### `asset_items`

Authoritative current asset record:
- organisation;
- asset code/tag;
- category;
- manufacturer/model/serial;
- purchase/warranty facts;
- current status;
- current assignee;
- current unit;
- current location;
- current condition note;
- created/updated attribution and timestamps.

Allowed current states:
- `available`
- `assigned`
- `repair`
- `retired`

Purchase cost remains in its recorded currency. CEAC OS does not invent exchange rates or present converted acquisition cost unless a later approved finance contract provides that conversion.

### `asset_assignment_events`

Append-only custody history:
- assigned;
- transferred;
- returned.

Every row records:
- prior person/unit/location;
- resulting person/unit/location;
- expected return date where recorded;
- condition/context note;
- reason;
- actor;
- occurrence time.

The current asset row may change for operational lookup, but assignment history is never rewritten.

### `asset_lifecycle_events`

Append-only lifecycle/service history:
- repair started;
- repair completed;
- warranty claim recorded;
- retired.

Rows preserve from/to state, note, reason, actor and occurrence time.

## Mutation contract

Reviewed authenticated RPCs:
1. `asset_record_item` — create an asset or revise factual inventory metadata.
2. `asset_assign` — assign or transfer custody, recording an append-only custody event.
3. `asset_return` — return an assigned asset, recording condition/location and history.
4. `asset_lifecycle_action` — repair start/completion, warranty claim or retirement.

All four:
- bind the actor to `auth.uid()`;
- require `asset.manage`;
- validate organisation/person/unit ownership;
- have fixed `search_path`;
- expose no anonymous EXECUTE;
- generate audit/event evidence.

## Product surfaces

### Administration

`Assets` workspace:
- Inventory;
- Assigned;
- Service & lifecycle;
- History.

Actions:
- add/edit asset details;
- assign/transfer;
- return;
- start/complete repair;
- record warranty claim;
- retire.

### Manager

`Assets` workspace:
- visible unit assets;
- factual custody and lifecycle history;
- no management controls without explicit `asset.manage`.

### Staff

`My assets` / Assets:
- assets currently assigned to the signed-in staff member;
- own custody history;
- purchase/warranty facts that are appropriate for operational use;
- no management actions.

## Product language and guardrails

Do not:
- score or rank staff by asset history;
- treat damaged/returned equipment as a performance judgement;
- invent purchase price, currency, warranty or serial values;
- expose another staff member's custody outside authorised Manager/Admin scope;
- provide remote wipe/lock/configuration controls;
- silently delete lifecycle history.

Use explicit states such as:
- Not recorded
- Available
- Assigned
- In repair
- Retired
- Warranty not recorded

## Events and audit

Semantic events:
- `asset.created`
- `asset.updated`
- `asset.assigned`
- `asset.transferred`
- `asset.returned`
- `asset.repair_started`
- `asset.repair_completed`
- `asset.warranty_claimed`
- `asset.retired`

Tables use the Platform Kernel audit capture.

## Stage 10 exit gate

Stage 10 closes only when:
- migration 090 replays cleanly from zero;
- all public Stage 10 tables have RLS;
- anonymous access is absent;
- direct authenticated writes are absent;
- staff can read only their assigned assets/history;
- managers can read unit assets/history but cannot mutate without `asset.manage`;
- Administration can create → assign → return → repair → retire with history preserved;
- purchase/warranty facts persist after reload;
- no MDM/remote-wipe product control exists;
- cumulative security/capability/Platform Kernel gates are green;
- browser role acceptance is green on desktop/mobile;
- Stage 10 product-inspection artifacts are generated;
- Stage 10 is merged before Stage 11 begins.
