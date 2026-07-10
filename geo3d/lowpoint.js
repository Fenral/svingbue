/**
 * geo3d/lowpoint.js — L1 lowpoint variant (ported from geo-canvas-mock.html).
 * Marker dot on the arc's true lowest point + dashed plumb line to ground +
 * measured ground bracket (ball -> lowpoint ground-projection) with a live
 * DOM label ("+8 cm ahead" / "−5 cm behind") anchored via Vector3.project.
 * Marker/bracket use the --q-attack mint hue (0x4DE8D2, §1) — the attack locus.
 * The warm valley-glow hotspot itself lives in arc.js (setLowestSegmentGlow),
 * driven here via the theta of the arc's true lowest point.
 */
import * as THREE from '../vendor/three/build/three.module.js';
import { lpWorld, arcPosition, effectiveLpx, SWEEP_RAD } from '../swing-parameters-and-impact.js';

const ACCENT = 0x4DE8D2; // §1 — low-point marker/bracket → --q-attack mint (the attack locus, SYS-11)

export function createLowpoint(state, labelEl) {
  const group = new THREE.Group();

  const markerMat = new THREE.MeshBasicMaterial({ color: ACCENT, toneMapped: false });
  const marker = new THREE.Mesh(new THREE.SphereGeometry(0.014, 20, 14), markerMat);

  const plumbMat = new THREE.LineDashedMaterial({ color: ACCENT, transparent: true, opacity: 0.85, dashSize: 0.018, gapSize: 0.012, toneMapped: false });
  const plumb = new THREE.Line(new THREE.BufferGeometry(), plumbMat);

  const bracketMat = new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.85, toneMapped: false });
  const bracketLine = new THREE.Line(new THREE.BufferGeometry(), bracketMat);
  const bracketTicks = new THREE.LineSegments(new THREE.BufferGeometry(), bracketMat);

  group.add(marker, plumb, bracketLine, bracketTicks);

  const anchor = new THREE.Vector3(); // world position the DOM label is pinned to
  let brkSign = 1;

  function update(stateRef, camera, canvas) {
    const lp = lpWorld(stateRef);
    const lpV = new THREE.Vector3(lp.x, lp.y, lp.z);
    const lpG = new THREE.Vector3(lp.x, lp.y, 0);

    marker.position.copy(lpV);

    plumb.geometry.dispose();
    plumb.geometry = new THREE.BufferGeometry().setFromPoints([lpV, lpG]);
    plumb.computeLineDistances();

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
    // number must match the yellow marker's true distance from the ball.
    // (The slider bubble still shows the raw input value; this label is the
    // scene's measurement.)
    const cm = Math.round(effectiveLpx(stateRef) * 100);
    labelEl.textContent = cm === 0 ? '0 cm'
      : cm > 0 ? `+${cm} cm ahead`
      : `−${Math.abs(cm)} cm behind`;
  }

  const _v = new THREE.Vector3();
  function placeLabel(camera, canvas) {
    if (!labelEl) return;
    _v.copy(anchor).project(camera);
    if (_v.z > 1 || _v.z < -1) { labelEl.hidden = true; return; }
    labelEl.hidden = false;
    const rect = canvas.getBoundingClientRect();
    const x = rect.left + (_v.x * 0.5 + 0.5) * rect.width;
    const y = rect.top + (-_v.y * 0.5 + 0.5) * rect.height;
    labelEl.style.left = `${x.toFixed(1)}px`;
    labelEl.style.top = `${y.toFixed(1)}px`;
    labelEl.style.transform = brkSign >= 0 ? 'translate(-18%,-50%)' : 'translate(-82%,-50%)';
  }

  return { group, marker, plumb, bracketLine, bracketTicks, update, placeLabel, anchor };
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
