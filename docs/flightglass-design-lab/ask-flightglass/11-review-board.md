# Ask Flightglass — 11 Review Board (fase 11-runde 1)

**Gjennomført:** 2026-08-05. Tre uavhengige board-agenter på fersk kontekst, én per linse, uten tilgang til hverandres vurderinger eller hovedagentens hypoteser utover dokumentene selv. Full rådata i workflow-journalen (lokal evidens, ikke committet).

## Verdikter

| Linse | Verdikt | Kort tese |
|---|---|---|
| Produktsannhet / golfplausibilitet | **REVIDER** | Arkitekturen er riktig og 02 er kodeverifisert — men 03 §5 oversolgte håndhevelsen: struktur garanterte skjema/allowlist/talldiff, ikke kausal sannhet, cannot_say-relevans eller Diagnose-grensen; evalsettet manglet de mest sannsynlige bruddene |
| Native UX / instrumentlover / a11y | **REVIDER** | Kontrakten kunne ikke rendre sitt eget evalsett (skalar register), kvoteteller-regel motsa seg selv på tvers av 07/12, sheet-arkitekturen nestet seg selv, a11y manglet live regions/fokus-retur, prototypen kunne bestås vakuøst |
| Forretning / etikk / personvern | **REVIDER** | Margin regnet brutto (mva+provisjon utelatt; fair use-bruker ~break-even), kvotehåndheving forutsatte en unavngitt backend, gratis→Pro-loopen står i spenning med deterministisk forrang uten kvote-treffrate-antakelse |

Ingen AVVIS. Samlet: 3 P0, 11 P1, 15 P2, 9 P3.

## Disposisjon P0/P1 (alle akseptert og implementert i revisjon 2026-08-05)

| Funn | Disposisjon | Hvor |
|---|---|---|
| NAT-P0-1 skalar `register` kan ikke bære blandede registre; E8/R6/R9 uuttrykkbare | **Implementert:** `NumToken` med register per tall + `user-echo`-klasse unntatt grounding men aldri model-typografi | 03 §1 |
| BIZ-P0-1 margin regnet brutto; fair use-bruker break-even/negativ | **Implementert:** netto proveny-tabell (eks. mva, 15/30 %), fair use 300→150, S-klasse som default-krav, headline-kostnad uten cache | 07 §0–1 |
| BIZ-P0-2 kvotehåndheving krever backend som ikke var navngitt/priset | **Implementert:** §2b håndhevingsarkitektur (proxy, server-side kvote, kostnadslinje A8), nytt eiervalg O9, og trinnvis anbefaling (Ask v0 uten backend først) | 07 §2/§2b, 08 |
| TRU-P1-1 grounding ikke strukturelt håndhevbar; R4-fasit bakte inn folklore | **Implementert:** sitat-spenn per årsaksledd (substring-validert); ærlig mekanisme↔regel-tabell; R4-fasit omskrevet til vakuøst-ærlig svar | 03 §1/§5, 11 R4 |
| TRU-P1-2 tallsmugling (tallord, feil kontekst, F8 kun eval) | **Implementert:** normalisering av tallord/relative kvanta, token→celle-binding, F8 som runtime-regel 7, usporbart → fallback; T1–T3-fristelsescaser | 03 §1/§5, 11 §2d |
| TRU-P1-3 cannot_say semantisk, ikke strukturell | **Implementert:** skjema-obligatorisk per intensjonsklasse, satt av ruting, fravær = valideringsfeil | 03 §1 regel 3 |
| TRU-P1-4 diagnose-grense/eval-hull (nær-grense, flertur, antonymer; klassifisering delt med formulering) | **Implementert:** separat klassifiseringskall, terskel + tvetydighetsregel, flertur-re-klassifisering; nye evalseksjoner 2a/2b/2c | 03 §3, 11 |
| TRU-P1-5 R1-eksemplet ensidig (treffhøyde utelatt, spinnvindu utelatt) | **Implementert:** R1-fasit omskrevet (spin loft + treffhøyde + vindu) i 03-eksemplet, 11 R1 og 12 Beat 2 | 03 §4, 11, 12 |
| NAT-P1-1 kvoteteller-motsigelse 07 vs 12 | **Implementert:** én regel — teller i header fra åpning (status), Pro-linje etter levert verdi (salg) — i begge dokumenter | 07 §2, 12 Beat 2/4 |
| NAT-P1-2 sheet-i-sheet | **Implementert:** in-place push/pop, eksplisitt stacking-forbud | 03 §1 regel 4, §6 |
| NAT-P1-3 a11y-hull (live region, busy, fokus-retur, retur fra deeplink) | **Implementert:** bindende a11y-avsnitt + prototype-kriterium med SR-gjennomgang | 03 §6, 12 §3 |
| NAT-P1-4 prototype vakuøs (ingen tall-registre, ingen fallback-tilstand, ingen landskap) | **Implementert:** katalog R1+R9+R7+E1, Beat 5 fallback, alle fire viewporter, ikke-vakuøse tallkrav, tastatur-oppe-kaptura | 12 |
| NAT-P1-5 Home-inngang uforenet med låst Fase 1-Home + eksisterende `?` | **Implementert:** Home-inngang utsatt (O10); v1 = Range/Outcome/Lab + Academy | 03 §6, 08 |
| BIZ-P1-1 loop i spenning med deterministisk forrang; ingen treffrate-antakelse | **Implementert:** A7 som navngitt antakelse + primær pilotmetrikk med A/B-avgjørende terskel; 12–20 %-referansen avvæpnet | 07 §2/§6, 08 |
| BIZ-P1-2 entitlement-lekkasje via grounding | **Implementert:** entitlement-felt per korpusstykke + lekkasjeregel (gratis svar kun over fritt innhold; gate-deeplink ellers) | 03 §2 |
| BIZ-P1-3 «removes the limit» uten fair use-disclosure | **Implementert:** disclosure-krav i copy + F9-evalcase | 07 §2, 11 §3, 12 Beat 4 |
| BIZ-P1-4 org-tak uten degraderingspolicy | **Implementert:** degraderingsrekkefølge (gratis-LLM først, Pro varsles ærlig, deterministisk upåvirket) | 07 §2b |

