# CEAC OS Experience V2 — Build State

Last updated: 27 September 2026

## Current programme state

Programme: Experience V2
Status: ACTIVE
Current stage: Stage 6 — Manager Overview
Current substage: 6A — Manager Overview audit and contract

Active branch: chatgpt/experience-v2-2026-09-26
Experience V2 baseline SHA: 1a0fb33d3fff18ddae63e6523547b4f4d5d5c883

The branch was created directly from the exact green PR #69 head so that existing fixes and test coverage are retained while the visible product layer is rebuilt safely.

## Protected programme boundaries

PR #69 remains the recovery/reference line from exact green head 1a0fb33d3fff18ddae63e6523547b4f4d5d5c883.

PR #71 remains OPEN DRAFT and FROZEN at bf068f32958134319ea32ecf833748879a163fd2. Do not update, merge, rebuild or discard it while Experience V2 is active.

Stage 13 Payroll remains blocked until CEAC payroll rules are formally confirmed.

## Why Experience V2 exists

Real-device inspection exposed design-quality failures on both phone and laptop that were not caught by the earlier acceptance gate: inconsistent typography, card sizing, layout density, icon treatment, responsive composition and interaction quality.

Repository inspection found the structural causes: a seven-layer CSS cascade, 1,125 !important declarations at the recorded ceiling, a large temporary parity layer, at least two competing hand-built icon systems, no dedicated motion system, no dedicated production icon library, and large screens that mix working data/business logic with presentation.

Safe decision: preserve proven data/security/domain behaviour and progressively rebuild the visible product layer.

## Stage 1 status: COMPLETE

Stage 1 continuity/source-of-truth work is persisted under docs/experience-v2 and in the persistent Library reference package.

Exact Stage 1 green reference head:
dcd18540accb60e19a95c90fd633aab351bbfbba

## Stage 2 completed

- [x] Ratify the V2 token schema against stored references.
- [x] Lock Instrument Sans as the Stage 2 UI type family.
- [x] Select Lucide React as the single production icon family.
- [x] Select Motion for React as the production motion implementation.
- [x] Persist docs/experience-v2/DESIGN_FOUNDATION_V2.md.
- [x] Add isolated src/experience-v2.css semantic foundation.
- [x] Load the V2 foundation after premium-parity.css without restyling legacy role screens.
- [x] Add Stage 2 foundation contract tests.
- [x] Fix the initial regex test-harness defect.
- [x] Verify exact head b947f8c88e73eccc46a3a470760b6e546ddbfe5a: CI PASS; Migration Replay PASS; Account Security PASS; Quality Gate PASS; Vercel PASS.
- [x] Persist docs/experience-v2/STAGE2_WORK_BRIEF.md.
- [x] Persist docs/experience-v2/VISUAL_MIGRATION_BOUNDARY.md.
- [x] Persist docs/experience-v2/STAGE2_VISUAL_ACCEPTANCE.md.
- [x] Persist exact icon-registry contract at docs/experience-v2/ICON_REGISTRY_CONTRACT.md.
- [x] Persist exact motion implementation contract at docs/experience-v2/MOTION_IMPLEMENTATION_CONTRACT.md.
- [x] Persist exact foundation-gallery proof spec at docs/experience-v2/FOUNDATION_GALLERY_SPEC.md.

## Stage 2 in progress

- [x] Install and lock lucide-react 1.48.0 using npm so package.json and package-lock.json remain consistent.
- [x] Install and lock motion 13.4.4 using npm so package.json and package-lock.json remain consistent.
- [x] Build src/experience-v2/icons.jsx according to ICON_REGISTRY_CONTRACT.md.
- [x] Add src/experience-v2/motion.js and ExperienceV2MotionProvider.jsx according to MOTION_IMPLEMENTATION_CONTRACT.md.
- [x] Build the contained V2 foundation gallery according to FOUNDATION_GALLERY_SPEC.md without rebuilding role screens.
- [x] Verify the documented migration boundary in actual icon/component implementation.
- [x] Run Stage 2 mobile + laptop + large-desktop visual inspection against persistent references.
- [x] Record exact accepted Stage 2 SHA and dependency versions.
- [x] Stage 2 visually accepted; Stage 3 may begin from the exact accepted SHA.

