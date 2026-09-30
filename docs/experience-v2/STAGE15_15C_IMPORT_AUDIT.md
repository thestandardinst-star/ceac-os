# CEAC OS Experience V2 — Stage 15C Import / Visual Ownership Audit

Date: 30 September 2026
Substage: 15C — Icon and dead visual cleanup
Implementation checkpoint: `7d4062af7b47acae780139686bc0e2343ce2adaa`

## Canonical V2 icon boundary

The V2 icon registry remains:

- `src/experience-v2/icons.jsx`
- Lucide-backed
- the only icon implementation imported by V2 code.

The Stage 15 debt contract continues to enforce that V2 code does not import:

- `lucide-react` directly outside `icons.jsx`;
- `src/components/primitives/Icon.jsx`;
- `src/components/bits.jsx`.

## Legacy bits icon system

The earlier hand-built shell/icon implementation in `src/components/bits.jsx` has been retired.

Removed exports/logic include the unused legacy:

- Icon;
- MobileTopBar;
- AppTopBar;
- SideNav;
- Tabs;
- old tab/group/menu helpers.

The file remains load-bearing for non-icon compatibility utilities such as:

- Pill;
- FieldGroup;
- ProductNotice;
- EmptyState;
- LoadingState;
- Avatar;
- StatusDistribution;
- ProgressMeter;
- SectionHeader;
- statusPill;
- Sheet.

Those utilities are used by accepted deep/non-V2 screens and are not removed in 15C.

## Legacy primitive icon system

`src/components/primitives/Icon.jsx` remains intentionally retained.

It is still imported by the legacy primitive set, including:

- `Stat.jsx`;
- `QueueRow.jsx`;
- `Chart.jsx`;
- `EmptyState.jsx`.

That primitive set remains reachable from the Administration-only Design Primitives compatibility route:

- `src/screens/DesignPrimitives.jsx`;
- routed from `src/App.jsx` when `tab === "primitives" && isAdmin`.

Therefore this implementation is still load-bearing compatibility code. Removing or migrating it would broaden 15C into redesign work and is not justified by current ownership evidence.

It is not imported by Experience V2.

## Dead visual components removed

The production import graph proved the following components unused and they have been removed:

- `src/components/PremiumShell.jsx`;
- `src/components/ReferenceDashboard.jsx`.

The deterministic Stage 15 debt contract now asserts that these files remain absent.

## 15C decision

The safe cleanup boundary is reached:

- V2 has one canonical icon registry;
- the unused legacy shell/icon implementation is retired;
- two visual components proven unused are removed;
- remaining legacy icon/utility code is explicitly classified as load-bearing compatibility code;
- no accepted surface is redesigned;
- no role/capability/auth/RLS/RPC/schema authority changes were made.

The next required action is exact-head Level B verification of this implementation boundary, followed by product evidence inspection and 15C acceptance if green.