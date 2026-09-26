# CEAC OS Experience V2 — Product Experience Source of Truth

Date: 26 September 2026
Status: BINDING FOR EXPERIENCE V2
Scope: visible product experience, interaction design, responsive composition and presentation architecture.

This document supplements, and does not weaken, CEAC security, RLS, authority, audit, protected-HR, data-integrity, work-behaviour and enterprise-stage contracts.

## 1. Product decision

CEAC OS is not being rebuilt from zero.

Keep:
- React/Vite application structure;
- Supabase schema and proven data contracts;
- authentication and role/capability boundaries;
- RLS/RPC/security rules;
- Work Engine and domain behaviour;
- existing data queries and business calculations where they are correct;
- reporting provenance and clickable-number rules;
- current functionality that has already passed security/functional gates.

Rebuild progressively:
- visual component system;
- typography hierarchy;
- iconography;
- responsive layout/composition;
- desktop/laptop shell;
- mobile shell;
- card/surface language;
- tables, queues and dense information patterns;
- forms and controls;
- calendar interaction;
- chart/data visual language;
- modal/drawer/sheet behaviour;
- empty/loading/error/configuration states;
- motion and state transitions;
- imagery treatment;
- screen composition.

Large screens that mix data logic and presentation should be refactored by preserving the working controller/data behaviour and replacing the rendered view progressively. Do not recreate complex Supabase logic simply to obtain a new layout.

## 2. Quality bar

The quality references stored under docs/experience-v2/references define the required craftsmanship level.

They establish the standard for:
- restrained but confident typography;
- deliberate hierarchy;
- consistent icon geometry and optical weight;
- disciplined spacing;
- compact but readable information density;
- repeatable card/surface anatomy;
- strong alignment;
- thoughtful use of colour;
- intentional desktop composition;
- intentionally recomposed mobile composition;
- polished calendar/data visualisation;
- smooth spatial continuity;
- motion that explains state changes.

The references do NOT authorise copying another product's brand, colour scheme, text, data or information architecture. CEAC keeps its own identity and functional architecture.

"Looks cleaner than before" is not acceptance. The result must withstand direct side-by-side comparison with the reference quality.

## 3. CEAC visual identity

Retain the approved CEAC identity direction:
- deep navy/graphite navigation shell;
- cool light workspace;
- ministry identity teal;
- workspace action blue;
- restrained semantic success/warning/danger colours;
- white/soft surfaces;
- high-legibility neutral text.

Teal identifies ministry/CEAC identity.
Blue identifies workspace action.
Do not make teal and blue compete as primary actions on the same surface.

The product must not become a generic SaaS template.

## 4. Typography

Primary family: Instrument Sans with system fallbacks unless a later explicit visual review demonstrates a materially better alternative.

The problem to solve is not only font family. It is hierarchy, scale, line-height, weight, tracking, density and consistency.

V2 semantic roles must be tokenised. Exact values are ratified in Stage 2, but the hierarchy must follow this order:
- display/major workspace moment;
- page title;
- section title;
- card/panel title;
- row title;
- body;
- supporting/meta;
- label/eyebrow.

Large type is reserved for true hierarchy. Operational screens must not use oversized headings that waste vertical space.

The existing 12px operational readability floor remains a minimum, not a target for all text.

No screen may invent a local type scale.

## 5. Spacing and geometry

Use a small semantic spacing scale. Do not allow arbitrary per-screen spacing to accumulate.

Required principles:
- consistent page gutters;
- consistent section rhythm;
- predictable card padding;
- predictable icon-to-label spacing;
- predictable row height;
- predictable control height;
- consistent radii by component category;
- borders before heavy shadows;
- empty space must separate meaning, not merely enlarge components.

Desktop/laptop should use width intelligently. More screen does not mean larger cards.
Mobile should recompose. It must never be desktop squeezed into 390px.

## 6. Iconography

There must be one production icon language.

Current duplicate hand-built icon systems are transitional debt and must be removed progressively.

Stage 2 must select and lock one coherent SVG family/registry with:
- consistent geometry;
- consistent stroke weight;
- predictable sizes;
- accessible labels where needed;
- tree-shaken/import-efficient implementation;
- active/inactive behaviour;
- no emoji for operational navigation;
- no Unicode substitutes;
- no one-off hand-drawn icon unless explicitly approved and added to the registry.

Default optical roles:
- compact/meta icons;
- standard control/nav icons;
- feature/category icons;
- large empty-state/illustration icons.

Icon containers may use restrained semantic colour where that improves scanning. Do not colour every icon simply for decoration.

## 7. Images and visual assets

Images are allowed when they materially improve comprehension, identity or hierarchy.

Priority order:
1. authentic CEAC-owned imagery where authenticity matters;
2. original CEAC-specific generated illustration/artwork;
3. properly licensed/free stock imagery where generic context is appropriate;
4. no image if an image adds no product value.

Do not use random stock imagery as decoration.

Performance rules:
- responsive image sizes;
- WebP/AVIF where practical;
- sensible compression;
- lazy loading offscreen;
- fixed aspect-ratio containers to avoid layout shift;
- poster image before video;
- do not make the main application shell depend on heavy media.

If an authentic CEAC image is required and unavailable, record the asset request in BUILD_STATE instead of substituting a misleading image.

