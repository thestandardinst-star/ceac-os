# CEAC OS — Design System v1

**Date:** 21 September 2026
**Status:** Approved implementation source of truth for the Staff redesign and the foundation for later Manager/Admin/Executive visual work.

This document implements the product-experience architecture. It does not change security, permissions, database contracts, or Work Engine behaviour.

## 1. Design character

CEAC OS should feel like a calm, premium operating system for real work.

It is:
- structured rather than decorative;
- quiet rather than flat;
- modern without becoming fashionable or fragile;
- information-dense only where the role needs it;
- mobile-first and PWA-first.

Staff is the lightest and most personal surface. Manager becomes denser. Admin/Executive may use more command-centre composition later while retaining the same component language.

## 2. Colour tokens

### Core surfaces
- Shell / graphite: `#1C2731`
- Shell raised: `#24323D`
- Workspace: `#F3F6F7`
- Surface: `#FFFFFF`
- Surface soft: `#F8FAFA`
- Surface muted: `#EEF2F3`

### Text
- Primary: `#17232D`
- Secondary: `#56646E`
- Tertiary: `#7C8891`
- On dark: `#F7FAFB`
- On dark secondary: `#B8C2C9`

### Identity and action

CEAC OS uses two deliberately different colour roles. They are not interchangeable.

**Ministry identity — teal**
- Identity teal: `#118C83`
- Identity teal strong: `#0C766F`
- Identity teal soft: `#E4F4F2`
- Use for the CEAC mark, sign-in identity, ministry-brand accents, and restrained identity cues on Executive surfaces.

**Workspace action — electric blue**
- Action blue: `#0C5DF9`
- Action blue support: `#6498F9`
- Use for active navigation, primary workspace buttons, selected app controls, and links whose meaning is “act here”.

**Supporting indigo**
- Indigo: `#59678F`
- Indigo soft: `#ECEEF6`

Do not use teal and blue as competing primary actions on the same surface. Teal identifies CEAC/ministry context; blue identifies an application action.

### Operational states
- Success: `#2F7358`
- Success soft: `#E8F3ED`
- Warning: `#9A6815`
- Warning soft: `#FBF1DD`
- Danger: `#A04935`
- Danger soft: `#F9E9E4`

### Lines
- Line: `#DDE4E7`
- Line soft: `#EBEFF1`

Colour is semantic. Do not colour every card.

## 3. Typography

Primary family remains Instrument Sans with system fallbacks.

Scale:
- Display / primary page title: `clamp(1.55rem, 6vw, 1.95rem)`
- H2: `1.15rem–1.35rem`
- H3 / row title: `0.9rem–1rem`
- Body: `0.875rem–0.95rem`
- Supporting: `0.75rem–0.825rem`
- Eyebrow: `0.75rem`

**Operational text floor:** user-facing application text in the premium shell and role surfaces must not render below `12px` at 100% browser zoom. This is a CEAC readability rule, not a claim that font size alone establishes WCAG conformance. Decorative shapes and non-text graphics are excluded.

Use weight, spacing and hierarchy before adding colour.

## 4. Spacing

Base rhythm: 4px.

Preferred steps:
`4, 8, 12, 16, 20, 24, 32, 40, 48`.

Phone page gutter:
- 12px at the narrowest supported width;
- 14–16px on ordinary phones.

Desktop content gutters:
- 40–48px where available.

## 5. Radius

- Controls: 10px
- Small cards: 12px
- Primary cards/panels: 14–16px
- Pills: full / 999px

Avoid excessive rounding.

## 6. Elevation

Use borders first. Shadows are restrained.

- Level 1: subtle card lift
- Level 2: floating menu/sheet
- Level 3: modal overlay

Do not give every row a shadow.

## 7. Motion

- Fast feedback: 140–170ms
- Standard surface movement: 180–220ms
- Sheets/drawers: 220–260ms

Respect `prefers-reduced-motion`.

## 8. Staff navigation

### Mobile
Five destinations:
- Home
- Work
- Team
- Record
- Me

Use semantic outline icons plus labels. The bottom bar is fixed, safe-area aware, and never wider than the viewport.

### Desktop
Persistent dark graphite sidebar, light workspace.

The sidebar shows:
- CEAC OS identity;
- active unit;
- icon + destination labels;
- signed-in person.

## 9. Staff Home

Order:
1. identity / date;
2. current work-session state;
3. contextual quick actions;
4. What changed, only when meaningful;
5. Your next move;
6. Waiting on others;
7. Coming up;
8. Announcements;
9. This week.

Primary principle: actionable information is stronger than informational context.

## 10. Lists and rows

Use grouped rows/dividers for ordinary information.

Use a card/panel only when:
- the group is a meaningful conceptual object;
- it requires distinct attention;
- it contains related actions;
- it is a temporary state such as warning/error.

Rows must wrap safely and never push the viewport.

## 11. Status

Status is shown with a restrained pill and, where useful, a thin left indicator.

Do not use large coloured card backgrounds for ordinary status.

## 12. Forms

- 46px minimum ordinary control height.
- Clear labels for persistent meaning; placeholders are not labels.
- Sheet/dialog width never exceeds viewport.
- Keyboard-visible states must remain usable.
- Primary action sits after the form, not before it.

## 13. Staff Work detail

The detail page hierarchy is:
1. work identity and status;
2. returned/dependency state if present;
3. why this matters;
4. what finished looks like;
5. instructions/type-specific contract;
6. checklist or type-specific action;
7. submit/resolve/respond action;
8. supporting history.

The detail page is a working surface, not a report.

## 14. Team

Team is context, not performance.

Use progressive disclosure:
- away;
- new people;
- leadership;
- directory;
- birthdays;
- resources.

No scores, comparisons or productivity information.

## 15. Record

Record is evidence-first:
- highlights;
- history;
- time/activity.

Statistics are subordinate to actual work records and manager feedback.

## 16. Me

Me is an employee workspace:
- goals/development;
- leave;
- personal details.

Protected HR data remains outside ordinary profile storage.

## 17. Responsive acceptance

Required widths:
`320, 360, 375, 390, 414, 430`.

At each width:
- no page-level horizontal overflow;
- no clipped labels or essential controls;
- controls remain tappable;
- long names/URLs wrap;
- dense grids collapse when necessary;
- sheets fit the viewport;
- bottom navigation remains safe-area aware.

Desktop is allowed a different composition from mobile.

## 18. Accessibility

- visible keyboard focus;
- sufficient semantic contrast;
- reduced-motion support;
- tap targets generally >= 44px for primary phone interactions;
- no meaning conveyed by colour alone;
- headings preserve a logical information hierarchy.
