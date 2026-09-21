# CEAC OS — Product Intelligence & Experience Amendment

**Date:** 21 September 2026
**Status:** APPROVED / BINDING for the next system-wide redesign phase
**Precedence:** Supplements the 20 September architecture amendment and supersedes conflicting product-experience text in earlier design/meeting documents. It does not weaken existing database, RLS, audit, finance, HR-protection, Work Engine, or evidence-first contracts.

## 1. Product target
CEAC OS is an operational intelligence workspace.

Universal interaction model:
**Evidence → visual context → exception → underlying facts → action.**

The product must not stop at raw numbers, cards, or paragraphs. It should reduce interpretation effort while preserving traceability.
No composite employee score, ranking, hidden judgement, inferred motivation, or black-box health score is permitted.

## 2. Twenty-second rule
A role owner opening CEAC OS should be able to answer, within roughly 20 seconds:
1. What needs my attention?
2. What changed?
3. Where are we progressing?
4. Where are we falling behind?
5. What should I open or act on next?

Visualisation exists only where it answers one of those questions.

## 3. Shared shell and information architecture
Desktop uses a stable left navigation rail, contextual application header, and light working canvas.
The header may show current role, current unit/entity, breadcrumb/context, relevant search, notifications, meeting shortcut, and signed-in avatar.

Mobile is a first-class composition, not a compressed desktop layout. Keep at most five primary bottom destinations. Secondary destinations belong in a grouped More menu.

Administration navigation:
- Organisation: Home, Units, Projects, Calendar
- People: People, Attendance, Leave
- Insight: Reports, Finance, Cost
- Collaboration: Announcements, Meetings
- System: Settings, Me

Record is not a primary Administration destination. Personal history belongs under Me → My work history.

Manager navigation prioritises Home, Work, Team, Projects, Calendar, Finance, Reports, Meetings, Me.
Staff keeps the personal execution model while aligning shared entity/header/history patterns.
Executive navigation stays intentionally sparse and strategic.

## 4. Shared entity pattern
Major entities use one recognisable identity pattern: Person, Unit, Project, Meeting.
Each entity page starts with identity, contextual metadata, authorised actions, local navigation, then progressive detail.

Person shows photo where supplied, otherwise initials avatar; name; role; unit; manager; current status/context.
Possible sections: Overview, Work, Attendance, Leave, Feedback, Employment, Protected HR.
Protected HR remains isolated from ordinary operating records.

## 5. Administration Home
Administration Home is an organisation command surface, not a card dashboard.
Required zones:
- Organisation Pulse: evidence-backed visual summaries for objectives, project movement, reporting coverage, and office/attendance context.
- Needs you: decisions/exceptions requiring Administration.
- Movement: meaningful changes since a comparable prior period.
- Unit map: compact unit-level operational context with drill-down.

Use segmented bars, progress distributions, compact trend lines, timelines or target-vs-result visuals where data supports them.
Never invent a single synthetic organisation-health score.

## 6. Units
Retain the workspace model.
Unit overview should communicate head, current objectives, project movement, reporting state, people context, attendance context, cost context, and current exceptions.
Avoid presenting unrelated naked numbers.

## 7. People
People becomes a real directory and employee-record experience.
Directory rows include avatar/photo, name, role, unit, manager, and one relevant current context state.
No performance leaderboard or score.
Employee detail uses the shared Person entity pattern and progressive disclosure.

## 8. Attendance & Leave
Attendance is operational context, not performance.
Primary structure: Today, History, Recorded differences, Leave.
Use session timelines, approved leave context, and recent factual patterns where useful.
Not started must never be presented as equivalent to absence.
Recorded differences are neutral records for review, not fraud flags.

## 9. Reports
Reports is both a reporting workflow and a leadership-intelligence surface.
Period controls use human dates such as September 2026, never raw technical values such as 2026-09 as the primary interaction.
For an open or closed period show reporting coverage, units submitted/outstanding, objective results, project outcomes, major challenges, target-vs-result measures, and relevant cost/finance context where supported.
The finished organisation report should be presentation-ready for leadership.

