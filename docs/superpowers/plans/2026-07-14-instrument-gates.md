# Flightglass — Work order: Instrument-lover + evidensbaserte gates (Task 12–20)

> Paste-klar for Claude Code i `Fenral/svingbue`, branch `agent/travel-sync`.
> Forgjenger: Task 10–11 (Backspin ship + verifikasjon) må være FERDIG per
> `docs/flightglass-autopilot/STATUS.md`. Er de ikke det: STOPP og rapporter.
> Denne ordren implementerer lov 11–13 (Instrument-retningen, låst av eier
> 2026-07-14) og erstatter skjønnsbasert 1–100-scoring med evidensbasert
> vurdering per EVALUERINGSPROTOKOLLEN (inline i §2).

- **Repo:** `Fenral/svingbue` · **Branch:** `agent/travel-sync`
- **Autoritative dokumenter:** `docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md` ·
  `docs/superpowers/specs/2026-07-13-backspin-96-97-design.md` (v3) ·
  `docs/flightglass-autopilot/STATUS.md`
- **Arbeidsspråk:** norsk internt, engelsk i all produkt-UI (lov 10).

---

## §0 Ufravikelige rammer (arvet, gjelder hele ordren)

1. Produktlov 1–10 fra masterbriefen gjelder uendret. Lov 11–13 (§1) er additive.
2. `impact-flight.js`, `swing-parameters-and-impact.js`, `diagnose-engine*.js`
   endres ALDRI uten feilende regresjonstest + eksplisitt autorisasjon fra eier.
3. Beskyttede IDer bevares eksakt: bundle `no.strikearc.app`, ASC `6768449250`,
   RevenueCat `strikearc_pro_monthly|annual|lifetime`, storage
   `strikearc.academy.v1` og `strikearc.academy.nudge`.
4. Aldri hånd-editér `www/` — regenerer med `npm run copy-web`.
5. `.sa-backups/` før hver oppgave som endrer shipping-filer.
6. Ikke destruktive Git-kommandoer. Ikke generer bilder. Ikke introduser nye
   backend-avhengigheter.
7. TDD overalt: skriv feilende test → minimal implementasjon → verifiser → commit.
8. Ved ordinær tvil: bevar sannhet → bevar dominerende jobb → fjern samtidig UI →
   gjør feedback live → velg enklere native interaksjon → dokumentér antagelsen
   og fortsett.

---

## §1 Nye produktlover (Instrument — LÅST, skal inn i masterbriefen i Task 12)

### Lov 11 — Typografi (Instrument)
Én grotesk for UI + én mono for alle motor-sannheter. Alle live-readouts bruker
tabulære numeraler; ingen verdi endrer bredde under oppdatering. Minus er U+2212,
aldri bindestrek. Grader, rpm og meter settes i mono også i løpende tekst.

### Lov 12 — Bevegelse (Instrument)
Sannhet svarer umiddelbart: input→modell uten easing-teater (p95 < 16.7 ms).
Forrige tilstand dør som phosphor — maks to ghost-spor med fallende opasitet,
kun på trace, aldri på tall. Én signaturtransisjon i appen: Aperture som shared
element mellom flater. Reduced motion: ghosts av, Aperture erstattes av fade,
sannhet fortsatt live.

### Lov 13 — Render-signatur (Instrument)
Tracen er et instrument, ikke en illustrasjon: ember-linje med phosphor-decay,
tick-linjal på grunnlinjen, landingspunkt som eneste markør. Violet tegner
struktur (akser, targets, estimatlag), aldri sannhet. Annotasjonsretten:
modellen forklarer seg med maks én dashed violet-annotasjon per tilstand
(apex, lavpunkt). Ingen dekorativ glow/gradient/skygge (lov 6-arv).

---

## §2 Evalueringsprotokoll (styrer all vurdering i denne ordren)

Prinsipp: et tall dømmes ikke, det avledes. Kvalitetskrav er binære
falsifiserbare påstander med verifikasjonsmetode, låst FØR implementering.
1–100 finnes kun som avledet vektet sum av beståtte krav. Beslutning tas på
tier: **NO-GO** (≥1 kritisk defekt feilet) / **SHIPPBAR** (alle kritiske bestått) /
**STUDIO-GRADE** (alle krav bestått + parvis sammenligning vunnet). Ingen score
overstyrer noensinne en kritisk defekt. Bygger og dommer separeres (dommer =
subagent med fersk kontekst, uten byggehistorikk, uten kjennskap til ønsket
utfall). Skjønn løses ved parvis blindsammenligning, ikke absolutt tallsetting.
Vurdering kjøres 3× uavhengig; kun funn som går igjen i alle tre er bekreftet.
Ekstern validering (5-sek blindtest med mennesker) kreves før release-beslutning
og ligger UTENFOR denne ordrens autonomi (menneskelig sjekkpunkt, §6).

