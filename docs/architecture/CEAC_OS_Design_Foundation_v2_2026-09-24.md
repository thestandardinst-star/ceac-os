# CEAC OS — Design Foundation v2

**Date:** 24 September 2026  
**Status:** APPROVED VISUAL AND INTERACTION ARCHITECTURE  
**Applies to:** Staff, Manager, Administration/HR and Group Pastor/CEO surfaces  
**Implementation boundary:** Visual language, component language, interaction design and migration strategy only. Existing security, RLS, audit, authority, data-integrity and business-rule contracts remain authoritative.

## 0. Precedence

This document is the visual and interaction source of truth for CEAC OS from 24 September 2026.

Where visual guidance conflicts, precedence is:

1. this Design Foundation v2;
2. the approved screen/job architecture, especially `CEAC_OS_Screen_Archetypes_v1.md`;
3. the Premium Redesign source of truth dated 23 September 2026 where it does not conflict with this document;
4. Design System v1 dated 21 September 2026 where it does not conflict with this document.

This document supersedes the conflicting visual portions of earlier design documents. It does not supersede security, database, authority, workflow, audit, protected-HR or stage-specific architecture.

The earlier premium mockup remains a historical implementation reference, not the final visual authority where it conflicts with this foundation.

## 1. Product character

CEAC OS is calm operations software for a serious church.

It is not a productivity toy, startup dashboard, generic HR template or decorative church interface.

The product should feel like disciplined modern operational software with high information clarity, useful density and a warmer face than a developer-centric tool.

Three permanent product principles:

1. **Every number opens.**
2. **Every screen has one job.**
3. **Presence is shown next to output where the underlying data genuinely supports it.**

## 2. Design principles

1. **Structure before decoration.** Typography, spacing, rhythm and information shape establish hierarchy before colour or effects.
2. **Density is a feature.** Operational users must be able to process real volumes of work without oversized card stacks.
3. **One primary action per screen.** Secondary and contextual actions must not compete with it.
4. **The row behind the number is the artefact.** Stats, charts and pills are entry points into real records.
5. **Plain Ghanaian English.** Prefer language such as “Sent back”, “Waiting on”, “This month”, “Given out” and other role-appropriate human wording over enterprise jargon.
6. **Colour is semantic.** Do not colour every card or use colour merely to decorate.
7. **Capability stays underneath the job.** Visual redesign must not expose architecture terminology merely because the underlying capability exists.

## 3. Foundation tokens

### 3.1 Surfaces

- Canvas: `#F4F6F8`
- Surface: `#FFFFFF`
- Surface soft: `#F8FAFB`
- Line: `#E4E9EE`
- Line soft: `#EEF1F4`
- Shell: `#0B1A2E`
- Shell raised: `#12253D`

### 3.2 Ink

- Ink 900: `#0F1723`
- Ink 700: `#22304A`
- Ink 500: `#5C6B80`
- Ink 400: `#8390A2`
- On dark: `#F5F8FB`

### 3.3 Brand

- Primary: `#0C5DF9`
- Primary hover: `#0A4EDB`
- Primary soft: `#E7EEFF`
- Ministry accent: `#168B82`

The ministry accent is reserved for objective, campaign, mission and calling-related surfaces where that distinction is meaningful. It is not a second general-purpose action colour.

### 3.4 Operational semantic colours

- Success: `#0E8E5A`
- Success soft: `#E4F4EC`
- Attention: `#B27212`
- Attention soft: `#FBF0D9`
- Risk: `#B44C3B`
- Risk soft: `#F9E5DF`
- Muted: `#7C8A9A`
- Muted soft: `#EDF0F3`

Semantic colour communicates state. Meaning must never depend on colour alone.

### 3.5 Charts

Charts derive from the same token system:

- Chart 1: Primary
- Chart 2: Ministry
- Chart 3: Success
- Chart 4: Attention
- Chart 5: Muted

Hard-coded independent chart palettes are prohibited.

## 4. Typography

The single product typeface is **Instrument Sans**, with system fallbacks.

Do not introduce Inter as a parallel product font.

Scale on a 16px base:

- Display: 2.25rem
- H1: 1.75rem
- H2: 1.375rem
- H3: 1.125rem
- Body: 1rem
- Small: 0.875rem
- Micro: 0.75rem

12px is the ordinary absolute floor for visible interface text. Smaller text requires a documented exceptional reason and accessibility review.

Weights:

- 400 body
- 500 emphasis
- 600 headings
- 700 numeric emphasis in Stats only

Tracking may tighten on large display headings. Small operational text must remain readable.

## 5. Spacing, radius and elevation

Base grid: 4px.

Preferred spacing steps:

`4, 8, 12, 16, 24, 32, 48, 64`

Avoid arbitrary one-off spacing unless the component geometry requires it.

Radii:

- controls: 8px
- small cards and compact surfaces: 12px
- primary panels: 16px
- avatars/chips: 999px

Avoid routine radii above 20px.

Elevation has three levels:

