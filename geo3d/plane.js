/**
 * geo3d/plane.js — G2 holographic grid swing-plane (ported from geo-canvas-mock.html).
 * Translucent plane (opacity .08) + 4 grid rungs + edge lines, positioned via a
 * transform-only update from planeBasis(state.planeAngle, state.swingDirection)
 * and lpWorld(state) — geometry itself never rebuilt, only the group's matrix.
 * Brief shimmer pulse on slider change (skipped under reduced-motion).
 */
import * as THREE from '../vendor/three/build/three.module.js';
import { planeBasis, lpWorld, deg2rad } from '../swing-parameters-and-impact.js';

// §2.1 THE ARMILLARY — brass etched degree ring concentric with the swing
// circle (arc centre = shaftPivot = lp + r·m). The arc literally rides on its
// own graduated dial, so the plane reads as a scientific instrument ring.
const BRASS = 0xE3C468;                   // --launch, the etched-instrument role
const DIAL_HALF_FRAC = 1.16;             // dial plane half-size as a multiple of swing radius (ticks sit at r)
// §2.1 protractor at the hinge (plane∩ground) — shows the plane angle°, engraved.
// Lives in the plane group's local x=0 plane (which contains m=+Y and world-up),
// sweeping from the ground direction to the plane's up direction through φ.
const PROT_R = 0.30;                      // protractor arc radius (m)
const PROT_X = -0.62;                     // offset along the hinge (local X = u) to a clear spot beside the ball

// #4 redesign: the swing plane must stay arc-sized (it contains the arc) but
// visually RECEDE so the impact zone (ball/club/low-point) is the hero — Sivert:
// "glasset er for stort". Fill + grid demoted to a subtle backdrop.
const PLANE_OPACITY = 0.045;
const GRID_OPACITY = 0.13;   // §2.1 — grid demoted (lower opacity) so the brass armillary ring reads as the instrument
const RUNG_FRACS = [0.22, 0.46, 0.70, 0.94];
// §1 colour mapping: glass-plane grid (legacy teal) → --plane #93A4F2 periwinkle (SYS-11 swing-plane hue)
const PLANE_PERIWINKLE = 0x93A4F2;

