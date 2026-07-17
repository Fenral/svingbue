// EIERORDRE 2026-07-17 — «køllebladet skal hvile DER det treffer»:
// restTheta(state) er svingens hvile-/sluttpunkt. Duff/Fat med reell
// bakkekryssing → −θ0 (bladet i bakkenivå, FØR ballen); ellers
// thetaAtImpact (bladet ved ball-x — kontakthøyden synes på bladet,
// Whiff henger over ballen). Rene funksjoner, node --test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  RADIUS, arcPosition, thetaAtImpact, strikeQuality,
} from '../swing-parameters-and-impact.js';
import { lowXForUiLow } from '../geometry-controller.js';
import { groundCrossingTheta0, restTheta } from '../geo3d/groundcontact.js';

// state builder in UI domain (samme som geometry-p1.test.mjs): plane°, dir°,
// uiLow cm, arc cm.
const st = (plane, dir, uiLow, arcCm = 0) => {
  const s = { view: 'face', radius: RADIUS, planeAngle: plane, swingDirection: dir, lowPoint: { x: 0, y: 0, z: arcCm / 100 } };
  s.lowPoint.x = lowXForUiLow(uiLow, s);
  return s;
};

test('1: Duff/Fat (arc < 0, reell kryssing) — hvile i bakkenivå FØR ballen', () => {
  for (const [uiLow, arcCm] of [[0, -8], [5, -4], [-6, -3]]) {
    const s = st(60, 0, uiLow, arcCm);
    assert.ok(groundCrossingTheta0(s) !== null, `forventet reell kryssing ved arc=${arcCm}`);
    const rt = restTheta(s);
    const p = arcPosition(rt, s);
    assert.ok(Math.abs(p.z) < 1e-9, `hvile-z=${p.z} skal være bakkenivå (arc=${arcCm})`);
    assert.ok(p.x < 0, `hvile-x=${p.x} skal ligge FØR ballen (arc=${arcCm})`);
    assert.ok(rt < thetaAtImpact(s), 'kryssingen skal komme tidligere i nedsvinget enn ball-x');
  }
});

test('2: Pure/Thin/Whiff (ingen kryssing) — hvile ved ball-x', () => {
  for (const [uiLow, arcCm] of [[5, 0], [0, 1.6], [-15, 5]]) {
    const s = st(60, 0, uiLow, arcCm);
    assert.equal(groundCrossingTheta0(s), null);
    assert.equal(restTheta(s), thetaAtImpact(s));
  }
});

test('3: banddekning — Duff/Fat står i bakken, Whiff henger over ballen', () => {
  const duff = st(60, 0, 0, -8);
  assert.ok(['Duff', 'Fat'].includes(strikeQuality(duff).band));
  assert.ok(Math.abs(arcPosition(restTheta(duff), duff).z) < 1e-9);

  const whiff = st(60, 0, -15, 5);
  assert.equal(strikeQuality(whiff).band, 'Whiff');
  const p = arcPosition(restTheta(whiff), whiff);
  assert.ok(p.z > 0, `Whiff-hvile-z=${p.z} skal ligge over bakken ved ball-x`);
});

test('4: fallback — lp.z < 0 uten reell kryssing gir thetaAtImpact', () => {
  // konstruert: dyp bue på nesten flatt plan → cosθ0 utenfor [−1,1]
  const s = { view: 'face', radius: RADIUS, planeAngle: 60, swingDirection: 0, lowPoint: { x: 0, y: 0, z: -2 * RADIUS * Math.sin(Math.PI / 3) - 0.01 } };
  assert.equal(groundCrossingTheta0(s), null);
  assert.equal(restTheta(s), thetaAtImpact(s));
});
