# Retning 2 — «SIGNAL» · broadcast-instrumentet

**Status:** Fase C-retningskandidat, komplett designsystem-forslag. Ingen kode endres av dette dokumentet.
**Metodemerking:** [F] = faktum fra repo/kilde · [H] = testbar hypotese · [S] = designvurdering/smak. Kontrasttall er WCAG 2.x-forhold beregnet med relativ luminans (skript kjørt 2026-08-05); verdier merket ANSLAG er ikke beregnet.
**Bruddpåstand mot Ultraviolet Ember (kravet i 00 §Mandat):** huefamilie (nøytral grafitt/karbon vs UV-violet), lyslogikk (eksponering/optikk i dagslys vs nattglød), materialitet (kringkastingsgrafikk/kamera/glass vs blur-plater og glassmorfisme), emosjonelt register (direktesendingens presisjon og ro vs natt-drøm). Alle fire aksene dokumenteres under.

---

## 1. Kreativ tese + de første tre sekundene

### Tesen

Golferen har allerede lært TV-golfens visuelle kontrakt, gratis, gjennom tusenvis av timer med sendinger: **en nøytral verden, én lysende tracer, presis telemetri i ro.** Toptracer og TrackMan har trent hele målgruppen i å lese «rød strek over nøytral himmel = sannheten om ballens flukt». SIGNAL bruker denne innlærte kontrakten som designsystemets fundament: **Flightglass er en direktesending fra brukerens egen fysikk.**

Konsekvensene er strenge og produktive:

1. **Verden er nøytral grafitt/karbon i dagslys.** Ikke violet natt, ikke near-black sci-fi. Kringkastingsgrafikkens nøytralitet: kalibrert grå, som et regirom eller et viewfinder-bilde med korrekt eksponering. Verden har ingen egen mening — den finnes for at signalet skal kunne bety alt.
2. **ÉN signalfarge for live-sannhet.** I broadcast-tradisjonen er traceren rød/oransje/hvitglødende; SIGNAL velger **broadcast-rød** (begrunnelse i §4.1). Rødt er TV-språkets «live»: REC-punktet, tally-lampen, ON AIR-skiltet, Toptracer-streken. Fargen er semantisk lånt kapital — brukeren kan den fra før.
3. **Lyset er optisk, ikke emissivt.** Ingenting gløder. Heving og fokus uttrykkes som eksponering (⅓-stopp lysere flate) og linse (skarphet, brakett, blender) — se §4.4.
4. **Telemetri-typografi.** Tall er sendingsgrafikk: mono, tabulære, rolige, alltid i samme posisjon. Broadcast-telemetri roper aldri; den *står der* og er sann. Dette er en direkte forsterkning av lov 4 og 11 [F: masterplan §2].

Det emosjonelle registeret er **direktesendingens presisjon og ro**: kompetent, uanstrengt, aldri gamer-HUD, aldri cyberpunk. Regirommet er ikke spennende — det er *pålitelig*. Spenningen kommer fra innholdet (skuddet), aldri fra grafikken. [S]

Tesen løser også revisjonens største strukturfunn [F: 04 §1 — «appens kjerneløfte har ingen shippet eierflate»]: i broadcast-grammatikk er «see why it flew» bokstavelig talt **replay-analysen** — flaten enhver seer forventer etter et slag. Outcome slutter å være en inert flis og blir sendingens analysepult (§2/§3).

### De første tre sekundene [S]

*Sekund 0–1:* Nøytral, lys grafitt-flate. Øverst til venstre: Flightglass-merket som **bug** (kanallogoen som alltid står i hjørnet — gjenbruk av `.sa-strip__home`-kontrakten [F: sa-p3.css:236-257]). Ett rødt tally-punkt våkner ved siden av ordet `LIVE` — ett eneste pulsslag, så ro.

*Sekund 1–2:* Brukerens siste trace tegnes over scenen i signal-rødt — én strek, ingen glød, som en tracer over overskyet himmel. Under den setter telemetrilinjen seg: `CARRY 182 m · APEX 24 m · CURVE 12 m L` i mono.

*Sekund 2–3:* Én primærhandling under sendebildet: `Go live` (fortsett i Range) eller `Continue lesson`. Ingenting annet konkurrerer.

Avlesningen brukeren skal sitte igjen med: *«Dette er min egen golfsending — og den viser meg sannheten med samme autoritet som TV-grafikken jeg allerede stoler på.»* Femsekunders-forståelseskravet fra Fase 1-exit-bevisene [F: masterplan §7.1] arves uendret.

---

## 2. Appkart og navigasjon — med tab bar-eksperimentet

### 2.1 Roller i broadcast-grammatikken

Rollene bygger på den ikke-overlappende rolletabellen i 04 §2 [F] og gir hver flate et broadcast-navn som *forklarer* jobben (navnene er interne; UI-copy forblir produktnavnene):

| Flate | Broadcast-rolle | Eierjobb | SIGNAL-presisering |
|---|---|---|---|
| **Home** | *Rundown* (kjøreplanen) | Gjenopptak + én anbefalt neste blokk | Ikke en diegetisk verden (bryter med Night Ladder — eiervalg, se lov-gjennomgang §6). En kjøreplan: «On air now» (fortsett), «Next segment» (anbefalt leksjon), «Latest replay» (siste skudd). |
| **Range/Impact** | *Live program* | Live eksperiment: én aktiv parameter → flukt | Tally-merket `LIVE`-flate. Visualise forblir en linse/kameravinkel av samme sending [F: masterplan §6], aldri en andre sending. |
| **Outcome** | *Replay desk* (analysepulten) | Lesbar forklaring av SISTE skudd, read-only | Den manglende eierflaten for «see why it flew» [F: 04 §1]. Replay av tracen + årsakskjede som lower-thirds + én anbefalt neste handling. Løser den inerte Outcome-flisen [F: ask-flightglass/02 §2]. |
| **Lab** | *ISO-kameraer* | Dypere geometri-inspeksjon | Geometry 3D = «ISO 2», Strike Window = «ISO 3». **Impact Studio-avklaring:** shippet flate uten IA-hjem [F: 04 §5 pkt 5]. SIGNAL-forslag: Impact Studio **slås sammen med Strike Window** som face-view-linse i samme ISO-bukt — én kontaktdiagnose-flate, to kameravinkler. Alternativ (behold som eget «ISO 4») er dyrere og svakere; sammenslåingen flagges som eiervalg. [S] |
| **Academy** | *Masterclass-segmentene* | Paced læring, mestring, XP | Produserte segmenter i kjøreplan-form; XP/medaljer beholder egen belønningsfarge, aldri signal-rødt (§4.1). |
| **Diagnose** | *Intervjuet* | Strukturert miss-mønster-intervju | Sit-down-intervjuets form: ett spørsmål per «take», aldri fritekst [F: diagnose-doktrinen, 04 §1 pkt 4]. Ushippet; arver systemet ved bygging. |
| **Ask** | *Kommentatorspørsmålet* | Ett spørsmål → kort ærlig svar → deeplink | Ett-nivås sheet over gjeldende flate, aldri fane [F: ask-flightglass/03 §6]. Detaljert i §8. |
| **Paywall** | *Full coverage* (sendepakken) | Vise verdi før pris | Gratis = én-kamera-produksjon; Pro = alle kameraer + full replay-analyse + hele masterclass-serien. Innhold uendret fra Fase 7 [F: masterplan §7.7]. Detaljert i §9. |

