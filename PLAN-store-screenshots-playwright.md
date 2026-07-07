# PLAN: Store screenshot pipeline — Playwright captures at exact ASC/Play pixel sizes
One command (`npm run shots`) renders index/geometry/impact — including the flight overlay with 2 ghosts — headless at exact store resolutions and writes a ready-to-upload PNG set to `store-assets/`.

## Goal
A reusable, deterministic capture script (`scripts/store-screenshots.mjs`) that produces marketing screenshots for App Store Connect (iPhone 6.9" 2868x1320, 6.5" 2688x1242, landscape) and Google Play (phone 1920x1080 + feature graphic 1024x500). The hero shot shows the Play-flight overlay mid-comparison with 2 visibly distinct grey ghosts + the cyan live shot + the "what changed" delta label. Zero product-code changes; after any future UI change the whole set refreshes with one command.

## Why now (leverage)
- Zero marketing screenshots exist anywhere: `resources/` holds only icon/splash (verified: icon.png, icon.svg, splash.png, splash.svg), `assets/` is in-app art only. Screenshots are a hard store-submission blocker.
- The app is static HTML at fixed landscape viewports; every state needed is scriptable through existing dev hooks: `window.__impact` (impact.html:4252), `window.__coachDebug` (impact.html:4242), `window.__sa.three` / `window.__sa3d` (geometry.html:1147-1300). No product edits required.
- HARD ORDERING: run the final capture only AFTER the rank-1 (density diet) and rank-2 (ghost comparison lab) work is merged, so shots show the post-diet UI. Building the script now is safe — it drives the live DOM; its `waitForFunction` guards fail loudly if rank-2 renamed an id (re-verify anchors `#playFlight`, `#flightReplay`, `#s_face`, `#s_path`, `#s_speed`, `.ghostShot`, `#fDelta` before the final run).

## Exact files to touch
- `C:/Users/SkotvoldSivertSende/OneDrive - IdrettsKontor/Skrivebord/Apper/svingbue/scripts/store-screenshots.mjs` — NEW. The complete capture script (full source in Implementation order, step 3).
- `C:/Users/SkotvoldSivertSende/OneDrive - IdrettsKontor/Skrivebord/Apper/svingbue/tools/package.json` — add devDependency `"playwright-core": "^1.49.0"` (tools/ is NOT installed by CI; root IS — see Edge cases).
- `C:/Users/SkotvoldSivertSende/OneDrive - IdrettsKontor/Skrivebord/Apper/svingbue/scripts/copy-web.mjs` — add `'store-assets'` to `DENYLIST_DIRS` (line 38-41), defense in depth.
- `C:/Users/SkotvoldSivertSende/OneDrive - IdrettsKontor/Skrivebord/Apper/svingbue/package.json` — add script `"shots": "node scripts/store-screenshots.mjs"`.
- `C:/Users/SkotvoldSivertSende/OneDrive - IdrettsKontor/Skrivebord/Apper/svingbue/store-assets/` — NEW output folder (PNGs, committed; never pushed alone).

Files that must NOT change: `index.html`, `geometry.html`, `impact.html`, `sa-firstrun.js`, `sa-shots.js`, `sa-iap.js`, `sa-paywall.js/.css`, `sa.css`, `impact-flight.js`, `swing-parameters-and-impact.js` (byte-identical), `geo3d/`, `vendor/`, `assets/`, `resources/`, `www/` (never hand-edit), `codemagic.yaml`, `capacitor.config.ts`.

