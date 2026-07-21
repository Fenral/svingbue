# Flightglass handoff 02 — lesson truth rewrite (Claude Code → Cowork reviewer)

Branch `engine/physics-3d-spin-recal`. Date 2026-07-21.

**Read §8 first if you are short on time.** Three things need your ruling, one of them
is an error I made and propagated into the lessons before catching it, and one is a
defect in my own verifier that cost two rewrite passes.

---

## 1. Commits

| | |
|---|---|
| Step-0 checkpoint | **`b0f7a7c`** — "engine 3-D spin cleanup: regression fix, test recal, content purge phase 1" (the 22 files from handoff-01) |
| Rewrite | **`f5938df`** — "academy: teach the integrated engine, and gate the dead formulas permanently" |

Files in `f5938df`:

```
 academy-delivered-loft-launch-model.js |   4 +-
 academy.html                           |  48 +++------
 diagnose-engine-v2.js                  |   8 +-
 package.json                           |   5 +-
 scripts/verify-academy-formulas.mjs    | 173 +++++++++++++++++++++++++++++++++
 tools/diagnose-harness-v2.mjs          |   8 +-
 6 files changed, 202 insertions(+), 44 deletions(-)
```

(`academy.html` shows −44 net because the lesson JSON blocks were re-serialised from
parsed objects; 120 individual strings changed inside them.)

## 2. Per-lesson: what the claim was, what it is now

**`lesson-curve`** — was built on `curve = carry² × spinAxis / 12000`, with a "quadratic
amplifier" framing and a ±0.6×carry cap. Now: curve is integrated from the flight under
drag and Magnus lift, there is no closed-form law to quote, and no cap exists. The
lesson teaches the behaviour with a fixed-tilt speed sweep instead. The old conclusion
("the driver is the great exposer") is kept and strengthened.

**`lesson-offline`** — same quadratic law plus a phantom 55 % offline cap. Now:
`offline = carry·sin(startDirection) + curve`, uncapped — the one formula in this set
that is still exact and may be stated. Its flagship worked example moved from "starts on
line, still misses by 27 yards" to the measured **17.21 yd**, with the driver's 44.93 yd
added so the punch lands where the engine actually earns it.

**`lesson-spin-axis`** — was `spinAxis = clamp(1.5 × (face − path), ±38°)`, taught as a
gain with a ceiling. Now: the tilt of (velocity × faceNormal) from horizontal — exact
geometry, no gain, no clamp. Face-to-path sets direction; loft and attack set how hard
the same gap tilts it. The measured ladder (2° → 3.172°, 6° → 9.428°, 8° → 12.471°)
shows the old 1.5× was a linearisation.

**`lesson-club-path`** and **`lesson-face-angle`** — both leaned on the same gain and on
carry² to explain why path matters more the longer the club. Now both are carried by
loft forgiveness, which is a real derivable effect: the same 6° gap tilts a loft-11
driver's axis **22.974°** but a loft-50 wedge's **4.803°**.

**`lesson-backspin`**, **`lesson-dynamic-loft`**, **`lesson-spin-loft`** — were
`backspin ≈ spinLoft × ballSpeed × 1.8` inside a "1,500–9,000 rpm" range. Now: total spin
is the rolling-at-separation magnitude from club speed and true 3-D spin loft; backspin
is the part of that vector lying along the flight. **There is no floor** — at spin loft 0°
the engine returns exactly 0 rpm. 9,000 is a display ceiling; the model keeps climbing
past it (raw 13,026 rpm at loft 48 / attack −8 / 110 mph).

**`lesson-carry`** — quoted the spin product while teaching that loft trades ball speed
for spin. The trade is real and kept; only the formula changed.

**`lesson-altitude`** — its actual point (spin, speed and launch are set at the clubface
before the ball meets any air, so there is no density term in the impact model) was
**already true** and is unchanged. Only the parenthetical formula was wrong.

## 3. Provenance table

