import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectOutcome } from '../impact-outcome.js';

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
