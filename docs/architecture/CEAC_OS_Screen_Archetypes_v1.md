# CEAC OS — Screen Archetype Contract

Every product screen has one primary information shape. This is a layout contract, not a visual theme.

## Monitor
Lead with linked `Stat` figures and factual trends. Charts always retain their table toggle.

- Home.jsx
- ManagerHome.jsx
- AdminHome.jsx
- ExecutiveHome.jsx
- Reports.jsx
- ManagerReports.jsx
- ExecutiveReports.jsx
- ResourceWorkload.jsx
- Performance.jsx
- Learning.jsx
- Strategy.jsx
- Goals.jsx
- ExecutiveOrganisation.jsx

## Decision queue
Oldest first. `QueueRow` shows age first and keeps the decision inline.

- AdminWorkflows.jsx
- Inbox.jsx
- ExecutiveWork.jsx
- ManagerWork.jsx
- AdminWork.jsx

Finance decision queues embedded in Finance surfaces use the same QueueRow contract.

## Ledger
Dense, sortable, exportable `Table`. Horizontal overflow stays inside the table container.

- Attendance.jsx
- Finance.jsx
- Cost.jsx
- AdminAudit.jsx
- People.jsx
- Units.jsx
- Workforce.jsx
- Assets.jsx
- Compliance.jsx
- AdminAuthority.jsx
- AdminPolicies.jsx
- AdminIntegrations.jsx
- AdminEvents.jsx
- Announcements.jsx

## Record
Identity/context first, then sections. A record is not a dashboard.

- PersonDetail.jsx
- Item.jsx
- Me.jsx
- Record.jsx
- Meeting.jsx
- Room.jsx
- ManagerProjects.jsx
- AdminProjects.jsx
- ManagerProjectClose.jsx
- Delivery.jsx
- AccountActivity.jsx
- AccountPassword.jsx
- ControlCenter.jsx
- OfficeSettings.jsx
- StaffTeam.jsx
- Team.jsx
- StaffCalendar.jsx
- ManagerCalendar.jsx
- ExecutiveFinance.jsx
- AdminLifecycle.jsx
- AdminProtectedHR.jsx

## Entry
Required fields first; optional structure stays behind progressive disclosure.

- Assign.jsx
- SignIn.jsx

## Rules

1. A numeric figure that matters uses `Stat` and opens its rows. If there are no rows behind it, do not display it as a Stat.
2. A decision uses `QueueRow`, is oldest-first, and keeps the action inline.
3. A ledger uses `Table`; ad-hoc repeated cards are not a ledger.
4. A chart uses the shared `Chart` primitive and therefore always has a chart/table toggle.
5. Records and entry screens may contain local tables/queues when a subsection genuinely has that shape, but their page-level archetype remains Record or Entry.
6. The canonical primitive icon set is `components/primitives/Icon.jsx`. No parallel icon library.
7. These assignments change only when the job of a screen changes, not because a new visual style is preferred.
