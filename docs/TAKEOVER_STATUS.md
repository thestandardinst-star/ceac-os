# CEAC OS — Takeover Status

**Checkpoint time:** 2026-09-21

**Active builder:** ChatGPT / Codex-compatible workflow

**Repository:** `thestandardinst-star/ceac-os`

**Working branch:** `codex/manager-home-my-work-foundation`

**Pull request:** #4 — open, mergeable, not a draft, not merged

**Feature/test head fully accepted:** `fe156f10e11ff91fc5f20861ed0593a376b6627b`

**Base main inspected:** `bfbcebad33c680a953ce01acc63a49a0f1cce3a0`

**Supabase project:** `efjljhftsesssumtshvp`

**Live migration range:** 001–066

**Repository migration range:** 001–066

**Next migration number:** 067, only if a later verified requirement needs one

**Owner-facing URL:** <https://ceac-os-git.vercel.app>

This document is the handover baseline. Future ChatGPT, Codex, or Claude sessions should read it before changing CEAC OS.

## Final safety-phase result

The takeover / verification / acceptance task is complete.

PR #4 now has automated coverage for the important Staff and Manager operating loop and all configured GitHub safety gates pass on the accepted feature head.

The exact feature head:

- builds successfully;
- replays the full database from 001 through 066 successfully;
- passes invited-account security checks;
- passes role/RLS checks;
- passes the original role-routing browser tests;
- passes the new end-to-end acceptance browser tests;
- receives a successful Vercel deployment status.

No merge, production alias change, destructive database action, branch deletion, or production data mutation was performed during this safety phase.

## Acceptance coverage added

`tests/acceptance-core.spec.js` now verifies the exact PR code against a clean local Supabase database and isolated fixture accounts.

### Staff + Manager work loop — PASS

Verified end to end:

1. Manager gives work to Staff.
2. Staff sees the work and its purpose/finished outcome.
3. Staff starts a work session.
4. Staff completes the checklist.
5. Staff sends the work for review.
6. Manager returns it with a correction.
7. Staff sees the return reason and resubmits.
8. Manager approves it.
9. The completed work appears in the Staff Record.

A real defect found by this test was fixed: after a returned item was resubmitted, Manager Home could show more than one review row for the same work item because historical submissions were all joined to the item's current `in_review` state. Manager Home now keeps only the latest submission for each work item in the active review queue while preserving submission history elsewhere.

### Blocker / Waiting on — PASS

Verified:

- Staff raises a blocker;
- the manager sees it;
- the manager acknowledges it;
- the blocker is resolved;
- the Staff item no longer shows the blocker after resolution.

### Personal details — PASS

Verified:

- editable Staff personal details save;
- the values persist when reopened;
- emergency/address details remain in the dedicated private personal-details store.

The edit form's visible labels are now properly connected to their controls for keyboard/accessibility tooling.

### Private work — PASS

Verified through the browser that private work created by one Staff fixture is not shown to another Staff fixture.

Live database policy inspection also confirms that `profile_personal_details` can be read only by the profile owner or Administration within the organisation:

`profile_id = auth.uid() OR app_is_admin()`.

Earlier live RLS checks also confirmed cross-unit profile/membership isolation and non-vacuous private-work isolation.

### Typed work — PASS

Browser acceptance covers creation of:

- Task;
- Routine;
- Case;
- Request;
- Decision;
- Meeting outcome;
- Deliverable.

The Task path is exercised through the complete review loop. Other work types are checked for correct creation and arrival on the relevant Staff work surface where applicable.

### Mobile / accessibility — PASS for the covered acceptance scope

Verified at a 390 × 844 Staff viewport:

- no horizontal page overflow;
- mobile navigation is present;
- sheets receive focus;
- Escape closes a sheet.

The shared Sheet component also traps keyboard focus, restores prior focus when closed, and exposes a close control.

### Administration regression — PASS for current smoke scope

Authenticated Administration fixture successfully opens:

- Home;
- Units;
- People;
- Attendance;
- Cost;
- Reporting;
- Settings.

The tested screens load without the app's visible database-error banner.

This is a regression gate only. It does not mean the broader Administration & HR product phase is complete.

### Group Pastor regression — PASS for current smoke scope

Authenticated Executive fixture successfully opens the existing Group Pastor Home, Announcements, and Me surfaces without a route/shared-component regression.

This is a regression gate only. It does not mean the final Group Pastor product phase is complete.

## Automated gates

