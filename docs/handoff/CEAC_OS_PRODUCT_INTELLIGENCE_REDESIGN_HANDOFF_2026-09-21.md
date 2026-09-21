# CEAC OS — Current Product Redesign Handoff

**Date:** 21 September 2026
**Status:** ACTIVE SOURCE OF TRUTH for the next implementation phase.

## 1. Repository state
Repository: thestandardinst-star/ceac-os
Main contains the merged Administration & HR completion foundation from PR #17.
PR #17 merged at commit c7214dedcaec8e20057a0598c0f7c73eca369b46.

Before merge, the exact head passed:
- CI;
- clean migration replay;
- SQL RLS tests;
- Admin & HR security gate;
- Meeting authority gate;
- Playwright role/acceptance suite;
- responsive checks;
- Admin leave-policy persistence check;
- Admin Attention Rule save → reload persistence check;
- Vercel preview deployment.

## 2. Important fixes already completed
- Administration Home blocker/profile relationship disambiguated.
- Leave-request/profile relationship disambiguated.
- Admin Home no longer queries a non-existent projects.updated_at field for monthly close logic; authoritative submitted project-close records are used.
- Leave Settings uses verified upsert persistence.
- Attention Rule save verifies the saved row.
- Local role fixture now seeds a real deterministic Attention Rule so persistence is tested rather than mocked.
- mobile Admin shell has explicit width containment and viewport regression coverage.
- known test meeting titled T was removed from the live database through a controlled maintenance transaction without weakening the normal immutable meeting-record trigger.

## 3. Next branch
The next implementation branch must be created from the current main after the architecture/security lock commits.
Recommended branch name:
chatgpt/product-intelligence-experience-2026-09-21

## 4. Implementation sequence
1. Shared shell/navigation/header/design system
2. Administration intelligence surfaces
3. Meetings architecture/privacy
4. Manager refinement
5. Group Pastor / Executive refinement
6. Staff consistency
7. final responsive/accessibility/security pass

Each stage is a gate. Do not skip forward over a known defect.

## 5. Scope coverage
The redesign programme covers every reachable screen and shared surface, including:
- Sign in/authentication shell;
- Staff Home, Work, Item, Team, Record/My work history, Me, Goals;
- Manager Home, Work/Assign, Team/Person detail, Projects/Close, Calendar, Finance, Reports;
- Administration Home, Units, People/Employee detail, Attendance/Leave, Cost, Finance, Reports, Announcements, Settings;
- Group Pastor/Executive Home and shared strategic drill-downs;
- Rooms;
- Meeting scheduler, meeting detail/workspace, calendar integration;
- shared app shell, side navigation, mobile bottom navigation, More menu, top bar, breadcrumbs/context, modals/sheets, empty/loading/error/saved states.

## 6. Known redesign requirements
- Administration Home must become a visual organisation-intelligence surface without a composite score.
- Reports must become leadership-ready and use human period controls.
- Finance must show decision context, not only totals.
- Attendance must use factual time/context visuals and must not equate no session with absence.
- People must use avatar/identity patterns and stronger employee-record hierarchy.
- Units retains the workspace model but must reduce naked metric density.
- Record moves under Me and becomes My work history with human month controls.
- Admin and Manager meeting scheduling must support authorised multi-audience selection.
- private meeting notes must become genuinely author-only.
- shared decisions/actions remain explicit organisation records.
- provider/video integration remains external and server-secured.

## 7. Do not assume complete
The current product is functional but the intelligence/design programme is not complete merely because a page exists.
A page is complete only when its purpose, hierarchy, responsive composition, persistence, authority, failure state and evidence trail are all intentional and tested.

## 8. Builder discipline
Do not rebuild from memory.
Read AGENTS.md and the binding documents referenced there before changing a screen or schema.
Do not invent CEAC policy, data, targets, payroll rules, leave rules, performance judgements or currency conversions.
Do not weaken RLS to make a UI work.
Do not expose a feature as functional until save/reload or equivalent authoritative verification is tested.