Leveranseformat for enhver vurdering: evidenssjekkliste med resultat →
kritiske defekter → tier → avledet score → funn etter alvorlighet → tiltak.

---

## §3 Modell- og effort-ruting (settes opp i Task 12)

**Hovedsesjon:** Fable 5, effort `xhigh` (`/model` + `/effort xhigh`). All
arkitektur, implementering, feilsøking og syntese skjer her. Eiers regel:
maks Fable 5 — enklere modeller KUN der forskjellen er neglisjerbar, dvs.
ren deterministisk mekanikk.

**Subagenter** (auto-delegering via description-feltet; fersk isolert kontekst
per kjøring). Opprett disse to filene i Task 12:

`.claude/agents/fg-mekaniker.md`
```markdown
---
name: fg-mekaniker
description: Kjører deterministisk mekanikk uten skjønn — testsuiter,
  npm run copy-web, brand:verify, screenshot-capture via harness,
  filflytt, .sa-backups. Bruk proaktivt for enhver ren kommandokjøring
  der output er maskinlesbar pass/fail. ALDRI for kode-endringer,
  design-vurdering eller feilsøking.
tools: Bash, Read, Glob
model: haiku
effort: low
---
Du kjører kommandoer og rapporterer rå output + exit-koder. Du tolker ikke,
vurderer ikke, fikser ikke. Feiler noe: returner full feilmelding og stopp.
```

`.claude/agents/fg-dommer.md`
```markdown
---
name: fg-dommer
description: Uavhengig kvalitetsdommer for Flightglass. Brukes KUN når en
  implementering skal vurderes mot et låst evidensmanifest, eller for
  parvis blindsammenligning av to skjermbilder/tilstander. Får aldri
  byggehistorikk, mål-score eller ønsket utfall i prompten.
tools: Bash, Read, Glob, Grep
model: inherit
effort: max
---
Du er en uavhengig dommer. Du mottar: (a) sti til evidensmanifest-JSON,
(b) kommandoer/artefakter for verifikasjon. For hvert krav: kjør angitt
verifikasjon, avgjør PASS/FAIL, dokumentér rå evidens (output, målt verdi,
screenshot-sti). Du setter ALDRI en samlet score — du leverer kun
pass/fail-JSON til scripts/derive-score.mjs. Ved parvis sammenligning:
svar «A» eller «B» + tre konkrete grunner forankret i det synlige; du får
ikke vite hvilken som er ny/gammel. Avvik du finner utenfor manifestet
rapporteres som funn, aldri som scorejustering.
```

**Rutingsregler (inn i CLAUDE.md i Task 12):**
- Delegér til `fg-mekaniker` for all ren kommandokjøring (spar hovedkontekst).
- Delegér til `fg-dommer` for AL vurdering — hovedtråden dømmer aldri eget arbeid.
- Dommer-prompter skal aldri inneholde: mål-score, tidligere scorer, «vi håper»,
  eller referanse til hvem som bygde. Kun manifest-sti + artefakt-stier.
- Alt annet: hovedsesjon (Fable 5 xhigh). Ved tvil: Fable 5.

---

## §4 Evidensmanifest v1 (LÅSES i Task 12, endres aldri etterpå)

Koder inn som `config/evidence/instrument-laws.json` med feltene
`{id, claim, verify (kommando/metode), weight, critical}`. Vekter: critical=8,
øvrige=4. Avledet score = 100 × (bestått vekt / total vekt), beregnet av
`scripts/derive-score.mjs`. En SHA-256-lås (`config/evidence/instrument-laws.lock`)
committes samtidig; testen `evidence-lock.test.mjs` feiler hvis manifestet
endres etter låsing.

