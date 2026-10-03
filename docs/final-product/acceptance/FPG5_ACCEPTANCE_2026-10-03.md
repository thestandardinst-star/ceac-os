# FPG5 Acceptance — Payroll Domain / Security

Accepted SHA: `3ad256094f7c01e585fc5c40c657ac2fed084817`

FUNCTIONAL CONTRACT PRESERVED: YES
SECURITY/AUTHORITY PRESERVED: YES
REFERENCE COMPONENT PARITY: N/A — domain/security stage
RESPONSIVE ACCEPTANCE: YES — cumulative browser regression suite passed

## Evidence
- CI: PASS
- Migration Replay: PASS
- Account Security: PASS
- Level B SQL + authority: PASS
- Dedicated Payroll Stage 13 gate: PASS through cumulative runner
- Browser shards 1–4: PASS
- Evidence merge: PASS
- role-and-RLS closure: PASS
- Vercel: PASS

## Accepted boundaries
Administration prepares. Group Pastor/CEO approves. The same person cannot hold both active Payroll authorities. Payroll data remains protected behind `hr_private` and reviewed RPCs. Approved runs and children are immutable; corrections are attributable successor runs. No attendance-derived deductions or unconfirmed statutory formulas are introduced.

## Deferred owner-policy inputs
Statutory formula automation, part-month prorating, payday/cycle policy, payslip distribution, allowance values, annual-bonus value/formula, loan repayment formula and reimbursement timing remain deliberately unimplemented until confirmed.
