# Full Flightglass-revisjon — 11 Review Board over retningene (fase C-runde)

**Gjennomført:** 2026-08-05. Tre uavhengige board-agenter på fersk kontekst, én per linse (instrumentsannhet/golf, native UX/a11y, forretning/identitet), hver med egen etterberegning av kontrasttall og egne rangeringer. Full rådata i workflow-journal (lokal evidens).

## 1. Verdikter og rangeringer

| | Sannhet/golf | Native UX/a11y | Forretning/identitet |
|---|---|---|---|
| Fieldbook | REVIDER | REVIDER | REVIDER |
| Signal | REVIDER | REVIDER | REVIDER |
| Quiet Phosphor | REVIDER | REVIDER | REVIDER |
| **Rangering (best først)** | Signal · QP · Fieldbook | Signal · QP · Fieldbook | **QP** · Fieldbook · Signal |

Ingen retning bryter det låste fundamentet (fysikk, ærlighetsregistre, a11y-kontrakter, mørke mønstre, identifikatorer) — bekreftet eksplisitt av sannhetslinsen. Aritmetisk troverdighet er høy: alle 29 stikkprøvede WCAG-par og 10 OKLCH-konverteringer i retningsdokumentene matchet boardets egne beregninger.

## 2. P0/P1-funn og disposisjon

Ingen P0. P1-ene deles i to klasser: **(K)** korrigering skrevet inn som board-addendum i retningsdokumentet nå; **(D)** krav som gate i fase D/prototype før retningsvalg kan effektueres.

### Fieldbook
| Funn | Kjerne | Disp. |
|---|---|---|
| FB-1 varm triade nesten-metamer (signal/face/bad: 1.16/1.13:1 innbyrdes; ingen CVD-regel) | Re-deriver face+bad ≥8–10 ΔL; CVD-gate | K (addendum: revidert krav) + D |
| FB-2 signalbudsjett brutt på Home + §3.1/§4.10-motsigelse om hero-farge | Census-regel + re-komponering | K (motsigelse løst: metrikk-rad i blekk; carry-hero i signal KUN som del av live-cluster) |
| FB-3 reward-gull = warn-hex (reverserer gull-splitten 2026-07-11) | Separat reward-hex | K (alternativ-hex gjøres til krav, beregnes i D) |
| FB-P1-1 paywall bryter to låste fase 7-lover uflagget (annual anbefalt; outcome før pris) | Utfalls-demo + annual-merking, eller eksplisitt eiervalg-flagg | K (addendum korrigerer ORDER FORM) |
| FB-P1-2 nav-rearkitektur ukostet | Egen S/M/L-linje + prototype-gate FØR valg | K + D |
| FB-P1-3 sesong/brukskontekst aldri konsultert (dagslys vs vinter-inne) | Brukskontekst-evidens som D-krav | D |
| FB-N1 fanerad-minimering = layout-reflow midt i drag; 44 px-risiko | Overlay uten reflow, ikke-interaktiv minimert, binært prototype-krav | K + D |
| FB-N2 lov 9-landskapsbudsjett aldri regnet | Samme post-for-post-regnestykke som Signal (korrigert bokføring) | D |
| FB-N3 «ærlig kategoristandard-test» feiler: bleed-tabs ≠ native tab bar; SR-semantikk mangler | Omformulert påstand + tablist-/VO-spec | K (påstand omformulert i addendum) + D |

### Signal
| Funn | Kjerne | Disp. |
|---|---|---|
| SG-1 face↔bad kollapser (ΔL 1.7; 1.06:1) — det tredje paret i triaden ble aldri regnet | Re-deriver ≥8 ΔL; CVD-gate for alle tre par | K + D |
| SG-N1 tab bar-regnestykket dobbeltbokfører safe-area: reell marginalkostnad ~32 pt, ikke 53; modellflate ~187–198 pt, ikke 166 | Re-kjørt tabell med symmetrisk bokføring; konklusjonen (taper) består sannsynligvis, men er nå en målbar påstand, ikke aritmetikk | K (addendum korrigerer regnestykket og nedgraderer konklusjons-styrken ærlig) + D (lesbarhets-gulv måles) |
| SG-N2 hele regnestykket antar landskaps-Range, men shippet Range er portrettlåst — orienterings-reversering uflagget | Flagges som eiervalg; regnestykke for begge orienteringer | K (flagget) + D |
| SG-P1-1 lånt gratis-kontrakt (TV-tracer) kan undergrave prisankeret | WTP-test mot alternativ mock som D-krav | D |
| SG-P1-2 butikkhylle-testen: ofrer det navngitte konverteringsaktivumet (mørk striking tracer) | Thumbnail-A/B som D-krav; karbonfelt-scene som mulig Screenshot 1 | D |
| SG-P1-3 migrering under-koster Replay desk (replay-motor er ny kapabilitet) + paywall-hero | Re-kosting | K (addendum: Outcome M→L, paywall S/M→M) |

