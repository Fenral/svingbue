import test from 'node:test';
import assert from 'node:assert/strict';
import { fitZoom, gridStops } from '../impact-framing.js';

/* ── fitZoom: continuous shot-fit zoom factor ─────────────────────────────
   k > 1 zooms IN (short shots fill the frame), k < 1 zooms OUT (long shots
   stay framed). It must be monotonic in the shot's max distance and clamped
   so a wedge is not over-zoomed and a bomb does not fisheye. The concrete
   ref / min / max are tuned in impact.html, so the contract is asserted with
   explicit options where the numbers matter. */

test('fitZoom returns 1 at the reference distance', () => {
  assert.equal(fitZoom(200, { ref: 200, min: 0.4, max: 2 }), 1);
});

test('fitZoom zooms out for longer shots, in for shorter (monotonic)', () => {
  const dists = [80, 120, 160, 200, 240, 280, 320];
  const ks = dists.map(d => fitZoom(d, { ref: 200, min: 0.01, max: 100 }));
  for (let i = 1; i < ks.length; i++) {
    assert.ok(ks[i] <= ks[i - 1], `k must not increase as distance grows (${dists[i]}m)`);
  }
  assert.ok(fitZoom(120, { ref: 200, min: 0.01, max: 100 }) > 1, 'short shot zooms in');
  assert.ok(fitZoom(280, { ref: 200, min: 0.01, max: 100 }) < 1, 'long shot zooms out');
});

test('fitZoom clamps to [min, max]', () => {
  assert.equal(fitZoom(10, { ref: 200, min: 0.55, max: 1.35 }), 1.35, 'tiny shot clamps up');
  assert.equal(fitZoom(5000, { ref: 200, min: 0.55, max: 1.35 }), 0.55, 'huge shot clamps down');
  for (const d of [1, 50, 90, 130, 175, 210, 260, 300, 400, 1000]) {
    const k = fitZoom(d);
    assert.ok(k > 0 && Number.isFinite(k), `k is a positive finite number for ${d}m`);
  }
});

test('fitZoom never divides by zero on a zero/near-zero shot', () => {
  const k = fitZoom(0, { ref: 200, min: 0.55, max: 1.35 });
  assert.ok(Number.isFinite(k), 'k stays finite at maxDist 0');
  assert.equal(k, 1.35, 'a zero-length shot clamps to max zoom-in');
});

/* ── gridStops: downrange gridline distances covering the shot ─────────── */

test('gridStops covers the shot and ends on a nice step past the landing', () => {
  assert.deepEqual(gridStops(207), [50, 100, 150, 200, 250]);
  assert.deepEqual(gridStops(120), [50, 100, 150]);
  assert.equal(gridStops(200).at(-1), 200);
  assert.ok(gridStops(207).at(-1) >= 207, 'last line is at or beyond the landing');
});

test('gridStops always shows at least two lines, even for a chip', () => {
  assert.deepEqual(gridStops(30), [50, 100]);
  assert.deepEqual(gridStops(0), [50, 100]);
});

test('gridStops grows with the shot and stays ascending 50 m multiples', () => {
  assert.ok(gridStops(280).length > gridStops(120).length, 'more lines for a longer shot');
  const stops = gridStops(280);
  for (let i = 0; i < stops.length; i++) {
    assert.equal(stops[i], (i + 1) * 50, 'ascending multiples of 50 starting at 50');
  }
});

test('gridStops honours a custom step', () => {
  assert.deepEqual(gridStops(90, 25), [25, 50, 75, 100]);
});
