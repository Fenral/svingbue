# ARBEIDSORDRE — Geometry P1
**Kilde-spec:** `design/mocks/geometry.html` @ HEAD — den eneste gyldige mocken for denne skjermen. Mocken ER koreografispesifikasjonen. Åpne den i nettleser og interager med den FØR du skriver kode. Porter oppførselen — ikke reinterpret den. Finner du andre geometry-mock-varianter i repoet: slett dem og nevn det i PR.

## Absolutte regler
1. **Mock-formlene porteres ALDRI.** Formlene i mocken (`derive()`, konstanter 0.41/0.35/1.4/2.11) er placeholders. UI bindes til repoets eksisterende fysikkmotor, som allerede er TrackMan-konsistent. Finner du avvik mellom motor og mock-oppførsel: motoren vinner, flagg avviket i PR-beskrivelsen.
2. **Mocken er normativ for fargeverdier — men aldri som hex i komponentkode.** Hver mock-farge myntes som OKLCH-token med semantisk navn (attack, path, strike, plane, direction, varm-fokal, bakgrunn, osv.); komponenter refererer kun tokens. Har repoet allerede tokens for samme semantiske rolle: oppdater deres verdier til mock-verdiene i én egen commit («tokens: geometry-palett») — ikke omvendt. Varm-lys-regelen håndheves: nøyaktig ÉN oransje fokal per skjerm (kontakt-tick/glød), aldri dekorativ bruk av varm-fokal-token. Plane og loft skal aldri dele token — arkitekturpasset flagger hvis loft finnes eller er planlagt i repoet.
3. **Ringeffekten er controller-logikk, ikke motorendring.** Direction-slideren justerer lowpoint-input i input-laget: `ΔlowX = −k·cos(plane)·ΔD` der k hentes/deriveres fra motorens radius. Motorfysikken røres ikke.
4. **Driver-modus bygges bak feature-flagg** (`clubContext`, verdier `iron`/`driver`). All kølleavhengig logikk (pure-soner, teehøyde, verdiktregler) leser fra clubContext. UI-togglen for JERN/DRIVER er SKJULT i P1 — 3D-driver-asset mangler og leveres parallelt. Ingen hardkodede jern-antakelser utenfor clubContext.
5. Fjern de gamle scene-chipene («y +1.6 cm», «−17 cm behind») — deres jobb overtas av celleverdier og (i P2) tråder.

## P1-omfang
**Inn:** Layoutsoner, chips-rad, firedelt segmentkontroll, slider med tickstrip/soner/0-detent, linse-dimming, motorbinding, ringeffekt-controller, fjærglatting på viste verdier, JERN-verdiktlogikk.
**Ut (senere faser):** Tangentnål-oppgradering og tråder (P2), DTL-kamera (P2), haptikk/divot/whiff/svingpassering (P3), driver-asset, materialer og lyd (P4).

## Layoutsoner (fra mock)
Grid: mikropanel 27 % | scene 73 %. Scene = vertikal stack:
1. **Chips-rad** (flex:none): ATTACK (rosa), PATH (blå), STRIKE (gull). Dashed 1.5px ramme, høyde 31pt, tabular-nums, min-bredder så fortegnsskifte aldri gir layout-hopp.
2. **Canvas** (flex:1, min-height:0): 3D-scenen. INGENTING legges over denne sonen. Kamera-pill nede til høyre er eneste unntak (P2).
3. **Kontrollbar** (flex:none, safe-area-bunn): segmentkontroll → tickstrip → slider. Ingen hinttekst.

Mikropanel: eyebrow «Kølle» (serif, letterspaced) + kølletoggle (skjult i P1) + face-mikroskop + verdiktchip + verdiktsetning (maks 2 linjer).

## Segmentkontroll + slider
- Fire celler: PLANE 45–75° / DIRECTION ±15° (0.1) / LOW POINT X ±15 cm (0.5) / ARC HEIGHT ±5 cm (0.1). Label over verdi, full tekst, aldri trunkering.
- Aktiv celle: farget ramme + glød (violet/blå/rosa/gull). Sliderens accent følger.
- Tickstrip: major-ticks (5°/5°/5 cm/1 cm), 0-strek i kontrollfarge der min<0.
- 0-detent (snap-vindu): dir 0.35, low 0.9, arc 0.3. Plane har ingen detent.
- Pure-sone på LOW X-strip: grønn 18 % opasitet, jern +2..+10 (driver −12..−3 bak flagg).
- Slider-fylling i accent-farge fra min til thumb.

