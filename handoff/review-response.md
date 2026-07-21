# Flightglass handoff — review response (Claude Code → Cowork reviewer)

Branch `engine/physics-3d-spin-recal` · HEAD `e7d3133` · base `origin/main@6a65d55`
Date: 2026-07-21. Cleanup pass **has** been run.

**Nothing is committed.** All 22 changed files are uncommitted working-tree changes on top of
`e7d3133`. Nothing pushed, nothing merged.

**Two items on the merge-ready list are NOT complete.** Read §4 and §9 before signing off —
`academy.html:689` still teaches the deleted formula, and the wider lesson prose purge is
unfinished for a reason that changes what the lessons should say.

---

## 1. REGRESSION (impact-outcome.js:90)

Changed to gate on the sign carrier instead of the now-non-negative 3-D angle:

```js
// before
inDomain: raw.spinLoft > 0,
reason: raw.spinLoft > 0 ? null : 'spin-loft',

// after
inDomain: raw.signedVerticalSpinLoftDeg > 0,
reason: raw.signedVerticalSpinLoftDeg > 0 ? null : 'spin-loft',
```

Rationale recorded in the file header: `raw.spinLoft` is now the non-negative principal
included angle, so `> 0` could never be false and guarded nothing. The threshold is unchanged;
only the sign carrier moved. At neutral face/path the two quantities are equal in magnitude.

**`scripts/impact-outcome.test.mjs`: 9/9** (was 8/9).

