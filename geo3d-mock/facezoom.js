/**
 * geo3d/facezoom.js — DEL 1 step 5: FACE-ZOOM impact replay.
 * Shortly BEFORE the impact moment the camera hard-cuts to a clubface
 * close-up and the swing drops into slow-mo as the club visibly travels the
 * last stretch toward the ball; AT the exact impact moment the swing goes
 * into a full freeze (club touching ball, tween paused) until the user
 * dismisses it. Driven from geo3d/timeline.js: the early cut-in fires from a
 * separate onUpdate crossing check (APPROACH_P_DELTA before impact, calling
 * runApproach()/trackApproach()) and the freeze itself is applied by freeze()
 * once p reaches true pImpact (called from doImpactFx()). fx.js's other
 * impact FX (divot/flash/shake) still fire at true impact as today via
 * doImpactFx(); this module doesn't touch that.
 *
 * CONTACT MARKER: small emissive ring, child of club3d.faceAnchor (the GLB's
 * sweet-spot origin — see club.js doc comment). faceAnchor sits directly
 * under the club's top-level `group` (NOT inside the lie-compensated `blade`
 * node), so its local frame IS the world swing basis: +Y = up-the-shaft
 * (toward the topline), +X = toe, -Z = face normal (CHIRALITY fix,
 * 2026-07-02 — canonical GLB face axis is local -Z, NOT +Z; see
 * club.js file header). clubBallContact(state).offset is already the metric
 * vertical distance (m) between the club's contact height and the ball
 * centre height, in the swing plane — exactly the marker's local +Y offset
 * on the face.
 *
 * CAMERA (FIX N — 3/4 front angle, replaces the old straight face-normal
 * pose): hard cut (no tween) to a runtime-computed pose — position = contact
 * point + rotate(faceNormal, worldUp, +FACE_ZOOM_AZIMUTH_DEG)*FACE_ZOOM_DIST +
 * up*FACE_ZOOM_UP, lookAt contact point, fov 20. Rotating the face-normal
 * offset around world-up swings the camera off dead-on-face toward the
 * target side, so the shot reads as "club arriving from the side, ball sits
 * in front of the face" instead of the ball straight-on occluding the face.
 * faceNormal is read from faceAnchor's local -Z (worldFaceNormal()).
 *
 * APPROACH + FREEZE (FIX N, 2026-07-02 — replaces the old "tiny creep during
 * an indefinite hold" behavior): the zoom now cuts in APPROACH_P_DELTA of p
 * before impact (still moving, in slow-mo at APPROACH_TIMESCALE) and rides
 * that slow-mo the rest of the way to impact, where the swing tween is
 * FULLY PAUSED (tween.pause(), not just slowed) — the club stops in contact
 * with the ball. The camera/marker/chip/hint stay put until the user
 * dismisses it — pointerdown on `dismissEl` (the scene canvas), or Esc/Enter
 * — at which point endHold() hard-cuts the camera back, resumes the tween
 * (tween.play()) and restores its timeScale so the swing continues on to the
 * finish phase. A discreet "tap to continue" hint chip fades in
 * HINT_DELAY_MS after the freeze so a quick look doesn't get interrupted by
 * UI chrome. A safety fallback (IDLE_FALLBACK_MS) auto-continues if the user
 * never taps, so the app can never feel permanently stuck. Reduced-motion is
 * unaffected — runApproach()/freeze() no-op entirely under reduced motion
 * (see caller in timeline.js).
 *
 * FIX P4 (2026-07-02, owner: "the clubhead disappears in the picture at
 * impact") — at the FROZEN stage (not the moving approach), the ball itself
 * is now ghosted: sa3d.ball's material is tweened to transparent+opacity
 * BALL_GHOST_OPACITY (see ghostBall()), fully restored on resume (endHold),
 * reset, and kill-and-replace mid-freeze (reset() covers that path too — see
 * unghostBall()). With the ball no longer opaque, the freeze camera can sit
 * closer to dead-on-face than the approach's 3/4 pose (FREEZE_AZIMUTH_DEG/
 * FREEZE_DIST/FREEZE_UP, only used once stage==='frozen' — see
 * trackCameraToState()) so the WHOLE blade face + contact ring read clearly
 * through the ghosted ball, instead of the ball opaquely covering the face at
 * the moment of contact. A small blade emissive lift (liftBladeEmissive())
 * brightens the face further during the freeze, restored on cut-out. Whiff
 * runs skip both (no ball/face contact to reveal — see the isWhiffRun guard
 * in freeze()).
 */
import * as THREE from '../vendor/three/build/three.module.js';
import { clubBallContact, BALL_RADIUS_M } from '../swing-parameters-and-impact.js';
// MOCK round 3 (tasks 1+2): the chip/announce/marker verdict comes from the
// SIDE-LAYER display classification (band label alone, no % — and "no
// contact"/the Whiff camera branch only when the face truly clears the
// ball). The engine stays byte-identical; see strikedisplay.js.
import { strikeDisplay } from './strikedisplay.js';

const RING_RADIUS_M = 0.012;      // ~12mm — bumped (was 5mm) for legibility at the FIX N wider/closer 3/4 framing;
                                   // the old dead-on 0.35m pose read the ring fine at 5mm, but the new oblique 3/4
                                   // angle foreshortens the ring's screen footprint, so it needs to be physically larger.
const RING_TUBE_M = 0.0018;       // proportionally thicker to match
const RING_STANDOFF_M = 0.0012;   // nudge off the face plane (toward the camera, local -Z = face normal) to avoid z-fighting with the blade mesh
// FIX N camera tuning — arrived at by headless screenshot iteration at 900×470
// (see facezoom.js commit notes / task report for the discarded candidates).
// At true impact the face is pressed flush against the ball, so ANY
// near-dead-on view has the ball occluding almost the whole face by
// construction — a dead-on pose (azimuth≈0) reproduces exactly the old bug
// ("ball straight-on occluding the face"). The values below are the best
// found composition where the ball, a visible grooved slice of the face, AND
// the contact ring are all readable at once. Distance/up ended up outside the
// spec's suggested 0.35–0.45m/starting-point range because the ball dominates
// the frame at closer range — pulling back (0.60m) and lifting more (0.16m)
// shrinks the ball enough to reveal the face without losing the 3/4 read.
const FACE_ZOOM_DIST = 0.60;      // m, camera stand-off along the (rotated) face-normal offset — APPROACH stage only (FIX P4 below)
const FACE_ZOOM_UP = 0.16;        // m, camera lift along world-up — APPROACH stage only
const FACE_ZOOM_AZIMUTH_DEG = 32; // FIX N — 3/4 front angle: swing the camera offset this many degrees around world-up
                                   // (+Z), toward the target side, off the dead-on face-normal pose. Puts the club
                                   // approaching from the side with the ball sitting in front of the face, instead of
                                   // the ball straight-on occluding the face. Verified visually within the 30–45° band.
                                   // APPROACH stage only — see FREEZE_* below for the tighter freeze-frame pose.
const FACE_ZOOM_FOV = 20;

