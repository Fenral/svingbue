/**
 * geo3d/insetview.js — STRIKE-DETAIL inset: a second scissored viewport on the
 * SAME renderer/scene (no second canvas, no second WebGL context), viewed
 * from a dedicated close-up camera so the club/ball/low-point read big while
 * the main view keeps the arc + plane as context (2026-07-03 redesign —
 * "hero the impact, demote the plane").
 *
 * RENDER-ON-DEMAND: this module never schedules its own frames. geo3d/scene.js
 * calls renderPass() once, right after the MAIN camera's renderer.render(),
 * from inside renderIfDirty() — so the inset only redraws when the main view
 * does (window.__sa3d.renderCount stays the single source of truth; idle stays
 * idle). See scene.js's setInsetPass() hook.
 *
 * CAMERA: a separate persistent THREE.PerspectiveCamera (own instance — NEVER
 * the shared sa3d.camera, and never touches facezoom.js's savedRig). Its
 * offset direction is derived from the ADDRESS-pose club orientation via pure
 * engine math (club.js's clubBasisAt/addressTheta — no live club3d/faceAnchor
 * object needed), reusing facezoom.js's tight-impact framing idea (rotate the
 * face-normal offset by an azimuth around world-up, fov ~20-ish, ~0.3-0.6m
 * stand-off) but computed from the ADDRESS theta rather than the live
 * (possibly mid-swing) club pose — so the inset camera stays STILL while a
 * swing plays (matches "second angle on the same scene", not a second replay
 * camera) and only moves when plane/direction/low-point actually change.
 * Aimed at the centroid of the ball, the low point, and the club's address
 * head position, so the whole club+ball+low-point cluster stays reasonably
 * framed instead of the club (which sits ~10cm behind the ball at address)
 * being pushed toward a frame edge.
 *
 * HIDE-DURING-PASS: only the glass plane + target line are hidden for this
 * pass (arc/club/ball/low-point/ground-contact/delivery stay — the inset's
 * whole point is "arc bottom + club + ball + low point", the plane/target
 * line are exactly the two things that would visually swamp a close-up).
 * Visibility is snapshotted and restored so this composes safely even if
 * facezoom.js's OWN (broader) hide-list is active at the same time (e.g. a
 * Hit that reaches the face-zoom moment while this pass keeps running) —
 * whichever ran first still gets its exact prior state back.
 *
 * PROJECTION: projectToInset() mirrors the project()->screen pattern already
 * used by lowpoint.js/groundcontact.js, but scoped to the inset rect's own
 * local pixel space (0,0)-(w,h) instead of the full canvas — geometry.html's
 * annotation SVG sits exactly over that rect with a matching viewBox, so no
 * further offset math is needed at the call site.
 */
import * as THREE from '../vendor/three/build/three.module.js';
import { BALL_RADIUS_M, deg2rad, lpWorld } from '../swing-parameters-and-impact.js';
import { clubBasisAt, addressTheta } from './club.js';

// Tuned by headless screenshot iteration (see task report) — wider stand-off
// and FOV than facezoom.js's tight replay pose, because this view must also
// keep the low-point marker in frame (which can sit up to ~30cm from the
// ball), not just the blade+ball. Azimuth reused verbatim from facezoom.js's
// FACE_ZOOM_AZIMUTH_DEG (the "3/4 front" read that avoids the ball occluding
// the face).
const AZIMUTH_DEG = 32;
const DIST_M = 0.46;
const UP_M = 0.13;
const FOV_DEG = 23;
const NEAR = 0.02;
const FAR = 12;

const _worldUp = new THREE.Vector3(0, 0, 1);

/**
 * @param {object} opts
 *   hideNodes — array OR () => array of THREE.Object3D whose .visible is
 *               flipped false for the duration of renderPass() and restored
 *               after (snapshotted, so this composes with any other hide
 *               system already touching the same nodes).
 */
