# Full Flightglass-revisjon — 10 Feasibility og beslutningsmatrise (fase D)

**Grunnlag:** de tre retningsdokumentene med board-addenda (korrigerte kostnader), 02/03-baselinen, board-runden (11). Kreativ vurdering og teknisk vurdering holdes adskilt (masterprompt fase 8).

## 1. Teknisk sammenligning (etter board-korrigering)

| Dimensjon | Fieldbook | Signal | Quiet Phosphor |
|---|---|---|---|
| Token-migrering | Verdisubstitusjon + inversjon av alle hvit-alpha/mørk-antakelser | Verdisubstitusjon + lys-inversjon + karbon-klasse | Verdisubstitusjon i samme polaritet (mørk→mørk) |
| Canvas/render | Trace-renderer «blekk-modus» (ny); dagslys-scener i Geometry (L) | Lys scene + mørk strek i alle canvas; 3D-relys (L) | Avvioletisering + glød-fjerning; dusk→grafitt [H høydepersepsjon] |
| Ny kapabilitet | Arkfane-nav + tilstandslag (L, board-tillegg) | **Replay-motor/scrubber (L, board-rekostet)** | Ingen ny motor-kapabilitet |
| Nav-risiko | Størst (uprøvd fanemodell + reflow-problemet) | Lav (hub+bug; tab bar avvist, måles) | Lavest (hub beholdt) |
| A11y-avvik funnet av board | Fokusring på ink-fylte elementer; SR-semantikk faner | Kant-census; AF-brakett-geometri | Chip-tilstand <3:1 (korrigert) |
| Fysikk/identifikatorer | Urørt i alle tre (board-bekreftet) | Urørt | Urørt |
| Samlet flate-kostnad (S/M/L-sum, korrigert) | Høyest (L: Home, Academy, Lab, nav) | Høy (L: Home, Academy, Geometry, Outcome) | Lavest (L kun Bench-Home; resten S/M) |
| Testbarhet/håndhevelse | Kontrast-CI + census (prosa-tungt ellers) | Komponent-census + budsjett-census | **Best: chroma-/par-separasjons-lint + grep-gates + signatur-sjekkliste** |

## 2. Beslutningsmatrise (board-rangeringer + CD-vekting)

| Kriterium (linse) | Vinner | Nest | Sist |
|---|---|---|---|
| Instrumentsannhet/golf | Signal | Quiet Phosphor | Fieldbook |
| Native UX/a11y | Signal | Quiet Phosphor | Fieldbook |
| Forretning/identitet | Quiet Phosphor | Fieldbook | Signal |
| Migreringsrealisme (teknisk) | Quiet Phosphor | Signal | Fieldbook |
| Differensiering utad | Fieldbook | Signal | Quiet Phosphor |

**Lesning [S]:** Ingen retning dominerer. Signal vinner håndverket men taper forretningslinsen på identitetskassasjon + lånt-gratis-kontrakt; Fieldbook vinner differensiering men taper begge håndverkslinsene og bærer størst uprøvd nav-risiko; **Quiet Phosphor er aldri sist**, vinner forretning + migrering, og dens gjenstående P1-er er lokale token-justeringer — ikke tese-svakheter.

**Syntese-vurdering (masterprompt-kravet):** En «QP + Signals replay-Outcome»-syntese ble vurdert og **avvist som unødvendig**: QPs Bench→EXPLAIN dekker samme produktlogikk uten replay-motorens L-kostnad; å grafte Signals karbonfelt/scrubber inn i QP ville vært et høflig kompromiss, ikke en objektiv forbedring. Det som derimot lånes på tvers (allerede i addenda): Fieldbooks ink-fylte chip-tilstand → QP; Signals census-disiplin → alle.

## 3. Anbefalt vei (til eierport FR-O1)

**Primær: Quiet Phosphor**, betinget av addendum-kravene (amber/gull-separasjon, contact-default 7 hues, chip-tilstand, Bench-blindtest etter oppgavebasert protokoll). Begrunnelse: mest konsistent på tvers av linser; bevarer blind-validert kapital og butikk-aktivum; eneste med maskinhåndhevbar doktrine; laveste vei til de retningsuavhengige inntektsgrepene.

**Utfordrer holdt i live: Signal.** Dens to styrker (replay-produktlogikk, kvantifisert disiplin) og dens avgjørende svakhet (WTP/lånt kontrakt) avgjøres av samme D-evidens (WTP- + thumbnail-test). Hvis eieren vektlegger håndverkslinsene tyngst, er Signal det legitime valget — med identitetskassasjonen som bevisst pris.

**Fieldbook anbefales ikke videreført** som helhet (sist på to linser, størst uprøvd risiko), men to elementer arves uansett: leksjonsanker-innsikten (tidsskrift-register støtter repricing — tas inn i paywall-copyarbeidet) og ink-fylt-chip-mønsteret.

**Migreringsstrategisk poeng [S]:** QPs trinn 1–3 (token-repek, avblurring, depth-sletting, hue-konsolidering, lov-lint) er gyldig delmengde av begge de andre retningene. Velges QP nå, er ingen dør lukket: Fieldbook/Signal forblir mulige som senere trinn 2-beslutning oppå et konsolidert tokensystem. Velges Fieldbook/Signal direkte, betales konsolideringen uansett — pluss polaritetsinversjonen.

## 4. Migreringsrekkefølge (for valgt retning; unngår to grammatikker side om side)

1. **Retningsuavhengig blokk først** (låses uansett, eierpakke del A): Outcome-eierflate bygges, G1-konsumenten, Impact Studio-konsolidering, døde kontrakter fjernes, `.sa-depth`/bloom slettes, Fraunces-beslutning effektueres, token-lovverk samles i ett hjem.
2. **Tokens + lint:** hele verdiskiftet i `sa-p3.css` + lint-vaktene, med geometry/impact-studios lokale speil migrert inn under samme sett (03 §6-kravet) — appen skifter drakt i ÉN commit-serie per flate, aldri halvveis.
3. **Flate-for-flate i evidensrekkefølge:** Range → Outcome → Home (med blindtest-gate) → Academy → Lab → Paywall; hver flate gjennom instrument-gates-regimet (manifest må revideres først — lov 5/13-ordlyd er eiervalg).
4. **Evidensmanifest-revisjon** (lov 5/12/13-omformuleringer + nye lint-krav) skjer FØR flate-migreringene, med eiersignatur — ellers kan ingen flate aksepteres formelt.
5. Gamle UV-Ember-tokens beholdes som aliaser i én deprecation-periode (konsumenter utenfor allowlisten feiler synlig, ikke stille), deretter slettes de + sovende teal-fallbacks i sa.css.

## 5. D-evidenskrav (gates før implementering av valgt retning)

Fra board §5, bindende: (1) render-målte kontraster + CVD-simulering av full palett; (2) oppgavebasert Home-blindtest mot Night Ladder; (3) delt viewport-regneark (korrigert bokføring) + lesbarhets-gulv målt på enhet; (4) orienteringsmatrise per flate; (5) VO-/tastatur-spec for ny nav-chrome; (6) WTP-/thumbnail-test hvis Signal vurderes; (7) brukskontekst-evidens hvis Fieldbook gjenåpnes; (8) gating-telemetri før paywall-momentene re-plasseres.