Kjedekravet [F: 04 §3] uttrykkes som **regi-kontinuitet**: utfall (Live) → forklaring (Replay desk) → «try it» (tilbake til Live med relevant parameter aktiv) → læring (Masterclass) — og retur bevarer alltid konteksten. G1-gapet (Range tar ikke imot tilstand) må lukkes uansett retning [F: 04 §3]; SIGNAL gjør det til et bærende punkt fordi replay→live-cuten er selve signaturen.

### 2.2 TAB BAR-EKSPERIMENTET (særkrav — ærlig gjennomført)

Dagens app avviser kategoristandarden (native tab bar, Apple HIG, 3–5 likestilte destinasjoner) til fordel for hub-and-spoke [F: 04 §4 «reject for hub-modellen / vurderes per retning»]. Bruddet skal bevises her, ikke antas.

**Designet, i god tro.** Beste ærlige 4-fane-IA under SIGNAL:

```
┌──────────────────────────────────────────────┐
│                 (innhold)                    │
├──────────┬──────────┬──────────┬─────────────┤
│  ▶ Play  │  ◆ Learn │  ⌗ Lab   │  ≡ Today    │
└──────────┴──────────┴──────────┴─────────────┘
```

- **Play** = Range/Impact + Visualise-linsen; Outcome som post-shot-tilstand *inne i* Play.
- **Learn** = Academy; Diagnose som inngang øverst i Learn når den shippes.
- **Lab** = Geometry + Strike Window (+ Impact Studio-sammenslåingen).
- **Today** = rundown-Home: gjenopptak, siste replay, streak/XP-status.
- Ask er sheet fra alle faner (aldri fane — kontraktsfestet [F: ask-flightglass/03 §6]). Paywall er modal.

Dette er en *god* tab bar-IA: fire ekte destinasjoner, ingen restkategori, Outcome riktig plassert som tilstand og ikke søsken. Styrkene er reelle og skal innrømmes: null lærekostnad, alltid-synlig «hvor er jeg», ett-trykks bytte uten å gå via hub, systemgratis tilgjengelighet (VoiceOver-tab-semantikk), og broadcast-metaforen tåler den («kanalvelger»). [S]

**Vurdert mot 375 px-høydeproblemet.** Instrumentflatene er landskaps-orienterte og trenger bunnkanten: pinned canvas + kontrollsheet ligger nederst [F: sa-p3.css:422-495 — `.sa-pinned-canvas`, `.sa-controlsheet`, `.sa-outrow` er alle bunn-ankret; masterplan §7.4 «one active control in the bottom sheet»]. Regnestykket på 812×375 (målviewport [F: masterplan §7.0]):

| Post | Uten tab bar | Med tab bar |
|---|---:|---:|
| Viewporthøyde | 375 pt | 375 pt |
| Toppstrip (.sa-strip, 40 px + safe-area) | −40 | −40 |
| Tab bar (kompakt landskap ~32 pt) + bunn-safe-area (~21 pt) | −0 (safe-area absorberes av kontrollsheetets padding) | −53 |
| Kontrollsheet (chip-rail 44 + slider 44 + gap/minmax ~28) | −116 | −116 |
| **Igjen til modellen (canvas + tracer + ruler + outcome-rail)** | **≈219 pt** | **≈166 pt** |

219 pt er allerede stramt for trace + tick-ruler + landingspunkt + outcome-rail (lov 9: modell + aktiv kontroll + live-resultat i ett viewport [F: masterplan §2.9]). 166 pt er under det en lesbar flukt-modell tåler: apex-høyden i tracen komprimeres til ~90–110 px tegneflate, og outcome-railen må ofres eller legges over modellen — begge er lov 1/9-brudd. I portrett (390×844) koster tab baren 83 pt (49+34) og er isolert sett levelig — men da får appen to navigasjonsgrammatikker per orientering, eller en tab bar som forsvinner i landskap (brudd på selve poenget med en persistent tab bar: forutsigbarhet). [F: regnestykke over; S: konklusjonen]

**Strukturargumentet, uavhengig av piksler.** Flatene er ikke søsken; de er stadier i én kausal reise [F: 04 §1 «kritisk innsikt»]. En tab bar optimaliserer for *lateral* bytting mellom likestilte kontekster og gjør det kjempebra — men Flightglass' kjerneloop er *longitudinal*: live → replay → live → læring, med bevart tilstand. Tab-bytte er per HIG-konvensjon tilstandsbevarende *per fane*, men kjeden krysser fanene (Outcome i Play skal åpne en Learn-leksjon med retur til Play med parameter aktiv). Da blir tab baren et kart over feil terreng: den viser fire steder når reisen er én. I tillegg dekker den bare halve IA-en — Outcome, Ask, Diagnose og Paywall må uansett løses utenfor tab-grammatikken.

**Konklusjon: tab bar taper — nå bevist i denne retningen, på tre uavhengige grunner:** (1) den stjeler bunnkanten instrumentene beviselig eier, kvantifisert over; (2) den modellerer flatene som søsken når de er stadier; (3) den løser bare halve navigasjonsbehovet. **SIGNAL-alternativet:** hub-and-spoke beholdes, men hub-en omdefineres fra diegetisk verden til **rundown** (kjøreplan), og *bug-en* (`.sa-strip__home`-merket i hjørnet [F: sa-p3.css:236]) er den persistente «kanal-identiteten» — alltid til stede, alltid veien hjem, koster null instrumentpiksler. Broadcast har aldri hatt en tab bar; den har en bug og en kjøreplan. [S]

---

## 3. Skjermhierarki for de fem flatene

**Hierarkiprinsipp for alle flater:** scenen (viewfinderen) dominerer; grafikk står i *lower thirds* (nedre tredel) eller *slates* (fullbredde-mellomtitler); buggen står øverst til venstre; tally (`LIVE`/`REPLAY`) øverst til høyre. Ingen grafikk over scenens øvre to tredeler unntatt én annotasjon (lov 13-arv).

### 3.1 Range — aktiv modell (*Live program*) — wireframe, 812×375

```
┌─────────────────────────────────────────────────────────────────┐
│ [bug]  RANGE                                    ● LIVE          │ ← .sa-strip, 40px. Tally: signal-punkt + mono
│                                                                 │
│                    ······●  ← apex-annotasjon (én, stiplet      │
│               ····        ··    grafitt — aldri signal)         │
│           ···               ··                                  │
│        ··                     ··                                │
│     ··                          ·▼ landing (eneste markør)      │
│  ●──┴────┴────┴────┴────┴────┴────┴──── tick-ruler (grafitt)    │
│                                                                 │
│  CARRY 182 m   BALL SPEED 58 m/s   CURVE 12 m L   [+ outcomes]  │ ← lower third: telemetri-rail (panel-plate)
├─────────────────────────────────────────────────────────────────┤
│ (●FACE +2.0°) ( PATH −1.5°) ( ATTACK −3.0°) ( LOFT … )  →       │ ← chip-rail: én aktiv (fylt dot + ink-underline)
│  −6° ────────────────●──────────────── +6°        FACE +2.0°    │ ← fader: én aktiv kontroll, verdi i mono høyre
└─────────────────────────────────────────────────────────────────┘
```

