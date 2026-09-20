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
