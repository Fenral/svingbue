/**
 * geo3d/ghosts.js — §2.4 star-trail persistence ("the swing paints its own
 * long-exposure"). During the impact window 10–14 ember-tail clubhead
 * silhouettes accumulate along the path; on release they decay over 900ms.
 *
 * Implementation (spec §4 — WKWebView-safe): ONE InstancedMesh reusing the
 * loaded blade's OWN geometry, a single shared additive material, and
 * per-instance colour (ember scaled by age) — no per-ghost meshes, no render
 * targets, hard cap 14, pooled. Each ghost stores the blade's world matrix at
 * sample time; setting instanceMatrix = that world matrix on an identity-
 * parented InstancedMesh reproduces the exact silhouette the clubhead had.
 *
 * Sampling is spatial, not per-frame: a new ghost is laid down only once the
 * swing progress p advances past the next slot boundary, so the 14 ghosts
 * spread evenly along the arc from the top of the downswing to impact rather
 * than clustering in the final slow-mo frames.
 */
import * as THREE from '../vendor/three/build/three.module.js';

const CAP = 14;
const EMBER = new THREE.Color('#FF8A4D');
const ALPHA_NEW = 0.5;   // newest ghost brightness (additive)
const ALPHA_OLD = 0.06;  // oldest ghost brightness before it dies
const DECAY_MS = 900;

export function createGhosts({ getBladeMesh, invalidate }) {
  const group = new THREE.Group();
  group.renderOrder = 3; // under the live club/marker; additive never occludes
  let mesh = null;                 // lazily built once the GLB blade exists
  const ring = [];                 // { m: Matrix4 } newest last, cap CAP
  let decay = 1;                   // global fade multiplier (1 active → 0 dying)
  let decayTween = null;
  const _c = new THREE.Color();

  function ensureMesh() {
    if (mesh) return true;
    const blade = getBladeMesh && getBladeMesh();
    if (!blade || !blade.geometry) return false;
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff, vertexColors: false, transparent: true, opacity: 1,
      toneMapped: false, fog: false, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    mesh = new THREE.InstancedMesh(blade.geometry, mat, CAP);
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CAP * 3), 3);
    mesh.count = 0;
    mesh.frustumCulled = false;
    group.add(mesh);
    return true;
  }

  function rebuild() {
    if (!mesh) return;
    const n = ring.length;
    for (let i = 0; i < n; i++) {
      mesh.setMatrixAt(i, ring[i].m);
      // newest (i=n-1) brightest → oldest (i=0) dimmest ("oldest dying"),
      // all scaled by the global decay multiplier.
      const age = n === 1 ? 1 : i / (n - 1); // 0 oldest … 1 newest
      const a = (ALPHA_OLD + (ALPHA_NEW - ALPHA_OLD) * age) * decay;
      _c.copy(EMBER).multiplyScalar(a);
      mesh.instanceColor.setXYZ(i, _c.r, _c.g, _c.b);
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
  }

  /** Lay down a ghost silhouette from a blade world matrix (Matrix4). */
  function sample(worldMatrix) {
    if (!ensureMesh()) return;
    if (decayTween) { decayTween.kill(); decayTween = null; }
    decay = 1;
    ring.push({ m: worldMatrix.clone() });
    if (ring.length > CAP) ring.shift();
    rebuild();
    if (invalidate) invalidate();
  }

  /** Release: fade every ghost to nothing over 900ms, then clear. */
  function startDecay(gsapRef, reduced) {
    if (!mesh || ring.length === 0) { reset(); return; }
    if (reduced || !gsapRef) { reset(); return; }
    if (decayTween) decayTween.kill();
    const o = { d: 1 };
    decayTween = gsapRef.to(o, {
      d: 0, duration: DECAY_MS / 1000, ease: 'power1.in',
      onUpdate: () => { decay = o.d; rebuild(); if (invalidate) invalidate(); },
      onComplete: () => { decayTween = null; reset(); },
    });
  }

  function reset() {
    if (decayTween) { decayTween.kill(); decayTween = null; }
    ring.length = 0;
    decay = 1;
    if (mesh) { mesh.count = 0; mesh.instanceMatrix.needsUpdate = true; }
    if (invalidate) invalidate();
  }

  return { group, sample, startDecay, reset, count: () => ring.length, CAP };
}
