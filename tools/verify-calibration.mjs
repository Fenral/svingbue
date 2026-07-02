/**
 * Headless verification of club-calibration.html + assets/club7.glb.
 * Uses the globally installed playwright (chromium). Assumes serve.mjs is
 * running on the port given as argv[2] (default 8077).
 *
 * Checks:
 *  - page renders, model loads, 0 console errors
 *  - club length along Y reads ~0.95 m against the scene
 *  - blade node slider tilts the blade relative to the shaft (world-space
 *    toe position moves while the shaft group stays put)
 * Saves screenshots (iso / face / back / lie-tilted) next to this script.
 */
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire('C:/Users/SkotvoldSivertSende/AppData/Roaming/npm/node_modules/');
const { chromium } = require('playwright');

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.argv[2] || 8077;
const URL = `http://localhost:${PORT}/club-calibration.html`;
const SHOT_DIR = resolve(__dirname, 'calibration-shots');

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push(String(e)));

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__calib && window.__calib.measure, null, { timeout: 30000 });
await page.waitForTimeout(600); // a couple of rendered frames

const m0 = await page.evaluate(() => window.__calib.measure());
check('club length (Y, grip end -> lowest point) ~0.95 m',
  Math.abs(m0.lengthY - 0.953) < 0.05, `${m0.lengthY.toFixed(4)} m`);
check('grip end near +Y 0.9 m', m0.gripEndY > 0.85 && m0.gripEndY < 1.0, `${m0.gripEndY.toFixed(4)} m`);
check('blade bbox centered near origin',
  Math.max(...m0.bladeBox.min.map(Math.abs), ...m0.bladeBox.max.map(Math.abs)) < 0.12,
  `min [${m0.bladeBox.min.map((v) => v.toFixed(3))}] max [${m0.bladeBox.max.map((v) => v.toFixed(3))}]`);
check('blade node pivot at hosel (above origin, heel side -X)',
  m0.bladeNodePos[1] > 0.02 && m0.bladeNodePos[1] < 0.12 && m0.bladeNodePos[0] < 0,
  `[${m0.bladeNodePos.map((v) => v.toFixed(3))}]`);

/* screenshots */
await page.screenshot({ path: `${SHOT_DIR}/01-iso.png` });
await page.click('button[data-view="face"]');
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOT_DIR}/02-face.png` });
await page.click('button[data-view="back"]');
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOT_DIR}/03-back.png` });

/* lie slider test: world position of the blade toe must move, shaft must not */
const lieTest = await page.evaluate(() => {
  const { state, THREE, setLie, measure } = window.__calib;
  const toeWorld = () => {
    state.blade.updateWorldMatrix(true, true);
    // toe = +X extreme of blade bbox in world space
    const b = new THREE.Box3().setFromObject(state.blade);
    return [b.max.x, b.min.y, (b.min.z + b.max.z) / 2];
  };
  const shaftTop = () => {
    const b = new THREE.Box3().setFromObject(state.shaftGroup);
    return [b.max.x, b.max.y, b.max.z];
  };
  setLie(0);
  const toe0 = toeWorld(), shaft0 = shaftTop();
  setLie(10);
  const toe10 = toeWorld(), shaft10 = shaftTop();
  const d = Math.hypot(...toe10.map((v, i) => v - toe0[i]));
  const dShaft = Math.hypot(...shaft10.map((v, i) => v - shaft0[i]));
  return { toeMoved: d, shaftMoved: dShaft, rotZdeg: measure().bladeRotZdeg };
});
check('lie slider rotates blade node (+10°)', Math.abs(lieTest.rotZdeg - 10) < 0.1, `rot ${lieTest.rotZdeg.toFixed(2)}°`);
check('blade toe moves under lie rotation', lieTest.toeMoved > 0.005, `${(lieTest.toeMoved * 1000).toFixed(1)} mm`);
check('shaft group does NOT move', lieTest.shaftMoved < 1e-6, `${(lieTest.shaftMoved * 1000).toFixed(4)} mm`);

await page.evaluate(() => window.__calib.setLie(10));
await page.click('button[data-view="face"]');
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOT_DIR}/04-face-lie+10.png` });
await page.evaluate(() => window.__calib.setLie(-10));
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOT_DIR}/05-face-lie-10.png` });
await page.evaluate(() => window.__calib.setLie(0));

const pageErrors = await page.evaluate(() => window.__calib.errors);
check('0 console errors', consoleErrors.length === 0 && pageErrors.length === 0,
  JSON.stringify([...consoleErrors, ...pageErrors]));

await browser.close();
console.log(results.every((r) => r.ok) ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
process.exitCode = results.every((r) => r.ok) ? 0 : 1;
