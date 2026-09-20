# Manager acceptance QA — 20 September 2026

Scope: PR #4 at `0bf709090a5ae6007d594c67ee80dca44d81e1c3`, reconciled against `main` at `8cc5d28924da32ccc7acd2ae3cbf02a1cc9b9d55` and live database migrations 031–033. This pass made no schema, policy, function or migration changes.

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
