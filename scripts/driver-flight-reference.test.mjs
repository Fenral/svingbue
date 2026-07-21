import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// REFERENCE-ONLY coverage for driver-flight.mjs. Shipping solveFlight is gated
// separately by engine-trackman-acceptance.test.mjs.
test('orphan driver-flight reference harness retains 8/9 optimum-window rows', () => {
  const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'driver-flight-reference.mjs');
  const out = execFileSync('node', [script], { encoding: 'utf8' });
  assert.match(out, /REFERENCE ONLY/);
  const passLine = out.match(/(\d)\/9 PASS/);
  assert.ok(passLine, 'harness must report N/9 PASS');
  assert.ok(Number(passLine[1]) >= 8, `expected >=8/9, got ${passLine[1]}/9`);
  assert.match(out, /carry monotone in speed: true/);
  assert.match(out, /interior optimum \(not at grid edge\): true/);
});
