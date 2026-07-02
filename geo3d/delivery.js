/**
 * geo3d/delivery.js — the "delivery arrow" (owner-approved, 2026-07-02).
 * ONE honest arrow anchored at the ball, pointing along the TRUE club-delivery
 * direction at impact: dir = normalize(tangentAt(thetaAtImpact(state), state)).
 * No visual gain — 1:1: the arrow's yaw IS club path, its pitch IS attack angle.
 *
 * Two groups, transform-only updates (geometry built once, never rebuilt):
 *   - arrowGroup: 3D arrow (cylinder shaft + cone head) at ball-centre height,
 *     neutral ink white (#e8f0fb), unlit MeshBasicMaterial, ~0.5 opacity.
 *   - shadowGroup: flatter "shadow" arrow on the floor (z≈0.002m) = the same
 *     direction projected to the ground plane (horizontal components only,
 *     same origin, same horizontal length), faint path-cyan (#22E3D6, ~0.25).
 * Reading: shadow vs. target line (+X) = PATH. Vertical gap between the arrow
 * and its shadow = ATTACK. No degree labels — those live in the DOM chips.
 *
 * Z-UP world, metres — matches swing-parameters-and-impact.js.
 */
import * as THREE from 'three';
import { tangentAt, thetaAtImpact, BALL_RADIUS_M } from '../swing-parameters-and-impact.js';

// FIX P3 (owner: "the delivery arrow was never implemented" — it was, just too
// subtle to read against the arc/target-line/lowpoint clutter around the ball).
// Length + radii bumped so the arrow reads as an obvious, deliberate mark
// rather than a thin sliver that blends into the target line at typical
// camera angles (yaw is usually close to the +X target line by construction —
// club path is normally single-digit degrees — so a THIN arrow visually
// merges with the cyan target line it's supposed to stand apart from).
const LEN = 0.55;            // arrow total length, metres (was 0.45)
const SHAFT_FRAC = 0.72;     // shaft occupies this much of the length; head gets the rest
const SHAFT_R = 0.0096;      // ×1.6 (was 0.006)
const HEAD_R = 0.0256;       // ×1.6 (was 0.016)
const GROUND_Z = 0.002;

const INK = 0xe8f0fb;
const PATH_CYAN = 0x22e3d6;

const BASE_OPACITY_ARROW = 0.85;  // was 0.5 — the "obvious at rest" ask
const BASE_OPACITY_SHADOW = 0.4;  // was 0.25
const DRAG_OPACITY_ARROW = 1.0;   // was 0.9
const DRAG_OPACITY_SHADOW = 0.55; // scaled up proportionally with the arrow while dragging (was 0.45)
const DRAG_SCALE = 1.15;          // thickness (radial) scale while dragging

/** Build one arrow mesh group: shaft cylinder + cone head, tip at local +X,
 * base (tail) at the local origin. Local +X is the "points along" axis so
 * callers just need to rotate this group to align local +X with `dir`. */
function buildArrowMesh(color, opacity) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, depthWrite: false, toneMapped: false,
  });

  const shaftLen = LEN * SHAFT_FRAC;
  const headLen = LEN * (1 - SHAFT_FRAC);

  // Cylinder/cone geometry is built along local +Y by three.js; rotate -90°
  // about Z so the mesh's own "length" axis becomes local +X (tail at x=0,
  // tip at x=LEN), matching the group-level convention above.
  const shaftGeo = new THREE.CylinderGeometry(SHAFT_R, SHAFT_R, shaftLen, 10, 1);
  const shaft = new THREE.Mesh(shaftGeo, mat);
  shaft.rotation.z = -Math.PI / 2;
  shaft.position.x = shaftLen / 2;

  const headGeo = new THREE.ConeGeometry(HEAD_R, headLen, 12, 1);
  const head = new THREE.Mesh(headGeo, mat);
  head.rotation.z = -Math.PI / 2;
  head.position.x = shaftLen + headLen / 2;

  group.add(shaft, head);
  return { group, mat, shaft, head };
}

