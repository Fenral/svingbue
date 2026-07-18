# SYSTEMKONTRAKT · IMPACT-KAMERA

Verifiserbar systemvirkelighet for Impact-skjermen: motor-API-flater, state-modell,
filstier, tokens, og de fire beslutningene fra Økt A.

Denne filen beskriver **systemet**, ikke arbeidet. Fase-scope, evidenskrav,
annotasjonsregler og dommerprotokoll står i `design/orders/impact-kamera.md` og
gjentas ikke her. Ved konflikt: ordren eier produktatferd, denne filen eier
systemflater.

Skrevet: 2026-07-17 (Økt A). Alle filstier er relative til repo-rot.

---

## 1 · KARTLAGT SYSTEMVIRKELIGHET

### 1.1 Hva Impact-skjermen er i dag

`impact.html` (4192 linjer) er en selvstendig statisk side — ingen bundler, ingen
rammeverk. All logikk ligger i én `<script type="module">` fra linje 1153.

Den har allerede **tre separate visninger** av samme skudd, som tre uavhengige SVG-er:

| Element | viewBox | Linje | Rolle i dag |
|---|---|---|---|
| `#svgDir` | `0 0 400 360` | 778 | Retningsplan sett ovenfra (≈ TOP) |
| `#svgHt` | `0 0 400 360` | 887 | Høydeplan sett fra siden (≈ SIDE) |
| `#fScene` | `0 0 960 540` (bredde settes dynamisk, linje 2839) | 1004 | Perspektivisk flight-hero (≈ FLIGHT) |

Ordrens «én scene, tre kamerastasjoner» er derfor en **sammenslåing av tre
eksisterende visninger**, ikke en ny skjerm. De tre SVG-ene er det kamerasystemet
erstatter.

**Status etter Økt B (2026-07-17):** sammenslåingen er utført. `impact.html` er
bygget om til én kamerastyrt canvas-scene (`#scene`, tegneløkke mot
`impact-camera.js`) med stasjonssegment (`#stseg`), scrub-gest, oppstartsreise
og carry-hero; de tre SVG-ene er fjernet. Som del av beslutning B1 (§9) ble
følgende samtidig og bevisst revet fra gammel `impact.html`: DUAL-LENS-layouten
(to alltid-synlige linser, gammel fil linje 116–119/745–746), Play-flight-
overlayet med GSAP-partikkel-koreografi og ambient lyd, og ghost-lab-legenden.
Kapasitetene består i ny form der ordren plasserer dem: ghost-sammenligning →
Pin-pill maks 3 (Økt C, ordre §2), komet-animasjonen → ordre §3 (Økt D),
stort-tall-heroen → CARRY per §6 (levert i Økt B). Hele den gamle filen ligger
som tidsstemplet kopi i `.sa-backups/`. Linjenumre i §1.1/§5.4/§6 refererer den
gamle filen og er historisk evidens.

### 1.2 Renderer-presedens i repoet

To mønstre eksisterer allerede:

- **SVG-DOM** — `impact.html` (alle tre visninger over).
- **Canvas + projiserte DOM-etiketter** — `geo3d/scene.js` (three.js,
  `PerspectiveCamera`, Z-up via `camera.up.set(0,0,1)`), med etiketter posisjonert
  av `geo3d/lowpoint.js#placeLabel` etter `camera.updateMatrixWorld(true)`
  (se kommentar `geo3d/scene.js:99`).

`geo3d/*` tilhører `geometry.html` (svinggeometri) og er **ikke** koblet til
`impact.html`. three.js ligger vendored i `vendor/three/`.

### 1.3 Kamera-matematikk som allerede finnes

`swing-parameters-and-impact.js` (241 linjer, rene funksjoner, ingen deps) eier
en komplett pinhole-kamerastack:

```
export const CAMS = { dtl: {pos, look, fov, xStretch:1.7}, face: {pos, look, fov} }
export function buildCameraFromCam(cam, vbox = VIEW)   // → {cam, fwd, right, upVec, focal, vbox}
export function buildCamera(view, vbox = VIEW)         // CAMS[view] → basis
export function lerpCam(a, b, t)                       // lerper pos/look/fov/xStretch
export function project(p, basis)                      // → {x,y} | null (bak kamera)
```

`focal = vbox.h / 2 / Math.tan(cam.fov / 2)`; `project` deler på `zCam` og
returnerer `null` når `zCam <= 0.01`.

Dette er **ekte kamerainterpolasjon** (pos/look/fov lerpes, så projiseres), ikke
lerping av projiserte punkter. Modulen er scene-spesifikk for svingen
(`RADIUS = 1.20`, `VIEW = {w:960,h:480}`) og har ingen ortografisk projeksjon.

### 1.4 Verdenskonvensjon (låst, arvet)

Fra `swing-parameters-and-impact.js:6` og `geo3d/scene.js:7`:

> Z-UP world: +X = target line, +Y = away from camera (face-on), +Z = up.

Dette er repoets eneste konvensjon og gjelder også flight-scenen:

| Akse | Betydning i flight-scenen |
|---|---|
| +X | nedslagsretning (mot target) |
| +Y | sideveis, + = høyre for RH-spiller |
| +Z | høyde |

