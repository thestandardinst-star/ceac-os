# CEAC OS Experience V2 — Build State

Last updated: 28 September 2026

## Current programme state

Programme: Experience V2
Status: ACTIVE
Current stage: Stage 10 — Operational Screen Families (ACTIVE)
Current substage: 10D3 — Manager Workforce context (ACTIVE)

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

## Stage 6 — Manager Overview: COMPLETE

Accepted exact implementation SHA:
- `da586a16d6aacd7101879928a97b6f3b53e05956`

Exact-head engineering status:
- CI PASS
- Migration Replay PASS
- Account Security PASS
- Complete Quality Gate PASS
- Vercel PASS
- Quality Gate run `36302666691`
- Playwright role/acceptance suite: 169 passed

Stage 6 accepted outcomes:
- Manager Overview now uses an isolated V2 presentation under `src/experience-v2/manager-overview/`;
- `src/screens/ManagerHome.jsx` remains the authoritative data/action container;
- work review, return-for-correction and approval authority remain intact;
- leave approval/decline/escalation logic remains intact;
- blocker acknowledge/disagree/resolve flows remain intact;
- meeting, project, person, finance and work drill-ins remain intact;
- the Overview is decision-first rather than hero-first;
- team availability and work movement are presented as separate factual context;
- project/dependency attention, requests to the unit, finance position, weekly work horizon, recorded Sunday/midweek movement, personal work, routines and recent movement use the accepted V2 hierarchy;
- the old ReferenceFocusPanel, DashboardCalendar and ReferenceModuleStrip are absent from Manager Overview;
- 320px, 390×844, 1366×768 and 1440×900 compositions pass without page-level horizontal overflow;
- Manager visual regression was deliberately re-baselined to the accepted V2 Manager Overview rather than weakening the regression threshold.

Stage 6 verification notes:
- the first implementation build exposed a render-closure syntax defect in `ManagerHome.jsx`; it was corrected immediately at the migration boundary;
- the first full Quality Gate then exposed stale Manager acceptance selectors that still targeted legacy `.home-action-row` and `.home-blocker-row` presentation classes; the selectors were migrated to the V2 decision/dependency rows without weakening the real work-review or blocker workflow assertions;
- direct laptop inspection exposed an overly narrow three-column lower row; Stage 6 moved the operational grid to an auto-fit layout and tightened the Work horizon density instead of shrinking typography;
- full-gate inventory exposed one unrelated legacy Staff record feedback timestamp at 10.5px; the exact selector was raised to the already-ratified 12px operational floor;
- the Manager baseline gate correctly failed after the intentional V2 composition change; the Manager baseline was re-recorded after direct rendered inspection, and the threshold remained unchanged.

Visual evidence:
- successful exact-head Quality Gate artifact `redesign-r7-product-inspection`, artifact ID `10925962948`;
- persistent Library package:
  `CEAC OS / Experience V2 / Evidence / Stage 6 / da586a16d6aacd7101879928a97b6f3b53e05956 / stage6-r7-exact-head-evidence.zip`;
- direct inspection covered 320px phone, 390×844 phone, 1366×768 laptop and 1440×900 desktop;
- acceptance record:
  `docs/experience-v2/STAGE6_ACCEPTANCE_RECORD.md`.

Stage 6 exit gate is satisfied.

## Stage 7 — Administration Overview: COMPLETE

Accepted exact implementation SHA:
- `1e55846f9f65f084f850efc2dae57bd0e1ef6f63`

Exact-head engineering status:
- CI PASS
- Migration Replay PASS
- Account Security PASS
- Complete Quality Gate PASS
- Vercel PASS
- Quality Gate run `36308872363`
- Playwright role/acceptance suite: 174 passed

Stage 7 accepted outcomes:
- Administration Overview now uses an isolated V2 presentation under `src/experience-v2/admin-overview/`;
- `src/screens/AdminHome.jsx` remains the authoritative Administration data/action container;
- invitation, leave, setup, workflow-check, reporting, cross-unit blocker, meeting and capability authority remain intact;
- Administration authority/configuration gaps now lead the hierarchy through the operational inbox and setup state;
- reporting coverage, organisation pulse, workforce context, delivery signals, meetings, units and personal work are secondary factual context;
- workforce/session facts remain explicitly non-performance and non-ranking;
- the legacy scenic hero, fixed calendar rail, ReferenceFocusPanel and duplicate ReferenceModuleStrip are removed from Administration Overview;
- 320px and 390×844 mobile compositions are intentionally recomposed instead of retaining the previous squeezed two-column layout;
- 1366×768 laptop and 1440×900 desktop remain dense without clipping or horizontal overflow;
- the Administration visual fingerprint was deliberately re-baselined after direct inspection rather than weakening the regression threshold.

Stage 7 verification notes:
- the first implementation needed a render-boundary correction in `AdminHome.jsx`;
- exact-head full-gate inventory exposed setup-density and rendered-text-floor issues, corrected without shrinking below the 12px operational floor;
- the final exact head passed every engineering gate and the full 174-test role/acceptance suite;
- direct visual inspection of 320px, 390×844, 1366×768 and 1440×900 proof found no remaining high-severity Stage 7 visual defect.

Visual evidence:
- successful exact-head Quality Gate artifact `redesign-r7-product-inspection`, artifact ID `10928585555`;
- exact Stage 7 screenshots inspected:
  - `redesign-r7-stage7-admin-320.png`;
  - `redesign-r7-stage7-admin-390.png`;
  - `redesign-r7-stage7-admin-laptop.png`;
  - `redesign-r7-stage7-admin-desktop.png`;
- persistent Library package:
  `CEAC OS / Experience V2 / Evidence / Stage 7 / 1e55846f9f65f084f850efc2dae57bd0e1ef6f63 / stage7-r7-exact-head-evidence.zip`;
- acceptance record:
  `docs/experience-v2/STAGE7_ACCEPTANCE_RECORD.md`.

Stage 7 exit gate is satisfied.

## Stage 8 — Executive Overview: COMPLETE

Accepted exact implementation SHA:
- `6b555613bde7f2d9b257f9c417af1cc11514a81a`

Stage 8 accepted outcomes:
- Executive Overview now uses an isolated V2 presentation under `src/experience-v2/executive-overview/`;
- `src/screens/ExecutiveHome.jsx` remains the authoritative Executive query/derivation/action container;
- senior attention leads the hierarchy;
- ministry movement and recurring ministry-number evidence remain factual and drillable;
- objective status and Portfolio context remain explicit records without synthetic scoring;
- reporting coverage and Finance remain separate authoritative contexts;
- organisation delivery movement uses canonical Task/Deliverable completion;
- manager-owned review remains labelled as manager-owned unless escalated by an existing rule;
- upcoming meetings remain visible and schedulable through the existing handlers;
- the legacy scenic hero, fixed calendar rail and duplicate module strip are removed from Executive Overview;
- 320px, 390×844, 1366×768 and 1440×900 compositions were directly inspected;
- the Executive visual fingerprint was deliberately re-recorded only after direct inspection; the regression threshold remains unchanged.

