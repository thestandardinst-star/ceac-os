# CEAC OS — Approved Architecture Amendment

**Date:** 20 September 2026  
**Status:** APPROVED PRODUCT DECISION — binding  
**Applies to:** Architecture v4, Master Build Brief v9, Staff Panel Spec v1, Manager Panel Spec v1, Admin & HR Panel Spec v1, Group Pastor Panel Spec v1  
**Decision owner:** CEAC product owner  
**Implementation rule:** Where an older document conflicts with this amendment, this amendment wins. Do not simplify these decisions away. A later consolidated architecture may absorb this document, but until then every coding agent must read it before changing work, templates, people/profile, reports, manager home, or Admin & HR People.

---

## 1. Why this amendment exists

The live Manager review on 20 September exposed an important distinction between a system that merely records work and a system that helps CEAC operate well.

CEAC OS must be intelligent without depending on generative AI. Its intelligence comes from:

- the context the system already knows;
- different behaviour for different kinds of work;
- reusable templates and institutional memory;
- deterministic rules and calculations;
- automatic prefill;
- exception detection;
- historical patterns that CEAC itself has approved;
- transparent reminders and escalation rules;
- evidence already produced by normal work.

The system must reduce repeated entry and repeated judgment. It must not make people re-enter information it already knows.

**New governing rule: never ask again for something the system already knows or can safely derive from an approved rule.**

---

## 2. No AI — locked

CEAC OS will not use generative AI, LLM APIs, Claude API, OpenAI API, or any other inference service as part of the product.

This is not a temporary v1 omission. It is an approved product decision.

### 2.1 Consequences

1. Remove AI as a dependency from the architecture.
2. Do not add an AI interpretation button to Reports.
3. Do not add AI-generated summaries to the Group Pastor panel.
4. Do not add an AI task breakdown service.
5. Do not add a chatbot that interprets CEAC records.
6. Do not design any core flow that fails or degrades because an AI service is unavailable.
7. Do not create a recurring AI inference cost.
8. Existing or future language such as "smart", "intelligent", "suggest", "remember", or "learn" must refer to deterministic product behaviour unless explicitly redefined by a later approved architecture decision.

### 2.2 What replaces AI

Use:

- rules;
- templates;
- recurrence;
- prefilled context;
- database queries;
- thresholds approved by CEAC;
- prior approved structures;
- trend calculations;
- exception detection;
- explicit user confirmation.

The system may generate plain factual sentences from known rows, for example:

- "3 deliverables are still open and this project ends in 4 days."
- "Finance is the acknowledged blocker on 6 work items this month."
- "Sunday Production was recorded on all four scheduled Sundays."
- "This objective has no active work attached to it."

Those are deterministic facts, not model interpretation.

---

## 3. Deterministic Intelligence Layer

This is now a first-class architectural layer across all four panels.

It has five responsibilities.

### 3.1 Context awareness

Every screen should use the context that brought the user there.

Examples:

- Give out work opened from a project preselects that project.
- Give out work opened from an objective preselects that objective.
- Work opened from a sub-team preselects that sub-team.
- A manager working in one of several units sees the active unit context carried through.
- A project close pre-fills evidence already approved for that project.
- A report pre-fills the period evidence already recorded.

Context must never create hidden cross-unit access. RLS remains authoritative.

### 3.2 Institutional memory

CEAC OS remembers approved operating structures through templates and prior records, not machine learning.

It should make reuse easier than rebuilding from zero.

### 3.3 Rule-based guidance

The interface changes according to the selected work type and asks only questions relevant to that type.

### 3.4 Exception detection

The system surfaces things that require human attention instead of requiring managers to inspect every record.

Examples include:

- overdue unfinished work;
- a project nearing its end with open deliverables;
- a scheduled routine occurrence not recorded;
- an active objective with no supporting work or activity for an approved period;
- an acknowledged blocker ageing past its follow-up point;
- a report not filed in an open reporting period;
- a contract or HR document nearing expiry;
- an incomplete required HR record;
- approved leave overlapping an assignment period;
- a request waiting beyond its configured response point.

Exception rules must be explainable. Every flag must open to the rows or rule behind it.

### 3.5 Evidence-based management facts

The system may combine rows into factual management statements, but it must not infer motives, honesty, effort, competence, or performance.

No composite score. No employee ranking. No hidden judgment.

---

## 4. One Work Engine, seven behaviours

CEAC OS keeps one shared Work Engine underneath all work types.

This does **not** mean the seven work types behave the same.

The shared engine exists so CEAC does not build seven separate copies of ownership, permissions, dates, references, evidence, comments, activity history, notifications, project links and reporting.

