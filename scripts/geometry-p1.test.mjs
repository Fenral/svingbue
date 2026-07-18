// GEOMETRY P1 — kontraktstester (ordre §Unit-tester, korrigert av
// systemkontrakt-geometry.md §4 der de spriker: test 1 toleranse, test 8
// motor-terskel 1.4R, test 9 Fat ved low=−8). Rene funksjoner, node --test.
//
// ALLE tester skrives mot uiLow ≡ effectiveLpx-semantikken (kontrakt §3.1):
// «low» i en testtilstand er den VISTE verdien; stance-input regnes via
// lowXForUiLow().
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  RADIUS, deriveImpact, effectiveLpx, clubBallContact, strikeQuality,
  BALL_RADIUS_M, arcPosition,
} from '../swing-parameters-and-impact.js';
import {
  uiLowCm, lowXForUiLow, towPerDegM, clampUiLow, detentSnap,
  DETENT, CLUBS, UI_LOW_MAX_CM,
} from '../geometry-controller.js';
import { groundCrossingTheta0 } from '../geo3d/groundcontact.js';

// state builder in UI domain: plane°, dir°, uiLow cm, arc cm.
const st = (plane, dir, uiLow, arcCm = 0) => {
  const s = { view: 'face', radius: RADIUS, planeAngle: plane, swingDirection: dir, lowPoint: { x: 0, y: 0, z: arcCm / 100 } };
  s.lowPoint.x = lowXForUiLow(uiLow, s);
  return s;
};

// deterministic LCG so the "20 random states" are reproducible in CI.
const lcg = (seed => () => (seed = (seed * 48271) % 2147483647) / 2147483647)(20260717);
const rand = (lo, hi) => lo + (hi - lo) * lcg();

test('1: TrackMan-identitet attack = (dir − path)·tan(plane)', () => {
  // Kontrakt §4: ±0.1° over hele instrumentområdet er ubestålig for korrekt
  // 3D-motor (målt maks avvik 0.19°). VALGT OPSJON: toleranse ±0.25° over
  // FULLT domene (dir ±15°, uiLow ±15 cm, plane 45–75°) — identiteten er en
  // småvinkel-tilnærming, motoren vinner.
  for (let i = 0; i < 20; i++) {
    const s = st(rand(45, 75), rand(-15, 15), rand(-15, 15));
    const { attackAngle, clubPath } = deriveImpact(s);
    const ident = (s.swingDirection - clubPath) * Math.tan((s.planeAngle * Math.PI) / 180);
    assert.ok(Math.abs(attackAngle - ident) <= 0.25,
      `avvik ${(attackAngle - ident).toFixed(3)}° ved plane=${s.planeAngle.toFixed(1)} dir=${s.swingDirection.toFixed(1)}`);
  }
});

test('2: uiLow=0 ⇒ attack=0 og path=dir for plane ∈ {45,60,75}', () => {
  for (const plane of [45, 60, 75]) {
    for (const dir of [0, -7.5, 15]) {
      const s = st(plane, dir, 0);
      const { attackAngle, clubPath } = deriveImpact(s);
      assert.ok(Math.abs(attackAngle) < 1e-9, `attack=${attackAngle} plane=${plane} dir=${dir}`);
      assert.ok(Math.abs(clubPath - dir) < 1e-9, `path=${clubPath} dir=${dir}`);
    }
  }
});

test('3: plane-invarians ved uiLow=0 (45→75 endrer ikke attack/path ±0.05°)', () => {
  for (const dir of [0, 5, 15]) {
    const a = deriveImpact(st(45, dir, 0));
    const b = deriveImpact(st(75, dir, 0));
    assert.ok(Math.abs(a.attackAngle - b.attackAngle) <= 0.05);
    assert.ok(Math.abs(a.clubPath - b.clubPath) <= 0.05);
  }
});

test('4: plane-kobling ved uiLow=+8: |attack| øker og |path−dir| minker monotont', () => {
  const dir = 0;
  let prevAtk = -Infinity, prevPathDev = Infinity;
  for (const plane of [45, 50, 55, 60, 65, 70, 75]) {
    const { attackAngle, clubPath } = deriveImpact(st(plane, dir, 8));
    const atk = Math.abs(attackAngle), pathDev = Math.abs(clubPath - dir);
    assert.ok(atk > prevAtk, `|attack| ikke monotont økende ved plane=${plane}`);
    assert.ok(pathDev < prevPathDev, `|path−dir| ikke monotont minkende ved plane=${plane}`);
    prevAtk = atk; prevPathDev = pathDev;
  }
});

