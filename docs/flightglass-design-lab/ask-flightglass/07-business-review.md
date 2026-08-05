# Ask Flightglass — 07 Business review (freemium, kostnad, tillit)

**Status:** Utredning til eierport. Ingen pris- eller paywallendring foreslås implementert her.
**Ramme:** Ask Flightglass skal **styrke eksisterende Pro-verdi** i Range/Academy/Lab. Ingen ny abonnementsplan, ingen nye SKU-er, ingen endring i de tre `strikearc_pro_*` RevenueCat-ID-ene. Entitlement er den eksisterende `pro`.

---

## 0. Prisgrunnlag og antakelser

Alle kronebeløp bruker **1 USD ≈ 10 NOK (antakelse)**. LLM-priser er offentlige listepriser per august 2026 brukt som *referanseklasser* — **ingen leverandør velges her**:

| Klasse | Eksempelpris inn/ut per 1M tokens | Kommentar |
|---|---|---|
| S (liten) | $1 / $5 | Haiku-klasse. Rask, billig, god nok til formulering over kuratert innhold |
| M (mellom) | $3 / $15 | Sonnet-klasse. Standard-kandidat for kvalitet/pris |
| L (frontier) | $5 / $25 | Opus-klasse. Overkill for formulering; kun aktuelt for offline evaluering/QA |

Prompt-caching-økonomi (typisk): cache-lesing ≈ 0,1× innpris; cache-skriving ≈ 1,25×. Batch-API (offline eval) ≈ −50 %.

**Svarform-antakelser** (fra answer-contract i 03):
- LLM-svar: stabil systemprompt + answer-contract + kuratert kunnskapsutdrag ≈ 2 500 tokens + 500–1 500 tokens fersk kontekst + 300–700 tokens output; pluss et separat lite klassifiseringskall (03 §3) ≈ +0,01 NOK/svar på S-klasse.
- **Cache-antakelse (board-korrigert):** produktets dominante mønster er sporadiske én-spørsmåls-økter — prompt-cache med kort TTL treffes da sjelden. **Headline-tallene er derfor UTEN cache**; cache er oppside, ikke plan.
- Deterministisk svar (fast spørsmål/tabell/deeplink): **0 LLM-kostnad**.

**Kostnad per LLM-svar** (inkl. klassifiseringskall; midtestimat 1 000 fersk inn / 500 ut):

| Klasse | Per svar (headline, u/cache) | Ved cache-treff |
|---|---|---|
| S | ≈ **0,07 NOK** | 0,05 NOK |
| M | ≈ **0,19 NOK** | 0,12 NOK |
| L | ≈ **0,32 NOK** | 0,20 NOK |

## 1. Kostnad per aktiv bruker og netto margin (krav 6a)

**Netto utviklerproveny (board-korrigert — alle marginer regnes mot dette, ikke brutto):** Priser er inkl. 25 % norsk mva (App Store-konvensjon); butikkprovisjon 15 % (Small Business Program) eller 30 %.

| Plan (masterplan-lås) | Brutto | Eks. mva | Netto etter 15 % / 30 % |
|---|---|---|---|
| Årlig kr 590 | 49,2 NOK/mnd | 39,3 | **33,4 / 27,5 NOK/mnd** |
| Månedlig kr 99 | 99 NOK/mnd | 79,2 | **67,3 / 55,4 NOK/mnd** |

Bruksantakelser (**UVERIFISERT**, A2/A3 i 08 — må måles i pilot):
- Gratis aktiv Ask-bruker: kvote 13/mnd; **verste fall med gratis-oppfølging 26/mnd** (oppfølgingsregelen dobler taket — board-funn).
- Pro: p50 ≈ 20, p95 ≈ 150 LLM-svar/mnd. Fair use-tak: **revidert til 150/mnd** (var 300 — se marginanalysen; 300 var dessuten et umerket antatt tall).

| Segment | S-klasse | M-klasse | L-klasse |
|---|---|---|---|
| Gratis typisk (13/mnd) | 0,9 NOK/mnd | 2,5 | 4,2 |
| Gratis verste fall (26/mnd) | 1,8 | **4,9** | 8,3 |
| Pro p50 (20/mnd) | 1,4 | **3,8** | 6,4 |
| Pro p95 (150/mnd) | 10,5 | **28,5** | 48,0 |
| Pro fair use-tak (150/mnd) | 10,5 | 28,5 | 48,0 |