| ID | Påstand (falsifiserbar) | Verifikasjon | Kritisk |
|---|---|---|---|
| EV-TYPO-01 | Alle live-readouts har `font-variant-numeric: tabular-nums` | DOM-scan av `[data-readout]` via getComputedStyle i harness | JA |
| EV-TYPO-02 | Ingen readout endrer bredde ved verdisyklus over sifrene 0–9 | getBoundingClientRect-delta = 0 px over syklus | JA |
| EV-TYPO-03 | Minus i alle synlige verdier er U+2212 | Formatter-enhetstest + DOM-tekstscan for `/-\d/` i readouts | nei |
| EV-TYPO-04 | Én skriftpar-definisjon i token-fil; null ad-hoc `font-family` i lesson-CSS | grep i shipped CSS unntatt token-fil | nei |
| EV-MOT-01 | p95 pointermove→paint < 16.7 ms over ≥200 syntetiske drag-events, Chromium OG WebKit | perf-harness JSON-rapport | JA |
| EV-MOT-02 | Ghost-decay finnes kun på canvas-trace, aldri på tall/tekst | kodesøk + DOM-inspeksjon | nei |
| EV-MOT-03 | Maks to ghosts, monotont fallende opasitet | enhetstest på trace-state | nei |
| EV-MOT-04 | Aperture-transisjon finnes mellom flater; reduced-motion gir fade-ekvivalent med live sannhet | browsertest i begge motion-moduser | JA |
| EV-REN-01 | Null gradient/glow/box-shadow/filter på canvas og lesson-flater | computed-style-audit + grep i canvas-kode | JA |
| EV-REN-02 | Maks én annotasjon synlig per modelltilstand | browsertest over tilstandssveip | nei |
| EV-REN-03 | Estimatlag aldri i ember-token; motor-sannhet aldri i violet-token | fargeaudit av computed styles mot token-verdier | JA |
| EV-NAT-01 | 130 % tekstskala: ingen klipping/overlapp/horisontal scroll på alle seks flater | harness med skalert rotfont + bounding-box-asserts | JA |
| EV-NAT-02 | axe-core: null critical/serious violations på alle seks flater | axe-kjøring i harness | JA |
| EV-NAT-03 | Slidere har `aria-valuetext` med enhet; verdi-annonsering er debounced (aldri per-event) | DOM-assert + event-test | nei |
| EV-NAT-04 | `requiredSelectors` i surface-manifestet dekker Mission, Lab, Mastery OG Result | manifest-test | nei |
| EV-REG-01 | Pixel-diff mot godkjente baselines ≤ 0.1 % per flate, begge motorer, begge motion-moduser | visreg-rapport | JA |
| EV-GATE-01 | Hele Task 9-suiten (viewport, targets, tastatur, failure-paths) passerer på WebKit | testkjøring `--project=webkit` | JA |

Merk presedens: EV-kravene verifiserer lov 11–13 og §5-gatene. Der et krav er
maskinkjørbart skal dommeren KJØRE det, ikke lese en rapport noen andre laget.

---

## §5 Oppgaver

### Task 12 — Evalueringsinfrastruktur + pre-registrering *(FØRST — låser rubrikken før arbeidet)*
Files: `config/evidence/instrument-laws.json` + `.lock`, `scripts/derive-score.mjs`,
`scripts/evidence-lock.test.mjs`, `.claude/agents/fg-mekaniker.md`,
`.claude/agents/fg-dommer.md`, `CLAUDE.md` (rutingsregler),
`docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md` (lov 11–13 + protokoll-referanse).
1. Feilende test: `evidence-lock.test.mjs` (manifest finnes + SHA matcher lock).
2. Skriv manifestet fra §4 ordrett til JSON; generer lock; testen passerer.
3. `derive-score.mjs`: leser dommer-JSON `{id, result, evidence}` → skriver
   `{tier, score, criticalFailures[], findings[]}`. Enhetstester: NO-GO ved én
   kritisk fail uansett score; STUDIO-GRADE krever alt bestått.
4. Opprett begge subagent-filer + rutingsregler i CLAUDE.md.
5. Lov 11–13 inn i masterplanen under produktlovene.
6. Commit `build(eval): lock evidence manifest and judge infrastructure`.

### Task 13 — WebKit-gate (lukker største validitetshull: brukeren får WKWebView, testene kjørte Chromium)
Files: `scripts/flightglass-ux.test.mjs`, browser-harness, `package.json`.
1. Feilende test: harness eksponerer `--project=webkit` og minst én kjent
   WebKit-sensitiv assert (safe-area env(), scroll-oppførsel) kjøres der.
2. Installer/aktiver Playwright WebKit-motor i `tools/node_modules`-oppsettet.
3. Kjør HELE Task 9-suiten på WebKit. Reparér alle WebKit-spesifikke feil
   (uten å røre Chromium-passerte kontrakter).
