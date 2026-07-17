/**
 * geo3d/plane.js — G2 holographic grid swing-plane (ported from geo-canvas-mock.html).
 * Translucent plane (opacity .08) + 4 grid rungs + edge lines, positioned via a
 * transform-only update from planeBasis(state.planeAngle, state.swingDirection)
 * and lpWorld(state) — geometry itself never rebuilt, only the group's matrix.
 * Brief shimmer pulse on slider change (skipped under reduced-motion).
 *
 * EIERORDRE 2026-07-17 — gradereferansene er fjernet helt: ingen tick-ring,
 * ingen 30°-tallkrans, ingen gull-sektor. Igjen står KUN det ene aktive
 * plane-gradtallet (numberMesh), fortsatt drag-tids-gated per OWNER ORDER
 * 2026-07-12 (#2): fades inn mens plane-slideren justeres, ut ~1 s etter
 * slipp. Fades er gsap-tweened (self-stopping, driver __invalidate) —
 * render-on-demand overlever. Reduced-motion: instant show/hide.
 */
import * as THREE from '../vendor/three/build/three.module.js';
import { planeBasis, lpWorld, deg2rad } from '../swing-parameters-and-impact.js';

// §2.1 THE ARMILLARY — brass etched degree ring concentric with the swing
// circle (arc centre = shaftPivot = lp + r·m). The arc literally rides on its
// own graduated dial, so the plane reads as a scientific instrument ring.
const BRASS_CSS = '227,196,104';          // --launch, the etched-instrument role
// OWNER ORDER 2026-07-12 — the subtle glass sheet + grid are RESTORED (whispered):
// P2 §6 removed them for minimalism, but the owner wants a faint glass plane
// BEHIND the swing arc so the camera reads perspective/depth and the scene
// reads as 3D (esp. for the App Store shots). Kept deliberately quiet: a low-
// opacity periwinkle fill + faint grid rungs that give the plane a form in
// space without becoming a technical hologram. «Stille til du rører den» holds
// — it's atmosphere, never chrome.
const PLANE_OPACITY = 0.03;
const GRID_OPACITY = 0.042;
const RUNG_FRACS = [0.22, 0.46, 0.70, 0.94];
// §1 colour mapping: glass-plane grid (legacy teal) → --plane #93A4F2 periwinkle (SYS-11 swing-plane hue)
const PLANE_PERIWINKLE = 0x93A4F2;

// dial-local direction for a dial degree. 0° at the bottom (toward the low
// point); degrees increase toward local +X (the target-line side). Design
// call: this mirrors the old texture's direction so the 45–70° aiming zone
// lands on the OPEN side of the FACE composition (upper right) instead of
// behind the strike-detail card / offscreen top-left. The baked textures use
// the matching canvas convention screenAngle = 90 − deg.
function dialDir(deg) {
  const a = deg2rad(deg);
  return [Math.sin(a), -Math.cos(a)];
}

