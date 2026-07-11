# FABLE-ORDRE · StrikeArc designkonsolidering

Repo: `Skrivebord/Apper/svingbue` · Referanse-mock: `strike-window-mock.jsx` (vedlagt)
Omfang: KUN design/layout. Fysikkbuggen (launch direction +21,4° vs +8°) er EKSPLISITT utenfor scope — egen økt, xhigh.
Diagnose-funksjonen er UTE av v1: skjul alle inngangspunkter (hjem/nav), IKKE slett kode eller ruter. Ingen polering av Diagnose-skjermen. (Reposisjoneres i v2 som bro fra akademiet.)

---

## ØKT 1 · Mekaniske fikser — effort: MEDIUM

Ingen designbeslutninger her. Alt er avgjort; utfør mekanisk.

### 1.1 Layout-integritet (alle skjermer)
- Ingen tekst trunkeres: fiks «Learn the physics · L» (Hjem), «ATTACK AN / STRIKE HE / CONTACT ( / Ball firs / DIRECT...» (Strike Window), «LAUNCH DIR» klippet i topp (Impact).
- Ingen elementer overlapper: START HERE-badge skal ikke dekke «FUNDAMENTAL»-etiketten (Academy).
- Onboarding-tooltips skal aldri dekke elementet de forklarer (Impact, «Both lenses at once»): reposisjoner eller dim alt UNNTATT det omtalte.
- Fjern web focus-ring globalt (`outline` på fokusert element synlig i Spin Lab-tittel). Behold synlig fokus for tastatur (`:focus-visible`), fjern for touch.
- Flight-graf i Spin Lab skal ikke klippes av kortets bunnkant.
- Testbredde: 375 pt portrett + landskap. Akseptkriterium: null trunkering, null klipping, null okklusjon.

### 1.2 Token-håndhevelse — «warm light»-regelen
- Oransje (#F97316-familien) = handling/sannhet. NØYAKTIG ett fokuspunkt per skjerm, aldri mer enn to forekomster. Aldri dekor.
- Gull (#D9B36A) = annotasjoner, mål, XP, progresjon.
- Fiolett = struktur (kort, kanter, inaktive noder). Aldri hovedrolle.
- Input/outcome-regelen (hele appen): kontroller = solid kant + fylt fargeprikk; avlesninger = stiplet kant. Eyebrow-etiketter: INPUT · STYR (fiolett) / OUTCOME · LES AV (gull).

### 1.3 Academy-lyssetting
- Bakgrunn: samme skumringsgradient som Hjem (dyp indigo topp → varmere bunn) + stjernestøv. Academy ER natthimmelen; nodene er stjerner.
- Koblingslinjer mellom noder: svak glød, som konstellasjonslinjene på Hjem.
- Kortelevasjon: kortflate to tydelige lystrinn over canvas + myk skygge. Låste noder flate/dimme — kontrast mot aktiv node skal leses umiddelbart.
- START HERE-noden: oransje glød + svak puls (eneste varme element på skjermen — «ballen på rangen»).
- XP-tall og progresjonsbar-fyll: gull.
- Fullførte noder: liten gull-hake.

### 1.4 Paywall (tekst + priser — beslutning tatt, kun implementering)
- Priser: Månedlig kr 99 · Årlig kr 590 (framing: «2 måneder gratis», IKKE prosent-rabatt). Lifetime FJERNES.
- Fiks manglende mellomrom: «MonthlyBilled every month» → «Monthly · Billed every month» osv.
- Trigger beholdes (10 free shots).
- Migreres til skumring-tokens (se Økt 2-tokens); teal ut.

---

## ØKT 2 · Strike Window-relayout — effort: HIGH

Referanse: `strike-window-mock.jsx`. Mocken er normativ for mønster og hierarki; piksel-verdier kan justeres mot eksisterende tokens.

### 2.1 Mønster: PinnedCanvas + OutcomeChips + ControlSheet
- Canvas (svingbue, ball, lavpunkt, attack-tangent) pinned øverst, ~60 % av høyden. Scroller aldri, klippes aldri.
- Outcome-chips (Attack, Path, Strike, Contact/verdict) forankret i canvasens bunn, stiplet stil. Tap → detaljkort ekspanderer over canvas med backdrop-blur; tap utenfor lukker. Spring-animasjon (bruk eksisterende oscillator-disiplin fra choreography-mønsteret, IKKE samme estetikk).
- ControlSheet nederst: input-chips (Low pt, Low height, Plane, Direction) — ÉN aktiv slider om gangen; tap på chip bytter. Verdier oppdateres live under drag (tabular-nums, ingen hopp ved slipp).
- Ball og lavpunkt-markør OVERDIMENSJONERT for lesbarhet (ball ~13 px-ekvivalent i mock-skala). Køllehode rir på buen bak ballen, rotert langs tangent.
- Sidepaneler og bunnkort fra dagens layout FJERNES — alt innhold lever som chips/kort i mønsteret.

### 2.2 Modell-semantikk
- Fire inputs: lavpunkt horisontalt (cm), lavpunkt-høyde (cm, ±), plane (°), direction (°).
- Attack, path, strike, contact/verdict er UTLEDET. Verdict (Pure/Fat/Thin) i badge øverst, live.
- Lavpunkt-høyde < −1 cm → Fat uansett horisontal verdi; > +1,5 cm → Thin.

### 2.3 Orientering
- Geometry 2D og Academy: portrettlåst.
- 3D: landskap-only. «Vis i 3D» = ikon i canvashjørne (IKKE i input-raden). Tap → elegant rotasjonsprompt.
- Rotasjon av telefonen på 2D-skjermen åpner 3D direkte med delt tilstand (lavpunkt/høyde/plane følger med). 2D og 3D er to linser på samme sving.
- 3D-gradskiva: statiske gradtall FJERNES. Grunntilstand = stille ring med gull-ticks i lav opasitet (større hvert 30°). Planvinkelen markeres med tynn gull-sektor 0→gjeldende vinkel + ett gulltall ved kanten. Under justering av plane faner gradtall inn langs ringen og ut ~1 s etter slipp. Ring dimmes i sektoren svingbuen aldri okkuperer. Prinsipp: skiva viser DITT tall, ikke alle tall.

### 2.4 Impact-skjermen
- BEHOLDES som simulator med attack som INPUT (beslutning tatt), men merkes eksplisitt: «SIMULATED INPUT» i mono-eyebrow.
- Attack-slider bruker input-språk (solid); i Geometry er attack alltid stiplet avlesning.
- Migreres fra teal til skumring-tokens.

### 2.5 Akademi-leksjonsmalen (gjelder ALLE leksjonsskjermer, ref. Spin Lab)
Hvert element får én av fire roller; rollen bestemmer plass:
- SANNHETEN: leksjonens ene tall (f.eks. Backspin 7 128 rpm), stort, oransje, med luft. Én per skjerm.
- MODELLEN: pinned canvas ~55–60 %; sannheten + status-badge ligger OPPÅ canvasen (flight-graf bak). Sekundær-outcomes (carry, height, land angle) = stiplede chips i canvasens bunn — IKKE egne kort.
- KONTROLLENE: ControlSheet, én aktiv slider (som 2.1). Parametre som chips.
- KUNNSKAPEN: pedagogiske notater (flyer lie, spin loft-forklaringer o.l.) flyttes INN i tap-detaljkortene. Ingen permanente info-bannere i scrollflaten.
- Oppdragsbanner («Build 7,000+ rpm») komprimeres til pill ved header med fullførings-haker; ekspanderer ved tap.
- Modulnavigasjon (Lab-pager + neste-steg-CTA, f.eks. «Influence →») fast nederst; CTA-en er skjermens oransje handlingspunkt (jf. warm light-regelen: da er sannheten + CTA de to tillatte oransje forekomstene).
- Akseptkriterium: maks fire vertikale soner per leksjonsskjerm; ingen informasjon fjernes, kun re-hylles.

### 2.6 Native-krav (akseptkriterier for hele leveransen)
- Haptics (Capacitor Haptics) på: slider-snap, chip-tap, verdict-endring, kjøp.
- Spring-baserte overganger mellom skjermer; 60 fps, null jank.
- Safe areas/insets respektert; touch-targets ≥ 44 pt.
- Skeleton/shimmer i stedet for spinnere; designede empty states.

### 2.7 Hjem-hero: konstellasjonen er ballflighten (ref. `home-hero-mock.jsx` — normativ for komposisjon)
- Nodene ligger LANGS en flight-parabel fra den oransje ballen på rangen (nederst) til apex (øverst): Ball Flight (START HERE, nærmest ballen) → Strike Window → Why? → Outcome → Academy (apex). Den døde midtsonen elimineres — den ER flighten.
- Flighten tegnes som svakt stiplet oransje bane gjennom nodene (konstellasjonslinje = ballbane).
- Varme punkter (warm light-regelen, nøyaktig to): ballen på rangen (puls-glød) + START HERE-noden (breathe-glød). Øvrige noder kjølige.
- Bevegelse: stjerneglitring (langsom, subtil), puls på ball og startnode. Valgfritt: svak parallakse på stjernelag ved scroll/tilt. `prefers-reduced-motion` respekteres.
- Node-labels: serif navn + mono undertekst, forankret vekk fra skjermkant (ingen trunkering — jf. 1.1).
- «Tonight at the range»-kortet: glasskort med tydelig tap-affordance (gull «try it →»).
- Range-fotoet erstattes/dempes mot silhuett + horisontglød i skumringstoner (dagens foto for lyst/grønt mot paletten).
- Diagnose-noden er UTE (jf. scope). Fem noder totalt.

---

## Leveranse-regler
- NO-GO-kriterium: ordre regnes som levert KUN når alle akseptkriterier i begge økter er verifisert på 375 pt + landskap. Ingen merge før verifisering.
- Ved tvil om designintensjon: stopp og spør — ikke improviser estetikk.
- ponytail `full` gjelder: minimal kode, gjenbruk mønsteret (én PinnedCanvas/ControlSheet-implementasjon, ikke per-skjerm-kopier).
