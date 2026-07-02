/**
 * geo3d/groundcontact.js — FIX J: turf-contact zone visualization.
 * Shows WHERE ON THE GROUND the club would strike turf before/around the
 * ball, distinct from the existing yellow lowpoint (L1) bracket which shows
 * the ahead/behind-ball measurement of the low point itself.
 *
 * Ground crossings: the arc's z=0 solutions (entry/exit of the club path
 * through the ground plane) exist only when the true low point dips BELOW
 * the ground (lp.z < 0) — i.e. a Fat/Duff strike that would plow into turf.
 * Solving arcPosition(theta).z = 0 for theta (with the small-angle-free closed
 * form used elsewhere in this app):
 *   z(theta) = lp.z + r*sinθ*u.z + r*(1-cosθ)*m.z
 * Since u.z = 0 (planeBasis's `u` always lies in the ground plane) this
 * reduces to z(theta) = lp.z + r*(1-cosθ)*sin(phi) (m.z = sin(phi)), so
 *   cosθ0 = 1 + lp.z / (r * sin(phi))
 * which is exactly the formula specified. Only real when lp.z < 0 and the
 * RHS lands in [-1,1] (a shallow enough dip that the arc actually re-crosses
 * the ground within its swept range); entry = arcPosition(-theta0), exit =
 * arcPosition(+theta0) (the ground-ward dip is symmetric about the true low
 * point's theta only when lp.x/lp.y don't skew it — using arcPosition
 * directly, as specified, keeps this exact regardless).
 *
 * Draws:
 *   - a narrow soil-toned floor strip spanning entry->exit (flat quad, using
 *     each point's ground projection)
 *   - a soil-toned measuring bracket (mirror of lowpoint.js's yellow bracket,
 *     opposite side of the target line) from the entry point's ground
 *     projection to the ball, with a DOM label ("turf N cm before/after ball")
 * Both hide entirely when there's no real ground crossing (lp.z >= 0, or the
 * cosθ0 expression falls outside [-1,1]).
 *
 * groundCrossingTheta0(state) (2026-07-02, owner: "see the club hit the
 * ground BEFORE the ball on a duff") is the same theta0 solve exposed as a
 * free function so geo3d/timeline.js can compute the ground-strike FX's
 * trigger point (p_entry, from entry = arcPosition(-theta0)) without a live
 * gc3d instance or duplicating this closed form.
 */
import * as THREE from 'three';
import { lpWorld, arcPosition, deg2rad } from '../swing-parameters-and-impact.js';

const SOIL = 0x8a5a2b; // clearly distinct from the yellow (0xffd166) lpx bracket
const STRIP_OPACITY = 0.35;
const STRIP_HALF_W = 0.022; // ~4.4cm total width (per spec: ~4-5cm)
const STRIP_Z = 0.003;

