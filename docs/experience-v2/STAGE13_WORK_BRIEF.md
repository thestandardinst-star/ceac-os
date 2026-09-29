# CEAC OS Experience V2 — Stage 13 Visual Assets and Media Work Brief

Date: 29 September 2026
Status: ACTIVE CONTRACT
Stage: 13 — Visual Assets and Media

## 1. Purpose

Stage 13 completes only the visual-asset/media work that materially improves CEAC identity, comprehension or hierarchy.

It is not a decoration pass.

The default decision remains: use no image/video when the product is clearer, lighter and more truthful without one.

## 2. Binding sources

This work follows:
- `docs/experience-v2/CEAC_OS_EXPERIENCE_V2_SOURCE_OF_TRUTH.md`;
- `docs/experience-v2/IMPLEMENTATION_SEQUENCE.md`;
- `docs/experience-v2/REFERENCE_INDEX.md`;
- the accepted Experience V2 design system and role surfaces;
- Library quality references and CEAC source mockups.

Reference imagery sets a quality bar only. Reference-product photography, people, backgrounds and branding are not CEAC product assets and must not be copied.

## 3. Canonical asset inventory

### Existing CEAC application identity assets

The repository already contains a lightweight CEAC application mark:
- `public/ceac-icon-192.png`;
- `public/ceac-icon-512.png`;
- `public/apple-touch-icon.png`;
- `public/manifest.webmanifest` correctly references the 192px and 512px assets.

The inspected 192px asset is the rounded teal CEAC application mark with white `C` and dot.

It is already suitable for small identity contexts and does not require a new generated brand asset.

### Current in-product identity treatment

Two visible product areas currently recreate that mark with CSS rather than use the existing image asset:
- `src/components/AuthFrame.jsx` uses a local `CEACMark` made from a styled `C` and dot;
- `src/experience-v2/shell/ShellV2.jsx` uses a local `ShellMark` made from the same surrogate geometry.

This creates avoidable identity duplication.

### Current media behaviour

The inspected application uses no embedded product video and no heavy hero/background media.

The authentication story uses CSS geometry/gradients rather than external imagery.

The V2 `Avatar` component can render an image `src`, but the accepted shell currently passes name/fallback initials only. No canonical profile-photo data contract is introduced in this stage.

Operational empty/error/loading surfaces use the accepted Lucide/CEAC icon system rather than illustration.

## 4. Candidate classification

### Use existing authentic application asset

Approved:
- authentication brand lockup;
- desktop shell brand lockup;
- mobile shell brand lockup;
- browser/favicon identity.

Reason:
These are true identity surfaces where the existing CEAC application mark improves consistency without adding weight or new data.

### Keep no-media

Keep text/icon/data-first:
- Staff work and My Hub;
- Manager work/team/projects/calendar/finance/reports;
- Administration people/workforce/projects/calendar/finance/reporting/governance;
- Executive overview/work/organisation/finance/reports;
- empty/loading/error/configuration states;
- calendar and data-visualisation surfaces.

Reason:
Their primary job is operational clarity. Decorative photography or illustration would add noise and payload without improving the authoritative relationship.

### Do not introduce profile photography

Do not add profile-photo rendering/data capture merely because `Avatar` can accept `src`.

Reason:
Stage 13 does not create a new identity/media data model, storage policy, consent path or profile authority.

Initials remain the truthful fallback until a separately authorised profile-media contract exists.

### Do not embed video

No current accepted CEAC workflow requires video to function or understand the product.

The Stage 12 motion reference is a behaviour reference, not a product asset.

### No stock/AI documentary imagery

Do not add:
- generic church photos;
- invented CEAC staff/member portraits;
- fabricated ministry-event photos;
- random office/meeting stock;
- reference-product landscapes/backgrounds.

These could imply factual CEAC context that the repository does not own.

## 5. Missing-asset decision

No authentic CEAC photo/video asset is required to complete the current Experience V2 product scope.

Therefore Stage 13 has no owner-blocking photo/video request.

If future onboarding, campaign, ministry-event or announcement requirements introduce a real content need, record the required CEAC-owned asset at that time rather than preloading speculative media now.

## 6. Implementation sequence

### 13A — Asset/media audit and contract

This document.

Acceptance:
- current repository/public identity assets identified;
- visible duplicate brand-mark treatments identified;
- operational surfaces classified;
- no unapproved photo/video requirement invented;
- missing-asset decision persisted.

### 13B — CEAC application-mark integration

Implement one lightweight shared brand-mark component using the existing `/ceac-icon-192.png` asset.

Apply it to:
- AuthFrame desktop lockup;
- AuthFrame mobile lockup;
- Experience V2 desktop shell;
- Experience V2 mobile shell;
- browser favicon metadata.

Requirements:
- fixed intrinsic/display dimensions to prevent layout shift;
- decorative semantics where adjacent text already names CEAC OS;
- no lazy loading for the above-fold identity mark;
- no new media dependency;
- no shell geometry regression;
- no removal/change of PWA manifest icons;
- no auth/session/role behaviour change.

Remove only the now-redundant local CSS-surrogate mark code/selectors proven unused by the migrated surfaces.

Acceptance:
- source contract;
- sign-in phone/laptop visual proof;
- shell phone/laptop visual proof;
- no page-level overflow;
- no missing/broken asset;
- exact-head Level B.

### 13C — Stage 13 final acceptance

Inspect the accepted 13B application head and confirm:
- CEAC application mark renders consistently across auth and shell;
- PWA/touch/browser identity remains coherent;
- image dimensions remain stable;
- no heavy media was introduced;
- operational screens remain intentionally data/icon-first;
- no misleading/stock/generated documentary media exists;
- no profile/media data authority was invented;
- bundle/media impact remains negligible.

Record exact application SHA, CI, Migration Replay, Account Security, complete Quality Gate, Vercel and product evidence.

Only then open Stage 14 — Whole-System Responsive and State Pass.

## 7. Protected boundaries

Stage 13 must not:
- change schema, migrations, RLS, RPC, auth or capabilities for presentation;
- add a media upload/storage system;
- add profile-photo authority;
- add random stock;
- fabricate CEAC people/events/locations;
- embed the motion-reference video;
- make the shell depend on heavy media;
- add autoplay media;
- introduce image-led layout shift;
- add a second icon/brand system;
- modify frozen PR #71;
- open Payroll.

## 8. Exit definition

Stage 13 is complete only when:
- the existing CEAC application mark is the visible identity asset on auth/shell surfaces;
- browser/PWA identity remains correct;
- no unnecessary media was added;
- no required authentic CEAC media remains unresolved for current scope;
- exact-head Level B and Vercel pass;
- direct phone/laptop product inspection passes;
- Stage 13 acceptance and BUILD_STATE are current.
