# Manager acceptance QA — 20 September 2026

Scope: PR #4, reconciled against `main` at `8cc5d28924da32ccc7acd2ae3cbf02a1cc9b9d55` and live database migrations 031–033. This pass made no schema, policy, function or migration changes. The protected Vercel preview could not be exercised interactively because the available testing session could not clear Vercel authentication, so phone/laptop interaction remains a pending manual acceptance step rather than a claimed pass.

## Manager Panel Spec §15

| Requirement | Built | Result | Evidence |
|---|---:|---|---|
| Dual role | Yes | Pass after client fix | All memberships load and the selected unit controls Manager surfaces. My work now keeps both `completed` and `self_certified` work visible even while the person is using a staff membership. |
| Self-certification | Yes | Pass | Live rolled-back acceptance confirmed submission creation, `self_certified`, completion, and no review-queue entry. `Item.jsx` calls only `self_certify_work`. |
| Staff-created task | Yes | Pass | Live rolled-back acceptance confirmed insert, checklist and Manager visibility. References come from `next_work_ref()` and the item is `origin=self_created`. |
| Return loop | Yes | Pass | Live rolled-back acceptance confirmed selected ticks are undone, other ticks remain, comments/history remain visible, and `first_time_approved=false`. |
| Presence vs output | Yes | Pass | Home, Team and Person Detail label presence/activity separately from completed/submitted work and contain no scoring or employee comparison. |
| Project close | Yes | Pass | Live rolled-back acceptance confirmed submit, close, reopen and next-version behavior. Current-cycle and lead-unit client gates remain in place. |
| No invented progress | Yes | Pass | Objectives use explicit status, target/result pairs where present, and factual `x of y tasks completed`; no descriptive-objective percentage is calculated. |
| Clickable numbers | Yes | Pass | Home, Team, Person Detail, Projects, Finance and Reports counts open their underlying rows or canonical detail screen. |
| RLS from client-visible flows | Yes | Pass | Live acceptance confirmed Manager report isolation and migration 031 people visibility. Current policies scope work, projects, budgets, requests, reports, closes and feedback in the database. |

## Screen-state audit

| Screen | Loading | Empty | Error | Populated/actionable | Mobile/laptop and navigation |
|---|---|---|---|---|---|
| Home | Pass after fix | Pass | Pass | Pass | Five-tab mobile navigation; full laptop navigation; overlays reset on unit switch. |
| My work | Pass after fix | Pass | Pass | Pass | Canonical Item flow; dual-role completed work fixed. |
| Team | Pass after fix | Pass, including unit of one | Pass | Pass | People-first; setup secondary; Person Detail drill-down. |
| Person Detail | Pass | Pass | Pass | Pass | Back returns to Team; project/work links use canonical screens. |
| Projects | Pass after fix | Pass | Pass | Pass | Direct overlay checks current-unit participation before rendering detail. |
| Project Close | Pass | Pass | Pass | Pass | Sheets scroll within the viewport; history is read-only; reopen requires a reason. |
| Calendar | Pass | Pass | Pass | Pass | Month/week; date-only values are not timezone-converted; timestamps use Accra dates. |
| Finance | Pass | Pass | Pass | Pass | Read-only; currencies remain separate; no conversion or `amount_pesewas`. |
| Reports | Pass | Pass | Pass | Pass | Frozen versions, evidence drill-down and print surface; no confirm/person/AI flow. |
| Staff Record | Pass | Pass | Pass after fix | Pass | Manager feedback is visible to its subject; only Task and Deliverable count as completed. |

## Client defects fixed

- My work hid a dual-role manager's `self_certified` completed work while a staff membership was selected.
- Home, My work, Team and Projects could display a factual empty state while their initial query was still pending.
- Staff Record silently treated failed queries as empty arrays.
- Mobile More did not dismiss from its backdrop and lacked menu state semantics.
- Shared sheets lacked dialog semantics and Escape-key dismissal.
- Long row content could force horizontal overflow on narrow screens.

## Backend work deliberately not built

- Approved-work reopen/reversal: no final RPC.
- Messages/project discussion: no thread/message persistence model.
- Report semantic validation beyond evidence-count integrity.
- Finance reversal convention: canonical accounting rule is unresolved; existing client interpretation was not changed.

## Repository automation

The repository had no GitHub Actions workflow. `.github/workflows/ci.yml` now runs on pull requests and pushes to `main`, using Node 20 to run `npm ci`, a range-aware `git diff --check`, and `npm run build`. No test or lint command exists in `package.json`, so none was invented.

`main` is currently unprotected and has no required checks. After this workflow succeeds, the recommended required check is `CI / build`.


