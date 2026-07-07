# PLAN: Density diet — both pages say less, numbers and touch targets get bigger
One coherent, mostly-deletive pass over impact.html + geometry.html: remove every duplicated/derived on-screen string and dead UI block, then reinvest the freed space into larger value type and ≥44px slider hit targets.

## Goal
After this change a user on a landscape phone (844x390 / 740x416) sees each number exactly ONCE per lens, in bigger type: the metric cards drop from 4+7 to 3+6 and grow from 16px/15px values to 19px/18px, the coach sentence appears once (not twice), the yellow-arrow legend chips and subtitle lines are gone, and the four D-plane sliders are full 44px touch targets again. On geometry.html the duplicate bottom-left prose panel is gone; the 3D strike-detail inset is the single strike readout, its labels grow past 11px, and the Strike button now actually toggles it.

## Why now (leverage)
This is P1 verbatim ("sidene skal ikke si for mye slik at knapper og tall ikke blir for smaatt"). Confirmed by reading the code: launch dir/angle each render in 3 places at once (`.launchTag` chip, `vchip_launchDir`/`vchip_launchAng`, and an mcard); `faceToPath` and `spinLoft` mcards are pure arithmetic of the sliders one row above them; `updateCoachLines()` writes the identical `mainCause` string into BOTH `#causeDir` and `#causeLaunch`; the minidock sliders are 36px (documented in-file as a "REBALANCE casualty"); ~200 lines of DOM/CSS/JS are confirmed dead (`.miniPanel`, `.seg`, `.rail`, `#rail`, `buildSecChip`). geometry.html shows the same band+low-point+strike verdict in prose twice (`.readout #tip` and `.strike-detail #sdFoot`), and `strikeBtn` only hides `.readout` while `.strike-detail` has no toggle at all. Every cut is zero-information-loss.

## Exact files to touch
- `C:/Users/SkotvoldSivertSende/OneDrive - IdrettsKontor/Skrivebord/Apper/svingbue/impact.html` — all P1 cuts + type bumps + slider height + dead-code removal (steps 1–9).
- `C:/Users/SkotvoldSivertSende/OneDrive - IdrettsKontor/Skrivebord/Apper/svingbue/geometry.html` — readout consolidation, strikeBtn rewire, inset type bumps (steps 10–12).
- `C:/Users/SkotvoldSivertSende/OneDrive - IdrettsKontor/Skrivebord/Apper/svingbue/index.html` — remove no-op `startOnboarding` + its misleading comment only (step 13).

Files that must NOT change:
- `sa-firstrun.js` — DO NOT delete `SA.onboarding` after all: `index-glass.html:239` still calls it (that page ships on the web root, only the native www/ excludes it). The work item's "never-called" claim is wrong. Leave the file byte-identical.
- `swing-parameters-and-impact.js`, `impact-flight.js` — shared engine, byte-identical. (`sq.tip` becomes unused by geometry.html; that is fine, it stays exported.)
- `sa-shots.js`, `sa-iap.js`, `sa-paywall.js/.css`, `sa-haptics.js`, everything in `geo3d/`, `vendor/`, `www/` (never hand-edit www/), `codemagic.yaml`, all `*-mock.html` / `*-glass.html` pages.

## Pre-flight
1. Serve locally: `python -m http.server 8099` from the repo root (`.../Apper/svingbue`). Pages: `http://localhost:8099/impact.html`, `http://localhost:8099/geometry.html`.
2. In every headless probe, seed past the walkthroughs BEFORE interacting: `localStorage.setItem('sa_coach_impact','1'); localStorage.setItem('sa_coach_geo','1');` then reload.
3. Confirm these exist before editing (grep, NOT recursive shell find — repo is under OneDrive with node_modules):
   - impact.html: `.launchTag` (CSS ~:162, markup in both `lenshead` blocks), `updateCoachLines`, `LAUNCH_ORDER`, `syncChipValues`, `updateMiniArrows`, `$('mpLaunch')`, `id="rail"`, `.segwrap`, `.tcell`.
   - geometry.html: `aside class="readout"`, `#sdFoot`, `strikeBtn`, `updateInsetRect`, `CONTROL_SEL`, `LOW POINT` (in `updateStrikeDetail`).
