// EV-REG-01: pixel diff against approved baselines must stay ≤ 0.1 % per
// surface, on both engines and both motion modes. Baselines are a deliberate
// human decision: regenerate and approve them with `npm run visreg:approve`
// after an intended visual change — this suite never overwrites them.
import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import {
  BASELINE_DIR,
  CURRENT_DIR,
  DIFF_THRESHOLD_PCT,
  baselineInventory,
  captureAll,
  diffPng,
  expectedShotNames
} from './lib/flightglass-visreg.mjs';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

test('pixel diff rejects an alpha-only image change', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'flightglass-visreg-alpha-'));
  const opaque = join(directory, 'opaque.png');
  const transparent = join(directory, 'transparent.png');
  try {
    await sharp(Buffer.from([12, 18, 24, 255]), {
      raw: { width:1, height:1, channels:4 }
    }).png().toFile(opaque);
    await sharp(Buffer.from([12, 18, 24, 0]), {
      raw: { width:1, height:1, channels:4 }
    }).png().toFile(transparent);

    const result = await diffPng(opaque, transparent);
    assert.equal(result.diffPixels, 1);
    assert.equal(result.diffPct, 100);
  } finally {
    rmSync(directory, { recursive:true, force:true });
  }
});

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
