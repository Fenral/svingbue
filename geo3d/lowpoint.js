/**
 * geo3d/lowpoint.js — THE GOLD MEASURES (ORDRE 2 P2 §6 rework of the old
 * L1 variant): a measured ground bracket (ball -> lowpoint ground-projection)
 * with a live DOM label ("+8 cm ahead" / "−5 cm behind") anchored via
 * Vector3.project. Gold (--gold #D9B36A) — measures/annotations are gold per
 * the order grammar; the label flips to the --warn verdict tone via the
 * `is-neg` class when the low point sits BEHIND the ball (§7 state colour).
 *
 * OWNER ORDER 2026-07-12 (#4) — a SECOND gold measure: a small vertical
 * bracket at the valley end of the ground bracket measuring the low point's
 * HEIGHT (state.lowPoint.z, the Depth slider) from the ground plane, with its
 * own plate label («y +1.6 cm», U+2212 for below-ground). Same material, same
 * plate grammar — the two brackets read as one dimension chain (over → up).
 * Below ground = digging = negative state → `is-neg` (--warn), like x-behind.
 *
 * The old marker sphere + dashed plumb line were removed (minimalism test):
 * the arc's warm-white valley hotspot (arc.js setLowestSegmentGlow, driven by
 * the theta this module still returns) already marks WHERE the low point is;
 * the brackets + labels name the distances. The microscope panel owns the
 * close-up read.
 */
import * as THREE from '../vendor/three/build/three.module.js';
import { lpWorld, arcPosition, effectiveLpx, SWEEP_RAD } from '../swing-parameters-and-impact.js';

const GOLD = 0xD9B36A; // --gold — the measure/annotation role (never a verdict)

