# CEAC OS Experience V2 — Design Foundation Contract

Date: 26 September 2026
Status: BINDING FOR STAGE 2
Programme: Experience V2

This contract translates the stored CEAC mockups, product-owner quality references and motion reference into one implementable visual foundation. It governs new V2 components. It does not change CEAC data, security, RLS, audit, authority or workflow behaviour.

## 1. Foundation decision

Experience V2 keeps CEAC's identity and product architecture but raises execution quality to the reference standard.

The system must feel:
- deliberate rather than improvised;
- compact rather than cramped;
- premium rather than decorative;
- operational rather than template-like;
- responsive by composition, not by shrinking desktop;
- coherent across Staff, Manager, Administration/HR and Executive.

No role may invent its own typography, icon set, radii, shadow recipes or spacing scale.

## 2. Typeface

Primary family:
Instrument Sans, already loaded in index.html at weights 400, 500, 600 and 700.

Fallback:
system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif.

Do not add another UI font in Stage 2.

Typography is optical hierarchy, not merely font size. Large text is reserved for actual page-level moments.

## 3. Type tokens

All new V2 UI must use semantic type roles.

| Token | Mobile | Laptop/Desktop | Weight | Line height | Use |
| --- | --- | --- | --- | --- | --- |
| display | 32px | 40px | 700 | 1.08 | rare major workspace/empty-state moments |
| page | 28px | 32px | 700 | 1.12 | page title |
| section | 20px | 22px | 650/700 | 1.22 | major section title |
| card | 16px | 17px | 600 | 1.28 | card/panel title |
| row | 14px | 15px | 600 | 1.35 | list/record title |
| body | 14px | 15px | 400/500 | 1.48 | primary operational copy |
| supporting | 13px | 13px | 400/500 | 1.42 | secondary/meta copy |
| label | 12px | 12px | 600 | 1.30 | labels, eyebrows, compact metadata |

Rules:
- 12px remains the operational text floor, not the default body size.
- Do not solve layout pressure by shrinking below the token.
- Do not use page-title scale inside cards.
- Do not use bold for every text hierarchy. Use weight, size, spacing and contrast together.
- Numeric KPI values may use display/page scale only when they are the primary information in a deliberately sized stat component.
- Line lengths for explanatory copy should usually stay below approximately 70 characters where layout allows.

## 4. Spacing scale

Base unit: 4px.

Approved steps:
4, 8, 12, 16, 20, 24, 32, 40, 48, 64.

Semantic use:
- xs: 4
- sm: 8
- md: 12
- base: 16
- lg: 20
- xl: 24
- 2xl: 32
- 3xl: 40
- 4xl: 48
- 5xl: 64

Primary phone gutter:
16px.
At 320px only, 12px may be used where necessary.

Tablet gutter:
20–24px.

Laptop workspace gutter:
24–32px depending on shell width.

Wide desktop:
32–40px, with deliberate content max-width instead of uncontrolled stretching.

Typical section gap:
24–32px.

Typical card internal padding:
16px compact;
20px standard;
24px feature/hero.

Do not add arbitrary 18/22/26/30px values unless a measured optical correction is documented.

## 5. Content width and grid

V2 uses content-driven grids.

Phone:
- one primary content column;
- cards may contain internal two-column micro-layouts only where each item remains readable;
- no operational desktop grid squeezed into the viewport.

Tablet:
- one or two columns based on content role.

Laptop 1366×768:
- treated as a primary target;
- use available width for information relationships, not larger typography;
- typical workspace content should remain dense enough that priority + schedule/context can coexist without excessive vertical scrolling.

Large desktop:
- preserve readable line lengths and card proportions;
- do not stretch full-width content simply because space exists.

Breakpoints for V2 composition:
- phone: < 600px
- tablet: 600–899px
- compact desktop: 900–1199px
- laptop/desktop: 1200–1439px
- wide: >= 1440px

These are composition gates, not permission to build five unrelated UIs.

## 6. Surface tokens

Workspace:
#F5F7FA

Primary surface:
#FFFFFF

Soft surface:
#F8FAFC

Muted surface:
#EEF2F6

Navigation shell:
#0F1723

Raised navigation:
#172534

Primary text:
#17232D

Secondary text:
#586678

Tertiary text:
#7A8798

Subtle line:
#E3E8EE

Strong line:
#D5DDE6

Identity teal:
#118C83

Identity teal strong:
#0C766F

Identity teal soft:
#E5F5F2

Action blue:
#0C5DF9

Action blue hover:
#084FD8

Action blue soft:
#EAF1FF

Success:
#2F7358

Success soft:
#E8F3ED

Warning:
#9A6815

Warning soft:
#FBF1DD

Danger:
#A04935

Danger soft:
#F9E9E4

Violet accent:
#7C62D7

Rules:
- teal identifies CEAC/ministry context;
- blue means application action/selection;
- do not use both as competing primary CTAs on one surface;
- semantic colour is functional, not decorative;
- ordinary cards stay neutral.

## 7. Radius tokens

xs: 6px
sm: 8px
control: 10px
card: 14px
feature: 18px
panel: 20px
pill: 999px

Rules:
- tables/rows normally use smaller radii than feature cards;
- do not turn every surface into a rounded floating tile;
- nested cards should not all repeat the same large radius.

## 8. Elevation tokens

Border is preferred before shadow.

Level 0:
none.

