# SYSTEMKONTRAKT · GEOMETRY

Skrevet av arkitekturpass (ØKT 1, 2026-07-17) for `design/orders/geometry-P1.md`.
Kilde-spec: `design/mocks/geometry.html` @ HEAD.
Innhold: kun verifiserbar systemvirkelighet — motor-API, state-modell, filstier,
tokens, målte fakta. Scope og krav står i ordren.

---

## 1 · FILSTIER (verifisert)

| Rolle | Sti | Fakta |
|---|---|---|
| Shippet skjerm | `geometry.html` (repo-rot) | I `copy-web`-allowlisten (`scripts/copy-web.mjs:35`), kopieres til `www/`, lenket fra `index.html:138`. **Ikke en mock. Aldri slettekandidat.** |
| Fysikkmotor | `swing-parameters-and-impact.js` | ESM, rene funksjoner, ingen deps. Importeres av `geometry.html:604` og hele `geo3d/`. Port av `strikearc-3.0/tmp/swing-arc-engine.ts`. |
| 3D-scene | `geo3d/` (12 moduler) | I `copy-web` `ALLOWED_DIRS`. `arc.js`, `club.js`, `lowpoint.js`, `plane.js`, `groundcontact.js`, `facezoom.js`, `delivery.js`, `fx.js`, `scene.js`, `timeline.js`, `ghosts.js`, `insetview.js`. |
| Kilde-spec | `design/mocks/geometry.html` | Mockens `<title>` sier «Geometry v8» — gjenglemt versjonsnummer i selve mocken, ikke feil fil. Filnavnet er versjonsløst per konvensjon. |
| Tokens | `sa-p3.css` | SYS-11 «ONE HUE · ONE MEANING»: `--q-*`-aliaser per fysisk størrelse. Ingen OKLCH i repoet i dag — alt er hex med målt kontrast. |
| Mock-duplikater | `geometry-mock.html`, `geometry-glass.html`, `geometry-window-mock.html`, `geo-canvas-mock.html` | **Ikke slettet**: alle fire har levende referanser (bl.a. `geo3d/plane.js`, `geo3d/scene.js`, `config/flightglass-surfaces.json`, `tools/appstore-shots/shoot.mjs`, `index-glass.html`). Føres som gjeld i PR. |

Testkonvensjon: `node --test`, filer i `scripts/*.test.mjs`, kjøres via
`npm run test:contracts`. Endringsgate: `npm run verify:change`.

---

## 2 · MOTOR-API (flaten ØKT 2 binder mot)

Alle fra `swing-parameters-and-impact.js`. `GeometryState =
{ view, radius, planeAngle, swingDirection, lowPoint:{x,y,z} }` — meter og
grader, Z-opp, +X = target line.

| Eksport | Semantikk |
|---|---|
| `deriveImpact(state)` | → `{ attackAngle, clubPath }` i grader. Ekte 3D-tangentprojeksjon — IKKE småvinkelformelen i mocken. |
| `effectiveLpx(state)` | → effektivt lavpunkt-x i meter: `lowPoint.x − swingDirection · R·cos(plane)·π/180`. **Retning→lavpunkt-koblingen bor HER, inne i motoren.** |
| `clubBallContact(state)` | → `{ clubZ, offset, offsetRatio, theta }`. |
| `strikeQuality(state)` | → `{ band, color, textColor, tip, pct, barPos, … }`. Band: Pure/Thin/Fat/Duff/Whiff. Verdiktlogikken bor her — UI regner aldri egne verdikter. |
| `thetaAtImpact`, `arcPosition`, `tangentAt`, `lpWorld`, `shaftPivot`, `planeBasis`, `buildPlanePolygon` | Geometri for 3D-scenen (brukes i `geo3d/`). |
| `RADIUS` (1.20), `BALL_RADIUS_M` (0.0213), `PLANE_DEFAULT` (55), `clamp`, `deg2rad`, `rad2deg` | Konstanter/hjelpere. |