Stage 8 verification notes:
- the first Stage 8B Quality Gate exposed a real recurring ministry-number presentation regression: the numeric value and value label had no separating text node, so the authoritative record did not expose `17 People received` as expected;
- the correction was presentation-only and preserved the existing recurring-operation write/read authority, RLS/RPC and data model;
- a subsequent complete Quality Gate passed that workflow;
- the intentional Executive V2 redesign correctly failed the old Executive visual fingerprint before acceptance;
- fresh phone/laptop/desktop proof was inspected against the Stage 8 work brief, accepted Stages 5–7 and persistent V2 quality references;
- only the Executive baseline was re-recorded; Staff, Manager and Administration baselines were not changed.

Exact-head engineering status at accepted implementation SHA:
- CI PASS;
- Migration Replay PASS;
- Account Security PASS;
- Complete Quality Gate PASS;
- Vercel PASS;
- Quality Gate run `36313554437`;
- Playwright role/acceptance suite: 179 passed.

Visual evidence:
- successful exact-head Quality Gate artifact `redesign-r7-product-inspection`, artifact ID `10930196769`;
- exact Stage 8 screenshots inspected:
  - `redesign-r7-stage8-executive-320.png`;
  - `redesign-r7-stage8-executive-390.png`;
  - `redesign-r7-stage8-executive-laptop.png`;
  - `redesign-r7-stage8-executive-desktop.png`;
- persistent Library package:
  `CEAC OS / Experience V2 / Evidence / Stage 8 / 6b555613bde7f2d9b257f9c417af1cc11514a81a / stage8-r7-exact-head-evidence.zip`;
- acceptance record:
  `docs/experience-v2/STAGE8_ACCEPTANCE_RECORD.md`.

Stage 8 exit gate is satisfied.

Stage 9 has not started. Do not write Stage 9 product code until the live branch HEAD and Stage 9 sequence are re-read from GitHub.

## Current handoff

This Chat is the sole active writer. Codex/Work is inactive.

Stage 9 — Keystone Quality Gate and System Ratification is ACCEPTED AND COMPLETE.

Accepted Stage 9 visual implementation:
- `b87a0552dd8408f962d8d999494cdefeada773b2`.

Post-ratification deterministic regression hardening:
- `7ca495a211e614c31a5fed80d71f527a77dd3390`;
- CI PASS;
- Migration Replay PASS;
- Account Security PASS;
- Complete Quality Gate PASS — run `36325853986`;
- Vercel PASS;
- no product presentation, data, authority or baseline change in that hardening commit.

Stage 10 — Operational Screen Families is ACTIVE.

Current family:
- Family A — Work.

Current substage:
- 10A1 — Work lists and queues.

Contract:
- `docs/experience-v2/STAGE10_WORK_BRIEF.md`.

Exact Stage 10 entry audit:
- inspected Staff, Manager, Administration and Executive Work source;
- inspected shared Work Detail and Assign source;
- inspected Work Management and Experience Stage 7 acceptance/security paths;
- inspected exact-head R1/R2/R3/R4 Work screenshots from Quality Gate run `36325853986`;
- confirmed the Family A scope is lists/queues, Work Detail, assignment/review/return/dependency states;
- confirmed a real continuity gap: Manager Work → Needs review opens Work Detail, while approve/return currently lives in Manager Overview. Family A may expose that same existing manager authority inside the Work flow, but must not broaden authority to Administration or Executive.

Protected behaviours include:
- Staff Assigned / Agreed / Private and private-work isolation;
- Manager Given out / Needs review / Team work / Mine;
- Administration Given out / Needs review / Organisation / Mine;
- Executive Given out / Needs review / Mine;
- all seven work kinds;
- assignment minimum of what / why / who / when;
- typed-work, review, blocker, routine, request, decision, case, deliverable and meeting-outcome behaviours;
- current RLS/RPC/auth/audit boundaries;
- no invented delegation history;
- no scores/rankings;
- PR #71 frozen;
- Stage 13 Payroll blocked.

Exact next action:
- wait for the current documentation-head checks only as a continuity gate;
- begin 10A1 by building one shared V2 Work-list anatomy and migrate Staff, Manager, Administration and Executive Work presentation onto it without changing their queries/actions;
- verify existing Work acceptance journeys after the first implementation SHA;
- do not start 10A2 until 10A1 list/queue behaviour and responsive composition are green;
- keep PR #72 OPEN + DRAFT; do not merge.

There is no unpushed Work/Codex state.

## Draft PR

#72 — Experience V2: rebuild CEAC product experience safely

## Handoff rule

At the end of every meaningful substage, update this file. Never depend on an agent remembering where it stopped. The incoming Chat or Work session must inspect GitHub and this file before continuing. One active writer only.


## Stage 9 active work

Stage 9 is the keystone quality gate and system-ratification stage defined by the canonical Experience V2 sequence.

Stage 9A entry:
- Starting exact HEAD: `21f1c18ba1f1c1fa149accebdc598ce6b3168af9`.
- Stage 9 work brief: `docs/experience-v2/STAGE9_WORK_BRIEF.md`.
- Exact-head Quality Gate evidence reviewed from run `36314474308`, artifact `redesign-r7-product-inspection` (`10931055910`).
- Cross-role laptop and 390px first-viewport review is coherent.
- Confirmed defect S9-01: populated Manager decision rows compress incorrectly at 320px.
- Confirmed reliability defect S9-02: Stage 6 Workload persisted planning-capacity visibility failed twice and passed on the third run on the exact same documentation-only HEAD.
- Stage 9 will fix actual root causes only; no timeout inflation, retries, skipped assertions or weakened persistence checks.
- Accepted Stage 5–8 keystones remain protected except for concrete Stage 9 defects.
- Chat is the sole active writer. No unpushed Work/Codex state is known.
- Stage 10 has NOT started.


## Stage 9 technical ratification checkpoint

Exact technical implementation SHA:
- `b87a0552dd8408f962d8d999494cdefeada773b2`

