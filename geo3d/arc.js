/**
 * geo3d/arc.js — swing-arc tube, wired live to the math engine.
 * ArcCurve samples arcPosition() directly (same source of truth as the SVG).
 * TubeGeometry (140 segments × 8 radial) + additive glow tube.
 * Ink-draw uProgress uniform (default 1 = fully drawn) via onBeforeCompile.
 * Colour (ORDRE 2 P2 §6 — quiet-until-touched): the ember-wire era is retired.
 * The arc at rest is a THIN ink/violet-neutral line (the geometry, not a heat
 * effect); the ONE focal it keeps is the warm-white hotspot at the true low
 * point (informational — it IS the low-point mark now that the marker sphere
 * is gone). Ember stays reserved for transient FX + action chrome.
 * Buffers are preallocated once; slider input rewrites positions in place.
 */
import * as THREE from '../vendor/three/build/three.module.js';
import { arcPosition, SWEEP_RAD } from '../swing-parameters-and-impact.js';

const TUBE_SEG = 140, TUBE_RADIAL = 8;
const CORE_R = 0.0045, GLOW_R = 0.012;     // §6 — «tynn svingbue»
const C_A = new THREE.Color('#B9B3DA');    // violet-neutral head (ink-adjacent)
const C_B = new THREE.Color('#59527A');    // dimmer violet tail
const C_WARM = new THREE.Color('#FFF3E8'); // warm-white low-point hotspot (the one focal — max focal law)

class ArcCurve extends THREE.Curve {
  constructor(state) { super(); this.state = state; }
  getPoint(t, target = new THREE.Vector3()) {
    const theta = -SWEEP_RAD + t * 2 * SWEEP_RAD;
    const p = arcPosition(theta, this.state);
    return target.set(p.x, p.y, p.z);
  }
}