- Tracen er skjermens eneste signal-røde element (pluss tally-punktet — se budsjettet i §4.1). Live-hovedverdien (`FACE +2.0°`) settes i ink, ikke signal: sannheten er rolig; *streken* er sendingen. [S — strammere enn UV-emberbudsjettet, se lov 5 i §6]
- Perspektivbytte (Visualise) er en **ISO-switch** i telemetri-railens høyrekant: `DTL · SIDE` segmentkontroll med knapp/tastatur/sveip-paritet [F: masterplan §7.2].
- Post-shot: outcome-chips forblir kollapset til forespørsel [F: masterplan §6]; `See why it flew →` vises som eneste promoterte handling etter landing og cuter til Outcome med skuddet i behold.

### 3.2 Outcome — forklaringsflaten (*Replay desk*) — wireframe, 812×375

```
┌─────────────────────────────────────────────────────────────────┐
│ [bug]  OUTCOME · SHOT 14                        ▶ REPLAY        │ ← tally i replay-modus: grafitt, IKKE rødt
│                                                                 │
│      ┌ karbonfelt (mørk replay-flate) ────────────────────┐     │
│      │        ····●····                                   │     │
│      │    ···         ····      trace re-tegnes ×1,       │     │
│      │  ··                ··▼   scrubber under            │     │
│      │ ●───┴───┴───┴───┴───┴──                            │     │
│      │  ◄◄  ▶  ►►   ──────●────────────   ×0.25           │     │
│      └───────────────────────────────────────────────────┘      │
│  ┌ LOWER THIRD ──────────────────────────────────────────┐      │
│  │ A high fade that landed short.                        │      │ ← klarspråk-resultat først (lov: Outcome §7.3)
│  │ FACE +2.0° open to PATH −1.5° → spin axis 9° → 12 m L │      │ ← årsakskjede, parameterhuer kun her, alltid merket
│  └───────────────────────────────────────────────────────┘      │
│  [ Try a squarer face → ]                (Range, face aktiv)    │ ← nøyaktig ÉN primærhandling
└─────────────────────────────────────────────────────────────────┘
```

- **Karbonfeltet** er SIGNALs eneste mørke flate-klasse (§4.2): replay skjer «i regirommet», og signal-hot-varianten av traceren brukes der. Kontrasten lys verden / mørkt replayfelt er selve skillet live vs. analyse — samme skille TV gjør med studio vs. avspillingsskjerm. [S]
- Read-only håndheves [F: masterplan §7.3]; scrubberen manipulerer *tid*, aldri fysikk.
- Årsakskjeden er tekst + tokens, ikke fri prosa; registrene (model/EST) typograferes per tall (lov 4/11).

### 3.3 Home (*Rundown*) — beskrivelse

Lys grafitt-flate, tre kjøreplan-blokker som panel-kort i én kolonne (portrett) / én rad (landskap): **ON AIR NOW** (Continue-blokk med tally-punkt — skjermens eneste signal-bruk), **LATEST REPLAY** (miniatyr-trace i grafitt + `See why it flew`), **NEXT SEGMENT** (anbefalt leksjon med XP-status i medalje-gull). Buggen i strip-en er wordmark-hjemmet. Ingen verden, ingen scene, ingen intro-choreografi (permanent regel [F: 04 §5 pkt 3]). Avvik fra låst Fase 1 Night Ladder dokumenteres som eiervalg (§6, lov-gjennomgangen).

### 3.4 Academy-oversikt (*Masterclass*) — beskrivelse

Kjøreplan-liste, ikke konstellasjon: nummererte segmenter (`01 START LINE · 02 SHAPE · …` — mono-numre) gruppert i sesonger, med ett umiskjennelig `Continue`-kort øverst (eneste promoterte element). Fullført = medalje-gull hake + eksponert (+⅓ EV lysere) kort; låst = −⅓ EV mørkere + lås-glyf (aldri farge alene [F: masterplan §7.5]). Fremdrift som mono-brøk `9/14`, aldri gamification-ringer. Night-field-konstellasjonen [F: masterplan §7.5] erstattes — eiervalg flagget i §6 og kostnadsført i §10.

### 3.5 Paywall (*Full coverage*) — beskrivelse

Struktur før pris [F: masterplan §7.7]: øverst et karbonfelt som replayer brukerens egen siste trace med full telemetri (utfallet vises før prisen); deretter tre dekningslinjer (`Every camera in the Lab · Every masterclass segment · Full replay analysis`); så prisplaten: `kr 590/year` anbefalt med `2 months free`, `kr 99/month` sekundært, restore/legal i footer. Ingen countdown, ingen fabrikkerte sitater. Detaljer i §9.

---

## 4. Komplett designsystem-kandidat

### 4.1 Fargetokens — hex, OKLCH, semantikk, beregnede kontraster

Alle kontrasttall er beregnet (WCAG-relativ luminans). «panel» = `#FBFCFC`, «scene» = `#E7E9EB`, «bg» = `#F1F2F3`, «karbon» = `#1B1D20`.

**Nøytral verden (dagslys-grafitt):**

| Token | Hex | OKLCH | Semantikk | Kontrast |
|---|---|---|---|---|
| `--sg-bg` | `#F1F2F3` | oklch(96.07% 0.0017 247.84) | App-bakgrunn, studio-grå | — |
| `--sg-scene` | `#E7E9EB` | oklch(93.31% 0.0035 247.86) | Viewfinder-himmel (scenegradient → `#F3F4F5` topp) | — |
| `--sg-panel` | `#FBFCFC` | oklch(99.03% 0.0011 197.14) | Panel/lower-third-flate (+⅓ EV over bg) | 1.09:1 vs bg (skilles av hairline + EV, ikke kontrast) |
| `--sg-ink` | `#17191B` | oklch(21.21% 0.0050 248.06) | Primærtekst, karbon-blekk | **17.15:1** panel · 15.73:1 bg |
| `--sg-ink-2` | `#52575D` | oklch(45.44% 0.0117 252.91) | Sekundærtekst | **7.09:1** panel |
| `--sg-ink-3` | `#61686F` | oklch(51.37% 0.0140 248.10) | Telemetri-etiketter (dim) | **5.50:1** panel · 5.04:1 bg |
| `--sg-hairline` | `#D9DBDE` | oklch(89.07% 0.0046 258.33) | Dekorativ delelinje | 1.35:1 (dekor, unntatt krav) |
| `--sg-hairline-strong` | `#A9AEB4` | oklch(74.87% 0.0103 252.84) | Interaktiv kant | 2.17:1 panel — **under 3:1-kravet for UI-kanter; interaktive komponenter markeres derfor aldri av kant alene** (dot + underline bærer tilstand) [S] |
| `--sg-carbon` | `#1B1D20` | oklch(22.99% 0.0065 258.36) | Replay-/karbonfelt (eneste mørke flateklasse) | — |
| `--sg-carbon-panel` | `#24272B` | oklch(27.13% 0.0086 255.58) | Panel på karbon | — |
| `--sg-carbon-ink` | `#F4F5F6` | oklch(96.97% 0.0017 247.84) | Tekst på karbon | **15.47:1** karbon |
| `--sg-carbon-muted` | `#B8BDC3` | oklch(79.62% 0.0101 252.83) | Dempet på karbon | **8.93:1** karbon |

