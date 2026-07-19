/**
 * IMPACT · FRAMING — ESM module (named exports), pure functions, no deps.
 *
 * Shot-adaptive framing math for the Impact scene. Kept OUT of the camera
 * contract module (impact-camera.js, whose rigAt/buildBasis/project signatures
 * are locked) so this can grow freely and stay unit-testable without a browser.
 *
 * impact.html consumes these each frame: `fitZoom` decides how much to zoom the
 * whole scene so any shot length fills the frame, and `gridStops` decides which
 * downrange gridlines to draw. The camera contract permits re-tuning
 * pos/fov/refDist/anchor per shot (docs/systemkontrakt.md §5.5); the zoom is
 * applied by widening fov, which changes only `focal`, never `zDiv`, so TOP/SIDE
 * stay exactly orthographic (A2).
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
 *   - clamped so a wedge is not over-zoomed and a bomb does not fisheye.
 *
 * `ref`/`min`/`max` are framing tuning (re-tunable per §5.5); the caller in
 * impact.html owns the concrete values. `maxDist` is floored at 1 m so a
 * zero-length shot can never divide by zero — it simply clamps to `max`.
 */
export function fitZoom(maxDist, { ref = 200, min = 0.55, max = 1.35 } = {}) {
  const k = ref / Math.max(Number(maxDist) || 0, 1);
  return clamp(k, min, max);
}

/**
 * Downrange gridline distances (metres) covering a shot of length `extent`.
 *
 * Returns ascending multiples of `step` from `step` up to the first multiple at
 * or beyond `extent`, so a longer shot simply gains lines (…,200,250,300) rather
 * than overrunning a fixed 50/100/150/200 grid. Always at least two lines so a
 * chip still reads against a grid.
 */
export function gridStops(extent, step = 50) {
  const top = Math.max(step * 2, Math.ceil((Number(extent) || 0) / step) * step);
  const n = Math.round(top / step);
  return Array.from({ length: n }, (_, i) => (i + 1) * step);
}