Technical status:
- CI PASS;
- Migration Replay PASS;
- Account Security PASS;
- Complete Quality Gate PASS — run `36320925112`;
- 179 Playwright role/acceptance tests passed on the first exact-head run;
- Vercel PASS;
- exact-head 320px, 390×844, 1366×768 and 1440×900 keystone evidence reviewed;
- exact-head evidence persisted at:
  `CEAC OS / Experience V2 / Evidence / Stage 9 / b87a0552dd8408f962d8d999494cdefeada773b2 / stage9-r7-exact-head-evidence.zip`.

Stage 9 corrections:
- S9-01 Manager populated-decision composition at 320px corrected and regression-guarded;
- S9-02 Workload selection race corrected without retry, timeout inflation, skipped coverage or weakened persistence assertions.

System review:
- typography floor and Instrument Sans remain intact;
- single CEAC/Lucide icon registry remains intact;
- phone/laptop/desktop geometry and role-specific density remain coherent;
- keyboard/focus/touch/reduced-motion coverage remains green;
- production bundle still carries the known >500 kB main-chunk warning; exact build is approximately 359.59 kB gzip JS and 62.14 kB gzip CSS. Canonical Stage 15 owns bundle/media/CSS-debt closure; Stage 10 must avoid unnecessary growth.

Ratification record:
- `docs/experience-v2/STAGE9_ACCEPTANCE_RECORD.md`.

Product-owner acceptance:
- on 27 September 2026, after the technical-ratification checkpoint, the product owner instructed “Continue”;
- this is recorded as acceptance of the four-keystone quality direction and authorisation to proceed.

Stage 9 is ACCEPTED AND COMPLETE.

Stage 10 has NOT started. The next safe action is to inspect the live exact HEAD after this closure, then open Stage 10 Family A — Work from the canonical operational-family sequence.


## Stage 10 active work

### 10A — Family A: Work

Entry head before Stage 10 documentation:
- `7ca495a211e614c31a5fed80d71f527a77dd3390` — exact-head green.

Work brief:
- `docs/experience-v2/STAGE10_WORK_BRIEF.md`.

Pre-work visual evidence inspected from Quality Gate run `36325853986`:
- R1 Staff Work artifact `10933758539`;
- R2 Manager Work artifact `10933918142`;
- R3 Administration Work artifact `10934376041`;
- R4 Executive Work artifact `10934465802`;
- full visual inventory artifact `10934405943`.

10A internal sequence:
1. 10A1 — Work lists and queues — ACCEPTED.
2. 10A2 — Work Detail — ACCEPTED.
3. 10A3 — assignment, review, return and dependency — ACCEPTED.
4. 10A4 — Family A acceptance — ACCEPTED.

Family B must not begin until Family A is accepted.


### 10A1 acceptance — Work lists and queues

Accepted exact implementation head:
- `da4d690a6a0268f47b743798009658993aed068e`.

Exact-head gates:
- CI PASS — run `36328359726`;
- Migration Replay PASS — run `36328359691`;
- Account Security PASS — run `36328359652`;
- Complete Quality Gate PASS — run `36328359699`;
- Vercel PASS.

10A1 outcomes:
- one shared Experience V2 Work-family presentation layer now serves Staff, Manager, Administration and Executive Work lists;
- Staff Assigned / Agreed / Private and status filters are preserved;
- Manager Given out / Needs review / Team work / Mine are preserved;
- Administration Given out / Needs review / Organisation / Mine are preserved;
- Executive Given out / Needs review / Mine are preserved;
- current query, RLS, RPC, ownership and delegation semantics are unchanged;
- role-specific legacy Work-list CSS was retired where replaced rather than layered over;
- no new `!important` debt was added;
- Work metadata now respects the 12px operational floor;
- Stage 10 Family A regression coverage proves 320px and 1366×768 composition for all four Work surfaces with no page-level horizontal overflow;
- exact-head 1440-class Staff, Manager, Administration and Executive Work screenshots were directly inspected from Quality Gate artifacts and show coherent hierarchy/density with no high-severity defect.

The first 10A1 Quality Gate attempt on `1683122790b0ac5be4f6d0fddbc5f833e705cc77` correctly caught one real visual-system violation: inherited `small` styling rendered Work-row due metadata at 10.833px. The source CSS was corrected; no threshold or test was weakened.

10A2 — Work Detail is ACCEPTED.
10A3 — assignment, review, return and dependency is ACCEPTED.
10A4 — Family A acceptance is ACCEPTED.
Family B — People/Team is now ACTIVE at audit/contract only.


### 10A2 acceptance — Work Detail

Accepted exact implementation head:
- `74fddf56d096f3bf2125de76810935c0ca5870c8`.

Exact-head gates:
- CI PASS — run `36332693790`;
- Migration Replay PASS — run `36332693776`;
- Account Security PASS — run `36332693786`;
- Complete Quality Gate PASS — run `36332693778`;
- Vercel PASS.

10A2 outcomes:
- shared Work Detail presentation now uses the V2 Work-family hierarchy while preserving the existing `Item.jsx` work-engine behaviour;
- identity/status, room trace, purpose, expected outcome, type-specific detail, checklist/actions and supporting state remain on the same underlying data/RPC paths;
- purpose now precedes finished-result and instructions in the approved working hierarchy;
- no Work RPC, RLS, auth, private-work, ownership, blocker or review authority changed;
- 320px and 1366×768 Staff Work Detail regression proof passes with no page-level horizontal overflow and a 12px minimum operational-text floor;
- direct exact-head screenshot inspection found no high-severity Work Detail geometry, hierarchy or responsive defect.

During 10A2, the cumulative visual inventory also exposed a pre-existing populated Compliance typography-floor defect (9.5–11px metadata). That defect was corrected at source to the ratified 12px floor and regression-guarded. The gate was not weakened.

10A3 — assignment, review, return and dependency is now ACTIVE.
Family B has NOT started.


### 10A3 acceptance — assignment, review, return and dependency

Accepted exact implementation head:
- `c54ad9a73088372ff24db7e4f510005b3fb641a6`.

Exact-head gates:
- CI PASS — run `36337707980`;
- Migration Replay PASS — run `36337707972`;
- Account Security PASS — run `36337707925`;
- Complete Quality Gate PASS — run `36337707987`;
- Vercel PASS.

10A3 outcomes:
- Give out work now inherits the V2 Work-family hierarchy and progressive-disclosure language;
- the seven existing work intents remain on the existing create/RPC paths;
- Manager Work now closes the review-flow continuity gap by opening Work Detail and exposing the already-authorised approve / return path there;
- review remains evidence-first and attributable, with submission note, evidence, checklist context, explicit approval and concrete return comments;
- returned state now clearly shows correction guidance and checklist points to redo;
- dependency state now clearly shows named party/unit, acknowledgement/dispute state, late-count pause wording and resolve action only for the authorised claimant;
- existing `submit_work_for_review`, `approve_work_submission`, `return_work_for_correction`, blocker and typed-work authority paths remain unchanged;
- Administration and Executive did not receive new manager review authority;
- no schema, migration, RLS, auth or RPC grant change was introduced.