### 4.1 Shared work capabilities

Where relevant, all work types reuse:

- organisation;
- unit;
- sub-team/work lane;
- project;
- phase;
- objective;
- responsibility;
- owner/assignee;
- creator;
- unique CEAC work reference;
- title/short name;
- purpose/context;
- created date;
- due date or response date;
- original due date;
- movement/reschedule history;
- visibility/confidentiality;
- activity log;
- evidence/files/links;
- comments/discussion when Messages exists;
- blocker relationships where appropriate;
- notification rules;
- auditability;
- role-based visibility.

Each type then adds its own states, required fields and completion contract.

### 4.2 Work types are not labels

The existing kinds remain:

- Task
- Routine
- Case
- Request
- Decision
- Meeting outcome
- Deliverable

**APPROVED PRODUCT DECISION: do not collapse these into a single Task type and do not treat kind as display-only metadata.**

---

## 5. Work-type behaviour

The assignment screen must show a short plain-language explanation immediately when a type is selected. The manager should never have to know CEAC OS terminology in advance.

### 5.1 Task

**UI explanation:** "A specific action for someone to complete."

Purpose: ordinary actionable work.

Behaviour:

- one owner;
- may be attached to project/objective/sub-team;
- may have a completion checklist;
- checklist is optional when the manager intentionally leaves execution method to the assignee;
- manager may add or remove checklist steps explicitly;
- visible "Add another step" control; do not rely on blur-to-create as the only discovery mechanism;
- checklist completion and evidence feed the existing submit/review/return loop;
- a manager's own task follows the manager self-certification rule.

If the manager knows the result but not the method, the UI must support:

**"No steps needed — let the assignee determine the method."**

The expected result remains clear even when method is not prescribed.

### 5.2 Routine

**UI explanation:** "Work that repeats on a schedule."

Purpose: recurring operational responsibility.

Behaviour:

- recurrence is intrinsic, not a future enhancement;
- supports daily, weekly, monthly and custom weekday schedules;
- optional start date;
- optional end date;
- pause/resume without destroying history;
- each occurrence is separately traceable;
- changing the routine affects future occurrences only;
- historical occurrences never rewrite;
- routine may optionally record a number/value and a value label;
- routine does not require a strategic objective;
- routine may belong to a unit, sub-team and responsibility;
- missed/late occurrences may surface through deterministic attention rules;
- routine structure can be saved/reused as a template.

The live schema already has recurring_operations and operation_occurrences. Claude must extend/reconcile these rather than blindly creating a duplicate recurrence system.

### 5.3 Case

**UI explanation:** "A matter that stays open while several actions or follow-ups happen around it."

Purpose: work where the matter itself is the object, not one task.

Behaviour:

- has a named owner;
- has opened date and optional target resolution date;
- may contain multiple linked Tasks, Requests, Decisions, notes and evidence;
- remains open while those actions happen;
- does not close automatically because one child action completed;
- closes only when the case owner records the resolution/outcome;
- resolution is retained permanently with history;
- reopened cases, if permitted later, must preserve the original closure history.

Examples may include an equipment issue, an operational matter, a staff/administrative matter where access permissions allow it, or another multi-step issue.

Case visibility must respect confidentiality and role permissions.

### 5.4 Request

**UI explanation:** "Something you need another person or unit to provide, arrange or resolve."

Behaviour:

- records requester;
- records responsible person and/or responsible unit;
- may be within the same unit or across units;
- records what is needed and by when;
- may link to project/objective/case;
- states must distinguish waiting from fulfilment;
- required outcomes: fulfilled, declined, returned for clarification, cancelled;
- response history is retained;
- waiting/response age participates in the established reminder/follow-up/escalation discipline;
- a request must not be confused with a blocker: a blocker says current work cannot proceed; a request is work in its own right.

### 5.5 Decision

**UI explanation:** "A choice that someone needs to make and record."

Behaviour:

- records the question or decision required;
- records who has authority to decide;
- records due date where applicable;
- stores relevant context/evidence links;
- completion requires the decision itself;
- completion requires a rationale/note unless CEAC later explicitly makes rationale optional for a defined class;
- decision record is permanent and attributable;
- follow-up Tasks or Requests may be created from the decision;
- those follow-up items link back to the decision.

### 5.6 Meeting outcome

**UI explanation:** "An action or commitment agreed in a meeting."

Behaviour:

- records what was agreed;
- records owner;
- records due date;
- records meeting source;
- meeting source may initially be manual: title, date and optional note;
- later, where a Calendar meeting exists, it may link to that event;
- it follows through as owned work rather than remaining meeting minutes;
- completion/review follows the appropriate action/evidence contract;
- the original agreement/source remains visible.

