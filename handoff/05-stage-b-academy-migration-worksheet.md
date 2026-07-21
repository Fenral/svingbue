# Flightglass handoff 05 — Stage B Academy migration worksheet

Date: 2026-07-21
Author: Fable 5 (engine technical owner), preparing Stage B for the terminal agent.
Engine baseline: `1a84b80` (verified in handoff 04-response). Engine gate 62/62 green.
Status of this document: **analysis + verified proposals**. No Academy file was
edited and no gate was weakened to produce it. The redesigns below need the
owner's pedagogical sign-off before they are applied.

---

## The one finding that reframes Stage B

The 30 Academy REDs are **not stale numbers to regenerate**. They are five
interactive lessons built on physics *relationships* that the recalibration
corrected. In several cases the old lesson taught a relationship that was an
**artifact of the miscalibrated engine**. Migrating them means rebuilding each
lesson around the now-correct physics — a content/pedagogy task, not a
mechanical value refresh, and explicitly gated (no predicate may be widened, no
protected scenario moved, to force green).

Five systemic shifts drive every failure:

| # | Quantity | Old engine (what the lessons encode) | Corrected engine |
|---|---|---|---|
| 1 | **Landing angle** | rises with **launch** (`45 + .5(sl−25) + .6(launch−14) + (apex−30)`), up to 60° | saturating in **vertical spin loft** only: `52.8 − 41.5·e^(−vsl/10.9)`, hard max **52.8°** |
| 2 | **Smash** | linear in spin loft (`1.46 − .004·sl`), 1.15–1.42 | quadratic in 3-D spin loft; range ~**1.15–1.52** |
| 3 | **Launch** | flat **0.62°/loft** + 0.25°/attack | **quadratic** in loft (local slope ≈ **0.564°/loft** at 30°); attack still **0.25°/°** |
| 4 | **Backspin** | fitted magnitude with a **1500 rpm floor** | Penner calculated, **no floor**, continuous to 0 |
| 5 | **Carry** | awarded even below launch domain | scaled by **launch efficiency** `√(clamp(launch/10))`; ~0 below ~10° launch |

Shift #1 is the deepest: three lessons (Carry, Flight Height, and the descent
half of Backspin) were built by picking deliveries with the **same spin loft but
different launch** to show "different landing." Under the corrected physics those
deliveries now land *identically*, so the lesson's payoff disappears. The fix is
to pick deliveries with **different spin loft** instead — which teaches the same
concept truthfully.

---

## Per-lesson migration

Every "current" number below is a fresh `solveFlight` output at `1a84b80`.

### 1. Delivered Loft & Launch — 6 fail

Teaching goal: launch is set by delivered loft and attack; two different
deliveries can share a launch yet differ downstream.

- **Base value pins (Test 1):** MECHANICAL. Launch `(30,−4)` moved `17.60 →
  15.13`, `(34,−4)` `20.08 → 17.53`, `(30,0)` `18.60 → 16.13`; siblings moved
  coherently. Regenerate the pinned triples from the current engine.
- **Per-degree sensitivity (Test 2):** STRUCTURAL (content). The lesson states
  **0.62°/loft**; the corrected engine gives **0.564°/loft** at 30° and, because
  launch is now quadratic in loft, the slope is no longer constant. Attack is
  unchanged at **0.25°/°**. The lesson copy and the `≈0.62` assertion must both
  move to "≈0.56°/loft near a 7-iron, and it varies with loft."
- **Equal-launch pair (Tests 3, 5, 6) + ceiling clamp (Test 4):** STRUCTURAL.
  Old pair `(28,+5)/(32,−5)` no longer shares a launch (16.33 vs 16.04) and both
  fall outside the `[18.4,18.8]` band; the `(34,−4)` "landing = 60 ceiling" probe
  is unreachable (max 52.8°).
  **Proposed replacement pair (verified):** `A(30,+2)` launch **16.63°**,
  spin loft 28 · `B(33,−5)` launch **16.65°**, spin loft 38 — equal launch,
  opposite attack, spin-loft gap **10**. Re-center the launch band on ~16.6° and
  drop the ceiling-clamp assertion (or repoint it at the real 52.8° saturation).

### 2. Carry — 4 fail

Teaching goal: equal *current* carry does not prove equal real carry / equal
flight.

- **Speed fixtures (Test 1):** MECHANICAL. The Carry adapter calls `solveFlight`
  directly (no reconstruction), so this is pure pin regen: `cs70` ball/carry/total
  `92.96/124.79/128.77 → 95.32/124.76/128.67`; `cs90 → 122.56/174.00/179.45`;
  `cs110 → 149.80/229.28/236.46`.
