# Flightglass handoff 02 — lesson truth rewrite (Cowork reviewer → Claude Code)

## Protocol
Same channel as before, now versioned: read this request, do the work, write your full
answer to `handoff/02-lesson-rewrite-response.md`. Leave the 01 files untouched as archive.
Tell the human "response written" when done.

Branch: `engine/physics-3d-spin-recal`. Builds directly on your handoff-01 findings.

## Context (established, do not re-litigate)
- The integrated engine is verified: neutral invariants hold, driver spin ~2587, tilt ratio
  ~2.52x. The reviewer independently confirmed your carry² finding: at fixed face/path the
  index curve/carry² RISES ~35–45% across 70→120 mph. Curve grows FASTER than quadratic
  (longer flight = more time under Magnus lift). The lessons' carry² law is false.
- Owner has approved a full rewrite of the contaminated lessons.
- Honesty doctrine: every displayed number is a live engine output or reproduced from one;
  what the engine doesn't model is said, not faked.

## STEP 0 — checkpoint commit (do this first)
The 22 cleaned files from handoff-01 are still uncommitted. Commit them now as one
checkpoint commit (message: engine 3-D spin cleanup: regression fix, test recal, content
purge phase 1) so that work cannot be lost. Then do this rewrite as separate commit(s).

## THE JOB — rewrite the contaminated lessons to teach the real engine

### Scope: the 10 contaminated lessons
`lesson-backspin`, `-dynamic-loft`, `-face-angle`, `-club-path`, `-spin-loft`,
`-spin-axis`, `-curve`, `-offline`, plus `lesson-carry` and `lesson-altitude`.
Includes `academy.html:689` (lesson-spin-loft JSON — the item you correctly refused to
string-swap in handoff-01), and the two EXECUTING prototype bar charts
(`f.spinLoft*f.ballSpeed*1.8*0.6`, `f.ballSpeed*33*1.8*0.4`).

### Engine is FROZEN for this pass
Do not touch `impact-flight.js`, `flightglass-3d-spin-model.js`,
`swing-parameters-and-impact.js`, `driver-flight.mjs`. This is a content job. If a lesson
seems to need an engine change, STOP and report instead.

### What the lessons must teach instead (canon = the four identity strings from handoff-01)
- Backspin: total spin comes from the glancing blow (rolling-at-separation magnitude from
  club speed and true 3-D spin loft); `backspin = totalSpin · cos(spinAxis)`. No floor —
  as spin loft goes to zero, so does spin. Ceiling 9000 is a display sanity bound.
- Spin axis: the tilt of (velocity × faceNormal) from horizontal. Face-to-path sets its
  direction; loft/attack set how strongly the same gap tilts it. No 1.5 gain, no ±38 clamp.
- Curve: integrated flight under drag + Magnus lift. There is NO closed-form curve formula
  in the engine, so no lesson may state one. Teach the behaviour instead: same axis tilt,
  longer/faster flight → disproportionately more curve. Use a measured speed-sweep table
  (70→120 mph at fixed face/path) as the worked example — the reviewer's run and yours
  agree on the shape. The old teaching point "the driver is the great exposer" is
  STRENGTHENED by the true model; keep it, now honestly.
- Offline: `carry·sin(startDirection) + curve`, uncapped.

### Number regeneration rule (hard)
Every worked number in every rewritten lesson must be re-derived by running the CURRENT
`solveFlight` at the lesson's OWN stated delivery. Do not reuse the handoff-01 example
table blindly — those were spot checks at particular deliveries. In your response, include
a provenance table: lesson → delivery inputs → engine outputs → where each number appears.

### Contract constraints (unchanged, from docs/academy-native-v2-spec.md §7)
Frozen S0–S5 surface sequence, FIT LAW (one viewport, no internal scroll), ≤50 visible
words per surface, paged stepper, playful-but-precise voice, real terms kept and taught at
first use — never dumbed down. The rewrite changes WHAT is taught, not the lesson shape.

### Also in scope (small, content-adjacent)
- `academy-delivered-loft-launch-model.js:24` — the unreachable `=== 1500` branch you
  flagged. Remove/re-point it now.
- Stale prose comments in `diagnose-engine-v2.js` / `tools/diagnose-harness-v2.mjs`
  ("spinK 1.8", "byte-identical") — correct the comments only.

### Regression guard — add a forbidden-formula verifier
Add `scripts/verify-academy-formulas.mjs` in the style of the existing brand verifier:
scan `academy.html`, `academy-*-content.js`, `academy-*-model.js` (NOT tests, NOT
`*-mock.html`, NOT `impact-presentation.html` which is a declared frozen reference) for
the dead signatures: `/ 12000`, `clamp(1.5`, `× 1.8` / `* 1.8` spin products,
`1,500-9,000`, `±38°` axis clamp, `spinLoft × ballSpeed`. Must report ZERO hits when you
are done. Wire it into the `test:engine` phase of `npm test` (it runs first and always
executes). This makes the purge permanent, not a one-time sweep.

### Tests
- Recalibrate/pin every changed displayed number in the corresponding model/browser tests.
- All affected lesson suites green; `npm test` still completes with no test over 10 s.
- The two pre-existing voice failures and `test:webkit` gating are OUT OF SCOPE here
  (separate CI job) — just report their status unchanged.

## Out of scope (do not touch)
Voice-pack failures, webkit gating, the driver longitudinal carry model, anything under
`www/` beyond a final `copy-web` rerun at the end.

## Report back (in handoff/02-lesson-rewrite-response.md)
1. Step-0 checkpoint commit hash, and the rewrite commit hash(es).
2. Per lesson: one-paragraph before→after summary of the claim change.
3. The provenance table (lesson → delivery → engine outputs → placement).
4. The speed-sweep table you shipped as the curve lesson's worked example.
5. Verifier: paste its output (must be zero hits) and confirm it is wired into npm test.
6. Test totals per suite, npm test wall clock, and confirmation no engine file changed
   (paste `git diff --stat` scoped to the four frozen files — must be empty).
7. copy-web rerun confirmation.
8. Anything you could not complete, stated plainly.