export function createGroundContact(state, labelEl) {
  const group = new THREE.Group();

  const stripMat = new THREE.MeshBasicMaterial({
    color: SOIL, transparent: true, opacity: STRIP_OPACITY,
    side: THREE.DoubleSide, depthWrite: false, toneMapped: false,
  });
  const strip = new THREE.Mesh(new THREE.BufferGeometry(), stripMat);
  strip.renderOrder = 2;
  strip.visible = false;

  const bracketMat = new THREE.LineBasicMaterial({ color: SOIL, transparent: true, opacity: 0.85, toneMapped: false });
  const bracketLine = new THREE.Line(new THREE.BufferGeometry(), bracketMat);
  const bracketTicks = new THREE.LineSegments(new THREE.BufferGeometry(), bracketMat);
  bracketLine.visible = false;
  bracketTicks.visible = false;

  group.add(strip, bracketLine, bracketTicks);

  const anchor = new THREE.Vector3();
  let hasContact = false;

  function planeAngleRad(stateRef) { return deg2rad(stateRef.planeAngle); }

  /** Solve for theta0 (ground re-crossing half-angle); null if no real crossing. */
  function solveTheta0(stateRef) {
    const lp = lpWorld(stateRef);
    if (lp.z >= 0) return null;
    const phi = planeAngleRad(stateRef);
    const r = stateRef.radius;
    const sinPhi = Math.sin(phi);
    if (Math.abs(sinPhi) < 1e-9) return null;
    const cosTheta0 = 1 + lp.z / (r * sinPhi);
    if (cosTheta0 < -1 || cosTheta0 > 1) return null;
    return Math.acos(cosTheta0);
  }

  function updateLabelText(stateRef, entryG) {
    if (!labelEl) return;
    const cm = Math.round(entryG.x * 100);
    labelEl.textContent = cm <= 0
      ? `turf ${Math.abs(cm)} cm before ball`
      : `turf ${cm} cm after ball`;
  }

  function buildStrip(entry, exit) {
    const eG = new THREE.Vector3(entry.x, entry.y, STRIP_Z);
    const xG = new THREE.Vector3(exit.x, exit.y, STRIP_Z);
    const dir = new THREE.Vector3().subVectors(xG, eG);
    const len = dir.length();
    let side;
    if (len < 1e-6) {
      side = new THREE.Vector3(0, 1, 0);
    } else {
      dir.normalize();
      side = new THREE.Vector3(-dir.y, dir.x, 0).normalize();
    }
    const hw = STRIP_HALF_W;
    const a = eG.clone().addScaledVector(side, hw);
    const b = eG.clone().addScaledVector(side, -hw);
    const c = xG.clone().addScaledVector(side, -hw);
    const d = xG.clone().addScaledVector(side, hw);
    const verts = new Float32Array([
      a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z,
      a.x, a.y, a.z, c.x, c.y, c.z, d.x, d.y, d.z,
    ]);
    strip.geometry.dispose();
    strip.geometry = new THREE.BufferGeometry();
    strip.geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  }

  function update(stateRef, camera, canvas) {
    const theta0 = solveTheta0(stateRef);
    if (theta0 == null) {
      hasContact = false;
      strip.visible = false;
      bracketLine.visible = false;
      bracketTicks.visible = false;
      if (labelEl) labelEl.hidden = true;
      return;
    }

    hasContact = true;
    const entry = arcPosition(-theta0, stateRef);
    const exit = arcPosition(theta0, stateRef);
    const entryG = new THREE.Vector3(entry.x, entry.y, 0);

    strip.visible = true;
    buildStrip(entry, exit);

    // soil bracket: opposite side of the target line from the yellow lpx
    // bracket (yellow uses off = -0.18; this uses +0.18), entry ground point -> ball (x=0)
    const off = 0.18, z = 0.0045, tick = 0.05;
    const A = new THREE.Vector3(0, off, z);
    const B = new THREE.Vector3(entryG.x, entryG.y + off, z);
    bracketLine.geometry.dispose();
    bracketLine.geometry = new THREE.BufferGeometry().setFromPoints([A, B]);
    bracketLine.visible = true;
    bracketTicks.geometry.dispose();
    bracketTicks.geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(A.x, A.y - tick, z), new THREE.Vector3(A.x, A.y + tick, z),
      new THREE.Vector3(B.x, B.y - tick, z), new THREE.Vector3(B.x, B.y + tick, z),
    ]);
    bracketTicks.visible = true;

    const brkSign = entryG.x >= 0 ? 1 : -1;
    anchor.set(entryG.x - brkSign * 0.001, (entryG.y + off) + 0.12, 0.01);

    updateLabelText(stateRef, entryG);
    placeLabel(camera, canvas, entryG.x >= 0);
  }

  const _v = new THREE.Vector3();
  function placeLabel(camera, canvas, towardPositiveX) {
    if (!labelEl) return;
    if (!hasContact) { labelEl.hidden = true; return; }
    _v.copy(anchor).project(camera);
    if (_v.z > 1 || _v.z < -1) { labelEl.hidden = true; return; }
    labelEl.hidden = false;
    const rect = canvas.getBoundingClientRect();
    const x = rect.left + (_v.x * 0.5 + 0.5) * rect.width;
    const y = rect.top + (-_v.y * 0.5 + 0.5) * rect.height;
    labelEl.style.left = `${x.toFixed(1)}px`;
    labelEl.style.top = `${y.toFixed(1)}px`;
    labelEl.style.transform = towardPositiveX ? 'translate(-18%,-50%)' : 'translate(-82%,-50%)';
  }

  return {
    group, strip, bracketLine, bracketTicks, update,
    entryX: () => (hasContact ? arcPosition(-solveTheta0(state), state).x : null),
    hasContact: () => hasContact,
    // exposed for timeline.js's ground-strike-fires-before-ball-impact FX
    // (2026-07-02): solveTheta0 is the same closed-form ground-crossing solve
    // this module already uses for the turf strip/bracket — re-exporting it
    // (rather than duplicating the formula in timeline.js) keeps the "is there
    // a real ground crossing" question answered in exactly one place.
    solveTheta0,
  };
}

/**
 * Standalone (no live createGroundContact instance needed) ground-crossing
 * solve for a given state — same closed form as solveTheta0() above, exposed
 * as a free function so timeline.js can compute p_entry without depending on
 * geometry.html's gc3d instance (which is DOM-label-bound) or duplicating the
 * math. Returns null when there's no real ground crossing (lp.z >= 0, i.e.
 * Pure/Thin/Whiff, or the cosθ0 expression falls outside [-1,1]).
 */
export function groundCrossingTheta0(state) {
  const lp = lpWorld(state);
  if (lp.z >= 0) return null;
  const phi = deg2rad(state.planeAngle);
  const r = state.radius;
  const sinPhi = Math.sin(phi);
  if (Math.abs(sinPhi) < 1e-9) return null;
  const cosTheta0 = 1 + lp.z / (r * sinPhi);
  if (cosTheta0 < -1 || cosTheta0 > 1) return null;
  return Math.acos(cosTheta0);
}
