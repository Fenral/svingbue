# Full Flightglass-revisjon — 03 Designinventar og Ultraviolet Ember-kritikk

**Metode:** Uavhengig kartleggingsagent leste `sa-p3.css` komplett + alle fem shippede sider + CSS-familiene; fil:linje-referanser gjennomgående. Tre sannhetsnivåer holdes adskilt: (1) CSS-sannhet, (2) dokumentert sannhet, (3) mock-arv.

## 1. CSS-sannheten (`sa-p3.css`, 496 linjer)

Tokens: identitet (`--bg #07060C`, `--ink #F5F2FF`, violet-tonet grårampe), ember (`#FF8A4D` + soft/line/strong), violet (`#9D8BFF`), reward/status (celebrate `#FF5CE1`, good, warn `#FFD056` status-only, `--gold #D9B36A` XP), **13+ parameterhues** (delvis OKLCH: path ≈#5BC8F5, attack **rosa** ≈#F470B8, launch citron, plane, strike, depth, focal-warm, zone-pure, ghost, measure) med `--q-*`-aliaser, dusk-scenesett (`--dusk-*`, impact-eid), radius-tiers 12/16/20/999, `--ease` + `--ease-spring`, tre selvhostede fonter (Inter/Space Grotesk/IBM Plex Mono). **Ingen spacing-tokenskala finnes** — 4/8-grid er kun prosa i docs.

SYS-lovene 01–15 bor delvis i CSS (01, 02, 04, 07, 08, 11, 12, 13, 14, 15 + implementasjoner av 03/09), delvis **kun i `docs/craft-critique-A.md`** (03, 05, 06, 09, 10-lovtekst) — lovverket har to hjem. Depth/light (`body.sa-depth`): gradientplater, violet skylight + **teal gulvglød** (eneste teal i P3), 2.8 % grain, bloom-klasser som **ingen shippet side faktisk bruker** (grep=0).

## 2. Dokumentasjonen er stale (CSS vinner per doc-ens egen regel)

`docs/DESIGN-SYSTEM.md` avviker fra CSS på minst 6 punkter: path-, attack- (mint→rosa, eierstyrt 2026-07-11), launch- og plane-verdier; XP-gull-splitten (`--warn` status-only vs `--gold #D9B36A`); og mangler `--strike/--focal-warm/--zone-pure/--measure/--dusk-*/--ease-spring`. Motsatt: doc-ens «white-hot tip #FFF3E8» finnes ikke som token, og «Fraunces på front page» er feil — index kjører Space Grotesk; Fraunces lever i shippet kode **kun** på geometry.html.

## 3. Per-side-realiteten (hvem følger systemet)

| Side | sa-p3? | Fonter | Avvik |
|---|---|---|---|
| index.html | ✓ | trioen | token-ren |
| impact.html | ✓ (+sa.css) | trioen | token-ren (K4-klausul holder) |
| geometry.html | **NEI** — lokalt token-speil | **Fraunces + Plex Mono + system-sans** (ingen Inter/SG) | egne brass-hexer uten token (#c9a878, #9a7b52, rgba(138,90,43,.55)), freelance hairline-alphas |
| impact-studio.html | **NEI** — lokal speiling | **KUN systemfonter** (SYS-01-brudd) | freehand varm-kanvasfamilie (#ff9a3d, #e8b45a, #fdf3e0), #eec07a hardkodet forbi `--measure` |
| academy.html | ✓ (+17 egne css) | trioen | hardkodede param-hexer med **gamle** doc-verdier (#6FC6FF, #93A4F2) — samme fysiske kvantitet har to render-hues på tvers av flater |

Delt infrastruktur: `sa.css` bærer sovende **teal-æra-fallbacks** (fyrer hvis token mangler); `sa-glass.css` er ren mock-arv (teal #22E3D6, fremmede fonter). GSAP shippes kun på geometry (kamerarigg, med GSAP-easings, ikke `--ease`); haptics kalles av geometry/impact-studio/academy men **ikke** index/impact (stale headerkommentar). Reduced motion: dekket på alle fem sider. `.sa-strip`-skallkontrakten («applied to every destination») etterleves av 1 av 5 sider.

## 4. Bilder/assets i shippet bruk

index: nattfoto `range-night-3d-33.png` + lockup-SVG-er. impact: **ingen bilder** — hele dusk-scenen er CSS/canvas. geometry: alt three.js/canvas. impact-studio: 8 PNG-er. academy: mark-SVG + backspin-foto + voice-audio; diagrammer inline SVG. Resten av `assets/range-night-*` m.m. er mock-/dok-arv.

## 5. Ultraviolet Ember-kritikken

Faktagrunnlag (agent-verifisert, fil:linje i rådata): ~16 hue-familier i aktiv shippet bruk; 224 hex-literals; gull-familien alene har 8+ render-hexer mot 4 tokens; violet bærer struktur + dekor + tekstrampe + (i Academy) datafarge samtidig; grain/blur/bloom-laget er halvveis utrullet (2 av 5 sider, bloom ubrukt).

**Hva hjelper (sannhetsbærende — kandidat for videreføring i enhver retning):**
- Ett varmt sannhetssignal med budsjett (SYS-08) er en genuint god idé: ember-scarcity gjør live data lesbar på ett blikk.
- Mono/tabulær datatypografi, U+2212, enhetsgrammatikk, `--q-*`-aliastanken (én hue = én mening) — instrumentkjernen.
- Nattgrunn gir OLED-svart, lave lysnivåer innendørs (simulator-kontekst) og lar en lysende trace være fysisk plausibel.
- Radius-/plate-tiers og fokusringen er disiplinerte og testbare.

**Hva er bare stemning (koster uten å bære sannhet):**
- Violet-vasken: at hele grårampen, chrome, dekor OG deler av dataspråket deler én identitetshue gjør at *struktur og stemning ikke kan skilles* — lov 5s «violet = struktur/tilstand» er i praksis «violet = alt som ikke er ember».
- Depth-laget (skylight, teal-glød, grain, gradientplater) er atmosfære-teater: halvveis utrullet, med bloom-klasser ingen bruker, og Academy-leksjonene måtte aktivt **overstyre** det tilbake til solide flater for å beholde instrumentroen — systemets egen kjerne avviste laget.
- Dusk-himmelen og natteland-fotoet er scenografi som konkurrerer med tracen om varme og lys.

**Hva drar mot sci-fi-klisjé:**
- Kombinasjonen near-black + violet + neon-aktig glød + grain er kategoriklisjeen (cyberpunk-dashboard/gamer-HUD-familien); den signaliserer «futuristisk verktøy» fremfor «presist instrument», og den eldes som trend, ikke som norm.
- Fraunces-gravyr-stemmen på én flate + brass-hexer uten tokens er en tredje, konkurrerende identitet (observatorium-LARP) som aldri ble systematisert.

**Strukturell dom [S]:** P3s *lover* er sterkere enn P3s *palett*. Systemet har allerede bevist at det må slåss mot sin egen stemning (Academy-overstyringen, halvutrullet depth, tre skriftstemmer, to render-hues for samme kvantitet). Revisjonens jobb er ikke å lappe dokumentasjonen, men å la tre retninger konkurrere om å uttrykke lovene renere — det er nøyaktig fase C.

## 6. Konsekvenser inn i fase C/D (uansett retningsvalg)

1. **Token-konsolidering er obligatorisk:** parameterhues må ned i antall og få ÉN render-verdi per kvantitet på tvers av flater; gull-familien reduseres til status + XP + maks én instrument-etsestemme.
2. **Lovverket samles i ett hjem** (CSS-lovblokk + generert doc, aldri to frie tekster).
3. **Alle fem sider inn under ett tokensett** — geometry/impact-studios lokale speil er migreringsgjeld uansett retning.
4. **Depth/glow/grain-laget avvikles eller gjøres lov** — dagens halvtilstand er det verste av begge.
5. Fraunces avgjøres: enten systematiseres serif-stemmen (én retning kan eie den) eller fjernes.
6. Sovende teal-fallbacks i sa.css renskes ved migrering.
