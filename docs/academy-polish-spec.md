# StrikeArc Academy — Polish Pass · Build Spec

**Target file:** `academy.html` (single file, 2420 lines, self-contained SPA).
**Author:** coordinator pass (filtered external design feedback → adopted verdicts only).
**Date:** 2026-07-10 · **Status:** buildable spec. Implement in one branch; verify against §7 before merge.

> Colour is **not** in scope here. A concurrent workflow is repainting `academy.html` to **P3 "Ultraviolet Ember"** via `sa-p3.css`. This spec assumes P3 tokens exist and references them by name. **Do not author colour** — if a rule needs a colour, name the P3 token (`--accent`, `--secondary`, `--celebrate`, `--warn`, `--ink`, `--muted`, `--good`, `--bad`, `--line`, `--plate`). Rejected outright: any new colour tokens, any Norwegian/English hybrid copy (UI is English-locked), any deletion of lesson depth.

---

## 0. Dependencies & wiring

- **Import P3:** ensure `<link rel="stylesheet" href="./sa-p3.css">` is present in `<head>` (owned by the repaint pass; do not duplicate its tokens locally). All rules below consume `sa-p3.css` custom properties and its shared primitives: `.sa-plate`, the double focus ring (`.sa-focus` / `.sa-strip__home:focus-visible`), and the reduced-motion kill block.
- **Colour-law reminder from `sa-p3.css`:** `--accent` (ember) = live ball / live data ONLY; `--celebrate` + `--warn` (gold) = XP / badges ONLY; everything else is the cold ultraviolet world. Academy XP numerals/coins use **`--warn` gold**; badges use **`--celebrate`**. The engine tracer already owns ember. Do not spend ember on chrome.
- **Remove the Google Fonts CDN** (`academy.html` lines 8–10: the `preconnect` pair + the `fonts.googleapis.com/css2?...Chakra+Petch...Azeret+Mono...Archivo` `<link>`). Fonts become vendored + `@font-face` (§1). Native offline requirement: **zero network font fetches**.

---

## 1. Three-role typography system  *(the headline fix — kills the "terminal / web-demo" voice)*

### 1.1 Tokens (canonical) — declare in `:root` of the `<style>` block

```css
:root{
  --font-ui:      "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-display: "Space Grotesk", "Inter Tight", var(--font-ui);
  --font-mono:    "IBM Plex Mono", ui-monospace, "SFMono-Regular", monospace;

  /* back-compat aliases so the sweep is a role reassignment, not a 200-site rename */
  --f-body:    var(--font-ui);
  --f-display: var(--font-display);
  --f-mono:    var(--font-mono);
}
```

Decision: **Space Grotesk** is the display face (more character than Inter Tight; carries the "designed product, not a code demo" voice). Inter Tight kept as the metric-compatible fallback.

**Role law (memorize, enforce in the sweep):**
- `--font-ui` = **body, explanations, quiz text, card descriptions, subtitles, tooltips/sheets, sticky-next label.** NEVER mono for running text.
- `--font-display` = **major titles, parameter names, hero readouts, card titles.** `letter-spacing:-0.03em`. **NOT uppercase-everything** — display is title-case/sentence-case.
- `--font-mono` = **formulas, numeric readouts, units, tiny telemetry labels ONLY.** Accent, not main. Always `font-variant-numeric:tabular-nums` where numeric.

### 1.2 Vendored fonts (FREE licences, local woff2 — no CDN)

All three faces are **SIL OFL 1.1** (free to vendor & redistribute). Ship latin-subset `woff2` under `vendor/fonts/`:

| File | Family / weight |
|---|---|
| `vendor/fonts/Inter-Regular.woff2` | Inter 400 |
| `vendor/fonts/Inter-Medium.woff2` | Inter 500 |
| `vendor/fonts/Inter-SemiBold.woff2` | Inter 600 |
| `vendor/fonts/Inter-Bold.woff2` | Inter 700 |
| `vendor/fonts/SpaceGrotesk-Medium.woff2` | Space Grotesk 500 |
| `vendor/fonts/SpaceGrotesk-SemiBold.woff2` | Space Grotesk 600 |
| `vendor/fonts/SpaceGrotesk-Bold.woff2` | Space Grotesk 700 |
| `vendor/fonts/IBMPlexMono-Regular.woff2` | IBM Plex Mono 400 |
| `vendor/fonts/IBMPlexMono-Medium.woff2` | IBM Plex Mono 500 |
| `vendor/fonts/IBMPlexMono-SemiBold.woff2` | IBM Plex Mono 600 |

