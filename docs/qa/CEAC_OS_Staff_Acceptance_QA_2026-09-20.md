# CEAC OS — Staff Experience Acceptance QA

**Date:** 20 September 2026
**Scope:** Staff Home, Work, Team, Record, Me, session recovery, announcements, unit resources and ordinary personal details.

## Backend acceptance

Rollback tests passed for:

- stale previous-day work-session reconciliation;
- continuing a stale session creates a fresh current-day session and closes the old session at its last confirmed point;
- unrelated staff cannot reconcile another employee's session;
- blocker acknowledgement remains active until explicit resolution;
- blocker resolution is attributable and releases waiting work when no active blocker remains;
- unit-targeted announcement visibility;
- cross-unit announcement denial;
- ordinary staff cannot publish announcements;
- announcement acknowledgement is attributable;
- same-unit unit-resource visibility;
- cross-unit unit-resource denial;
- cross-unit managers cannot mutate another unit's resources;
- employee personal-details RPC writes an attribution event;
- colleague cannot read another employee's private personal-details row;
- direct employee profile update bypass is blocked.

## Client implementation status

### Navigation

Staff primary navigation:

- Home
- Work
- Team
- Record
- Me

### Home

Implemented:

- Start/End work;
- stale-session recovery;
- returned/overdue/alert/announcement-attention zone;
- due-today and in-progress work;
- upcoming events;
- near-term birthdays;
- upcoming approved leave;
- leave decision changes;
- current announcements;
- recent feedback;
- factual weekly completion.

### Team

Implemented:

- unit leadership;
- sub-team leads;
- approved leave / away this week;
- recent joiners;
- directory;
- birthdays;
- unit resources.

### Record

Implemented:

- completed Task/Deliverable timeline;
- assigned vs self-created drill-down;
- due-date/on-time facts;
- first-time review facts;
- blocker history;
- returned/corrected history;
- manager feedback;
- session history and reconciliation events.

### Me

Implemented:

- leave balance and requests;
- personal goals/reminders;
- official/basic employment facts;
- employee-editable preferred name, phone and birthday;
- private emergency contact;
- private ordinary address;
- social handles.

## Security / privacy boundaries

- Protected HR documents are not stored in ordinary profiles or unit resources.
- Ordinary colleagues cannot read private emergency/address details.
- Unit resources are isolated by unit unless deliberately organisation-visible.
- Announcements are audience-scoped by RLS.
- No employee scores, rankings or colleague comparisons were added.
- Claude-owned Admin/Executive UI files were not modified.

## Protected HR intentionally deferred

Not part of this completed Staff tranche:

- Ghana Card;
- SSNIT/tax;
- bank/payment details;
- salary;
- contracts;
- payslips;
- protected HR documents.

These require the approved protected-storage and HR verification workflow and must not be implemented with public URLs or ordinary profile fields.

## Remaining human acceptance gate

Automated build and rollback database tests cannot replace real interaction. Before merge, exercise on authenticated Staff and Manager accounts, on phone and laptop:

1. Start, end, stale-close and stale-continue work sessions.
2. Read and acknowledge an announcement.
3. Staff Team directory, leave, birthdays and unit resources.
4. Staff Record drill-downs.
5. Edit ordinary personal details and confirm they reload correctly.
6. Manager blocker acknowledge/dispute/resolve.
7. Manager unit-resource create/edit/archive.
8. Confirm no Admin/Executive regression from shared routing/navigation.

---

## Mobile architecture-correction acceptance — later 20 September 2026

Authenticated Staff screenshots exposed three classes of defects:

1. stale historical alerts were being shown as current employee attention;
2. an old seven-day manually ended work session was still counted as 179+ recorded hours;
3. Staff functionality existed but was hidden behind weak information hierarchy.

### Backend corrections verified

- completed Sunday service work has its former gone-quiet/overdue alerts retired;
- Back up August project files in `in_review` has its old gone-quiet alert retired;
- authenticated clients cannot directly mark alerts resolved;
- the historical multi-day session is flagged for reconciliation and is excluded from Record totals until corrected;
- employee-owned historical session correction is attributable;
- work-review follow-up follows the 1-day / 3-day / stop cadence;
- dependency follow-up follows the 1-day / 3-day / stop cadence;
- follow-up alerts resolve when the underlying review/dependency ends;
- private work is visible to its owner and invisible to both an ordinary colleague and the unit manager.

### Client correction completed

Home: What changed → Your next move → Waiting on others → Coming up → Announcements → This week.

Team: deduplicated/collapsible leadership, availability first, compact People, and birthdays/resources only when populated.

Work: Assigned, My agreed work and Private.

Me: Goals & development, Leave and Personal.

Record: Highlights, Work history and Time & activity, using evidence-derived highlights rather than self-scoring achievements.

### Final human visual gate

Before merge, repeat authenticated mobile review on the current deployment and verify:

1. completed Sunday service work is absent from Your next move;
2. in-review work appears only in Waiting on others;
3. review follow-up availability/cadence reads clearly;
4. dependency follow-up reads clearly;
5. Team no longer repeats the same leader for every work lane;
6. empty birthdays/resources/away sections do not consume screen space;
7. private work remains private;
8. the flagged legacy work session is excluded from totals and can be corrected;
9. Goals are immediately discoverable from Me;
10. Highlights / Work history / Time & activity read correctly on phone.