Stage 2C icon-registry checkpoint:
- Exact accepted icon-registry SHA: 99e1372743503c7967c023a9a8a213c46b7f5678.
- CI PASS.
- Migration Replay PASS.
- Account Security PASS.
- Complete Quality Gate PASS.
- Vercel PASS.
- Added one Lucide-backed CEAC semantic registry and architecture enforcement tests.
- Corrected the Home semantic mapping before acceptance.
- No role screen, Supabase object, frozen PR #71 code, motion provider or gallery was changed in Stage 2C.

Stage 2D motion-provider checkpoint:
- Exact accepted motion-policy SHA: 87c0b836b1d2cd06279ac427275b9f6d713497b4.
- CI PASS.
- Migration Replay PASS.
- Account Security PASS.
- Complete Quality Gate PASS.
- Vercel PASS.
- Added the central MotionConfig provider with reducedMotion="user".
- Added semantic motion durations, easing and restrained layout spring constants.
- Wrapped the app with policy only; no legacy role screen gained new animation.
- Added architecture tests and corrected the initial main.jsx mount formatting before acceptance.

Stage 2E foundation-gallery checkpoint:
- Exact implementation SHA: 4ab0b41a28e5ec7e70eddafb3e35dcb1d096f464.
- CI PASS.
- Migration Replay PASS.
- Account Security PASS.
- Complete Quality Gate PASS.
- Vercel PASS.
- Gallery is mounted only on the protected Administration/HR primitives diagnostic route.
- No primary navigation destination was added.
- No role screen was rebuilt.

Stage 2F visual acceptance/correction: COMPLETE
- First laptop proof exposed a real density-layout defect in the priority card/supporting queue relationship.
- Corrected at the shared foundation composition layer; no role-screen patch was used.
- Added deterministic visual tests at 390×844, 1366×768 and 1440×900.
- Added expanded-state motion evidence at 1366×768.
- Hardened V2 typography rendering and diagnostic scroll isolation.
- Exact accepted Stage 2 SHA: f1d53018000d4359809b9ff8ab0c85e4c84912d3.
- CI PASS.
- Migration Replay PASS.
- Account Security PASS.
- Complete Quality Gate PASS.
- Vercel PASS.
- lucide-react 1.48.0.
- motion 13.4.4.
- Persistent visual evidence:
  CEAC OS / Experience V2 / Evidence / Stage 2 / f1d53018000d4359809b9ff8ab0c85e4c84912d3
- Accepted as the V2 FOUNDATION quality direction only. It does not imply that the current legacy role screens or shell meet the final product-quality bar. Those are rebuilt and accepted in later stages.

## Current engineering checkpoints

Exact verified green foundation checkpoint:
b947f8c88e73eccc46a3a470760b6e546ddbfe5a

Exact verified green documentation/foundation checkpoint:
45fce6eb7e6fec82295d90289e4ef31a1e0699d0
- CI PASS
- Migration Replay PASS
- Account Security PASS
- Complete Quality Gate PASS
- Vercel PASS

A later documentation-only commit recorded that checkpoint. Incoming writers must always inspect actual branch HEAD rather than assuming the SHA above is still current.

Stage 2B dependency checkpoint:
- Installed `lucide-react@1.48.0` and `motion@13.4.4` together through normal npm resolution.
- Changed only `package.json`, `package-lock.json` and this handoff record.
- `npm ci`: PASS (the Work runner used Node 24.19.0 and reported the expected engine warning because the repository requires Node >=22.12 <23).
- `npm run build`: PASS.
- `npm audit --audit-level=high`: PASS, 0 vulnerabilities.
- `git diff --check`: PASS.
- No icon registry, motion provider, gallery or role-screen implementation was started in this checkpoint.
- Screenshots/evidence: not applicable to dependency installation; visual proof remains a later Stage 2 gate.

## Stage 3 active work

Stage 3 builds the reusable V2 component system on the accepted Stage 2 foundation. It does not rebuild Staff/Manager/Admin/Executive role screens yet.

