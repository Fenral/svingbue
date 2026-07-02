/**
 * build-club-glb.mjs — Offline club-asset pipeline for StrikeArc.
 *
 * Converts the per-part 7-iron OBJs (CAD export, mm, assembled in a shared
 * coordinate space) into ONE meshopt-compressed GLB with a canonical baked
 * frame:
 *
 *   +Y  up the shaft (shaft axis exactly along +Y)
 *   -Z  out of the face   (face normal is LOCAL -Z, not +Z — see CHIRALITY below)
 *   +X  toward the toe
 *   origin = face sweet spot (centre of face, ~21 mm above the sole)
 *
 * CHIRALITY (fixed 2026-07-02): the base orientation B used to always be
 * MIRROR_X when the source face pointed +Z, which is an IMPROPER rotation
 * (det -1) — it flips the assembly's handedness and bakes a mirror-image
 * (left-handed) club into the GLB. A mirrored blade still LOOKS plausible in
 * isolation, but the toe ends up on the wrong side once placed in the world
 * swing basis (owner-reported symptom: at address in the FACE view the toe
 * pointed toward the golfer instead of toward the camera). B is now ALWAYS
 * ROT_Y_180 (a proper rotation, det +1) regardless of face.sign — the source
 * OBJ's face is reasserted to -Z. This gives the canonical frame documented
 * above: toe +X / face -Z / shaft +Y. Downstream (geo3d/club.js,
 * geo3d/facezoom.js) map local -Z (not +Z) to the world face-normal axis.
 *
 * Node hierarchy in the output:
 *   scene "club7"
 *     ├─ blade        (mesh baked relative to the HOSEL pivot; node
 *     │                translation = hosel position → rotating this node
 *     │                rotates the head around the hosel = lie compensation)
 *     └─ shaftGroup
 *          ├─ shaft
 *          ├─ ferrule
 *          └─ grip
 *
 * Budgets: total ≤ 60k tris, blade ≤ 40k tris, file ≤ 700 KB.
 *
 * Run:  node build-club-glb.mjs   (from svingbue/tools)
 */

import { createRequire } from 'node:module';
import { statSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import {
  weld, simplify, meshopt, prune, dedup, transformMesh, copyToDocument,
  getGLPrimitiveCount, unpartition, getBounds,
} from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';

const require = createRequire(import.meta.url);
const obj2gltf = require('obj2gltf');

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = 'C:/Users/SkotvoldSivertSende/OneDrive - IdrettsKontor/Skrivebord/Apper/3d';
const OUT_PATH = resolve(__dirname, '../assets/club7.glb');

const PARTS = {
  blade: `${SRC_DIR}/uploads_files_4580806_iron_blade_7 (1).obj`, // only "(1)" copy exists (1.8 MB)
  shaft: `${SRC_DIR}/uploads_files_4580806_iron_shaft.obj`,
  ferrule: `${SRC_DIR}/uploads_files_4580806_iron_ferrule.obj`,
  grip: `${SRC_DIR}/uploads_files_4580806_iron_grip.obj`,
};

const CLUB_LENGTH_M = 0.953; // grip end -> sole, along the shaft axis
const SWEET_SPOT_ABOVE_SOLE_MM = 21; // in FINAL metric scale
const BUDGET = { blade: 40000, total: 60000 };

/* ---------------------------------------------------------------- vec/mat */
const v3 = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  scale: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  norm: (a) => v3.scale(a, 1 / v3.len(a)),
};

/** 3x3 (row-major) * vec3 */
const m3v = (m, v) => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];
/** 3x3 * 3x3 (row-major) */
const m3m = (a, b) => {
  const r = new Array(9);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  return r;
};
const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const ROT_Y_180 = [-1, 0, 0, 0, 1, 0, 0, 0, -1];
const MIRROR_X = [-1, 0, 0, 0, 1, 0, 0, 0, 1];

/** Rotation (row-major 3x3) taking unit vector `from` to unit vector `to`. */
function rotationBetween(from, to) {
  const c = v3.dot(from, to);
  if (c > 1 - 1e-12) return I3.slice();
  const axis = v3.norm(v3.cross(from, to));
  const s = Math.sqrt(Math.max(0, 1 - c * c));
  const t = 1 - c;
  const [x, y, z] = axis;
  return [
    t * x * x + c, t * x * y - s * z, t * x * z + s * y,
    t * x * y + s * z, t * y * y + c, t * y * z - s * x,
    t * x * z - s * y, t * y * z + s * x, t * z * z + c,
  ];
}

