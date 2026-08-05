# Full Flightglass-revisjon — 04 First principles & research

**Metodemerking:** [F] = faktum fra repo/kilde · [R] = kildebelagt research (navngitt) · [H] = hypotese som kan testes · [S] = designvurdering/smak. Ingen brukerbevis er funnet på; alle brukerpåstander er [H] til pilotdata finnes.

## 1. Golfernes jobber (rangert)

1. **«Forklar det jeg nettopp så»** [H, støttet av produktets egen tese]: golferen kommer fra en range-økt/simulator med et konkret utfall (slice, ballong, tynn) og vil forstå årsaken — nå, ikke etter et kurs. Dette er kjøpsmotivet («See why it flew») og aha-øyeblikket (aktiveringsdefinisjonen i monetization-strategy §5 [F]).
2. **«La meg prøve selv»**: manipulere årsak → se virkning live. Range/Lab-jobben; det produktet gjør som ingen artikkel kan.
3. **«Lær meg det ordentlig»**: strukturert progresjon med mestring. Academy-jobben; vinterjobb [R: monetization-strategy §3 sesonganalyse].
4. **«Hva er galt med akkurat mitt skudd?»**: diagnosen. Krever strukturert intervju for ærlighet [F: diagnose-spec-doktrinen].
5. **«Ett konkret spørsmål»**: Ask-jobben [F: ask-flightglass/02 gap-analyse — jobben har i dag ingen flate].

**Kritisk innsikt for IA-en:** jobbene 1–5 er én kausal reise (utfall → forklaring → eksperiment → læring), ikke fem søsken-destinasjoner. Dagens app shipper jobb 2 (Range/Lab) og 3 (Academy) som flater, jobb 1 finnes bare implisitt, jobb 4 er en ushippet mock, jobb 5 er en spec. **Appens kjerneløfte («see why it flew») har ingen shippet eierflate** — Outcome-flisen på Home peker på en inert parameter [F: ask-flightglass/02 §2]. Dette er revisjonens største strukturfunn.

## 2. Rolleavklaring (ikke-overlappende, foreslått)

| Flate | Eier-jobb | Eier IKKE |
|---|---|---|
| **Range** (Impact) | Live eksperiment: én aktiv parameter → flukt | Forklaringsprosa, historikk, diagnose |
| **Outcome** | Lesbar forklaring av SISTE skudd (plain language + årsakskjede) | Input-manipulasjon (read-only per masterplan §7.3) |
| **Lab** (Geometry/Strike Window/Studio) | Dypere geometri-inspeksjon for den som vil se mekanikken | Førstegangsforklaring |
| **Academy** | Paced læring + mestring + XP | Raske svar |
| **Diagnose** | Strukturert intervju: mitt miss-mønster → sannsynlig levering | Fritekst, generelle spørsmål |
| **Ask** | Ett spørsmål → kort ærlig svar → deeplink til riktig flate over | Å være destinasjon; diagnose; tall-produksjon |

[S] Ask og Outcome er komplementære innganger til samme forståelseslag: Outcome forklarer *det målte/simulerte skuddet*, Ask besvarer *det formulerte spørsmålet*. Begge deeplinker inn i Academy/Lab. Ingen av dem er en fane.

## 3. Spørsmål → forklaring → trygt neste eksperiment (kjedekravet)

Enhver retning i fase C må demonstrere denne kjeden uten blindveier [F: startprompt-krav]:
utfall/spørsmål → (Outcome/Ask/Diagnose) kort årsak + grense → én primærhandling → live modell med relevant parameter aktiv → tilbakevei som bevarer konteksten. Dagens shippede app bryter kjeden tre steder [F]: Outcome-inngangen er inert, Range tar ikke imot tilstand (G1), og retur fra en flate mister alltid konteksten (ingen delt tilstand mellom Range og Lab).

## 4. Research: mønstre og verdikter

[R] = prinsipper fra navngitte kilder; ingen skjermer kopieres.

