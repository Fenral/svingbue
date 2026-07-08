/**
 * geo3d/club.js — full 3D club (assets/club7.glb), address-pose placement,
 * and dynamic lie compensation. Retires the old ortho #clubCanvas overlay
 * when ?three is active (wiring for that lives in geometry.html).
 *
 * WORLD-SPACE PLACEMENT (pure engine math, no camera):
 *   head   = arcPosition(theta, state)
 *   Yw     = normalize(shaftPivot(state) - head)      // up the shaft — local +Y maps here
 *   FACEw  = normalize(tangentAt(theta, state))        // face normal ≈ swing tangent
 *   basis.Z (local +Z's world direction) = -FACEw      // canonical face axis is LOCAL -Z (see CHIRALITY)
 *   basis.X (local +X's world direction) = Yw × basis.Z = Yw × (-FACEw)  // toe direction
 *   basis.Y = basis.Z × basis.X                        // re-orthonormalize (Gram-Schmidt)
 *   clubGroup.quaternion <- makeBasis(basis.X, basis.Y, basis.Z)
 *   clubGroup.position   <- head
 *
 * CHIRALITY (fixed 2026-07-02): tools/build-club-glb.mjs used to bake the
 * blade with an improper mirror transform (MIRROR_X) for one branch of the
 * source data, silently flipping the model's handedness — toe ended up on
 * the wrong side of the world swing basis (owner-reported: toe pointed
 * toward the golfer at address instead of toward the camera in FACE view).
 * The pipeline now always uses a proper rotation (ROT_Y_180), so the
 * canonical GLB frame is: +Y up the shaft, -Z out of the face (NOT +Z),
 * +X toward the toe. `basis.Z` here is still "the world direction the
 * local +Z axis maps to" (unchanged contract, used verbatim by makeBasis
 * and by the lie-compensation math below) — it is simply no longer equal
 * to the face normal; the face normal is -basis.Z. See checkAlign3d in
 * geometry.html and geo3d/facezoom.js for the local -Z face-axis usage.
 *
 * DYNAMIC LIE COMPENSATION: the blade node (hosel pivot) is rotated about its
 * local Z axis (the rotation axis carried by basis.Z, i.e. the SHAFT/face
 * plane normal direction — not literally "the face" anymore, see CHIRALITY)
 * so the sole (blade's local XZ plane) stays flush with the world ground
 * plane (z=0) at the address/impact pose, for any planeAngle 45–70°.
 * Recomputed whenever planeAngle/swingDirection change. The math itself
 * (computeLieDelta) only depends on the local X/Y/Z triple being orthonormal
 * and rotation being about local Z — it is unaffected by which world
 * direction "the face" is, so it needed NO changes for this fix.
 *
 * Canonical GLB frame (baked): total length 0.953 m along shaft, origin at
 * the face sweet spot, +Y up the shaft, -Z out of the face, +X toward toe.
 * Node hierarchy: club7 -> blade (hosel pivot) -> bladeMesh; shaftGroup ->
 * shaft/ferrule/grip. Do not reparent or zero bladeMesh's transform (it
 * carries the meshopt dequantization offset).
 *
 * FIX K.3 (2026-07-02) — BALL ALWAYS HORIZONTALLY CENTRED IN THE CLUBHEAD:
 * deliberate simplification, no toe/heel nuance. Once (right after GLB load)
 * a constant local -X offset equal to -bladeFaceCentreX is baked into
 * `modelSlot.position.x` — NOT into faceAnchor, which stays at the group's
 * origin and remains the canonical swing basis used by clubBasisAt/
 * checkAlign3d/facezoom.js. bladeFaceCentreX is the blade mesh's own visual
 * horizontal centre (its bbox centre, which the hosel skews away from the
 * GLB's authored sweet-spot origin) — after the offset, the model's visual
 * face-centre rides the arc exactly, while faceAnchor/clubGroup.position
 * still track the ORIGINAL sweet-spot math untouched (checkAlign3d's
 * position/face-dot asserts are unaffected; see applyFaceCentreOffset()).
 *
 * SOLE-HEIGHT correction (2026-07-02, freeze-zoom vertical-misalignment fix)
 * — DYNAMIC LIE COMPENSATION above only fixes the sole's ORIENTATION
 * (rotating a node about its own origin never moves that origin); the hosel
 * pivot's own world HEIGHT was left to whatever `group`'s raw tilted
 * orientation happened to place it at, which — combined with this asset's
 * real ~100mm hosel-to-sole arm (not the idealised ~21mm the header above
 * once assumed) — let the sole drift tens of mm from the ground even once
 * correctly leveled. applySoleHeightCorrection() (below computeLieDelta) now
 * nudges ONLY `blade`'s position (never group/faceAnchor, which stay the
 * untouched swing-physics anchor) so the sole sits a FIXED, once-measured
 * distance below faceAnchor at every theta — see its doc comment for the
 * full diagnosis and why the target is faceAnchor-relative, not literal
 * ground (world Z=0), so Fat/Thin (state.lowPoint.z) keeps working.
 */
