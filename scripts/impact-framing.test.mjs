import test from 'node:test';
import assert from 'node:assert/strict';
import { fitZoom, gridStops, lateralStops, dollyRig } from '../impact-framing.js';
import { rigAt, buildBasis, project } from '../impact-camera.js';
import { solveFlight } from '../impact-flight.js';

const YD2M = 0.9144;

test('fitZoom is 1 at the reference distance and never grows with the shot', () => {
  assert.equal(fitZoom(112), 1);
  const seq = [40, 80, 112, 160, 220, 300].map(d => fitZoom(d));
  for (let i = 1; i < seq.length; i++) {
    assert.ok(seq[i] <= seq[i - 1], `zoom must not grow: ${seq[i - 1]} -> ${seq[i]}`);
  }
});

test('fitZoom clamps both ends and survives degenerate input', () => {
  assert.equal(fitZoom(1e9), 0.40);
  assert.equal(fitZoom(0), 1.35, 'zero-length shot clamps to max, never divides by zero');
  assert.equal(fitZoom(NaN), 1.35);
  assert.equal(fitZoom(-50), 1.35);
});

/* Regresjonsvakt for den faktiske bug-en: den gamle klampen (min 0.62) ble satt
   da motoren toppet rundt 207 m carry. Etter rekalibreringen når slag 386 m og
   242 m offline, og da MÅ zoomen kunne gå under 0.62 — ellers renner banen ut
   av lerretet, som den gjorde i TestFlight-bygget. */
test('the zoom range actually covers the current engine envelope', () => {
  // Verste rammebehov målt over hele slider-domenet: halv-carry 193, apex 68,
  // offline 242 (+8 m luft) => 250 m fra det skudd-sentrerte blikkpunktet.
  const worstHalfExtent = 250;
  const k = fitZoom(worstHalfExtent);
  assert.ok(k > 0.40, `worst-case shot must not sit on the clamp (k=${k})`);
  assert.ok(112 / worstHalfExtent >= 0.40,
    'the required zoom must be inside the clamp, not truncated by it');
});

/* Hybrid-innramming (eierens valg): en fast "hjemme"-ramme for hele det normale
   slag-spennet, fit-to-shot zoomer KUN ut for ekstremene. Låst her som
   fitZoom(max(maxDist, HOME)) — måten frameForShot i impact.html bruker den på. */
test('home-clamped zoom holds one stable frame across the bag, only extremes zoom out', () => {
  const HOME = 150;
  const z = md => fitZoom(Math.max(md, HOME));
  // kile (~62), jern (~92) og en realistisk driver (~140) ligger alle under HOME,
  // så de deler NØYAKTIG samme målestokk — ingen skifter når du drar i sliderne.
  assert.equal(z(62), z(140), 'wedge and driver share the home frame');
  assert.equal(z(92), z(140), 'iron and driver share the home frame');
  assert.equal(z(150), z(62), 'the whole normal range is one flat zoom');
  // bare ekte ekstremer (maxDist > HOME) zoomer lenger ut.
  assert.ok(z(250) < z(140), 'a 358 m / 242 m offline extreme zooms out');
  assert.ok(z(250) > 0.40, 'and still clears the min clamp');
});

test('gridStops grows in whole steps and always leaves a scale', () => {
  assert.deepEqual(gridStops(180), [50, 100, 150, 200]);
  assert.deepEqual(gridStops(281), [50, 100, 150, 200, 250, 300]);
  assert.deepEqual(gridStops(386), [50, 100, 150, 200, 250, 300, 350, 400]);
  assert.deepEqual(gridStops(0), [50, 100], 'never fewer than two lines');
  assert.deepEqual(gridStops(200), [50, 100, 150, 200], 'exact multiple does not overshoot');
});

test('lateralStops mirrors outward and never returns the target line itself', () => {
  assert.deepEqual(lateralStops(30), [-50, 50]);
  assert.deepEqual(lateralStops(93), [-100, -50, 50, 100]);
  assert.deepEqual(lateralStops(242), [-250, -200, -150, -100, -50, 50, 100, 150, 200, 250]);
  assert.deepEqual(lateralStops(0), [-50, 50], 'a straight shot still keeps a width reference');
  assert.ok(!lateralStops(120).includes(0));
  assert.deepEqual(lateralStops(-93), lateralStops(93), 'sign of the miss is irrelevant');
});