- Level 1: `0 1px 2px rgba(15,23,35,.04), 0 0 0 1px rgba(15,23,35,.05)`
- Level 2: `0 8px 24px rgba(15,23,35,.08)`
- Level 3: `0 24px 60px rgba(15,23,35,.18)`

Use borders before shadows. Do not create screen-specific shadow recipes.

## 6. Motion

Three named motion behaviours:

- **enter** — `cubic-bezier(0.16, 1, 0.3, 1)` for sheets, drawers and calm surface arrival.
- **respond** — `cubic-bezier(0.4, 0, 0.2, 1)` for taps, hover/focus responses and ordinary state movement.
- **confirm** — `cubic-bezier(0.34, 1.56, 0.64, 1)` for restrained completion acknowledgement.

Typical durations:

- feedback: 140–170ms
- surfaces: 180–220ms
- sheets/drawers: 220–260ms

`prefers-reduced-motion` is mandatory and removes non-essential motion.

## 7. Shell contract

The dark navy shell beside a bright workspace is a CEAC OS visual signature and should be protected.

### 7.1 Sidebar

- Shell uses the approved navy foundation.
- Navigation text target: 13px / 500.
- Primary touch/click targets are at least 44px where practical.
- Active state is clear without excessive glow or gradient.
- The existing generic geometric placeholder mark must not be treated as a final church identity. Until an approved mark exists, the CEAC OS wordmark is sufficient.
- Sidebar collapse may be introduced as an explicitly approved shell capability; it is not required merely to complete token migration.

### 7.2 Top bar

Desktop chrome should converge on:

- global search with a visible command hint;
- one primary blue Create control;
- communication/notification/profile affordances at equal visual weight;
- no redundant breadcrumb if the page heading already supplies context;
- no persistent clock unless the product owner explicitly re-approves it as useful operational information.

### 7.3 Sign-in

Desktop sign-in target:

- two-column composition;
- approximately 400px sign-in surface on the left;
- full-height dark CEAC OS identity/product panel on the right;
- product line: “People. Work. Ministry. Impact.”;
- no stock photography or decorative illustration;
- mobile collapses the identity panel to a restrained top band.

## 8. Component vocabulary

The existing primitive architecture is retained and migrated rather than discarded:

- Stat
- QueueRow
- Table
- Chart
- Icon
- MapPin

Add three shared primitives:

- EmptyState
- Skeleton
- Toast

Do not solve new screens with page-specific mini design systems when a shared primitive or pattern is appropriate.

### 8.1 Stat

Permanent rule: every Stat opens the records behind it.

Support three visual sizes:

- small
- medium
- large

An optional delta may be supported only when its comparison basis is factual and visible.

### 8.2 QueueRow

Age remains prominent.

Provide a visibly stronger very-late treatment at 14+ days without making the row alarmist.

Hover and keyboard focus states are mandatory.

### 8.3 Table

Tables are the primary Ledger primitive.

Required baseline:

- sticky header;
- restrained zebra treatment for long dense tables;
- numeric alignment;
- compact operational row rhythm;
- sortable columns where sorting is meaningful;
- horizontal containment on narrow screens;
- CSV export where the underlying surface already permits export;
- clear focus and row-open state.

Density preferences, column resizing, copy/print action rails and saved views require deliberate capability approval and are not to be smuggled into a visual-only migration.

### 8.4 Chart

Keep the lightweight SVG approach unless a future requirement proves it insufficient.

Charts use the Design Foundation chart tokens.

The chart/table toggle remains a strong accessibility and comprehension pattern.

Tooltips should become deliberate product UI rather than relying only on native SVG `<title>` behaviour.

### 8.5 EmptyState

Shared structure:

- coherent line icon;
- 15px title;
- 13px supporting copy;
- at most one primary action.

Empty language should explain the state rather than fill space.

### 8.6 Skeleton

Loading states should approximate the shape of the content that is arriving.

Do not replace all asynchronous loading with generic “Loading…” text.

### 8.7 Toast

Top-right on desktop, viewport-safe on mobile.

Use for short-lived confirmation and recoverable feedback, not for durable business facts.

Default dismissal target: approximately four seconds unless the user must act.

## 9. Screen archetype visual contracts

The existing Screen Archetype Contract remains structurally authoritative.

### 9.1 Monitor

Monitor screens lead with the single state or number most relevant to the role at that moment, followed by subordinate operational context.

Charts are used only when shape is faster to interpret than rows.

Role homes may share one hero/command-surface geometry with restrained role tinting. Do not invent unrelated hero styles per role.

A “since your last visit” capability is not part of the visual foundation until the underlying event comparison and product behaviour are deliberately approved.

### 9.2 Decision Queue

Queues prioritise age, decision and context.

Approved grouping vocabulary:

- Overdue
- Today
- This week
- Later

Bulk actions and keyboard processing shortcuts may be added only where the authority and state-transition model makes them safe.

### 9.3 Ledger

Ledgers are scanning surfaces, not card galleries.

