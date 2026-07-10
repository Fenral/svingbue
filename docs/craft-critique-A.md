# Craft Critique — Pass A (landscape instruments, P3 "Ultraviolet Ember")

**Reviewer:** Fable 5 as art director. **Date:** 2026-07-10.
**Scope:** `home-mock.html`, `impact-viz-mock.html`, `impact-outcome-mock.html` — critiqued from live screenshots at **932×430 and 812×375**, coach marks suppressed (`sa_coach_impact=1`, `sa_coach_flight_ghost=1`), states exercised: home cold-launch tracer + warm resting + returning-with-stats; viz resting + tune-dock open; outcome resting + flight overlay (during + after landing). Every px/colour below was **measured in the rendered DOM**, not read off intentions.

**Locked, not re-litigated:** the P3 palette hues, range-33 backdrop, and each screen's layout architecture (home rail, viz chip-row + scene + dashboard, outcome dual-lens + I/O rows). Everything here is craft *within* those locks.

**Verdict in one line:** the identity is real and the bones are good — what keeps this out of the million-dollar tier is **token drift between screens, ember spent like water, four different "plate" specs, sub-10px type, and five collision/clipping bugs that read as broken** on a 3-second look.

---

## How to read the punch-lists

- Every item is atomic and has an ID (`[viz-03]`). Fix = do exactly what the item says; Acceptance = what a scorer checks.
- **MUST** = blocks a 90+ score. **SHOULD** = the difference between 85 and 92. **COULD** = taste, take if cheap.
- Items marked `→ SYS-n` are instances of a cross-screen violation; fix them once in `sa-p3.css` (Section 5) and the per-screen item is just the verification step.
- File/line references are to current files; line numbers may drift a few lines after edits — the selectors/ids given are the stable handles.

---

# 1 · HOME — `home-mock.html`

## Score: 73 / 100

| Dimension | /20 | Notes |
|---|---|---|
| First impression | 16 | Cinematic, restrained, the empty middle band is genuinely luxurious. Docked a point for the tracer slicing through the promoted card, and one for the fuzzy 9px eyebrows. |
| Type hierarchy | 15 | Clean 3-tier card (eyebrow/glyph/stat), but eyebrows are below the legibility floor and the numerals have no distinct data voice (system font everywhere). |
| Craft details | 13 | Help icon off-axis; promoted-card glow reads muddy at 812; glyph strokes 1.5 vs 1.6; unit grammar differs from the instruments. |
| Consistency | 14 | Uses sa-p3 tokens faithfully (only screen that does). Eyebrow tracking .22em vs the strip-title role's .14em; radius/border spec matches. |
| Motion & states | 15 | Cold-launch choreography (stagger → wordmark → tracer → splash → count-ups) is the best moment in the app; warm-return restraint is correct; reduced-motion handled. Docked for the collision during the hero moment and no pressed spec beyond scale. |

**Post-fix target if punch-list executed faithfully: 93.**

## Punch-list

### MUST