import * as THREE from '../vendor/three/build/three.module.js';
import { GLTFLoader } from '../vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../vendor/three/examples/jsm/libs/meshopt_decoder.module.js';
import { arcPosition, shaftPivot, tangentAt, thetaAtImpact, deg2rad, BALL_RADIUS_M } from '../swing-parameters-and-impact.js';

const GLB_URL = new URL('../assets/club7.glb', import.meta.url).href;

// address pose: clubhead sits just behind the ball (matches geometry.html's REST_BEHIND)
const REST_BEHIND = deg2rad(5);
export function addressTheta(state) {
  return thetaAtImpact(state) - REST_BEHIND;
}

// ── materials (assigned by node/mesh name — the GLB carries none) ─────────
function buildMaterials() {
  return {
    blade: new THREE.MeshStandardMaterial({ color: 0xc2c7cf, metalness: 1.0, roughness: 0.30, envMapIntensity: 1.15 }),
    shaft: new THREE.MeshStandardMaterial({ color: 0x2a2d31, metalness: 0.9, roughness: 0.35 }),
    ferrule: new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.6, roughness: 0.15 }),
    grip: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.0, roughness: 0.90 }),
  };
}

// ── placeholder: small box head only, shown until the GLB loads (and
// permanently on load error) so the scene never looks broken. FIX P1 — the
// shaft is retired from the real club (see shaftGroup.visible = false below),
// so the placeholder no longer draws one either; a stray placeholder shaft
// would look inconsistent with the loaded head-only club it's standing in for. ─
function buildPlaceholder() {
  const group = new THREE.Group();
  const headMat = new THREE.MeshStandardMaterial({ color: 0xc2c7cf, metalness: 0.9, roughness: 0.35 });

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.045, 0.028), headMat);
  head.position.set(0.02, 0.02, 0);
  head.castShadow = true;

  group.add(head);
  group.userData.isPlaceholder = true;
  return group;
}

// ── math helpers (plain objects, mirrors swing-parameters-and-impact.js) ──
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const norm = v => { const m = Math.hypot(v.x, v.y, v.z) || 1; return { x: v.x / m, y: v.y / m, z: v.z / m }; };
const cross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

/**
 * Compute the world-space orthonormal basis [X,Y,Z] + position for the club
 * at a given theta. Pure engine math — no camera/basis involvement.
 *
 * basis.X/Y/Z are the world directions that the club group's LOCAL +X/+Y/+Z
 * axes map to. Since the canonical GLB face axis is local -Z (not +Z — see
 * file header CHIRALITY note), basis.Z is the NEGATED swing tangent
 * (-FACEw), not the face normal itself; the face normal is -basis.Z.
 */
export function clubBasisAt(theta, state) {
  const head = arcPosition(theta, state);
  const pivot = shaftPivot(state);
  let Y = norm(sub(pivot, head));
  if (!isFinite(Y.x) || Math.hypot(Y.x, Y.y, Y.z) < 1e-6) Y = { x: 0, y: 0, z: 1 };
  const tan = tangentAt(theta, state); // FACEw: world direction the FACE (local -Z) should point
  let faceW = norm(tan);
  if (!isFinite(faceW.x) || Math.hypot(faceW.x, faceW.y, faceW.z) < 1e-6) faceW = { x: 0, y: -1, z: 0 };
  let Z = { x: -faceW.x, y: -faceW.y, z: -faceW.z }; // local +Z world dir = -FACEw
  // Gram-Schmidt: keep Z, re-derive X, then Y so the frame is exactly orthonormal
  let X = norm(cross(Y, Z));
  if (!isFinite(X.x) || Math.hypot(X.x, X.y, X.z) < 1e-6) X = { x: 1, y: 0, z: 0 };
  Y = norm(cross(Z, X));
  return { head, X, Y, Z };
}