export function createPlane(state) {
  const group = new THREE.Group();

  // unit quad in the plane's own (a,b) coordinates; local-space geometry is
  // static — only the group transform changes as sliders move. Local X = "a"
  // (across, ±hw), local Y = "b" (up-slope, down..top). Built per-radius once
  // and re-scaled via group children below (geometry rebuilt only if radius
  // itself changes, which it never does live in this UI).
  const planeMat = new THREE.MeshBasicMaterial({
    color: PLANE_PERIWINKLE, transparent: true, opacity: PLANE_OPACITY,
    side: THREE.DoubleSide, depthWrite: false, toneMapped: false, fog: false,
  });
  const planeMesh = new THREE.Mesh(new THREE.BufferGeometry(), planeMat);
  planeMesh.renderOrder = 5; // after opaque geometry, avoids z-fighting with floor/arc
  planeMesh.visible = true; // OWNER ORDER 2026-07-12 — subtle glass restored (depth cue)

  const gridMat = new THREE.LineBasicMaterial({ color: PLANE_PERIWINKLE, transparent: true, opacity: GRID_OPACITY, depthWrite: false, toneMapped: false, fog: false });
  const gridLines = new THREE.LineSegments(new THREE.BufferGeometry(), gridMat);
  gridLines.renderOrder = 6;
  gridLines.visible = true; // OWNER ORDER 2026-07-12 — faint rungs give the glass a form in space

  // ── the dial stack — EIERORDRE 2026-07-17: gradereferansene er FJERNET
  // (stille gull-tick-ring, 30°-tallkransen og gull-sektoren). Igjen står
  // KUN det ene aktive gradtallet (numberMesh), fortsatt drag-tids-gated
  // per OWNER ORDER 2026-07-12 (#2). ────────────────────────────────────────
  const dialGroup = new THREE.Group();

  const numCanvas = document.createElement('canvas');
  numCanvas.width = 192; numCanvas.height = 96;
  const numTex = new THREE.CanvasTexture(numCanvas);
  numTex.colorSpace = THREE.SRGBColorSpace;
  const numberMat = new THREE.MeshBasicMaterial({
    map: numTex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false,
    fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const numberMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.13), numberMat);
  numberMesh.renderOrder = 4;
  numberMesh.visible = false; // OWNER ORDER 2026-07-12 (#2) — no resting numeral
  let numText = '';
  function drawNumber(txt) {
    if (txt === numText) return;
    numText = txt;
    const g = numCanvas.getContext('2d');
    g.clearRect(0, 0, 192, 96);
    g.font = '600 58px Georgia, "Times New Roman", serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = `rgba(${BRASS_CSS},0.95)`;
    g.fillText(txt, 96, 50);
    numTex.needsUpdate = true;
    numberMesh.userData.text = txt; // verification hook (window.__sa.three.ring3d)
  }

  dialGroup.add(numberMesh);
  group.add(planeMesh, gridLines, dialGroup);

  // place the single active numeral for phiDeg (sector/ticks removed 2026-07-17)
  let aimDeg = null;
  function buildAimMarker(phiDeg, r) {
    // the ONE gold number, placed at the swept arc's MID-angle (CAD
    // angle-dimension convention). Design call: a numeral pinned at φ itself
    // clips off the top of the viewport / behind the top-right buttons at high
    // plane angles in the rail-open FACE framing — mid-arc (22–35° for the
    // 45–70° range) stays over open starfield in every pose and rail state.
    const nd = phiDeg / 2, nr = r + 0.13;
    const [nx, ny] = dialDir(nd);
    numberMesh.position.set(nx * nr, ny * nr, -0.005);
    numberMesh.rotation.z = deg2rad(nd);
    numberMesh.userData.deg = phiDeg; // verification hook
    drawNumber(phiDeg + '°');
  }

  function rebuildLocalGeometry(radius) {
    const hw = radius * 0.98, down = radius * 0.04, top = radius * 1.15;
    // corners in local (a,b,0) plane coords — transform (position/quaternion)
    // supplies world placement, so this geometry only needs to change if
    // radius changes (it doesn't, in this UI — RADIUS is a constant).
    const c0 = [-hw, -down, 0], c1 = [hw, -down, 0], c2 = [hw, top, 0], c3 = [-hw, top, 0];
    const verts = new Float32Array([...c0, ...c1, ...c2, ...c0, ...c2, ...c3]);
    planeMesh.geometry.dispose();
    planeMesh.geometry = new THREE.BufferGeometry();
    planeMesh.geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    planeMesh.geometry.computeVertexNormals();

    const edgeSegs = [
      c0, c1, c1, c2, c2, c3, c3, c0,
    ];
    const flat = [];
    for (const f of RUNG_FRACS) flat.push(-hw, top * f, 0.0005, hw, top * f, 0.0005);
    for (const p of edgeSegs) flat.push(p[0], p[1], 0.0005);
    gridLines.geometry.dispose();
    gridLines.geometry = new THREE.BufferGeometry();
    gridLines.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(flat), 3));
  }

  let curRadius = null;
  function update(stateRef) {
    if (curRadius !== stateRef.radius) { rebuildLocalGeometry(stateRef.radius); curRadius = stateRef.radius; }
    const phi = deg2rad(stateRef.planeAngle);
    const phiDeg = Math.round(stateRef.planeAngle);
    if (aimDeg !== phiDeg) { buildAimMarker(phiDeg, stateRef.radius); aimDeg = phiDeg; }

    const { u, m } = planeBasis(stateRef.planeAngle, stateRef.swingDirection);
    const lp = lpWorld(stateRef);
    // plane hinge sits ON the ground (z=0), matching the mock's convention:
    // P(a,b) = lp - lowPoint.z*ẑ + a*u + b*m  (clamped lower edge to z >= 0.002)
    const U = new THREE.Vector3(u.x, u.y, u.z);
    const M = new THREE.Vector3(m.x, m.y, m.z);
    const origin = new THREE.Vector3(lp.x, lp.y, lp.z - stateRef.lowPoint.z);

    group.position.copy(origin);
    // basis: local X -> U, local Y -> M, local Z -> U × M (plane normal)
    const Z = new THREE.Vector3().crossVectors(U, M).normalize();
    const basis = new THREE.Matrix4().makeBasis(U, M, Z);
    group.quaternion.setFromRotationMatrix(basis);
    group.updateMatrixWorld(true);

    // keep the dial stack concentric with the arc as depth (lowPoint.z)
    // shifts it up/down the plane: arc centre local Y = r + lowPoint.z·sinφ.
    const sinPhi = Math.sin(phi);
    dialGroup.position.y = stateRef.radius + stateRef.lowPoint.z * sinPhi;

    clampLowerEdge(planeMesh, group);
    group.updateMatrixWorld(true);
  }

  // Clamp the lower edge of the plane to z >= 0.002 in WORLD space (page-side
  // only) without touching local geometry — nudge the group up along world Z
  // just enough that the lowest transformed corner stays at/above 0.002.
  const MIN_Z = 0.002;
  const _corner = new THREE.Vector3();
  function clampLowerEdge(mesh, grp) {
    const posAttr = mesh.geometry.getAttribute('position');
    if (!posAttr) return;
    let minWorldZ = Infinity;
    for (let i = 0; i < posAttr.count; i++) {
      _corner.fromBufferAttribute(posAttr, i);
      _corner.applyMatrix4(grp.matrixWorld);
      if (_corner.z < minWorldZ) minWorldZ = _corner.z;
    }
    if (minWorldZ < MIN_Z) {
      grp.position.z += (MIN_Z - minWorldZ);
      grp.updateMatrixWorld(true);
    }
  }

  function shimmer() {
    // ORDRE 2 P2 §6 — no-op: the shimmer pulsed the glass/grid opacities, and
    // those meshes are now hidden. Kept as a function so geometry.html's
    // pointerup wiring needs no change.
  }

  // ── aiming-layer fade — the 30° numerals AND (owner order 2026-07-12 #1/#2)
  // the sector band + single numeral, shown while the plane slider is being
  // adjusted, hidden ~1 s after release. One shared fade level so the whole
  // aiming layer breathes as a unit. gsap tweens self-stop and drive
  // __invalidate, so render-on-demand survives (no permanent ticker).
  // Reduced-motion: the states swap instantly (the 1 s linger is timing, not
  // motion — kept). ──────────────────────────────────────────────────────────
  let aimHeld = false, hideTimer = null, fadeTween = null;
  const inval = () => { if (group.__invalidate) group.__invalidate(); };
  const aimFade = { t: 0 }; // 0 = resting (quiet ticks only) · 1 = aiming
  function applyAimFade() {
    numberMat.opacity = aimFade.t;
    numberMesh.visible = aimFade.t > 0.01;
  }
  function fadeNumbersTo(target, gsapRef, reduced) {
    if (fadeTween) { fadeTween.kill(); fadeTween = null; }
    if (reduced || !gsapRef) {
      aimFade.t = target;
      applyAimFade();
      inval();
      return;
    }
    fadeTween = gsapRef.to(aimFade, {
      t: target, duration: target > aimFade.t ? 0.25 : 0.45, ease: 'power2.out',
      onUpdate: () => { applyAimFade(); inval(); },
      onComplete: () => { fadeTween = null; applyAimFade(); inval(); },
    });
  }
  function scheduleHide(gsapRef, reduced) {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { hideTimer = null; fadeNumbersTo(0, gsapRef, reduced); }, 1000);
  }
  function aimHold(gsapRef, reduced) {
    aimHeld = true;
    clearTimeout(hideTimer); hideTimer = null;
    if (aimFade.t < 1) fadeNumbersTo(1, gsapRef, reduced);
  }
  function aimRelease(gsapRef, reduced) {
    aimHeld = false;
    scheduleHide(gsapRef, reduced);
  }
  function aimPulse(gsapRef, reduced) { // keyboard / non-pointer input
    if (aimFade.t < 1 && !fadeTween) fadeNumbersTo(1, gsapRef, reduced);
    if (!aimHeld) scheduleHide(gsapRef, reduced);
  }

  return { group, planeMesh, gridLines, numberMesh, update, shimmer, aimHold, aimRelease, aimPulse };
}
