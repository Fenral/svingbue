#!/usr/bin/env node
// scripts/store-screenshots.mjs — Flightglass marketing screenshots at exact
// store pixel sizes. Run: node scripts/store-screenshots.mjs  (npm run shots)
//
// Prereq: cd tools && npm install   (playwright-core; uses installed Edge).
// Output: store-assets/<set>/<nn>-<name>.png  — ready to upload to
// App Store Connect / Google Play. No product file is touched or served
// with modifications; every state is scripted through existing dev hooks.
//
// Determinism: the browser context runs with reducedMotion:'reduce', so
// impact's fPlay() takes the synchronous renderStatic() path (full tracer,
// apex/landing markers, data panel + delta label, ghosts at resting opacity)
// and index's splash tears down in ~0.7s. localStorage is seeded via
// addInitScript so coach marks (sa_coach_impact / sa_coach_geo) never arm.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync, readFileSync } from 'node:fs';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('../tools/node_modules/playwright-core');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'store-assets');

// ── store size matrix (landscape app → landscape screenshots) ──────────────
// px = viewport(css) × deviceScaleFactor. Verify current ASC/Play specs
// before upload; these are the 2026 defaults:
//   iOS 6.9"  : 2868×1320   iOS 6.5" : 2688×1242
//   Play phone: 1920×1080 (16:9; Play rejects >2:1)   Feature graphic: 1024×500
const SETS = [
  { key: 'ios-6.9',      vp: { width: 956,  height: 440 }, dsf: 3, shots: 'all' },
  { key: 'ios-6.5',      vp: { width: 896,  height: 414 }, dsf: 3, shots: 'all' },
  { key: 'play-phone',   vp: { width: 960,  height: 540 }, dsf: 2, shots: 'all' },
  { key: 'play-feature', vp: { width: 1024, height: 500 }, dsf: 1, shots: ['home'] },
];

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.glb': 'model/gltf-binary', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml',
};

function startServer() {
  return new Promise((ok) => {
    const srv = createServer(async (req, res) => {
      try {
        const url = new URL(req.url, 'http://x');
        let p = normalize(join(ROOT, decodeURIComponent(url.pathname)));
        if (!p.startsWith(ROOT)) { res.writeHead(403).end(); return; }
        if (url.pathname === '/') p = join(ROOT, 'index.html');
        if (url.pathname === '/favicon.ico') { res.writeHead(204).end(); return; }
        const body = await readFile(p);
        res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
        res.end(body);
      } catch { res.writeHead(404).end('not found'); }
    });
    srv.listen(0, '127.0.0.1', () => ok(srv));
  });
}

// PNG width/height from IHDR — asserts exact store pixels with no deps.
function pngSize(path) {
  const b = readFileSync(path);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

const consoleErrors = [];
function watch(page, label) {
  page.on('pageerror', (e) => consoleErrors.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`[${label}] console.error: ${m.text()}`); });
}