`@font-face` blocks in `<style>` (one per file), each: `font-family`, `font-weight`, `font-style:normal`, `font-display:swap`, `src:url("./vendor/fonts/…") format("woff2")`, `unicode-range` latin. Drop an `vendor/fonts/OFL.txt` (concatenated licences) beside them.

### 1.3 Exact type scale (apply verbatim)

| Role | Size | Family / weight | Case / tracking / lh |
|---|---|---|---|
| Section label | 11–12px | `--font-ui` 600 | UPPERCASE · `ls .14em` · `--muted` |
| Card category | 10–11px | `--font-mono` 500 | UPPERCASE · `ls .08em` · `--muted` |
| Card title | 18–20px | `--font-display` 600 | **Sentence case** · `ls -.02em` · `--ink` |
| Lesson / route title | 40–44px | `--font-display` 700 | **Sentence case** · `ls -.03em` · lh 1.02 |
| Subtitle | 18–20px | `--font-ui` 400/500 | sentence · lh 1.45 · `--ink`/`--muted` |
| Body | 15–16px | `--font-ui` 400 | sentence · lh 1.5–1.6 · `--muted` |
| Data value | (per element) | `--font-mono` 600 tnum | numerals · `--warn`/`--ink`/`--accent` per law |

**Uppercase + wide tracking survive on LABELS ONLY.** Strip `text-transform:uppercase` from every title/name.

### 1.4 Per-element sweep (real selectors in `academy.html`)

**→ Section label (UI 600 uppercase `.14em` muted; drop display/mono terminal styling):**
`.kicker` (117), `.sect-k` (184), `.col-head` (126), `.hero-side .hs-k` (199), `.rw-k` (235), `.ledger-k` (338), `.formula .fk` (294), `.bigread .brk` (333), `.chip .ck` (310), `.ctl-sep` (330), `.completion .ck` (395), `.quiz .expl .el` (379), `.skip-link` (54).

**→ Card category / telemetry label (mono 10–11 uppercase):**
`.ccard .crange` (209), `.ntier` (133), `.vig-tag` (256), `.hrow .hest` / `.sl .slk .est` / `.lrow .ln .est` (EST pills), `.qn` (364 — question counter), `.meterlabels` (305), `.ticks span` (272).

**→ Card / display title (display 600, REMOVE uppercase):**
`.ccard .cn` (207), `.node .nlabel` (135), `.vig-title` (255), `.hrow .hlabel` (216), `.lrow .ln` (341), `.quiz .qq` (365), `.lvmeta .t` (98), `.sect h2` (185), `.vig-title`, `.cbadge` titles. `.sect h2` keeps display but sentence-case, `ls -.02em`.

**→ Lesson / route title (display 700, REMOVE uppercase, `ls -.03em`):**
`.hero-main h1` (196; clamp → 40–44px), `.path-intro h1` (118), `#proto` `<h1>` (1263). Route `<h1>`s (`Learn the Instrument`, `Archetype Gallery`, per-lesson `d.parameter`) — sentence case.

**→ Subtitle / body (UI, lh 1.5–1.6) — CRITICAL: move these OFF mono:**
`.hero-main .oneliner` (197), `.prose` (186), `.ccard .cr` (208), `.hrow .hwhy` (222), `.quiz .expl` (377), `.rwlist li` (238), `.badge .pop-info .bd` (113), **`.wolf li` (249 — currently mono, becomes UI body)**, **`.footnote` (285 — mono→UI)**, **`.hlegend` (224 — mono→UI)**, **`.formula .fnote` (297 — mono→UI)**, **`.pquote` (187 — mono→display italic pull-quote, NOT mono)**.

**→ Data value (stays mono, tabular-nums):**
`.slv` (263), `.chip .cv` (311), `.bigread .brv` (334), `.rpmbig` (298), `.hex .lv` (95), `#hdr-xp`/`.lvmeta .x` (99), `.lrow .lv` (343), `.datatable th/td` (358 — tabular data, mono stays), `.formula .fx` (295), `.node .nxp` (136), `.hrow .hrank` (215), `.qscore` (386), `.jprog`/`.jxp` (→ folded into stepper §3.1). SVG inline `font-family="Azeret Mono"` on diagram labels (1812–1813) → update to `IBM Plex Mono` string (chrome text only, still not an engine-physics change).

> **No-mono-body invariant (greppable, see §7):** after the sweep every `--font-mono` / `--f-mono` / `.mono` usage resolves to a number, unit, formula, or ≤2-word telemetry label. No sentence-length run of text may resolve to mono.

