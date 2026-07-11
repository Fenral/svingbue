/**
 * geo3d/plane.js — G2 holographic grid swing-plane (ported from geo-canvas-mock.html).
 * Translucent plane (opacity .08) + 4 grid rungs + edge lines, positioned via a
 * transform-only update from planeBasis(state.planeAngle, state.swingDirection)
 * and lpWorld(state) — geometry itself never rebuilt, only the group's matrix.
 * Brief shimmer pulse on slider change (skipped under reduced-motion).
 *
 * ØKT 2.3 — QUIET RING redesign of the armillary dial. The dial shows YOUR
 * number, not all numbers:
 *  - Base state: quiet gold ticks (low alpha, larger every 30°), NO numerals.
 *    The ring is dimmed further outside the swing arc's ±SWEEP span — it
 *    lights where the swing lives.
 *  - OWNER ORDER 2026-07-12 (#1/#2) — the dial rests EMPTY: the gold aim-
 *    sector ribbon AND the single plane numeral are DRAG-TIME aiming aids
 *    now, not resting chrome. While the plane slider is being adjusted, the
 *    30° numerals + the sector band 0 → planeAngle + the ONE gold numeral
 *    all fade in together (they answer «where am I aiming») and fade out
 *    ~1 s after release. At rest only the quiet ticks remain («stille til
 *    du rører den»). Fades are gsap-tweened (self-stopping, drives
 *    __invalidate) — render-on-demand survives. Reduced-motion: instant
 *    show/hide (the 1 s linger is timing, not motion — kept).
 * The old hinge protractor + DOM plaque were removed earlier; the resting
 * ring now carries no reading at all.
 */
import * as THREE from '../vendor/three/build/three.module.js';
import { planeBasis, lpWorld, deg2rad, SWEEP_DEG } from '../swing-parameters-and-impact.js';

// §2.1 THE ARMILLARY — brass etched degree ring concentric with the swing
// circle (arc centre = shaftPivot = lp + r·m). The arc literally rides on its
// own graduated dial, so the plane reads as a scientific instrument ring.
const BRASS = 0xE3C468;                   // --launch, the etched-instrument role
const BRASS_CSS = '227,196,104';
const DIAL_HALF_FRAC = 1.16;             // dial plane half-size as a multiple of swing radius (ticks sit at r)

// Ring dimming — the club loop / arc tube occupy θ ∈ ±SWEEP_DEG around the
// low point (dial 0° = bottom). Outside that span (+ a soft falloff) the
// quiet ticks dim further, so the lit part of the ring IS the swing's home.
const DIM_FALLOFF_DEG = 14;
const DIM_FACTOR = 0.30;
function dimAt(deg) {
  let d = ((deg % 360) + 360) % 360;
  if (d > 180) d = 360 - d;              // angular distance to dial 0
  const t = (d - SWEEP_DEG) / DIM_FALLOFF_DEG;
  return t <= 0 ? 1 : t >= 1 ? DIM_FACTOR : 1 + (DIM_FACTOR - 1) * t;
}

