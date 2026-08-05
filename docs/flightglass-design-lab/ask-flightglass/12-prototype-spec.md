# Ask Flightglass — 12 Representativ prototype (forslag til eierport)

**Krav (masterprompt fase 9):** Et vertikalt utsnitt som beviser minst én full løkke: *spørsmål om golfmekanikk → kort, ærlig svar med grense → åpning av riktig live modell eller Academy-leksjon → synlig gratis-/Pro-verdi uten tvang.* Ekte motor-sannhet, native atferd, tilgjengelighet — ikke en statisk presentasjon.

## 1. Valgt utsnitt: «Spin-loft-løkken fra Range»

Én skjermflyt, fire beats, bygget som **mock i `design/mocks/candidates/`** (samme regime som tabell-/leksjonskandidatene — utenfor shipping-allowlisten, ingen produktrisiko):

**Beat 1 — Inngang.** Range-lignende flate (gjenbrukt visuell ramme) med en diskret `Ask`-affordance i sekundærsonen (44 px, aldri i konkurranse med trace). Tap → ett-nivås bottom sheet med fokusfelle, inputfelt («Ask about ball flight») og 3 foreslåtte faste spørsmål fra katalogen.

**Beat 2 — Svar.** Case R1 («How do I get less spin with my driver?») renderes fra en **hardkodet AskAnswer-instans** (ingen LLM i prototypen — `source_mode` vises som dev-badge): kort svar (≤60 ord) med den board-reviderte fasiten (spin loft OG treffhøyde OG vindu-forbeholdet), årsakskjede, `cannot_say`-linjen i muted register, og én primærhandling. Kvoteteller står i sheet-headeren **fra åpning** (mono/tabulær). Årsaksleddene settes i nøytral tekst med violette **taught terms** (tap-to-define, Academy-presedens) — violet farger begreper, aldri hele prosaledd (lov 5/13). Tall rendres fra `NumToken`-registeret: mono/tabulær for model, `≈`+EST for est, «TOUR»-merke for benchmark, U+2212, ingen dekorativ glow.

**Beat 3 — Sannhetsflate.** Primærhandling «Open Spin Loft →» navigerer til `academy.html#/lesson/spin-loft` — **ekte, shippet rute som åpner Backspin-opplevelsen med begrepsarket** (verifisert i 02/03). Dette beviser deeplink-løkken mot ekte motorinnhold uten å endre én shipping-fil. (Alternativ beat 3 med `range.preset` krever G1 og utsettes.)

**Beat 4 — Gratis-/Pro-verdi uten tvang.** Kvotetelleren står i headeren fra åpning (Beat 2); det som kommer **etter levert verdi** er Pro-linjen. Grensetilstanden (eget prototype-state): verdifullt deterministisk svar leveres fortsatt, pluss én ærlig Pro-linje med **fair use-disclosure**: «Pro removes the weekly limit — fair use 150/month. Keeps your answers on this device.» med dismissal. Ingen nedtelling, ingen blokkering av deterministisk innhold.

**Beat 5 — Fallback-tilstand (board-krav).** Eget state: LLM utilgjengelig/validering feilet → sheetet viser den ærlige offline-linjen («Free-text answers are offline — here's what Flightglass knows»), nærmeste katalogsvar og deeplink; teller uendret. Dette er kjernen i ærlighetsarkitekturen og må bevises visuelt, ikke bare beskrives.

## 2. Hva prototypen beviser / ikke beviser

| Beviser | Beviser ikke (bevisst) |
|---|---|
| Answer-contract er renderbar og forståelig i portrett (430×932, 375×812) **og landskap (932×430, 812×375)** | LLM-kvalitet (ingen leverandør valgt — hardkodede svar) |
| Alle tre tallregistre (model/EST/benchmark) + cannot_say rendres korrekt — **ikke-vakuøst** via R9/R7-svar med faktiske tall | `range.preset` (G1), tabell-sheets (G3), Diagnose-ruting (G2) |
| Deeplink til ekte leksjon/begrepsark fungerer | Kvote-backend (kun UI-tilstander) |
| Fallback-/offline-tilstanden er et instrument, ikke en feilmelding | Konverteringstall |
| Pro-øyeblikket kommer etter verdi og tåler blindtest | — |
| Reduced motion + tastatur + fokusfelle + SR-flyt i sheet | — |

## 3. Akseptansekriterier (falsifiserbare)

1. Fem-sekunders-test: en golfer forstår hva flaten svarer på og hva neste handling er.
2. Deeplink åpner riktig begrepsark i shippet Academy-kode (screenshot-bevis), og **retur-reisen** er definert: tilbake fra Academy → sheetet gjenåpnet med svar + oppfølgingsfelt (03 §6).
3. **Ikke-vakuøst tallkrav (board-korrigert):** minst ett svar inneholder tall i hvert register (model mono/tabulær, EST med ≈, benchmark med TOUR-merke), hvert med synlig grounding-kilde i dev-badge; R1-svaret beviser cannot_say + assumptions uten tall.
4. Kvote- og Pro-tilstander består blind sammenligning mot «uten Pro-linje»-varianten på ærlighet og trykk; Pro-copy inneholder fair use-disclosure (F9).
5. axe-core 0 critical/serious; 44 px-mål; reduced-motion-paritet (sheet uten slide, innhold direkte); 130 % tekst intakt; **aria-live=polite for svar/feil/kvote, aria-busy under venting, fokus til svarstart ved levering — verifisert med skjermleser-gjennomgang**, ikke bare axe.
6. Skjermbilder i alle fire målviewporter, normal + reduced motion, inkl. Beat 5-fallbacktilstanden.
7. Layout med mobilt tastatur oppe (input + forslag synlige) er demonstrert i minst én kaptura.
8. Ingen shipping-fil, fysikkfil eller beskyttet identifikator endres.

## 4. Kost/omfang

Én mock-fil + én hardkodet svarkatalog (**4 svar: R1, R9, R7, E1** — board-revidert for å dekke alle tre registre + avvisning; R3 utgår som redundant med R1s taught-term-ark) + skjermbilde-evidens. Katalogsvarene skrives som faktiske AskAnswer v2-instanser (grunnlaget for `ask-catalog.json`). Gjenbruker eksisterende sheet-/typografi-mønstre fra Academy. Ingen avhengigheter, ingen nøkler, ingen backend. Estimat: 1–2 fokuserte økter, review-bar via vanlig mock-vaktpass (impeccable + a11y i headless Chrome, som tabellkandidatene).