Current substage 3A:
- [x] V2 Button and IconButton family.
- [x] V2 Input, Textarea and Select family.
- [x] V2 Status/Badge primitives.
- [x] V2 Surface/Panel primitives.
- [x] V2 Tabs/Segmented control foundation.
- [x] V2 Avatar primitive.
- [x] Core component accessibility/geometry tests.
- [x] Extend the protected V2 gallery to prove these components at phone and laptop widths.

Current substage 3B:
- [x] V2 Stat/KPI tile.
- [x] V2 QueueRow.
- [x] V2 RecordRow.
- [x] V2 Action/Focus card.
- [x] V2 DataPanel.
- [x] V2 Table shell.
- [x] V2 progress/status distribution.
- [x] V2 timeline foundation.
- [x] Extend the protected V2 gallery with compact operational/data examples.
- [x] Add architecture/accessibility/density tests.
- [x] Inspect phone/laptop/desktop proof before 3C.

Current substage 3C:
- [x] Tooltip.
- [x] Popover/Menu foundation.
- [x] Drawer/Sheet.
- [x] Modal/Dialog.
- [x] Skeleton/Loading.
- [x] Empty/Error/Configuration state surfaces.
- [x] Toast/Confirmation.
- [x] Keyboard/focus/escape/close behaviour tests.
- [x] Extend protected V2 gallery with interaction/state proofs.
- [x] Inspect phone/laptop/desktop proof.
- [x] Accept Stage 3 and open Stage 4 shell only after 3C passes.

Do not start Stage 4 shell until Stage 3 is accepted.

## Stage 3A implementation checkpoint

Implemented on top of exact accepted Stage 2:
- Button and IconButton families.
- Input, Textarea and Select field families.
- StatusBadge semantic states.
- Surface variants.
- SegmentedControl tab foundation.
- Avatar image/fallback primitive.
- Scoped production component stylesheet under src/experience-v2/components/.
- Static architecture/accessibility tests.
- Protected gallery proof updated to use the production components.
- No role screen migrated.

Stage 3A acceptance: COMPLETE
- Exact accepted SHA: 591d042a77a97681952a513f94c72f97fd70b741.
- CI PASS.
- Migration Replay PASS.
- Account Security PASS.
- Complete Quality Gate PASS.
- Vercel PASS.
- Rendered proof inspected at 390×844, 1366×768 and 1440×900.
- The production controls/surfaces remain visually coherent with the accepted Stage 2 foundation: consistent typography, Lucide icon treatment, control heights, focus geometry, surface restraint and responsive composition.
- Persistent evidence:
  CEAC OS / Experience V2 / Evidence / Stage 3 / 3A / 591d042a77a97681952a513f94c72f97fd70b741
- No role screen was migrated.

## Stage 3B implementation checkpoint

Implemented:
- StatTile with optional drill-in link/action affordance.
- QueueRow and RecordRow.
- ActionFocusCard.
- DataPanel.
- TableShell with semantic table/caption/header markup.
- ProgressDistribution with progressbar semantics.
- Timeline foundation.
- Protected gallery proof using reference-only content.
- Architecture/accessibility/density tests.
- No role screen migrated.

Stage 3B acceptance: COMPLETE
- Exact accepted SHA: c6881aa70c238a883a22dc870c3d210d8f03440c.
- CI PASS.
- Migration Replay PASS.
- Account Security PASS.
- Complete Quality Gate PASS.
- Vercel PASS.
- First Quality Gate attempt failed only because the new boundary test searched for the literal component name "QueueRow"; ManagerHome legitimately uses the older legacy QueueRow from ../components/primitives.
- The test was corrected to detect actual imports from experience-v2/components. No role-screen migration occurred.
- Rendered proof inspected at 390×844, 1366×768 and 1440×900.
- Operational/data primitives remain compact, readable and consistent with the accepted V2 foundation.
- Persistent evidence:
  CEAC OS / Experience V2 / Evidence / Stage 3 / 3B / c6881aa70c238a883a22dc870c3d210d8f03440c

First Stage 3B verification found two issues:
- a test-harness false positive because legacy ManagerHome already contains its own QueueRow symbol; the boundary test now checks V2 imports instead of generic names;
- the Stage 3B gallery split a queue/data panel too narrowly inside the seven-column proof region at laptop width. The proof now stacks operational/data groups inside that constrained region so row text and status geometry remain readable.

## Stage 3C implementation checkpoint

