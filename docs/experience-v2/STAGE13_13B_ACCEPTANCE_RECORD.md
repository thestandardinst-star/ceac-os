# CEAC OS Experience V2 — Stage 13B Acceptance Record

Date: 29 September 2026
Stage: 13 — Visual Assets and Media
Substage: 13B — CEAC application-mark integration
Status: ACCEPTED AND COMPLETE

## Accepted application head

`668d9ef0c29d5d64770b0d565121a2272f6a9023`

This exact SHA is the accepted 13B application head.

## Accepted scope

13B replaced duplicate CSS-surrogate CEAC marks with one shared lightweight application-mark component using the existing canonical asset:

- `src/experience-v2/components/BrandMark.jsx`;
- `/ceac-icon-192.png`;
- authentication desktop and mobile lockups;
- Experience V2 desktop shell;
- Experience V2 mobile shell;
- browser favicon metadata.

The existing PWA manifest/touch assets remain authoritative and unchanged.

The accepted brand-mark contract preserves:
- fixed intrinsic/display dimensions;
- no lazy loading for the above-fold identity mark;
- asynchronous decode;
- decorative semantics when adjacent CEAC OS text already names the identity;
- explicit non-decorative label support when required;
- no shell/auth/session/role authority change;
- no new media dependency.

## Exact-head Level B

The accepted application SHA passed the complete Level B boundary:

- CI PASS — run `36561584774` (#1433);
- Migration Replay PASS — run `36561584688` (#1044);
- Account Security PASS — run `36561584704` (#1216);
- Complete Quality Gate PASS — run `36561584843` (#1242);
- Level B SQL and authority contracts PASS;
- browser shard 1/4 PASS;
- browser shard 2/4 PASS;
- browser shard 3/4 PASS;
- browser shard 4/4 PASS;
- merged exact-head product evidence PASS;
- role-and-RLS coordinator PASS;
- Vercel exact-head deployment PASS.

## Exact-head evidence

Merged product evidence:
- `redesign-r7-product-inspection`;
- artifact ID `11029654969`;
- digest `sha256:566298941050a5f6378f2f84a534ee0a414ea5aa37c1bfc1870235d04d33ed84`;
- head SHA `668d9ef0c29d5d64770b0d565121a2272f6a9023`.

Supporting Experience V2 foundation artifact:
- `experience-v2-foundation`;
- artifact ID `11030358561`;
- digest `sha256:8643c0642a3ecb4f02dc26c4e31f83af70e6cc14bfe3b6b5fe347c1086a455f6`.

Direct exact-head product inspection confirmed:
- 390px sign-in uses the CEAC application mark cleanly above the access card with no page-level horizontal overflow;
- 1366px sign-in keeps the same mark in the desktop brand lockup without changing the accepted two-column composition;
- 390px Staff shell uses the same mark in the compact mobile top bar without crowding the unit/role context;
- 1366px Administration shell uses the same mark in the desktop sidebar without changing navigation geometry;
- no broken image, layout shift, heavyweight media, stock photography or fabricated documentary imagery was introduced.

## Source contract

Accepted source evidence confirms:
- `BrandMark` uses `/ceac-icon-192.png`;
- width/height are fixed from the shared size contract;
- `decoding="async"` and `fetchPriority="high"` are present;
- decorative marks use empty alt text and `aria-hidden`;
- AuthFrame and ShellV2 no longer define local surrogate-mark functions;
- redundant surrogate mark selectors were removed only where proven unused;
- `index.html` now exposes the existing 192px mark as browser favicon;
- manifest and Apple touch icons remain present.

## Authority and media preservation

13B introduced no schema, migration, RLS, RPC definition, authentication configuration or capability grant change.

Protected:
- no media-upload/storage authority;
- no profile-photo authority;
- no random stock imagery;
- no fabricated CEAC people/events/locations;
- no product-video embedding;
- no autoplay media;
- no motion-reference embedding;
- no new icon/brand system;
- frozen enterprise PR #71 remains untouched;
- Payroll remains blocked.

## Exit decision

Stage 13B — CEAC application-mark integration is ACCEPTED AND COMPLETE.

The next permitted substage is 13C — Stage 13 final acceptance.