### 5.7 Deliverable

**UI explanation:** "A finished output that must be produced and shown."

Behaviour:

- completion centres on the expected result/output;
- expected finished result is explicit;
- evidence may be required: file, link, document, image, recording or another permitted evidence type;
- checklist may exist only if the product later explicitly allows a delivery checklist; do not silently treat Deliverable as a Task checklist today;
- submission/review evaluates the delivered output;
- project close may prefill deliverables from approved evidence;
- a deliverable can exist without prescribing every execution step.

---

## 6. Give out work — approved information architecture

The manager should be able to create useful work even when they know the result but do not know the execution method.

### 6.1 Base flow

The core questions are:

1. What do you need?
2. What kind of work is it?
3. Why does it matter? — optional when obvious
4. What result do you expect?
5. Who owns it?
6. Which part of the team?
7. Is it part of a project/objective?
8. When is it needed?
9. Type-specific questions only.

The order may be refined in the later visual-design pass, but the information contract remains.

### 6.2 Copy

Replace vague manager copy with plain explanations.

Manager Home guidance:

**"Start with anything waiting for your decision, then check your team and your own work."**

Give out work guidance:

**"Describe what needs to happen and what result you expect."**

Do not tell the manager that the title matters less than something else in abstract language.

### 6.3 Work-type help

Keep all seven types. Show the one-line explanation next to/below the type selector or in another immediately visible, low-noise treatment.

Do not hide the meaning behind documentation.

### 6.4 Checklist interaction

For Task:

- show Step 1;
- show an explicit "Add another step";
- allow removal/reorder where practical;
- allow "No steps needed — let the assignee determine the method."

Do not require a manager to invent execution steps solely to satisfy the software.

---

## 7. Templates — first-class institutional memory

Templates are now a required architectural capability.

### 7.1 Purpose

Templates preserve good CEAC operating patterns so managers do not recreate repeated work from memory.

### 7.2 Who creates them

A template can be created:

- explicitly by an authorised manager/admin from scratch;
- from an existing good work item, routine, project structure or other supported object;
- from a completed/approved item after the user chooses "Save as template";
- from a deterministic prompt when the system detects repeated substantially identical structure.

The system never silently creates and activates a template.

### 7.3 Deterministic template suggestion

"System-created" means rule-driven suggestion, not AI generation.

Example rule:

If an authorised user repeatedly creates the same work kind with the same/similar approved title pattern, sub-team, recurrence, expected result and checklist structure, CEAC OS may say:

**"You have created this kind of work several times. Save it as a template?"**

The user confirms and names/edits the template before it becomes reusable.

Similarity detection must initially be conservative and explainable. Exact or normalized field matching is preferred over opaque fuzzy scoring.

### 7.4 Template scope

Templates may be:

- personal draft templates;
- sub-team templates;
- unit templates;
- organisation templates where authorised.

Organisation-wide publication is an Admin/HR or explicitly granted capability, not automatic.

### 7.5 Template contents

Depending on work type, a template may store:

- work kind;
- name/title pattern;
- purpose/context;
- expected result;
- instructions;
- checklist;
- evidence requirements;
- recurrence;
- typical due timing/lead time;
- sub-team;
- responsibility;
- project/objective relationship rule where appropriate;
- meeting-source expectations;
- request/decision fields;
- type-specific defaults.

Do not hard-code a person into an organisation template unless the authorised creator intentionally chooses a specific role/owner and the model supports it safely.

### 7.6 Template use

Using a template creates a draft/pre-filled work record. The manager reviews before sending.

Templates never silently assign work.

### 7.7 Template edits and history

- editing a template affects future use only;
- existing work created from a previous template version never changes;
- recurring work already completed never changes;
- preserve template version/history sufficiently to explain which structure produced a work item;
- archive rather than destructively delete a template that has produced historical work.

### 7.8 Routine relationship

Routine and template are related but not identical.

- A Routine is live recurring work.
- A template is reusable structure.
- A Routine may be created from a template.
- A Routine's future occurrences inherit its current approved structure.
- Editing the Routine changes future occurrences, not historical ones.

---

## 8. Deterministic attention and prevention rules

This layer should prevent avoidable management errors without taking human decisions away.

Examples approved for architecture:

### 8.1 Assignment warnings

When enough data exists:

- assignee has approved leave overlapping the due period;
- assignee is inactive;
- selected project is closed;
- selected objective is closed/not applicable;
- due date is before project start or after project end;
- manager is assigning outside the active unit/context;
- required evidence/result field for the selected kind is missing.