// ORDRE 2 P2 §6 — the glass fill + grid are REMOVED from view (minimalism
// test: the quiet dial + arc carry the plane reading; the translucent sheet
// and its rungs were decoration). Geometry/materials are still built (cheap,
// once) and the meshes stay in the group with .visible=false, so the
// clampLowerEdge ground-clearance math and every existing reference
// (hide-lists, hooks) keep working unchanged.
const PLANE_OPACITY = 0.045;
const GRID_OPACITY = 0.13;
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
  planeMesh.visible = false; // ORDRE 2 P2 §6 — glass sheet removed from view

  const gridMat = new THREE.LineBasicMaterial({ color: PLANE_PERIWINKLE, transparent: true, opacity: GRID_OPACITY, depthWrite: false, toneMapped: false, fog: false });
  const gridLines = new THREE.LineSegments(new THREE.BufferGeometry(), gridMat);
  gridLines.renderOrder = 6;
  gridLines.visible = false; // ORDRE 2 P2 §6 — grid rungs removed from view

  // ── the dial stack: quiet ring + fade-in numerals + live aim marker, all
  // children of ONE sub-group kept concentric with the arc in update(). ──────
  const dialGroup = new THREE.Group();

  // 1) quiet ring (static texture — ticks only, arc-span dimming baked in)
  const dialMat = new THREE.MeshBasicMaterial({
    map: makeQuietRingTexture(), transparent: true, opacity: 0.9, depthWrite: false,
    toneMapped: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const dial = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), dialMat);
  dial.renderOrder = 3; // below the arc tube; additive so it never occludes
  dial.position.z = -0.006; // nudge into the plane so it never z-fights the tube riding on it

  // 2) aiming numerals (static texture, opacity animated during s_plane drag)
  const numbersMat = new THREE.MeshBasicMaterial({
    map: makeAimNumbersTexture(), transparent: true, opacity: 0, depthWrite: false,
    toneMapped: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const numbersMesh = new THREE.Mesh(dial.geometry, numbersMat);
  numbersMesh.renderOrder = 3;
  numbersMesh.position.z = -0.0058;
  numbersMesh.visible = false;

  // 3) live aim marker: thin gold sector band 0 → planeAngle + terminal tick
  //    (one mesh) and ONE numeral at the ring's edge (tiny canvas mesh).
  //    OWNER ORDER 2026-07-12 (#1/#2) — drag-time only: starts invisible and
  //    rides the shared aimFade with the 30° numerals (see applyAimFade).
  const AIM_SECTOR_OPACITY = 0.55; // full-on opacity while the slider is held
  const aimMat = new THREE.MeshBasicMaterial({
    color: BRASS, transparent: true, opacity: 0, side: THREE.DoubleSide,
    depthWrite: false, toneMapped: false, fog: false, blending: THREE.AdditiveBlending,
  });
  const aimSector = new THREE.Mesh(new THREE.BufferGeometry(), aimMat);
  aimSector.renderOrder = 4;
  aimSector.position.z = -0.005;
  aimSector.visible = false;

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

  dialGroup.add(dial, numbersMesh, aimSector, numberMesh);
  group.add(planeMesh, gridLines, dialGroup);

  // rebuild the sector band + terminal tick + numeral placement for phiDeg
  let aimDeg = null;
  function buildAimMarker(phiDeg, r) {
    const rIn = r - 0.022, rOut = r - 0.004;
    const v = [];
    const quad = (d0, d1, a, b) => {
      const [x0, y0] = dialDir(d0), [x1, y1] = dialDir(d1);
      v.push(x0 * a, y0 * a, 0, x0 * b, y0 * b, 0, x1 * b, y1 * b, 0,
             x0 * a, y0 * a, 0, x1 * b, y1 * b, 0, x1 * a, y1 * a, 0);
    };
    const n = Math.max(2, Math.ceil(phiDeg / 3));
    for (let i = 0; i < n; i++) quad(phiDeg * (i / n), phiDeg * ((i + 1) / n), rIn, rOut);
    // terminal radial tick at phiDeg — from just inside the band out past the ring
    const [dx, dy] = dialDir(phiDeg);
    const [tx, ty] = [-dy, dx]; // tangent (perpendicular), half-width below
    const hw = 0.0045, tIn = r - 0.075, tOut = r + 0.03;
    v.push(
      dx * tIn - tx * hw, dy * tIn - ty * hw, 0, dx * tOut - tx * hw, dy * tOut - ty * hw, 0, dx * tOut + tx * hw, dy * tOut + ty * hw, 0,
      dx * tIn - tx * hw, dy * tIn - ty * hw, 0, dx * tOut + tx * hw, dy * tOut + ty * hw, 0, dx * tIn + tx * hw, dy * tIn + ty * hw, 0
    );
    aimSector.geometry.dispose();
    aimSector.geometry = new THREE.BufferGeometry();
    aimSector.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(v), 3));
    aimSector.userData.deg = phiDeg; // verification hook
    // the ONE gold number at the ring's edge, placed at the sector's MID-arc
    // (CAD angle-dimension convention: the tick marks the exact angle, the
    // value labels the swept arc). Design call: a numeral pinned at φ itself
    // clips off the top of the viewport / behind the top-right buttons at high
    // plane angles in the rail-open FACE framing — mid-arc (22–35° for the
    // 45–70° range) stays over open starfield in every pose and rail state.
    const nd = phiDeg / 2, nr = r + 0.13;
    const [nx, ny] = dialDir(nd);
    numberMesh.position.set(nx * nr, ny * nr, -0.005);
    numberMesh.rotation.z = deg2rad(nd);
    drawNumber(phiDeg + '°');
  }

  function rebuildLocalGeometry(radius) {
    // size the dial so its etched tick ring sits exactly at the swing radius
    const dialSize = 2 * radius * DIAL_HALF_FRAC;
    dial.geometry.dispose();
    dial.geometry = new THREE.PlaneGeometry(dialSize, dialSize);
    numbersMesh.geometry = dial.geometry; // shared — numerals texture uses the same ring mapping
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
    numbersMat.opacity = aimFade.t;
    numberMat.opacity = aimFade.t;
    aimMat.opacity = AIM_SECTOR_OPACITY * aimFade.t;
    const on = aimFade.t > 0.01;
    numbersMesh.visible = on;
    numberMesh.visible = on;
    aimSector.visible = on;
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

  return { group, planeMesh, gridLines, dial, numbersMesh, aimSector, numberMesh, update, shimmer, aimHold, aimRelease, aimPulse };
}