Every number below is live `solveFlight` output measured 2026-07-21. 7-iron deliveries
are loft 30 / attack −3; driver deliveries loft 11 / attack +1.

| Delivery | Engine output | Appears in |
|---|---|---|
| 7i 90 mph, face +2 / path −5 (sweep 70→120 mph, tilt pinned 10.958°) | carry 124.5→223.0, curve 7.45→32.33 | curve `hierarchy[1].weight`, spin-axis `components[4].role`, offline `hierarchy[2].weight`, curve `wolframChecks` |
| 7i 90 mph gap ladder 0.75/2/4/6/8° | tilt 1.191/3.172/6.322/9.428/12.471°, curve 1.80/4.78/9.52/14.18/18.71 | spin-axis, club-path, face-angle worked examples and quiz explanations |
| driver 113 mph gap ladder 0.75/2/4/6/8° | tilt 4.231/11.158/21.513/30.560/38.160°, curve 5.35/14.04/26.63/36.86/44.53 | curve `quiz[3]`, face-angle `quiz[2]`, club-path misconceptions, tourBenchmarks |
| driver 100 vs 113 mph, face +3 / path −3 (tilt 30.560° both) | carry 205.9→223.4, curve 26.42→36.86 | club-path `wolframChecks[1]` — the single-variable proof |
| loft sweep at fixed 6° gap, 90 mph | loft 11→50: tilt 22.974→4.803°, spin 3,375→9,000 | loft-forgiveness passages in all four delivery lessons |
| 7i 90 mph, loft 10/20/25/30/40/48 square | spin 2,892/5,023/6,035/7,002/8,767/9,000; smash 1.408→1.256 | backspin, dynamic-loft, spin-loft, carry |
| spin loft 0/0.5/1/2/4/8° | spin 0/112/224/449/897/1,789 | the "no floor" passages |
| 7i face +2 / path 0 | startDir 1.50°, start 4.51 + curve 4.78 = offline 9.29 | offline `quiz[1]` (stem, all four options, explanation) |
| 7i face 0 / path −8 | startDir −2.00°, start −6.00 + curve 18.71 = offline 12.71 | offline `wolframChecks`, club-path `quiz[1]`, face-angle `quiz[1]` |
| wedge loft 50 / 75 mph, face +3 / path −3 | carry 125.8, tilt 4.803°, curve 5.68, offline 7.66 | cross-club contrasts |

## 4. The curve lesson's worked example, as shipped

Fixed face +2 / path −5 on a 7-iron. The axis tilt is **pinned at 10.958° throughout** —
only club speed changes, so the comparison isolates flight length:

| club speed | carry (yd) | spin axis | curve (yd) | curve/carry² index |
|---|---|---|---|---|
| 70 mph | 124.5 | 10.958° | 7.45 | 5.768 |
| 80 mph | 148.5 | 10.958° | 11.52 | 6.269 |
| 90 mph | 172.0 | 10.958° | 16.46 | 6.678 |
| 100 mph | 193.5 | 10.958° | 22.02 | 7.055 |
| 110 mph | 211.3 | 10.958° | 27.81 | 7.478 |
| 120 mph | 223.0 | 10.958° | 32.33 | 7.801 |

If curve were quadratic in carry the index column would be flat. It rises **35.2 %**:
1.79× the carry buys **4.34×** the curve where multiplying the carry ratio by itself
accounts for only 3.21×.

Second, independent single-variable case, shipped in `lesson-club-path.wolframChecks[1]`:
driver at 100 vs 113 mph, same face +3 / path −3, **identical 30.560° tilt** — carry
205.9→223.4, curve 26.42→36.86. Squaring predicts 1.178×, measured 1.395× — **18.5 %
above square**.

## 5. Verifier

`scripts/verify-academy-formulas.mjs`, wired as the FIRST step of `test:engine`:

```json
"test": "npm run test:engine && npm run test:ux",
"verify:academy-formulas": "node scripts/verify-academy-formulas.mjs",
"test:engine": "npm run verify:academy-formulas && node --test --test-concurrency=1 scripts/impact-flight-calculated-spin.test.mjs scripts/impact-flight-3d-spin.test.mjs scripts/flightglass-3d-spin-model.test.mjs scripts/engine-driver-acceptance.test.mjs scripts/impact-outcome.test.mjs"
```

Output:

```
verify-academy-formulas: 0 hits — no deleted engine formula in shipping Academy content.
  scanned 28 file(s) against 9 dead signatures.
```

It scans `academy.html` + `academy-*-{content,model}.js`; it deliberately skips tests,
`*-mock.html` and `impact-presentation.html`. Confirmed gating: while hits remained it
exited 1 and the five solver suites never ran.

The nine signatures are `/12000`, the 1.5 gain (clamped and bare), the ±38 clamp
(including `+-38` and "engine ceiling 38°"), the spin product, the ×1.8 constant, the
1,500–9,000 range, **the quadratic law in prose**, **the 1.5 gain in prose**, and phantom
60 %/55 % caps. Each failure prints what to teach instead.

## 6. Tests, wall clock, engine untouched

| phase | result |
|---|---|
| `test:engine` (verifier + 5 suites) | **52 / 52 pass** |
| `test:ux` | **154 / 154 pass** |
| `test:academy-foundation` | **242 / 244 pass, 2 fail** |

**Wall clock 218.4 s (3.6 min). Tests over 10 s: 0.**

The 2 failures are the known pre-existing voice ones (`academy-voice-pack` licensed-master
check; `academy-voice-production` `1578 !== 1546` caption cues), verified identical on
`origin/main@6a65d55` in an earlier pass. Status unchanged, out of scope as instructed.
`test:webkit` is still gated behind them and still does not execute.

No lesson test needed a number recalibration this pass — I checked before starting, and
no test asserts on the lesson JSON's physics claims.

Frozen engine files, `git diff --stat b0f7a7c f5938df` scoped to them:

```
(empty — impact-flight.js, flightglass-3d-spin-model.js,
 swing-parameters-and-impact.js and driver-flight.mjs are untouched)
```

24 lesson JSON blocks, 0 parse failures.

## 7. copy-web

Rerun. `www/academy.html` and `academy.html` both hash to `2fd7a30dc400f3fc36cad2fc54999283c7cca8a6`.
`www/impact-flight.js` still carries the new engine (10 hits for `centeredImpactSpin`/`spinCal`).

## 8. Problems — three need your ruling

### 8a. I shipped an invalid proof and had to retract it

I built a "headline falsification" for the rewrite agents:

> driver vs 7-iron at a 6° gap: curve ratio 2.600 where carry-ratio-squared predicts 1.685
> — 54 % bigger, so the square law is dead.

**That does not prove it, and it is not what I claimed.** Those two shots have different
axis tilts (30.560° vs 9.428°), so comparing their curve ratio against a carry-ratio-squared
holds nothing constant. The deleted law had `spinAxis` as a factor too; run properly it
predicted 223.4²×30.560/12000 = **127.1 yd** for the driver against 172.1²×9.428/12000 =
**23.3 yd** for the 7-iron — a ratio of **5.46**. Measured is 2.600, i.e. *below* the old
law, not above.

A rewrite agent caught this and refused to use it. I verified its objection independently
before accepting it. By then the framing had reached five strings, which I retracted in a
canon addendum and removed. Every super-quadratic claim now shipping rests on a
single-variable case (§4). **Grep the final text for "1.685" — it returns nothing.**

The driver/7-iron pair is still true and still shipped, now stated correctly: the driver
bends 2.6× more at the same gap because **two effects stack** — its low loft tilts the axis
30.560° against 9.428°, and its longer flight compounds that bigger tilt.

### 8b. My verifier contradicted itself and cost two passes

The `quadratic-curve-prose` rule advised authors to say "faster than the square of carry"
— and its own pattern `/square\s+of\s+carry/gi` flagged that exact phrase. Every pass that
followed the advice was re-flagged. That is most of why this took three rounds instead of
one.

