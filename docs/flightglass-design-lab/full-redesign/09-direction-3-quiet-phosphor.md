# Retning 3 — QUIET PHOSPHOR — den disiplinerte natt-evolusjonen

**Arbeidsområde:** `docs/flightglass-design-lab/full-redesign/` · **Rolle:** retningsutvikler under Creative Director
**Status:** komplett retningskandidat til fase C · **Dato:** 2026-08-05
**Merking:** [F] = faktum m/ kilde · [H] = testbar hypotese · [S] = designvurdering/smak · **ANSLAG** = beregnet verdi, ikke målt på faktisk render.

**Posisjon i trioen:** Dette er kontinuitetsretningen — den som beholder mørk grunn og varm tracer. Nettopp derfor er den underlagt det strengeste beviskravet: den må *vinne* retten til mørket ved å vise at natten kan bære sannhet uten stemning. Lav migreringskostnad er dokumentert i §10, men brukes aldri som designargument (port-må-ha-fasit: «teknisk lettest» får ikke forkle seg som «best»).

---

## 1. Kreativ tese + de første tre sekundene

### Tesen

**Mørket er riktig for et lysende instrument — men dagens Ultraviolet Ember drukner sannheten i stemning.** [S]

Et oscilloskop er mørkt av en funksjonell grunn: skjermen er et emisjonsmedium, og signalet er den eneste lyskilden. Alt annet i laboratoriet er matt, nøytralt og stille. P3 tok riktig premiss (mørk grunn, ett varmt signal) og pakket det inn i feil verden: en ultrafiolett natt-driving-range med gradert himmel, violet skylight, film-grain, backdrop-blur-glass og bloom på tallene [F: sa-p3.css `--scene-bg`/`--dusk-*`, DESIGN-SYSTEM.md «Depth & Light»]. Hver av disse er en lyskilde som ikke er data. Når alt lyser litt, betyr det varme signalet mindre.

Quiet Phosphor destillerer natt-instrumentet til tre setninger:

1. **Grunnen er grafitt, ikke natt.** Nøytral, kald, nesten akromatisk gunmetal — et materiale, ikke et sted. Violet fjernes som identitetsbærer.
2. **Lys kommer kun fra data.** Det eneste som får være varmt og lysende er det motoren har regnet ut: ballen, tracen, det levende tallet, den ene primærhandlingen. Alt annet er trykk på matt metall.
3. **Presisjon, ikke drama.** Emosjonelt register: et stille laboratorium om natten. Ingen entry-koreografi, ingen glød, ingen scenografi. Instrumentet er bare *på*.

Navnet er bokstavelig: P3 er en reell CRT-fosfor-betegnelse — **amber-fosforen** i laboratorie- og flyinstrumenter [F: standard fosfortype P3, gul-amber persistens]. Den varme tracen er altså ikke et stilvalg vi arver fra UV Ember; den er den historisk korrekte emisjonsfargen for et måleinstrument. Det er begrunnelsen for å beholde varmen — og for å re-derivere den (§4.1).

### Hva i dagens P3 er sannhetsbærende (BEHOLD)

- **Mørk grunn** — gjør emisjonslogikken fysisk mulig; høyest dynamikkområde for én varm signalfarge. [S]
- **Varm tracer med phosphor decay** (lov 12/13) — decay-ghostene *er* data (forrige tilstand), ikke dekor. [F: masterplan §2 lov 12]
- **Ember-knappheten** (SYS-08: maks 3 varme elementer i ro) — selve kjernen; skjerpes i §4.3. [F: sa-p3.css SYS-08]
- **Mono for motorsannhet, tabulære tall, U+2212** (lov 11) — beholdes ordrett og skjerpes (§4.5). [F]
- **1:1-ordboken hue↔størrelse** (SYS-11) — prinsippet beholdes; antallet reduseres (§4.2). [F: sa-p3.css SYS-11]
- **Status/reward-inngjerdingen** (SYS-15, gull-splitten 2026-07-11) — beholdes; det er allerede riktig tenkt. [F]
- **Dobbel fokusring i ink** — backdrop-sikker, aldri i signalfargen; beholdes uendret. [F: sa-p3.css fokusblokk]
- **Haptikk-kontrakten** — sa-haptics.js er allerede austere (fysiske hendelser og detents, aldri dekor); beholdes uendret. [F: DESIGN-SYSTEM §6]

### Hva som bare er stemning (FJERN)

- **Violet-vasken**: `--bg #07060C` er violet-svart (oklch H≈293 [F: beregnet]), `--muted #A79FC7` er violet-grå, `--secondary #9D8BFF` farger chrome, glyfer og lærte begreper. Struktur trenger ingen hue; grå gjør samme jobb uten å konkurrere med signalet. [S]
- **Scene-graderingene**: `--scene-bg`-radialen og hele `--dusk-*`-himmelen (7 tokens + fog + grid-lavendel) er malt lys — en himmel som later som den er der. [F: sa-p3.css:104–170]
- **Depth & Light-laget**: violet skylight, teal floor-glow, `.sa-bloom-*`-tekstskygger, 2.8 % film-grain. Grain er filmemulering (kino-signal), bloom på tall er dekorerte tall — i strid med lov 4s ånd. [F: DESIGN-SYSTEM «Depth & Light»]
- **Backdrop-blur-platene** (`.sa-plate`, strip-gradienten): glassmorfisme er eksplisitt AI-slop-listet i lov 6 når den er dekorativ — og her er den dekorativ, for SYS-13 krever uansett opak sticky chrome. [F: masterplan lov 6; sa-p3.css SYS-13]

### Hva som er sci-fi-klisjé (FJERN — og hvorfor det snek seg inn)