| Mønster/referanse | Kilde | Verdikt | Begrunnelse |
|---|---|---|---|
| Ett dominant instrument per skjerm; sekundært i sheets | Apple HIG (modality/sheets) | **adopt** (allerede lov 1/2) | Kjernen i instrumentfølelsen |
| Native tab bar for 3–5 likestilte destinasjoner | Apple HIG (tab bars) | **reject** for hub-modellen / **vurderes per retning** | Flatene er modi i en kausal reise, ikke søsken; men én retning i fase C skal teste tab-bar ærlig (den er kategoristandarden vi bryter — bruddet må bevises, ikke antas) |
| Mørk «pro-instrument»-estetikk (natt, glød, neon) | Kategoriklisjé (launch monitors, sim-apper, sci-fi-dashboards) | **challenge** | Dagens UV Ember deler huefamilie med klisjeen; minst to retninger skal bevise at sannhet kan lyse uten natt |
| Papir/print-instrument: lys bakgrunn, trykk-typografi, én signalfarge | Vitenskapsformidling (feltbøker, tekniske manualer, Teenage Engineering-produktark) | **adapt** i én retning | Lys flate gir trykkbar sannhet og dagslys-lesbarhet (range-bruk utendørs [H]) |
| Broadcast-golf-grammatikk (tracer over nøytral verden, TV-telemetri) | TrackMan/Toptracer-sendinger [R: offentlig kringkastingsgrafikk] | **adapt** i én retning | Golferen har allerede lært denne visuelle kontrakten; nøytral verden + én signalfarge er innebygd ærlighet |
| Duolingo/Brilliant-progresjon (streak, XP, path) | Læringsapper [R: monetization-strategy §2] | **adopt** (finnes) men **contain** | Belønningsfarger er allerede lov-avgrenset; ingen retning får la reward-grammatikk lekke inn i instrumentflater |
| Diegetisk verden-som-meny (Night Ladder) | Spillmenyer/verdensnavigasjon | **challenge** | Vakker, men verden-metaforen konkurrerer med instrument-metaforen; fase C må avgjøre om Home er et *sted* eller et *cluster* |
| Skeuomorf måleinstrument-detalj (ticks, graveringer, plater) | Fysiske instrumenter (flycockpit, laboratorieutstyr) | **adapt** med måtehold | Ticks/ruler er allerede render-signatur (lov 13); graveringspynt uten data er lov 6-brudd |
| «Data ink ratio» — fjern alt blekk som ikke bærer data | Tufte [R] | **adopt** som revisjonsprøve | Brukes som kniv i §5-fjerningslisten og i UV-Ember-kritikken (03) |
| Variable fonts / optical sizing for instrument-hierarki | Moderne typografi | **adapt** per retning | Fraunces-avviket viser appetitten; hver retning må eie ETT konsistent typehierarki, ikke arve tre |

## 5. Fjernings-/forenklingskandidater (første kutt-liste; endelig i fase C/D)

1. **Døde kontrakter** [F]: `?play=1`, `sa_swing` (skrives, leses aldri), sibling-lenker som front-page-spec allerede dømte — fjernes uansett retning.
2. **Fraunces-avviket** [F: DESIGN-SYSTEM «showcase deviation»]: tre skriftstemmer (Inter/Space Grotesk + Fraunces + system-stack på Home-spec) er én for mange; hver retning velger ÉN display-stemme.
3. **Splash-/intro-sekvenser**: enhver blokkerende choreografi (front-page-spec fjernet den én gang; regelen gjøres permanent).
4. **Ubrukte P3-parameterhues** [verifiseres i 03]: åtte datahues er definert; hues uten shippet bærende bruk er kompleksitetsgjeld.
5. **Impact Studio som udefinert «tredje sted»** [F: shippet men fraværende i masterplanens IA]: enten får den en eierjobb i IA-en eller den slås sammen med Range/Lab.
6. **Mock-arven som skygge-sannhet**: `*-glass.html`, gamle home-konsepter, StrikeArc-front-page-spec — arkiveres eksplisitt som historikk i beslutningsloggen slik at de slutter å konkurrere med CSS-sannheten.
7. **Grain/bloom/glow-laget** (.sa-depth): vurderes per retning mot lov 6 («ingen dekorativ glow») — i dag er unntakslisten selve loven.

## 6. Det som IKKE utfordres (fastholdt fundament)

Fysikk som fasit; tall=sannhet/visual=tolkning; én dominant jobb; live respons < 16,7 ms; ærlighetsregistrene (model/EST/benchmark); tilgjengelighet som kontrakt (44 px, reduced motion-paritet, SR-alternativer); ingen mørke mønstre; engelsk UI. Retningene konkurrerer om å *uttrykke* disse bedre — aldri om å myke dem opp.