test('5: tauing Δ(uiLow)/ΔD = −k·cos(plane) ±2 % — målt mot motorens effectiveLpx', () => {
  for (const plane of [45, 60, 75]) {
    const base = { view: 'face', radius: RADIUS, planeAngle: plane, swingDirection: 0, lowPoint: { x: 0.05, y: 0, z: 0 } };
    const dD = 4;
    const before = effectiveLpx(base);
    const after = effectiveLpx({ ...base, swingDirection: base.swingDirection + dD });
    const measured = (after - before) / dD;            // m per grad
    const expected = -towPerDegM(plane);
    assert.ok(Math.abs(measured / expected - 1) <= 0.02,
      `plane=${plane}: målt ${measured.toExponential(3)} vs ${expected.toExponential(3)}`);
  }
});

test('6: clamp — tauing stopper på ±15 cm og rail flagges', () => {
  // dir-drag tauer uiLow forbi grensen → controlleren clamper og flagger rail;
  // stance reberegnes så effectiveLpx står eksakt på grensen (kontrakt §3.1).
  const s = st(45, 0, -12);           // nær nedre grense
  s.swingDirection = 10;              // tauer uiLow godt forbi −15
  const raw = uiLowCm(s);
  assert.ok(raw < -UI_LOW_MAX_CM, `forventet rå uiLow < −15, fikk ${raw.toFixed(2)}`);
  const { uiLow, railed } = clampUiLow(raw);
  assert.equal(uiLow, -15);
  assert.equal(railed, true);
  s.lowPoint.x = lowXForUiLow(uiLow, s);
  assert.ok(Math.abs(uiLowCm(s) - (-15)) < 1e-9, 'stance-reberegning må lande eksakt på railen');
  // innenfor grensen: ingen rail
  assert.equal(clampUiLow(3.2).railed, false);
});

test('7: fat-predikat — bakkekontakt-x < ball-x ⇒ Fat (arc<0, tre punkter)', () => {
  for (const [uiLow, arcCm] of [[-5, -1], [-8, -0.5], [-3, -1.5]]) {
    const s = st(60, 0, uiLow, arcCm);
    const theta0 = groundCrossingTheta0(s);
    assert.ok(theta0 != null, `arc<0 må gi bakkekontakt (uiLow=${uiLow}, arc=${arcCm})`);
    const entry = arcPosition(-theta0, s);
    assert.ok(entry.x < 0, `kontakt-x ${entry.x.toFixed(3)} må være før ballen (x=0)`);
    const band = strikeQuality(s).band;
    assert.ok(band === 'Fat' || band === 'Duff', `forventet Fat/Duff, fikk ${band}`);
  }
});

test('8: whiff-predikat — motorens terskel clubZ > 1.4·BALL_RADIUS (kontrakt §4)', () => {
  // Kontrakt: motoren bruker 1.4R (ikke balltopp 2.0R); 1.4R–2.0R er Thin.
  // uiLow=0 ⇒ θ=0 ⇒ clubZ = lowPoint.z, så grensen kan testes direkte.
  const at = z => { const s = st(60, 0, 0, z * 100); return strikeQuality(s); };
  const R = BALL_RADIUS_M;
  assert.equal(at(1.4 * R + 1e-4).band, 'Whiff', 'like over 1.4R ⇒ Whiff');
  assert.equal(at(1.4 * R - 1e-4).band, 'Thin', 'like under 1.4R ⇒ Thin (bladed)');
  assert.ok(Math.abs(clubBallContact(st(60, 0, 0, 3)).clubZ - 0.03) < 1e-9);
});

test('9: verdikt jern — low=+5/arc=0 ⇒ Pure; low=−8 ⇒ Fat (kontrakt §4); whiff overstyrer', () => {
  assert.equal(strikeQuality(st(60, 0, 5, 0)).band, 'Pure');
  // Ordren sa Thin; kontrakten §4 korrigerer: xLP<0 i Pure-høydebåndet ⇒
  // «Fat — ground-first tendency». Motoren vinner.
  assert.equal(strikeQuality(st(60, 0, -8, 0)).band, 'Fat');
  // whiff overstyrer alt: samme low=−8 men clubZ løftet over 1.4R
  assert.equal(strikeQuality(st(60, 0, -8, 4)).band, 'Whiff');
});

test('10: 0-detent — verdier innenfor vinduet snapper til eksakt 0', () => {
  assert.equal(detentSnap(0.35, DETENT.dir), 0);
  assert.equal(detentSnap(-0.35, DETENT.dir), 0);
  assert.equal(detentSnap(0.36, DETENT.dir), 0.36);
  assert.equal(detentSnap(0.9, DETENT.low), 0);
  assert.equal(detentSnap(-1.0, DETENT.low), -1.0);
  assert.equal(detentSnap(0.3, DETENT.arc), 0);
  assert.equal(detentSnap(0.31, DETENT.arc), 0.31);
  // plane har ingen detent — selv 0 (utenfor range uansett) snapper ikke
  assert.equal(detentSnap(0.2, DETENT.plane), 0.2);
  // pure-sonen (jern) binder til motor-konstantene, ikke mockens +2..+10
  assert.deepEqual(CLUBS.iron.pureZoneCm, [2, 15]);
});