Merk hue-realiteten: alle nøytraler ligger på H≈248–258 med C≤0.014 — praktisk talt akromatiske, med et knapt kjølig dagslys-stikk. Mot UV Embers verden (C≈0.03–0.09 violet overalt) er dette et målbart huefamilie-brudd, ikke bare en lysere versjon. [F: beregnet over; UV-tall fra sa-p3.css-tokens]

**Signal — ÉN farge for live-sannhet:**

| Token | Hex | OKLCH | Semantikk | Kontrast |
|---|---|---|---|---|
| `--sg-signal` | `#C8102E` | oklch(53.04% 0.2074 22.32) | Live trace, tally-punkt, DEN primære handlingen | **5.72:1** panel · **4.83:1** scene · 5.25:1 bg — klarer 4.5:1 som tekst og 3:1 som strek overalt i den lyse verdenen |
| `--sg-signal-hot` | `#FF6B57` | oklch(70.83% 0.1845 30.07) | Signalets karbonfelt-variant (replay-trace, paywall-hero) | **6.03:1** karbon |
| `--sg-signal-soft` | `rgba(200,16,46,.12)` | — | Signal-sonefyll (landingssone o.l.), alltid med merket kant | fyll, unntatt krav |

**Valgbegrunnelse:** (1) Rød er broadcast-tracerens de facto standard (Toptracer) — kontrakten brukeren allerede kan [H: gjenkjenningseffekt, testbar i pairwise-blind]. (2) Rød er TV-språkets «live» — REC, tally, ON AIR — så fargen bærer *tidssemantikk*: rødt = skjer nå. Det gir gratis skille mellom Live (rød tracer) og Replay (samme strek på karbon i hot-varianten, tally i grafitt). (3) Maksimal kromatisk avstand fra en C≤0.014-verden: C 0.207 gjør signalet til skjermens eneste mettede objekt. Hvitglødende ble forkastet (uleselig på lys verden), oransje ble forkastet (arver Ember og svekker bruddpåstanden). [S]

**Signal-budsjett (arver SYS-08-disiplinen, strammere):** maks **2** signal-elementer i ro per skjerm — tracen/tally OG den ene primærhandlingen. Live-hovedverdien settes i ink (avvik fra UVs «ett hero-tall i ember» — eiervalg, se lov 5 i §6). Kodifisert unntak: bug-ens ball-punkt (arvet fra sa-p3.css-unntakslisten [F: sa-p3.css:20-23]).

**Data-parametere (telemetri-settet — ÉN hue = ÉN fysisk størrelse, SYS-11 videreføres):**

| Størrelse | Token | Hex | OKLCH | Kontrast vs panel |
|---|---|---|---|---|
| Face angle | `--sg-face` | `#8A1038` | oklch(41.27% 0.1541 9.73) | **9.24:1** |
| Club path | `--sg-path` | `#0E7490` | oklch(51.98% 0.0936 223.13) | **5.21:1** |
| Attack/low-point | `--sg-attack` | `#C0266E` | oklch(54.15% 0.1955 358.28) | **5.46:1** |
| Dynamic loft | `--sg-loft` | `#6D4FC2` | oklch(52.00% 0.1720 291.26) | **5.76:1** |
| Launch | `--sg-launch` | `#5F6B12` | oklch(50.08% 0.1084 117.47) | **5.68:1** |
| Swing plane | `--sg-plane` | `#4A54C4` | oklch(50.23% 0.1727 274.49) | **6.09:1** |
| Strike depth | `--sg-depth` | `#8E44AD` | oklch(52.61% 0.1705 314.65) | **5.71:1** |
| Strike quality | `--sg-strike` | `#8A6A15` | oklch(54.20% 0.1037 85.96) | **4.92:1** |
| Ghost-trace | `--sg-ghost` | `#767E87` | oklch(58.94% 0.0167 251.26) | 4.00:1 panel · **3.38:1** scene (strek-kravet 3:1 holdt) |

Hue-posisjonene følger dagens lære (face varm rød-rosa, path blå, attack rosa, loft lavendel, launch sitron, plane periwinkle, depth orkidé, strike gull [F: sa-p3.css SYS-11-tabellen]) — nedtonet i lysstyrke for lys verden, så Academy-pedagogikken overlever re-toningen. **Kollisjonsvernet face↔signal:** face er flyttet til L41 mot signalets L53 (ΔL 12, ΔH 13, ΔC .05 — beregnet), og regelen er absolutt: *på scenen* er signal-rødt eneste varmrøde strek; face-huen opptrer kun i merkede chips/annotasjonsflater, aldri som umerket strek ved siden av tracen. [S]

**Status og belønning:**

| Rolle | Token | Hex | OKLCH | Kontrast vs panel |
|---|---|---|---|---|
| Good | `--sg-good` | `#166E4B` | oklch(47.91% 0.0982 161.16) | **6.07:1** |
| Warn | `--sg-warn` | `#8F4700` | oklch(47.94% 0.1194 54.54) | **6.66:1** |
| Bad | `--sg-bad` | `#7F1D1D` | oklch(39.58% 0.1331 25.72) | **9.75:1** |
| Medalje-gull (XP/mestring) | `--sg-medal` | `#8A6A15` | delt verdi med `--sg-strike` — to navngitte intensjoner, disjunkte kontekster, etter UV-presedens (--warn/--gold-dualiteten [F: sa-p3.css SYS-15]) | 4.92:1 |
| Celebrate | `--sg-celebrate` | `#A61E7E` | ANSLAG ≈5.5:1 panel — beregnes før D-fasen | kun seiersøyeblikk |

**Bad↔signal-disambiguering:** bad er mørk oksblod (L39.6 mot signalets L53, ΔL 13.4 beregnet), opptrer aldri på scenen, og bærer alltid glyf + etikett (aldri farge alene). Signal opptrer aldri på statiske verdikter. [S]

### 4.2 Lys- og dybdelogikk — eksponering og optikk, uten glød

Grunnsetning: **lys i SIGNAL er noe flaten *reflekterer*, aldri noe elementet *sender ut*.** Fire lovlige virkemidler, alt annet er forbudt:

1. **Eksponering (heving):** en hevet flate er +⅓ EV lysere enn underlaget (`panel #FBFCFC` over `bg #F1F2F3`; på karbon: `#24272B` over `#1B1D20`), med 1 px hairline. Én skygge tillatt app-vidt: `0 1px 2px rgba(23,25,27,.06)` på løftede sheets — kamerahusets kontaktskygge, ikke dybdeteater. Ingen blur-plater i den lyse verdenen (backdrop-blur beholdes kun der panel møter karbonfelt).
2. **Blender (fokusdemping):** når et sheet åpner, mister underlaget ett stopp (`rgba(23,25,27,.30)`-scrim) — eksponering ned, aldri blur-tåke over instrumenter.
3. **Fokus-peaking (interaktivt fokus):** tastaturfokus tegnes som **AF-braketten** — fire hjørneklammer i ink, 2 px, 4 px utenfor elementet (kamera-autofokusens språk). Kontrast ink-mot-alle-lyse-flater ≥14:1 (beregnet). På karbonfelt: `--sg-carbon-ink`-klammer.
4. **Tally (live-fremheving):** det som er *live* akkurat nå bærer signal — og bare det.

Grain, bloom, glow og `.sa-depth`-laget [F: sa-p3.css:382-404] utgår i sin helhet — SIGNAL sitt svar på lov 6 er at dybde kommer fra eksponeringstrapp + optikk-grammatikk, ikke atmosfære.

### 4.3 Typografi

Kun faktisk vendorerte fonter [F: sa-p3.css:37-46]:

| Rolle | Font | Bruk |
|---|---|---|
| **ui** | Inter 400/500/600 | Løpetekst, etiketter, knapper |
| **display (én stemme)** | Space Grotesk 600/700 | *Slate-stemmen:* skjermtitler og seksjons-slates i uppercase m/ +0.08em tracking; hero-numeraler ≥28 px. Grotesken er broadcast-grafikkens naturlige stemme. |
| **telemetri-mono** | IBM Plex Mono 400/500/600 | ALLE motortall: tabular-nums, U+2212, `value␣unit`-grammatikk uendret [F: SYS-06] |

**Fraunces fjernes helt** (retningen velger ÉN display-stemme [F: 04 §5 pkt 2]); ingen serif i en sending. Eyebrow-grammatikken (`INPUT · CONTROL` / `OUTCOME · READ`) beholdes men re-tones: input-eyebrow i `--sg-ink-2`, outcome-eyebrow i `--sg-strike` — violet/gull-parets jobber, nye farger. 10 px-gulvet og datadiksjonæren [F: SYS-05/06] arves uendret.

### 4.4 Spacing, radii, komponentgrammatikk

- **Grid:** 4/8-systemet uendret; innhold-inset 16 px [F: SYS-07].
- **Radii (materialbrudd fra UVs 12/16/20/999):** `--sg-radius-control: 6px` · `--sg-radius-panel: 10px` · `--sg-radius-lens: 14px` · slates/lower-thirds: **2 px** (sendingsgrafikk er nesten skarp) · pill kun for tally-badgen. Kvadratiskheten er karbon/kamera-materialitet. [S]
- **Komponentgrammatikk (broadcast-settet):**
  - **Bug** — `.sa-strip__home`-kontrakten uendret; merket i `--sg-ink-2`.
  - **SlateHeader** — fullbredde seksjonstittel: Space Grotesk uppercase + hairline over/under.
  - **LowerThird** — panel-plate ankret i scenens nedre tredel: klarspråkslinje (ui) + telemetrilinje (mono). Outcome-railen og Range-telemetrien er begge LowerThirds.
  - **ScoreBug** — kompakt persistent dataklynge (2–4 verdier) i panelhjørne; aldri mer enn én per skjerm.
  - **TallyBadge** — `● LIVE` (signal) / `▶ REPLAY` (grafitt); pill; mono-etikett.
  - **IsoSwitch** — segmentkontroll for linse/kameravinkel (`DTL · SIDE`, `2D · 3D` — identisk plassering begge veier [F: masterplan §7.4]).
  - **ControlDesk** — kontrollsheetet: chip-rail + én aktiv fader; arver `.sa-controlsheet`-strukturen [F: sa-p3.css:474-495], re-tonet (spor i hairline-strong, fylt del i aktiv parameterhue, thumb i ink).
  - **ReplayScrubber** — kun på karbonfelt; tid, aldri fysikk.

### 4.5 Interaksjonstilstander

| Tilstand | Uttrykk |
|---|---|
| Rest | Panel + hairline; interaktive elementer bærer dot/glyf (kant alene er ulovlig, jf. 2.17:1-noten i §4.1) |
| Pressed | `scale(.98)` + −⅓ EV (bakgrunn mørkner ett trinn), 80 ms |
| Aktiv (chip) | Fylt parameterhue-dot + 2 px ink-underline + mono-verdi i ink |
| Fokus | AF-braketten (§4.4.3); `:focus-visible`-disiplinen fra sa-p3.css beholdes [F: sa-p3.css:196-210] |
| Disabled | 40 % opasitet, ingen pointer (uendret) |
| Hit-mål | ≥44×44 pt inkl. bevegelige mål (uendret) |

### 4.6 Motion — broadcast-grammatikk under lov 12

Regi-disiplinen har tre verb, og bare tre:

1. **CUT:** alle UI-overganger er klipp — ≤120 ms, opasitet + maks 4 px translasjon, aldri easing-teater. Sannhet svarer øyeblikkelig: input→modell p95 < 16.7 ms uten transition overhodet [F: lov 12].
2. **REPLAY:** re-avspilling av tracen skjer kun på brukerens kommando, på karbonfeltet, med synlig scrubber. Aldri autoplay.
3. **SLOW-MO:** kun inne i replay, alltid merket (`×0.25` i mono). Live-flaten kjenner ikke begrepet.
- **Phosphor-arven:** ghost-traces (maks 2, fallende opasitet, kun på trace) videreføres som «replay trails» [F: lov 12].
- **Signaturtransisjon:** UVs Aperture-morph erstattes av **trace-match-cut** — tracen er delt element mellom Range og Outcome (samme kurve, kontinuerlig, verden bytter rundt den). Omformulering av lov 12s navngitte signatur → **eiervalg** (§6).
- **Reduced motion:** klipp blir øyeblikkelige bytter, trails av, replay hopper til sluttbilde med scrubber fullt funksjonell — informasjonsparitet, aldri bare kortere varighet [F: sa-p3.css:367-380-doktrinen].

### 4.7 Haptikk

`sa-haptics.js`-hendelsene gjenbrukes 1:1 [F: sa-haptics-tabellen i DESIGN-SYSTEM §6] — de er hendelsessemantiske, ikke visuelle: detent-tick, bånd-skifte light, HIT medium, launch heavy (appens eneste heavy), landing medium, nav ingen. SIGNAL-tillegg: **ingen** haptikk på cut-transisjoner (klipp er regi, ikke fysikk) — konsistent med «haptics mark physical events, never decoration».

### 4.8 Systemet vist på de fem flatene