- **Ultrafiolett + ember-kombinasjonen selv**: violet natt + oransje glød er kategoriklisjeen for launch monitors, sim-apper og sci-fi-dashboards [F: 04-first-principles §4 «challenge»]. Den snek seg inn fordi den *fotograferer godt*: mock-æraen konkurrerte på skjermbilder, og violet natt vinner en mock-sammenlikning mot grå — men produktet skal vinne tusen økter, ikke én screenshot.
- **Natteland-fotoet / floodlight-scenografien** (Night Ladder-verdenen): diegetisk spillmeny-arv [F: 04 §4]. Kom inn via home-konsept-runden der «verden som meny» slo «cluster» på distinktivitet — en reell gevinst den gang, men den tvang resten av systemet til å bli scenografi for å matche. Skjebne: §2 og §7.
- **Fraunces-graverings-stemmen** («observatory plaque», WONK-akse, brass-graveringer): skeuomorf instrumentromantikk — gravering uten data er lov 6-brudd i ånd [F: DESIGN-SYSTEM §2 «showcase deviation»; 04 §5 pkt. 2]. Snek seg inn som «showcase deviation» — unntaket som aldri ble rullet tilbake.
- **«The universe is slow, the strike is violent»-doktrinen** (telescope glides, whip-pans, speed-ramps) [F: DESIGN-SYSTEM §5]: broadcast-drama, ikke instrumentrespons. Lov 12 («truth answers immediately») vant den kampen på papiret; motion-doktrinen henger igjen fra Observatory-æraen.

### De første tre sekundene

Appen åpner rett i et matt grafittfelt. Ingen intro, ingen floodlight-sekvens, ingen fade. Én amber trace ligger allerede og dør langsomt ut over en hairline-horisont — ditt forrige skudd (eller standardskuddet ved førstegang, merket `MODEL`). Under den: tre mono-tall og én amber handling. Alt annet på skjermen er grå tekst på grafitt.

Følelsen som skal sitte etter tre sekunder [S]: *«Dette er et instrument noen lot stå på til meg. Det venter stille, og det eneste som lyser er det som er sant.»*

---

## 2. Appkart og navigasjon

### Nav-modell: hub-and-spoke beholdes

Jobbene 1–5 er én kausal reise, ikke fem søsken [F: 04 §1]. Tab-bar testes ærlig av en annen retning [F: 04 §4]; Quiet Phosphor beholder hub-and-spoke fordi emisjonslogikken krever at én modell dominerer per viewport (lov 1) — en persistent tab-bar er permanent chrome som konkurrerer med instrumentet. [S]

### Roller (bygger på 04 §2, uendret ansvarsdeling)

| Flate | Rolle i Quiet Phosphor | Materiell konsekvens |
|---|---|---|
| **Home** | Benken: siste sannhet + fire instrumentmoduler (se under) | Grafittfelt, ingen scenografi |
| **Range/Impact** | Live eksperiment, én aktiv parameter → flukt | Tracen er eneste emisjon; input-dock i grafitt |
| **Outcome** | Read-only forklaring av siste skudd (lov: masterplan §7.3) | Prosa i ink, årsakskjede med mono-tall, én amber neste-handling |
| **Lab: Geometry 3D** | Romlig leveringsgeometri | Parameter-inks (§4.2) lov å ko-eksistere her |
| **Lab: Strike Window 2D** | Kontaktdiagnose og sekvens | Samme kontrollsystem som Geometry [F: masterplan §7.4] |
| **Lab: Compare/Ghosts** | Delta mot ÉN navngitt referanse | Referansen i `--ghost`-grå, aldri i signal |
| **Impact Studio** | **Slås inn under Lab som «Camera»-linse på Range-tilstanden** — den har ingen eierjobb i masterplanens IA [F: 04 §5 pkt. 5]. Den beholder annotasjonslaget (`--measure`-rollen konsolideres inn i struktur-ink, §4.2). Eiervalg: alternativet er sletting; udefinert «tredje sted» får ikke bestå. | Amber kun på ball/kontaktpunkt |
| **Academy** | Paced læring, mestring, XP | Reward-paletten forblir inngjerdet der |
| **Diagnose** | Strukturert intervju (ushippet mock) [F: 04 §1] | Arver systemet rett fra tokens; ingen egen estetikk |
| **Ask** | Ett-nivås sheet over Range/Outcome/Lab/Academy — aldri fane [F: ask 03 §6] | §8 |
| **Paywall** | Spec-sheet, ikke butikk | §9 |

### Home-spørsmålet: sted eller cluster? (det ærlige argumentet)

Night Ladder er STUDIO-GRADE, eiervalgt, 17/17 manifest, blind-vinner [F: STATUS.md fase 1; SESSION-HANDOFF 2026-07-15]. Å bytte den er ikke en detalj — det er å reversere en låst fase-1-beslutning, og flagges her eksplisitt som **eiervalg med migreringskostnad** [F: master brief §Kildehierarki].

Men Quiet Phosphor kan ikke ærlig beholde den. Argumentet:

1. **Materiell selvmotsigelse.** Night Ladder er en gradert natt-scene: fotografisk range, floodlight-lys, atmosfære. Quiet Phosphors ene lov er «lys kommer kun fra data». Beholdes Night Ladder, er Home den ene skjermen som er unntatt systemets grunnlov — da har vi to designspråk, og det første brukeren møter er det vi ellers forbyr. [S]
2. **Verden-metaforen konkurrerer med instrument-metaforen** — allerede flagget som challenge i first principles [F: 04 §4]. En retning som heter «laboratorium» kan ikke ha en spillverden som inngang.
3. **Det diegetiske stedet var svaret på et annet spørsmål** («kommuniser produktet uten ord», fase 1-exit [F: masterplan §7.1]). Quiet Phosphor svarer på det samme med data: siste skudds trace *er* produktfortellingen — «dette instrumentet viser hvorfor ballen fløy» demonstrert, ikke illustrert.

**Anbefaling [S, eiervalg]:** Home blir **«The Bench»** — et instrument-cluster i austere grammatikk (wireframe i §3). Fase 1-exitkravene gjenbrukes som fasit: produkt + primærhandling forstått < 5 s, én dominant destinasjon, maks to varme soner i ro, alt tappbart uten å vente [F: masterplan §7.1 exit]. Bench må *bestå de samme bevisene* Night Ladder besto, inkl. pairwise-blind mot den — taper den blindtesten, har eieren et reelt grunnlag for å beholde Ladder og heller akseptere fallback.

