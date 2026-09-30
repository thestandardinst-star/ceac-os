# CEAC OS Experience V2 — Motion Implementation Contract

Date: 26 September 2026
Status: BINDING FOR STAGE 2+

## Purpose

Create one motion language that gives CEAC the spatial continuity and polish shown in the stored reference video without making routine work slow or decorative.

Production library:
`motion`, imported from `motion/react`.

Do not use Motion+ or another animation library.

## Implementation paths

- `src/experience-v2/motion.js` — shared motion constants/helpers.
- `src/experience-v2/ExperienceV2MotionProvider.jsx` — central MotionConfig wrapper.

## Provider rule

Use MotionConfig with user reduced-motion preference respected.

The provider may wrap the application globally because it only governs Motion components; it must not visually change existing legacy surfaces.

Recommended policy:
- `reducedMotion="user"`;
- avoid setting a global transition that makes every Motion component identical;
- centralise tokens but allow the correct semantic transition per interaction.

## Shared constants

Export semantic motion values rather than raw numbers scattered through screens.

Durations:
- press: 0.12s
- fast: 0.16s
- standard: 0.22s
- surface: 0.28s
- complex: 0.32s typical maximum

Easing:
- standard: [0.2, 0.8, 0.2, 1]
- enter: [0.16, 1, 0.3, 1]
- exit: [0.4, 0, 1, 1]

Layout spring:
- type: spring
- stiffness: 420
- damping: 34
- mass: 0.8

Names should express intent, for example:
- `EV2_MOTION.duration.fast`
- `EV2_MOTION.ease.standard`
- `EV2_MOTION.spring.layout`
- `EV2_TRANSITIONS.panel`
- `EV2_TRANSITIONS.reflow`

## What Motion is for

Use Motion when movement explains:
- layout reflow;
- a selected item moving;
- enter/exit;
- a drawer/sheet;
- expanding/collapsing content;
- shared element/state continuity;
- calendar selection/period changes;
- status change where spatial continuity matters.

Prefer CSS transitions for:
- hover colour;
- simple border colour;
- simple opacity on a static control;
- pressed colour.

Do not wrap every element in `motion.*`.

## Interaction principles

1. State first, animation second.
2. Motion must remain interruptible.
3. No decorative bounce.
4. Routine actions should feel immediate.
5. Do not animate unstable geometry.
6. Use `layout` where it explains reflow.
7. Use `AnimatePresence` only when exit state is meaningful.
8. Use `layoutId` sparingly for genuine shared-element relationships.
9. Avoid large parallax or background motion in operational screens.
10. Motion may never obscure loading, error or destructive-action feedback.

## Reduced motion

When the user requests reduced motion:
- remove transform-heavy/layout choreography where possible;
- keep necessary state changes immediate;
- opacity-only feedback may remain when non-disorienting;
- no loss of information or action affordance.

Test the gallery with reduced motion enabled.

## Reference standard

Persistent reference:
`CEAC OS / Experience V2 / References / Original Quality References / motion_reference.mp4`

The reference establishes:
- smooth state morphing;
- layout reflow;
- continuity between before/after states;
- restrained pacing.

It does not require copying exact colours, object shapes or choreography.

## Stage 2 proof

The foundation gallery needs one motion proof only:
- a compact operational item changes state or expands;
- adjacent content reflows using `layout`;
- enter/exit is handled cleanly;
- the motion is visually restrained;
- reduced-motion mode still communicates the state.

The full CEAC motion layer is Stage 12, after core geometry and screen composition are stable.

## Enforcement tests

Protect:
- one central MotionConfig provider;
- use of `reducedMotion="user"` or equivalent;
- shared motion constants;
- no second motion package;
- no direct paid Motion+ dependency;
- no large set of ad-hoc hard-coded animation durations in V2 components.