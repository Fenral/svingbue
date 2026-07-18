/**
 * SWING PARAMETERS & IMPACT — ESM module (named exports).
 * Faithful JS port of strikearc-3.0/tmp/swing-arc-engine.ts (types stripped).
 * Pure functions, no deps. Keep in sync with the TS source.
 *
 * Z-UP world: +X = target line, +Y = away from camera (face-on), +Z = up.
 * GeometryState = { view, radius, planeAngle, swingDirection, lowPoint:{x,y,z} }.
 */

export const RADIUS = 1.20;
export const BALL_RADIUS_M = 0.0213;
export const SAMPLES = 96;
export const SWEEP_DEG = 48;
export const SWEEP_RAD = (SWEEP_DEG * Math.PI) / 180;
export const VIEW = { w: 960, h: 480 };
export const PLANE_DEFAULT = 55;

export const CAMS = {
  dtl: { pos: { x: -5.2, y: 0.0, z: 1.1 }, look: { x: 0.0, y: 0.0, z: 0.4 }, fov: (40 * Math.PI) / 180, xStretch: 1.7 },
  face: { pos: { x: 0.0, y: -4.5, z: 0.95 }, look: { x: 0.0, y: 0.0, z: 0.85 }, fov: (32 * Math.PI) / 180 },
};

export const deg2rad = d => (d * Math.PI) / 180;
export const rad2deg = r => (r * 180) / Math.PI;
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const cross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const norm = v => { const m = Math.hypot(v.x, v.y, v.z) || 1; return { x: v.x / m, y: v.y / m, z: v.z / m }; };
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

export function buildCameraFromCam(cam, vbox = VIEW) {
  const fwd = norm(sub(cam.look, cam.pos));
  const right = norm(cross(fwd, { x: 0, y: 0, z: 1 }));
  const upVec = norm(cross(right, fwd));
  const focal = vbox.h / 2 / Math.tan(cam.fov / 2);
  return { cam, fwd, right, upVec, focal, vbox };
}

export function buildCamera(view, vbox = VIEW) {
  return buildCameraFromCam(CAMS[view], vbox);
}

// interpolate two camera presets (for animated face <-> dtl orbit)
export function lerpCam(a, b, t) {
  const L = (x, y) => x + (y - x) * t;
  const ax = a.xStretch ?? 1.0, bx = b.xStretch ?? 1.0;
  return {
    pos:  { x: L(a.pos.x, b.pos.x),   y: L(a.pos.y, b.pos.y),   z: L(a.pos.z, b.pos.z) },
    look: { x: L(a.look.x, b.look.x), y: L(a.look.y, b.look.y), z: L(a.look.z, b.look.z) },
    fov:  L(a.fov, b.fov),
    xStretch: L(ax, bx),
  };
}

export function project(p, basis) {
  const { cam, fwd, right, upVec, focal, vbox } = basis;
  const rel = sub(p, cam.pos);
  const xCam = dot(rel, right);
  const yCam = dot(rel, upVec);
  const zCam = dot(rel, fwd);
  if (zCam <= 0.01) return null;
  const xStretch = cam.xStretch ?? 1.0;
  return { x: vbox.w / 2 + (xCam / zCam) * focal * xStretch, y: vbox.h / 2 - (yCam / zCam) * focal };
}

export function planeBasis(planeAngle, swingDir) {
  const phi = deg2rad(planeAngle);
  const psi = deg2rad(-swingDir);
  const u = { x: Math.cos(psi), y: Math.sin(psi), z: 0 };
  const m = { x: -Math.sin(psi) * Math.cos(phi), y: Math.cos(psi) * Math.cos(phi), z: Math.sin(phi) };
  return { u, m };
}

export function effectiveLpx(state) {
  // Plane-dependent swing-dir coupling (fix I): with a fixed pivot the arc's
  // bottom sits R·cos(planeAngle) horizontally from the pivot, so rotating the
  // swing direction moves the low point by R·cos(planeAngle) per RADIAN —
  // a flat plane shifts it more per degree (45°: 1.48 cm/°) than a steep one
  // (70°: 0.72 cm/°). The old constant 0.015 was only correct at ~45°.
  const R = state.radius ?? RADIUS;
  const phi = ((state.planeAngle ?? PLANE_DEFAULT) * Math.PI) / 180;
  const perDeg = R * Math.cos(phi) * (Math.PI / 180);
  return state.lowPoint.x - state.swingDirection * perDeg;
}

