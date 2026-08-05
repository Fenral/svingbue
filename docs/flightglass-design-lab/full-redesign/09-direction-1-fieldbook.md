# Full Flightglass-revisjon — 09 Retning 1: «FIELDBOOK» — dagslys-instrumentet

**Merking:** [F] = faktum fra repo/kilde · [H] = testbar hypotese · [S] = designvurdering/smak.
**Kontrastforhold i §4 er beregnet** (WCAG 2.x relative luminance, script kjørt 2026-08-05) — ikke anslått, med mindre eksplisitt merket ANSLAG.
**Materielt brudd med Ultraviolet Ember** [F: mandatkrav 00 §Mandat]: huefamilie (varmt papir ~hue 90 vs kald UV-violet), lyslogikk (ambient dagslys, null glød/bloom), materialitet (blekk avsatt på papir vs lys bak glass), emosjonelt register (rolig vitenskapelig dag vs ladet natt).

---

## 1. Kreativ tese + de tre første sekundene

**Tesen: sannheten trenger ikke natt.** Ultraviolet Ember låner autoritet fra mørket — glød, natt, «pro-instrument»-stemning som hele kategorien deler [F: 04 §4 «challenge»-verdiktet]. Fieldbook hevder det motsatte: et instrument som er sikker på tallene sine trenger ingen scenografi. Flightglass blir en presis felthåndbok — instrumentark trykket på benhvitt papir, blekk-linjer gravert som på en skyvelære, og nøyaktig ÉN signalfarge som betyr «dette er levende sannhet akkurat nå». Teenage Engineering-produktark møter feltbiologens notatbok: teknisk, nummerert, nysgjerrig — aldri koselig.

**De tre første sekundene (kald åpning):** Skjermen er varm benhvit — ikke «tom hvit app», men et *ark*: en tynn blekk-linjal langs toppen med graverte ticks, arknummer oppe til høyre (`SHEET 00 · INDEX`), wordmark satt i display-serif som et trykt titelfelt. Under: én levende ball-trace i signal-oransje blekk over en gravert avstandslinjal — det eneste fargede elementet på siden — og ett mono-tall som ticker inn (`CARRY 214 m`). Følelsen: «noen har målt dette nøye, og jeg får se journalen». Ingen intro-choreografi [F: 04 §5.3 — regelen gjøres permanent]; arket er bare *der*, som en side man slår opp på.

Emosjonelt register: rolig vitenskapelig nysgjerrighet. Papiret er varmt (ikke klinisk), blekket er sikkert (ingen skisse-skjelv), signalfargen er disiplinert (én ting om gangen er levende).

---

## 2. Appkart og navigasjon

### 2.1 Roller (bygger på 04 §2, uendret ansvarsdeling — ny metafor)

| Flate | Fieldbook-rolle | Metafor |
|---|---|---|
| **Home** | Indeksarket/omslaget: siste skudd som «siste journalpost», inngang til alle ark | `SHEET 00 · INDEX` |
| **Range** (Impact) | Det aktive instrumentarket: én parameter live → flukt live | `SHEET 01 · RANGE` |
| **Outcome** | Skuddrapporten: read-only forklaring av siste skudd, plain language + årsakskjede | `REPORT` — et «utskrevet» ark |
| **Lab** (Geometry/Strike Window) | Appendiks-plansjene: dypere geometri for den som vil se mekanikken | `PLATE A / PLATE B` |
| **Impact Studio** | **Ingen egen flate.** [F: 04 §5.5 — udefinert «tredje sted»]. Forslag: slås sammen med Range som en presentasjons-*lens* (samme modell, større scene, chrome trukket tilbake). Alternativ: arkiveres. **Eiervalg — flagges, ikke stille droppet.** | (lens på Sheet 01) |
| **Academy** | Den innbundne kursboken: kapitler, mestring, XP | `COURSE BOOK` — egen bok, ikke et ark |
| **Diagnose** | Intervjuskjemaet: strukturert utfylling → sannsynlig levering | `FORM D-1` |
| **Ask** | Margslippen: ett spørsmål → kort svar → deeplink. Aldri destinasjon [F: ask/03 §6] | slip/bottom sheet over gjeldende ark |
| **Paywall** | Bestillingskortet: ærlig ordreskjema for Pro | `ORDER FORM` |

### 2.2 Nav-modell: «instrument-arkfane» (index-tab)

Modellen: appen er en *ringperm av nummererte ark*. Home er indeksarket. Langs skjermens kant (bunn, i tommelsonen) ligger en smal **arkfane-rekke** — som bleed-tabs i en felthåndbok: `INDEX · RANGE · REPORT · PLATES · BOOK`. Fanene er trykte etiketter (11 px caps, blekk), aktiv fane får signal-understrek + arknummer. Diagnose og Ask er ikke faner: Diagnose er et skjema man åpner fra Index/Report; Ask er en slipp som legger seg over ethvert ark.

**Ærlig argumentasjon for/mot vs hub-and-spoke:**

*For arkfaner:* (a) Kjedekravet [F: 04 §3] krever at utfall→forklaring→eksperiment→læring aldri mister kontekst; faner gjør returveien strukturell (fanen står der, arket husker tilstanden sin) i stedet for å avhenge av en hub-retur som i dag mister alt [F: 04 §3 — tre kjedebrudd]. (b) 04 §4 krever at ÉN retning tester tab-bar-standarden ærlig — «bruddet må bevises, ikke antas»; Fieldbook er den naturlige bæreren fordi arkfane-metaforen gjør tabs *diegetiske* (register-tabs i en bok) i stedet for generisk chrome. (c) Fem etiketter er innenfor HIG 3–5.

