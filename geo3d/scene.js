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
  // ORDRE 2 P2 §4 — poses re-composed for the two-pane REGION (65% width,
  // taller aspect → wider vfov via updateCameraViewport): dist pulled in so
  // the arc/ball/dial fill the region instead of floating small in extra sky,
  // and DTL's look-at brought back toward the ball so the scene centres in
  // the region rather than composing at the right edge (verified by headless
  // screenshots at 900×470 + 844×390, FACE + DTL, rail open/closed).
  const POSES = {
    face: { az: -70.375, el: 13, dist: 2.45, tx: 0.06, ty: 0, tz: 0.42 },
    dtl: { az: -144.75, el: 11, dist: 2.75, tx: 0, ty: 0.4, tz: 0.4 },
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
    // Compose matrixWorld/matrixWorldInverse NOW (not lazily at the next
    // renderer.render()): DOM-label projections (lowpoint.js placeLabel) run
    // synchronously right after pose writes — before the first render they
    // otherwise read a stale/identity inverse and land the label off-screen
    // (bug surfaced when the idle drift, which used to re-place labels every
    // frame, was retired with the RE-HERO loop).
    camera.updateMatrixWorld(true);
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

  // (ORDRE 2 P2 §6 — the warm EMBER rim/point light was removed: with the
  // delivery arrow unwired, ember in the scene is ~zero at rest. The transient
  // impact FX carry their own light-reads.) In its place: a COOL violet-white
  // fill at the impact zone so the clubhead — content, not decoration — stays
  // legible against the near-black ground. Neutral light, never warm.
  const impactFill = new THREE.PointLight(0xC9CCFF, 0.5, 1.1, 2.0);
  impactFill.position.set(0.05, -0.13, 0.2);
  impactFill.castShadow = false;
  scene.add(impactFill);

  // ── quiet stage floor (ORDRE 2 P2 §6 — star chart retired) ───────────────
  // The floor survives ONLY as a shadow/divot catcher + a soft ground read:
  // a near-black radial grade that fades into the page background at the rim.
  // No graticule, no constellations, no brass ticks — the model (club/ball/
  // arc/dial) still reads without them, so they had to go (minimalism test).
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(6, 96),
    new THREE.MeshStandardMaterial({ map: makeFloorTexture(), roughness: 0.95, metalness: 0.0 })
  );
  floor.receiveShadow = true;
  scene.add(floor);

  // ORDRE 2 P2 §6 — the target sightline demoted to THE one 1px horizon line:
  // a single hairline along +X at very low opacity (glow plane removed). In the
  // FACE pose it reads as the ground/horizon line through the ball.
  const tlCore = new THREE.Mesh(
    new THREE.PlaneGeometry(6.5, 0.008),
    new THREE.MeshBasicMaterial({ color: 0xC7CBF0, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false })
  );
  tlCore.position.set(2.0, 0, 0.002);
  // grouped so FACE-ZOOM (FIX K) can hide/show the target line with one toggle
  const targetLine = new THREE.Group();
  targetLine.add(tlCore);
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
  // ORDRE 2 P2 §4 — TWO-PANE: the main camera renders into the region RIGHT of
  // the permanent strike panel (a scissored sub-viewport of the full-bleed
  // canvas; the canvas itself must stay full-bleed so the panel's microscope
  // viewport — the scissored inset pass — can still paint on the left side).
  // regionLeft is CSS px from the canvas's left edge; geometry.html sets it
  // from the panel's measured width on init/resize. Also mirrored onto
  // canvas.__mainRegionLeft so DOM-label projections (lowpoint.js) map NDC to
  // the REGION, not the full canvas.
  let regionLeft = 0;
  function setMainRegionLeft(px) {
    regionLeft = Math.max(0, Math.round(px || 0));
    canvas.__mainRegionLeft = regionLeft;
    updateCameraViewport();
    invalidate();
  }
  // §4 — camera re-fit: aspect follows the REGION, and below the reference
  // aspect the vertical fov opens so the HORIZONTAL field stays constant —
  // the scene keeps its composed horizontal framing (nothing clips at the
  // sides), centered in the 65% region, instead of being cropped/squeezed.
  const BASE_FOV = 35, REF_ASPECT = 1.8, MAX_FOV = 60;
  function updateCameraViewport() {
    const w = Math.max(1, (canvas.clientWidth || 1) - regionLeft), h = canvas.clientHeight || 1;
    const aspect = w / h;
    camera.aspect = aspect;
    camera.fov = aspect >= REF_ASPECT ? BASE_FOV : Math.min(MAX_FOV,
      THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)) * (REF_ASPECT / aspect))));
    camera.updateProjectionMatrix();
  }
  // §6 — nodes hidden for the MAIN pass only (e.g. the ball's contact ring,
  // which is the microscope panel's contact marker but sub-legible noise at
  // main-scene scale). Same lazy-snapshot/restore contract as the inset pass.
  let mainPassHide = null;
  function setMainPassHide(fn) { mainPassHide = fn; }
  function invalidate() { dirty = true; scheduleFrame(); }
  function scheduleFrame() {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; renderIfDirty(); });
  }
  function renderIfDirty() {
    if (!dirty) return;
    dirty = false;
    resizeIfNeeded();
    const cw = canvas.clientWidth || 1, ch = canvas.clientHeight || 1;
    // Full-canvas wipe first (CSS px; three.js applies pixel ratio internally):
    // with preserveDrawingBuffer:false and the main pass now scissored to the
    // right region, any part of the buffer neither pass paints this frame
    // would otherwise show stale/undefined pixels.
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, cw, ch);
    renderer.clear(true, true, true);
    // main pass — scissored to the region right of the panel (§4: zero overlap)
    const rw = Math.max(1, cw - regionLeft);
    renderer.setViewport(regionLeft, 0, rw, ch);
    renderer.setScissor(regionLeft, 0, rw, ch);
    renderer.setScissorTest(true);
    const hideList = mainPassHide ? (typeof mainPassHide === 'function' ? mainPassHide() : mainPassHide) : [];
    const nodes = Array.isArray(hideList) ? hideList.filter(Boolean) : [];
    const prevVisible = nodes.map((n) => n.visible);
    nodes.forEach((n) => { n.visible = false; });
    renderer.render(scene, camera);
    nodes.forEach((n, i) => { n.visible = prevVisible[i]; });
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, cw, ch);
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
      updateCameraViewport();
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
    setMainRegionLeft, setMainPassHide,
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

// ── ORDRE 2 P2 §6 — QUIET GROUND (star chart retired) ──────────────────────
// A plain violet-black radial grade that fades to the page background at the
// rim, so the finite floor disc has no visible edge. Nothing drawn on it:
// the floor exists to catch shadows/divots and give the club a ground, not to
// decorate. (The old star-chart graticule/constellations/brass ticks failed
// the minimalism test — the model reads without them.)
function makeFloorTexture() {
  const S = 256, half = S / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const grad = g.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, '#110C1C');
  grad.addColorStop(0.5, '#0D0917');
  grad.addColorStop(0.85, '#090711');
  grad.addColorStop(1, '#07060C');
  g.fillStyle = grad;
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