**Marginvurdering (netto):** På årsplanen (27,5–33,4 NOK/mnd netto) er en p50-Pro-bruker på M-klasse uproblematisk (~12–14 % av proveny). Men en p95-/fair-use-bruker på M-klasse (28,5 NOK) spiser **85–104 %** av netto årsproveny — og på L-klasse er hun tapsbringende. Konsekvenser (bindende for anbefalingen):
1. **S-klasse er default-kravet** for formuleringslaget; M kun hvis evalsettet beviser behovet (A4). På S-klasse er selv fair-use-taket (10,5 NOK) godt innenfor netto proveny.
2. Fair use settes til **150/mnd** og discloses ved kjøp (se §2-copy). Taket er en antakelse (≈ p95) og justeres på pilotdata — aldri stille.
3. Gratiskvoten koster 1,8–4,9 NOK per aktiv Ask-bruker/mnd — akseptabel akvisisjonskostnad bare hvis konverteringsloopen beviser seg (A7, §6).

> **Avvik som må avklares av eier (logget i 08):** `docs/monetization-strategy.md` anbefaler 99/399/999-stigen og `diagnose-v3-values-spec.md` §3.5 omtaler «the locked 99/399/999 ladder», mens masterplanen (høyere i hierarkiet) låser **99/590** med «2 months free». Marginene over holder i begge stiger; Ask Flightglass tar ingen stilling, men avviket bør ryddes.

## 2. Tre etiske freemium-modeller (krav 5)

Felles for alle tre (ufravikelig, fra masterprompt):
- Deterministiske faste spørsmål, godkjente tabeller og deeplinks til modeller/leksjoner er **alltid gratis og ubegrenset**.
- Gratisbrukeren får alltid en ekte innsikt og en vei videre **før** en Pro-prompt vises.
- Pro-prompten forklarer konkret hva Pro åpner, har dismissal og restore purchases. Aldri nedtelling, skjult nedstruping, utydelige kreditter eller falsk hastverk.
- Kvoter er synlige tall («2 av 3 igjen denne uken»), aldri stille degradering til dårligere modell.

### Modell A — «3 per uke» (eierens standardkandidat) ⭐ anbefalt

| | Gratis | Pro |
|---|---|---|
| Faste spørsmål, tabeller, verktøy | Ubegrenset | Ubegrenset |
| Åpne modeller/leksjoner via deeplink | Ubegrenset | Ubegrenset |
| Introduksjonsøkt (guidet, verdifull) | Én gang, full kvalitet | — |
| LLM-fritekstsvar | **3/uke**, inkl. én oppfølging per tråd | Ubegrenset innen fair use (150/mnd, disclosed ved kjøp) |
| Lagret historikk | Kun inneværende økt | Lagret og gjenfinnbar |
| Kontekst fra valgt Flightglass-tilstand | Kun i økten, etter tydelig signal | Valgfritt, synlig, reversibelt |

- **Verdihypotese:** ukeskvote skaper en tilbakevendende vane (range-økt → ett spørsmål) i stedet for en engangsopplevelse; kvoten er romslig nok til ekte verdi, knapp nok til at en engasjert bruker møter grensen i en høyintensjonsuke. Reset: **kalenderuke (mandag)**, synlig i telleren — aldri udefinert rullering.
- **Kostnad:** 1,8–4,9 NOK/aktiv gratisbruker/mnd (S–M-klasse, verste fall med oppfølging).
- **Kvoteteller-regel (forener 07 og 12 etter board-funn):** telleren («2 of 3 this week», mono/tabulær) er synlig i sheet-headeren **fra åpning** — statusinformasjon. **Pro-linjen** vises først **etter** levert verdi — salgsøyeblikk. Copy ved grense og på paywall discloser fair use: «Pro removes the weekly limit — fair use 150 answers/month.» Aldri «unlimited» uten disclosure.
- **Gratis→Pro-loop (krav 6b):** Range-økt → konkret spørsmål → godt svar nr. 3 → neste spørsmål møter Pro-linjen *etter* at verdi er levert. **Ærlig forbehold (board):** deterministisk forrang minimerer bevisst antall kvotemøter — jo bedre katalogen blir, desto færre treffer grensen. Loopens bæreevne hviler derfor på **A7 (ny antakelse): andel spørsmål som passerer katalogen til LLM, og andel gratisbrukere som møter ukesgrensen.** A7 er primær pilotmetrikk med terskel som avgjør A vs B (se §6). 12–20 %-referansen fra strategidokumentet gjelder feature-gates på kjernefunksjoner — ikke direkte overførbar til en kvote få treffer; brukes ikke som prognose.
- **Risiko:** kvote-forvirring («hvorfor 3?») — løses med synlig teller og ærlig copy; misbruk via flerkontoer (se §4). Merk også: brukeren kan ikke alltid vite på forhånd om et spørsmål koster kvote (rutingen avgjør) — telleren oppdateres synlig i svaret, og deterministiske svar merkes «free · always».