- **[home-01] Cold-launch tracer collides with the promoted card.** The tracer path (`#saTracer`, `M480 551 Q485 -24 490 302` in the 960×540 slice-mapped `.scene__tracer`) crosses the rail band at x≈468 of 932; the 14px `#saTrail` under-glow and 3.8px core bleed through the rail card's `.86`-alpha plate and visually cut the "START HERE · BALL FLIGHT" card in half for the entire 1.5s draw and while resting post-trace. The identity moment defaces the identity CTA. Fix: clip the tracer SVG so no stroke renders below the rail's top edge (rail top = viewport bottom − 120px at both sizes), or move the launch x into the 10px gutter band — landing dot (490,302) may stay. Acceptance: zero tracer/trail pixels inside any `.sa-card` bounds at 932×430 **and** 812×375, during draw and at rest.
- **[home-02] Help "?" is 6px off the wordmark axis.** Measured icon centre-y = 32 (`.sa-help` top:10 + 44/2) vs wordmark centre-y = 26 (top:14 + 24/2). On a fixed header with exactly two elements, this reads instantly as sloppy. Fix: align optical centres (help svg centre to y=26; adjust `.sa-help` top to `max(4px, env(safe-area-inset-top) − 6px)` equivalent). Acceptance: |centreY(wordmark) − centreY(help svg)| ≤ 1px.
- **[home-03] Card eyebrows are 9px with .22em tracking** (`.sa-card__eyebrow`, measured 9px/600/+1.98px). Below the 10px floor and the wide tracking makes them shimmer — the "sci-fi prototype" voice. Fix: 10px / 600 / .14em, colour stays `--muted` — this makes them the same role as `.sa-strip__title` (11px/.14em); pick 10px here for the tighter card. Applies to the `START HERE ·`/`CONTINUE ·` prefix too. Acceptance: computed 10px, letter-spacing 1.4px, on all four eyebrows.
- **[home-04] Promoted treatment smears at small sizes.** `.is-promoted` = 2px top border @ `--accent-line` + outer glow `0 -1px 14px -6px` + **inset glow `0 2px 10px -8px #FF8A4D`** — at 812 the inset wash tints the whole perimeter and the card reads "selected", not "start here" (screenshot evidence: full amber outline impression on the CONTINUE card). Fix: keep the 2px top hairline (raise to .8 alpha so it's crisp), keep the single outer under-glow, **delete the inset shadow**. Acceptance: left/right/bottom border pixels sample as neutral `--line` grey at both sizes; top hairline crisp.
- **[home-05] Data numerals need the data voice** (`→ SYS-01`). `.sa-card__stat .v` (17px/700 system font) — "214 m", "FLUSH", "198" — should be the mono data role once SYS-01 lands; eyebrow/teach stay ui. Acceptance: stat values render in the mono face with `font-variant-numeric: tabular-nums`.

### SHOULD

- **[home-06] Glyph stroke drift.** Geometry/flight/academy glyphs stroke 1.6, outcome glyph 1.5; the outcome double-circle also fills its 26px box wider than the arc glyphs sit, so the row's icons look different weights. Fix: 1.6 everywhere; renormalise the outcome glyph to the same optical box (draw region ≈22px within the 28 viewBox like the others).
- **[home-07] XP bar micro-fit.** The 4px `.sa-aca__bar` + gold XP numeral + hex level badge = three reward accents on one resting card, and the bar's 5px gap to the caption doesn't match the card's 6px internal gap unit. Fix: gap 6px (grid), bar height 4px keep, and let the *fill* carry celebrate — cap fill gradient at 90% saturation … concretely: keep gradient, but drop the hex badge's `1` to `--muted` stroke when XP row is visible so only two reward signals show.
- **[home-08] Unit grammar** (`→ SYS-06`): home prints "214 m · 8 m R" (space before unit) — instruments print "16m L" (none). Home is the correct pattern; codify and hold the instruments to it.
- **[home-09] Colour-law paperwork for the promotion prefix** (`→ SYS-08`): `START HERE ·`/`CONTINUE ·` in ember is a label, not live data — either codify "promotion prefix" as part of the resume-stat exception in the sa-p3.css header comment, or set the prefix in `--ink`. Recommended: codify it; the first-run screen has no other heat and the pull is intentional. A scorer needs the written rule either way.

### COULD

- **[home-10] Help destination**: `?` currently deep-links to the Academy (honest placeholder). When a help sheet exists, morph it from this anchor. No visual change now.
- **[home-11] Count-up jitter**: `countUp()` sets `minWidth = len + 'ch'` + right-align; with tabular-nums this is stable, but the trailing "m" label still shifts once at the end when `textContent` swaps to the final string — set the final string's width before animating.

---

# 2 · BALL FLIGHT (VIZ) — `impact-viz-mock.html`

## Score: 63 / 100

| Dimension | /20 | Notes |
|---|---|---|
| First impression | 13 | The tracer over the night range is a genuine "wow". But the first three seconds also contain: a six-hue chip rainbow, an ember-bloomed smeared hero numeral, and (at 812) a shot that lands *behind* the dashboard. |
| Type hierarchy | 12 | 8px labels in the hero cluster; TOTAL/CARRY/OFFLINE shown twice in one viewport; hero "162" glow destroys its own edge. |
| Craft details | 12 | Stale param hexes; near-white slider track; trio tags clipped under the dock; blue-grey pills from the old identity. |
| Consistency | 12 | Its own token block contradicts sa-p3 (face/path/loft); 19 ember focus rings vs the system's ink ring; chip radius 12 / dashboard 14 / sa-p3 card 16. |
| Motion & states | 14 | Tracer draw-on, dock fade discipline (never over an animating flight), live re-solve on slider input are all right. Docked: dock exit is opacity-only, trio stack pops in with no rise, chips lack a pressed spec. |

**Post-fix target if punch-list executed faithfully: 92.**

## Punch-list

### MUST

- **[viz-01] Stale param tokens — the P3 repaint missed this screen's data hues.** Line 75 defines `--c-face:#EE4954; --c-path:#8FB4D4; --c-loft:#A66BFF; --c-launch:#F4D000` while the locked P3 set (sa-p3.css lines 60-65, and impact-outcome line 99) is `--face:#FF5C6B, --path:#6FC6FF, --loft:#B9A0FF`. Measured on the chips: FACE dot/underline rgb(238,73,84), PATH rgb(143,180,212), DYN LOFT rgb(166,107,255) — three wrong hues on the app's most-used screen, and PATH's #8FB4D4 is the dead steel-blue of the pre-P3 identity. Fix: alias `--c-face:var(--face)` etc. (`→ SYS-02`). Acceptance: computed chip dot, underline, arrow and dock-label colours equal the sa-p3 tokens exactly; `#EE4954`/`#8FB4D4`/`#A66BFF` appear nowhere.
- **[viz-02] Focus rings are ember** (`→ SYS-03`). 19 `:focus-visible{outline:2px solid var(--accent)}` rules (lines ~115–979) violate the codified double ink ring ("not ember — scarcity law", sa-p3.css §focus) and vanish over the tracer's own glow. Fix: replace all with the `.sa-focus` inset pair; the two `outline:3px solid #fff` outliers (lines 704, 875) join the same spec. Acceptance: grep finds zero `outline:2px solid var(--accent)`; keyboard-tab shows the dark+ink double ring on chips, pills, sliders, steppers.
- **[viz-03] The landing is occluded at 812×375.** The descending leg and landing dot/splash sit **behind** the bottom dashboard plates (`dashGroup` top = y303 at 375h; land point maps below it). The instrument's entire payoff — where the ball lands — is hidden at the smaller lock size. Fix: pad the scene viewBox mapping (or lift the landing y) so the landing dot sits ≥16px above the dashboard top at 375 height. Acceptance: landing dot + full splash ellipse visible at 812×375 and 932×430.
- **[viz-04] Trio tags clip under the tune dock.** With the FACE dock open, the stacked alternative-value tags render under the dock plate — the third tag ("+2.0°") is half-guillotined by the dock's top edge (screenshot at both sizes). Fix: constrain the trio stack's bottom to `dock.top − 8px` when a dock is open (the dock already repositions via `placeDock()` — give the trio the same anchor). Acceptance: all three tags fully visible while any dock is open, both viewports.
- **[viz-05] Hero numeral is smeared by its own glow.** "162" = 30px/800 **white** + `text-shadow: 0 0 28px rgba(255,138,77,.6)` — a blur radius ≈ the cap height turns the hero into a fuzzy amber blob (that's why it reads orange in screenshots while computing white). Fix: shadow ≤ `0 1px 8px rgba(255,138,77,.35)`, or drop the glow and set the numeral in `--accent` with no shadow. Rule of thumb for the whole app: glow blur ≤ 0.4× font-size. Acceptance: computed text-shadow blur ≤ 8px on the hero; edges of digits crisp at 2× zoom.
- **[viz-06] TOTAL / CARRY / OFFLINE are printed twice in one viewport.** Hero cluster top-left (162/158/16 L) *and* dashboard bottom-right (CARRY 158, TOTAL 162, ember) — same data, two placements, two colour treatments, ~500px apart. Fix (keeping the locked layout): hero cluster owns TOTAL + OFFLINE (display roles); the dashboard drops its CARRY/TOTAL cells and keeps the six technical values — which also fixes the mislabelled grouping ([viz-16]). Acceptance: each datum appears exactly once at rest.
- **[viz-07] Sub-floor type in the hero cluster.** Measured: "TOTAL" 8px/+1.92px, "CARRY" 8.2px, carry value 10px, "L" 9px. Fix: labels 10px/.14em (`--muted`), carry value 12px, side letter 10px. Nothing on glass under 10px, ever. Acceptance: no computed font-size < 10px anywhere on the screen.
- **[viz-08] Old-identity blue-grey chrome on Ghosts/Pin.** Both pills measured `color/border rgb(159,178,200)` = `--ghost #9FB2C8` — a steel grey from the teal era, used here as *control chrome* (and their neighbour, the Clear-× pill, uses `--muted` + white .3 border — two grey systems side by side). Fix: pills → `--muted` text / `--line-strong` border (match Clear-×); `--ghost` is reserved for ghost *trace strokes* only (`→ SYS-04`). Acceptance: no computed #9FB2C8 on any button/border; pill trio shares one spec.

### SHOULD

- **[viz-09] The resting chip row is a rainbow.** Six saturated 2.5px underlines + six dots along the top edge of a "cold ultraviolet world". Keep the param coding but dim resting underlines to 55% alpha and light the active chip's underline to full during editing (the dot stays full-strength as the legend). Also make the underline 2px — 2.5px renders unevenly at 1×.
- **[viz-10] CLUB SPEED chip wears ember** (dot + underline + its dock slider). Club speed is an *input*; ember is the live-ball colour. Give the speed chip `--secondary` violet. Ember inputs are how the scarcity law dies.
- **[viz-11] WIND "EST" badge + underline in gold** — `--warn` is written into sa-p3 as XP/badges-only. Move the EST badge to a `--muted` outline badge and the wind underline to `--secondary`; if gold-for-estimated is wanted app-wide, that's a law change that must be written into sa-p3.css first (`→ SYS-08`).
- **[viz-12] Dock slider track is near-white at full brightness** — the unfilled side outshines every data element on screen. Track: white .25; filled side: the param colour (already correct); thumb: `--ink`.
- **[viz-13] Dock internal spec:** steppers (−/+) border should match chip border (white .18), radius 12 to match chips; "Done" stays a pill. One bar, one border alpha.
- **[viz-14] Apex tag is the only solid-ember rectangle in the app** ("Apex 30 m", white-on-ember plate). Demote to the standard dark plate + ember numeral + ember leader tick, 11px. (If SYS-08's ember budget keeps Replay as this screen's one ember action, the solid tag must go.)
- **[viz-15] Ember Replay pill vs everything else** — under the SYS-08 budget, Replay is a legitimate choice as the screen's single ember action; then the hero offline "16 m L" (currently 15px/800 ember) drops to ink, keeping ember for TOTAL only. Choose: Replay-as-CTA (recommended) or hero-only; not both.
- **[viz-16] Dashboard grouping is wrong**: CARRY and TOTAL sit under "VERTICAL". After [viz-06] removes them, rename groups to what they are (e.g. left "DIRECTION", right "FLIGHT") — or keep HORIZONTAL/VERTICAL only if every member fits the axis. Also "LAUNCH ANGLE" here vs "LAUNCH" on outcome tiles (`→ SYS-05`).
- **[viz-17] Unit grammar drift on one screen**: dashboard "16m L" vs hero "16 m L" (`→ SYS-06`). And the instruments print ASCII hyphen minus ("-1.0°") while home composes U+2212 — mono/data role should always use −.
- **[viz-18] No shared left rail**: home button x12, hero cluster x28, chip row x50, dashboard x12, (outcome tiles x26). Set content inset = 16px at 812 (`→ SYS-07`) and hang hero + dashboard on it.
- **[viz-19] The screen has no name.** No `.sa-strip__title` exists on either instrument (only `.sa-strip__home` was ported). Cheapest compliant fix: 10px/.14em `--muted` eyebrow "BALL FLIGHT" above the hero "162" (it doubles as the missing hero label); alternative: 11px title right of the home glyph, but at 812 the first chip starts at x50 and the title won't fit. Acceptance: the screen identifies itself somewhere in the top-left quadrant.

### COULD

- **[viz-20] Dock enter/exit**: enters instantly, exits by opacity fade only. Enter: 120ms rise (4px translateY) + fade; exit: same reversed. Respect reduced-motion (already killed globally).
- **[viz-21] Value-change flash**: when a slider commits, dashboards update silently. A 200ms ember flash that settles to ink on *changed* values would make "ember = live data" literal and earned.
- **[viz-22] Chip pressed state**: chips have hover/focus but no active compression — `scale(.97)` + bg white .06, 80ms (`→ SYS-03` pressed spec).

---

# 3 · OUTCOME — `impact-outcome-mock.html`

## Score: 59 / 100

| Dimension | /20 | Notes |
|---|---|---|
| First impression | 11 | The dual-lens idea reads immediately — but the arrows are PowerPoint (9px strokes, big filled heads), every tile value is the same ember, and the BACKSPIN tile is guillotined by the right edge. Reads "engineer's demo", not instrument. |
| Type hierarchy | 12 | All nine outputs identical (19px/800/ember) = no reading order at all; lens headers and the main-cause line are good. |
| Craft details | 11 | Six arrow stroke weights (4–9px); non-token #F4D000 yellow; landing tags collide with the tile row; two identical × buttons in the overlay. |
| Consistency | 12 | Ironically has the *correct* P3 param tokens (line 99) that viz lacks — the two screens disagree with each other; lens plates invent a fourth surface spec (radius 20, border .07, solid bg); label names drift per state. |
| Motion & states | 13 | Overlay scale-in + scrim, tracer comet, post-landing I/O reveal are solid; replay works. Docked: I/O stack pops in as one block, tiles have popovers but no hover/pressed affordance, ember values never "settle". |

**Post-fix target if punch-list executed faithfully: 91.**

## Punch-list

### MUST

- **[out-01] Ember wallpaper — the accent is spent on everything.** Measured: **all** output tile values (rest and overlay) are 19px/800 `rgb(255,138,77)` — LAUNCH DIR, SPIN AXIS, CURVE, LAUNCH, APEX, LAND ANGLE, BALL SPEED, BACKSPIN, CARRY — plus the apex tag, the club-speed chip, the Play-flight pill and the main-cause dot. Ember stops meaning "live" when it means "text". Fix: tile values → `--ink` (mono role); labels stay `--muted`; ember budget for this screen = tracer + ONE hero (overlay Carry number) + the Play-flight CTA (`→ SYS-08`). Acceptance: at rest, ≤3 ember elements on screen; tile values compute as `--ink`.
- **[out-02] The physics arrows are cartoons.** Measured stroke-widths: `line_face` 9, `line_path` 9, `line_attack` 7, `line_loft` 7, `line_launchDir` 5.5, `line_launchAng` 4 — six weights, plus oversized filled triangle heads. Against the 3.8px tracer these read like a slide deck. Fix: two-step scale — inputs (face/path/attack/loft) 5px, derived launch lines 3px dashed; arrowheads ≤2.2× stroke width, same head geometry everywhere, round caps/joins. Acceptance: exactly two stroke widths + one dashed style across both lenses; heads visually identical.
- **[out-03] `--c-launch:#F4D000` is not a P3 token** (line 99) and pure signal-yellow is the loudest hue on the LAUNCH lens. Add a `--launch` param token to sa-p3.css tuned into the ultraviolet world (a desaturated gold in the #E3C468 direction — Opus tunes the final hex to ≥4.5:1 on the lens bg #0D0A18 and clear separation from `--warn`), and use it for launch arrows + tags on both screens (`→ SYS-02`). Acceptance: #F4D000 appears nowhere; launch elements reference the token.
- **[out-04] Output row guillotine.** 9 tiles × (112px + 8px) = 1080px > 932: BACKSPIN is chopped mid-tile at the viewport edge (BALL SPEED at 812), `overflow-x: visible`, no mask — only a faint chevron class (`can-right`). Clipped-without-mask reads as a rendering bug. Fix: real horizontal scroll with `scroll-snap`, 24px fade masks at both ends (mask only when scrollable in that direction), keep the chevron as affordance. Acceptance: no hard-clipped tile at 932 or 812; fade masks present; row scrolls by touch.
- **[out-05] Two identical × buttons in the overlay's top band.** `flightClose` (x886) and Clear-ghosts (x658) are both 36px circled ×'s on the same row — "dismiss" and "destroy data" are visually the same control. Fix: Clear-ghosts becomes a labelled pill ("Clear" + ghost-dot glyph) or folds into the Ghosts toggle as a sub-action; the corner × stays the only ×. Acceptance: exactly one × glyph in the overlay.
- **[out-06] Landing tag pile-up.** After landing, the "158 m" / "16 m L" / "54°" tags (~10-11px, stacked at the landing point) collide with the output row — the 54° tag renders half-under the tiles. Fix: cap the stack's bottom ≥12px above the row; if the landing sits low, collapse to one combined tag ("158 m · 16 m L · 54°"). Acceptance: no tag intersects the I/O stack at either viewport.
- **[out-07] Focus rings ember → system ring** (`→ SYS-03`; 15 rules, lines ~149–825, plus the white-outline outlier at 767). Same fix and acceptance as [viz-02].

### SHOULD

- **[out-08] One name per datum** (`→ SYS-05`): this app currently ships "LAUNCH" (resting tile), "LAUNCH ANG" (overlay tile), "LAUNCH ANGLE" (viz dashboard) for the same number. Adopt the dictionary and hold every surface to it.
- **[out-09] One order per row** (`→ SYS-05`): resting row starts LAUNCH DIR…, overlay row starts CARRY…. Same members, same order, everywhere (recommended: the SYS-05 canonical order).
- **[out-10] Lens plates invent a fourth surface spec**: measured radius 20px, border white **.07**, solid `#0D0A18` — vs cards 16/.10/blur-plate, dashboards 14, chips 12/.18. Either move lenses to `--radius-card` 16 + `--line`, or codify a `--radius-lens:20` tier in sa-p3.css — but then *nothing else* may freelance (`→ SYS-07`).
- **[out-11] Play-flight pill: 10px text in a 30px pill** — the primary action of the screen is the smallest text in the strip. 11px/600, padding 0 16px; as the screen's single ember CTA under SYS-08 it keeps ember — everything demoted by [out-01] pays for it.
- **[out-12] DIRECTION lens top strip crowding**: "16 m L" (ember, ~10px), the ball dot, the L/R ticks (~8px grey) and two arrowheads meet within ~24px of the TARGET baseline. Bump L/R ticks to 10px, give the offline tag ≥8px clearance from the target line, and let the arrowheads stop 4px short of the tick row.
- **[out-13] Main-cause line inset**: "● Main cause: face closed to path → curves left" sits ~8px off the plate's bottom-left corner — half the plate's 12px content inset. Align to the plate inset grid (12px), and this is exactly the voice the app should have more of — keep it.
- **[out-14] Tiles are tappable (explainer popovers) but look inert**: add hover bg white .06 + pressed scale .97 and ensure a 44px hit rect (tile is 112×~50 — height needs the padding); the affordance also advertises the app's best teaching feature.
- **[out-15] Overlay hero duplication (mirror of [viz-06])**: top-left "162 m TOTAL / 16 m L" + a CARRY 158 tile + landing tags repeating 158/16 = three prints of the same shot. Hero keeps TOTAL + offline; the row is the technical record (CARRY lives there once); landing tags collapse per [out-06].

### COULD

- **[out-16] I/O stack reveal**: after landing the whole two-row stack pops in as one block — stagger output row → input row by 60ms with a 4px rise.
- **[out-17] Ghost grey retune**: `--ghost #9FB2C8` is legitimately reserved for reference traces, but it's a *teal-era* grey; a violet-leaning neutral (#A7A0C4 direction) would sit in-world without stealing the muted role. Low priority; do it in sa-p3 so viz inherits.
- **[out-18] "?" pill alignment**: same optical-centre rule as [home-02] against the Play-flight pill row.

---

# 4 · What the flight overlay gets right (keep these)

So the fixes don't sand off the good parts: the scrim + `scale(.96→1)` card entrance; the comet-and-trail tracer; the dock relocating *into* the overlay so inputs speak one language (move 6); the walkthrough main-cause sentence; home's cold-launch choreography and its warm-return restraint; the `.sa-plate` AA discipline. None of the punch-list touches these behaviours — only their clothing.

---

# 5 · CROSS-SCREEN SYSTEM — fix once in `sa-p3.css`

These are the shared violations behind half the per-screen items. Land these first; most screen items then become verification.

- **[SYS-01] Three type roles, loaded and named.** Today all three screens run the system UI stack for everything — the "prototype voice". Adopt: **ui** = Inter (400/500/600) for labels, eyebrows, buttons, captions; **display** = Inter Tight (or Space Grotesk) 600/700, only for hero numerals ≥28px and the wordmark; **mono** = a data mono (JetBrains Mono / SF Mono class), **data values only** — chip values, tile values, dashboard values, dock value, landing tags, home card stats — always with tabular figures and U+2212 minus. Self-host woff2, `font-display: swap`, system fallbacks. Elements per screen are enumerated in [home-05], [viz-05/-07], [out-01].
- **[SYS-02] Param tokens are single-source.** sa-p3.css already ships `--face/--path/--attack/--loft`; add `--launch` (see [out-03]). Each mock deletes its local hexes (viz line 75, outcome line 99) and aliases `--c-* : var(--*)`. Acceptance: the only place a param hex exists is sa-p3.css.
- **[SYS-03] One focus ring, one pressed spec.** Focus = the codified double ink ring (`.sa-focus`), everywhere — 34 ember-outline rules across the two instruments get deleted. Pressed = `scale(.97)` + bg white .06, 80ms ease-out. Disabled = 40% opacity, no pointer. Write all three into sa-p3.css as classes/notes so screens can't improvise.
- **[SYS-04] Chrome greys.** Controls may only use `--ink / --muted / --secondary(-line) / --line(-strong)`. `--ghost #9FB2C8` is trace-stroke-only (and see [out-17] for its retune). Acceptance: computed styles of every button/border on all three screens contain no #9FB2C8.
- **[SYS-05] Data dictionary — one label, one order.** Canonical: `LAUNCH DIR · LAUNCH ANGLE · SPIN AXIS · CURVE · APEX · LAND ANGLE · BALL SPEED · BACKSPIN · CARRY · TOTAL`. Same casing (uppercase 10.5px/700/.05em label role), same order in every row/grid, carry/total always last. No abbreviations unless the canonical name cannot fit 112px — then the abbreviation is also canonical ("LAUNCH ANGLE" → pick one and use it in all three files).
- **[SYS-06] Unit grammar.** `value␣unit` with a space ("16 m", "90 mph", "7099 rpm"); side letter after unit ("16 m L"); degrees closed up ("−2.0°"); minus is always U+2212 in data (home's `minus()` already does this; the instruments print ASCII hyphens). One helper, three screens.
- **[SYS-07] Surface + spacing tokens.** Radii today: 12 (chips) / 14 (dashboards) / 16 (cards) / 20 (lenses) / 999. Codify **12 = controls, 16 = plates/cards, 999 = pills** and either retire 14 and 20 or add an explicit `--radius-lens:20` — no freelance values. Border alphas today: .07 / .10 / .18 / .30 — collapse to `--line` (.10, decorative) and `--line-strong` (.30, interactive) with chips moving to one of them. Plate fills today: rgba(8,5,14,.86)+blur / solid #150F22 / solid #0D0A18 — codify two tiers: `plate-blur` (on-scene) and `plate-solid` (lens/panel) with named hexes. Spacing: 4/8 grid, content inset 16px at 812 (12px only for the strip), rail/row gaps 8 or 10 — pick one (10 matches home) and use it for chip gaps too.
- **[SYS-08] Ember budget — write the scarcity law as a number.** At rest, a screen may show at most **3 ember elements**: the tracer/ball, one hero value, one primary action pill. Codify the two existing paper exceptions while at it: the logo ball (already written) and the promotion prefix ([home-09]). Everything else that is ember today (nine outcome tiles, apex solid tag, club-speed chip, wind gold, hero offline value) is demoted by items above. A scorer can then count.
- **[SYS-09] Every instrument names itself.** `.sa-strip__title` exists in sa-p3.css but no instrument uses it; ship "BALL FLIGHT" / "OUTCOME" per [viz-19]/its outcome twin (same treatment, top-left quadrant).
- **[SYS-10] Plate bleed over hot strokes.** The 14px tracer under-glow visibly bleeds through .86-alpha blurred plates (home rail card, viz dashboard). Where a plate can sit over the tracer's path, raise that plate's fill alpha to ≥.92 or mask the scene layer under plates. Related: [home-01], [viz-03].

---

# 6 · The rubric (for re-scoring without me)

Score each screen on five dimensions × 20. **Screenshot the same states and viewports listed in the header first; measure in DevTools, don't eyeball.** Total = sum. The bands are defined by countable violations so any careful model scores within ±3 of another.

**Violation checks (used by every dimension):**
- **V-clip**: any element hard-clipped by viewport or covered by a sibling without a mask/fade (count instances at both viewports, all listed states).
- **V-align**: elements sharing an axis (header row, left rail) whose optical centres/edges differ by >2px.
- **V-floor**: any computed font-size <10px.
- **V-token**: any computed colour, radius, or border alpha not present in sa-p3.css tokens (or its two codified exceptions).
- **V-ember**: count of ember-coloured elements at rest (target ≤3, SYS-08).
- **V-dup**: same datum rendered twice in one viewport at rest.
- **V-name**: same datum labelled differently anywhere in the three screens.
- **V-focus**: any focusable element whose focus ring is not the sa-p3 double ink ring.
- **V-state**: any interactive element lacking visible hover/pressed; any transient surface that appears or disappears with no transition (when motion allowed).

**Per-dimension bands:**

1. **First impression** (blind 3-second look at the resting screenshot):
   20–18 = zero V-clip, zero V-align, V-ember ≤3, one clear focal point.
   17–14 = one V-clip *or* V-align; ember ≤6.
   13–10 = two to three of the above; rainbow/wallpaper effects present.
   ≤9 = broken-looking element in the hero area.
2. **Type hierarchy**:
   20–18 = three roles in use (ui/display/mono per SYS-01), zero V-floor, each plate cluster ≤3 sizes, hero:secondary size ratio ≥1.5, zero V-dup.
   17–14 = roles in use, ≤2 V-floor or one V-dup.
   13–10 = single-font voice, or ≥3 V-floor, or values all one size/colour (no reading order).
   ≤9 = hierarchy actively misleads (louder element is less important).
3. **Craft details**:
   20–18 = zero V-clip/V-align anywhere incl. transient states; glow blur ≤0.4× font-size; stroke weights from a ≤2-step scale; unit grammar per SYS-06 with U+2212.
   17–14 = ≤2 total violations.
   13–10 = 3–5 violations.
   ≤9 = >5, or any collision in a hero moment.
4. **Consistency**:
   20–18 = zero V-token, V-name, V-focus; radii/border alphas from the codified sets; chips/pills/plates identical across screens.
   17–14 = ≤2 V-token *and* naming consistent.
   13–10 = param colours or focus rings diverge between screens.
   ≤9 = screens read as different products.
5. **Motion & states**:
   20–18 = zero V-state; entrance choreography ≤2 concurrent systems; transient surfaces animate in *and* out; reduced-motion parity verified; nothing animates over/through occluding content.
   17–14 = ≤2 V-state.
   13–10 = 3–5 V-state, or a transient surface pops with no exit.
   ≤9 = interaction states largely missing.

**Re-scoring procedure:** reproduce the states in the header (same localStorage seeds, both viewports), take the same screenshots, run the V-checks as counts (DevTools measurements + a grep for `outline:2px solid var(--accent)`, `#9FB2C8`, `#EE4954`, `#8FB4D4`, `#A66BFF`, `#F4D000`), then apply the bands. When in doubt between two bands, take the lower one.

---

# 7 · Targets after execution

| Screen | Today | After MUST | After MUST+SHOULD |
|---|---|---|---|
| Home | 73 | ~86 | **93** |
| Ball Flight (viz) | 63 | ~82 | **92** |
| Outcome | 59 | ~80 | **91** |

The gap between "After MUST" and 90+ is exactly the SHOULD lists — they are not optional for the 90 target. The three highest craft-per-effort moves overall, if sequencing matters: **(1) SYS-02 + [viz-01]/[out-03]** (param truth, one hour, kills the two-products feel), **(2) [out-01] + SYS-08** (ember budget — the single biggest perceived-quality jump), **(3) SYS-03** (focus/pressed — one paste, 34 deletions, every keyboard user notices).
