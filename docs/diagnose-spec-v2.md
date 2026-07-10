# Diagnose My Shot — v2 «The Coach Interview» (delta-spec)

**Status:** design locked (Fable 5, 2026-07-10). Base document: `docs/diagnose-spec.md` (v1) — everything not amended here still applies verbatim (frame, scene, sketch, reveal beat, results grammar, honesty doctrine, a11y master list, monetization §8, edge cases §9).
**Numerical ground truth:** `docs/diagnose-harness-v2-findings.md` + `diagnose-map-v2.json` (2.07 MB; clubs `7iron`+`driver`; adversarially verified, 11/11 owner scenarios pass). Every number/band/copy-anchor comes from `map.clubs[club].meta.bands` — never free-typed.
**Files this run:** NEW `diagnose-engine-v2.js` (API exactly per findings §6) + REBUILD `diagnose-mock.html` in place (same URL — the owner revisits the same link). `diagnose-map.json`/v1 engine untouched on disk. Engine `impact-flight.js` byte-identical read-only. `sa-p3.css` READ-ONLY (another workflow owns it).

**Why v2 (owner's direction, 2026-07-10):** the flow becomes a coach's anamnesis — club, speed, shape, pattern, height, distance, story — while keeping v1's ONE thing (the ember reveal over the violet sketch) untouched and protected.

---

## 1. The interview — new state machine

```
S0 CLUB → S1 SPEED → S2 SHAPE(+severity) → S3 HEIGHT → S4 DISTANCE
   [→ S4b CONTACT — only when S4 = "Way short"]
→ S5 DIVOT → REVEAL BEAT → RESULTS ─→ SHARPEN-ROW (post-reveal refiners)
```

6–7 taps, auto-advance, answered questions collapse to summary chips (v1 grammar). Every selection still redraws the violet sketch live. Reveal still starts ≤500 ms after the last tap.

### S0 — CLUB (new; replaces v1's honest 7-IRON pill)
`WHICH CLUB?` → radiogroup chips `7-IRON` · `DRIVER` (44px, mini glyphs). Persist last choice (`localStorage sa.diagnose.club`), preselect on return visits (still requires the confirming tap — never skip the question silently). Club selects `map.clubs[club]`; ALL band edges, labels and anchor copy come from that club's `meta.bands`.
**Driver honesty strip (non-negotiable):** when club=DRIVER, a quiet 11px `--muted` line under the chips, sourced from `meta.bands.speed.note`: the model reads the *shape and cause* of the miss, not exact driver carry — and **no absolute yardage is ever printed for driver anywhere in the flow** (`meta.bands.speed.absoluteCarryTrusted === false` governs; 7-iron keeps its honest carry anchors).

### S1 — SPEED (new; the owner's question, with «vet ikke»)
`HOW FAST DO YOU SWING?` → chips `Gentle` · `Mid` · `Fast` · `Not sure`, each with its anchor copy line from `meta.bands.speed.anchorCopy` (12px `--muted`, e.g. 7-iron mid: "The middle of the club-golfer range — around 145 m carry. Where most amateurs sit (75–95 mph)").
- **Purpose (honest):** speed's 1.573 bits are *orthogonal* — they pin the delivery's magnitude, not the fault (findings §4). We ask it EARLY anyway for the reveal's sake: the reconstruction must fly like *their* ball. `Not sure` = no filter (marginal), reveal uses the unconditioned top representative.
- Applying it: `reweightSpeed(clusters, band)` before consolidation, so the reveal's representative (and the Try-this-delivery numbers) sit in the user's own speed band.

### S2 — SHAPE = v1's S1 verbatim (9-flight picker + severity follow-on). Unchanged.

### S3 — HEIGHT = v1's S2, but labels/edges from `meta.bands.height` (per-club: a "High" driver flight ≠ a "High" 7-iron flight).

### S4 — DISTANCE = v1's S3 (relative to YOUR normal with this club), edges from `meta.bands.distance`.
- **S4b CONTACT (conditional — the coach's follow-up):** ONLY when answer = `Way short`, ask v1's S4 feel question inline (`Pure/Thin/Fat/Not sure`). Physics: matched-speed geometry can't lose real distance (7i worst −8.8%, driver −4.9% — findings finding #1), so way-short IS a contact/speed conversation. Otherwise contact is never asked pre-reveal (one tap saved; feel remains available as a post-reveal refiner chip).

### S5 — DIVOT (promoted from v1's post-reveal follow-up into the last pre-reveal slot)
Same question/copy as v1 §3.3 (`Deep divot · Brushed the grass · No divot · Didn't notice`). Rationale: divot is the highest-value resolver of the residual attack fog (1.292 of the 1.981-bit ceiling — findings §4). `Didn't notice` = no filter. Driver copy nuance: `No divot` is normal for driver — the chip order flips to lead with `No divot` on club=DRIVER, and "deep divot" maps identically via `divotFilter`.

---

## 2. Results — the two registers stay; the story gets the coach's voice

Everything in v1 §6 holds (reveal beat, story cards, confidence language, D-plane glyph, variants, honesty line, CTA, handoff §2.4 — handoff params now come from the speed-matched representative).

**NEW — the coach story line** (one sentence, card 1, directly under the title, 13px): generated from stored numbers only, in the findings' validated template voice:
> *«33° delivered loft minus a −5° attack = **38° spin loft** — a lot of spin loft: it climbs and bleeds speed.»*
Bands for the qualifier (a lot / healthy / low) come from per-club spin-loft context (driver "a lot" ≈ approaching grid max ~24°; 7-iron healthy ≈ high 20s–low 30s — thresholds computed from the grid in `diagnose-engine-v2.js`, not hardcoded). `spin loft` renders as a taught term (violet, tap-to-define) like v1 §6.3. This is the owner's dynamic-loft→spin-loft chain, spoken by the physics.

**NEW — three teaching moments (render when their case triggers; each is a quiet `--muted` paragraph with taught terms, never a warning banner):**
1. **Way short** (any club): the v1 contact card, now armed with `meta.bands.distance.bandLossPct`/`lossNote` — "delivery geometry alone can only cost ~5% with this club; a genuinely huge loss is strike or club speed talking."
2. **Pull-hook** result: the snap-hook truth (findings finding #2) — "your low duck-hook is an in-to-out path with a slammed-shut face — not an over-the-top move."
3. **S-MISS on low+short slice class** (findings finding #3): the miss text explains WHY the physics refuses it — "a low slice that's also way short doesn't come out of delivery geometry: low = de-lofted = hotter, longer. Low **and** short is contact or speed." S-MISS otherwise per v1 §5.5.

---

## 3. SHARPEN-ROW — post-reveal refiners (new section, under story card 1)

Header: `SHARPEN IT — TWO MORE COACH QUESTIONS` (11px eyebrow). A row of collapsed question chips; answering one re-ranks live: `REFINED BY …` eyebrow, bars animate, ember redraws from the new top rep (static under reduced-motion), one polite live-region line. At most ~2 refiners visible; all optional; every question offers a no-filter escape (`Not sure`/`Skip`).

1. **The pattern question (the owner's coach question — honest placement):** `DO YOU ALSO HIT OTHER SHOTS OFTEN?` → `Pulls` · `Pushes` · `Straight ones` · `No / not sure`. Applies `reweightSecondary`. **Hidden entirely on start-straight shapes** (≈0 bits there — findings §4). Copy under it teaches WHY it confirms: "same swing, the face arriving a touch different each time." It is a *confirmation beat* (0.024 story-bits) — it must never claim to be the decider; the re-rank it produces is real and directionally correct (out-to-in mass ↑ — validated §3).
2. **Exact carry (7-IRON only):** `KNOW YOUR CARRY?` → horizontal detent slider (5 m steps, 44px thumb, arrow-key parity) + `Skip`. Applies `reweightCarry(±10 m)`. Never shown for DRIVER (`absoluteCarryTrusted=false` — the honesty law).
3. **Contact feel** (if S4b never fired): v1's feel question; renders the contact card per v1 §6.6.

---

## 4. Engine + data contracts

`diagnose-engine-v2.js` implements EXACTLY the findings §6 API (loadMapV2, clubMap, lookup, consolidateStories, reweightSpeed/Carry/Secondary, applyDivot, reweight, needsFollowUp, solveTrace, spinLoftOf) with unit-style console asserts reproducing findings scenarios **(a), (c), (f), (g)** from the shipped JSON at load in dev (`?dev=1`) — the acceptance tests baked into the page. Conditioning pipeline + call order per findings §6. Sketch (`sketchTrace`) gains a club parameter: canonical sketch carries scale to the club (7i base 150 m, driver base 205 m — sketch = the user's memory, engine-independent per v1 §5.4; no driver numbers printed).

`sa.stat.diagnose` (v1 §2.3) gains `"club"` field. Handoff (§2.4) unchanged in shape; params = speed-matched rep.

---

## 5. A11y additions (v1 §7 still the master)

Club/speed/divot/sharpen rows: same radiogroup + roving-tabindex pattern as every other question. S4b's conditional appearance and every SHARPEN re-rank are announced via the ONE polite live region (throttled). The driver honesty strip is real text (not title/tooltip). Summary chip row now includes club + speed; chips reopen their question per v1. Reveal-beat + redraw reduced-motion rules unchanged. All new chips ≥44px, tab order = visual order, `.sa-focus` everywhere.

---

## 6. Build order (each step leaves a working page)

1. `diagnose-engine-v2.js` + dev asserts against scenarios (a)(c)(f)(g).
2. Interview flow S0–S5 (+S4b conditional) with per-club bands/copy from `meta.bands`; sketch live.
3. Reveal with speed-matched rep + coach-story line + spin-loft qualifier.
4. SHARPEN-ROW refiners + teaching moments + S-MISS upgrades.
5. A11y + reduced-motion pass; haptics per v1; polish.

**The ONE thing is still the reveal** (v1 §10). v2's added promise: the reconstruction now flies at *your* speed — which makes the "how did it know" land harder, not softer. Protect both.

— Fable 5, design director
