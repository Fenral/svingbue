#!/usr/bin/env node
// Deliberate manual action (`npm run visreg:approve`): captures the current
// render of every surface/viewport/motion/engine combination straight into
// the git-tracked baseline catalog. Inspect the images before committing.
import { BASELINE_DIR, captureAll, expectedShotNames } from './lib/flightglass-visreg.mjs';

console.log('[visreg] capturing new approved baselines — this is a deliberate action.');
const { runtimeErrors } = await captureAll(BASELINE_DIR);
if (runtimeErrors.length > 0) {
  console.error('[visreg] runtime errors during capture — baselines NOT trustworthy:');
  for (const error of runtimeErrors) console.error(`  ! ${error}`);
  process.exit(1);
}
console.log(`[visreg] approved ${expectedShotNames().length} baselines in ${BASELINE_DIR}`);
console.log('[visreg] inspect the images, then commit outputs/visreg-baselines/.');
