# CEAC OS Experience V2 — Icon Registry Contract

Date: 26 September 2026
Status: BINDING FOR STAGE 2+

## Purpose

Create one production icon language for CEAC OS. All Experience V2 screens consume semantic CEAC icon names through one registry backed by Lucide React.

## Implementation path

Primary registry:
`src/experience-v2/icons.jsx`

V2 screens/components must import from this registry. They must not import Lucide icons directly.

## Public API

The registry should expose:

- `CEAC_ICONS` — semantic name -> Lucide component mapping.
- `CEAC_ICON_SIZES` — semantic size roles.
- `CeacIcon` — the only ordinary V2 icon-rendering component.

Recommended props:
- `name` required semantic key;
- `size` optional number or semantic size role;
- `strokeWidth` optional, default 1.75;
- `className` optional;
- `label` optional accessible label for standalone meaningful icons;
- `decorative` optional, default true when no label is supplied.

Accessibility:
- decorative icon: `aria-hidden="true"`, not focusable;
- meaningful standalone icon: expose `role="img"` and `aria-label`;
- icon-only buttons label the BUTTON, not only the SVG;
- never rely on colour alone to communicate status.

## Size roles

- meta: 16
- row: 18
- control: 18
- nav: 20
- feature: 24
- empty: 36

Default stroke width: 1.75.
Use `currentColor`.

Do not alter stroke width per screen to make icons look unrelated.

## Required semantic keys

Navigation/work:
- home
- work
- team
- people
- person
- calendar
- projects
- portfolio
- ministry
- organisation
- finance
- reports
- messages
- learning
- assets
- compliance
- time
- account
- settings
- control

Actions:
- search
- create
- add
- edit
- delete
- close
- more
- menu
- filter
- sort
- download
- upload
- external
- refresh
- expand
- collapse

Direction:
- arrowRight
- arrowLeft
- chevronRight
- chevronLeft
- chevronDown
- chevronUp

Status/feedback:
- check
- checkCircle
- warning
- info
- error
- notification
- lock
- unlock
- clock
- pending

Data/content:
- chart
- table
- location
- file
- folder
- link
- meeting
- goal
- task
- budget

If a later screen needs a new semantic key, add it to the registry with a CEAC meaning. Do not import a one-off Lucide component directly into that screen.

## Mapping principles

Choose the Lucide glyph that most naturally communicates the CEAC concept; do not force novelty.

The semantic name belongs to CEAC. The Lucide component may change later without changing every screen.

Examples:
- `work` may map to ClipboardCheck or BriefcaseBusiness depending on final optical review;
- `team` may map to UsersRound;
- `projects` may map to FolderKanban;
- `finance` may map to WalletCards;
- `reports` may map to ChartNoAxesCombined;
- `calendar` maps to CalendarDays.

Final glyph choices are inspected in the Stage 2 gallery before being considered locked.

## Migration boundary

Legacy icon systems:
- `src/components/primitives/Icon.jsx`
- `Icon` in `src/components/bits.jsx`

Rules:
- do not delete them during Stage 2;
- do not add new V2 semantic keys to them;
- V2 components may not import them;
- they remain only for unmigrated legacy surfaces;
- removal happens after repository search proves no consumer remains.

## Enforcement tests

Add/extend tests so that:
- `src/experience-v2/icons.jsx` exists;
- it imports from `lucide-react`;
- V2 files outside the registry do not import from `lucide-react` directly;
- V2 files do not import either legacy icon implementation;
- default stroke width remains 1.75;
- required semantic keys exist;
- ordinary icon SVGs are not tabbable.

The test should protect architecture, not freeze every internal line of implementation.