## Pre-flight
1. Read `scripts/copy-web.mjs:38-41` (`DENYLIST_DIRS`) and `tools/package.json` (currently only @gltf-transform deps — no playwright yet, confirmed).
2. Verify CI installs ROOT only: `codemagic.yaml` line ~59 runs `npm ci` at repo root. This is why playwright goes in `tools/package.json`, and why it must be `playwright-core` (no browser postinstall), launched via installed Edge (`channel:'msedge'`).
3. Verify Edge exists: PowerShell `(Get-Command msedge -ErrorAction SilentlyContinue)` or check `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`. Fallback channel is `'chrome'`.
4. Manual probing (optional): `python -m http.server 8099` from the repo root, browse `http://localhost:8099/impact.html`. In any headless probe seed `localStorage.sa_coach_impact = '1'` (plus `sa_coach_geo`, `sa_onboarded`) BEFORE page scripts run, or the coach walkthrough auto-arms (impact.html:4214, geometry.html:1439). The capture script does this itself via `context.addInitScript`.
5. Key runtime facts (all verified in source):
   - `const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches` is read ONCE at load — impact.html:1285, geometry.html:839. Reduced motion must be a CONTEXT option, set before navigation.
   - With reduce=true, `fPlay()` short-circuits to `renderStatic()` (impact.html:3564 → 3496): full tracer, apex + landing markers, data panel and delta label revealed immediately and synchronously. This is the deterministic capture path.
   - Ghost capture: `noteFlight()` (impact.html:3159) promotes the PREVIOUS shot to `ghosts[0]` only when params changed; dedupes vs `ghosts[0]` (impact.html:3166). Max 3, in-memory only.
   - Ghost visibility under reduce: `buildGhostLayer()` sets each group's `opacity` attribute directly to `GHOST_OPS[i]` (impact.html:3258) — ghosts ARE visible in the static render without the fade-in tween.
   - `openFlight()` (impact.html:3865) sets `.topstrip` and `#stage` `inert` — subsequent slider changes MUST be programmatic (`el.value = …; el.dispatchEvent(new Event('input'))`, wiring at impact.html:2758), never Playwright pointer clicks.
   - `#flightReplay` click → `fPlay()` (impact.html:3998).
   - Web build is ungated: `sa-shots.js isWeb()` short-circuits `shouldGate()`/`shouldNudge()` — no paywall, no nudge pill in any capture (sa-shots.js:32-34, 61-75). `#saNudge` ships `hidden` (impact.html:1113).
   - index.html splash REMOVES itself from the DOM after ~0.7s under reduced motion (index.html:210-220, 259) — wait for `#saSplash` detached.
   - Readiness hooks: `window.__coachDebug.sceneReady()` (impact.html:4242-4248), `window.__sa3d.renderCount` (geometry), `window.__sa.three.club().loaded` (geometry.html:1170-1185).

## Implementation order

### Step 1 — tools/package.json: add playwright-core
Anchor: `"devDependencies": {` in `tools/package.json`. Add as first entry:
```json
    "playwright-core": "^1.49.0",
```
Then run: `cd tools && npm install` (Bash: `cd "C:/Users/SkotvoldSivertSende/OneDrive - IdrettsKontor/Skrivebord/Apper/svingbue/tools" && npm install`). `tools/node_modules` is already gitignored (root `.gitignore` has `node_modules/`, which matches at any depth). Verify: `node -e "console.log(require('C:/Users/SkotvoldSivertSende/OneDrive - IdrettsKontor/Skrivebord/Apper/svingbue/tools/node_modules/playwright-core/package.json').version)"` prints a 1.x version.

### Step 2 — copy-web.mjs: denylist store-assets
Anchor (scripts/copy-web.mjs:38-41):
```js
const DENYLIST_DIRS = new Set([
  'node_modules', 'ios', 'android', 'www', 'tools', 'docs', 'scripts',
  '.git', '.sa-backups', '.vercel', 'resources',
]);
```
Change the second line to:
```js
  'node_modules', 'ios', 'android', 'www', 'tools', 'docs', 'scripts',
  '.git', '.sa-backups', '.vercel', 'resources', 'store-assets',
]);
```
Verify: `node scripts/copy-web.mjs` still completes with `done. www/ is ready` and no `www/store-assets` exists.

### Step 3 — create scripts/store-screenshots.mjs (complete file, paste verbatim)
```js
#!/usr/bin/env node
// scripts/store-screenshots.mjs — StrikeArc marketing screenshots at exact
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
    !document.getElementById('fDelta').classList.contains('is-hidden'));
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
```

### Step 4 — root package.json: add npm script
Anchor: `"copy-web": "node scripts/copy-web.mjs",` in `package.json`. Add below it:
```json
    "shots": "node scripts/store-screenshots.mjs",
```
(Root package.json is CI-read for version only; an extra script line is inert.)

### Step 5 — run and inspect
`cd "C:/Users/SkotvoldSivertSende/OneDrive - IdrettsKontor/Skrivebord/Apper/svingbue" && npm run shots`
Expect 16 PNGs (5 per iOS set + 5 Play phone + 1 feature graphic), exact sizes printed, exit 0. Open `store-assets/ios-6.9/01-impact-flight-ghosts.png` and confirm: two grey ghost arcs with landing dots + "NNN m" plates (one curving right, one curving left), cyan live tracer with apex/carry plates, delta label upper area, Ghosts pill top-right, no coach bubble, no focus ring, no nudge pill.

### Step 6 — commit (do NOT push alone)
Commit `scripts/store-screenshots.mjs`, `scripts/copy-web.mjs`, both package.json/lock changes, and `store-assets/` locally. Every push to main triggers a full Codemagic iOS build — batch this with the next functional push, and per standing rule STOP and ask before any `git push`.

