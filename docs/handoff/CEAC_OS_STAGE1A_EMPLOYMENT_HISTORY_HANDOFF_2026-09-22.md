# CEAC OS — Stage 1A Employment History Handoff

**Date:** 22 September 2026
**Stage:** 1A — Employment history
**Branch:** `chatgpt/enterprise-expansion-stage-1a-employment-history-2026-09-22`
**PR:** #20
**Base:** Stage 0 reviewed head `8d2fb7cd472b1209836472318ba92086ec268313`

## What Stage 1A adds

Stage 1A creates an ordinary-employment platform record separate from protected HR.

Implemented:
- `employment_records` — one current ordinary-employment state per person;
- `employment_history` — append-only historical snapshots;
- preservation of employment type, title, primary unit, manager, role, working pattern, joining date, status and exit date;
- correction by new history event rather than editing an earlier event;
- synchronisation from legacy official-profile and unit-membership paths so existing product flows do not silently erase employment history;
- Administration-only authority-checked employment change RPC;
- Administration employment detail/history RPC;
- RLS and direct-write restrictions;
- dedicated Stage 1A SQL security gate;
- Platform Kernel review updated for the two new browser-facing Administration RPCs;
- Administration People UI for current employment, history and recording changes;
- browser acceptance coverage for creating and re-opening a persisted employment-history change.

## Boundaries retained

Stage 1A does not introduce:
- salary or compensation;
- bank/payment details;
- Ghana Card or other national identifiers;
- tax/SSNIT identifiers;
- protected employee documents;
- payroll;
- disciplinary records.

Those remain outside the ordinary People record and are governed by later protected-HR/payroll stages.

## Correction model

Existing history is never edited by ordinary application authority. A correction records a new full employment snapshot and references the earlier event being corrected.

## Security model

Employees may read their own ordinary employment record/history.

Administration & HR may read and record organisation employment changes.

Managers may read ordinary employment history where the recorded primary unit is one they manage.

Anonymous users have no access. Authenticated users have no direct INSERT/UPDATE/DELETE privilege on either employment table.

## Current delivery state

The migration, SQL gate, People UI and browser acceptance journey are implemented on PR #20.

PR #20 is intentionally stacked on the reviewed Stage 0 branch because GitHub currently blocks the Stage 0 merge with a repository protection requirement for a successful active Production deployment. The expansion work continues on stacked reviewed branches rather than bypassing that protection.

Stage 1B may begin only after the final Stage 1A branch head has a green clean migration replay, Account Security and full Quality Gate.
