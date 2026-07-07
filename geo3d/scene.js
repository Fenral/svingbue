/**
 * geo3d/scene.js — 3D bedrock for the Geometry screen.
 * Instrument-stage floor, ball, lighting, PMREM environment, render-on-demand
 * loop, and WKWebView context-loss recovery. Ported art-direction from
 * geo-canvas-mock.html (G2 grid + L1 bracket variant, now the only variant).
 *
 * Z-UP world: +X = target line, +Y = away from camera (face-on), +Z = up.
 * Metres. Ground = XY plane at z=0. Matches swing-parameters-and-impact.js.
 */
import * as THREE from '../vendor/three/build/three.module.js';
import { RoomEnvironment } from '../vendor/three/examples/jsm/environments/RoomEnvironment.js';
import { BALL_RADIUS_M, deg2rad } from '../swing-parameters-and-impact.js';

// ── render-on-demand bookkeeping ──────────────────────────────────────────
// window.__sa3d.renderCount increments once per actual renderer.render() call.
// Idle (no dirty flag, no active tween/drag) → renderCount stays static.
window.__sa3d = window.__sa3d || { renderCount: 0 };

export function createScene(canvas) {
  let renderer = makeRenderer(canvas);

  const scene = new THREE.Scene();
  scene.background = null; // transparent — SVG/backdrop shows through where nothing is drawn

  let pmremTex = buildEnvironment(renderer, scene);

  const camera = new THREE.PerspectiveCamera(35, canvas.clientWidth / canvas.clientHeight || 1, 0.05, 60);
  camera.up.set(0, 0, 1); // Z-up world

  // ── camera poses (FACE / DTL), calibrated against the SVG's own computeFit()
  // reframing so the 3D ball lands within a fraction of a px of the SVG ball
  // at the default swing state (plane 60°, dir 0°, lowPoint 4cm ahead/1.6cm).
  // FACE: viewed from the -Y side, slightly elevated. DTL: viewed from the -X
  // area. Both derived via coordinate-descent against getBoundingClientRect()
  // of the live SVG #ball, matching the spec's "matched by eye" requirement.
  //
  // FIX P2 (owner decision, 2026-07-02) — "arc + glass bigger in the main
  // view": the scene read too small/distant. dist reduced ~15% from the
  // original calibration (face 4.2375→3.601875, dtl 4.8875→4.154375) — the
  // look-at target (tx/ty/tz + targetOffset, see applyRig() below) is
  // unaffected by dist, so pulling the camera in along the same az/el ray
  // purely enlarges the framing without re-aiming. Re-verified against the
  // FIX M rail-clearance matrix (900×470/740×416, FACE+DTL) and arc-top
  // clipping at 740×416 — both still pass at the new distance.
  const POSES = {
    face: { az: -70.375, el: 13, dist: 2.72, tx: 0.06, ty: 0, tz: 0.5 },   // #4c: aim LOWER (tz 0.865→0.5) to hero the impact zone (ball/club/low-point) instead of the plane centre
    dtl: { az: -144.75, el: 11, dist: 3.05, tx: 0, ty: 1.2, tz: 0.42 },     // #4c: same — drop look-at toward the ground/impact
  };
  const rig = { ...POSES.face };
  // FIX M — target offset: shifts ONLY the look-at point (not the camera
  // position, which stays derived from rig.tx/ty/tz+az/el/dist as before).
  // This is what actually "makes room" — the camera stays put but tilts to
  // look further up, so the same world content (arc/ball/bracket/turf label)
  // renders higher in the viewport, clearing the docked tune rail. (An
  // earlier version offset BOTH position and look-at by the same vector,
  // which is a rigid translation of the whole rig — it doesn't change
  // framing at all, since camera and target move together. Confirmed via
  // Playwright: ball's screen Y barely moved under that version.)
  // Composes with the FACE/DTL pose's own tx/ty/tz so the tune-rail open/
  // close tween can shift framing without touching the poses themselves; a
  // separate additive object (not baked into rig.tz) so animate3dView's pose
  // tween and the rail's offset tween can run independently/concurrently
  // without fighting — applyRig() always composes pose + offset fresh.
  const targetOffset = { x: 0, y: 0, z: 0 };
  function setTargetOffset(o) {
    if (o.x !== undefined) targetOffset.x = o.x;
    if (o.y !== undefined) targetOffset.y = o.y;
    if (o.z !== undefined) targetOffset.z = o.z;
  }
  function applyRig() {
    const a = deg2rad(rig.az), e = deg2rad(rig.el);
    camera.position.set(
      rig.tx + rig.dist * Math.cos(e) * Math.cos(a),
      rig.ty + rig.dist * Math.cos(e) * Math.sin(a),
      rig.tz + rig.dist * Math.sin(e)
    );
    camera.lookAt(rig.tx + targetOffset.x, rig.ty + targetOffset.y, rig.tz + targetOffset.z);
  }
  applyRig();

  // ── lighting ─────────────────────────────────────────────────────────────
  const key = new THREE.DirectionalLight(0xdfeaf6, 2.2);
  key.position.set(1.6, -2.6, 3.6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -1.6; key.shadow.camera.right = 1.6;
  key.shadow.camera.top = 1.6; key.shadow.camera.bottom = -1.6;
  key.shadow.camera.near = 0.5; key.shadow.camera.far = 12;
  key.shadow.bias = -0.0004;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xaac4e6, 0.5);
  fill.position.set(-2.2, 2.0, 2.0);
  scene.add(fill);

  const hemi = new THREE.HemisphereLight(0x2b3947, 0x05070a, 0.55);
  hemi.position.set(0, 0, 1);
  scene.add(hemi);

  // ── instrument-stage floor (ported from geo-canvas-mock.html) ────────────
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(6, 96),
    new THREE.MeshStandardMaterial({ map: makeFloorTexture(), roughness: 0.95, metalness: 0.0 })
  );
  floor.receiveShadow = true;
  scene.add(floor);

  // target line: thin emissive cyan quad along +X through the ball
  const tlCore = new THREE.Mesh(
    new THREE.PlaneGeometry(6.5, 0.012),
    new THREE.MeshBasicMaterial({ color: 0x7ff4eb, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
  );
  tlCore.position.set(2.0, 0, 0.002);
  const tlGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(6.5, 0.07),
    new THREE.MeshBasicMaterial({ color: 0x22E3D6, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
  );
  tlGlow.position.set(2.0, 0, 0.0018);
  // grouped so FACE-ZOOM (FIX K) can hide/show the target line with one toggle
  const targetLine = new THREE.Group();
  targetLine.add(tlCore, tlGlow);
  scene.add(targetLine);

  // ── ball with procedural dimple normal map ────────────────────────────────
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(BALL_RADIUS_M, 32, 24),
    new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.35, metalness: 0.0,
      normalMap: makeDimpleNormalMap(), normalScale: new THREE.Vector2(0.6, 0.6),
    })
  );
  ball.position.set(0, 0, BALL_RADIUS_M);
  ball.castShadow = true;
  scene.add(ball);

  // ── render-on-demand ────────────────────────────────────────────────────
  let dirty = true;
  let raf = 0;
  // STRIKE-DETAIL INSET (2026-07-03) — a second scissored viewport rendered
  // right after the main camera's pass, driven entirely by geo3d/insetview.js
  // (camera/hide-list/rect all live there; this hook just calls it at the
  // right moment). Stays render-on-demand: insetPass only ever runs as part
  // of renderIfDirty(), never on its own timer, so idle stays idle.
  let insetPass = null;
  function setInsetPass(fn) { insetPass = fn; }
  function invalidate() { dirty = true; scheduleFrame(); }
  function scheduleFrame() {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; renderIfDirty(); });
  }
  function renderIfDirty() {
    if (!dirty) return;
    dirty = false;
    resizeIfNeeded();
    // Defense in depth (2026-07-08): never trust the viewport left behind by a
    // previous frame's extra passes (the strike-detail inset scissors its own
    // viewport and restores after — a bug there once corrupted every
    // subsequent main render on DPR>1 phones). CSS px; three.js applies the
    // pixel ratio internally.
    renderer.setViewport(0, 0, canvas.clientWidth || 1, canvas.clientHeight || 1);
    renderer.render(scene, camera);
    window.__sa3d.renderCount++;
    if (insetPass) insetPass(renderer, scene, canvas);
  }
  function resizeIfNeeded() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    const needResize = canvas.width !== Math.round(w * renderer.getPixelRatio()) ||
      canvas.height !== Math.round(h * renderer.getPixelRatio());
    if (needResize) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }

  // gsap.ticker drives continuous rendering ONLY while something is animating
  // (a tween or an active drag); callers add/remove via startTicking/stopTicking.
  let tickers = 0;
  function tickFrame() { dirty = true; renderIfDirty(); }
  function startTicking() {
    tickers++;
    if (tickers === 1 && window.gsap) window.gsap.ticker.add(tickFrame);
  }
  function stopTicking() {
    tickers = Math.max(0, tickers - 1);
    if (tickers === 0 && window.gsap) window.gsap.ticker.remove(tickFrame);
    invalidate(); // one final render to settle on the resting frame
  }

  // ── WKWebView context-loss handling ────────────────────────────────────
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
  }, false);
  canvas.addEventListener('webglcontextrestored', () => {
    renderer.dispose();
    renderer = makeRenderer(canvas);
    pmremTex = buildEnvironment(renderer, scene);
    scene.environment = pmremTex;
    invalidate();
  }, false);

  invalidate();

  return {
    THREE, scene, camera, rig, POSES, applyRig, renderer,
    targetOffset, setTargetOffset,
    invalidate, startTicking, stopTicking,
    targetLine, floor, ball,
    setInsetPass,
    get renderer() { return renderer; },
  };
}

function makeRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(canvas.clientWidth || 1, canvas.clientHeight || 1, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

function buildEnvironment(renderer, scene) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = tex;
  pmrem.dispose();
  return tex;
}

// ── instrument-stage floor texture (ported verbatim from geo-canvas-mock.html) ─
function makeFloorTexture() {
  const S = 1024, half = S / 2, pxm = half / 6; // 6 m radius
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');

  const grad = g.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, '#161b21');
  grad.addColorStop(0.55, '#10151a');
  grad.addColorStop(0.85, '#0B0F14');
  grad.addColorStop(1, '#0A0E12');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);

  const vin = g.createRadialGradient(half, half, half * 0.55, half, half, half);
  vin.addColorStop(0, 'rgba(0,0,0,0)');
  vin.addColorStop(1, 'rgba(0,0,0,0.5)');
  g.fillStyle = vin;
  g.fillRect(0, 0, S, S);

  g.strokeStyle = 'rgba(230,240,250,0.08)';
  g.lineWidth = 1.5;
  for (const r of [2.0, 3.5, 5.0]) {
    g.beginPath();
    g.arc(half, half, r * pxm, 0, Math.PI * 2);
    g.stroke();
  }

  g.fillStyle = 'rgba(230,240,250,0.25)';
  for (let x = 0.25; x <= 5.25; x += 0.25) {
    const isMajor = Math.abs(x - Math.round(x)) < 1e-6;
    const len = (isMajor ? 0.15 : 0.065) * pxm;
    const w = Math.max(1.5, 0.010 * pxm);
    g.fillRect(half + x * pxm - w / 2, half - len / 2, w, len);
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// ── procedural dimple normal map (512² canvas, grayscale bump → normal) ────
function makeDimpleNormalMap() {
  const S = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  // flat base normal (128,128,255 = +Z)
  g.fillStyle = '#8080ff';
  g.fillRect(0, 0, S, S);

  // scatter dimples on a hex-ish grid, each a small radial "dent" encoded as a
  // fake normal via a radial gradient (darker center in R/G channels tilts
  // the apparent normal inward → convincing dimple without a real heightmap).
  const cell = 22;
  let row = 0;
  for (let y = -cell; y < S + cell; y += cell * 0.87) {
    const offset = (row % 2) * (cell / 2);
    for (let x = -cell + offset; x < S + cell; x += cell) {
      const rad = cell * 0.34;
      const grad = g.createRadialGradient(x, y, 0, x, y, rad);
      grad.addColorStop(0, 'rgba(96,96,190,0.9)');
      grad.addColorStop(0.6, 'rgba(120,120,230,0.5)');
      grad.addColorStop(1, 'rgba(128,128,255,0)');
      g.fillStyle = grad;
      g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
    }
    row++;
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
