# CEAC Payroll Rules v1

## Salary basis
Individual monthly salary per employee. No salary grades/bands.

## Supported additions/deductions
Transport allowance; bonuses; loans/advances; penalties/deductions; reimbursements; other recurring allowances; December annual bonus.

## Authority
Administration prepares payroll. Group Pastor approves payroll. Automatic payroll approval is prohibited.

## Protected employee data
Ghana Card; SSNIT; TIN/tax identifier; bank name; account name; account number; emergency contact; residential address; date of birth; marital status.

## Protected employee documents
Contract; appointment letter; CV; ID copy; SSNIT documentation; qualifications/certificates; payslips.

Staff cannot open/download these HR documents. Administration has management access. Group Pastor may see all protected employee information.

## Employment types
Permanent; fixed-term contract; volunteer. Hybrid is a working pattern, not an employment type.

## Required protected foundations
`hr_private.*`; `capability_grants`; `platform_audit_events`; `payroll.prepare`; `payroll.approve`.

## Lifecycle
Period → Draft → Employee changes → Calculation → Flags → Human review → Group Pastor approval → Immutable approved run → Payslip/payment/export → Attributable adjustment/reversal.

Never derive payroll deductions automatically from attendance/work-session data without future explicit authority. Unconfirmed formulae remain configurable/manual authoritative inputs.