**Fallback [S]:** «Night Ladder, avkledd» — behold komposisjonen (stige av destinasjoner i dybde), men re-materialisér: fotografisk scene → grafittfelt med hairline-horisont, floodlight-bloom → fjernet, destinasjoner → modul-plater. Billigere (§10), men risikerer å bli et halvt svar: en scene uten scenografi. Flagges som svakere.

---

## 3. Skjermhierarki + wireframes

Hierarkiprinsipp for alle fem flatene: **emisjon > ink > muted > struktur**. Øyet skal alltid lande på det varme først (som er sant), deretter lese grått (som er ramme).

### 3.1 Home — «The Bench» (viktigst, wireframe)

```
┌──────────────────────────────────────┐
│ ◉ FLIGHTGLASS                    [?] │  <- strip: opak g1, mark i ink
│                                      │
│        ·  ~~~~                       │
│      ~~        ~~~                   │  <- LAST SHOT: amber trace m/
│    ~~             ~~~  ·             │     decay-ghost, eneste emisjon
│  _~___________________●________      │  <- hairline-horisont + tick-ruler
│  |....|....|....|....|....|....      │
│                                      │
│  CARRY 182 m   CURVE 14 m L   [MODEL]│  <- mono, tabulær, register-merket
│  Face was open to your path.         │  <- én ink-setning (Outcome-frø)
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ ▸ EXPLAIN THIS SHOT              │ │  <- PRIMÆR: amber fylt, g0-tekst
│ └──────────────────────────────────┘ │
│                                      │
│ ┌───────────────┐ ┌────────────────┐ │
│ │ RANGE         │ │ ACADEMY        │ │  <- moduler: g2-plater, hairline,
│ │ Try it live   │ │ Lesson 4 of 14 │ │     grå tekst, INGEN farge
│ └───────────────┘ └────────────────┘ │
│ ┌───────────────┐ ┌────────────────┐ │
│ │ LAB           │ │ DIAGNOSE       │ │
│ │ Geometry·2D·📷│ │ Find your miss │ │
│ └───────────────┘ └────────────────┘ │
└──────────────────────────────────────┘
```

Én dominant jobb (siste skudd + forklaring), maks to varme soner (trace + primærknapp — innenfor SYS-08-budsjettet på 3), destinasjoner tappbare umiddelbart. `EXPLAIN THIS SHOT` → Outcome; dette syr kjedekravet [F: 04 §3] inn i første skjerm og gir kjerneløftet («see why it flew») en eierflate fra sekund én — revisjonens største strukturfunn besvart strukturelt [F: 04 §1].

### 3.2 Aktiv Range-modell (wireframe)

```
┌──────────────────────────────────────┐
│ ◉  RANGE                    [ASK ？] │  <- opak strip
│                                      │
│         ~~~~~~~~                     │
│      ~~~         ~~~                 │  <- live trace: amber, decay-
│    ~~   (ghost ~~~)  ~~              │     ghosts x2 ved endring
│  _~______________________●____       │
│  |....|....|....|....|....|...       │  <- tick-ruler = baseline (lov 13)
│         APEX ⌐ 31 m                  │  <- maks ÉN struktur-annotasjon,
│                                      │     stiplet grå (ikke violet)
│  CARRY      BALL SPEED   BACKSPIN    │
│  182 m      64 m/s       2 900 rpm   │  <- mono; CARRY i amber = live
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ FACE ANGLE            +2.0°      │ │  <- aktiv parameter: g2-dock,
│ │ ──────────●──────────────────    │ │     slider-thumb i ink (IKKE
│ │ open ◂            ▸ closed       │ │     parameter-hue: alene = ingen
│ └──────────────────────────────────┘ │     hue nødvendig, §4.2)
│  [FACE] [PATH] [ATTACK] [LOFT] [+]   │  <- kompakte selektorer, grå
└──────────────────────────────────────┘
```

Modell + aktiv kontroll + resultat i ett viewport (lov 9). Drag → trace, tall og én årsakssetning oppdateres < 16,7 ms (lov 3/12). Hue-øvelsen er poenget: den aktive parameteren trenger ingen identitetsfarge når den er alene — etiketten eier identiteten, amber eier resultatet.

### 3.3 Forklaringsflate (Outcome) — skisse

Rekkefølge (lov: masterplan §7.3): (1) plain-language-resultat i ink, 17 px; (2) årsakskjede som vertikal liste med mono-tall og register-merker; (3) metrikk-avsløring progressivt (g2-kort, kollapset); (4) **én** anbefalt neste handling i amber («Try closing the face 2° in Range» → `range.preset` når G1 er lukket, ellers `range.open` [F: ask 03 §4]). Read-only: ingen inputs, ingen parameter-inks — kausalitet formidles med rekkefølge og typografi, ikke farger.

### 3.4 Academy-oversikt — skisse

Kursstigen som instrumentpanel: 14 opplevelser som g2-rader, mestring som mono-brøk (`4/14`), XP i `--reward-gold` **kun** i reward-raden (SYS-15 står). Fullførte rader får et grått hake-tick, ikke grønt (status-farger er verdikter, ikke pynt). Neste anbefalte leksjon er radens eneste amber-element. Depth & Light-laget (grain/skylight/bloom) fjernes fra academy.html [F: DESIGN-SYSTEM «Adopted by»].

### 3.5 Paywall — skisse

Spec-sheet, ikke kampanje: §9.

---

## 4. Komplett designsystem-kandidat

Alle kontrastverdier er WCAG 2.1-forhold **beregnet fra hex (ANSLAG)** — skal re-måles på faktisk render før noe låses, samme protokoll som geometry-palettens re-måling [F: sa-p3.css:77–95].

### 4.1 Fargetokens

**Grafitt-strukturskala (erstatter violet-rampen).** Nesten akromatisk, svakt kald (oklch C ≤ 0.012, H≈250–260 — kald nok til å kjennes som gunmetal, aldri nok til å leses som blå):