## 10. Finance
Keep currencies separate unless CEAC explicitly supplies an approved conversion policy.
Administration should see, by currency: planned, committed, spent, remaining, movement by unit/project, and requests requiring decision.
Manager Finance should answer what the unit can use, what has been spent, what is committed, what has been requested, and request status.
Use decision visuals, not decorative charts.

## 11. My work history
The current Record concept remains valid as factual personal history, but moves under Me and is renamed My work history.
Replace raw month input with human month/year, previous/next controls, and a month picker.
History combines highlights, work history, and time/activity context.
Statistics remain subordinate to actual records and feedback.

## 12. Meetings — revised operating model
A meeting is a first-class CEAC operational object around an external provider.

Audience builder:
Authorised organisers may combine multiple audiences where authority permits: multiple units, sub-teams, project collaborators, and specific people.
The interface shows the resolved participant count before scheduling.

Before the meeting, shared editable information is title, schedule, audience, agenda, and related context/files.
Before the scheduled start, meeting-note entry must not masquerade as during-meeting notes.

During the meeting separate:
- My notes — private to the author.
- Shared decisions — visible to authorised participants.
- Actions — authoritative CEAC work records.
- Agenda/reference context.

After the meeting show shared decisions, resulting work/actions, meeting outcomes, unresolved dependencies, and each user's own private notes.

Privacy contract:
Personal meeting notes must never be readable by other participants merely because they attended the same meeting.
Existing shared meeting-record storage must be migrated/refactored before the private-notes experience is represented as complete.

## 13. External meeting provider
CEAC does not build its own conferencing stack.
Provider integration remains replaceable. CEAC owns the meeting object, participants, agenda, private notes, decisions, actions, outcomes, and audit trail.
Zoom or another provider is transport.
Any provider SDK, token/signature creation, credentials, or privileged API call must remain server-side. Browser code must never contain provider secrets.
Desktop may use a split workspace if supported: meeting/video plus CEAC agenda/private notes/actions.
Mobile may use a provider view plus CEAC sheets/tabs.
Provider support must be verified against current official SDK documentation before implementation.

## 14. Manager intelligence
Manager Home is a unit command surface: immediate decisions, today, objective progress, project movement, team context, dependencies, reporting, upcoming meetings, and meaningful recent changes.
No employee score.

## 15. Executive intelligence
Group Pastor / Executive views prioritise objectives, strategic project movement, major exceptions, reporting silence, material cost/finance movement, decisions requiring leadership, and change over time.
Do not expose staff task walls by default.

## 16. Visualisation rules
Approved chart families:
- horizontal progress / target-vs-result
- segmented status distribution
- small trend line
- timeline strip
- compact distribution bar

Avoid decorative pie-chart walls, speedometers/gauges, synthetic health percentages, and rainbow dashboard cards.
Every visual must answer a named question, state its time window where relevant, use recorded data, open to supporting evidence, and remain understandable without colour alone.

## 17. Design-system expansion
The shared system must define application shell, top bar/breadcrumb, desktop/mobile navigation, avatar/identity, entity header, stat/trend/progress, timeline, table/list row, filter/search, segmented controls/tabs, sheet/modal, loading/empty/error/saved/unsaved states, accessibility/focus, and responsive contracts.
Use one consistent outline icon family after dependency/security review.

## 18. Implementation sequence
After the Administration foundation is merged:
1. shared shell/navigation/header/design system
2. Administration intelligence surfaces
3. Meetings architecture and privacy
4. Manager refinement
5. Group Pastor / Executive refinement
6. Staff consistency
7. final responsive/accessibility/security regression pass

Each stage is a gate. Do not proceed past a known functional, persistence, security or responsive defect.

## 19. Completion criteria
The redesign phase is complete only when:
- every reachable page has intentional desktop and mobile composition;
- important configuration actually persists and is tested after reload;
- no primary surface has accidental horizontal overflow at supported widths;
- all role boundaries are enforced in the database, not merely hidden in UI;
- every consequential action has an authoritative record;
- every management visual is evidence-backed and drillable;
- private meeting notes are genuinely private;
- protected HR remains isolated;
- CI, migration replay, RLS/security gates and role acceptance tests are green.