**Mocken bruker en annen konvensjon** (Y-up, `z` = nedslagsretning, `x` =
sideveis). Ved port fra mocken: `mock.z → x`, `mock.x → y`, `mock.y → z`.
Mockens akser skal ikke lekke inn i produksjonskode.

### 1.5 Enheter

- Motoren regner i **yards** (avstander) og **mph** (fart) — se `impact-flight.js:103`.
- UI viser **meter**. Konverteringen finnes: `impact.html:1164` `const YD2M = 0.9144;`
  og `impact.html:1495` `function fmtMfromYd(yd){ return Math.round(yd*YD2M); }`.
- Ordrens tall er meter (`r 26 m`, `z≈228`, `side < −28 m`, `|curve| < 3 m`).

**Kontrakt:** verdensrommet i scenen er **meter**. Grensesnittet mot motoren
konverterer én gang, i selectoren (§3), aldri i render- eller annotasjonskode.

### 1.6 Tokens

Definert i `sa-p3.css` under `:root`. `www/sa-p3.css` er en **generert kopi** —
`scripts/copy-web.mjs` bygger hele `www/`. Rediger aldri `www/` for hånd.

Eksisterende semantiske tokens (`sa-p3.css`):

| Token | Verdi | Linje | Ordrens semantikk |
|---|---|---|---|
| `--face` | `#FF5C6B` | 77 | face rød ✔ |
| `--path` | `#6FC6FF` | 78 | path blå ✔ |
| `--attack` | `#F472B6` | 79 | attack rosa ✔ (eier-override 2026-07-11) |
| `--loft` | `#B9A0FF` | 80 | dyn loft fiolett ✔ |
| `--launch` | `#E3C468` | 100 | speed/launch varm-rav ✔ |
| `--gold` | `#D9B36A` | 136 | FLIGHT/output-gull ✔ |
| `--surface` | `#110D1C` | 51 | — |

Aliasene `--q-face`/`--q-path`/`--q-attack`/`--q-loft`/`--q-launch` (linje 123–127)
er den flaten `impact.html` faktisk konsumerer, via lokale `--c-*`-remaps på
`impact.html:25–26`.

**Hull:** ordrens måle-etikettfarge `#eec07a` finnes **ikke** i repoet (grep: 0 treff).
Den er nærme, men ikke lik, `--launch:#E3C468`.

**Kontrakt:** ett nytt token i `sa-p3.css`, i samme `:root`-blokk som de øvrige:

```css
--measure:#EEC07A;   /* måle-etiketter (annotasjonslaget) */
```

Med alias `--q-measure:var(--measure);` ved siden av de andre `--q-*`.
Måle-etiketter er en egen rolle enn `--launch` (parameterfarge) og skal ikke
gjenbruke den. Ingen andre nye fargeverdier. K4 (null hardkodede farger i nye
filer) gjelder alt under §5.

---

## 2 · MOTOR-API (flaten Økt E binder mot)

### 2.1 Modul

`impact-flight.js` — ren ESM, ingen deps, allerede importert av
`impact.html:1154`:

```js
import { solveFlight, clamp } from './impact-flight.js';
```

### 2.2 Signatur

```js
solveFlight({
  clubPath,     // ° , + = in-to-out (høyre)
  faceAngle,    // ° , + = åpen (høyre)
  attackAngle,  // ° , + = opp
  dynamicLoft,  // °
  clubSpeed,    // mph
  club          // valgfri nøkkel i CLUBS; default '7iron'
}) → Flight
```

Fortegn (RH-spiller, sett nedover banen): `+offline / +startDirection / +spinAxis`
= høyre.

### 2.3 De 12 outcome-verdiene finnes allerede

Ordrens 12 verdier mapper 1:1 mot felt `solveFlight` returnerer i dag. Ingen
motorutvidelse trengs:

| Ordrens navn | Felt | Enhet | Status i motoren |
|---|---|---|---|
| Launch dir | `startDirection` | ° | SOURCED (loft-avhengig face/path-blend) |
| Spin axis | `spinAxis` | ° | ESTIMATE (gain 1.5, klemt ±38) |
| Curve | `curve` | yd | ESTIMATE (kvadratisk i carry) |
| Side | `offline` | yd | ESTIMATE (startlinje + curve) |
| Launch ang | `launchAngle` | ° | SOURCED (0.62·loft + 0.25·attack) |
| Spin loft | `spinLoft` | ° | SOURCED (`dynamicLoft − attackAngle`) |
| Backspin | `backspin` | rpm | ESTIMATE (klemt 1500–9000) |
| Land ang | `landingAngle` | ° | ESTIMATE (klemt 32–60) |
| Smash | `smash` | — | ESTIMATE (== `smashEff`) |
| Ball speed | `ballSpeed` | mph | ESTIMATE |
| Carry | `carry` | yd | ESTIMATE (potenskurve, remodel fix F) |
| Total | `total` | yd | ESTIMATE (`carry + carry*rollFrac`) |

I tillegg returneres `shape` (kvalitativ etikett), `faceToPath`, samt
breakdown-konstanter (`startFaceW`, `launchLoftW`, `spinAxisGain`, `rollFrac`,
`landingApexTerm`, …) som eksisterende chip-forklaringer allerede bruker som
eneste sannhetskilde.

### 2.4 Banegeometri

```js
trajectorySamples(flight, n = 48) → [{ d, h, x }]
```

