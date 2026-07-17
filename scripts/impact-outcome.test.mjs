import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectOutcome } from '../impact-outcome.js';
import { solveFlight, trajectorySamples } from '../impact-flight.js';

const YD2M = 0.9144;
const DEFAULTS = { face: 2.0, path: 0.0, attack: 3.0, dynLoft: 24, speed: 130 };

test('Outcome-formen er frosset (§3.3): raw/m/deg/misc/path/physical', () => {
  const o = selectOutcome(DEFAULTS);
  for (const k of ['raw', 'm', 'deg', 'misc', 'path', 'physical']) assert.ok(k in o, `mangler ${k}`);
  for (const k of ['carry', 'total', 'apex', 'curve', 'side']) assert.equal(typeof o.m[k], 'number');
  for (const k of ['launchDir', 'spinAxis', 'launchAng', 'spinLoft', 'landAng']) assert.equal(typeof o.deg[k], 'number');
  for (const k of ['backspin', 'ballSpeed', 'smash']) assert.equal(typeof o.misc[k], 'number');
  assert.ok(Object.isFrozen(o) && Object.isFrozen(o.m) && Object.isFrozen(o.path));
});

test('memoisert på de fem parametrene; station påvirker aldri (§3.4)', () => {
  const a = selectOutcome({ ...DEFAULTS, station: 0 });
  const b = selectOutcome({ ...DEFAULTS, station: 1.7 });
  assert.equal(a, b, 'samme parametre må gi samme (memoiserte) Outcome uansett station');
  assert.notEqual(a, selectOutcome({ ...DEFAULTS, face: 3.0 }));
});

test('path er verdensmeter, Z-up: starter i origo, ender ved carry på bakken', () => {
  const o = selectOutcome(DEFAULTS);
  const first = o.path[0], last = o.path[o.path.length - 1];
  assert.equal(first.x, 0); assert.equal(first.z, 0);
  assert.ok(Math.abs(last.x - o.m.carry) < 1e-9, 'siste punkt ligger ved x = carry');
  assert.ok(Math.abs(last.z) < 1e-9, 'siste punkt ligger på bakken');
  assert.ok(Math.abs(last.y - o.m.side) < 1.5, 'lateral ende ≈ side');
});

test('physical (§4): inDomain = spinLoft > 0, ellers reason "spin-loft"', () => {
  assert.equal(selectOutcome(DEFAULTS).physical.inDomain, true);
  const bad = selectOutcome({ ...DEFAULTS, dynLoft: 0, attack: 15 });
  assert.equal(bad.physical.inDomain, false);
  assert.equal(bad.physical.reason, 'spin-loft');
});

// ── Økt E · motorbinding: selectOutcome er en ren adapter over solveFlight ──

test('E · raw er solveFlight uendret (yards/mph), mapping face→faceAngle / path→clubPath (§2.2)', () => {
  const out = selectOutcome(DEFAULTS);
  const eng = solveFlight({
    clubPath: DEFAULTS.path, faceAngle: DEFAULTS.face, attackAngle: DEFAULTS.attack,
    dynamicLoft: DEFAULTS.dynLoft, clubSpeed: DEFAULTS.speed,
  });
  for (const k of ['startDirection', 'spinAxis', 'curve', 'offline', 'launchAngle',
    'spinLoft', 'backspin', 'landingAngle', 'smash', 'ballSpeed', 'carry', 'total']) {
    assert.equal(out.raw[k], eng[k], `raw.${k} avviker fra motoren`);
  }
  // input ekkoes uklemt gjennom selectoren (§4: input klemmes aldri)
  assert.equal(out.raw.faceAngle, DEFAULTS.face);
  assert.equal(out.raw.clubPath, DEFAULTS.path);
});

test('E · yards→meter skjer én gang og konsistent: m.* = raw.* · 0.9144 (§1.5/A7)', () => {
  const out = selectOutcome(DEFAULTS);
  assert.equal(out.m.carry, out.raw.carry * YD2M);
  assert.equal(out.m.total, out.raw.total * YD2M);
  assert.equal(out.m.apex, out.raw.apex * YD2M);
  assert.equal(out.m.curve, out.raw.curve * YD2M);
  assert.equal(out.m.side, out.raw.offline * YD2M);
});

test('E · deg/misc er 1:1-speil av motorfeltene (§2.3)', () => {
  const out = selectOutcome(DEFAULTS);
  assert.equal(out.deg.launchDir, out.raw.startDirection);
  assert.equal(out.deg.spinAxis, out.raw.spinAxis);
  assert.equal(out.deg.launchAng, out.raw.launchAngle);
  assert.equal(out.deg.spinLoft, out.raw.spinLoft);
  assert.equal(out.deg.landAng, out.raw.landingAngle);
  assert.equal(out.misc.backspin, out.raw.backspin);
  assert.equal(out.misc.ballSpeed, out.raw.ballSpeed);
  assert.equal(out.misc.smash, out.raw.smash);
});

test('E · path er motorens trajectorySamples skalert per §2.4: topp = apex_m, ende = (carry_m, side_m, 0)', () => {
  const out = selectOutcome(DEFAULTS);
  assert.equal(out.path.length, trajectorySamples(out.raw).length, 'samme sampletall som motoren');
  const last = out.path[out.path.length - 1];
  assert.ok(Math.abs(last.y - out.m.side) < 1e-9, 'y(1) = side (offline) i meter, eksakt');
  // motorens apexAt=0.52 ligger mellom to samples (n=48) → sampletoppen er
  // ≤ apex, men aldri mer enn ~0.2 % under (h(0.5)=0.9985 på parabelen)
  const apexZ = Math.max(...out.path.map(p => p.z));
  assert.ok(apexZ <= out.m.apex + 1e-9, 'sampletoppen kan aldri overstige apex');
  assert.ok(apexZ > out.m.apex * 0.995, 'sampletoppen skal ligge inntil apex i meter');
});

test('E · predikatet er IKKE utvidet (§4/A8): grense spinLoft=0 er utenfor, flopp 65° er innenfor', () => {
  const edge = selectOutcome({ face: 0, path: 0, attack: 10, dynLoft: 10, speed: 130 });
  assert.equal(edge.raw.spinLoft, 0);
  assert.equal(edge.physical.inDomain, false, 'spinLoft = 0 er utenfor (strengt > 0)');
  const flop = selectOutcome({ face: 0, path: 0, attack: -15, dynLoft: 50, speed: 130 });
  assert.equal(flop.raw.spinLoft, 65);
  assert.equal(flop.physical.inDomain, true, 'fysisk mulig flopp er unøyaktig, ikke usann (§4)');
});
