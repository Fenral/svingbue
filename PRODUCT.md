# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Flightglass is for golfers who enjoy understanding strike and ball-flight
mechanics in detail. They use it to explore why a modelled shot flew the way it
did and what one controlled change would do next—not to upload, diagnose or
correct their own swing.

## Product Purpose

Flightglass is a live mechanics instrument that turns delivery and arc inputs
into visible strike and ball-flight outcomes. Its v1 loop is: orient on Home,
replay a setup in Range/Outcome, inspect the complete cause → strike → flight
chain in Mechanics Lab, and use Guide for a bounded question or experiment.
Success means cause, derived geometry and outcome stay visible together.

## Positioning

Unlike a launch-monitor dashboard, generic chatbot or technique coach,
Flightglass exposes a continuous, inspectable chain from arc geometry to
delivery, strike and modelled flight. Mechanics Lab is the sole causal
explainer; Range/Outcome support replay and comparison, while Guide indexes the
same deterministic model with explicit truth and boundary labels.

## Operating Context

- Portrait phone use is the default for Home, Range/Outcome and Guide.
- Mechanics Lab works in both portrait and landscape without a forced-rotate
  overlay.
- Users alternate between two mutually exclusive Mechanics authorities: direct
  Impact Inputs and derived Arc Inputs.
- Impact Inputs controls Face Angle, Club Path, Attack Angle and Dynamic Loft;
  Club Speed is a visible held reference.
- Arc Inputs controls Low Point X, Low Point Height, Swing Direction and Swing
  Plane, then derives contact, Attack Angle and Club Path.
- Groups may use the knowledge surface to settle golf-mechanics questions and
  progressively dig from a short answer into bullets, tables, charts and live
  models.

## Capabilities and Constraints

- V1 contains Home, Range/Outcome, Mechanics Lab and Guide. The shipping route,
  access key and analytics identifier remain internally named `studio` for
  compatibility.
- `?guided=experiment` gives the first guided Mechanics experiment free; later
  experiments require Pro on native. Browser preview never consumes access
  state.
- Academy is deferred to v2. Its source may inform structure and model adapters,
  but no Academy route, progress, reward or lesson CTA belongs in the v1 flow.
- Guided questions use buttons and structured choices. V1 has no free-text
  prompt and must not imply open-ended AI diagnosis.
- Impact Inputs uses `selectOutcome()` as the single flight authority and shows
  Start, Curve, Launch, Backspin, Apex and Carry.
- Arc Inputs uses `effectiveLpx()`, `deriveImpact()`, `clubBallContact()` and
  `strikeQuality()` without adding strike penalties to flight.
- Requested “Low Point Y” is represented as Low Point Height and maps to
  `lowPoint.z`; unsupported Low Point Side is not simulated.
- Arc-derived Attack and Path may be handed to Impact Inputs. Direct and derived
  controls are never simultaneously authoritative.
- No personal-golf data, swing upload, diagnosis, prescribed fix or technique
  recommendation is part of v1.
- Lie, moisture, grooves, ball model, strike location, personal tendencies and a
  validated optimal-spin-by-speed target are not present in the shipping model.
  The product must state those boundaries instead of inventing precision.
- Protected bundle, store, RevenueCat and Academy storage identifiers remain
  unchanged. Golf physics outputs may not change in this product phase.

## Brand Commitments

- Product name: Flightglass.
- Promise: “See why it flew.”
- Identity: Trajectory Aperture and the established Ultraviolet Ember design
  system in `sa-p3.css`.
- Voice: curious-golfer first, calm, specific and evidence-led. Real terms are
  taught inline. Product UI is English.
- Ember represents live truth or the single primary action; violet represents
  structure and model state; gold is reserved for earned mastery.

## Evidence on Hand

- Flight authority: `impact-outcome.js`, `impact-flight.js` and
  `flightglass-3d-spin-model.js`.
- Geometry authority: `swing-parameters-and-impact.js` and
  `geometry-controller.js`.
- Visual evidence: `app-mock-3.html` and `design/mocks/impact-studio.html`;
  placeholder formulas in mocks are never product truth.
- Existing v1 context and controlled experiment flow: `sa-v1-context.js`.
- Authored curriculum/model adapters exist locally under `academy-*.js`; they
  are reference material for v1 and must retain their truth labels and bounds.
- Current product and design contracts live in
  `docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md` and
  `docs/DESIGN-SYSTEM.md`.
- There is no validated user-specific fitting dataset, measured-shot ingest or
  universal optimal-performance table in the v1 product.

## Product Principles

1. Show cause and effect in the same viewport.
2. Keep one authority and one active variable at a time.
3. Treat numbers as truth and visuals as their explanation.
4. Keep model provenance, held constants and unsupported variables visible.
5. Describe mechanics without grading, diagnosing or coaching the golfer.

## Accessibility & Inclusion

Every essential interaction has a button and keyboard equivalent, a minimum
44px target, visible focus, reduced-motion information parity and a text
alternative for diagrams. Live announcements report settled conclusions rather
than every changing numeric frame.
