# CEAC OS — Takeover Status

**Checkpoint time:** 2026-09-21 05:51 UTC  
**Active builder:** Codex  
**Repository:** `thestandardinst-star/ceac-os`  
**Working branch:** `codex/manager-home-my-work-foundation`  
**Pull request:** #4 — open, mergeable, not a draft, not merged  
**Feature commit inspected:** `5bc20d606e6b9d5f99ee3eb11219c9a5defa955c`  
**Main commit inspected:** `bfbcebad33c680a953ce01acc63a49a0f1cce3a0`  
**Branch position:** 265 commits ahead, 0 behind `main`  
**PR size:** 111 changed files, 19,399 additions, 1,391 deletions  
**Supabase project:** `efjljhftsesssumtshvp`  
**Live migration range:** 001–066  
**Repository migration range:** 001–066  
**Next migration number:** 067, if a later verified requirement needs one  
**Owner-facing URL:** <https://ceac-os-git.vercel.app>  

Future agents must read this document before changing CEAC OS. Claude may review or contribute later, but Codex is the active builder at this checkpoint.

## Current state

- PR #4 is synchronized with `main`, mergeable, and intentionally open.
- The exact feature head passes all four configured GitHub checks: CI, Migration Replay, Account Security, and Quality Gate.
- A local clean install and production build pass. The local runner used Node 24 and emitted the expected engine warning because the repository contract is Node 22; GitHub CI runs Node 22 and passed.
- Live Supabase is healthy. Its migration registry and the repository both contain 001–066.
- All 77 public tables have RLS enabled.
- No anonymous or `PUBLIC` execution grant exists on a `SECURITY DEFINER` function. Authenticated execution remains deliberately available on 68 such functions and is a review risk, not an anonymous exposure.
- The stable URL is reachable and CEAC authentication works there. It currently serves the `main` deployment, not PR #4.
- The latest PR #4 Vercel deployment is reported Ready by GitHub/Vercel, but its preview URL is protected by Vercel authentication. The candidate UI could not be exercised interactively in this pass.
- No production deployment, alias, domain, database migration, RLS policy, RPC, branch, or platform setting was changed in this takeover pass.

## What works — verified

Only evidence obtained in this pass or a current-head automated check is listed here.

- Dependency installation and production compilation.
- Repository diff hygiene.
- Clean migration replay through 066 in the current-head GitHub workflow.
- Invited-account lifecycle in the current-head Account Security workflow.
- Staff, Manager, Administration, and Group Pastor route smoke tests in the current-head Quality Gate workflow.
- SQL role/RLS smoke tests in the current-head Quality Gate workflow.
- Live CEAC password authentication for the Frank test identity on the stable `main` URL.
- Live RLS checks showing:
  - Nana cannot read Joseph's cross-unit profile or membership;
  - Frank cannot read Joseph's cross-unit profile or membership;
  - Joseph cannot read Media profiles or memberships;
  - Nana, Frank, and Joseph cannot read another person's private work;
  - Nana can read her same-unit manager profile.
- The private-work isolation check was non-vacuous: at least one private work row exists live.
- Live schema has explicit blocker acknowledgement/resolution fields, stale-session correction fields, private personal-detail separation, and `work_items.visibility`.
- Scheduled jobs are active: `ceac-daily` and `ceac-heartbeat`.
- The owner-facing stable URL loads without Vercel protection.

## What is incomplete

- Interactive acceptance of PR #4 itself is not complete because the preview is protected by Vercel authentication.
- The full Staff acceptance matrix has not been exercised against the PR candidate as a real signed-in Staff user.
- The full Manager acceptance matrix has not been exercised against the PR candidate as a real signed-in Manager.
- The manager → staff → submission → return/approve → record → report loop has not been exercised end to end in the PR preview during this pass.
- The blocker, stale-session, review-follow-up, unit-resource, announcement, and personal-detail UI flows have not been interactively re-run in the PR preview during this pass.
- Administration and Group Pastor screens have automated route coverage but no interactive candidate regression pass in this checkpoint.
- Phone, tablet, laptop, keyboard, focus, dialog, and overflow acceptance remain unverified on the protected candidate deployment.
- The exact Vercel production deployment commit/ID, project production-branch setting, alias configuration, and account-wide build-rate-limit state were not available through the connected Vercel account. The public stable URL and PR deployment status were verified independently.
- No live personal-detail rows exist, so colleague privacy for populated emergency/address data was verified by policy inspection and current-head automated tests, not a non-vacuous live-row read test.

## Intentional deferrals

- Do not begin the broad Administration & HR build phase until the acceptance blockers below are cleared.
- Unified Messages/project discussion remains deferred until its authoritative thread/message contract is implemented.
- Protected HR data and documents remain outside ordinary profiles and unit resources. This includes Ghana Card, SSNIT/tax, bank/payment details, salary, contracts, payslips, and protected documents.
- Finance reversal semantics remain deferred until CEAC approves the accounting convention.
- A public-holiday calendar is not guessed. Current working-day rules mean Monday–Friday.
- Backend Templates and any further report-semantic expansion remain separate approved work, not takeover fixes.
- No new feature or migration was added merely to populate sparse test data.

## Test results