export function createInsetView({ hideNodes } = {}) {
  const camera = new THREE.PerspectiveCamera(FOV_DEG, 340 / 200, NEAR, FAR);
  camera.up.set(0, 0, 1); // Z-up world, matches sa3d.camera

  // rect is in CSS px, ORIGIN BOTTOM-LEFT (x = px from the canvas's left edge,
  // y = px from the canvas's BOTTOM edge) — this matches WebGL's own
  // setViewport/setScissor convention directly, so geometry.html's rect
  // measurement (canvas.bottom - viewportEl.bottom) needs no further flip.
  let rect = { x: 14, y: 14, w: 340, h: 200 };

  function setRect(r) {
    if (!r) return;
    rect = { x: r.x, y: r.y, w: Math.max(1, r.w), h: Math.max(1, r.h) };
  }
  function getRect() { return rect; }

  function resolveHideNodes() {
    if (!hideNodes) return [];
    const list = typeof hideNodes === 'function' ? hideNodes() : hideNodes;
    return Array.isArray(list) ? list.filter(Boolean) : [];
  }

  /** Recompute the inset camera's pose from the current swing state. Cheap
   * pure-math call (no scene traversal) — safe to call on every rebuild3d(). */
  function updatePose(state) {
    const theta = addressTheta(state);
    const basis = clubBasisAt(theta, state);
    // canonical GLB face axis is local -Z (CHIRALITY fix — see club.js file
    // header); basis.Z is the world dir of local +Z, so the face normal is
    // its negation.
    const faceN = new THREE.Vector3(-basis.Z.x, -basis.Z.y, -basis.Z.z).normalize();
    const offset = faceN.clone().applyAxisAngle(_worldUp, deg2rad(AZIMUTH_DEG)).multiplyScalar(DIST_M);

    // Aim at the centroid of ball + low point + the club's address-pose head
    // position (NOT just ball/low-point) — the club sits a real ~10cm BEHIND
    // the ball at address (REST_BEHIND in club.js), so folding its position
    // into the aim keeps the whole club+ball+low-point cluster centred
    // instead of pushing the club toward a frame edge.
    const ballWorld = new THREE.Vector3(0, 0, BALL_RADIUS_M);
    const lp = lpWorld(state);
    const lpWorldV = new THREE.Vector3(lp.x, lp.y, lp.z);
    const headWorld = new THREE.Vector3(basis.head.x, basis.head.y, basis.head.z);
    const aim = ballWorld.clone().add(lpWorldV).add(headWorld).multiplyScalar(1 / 3);

    const camPos = aim.clone().add(offset).add(new THREE.Vector3(0, 0, UP_M));
    camera.position.copy(camPos);
    camera.up.set(0, 0, 1);
    camera.lookAt(aim);
    // force an immediate matrix update (not deferred to the next
    // renderer.render() call) so projectToInset() reads the CURRENT pose the
    // same frame updatePose() runs, not a stale one from the previous render.
    camera.updateMatrixWorld(true);
  }

  /**
   * Render the SAME scene a second time into a scissored rect using the inset
   * camera. Called from scene.js's renderIfDirty() right after the main
   * camera's render — never schedules its own frame.
   */
  function renderPass(renderer, scene, canvasEl) {
    const pr = renderer.getPixelRatio();
    const x = Math.round(rect.x * pr);
    const y = Math.round(rect.y * pr);
    const w = Math.round(rect.w * pr);
    const h = Math.round(rect.h * pr);
    if (w < 2 || h < 2) return;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    const nodes = resolveHideNodes();
    const prevVisible = nodes.map((n) => n.visible);
    nodes.forEach((n) => { n.visible = false; });

    renderer.setScissorTest(true);
    renderer.setViewport(x, y, w, h);
    renderer.setScissor(x, y, w, h);
    // wipe the corner's leftover MAIN-camera color/depth before drawing this
    // pass's own — without this, stale depth values from the main camera's
    // (unrelated) perspective can incorrectly occlude/clip the inset's
    // fragments in that same screen rectangle.
    renderer.clear(true, true, true);
    renderer.render(scene, camera);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, canvasEl.width, canvasEl.height);

    nodes.forEach((n, i) => { n.visible = prevVisible[i]; });
  }

  // ── screen-space projection into the inset rect's OWN local px (0,0 top-
  // left of the rect, +x right, +y down) — mirrors lowpoint.js/
  // groundcontact.js's project()->screen pattern, scoped to this rect instead
  // of the full canvas so callers can draw straight into an SVG whose viewBox
  // matches the rect 1:1.
  const _v = new THREE.Vector3();
  function projectToInset(worldVec3) {
    _v.copy(worldVec3).project(camera);
    const behind = _v.z > 1 || _v.z < -1;
    return {
      x: (_v.x * 0.5 + 0.5) * rect.w,
      y: (-_v.y * 0.5 + 0.5) * rect.h,
      behind,
    };
  }

  return { camera, setRect, getRect, updatePose, renderPass, projectToInset };
}
