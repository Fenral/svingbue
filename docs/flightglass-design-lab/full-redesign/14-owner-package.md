# Full Flightglass-revisjon — 14 Eierpakke

**Dato:** 2026-08-05 · **Status:** Fase A–D levert som beslutningsgrunnlag. Ingen implementering er startet; ingen låst beslutning er stille endret. Alt under peker på dokumentene i dette arbeidsområdet.

## A. Retningsuavhengige beslutninger (kan godkjennes uavhengig av retningsvalget)

Bekreftet av baseline (02/03), alle tre retninger uavhengig, og boardets gruppetenk-sjekk som *reelle* konklusjoner:

| # | Beslutning | Bevis |
|---|---|---|
| A1 | **Outcome får ekte eierflate** — kjerneløftet «see why it flew» har i dag ingen shippet flate; `?play=1`-flisen er inert | 02 §1/§3 |
| A2 | **G1 lukkes** (Range tar imot tilstand — den allerede spesifiserte ~12-linjers konsumenten) | 02, 04 §3 |
| A3 | **Impact Studio konsolideres** inn i Lab/Range som linse (shippet uten IA-hjem, dupliserer Geometry, manglende orienteringslås) | 02 §3 |
| A4 | **Depth/grain/blur/bloom-laget avvikles** (halvutrullet; bloom ubrukt; Academy overstyrte det selv) | 03 §5 |
| A5 | **Én display-stemme; token-konsolidering; én render-verdi per fysisk kvantitet; lovverket samles i ett hjem** | 03 §6 |
| A6 | **Døde kontrakter fjernes** (`?play=1`, `sa_swing`, Strike Window-dødlenken håndteres) | 02 §5 |
| A7 | **Ingen entry-koreografi** — permanent regel | 04 §5 |

## B. Retningsvalget (FR-O1 — ditt hovedvalg)

Tre komplette retninger er utviklet, board-vurdert (3× REVIDER, alle P1 disponert via addenda) og feasibility-vurdert:

- **ANBEFALT: Quiet Phosphor** (`09-direction-3` + addendum) — natt-instrumentet destillert: violet fjernes, «lys kommer kun fra data», amber-fosfor-signal, 8→6 datahues (7 som default inntil test), maskinhåndhevbar doktrine. Aldri sist på noen board-linse; vinner forretning+migrering; bevarer blind-validert kapital og App Store-aktivumet. **Beviste den seg?** Den er den eneste med falsifikasjonsapparat (lint + oppgavebasert blindtest), og dens migreringsarbeid er gyldig delmengde av begge alternativene — valget lukker ingen dører.
- **Utfordrer: Signal** (`09-direction-2` + addendum) — broadcast-grafitt; vant begge håndverkslinsene; svakhet: kasserer Night Ladder + konstellasjons-Academy og låner en visuell kontrakt brukeren kjenner som gratis (WTP-risiko). Velges den, er WTP-/thumbnail-testene obligatoriske gates.
- **Ikke anbefalt videreført: Fieldbook** (`09-direction-1` + addendum) — dagslys-papir; størst differensiering, men sist på begge håndverkslinser og størst uprøvd nav-risiko. To elementer arves uansett (leksjonsanker-registeret i paywall-copy; ink-fylt chip-mønster).

**Hva som fjernes ved anbefalt valg:** violet som identitetsbærer, scene-/dusk-gradienter, natteland-foto fra produktflater (kan leve i markedsføring), `.sa-depth`-laget, Fraunces, `--launch`-huen, glød på tall, entry-koreografi — hver post flagget i retningsdokumentet, ingenting stille.

**Kostnad (relativ, korrigert av board):** QP lavest (L kun på Bench-Home); Signal høy (L på Home/Academy/Geometry/Outcome-replay); Fieldbook høyest (+ ukostet nav-lag, nå L). Evidensmanifestet (lov 5/13-ordlyd) må revideres med din signatur uansett valg.

## C. Åpne eiervalg (samlet)

| # | Valg | Anbefaling |
|---|---|---|
| FR-O1 | Retning | Quiet Phosphor m/ addenda; Signal som legitim utfordrer |
| FR-O2 | Home: Bench vs Night Ladder (vs «avkledd Ladder») | Avgjøres av oppgavebasert blindtest i prototypen — IKKE av mock-preferanse (boardets gruppetenk-funn: konvergensen «verden dør» var delvis mandat-indusert) |
| FR-O3 | Nav: hub+bug bekreftes; tab bar formelt åpen til korrigert regnestykke + lesbarhets-gulv er målt | Hub-and-spoke |
| FR-O4 | Impact Studios innplassering (linse vs sletting) | Linse under Lab/Range |
| FR-O5 | Outcome-flatens form følger retningsvalget | — |
| FR-O6 | Ask: inn i prototypen nå (krever Ask-O1/O4) eller etter Ask v0 | Ta Ask-beslutningen samtidig — kontrakten er retningsuavhengig |
| FR-O7 | Lov 5/12/13-ordlyd + SYS-07/08-verdier + manifest-revisjon | Per valgt retnings addendum |
| FR-O8 | Prisstige-avviket 99/590 (låst) vs 99/399/999 (strategi-evidens) | Rydd én gang før paywall-flaten bygges om |
| FR-O9 | Orienteringspolicy per flate | Leveres av prototypen (matrise-kravet) |

## D. Åpne risikoer

1. Alle kontrasttall er hex-matematikk til render-måling + CVD foreligger (D-gate 1) — gjelder alle retninger.
2. Home-blindtesten kan tape for Night Ladder — da finnes dokumentert fallback («avkledd Ladder»), og det er et gyldig utfall, ikke et nederlag.
3. Contact-sammenslåingen (QP) kan feile brukertesten — default er allerede 7 hues, så risikoen er innkapslet.
4. Evidens-gapet fra 01 (ingen ferske screenshots i denne økten) — første implementeringsøkt starter med fersk baseline-kaptura.
5. Ingen brukerbevis bak jobbrangeringen i 04 §1 — pilotmåling må bekrefte; boardet har flagget det.

## E. Neste handling ved godkjenning

1. Du svarer på FR-O1 (+ FR-O2/O6/O8 hvis du vil ta dem nå).
2. Prototypen bygges per `12-prototype-spec.md` (tre økter, mocks-only, med blindtest og måle-pakke).
3. Board-verifikasjon av prototype-evidensen; deretter egen eierport for implementeringsstart med migreringsrekkefølgen i `10-feasibility-review.md` §4.

Ingenting implementeres, publiseres eller migreres før du har svart.
