# CEAC OS — Stage 8 Learning

**Date:** 22 September 2026
**Status:** IMPLEMENTATION CONTRACT
**Programme stage:** 8 — Learning
**Base main:** `d668cec6cef09bd19a45038c0c779992f37cce4b`
**Latest merged migration:** 087 — Performance & Development

## 1. Purpose

Build a focused learning layer that lets CEAC publish structured learning, assign it through explicit organisational rules, and record factual completion.

Stage 8 answers:
- what learning is available;
- what has been assigned to a person and why;
- what modules/resources make up a course;
- what required modules have actually been completed;
- what historical training completion was already recorded;
- what a manager can factually see for their unit.

The system records learning activity. It does not infer skill, competence, potential or performance.

## 2. Relationship to earlier specifications

The Staff panel specification described task-level "Why this matters" and "What to do" as an embedded training layer and said no separate module was needed at that time.

The newer Enterprise Expansion Architecture explicitly adds Stage 8 Learning. Stage 8 therefore adds structured organisational learning while preserving task-level guidance as just-in-time work instruction. It does not remove or replace task guidance.

The existing `training_records` table is retained as historical/completed learning evidence. Stage 8 extends it instead of creating a competing completion log.

## 3. Scope

Build now:
- published learning catalogue;
- courses;
- ordered modules;
- resources;
- assignment rules by person, unit, employment role and onboarding template;
- materialised person-level assignments;
- module completion;
- course completion;
- historical training completion;
- Administration catalogue/assignment/progress views;
- Manager factual team-learning visibility;
- Staff personal learning and completion history.

Deliberately deferred:
- quizzes/exams;
- certificates;
- certificate expiry;
- competency scoring;
- skill inference;
- skill ratings;
- recommendation algorithms;
- AI-generated learning decisions.

Those require later explicit product/policy decisions and must not be guessed.

## 4. Authority

### Learning Administration

An organisation-scoped `learning.manage` capability may:
- create draft courses;
- add modules/resources;
- publish/archive courses;
- create/deactivate assignment rules;
- see organisation learning progress;
- record historical completion;
- withdraw/restore an individual assignment;
- correct a mistaken module-completion record with a reason.

Administration status alone is not sufficient after the baseline capability grant.

### Unit Manager

A unit manager may:
- see their own assigned learning;
- see factual assignment/completion state for people in units they manage;
- inspect published course content.

A manager does not gain course-authoring or assignment authority merely by managing a unit.

### Staff

A staff member may:
- see published catalogue content;
- see their own assignments;
- open resources;
- mark their own modules complete;
- see their own current and historical completion records.

### Group Pastor

Stage 8 does not introduce a Group Pastor learning surface. A later CEAC decision may add one if required.

## 5. Catalogue lifecycle

Course:
`draft → published → archived`

Rules:
- draft content is visible only to Learning Administration;
- a course must contain at least one required module before publication;
- every module must contain at least one resource before publication;
- published course content is immutable;
- a published course may be archived;
- archived courses accept no new assignments but remain readable for existing/history records.

A correction to published learning content is a new course, not a silent rewrite of what people were assigned.

## 6. Course structure

`learning_courses`
- title;
- summary;
- optional estimated minutes;
- lifecycle state;
- creator/updater.

`learning_modules`
- course;
- position;
- title;
- summary;
- required flag;
- optional estimated minutes.

`learning_resources`
- module;
- position;
- type: link / video / document / text;
- title;
- secure HTTPS URL for external resources, or text body for text resources.

Stage 8 does not upload training files into a new storage model. Existing CEAC/Drive/web resources may be linked through HTTPS. Storage/provider integration belongs behind the Integration Gateway when CEAC confirms the need.

## 7. Assignment rules

`learning_assignment_rules` supports:
- person;
- unit;
- employment role: manager / sub-team lead / staff;
- onboarding template.

A rule records:
- course;
- target;
- optional number of days until due;
- reason;
- active state;
- who created/last changed it.

Rules materialise `learning_assignments` for real people.