**Ikke eksportert i dag:** `LP_AHEAD_MIN` (0.02), `LP_AHEAD_MAX` (0.15),
`LP_IDEAL` (0.105) — modul-private (linje 187–189). Pure-sonen på tickstrip
trenger dem. Eneste tillatte motor-diff i P1: `export` foran disse tre
konstantene. Null endring i fysikk-output; ingen regresjonstest kreves utover
at eksisterende suite forblir grønn.

---

## 3 · STATE-MODELL OG KONTROLLPLAN (arkitekturbeslutning)

### 3.1 Beslutning: UI-ens «LOW POINT X» ≡ `effectiveLpx`

Målt fakta som tvinger beslutningen: motoren tauer allerede lavpunktet med
retning (§2, `effectiveLpx`). Målt rate: −1.481 / −1.047 / −0.542 cm per grad
ved plane 45/60/75 — identisk (5 desimaler) med ordrens formel
`ΔlowX = −k·cos(plane)·ΔD`, og 0.8 % unna mockens `2.11·cos(plane)`.
Implementeres ordrens regel 3 bokstavelig som *ekstra* controller-tauing på
`state.lowPoint.x`, anvendes koblingen dobbelt og TrackMan-konsistensen ryker.

Derfor:

- **Lagret motorinput:** `state.lowPoint.x` (golferens stance — står i ro
  under direction-drag).
- **Vist/kontrollert «LOW POINT X»:** `uiLow = effectiveLpx(state)`, i cm.
- **LOW X-slider skriver:** `state.lowPoint.x = uiLow/100 + swingDirection ·
  R·cos(plane)·π/180` (invers av `effectiveLpx`).
- **Direction-drag:** `state.lowPoint.x` holdes — `uiLow` taues da av motoren
  selv. Cellen oppdateres live → «towed»-puls. Ingen tauings-formel i
  controlleren; controlleren *reflekterer* motorens kobling.
- **Rail (clamp):** `uiLow` clampes til ±15 cm i controlleren. Treffes
  grensen under direction-drag, reberegnes `state.lowPoint.x` så
  `effectiveLpx` står på ±0.15, og «rail»-puls emitteres. Motoren røres ikke.
- **Plane-drag:** samme mekanikk — `effectiveLpx` avhenger av plane, så
  `uiLow` kan taues også her når `swingDirection ≠ 0`. Samme towed/rail-regler.

Målt konsekvens som validerer valget: med `uiLow ≡ effectiveLpx` holder
ordrens test 2 og 3 **eksakt** (uiLow=0 ⇒ θ=0 ⇒ attack=0, path=dir, for alle
plane og alle dir). Med `uiLow ≡ state.lowPoint.x` bryter begge (målt: dir=15°,
lowPoint.x=0 gir attack 7.52° ved plane 45 og 3.75° ved plane 75).

### 3.2 Øvrig state

```
S = {
  plane:      45..75        // grader, step som i mock
  dir:        -15..+15      // grader, step 0.1
  uiLow:      -15..+15      // cm — VIST verdi, se §3.1
  arc:        -5..+5        // cm — skrives til state.lowPoint.z (m)
  lens:       'plane'|'dir'|'low'|'arc'
  clubContext:'iron'        // P1: alltid 'iron'; 'driver' bak flagg, se §6
}
```

Avledede verdier (chips ATTACK/PATH/STRIKE, verdikt) leses KUN fra
`deriveImpact`/`strikeQuality` — aldri UI-matte. Fjærglatting (§5) ligger
mellom målverdi og visning, aldri mellom UI og motor-input.

---

## 4 · MÅLTE FAKTA MOT EVIDENSKRAVENE (flagg — ikke fikset)

Probe kjørt 2026-07-17 mot `swing-parameters-and-impact.js` @ `a01aded`
(20 tilfeldige tilstander + grid over plane {45,60,75} × dir {0,5,15}).