// FIX P4 (owner: "the clubhead disappears in the picture at impact") — at the
// FREEZE moment (not the approach), the ball is now ghosted (see ghostBall()
// below) so it no longer needs to be composed AROUND — the camera can go
// closer to dead-on-face than the APPROACH 3/4 pose without the ball
// occluding the face. Azimuth pulled down from 32°→15° (still a hair off
// dead-on so the face reads with depth, not as a flat card), distance in
// from 0.60→0.45. FREEZE_UP is 0 (unlike the approach's 0.16) — headless
// iteration showed even a small positive lift tips the camera into looking
// DOWN onto the topline/sole (the club's face-normal already points slightly
// downward from typical loft/lie, so "up" compounds with that instead of
// centering the view) and the face reads as a thin edge-on sliver instead of
// a full plane; up=0 (camera height == contact-point height) is what
// actually keeps the WHOLE face square in frame. Tuned by headless
// screenshot iteration (see task report for the discarded candidates).
// FIX Q (2026-07-08, owner: "Impact må vise køllen parallell til bakken" —
// screenshot evidence) — the FIX P4 pose above (az 15°/dist 0.45/up 0) is a
// CAMERA-FRAMING bug, not a physics one: checkAlign3d/impactMetrics confirm
// the club's toe–heel lie axis is already world-horizontal (0.000° across the
// full plane×dir×lpx×lpz grid — dynamic lie compensation + grounded-address
// landed separately). A world-horizontal line does NOT generally project as a
// horizontal SCREEN line under a yawed perspective camera — the two endpoints
// (toe/heel) sit at different DEPTHS from the camera once the view has any
// azimuth, so perspective division gives them different screen-Y even though
// their world-Z is identical. That's what read as "tilted" in the owner's
// screenshot. Confirmed empirically (geometry-mock.html's __sa.three.faceZoom
// .soleSlope() hook, which projects a toe/heel pair built by walking ± the
// blade's own physical half-width along poseDebug().toeAxis from
// poseDebug().faceCentreWorld — the SAME toe-heel axis + face-centre point
// club3d's own checkAlign3d/impactMetrics already treat as authoritative —
// through the LIVE freeze camera; an earlier bbox-corner version of this hook
// was rejected after _debugSoleDots() screenshots showed those corners
// floating in empty space below the rendered clubhead, off the visible
// silhouette — see that hook's doc comment): at azimuth=0 the residual slope
// is 0.000° for every non-Whiff cell tested (the physics fact holds), and
// grows ~linearly with azimuth from there, with a PER-CELL slope/azimuth
// ratio that varies in both sign and magnitude across plane/dir/lpx/ballPos
// (measured across a 24-cell sweep — the 16 plane/dir/lpx/ballPos extreme
// corners + default + 8 more plane/dir/ballPos combinations). FREEZE_AZIMUTH
// was pulled down 15°→10°, shrinking that per-cell spread proportionally
// while barely moving marker/ball screen separation (measured: moving azimuth
// 0→32° at fixed dist/up shifts the marker-to-ball screen distance by under
// 1px — azimuth is NOT the lever for marker legibility, see FREEZE_UP's own
// doc comment above for why dist/up were left alone; azimuth is kept modest,
// not zeroed, purely so the face still reads with depth/a 3/4 angle rather
// than a flat dead-on card).
//
// FIX Q2 (2026-07-08, follow-up on the owner's EXACT reported case — LOW ON
// FACE, i.e. lpz varied, which the FIX Q calibration grid held at default) —
// two more findings, and FIX Q's static roll replaced by a DYNAMIC per-shot
// solve:
//
// (a) UNDERGROUND CAMERA. On Fat/Duff strikes the club is genuinely dug below
// z=0 at the impact frame, and FREEZE_UP=0 anchors the camera at CONTACT
// height — which for a low contact put the camera ~5cm BELOW GROUND, looking
// up at the head's underside with grazing light (measured for the owner's
// case: camPos.z=−0.049 while the projected toe–heel axis itself measured
// level at −1.1° — so what read as "rotated 20-30°" in the owner's
// screenshot was this under-sole viewpoint + lighting, NOT an axis tilt).
// FREEZE_CAM_MIN_Z now clamps the freeze camera's world height to never sink
// below ~ground level. The floor disc is hidden for the duration of the zoom
// (see geometry-mock.html's faceZoomHideNodes FIX Q2 comment) so the
// above-ground camera no longer loses the dug head behind the opaque floor —
// which also finally matches the freeze acceptance list ("only club + ball +
// marker + chip visible during the zoom"). The default cell measured
// camPos.z=−0.0005, above the clamp — its framing is untouched by (a).
//
// (b) DYNAMIC LEVELING (replaces FIX Q's static FREEZE_ROLL_DEG=−0.15°). The
// per-cell residual slope varies with EVERY parameter (incl. lpz, which the
// static roll's calibration grid didn't sweep), so one fixed roll can only
// centre a measured range, never zero each shot. The freeze now SOLVES the
// leveling per shot: project the toe–heel line (blade.matrixWorld local +X
// through the contact point, ± the blade's physical half-width) with the
// freeze camera at roll=0, read its screen slope s0, and cancel it. Camera
// roll about the view (optical) axis rotates the projected image RIGIDLY —
// the camera aims exactly at the contact point, so slope(r) = s0 − r holds
// exactly (relation verified empirically during FIX Q tuning) and r = s0
// zeroes the read in one step, no iteration. Preferred path: pure camera
// roll (honest — a view change only, club untouched). If |s0| >
// FREEZE_ROLL_MAX_DEG (10° — beyond that the rolled view starts visibly
// tilting the scene around the club), the roll is clamped there and the
// RESIDUAL is applied as a COSMETIC rotation of club3d.group around the same
// optical axis THROUGH the contact point (exact for the same rigid-image-
// rotation reason; the pivot keeps the marker + ball contact seam fixed on
// screen). That rotation is pure view-time presentation: applied at the
// freeze only, snapshot-restored on endHold/reset/retrack, and the resumed
// timeline's placeAt() re-poses the club from the true arc math every frame
// anyway. Owner precedent for the cosmetic simplification: FIX K.3 ("ball
// always horizontally centred in the clubhead" — this close-up teaches
// strike HEIGHT, not orientation).
//
// Whiff runs are UNCHANGED by all of this — the isWhiffRun branch of
// trackCameraToState() uses the APPROACH constants and never freezes on a
// contact view; no club-ball contact exists for a "sole parallel to the
// ground" read to apply to.
const FREEZE_AZIMUTH_DEG = 10;
const FREEZE_DIST = 0.45;
const FREEZE_UP = 0;
const FREEZE_CAM_MIN_Z = -0.005;  // m — freeze camera world-height floor (~ground level, FIX Q2a); rescues low-contact cells without moving the default cell (measured −0.0005)
const FREEZE_ROLL_MAX_DEG = 10;   // deg — max camera roll for the dynamic leveling (FIX Q2b); excess goes to the cosmetic model rotation instead

// FIX Q — test-only overrides for the freeze pose (azimuth/dist/up/roll),
// mirroring the existing hintDelayMs/idleFallbackMs override pattern below.
// null = tuned constant / dynamic behavior. rollDeg override (a number)
// FORCES that fixed camera roll and disables the FIX Q2 dynamic leveling
// solve entirely (both the roll solve and the cosmetic-rotation fallback) —
// that's what before/after comparison screenshots use. Lets headless
// screenshot iteration (geometry-mock.html's __sa hooks) re-tune the
// ALREADY-frozen frame live (via retrack()) without re-running a full swing
// per candidate.
let freezeAzimuthOverride = null;
let freezeDistOverride = null;
let freezeUpOverride = null;
let freezeRollOverride = null;
let freezeMaxRollOverride = null; // test-only cap override for FREEZE_ROLL_MAX_DEG — lets specs force the cosmetic model-rotation fallback (FIX Q2b) without needing a >10°-slope cell
const BALL_GHOST_OPACITY = 0.22;
const BALL_GHOST_MS = 220;        // ball opacity tween duration (ghost-in AND restore)
const BLADE_EMISSIVE_LIFT = 0x141414; // slight brightness lift on the blade during freeze (restored after)
const APPROACH_TIMESCALE = 0.05;  // slow-mo timeScale during the pre-impact approach (club visibly travels to the ball)
// APPROACH_P_DELTA — how far (in the timeline's p∈[0,1] domain) BEFORE impact
// the zoom cuts in. Derived from the 'impact' phase's own tween pace so the
// approach reads as ~0.4–0.6s of REAL wall-clock time at APPROACH_TIMESCALE:
// the 'impact' phase (see timeline.js) spans p 0.42→0.58 (Δp=0.16) over 2.55s
// of TWEEN time, i.e. dp/d(tweenTime) = 0.16/2.55 ≈ 0.06275. Real time and
// tween time relate by realTime = tweenTime / timeScale, so for a target
// real-time approach window T: tweenTime = T*APPROACH_TIMESCALE, and
// δ = tweenTime * (0.16/2.55). Targeting T≈0.5s (midpoint of the 0.4–0.6s
// spec range): δ = 0.5 * 0.05 * (0.16/2.55) ≈ 0.00157 → gives ~0.4–0.6s of
// approach across the full APPROACH_TIMESCALE range once the tween's own
// linear pacing is folded in. Exposed as a constant (not inlined) so it's
// easy to re-derive if the impact-phase duration/span ever changes.
export const APPROACH_P_DELTA = 0.00157;
const HOLD_TIMESCALE = 0;         // FIX N — full freeze at impact (was a tiny "creep"); tween.pause() is the real stop, this is just bookkeeping for restore
const HINT_DELAY_MS = 600;        // real time before the "tap to continue" hint fades in (measured from the FREEZE, i.e. true impact)
const IDLE_FALLBACK_MS = 8000;    // real time before auto-continuing if the user never taps (never feel stuck)
const PULSE_MS = 400;

