# Full Flightglass-revisjon — 02 Baseline: funksjonsmatrise, IA og gjeld

**Metode:** Uavhengig kartleggingsagent, systemvirkelighet med fil:linje (rådata i agentrapport; nøkkelreferanser beholdt her). Shipping-allowlist: 7 filer (`scripts/copy-web.mjs:33-41`). Merk: Vercel-web serverer repo-roten, så mocker er *nåbare via URL* på web, men ikke lenket fra shippet kode — med ett unntak (Strike Window-dødlenken).

## 1. Funksjonsmatrise (kondensert; hver rad verifisert)

| Flate | Jobb | Sannhetskilde | Gratis/Pro i praksis | Kjent friksjon/gjeld |
|---|---|---|---|---|
| **Home** (`index.html`) | Velge destinasjon; «siste økt» | Statisk + localStorage-lesing | Fri | Flisene leser `sa.stat.flight/geometry/outcome` som **ingen shippet kode skriver** → Range/Lab/Outcome-verdier er permanent demo; «Continue» kan reelt kun trigges av Academy-XP |
| **Range** (`impact.html`) | Live eksperiment: input → ballflukt | **Ekte motor** (`solveFlight` via `impact-outcome.js`) | Helt fri (ingen gate-import, tross sa-shots' egen kontrakt) | Tar ikke imot tilstand (hardkodet start `impact.html:310-316`); skriver ingenting tilbake; ghosts in-memory 3 FIFO, tapes ved navigasjon |
| **Visualise** | (Range-linse per §6) | — | — | **Finnes ikke shippet** — kun mocker |
| **Outcome** | Read-only-forklaring | — | — | **Inert**: flisen → `impact.html?play=1` som ignoreres; funksjonen bor de facto i Ranges FLIGHT-panel («OUTCOME · READ», `impact.html:292`) |
| **Compare/Ghosts** | Deltaer mot referanse | Samme motor (frosne pins) | Fri | Ingen identitet/Δ-verdier/toggle; eldste pin kastes stille; `PLAN-ghost-comparison-lab.md` er skrevet mot en eldre impact.html (stale) |
| **Geometry 3D** (`geometry.html`) | Romlig leveringsgeometri | **Ekte motor** (`swing-parameters-and-impact.js`) | **Eneste gatede flate**: native, etter 10 geometry-svinger (`:1602`); av på web | Skriver `sa.geo.shared` (kun mock leser) + `sa_swing` (ingen leser); «View in 2D» (`:466`) → **død lenke i native** |
| **Strike Window 2D** | Kontaktdiagnose | (mock-side, samme motor) | — | Ikke shippet; lenket FRA shippet Geometry — garantert brutt sti |
| **Impact Studio** (`impact-studio.html`) | Årsak→virkning for strike (samme 4 parametre som Geometry + kontaktsone-mikroskop) | **Samme motor som Geometry**; ingen solveFlight/carry | Helt fri | **Shippet uten plass i låst IA** (§6 nevner den ikke); okkuperer både Geometry- og Strike Window-eierskap; **låser aldri landskap selv** — kan stå fast i rotate-gate på native (UNVERIFISERT på enhet, men låsekallet mangler beviselig) |
| **Academy** (oversikt + 13+1 opplevelser) | Paced læring + mestring | Motor-verifiserte fixtures; XP i `strikearc.academy.v1` | Helt fri (ingen gating i Academy) | Eneste flate Home faktisk leser tilstand fra; surface-deeplink upålitelig (2/14 renderere, gap G4) |
| **Diagnose** | Coach-intervju → reveal | `diagnose-engine-v2.js` | — | Ushippet mock; handoffs uten konsument (G2) |
| **Paywall** (`sa-paywall.js`) | Kjøpe Pro (99/590) | RevenueCat `pro` | Vises aldri på web; native kun via Geometry-gaten | «10 skudd totalt»-designet er reelt en ren Geometry-gate; Range/Studio/Academy permanent gratis |
| **Ask** | Spørsmål → svar → deeplink | Kuratert korpus (spec) | Tiltenkt eksisterende `pro`-kjede | Kun spec (`../ask-flightglass/`); avhenger av G1–G5 |

## 2. IA-kart (stjerne-topologi)

```
Home (portrett)
├─▶ RANGE (portrett) ── eneste utvei ← Home; ingen sidevei til Lab/Studio/Academy; lagrer intet
├─▶ OUTCOME-flis ──▶ impact.html?play=1  ⚠ INERT (samme skjerm som Range)
├─▶ LAB/Geometry (tvinger LANDSKAP) ─ «View in 2D» ⚠ DØD i native ─ native&gt;10 svinger ▶ PAYWALL
│                                     └ skriver sa.geo.shared/sa_swing ⚠ ENVEIS
├─▶ IMPACT STUDIO (vil ha landskap, låser aldri) ⚠ mulig fast rotate-gate
├─▶ ACADEMY (portrett, hash-SPA; XP = eneste signal tilbake til Home)
└─▶ «?» ──▶ Academy  (hjelp = læring; ingen søk/Ask finnes)

Ikke nåbart fra shippet kode: Diagnose, Visualise, Strike Window (dead-linket), *-glass.
Døde/enveis kontrakter: ?play=1 · sa_swing · sa.geo.shared (halv) · sa.stat.*-lesing · Diagnose-handoffs.
Ingen harde feller (alle flater har hjem-vei), men ALT går via Home — ingen sidestier.
Orienteringskarusell: Home/Range/Academy portrett-låst, Geometry landskaps-låst, Studio udefinert.
```

## 3. Ownership-avvik mot masterplanens §6

Masterplanens tre territorier er shippet som **fem Home-fliser der én er blindvei (Outcome) og én er utenfor plan (Impact Studio)**:
- Visualise: finnes ikke. Outcome: ingen egen flate. Compare: ingen deltaer/identitet. Strike Window: kun mock, dead-linket fra shippet kode.
- Impact Studio: shippet med egen flis, samme motor og samme fire parametre som Geometry (`impact-studio.html:285-288` vs `geometry.html:531-535`) + strike-mikroskop → okkuperer to §6-eierskap uten mandat. Eneste dok: `docs/impact-studio-designvurdering.md`.

## 4. Behold / endre / slå sammen / fjern (faktabaserte kandidater; endelig dom i fase C/D)

| Flate | Kandidat | Faktagrunnlag |
|---|---|---|
| Home | **Endre** | Inert Outcome-flis; demo-verdier pga. uskrevne nøkler; `?` er en skjult Academy-lenke |
| Range | **Behold + endre** | Eneste ballflukt-eier; mangler tilstandsinntak (G1, allerede spesifisert som ~12-linjers commit) og skriver aldri `sa.stat.flight` |
| Outcome | **Slå sammen eller gi ekte flate** | Funksjonen finnes i Ranges FLIGHT-panel; kjerneløftet («see why it flew») mangler eierflate — strukturvalg for eier (FR-O5) |
| Compare/Ghosts | **Endre** | Data finnes (frosne pins); UI-laget mangler; plan må reskrives |
| Geometry ↔ Impact Studio | **Slå sammen eller differensier** | Samme motor + parametre; asymmetrisk orientering; to strike-mikroskop |
| Strike Window | **Ship eller fjern lenken** | Garantert død lenke i dag |
| Diagnose | **Ship eller arkiver** | Reell motor (v2/v3), ulenket mock, konsumentløse handoffs |
| Paywall/gate | **Endre** | Forretningsdesignet håndheves kun på Geometry native |
| Ask | **Kandidat inn i valgt retning** | Board-revidert spec; avhenger av G1–G5 |

## 5. Nav-inventar (shippet)

Komplett elementliste med fil:linje i agentens rådata; hovedbildet: hver flate har egen hjemvei-variant (masthead, `ts-back`, hjem-logo, modnav) — **fire ulike tilbakevei-grammatikker** for fem flater; `.sa-strip`-kontrakten etterleves av én. Rotasjonslåser: `lockPortrait()` ×3, `lockLandscape()` ×1, Studio ingen.

## 6. UNVERIFISERT

(1) Studio-rotate-gaten på fysisk enhet; (2) om `?play=1` var koblet i eldre impact.html; (3) Home-XP-terskellisten vs Academys `levelInfo` (dobbeltimplementert, ikke diffet).
