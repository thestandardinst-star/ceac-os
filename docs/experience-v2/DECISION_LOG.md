# CEAC OS Experience V2 — Decision Log

Date started: 26 September 2026
Status: ACTIVE

This file records decisions that future Chat or Work sessions must not infer again from conversation history.

## D-001 — Rebuild the visible experience, not the application from zero

Decision:
Preserve proven CEAC data/security/domain behaviour and progressively replace the visible presentation/interaction layer.

Reason:
Repository inspection shows substantial working role logic and security architecture. A full rewrite would create unnecessary functional risk. The current quality failures are concentrated in presentation architecture, component inconsistency and CSS debt.

## D-002 — GitHub is the build continuity source of truth

Decision:
Every Chat or Work session starts by inspecting the repository and BUILD_STATE.md.

Reason:
Conversation and agent-session limits make memory unreliable. The build must survive a new session with no prior transcript.

## D-003 — Chat and Work may alternate

Decision:
Either mode may continue implementation when the latest work is committed/pushed. Only one may write at a time.

Reason:
Work usage limits must not automatically stop progress, but concurrent writers would recreate drift and conflict.

## D-004 — Unpushed Work state is protected

Decision:
If Work stops with unpushed changes, Chat does not recreate/overwrite that work. It may review/plan from the last pushed SHA until Work recovers and pushes the unfinished state.

## D-005 — Experience V2 baseline

Decision:
Experience V2 branches from exact PR #69 green head:
1a0fb33d3fff18ddae63e6523547b4f4d5d5c883

Reason:
Retains the known engineering fixes/test coverage while preventing more redesign work from being stacked directly onto PR #69.

## D-006 — Stage 12 stays frozen

Decision:
PR #71 remains draft/frozen at:
bf068f32958134319ea32ecf833748879a163fd2

Reason:
Visual/product architecture must stabilise before Connected Apps/Telegram UI is reconciled with the final V2 system.

## D-007 — Quality references are binding

Decision:
The product-owner-supplied quality screenshots and motion recording establish the craftsmanship target for typography, spacing, iconography, layout, density and motion.

They do not authorise copying another product's branding or content.

## D-008 — Original CEAC mockup remains the CEAC structural reference

Decision:
Use the CEAC premium mockup/source design for CEAC-specific composition and identity while raising execution quality to the newer external references.

## D-009 — Laptop and mobile are both primary targets

Decision:
1366×768 laptop and approximately 390×844 phone are first-class acceptance sizes, with tablet/intermediate and large desktop also covered.

Reason:
The current defects exist on both mobile and laptop. Desktop cannot be treated as automatically correct because mobile is being fixed.

## D-010 — One icon system only

Decision:
The current competing hand-built icon implementations are transitional debt. Stage 2 selects/ratifies one coherent production SVG family/registry and all V2 work uses it.

No new one-off navigation icon systems.

## D-011 — Instrument Sans remains the starting type family

Decision:
Keep Instrument Sans unless an explicit Stage 2 comparison demonstrates a materially better choice and the product owner approves the change.

Reason:
The current typography problem is primarily inconsistent hierarchy/application, not lack of access to a capable modern sans.

## D-012 — Motion is real UI behaviour

Decision:
The fluidity in the reference recording must be recreated through interface transitions/layout motion where useful, not by inserting decorative video into operational screens.

Motion is applied after geometry stabilises.

## D-013 — Images/media are deliberate, not filler

Decision:
Use authentic CEAC imagery where authenticity matters, original generated CEAC-specific visuals where appropriate, licensed/free stock where generic context is sufficient, and no image where an image adds no value.

Optimise all media for application performance.

## D-014 — Do not expand CSS override debt

Decision:
No new final parity stylesheet and no increase in the current !important ceiling. V2 should progressively replace and delete competing legacy rules.

## D-015 — Keystone-first propagation

Decision:
Do not redesign every screen immediately. First prove:
- Staff Today;
- Manager Overview;
- Administration Overview;
- Executive Overview.

Only propagate the component system after those four pass product-quality review on laptop and mobile.

## D-016 — Persistent visual references live outside conversation history

Decision:
The user-supplied quality images, current-gap screenshots, motion reference, source mockups and preserved source docs are stored in the user's Library under:
CEAC OS / Experience V2 / References

Repository REFERENCE_INDEX.md is the canonical map.

Reason:
This keeps the quality bar recoverable by future Chat/Work sessions without depending on the original conversation.

## D-017 — Supabase is not the build-document store

Decision:
Do not add production database tables/buckets merely to hold build instructions or design references.

Reason:
Repository + persistent Library are the correct continuity layers; Supabase remains the application/data platform.

## D-018 — Passing automated tests is necessary but not sufficient

Decision:
Every major stage has a separate product-quality gate using actual rendered output and reference comparison.

## D-019 — No silent visual substitution

Decision:
A future implementer may not replace the approved icon family, typography system, layout proportions, interaction pattern or reference direction simply because another implementation is easier.

Any deliberate deviation is recorded here and in the source-of-truth first.