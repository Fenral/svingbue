# IMPACT-KAMERA · DOMMERRAPPORT (Økt F)

Dommer: fersk kontekst, uten chat-historikk eller builder-mål. Kilder: `docs/systemkontrakt.md`,
`design/orders/impact-kamera.md` §3+§5, og bygget (`impact.html`, `impact-camera.js`,
`impact-outcome.js`, `impact-annotate.js`). Skrevet: 2026-07-17.

All fersk runtime-evidens ligger i `design/evidence/impact-kamera-okt-f/`
(11 skjermbilder + `report.json`), produsert av dommerens eget Playwright-audit
(msedge headless, 390×844) mot bygget servert lokalt. Ingen console-/page-errors
under noen kjøring (`report.json → consoleErrors: []`).

---

## 1 · EVIDENSSJEKKLISTE

### Kritiske (én feilet = NO-GO)

| Krav | Resultat | Sitert evidens |
|---|---|---|
| **K1** Scrub kontinuerlig 0–2, snap ved slipp | **PASS** | Ekte pointer-scrub (canvas, 30 move-steg): skalar fulgte kontinuerlig til 1.485, maks frame-hopp **0.068** over 162 loggede frames, slipp → snap til **1.000** (`report.json → k1`). Skjermbilde under scrub: `09-k1-during-scrub.png`. Støttes av Økt B-trace `design/evidence/impact-kamera-okt-b/scalar-log.json` (scrub 0→1.485, maks hopp 0.0825; snap 1.227→1.000). |
| **K2** Segmenthopp TOP↔FLIGHT reiser gjennom sideplanet | **PASS** | Klikk FLIGHT fra TOP: logget skalar-trace 2 → 1.718 → **0.938** → 0.512 → … → 0 — `crossedSide (0.85–1.15) = true`, 93 frames (`report.json → k2`). Midtveis-skjermbilde `08-k2-midtravel.png` viser scenen i side-planaktig mellomfase. Skalar-arkitekturen (kontinuerlig 0=FLIGHT/1=SIDE/2=TOP, easing på skalaren) gjør det umulig å nå 0 fra 2 uten å passere 1. |
| **K3** Chip-semantikk: solid = kontroll, dashed = avlesning, ingen unntak | **PASS** | DOM-audit av samtlige chips med ALL METRICS utfoldet: **16 chips, alle `.read` med computed `border-style: dashed`, 0 solide chips** (`report.json → k3`). Visuell audit: `10-k3-all-metrics.png` (alle 16 dashed), `07-flight.png` (mini-rad). Solide pill-elementer (speed-stepper, Pin) er kontroller — semantikken holder uten unntak. |
| **K4** Alle farger via tokens; grep = 0 treff i nye filer | **PASS** | Grep `#hex \| rgb( \| hsl( \| oklch(` i `impact-camera.js`, `impact-outcome.js`, `impact-annotate.js` = **0 treff**. `impact.html`: kun `#07060C` (theme-color-meta, linje 6) og favicon `%239D8BFF`/`%23FF8A4D` (linje 9) — begge byte-identisk arvet fra før-bygget (`.sa-backups/impact.html.20260717-055109.okt-b.bak` linje 6/9), ikke nye verdier. Canvas-farger leses runtime fra tokens (`tokenRGB('--q-measure'/'--gold'/'--accent'/'--ink'/'--ghost')`, impact.html:351–371). `--measure:#EEC07A` + `--q-measure` finnes i `sa-p3.css:135–136` (A10). |
| **K5** Ekte motor driver alle 12 verdier; ingen mock-konstanter | **PASS** | Kun `impact-outcome.js:21` importerer `solveFlight`; grep etter mock-signaturer (`5.1*`, `1.39-0.002`, `clamp(…,-80,80)`, `apex*4*t`, `projPersp/projSide/projTop` som kode) = **0 treff** i de fire byggfilene (kun doc-kommentarer i impact-camera.js:61–65). Runtime-kryssjekk: `selectOutcome` sine 12 felt **identiske** med `solveFlight` direkte (carry 206.5 m ≈ UI «207 m» i `07-flight.png`; Launch 15.6° = motorens 0.62·24+0.25·3). 9 Økt E-enhetstester grønne (`scripts/impact-outcome.test.mjs`). |
| **K6** Scrub + slider-morf ≥ 55 fps på referanse-iPhone | **NOT-VERIFIABLE-HERE** | Krever instrumentert måling på fysisk referanse-iPhone; ingen enhet i dette miljøet, og ingen iPhone-måling finnes i repoet. Støttedata (teller ikke som pass): desktop headless under kontinuerlig 0↔2-sveip med annotasjonslag levende: **58.3 fps snitt, p95 frametid 17.0 ms** (`report.json → fpsDesktop`). Økt B-loggens 7–13 fps er headless-opptaksartefakt, ikke ytelsesmåling. |

