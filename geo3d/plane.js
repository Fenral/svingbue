/**
 * geo3d/plane.js — G2 holographic grid swing-plane (ported from geo-canvas-mock.html).
 * Translucent plane (opacity .08) + 4 grid rungs + edge lines, positioned via a
 * transform-only update from planeBasis(state.planeAngle, state.swingDirection)
 * and lpWorld(state) — geometry itself never rebuilt, only the group's matrix.
 * Brief shimmer pulse on slider change (skipped under reduced-motion).
 */
import * as THREE from 'three';
import { planeBasis, lpWorld, deg2rad } from '../swing-parameters-and-impact.js';

const PLANE_OPACITY = 0.08;
const GRID_OPACITY = 0.28;
const RUNG_FRACS = [0.22, 0.46, 0.70, 0.94];

export function createPlane(state) {
  const group = new THREE.Group();

  // unit quad in the plane's own (a,b) coordinates; local-space geometry is
  // static — only the group transform changes as sliders move. Local X = "a"
  // (across, ±hw), local Y = "b" (up-slope, down..top). Built per-radius once
  // and re-scaled via group children below (geometry rebuilt only if radius
  // itself changes, which it never does live in this UI).
  const planeMat = new THREE.MeshBasicMaterial({
    color: 0x22e3d6, transparent: true, opacity: PLANE_OPACITY,
    side: THREE.DoubleSide, depthWrite: false, toneMapped: false,
  });
  const planeMesh = new THREE.Mesh(new THREE.BufferGeometry(), planeMat);
  planeMesh.renderOrder = 5; // after opaque geometry, avoids z-fighting with floor/arc

  const gridMat = new THREE.LineBasicMaterial({ color: 0x7ff4eb, transparent: true, opacity: GRID_OPACITY, depthWrite: false, toneMapped: false });
  const gridLines = new THREE.LineSegments(new THREE.BufferGeometry(), gridMat);
  gridLines.renderOrder = 6;

  group.add(planeMesh, gridLines);

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

    clampLowerEdge(planeMesh, group);
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

  return { group, planeMesh, gridLines, update, shimmer };
}
