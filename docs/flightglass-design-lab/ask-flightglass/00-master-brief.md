# Ask Flightglass — 00 Master brief

**Arbeidsområde:** `docs/flightglass-design-lab/ask-flightglass/` · **Branch:** `agent/ask-flightglass-spec`
**Fase:** Utredning og spesifikasjon (design + monetisering). **Ingen implementering.**
**Dato:** 2026-08-05 · **Forfatter:** Claude Code (Fable 5) som Creative Director + Technical Lead per masterprompt.
**Eierport:** Retning, monetisering, data-/LLM-grense og prototypevalg krever eksplisitt eiergodkjenning før implementering.

## Mandat

Ask Flightglass er en **tverrgående inngang til forståelse** — ikke en fjerde hovedfane, ikke et globalt chatvindu, ikke en flytende boble. Den møter golfspilleren som har ett konkret spørsmål («Hvordan får jeg mindre spinn med driver?») og ikke vil gå gjennom en hel Academy-leksjon. Et godt svar gjør fire ting, i rekkefølge:

1. Kort, forståelig svar i vanlig golfspråk.
2. Kobler svaret til den relevante årsakskjeden og tydelige forutsetninger.
3. Sier hva Flightglass **ikke** kan fastslå uten målt data.
4. Åpner riktig modell, forhåndsvalgte kontrollverdier, kuratert tabell eller Academy-leksjon (f.eks. Spin Loft/Backspin).

Deterministiske tabeller, verktøy og kuratert Flightglass-innhold har **forrang**. LLM brukes kun til fri formulering, forklaring og routing. Fysikkmotoren (`solveFlight` m.fl.) er fasiten; LLM eier aldri tall.

## Scope for denne fasen

**I scope:** kartlegging av eksisterende innganger (02), answer-contract med sannhetsgrunnlag og deeplink-register (03), tre etiske freemium-modeller med kostnads-/misbruks-/personvernanalyse (07), evalueringssett (11), forslag til representativ prototype (12), beslutningslogg (08), Review Board-runde (11-review-board), beslutningspakke til eier.

**Ikke i scope (eksplisitte ikke-mål):**
- Ingen produktkode, ingen endring i shipping-filer, `www/` eller mocks.
- Ingen LLM-leverandør velges, ingen API-nøkler, ingen backend/server, ingen Supabase/OpenAI (CLAUDE.md-grense).
- Ingen endring i fysikkfiler, beskyttede identifikatorer, lagringsnøkler eller prisarkitektur.
- Ingen ny hovedfane, ingen endring i den låste IA-en (Range/Academy/Lab).

## Navn

Arbeidsnavn: **Ask Flightglass**. «JARVIS» brukes ikke i produkt eller markedsføring uten separat juridisk avklaring (varemerke, Marvel/Disney). Mulig brukerrettet navn ved lansering: *Flightglass Guide* — beslutning utsatt til eierport.

## Kilder (sannhetshierarki for dette arbeidet)

1. Eierens brief 2026-08-05 (denne bestillingen).
2. `docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md` (produktlover, IA, kompatibilitetsgrenser).
3. Masterprompt `outputs/flightglass-design-lab-masterprompt-creative-director-review-board.md` (Ask Flightglass-kontrakt, faser, review-kontrakt).
4. `docs/SESSION-HANDOFF.md` («Current state 2026-07-28» overstyrer eldre branch-topologi; `main` er eneste sannhetskilde).
5. `docs/flightglass-autopilot/STATUS.md`, `COORDINATION.md`.
6. `docs/diagnose-spec-v2.md` + `docs/diagnose-v3-values-spec.md` (Diagnose-grensen).
7. `docs/monetization-strategy.md` (forretningsgrunnlag; ikke låst der den avviker fra masterplanen).
8. Systemvirkelighet i kode (ruter, handoff-nøkler, entitlement) — dokumentert i 02.

## Filstruktur og avvik fra malen

Masterpromptens mappestruktur er eksplisitt et eksempel. Dette arbeidsområdet bruker numrene der semantikken matcher og hopper over faser som ikke gir selvstendig leveranse i en spesifikasjonsfase:

| Fil | Innhold | Mal-fase |
|---|---|---|
| `00-master-brief.md` | Dette dokumentet | Fase 0 |
| `02-product-audit.md` | Innganger i Range/Academy/Lab/Diagnose + gap | Fase 1 |
| `03-answer-contract.md` | Answer-contract, LLM-grense, routing, deeplink-register | Fase 3/7 (kontrakt) |
| `07-business-review.md` | Tre freemium-modeller, kostnad, misbruk, outage, samtykke/data | Fase 6 |
| `08-decision-log.md` | Beslutninger, antakelser, åpne valg, avvik | Løpende |
| `11-evaluation-set.md` | Evalueringssett (mal-11 er review-board; boardets svar ligger i `11-review-board.md`) | Fase 13-forberedelse |
| `11-review-board.md` | Review Board-verdikt og respons | Fase 11 |
| `12-prototype-spec.md` | Én representativ prototype | Fase 9-forberedelse |
| `20-next-handoff.md` + `state.json` | Handoff og tilstand | Løpende |

Fase 2 (Golfer Reality), 4 og 5 (research) er komprimert inn i 02/03/07 som eksplisitt merkede antakelser og interne observasjoner — full research-runde er et åpent valg for eier hvis retningen godkjennes (logget i 08).

## Kontrollporter i denne fasen

- `npm run claude:ready` er **ikke** kjørt: arbeidet er docs-only og endrer ingen kontrollpakke-fil. Gaten gjelder implementering; første implementeringsøkt må kjøre den.
- `npm run verify:change --dry-run` er ikke relevant for nye docs-filer, men kjøres før commit for å bekrefte at ingen beskyttede filer berøres.
- COORDINATION.md er oppdatert med claim; ingen andre agenters filer berøres.

## Suksesskriterier (Definition of Done for denne fasen)

1. Alle åtte krav i eierens brief er besvart i et navngitt dokument.
2. Hvert tall i kostnadsmodellen har eksplisitt kilde eller er merket antakelse.
3. Deeplink-registeret peker på ruter som faktisk finnes i koden (verifisert mot systemvirkelighet).
4. Review Board har levert verdikt; alle P0/P1 har respons eller begrunnet avvisning.
5. Beslutningspakken gir eier et endelig, avgrenset sett valg — ingen implementering er startet.
