# CEAC OS — Staff Redesign Handoff

**Date:** 21 September 2026
**Branch:** `chatgpt/product-experience-architecture-2026-09-21`
**Pull request:** #14
**Scope owner for this package:** ChatGPT product/design lead handoff
**Base when started:** `f1d9cd35895cb6dc582c6859a8bcfd59c6b99332`

## Purpose

This package completes the current Staff visual/product-experience redesign without changing CEAC security, RLS, database migrations, Work Engine behaviour, Admin/Executive logic, or protected HR boundaries.

## Architecture locked

New binding documents:

- `docs/architecture/CEAC_OS_Product_Experience_Collaboration_PWA_Amendment_2026-09-21.md`
- `docs/architecture/CEAC_OS_Design_System_v1.md`

They lock:

- Work → Collaboration → Record → Intelligence product model;
- Today → Pulse → Insight information model;
- evidence-first deterministic intelligence;
- Staff as a personal operating surface rather than a management dashboard;
- Project Rooms / Unit Rooms / Meeting threads as the future collaboration direction;
- meeting outcomes/actions as CEAC records around an external meeting provider;
- premium charcoal/light design direction;
- mobile-first, PWA-first, zero-horizontal-overflow rule;
- no scoring/ranking/gamification;
- contextual quick actions and progressive disclosure.

## Staff redesign implemented

### Navigation

- five Staff destinations remain Home, Work, Team, Record, Me;
- semantic outline icons added to Staff mobile and desktop navigation;
- Staff desktop shell now uses the approved charcoal/slate navigation with light workspace;
- mobile bottom navigation remains safe-area aware.

### Home

- rebuilt top hierarchy around personal greeting, unit/date and current work-session state;
- current session presented as a compact operational status object;
- contextual quick actions added:
  - Open next;
  - My work;
  - My space;
- existing What changed / Your next move / Waiting on others / Coming up / Announcements / This week logic preserved;
- language remains evidence-based and avoids claiming the system knows the user's last visit.

### Work

- work source and status filters retained;
- visual hierarchy tightened;
- mobile list rows reflow rather than squeeze;
- agreed/private work creation behaviour unchanged.

### Work detail

- stronger work identity/status header;
- context sections simplified;
- Staff checklist receives a visual completion indicator;
- primary/secondary work actions clarified;
- type-specific Work Engine behaviour is unchanged.

### Team

- progressive disclosure retained;
- visual hierarchy refined;
- remains explicitly non-performance-related.

### Record

- evidence-first structure retained;
- visual hierarchy and small-screen summaries refined;
- no private work, rankings or colleague comparison added.

### Me

- goals, leave and personal workspace retained;
- visual consistency applied through the shared Staff design system;
- protected HR boundaries unchanged.

## Responsive / PWA hardening

The branch includes explicit protection against the previously observed viewport drift:

- page-level `overflow-x` prevented;
- flex/grid children may shrink;
- long names, notes, URLs and references wrap safely;
- dense grids collapse on narrow phones;
- sheets use dynamic viewport height;
- safe-area bottom/top spacing retained;
- mobile form controls use 16px text to prevent iOS Safari/PWA automatic focus zoom;
- pinch zoom remains enabled;
- reduced-motion preference is respected.

Required viewport acceptance widths:

`320, 360, 375, 390, 414, 430`.

A Playwright regression test now checks Staff Home, Work, Team, Record and Me for page-level horizontal overflow at all six widths.

## Files intentionally not redesigned

Claude-owned Administration / Executive files were not modified:

- `AdminHome.jsx`
- `Units.jsx`
- `People.jsx`
- `Attendance.jsx`
- `Cost.jsx`
- `OfficeSettings.jsx`
- `ExecutiveHome.jsx`

No migration was created.

Rooms and Zoom/meeting-provider implementation remain future packages and were not represented as fake/incomplete UI.

## Validation rule

Do not merge this package until:

1. CI build passes;
2. Account Security passes;
3. Quality Gate / Playwright passes including the new Staff viewport regression;
4. PR is current with main;
5. authenticated phone/laptop preview receives a final visual acceptance pass.

