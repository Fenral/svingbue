# WO-E-MOTOR · SPINLOFT → CARRY + CURVE (verifisert diff, klar til innlegging)

> Kjøres i fersk Claude Code-økt · modell: **Sonnet 4.6** · parallelt med S1 (disjunkte filer) · eskaler til Fable 5 kun etter to feilede forsøk
> Forberedelse før innliming: legg `driver-flight.mjs`, `acceptance-harness.mjs` og `impact-flight-E2-reference.js` inn i repoet under `engine/incoming/`

Fysikken er ferdig verifisert utenfor repo. Din jobb er innlegging + tester, ikke design. De tre filene ligger i repoet under `engine/incoming/`.

## Kontekst (les, ikke utforsk)
Dagens `impact-flight.js` har to dokumenterte hull:
1. **Carry** (linje ~149): `0.232·ballSpeed^1.389/(1+(ballSpeed/210)^6)` — kun ballhastighet. Spinn/launch inngår aldri. Ingen optimal-spinn-vindu eksisterer.
2. **Spinnakse** (linje ~135): `GAIN·faceToPath` — spin loft inngår ikke. Driver og wedge krummer identisk per grad face-to-path, som er feil (akse ≈ atan(sidespinn/backspinn) ⇒ tilt ∝ 1/spinLoft).

## E2 · Spinnakse (eksakt diff — allerede verifisert)
I `impact-flight.js`, erstatt:

    const spinAxis = clamp(SPIN_AXIS_GAIN * faceToPath, -AXIS_MAX, AXIS_MAX); // ESTIMATE

med:

    // engine-derived · ref:D-plane: axis ≈ atan(sidespin/backspin) ⇒ tilt per degree
    // of face-to-path scales ~1/spinLoft. Anchored at spinLoft 33 so the tuned
    // 7-iron reference axis is preserved exactly; low-loft clubs (driver) tilt more.
    const AXIS_REF_SPINLOFT = 33; // engine-derived (anchor)
    const axisGain = SPIN_AXIS_GAIN * (AXIS_REF_SPINLOFT / Math.max(8, spinLoft)); // engine-derived · ref:D-plane
    const spinAxis = clamp(axisGain * faceToPath, -AXIS_MAX, AXIS_MAX);

(`spinLoft` er deklarert før blokken. `Math.max(8, …)` beskytter mot liten/negativ spin loft.)

**Reproduser disse verifiserte resultatene:**
- Anker-regresjon: `{clubSpeed:70|85|95, dynamicLoft:33, attackAngle:0, faceAngle:2, clubPath:-1}` → `spinAxis` og `curve` identiske med før-verdi (4.500° ved disse leveransene).
- Driver-effekt: `{clubSpeed:100, dynamicLoft:12, attackAngle:0, faceAngle:3, clubPath:0}` → akse ≈ 12.4°, curve ≈ 43.6 yd (7-jern samme leveranse: 4.5° / 14.1 yd).
- 500-gate: forventninger som asserter akse ved spinLoft ≠ 33 oppdateres ∝ 33/spinLoft, med kommentar `engine-derived · ref:D-plane (E2)`. Ingen andre gate-endringer.

Diff-sjekk mot `engine/incoming/impact-flight-E2-reference.js`.

## E · Driver-carry fra flight-integrator
1. Flytt `driver-flight.mjs` inn i motorlaget (samme mappe som `impact-flight.js`). Ingen endringer i filen — konstantene er kalibrert mot TrackMan-referansen og kildetagget i filhodet.
2. `CLUBS`: legg til `driver`-preset med `smash: 1.48` /* ref:TrackMan */ og `spinK: 0.93` /* engine-derived — IKKE TODO-ens 0.6 */. 7-jern urørt.
3. Distance/Carry-flatene i Academy ruter driver-beregninger gjennom `solveDriverCarry({clubSpeed, dynamicLoft, attackAngle})` fra `driver-flight.mjs`. Én solve ≈ 0.1–0.3 ms — trygt synkront i input-stien; ikke bygg async-lag.
4. `acceptance-harness.mjs` inn i test-suiten som kjørbar sjekk.

**Reproduser (113 mph, attack 0):** loft 10° → 1 555 rpm / 6.2° / 198.8 yd · loft 14° → 2 177 / 8.7° / 254.7 · loft 18° → 2 800 / 11.2° / 271.3. Harness: 8/9 grønn; kjent avvik +178 rpm ved 125 mph — dokumenteres i modellgrense, lukkes i V1.1 med publiserte Cd/Cl-tabeller.

## Akseptanse (binær)
- [ ] E2-diff inne, anker-regresjon grønn (identiske verdier ved spinLoft 33)
- [ ] Driver akse 10–15° ved face 3/path 0 (kjør sjekken)
- [ ] 500-gate grønn med dokumenterte akse-oppdateringer
- [ ] `driver`-preset + `solveDriverCarry` ruter Distance-flatene; 7-jernsbane urørt
- [ ] Harness kjørbar i repo, 8/9 grønn, output vedlagt
- [ ] Modellgrense-tekst oppdatert: spinloft→carry og spinloft→akse nå `engine-derived`; 125 mph-avvik nevnt
- [ ] Demo: harness-output + skjermopptak av én Distance-flate + før/etter-kurve driver vs 7-jern

**STOPP etter rapport.**
