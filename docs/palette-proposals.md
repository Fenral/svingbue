# StrikeArc — Palette Verdict & Proposals

**Pass:** Art-direction verdict on the locked "Alt 2 — Electric Night" + three complete counter-proposals.
**Date:** 2026-07-09 · **Author:** Fable 5 (art director pass, spec only — no code changed)
**Method:** WCAG 2.x relative-luminance contrast, computed (not estimated). Three test grounds per token:
`--bg`, `--surface`, and the photo plate = `rgba(4,8,14,.86)` composited over the range-13 midtone.
Range-13 midtone honestly estimated at **#1A2430** (wet blue-violet turf/apron); composite plate = **#070C13**.
Stress caveat: over the violet horizon glow (~#3A3454) the plate composites to **#0C0E18** — all stated ratios drop ~4–6% there and still pass.

---

## A. VERDICT — does Electric Night deliver "not sad"?

**Short answer: yes, it holds. Lock stands.** Against the old set (cyan #22E3D6 on slate #0A0E12), Electric Night is a genuine mood shift: near-black bg makes the neons physically brighter, ink is lifted to #F2F7FF, and the violet secondary is the smartest single move in the set — it rhymes with the range-13 horizon glow, so the UI and the scene read as one world instead of a panel floating on a photo. Accessibility is not the problem: **every token passes AA text with headroom (worst case: secondary #8B7BFF at 5.78:1 on surface)**. The weaknesses are hierarchy weaknesses, not contrast weaknesses:

1. **The magenta/pink corridor is overcrowded — this is the real bug.**
   attack #FF6BE0 vs celebrate #FF5CA8: luminance separation **1.15:1**, same hue lane. The colour law says celebrate = XP/badges ONLY, but a user who has learned "pink glow = reward" will misread every attack-angle trace as a celebration (and vice versa). celebrate vs bad #FF7B8A is also 1.15:1 in the neighbouring hue. Four warm-pink tokens (face, bad, celebrate, attack) is one too many.
2. **loft #A78BFF vs secondary #8B7BFF are near-identical (1.22:1, same hue).** The loft parameter will read as UI chrome, not as data. A param colour must never be confusable with a brand/chrome colour.
3. **path #5CB8FF camouflages on the locked photo.** Against the floodlight bloom and wet reflections (~#9FB6D8) the ratio is **1.04:1** — a path trace crossing a floodlight pool disappears. It passes on the dark plate; it fails on the raw scene, which is exactly where flight traces live.
4. **Mint-on-black is genre-adjacent, half-mitigated.** Mint #46F5C4 alone is the launch-monitor/AI-dashboard cliché. What rescues it is the *chord* — mint + violet + magenta together is distinctive; mint alone on marketing shots is not. Marketing must always show the trio, never mint solo.
5. **Magenta celebrate is doing "enough" hue-wise but not treatment-wise.** A flat #FF5CA8 pill reads as a tag, not a firework. It needs a treatment rule (gradient + spark), not a different colour.

Academy check: academy.html still runs the old cyan/amber set. Porting Electric Night drops the amber warmth that made XP feel like gold. warn #FFD056 must be allowed as the XP-numeral/coin tint in Academy (it is a status colour, not celebrate — no law conflict), otherwise the Academy drifts cold-vaporwave.

**Conclusion: keep the lock, patch the param corridor. That is P1.**

---

## B. PROPOSALS

Shared laws for all three: accent = live ball + its data ONLY · celebrate = XP/badges ONLY · text over photos only on dark plates · AA 4.5:1 text, 3:1 non-text.
**New scene-legibility rule (all proposals): any data stroke drawn over the photo gets a 2px `rgba(4,8,14,.55)` halo + white-hot core on the live comet.** This solves path-over-floodlight without hue surgery.

### P1 — Electric Night · Refined  *(keep the identity, fix the corridor)*

Smallest change that maximizes the lock: identity tokens untouched; only the four param colours and `--bad` move. Attack leaves magenta entirely (celebrate gets exclusive ownership of pink), loft lightens away from secondary, path brightens into ice, face/bad separate from each other and from celebrate. Emotionally identical to the lock — night-tournament neon — but the data hierarchy stops fighting the reward system, and Academy badges become the only pink thing in the product, which is exactly what gamification wants.

```
--bg:#05060A;  --surface:#0C1018;  --plate:rgba(4,8,14,.86);
--ink:#F2F7FF;  --muted:#93A5C4;
--accent:#46F5C4;    /* mint — live ball only */
--secondary:#8B7BFF; /* violet — chrome/labels, rhymes with horizon */
--celebrate:#FF5CA8; /* magenta — XP/badges only; render as gradient #FF5CA8→#8B7BFF + spark */
--good:#5CFF9D;  --warn:#FFD056;  --bad:#FF8D9B;      /* bad lightened from #FF7B8A */
--face:#FF5C6B;   /* was #FF4D5E — lifted for separation from bad + better AA */
--path:#6FC6FF;   /* was #5CB8FF — icier, + mandatory halo over photo */
--attack:#FFA14D; /* was #FF6BE0 — leaves magenta lane; orange is the only free hue */
--loft:#C7A9FF;   /* was #A78BFF — lavender, 1.65:1 from secondary, reads as data */
scene: linear #0A1420 → #05060A, glow radial rgba(139,123,255,.18) at horizon (unchanged, matches range-13)
```

**Computed worst cases:** secondary 6.15 (bg) / **5.78 (surface)** / 5.95 (plate #070C13). Next-worst face 6.34 (surface). All other tokens ≥6.6. Non-text 3:1: everything clears at ≥5.6.
**Flags:** attack #FFA14D vs warn #FFD056 are corridor-neighbours (1.38:1) — acceptable because attack appears only as labelled param chip/trace, never as a bare status dot. Existing launch-gold #F4D000 (impact-viz) may stay; keep it off status pills.
**Re-validate if adopted:** param chip dots at small sizes (attack vs warn side by side), academy badge rail with new bad/face, and one screenshot of path-halo over the brightest floodlight pool.

### P2 — Voltage  *(meaningfully different: volt tracer on ice-violet night)*

Replace mint with volt yellow-green **#CDFF4D** — the hue human night vision is most sensitive to, which is a true instrument argument, not just styling: the ball trace becomes the single brightest, most retina-grabbing object on the wet-violet scene (13.5:1 against the photo midtone vs mint's 11.3:1). Violet secondary stays (the scene demands it), celebrate stays magenta, and the whole warm corridor is rebuilt around it. Emotionally this is motorsport/Nike-Volt adrenaline rather than neon-lounge; nobody in golf tech owns volt, so App-Store differentiation is maximal — at the cost of abandoning the mint equity just after locking it.

```
--bg:#060810;  --surface:#0D1320;  --plate:rgba(4,8,14,.86);
--ink:#F4F8FF;  --muted:#9DAECB;
--accent:#CDFF4D;    /* volt — live ball only */
--secondary:#8B7BFF; /* violet — unchanged from lock */
--celebrate:#FF6BD5; /* magenta — XP/badges only */
--good:#45E0A6;  --warn:#FFC94D;  --bad:#FF7B8A;
--face:#FF5C6B;  --path:#6FC6FF;  --attack:#FF8A3D;  --loft:#B48CFF;
scene: linear #0A1224 → #060810, glow radial rgba(139,123,255,.20); volt appears in-scene ONLY as the tracer
```

**Computed worst cases:** secondary 6.07 (bg) / **5.64 (surface)** / 5.95 (plate). accent 15.92 worst — enormous headroom. All others ≥6.2.
**Flags:** good #45E0A6 vs accent volt: 1.44:1 luminance but clearly separated hues (green vs yellow-green) — enforce "good always ships with a checkmark glyph". warn vs volt 1.31:1 — warn must never appear inside the flight canvas.
**Re-validate if adopted:** volt against the *grass* mid-field (green-on-yellow-green in daylight-range future scenes), all Academy XP surfaces (volt is not the XP colour — warn-gold is), and colour-blind sim (deutan collapses volt/amber).

### P3 — Ultraviolet Ember  *(the taste bet: one hot signal in a cold world)*

Where I'd take a million-dollar product: make the entire UI a cold ultraviolet instrument — violet-black glass, violet-grey text, lavender chrome — and let the ball be the **only hot object in the universe**: an ember-orange comet (#FF8A4D) over the violet night is the closest thing to a true complementary pair this scene allows, and it photographs like infrared thermography: "we see the heat of your strike." Old brand-mint survives demoted to a param (attack), magenta stays celebrate. This is the most premium, most App-Store-poster-able direction — and the riskiest: orange-on-dark flirts with TrackMan's brand lane (mitigated by the ultraviolet world + magenta celebrations, which TrackMan would never do).

```
--bg:#07060C;  --surface:#110D1C;  --plate:rgba(8,5,14,.86);
--ink:#F5F2FF;  --muted:#A79FC7;
--accent:#FF8A4D;    /* ember — live ball only; comet ramps #FFD056→#FF8A4D→#FF5CE1 tail */
--secondary:#9D8BFF; /* lifted violet — chrome on the violet-black world */
--celebrate:#FF5CE1; /* electric magenta — XP/badges only */
--good:#58E6A8;  --warn:#FFD056;  --bad:#FF7B8A;
--face:#FF5C6B;  --path:#6FC6FF;  --attack:#4DE8D2;  --loft:#B9A0FF;
scene: linear #140E24 → #07060C, glow radial rgba(157,139,255,.22) — violet-shifted grade over range-13 (photo needs a -10% desat, +violet curve pass so the ember owns all warmth)
```

**Computed worst cases:** **face 6.37 (surface)**, secondary 6.89 (surface), accent 8.19 (surface); plate composite #0B0913, everything ≥6.4 on it. All tokens pass AA text on all three grounds.
**Flags:** accent ember vs face-red (1.29:1, warm neighbours) — separable because the comet always carries the white-hot core + gradient while face is a flat chip dot, but this is the pair to watch. attack-mint vs good-green (1.04:1 luminance, teal vs spring-green hue) — enforce labels on param chips (already law). warn-gold sits close to the comet's hot tip — warn never enters the flight canvas.
**Re-validate if adopted:** full photo re-grade of range-13 (the current grade has warm floodlight cores that would compete with ember), every Academy screen (violet-on-violet depth needs the plate-vs-surface step checked optically), app icon, and TrackMan-adjacency check on a real App Store shelf screenshot.

---

## C. RECOMMENDATION

1. **P1 — Electric Night Refined.** The lock was the right call; its one real defect is the magenta corridor, and P1 fixes it for the price of four param hex values. Ship this.
2. **P3 — Ultraviolet Ember.** The strongest *brand* of the three and the best marketing poster; hold it as the 2.0/App-Store-refresh card. Not worth unlocking a fresh decision for today.
3. **P2 — Voltage.** Great physiology story, maximal differentiation, but it discards the mint equity days after locking it and volt will fight future daylight-grass scenes.

**Migration cost from locked Electric Night:** P1 is a five-token diff (face/path/attack/loft/bad) plus two treatment rules (stroke halo, celebrate gradient) — under an hour including re-screenshotting; P2/P3 would reopen scene grading, Academy theming and marketing and are full re-validation passes.
