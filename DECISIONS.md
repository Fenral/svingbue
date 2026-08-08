# Flightglass v1 Decisions

Updated: 2026-08-08

This file records durable v1 decisions and assumptions that should not be
re-decided inside an implementation phase.

## D-001: V1 product surfaces

Status: owner-decided

V1 contains Home, Range/Outcome, Mechanics Lab and Flightglass Guide. Visible
navigation uses `Mechanics`; its route, access key, analytics value and guided
handoff remain internally named `studio` for compatibility. Academy, standalone
Lab routes and historical mocks are not part of v1 navigation. Their code and
protected user data remain intact. Academy is a v2 product surface and is not
packaged as a v1 native entry point.

## D-002: Existing stack stays

Status: accepted technical decision

The app remains static HTML/CSS/JavaScript packaged by Capacitor. The pasted
Next.js/Supabase Phase 0 is a useful workflow example, not a migration order.
Reason: the existing deterministic engines, native wrapper and evidence harness
already solve the hard runtime problem.

## D-003: Jarvis is guided and deterministic

Status: owner-decided

Jarvis has predefined questions and no free-text input. V1 does not require an
LLM. Answers use deterministic templates and optional current-shot context.

## D-004: App structure

Status: accepted technical decision

The four v1 destinations share one app-shell contract and direct navigation.
The Home screen is deterministic and state-driven. The marketing landing is a
separate web-only surface.

## D-005: Design-system scope

Status: accepted technical decision

The design system is made watertight across shipping v1 surfaces only. It is
not efficient or useful to migrate every historical mock. `sa-p3.css` remains
the canonical token implementation. Local token mirrors must be removed from
shipping routes one phase at a time.

## D-006: Monetization

Status: existing product decision with truth safeguard

RevenueCat and the protected product IDs remain. V1 shows Monthly and Annual;
Annual is recommended; lifetime remains restorable but hidden. Current fallback
prices are kr 99 monthly and kr 590 annually. No savings claim ships unless it
matches the live store arithmetic.

## D-007: Supabase timing

Status: deferred until a concrete need exists

Supabase is available, but no project reference was supplied and v1 Phase 0
does not need remote data. Introduce it only for approved account/sync scope,
with checked-in migrations and RLS.

## D-008: Research tools

Status: observed capability

Mobbin, Supabase and GitHub tools are callable in the current environment.
Higgsfield MCP is not callable; Higgsfield-named local skills exist but may not
be treated as an available generation API. No MVP phase depends on Higgsfield.

## D-009: Definition of Done loop

Status: owner-requested working method

Only one phase and one unchecked item are active at a time. Every item names
fresh proof. A phase stops when its items pass; the next phase does not start
automatically.

## D-010: Academy gate separation

Status: owner-decided on 2026-08-06

`npm run claude:ready` currently fails in the Academy voice controls:

- seven Academy voice records have caption hashes from older spoken copy while
  visible cue text has since changed;
- the production voice inventory test expects 1546 words while current cue data
  contains 1579.

Stale spoken copy must not be relabelled as current by changing hashes. The safe
options remain to regenerate those seven licensed clips with the approved voice
or make the changed cues caption-only until regeneration.

Academy is v2, so these failures are documented debt and do not block the
phase-scoped v1 gate. A release that includes Academy remains blocked until its
voice package is repaired and the full repository gate is green.

## D-011: Tables and illustration truth boundary

Status: owner-directed on 2026-08-06

Use accessible HTML tables when users need to compare exact inputs, outputs or
recommended changes. Use deterministic SVG/Canvas for anything that depicts
measurable face, path, angle, contact or ball-flight geometry. Generative image
tools, including Nano Banana Pro when available, may support non-metric
conceptual explanations, but generated art must be labelled illustrative and
must never become evidence for a diagnosis or a degree-accurate claim.

## D-012: App Home is a total replacement

Status: owner-decided on 2026-08-06

Phase 2 replaces the current Night Ladder Home composition rather than refining
it. The replacement keeps the Flightglass brand token system and shared
Home/Range/Mechanics/Guide navigation, then gives the empty state one job:
explain how launch-monitor inputs connect to outcomes. A four-step learning tour
uses real app captures and a fixed 7-iron/90 mph model; it collects no personal
golf profile and creates no `currentShot`. Returning Home is a compact product
map. The animated public landing is a separate surface and is not implemented
inside app Home.

