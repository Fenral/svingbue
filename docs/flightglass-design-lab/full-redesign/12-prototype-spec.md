# Full Flightglass-revisjon — 12 Representativ prototype-spesifikasjon (fase D)

**Forutsetning:** eier har valgt retning (FR-O1). Spesifikasjonen under er skrevet for **anbefalt kandidat Quiet Phosphor med addenda**; §6 angir deltaene hvis Signal velges i stedet. Alt bygges som mocks i `design/mocks/candidates/` (utenfor shipping-allowlisten), med samme vaktpass-regime som tabellkandidatene. Ingen shipping-fil, fysikk eller identifikator berøres.

## 1. Omfang (startpromptens D.5-krav)

Fem koblede flater i valgt retnings tokens, som ett sammenhengende vertikalt utsnitt:

1. **Home («The Bench»)** — siste skudds trace + EXPLAIN-primærhandling + fire moduler; også fallback-varianten «avkledd Ladder» bygges som B-kandidat til blindtesten.
2. **Aktiv Range-modell** — face-slider live mot trace (ekte `solveFlight`-kall som i eksisterende mocks), ghosts ved endring, ett amber live-cluster.
3. **Forklaringsflate (Outcome)** — plain-language-resultat + årsakskjede med register-typograferte tall + én amber neste-handling; demonstrerer kjedekravet Range→Outcome→Range.
4. **Academy-oversikt** — kursstige med mestringsbrøk, reward-gull kun i XP-rad, amber kun på anbefalt neste.
5. **Paywall** — spec-sheet med Academy-som-pensum synlig (addendum 4), utfall før pris, Annual anbefalt, 99/590.

**Ask Flightglass** inkluderes som sheet på Range-flaten KUN hvis eier samtidig har godkjent Ask-arbeidsområdets O1/O4 — da gjenbrukes Ask-prototypens fire svar i QP-materialet (én ekstra flate-tilstand, liten kostnad).

## 2. Hva prototypen skal bevise (falsifiserbart)

1. **Emisjonsregelen fungerer:** hver flate består signatur-sjekklisten (tick-ruler synlig, alle tall mono, ≤2 amber i ro, elevasjon kun via g-trinn) — maskinelt via lint der mulig.
2. **Fargesystemet overlever måling:** render-målt kontrast på faktiske flater for hele paletten + CVD-simulering (protan/deutan/tritan) av amber/gull/status/6 datahues — GO-gate, tallene fra §4.x er kun anslag til dette foreligger.
3. **Contact-spørsmålet avgjøres riktig vei:** Geometry-/Strike Window-mock med **7 hues som default**; sammenslåings-varianten må vinne brukertesten for å adopteres (addendum 2).
4. **Home-valget får ekte evidens:** oppgavebasert blindtest Bench vs shippet Night Ladder vs «avkledd Ladder»: (a) 5 s produkt+primærhandling-forståelse, (b) tid-til-riktig-tapp «explain my last shot», (c) retur-fra-Academy-med-kontekst. Fase 1-exitbevisene er fasit; statiske skjermbilde-preferansevalg er ugyldige som avgjørelse.
5. **Kjedekravet holder:** utfall → forklaring → «try it» tilbake til Range med parameter aktiv (G1-konsument-mønsteret demonstreres i mock-form) → Academy-avstikk → retur med kontekst intakt.
6. **A11y-kontraktene:** fokusflyt (ink-fylt chip-tilstand ≥3:1), tastatur+sveip-paritet for lens-bytte (identisk plassering), aria-live for live-verdier, reduced motion-paritet (statisk komplett), 130 % tekst, 44 px — SR-gjennomgang, ikke bare axe.
7. **Orienteringsmatrisen:** prototypen leverer én dokumentert orienteringspolicy per flate (portrett/landskap/begge) og demonstrerer overgangene — karusell-kaoset fra 02 §2 skal ha et svar, ikke arves.
8. **Viewport-aritmetikk:** delt regneark (korrigert safe-area-bokføring) fylles med målte verdier fra prototypen på 812×375 og 375×812.

## 3. Eksplisitte ikke-mål

Ingen produksjonsmigrering; ingen endring i evidensmanifestet (revideres separat med eiersignatur før implementering); ingen nye bilder; ingen LLM; paywall-mocken kobles ikke til IAP.

## 4. Evidenspakke ut

Skjermbilder alle målviewporter × normal/RM; lint-rapport; kontrast-/CVD-rapport; blindtest-protokoll + rådata; viewport-regneark; oppdatert 08-decision-log med utfall. Board-verifikasjon (fase 11-loop) på pakken før eierbeslutning om implementering.

## 5. Kost/rekkefølge

Bygges i tre økter: (1) tokens+lint+Range+Outcome (kjedekjernen), (2) Bench + blindtest-kandidater + protokollkjøring, (3) Academy+Paywall+måle-/CVD-pakken. Hver økt slutter grønn og committes på `agent/full-redesign-lab`.

## 6. Delta hvis Signal velges (FR-O1 alternativ)

Samme fem flater og samme bevisliste, pluss: replay-scrubber-mocken på Outcome (L-kostnaden fra addendum 4 aksepteres bevisst), WTP-/thumbnail-testene (addendum 7) kjøres i økt 2 i stedet for Bench-blindtesten (Home-kandidaten er rundown), og orienteringspolicy må eksplisitt løse SG-N2-eiervalget. Fieldbook spesifiseres ikke videre (10 §3) med mindre eier gjenåpner den; i så fall er FB-addendum 5 (nav-prototype-gaten) inngangskravet.