// ── QUIET RING texture — gold ticks only, drawn on a transparent canvas:
// minor ticks every 5° (low alpha), larger/brighter ticks every 30°, plus a
// faint ring band. NO numerals (they live on the separate fade layer). The
// alpha of every stroke is scaled by dimAt(deg) so the sector the swing arc
// never occupies recedes further. The tick ring is drawn at RING_FRAC of the
// half-canvas so, mapped onto a plane sized 2·r·DIAL_HALF_FRAC, the etched
// ring lands exactly on the swing radius r. 0° sits at the bottom (the low
// point, θ=0). ───────────────────────────────────────────────────────────────
function makeQuietRingTexture() {
  const S = 2048, half = S / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, S, S);
  g.translate(half, half);

  const RING = half / DIAL_HALF_FRAC;   // px radius where the etched ring sits (== swing radius r once mapped)
  g.lineCap = 'round';

  // faint ring band at the swing radius + hair-thin inner guide, drawn in 3°
  // segments so the arc-span dimming can vary along the circumference.
  for (let deg = 0; deg < 360; deg += 3) {
    const dim = dimAt(deg + 1.5);
    const a0 = (90 + deg) * Math.PI / 180, a1 = (90 + deg + 3.2) * Math.PI / 180;
    g.beginPath();
    g.arc(0, 0, RING, a0, a1);
    g.strokeStyle = `rgba(${BRASS_CSS},${(0.16 * dim).toFixed(3)})`;
    g.lineWidth = 2.5;
    g.stroke();
    g.beginPath();
    g.arc(0, 0, RING - 34, a0, a1);
    g.strokeStyle = `rgba(${BRASS_CSS},${(0.055 * dim).toFixed(3)})`;
    g.lineWidth = 1.5;
    g.stroke();
  }

  // ticks: canvas angle 0 = +x (right); we want 0° at the BOTTOM (screen +y,
  // which is local −Y once the texture is UV-mapped, i.e. toward the low
  // point). Draw at screenAngle = 90° + deg.
  for (let deg = 0; deg < 360; deg += 5) {
    const major = deg % 30 === 0;
    const dim = dimAt(deg);
    const a = (90 + deg) * Math.PI / 180;
    const cos = Math.cos(a), sin = Math.sin(a);
    const outer = RING;
    const inner = RING - (major ? 52 : 18);
    g.beginPath();
    g.moveTo(cos * outer, sin * outer);
    g.lineTo(cos * inner, sin * inner);
    g.strokeStyle = `rgba(${BRASS_CSS},${((major ? 0.40 : 0.15) * dim).toFixed(3)})`;
    g.lineWidth = major ? 3.6 : 2.0;
    g.stroke();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

// ── aiming numerals texture — engraved serif numerals every 30° just inside
// the ring, on their own transparent layer so the whole set can fade in while
// the plane slider moves. Deliberately NOT arc-span dimmed: these exist to be
// read while aiming (45–70° reaches outside the lit span). ───────────────────
function makeAimNumbersTexture() {
  const S = 2048, half = S / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, S, S);
  g.translate(half, half);

  const RING = half / DIAL_HALF_FRAC;
  for (let deg = 0; deg < 360; deg += 30) {
    const a = (90 - deg) * Math.PI / 180; // mirrored — see dialDir()
    const nr = RING - 84;
    const nx = Math.cos(a) * nr, ny = Math.sin(a) * nr;
    g.save();
    g.translate(nx, ny);
    g.rotate(a - Math.PI / 2); // upright-ish, tangent to the ring
    g.fillStyle = `rgba(${BRASS_CSS},0.8)`;
    g.font = '600 46px Georgia, "Times New Roman", serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(String(deg), 0, 0);
    g.restore();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}