`d` = nedslagsfraksjon 0..1, `h` = høydefraksjon 0..1 (1 = apex), `x` =
sideveis fraksjon der `x(1) = 1` = full `offline`. Apex ligger på `d ≈ 0.52`.
Lateralprofilen respekterer den ekte start/curve-splitten
(`sf = 1 − curve/offline`), med `d²`-fallback når `|offline| ≈ 0`.

**Skalering til verdensmeter** (den eneste lovlige):

```
x_world = d * carry_m                    // nedslagsretning
y_world = pts.x * offline_m              // sideveis
z_world = h * apex_m                     // høyde
```

`trajectorySamples` er normalisert og **ESTIMATE** (parabolsk, ikke ekte
drag/lift-integrasjon). Den er tilstrekkelig for scenen; ingen ny fysikk skal
skrives for å erstatte den.

### 2.5 Motorens egne klemmer (eksisterende, dokumentert, ikke rør)

`solveFlight` klemmer allerede internt: `spinAxis` ±38°, `smashEff` [1.15, 1.42],
`backspin` [1500, 9000], `landingAngle` [32, 60], `offline` ≤ 55 % av carry
(`OFFLINE_CAP_FRAC`), `curve` ≤ 60 % av carry.

**Hard grense:** `CLAUDE.md` sier
> Do not change golf physics output without a failing regression test and
> explicit authorization.

`impact-flight.js` er derfor **skrivebeskyttet** for dette arbeidet. Alt nytt er
additivt og ligger utenfor filen.

---

## 3 · STATE-MODELL

### 3.1 Kilden

Ett objekt. Ingen avledet verdi lagres i det.

```js
const state = {
  // parametre — den eneste input-sannheten
  face: 2.0,        // ° , ±15
  path: 0.0,        // ° , ±15
  attack: 3.0,      // ° , ±15
  dynLoft: 24,      // ° , 0–50
  speed: 130,       // mph, 30–150

  // kamera
  station: 2,       // kontinuerlig skalar 0..2 (se §3.2)

  // UI
  pins: [],         // maks 3, eldste ut
  allMetrics: false,
  collapsed: false,
};
```

Defaults er ordrens (§2 i ordren) og gjentas her kun fordi de er state-initiell
verdi, ikke fordi de er design.

### 3.2 Stasjonsskalaren

**Låst:** `0 = FLIGHT`, `1 = SIDE`, `2 = TOP`.

Numereringen følger mockens (`design/mocks/impact-kamera.html:266–272`) og er den
eneste som oppfyller kravet om at TOP↔FLIGHT reiser **gjennom** sideplanet: SIDE
ligger da nødvendigvis mellom endepunktene på skalaren. `station` er kontinuerlig
og alltid gyldig mellom stasjoner — den er ikke en enum med en animasjon ved siden av.

Skjermens segmentrekkefølge (`TOP · SIDE │ FLIGHT`) er **visuell** og er bevisst
motsatt av skalarens retning. Ikke «rett opp» det ene mot det andre.

### 3.3 Selectoren — én verdi, ett sted

Alle avledede tall går gjennom **én** funksjon. Dette er §4-kravet i ordren
(«chip, annotasjon og stort tall skal aldri kunne divergere») uttrykt som
systemflate:

```js
// impact-outcome.js
export function selectOutcome(state) → Outcome
```

`Outcome` er frosset og inneholder:

- `raw` — `solveFlight(...)` uendret (yards/mph), for breakdown-forklaringer
  som allerede leser motorkonstanter.
- `m` — alle avstander konvertert til meter **én gang**: `carry`, `total`,
  `apex`, `curve`, `side`.
- `deg` — `launchDir`, `spinAxis`, `launchAng`, `spinLoft`, `landAng`.
- `misc` — `backspin` (rpm), `ballSpeed` (mph), `smash`.
- `path` — banegeometri i verdensmeter (§2.4), ferdig skalert.
- `physical` — se §4.

Ingen annen kode kaller `solveFlight` direkte, og ingen annen kode multipliserer
med `YD2M`. Rendering, chips, annotasjoner og hero leser samme `Outcome`.
`selectOutcome` er memoisert på de fem parametrene; `station` påvirker den ikke.

**Konsekvens:** `impact.html:1154` sitt direkteimport av `solveFlight` erstattes
av `selectOutcome`. `fmtMfromYd`/`YD2M` i `impact.html` avvikles når siste
konsument er flyttet.

### 3.4 Hva som IKKE er state

`station` er kamera. Kamera er ikke parameter. Rendering avleder rig fra
`station` (§5.1) og leser `Outcome` fra selectoren — de to møtes først i
tegneløkken. En parameterendring rører aldri kamera; en scrub rører aldri fysikk.
Dette er hele grunnen til at scrub kan holde 55 fps uten å re-solve.

---

## 4 · EKSTREMVERDI-POLICY (BESLUTTET)

**Valgt: (b) eksplisitt «utenfor fysisk område»-tilstand — smalt avgrenset.**

Inngangsverdier klemmes **aldri** utover sliderens eget område. Sliderne eier
±15° / 0–50° / 30–150 mph, og motoren får det brukeren stilte inn.

Motorens eksisterende interne klemmer (§2.5) står urørt og regnes som publisert
motoratferd, ikke som skjult klemming.

Én maskinsjekkbar invariant avgjør tilstanden:

```js
// impact-outcome.js
physical = {
  inDomain: outcome.raw.spinLoft > 0,
  reason: outcome.raw.spinLoft > 0 ? null : 'spin-loft'
}
```

**Hvorfor akkurat `spinLoft > 0`:** `spinLoft = dynamicLoft − attackAngle`
(`impact-flight.js:125`). Hjørnet dyn loft 0 / attack +15 gir spinLoft = −15°.
Motoren regner backspin som `Math.abs(spinLoft) * ballSpeed * spinK`
(`impact-flight.js:197`) — `abs()` gjør at negativ spin loft rapporteres som
**backspin** når fysikken gir **topspin**. Det er den eneste kombinasjonen der
motoren returnerer et tall med feil fortegnsbetydning, altså det eneste stedet
et stille clamp ville lære brukeren noe usant. Alle andre ekstremer
(f.eks. spinLoft 65° ved loft 50 / attack −15) er fysisk mulige flopp-skudd der
motorens 7-jerns-fit er ute av kalibreringsområdet — en unøyaktighet, ikke en løgn.

Feiltilstanden er derfor **ikke** «slideren er langt ute», men «modellen snur
fortegnet». Den er ett predikat, testbart uten skjønn.

Målgruppen er «den nysgjerrige som vil lære» — en slider som stille slutter å
gjøre noe leser som et ødelagt instrument, ikke som fysikk. Derfor synlig
tilstand, ikke stille clamp.

`physical.inDomain === false` gjelder avlesningen, ikke appen: `Outcome` leveres
komplett som vanlig. Hvordan tilstanden vises er UI-arbeid og står ikke her.

---

## 5 · KAMERATILNÆRMING (BESLUTTET)

**Valgt: ekte kamerarigg + projeksjonsblend. Ikke lerping av projiserte 2D-punkter.**

### 5.1 Hvorfor

Mocken lerper projiserte punkter — `design/mocks/impact-kamera.html:266–272`:

```js
function project(P){
  const s=state.station;
  if(s<=0.001)return projPersp(P);
  if(s>=1.999)return projTop(P);
  if(s<1){const a=projPersp(P),b=projSide(P),k=smooth(s);return{x:lerp(a.x,b.x,k),y:lerp(a.y,b.y,k)};}
  const a=projSide(P),b=projTop(P),k=smooth(s-1);return{x:lerp(a.x,b.x,k),y:lerp(a.y,b.y,k)};
}
```

Det er mockens throwaway-fysikk-ekvivalent for kamera: billig, og feil på tre måter
som betyr noe her.

1. **Det er ingen kamerareise.** To projeksjoner krysstoner. Ved `station = 0.5`
   finnes ingen kamera i verden som ser det bildet — punkter glir langs
   skjermrette linjer mellom to bilder. Ordren krever at TOP↔FLIGHT *reiser
   visuelt gjennom sideplanet*; en punktvis krysstoning passerer aldri gjennom
   noe, den blander bare to endepunkter.
2. **Dybde overlever ikke.** `projPersp` deler på z; en 2D-lerp fra den har ingen
   z igjen. Okklusjon, tegnerekkefølge, kometens fartsfølelse og
   ghost-separasjon i dybden finnes ikke underveis.
3. **Ingenting kan måles underveis.** Annotasjonslaget må vite hvor bakken er,
   hvor buens plan ligger, og hva som er perpendikulært på hva. En lerpet
   punktsky har ingen basis å spørre.

Presedensen i repoet er entydig ekte rigg-tween:

- `swing-parameters-and-impact.js:44` `lerpCam(a, b, t)` lerper **kameraet**
  (pos/look/fov/xStretch), og projiserer etterpå.
- `docs/showcase-spec.md:26`: «FACE/DTL buttons still work (**tween through the
  same rig** — they already do)», med fri orbit, azimut/elevasjon-klemmer og
  magnetisk pol-snap.

Ordren bekrefter mot DTL-specen: DTL-flaten er en ekte orbit rundt én rigg.
Kamerasystemet her er samme mønster, ny scene.

### 5.2 Hvorfor endepunktene må være ekte ortografiske

`docs/geometry-rethink.md:18` dokumenterer en kjent, dyrt lært feil:

> …projected through a perspective camera with `xStretch: 1.7` (DTL), so the
> on-screen angle between them is NOT the attack angle at any camera pose.
> It's an instrument whose needles were removed and whose dial is warped.

Ordrens konsept er «utfall måles opp i planet der de oppstår». En vinkelbue tegnet
i et perspektivbilde viser ikke vinkelen den påstår. TOP og SIDE **må** derfor være
sanne ortografiske projeksjoner i stasjonspunktet, ellers lyver annotasjonslaget
med samme feil som geometry-skjermen allerede er dokumentert på.

FLIGHT er perspektivisk — den er en avlesning av form, ikke av vinkel, og skal
kjennes romlig.

### 5.3 Flaten

Ny fil `impact-camera.js`. Rene funksjoner, ingen deps, samme eksportstil som
`swing-parameters-and-impact.js`. Den siste holdes **urørt** (den eies av
`geometry.html`; flight-scenen har annen skala og trenger ortho som svingscenen
ikke har).