// MOCK round 3 (tasks 1+2): BAND_LABEL/BAND_ANNOUNCE are gone — the chip
// shows strikeDisplay(state).chip (corrected band label ALONE, no "· N%")
// and announces strikeDisplay(state).announce.

// clamp the marker offset to a sane on-blade range (roughly the blade's own
// face height) so extreme Fat/Duff/Thin contact doesn't place the ring
// floating off the visible mesh — it pins to the sole/topline edge instead.
//
// FIX (2026-07-02, freeze-zoom vertical-misalignment diagnosis) — this was
// BALL_RADIUS_M*1.0 (±21mm, ~42mm total), sized as if the visible face plate
// were roughly ball-sized. Measured directly against the actual asset
// (assets/club7.glb) geometry, the real grooved face plate is ~101mm tall
// (faceAnchor/sweet-spot sits only ~39mm above the sole and ~62mm below the
// hosel-top/topline — see geo3d/club.js's SOLE-HEIGHT correction comment for
// the full diagnosis). The old ±21mm clamp was so much smaller than the real
// ~101mm face that any Fat/Thin offset beyond a few mm (which is most of
// them — clubBallContact's offsets only span roughly ±30mm even at
// Duff/Whiff) left the marker pinned close to faceAnchor's own position near
// the TOP of the face — reading as "stuck near the topline" regardless of
// band, and for extreme bands appearing to float off the mesh entirely once
// combined with the sole-height fix's corrected (taller, true-to-asset)
// blade placement. ±38mm keeps the marker within the measured face bounds in
// both directions (face spans local Y ~[-39mm, +62mm] from faceAnchor; 38mm
// is the tighter of the two margins, kept symmetric since clubBallContact's
// offset can be positive or negative) with a small inset so it never touches
// the literal mesh edge.
const MARKER_CLAMP_M = 0.038;

/**
 * @param {object} opts
 *   sa3d      — geo3d/scene.js instance ({ scene, camera, rig, applyRig, invalidate })
 *   club3d    — geo3d/club.js instance (faceAnchor, group)
 *   chipEl    — DOM node for the band-label chip (created/owned by geometry.html)
 *   liveEl    — aria-live DOM node for the one-shot announcement
 *   hintEl    — DOM node for the "tap to continue" hint chip (optional)
 *   dismissEl — DOM node (the scene canvas) whose pointerdown dismisses the
 *               indefinite hold early (optional; keydown Esc/Enter always works
 *               regardless, scoped to window while a hold is active)
 *   getReduced — () => boolean
 *   hideNodes  — array OR () => array of THREE.Object3D whose .visible is
 *                flipped false on cutIn and restored true on endHold/reset
 *                (FIX K.1 — "only club + ball in the closeup"). Evaluated via
 *                a small resolver so a lazy getter function works too.
 *   hideLabels — array of DOM nodes whose `hidden` is set true on cutIn and
 *                restored to their PRE-ZOOM value on endHold/reset (not
 *                unconditionally false — a label that was already hidden
 *                before the zoom, e.g. no ground contact, must stay hidden).
 */