## Ringeffekt + rail
Ved direction-drag: lowpoint taues (formel over), clamp ±15. Tauing → LOW X-celle pulser rosa («towed»); clamp truffet → oransje («rail»)-puls. Celleverdien oppdateres live.

## Fjærglatting
Viste verdier og geometri jager målverdi (eksponentiell glatting, faktor ~0.18 per frame i mocken — tune mot 120 Hz). `prefers-reduced-motion` → direkte oppdatering.

## Unit-tester (rene funksjoner, ~10 asserts — IKKE UI-testautomatisering)
1. TrackMan-identitet: attack = (dir − path)·tan(plane) ±0.1° for 20 tilfeldige tilstander mot motor-output.
2. lowX=0 ⇒ attack=0 og path=dir for plane ∈ {45,60,75}.
3. Plane-invarians: lowX=0, plane 45→75 endrer ikke attack/path (±0.05°).
4. Plane-kobling: lowX=+8, brattere plan ⇒ |attack| øker og |path−dir| minker, monotont.
5. Tauing: ΔlowX/ΔD = −k·cos(plane) ±2 % for plane ∈ {45,60,75}.
6. Clamp: tauing stopper på ±15, rail-event emitteres.
7. Fat-predikat: bakkekontakt-x < ball-x ⇒ fat (arc<0-tilfeller, tre punkter).
8. Whiff-predikat: sålehøyde ved ball > balltopp ⇒ whiff, grensetilfelle testes.
9. Verdikt jern: low=+5/arc=0 ⇒ Pure; low=−8 ⇒ Thin; whiff overstyrer alt.
10. Detent-snap: verdier innenfor vindu → eksakt 0.

## Binære evidenskrav (P1-gate — ALLE må bestå, ett kritisk avvik = NO-GO)
| # | Krav | Verifikasjon |
|---|------|--------------|
| 1 | Alle soner synlige uten klipping, iPhone 13 mini + Pro Max landskap | 2 screenshots |
| 2 | Ball + kontaktpunkt aldri okkludert i noen linse | 4 screenshots (én per linse) |
| 3 | Ingen teksttrunkering ved maksverdier (−15/+15, «12 mm høy») | screenshot |
| 4 | Chip-verdier = motor-output eksakt (ingen UI-matte) | kodereferanse + test 1 |
| 5 | Testsuite over: 10/10 grønn | CI-output |
| 6 | Linse-dimming: uberørte chips 25 %, berørte 100 % | 4 screenshots |
| 7 | 0-detent snapper på dir/low/arc | skjermopptak |
| 8 | Pure-sone synlig på LOW X-strip (jern) | screenshot |
| 9 | Rail-puls ved tauing-clamp | skjermopptak |
| 10 | 60 fps under kontinuerlig slider-drag, fysisk enhet | Instruments-trace |
| 11 | Verdier ruller mykt, ingen hopp ved fortegnsskifte | skjermopptak |
| 12 | Gamle scene-chips fjernet | screenshot-diff mot dagens app |

## Leveranse per PR (dommer får KUN dette, fersk kontekst, én pass)
Evidenssjekkliste (12 punkter m/vedlegg) → kritiske defekter → tier (NO-GO / SHIPPBAR / STUDIO-GRADE) → avledet score → funn etter alvorlighet → tiltak. Skjermopptak maks 60 sek som viser: linsebytte ×4, direction-drag med tauing til rail, detent-snap, fortegnsskifte.

## Driver-asset-kontrakt (for parallelt spor — ikke P1-arbeid)
GLB, generisk 460cc uten varemerker, 10–30k tris, PBR metallic-roughness, samme skala/pivot/materialkonvensjon som eksisterende jern, plasseres på avtalt sti med jernet. Når asset lander: fjern flagg-skjuling av kølletoggle, aktiver driver-soner + tee — ingen annen kode skal måtte endres.