*Mot:* (a) Masterplan §6 sier flatene er modi i én kausal reise, ikke søsken — faner risikerer å presentere `REPORT` som en destinasjon man «går til» selv når det ikke finnes noe siste skudd (tom-tilstand må designes ærlig: «No shot recorded yet — hit one on the Range»). (b) Fase 1 Night Ladder-Home er en låst, akseptert leveranse [F: 00 §Kildehierarki]; å erstatte diegetisk verden med indeksark er et **eiervalg som må dokumenteres eksplisitt**, aldri stille redesign. (c) Persistent fanerad koster ~48 px vertikal høyde mot lov 9 (alt over folden i instrumenttilstand) — på Range kan fanen auto-minimeres til en 20 px «bokrygg» under aktiv manipulasjon [S].

*Konklusjon [S]:* arkfane-modellen antas som Fieldbooks primærmodell fordi den løser kontekst-tapet strukturelt og gjør kategoristandard-testen ærlig; hub-and-spoke beholdes som fallback hvis prototypen viser at `REPORT`-fanens tom-tilstand skaper mer forvirring enn hub-en gjorde. Avgjøres på prototype-evidens [H: målbart — andel brukere som finner tilbake til aktiv Range-tilstand etter et Academy-avstikk].

---

## 3. Skjermhierarki

### 3.1 Home — `SHEET 00 · INDEX` (viktigst nr. 1 — wireframe)

Dominant jobb: «siste journalpost + gå dit du skal». Ett dominant element: siste skudd-trace i signalblekk.

```
┌─────────────────────────────────────────────┐
│ |....|....|....|....|....|....|....|....|   │  <- gravert topplinjal (blekk-ticks)
│ FLIGHTGLASS                    SHEET 00     │  <- wordmark (display-serif) · arknr (mono)
│ Field book of ball flight        INDEX      │  <- undertittel, muted
│ ─────────────────────────────────────────── │  <- hairline
│  LAST SHOT · TODAY 14:32          [REPORT →]│  <- eyebrow (mono caps) · sekundærlenke
│                                             │
│        ___..--~~~~--..                      │
│   ●--~                 ~--..__              │  <- trace i SIGNAL-blekk (eneste farge)
│  _|____|____|____|____|____|__\_____        │  <- baseline-linjal m/ ticks, landing = ○
│  0    50   100  150  200   [214 m]          │  <- landingsmarkør + mono-verdi (signal)
│                                             │
│  CARRY 214 m · CURVE 12 m L · APEX 31 m     │  <- mono, blekk — tall er sannhet
│  "Face open to path — it started right      │
│   and curved further right."                │  <- én setning plain language (ui-font)
│ ─────────────────────────────────────────── │
│  CONTENTS                                   │  <- indeksliste, nummerert som i en manual
│  01  RANGE      Experiment live         →   │
│  02  REPORT     Why it flew             →   │
│  03  PLATES     Geometry & strike       →   │
│  04  COURSE     Learn it properly   ◐ 6/14  │  <- mestring i mono, reward-gull KUN på ◐
│  05  FORM D-1   Diagnose my miss        →   │
│─────────────────────────────────────────────│
│ [INDEX] RANGE   REPORT   PLATES   BOOK      │  <- arkfaner, aktiv = signal-understrek
└─────────────────────────────────────────────┘
```

Hierarki: 1) trace + carry-tall (signal), 2) forklaringssetningen, 3) indekslisten, 4) faner. Uten siste skudd: trace-feltet viser en gravert tom linjal + «No shot recorded — open the Range», og RANGE blir primærhandling.

### 3.2 Range — `SHEET 01` aktiv modell (viktigst nr. 2 — wireframe)

Dominant jobb: én aktiv parameter → flukt, live < 16,7 ms [F: lov 12].

```
┌─────────────────────────────────────────────┐
│ SHEET 01 · RANGE          7-IRON · [⌕ Ask]  │  <- arkhode: nr, klubbe, Ask-slipp-trigger
│                                             │
│         __..--~~~-..                        │
│    ●-~~"            "~-..                   │  <- LIVE trace: signalblekk, fullt mettet
│   /  .--~~~-.            \                  │  <- ghost 1: forrige, blekk 55 % metning
│  / .-~       ~-.          \                 │  <- ghost 2: eldre, blekk 25 % metning
│ _|____|____|____|____|____|_○___|____       │  <- linjal-baseline; landing ○ eneste markør
│  0        100       200   [216 m]           │
│                                             │
│  CARRY 216 m    CURVE 9 m L    APEX 29 m    │  <- mono tabular; bredde endres aldri
│ ─────────────────────────────────────────── │
│  FACE ANGLE                        +2.0°    │  <- aktiv parameter: navn (caps) + mono-verdi
│  ──────────────●────────────────            │  <- linjal-slider: graverte ticks, detents
│  −6°           ╵            +6°             │     (haptikk: tick per hele grad [F: sa-haptics])
│                                             │
│  ( FACE )( PATH )( ATTACK )( LOFT )( ▸ )    │  <- parameterchips: én aktiv (blekk fylt),
│─────────────────────────────────────────────│     resten trykk-omriss; roving tabindex
│ INDEX  [RANGE]  REPORT   PLATES   BOOK      │  <- fanerad minimert til 20px under drag [S]
└─────────────────────────────────────────────┘
```

Alt over folden i instrumenttilstand [F: lov 9]: modell + aktiv kontroll + live-verdier i ett viewport. Sekundære verdier (full datadiktat-rekke [F: SYS-05]) i et pull-opp-sheet («DATA STRIP»).

### 3.3 Outcome — `REPORT` (tekstlig hierarki)

1) Rapporthode: `SHOT REPORT · 14:32` + klubbe. 2) Frossen trace (signalblekk, ingen ghosts — rapporten er ett skudd). 3) **Årsakskjeden som nummerert liste** — feltbok-grammatikkens hjemmebane: `1. Face +2.0° open to path → start right. 2. Face–path gap → slice spin axis. 3. …` — hvert ledd med sitt parameter-hue som 3 px marg-strek (eneste sted datahues opptrer samlet). 4) `CANNOT SAY`-feltet: egen rubrikk med hairline-ramme — «Flightglass doesn't measure your swing» [F: ærlighetsregister]. 5) Én primærhandling: `TRY IT ON THE RANGE →` (signal-knapp) som tar med leveringen (krever G1-konsumenten [F: ask/03 §4]). Read-only per masterplan §7.3 — ingen inputs på rapporten.