export function lpWorld(state) {
  // Address compensation: the golfer stands so the strike meets the ball —
  // pure translation, all angles invariant.
  //
  // Without this shift, arcPosition(thetaAtImpact(state), state) lands at
  // r·(1-cosθ0)·(m.x, m.y) horizontally, NOT at the ball (0,0) — because the
  // pivot (lpWorld) sits directly under the low point, but the low point of
  // the arc (theta=0) and the impact point (theta=thetaAtImpact) are two
  // different points on the arc whenever swingDirection rotates the plane
  // basis u away from the world X axis. The horizontal miss at impact is
  // exactly d·(-sinψ, cosψ), where ψ = deg2rad(-swingDirection) and
  // d = r·(1-cosθ0)·cos(planeAngle). Real golfers address the ball by
  // shifting their stance/pivot, not by bending the swing geometry — so we
  // translate the whole arc (pivot) by that same vector. This is a pure
  // horizontal translation: deriveImpact/clubBallContact/strikeQuality only
  // depend on theta/planeAngle/swingDirection (never on lpWorld's xy), so
  // they are numerically unchanged by this shift.
  const psi = deg2rad(-state.swingDirection);
  const phi = deg2rad(state.planeAngle ?? PLANE_DEFAULT);
  const lpx = effectiveLpx(state);
  const theta0 = thetaAtImpact(state);
  const d = state.radius * (1 - Math.cos(theta0)) * Math.cos(phi);
  return {
    x: lpx * Math.cos(psi) - d * -Math.sin(psi),
    y: lpx * Math.sin(psi) - d * Math.cos(psi),
    z: state.lowPoint.z,
  };
}

export function arcPosition(theta, state) {
  const { u, m } = planeBasis(state.planeAngle, state.swingDirection);
  const r = state.radius;
  const sinT = Math.sin(theta);
  const cosT = Math.cos(theta);
  const lp = lpWorld(state);
  return {
    x: lp.x + r * sinT * u.x + r * (1 - cosT) * m.x,
    y: lp.y + r * sinT * u.y + r * (1 - cosT) * m.y,
    z: lp.z + r * sinT * u.z + r * (1 - cosT) * m.z,
  };
}

export function thetaAtImpact(state) {
  const ratio = clamp(-effectiveLpx(state) / state.radius, -0.999, 0.999);
  return Math.asin(ratio);
}

export function shaftPivot(state) {
  const { m } = planeBasis(state.planeAngle, state.swingDirection);
  const lp = lpWorld(state);
  return { x: lp.x + state.radius * m.x, y: lp.y + state.radius * m.y, z: lp.z + state.radius * m.z };
}

export function tangentAt(theta, state) {
  const { u, m } = planeBasis(state.planeAngle, state.swingDirection);
  const r = state.radius;
  return {
    x: r * Math.cos(theta) * u.x + r * Math.sin(theta) * m.x,
    y: r * Math.cos(theta) * u.y + r * Math.sin(theta) * m.y,
    z: r * Math.cos(theta) * u.z + r * Math.sin(theta) * m.z,
  };
}

export function deriveImpact(state) {
  const theta = thetaAtImpact(state);
  const phi = deg2rad(state.planeAngle);
  const sinT = Math.sin(theta), cosT = Math.cos(theta);
  const sinP = Math.sin(phi), cosP = Math.cos(phi);
  const vh_par = cosT;
  const vh_perp = -sinT * cosP;
  const vz = sinT * sinP;
  const vh_mag = Math.hypot(vh_par, vh_perp);
  return {
    attackAngle: rad2deg(Math.atan2(vz, vh_mag)),
    clubPath: state.swingDirection + rad2deg(Math.atan2(vh_perp, vh_par)),
  };
}

export function clubBallContact(state) {
  const phi = deg2rad(state.planeAngle);
  const r = state.radius;
  const theta = Math.asin(clamp(-effectiveLpx(state) / r, -0.999, 0.999));
  const clubZ = state.lowPoint.z + r * (1 - Math.cos(theta)) * Math.sin(phi);
  const offset = clubZ - BALL_RADIUS_M;
  const offsetRatio = offset / BALL_RADIUS_M;
  return { clubZ, offset, offsetRatio, theta };
}

