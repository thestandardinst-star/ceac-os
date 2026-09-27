# CEAC OS Experience V2 — Build State

Last updated: 27 September 2026

## Current programme state

Programme: Experience V2
Status: ACTIVE
Current stage: Stage 9 — Keystone Quality Gate and System Ratification (ACTIVE)
Current substage: Stage 9C — technical ratification complete; product-owner acceptance pending

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

The user has explicitly ended Codex/Work writer ownership because Work usage is exhausted. This Chat is the sole active writer at this checkpoint.

Stage 8 — Executive Overview is accepted and complete.

Accepted exact implementation SHA:
- `6b555613bde7f2d9b257f9c417af1cc11514a81a`

Acceptance:
- CI PASS;
- Migration Replay PASS;
- Account Security PASS;
- Complete Quality Gate PASS, run `36313554437`;
- 179 Playwright role/acceptance tests passed;
- Vercel PASS;
- direct visual inspection completed at 320px, 390×844, 1366×768 and 1440×900;
- acceptance record: `docs/experience-v2/STAGE8_ACCEPTANCE_RECORD.md`;
- persistent evidence: `CEAC OS / Experience V2 / Evidence / Stage 8 / 6b555613bde7f2d9b257f9c417af1cc11514a81a / stage8-r7-exact-head-evidence.zip`.

Stage 9 has not started.

Exact next safe action:
- inspect the live PR #72 HEAD and checks before any further edit;
- read `docs/experience-v2/START_HERE.md`, this file, `IMPLEMENTATION_SEQUENCE.md`, `CEAC_OS_EXPERIENCE_V2_SOURCE_OF_TRUTH.md`, `ACCEPTANCE_AND_HANDOFF.md` and `AGENTS.md`;
- begin Stage 9 only as the keystone quality gate/system ratification defined by the canonical sequence;
- do not reopen or rewrite accepted Stage 5–8 keystones unless Stage 9 finds a concrete cross-keystone defect;
- keep PR #72 open and draft;
- do not merge PR #72 yet.

Protected boundaries remain unchanged:
- PR #71 stays frozen and untouched;
- Stage 13 Payroll remains blocked pending confirmed CEAC rules;
- no security/RLS/RPC/auth weakening;
- no invented data;
- one active writer only.

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

Remaining Stage 9 exit condition:
- explicit product-owner acceptance of the four-keystone quality direction.

Stage 10 has NOT started and remains blocked until that acceptance.