```js
export const STATIONS = {
  flight: { pos, look, fov, orthoK: 0, xStretch, up },  // perspektiv, bak/over ballen
  side:   { pos, look, fov, orthoK: 1, xStretch, up },  // ortho, ser langs −Y (fra +Y-siden)
  top:    { pos, look, fov, orthoK: 1, xStretch, up },  // ortho, ser ned langs −Z
};

export function rigAt(station)                  // skalar 0..2 → {pos, look, fov, orthoK, xStretch, up}
export function buildBasis(rig, vbox)           // → {rig, fwd, right, upVec, focal, refDist, vbox}
export function project(p, basis)               // → {x, y, depth} | null
```

Riggen bærer to felt til (Økt B, se B2 i §9): `up` — skjerm-opp-referanse per
stasjon, blendet i `rigAt`, fordi TOPs kartorientering (nedslag opp, høyre mot
høyre) krever en kontinuerlig 90°-rull på SIDE→TOP-benet; og `xStretch` —
anisotrop skjerm-x-skala (samme knott `lerpCam` allerede lerper i svingriggen;
mockens SIDE/TOP-innramminger er bevisst anisotrope à la TrackMan; lengder måler
fortsatt sant per akse). Golf-semantikken låser speilingen: +Y (høyre for
RH-spiller) skal rendre mot skjerm-høyre i FLIGHT og TOP. Med Z-up og +X nedslag
følger det at basisen bygges `right = up × fwd` og at SIDE-kameraet står på
+Y-siden og ser langs −Y — ellers rendrer en fade som drar mot venstre.

`rigAt` interpolerer parvis mellom `flight→side` (station 0..1) og `side→top`
(station 1..2), med samme lerp-form som `lerpCam` og en smoothstep på t.
Rotasjonen går via orbit rundt scenens ankerpunkt, ikke via rå lineær lerp av
`pos` — det er det som gjør reisen til en bue rundt skuddet i stedet for en rett
linje gjennom bakken.

Perspektiv→ortho er **én kontinuerlig parameter**, ikke to renderere:

```js
const zDiv = zCam + (refDist - zCam) * rig.orthoK;   // orthoK 0 → zCam ; 1 → refDist
screen = { x: cx + (xCam / zDiv) * focal, y: cy - (yCam / zDiv) * focal };
```

Ved `orthoK = 0` er dette identisk med `swing-parameters-and-impact.js:55`.
Ved `orthoK = 1` divideres det på en konstant — det **er** ortografisk projeksjon,
eksakt, ikke en tilnærming. Mellomverdier er en gyldig projeksjon hele veien.
Ett uttrykk, ingen gren i den varme løkken, og TOP/SIDE måler sant i endepunktet.

`project` returnerer `depth` (= `zCam`) sammen med `{x,y}`, slik at
tegnerekkefølge og dybdeeffekter har noe å sortere på i alle stasjoner.
`null` når `zCam <= 0.01`, som i eksisterende `project`.

### 5.4 Renderer

**Canvas 2D for scenen; DOM for etiketter.**

- Mocken — den navngitte referansen i pairwise-blind-sammenligningen — er canvas.
  En SVG-port ville bli sammenlignet mot noe den ikke er bygget som.
- fps-kravet gjelder scrub **med** annotasjonslaget levende. Per frame å mutere
  ~30 SVG-noder med tekst og kollisjonsløsning er den kjente dyre veien; canvas
  tegner samme frame uten DOM-arbeid.
- Presedensen finnes allerede: `geo3d/scene.js` tegner i canvas og posisjonerer
  DOM-etiketter via projeksjon (`geo3d/lowpoint.js#placeLabel`). Etiketter i DOM
  beholder tekstrendering, fonttokens og lesbarhet.

De tre SVG-ene (`#svgDir`, `#svgHt`, `#fScene`) erstattes av ett canvas.

**A11y-forpliktelsen følger med og er ikke valgfri.** Dagens kontrakt i
`impact.html`: den visuelle heroen er `aria-hidden="true"` (linje 987) fordi den
oppdateres hver frame, og `#fCarryLive` (linje 1002, `aria-live="polite"`,
`aria-atomic="true"`) er den **eneste** live-regionen. Canvas-scenen arver dette
uendret: scenen er `aria-hidden`, og den sr-only live-regionen forblir eneste
annonseringskanal. `role="img"` + `aria-label` beholdes på canvas-elementet.

### 5.5 Eskaleringsflate for Økt B

Det som er besluttet her: ekte rigg, orbit rundt anker, `orthoK`-blend, canvas,
`rigAt`/`buildBasis`/`project`-signaturene, `depth` i retur.

Det som er implementasjon: konkrete `pos`/`look`/`fov`-verdier per stasjon,
`refDist`, smoothstep-formen, ankerpunktet, snap-terskler, gest-detaljer.
Å tune kameraposer til at scenen sitter er implementering, ikke redesign.

---

## 6 · CARRY VS TOTAL (BESLUTTET)

**Valgt: harmoniser. Stort tall = CARRY. Divergensen fjernes.**

### 6.1 Hva som faktisk står der i dag

`impact.html:582` — kommentaren i koden:

```
/* ── LEFT HERO STACK (Layout B): big TOTAL + offline only ──
```

`impact.html:987–989`:

```html
<div class="flightCarry" aria-hidden="true">
  <div class="num"><span id="fCarryNum">0</span><span class="u">m</span></div>
  <div class="lab">Total</div>
```