Future matching:
- employment-record changes apply active person/unit/role rules;
- opening an onboarding lifecycle case applies active onboarding rules.

If several rules match the same person/course, CEAC OS creates only one person-level assignment.

Deactivating a rule stops future automatic assignments. It does not silently remove assignments already given.

## 8. Person-level assignment lifecycle

`assigned → in_progress → completed`

Administration may:
`assigned/in_progress/completed → withdrawn`

A withdrawn assignment may be restored.

No assignment state represents a quality judgement.

## 9. Completion

`learning_module_progress` stores current module state.

`learning_progress_history` records append-only completion/correction history.

A staff member may complete only modules in their own non-withdrawn assignment.

When every required module is complete:
- the assignment becomes completed;
- a linked `training_records` completion is created/updated;
- Stage 7 can use that record as future learning-history evidence.

Optional modules do not block course completion.

## 10. Historical training

Existing `training_records` remains canonical for completed-learning evidence.

Stage 8 adds:
- source: historical / learning_course;
- optional linked assignment;
- who recorded it;
- attributable correction/void metadata.

Learning Administration may record historical completion for prior training that predates the structured catalogue.

## 11. Correction and reversal

- Draft course/module/resource: edit before publication.
- Published content: immutable; archive and create a corrected course.
- Assignment rule: deactivate/reactivate with attributable audit history.
- Person assignment: Learning Administration may withdraw/restore with reason.
- Module completion mistake: Learning Administration may reopen the module with reason.
- Reopening a required module reopens the course assignment if it is no longer complete and voids the current linked training-completion record until the course is completed again.
- No hard-delete path exists for person progress/history.

## 12. Audit and events

Ordinary platform audit covers:
- courses;
- modules;
- resources;
- assignment rules;
- person assignments;
- current module progress;
- progress history;
- training records.

Semantic events:
- `learning.course_published`;
- `learning.assignment_created`;
- `learning.module_completed`;
- `learning.progress_corrected`;
- `learning.course_completed`;
- `learning.assignment_changed`.

Event payloads contain identifiers/factual state only, not resource body text.

## 13. Product experience

### Staff
- My learning;
- assignment cards;
- course detail;
- module/resource list;
- factual "x of y required modules" completion;
- Complete module action;
- completed-learning history;
- published catalogue.

### Manager
- same personal learning;
- Team learning list limited by unit authority;
- person/course/state/due/module facts only;
- no learning score or ranking.

### Learning Administration
- catalogue;
- guided course creation;
- draft module/resource authoring;
- publish/archive;
- assignment-rule creation by person/unit/role/onboarding;
- assignment/progress inspection;
- historical completion entry;
- correction/withdrawal controls.

## 14. Security

- All Stage 8 tables use RLS.
- Anonymous access is revoked.
- Catalogue authoring and assignment-rule writing require `learning.manage`.
- Person assignments/progress cannot be directly mutated by the browser.
- Module completion is an RPC bound to `auth.uid()`.
- Administrative correction/withdrawal is one reviewed `learning.manage` RPC.
- Managers can read only assignments/progress within managed units.
- Staff can read only their own assignment/progress/completion records.
- Published catalogue content is org-visible; drafts are Learning Administration only.

## 15. Acceptance

Stage 8 passes when:
- Learning Administration can create a course with modules/resources, publish it and assign it;
- person/unit/role/onboarding rules materialise real person assignments;
- duplicate matching rules do not create duplicate person/course assignments;
- Staff can complete their own required module(s);
- completion persists after reload and appears in training history;
- Manager can see factual team learning but cannot author/complete for staff;
- Administration can correct a mistaken completion with attributable history;
- no quiz, certificate, skill claim, score or ranking is fabricated;
- CI, Migration Replay, Account Security and every cumulative SQL/security gate through Stage 8 pass;
- Staff/Manager/Admin browser acceptance and responsive checks pass;
- the product surface is inspected before merge.

Stage 9 must not begin until Stage 8 is merged into `main`.