Visual evidence directly inspected from exact-head Quality Gate:
- Manager assignment at 320px;
- Manager assignment at 1366×768;
- returned Staff Work Detail state;
- dependency/waiting Work Detail state;
- all show coherent V2 hierarchy with no high-severity layout defect.

Persistent exact-head evidence:
- `CEAC OS / Experience V2 / Evidence / Stage 10 / Family A / 10A3 / c54ad9a73088372ff24db7e4f510005b3fb641a6 / stage10a3-r7-exact-head-evidence.zip`.

Writer ownership:
- Codex/Work usage is exhausted;
- this Chat is now the sole active writer;
- no parallel writer should be assumed.

10A4 — Family A acceptance is now ACTIVE.
Family B has NOT started.


### 10A4 acceptance — Family A Work complete

Final accepted exact head:
- `09305e679bca08edb08881d90991f1e4b45b25c3`.

Exact-head gates:
- CI PASS — run `36339639970`;
- Migration Replay PASS — run `36339640003`;
- Account Security PASS — run `36339639976`;
- Complete Quality Gate PASS — run `36339640009`;
- 213 Playwright tests passed in approximately 10.7 minutes;
- Vercel PASS.

Final viewport proof:
- 320;
- 360;
- 375;
- 390×844 class;
- 414;
- 430;
- 900 intermediate/tablet;
- 1366×768;
- 1440×900.

All four role Work lists were directly inspected across the shared acceptance matrix. Staff Work Detail, Manager assignment, returned-work and dependency states were also directly inspected. No unresolved high-severity Work-family defect remains.

Final acceptance record:
- `docs/experience-v2/STAGE10_FAMILY_A_ACCEPTANCE_RECORD.md`.

Persistent final evidence:
- `CEAC OS / Experience V2 / Evidence / Stage 10 / Family A / Final / 09305e679bca08edb08881d90991f1e4b45b25c3 / stage10-family-a-final-r7.zip`.

Stage 10 Family A — Work is ACCEPTED AND COMPLETE.

## Stage 10 Family B active work

Family B — People/Team is ACTIVE.

10B1 audit/contract: COMPLETE.
10B2 Staff Team: ACCEPTED on engineering + visual evidence.
10B3 Manager Team: ACCEPTED on engineering + visual evidence.
10B4 Manager Person workspace: ACTIVE.

Canonical family scope:
- Staff Team;
- Manager Team;
- Manager Person workspace;
- Administration People / employee workspace.

10B2 accepted implementation head:
- `bee47248aad438359599af3821ae4f2dc347ba79`.

10B2 exact-head verification:
- CI PASS — run `36341805409`;
- Migration Replay PASS — run `36341805419`;
- Account Security PASS — run `36341805416`;
- Complete Quality Gate PASS — run `36341805405`;
- exact-head Staff Team evidence directly inspected at 320×844, 390×844, 1366×768 and 1440×900;
- no page-level overflow, sub-12px operational text or high-severity hierarchy defect observed;
- Staff Team remains unit-scoped and retains the existing Unit Room, approved leave, recent joiner, leadership, birthday and unit-resource authority paths;
- no direct-message feature, manager-only evidence, protected HR data, schema, RLS, RPC or auth expansion was introduced.

Persistent 10B2 evidence:
- `CEAC OS / Experience V2 / Evidence / Stage 10 / Family B / 10B2 / bee47248aad438359599af3821ae4f2dc347ba79 / stage10b2-r7-exact-head-evidence.zip`.

Deployment note:
- Vercel did not run for this head because the connected free project exceeded its 100-deployments-per-day limit;
- this is an external deployment-rate limit, not an application build failure;
- Family B final acceptance remains blocked on an exact-head Vercel deployment once that limit opens.

Protected rules for Family B:
- factual people/work/activity evidence must not become productivity scores or rankings;
- private work must remain private;
- Administration HR authority must not leak into Staff/Manager surfaces;
- Manager unit scope must remain unit-scoped;
- Staff Team remains a collaboration/availability surface, not a personnel file;
- payroll remains blocked;
- no schema/RLS/RPC/auth change is presumed;
- Chat is the sole active writer.


### 10B3 accepted — Manager Team

Manager Team is accepted on exact-head engineering and visual evidence. Manager Person workspace is now the only active Family B product migration.

10B3 must preserve:
- unit-scoped people membership;
- private-work exclusion;
- factual presence/session/submission/current-work context;
- current completed/overdue/awaiting/submitted derivations without scoring or ranking;
- Person workspace focus links;
- invitations;
- sub-team add/rename/reorder/removal with attached-work reassignment protection;
- unit resources and Unit Room;
- Give out work preselection by sub-team.

Presentation target:
- unit identity and coordination first;
- factual people context and people rows before secondary setup;
- team setup/resources visually secondary;
- factual evidence buttons remain drill-downs, never productivity judgments.

10B4 — Manager Person workspace is ACTIVE.
10B5 has NOT started.
10B6 has NOT started.
Family C has NOT started.


### 10B3 acceptance — Manager Team

Accepted exact implementation head:
- `847c3b2a16253016000d38d6d0a8e14cd92d1383`.

Exact-head engineering gates:
- CI PASS — run `36342903715`;
- Migration Replay PASS — run `36342903673`;
- Account Security PASS — run `36342903628`;
- Complete Quality Gate PASS — run `36342903685`.

Deployment status:
- Vercel did not run because the connected free project is still over its 100-deployments-per-day allowance;
- this is the same external deployment-rate limit already recorded for 10B2, not an application build failure;
- Family B final acceptance remains blocked until an exact-head Vercel deployment can run successfully.

10B3 outcomes:
- Manager Team now uses the shared People/Team V2 family language;
- unit identity, Unit Room and normal people context now precede setup/resource administration;
- people rows expose factual presence, current-work and evidence context without introducing a score or ranking;
- the five evidence drill-downs remain operational facts: recorded days, completed outcomes, overdue, awaiting review and submitted;
- the existing unit-scoped Person workspace is still the drill-in destination;
- private work remains excluded;
- sub-team setup, safe attached-work reassignment, invitations, unit resources and Give out work preselection remain on the existing authority paths;
- no schema, RLS, RPC, auth or role-authority change was introduced.

