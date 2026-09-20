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
