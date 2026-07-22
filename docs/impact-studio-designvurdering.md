# Impact Studio – designvurdering (senior produktdesign-pass)

Dato: 2026-07-21
Grunnlag: fire vedlagte skjermbilder (Face On @ mock, DTL @ mock, «See the Shot»-
impactvisning, desktop-variant med CLUB-inset), designbriefen «Impact Studio –
kontekst og designbrief», samt designspråket i eksisterende StrikeArc-flater.
Mocken (`impact-studio-swing-arc.vercel.app`) ligger ikke i dette repoet; alle
pikselmål under refererer til briefens egne målinger og skjermbildene.

Konseptets kjerne bevares: én canvas, chip + én slider, to separate perspektiv,
statisk ball og bue, outcomes øverst / canvas i midten / inputs nederst.

---

## 1. Førsteinntrykk

Briefens egen diagnose – «presist, men mikroskopisk» – er riktig, men den er
snillere enn den burde være. Det dypere problemet er ikke at elementene er små;
det er at **canvaset er komponert rundt swing arc som helhet, mens
læringsinnholdet bor i en 25–35 px stripe rundt bakken**. Buen er scenografi.
Entry, Low Point, Exit, divot og ball er hovedrolleinnehaverne, og de har fått
statistroller.

Tre ting til preger førsteinntrykket:

1. **Blikk-hierarkiet er invertert.** Det mest visuelt aktive er outcome-kortene
   (stiplede, fargede rammer) og perspektivvelgeren (stor, sentrert, øverst i
   canvaset). Det brukeren skal lære av – kontaktsonen – er det stilleste
   elementet på skjermen.
2. **Vektorspråket lyver.** Rosa Attack og cyan Path starter i ballen og peker
   utover med partikler og pilspiss. Det er nøyaktig grammatikken en golfer
   leser som ball flight. I DTL peker cyan-pilen opp og ut mot venstre – det
   ser ut som en pull hook som letter, ikke som køllens bane inn mot treff.
3. **Samme verdi står tre steder.** Attack finnes i outcome-kort, canvas-pill og
   legend. Path likeså. DTL har i tillegg frakoblede tekstkopier av Plane og
   Direction til venstre. Duplikatene koster nøyaktig den plassen og roen som
   kontaktsonen mangler.

«See the Shot»-skjermbildet viser at produktfamilien allerede har et modent
typografisk språk: store, rolige tall (207 m), små caps-etiketter, én
annotasjon per geometri. Impact Studio bør se ut som et søsken av den skjermen,
ikke som et instrumentpanel.

---

## 2. Hva som fungerer og skal bevares

- Tre-nivå-strukturen (outcomes / canvas / inputs) er riktig og tydelig.
- Chip + én slider er riktig modell; valgt chip er tydelig, slider er bred nok.
- Ballen som fast referanse i Face On, med bevegelige Entry/Low Point/Exit.
- Dynamisk eventrekkefølge inkl. NO TURF CONTACT – dette er produktets
  pedagogiske kjerne og fungerer allerede logisk korrekt.
- DTL leses faktisk som «bak ballen mot målet»; fortegn går til riktig side.
- Ingen overflow på noen av de tre testede viewportene; portrait-gate og safe
  areas fungerer.
- Beslutningen om ingen delt skjerm, ingen sving-timeline og ingen full kølle
  er riktig og forsvares i denne vurderingen.

---

## 3. De største problemene, prioritert etter læringseffekt

### P1 · Komposisjonen, ikke skaleringen, er hovedfeilen

Briefen foreslår å gjøre kontaktobjektene «omtrent 25 % større». Det er for
lite, og det angriper feil variabel. 25 % på en 21 px ball gir 26 px – fortsatt
mikroskopisk. Løsningen er **reframing**: Face On skal ikke vise «svingen med
en ball i», den skal vise «treffet med en bue gjennom». Med et virtuelt
kamerautsnitt på ca. 1,2 m bredde sentrert om ballen får kontaktsonen 2–3×
skala uten at noe annet må vike. Buen klippes av rammen i begge ender – det er
en feature: en bue som fortsetter ut av bildet kommuniserer «dette er et utsnitt
av noe større» bedre enn en komplett, fjern bue.

### P2 · Attack/Path leses som ballretning