Exact-head visual proof directly inspected:
- 320×844;
- 390×844;
- 1366×768;
- 1440×900.

Observed full-page phone screenshots show the fixed bottom navigation crossing the long captured document. This is the existing full-page screenshot behaviour, not viewport overflow.

No unresolved high-severity Manager Team hierarchy, overflow, typography or authority defect was found.

Persistent exact-head evidence:
- `CEAC OS / Experience V2 / Evidence / Stage 10 / Family B / 10B3 / 847c3b2a16253016000d38d6d0a8e14cd92d1383 / stage10b3-r7-exact-head-evidence.zip`.

10B4 — Manager Person workspace is ACCEPTED AND COMPLETE.
10B5 — Administration People / employee workspace is ACTIVE at audit/contract.
10B6 has NOT started.
Family C has NOT started.


### 10B4 acceptance — Manager Person workspace

Accepted exact implementation head:
- `8817477f1eec19a36eb951999c129a2a8a1f8438`.

Exact-head gates:
- CI PASS — run `36345097892`;
- Migration Replay PASS — run `36345097900`;
- Account Security PASS — run `36345097911`;
- Complete Quality Gate PASS — run `36345097956`;
- 234 Playwright tests passed;
- Vercel PASS.

Exact-head Manager Person proof directly inspected:
- 320×844;
- approximately 390×844;
- 1366×768;
- 1440×900.

Accepted Manager Person hierarchy:
- identity and current unit/role context;
- current responsibilities;
- recent outcomes;
- submissions;
- projects/objectives;
- factual activity/session context;
- attributable visible feedback.

Authority/trust confirmation:
- Manager Person remains unit-scoped;
- private work remains excluded;
- session/work evidence remains factual context and explicitly non-scoring;
- visible feedback remains attributable and visible to the staff member;
- no private manager notes;
- no Administration/HR authority leaked into Manager;
- no payroll/protected-HR authority was introduced;
- no schema, migration, RLS, RPC definition or auth file changed in 10B4.

Deterministic Administration phone-width evidence passed at:
- 320;
- 360;
- 375;
- 390;
- 414;
- 430.

Persistent exact-head evidence:
- `CEAC OS / Experience V2 / Evidence / Stage 10 / Family B / 10B4 / 8817477f1eec19a36eb951999c129a2a8a1f8438 / stage10b4-r7-exact-head-evidence.zip`.

Acceptance record:
- `docs/experience-v2/STAGE10_FAMILY_B_10B4_ACCEPTANCE_RECORD.md`.

10B4 is ACCEPTED AND COMPLETE.
10B5 has NOT started.
10B6 has NOT started.
Family C has NOT started.
Chat remains the sole active writer.


## Stage 10 Family B — 10B5 active work

10B5 — Administration People / employee workspace is now ACTIVE.

Work brief:
- `docs/experience-v2/STAGE10_FAMILY_B_10B5_WORK_BRIEF.md`.

10B5 entry contract:
- preserve `admin_people_summary`;
- preserve `admin_person_detail`;
- preserve `admin_employment_detail`;
- preserve `admin_update_employment`;
- preserve `people.manage` capability boundary;
- preserve invitations/role/capability boundaries already enforced elsewhere in Administration;
- preserve effective-date/change-type/reason/correction employment semantics;
- preserve protected-HR boundaries;
- preserve payroll block;
- presentation/interaction migration only unless a concrete defect proves otherwise.

Current 10B5 status:
- 10B5A — Administration People directory ACCEPTED;
- 10B5B — Administration employee workspace ACCEPTED;
- 10B5C — Administration People acceptance ACCEPTED;
- 10B5 — ACCEPTED AND COMPLETE;
- 10B6 — Family B final acceptance ACCEPTED AND COMPLETE;
- Family C has NOT started;
- Chat is the sole active writer.

Acceptance-checkpoint note:
- 10B4 accepted implementation head `8817477f1eec19a36eb951999c129a2a8a1f8438` is exact-head green across CI, Migration Replay, Account Security, full Quality Gate and Vercel;
- documentation-only acceptance checkpoint subsequently hit the external Vercel free-plan deployment-rate limit; this is not an application-code failure.


### 10B5A acceptance — Administration People directory

Accepted implementation head:
- `08db5ba98a7275a974d674ad925409ac364faf6c`.

Exact-head engineering gates:
- CI PASS — run `36347415728`;
- Migration Replay PASS — run `36347415738`;
- Account Security PASS — run `36347415760`;
- Complete Quality Gate PASS — run `36347415796`.

Deployment status:
- Vercel is blocked by the connected free project's external 100-deployments-per-day limit;
- this is not an application build failure;
- Family B final acceptance remains blocked until an exact-head Vercel deployment can run successfully.

10B5A outcomes:
- Administration People directory now uses the shared Experience V2 People-family language;
- `admin_people_summary`, `admin_person_detail`, `admin_employment_detail` and `admin_update_employment` authority paths remain present and unchanged;
- People directory search and factual filters remain intact;
- people remain grouped by unit;
- employee identity, role, unit and state are primary;
- open/finished work and no-submission context remain secondary factual evidence and are explicitly non-scoring;
- no payroll, bank, identifier, contract or payslip data was invented;
- no schema, migration, RLS, RPC or auth change was introduced.

Exact-head visual proof directly inspected:
- 320×844;
- approximately 390×844;
- 1366×768;
- 1440×900.

Observed phone full-page screenshots show the fixed bottom navigation crossing the captured long document. This is the existing full-page capture behaviour, not page-level overflow.

No unresolved high-severity 10B5A hierarchy, typography, overflow or authority defect was found.

Persistent exact-head evidence:
- `CEAC OS / Experience V2 / Evidence / Stage 10 / Family B / 10B5A / 08db5ba98a7275a974d674ad925409ac364faf6c / stage10b5a-r7-exact-head-evidence.zip`.

10B5B — Administration employee workspace is ACCEPTED.
10B5C — Administration People acceptance is ACTIVE.
10B6 has NOT started.
Family C has NOT started.


### 10B5B acceptance — Administration employee workspace

Accepted exact implementation head:
- `aaeb209e277a21366f254a25c4f245d5a66d3dd2`.

Exact-head engineering gates:
- CI PASS — run `36349010636`;
- Migration Replay PASS — run `36349010698`;
- Account Security PASS — run `36349010691`;
- Complete Quality Gate PASS — run `36349010714`;
- 245 Playwright tests passed.

Deployment status:
- Vercel is still blocked by the connected free project's external 100-deployments-per-day limit;
- this is not an application build failure;
- Family B final acceptance remains blocked until an exact-head Vercel deployment can run successfully.

