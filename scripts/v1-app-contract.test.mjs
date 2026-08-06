import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
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
  'sa-v1-context.js',
  'sa-range-context.js',
  'sa-orientation.js',
  'impact-camera.js',
  'impact-framing.js',
  'impact-outcome.js',
  'impact-annotate.js',
  'impact-flight.js',
  'swing-parameters-and-impact.js',
  'sa-haptics.js',
  'assets/flightglass-mark-micro.svg',
  'assets/flightglass-lockup.svg',
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

test('native HTML allowlist contains only v1 routes and legal pages', () => {
  const source = readFileSync(join(SCRIPT_DIR, 'copy-web.mjs'), 'utf8');
  const allowlistBlock = source.match(/const ALLOWED_HTML_FILES = \[([\s\S]*?)\];/);

  assert.ok(allowlistBlock, 'copy-web HTML allowlist could not be read');
  const entries = [...allowlistBlock[1].matchAll(/'([^']+\.html)'/g)]
    .map((match) => match[1])
    .sort();

  assert.deepEqual(entries, NATIVE_HTML);
});

test('Home exposes the first-shot loop and sends guided help to v1 routes', () => {
  const home = readFileSync(join(ROOT, 'index.html'), 'utf8');

  assert.match(home, /class="home-help sa-focus" href="\.\/jarvis\.html"/);
  assert.match(home, /id="startFirstShot"[^>]+>Run your first shot</);
  assert.match(home, /id="tryExperiment"[^>]+href="\.\/impact\.html\?guided=experiment"/);
  assert.match(home, /class="home-jarvis-link sa-focus" href="\.\/jarvis\.html"/);
  assert.doesNotMatch(home, /href="\.\/(?:geometry|academy|impact-outcome[^"?]*)\.html/);
  assert.doesNotMatch(home, /place--v1-hidden/);
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
});
