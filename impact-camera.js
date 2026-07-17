/**
 * IMPACT · CAMERA — ESM module (named exports).
 * Real camera rig: orbit around a scene anchor, perspective→ortho via a
 * continuous orthoK, then project. Pure functions, no deps. Same export
 * style as ./swing-parameters-and-impact.js (which this module does not
 * import from or modify — different scene, different scale).
 *
 * Contract: docs/systemkontrakt.md §5.3 (flate), §5.5 (what's implementation
 * vs redesign here — concrete pos/look/fov/refDist/anchor/easing values ARE
 * implementation and may be re-tuned later without that being a redesign).
 *
 * World convention (locked, docs/systemkontrakt.md §1.4): Z-up meters,
 * +X = downrange (toward target), +Y = right (RH golfer), +Z = height.
 * Ball / impact sits at the world origin.
 */

const deg2rad = d => (d * Math.PI) / 180;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = t => t * t * (3 - 2 * t);

const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const scaleV = (a, s) => ({ x: a.x * s, y: a.y * s, z: a.z * s });
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a, b) => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const length = a => Math.hypot(a.x, a.y, a.z);
const norm = a => {
  const m = length(a) || 1;
  return { x: a.x / m, y: a.y / m, z: a.z / m };
};

// Default screen-up reference when a rig carries none. Each STATION carries
// its own `up` and lerpRig blends it, because SIDE→TOP requires a continuous
// 90° camera roll (TOP reads downrange-up/lateral-right like a map, which is
// rolled 90° relative to what a plain tilt from SIDE would give). A fixed
// world-up would pop that roll at a threshold instead of travelling it.
const WORLD_UP = { x: 0, y: 0, z: 1 };
const GIMBAL_FALLBACK = { x: 1, y: 0, z: 0 };

/**
 * The three named camera endpoints. Concrete pos/look/fov are a first-pass
 * tuning (§5.5 — implementation, re-tunable once wired into a live scene),
 * derived from the mock's implied camera geometry (design/mocks/
 * impact-kamera.html:255-265) ported through the axis map in
 * docs/systemkontrakt.md §1.4 (mock.z→x, mock.x→y, mock.y→z).
 *
 * All three `look` at the SAME point — the scene anchor `rigAt` orbits
 * around — so SIDE truly looks along +Y and TOP truly looks down -Z, per
 * docs/systemkontrakt.md §5.3.
 */
const ANCHOR = { x: 100, y: 0, z: 12 };

/**
 * Golf-semantic mirror (locked by the world convention itself): +Y = the RH
 * golfer's RIGHT, and a right-curving shot must render screen-RIGHT in
 * FLIGHT and TOP (mock reference: design/mocks/impact-kamera.html projPersp/
 * projTop, +lateral → +screen-x). With +X downrange and +Z up that makes the
 * world left-handed, so the basis below uses right = up × fwd (the mirrored
 * cross order). Consequence: the SIDE camera must sit on the +Y side looking
 * along −Y for downrange to read left→right like the mock's projSide.
 *
 * `xStretch` = anisotropic screen-x scale, the same knob the repo's rig
 * precedent already lerps (swing-parameters-and-impact.js lerpCam lerps
 * pos/look/fov/xStretch — cited in docs/systemkontrakt.md A1). The mock's
 * SIDE/TOP framings are deliberately anisotropic (height exaggerated vs
 * downrange, TrackMan-style); lengths still measure true along each axis.
 *
 * `up` = per-station screen-up reference (see WORLD_UP note above).
 */
export const STATIONS = Object.freeze({
  flight: Object.freeze({
    pos: Object.freeze({ x: -15, y: 0, z: 3.2 }),
    look: ANCHOR,
    fov: deg2rad(55),
    orthoK: 0,
    xStretch: 1,
    up: WORLD_UP,
  }),
  side: Object.freeze({
    pos: Object.freeze({ x: 100, y: 460, z: 12 }), // ser langs −Y (fwd = (0,−1,0) exactly)
    look: ANCHOR,
    fov: deg2rad(16),
    orthoK: 1,
    xStretch: 0.22,
    up: WORLD_UP,
  }),
  top: Object.freeze({
    pos: Object.freeze({ x: 100, y: 0, z: 300 }), // ser ned langs −Z (fwd = (0,0,−1) exactly)
    look: ANCHOR,
    fov: deg2rad(60),
    orthoK: 1,
    xStretch: 0.45,
    up: GIMBAL_FALLBACK, // screen-up = +X (downrange up, map orientation)
  }),
});

/**
 * Spherical (orbit) interpolation of a camera position around `anchor`:
 * slerp the unit direction from anchor→pos, lerp the radius. This is what
 * makes a station-to-station travel a bue (arc) around the shot instead of
 * a straight line that could cut through the ground — docs/systemkontrakt.md
 * §5.3 / A1.
 */