10B5B outcomes:
- employee detail now uses the shared V2 People workspace hierarchy;
- identity/employment state, employment record, audited history, factual work/activity, leave and protected-HR readiness are ordered deliberately;
- existing `admin_person_detail`, `admin_employment_detail` and `admin_update_employment` paths remain unchanged;
- employment changes still preserve effective date, change type, reason, correction linkage and historical snapshots;
- work/session context is explicitly non-scoring and excluded from pay or disciplinary inference;
- protected-HR placeholders remain policy-gated; salary, bank, identifiers, contracts and payslips are not invented;
- Stage 13 Payroll remains blocked;
- no schema, migration, RLS, RPC definition or auth change was introduced.

Exact-head visual proof directly inspected:
- 320×844;
- approximately 390×844;
- 1366×768;
- 1440×900;
- employment-change editor with correction workflow.

No unresolved high-severity hierarchy, overflow, typography, touch-target or protected-HR boundary defect was found.

Persistent exact-head evidence:
- `CEAC OS / Experience V2 / Evidence / Stage 10 / Family B / 10B5B / aaeb209e277a21366f254a25c4f245d5a66d3dd2 / stage10b5b-r7-exact-head-evidence.zip`.

10B5C — Administration People acceptance is ACTIVE.
10B6 has NOT started.
Family C has NOT started.


## Stage 10 Family B final acceptance

Stage 10 Family B — People / Team is ACCEPTED AND COMPLETE.

Exact accepted Family B head:
- `2efd54803789ed0d8f92bb700c034149debc5e88`.

Exact-head gates:
- CI PASS — run `36351269890`;
- Migration Replay PASS — run `36351269898`;
- Account Security PASS — run `36351269929`;
- Complete Quality Gate PASS — run `36351269909`;
- 251 Playwright tests passed;
- Vercel PASS — exact-head deployment `2pZ9DVYqrVrspKkvBj35vvKnHqWX`.

Accepted Family B surfaces:
- 10B2 Staff Team;
- 10B3 Manager Team;
- 10B4 Manager Person workspace;
- 10B5 Administration People / employee workspace.

Trust boundaries preserved:
- no productivity score, ranking or inferred performance grade;
- Staff Team remains collaboration/availability context, not a personnel file;
- Manager Team and Manager Person remain unit-scoped;
- private work remains excluded from Manager people evidence;
- feedback remains attributable and visible; no private manager notes;
- Administration employment authority remains behind `people.manage`;
- protected-HR boundaries remain intact;
- Stage 13 Payroll remains blocked;
- no schema, migration, RLS, RPC definition, auth or capability change was introduced by Family B.

Responsive acceptance covers:
- 320;
- 360;
- 375;
- approximately 390×844;
- 414;
- 430;
- representative tablet/intermediate width;
- 1366×768;
- 1440×900.

Persistent final technical/visual evidence:
- `CEAC OS / Experience V2 / Evidence / Stage 10 / Family B / Final / 97370ae1f3d58bf10b616907907229fc9d79201e / stage10-family-b-technical-final-r7.zip`.

Family B acceptance record:
- `docs/experience-v2/STAGE10_FAMILY_B_ACCEPTANCE_RECORD.md`.

Closure documentation commits after the accepted head change documentation only; they do not alter the accepted runtime implementation or reopen the Family B product gate.

Family C — Projects / Portfolio has NOT started.

Next safe action:
1. inspect the live exact branch head and current checks;
2. read the canonical Stage 10 Family C sequence and current Projects/Portfolio authority/data paths;
3. persist the Family C work brief before changing Projects/Portfolio product code;
4. keep PR #72 OPEN + DRAFT and PR #71 frozen.


## Stage 10 Family C active work

Family C — Projects / Portfolio is ACTIVE at 10C1 audit/contract.

Work brief:
- `docs/experience-v2/STAGE10_FAMILY_C_WORK_BRIEF.md`.

Family C entry audit confirms:
- Manager Projects is the unit operating workspace and enforces current-unit lead/participant scope;
- Administration Projects is organisation delivery context and does not currently expose Manager project-edit controls;
- Executive Portfolio is the `Delivery.jsx` surface and already stores explicit health/priority, programme/portfolio links, milestones, risks/issues and dependencies without hidden scoring;
- project close/reopen history and project participant/payment/custody/remittance registers are mature audited domain flows and are protected from presentation-driven rewrites;
- current project/work queries exclude private work where applicable;
- no schema, migration, RLS, RPC definition or auth change is presumed.

Current documentation-only entry head:
- `442abd8b69e7e97c52e58f12382695c47eff87c0`;
- CI PASS;
- Migration Replay PASS;
- Account Security PASS;
- complete Quality Gate PASS;
- Vercel currently blocked by the connected free-project deployment-rate limit only.

10C1 — audit and contract is ACCEPTED.

10C2 — Manager Projects + project workspace is ACTIVE.

Current 10C2 implementation:
- shared V2 Project-family presentation primitives added under `src/experience-v2/project-family/`;
- Manager Projects list migrated to the shared project row/header/state language;
- Manager project detail now uses the shared project workspace header/navigation shell;
- existing proposal approval, project creation, objective management, Work hand-off, collaboration, participant register and close/reopen logic remains on the existing domain paths;
- deterministic 320 / 390 / 1366 / 1440 Manager Projects and 320 / 1366 project-workspace regression proof has been added;
- no schema, migration, RLS, RPC definition or auth change has been introduced.

10C2 — Manager Projects + project workspace is ACCEPTED.

Accepted exact implementation head:
- `e9353015a394fee9d762fc4659f032165fb5d8b1`.

Exact-head gates:
- CI PASS — run `36354614444`;
- Migration Replay PASS — run `36354614499`;
- Account Security PASS — run `36354614549`;
- Complete Quality Gate PASS — run `36354614523`;
- 258 Playwright tests passed.

Deployment status:
- Vercel is currently blocked by the connected free project's external 100-deployments-per-day limit;
- this is not an application build failure;
- Family C final acceptance remains blocked until an exact-head Vercel deployment succeeds.

10C2 outcomes:
- shared V2 Project-family presentation primitives are established;
- Manager Projects list now uses one V2 project identity/state language;
- project proposals remain on the existing Unit Head decision path;
- project workspace now has a coherent V2 identity/header and deliberate workspace tabs for Overview, Work, Objectives, Register, Collaboration and Close & record;
- existing project creation, objective management, project Work hand-off, participant register and close/reopen logic remain unchanged;
- current-unit lead/participant scope remains intact;
- private project work remains excluded;
- no schema, migration, RLS, RPC definition or auth change was introduced.