export function createFaceZoom({ sa3d, club3d, chipEl, liveEl, hintEl, dismissEl, getReduced, hideNodes, hideLabels }) {
  const THREEns = THREE;

  // ── contact marker: small emissive torus ring, child of faceAnchor ──────
  const ringGeo = new THREEns.TorusGeometry(RING_RADIUS_M, RING_TUBE_M, 10, 24);
  const ringMat = new THREEns.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0, toneMapped: false,
    depthWrite: false, depthTest: false, blending: THREEns.AdditiveBlending,
  });
  const marker = new THREEns.Mesh(ringGeo, ringMat);
  marker.visible = false;
  marker.renderOrder = 8;
  club3d.faceAnchor.add(marker);

  let active = false;          // a zoom detour (approach OR frozen hold) is currently in flight
  let stage = 'idle';          // FIX N — 'idle' | 'approach' (pre-impact slow-mo, still moving) | 'frozen' (paused at impact)
  let isWhiffRun = false;      // whether the CURRENT detour is the Whiff (ball-framing) branch
  let hintTimer = null;        // gsap delayedCall handle for the HINT_DELAY_MS fade-in
  let fallbackTimer = null;    // gsap delayedCall handle for the IDLE_FALLBACK_MS auto-continue
  let pulseTween = null;
  let announced = false;
  let dismissBound = false;    // whether the pointerdown/keydown listeners are currently attached

  let savedRig = null;         // { az, el, dist, tx, ty, tz } snapshot for hard cut-back
  let savedFov = null;
  let savedTweenTimeScale = null;
  let savedTweenWasPaused = null; // whether the swing tween was already paused before we touched it (defensive restore)
  let savedSwingTween = null;  // the timeline.js `tween` we dropped timeScale on / paused
  let pAtCutIn = null;         // FIX K.2 — anim3.p value at the moment cutIn() ran (continuity assert)
  let pImpactTarget = null;    // the target freeze p passed to runApproach(), for pAt.pImpact()

  // test-only overrides (ms) for the two real-time delays, so headless specs
  // don't have to wait 600ms/8000ms of actual wall-clock time. Defaults to
  // the production constants; geometry.html's __sa test hook can override.
  let hintDelayMs = HINT_DELAY_MS;
  let idleFallbackMs = IDLE_FALLBACK_MS;

  const lastContact = { active: false, band: null, offsetM: 0, offsetRatio: 0, pct: null };

  function setChip(text, color) {
    if (!chipEl) return;
    chipEl.textContent = text;
    chipEl.style.color = color || '';
  }
  function showChip() {
    if (!chipEl) return;
    chipEl.classList.add('is-visible');
  }
  function hideChip() {
    if (!chipEl) return;
    chipEl.classList.remove('is-visible');
  }
  function announceOnce(text) {
    if (announced || !liveEl) return;
    announced = true;
    liveEl.textContent = text;
  }
  function showHint() {
    if (!hintEl) return;
    hintEl.classList.add('is-visible');
  }
  function hideHint() {
    if (!hintEl) return;
    hintEl.classList.remove('is-visible');
  }

  // ── dismiss the indefinite hold: pointerdown on the canvas, or Esc/Enter ──
  function onDismissPointer(e) {
    e.preventDefault();
    endHold();
  }
  function onDismissKey(e) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      endHold();
    }
  }
  function bindDismiss() {
    if (dismissBound) return;
    dismissBound = true;
    if (dismissEl) dismissEl.addEventListener('pointerdown', onDismissPointer);
    window.addEventListener('keydown', onDismissKey);
  }
  function unbindDismiss() {
    if (!dismissBound) return;
    dismissBound = false;
    if (dismissEl) dismissEl.removeEventListener('pointerdown', onDismissPointer);
    window.removeEventListener('keydown', onDismissKey);
  }

  // ── FIX K.1 — "only club + ball in the closeup": hide every other node
  // (arc, glass plane/grid, lowpoint marker/plumb/brackets, ground-contact
  // strip/bracket, delivery arrow, target line, trail) on cutIn, restore on
  // endHold AND reset (mid-zoom kill-and-replace must also restore). Node
  // visibility is snapshotted right before hiding so restore is exact even
  // if some other code path changed a node's visible flag independently
  // while hidden (defensive; not expected in current callers).
  let hiddenNodes = [];         // { obj, prevVisible } snapshots, live only while active
  let hiddenLabelPrev = [];     // { el, prevHidden } snapshots for the DOM labels
  function resolveHideNodes() {
    if (!hideNodes) return [];
    const list = typeof hideNodes === 'function' ? hideNodes() : hideNodes;
    return Array.isArray(list) ? list.filter(Boolean) : [];
  }
  function hideSceneNodes() {
    hiddenNodes = resolveHideNodes().map((obj) => {
      const prevVisible = obj.visible;
      obj.visible = false;
      return { obj, prevVisible };
    });
    hiddenLabelPrev = (hideLabels || []).filter(Boolean).map((el) => {
      const prevHidden = el.hidden;
      el.hidden = true;
      return { el, prevHidden };
    });
  }
  function restoreSceneNodes() {
    for (const { obj, prevVisible } of hiddenNodes) obj.visible = prevVisible;
    for (const { el, prevHidden } of hiddenLabelPrev) el.hidden = prevHidden;
    hiddenNodes = [];
    hiddenLabelPrev = [];
  }

  // Horizontal centre of the blade face in faceAnchor-local X. The sweet-spot
  // origin is NOT the blade's visual horizontal centre (the hosel side skews
  // it), and the owner's rule is: the contact marker is ALWAYS horizontally
  // centred on the blade — only the VERTICAL position tells the strike story.
  //
  // FIX K.3 (2026-07-02): this now defers entirely to club3d's own
  // bladeFaceCentreXOffset (see club.js applyFaceCentreOffset) instead of
  // re-deriving it here via a world-space Box3.setFromObject. That approach
  // used to disagree with club.js's one-time measurement by several
  // centimetres, because an axis-ALIGNED world bbox is orientation-dependent
  // — sampling it at address pose (when club.js measures, right after GLB
  // load) vs mid-swing theta (when this used to first run, at impact) gave
  // two different "centres" for the same rigid mesh. club3d's own measurement
  // uses the mesh's LOCAL geometry bbox (orientation-independent) and is the
  // single source of truth; after club.js applies -bladeFaceCentreX to
  // modelSlot, the SAME quantity measured in faceAnchor-local space (which is
  // identical to group-local, since faceAnchor has zero local transform) is
  // ALWAYS ≈0 by construction — no separate computation needed here.
  function bladeFaceCentreX() {
    return 0; // see doc comment above — self-consistent by construction post-K.3
  }

  function placeMarker(state, sq) {
    const ct = clubBallContact(state);
    const raw = ct.offset; // metres, + = high on face, - = low on face
    const clamped = Math.max(-MARKER_CLAMP_M, Math.min(MARKER_CLAMP_M, raw));
    // torus lies in its local XY plane by default (ring normal = local +Z).
    // Since the CHIRALITY fix the face normal is local -Z (not +Z), so the
    // ring's own visible face already points the "wrong" way for a viewer in
    // front of the club face — but a flat ring reads identically from either
    // side, so no extra rotation is needed for appearance. Standoff moves
    // along -Z (toward the camera/face-normal side) to avoid z-fighting with
    // the blade mesh, which sits flush with the face plane at this same point.
    marker.position.set(bladeFaceCentreX(), clamped, -RING_STANDOFF_M);
    ringMat.color.set(sq.color);
    return { offsetM: raw, clampedM: clamped };
  }

  function worldFacePoint(localY) {
    const p = new THREEns.Vector3(bladeFaceCentreX(), localY, 0);
    club3d.faceAnchor.localToWorld(p);
    return p;
  }
  function worldFaceNormal() {
    // face normal is local -Z since the CHIRALITY fix (canonical GLB face
    // axis is local -Z, not +Z — see club.js file header).
    const n = new THREEns.Vector3(0, 0, -1);
    n.transformDirection(club3d.faceAnchor.matrixWorld);
    return n.normalize();
  }

  const _worldUp = new THREEns.Vector3(0, 0, 1); // Z-up world (see scene.js file header)

  // FIX N — 3/4 front camera offset: the face-normal offset, rotated
  // FACE_ZOOM_AZIMUTH_DEG around world-up. A plain faceNormal*DIST offset
  // put the camera dead-on-face, so the ball (which sits directly in front
  // of the face at address) visually occludes the face/contact seam. Swinging
  // the offset toward the target side (+X) lets the camera see the incoming
  // clubface AND the ball-contact seam side-by-side instead of stacked.
  //
  // FIX P4 — the FROZEN stage now uses its own tighter azimuth/dist/up (see
  // FREEZE_* constants): once the ball is ghosted (see ghostBall()) it no
  // longer needs to be composed around, so the camera can sit closer to
  // dead-on-face and nearer, filling the frame with the blade + contact ring.
  // The moving APPROACH stage keeps the original wider 3/4 framing (the ball
  // is still opaque while the club is still travelling toward it).
  function faceZoomCameraOffset(useFreezePose) {
    const faceN = worldFaceNormal();
    const az = useFreezePose ? (freezeAzimuthOverride ?? FREEZE_AZIMUTH_DEG) : FACE_ZOOM_AZIMUTH_DEG;
    const dist = useFreezePose ? (freezeDistOverride ?? FREEZE_DIST) : FACE_ZOOM_DIST;
    return faceN.clone()
      .applyAxisAngle(_worldUp, THREEns.MathUtils.degToRad(az))
      .multiplyScalar(dist);
  }

  /** Compute (not apply) the current face-zoom camera pose for the given contact point. */
  function faceZoomCameraPose(contactWorld, useFreezePose) {
    const up = useFreezePose ? (freezeUpOverride ?? FREEZE_UP) : FACE_ZOOM_UP;
    const camPos = contactWorld.clone()
      .add(faceZoomCameraOffset(useFreezePose))
      .add(new THREEns.Vector3(0, 0, up));
    // FIX Q2a — the freeze camera never sinks below ~ground level (see the
    // FREEZE_CAM_MIN_Z doc block above: an under-sole grazing viewpoint is
    // what actually read as "club rotated" in the owner's LOW ON FACE
    // screenshot). Freeze pose only; the approach's own up=0.16 already keeps
    // it well above ground.
    if (useFreezePose) camPos.z = Math.max(camPos.z, FREEZE_CAM_MIN_Z);
    return camPos;
  }

  // FIX Q — the freeze-stage roll (see the FIX Q2b doc block above): rotate
  // the WORLD-up reference used to build the camera's screen-space "up"
  // around the camera's own view (forward) axis by rollDeg degrees before
  // lookAt. This is a pure view-space tilt — it only ever changes what reads
  // as "level" on screen, never the club/ball/scene geometry. rollDeg=0 (the
  // APPROACH stage, always) reproduces the original cam.up.set(0,0,1)
  // exactly.
  function rolledUp(camPos, aimWorld, rollDeg) {
    if (!rollDeg) return new THREEns.Vector3(0, 0, 1);
    const forward = aimWorld.clone().sub(camPos).normalize();
    return new THREEns.Vector3(0, 0, 1).applyAxisAngle(forward, THREEns.MathUtils.degToRad(rollDeg));
  }

  // ── FIX Q2b — dynamic per-shot leveling of the freeze read (see the doc
  // block at the FREEZE_* constants). All helpers here are freeze-stage-only.
  let appliedFreezeRollDeg = 0;   // camera roll actually applied at the current freeze (debug/report)
  let appliedModelLevelDeg = 0;   // cosmetic model rotation actually applied (debug/report; 0 = camera roll sufficed)
  let cosmeticLevel = null;       // { pos, quat } snapshot of club3d.group taken BEFORE the cosmetic rotation (null = none applied)

  /** World direction of the blade's toe–heel axis (blade local +X — includes
   * the live lie compensation, i.e. the axis whose world-horizontality is the
   * established physics fact). Falls back to the group/swing-basis X while
   * the GLB placeholder is showing. */
  function toeAxisWorld() {
    const node = club3d.blade || club3d.group;
    node.updateWorldMatrix(true, false);
    const e = node.matrixWorld.elements;
    const l = Math.hypot(e[0], e[1], e[2]) || 1;
    return new THREEns.Vector3(e[0] / l, e[1] / l, e[2] / l);
  }
  /** Physical half-width of the blade casting (m), from its local-geometry
   * bbox — the same measurement geometry-mock.html's soleSlope assert uses. */
  function bladeHalfWidthM() {
    const mesh = club3d.bladeMesh;
    if (mesh && mesh.geometry) {
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      const bb = mesh.geometry.boundingBox;
      return ((bb.max.x - bb.min.x) * mesh.scale.x) / 2;
    }
    return 0.045; // placeholder fallback (~ real casting half-width)
  }
  /** World position of the blade's visual face centre (bbox centre through
   * the live mesh matrixWorld — same point club.js's poseDebug()
   * faceCentreWorld reports). null while the placeholder is showing. Used as
   * the leveling measurement ANCHOR: parallel world lines project with
   * slightly different slopes under perspective depending on where they
   * cross the view, and the acceptance assert (geometry-mock.html soleSlope)
   * measures the toe–heel line through THIS point — measuring anywhere else
   * (e.g. the contact point, tried first) leaves an anchor-mismatch residual
   * of up to ~1° after the solve. Camera roll shifts ALL projected slopes
   * equally (rigid image rotation), so solving on the assert's own anchor
   * zeroes the assert exactly. */
  function bladeFaceCentreWorld() {
    const mesh = club3d.bladeMesh;
    if (!mesh || !mesh.geometry) return null;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    mesh.updateWorldMatrix(true, false);
    return mesh.geometry.boundingBox.getCenter(new THREEns.Vector3()).applyMatrix4(mesh.matrixWorld);
  }
  /** Screen slope (deg, y-down screen convention) of the toe–heel line
   * through `anchor`, projected with the camera AS CURRENTLY POSED. */
  function projectedToeSlopeDeg(anchor) {
    const toe = toeAxisWorld();
    const h = bladeHalfWidthM();
    const cam = sa3d.camera;
    cam.updateMatrixWorld(true);
    const a = anchor.clone().addScaledVector(toe, h).project(cam);
    const b = anchor.clone().addScaledVector(toe, -h).project(cam);
    const dx = (a.x - b.x) * cam.aspect; // NDC → pixel-proportional (W = aspect·H)
    const dy = -(a.y - b.y);             // NDC y-up → screen y-down
    let deg = Math.atan2(dy, dx) * 180 / Math.PI;
    if (deg > 90) deg -= 180;
    if (deg < -90) deg += 180;
    return deg;
  }
  /** Undo the FIX Q2b cosmetic model rotation (exact snapshot restore).
   * Idempotent; also self-healing in the normal flow — the resumed timeline's
   * placeAt() re-poses club3d.group from the true arc math every frame. */
  function restoreCosmeticLevel() {
    if (!cosmeticLevel) return;
    club3d.group.position.copy(cosmeticLevel.pos);
    club3d.group.quaternion.copy(cosmeticLevel.quat);
    club3d.group.updateWorldMatrix(true, true);
    cosmeticLevel = null;
    appliedModelLevelDeg = 0;
    sa3d.invalidate();
  }
  /** FIX Q2b fallback — rotate club3d.group by `residualDeg` (screen-space
   * degrees) around the camera's optical axis THROUGH the aim/contact point.
   * Because the camera looks straight at that pivot, the club's projection
   * rotates rigidly by exactly that angle while the contact point (marker +
   * ball seam) stays fixed on screen. Cosmetic and freeze-only — snapshot is
   * restored on endHold/reset/retrack. */
  function applyCosmeticLevel(aimWorld, residualDeg) {
    const grp = club3d.group;
    cosmeticLevel = { pos: grp.position.clone(), quat: grp.quaternion.clone() };
    const cam = sa3d.camera;
    const f = aimWorld.clone().sub(cam.position).normalize(); // optical axis (camera → aim)
    // screen-space rotation by +θ adds +θ to a measured atan2(dy,dx) slope;
    // to CANCEL residualDeg the club must rotate by −residualDeg on screen.
    // A right-handed rotation about f (which points AWAY from the camera)
    // by +θ reads as +θ in y-down screen coords (verified empirically via
    // the soleSlope assert), so the world angle is simply −residualDeg.
    const theta = THREEns.MathUtils.degToRad(-residualDeg);
    const parent = grp.parent;
    parent.updateWorldMatrix(true, false);
    const inv = parent.matrixWorld.clone().invert();
    const pivotLocal = aimWorld.clone().applyMatrix4(inv);
    const axisLocal = f.clone().transformDirection(inv);
    const q = new THREEns.Quaternion().setFromAxisAngle(axisLocal, theta);
    grp.quaternion.premultiply(q);
    grp.position.sub(pivotLocal).applyQuaternion(q).add(pivotLocal);
    grp.updateWorldMatrix(true, true);
    appliedModelLevelDeg = residualDeg;
    sa3d.invalidate();
  }

  /** Apply a camera pose (position + lookAt) without touching savedRig/savedFov bookkeeping.
   * rollDeg (FIX Q, optional) tilts cam.up around the view axis — freeze-stage-only, see rolledUp(). */
  function applyCamPose(camPos, aimWorld, rollDeg) {
    const cam = sa3d.camera;
    cam.position.copy(camPos);
    cam.up.copy(rolledUp(camPos, aimWorld, rollDeg));
    cam.lookAt(aimWorld);
    sa3d.invalidate();
  }

  /** Hard-cut the camera into the face-zoom pose (or ball-framing pose for Whiff). Saves rig/fov for cutOut(). */
  function cutIn(contactWorld, aimWorld, useFreezePose, rollDeg) {
    const cam = sa3d.camera;
    savedRig = { ...sa3d.rig };
    savedFov = cam.fov;

    applyCamPose(faceZoomCameraPose(contactWorld, useFreezePose), aimWorld, rollDeg);
    cam.fov = FACE_ZOOM_FOV;
    cam.updateProjectionMatrix();
    sa3d.invalidate();
  }

  /** Hard-cut the camera back to the pre-zoom pose (rig-driven, matches the rest of the app). */
  function cutOut() {
    if (savedRig) { Object.assign(sa3d.rig, savedRig); sa3d.applyRig(); }
    if (savedFov != null) { sa3d.camera.fov = savedFov; sa3d.camera.updateProjectionMatrix(); }
    savedRig = null; savedFov = null;
    sa3d.invalidate();
  }

  // ── FIX P4 — ghost the ball at freeze so the full blade face + contact ring
  // read THROUGH it (owner: "the clubhead disappears in the picture at
  // impact"). Tweens sa3d.ball.material opacity down to BALL_GHOST_OPACITY
  // and flips transparent:true; fully restored (transparent:false, opacity:1
  // — the ball's pre-existing rest state) on resume (endHold), reset, AND
  // kill-and-replace mid-freeze (reset() covers that last case too). A
  // ghostActive flag makes both paths idempotent — reset() can run after
  // endHold() already restored, or vice versa via a re-Hit mid-hold. ──────────
  let ghostActive = false;
  let ghostTween = null;
  let bladeLiftActive = false;
  let savedBladeEmissive = null; // THREE.Color snapshot, or null if no blade material this run
  let savedBallShading = null;   // { roughness, metalness, envMapIntensity } snapshot, or null
  function ghostBall(gsapRef, reduced) {
    if (!sa3d.ball || ghostActive) return;
    ghostActive = true;
    const mat = sa3d.ball.material;
    mat.transparent = true;
    // depthWrite:false while ghosted — otherwise the ball still writes full
    // solid depth even at low alpha, so the ring/blade drawn behind it (both
    // separate meshes, ordinary depth-tested draw order) get depth-occluded
    // regardless of how transparent the ball LOOKS.
    mat.depthWrite = false;
    // Flatten the lit response (roughness/metalness/env) while ghosted — a
    // PBR sphere under the scene's directional key light still renders a
    // bright, sharp specular highlight even at low alpha (lighting happens
    // BEFORE the alpha blend), so a naive opacity-only ghost still reads as
    // "solid white ball" rather than translucent. Killing the specular/env
    // response makes the low-alpha blend actually read as a faint outline.
    // Restored verbatim on unghostBall().
    savedBallShading = { roughness: mat.roughness, metalness: mat.metalness, envMapIntensity: mat.envMapIntensity };
    mat.roughness = 1; mat.metalness = 0; mat.envMapIntensity = 0;
    if (reduced || !gsapRef) {
      mat.opacity = BALL_GHOST_OPACITY;
      sa3d.invalidate();
      return;
    }
    if (ghostTween) ghostTween.kill();
    ghostTween = gsapRef.to(mat, {
      opacity: BALL_GHOST_OPACITY, duration: BALL_GHOST_MS / 1000, ease: 'power1.out',
      onUpdate: () => sa3d.invalidate(),
    });
  }
  function restoreBallShading(mat) {
    if (!savedBallShading) return;
    mat.roughness = savedBallShading.roughness;
    mat.metalness = savedBallShading.metalness;
    mat.envMapIntensity = savedBallShading.envMapIntensity;
    savedBallShading = null;
  }
  function unghostBall(gsapRef, reduced) {
    if (!sa3d.ball) { ghostActive = false; return; }
    const mat = sa3d.ball.material;
    if (ghostTween) { ghostTween.kill(); ghostTween = null; }
    if (!ghostActive) {
      // defensive: still make sure the ball is fully opaque (idempotent no-op
      // in the common case, but guards against a partially-applied state if
      // ghostBall() was interrupted before it ever set ghostActive).
      mat.opacity = 1;
      mat.transparent = false;
      mat.depthWrite = true;
      restoreBallShading(mat);
      sa3d.invalidate();
      return;
    }
    ghostActive = false;
    if (reduced || !gsapRef) {
      mat.opacity = 1;
      mat.transparent = false;
      mat.depthWrite = true;
      restoreBallShading(mat);
      sa3d.invalidate();
      return;
    }
    gsapRef.to(mat, {
      opacity: 1, duration: BALL_GHOST_MS / 1000, ease: 'power1.out',
      onUpdate: () => sa3d.invalidate(),
      onComplete: () => { mat.transparent = false; mat.depthWrite = true; restoreBallShading(mat); sa3d.invalidate(); },
    });
  }

  /** Slight brightness lift on the blade material during freeze (emissive
   * nudge) — restored to its pre-freeze emissive on cut-out. No-op if the
   * blade mesh/material isn't available (placeholder still showing, etc). */
  function liftBladeEmissive() {
    const mesh = club3d.bladeMesh;
    if (!mesh || !mesh.material || !mesh.material.emissive) return;
    bladeLiftActive = true;
    savedBladeEmissive = mesh.material.emissive.clone();
    mesh.material.emissive.set(BLADE_EMISSIVE_LIFT);
    sa3d.invalidate();
  }
  function restoreBladeEmissive() {
    if (!bladeLiftActive) return;
    bladeLiftActive = false;
    const mesh = club3d.bladeMesh;
    if (mesh && mesh.material && mesh.material.emissive && savedBladeEmissive) {
      mesh.material.emissive.copy(savedBladeEmissive);
    }
    savedBladeEmissive = null;
    sa3d.invalidate();
  }

  function clearMarker() {
    marker.visible = false;
    ringMat.opacity = 0;
    if (pulseTween) { pulseTween.kill(); pulseTween = null; }
  }

  function pulseMarker() {
    marker.visible = true;
    ringMat.opacity = 0.95;
    marker.scale.setScalar(1);
    if (!window.gsap) return;
    if (pulseTween) pulseTween.kill();
    pulseTween = window.gsap.timeline({ onUpdate: () => sa3d.invalidate() });
    pulseTween
      .to(marker.scale, { x: 1.4, y: 1.4, z: 1.4, duration: PULSE_MS / 2000, ease: 'power2.out' })
      .to(marker.scale, { x: 1, y: 1, z: 1, duration: PULSE_MS / 2000, ease: 'power2.in' });
  }

  /** Resume the swing tween exactly as it was before we touched it (restore
   * its pre-detour timeScale; play() it back if we paused it — but ONLY when
   * `revive` is true).
   *
   * revive=true  (endHold, i.e. user dismiss / natural continue): the SAME
   *   tween must keep driving the rest of the swing (finish/settle), so
   *   .play() is required to un-pause it.
   * revive=false (reset, i.e. kill-and-replace mid-zoom): timeline.js's
   *   play() already called tween.kill() on this exact tween just before
   *   calling reset() — DO NOT call .play() here. GSAP timelines are
   *   revivable: kill() followed by play() resurrects a "dead" timeline and
   *   it keeps ticking, which raced against the brand-new replacement swing
   *   timeline.js creates right after reset() returns (two tweens driving
   *   anim3.p at once — this was FIX N's own regression, caught by the
   *   kill-and-replace-mid-freeze self-verify). Only the timeScale
   *   bookkeeping needs restoring here; the tween object itself is garbage.
   */
  function resumeSwingTween(revive) {
    if (!savedSwingTween) return;
    try {
      if (savedTweenTimeScale != null) savedSwingTween.timeScale(savedTweenTimeScale);
      if (revive && savedTweenWasPaused === false) savedSwingTween.play();
    } catch (e) { /* tween may already be killed */ }
    savedSwingTween = null; savedTweenTimeScale = null; savedTweenWasPaused = null;
  }

  function endHold(cb) {
    if (hintTimer) { hintTimer.kill(); hintTimer = null; }
    if (fallbackTimer) { fallbackTimer.kill(); fallbackTimer = null; }
    unbindDismiss();
    cutOut();
    restoreCosmeticLevel(); // FIX Q2b — undo the freeze-only cosmetic leveling BEFORE the swing resumes (placeAt would overwrite it anyway; this makes it explicit + immediate)
    appliedFreezeRollDeg = 0;
    unghostBall(window.gsap, getReduced()); // FIX P4 — restore the ball to fully opaque on resume
    restoreBladeEmissive();
    restoreSceneNodes(); // FIX K.1 — bring back arc/plane/lowpoint/groundcontact/delivery/target-line/trail
    resumeSwingTween(true); // revive: this IS the tween that must keep driving finish/settle
    clearMarker();
    hideChip();
    hideHint();
    active = false;
    stage = 'idle';
    isWhiffRun = false;
    pImpactTarget = null;
    if (cb) cb();
  }

  /**
   * Stage 1 — cut in shortly BEFORE impact and drop into slow-mo (FIX N).
   * Called from timeline.js's onUpdate once p crosses pImpact-APPROACH_P_DELTA.
   * The club is still moving: camera/marker must be re-tracked every frame
   * via trackApproach() until freeze() is called at true impact. No-ops under
   * reduced motion or if a detour is already active (never stack/re-enter).
   *
   * @param state       live swing state
   * @param swingTween  the GSAP timeline currently driving anim3.p (for timeScale/pause)
   * @param pNow        the live anim3.p value AT the moment of cut-in (FIX K.2 continuity)
   * @param pImpact     the target freeze p (for pAt.pImpact() + trackApproach's Whiff aim)
   */
  function runApproach(state, swingTween, pNow, pImpact) {
    if (getReduced()) return;
    if (active) return; // never stack detours
    active = true;
    stage = 'approach';
    announced = false;
    pAtCutIn = typeof pNow === 'number' ? pNow : null;
    pImpactTarget = typeof pImpact === 'number' ? pImpact : null;

    // FIX K.1 — hide everything except club/ball/contact-marker/chip/hint for
    // the duration of the closeup (covers both the normal and Whiff branches).
    hideSceneNodes();

    const disp = strikeDisplay(state);
    isWhiffRun = !disp.contact; // ROUND 3: ball-framing branch ONLY on a real miss

    lastContact.active = true;
    lastContact.band = disp.band;
    lastContact.pct = disp.pct;

    if (isWhiffRun) {
      clearMarker();
      lastContact.offsetM = null;
      lastContact.offsetRatio = null;
    } else {
      const { offsetM } = placeMarker(state, disp);
      lastContact.offsetM = offsetM;
      lastContact.offsetRatio = clubBallContact(state).offsetRatio;
    }
    trackApproach(state); // first frame of the cut — also does the savedRig/savedFov hard-cut

    if (swingTween && swingTween.timeScale) {
      savedSwingTween = swingTween;
      savedTweenTimeScale = swingTween.timeScale();
      savedTweenWasPaused = swingTween.paused ? swingTween.paused() : false;
      swingTween.timeScale(APPROACH_TIMESCALE);
    }
  }

  /** Re-track the camera/marker onto the club's CURRENT pose (shared by the
   * approach's per-frame tracking and the freeze's final snap). First call
   * (no savedRig yet) does the hard-cut + saves rig/fov; subsequent calls
   * just move the already-cut camera. */
  function trackCameraToState(state) {
    if (isWhiffRun) {
      // MOCK (ball-position prototype): read the ball's ACTUAL world position
      // from the scene (geometry-mock.html nudges sa3d.ball.position.x by
      // state.ballPosition — stance frame) instead of assuming the engine-
      // frame origin, so the Whiff framing follows the shifted ball. The
      // non-Whiff branch needs no change: worldFacePoint() goes through
      // faceAnchor.matrixWorld, which already includes the wrapper shift.
      const ballWorld = sa3d.ball
        ? sa3d.ball.getWorldPosition(new THREEns.Vector3())
        : new THREEns.Vector3(0, 0, BALL_RADIUS_M);
      // frame the ball with the club passing OVER it: camera pulled back along
      // the (rotated) face-normal offset from a point just above the ball.
      const camPos = ballWorld.clone().add(faceZoomCameraOffset()).add(new THREEns.Vector3(0, 0, FACE_ZOOM_UP + BALL_RADIUS_M * 1.5));
      if (!savedRig) { savedRig = { ...sa3d.rig }; savedFov = sa3d.camera.fov; }
      applyCamPose(camPos, ballWorld);
      sa3d.camera.fov = FACE_ZOOM_FOV;
      sa3d.camera.updateProjectionMatrix();
      sa3d.invalidate();
    } else {
      // FIX Q2b — measurements (and the cosmetic fallback) must always start
      // from the club's TRUE physics pose: undo any leveling a previous
      // frozen-frame track applied (retrack/test path; the normal flow only
      // reaches the frozen branch once per freeze). No-op when none applied.
      if (stage === 'frozen') restoreCosmeticLevel();
      const disp = strikeDisplay(state);
      const { offsetM } = placeMarker(state, disp);
      lastContact.offsetM = offsetM;
      lastContact.offsetRatio = clubBallContact(state).offsetRatio;
      const contactWorld = worldFacePoint(Math.max(-MARKER_CLAMP_M, Math.min(MARKER_CLAMP_M, offsetM)));
      // FIX P4 — the frozen stage uses the tighter, closer-to-dead-on freeze
      // pose (ball is ghosted by now so it doesn't need the wider 3/4 berth).
      const useFreezePose = stage === 'frozen';
      // pose at roll=0 first — the FIX Q2b dynamic solve below measures the
      // projected slope against this un-rolled view. The moving APPROACH
      // stage always stays roll=0/cam.up=world-up (no leveling mid-motion).
      if (!savedRig) {
        cutIn(contactWorld, contactWorld, useFreezePose, 0); // first frame: also saves rig/fov + sets fov
      } else {
        applyCamPose(faceZoomCameraPose(contactWorld, useFreezePose), contactWorld, 0);
      }
      if (useFreezePose) {
        // ── FIX Q2b — dynamic per-shot leveling (see the FREEZE_* doc block).
        let roll = 0, residual = 0;
        if (freezeRollOverride != null) {
          roll = freezeRollOverride; // test override: fixed roll, dynamic solve disabled
        } else {
          // measure on the face-centre anchor (falls back to the contact
          // point pre-GLB) — see bladeFaceCentreWorld()'s doc comment.
          const s0 = projectedToeSlopeDeg(bladeFaceCentreWorld() || contactWorld);
          const maxRoll = freezeMaxRollOverride ?? FREEZE_ROLL_MAX_DEG;
          roll = Math.max(-maxRoll, Math.min(maxRoll, s0));
          residual = s0 - roll; // beyond the camera-roll budget → cosmetic model rotation
        }
        if (roll) applyCamPose(faceZoomCameraPose(contactWorld, true), contactWorld, roll);
        appliedFreezeRollDeg = roll;
        if (residual) applyCosmeticLevel(contactWorld, residual);
      }
    }
  }

  /** Re-track the camera/marker onto the club's CURRENT pose. Called every
   * onUpdate frame from timeline.js while stage === 'approach' (the club is
   * still moving toward the ball in slow-mo, right up to the freeze). No-op
   * once frozen (freeze() does its own final trackCameraToState() call). */
  function trackApproach(state) {
    if (stage !== 'approach') return;
    trackCameraToState(state);
  }

  /**
   * Stage 2 — FULL FREEZE at the exact impact moment (FIX N). Called once
   * from timeline.js's doImpactFx() at true impact. Pauses the swing tween
   * outright (not just slow-mo), does one final camera/marker track so the
   * freeze frame matches the true-impact club pose exactly, then shows the
   * marker pulse/band chip/"tap to continue" hint and starts the dismiss
   * timers — same UI as before, just triggered at the freeze instead of at
   * the (now earlier) cut-in.
   */
  function freeze(state, swingTween) {
    if (getReduced()) return;
    if (!active) {
      // defensive: freeze() should always be preceded by runApproach(), but if
      // the approach trigger was somehow missed (e.g. p jumped straight past
      // both thresholds in one frame), cut in now rather than never freezing.
      runApproach(state, swingTween, null, null);
    }
    stage = 'frozen';
    trackCameraToState(state); // final snap: freeze frame must match the TRUE-impact club pose exactly

    const disp = strikeDisplay(state);
    setChip(disp.chip, disp.textColor); // ROUND 3: band label alone — no %
    showChip();
    announceOnce('Strike: ' + disp.announce);
    if (!isWhiffRun) {
      pulseMarker();
      // FIX P4 — ghost the ball + lift the blade only on real contact (Whiff
      // has no ball/face contact to reveal, and no clubface occlusion problem
      // to solve — the club passes clean over the ball, see the Whiff camera
      // branch in trackCameraToState()).
      ghostBall(window.gsap, getReduced());
      liftBladeEmissive();
    }

    if (swingTween && swingTween.pause) {
      if (!savedSwingTween) {
        savedSwingTween = swingTween;
        savedTweenTimeScale = swingTween.timeScale ? swingTween.timeScale() : null;
        savedTweenWasPaused = swingTween.paused ? swingTween.paused() : false;
      }
      swingTween.pause();
    }

    // indefinite hold: dismiss via tap/click on the canvas or Esc/Enter/Space,
    // a discreet hint fades in after HINT_DELAY_MS, and an idle fallback
    // auto-continues after IDLE_FALLBACK_MS so the app never feels stuck.
    if (window.gsap) {
      bindDismiss();
      hideHint();
      hintTimer = window.gsap.delayedCall(hintDelayMs / 1000, () => showHint());
      fallbackTimer = window.gsap.delayedCall(idleFallbackMs / 1000, () => endHold());
    } else {
      // no GSAP (shouldn't happen in practice) — nothing to drive the hold's
      // real-time timers, so fall back to ending immediately.
      endHold();
    }
  }

  /** Reduced-motion path: show the chip statically after the swing completes, no camera/zoom. */
  function showStaticChip(state) {
    const disp = strikeDisplay(state);
    lastContact.active = false; // no zoom happened
    lastContact.band = disp.band;
    lastContact.pct = disp.pct;
    lastContact.offsetM = disp.contact ? clubBallContact(state).offset : null;
    lastContact.offsetRatio = disp.contact ? clubBallContact(state).offsetRatio : null;
    setChip(disp.chip, disp.textColor); // ROUND 3: band label alone — no %
    showChip();
    announced = false;
    announceOnce('Strike: ' + disp.announce);
    clearMarker();
  }

  /** Full reset — called from timeline.js on fx.reset()/kill-and-replace
   * (e.g. a re-Hit mid-zoom, whether mid-approach OR mid-freeze). Must restore
   * everything either sub-stage could have left in place: camera/fov,
   * timeScale, PAUSE STATE (FIX N — freeze uses tween.pause(), not just a
   * timeScale drop, so a kill-and-replace mid-freeze must also tween.play()
   * or the replacement swing never starts), the dismiss listeners, both
   * real-time timers, and hidden-node visibility. */
  function reset() {
    if (hintTimer) { hintTimer.kill(); hintTimer = null; }
    if (fallbackTimer) { fallbackTimer.kill(); fallbackTimer = null; }
    unbindDismiss();
    if (active) {
      // mid-zoom kill: restore camera/fov/timeScale/pause-state immediately
      // (no cb — caller (timeline.play()) is about to re-snapshot
      // cameraBaseRig itself).
      if (savedRig) { Object.assign(sa3d.rig, savedRig); sa3d.applyRig(); }
      if (savedFov != null) { sa3d.camera.fov = savedFov; sa3d.camera.updateProjectionMatrix(); }
      restoreCosmeticLevel(); // FIX Q2b — a kill-and-replace mid-freeze must also undo the cosmetic leveling (the replacement swing re-poses from address)
      appliedFreezeRollDeg = 0;
      resumeSwingTween(false); // NOT revive — caller already killed this exact tween; don't resurrect it (see resumeSwingTween doc)
      restoreSceneNodes(); // FIX K.1 — kill-and-replace mid-zoom must also restore hidden nodes
      // FIX P4 — a re-Hit mid-FREEZE must un-ghost the ball/restore the blade
      // immediately too (no tween — the replacement swing is about to start
      // from address, where the ball must already read fully opaque).
      if (ghostActive || (sa3d.ball && sa3d.ball.material.opacity !== 1)) unghostBall(null, true);
      if (bladeLiftActive) restoreBladeEmissive();
    }
    savedRig = null; savedFov = null; savedSwingTween = null; savedTweenTimeScale = null; savedTweenWasPaused = null;
    active = false;
    stage = 'idle';
    isWhiffRun = false;
    pImpactTarget = null;
    announced = false;
    clearMarker();
    hideChip();
    hideHint();
    lastContact.active = false;
    lastContact.band = null;
    lastContact.offsetM = 0;
    lastContact.offsetRatio = 0;
    lastContact.pct = null;
  }

  /** Test hook: force the hold to end immediately (skips waiting for a real
   * tap/click or the idle fallback) so headless screenshot/assert flows can
   * be deterministic. No-op if no zoom is active. */
  function endNow() {
    if (!active) return;
    endHold();
  }

  return {
    marker,
    // FIX N — two-stage API (replaces the old single run()): runApproach()
    // cuts in early + slow-mo, trackApproach() re-tracks every frame while
    // approaching, freeze() pauses at true impact and shows chip/hint.
    runApproach,
    trackApproach,
    freeze,
    showStaticChip,
    reset,
    endNow,
    isActive: () => active,
    // 'idle' | 'approach' (pre-impact slow-mo, still moving) | 'frozen' (paused at impact)
    stage: () => stage,
    lastContact,
    // FIX K.2 — the anim3.p value captured exactly when cutIn() ran (null if
    // no zoom has happened yet). Paired with geometry.html's pAt.now() (the
    // LIVE anim3.p) to assert p is FROZEN once the hold reaches impact (FIX N
    // — was "creeps forward"; now the tween is fully paused at freeze).
    pAtCutIn: () => pAtCutIn,
    // FIX N — the target freeze p passed to the most recent runApproach()
    // call (the timeline's pImpact at that time). null before any swing.
    pImpact: () => pImpactTarget,
    // test-only: override the hint-fade-in / idle-fallback delays (ms) so
    // headless specs can verify the fallback without waiting 8s of real
    // time. Takes effect on the NEXT runApproach() call (not the current hold).
    _setTestDelays: ({ hintDelayMs: h, idleFallbackMs: i } = {}) => {
      if (typeof h === 'number') hintDelayMs = h;
      if (typeof i === 'number') idleFallbackMs = i;
    },
    // FIX Q — test-only: override the FREEZE pose's azimuth/dist/up/roll
    // (null clears an individual override, falling back to the tuned
    // FREEZE_* constant). Combined with retrack() below, this lets headless
    // screenshot iteration re-pose the camera against an ALREADY-frozen frame
    // — no need to re-run a full swing per candidate. Persists across swings
    // (same pattern as _setTestDelays) until explicitly cleared.
    _setFreezeOverrides: ({ azimuthDeg, dist, up, rollDeg, maxRollDeg } = {}) => {
      if (azimuthDeg !== undefined) freezeAzimuthOverride = azimuthDeg;
      if (dist !== undefined) freezeDistOverride = dist;
      if (up !== undefined) freezeUpOverride = up;
      if (rollDeg !== undefined) freezeRollOverride = rollDeg;
      if (maxRollDeg !== undefined) freezeMaxRollOverride = maxRollDeg;
    },
    _getFreezeOverrides: () => ({
      azimuthDeg: freezeAzimuthOverride, dist: freezeDistOverride,
      up: freezeUpOverride, rollDeg: freezeRollOverride, maxRollDeg: freezeMaxRollOverride,
    }),
    // FIX Q — test-only: re-run the camera/marker track against the CURRENT
    // club pose (a no-op on the engine/timeline — just recomputes + reapplies
    // the camera pose using whatever overrides are active). Safe to call
    // anytime club3d/sa3d exist; most useful while stage()==='frozen' (the
    // pose stays screenshot-stable) to iterate camera numbers live.
    retrack: (state) => trackCameraToState(state),
    // debug-only: camera/marker world pose for azimuth/distance tuning (screenshot iteration).
    _debugPose: () => ({
      camPos: sa3d.camera.position.toArray(),
      camUp: sa3d.camera.up.toArray(),
      camFov: sa3d.camera.fov,
      markerWorld: (() => { const v = new THREEns.Vector3(); marker.getWorldPosition(v); return v.toArray(); })(),
      faceNormal: worldFaceNormal().toArray(),
      azimuthDeg: FACE_ZOOM_AZIMUTH_DEG, dist: FACE_ZOOM_DIST, up: FACE_ZOOM_UP,
      // FIX P4 — freeze-stage pose + ball-ghost/blade-lift diagnostics.
      freezeAzimuthDeg: freezeAzimuthOverride ?? FREEZE_AZIMUTH_DEG,
      freezeDist: freezeDistOverride ?? FREEZE_DIST,
      freezeUp: freezeUpOverride ?? FREEZE_UP,
      // FIX Q2 — dynamic-leveling diagnostics: the camera roll actually
      // applied at the current freeze (solved per shot, or the fixed
      // rollDeg override), the cosmetic model rotation applied when the
      // roll budget was exceeded (0 = camera roll sufficed), whether a
      // cosmetic snapshot is currently held, and the cam-height floor.
      appliedFreezeRollDeg: +appliedFreezeRollDeg.toFixed(3),
      appliedModelLevelDeg: +appliedModelLevelDeg.toFixed(3),
      cosmeticLevelActive: !!cosmeticLevel,
      freezeCamMinZ: FREEZE_CAM_MIN_Z,
      freezeRollMaxDeg: FREEZE_ROLL_MAX_DEG,
      rollOverride: freezeRollOverride,
      ballOpacity: sa3d.ball ? sa3d.ball.material.opacity : null,
      ballTransparent: sa3d.ball ? sa3d.ball.material.transparent : null,
      ballDepthWrite: sa3d.ball ? sa3d.ball.material.depthWrite : null,
      ghostActive,
      bladeLiftActive,
    }),
  };
}
