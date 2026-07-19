# Impact Portrait Design

**Status:** Owner-approved direction, 2026-07-19
**Normative visual reference:** `design/mocks/impact-kamera.html`
**Protected system reference:** `docs/systemkontrakt.md`

## Outcome

Impact becomes a portrait-first live range. The ball flight remains the dominant
surface, one input is manipulated at a time, and the bottom dock uses its full
width without hiding the model. The existing engine, selector, camera rig,
annotations, pins, units, and protected physics outputs remain authoritative.

## Owner-locked decisions

- Preserve the approved dark violet Flightglass design and color system.
- The active trajectory is the sharp Flightglass orange `#FF8A4D` in Flight,
  Top, and Side.
- Exactly one slider is active at a time.
- Flight exposes Face, Path, Dynamic loft, Attack, and Speed.
- Top exposes Face, Path, and Speed.
- Side exposes Dynamic loft, Attack, and Speed.
- Speed is one global value. It appears as an available parameter in every
  view, and changing it in one view changes the same shot in all views.
- Parameter chips divide the complete available dock width evenly. They do not
  form a horizontally scrolling row and do not leave a dead strip at the end.
- No explanatory/helper sentence appears below the slider.
- Flight uses a real night-range surface. The projected grid is grounded on
  the grass and the trajectory terminates at the actual ground/landing point.

## Information hierarchy

1. The live range, grid, and active trace.
2. Carry and lateral result.
3. Flight / Top / Side lens switch.
4. The single active input, value, slider, and evenly distributed parameter
   chips.
5. Pin as a secondary action.

Outcome dashboards and Academy explanations do not live in the resting Impact
dock. Detailed causal teaching remains Academy's job.

## Interaction contract

- Lens buttons, keyboard activation, and the existing continuous scene scrub
  all address the same camera station state.
- Switching lenses preserves the active parameter when the destination allows
  it. Otherwise it chooses the destination's first parameter.
- Speed persists across every lens.
- Slider and nudge controls update `selectOutcome(state)` and the scene live.
- Parameter buttons are at least 44 px high as interactive targets, even when
  their visible chip is more compact.
- The core model, lens switch, active slider, value, and every available chip
  fit together at 375×812 and 430×932.

## Native orientation

The platform projects must advertise portrait and landscape support so a
single route can choose its intended orientation. Impact requests portrait on
entry and releases that request on page exit. Web preview remains responsive
and treats orientation locking as progressive enhancement. No bare npm import
is added to the static web runtime; the existing Capacitor bridge registers the
installed ScreenOrientation plugin by name.

## Non-goals

- No physics changes in `impact-flight.js`.
- No new generated imagery.
- No redesign of Geometry, Outcome, Compare, or Academy.
- No migration of stored user data or protected identifiers.
- No simultaneous sliders or permanent outcome-metric grid in the dock.

## Acceptance

- Parameter matrix is exact and covered by unit tests.
- One active slider and full-width chip distribution are covered in Chromium.
- No helper text exists below the slider.
- Speed remains identical across lens changes.
- Ground grid and trajectory landing are visually inspected at both portrait
  target sizes.
- Zero console/page errors, horizontal overflow, clipped essential controls,
  or changed protected physics hashes.
