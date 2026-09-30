# CEAC OS Experience V2 — Foundation Gallery Specification

Date: 26 September 2026
Status: REQUIRED STAGE 2 PROOF

## Purpose

Prove the V2 visual foundation before any Staff, Manager, Administration/HR or Executive screen is rebuilt.

The gallery is a diagnostic/product-design surface, not a production CEAC destination.

## Mounting

Existing protected diagnostic route:
`?tab=primitives`

`src/App.jsx` already renders `DesignPrimitives` for Administration/HR users only when `tab === "primitives"`.

Do not add a primary navigation item.

Preferred implementation:
- create `src/experience-v2/ExperienceV2FoundationGallery.jsx`;
- mount it as a clearly separated V2 section inside `src/screens/DesignPrimitives.jsx`;
- keep the legacy primitive inspection available until V2 replaces it.

## Required gallery sections

### A. Typography ladder
Show:
- display;
- page;
- section;
- card;
- row;
- body;
- supporting;
- label.

Use neutral sample copy clearly marked as design reference. Do not present sample numbers/text as live CEAC data.

### B. Icon language
Show representative semantic icons:
- home;
- work;
- people/team;
- projects;
- calendar;
- finance;
- reports;
- ministry;
- learning;
- assets;
- compliance;
- search;
- create;
- notification;
- more;
- warning;
- check.

Show meta, row, nav and feature size roles.

### C. Controls
Show:
- primary action;
- secondary action;
- icon button;
- input;
- select if a V2 control exists at this stage;
- focus-visible;
- disabled state.

### D. Surfaces
Show:
- ordinary neutral panel;
- stat/KPI surface;
- compact operational row;
- action/focus card;
- semantic success/warning/danger treatment.

The gallery must demonstrate that CEAC will not turn every piece of information into an oversized card.

### E. Density example
Create a small reference-only operations cluster that demonstrates:
- one clear priority;
- compact secondary rows;
- metadata;
- icon alignment;
- consistent spacing.

Do not use invented "live" business performance claims.

### F. Motion proof
Create one contained interaction:
- user toggles/expands or changes state;
- the component changes layout;
- surrounding content reflows;
- Motion for React handles spatial continuity;
- reduced motion remains understandable.

No autoplaying decorative loop.

## Layout

Phone:
- single-column composition;
- 16px primary gutter;
- compact sections;
- controls remain >=44px touch targets.

Laptop around 1366×768:
- use 2–3 columns where relationships benefit;
- keep typography restrained;
- avoid giant cards;
- enough content should be visible to judge density without excessive scrolling.

Large desktop:
- use max-width;
- preserve card proportions;
- do not stretch every panel edge-to-edge.

## Reference comparison

Compare directly against the persistent quality references for:
- type hierarchy;
- icon optical weight;
- spacing rhythm;
- component geometry;
- information density;
- restraint;
- visual polish.

The gallery is NOT accepted because it merely uses the correct tokens. It must look convincing.

## Screenshot evidence

Persist Stage 2 visual evidence for:
- approximately 390×844;
- approximately 1366×768;
- 1440px+ when available;
- one narrow phone width (320/360/375).

Evidence must identify exact tested SHA.

## Failure examples

Fail the gallery if:
- typography looks mechanically scaled rather than composed;
- icons feel too thin/heavy/misaligned;
- cards look oversized;
- spacing varies between similar examples;
- mobile is a squeezed desktop grid;
- desktop looks stretched and empty;
- Motion feels bouncy or ornamental;
- gallery depends on premium-parity overrides for its geometry.

Correct the shared foundation before Stage 3.