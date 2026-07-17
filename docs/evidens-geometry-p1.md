# EVIDENSPAKKE — Geometry P1 (skisse for PR)

Kandidat: `design/geometry-p1` @ HEAD (denne branchen).
Produsert lokalt av ØKT 2 (eksekvering), 2026-07-17. Headless Chromium
(Playwright 1.60) mot lokal HTTP-server; viewports 812×375 (13 mini
landskap) og 932×430 (Pro Max landskap). Vedlegg i `.screenshots-p1/`.

## Evidenssjekkliste (ordre §Binære evidenskrav)

| # | Krav | Status | Vedlegg / bevis |
|---|------|--------|-----------------|
| 1 | Alle soner synlige uten klipping, 13 mini + Pro Max landskap | ✅ | `p1-13mini-low.png`, `p1-promax-low.png` + målte rects (panel/chips/bar/seg/slider alle innenfor viewport, `cellsClipped: [0,0,0,0]`) |
| 2 | Ball + kontaktpunkt aldri okkludert i noen linse | ✅ | `p1-lens-{plane,dir,low,arc}.png` — ballScreenPx midt i canvas-sonen i alle fire; kamera-offset (-0.5 m) komponerer scenen over den permanente baren |
| 3 | Ingen teksttrunkering ved maksverdier | ✅ | `p1-max-values.png` (LOW X = −15 cm; scrollWidth−clientWidth = 0 på alle celler; STRIKE-chip min-width 112px holder «NN mm high») |
| 4 | Chip-verdier = motor-output eksakt | ✅ | Kodereferanse: `renderReadout()` leser KUN `deriveImpact`/`strikeQuality`/`clubBallContact`; + test 1 (TrackMan-identitet) |
| 5 | Testsuite 10/10 grønn | ✅ | `node --test scripts/geometry-p1.test.mjs` → tests 10, pass 10, fail 0 (CI-output i PR) |
| 6 | Linse-dimming: uberørte chips 25 %, berørte 100 % | ✅ | `p1-lens-*.png` ×4 + målt: plane dimmer strike; arc dimmer attack+path; dir/low dimmer ingen |
| 7 | 0-detent snapper på dir/low/arc | ✅ | `video/p1-choreography.webm` + målt: dir 0.3→0, 0.4→0.4 (vindu 0.35/0.9/0.3; plane ingen detent) |
| 8 | Pure-sone synlig på LOW X-strip (jern) | ✅ | `p1-pure-zone.png` — grønn 18 % (--zone-pure), **+2..+15 fra motor-konstantene** (avvik fra mockens +2..+10, se avvik 1) |
| 9 | Rail-puls ved tauing-clamp | ✅ | `video/p1-choreography.webm` + `p1-rail-pulse.png` + målt sekvens: towed-puls −11→−13, rail-klasse + uiLow pinnet −15 ved dir ≥6 |
| 10 | 60 fps under kontinuerlig slider-drag, fysisk enhet | ⏳ GJENSTÅR | Device-evidens (Instruments-trace) — ØKT 3-pakken; kan ikke produseres lokalt |
| 11 | Verdier ruller mykt, ingen hopp ved fortegnsskifte | ✅ | `video/p1-choreography.webm` (LOW X +10→−10) + målt monoton rulling etter dt≥0-fiks; tabular-nums + min-bredder mot layout-hopp |
| 12 | Gamle scene-chips fjernet | ✅ | Screenshot-diff: `p1-*-low.png` vs dagens app — #lp3dLabel/#lpy3dLabel («y +1.6 cm», «N cm behind») og sd-lp x/y-header borte; celleverdier overtar |

## Kritiske avvik: ingen funnet lokalt

## Flaggede avvik (motoren/kontrakten vinner — ordre regel 1)

1. **Pure-sone jern +2..+15, ikke mockens +2..+10** — bundet til motorens
   `LP_AHEAD_MIN/MAX` (kontrakt §4, krav 8-flagg).
2. **Test 1-toleranse: ±0.25° over fullt domene** (valgt opsjon; ordrens
   ±0.1° er ubestålig for korrekt 3D-motor — kontrakt §4, dokumentert i test).
3. **Test 9: low=−8 ⇒ Fat**, ikke ordrens Thin (motorens xLP<0-regel,
   kontrakt §4).
4. **Engelske strenger** («Club», «N mm high/low») — repo-lov: hele UI-et er
   engelsk; mockens norske strenger («Kølle», «høy/lav») portert som grammatikk,
   ikke ordrett.
5. **Chips-høyde 33px** (mockens målte verdi) — ordren sier «31pt»; mocken er
   koreografispesifikasjonen og 33px matcher den visuelt.
6. **Ordren sier mocken har aria-label på slider — det stemmer ikke**
   (mock linje 226 har ingen). Produksjonen har linse-spesifikk aria-label +
   aria-valuetext + fokusérbare celler med aria-pressed, dvs. over minstenivået.
7. **Mock-duplikater ikke slettet** (geometry-mock/glass/window-mock/geo-canvas):
   alle har levende referanser (kontrakt §1) — føres som gjeld, ikke P1-jobb.

## Fikset underveis (ikke i ordren)

- **Fjær-glitch**: første rAF-timestamp kan ligge før `performance.now()` i
  `startSpring` → negativ dt → alpha < 0 → verdien sparket baklengs én frame.
  Clampet dt ≥ 0; verifisert monoton rulling etter fiks.

## Gates kjørt (ferske, mot kandidat-HEAD)

- `npm run verify:change -- --base origin/design/geometry-p1` → **PASS,
  nivå C, 8 kontroller** (diff-integrity, secret-scan, protected-identifiers,
  gate-contract, home-contract, chromium-spot, webkit-spot, native-copy).
- `node --test scripts/geometry-p1.test.mjs` → 10/10.
- `node --test scripts/home-night-ladder.test.mjs` → 4/4.
- Kontrast-revalidering av tokens mot faktisk sRGB-render: alle ≥7:1
  (per-token-annotasjoner i sa-p3.css; --launch målt 10.61:1 på Impact).

## Gjenstår (device-avhengig / ØKT 3)

- Krav 10: Instruments-trace på fysisk enhet (60 fps under drag).
- Fysisk haptikk-verifikasjon (P1 beholder eksisterende haptikk-grammatikk).
- WKWebView-røyk (Codemagic-build) — chromium/webkit-spot er nærmeste proxy.
