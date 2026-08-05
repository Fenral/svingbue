# Full Flightglass-revisjon — 01 Environment & evidence

**Dato:** 2026-08-05 · **Miljø:** Windows 10, repo på `main`-avlegger `agent/full-redesign-lab` (fra `agent/ask-flightglass-spec`, som er `main` + Ask-spesifikasjonen).

## Miljøstatus (prøvd, ikke antatt)

| Kontroll | Resultat |
|---|---|
| `npm run verify:change` (docs-scope, dry-run + reell) | PASS nivå A tidligere i økten (Ask-arbeidet); samme regime gjelder her |
| `npm run claude:ready` | **Ikke kjørt** — krever full testmatrise inkl. Playwright; se under. Gaten gjelder implementering; denne fasen endrer ingen kontrollpakke-fil |
| Playwright-harness (`ux:baseline`, `test:visreg`, screenshots) | **Delvis kjørbart (oppdatert senere i økten):** `npm ci --prefix tools` gjenopprettet repoets deklarerte `playwright-core`, og browser-spotene kjører mot system-Edge/Chrome/WebKit uten browser-nedlasting — verifisert ved triptyk-mockens nivå B-gate (chromium + webkit spot, 2 cases, 0 kritiske). Full `ux:baseline`-kaptura er fortsatt uverifisert i denne økten |
| Node-baserte skript uten browser (change-gate, generatorer) | Fungerer (verifisert via change-gate og tidligere kjøringer) |
| Git-fjernlager | Push til feature-brancher fungerer (verifisert med `agent/ask-flightglass-spec`) |

## Evidenspakke — hva som finnes, hva som mangler

**Tilgjengelig committet/etablert evidens (gjenbrukes som baseline-referanse):**
- `outputs/academy-batch0/` — Academy Home-kapturer (committet).
- STATUS-dokumentert evidens for Night Ladder-Home (17/17 manifest, 4 viewporter, reduced motion) og Backspin STUDIO-GRADE — evidensstier i `docs/flightglass-autopilot/STATUS.md`; selve kapturene er lokal evidens på byggemaskinen, ikke committet.
- `p3-ember-tracer.png`, `preview-*.png` i rot — historiske designforhåndsvisninger (mock-arv, ikke shippet sannhet).

**Gap (ærlig deklarert):** ferske screenshots av dagens shippede flater i alle fire målviewporter + reduced motion kan ikke genereres i denne økten. Baseline-revisjonens visuelle påstander bygger derfor på (1) kildekoden selv (CSS/HTML lest direkte — den sterkeste kilden for token-/lovetterlevelse), (2) committet evidens over, (3) STATUS-ledgerens verifiserte beskrivelser. Påstander som KREVER pixel-evidens (f.eks. faktisk kontrast over foto-bakgrunn) merkes UNVERIFISERT-VISUELT i 02/03.

**Kjørbar kommando for eier/neste implementeringsøkt** (lukker gapet på minutter på en maskin med browsere):
```powershell
npm ci; npx playwright install chromium webkit
node scripts/flightglass-ux-audit.mjs --mode baseline --surface home --motion both
node scripts/flightglass-ux-audit.mjs --mode baseline --surface academy-home --motion both
# + impact/geometry/impact-studio etter manifestets surface-id-er (config/flightglass-surfaces.json)
```

## Konsekvens for fasene

- Fase A leveres med kode-sannhet + eksisterende evidens; visuell verifikasjon av retningskandidater (fase C) skjer uansett først i prototypesteget (mock-vaktpass), som alltid har vært planen.
- Fase D-eierpakken lister «fersk evidenspakke» som første handling i implementeringsøkten, før noen visuell migrering starter.