### 3.4 Academy-oversikt — `COURSE BOOK`

1) Bokforside-hode: `COURSE BOOK` i display-serif + mestringssum i mono (`6/14 CHAPTERS`). 2) Kapittelliste som innholdsfortegnelse: nummer (mono) · tittel (ui) · prikket leader-linje · status. Mestret kapittel får **reward-gull stempel** (◉) — gull opptrer aldri andre steder på arket [F: SYS-15-gjerdet]. 3) Aktivt kapittel er eneste rad med signal-aksent («continue»-affordance). 4) Pro-gatede kapitler: `PRO`-stempel i blekk-omriss (ikke gull — gull er mestring, ikke salg). Ingen XP-konfetti på oversikten; celebration hører til leksjonens fullførings-øyeblikk.

### 3.5 Paywall — `ORDER FORM`

1) Skjemahode: `FLIGHTGLASS PRO · ORDER FORM` (display-serif). 2) Innholdstabell — hva Pro faktisk inneholder, satt som spesifikasjonsliste med hairlines (gjenbruker 99/590-innholdet [F: krav §9]). 3) Prisvalg som to «billetter» med perforerings-hairline: `99 kr / month` · `590 kr / year — 2 months free` (tall i mono; besparelse som faktum, ikke rop). 4) Én signal-knapp: `START PRO`. 5) Restore/vilkår i dim. Ingen nedtellinger, ingen falsk knapphet [F: ingen mørke mønstre, 04 §6].

---

## 4. Komplett designsystem-kandidat

### 4.1 Fargetokens (hex + OKLCH, beregnet)

Prefiks `--fb-*` i kandidatfasen; ved adopsjon migreres de inn i sa-p3.css-navnerommet (se §10).

**Grunn og blekk**

| Token | Semantikk | Hex | OKLCH (beregnet) |
|---|---|---|---|
| `--fb-bg` | App-grunn: varmt benhvitt papir | `#F2EEE3` | `oklch(94.92% 0.0152 90.24)` |
| `--fb-surface` | Hevet ark (kort/sheet) — «friskt ark» | `#FAF7EF` | `oklch(97.63% 0.0110 89.72)` |
| `--fb-sunk` | Senket felt (input-trau, slider-spor) | `#E7E1D2` | `oklch(91.04% 0.0211 88.73)` |
| `--fb-desk` | Bakenforliggende «bord» bak modal-ark | `#E0D9C6` | `oklch(88.57% 0.0266 90.11)` |
| `--fb-ink` | Primærtekst + alle tall | `#1D1A14` | `oklch(21.91% 0.0122 84.54)` |
| `--fb-muted` | Sekundærtekst | `#575039` | `oklch(43.16% 0.0367 93.17)` |
| `--fb-dim` | Telemetri-etiketter, tertiært | `#6E6650` | `oklch(51.15% 0.0346 90.43)` |
| `--fb-line` | Hairline (dekorativ) | `rgba(29,26,20,.14)` | — |
| `--fb-line-strong` | Hairline (interaktiv/struktur) | `rgba(29,26,20,.38)` | — |

**Signal — dagslys-arvtakeren til Ember** (samme lov: live sannhet eller den ene primærhandlingen, aldri dekor)

| Token | Semantikk | Hex | OKLCH |
|---|---|---|---|
| `--fb-signal` | Live trace, hero-verdi, primærknapp | `#C2340F` | `oklch(53.97% 0.1841 34.28)` |
| `--fb-signal-deep` | Signal som løpende småtekst (< 18 px) | `#9E2A0C` | `oklch(46.51% 0.1567 34.39)` |
| `--fb-signal-soft` | Signal-fyll (soft) | `rgba(194,52,15,.10)` | — |
| `--fb-signal-line` | Signal-strek (ikke-tekst) | `rgba(194,52,15,.60)` | — |

[S] Huen er surveyor-/International-Orange-familien flyttet mot rød jordfarge — «feltmerkespray på gress», i slekt med Ember (hue 34 vs Embers ~46) men med snudd verdilogikk: mørk pigment på lys grunn i stedet for lys glød på mørk grunn.

**Struktur** — violet erstattes av **grafitt-blekk**: struktur tegnes med `--fb-line`/`--fb-line-strong` + `--fb-dim`; estimatlag (EST) bruker stiplet `--fb-dim`-strek. [S] Papirverdenen trenger ingen egen strukturfarge — det er selve bruddet med plate-estetikken. Konsekvens for lov 5/13 flagges i §6.

**Status & reward (inngjerdet som før [F: SYS-15])**

| Token | Semantikk | Hex | OKLCH |
|---|---|---|---|
| `--fb-good` | Verdikt god | `#1E6E46` | `oklch(47.97% 0.1002 156.96)` |
| `--fb-warn` | Verdikt advarsel | `#7A5A00` | `oklch(48.77% 0.1000 84.43)` |
| `--fb-bad` | Verdikt dårlig | `#A81E2E` | `oklch(47.68% 0.1718 21.45)` |
| `--fb-reward-gold` | XP/badges/mestring KUN (stempel-gull, mørk ochre) | `#7A5A00` (deler warn-verdi, eget token) [S] | `oklch(48.77% 0.1000 84.43)` |
| `--fb-celebrate` | Celebration-øyeblikk KUN | `#A6127E` | `oklch(49.18% 0.2009 342.99)` |

[S] At reward-gull og warn deler hex men har separate tokens er et bevisst eiervalg-spørsmål: på papir er «gull» pigment-ochre, og kontekst (stempel vs verdikt) skiller dem. Alternativ: reward `#8A6410` (ANSLAG ~5.1:1 på bg — må beregnes før adopsjon).