| Token | Hex | OKLCH | vs g0 | vs g2 | Rolle |
|---|---|---|---|---|---|
| `--g0` (bg) | `#0B0C0E` | oklch(15.4% 0.005 264) | — | — | App-grunn. Merk: *lysere* enn P3s #07060C — svart-svart er kino, grafitt er materiale [S] |
| `--g1` (surface) | `#15171A` | oklch(20.4% 0.007 258) | 1.09 | — | Strip, sticky chrome (opak, SYS-13) |
| `--g2` (panel) | `#1C1F23` | oklch(23.8% 0.009 256) | 1.18 | — | Kort, dock, sheets — erstatter både `--plate` og `--plate-solid` |
| `--g3` (control) | `#24272C` | oklch(27.2% 0.010 261) | 1.31 | 1.10 | Kontrollfyll, pressed-tilstand |
| `--ink` | `#E8EAED` | oklch(93.6% 0.005 258) | 16.24 | 13.72 | Primærtekst |
| `--muted` | `#A6ACB3` | oklch(74.2% 0.012 252) | 8.55 | 7.23 | Sekundærtekst (≥7:1 overalt, som P3s kontraktkrav) |
| `--dim` | `#81888F` | oklch(62.4% 0.013 248) | 5.45 | 4.61 | Telemetri-etiketter (≥4.5:1 på alle flater) |
| `--line` | `rgba(255,255,255,.08)` | — | — | — | Dekorativ hairline |
| `--line-strong` | `rgba(255,255,255,.22)` | — | — | — | Interaktiv hairline |
| `--struct` | `#9BA6B1` | oklch(72% 0.02 250) | 7.90 | 6.68 | **Struktur-ink**: akser, mål, estimatlag, stiplede annotasjoner — overtar HELE violet-strukturrollen (og `--measure`-rollen) |
| `--ghost` | `#9299A1` | oklch(68% 0.015 250) | 6.80 | 5.74 | Referanse-traces only (avvioletisert `#A7A0C4`) |

