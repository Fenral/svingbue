import test from 'node:test';
import assert from 'node:assert/strict';
import { solveFlight } from '../impact-flight.js';

/* Beregnet impact-spinn erstatter den fittede magnituden.
   Før fiksen kom total spinn fra spinLoft·ballSpeed·spinK med et gulv på
   1500 rpm. For driver traff den gulvet (1500 rpm), som er ufysisk lavt og
   underdrev kurven. Nå kommer magnituden fra centeredImpactSpin (Penner
   rulling-ved-separasjon) med én eksponert kalibrering per kølle.
   Geometri, akse, carry/apex/launch/smash og aero er uendret. */

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

test('7-jern-ankeret er bevart innenfor ±150 rpm (spinCal-forankring)', () => {
  const r = solveFlight(IRON);
  assert.ok(Math.abs(r.backspin - 6793.9) <= 150,
    `nøytral 7-jern backspin ${r.backspin.toFixed(1)} skal ligge innenfor 150 rpm av 6793.9`);
});

test('driver får fysisk spinn — ikke det gamle 1500-gulvet', () => {
  const r = solveFlight(DRIVER);
  assert.ok(r.totalSpinRpm >= 2000 && r.totalSpinRpm <= 2600,
    `driver totalSpin ${r.totalSpinRpm.toFixed(1)} skal ligge i [2000, 2600]`);
  assert.ok(r.backspin > 1600, `driver backspin ${r.backspin.toFixed(1)} skal ikke sitte på det gamle gulvet`);
});

test('driver bøyer nå mer enn hybrid ved samme face-to-path', () => {
  const d = solveFlight(DRIVER);
  const h = solveFlight(HYBRID);
  const curveRatio = Math.abs(d.curve) / Math.abs(h.curve);
  const tiltRatio = Math.abs(d.spinAxis) / Math.abs(h.spinAxis);
  const sideRatio = Math.abs(d.rightCurveSpinRpm) / Math.abs(h.rightCurveSpinRpm);

  // Driveren bøyer nå MER enn hybriden; med fittet spinn bøyde den mindre (0.86).
  assert.ok(curveRatio > 1, `driver skal bøye mer enn hybrid (forhold ${curveRatio.toFixed(2)})`);
  assert.ok(curveRatio >= 1.3, `kurve-forhold ${curveRatio.toFixed(2)} skal være ≥ 1.3 (var 0.86 med fittet spinn)`);

  // MEKANISMEN, pinnet så en framtidig regresjon fanges: kurven drives av
  // SIDESPINN = total · sin(tilt), ikke av tilt alene. Driverens ~2.5× høyere
  // tilt kanselleres nesten av dens ~0.43× lavere totalspinn, så sidespinnet er
  // nesten likt. Resten av kurveforskjellen kommer av lengre flytid.
  // Derfor er et forhold på 1.8 IKKE oppnåelig uten å blåse opp driverspinnet
  // til ~3800 rpm (ufysisk) eller innføre en driver-spesifikk fudge.
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
