import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPT_DIR, '..');
const WWW = join(ROOT, 'www');

const V1_ROUTES = [
  'index.html',
  'impact.html',
  'impact-studio.html',
  'jarvis.html',
];

const NATIVE_HTML = [
  ...V1_ROUTES,
  'privacy.html',
  'terms.html',
].sort();

const REQUIRED_LOCAL_DEPENDENCIES = [
  'sa-p3.css',
  'sa.css',
  'sa-app-shell.css',
  'sa-app-shell.js',
  'sa-home.css',
  'sa-home.js',
  'sa-opening.js',
  'sa-access.js',
  'sa-analytics.js',
  'sa-shots.js',
  'sa-iap.js',
  'sa-iap-config.js',
  'sa-paywall.js',
  'sa-paywall.css',
  'sa-v1-context.js',
  'sa-range-context.js',
  'sa-orientation.js',
  'impact-camera.js',
  'impact-framing.js',
  'impact-outcome.js',
  'impact-annotate.js',
  'impact-flight.js',
  'flightglass-3d-spin-model.js',
  'swing-parameters-and-impact.js',
  'sa-haptics.js',
  'jarvis.css',
  'jarvis.js',
  'guide-engine.js',
  'guide-knowledge.js',
  'vendor/revenuecat/purchases.esm.js',
  'vendor/fonts/IBMPlexMono-Medium.woff2',
  'vendor/fonts/IBMPlexMono-Regular.woff2',
  'vendor/fonts/IBMPlexMono-SemiBold.woff2',
  'vendor/fonts/Inter-Bold.woff2',
  'vendor/fonts/Inter-Medium.woff2',
  'vendor/fonts/Inter-Regular.woff2',
  'vendor/fonts/Inter-SemiBold.woff2',
  'vendor/fonts/SpaceGrotesk-Bold.woff2',
  'vendor/fonts/SpaceGrotesk-Medium.woff2',
  'vendor/fonts/SpaceGrotesk-SemiBold.woff2',
  'assets/flightglass-mark-micro.svg',
  'assets/flightglass-lockup.svg',
  'assets/onboarding/outcome.webp',
  'assets/onboarding/studio.webp',
  'assets/onboarding/guide.webp',
  'assets/range-night-3d-33.png',
  'assets/impact-studio/turf.png',
  'assets/impact-studio/sky-face.png',
  'assets/impact-studio/bg-dtl.png',
  'assets/impact-studio/ball.png',
  'assets/impact-studio/glint.png',
  'assets/impact-studio/tee.png',
  'assets/impact-studio/iron-head.png',
  'assets/impact-studio/driver-head.png',
];

function assertByteIdentical(relativePath) {
  const sourcePath = join(ROOT, relativePath);
  const nativePath = join(WWW, relativePath);

  assert.ok(existsSync(sourcePath), `root source is missing: ${relativePath}`);
  assert.ok(existsSync(nativePath), `native copy is missing: ${relativePath}`);
  assert.deepEqual(
    readFileSync(nativePath),
    readFileSync(sourcePath),
    `native copy differs from root: ${relativePath}`,
  );
}

function treeSize(directory) {
  let total = 0;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    total += entry.isDirectory() ? treeSize(path) : statSync(path).size;
  }
  return total;
}

function filesBelow(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  });
}

