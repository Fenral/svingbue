# Diagnose My Shot — v3 «VALUES» (delta-spec over v2)

**Author:** Fable 5, design director · **Date:** 2026-07-10 · **Status:** design locked, buildable.
**Base documents:** `docs/diagnose-spec-v2.md` (interview/state machine/SHARPEN — everything not amended here applies verbatim) over `docs/diagnose-spec.md` (v1 grammar). **Numerical ground truth:** `docs/diagnose-harness-v2-findings.md` + the shipped `diagnose-map-v2.json` + `impact-flight.js` (read-only). Every number in this spec was produced by node runs against those exact files — run log in **Appendix B**. The v1/v2 honesty doctrine governs unchanged, including the **driver absolute-yardage ban** (`meta.bands.speed.absoluteCarryTrusted === false`); 7-iron carry stays trusted (the engine's calibration target).
**Owner's brief:** the reverse function must return more **VALUE** — "high speed says nothing." Get **values** in; decide **sliders vs intervals**; the goal is **new insight**.

---

## 0. The value thesis — and the finding that reorders it

I tested the naive value proposition first: *"a neutral delivery at your speed carries ~X m — this pattern costs you ~Y m."* The engine refuses the big version of that sentence, and the refusal **is** the product.

> **Finding V-1 (engine-vs-intuition, extends findings #1).** Matched-speed, the carry cost of a delivery pattern is **small**: the coach's own slice (scenario a: face +2.9°/path −6.6°, loft 33°, attack −5°, 83.9 mph) carries 141.9 m vs 145.7 m for a neutral delivery at the same speed — **3.8 m (2.6 %)**. The everyday driver slice costs **1.1 m (0.6 %)**. The snap-hook *gains* 3.9 m. A "you're leaving 23 m of carry on the table" line would be **fabricated** — the grid's worst 7-iron geometry loss is 8.8 %, the driver's 4.9 % (findings #1), and typical diagnosed patterns sit far below the worst case.
>
> **Where the real value hides: the target line.** The same slice finishes **27.1 m right of the target line** (26.1 m of it pure curve), and the neutral delivery recovers **all of it**. The driver slice finishes **75.1 m** offline — **41 % of its carry, a 22° miss angle**. The honest headline is therefore an inversion of what the golfer believes: **"Your slice isn't costing you distance — distance is speed. It's costing you the fairway."** That sentence is new insight, it is 100 % engine-derived, and it is the emotional core of v3.

Everything below is built around that inversion: carry-cost is quoted *small and honest* (it busts a myth), direction-cost is quoted *big and honest* (it changes behaviour), and one extra `solveFlight` per card ("half the gap") turns the diagnosis into a forecast.

---

## 1. The insight inventory — ranked by insight-per-honesty

Each candidate was computed against the shipped data (Appendix B). Verdicts:

### 1.1 ⭐ THE COST LINE — potential vs actual, target-line first  *(build; the ONE headline)*

**Mechanism:** two `solveFlight` calls — the top story's stored representative (already speed-matched per v2), and the club's **neutral delivery at the same club speed** (7-iron: face 0/path 0/attack −3/loft 28 — the harness's well-struck baseline; driver: face 0/path 0/attack +2/loft 13). Pure, deterministic, no map growth.

**7-iron rendering (absolute metres allowed):**
> *A square delivery at this speed lands on your line and carries ~146 m. This pattern gives up **27 m sideways** — and only **4 m** of carry.*

**Driver rendering (yardage ban → relative + angular only):**
> *This delivery flies **22° off your target line — 4 m sideways for every 10 m of flight**. A square strike at the same speed flies the same distance, on line: the slice costs you the fairway, not the yards.*

Decision, justified: for driver we print **degrees** (`atan2(offline, carry)` — carry-scale cancels to first order) and **"N m sideways per 10 m of flight"** (a pure ratio, offline/carry = 41 %). Never metres of carry, never metres of offline (both inherit the understated driver carry scale). The ratio/angle form is *more* vivid than yardage anyway.

**Guard-rails (must-implement):** the carry clause switches by sign/size — pattern gains carry (snap-hook: +3.9 m) → *"…and actually squeezes out ~4 m more carry — hot, flat and unplayable is still unplayable"*; way-short answers → the clause defers to the existing contact card (`bandLossPct` copy, v2 §2 moment 1: geometry can only cost 2.3–4.9 % on the "Noticeable loss" band). The cost line NEVER exceeds the grid's `worstGeometryLossPct` (4.9 %) — assert in dev mode.

### 1.2 ⭐ THE "HALF THE GAP" SENSITIVITY LINE  *(build; one extra solveFlight, fully honest)*

Re-solve the representative with the face moved halfway to the path (`face' = path + (face−path)/2`). Rendering (7-iron scenario a):
> *Close half of that 9.5° face-to-path gap and the miss shrinks from **27 m to 5 m**. You don't need a new swing — you need half the gap.*

Driver (relative form): *41 % of carry sideways → 15 %; 22° → 8°.* Snap-hook: 49 m left → 16 m. This is the app's first **forecast** — the reader leaves knowing what a *practical improvement* (not perfection) buys. Costs one `solveFlight` per rendered card; render for the top story only.

### 1.3 SPIN-LOFT CONTEXT BAND, now with numbers  *(build; extends what v2 ships)*

v2's coach story already qualifies spin loft ("a lot / healthy / low") via `spinLoftBand()` — grid-derived cuts. v3 prints the band's edges so the number gets a ruler: 7-iron healthy ≈ **25–34°** (grid spin-loft range 14–40°, cuts at 0.44/0.77), driver healthy ≈ **12–19°** (range 2–24°). Rendering: *"38° spin loft — the healthy 7-iron window is about 25–34°."* Zero new computation (cuts already exist in `spinLoftBand`); pure copy upgrade. Supporting texture allowed on the same card when the band is "alot": backspin vs neutral (7,506 vs 6,255 rpm, scenario a) — engine numbers, one line, never a second paragraph.

### 1.4 DELIVERY NUMBERS vs "NORMS" — build ONLY with external anchors  *(the honesty trap, documented)*

The brief's example — *"your face-to-path gap ~9° — matched deliveries at your speed sit at 2–4°"* — is **not honestly computable from the map**. I computed the delivery-space gap distribution (7-iron, gridCount×speedHist-weighted): p25/p50/p75/p90 = **3/5/9.4/13°**. Those quantiles describe the **uniform ±8° input grid**, not a population of golfers — quoting them as "deliveries at your speed sit at…" would smuggle a fake demographic into the one product surface built on honesty. **Verdict: banned as a norm.** What IS allowed (Academy precedent — lessons quote TrackMan tour tables as labelled external benchmarks): a content-anchored line, marked as a benchmark, never as engine output: *"Tour players keep face-to-path inside ~2° on stock shots."* Ship it as a static, muted benchmark row (`--muted`, "TOUR" micro-label), not a personalized claim.

### 1.5 The map-only potential (neutral-bucket p50 vs matched p50) — **rejected as mechanism**

Computable (verified): matched top cluster carryM p50 **143.7 m** vs neutral bucket p50 **149.2 m** → "5.5 m". But both p50s are **all-speed marginals** (the neutral bucket skews faster: 37.6 % fast vs 33.3 %), so the difference confounds speed with geometry — the exact confusion v3 exists to dispel. The engine-solve pair (§1.1) at matched speed is strictly more honest and costs nothing. Rejected; documented so nobody rebuilds it.

### 1.6 The personal yardstick — carry inversion  *(build; unlocked by the §2 slider)*

When the user gives their real 7-iron carry, invert the trusted 7-iron carry curve to their implied club speed (monotone root-find on the neutral solve; verified: 106 m → 65.9 mph, 130 → 76.8, 145 → 83.6, 160 → 90.6, 185 → 103.8) and re-solve the whole §1.1/§1.2 pair **at their speed**. Now every number on the card is *theirs*: told 145 m → *"this pattern turns your 145 m into 141 m, 27 m right of your line"* (engine: actual 141.2 m, offline 26.8 m). Told 120 m → 18.5 m offline. The cost line scales visibly with the reader — that's what makes it feel measured rather than templated. 7-iron only (the ban); driver keeps ratio/degree form regardless of input.

**Ranking summary:** 1.1 > 1.2 > 1.6 > 1.3 > 1.4 (benchmark-only) · 1.5 rejected. Cut-line discipline: a result card renders **at most** the cost line + the half-gap line + the (existing) spin-loft story. Nothing else. Insight-wallpaper is the failure mode this section exists to prevent.

---

## 2. SLIDERS vs INTERVALS — the verdict falls out of the data structures

The rule that decides every field: **give a slider only where the stored conditioning math is genuinely continuous; give intervals where the data resolves in bands.** Anything else is fake precision wearing a precise control.

| Field | Input | Why (data-structure ground truth) |
|---|---|---|
| **Speed** (S1) | **Intervals** — keep v2's 3 chips + anchors + `Not sure` | `reweightSpeed` consumes `speedHist{slow,mid,fast}` — three buckets is the map's entire resolution. An mph slider would quantize invisibly to the same three numbers: precision theatre. The chips' anchor copy (7-iron mid: "…around 145 m carry…") already carries the teaching. |
| **Carry** (SHARPEN, 7-iron only) | **SLIDER** — detented, 5 m steps, range **90–200 m** (map ground truth: cluster carryM p10 min 91 m, p90 max 198.1 m over 1,459 cluster stats), 44 px thumb, arrow-key = 1 detent, `Skip` chip beside it | `reweightCarry` interpolates a real per-cluster CDF (`carryM{p10,p50,p90}`) — genuinely continuous conditioning that bands cannot express — **and** the value is doubled by §1.6: the typed number becomes the yardstick every cost line is denominated in. This is the one place a slider earns its precision. |
| **Height** | **Intervals** (unchanged) | Clusters store **no** height/apex stats (cluster = `speedHist·carryM·alsoProduces·startLineMix` only) — height already did its work keying the bucket. A "height in metres" input has nothing to condition and would lean on the engine's EST-flagged apex model. Rejected. |
| **Distance** (S4) | **Intervals** (unchanged) | Percentile band edges are the data (`meta.bands.distance.edges`); relative-to-your-normal is the honest frame. |
| **Divot / shape / severity / secondary** | **Chips** (unchanged) | Hard filter / band semantics. |

**Honest cap on the slider's diagnostic power (measured, must shape the copy):** within an already-keyed bucket, carry reweighting barely re-ranks stories — scenario (a)'s top story moves only **72.1 % → 71.0 %** across a 110→185 m sweep, exactly the findings-§4 orthogonality (carry bits pin magnitude, not fault). So the slider's UI copy must promise the right thing: **"pin your numbers"** (yardstick), never "sharpen the diagnosis." The `REFINED BY…` eyebrow still applies (the reweight is real), but the sell is personalization.

**Placement (argued, per brief):** pre-reveal stays ≤ 6 taps and **gains nothing** — carry's fault-resolving power is ~nil (above) and the reveal must not stall while someone recalls a number. The slider lives in the **SHARPEN row** (v2 §3 slot 2, upgraded): answering it re-renders the cost line at the personal yardstick with the bars-and-ember refine choreography. The "Not sure" law is intact — `Skip` costs nothing, and without carry the cost line simply renders at the rep's speed-band numbers (§1.1 default).

---

## 3. Results-side rendering

### 3.1 Where each line lives (the two-register law survives intact)

Card 1 anatomy, top to bottom (existing v2 grammar in plain text, v3 additions in **bold**):

1. Eyebrow (confidence register — "Most likely · about 7 in 10 matches")
2. Title (certain register — face↔path assertion)
3. Coach story line (spin-loft chain) **+ §1.3 band edges appended to the qualifier**
4. **THE COST LINE (§1.1)** — one sentence, 13 px, directly under the coach story. Register: **certain-conditional** — it asserts engine arithmetic *of this pattern* ("this pattern gives up…"), inheriting the ranked hedging from the eyebrow rather than restating it.
5. **THE HALF-GAP LINE (§1.2)** — 12 px `--muted`, prefixed `IF ·` (mono micro-label), reads as forecast.
6. Body, variants, teaching moments, CTA — unchanged.
7. **Tour benchmark row (§1.4)** — quiet last row above the CTA, `TOUR` micro-label, static copy.

Cards 2–3 (compact): **no** cost/half-gap lines — one headline insight per diagnosis, not per card.

### 3.2 The ONE headline insight per diagnosis (decision table — pick, don't stack)

| Diagnosis class | The single line that changes belief | Source |
|---|---|---|
| Curve miss (slice/hook/fade/draw), distance normal-ish | **Cost line, direction form** — "not distance; the fairway" (27 m / 41 %-of-carry / 22°) | §1.1 |
| **Way short** (any club) | Geometry-can't-lose-that line — "delivery geometry maxes out at ~5 % of carry; a big loss is strike or speed" (existing v2 contact card, now with the cost line's small carry delta as supporting evidence) | findings #1 + `bandLossPct` |
| Ballooned / high+short | Spin-loft story with band edges — "38° vs the healthy 25–34°" (+ rpm texture line) | §1.3 |
| Low + running hook | Cost line, gain-flavoured — "it GAINS 4 m and loses 49 to the left" | §1.1 guard-rail |
| Pure/straight (the wink) | Unchanged v2 wink; **no cost line** (nothing to cost) | v2 |

`S-MISS` and divot-empty honesty lines unchanged (v2 §2).

### 3.3 Number styling (SYS-conformant)

All inserted values: **mono, tabular-nums**. Metre/percent/degree *outcome* values (27 m, 41 %, 22°) = `--accent` ember — they are live engine output, the lane ember already owns on this page. Delivery-parameter values inside the same sentences keep their param token colours exactly as the readout strip does (face `--face`, path `--path`, attack `--attack`, loft `--loft`). Taught terms (`face-to-path`, `spin loft`) stay violet tap-to-define per v1 §6.3. No new tokens, no gold (gold = XP, wrong surface).

### 3.4 A11y

Cost + half-gap lines are real text in the card (SR-readable in DOM order, no aria-hidden numerals). Carry slider: `aria-valuetext` "145 metres carry"; on refine, the ONE polite live region announces the refreshed headline **including the personalized cost** ("Refined by your carry. This pattern turns your 145 metres into 141, 27 metres right of your line."). Reduced motion: numbers swap without count-up animation.

### 3.5 Monetization verdict (consistent with `docs/monetization-strategy.md`)

**Diagnose stays free — including every v3 value line.** The strategy doc makes Diagnose acquisition-lever #1 ("the ASO hook, playable") and the retention answer to Risk #1; the cost line IS the shareable aha, and gating text insight would strangle the funnel the feature exists to feed. **What becomes Pro is the follow-through, at moment-of-intent** (the doc's highest-converting trigger, §2 "feature-gate"): a new CTA under the cost line — **"See both flights side by side →"** — loads the actual-vs-neutral pair into Ball Flight as a **before/after ghost comparison**, which is *already on the strategy doc's Pro feature-gate list* (before/after trace comparison / ghosts). Free: the numbers and the one-line forecast. Pro: watching the two flights fly. The existing single-delivery `Try this delivery →` handoff stays free (v2 contract). No timed trial, no new SKUs — nothing here contradicts the locked 99/399/999 ladder.

---

## 4. Engine/API deltas (`diagnose-engine-v2.js` — additive, pure)

```js
// ── v3 VALUES layer (pure; ≤2 extra solveFlight per rendered result) ──
export const NEUTRAL_DELIVERY = {                        // harness well-struck baselines (findings §1)
  '7iron':  { faceAngle:0, clubPath:0, attackAngle:-3, dynamicLoft:28 },
  'driver': { faceAngle:0, clubPath:0, attackAngle: 2, dynamicLoft:13 },
};
export function costOfPattern(rep, club)
  // solveFlight(rep) + solveFlight({...NEUTRAL_DELIVERY[club], clubSpeed: rep.clubSpeed})
  // -> { actual, neutral,                       // both raw flights (yd internally)
  //      dCarryM, dCarryPct,                    // + = neutral longer
  //      offlineM, curveM, offlinePctOfCarry, missAngleDeg }  // missAngle = atan2(offline, carry)
  // RENDER CONTRACT: club==='driver' -> UI may consume ONLY dCarryPct, offlinePctOfCarry,
  // missAngleDeg (the yardage ban, enforced at the data edge, not in copy review).
export function halfGapSolve(rep)                        // {...rep, faceAngle: rep.clubPath + (rep.faceAngle-rep.clubPath)/2} → solveFlight
export function clubSpeedForCarryM(metres)               // 7-iron ONLY: monotone bisection on the NEUTRAL solve, 40–130 mph, ±0.1 mph
export function spinLoftEdges(clubMeta)                  // the 0.44/0.77 cuts spinLoftBand() already computes, exposed for copy
```

Dev asserts (`?dev=1`, extend the existing block): scenario (a) → `costOfPattern` offlineM ≈ 27.1 ± 0.3, dCarryM ≈ 3.8 ± 0.3, halfGap offline ≈ 5.4 ± 0.3; driver (c) → missAngleDeg ≈ 22.1 ± 0.3, offlinePctOfCarry ≈ 41 ± 1, and **assert no absolute-metre field is consumed for driver** (render-layer unit test); `clubSpeedForCarryM(145) ≈ 83.6 ± 0.3`; `dCarryPct ≤ meta.bands.distance.worstGeometryLossPct` for every acceptance scenario.

`sa.stat.diagnose` gains `offlineM`/`missAngleDeg` (whichever the club may store) so the home card can echo the value line. Handoff §2.4 unchanged; the new Pro CTA writes the same seed twice (actual + neutral) under `sa.handoff.compare` — schema `{v:1, a:params, b:params, label}` — consumed by the Ball Flight ghost feature behind the existing entitlement.

---

## 5. Build order (each step leaves a working page)

1. Engine layer: `costOfPattern`/`halfGapSolve`/`clubSpeedForCarryM`/`spinLoftEdges` + dev asserts (Appendix B numbers).
2. Card 1: cost line + half-gap line + spin-loft edges + tour benchmark row; decision table §3.2 for the headline pick.
3. SHARPEN carry slider (7-iron): detents, Skip, personalization re-render + live-region grammar.
4. Driver relative rendering + the render-contract unit test (ban enforcement).
5. Pro CTA "See both flights side by side" → `sa.handoff.compare` (gate wiring only; the Ball Flight ghost view is the other workflow's deliverable).
6. A11y + reduced-motion pass.

**The ONE thing is still the reveal (v1 §10).** v3's promise on top of it: the reveal now ends in a sentence with *your* numbers in it — what the pattern costs, and what half a fix buys back. Protect the reveal; never delay it for a value computation (both solves are sub-millisecond).

---

## Appendix B — node run log (the numbers' provenance)

Scripts: `diagnose-values.mjs` + follow-up probe (session scratchpad; import `diagnose-engine-v2.js` + `impact-flight.js`, `JSON.parse` the shipped `diagnose-map-v2.json`, call `lookup/consolidateStories/reweightSpeed/reweightCarry` + raw `solveFlight`). yd→m ×0.9144. Key rows:

| # | run | result |
|---|---|---|
| B1 | 7i (a) `Slice‖Straight‖High‖Noticeable loss` + speed=mid → top story | slightly open / strongly out-to-in **71.83 %**; rep face +2.9 path −6.6 attack −5.0 loft 33.0 cs 83.9 |
| B2 | solveFlight(rep B1) | carry **141.9 m**, curve **26.1 m**, offline **27.1 m**, spinLoft 38.0°, backspin **7,506 rpm**, apex 30.4 m, landing 57.9° |
| B3 | solveFlight(neutral 7i @ 83.9 mph) | carry **145.7 m**, offline 0, backspin **6,255 rpm**, apex 28.0 m, landing 50.2° → ΔdCarry **3.8 m = 2.6 %** |
| B4 | half-gap solve (face → −1.8°) | curve 26.1 → **13.1 m**, offline 27.1 → **5.4 m**, carry unchanged 141.9 m |
| B5 | driver (c) `Slice‖Right‖Normal‖Full` top rep (37.6 %) face +6.5/path −6.5/attack −0.1/loft 13.1/cs 98.7 | offline **75.1 m of 185.3 m carry = 40.5 % (quoted ≈41 %)**, miss angle **22.1°**; neutral Δcarry **1.1 m = 0.6 %**; half-gap → offline 27.0 m = **14.6 % (≈15 %)**, **8.3°** |
| B6 | driver gap ladder (attack 0, loft 13, cs 98.7) | gap 3° → 9 % of carry / 5.3° · 6° → 19 % / 10.6° · 9° → 28 % / 15.7° · 13° → 41 % / 22.1° |
| B7 | 7i (f) snap-hook rep | offline **−49.0 m**, Δcarry **−3.9 m (pattern GAINS 2.7 %)**; half-gap → −16.1 m |
| B8 | driver (d) ballooned+fast | Δcarry 4.8 m = **2.8 %**; backspin 4,551 vs neutral 2,568 rpm; spinLoft 20.0° |
| B9 | spin-loft band edges (from `spinLoftBand` cuts on shipped `meta.grid`) | 7-iron range 14–40° → healthy **25.4–34.0°**; driver range 2–24° → healthy **11.7–18.9°** |
| B10 | map-only potential (rejected §1.5) | matched cluster carryM p50 **143.7 m** (hist 28.6/38.1/33.3) vs neutral bucket p50 **149.2 m** (25.8/36.6/37.6) — speed-confounded |
| B11 | carry slider range (7i, all 1,459 cluster stats) | p10 min **91 m**, p90 max **198.1 m** → slider 90–200 m |
| B12 | carry inversion (neutral 7i curve, bisection) | 106 m→65.9 mph · 120→72.2 · 130→76.8 · **145→83.6** · 160→90.6 · 185→103.8 |
| B13 | personalized cost at typed carry (rep B1 rescaled) | 120 m: actual 116.7, offline 18.5 · **145 m: actual 141.2, offline 26.8** · 160 m: actual 156.0, offline 32.7 |
| B14 | carry reweight re-rank power (bucket a) | top story 110 m → **72.09 %** … 185 m → **70.95 %** (≈1 pt: yardstick, not diagnosis) |
| B15 | grid |face−path| quantiles (7i, gridCount×speedHist[mid]-weighted) | p25/p50/p75/p90 = **3/5/9.4/13°** — uniform-grid artifact, banned as a "norm" (§1.4) |
| B16 | shipped meta cross-checks | 7i speed edges 75/95 · driver 90/105 · `bandLossPct` worst band 7i 2.3–4.9 %, driver 2.5–4.9 % · `worstGeometryLossPct` 4.9 |

— Fable 5, design director
