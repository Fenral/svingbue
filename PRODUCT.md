# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Golfers who enjoy understanding strike and ball-flight mechanics in detail. They use the product to explore causal relationships, not to upload, diagnose, or correct their own swing.

## Product Purpose

Flightglass is a live mechanics instrument. It lets a golfer change a small set of impact or swing-arc variables and immediately see which strike and ball-flight outcomes those variables create. Success means the cause, the derived geometry, and the resulting outcome remain visible together and can be explained without coaching language.

## Positioning

Unlike a launch-monitor dashboard or technique coach, Flightglass exposes a continuous, inspectable chain from arc geometry to delivery, strike, and modeled flight. Every displayed value comes from the repository's existing engines or is explicitly labelled as an educational model boundary.

## Operating Context

- The primary MVP is the existing `impact-studio.html` route, already linked from Home as “Cause → effect”.
- The user alternates between two mutually exclusive authorities: direct Impact Inputs and derived Arc Inputs.
- Impact Inputs controls Face Angle, Club Path, Attack Angle, and Dynamic Loft while holding Club Speed at a visible reference value.
- Arc Inputs controls Low Point X, Low Point Height, Swing Direction, and Swing Plane; it derives contact, Attack Angle, and Club Path.
- The supplied `app-mock-3.html` is visual evidence only. Its placeholder formulas are not product truth.

## Capabilities and Constraints

- The protected `impact-flight.js`, `swing-parameters-and-impact.js`, `diagnose-engine.js`, and `diagnose-engine-v2.js` outputs must not change.
- Impact Inputs use `selectOutcome()` as the single flight-outcome authority.
- Arc Inputs use `effectiveLpx()`, `deriveImpact()`, `clubBallContact()`, and `strikeQuality()` without adding strike penalties to flight.
- The requested “Low point Y” is represented as **Low Point Height** and maps to engine `lowPoint.z`. Literal engine `lowPoint.y` is inert; unsupported TrackMan Low Point Side must not be simulated.
- Arc-derived Attack and Path can be handed into Impact Inputs, but direct and derived controls are never simultaneously authoritative.
- No personal-golf data, swing upload, diagnosis, prescribed fix, or technique recommendation is part of this MVP.
- Product UI is English. Demo values are synthetic and visibly identified as model outputs.

## Brand Commitments

- Product name: Flightglass. Promise: “See why it flew.”
- Preserve the incumbent Ultraviolet Ember identity, semantic quantity colors, self-hosted type, and restrained ember budget.
- Translate the supplied mock's strongest traits—paired orthographic lenses, giant live numerals, stable parameter colors, and sports-broadcast energy—into the incumbent system.
- Avoid generic SaaS cards, decorative glassmorphism, dashboard clutter, gamification, coaching tone, and claims about “your swing”.

## Evidence on Hand

- Visual source: `app-mock-3.html`, `design-system-3.html`, and `design/mocks/impact-studio.html`.
- Shipping surface: `impact-studio.html` with existing canvas geometry and local assets.
- Flight authority: `impact-outcome.js` and `impact-flight.js`.
- Geometry authority: `swing-parameters-and-impact.js` and `geometry-controller.js`.
- Design authority: `sa-p3.css`, `docs/DESIGN-SYSTEM.md`, and `config/evidence/instrument-laws.json`.
- Regression vectors exist for both delivery and geometry modes; no testimonial, commercial benchmark, or measured-player dataset is available and none may be fabricated.

## Product Principles

1. Show cause and effect in the same viewport.
2. One authority and one active variable at a time.
3. Numbers are truth; visuals explain them.
4. Describe mechanics without grading the golfer.
5. Immediate input-to-model response, with motion reserved for state explanation.

## Accessibility & Inclusion

All essential controls require keyboard parity, visible focus, 44 px minimum targets, text alternatives for canvas information, stable tabular numerals, and a reduced-motion state that preserves every live value and causal relationship.