## Follow-up connector audit after the protected-preview block

A repository + live-Supabase audit continued after interactive preview testing was blocked. Four client defects were confirmed from the active contracts and fixed without schema changes:

- Project Close draft reuse now includes the active unit for unit-scope drafts (and null unit for overall drafts), so a dual-role manager cannot accidentally reuse a draft from another unit on the same project.
- Overall Project Close cost snapshots now use only the latest submitted unit-close version per participating unit, preventing historical unit-close versions from being summed twice.
- My Record now has a month selector, applies work/session/blocker figures to that selected month, and no longer excludes the staff member's own private work from their personal record.
- Forgotten-session submission now follows Architecture v4 §7: checklist editing remains session-gated, but completed work may still be submitted with no open session and is explicitly recorded as `outside_session`. The existing database paths already support this for both normal submissions and manager self-certification.

These fixes were repository-only. No migration, policy, RPC or production data was changed.

## Acceptance limitation

The following still requires a real authenticated browser pass before production merge:

- 360/390px phone rendering and mobile keyboard behaviour
- tablet/laptop responsive layout
- actual Frank / Nana / Joseph navigation flows
- browser back behaviour and focus movement
- sheet/dialog usability in a real browser
- end-to-end mutation flows through the deployed preview

Code inspection, CI, Vercel build status and rolled-back/live database contract checks are not substitutes for that final interaction pass.


## Final PR #4 client audit continuation — 20 September 2026

This section supersedes stale branch-state references above while preserving the earlier QA record as history.

The final client audit was continued after Codex paused. It was reconciled against current main `bfbcebad33c680a953ce01acc63a49a0f1cce3a0` and the binding 20 September architecture/security amendments. No migration, RLS policy, RPC, Supabase schema, Admin/HR screen or Executive screen was changed.

### Additional client corrections

- **Assign:** all seven approved work kinds remain visible with their plain-language explanations, but only Task exposes a working creation form today. Unsupported kinds cannot be persisted with generic Task behaviour.
- **Staff navigation:** restored the Staff Panel's four destinations: Home, Work, Record, Me. Manager navigation remains separate.
- **Staff Home:** empty attention/secondary sections collapse instead of creating zero-card walls. Incoming unit-level blocker claims are no longer shown to every staff member; those remain a manager/unit response responsibility.
- **Off-site work sessions:** starting work away from the office now requires selecting the active work item, so the captured start location attaches to work rather than to the person. In-review and waiting work cannot be selected as a new off-site working session.
- **My Work:** active lead-unit projects are available even when the project-unit join row is absent, matching the project's legitimate lead-unit relationship.
- **Manager Home:** today's submitted-work count is deduplicated by work item so multiple submissions for the same work do not create a misleading count or duplicate drill-down rows.
- **Manager Home desktop:** laptop layout uses the available width while preserving the locked command-centre order. Staff Home remains phone-first rather than being converted into a desktop dashboard.
- **Team:** real sub-team membership still drives grouping, including multi-lane membership and empty lanes. Direct Manager controls that changed official roles/sub-team membership were removed; the approved architecture assigns those employment/membership controls to Administration & HR.
- **Manager Reports:** the approved `Manager's summary` wording is present, narrative and challenges remain separate, submitted versions remain frozen/versioned, and the status visual is explicitly labelled as **current work composition** so it is not mistaken for a period-completion metric.
- **Calendar / Finance contract reconciliation:** the current branch already consumes the live `ministry_events` / `ministry_event_units` calendar source and the live finance-request / budget-position contracts. Older PR notes saying those sources did not exist are stale and should not guide future work.

### Security-sensitive client audit

The changed client surfaces were checked for the post-hardening prohibitions.

No changed client file:
- inserts, updates or deletes `activity_events`;
- updates/deletes `operation_occurrences`;
- writes protected profile or official membership fields from the Manager surface;
- introduces `amount_pesewas` or cross-currency conversion;
- introduces OpenAI, Claude or another inference dependency;
- introduces employee scoring, ranking, badges, streaks or leaderboards.

`ManagerProjectClose.jsx` reads authoritative `activity_events` only to establish the latest project-reopen time; it does not write that history.

### Remaining backend-owned work

These are not safe client-only fixes and remain explicit handoffs rather than being simulated in the UI:

- approved-work reopen/reversal;
- project/task/direct Messages persistence;
- stronger semantic validation of report evidence beyond the existing evidence-count integrity contract;
- the canonical Finance reversal/correction convention where still required by Finance;
- the remaining typed-work contracts for Routine, Case, Request, Decision, Meeting outcome and Deliverable;
- templates and deterministic reuse contracts;
- the protected employee/HR data and storage model;
- reconciliation of missing historical migration SQL and the remaining SECURITY DEFINER least-privilege review.

