# Full Flightglass-revisjon — 08 Beslutningslogg

## Rammebeslutninger (denne fasen)

| # | Beslutning | Begrunnelse |
|---|---|---|
| FR-B1 | Arbeidsområdet er `full-redesign/`; Ask-arbeidsområdet (`../ask-flightglass/`, board-revidert 2026-08-05) gjenbrukes som kandidatgrunnlag, dupliseres ikke | Én sannhetskilde per tema |
| FR-B2 | `front-page-spec.md` klassifiseres som **historikk** (StrikeArc-æra; erstattet av shippet Night Ladder-Home og Flightglass-rebrand) — brukes som designarkeologi, ikke krav | STATUS/SESSION-HANDOFF er nyere systemvirkelighet |
| FR-B3 | Tre retninger: «Fieldbook» (dagslys/papir — materielt brudd), «Signal» (broadcast-grafitt — materielt brudd, inkl. ærlig tab bar-eksperiment), «Quiet Phosphor» (natt-destillasjon — kontinuitet som må vinne, ikke arve) | Startpromptens krav: minst to bryter hue/lys/materialitet/register; kontinuitet skal utfordres hardest av seg selv |
| FR-B4 | Screenshot-evidens kan ikke genereres i økten (Playwright ikke installert); dokumentert i 01 med kjørbare kommandoer; ingen nye avhengigheter installeres i docs-fase | Startpromptens grense «ingen ny ekstern avhengighet» + ærlig evidens |
| FR-B5 | Fundament som IKKE utfordres: fysikk-fasit, tall=sannhet, én dominant jobb, ærlighetsregistre, a11y-kontrakter, ingen mørke mønstre, engelsk UI (04 §6) | Startprompten låser opp uttrykket, ikke doktrinen |
| FR-B6 | Ingen nye bilder i noen retning; retningene må bevise seg i CSS/SVG/Canvas + eksisterende assets | Startprompt-grense |

## Åpne eiervalg (fylles ut gjennom fasene; endelig liste i 14-owner-package)

- FR-O1: Valg av retning (etter fase C + board + feasibility).
- FR-O2: Home: diegetisk sted (Night Ladder-arv) vs instrument-cluster — på tvers av retningene.
- FR-O3: Navigasjonsmodell: hub-and-spoke vs tab bar (avgjøres av Signal-eksperimentet + board).
- FR-O4: Impact Studios eierjobb i IA-en (shippet, men udefinert i masterplanens §6).
- FR-O5: Outcome som egen flate (kjerneløftets eierflate) — alle retninger må svare; strukturvalget er eierens.
- FR-O6: Ask Flightglass: inn i valgt retning fra start, eller etter Ask v0-piloten (jf. ask-arbeidsområdets O1–O4/O9 som fortsatt står åpne).
- FR-O7: Skjebnen til P3-tokens/`.sa-depth`/Fraunces-avviket ved valgt retning (migreringsplan i fase D).
- FR-O8: Prisstige-avviket 99/590 vs 99/399/999 (arvet fra ask-arbeidsområdets O6 — bør ryddes uansett retning).

## Antakelser

| # | Antakelse | Konsekvens |
|---|---|---|
| FR-A1 | Brukerpåstander i 04 §1 er hypoteser uten pilotdata | Retningsvalget må ikke hvile på én uverifisert jobb-rangering; boardet skal angripe dette |
| FR-A2 | Kontrastverdier i retningsdokumentene er beregnede anslag til de er maskinelt verifisert i prototypesteget | Prototypens vaktpass (impeccable+a11y) er sannhetstesten |
| FR-A3 | Migreringskostnader (S/M/L) er relative estimater uten timetall | Kalibreres i fase D-feasibility |

## Board-runde og fase D (2026-08-05)

| # | Beslutning | Begrunnelse |
|---|---|---|
| FR-B7 | Alle board-P1 disponert: K-klasse som daterte addenda i retningsdokumentene, D-klasse som gates i 10/12 | Review-loopens krav; ingen åpne P0/P1 uten disposisjon (11) |
| FR-B8 | Signals tab bar-regnestykke korrigert (safe-area-dobbeltbokføring); konklusjonen nedgradert fra «bevist» til «målbar påstand» | Board SG-N1; ærlig aritmetikk foran ønsket konklusjon |
| FR-B9 | QPs contact-sammenslåing: bevisbyrde snudd — 7 hues er default | Board QP-2 |
| FR-B10 | Home-spørsmålet holdes åpent med oppgavebasert blindtest som obligatorisk evidens; statisk mock-sammenligning ugyldig som avgjørelse | Boardets gruppetenk-funn + QP-N2 |
| FR-B11 | Syntese («QP + Signals replay») vurdert og avvist som høflig kompromiss | Masterprompt fase 8-regelen; 10 §2 |
| FR-B12 | Anbefaling til FR-O1: Quiet Phosphor m/ addenda; Signal som utfordrer m/ WTP-/thumbnail-gates; Fieldbook ikke videreført (to arvede elementer) | 10 §3, 14 §B |

## Avvik fra låste beslutninger (flagget, aldri stille)

Fylles ut i 14-owner-package per finalist: enhver retning som endrer Night Ladder-Home, P3-tokens, Fase 7-paywallpresentasjon eller shippet IA er et eierstyrt avvik fra tidligere låste beslutninger — det er hele poenget med denne bestillingen, men det skal navngis per punkt.