On `fe156f10e11ff91fc5f20861ed0593a376b6627b`:

| Gate | Result |
|---|---|
| Build | PASS |
| Migration Replay | PASS |
| Account Security / invited account lifecycle | PASS |
| Role + RLS quality gate | PASS |
| Original role-routing Playwright tests | PASS |
| New core acceptance Playwright tests | PASS — 9/9 total browser tests passed |
| Vercel deployment status | PASS |

The accepted feature head is reported by GitHub as mergeable and clean.

## Vercel / stable URL

The owner-facing address remains:

<https://ceac-os-git.vercel.app>

It was previously verified as reachable and authenticated against the CEAC Supabase project. It currently represents the stable `main` deployment because PR #4 has deliberately not been merged or promoted.

The exact PR head also received a successful Vercel deployment status.

The PR preview itself is protected by Vercel Authentication. The connected Vercel tooling available during this takeover did not have permission to bypass that protection and returned 403. The protection was not weakened.

To avoid turning that into an untested assumption, the exact PR source was instead exercised end to end in the existing GitHub quality-gate environment against a clean replayed Supabase database. This tests the same application code without touching live CEAC records.

No Vercel alias or production deployment was changed.

## Supabase state

- Live project: `efjljhftsesssumtshvp`
- Live migrations: 001–066
- Repository migrations: 001–066
- All configured migration replay checks pass.
- Public application tables are RLS-protected.
- No anonymous/PUBLIC execution exposure on the reviewed SECURITY DEFINER surface was found in the prior takeover audit.

### Security items to carry forward

These are production-hardening items, not reasons to rewrite the accepted Staff/Manager tranche:

1. Supabase's advisor reports leaked-password protection disabled. The connected Supabase tools do not expose the Auth setting needed to change this safely from this session. Enable it before external CEAC production rollout.
2. Supabase currently reports 68 SECURITY DEFINER functions executable by authenticated users. Many are intentional application RPCs with internal authority checks. Treat this as a least-privilege review item before final handover rather than bulk-revoking functions and breaking the application.
3. The GitHub repository has no enforced ruleset/branch-protection configuration visible from the connected tooling. Add required-check protection before the repository becomes a multi-contributor production workflow.

## Risks that remain

### PR size

PR #4 is very large. Do not add the next Administration & HR feature phase to this branch.

### Protected preview

The Vercel preview remains intentionally protected. Current connected Vercel access cannot interact with it directly. GitHub/Vercel reports the exact candidate deployment successful; exact-source acceptance is covered locally in CI.

### Production hardening

Leaked-password protection, final least-privilege review, repository branch protection, backup/restore handover, and final CEAC production ownership are still future handover tasks.

These do not make the current Staff/Manager code untested; they mean CEAC OS is not yet at final external-production handover.

## Rollback

- Base main before PR #4: `bfbcebad33c680a953ce01acc63a49a0f1cce3a0`
- Fully accepted feature/test head: `fe156f10e11ff91fc5f20861ed0593a376b6627b`
- Stable owner-facing deployment remains <https://ceac-os-git.vercel.app> and has not been repointed during this safety phase.

Use normal reviewed revert/rollback operations. Do not rewrite shared history or delete migrations.

## Merge-readiness classification

**PR #4: READY FOR OWNER MERGE DECISION.**

This means the Staff/Manager tranche has passed the required code, migration, role, privacy, browser and regression gates for merge consideration.

It does **not** mean CEAC OS as a whole is production-handover complete.

The safety prompt explicitly prohibited merging automatically, so PR #4 remains open.

## Exact next phase

After the owner approves the merge decision:

1. Merge PR #4.
2. Confirm the stable Vercel URL has deployed the merged `main`.
3. Re-run a short post-merge smoke check.
4. Create a fresh branch from updated `main`.
5. Begin the Administration & HR completion phase.
6. Complete Group Pastor after Administration produces reliable organisation-level data.
7. Finish whole-system onboarding, handover, production security/ownership, and only then Cloudflare migration planning.

Claude may return later to review or contribute. Claude should work from this recorded baseline rather than from the earlier file-ownership assumptions.


## Post-merge Administration & HR branch

PR #4 was merged into `main` at `36d8c6d7f0e2f428f5b80845f306c5a6dc85291c`.

The clean continuation branch is:

`codex/admin-hr-completion`

The first task on this branch is the Administration & HR security gate. No protected HR feature work should begin until migration 067 and `supabase/tests/admin_hr_security_gate.sql` pass the repository safety gates.