Use a stable filter/action region above the table.

Right-side detail sheets are the preferred interaction pattern when opening a row would otherwise destroy scanning context.

Board, Timeline and saved-view modes are capability extensions and must be individually justified before implementation.

### 9.4 Record

Desktop target at approximately 1024px and above:

- left working record: about 65%;
- right context rail: about 35%.

Typical right context:

- timeline;
- related records;
- people;
- files/evidence.

The identity/header should remain available while the user works through a long record where that materially improves context.

Inline editing is permitted only where the underlying authority, validation and audit model safely supports the field. There is no global “make everything inline editable” rule.

Timeline language is human-readable while remaining grounded in authoritative audit/event data.

Realtime active presence is not to be invented. Show it only if a truthful presence source exists.

### 9.5 Entry

Use one form language across Assign and sheet/dialog entry surfaces:

- visible label above field;
- approximately 44–46px minimum ordinary control height;
- visible 2px primary focus treatment;
- one primary action;
- secondary action visually subordinate;
- forms remain usable with keyboard visible on mobile.

## 10. Interaction quality

Premium behaviour should communicate meaningful state change rather than provide decorative animation.

Priority moments include:

1. work-session start;
2. work sent for review;
3. approval/queue movement;
4. queue becoming empty;
5. successful submission/filing where a durable record is created;
6. an operational alert clearing for a known, explainable reason.

Each interaction must describe a real state transition. Never animate a state the backend did not confirm.

## 11. Accessibility

Minimum expectations:

- visible keyboard focus;
- no routine suppression of outlines without replacement;
- sufficient contrast;
- no colour-only meaning;
- touch targets generally at least 44px on phone;
- logical heading order;
- reduced-motion support;
- no page-level horizontal overflow at the required mobile widths;
- no ordinary interface text below the defined readable floor.

Required mobile inspection widths remain:

`320, 360, 375, 390, 414, 430`

## 12. Migration architecture

The destination is one coherent design system, not another override layer.

Target CSS architecture:

```
src/styles/
  tokens.css
  type.css
  motion.css
  base.css
  shell.css
  primitives.css
  patterns.css
  responsive.css
```

The exact file split may be refined if necessary, but responsibilities must remain explicit.

### 12.1 Migration order

1. Foundation contract and tokens.
2. Existing primitives migrated to foundation tokens; EmptyState, Skeleton and Toast introduced.
3. Shell and sign-in.
4. Record keystones: Work Detail/Item, PersonDetail, Meeting and Room.
5. Ledger surfaces.
6. Decision Queue and Monitor consistency.
7. Interaction-quality moments.
8. Remaining surfaces by archetype.
9. Legacy dependency proof.
10. Delete legacy style layers only when nothing still depends on them.

### 12.2 Legacy removal rule

Do **not** delete `styles.css` at the beginning.

Its visual authority is superseded now, but its implementation may remain temporarily as a compatibility dependency while screens migrate.

It may be removed only after:

- migrated surfaces no longer depend on its legacy selectors;
- full role/browser acceptance passes without it;
- required mobile widths pass;
- security/RLS/authority gates remain green;
- no capability is lost.

The same rule applies to `premium.css`, `premium-staff.css`, `premium-manager.css`, `premium-admin.css` and `premium-executive.css`.

The migration must reduce override debt. Adding another global “redesign.css” overlay is prohibited.

New foundation CSS should not use `!important` as ordinary architecture. Temporary compatibility exceptions must be isolated, documented and removed with the legacy layer.

## 13. What belongs in this redesign

In scope without inventing new business rules:

- unified tokens;
- Instrument Sans everywhere;
- unified semantic palette;
- chart tokenisation;
- shell visual cleanup;
- focus/hover/accessibility states;
- primitive migration;
- EmptyState/Skeleton/Toast;
- record composition;
- ledger hierarchy;
- form consistency;
- responsive visual consistency;
- truthful state-change motion.

Requires separate capability/architecture approval before implementation:

- saved views with persistence;
- user density preferences;
- universal column resizing;
- new Board/Timeline data modes;
- realtime presence;
- global universal inline editing;
- new “since last visit” computation;
- new notification behaviour;
- new business workflow shortcuts.

This boundary protects the product from hiding feature expansion inside visual refactoring.

## 14. Acceptance gates

Every migration wave must pass:

1. existing CI/build;
2. migration replay where applicable;
3. account/security and RLS/authority gates;
4. role/browser acceptance;
5. keystone screenshot/product inspection;
6. desktop and required mobile responsive inspection;
7. accessibility focus and reduced-motion inspection;
8. no capability regression;
9. no fabricated data or state.

Passing automated tests alone is not sufficient for visual acceptance.

## 15. Change control

Any deliberate visual deviation from this foundation must:

1. identify the affected token/component/pattern;
2. explain why the existing foundation fails the actual product job;
3. preserve security/data/authority contracts;
4. receive product-owner approval;
5. update this document in the same change.

Do not create a competing local visual language to solve a one-screen problem.