// Low-point-ahead (xLP) tuned classification.
// Research thresholds (r = BALL_RADIUS_M, h = clubZ = club height at the ball,
// xLP = effectiveLpx(state), + = ahead/target-side):
//   - clubZ < 0           → Fat (turf-first); clubZ < -0.025 → Duff (digs deep).
//   - 0 < h ≤ 1.0r AND xLP ∈ [+0.02,+0.15] m  → Pure (ball-first, descending,
//     low point ahead; ideal +0.08..+0.13). In the Pure-height band but with
//     xLP < 0 (low point behind ball) → Fat (ground-first tendency); with xLP
//     ahead-but-outside the window → Thin (shallow strike).
//   - 1.0r < h ≤ 1.4r     → Thin (bladed/topped folded in here).
//   - h > 1.4r            → Whiff (club clears the ball).
// Height ceiling for Pure is 1.0r (ball centre) rather than 0.6r: at the steep
// plane angles used here an ideal centred low-point already lands h ≈ 0.8r, so
// 1.0r keeps the "ball first, below equator" intent while matching the geometry.
// Exported (geometry P1, systemkontrakt §2): the tickstrip pure zone binds to
// these — the ONLY sanctioned way UI learns the Pure window. Values unchanged.
export const LP_AHEAD_MIN = 0.02;
export const LP_AHEAD_MAX = 0.15;
export const LP_IDEAL = 0.105; // centre of the ideal +0.08..+0.13 window

// STAGE 5 — per-band TEXT colour (distinct from `color`, which drives dots/fills
// and stays untouched). Tuned for >=4.5:1 contrast on #0A0E12.
const TEXT_COLOR = { Pure: '#4ADE80', Thin: '#FBBF24', Fat: '#FBBF24', Duff: '#F87171', Whiff: '#F87171' };

export function strikeQuality(state) {
  const ct = clubBallContact(state);
  const r = ct.offsetRatio;
  const h = ct.clubZ; // contact height of the club at the ball
  const xLP = effectiveLpx(state); // low-point offset, + = ahead/target-side
  const R = BALL_RADIUS_M;
  const lpAhead = xLP >= LP_AHEAD_MIN && xLP <= LP_AHEAD_MAX;

  let band, color, tip;
  if (h < -0.025) { band = 'Duff'; color = '#DC2626'; tip = 'Duff — club digs deep behind the ball.'; }
  else if (h < 0) { band = 'Fat'; color = '#A16207'; tip = 'Fat — club takes turf before the ball (heavy strike).'; }
  else if (h <= 1.0 * R) {
    if (lpAhead) { band = 'Pure'; color = '#22C55E'; tip = 'Pure strike — ball first, descending, low point ahead.'; }
    else if (xLP < 0) { band = 'Fat'; color = '#A16207'; tip = 'Fat — low point behind the ball (ground-first tendency).'; }
    else { band = 'Thin'; color = '#EAB308'; tip = 'Thin — shallow strike, low point not far enough ahead.'; }
  }
  else if (h <= 1.4 * R) { band = 'Thin'; color = '#EAB308'; tip = 'Thin — club catches the top of the ball (bladed).'; }
  else { band = 'Whiff'; color = '#DC2626'; tip = 'Whiff — club passes entirely over the ball.'; }

  let pct;
  if (h < 0) {
    // turf-first: deeper dig = worse.
    pct = Math.max(0, Math.round(50 + h * 2000));
  } else if (band === 'Pure') {
    // reward proximity to the ideal low-point-ahead centre.
    const lpErr = Math.abs(xLP - LP_IDEAL);
    pct = clamp(Math.round(100 - lpErr * 220 - Math.abs(r) * 20), 70, 100);
  } else {
    pct = Math.max(0, Math.round(100 - Math.abs(r) * 75));
  }
  const barPos = clamp(50 - r * (100 / 3), 0, 100);
  const textColor = TEXT_COLOR[band];
  return { band, color, textColor, tip, pct, barPos, offsetRatio: r, clubZ: ct.clubZ };
}

export function buildPlanePolygon(state) {
  // FIX L: use lpWorld(state) (the address-compensated pivot) instead of a
  // duplicated inline lp formula, so the glass plane stays coherent with the
  // shifted arc — the plane must pass through the same pivot arcPosition()
  // sweeps around, or it visibly decouples from the arc under swingDirection.
  const { u, m } = planeBasis(state.planeAngle, state.swingDirection);
  const r = state.radius;
  const hw = r * 0.98, down = r * 0.04, top = r * 1.15;  // generous: fully covers the swing arc
  const lp = lpWorld(state);
  const pt = (a, b) => ({ x: lp.x + a * u.x + b * m.x, y: lp.y + a * u.y + b * m.y, z: lp.z + a * u.z + b * m.z });
  return [pt(-hw, -down), pt(hw, -down), pt(hw, top), pt(-hw, top)];
}