**Datahues (SYS-11: én hue = én fysisk størrelse — identiteter bevart, verdier re-tunet for lys grunn)**

| Størrelse | Hue-identitet | Hex | OKLCH | Kontrast på bg (beregnet) |
|---|---|---|---|---|
| Face angle | dyp korall | `#B3273A` | `oklch(50.58% 0.1749 19.31)` | 5.54:1 |
| Club path | dyp sjøblå | `#135F8C` | `oklch(46.47% 0.1006 241.24)` | 5.95:1 |
| Attack/low-point | dyp rosa | `#A82877` | `oklch(50.55% 0.1800 347.73)` | 5.60:1 |
| Dynamic loft | dyp fiolett | `#6A4FC0` | `oklch(51.57% 0.1694 290.18)` | 5.19:1 |
| Launch | oliven-gull | `#6E5A10` | `oklch(47.44% 0.0906 92.48)` | 5.78:1 |
| Swing plane | dyp periwinkle | `#4A55B8` | `oklch(49.52% 0.1549 274.49)` | 5.52:1 |
| Strike depth | dyp orkidé | `#8A3FA8` | `oklch(51.13% 0.1711 315.03)` | 5.40:1 |
| Strike quality | mørk messing | `#7A5A1E` | `oklch(48.94% 0.0863 79.62)` | 5.47:1 |
| Ghost/referanse | varm grå | `#8D8878` | `oklch(62.65% 0.0241 92.62)` | 3.06:1 (kun strek — ≥3:1 grafikk-krav, aldri tekst) |

### 4.2 Kontrastkrav (nøkkelpar, beregnet 2026-08-05)

| Par | Forhold | Krav | Status |
|---|---|---|---|
| `--fb-ink` på `--fb-bg` | **14.97:1** | ≥7:1 (AAA-ambisjon for brødtekst) | ✅ |
| `--fb-ink` på `--fb-surface` | **16.21:1** | ≥7:1 | ✅ |
| `--fb-ink` på `--fb-sunk` | **13.30:1** | ≥7:1 | ✅ |
| `--fb-muted` på `--fb-bg` | **6.94:1** | ≥4.5:1 | ✅ (≥7:1 på surface: 7.51:1) |
| `--fb-dim` på `--fb-bg` | **4.92:1** | ≥4.5:1 | ✅ |
| `--fb-signal` på `--fb-bg` | **4.78:1** | ≥4.5:1 tekst / ≥3:1 strek | ✅ (hero-numeraler ≥28 px OK; småtekst bruker `--fb-signal-deep`: 6.49:1) |
| `--fb-surface` (papirtekst) på `--fb-signal` (invertert knapp) | **5.17:1** | ≥4.5:1 | ✅ |
| Alle 8 datahues på bg | **5.19–5.95:1** | ≥4.5:1 | ✅ (tabellen over) |
| Status good/warn/bad på bg | **5.37 / 5.51 / 6.27:1** | ≥4.5:1 | ✅ |
| `--fb-surface` vs `--fb-bg` (hevings-steg) | 1.08:1 | ikke tekstpar | hevingen bæres av hairline, ikke verdi alene (§4.3) |

Regel arvet fra dagens system [F: DESIGN-SYSTEM §8]: AA re-valideres etter enhver hue-endring; OKLCH-gamutregelen består. Sollys-tillegg [H]: utendørs på range er lys grunn med 14.97:1 ink antakelig *bedre* enn dagens mørke tema (skjermrefleks spiser mørke flater); må verifiseres på enhet i sol før adopsjon — dette er retningens sterkeste praktiske salgsargument og skal ikke tas på tro.

### 4.3 Lys/dybde-logikk — heving uten skygge-teater

Papir kjenner ikke z-akse-glød; heving uttrykkes med **trykkerens midler**, i prioritert rekkefølge:

1. **Verdisteg:** hevet ark er lysere (`--fb-surface` over `--fb-bg`), senket felt mørkere (`--fb-sunk`). Steget er bevisst subtilt (1.08:1) og bærer aldri alene.
2. **Hairline-innramming:** hvert ark har full `--fb-line`-ramme; interaktive kort `--fb-line-strong`. Rammen ER kanten — ingen box-shadow.
3. **Registreringsmerker:** modal-ark (sheets) får 2 px blekk-kant langs toppen («innbindingen») + de fire hjørne-ticksene fra trykkeriets skjæremerker [S — dette er Fieldbooks svar på .sa-depth-edge-light].
4. **Bordet:** når et sheet ligger over, dimmes underlaget til `--fb-desk` (ikke svart scrim) — som et ark lagt over et annet i dagslys.

Forbudt: drop-shadows med blur > 0, gradient-«lys ovenfra», glassmorphism-blur (blur-platene fra UV Ember har ingen jobb her — papir er opakt). Én unntaksdiskusjon: 1 px hard offset-strek under dragbare elementer under aktiv drag («arket løftes») [S — prototyperes, droppes hvis det leser som skygge-teater].

### 4.4 Typografi (kun eksisterende vendored fonter [F: vendor/fonts/])

| Rolle | Font (vekter som finnes) | Bruk |
|---|---|---|
| **display** | **Fraunces Variable** (opsz/WONK) | Wordmark, arktitler, hero-numeraler ≥28 px sammen med mono, kapitteltitler. ÉN display-stemme [F: 04 §5.2-kravet] — Space Grotesk pensjoneres fra display-rollen. |
| **ui** | **Inter** 400/500/600 | Etiketter, brød, knapper, chips. (Lov 11: «one grotesque for UI» ✅) |
| **data** | **IBM Plex Mono** 400/500/600 | ALLE engine-tall, alltid `tabular-nums`, minus U+2212, grader/rpm/m i mono også i løpende tekst. Uendret [F: lov 11]. |

