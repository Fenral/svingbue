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
 *     same origin, same horizontal length), faint q-path blue (--q-path #6FC6FF, ~0.4).
 * Reading: shadow vs. target line (+X) = PATH. Vertical gap between the arrow
 * and its shadow = ATTACK. No degree labels — those live in the DOM chips.
 *
 * Z-UP world, metres — matches swing-parameters-and-impact.js.
 */
import * as THREE from '../vendor/three/build/three.module.js';
import { tangentAt, thetaAtImpact, BALL_RADIUS_M } from '../swing-parameters-and-impact.js';

// RE-HERO (owner interview 2026-07-11): the delivery arrow becomes the scene's
// HERO and its single ember element. It grows to pass visibly THROUGH the ball
// (~1.1 m total — extending BACK behind the ball and well ahead), thicker
// shaft + cone, ember-emissive (#FF8A4D). Direction is still 1:1 with the true
// club-delivery tangent — legibility comes from length/thickness/colour, never
// angle exaggeration. The ball (opaque, ~2cm) occludes the mid-section, so the
// arrow reads as literally passing through it.
const LEN = 1.1;             // arrow total length, metres (hero — spec 1.0–1.2)
const BACK = 0.28;           // how far the tail sits BEHIND the ball anchor along -dir
const SHAFT_FRAC = 0.78;     // shaft occupies this much of the length; head gets the rest
const SHAFT_R = 0.016;       // thicker hero shaft (was 0.0096)
const HEAD_R = 0.044;        // thicker hero cone (was 0.0256)
const GROUND_Z = 0.002;

const EMBER = 0xFF8A4D;      // RE-HERO — arrow body is the scene's single ember (--accent, live engine truth)
const PATH_CYAN = 0x6FC6FF;  // §1 — ground projection cyan → --q-path blue (club-path direction, SYS-11)

const BASE_OPACITY_ARROW = 0.95;  // hero — bright at rest
const BASE_OPACITY_SHADOW = 0.4;  // ground path projection stays low-alpha
const DRAG_OPACITY_ARROW = 1.0;   // brightens during drag (existing causal pulse)
const DRAG_OPACITY_SHADOW = 0.55; // scaled up proportionally with the arrow while dragging
const DRAG_SCALE = 1.12;          // thickness (radial) scale while dragging

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
  // about Z so the mesh's own "length" axis becomes local +X. The whole arrow
  // is shifted back by BACK so the tail sits behind the ball anchor (local
  // x = -BACK) and the tip lands well ahead (x = LEN - BACK) — passing THROUGH
  // the ball at the origin.
  const shaftGeo = new THREE.CylinderGeometry(SHAFT_R, SHAFT_R, shaftLen, 12, 1);
  const shaft = new THREE.Mesh(shaftGeo, mat);
  shaft.rotation.z = -Math.PI / 2;
  shaft.position.x = -BACK + shaftLen / 2;

  const headGeo = new THREE.ConeGeometry(HEAD_R, headLen, 14, 1);
  const head = new THREE.Mesh(headGeo, mat);
  head.rotation.z = -Math.PI / 2;
  head.position.x = -BACK + shaftLen + headLen / 2;

  group.add(shaft, head);
  return { group, mat, shaft, head };
}

export function createDelivery(state) {
  const group = new THREE.Group(); // top-level container, added to the scene once

  const arrow = buildArrowMesh(EMBER, BASE_OPACITY_ARROW);
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
    // verify hook — world tail/tip of the hero arrow (tail sits BACK behind the
    // ball anchor, tip LEN-BACK ahead) so a headless rig can project + measure
    // the on-screen length that visibly crosses the ball.
    endpoints: () => {
      const anchor = new THREE.Vector3(0, 0, BALL_RADIUS_M);
      const d = new THREE.Vector3(curDir.x, curDir.y, curDir.z);
      return {
        tail: anchor.clone().addScaledVector(d, -BACK).toArray(),
        tip: anchor.clone().addScaledVector(d, LEN - BACK).toArray(),
      };
    },
    // debug/verification only — opacity + scale of both arrow materials
    debug: () => ({
      arrowOpacity: arrow.mat.opacity, shadowOpacity: shadow.mat.opacity,
      arrowScale: arrow.group.scale.x, shadowScale: shadow.group.scale.x,
    }),
  };
}
