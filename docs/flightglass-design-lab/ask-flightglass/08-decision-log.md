# Ask Flightglass — 08 Beslutningslogg, antakelser og åpne valg

## Beslutninger tatt i dette arbeidet (innenfor mandatet)

| # | Beslutning | Begrunnelse | Hvor |
|---|---|---|---|
| B1 | Ask er et lag/sheet over eksisterende flater, aldri fane/boble/global chat | Masterprompt-kontrakt + produktlov 1/2 | 03 §6 |
| B2 | Answer-contract som strukturert objekt med skjemavalidering; LLM fyller felt, render håndhever | Ærlighet må håndheves strukturelt, ikke ved prompt-høflighet (jf. Babyora-lærdom: prosa håndhever ikke seg selv) | 03 §1/§5 |
| B3 | Deterministisk forrang med lokal intent-match før LLM; ute-av-domene og diagnose-intensjon fanges før modellkall | Kostnad, offline-robusthet, ærlighet | 03 §3 |
| B4 | Deeplink kun fra allowlist-register; URL bygges aldri av LLM | Injection-flate + korrekthet | 03 §4 |
| B5 | `academy.concept.{id}` (legacy `#/lesson/`-ruten) er primær deeplink-form | Eneste rute med begrepsnivå-presisjon som virker i shippet kode i dag | 02 §2, 03 §4 |
| B6 | Surface-deeplinks brukes ikke i v1 | 12 av 14 renderere ignorerer surface-segmentet (G4) | 02 §5 |
| B7 | Anbefalt freemium: Modell A (3/uke) med synlig teller og forenklet oppfølgingsregel | Eierens kandidat validert mot kostnad/loop; «samme emne» ikke håndhevbart ærlig | 07 §2 |
| B8 | Ingen ny SKU; eksisterende `pro`-entitlement via `saShots.isPro()` | Kompatibilitetsgrense + enklest ærlige modell | 07 §0, 02 §2 |
| B9 | Prototype = mock i `design/mocks/candidates/` med hardkodede svar, deeplink mot ekte Academy-rute | Beviser løkken uten LLM-valg eller shipping-risiko | 12 |
| B10 | Arbeidsnavn Ask Flightglass; «JARVIS» aldri uten juridisk avklaring | Eierkrav + varemerkerisiko | 00 |
| B11 | *(board-revisjon)* Tall som typede `NumToken` med register per tall + `user-echo`-klasse; sitat-spenn per årsaksledd; `cannot_say` skjema-obligatorisk per intensjonsklasse; ærlig mekanisme↔regel-tabell (strukturell vs eval-håndhevet) | Board P0-1, P1-1..3 (native + truth) — kontrakten kunne ikke uttrykke sitt eget evalsett, og §5 oversolgte håndhevelsen | 03 |
| B12 | *(board-revisjon)* To-trinns ruting: separat billig klassifiseringskall før formulering; terskel + tvetydighetsregel for lokal match; flertur re-klassifiseres per tur | Board P1-4 (truth): klassifisereren skal ikke tjene på å svare; antonym-feiltreff er sannhetsrisiko | 03 §3 |
| B13 | *(board-revisjon)* Marginer regnes netto (mva + provisjon); fair use 150/mnd med kjøps-disclosure; S-klasse som default-krav; kill-kriterier; degraderingsrekkefølge; DPA/overføringsmekanisme bindende; privacy/terms-oppdatering som lanseringsgate | Board BIZ-P0-1, BIZ-P1-3/4, BIZ-P2-4/5 | 07 |
| B14 | *(board-revisjon)* Anbefalingen er nå trinnvis: **Ask v0 (deterministisk-only, ingen backend) først**, deretter Modell A når O9 (backend) er godkjent og A7-målingen støtter kvotemekanikken | Board BIZ-P0-2 + BIZ-P2-1: LLM-kvote krever proxy-backend; v0 måler etterspørselen gratis | 07 §2/§2b |
| B15 | *(board-revisjon)* Home-inngangen utsatt til etter prototype-validering (O10); v1-innganger er Range/Outcome/Lab + Academy | Board P1-5 (native): Floodlights-Home er låst med egne exit-bevis; masthead-`?` er allerede en spørsmålsinngang | 03 §6 |
| B16 | *(board-revisjon)* Sheet-stacking forbudt (in-place push/pop); bindende a11y-krav (aria-live, aria-busy, fokusflyt, retur-fra-deeplink); prototype-katalog R1+R9+R7+E1 med ikke-vakuøse tallkrav, fallback-tilstand og landskapskaptura | Board P1-2/3/4 (native) | 03 §6, 12 |

