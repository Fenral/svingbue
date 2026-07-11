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
  // §1 — subtle violet depth fog (#0B0817) deepens the star-chart floor toward
  // its rim without touching the near-origin arc/ball/club. Additive/emissive
  // elements (arc, target line, fx) opt out via fog:false so ember stays pure.
  scene.fog = new THREE.FogExp2(0x0B0817, 0.058);

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
  // §2.3 / §2.4 — a transient additive azimuth/elevation offset composed on top
  // of the base rig, used by the idle telescope drift and the replay whip. It
  // is ORTHOGONAL to the base pose (free-orbit + FACE/DTL edit rig.az/el
  // directly; magnetic snap glides the base rig) and to facezoom's own hard-cut
  // (which saves/restores rig, never camOffset), so the two never fight.
  const camOffset = { az: 0, el: 0 };
  function setCamOffset(o) {
    if (o.az !== undefined) camOffset.az = o.az;
    if (o.el !== undefined) camOffset.el = o.el;
  }
  function applyRig() {
    const a = deg2rad(rig.az + camOffset.az), e = deg2rad(rig.el + camOffset.el);
    camera.position.set(
      rig.tx + rig.dist * Math.cos(e) * Math.cos(a),
      rig.ty + rig.dist * Math.cos(e) * Math.sin(a),
      rig.tz + rig.dist * Math.sin(e)
    );
    camera.lookAt(rig.tx + targetOffset.x, rig.ty + targetOffset.y, rig.tz + targetOffset.z);
  }
  applyRig();

  // ── lighting (§1 — UV-violet observatory key, ember rim near the ball) ─────
  // Key light shifts from cold #dfeaf6 to a UV-violet #C9CCFF so the whole rig
  // reads under starlight/telescope light rather than a sports HUD.
  const key = new THREE.DirectionalLight(0xC9CCFF, 2.15);
  key.position.set(1.6, -2.6, 3.6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -1.6; key.shadow.camera.right = 1.6;
  key.shadow.camera.top = 1.6; key.shadow.camera.bottom = -1.6;
  key.shadow.camera.near = 0.5; key.shadow.camera.far = 12;
  key.shadow.bias = -0.0004;
  scene.add(key);

  // fill deepens violet
  const fill = new THREE.DirectionalLight(0x8E7ED8, 0.48);
  fill.position.set(-2.2, 2.0, 2.0);
  scene.add(fill);

  // hemisphere: violet sky, near-black violet ground tint (#0A0714)
  const hemi = new THREE.HemisphereLight(0x2C2448, 0x0A0714, 0.55);
  hemi.position.set(0, 0, 1);
  scene.add(hemi);

  // ONE warm ember rim/point light locked near the ball — the club's leading
  // edge catches fire-light at the impact zone (the only heat in the cold room).
  // RE-HERO (2026-07-11): the delivery arrow now owns the scene's ember slot,
  // so this rim is dimmed (1.1 → 0.42) to stay within the ≤3 ember budget — it
  // keeps a faint fire-catch on the clubhead without competing with the hero arrow.
  const emberRim = new THREE.PointLight(0xFF8A4D, 0.42, 0.9, 2.0);
  emberRim.position.set(0.05, -0.13, 0.2);
  emberRim.castShadow = false;
  scene.add(emberRim);

  // ── instrument-stage floor (ported from geo-canvas-mock.html) ────────────
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(6, 96),
    new THREE.MeshStandardMaterial({ map: makeFloorTexture(), roughness: 0.95, metalness: 0.0 })
  );
  floor.receiveShadow = true;
  scene.add(floor);

  // target line = one clean meridian. §1 — cyan → neutral white-alpha
  // (--line-strong grade, additive) so it reads as an engraved sightline, not a laser.
  const tlCore = new THREE.Mesh(
    new THREE.PlaneGeometry(6.5, 0.012),
    new THREE.MeshBasicMaterial({ color: 0xF5F2FF, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false })
  );
  tlCore.position.set(2.0, 0, 0.002);
  const tlGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(6.5, 0.07),
    new THREE.MeshBasicMaterial({ color: 0xC7CBF0, transparent: true, opacity: 0.10, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false })
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
    camOffset, setCamOffset,
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

