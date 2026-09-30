# CEAC OS Experience V2 — Stage 3C Acceptance Record

Date: 26 September 2026

Status: ACCEPTED

Exact accepted implementation SHA:

`2ff50401115cc3d14b95cb2983dcbe4c82afa83b`

## Accepted scope

Stage 3C completes the shared interaction and state primitives for Experience V2:

- Tooltip;
- Popover/Menu;
- Drawer/Sheet;
- Modal/Dialog and confirmation dialog;
- Skeleton/Loading;
- Empty, error, configuration and success state surfaces;
- Toast/Confirmation;
- focus trapping, Escape dismissal and focus restoration.

No role screen was rebuilt during Stage 3C.

## Engineering verification

The exact accepted SHA passed:

- CI;
- Migration Replay;
- Account Security;
- Complete Quality Gate, including role/RLS Playwright coverage;
- Vercel deployment.

The first Stage 3C verification exposed a real PopoverMenu defect: Escape and item selection closed the menu, but focus restoration targeted the wrapper span instead of the trigger button. The shared primitive now restores focus to the actual button.

The first full Quality Gate attempt on the final exact SHA encountered two unrelated legacy/flaky failures outside the Stage 3C changes. The failed job was rerun without changing product code; the full job, including the Stage 3C tests and all role/RLS checks, then passed.

## Visual verification

Rendered evidence was inspected at:

- phone: 390 × 844;
- laptop: 1366 × 768;
- large desktop: 1440 × 900.

Open-state proof was also inspected for:

- responsive phone drawer at 390 × 844;
- laptop modal at 1366 × 768.

Accepted findings:

- no horizontal overflow or viewport clipping;
- drawer content and primary action remain reachable on phone;
- modal is centered, readable and appropriately bounded on laptop;
- backdrop, hierarchy, close affordances and action placement remain coherent;
- base controls, data primitives and state surfaces retain the accepted Stage 2/3 density and typography direction.

Persistent evidence:

`CEAC OS / Experience V2 / Evidence / Stage 3 / 3C / 2ff50401115cc3d14b95cb2983dcbe4c82afa83b`

## Decision

Stage 3 is accepted. Stage 4 — Shell V2 may begin from this exact accepted implementation checkpoint.