/** row-major 3x3 R, uniform scale s, translation t -> column-major mat4 */
function composeMat4(R, s, t) {
  return [
    R[0] * s, R[3] * s, R[6] * s, 0,
    R[1] * s, R[4] * s, R[7] * s, 0,
    R[2] * s, R[5] * s, R[8] * s, 0,
    t[0], t[1], t[2], 1,
  ];
}

/* ------------------------------------------------------------- geometry */
function getPositions(doc) {
  const arrays = [];
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives())
      arrays.push(prim.getAttribute('POSITION').getArray());
  const n = arrays.reduce((a, b) => a + b.length, 0);
  const out = new Float32Array(n);
  let o = 0;
  for (const a of arrays) { out.set(a, o); o += a.length; }
  return out;
}

function getTriangles(doc) {
  // [posArray, indexArray][] per primitive
  const tris = [];
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives())
      tris.push([prim.getAttribute('POSITION').getArray(), prim.getIndices()?.getArray()]);
  return tris;
}

function bbox(pos) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3)
    for (let k = 0; k < 3; k++) {
      const v = pos[i + k];
      if (v < min[k]) min[k] = v;
      if (v > max[k]) max[k] = v;
    }
  return { min, max };
}

function centroid(pos) {
  const c = [0, 0, 0];
  for (let i = 0; i < pos.length; i += 3) { c[0] += pos[i]; c[1] += pos[i + 1]; c[2] += pos[i + 2]; }
  return v3.scale(c, 3 / pos.length);
}

/** Principal axis via covariance power iteration. */
function principalAxis(pos) {
  const c = centroid(pos);
  const C = [0, 0, 0, 0, 0, 0]; // xx xy xz yy yz zz
  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i] - c[0], y = pos[i + 1] - c[1], z = pos[i + 2] - c[2];
    C[0] += x * x; C[1] += x * y; C[2] += x * z; C[3] += y * y; C[4] += y * z; C[5] += z * z;
  }
  let v = [0, 1, 0];
  for (let it = 0; it < 64; it++) {
    v = v3.norm([
      C[0] * v[0] + C[1] * v[1] + C[2] * v[2],
      C[1] * v[0] + C[3] * v[1] + C[4] * v[2],
      C[2] * v[0] + C[4] * v[1] + C[5] * v[2],
    ]);
  }
  if (v[1] < 0) v = v3.scale(v, -1); // point "up the shaft"
  return { axis: v, centroid: c };
}

/**
 * Face detection: area-weighted triangle normals of the blade, clustered by
 * sign of n.z among near-face-oriented triangles (|n.z| > 0.55). A lofted
 * 7-iron face normal tilts UP (n.y ≈ sin(loft) > 0); flat back-cavity
 * surfaces do not. Returns { sign, normal, area, faceVerts }.
 */
function detectFace(triSets) {
  const clusters = {
    pos: { area: 0, n: [0, 0, 0], verts: [] },
    neg: { area: 0, n: [0, 0, 0], verts: [] },
  };
  for (const [pos, idx] of triSets) {
    const nTri = idx ? idx.length / 3 : pos.length / 9;
    for (let t = 0; t < nTri; t++) {
      const i0 = idx ? idx[t * 3] * 3 : t * 9;
      const i1 = idx ? idx[t * 3 + 1] * 3 : t * 9 + 3;
      const i2 = idx ? idx[t * 3 + 2] * 3 : t * 9 + 6;
      const a = [pos[i0], pos[i0 + 1], pos[i0 + 2]];
      const b = [pos[i1], pos[i1 + 1], pos[i1 + 2]];
      const c = [pos[i2], pos[i2 + 1], pos[i2 + 2]];
      const n = v3.cross(v3.sub(b, a), v3.sub(c, a));
      const area2 = v3.len(n);
      if (area2 < 1e-9) continue;
      const un = v3.scale(n, 1 / area2);
      if (Math.abs(un[2]) < 0.55) continue;
      const cl = un[2] > 0 ? clusters.pos : clusters.neg;
      cl.area += area2 / 2;
      cl.n = v3.add(cl.n, v3.scale(un, area2 / 2));
      cl.verts.push(a, b, c);
    }
  }
  for (const cl of Object.values(clusters)) if (cl.area > 0) cl.n = v3.norm(cl.n);
  // Face = cluster whose mean normal tilts up (loft). Fall back to area.
  let sign;
  const posUp = clusters.pos.n[1] > 0.15, negUp = clusters.neg.n[1] > 0.15;
  if (posUp && !negUp) sign = +1;
  else if (negUp && !posUp) sign = -1;
  else sign = clusters.pos.area >= clusters.neg.area ? +1 : -1;
  const cl = sign > 0 ? clusters.pos : clusters.neg;
  return { sign, normal: cl.n, area: cl.area, faceVerts: cl.verts, clusters };
}