function makeInkMaterial(opts) {
  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true, toneMapped: false, fog: false, // ember stays pure — never tinted by the violet depth fog
    transparent: opts.transparent || false,
    opacity: opts.opacity != null ? opts.opacity : 1,
    blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: opts.depthWrite != null ? opts.depthWrite : true,
  });
  mat.uniforms = { uProgress: { value: 1 } };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uProgress = mat.uniforms.uProgress;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vArcU;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvArcU = uv.x;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uProgress;\nvarying float vArcU;')
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>\n` +
        `float inkAlpha = smoothstep(uProgress - 0.02, uProgress, vArcU) > 0.5 ? 0.0 : smoothstep(uProgress, uProgress - 0.02, vArcU);\n` +
        `gl_FragColor.a *= inkAlpha;`
      );
  };
  return mat;
}

function paintTube(geom, warmT) {
  const count = geom.attributes.position.count;
  const perRing = TUBE_RADIAL + 1;
  const colors = geom.__colorAttr || new Float32Array(count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const ring = Math.min(TUBE_SEG, Math.floor(i / perRing));
    const t = ring / TUBE_SEG;
    c.copy(C_A).lerp(C_B, t);
    if (warmT != null) {
      const theta = -SWEEP_RAD + t * 2 * SWEEP_RAD;
      const w = Math.max(0, 1 - Math.abs(theta - warmT) / 0.26);
      if (w > 0) c.lerp(C_WARM, Math.min(1, w * 1.15));
    }
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  if (!geom.__colorAttr) {
    geom.__colorAttr = colors;
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  } else {
    geom.attributes.color.needsUpdate = true;
  }
}

export function createArc(state) {
  const group = new THREE.Group();
  const curve = new ArcCurve(state);

  const coreGeo = new THREE.TubeGeometry(curve, TUBE_SEG, CORE_R, TUBE_RADIAL, false);
  const coreMat = makeInkMaterial({});
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.castShadow = false;

  const glowGeo = new THREE.TubeGeometry(curve, TUBE_SEG, GLOW_R, TUBE_RADIAL, false);
  const glowMat = makeInkMaterial({ transparent: true, opacity: 0.10, additive: true, depthWrite: false }); // §6 — quieter halo (legibility, not glow-decor)
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.renderOrder = 1;

  paintTube(coreGeo, null);
  paintTube(glowGeo, null);

  group.add(glow, core);

  // frozen "ghost" arc: a dimmed, thin fat-line clone frozen at pointerdown time,
  // shown while dragging, faded 400ms after pointerup.
  const ghostGeo = new THREE.TubeGeometry(curve, TUBE_SEG, CORE_R * 0.85, 6, false);
  const ghostMat = new THREE.MeshBasicMaterial({ color: 0xA7A0C4, transparent: true, opacity: 0, toneMapped: false, fog: false, depthWrite: false });
  const ghost = new THREE.Mesh(ghostGeo, ghostMat);
  ghost.visible = false;
  ghost.renderOrder = 0;
  group.add(ghost);

  function rewrite() {
    // TubeGeometry has no public "recompute in place" API, but curve sampling
    // is cheap (140 samples) and TubeGeometry internally just rebuilds its
    // position/normal/tangent buffers from frenet frames — we replicate that
    // by constructing a fresh geometry's attributes and copying them into the
    // existing BufferAttributes (no new geometry OBJECTS created per input).
    rebuildTubeInPlace(coreGeo, curve, CORE_R);
    rebuildTubeInPlace(glowGeo, curve, GLOW_R);
    paintTube(coreGeo, null);
    paintTube(glowGeo, null);
  }

  function setLowestSegmentGlow(theta) {
    paintTube(coreGeo, theta);
    paintTube(glowGeo, theta);
  }

  function snapshotGhost() {
    rebuildTubeInPlace(ghostGeo, curve, CORE_R * 0.85);
    ghost.visible = true;
    ghost.material.opacity = 0.25;
  }
  function fadeGhost(gsapRef, reduced) {
    if (reduced || !gsapRef) { ghost.visible = false; ghost.material.opacity = 0; return; }
    gsapRef.to(ghost.material, {
      opacity: 0, duration: 0.4, ease: 'power1.out',
      onUpdate: () => { if (group.__invalidate) group.__invalidate(); },
      onComplete: () => { ghost.visible = false; },
    });
  }

  return { group, curve, coreMat, glowMat, rewrite, setLowestSegmentGlow, snapshotGhost, fadeGhost, ghost };
}

// Rebuild a TubeGeometry's position/normal/uv buffers in place from a curve,
// without allocating a new BufferGeometry. Mirrors THREE.TubeGeometry's own
// frenet-frame construction algorithm (r160) so results are identical.
function rebuildTubeInPlace(geom, curve, radius) {
  const tubularSegments = TUBE_SEG, radialSegments = TUBE_RADIAL;
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const pos = geom.attributes.position.array;
  const normal = geom.attributes.normal.array;

  const vertex = new THREE.Vector3();
  const normalVec = new THREE.Vector3();
  const P = new THREE.Vector3();
  let vi = 0, ni = 0;

  for (let i = 0; i <= tubularSegments; i++) {
    curve.getPointAt(i / tubularSegments, P);
    const N = frames.normals[i], B = frames.binormals[i];
    for (let j = 0; j <= radialSegments; j++) {
      const v = (j / radialSegments) * Math.PI * 2;
      const sin = Math.sin(v), cos = -Math.cos(v);
      normalVec.x = (cos * N.x + sin * B.x);
      normalVec.y = (cos * N.y + sin * B.y);
      normalVec.z = (cos * N.z + sin * B.z);
      normalVec.normalize();
      normal[ni++] = normalVec.x; normal[ni++] = normalVec.y; normal[ni++] = normalVec.z;

      vertex.x = P.x + radius * normalVec.x;
      vertex.y = P.y + radius * normalVec.y;
      vertex.z = P.z + radius * normalVec.z;
      pos[vi++] = vertex.x; pos[vi++] = vertex.y; pos[vi++] = vertex.z;
    }
  }
  geom.attributes.position.needsUpdate = true;
  geom.attributes.normal.needsUpdate = true;
  geom.computeBoundingSphere();
}