Implemented:
- Tooltip with focus/hover semantics.
- PopoverMenu with outside-click and Escape handling.
- Drawer/Sheet with responsive mobile bottom-sheet treatment.
- ModalDialog and ConfirmDialog.
- Skeleton/Loading treatment.
- Empty/Error/Configuration/Success-capable StatePanel.
- Toast/Confirmation feedback.
- Focus trapping, Escape dismissal and focus restoration for overlays.
- Protected gallery interaction/state proof.
- Playwright keyboard/focus behaviour tests.
- No role screen migrated.

Stage 3C acceptance: COMPLETE
- Exact accepted implementation SHA: 2ff50401115cc3d14b95cb2983dcbe4c82afa83b.
- CI PASS.
- Migration Replay PASS.
- Account Security PASS.
- Complete Quality Gate PASS after rerunning the initially failed monolithic job; the rerun passed the full role/RLS suite and Stage 3C coverage without a product-code change.
- Vercel PASS.
- Base proof inspected at 390×844, 1366×768 and 1440×900.
- Open phone drawer proof inspected at 390×844.
- Open laptop modal proof inspected at 1366×768.
- No additional shared Stage 3C defect was found in the accepted proof.
- Persistent evidence:
  CEAC OS / Experience V2 / Evidence / Stage 3 / 3C / 2ff50401115cc3d14b95cb2983dcbe4c82afa83b
- Acceptance record: docs/experience-v2/STAGE3C_ACCEPTANCE_RECORD.md.

Additional visual-acceptance requirement:
- Stage 3C cannot be accepted from closed-state gallery screenshots alone.
- The visual gate now captures the responsive phone drawer and laptop modal while open, in addition to the existing base/motion evidence.

Latest full-gate note:
- The first open-state evidence run exposed two unrelated legacy-gate failures after the new V2 tests themselves passed.
- Executive Home rendered .office-meeting-empty at 10.5px, below the already-ratified 12px operational floor. This selector had been missed by the previous targeted floor hardening. It is now added to the existing scoped 12px floor; this is a legacy hardening correction, not a role-screen V2 migration.
- The Staff/Manager real-work-loop test also timed out because its existing legacy “Send for review” button remained disabled. No Stage 3C component participates in that workflow. This will be treated as a possible fixture/test flake unless it reproduces on the rerun.

Stage 3C verification note:
- First Quality Gate run found a real PopoverMenu focus-restoration bug.
- Escape correctly closed the menu, but focus restoration targeted the wrapper span rather than the actual trigger button, so keyboard context was lost.
- The implementation now restores focus to the button inside the trigger wrapper on Escape and item selection.
- This is a component-level fix; no role screen was changed.

## Stage 4 active work

Stage 4 builds the shared V2 shell only after the accepted Stage 3 component checkpoint.

Current substage 4A:
- [x] Audit the current desktop, laptop and mobile shell across all four roles.
- [x] Record the authorised destination matrix and responsive shell contract.
- [x] Define the migration boundary so role-screen content is not rebuilt accidentally.
- [x] Persist the Stage 4 work brief before shell product code begins.

Stage 4A audit/contract checkpoint:
- Active shell confirmed in App.jsx + components/PremiumShell.jsx + premium.css.
- Role-screen content remains outside Stage 4.
- Current strengths, shared shell defects, destination matrix, responsive contract and authority boundary are recorded in docs/experience-v2/STAGE4_WORK_BRIEF.md.
- Stage 4B may now implement the isolated V2 shell structure.

Stage 4B: ACCEPTED

Accepted exact implementation SHA:
- `99a380e42083153ce627eccad9f412bfad5f0a2a`

Acceptance evidence:
- CI PASS
- Migration Replay PASS
- Account Security PASS
- Complete Quality Gate PASS
- Vercel PASS
- Quality Gate run `36266918061`
- rendered Staff, Manager, Administration and Executive desktop evidence inspected
- rendered Staff mobile evidence inspected
- acceptance record: `docs/experience-v2/STAGE4B_ACCEPTANCE_RECORD.md`