Grammatikk-feil, ikke stylingfeil. Fiks med tre grep: tangenten skal **komme
inn mot ballen** (starte oppstrøms, før treffet), **passere gjennom
treffpunktet**, og **stoppe kort etter** med én pilspiss. Ingen partikler.
Etikett direkte på vektoren: `CLUB ATTACK` / `CLUB PATH`. I tillegg: vis
Attack som **vinkel**, ikke bare retning – en liten vinkelsektor mellom
tangenten og en horisontal stiplet referanse ved treffet. En vinkelsektor kan
umulig leses som ball flight.

### P3 · Valgt input styrer slider, men ikke canvas

Chip-slider-modellen har allerede «én om gangen»-logikken. Canvaset følger den
ikke: i Face On-skjermbildet er Arc Height valgt, men canvaset fremhever
attack-tangent og eventpill – ingenting viser at buen kan løftes/senkes. Én
valgt input må gi ett hero-element i full styrke, alt annet dempes (se §8).

### P4 · Duplikater og småtekst spiser roen

7 px outcome-etiketter, 6 px view-undertekst, 6–9 px canvasetiketter, tre
kopier av samme verdi. Regelen skal være: **én etikett på vektoren, én verdi i
outcome-strip, ingen legends, ingen frakoblede kopier**. Typografisk gulv:
ingen tekst under 10 px (se §7).

### P5 · Slideren skjuler nullpunktet

Tre av fire inputs er signerte. Dagens venstre-til-høyre-fyll gjør at
−15° ser ut som «litt fremdrift». Bipolar slider med fast nullmarkør og fyll
fra null til thumb er riktig (se §9).

### P6 · Strike Height har tall uten bilde

Attack og Path har tangenter; Strike har bare «23 mm low». Løsning i §6.

### P7 · Utendørs holdbarhet

Tynne, delvis transparente linjer (target line, lilla direction, turf-markører)
og glød-som-kontrast overlever ikke sollys. Se §10.

---

## 4. Anbefalt layout

### 844 × 390 (canvas 254 px, kontroll 88 px, outcome-strip ~48 px)

**Outcome-strip (høyde 44–48 px)**
- Tre kort uten stiplet ramme: 1 px solid hairline i 20 % av kortets farge,
  fylt fargeprikk (6 px) foran etiketten som fargenøkkel.
- Etikett 10 px caps («ATTACK ANGLE», «CLUB PATH», «STRIKE HEIGHT»),
  letter-spacing redusert til 0.06em i stedet for forkortede navn.
- Verdi 17–18 px mono semibold. Dette matcher «See the Shot»-hierarkiet.
- Reset-knappen beholdes til høyre.

**Perspektivvelger**
- Flyttes fra canvas-sentrum til øvre høyre hjørne av canvaset (overlay).
- To knapper, én linje hver: `FACE ON` / `DOWN THE LINE`, 11–12 px semibold.
  «Contact»/«Direction» fjernes eller demoteres til 9 px sekundærlinje – 
  kameravinkelen er primærbegrepet. 44 px touchflate beholdes.

**Face On-canvas (844 × 254)**
- Bakkelinje på y ≈ 165 (65 % av høyden). Alt under (89 px) er bakkebånd:
  divot-tverrsnitt, markører, markøretiketter.
- Ball: diameter 38–40 px, sentrum x ≈ 40 % av bredden. Asymmetrien gir mer
  rom til exit-siden, der divoten lever for jern.
- Kamerautsnitt: Entry→Exit skal spenne 55–65 % av bredden. Buen klippes av
  venstre og høyre kant på y ≈ 40–70.
- Attack-tangent: 150–180 px lang, starter ~110 px oppstrøms for treffet,
  pilspiss 50 px nedstrøms, 3 px kjerne. Vinkelsektor r ≈ 28 px mot horisontal
  stiplet referanse. Etikett `CLUB ATTACK −5.7°` 11 px på inn-siden av linjen.
- Divot: visuell dybde 2–2.5× fysisk skala, maks ~28 px. Solid fyll med tydelig
  forkant (entry-kant i entry-fargen).

**Kontrollområde (88 px)**
- Chips 44 px: fulle navn («SWING PLANE», «SWING DIRECTION», «LOW POINT
  POSITION», «ARC HEIGHT») 10–10.5 px caps med strammet letter-spacing,
  verdi 14 px mono.
- Slider 44 px sone: se §9.

### 568 × 320 (canvas 184 px)

