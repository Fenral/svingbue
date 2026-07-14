// EV-REG-01: pixel diff against approved baselines must stay ≤ 0.1 % per
// surface, on both engines and both motion modes. Baselines are a deliberate
// human decision: regenerate and approve them with `npm run visreg:approve`
// after an intended visual change — this suite never overwrites them.
import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import {
  BASELINE_DIR,
  CURRENT_DIR,
  DIFF_THRESHOLD_PCT,
  baselineInventory,
  captureAll,
  diffPng,
  expectedShotNames
} from './lib/flightglass-visreg.mjs';

test('approved visual baselines exist for every surface, viewport, motion and engine', () => {
  const inventory = baselineInventory();
  assert.deepEqual(
    inventory,
    expectedShotNames().sort(),
    `baseline catalog is missing or incomplete — run "npm run visreg:approve" once, `
    + 'inspect the images, then commit outputs/visreg-baselines/'
  );
});

test('current render diffs at most 0.1% against every approved baseline',
  { timeout: 900_000 }, async () => {
    const { runtimeErrors } = await captureAll(CURRENT_DIR);
    assert.deepEqual(runtimeErrors, [], 'capture walk must be error-free');

    const failures = [];
    for (const name of expectedShotNames()) {
      const result = await diffPng(join(BASELINE_DIR, name), join(CURRENT_DIR, name));
      if (!result.comparable) {
        failures.push(`${name}: size mismatch`);
      } else if (result.diffPct > DIFF_THRESHOLD_PCT) {
        failures.push(`${name}: ${result.diffPct}% differs (${result.diffPixels}px)`);
      }
    }
    assert.deepEqual(failures, [],
      `visual regression above ${DIFF_THRESHOLD_PCT}% — intended change? `
      + 'inspect outputs/flightglass-visreg/current/ and re-approve deliberately');
  });