Exact-head visual proof directly inspected:
- Manager Projects 320×844;
- Manager Projects approximately 390×844;
- Manager Projects 1366×768;
- Manager Projects 1440×900;
- project workspace 320×844;
- project workspace 1366×768.

Observed full-page phone screenshots show the existing fixed bottom navigation crossing the captured long document; there is no page-level horizontal overflow and this is not a workspace-layout defect.

No unresolved high-severity 10C2 hierarchy, typography, overflow, touch-target or authority defect was found.

Persistent exact-head evidence:
- `CEAC OS / Experience V2 / Evidence / Stage 10 / Family C / 10C2 / e9353015a394fee9d762fc4659f032165fb5d8b1 / stage10c2-r7-exact-head-evidence.zip`.

10C3 — Administration Projects is ACCEPTED AND COMPLETE.

Accepted exact implementation head:
- `90aba31498c24003751c5719e0d94a63b8da4324`.

Exact-head gates:
- CI PASS — run `36371055991`;
- Migration Replay PASS — run `36371056001`;
- Account Security PASS — run `36371055958`;
- Complete Quality Gate PASS — run `36371055976`;
- 268 Playwright tests passed;
- Vercel PASS.

10C3 outcomes:
- Administration Projects now visibly belongs to the shared Experience V2 Project family;
- organisation project identity, state, lead unit, participating-unit context and objective movement use one deliberate scan pattern;
- project meeting scheduling remains available as the existing contextual action;
- Administration remains read/context oriented and does not gain Manager project creation, proposal decision, objective editing, register, close/reopen or other Manager-only project controls;
- no schema, migration, RLS, RPC definition, auth or capability change was introduced.

Responsive proof covers:
- 320×844;
- 360×800;
- 375×812;
- approximately 390×844;
- 414×896;
- 430×932;
- 900×900;
- 1366×768;
- 1440×900.

The first two Quality Gate attempts on parent head `7d1bd532628d84a1c0fc10842b6adc3484214c48` each exposed the same pre-existing asynchronous-readiness issue in the already accepted 10C2 Manager Projects viewport test: the test asserted project rows immediately after the page shell appeared, before the project list had necessarily finished loading. The application data path was not changed. The acceptance helper now waits for the existing loaded `Unit delivery` state before applying the unchanged non-empty-row assertion. No timeout, retry, skip or assertion weakening was introduced.

Exact-head rendered evidence was directly inspected across the full 10C3 viewport matrix. No unresolved high-severity hierarchy, overflow, typography, touch-target or authority issue was found.

Persistent exact-head evidence:
- `CEAC OS / Experience V2 / Evidence / Stage 10 / Family C / 10C3 / 90aba31498c24003751c5719e0d94a63b8da4324 / stage10c3-r7-exact-head-evidence.zip`.

10C3 acceptance record:
- `docs/experience-v2/STAGE10_FAMILY_C_10C3_ACCEPTANCE_RECORD.md`.

10C4 — Executive Portfolio / Delivery is now ACTIVE.
10C5 has NOT started.
Family D has NOT started.
Chat is the sole active writer.


### 10C4 acceptance — Executive Portfolio / Delivery

10C4 — Executive Portfolio / Delivery is ACCEPTED AND COMPLETE.

Accepted exact implementation head:
- `a99f6add6ef7dd0a32e12b40bb14c3917533589f`.

Exact-head gates:
- CI PASS — run `36374879190`;
- Migration Replay PASS — run `36374879069`;
- Account Security PASS — run `36374879055`;
- Complete Quality Gate PASS — run `36374878986`;
- 278 Playwright tests passed;
- Vercel PASS — exact-head deployment `EtLcEadjuPqty2X9FLZeTXQeqr5h`.

10C4 outcomes:
- Executive Portfolio now uses the shared Experience V2 Project-family hierarchy;
- portfolio briefing and factual recorded attention precede programme structure and detailed project controls;
- attention uses only explicit Watch / At risk / Blocked health or open high / critical register items;
- selected-project, programme/portfolio, milestone, risk/issue, participant-register and dependency context remain on the existing data and authority paths;
- explicit priority/health, sponsor/owner and change-reason semantics remain intact;
- participant-register actions recompose into practical 44px controls on narrow phones;
- no hidden scoring, probability, ranking, schema, migration, RLS, RPC definition, auth or capability change was introduced.

Responsive proof covers:
- 320×844;
- 360×800;
- 375×812;
- approximately 390×844;
- 414×896;
- 430×932;
- 900×900;
- 1366×768;
- 1440×900.

Exact-head rendered evidence was directly inspected. No unresolved high-severity 10C4 hierarchy, typography, overflow, touch-target, authority or hidden-scoring defect remains.

Persistent evidence:
- `CEAC OS / Experience V2 / Evidence / Stage 10 / Family C / 10C4 / a99f6add6ef7dd0a32e12b40bb14c3917533589f / stage10c4-a99-r7-exact-head-evidence.zip`.

Acceptance record:
- `docs/experience-v2/STAGE10_FAMILY_C_10C4_ACCEPTANCE_RECORD.md`.

10C5 — Family C final acceptance is ACCEPTED AND COMPLETE.
Family D has NOT started; it is the next family after this documentation head is exact-head green.
Chat is the sole active writer.

## Stage 10 Family C final acceptance

Stage 10 Family C — Projects / Portfolio is ACCEPTED AND COMPLETE.

Exact accepted Family C head:
- `4b10e4f54981d996a164f9024ab37ecbf2806e09`.

Exact-head gates:
- CI PASS — run `36376143438`;
- Migration Replay PASS — run `36376143557`;
- Account Security PASS — run `36376143534`;
- Complete Quality Gate PASS — run `36376143593`;
- 278 Playwright tests passed in 12.7 minutes;
- Vercel PASS on the exact head.

Accepted Family C surfaces:
- Manager Projects list and project workspace;
- Administration Projects;
- Executive Portfolio / Delivery.

Family-level authority and trust checks:
- Family C changed no Supabase migration, RLS policy, RPC definition, authentication configuration or capability grant;
- Manager project visibility remains current-unit lead/participant scoped and private work remains excluded;
- Administration Projects remains contextual/read-only apart from the existing project-meeting action;
- Executive Portfolio remains on the existing `delivery.manage`, Executive/Administration and managed lead-unit authority paths;
- Executive attention remains factual and uses explicit stored health/register state only; no hidden score, probability or ranking was introduced.

Protected project-register verification:
- the Experience Stage 5 project-register SQL gate passed on the accepted head;
- the complete Quality Gate passed the existing end-to-end register journey for participant, payment, slot, custody and two-sided remittance behaviour;
- payment reversals remain append-only, slot allocation remains payment/capacity guarded, custody remains attributable and receiving-unit confirmation remains on the existing finance record.

