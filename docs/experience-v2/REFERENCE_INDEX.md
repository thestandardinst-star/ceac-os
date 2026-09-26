# CEAC OS Experience V2 — Reference Index

Date: 26 September 2026
Status: BINDING REFERENCE MAP

The visual references must not live only in Chat history. They are persisted in the user's Library so both Chat and Work can recover them independently of a conversation.

Library root:
CEAC OS / Experience V2 / References

Repository source-of-truth files:
- docs/experience-v2/START_HERE.md
- docs/experience-v2/BUILD_STATE.md
- docs/experience-v2/CEAC_OS_EXPERIENCE_V2_SOURCE_OF_TRUTH.md
- docs/experience-v2/IMPLEMENTATION_SEQUENCE.md
- docs/experience-v2/ACCEPTANCE_AND_HANDOFF.md
- this file

## Reference precedence

For visual/product work, use this order:

1. Current Experience V2 source-of-truth and acceptance contract.
2. User-supplied quality references and motion reference in Library.
3. Original CEAC premium mockup/reference composition.
4. Existing approved CEAC premium redesign/source-of-truth documents in the repository.
5. Role panel/architecture specifications for functionality and authority.
6. Existing implementation only as evidence of current behaviour, never as the quality ceiling.

Security/data/authority contracts always outrank visual ideas.

## Original Quality References

Library folder:
CEAC OS / Experience V2 / References / Original Quality References

Files:
- CEAC_original_premium_mockup.jpeg
  - the CEAC composition/mockup reference supplied by the product owner;
  - establishes the product's own navigation/workspace composition direction.
- quality_reference_dashboard.jpeg
  - establishes desired enterprise-dashboard craftsmanship, spacing, icon treatment and information hierarchy.
- quality_reference_typography_cards_icons.jpeg
  - establishes desired typography discipline, card anatomy and coherent iconography.
- quality_reference_mobile_spacing.jpeg
  - establishes desired mobile density, hierarchy, spacing and visual polish.
- quality_reference_mobile_navigation.jpeg
  - establishes desired mobile navigation, component consistency and layout quality.
- quality_reference_board.jpg
  - compact board combining the above for quick comparison.
- motion_reference_original.mp4
  - original product-owner-supplied interaction reference; preserve for highest-fidelity motion review.
- motion_reference.mp4
  - compressed lightweight review copy of the same interaction reference.
- motion_reference_storyboard.jpg
  - key-frame storyboard for fast inspection without loading the video.

The reference products' brand colours/content are NOT to be copied. They set the quality bar for typography, geometry, spacing, motion, visual hierarchy and interaction.

## Observed Current Gaps

Library folder:
CEAC OS / Experience V2 / References / Observed Current Gaps

Files:
- IMG_0075.jpeg
- IMG_0076.png
- IMG_0077.png
- IMG_0078.jpeg
- IMG_0079.png
- IMG_0080.jpeg
- IMG_0081.jpeg
- IMG_0082.jpeg
- IMG_0083.jpeg
- IMG_0084.jpeg
- current_mobile_gaps_board.jpg

These are evidence of current production/preview quality problems. They are not target designs.

They demonstrate recurring issues including:
- typography scale inconsistency;
- oversized/undersized headings;
- cards/panels with inconsistent proportions;
- wrapped or colliding mobile structures;
- low-quality/inconsistent icon treatment;
- excessive empty space in some surfaces and crowding in others;
- desktop-like structures compressed into mobile;
- inconsistent role-to-role visual language.

Laptop/desktop is also explicitly in scope even though this particular defect set is mobile-heavy.

## Source Mockups

Library folder:
CEAC OS / Experience V2 / References / Source Mockups

Files:
- CEAC_Manager_Panel_Mockup_v1.html
- CEAC_Staff_Panel_Mockup_v1.html
- CEAC_Group_Pastor_Panel_Mockup_v1.html
- CEAC_Admin_HR_Panel_Mockup_v1.html
- CEAC_OS_Whole_System_v5.html
- CEAC_OS_Guidance_Maps_Visuals_v5.html

Also in the repository:
- docs/reference/manager-overview.html
- docs/design/CEAC_OS_PREMIUM_REDESIGN_SOURCE_OF_TRUTH_2026-09-23.md

The HTML mockups are functional/structural references. Experience V2 may improve their typography, spacing, iconography, density and motion to reach the newer quality references while preserving CEAC's own information architecture.

## Preserved Source Docs

Library folder:
CEAC OS / Experience V2 / References / Source Docs

Files:
- CEAC_OS_Master_Build_Brief_v9.md
- CEAC_OS_Architecture_v4.md
- CEAC_OS_Staff_Panel_Spec_v1.md
- CEAC_OS_Manager_Panel_Spec_v1.md
- CEAC_OS_Group_Pastor_Panel_Spec_v1.md
- CEAC_OS_Admin_HR_Panel_Spec_v1.md
- CEAC_What_We_Are_Building.pdf
- CEAC_Office_Platform_For_Approval.pdf
- CEAC_Ministry_OS_Approach_Note.pdf
- CEAC_Presentation_Notes.pdf

These are preserved project-source/supporting references. The four panel specs remain important functional context. The older architecture/brief/presentation material does not automatically override newer repository architecture/security amendments. Use current repository precedence rules for conflicts.

## Integrity checks for key persistent references

Known SHA-256 values from the imported source/reference package:

- CEAC_Manager_Panel_Mockup_v1.html
  9d8abaf10abb7224070505540b8ff846189e5650cbb757495ba05767b0d66279
- CEAC_Staff_Panel_Mockup_v1.html
  2877aece2ce4b024a4663f69ba15488c52880bc41dbeef4c518218167d7a3533
- CEAC_Group_Pastor_Panel_Mockup_v1.html
  aafdb77841c8564dcdb46ee6d03599fd5e0afe35c172175c2672b4c01b800096
- CEAC_Admin_HR_Panel_Mockup_v1.html
  b867a04fc342556a4d6d7e3e539352c29f791eedd1159de0a65485e8d80498a7
- CEAC_OS_Whole_System_v5.html
  6a739b340686fd57e759f97d3fea1c11afec2c0fef5193ae55f8f85e59a597a0
- CEAC_OS_Guidance_Maps_Visuals_v5.html
  4ac22b62450e195898f86be044dc287cffc1c37b12315b0b19374c9f11e0ee55
- CEAC_OS_Master_Build_Brief_v9.md
  aca8c7004f26261c23a14755e4275107731ece8190da4b841e4b6272b62b05c6
- CEAC_OS_Architecture_v4.md
  5c8f3b3555877549ee4ebc84c60affbee51517cd85a4592dd03be6f0f72320f0

## Mandatory reference use

Before approving:
- Stage 2: compare typography/icon primitives against quality references.
- Stages 5–8: compare each keystone screen against CEAC mockup + quality references.
- Stage 11: inspect calendar/data components against quality references.
- Stage 12: inspect motion against motion_reference.mp4/storyboard.
- Stage 16: perform whole-system reference comparison before release acceptance.

If a future session cannot access a required Library reference, it must stop and restore access/recover the file. It must not substitute from memory.