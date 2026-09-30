# CEAC OS Experience V2 — Stage 4 Shell Work Brief

Date: 26 September 2026

Status: ACTIVE

Stage: 4 — Shell V2

## 1. Purpose

Build one stable, premium CEAC OS shell before any role home screen is rebuilt.

The shell must preserve the current routing, authority and role destinations while replacing the transitional premium shell with the accepted Experience V2 foundation and component system.

Stage 4 changes navigation and workspace composition only. It does not redesign Staff, Manager, Administration/HR or Executive page content.

## 2. Accepted starting point

Stage 4 begins after the accepted Stage 3 implementation checkpoint:

`2ff50401115cc3d14b95cb2983dcbe4c82afa83b`

Stage 3 acceptance is recorded in `STAGE3C_ACCEPTANCE_RECORD.md`. The current branch may include later documentation or legacy hardening commits, but the V2 component checkpoint above remains the shell implementation base.

## 3. Current-shell audit

The active application shell is implemented by:

- `src/App.jsx` for routing, role resolution, overlays and unit switching;
- `src/components/PremiumShell.jsx` for desktop/sidebar, top bar, mobile top bar and bottom navigation;
- `src/premium.css` plus legacy parity layers for current geometry.

Observed strengths to preserve:

- one App routing path across all four roles;
- role-aware destinations and capability-gated Administration routes;
- URL-backed Item, Project, Room and Meeting overlays;
- selected-unit switching for dual-role users;
- maximum five mobile bottom-navigation controls;
- mobile More surface for secondary destinations;
- current safe-area bottom-navigation padding;
- one stable desktop sidebar/topbar composition.

Observed Stage 4 problems to correct at the shared shell layer:

1. `PremiumShell.jsx` still uses the transitional legacy icon component instead of the accepted V2 semantic icon registry.
2. The desktop sidebar navigation has no deliberate internal overflow strategy. Dense Manager and Administration navigation can compete with quick-create and profile areas at 1366×768.
3. The desktop search field only filters destinations, while its copy implies broader workspace search. Its label and empty state must describe navigation truthfully unless real search is connected later.
4. The Administration Primitives diagnostic route is currently exposed in ordinary primary navigation, conflicting with the Stage 2 decision that it remain a protected diagnostic route without a production navigation destination.
5. Quick-create destinations are partly inferred from role labels rather than the same authorised destination model. An Administration account without `people.manage` can be offered a People shortcut it cannot legitimately use.
6. The mobile More surface is an ungrouped long list for information-dense roles and does not yet use the accepted Stage 3 interaction primitives.
7. Dual-unit context is rendered as a separate mobile strip rather than an integrated, deliberate mobile context control.
8. The top bar labels a device-local time as Accra time. Stage 4 must either format explicitly in `Africa/Accra` or remove that claim.
9. Current shell styling remains coupled to `premium.css` and later parity overrides. V2 shell CSS must be isolated and must not increase the legacy `!important` ceiling.
10. Duplicate legacy navigation exports remain in `components/bits.jsx`; they are not the active App shell. Stage 4 must not refactor that large shared utility file merely for cleanup.

## 4. Authorised destination matrix

This matrix records the current product routes that the V2 shell must preserve. It does not grant authority: `App.jsx` capability/role guards and database authority remain decisive.

| Role | Primary destinations | Secondary/account destinations | Conditional rules |
| --- | --- | --- | --- |
| Staff | Today, Work, Team, Calendar, Messages | My Hub, Your account | Unit switch only when more than one membership exists. Strategy, learning, assets and compliance remain contextual routes rather than shell expansion in this stage. |
| Manager | Overview, Work, Team, Projects, Calendar | Finance, Reports, Messages, My Hub, Your account | Unit switch only when more than one membership exists. Work is the manager's own work surface; assignment remains a create action. |
| Administration & HR | Overview, Work, Time & Leave, Finance, Reports, Control Center, Messages | People when `people.manage`; My Hub; Your account | Capability-gated routes remain gated. The Primitives diagnostic route must not appear in production navigation. |
| Group Pastor / CEO | Overview, Work, Ministry, Portfolio, Organisation | Finance, Reports, Messages, My Hub, Your account | Organisation-level shell; no unit switch unless the underlying role contract later requires it. |