[S] Fraunces er allerede repoets «engraved plaque»-stemme (showcase-avviket [F: DESIGN-SYSTEM §2]) — Fieldbook opphøyer avviket til systemet og løser dermed tre-stemmer-problemet ved å velge motsatt av det opplagte: serifen vinner, grotesken blir tjener. Optical sizing: opsz lav for titler (trykk-sverte), WONK kun wordmark (uendret regel). Gulv 10 px består. Unit-grammatikk og datadiktat (SYS-05/06) uendret.

Nye trykk-konvensjoner [S]: eyebrows settes i **mono caps** med letter-spacing .08em (instrumentetikett, ikke SaaS-eyebrow); prikkede leader-linjer (`CARRY ....... 214 m`) er lovlig struktur i lister/tabeller.

### 4.5 Spacing/radii

- **Spacing:** 4/8-grid uendret; innhold-inset 16 px ved 812 pt [F: SYS-07]. Nytt: «marg-kolonne» 24 px venstre på REPORT/BOOK-ark for margstreker og nummer.
- **Radii — skjerpet mot trykk:** kontroller **4 px** · kort/ark **8 px** · sheets/lenses **12 px** · chips/pills **999 px** (beholdes — stempler er runde). [S] UV Embers 12/16/20 leses som «soft glass»; papir skjæres skarpere. Radius-tokens beholder navnene (`--radius-control` osv.), bare verdiene endres.

### 4.6 Komponentgrammatikk

| Komponent | Fieldbook-form |
|---|---|
| **Ark (kort)** | `--fb-surface`, full hairline, 8 px radius, valgfritt arkhode (eyebrow mono caps + hairline under) |
| **Sheet (bottom)** | «Slipp»: surface + 2 px blekk-toppkant + gripe-tick (3 graverte streker, ikke pill-handle), bordet dimmes til `--fb-desk`. Ett-nivås, push/pop in-place, aldri stacking [F: ask/03 §6] |
| **Kontroller** | Slider = **linjal**: gravert tick-spor i `--fb-sunk`, blekk-thumb (14 px sirkel, ink), detents pr. hel grad m/ haptisk tick [F: sa-haptics]. Stepper = `− / +` i mono med hairline-bokser |
| **Chips** | Parameter-chips: caps-etikett, omriss `--fb-line-strong`; aktiv = blekk-fylt med papirtekst. Aldri farge-fylt med datahue (huen bor i modellstrøket, ikke i chrome) [S] |
| **Verdikt-stempler** | Status (good/warn/bad) som stempel: caps i statusfarge + 1.5 px omriss samme farge, lett −1° rotasjon KUN på celebration-stempler [S — vaktes, se §5] |
| **Tabeller** | Ekte trykk-tabeller: hairline-rader, mono-tall høyrestilt, prikkede leaders — Ask sine `table.{id}`-mål [F: ask/03 §4] hører naturlig hjemme her |
| **Knapper** | Primær: signal-fylt, papirtekst, 4 px radius. Sekundær: blekk-omriss. Tertiær: understreket tekstlenke (trykk-konvensjon) |

### 4.7 Interaksjonstilstander

- **Fokus:** dobbel blekk-ring invertert for lys grunn: `inset 0 0 0 1px var(--fb-surface), inset 0 0 0 3px var(--fb-ink)` — samme grammatikk som i dag [F: SYS-03], verdiene snudd. Aldri signal-farget.
- **Pressed:** «impresjon» — bakgrunn til `--fb-sunk` + `scale(.98)`, 80 ms ease-out. Blekket trykkes *ned i* papiret, ikke lyses opp.
- **Disabled:** 40 % opacity, ingen pointer (uendret).
- **Hit targets:** ≥44×44 pt inkl. bevegelige mål (uendret kontrakt).

### 4.8 Motion-språk — hva erstatter phosphor-decay i dagslys

Doktrine [S]: **«papiret er stille, blekket er umiddelbart.»** Ingen ambient bevegelse i det hele tatt (mot UV Embers «universet er sakte»); den eneste bevegelsen er data som avsettes.

- **Blekk-avsetning** erstatter phosphor-glød: live trace tegnes som en pennestrek (stroke-dashoffset), ferdig < flukt-tiden; tallets tick-oppdatering er umiddelbar (< 16,7 ms — lov 12 uendret).
- **Blekk-spor** erstatter phosphor-ghosts: maks to forrige traces med **fallende metning mot papir** (55 % → 25 % blend mot `--fb-bg`), kun på strøket, aldri på tall [F: lov 12-strukturen bevart, medium re-uttrykt].
- **Signaturtransisjon:** Aperture-blenderen (natt-optikk) re-uttrykkes som **«arkvending»**: delt element er baseline-linjalen, som glir mellom flater mens nytt ark skyves inn under den. Ett signaturgrep i appen, som før. **Eiervalg** — Aperturen er navngitt i lov 12 (§6, lov 12).
- **Reduced motion:** ingen strek-animasjon (trace vises ferdig), ghosts av, arkvending → fade; full informasjonsparitet (uendret kontrakt).
- Easing-token `--ease` beholdes for de få choreografiene som finnes; entry-choreografi finnes ikke (04 §5.3).

### 4.9 Haptikk

`sa-haptics.js`-hendelsene gjenbrukes 1:1 [F: kravet + tabellen i DESIGN-SYSTEM §6]: selection start/end på slider, tick pr. hele grad (≥70 ms rate-limit), light på båndskifte, medium på HIT, heavy KUN på launch, success-notify første pure straight. Haptikken er allerede «fysisk hendelse, aldri dekor» — det er feltbok-filosofi og trenger null endring. [S] Semantisk omdøping i dokumentasjon: detent-tick = «linjal-hakk».

### 4.10 Systemet vist på de fem flatene (tokens i bruk)