Elementene heter `fCarryNum` / `fCarryLive` / `.flightCarry`, men **etiketten sier
Total**. Divergensen er altså ikke mellom Impact og en annen skjerm — den ligger
inne i Impact-skjermen selv, mellom navngivning og visning. Ordrens formulering
«dagens 3D-visning som viser TOTAL stort» peker på `#fScene`-heroen her.

### 6.2 Hvorfor carry vinner

Dette er ikke en smaksavgjørelse. Ordren krever i §4 at chip, annotasjon og stort
tall aldri kan divergere. Annotasjonslaget måler **carry** og ikke noe annet:
kurvemålet ligger ved `z = carry`, offline-braketten ved `carry + 12`, og
Δ-linjen på pins regnes på carry. Et TOTAL-hero over et carry-annotert bilde er
nøyaktig den divergensen §4 forbyr — det store tallet ville være det eneste tallet
på skjermen uten en strek under seg.

Tallene er dessuten ikke like sikre. `total = carry + carry*rollFrac`
(`impact-flight.js:188–189`) med `rollFrac` klemt til 1.2–5.5 %, flagget ESTIMATE,
avledet av landingsvinkel. Rullet skjer etter landing, er usynlig i flighten, og
er den svakeste modellen i motoren. Å gi den skjermens største typografi er å
love mest der modellen vet minst.

Carry er i tillegg det utfallet parameterne faktisk styrer i luften. TOTAL blir
ikke borte: den beholder plassen i mini-raden og i `DISTANCE`-gruppen, der ordren
allerede plasserer den.

### 6.3 Systemkonsekvenser

- `.flightCarry .lab` → `Carry`; verdien leser `Outcome.m.carry`.
- `#fCarryNum` / `#fCarryLive` / `.flightCarry` beholder navn — de blir *riktige*
  for første gang. Ingen ID-endring, ingen selektor-drift for eksisterende tester.
- `#fCarryLive` sin annonseringstekst må si carry. Live-regionen er
  a11y-kontrakten, ikke dekor.
- Dette endrer eksisterende shipping-UI. `npm run verify:change -- --dry-run
  --file impact.html` klassifiserer nivået før endring; kjør den, ikke gjett.
- Ingen fysikkendring. `total` regnes fortsatt, vises fortsatt, uendret verdi.

---

## 7 · ANNOTASJONSLAGET — HVOR DET BOR

Ny fil `impact-annotate.js`. Rene funksjoner, ingen DOM, ingen canvas-kall.

```js
export function buildAnnotations(outcome, station, basis) → Primitive[]
export function placeLabels(primitives, keepOut, vbox) → Primitive[]   // deterministisk kaskade
```

Laget er en **ren transform**: `(Outcome, station, basis) → primitiver`
(`{kind, points[], label, tone, alpha}`). Det tegner ikke; kalleren tegner.

Dette er ikke arkitektonisk smak — det er det ordren krever av bevis. Etikett-
kaskaden og stats-flippen skal enhetstestes med syntetiske geometricaser og
automatisert sveip. En ren funksjon som returnerer primitiver kan testes med
`node --test` uten nettleser; en funksjon som maler rett på et canvas kan ikke.
Testene ligger i `scripts/`, som er repoets testkonvensjon
(`node --test scripts/*.test.mjs`).

Kollisjonsregisteret og nudge-iterasjonene lever inne i `placeLabels`, per kall,
uten tilstand mellom frames. Reglene selv (terskler, rekkefølge, keep-out) står i
ordren §3 og gjentas ikke her.

---

## 8 · FILSTRUKTUR

Tre nye moduler. Ingen bundler, ingen nye avhengigheter, ingen nye kataloger.
Rot-`*.js` fanges automatisk av `scripts/copy-web.mjs` sin denylist-sveip, så
`www/` og Capacitor-pakkingen trenger ingen endring.

| Fil | Eier | Ansvar |
|---|---|---|
| `impact-camera.js` | Økt B | `STATIONS`, `rigAt`, `buildBasis`, `project`. Rene funksjoner. |
| `impact-outcome.js` | Økt E | `selectOutcome(state) → Outcome`. Eneste kaller av `solveFlight`. Eneste sted yards→meter. Eier `physical`. |
| `impact-annotate.js` | Økt D | `buildAnnotations`, `placeLabels`. Ren transform → primitiver. |
| `impact.html` | Økt B/C | Scene-canvas, paneler, kontroller, tegneløkke. |
| `sa-p3.css` | Økt C | `--measure` + `--q-measure`. |

**Urørt:**

| Fil | Hvorfor |
|---|---|
| `impact-flight.js` | Fysikk. `CLAUDE.md`-låst uten failing regression test + autorisasjon. |
| `swing-parameters-and-impact.js` | Eies av `geometry.html`. Presedens, ikke avhengighet. |
| `geo3d/*`, `geometry.html` | Annen skjerm. |
| `www/*` | Generert av `scripts/copy-web.mjs`. |

**Stub-flaten (Økt C mot Økt E):** `impact-outcome.js` er kontrakten. Økt C
importerer `selectOutcome` og leser `Outcome`. Om implementasjonen bak er
mock-tall eller ekte motor er usynlig for kalleren — Økt E bytter innmaten i én
fil, og K5-grepet har én fil å være grønn i.