---

## 2. Editorial layering  *(portion the depth, don't delete it)*

The **8-step lesson structure STAYS** (existing section ids, unchanged order): `#sec-hook` → `#sec-what` → `#sec-comp` → `#sec-connect` → `#sec-hier` → `#sec-diagram` → `#sec-myth` → `#sec-wolf` → `#sec-quiz` → `#sec-done` (rendered ~1505–1569). Layer *within* each prose section (`#sec-what`, `#sec-comp`, `#sec-connect`, `#sec-myth`):

1. **Key idea box** — one sentence, `--font-display` ~17px, on `.sa-plate`, a left `--secondary-line` rule. First child of the section body. Derived from the section's existing lead sentence (do not invent claims).
2. **Short paragraphs** — 2–3 sentences max, `--font-ui`, lh 1.6, `--muted`. Split the current long `.prose` blob into ≤3 stanzas.
3. **Bullet callouts** — reuse `.rwlist` idiom for scannable points pulled out of the prose.
4. **"Deep dive"** — a collapsible holding the current long-form text. Reuse the existing `.wolf` `<details><summary>` pattern (1559) — it is already keyboard-native and a11y-clean. Any *new* collapsible must be `<details><summary>` **or** a `<button aria-expanded>` + region mirroring `.hexpand` (1456) / `.datatoggle` (1822). Summary label: "Deep dive" (`--font-ui` 600, sentence case). Reduced-motion: no height animation.

Nothing is removed — the long text relocates into the Deep dive. `#sec-hier` (`.hexpand` per-row "why") and `#sec-wolf` already embody this; extend the pattern, don't rebuild it.

---

## 3. Native interaction

### 3.1 Numbered stepper + sticky bottom "Next"  *(replaces the horizontal docs-tabs)*

**Remove** the docs-tabs section rail: `<nav class="jump" aria-label="Lesson sections">` (1497) and its `.jump a` anchor list (1488), keeping `navSections`, `#secdots`, and the `setupReveal` IntersectionObserver (1601) intact — they still drive "current section."

**Add A — compact stepper** (top of lesson, where `.jump` sat): reads **`01 / 08`** style (`--font-mono`, tabular) + current section label (`--font-ui` 600). Driven by the same IntersectionObserver current-section index. Fold the old `#jprog` (count) and `#jxp` (running XP) readouts into this strip. The count digits are decorative (`aria-hidden`); the label is the visible name. It must **not** add a second live region (§5.2) — it silently reflects scroll.

**Add B — sticky bottom action** (`position:sticky` / fixed to viewport bottom): a single 44px-min button, `Next: <next section label>`, safe-area-aware (`padding-bottom:env(safe-area-inset-bottom)`), on `.sa-plate`. Behaviour:
- Click/Enter → smooth-scroll to `navSections[i+1]` **and move focus to that section's heading** (reuse the exact tabindex(-1)-then-`.focus()` contract at 1588–1590). Preserving that focus move is mandatory (§5.4).
- On the last section its label becomes **"Finish lesson"** and it targets `#sec-done`.
- Real `<button>`; gets the `sa-p3.css` double focus ring (`.sa-focus`). Reduced-motion: instant jump (no smooth scroll).
- Landscape: the sticky bar remains pinned bottom and must not overlap the engine canvas — it sits in the scroll column, not over `#sec-diagram`'s figure.

### 3.2 Definition bottom-sheets  *(replace the fixed tooltip; match the app's dock idiom)*