The Manager approval path is also still a client sequence (review insert followed by work-item completion update), unlike the atomic return RPC. Treat atomic approval as backend data-integrity hardening rather than attempting a client workaround.

### Final acceptance boundary

Repository/contract audit, CI and Vercel build success establish that the branch builds and respects the inspected contracts. They do **not** replace the final authenticated browser pass.

Still required before merge:
- real 360px / 390px phone interaction;
- real laptop interaction;
- authenticated Frank / Nana / Joseph navigation and mutation flows;
- browser back/focus behaviour and dialog usability;
- end-to-end deployed-preview mutation checks.

Do not claim these interactive checks passed until they are actually exercised.


## Client build sequence completed without Claude — 20 September 2026

The three agreed client-only builds after the PR #4 audit are now complete.

### 1. Assignment warnings + context-aware Task prefill

- Give out work preserves project, objective, phase and sub-team context when opened from those surfaces.
- Manager Team can open Give out work preselected to a specific work lane.
- Task assignment now surfaces deterministic factual warnings from existing authorised records:
  - assignee marked inactive;
  - due date falling during that assignee's approved leave;
  - selected project recorded as closed;
  - task due before project start;
  - task due after project end;
  - selected objective already carrying a recorded terminal outcome.
- Warnings do not invent a score or make the human decision.
- All seven work kinds remain visible and explained, but unsupported kinds still cannot be saved with Task semantics.

### 2. Manager project attention + recent movement

- Active project attention now also identifies active objectives that have no active work attached.
- Existing at-risk/not-met objective, near-end and open-deliverable signals remain factual and clickable.
- Project attention counts/chips open the project or the exact underlying work list.
- Manager Home now includes a role-scoped Recent movement section built only from authorised work submissions and completed Task/Deliverable rows from the last seven days.
- Recent movement opens the canonical work item and does not use a fabricated activity feed.

### 3. Manager Finance request creation

Before client work, the live Supabase contract was inspected directly.

Verified `finance_requests` insert contract:
- required: `org_id`, `unit_id`, `requested_by`, `title`, positive `amount_minor`, valid `currency`;
- optional: `project_id`, `justification`, `needed_by`;
- state defaults to `submitted`;
- RLS permits insert only where `requested_by = auth.uid()` and `unit_id` is in `app_managed_units()`;
- allowed currencies are GHS, USD, GBP, EUR, NGN, ZAR and CAD.

The live security state also confirms ordinary authenticated clients cannot execute `finance_request_path` directly. The Manager UI therefore does not simulate or expose an approval path. It submits the authorised request row and leaves approval routing to the secured Finance workflow.

Manager Finance now:
- allows a unit manager to submit a finance request;
- keeps budget/spend/transfer records read-only;
- supports optional project and needed-by context;
- stores amounts in minor units for the selected currency;
- performs no currency conversion;
- refreshes the recorded request list after submission.

### Validation

Final head for this sequence: `d8aa658d33d18485c9354f17e4643cc61587f5b5`

GitHub CI run #28: **success**
Vercel deployment status: **success**

Functional expansion should stop here until the authenticated interaction pass is completed and Claude returns for backend-owned contracts.


---

## Typed-work continuation acceptance — 20 September 2026

This section supersedes earlier statements in this file that typed work or approved-work reopen were still backend-blocked.

Backend migrations now applied and committed:

- 040 authority hardening
- 041 atomic approval + approved-work reopen
- 042 typed-work schema
- 043 typed-work contracts
- 044 Routine schedule-version fix
- 045 typed-work reconciliation hardening
- 046 review-contract hardening

Rollback database acceptance passed for:

- legacy Routine reconciliation;
- Routine occurrence/schedule/pause lifecycle;
- Case resolution;
- Request clarification/fulfilment lifecycle;
- Decision recording;
- Meeting outcome review;
- Deliverable evidence enforcement;
- cross-unit typed-work denial where required;
- named cross-unit Request contract;
- populated lane delete protection;
- direct non-Task insertion/relabel prevention;
- non-review submission prevention;
- direct review/terminal-state bypass prevention;
- Task checklist approval enforcement;
- Deliverable self-cert evidence enforcement.

Client integration was then completed sequentially:

Routine → Case → Request → Decision → Meeting outcome → Deliverable.

Each intermediate client stage passed CI before the next type was enabled. Final real-account interaction remains the human acceptance gate; CI/build validation does not substitute for clicking the flows as Frank/Gabriel on phone/laptop.