Samme proporsjoner, strammere innhold:
- Bakkelinje y ≈ 120. Ball 30–32 px. Divot maks ~20 px.
- Maks tre tekstelementer i canvaset samtidig: (1) etiketten på den
  view-relevante tangenten, (2) markøretiketter for valgt input, (3) eventuell
  sekvensindikator. Alt annet er punkter uten tekst.
- Vinkelsektoren beholdes (den er geometri, ikke tekst).
- Chip-etiketter kan gå til 10 px, verdier 13 px. Ingenting under 10 px.

---

## 5. Face On-spesifikasjon

**Alltid synlig:** ball, bue (klippet), bakkebånd, attack-tangent med
vinkelsektor, Entry/Low Point/Exit-markører, divot.

**Eventrekkefølgen** er kjerneinnholdet og fortjener bedre enn dagens
gule pill i øvre venstre hjørne (den står lengst mulig unna hendelsene den
beskriver). Anbefaling:

- Primær: **nummererte markører** direkte på bakkebåndet. Sirkler 16–18 px med
  1/2/3/4 der Entry, Ball, Low Point og Exit faktisk er. Rekkefølgen leses da
  romlig, der den skjer, uten egen forklaringslinje.
- Sekundær: en kompakt sekvenslinje («ENTRY → BALL → LOW POINT → EXIT», 11 px)
  dokket rett under bakkebåndet – ikke øverst. Den pulser kort når rekkefølgen
  faktisk endres (ball-first ↔ ground-first), for det er øyeblikket den
  bærer informasjon.
- NO TURF CONTACT beholdes som tilstandstekst i samme dokk, med tydelig
  gap mellom bue og gress.
- Ball-first vs ground-first trenger ikke eget panel: nummereringen +
  divotens forkant forteller historien. Når Low Point flyttes bak ballen,
  hopper «1» fra Entry til Ball – det er hele forklaringen.

**Markøretiketter:** kun navn (ENTRY / LOW POINT / EXIT) i 10–11 px.
Cm-koordinatene (−2.9 cm, +16.5 cm, +35.9 cm) vises bare når Low Point
Position eller Arc Height er valgt – de er presisjon for den som akkurat nå
manipulerer posisjon, støy for alle andre.

**Strike i canvas:** en horisontal tick-linje over ballen i treffhøyde
(2 px, gul) er nok som romlig anker. Primærforklaringen bor i kortet (§6).

---

## 6. Strike Height uten kølle

Anbefaling: briefens alternativ 1, pluss ett lite grep fra desktop-varianten.

1. **Clubface-glyph i Strike-kortet:** en 18×22 px jernblad-silhuett med
   groove-linjer og et fylt treffpunkt som flytter seg vertikalt med verdien.
   Strike hører hjemme på køllebladet; når bladet ikke finnes i canvas, er
   kortet riktig sted for det.
2. **Kvalitetsord i kortet:** desktop-mocken har allerede «Thin 52%» og en
   klartekstsetning – det mønsteret er bevist. På mobil: ett ord
   (FLUSH / THIN / FAT) i 10 px ved siden av verdien. Ett ord er ikke
   «mer tekst som kompensasjon», det er selve dommen brukeren leter etter.
3. **Ball-tick i canvas** (fra §5) som romlig kobling.

Alternativ 2 i briefen (demotér Strike) frarådes – se §11.

---

## 7. Typografiske minimum

| Element | Minimum | Anbefalt @844 |
|---|---|---|
| Outcome-etikett | 10 px caps | 10 px |
| Outcome-verdi | 14 px | 17–18 px mono |
| Input-chip-etikett | 10 px caps | 10.5 px |
| Input-chip-verdi | 13 px | 14 px mono |
| View-knapp | 11 px semibold | 12 px |
| Etikett på vektor | 10 px | 11 px |
| Markørnavn i canvas | 10 px | 10–11 px |
| Sekvenslinje / tilstandstekst | 10 px | 11 px |

Absolutt gulv: **ingen tekst under 10 px, ingen tekst under 4.5:1 kontrast.**
Fulle begrepsnavn beholdes ved å stramme letter-spacing (0.05–0.08em i stedet
for dagens brede sperring), ikke ved å forkorte.

---

## 8. Progressive disclosure: valgt input → ett hero-element

