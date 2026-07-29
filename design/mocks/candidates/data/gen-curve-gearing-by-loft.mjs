// Genererer datatabellen "curve-gearing-by-loft" fra motoren.
// Rader = face-to-path gap, kolonner = delivered loft. Kjør: node <denne filen>
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { solveFlight } from '../../impact-flight.js';
import {
  centeredImpactGeometry, spinVectorFromTotalSpin, simulateFlight,
  premiumTourDragCoefficient, premiumTourLiftCoefficient,
  PREMIUM_TOUR_CLASS_AERO, FLIGHTGLASS_CURVE_CARRY_ANCHOR, YARD_TO_M,
} from '../../flightglass-3d-spin-model.js';

const GAPS = [2, 4, 6, 8];
const LOFTS = [12, 20, 28, 36, 44];
const FIXED = { attackAngle: -3, clubSpeed: 95 };

const r = (v, n = 1) => Math.round(v * 10 ** n) / 10 ** n;

// Replikerer solveFlight sin curve-pipeline med valgfri rpm, for å måle hvor mye
// 9000-taket krymper curve i høyloft-cellene. Ingen motorfil endres — kun eksporter.
function curveWithSpin(input, f, rpm) {
  const g = centeredImpactGeometry({ ...input });
  const spin = spinVectorFromTotalSpin(g, rpm, {
    launchElevationDeg: f.launchAngle, launchAzimuthDeg: f.startDirection,
  });
  const raw = simulateFlight({
    ballSpeedMph: f.ballSpeed,
    launchElevationDeg: f.launchAngle,
    launchAzimuthDeg: f.startDirection,
    spinVectorRadPerSec: spin.spinVectorRadPerSec,
    dt: FLIGHTGLASS_CURVE_CARRY_ANCHOR.integrationStepSeconds,
    maxTimeSeconds: 30,
    liftCoefficient: premiumTourLiftCoefficient,
    dragCoefficient: (re, s) =>
      premiumTourDragCoefficient(re, s) * FLIGHTGLASS_CURVE_CARRY_ANCHOR.dragScale,
    aerodynamicModel: {
      id: `${PREMIUM_TOUR_CLASS_AERO.id}+${FLIGHTGLASS_CURVE_CARRY_ANCHOR.id}`,
      reynoldsValidity: PREMIUM_TOUR_CLASS_AERO.reynoldsValidity,
      spinParameterValidity: PREMIUM_TOUR_CLASS_AERO.spinParameterValidity,
      reverseMagnusPolicy: PREMIUM_TOUR_CLASS_AERO.reverseMagnusPolicy,
    },
  });
  const scale = (f.carry * YARD_TO_M) / raw.downLaunchLineM;
  return (raw.curveFromLaunchLineM * scale) / YARD_TO_M;
}

const cells = {};
for (const gap of GAPS) {
  cells[gap] = {};
  for (const loft of LOFTS) {
    const f = solveFlight({
      faceAngle: gap / 2,
      clubPath: -gap / 2,
      dynamicLoft: loft,
      ...FIXED,
    });
    // domenegate = impact-outcome.js: signedVerticalSpinLoftDeg > 0
    const inDomain = f.signedVerticalSpinLoftDeg > 0;
    const spinClamped = f.spinRpmRaw > f.totalSpinRpm;
    const smashClamped = f.smashEff === 1.52 || f.smashEff === 1.15;
    cells[gap][loft] = {
      spinAxisDeg: r(f.spinAxis, 1),
      curveYd: r(f.curve, 1),
      // rå RK4-bøy FØR carry-projeksjonen — den ufittede Magnus-fysikken
      rawCurveYd: r(f.rawCurveFromLaunchLineM / 0.9144, 1),
      curveCarryProjectionScale: r(f.curveCarryProjectionScale, 4),
      startDirectionDeg: r(f.startDirection, 2),
      launchAngleDeg: r(f.launchAngle, 1),
      carryYd: r(f.carry, 1),
      offlineYd: r(f.offline, 1),
      backspinRpm: Math.round(f.backspin),
      totalSpinRpm: Math.round(f.totalSpinRpm),
      spinRpmRaw: Math.round(f.spinRpmRaw),
      spinLoftDeg: r(f.spinLoft, 1),
      smash: r(f.smashEff, 3),
      shape: f.shape,
      inDomain,
      spinClamped,
      smashClamped,
      aeroExtrapolated: f.aerodynamicDiagnostics.extrapolated,
    };
  }
}

const out = {
  id: 'curve-gearing-by-loft',
  title: 'Curve Gearing — Same Face-to-Path Gap, Different Loft',
  generatedAt: new Date().toISOString(),
  generator: 'outputs/agent-scan/gen-curve-gearing-by-loft.mjs',
  engine: 'impact-flight.js solveFlight (uendret)',
  sourceTag: 'CALCULATED (spinAxis = D-plane tilt, curve = RK4 Magnus, carry-projisert)',
  fixedInputs: { ...FIXED, note: 'faceAngle = +gap/2, clubPath = -gap/2 (høyre-fade-fortegn)' },
  rows: GAPS,
  cols: LOFTS,
  cells,
  outOfDomain: [],
  caveats: [],
  readingNotes: [
    'Kontrollert eksperiment, ikke en ekte bag: clubSpeed holdes på 95 mph for ALLE lofter ' +
      'for å isolere loft-effekten. En ekte spiller svinger PW (44°) ~20 mph saktere enn driver, ' +
      'så carry-raden er ikke en bag-distanse-tabell. Kun spinAxis/curve-kontrasten er poenget.',
    'spinAxis er ren D-plane-geometri (CALCULATED) og påvirkes ikke av spinn-taket. ' +
      'curve er RK4 Magnus med carry-projeksjon og påvirkes av taket i loft-44-kolonnen.',
    'Aero-konvolutt: cellene rapporterer aerodynamicDiagnostics.extrapolated per celle. ' +
      'Lavloft-kolonnene ligger innenfor PREMIUM_TOUR_CLASS_AERO, høyloft-kolonnene ekstrapolerer.',
    'VIKTIG: curve er IKKE ufittet fysikk. Den rå RK4-bøyen (rawCurveYd) skaleres per skudd med ' +
      'curveCarryProjectionScale = fittet carry / RK4-carry, og RK4-dragen kjører med ' +
      'FLIGHTGLASS_CURVE_CARRY_ANCHOR.dragScale. Skalaen varierer systematisk langs loft-raden ' +
      '(~1.20 ved loft 12, ~0.99 ved loft 44), så den forsterker loft-kontrasten. ' +
      'Kun spinAxis er ren, ufittet D-plane-geometri.',
  ],
};

