# CEAC OS — R6 Whole-System Route & Experience Audit

**Date:** 23 September 2026
**Programme:** Premium Redesign
**Branch:** `chatgpt/ceac-experience-recovery-architecture-2026-09-23`
**R6 purpose:** prove that every routed capability has an approved visible home before legacy navigation is removed.

## Decision rule

The premium role shell is the ordinary navigation. Legacy architecture routes are retained only where the capability is still required, but they are reached from a contextual workspace or Control Center rather than exposed as a second module catalogue.

No database, RLS, audit, protected-HR or authority contract is changed by R6.

## Route disposition

| Existing capability/route | R6 disposition | Approved visible home |
|---|---|---|
| Home | Keep/redesign | Today / Overview by role |
| Work | Keep/redesign | Work |
| Team | Keep/redesign | Team |
| Staff Calendar | Keep/redesign | Calendar |
| Messages | Keep/redesign | Global Messages |
| Me / Record | Merge/embed | My Hub / profile |
| Strategy | Embed/rename | Executive Ministry; contextual goals elsewhere |
| Delivery | Embed/rename | Executive Portfolio; Projects/Reports elsewhere |
| Workload | Embed | Manager Team → Workload |
| Workforce / Attendance | Merge/embed | Time & Leave; Manager Team → Availability; My Hub leave |
| Performance | Embed | Person/employee Development |
| Learning | Embed | My Hub / Person / Employee workspace |
| Assets | Embed | My equipment / Person Equipment / employee workspace |
| Compliance | Embed | Policies & requirements / Person context / Control Center |
| Cost | Merge | Administration Finance → Expenses |
| Finance | Keep/redesign | Finance / Manager Budget / Executive Finance |
| Reporting | Keep/redesign | Reports |
| People | Keep/redesign | Administration People |
| Lifecycle | Embed | Employee workspace actions; People Operations context |
| Protected HR | Embed | Authorised employee Private HR |
| Units | Embed | Administration organisation context |
| Admin Projects | Embed | Work/organisation/project context |
| Admin Calendar | Embed | Time/meeting context and Create → Meeting |
| Audit | Advanced/contextual | Control Center → Activity log |
| Events | Advanced-only | Control Center → Advanced diagnostics |
| Workflows | Advanced/contextual | Control Center → Automations |
| Policies engine | Advanced-only | Control Center → Organisation rules |
| Integrations | Merge/redesign | Control Center → Connected Apps |
| Authority | Merge/redesign | Control Center → Access & permissions |
| Office settings | Contextual | Control Center → Organisation |
| Announcements | Contextual | Messages / authorised communication flows |

## R6 visible cleanup

The mobile **More** surface previously re-exposed transitional architecture labels even though desktop had already moved to the premium role shell. R6 removes that duplicate catalogue.

Mobile More is now derived only from approved role navigation:
- Staff: secondary approved destinations such as Calendar and Messages.
- Manager: Calendar, Budget, Reports and Messages.
- Administration: Reports, Control Center and Messages.
- Executive: Organisation, Finance, Reports and Messages.

Underlying routes are not deleted. Contextual links and Control Center remain responsible for capability reachability.

## Acceptance

R6 adds browser coverage for all four mobile role shells to verify:
- no legacy architecture catalogue appears in More;
- approved secondary destinations remain reachable;
- Messages remains one tap away;
- no horizontal overflow at phone width.

R6 is complete only when the full cumulative Quality Gate, security/RLS gates and Playwright suite are green.
