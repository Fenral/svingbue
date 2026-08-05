# Ask Flightglass — 02 Product audit: eksisterende innganger og gap

**Metode:** Systemvirkelighet lest fra koden på `main` (2026-08-05), ikke fra mocks eller planer. Fil:linje-referanser er verifisert av to uavhengige kartleggingsagenter. UNVERIFISERT er merket.

## 1. Hva som faktisk shippes

Native-allowlisten (`scripts/copy-web.mjs:33-41`) er nøyaktig: `index.html`, `impact.html`, `geometry.html`, `impact-studio.html`, `academy.html`, `terms.html`, `privacy.html`. Alt som matcher `*-mock.html` og `*-glass.html` ekskluderes — **Diagnose (`diagnose-mock.html`), Strike Window 2D (`geometry-window-mock.html`) og Visualise-mockene shippes ikke** og er ikke lenket fra noen shippet side.

## 2. Innganger per territorium (dagens tilstand)

### Home (`index.html`)
- Fem destinasjoner (`index.html:138-154`): Range (`./impact.html`), Lab (`./geometry.html`), Outcome (`./impact.html?play=1`), Academy (`./academy.html`), Impact Studio (`./impact-studio.html`).
- Eneste «hjelp/spørsmål»-affordance på Home er `?`-lenken i mastheaden → `./academy.html` (`index.html:111`). **Det finnes ingen søke-, spørsmåls- eller Ask-inngang i produktet i dag.**
- `?play=1` på Outcome-flisen er **inert**: `impact.html` leser ingen query-parametre. Golferen som klikker «Outcome» får samme skjerm som Range. (Eksisterende defekt, ikke skapt av dette arbeidet; relevant fordi den viser at deeplink-med-tilstand aldri er blitt implementert på shippet Range.)

### Range / Impact (`impact.html`)
- **Null innkommende tilstands-plumbing**: ingen `URLSearchParams`, ingen `location.hash`-ruting, ingen `localStorage`-lesing. Starttilstand er hardkodet (`impact.html:310-316`).
- Ingen paywall-import, ingen shot-telling på shippet Range.
- Et konkret spørsmål som oppstår her («hvorfor slicer denne?») har i dag ingen vei til svar utenom å forlate skjermen og lete i Academy.

### Lab (`geometry.html`)
- Leser/skriver `sa.geo.shared` `{planeAngle, swingDirection, lowPointX, lowPointZ, t}` (`geometry.html:573-587`, `1287-1304`) — delt kun med den *ushippede* Strike Window-mocken.
- Skriver `sa_swing {clubPath, attackAngle}` med kommentar «consumed by impact.html» — men **ingen leser den noe sted** (repo-bred grep). Død kontrakt.
- `?`-knappen replayer first-run-gjennomgangen (`sa-firstrun.js`) — veiledning, ikke spørsmålssvar.

### Academy (`academy.html`)
- Hash-ruter, ingen query-parametre: `#/academy` (hjem), `#/explore`, kanonisk `#/experience/{id}[/surface/{0-5}]`, legacy `#/lesson/{conceptId}` (`academy-router.js:5-26`).
- 13 kjerneopplevelser + 1 valgfri lab eier alle 24 legacy-konsept-ID-er nøyaktig én gang (`academy-curriculum.js:17-35`). **`spin-loft` og `backspin` eies begge av `backspin`-opplevelsen** — eierens eksempel («mindre spinn med driver» → Spin Loft) deeplinker til `academy.html#/experience/backspin`.
- Legacy-ruten `#/lesson/{conceptId}` gir *begrepsnivå*-targeting: renderer åpner tilhørende begrepsark automatisk (`academy-experience-host.js:10,19` + `CONCEPT_SHEETS`). Dette er den mest presise deeplink-formen som finnes i dag.
- Surface-segmentet valideres av routeren (0–5), men **kun 2 av 14 renderere respekterer det** (backspin-native og plane-coupling-lab); de 12 andre gjenopptar lagret surface. Ask bør derfor ikke love surface-presis deeplinking generelt (logget som gap G4).
- Ingen ruting-gating: en deeplink til en gyldig opplevelse mounter selv om forutsetninger ikke er møtt (`resolveAcademyRoute` gjør ingen prerequisite-sjekk). Greit for Ask (aldri tvinge læringsløp), men svaret bør nevne forkunnskap når relevant.