for (const gap of GAPS) {
  for (const loft of LOFTS) {
    const c = cells[gap][loft];
    if (!c.inDomain) out.outOfDomain.push({ gap, loft, reason: 'spin-loft <= 0' });
    if (c.spinClamped) {
      const input = { faceAngle: gap / 2, clubPath: -gap / 2, dynamicLoft: loft, ...FIXED };
      const f = solveFlight(input);
      // replika-validering: samme rpm som motoren brukte må gi motorens curve
      assert.ok(
        Math.abs(curveWithSpin(input, f, f.totalSpinRpm) - f.curve) < 1e-6,
        `replika av curve-pipeline stemmer ikke for gap ${gap} loft ${loft}`,
      );
      const unclamped = curveWithSpin(input, f, f.spinRpmRaw);
      c.unclampedCurveYd = r(unclamped, 1);
      c.curveUnderstatementPct = r((unclamped / f.curve - 1) * 100, 1);
      out.caveats.push({
        gap, loft, kind: 'total-spin-clamped',
        detail: `spinRpmRaw ${c.spinRpmRaw} klemt til ${c.totalSpinRpm} (tak 9000 rpm); ` +
          `curve ${c.curveYd} yd er ${c.curveUnderstatementPct} % lavere enn uklemt (${c.unclampedCurveYd} yd). ` +
          `spinAxis er IKKE påvirket (ren geometri).`,
      });
    }
    if (c.smashClamped) out.caveats.push({ gap, loft, kind: 'smash-clamped', detail: `smash ${c.smash}` });
  }
}

const path = new URL('./tabell-curve-gearing-by-loft.json', import.meta.url);
writeFileSync(path, JSON.stringify(out, null, 2));

// konsoll-tabell
const pad = (s, n) => String(s).padStart(n);
console.log(`FIXED  attack ${FIXED.attackAngle}°  speed ${FIXED.clubSpeed} mph  face=+gap/2  path=-gap/2\n`);
console.log('spin axis (°) / curve (yd)');
console.log(pad('gap', 5) + LOFTS.map(l => pad(`L${l}`, 16)).join(''));
for (const gap of GAPS) {
  console.log(
    pad(`${gap}°`, 5) +
    LOFTS.map(l => {
      const c = cells[gap][l];
      return pad(`${c.spinAxisDeg.toFixed(1)}° / ${c.curveYd.toFixed(1)}${c.spinClamped ? '*' : ''}`, 16);
    }).join('')
  );
}
console.log('\ncarry (yd) / backspin (rpm, * = klemt på 9000)');
console.log(pad('gap', 5) + LOFTS.map(l => pad(`L${l}`, 16)).join(''));
for (const gap of GAPS) {
  console.log(
    pad(`${gap}°`, 5) +
    LOFTS.map(l => {
      const c = cells[gap][l];
      return pad(`${c.carryYd.toFixed(0)} / ${c.backspinRpm}${c.spinClamped ? '*' : ''}`, 16);
    }).join('')
  );
}
console.log('\nrå RK4-bøy (yd) FØR carry-projeksjon / projeksjonsskala');
console.log(pad('gap', 5) + LOFTS.map(l => pad(`L${l}`, 16)).join(''));
for (const gap of GAPS) {
  console.log(
    pad(`${gap}°`, 5) +
    LOFTS.map(l => {
      const c = cells[gap][l];
      return pad(`${c.rawCurveYd.toFixed(1)} / ×${c.curveCarryProjectionScale.toFixed(3)}`, 16);
    }).join('')
  );
}
console.log(`\nout-of-domain celler: ${out.outOfDomain.length}`);
console.log(`caveats: ${out.caveats.length}`);
for (const c of out.caveats) console.log(`  gap ${c.gap}° loft ${c.loft}°: ${c.kind} — ${c.detail}`);

// selvsjekk: motor-identiteter + monotonisitet i loft (gearing-påstanden tabellen finnes for)
for (const gap of GAPS) {
  for (const loft of LOFTS) {
    const c = cells[gap][loft];
    assert.ok(c.spinAxisDeg > 0 && c.curveYd > 0, `gap ${gap} loft ${loft}: forventet høyrekurve`);
  }
  const axes = LOFTS.map(l => cells[gap][l].spinAxisDeg);
  assert.deepEqual(axes, [...axes].sort((a, b) => b - a), `gap ${gap}: spin axis må falle med loft`);
}
console.log('\nselvsjekk OK: alle celler kurver høyre, spin axis faller monotont med loft.');