---

## 9 · BESLUTNINGSLOGG

| # | Beslutning | Valg | Bærende begrunnelse | Evidens |
|---|---|---|---|---|
| A1 | Kameratilnærming | Ekte rigg + orbit; perspektiv→ortho via kontinuerlig `orthoK`. Ikke 2D-punktlerp. | Mockens punktlerp har ingen kamera underveis, mister dybde, og gir annotasjonslaget ingen basis å måle mot. Repoets DTL-flate tweener riggen. | `design/mocks/impact-kamera.html:266–272`; `swing-parameters-and-impact.js:44,55`; `docs/showcase-spec.md:26` |
| A2 | Ortho i endepunktene | TOP/SIDE er sanne ortografiske; FLIGHT perspektivisk | Vinkelbuer i perspektiv viser ikke vinkelen de påstår — dokumentert feil på geometry-skjermen. | `docs/geometry-rethink.md:18` |
| A3 | Renderer | Canvas 2D + DOM-etiketter; erstatter tre SVG-er | Mocken (blind-referansen) er canvas; fps-kravet gjelder scrub med levende annotasjoner; repoet har mønsteret. A11y-kontrakten arves uendret. | `geo3d/scene.js:99`; `impact.html:778,887,1004,987,1002` |
| A4 | Verdenskonvensjon | Z-up, +X nedslag, +Y høyre, +Z høyde. Meter. | Repoets eneste konvensjon. Mockens akser mappes ved port. | `swing-parameters-and-impact.js:6`; `geo3d/scene.js:7` |
| A5 | Stasjonsskalar | Kontinuerlig 0..2; 0=FLIGHT, 1=SIDE, 2=TOP | Eneste numerering der TOP↔FLIGHT nødvendigvis passerer SIDE. Segmentrekkefølgen på skjermen er bevisst motsatt. | `design/mocks/impact-kamera.html:266–272` |
| A6 | State-modell | Fem parametre + `station` + UI-flagg. Ingen avledet verdi lagres. `station` er ikke parameter. | Scrub re-solver aldri fysikk; parameterendring rører aldri kamera. Det er fps-budsjettet. | §3 |
| A7 | Én selector | `selectOutcome` er eneste kaller av `solveFlight` og eneste yards→meter | Ordrens §4 «samme tallkilde overalt» er kun håndhevbar hvis det finnes ett sted å håndheve det. Gir Økt E én fil å bytte og K5 én fil å greppe. | `impact.html:1154,1164,1495` |
| A8 | Ekstremverdi-policy | (b) eksplisitt tilstand, avgrenset til `spinLoft > 0`. Input klemmes aldri. Motorens interne klemmer står. | Negativ spin loft er det eneste stedet motoren rapporterer feil fortegnsbetydning (`abs()` gjør topspin til backspin). Øvrige ekstremer er unøyaktige, ikke usanne. Stille clamp leser som ødelagt instrument for målgruppen. | `impact-flight.js:125,197`; §2.5 |
| A9 | Carry vs total | Harmoniser til CARRY stort. Total beholdes i mini-rad + DISTANCE. | Annotasjonene måler carry; TOTAL-hero er nøyaktig divergensen §4 forbyr. `rollFrac` er motorens svakeste ESTIMATE og fortjener ikke største typografi. | `impact.html:582,989`; `impact-flight.js:188–189` |
| A10 | Måle-token | Nytt `--measure:#EEC07A` + `--q-measure` i `sa-p3.css` | `#eec07a` finnes ikke i repoet (grep: 0 treff); `--launch:#E3C468` er nær, men er parameterfarge, ikke målerolle. | `sa-p3.css:100,123–127` |
| A11 | Annotasjonslaget | Egen ren modul `impact-annotate.js`, returnerer primitiver | Kaskade + stats-flip krever enhetstest uten nettleser. Canvas-tegnende kode kan ikke testes slik. | §7 |
| A12 | Fysikk urørt | `impact-flight.js` skrivebeskyttet; alt nytt additivt | `CLAUDE.md` krever failing regression test + eksplisitt autorisasjon for fysikkendring. Ingen av de 12 verdiene mangler. | `CLAUDE.md`; §2.3 |
| B1 | DUAL-LENS vs én scene | Én-scene-konseptet ERSTATTER DUAL-LENS-laget. Revet med vilje: to-linse-layout, Play-flight-overlay m/GSAP-FX og ambient lyd, ghost-lab-legende. | Ordren (2026-07-17) er nyere enn DUAL-LENS-redesignet og er beviselig skrevet mot dagens UI: §2 navngir «dagens 3D-visning som viser TOTAL stort» og gjeninnfører nettopp det segmenterte stasjonsvalget DUAL-LENS fjernet. Kapasitetene gjenoppstår der ordren plasserer dem: Pin/ghosts maks 3 (Økt C), komet (Økt D), carry-hero (§6, levert Økt B). Gammel fil bevart i `.sa-backups/`. | ordre §1-linje + §2; gammel `impact.html:116–119,745–746,3843–3855`; §1.1-status |
| B2 | Kamerabasis: speiling, rull, anisotropi | LH-basis `right = up × fwd`; per-stasjon `up` blendet i `rigAt` (90°-rull SIDE→TOP); `xStretch` per stasjon; SIDE-kamera på +Y-siden (ser langs −Y); orbit-bulge 0.55 på flight↔side-benet | +Y=høyre MÅ rendre skjerm-høyre (fade skal kurve høyre på skjermen; mockens projPersp/projTop gjør det). TOPs kartorientering krever kontinuerlig rull, ikke terskel-flipp. Mockens SIDE/TOP-skalaer er anisotrope; presedens: `lerpCam` lerper allerede `xStretch`. Bulgen holder hele skuddet i bildet midtveis i reisen. | `scripts/impact-camera.test.mjs` («golf-semantic screen orientation», «rolls continuously»); `design/evidence/impact-kamera-okt-b/` (video + skalar-trace); `swing-parameters-and-impact.js:44` |
| B3 | Kamera-easing | Stasjonsglidning er tidsbasert (eksponentiell, τ=110 ms → ~0,5 s til ro), ikke per-frame-lerp | En droppet frame skal koste bilder, aldri strekke kamerareisen; målt 733/500 ms rAF-stall ved førstelast i headless gjorde per-frame-lerp til en reise på ~1,4 s. | skalar-trace i `design/evidence/impact-kamera-okt-b/scalar-log.json` |