### Shippbar

| Krav | Resultat | Sitert evidens |
|---|---|---|
| **S1** Etikett-kaskaden deterministisk | **PASS** | 7/7 enhetstester grønne (`node --test scripts/impact-annotate.test.mjs`): kort spenn < 74 px → ytre ende (begge retninger), venstreskudd i mellomsonen → indre ende, keepOut=null-fallback, normaltilfelle 15 px over midtpunkt, kollisjonsregister maks 3 iterasjoner deterministisk, no-label-passthrough. Terskler porterer ordre §3 verbatim (impact-annotate.js:32–41). |
| **S2** Stats-flip med hysterese, ingen oscillering | **PASS** | 5/5 enhetstester grønne, inkl. **monotont sveip over begge terskler med nøyaktig én overgang hver vei** («ingen chatter»). Runtime bruker samme `statsFlip` (impact.html:838), ikke duplikat. |
| **S3** TARGET følger målestakk, fader ved lang carry, linjen består | **PASS** | Parametriserte tester grønne: alltid til stede utenfor TOP, fader for lang carry, **alpha monoton i carry**. Visuelt: `02-top.png` (carry 207 → etikett fadet ut i TOP, stiplet linje består), `04-side.png`/`07-flight.png` (etikett på verdensanker x=228). |
| **S4** Speed: tap ±1, hold→±5, scrub ±1/6 px, clamp 30–150 | **PASS** | Runtime-sjekkliste (`report.json → s4`): tap 130→**131**; hold 2.2 s → akselerert til **150**; fortsatt hold → clamp holder **150**; scrub −60 px → **140** (−10 mph). Auto-repeat 400 ms/90 ms/±5 etter 10 rep i kode (impact.html:748–750). Tastatur-piler implementert. |
| **S5** Apex-dot på banens visuelle topp ved skalar 0/0.35/0.7/1.0/1.35 | **PASS** | Fem skjermbilder: `07-flight.png` (0), `06-s035.png`, `05-s070.png`, `04-side.png` (1.0), `03-s135.png` — gulldotten ligger på kurvens visuelle topp i alle fem; etikett dør ved 1.35, dot består (matcher enhetstest «apex-dot til stede < 1.4; etikett dør ved 1.35»). Beregningen er skjermrom-minimum over projisert bane (impact-annotate.js:119–124), ikke world-apex-indeks. |
| **S6** Gruppehopp lander i riktig stasjon | **PASS** | Klikk «DIRECTION · TOP →» fra FLIGHT → `stationTarget=2`, skalar til ro på **2.00** (`report.json → s6`). |
| **S7** Pin/ghost maks 3, Δ på carry+kurve, fortegn/more-less | **PASS** | Runtime: 4× pin → **3 pins** beholdt (`report.json → s7`). Δ-linje renderer «+0 m carry · → 0 m more curve» (like pins) og «→ 13 m less curve» mot seed-ghost (`02-top.png`); formler manuelt verifisert (impact.html:842–846: dt på carry, dc på \|kurve\|, more/less av fortegn). Anmerkning: ingen dedikert automatisert test for Δ-formatteringen (se funn 4). |
| **S8** Kollaps-grabber i alle stasjoner; stasjonsknapper synlige kollapset | **PASS** | Runtime i TOP/SIDE/FLIGHT: segment synlig og innenfor viewport i kollapset tilstand i alle tre (`report.json → s8`); `11-s8-collapsed-flight.png`. |
| **S9** `prefers-reduced-motion`: komet av, redusert morfing | **PASS** | Emulert reduce-kontekst: landet **umiddelbart** i TOP (ingen oppstartsreise), `setStation` snapper uten reise, scene **pikselstatisk over 1.3 s** (aktiv komet ville flyttet seg — den er av) (`report.json → s9`). CSS-transitions nulles i media query (impact.html:229–231). |

### Studio-grade

