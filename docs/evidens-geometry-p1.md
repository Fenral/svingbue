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
| 9 | Rail-puls ved tauing-clamp | ✅ | `video/p1-choreography.webm` + `p1-rail-pulse.png` (re-tatt uten onboarding-overlay: dir +7.8, LOW pinnet −15, rail-puls) + målt: towed-puls under kobling, rail-klasse + uiLow pinnet −15 ved dir ≥5 |
| 10 | 60 fps under kontinuerlig slider-drag, fysisk enhet | ⏳ GJENSTÅR | Device-evidens (Instruments-trace) — ØKT 3-pakken; kan ikke produseres lokalt |
| 11 | Verdier ruller mykt, ingen hopp ved fortegnsskifte | ✅ | `video/p1-choreography.webm` (full amplitude LOW X +10→−10 i sluttsegmentet) + målt monoton rulling etter dt≥0-fiks (90 rAF-samples, 0 baklengs-steg); tabular-nums + min-bredder mot layout-hopp |
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

## Re-tatt etter ØKT 3-dom (2026-07-17)

- `video/p1-choreography.webm` re-tatt: 36 s (ordre-krav ≤60 s), uten
  onboarding-overlay, headless Edge 932×430. Viser i rekkefølge: linsebytte ×4
  (med synlig chip-dimming), LOW-stance −10 → direction-drag med tauing til
  rail (pinnet −15), detent-snap gjennom 0 på dir, og full-amplitude
  fortegnsskifte LOW X +10→−10.
- `p1-rail-pulse.png` re-tatt uten coach-mark-overlay (dommens funn).
- ØKT 3-dommen (12-kravs sjekkliste) gjaldt kandidat `34ff169`; disse to
  vedleggene er de eneste endringene etter dommen.

## Desktop-proxy for krav 10 (2026-07-17 — IKKE device-evidens)

Målt i headless Edge på Intel iGPU (Meteor Lake, D3D11), produkt-viewport
932×430, canvas 932×430@1x, rAF-intervaller over 5 s:

- **Idle (swing-loop):** 16.7 ms snitt / 16.9 ms p95 → **59.7 fps**, 0.7 %
  frames > 20 ms. Loopen holder 60 fps.
- **Kontinuerlig drag (syntetisk 60 Hz input, LOW-linse):** 33.2 ms snitt /
  66.7 ms p95 → **~30 fps**, 65.6 % frames > 20 ms.
- Input-håndteringen (controller + motor + DOM-readout) koster **0.18 ms**
  per event — differansen ligger i GL-arbeidet per dirty frame (hovedscene +
  mikroskop-inset = to render-pass).
- DPR er cappet på 2 (`geo3d/scene.js:307`), dirty-flag-loop.

Tolkning: proxyen verken består eller stryker krav 10 (A-serie-GPU ≫ denne
iGPU-en), men flagger at drag-pathen er den tunge. Instruments-fokus:
GPU-tid per frame under drag, spesielt inset-passet.

## Krav 10 — device-protokoll (in-app fps-måler, valgt av eier 2026-07-17)

Dokumentert avvik fra ordrens «Instruments-trace»: eieren har ingen Mac;
intensjonen (60 fps under kontinuerlig drag, fysisk enhet) bevises med en
rAF-basert måler i appen. Måleren viser det brukeren faktisk opplever
(main-thread frame-kadens); GPU/CPU-nedbryting (Instruments) hentes kun
hvis målingen stryker.

Måler i geometry.html (av som standard, null fotavtrykk for brukere):
- Aktivering på device: **7 raske trykk på chips-raden** (ATTACK/PATH/STRIKE)
  → haptisk kvittering + overlay oppe til venstre. Persisterer
  (`localStorage sa_fps`). Samme 7 trykk slår av. Web: `?fps=1`.
- Prosedyre: aktiver → velg en linse → dra slideren kontinuerlig frem og
  tilbake i ~10 s → slipp. Overlayet fryser `DRAG Nf: X fps  p95 Y ms
  >16.7ms Z%` — ta screenshot. Gjenta gjerne per linse (low + dir er tyngst:
  tauing + inset).
- Bestått-kriterium (krav 10): drag-snitt ≥ ~58 fps og p95 ≤ 20 ms på
  målenheten. Referanse desktop-iGPU: 27–30 fps (se proxy-seksjonen).

## Gjenstår (device-avhengig / ØKT 3)

- Krav 10: Instruments-trace på fysisk enhet (60 fps under drag).
- Fysisk haptikk-verifikasjon (P1 beholder eksisterende haptikk-grammatikk).
- WKWebView-røyk (Codemagic-build) — chromium/webkit-spot er nærmeste proxy.
  Full endringsgate re-kjørt 2026-07-17 mot base origin/main på `517d7ef`:
  **PASS, nivå C, 8 kontroller** (inkl. chromium-spot + webkit-spot).
