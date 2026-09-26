# CEAC OS Experience V2 — Baseline Audit

Date: 26 September 2026
Reference commit: 1a0fb33d3fff18ddae63e6523547b4f4d5d5c883

Purpose:
Record the concrete repository conditions that justify Experience V2 so future sessions do not repeat the same diagnosis.

## 1. Application structure worth preserving

The React application already has a usable role/routing architecture.

src/App.jsx routes:
- Staff;
- Manager;
- Administration/HR;
- Executive;
- work/detail overlays;
- person/project/meeting/room contexts;
- role/capability-gated enterprise surfaces.

The product therefore does not need a ground-up application rewrite to improve design quality.

## 2. Working logic is substantial

Representative baseline screen size/complexity observed:

- src/screens/Home.jsx
  - about 604 lines;
  - about 29 useState usages;
  - about 17 Supabase calls.

- src/screens/ManagerHome.jsx
  - about 744 lines;
  - about 26 useState usages;
  - about 29 Supabase calls.

- src/screens/AdminHome.jsx
  - about 434 lines;
  - about 19 useState usages;
  - about 24 Supabase calls.

- src/screens/ExecutiveHome.jsx
  - about 275 lines;
  - about 9 useState usages;
  - about 8 Supabase calls.

- src/screens/Workforce.jsx
  - about 586 lines;
  - about 54 useState usages;
  - about 13 Supabase calls.

Implication:
For large mature screens, preserve/refactor the data/controller behaviour and replace the view progressively. Do not reimplement complex queries merely to obtain a new layout.

## 3. CSS architecture is the main visual risk

Loaded order at baseline:
1. src/styles.css
2. src/premium.css
3. src/premium-staff.css
4. src/premium-manager.css
5. src/premium-admin.css
6. src/premium-executive.css
7. src/premium-parity.css

Approximate baseline line counts:
- styles.css: 3,824
- premium.css: 337
- premium-staff.css: 283
- premium-manager.css: 201
- premium-admin.css: 176
- premium-executive.css: 33
- premium-parity.css: 807

Total: approximately 5,661 lines across the loaded CSS layers.

Observed !important counts:
- styles.css: 121
- premium.css: 65
- premium-staff.css: 175
- premium-manager.css: 156
- premium-admin.css: 130
- premium-executive.css: 12
- premium-parity.css: 466

Total: 1,125.

The existing design-system file already describes these as transitional ceilings, not approved design-token counts.

Implication:
Experience V2 must migrate away from competing cascade layers. Another override pass is not an acceptable architecture.

## 4. Icon inconsistency is structural

At least two independent hand-built SVG icon implementations exist:

- src/components/primitives/Icon.jsx
- the Icon export in src/components/bits.jsx

They use different SVG paths, naming conventions and stroke values.

Implication:
The inconsistent icon quality seen by the product owner is not merely subjective. Stage 2 must establish one production icon registry/family and progressively remove both competing legacy sources from V2 surfaces.

## 5. Incomplete component system

The repo has useful primitives:
- Icon;
- Stat;
- QueueRow;
- Table;
- Chart;
- MapPin;
- EmptyState;
- Skeleton;
- Toast.

However there is not yet a complete V2 component architecture for:
- buttons;
- card/surface variants;
- standard inputs;
- tab/segment patterns;
- modal/drawer families;
- consistent navigation;
- unified state surfaces;
- unified responsive composition.

Some shared behaviours live in src/components/bits.jsx while other primitives live under src/components/primitives, contributing to visual fragmentation.

## 6. Motion system is not established

package.json at baseline includes:
- React;
- React DOM;
- Supabase;
- Vite.

No dedicated production motion library is currently present.
There is also no documented V2 interaction-motion architecture in code.

Implication:
The quality shown in the motion reference requires a deliberate interaction layer; it is not already present and should not be simulated with random CSS transitions.

## 7. Calendar is currently a simple reference implementation

src/components/ReferenceDashboard.jsx implements DashboardCalendar as a current-month matrix with event markers and a schedule list.

It is useful as a data/composition prototype, but it is not the interactive calendar quality requested for V2.

Implication:
Preserve the relevant event/meeting data contract but rebuild the interaction/presentation layer in the calendar stage.

## 8. Charts are functional but visually basic

src/components/primitives/Chart.jsx implements a small inline SVG system for:
- bar;
- paired bar;
- line;
- donut;
- chart/table toggle.

This is valuable because:
- data remains local/traceable;
- chart/table parity already exists.

But its presentation is deliberately minimal and has no richer transition/interaction system.

Implication:
Keep the traceability/API principles. The visual renderer may be upgraded or replaced if required to meet the V2 quality bar.

## 9. Existing V1 design contract is transitional

docs/architecture/CEAC_OS_Design_System_v1.md explicitly says:
- the product is still migrating away from the original component layer;
- premium-parity.css is temporary;
- !important debt is transitional;
- the numeric debt values are ceilings, not approved design-token counts.

Implication:
Experience V2 is a completion of the intended migration, not an arbitrary restart.

## 10. Product-owner evidence

The persistent reference package documents:
- mobile component collisions/wrapping;
- inconsistent typography;
- uneven card proportions;
- weak icon treatment;
- excessive/insufficient spacing;
- desktop/laptop concerns;
- desired premium dashboard quality;
- desired motion/spatial continuity.

Automated "no overflow" and minimum-font gates are therefore insufficient as final product-quality gates.

## 11. Safe architecture conclusion

Keep:
- app routing;
- security;
- data;
- workflows;
- business logic;
- valid primitives/data contracts.

Rebuild:
- tokens;
- icon system;
- shared visual primitives;
- shell;
- keystone views;
- operational view layers;
- calendar/data presentation;
- motion;
- media treatment.

This is the architecture Experience V2 follows.