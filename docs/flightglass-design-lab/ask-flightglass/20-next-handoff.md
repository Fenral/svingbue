# Ask Flightglass — 20 Next handoff

**Oppdatert:** 2026-08-05 · **Branch:** `agent/ask-flightglass-spec` (docs-only)

## Tilstand

Design- og monetiseringsspesifikasjonen er komplett og **revidert etter Review Board runde 1** (3× REVIDER → alle 17 P0/P1 implementert → uavhengig verifikasjon 17/17 bekreftet; se `11-review-board.md`). Ingen åpne P0/P1. Ingen shipping-fil, fysikkfil, mock eller identifikator er endret. `npm run claude:ready` er ikke kjørt (docs-only; gaten gjelder implementering). Endringsvakt dry-run: alle filer nivå A «documentation only».

## Eksakt neste handling

**EIERPORT.** Ingen implementering før eier eksplisitt har besvart O1–O4 i `08-decision-log.md` (retning, freemium-modell, data-/LLM-grense, prototype). Beslutningspakken er levert i samtalen og oppsummert i 08.

## Ved godkjenning, i rekkefølge

1. Bygg prototypen per `12-prototype-spec.md` (mock i `design/mocks/candidates/`, hardkodede AskAnswer-svar, deeplink mot `academy.html#/lesson/spin-loft`). Vaktpass som tabellkandidatene.
2. Lukk G1 (Range leser `sa.handoff.delivery` — den allerede spesifiserte §2.4-konsumenten) som egen liten endring med egen verifikasjon, hvis `range.preset` skal med i v1.
3. Skriv `ask-catalog.json` v1 (faste spørsmål) med evalsettet (11) som regresjonstest.
4. Først deretter: LLM-leverandørvalg mot kontrakten i 03 + kostnadsmodellen i 07 — egen eierbeslutning.

## Uløste risikoer

- Bruksrater i kostnadsmodellen er uverifiserte (A2/A3) — pilotmåling kreves.
- G2 (Diagnose ikke shippet) begrenser diagnose-rutingen til intensjon.
- Prisstige-avvik på tvers av dokumenter (O6) bør ryddes uavhengig av Ask.
