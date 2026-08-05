# Full Flightglass-revisjon — 00 Master brief

**Arbeidsområde:** `docs/flightglass-design-lab/full-redesign/` · **Branch:** `agent/full-redesign-lab`
**Fase:** Design- og produktarkitekturfase. **Ingen kodeimplementering.**
**Dato:** 2026-08-05 · **Rolle:** Claude Code (Fable 5) som Creative Director + Technical Lead per masterprompt; uavhengig Review Board per review-kontrakten.
**Bestilling:** eierens startprompt `outputs/flightglass-claude-code-start-prompt-full-redesign.md` (2026-08-05), under masterprompten `outputs/flightglass-design-lab-masterprompt-creative-director-review-board.md`.

## Mandat

Full, beslutningsklar revisjon av Flightglass som ETT sammenhengende system: produktarkitektur, funksjonssett, IA, navigasjon, designsystem, farge-/lysretning, typografi, komponentgrammatikk, motion, haptikk, tilgjengelighet og monetiseringsplassering. Dette er ikke en reskin og ikke bare en Ask-utredning — Ask Flightglass er én produktkandidat i revisjonen, vurdert mot Academy, Diagnose og Lab (grunnlag: det board-reviderte arbeidsområdet `../ask-flightglass/`).

**Ultraviolet Ember er uttrykkelig ulåst.** Ink/Violet/Ember, nattegraderingen, varm tracer, plate-estetikk og typehierarkiet utfordres aktivt; minst to av tre retninger skal bryte materielt i huefamilie, lyslogikk, materialitet og emosjonelt register. Ingenting beholdes uten å vinne mot reelle alternativer.

## Faste grenser (fra startprompt + repo-regler)

- Ingen endring i fysikkfilene; alle beskyttede identifikatorer og lagringsnøkler bevares eksakt.
- Ingen produktkode, LLM-leverandør, API-nøkler, backend, database eller ny ekstern avhengighet.
- Ingen nye bilder; eksisterende assets/CSS/Canvas/SVG har forrang til et dokumentert asset-gap er bevist.
- Produkt-UI engelsk; interne dokumenter kan være norske.
- Stopp kun ved: normativ konflikt, beskyttet fysikk, manglende autorisasjon, tre mislykkede rotårsaksforsøk, uerstattelig asset, uverifiserbart evidenskrav.

## Fire beslutningsfaser og leveransekart

| Fase | Leveranse | Fil |
|---|---|---|
| A. Baseline | Funksjonsmatrise, IA-/navigasjonskart, designinventar (CSS-sannhet vs dok vs mock-arv), Ultraviolet Ember-kritikk, evidenspakke, behold/endre/slå sammen/fjern per flate | `02-baseline-audit.md`, `03-design-inventory.md`, `01-environment-and-evidence.md` |
| B. First principles + research | Golferjobber, rolleavklaring Range/Outcome/Academy/Diagnose/Ask, adopt/adapt/reinvent/reject-vurderinger, fjerningskandidater | `04-first-principles.md` |
| C. Tre komplette retninger | Tre fundamentalt ulike retninger med fulle designsystem-kandidater (tokens, lyslogikk, typografi, komponenter, motion, haptikk), anti-brief, instrumentlov-etterlevelse, Ask-plassering, freemium-logikk, feasibility-skisse | `09-direction-{1,2,3}-*.md` + `09-directions-overview.md` |
| D. Beslutningsklar kandidat | Feasibility, designsystem-kontrakt m/ UV-Ember-migrering, IA-/funksjonskart, migreringsrekkefølge, prototype-spec, review-pakke, eierpakke | `10-feasibility-review.md`, `12-prototype-spec.md`, `11-review-board.md`, `14-owner-package.md` |

Løpende: `08-decision-log.md`, `state.json`, `20-next-handoff.md`.

## Kildehierarki og forhold til låste beslutninger

Masterplanens sannhetshierarki gjelder, med startpromptens eksplisitte opplåsninger: dagens palett, navigasjon og mocks er **baseline for granskning**, ikke automatisk vinner. Der en retning avviker fra en tidligere låst beslutning (f.eks. Fase 1 Night Ladder-Home, P3-tokens, Fase 7-paywallpresentasjon), dokumenteres avviket eksplisitt som eiervalg — aldri som stille redesign. Merk skillet: **fysikk, identifikatorer, ærlighetsdoktrine og instrumentlovenes intensjon er IKKE ulåst** — bare deres visuelle/strukturelle uttrykk.

Nøkkelkilder: masterplan (§2 produktlover, §6 IA, §7 faser), STATUS/SESSION-HANDOFF (hva som faktisk er bygget og akseptert), DESIGN-SYSTEM.md + `sa-p3.css` (CSS-sannhet), front-page-spec.md (**historisk** — StrikeArc-æra, erstattet av shippet Night Ladder-Home), diagnose-spec v1/v2/v3, monetization-strategy.md, ask-flightglass-arbeidsområdet (board-revidert 2026-08-05).

## Suksesskriterier (DoD for denne fasen)

1. Baseline er sporbar: hver påstand om dagens app har fil:linje- eller dokumentreferanse; CSS-sannhet, dokumentasjon og mock-arv er eksplisitt adskilt.
2. Tre retninger er reelt ulike (hue-familie, lyslogikk, materialitet, emosjonelt register — ikke tre paletter), hver med komplett tokensett og anti-brief; minst to bryter materielt med Ultraviolet Ember.
3. Uavhengig Review Board har vurdert retningene; alle P0/P1 har respons eller begrunnet avvisning.
4. Eierpakken navngir: anbefalt retning, bevis, hva som fjernes, kostnad, åpne risikoer og de irreversible valgene som krever eiergodkjenning.
5. Ingen implementering; status/handoff/koordinering oppdatert per repo-regler.

## Kjente evidensbegrensninger

Screenshot-/evidenspakken avhenger av at Playwright-harnesset kan kjøres lokalt i denne økten; hvis ikke, dokumenteres gapet ærlig i `01-environment-and-evidence.md` med henvisning til eksisterende committet evidens (`outputs/academy-batch0/`, evidens-referanser i STATUS) og en kjørbar kommando for eier.