## D-013: Jarvis becomes Flightglass Guide

Status: owner-directed on 2026-08-07

The visible product name is `Flightglass Guide`; the existing `jarvis.html`
route and internal `jarvis` route id remain for compatibility. Guide is a
button-led, outcome-first knowledge index with progressive depth, not a chat
simulation. V1 begins with three intents, six topics and at least 20 concrete
questions. Academy remains v2 and is not exposed as a route, progress system or
lesson CTA.

The intelligent feeling comes from retrieval speed, a resolving model lens,
exact live deltas and honest causal structure. It does not come from typing
dots, free text, a pulsing AI orb or pretend confidence scores.

## D-014: Guide truth and engine-gap contract

Status: accepted technical decision on 2026-08-07

Guide answers and backlog questions use four capability classes:

1. `answer-now`: supported by the shipping Range model;
2. `bounded-model`: feasible only after a separately tested model is added;
3. `external-data`: requires measured inputs, calibration or third-party data;
4. `reject-false-precision`: no supported path to the requested certainty.

Visible evidence labels distinguish `Range modelled`, `Mechanics geometry`,
`Estimate` and `Not modelled`. Stored v1 context is called `Saved guided model
setup`, never a current, latest or measured shot. Guide recomputes outcomes from
face, path, attack, dynamic loft and speed, and ignores serialized results.

The v1 lab changes one variable at a time and exposes the other four held
constants. It may compare exact engine outputs but must not call a value ideal,
optimal, personalized or club-calibrated. A universal optimal backspin-by-speed
band is explicitly out of scope until a validated objective, club model and
calibration dataset exist.

## D-015: Free usage boundaries

Status: implementation assumption on 2026-08-07

Free access includes ten explicit, distinct Range comparisons, one guided
Mechanics experiment and five unique Guide answers per local calendar day.
Reopening the same Guide answer on the same day does not consume another use.
Slider movement, camera changes, cancelled work and failed renders never count.
Range comparisons are temporary pins with at most three ghosts visible at once;
neither the free nor paid copy describes them as persistent saves or history.
The guided Mechanics allowance applies only to its labelled instruction and
completion layer; direct Mechanics exploration remains available without that
guided layer.

Only the native app hard-gates; the browser remains an evaluation preview while
store purchase is unavailable there. Usage is consumed after a completed
result, never at task start. The 11th Range comparison, second guided Mechanics
experiment and sixth unique Guide answer may present Pro only after the user has
already completed at least one result. These numeric assumptions can be tuned
from beta evidence without changing product identifiers or the RevenueCat
entitlement contract.

## D-016: Native iOS WebView baseline

Status: safety assumption on 2026-08-07

Flightglass v1 requires iOS 16.4 or later. The shipping design system and modal
flows depend on native `<dialog>`, `color-mix()`, dynamic viewport units and the
corresponding WKWebView behavior. Codemagic patches both the generated Xcode
project and Podfile to 16.4 after `cap sync`, and tests the pure transforms.
Supporting older iOS versions would require a separately tested modal and
design-token fallback; silently building with Capacitor's lower default is not
an acceptable compatibility claim.

## D-017: Mechanics is the sole causal authority

Status: owner-decided on 2026-08-08

Mechanics Lab replaces the old visible Impact Studio contract. Impact Inputs
map Face Angle, Club Path, Attack Angle and Dynamic Loft to Start, Curve,
Launch, Backspin, Apex and Carry while club speed remains a visible 90 mph held
reference. Arc Inputs map Low Point X, Low Point Height (`lowPoint.z`), Swing
Direction and Swing Plane to contact, Attack and Path, then to the same flight
instrument. Only one authority is active at a time.

Range/Outcome remains a live replay and comparison surface, not a duplicate
causal explainer. Guide remains a bounded question and handoff surface. The
product models mechanics; it does not collect personal swing data, diagnose
technique, prescribe a fix or claim an optimal result.

Mechanics must work in portrait and landscape without a forced-rotate overlay.
The first guided experiment is free in the native app and later guided
experiments require Pro. Browser preview does not consume access state. The
legacy Lifetime product remains restore-only.