### Quiet Phosphor
| Funn | Kjerne | Disp. |
|---|---|---|
| QP-1 amber↔reward-gull ΔL 0.1 (1.03:1) — kollisjonen egen lint skulle fanget | Separer ≥8–10 ΔL (signal mot H50–55 eller gull mørkere); inn i CVD-gate + lint | K + D |
| QP-2 contact-sammenslåingen omdefinerer SYS-11 på kjernediagnostikk-flaten | **Bevisbyrden inverteres: 7. hue er default; sammenslåingen må VINNE brukertesten** | K (default snudd i addendum) + D |
| QP-P1-1 «~90 % i sa-p3.css» er retorikk som motsies av egen tabell | Strykes; S/M/L-tabellen står alene | K |
| QP-P1-2 intet svar på repricing-målet; austere paywall uten mitigering | Academy-som-pensum synlig på paywall; WTP-test som D-krav (samme test som SG-P1-1) | K + D |
| QP-N1 valgt chip-tilstand < 3:1 (line-strong alene) | ≥3:1-bærer (ink-fylt chip eller underline+dot); tilstandskontrast inn i linten | K |
| QP-N2 Bench-blindtesten er partisk per egen tese (statisk mock favoriserer scenografi) | Oppgavebasert interaktiv protokoll (5 s-forståelse, tid-til-tap, retur-med-kontekst) — fase 1-exitbevisene som fasit | K (protokoll spesifisert) + D |

## 3. Tverrgående funn (gjelder alle tre)

1. **Orienteringskarusellen er uløst av alle tre** (portrett-Home/Range/Academy vs landskaps-Geometry vs udefinert Studio) — orienteringsmatrise per flate er nå et D-krav for enhver finalist.
2. **Varmfamilie-trengsel er systemisk blindsone:** hver retning hadde minst ett uundersøkt nesten-metamert varmt par. CVD-simulering (protan/deutan/tritan) av samtlige varme/status/datahues er GO-gate i D.
3. **Lov 5-semantikken divergerer stille** (budsjett 3 vs 2; hero i signal vs ink vs transient) — én lov 5-ordlyd må vedtas av eier sammen med retningsvalget.
4. **Kontrast-evidens:** all tall er hex-matematikk til render-måling foreligger; render-måling + CVD er obligatorisk D-evidens for finalisten (alle tre).
5. **SR-/VoiceOver-semantikk for ny nav-chrome mangler i alle tre** — spesifiseres i prototypen.
6. **Prisstige-avviket** (99/590 låst vs 99/399/999-evidens) rammer alle tre paywall-presentasjoner — FR-O8 må ryddes.
7. **Positivt fellesfunn:** alle tre overtar Ask-kontraktens a11y-blokk ordrett, og alle tre bevarer ærlighetsregistrene.

## 4. Gruppetenk-sjekken (alle tre linser, konsolidert)

**Reelle konklusjoner (uavhengige bevislinjer utenfor 04):** Outcome-eierflate (inert flis er repo-faktum), G1-lukking, Impact Studio-konsolidering (shippet uten IA-hjem + SYS-01-brudd), depth/grain/blur-lagets død (bloom grep=0; Academy overstyrte laget aktivt), én display-stemme. Disse låses trygt retningsuavhengig.

**Delvis konstruert konvergens:** «Home-verdenen dør» og «tab bar avvises». Mandatet ga compliance-insentiv (minst to retninger MÅTTE bryte materielt), 04 hadde forhåndsdømt begge («challenge»/«reject»), og det ene kvantitative beviset mot tab bar inneholdt en bokføringsfeil i prior-ens favør. Ingen retning designet et «verden i ny materialitet»-alternativ. **Konsekvens (disposisjon):** Home-spørsmålet holdes åpent som reelt eiervalg med oppgavebasert blindtest mot shippet Night Ladder som obligatorisk evidens (QP-N2-protokollen); tab bar-spørsmålet er formelt åpent til det korrigerte regnestykket + lesbarhets-gulvet er målt på enhet.

## 5. Manglende evidens (konsolidert → D-krav i 10/12/14)

Brukskontekst-distribusjon (inne/ute/sesong/simbås) · thumbnail-/butikkhylle-A/B · WTP-/prisanker-test per uttrykk · render-målte kontraster på enhet · CVD-simulering · oppgavebasert Home-blindtest-protokoll m/ data · korrigert viewport-aritmetikk (delt regneark for alle retninger) · orienteringsmatrise · VO-/tastatur-spec for ny nav-chrome · gating-telemetri fra dagens app.

## 6. Status etter runden

Alle P1 har disposisjon: K-klassen er skrevet inn som **Board-addendum** i hvert retningsdokument (egen sluttseksjon, daterte korrigeringer — originalteksten står, korrigeringen er synlig); D-klassen er innarbeidet som gate-krav i `10-feasibility-review.md` og `12-prototype-spec.md`. Ingen åpne P0/P1 uten disposisjon. Rangeringene og gruppetenk-diagnosen bæres videre inn i eierpakken (14).