Stage 4B accepted outcomes:
- isolated shared V2 shell;
- central four-role destination model;
- central authorised quick-action model;
- independently scrolling desktop navigation;
- protected diagnostics removed from ordinary navigation;
- truthful destination search;
- Stage 3 Popover/Drawer primitives reused;
- integrated mobile unit context;
- explicit Africa/Accra time handling;
- V2 Lucide icon language;
- no new shell `!important`;
- 12px shared small-Avatar text floor;
- legacy shell acceptance migrated without weakening authority or role assertions.

Stage 4C: ACCEPTED

Accepted exact implementation SHA:
- `2768fafc78f59fc31eafb373d45d295c7acbbea3`

Exact-head engineering status:
- CI PASS
- Migration Replay PASS
- Account Security PASS
- Complete Quality Gate PASS
- Vercel PASS
- Quality Gate run `36291398713`, successful attempt 3

Stage 4C accepted evidence:
- Staff phone proof at 320, 360, 375, 390, 414 and 430px;
- all four role shells at 390px;
- all four role shells at 1366×768;
- all four role shells at 1440×900;
- Administration 320px bottom-navigation label readability;
- Staff 320px More Drawer geometry, Escape close and focus restoration;
- long identity/unit strings without shell widening;
- capability-limited Administration policy;
- dual-unit policy boundary;
- truthful destination search and keyboard flow;
- canonical mobile overlay/back behaviour;
- no tested page-level horizontal overflow or clipped essential shell controls.

Visual evidence:
- successful exact-head Quality Gate artifact `redesign-r7-product-inspection`, artifact ID `10923251132`;
- persistent Library package:
  `CEAC OS / Experience V2 / Evidence / Stage 4 / 4C / 2768fafc78f59fc31eafb373d45d295c7acbbea3 / stage4c-r7-exact-head-evidence.zip`.

Verification note:
- Quality Gate attempts 1 and 2 failed on different unrelated legacy acceptance-core scenarios.
- No Stage 4C shell test failed in the recorded Stage 4C sequence.
- Attempt 3 passed the complete Quality Gate on the same exact product head without another product-code change.

Stage 4D: ACCEPTED

Accepted exact implementation SHA:
- `e6b26a07bf522ec63824bbaa9158fdd0b1d06ed4`

Exact-head engineering status:
- CI PASS
- Migration Replay PASS
- Account Security PASS
- Complete Quality Gate PASS
- Vercel PASS
- Quality Gate run `36293860529`

Stage 4D accepted outcomes:
- the approved four-role destination model matches the runtime route contract;
- every authorised desktop destination is reachable for Staff, Manager, Administration/HR and Executive;
- every mobile primary destination and every More-drawer destination is reachable and role-specific;
- active-state behaviour remains consistent after navigation;
- protected Primitives diagnostics remain absent from ordinary navigation;
- Administration People remains capability-gated rather than represented by a dummy destination;
- desktop and mobile navigation remain within the viewport across the accepted shell matrix;
- the rendered operational 12px floor remains enforced on legacy surfaces exposed by the all-route inventory.

Stage 4D verification note:
- the first Stage 4D Quality Gate exposed genuine pre-existing sub-12px text on Staff/Manager performance and Manager finance routes while the new all-route matrix was running;
- the correction was limited to the already-established transitional 12px floor in `premium-parity.css`;
- no route authority, data query, RLS, RPC, auth/session or Stage 12 integration boundary changed;
- the corrected exact head passed the complete Quality Gate.

Visual evidence:
- successful exact-head Quality Gate artifact `redesign-r7-product-inspection`, artifact ID `10923521832`;
- persistent Library package:
  `CEAC OS / Experience V2 / Evidence / Stage 4 / 4D / e6b26a07bf522ec63824bbaa9158fdd0b1d06ed4 / stage4d-r7-exact-head-evidence.zip`;
- direct inspection covered Staff, Manager, Administration and Executive desktop shell proof and all four mobile More drawers.

Stage 4 — Shell V2: COMPLETE

Stage 4 exit gate is satisfied:
all four roles can move through their authorised destinations without shell overflow, clipping or navigation inconsistency at accepted phone, laptop and desktop widths.

## Stage 5 — Staff Today: COMPLETE

Accepted exact implementation SHA:
- `69eb0ca509f9b15047e4277667ea3016150b726e`