## 8. Video

Video is not the default method for making the product feel premium.

Use video only where it serves a clear onboarding, ministry, campaign or explanatory purpose.

The reference recording under docs/experience-v2/references is primarily an interaction/motion reference. The fluid quality shown there should be recreated as real UI behaviour, not as embedded video.

## 9. Motion language

Motion must explain:
- where an element came from;
- what changed;
- what belongs together;
- what was completed/removed/expanded;
- where the user's attention should move next.

Required concepts:
- spatial continuity;
- layout reflow;
- shared-element/state transitions where appropriate;
- drawer/sheet transitions;
- selected-tab/date indicators that move rather than redraw abruptly;
- enter/exit transitions;
- state-change confirmation;
- interruptible motion;
- reduced-motion support.

Do not animate for spectacle.
Do not delay normal work behind long transitions.
Do not animate unstable layouts before their geometry is correct.

Stage 2 ratifies motion tokens. Stage 10 applies the richer interaction layer after core geometry is stable.

## 10. Responsive product architecture

Primary acceptance classes:
- phone: approximately 390 × 844, plus supported widths 320/360/375/414/430;
- tablet/intermediate: representative narrow/medium layouts;
- laptop: approximately 1366 × 768;
- large desktop: 1440px+.

Laptop is a first-class design target.
Mobile is a first-class design target.
Neither is an afterthought.

Responsive behaviour must be intentional:
- grids collapse based on content needs, not arbitrary squeezing;
- multi-column operational panels stack or recompose when necessary;
- tabs become scrollable/segmented/menu patterns rather than wrapping into awkward blocks;
- tables use deliberate responsive treatment;
- actions remain easy to locate;
- bottom navigation respects safe areas;
- the desktop sidebar does not overflow;
- long names and labels do not break geometry.

## 11. Shell

Desktop/laptop:
- deep navigation shell;
- clear CEAC identity;
- role-appropriate destinations;
- premium search/context area;
- concise primary action;
- account/profile affordance;
- workspace content with a stable max-width/grid strategy;
- no unnecessary dead space.

Mobile:
- compact brand/context;
- role-appropriate top actions;
- maximum five primary bottom destinations;
- More surface for secondary destinations;
- separately composed content;
- safe-area-aware navigation.

## 12. Cards and surfaces

Do not use cards everywhere.

Approved V2 categories include:
- stat/KPI tile;
- action/focus card;
- information/feature card;
- queue row;
- record row;
- data panel;
- table;
- split view;
- drawer/sheet;
- modal/dialog;
- timeline;
- calendar panel;
- chart/visualisation panel;
- notice/banner;
- empty/loading/error surface.

Each category has one anatomy and token contract. Screens compose these primitives; they do not redefine them.

## 13. Data visualisation

Charts are used only when visual comparison is faster than reading rows.

Required qualities:
- CEAC typography and spacing;
- consistent colour semantics;
- useful hover/touch/focus states;
- readable legends;
- tooltips where useful;
- chart/table equivalence where the architecture requires it;
- every authoritative number remains traceable to rows;
- no decorative data;
- no invented trends.

The existing small SVG chart API may be preserved conceptually, but its visual layer may be replaced if required to reach the quality bar.

## 14. Calendar

Calendar is a product component, not a static month matrix.

V2 calendar experience should support the role's real work:
- selected date state;
- period navigation;
- event markers;
- schedule/detail relationship;
- event expansion or contextual panel;
- meeting/work linkage;
- accessible keyboard/touch behaviour;
- purposeful transitions;
- responsive day/week/month presentation where needed.

Do not add calendar complexity that the underlying CEAC data does not support.

## 15. Forms and operations

Operational controls must feel consistent:
- predictable sizes;
- clear labels;
- strong focus state;
- meaningful disabled state;
- safe destructive confirmations;
- understandable validation;
- drawers/guided flows for multi-step work;
- no database terminology in user-facing text.

Preserve CEAC's reversibility and human-review principles.

## 16. Role character

Staff: calm personal workspace.
Manager: team command centre.
Administration/HR: organisation operations console.
Group Pastor/CEO: executive briefing and delegation.

They share one system, but density and composition are role-appropriate.

## 17. Keystone rule

Do not propagate V2 to the whole application before keystone quality is proven.

The first keystone set is:
1. Staff Today;
2. Manager Overview;
3. Administration Overview;
4. Executive Overview.

Each must pass desktop/laptop AND mobile review before V2 is spread widely.

## 18. Prohibited shortcuts

Do not:
- solve V2 with another parity/override CSS pile;
- expand the !important ceiling;
- introduce a third icon language;
- replace broken layout with smaller text;
- declare mobile complete because horizontal overflow is absent;
- declare laptop complete because the app fills the viewport;
- copy reference branding;
- invent data to fill a beautiful component;
- weaken permissions or RLS for visual convenience;
- add heavy media to simulate quality;
- redesign dozens of screens before the keystone gate;
- accept generic admin-template UI where the reference quality is more deliberate.

## 19. Definition of quality

Experience V2 is successful when CEAC feels like one intentionally designed product across roles and devices: typography, spacing, iconography, interaction, density, motion and component behaviour remain coherent while the underlying CEAC architecture and trust guarantees stay intact.