**Remove** the hover tooltip used for definitions/previews: `.tooltip #tooltip role="status"` (153, 437) and `showTip`/`hideTip` (1142). (Its map-node preview job is superseded by §4's preview card.)

**Add a reusable bottom sheet** `.sa-sheet` — slide-up panel matching the Tune dock:
- Structure: `<div class="sa-sheet" role="dialog" aria-modal="true" aria-labelledby="…" hidden>` on `.sa-plate`, plus a scrim `.sa-sheet__scrim`.
- Trigger convention: `<button class="term" data-def="…">` inside body copy (for glossary terms). A `Show in engine` link appears when the term maps to an engine param → closes the sheet, scrolls to `#sec-diagram`, and focuses/pings the matching slider (`#sl-<name>`).
- **Focus contract (identical to the tune dock):** on open, save the trigger, move focus into the sheet, **trap** focus within it; dismiss via **Esc**, a **Done** button, or **outside-tap** (scrim); on close, **restore focus to the trigger**.
- Dismissal + labelling only — no new `aria-live` region.
- Reduced-motion: no slide transform; appears/disappears instantly.

### 3.3 Map card-state hierarchy

Extend node state classes (`.node--available` / `.node--completed` / `.node--locked` / `.node--current`, built at 1330–1331) with a new **`.node--next`** (next-recommended) and tighten each state so all four are optically distinct:

| State | Treatment |
|---|---|
| **available (active)** | `--accent`… no — chrome law: use `--secondary-line` stroke + subtle `--secondary-soft` glow; the `.ring` glyph. (Ember stays reserved for live data; "active glow" here reads as *interactive*, using violet.) |
| **next-recommended (`--node--next`)** | **elevated**: raised (`translateY(-2px)` + soft shadow), brighter `--secondary` border, a "Start here" micro-label. The single node = first `available` node whose prereqs are all complete (or the successor of `store.lastOpened`). |
| **completed** | muted (`--muted` label + fill), `✓` glyph, `+NN XP` stamp in `--warn` gold. |
| **locked** | low opacity chrome + `🔒` + prereq text (already in `aria-label` via `prereqLabels`, 1339). |

**Contrast floor:** locked/dimmed states dim **chrome/fill via opacity, but node label text keeps its own colour** so every label clears **≥4.5:1** on the plate. Do not let opacity drag label contrast below AA.

### 3.4 Subtler XP header  *(less arcade HUD)*

Header rendered at `headerHTML` (~1177–1181) + topbar `.tb-lv` (1495). Retune, keep all ARIA:
- Level readout reads **"Level 2 · Student"** (level number `--font-mono`, tier name `--font-ui`), inline — drop the oversized hex badge dominance (`.hex .lv` 19px stays mono but calmer, no neon glow).
- `#hdr-xpbar` (`role="progressbar"`, aria-valuemin/max/now — **preserve exactly**, 1181/1647): render **thin** (≤4px), fill in `--secondary` (calm), remove `text-shadow`/arcade glow. XP numerals in `--warn` gold.
- Reduce letter-spacing/uppercase to the label tier name only.
- Badges rail (`wireBadges`) unchanged structurally; badge accent = `--celebrate` per law.

---

## 4. Relation-light + preview card  *(fold in the queued map idea)*

Rework `wireMap` (1370) so a node tap **selects** instead of immediately opening (`openNode` at 1374 currently navigates on first click — split it into `selectNode` + `enterNode`).

**On select (first tap / Enter on focused node):**
1. **Relation light:** the node's dependency neighborhood brightens; everything else dims. Neighborhood = its prereqs (`prereqIds`, 1075) **+** its dependents (reverse-edge lookup over the same graph). Apply `.map-canvas.has-selection`, with `.node--selected`, `.node--related`, `.node--dimmed`. **Dimmed label contrast floor ≥4.5:1** (dim non-text; floor text colour).
2. **Preview card** appears (compact; anchored near the node on landscape, bottom-anchored on portrait — may reuse the `.sa-sheet` shell, non-modal variant): one-liner (`NODE[id].blurb`), **"Feeds into:" chips** (tappable → select that dependent), the node's **XP**, and an **Open** button.
3. **Relations as TEXT in the card** (a11y + off-screen nodes): e.g. "Feeds into: Carry, Apex. Depends on: Club speed." — rendered text, not only visual edges, so screen-reader and scrolled-off nodes are covered.

**On enter (second tap on the same node / click Open / Enter on Open):** `enterNode` → `store.lastOpened = id; save(); go('#/lesson/'+id)` (the old `openNode` body). Locked nodes never enter — keep the locked-announce path (1376) via the single live region.

**Keyboard semantics:**
- Node focused + **Enter** → select (show card, move focus into card / to Open).
- **Enter** again / on **Open** → enter lesson.
- **Esc** → deselect: clear `has-selection`, restore focus to the node.
- Nodes remain real `<button>`s in tab order with the double focus ring; existing `aria-label` (state + prereq) preserved and extended with ", selected" when active.

**Reduced-motion:** no glow pulse, no brighten/dim transition (instant state swap), no node "justdone" pulse (already gated by `reduced()`, 1394).

---

## 5. Regression gates — existing a11y contracts that MUST survive

Every item below is review-clean today; the pass must keep each PASS:

1. **Skip link** `.skip-link` → `#app`, first tab stop (53–56, `#app` at 438).
2. **Exactly ONE live region:** `#live` `aria-live="polite" aria-atomic="true"` (436). No new `aria-live` may be introduced by the stepper, sticky-next, sheet, or preview card. All announcements route through the existing `announce()`.
3. **Route container focus:** `#app tabindex="-1"` (438); route change moves focus to the route `<h1>` (tabindex -1 applied at 1198).
4. **Section-landing focus:** stepper/next control moves focus to target section heading via the tabindex(-1)+focus contract (1588–1590) — must be preserved verbatim.
5. **Quiz:** roving tabindex on `.opt[role="radio"]` (`tabindex 0/-1`, 2280), `aria-checked` toggling, and post-answer `aria-disabled="true"` + `pointer-events:none` while options stay readable/focusable (371–376). Preserve the "answered quiz stays keyboard-inspectable" contract.
6. **Expanders:** `.hexpand` `aria-expanded` (1456/1581) and `.datatoggle` `aria-expanded` (1822/1880) toggle correctly.
7. **Deep dive:** `.wolf` `<details><summary>` keyboard-native (1559).
8. **Engine diagrams unchanged:** `#tj-fig` / `#sm-fig` `role="img"` with JS-generated live `aria-label` (1804/1872, 1898), inner `<svg aria-hidden="true">`. **Engine byte-identical** — see §6.
9. **Progressbar:** `#hdr-xpbar` `role="progressbar"` + aria-valuemin/max/now (1181/1647).
10. **Sliders:** `aria-valuetext` with EST → ", estimated" (1753); labels via `<label for>` (1707).
11. **Rotate nudge:** `.nudge role="note"` + dismiss button `aria-label` (441–444).
12. **Reduced-motion:** the `@media (prefers-reduced-motion:reduce)` block (429) + `reduced()` JS (1090) govern ALL new motion (sheet slide, relation dim/glow, sticky-next scroll, stepper). Inherit `sa-p3.css`'s kill block too.
13. **Visible focus everywhere:** replace the cyan `:focus-visible` (50) with the `sa-p3.css` backdrop-proof double ring (`.sa-focus`); no focusable control may lose a visible ring.
14. **Node aria-labels:** state + prereq text (1338–1340) preserved; extend for `, selected`.
15. **Portrait-first, orientation-flexible & landscape usable** both retained.

---

## 6. Hard constraints

- **Engine byte-identical.** Do not touch physics/render functions or their ids: `renderTraj`/`renderSmash` families, every `#tj-*` / `#sm-*` id, the `role="img"` aria-label string generation, slider→state sync (1743–1753), the lesson JSON `<script type="application/json" id="lesson-*">` blocks (447–514). The only permitted change inside diagram markup is the inline SVG label `font-family` string (Azeret Mono → IBM Plex Mono) — chrome text, not physics.
- **Colour owned by the P3 repaint pass.** Reference tokens; author none. No P1/P2 tokens; P3 is locked.
- **Fonts vendored, zero CDN.** No `fonts.googleapis.com` / `fonts.gstatic.com` references remain.
- **Portrait-first, orientation-flexible stays; landscape usable.**
- **English-locked copy.** No Norwegian strings.
- **Depth preserved** — long-form text relocates into Deep dive, never deleted.

---

## 7. Atomic verification list  *(per-change · pass/fail)*

**A. Typography**
- [ ] `--font-ui` / `--font-display` / `--font-mono` declared in `:root`; `--f-body/--f-display/--f-mono` alias them.
- [ ] 10 `@font-face` blocks present, all `src` → `./vendor/fonts/*.woff2`, `font-display:swap`.
- [ ] `grep -Ei "googleapis|gstatic|Chakra|Azeret|Archivo" academy.html` → **0 hits**.
- [ ] `vendor/fonts/` contains the 10 woff2 + `OFL.txt`.
- [ ] Each element class in §1.4 resolves to its assigned role (spot-check: `.wolf li`, `.footnote`, `.pquote`, `.hlegend`, `.fnote` render in `--font-ui`/display, **not mono**).
- [ ] **No mono body:** every `--f-mono`/`--font-mono`/`.mono` hit resolves to a number, unit, formula, or ≤2-word telemetry label — no sentence.
- [ ] `text-transform:uppercase` remains ONLY on section/telemetry **labels**; all titles/card-names/hero are sentence-case.
- [ ] Type scale sizes match §1.3 (lesson title 40–44px, card title 18–20px, body 15–16px).

**B. Editorial layering**
- [ ] Each prose section shows: Key-idea box → short paragraphs (≤3 sentences) → bullet callouts → **Deep dive** collapsible.
- [ ] Deep dive is `<details>`/`<summary>` or `button[aria-expanded]`+region; opens via keyboard (Enter/Space); reduced-motion = no height anim.
- [ ] All 10 section ids present, order unchanged; no long-form text lost (relocated, not deleted).

**C. Stepper + sticky next**
- [ ] `<nav class="jump">` docs-tabs removed; `navSections` + IntersectionObserver retained.
- [ ] Stepper reads `NN / NN` + current section label; updates on scroll; count digits `aria-hidden`; no new live region.
- [ ] Sticky "Next: <section>" is ≥44px, `env(safe-area-inset-bottom)`-padded, on `.sa-plate`.
- [ ] Next click → scroll + **focus moves to target heading**; last section = "Finish lesson" → `#sec-done`.
- [ ] Reduced-motion = instant jump; landscape = bar does not overlap engine canvas.

**D. Bottom-sheet contract**
- [ ] `#tooltip`/`showTip`/`hideTip` removed; no fixed hover tooltip remains.
- [ ] `.sa-sheet` = `role="dialog" aria-modal="true"`, labelled; scrim present.
- [ ] Open → focus enters + traps; Esc / Done / outside-tap all close; focus **restores to trigger**.
- [ ] "Show in engine" (where present) closes sheet → scrolls `#sec-diagram` → pings matching `#sl-<name>`.
- [ ] Reduced-motion = no slide; no new `aria-live`.

**E. Map card states + relation light**
- [ ] Four states optically distinct: available (violet stroke+glow), next (`--node--next`, elevated "Start here"), completed (muted+✓+gold XP), locked (low-opacity+🔒+prereq).
- [ ] Dimmed/locked **label contrast ≥4.5:1** on plate (measured).
- [ ] First tap/Enter = **select** (neighborhood brightens, others dim, preview card shows), not navigate.
- [ ] Preview card: one-liner + tappable "Feeds into:" chips + XP + Open; relations also present as **text**.
- [ ] Second tap / Open / Enter-on-Open = enter lesson; locked never enters (announces via `#live`).
- [ ] Esc deselects + restores focus to node; `, selected` added to aria-label.
- [ ] Reduced-motion = no glow pulse, instant dim/brighten.

**F. Subtler XP header**
- [ ] Reads "Level N · <Tier>"; progressbar ≤4px, `--secondary` fill, no arcade glow; XP numerals `--warn` gold; badges `--celebrate`.
- [ ] `#hdr-xpbar` role + aria-valuemin/max/now intact.

**G. Regression re-pass (§5)** — each PASS:
- [ ] Skip link · single live region · `#app` focus · route `<h1>` focus · section-landing focus.
- [ ] Quiz roving tabindex + aria-checked + answered-disabled-but-focusable.
- [ ] `.hexpand` / `.datatoggle` / `.wolf` expanders keyboard-correct.
- [ ] Engine diagrams `role="img"` live aria-label unchanged; **engine byte-identical** (diff shows only chrome/type/nav/sheet/card + the one SVG font-family string).
- [ ] Sliders aria-valuetext (EST) · progressbar · rotate nudge · double focus ring on every focusable.

**H. Build health**
- [ ] **0 console errors** in **portrait** and **landscape**.
- [ ] No horizontal scroll; sticky bar + sheet safe-area correct on a notched viewport.
- [ ] Fully functional offline (no network requests for fonts).

## MÅLGRUPPE-TILLEGG (Sivert 2026-07-10 — gjelder all tekst-bearbeiding i dette passet)
Målgruppen er IKKE eksperten — det er den NYSGJERRIGE golferen som vil lære mer. Konsekvens for polish: (1) Key idea-boksene skrives i klarspråk uten forkunnskapskrav; fagtermer forklares første gang de brukes (kort parentes eller bottom-sheet-definisjon). (2) «Deep dive» er stedet for ekspert-dybden — aldri hovedløpet. (3) Hooks per leksjon åpner med gjenkjennelig nysgjerrighet («Hvorfor stopper proffens jernslag?») ikke telemetri. (4) Quiz-språk: testing av forståelse, ikke terminologi-pugging.

### PRESISJONS-KLAUSUL (Sivert): klarspråk ≠ utvanning. Riktige fagbegreper (attack angle, spin loft, dynamic loft...) BEHOLDES og læres bort — forklares første gang (parentes/bottom-sheet), aldri erstattes med omtrentligheter. Presisjon er ikke forhandlbart.
