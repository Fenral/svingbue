import test from 'node:test';
import assert from 'node:assert/strict';
import { solveFlight } from '../impact-flight.js';

/* Beregnet impact-spinn erstatter den fittede magnituden.
   Før fiksen kom total spinn fra spinLoft·ballSpeed·spinK med et gulv på
   1500 rpm. For driver traff den gulvet (1500 rpm), som er ufysisk lavt og
   underdrev kurven. Nå kommer magnituden fra centeredImpactSpin (Penner
   rulling-ved-separasjon) med en eksponert, glatt bag-kalibrering basert på
   vertikalt spin loft. 3-D-geometri, akse og aero er uendret. */

const IRON = { clubSpeed: 100, dynamicLoft: 25, attackAngle: -3, faceAngle: 0, clubPath: 0, club: '7iron' };
const DRIVER = { clubSpeed: 100, dynamicLoft: 11, attackAngle: 1, faceAngle: 3, clubPath: 0, club: 'driver' };
// Hybrid valgt så D-plan-tilten treffer ordrens geometri (~2.4–2.5× driverens).
const HYBRID = { clubSpeed: 100, dynamicLoft: 22, attackAngle: -3, faceAngle: 3, clubPath: 0, club: '7iron' };

test('nøytral levering beholder de beskyttede invariantene', () => {
  const r = solveFlight(IRON);
  assert.ok(Math.abs(r.spinLoft - (IRON.dynamicLoft - IRON.attackAngle)) < 1e-9,
    'spinLoft = dynamicLoft − attack ved face=path=0');
  assert.ok(Math.abs(r.spinAxis) < 1e-9, 'ingen tilt uten face-to-path');
  assert.ok(Math.abs(r.curve) < 1e-9, 'ingen kurve uten face-to-path');
});

test('mid-iron delivery stays near the current TrackMan bag spin scale', () => {
  const r = solveFlight(IRON);
  // Official 2023 PGA 5-iron: 5,280 rpm at 96 mph club speed. Scale the
  // centered-impact reference to this fixture's 100 mph; ±300 rpm is 5.5%.
  const trackmanScaled = 5280 * IRON.clubSpeed / 96;
  assert.ok(Math.abs(r.backspin - trackmanScaled) <= 300,
    `mid-iron backspin ${r.backspin.toFixed(1)} skal ligge innen 300 rpm av ${trackmanScaled.toFixed(1)}`);
});

test('driver får fysisk spinn — ikke det gamle 1500-gulvet', () => {
  const r = solveFlight(DRIVER);
  // Scale official 2023 PGA Driver (2,545 rpm at 115 mph and the reference
  // 11.9° vertical gap) by speed and sin(spin loft), matching Penner's terms.
  const trackmanScaled = 2545 * (DRIVER.clubSpeed / 115) *
    Math.sin(r.spinLoft * Math.PI / 180) / Math.sin(11.9 * Math.PI / 180);
  assert.ok(Math.abs(r.totalSpinRpm - trackmanScaled) <= 200,
    `driver totalSpin ${r.totalSpinRpm.toFixed(1)} skal ligge innen 200 rpm av ${trackmanScaled.toFixed(1)}`);
  assert.ok(r.backspin > 1700, `driver backspin ${r.backspin.toFixed(1)} skal ikke sitte på det gamle gulvet`);
});

test('driver bøyer nå mer enn hybrid ved samme face-to-path', () => {
  const d = solveFlight(DRIVER);
  const h = solveFlight(HYBRID);
  const curveRatio = Math.abs(d.curve) / Math.abs(h.curve);
  const tiltRatio = Math.abs(d.spinAxis) / Math.abs(h.spinAxis);
  const sideRatio = Math.abs(d.rightCurveSpinRpm) / Math.abs(h.rightCurveSpinRpm);

  // Driveren bøyer nå MER enn hybriden; med fittet spinn bøyde den mindre.
  // Målt på bc68858 med nøyaktig disse fixturene: 0.9587 (se
  // outputs/engine-3d-tests/before-after-measurements.log §2).
  assert.ok(curveRatio > 1, `driver skal bøye mer enn hybrid (forhold ${curveRatio.toFixed(2)})`);
  assert.ok(curveRatio >= 1.3, `kurve-forhold ${curveRatio.toFixed(2)} skal være ≥ 1.3 (var 0.9587 med fittet spinn)`);

  // MEKANISMEN, pinnet så en framtidig regresjon fanges: kurven drives av
  // SIDESPINN (rightCurveSpinRpm ≈ total · sin(tilt)), ikke av tilt alene.
  // Med bag-rekalibreringen er mekanismen fortsatt synlig: tilt-forholdet er
  // 2.5185, totalspinn-forholdet 0.4197 og sidespinn-forholdet 1.0167. Målt
  // kurveforhold er 1.6612 = rå RK4-bøy 1.4583 × projeksjonsskala 1.1391.
  // Driveren flyr fortsatt kortere i RK4 (4.532 s mot 5.713 s), så dette er
  // ikke en skjult flytidsfudge. Projeksjonen er kompatibilitetslim, ikke fysikk.
  assert.ok(tiltRatio >= 2.3, `tilt-forhold ${tiltRatio.toFixed(2)} er ren D-plan-geometri og uendret av fiksen`);
  assert.ok(Math.abs(sideRatio - 1) < 0.25, `sidespinn-forhold ${sideRatio.toFixed(2)} — tilt og totalspinn kansellerer hverandre`);
  assert.ok(Math.abs(d.offline) < 30, `driver offline ${d.offline.toFixed(1)} yd skal holde seg fysisk`);
});

test('den fittede stien og 1500-gulvet er borte fra motorens utdata', () => {
  const r = solveFlight(IRON);
  for (const dead of ['spinK', 'minTotalSpinRpm', 'spinFloorFullAtDeg', 'spinFloorBlend', 'spinFloorAppliedRpm']) {
    assert.equal(r[dead], undefined, `${dead} skal ikke lenger eksponeres`);
  }
  assert.ok(r.spinCalibration > 0, 'kalibreringen skal være eksponert for revisjon');
});