4. `npm run test:ux` kjører nå begge motorer. Commit
   `test(ux): run full gate on webkit engine`.

### Task 14 — Ytelses-gate (lov 12-evidens: EV-MOT-01)
Files: `scripts/flightglass-perf.test.mjs`, harness-instrumentering.
1. Feilende test: perf-suite finnes ikke.
2. Instrumentér i harness: syntetiser ≥200 pointermove-events over Lab-slideren;
   mål event→neste paint (rAF-delta); samle p50/p95/p99 til JSON-artefakt.
3. Assert p95 < 16.7 ms på Chromium og WebKit. Feiler det: profilér og fiks
   (typiske syndere: layout thrash i readout-oppdatering, unødig canvas-clear,
   style-recalc per event). Motorverdier røres ikke.
4. Commit `perf(lab): enforce 16.7ms p95 input-to-paint budget`.
   NB: desktop-måling er proxy — fysisk iPhone-økt er menneskelig sjekkpunkt (§6).

### Task 15 — Visuell regresjon (betaler seg ×23 ved modul-utrulling)
Files: `scripts/flightglass-visreg.test.mjs`, `outputs/visreg-baselines/` (git-sporet).
1. Feilende test: baseline-katalog mangler.
2. Capture-løype: alle seks flater × to viewports × normal/reduced-motion ×
   begge motorer, deterministisk state (seedet modellverdi, fonts lastet,
   animasjoner settlet).
3. Pixel-diff (pixelmatch el.l. via eksisterende tooling) med terskel 0.1 %.
   Godkjenn-kommando `npm run visreg:approve` som bevisst manuell handling.
4. Commit `test(visreg): pixel baselines for all lesson surfaces`.

### Task 16 — Lov 11: Typografi (EV-TYPO-01..04)
Files: `flightglass-tokens.css` (eller eksisterende token-fil), lesson-CSS,
readout-formatter-modul, tester.
1. Feilende tester for alle fire EV-TYPO-krav.
2. Definér skriftparet i token-fila (grotesk UI + mono sannhet; system-stack
   fallback). Alle readouts merkes `[data-readout]` og settes i mono +
   `tabular-nums`. Én formatter eier all verdiformatering: U+2212, tusenskille,
   enhets-suffiks.
3. Fjern ad-hoc font-family i lesson-CSS. Visreg-baselines regenereres og
   godkjennes eksplisitt (forventet diff).
4. Commit `feat(type): instrument typography law across lesson surfaces`.

### Task 17 — Lov 12: Bevegelse (EV-MOT-02..04)
Files: `academy-native-lesson.js`, trace-render-modul, `academy-native-lesson.css`.
1. Feilende tester: ghost-count/opasitet, ghost-scope (kun trace),
   Aperture-transisjon, reduced-motion-ekvivalens.
2. Implementér phosphor-ghosts (maks 2, fallende opasitet, kun canvas-trace).
3. Aperture shared-element-transisjon mellom flatebytter; reduced-motion →
   ren fade, identisk informasjon. Ingen easing på sannhets-oppdatering.
4. Perf-gaten (Task 14) skal fortsatt passere ETTER ghosts. Commit
   `feat(motion): phosphor decay and aperture signature transition`.

### Task 18 — Lov 13: Render-signatur (EV-REN-01..03)
Files: trace-render-modul, lesson-CSS, tester.
1. Feilende tester: stil-audit (ingen glow/gradient/skygge), annotasjonsteller,
   token-fargeaudit ember/violet.
2. Tick-linjal på grunnlinjen, landingspunkt som eneste markør,
   én dashed violet-annotasjon per tilstand (apex/lavpunkt) med ekte
   motoravledet verdi.
3. Fargeaudit: estimatlag kun violet-token, sannhet kun ember-token.
4. Visreg regenerer + godkjenn. Commit
   `feat(render): instrument trace signature with annotation right`.

### Task 19 — Native dybde: tekstskala, VoiceOver-semantikk, selektordekning (EV-NAT-01..04)
Files: lesson-JS/CSS, `config/flightglass-surfaces.json`, harness.
1. Feilende tester for alle fire EV-NAT-krav.
2. Rem-basert skala med rot-multiplikator; harness kjører alle asserts med
   130 % rotfont. Fiks klipping/overlapp uten å bryte lov 9 (intet essensielt
   under folden i instrument-tilstand).
3. axe-core inn i harness; fiks alle critical/serious. Slidere får
   `aria-valuetext` («minus three point two degrees, attack angle»),
   verdi-annonsering debounced til settle.
