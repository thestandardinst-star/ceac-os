# FPG4 Acceptance Record — Proven Reusable Components

Application SHA: `900120578b318e70152d38c93de0b8d2b9a0a7c7`
Canonical documentation head at acceptance: `6d1374238b653d39995808c0a4f288d56df1768f`

FUNCTIONAL CONTRACT PRESERVED: YES
SECURITY/AUTHORITY PRESERVED: YES
REFERENCE COMPONENT PARITY: YES
RESPONSIVE ACCEPTANCE: YES

## What was extracted
- accepted Project issue-table composition → `ProjectIssueTable`
- accepted selected-record drawer composition → `ProjectWorkDrawer`

Both remain in the existing Experience V2 Project family and receive the original formatting, status, selection and navigation callbacks from `ManagerProjects`.

## Exact-head verification
At application SHA `900120578b318e70152d38c93de0b8d2b9a0a7c7`:
- CI run `37074006532`: PASS
- Migration Replay run `37074006563`: PASS after an unchanged-head retry of a transient Docker port conflict
- Account Security run `37074006565`: PASS
- Quality Gate run `37074006642`: PASS

## Visual preservation evidence
The exact-head screenshots from Quality Gate `37074006642` were extracted and inspected:
- `fpg2-project-task-gold-desktop.png`
- `fpg2-project-task-drawer-desktop.png`
- `fpg3-finance-gold-desktop.png`

Pixel comparison against the accepted pre-extraction captures found all three images identical at the pixel level. The extraction therefore introduced no visual drift in the accepted gold-standard Project/Task or Finance surfaces.
