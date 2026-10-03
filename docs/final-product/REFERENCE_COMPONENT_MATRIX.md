# Reference Component Matrix

Reference status:
- LOCKED-REPO: source bytes are repository-addressable.
- LOCKED-ASSET: exact source is locked by immutable Library file ID and exact filename and has been directly inspected.
- IMPLEMENTED/PASS requires direct visual comparison; source identity alone is not acceptance.

| ID | Surface | Component | Reference status | Acceptance |
|---|---|---|---|---|
| HOME-01 | Home | shell/navigation/top command | LOCKED-REPO | PASS FPG9 |
| HOME-02 | Home | hero/greeting/imagery | LOCKED-REPO | PASS FPG9 |
| HOME-03 | Home | schedule/Needs attention/Waiting/Coming up | LOCKED-REPO | PASS FPG9 |
| PROJECT-01 | Work | dark left project/stage tree | LOCKED-ASSET PROJECT-A | PASS FPG2 |
| PROJECT-02 | Work | project/task header + real stage/status controls | LOCKED-ASSET PROJECT-A | PASS FPG2 |
| PROJECT-03 | Work | board/table/calendar switch | LOCKED-ASSET PROJECT-A | PASS FPG2 · unavailable views remain truthfully disabled |
| PROJECT-04 | Work | dense task table/columns/row geometry | LOCKED-ASSET PROJECT-A | PASS FPG2 |
| PROJECT-05 | Work | status/tag/assignee treatment | LOCKED-ASSET PROJECT-A | PASS FPG2 |
| PROJECT-06 | Work | selected-record right drawer | LOCKED-ASSET PROJECT-B | PASS FPG2 |
| PROJECT-07 | Work | evidence/subtasks/activity treatment | LOCKED-ASSET PROJECT-B | PASS FPG2 · truth-limited |
| PROJECT-08 | Work | auxiliary schedule/progress visual treatment | LOCKED-ASSET PROJECT-C | optional truthful use |
| FINANCE-01 | Finance | metric card anatomy/icons | LOCKED-ASSET FINANCE-A | PASS FPG3 |
| FINANCE-02 | Finance | chart geometry/axes/labels | LOCKED-ASSET FINANCE-A | PASS FPG3 · truthful recorded movement only |
| FINANCE-03 | Finance | ledger/table/tabs/filters | LOCKED-ASSET FINANCE-A | PASS FPG3 |
| PEOPLE-01 | People | employee list/cards/avatars | LOCKED-ASSET PEOPLE-A | PASS FPG7 |
| PEOPLE-02 | People | employee workspace/detail panel | LOCKED-ASSET PEOPLE-A | PASS FPG7 |
| PEOPLE-03 | Workforce | leave/workforce calendar | LOCKED-ASSET PEOPLE-A | PASS FPG7 |
| PEOPLE-04 | Workforce | schedule/absence/event/status blocks | LOCKED-ASSET PEOPLE-A | PASS FPG7 |

Acceptance requires FUNCTIONAL CONTRACT PRESERVED=YES; SECURITY/AUTHORITY PRESERVED=YES; REFERENCE COMPONENT PARITY=YES; RESPONSIVE ACCEPTANCE=YES.