### Diagnose My Shot (`diagnose-mock.html` + `diagnose-engine-v2.js`)
- Strukturert coach-intervju S0–S5 med reveal (v2) og verdilinjer (v3). **Ikke shippet, ikke lenket** fra shippet app; kun fra ushippede home-konsepter.
- Skriver tre handoff-artefakter som **ingen leser**: `sa.handoff.delivery` (v1-skjema med 5 delivery-parametre, `diagnose-engine-v2.js:438-452`), `sa.handoff.compare` (a/b-par, `:549-553`), samt query-speilet `?from=diagnose&speed&face&path&attack&loft` mot `impact-viz-mock.html` som heller ikke håndterer det. Konsumentsiden er eksplisitt «a later ~12-line commit» (`docs/diagnose-spec.md:82-89`).

### Paywall/entitlement
- Én entitlement: `pro` (`sa-iap.js:36`), runtime-flagg via `saShots.isPro()` (`sa-shots.js:29`). `shouldGate()` er av på web og ikke koblet på shippet Range. Ask Flightglass kan gjenbruke nøyaktig denne kjeden for kvote/Pro-sjekk — ingen nye ID-er.

## 3. Hvor konkrete spørsmål går i dag (gap-analysen)

| Situasjon | Dagens vei | Vurdering |
|---|---|---|
| «Hvorfor slicer jeg?» midt i Range | Ingen. Forlate skjermen → Academy-forsiden → finne Start Line/Shape selv | Gapet Ask skal fylle |
| «Hva betyr spin loft?» i en leksjon | Begrepsark (violet tap-to-define) — fungerer godt *inne i* leksjonen | Behold; Ask skal ikke duplisere |
| «Hva er galt med svingen min?» | Diagnose-intervjuet — men det er ikke shippet og ikke lenket | Diagnose forblir eneste diagnosevei; Ask tilbyr å starte den, aldri erstatte den |
| «Hvor mye koster 2° face-feil?» | Rå tabelldata finnes (`design/mocks/candidates/data/tabell-face-error-cost-by-club.json`, solveFlight-derivert) — men denne tabellen **bestod ikke vaktpasset** (kontrastfeil i scrim, jf. §4) og er ikke i 03-registeret. Spørsmålet mangler godkjent grounding inntil tabellen består | Kandidat, ikke klar; må gjennom vakt før Ask-forrang |
| Generelt golfspørsmål utenfor modellens domene | Ingen | Ask svarer ærlig «cannot determine» + ev. ekstern-benchmark-merket innhold |

## 4. Eksisterende deterministiske aktiva (forrangs-laget)

Fra commit `184140a` (design/mocks/candidates/ + data/): fem solveFlight-deriverte tabeller med generatorskript, hvorav tre bestod kvalitetsvakt (impeccable + a11y): `table-face-path-outcome-matrix`, `table-curve-gearing-by-loft`, `table-apex-window-equal-carry`. I tillegg: 14 Academy-opplevelser med engine-verifiserte fixtures, Diagnose-motorens `costOfPattern`/`halfGapSolve` (v3), og begrepsarkene. Dette er Ask sitt sannhetsgrunnlag — LLM-laget trenger aldri produsere et tall.

## 5. Gap-register (nummerert; refereres i 03/08/12)

- **G1 — Range tar ikke imot tilstand.** «Åpne modellen med forhåndsvalgte verdier» krever at `impact.html` leser `sa.handoff.delivery` (den allerede spesifiserte §2.4-konsumenten, ~12 linjer). Uten G1 kan Ask deeplinke til Range, men ikke presette den.
- **G2 — Diagnose er ikke shippet.** «Ask tilbyr å starte Diagnose» forutsetter at Diagnose får en shippet flate. Ask-spesifikasjonen skriver rutingen mot intervjuet som *intensjon*, betinget av Diagnose-shipping (egen beslutning utenfor dette scopet).
- **G3 — Tabellkandidatene er ikke produktflater.** De tre godkjente tabellene må få en visningsflate (sheet i Ask, eller Lab) før de kan være deeplink-mål.
- **G4 — Surface-deeplink er upålitelig** for 12 av 14 opplevelser. Ask deeplinker til opplevelse (evt. legacy-konsept for arkåpning), ikke til surface, inntil renderne evt. harmoniseres.
- **G5 — `?play=1` er død** og `sa_swing` er en død kontrakt. Ikke Ask sitt ansvar, men Ask må ikke bygge på dem.

## 6. Grensen mot Diagnose (fastholdt)

Diagnose My Shot forblir et strukturert, ærlig intervju: bånd-baserte svar fra `meta.bands`, aldri fritekst. Ask Flightglass:
- svarer på **generelle** mekanikk-/definisjons-/«hvordan påvirker X Y»-spørsmål;
- ruter alle «diagnostiser meg/mitt skudd»-intensjoner til Diagnose-intervjuet (når shippet) med én setning om hvorfor («Flightglass reads your miss through six structured questions — free text can't diagnose a real swing»);
- gjenbruker aldri Diagnose sitt reveal-språk og later aldri som fritekst har målt noe.
