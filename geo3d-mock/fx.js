/**
 * geo3d/fx.js — swing-timeline visual effects for the 3D geometry scene.
 * All effects are driven per-frame from timeline.js's onUpdate (no internal
 * rAF/ticker of their own) so they stay in lockstep with the single GSAP
 * clock that already drives render-on-demand via scene.js startTicking().
 *
 *  - TRAIL: ribbon strip built from a ring buffer of clubhead positions +
 *    shaft directions sampled once per rendered frame during down→finish.
 *    Additive cyan, alpha fades with age, one draw call, hidden when idle.
 *  - DIVOT: two InstancedMesh pools (grass boxes / soil icosahedra, ≤64
 *    total) with CPU parabolic motion updated from the timeline's onUpdate.
 *    Seeded via mulberry32 so identical swing settings replay identically.
 *  - IMPACT FLASH: small additive sprite pulse at the ball at impact.
 *  - Band-dependent choreography (Duff/Fat/Pure/Thin/Whiff) per the spec.
 *  - GROUND-STRIKE (2026-07-02, owner: "see the club hit the ground BEFORE
 *    the ball on a duff"): fireGroundContact(band, {entryV,...}) reuses this
 *    same seeded divot pool to erupt turf at the arc's ground-crossing ENTRY
 *    point (groundcontact.js's theta0), fired by timeline.js EARLIER in the
 *    downswing than fireImpact()'s ball-contact burst — the whole point is
 *    the temporal ordering (ground first, ball second) on Duff/Fat strikes.
 */
import * as THREE from '../vendor/three/build/three.module.js';
import { BALL_RADIUS_M } from '../swing-parameters-and-impact.js';

