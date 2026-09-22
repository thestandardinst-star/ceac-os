# CEAC OS — Stage 7 Performance & Development

**Date:** 22 September 2026
**Status:** IMPLEMENTATION CONTRACT
**Programme stage:** 7 — Performance & Development
**Base main:** `af16cc2214fc56e001337f8f6bb830fb8464643a`
**Latest merged migration:** 086 — Resource & Workload

## 1. Purpose

Build an evidence-first review and development process from work CEAC OS already recorded.

Stage 7 must help a staff member and reviewer answer:
- what factual work, objective, feedback, activity-context and existing training records fall inside the review period;
- what the employee says about that period;
- what the assigned reviewer says, in narrative form;
- what was agreed in the review conversation;
- what development focus and next steps were agreed;
- what continuous feedback has been recorded and how the employee responded.

The system assembles evidence. Humans make the judgement.

## 2. Governing rules

- No composite employee score, percentage, rating, ranking, league table or hidden judgement.
- Attendance/work-session data is context only, never a performance conclusion.
- Staff can see every review record and feedback item about themselves. Draft manager narrative is not secret.
- Every important figure/statement must trace to recorded evidence.
- No AI judgement or inferred competence, effort, motivation, honesty or potential.
- Administration & HR's own performance is outside this system, as locked in the Admin & HR panel spec.
- Executive/Group Pastor performance is not introduced by this stage.
- Stage 8 Learning is not implemented here. Existing `training_records` may appear as historical evidence only.

## 3. Authority

### Administration
An organisation-scoped `performance.admin` capability may:
- open/close review periods;
- see review cases across the organisation;
- assign/reassign the reviewer with a recorded reason;
- inspect evidence and process state;
- act as reviewer only where the review case explicitly names that person as reviewer.

Admin status alone is not sufficient authority.

### Unit Manager / assigned reviewer
A reviewer may write the manager narrative, record the review conversation, record/revise a development plan and share/close the review only when the review case names that reviewer.

### Staff member
A person may:
- see their own review case and evidence pack from the start;
- submit/revise their reflection through append-only entries;
- see manager narrative as soon as it is recorded;
- add a right-of-reply entry;
- see development plans about themselves;
- respond to continuous feedback.

UI visibility is not the security boundary. Database policies/RPC checks enforce these rules.

## 4. Existing records reused

Stage 7 keeps:
- `appraisal_cycles` as review-period anchors;
- `appraisals` as one review case per person/period;
- `feedback_notes` as continuous feedback;
- `training_records` as existing historical completion evidence.

Stage 7 does not create a second appraisal system.

## 5. Review case lifecycle

Review period:
`open → closed`

Review case:
`evidence → reflection_submitted → manager_draft → conversation_recorded → shared → closed`

Transitions are descriptive workflow state, not quality grades.

A review may move forward even if the employee has not submitted reflection; CEAC's governing principle is flag, never block. The UI must show what is missing rather than inventing or forcing a judgement.

## 6. Evidence packs

`appraisal_evidence_items` is append-only snapshot evidence generated from authoritative rows inside the review dates.

Permitted categories:
- `work` — completed Task/Deliverable rows assigned to the person;
- `objective` — strategy nodes explicitly owned by the person;
- `feedback` — feedback notes about the person;
- `activity_context` — recorded work sessions, clearly labelled as context;
- `learning_history` — existing completed `training_records`.

Each evidence item stores its source type/id and a factual JSON detail object.

Important limitation: Stage 7 does **not** attach unit reporting compliance to an individual merely because they manage that unit. The current records do not prove personal authorship strongly enough for that attribution.

Evidence generation never creates a score.

## 7. Review writing

`appraisal_entries` is append-only.

Entry types:
- `employee_reflection`;
- `manager_assessment`;
- `conversation_record`;
- `staff_response`.

A revision is a new row with `supersedes_id`. Earlier wording remains history.

## 8. Development plans

`development_plan_versions` is append-only.

Each version records:
- review case;
- person;
- assigned reviewer;
- development focus;
- desired outcome;
- agreed next steps;
- start/target dates;
- state: active/completed/closed;
- reason for the version;
- who recorded it and when.

A revision or closure is another version, never an overwrite.

This is a development record only. Learning catalogues, course assignment, certifications and skill engines remain Stage 8.

## 9. Continuous feedback

Existing `feedback_notes` gains factual context:
- kind: observation / recognition / guidance;
- optional Work, Project or Strategy context;
- occurred-on date.

New feedback is recorded through an authorised RPC so identity/scope cannot be forged by the browser.

`feedback_responses` is append-only and lets the person reply to feedback about themselves.

## 10. Audit and events

Stage 7 records ordinary-platform audit history for:
- review periods/cases;
- evidence items;
- review entries;
- development-plan versions;
- feedback and feedback responses.

Semantic events:
- `performance.review_cycle_opened`;
- `performance.evidence_generated`;
- `performance.review_entry_recorded`;
- `performance.review_shared`;
- `performance.development_changed`;
- `performance.feedback_recorded`;
- `performance.feedback_response_recorded`.

Payloads contain identifiers/workflow metadata only, not the narrative text itself.

## 11. Correction and reversibility

- reflection/assessment/conversation/right of reply: append a superseding entry;
- evidence refresh: append only missing source rows; never silently alter captured evidence;
- reviewer correction: explicit reassignment RPC with reason;
- development-plan correction: append a new version with reason;
- continuous feedback is immutable; employee response is separate history.

No hard delete is part of Stage 7.

## 12. UI

Add **Performance & development** to authorised Administration and Manager workspaces.

Staff access is from **Me → Reviews & development** and through direct authorised routing.

Required role views:

### Administration
- open review period;
- see review-period progress as factual case states, not employee scores;
- see missing reviewer assignments;
- assign/reassign reviewer with reason;
- open any review case.

### Reviewer
- assigned review cases;
- evidence pack with drillable factual rows;
- record manager narrative;
- record review conversation;
- record/revise development plan;
- share/close review.

### Staff
- own evidence pack;
- reflection;
- manager narrative visible when recorded;
- review conversation record;
- right of reply;
- development plan/history;
- continuous feedback and responses.

## 13. Product language

Prefer:
- Review period
- Your reflection
- Manager assessment
- Review conversation
- Development plan
- Feedback

Do not use:
- score;
- rating;
- rank;
- productivity score;
- performance percentage;
- high/low performer;
- potential score.

## 14. Tests

Required:
- migration replay;
- no anonymous access;
- direct browser mutation blocked where RPC authority is required;
- `performance.admin` required for organisation administration;
- reviewer limited to explicitly assigned cases;
- employee always able to read their own case/evidence/narrative;
- employee can write only reflection/right-of-reply/feedback response for themselves;
- evidence comes only from real source rows in the review period;
- evidence refresh is idempotent;
- append-only entry/development history;
- audit/event evidence;
- persistence after reload;
- Staff/Manager/Admin browser acceptance;
- desktop/mobile responsive acceptance;
- all Stage 0–6 gates remain green.

## 15. Acceptance

Stage 7 passes when Administration can open a review period, CEAC OS automatically creates review cases/evidence for eligible employees with recorded reviewers, a staff member can submit reflection, the assigned reviewer can record narrative and conversation, both can see the same evidence/history, a development plan can be recorded and later revised without destroying history, and no score/ranking/hidden judgement is produced.

Stage 8 must not begin until Stage 7 is fully green, product-inspected and merged into `main`.