4. Baseline invariants (must also pass AFTER): on geometry.html at 900x470 run `window.__sa.checkAlign3d(5)` → `.pass === true`; `window.__sa3d.renderCount` static over 1.5s idle; 0 console errors on both pages.
5. Note: all pre-edit line numbers below shift as steps land — always locate by the quoted anchor string, never by line number.

## Implementation order

### impact.html — say less

**Step 1 — delete the launchTag legend chips (value already on vchip + mcard).**
- Delete markup line `<div class="launchTag" aria-hidden="true"><i></i>Launch dir</div>` (inside `#lensDir`'s section, pre-edit :842).
- Delete markup line `<div class="launchTag" aria-hidden="true"><i></i>Launch angle</div>` (inside `#lensHt`, pre-edit :1005).
- Delete the CSS block starting at the comment `/* LAUNCH tag — a persistent legend chip` through the line `.heroLens .launchTag i{...}` (pre-edit :158-168, two rules + comment).
- No JS references `.launchTag` (only a prose comment near `PARAM_INFO.launchDir`, "the yellow arrow's .launchTag says" — rewrite that comment line to `// One quantity, ONE name: card + popover both say "Launch direction" (Fable audit #6a).`).

**Step 2 — delete the .lh2 subtitle lines + the vestigial Flight panel.**
- In `#lensDir`: change `<div class="lenshead"><div class="lh1">Direction</div><div class="lh2">Top-down · face &amp; path</div></div>` → `<div class="lenshead"><div class="lh1">Direction</div></div>`.
- In `#lensHt`: same for `<div class="lh2">Side-on · attack &amp; dyn loft</div>`.
- Delete the whole vestigial `#panelFlight` block: from `<!-- ═══ FLIGHT FOCUS ═══` through its closing `</div>` (pre-edit :1065-1077, contains `#segFlightPlay`). SAFE: `focusPanels.flight` and `$('segFlightPlay') && ...` are both null-guarded in the JS (verified at `if (focusPanels.flight)` and `$('segFlightPlay') && $('segFlightPlay').addEventListener`). Do NOT touch `setFocus` itself.
- Delete the CSS line `.heroLens .lenshead .lh2{font-size:8px;...}` (pre-edit :157).
- The two SVG `aria-label`s (:848, :1007) already carry this information — no aria change needed.

**Step 3 — drop the two derived mcards and re-grid to 3 columns.**
- In the `CELLS` array, delete the ENTIRE `faceToPath` entry object (anchor: `{ key:'faceToPath', home:'dir', name:'Face-to-path', size:'lg', plane:'H', est:false,` … through its closing `},` — pre-edit :1624-1629).
- Delete the ENTIRE `spinLoft` entry object (anchor: `{ key:'spinLoft', home:'launch', name:'Spin loft', size:'sm', plane:'V', est:false,` … pre-edit :1666-1671).
- CRITICAL: also change `const LAUNCH_ORDER = ['spinLoft','launch','apex','land'];` → `const LAUNCH_ORDER = ['launch','apex','land'];` — otherwise `LAUNCH_ORDER.map(k => CELLS.find(...))` yields `undefined` and `buildHeroCard(undefined)` throws.
- Update the trailing comment on `const DIR_CELLS = CELLS.filter(c=>c.home==='dir');` from `// face-to-path, start, spinAxis, curve (4)` to `// start, spinAxis, curve (3)`.
- Leave `RAIL_TO_BREAKDOWN`'s `faceToPath:'bd_faceToPath'` / `spinLoft:'bd_spinLoft'` entries alone — `redirectCell` guards `if (!reg || !reg.btn) return;` so missing cells are no-ops. Leave `PARAM_INFO.faceToPath`/`DIAGRAMS.faceToPath` alone (bd_spinLoft is still reached from the flight grid's `f_spinLoft`).
- CSS: in `.heroResults{flex:0 0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:0 10px 0}` change `repeat(4,1fr)` → `repeat(3,1fr)`.
- CSS: in `#heroResultsLaunch{grid-template-columns:repeat(4,1fr);gap:5px}` change `repeat(4,1fr)` → `repeat(3,1fr)`. (Launch row = 3 hero + 3 secondary cards → two clean rows of 3.)

