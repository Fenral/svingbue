/**
 * IMPACT · FRAMING — ESM module (named exports), pure functions, no deps.
 *
 * Shot-adaptive framing math for the Impact scene. Kept OUT of the camera
 * contract module (impact-camera.js, whose rigAt/buildBasis/project signatures
 * are locked) so this can grow freely and stay unit-testable without a browser.
 *
 * impact.html consumes these each frame: `fitZoom` decides how much to zoom the
 * whole scene so any shot length fills the frame, `gridStops` decides which
 * downrange gridlines to draw, and `lateralStops` does the same across the line.
 * The camera contract permits re-tuning pos/look/fov/refDist/anchor per shot
 * (docs/systemkontrakt.md §5.5).
 *
 * ZOOM MECHANISM — dolly, not fov. The zoom is applied by moving the camera
 * back along its own view axis, which scales BOTH projections:
 *   - ortho  (orthoK=1): screen = focal·xCam/refDist, so refDist/k shrinks by k.
 *   - persp  (orthoK=0): moving back shrinks the subject the ordinary way.
 * It also leaves `fov` alone. An earlier revision widened fov instead; that was
 * fine while the engine capped a driver near 207 m, but the recalibrated engine
 * reaches 386 m carry / 242 m offline, and the fov needed to frame that is over
 * 100° — visible fisheye in the FLIGHT (perspective) station. Dollying has no
 * such failure mode, and the exact-ortho invariant (A2) is structural: `project`
 * computes zDiv = zCam + (refDist − zCam)·orthoK, which equals refDist at
 * orthoK=1 for ANY refDist value.
 */

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Continuous fit-zoom factor for a shot whose farthest interesting point is
 * `maxDist` metres from the (shot-centred) look target.
 *
 * Returns k where k>1 zooms IN (short shots fill the frame) and k<1 zooms OUT
 * (long shots stay framed). k = ref / maxDist, clamped to [min,max]:
 *   - monotonic non-increasing in maxDist (never grows as the shot lengthens),
 *   - exactly 1 when maxDist === ref (the baseline framing distance),
 *   - clamped so a wedge is not over-zoomed and a bomb does not vanish.
 *
 * Defaults are sized to the CURRENT engine envelope, measured across the whole
 * Impact slider domain (face/path ±15°, loft 0–50°, attack ±15°, 60–150 mph):
 * carry ≤ 386 m, offline ≤ 242 m, apex ≤ 68 m. The binding case is the widest
 * shot, needing k ≈ 112/250 ≈ 0.45, so `min` sits at 0.40 with headroom rather
 * than the 0.62 that suited the pre-recalibration engine.
 */
export function fitZoom(maxDist, { ref = 112, min = 0.40, max = 1.35 } = {}) {
  const k = ref / Math.max(Number(maxDist) || 0, 1);
  return clamp(k, min, max);
}

/**
 * Downrange gridline distances (metres) covering a shot of length `extent`.
 *
 * Returns ascending multiples of `step` from `step` up to the first multiple at
 * or beyond `extent`, so a longer shot simply gains lines (…,250,300,350)
 * rather than overrunning a fixed 50/100/150/200 grid. Always at least two
 * lines so a readout still has a scale to sit against.
 */
export function gridStops(extent, step = 50) {
  const top = Math.max(step * 2, Math.ceil((Number(extent) || 0) / step) * step);
  const n = Math.round(top / step);
  return Array.from({ length: n }, (_, i) => (i + 1) * step);
}

/**
 * Signed lateral guide distances (metres) covering a miss of |halfWidth|.
 *
 * Mirrored pairs outward from the target line: ±step, ±2·step, … out to the
 * first multiple at or beyond `halfWidth`. Zero is never returned — the target
 * line itself is drawn separately and is not a guide. Always at least one pair,
 * so even a dead-straight shot keeps a width reference on screen.
 */
export function lateralStops(halfWidth, step = 50) {
  const top = Math.max(step, Math.ceil((Math.abs(Number(halfWidth)) || 0) / step) * step);
  const n = Math.round(top / step);
  const out = [];
  for (let i = 1; i <= n; i++) { out.push(-i * step, i * step); }
  return out.sort((a, b) => a - b);
}

/**
 * Dolly a rig back along its own view axis by 1/k, keeping `look` fixed.
 *
 * k<1 pushes the camera away (zoom out), k>1 pulls it in. `fov` is untouched.
 * Returns a NEW rig object; the input is not mutated.
 */
export function dollyRig(rig, k) {
  const f = 1 / clamp(Number(k) || 1, 1e-6, 1e6);
  const { look, pos } = rig;
  return {
    ...rig,
    pos: {
      x: look.x + (pos.x - look.x) * f,
      y: look.y + (pos.y - look.y) * f,
      z: look.z + (pos.z - look.z) * f,
    },
  };
}