Mobile primary composition remains role-specific and capped at five controls including More:

- Staff: Today, Work, Team, My Hub, More;
- Manager: Overview, Work, Team, Projects, More;
- Administration: Overview, People when authorised, Time & Leave, Finance, More, with the list contracting rather than adding an empty slot when People is unavailable;
- Executive: Overview, Work, Ministry, Portfolio, More.

## 5. Desktop/laptop contract

At 1366×768 and larger, the shell must provide:

- deep navy/graphite CEAC identity shell using V2 tokens;
- Lucide-backed semantic icons from `src/experience-v2/icons.jsx` only;
- sidebar content that scrolls independently when destinations exceed available height;
- pinned CEAC identity and account affordance, with navigation taking the flexible middle region;
- truthful destination search/navigation;
- one concise create action whose menu contains only authorised actions;
- role and current-destination context;
- explicit Accra date/time formatting where shown;
- stable workspace max-width and gutter rules from the V2 foundation;
- no page-level horizontal overflow, clipping or dead space caused by shell geometry;
- keyboard-visible focus and full navigation reachability.

## 6. Mobile contract

At 320, 360, 375, approximately 390×844, 414 and 430 widths, the shell must provide:

- compact CEAC identity and current role/unit context;
- integrated dual-unit switch when applicable;
- at most five bottom destinations including More;
- a Stage 3 Drawer/Sheet-based More surface with clear grouping for secondary destinations;
- safe-area-aware top and bottom geometry;
- no desktop sidebar/topbar remnants;
- no horizontal overflow or clipped labels;
- 44px minimum practical touch targets;
- bottom navigation hidden while canonical full-context overlays are open, preserving the existing overlay rule;
- primary screen content unobscured by fixed navigation and mobile keyboard.

## 7. Authority and routing boundary

- Navigation visibility is not a security boundary.
- Do not broaden `App.jsx` role/capability guards.
- Do not introduce client-side access assumptions.
- Do not change Supabase, RLS, migrations or RPCs in Stage 4.
- Preserve URL-backed overlay and browser Back behaviour.
- Changing unit must continue to clear stale contextual overlays and return to the authorised Home/Overview destination.
- Quick actions must be derived from the same role/capability state as navigation and routes.
- Do not expose diagnostic routes as normal production destinations.

## 8. Migration boundary

Stage 4 may change:

- the active shared shell component(s);
- isolated `src/experience-v2/shell/` components and styles;
- minimal additive wiring in `App.jsx`;
- shell-specific tests and visual evidence;
- Experience V2 documentation.

Stage 4 must not:

- rebuild role screen content;
- rewrite business queries or mutations;
- change role authority;
- change database contracts;
- restyle role pages through another global parity layer;
- add new one-off icons;
- delete legacy shell exports solely for cleanup;
- touch frozen PR #71.

## 9. Implementation sequence

### 4A — Audit and contract

- record the active shell implementation and current shortcomings;
- lock the authorised destination matrix;
- lock desktop/mobile composition and migration boundaries;
- persist this brief.

### 4B — V2 shell structure

- create isolated V2 shell components and stylesheet;
- centralise role navigation metadata and authorised quick actions;
- use the V2 icon registry and Stage 3 interaction primitives;
- wire the shell additively through `App.jsx` without changing page content.

### 4C — Responsive and interaction hardening

- desktop sidebar scrolling/pinning;
- truthful navigation palette;
- mobile unit context and More drawer;
- focus, Escape, close and focus-restoration behaviour;
- safe areas, overlay stacking and browser navigation.

### 4D — Acceptance

- test Staff, Manager, Administration/HR and Executive shells;
- inspect 320/360/375/390/414/430, tablet, 1366×768 and 1440+;
- inspect long names, dense capability sets, dual-unit state and overlays;
- persist exact-head phone/laptop/desktop evidence;
- accept Stage 4 only when all four roles can reach their authorised destinations without overflow, clipping or inconsistency.

## 10. Required engineering gates

Before each pushed Stage 4 checkpoint:

- `npm ci`;
- `npm run build`;
- relevant shell architecture and browser tests;
- `git diff --check`;
- complete diff inspection;
- exact-head CI, Migration Replay, Account Security, Quality Gate and Vercel status.

No Stage 5 Staff Today work begins until Stage 4 is accepted.