### Åpne punkter (ikke blokkerende, eies av senere økter)

1. ~~Konkrete kameraposer~~ **Løst i Økt B:** poser/fov/xStretch/anker står i
   `impact-camera.js` `STATIONS`, kalibrert mot mockens målestokk (`projPersp`
   `camY 3.2, camZ −15, f = H*0.95` → flight `pos(−15,0,3.2), fov 55°`; osv.).
   Retuning er fortsatt fri implementering (§5.5).
2. **`prefers-reduced-motion`** finnes allerede i repoet (`docs/showcase-spec.md:26`
   bruker snap-uten-glide). Implementert i Økt B som snap-uten-reise for oppstart
   og scrub-snap; komet-delen eies av Økt D.
3. ~~Gren/arbeidsflate~~ **Løst:** Økt B–F kjører i dedikert worktree på gren
   `agent/impact-kamera`; søsken-worktrees tilhører andre økter.

---

## 10 · HVA ØKT B MÅ LESE FRA DENNE KONTRAKTEN

Økt B implementerer kamerasystemet (scrub + projeksjonsblending). Fra denne filen
trenger den, og bare dette:

1. **§5.3 — flaten.** `impact-camera.js` med `STATIONS`, `rigAt(station)`,
   `buildBasis(rig, vbox)`, `project(p, basis) → {x, y, depth} | null`. Signaturene
   er kontrakt; verdiene inni er implementering.
2. **§5.1 + A1 — tilnærmingen er avgjort.** Ekte rigg, orbit rundt scenens anker,
   projiser etterpå. Mockens `project()` (linje 266–272) er referanse for *atferd*
   (hvor kameraet står ved hver stasjon), aldri for *metode*. Å lerpe projiserte
   punkter er utenfor kontrakten.
3. **§5.2 + A2 — `orthoK` er ikke valgfri.** `zDiv = zCam + (refDist − zCam)*orthoK`.
   TOP og SIDE må være eksakt ortografiske i stasjonspunktet, ellers lyver
   annotasjonslaget. Én parameter, ingen gren i den varme løkken.
4. **§1.4 + A4 — verdenskonvensjonen.** Z-up, +X nedslag, +Y høyre, +Z høyde,
   meter. Mockens akser mappes (`mock.z→x`, `mock.x→y`, `mock.y→z`). Mockens akser
   skal ikke inn i produksjonskode.
5. **§3.1–3.2 + A5/A6 — state.** `station` er en kontinuerlig skalar 0..2 i
   `state`, med 0=FLIGHT, 1=SIDE, 2=TOP. Segmentrekkefølgen på skjermen er motsatt
   og skal ikke «rettes». `station` er ikke en parameter og skal ikke trigge
   re-solve.
6. **§3.3 + A7 — datakilden.** Les `Outcome` fra `selectOutcome(state)`. Kall aldri
   `solveFlight` direkte. Multipliser aldri med `YD2M`. Scenen er meter.
   Banegeometrien kommer ferdig skalert i `Outcome.path` (§2.4).
7. **§5.4 + A3 — renderer og a11y.** Canvas 2D erstatter `#svgDir`, `#svgHt`,
   `#fScene`. Scenen er `aria-hidden="true"`; `#fCarryLive` forblir eneste
   live-region. Etiketter i DOM, ikke i canvas.
8. **§1.6 + A10 — farger.** Alt via `--q-*`-aliasene og `impact.html`s `--c-*`-remaps.
   `--measure` for måle-etiketter. Null hardkodede fargeverdier i nye filer.
9. **§8 — filstruktur.** Kun `impact-camera.js` + tegneløkken i `impact.html`.
   `impact-flight.js` og `swing-parameters-and-impact.js` er urørte.
10. **§5.5 — eskaleringsgrensen.** Å tune poser, `refDist`, ankerpunkt, easing og
    snap-terskler er implementering. Å konkludere at rigg-tilnærmingen ikke bærer
    er redesign → stopp, tilbake til Fable.

Alt annet Økt B trenger — gest-atferd, snap-regler, segmentknapper, animasjons-
timing — står i `design/orders/impact-kamera.md` og i mocken. Denne kontrakten
gjentar dem ikke.