### Modell B — «Deterministisk gratis, samtale er Pro»

| | Gratis | Pro |
|---|---|---|
| Alt deterministisk (som A) | Ubegrenset | Ubegrenset |
| Introduksjonsøkt | Én gang | — |
| LLM-fritekstsvar | **0** etter intro | Ubegrenset innen fair use |
| Historikk | — | Lagret |

- **Verdihypotese:** LLM-samtale er en ren Pro-funksjon; intro-økten er demoen. Enklest å kommunisere, billigst (~0 NOK/gratisbruker), null kvotemekanikk.
- **Svakhet:** kutter aha-loopen for gratisbrukere — nettopp segmentet Ask skal konvertere; risiko for at funksjonen oppleves som ren paywall-agn. Svakere ASO/deling («appen svarte meg gratis» forsvinner).
- **Passer hvis:** eier vil minimere kostnad/misbruk i første pilot og heller åpne opp senere (åpne opp er alltid mer populært enn å stramme inn).

### Modell C — «Månedspott»

| | Gratis | Pro |
|---|---|---|
| Alt deterministisk | Ubegrenset | Ubegrenset |
| LLM-fritekstsvar | **10/mnd** (pott, ingen rullering) | Ubegrenset innen fair use |
| Historikk | Siste 5 spørsmål lokalt | Full, synkronisert |

- **Verdihypotese:** en måned er nærmere golferens beslutningsrytme (utstyrsvalg, banesesong); potten tåler én intens helg.
- **Svakhet:** «binge og forsvinn» — hele potten brukes i uke 1, ingen vanedannelse resten av måneden; grensen møtes sjeldnere → færre moment-of-intent-visninger enn A.
- **Kostnad:** ≈ 1,1 NOK/aktiv gratisbruker/mnd (M-klasse) — omtrent som A.

### Anbefaling og motanbefaling (revidert etter Review Board)

**Anbefalt vei: trinnvis.**
- **Trinn 1 — «Ask v0», deterministisk-only:** katalog + tabeller + deeplinks, ingen LLM, ingen backend, ingen samtykkeflate. Prototypen (12) er allerede LLM-fri. v0 måler gratis den dataen A-vs-B-valget mangler: faktisk spørsmålsetterspørsel, katalog-treffrate og misrate (grunnlag for A7). Null kostnadsrisiko.
- **Trinn 2 — Modell A** (eierens kandidat) når backend-forutsetningen (§2b/O9) er godkjent og evalsettet er herdet: kvoteteller-regelen over, oppfølging «én per tråd», reset kalenderuke.
**Plausibel motanbefaling: Modell B** som trinn 2 i stedet for A, hvis A7-målingen fra v0 viser at få vil treffe kvoten (da er kvotemekanikken kostnad uten konverteringsverdi); B kan senere mykes opp til A uten å ta noe fra noen.
**C frarådes** som start: samme kostnad som A, svakere vane- og konverteringsmekanikk.

### 2b. Håndhevingsarkitektur (board P0 — forutsetning for enhver LLM-modell)

Kvote, intro-økt, rate limit og fair use kan **ikke** håndheves ærlig i klienten alene (nullstillbar ved reinstall), og en API-nøkkel kan aldri bakes inn i appen (ekstraherbar → ubegrenset misbruk). Ethvert LLM-lag krever derfor:
- **En minimal proxy-backend:** klient → proxy → modelleverandør. Nøkkelen bor kun i proxyen. Kvote/rate-limit/fair-use telles server-side per konto (der konto finnes) eller per enhets-ID utstedt av proxyen.
- **Kostnadslinje:** en slik proxy (serverless/edge) er i praksis < 100 NOK/mnd ved pilotvolum (ANTAKELSE, merkes A8) — neglisjerbar mot LLM-kostnaden, men den er en **ny ekstern avhengighet** og personvernflate.
- **Konflikt som må eier-avgjøres (O9):** masterplanen forbyr nye eksterne avhengigheter uten konkret produktbehov, og 00 lister «ingen backend» som ikke-mål *for denne fasen*. LLM-laget ER det konkrete produktbehovet — men valget (inkl. leverandør av proxy-hosting) er eierens, og tas tidligst ved trinn 2. **Uten O9-godkjenning er kun Ask v0 / Modell B-uten-LLM ærlig leverbart.**
- **Degradering ved kostnadstak (board P1):** når org-taket nås kuttes gratis-LLM først; Pro-brukere beholder LLM lengst og får ærlig i-app-melding hvis også de må kuttes («Free-text answers are paused this month — deterministic answers and all models remain»); deterministisk lag er alltid upåvirket. Alarm ved 2× forventet forbruk varsler eier i-app/dashboard (produktet samler ikke e-post).