// ── §2.2 STAR-CHART GROUND ─────────────────────────────────────────────────
// The instrument floor restyled as a star chart: a violet-black ground, a fine
// white-alpha polar graticule (concentric circles + radial spokes) with brass
// major ticks, one clean +X meridian, procedural constellation-style point
// clusters (seeded — NO photo asset), and the kept vignette.
function mulberryLocal(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeFloorTexture() {
  const S = 1024, half = S / 2, pxm = half / 6; // 6 m radius
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');

  // violet-black ground gradient (harmonised with the fog / scene grade)
  const grad = g.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, '#15101F');
  grad.addColorStop(0.55, '#100B1A');
  grad.addColorStop(0.85, '#0A0714');
  grad.addColorStop(1, '#07060C');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);

  // constellation-style point clusters (drawn UNDER the graticule so the grid
  // reads on top). Seeded → identical every load. Kept to the outer band so the
  // impact zone (ball/club/low-point) at the centre stays clean.
  const rng = mulberryLocal(0x5A17C0DE);
  const starDot = (x, y, r, a) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = `rgba(233,238,255,${a})`; g.fill(); };
  for (let c = 0; c < 6; c++) {
    const cAng = rng() * Math.PI * 2;
    const cRad = (2.6 + rng() * 2.6) * pxm;             // 2.6–5.2 m out
    const cx = half + Math.cos(cAng) * cRad, cy = half + Math.sin(cAng) * cRad;
    const n = 3 + Math.floor(rng() * 3);                // 3–5 stars per cluster
    const pts = [];
    for (let i = 0; i < n; i++) {
      const sx = cx + (rng() - 0.5) * 0.9 * pxm;
      const sy = cy + (rng() - 0.5) * 0.9 * pxm;
      pts.push([sx, sy]);
    }
    // faint connecting lines (constellation) — never brass, cool white
    g.strokeStyle = 'rgba(199,203,240,0.13)';
    g.lineWidth = 1.1;
    g.beginPath();
    for (let i = 0; i < pts.length; i++) { const [x, y] = pts[i]; i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
    for (let i = 0; i < pts.length; i++) {
      const bright = rng();
      const r = bright > 0.75 ? 3.4 : 1.7 + rng() * 1.2;
      starDot(pts[i][0], pts[i][1], r, 0.35 + bright * 0.5);
    }
  }
  // a light dusting of lone faint stars across the field
  for (let i = 0; i < 90; i++) {
    const a = rng() * Math.PI * 2, rr = (0.8 + rng() * 5.0) * pxm;
    starDot(half + Math.cos(a) * rr, half + Math.sin(a) * rr, 0.7 + rng() * 0.9, 0.08 + rng() * 0.16);
  }

  // fine white-alpha polar graticule — concentric circles …
  g.strokeStyle = 'rgba(228,236,255,0.05)';
  g.lineWidth = 1.2;
  for (let r = 1; r <= 5.5; r += 1) {
    g.beginPath(); g.arc(half, half, r * pxm, 0, Math.PI * 2); g.stroke();
  }
  // … and radial spokes every 30°
  g.strokeStyle = 'rgba(228,236,255,0.035)';
  for (let a = 0; a < 360; a += 30) {
    const rad = a * Math.PI / 180;
    g.beginPath();
    g.moveTo(half + Math.cos(rad) * 0.5 * pxm, half + Math.sin(rad) * 0.5 * pxm);
    g.lineTo(half + Math.cos(rad) * 5.5 * pxm, half + Math.sin(rad) * 5.5 * pxm);
    g.stroke();
  }

  // brass major ticks where each whole-metre circle meets the +X meridian
  // (the etched-instrument role — graduation, never data).
  g.fillStyle = 'rgba(227,196,104,0.55)';
  for (let x = 0.5; x <= 5.5; x += 0.5) {
    const isMajor = Math.abs(x - Math.round(x)) < 1e-6;
    const len = (isMajor ? 0.16 : 0.07) * pxm;
    const w = Math.max(1.5, 0.010 * pxm);
    g.globalAlpha = isMajor ? 0.6 : 0.32;
    g.fillRect(half + x * pxm - w / 2, half - len / 2, w, len);
  }
  g.globalAlpha = 1;

  // kept vignette
  const vin = g.createRadialGradient(half, half, half * 0.5, half, half, half);
  vin.addColorStop(0, 'rgba(0,0,0,0)');
  vin.addColorStop(1, 'rgba(0,0,0,0.55)');
  g.fillStyle = vin;
  g.fillRect(0, 0, S, S);

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