export function createClub(state) {
  const group = new THREE.Group();     // top-level group: position + orientation on the arc
  const modelSlot = new THREE.Group(); // holds either placeholder or the loaded GLB scene
  group.add(modelSlot);

  const faceAnchor = new THREE.Object3D(); // sweet spot (model origin) — future contact marker
  group.add(faceAnchor);

  const materials = buildMaterials();
  let placeholder = buildPlaceholder();
  modelSlot.add(placeholder);

  let blade = null;      // node at the hosel pivot (rotate .rotation.z for lie)
  let bladeMesh = null;
  let shaftGroup = null;
  let loaded = false;
  let loadFailed = false;
  let lastTheta = null;
  let lastLieDeg = 0;
  let lastBlend = 1; // MOCK (challenge 1b-i) — last blend passed to updateBlended (0=grounded address)

  // ── FIX K.3 — ball always horizontally centred in the clubhead at impact ──
  // Deliberate simplification (owner-approved, no toe/heel nuance): apply a
  // constant local -X offset to modelSlot (NOT faceAnchor — faceAnchor stays
  // the canonical swing basis used by checkAlign3d's face-dot assert and
  // facezoom.js's marker/camera math) equal to -bladeFaceCentreX, so the
  // blade's horizontal FACE centre (not the hosel-skewed sweet-spot origin
  // the GLB was authored around) is the point that actually rides the arc.
  // Computed once after GLB load from bladeMesh's bbox centre in modelSlot's
  // OWN local frame (i.e. before the offset is applied — bbox is measured
  // pre-offset, so there's no feedback loop).
  let bladeFaceCentreX = 0;
  function applyFaceCentreOffset() {
    if (!bladeMesh) return;
    // Use the mesh's own LOCAL geometry bounding box (orientation-independent)
    // rather than a world-space Box3.setFromObject — the latter recomputes an
    // axis-ALIGNED box from the mesh's current world orientation, so the same
    // rigid point reads a different "centre" at address pose vs mid-swing
    // theta (this was the original bug: club.js's one-time measurement and
    // facezoom.js's own live bladeFaceCentreX() disagreed by several cm
    // because they sampled the AABB at two different club orientations).
    if (!bladeMesh.geometry.boundingBox) bladeMesh.geometry.computeBoundingBox();
    const localCentre = bladeMesh.geometry.boundingBox.getCenter(new THREE.Vector3());
    // Map that single point through the FIXED (address-pose-independent)
    // part of the local chain: bladeMesh's own local matrix, then blade's
    // local POSITION only (blade's rotation.z is the live lie-compensation
    // angle, which must NOT factor into a one-time structural measurement —
    // it changes every frame and isn't part of "where the face centre sits
    // on the rigid blade casting").
    bladeMesh.updateMatrix();
    const p = localCentre.clone().applyMatrix4(bladeMesh.matrix);
    if (blade) p.add(blade.position);
    bladeFaceCentreX = p.x;
    modelSlot.position.x = -bladeFaceCentreX;
  }

  // ── MOCK (challenge 1b-ii, 2026-07-08) — DYNAMIC face-centre re-centering.
  // FIX K.3's static local-X offset is measured ONCE at lie=0, but the
  // dynamic lie compensation rotates the blade about its local Z by up to
  // ~±30° at extreme low points (thetaAtImpact ±9.6° tilts the shaft's
  // up-vector), swinging the blade's visual bbox centre up to ~26mm along
  // the toe axis — the ball no longer met the middle of the face WIDTH
  // (owner: "bladet skal treffe midt i sweetspot i bredden uansett
  // plan/retning/lowpoint/ballposisjon"). This recomputes the modelSlot X
  // offset on every update() so the blade's visual face centre sits EXACTLY
  // on the ride point's toe-axis line for the CURRENT lie rotation:
  //   err   = dot(bboxCentreWorld − groupWorld, toeAxisWorld)   (post-lie)
  //   δ     = −err / dot(basis.X_world, toeAxisWorld)           (= −err/cos d)
  //   modelSlot.position.x += δ            (one-shot exact — linear system)
  // Pure cosmetic model shift: group/faceAnchor (the swing-physics anchors
  // checkAlign3d asserts on) are untouched, and no derived number
  // (deriveImpact/clubBallContact/strikeQuality) ever reads modelSlot.
  // Runs BEFORE applySoleHeightCorrection (the shift along basis.X has a
  // small vertical component that the sole correction must see).
  const _dcC = new THREE.Vector3();
  const _dcT = new THREE.Vector3();
  const _dcG = new THREE.Vector3();
  function applyDynamicFaceCentring() {
    if (!bladeMesh || !blade) return;
    if (!bladeMesh.geometry.boundingBox) bladeMesh.geometry.computeBoundingBox();
    bladeMesh.updateWorldMatrix(true, false);
    bladeMesh.geometry.boundingBox.getCenter(_dcC).applyMatrix4(bladeMesh.matrixWorld);
    const be = blade.matrixWorld.elements;
    _dcT.set(be[0], be[1], be[2]).normalize(); // post-lie toe axis (horizontal by computeLieDelta's construction)
    group.getWorldPosition(_dcG);
    const err = (_dcC.x - _dcG.x) * _dcT.x + (_dcC.y - _dcG.y) * _dcT.y + (_dcC.z - _dcG.z) * _dcT.z;
    const ge = group.matrixWorld.elements;
    const denom = (ge[0] * _dcT.x + ge[1] * _dcT.y + ge[2] * _dcT.z) /
      (Math.hypot(ge[0], ge[1], ge[2]) || 1); // cos(lie delta)
    if (!isFinite(err) || Math.abs(denom) < 0.2) return; // degenerate guard
    modelSlot.position.x -= err / denom;
  }

  // ── FIX (2026-07-02) — SOLE-HEIGHT correction, freeze-zoom vertical
  // misalignment fix ─────────────────────────────────────────────────────
  // Diagnosis: the GLB's actual baked blade geometry has the sole ~100mm
  // below the hosel pivot (a real, physically plausible clubhead casting —
  // see tools/build-club-glb.mjs's own "output bounds" report), not the
  // idealised "~21mm below the sweet spot" the file header/build comments
  // describe. computeLieDelta() below only fixes the sole's ORIENTATION
  // (rotates `blade` about its own local Z so the sole plane is parallel to
  // the ground) — it cannot and does not fix the sole's HEIGHT, because
  // rotating a node about its own origin never moves that origin. The hosel
  // pivot's world height is whatever `group`'s raw (uncompensated, tilted by
  // loft/lie/attack-angle) orientation happens to place `pivotC` at — with a
  // ~100mm pivot-to-sole arm, that tilt swings the sole tens of mm away from
  // ground even though its ORIENTATION is correctly flattened. Symptom: at
  // the facezoom freeze the blade renders with its sole hanging well below
  // the visible frame / ground, so the (correctly, ball-scaled) contact
  // marker — placed close to faceAnchor's origin, which sits near the TOP of
  // the actual ~100mm-tall face casting, not its middle — reads as pinned to
  // the topline instead of the lower-middle of the face.
  //
  // Fix: after the orientation-only lie rotation, measure where the sole
  // ACTUALLY lands in world space and nudge `blade`'s position (NOT
  // `group.position` — that stays the untouched swing-physics anchor used by
  // arcPosition/clubBallContact/strikeQuality/checkAlign3d) so the sole sits
  // a FIXED distance below faceAnchor's own current world height, rather than
  // literal ground (world Z=0) — see applySoleHeightCorrection()'s doc
  // comment for why (short version: faceAnchor already carries the live
  // Fat/Thin dial, and re-anchoring to literal ground fights it). The
  // correction is converted into `blade`'s LOCAL frame (group's inverse
  // orientation) so it only ever shifts world Z — the toe-centring (FIX K.3)
  // and face-normal/toe axes are completely undisturbed.
  //
  // bladeSoleLocal is the bladeMesh bbox's min-Y corner (X/Z at the bbox's
  // own centre), in `blade`'s own (unrotated) local frame — the same point
  // diagnostics elsewhere measure via bladeMesh.geometry.boundingBox. The
  // true corner (not an idealised X=Z=0 point) is used so this matches
  // whatever point future diagnostics treat as "the sole".
  let bladeSoleLocal = null;    // THREE.Vector3, in `blade`'s local frame, pre-lie-rotation
  let bladeRestPosition = null; // blade's baked GLB translation (pivotC) — the fixed reference `blade.position` is reset to every frame before the height correction is re-added (see applySoleHeightCorrection)
  let soleTargetGap = null;     // FIXED world-vertical distance the sole must sit BELOW faceAnchor, regardless of theta/lowPoint.z — measured once (see measureBladeSoleY)
  function measureBladeSoleY() {
    if (!bladeMesh || !blade) return;
    if (!bladeMesh.geometry.boundingBox) bladeMesh.geometry.computeBoundingBox();
    // bladeMesh has identity rotation (confirmed: GLB bakes it as a pure
    // translate+uniform-scale dequant wrapper), so the local bbox corner
    // maps to `blade`-local space via a simple scale+translate — no matrix
    // multiply needed, mirroring applyFaceCentreOffset()'s approach.
    const bb = bladeMesh.geometry.boundingBox;
    const pos = bladeMesh.position, scale = bladeMesh.scale;
    bladeSoleLocal = new THREE.Vector3(
      ((bb.min.x + bb.max.x) / 2) * scale.x + pos.x,
      bb.min.y * scale.y + pos.y,
      ((bb.min.z + bb.max.z) / 2) * scale.z + pos.z
    );
    bladeRestPosition = blade.position.clone();
    // Measure the TRUE structural sole-to-faceAnchor vertical gap once, at a
    // NEUTRAL reference orientation (blade.rotation.z = 0, i.e. no lie
    // rotation applied yet — matches how pivotC/bladeSoleLocal themselves are
    // authored, in the GLB's own canonical/un-rotated frame where local Y IS
    // "straight up the shaft"). This must be a FIXED, state-independent
    // number: lowPoint.z varies live (that's the Fat/Thin dial) and the
    // sole/faceAnchor relationship must NOT chase it — only the club's
    // ORIENTATION (theta/planeAngle/swingDirection) is allowed to matter, and
    // computeLieDelta's rotation is precisely what keeps that relationship's
    // WORLD-vertical projection constant once found (see applySoleHeightCorrection).
    soleTargetGap = bladeRestPosition.y + bladeSoleLocal.y; // pivotC.y + soleLocal.y = sole's Y in `club7`-root/faceAnchor frame, pre-lie
  }
  const _soleLocal = new THREE.Vector3();
  const _soleWorld = new THREE.Vector3();
  const _correctionLocal = new THREE.Vector3();
  const _invGroupQuat = new THREE.Quaternion();
  const _faceAnchorWorld = new THREE.Vector3();
  /** Nudge `blade.position` (world-vertical only) so the sole sits the FIXED
   * structural gap (soleTargetGap, measured once at load) below faceAnchor's
   * CURRENT world height — never re-anchored to literal ground (world Z=0),
   * so Fat/Thin (state.lowPoint.z) still moves the whole assembly together
   * exactly as arcPosition/clubBallContact intend; only the STRUCTURAL drift
   * introduced by rotating the ~100mm hosel-to-sole arm through `group`'s
   * tilted orientation is cancelled. No-op until bladeSoleLocal has been
   * measured (placeholder / pre-load frames — blade node doesn't exist yet). */
  function applySoleHeightCorrection() {
    if (!blade || bladeSoleLocal == null) return;
    // Reset to the baked rest position FIRST — this function runs once per
    // update() call and must not accumulate the correction across frames.
    blade.position.copy(bladeRestPosition);
    // sole point in blade's local frame, AFTER the live lie rotation.z —
    // rotate (x, y, 0) by the applied lie delta about local Z (local Z is
    // untouched by this rotation, so it's omitted/irrelevant here).
    const d = blade.rotation.z;
    const cos = Math.cos(d), sin = Math.sin(d);
    _soleLocal.set(
      cos * bladeSoleLocal.x - sin * bladeSoleLocal.y,
      sin * bladeSoleLocal.x + cos * bladeSoleLocal.y,
      bladeSoleLocal.z
    );
    // world position of that point through blade's CURRENT matrixWorld
    // (blade.position/rotation already assigned when this runs — see update()).
    blade.updateWorldMatrix(true, false);
    _soleWorld.copy(_soleLocal).applyMatrix4(blade.matrixWorld);
    // target: sole sits soleTargetGap BELOW faceAnchor's own current world
    // height (NOT literal ground/world-Z=0 — faceAnchor already carries the
    // live lowPoint.z/Fat-Thin dial via arcPosition, and this correction must
    // ride along with that, not fight it).
    faceAnchor.updateWorldMatrix(true, false);
    _faceAnchorWorld.setFromMatrixPosition(faceAnchor.matrixWorld);
    const targetZ = _faceAnchorWorld.z + soleTargetGap;
    const deltaZ = targetZ - _soleWorld.z;
    // convert the pure-world-Z correction into group's local frame (blade's
    // position is authored in that frame) so it only ever moves world Z —
    // group's own orientation must be un-rotated first.
    _invGroupQuat.copy(group.quaternion).invert();
    _correctionLocal.set(0, 0, deltaZ).applyQuaternion(_invGroupQuat);
    blade.position.add(_correctionLocal);
  }

  function swapInModel(root) {
    modelSlot.remove(placeholder);
    modelSlot.add(root);
    loaded = true;
  }

  function assignMaterialsAndShadows(root) {
    root.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      const mat = materials[o.name] || (o.parent && materials[o.parent.name]);
      if (mat) o.material = mat;
      else if (o.name === 'bladeMesh') o.material = materials.blade;
    });
  }

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const loadPromise = new Promise((resolve) => {
    loader.load(
      GLB_URL,
      (gltf) => {
        const root = gltf.scene;
        assignMaterialsAndShadows(root);
        blade = root.getObjectByName('blade');
        bladeMesh = root.getObjectByName('bladeMesh');
        shaftGroup = root.getObjectByName('shaftGroup');
        // FIX P1 (owner decision) — the shaft/hosel junction reads wrong; the
        // blade alone is now "the club". Hide shaft+ferrule+grip but keep the
        // GLB nodes intact (easy to re-enable — just flip .visible back).
        if (shaftGroup) shaftGroup.visible = false;
        swapInModel(root);
        applyFaceCentreOffset(); // FIX K.3 — measured once, right after the real mesh lands
        measureBladeSoleY(); // sole-height fix — measured once, right after the real mesh lands
        // re-apply the last known pose/lie now that the real blade node exists
        // (placeholder has no blade node, so lie was a no-op until now).
        // MOCK (challenge 1b-i): re-apply through updateBlended with the last
        // blend so an idle (grounded-address, blend 0) pose isn't snapped to
        // the arc-riding pose by a late GLB load.
        if (lastTheta != null) updateBlended(lastTheta, state, lastBlend);
        else applyLie(lastLieDeg);
        resolve(true);
      },
      undefined,
      (err) => {
        loadFailed = true;
        console.error('club7.glb load failed — showing placeholder', err);
        resolve(false);
      }
    );
  });

  // ── dynamic lie compensation ────────────────────────────────────────────
  // Rotate `blade` about its local Z axis (the rotation axis carried by
  // basis.Z — the shaft-plane normal direction; NOT the face normal, which
  // is -basis.Z since the CHIRALITY fix, see file header) so the sole
  // (blade's local XZ plane before compensation, whose outward normal is
  // local +Y — "up the hosel") stays as close as a single-axis rotation can
  // get it to parallel with the world ground plane (z=0), for the club's
  // current world orientation [X=toe, Y=up-shaft, Z=-face-normal].
  //
  // Rotating the blade about its own local Z (== the club group's world Z)
  // sweeps the blade's Y axis through the plane
  // spanned by (X, Y):  Y'(d) = cos(d)*Y + sin(d)*cross(Z,Y) = cos(d)*Y - sin(d)*X
  // (using cross(Z,Y) = -X, since X,Y,Z is the orthonormal triple built as
  // X = normalize(Y0 x Z), Y = normalize(Z x X)).
  //
  // We choose d to maximize dot(Y'(d), worldUp) — i.e. tilt the sole normal
  // as close to vertical as this one degree of freedom allows:
  //   dot(Y'(d), up) = cos(d)*dot(Y,up) - sin(d)*dot(X,up)
  // which is maximized (a cosine of the form A cos d - B sin d, A=dot(Y,up),
  // B=dot(X,up)) at d = atan2(-B, A) = atan2(-dot(X,up), dot(Y,up)).
  //
  // This math is purely local-frame (only X, Y and world-up) — it does not
  // reference Z's world direction at all, so the CHIRALITY fix (which only
  // changed what basis.Z equals) requires NO change here; verified via
  // checkAlign3d's soleErr45/soleErr70 against the new frame.
  //
  // NOTE: when the club's face-normal itself is tilted out of horizontal
  // (nonzero attack angle / non-zero low-point-ahead offset), a single-axis
  // rotation about Z cannot drive the residual sole error to exactly zero —
  // this is the same reason a real club's dynamic lie isn't perfectly flat
  // under a descending blow. The residual grows smoothly with |theta| (the
  // arc angle from the pure low point) and vanishes at theta=0. Verified
  // globally optimal for this single DOF via brute-force scan.
  function computeLieDelta(basis) {
    const { X, Y } = basis;
    const up = { x: 0, y: 0, z: 1 };
    const A = dot(Y, up); // component of world-up along local Y (shaft-up / sole-normal)
    const B = dot(X, up); // component of world-up along local X (toe)
    // maximizes cos(d)*A - sin(d)*B  ==>  d = atan2(-B, A)  (verified against a
    // brute-force scan over d in [-180,180] deg — exact match to 0.02deg).
    return Math.atan2(-B, A);
  }

  function applyLie(deg) {
    lastLieDeg = deg;
    if (blade) blade.rotation.z = deg2rad(deg);
  }

  /**
   * Place the club at progress angle theta (pure engine math) and apply lie
   * compensation so the sole stays flush with the ground for the current
   * planeAngle/swingDirection.
   */
  function update(theta, state) {
    lastTheta = theta;
    const basis = clubBasisAt(theta, state);
    group.position.set(basis.head.x, basis.head.y, basis.head.z);
    const m = new THREE.Matrix4().makeBasis(
      new THREE.Vector3(basis.X.x, basis.X.y, basis.X.z),
      new THREE.Vector3(basis.Y.x, basis.Y.y, basis.Y.z),
      new THREE.Vector3(basis.Z.x, basis.Z.y, basis.Z.z)
    );
    group.quaternion.setFromRotationMatrix(m);

    const deltaRad = computeLieDelta(basis);
    if (blade) blade.rotation.z = deltaRad;
    lastLieDeg = deltaRad * 180 / Math.PI;
    applyDynamicFaceCentring(); // MOCK (challenge 1b-ii) — re-centre the visual face for the CURRENT lie rotation
    applySoleHeightCorrection(); // sole-height fix — orientation-only lie compensation above never moves the hosel pivot's own height; this nudges `blade`'s position (never group/faceAnchor) so the sole actually meets the ground
    return { basis, lieDeg: lastLieDeg };
  }

  // ── MOCK (challenge 1b-i, 2026-07-08) — GROUNDED COSMETIC ADDRESS POSE ────
  // Owner: "et svingplan endrer ikke lievinkelen" — at ADDRESS the club must
  // sit soled FLAT on the ground, head next to the ball, regardless of
  // plane/direction/lowpoint/ballPosition. The old address pose rode the arc
  // at addressTheta (thetaAtImpact − 5°), so the head floated above ground
  // and tilted whenever the low point moved. This pose is COSMETIC ONLY: no
  // engine/physics numbers are derived from it — the arc/impact math is
  // untouched (update() below stays the pure arc-riding placement, which is
  // exactly what checkAlign3d keeps asserting against).
  //
  // Orientation: sole (local +Y / sole normal) = world up EXACTLY (sole
  // parallel to ground, zero residual); face normal (local -Z) = the
  // HORIZONTAL projection of the impact tangent (i.e. the club path
  // direction) — face square to the delivery, honest with the physics.
  // Position: the face (group origin = sweet spot) sits ADDRESS_FACE_GAP_M
  // behind the ball's surface along that direction, and the group's height
  // is chosen so the measured sole point lands exactly on the ground (z=0),
  // using the same soleTargetGap measurement the sole-height fix already
  // takes at GLB load (fallback constant until the GLB lands).
  const ADDRESS_FACE_GAP_M = 0.015; // face-to-ball-SURFACE gap at address
  const FALLBACK_SOLE_DROP_M = 0.014; // pre-GLB placeholder: box bottom ≈ 14mm below origin
  function groundedAddressPose(state) {
    const t = tangentAt(thetaAtImpact(state), state);
    let fx = t.x, fy = t.y;
    const m = Math.hypot(fx, fy);
    if (!isFinite(m) || m < 1e-6) { fx = 1; fy = 0; } else { fx /= m; fy /= m; }
    const Z = { x: -fx, y: -fy, z: 0 };   // local +Z world dir = -face normal
    const Y = { x: 0, y: 0, z: 1 };       // sole normal straight up — sole ∥ ground
    const X = cross(Y, Z);                // toe direction (exactly horizontal)
    const behind = BALL_RADIUS_M + ADDRESS_FACE_GAP_M;
    const drop = soleTargetGap != null ? -soleTargetGap : FALLBACK_SOLE_DROP_M;
    return { pos: { x: -fx * behind, y: -fy * behind, z: drop }, X, Y, Z };
  }

  // MOCK (challenge 1b-i) — blended placement: b=0 → grounded address pose,
  // b=1 → the pure arc-riding pose (byte-identical result to update()).
  // Used by the mock timeline so playback lifts the club from the grounded
  // address into the arc early in the swing (and re-grounds on settle).
  // update() itself stays PURE arc math — checkAlign3d's contract unchanged.
  const _gPos = new THREE.Vector3();
  const _aPos = new THREE.Vector3();
  const _gQuat = new THREE.Quaternion();
  const _aQuat = new THREE.Quaternion();
  const _gMat = new THREE.Matrix4();
  const _bx = new THREE.Vector3(), _by = new THREE.Vector3(), _bz = new THREE.Vector3();
  function updateBlended(theta, state, blend) {
    const res = update(theta, state); // arc pose incl. lie + sole-height correction
    const b = blend == null ? 1 : Math.max(0, Math.min(1, blend));
    lastBlend = b;
    if (b >= 1) return res;
    _aPos.copy(group.position);
    _aQuat.copy(group.quaternion);
    const arcLie = blade ? blade.rotation.z : 0;
    const g = groundedAddressPose(state);
    _gPos.set(g.pos.x, g.pos.y, g.pos.z);
    _gMat.makeBasis(
      _bx.set(g.X.x, g.X.y, g.X.z),
      _by.set(g.Y.x, g.Y.y, g.Y.z),
      _bz.set(g.Z.x, g.Z.y, g.Z.z)
    );
    _gQuat.setFromRotationMatrix(_gMat);
    group.position.lerpVectors(_gPos, _aPos, b);
    group.quaternion.slerpQuaternions(_gQuat, _aQuat, b);
    // grounded lie is exactly 0 (sole normal already world-up), so the lie
    // angle blends linearly toward the arc pose's compensation.
    if (blade) blade.rotation.z = arcLie * b;
    group.updateWorldMatrix(true, false);
    applyDynamicFaceCentring(); // keep the visual face centred through the blend too
    // re-run the sole-height correction for the BLENDED orientation (it
    // resets blade.position to the baked rest first, so no accumulation);
    // at b=0 this lands the sole at faceAnchor.z + soleTargetGap = 0 exactly.
    applySoleHeightCorrection();
    return res;
  }

  /** Address-pose convenience — MOCK: now the GROUNDED cosmetic pose (sole
   * flat on the ground next to the ball), not the arc-riding pose. The
   * timeline blends out of this into the arc during playback. */
  function updateAddress(state) {
    return updateBlended(addressTheta(state), state, 0);
  }

  // ── MOCK — pose diagnostics for the acceptance grid (headless verify).
  // lieDeg: tilt of the blade's TOE–HEEL axis (local X) out of the ground
  //         plane — this is the owner's "lie angle" (visible in face view).
  // soleFullDeg: full sole-plane residual (sole normal vs world up) — at the
  //         impact frame this includes the REAL fore-aft attack-angle tilt of
  //         a descending strike (physics, not an error); reported for honesty.
  // soleZ: world height of the measured sole point (bladeSoleLocal).
  // faceCentreWorld: the blade mesh's visual face-centre (bbox centre) in
  //         WORLD space (incl. any stance-frame parent shift) — the point the
  //         impact-centring assert compares against the ball.
  const _pdV = new THREE.Vector3();
  function poseDebug() {
    if (!blade || !bladeMesh) return null;
    blade.updateWorldMatrix(true, false);
    const e = blade.matrixWorld.elements;
    const xl = Math.hypot(e[0], e[1], e[2]) || 1;
    const yl = Math.hypot(e[4], e[5], e[6]) || 1;
    const lieDeg = Math.asin(Math.min(1, Math.abs(e[2] / xl))) * 180 / Math.PI;
    const soleFullDeg = Math.acos(Math.min(1, Math.abs(e[6] / yl))) * 180 / Math.PI;
    let soleZ = null;
    if (bladeSoleLocal) soleZ = _pdV.copy(bladeSoleLocal).applyMatrix4(blade.matrixWorld).z;
    let faceCentreWorld = null;
    if (!bladeMesh.geometry.boundingBox) bladeMesh.geometry.computeBoundingBox();
    bladeMesh.updateWorldMatrix(true, false);
    const c = bladeMesh.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(bladeMesh.matrixWorld);
    faceCentreWorld = [c.x, c.y, c.z];
    // toe–heel axis in world (blade local +X, normalized) — the "width of the
    // face" direction the ball-centring criterion is measured along.
    const toeAxis = [e[0] / xl, e[1] / xl, e[2] / xl];
    return { lieDeg, soleFullDeg, soleZ, faceCentreWorld, toeAxis };
  }

  return {
    group, modelSlot, faceAnchor,
    get blade() { return blade; },
    get bladeMesh() { return bladeMesh; },
    get shaftGroup() { return shaftGroup; },
    get loaded() { return loaded; },
    get loadFailed() { return loadFailed; },
    // FIX K.3 — diagnostic: the constant local-X offset applied to modelSlot
    // (0 until the GLB lands and applyFaceCentreOffset() runs once).
    get bladeFaceCentreXOffset() { return -modelSlot.position.x; },
    loadPromise,
    update, updateAddress, applyLie,
    updateBlended, groundedAddressPose, poseDebug, // MOCK (challenge 1b)
    computeLieDelta, clubBasisAt,
  };
}
