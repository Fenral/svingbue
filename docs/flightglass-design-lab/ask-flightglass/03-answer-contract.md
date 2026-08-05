# Ask Flightglass — 03 Answer-contract, routing og deeplink-register

**Prinsipp (masterprompt, ufravikelig):** LLM-en forklarer språk; den eier aldri fysikk, tall, modeller eller brukerens sannhet. Motoren, testede tabeller og kuratert Flightglass-innhold er autoritative. Hvert svar er enten forankret i et godkjent kunnskapsstykke eller sier at Flightglass ikke kan fastslå dette.

## 1. Answer-contract (struktur for hvert svar)

Hvert Ask-svar — deterministisk eller LLM-formulert — renderes fra samme strukturerte objekt. LLM produserer aldri fri prosa rett til skjermen; den fyller felt i kontrakten, og render-laget håndhever den.

```
AskAnswer {
  v: 2,
  intent_class:  'definition' | 'mechanics' | 'benchmark' | 'conditions'
               | 'table' | 'tool' | 'diagnose' | 'out-of-domain'
                          // satt av RUTING (§3), aldri av formulerings-LLM
  answer:        string   // ≤ 60 ord, vanlig golfspråk, engelsk (produktlov 10)
  causal_chain:  ChainLink[] // 2–4 ledd
  assumptions:   string[] // 0–3 eksplisitte forutsetninger ("assumes centered contact")
  cannot_say:    string   // SKJEMA-OBLIGATORISK for intent_class mechanics/benchmark/
                          //   conditions/tool (valgfri for definition/table):
                          //   hva Flightglass ikke kan fastslå. Standardformular:
                          //   "Flightglass doesn't measure your swing" /
                          //   "Flightglass cannot determine that from this information"
  numbers:       NumToken[] // ALLE tall i answer/causal_chain finnes her som tokens;
                          //   prosafeltene refererer tokens ({n0}, {n1}), rendres av
                          //   render-laget i riktig typografi/register
  grounding:     GroundingRef[] // ≥ 1
  action:        DeepLink // nøyaktig ÉN primærhandling fra registeret i §4
  source_mode:   'deterministic' | 'llm'        // synlig for QA, ikke for bruker
}

ChainLink   = { text: string,             // parafrase
                quote: string,            // ORDRETT sitat-spenn fra grounding-stykket;
                                          //   substring-valideres mot korpusutdraget
                groundingId: string }
NumToken    = { id: string, value: number|string, unit: string,
                register: 'model' | 'est' | 'benchmark' | 'user-echo',
                groundingId: string|null  // null KUN tillatt for register 'user-echo'
              }
GroundingRef = { type: 'engine-table' | 'lesson-content' | 'concept-sheet'
                      | 'diagnose-band' | 'external-benchmark',
                 id: string, version: string,
                 entitlement: 'free' | 'pro' }   // se §2
```

