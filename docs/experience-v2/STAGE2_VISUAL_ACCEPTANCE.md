# CEAC OS Experience V2 — Stage 2 Visual Acceptance Checklist

Date: 26 September 2026
Status: REQUIRED BEFORE STAGE 3

This checklist converts the persistent product-owner references into concrete Stage 2 acceptance criteria.

Reference package:
CEAC OS / Experience V2 / References / Original Quality References

Primary references:
- CEAC_original_premium_mockup.jpeg
- quality_reference_dashboard.jpeg
- quality_reference_typography_cards_icons.jpeg
- quality_reference_mobile_spacing.jpeg
- quality_reference_mobile_navigation.jpeg
- quality_reference_board.jpg
- motion_reference_original.mp4
- motion_reference_storyboard.jpg

## 1. Typography

PASS only if:
- Instrument Sans is visibly dominant on the proof surface;
- page/section/card/row/body/supporting/label roles are distinguishable without excessive size jumps;
- ordinary body copy reads comfortably at phone and laptop sizes;
- metadata is restrained but not tiny;
- headings do not create the oversized/stretched laptop appearance seen in the current-gap evidence;
- cards do not compensate for poor hierarchy with excessive bold text;
- labels remain at or above the 12px operational floor.

FAIL if:
- multiple local type scales appear;
- title sizes vary because of component width;
- text is shrunk to fit;
- headings consume disproportionate vertical space.

## 2. Iconography

PASS only if:
- all V2 proof icons come from the single Lucide-backed registry;
- stroke weight is optically consistent;
- navigation/control glyphs read clearly at 18–20px;
- feature glyphs remain restrained at 24px;
- icon container sizing is consistent;
- active state comes from CEAC colour/container hierarchy rather than random filled icons.

FAIL if:
- any new hand-built operational icon is introduced;
- emoji/Unicode is used as a UI icon;
- icons visibly mix stroke languages;
- individual screens choose arbitrary Lucide icons without the registry.

## 3. Spacing and geometry

PASS only if:
- spacing visibly follows the 4px semantic rhythm;
- cards have repeatable internal padding;
- component heights feel related;
- information is compact enough for real work but not crowded;
- the 1366×768 proof does not look enlarged/stretched;
- the phone proof does not feel like desktop compressed.

FAIL if:
- similar components have visibly different padding;
- content is surrounded by large unused boxes;
- dense operational rows become oversized cards;
- mobile relies on accidental wrapping.

## 4. Surface language

PASS only if:
- borders are the default separator;
- shadows are restrained;
- card radii are consistent by component role;
- ordinary information is not cardified unnecessarily;
- teal means CEAC/ministry identity;
- blue means workspace action/selection;
- semantic colours are reserved for semantic meaning.

FAIL if:
- every row is a floating card;
- shadows/radii vary without purpose;
- teal and blue compete as primary actions;
- the proof resembles a generic admin template rather than CEAC.

## 5. Controls

PASS only if:
- primary and secondary actions have distinct hierarchy;
- phone interactive targets are at least approximately 44px;
- icon buttons use a full hit area rather than only the glyph;
- hover/focus/pressed/disabled states are coherent;
- focus-visible is obvious without looking decorative.

## 6. Responsive composition

Required inspection:
- 390×844;
- 1366×768;
- 1440px+;
- at least one narrow-phone width from 320/360/375.

PASS only if:
- no document-level horizontal overflow;
- type and component proportions remain coherent;
- grids intentionally change structure;
- no clipped control/label;
- no wrapped navigation collision;
- large desktop uses max-width/composition rather than uncontrolled stretching.

## 7. Motion proof

Stage 2 only needs one contained motion proof.

PASS only if:
- Motion for React is used for layout/state movement;
- the transition has spatial continuity similar in discipline to the stored motion reference;
- interaction is interruptible/responsive;
- no bounce-heavy decorative personality;
- reduced-motion preference removes transform/layout motion appropriately;
- simple hover colour remains CSS, not Motion.

Stage 2 does NOT need the full product animation system. That comes later after geometry is proven.

## 8. Performance

PASS only if:
- icon imports are tree-shakable via the registry;
- Motion is used deliberately, not wrapped around every element;
- no stock/video media is loaded into the foundation proof;
- the proof introduces no avoidable large asset;
- CI dependency audit has no high-severity finding.

## 9. Reference comparison questions

For every proof screenshot ask:
1. Does this look intentionally composed at this exact width?
2. Is the type hierarchy as disciplined as the quality references?
3. Are icons as coherent and optically clean as the references?
4. Are card sizes and spacing predictable?
5. Is there enough density for an operations product?
6. Does anything still look like the current-gap screenshots?
7. Can the system plausibly scale across all four CEAC roles without creating new visual dialects?

Any “yes” to question 6 is a Stage 2 correction item.

## 10. Evidence

Before Stage 2 closes, persist:
- exact accepted SHA;
- phone screenshot;
- laptop screenshot;
- large desktop screenshot if available;
- list of any deliberate reference deviations and reason;
- all engineering gate results;
- dependency versions;
- BUILD_STATE update.

Stage 3 must not start on verbal confidence alone.