| Valgt input | Hero (full styrke) | Face On | DTL |
|---|---|---|---|
| Swing Plane | Plane-ribbon | Svak kant-hint + bueform | Translucent ribbon rundt buen, 2.5 px kantlinje |
| Swing Direction | Lilla retningslinje | Foreshortened bakkepil ved ballen | Solid lilla stråle på bakkeplanet fra ball mot/forbi forsvinningspunktet |
| Low Point Position | Markører + divot + sekvens | Full styrke på 1/2/3/4, divot, cm-tall | Low point-punkt på buen |
| Arc Height | Vertikal brakett | Brakett ved ballen som viser Δ mot bakken, cm-tall | Samme brakett projisert |

Regler:
- Hero-elementet: full opasitet, 2.5–3 px kjerne, etikett med verdi.
- Alt annet: 35–45 % opasitet, punkter uten tekst. Den view-relevante
  tangenten (Attack i Face On, Path i DTL) dempes aldri under 60 % – den er
  outcome-anker.
- Ingen auto-bytte av perspektiv. Når endringen er tydeligst i det andre
  perspektivet (Direction/Plane endret i Face On; Low Point/Arc Height endret
  i DTL), får den andre view-knappen én diskret ring-puls (300 ms, ikke loop).

---

## 9. Input–outcome-feedback

Ved sliderendring, total varighet 300 ms (innenfor 250–400 ms):

1. **Berørte outcomes:** verdien tikker til ny verdi; 2 px underlinje i
   kortets farge fader inn/ut. Ikke hele rammen, ikke hele canvaset.
2. **Uberørte outcomes:** dempes til 60 % i samme vindu, tilbake til 100 %.
3. **Canvas:** kun hero-elementet og den view-relevante tangenten animerer
   (de gjør det allerede ved at geometrien endres) – dagens puls på hele
   canvasrammen fjernes.
4. **Kryssperspektiv-hint:** ring-puls på den andre view-knappen (§8).

**Bipolar slider:**
- Fast nullmarkør: 2 × 10 px hakk på tracken.
- Fyll fra nullpunkt til thumb i valgt inputs farge; track ellers nøytral.
- Synlig thumb 26 px, hit-område 44 px.
- Swing Plane (ikke signert rundt null) beholder vanlig min→maks-fyll –
  bipolar behandling der det ikke finnes et meningsfullt nullpunkt ville
  undergrave mønsteret.
- Standardverdi-hakk (hul tick) kun der default ≠ 0.

---

## 10. Utendørs lesbarhet

Elementer som ikke overlever sollys i dag: tynn stiplet target line, 1 px
lilla direction-linje, turf-markørene, halvtransparent divot, 6–7 px
canvasetiketter, glød-som-eneste-kontrast, stiplede outcome-rammer.

Regler:
- Kritiske linjer (bue, tangenter, target line, direction): 2.5–3 px kjerne
  med 1 px mørk halo. Glød er dekor oppå, aldri bæreren av kontrast.
- Etiketter på 80–90 % opake chip-bakgrunner.
- Solid fremfor stiplet overalt der stiplingen ikke koder mening. Forslag til
  konsistent koding: **solid = fysisk bane/geometri, stiplet = referanse**
  (horisontal attack-referanse, target line). Da betyr stipling alltid noe.
- Divot: solid fyll, ikke transparent skravur.
- Fysisk test på telefon utendørs er akseptansekrav før godkjenning – DOM-mål
  og skjermbilder på kontor er ikke bevis for dette punktet.

**DTL-lagdeling** (svar på analysespørsmål 6) skilles med høyde + farge +
valør, ikke med tekst:
- **Target Line:** nøytral, tynn (2 px), full lengde mot forsvinningspunkt,
  «TARGET»-flagg 11 px ved horisonten. Referanse-valør (stiplet eller lav
  intensitet), aldri i konkurranse med outcome-fargene.
- **Swing Direction:** solid lilla stråle **på bakkeplanet** fra ballen.
- **Swing Plane:** translucent ribbon **i luften** rundt buen.
- **Club Path:** kort cyan tangent **ved ballen**, gjennom treffet, én
  pilspiss, samme inn-mot-ball-grammatikk som Attack i Face On.
- Buen: hvit, 3 px, uten dagens store myke blob-skygge ved bakken (den gjør
  nedslagsområdet gjørmete).
- Venstre tekstblokk (SWING PLANE 45° / SWING DIRECTION −15.0°) fjernes;
  verdiene bor i chips og på hero-etiketten.

---

## 11. Fjern / behold / forstørr