## Edge cases a weaker model would miss
- CI trap: `codemagic.yaml` runs `npm ci` at the REPO ROOT. Adding `playwright` (not `-core`) to root package.json makes every iOS build download browsers (real minutes/money). That is why the dep is `playwright-core` (no browser postinstall) inside `tools/package.json` (never installed by CI), loaded via `createRequire` from `scripts/`, and driven through installed Edge (`channel:'msedge'`).
- `reduce` is sampled ONCE at parse time (impact.html:1285, geometry.html:839). Emulating reduced motion AFTER navigation does nothing — it must be `newContext({ reducedMotion:'reduce' })`.
- Without reduced motion, `fPlay()` runs a ~6s GSAP timeline (AIR=4.03s + ROLL=1.82s, impact.html:3522-3523) with the data panel hidden until landing (`hideData()`, impact.html:3577) — screenshots become timing-dependent and flaky. `renderStatic()` (impact.html:3496) is the only deterministic path and it reveals everything including the delta label (`showDeltaLabel` applies immediately when `reduce`, impact.html:3242).
- `openFlight()` inerts `.topstrip` + `#stage` specifically (impact.html:3881-3884) — `#flightScrim` is a CHILD of `.app`, so never "fix" this to inert `.app`. Consequence for this script: Playwright pointer clicks on base sliders time out while the overlay is open; all param changes go through `el.value` + `dispatchEvent(new Event('input'))` (state wiring at impact.html:2758), which inert does not block.
- Ghost dedupe: `noteFlight()` only promotes the previous shot when params differ from both `lastFlown` and `ghosts[0]` (impact.html:3159-3168). The three runs MUST each change at least one slider or you end with <2 ghosts and the waitForFunction times out.
- Ghosts under reduced motion look "skipped" in fPlay (the fade-in tween is bypassed) but are still visible: `buildGhostLayer()` writes `opacity=GHOST_OPS[i]` directly on each group (impact.html:3258). Do not add tween-completion waits.
- Coach marks: impact auto-arms unless `SA.seen('sa_coach_impact')` with a 600ms settle timer (impact.html:4123, 4214); geometry uses `sa_coach_geo` (geometry.html:1439). Seeding must happen via `addInitScript` (before page scripts), not `page.evaluate` after load. Keys are `'1'` strings (sa-firstrun.js:35-36).
- index.html splash: `teardown()` REMOVES `#saSplash` from the DOM (index.html:210-211); under reduced motion via a 700ms timeout (index.html:259). Wait for `state:'detached'` — waiting for a class or visibility hangs or races.
- Portrait trap: `@media (orientation:portrait) .rotate{display:flex}` (impact.html:766) — every capture viewport must have width > height. The 1024x500 feature graphic is landscape, fine.
- Play rejects screenshots with aspect ratio >2:1 for store placement; the app's native 844x390 (2.16:1) is NOT a valid Play size — that is why play-phone captures at 960x540 css (16:9 → 1920x1080).
- Screenshot pixel math: PNG size = viewport × deviceScaleFactor only when dsf is set on the context; the script asserts IHDR dimensions so a silent Playwright default (dsf 1) can't slip through.
- `openFlight()` focuses `#flightClose` programmatically (impact.html:3887) — a `:focus-visible` ring can appear in headless (no preceding pointer event). The evaluate block ends with `document.activeElement.blur()`.
- Geometry readiness is three-stage: `renderCount > 0` (first paint), club GLB async load (`__sa.three.club().loaded`, geometry.html:1170-1185; `loadFailed` is a valid terminal state — don't hang on it), fonts. Render-on-demand means no continuous rAF will "eventually" fix a too-early shot.
- The repo is under OneDrive with node_modules — never recursive shell find/grep (use ripgrep tools); mkdir/overwrite of PNGs is fine, but if `EPERM` appears on overwrite it's OneDrive sync lock — retry once.
- `store-assets/` outputs must NOT go in `resources/` (Capacitor icon/splash input for `@capacitor/assets`) and must never reach `www/` (step 2 denylist + directories are already skipped by copy-web's root sweep at scripts/copy-web.mjs:108).
- Web build shows no paywall/nudge by design (`isWeb()` short-circuit, sa-shots.js:32-34) — do NOT try to "hide" monetization chrome by editing product files; there is nothing to hide on localhost.
- CRLF warnings from git on Windows are benign.

## Accessibility requirements
This item ships a build tool + images, no product UI — the repo's a11y gate applies as follows:
- Zero product-DOM changes: the script must not persist any state change beyond localStorage in a throwaway browser context. `swing-parameters-and-impact.js` stays byte-identical; no geometry/impact invariant can regress because their files are untouched.
- The capture exercises the real `prefers-reduced-motion` product path (renderStatic parity) — if a capture looks broken under reduce, that is a genuine a11y bug to report, not to patch in the script.
- Screenshots must contain no focus rings (blur after scripted clicks), no coach-mark dialogs, no half-torn-down splash — these would misrepresent the product.
- Legibility in the shots comes from product patterns already in place: ghost/apex/carry labels sit on `rgba(8,16,20,.72..78)` plates (impact.html:3275, 1208, 1217) over the dusk photo; cyan #22E3D6 stays reserved for the live ball + its data, ghosts stay `#9FB2C8`. Contrast is measurable, not eyeballed: sample label text color vs its plate color in the captured PNG and compute contrast ratio — must be >=4.5:1. Also review `01-impact-flight-ghosts.png` at ~50% zoom to approximate how store-listing thumbnails actually render.
- When uploading, write store-listing alt/caption text (ASC "promotional text"/Play listing) describing each screenshot — not part of this repo, but note it in the run summary.
- Touch-target/contrast/live-region rules are unaffected (no UI edits). If a future rank-1/2 change lands, re-run the capture rather than editing outputs.

## Acceptance criteria
1. `cd tools && npm install` succeeds; `tools/node_modules/playwright-core` exists; root `package-lock.json` unchanged except (none — root deps untouched).
2. `node scripts/copy-web.mjs` passes its own sanity guards and `www/store-assets` does not exist.
3. `npm run shots` exits 0 and prints `0 console errors`. (This asserts 0 console errors on index, impact incl. overlay, and geometry incl. DTL, at all four viewport sets.)
4. Exactly these files exist with exact IHDR pixel sizes (script self-asserts; verifier can re-check any one, e.g. PowerShell: `$b=[IO.File]::ReadAllBytes('store-assets/ios-6.9/01-impact-flight-ghosts.png'); [BitConverter]::ToString($b[16..23])` → `00-00-0B-34-00-00-05-28` = 2868x1320):
   - `store-assets/ios-6.9/01..05-*.png` at 2868x1320
   - `store-assets/ios-6.5/01..05-*.png` at 2688x1242
   - `store-assets/play-phone/01..05-*.png` at 1920x1080
   - `store-assets/play-feature/feature-graphic.png` at 1024x500
5. Headless probe on the ghost scene (run against `http://127.0.0.1:<port>/impact.html?` with the same init-script seeding, after executing the `buildGhostScene` evaluate block):
   - `window.__impact.ghosts.length` → `2`
   - `document.querySelectorAll('#fScene .ghostShot').length` → `2`
   - `document.getElementById('flightScrim').classList.contains('open')` → `true`
   - `document.getElementById('fDelta').hidden === false && !document.getElementById('fDelta').classList.contains('is-hidden')` → `true`
   - `window.__coachDebug.active` → `false`
   - `document.getElementById('saNudge').hidden` → `true`
6. Visual check at 844x390 AND 740x416 (browser resize on `http://localhost:8099/impact.html`): the product pages themselves render exactly as before — this plan changed no product file (`git diff --stat` shows only scripts/store-screenshots.mjs, scripts/copy-web.mjs, package.json, tools/package.json+lock, store-assets/).
7. Geometry untouched-invariant spot-check (cheap assurance, files not modified): on `geometry.html` at 900x470, `window.__sa.checkAlign3d(5).pass === true` and `window.__sa3d.renderCount` static over 1.5s idle.
8. Visual review of `ios-6.9/01-impact-flight-ghosts.png`: 2 distinct grey ghost arcs (one bending right, one bending left) each with a landing dot + metre plate, cyan live tracer visibly longer/distinct, delta label populated ("Face"/"Path"/"Speed" cause + total/curve effect), Ghosts pill reads pressed, no coach bubble/focus ring/nudge.
9. Before actual store upload (separate session): re-verify current ASC/Play required sizes; if ASC has moved past 2868x1320, change only the `SETS` matrix and re-run.
10. Run summary (or a `docs/` note) contains a one-line descriptive caption/alt text per captured shot — 01-05 for each of ios-6.9/ios-6.5/play-phone, plus play-feature/feature-graphic — ready to paste into ASC promotional text / Play listing.
11. Contrast spot-check: sampled label text vs its `rgba(8,16,20,.72-.78)` plate in `01-impact-flight-ghosts.png` computes >=4.5:1 contrast; same image additionally reviewed at ~50% zoom to approximate store-listing thumbnail rendering.

## Out of scope
- Any edit to index.html / geometry.html / impact.html / sa-*.js / engine files (P1 density diet and P2 ghost lab are ranks 1-2, not this item).
- ASC/Play upload automation (fastlane deliver, screenshots API), App Store metadata/copy, device-bezel framing, caption/marketing art overlays, localized screenshot sets.
- iPad / Android tablet / Chromebook screenshot sets (app is iPhone-landscape; iPad is a separate planned project).
- Video previews / App Previews.
- CI wiring of the shots script (local-only tool by design; keeps Codemagic minutes untouched).
- Regenerating `resources/` icon/splash or touching the Capacitor asset pipeline.