Protected project-close verification:
- `ManagerProjectClose.jsx` is unchanged from the Family C entry head;
- `project_close_readiness`, `save_and_submit_project_close`, `close_project` and `reopen_project` remain on their existing RPC paths;
- unit returns, objective outcomes/notes, deliverables, factual cost snapshots, challenges and next-time learning remain in the close record;
- reopen still requires a reason and prior submitted close versions remain visible and unchanged;
- missing cost values and unfiled unit returns remain explicitly recorded rather than silently treated as zero.

Responsive and visual proof:
- Manager Projects: 320×844, approximately 390×844, 1366×768 and 1440×900;
- Manager project workspace: 320×844 and 1366×768;
- Administration Projects: 320×844, 360×800, 375×812, approximately 390×844, 414×896, 430×932, 900×900, 1366×768 and 1440×900;
- Executive Portfolio: the same full 320 / 360 / 375 / 390 / 414 / 430 / 900 / 1366 / 1440 matrix.

The exact-head R7 artifact was directly inspected. No unresolved high-severity Family C hierarchy, typography, overflow, touch-target, authority, register-presentation or hidden-scoring defect remains. Full-page phone captures can show the fixed bottom navigation crossing the long captured document; this is the established capture behaviour rather than page-level horizontal overflow.

Persistent evidence:
- `CEAC OS / Experience V2 / Evidence / Stage 10 / Family C / 10C2 / e9353015a394fee9d762fc4659f032165fb5d8b1 / stage10c2-r7-exact-head-evidence.zip`;
- `CEAC OS / Experience V2 / Evidence / Stage 10 / Family C / 10C3 / 90aba31498c24003751c5719e0d94a63b8da4324 / stage10c3-r7-exact-head-evidence.zip`;
- `CEAC OS / Experience V2 / Evidence / Stage 10 / Family C / 10C4 / a99f6add6ef7dd0a32e12b40bb14c3917533589f / stage10c4-a99-r7-exact-head-evidence.zip`;
- `CEAC OS / Experience V2 / Evidence / Stage 10 / Family C / Final / 4b10e4f54981d996a164f9024ab37ecbf2806e09 / stage10-family-c-final-r7.zip`.

The previously missing Drive persistence for the accepted 10C2 and 10C4 evidence was repaired during 10C5 without changing application code.

Acceptance record:
- `docs/experience-v2/STAGE10_FAMILY_C_ACCEPTANCE_RECORD.md`.

Family C documentation/acceptance head `06b081d66c49b06aa6d78983069939e4fa4fbdc1` is exact-head green:
- CI PASS — run `36377664199`;
- Migration Replay PASS — run `36377664190`;
- Account Security PASS — run `36377664191`;
- Complete Quality Gate PASS — run `36377664171`;
- 278 Playwright tests passed in 9.0 minutes;
- Vercel PASS.

Family D — Time & Leave / Workforce is now OPEN at 10D1 audit and contract.
Family E has NOT started.
Chat is the sole active writer.

## Stage 10 Family D progress

10D1 — Time & Leave / Workforce audit and contract is ACCEPTED AND COMPLETE.

Contract:
- `docs/experience-v2/STAGE10_FAMILY_D_WORK_BRIEF.md`.

Exact D1 entry/contract head:
- `597c7a5d8e0e0ff93ec8b8d5cc2684c77b68cd05`.

10D1 exact-head status before product-code migration:
- CI PASS — run `36378721096`;
- Migration Replay PASS — run `36378721157`;
- Account Security PASS — run `36378721003`;
- Complete Quality Gate PASS — run `36378720988`;
- Vercel PASS.

10D2 — Staff Time & Leave is now ACTIVE.

This implementation tranche:
- introduces the shared V2 Workforce-family presentation layer under `src/experience-v2/workforce-family/`;
- migrates only the Staff personal Workforce composition first;
- preserves the existing `Workforce` heading required by the cumulative Stage 9 acceptance while making the page character explicitly “My time & leave”;
- preserves Staff self-only data/RLS, existing My Hub leave request/cancel flow, Stage 9 tables and reviewed RPC paths;
- presents Today, seven-day personal context, sessions, recorded differences, leave history and correction history without absence/performance inference;
- raises Staff operational presentation to the V2 12px text floor and 44px tab target floor;
- changes no schema, migration, RLS, RPC definition, auth or capability grant;
- leaves Manager and Administration Workforce presentation on their current paths for 10D3 and 10D4.

10D2 — Staff Time & Leave is ACCEPTED AND COMPLETE.

Exact accepted D2 head:
- `4be9866e77593065d709c284dd05278be2018f70`.

Exact-head gates:
- CI PASS — run `36380977271`;
- Migration Replay PASS — run `36380977226`;
- Account Security PASS — run `36380977225`;
- Complete Quality Gate PASS — run `36380977272`;
- 288 Playwright tests passed in 9.3 minutes;
- Vercel PASS.

Accepted Staff behaviour:
- Staff remains self-scoped through the existing Stage 9 RLS/domain rules;
- My Hub remains the leave request/cancel entry; Workforce does not duplicate mutation authority;
- Today, My week, Sessions, Recorded differences, Leave and Corrections present factual personal context;
- “No session recorded” remains descriptive context and is not converted to absence, lateness, underwork or performance judgement;
- unconfigured leave policy continues to suppress invented entitlement/accrual/carry-over/balance figures;
- no schema, migration, RLS, RPC definition, authentication or capability change was introduced.

Responsive proof directly inspected:
- 320×844;
- 360×800;
- 375×812;
- approximately 390×844;
- 414×896;
- 430×932;
- 900×900;
- 1366×768;
- 1440×900.

The V2 Staff page meets the 12px operational text floor, 44px tab target floor and page-level no-horizontal-overflow gate. The full-page phone captures show the fixed bottom navigation crossing the long captured document; this is the established screenshot-capture behaviour, not page overflow.

Persistent evidence:
- `CEAC OS / Experience V2 / Evidence / Stage 10 / Family D / 10D2 / 4be9866e77593065d709c284dd05278be2018f70 / stage10d2-4be-r7-exact-head-evidence.zip`.

Acceptance record:
- `docs/experience-v2/STAGE10_FAMILY_D_10D2_ACCEPTANCE_RECORD.md`.

10D3 — Manager Workforce context is now ACTIVE.
10D4 Administration and 10D5 Family D final acceptance have NOT started.
Family E has NOT started.
Chat is the sole active writer.
