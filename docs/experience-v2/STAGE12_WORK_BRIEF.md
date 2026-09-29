# CEAC OS Experience V2 — Stage 12 Motion and Interaction Quality Work Brief

Date: 29 September 2026
Status: ACTIVE CONTRACT
Stage: 12 — Motion and Interaction Quality

## 1. Purpose

Stage 12 adds interaction continuity after Experience V2 geometry is stable.

Motion is not decoration. It must explain:
- what changed;
- where an element came from;
- which state is selected;
- which surface opened;
- which content expanded or collapsed;
- where attention should move after an action.

Routine work must remain faster than the motion around it.

## 2. Binding sources

This work follows:
- `docs/experience-v2/CEAC_OS_EXPERIENCE_V2_SOURCE_OF_TRUTH.md`;
- `docs/experience-v2/IMPLEMENTATION_SEQUENCE.md`;
- `docs/experience-v2/ACCEPTANCE_AND_HANDOFF.md`;
- `docs/experience-v2/VERIFICATION_PROTOCOL.md`;
- `docs/experience-v2/REFERENCE_INDEX.md`;
- the persisted Library motion reference `motion_reference_original.mp4`;
- the persisted storyboard `motion_reference_storyboard.jpg`.

The reference is used for fluidity, continuity, restrained emphasis and responsive state-change principles. Its branding/content is not copied.

## 3. Existing motion foundation

The repository already contains a legitimate V2 motion base:
- `motion@^13.4.4`;
- global `ExperienceV2MotionProvider` with `MotionConfig reducedMotion="user"`;
- `src/experience-v2/motion.js`;
- CSS timing/easing tokens in `src/experience-v2.css`.

Existing timing:
- press: 120ms;
- fast: 160ms;
- standard: 220ms;
- surface: 280ms;
- complex: 320ms;
- standard/enter/exit cubic-bezier curves;
- one layout spring for reflow.

Existing V2 motion already covers:
- Tooltip enter/exit;
- PopoverMenu enter/exit;
- V2 Modal/Drawer backdrop and panel motion;
- Toast enter/exit;
- button/control press feedback;
- reduced-motion duration collapse in CSS;
- skeleton animation reduced-motion fallback.

Stage 12 must extend this system rather than introduce a competing library or local timing vocabulary.

## 4. Current interaction gaps

### Segmented controls
`SegmentedControl` changes selected tabs through background redraw only.

Required:
- one shared moving selection indicator;
- no layout jump;
- native button semantics remain;
- horizontal-scroll behaviour remains on phones;
- reduced motion becomes effectively instantaneous.

### Calendar selection and period change
Stage 11 calendar state is correct but selected date/period changes redraw abruptly.

Required:
- selected-date continuity;
- selected agenda relationship;
- period label transition;
- no animation that delays date activation or event opening;
- no invented calendar state.

### Expand/collapse
Several accepted surfaces reveal contextual analysis/details abruptly.

Required:
- shared height/opacity reflow for deliberate disclosure where content already exists;
- hidden content must not remain focusable;
- no scroll hijacking.

### Overlays / drawers / sheets
V2 Modal/Drawer already has correct motion and focus management.

The older shared `Sheet` remains widely used by accepted operational screens and is still a visible interaction surface.

Stage 12 rule:
- do not rewrite its data/action owners;
- align its entrance/backdrop motion with V2 timing where safe;
- preserve Escape, focus trapping, focus restoration and backdrop-close behaviour;
- do not delay action completion simply to play an exit animation.

### State-change feedback
Success/error/loading state changes must retain truthful semantics.

Required:
- subtle enter/reflow treatment only where it improves attention;
- no animation that hides errors, permission limits or loading truth.

## 5. Protected boundaries

Stage 12 must not:
- change role/capability authority;
- change Supabase query/RPC/RLS behaviour;
- change schema or migrations;
- invent state for animation;
- animate a disabled/unauthorised action into appearing available;
- delay ordinary actions behind decorative sequences;
- add scroll-jacking or route-transition blocking;
- add a second motion library;
- increase `!important` debt;
- create a new global parity/override stylesheet;
- animate large page regions continuously;
- rely on animation as the only indication of state.

Reduced-motion users must retain the same functional state changes without required movement.

## 6. Stage 12 implementation sequence

### 12A — Audit and motion contract

This document.

Acceptance:
- repository motion tokens/provider/component behaviour mapped;
- stored motion reference inspected;
- gaps and shared implementation order persisted;
- no product code changes.

### 12B — Shared motion primitives

Implement at the shared V2 layer:
1. moving selected indicator for `SegmentedControl`;
2. reusable disclosure/reflow primitive for existing conditional content;
3. calendar selected-date/period continuity hooks using the same V2 transitions;
4. shared state/reveal treatment where required;
5. complete reduced-motion behaviour.

Do not change screen authority or data.

Acceptance:
- source/component tests;
- keyboard/focus tests;
- reduced-motion tests;
- responsive proof;
- exact-head Level B before 12C.

### 12C — Apply motion to accepted high-value flows

Apply shared behaviour to existing accepted surfaces only where motion clarifies continuity:
- Calendar month/week filters and selected date;
- Manager Reports analysis disclosure;
- representative V2 tabs/segments across roles;
- V2 drawers/modals/popovers/toasts;
- selected operational expand/collapse surfaces using existing content;
- legacy shared Sheet entrance/backdrop only if it can be aligned without weakening focus/action behaviour.

Do not animate every card or page.

Acceptance:
- no route/action regression;
- interruptible interaction;
- keyboard/touch coverage;
- reduced-motion equivalent;
- phone/laptop evidence;
- exact-head Level B.

### 12D — Stage 12 final acceptance

Inspect:
- selected segmented state continuity;
- calendar date/period movement;
- expand/collapse;
- overlay/drawer/sheet behaviour;
- success/error feedback;
- reduced motion;
- phone and laptop responsiveness.

Record exact application SHA, CI, Migration Replay, Account Security, complete Quality Gate, Vercel and product evidence.

Only then open Stage 13 — Visual Assets and Media.

## 7. Quality rules

Motion should usually use:
- press/hover: 120–160ms;
- small state change: 160–220ms;
- surface/overlay: 220–280ms;
- complex reflow only when necessary: up to 320ms or the ratified layout spring.

Avoid:
- long staggered entrances;
- bouncing controls;
- large parallax;
- constant ambient movement;
- animation that obscures dense operational reading;
- route transitions that make navigation feel slower.

## 8. Exit definition

Stage 12 is complete only when:
- shared selected-state movement exists instead of abrupt redraw where appropriate;
- calendar selection/period changes feel continuous;
- accepted disclosure flows reflow cleanly;
- overlays retain correct focus/escape semantics with coherent motion;
- motion remains interruptible and fast;
- reduced-motion behaviour is verified;
- no functional/security/authority behaviour changed;
- exact-head Level B and Vercel pass;
- direct product inspection passes;
- Stage 12 acceptance and BUILD_STATE are current.