Provenance note for the reviewer: this failure is **not** inherited. Verified by running the
suite in a detached worktree — `origin/main@6a65d55` is 9/9, `bc68858` (Codex's commit) is 8/9.
It was introduced by the 3-D spin change on this branch.

---

## 2. LESSON TEST RECALIBRATION

**`academy-wind-model.test.mjs`: 5/5** (was 3/5).
**`academy-carry-side-model.test.mjs`: 6/6** (was 5/6).

Confirmed: **the lessons were moved to the settled engine. The engine was not touched.** No
file under the spin/curve path was edited in this pass — `impact-flight.js` changed only in
comments (§4), and `flightglass-3d-spin-model.js` was not modified at all.

Wind — test expectations:

| value | before | after |
|---|---:|---:|
| `e.curve` | 8.402856482 | **8.340529985** |
| `e.carrySide` | 9.203335405 | **9.141008908** |
| `e.backspin` | 7488.946727 | **7385.312193** |
| `a.firstOrderWindSide` | 15.39804826 | **15.335721762** |
| `c.firstOrderWindSide` | 1.568648278 | **1.506321781** |

Unchanged and re-verified: `faceWeight` .75, `startDirection` .25, `ballSpeed` 126.1126985,
`carry` 183.4568378, `spinAxis` 4.751135848, `headTailMultiplier` .8776 / 1.0816,
`estimatedWindCarry` 161.0017208 / 198.4269157, `windDrift` 6.194712854 / −7.634687127.

Wind — mastery gate windows in `academy-wind-model.js`. Shifted by the measured engine delta
(−0.062326), **width preserved exactly** so learner tolerance is unchanged:

- `a.firstOrderWindSide` `[14.77, 16.47]` → **`[14.71, 16.41]`** (width 1.70 both)
- `b.firstOrderWindSide` `[0.87, 2.67]` → **`[0.81, 2.61]`** (width 1.80 both)

Wind — content reveals in `academy-wind-content.js`:

- `ENGINE · Start +0.80 yd + Curve +8.40 yd = Carry Side +9.20 yd`
  → `ENGINE · Start +0.80 yd + Curve +8.34 yd = Carry Side +9.14 yd`
- `+9.2033 ENGINE CARRY SIDE + 6.1947 EST DRIFT = +15.3980 FIRST-ORDER`
  → `+9.1410 ENGINE CARRY SIDE + 6.1947 EST DRIFT = +15.3357 FIRST-ORDER`
- `HEAD 0.8776 · 161.07 yd / TAIL 1.0816 · 198.51 yd`
  → `HEAD 0.8776 · 161.00 yd / TAIL 1.0816 · 198.43 yd`

  ⚠️ This third one was **already wrong before this branch**. `estimatedWindCarry` is
  `carry × multiplier` and carry is bit-identical across the engine change, so 161.00/198.43
  were the correct values on `origin/main` too. Pre-existing content error, fixed in passing.

Carry Side — test expectations:

| value | before | after |
|---|---:|---:|
| `a.curve` | −7.214525306773868 | **−7.160695049978987** |
| `a.carrySide` | 0.0016131716150100672 | **0.05544342840989103** |

Unchanged: `a.startSide` 7.216138478388878, `same[0].startSide` 3.0087957475339118,
`same[1].startSide` 3.006408540089512, and the mirror identities (`b = −a` exactly).

Three further lesson suites needed the same treatment once the full gate was reachable
(these only surfaced when `npm test` stopped hanging — see §3):

- `academy-speed-transfer-model` backspin ×3: 7099.5 / 7888.3 / 5508
  → **7001.610243089 / 7779.566936766 / 5432.971491363**
- `academy-delivered-loft-launch-model` backspin ×5: 7292.592 / 5097.168 / 8052.048 /
  7864.128 / 6512.4 → **7188.7075826204955 / 5023.046266687192 / 7914.639632461662 /
  7736.636487008601 / 6427.752872043161**
- `academy-air-density` locked launch: `7099 rpm` → **`7002 rpm`** (model + content + browser)

Browser suites recalibrated to the same engine: `academy-shape-browser` (curve `+9.6→+9.5`,
`+16.2→+16.0` yd), `academy-wind-browser` (`9.20→9.14`, `15.40→15.34`, `1.57→1.51` yd),
`academy-carry-side-browser` (`+0.5→+0.6` yd), `academy-backspin-browser` (see §4).

---

## 3. FULL npm test

**Yes — it completes.** It no longer hangs.

| phase | result | duration |
|---|---|---:|
| `test:engine` (new) | **52 / 52 pass, 0 fail** | 5.07 s |
| `test:ux` browser suites | **154 / 154 pass, 0 fail** | 206.79 s |
| `test:academy-foundation` | **242 / 244 pass, 2 fail** | 3.68 s |
| `test:webkit` | **NOT REACHED** — see below | — |

**Wall clock: 215.5 s ≈ 3.6 min** (was >10 min and never finishing).
**Tests over 10 s: 0.** Previously there were 10+ tests burning 31 s each.

⚠️ **`npm test` still exits non-zero**, and because the script is an `&&` chain it stops at
`test:academy-foundation`, so **`test:webkit` never executed in this run and is unverified.**

The 2 remaining failures are `academy-voice-pack` ("development pack verifies every local
licensed Academy master") and `academy-voice-production` ("production inventory is derived from
all 102 exact caption cues", `1578 !== 1546`). **Both verified pre-existing:** I ran them in a
detached worktree at `origin/main@6a65d55` and got the identical 3/4 and 19/20. They concern
audio-asset licensing and caption counts — no physics involvement.

**What the hang was.** Root cause was the removed 1500-rpm floor, i.e. the same defect as the
§4 floor-labeling item — one root cause, two symptoms. `academy-backspin-browser.test.mjs`
polled `page.waitForFunction(() => #backspinTruth.textContent === '1500')` for a display state
the engine can no longer produce (with no floor, that delivery reads **632 rpm**). Each such
wait burned the full 30 s Playwright timeout. Every one of the 30 failures in the first
complete run traced to the Backspin lesson.

**How it was fixed.** By making the lesson tell the truth rather than by extending timeouts —
see §4. `academy-backspin-browser` is now **41/41** with no test over 10 s.

**The four engine suites are in `npm test`.** I added a fifth. `package.json`:

```json
"test": "npm run test:engine && npm run test:ux",
"test:engine": "node --test --test-concurrency=1 scripts/impact-flight-calculated-spin.test.mjs scripts/impact-flight-3d-spin.test.mjs scripts/flightglass-3d-spin-model.test.mjs scripts/engine-driver-acceptance.test.mjs scripts/impact-outcome.test.mjs"
```

Two deliberate choices: `impact-outcome` is included because it is the engine's only adapter
and it is the suite that caught the §1 dead guard — leaving it outside the gate is exactly how
that regression reached the branch unnoticed. And `test:engine` runs **first** because it is
5 s of pure node, so a physics regression fails the build before 3.5 minutes of Playwright.

---

## 4. CONTENT PURGE

### 4a. `academy.html:2958` — DONE

```
- <div class="fk">Backspin formula (engine)</div>
- <div class="fx"><span id="sm-f-sl">33</span> × <span id="sm-f-bs">120</span> × ${cfg.spinK||1.8} = <span id="sm-f-res">7,099</span> rpm</div>
+ <div class="fk">Backspin inputs (engine)</div>
+ <div class="fx"><span id="sm-f-sl">33</span>° spin loft · <span id="sm-f-bs">120</span> mph → <span id="sm-f-res">7,002</span> rpm</div>
```

`cfg.spinK` was `undefined` after the engine change, so the template fell through to the
literal `1.8` and taught the deleted product as "(engine)". The panel now shows the two inputs
and the engine's own result without asserting a multiplication. **7,002 rpm is reproduced from
the current engine** (the 90 mph / 119.52 mph / 17.85° anchor delivery reads
`7001.610243089314`; the same value drove the air-density recalibration in §2).

**Three functional bugs found in the same widget — not prose, executing code:**

```
- <div class="meterlabels"><span>9,000</span>…<span>1,500</span></div>
+ <div class="meterlabels"><span>9,000</span>…<span>0</span></div>

- const fillPct=clamp((rpmShown-1500)/(9000-1500),0,1)*100;
+ const fillPct=clamp(rpmShown/9000,0,1)*100;

- const bLo=clamp((band.lo-1500)/(9000-1500),0,1), bHi=clamp((band.hi-1500)/(9000-1500),0,1);
+ const bLo=clamp(band.lo/9000,0,1), bHi=clamp(band.hi/9000,0,1);
```

With the floor gone, any spin below 1500 rpm produced a **negative gauge fill**.

**All four `identity` strings** (rendered live into the DOM at `academy.html:2544`):

| line | before | after |
|---|---|---|
| 838 | `backspin ≈ spinLoft × ballSpeed × 1.8` | `backspin = totalSpin · cos(spinAxis)` |
| 950 | `spinAxis = 1.5 · (faceAngle − clubPath) → curve` | `clubPath sets the D-plane → spinAxis → curve` |
| 1057 | `spinAxis = clamp(1.5·(faceAngle − clubPath), ±38°) → curve` | `spinAxis = tilt of (velocity × faceNormal) from horizontal` |
| 1126 | `curve = clamp(carry² · spinAxis / 12000, ±0.6·carry)` | `curve = integrated flight under drag + Magnus lift` |

### 4b. `academy.html:689` — ❌ NOT DONE

`lesson-spin-loft` still contains, verbatim in the shipped JSON:

```
1,500-9,000 rpm      2,070      7,099      9,000(engine-clamped)
```

It still teaches `backspin ≈ |spinLoft| × ballSpeed × spinK` and a floor that no longer exists.
**This item of the merge-ready list is not complete.** Reason in §9 — it is not a number swap.

### 4c. `academy-backspin-model.js:52-54` — DONE

```js
// before
export const BACKSPIN_LIMITS = Object.freeze({ min:1500, max:9000 });
const displayLimit = rawRpm >= BACKSPIN_LIMITS.max ? 'ceiling'
                   : rawRpm <= BACKSPIN_LIMITS.min ? 'floor' : null;
displayFloored: displayLimit === 'floor',

// after
export const BACKSPIN_LIMITS = Object.freeze({ max:9000 });
export const LOW_SPIN_NOTE_RPM = 1500;   // a teaching threshold, NOT a clamp
const displayLimit = rawRpm >= BACKSPIN_LIMITS.max ? 'ceiling'
                   : rawRpm <= LOW_SPIN_NOTE_RPM ? 'no-floor' : null;
noFloor: displayLimit === 'no-floor',
```

`min` is **deleted rather than set to 0** — there is no lower clamp to expose, and a `min` here
is what made the lesson assert a clamp that does not happen. `limitLabel` collapsed to
`'display ceiling'`, and `limitedDisplay` now requires `displayLimit === 'ceiling'`, since low
spin does the opposite of freezing the display.

**This was a live, on-screen contradiction, verified in the browser:** at dynamic loft 10° /
attack +6° / ball speed 90 mph — inside the lesson's own slider bounds — the engine returns
**632 rpm**, `#backspinTruth` displayed **632**, and the UI simultaneously showed a badge
reading "Model floor: 1,500 rpm".

Owner chose to **re-point the lesson at the new truth** rather than delete the half. The badge
now reads "No floor", and the glossary card explains that spin is generated by the glancing
blow, so as spin loft goes to zero so does spin — with the ceiling as the deliberate contrast
(display freezes up top, display tracks down low). `academy-native-lesson.js` badge, aria-label
and sensitivity copy updated to match. Tests pin `rpm === rawRpm` all the way down and assert
the string `1,500` is never announced again.

`academy-backspin-model.test.mjs`: **14/14** (was 8 pass / **6 fail**).
`academy-backspin-browser.test.mjs`: **41/41** (was 18 pass / 23 fail).

Two genuine engine behaviour changes surfaced here and are now pinned in tests:
- Attack angle is now marginally the stronger lever (**−214** vs **+213** rpm/degree) where the
  fitted engine had them exactly tied at ±216 — so the Influence panel **ranks differently**.
- The near-ceiling knee moved from dynamic loft 38 to **39**.

### 4d. `impact-flight.js:297-300` and `:332` — DONE

```
- // ── Added SkyTrak-style output fields (all ESTIMATE) ──
- // ESTIMATE: total spin is spinLoft(°) · ballSpeed(mph) · k, clamped to a declared window.
+ // CALCULATED: total spin is the rolling-at-separation magnitude from centeredImpactSpin
+ // (Penner), omega = V·sin(theta)/[R·(1 + k·(1 + m_ball/m_head))], scaled by the single
+ // exposed preset.spinCal and bounded only by a 9000 rpm sanity ceiling. The old fitted
+ // spinLoft·ballSpeed·spinK product and its 1500-rpm floor are GONE — do not reintroduce.

- backspin,   // ESTIMATE (projection of empirical total-spin vector, rpm)
+ backspin,   // CALCULATED (projection of the Penner total-spin vector, rpm)
```

### 4e. copy-web — DONE

```
$ npm run copy-web
[copy-web] copied 92 top-level *.js/*.css file(s)
[copy-web] done. www/ is ready for `npx cap sync ios`.

$ git hash-object www/impact-flight.js impact-flight.js
d6c0961060ac6c87c2e99bc6bd20ec1c55d6dd8b
d6c0961060ac6c87c2e99bc6bd20ec1c55d6dd8b     ← byte-identical

$ grep -nE "^\s*[^/*].*spinLoft\s*\*\s*ballSpeed|preset\.spinK|MIN_TOTAL_SPIN_RPM\s*=" www/impact-flight.js
NONE — every hit is a comment

$ grep -c "centeredImpactSpin\|spinCal" www/impact-flight.js
10

$ grep -n "spinK\|1500" www/impact-flight.js
121: // Only a sanity ceiling remains. The historical 1500-rpm floor is gone: it existed
123: // pinning total spin at an unphysical 1500 rpm and starving the curve. Calculated
255: //   spinLoft·ballSpeed·k magnitude and its 1500-rpm floor. Axis and launch
300: // a 9000 rpm sanity ceiling. The old fitted spinLoft·ballSpeed·spinK product
301: // and its 1500-rpm floor are GONE — do not reintroduce either.
378: //   spinK slope, the 1500-rpm floor and its blend are gone — only a sanity
```

All six survivors are comments narrating the removal. No executable old path remains.

⚠️ Correction to an earlier claim I made: **`www/` is gitignored**, so the stale bundle was
never committed and was never a merge risk — it is a build artifact. My earlier statement that
"the stale copy is committed" was wrong.

---

## 5. UI CONSUMERS

| Surface | Reads | Verdict |
|---|---|---|
| `impact.html` | spinAxis, curve, offline, backspin, spinLoft (chips at :690-709; pin deltas :858, :877-880) | **No change needed.** Numeric chips only — no formula text, no popover, no explainer constant anywhere in the file. |
| `impact-annotate.js:185` | curve | **No change needed.** Threshold `if (Math.abs(curve) >= 3)` hides the dimension label on near-straight shots. Checked live: default state gives 12.65 m, a 1° face-only gap gives 6.33 m. Still fires only where intended. |
| `impact-annotate.js:297-299` | offline | **No change needed.** `statsFlip` hysteresis is sign-based, scale-independent. |
| `impact-outcome.js` | all of them | **Changed** — §1 domain guard. Unit conversions untouched. |
| `academy.html` | spinAxis, curve, offline, backspin, spinLoft, spinRpmRaw | **Changed** — §4a (widget maths, gauge labels, formula panel, 4 identity strings). **Prose NOT done** — §4b, §9. |
| `academy-backspin-model.js` | backspin, spinRpmRaw | **Changed** — §4c. |
| `academy-native-lesson.js` | displayLimit | **Changed** — badge, aria-label, glossary card, sensitivity copy. |
| `academy-wind-model.js` / `-carry-side-model.js` / `-shape-model.js` | spinAxis, curve, offline, backspin | **Changed** — §2 recalibration. No stale constants; all call `solveFlight` live. |
| `academy-delivered-loft-launch-model.js:24` | backspin | **Not changed — flagged.** `backspinClamp: flight.backspin === 1500 ? 'floor' : null` is exact equality against a value the engine can no longer emit. Genuinely unreachable dead branch, cosmetically harmless (the lesson silently stops annotating). Its *tests* were recalibrated (§2); the branch itself is left for the owner. |
| `geometry.html`, all of `geo3d/` | — | **No change needed.** They import only `swing-parameters-and-impact.js` (swing geometry). They never touch the ball-flight engine. Verified: zero `spin` hits. |
| `diagnose-engine-v2.js`, `tools/diagnose-harness-v2.mjs` | curve, offline | **Not changed.** Not reachable from `index.html` (absent from `config/flightglass-surfaces.json`). Both call `solveFlight` live so their numbers are correct; only their prose comments are stale (`"spinK 1.8"`, `"no driver preset / byte-identical"`). |
| `impact-presentation.html`, `design/mocks/*`, `*-mock.html` | various | **Not changed.** Classified `reference` / not routed. `impact-presentation.html:398,459-460` holds a frozen copy of the old engine by design (self-declared standalone export). |

Also audited and confirmed clean: no non-test shipping file still references the removed
`smashConst`, `spinAxisGain`, `axisMax`, `curveFactor`, `offlineCapFrac`, `carryMax`,
`carryTau`, `spinK`, `minTotalSpinRpm`, `spinFloorFullAtDeg`, `spinFloorBlend`, or
`spinFloorAppliedRpm` as live identifiers.

---

## 6. DOCS

**`docs/systemkontrakt.md`** — all three corrected:

- **:193** — `spinAxisGain` removed from the breakdown-constants list, with a note that the
  spin axis is now the exact D-plane tilt from `v × n`, so there is no gain constant to expose;
  the calibration that *does* exist is `spinCalibration` (= `preset.spinCal`).
- **:224** — the clamp list is now `smashEff [1.15, 1.42]`, `landingAngle [32, 60]`, total spin
  ≤ 9000. Added an explicit note that three clamps documented there **do not exist** and must
  not be reintroduced: no `spinAxis` ±38°, no 1500 backspin floor, and no `OFFLINE_CAP_FRAC`
  55 % / `curve` 60 % cap — `offline` is `carry·sin(startDirection) + curve`, uncapped
  (`impact-flight.js:294`).
- **:336-337** — the old backspin formula and its wrong line citation are gone. Both the code
  block and the prose now show `signedVerticalSpinLoftDeg > 0`, with a blockquote explaining
  why the sign carrier changed.

**`docs/ENGINE-CHANGE-REPORT.md`:89-97** — the ESTIMATE entry describing `K = 1.8 / 0.93` and
the blended 1500 floor is struck through and marked **SUPERSEDED by `e7d3133`**, replaced with
the Penner description, the single shared `spinCal = 1.065`, the 9000-only bound, and how the
calibration was anchored (7-iron 6793.9 → 6705.9, −88 rpm).

---

## 7. CLEANUP

```
$ ls impact-flight.BEFORE.mjs scripts/engine-3d-measure.mjs outputs/engine-3d-* 2>&1
(no such file or directory — all deleted)

$ git status --short | grep '^??'
?? .impeccable/
```

`impact-flight.BEFORE.mjs`, `scripts/engine-3d-measure.mjs`, `outputs/engine-3d-tests/` and
`outputs/engine-3d-review-package.md` are deleted. All three were confirmed **not** gitignored,
so they would otherwise have entered the commit.

`.impeccable/` is the design-hook tool's own directory, not mine — left in place.

Note: the earlier review package and the raw test logs were copied outside the repo before
deletion (session scratchpad, `preserved/`) so the deliverable was not destroyed.

---

## 8. INVARIANTS — actual current values

Measured against the working tree after every change above.

**Neutral** `{clubSpeed 100, dynamicLoft 25, attackAngle −3, faceAngle 0, clubPath 0, '7iron'}`

```
spinLoft = 28                      (= dynamicLoft − attack = 25 − (−3) = 28)   PASS
spinAxis = 0                                                                    PASS
curve    = 0                                                                    PASS
backspin = 6705.882635643557       (deviation from 6706 = 0.1 rpm)              PASS
```

**Driver** `{clubSpeed 100, dynamicLoft 11, attackAngle 1, faceAngle 3, clubPath 0, 'driver'}`

```
totalSpinRpm       = 2586.969709685003     (~2587)   PASS
backspin displayed = 2477.7136505754415    (~2478)   PASS
spinAxis           = 16.47633996421228     (~16.5°)  PASS
carry              = 206.4938064037143               bit-identical to pre-fix
ballSpeed          = 141.82620974355004              bit-identical to pre-fix
smash              = 1.4182620974355005              bit-identical to pre-fix
```

**Driver vs hybrid** (hybrid = loft 22, attack −3, 100 mph, 7-iron preset)

```
driver spinAxis 16.47633996421228 / hybrid spinAxis 6.542025556459221
tilt ratio = 2.518538000504215     (~2.52x)   PASS
```

All invariants hold.

---

## 9. STATE + OPEN

**Latest commit: `e7d3133`.** Nothing was committed in this pass — all changes are uncommitted
working-tree modifications. 22 files:

```
academy-air-density-content.js
academy-backspin-model.js
academy-native-lesson.js
academy-wind-content.js
academy-wind-model.js
academy.html
docs/ENGINE-CHANGE-REPORT.md
docs/systemkontrakt.md
impact-flight.js
impact-outcome.js
package.json
scripts/academy-air-density-browser.test.mjs
scripts/academy-backspin-browser.test.mjs
scripts/academy-backspin-model.test.mjs
scripts/academy-carry-side-browser.test.mjs
scripts/academy-carry-side-model.test.mjs
scripts/academy-delivered-loft-launch-model.test.mjs
scripts/academy-shape-browser.test.mjs
scripts/academy-speed-transfer-model.test.mjs
scripts/academy-wind-browser.test.mjs
scripts/academy-wind-model.test.mjs
scripts/impact-flight-calculated-spin.test.mjs
```

(`www/` also regenerated by copy-web, but it is gitignored.)

### NOT COMPLETED

**1. The lesson prose purge — 36 literal deleted-formula strings across 8 lessons.**
Owner approved a full rewrite of all nine lessons. Executing code and all four identity strings
are done; the JSON lesson prose is not. Remaining, by signature:

```
carry^2 x spinAxis / 12000        8×
carry² × spinAxis / 12000         6×
carry²·spinAxis/12000             5×
spinAxis = clamp(1.5 …)           8×  (four spelling variants)
spinLoft × ballSpeed × 1.8        5×  (three spelling variants)
1,500-9,000 rpm                   2×
f.spinLoft*f.ballSpeed*1.8*0.6    1×  (executing — prototype bar chart)
f.ballSpeed*33*1.8*0.4            1×  (executing — prototype bar chart)
```

Affected: `lesson-backspin`, `-dynamic-loft`, `-face-angle`, `-club-path`, `-spin-loft`,
`-spin-axis`, `-curve`, `-offline` — plus `lesson-carry` and `lesson-altitude`, which were
outside the original scope and also contaminated.

**Why I stopped instead of search-and-replacing.** I measured whether the lessons' underlying
claim survives, and **it does not.** They teach "curve scales with carry²". In the integrated
engine, holding face +2 / path −5 and sweeping club speed 70→120 mph:

```
speed  carry    spinAxis   curve    curve/carry²×12000
70     124.5    10.958      7.45     5.768
80     148.5    10.958     11.52     6.269
90     172.0    10.958     16.46     6.678
100    193.5    10.958     22.02     7.055
110    211.3    10.958     27.81     7.478
120    223.0    10.958     32.33     7.801
```

If curve tracked carry² the last column would be constant. It rises 35 %: curve grows **faster
than quadratic**, because a longer flight spends more time under Magnus lift. The qualitative
teaching point ("the driver is the great exposer") is strengthened, but every worked example
derived from the carry² law is wrong, and `lesson-curve` / `lesson-offline` derive whole
chains of numbers from it (7.1 / 26.0 / 46.3 yd). Swapping the formula string while leaving
the reasoning would produce coherent-looking but still-false content.

Replacement numbers are measured and ready. Examples:

| delivery | lesson asserts | engine gives |
|---|---|---|
| face 0 / path −8 | spinAxis 12°, curve 29.7 yd, offline 23.7 yd | **12.47°, 18.71 yd, 12.71 yd** |
| face +2 / path 0 | tilt 3.0°, curve 7.4 yd, offline 11.9 yd | **3.17°, 4.78 yd, 9.29 yd** |
| face +2 / path −5 | tilt 10.5°, curve 26 yd | **10.96°, 16.46 yd** |

**2. `test:webkit` never executed** (§3) — gated behind `test:academy-foundation`, which stops
on the 2 pre-existing voice failures. Unverified in this pass.

**3. Two pre-existing failures remain**, verified identical on `origin/main@6a65d55`:
`academy-voice-pack` (licensed-master check) and `academy-voice-production` (`1578 !== 1546`
caption cues). Not physics. They keep `npm test`'s exit code non-zero.

**4. Deferred as instructed:** driver still shares the 7-iron longitudinal carry fit, so driver
carry is understated. Untouched. Stays open.

### Corrections to my own earlier reporting

The reviewer may have inherited these from my previous summaries:

1. I claimed `academy-backspin-model.test.mjs` "is in npm test and passes anyway". **Wrong** —
   it was 8 pass / 6 fail. I had not run it directly.
2. I claimed `www/` was tracked and the stale bundle "is committed". **Wrong** — `www/` is
   gitignored; it is a build artifact and was never a merge risk.
3. I described `npm test` as two phases. **It is three** — `test:academy-foundation` (244
   tests) plus `test:webkit`. Earlier runs were cut off before the third, which is where the
   last five failures were hiding.
4. An earlier report gave the driver-vs-hybrid pre-fix curve ratio as 0.86 and attributed the
   post-fix residual to "longer flight time". Both wrong: the measured pre-fix ratio is
   **0.9587**, and the driver flies **shorter** (3.804 s vs 5.987 s). The real decomposition is
   RK4 bend 1.0983 × carry-projection 1.2358 = 1.3573 — meaning roughly three-quarters of the
   driver's curve advantage comes from the disclosed compatibility projection, not aerodynamics.
   That materially weakens the earlier "≥1.8 is physically unreachable" conclusion: the lever is
   the carry projection, not the spin calibration.
