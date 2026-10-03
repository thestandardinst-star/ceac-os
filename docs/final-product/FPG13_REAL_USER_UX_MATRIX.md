# FPG13 — Real-User Workflow + UX Acceptance Matrix

Date: 3 October 2026

FPG13 uses the existing authenticated CEAC role fixtures and real application workflows. It does not create a second synthetic UX framework.

## Core end-to-end journeys

| Journey | Roles | Existing acceptance contract | UX / product proof |
|---|---|---|---|
| Assign → execute → submit → return → correct → resubmit → approve → history | Manager + Staff | `Staff and Manager complete the real work loop, including return and approval` | actionable work states, correction loop, evidence/review clarity, final history |
| Blocker → acknowledge → resolve | Staff + Manager | `A blocker can be raised, acknowledged by the manager, and resolved` | dependency visibility and recoverable state |
| Deep-link / refresh / Back | Staff | `Nested Work navigation survives refresh and browser Back` | route continuity and navigation predictability |
| Personal details + private work privacy | Staff + second staff identity | `Staff personal details persist and private work stays out of another staff account` | self-service persistence and privacy boundary |
| Contextual Unit Room communication | Manager + Staff | `Unit Rooms carry attributable communication between Manager and Staff` | attributable collaboration without unrestricted DMs |
| Unit meeting audience | Manager + Staff | `A Manager can schedule a Unit meeting with an explicit audience and Staff can open it` | meeting discoverability and audience correctness |
| Cross-unit meeting | Administration | `Administration can combine multiple units into one meeting audience` | operational coordination |
| Finance request → staged authority → evidence → actual spend | Manager + Finance manager + Administration + Executive | `Closure finance journey separates request, authority, evidence reference and actual spend` | authority clarity, truthful finance state, evidence continuity |
| Staff whole-product journey | Staff + Administration | `Closure corridor preserves the Staff Fixture journey across CEAC OS` | Work history, meetings, room, performance, learning, compliance, employee context, asset and audit continuity |
| Workforce / leave | Staff + Manager + Administration | Stage 9 Workforce acceptance + FPG7 People/Workforce reference acceptance | schedule/absence visibility and truthful approval state |
| Payroll | Administration + Executive | `FPG6 Payroll gives Administration preparation and Executive protected review surfaces` | prepare/approve separation and protected data |
| Reference-parity cross-role surfaces | Staff + Manager + Administration + Executive | `FPG10 propagates the accepted Work, Finance and People reference grammar across roles` | cross-role consistency and responsive composition |
| Mobile shell and Administration destination matrix | Manager + Administration + Executive + Staff | phone-width and shell acceptance tests | no page-level horizontal overflow; reachable primary surfaces |
| Connected Apps secret handling | Administration | `Stage 12 Connected Apps keeps provider secrets server-bound on mobile` | no browser-visible provider secrets |

## Acceptance criteria

FPG13 passes only if the exact-head Level B cumulative run proves:
- every role fixture authenticates through the normal application shell;
- the real Staff→Manager work loop completes end-to-end;
- authority-gated Finance and Payroll journeys remain separated correctly;
- private/protected data does not leak across role boundaries;
- route refresh/back and mobile composition remain usable;
- accepted FPG visual parity remains intact while workflows operate;
- SQL/authority, Migration Replay, Account Security, evidence merge and role/RLS closure all pass.

No score, survey metric or invented user feedback is substituted for executable workflow evidence.
