/**
 * geo3d/timeline.js — 3D swing timeline (DEL 1 step 4).
 * Drives club3d placement + arc ink-in + fx (trail/divot/flash) + camera
 * push-in for a full 3D swing under ?three, replacing the SVG playSwing()
 * without touching it (the SVG path stays byte-identical without the flag).
 *
 * Design: ONE proxy `anim3.p` in [0,1] tweened by GSAP over the same domain
 * as ArcCurve/club3d (progress across the engine's ±SWEEP_RAD sweep — see
 * swing-parameters-and-impact.js SWEEP_RAD and geo3d/arc.js). No precomputed
 * position arrays: every frame samples arcPosition/tangentAt live via
 * club3d.update(theta, state), so slider changes made between swings are
 * always reflected immediately.
 *
 * Phases (labels reported by getPhase()):
 *   'address'  → p = restP (idle / start / settle target)
 *   'windup'   → address → p=0 (top of backswing), ~1.2s power2.inOut
 *   'down'     → p: 0 → 0.42, ~0.9s power1.in
 *   'impact'   → p: 0.42 → 0.58, ~2.55s linear (slow-mo through the strike)
 *   'finish'   → p: 0.58 → 1, ~1.0s power1.out
 *   'settle'   → finish → address pose, ~0.8s hold+ease
 *   'idle'     → not playing (address pose, no active tween)
 *
 * FACE-ZOOM (FIX N, 2026-07-02): within the 'impact' phase, once p crosses
 * pImpact-APPROACH_P_DELTA the onU() below hands off to facezoom.js's
 * runApproach() (camera cut-in + slow-mo) and keeps calling trackApproach()
 * every frame so the camera/marker follow the still-moving club; at true
 * pImpact, doImpactFx() calls facezoom.freeze() which pauses the tween
 * outright (full freeze on contact) until the user dismisses it. See
 * facezoom.js's file header for the full choreography.
 *
 * GROUND-STRIKE-BEFORE-BALL (2026-07-02, owner: "see the club hit the ground
 * BEFORE the ball on a duff"): on a Duff/Fat, the arc's low point sits BELOW
 * ground and BEHIND the ball, so the club crosses z=0 (groundcontact.js's
 * theta0 solve) at theta = -theta0, which is EARLIER in the downswing than
 * thetaAtImpact(state) — the club plows into turf before it ever reaches the
 * ball. p_entry (below) converts that entry theta into the same p-domain the
 * timeline already sweeps, and onU() fires a NEW, EARLIER ground-strike FX
 * (fx.fireGroundContact) the first frame anim3.p crosses it — distinct from,
 * and strictly before, doImpactFx()'s existing ball-contact choreography.
 * placeAt() also applies a render-only visible-depth clamp (VISIBLE_DIG_FLOOR_M)
 * so the clubhead doesn't visually vanish under the opaque floor disc while
 * digging in (the engine's true low point stays below ground — this only
 * nudges club3d.group's rendered position AFTER club3d.update() has already
 * placed it from the real arcPosition/theta math; checkAlign3d calls
 * club3d.update directly, bypassing placeAt entirely, so it still verifies
 * the true unclamped math).
 */
import * as THREE from '../vendor/three/build/three.module.js';
import { thetaAtImpact, strikeQuality, lpWorld, arcPosition, SWEEP_RAD, BALL_RADIUS_M } from '../swing-parameters-and-impact.js';
import { hashSeed, createFx } from './fx.js';
import { createFaceZoom, APPROACH_P_DELTA } from './facezoom.js';
import { groundCrossingTheta0 } from './groundcontact.js';
import { createGhosts } from './ghosts.js';
import saHaptics from '../sa-haptics.js';

const REST_BEHIND = deg2radLocal(5);
function deg2radLocal(d) { return (d * Math.PI) / 180; }

const pAtTheta = th => Math.max(0, Math.min(1, (th + SWEEP_RAD) / (2 * SWEEP_RAD)));
const thetaAtP = p => -SWEEP_RAD + 2 * SWEEP_RAD * p;
const restP = state => pAtTheta(thetaAtImpact(state) - REST_BEHIND);

