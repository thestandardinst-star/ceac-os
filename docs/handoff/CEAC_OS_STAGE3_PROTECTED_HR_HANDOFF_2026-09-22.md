# CEAC OS — Stage 3 Protected HR Handoff

**Date:** 22 September 2026
**Status:** ACTIVE / STACKED
**Repository:** `thestandardinst-star/ceac-os`
**Base:** Stage 2 green head `48bbbf0f2e9ae4bc5d89ffc01766659f5775649e`
**Branch:** `chatgpt/enterprise-expansion-stage-3-protected-hr-2026-09-22`
**Migration:** 083 — protected HR Stage 3

## Implemented

- protected identifiers;
- protected employment terms;
- protected compensation history;
- protected payment details;
- protected document metadata;
- private HR Storage read/upload/cleanup policy scoped by organisation + `hr_private.access`;
- capability-checked protected summary RPC;
- capability-checked append/replacement record RPC;
- sensitive read/write audit events;
- protected HR Administration workspace;
- protected document upload and signed download;
- Stage 3 SQL security gate;
- Platform Kernel reviewed SECURITY DEFINER surface updated from 73 to 75;
- browser acceptance and phone-width coverage.

## Boundaries preserved

- browser roles retain no `USAGE` on `hr_private`;
- no protected HR table is directly browser-readable;
- no protected data is added to `public.profiles`;
- compensation uses `amount_minor + currency` and does not calculate payroll;
- corrections create replacement versions instead of deleting history;
- Group Pastor status does not automatically grant protected-HR access;
- every protected read/write through the product is attributable.

## Deferred by architecture

Stage 3 does not implement payroll calculation, payslips, statutory calculation, automatic salary changes or automatic HR decisions. Those remain governed by later stages and confirmed CEAC policy.

## Next gate

Do not begin Stage 4 until:
- migration replay passes;
- Platform Kernel passes at the reviewed 75-function surface;
- Stage 3 protected HR gate passes;
- Account Security passes;
- browser role/acceptance passes;
- responsive acceptance passes.