- **Home/INDEX:** bg `--fb-bg`; topplinjal `--fb-line-strong`-ticks; wordmark Fraunces `--fb-ink`; trace `--fb-signal` 2.5 px strøk; landing ○ `--fb-signal`; carry-tall Plex Mono 600 `--fb-signal` (28 px+ → 4.78:1 OK for large text); forklaringssetning Inter 400 `--fb-ink`; indeksliste: nummer mono `--fb-dim`, titler Inter 500 `--fb-ink`, leaders `--fb-line`; mestrings-◐ `--fb-reward-gold`; faner mono caps `--fb-muted`, aktiv `--fb-ink` + 2 px `--fb-signal`-understrek.
- **Range:** modellfelt direkte på `--fb-bg` (modellen er arket — ingen kort-i-kort); live trace `--fb-signal`, ghosts blekk-spor 55/25 %; baseline-linjal `--fb-line-strong` + ticks; verdier mono `--fb-ink`; aktiv parameter-etikett caps `--fb-dim` + verdi mono `--fb-ink`; slider-spor `--fb-sunk`, thumb `--fb-ink`, aktiv parameterhue som 3 px indikator på sporet (f.eks. face `#B3273A`); chips omriss/blekk-fylt; DATA STRIP-sheet `--fb-surface` + blekk-toppkant.
- **Outcome/REPORT:** rapport-ark `--fb-surface` på `--fb-desk`-anelse; frossen trace `--fb-signal`; årsaksledd med 3 px margstrek i respektive datahue; sitat-/EST-verdier i registrene (model = mono ink, EST = mono + `≈` i `--fb-dim`, benchmark stemplet `TOUR` `--fb-muted`); CANNOT SAY-rubrikk hairline-rammet, tekst `--fb-muted`; primærknapp signal-fylt.
- **Academy/BOOK:** kapittelliste på `--fb-bg`; mestringsstempler `--fb-reward-gold`; aktiv rad `--fb-signal-soft`-fyll + `--fb-signal-deep`-tekst (6.49:1); PRO-stempel `--fb-ink`-omriss; progresjon `6/14` mono tabular.
- **Paywall/ORDER FORM:** ark `--fb-surface`; spesifikasjonstabell hairlines + mono-tall; billett-perforering: stiplet `--fb-line-strong`; priser mono `--fb-ink`; `START PRO` signal-fylt m/ papirtekst (5.17:1); vilkår `--fb-dim`.

---

## 5. Anti-brief

Denne retningen skal IKKE ligne:

1. **Moleskine-/scrapbook-romantikk:** ingen papirtekstur-bilder, ingen kaffeflekker, ingen håndskriftfonter, ingen teip-hjørner, ingen «revet kant». Papiret er en *verdi og en hue*, aldri en tekstur-prop. (Unntak vurdert og avvist: selv subtil kornstruktur — UV Embers grain-lag inverteres ikke, det fjernes.)
2. **Beige AI-slop:** den generiske «warm neutral wellness-app» med beige kort på beige grunn, avrundede 24 px-hjørner og friendly-vage ikoner. Fieldbooks vern: hairlines overalt, mono-tall, nummererte ark, 4 px-radier — presisjon, ikke koselighet.
3. **Avislayout/redaksjonell pastisj:** ingen spalter, ingen drop caps, ingen «magasin»-hero. Dette er et instrumentark, ikke en publikasjon om golf.
4. **Notion/Linear-hvitt:** kjølig grå-hvit produktivitets-minimalism med grå-på-grå tekst. Fieldbook er *varmt* (hue ~90), har én kompromissløs signalfarge og gravert linjal-identitet — ikke nøytral kontorsoftware.
5. **Retro-instrument-pastisj:** ingen fake Letraset-slitasje, ingen «vintage blueprint»-inversjon, ingen dekorative graveringer uten data (lov 6-brudd [F: 04 §4 skeuomorf-verdiktet — «adapt med måtehold»]).

**De tre glidebanene som må vaktes:**

- **Glidebane A — koselighet:** stempel-rotasjon, «håndlaget» detaljering og varme mikrotekster akkumulerer til scrapbook. Vakt: rotasjon kun på celebration-stempler; all chrome-tekst er teknisk register (`SHEET 01`, ikke `Your cozy range ☕`).
- **Glidebane B — gravyr-pynt:** ticks og linjaler er render-signatur KUN der de bærer måling; en linjal uten skala-funksjon er dekor og dermed lov 6-brudd. Vakt: hver tick-rekke må kunne navngi hva den måler (Tufte-kniven [F: 04 §4]).
- **Glidebane C — utvasking:** på lys grunn frister det å dimme («elegant lysgrått»); `--fb-dim` 4.92:1 er gulvet, og ingenting under 4.5:1 får bære tekst. Vakt: kontrast-CI på hvert hue-endrings-commit (eksisterende regel [F: DESIGN-SYSTEM §8]).

---

## 6. Instrumentlovene under Fieldbook (lov for lov)