| Flate | Systemet i praksis |
|---|---|
| **Home** | Lys rundown; tre panel-kort; tally-punkt på ON AIR-kortet = skjermens ene signal; medalje-gull kun på XP-linjen; SlateHeaders skiller blokkene. |
| **Range** | Scene-himmel + signal-trace + grafitt-ruler; LowerThird-telemetri; ControlDesk nederst; IsoSwitch for perspektiv; AF-brakett på fokus. (Wireframe §3.1.) |
| **Outcome** | Karbonfelt + signal-hot replay-trace + scrubber; LowerThird med klarspråk + årsakskjede; én primærhandling i signal. (Wireframe §3.2.) |
| **Academy** | Kjøreplan-liste; mono-numre; eksponeringstrapp skiller fullført/tilgjengelig/låst; medalje-gull for mestring; leksjonens seks-flaters anatomi [F: masterplan §7.6] beholdes med LowerThird som readout-hjem. |
| **Paywall** | Karbonfelt-hero med egen trace (verdi før pris); dekningsliste i ui; prisplate med anbefalt årlig; alt i nøytraler + ett signal på kjøpsknappen. |

---

## 5. Anti-brief — hva SIGNAL ikke skal ligne

1. **Gamer-HUD:** ingen hjørneklammer som dekor (AF-braketten finnes KUN som fokusindikator), ingen scanlines, ingen hexagoner, ingen «targeting reticles», ingen tekst-glitch. Testen: kunne elementet stått i en Call of Duty-HUD? Da ryker det.
2. **ESPN-overlast:** ingen tickere, ingen roterende promoer, ingen tre samtidige scorebugs, ingen «BREAKING»-energi. Broadcast-*grafikk* er forbildet, broadcast-*kanalen* er det ikke. Maks én ScoreBug, én LowerThird, én tally per skjerm.
3. **Cockpit-LARP:** ingen graverte ticks uten data, ingen skruer/nagler/børstet metall-tekstur, ingen «switch guards». Instrumentfølelsen kommer fra svartider og typografi, ikke fra rekvisitter (lov 6-arv).
4. **Generisk mørk SaaS:** karbonfeltet er et *verktøy* (replay/paywall-hero), aldri en app-vid dark mode. Blir mer enn ~20 % av en skjerm karbon uten replay-jobb, er retningen på gli.

**Tre glidebaner (overvåkes i review):**
- *Tally-inflasjon:* «live» klistres på flere elementer til rødt blir pynt → signal-budsjettet (maks 2) er hard lov, censusteste som SYS-08 gjorde for ember. [S]
- *Sportspakke-sleaze:* broadcast-metaforen inviterer til «GET FULL ACCESS»-upsell-tonen fra TV-sport → paywall-copy holdes i instrumentstemmen; forbudslisten fra Fase 7 (ingen urgency/countdown) gjelder metaforen også.
- *Nøytralitets-anemi:* grafitt-verdenen kan gli mot livløs gråhet → de fem flatene skal alltid ha ett levende element (trace, modell eller fremdrift); en skjerm uten noe levende er per definisjon feilkomponert i denne retningen.

---

## 6. Instrumentlovene 1–13 under SIGNAL

| # | Lov [F: masterplan §2] | Etterlevelse under SIGNAL |
|---|---|---|
| 1 | Én dominant jobb per viewport | Forsterket: én scene + én LowerThird + én ControlDesk; slates skiller alt annet. Ingen endring. |
| 2 | Progressiv avsløring | Sheets med −1 EV-scrim; sekundært innhold aldri ved siden av modellen. Ingen endring. |
| 3 | Modellen forsvinner aldri under input | ControlDesk ligger under scenen, aldri over; pinned-canvas-mønsteret videreføres. Ingen endring. |
| 4 | Tall er sannhet, visuals er tolkning | Telemetri-mono overalt; `×4 · diagnostic view`-merking o.l. beholdes; replay-scrubberen manipulerer tid, aldri tall. Ingen endring. |
| 5 | «Ember = primær live-sannhet eller primærhandling» | **Omformulering — eiervalg:** «**Signal** betyr live-sannhet eller den ene primærhandlingen; grafitt betyr struktur/tilstand; medalje-gull betyr opptjent mestring.» Semantikken (én farge = live-sannhet) er identisk; hexen og navnet byttes, og budsjettet strammes fra 3 til 2 (hero-verdien flytter til ink). |
| 6 | No AI-slop / ingen dekorativ glow | Skjerpet: glow/bloom/grain-laget fjernes helt (§4.2); glassmorfisme utgår i lys verden. Ingen dekorativ kamera-rekvisitt (anti-brief 3). |
| 7 | Golf-plausibilitet | Uberørt — fysikk og geometri eies av motoren [F: 00 faste grenser]. |
| 8 | Nativ interaksjonsgrammatikk | 44 pt, safe-areas, fokus-paritet (AF-brakett er `:focus-visible`-bundet), sheets med fokusfelle — uendret. Tab bar avvist med bevis (§2.2), hub + bug beholdes. |
| 9 | Intet essensielt under folden i instrumenttilstand | Bevist i §2.2-regnestykket: uten tab bar holder 812×375-budsjettet (~219 pt til modellen). LowerThird ligger *i* scenen, ikke under den. |
| 10 | Engelsk produkt-UI | All eksempel-copy i dette dokumentet er engelsk. Uendret. |
| 11 | Én grotesk + én mono, tabulære livetall, U+2212 | Inter + IBM Plex Mono uendret; Space Grotesk kun display (som i dag); Fraunces-avviket avvikles (retningen *øker* lov 11-renheten). |
| 12 | Sannhet svarer øyeblikkelig; maks 2 ghost-traces; ÉN signaturtransisjon (Aperture); RM-paritet | Alt beholdt — men signaturen **omformuleres fra Aperture-morph til trace-match-cut** (§4.6). **Eiervalg:** loven navngir Aperture eksplisitt. RM-paritet: klipp→bytte, trails av, sannhet live. |
| 13 | Render-signatur: ember-linje m/ fosfor, tick-ruler, landingspunkt eneste markør, violet tegner struktur, maks én stiplet annotasjon | **Omformulering — eiervalg:** «**Signal**-linje med replay-trails, grafitt tick-ruler, landingspunkt eneste markør, **grafitt-ink** tegner struktur (akser, mål, estimatlag), maks én stiplet grafitt-annotasjon per tilstand.» Strukturell intensjon identisk; violet→grafitt er fargebytte, ikke lovbrudd. |

**Samlet:** 10 av 13 lover etterleves uendret eller skjerpet; lovene 5, 12 og 13 krever omformulering av *ordlyd* (ember→signal, violet→grafitt, Aperture→match-cut) med bevart intensjon — alle tre er flagget som eiervalg, i tråd med 00 §Kildehierarki («aldri stille redesign»). I tillegg er tre *låste fasebeslutninger* i konflikt og flagges: Fase 1 Night Ladder-Home (§3.3), Fase 5 konstellasjons-Academy (§3.4), P3-tokensettet som helhet.

---

## 7. Illustrasjons- og bilderegler — provenance-regimet

