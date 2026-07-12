# GEOMETRY 3D — «se under bakken» når lavpunktet graver (owner 2026-07-12)

**Eier-observasjon (skjermbilde):** ved lavpunkt Y negativ (f.eks. y −8.4 cm) forsvinner svingbuen + lavpunkt-markøren UNDER bakken og blir bare borte. Pedagogisk feil: dette er nettopp den viktige lærdommen — kølla graver for dypt (fat/for lavt treff). Brukeren skal **SE** at buen og lavpunktet ligger for lavt, ikke at de forsvinner.

**Tre krav:**
1. **Gjør under-bakken-innholdet synlig** — når buen / lavpunkt-markør / y-brakett går under bakkeplanet (z=0), skal den under-delen fortsatt sees, som en tydelig «under bakken»-visning (cutaway), så det leser «du graver for dypt».
2. **Flytt chips ut av veien** — «+8 cm ahead» og «y −8.4 cm»-plakettene ligger oppå ballen/scenen; reposisjoner så de ikke dekker geometrien (særlig i grave-tilstander).
3. **Under-delen skal lese som en advarsel/for-lavt-tilstand**, ikke som normalt innhold.

## Diagnose (kode)
- `geo3d/scene.js`: `floor` = opaque MeshStandardMaterial ved z=0 (radial grade, receiveShadow). Okkluderer alt under z=0.
- `geo3d/plane.js` `clampLowerEdge()`: løfter HELE plane-gruppen (plan+grid+dial) opp så laveste hjørne holder z ≥ 0.002 — men buen (arc) og lavpunkt-markør/brakett er i andre moduler og følger IKKE dette løftet, så de dykker under bakken og skjules av floor.
- Nettoeffekt: inkonsistent — planet tvangsløftes, buen graver og forsvinner.

## Løsning (design — agenten eier håndverket innenfor dette)
**A. Bakke-cutaway for grave-tilstander:** når noe geometri (arc-bunn / lavpunkt / y-brakett) er under z=0, la den under-delen rendres SYNLIG gjennom bakken. To lovlige teknikker (agenten velger den reneste):
  - (i) den under-delen får `depthTest=false` + redusert opasitet (~0.35–0.5) + `--warn` amber-tone, så den tegnes «gjennom» bakken som en ghost-cutaway; ELLER
  - (ii) floor får en subtil semi-transparent «vindus»-sone (bare der geometrien graver) så man ser ned. (i) er sannsynligvis renest og billigst.
**B. Bakke-linje-referanse:** en tydelig men rolig bakke-hairline/horisont der geometrien krysser z=0, så «under vs over bakken» er umiddelbart lesbart (skillet mellom normal bue og den dimmede under-delen).
**C. clampLowerEdge:** vurder å DROPPE tvangsløftet av planet i grave-tilstander (eller la buen følge samme løft) — poenget er nå å VISE at det graver, ikke å skjule det. Behold z-fighting-beskyttelsen der det trengs, men ikke på bekostning av å gjemme lærdommen. Agenten avgjør: enten (a) fjern løftet så alt graver ærlig og under-delen vises dimmet, eller (b) behold planet men vis buen/lavpunkt gravende. Ærlig geometri > pent løft.
**D. Chips:** flytt «+N cm ahead» (x) og «y ±N cm» (y-brakett-label) så de ikke dekker ball/bue/markør i noen tilstand (test grave-ytterpunkt y −10). Y-labelen bør ligge NÆR y-braketten (som nå går under bakken) men holdes lesbar over/ved siden av — eller flyttes til panelet hvis den kolliderer uunngåelig. Behold gull (måling) og U+2212.

## Farge/lov
Under-bakken-delen = `--warn` amber (advarsel/for-lavt), ALDRI ember (ember = handling/sannhet). Bakke-referanselinjen = nøytral hvit-alpha. Gull = målinger (chips/brakett). Glasset (subtilt, owner 07-12) urørt. «Stille til du rører den» holder — cutaway vises kun når det faktisk graver.

## Verifisering
- lavpunkt Y-sweep +2 → −10 cm: over bakken = normal; krysser 0 = bakke-linja leser; under bakken = buen/markør/brakett synlig som dimmet amber cutaway, ALDRI usynlig. Skjermbilder ved y +1.6 (default), y 0, y −5, y −10, begge viewports.
- Chips dekker aldri ball/bue/markør ved noen y (rekt-intersect == 0 assert), særlig y −10.
- checkAlign3d pass · renderCount idle-frys intakt · 0 konsollfeil · begge viewports (900×470 + 844×390) · RM-pass · glasset fortsatt subtilt.
- Default-tilstand (y +1.6, over bakken) UENDRET — App Store-bildene bruker den, så ingen regresjon der.

**Koordinering:** kjøres ETTER v2-App-Store-bildene er fanget (deler geometry.html/geo3d — ingen parallell redigering under capture).