| Lov | Status i Fieldbook |
|---|---|
| **1. Én dominant jobb** | **Uendret.** Arkmetaforen håndhever den: ett ark = én jobb; arknummeret i hodet er en synlig kontrakt. |
| **2. Progressive disclosure** | **Uendret.** Sekundært bor i slipper (sheets) og DATA STRIP; aldri ved siden av modellen. |
| **3. Modellen forsvinner aldri under input** | **Uendret.** Linjal-slider og modell deler ark (wireframe §3.2). |
| **4. Tall er sannhet, visuals er tolkning** | **Uendret — forsterket:** trykk-registeret (mono på papir) er tallets *hele* autoritet; EST-/benchmark-merking består ordrett. |
| **5. Ember = primær live sannhet / den ene handlingen** | **Re-uttrykkes:** `--fb-signal` overtar Embers lov med identisk semantikk og budsjett (maks 3 signal-elementer i ro [F: SYS-08]). «Model Violet means structure» **omformuleres**: struktur tegnes i blekk/grafitt, ikke i en egen hue. **Eiervalg — lovteksten må revideres**, ikke stille brytes. Gull = mestring uendret. |
| **6. No AI-slop** | **Uendret — skjerpet** med anti-brief §5 (beige-slop er denne retningens nærmeste stup). |
| **7. Golf-plausibilitet** | **Uendret.** Fysikk vinner over bilde; handedness/oppstilling uberørt av palett. |
| **8. Native interaksjonsgrammatikk** | **Uendret.** 44 px, safe areas, fokus-/RM-paritet, sheets med fokusfelle. |
| **9. Ingen essens under folden i instrumenttilstand** | **Uendret.** Fanerad-minimering under drag (§2.2) finnes nettopp for å betale denne lovens høydekostnad. |
| **10. Engelsk produkt-UI** | **Uendret.** All eksempel-copy her er engelsk. |
| **11. Typografi (Instrument)** | **Holder:** én grotesk (Inter) + én mono (Plex) for all engine-sannhet, tabular, U+2212. **Tillegg som eiervalg:** Fraunces opphøyes fra scoped avvik til systemets display-stemme — lovens bokstav nevner ikke display-rollen, men instrument-gates-evidensen [F: config/evidence/instrument-laws.json] må re-verifiseres mot ny display-font. |
| **12. Motion (Instrument)** | **Re-uttrykkes:** truth answers immediately (< 16,7 ms) uendret; phosphor-ghosts → **blekk-spor** (maks to, fallende metning, kun strøk, aldri tall — strukturen ordrett bevart); **Aperture-signaturen → arkvending med linjalen som delt element**. Aperturen er navngitt i loven → **eiervalg, flagges**. RM-paritet uendret. |
| **13. Render-signatur (Instrument)** | **Re-uttrykkes:** «ember line with phosphor decay» → signal-blekkstrøk med metningsfall; tick-ruler på baseline **består og blir hele appens identitetsbærer**; landing som eneste markør uendret; «violet draws structure» → blekk/grafitt tegner struktur, stiplet dim-strek for estimatlag; maks én stiplet annotasjon per tilstand uendret; ingen dekorativ glow/gradient/skygge — strengere enn i dag (null bloom-unntak). **Lovteksten må omformuleres (eiervalg)**; intensjonen (trace er instrument, ikke illustrasjon) er urørt. |

Evidensregimet [F: masterplan §2, instrument-gates]: lov 11–13 verifiseres kun gjennom låst manifest + protokoll; enhver omformulering krever oppdatert manifest med eiersignatur — dette er en eksplisitt kostnadslinje i §10.

---

## 7. Illustrasjons-/bilderegler

- **Ingen nye bilder** i denne fasen [F: 00 §grenser]; alt under gjelder regler for eksisterende/fremtidige assets.
- **Grunnregel [S]:** i papirverdenen er den kanoniske illustrasjonsformen **teknisk strektegning** — SVG/canvas i blekk + maks én datahue, som figurer i en manual («FIG. 3 — club path vs face»). Eksisterende SVG/canvas-assets re-farges via tokens, ikke re-tegnes.
- **Fysiske påstander** (oppstilling, treffbilde, sekvens) følger image-provenance-regimet uavkortet [F: lov 7 + masterplanens evidenskrav]: enhver figur som påstår golf-fysikk må kunne spores til motor/fixture eller kuratert kilde; når figur og fysikk er uenige, vinner fysikken.
- **Atmosfærebilder:** fotografisk atmosfære er som hovedregel **ikke tillatt** på instrumentark — papirverdenen har ingen «stemningsvegg». Eneste lovlige fotografiske form er en **navngitt plansje**: rammet, med caption i mono (`PLATE C · Turf interaction, fig. source: …`) og dokumentert proveniens — og kun på Academy-/forklaringssider, aldri bak eller under en live modell. Usourcet golf-stock er lov 6-brudd uansett retning.
- **Ikoner:** strek-ikoner 1.5 px blekk, geometrisk konstruerte; ingen fylte «friendly blobs».

---

## 8. Ask Flightglass-plassering

Kontrakten [F: ask/03] gjenbrukes uendret — AskAnswer-skjemaet, tall-/register-/grense-reglene, routing og deeplink-allowlisten er palettuavhengige. Fieldbook plasserer den slik:

- **Form: «margslippen».** Ask åpner som ett-nivås bottom-slipp (§4.6) over gjeldende ark — et notat lagt i margen på siden du leser, aldri en fane, aldri persistent boble [F: ask/03 §6]. Trigger: `⌕ Ask`-affordance i arkhodet på Range/Outcome/Lab og «Ask about this» på begrepsnivå i Academy (v1-inngangene per kontrakt; Home-inngangen forblir utsatt per board P1-5 — men merk: Fieldbooks INDEX-ark er ikke Night Ladder, så O10-beslutningen får nytt grunnlag hvis denne retningen velges — **flagges til 08**).
- **Svarets anatomi i Fieldbook-grammatikk:** `answer` i Inter på slipp-arket; `causal_chain` som nummerert liste med sitat-ledd; **alle `NumToken` rendres i registrene**: model = Plex Mono ink, est = mono + `≈` dim, benchmark = mono + `TOUR`-stempel, user-echo = Inter (nøytralt register, aldri mono — ordrett per kontraktregel 2); `cannot_say` som egen hairline-rubrikk nederst — samme rubrikk-komponent som REPORT bruker (én grammatikk, to flater); `action` som eneste signal-knapp på slippen (lov 1 ✅).
- **Kontekst-chip:** «Include current shot: face +2.0° …» som avkryssbar stempel-chip i slippen (synlig, fjernbar før sending — kontraktens signalkrav ✅).
- **In-place push/pop** for tabeller/oppfølging med tilbake-affordance; stacking forbudt; retur fra deeplink gjenåpner slippen med tråd intakt (øktens levetid) — alt ordrett fra kontrakten, kun materialisert som papir i stedet for glass.
- **A11y-blokken** (fokusfelle, aria-live polite, aria-busy ≤5 s, RM uten slide) overtas uendret.