// ── seeded RNG (mulberry32) — deterministic replay for identical settings ──
export function hashSeed(a, b, c, d) {
  let h = 2166136261 >>> 0;
  for (const v of [a, b, c, d]) {
    const s = String(Math.round(v * 1e6));
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return h >>> 0;
}
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ══════════════════════════════════════════════════════════════════════════
// TRAIL — ribbon strip from a ring buffer of recent clubhead placements
// ══════════════════════════════════════════════════════════════════════════
const TRAIL_MAX = 24;
const TRAIL_HALF_W = 0.018; // ribbon half-width (m)

function createTrail() {
  const maxVerts = TRAIL_MAX * 2;
  const positions = new Float32Array(maxVerts * 3);
  const colors = new Float32Array(maxVerts * 3);
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
  const indices = [];
  for (let i = 0; i < TRAIL_MAX - 1; i++) {
    const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
    indices.push(a, b, c, b, d, c);
  }
  geom.setIndex(indices);
  geom.setDrawRange(0, 0);
  geom.__ready = true;

  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, toneMapped: false,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.frustumCulled = false;
  mesh.visible = false;
  mesh.renderOrder = 4;

  const ring = []; // { pos: Vector3, dir: Vector3 (shaft dir), t: age-index }
  const cyan = new THREE.Color('#22E3D6');
  const _up = new THREE.Vector3(0, 0, 1);
  const _side = new THREE.Vector3();

  function reset() {
    ring.length = 0;
    geom.setDrawRange(0, 0);
    mesh.visible = false;
  }

  // sample once per rendered frame; posV = clubhead world pos, dirV = shaft
  // direction (up-the-shaft unit vector) used to orient the ribbon's width.
  function sample(posV, dirV) {
    ring.push({ pos: posV.clone(), dir: dirV.clone() });
    if (ring.length > TRAIL_MAX) ring.shift();
    rebuild();
  }

  function rebuild() {
    const n = ring.length;
    if (n < 2) { mesh.visible = false; return; }
    mesh.visible = true;
    const posAttr = geom.attributes.position;
    const colAttr = geom.attributes.color;
    for (let i = 0; i < n; i++) {
      const s = ring[i];
      // ribbon side vector: shaft-dir × view-agnostic up, so the strip reads
      // as a flat blade-trail regardless of camera pose.
      _side.crossVectors(s.dir, _up);
      if (_side.lengthSq() < 1e-8) _side.set(1, 0, 0); else _side.normalize();
      const age = (n - 1 - i) / (TRAIL_MAX - 1); // 0 = newest, 1 = oldest
      const alpha = Math.max(0, 1 - age) * 0.55;
      const vi = i * 2;
      posAttr.setXYZ(vi, s.pos.x + _side.x * TRAIL_HALF_W, s.pos.y + _side.y * TRAIL_HALF_W, s.pos.z + _side.z * TRAIL_HALF_W);
      posAttr.setXYZ(vi + 1, s.pos.x - _side.x * TRAIL_HALF_W, s.pos.y - _side.y * TRAIL_HALF_W, s.pos.z - _side.z * TRAIL_HALF_W);
      colAttr.setXYZ(vi, cyan.r, cyan.g, cyan.b);
      colAttr.setXYZ(vi + 1, cyan.r, cyan.g, cyan.b);
      // stash alpha in a parallel array via vertex color luminance trick isn't
      // reliable, so instead drive per-vertex alpha through geometry morph is
      // overkill — use a simple per-strip opacity approximation instead below.
      void alpha;
    }
    geom.setDrawRange(0, (n - 1) * 6);
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    // approximate age fade as a single material opacity (newest-weighted);
    // simplest correct-enough approach for a 24-sample ring within one downswing.
    mat.opacity = Math.min(0.6, 0.22 + n / TRAIL_MAX * 0.38);
  }

  return { mesh, reset, sample, get length() { return ring.length; } };
}

// ══════════════════════════════════════════════════════════════════════════
// DIVOT — InstancedMesh pools (grass + soil), CPU parabolic motion
// ══════════════════════════════════════════════════════════════════════════
const DIVOT_MAX_GRASS = 40;
const DIVOT_MAX_SOIL = 24; // total ≤ 64
const GRASS_COLORS = ['#5ab85f', '#4aa353', '#3f9b46', '#73c878'];
const SOIL_COLORS = ['#6e4a2c', '#5a3c22', '#43301c', '#7d5733'];
const GRAVITY = 2.6; // m/s^2, tuned for a readable arc within ~1s at this scale

function createDivot() {
  const grassGeo = new THREE.BoxGeometry(0.006, 0.003, 0.016);
  const soilGeo = new THREE.IcosahedronGeometry(0.005, 0);
  const grassMat = new THREE.MeshBasicMaterial({ vertexColors: false, toneMapped: false });
  const soilMat = new THREE.MeshBasicMaterial({ vertexColors: false, toneMapped: false });
  // per-instance color via instanceColor
  const grassMesh = new THREE.InstancedMesh(grassGeo, grassMat, DIVOT_MAX_GRASS);
  const soilMesh = new THREE.InstancedMesh(soilGeo, soilMat, DIVOT_MAX_SOIL);
  grassMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(DIVOT_MAX_GRASS * 3), 3);
  soilMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(DIVOT_MAX_SOIL * 3), 3);
  grassMesh.count = 0; soilMesh.count = 0;
  grassMesh.frustumCulled = false; soilMesh.frustumCulled = false;
  grassMesh.renderOrder = 3; soilMesh.renderOrder = 3;

  // scar decal: dark ellipse on the floor (Duff only)
  const scarGeo = new THREE.CircleGeometry(0.05, 24);
  const scarMat = new THREE.MeshBasicMaterial({ color: 0x1a0f08, transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
  const scar = new THREE.Mesh(scarGeo, scarMat);
  scar.rotation.x = -Math.PI / 2;
  scar.position.z = 0.0015;
  scar.renderOrder = 2;

  let particles = []; // { mesh, idx, pos, vel, spin, life, age, isGrass }
  const _m = new THREE.Matrix4();
  const _q = new THREE.Quaternion();
  const _s = new THREE.Vector3(1, 1, 1);
  const _e = new THREE.Euler();
  const _c = new THREE.Color();

  function clear() {
    particles = [];
    grassMesh.count = 0; soilMesh.count = 0;
    grassMesh.instanceMatrix.needsUpdate = true;
    soilMesh.instanceMatrix.needsUpdate = true;
    scarMat.opacity = 0;
  }

  // spawn a batch of particles at world origin `originV`, using seeded rng.
  function spawn(rng, originV, count, opts) {
    const { spread = 0.35, upSpeed = [1.2, 2.4], grassRatio = 0.55, life = [0.8, 1.2], sizeMul = 1 } = opts || {};
    for (let i = 0; i < count; i++) {
      const isGrass = rng() < grassRatio;
      const pool = isGrass ? particles.filter(p => p.isGrass).length : particles.filter(p => !p.isGrass).length;
      if (isGrass && pool >= DIVOT_MAX_GRASS) continue;
      if (!isGrass && pool >= DIVOT_MAX_SOIL) continue;
      const ang = rng() * Math.PI * 2;
      const rad = rng() * spread;
      const vx = Math.cos(ang) * rad * (0.6 + rng() * 0.8);
      const vy = Math.sin(ang) * rad * (0.6 + rng() * 0.8);
      const vz = upSpeed[0] + rng() * (upSpeed[1] - upSpeed[0]);
      const life_ = life[0] + rng() * (life[1] - life[0]);
      const colArr = isGrass ? GRASS_COLORS : SOIL_COLORS;
      const color = colArr[(rng() * colArr.length) | 0];
      particles.push({
        isGrass, pos: originV.clone(), vel: new THREE.Vector3(vx, vy, vz),
        spin: new THREE.Vector3(rng() * 6 - 3, rng() * 6 - 3, rng() * 6 - 3),
        rot: new THREE.Vector3(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI),
        life: life_, age: 0, color, scale: (0.7 + rng() * 0.6) * sizeMul,
      });
    }
  }

  function scarAt(pos, opacity) {
    scar.position.x = pos.x; scar.position.y = pos.y;
    scarMat.opacity = opacity;
  }

  // advance the CPU simulation by dt seconds; rebuilds instance matrices.
  function update(dt) {
    let gi = 0, si = 0;
    for (const p of particles) {
      p.age += dt;
      if (p.age > p.life) continue;
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
      p.pos.z += p.vel.z * dt;
      p.vel.z -= GRAVITY * dt;
      if (p.pos.z < 0) { p.pos.z = 0; p.vel.z *= -0.25; p.vel.x *= 0.6; p.vel.y *= 0.6; }
      p.rot.x += p.spin.x * dt; p.rot.y += p.spin.y * dt; p.rot.z += p.spin.z * dt;
      const fade = Math.max(0, 1 - p.age / p.life);
      const sc = p.scale * (0.5 + fade * 0.5);
      _e.set(p.rot.x, p.rot.y, p.rot.z);
      _q.setFromEuler(_e);
      _s.setScalar(sc);
      _m.compose(p.pos, _q, _s);
      _c.set(p.color);
      if (p.isGrass && gi < DIVOT_MAX_GRASS) {
        grassMesh.setMatrixAt(gi, _m);
        grassMesh.instanceColor.setXYZ(gi, _c.r, _c.g, _c.b);
        gi++;
      } else if (!p.isGrass && si < DIVOT_MAX_SOIL) {
        soilMesh.setMatrixAt(si, _m);
        soilMesh.instanceColor.setXYZ(si, _c.r, _c.g, _c.b);
        si++;
      }
    }
    particles = particles.filter(p => p.age <= p.life);
    grassMesh.count = gi; soilMesh.count = si;
    grassMesh.instanceMatrix.needsUpdate = true;
    soilMesh.instanceMatrix.needsUpdate = true;
    grassMesh.instanceColor.needsUpdate = true;
    soilMesh.instanceColor.needsUpdate = true;
    // fade scar decal slowly
    if (scarMat.opacity > 0) scarMat.opacity = Math.max(0, scarMat.opacity - dt * 0.35);
    return gi + si; // active count, for tests
  }

  const group = new THREE.Group();
  group.add(grassMesh, soilMesh, scar);

  return { group, grassMesh, soilMesh, scar, clear, spawn, scarAt, update, get activeCount() { return particles.length; } };
}

// ══════════════════════════════════════════════════════════════════════════
// IMPACT FLASH — additive sprite pulse at the ball
// ══════════════════════════════════════════════════════════════════════════
function createFlash() {
  const geo = new THREE.PlaneGeometry(0.08, 0.08);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0, toneMapped: false,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 6;
  mesh.visible = false;

  let t = 0, dur = 0, active = false, baseScale = 1;
  function pulse(pos, opts) {
    const { duration = 0.22, scale = 1, color = 0xffffff } = opts || {};
    mesh.position.copy(pos);
    mat.color.set(color);
    dur = duration; t = 0; active = true; baseScale = scale;
    mesh.visible = true;
    mat.opacity = 1;
    mesh.scale.setScalar(0.4 * baseScale);
  }
  function update(dt) {
    if (!active) return;
    t += dt;
    const k = Math.min(1, t / dur);
    mat.opacity = 1 - k;
    mesh.scale.setScalar((0.4 + k * 1.6) * baseScale);
    if (k >= 1) { active = false; mesh.visible = false; }
  }
  function setStatic(pos, opts) { // reduced-motion: static end-state (invisible, settled)
    mesh.visible = false; mat.opacity = 0; active = false;
    if (pos) mesh.position.copy(pos);
    void opts;
  }
  return { mesh, pulse, update, setStatic, get active() { return active; } };
}

// ══════════════════════════════════════════════════════════════════════════
// AIR-SWOOSH sprite (Whiff — faint translucent arc above the ball, no contact)
// ══════════════════════════════════════════════════════════════════════════
function createSwoosh() {
  const geo = new THREE.PlaneGeometry(0.16, 0.05);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xbfe9ff, transparent: true, opacity: 0, toneMapped: false,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 4;
  mesh.visible = false;
  let t = 0, dur = 0, active = false;
  function show(pos, quat, opts) {
    const { duration = 0.3 } = opts || {};
    mesh.position.copy(pos);
    if (quat) mesh.quaternion.copy(quat);
    dur = duration; t = 0; active = true;
    mesh.visible = true; mat.opacity = 0.5;
  }
  function update(dt) {
    if (!active) return;
    t += dt;
    const k = Math.min(1, t / dur);
    mat.opacity = 0.5 * (1 - k);
    if (k >= 1) { active = false; mesh.visible = false; }
  }
  function setStatic() { mesh.visible = false; mat.opacity = 0; active = false; }
  return { mesh, show, update, setStatic, get active() { return active; } };
}

// ══════════════════════════════════════════════════════════════════════════
// public factory
// ══════════════════════════════════════════════════════════════════════════
export function createFx(state) {
  const trail = createTrail();
  const divot = createDivot();
  const flash = createFlash();
  const swoosh = createSwoosh();

  const group = new THREE.Group();
  group.add(trail.mesh, divot.group, flash.mesh, swoosh.mesh);

  function reset() {
    trail.reset();
    divot.clear();
    flash.setStatic();
    swoosh.setStatic();
  }

  /** advance CPU sims by dt (seconds); returns true if anything is still animating. */
  function tick(dt) {
    const active = divot.update(dt);
    flash.update(dt);
    swoosh.update(dt);
    return active > 0 || flash.active || swoosh.active;
  }

  /**
   * GROUND-STRIKE FX — fired EARLY, at the arc's ground-crossing entry point
   * (groundcontact.js's theta0 solve), BEFORE the club ever reaches the ball.
   * This is the "club hits the ground before the ball" moment on a Duff/Fat:
   * distinct from — and temporally earlier than — fireImpact()'s ball-contact
   * choreography below (which still fires separately at true impact with the
   * club now buried behind/under the ball).
   *
   * band: 'Duff'|'Fat' only (callers must not fire this for Pure/Thin/Whiff —
   *   Pure has no early ground crossing behind the ball; Thin/Whiff never
   *   touch turf at all).
   * entryV: THREE.Vector3 world point of the ground crossing (arcPosition(-theta0)).
   * seed: 32-bit int, same seed family as fireImpact for a consistent replay
   *   (offset so the two bursts don't draw identical particle patterns).
   * reduced: prefers-reduced-motion — instant settle, no camera shake.
   * Returns { shakeMs } (Duff: brief 60ms micro-shake; Fat: 0 — medium burst,
   * no shake, matching fireImpact's own Duff/Fat shake asymmetry).
   */
  function fireGroundContact(band, { entryV, seed, reduced, invalidate }) {
    const rng = mulberry32((seed ^ 0x9E3779B9) >>> 0); // decorrelate from the ball-impact burst's own rng
    let shakeMs = 0;

    if (band === 'Duff') {
      // deeper dig: bigger/heavier burst + darker scar, brief micro-shake.
      divot.spawn(rng, entryV, 26, { spread: 0.55, upSpeed: [1.8, 3.6], grassRatio: 0.3, life: [0.95, 1.3], sizeMul: 1.7 });
      divot.scarAt(entryV, 0.55);
      shakeMs = reduced ? 0 : 60;
    } else if (band === 'Fat') {
      // medium burst — turf-first but shallower than a Duff's dig.
      divot.spawn(rng, entryV, 16, { spread: 0.42, upSpeed: [1.5, 2.8], grassRatio: 0.5, life: [0.85, 1.15], sizeMul: 1.2 });
    } else {
      return { shakeMs: 0 };
    }

    if (reduced) {
      for (let i = 0; i < 90; i++) divot.update(1 / 60);
      return { shakeMs: 0 };
    }

    void invalidate;
    return { shakeMs };
  }

  /**
   * Fire the band-dependent impact choreography.
   * band: 'Duff'|'Fat'|'Pure'|'Thin'|'Whiff'
   * lpV: THREE.Vector3 world low-point (ground contact origin for Pure/Fat/Duff)
   * ballV: THREE.Vector3 world ball centre
   * seed: 32-bit int for deterministic replay
   * reduced: prefers-reduced-motion — skip camera shake, keep effects instant/static
   */
  function fireImpact(band, { lpV, ballV, seed, reduced, camera, invalidate }) {
    const rng = mulberry32(seed);
    let shakeMs = 0;

    if (band === 'Whiff') {
      // no ground contact at all — faint air-swoosh above the ball, club clears it
      const swooshPos = ballV.clone(); swooshPos.z += BALL_RADIUS_M * 2.2;
      swoosh.show(swooshPos, camera ? camera.quaternion : null, { duration: reduced ? 0 : 0.32 });
      flash.pulse(ballV, { duration: reduced ? 0 : 0.14, scale: 0.5, color: 0xbfe9ff });
      if (reduced) { swoosh.setStatic(); flash.setStatic(ballV); }
      return { shakeMs: 0 };
    }

    if (band === 'Duff') {
      divot.spawn(rng, lpV, 22, { spread: 0.5, upSpeed: [1.6, 3.2], grassRatio: 0.35, life: [0.9, 1.2], sizeMul: 1.5 });
      divot.scarAt(lpV, 0.5);
      flash.pulse(ballV, { duration: reduced ? 0 : 0.16, scale: 0.7, color: 0xffe0bb });
      shakeMs = reduced ? 0 : 60;
    } else if (band === 'Fat') {
      divot.spawn(rng, lpV, 14, { spread: 0.4, upSpeed: [1.4, 2.6], grassRatio: 0.55, life: [0.8, 1.1], sizeMul: 1.1 });
      flash.pulse(ballV, { duration: reduced ? 0 : 0.16, scale: 0.85, color: 0xffffff });
    } else if (band === 'Pure') {
      divot.spawn(rng, lpV, 9, { spread: 0.22, upSpeed: [1.0, 1.8], grassRatio: 0.75, life: [0.7, 0.95], sizeMul: 0.85 });
      flash.pulse(ballV, { duration: reduced ? 0 : 0.16, scale: 1.0, color: 0xffffff });
    } else if (band === 'Thin') {
      divot.spawn(rng, lpV, 5, { spread: 0.3, upSpeed: [1.2, 2.0], grassRatio: 0.6, life: [0.6, 0.85], sizeMul: 0.7 });
      flash.pulse(ballV, { duration: reduced ? 0 : 0.12, scale: 0.9, color: 0xffffff });
      // quick ball scale-pop is handled by the caller (club3d/ball mesh not owned here)
    }

    if (reduced) {
      // snap: run the full sim instantly to its resting state, no camera shake
      for (let i = 0; i < 90; i++) divot.update(1 / 60);
      flash.setStatic(ballV);
      return { shakeMs: 0 };
    }

    void invalidate;
    return { shakeMs };
  }

  return { group, trail, divot, flash, swoosh, reset, tick, fireImpact, fireGroundContact };
}