| Area | Result | Evidence / limitation |
|---|---|---|
| Git state | PASS | PR head matches remote; 0 behind `main`; worktree was clean before this document. |
| PR state | PASS | Open, mergeable, non-draft, unmerged. |
| `npm ci` | PASS | Completed locally; Node 24 emitted an engine warning against the Node 22 contract. |
| `npm run build` | PASS | Vite production build completed; existing >500 kB chunk warning remains. |
| `git diff --check origin/main...HEAD` | PASS | No whitespace errors before this document. |
| Lint | NOT TESTED | No lint script is configured in `package.json`. |
| Application unit tests | NOT TESTED | No application unit-test command is configured. |
| CI | PASS | Current-head CI workflow passed. |
| Migration replay | PASS | Current-head GitHub workflow passed through 066. Not rerun locally because Supabase CLI/Docker are unavailable in this runner. |
| Account security | PASS | Current-head GitHub workflow passed. |
| Role/routing quality gate | PASS | Current-head SQL RLS + Playwright workflow passed. |
| Live migration parity | PASS | Live and repository ranges both 001–066. |
| Live RLS enabled | PASS | 77 of 77 public tables. |
| Anonymous/PUBLIC helper execution | PASS | 0 anonymous and 0 `PUBLIC` executable `SECURITY DEFINER` functions. |
| Authenticated helper review | BLOCKED | 68 authenticated-executable `SECURITY DEFINER` functions still require the documented least-privilege review. |
| Leaked-password protection | FAIL | Supabase advisor reports it disabled; this is an owner-level Auth setting. |
| GitHub branch protection | FAIL | No repository ruleset exists; the connector cannot read/write classic protection settings. |
| Stable owner URL | PASS | Public URL loaded and accepted the Frank CEAC test login. It serves `main`. |
| PR preview deployment | PASS | Vercel/GitHub reports the exact head deployment Ready. |
| PR preview access | BLOCKED | Vercel protection requires an authorised Vercel session. No settings were changed. |
| Staff acceptance on candidate | NOT TESTED | Candidate preview could not be opened past Vercel protection. |
| Manager acceptance on candidate | NOT TESTED | Candidate preview could not be opened past Vercel protection. |
| End-to-end work loop | NOT TESTED | Requires authenticated candidate access and controlled test records. |
| Blocker workflow | NOT TESTED | Live state currently has one resolved blocker and no active blocker; no production-like record was manufactured. |
| Stale-session recovery | NOT TESTED | No open live session exists; no production-like session was manufactured. |
| Staff privacy, live RLS | PASS | Cross-unit and private-work reads returned zero under Nana, Frank, and Joseph roles. |
| Personal-details privacy | BLOCKED | Policy and automated test pass; no populated live row exists for a non-vacuous live check. |
| Admin regression on candidate | NOT TESTED | Automated route smoke passed; interactive candidate access blocked. |
| Group Pastor regression on candidate | NOT TESTED | Automated route smoke passed; interactive candidate access blocked. |
| Mobile/accessibility candidate pass | NOT TESTED | Candidate preview access blocked. |

## Known risks

### Oversized PR

PR #4 contains 265 commits and 111 changed files. Merge conflict, review-fatigue, and rollback-diagnosis risk are materially higher than for a focused PR. Do not add unrelated features to it.

### Shared files

`src/App.jsx` and `src/components/bits.jsx` carry role routing, navigation, overlays, unit switching, and shared accessibility behaviour. Any future change needs cross-role regression testing.

### Administration and Executive regression

Automated routing passes, but the candidate has not received an authenticated interactive regression pass in this checkpoint.

### Deployment provider

The PR deployment is Ready, and the earlier free-plan daily build limit did not block this latest head. The preview remains protected, and the connected Vercel integration did not expose project/alias settings. Do not promote or re-alias until candidate acceptance passes.

### Privacy and security

- Live cross-unit/private-work checks passed.
- Supabase leaked-password protection is disabled.
- The authenticated `SECURITY DEFINER` surface still needs the documented least-privilege review.
- Main has no GitHub ruleset, so current green checks are not enforced as merge requirements by a ruleset.
- Performance advisor findings include existing multi-policy/index issues. No speculative policy rewrite belongs in this safety pass.

## Rollback

- **Repository base:** `bfbcebad33c680a953ce01acc63a49a0f1cce3a0` is the `main` commit against which PR #4 was verified.
- **Feature checkpoint:** `5bc20d606e6b9d5f99ee3eb11219c9a5defa955c` is the last fully checked PR head before this document-only checkpoint.
- **Stable deployment:** <https://ceac-os-git.vercel.app> was reachable and accepted CEAC authentication at the checkpoint time. The connected tooling did not expose its immutable Vercel deployment ID or commit, so do not claim an exact deployment rollback target from this document.
- To return code, use a normal reviewed revert/rollback PR or select the recorded commit in the deployment provider. Do not rewrite shared history and do not delete migrations.
- No production change was made in this pass, so no production rollback action is currently required.

## Merge and continuation gate

**PR #4 classification: NOT READY TO MERGE.**

Remaining blockers:

1. Obtain authorised access to the protected PR preview without changing Vercel security settings.
2. Run the documented authenticated Staff and Manager acceptance matrices on the exact candidate deployment.
3. Run the three realistic end-to-end work loops, including return/approval and blocker handling.
4. Complete interactive Admin and Group Pastor regression checks.
5. Complete phone and laptop visual/accessibility acceptance.
6. Enable Supabase leaked-password protection or record an explicit owner decision not to do so before production use.
7. Add/enforce appropriate `main` branch protection and required checks, subject to owner approval.

After those pass, the safe next phase is a checkpoint report asking the owner whether to merge PR #4. Broad Administration & HR work begins only after that merge decision and a fresh branch from current `main`.

