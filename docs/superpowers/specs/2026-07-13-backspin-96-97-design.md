# Backspin 96-97 Reference Lesson Design

**Status:** Direction approved by the owner on 2026-07-13.

**Product target:** 96-97/100 before external user-validation. A 99/100 claim remains reserved for demonstrated learning transfer with real golfers.

**Normative inputs:**

- `docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md`, Phase 6
- `docs/academy-native-v2-spec.md`
- `academy-lesson-v2-mock.html`
- `academy.html#/lesson/backspin`
- `docs/claude-design-brief/lesson-backspin.json`
- `impact-flight.js`
- `sa-p3.css`
- `sa-haptics.js`

## 1. Objective

Turn Backspin into the production reference lesson for all Flightglass Academy modules. The lesson must feel like a native golf instrument, create an observable cause-and-effect insight within 15 seconds, and require the learner to demonstrate control of the model before mastery is awarded.

The visual direction of the Native v2 mock is retained. This is not a new design system. The work closes the gap between its strong presentation and its weaker learning, model-honesty and mastery behavior.

## 2. Scope

### In scope

- Production integration at `academy.html#/lesson/backspin`.
- Six paged surfaces: Mission, Lab, Influence, Myths, Mastery Check and Result.
- Live `solveFlight()` outputs, one previous-state ghost and causal narration.
- Existing Clean, Wet and Flyer real-world layers with explicit source and estimate treatment.
- Partial-progress persistence inside the existing `strikearc.academy.v1` storage key.
- Existing Academy XP, level, badge, unlock and completion behavior.
- Keyboard, screen-reader, reduced-motion, safe-area and 375x812 support.
- Automated model, interaction and visual-contract verification.

### Out of scope

- No new golf-flight physics.
- No new club preset in `impact-flight.js`.
- No Supabase, OpenAI or remote analytics.
- No new generated imagery.
- No rollout to the other 23 modules until Backspin passes every exit gate.
- No rename or migration of existing `strikearc.*` persistence keys.

## 3. Chosen approach

Use an **instrument-first mission**. Keep the visual grammar of `academy-lesson-v2-mock.html`, but productionize it as a reusable native lesson shell plus a Backspin-specific model/controller.

Rejected alternatives:

1. **Cinematic-first lesson:** stronger campaign imagery, but weaker repeatability and more production cost.
2. **Polish the existing long article:** faster, but cannot exceed roughly 90-91 because the learner still reads before doing.

The lesson shell is reusable. The Backspin visualization is not. Future modules reuse the pacing, honesty, haptics, sheets and mastery contracts while supplying a visualization appropriate to their physics.

## 4. Score contract

Backspin may be recorded as 96-97 only when all rows pass and there is no critical runtime, content or accessibility defect.

| Category | Exit score | Evidence |
|---|---:|---|
| Learning goal and relevance | 96 | Mission understood without instructions; first action in under 15 seconds |
| Content quality | 95 | No absolute claim contradicted by the model or another surface |
| Model honesty | 97 | Engine, estimate, source and display limits never blend |
| Information architecture | 97 | Six complete paged surfaces; no essential internal scroll |
| Visual quality | 96 | P3 system, one anchor, calm hierarchy, no dashboard mosaic |
| Interactivity | 98 | Truth, model and active control remain visible together |
| Causal feedback | 97 | Every settled change produces a numeric cause chain |
| Motivation | 95 | Progress follows demonstrated actions, not passive arrival |
| Mastery | 97 | At least one unseen target is solved in the live model; 4/5 gate |
| Mobile and accessibility | 96 | Both target viewports, 44px targets, keyboard and reduced motion pass |

## 5. Engine and truth contract

`impact-flight.js` remains byte-identical.

The current engine has one club preset, `7iron`. Therefore the lesson must not call a low-spin state a driver simulation or claim that it models driver flight. The mission copy becomes:

> Build 7,000+ rpm, then cut it below 3,500.

The second stage is described as a **low-spin delivery experiment**. A bottom sheet may explain that drivers normally use a much smaller spin loft, but must state that this lesson still runs the app's 7-iron engine.

The initial lab state is:

```js
{ dynamicLoft: 25, attackAngle: -3, ballSpeed: 120 }
```

This produces roughly 6,048 rpm, so neither mission stage begins completed.

Mission ordering is strict:

1. Build stage is credited only after crossing 7,000 rpm.
2. Cut stage is credited only after Build has been credited and the learner subsequently crosses below 3,500 rpm.
3. Visiting an already-low state before Build does not bank Stage 2.

The engine clamps displayed backspin to 1,500-9,000 rpm and exposes `spinRpmRaw`. The two bounds must not be conflated:

- The displayed value remains the engine's clamped `backspin`.
- At the upper bound, the UI shows `Display limit`, identifies a `9,000 rpm ceiling`, and says `Underlying model sensitivity; display capped at 9,000 rpm`.
- At the lower bound, the UI shows `Model floor`, identifies a `1,500 rpm floor`, and does not describe it as the 9,000-rpm cap.
- Influence uses the engine's pre-clamp `spinRpmRaw` finite difference whenever either bound hides the visible change.
- Sensitivity uses a one-sided in-range difference at a slider endpoint; it never samples an impossible control value.
- It must never show `0 rpm/degree` merely because the displayed value is clamped.

The current engine's carry is driven by ball speed, not backspin. At fixed ball speed, changing spin loft can leave carry unchanged. User-facing copy must say this explicitly:

> In this Flightglass model, fixed ball speed holds carry steady while spin changes height and landing. Real high-spin shots can balloon; that effect is not modeled here.

No copy may say the engine shows a shorter carry unless the live engine output is actually shorter.

## 6. Surface design

### S0. Mission

Purpose: orient, create curiosity and make the next action obvious.

Visible content:

- Backspin title and one-sentence definition.
- Mission: `Build 7,000+ rpm, then cut it below 3,500.`
- Two uncompleted stage indicators.
- Primary action: `Enter the Spin Lab`.

The photographic atmosphere may remain, heavily dimmed. It carries no physics information.

### S1. Spin Lab

Purpose: make the relationship manipulable and visible.

Layout at 375x812 and 430x932:

- Header and compact mission pill.
- Backspin truth value, band label and display-limit label when applicable.
- One engine-driven flight trace and exactly one previous-state ghost.
- Three consequence readouts: Carry, Height and Landing Angle.
- Three parameter chips: Dynamic Loft, Attack Angle and Ball Speed.
- One active 44px range control at a time.
- Sticky surface navigation.

After 300ms settle, show and announce a cause chain derived from the actual before and after states. Example:

> Dynamic loft +1 deg -> spin loft +1 deg -> backspin +216 rpm -> apex +1 m.

The cause chain reports actual deltas. It does not infer a change when the rounded engine output did not change.

The previous-state ghost is updated after settle, not on every input event. The current live trace moves continuously while dragging.

### S2. Influence

Purpose: reveal which input has the greatest local effect at the learner's current state.

- Rank Dynamic Loft, Attack Angle and Ball Speed from live finite differences.
- Tapping a row runs a compact A/B comparison using the current state and a +1-unit state.
- At the 9,000-rpm display clamp, show raw engine sensitivity with the display-limit explanation.
- Clean is the simulator register.
- Wet and Flyer activate only the sourced real-world register.
- Activating Wet or Flyer does not modify any `solveFlight()` output.
- A dashed estimate band overlays the RPM area and always includes `approx`, source and `not the simulator` language.

### S3. Myth experiments

Purpose: correct misconceptions through prediction and engine evidence.

True/False is removed. All three current statements are false, which creates a predictable answer pattern.

Each myth becomes a prediction with varied response structures:

1. **Where spin is created:** choose `Ground interaction` or `Face friction and spin loft`, followed by the existing two-run chain.
2. **Loft alone:** predict `More`, `Same` or `Less` spin for the 30/-3 and 34/+1 states. The engine reveals identical spin loft and backspin.
3. **More spin and carry:** predict the result at fixed ball speed. The engine reveals higher apex and landing angle with unchanged carry, followed by the honest real-world caveat.

Correct-answer positions must not repeat a detectable pattern.

### S4. Mastery Check

Purpose: test transfer, not only recognition.

Five scored tasks preserve the existing 4/5 mastery contract:

1. Define spin loft from Dynamic Loft and Attack Angle.
2. Predict which of two deliveries has more backspin.
3. Choose the change that reduces spin loft.
4. Distinguish simulator output from a Wet/Flyer estimate.
5. Use the live mini-lab to create 6,800-7,400 rpm with landing angle at or above 50 degrees.

Tasks 2, 3 and 5 use live engine states. Task 5 is passed only from the learner's final `solveFlight()` output. Each task can be retried. First-try status remains available for XP but does not change truth.

### S5. Result

Purpose: name the demonstrated ability and make the next lesson desirable.

Mastered state requires 4/5. Completion below 4/5 remains `complete`, never `mastered`.

Result copy:

> You can separate spin loft from “hitting down” and control a shot's stopping flight in the Flightglass model.

Show:

- Score and which abilities were demonstrated.
- XP delta without making XP the largest element.
- Rank change only if the persisted total crosses a real rank threshold.
- `Next: Launch Angle` preview, using a short unsolved flight question.
- `Back to path`.

One lesson must never hard-code a promotion to Apprentice or Technician.

## 7. Information sheets

Keep one-level bottom sheets for Mission, Spin Loft, Dynamic Loft, Attack Angle, Ball Speed, engine limits, Carry and Real-world layer.

Content corrections:

- Replace `It alone decides` with `It is the dominant geometric lever at fixed speed and strike conditions`.
- Replace all driver-simulation claims with the 7-iron-engine limitation.
- Add the carry-model limitation.
- State the 9,000-rpm display clamp.
- Preserve the 3-D spin-loft caveat.