Warnings explain the issue and allow the authorised human to correct or proceed where policy permits.

### 8.2 Project attention

Examples:

- project ends within a configured window and open deliverables remain;
- at-risk/not-met objective;
- objective has no active work attached;
- participating unit has not filed its close;
- overall close is stale after reopen.

### 8.3 Routine attention

Examples:

- occurrence due but not recorded;
- recurring numeric value missing where the routine requires one;
- routine paused;
- repeated missed occurrences shown factually, not as a score.

### 8.4 Cross-unit waiting

Use the existing two-sided blocker discipline:

Day 0 submitted → Day 1 reminder → Day 3 follow-up then stop → Day 5 Administration → Day 10 Group Pastor.

Only acknowledged blockers count upward. Unanswered claims remain "waiting for reply." Disputed claims are not silently treated as fact.

### 8.5 HR attention

Examples:

- required employee detail not provided;
- submitted identity detail waiting for HR verification;
- contract/document expiry approaching;
- requested correction waiting on HR;
- leaver record/open work requiring reassignment.

Every rule needs a clear source row and clear explanation.

---

## 9. Team and sub-team presentation

Sub-teams remain work lanes, not rigid organisational silos.

A sub-team may be empty and still hold work/objectives. A person may work across units/sub-teams according to authorised membership.

However, the Team and Admin People views must use sub-team membership to make the organisation understandable.

### 9.1 Manager Team view

Within the active unit:

- show unit head context;
- group people under the sub-team(s) they are assigned to;
- show sub-team lead where one exists;
- people with no sub-team appear under "General unit" or "Not assigned to a part yet";
- preserve the ability for a person to belong to more than one lane where the data says so;
- grouping is presentation, not a new permission boundary.

Example:

Media and Technical  
Unit Head — Frank

Photography  
Sub-team lead — [name if assigned]  
Gabriel  
...

Videography  
...

Graphics  
...

### 9.2 Admin & HR People view

Admin & HR needs an expandable organisational directory:

Organisation → Unit → Unit head → Sub-teams → sub-team lead/members.

Units and sub-teams can expand/collapse.

Clicking a person opens the authorised employee record.

This replaces a flat People list as the long-term information architecture.

---

## 10. My Work and Manager wording

"Add agreed work" remains a valid concept: work the person already agreed to carry outside the formal assignment flow.

For a manager, do not say "your manager does not approve it first."

Use wording such as:

**"Add work you already agreed to carry. It appears immediately in your record and does not need separate approval before you start."**

Manager-owned completion still follows the self-certification contract and must not enter the manager's own review queue.

---

## 11. Reports wording

Rename user-facing "Manager narrative" to:

**Manager's summary**

Suggested prompt:

**"What should leadership understand about this period?"**

The summary explains context the numbers cannot express. It must not duplicate or overwrite factual evidence.

"Challenges or context" remains separate.

There is no AI interpretation.

Submitted reports remain frozen/versioned according to the current reporting contract.

---

## 12. Employee & HR Record — approved model

Every CEAC user has a personal/employee record: staff, managers, Administration & HR and Group Pastor.

The same data model applies across roles, with permissions controlling who may edit or see each field.

### 12.1 Employee-editable profile

The person may maintain:

- profile photo;
- preferred name;
- phone number(s);
- birthday/date of birth field as approved by HR presentation rules;
- emergency contact;
- social handles;
- ordinary contact/address information required by CEAC.

These changes remain attributable.

### 12.2 Employee-submitted, HR-verified information

The employee may submit:

- Ghana Card number/details;
- Ghana Card front image;
- Ghana Card back image;
- SSNIT number;
- tax identification details;
- next-of-kin details/supporting information;
- certificates/qualifications and evidence;
- bank/payment information required for payroll;
- other HR identity/employment evidence explicitly configured by CEAC.

### 12.3 Verification lock

Before HR verification, the employee may correct their submitted information.

After HR verifies a protected identity/payroll field:

- employee can see its status;
- employee cannot directly overwrite the verified value/document;
- employee requests a correction;
- HR performs/approves the correction;
- the previous verified state and correction history remain auditable.

Ordinary contact information such as phone/social handles may remain directly editable according to policy.

### 12.4 HR-controlled information

Admin & HR controls:

- official full name;
- employee/staff number;
- job title;
- unit membership;
- sub-team membership/lead where applicable;
- reporting line;
- contract/employment type;
- employment status;
- joined/start date;
- salary/payroll classification;
- official HR documents;
- other employment fields defined by approved HR policy.

### 12.5 Employee-visible documents

Where permission allows, the employee can see:

- own contract;
- own payslips;
- policies acknowledged;
- HR documents CEAC marks as employee-visible;
- verification status of sensitive submissions.

### 12.6 Sensitive-data display

Normal employee and manager screens must not unnecessarily expose full sensitive identifiers.

Example:

**Ghana Card — Verified**

rather than rendering the complete number and images in an everyday profile view.

Reveal full sensitive data only in an authorised HR context where it is necessary.

### 12.7 Access rules

**Employee:** own allowed profile fields, own documents, own verification statuses.

**Manager:** ordinary management information needed to manage work and availability. A manager does not gain Ghana Card, SSNIT, tax, bank/payment or equivalent sensitive HR access merely by managing the person.

**Admin & HR:** full authorised employee record, including protected identity/payroll documents, with auditability.

**Group Pastor:** only the HR information explicitly permitted by the final Admin/Executive access policy; do not assume unrestricted sensitive-document access solely from executive status unless the approved panel contract says so.

### 12.8 Protected storage

Ghana Card images, contracts, certificates and other sensitive HR files must use protected storage.

Requirements:

- no permanent public URLs;
- access checked server-side/RLS/storage policy;
- least privilege;
- attributable upload and verification;
- document type and owner recorded;
- archive/version rather than silent overwrite for verified documents;
- deletion/retention follows the eventual CEAC retention policy.

Claude owns the database/storage migrations for this capability.

---

## 13. Current live-schema relationship — 20 September 2026

This amendment is architectural. It does not pretend the backend already supports everything.

Live Supabase currently includes, among other tables:

- work_items with the seven work kinds;
- recurring_operations;
- operation_occurrences;
- responsibilities;
- sub_teams;
- sub_team_members;
- profiles;
- unit_memberships;
- projects/objectives;
- submissions/reviews;
- blockers;
- work_sessions;
- reports;
- leave;
- finance.

Important current facts:

1. The seven work kinds exist today, but the client/backend do not yet give all seven the distinct behaviours defined above.
2. recurring_operations and operation_occurrences exist and should be evolved for full Routine recurrence rather than duplicated without cause.
3. profiles currently holds only basic identity/employment fields; it is not yet the full employee record defined here.
4. There is no approved complete template library contract in the live schema yet.
5. Sensitive employee document/verification storage is not yet implemented to this specification.

**Do not fake these features in the client before the data contract exists.**

---

## 14. Backend contracts Claude must reconcile

Claude applies all migrations. Claude must inspect the live state, including migrations 031–033 already applied in Supabase but not yet reconciled into repository migration history, before adding anything.

The next backend design must support, without weakening current RLS:

### Typed work

- type-specific state/fields or related tables;
- Routine recurrence + future occurrence generation;
- Case parent/child actions and explicit resolution;
- Request requester/responsible party + response states;
- Decision authority + decision/rationale + follow-up links;
- Meeting outcome source + ownership;
- Deliverable evidence/completion contract.

Prefer extensions/related tables over a single work_items table filled with unrelated nullable columns if that would make integrity weak.

### Templates

- template identity and scope;
- type;
- active/archive state;
- versioning or immutable historical reference;
- structured type-specific template data;
- creator/owner;
- permissions;
- template-to-created-work provenance.

### Employee/HR record

- self-editable profile extension;
- sensitive identity/payroll records;
- emergency contact/next of kin;
- social handles;
- certificates/qualifications;
- document metadata;
- verification state;
- correction request/history;
- protected storage policies;
- Admin/HR full-access path;
- manager-safe limited view;
- audit events.

Do not store sensitive HR data in generic public profile columns merely because it is easy.

---

## 15. Product decisions that agents must not undo

1. No generative AI anywhere in CEAC OS.
2. Seven work kinds remain and behave differently.
3. One shared Work Engine underpins them.
4. Routine means recurrence now, not "later."
5. Task checklist may be omitted when the assignee should determine the method.
6. Templates are a required first-class capability.
7. The system may suggest saving repeated structure as a template using deterministic rules; user confirms.
8. Template edits never rewrite historical work.
9. Team/People views group people by real sub-team membership while preserving sub-team-as-work-lane semantics.
10. My Work supports agreed work entered by the person.
11. Reports use "Manager's summary"; no AI interpretation.
12. Every role has a fuller Me/employee record.
13. Ghana Card includes number/details plus front/back images.
14. Verified sensitive identity/payroll information cannot be directly overwritten by the employee.
15. Admin & HR has the authorised full employee record.
16. Managers do not get sensitive HR identity/payroll data merely because they manage someone.
17. Sensitive documents use protected storage, never permanent public links.
18. No score/ranking/composite performance number.
19. Intelligence must be explainable and traceable to rules/data.
20. Future visual redesign may change appearance, but must not remove these functional contracts.

