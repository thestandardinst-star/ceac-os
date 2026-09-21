# CEAC OS — Current System Handoff & Admin/HR Build Baseline

**Checkpoint:** 2026-09-21
**Repository:** `thestandardinst-star/ceac-os`
**Reviewed main baseline:** `be21d49853edda1814e48bd77f3b54b462cd7cc4`
**Continuation branch:** `chatgpt/admin-hr-completion-2026-09-21`
**Live Supabase project:** `efjljhftsesssumtshvp`
**Live migration range:** through `meeting_participant_authority` (072)
**Owner-facing URL:** https://ceac-os-git.vercel.app

## 1. What is now established

CEAC OS has a materially working Staff + Manager operating core built around:

**Work → Collaboration → Record → Intelligence**

### Staff
Substantially built and refined:
- Home
- Work
- Work detail
- Team
- Record
- Me
- contextual Rooms
- Meetings

### Manager
Substantially built and refined:
- Home
- own work / team work
- assignment
- evidence-first review
- Team
- Person detail
- Projects workspace
- Calendar
- Finance
- Reports
- Rooms
- Meetings

### Collaboration
- contextual Unit / Project / Sub-team Rooms
- replies, references and mentions
- paged Room history
- unread/new-message behaviour
- stable Room navigation
- Meeting audiences/participants
- participant-aware Meeting authority

### Product refinements merged
- stable URL/deep-link navigation for Work / Project / Room / Meeting
- Back/Forward/reload support for nested surfaces
- Staff blocker creation without active work session
- Manager Home prioritisation
- evidence-first Manager review
- intent-led assignment
- Person Detail de-emphasised score-like metrics
- Project Detail converted into a workspace
- Staff Home compressed around action, updates and coming-up context
- evidence-first Staff Record
- conditional report analysis
- shared product language
- human-readable product error handling
- reusable Field / Notice / Empty / Loading / Section primitives
- expanded Manager responsive testing

## 2. Security baseline

The Administration/HR security gate is already established.

Current protected-data principles:
- ordinary profile data stays separate from protected HR data;
- protected HR data belongs in the private HR boundary, not `public.profiles`;
- protected documents remain in private Storage;
- sensitive reads/writes require explicit authority;
- protected actions should be attributable in the audit ledger;
- payroll must preserve approved originals and use explicit correction/reversal records;
- pay is never inferred from platform hours;
- Group Pastor seniority does not automatically grant every protected HR write capability.

Migration 072 adds participant-aware Meeting authority and is live.

Reviewed authenticated SECURITY DEFINER surface: **73**.
Anonymous SECURITY DEFINER execution: **0**.

## 3. Current release state

PR #16 — Staff/Manager product refinement program — is merged.

Reviewed merge commit:

`be21d49853edda1814e48bd77f3b54b462cd7cc4`

The branch passed:
- build
- migration replay
- invited-account security
- role/RLS gate
- browser acceptance
- expanded responsive tests

The exact merged Vercel deployment is currently waiting on the external deployment-rate limit. Do not treat an older stable deployment as proof of this exact release until the deployment succeeds.

## 4. What remains in the whole architecture

### Next major tranche — Administration & HR

Build in this order:

1. **Admin Home**
   - Needs you
   - units missing reports
   - office today
   - delivery exceptions
   - silence / falling
   - contracts / leave / pay actions
   - organisation-wide evidence drilldowns

2. **Units**
   - head
   - people
   - projects
   - objectives
   - work
   - routine jobs
   - reporting
   - attendance context
   - cost
   - silence / falling
   - closing records

3. **People / employee record**
   - identity
   - employment facts
   - units / manager
   - work and project contribution
   - leave
   - factual feedback
   - goals/development
   - attendance/activity context
   - protected HR entry points
   - no ranking / overall score

4. **Protected HR**
   - national ID / Ghana Card
   - SSNIT / tax identifiers
   - bank/payment details
   - salary
   - contracts
   - protected documents
   - payslips
   - explicit audit trail

5. **Attendance & leave administration**
   - corrections
   - whole-office calendar
   - leave balances
   - policy configuration
   - day-pattern exceptions

6. **Payroll**
   - configurable rates
   - draft → review → approve
   - protected salary/pay data
   - immutable approved run
   - corrections / reversals
   - payslips
   - practice environment before live use

7. **Reporting / Performance evidence**
   - organisation-wide reporting from real records
   - evidence packs
   - review periods
   - no black-box employee scoring

8. **Settings**
   - people/access
   - units/sub-teams
   - permissions
   - workday rules
   - leave rules
   - thresholds
   - tax/rate sets
   - report settings
   - organisation configuration

### Then
- Group Pastor / Executive completion
- church/group returns
- whole-system E2E
- onboarding / “Show me how”
- production ownership/handover
- final backup/restore and security hardening
- later Telegram / bounded AI / camp screens

## 5. Locked product principles

Do not break:
- no made-up data
- every number drills to records
- presence ≠ availability ≠ output
- no duplicate reporting
- no staff comparison / ranking
- no overall employee score
- evidence before judgement
- private work remains private
- protected HR remains protected
- undo/reversal instead of destructive rewriting
- quiet by default
- CEAC must be able to run the system without TSI
- first-time flows should guide rather than expose blank complexity

## 6. Admin/HR decisions still requiring owner/CEAC input

The architecture deliberately leaves these unresolved:

1. Salary structure:
   - individual salary per person?
   - salary grades/bands?
   - both?

2. Non-statutory payroll items:
   - allowances
   - recurring deductions
   - one-off deductions
   - benefits / reimbursements

3. Payroll approval:
   - who prepares?
   - who reviews?
   - who gives final approval?
   - can Administration approve her own run?

4. Leave policy:
   - entitlement by contract type
   - whether leave builds monthly or is granted yearly
   - carry-over rules
   - unpaid leave treatment
   - escalation chain

5. Protected identifiers CEAC actually keeps:
   - Ghana Card
   - SSNIT number
   - TIN / tax identifier
   - bank details
   - emergency records
   - any other statutory/private fields

6. Finance source:
   - are budgets/spend already held digitally by Finance?
   - or should CEAC OS become the office entry source for budgets/spend?

7. Employment structure:
   - contract types used today
   - probation if any
   - permanent / fixed-term / casual / other
   - whether job grades exist

8. Staff documents:
   - which documents are required per employee
   - which documents Staff may download themselves
   - which remain Admin-only

9. Group Pastor protected-HR scope:
   - pay register view-only is already the architecture target
   - confirm whether contracts/IDs/bank details should remain Administration-only

10. Part-month payroll:
   - calendar-day basis?
   - working-day basis?
   - another CEAC rule?

## 7. Safe execution rule for the next tranche

Proceed without waiting where the architecture is already explicit.

Stop only when a feature would require inventing one of the unresolved CEAC policy decisions above.

For every protected HR/pay feature:
1. authority matrix
2. schema/RLS/RPC
3. permanent security test
4. UI
5. browser acceptance
6. product review

No protected field should be added directly to ordinary profile tables.

## 8. Immediate next build target

Start with the non-controversial Admin/HR operating layer:
- Admin Home
- Units
- People
- Attendance/leave factual views
- protected-HR shell/entry boundaries
- Settings structure

Delay actual salary/payroll calculations until the unresolved payroll decisions are confirmed.