Sheets require focus trap, Escape, swipe-down, explicit Close and focus return.

## 8. Component and data boundaries

Production code is split into four focused top-level assets so `scripts/copy-web.mjs` copies them automatically:

1. `academy-backspin-model.js`
   - Pure engine adapter and lesson rules.
   - No DOM, storage or haptics.
   - Exports solve, sensitivity, cause-chain, mission, real-world range and mastery evaluators.

2. `academy-lesson-journey.js`
   - Pure defaults and migration for the reusable native-lesson progress record.
   - No DOM, storage access or Academy reward logic.

3. `academy-native-lesson.js`
   - Six-surface shell, Backspin DOM, interaction state, sheets, paging and accessibility.
   - Imports the pure model and `sa-haptics.js`.
   - Receives Academy persistence and navigation callbacks from `academy.html`.
   - Returns a cleanup function for listeners, observers and timers.

4. `academy-native-lesson.css`
   - Native lesson layout and states.
   - Uses existing P3 variables and typefaces.
   - Contains both target viewport rules and reduced-motion rules.

`academy.html` remains owner of routing, the mastery path, storage, XP, levels, badges and unlocks. It calls the specialized Backspin renderer only for `id === 'backspin'`; every other lesson keeps the existing renderer until its own conversion.

## 9. State and persistence

Keep `strikearc.academy.v1`. Extend each lesson record with an optional `journey` object:

```js
{
  surface: 0,
  mission: { built: false, cut: false },
  myths: [false, false, false],
  masteryBest: 0,
  masteryAttempts: 0,
  masteryAttemptId: null,
  lastSubmission: null
}
```

`lastSubmission` is either `null` or `{ attemptId, summary }`. The loader deep-merges this object with defaults. Existing users retain XP, completion, quiz history and badges. Academy owns the idempotency check: submitting the same `masteryAttemptId` twice returns the stored summary without mutating XP, attempts, badges or unlocks again.

Persist after:

- mission stage crossing;
- myth completion;
- creation or reset of a mastery attempt;
- mastery submission;
- result completion.

Do not persist every slider input.

## 10. Accessibility, motion and haptics

- Every interactive target is at least 44x44 CSS pixels.
- The flight canvas is `aria-hidden`; every result is mirrored in DOM.
- One throttled polite live region announces settled causes, mission stages, myth verdicts and mastery result.
- Ranges use native inputs with `aria-valuetext`.
- Parameter chips and stepper use roving tabindex.
- Locked forward steps use both `aria-disabled` and inert behavior.
- Reduced motion disables animated paging, chain sequencing, count-up and trace interpolation. Final states render immediately.
- Haptics: detent tick, band light, myth light, mastery success. Navigation has no haptic.
- Safe-area insets are applied to header and bottom controls.
- Text scaling to 200% must not hide the primary action; an undersized-viewport fallback may scroll, but default target viewports must not.

## 11. Failure and edge states

- If canvas context is unavailable, render a DOM/SVG static trajectory and keep the lesson usable.
- If localStorage throws, keep session state in memory and never block progression.
- If the real-world image fails, remove the image and caption without leaving a blank plate.
- If haptics or Capacitor are unavailable, continue silently through the existing no-op path.
- If the model returns a non-finite value, keep the last valid render, announce `Model could not update`, and do not credit a mission or mastery target.
- Leaving the route destroys observers, timers and listeners before another lesson renders.

## 12. Verification gates

### Model gates

- Default state is below 7,000 and above 3,500.
- Build must happen before Cut.
- Upper cap and lower floor are labeled distinctly, and influence remains meaningful from `spinRpmRaw` at either bound.
- Every displayed engine value equals `solveFlight()` after documented rounding.
- Wet/Flyer never changes engine outputs.
- Fixed-ball-speed carry behavior is stated accurately.
- Task 5 mastery is evaluated from live engine output.

### Browser gates

- All six surfaces fit at 430x932 and 375x812.
- No horizontal user-scroll, clipped essential text, console error or page error.
- Truth, visualization and active control are simultaneously visible in Lab.
- No target below 44px.
- Keyboard-only completion works.
- Bottom sheets trap and restore focus.
- Reduced-motion screenshots show equivalent information.
- Reload restores partial progress without awarding XP twice.
- Completing 4/5 marks mastered; 3/5 never does.

### Shipping gates

- `npm run test:ux`
- focused Backspin model and browser tests
- `npm run brand:verify`
- `npm run copy-web`
- confirm `www/academy.html`, `www/academy-backspin-model.js`, `www/academy-native-lesson.js` and `www/academy-native-lesson.css`
- focused baseline and strict verify for `academy-lesson`
- manual inspection of four normal/reduced-motion screenshots

## 13. Rollout boundary

After Backspin passes every gate, the reusable shell may be generalized. The shell is the template. The trajectory visualization is only the Backspin/trajectory archetype. Geometry, delivery, energy and environment modules must supply their own congruent live visualization.