**Step 4 — type-scale bump (the "numbers get bigger" payoff). Exact new values:**
- `.mcard .mk{font-size:9px;` → `font-size:10.5px;`
- `.mcard .mv{font-size:16px;` → `font-size:19px;`
- `#heroResultsLaunch .mcard .mv{font-size:15px}` → `font-size:18px`
- `#heroResultsLaunch .mcard .mk{font-size:8.5px;letter-spacing:.03em}` → `font-size:10px;letter-spacing:.03em`
- `.heroLens .lenshead .lh1{font-size:9px;` → `font-size:10.5px;`
- `.mini .mname{font-size:9.5px;` → `font-size:11px;`
- `.mini .mval{font-size:10.5px;` → `font-size:12.5px;`
- Do NOT change `.mcard` height (48px) or its `::after` 44px hit pad.

**Step 5 — render the coach line ONCE (keep Direction's, drop Launch's).**
- Delete the Launch panel's coach strip markup: `<div class="coachWrap">` … `</div>` containing `id="causeLaunch"` / `id="cueLaunch"` (pre-edit :1059-1061).
- Also delete the dead host div right above it: `<div class="secChips" id="secChipsLaunch"></div>` and the CSS rule `.secChips{display:none}` plus its preceding `/* REBALANCE: the old secondary chip row … */` comment. (Verified: no JS does `$('secChipsLaunch')`; `SEC_CELLS` are appended to `#heroResultsLaunch` via `buildHeroCard`.)
- In `updateCoachLines(f)` (anchor `function updateCoachLines(f){`), delete the four lines:
  `const causeLaunch = $('causeLaunch'), cueLaunch = $('cueLaunch');`, `if (causeLaunch) causeLaunch.textContent = mc.cause;`, `if (cueLaunch) cueLaunch.textContent = sec || mc.cue;` — and keep `causeDir`/`cueDir`/`flightCoachCue` writes exactly as they are (the flight overlay's `#flightCoachCue` MUST keep updating).

**Step 6 — shorten the clipping coach strings + coach-mark Step 1.**
`.coachLine` has `max-height:1.3em` + `overflow:hidden`, so anything past one line disappears. Replace the six long `CUES` values with these exact strings (keep the four short ones as-is):
```js
faceOpen:   'Face open to path — starts right, curves further right.',
faceClosed: 'Face closed to path — starts left, curves further left.',
pathLeft:   'Path swings left (out-to-in) — start line pulls left.',
pathRight:  'Path swings right (in-to-out) — start line pushes right.',
attackDown: 'Steep downward attack — more spin loft, higher and shorter.',
attackUp:   'Upward attack — less spin loft, flatter and hotter.',
```
In `STEPS` (anchor `const STEPS = [` inside `setupCoachMarks`), replace the 3-sentence Step 1 `body` with exactly:
`'Direction (left) shows face & path from above; Launch (right) shows attack & loft from the side.'`
Do not touch the `selector` values — every STEPS selector (`#stage`, `#lensDir .minidock`, `#lensHt .minidock`, `#s_speed`, `#playFlight`) survives this plan; verify after all steps.

**Step 7 — restore ≥44px slider hit height.**
- In the rule `.rwrap input[type=range].premium-range{ -webkit-appearance:none;appearance:none; width:100%;height:36px; …}` change `height:36px` → `height:44px`.
- This rule is shared by ALL premium sliders (s_face/s_path/s_attack/s_loft/s_speed/fSpeedRange). That is intended: fSpeedRange sits in a 44px `.ctrl` row; the top-strip `s_speed` gains 4px of invisible hit area beyond the 40px strip (input background is transparent; the painted 5px track stays centred — verify no visual clipping in the top strip at 844x390).
- Replace the stale comment lines `the docked minidock sliders (Direction/Launch focus) are a REBALANCE casualty — … stays fully inside it.` (pre-edit :285-291) with one line: `• hit area: full ≥44px box on every host (density-diet 2026-07: the 36px "REBALANCE casualty" trim is reverted).`
- Do NOT touch the thumb (`20px`, `margin-top:-7.5px`) or track (5px) rules.

**Step 8 — dead-code deletion, batch 1: the retired .miniPanel system (DOM + JS + CSS together — the JS has NO null guards on `$('mpLaunch')`, so deleting only the DOM breaks the whole module).**
Delete ALL of the following in one step:
- Markup: `<button type="button" class="miniPanel" id="mpLaunch" …>` through its `</button>` (pre-edit :947-971, includes the stale "Tap to focus →" copy, `g_attackMini`/`g_loftMini`, `chipAttack`/`chipDynLoft`), plus its preceding `<!-- MINI — LAUNCH … -->` comment (:942-946).
- Markup: `<button type="button" class="miniPanel" id="mpDir" …>` through `</button>` (pre-edit :977-996, includes `g_pathMini`/`g_faceMini`, `chipFace`/`chipPath`) plus its preceding comment.
- CSS: `.focusPanel .miniPanel{display:none}` (:137) and its preceding one-line comment; the whole block from `/* mini side panel (~30%) — the OTHER lens…` `.miniPanel{` through `.chip .cv{…}` (pre-edit :235-262 — `.miniPanel*`, `.mp-*`, `.chip*` rules; `.chip` in impact.html is used ONLY by the miniPanel spans and the never-called `buildSecChip`).
- JS: `function rotMini(…)` + `function updateMiniArrows(){…}` and their header comment block (pre-edit :2419-2438).
- JS: `function syncChipValues(){…}` + its 2-line header comment (pre-edit :2494-2501).
- JS: inside `recompute()`, delete the two call lines `updateMiniArrows();` and `syncChipValues();`.
- JS: `$('mpLaunch').addEventListener('click', () => setFocus('launch'));` and `$('mpDir').addEventListener('click', () => setFocus('direction'));` plus the `// mini-panel taps …` comment.
- JS: the whole `chipActivate` block — long comment (:3957-3965), `function chipActivate(…){…}`, and the four `chipActivate('chip…', '…');` calls.
- JS: `function buildSecChip(c){…}` (never called — `SEC_CELLS` go through `buildHeroCard`).
- Comment hygiene: in the `init()` comment `(renderLaunchBend, updateCoachLines, updateMiniArrows, syncChipValues)` drop the last two names.
- Verified: `sa-firstrun.js` and `sa-shots.js` contain NO references to miniPanel/chip ids.

**Step 9 — dead-code deletion, batch 2: retired seg control + telemetry rail.**
- CSS: delete `.segwrap{…}` + `.seg{…}` + all `.seg button…` rules and the `/* ══ FOCUS-MODE SEGMENTED CONTROL…` comment (pre-edit :74-98). Also delete the two `≤960px` media lines `.seg button{min-width:0;…}` and `.seg button .sk{width:5px;height:5px}` (:785-786). Leave the `segBtns`/`setSegPressed` JS alone — it is a guarded no-op still called from `openFlight()`.
- CSS: delete the whole `/* ══ BOTTOM TELEMETRY RAIL…` block — `.rail{…}` through `@media (prefers-reduced-motion:reduce){ .tcell .rng .fill{transition:none} }` (pre-edit :460-508; `.rail*` + `.tcell*` rules).
- Markup: delete `<div id="rail" hidden aria-hidden="true"></div>` and its preceding 3-line comment (pre-edit :1080-1083).
- JS: delete `function updateRailScrollHints(){}` + its comment (:2201-2204) and the call `requestAnimationFrame(updateRailScrollHints);` in `init()`.
- Do NOT rename `renderRail()` — it now renders the hero cards and is live code.

### index.html — comment/no-op cleanup only

**Step 10.**
- In the header comment, delete the sentence fragment `After the splash, first run → SA.onboarding(...).` (keep the rest of the splash comment).
- Change `if (!splash) { startOnboarding(); return; }` → `if (!splash) return;`
- Delete `function startOnboarding() { /* Onboarding intro removed — … */ }` entirely.
- In `teardown()`'s `remove` closure, delete the `startOnboarding();` call line (keep the splash removal line).
- NOTHING else in index.html changes (it is otherwise lean).

### geometry.html — one strike readout, bigger labels

**Step 11 — rewire strikeBtn to toggle the strike-detail inset (do this BEFORE deleting .readout so the page never lacks a working toggle).**
Replace the block:
```js
// strike toggle: show/hide the strike-result panel so you can study the bare swing arc
const readoutEl = document.querySelector('.readout');
$('strikeBtn').addEventListener('click', () => {
  const on = readoutEl.style.display !== 'none';
  readoutEl.style.display = on ? 'none' : 'flex';
  $('strikeBtn').setAttribute('aria-pressed', String(!on));
});
```
with:
```js
// strike toggle: show/hide the strike-detail inset so you can study the bare swing arc
const strikeDetailEl = $('strikeDetail');
$('strikeBtn').addEventListener('click', () => {
  const on = strikeDetailEl.style.display !== 'none';
  if (on) {
    strikeDetailEl.style.display = 'none';
    // zero the scissor rect: w/h clamp to 1 inside setRect, and renderPass()
    // skips when w<2 — otherwise the inset keeps painting a ghost 3D square
    // into the canvas region where the card used to be.
    if (inset3d) inset3d.setRect({ x: 0, y: 0, w: 0, h: 0 });
  } else {
    strikeDetailEl.style.display = '';
    updateInsetRect();   // re-measure the card's viewport
  }
  if (sa3d) sa3d.invalidate();
  $('strikeBtn').setAttribute('aria-pressed', String(!on));
});
```
- Verify `#strikeDetail` contains no focusable descendants (no buttons/links/inputs/`tabindex`) — check now AND re-check if a later change adds one. If focus is ever inside `#strikeDetail` when it is hidden, move focus to `#strikeBtn` before setting `display:none` (browsers otherwise drop focus to `<body>`).

**Step 12 — delete the duplicate `.readout` prose panel.**
- Markup: delete the whole `<aside class="readout" aria-live="polite" aria-label="Strike result">…</aside>` (pre-edit :394-410 — verdict row `#dot/#band/#pct`, `#tip`, and the `.ballcloseup` SVG with `#cuLine/#cuLabel/#ballGrad`). Everything it said survives: band+pct in `#sdChip`, the sentence in `#sdFoot`, contact height as the 3D `ballTick` ring + the inset's mm callout, and the SR text in `#sceneData`.
- JS, in `renderReadout()`: delete the five lines writing `$('band')`, `$('dot')`, `$('pct')`, `$('tip')` (anchors `$('band').textContent = sq.band;` through `$('tip').textContent = sq.tip;`) AND the ball-closeup block from `// ball close-up: contact height marker` through `$('cuLabel').textContent = …;` (pre-edit :808-819). KEEP the `sceneData` update and the `hud-chips` updates (`els.chipAtkTx…`). Keep the function name and its call sites.
- JS: in `const CONTROL_SEL = '.controls, .readout, .tune, .modnav, .title, .strike-detail';` remove `.readout, ` and `.title, ` → `'.controls, .tune, .modnav, .strike-detail'` (there is no `.title` element in the markup — dead selector).
- CSS: delete the `/* strike readout */` block `.readout{…}` through `.ballcloseup{width:84px;…}` (pre-edit :166-179), the media rule `@media (max-width:560px){.readout{width:min(50vw,260px)}}` (:342), and the dead `.title` block (`.title{position:fixed;…}` + `.title h1` + `.title p`, pre-edit :127-129). In the `.facezoom-chip` comment, change `see .readout/.tune` → `see .tune`.

**Step 13 — inset type past 11px + drop the redundant LOW POINT text.**
- CSS: `.strike-detail .ttl{font-size:10px;` → `font-size:11px;`
- CSS: in `.sd-lb{font:700 10px/1 -apple-system,…}` change `10px` → `12px`.
- JS, in `updateStrikeDetail()`: delete the whole block (b) — comment `// (b) LOW POINT label — …` through its closing `}` (pre-edit :752-764, the `if (!pLp.behind) {…}` that pushes the leader line, dot and `LOW POINT` text). The yellow 3D marker sphere (geo3d/lowpoint.js `marker`) plus the cm number on the dimension line already carry it.
- JS, block (a): grow the cm plate for the 12px text — change `width="44" height="15"` → `width="48" height="17"`, its `y="${(topY - 20).toFixed(1)}"` → `y="${(topY - 21).toFixed(1)}"`, the `x="${(midX - 22).toFixed(1)}"` → `x="${(midX - 24).toFixed(1)}"`, and the text `y="${(topY - 8.5).toFixed(1)}"` → `y="${(topY - 9).toFixed(1)}"`.

**Step 14 — verify (see Acceptance criteria), then commit locally. Do NOT push without Sivert (every push to main triggers a Codemagic iOS build).**

## Edge cases a weaker model would miss
1. **`SA.onboarding` is NOT dead** — `index-glass.html:239` calls it and that page is served on the web root (only native `www/` excludes it via the copy-web allowlist). Leave `sa-firstrun.js` untouched, despite the work item saying otherwise.
2. **`renderRail()` iterates the FULL `CELLS` array with `cellEls[c.key].valEl`** — removing an mcard without deleting its `CELLS` entry throws a TypeError on the next slider input. Delete the entries themselves (step 3).
3. **`LAUNCH_ORDER` lookup crashes on a missing key** — `LAUNCH_ORDER.map(k => CELLS.find(c=>c.key===k))` returns `undefined` for a deleted key and `buildHeroCard(undefined)` throws at boot. Remove `'spinLoft'` from `LAUNCH_ORDER` in the same edit.
4. **`$('mpLaunch').addEventListener(...)` has no null guard** — deleting the miniPanel DOM without deleting these two lines kills the entire module script (page renders but nothing works). DOM+JS+CSS must go in one step (step 8).
5. **Hidden strike-detail leaves a stale scissor rect** — `updateInsetRect()` early-returns when the viewport measures <2px, so `insetview.js renderPass()` keeps painting the 3D inset into the old canvas region. Zero the rect on hide and re-measure on show (step 11 code does both).
6. **`.chip` CSS exists in BOTH files** — impact.html's `.chip` (miniPanel) is dead and deleted; geometry.html's `.strike-detail .chip` is live. Don't cross the streams.
7. **The 44px `premium-range` rule is shared** — it also governs the top-strip `s_speed` (40px strip; the extra 4px is transparent hit area, verify visually) and `fSpeedRange` (its `.fSpeed input[type=range]` 44px rule was being overridden to 36px by the higher-specificity premium rule until now — this change fixes it too).
8. **`setSegPressed`/`segBtns` are live no-ops** — called from `openFlight()`; the buttons never existed in this markup. Delete only the `.seg`/`.segwrap` CSS, never the JS.
9. **`#panelFlight` deletion is guarded** — `focusPanels.flight` and `$('segFlightPlay')` are both null-checked; `setFocus`/`__impactFocusHook` must survive (used by `closeFlight`, coach marks, tests).
10. **`#flightScrim` is a CHILD of `.app`** — `openFlight()` inerts `.topstrip` + `#stage` specifically, never `.app`. Nothing in this plan may change that.
11. **`sa-paywall.js` focus waits for the scrim's .25s transitionend** — untouched here; don't "simplify" it if edits stray near overlay code.
12. **Coach-mark STEPS selectors must exist in the DOM** — this plan keeps all five impact selectors and all three geometry selectors (`#viewBtn/#tuneBtn/#hit`); re-verify after step 8 (deleting the miniPanels does not touch them).
13. **`#flightCoachCue` must keep updating** — when trimming `updateCoachLines`, only the `causeLaunch`/`cueLaunch` writes go; the flight overlay's dl3 line stays.
14. **Engine files are byte-identical** — geometry's `sq.tip` becoming unused is NOT a reason to edit `swing-parameters-and-impact.js`.
15. **WKWebView: relative imports only** — this plan adds no imports; do not introduce any bare specifier while editing.
16. **`www/` is generated** — never hand-edit; CI regenerates it (codemagic.yaml step 2).
17. **Batch commits; do not push doc-only changes alone** — every push to main burns Codemagic iOS minutes. Commit locally; pushing is Sivert's call.
18. **OneDrive + node_modules** — use ripgrep-style tools only; recursive shell find/grep times out.
19. **CRLF warnings from git on Windows are benign.**
20. **Cyan discipline** — no color changes in this plan; if tempted, cyan #22E3D6 stays reserved for the live ball + its data.

## Accessibility requirements
- **Touch targets:** all four minidock sliders ≥44px hit height (step 7 — this is the point); `.mcard::after` 44px pads, `.playpill::after`, `.modnav a::after` untouched; geometry `.slider` rows already 44px; `strikeBtn` stays a 44px button. `s_speed`'s enlarged 44px invisible hit box (step 7) must not overlap the hit boxes (including `::after` extensions) of adjacent interactive topstrip elements — back/nav, Play flight pill, `?` help — at 844x390 AND 740x416; check for visual clipping AND hit-box overlap (overlapping targets mis-tap and defeat the 44px goal, WCAG 2.5.8 spirit).
- **Focus order:** deleting the (display:none, hence already untabbable) miniPanel buttons and `#panelFlight` removes zero reachable tab stops — verify Tab order on impact.html is: nav → speed slider → Play flight → help → face → path → dir cards → attack → loft → launch cards. Flight overlay focus trap (inert `.topstrip`+`#stage`, focus to `#flightClose`, restore on close) must behave identically after the edits. `#strikeDetail` on geometry.html: confirm no focusable descendants; if that ever changes, hiding it while focus is inside must move focus to `#strikeBtn`, never drop it to `<body>` (step 11).
- **ARIA:** the lens SVG `role="img"` aria-labels (updated live by `updateLensAria`) are unchanged and now the sole carrier of the deleted `.lh2` text — do not remove them. `#predLive` (polite) and `#fCarryLive` untouched. Each mcard keeps its `aria-label` set in `renderRail` (`'<name> <value>, opens explanation'`). geometry: the removed `.readout` was `aria-live="polite"`, but the sr-only `#sceneData` polite region carries band/pct/attack/path/low-point — keep it verbatim; `strikeBtn` keeps `aria-pressed` reflecting the inset's visibility; `#strikeDetail` keeps `role="group"` + `aria-labelledby="sdTtl"`.
- **Contrast:** no color changes anywhere. Bumped text keeps existing pairs: `--muted` #9aabc6 on #0A0E12 ≈ 8.6:1 (AA at any size), `--ink`/`--accent` values unchanged; `.sd-lb` keeps its 2.5px dark stroke (paint-order) for legibility over the 3D render. Flight-overlay plates rgba(8,16,20,.72) untouched.
- **Reduced motion:** no new transitions/animations added; existing `prefers-reduced-motion` kill-switches in both files must remain (don't delete them while removing adjacent dead CSS — the `.tcell .rng` reduced-motion line goes ONLY because the whole .tcell block goes).
- Run the repo's accessibility review gate (accesslint audit_live against both pages at 844x390) after implementation; 0 new violations.

## Acceptance criteria
Run at 844x390 AND 740x416 (Chrome headless, `python -m http.server 8099`, seed `sa_coach_impact=1` + `sa_coach_geo=1` then reload).

impact.html (`http://localhost:8099/impact.html`):
1. `document.querySelectorAll('.launchTag').length === 0` and `document.querySelectorAll('.lh2').length === 0`.
2. `document.querySelectorAll('#heroResultsDir .mcard').length === 3` and `document.querySelectorAll('#heroResultsLaunch .mcard').length === 6`; `document.getElementById('cell_faceToPath') === null`; `document.getElementById('cell_spinLoft') === null`.
3. `getComputedStyle(document.querySelector('#heroResultsDir .mcard .mv')).fontSize === '19px'`; `getComputedStyle(document.querySelector('#heroResultsLaunch .mcard .mv')).fontSize === '18px'`.
4. All four D-plane sliders ≥44px: `['s_face','s_path','s_attack','s_loft'].every(id => document.getElementById(id).getBoundingClientRect().height >= 44)`.
5. Single coach line: `document.getElementById('causeLaunch') === null`; after `const s=document.getElementById('s_face'); s.value=8; s.dispatchEvent(new Event('input'));` → `document.getElementById('causeDir').textContent` starts with `'Main cause: face open'` and `document.getElementById('cueDir').textContent.length <= 70`.
6. Dead code gone: `['mpLaunch','mpDir','rail','secChipsLaunch','panelFlight','chipFaceVal'].every(id => document.getElementById(id) === null)`; page source contains no `.segwrap` or `.tcell` CSS.
7. Popovers still work: click `#cell_start` → `#pop` gets class `open` and `#popHeadName.textContent === 'Launch direction'`; Escape closes it.
8. Flight overlay intact: `window.__impact.focus.set('flight')` → `#flightScrim.classList.contains('open') === true`, `document.getElementById('stage').inert === true`, `document.querySelector('.topstrip').inert === true`; `#flightCoachCue` is non-empty after a solve; close → both `inert === false` and `window.__impact.focus.current() === 'direction'`.
9. Coach-mark selectors all resolve: `['#stage','#lensDir .minidock','#lensHt .minidock','#s_speed','#playFlight'].every(s => !!document.querySelector(s))`.
10. Drag-to-rotate + vchips still work: pointer-drag on `#g_face` changes `window.__impact.state.faceAngle`; `#vchip_face` gets class `show` while active.
11. 0 console errors at both viewports; visual check: no top-strip clipping from the 44px `s_speed`, Dir row shows 3 wide cards on one row, Launch shows 3+3.
11a. `s_speed`'s 44px hit box (incl. `::after`) does not intersect the hit boxes of the back/nav control, the Play flight pill, or the `?` help control — compute via `getBoundingClientRect()` on each and assert no rectangle overlap — at both 844x390 and 740x416.
11b. Keyboard-walk impact.html with repeated Tab after all deletions and assert focus visits exactly: nav → speed slider → Play flight → help → face → path → dir cards → attack → loft → launch cards (matches the Accessibility "Focus order" spec); assert `document.getElementById(id) === null` for `mpLaunch`, `mpDir`, `panelFlight`, `rail`, `secChipsLaunch` throughout the walk, i.e. none of them ever receives focus (`document.activeElement` never matches any of these ids at any point in the walk).

geometry.html (`http://localhost:8099/geometry.html`):
12. `document.querySelector('.readout') === null`; `document.getElementById('tip') === null`; `#sdFoot` non-empty and matches the pattern `/^(Pure|Thin|Fat|Duff|Whiff)/` via `window.__sa.three.inset.footText()`.
13. strikeBtn toggle: click `#strikeBtn` → `#strikeDetail` hidden, `aria-pressed === 'false'`, and `window.__sa.three.inset.rect().w <= 1`; click again → visible, `aria-pressed === 'true'`, `rect().w > 100`. No ghost 3D square where the card was while hidden (screenshot check).
14. Inset labels: `getComputedStyle(document.querySelector('.strike-detail .ttl')).fontSize === '11px'`; `window.__sa.three.inset.annotSvgHtml()` does NOT contain `'LOW POINT'` but DOES contain `'cm'`.
15. `#sceneData` still updates: move `#s_lpx` (set value + dispatch input) → `#sceneData.textContent` contains `'Low point'`.
16. Invariants: `window.__sa.checkAlign3d(5).pass === true`; `window.__sa3d.renderCount` unchanged over 1.5s idle; 0 console errors at 900x470 AND 844x390.
17. `document.getElementById('strikeDetail').querySelectorAll('button, a[href], input, select, textarea, [tabindex]').length === 0` (no focusable descendants); toggling `#strikeBtn` never leaves `document.activeElement === document.body`.

Both pages: run accesslint audit_live → no new violations vs pre-change baseline.

## Out of scope
- The ghost/Play-flight comparison UX (P2) — separate work item; do not touch `ghosts`, `fPlay`, `computeModel`, or the shared-camera fit.
- Any physics/engine change (`swing-parameters-and-impact.js`, `impact-flight.js` byte-identical; no regression-table run needed).
- `sa-firstrun.js` (kept intact — see Exact files), `sa-shots.js`/`sa-iap.js`/`sa-paywall.*` monetization flow, `club-calibration.html`, all mock/glass pages.
- Moving/redesigning the coach line (full-width relocation, two-line budget) — trim only.
- geometry.html tune-rail, hud-chips, camera, timeline, face-zoom — untouched.
- Renaming ids/functions (`renderRail`, `renderReadout` keep their names), refactors, formatting sweeps.
- `git push` / Codemagic builds / TestFlight — commit locally only.