**Fjernes**
- Stiplede rammer på outcome-kort (→ solid hairline + fargeprikk).
- Flytende canvas-pills for Attack/Path (→ etikett på vektoren).
- Legends nede i canvaset («ATTACK · VERTICAL TANGENT», «PATH · GROUND
  PROJECTION»).
- DTL-tekstblokken med Plane/Direction-verdier.
- Partikkel-trails på tangentene.
- Cm-koordinater ved alle markører som default (vis kun for relevant valgt
  input).
- Puls på hele canvasrammen.
- «CONTACT»/«DIRECTION» som primærtekst i velgeren (kameranavnet opp).

**Beholdes**
- Tre-nivå-layout, chip + én slider, én canvas, to perspektiv.
- Statisk ball og bue; dynamisk eventrekkefølge; NO TURF CONTACT.
- Fargespråket (rosa attack / cyan path / gul strike-turf / lilla input).
- Reset-knappen.

**Forstørres**
- Kontaktsonen som helhet via reframing (2–3×, ikke 25 %).
- Ball: ~21 px → 38–40 px @844.
- Divot: 2–2.5× visuell dybde.
- Markører → 16–18 px nummererte sirkler.
- Tangentkjerner → 3 px; outcome-verdier → 17–18 px; slider-thumb → 26 px.

---

## 12. Første iterasjon (før visuell polering)

1. **Reframe Face On + typografisk gulv + dedupe** – én batch. Kamerautsnitt,
   bakkebånd, ballskala, fjern duplikater, hev all tekst til gulvet. Størst
   effekt per time, og alt annet bygger på den nye komposisjonen.
2. **Tangent-grammatikken** (P2): inn-mot-ball, gjennom treff, vinkelsektor,
   etikett på vektor. Face On og DTL samtidig – det er samme komponent.
3. **Bipolar slider** med nullmarkør.
4. **Selected-input-spotlight** (§8) – hero/demp-logikken.
5. **Outcome-feedback** (§9) inkl. kryssperspektiv-puls.
6. **DTL-lagdeling** (§10).
7. **Utendørs kontrastpass + fysisk telefontest** som siste gate.

Strike-glyph (§6) kan tas parallelt med 4–5; den er isolert til kortet.

---

## 13. Uenigheter med premissene

1. **«Omtrent 25 % større» er for defensivt.** Kontaktsonen trenger 2–3× via
   reframing. 25 % jevn oppskalering beholder dagens komposisjonsfeil, bare
   litt større.
2. **Strike bør ikke demoteres** (briefens løsningsalternativ 2). For jern er
   strike-kvalitet selve poenget med hele lavpunkt-pedagogikken – det er
   dommen over alt brukeren justerer. Gi den glyph + kvalitetsord i stedet.
3. **Eventpillen bør erstattes, ikke bare flyttes.** Nummererte markører på
   bakkebåndet gjør jobben romlig; en tekstlinje øverst til venstre er en
   omvei uansett størrelse. Behold en kompakt sekvenslinje, men dokket ved
   bakken og kun fremhevet når rekkefølgen faktisk endres.
4. **«Statisk bue» bør tolkes som «ingen timeline», ikke «ingen bevegelse».**
   Den korte inn-mot-ball-animasjonen briefen selv åpner for er verdt å ha:
   retningen på bevegelsen er det som til slutt dreper ball-flight-tolkningen.
   Én gjennomkjøring per endring, stopp kort etter treff, ingen loop.
5. **Bipolar slider bør ikke gjelde Swing Plane.** Plane har ikke noe
   meningsfullt nullpunkt på 0–90°-skalaen; å gi den samme behandling som de
   signerte parameterne ville utvanne nullpunkt-semantikken.
6. Utover dette: premissene (én canvas, ingen delt skjerm, ingen full kølle,
   tvungen landscape, ingen auto-perspektivbytte) er riktige og utfordres
   ikke.

---

## 14. Svar-indeks mot briefens ti analysespørsmål

1. Hva bør fjernes → §11.
2. Hva bør bli fysisk større → §11 + P1.
3. Canvas-komposisjon for læring → §4 + P1.
4. Ball-first/ground-first/divot uten panel → §5.
5. Attack uten ball-flight-tolkning → P2 + §5.
6. DTL-skille Target/Direction/Plane/Path → §10.
7. Strike uten kølle → §6.
8. Valgt input som progressive disclosure → §8.
9. Utendørs-svake elementer → §10.
10. Første iterasjon → §12.