## 3. Outage-fallback og drift uten ekstern LLM (krav 6d, 6h)

Produktet er designet **deterministisk først**, så LLM-bortfall degraderer mykt:

1. **Alltid tilgjengelig uten nett/LLM:** faste spørsmål med kuraterte svar, de solveFlight-deriverte tabellene (`design/mocks/candidates/` — tre bestod allerede kvalitetsvakt), alle deeplinks til modeller/leksjoner, intent-matching mot fast spørsmålskatalog (lokal søk/synonymliste, ingen modell).
2. **Ved LLM-utilgjengelighet:** Ask-flaten viser ærlig tilstand («Free-text answers are offline — here's what Flightglass knows») og ruter spørsmålet mot nærmeste faste spørsmål/tabell/leksjon. Ingen spinner-evighet; timeout ≤ 5 s → fallback.
3. **Kvoten forbrukes aldri** av feilede/utilgjengelige svar.
4. Pro-verdien reduseres midlertidig, men kjerneproduktet (Range/Academy/Lab) er upåvirket — Ask er et lag, ikke en avhengighet.

## 4. Misbruksrisiko (krav 6c)

| Risiko | Vurdering | Tiltak |
|---|---|---|
| Kvote-farming (flere kontoer/enheter) | Lav verdi å farme (3 svar/uke), men mulig | Kvote knyttes til konto der konto finnes; ellers enhet. Ingen kontotvang bare for Ask — friksjonen er dyrere enn misbruket |
| Token-brenning (svært lange inputs) | Reell kostnadsrisiko | Hard input-grense (f.eks. 500 tegn/spørsmål), kontekst er strukturert state (små tall), aldri fritekst-vedlegg |
| Prompt-injection via spørsmålstekst | Kan ikke endre tall (LLM eier ingen tall), men kan forsøke å få modellen ut av kontrakt | Answer-contract håndheves strukturelt (03 §5): svar valideres mot skjema; deeplinks kun fra godkjent register; ute-av-domene → standard avvisning |
| Off-domain bruk (gratis generell chatbot) | Sannsynlig uten grense | To lag: lokal katalog/mønster fanger det åpenbare gratis; resten fanges av det billige klassifiseringskallet (03 §3). **Kvoteregel (board-avklart):** off-domain trekker aldri brukerkvote, men klassifiseringskall er en driftskostnad — mot bevisst pumping gjelder rate-limiten (30 forespørsler/time), og gjentatt off-domain fra samme enhet (>10/dag) strammer til 5/time. Verste-fall-kostnad per enhet er dermed ~150 klassifiseringskall/dag ≈ 1,5 NOK/dag — begrenset og alarmert |
| Videresalg/scraping av svar | Lav (svar er verdiløse uten modellene) | Rate limit per konto/enhet (f.eks. 30 forespørsler/time inkl. deterministiske) |
| Diagnose-omgåelse («diagnostiser meg i fritekst») | Trussel mot ærlighetsdoktrinen | Forbudte påstander i evalsettet (11); routing til Diagnose-intervjuet er det eneste svaret på diagnosespørsmål |

Kostnadsbudsjett: hard månedlig tak per org-nøkkel + alarm ved 2× forventet forbruk, med degraderingsrekkefølgen definert i §2b. Fair use-taket (150/mnd, antakelse ≈ p95) håndheves ærlig: synlig teller i-app, disclosure ved kjøp, ingen stille degradering. All kvotehåndheving skjer server-side (§2b) — klient-side telling er kun visning.

## 5. Samtykke, dataminimering, retention og sletting (krav 6e–g)

- **Samtykke:** Første LLM-spørsmål utløser én tydelig, ikke-skummel forklaring: hva sendes (spørsmålet + ev. valgt tilstand), til hvem (ekstern modelleverandør — navngis når valgt), og at deterministiske svar aldri forlater enheten. Eksplisitt aksept før noe sendes. Kan reverseres i innstillinger; produktet fungerer fullt deterministisk uten aksept.
- **Dataminimering:** Det sendes kun: spørsmålstekst, ev. eksplisitt delt strukturert tilstand (f.eks. `{club: driver, spin: 3400}`), UI-språk. Aldri: navn, e-post, enhets-ID, posisjon, kjøpshistorikk, Academy-progresjon. Ingen persistente bruker-ID-er til leverandør.
- **Retention/sletting:** Gratis: ingen server-historikk; øktens samtale lever kun i minnet på enheten. Pro: historikk lagres lokalt (synk er et separat eiervalg) med «Delete all questions»-knapp som sletter komplett og umiddelbart. Pro-copy må ikke selge «saves your answers» hardere enn lokal lagring bærer (tapes ved reinstall inntil ev. synk) — copy: «keeps your answers on this device».
- **Leverandør- og GDPR-krav (bindende prokura-kriterier, board-innstrammet):** databehandleravtale (DPA) er obligatorisk; behandling i EØS **eller** gyldig overføringsmekanisme (SCC/adequacy) — «foretrukket» er ikke en mekanisme; zero-/kortest mulig retention hos leverandør; ingen trening på kundedata. **Lanseringsgate:** shippet `privacy.html`/`terms.html` oppdateres med LLM-databehandlingen før første eksterne kall — uten dette shippes ikke LLM-laget.
- **App-butikk-policy (board-funn):** Apples/Googles krav til generativ AI i apper (aldersklassifisering, moderering, deklarasjoner) kartlegges som del av trinn 2-forberedelsen — inn i launch-readiness-sjekklisten, ikke antatt uproblematisk.
- **Barn/sensitivt:** Ask svarer ikke på helse-/skadespørsmål («my back hurts when…») — ruter til «Flightglass cannot determine that» + anbefaler fagperson. Inn i forbudt-listen i 11.

## 6. Forventet effekt på forretningen (hypoteser, UVERIFISERT)

- **Retensjon:** Ask angriper strategidokumentets Risiko #1 («forståelse er engangs-aha») fra samme vinkel som Diagnose: en grunn til å åpne appen etter hver dårlig range-økt — men med lavere terskel (ett spørsmål vs. helt intervju).
- **Konvertering:** nytt, tredje paywall-øyeblikk (kvotegrense ved intensjon) i tillegg til shot-limit og Academy-dybde. Målepunkt: andel kvotegrense-visninger → Pro-kjøp.
- **Kannibalisering:** risiko for at Ask erstatter Academy-bruk. Mottiltak er innebygd i kontrakten: hvert svar deeplinker til leksjonen/modellen — Ask er en trakt *inn* i Academy, ikke en erstatning. Målepunkt: leksjonsåpninger fra Ask.
- **Måltall for pilot:** Ask-aktivering (andel som stiller ≥1 spørsmål), svar→deeplink-klikk-rate, A7 (katalog-passering + kvote-treffrate), kvotegrense→Pro-visning→kjøp, kostnad/MAU mot §1.
- **Kill-/pivot-kriterier (etter monetization-strategy §6-malen; terskler er startverdier, eier kan justere):**

| Signal | Terskel | Konsekvens |
|---|---|---|
| Ask-aktivering (v0) | < 10 % av WAU stiller ≥1 spørsmål etter 4 uker | Ask forblir v0/deterministisk; ingen LLM-investering |
| Deeplink-klikk | < 25 % av svar fører til modell/leksjon etter 4 uker | Svarformatet revideres (traktvirkningen er poenget); < 15 % → pivot: Ask blir ren katalogsøk |
| A7 kvote-treff (A) | < 5 % av aktive gratis-Ask-brukere møter ukesgrensen | Modell A avvikles til fordel for B (kvoten konverterer ikke, koster bare) |
| Kostnad/MAU | > 2× §1-estimatet to måneder på rad | Modellklasse ned (M→S) og/eller kvote ned; > 4× → LLM-laget pauses (degradering §2b) |
| Forbudt-mønster-treff i produksjon (F-listen i 11) | Én bekreftet persondiagnose/oppdiktet måling | Stopp LLM-svar til rotårsak er fikset og evalsettet utvidet (NO-GO-klasse, uavhengig av alle andre tall) |