export function createDelivery(state) {
  const group = new THREE.Group(); // top-level container, added to the scene once

  const arrow = buildArrowMesh(INK, BASE_OPACITY_ARROW);
  arrow.group.renderOrder = 8;
  arrow.group.position.set(0, 0, BALL_RADIUS_M); // anchored at the ball, ball-centre height

  const shadow = buildArrowMesh(PATH_CYAN, BASE_OPACITY_SHADOW);
  shadow.group.renderOrder = 4; // sits above the floor/target-line but below the raised arrow
  shadow.group.position.set(0, 0, GROUND_Z);

  group.add(arrow.group, shadow.group);

  let visible = true;
  let dragging = false;
  let curDir = { x: 1, y: 0, z: 0 }; // last computed direction (unit vector)

  const _q = new THREE.Quaternion();
  const _from = new THREE.Vector3(1, 0, 0);
  const _dir = new THREE.Vector3();
  const _dirFlat = new THREE.Vector3();

  /** Recompute both arrow orientations from the live state. Transform-only —
   * never touches geometry. Safe to call every applyLive/rebuild3d tick. */
  function update(stateRef) {
    const theta = thetaAtImpact(stateRef);
    const t = tangentAt(theta, stateRef);
    const len = Math.hypot(t.x, t.y, t.z) || 1;
    curDir = { x: t.x / len, y: t.y / len, z: t.z / len };

    // raised arrow: full 3D direction (yaw = path, pitch = attack)
    _dir.set(curDir.x, curDir.y, curDir.z);
    _q.setFromUnitVectors(_from, _dir);
    arrow.group.quaternion.copy(_q);

    // ground shadow: horizontal components only, renormalized so the shadow's
    // horizontal length matches the raised arrow's horizontal length (pure
    // PATH reading — no foreshortening trick, just literally flattened).
    _dirFlat.set(curDir.x, curDir.y, 0);
    if (_dirFlat.lengthSq() < 1e-10) _dirFlat.set(1, 0, 0); // degenerate (straight up/down) guard
    _dirFlat.normalize();
    _q.setFromUnitVectors(_from, _dirFlat);
    shadow.group.quaternion.copy(_q);
  }

  /** Slider-drag emphasis: brighten + thicken. `reduced` = prefers-reduced-motion
   * (snap instantly, no tween — direction updates regardless via update()). */
  function setDragging(isDragging, gsapRef, reduced) {
    dragging = isDragging;
    const targetOpA = isDragging ? DRAG_OPACITY_ARROW : BASE_OPACITY_ARROW;
    const targetOpS = isDragging ? DRAG_OPACITY_SHADOW : BASE_OPACITY_SHADOW;
    const targetScale = isDragging ? DRAG_SCALE : 1;

    if (reduced || !gsapRef) {
      arrow.mat.opacity = targetOpA;
      shadow.mat.opacity = targetOpS;
      arrow.group.scale.set(targetScale, 1, targetScale);
      shadow.group.scale.set(targetScale, 1, targetScale);
      if (group.__invalidate) group.__invalidate();
      return;
    }
    gsapRef.killTweensOf([arrow.mat, shadow.mat]);
    gsapRef.killTweensOf([arrow.group.scale, shadow.group.scale]);
    const onUpdate = () => { if (group.__invalidate) group.__invalidate(); };
    gsapRef.to(arrow.mat, { opacity: targetOpA, duration: 0.18, ease: 'power1.out', onUpdate });
    gsapRef.to(shadow.mat, { opacity: targetOpS, duration: 0.18, ease: 'power1.out', onUpdate });
    gsapRef.to(arrow.group.scale, { x: targetScale, z: targetScale, duration: 0.18, ease: 'power1.out', onUpdate });
    gsapRef.to(shadow.group.scale, { x: targetScale, z: targetScale, duration: 0.18, ease: 'power1.out', onUpdate });
  }

  /** Hide/show during swing playback (150ms fade; reduced-motion: instant). */
  function setVisible(show, gsapRef, reduced) {
    if (visible === show && !reduced) {
      // still allow an in-flight tween to be corrected below; cheap no-op guard
      // only short-circuits when nothing is animating.
    }
    visible = show;
    if (reduced || !gsapRef) {
      group.visible = show;
      arrow.mat.opacity = show ? (dragging ? DRAG_OPACITY_ARROW : BASE_OPACITY_ARROW) : 0;
      shadow.mat.opacity = show ? (dragging ? DRAG_OPACITY_SHADOW : BASE_OPACITY_SHADOW) : 0;
      if (group.__invalidate) group.__invalidate();
      return;
    }
    const targetOpA = show ? (dragging ? DRAG_OPACITY_ARROW : BASE_OPACITY_ARROW) : 0;
    const targetOpS = show ? (dragging ? DRAG_OPACITY_SHADOW : BASE_OPACITY_SHADOW) : 0;
    gsapRef.killTweensOf([arrow.mat, shadow.mat]);
    if (show) group.visible = true; // must be visible before fading in
    const onUpdate = () => { if (group.__invalidate) group.__invalidate(); };
    gsapRef.to(arrow.mat, {
      opacity: targetOpA, duration: 0.15, ease: 'power1.inOut', onUpdate,
      onComplete: () => { if (!show) group.visible = false; },
    });
    gsapRef.to(shadow.mat, { opacity: targetOpS, duration: 0.15, ease: 'power1.inOut', onUpdate });
  }

  return {
    group,
    update,
    setDragging,
    setVisible,
    isVisible: () => visible,
    dir: () => ({ ...curDir }),
    // debug/verification only — opacity + scale of both arrow materials
    debug: () => ({
      arrowOpacity: arrow.mat.opacity, shadowOpacity: shadow.mat.opacity,
      arrowScale: arrow.group.scale.x, shadowScale: shadow.group.scale.x,
    }),
  };
}
