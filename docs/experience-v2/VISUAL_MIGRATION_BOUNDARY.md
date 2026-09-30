# CEAC OS Experience V2 — Visual Migration Boundary

Date: 26 September 2026
Status: BINDING FOR EXPERIENCE V2

This file defines exactly how V2 may coexist with the current visual system while migration is incomplete.

## 1. Core rule

Experience V2 is additive only at the foundation stage and replacement-oriented at screen migration stages.

It must not become an eighth global patch layer.

The current legacy/premium cascade remains in place only for screens not yet migrated.

New V2 components opt in explicitly.

## 2. Current loaded legacy stack

Before V2:
1. src/styles.css
2. src/premium.css
3. src/premium-staff.css
4. src/premium-manager.css
5. src/premium-admin.css
6. src/premium-executive.css
7. src/premium-parity.css

V2 currently loads:
8. src/experience-v2.css

This ordering is temporary.

## 3. What src/experience-v2.css may contain

Allowed:
- :root V2 semantic tokens;
- ev2-prefixed typography classes;
- ev2-prefixed layout primitives;
- ev2-prefixed surface/control primitives;
- V2 focus/reduced-motion foundation;
- styles for components that have explicitly migrated to V2;
- styles for the contained V2 foundation gallery/proof.

Not allowed:
- broad legacy selectors such as .staff-app, .manager-app, .office-app or .executive-app;
- role-specific emergency overrides;
- selectors copied from premium-parity.css merely to win cascade order;
- !important;
- styling current role screens before their migration stage;
- hidden global element rules that change all buttons/inputs/cards.

## 4. Component ownership

V2 shared product components should live under one clearly named shared V2 component area.

Do not place new V2 primitives randomly across:
- src/components/bits.jsx;
- src/components/primitives;
- role screen files.

Legacy primitives remain available until the screens depending on them migrate.

After a V2 equivalent is accepted:
1. migrate a contained screen/family;
2. verify behaviour and visuals;
3. remove the obsolete legacy use;
4. only then delete obsolete CSS/component code if no remaining consumer exists.

## 5. Icon migration

Existing legacy icon sources:
- src/components/primitives/Icon.jsx
- Icon exported from src/components/bits.jsx

Rules:
- do not extend either legacy dictionary for V2;
- V2 uses one semantic CEAC icon registry backed by Lucide React;
- during migration, old and new icon systems may coexist only because unmigrated screens still need old icons;
- migrated V2 surfaces must not import legacy icon components;
- once repository search confirms no consumer remains, delete the old icon implementation in a dedicated cleanup checkpoint.

## 6. Typography migration

Instrument Sans remains globally available.

V2 screens use semantic V2 type roles.

Do not globally rewrite old font-size declarations in order to make them match V2.

When a screen migrates:
- its new view uses V2 semantic type tokens;
- obsolete local typography rules are removed with that view when safe;
- do not retain both old and V2 typography declarations for the same migrated component.

## 7. Card/surface migration

Do not translate every old .card into a new rounded card.

For each migrated screen classify content as:
- page structure;
- section;
- row/list;
- stat;
- action/focus surface;
- data panel;
- table;
- timeline;
- notice/state;
- drawer/sheet/modal.

Then use the correct V2 primitive.

This is required to fix the current inconsistent box sizing and excessive cardification.

## 8. Responsive migration

Do not preserve old desktop DOM geometry and solve mobile only with CSS wrapping.

When a keystone or operational screen migrates:
- preserve data/actions;
- recompose layout for phone where needed;
- keep semantic component relationships;
- use responsive component variants instead of role-specific hacks.

Laptop approximately 1366×768 and phone approximately 390×844 are both primary design targets.

## 9. Screen migration sequence

Do not migrate role screens during Stage 2.

After Stage 3 core components and Stage 4 shell are accepted, migrate keystones in this order:
1. Staff Today;
2. Manager Overview;
3. Administration Overview;
4. Executive Overview.

Only after the Stage 9 keystone quality gate may V2 spread to remaining screen families.

## 10. Deletion strategy

Legacy deletion is evidence-based.

Before deleting any visual rule/component:
- search all consumers;
- confirm migrated equivalents exist;
- run affected role journeys;
- run responsive checks;
- run the complete quality/security gates.

Stage 15 performs final CSS-debt closure.

## 11. Debt counters

V2 must not increase the known legacy ceilings:
- 1,125 !important declarations;
- 746 unique hard-coded hex colours in the legacy measured stack;
- 134 distinct shadow recipes;
- 55 distinct radius recipes;
- 36 distinct pixel font-size values.

V2 tokens themselves are not an excuse to increase legacy entropy.

## 12. Stop conditions

Stop and fix architecture before continuing if:
- a V2 screen requires many !important declarations;
- a role stylesheet is being used as a cross-role patch;
- a third icon implementation appears;
- a migrated screen still depends on premium-parity for ordinary geometry;
- mobile can only be fixed by shrinking text;
- an old component cannot be removed because behaviour was accidentally coupled to its visual markup.

The correct response is to repair the shared component/view boundary, not add another patch.