export function createLowpoint(state, labelEl, labelYEl) {
  const group = new THREE.Group();

  const bracketMat = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.7, toneMapped: false });
  const bracketLine = new THREE.Line(new THREE.BufferGeometry(), bracketMat);
  const bracketTicks = new THREE.LineSegments(new THREE.BufferGeometry(), bracketMat);

  // OWNER ORDER 2026-07-12 (#4) — vertical y-measure bracket (shares the gold
  // measure material; ticks run along X so they read perpendicular on screen).
  const bracketYLine = new THREE.Line(new THREE.BufferGeometry(), bracketMat);
  const bracketYTicks = new THREE.LineSegments(new THREE.BufferGeometry(), bracketMat);

  group.add(bracketLine, bracketTicks, bracketYLine, bracketYTicks);

  const anchor = new THREE.Vector3(); // world position the DOM label is pinned to
  const anchorY = new THREE.Vector3(); // y-measure label anchor
  let brkSign = 1;

  function update(stateRef, camera, canvas) {
    const lp = lpWorld(stateRef);
    const lpG = new THREE.Vector3(lp.x, lp.y, 0);

    // measured ground bracket: ball (0,off,z) -> lowpoint ground-projection (lpG.x, lpG.y+off, z)
    const off = -0.18, z = 0.004, tick = 0.05;
    const A = new THREE.Vector3(0, off, z);
    const B = new THREE.Vector3(lpG.x, lpG.y + off, z);
    bracketLine.geometry.dispose();
    bracketLine.geometry = new THREE.BufferGeometry().setFromPoints([A, B]);
    bracketTicks.geometry.dispose();
    bracketTicks.geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(A.x, A.y - tick, z), new THREE.Vector3(A.x, A.y + tick, z),
      new THREE.Vector3(B.x, B.y - tick, z), new THREE.Vector3(B.x, B.y + tick, z),
    ]);

    brkSign = Math.sign(stateRef.lowPoint.x) || 1;
    anchor.set(lpG.x + brkSign * 0.10, (lpG.y + off) - 0.12, 0.01);

    // OWNER ORDER 2026-07-12 (#4) — the y measure: a vertical bracket rising
    // (or digging) from the ground at the valley end of the x bracket, up/down
    // to the low point's height. The two share the corner point so they read
    // as one dimension chain. Label floats just past the free end.
    const yv = stateRef.lowPoint.z;
    const yTick = 0.03;
    const C = new THREE.Vector3(lpG.x, lpG.y + off, 0.004);
    const D = new THREE.Vector3(lpG.x, lpG.y + off, yv);
    bracketYLine.geometry.dispose();
    bracketYLine.geometry = new THREE.BufferGeometry().setFromPoints([C, D]);
    bracketYTicks.geometry.dispose();
    bracketYTicks.geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(C.x - yTick, C.y, C.z), new THREE.Vector3(C.x + yTick, C.y, C.z),
      new THREE.Vector3(D.x - yTick, D.y, D.z), new THREE.Vector3(D.x + yTick, D.y, D.z),
    ]);
    anchorY.set(lpG.x, lpG.y + off, yv + (yv >= 0 ? 0.055 : -0.055));

    updateLabelText(stateRef);
    placeLabel(camera, canvas);

    // theta of the arc's TRUE lowest point (z minimum along the sampled arc),
    // used to drive the warm valley-glow hotspot in the tube (arc.js).
    return findLowestTheta(stateRef);
  }

  function updateLabelText(stateRef) {
    if (!labelEl) return;
    // Measure the EFFECTIVE low point (slider value + the swing-direction
    // coupling) — the bracket measures what the scene actually shows, so the
    // number must match the arc's true distance from the ball.
    // (The slider bubble still shows the raw input value; this label is the
    // scene's measurement.)
    const cm = Math.round(effectiveLpx(stateRef) * 100);
    labelEl.textContent = cm === 0 ? '0 cm'
      : cm > 0 ? `+${cm} cm ahead`
      : `−${Math.abs(cm)} cm behind`;
    // §7 — "N cm behind" is a negative state: verdict amber, never ember/gold.
    labelEl.classList.toggle('is-neg', cm < 0);

    // OWNER ORDER 2026-07-12 (#4) — the y label: signed height in cm, one
    // decimal (matches the panel header's y readout), U+2212 for below-ground.
    // Below ground = digging = negative state → is-neg (--warn), like x-behind.
    if (labelYEl) {
      const yCm = stateRef.lowPoint.z * 100;
      labelYEl.textContent = `y ${yCm >= 0 ? '+' : '−'}${Math.abs(yCm).toFixed(1)} cm`;
      labelYEl.classList.toggle('is-neg', yCm < 0);
    }
  }

  const _v = new THREE.Vector3();
  // Project one world anchor to a fixed-position DOM label inside the MAIN
  // camera's region (ORDRE 2 P2 §4 — the region starts RIGHT of the permanent
  // panel; scene.js mirrors the offset onto canvas.__mainRegionLeft, so NDC
  // maps to that region, not the full canvas).
  function placeOne(el, worldAnchor, camera, canvas, transform) {
    if (!el) return;
    _v.copy(worldAnchor).project(camera);
    if (_v.z > 1 || _v.z < -1) { el.hidden = true; return; }
    el.hidden = false;
    const rect = canvas.getBoundingClientRect();
    const rl = canvas.__mainRegionLeft || 0;
    const x = rect.left + rl + (_v.x * 0.5 + 0.5) * (rect.width - rl);
    const y = rect.top + (-_v.y * 0.5 + 0.5) * rect.height;
    el.style.left = `${x.toFixed(1)}px`;
    el.style.top = `${y.toFixed(1)}px`;
    el.style.transform = transform;
  }
  function placeLabel(camera, canvas) {
    placeOne(labelEl, anchor, camera, canvas, brkSign >= 0 ? 'translate(-18%,-50%)' : 'translate(-82%,-50%)');
    placeOne(labelYEl, anchorY, camera, canvas, 'translate(-50%,-50%)');
  }

  return { group, bracketLine, bracketTicks, bracketYLine, bracketYTicks, update, placeLabel, anchor, anchorY };
}

// Sample the arc (same SWEEP_RAD domain as ArcCurve) to find theta at the
// true minimum world-Z point — used to place the valley-glow hotspot exactly
// where the tube is lowest (may differ slightly from thetaAtImpact()).
const SAMPLES = 140;
function findLowestTheta(state) {
  let bestTheta = 0, bestZ = Infinity;
  for (let i = 0; i <= SAMPLES; i++) {
    const theta = -SWEEP_RAD + (2 * SWEEP_RAD) * (i / SAMPLES);
    const p = arcPosition(theta, state);
    if (p.z < bestZ) { bestZ = p.z; bestTheta = theta; }
  }
  return bestTheta;
}