// ── GROUND-STRIKE-BEFORE-BALL ────────────────────────────────────────────
// how far below the floor plane (z=0) the clubhead is allowed to render
// during a dig before we clamp it back up (render-only — see placeAt()
// below). Small and negative so the head still visibly BREAKS the turf line
// rather than sitting flush on top of it — the trench/spray sell the true
// (deeper) engine dig; this just keeps the head from vanishing under the
// opaque floor disc for the deepest part of a Duff.
const VISIBLE_DIG_FLOOR_M = -0.012;

/** Compute the (band, theta0, p_entry) ground-strike trigger for the swing
 * that's about to play, from the FIXED state at swing start (mirrors pRest/
 * pImpact's own snapshot-at-play-time pattern). Returns null when there's no
 * real ground crossing to fire early (Pure/Thin/Whiff, or the crossing falls
 * outside the arc's swept range) — see groundCrossingTheta0's own doc comment
 * for when a crossing exists. Only Duff/Fat ever fire the early ground FX;
 * Pure's shallow ahead-of-ball divot stays exactly as fireImpact() already
 * draws it (unchanged), and Thin/Whiff never touch turf. */
function computeGroundStrikeTrigger(state) {
  const sq = strikeQuality(state);
  if (sq.band !== 'Duff' && sq.band !== 'Fat') return null;
  const theta0 = groundCrossingTheta0(state);
  if (theta0 == null) return null;
  const thetaEntry = -theta0;
  const pEntry = pAtTheta(thetaEntry);
  return { band: sq.band, theta0, thetaEntry, pEntry, entryWorld: arcPosition(thetaEntry, state) };
}

/**
 * @param {object} opts
 *   state       — live swing state (shared with the SVG)
 *   sa3d        — { scene, camera, invalidate, startTicking, stopTicking }
 *   arc3d       — geo3d/arc.js instance (coreMat/glowMat.uniforms.uProgress)
 *   club3d      — geo3d/club.js instance
 *   getReduced  — () => boolean, live prefers-reduced-motion check
 *   controlsVisible — (show:boolean) => void, existing SVG helper (shared)
 *   faceZoomChipEl    — DOM node for the STEP 5 face-zoom band-label chip (optional)
 *   faceZoomLiveEl    — aria-live DOM node for the STEP 5 one-shot announcement (optional)
 *   faceZoomHintEl    — DOM node for the "tap to continue" hint shown during the
 *                       indefinite hold (optional)
 *   faceZoomDismissEl — DOM node (typically the canvas) that a pointerdown on
 *                       dismisses the hold early (optional)
 *   faceZoomHideNodes  — array OR () => array of THREE.Object3D to hide while
 *                        the closeup is active (FIX K — arc/plane/lowpoint/
 *                        groundcontact/delivery/target-line/trail; club+ball+
 *                        contact marker stay visible). A function is evaluated
 *                        lazily at cut-in time (avoids ordering issues with
 *                        nodes constructed after this call, e.g. fx.trail.mesh).
 *   faceZoomHideLabels — array of DOM nodes (lp3dLabel/gc3dLabel) to hide via
 *                        `hidden = true` while the closeup is active
 *   groundStrikeLabelEl — DOM node (the FIX J turf label, gc3dLabel) that gets
 *                        a brief `.is-struck` emphasis class at the moment the
 *                        early ground-strike FX fires (optional — "turf
 *                        first" cue, GROUND-STRIKE-BEFORE-BALL step 3).
 */
