# Fysisk enhet + VoiceOver — sjekkliste for eierens økt (§6.1–6.2)

Desktop-målingene er proxy. Denne økten gjøres på en fysisk iPhone med
TestFlight-builden som inneholder instrument-gates-arbeidet.

## A. Lab-drag-økt (120 Hz-følelse)

- [ ] Åpne Backspin → Spin Lab. Dra Dynamic loft sakte fra 10° til 48° og
      tilbake. Kjennes sporet «limt til fingeren», eller henger tallet etter?
- [ ] Gjenta med raske små bevegelser rundt 25°. Ingen synlig etterslep på
      Backspin-tallet; ghostene skal ligge stille bak.
- [ ] Bytt parameter-chip midt i et drag. Ingen hopp eller blink.
- [ ] Subjektiv karakter (1–5) på «instrument-følelse»: ____
- [ ] Instruments-profil (Xcode → Instruments → Core Animation FPS) under
      30 sekunders kontinuerlig drag: noter p95 frametime: ____ ms
      (mål: < 8.3 ms på 120 Hz-enhet, < 16.7 ms på 60 Hz).

## B. Manuell VoiceOver-gjennomgang (alle seks flater)

Slå på VoiceOver (trippelklikk sideknapp). For hver flate:

- [ ] **Mission**: leses tittel → lede → mission-kort i riktig rekkefølge?
      Er «Enter the Spin Lab» tydelig som knapp?
- [ ] **Lab**: sveip til slideren. Justér med sveip opp/ned — leses verdien
      som «minus 3 degrees» (ord, ikke tegn)? Kommer årsakskjeden som én
      rolig melding etter at du slipper (ikke ved hvert steg)?
- [ ] **Influence**: leses hver rad med retning og verdi? Åpner A/B-detaljen
      og leses begge tilstander?
- [ ] **Myths**: kan du velge prediksjon og høre både dom og forklaring?
- [ ] **Mastery**: leses «Task 1 / 5»? Radiovalg med roving fokus? Target-
      oppgaven: leses rpm/landing etter submit?
- [ ] **Result**: leses mestret-status, 5/5 og neste-steg-knappene?
- [ ] Ingen flate feller fokus, ingen død sveip-rekkefølge, ingen dobbel
      opplesning av samme verdi.

## C. Registrering

Avvik noteres med flate + element + hva som ble lest. Avvik her er funn til
neste iterasjon — de endrer ikke evidensmanifestet.