export function createPlane(state, angleLabelEl) {
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

  const gridMat = new THREE.LineBasicMaterial({ color: PLANE_PERIWINKLE, transparent: true, opacity: GRID_OPACITY, depthWrite: false, toneMapped: false, fog: false });
  const gridLines = new THREE.LineSegments(new THREE.BufferGeometry(), gridMat);
  gridLines.renderOrder = 6;

  // §2.1 — the graduated armillary dial (brass etched degree ring), a
  // canvas-textured plane lying IN the swing plane, concentric with the arc.
  const dialTex = makeArmillaryTexture();
  const dialMat = new THREE.MeshBasicMaterial({
    map: dialTex, transparent: true, opacity: 0.9, depthWrite: false,
    toneMapped: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const dial = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), dialMat);
  dial.renderOrder = 3; // below the arc tube; additive so it never occludes
  dial.position.z = -0.006; // nudge into the plane so it never z-fights the tube riding on it

  // ── §2.1 protractor at the hinge ─────────────────────────────────────────
  const protractor = new THREE.Group();
  protractor.position.set(PROT_X, 0, 0);
  // All brass strokes (arc + bounding rays + graduation ticks) live in ONE
  // LineSegments to keep the resting draw-call budget (§4); the additive wedge
  // fill is the only extra mesh.
  const protLineMat = new THREE.LineBasicMaterial({ color: BRASS, transparent: true, opacity: 0.65, toneMapped: false, fog: false });
  const protWedgeMat = new THREE.MeshBasicMaterial({ color: BRASS, transparent: true, opacity: 0.10, side: THREE.DoubleSide, depthWrite: false, toneMapped: false, fog: false, blending: THREE.AdditiveBlending });
  const protLines = new THREE.LineSegments(new THREE.BufferGeometry(), protLineMat);
  const protWedge = new THREE.Mesh(new THREE.BufferGeometry(), protWedgeMat);
  protLines.renderOrder = 6; protWedge.renderOrder = 2;
  protractor.add(protWedge, protLines);
  const protAnchor = new THREE.Vector3(); // world point the DOM angle plaque pins to

  // Rebuild the protractor geometry for the current plane angle φ (radians).
  // All points are in the protractor group's local frame (x=0 plane): the
  // ground ray = (0,cosφ,−sinφ), the plane-up ray = (0,1,0), swept through φ.
  let protPhi = null;
  function buildProtractor(phi) {
    const dir = (a) => [0, PROT_R * Math.cos(phi - a), -PROT_R * Math.sin(phi - a)];
    const seg = []; // flat endpoint pairs for the single LineSegments
    const push = (a, b) => seg.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    const N = Math.max(8, Math.round((phi * 180 / Math.PI) / 3));
    let prev = dir(0);
    for (let i = 1; i <= N; i++) { const d = dir(phi * (i / N)); push(prev, d); prev = d; }
    // the two bounding rays (ground + plane-up), from centre out past the arc
    const g = dir(0), m = dir(phi);
    push([0, 0, 0], [g[0] * 1.12, g[1] * 1.12, g[2] * 1.12]);
    push([0, 0, 0], [m[0] * 1.12, m[1] * 1.12, m[2] * 1.12]);
    // graduation ticks every 5° (minor) / 15° (major, longer) along the arc
    for (let deg = 0; deg <= phi * 180 / Math.PI + 0.01; deg += 5) {
      const a = deg2rad(deg);
      const rIn = PROT_R - (deg % 15 === 0 ? 0.05 : 0.022);
      const d = dir(a);
      const L = Math.hypot(d[1], d[2]) || 1;
      const ux = 0, uy = d[1] / L, uz = d[2] / L;
      push([ux * PROT_R, uy * PROT_R, uz * PROT_R], [ux * rIn, uy * rIn, uz * rIn]);
    }
    protLines.geometry.dispose();
    protLines.geometry = new THREE.BufferGeometry();
    protLines.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(seg), 3));
    // subtle wedge fill (fan from centre across the arc)
    const wv = [];
    for (let i = 0; i < N; i++) {
      const a0 = phi * (i / N), a1 = phi * ((i + 1) / N);
      const d0 = dir(a0), d1 = dir(a1);
      wv.push(0, 0, 0, d0[0], d0[1], d0[2], d1[0], d1[1], d1[2]);
    }
    protWedge.geometry.dispose();
    protWedge.geometry = new THREE.BufferGeometry();
    protWedge.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(wv), 3));
    // anchor the DOM angle plaque just outside the arc's mid-angle
    const dm = dir(phi / 2);
    protAnchor.set(PROT_X + dm[0] * 1.32, dm[1] * 1.32, dm[2] * 1.32);
  }

  group.add(planeMesh, gridLines, dial, protractor);

  function rebuildLocalGeometry(radius) {
    // size the dial so its etched tick ring sits exactly at the swing radius
    const dialSize = 2 * radius * DIAL_HALF_FRAC;
    dial.geometry.dispose();
    dial.geometry = new THREE.PlaneGeometry(dialSize, dialSize);
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
  function update(stateRef, camera, canvas) {
    if (curRadius !== stateRef.radius) { rebuildLocalGeometry(stateRef.radius); curRadius = stateRef.radius; }
    const phi = deg2rad(stateRef.planeAngle);
    if (protPhi !== phi) { buildProtractor(phi); protPhi = phi; }

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

    // keep the armillary dial concentric with the arc as depth (lowPoint.z)
    // shifts it up/down the plane: arc centre local Y = r + lowPoint.z·sinφ.
    const sinPhi = Math.sin(phi);
    dial.position.y = stateRef.radius + stateRef.lowPoint.z * sinPhi;

    clampLowerEdge(planeMesh, group);
    group.updateMatrixWorld(true);
    updateAngleLabelText(stateRef);
    placeAngleLabel(camera, canvas);
  }

  // ── §2.1 DOM angle plaque at the hinge (mono readout, reuse lowpoint.js
  // Vector3.project pattern). Anchored to protAnchor (plane-group-local coords). ─
  const _wa = new THREE.Vector3();
  function updateAngleLabelText(stateRef) {
    if (angleLabelEl) angleLabelEl.textContent = Math.round(stateRef.planeAngle) + '°';
  }
  function placeAngleLabel(camera, canvas) {
    if (!angleLabelEl || !camera || !canvas) return;
    // camera.matrixWorldInverse can be stale when this runs synchronously
    // before the next render (e.g. during init/rebuild) — refresh it so the
    // plaque projects against the live pose, not last frame's.
    camera.updateMatrixWorld();
    _wa.copy(protAnchor).applyMatrix4(group.matrixWorld).project(camera);
    if (_wa.z > 1 || _wa.z < -1) { angleLabelEl.hidden = true; return; }
    angleLabelEl.hidden = false;
    const rect = canvas.getBoundingClientRect();
    const x = rect.left + (_wa.x * 0.5 + 0.5) * rect.width;
    const y = rect.top + (-_wa.y * 0.5 + 0.5) * rect.height;
    angleLabelEl.style.left = `${x.toFixed(1)}px`;
    angleLabelEl.style.top = `${y.toFixed(1)}px`;
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

  function shimmer(gsapRef, reduced) {
    if (reduced || !gsapRef) return;
    const o = { v: 1.9 };
    gsapRef.killTweensOf(o);
    gsapRef.to(o, {
      v: 1, duration: 0.6, ease: 'power2.out',
      onUpdate: () => {
        gridMat.opacity = GRID_OPACITY * o.v;
        planeMat.opacity = PLANE_OPACITY * Math.min(o.v, 1.6);
        if (group.__invalidate) group.__invalidate();
      },
      onComplete: () => { gridMat.opacity = GRID_OPACITY; planeMat.opacity = PLANE_OPACITY; },
    });
  }

  return { group, planeMesh, gridLines, dial, protractor, update, shimmer, placeAngleLabel };
}

// ── §2.1 armillary dial texture — a brass engraved degree ring drawn on a
// transparent canvas: minor ticks every 5°, longer ticks + serif numerals
// every 15°, plus the thin ring band. Additive brass (--launch). The tick
// ring is drawn at RING_FRAC of the half-canvas so, mapped onto a plane sized
// 2·r·DIAL_HALF_FRAC, the etched ring lands exactly on the swing radius r.
// 0° sits at the bottom (the low point, θ=0) and numbers clockwise. ──────────
function makeArmillaryTexture() {
  const S = 2048, half = S / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, S, S);
  g.translate(half, half);

  const RING = half / DIAL_HALF_FRAC;   // px radius where the etched ring sits (== swing radius r once mapped)
  g.lineCap = 'round';

  // faint brass ring band at the swing radius
  g.beginPath();
  g.arc(0, 0, RING, 0, Math.PI * 2);
  g.strokeStyle = 'rgba(227,196,104,0.30)';
  g.lineWidth = 2.5;
  g.stroke();
  // a second, hair-thin inner guide ring for depth
  g.beginPath();
  g.arc(0, 0, RING - 34, 0, Math.PI * 2);
  g.strokeStyle = 'rgba(227,196,104,0.10)';
  g.lineWidth = 1.5;
  g.stroke();

  // ticks: canvas angle 0 = +x (right); we want 0° at the BOTTOM (screen +y,
  // which is local −Y once the texture is UV-mapped, i.e. toward the low
  // point). Draw at screenAngle = 90° + deg, clockwise.
  for (let deg = 0; deg < 360; deg += 5) {
    const major = deg % 15 === 0;
    const a = (90 + deg) * Math.PI / 180;
    const cos = Math.cos(a), sin = Math.sin(a);
    const outer = RING;
    const inner = RING - (major ? 46 : 18);
    g.beginPath();
    g.moveTo(cos * outer, sin * outer);
    g.lineTo(cos * inner, sin * inner);
    g.strokeStyle = major ? 'rgba(227,196,104,0.62)' : 'rgba(227,196,104,0.34)';
    g.lineWidth = major ? 3.4 : 2.0;
    g.stroke();

    if (major) {
      // engraved serif numeral just inside the major tick
      const nr = RING - 84;
      const nx = cos * nr, ny = sin * nr;
      g.save();
      g.translate(nx, ny);
      g.rotate(a - Math.PI / 2); // upright-ish, tangent to the ring
      g.fillStyle = 'rgba(227,196,104,0.72)';
      g.font = '600 46px Georgia, "Times New Roman", serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(String(deg), 0, 0);
      g.restore();
    }
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}
