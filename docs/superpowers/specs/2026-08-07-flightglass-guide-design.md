# Flightglass Guide Design Specification

Status: owner delegated design selection and autonomous execution until the
10:00 Europe/Oslo review on 2026-08-07.

## Outcome

Replace the static Jarvis FAQ with Flightglass Guide: a guided, progressively
disclosed index into the deterministic Flightglass models. A golfer should find
a concrete mechanics question in seconds, get the short answer first, inspect
evidence and limits, and optionally manipulate one relationship live.

The route stays `jarvis.html`; the visible nav label is `Guide` and the page
name is `Flightglass Guide`.

## Product boundaries

- No text input, chat composer, LLM, hidden prompt API or simulated dialogue.
- Academy is v2 and has no visible route, progress, reward or lesson CTA.
- The flight adapter imports only `impact-outcome.js` and the v1 context helper.
- Stored onboarding context is `Saved guided model setup`, not a measured shot.
- Exact outputs are recomputed from face, path, attack, dynamic loft and speed.
- Labs change one variable; all held constants remain visible.
- Do not claim diagnosis, optimization, personalization, club calibration or a
  universal optimal spin window.

## Information architecture

The initial screen has three intents:

1. Saved setup — explain the available guided model setup.
2. Explore a topic — browse six outcome-first topics.
3. Compare the model — open a bounded one-variable lab.

Topics are Direction, Impact, Launch & spin, Distance, Conditions and Model
limits. The catalog contains at least 20 predefined, web-researched questions.
URL state uses `topic` and `question` parameters so answers deep-link and browser
back/forward works. Invalid links return to browse with a polite announcement.

Mobile uses one dominant panel at a time: Browse -> Answer -> Lab. Desktop
keeps the topic rail and answer lens visible side by side where space permits.

## Answer anatomy

1. Direct answer in one or two sentences.
2. Two or three evidence bullets.
3. Visible provenance: `Range modelled`, `Studio geometry`, `Estimate`, or
   `Not modelled`.
4. One deterministic visual where it clarifies geometry or comparison.
5. A compact exact-value table when context is available.
6. A collapsed `Model limits` disclosure.
7. Exactly one next action.

Every catalog item also carries a capability class: `answer-now`,
`bounded-model`, `external-data`, or `reject-false-precision`. Unsupported
questions stay useful by explaining what data/model would be required.

## Live lab

The first lab supports direction, launch/spin and distance relationships. It
shows all five Range inputs. Only the active input slider can change; the other
four are explicitly labelled held constant. A before/current table, outcome
chips and an accessible SVG line plot update immediately from `selectOutcome`.
Reset and Open Range are utilities; the answer still has only one primary next
action.

Backspin shows calculated backspin, true 3-D spin loft, ball speed, apex and
landing angle. It has no ideal band and states that strike, ball, grooves,
moisture and club-specific calibration are absent.

## Visual direction

Mode: Operate. World: existing Ultraviolet Ember Flightglass instrument.

Use a compact `trajectory aperture` as the signature: a dark measuring field
with two restrained paths resolving into one ember point. On question change,
the evidence lens settles over 180-220 ms and one violet causal trace resolves
over 260-340 ms. No particles, typewriter, thinking dots or pulsing AI orb.

Composition is a topic rail plus evidence lens, not a grid of equal FAQ cards.
Question rows are dense and scannable. Exact measurements use the established
mono face and tabular numbers. Ember means live truth/primary action, violet is
structure/model state, cyan is directional comparison, and gold remains out of
this surface because it denotes earned mastery elsewhere.

Use canonical tokens from `sa-p3.css`; no local token mirror or authored hard
color. Corners are 12-16 px, border or shadow supplies elevation (not both),
44 px targets are mandatory, and body measure stays within 65-75 characters.

## Motion and accessibility

- The default state is already legible; motion only resolves relationships.
- Reduced motion presents the same settled state with no animated trace.
- Focus order follows visual order and every interactive element is a button or
  link with a concrete action name.
- Charts include a text summary and exact table.
- Slider live regions announce settled values, not every animation frame.
- Mobile target is 390x844; desktop target is 1440x900; no horizontal overflow.

## Engine-gap rubric

- Answer now: direction, start/curve/final side, launch/apex/landing, calculated
  spin/spin axis, ball speed/smash/carry/total and bounded one-input sweeps.
- Bounded new model: contact-flight bridge, fat/thin geometry, gear effect,
  club calibration, interval optimizer, weather/rollout and multi-shot summary.
- External data: ball/head/strike-loss/fitting/device uncertainty, live weather,
  lie, landing surface and equipment catalog data.
- Reject false precision: exact body fault, guaranteed drill, exact personal
  ideal, equipment SKU, real-world yardage without inputs, or medical inference.

## Acceptance

- At least 20 questions and all four gap classes are present.
- No free-text affordance exists in HTML or runtime.
- Saved/empty/corrupt/domain/capped states fail closed.
- One-variable labs preserve four inputs exactly.
- Browser history, deep links and Range/Studio exits work.
- Chromium and WebKit pass mobile/desktop functional and accessibility checks.
- Root and `www` files are byte-identical after `npm run copy-web`.