function orbitLerp(posA, posB, anchor, t, bulge = 0) {
  const va = sub(posA, anchor);
  const vb = sub(posB, anchor);
  // `bulge` svinger banen utover midtveis (radius × (1 + bulge·sin πt)) så
  // hele skuddet holder seg i bildet under reisen — ren pose-tuning (§5.5).
  const ra = length(va);
  const rb = length(vb);
  const ua = norm(va);
  const ub = norm(vb);
  const cosTheta = clamp(dot(ua, ub), -1, 1);
  const theta = Math.acos(cosTheta);
  let dir;
  if (theta < 1e-6) {
    dir = ua;
  } else {
    const sinTheta = Math.sin(theta);
    const wa = Math.sin((1 - t) * theta) / sinTheta;
    const wb = Math.sin(t * theta) / sinTheta;
    dir = norm({ x: ua.x * wa + ub.x * wb, y: ua.y * wa + ub.y * wb, z: ua.z * wa + ub.z * wb });
  }
  const radius = lerp(ra, rb, t) * (1 + bulge * Math.sin(Math.PI * t));
  return add(anchor, scaleV(dir, radius));
}

function lerpRig(a, b, t, bulge = 0) {
  return {
    pos: orbitLerp(a.pos, b.pos, ANCHOR, t, bulge),
    look: { x: lerp(a.look.x, b.look.x, t), y: lerp(a.look.y, b.look.y, t), z: lerp(a.look.z, b.look.z, t) },
    fov: lerp(a.fov, b.fov, t),
    orthoK: lerp(a.orthoK, b.orthoK, t),
    xStretch: lerp(a.xStretch, b.xStretch, t),
    up: norm({ x: lerp(a.up.x, b.up.x, t), y: lerp(a.up.y, b.up.y, t), z: lerp(a.up.z, b.up.z, t) }),
  };
}

/**
 * Continuous station scalar (0=FLIGHT, 1=SIDE, 2=TOP; docs/systemkontrakt.md
 * §3.2) → a camera rig. 0/1/2 reproduce STATIONS.flight/side/top exactly;
 * in-between values orbit around ANCHOR with a smoothstep ease, matching the
 * ease shape mocked at design/mocks/impact-kamera.html:207,270-271 and the
 * lerpCam pattern at swing-parameters-and-impact.js:44-53.
 */
export function rigAt(station) {
  const s = clamp(+station || 0, 0, 2);
  // flight→side-benet trenger en utover-bulge (0.55) for at hele skuddet skal
  // stå i bildet midtveis; side→top-benet rammer allerede riktig uten.
  if (s <= 1) return lerpRig(STATIONS.flight, STATIONS.side, smoothstep(s), 0.55);
  return lerpRig(STATIONS.side, STATIONS.top, smoothstep(s - 1));
}

/**
 * Rig → render basis. Builds the camera's screen axes (right/up) from
 * `fwd` and the rig's own `up` reference (see STATIONS note: the up-blend
 * carries the SIDE→TOP roll; the golf-semantic mirror fixes the cross
 * order to right = up × fwd). Falls back to a perpendicular axis only if
 * a caller hands in a rig whose `up` is (nearly) parallel to `fwd`.
 * `refDist` — the constant depth an orthoK=1 projection divides by — is
 * the camera's distance to its own look target, so SIDE/TOP need no extra
 * tuning constant to be exactly orthographic (docs/systemkontrakt.md
 * §5.2/§5.3, A2).
 */
export function buildBasis(rig, vbox) {
  const fwd = norm(sub(rig.look, rig.pos));
  let refUp = rig.up || WORLD_UP;
  if (Math.abs(dot(refUp, fwd)) > 0.995) {
    refUp = Math.abs(fwd.z) > 0.98 ? GIMBAL_FALLBACK : WORLD_UP;
  }
  const right = norm(cross(refUp, fwd));
  const upVec = norm(cross(fwd, right));
  const focal = vbox.h / 2 / Math.tan(rig.fov / 2);
  const refDist = length(sub(rig.look, rig.pos)) || 1;
  return { rig, fwd, right, upVec, focal, refDist, vbox };
}

/**
 * World point → screen {x,y,depth}, or null when behind the camera.
 * orthoK=0 is byte-identical in shape to swing-parameters-and-impact.js:63
 * (zDiv=zCam); orthoK=1 divides by the constant refDist instead — an exact
 * orthographic projection, not an approximation (docs/systemkontrakt.md
 * §5.3). Returns `depth` (=zCam) so callers can sort draw order at any
 * blend of orthoK.
 */
export function project(p, basis) {
  const { rig, fwd, right, upVec, focal, refDist, vbox } = basis;
  const rel = sub(p, rig.pos);
  const zCam = dot(rel, fwd);
  if (zCam <= 0.01) return null;
  const xCam = dot(rel, right);
  const yCam = dot(rel, upVec);
  const zDiv = zCam + (refDist - zCam) * rig.orthoK;
  return {
    x: vbox.w / 2 + (xCam / zDiv) * focal * (rig.xStretch ?? 1),
    y: vbox.h / 2 - (yCam / zDiv) * focal,
    depth: zCam,
  };
}