## Antakelser (merket i dokumentene der de brukes)

| # | Antakelse | Konsekvens hvis feil |
|---|---|---|
| A1 | 1 USD ≈ 10 NOK | Kostnadstabellene skalerer lineært |
| A2 | Bruksrater (13/mnd gratis, p50 20 / p95 150 Pro) — UVERIFISERT | Marginene i 07 §1 må reberegnes fra pilotdata |
| A3 | Tokenformer (2 500 cachebar + ~1 000 fersk inn / ~500 ut) | Samme |
| A4 | *(revidert)* S-klasse er default for formulering over kuratert innhold; M kun hvis evalsettet beviser behovet | Avgjøres av det utvidede evalsettet (11), ikke antatt; kostnadskonsekvens i 07 §1 |
| A5 | Diagnose shippes på et tidspunkt (G2) | Ask-ruting til Diagnose forblir intensjon; F1-regelen gjelder uansett |
| A6 | Ukeskvote skaper vane bedre enn månedspott | Pilotmåling; C er fallback |
| A7 | *(ny, board-krav)* Kvote-treffrate: ukjent andel spørsmål passerer katalogen til LLM, og ukjent andel gratisbrukere møter 3/uke-grensen — **hele A-vs-B-valget hviler her** | Måles i Ask v0-piloten; terskel i 07 §6 kill-kriterier |
| A8 | *(ny)* Proxy-backend for kvote/nøkkel koster < 100 NOK/mnd ved pilotvolum | Reberegnes ved O9-beslutningen |
| A9 | *(ny, board-flagget)* Legacy-ruten `#/lesson/{conceptId}` forblir stabil — Ask sin mest presise deeplink hviler på en rute koden kaller legacy | Alternativ: kanonisk concept-parameter (liten Academy-endring, eiervalg) |

## Åpne valg til eier (utenfor min myndighet)

| # | Valg | Alternativer |
|---|---|---|
| O1 | Retning: godkjenne Ask Flightglass-konseptet som spesifisert (etter board-revisjon) | Godkjenn / revider / avvis |
| O2 | Freemium-vei | **Trinnvis v0→A (anbefalt)** / B som trinn 2 / C |
| O3 | Data-/LLM-grense: godkjenne samtykke-, minimerings- og retention-modellen i 07 §5 (inkl. DPA-/overføringskrav og privacy-oppdatering som lanseringsgate) som bindende kontrakt før leverandørvalg | Godkjenn / stram inn |
| O4 | Prototype: bygge utsnittet i 12 (revidert katalog R1+R9+R7+E1) | Ja / endre utsnitt |
| O5 | Brukerrettet navn ved lansering (Ask Flightglass vs Flightglass Guide) | Kan utsettes til etter prototype |
| O6 | Prisstige-avviket: masterplan 99/590 vs monetization-strategy/diagnose-v3 «99/399/999» | Rydd én gang; påvirker ikke Ask-marginene (netto-tabellen i 07 §1 bruker masterplan-låsen) |
| O7 | Norsk input (E5): svare på engelsk med norsk forståelse, eller engelsk-only | Anbefaler engelsk svar på norsk input |
| O8 | Full research-runde (mal-fase 2/4/5) før implementering, eller rett til prototype | Anbefaler rett til prototype; research ved behov |
| O9 | *(ny, board-krav)* Backend-godkjenning: minimal proxy for LLM-nøkkel + server-side kvote (ny ekstern avhengighet; 07 §2b). Forutsetning for ethvert LLM-lag | Godkjenn ved trinn 2 / avslå (→ Ask forblir v0/deterministisk) |
| O10 | *(ny)* Home-inngangens skjebne (inkl. masthead-`?`) — etter prototype-validering, målt mot Fase 1-exit-bevisene | Utsatt |

## Avvik og observasjoner

- **AVVIK-1:** Ingen — ingen låst beslutning i masterplanen motsies av denne spesifikasjonen. Ask endrer ikke IA-en; den er en tverrgående inngang per masterpromptens egen definisjon.
- **OBS-1:** `impact.html?play=1` fra Home er inert (02 §2) — eksisterende defekt utenfor scope, bør på backlog.
- **OBS-2:** `sa_swing` er en død kontrakt (skrives, leses aldri) — ryddekandidat ved neste arkitekturpass.
- **OBS-3:** Prisstige-uenighet på tvers av tre dokumenter (O6).