function moduleSpecifiers(source) {
  const specifiers = new Set();
  for (const pattern of [
    /(?:import|export)\s+(?:[^'";]*?\sfrom\s*)?['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ]) {
    for (const match of source.matchAll(pattern)) specifiers.add(match[1]);
  }
  return [...specifiers];
}

function isBareModuleSpecifier(specifier) {
  return !specifier.startsWith('.')
    && !specifier.startsWith('/')
    && !/^[a-z][a-z\d+.-]*:/i.test(specifier);
}

function assertNativeModuleClosure() {
  const wwwRoot = resolve(WWW);
  for (const importer of filesBelow(WWW).filter(path => path.endsWith('.js'))) {
    const source = readFileSync(importer, 'utf8');
    const specifiers = moduleSpecifiers(source);
    for (const specifier of specifiers.filter(isBareModuleSpecifier)) {
      assert.fail(
        `${relative(wwwRoot, importer)} has a browser-unresolvable bare import: ${specifier}`,
      );
    }
    for (const specifier of specifiers.filter(value => value.startsWith('.'))) {
      const requested = resolve(dirname(importer), specifier.split(/[?#]/, 1)[0]);
      assert.ok(
        requested === wwwRoot || requested.startsWith(`${wwwRoot}\\`) || requested.startsWith(`${wwwRoot}/`),
        `${relative(wwwRoot, importer)} imports outside the native bundle: ${specifier}`,
      );
      const candidates = extname(requested)
        ? [requested]
        : [requested, `${requested}.js`, join(requested, 'index.js')];
      assert.ok(
        candidates.some(candidate => existsSync(candidate)),
        `${relative(wwwRoot, importer)} has a missing native import: ${specifier}`,
      );
    }
  }
}

test('native HTML allowlist contains only v1 routes and legal pages', () => {
  const source = readFileSync(join(SCRIPT_DIR, 'copy-web.mjs'), 'utf8');
  const allowlistBlock = source.match(/const ALLOWED_HTML_FILES = \[([\s\S]*?)\];/);

  assert.ok(allowlistBlock, 'copy-web HTML allowlist could not be read');
  const entries = [...allowlistBlock[1].matchAll(/'([^']+\.html)'/g)]
    .map((match) => match[1])
    .sort();

  assert.deepEqual(entries, NATIVE_HTML);
});

test('Home exposes the learning tour and sends every next action to v1 routes', () => {
  const home = readFileSync(join(ROOT, 'index.html'), 'utf8');

  assert.match(home, /class="home-help sa-focus" href="\.\/jarvis\.html"/);
  assert.match(home, /id="startFirstShot"[^>]+>See how Flightglass works</);
  assert.match(home, /id="tryExperiment"[^>]+href="\.\/impact\.html\?guided=experiment"/);
  assert.match(home, /class="home-jarvis-link sa-focus" href="\.\/jarvis\.html"/);
  assert.doesNotMatch(home, /href="\.\/(?:geometry|academy|impact-outcome[^"?]*)\.html/);
  assert.doesNotMatch(home, /place--v1-hidden/);
  assert.match(home, /id="restoreHomePurchases"[^>]*>Restore purchases</);
  assert.match(home, /href="\.\/terms\.html">Terms of Use</);
  assert.match(home, /href="\.\/privacy\.html">Privacy Policy</);
});

test('shipping value surfaces load the canonical Pro purchase UI', () => {
  for (const file of ['impact.html', 'impact-studio.html', 'jarvis.html']) {
    const source = readFileSync(join(ROOT, file), 'utf8');
    assert.match(source, /<link rel="stylesheet" href="\.\/sa-paywall\.css"/,
      `${file} must style the shared paywall`);
  }
});

test('copy-web produces a byte-identical v1 native payload', () => {
  const result = spawnSync(process.execPath, [join(SCRIPT_DIR, 'copy-web.mjs')], {
    cwd: ROOT,
    encoding: 'utf8',
  });

  assert.equal(
    result.status,
    0,
    `copy-web failed:\n${result.stdout}\n${result.stderr}`,
  );

  const nativeHtml = readdirSync(WWW)
    .filter((name) => name.endsWith('.html'))
    .sort();
  assert.deepEqual(nativeHtml, NATIVE_HTML);

  for (const relativePath of [...V1_ROUTES, ...REQUIRED_LOCAL_DEPENDENCIES]) {
    assertByteIdentical(relativePath);
  }
  assertNativeModuleClosure();

  const bundleBytes = treeSize(WWW);
  assert.ok(
    bundleBytes <= 12 * 1024 * 1024,
    `native v1 payload is ${(bundleBytes / 1024 / 1024).toFixed(2)} MiB; budget is 12 MiB`,
  );
  for (const forbidden of [
    'geo3d',
    'assets/audio',
    'assets/palette-previews',
    'vendor/three',
  ]) {
    assert.equal(existsSync(join(WWW, forbidden)), false, `${forbidden} must not ship in v1`);
  }
});