4. `requiredSelectors` utvides til Mission/Lab/Mastery/Result; manifest-test
   låser dem.
5. Commit `feat(a11y): text scale, voiceover semantics, selector coverage`.

### Task 20 — Dom, konsistenskjøring og menneskelig handoff
Files: `scripts/derive-score.mjs`-output, `docs/flightglass-autopilot/STATUS.md`,
`outputs/flightglass-eval/`.
1. Kjør `npm run claude:ready` + full gate-rekke fra ren prosess (delegér
   kjøring til fg-mekaniker). Alt grønt før dom.
2. Invoker `fg-dommer` TRE ganger uavhengig mot `instrument-laws.json`.
   Prompten inneholder KUN manifest-sti + artefakt-stier — aldri mål eller
   historikk. Hver kjøring skriver egen resultat-JSON.
3. `derive-score.mjs` per kjøring → tier + avledet score. Konsistensregel:
   funn i 3/3 = bekreftet; funn i 1–2/3 = re-verifiser med målrettet evidens
   før det aksepteres eller forkastes. Sprikende PASS/FAIL på samme krav =
   verifikasjonsmetoden er tvetydig → skjerp metoden i test (IKKE manifestet)
   og kjør på nytt.
4. Parvis blind: fg-dommer får umerkede par (gammel artikkel-leksjon vs ny
   native, per flate) og velger A/B med begrunnelse. Ny taper en flate →
   funn med alvorlighet, aldri stille aksept.
5. NO-GO: fiks navngitt defekt, gjenta fra steg 1. SHIPPBAR/STUDIO-GRADE:
   skriv STATUS.md-oppdatering i protokollens leveranseformat
   (evidenssjekkliste → kritiske defekter → tier → avledet score → funn →
   tiltak) + eksakte test-totaler, artefakt-stier og bekreftelse på at
   `impact-flight.js` er byte-identisk.
6. Bygg menneskepakke i `outputs/flightglass-eval/human-pack/`:
   (a) finale skjermbilder per flate for 5-sek blindtest, (b) instruksjonsark
   for testen, (c) tom mappe + instruks for referanse-screenshots (Flighty,
   Things 3, én Trackman-konkurrent — tas av eier fra egne enheter),
   (d) sjekkliste for fysisk-enhet perf-økt og manuell VoiceOver-økt.
7. Commit `docs(eval): record instrument verification and human handoff`.
   **STOPP.** Release-beslutning tas av eier etter §6.

---

## §6 Menneskelige sjekkpunkter (utenfor autonomi — ordren stopper her)

1. Fysisk iPhone: Lab-drag-økt, subjektiv 120 Hz-følelse + Instruments-profil.
2. Manuell VoiceOver-gjennomgang av alle seks flater.
3. 5-sekunders blindtest med ≥5 personer (pakken fra Task 20 steg 6).
4. Release-autorisasjon.

---

## §7 Autonomi-protokoll (arvet + tillegg)

Stopp KUN når: (1) to normative kilder gir uforenlige krav som materielt endrer
brukeratferd, (2) implementasjon krever endret fysikk-output uten feilende
regresjonstest, (3) credentials mangler eller handling overstiger autorisasjon,
(4) samme verifikasjonsfeil overlever tre rot-årsak-drevne forsøk, (5) påkrevd
asset mangler og kan ikke erstattes av CSS/Canvas/SVG. **Tillegg (6):** et
evidenskrav viser seg uverifiserbart som formulert — da stoppes det for
eier-avklaring; manifestet endres aldri unilateralt etter lås.

## §8 Kommandoer
```
npm run test:academy · npm run test:ux · npm run copy-web · npm run brand:verify
npm run claude:ready · npm run test:perf (ny, Task 14) · npm run test:visreg (ny, Task 15)
npm run visreg:approve (ny, bevisst manuell) · node scripts/derive-score.mjs <resultat.json>
```

## §9 Completion-definisjon (ordren er ferdig kun når)
Manifest låst FØR implementering og uendret siden · alle 17 EV-krav har
maskinkjørbar eller dommer-kjørbar verifikasjon · full gate-rekke grønn på
Chromium OG WebKit · tre uavhengige dommer-kjøringer gjennomført med
konsistensregel anvendt · tier er SHIPPBAR eller bedre uten kritiske defekter ·
parvis blind mot forrige generasjon vunnet eller tap dokumentert som funn ·
STATUS.md oppdatert i protokollformat · menneskepakke levert · arbeid stoppet
ved §6-grensen.
