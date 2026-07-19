import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STATIONS, rigAt, buildBasis, project } from '../impact-camera.js';

const VBOX = { w: 960, h: 540 };
const EPS = 1e-9;

function approxEqual(a, b, eps = 1e-6, msg = '') {
  assert.ok(Math.abs(a - b) < eps, msg || `expected ${a} ≈ ${b}`);
}
function approxPoint(a, b, eps = 1e-6) {
  approxEqual(a.x, b.x, eps, 'x mismatch');
  approxEqual(a.y, b.y, eps, 'y mismatch');
  approxEqual(a.z, b.z, eps, 'z mismatch');
}

test('STATIONS: FLIGHT is perspective, SIDE/TOP are exactly orthographic', () => {
  assert.equal(STATIONS.flight.orthoK, 0);
  assert.equal(STATIONS.side.orthoK, 1);
  assert.equal(STATIONS.top.orthoK, 1);
});

test('STATIONS: SIDE looks along -Y (from the golfer\'s right side), TOP looks down -Z (exact)', () => {
  const sideBasis = buildBasis(STATIONS.side, VBOX);
  approxPoint(sideBasis.fwd, { x: 0, y: -1, z: 0 });
  const topBasis = buildBasis(STATIONS.top, VBOX);
  approxPoint(topBasis.fwd, { x: 0, y: 0, z: -1 });
});

test('golf-semantic screen orientation at every station (mirror lock)', () => {
  const vb = VBOX;
  // FLIGHT: +Y (a shot pushed right) renders screen-RIGHT; +Z renders UP.
  const fb = buildBasis(STATIONS.flight, vb);
  const f0 = project({ x: 100, y: 0, z: 0 }, fb);
  const fR = project({ x: 100, y: 20, z: 0 }, fb);
  const fU = project({ x: 100, y: 0, z: 20 }, fb);
  assert.ok(fR.x > f0.x, 'FLIGHT: +Y must render to the right');
  assert.ok(fU.y < f0.y, 'FLIGHT: +Z must render upward');
  // SIDE: downrange (+X) renders left→right, +Z up (mock projSide orientation).
  const sb = buildBasis(STATIONS.side, vb);
  const s0 = project({ x: 0, y: 0, z: 0 }, sb);
  const sX = project({ x: 100, y: 0, z: 0 }, sb);
  const sU = project({ x: 0, y: 0, z: 20 }, sb);
  assert.ok(sX.x > s0.x, 'SIDE: downrange must render to the right');
  assert.ok(sU.y < s0.y, 'SIDE: +Z must render upward');
  // TOP: map orientation — downrange (+X) up-screen, +Y (right) screen-right.
  const tb = buildBasis(STATIONS.top, vb);
  const t0 = project({ x: 0, y: 0, z: 0 }, tb);
  const tX = project({ x: 100, y: 0, z: 0 }, tb);
  const tR = project({ x: 0, y: 20, z: 0 }, tb);
  assert.ok(tX.y < t0.y, 'TOP: downrange must render upward');
  assert.ok(tR.x > t0.x, 'TOP: +Y must render to the right');
});

test('rig up-reference rolls continuously across SIDE→TOP (no 90° pop)', () => {
  let prev = null;
  for (let s = 1; s <= 2.0001; s += 0.05) {
    const b = buildBasis(rigAt(Math.min(s, 2)), VBOX);
    if (prev) {
      const d = prev.right.x * b.right.x + prev.right.y * b.right.y + prev.right.z * b.right.z;
      assert.ok(d > 0.9, `right axis jumped at station ${s.toFixed(2)} (cos=${d.toFixed(3)})`);
    }
    prev = b;
  }
});

test('rigAt(0/1/2) reproduces STATIONS.flight/side/top exactly (station scalar is a lossless index)', () => {
  const flight = rigAt(0);
  approxPoint(flight.pos, STATIONS.flight.pos, EPS);
  approxPoint(flight.look, STATIONS.flight.look, EPS);
  approxEqual(flight.fov, STATIONS.flight.fov, EPS);
  approxEqual(flight.orthoK, STATIONS.flight.orthoK, EPS);

  const side = rigAt(1);
  approxPoint(side.pos, STATIONS.side.pos, EPS);
  approxEqual(side.orthoK, STATIONS.side.orthoK, EPS);

  const top = rigAt(2);
  approxPoint(top.pos, STATIONS.top.pos, EPS);
  approxEqual(top.orthoK, STATIONS.top.orthoK, EPS);
});

test('rigAt is continuous across the FLIGHT→SIDE→TOP seam at station=1 (no pop)', () => {
  const before = rigAt(0.999);
  const at = rigAt(1);
  const after = rigAt(1.001);
  approxPoint(before.pos, at.pos, 0.05);
  approxPoint(after.pos, at.pos, 0.05);
});

test('rigAt clamps outside 0..2', () => {
  approxPoint(rigAt(-1).pos, STATIONS.flight.pos, EPS);
  approxPoint(rigAt(5).pos, STATIONS.top.pos, EPS);
});