**Ett sannhetssignal — re-derivert ember.** Behold varm familie, juster hue: fra H 46.5° (solnedgangs-oransje, [F: #FF8A4D = oklch(75.2% 0.161 46.5), beregnet]) til **H 62°** — inn i amber-fosfor-territoriet (ekte P3-fosfor er gul-amber). Begrunnelse [S]: (a) på violet grunn trengte signalet rødvarme for å skille seg fra kald bakgrunn; på nøytral grafitt kan det gå mot renere amber uten å miste varmeidentitet, (b) amber er den provenance-riktige emisjonsfargen for instrumenter, (c) 62° øker avstanden til `--bad` (H 15) og `--q-face` (H 25) — varm alarm og varmt signal forveksles sjeldnere. Chroma ned fra 0.161 til 0.145: emisjon, ikke neon.

| Token | Hex | OKLCH | vs g0 | vs g2 | Rolle |
|---|---|---|---|---|---|
| `--signal` | `#F9A04A` | oklch(78% 0.145 62) | 9.46 | 8.00 | Live ball/trace, ETT levende tall, ÉN primærhandling |
| `--signal-tip` | `#FFF4E4` | — | 18.00 | — | Hvit-varm kjerne, KUN canvas/3D-lyskarving (arvet regel) |
| `--signal-soft` | `rgba(249,160,74,.14)` | — | — | — | Fyll bak amber-handling |
| `--signal-line` | `rgba(249,160,74,.55)` | — | — | — | Trace-strøk sekundærvekt |

Tekst på amber-fylt knapp: `--g0` på `--signal` = 9.46 (ANSLAG) — godt over AA.

**`--secondary` (violet) fjernes helt.** Ingen ny «sekundærfarge» innføres; rollen deles mellom `--struct` (tegnende struktur) og `--ink`/`--muted` (chrome/lærte begreper — lærte begreper markeres med stiplet underline i `--struct`, ikke farge).

### 4.2 Parameterhues: 8 → 6, og en semantisk opprydding

Dagens åtte [F: DESIGN-SYSTEM §1]: face, path, attack, loft, launch, plane, depth, strike (+ ghost). SYS-11s 1:1-binding beholdes; **antallet** reduseres med en prinsipiell kniv:

> **Klubb-siden får identitets-inks; ball-siden er amber.** Størrelser som beskriver *leveringen* (face, path, attack, loft, plane, kontakt) trenger å skilles fra hverandre når de ko-vises (Geometry, chips). Størrelser som beskriver *ballens flukt* (launch, apex, land angle) er motorens output — de ER sannheten og tegnes i amber/struktur på tracen, aldri som egne identitetsfarger.

Endringer:
1. **`--launch` (citron) fjernes** — launch angle er tracens starttangent: amber tick + mono-verdi på selve tracen. Fjerner samtidig den evige citron/gull/warn-nabokrangelen [F: sa-p3.css:112–117 re-tuning-historikken er selv beviset på at gul-familien var overbefolket].
2. **`--depth` (orchid) + `--strike` (gull) slås sammen til `--q-contact`** — begge beskriver kontaktpunkt (dybde langs bakken / høyde på flaten) og ko-vises kun på face-/turf-diagrammer der geometrien (akse) allerede disambiguerer; hue skiller *familien* kontakt fra face/path/attack, markørform skiller høyde fra dybde. [H — må valideres på Geometry-skjermen i prototype; hvis brukertest viser forveksling, er tilbakefall en 7. hue, logget som åpen risiko]
3. **`--measure` (amber-gul dimensjonslinje-rolle) konsolideres inn i `--struct`** — dimensjonslinjer er struktur, ikke en egen varm stemme [F: sa-p3.css:150–154].
4. De gjenværende seks re-derives med jevn chroma (0.08–0.12) og hue-avstand ≥ 35°:

| Størrelse | Token | OKLCH | Hex | vs g0 | vs g2 |
|---|---|---|---|---|---|
| Face angle | `--q-face` | oklch(72% 0.12 25) | `#E6857E` | 7.47 | 6.32 |
| Attack/low-point | `--q-attack` | oklch(76% 0.10 165) | `#6FC5A1` | 9.48 | 8.02 |
| Club path | `--q-path` | oklch(76% 0.09 235) | `#76BBE2` | 9.30 | 7.86 |
| Swing plane | `--q-plane` | oklch(72% 0.08 268) | `#8FA3D8` | 7.83 | 6.61 |
| Dynamic loft | `--q-loft` | oklch(74% 0.09 305) | `#B89DD9` | 8.26 | 6.98 |
| Contact (høyde+dybde) | `--q-contact` | oklch(74% 0.10 330) | `#CF94C9` | 8.14 | 6.88 |

Alle ≥ 6.3:1 (ANSLAG) — over P3s egen 7:1-praksis på g0, to under 7 på g2; re-mål på render og juster L opp ved behov. Loft (305) er den eneste violet-overlevende — demotert fra krone til én annotasjons-ink blant seks. [S]

**Bruksregel (skjerping av SYS-11):** parameter-inks finnes KUN der ≥ 2 størrelser ko-vises (Geometry, Strike Window, Compare-chips, Academy-leksjoner som lærer relasjonen). En parameter alene identifiseres av etikett + posisjon — aldri av hue. Range-docken i §3.2 er normativ.

### 4.3 Status & reward (fortsatt inngjerdet)

| Rolle | OKLCH | Hex | vs g0 | Gjerde |
|---|---|---|---|---|
| `--good` | oklch(78% 0.13 155) | `#6CD092` | 10.32 | Verdikter i merkede chips; ALDRI på instrument-canvas (kontekst-gjerdet mot `--q-attack` H165) |
| `--warn` | oklch(85% 0.12 95) | `#E6CD6D` | 12.41 | Status-verdikter only (gull-splitten står [F: sa-p3.css §1.2-notat]) |
| `--bad` | oklch(70% 0.15 15) | `#EC7380` | 6.83 | Som i dag; nabo til `--q-face` er arvet P3-presedens, samme kontekst-gjerde |
| `--reward-gold` | oklch(78% 0.09 85) | `#D2B373` | 9.72 | XP/badges/mastery (SYS-15-allowlist uendret) |
| `--celebrate` | oklch(72% 0.15 350) | `#E97AB2` | 7.35 | Celebration-ØYEBLIKK only; chroma ned fra P3s #FF5CE1 — feiring i et laboratorium er et nikk, ikke fyrverkeri [S] |

**Signalbudsjett (SYS-08 skjerpet):** maks **2** amber-elementer i ro (trace/ball + primærhandling) — ned fra 3. Det «levende hero-tallet» får amber kun mens det endres live; i ro faller det til ink. Kodifiserte unntak beholdes: logo-ballen. `START HERE ·`-prefikset på Home videreføres som Bench-primærknappen (samme intensjon, én flate).

### 4.4 Lys/dybde-logikk: «lys kommer kun fra data»

Uten glød og plater vises heving/hierarki slik:

1. **Elevasjon = verditrinn i grafittskalaen.** g0 → g1 → g2 → g3 er de fire eneste nivåene; et element «løftes» ved å gå ett trinn opp + `--line`-hairline. Ingen box-shadows, ingen gradient-plater, ingen bakt kantlys.
2. **Ingen backdrop-blur.** `.sa-plate` blir flat `--g2` + hairline. Sticky chrome er opak `--g1` (SYS-13 krevde det uansett). Blur-unntak: ingen. [Eiervalg: dette endrer .sa-plate-kontrakten alle skjermer deler]
3. **Emisjonsregelen (den nye grunnloven):** kun elementer bundet til motor-output får overstige strukturens chroma-tak (C 0.02) i varm familie. Alt varmt på skjermen skal kunne peke på tallet/tilstanden det representerer. En designer som vil ha noe varmt, må først finne dataen som motiverer det.
4. **Glød finnes bare som fosfor-fysikk på canvas:** tracen kan ha ≤ 2 px kjerneforsterkning mot `--signal-tip`; DOM-tekst har aldri text-shadow. P3s «glow blur ≤ 0.4× font-size»-lov erstattes av «glow = 0 i DOM».
5. **Fokus:** dobbel ink-ring uendret [F: sa-p3.css:196–210] — den var aldri stemning.

### 4.5 Typografi

| Rolle | Face | Endring |
|---|---|---|
| ui | **Inter** 400/500/600 | Beholdes (vendored [F: sa-p3.css:37–40]) |
| data | **IBM Plex Mono** 400/500/600 | Beholdes — og UTVIDES: **alle numeraler er mono**, også hero-størrelser. P3 lot Space Grotesk eie «hero numerals ≥28px» [F: DESIGN-SYSTEM §2], i direkte spenning med lov 11 («all live readouts use tabular numerals … mono»). Quiet Phosphor løser spenningen i monos favør: et hero-tall ER en readout. Optisk justering ved display-størrelser: letter-spacing −0.02em, weight 500. |
| display | **Space Grotesk** 600/700 | Demoteres til wordmark + ikke-numeriske seksjonsoverskrifter. Én display-stemme, aldri tall. |
| — | **Fraunces** | **Termineres.** Showcase-avviket (front page + geometry) [F: DESIGN-SYSTEM §2] var graverings-romantikk; tre stemmer var én for mye [F: 04 §5 pkt. 2]. Ingen per-side @font-face-unntak overlever. |

Gulv og grammatikk uendret: intet under 10 px, `value␣unit`, U+2212, SYS-05-ordboken ordrett [F: DESIGN-SYSTEM §2].

### 4.6 Spacing & radii

4/8-grid og 16 px innhold-inset beholdes [F: DESIGN-SYSTEM §3]. Radii strammes ett hakk mot instrument: kontroller 10 px (fra 12), kort/paneler 14 px (fra 16), lens-nivået (20 px) **fjernes** — lens-tieret var glassets radius, og glasset er borte. Piller 999 px består. [S; flagges som brytning av SYS-07-verdiene]

### 4.7 Komponentgrammatikk

- **Panel** (`--g2`, hairline, 14 px): eneste flate-primitiv. Ingen «kort med heading + skygge»-SaaS-mønster; panelet har alltid en 10 px uppercase `--dim`-etikett i overkant, som gravert utstyrsmerking — tekst, ikke ornament.
- **Dock** (aktiv parameter, §3.2): g2-panel med slider; thumb i ink, spor i `--line-strong`, detents som ticks i `--struct`.
- **Chips/selektorer**: g3-fyll, ink-tekst; valgt = `--line-strong`-ramme + ink, IKKE farget fyll.
- **Tick-ruler**: baseline-signaturen (lov 13) — hairline + `--struct`-ticks; brukes som fotlinje på enhver trace-flate.
- **Registre**: `MODEL` (mono ink), `≈ EST` (mono `--muted` med ≈), `TOUR — not the simulator` (`--struct`-chip), user-echo (ui-font, `--muted`) — mekanisk håndhevet via Ask-kontraktens NumToken-registre [F: ask 03 §1 regel 2].
- **Sheet**: ett nivå, `--g2` opak, hairline-topp, push/pop in-place (stacking forbudt [F: ask 03 §6]).

### 4.8 Interaksjonstilstander

Pressed: `scale(.97)` + `--g3`, 80 ms (uendret). Disabled: 40 % opacity (uendret). Hover (desktop): `--line` → `--line-strong` — aldri lysning av fyll (lys er data). Focus: §4.4.5. Hit ≥ 44 px inkl. bevegelige mål (uendret kontrakt).

### 4.9 Motion — phosphor-decay-arven presisert

**Hvor ghosts er LOV (data):** på trace-canvas når input endres — maks 2, fallende opacity, kun på strøket, aldri på tall (lov 12 ordrett). I Compare, der ghosten ER referansen (i `--ghost`-grå, ikke amber).

**Hvor de var DEKOR (fjernes):** hover-trails, nav-overganger med etterslep, «ambient» pulsering på Home-scenen, floodlight-oppvåkning, bloom-pust på hero-tall.

Øvrige regler: `--ease` beholdes for det lille som beveger seg; **entry-koreografi = 0 s** (skjerping fra ≤ 2.6 s — instrumentet er på, punktum); Aperture-signaturovergangen beholdes som eneste delte element, re-tegnet som hairline-iris i `--struct` uten glød; transient-flater animerer inn OG ut; reduced motion = komplett, statisk, funksjonell paritet (uendret); ambient-loops finnes ikke lenger, så visibilitychange-regelen blir triviell.

### 4.10 Haptikk

sa-haptics.js-kontrakten beholdes uendret [F: DESIGN-SYSTEM §6] — den er allerede Quiet Phosphor i vibrasjonsform: fysiske hendelser og detents, launch som eneste heavy, aldri dekor. Eneste endring: Home-cluster-modulene får INGEN haptikk (nav er stille, HIG-regelen som allerede står).

### 4.11 Systemet på de fem flatene (sammendrag)

| Flate | Emisjon (amber) | Parameter-inks | Grunn |
|---|---|---|---|
| Home/Bench | Siste trace + EXPLAIN-knapp | ingen | g0-felt, g2-moduler |
| Range | Live trace + live verdi under drag | ingen (etikett eier identitet) | g0 + g2-dock |
| Outcome | Én neste-handling | ingen | g0, prosa i ink |
| Academy-oversikt | Anbefalt neste leksjon | kun inne i leksjoner som ko-viser størrelser | g2-rader; reward-gull i XP-raden |
| Paywall | Én kjøpsknapp (Annual) | ingen | g1/g2 spec-sheet |

---

## 5. Anti-brief

Quiet Phosphor er IKKE:

1. **Cyberpunk-dashboard**: ingen neon-kanter, ingen hex-grid-bakgrunner, ingen «HUD»-hjørneklammer, ingen scanlines.
2. **Neon-glød**: ingen text-shadow, ingen box-glow, ingen «pulserende» tilstander. Amber er blekk med strøm i seg, ikke et lysrør.
3. **Tron/Blade Runner-arv**: ingen rutenett mot horisonten, ingen violet/cyan-duotone, ingen regnvåt refleks. (Dette er P3s slektstre — se glidebane 1.)
4. **Generisk mørk SaaS**: ikke slate-paletten + oransje aksent + skygge-kort. Skillet bæres av instrumentgrammatikken: tick-ruler, mono-registre, emisjonsregelen, én-jobb-per-viewport. Fjern dem, og dette ER Linear med amber — derfor er de ikke valgfrie.
5. **Gaming peripheral RGB**: parameter-inks er merkede måle-blekk med jevn, lav chroma — aldri regnbue-koding, aldri fargede glows, aldri «tema»-farger.

### Tre glidebaner (og vaktene)

1. **Den farligste: tilbake til P3 av vane.** Hver gjenbrukt komponent drar med seg en violet rgba, et blur-kall, en bloom-klasse — og «bare denne chippen» blir til stemning igjen på seks uker. **Vakt:** chroma-lint i bygget: strukturtokens C ≤ 0.02, hue 240–270 forbudt over C 0.03 (violet-detektor); grep-gate på `backdrop-filter`, `text-shadow`, `--secondary`, `.sa-bloom`, `.sa-depth` — alle fem skal gi 0 treff i skipping CSS. Doktrine-lint fremfor prosa; prosa håndhever ikke seg selv.
2. **Generisk mørk SaaS.** Når emisjonsregelen kjennes «streng», legger noen inn en skygge her og en gradient der for «dybde» — og distinktiviteten dør i god mening. **Vakt:** hver instrumentflate må bestå en signatur-sjekkliste (tick-ruler synlig? alle tall mono? ≤ 2 amber i ro? elevasjon kun via g-trinn?) i samme evidensmanifest-regime som lov 11–13 [F: masterplan §2, instrument-gates].
3. **Terminal-cosplay.** Fosfor-metaforen inviterer til scanlines, CRT-kurvatur, blinkende cursor, ASCII-pynt — metafor blir kostyme. **Vakt:** fosfor finnes KUN som decay på trace-canvas (§4.9); enhver «retro»-tekstur er lov 6-brudd per definisjon.

---

## 6. Instrumentlovene 1–13

| Lov | Etterlevelse i Quiet Phosphor | Endring |
|---|---|---|
| 1. Én dominant jobb | Emisjonsregelen gjør dominans fysisk: det varme er jobben | Etterleves, forsterket |
| 2. Progressiv avsløring | Ett-nivås sheets, kollapsede metrikk-paneler; stacking forbudt | Etterleves |
| 3. Modellen forsvinner aldri under input | Range-dock under tracen; drag → live | Etterleves |
| 4. Tall er sannhet, visuals tolkning | Skjerpes: bloom på tall fjernet (et glødende tall er et dekorert tall); registre mekanisk typografert | **Skjerpet** |
| 5. Ember = primær sannhet/handling; Model Violet = struktur; Gold = mestring | Semantikken beholdes, bærerne endres: amber(re-derivert)=sannhet/handling, `--struct`-grå=struktur, reward-gold=mestring. Lovteksten navngir «Model Violet» — omformulering til «Structure ink» er **eiervalg** | **Omformulering flagget** |
| 6. No AI-slop | Skjerpes: dagens system bryter selv lov 6 i praksis (dekorativ glassmorfisme i .sa-plate, arbitrær scene-gradient) [S — hard mot eget system]; blur/grain/bloom/skylight fjernes; lov 6 får en målbar form via emisjonsregelen + lint-vaktene (§5) | **Skjerpet** |
| 7. Golf-plausibilitet | Uendret; fysikk vinner over bilde | Etterleves |
| 8. Native interaksjonsgrammatikk | 44 px, safe areas, fokus-paritet, RM-paritet — uendrede kontrakter | Etterleves |
| 9. Intet essensielt under folden i instrumenttilstand | §3.2-wireframen er normativ | Etterleves |
| 10. Engelsk produkt-UI | Uendret | Etterleves |
| 11. Én grotesk + én mono; tabulære readouts; U+2212 | Skjerpes: hero-numeraler flyttes fra Space Grotesk til mono — P3s indre motsigelse (display-face på readouts) løses i lovens favør | **Skjerpet** |
| 12. Truth answers immediately; fosfor-decay; én signaturovergang | Skjerpes: entry-koreografi 0 s; ghosts presisert data-only (§4.9); Aperture beholdt, avkledd glød. RM-paritet ordrett | **Skjerpet** |
| 13. Render-signatur: ember-linje m/ decay, tick-ruler, landingspunkt eneste markør, «violet tegner struktur», maks én annotasjon | Beholdes strukturelt; «violet» → `--struct`-grå er samme **omformulerings-eiervalg** som lov 5; «no decorative glow» håndheves nå også mot systemets egne Depth & Light-unntak | **Skjerpet + omformulering flagget** |

Lovendringer som krever eier: lov 5/13-omformulering (violet→struktur-ink), SYS-07-radiiverdiene, SYS-08-budsjettet 3→2, entry-koreografi-lovens 2.6 s→0. Alt annet er etterlevelse eller innstramming innenfor lovens intensjon (som IKKE er ulåst [F: master brief]).

---

## 7. Illustrasjons- og bilderegler

1. **Natteland-fotoets skjebne:** fjernes fra alle produktflater. Night Ladder-scenens graderte range-assets pensjoneres sammen med Home-avgjørelsen (§2); ved fallback («avkledd Ladder») erstattes fotografisk grunn med tegnet grafittfelt. Fotoet kan leve videre i **markedsføring** (store/landing), aldri i instrumentet. [Eiervalg, følger Home-valget]
2. **Alt i produktet er tegnet fra data:** SVG/Canvas generert av motor-tilstand eller håndtegnet i tokensystemet. Ingen stockfoto, ingen AI-genererte scener (lov 6), ingen raster der vektor kan.
3. **Provenance-regime:** hvert gjenværende raster-asset føres i et manifest (fil, kilde, lisens, dato, hvilken flate) — samme sporbarhets-logikk som evidensmanifestene. Nye bilder krever dokumentert asset-gap først [F: master brief-grensen «ingen nye bilder»].
4. **Diagram-stil:** struktur i `--struct`, data i amber, referanse i `--ghost`, maks én stiplet annotasjon (lov 13). Ingen «illustrative» himler, ingen dekorative golfere; mennesker vises aldri — instrumentet måler leveringen, ikke kroppen. [S]
5. **Dusk-scenen på Impact-kamera** (`--dusk-*`-familien) erstattes av grafittfelt + hairline-horisont + tick-bakke. [H — høydepersepsjon uten himmelgradient må valideres i prototype; fallbacken er en monokrom luminans-gradient i grafitt (C=0), aldri en farget himmel]

---

## 8. Ask Flightglass-plassering

Følger answer-kontraktens §6 ordrett [F: ask 03 §6] — Quiet Phosphor endrer materialet, ikke arkitekturen:

- **Innganger v1:** Range/Outcome/Lab + Academy («Ask about this» på begrepsnivå). Kontekst-chippen («Include current shot: face +2.0° …») er avkryssbar før sending; i grafittsystemet er den et g3-chip med mono-verdier — synlig samtykke, ingen stille kontekstdeling.
- **Home-inngangen forblir UTSATT** (board P1-5). Merk konsekvens av §2: velges Bench-Home, forsvinner masthead-`?`-ets Night Ladder-kontekst; `?`-affordancens skjebne avgjøres i O10-punktet sammen med Ask-prototypen — Bench reserverer plassen i strip-en uten å love den. [F: ask 03 §6; eiervalg-avhengighet logget]
- **Sheet:** ett-nivås bunn-sheet i opak `--g2` (ingen blur — kontraktens sheet arver §4.4.2), push/pop in-place, stacking forbudt, fokusfelle + retur, `aria-live=polite`, ≤ 5 s ventestatus, RM uten slide.
- **Amber-budsjettet i sheetet:** svaret er tekst i ink; tall rendres per NumToken-register (§4.7); den ENE deeplink-primærhandlingen er sheetets eneste amber-element. `cannot_say`-linjen settes i `--muted` — ærlighet er ikke en feiltilstand og skal ikke se ut som en. [S]
- Aldri persistent boble, aldri chrome som konkurrerer med modellen (kontrakten ordrett).

---

## 9. Freemium/Pro-plassering

Innholdet er låst av masterplanen fase 7 og beholdes ordrett [F: masterplan §7.7]: produktutbytte før priser; Pro knyttet til Range-eksperimentering, Academy-mestring og dypere Lab; **kr 99** mnd / **kr 590** år med «2 months free» (aldri prosent); Annual anbefalt; Lifetime skjult men RevenueCat-ID bevart; restore/legal tilgjengelig; ingen falsk urgency. (Stige-avviket 99/590 vs 99/399/999 er FR-O8 — eierrydding, ikke denne retningens sak [F: 08-decision-log].)

**Quiet Phosphor-formen: paywallen er et spec-sheet, ikke en kampanje.** Paywall er flaten der mørk-SaaS-gradient-fristelsen er størst (glød = kjøpepress); her er austeriteten selv konverteringsargumentet — instrumentet selger seg som instrument:

- Øverst: én amber trace over tick-ruler («what Pro explains») — utbyttet vist med selve renderspråket, ikke med markedsgrafikk.
- Kapabilitetsliste som utstyrs-spesifikasjon: g2-rader, mono der tall inngår, hake i `--struct` (ikke grønt — status-farger er verdikter).
- Prisrader: Annual-raden markert med `--line-strong`-ramme + «2 months free» i ink; **kjøpsknappen er skjermens eneste amber**. Monthly som stillferdig rad under.
- `Restore purchases` / legal i `--dim`, alltid nåbare.

**Kostnad/risiko [S/H]:** re-skin av paywall-flaten er S/M (§10). Risiko: austere paywall kan konvertere svakere enn varm — [H, må A/B-testes i fase 7-regimet; exit-beviset «value proposition forstått før pris» består uendret]. Motrisiko: glød-paywall i et glødfritt system ville brutt tilliten produktet nettopp har bygget — prisen på det måles ikke i én konverteringsrate. [S]

---

## 10. Teknisk gjennomførbarhet + migreringskostnad

**Ærlighetsklausul først:** Quiet Phosphor har trioens minste migrering fordi den deler topologi med P3 (mørk grunn, varm trace, samme fonter, samme komponentskjelett). Det er et *faktum om kostnad*, ikke et *argument for kvalitet* — retningen skal vinne på §1–§9 eller ikke i det hele tatt. Fasiten for «vunnet» er fase C-kriteriene + pairwise-blind, ikke diff-størrelsen. [F: feedback port-må-ha-fasit]

**Migreringsmekanikk:** ~90 % av skiftet skjer i `sa-p3.css` fordi konsumentene bruker var()-tokens [F: sa-p3.css er delt kohesjonskilde]. Sekvens: (1) token-verdier re-pekes (grafitt + amber + 6 inks), (2) `.sa-plate`/strip avblurres, (3) `.sa-depth`-laget slettes fra de tre adopterte sidene, (4) scene-/dusk-gradienter erstattes per flate, (5) Fraunces-@font-face fjernes fra de to sidene, (6) lint-vaktene (§5) inn i byggevakten. Beskyttede identifikatorer, lagringsnøkler og fysikk røres ikke [F: masterplan §3].

| Flate | Kost | Hva som faktisk må gjøres |
|---|---|---|
| sa-p3.css (tokens+laws) | **M** | Verdi-swap er S; lov-blokk-tekstene (SYS-07/08/11), hue-konsolideringen (launch/measure/depth/strike) og lint-vaktene gjør det M |
| Home | **L** (Bench) / **M** (avkledd Ladder) | Bench er nybygg m/ full evidens-runde + blindtest mot Ladder; fallback er re-grading av eksisterende komposisjon |
| Range/Impact + Visualise | **M** | Dock/chips arver tokens (S), men dusk-scenen → grafittfelt er ny canvas-grunn + [H]-validering av høydepersepsjon |
| Outcome | **S/M** | Ushippet flate-arv; bygges rett i systemet — men den ER kjedekravets nøkkelflate, så evidenskravet er høyt |
| Geometry 3D + Strike Window | **M** | Hue-rewire (contact-sammenslåingen) + fjerning av brass-graveringer/Fraunces; 3D-lyssettingen må avvioletiseres |
| Academy (oversikt+leksjoner) | **M** | .sa-depth-fjerning, reward-re-derivering, hero-numeraler → mono på tvers av 14 opplevelser |
| Impact Studio → Lab/Camera | **S** | Flytt + `--measure`→`--struct`; annotasjonslogikken består |
| Paywall | **S/M** | Spec-sheet-re-skin over eksisterende sa-paywall.js-flyt; IDs urørt |
| Diagnose (mock) | **S** | Ushippet; arver tokens |
| Ask (spec) | **S** | Materialregler inn i prototype-spec (12); arkitektur uendret |

**Risikoregister:** (1) glidebane 1 — vane-regresjon til P3; mitigeres av lint, ikke prosa (§5); (2) [H] contact-sammenslåingen kan feile i Geometry-brukertest → tilbakefall til 7. hue; (3) [H] høydepersepsjon uten himmel; (4) blindtest-tap for Bench mot Night Ladder → dokumentert fallback finnes; (5) [H] austere paywall-konvertering (§9); (6) alle kontrasttall er ANSLAG til render-måling — samme re-målingsplikt som geometry-paletten hadde [F: sa-p3.css:77–80].

**Irreversible/eiervalg samlet:** Home-beslutningen (reverserer fase 1-lås), lov 5/13-omformuleringen, .sa-plate-kontrakten (blur av), SYS-07/08-verdiene, Fraunces-terminering, Impact Studio-innplassering, natteland-foto til marketing-only, entry-koreografi 0 s.