| Krav/test | Målt utfall | Flagg |
|---|---|---|
| Test 1: `attack = (dir−path)·tan(plane)` ±0.1° | **Bryter**: maks avvik 0.19° (ved dir≈15°, lowX≈−11 cm). Identiteten er mockens *definisjon* (`derive()` i mocken) men kun småvinkel-tilnærming i motorens 3D-projeksjon. | Toleransen ±0.1° kan ikke bestås av korrekt motor over hele instrumentområdet. Ordrens regel 1: motoren vinner. ØKT 2 skriver testen med toleranse ±0.25° ELLER begrenset domene (dir ∈ ±10°, low ∈ ±10 cm — der maks målt avvik < 0.1°). Valget dokumenteres i test-kommentar. |
| Test 2/3: lowX=0 ⇒ attack=0 / plane-invarians | Holder **kun** med lowX tolket som `effectiveLpx` (§3.1). Med rå `lowPoint.x`: bryter ved dir≠0 (målt 3.77° attack-drift 45→75 ved dir=15). | Løst av §3.1 — testene skrives mot `uiLow`-semantikken. |
| Test 5: tauing ±2 % | **Består** eksakt (avvik 0.0 %). | — |
| Test 8: whiff «sålehøyde > balltopp» | Motorens whiff-terskel er `clubZ > 1.4·BALL_RADIUS` (`strikeQuality`, linje 211–212) — IKKE balltopp (2.0·R). Sonen 1.4R–2.0R er Thin/bladed i motoren. | Testen skrives mot motorens 1.4R-terskel. |
| Test 9: `low=−8 ⇒ Thin` | **Bryter**: motoren gir **Fat** (h≈0.10R ligger i Pure-høydebåndet, men xLP<0 ⇒ «Fat — ground-first tendency», linje 208). `low=+5/arc=0 ⇒ Pure` består. Whiff-overstyring består. | Forventningen i testen korrigeres til Fat. Motoren vinner. |
| Krav 8: pure-sone jern «+2..+10» | Motorens Pure-vindu er `LP_AHEAD_MIN..MAX` = **+2..+15 cm** (linje 187–188). Mock/ordre sier +2..+10. | Sonen på tickstrip bindes til motor-konstantene (eksportert per §2) — vises altså +2..+15. Avvik mot mock nevnes i PR. |
| Krav 4: chips = motor-output | Ikke falsifiserbart mot mocken (mocken kjører placeholder-formler). Falsifiserbart mot app + test 1. | Verifikasjon = kodereferanse (chips leser `deriveImpact`) + testsuiten. |
| Krav 10: 60 fps Instruments | Ikke falsifiserbart mot mocken — krever fysisk enhet. | Står som device-evidens i ØKT 3-pakken. |
| Krav 1,2,3,6,7,9,11,12 | Falsifiserbare som skrevet (screenshots/opptak/diff). | — |

Ingen motor-endringer gjort. Ett unntak bestilt (konstant-eksport, §2).

---

## 5 · FJÆRGLATTING (verifisert mock-oppførsel → tidsbasert)

Mocken glatter med faktor ~0.18 per frame ved 60 Hz. Frame-bundet faktor gir
dobbel hastighet ved 120 Hz. ØKT 2 implementerer tidsbasert:
`vist += (mål − vist) · (1 − exp(−dt/τ))` med `τ ≈ 84 ms`
(= −16.67 ms / ln(1−0.18); samme respons som mocken ved 60 Hz, korrekt ved
120 Hz). `prefers-reduced-motion` ⇒ `vist = mål` direkte (mocken gjør det
samme, verifisert i dens `@media`-blokk).

---

## 6 · `clubContext`-FLAGG (P1: skjult)

- Én modul-konstant/state-felt `clubContext: 'iron' | 'driver'`, default `'iron'`.
- All kølleavhengig logikk (pure-sone-grenser, teehøyde, verdiktregler) leser
  fra ett oppslagsobjekt indeksert på `clubContext` — ingen `if (iron)` spredd
  i komponenter.
- JERN/DRIVER-togglen i mikropanelet rendres ikke i P1 (asset mangler).
  Driver-verdier (`−12..−3` pure-sone, tee) ligger klare i oppslaget.
- Driver-asset-kontrakt: se ordren §«Driver-asset-kontrakt». Når asset lander
  skal KUN flagg-skjulingen fjernes.

---

## 7 · TOKENS (målt nå-tilstand + myntekart)

Repoet: `sa-p3.css`, SYS-11-lov «én hue = én mening», semantiske `--q-*`-aliaser.
Ingen OKLCH i dag. Mock-palett → repo-roller:

| Mock | Verdi | Repo-rolle i dag | Handling ØKT 2 («tokens: geometry-palett», egen commit) |
|---|---|---|---|
| `--pink` (attack) | `#f470b8` | `--attack: #F472B6` | Oppdater verdi til mock, myntet som `oklch()`. Nesten identisk allerede. |
| `--blue` (path) | `#5bc8f5` | `--path: #6FC6FF` | Oppdater verdi til mock (OKLCH). |
| `--violet` (plane) | `#9c8df5` | `--plane: #93A4F2` | Oppdater verdi til mock (OKLCH). |
| `--gold` (strike) | `#e3b05c` | `--launch: #E3C468` (hue-kollisjon, avgjort — se flagg 1) | Strike-token myntes med mock-gullet (OKLCH). `--launch` re-tunes til målbart annen tone i EGEN commit med kontrast-revalidering på Impact-skjermen. |
| `--orange` (varm-fokal) | `#ff8a4c` | Ingen | Mynt ny token (f.eks. `--focal-warm`). Håndhevelse: nøyaktig ÉN forekomst per skjerm (kontakt-tick/glød), aldri dekorativ. |
| `--green` (pure-sone) | `#3fd68c` | `#22C55E`/`#4ADE80` finnes i motorens verdikt-farger | Mynt UI-token for sonen (18 % opasitet på strip); motorens interne verdikt-hex røres ikke. |
| `--bg`, `--ink`, `--dim`, `--line` | div. | `--scene-bg`, `--plate-solid` m.fl. | Gjenbruk eksisterende surface-tokens der rollen matcher; mynt kun det som mangler. |

**Flagg 1 — gold-kollisjon (AVGJORT, eier 2026-07-17):** Mockens STRIKE-gull
`#e3b05c` er nesten samme hue som repoets `--launch: #E3C468` (SYS-11 binder
gull til launch angle). Beslutning: **strike tar mock-gullet; `--launch`
re-tunes** til en målbart annen tone. Launch-re-tuningen gjøres i egen commit
(rører Impact-skjermen) med kontrast-revalidering mot faktisk render, og
SYS-11-tabellen i `sa-p3.css` oppdateres tilsvarende.

**Flagg 2 — loft (bestilt av ordren):** `--loft: #B9A0FF` FINNES
(`sa-p3.css:80`). Separasjonen plane/loft er allerede håndhevet:
`--plane` ble myntet nettopp fordi plane «was stealing --loft»
(`sa-p3.css:121`). Kravet «plane og loft deler aldri token» er oppfylt i dag;
ØKT 2 må ikke reintrodusere deling.

**Flagg 3 — OKLCH-kontrast:** Repo-tokens har målte kontrast-annotasjoner
(≥4.5:1 / ≥7:1). Etter OKLCH-mynting/verdiendring skal kontrast re-valideres
mot faktisk sRGB-klippet render — ikke antas fra gamle annotasjoner.

Komponenter refererer KUN tokens (via `--q-*`-alias der rollen finnes) —
aldri hex.

---

## 8 · GAMLE SCENE-CHIPS (krav 12 — lokasjoner verifisert)

Skal fjernes i P1 (jobben overtas av celleverdier):

- `geometry.html:537` — `#sdLpY`-chip («y +1.6 cm»-mønsteret).
- `geometry.html:912` — `cmText` («N cm ahead / N cm behind»-etiketten)
  og tilhørende visningslogikk rundt linje 74/333/911.

Screenshot-diff mot dagens app er evidensen.

---

## 9 · ESKALERINGSFLATER FOR ØKT 2

Stopp og rapporter (ikke improviser) hvis noe av dette viser seg nødvendig:

1. Endring i motor-output (annet enn konstant-eksporten i §2).
2. Avvik fra §3.1-kontrollplanen (f.eks. dobbel tauing «for å matche mocken»).
3. Ny toleranse/domene i test 1 utover de to opsjonene i §4.
4. Avvik fra gold/strike-beslutningen i flagg 1 (avgjort av eier 2026-07-17).
5. Enhver ny avhengighet.
