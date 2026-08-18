# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Flightglass is for golfers who want to understand why a modelled shot flew the
way it did and what one controlled change would do next. The primary use is on
a phone at the range, after a shot, or in a conversation where golfers want a
specific answer to a simple or advanced mechanics question without first
learning launch-monitor terminology.

## Product Purpose

Flightglass turns delivery inputs into visible ball flight and impact geometry.
Its v1 loop is: establish a shot, experiment in Range, inspect impact geometry
in Studio, and use a guided knowledge surface to explain relationships or test a
specific question. Success means a golfer can find the relevant question fast,
understand the bounded answer, and manipulate the same model live.

## Positioning

The explanatory surface is not a generic chatbot or static golf encyclopedia.
It is a guided index into the same deterministic model that powers Range and
Impact Studio, with explicit labels for modelled facts, geometry, estimates and
unsupported real-world variables.

## Operating Context

- Portrait phone use is the default for Home, Range and guided knowledge.
- Impact Studio is a landscape instrument.
- Users move between a current Range setup, a concise answer, and a controlled
  one-variable experiment.
- Groups may use the knowledge surface to settle golf-mechanics questions and
  progressively dig from a short answer into bullets, tables, charts and live
  models.

## Capabilities and Constraints

- V1 contains Home, Range, Impact Studio and the guided knowledge surface.
- Academy is deferred to v2. Its source may inform structure and model adapters,
  but no Academy route, progress, reward or lesson CTA belongs in the v1 flow.
- Guided questions use buttons and structured choices. V1 has no free-text
  prompt and must not imply open-ended AI diagnosis.
- The shipping flight model accepts club speed, face angle, club path, attack
  angle and dynamic loft. It exposes direction, flight, spin, speed and distance
  outcomes through the current engine.
- Impact Studio owns rigid-arc impact geometry; it does not own ball-flight,
  spin or carry claims.
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

- Flight authority: `impact-flight.js`, `flightglass-3d-spin-model.js` and
  `impact-outcome.js`.
- Impact geometry authority: `swing-parameters-and-impact.js`.
- Existing v1 context and controlled experiment flow: `sa-v1-context.js`.
- Authored curriculum/model adapters exist locally under `academy-*.js`; they
  are reference material for v1 and must retain their truth labels and bounds.
- Current product and design contracts live in
  `docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md` and
  `docs/DESIGN-SYSTEM.md`.
- There is no validated user-specific fitting dataset, measured-shot ingest or
  universal optimal-performance table in the v1 product.

## Product Principles

1. Start from the golfer’s outcome or question, not a metric directory.
2. Give the short answer first, then allow progressive depth.
3. Keep model provenance and unsupported variables visible.
4. Let one input change one visible relationship live; name every held constant.
5. Intelligent means fast retrieval, causal structure and honest boundaries—not
   simulated conversation.

## Accessibility & Inclusion

Every essential interaction has a button and keyboard equivalent, a minimum
44px target, visible focus, reduced-motion information parity and a text
alternative for diagrams. Live announcements report settled conclusions rather
than every changing numeric frame.