Level 1:
0 1px 2px rgba(15, 23, 35, .04), 0 6px 18px rgba(15, 23, 35, .04)

Level 2:
0 10px 30px rgba(15, 23, 35, .10)

Level 3:
0 22px 60px rgba(15, 23, 35, .16)

Rules:
- routine cards should usually be Level 0/1;
- menus/drawers may use Level 2;
- modal/floating overlays may use Level 3;
- no new one-off shadow recipes without a documented need.

## 9. Controls

Phone primary touch target:
minimum 44px.

Ordinary form controls:
44–46px minimum height.

Compact desktop-only secondary control:
minimum 36px, only when not used as a primary touch control.

Primary button:
44px default; 40px compact desktop variant.

Icon button:
40–44px interactive box, even when glyph is 18–20px.

Do not use tiny hit areas simply because the icon is small.

## 10. Icon system decision

Production V2 icon family:
Lucide React.

Reasons:
- one coherent outline language;
- scalable SVG;
- consistent geometry;
- size/stroke customisation;
- tree-shakable imports;
- broad enough vocabulary for CEAC operational concepts;
- visually compatible with the product-owner references without copying their branding.

Stage 2 implementation dependency:
lucide-react.

Default optical rules:
- metadata: 16px;
- row/control: 18px;
- primary navigation: 20px;
- feature/category: 24px;
- large empty state: 32–40px;
- default strokeWidth: 1.75;
- use currentColor;
- active navigation is communicated primarily by colour/container treatment, not arbitrary filled icon substitutions.

Create ONE CEAC icon registry that maps semantic CEAC names to Lucide components. Screens must import from the registry rather than importing random Lucide icons independently.

The existing hand-built icons remain only while unmigrated legacy surfaces require them. V2 surfaces may not add to either legacy icon dictionary.

## 11. Motion implementation decision

Production V2 motion library:
Motion for React via the free/open-source "motion" package, imported from "motion/react".

Do not use Motion+ or any paid-token dependency for CEAC OS.

Reasons:
- React-native declarative integration;
- layout and shared-layout animations;
- enter/exit transitions;
- interruptible spring motion;
- touch/gesture support where useful;
- supports React 18.2+ and Vite;
- reduced-motion support can be centralised.

Stage 2 implementation dependency:
motion.

App-level policy:
use MotionConfig with user reduced-motion preference respected.

Motion tokens:

instant:
0ms — state where animation would reduce clarity.

press:
120ms — button/press feedback.

fast:
160ms — hover, small indicator, micro-state.

standard:
220ms — tab/segment movement, compact surface changes.

surface:
280ms — drawer/panel/accordion state.

complex:
320ms maximum typical UI transition; longer only with documented need.

CSS easing:
standard: cubic-bezier(.2,.8,.2,1)
enter: cubic-bezier(.16,1,.3,1)
exit: cubic-bezier(.4,0,1,1)

Spring defaults for layout/shared state:
type: spring
stiffness: 420
damping: 34
mass: .8

Use springs only where spatial continuity benefits from interruption. Do not use bounce as decorative personality.

## 12. Imagery

Image quality is part of V2 when images are justified.

Rules:
- authentic CEAC image first where identity/authenticity matters;
- generated CEAC-specific art where an illustration is more appropriate;
- licensed/free stock only when the content is genuinely generic;
- no random decorative stock;
- WebP/AVIF where practical;
- fixed aspect ratio;
- responsive sources;
- lazy-load offscreen;
- meaningful alt text when image content carries meaning;
- empty alt for purely decorative images.

Video:
- never the default operational background;
- poster first;
- load only when user-visible value justifies it;
- motion quality should come from the interface itself.

## 13. Responsive acceptance

Stage 2 foundation must be inspected at:
320, 360, 375, approximately 390×844, 414, 430, representative tablet, approximately 1366×768 and 1440+.

The foundation fails if:
- type hierarchy changes unpredictably by screen;
- an icon requires local stroke/geometry hacks;
- cards invent local spacing;
- mobile relies on wrapping a desktop layout;
- 1366×768 feels oversized or under-dense;
- wide desktop stretches without control.

## 14. CSS migration boundary

New file:
src/experience-v2.css

It loads after premium-parity.css during migration but MUST NOT become another blanket override layer.

Allowed in experience-v2.css during Stage 2:
- V2 root tokens;
- V2 foundation utilities/primitives;
- explicitly prefixed V2 preview/gallery styles;
- reduced-motion foundation.

Not allowed:
- legacy role-screen patches;
- broad selectors that silently restyle current role screens;
- !important;
- screen-specific fixes;
- duplicate old selectors merely to win cascade priority.

As V2 components replace legacy surfaces, obsolete legacy rules are removed deliberately at later stages.

## 15. Debt rule

Experience V2 must not increase:
- the 1,125 !important ceiling;
- hard-coded colour entropy;
- independent shadow/radius/font-size recipes;
- duplicate icon systems.

New V2 work uses tokens first.

## 16. Stage 2 proof

Before Stage 3:
- V2 CSS foundation is loaded without altering legacy screen behaviour;
- icon registry proof uses Lucide;
- motion proof uses Motion with reduced-motion support;
- a contained V2 gallery demonstrates type, icons, spacing, surface, controls and one layout transition;
- gallery is inspected at phone and laptop widths;
- build, CI, security and full Quality Gate remain green;
- BUILD_STATE records exact accepted SHA.

Stage 3 may then build the full reusable component system on this foundation.