1. **Ingen nye bilder** [F: 00 faste grenser]. SIGNAL er tegnet for å ikke trenge noen: hele verdenen er flater, hairlines, typografi og motorens egne kurver — CSS/SVG/Canvas dekker alt. Dette er retningens feasibility-fordel (§10).
2. **Eksisterende raster-assets er inkompatible og pensjoneres fra UI:** natt-range-gradene (`preview-nightgrade-*.png`, range-mocks' fotolag) tilhører violet-natt-verdenen og kan ikke re-graderes til dagslys-grafitt uten å bli falske fotografier. De arkiveres som historikk, fjernes ikke fra repo. [S]
3. **«Kamera-atmosfære uten falsk fysikk» defineres slik:** lovlig kamera-språk er *grafikkens* språk — tally, bug, lower third, scrubber, AF-brakett, eksponeringstrinn. **Ulovlig** er alt som simulerer et fotografisk *opptak* av noe som ikke er målt: lens flare, vignettering, dybdeskarphet-blur over modellen, chromatic aberration, «footage»-grain, fake viewfinder-overlays (ISO/shutter-tall som ikke betyr noe). Regelen i én linje: **kamera-grammatikk ja, kamera-simulering nei** — et pyntetall fra en kamerametafor er nøyaktig like løgnaktig som et pyntetall fra golf (lov 4/6). [S]
4. **Provenance-krav videreføres:** enhver kurve på skjermen er motor-output eller merket estimat (`≈`/EST-registrene [F: 04 §6]); benchmarks bærer «TOUR / not the simulator»; ingen usourcet golf-billedbruk (lov 6). Skulle et reelt asset-gap oppstå (f.eks. App Store-materiell), dokumenteres gapet før generering vurderes [F: 00 faste grenser].

---

## 8. Ask Flightglass — kommentatorspørsmålet

Ask er i broadcast-grammatikken **spørsmålet til kommentatorboksen**: seeren spør, boksen svarer kort og ærlig, og regien klipper til riktig kamera. Plasseringen implementerer answer-kontraktens §6 [F: ask-flightglass/03 §6] uendret i struktur, med SIGNAL-kledning:

- **Innganger (v1):** Range, Outcome, Lab, Academy — aldri fane, aldri persistent boble [F: 03 §6]. Utløseren er en `Ask`-glyf i strip-ens høyreklynge (utenfor instrumentcanvasen). **Home-inngangen forblir utsatt** per board-P1-5 [F: 03 §6] — rundown-Home i §3.3 er tegnet uten Ask-inngang, og beslutningen tas etter prototypevalidering (O10 i ask-loggen).
- **Form:** ett-nivås bottom sheet over gjeldende flate; sekundært innhold in-place med push/pop; sheet-stacking forbudt; retur fra deeplink gjenåpner sheetet med svar og oppfølgingsfelt intakt [F: 03 §6]. Sheetet er et panel med 2 px-radius slate-topp: `TO THE BOOTH` som eyebrow — kommentatorboksens adresse. [S]
- **Kontekst-chip:** synlig, avkryssbar chip («Include current shot: face +2.0° …») før sending — kontraktens samtykkesignal [F: 03 §6], stylet som en ScoreBug-miniatyr.
- **Svaret** renderes fra AskAnswer-kontrakten [F: 03 §1]: `answer` som klarspråkslinje (ui), `causal_chain` som LowerThird-liste, alle `NumToken`s i telemetri-mono med registerbadge (`MODEL` / `≈ EST` / `TOUR — not the simulator`) — registermerkene er bokstavelig talt broadcast-praksis (TV merker alltid «Tour avg»), så SIGNAL gjør kontraktens ærlighetsregime *mer* hjemmehørende, ikke mindre. `cannot_say`-linjen settes i `--sg-ink-2` med hairline over — grensen er del av svaret, aldri småskrift. [S]
- **Én handling:** nøyaktig én deeplink fra registeret [F: 03 §4], som signal-knapp (`Open the spin-loft deep dive →`) — «regien klipper». Ved retur: sheetet tilbake, tråden intakt (trådens levetid = økten [F: 03 §6]).
- **Tilgjengelighet:** fokusfelle, `aria-live="polite"`, `aria-busy` ≤5 s, fokus til svarstart, RM uten slide, mono-teller — alle bindende krav fra 03 §6 arves ordrett.
- **Entitlement:** gratis svar over free-korpus; Pro-gatet grounding gir ærlig kort svar + deeplink til gaten («The full answer lives in the Backspin deep dive — part of Pro») [F: 03 §2] — i SIGNAL-språk: spørsmålet er gratis, *full coverage* er Pro. Moment-of-intent bevart.

---

## 9. Freemium/Pro-plassering

Innholdet fra Fase 7 beholdes uendret [F: masterplan §7.7]; SIGNAL endrer bare presentasjonsspråket:

- **Rammefortelling:** gratis = **single-camera coverage** (Range live med kjerneparametre, Academy-starten, Outcome-basisforklaringen); Pro = **full coverage** (alle ISO-kameraer i Lab, hele masterclass-serien, full replay-analyse med årsakskjede-dybde, Ask med Pro-grounding). Gating følger monetization-strategiens flater; ingen ny gate innføres av retningen.
- **Paywall-struktur (§3.5):** utfall før pris — brukerens egen siste trace replayes i karbonfelt-heroen med full telemetri («this is what full coverage sees»), deretter tre dekningslinjer, så prisplaten: **`kr 590/year` anbefalt, merket `2 months free`; `kr 99/month` tilgjengelig; lifetime usynlig men RevenueCat-ID-en bevart; restore + legal alltid tilgjengelig; aldri prosentklaim, countdown eller fabrikkerte sitater** [F: masterplan §7.7]. RevenueCat-ID-ene `strikearc_pro_*` røres ikke [F: masterplan §3].
- **Moments-of-intent:** Outcome-årsakskjedens dybdenivå («See the full chain — Pro»), Lab-ISO-er utover den første, Academy-segmenter etter gratis-sporet, Ask-entitlement-svaret (§8). Alle bruker samme ærlige mønster: vis grensen, tilby dekningen, aldri lås midt i en manipulasjon.
- **Kostnad/risiko:** [S] *Oppside-hypotese* [H]: broadcast-rammen gjør Pro-verdien konkret («flere kameraer» er lettere å forstå enn «flere funksjoner») — testbar i pairwise-blind mot dagens paywall. *Risiko 1:* sportspakke-sleaze (anti-brief-glidebane 2) — motvirkes av instrumentstemmen og forbudslisten. *Risiko 2:* «full coverage»-metaforen kan overloves hvis gratis-tieren oppleves som mer enn «ett kamera» — copy må kalibreres mot faktisk gating, ikke omvendt. *Kostnad:* ren re-skinning av eksisterende paywall-flyt (sa-paywall.js/css beholder logikk og IAP-stier) — S/M i §10.

---

## 10. Teknisk gjennomførbarhet + migreringskostnad

### Hva gjenbrukes fra sa-p3-strukturen [F: sa-p3.css]

- **Token-arkitekturen som sådan:** `:root`-custom-properties med semantiske aliaser (`--q-*`-mønsteret) er nøyaktig riktig struktur; SIGNAL er en verdi-utskifting + noen nye roller (`--sg-carbon-*`, EV-trinnene), ikke en arkitekturendring.
- **Chrome-kontraktene:** `.sa-strip` + `.sa-strip__home` (buggen) gjenbrukes uendret i markup; kun farger byttes. SYS-13-opaque-chrome-loven består (lys verden: panel-hex-fill).
- **Mønsterprimitivene:** `.sa-pinned-canvas`, `.sa-chip`, `.sa-controlsheet`, `.sa-outrow`, scrim/detailcard — strukturen og a11y-oppførselen overlever; fargene, radiene og blur-bruken byttes. Fokusdisiplinen (`:focus-visible`-logikken) beholdes med ny ring-tegning (AF-brakett).
- **Ikke-visuelle lag:** sa-haptics.js 1:1 (§4.7); reduced-motion-kill-blokken; SYS-05/06 (diksjonær + enhetsgrammatikk); SYS-12 (SVG-glyfer); SYS-14 (copy-lov); fysikk- og lagringslag urørt per faste grenser.

### Kostnad per flate

| Flate | Kostnad | Hvorfor |
|---|---|---|
| Tokens/sa-p3-nivået | **M** | Full verdi-utskifting + light-world-inversjon: hver `rgba(255,255,255,x)`-hairline og mørk-komposit-antagelse må snus; kontrast-re-verifisering app-vidt (grunnlaget er beregnet i §4.1). |
| Home | **L** | Rundown erstatter Night Ladder — ny komposisjon, ikke re-toning (og et eiervalg mot låst Fase 1). |
| Range/Impact + Visualise | **M** | Struktur (canvas + dock) består; canvas-renderne (impact-flight-tegning, dusk-scenen `--dusk-*`) antar mørk himmel og må males om til lys scene + mørk strek — Canvas-endring, ikke fysikk-endring. |
| Outcome | **M** | Flaten er uansett ubygget (mock-arv); SIGNAL-versjonen bygges én gang, riktig. G1-konsumenten (~12 linjer [F: ask-flightglass/03 §4]) er forutsetning for «try it»-cuten. |
| Lab: Strike Window | **M** | Mønsterprimitivene bærer; re-toning + IsoSwitch. |
| Lab: Geometry 3D | **L** | 3D-scenens lys/materialer er bygget for natt; lys nøytral scene krever ny lyssetting og re-verifisert fargekoding — dyreste enkelt-repaint. |
| Academy (oversikt + 14 leksjoner) | **L** | Leksjonsanatomien og innholdet består, men konstellasjons-metaforen og natt-CSS-en per leksjon (13 × academy-*.css) må re-tones; oversikten re-komponeres (eiervalg mot låst Fase 5). |
| Paywall | **S/M** | sa-paywall-logikk, IAP-stier og eligibility beholdes; hero + re-toning. |
| Diagnose / Ask | **S** | Ushippet/spec — arver systemet ved bygging, ingen migrering. |

### Største risikoer

1. **Natt-identitetens sunk cost:** Academy-konstellasjonen og Night Ladder er både låste fasebeslutninger og reell emosjonell kapital; SIGNAL kasserer dem. Dette er retningens dyreste eiervalg — det må vinnes i pairwise-blind, ikke vedtas. [S]
2. **Lys verden i mørke omgivelser** [H]: simulator-bås og kveldsbruk kan gjøre en lys app blendende. Motargument: karbonfeltet finnes allerede som flateklasse, så en «studio dim»-variant (karbon som verden, panel som unntak) er token-messig billig — men det er en ny beslutning, ikke gratis. Testes på enhet før D-fasen.
3. **Hue-re-toning av lærte parameterfarger** [H]: hue-posisjonene bevares (§4.1), men mørkere varianter kan svekke gjenkjenning hos eksisterende brukere; Academy-pedagogikken må re-verifiseres visuelt (SYS-11-census på nye verdier).
4. **Signal↔face/bad-diskriminering** for fargesvake: ΔL-separasjonen er beregnet (12–13 L-poeng) og glyf/etikett-reglene finnes, men CVD-simulering må inn i evidensmanifestet før GO.
5. **Regresjonsflate:** re-toning berører nesten alle CSS-filer; instrument-lovenes evidensmanifest (`config/evidence/instrument-laws.json` [F: masterplan §2]) må kjøres per flate — kostnaden er budsjettert i M/L-merkene, men kalenderrisikoen ligger her.

---
*Skrevet av retningsutvikler SIGNAL, Flightglass Design Lab, 2026-08-05. Kontrastberegninger: eget skript (WCAG 2.x relativ luminans + sRGB→OKLCH), kjørt mot alle tokenverdier i §4.1; kun `--sg-celebrate` står som ANSLAG.*

---

## Board-addendum (2026-08-05, etter uavhengig review — korrigeringer, originaltekst star)

1. **face<->bad-kollaps (SG-1, P1):** det tredje paret i varmtriaden ble aldri regnet: #8A1038 vs #7F1D1D = ΔL 1.7, 1.06:1. REVIDERT KRAV: bad eller face re-deriveres for >=8 ΔL-separasjon; CVD-gaten i SS10.4 utvides eksplisitt til alle tre par i triaden.
2. **Tab bar-regnestykket (SG-N1, P1) — KORRIGERT:** SS2.2-tabellen dobbeltbokforte bunn-safe-arean (~21 pt). Symmetrisk bokforing gir reell marginalkostnad ~32 pt og modellflate ~187-198 pt med tab bar (ikke 166). Konklusjonen «tab bar taper» star fortsatt pa strukturargumentet + sannsynlig lesbarhets-underskridelse, men er naa en MALBAR pastand: lesbarhets-gulvet for trace+ruler+outcome-rail males pa enhet i D-fasen for konklusjonen kan siteres som bevist. Antakelsen om at safe-area absorberes i kontrollsheet-padding testes samtidig.
3. **Orientering (SG-N2, P1):** regnestykket antar landskaps-Range; shippet Range er portrettlast. Orienterings-reverseringen FLAGGES HERVED SOM EIERVALG; regnestykket leveres for begge orienteringer med retningens faktiske orienteringspolicy i D.
4. **Migrering re-kostet (SG-P1-3, P1):** Outcome/Replay desk M -> **L** (replay-motor/scrubber er ny kapabilitet, ikke re-toning); Paywall S/M -> **M** (karbonfelt-hero med egen trace er tilstandsavhengig rendering).
5. **Home-motsigelse (SG-2, P2):** apningssekvensens signal-trace pa Home (SS1) trekkes tilbake; SS3.3 gjelder (Homes eneste signal er tally-punktet; LATEST REPLAY-miniatyren er grafitt).
6. **Kant-census (SG-4, P2):** IsoSwitch, ReplayScrubber og ControlDesk ma hver bevise at tilstand aldri baeres av kant alene — inn i evidensmanifestet.
7. **WTP/thumbnail (SG-P1-1/2, P1):** lant-kontrakt-risikoen (gratis-assosiasjon) og butikkhylle-tapet er D-krav: WTP-mock-test og Screenshot-1-A/B (karbonfelt-scenen som mulig hylle-baerer) FOR retningsvalg effektueres.