| Krav | Resultat | Sitert evidens |
|---|---|---|
| **G1** Parvis blindsammenligning mot mock-opptak | **NOT-VERIFIABLE-HERE → ikke oppnådd** | Det navngitte referanseproduktet (mock-opptak) finnes ikke i repoet; eneste video er `okt-b-skalar-reise.webm` — den er tatt FØR paneler/annotasjonslag fantes (frames viser verken stepper, pin eller etiketter) og har 6 s blank hvit lead-in. Blindsammenligningen kan ikke gjennomføres. Perseptuelt viser frame-serien 09/03/05/06 crossfade uten pop, men det er ikke protokollens bevis. |
| **G2** Ekstern 5-sek blindtest | **NOT-VERIFIABLE-HERE** | Krever uinnvidd ekstern person; kjøres per ordre §6 av Sivert etter SHIPPBAR-tier. |

---

## 2 · KRITISKE DEFEKTER

**Ingen kritiske defekter funnet.** K1–K5 består med maskin- og skjermbilde-evidens.
K6 er ikke falsifisert, men heller ikke bevist — den kan ikke verifiseres uten fysisk
referanse-iPhone og står som eneste åpne kritiske punkt (restrisiko, ikke defekt).

---

## 3 · TIER

**SHIPPBAR** — betinget av at K6 kjøres instrumentert på referanse-iPhone før release.

Ingen kritisk krav er *feilet*. Fem av seks kritiske er bevist; K6 er miljømessig
uverifiserbar her (desktop-målingen 58.3 fps med levende annotasjonslag peker ikke mot
fail, men teller ikke). STUDIO-GRADE er ikke oppnåelig: G1 mangler referanseopptaket
protokollen krever, G2 er ekstern.

---

## 4 · AVLEDET SCORE

Vekting: kritiske 10 p (×6 = 60), shippbar 4 p (×9 = 36), studio 2 p (×2 = 4). Kun beståtte krav teller; not-verifiable gir 0.

| Gruppe | Bestått | Poeng |
|---|---|---|
| Kritiske | K1–K5 (K6 uverifisert) | 50/60 |
| Shippbar | S1–S9 | 36/36 |
| Studio | ingen | 0/4 |
| **Sum** | | **86/100** |

Tallet overstyrer ingenting: tier er SHIPPBAR uansett sum, og K6-forbeholdet står.

---

## 5 · FUNN ETTER ALVORLIGHET

1. **(Medium) K6 uten enhetsevidens.** Eneste fps-måling er dommerens desktop-headless
   (58.3 fps). Kravet er formulert mot referanse-iPhone og er ubevist til en enhetskjøring
   finnes.
2. **(Medium) Evidensvideoen er foreldet og delvis blank.** `okt-b-skalar-reise.webm`
   har ~6 s hvit lead-in (headless første-last-stall) og er innspilt før Økt C/D — den
   viser verken paneler, stepper, pin eller annotasjoner, og oppstartsreisen skjer i den
   blanke perioden. Som varig K1/K2-artefakt er den svak; dommerens ferske trace/skjermbilder
   i `impact-kamera-okt-f/` er det som bærer bevisene nå.
3. **(Lav) TARGET-etiketten klippes ved høyre skjermkant i SIDE** (`04-side.png`):
   `placeLabels` bruker ikke `vbox` til kantklemming (bevisst utelatt — ordre §3
   spesifiserer ikke skjermkant-atferd, kommentert i impact-annotate.js:255). Kosmetisk.
4. **(Lav) Δ-linjens beregning er utestet.** dt/dc/more-less ligger inline i
   `impact.html:842–846` utenfor testbare moduler; S7 er verifisert runtime + manuelt,
   men en regresjon her fanges ikke av `node --test`.
5. **(Info) Skalar-loggens 7–13 «fps»** er opptaksartefakt fra headless-miljøet, ikke
   ytelsesdata; bør ikke siteres som måling.

---

## 6 · TILTAK

1. **Før release (lukker K6):** kjør instrumentert fps-måling på referanse-iPhone —
   `window.__impact.capture` + frame-tider under scrub og slider-drag; arkiver JSON i
   `design/evidence/`. Passerer ≥ 55 fps → tier står; under → NO-GO til fikset.
2. **Re-innspill evidensvideo mot ferdig bygg** (full skalar-reise + annotasjonslag +
   paneler, uten blank lead-in) og legg den ved siden av dommer-skjermbildene; den
   dekker samtidig G1-referansens «bygg-side» når mock-opptaket lages.
3. **G1:** spill inn mock-opptak av `design/mocks/impact-kamera.html` og kjør parvis
   blindsammenligning; **G2:** Sivert kjører ekstern 5-sek blindtest (ordre §6).
4. **Lav-prioritet:** klem etikett-ankere mot `vbox` i `placeLabels` (TARGET-klipp i
   SIDE); flytt Δ-formatteringen til en ren funksjon i `impact-annotate.js` og gi den
   én test.