// ── shot state builders ─────────────────────────────────────────────────────
async function gotoHome(page, base) {
  await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
  // splash removes itself from the DOM (~0.7s under reduced motion)
  await page.waitForSelector('#saSplash', { state: 'detached', timeout: 10000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}

async function gotoImpact(page, base) {
  await page.goto(`${base}/impact.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__coachDebug && window.__coachDebug.sceneReady());
  // coach marks must never appear (localStorage seeded, but assert anyway)
  await page.waitForFunction(() => !document.querySelector('.sa-coach'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
}

// Flight overlay mid-comparison: 2 grey ghosts (fade R / draw L) + long live
// draw in cyan + "what changed" delta label. All synchronous under reduce.
async function buildGhostScene(page) {
  await page.evaluate(() => {
    const set = (id, v) => { const el = document.getElementById(id); el.value = String(v); el.dispatchEvent(new Event('input')); };
    set('s_face', 4); set('s_path', -2); set('s_attack', -3); set('s_loft', 30); set('s_speed', 92);
    document.getElementById('playFlight').click();     // run 1 — becomes oldest ghost
    set('s_face', -4.5); set('s_path', 3);
    document.getElementById('flightReplay').click();   // run 2 — becomes newest ghost
    set('s_face', -1); set('s_path', 1.5); set('s_speed', 108);
    document.getElementById('flightReplay').click();   // run 3 — the live cyan shot
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); // no focus ring in the shot
  });
  await page.waitForFunction(() =>
    window.__impact && window.__impact.ghosts.length === 2 &&
    document.querySelectorAll('#fScene .ghostShot').length === 2 &&
    document.getElementById('flightScrim').classList.contains('open') &&
    !document.getElementById('fDelta').hidden &&
    !document.getElementById('fDelta').classList.contains('is-hidden') &&
    !document.querySelector('.sa-coach'));  // no coach bubble may cover the hero shot
  await page.waitForTimeout(250);
}

async function gotoGeometry(page, base) {
  await page.goto(`${base}/geometry.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__sa3d && window.__sa3d.renderCount > 0);
  // wait for the real club GLB (placeholder blade otherwise); loadFailed is a valid terminal state
  await page.waitForFunction(() => {
    const c = window.__sa && window.__sa.three && window.__sa.three.club();
    return !!(c && (c.loaded || c.loadFailed));
  }, null, { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
}

async function toDTL(page) {
  await page.evaluate(() => { document.getElementById('viewBtn').click(); });
  await page.waitForFunction(() => document.getElementById('viewBtn').getAttribute('aria-pressed') === 'true');
  await page.waitForTimeout(600); // pose settle (snap under reduced motion; margin for render-on-demand)
}

// ── main ────────────────────────────────────────────────────────────────────
const srv = await startServer();
const base = `http://127.0.0.1:${srv.address().port}`;
console.log(`[shots] serving ${ROOT} at ${base}`);

let browser;
try { browser = await chromium.launch({ channel: 'msedge', headless: true }); }
catch { browser = await chromium.launch({ channel: 'chrome', headless: true }); }

const results = [];
for (const set of SETS) {
  const dir = join(OUT, set.key);
  mkdirSync(dir, { recursive: true });
  const context = await browser.newContext({
    viewport: set.vp,
    deviceScaleFactor: set.dsf,
    reducedMotion: 'reduce',
    colorScheme: 'dark',
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem('sa_coach_impact', '1');
      localStorage.setItem('sa_coach_geo', '1');
      // ghost-lab (P2) added a one-time coach mark the first time a ghost
      // appears — seed it too, or it fires during buildGhostScene and dims
      // the hero shot.
      localStorage.setItem('sa_coach_flight_ghost', '1');
      localStorage.setItem('sa_onboarded', '1');
      localStorage.removeItem('sa_shots_v1');
    } catch (e) {}
  });
  const page = await context.newPage();
  watch(page, set.key);

  const snap = async (name) => {
    const path = join(dir, name);
    await page.screenshot({ path });
    const { w, h } = pngSize(path);
    const exp = { w: set.vp.width * set.dsf, h: set.vp.height * set.dsf };
    if (w !== exp.w || h !== exp.h) throw new Error(`${path}: got ${w}x${h}, expected ${exp.w}x${exp.h}`);
    results.push(`${set.key}/${name}  ${w}x${h}`);
  };

  if (set.shots === 'all') {
    await gotoImpact(page, base);
    await snap('02-impact-instrument.png');
    await buildGhostScene(page);
    await snap('01-impact-flight-ghosts.png');
    await gotoGeometry(page, base);
    await snap('03-geometry-front.png');
    await toDTL(page);
    await snap('04-geometry-dtl.png');
    await gotoHome(page, base);
    await snap('05-home.png');
  } else {
    await gotoHome(page, base);
    await snap('feature-graphic.png');
  }
  await context.close();
}

await browser.close();
srv.close();

console.log('\n[shots] captured:');
for (const r of results) console.log('  ' + r);
if (consoleErrors.length) {
  console.error('\n[shots] CONSOLE ERRORS (must be 0):');
  for (const e of consoleErrors) console.error('  ' + e);
  process.exitCode = 1;
} else {
  console.log('\n[shots] 0 console errors. Done.');
}
