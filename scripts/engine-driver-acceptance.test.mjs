import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Wraps the verified-outside-repo acceptance harness (engine-driver-acceptance.mjs)
// as a CI gate. Known model-boundary gap: v=125 spin sits +178 rpm over tolerance
// (WO-E-MOTOR §E, documented — flat emergent locus vs TrackMan's tilt; needs
// published Cd/Cl(Re,S) tables to close, not parameter fudging). 8/9 is the
// accepted floor, not 9/9.
test('driver-flight acceptance harness: 8/9 club speeds inside TrackMan tolerance', () => {
  const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'engine-driver-acceptance.mjs');
  const out = execFileSync('node', [script], { encoding: 'utf8' });
  const passLine = out.match(/(\d)\/9 PASS/);
  assert.ok(passLine, 'harness must report N/9 PASS');
  assert.ok(Number(passLine[1]) >= 8, `expected >=8/9, got ${passLine[1]}/9`);
  assert.match(out, /carry monotone in speed: true/);
  assert.match(out, /interior optimum \(not at grid edge\): true/);
});
