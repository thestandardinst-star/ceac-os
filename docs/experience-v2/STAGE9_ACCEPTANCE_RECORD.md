# Experience V2 — Stage 9 Ratification Record

Date: 27 September 2026
Status: TECHNICAL RATIFICATION COMPLETE — PRODUCT OWNER ACCEPTANCE PENDING

## Ratified technical implementation

Stage 9 — Keystone Quality Gate and System Ratification

Exact technical implementation SHA:
`b87a0552dd8408f962d8d999494cdefeada773b2`

## Engineering gates

Exact-head status:
- CI — PASS
- Migration Replay — PASS
- Account Security — PASS
- Complete Quality Gate — PASS
- Vercel — PASS

Quality Gate:
- run `36320925112`
- Playwright role/acceptance suite: 179 passed
- duration: 10.4 minutes
- the Stage 6 Workload persistence scenario passed on the first exact-head run; no retry, timeout inflation, skip or weakened persistence assertion was used.

An earlier hardened implementation SHA `6e36adf1edf1a37a035133083edaae369353fb3e` also passed the complete 179-test Quality Gate. The final SHA strengthens the same fix by making selection preservation state-safe.

## Stage 9 audit outcome

### Side-by-side keystone review
Direct review covered all four accepted keystones:
- Staff Today;
- Manager Overview;
- Administration Overview;
- Executive Overview.

Required widths reviewed from exact-head Quality Gate evidence:
- 320px phone;
- approximately 390×844 phone;
- 1366×768 laptop;
- 1440×900 desktop.

The four roles read as one system while retaining their intended character:
- Staff — calm personal workspace;
- Manager — decision-led command centre;
- Administration — organisation operations console;
- Executive — restrained executive briefing.

No remaining high-severity keystone visual defect was found.

### Typography
- Experience V2 retains Instrument Sans and the accepted responsive type scale.
- Operational text floor remains 12px or above.
- No Stage 9 fix reduced text size to solve layout.

### Icons
- V2 remains on the single Lucide-backed CEAC semantic icon registry.
- Stage 9 introduced no direct Lucide imports outside that registry and no third icon language.

### Spacing and geometry
- Card/surface proportions, gutters and hierarchy remain consistent across roles.
- 1366×768 remains a first-class composition rather than a stretched desktop.
- Mobile remains recomposed rather than desktop-compressed.

### Responsive behaviour
- Existing shell tests continue to cover 320/360/375/390/414/430 widths and 1366/1440 desktop targets.
- No page-level horizontal overflow was introduced.
- Practical mobile controls retain the 44px floor.

### Information density
- Staff remains the lightest surface.
- Manager decisions lead before secondary context.
- Administration carries higher operational density without reverting to a dashboard wall.
- Executive remains summarised and exception-led.

### Accessibility and focus
Existing exact-head gates continue to verify:
- keyboard destination search;
- Escape/focus restoration for shell overlays;
- mobile More drawer focus return;
- labelled component states and ARIA attributes;
- 44px touch targets;
- reduced-motion support.

Stage 9 does not claim a formal WCAG certification.

### Performance
Production build succeeds.

Exact-head CI build output:
- CSS: approximately 392.59 kB minified / 62.14 kB gzip;
- JavaScript: approximately 1,445.57 kB minified / 359.59 kB gzip.

Vite still warns that the main JavaScript chunk exceeds 500 kB. This is recorded performance debt, not ignored. It is not a Stage 9 keystone rendering failure and the canonical sequence already assigns bundle/media and CSS-debt closure to Stage 15. Stage 10 must avoid unnecessary bundle growth.

## Defects corrected in Stage 9

### S9-01 — Manager 320px populated decision composition
Exact-head evidence showed the populated Manager decision row compressing its text track at 320px.

Correction:
- the narrow-phone decision grid now reserves the icon track explicitly and gives the decision copy the remaining width;
- action buttons wrap deliberately;
- no text-size reduction was used.

Regression coverage now asserts usable decision-copy geometry at 320px.

### S9-02 — Workload persisted-selection race
The Stage 6 Workload acceptance scenario had intermittently failed after reload while looking for the just-recorded planning-capacity reason.

Root cause identified:
- asynchronous initial/reload state could initialise person/project selection from stale render state and race an explicit user/test selection.

Correction:
- async `load()` no longer owns selection initialisation;
- scope-aware effects initialise selection;
- those effects use functional state updates, so a valid explicit selection cannot be overwritten by a stale effect;
- acceptance now asserts that the selected person remains the intended fixture before and after opening planning-capacity history.

The persisted-history assertion remains intact.

## Architecture and trust boundary

Stage 9 did not change:
- database schema;
- migrations;
- RLS;
- RPC authority;
- authentication/session rules;
- protected HR boundaries;
- no-score/no-ranking rules;
- payroll policy;
- PR #71.

No visual baseline threshold was loosened.

## Exact-head evidence

Quality Gate artifact:
- `redesign-r7-product-inspection`
- artifact ID `10932458587`
- exact SHA `b87a0552dd8408f962d8d999494cdefeada773b2`

Persistent evidence:
`CEAC OS / Experience V2 / Evidence / Stage 9 / b87a0552dd8408f962d8d999494cdefeada773b2 / stage9-r7-exact-head-evidence.zip`

## Remaining exit condition

Engineering, visual and system-ratification work is complete.

The canonical Stage 9 exit gate still requires product-owner acceptance of the keystone quality direction.

Stage 10 must not start until the product owner explicitly accepts Stage 9.