---

## 9. Freemium/Pro-logikk

**Innhold uendret** [F: krav — 99/590 beholdes]: fri tier med Nivå-innhold + Ask-kvote, Pro = 99 kr/mnd eller 590 kr/år; gating følger monetization-strategy og Academy-entitlements [F: ask/03 §2 entitlement-regelen].

**Presentasjonen er Fieldbooks:** paywall-øyeblikkene bor som **«Pro appendix»-terskler** i IA-en:

1. **Academy-kapitler:** Pro-gatede kapitler står i innholdsfortegnelsen med `PRO`-stempel (blekk-omriss) — synlige, ærlig beskrevet, aldri lokke-blurret innhold.
2. **Ask entitlement-gate:** gratis svar over fritt korpus + «The full answer lives in the {lesson} deep dive — part of Pro» med deeplink [F: kontrakt §2] — moment-of-intent, rendret som en henvisning til appendikset, ikke som avbrudd.
3. **Diagnose-dybde og kvote-tak** ruter til samme ORDER FORM-ark (§3.5).

**Kostnad/risiko:** [H] Papir-presentasjonen av pris er uprøvd i kategorien; risiko for at «stille ordreskjema» konverterer dårligere enn glød-paywall — måles A/B i pilot før dom. [S] Motrisiko i dagens løsning: natte-glød rundt pris leser som spillkjøp; feltboka leser som faglig abonnement (tidsskrift-mentalitet), som matcher «curious golfer»-persona. Ingen mørke mønstre uansett utfall (04 §6). Kvote trekkes aldri for feilede Ask-svar (kontrakt §3) — kostnadssiden av LLM-driften er palettuavhengig og uendret.

---

## 10. Teknisk gjennomførbarhet + migreringskostnad

**Gjenbrukes strukturelt (lav kostnad):**
- Token-*arkitekturen* i sa-p3.css [F: sa-p3.css:50–182]: semantiske navn (`--bg/--ink/--muted/--accent/--q-*`) beholdes; Fieldbook er i første tilnærming en verdisubstitusjon + noen nye tokens (`--fb-sunk/--fb-desk`, signal-deep). Komponenter som konsumerer tokens (chips, plates→ark, fokusring-grammatikk) overlever.
- `sa-haptics.js` uendret. Fonter: alle fire allerede vendored [F: vendor/fonts/] — null ny avhengighet.
- SYS-lovblokkene, unit-grammatikk, datadiktat, a11y-kontrakter: ordrett videreført.

**Må skrives om (reell kostnad):**
- **Alle hvit-alpha-avledninger:** `--line rgba(255,255,255,.10)`, plate-gradienter, `.sa-depth`-laget (topplys, bloom, grain) [F: sa-p3.css:98–99, 390 ff.] — inverteres ikke, de erstattes av blekk-alpha + hairline-logikken i §4.3. `.sa-depth` slettes som konsept.
- **Canvas-/JS-hardkodede farger:** tracer-rendering med glød/white-hot tip, scene-gradienter, dusk-sky-rampen [F: sa-p3.css:159–167] — trace-rendereren må få «blekk-modus» (strøk uten glow, metningsfall i stedet for opacity-decay). Dette er den største enkeltjobben.
- **Geometry 3D:** natteverden (stjerner, dusk) er scenografi som må bygges om til dagslys-plansje (hvit grunn, blekk-wireframe).
- **Blur-plater:** backdrop-blur har ingen jobb på opakt papir — plate-komponenten forenkles (ytelses-gevinst på lav-ende [H]).

**Relativ kostnad per flate [S-estimat]:**

| Flate | Kostnad | Hvorfor |
|---|---|---|
| Paywall | **S** | Én side, ren token-/layout-jobb |
| Outcome/REPORT | **S–M** | Uskippet i dag [F: 04 §1] — bygges uansett; Fieldbook-rapporten er dens naturligste form |
| Home | **L** | Night Ladder er diegetisk natt-verden; INDEX-arket er nybygg + **eiervalg mot låst Fase 1-leveranse** |
| Range/Impact | **M–L** | Layout gjenbrukes, trace-renderer + fanerad er nytt |
| Academy | **L** | 14 opplevelser + per-leksjon-CSS (13 filer [F: *.css-lista]) med natt-antakelser i illustrasjoner |
| Lab/Geometry | **L** | 3D-scene er natt; full scenografi-ombygging |
| Ask | **S** | Uskippet; bygges rett i Fieldbook-grammatikk |

**Største risikoer:**
1. **OLED-fordelen mistes** [F: fysisk realitet]: dagens `#07060C` gir ekte svart (batteri + kontrast-pop på OLED); lys grunn koster begge. Motvekt: sollys-lesbarhet ute på range [H — må enhetstestes, §4.2].
2. **Instrument-gates-evidensen** [F: masterplan §2]: lov 12/13-omformuleringene krever nytt låst manifest + re-kjørt protokoll — prosesskostnad med eiersignatur, ikke bare design.
3. **Signal-budsjett-disiplin på lys grunn:** rød-oransje på papir roper høyere enn ember i natt; SYS-08-budsjettet (maks 3) må håndheves hardere, ellers blir arket en varsellampe-vegg.
4. **Differensiering nedad:** avstanden til «beige slop» (anti-brief §5.2) er mindre enn avstanden fra UV Ember til generisk dark-dashboard var; retningen står og faller med linjal-/trykk-presisjonen i utførelsen [S].

---
*Skrevet av retningsutvikler Fieldbook, Flightglass Design Lab, 2026-08-05. Kontrasttall beregnet med WCAG-luminansformel; OKLCH konvertert fra sRGB. Ingen kodeendringer utført; ingen bilder produsert.*
