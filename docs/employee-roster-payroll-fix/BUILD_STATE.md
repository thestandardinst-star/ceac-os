# Employee Roster & Payroll Completeness — Build State

Programme: ERC
Status: ACTIVE

Branch: `chatgpt/employee-roster-payroll-completeness-2026-10-03`
Baseline protected main: `a46232edff481868d764a3ece9c241e36b5282fb`

## Verified starting state

- supplied staff rows: 18
- live profiles: 6
- exact source/profile matches from prior reconciliation: 2
- ambiguous identity rows: 1
- no exact profile match rows: 15
- source rows with email: 0
- payroll periods/runs/entries/lines: 0
- compensation records: 0
- payment-detail records: 0

Root cause: authenticated profiles are being used as the effective employee master in Administration People and Payroll population logic. Employees without linked accounts therefore disappear from operational surfaces.

## Current stage

ERC1 — Employee master roster independent of auth: ACTIVE

Next: add employee roster and organisational membership schema, backfill linked employees, add Administration roster RPCs, add contract tests, and verify the gates before importing the workbook rows.
