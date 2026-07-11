# Academy Native v2 — «Backspin» as an INSTRUMENT lesson (Fable spec, 2026-07-11)

**Goal:** the lesson TEMPLATE that makes Academy feel native and instrument-like — built and judged first as ONE mock: `academy-lesson-v2-mock.html` (Backspin). Rollout to all 21 lessons is a separate later plan.
**THE CONGRUENCE PRINCIPLE (owner's målbilde, 2026-07-11 — governs every call in this spec):** native app-feel × advanced learning, held together. Interactivity may be DENSE — density is welcome — but every interactive element must be professionally crafted: it obeys the system laws (states, haptics, hierarchy, purpose, a11y), teaches something real, and reads as instrument-grade. The test for any element: *would this survive in Apple Fitness?* If an interaction can't be crafted to that bar, cut it rather than ship it toy-like. "Advanced" is expressed through what the interaction REVEALS (real physics, real sensitivity, real consequences) — never through visual complexity.
**Inputs:** Claude Design mock (`Downloads/Backspin V1 Fitness (standalone).html` + the evolved screenshot state), Copilot's critique (accepted/rejected per the Fable verdict below), Sivert's decisions (native feel; lie effects = SOURCED estimates, honestly framed), `docs/claude-design-brief/lesson-backspin.json` (all content — facts unchangeable), `docs/lie-effects-sources.md` (research in progress — the ONLY permitted source of lie numbers).
**Verdict deltas vs Copilot's advice (binding):** live physics YES (but real engine, not a schematic); myth-bust animation YES (StrikeArc voice); rank ladder YES (name the existing system); fixed influence-ranking NO (honest dynamic ranking — the reorder IS the lesson); wet/rough physics from thin air NO (engine has no lie model — sourced-estimate layer instead).

## 0. Non-negotiables
Engine `impact-flight.js` byte-identical, read-only — every simulator number on screen is a real `solveFlight` output. Content facts/terms from `lesson-backspin.json` unchanged. Quiz mastery 4/5. P3 tokens + type trio (`sa-p3.css` read-only). **Meters, not yards** (the evolved mock's "223 yd" violates the app law). Ember ≤3 at rest per surface. 10px type floor. `academy.html` untouched this run. Portrait 430×932 + 375×812.

## 1. Flow (paced surfaces — snap/stepper, NOT a scrolling article)
```
S0 MISSION → S1 SPIN LAB (the instrument) → S2 INFLUENCE → S3 MYTHS → S4 QUIZ → S5 MASTERY
```
Sticky progress dots + Next; each surface ≤50 visible words (depth lives in bottom sheets); chevron back top-left; no browser-scroll feel (surface snap; reduced-motion = plain paging).

### S0 · MISSION
Title (Space Grotesk) + one mission line: *"Build 7,000+ rpm — then kill the spin."* + XP/rank chip. One CTA.

### S1 · SPIN LAB — the hero surface (evolved-mock structure adopted)
- **Live flight strip** (canvas ≈430×170): REAL `solveFlight` trace redrawn per input (ember trace = the live ball), apex marker + value, landing tick. Ghost of previous settings (violet, one) so change is visible.
- **RPM hero**: mono 44px ember + band chip (*Optimal iron spin*, `--good`) + spin-loft chip (mono ink).
- **Readout row (all meters/mph, mono)**: CARRY · HEIGHT (apex) · **STOP POWER** — kept ONLY with an honest derivation: define as a 0–100 index computed from engine outputs (land angle + backspin at landing proxy: `stop = clamp(f(landAngle, rpm))`, formula documented in-page sheet "How we compute this"); if a defensible formula can't be built from engine outputs alone, SHOW LAND ANGLE instead. (Copilot-discussion item #1.)
- **Sliders**: Dynamic loft / Attack angle / Ball speed — param hues, 44px thumbs, whole-unit haptic detents (`sa-haptics.tick`), keyboard steppable.
- **Mission check**: live; on reaching goal → gold flash + XP increment + `notify success` (once).
- **"Why it changed"** (from evolved mock — keep): one-line cause after each drag settle (*"spin loft grew: bigger gap = more glancing strike = more spin"*), `--muted`, live-region announced.

### S2 · INFLUENCE — honest sensitivity ranking
Bars ranked by **live engine sensitivity**: at current state, ±1 unit per param → Δrpm via solveFlight; bar length = |Δ|, value label mono (*"+310 rpm per °"*). Dragging S1 sliders re-ranks LIVE with an animated reorder; when order flips, stamp the callout (*"Wet flips the order — friction takes #1"*-style) — the reorder is the pedagogy. NO fixed ranking.
- **Lie toggle (Clean / Wet / Flyer)** lives here (and echoes on S1 as a badge): switches the **sourced-estimate layer** — a violet register card, never ember, always `≈`-prefixed, e.g. *"≈ Flyer lie: spin typically drops 25–50% (USGA groove study)"* + range band overlaid on the RPM hero (*"≈ 3,600–5,400 rpm in this lie"*). Microcopy law: **"Real-world estimate — not the simulator"** always visible with the source name. Numbers exclusively from `docs/lie-effects-sources.md`. Engine values never change with the toggle.

### S3 · MYTHS
Statement plate → TRUE/FALSE (radiogroup). On answer: **verdict stamp** (display voice, no confetti) + **engine chain-beat**: three linked chips light in sequence — e.g. *Attack ↓ → Spin loft ↑ → Backspin ↑* — each showing real before→after numbers from two solveFlight runs. Wrong answer teaches the misconception (from JSON) in the same beat. 2–3 myths.

### S4 · QUIZ — one question per surface, paced; aria-disabled pattern kept; distractor→misconception mapping from JSON; wrong answers teach inline.

### S5 · MASTERY — 4/5 gate; rank moment: XP counts up (gold), rank ladder shown with position: **ROOKIE → APPRENTICE → TECHNICIAN → FLIGHT ENGINEER → STRIKE SCIENTIST** (final naming may be tuned at build; voice law: playful-but-precise, English). `notify success`. Return to tree.

## 2. Native grammar
Surface snap-paging (scroll-snap or GSAP-paged); bottom sheets for taught terms + misconceptions + "how we compute this" (focus-trapped, Esc, swipe-down + button); sticky Next ≥44px; sa-haptics wiring points: slider detents, lie-toggle selectionChanged, myth verdict light, mastery notify; no visible scrollbars; safe-areas respected.

## 3. A11y (lead-review before ship — hook)
One polite live region (mission/rank/re-rank/verdict; throttled). Canvas strip `aria-hidden` + mirrored values in DOM. Sliders: real inputs w/ labels + value announced on settle. Quiz/myths: radiogroups, roving tabindex. Sheets: focus trap + return. RM: no chain theater/snap — instant states, plain paging, trace renders complete. AA contrast on the violet estimate register over its plate.

## 4. Build & verify contract
ONE Opus builder → `academy-lesson-v2-mock.html` (self-contained at repo root; sa-p3.css + vendored fonts + relative `impact-flight.js` import; no bundler; reuse the Claude-Design mock's layout bones where compliant). Then a11y-lead review + Sonnet falsification: 5 slider states → RPM/launch/apex/carry byte-equal solveFlight; estimate layer NEVER renders without `≈`+source+"not the simulator"; meters everywhere; keyboard walk; RM pair; 0 errors; both viewports. Then Fable look-pass → deploy → Sivert.

## 5. CONSENSUS AMENDMENTS (Fable × Copilot discussion, 2026-07-11 — BINDING)
1. **Stop Power is DEAD as a 0–100 index** (Copilot conceded: unvalidated index = false precision). The readout row shows **LAND ANGLE** (mono, engine-exact). Optionally a qualitative **hold-tendency band word** (e.g. *Holds fast / Holds / Releases*) derived from documented land-angle+spin thresholds, explained in the "how we compute this" sheet. §S1's readout row is amended accordingly.
2. **Two-register stamps on Influence:** when only engine data ranks → stamp **"Simulator ranking"**; when the lie layer is active → stamp **"Real-world estimate active"**. The layers NEVER blend; Wet/Flyer never pretends to come from solveFlight.
3. **Lift-field flourish (optional, S1):** 3–5 thin violet/blue streamlines behind the flight curve whose arc/tension is driven DIRECTLY by engine spin + land angle; they move ONLY during drag/re-solve and freeze static at rest. Removal law: if a line does not follow engine output, it is deleted. (Passes the congruence test on these terms.)
4. **The estimate register is named "REAL-WORLD LAYER"** (not "estimate" in UI): its own typographic dignity — violet, `≈`, a source chip (tappable → source sheet), framed as the expert layer explaining what the simulator deliberately does not model. Never positioned as competing numbers beside ember engine values.

## 6. Remaining input
**`docs/lie-effects-sources.md`** (research in progress): supplies the ONLY lie numbers + in-app copy lines for the Real-world layer.

## 7. MODULE ANATOMY CONTRACT — frozen by Fable×Copilot consensus (2026-07-11)
**Owner's doctrine:** this is a FRAME, not a straitjacket. The template is the default for all 24 lessons so boxes/haptics/shadows/pacing read as ONE professional app — but a lesson MAY deviate when the point being taught demands a different form. Deviation rules: (a) the deep laws are never breakable (tokens, type trio, haptics table, a11y contracts, honesty doctrine, ember law); (b) a deviation must be motivated by the learning point (congruence principle), never by variety; (c) each deviation is declared in one line in that lesson's content spec.

The ten components (all consensus-accepted):
1. **Surface sequence:** S0 Mission → S1 Lab → S2 Influence → S3 Myths → S4 Quiz → S5 Mastery; snap-paging, sticky progress dots + Next, ≤50 visible words per surface.
   **AMENDMENTS (owner, 2026-07-11): (a) THE FIT LAW** — every surface renders COMPLETE inside one viewport (430×932 AND 375×812); nothing essential under the fold, no internal scroll. The S1 instrument shows flight strip + hero + sliders simultaneously — compress until it fits. **(b) PAGED MODULE NAV** — within-lesson navigation is paged via a tappable module stepper in the sticky bottom bar (current step named, tap-to-jump; backward always free, forward respects the same gates as Next). The long vertical scroll inside a lesson is dead. The nav live-HUD stays as a safety net for undersized viewports. **(c) ATMOSPHERE IMAGERY (extends §7.10)** — the Mission surface (S0) MAY carry a P3-graded, heavily dimmed photographic backdrop (Apple Fitness grammar: photo as mood, never as data); scrim ≥ .62 so type contrast holds; one shared style-kit prompt across all 24 lessons. Hero values and physics diagrams remain photo-free.
2. **Box spec:** ONE card spec — radius 16, plate-solid, hairline `--line`; ONE elevation shadow (`0 16px 44px -18px rgba(0,0,0,.9)`) reserved for floating elements (stamps/sheets). **AMENDED (owner-approved 2026-07-11, «Veldig bra!»):** plates are no longer flat — DEPTH & LIGHT is law: top-lit plate gradients with baked-in 1px edge-light, ambient skylight bg, ember/gold value bloom, film grain. Codified in `sa-p3.css` as opt-in `body.sa-depth` (+ `.sa-bloom-ember`/`.sa-bloom-gold`); every Academy surface adopts it. Raw color tokens unchanged (SVG-fill/shadow consumers stay safe).
3. **Hero value:** mono 44px ember + band chip; ≤3 ember per surface. **Law sharpened (Copilot):** ember always means *primary engine truth* — never merely "important".
4. **Live-viz slot:** one canvas strip, ALWAYS engine-driven, DOM-mirrored values — the component that forces every lesson to SHOW physics, not describe it.
5. **Readout row:** exactly three cells (four = dashboard, two = no cause→effect), mono ink values, 10px muted caps labels.
6. **Slider spec:** 44px thumb, param-hue fill, haptic detent per whole unit — the product's most important haptic contract.
7. **Stamp spec:** verdict/callout = display voice, typed-on 240ms, MAX ONE stamp per surface (two stamps compete; one teaches).
8. **Sheet spec:** bottom sheets for all depth; focus trap + Esc + swipe; never more than one level deep.
9. **Haptics table (fixed):** slider detent = tick · band change = light · verdict = light · mastery = success notify · navigation = NEVER.
10. **Image slot (Nano Banana Pro):** generated imagery lives in the **Real-world layer only — never the hero (the hero belongs to the engine), never physics diagrams**. Doctrine = the PeakVisor model: *the image is reality; the data explains why reality looks that way* (e.g. Backspin: a close-up of a ball biting the green beside the engine's land-angle/spin values). One shared style-kit prompt so all 24 lessons' imagery matches, P3-graded. Reference models for the build (pull via Mobbin at build time): PeakVisor (primary), Apple Weather, Sky Guide.

**Killed in consensus:** star=favorites (a 24-lesson curriculum needs progression, not a library) — the star shape may only survive as a *Mastered* marker.
**Next phase:** content per module in groups, evaluated AGAINST this contract.

— Fable 5, design director