- **Equal-carry pair (Tests 2, 3, 4):** STRUCTURAL — this is the shift-#1 case.
  Old pair `(25,−5,90)/(35,5,90)` shares spin loft 30, so under the corrected
  engine both now land at **50.15°** and total **183.63** (landing/total gap = 0);
  the lesson's "wildly different descent" payoff is gone, and the pinned
  `174.15–174.35 / 120.5–120.7` bands and the `landingGap≥12 / totalGap≥3 /
  highClamp==60` predicates are unreachable.
  **Proposed replacement pair (verified):** `A(22,+2,cs88)` carry **183.85**,
  landing **46.18°**, spin loft 20 · `B(42,−4,cs102)` carry **183.80**, landing
  **52.19°**, spin loft 46 — **equal carry, landing gap 6.0°, spin-loft gap 26**.
  This restores the lesson's exact point through the *correct* mechanism: same
  carry, genuinely different descent because descent now tracks spin loft.
  Re-center the carry band on ~183.8 and repoint the descent-gap predicate at the
  new landing gap (~6°, not ≥12).

### 3. Flight Height & Descent — 7 fail

Teaching goal: same apex can hide different descent; height and descent are
distinct.

- **Landing ledger (Test 3) + raw-60 clamp (Test 4):** STRUCTURAL. The adapter
  reconstructs the deleted 4-term decomposition and now fails closed; the real
  decomposition is `52.8 − 41.5·e^(−vsl/10.9)` (fields `landingBase`,
  `landingSpinTerm`, `landingDomainTerm` on the engine output). Rebuild the
  ledger visualization on the saturation form. The raw `60.608°` probe is
  unreachable (max 52.8°).
- **Launch/speed apex pins (Tests 1, 2):** MECHANICAL-ish, but note the teaching
  contrast collapses: all three launch fixtures share spin loft 33, so they now
  all land at **50.79°** (old: 48.08 / 54.35 / 60). Regenerate apex pins; the
  "landing changes across these three" narrative must be dropped.
- **Same-apex pair (Tests 5, 6):** STRUCTURAL — shift-#1 case. Old
  `(25,−3,105)/(31,−7,85)` no longer shares apex (34.28 vs 28.05) and landing gap
  is only 1.91°.
  **Proposed replacement pair (verified):** `A(22,+2,cs94)` apex **31.90**,
  landing **46.18°**, spin loft 20 · `B(42,−4,cs80)` apex **31.82**, landing
  **52.19°**, spin loft 46 — **equal apex, landing gap 6.0°, spin-loft gap 26**.
  Re-center the apex band on ~31.85 and the landing-gap predicate on ~6°.

### 4. Speed Transfer — 4 fail

Teaching goal: equal ball speed can come from different club-speed/spin-loft
deliveries; ball speed alone doesn't reveal delivery.

- **Adapter (all tests):** STRUCTURAL. The adapter builds a *local linear* smash
  line from `engineAt(100,30/31)` and throws when the real quadratic smash
  diverges, so every off-30 fixture fails closed. Replace the linear
  reconstruction with the engine's exposed quadratic smash terms (or drop the
  reconstruction and read `smashEff` directly).
- **Primary pins:** MECHANICAL after the adapter is fixed. Smash at sl33 is
  **1.362** (old 1.328); regen the five triples.
- **Smash clamps:** STRUCTURAL. Upper smash is now **1.52** (old 1.42); lower
  **1.15** (unchanged). Move the `1.42` assertion to `1.52`.
- **Equal-ball-speed pair:** STRUCTURAL. Old `(96,25)/(102,45)` now gives
  136.22 vs 128.56 mph (gap 7.66).
  **Proposed replacement pair (verified):** `A(cs82,sl22)` ball **117.94**,
  smash 1.438 · `B(cs91,sl41)` ball **117.96**, smash 1.296 — equal ball speed,
  club-speed gap **9**, spin-loft gap **19**, smash gap **0.14**. Re-center the
  `[130.46,130.66]` band on ~117.95 and keep the gap predicates (all satisfied).

### 5. Backspin — 9 fail

Teaching goal: spin follows spin loft; the display has a real ceiling (9000) but
**no floor** (the corrected engine's headline lesson — and this half is already
written to the new truth).

- **`backspinEngineInput` inverse (root cause):** MECHANICAL but load-bearing.
  It still inverts requested ball speed → club speed with the **old linear
  smash** (`1.46−0.004·sl`), so a lesson that asks for "ball speed 120" now
  actually feeds ~124.5. Replace with a solve against the current smash (invert
  the quadratic, or Newton-iterate club speed until `ballSpeed==target`). Every
  Backspin number depends on this fix, so do it first, then re-measure.
- **Value/delta pins:** MECHANICAL after the inverse fix (e.g. cause-chain
  `+1 loft` rpm delta moved 209 → ~422; regen).
- **Mastery target `rpm∈[6800,7400]` at `(30,−3,120)`:** RE-MEASURE after the
  inverse fix, then decide. With the broken inverse it reads 6650 (RED). If the
  corrected inverse still can't reach 6800–7400 at DL30, the *target band*
  is structural and must move to the real stopping-flight window — never widen
  the band to swallow the old number.
- **"Carry steady at fixed ball speed" (Test 118):** STRUCTURAL. It spans DL10,
  whose launch is below the ~10° carry-efficiency domain, so carry is no longer
  equal across DL10↔DL48. Pick two lofts both inside the launch domain, or reframe
  the claim to "within the airborne domain."