test('rigAt orbits around the shared anchor (arc, not a straight cartesian lerp of pos)', () => {
  const anchor = STATIONS.flight.look; // flight/side/top share one look point by construction
  const mid = rigAt(0.5);
  const rMid = Math.hypot(mid.pos.x - anchor.x, mid.pos.y - anchor.y, mid.pos.z - anchor.z);
  const rFlight = Math.hypot(
    STATIONS.flight.pos.x - anchor.x, STATIONS.flight.pos.y - anchor.y, STATIONS.flight.pos.z - anchor.z
  );
  const rSide = Math.hypot(
    STATIONS.side.pos.x - anchor.x, STATIONS.side.pos.y - anchor.y, STATIONS.side.pos.z - anchor.z
  );
  // radius stays between the endpoint radii and the documented mid-leg
  // outward bulge (×1.55 max) that keeps the whole shot in frame mid-travel
  assert.ok(rMid >= Math.min(rFlight, rSide) - 1e-6 && rMid <= Math.max(rFlight, rSide) * 1.56);

  // and the midpoint is NOT the naive straight-line lerp of the two positions
  // (a straight lerp would very likely dip toward/through the ground plane
  // between a low FLIGHT camera and a horizon-height SIDE camera).
  const naive = {
    x: (STATIONS.flight.pos.x + STATIONS.side.pos.x) / 2,
    y: (STATIONS.flight.pos.y + STATIONS.side.pos.y) / 2,
    z: (STATIONS.flight.pos.z + STATIONS.side.pos.z) / 2,
  };
  const drift = Math.hypot(mid.pos.x - naive.x, mid.pos.y - naive.y, mid.pos.z - naive.z);
  assert.ok(drift > 1, `expected orbit path to diverge from a straight lerp, drift=${drift}`);
});

test('project: null behind the camera (zCam <= 0.01)', () => {
  const basis = buildBasis(STATIONS.flight, VBOX);
  const behind = { x: STATIONS.flight.pos.x - 10, y: 0, z: STATIONS.flight.pos.z };
  assert.equal(project(behind, basis), null);
});

test('project: orthoK=0 matches the plain pinhole formula (identical shape to swing-parameters-and-impact.js:63)', () => {
  const basis = buildBasis(STATIONS.flight, VBOX);
  const p = { x: 40, y: 5, z: 3 };
  const rel = { x: p.x - STATIONS.flight.pos.x, y: p.y - STATIONS.flight.pos.y, z: p.z - STATIONS.flight.pos.z };
  const zCam = rel.x * basis.fwd.x + rel.y * basis.fwd.y + rel.z * basis.fwd.z;
  const xCam = rel.x * basis.right.x + rel.y * basis.right.y + rel.z * basis.right.z;
  const yCam = rel.x * basis.upVec.x + rel.y * basis.upVec.y + rel.z * basis.upVec.z;
  const expected = {
    x: VBOX.w / 2 + (xCam / zCam) * basis.focal,
    y: VBOX.h / 2 - (yCam / zCam) * basis.focal,
  };
  const got = project(p, basis);
  approxEqual(got.x, expected.x, 1e-6);
  approxEqual(got.y, expected.y, 1e-6);
  approxEqual(got.depth, zCam, 1e-6);
});

test('project: orthoK=1 is exactly orthographic — depth never changes screen position for a fixed lateral/height offset', () => {
  const basis = buildBasis(STATIONS.top, VBOX); // top-down, fwd=(0,0,-1), gimbal-lock fallback path
  const near = { x: STATIONS.top.pos.x + 12, y: STATIONS.top.pos.y - 8, z: STATIONS.top.pos.z - 20 };
  const far = { x: STATIONS.top.pos.x + 12, y: STATIONS.top.pos.y - 8, z: STATIONS.top.pos.z - 90 };
  const a = project(near, basis);
  const b = project(far, basis);
  assert.notEqual(a.depth, b.depth); // genuinely different depth
  approxEqual(a.x, b.x, 1e-6, 'orthographic x must be depth-independent');
  approxEqual(a.y, b.y, 1e-6, 'orthographic y must be depth-independent');
});

test('project: the fit-to-shot fov-widen keeps orthoK=1 exactly orthographic', () => {
  // frameForShot (impact.html) zooms by widening fov: fov' = 2·atan(tan(fov/2)/k).
  // That rescales focal, never zDiv, so TOP/SIDE must stay depth-independent at any fov.
  const k = 0.7;
  const wideFov = 2 * Math.atan(Math.tan(STATIONS.side.fov / 2) / k);
  const basis = buildBasis({ ...STATIONS.side, fov: wideFov }, VBOX);
  const near = { x: STATIONS.side.look.x + 30, y: 0, z: STATIONS.side.look.z + 14 };
  const far = { x: STATIONS.side.look.x + 30, y: -100, z: STATIONS.side.look.z + 14 };
  const a = project(near, basis);
  const b = project(far, basis);
  assert.notEqual(a.depth, b.depth, 'genuinely different depth along view axis');
  approxEqual(a.x, b.x, 1e-6, 'orthographic x stays depth-independent after fov-widen');
  approxEqual(a.y, b.y, 1e-6, 'orthographic y stays depth-independent after fov-widen');
});

test('buildBasis: right/upVec stay orthonormal at TOP (rig up-reference, no NaN/zero vector)', () => {
  const basis = buildBasis(STATIONS.top, VBOX);
  const lenRight = Math.hypot(basis.right.x, basis.right.y, basis.right.z);
  const lenUp = Math.hypot(basis.upVec.x, basis.upVec.y, basis.upVec.z);
  approxEqual(lenRight, 1, 1e-6);
  approxEqual(lenUp, 1, 1e-6);
  const dotRU = basis.right.x * basis.upVec.x + basis.right.y * basis.upVec.y + basis.right.z * basis.upVec.z;
  approxEqual(dotRU, 0, 1e-6, 'right and upVec must be perpendicular');
  assert.ok(Number.isFinite(basis.focal) && basis.focal > 0);
});
