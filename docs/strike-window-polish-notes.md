# Strike Window — polish-runde (post-cohesion)

Boss-verdikt 2026-07-10 over to eksterne AI-reviews av Geometry. Konklusjon: begge KONFIRMERER C2 Strike Window-retningen (reviewer 2 om 2D-vinduet: «trenger nesten ingen endring»). Adopterte deltaer under utføres i ÉN polish-runde på geometry-window-mock.html sammen med a11y-funnene F1–F8 (se a11y-lead-rapporten), ETTER at sammenkoblings-workflowen har sluppet filen.

## Adoptert
1. **Default aktiv parameter = LOW POINT** (ikke Plane). Lavpunktet gir raskest aha: ball-first/turf-first, attack, treffhøyde på én slider. Chip-raden starter med Low Point valgt/dokk-hint på den.
2. **Effekt-setning i tune-dokken**: under slider-verdien, én kort linje som oversetter tilstanden — f.eks. «Ball first · descending attack» / «Turf 14 cm before ball · digging». Datadrevet fra strikedisplay + deriveImpact (ikke fritekst-tabell for alle kombinasjoner — generer fra band + attack-fortegn + sekvens).
3. **Typografi 3-rolle** (samme som academy-polish-spec): ui=Inter, display=Space Grotesk/Inter Tight, mono KUN tall/enheter. Vendored fonts (deles med Academy — samme vendor/fonts/).
4. **Diagnose primær**: band-verdiktet (Pure/Thin/Fat/Duff/Topped) løftes visuelt (størrelse/plassering) over metrikk-tilene; tilene støtter.

## A11y-funn som fikses i samme runde (fra lead-rapporten)
- F1+F2: #hLow ARIA-verdimodell bindes til rå state.lowPoint.x (matcher piltaster+dokk); effektiv cm får persistent tekst-hjem (tile/undertekst).
- F3: `<main>` + sr-only `<h1>` (2 linjer).
- F4: dokk-fokusgate på `event.detail === 0` i stedet for pointer-timestamp (touch-AT).
- F5: sekvens-pip-tall kontrast (fill #fff el. lysere dot).
- F6: seks tekstkjøringer <10px → ≥10-11px.
- F7: aria-pressed i statisk markup på presets.
- F8: settle/endSession dobbel-annonsering dedupes; applyPreset clearer settleTimer.

## Forkastet/utsatt (ikke gjør)
- 3D-scene-oppgraderinger (impact tangent i 3D, semi-ortho, divot i 3D, fade-lag): 3D er demotert til på-forespørsel-lenke per Fable-verdiktet + eierens C2-valg. Evt. mye senere.
- Ekstern farge-grammatikk: P3 Ultraviolet Ember er låst (ember = live-sporet; param-farger per P3-blokken).
- Nytt «parameter deck»-konsept: chips+dokk er appens låste grammatikk.
- Norsk UI: appen er engelsk-låst.

## Verifisering (atomisk)
- [ ] Low Point er aktiv/first ved last; dokk-hint på den
- [ ] Effekt-setning i dokken endres korrekt over preset-sveip (Pure/Thin/Fat/Duff/Topped — assert mot band+sekvens)
- [ ] Ingen mono-brødtekst (grep-invariant), display-font kun titler/hero-verdier
- [ ] Diagnose visuelt primær (størrelse/kontrast-hierarki)
- [ ] F1–F8 alle verifisert (per lead-rapportens fikser)
- [ ] Falsifiseringstabellen (5 preseter × 4 outputs vs motor) består fortsatt
- [ ] 0 konsollfeil begge viewports; alle eksisterende a11y-porter består

## MÅLGRUPPE-TILLEGG (Sivert 2026-07-10)
Målgruppen er den nysgjerrige, ikke eksperten: effekt-setningene i dokken skrives i klarspråk («Kølla treffer bakken før ballen — tungt slag») og diagnose-ordene bærer forklaringen; tallene støtter. Første-gangs-hint: «Dra lavpunktet og se hva som skjer» — aha uten forkunnskap.