---

## 16. Acceptance gates for the new architecture

These gates are required as the corresponding features are built.

### Work types

- selecting each kind displays a plain-language explanation;
- each kind exposes only relevant fields;
- Routine creates traceable scheduled occurrences and preserves history;
- Case remains open until an explicit resolution;
- Request records requester/responsible party and response outcome;
- Decision cannot be completed without the recorded decision;
- Meeting outcome retains meeting source and ownership;
- Deliverable requires the configured output/evidence contract;
- no type leaks data across RLS boundaries.

### Templates

- save existing suitable work as a template;
- use template to prefill a new draft;
- edit before assigning;
- archive template without breaking historical work;
- template version/edit does not alter existing work;
- deterministic repeated-work suggestion never creates a template without confirmation;
- permissions prevent a unit manager from publishing organisation-wide templates unless authorised.

### Deterministic intelligence

- context preselects known project/objective/sub-team correctly;
- leave-overlap warning is factual and non-blocking unless policy explicitly requires a block;
- project/routine/HR attention flags open to evidence;
- no hidden score;
- no AI/API call.

### Employee record

- employee can edit allowed ordinary fields;
- employee can submit Ghana Card front/back and required details;
- HR can verify;
- employee cannot overwrite a verified protected field;
- employee can request correction;
- manager cannot access protected identity/payroll data;
- Admin & HR can open the complete authorised record;
- sensitive files are not publicly accessible;
- all verification/correction actions are attributable.

---

## 17. Implementation sequence

This amendment does not authorise a broad rewrite.

Use this order:

1. **Architecture first** — this document and agent instructions become the source of truth.
2. **Client clarity now** — Manager copy, work-type explanations, explicit Add another step, My Work wording, Team grouping, Manager's summary label. These require no invented backend.
3. **Claude backend reconciliation** — recover live migrations 031–033 into repository history; then design typed-work, templates and employee/HR schema/storage alongside the already waiting backend items.
4. **Client integration** — connect the new contracts after migrations exist.
5. **Acceptance** — real accounts, phone and laptop.
6. **Visual redesign** — a coherent design-system pass across Staff, Manager, Admin & HR and Group Pastor after information architecture stabilises.

Do not combine the visual redesign with schema migration work.

---

## 18. Existing backend work still waiting

This amendment does not erase the previously identified backend queue:

- reconcile live migrations 031–033 into repository migration history;
- approved-work reopen/reversal;
- Messages/project discussion persistence;
- stronger report evidence semantic scope validation;
- canonical Finance reversal convention.

Typed work, Templates and Employee/HR Record now join that roadmap. They must be sequenced deliberately rather than mixed into one unsafe migration.

---

## 19. Visual design

The current functional UI is accepted as a working build, not as the final visual standard.

A later design pass will substantially improve the contemporary visual quality across all panels.

That pass may change:

- typography;
- spacing;
- card/list treatment;
- metric presentation;
- navigation treatment;
- forms;
- sheets;
- hierarchy;
- responsive layout;
- empty/error states;
- report visualisation.

It may **not** change the approved operating logic in this amendment merely for visual convenience.


## 20. Homepage architecture — return through usefulness, movement and clarity

The homepage on every CEAC OS surface is a command centre, not a filing cabinet.

Its job is not merely to display information. It must help the user understand, within seconds:

- what needs attention now;
- what changed since the last visit;
- what is moving well;
- what is stuck;
- what should be done next;
- what is coming up.

The goal is consistent return through usefulness, movement, clarity and role relevance — not through gamification, artificial rewards or visual decoration alone.

### 20.1 Return-behaviour principles

The home experience should deliberately create four useful return triggers:

**Freshness** — the page changes when work, reviews, blockers, leave, reporting, projects, routines or deadlines change.

**Progress** — the user can see real movement: completed work, reviews cleared, routines recorded, project deliverables moving, reports filed and blockers resolved.

**Clear next action** — important homepage blocks lead directly to an action or canonical detail screen.

**Human relevance** — each role sees information that matches its actual responsibility. Staff, unit managers, Administration & HR and Group Pastor must not receive the same generic dashboard with different labels.

### 20.2 Visuals serve meaning

The homepages should become more visual, but visuals are not decoration.

Use visual treatment to make information faster to scan and act on:

- restrained status colour;
- progress bars where there is a real denominator;
- compact status stacks;
- mini trend lines where a time series exists;
- calendar/timeline strips;
- simple composition visuals;
- human/avatar presence where appropriate;
- strong typography and spacing hierarchy;
- meaningful icons only where they improve recognition.