- The no-floor / ceiling contrast tests already encode the corrected engine and
  should pass once the inverse fix stops perturbing the fed ball speed.

---

## What is safe to auto-apply vs what needs the owner

**Safe for the terminal agent to apply mechanically** (forced by the new engine,
predicate preserved, no pedagogy changed):

- Carry Test 1 speed-fixture pins.
- Delivered Loft Test 1 base value pins.
- Speed Transfer adapter rewrite to the exposed quadratic smash + primary pins.
- Backspin `backspinEngineInput` inverse fix + downstream value/delta pins.
- Flight Height landing-ledger adapter rebuilt on the saturation decomposition.

**Needs the owner's pedagogical sign-off** (new teaching scenarios / changed
copy — proposals above are verified but are design choices):

- Delivered Loft: new equal-launch pair + "≈0.56°/loft, and it varies" copy.
- Carry: new equal-carry/different-descent pair + re-centered bands.
- Flight Height: new same-apex pair + dropped "landing varies with launch"
  narrative + rebuilt ledger copy.
- Speed Transfer: new equal-ball-speed pair + `1.52` upper-smash copy.
- Backspin: mastery-target band decision after the inverse fix; "carry steady"
  reframing.

After the model/adapter/content changes, the lesson also needs its **voice/text
regeneration and browser evidence** rerun (per the audit's downstream list) — that
is terminal-side work requiring the Playwright/WebKit + voice toolchain.

## Stage B — engineering pre-fixes applied and verified (patches attached)

Two adapter fixes are pure engineering — they make the adapter honest to the
corrected engine, needed regardless of which pedagogy the owner chooses — so they
are done and verified. They do **not** by themselves green their suites (the
structural fixtures/predicates/content still need the owner). Engine gate is still
62/62 after these edits; only the two Academy adapters changed.

### Patch 1 — `handoff/patches/backspin-inverse-fix.patch`

`academy-backspin-model.js` `backspinEngineInput` inverted the requested ball
speed with the **deleted linear smash** (`1.46 − 0.004·spinLoft`), so a lesson
asking for "ball speed 120" actually fed ~124.5. Because smash is a function of
3-D spin loft (geometry) only — independent of club speed with face/path square —
one probe solve gives the exact live smash. After the fix every state holds its
requested ball speed exactly (verified: 120.00 across DL10/25/30/48).

Concrete post-fix measurements (these sharpen the owner's decisions):

| State | Post-fix | Verdict |
|---|---|---|
| INITIAL `(25,−3,120)` | rpm **4609** (old pin 5970), spin loft 28 | pin regen |
| mastery `(30,−3,120)` | rpm **6485**, landing 50.8° | **STRUCTURAL** — 6485 < the `[6800,7400]` band; owner repoints target delivery or band, never widen |
| carry-steady `(10,−3,120)` vs `(48,−3,120)` | carry **148 m** vs **155 m** | **STRUCTURAL** — DL10 is below the launch-efficiency domain, so carry is no longer equal; pick in-domain lofts or reframe |
| no-floor `(10,6,90)` | rpm **449** (old pin 632), noFloor true | mechanism intact, pin regen |
| ceiling `(48,−8,160)` | rpm 9000, raw **17465** | ceiling intact, raw pin regen |
| mission thresholds | build ≥7000 / cut ≤3500 | re-check against the new spin scale (owner) |

### Patch 2 — `handoff/patches/speed-transfer-quadratic-smash-fix.patch`

`academy-speed-transfer-model.js` reconstructed the Smash line from a local
two-point fit (`engineAt(100,30)`/`engineAt(100,31)`), assuming Smash was linear
in spin loft; the recalibrated Smash is quadratic, so it threw
`Transfer adapter diverged` for every delivery away from 30°. The fix reads the
engine's **exposed** quadratic coefficients (`smashModelIntercept`,
`smashSpinLoftLinear`, `smashSpinLoftQuadratic`, `smashMinimum`, `smashMaximum`)
— still no duplicated calibration constants. Verified: it now tracks the engine
across the whole range (sl 10→77.5) and clamps `lower` only at the real limit.
Note: this exposes that the upper Smash bound is now **1.52** (old lesson pins
1.42) — a displayed-value change for the owner.

These two patches apply cleanly with `git apply` against the engine-branch
Academy files (byte-identical to what the recalibration inherited). Everything
else in the per-lesson sections above — new fixtures, moved predicate bands,
lesson copy, voice regeneration, and browser/WebKit evidence — remains the
owner-authorized migration on the terminal side.

## Doctrine compliance

No predicate was widened and no protected scenario was moved in this document.
Every proposed replacement fixture is a real `solveFlight` output that satisfies
the lesson's *existing* structural intent (equal X, meaningful gap) through the
corrected mechanism, so the migration tightens truth rather than loosening a gate
to recover green. The mechanical items are forced by the recalibration; the
structural items are flagged for the owner precisely because they are pedagogy,
not arithmetic.