Exact-head engineering status:
- CI PASS
- Migration Replay PASS
- Account Security PASS
- Complete Quality Gate PASS
- Vercel PASS
- Quality Gate run `36298098841`
- Playwright role/acceptance suite: 164 passed

Stage 5 accepted outcomes:
- Staff Today now uses an isolated V2 presentation layer under `src/experience-v2/staff-today/`;
- existing Staff Today loading/query and work-session authority remain in `src/screens/Home.jsx`;
- work-session Start work, End work and stale-session reconciliation remain intact;
- dominant next action, Today schedule, Updates, Waiting, Coming up, This week and Announcements use the accepted V2 hierarchy/components;
- recurring Ministry numbers remain available as a lower-priority factual record instead of competing with the daily focus;
- Manager-created meetings remain reachable/openable from Staff Today;
- duplicate Explore/navigation modules were removed from the Staff Today content layer;
- the new Staff presentation uses the central V2 Lucide registry rather than a local icon dictionary;
- 320px, 390×844, 1366×768 and 1440×900 compositions pass without horizontal overflow;
- the legacy Staff home visual fingerprint was deliberately re-baselined to the accepted V2 Staff Today composition rather than weakening the regression threshold.

Stage 5 verification notes:
- early Stage 5 gates exposed two stale acceptance selectors that still targeted the removed `.home-meeting-row`; those tests were migrated to the new Staff V2 meeting row without weakening the meeting workflow assertion;
- the first migration temporarily removed the recurring Ministry record from Today; the capability was restored using a Staff V2 presentation mode while keeping the existing write path;
- one Quality Gate attempt was blocked by runner/Supabase container infrastructure, not product code; the exact accepted head later passed the complete gate;
- final exact-head visual proof was inspected directly at phone, laptop and desktop widths and no high-severity visual defect remained.

Visual evidence:
- successful exact-head Quality Gate artifact `redesign-r7-product-inspection`, artifact ID `10924812946`;
- persistent Library package:
  `CEAC OS / Experience V2 / Evidence / Stage 5 / 69eb0ca509f9b15047e4277667ea3016150b726e / stage5-r7-exact-head-evidence.zip`;
- acceptance record:
  `docs/experience-v2/STAGE5_ACCEPTANCE_RECORD.md`.

Stage 5 exit gate is satisfied.

## Stage 6 active work

Stage 6 rebuilds the Manager Overview keystone only. It must preserve the current manager queries, decision authority, work-review/leave/blocker workflows, workload/project/finance/reporting logic and drill-down behaviour while replacing the Overview composition with the accepted V2 system.

Current substage 6A — AUDIT AND CONTRACT:
- [x] inspect the exact current Manager Overview implementation and current rendered desktop/mobile evidence;
- [x] identify the data/decision authority that must not change;
- [x] compare the current composition with the persistent V2 quality direction and accepted Staff Today pattern;
- [x] define the Manager Overview information hierarchy and mobile recomposition;
- [x] persist `docs/experience-v2/STAGE6_WORK_BRIEF.md`;
- [ ] implement the isolated Manager Overview V2 presentation without changing manager authority/data semantics;
- [ ] run focused Stage 6 browser acceptance and inspect phone/laptop proof;
- [ ] accept Stage 6 only on an exact green head.

Do not start Stage 7 until Manager Overview is visually and functionally accepted.

## Current handoff

Chat is the sole active writer. Work/Codex usage is exhausted and Work is not active. Stage 5 is accepted and complete. Stage 6A Manager Overview audit/contract is active. No unpushed Chat state is known.

Exact next action:
- keep `ManagerHome.jsx` as the authoritative data/action container;
- build an isolated V2 Manager Overview presentation under `src/experience-v2/manager-overview/`;
- preserve work-review, leave, blocker, meeting, project, person, finance and drill-down authority exactly;
- replace the legacy hero/reference rail/card mosaic/module strip with a decision-first V2 command-centre composition;
- prove phone and 1366×768 laptop first, then 1440×900 stretch control;
- do not start Stage 7 until Stage 6 is accepted.

## Draft PR

#72 — Experience V2: rebuild CEAC product experience safely

## Handoff rule

At the end of every meaningful substage, update this file. Never depend on an agent remembering where it stopped. The incoming Chat or Work session must inspect GitHub and this file before continuing. One active writer only.