Do not add charts merely to make a screen look sophisticated.

No number or visual may imply a performance judgment that the underlying data does not support.

### 20.3 Homepage information hierarchy

Across roles, home should normally follow this hierarchy:

1. **Context / top summary** — date, active unit/role and one factual sentence about the day.
2. **Needs attention now** — actions specifically waiting on this user.
3. **Pulse / movement** — a small set of meaningful, clickable operational indicators.
4. **Progress / status** — work/project/routine/report movement appropriate to role.
5. **Upcoming** — deadlines, leave, project milestones, calendar/ministry events and reporting dates.
6. **Recent activity** — factual recent movement relevant to the user.
7. **Quick actions** — the most common actions for that role.

The exact visual arrangement may change during design work, but the hierarchy should remain unless real usage proves a better order.

### 20.4 Actionability rule

A meaningful homepage count, status, chart point, progress segment or alert must open the records or canonical screen behind it.

Examples:

- "3 pending reviews" opens those three reviews.
- "2 overdue deliverables" opens those deliverables.
- "4 HR records incomplete" opens the relevant People/HR records.
- "3 units have not filed" opens those named units.
- "1 project closes this week" opens that project.

A homepage must not become a dead display layer.

### 20.5 Priority over density

Do not show everything because the database contains it.

Home is not an analytics warehouse.

Show:

- what is actionable;
- what changed;
- what is time-sensitive;
- what gives useful context for today's decisions.

Secondary detail belongs behind drill-down.

When nothing requires attention, the screen should become calmer rather than filling space with empty warning cards.

---

## 21. Staff Home

Staff Home answers:

**"What do I need to do, what changed, and what should I deal with next?"**

### 21.1 Priority areas

Staff Home may contain:

- returned work needing correction;
- new/changed work;
- overdue and due-today work;
- waiting-on items;
- recent manager feedback;
- leave decision/status when relevant;
- upcoming calendar items;
- this week's real progress;
- announcements where implemented;
- personal work-session state;
- quick access to Add agreed work where permitted.

### 21.2 Visual emphasis

The staff home should feel personal and focused, not administrative.

Prefer:

- a clear Today section;
- one attention block;
- a short progress strip for the current week;
- upcoming items;
- recent movement/feedback.

Do not display colleague rankings, unit averages or comparative productivity.

### 21.3 Motivation boundary

The product may show factual completion and closure, such as:

- "3 of 5 due items finished";
- "2 items approved";
- "1 returned item left to correct."

It must not use points, badges, streaks, artificial praise loops or manipulative performance pressure.

---

## 22. Manager Home

Manager Home is an operational command centre.

It answers:

**"What needs my decision, what is happening in my team, what is stuck, and what needs attention next?"**

### 22.1 Order

The approved operating order remains:

1. waiting on the manager;
2. team today;
3. stuck / waiting both ways where data exists;
4. manager's own work;
5. projects needing attention;
6. current-week / upcoming operational view.

The visual design may combine some of these into a cleaner layout, but must not hide the distinction.

### 22.2 Manager pulse

Useful manager-home visuals may include:

- work awaiting review;
- leave waiting for action;
- acknowledged blockers waiting on the unit;
- present / approved leave / not started;
- due today / overdue;
- completed or submitted today;
- open deliverables on projects nearing close;
- routine occurrences due/missed when Routine is fully built;
- reporting status when a reporting period is open.

Presence and output must remain separate.

### 22.3 Manager quick actions

Role-relevant quick actions may include:

- Give out work;
- Add agreed work;
- Review submitted work;
- Create/open project;
- Record/manage routine when available;
- Open report/report draft.

Do not turn the home into a large menu. Show the few actions that match the manager's actual day.

### 22.4 Copy

Home guidance remains:

**"Start with anything waiting for your decision, then check your team and your own work."**

---

## 23. Role-adaptive manager Home

The Manager surface shares one architecture but can adapt emphasis using the unit's actual work mix and configured capabilities.

This does not mean hard-coded separate applications for Media, Facilities, Finance, Programs or another unit.

Examples:

**Media and Technical** may surface deliverables, project deadlines, reviews, production routines and sub-team movement more prominently.

**Facility, Procurement and Logistics** may surface Cases, Requests, recurring operational checks, unresolved facilities work and upcoming maintenance-style routines more prominently once those work types are implemented.

The adaptation must come from work types, responsibilities, unit configuration, templates and actual records — not hard-coded assumptions about a named unit.

---

## 24. Administration & HR Home

Administration & HR Home is an organisation operating control room.

It answers:

**"What needs Administration action, what is incomplete or approaching risk, and where does the office need follow-up?"**