**Regler:**
1. **Tall-regelen:** Tall finnes kun som `NumToken`; prosa uten token-referanse skal være tallfri (inkl. tallord og relative kvanta — «three thousand», «half your spin» — som normaliseres før validering). Hvert token med register `model`/`est`/`benchmark` må binde til en **spesifikk celle/fixture/bånd-ID** i grounding (ikke bare «finnes i utdraget»). LLM kan aldri regne, runde eller interpolere; usporbart kvantum → valideringsfeil → deterministisk fallback.
2. **Register-regelen (produktlov 4 + Academy-presedens):** register settes **per tall**, følger kunnskapsstykket, aldri LLM-ens valg. `model` = mono/tabulær; `est` bærer `≈`/EST; `benchmark` merkes «TOUR / not the simulator»; `user-echo` (tall brukeren selv oppga, f.eks. «3400 rpm») rendres i nøytralt register, **aldri** i model-typografi, og er unntatt grounding-kravet men aldri fra ærlighetsregel 6. Blandede registre i ett svar er lovlig fordi registeret er per-token (jf. eval R6/E8).
3. **Grense-regelen:** `cannot_say` er skjema-obligatorisk per intensjonsklasse (se skjema over) — avgjort av rutingens klassifisering, ikke av formulerings-LLM-ens skjønn. Manglende felt for påkrevd klasse = valideringsfeil → deterministisk fallback.
4. **Én handling:** nøyaktig én primær deeplink per svar (produktlov 1). Sekundært innhold vises **in-place i samme sheet** (push/pop med tilbake-affordance) — **sheet-stacking er forbudt** (produktlov 2/8).
5. **Ingen diagnose:** fritekst gir aldri en persondiagnose. Intensjonsklassen `diagnose` settes av rutingen (§3) og svarer alltid med ruting mot Diagnose-intervjuet. I flerturs tråder re-klassifiseres **hver** oppfølging; akkumulert brukerkontekst («I spin it 3400 and slice») flytter tråden til `diagnose`-klassen.
6. **Ingen råd forkledd som måling:** setninger på formen «your X is probably…» er forbudt uten strukturert input brukeren eksplisitt har gitt i økten; brukeroppgitte tall kan relateres til benchmarks kun med forbehold («TOUR stock shots sit lower — whether *yours* is too high depends on flight Flightglass can't see»).
7. **Driver-yardage-forbudet (runtime, ikke bare eval):** token med lengde-enhet + driver-kontekst i absolutt form blokkeres av valideringen (arver `absoluteCarryTrusted=false`); ratio/grader/relativ form er lovlig.

## 2. Godkjent kunnskapskorpus (sannhetsgrunnlag, krav-punkt 2/3)

| Korpus | Kilde | Eier | Entitlement | Oppdateringsregel |
|---|---|---|---|---|
| Engine-tabeller | `design/mocks/candidates/data/*.json` (solveFlight-genererte; tre bestod vakt) | Fysikkmotor via generatorskript | free | Re-genereres når motoren flyttes; **katalog-invalidasjon:** endres en celleverdi, invalideres alle katalogsvar/`NumToken` som binder til cellen (versjonssjekk ved bygg) |
| Leksjonsinnhold | `academy-*-content.js` (13+1 opplevelser, engine-verifiserte fixtures) | Academy-kurrikulum | **per stykke: free/pro** — følger Academy-gatingen (fri tier vs Pro-dybde, eiervalg i monetization-strategy) | Følger Academy-akseptanse; Ask refererer versjon |
| Begrepsark | `CONCEPT_SHEETS` per opplevelse | Academy | free | Samme |
| Diagnose-bånd | `diagnose-map-v2.json` `meta.bands` + v3-verdilinjer | Diagnose-harness | free | Kun via harness-regenerering |
| Eksterne benchmarks | TrackMan-definisjoner/tour-tall allerede sitert i Academy | Kuratert liste med kilde+dato | per stykke | Manuell, eier-godkjent per tillegg |
| Fast spørsmålskatalog | NY: `ask-catalog.json` (spørsmål → AskAnswer, håndskrevet) | Dette arbeidsområdet → produkt | free | Eier-godkjent per release; evalsettet (11) er regresjonstest |

LLM-svar kan **kun** sitere disse. Et spørsmål uten dekning i korpuset får ærlig «cannot determine»-svar med nærmeste deeplink (aldri gjetning).

**Entitlement-regelen (lekkasjevern):** et gratis Ask-svar kan kun groundes i `entitlement: free`-stykker. Krever spørsmålet Pro-gatet grounding, får gratisbrukeren et ærlig kort svar over fritt innhold + deeplink til Pro-gaten («The full answer lives in the {lesson} deep dive — part of Pro») — som selv er et moment-of-intent. Ask skal aldri reformulere gatet innhold gratis.

## 3. Routing: deterministisk forrang

```
Spørsmål
  │ 1. Intent-match mot fast katalog (lokal: normalisering + synonymliste
  │    + fuzzy match; INGEN modell nødvendig)
  │    · Terskelregel: match-score over øvre terskel → svar direkte.
  │      I tvetydighetssonen (mellom tersklene, eller antonym-kollisjon
  │      «more/less», «higher/lower» detektert) vises KANDIDATSPØRSMÅLET
  │      («Did you mean: How do I get less spin?») — aldri svaret rett ut.
  │      Under nedre terskel → videre. Terskler kalibreres mot evalsettets
  │      nær-treff-seksjon (11 §2b) før lansering.
  ├─ treff ────────────────────────► katalogsvar (AskAnswer, source_mode:
  │                                  deterministic, 0 LLM-kostnad, funker offline)
  ├─ 2. Klassifisering (separat, billig kall — IKKE samme kall som formulerer
  │    svaret; klassifikatoren tjener ikke på å svare) → intent_class
  ├─ diagnose-intensjon ───────────► fast svar som ruter til Diagnose-intervjuet
  ├─ utenfor domene ───────────────► fast avvisning, uten kvotetrekk (gjelder
  │                                  også når klassifiseringskallet fanget den;
  │                                  klassifiseringskall er en driftskostnad,
  │                                  ikke brukerens kvote — se 07 §4)
  └─ 3. ellers, hvis samtykke + kvote ► formulerings-LLM: fyll AskAnswer-feltene
                                     fra tildelte korpus-utdrag (RAG over §2);
                                     intent_class og cannot_say-krav er allerede
                                     satt av steg 2; validering mot §1 + §5;
                                     deeplink kun fra §4-registeret
       └─ validering feiler / timeout (≤5 s) / offline ─► fallback: nærmeste
                                     katalogsvar eller ærlig "cannot answer right
                                     now" + deeplink; kvote trekkes ALDRI for
                                     feilede svar
```

LLM-ens tre lovlige jobber: (a) klassifisere fritt formulerte spørsmål (eget kall), (b) formulere svaret i naturlig språk **over** kuraterte utdrag, (c) foreslå riktig deeplink fra registeret. Alt annet er ulovlig og fanges av valideringen.

**Flertur-semantikk (Modell A-oppfølging):** en tråd = spørsmål + én oppfølging. Oppfølgingskallet sender kun forrige AskAnswer (strukturert) + oppfølgingsteksten — aldri fri samtalehistorikk. Oppfølgingen re-klassifiseres i steg 2; drift mot `diagnose` fanges der (jf. regel 5).

## 4. Deeplink-register (verifisert mot systemvirkelighet 2026-08-05)

Kun mål i dette registeret er lovlige `action`-verdier. Kolonnen «Status» skiller det som virker i dag fra det som krever et navngitt gap (02 §5).

| ID | Mål | URL/rute | Status |
|---|---|---|---|
| `academy.home` | Academy-forsiden | `academy.html#/academy` | ✅ i dag |
| `academy.exp.{id}` | Én av 14 opplevelser | `academy.html#/experience/{id}` | ✅ i dag |
| `academy.concept.{conceptId}` | Opplevelse med riktig begrepsark åpnet (24 legacy-ID-er) | `academy.html#/lesson/{conceptId}` | ✅ i dag (mest presise form) |
| `academy.exp.{id}.surface.{n}` | Bestemt surface | `academy.html#/experience/{id}/surface/{n}` | ⚠️ kun pålitelig for `backspin` og `plane-coupling-lab` (G4) — brukes ikke av Ask i v1 |
| `range.open` | Range/ballflukt | `impact.html` | ✅ i dag |
| `range.preset` | Range med forhåndsvalgte verdier | `impact.html` + `sa.handoff.delivery` (v1-skjema, allerede definert av Diagnose §2.4) | ⛔ krever G1 (~12-linjers konsument) |
| `lab.geometry` | Geometry 3D | `geometry.html` | ✅ i dag |
| `table.{id}` | Kuratert tabell (`face-path-outcome-matrix`, `curve-gearing-by-loft`, `apex-window-equal-carry`) | Sheet i Ask-flaten | ⛔ krever G3 (visningsflate) |
| `diagnose.start` | Diagnose-intervjuet | (rute settes når Diagnose shippes) | ⛔ krever G2 |

**Uttømmende ID-lister (allowlist implementeres ordrett herfra; kilde `academy-curriculum.js:17-35`):**
- 14 experience-ID-er: `start-line`, `shape`, `shot-pattern`, `attack-at-impact`, `low-point`, `strike-depth`, `delivered-loft-launch`, `backspin`, `flight-height-descent`, `speed-transfer`, `carry`, `air-density`, `wind`, `plane-coupling-lab`.
- 24 concept-ID-er (eier i parentes): `face-angle`, `club-path`, `start-direction` (start-line); `spin-axis`, `curve` (shape); `offline` (shot-pattern); `attack-angle` (attack-at-impact); `low-point` (low-point); `strike-depth` (strike-depth); `dynamic-loft`, `launch-angle` (delivered-loft-launch); `spin-loft`, `backspin` (backspin); `apex`, `landing-angle` (flight-height-descent); `club-speed`, `smash`, `ball-speed` (speed-transfer); `carry`, `total` (carry); `altitude`, `temperature` (air-density); `wind` (wind); `plane-coupling` (plane-coupling-lab).
- **Stabilitetsrisiko (logget i 08):** `#/lesson/`-ruten er merket *legacy* i koden. Ask sin avhengighet gjør at ruten må anses som kontrakt; alternativt innføres en kanonisk concept-parameter (liten Academy-endring, eiervalg).

**Provenance-regel for `range.preset` (når G1 lukkes):** verdier Ask presetter er kuraterte eksempelverdier, ikke brukerens — Range-flaten må merke dem («Example delivery — not yours») til forskjell fra Diagnose-handoffens speed-matchede representant. Uten merkingen er `range.preset` ikke lovlig som `action`.

Eksempel, eierens case: «How do I get less spin with my driver?» → kort svar med **to** årsaksledd — spin loft (delivered loft − attack) *og* treffhøyde på driverflaten (vertikal gear-effekt er den vanligste virkelige kilden til høy driverspinn) — pluss vindu-forbeholdet (for lite spinn og ballen faller ut av luften) → `cannot_say`: «Flightglass doesn't measure your swing or where you strike the face» → `action: academy.concept.spin-loft` (`academy.html#/lesson/spin-loft`, åpner Backspin-opplevelsen med spin-loft-arket). Fungerer i shippet kode i dag.

## 5. Håndhevelse — mekanisme↔regel-tabell (ærlig merket)

Board-krav: for hver kontraktregel, hvilken sjekk håndhever den — og ærlig merking der håndhevelsen ikke er strukturell. Valideringsfeil gir alltid deterministisk fallback; rå LLM-tekst når aldri brukeren, og kvote trekkes aldri for feilede svar.

| Regel | Håndhevelse | Klasse |
|---|---|---|
| Skjema (alle felt, `cannot_say` per klasse) | JSON-skjemavalidering; klassen kommer fra separat klassifiseringskall | **Strukturell** |
| Tall-regelen | Tall kun som `NumToken`; prosa skannes for sifre OG normaliserte tallord/relative kvanta; hvert token binder til navngitt celle/fixture-ID; usporbart → fallback | **Strukturell** |
| Register per tall | Render-laget typograferer fra token-registeret; LLM kan ikke velge register | **Strukturell** |
| Driver-yardage (regel 7) | Runtime-blokk: lengde-enhet + driver-kontekst + absoluttform | **Strukturell** |
| Deeplink-allowlist | `action.id` mot uttømmende register; URL bygges av registeret | **Strukturell** |
| Entitlement-lekkasje | Grounding-stykker bærer entitlement; gratis svar med pro-stykke → fallback | **Strukturell** |
| Sitat-spenn (causal chain) | `quote` substring-valideres mot tildelt korpusutdrag | **Strukturell for sitatet**; at parafrasen (`text`) følger av sitatet er **eval-håndhevet** (11), ikke strukturelt |
| Diagnose-grensen | Klassifisering i separat kall + re-klassifisering per oppfølging + F1-mønsterliste | **Delvis strukturell**; semantisk drift er **eval-håndhevet** (11 §2a/2c) |
| «Ingen råd forkledd som måling» | Mønsterliste (F7 m.fl.) + eval | **Eval-håndhevet** |
| Kausal sannhet i fri prosa | Sitat-spenn begrenser; resten | **Eval-håndhevet** — dette er grensen for hva struktur kan garantere, og derfor er evalsettet (11) en release-gate, ikke dokumentasjon |

- Prompt-injection-flaten begrenses av at brukertekst aldri kan endre korpus, register, klassifisering (eget kall) eller kontrakt — bare feltinnhold som valideres.
- **Deterministisk feiltreff er også en sannhetsrisiko:** katalog-nær-treff (antonymer) håndteres av terskel-/tvetydighetsregelen i §3 og stresstestes i 11 §2b.

## 6. UI-plassering (innganger; ikke ny fane)

Per masterprompt-kontrakten, detaljeres i prototypen (12):
- **v1-innganger: Range/Outcome/Lab og Academy.** Range m.fl.: kontekstuelt spørsmål som starter med aktiv modell / nylige eksplisitte input; kontekst deles kun etter tydelig signal — signalet er en synlig, avkryssbar chip i sheetet («Include current shot: face +2.0° …») som kan fjernes før sending. Academy: «Ask about this» på begrepsnivå — verdien over begrepsarket er *kryssende* spørsmål («how does this interact with X?») og deeplink videre; arket forblir førstevalget for rene definisjoner.
- **Home-inngangen er UTSATT** (board P1-5): Fase 1 «Floodlights/Night Ladder»-Home er en låst diegetisk verden med egne exit-bevis, og masthead-`?` (→ Academy) er allerede en spørsmåls-affordance. Beslutning om Home-inngang (inkl. `?`-lenkens skjebne) tas etter at Ask-prototypen er validert — eget punkt i 08 (O10).
- **Sheet-arkitektur:** Ask åpner som ett-nivås bottom sheet over gjeldende flate; alt sekundært innhold (tabeller, sekundærlenker, oppfølging) vises **in-place i samme sheet** (push/pop med tilbake-affordance). **Sheet-stacking er eksplisitt forbudt.** Primærhandlingens deeplink er full navigasjon; ved retur gjenåpnes sheetet med svaret og oppfølgingsfeltet intakt (trådens levetid = økten), slik at gratis-oppfølgingen faktisk er oppnåelig.
- **Tilgjengelighet (bindende for prototype og implementering):** fokusfelle i sheet med retur til utløsende element ved lukking; `aria-live="polite"`-region for svar, feil, offline-linje og kvoteendring; `aria-busy`/synlig ventestatus frem til svar eller timeout (≤5 s); fokus flyttes til svarets start ved levering; reduced motion: sheet uten slide/innfasing, innhold vises direkte; tastaturparitet for chip, forslag og push/pop; 44 px-mål; teller-tall i mono/tabulær (lov 11).
- Aldri persistent boble, aldri chrome som konkurrerer med modellen.