test('dollyRig moves only the camera, along its own view axis, leaving fov alone', () => {
  const rig = { pos: { x: 0, y: 0, z: 10 }, look: { x: 0, y: 0, z: 0 }, fov: 1, orthoK: 0 };
  const out = dollyRig(rig, 0.5);
  assert.equal(out.pos.z, 20, 'k=0.5 doubles the distance');
  assert.equal(out.fov, rig.fov, 'fov is never touched — that was the fisheye path');
  assert.deepEqual(out.look, rig.look, 'the look target stays put');
  assert.equal(rig.pos.z, 10, 'input rig is not mutated');
  assert.equal(dollyRig(rig, 2).pos.z, 5, 'k>1 pulls in');
  assert.equal(dollyRig(rig, 1).pos.z, 10, 'k=1 is identity');
});

/* A2, den beskyttede invarianten: ved orthoK=1 deler `project` på refDist.
   Dolly ENDRER refDist — og det er greit, fordi invarianten er strukturell
   (zDiv = zCam + (refDist − zCam)·orthoK er refDist for enhver refDist).
   Denne testen beviser at TOP fortsatt er eksakt ortografisk etter dolly. */
test('dollying keeps TOP exactly orthographic (A2 holds for any refDist)', () => {
  const rig = rigAt(2); // TOP, orthoK = 1
  assert.equal(rig.orthoK, 1);
  const vb = { w: 390, h: 844 };
  for (const k of [1, 0.62, 0.40]) {
    const basis = buildBasis(dollyRig(rig, k), vb);
    // To punkter i ulik dybde men samme lateral offset må projisere til SAMME
    // skjerm-x under ekte ortografi — ingen perspektivkonvergens.
    const near = project({ x: 40, y: 30, z: 0 }, basis);
    const far = project({ x: 300, y: 30, z: 0 }, basis);
    assert.ok(near && far, 'both points project');
    assert.ok(Math.abs(near.x - far.x) < 1e-9,
      `orthographic at k=${k}: depth must not change lateral position (${near.x} vs ${far.x})`);
  }
});

test('zoom scales the ortho image by exactly k', () => {
  const vb = { w: 390, h: 844 };
  const rig = rigAt(2);
  const b1 = buildBasis(dollyRig(rig, 1), vb), b2 = buildBasis(dollyRig(rig, 0.5), vb);
  const spanA = Math.abs(project({ x: 0, y: 100, z: 0 }, b1).x - project({ x: 0, y: 0, z: 0 }, b1).x);
  const spanB = Math.abs(project({ x: 0, y: 100, z: 0 }, b2).x - project({ x: 0, y: 0, z: 0 }, b2).x);
  assert.ok(Math.abs(spanB / spanA - 0.5) < 1e-9,
    `halving k must halve the on-screen span (got ${spanB / spanA})`);
});

/* Ende-til-ende mot den EKTE motoren: skuddet fra skjermbildene som rant ut av
   lerretet (281 m carry, 93 m offline) må nå ligge innenfor rammen. */
test('the TestFlight shot that overflowed now fits the frame', () => {
  const f = solveFlight({ clubSpeed: 130, dynamicLoft: 24, attackAngle: 3, faceAngle: 2.2, clubPath: -12.4, club: '7iron' });
  const carry = f.carry * YD2M;
  const side = Math.abs(f.offline) * YD2M;
  assert.ok(carry > 250, `precondition: this is a long shot (${carry.toFixed(0)} m)`);

  const maxDist = Math.max(carry / 2, f.apex * YD2M, side + 8);
  const k = fitZoom(maxDist);
  assert.ok(k > 0.40, 'not pinned to the clamp');

  // Rutenettet må rekke forbi nedslaget, og breddeguidene forbi utfallet.
  const stops = gridStops(carry);
  assert.ok(stops[stops.length - 1] >= carry, `grid must reach the landing (${stops.at(-1)} >= ${carry.toFixed(0)})`);
  const lat = lateralStops(side);
  assert.ok(Math.max(...lat) >= side, `width guides must reach the miss (${Math.max(...lat)} >= ${side.toFixed(0)})`);
});