### 24.1 Priority areas

Useful Admin Home areas include:

- leave or administrative decisions waiting;
- work sitting with managers past the escalation point;
- blocker disputes/escalations;
- reporting periods and units not filed;
- employee records incomplete;
- HR identity/payroll details waiting for verification;
- contracts/documents approaching expiry when the HR record is built;
- office attendance/leave snapshot;
- payroll/cost actions when their modules are ready;
- units/projects gone quiet according to approved deterministic rules;
- upcoming office/ministry dates relevant to Administration.

### 24.2 Organisational pulse

Admin should see patterns at office altitude, not every person's task feed.

Examples:

- units filed / started / not started for an open report period;
- staff present / on approved leave / not started;
- HR verifications waiting;
- contracts/documents due for attention;
- stalled reviews by responsible manager;
- acknowledged blockers that have reached Administration.

Counts must drill to names/records.

### 24.3 Quick actions

Examples:

- People;
- verify employee record;
- open reporting period;
- attendance/leave action;
- administrative settings relevant to the current alert.

---

## 25. Group Pastor / Executive Home

The Group Pastor homepage is a high-level ministry and office view.

It must not become a task manager for the entire organisation.

It answers:

**"What is being achieved, where is intervention needed, what is changing, and what requires my decision?"**

### 25.1 Priority areas

Useful executive Home areas include:

- actions requiring Group Pastor approval/decision;
- escalated cross-unit blockers;
- ministry objectives and their explicit statuses/results;
- significant projects/campaigns/events needing attention;
- reporting coverage;
- units/projects that have gone quiet under approved rules;
- falling numeric routine/objective trends where sufficient comparable data exists;
- office presence as numbers rather than a surveillance-style named list;
- delivery and cost shown together at the appropriate altitude;
- upcoming critical ministry dates.

### 25.2 Executive visual treatment

Prefer:

- a small number of high-value sections;
- trends with clear time periods;
- project/objective status;
- named escalations;
- factual summaries generated from records;
- drill-down when detail is needed.

Avoid raw task lists unless the Group Pastor explicitly owns the work.

---

## 26. Recent activity

A recent-activity layer may make Home feel alive, but it must be role-scoped and factual.

Examples:

- work submitted;
- work approved/returned;
- blocker acknowledged/resolved;
- project started/closed/reopened;
- reporting period opened;
- report submitted;
- routine occurrence recorded;
- leave approved;
- HR record submitted/verified where the viewer has permission.

Do not expose private/confidential information through activity feeds.

Do not show activity simply to increase engagement. Show it only when it helps the role understand recent movement.

---

## 27. Visual status language

Use visual status consistently across CEAC OS.

General direction:

- neutral — ordinary/current;
- blue/informational — upcoming or in progress where useful;
- amber — attention required;
- brick/red — overdue, returned or materially blocked where the existing product semantics support it;
- green — completed/approved/healthy factual state.

Colour never carries meaning alone; text/status remains visible for accessibility.

Do not use excessive colour across every card.

---

## 28. Homepage acceptance gates

Before a role homepage is considered complete:

1. The user can identify the most important next action within a few seconds.
2. Important counts/visuals drill to their source records.
3. The screen separates presence, availability and output.
4. The screen does not show invented or comparative performance measures.
5. Empty/quiet states reduce clutter rather than displaying meaningless zero-card walls.
6. The page reflects the active unit/role correctly.
7. New activity changes the relevant homepage state without requiring duplicate reporting.
8. Phone and laptop layouts preserve the same information hierarchy.
9. No confidential/private record is exposed through summary cards or activity.
10. The homepage remains useful if visual decoration is removed; visuals enhance meaning rather than substitute for it.

---

## 29. Homepage build sequence

Homepage redesign should proceed incrementally while Claude remains unavailable.

Codex may work now on client-only homepage improvements that use existing, authorised data contracts.

Recommended sequence:

1. Manager Home first, because it has been reviewed directly and has the richest currently available operational data.
2. Staff Home second, reusing the visual language but preserving the simpler staff hierarchy.
3. Administration & HR Home after reviewing Claude-owned current code and without changing Admin-owned screens unless ownership is explicitly handed over or Claude is available.
4. Group Pastor Home after the executive information hierarchy is verified against current data.

Do not fabricate backend-dependent Routine, HR verification, Messages or typed-work states before Claude supplies their contracts.

The later cross-product visual-design pass should consolidate these home patterns into a coherent design system rather than independently styling each screen.


---

*Approved architecture amendment — 20 September 2026. This document is binding until incorporated into a later consolidated CEAC OS architecture.*