/* ------------------------------------------------------------------ main */
async function main() {
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'meshopt.decoder': MeshoptDecoder,
      'meshopt.encoder': MeshoptEncoder,
    });
  await MeshoptEncoder.ready;
  await MeshoptSimplifier.ready;

  /* 1 ── convert OBJ -> per-part Documents ------------------------------ */
  const docs = {};
  const report = { parts: {} };
  for (const [name, path] of Object.entries(PARTS)) {
    const glb = await obj2gltf(path, { binary: true, logger: () => {} });
    docs[name] = await io.readBinary(new Uint8Array(glb));
    const tris = docs[name].getRoot().listMeshes()
      .flatMap((m) => m.listPrimitives())
      .reduce((a, p) => a + getGLPrimitiveCount(p), 0);
    report.parts[name] = { trisBefore: tris };
  }

  /* 2 ── analyse the assembly in SOURCE coords (mm, address pose) ------- */
  const P = Object.fromEntries(Object.entries(docs).map(([k, d]) => [k, getPositions(d)]));
  const bbBlade = bbox(P.blade);

  // Shaft axis (PCA over shaft vertices). Source pose: shaft leans toe->heel
  // in the XY plane; +Y is "sky" (assembly is authored at address).
  const { axis: dSrc, centroid: cShaft } = principalAxis(P.shaft);
  const tOf = (p) => v3.dot(p, dSrc);
  const tShaftC = tOf(cShaft);
  const axisPoint = (t) => v3.add(cShaft, v3.scale(dSrc, t - tShaftC));

  // Projections along the shaft axis.
  const projRange = (pos) => {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < pos.length; i += 3) {
      const t = pos[i] * dSrc[0] + pos[i + 1] * dSrc[1] + pos[i + 2] * dSrc[2];
      if (t < lo) lo = t;
      if (t > hi) hi = t;
    }
    return [lo, hi];
  };
  const [, tGripEnd] = projRange(P.grip);
  const [, tHoselTop] = projRange(P.blade); // hosel is the blade's highest point along the axis

  // Ground plane in source pose = lowest blade Y (sole rests on ground).
  const ySole = bbBlade.min[1];
  // Club length: grip end -> ground intersection of the shaft axis (USGA-style).
  const gripTip = axisPoint(tGripEnd);
  const tGround = tGripEnd - (gripTip[1] - ySole) / dSrc[1];
  const lengthSrcMM = tGripEnd - tGround;
  const scaleMM = (CLUB_LENGTH_M * 1000) / lengthSrcMM; // mm -> target mm
  const s = scaleMM / 1000; // source units -> metres

  // Face side.
  const face = detectFace(getTriangles(docs.blade));

  // Sweet spot in source coords: centre of face, 21 mm (final) above sole.
  const ySS = ySole + SWEET_SPOT_ABOVE_SOLE_MM / scaleMM;
  let fx = { lo: Infinity, hi: -Infinity };
  for (const v of face.faceVerts) { if (v[0] < fx.lo) fx.lo = v[0]; if (v[0] > fx.hi) fx.hi = v[0]; }
  const band = face.faceVerts.filter((v) => Math.abs(v[1] - ySS) < 4);
  const xSS = (fx.lo + fx.hi) / 2;
  const bandNear = band.filter((v) => Math.abs(v[0] - xSS) < 15);
  const zSrc = bandNear.length
    ? bandNear.reduce((a, v) => a + v[2], 0) / bandNear.length
    : (face.sign > 0 ? bbox(P.blade).max[2] : bbox(P.blade).min[2]);
  const sweetSrc = [xSS, ySS, zSrc];

  // Hosel pivot: point ON the shaft axis at the top of the hosel.
  const pivotSrc = axisPoint(tHoselTop);

  /* 3 ── canonical transform -------------------------------------------- */
  // Base orientation B: ALWAYS RotY(180) — a PROPER rotation (det +1), never
  // MIRROR_X. Source heel = +X (hosel/ferrule sit at the +X end); RotY(180)
  // sends toe -> +X and reasserts the face at -Z (source face at +Z rotates
  // to -Z; source face at -Z rotates to +Z, so the CLUSTER we treat as "the
  // face" for the sweet-spot/origin calc is always the one now facing -Z —
  // see the sign-aware sweetSrc pick below). Using a proper rotation for
  // BOTH cases (instead of switching to an improper MIRROR_X when
  // face.sign > 0) preserves the source assembly's handedness — no more
  // baked-in mirror/left-handed club. See file header CHIRALITY note.
  const B = ROT_Y_180;
  const mirrored = false;

  // Align shaft axis with +Y after B.
  const dAfterB = v3.norm(m3v(B, dSrc));
  const Ralign = rotationBetween(dAfterB, [0, 1, 0]);
  const R = m3m(Ralign, B);

  const xform = (p) => v3.scale(m3v(R, p), s);
  const origin = xform(sweetSrc);
  const toCanonical = (p) => v3.sub(xform(p), origin);

  const pivotC = toCanonical(pivotSrc);
  const gripEndC = toCanonical(gripTip);
  const lieDeg = (Math.acos(Math.abs(dSrc[1])) * 180) / Math.PI;

  /* 4 ── bake into one Document ----------------------------------------- */
  const doc = new Document();
  doc.createBuffer('club7');
  const scene = doc.createScene('club7');
  doc.getRoot().setDefaultScene(scene);
  const bladeNode = doc.createNode('blade').setTranslation(pivotC);
  const shaftGroup = doc.createNode('shaftGroup');
  scene.addChild(bladeNode).addChild(shaftGroup);

  const M_world = composeMat4(R, s, v3.scale(origin, -1));
  // blade mesh is stored relative to the hosel pivot; node carries the pivot.
  const M_blade = composeMat4(R, s, v3.scale(v3.add(origin, pivotC), -1));

  for (const [name, srcDoc] of Object.entries(docs)) {
    for (const mesh of srcDoc.getRoot().listMeshes())
      transformMesh(mesh, name === 'blade' ? M_blade : M_world);
    // Drop OBJ/MTL materials — materials are assigned in code at runtime.
    for (const prim of srcDoc.getRoot().listMeshes().flatMap((m) => m.listPrimitives()))
      prim.setMaterial(null);
    for (const mat of srcDoc.getRoot().listMaterials()) mat.dispose();

    const meshes = srcDoc.getRoot().listMeshes();
    const map = copyToDocument(doc, srcDoc, meshes);
    const mesh = map.get(meshes[0]);
    mesh.setName(name);
    const node = doc.createNode(name).setMesh(mesh);
    if (name === 'blade') bladeNode.setMesh(mesh); // mesh directly on blade node
    if (name === 'blade') node.dispose();
    else shaftGroup.addChild(node);
  }

  /* 5 ── optimise: weld -> simplify (budget) -> meshopt ------------------ */
  await doc.transform(weld(), dedup());

  const triCount = (mesh) =>
    mesh.listPrimitives().reduce((a, p) => a + getGLPrimitiveCount(p), 0);
  const meshByName = (n) => doc.getRoot().listMeshes().find((m) => m.getName() === n);

  let total = doc.getRoot().listMeshes().reduce((a, m) => a + triCount(m), 0);
  const bladeTris = triCount(meshByName('blade'));
  let ratio = 1;
  if (bladeTris > BUDGET.blade) ratio = Math.min(ratio, BUDGET.blade / bladeTris);
  if (total > BUDGET.total) ratio = Math.min(ratio, BUDGET.total / total);
  if (ratio < 1) {
    await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: ratio * 0.98, error: 0.001 }));
  } else {
    // Gentle lossless-ish pass anyway (removes degenerate/duplicate tris).
    await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: 1.0, error: 0.0002 }));
  }

  for (const name of Object.keys(PARTS))
    report.parts[name].trisAfter = triCount(meshByName(name));

  await doc.transform(prune(), unpartition());
  await doc.transform(meshopt({ encoder: MeshoptEncoder, level: 'medium' }));

  // quantize() (inside meshopt()) bakes a dequantization offset/scale into the
  // node holding each mesh — which would silently move the `blade` node origin
  // away from the hosel pivot. Restore the contract: `blade` stays a clean
  // pivot node at the hosel; the dequant TRS moves to an inner wrapper.
  {
    const bladeQ = doc.getRoot().listNodes().find((n) => n.getName() === 'blade');
    const t = bladeQ.getTranslation();
    bladeQ.setName('bladeMesh');
    bladeQ.setTranslation([t[0] - pivotC[0], t[1] - pivotC[1], t[2] - pivotC[2]]);
    const bladePivot = doc.createNode('blade').setTranslation(pivotC).addChild(bladeQ);
    scene.removeChild(bladeQ);
    scene.addChild(bladePivot);
  }

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, await io.writeBinary(doc));

  /* 6 ── verify by re-reading the output --------------------------------- */
  const check = await io.readBinary(new Uint8Array(await io.writeBinary(doc)));
  const checkScene = check.getRoot().getDefaultScene() || check.getRoot().listScenes()[0];
  const world = getBounds(checkScene);
  const nodeSummaries = [];
  const hierarchy = [];
  const walk = (node, depth) => {
    hierarchy.push(`${'  '.repeat(depth)}${node.getName() || '(unnamed)'}${node.getMesh() ? ` [mesh: ${node.getMesh().getName()}]` : ''}`);
    if (node.getMesh()) {
      const b = getBounds(node);
      nodeSummaries.push({ name: node.getName(), min: b.min, max: b.max });
    }
    for (const c of node.listChildren()) walk(c, depth + 1);
  };
  for (const node of checkScene.listChildren()) walk(node, 0);

  /* 7 ── report ----------------------------------------------------------- */
  const fmt = (v, d = 3) => (Array.isArray(v) ? `[${v.map((x) => x.toFixed(d)).join(', ')}]` : v.toFixed(d));
  const sizeKB = statSync(OUT_PATH).size / 1024;
  console.log('================ club7.glb build report ================');
  console.log(`source units      : mm (assembly authored at address pose)`);
  console.log(`shaft axis (src)  : ${fmt(dSrc)}  (lie tilt ${lieDeg.toFixed(2)} deg from vertical)`);
  console.log(`face side (src)   : ${face.sign > 0 ? '+Z' : '-Z'}  (cluster normal ${fmt(face.normal)}, area ${face.area.toFixed(0)} mm^2)`);
  console.log(`  clusters        : +Z area ${face.clusters.pos.area.toFixed(0)} n=${fmt(face.clusters.pos.n, 2)} | -Z area ${face.clusters.neg.area.toFixed(0)} n=${fmt(face.clusters.neg.n, 2)}`);
  console.log(`orientation fix   : RotY(180) — proper rotation (det +1), canonical face axis = local -Z`);
  console.log(`club length       : source ${lengthSrcMM.toFixed(1)} mm -> scale ${s.toExponential(4)} -> ${(lengthSrcMM * s).toFixed(4)} m (target ${CLUB_LENGTH_M})`);
  console.log(`sweet spot (src)  : ${fmt(sweetSrc, 2)} mm  -> canonical origin [0,0,0]`);
  console.log(`hosel pivot       : canonical ${fmt(pivotC)} m  (blade node translation)`);
  console.log(`grip end          : canonical ${fmt(gripEndC)} m  (should be ~[0, ~0.9, 0])`);
  console.log('--- triangles ---');
  let totAfter = 0;
  for (const [name, p] of Object.entries(report.parts)) {
    totAfter += p.trisAfter;
    console.log(`  ${name.padEnd(8)}: ${String(p.trisBefore).padStart(6)} -> ${String(p.trisAfter).padStart(6)}${name === 'blade' ? `  (budget ${BUDGET.blade})` : ''}`);
  }
  console.log(`  TOTAL   : ${totAfter} (budget ${BUDGET.total})`);
  console.log('--- node hierarchy (as re-read from GLB) ---');
  for (const line of hierarchy) console.log(`  ${line}`);
  console.log('--- output bounds (canonical, m) ---');
  for (const ns of nodeSummaries)
    console.log(`  ${ns.name.padEnd(8)}: min ${fmt(ns.min)} max ${fmt(ns.max)}`);
  console.log(`  WORLD   : min ${fmt(world.min)} max ${fmt(world.max)}`);
  const alongClub = gripEndC[1] - world.min[1];
  console.log(`  grip-end Y -> lowest point Y span: ${alongClub.toFixed(4)} m`);
  console.log(`file size         : ${sizeKB.toFixed(1)} KB (budget 700 KB)`);
  console.log(`output            : ${OUT_PATH}`);

  const ok =
    Math.abs(lengthSrcMM * s - CLUB_LENGTH_M) < CLUB_LENGTH_M * 0.01 &&
    totAfter <= BUDGET.total && report.parts.blade.trisAfter <= BUDGET.blade &&
    sizeKB <= 700;
  console.log(ok ? 'RESULT: PASS' : 'RESULT: FAIL (see above)');
  if (!ok) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