Fixed two ways: the guidance no longer recommends a flagged phrase (it now says to drop
the vocabulary and teach with measured multipliers), and the rule takes an `exempt` window
so a sentence that names the dead law *in order to reject it* is not treated as teaching it.

Also fixed: hyphenated and possessive spellings (`carry-squared`, `carry's²`) escaped the
first patterns and kept four strings alive through two full passes. This is the argument
for the verifier existing at all — the first sweep reported clean while the same physics
was still being taught in words.

### 8c. Open items for your ruling

1. **`lesson-spin-axis.quiz[2]`** — the stem posits a **275-yd drive**. The engine's
   longest measured carry is 223.8 yd. The keyed answer ("about 2.5× more") is defensible
   only by extrapolating past canon, and it is an *underestimate*. If you rescope the stem
   to a real 223-yd carry, the measured 172→223 ratio at a pinned tilt is **1.96×**, which
   makes the "about 1.5×" distractor closer than the key and forces a re-key. **I did not
   re-key.** The explanation says plainly that the figure is a floor.
2. **`lesson-face-angle.quiz[2].q`** — I changed the stem from a 3° to a **2°** gap, because
   2° is the measured matched pair (driver 14.04 vs 7-iron 4.78 = 2.94×) and the keyed
   option now reads "about 2.9x". At 3° the ratio is an interpolation. Revert the stem if
   you want minimal scope — but then the key is not a canon number.
3. **`lesson-spin-axis.quiz[1].options[1]`** says "Axis tilt = 3°"; measured is **3.172°**.
   Left alone deliberately: changing only the correct option to "≈3.2°" while the distractor
   stays "−3°" would give the answer away by formatting. The explanation carries the exact
   figure.

Minor, not blocking: `lesson-club-path.quiz[2].explanation` puts the driver face-weight at
0.835 where the measured start direction implies **0.845**. The keyed answer survives either
way and the gate does not flag it.

### Also worth knowing

- **Four factual errors** surfaced while rebuilding worked examples, all fixed against
  measurement: a face-0/path-−8 case claimed 30 yd curve / 24 yd offline (real: 18.71 /
  12.71 — wrong by ~90 %); a start-direction blend claimed 0.75×5 = 3.75° when equal face
  and path return the full 5°; and two driver curve figures (5.0 and 39.7 yd) were outputs
  of the deleted law rather than measurements.
- **`lesson-offline.quiz[1]` had become unanswerable.** Its keyed split was 4.5/7.4 on a
  stated total of "about 11.9 yd" that is really 9.29 — and at the measured 4.51/4.78 the
  "exactly half and half" distractor was effectively true. Stem, all four options and the
  explanation are rebuilt so the key is the only defensible answer. **No answerIndex was
  changed anywhere in this pass.**
- **Two prototype bar-chart values** computed heights from the deleted ×1.8 constant. The
  spin-loft bar now reads the engine's real total spin; the ball-speed bar is a display
  share and is now **labelled `est:true`** so the UI marks it as an estimate rather than
  engine truth. The engine never separates the two, and the chart no longer pretends it does.
- **`academy-delivered-loft-launch-model.js:24`** — the unreachable `=== 1500` branch removed.
- **`diagnose-engine-v2.js` / `tools/diagnose-harness-v2.mjs`** — the "no driver preset /
  byte-identical" claim was false and is corrected. A driver preset exists, and the two
  diverge once the smash cap binds: **1.4200 vs 1.4360** at loft 9 / attack +3 / 120 mph.
  Comments only; no behaviour touched.
- **Deferred as instructed:** the driver still shares the 7-iron longitudinal carry fit.
  Untouched, still open.

### Not done

Nothing from the brief is outstanding. The scope did grow: the brief named 10 lessons and
2 executing bar charts, and the real contamination was **120 strings across 11 lessons**
(`lesson-attack-angle` was contaminated too and is included). The extra work is in `f5938df`.