export function createTimeline3d({ state, sa3d, arc3d, club3d, getReduced, controlsVisible, faceZoomChipEl, faceZoomLiveEl, faceZoomHintEl, faceZoomDismissEl, faceZoomHideNodes, faceZoomHideLabels, groundStrikeLabelEl } = {}) {
  const fx = createFx(state);
  sa3d.scene.add(fx.group);

  // §2.4 — star-trail persistence: pooled ember clubhead silhouettes laid
  // along the downswing→impact path, decayed on release. Deliberately NOT in
  // the face-zoom hide list so the long-exposure holds through the freeze and
  // is the hero as the camera arcs out on release.
  const ghosts = createGhosts({ getBladeMesh: () => club3d.bladeMesh, invalidate: sa3d.invalidate });
  sa3d.scene.add(ghosts.group);
  const GHOST_START_P = 0.12, GHOST_SLOT = 0.035;
  let lastGhostSlot = -1, ghostDecayStarted = false;
  function maybeSampleGhost(ph, p) {
    if (ph !== 'down' && ph !== 'impact') return;
    if (getReduced()) return;
    if (p < GHOST_START_P) return;
    const slot = Math.floor(p / GHOST_SLOT);
    if (slot === lastGhostSlot) return;
    lastGhostSlot = slot;
    const bm = club3d.bladeMesh;
    if (bm) { club3d.group.updateMatrixWorld(true); bm.updateWorldMatrix(true, false); ghosts.sample(bm.matrixWorld); }
  }

  // STEP 5 — FACE-ZOOM impact replay (contact marker + camera hard-cut + chip).
  // FIX N (2026-07-02): early slow-mo cut-in before impact + FULL FREEZE at
  // true impact, holding until the user dismisses it (tap/click/Esc/Enter) or
  // an 8s idle fallback fires — see facezoom.js's file header doc comment for
  // the full choreography.
  const faceZoom = createFaceZoom({
    sa3d, club3d, chipEl: faceZoomChipEl, liveEl: faceZoomLiveEl, getReduced,
    hintEl: faceZoomHintEl, dismissEl: faceZoomDismissEl,
    hideNodes: faceZoomHideNodes, hideLabels: faceZoomHideLabels,
  });

  const anim3 = { p: restP(state) };
  let phase = 'idle';
  let tween = null;
  let fxRafActive = false;
  let lastFrameT = 0;
  let impactFired = false;
  let cameraBaseRig = null; // snapshot of sa3d.rig at swing start, for dolly restore
  let shakeTween = null;

  // ── GROUND-STRIKE-BEFORE-BALL ──────────────────────────────────────────
  // recomputed once per play()/snapReduced() call (state is fixed for the
  // duration of a single swing, same pattern as pRest/pImpact below); null
  // when this swing has no early ground crossing to fire (Pure/Thin/Whiff).
  let groundStrike = null;
  let groundStrikeFired = false;
  let groundStrikePLast = null; // test/debug: the p at which the FX actually fired

  const _headPos = new THREE.Vector3();
  const _shaftDir = new THREE.Vector3();
  const _ballV = new THREE.Vector3(0, 0, BALL_RADIUS_M);
  const _lpV = new THREE.Vector3();
  const _entryV = new THREE.Vector3();

  function getPhase() { return phase; }

  // ── club/arc placement at a given p (shared by tween onUpdate + reduced-motion snap) ──
  // `inkP` optionally overrides the arc ink progress (defaults to p): during
  // windup->finish the arc inks in with the clubhead (inkP===p), but during
  // settle the clubhead returns to address while the arc STAYS fully drawn
  // (mirrors the SVG's "revealed" behavior — once a swing has run, the full
  // arc + glass plane stay shown; only the clubhead resets to rest).
  function placeAt(p, { sampleTrail = false, inkP = p } = {}) {
    const theta = thetaAtP(p);
    const { basis } = club3d.update(theta, state);
    // GROUND-STRIKE-BEFORE-BALL — render-only visible-dig clamp: club3d.update
    // (which we do not own/edit) places group.position from the ENGINE's true
    // arcPosition/theta math, unclamped — on a Duff that head z legitimately
    // goes well below the floor (z=0), so without this the clubhead would
    // visually sink fully under the opaque floor disc and vanish for the
    // deepest part of the dig. This nudges ONLY club3d.group's rendered
    // position back up to a shallow visible floor line — the true engine
    // position (basis.head, arcPosition, theta) is completely untouched, so
    // checkAlign3d (which calls club3d.update directly, never through
    // placeAt) still compares against the real unclamped math and passes.
    // The trench/spray (fireGroundContact/fireImpact) still convey the real,
    // deeper dig; this purely keeps the head itself readable while digging.
    if (basis.head.z < VISIBLE_DIG_FLOOR_M) {
      club3d.group.position.z = VISIBLE_DIG_FLOOR_M;
    }
    _headPos.copy(club3d.group.position);
    if (sampleTrail) {
      _shaftDir.set(basis.Y.x, basis.Y.y, basis.Y.z);
      fx.trail.sample(_headPos, _shaftDir);
    }
    // ink the arc in behind the clubhead: uProgress tracks inkP (arc's own
    // curve domain matches thetaAtP's ±SWEEP_RAD span 1:1).
    arc3d.coreMat.uniforms.uProgress.value = inkP;
    arc3d.glowMat.uniforms.uProgress.value = inkP;
  }

  // GROUND-STRIKE-BEFORE-BALL — fire the EARLY ground-contact FX the first
  // frame the DOWNSWING's p crosses p_entry (which is < p_impact whenever a
  // real ground crossing exists — see computeGroundStrikeTrigger). Must only
  // arm once the tween is actually sweeping FORWARD through the downswing
  // ('down'/'impact' phases) — NOT during 'windup', whose p starts at pRest
  // (already >= pEntry for a typical Duff/Fat, since pEntry sits well before
  // both pRest and pImpact — see the p_entry < p_rest < p_impact derivation
  // in the task's self-verify numbers) and sweeps p DOWN to 0 first. Without
  // this phase gate the FX would misfire at the very start of the backswing,
  // before the club has moved at all. Guarded so it only ever fires once per
  // swing and never for bands without a crossing.
  function maybeFireGroundStrike(ph, p) {
    if (ph !== 'down' && ph !== 'impact') return;
    if (!groundStrike || groundStrikeFired || impactFired) return;
    if (p >= groundStrike.pEntry) doGroundStrikeFx(p, getReduced());
  }

  function doGroundStrikeFx(pNow, reduced) {
    if (groundStrikeFired || !groundStrike) return;
    groundStrikeFired = true;
    groundStrikePLast = pNow;
    _entryV.set(groundStrike.entryWorld.x, groundStrike.entryWorld.y, Math.max(groundStrike.entryWorld.z, 0));
    saHaptics.impact(groundStrike.band === 'Duff' ? 'heavy' : 'medium');
    const { shakeMs } = fx.fireGroundContact(groundStrike.band, {
      entryV: _entryV, seed: seedFor(), reduced, invalidate: sa3d.invalidate,
    });
    if (shakeMs > 0 && cameraBaseRig && !reduced) startCameraShake(shakeMs);
    if (!reduced) ensureFxLoop();
    pulseGroundStrikeLabel();
  }

  // STEP 3 — "turf first" cue: briefly emphasize the existing FIX J turf
  // label (gc3d-label) at the moment the ground-strike FX fires, reusing its
  // CSS rather than introducing new UI. No-op if the caller didn't wire the
  // label element, or under reduced-motion (the CSS animation is itself
  // suppressed by the global prefers-reduced-motion rule, but skip the class
  // churn entirely too).
  function pulseGroundStrikeLabel() {
    if (!groundStrikeLabelEl || getReduced()) return;
    groundStrikeLabelEl.classList.remove('is-struck');
    // eslint-disable-next-line no-unused-expressions
    void groundStrikeLabelEl.offsetWidth; // restart the CSS animation on repeat swings
    groundStrikeLabelEl.classList.add('is-struck');
  }

  function worldLpAndBall() {
    const lp = lpWorld(state);
    _lpV.set(lp.x, lp.y, Math.max(lp.z, 0)); // ground-contact origin, never below floor
    return { lpV: _lpV, ballV: _ballV.set(0, 0, BALL_RADIUS_M) };
  }

  function seedFor() {
    return hashSeed(state.planeAngle, state.swingDirection, state.lowPoint.x, state.lowPoint.z);
  }

  function doImpactFx(reduced) {
    if (impactFired) return;
    impactFired = true;
    const sq = strikeQuality(state);
    const { lpV, ballV } = worldLpAndBall();
    saHaptics.impact('heavy');
    const { shakeMs } = fx.fireImpact(sq.band, {
      lpV, ballV, seed: seedFor(), reduced, camera: sa3d.camera, invalidate: sa3d.invalidate,
    });
    if (sq.band === 'Thin' && !reduced) {
      // quick ball scale-pop — flash already fired; a tiny extra pulse reads as a "pop"
      if (window.gsap) {
        window.gsap.fromTo(fx.flash.mesh.scale, { x: 0.3, y: 0.3 }, { x: 0.9, y: 0.9, duration: 0.1, yoyo: true, repeat: 1 });
      }
    }
    if (shakeMs > 0 && cameraBaseRig) startCameraShake(shakeMs);
    if (!reduced) ensureFxLoop();
    // FIX N — FACE-ZOOM: the camera already cut in APPROACH_P_DELTA earlier
    // (see onU() below) and has been slow-mo tracking the club since; freeze()
    // does the FULL FREEZE (tween.pause()) at this true-impact moment and
    // shows the marker pulse/chip/hint. Fires after shake so shake's own
    // applyRig() calls don't fight the cut; dollyTo/shake are themselves
    // guarded against faceZoom.isActive() below.
    if (!reduced) faceZoom.freeze(state, tween);
  }

  // ── camera push-in dolly: nudge rig.dist toward the ball during down→impact,
  // back out on finish. Skipped entirely under reduced-motion AND while the
  // STEP 5 face-zoom detour owns the camera (it hard-sets position/fov directly;
  // any rig.applyRig() here would stomp that hard cut every frame).
  const DOLLY_FRAC = 0.08;
  function dollyTo(t) {
    // t: 0 (address/rest) .. 1 (max push-in, mid-downswing) .. 0 (finish)
    if (!cameraBaseRig) return;
    if (faceZoom.isActive()) return;
    const dist = cameraBaseRig.dist * (1 - DOLLY_FRAC * t);
    sa3d.rig.dist = dist;
    sa3d.applyRig();
  }
  function startCameraShake(ms) {
    if (!window.gsap) return;
    if (shakeTween) shakeTween.kill();
    const baseTx = sa3d.rig.tx, baseTy = sa3d.rig.ty;
    const o = { k: 1 };
    shakeTween = window.gsap.to(o, {
      k: 0, duration: ms / 1000, ease: 'power2.out',
      onUpdate: () => {
        if (faceZoom.isActive()) return;
        const amp = 0.006 * o.k;
        sa3d.rig.tx = baseTx + (Math.random() * 2 - 1) * amp;
        sa3d.rig.ty = baseTy + (Math.random() * 2 - 1) * amp;
        sa3d.applyRig();
        sa3d.invalidate();
      },
      onComplete: () => {
        sa3d.rig.tx = baseTx; sa3d.rig.ty = baseTy;
        if (!faceZoom.isActive()) { sa3d.applyRig(); sa3d.invalidate(); }
      },
    });
  }

  function setPhase(p) { phase = p; }

  // ── §2.4 THE WOW — broadcast camera choreography, riding the EXISTING
  // timeline via its progress callbacks (never wall-time). A down-phase azimuth
  // WHIP toward the impact-side composition (an additive sa3d.camOffset so it
  // composes with the base rig + FACE/DTL edits and survives facezoom's own
  // rig save/restore) plus a global timeScale ramp 1→0.3. Both no-op the moment
  // facezoom owns the camera (approach/freeze) and resume on release, arcing the
  // camera to a finish composition and easing timeScale back to 1.
  const WHIP_DEG = -26;         // azimuth swept across the downswing
  const WHIP_FINISH_DEG = -42;  // where the camera "completes its arc" on release
  function applyReplayCamera(ph, p) {
    if (faceZoom.isActive()) return; // facezoom owns az + timeScale during the closeup
    let az = 0;
    if (ph === 'down') az = WHIP_DEG * Math.min(1, Math.max(0, p / 0.42));
    else if (ph === 'impact') az = WHIP_DEG;
    else if (ph === 'finish') az = WHIP_DEG + (WHIP_FINISH_DEG - WHIP_DEG) * Math.min(1, Math.max(0, (p - 0.58) / 0.42));
    sa3d.setCamOffset({ az });
    // Global timeScale: the downswing DECELERATES 1→0.3 (drama), then the impact
    // window eases back toward 1 so the EXISTING slow-mo (the 2.55s impact tween
    // + facezoom's 0.05 cut-in) plays at its designed pace rather than being
    // multiplied into a 10s crawl. windup/finish run at 1.
    if (tween && tween.timeScale) {
      let ts = 1;
      if (ph === 'down') ts = 1 - 0.7 * Math.min(1, Math.max(0, p / 0.42));
      else if (ph === 'impact') ts = 0.3 + 0.7 * Math.min(1, Math.max(0, (p - 0.42) / 0.08)); // 0.3 → 1 by p≈0.50
      tween.timeScale(ts);
    }
  }
  function resetReplayCamera() {
    sa3d.setCamOffset({ az: 0 });
    ghosts.reset();
    lastGhostSlot = -1;
    ghostDecayStarted = false;
  }

  /** Reduced-motion: snap straight to the finished/settled state, no tweens. */
  function snapReduced() {
    if (tween) { tween.kill(); tween = null; }
    faceZoom.reset();
    fx.reset();
    resetReplayCamera(); // reduced-motion: no whip, no ghosts (spec §2.4)
    impactFired = false;
    groundStrike = computeGroundStrikeTrigger(state);
    groundStrikeFired = false;
    groundStrikePLast = null;
    setPhase('address');
    controlsVisible(true);
    if (!cameraBaseRig) cameraBaseRig = { ...sa3d.rig };
    sa3d.rig.dist = cameraBaseRig.dist; sa3d.applyRig(); // no push-in under reduced-motion
    // club settles at the address/rest pose; arc stays fully inked (the swing
    // "happened" — matches the non-reduced settle end-state), no tween.
    anim3.p = restP(state);
    placeAt(anim3.p, { inkP: 1 });
    // GROUND-STRIKE-BEFORE-BALL — reduced-motion has no phase-gated onU sweep
    // to trigger maybeFireGroundStrike from, but the spec still wants the
    // static end-state to show the ground-first trench/spray for Duff/Fat
    // (instruction 4: "the static end-state may still show the divot
    // trench") — fire it directly, instantly, same as fireImpact below.
    if (groundStrike) doGroundStrikeFx(groundStrike.pEntry, true);
    const sq = strikeQuality(state);
    if (sq.band !== 'Whiff') {
      const { lpV, ballV } = worldLpAndBall();
      fx.fireImpact(sq.band, { lpV, ballV, seed: seedFor(), reduced: true, camera: sa3d.camera, invalidate: sa3d.invalidate });
    }
    saHaptics.impact('heavy');
    setPhase('idle');
    // STEP 5 — reduced-motion: no zoom/cut/timeScale change, ever. The existing
    // DOM readout already carries the info; the chip is shown statically once
    // the swing has "completed" (this snap IS that completion).
    faceZoom.showStaticChip(state);
    sa3d.invalidate();
  }

  /** Play the full 3D swing timeline. Kill-and-replace on re-Hit. */
  function play() {
    if (tween) { tween.kill(); tween = null; }
    faceZoom.reset(); // mid-zoom re-Hit: restore fov/timeScale/camera before the new swing snapshots cameraBaseRig
    const reduced = getReduced();
    if (reduced) { snapReduced(); return; }

    fx.reset();
    resetReplayCamera(); // §2.4 — clear ghosts + whip offset before a fresh swing
    impactFired = false;
    groundStrike = computeGroundStrikeTrigger(state);
    groundStrikeFired = false;
    groundStrikePLast = null;
    cameraBaseRig = { ...sa3d.rig };
    sa3d.startTicking();
    controlsVisible(false);

    const pRest = restP(state);
    const pImpact = pAtTheta(thetaAtImpact(state));
    const pApproachCutIn = pImpact - APPROACH_P_DELTA; // FIX N — earlier trigger, see facezoom.js APPROACH_P_DELTA doc
    anim3.p = pRest;
    arc3d.coreMat.uniforms.uProgress.value = pRest;
    arc3d.glowMat.uniforms.uProgress.value = pRest;

    const onU = (ph) => {
      setPhase(ph);
      const sampleTrail = ph === 'down' || ph === 'impact' || ph === 'finish';
      placeAt(anim3.p, { sampleTrail });
      maybeFireGroundStrike(ph, anim3.p);
      // §2.4 — lay ember ghost silhouettes along the downswing→impact path,
      // and ride the whip + timeScale ramp (both no-op once facezoom cuts in).
      maybeSampleGhost(ph, anim3.p);
      applyReplayCamera(ph, anim3.p);
      if (ph === 'finish' && !ghostDecayStarted) { ghostDecayStarted = true; ghosts.startDecay(window.gsap, false); }
      // dolly: ramp in across windup→down→impact midpoint, back out across finish
      // (skipped once the face-zoom owns the camera — dollyTo() itself already
      // no-ops via faceZoom.isActive(), kept here for clarity of intent).
      const t = anim3.p <= 0.5
        ? Math.min(1, (pRest - anim3.p) / Math.max(1e-6, pRest)) // windup/down: 0(rest)->1(top/mid)
        : Math.max(0, 1 - (anim3.p - 0.5) / 0.5);                // impact/finish: ramp back to 0
      dollyTo(Math.max(0, Math.min(1, t)));
      // FIX N — approach cut-in fires slightly BEFORE true impact (earlier
      // trigger than doImpactFx's own pImpact check below); once cut in,
      // trackApproach() re-tracks the camera/marker every frame so the
      // still-moving club (now in slow-mo) stays framed right up to the freeze.
      if (!impactFired && !reduced && anim3.p >= pApproachCutIn) {
        if (!faceZoom.isActive()) faceZoom.runApproach(state, tween, anim3.p, pImpact);
        else faceZoom.trackApproach(state);
      }
      if (!impactFired && anim3.p >= pImpact) doImpactFx(false);
    };

    tween = window.gsap.timeline({
      onComplete: () => {
        setPhase('settle');
        dollyTo(0); // finish phase already ramps the dolly back to ~0; settle holds it there
        const settleTween = window.gsap.to(anim3, {
          p: pRest, duration: 0.8, ease: 'power2.inOut',
          onUpdate: () => {
            placeAt(anim3.p, { inkP: 1 });
            // §2.4 — bring the whipped camera home to the resting pose as the
            // club returns to address (only while facezoom isn't mid-detour).
            if (!faceZoom.isActive()) {
              const f = Math.min(1, Math.max(0, (1 - anim3.p) / Math.max(1e-6, 1 - pRest)));
              sa3d.setCamOffset({ az: WHIP_FINISH_DEG * (1 - f) });
              sa3d.applyRig();
            }
          },
          onComplete: () => {
            setPhase('idle');
            tween = null;
            resetReplayCamera();  // whip offset → 0, ghosts cleared (failsafe if decay didn't finish)
            if (cameraBaseRig) { sa3d.rig.dist = cameraBaseRig.dist; sa3d.applyRig(); }
            controlsVisible(true);
            fx.trail.reset();   // hide the trail once idle (spec: "hidden when idle")
            sa3d.stopTicking();
            sa3d.invalidate();
          },
        });
        tween = settleTween;
      },
    });
    tween
      .to(anim3, { p: 0, duration: 1.2, ease: 'power2.inOut', onUpdate: () => onU('windup') }, 0)
      .to(anim3, { p: 0.42, duration: 0.9, ease: 'power1.in', onUpdate: () => onU('down') })
      .to(anim3, { p: 0.58, duration: 2.55, ease: 'none', onUpdate: () => onU('impact') })
      .to(anim3, { p: 1, duration: 1.0, ease: 'power1.out', onUpdate: () => onU('finish') });

    setPhase('windup');
  }

  /** rAF loop driving fx.tick(dt) for divot/flash/swoosh physics — runs only
   * while there's something to animate (post-impact particle settle can
   * outlast the GSAP position tween). Piggybacks on requestAnimationFrame
   * rather than gsap.ticker so it's independent of the position timeline. */
  function fxLoop(tMs) {
    if (!lastFrameT) lastFrameT = tMs;
    const dt = Math.min(0.05, (tMs - lastFrameT) / 1000);
    lastFrameT = tMs;
    const stillActive = fx.tick(dt);
    sa3d.invalidate();
    if (stillActive) {
      requestAnimationFrame(fxLoop);
    } else {
      fxRafActive = false;
      lastFrameT = 0;
    }
  }
  function ensureFxLoop() {
    if (fxRafActive) return;
    fxRafActive = true;
    lastFrameT = 0;
    requestAnimationFrame(fxLoop);
  }

  // Seek support for deterministic screenshots: pause the tween and set
  // progress() directly. Exposed via getTimeline() so tests can call
  // tl.pause() / tl.progress(x) themselves.
  function getTimeline() { return tween; }

  function seek(p01) {
    if (tween && tween.progress) {
      tween.pause();
      tween.progress(Math.max(0, Math.min(1, p01)));
    }
  }

  return {
    fx,
    faceZoom,
    ghosts,
    play,
    getPhase,
    getTimeline,
    seek,
    anim3,
    isPlaying: () => phase !== 'idle',
    _internal: { placeAt, restP: () => restP(state), pImpactFor: () => pAtTheta(thetaAtImpact(state)) },
    // GROUND-STRIKE-BEFORE-BALL — test/verify hooks (self-verify + Playwright):
    // groundStrike() is the trigger computed for the swing that just played
    // (null if this band has no early ground crossing — Pure/Thin/Whiff);
    // firedAtP() is the LIVE anim3.p at the moment the FX actually fired
    // (null until it has); pImpactFor() above is already exposed for the
    // ball-impact side of the p_entry < p_impact assertion.
    groundStrike: {
      trigger: () => groundStrike,
      fired: () => groundStrikeFired,
      firedAtP: () => groundStrikePLast,
    },
  };
}