**Avviste P0/P1: ingen.**

## Disposisjon P2/P3 (utvalg; resten logget)

Implementert: violet kun på taught terms (12), «free · always»-merking + tellersemantikk (07), kontekst-chip-UI (03 §6), retur-reise/trådlevetid (03 §6/12), cache-realisme + oppfølgingsdobling i kostnadstall (07), kill-kriterier (07 §6), GDPR-innstramming + butikkpolicy (07 §5), reset-semantikk kalenderuke (07), «keeps your answers on this device»-copy (07/12), face-error-cost-tabellens status korrigert (02 §3), R2-deeplink låst, cannot_say-formular endret til «doesn't measure your swing», off-domain-kvoteregel med kostnadstak (07 §4), katalog-invalidasjon ved tabellregenerering (03 §2), uttømmende ID-lister (03 §4), `range.preset`-provenance («Example delivery — not yours») (03 §4), legacy-rutens stabilitetsrisiko logget (A9).

Logget uten spec-endring (P3/smak, tas i prototypen): målbart «diskret»-kriterium for Range-affordancen; blindtest av struktur-tetthet på 375×812; E5-avvisning som deterministisk gratis-respons.

## Gjenstående til neste board-runde (før/med prototypen)

1. Tre utfylte AskAnswer v2-eksempelinstanser (R6, E8, R9) som validerer mot revidert skjema — leveres med `ask-catalog.json`-utkastet i prototypesteget.
2. Screenshot-bevis for `academy.html#/lesson/spin-loft`-deeplinken (prototypens kriterium 2).
3. Terskeltall for lokal intent-match kalibrert mot 11 §2b.
4. Grounding-avklaring for R7 («how much» i kaldt vær — finnes det et kuratert EST-tall i air-density-innholdet?).

## Verifikasjonsrunde (loopens steg 6)

En uavhengig verifikasjonsagent kontrollerte at hver P0/P1-disposisjon faktisk er implementert der tabellen hevder — ikke bare omtalt. **Resultat: 17/17 BEKREFTET**, med tre etterslep som deretter ble rettet: (1) utgått «300/mnd» i Modell A-tabellen → 150/mnd med kjøps-disclosure; (2) «i samme emne» → «per tråd» samme sted; (3) A4-ordlyden oppdatert til S-klasse-default. Ingen andre regresjoner eller stale referanser funnet.

**Status etter runde 1 + verifikasjon:** Ingen åpne P0/P1. Spesifikasjonen er klar for eierport. Neste board-runde (over prototypen) skal dekke de fire gjenstående punktene i seksjonen over. Menneskelige porter (blindtest, VoiceOver o.l.) gjelder først ved implementering.
