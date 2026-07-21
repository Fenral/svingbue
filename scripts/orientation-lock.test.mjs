// scripts/orientation-lock.test.mjs
//
// Acceptance: the app is portrait by default; geometry is the one landscape
// screen. This is enforced at three layers, all asserted here:
//   1. A shared runtime module (sa-orientation.js) wraps
//      @capacitor/screen-orientation, guarded so the web build is a no-op.
//   2. Each shipping page locks its own orientation on load
//      (index/impact/academy → portrait, geometry → landscape).
//   3. Portrait pages carry a web fallback rotate-hint (browsers cannot be
//      force-rotated outside fullscreen/PWA); geometry keeps its landscape hint.
//   4. The native patch scripts permit portrait (default) + landscape, instead
//      of the previous landscape-only lock.
//
// Layers 1–3 are static source assertions; layer 4 exercises the scripts'
// pure transforms against fixtures.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { patchPlist } from './ios-landscape.mjs';
import { patchManifest } from './android-landscape.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

const PORTRAIT_PAGES = ['index.html', 'impact.html', 'academy.html'];

// ── Layer 1: shared runtime module ────────────────────────────────────────
test('sa-orientation.js wraps @capacitor/screen-orientation and is web-safe', () => {
  const src = read('sa-orientation.js');
  assert.match(src, /@capacitor\/screen-orientation/, 'must target the screen-orientation plugin');
  assert.match(src, /isNativePlatform/, 'must guard on native so the web build is a no-op');
  assert.match(src, /export\s+(?:const|function|async function)\s+lockPortrait/, 'exports lockPortrait');
  assert.match(src, /export\s+(?:const|function|async function)\s+lockLandscape/, 'exports lockLandscape');
  assert.match(src, /\.lock\(\s*\{\s*orientation/, 'calls ScreenOrientation.lock({ orientation })');
});

// ── Layer 2 + 3: per-screen wiring + web fallback ─────────────────────────
for (const page of PORTRAIT_PAGES) {
  test(`${page} locks portrait on load`, () => {
    const src = read(page);
    assert.match(src, /sa-orientation\.js/, `${page} imports the orientation module`);
    assert.match(src, /lockPortrait\s*\(/, `${page} calls lockPortrait()`);
  });
  test(`${page} has a web fallback rotate-to-portrait hint for landscape phones`, () => {
    const src = read(page);
    assert.match(src, /@media[^{]*orientation:\s*landscape/, `${page} needs a landscape-orientation media query`);
    assert.match(src, /rotate your phone to portrait/i, `${page} needs the rotate-to-portrait copy`);
  });
}

test('geometry.html locks landscape on load', () => {
  const src = read('geometry.html');
  assert.match(src, /sa-orientation\.js/, 'geometry imports the orientation module');
  assert.match(src, /lockLandscape\s*\(/, 'geometry calls lockLandscape()');
});

test('geometry.html keeps its rotate-to-landscape hint', () => {
  const src = read('geometry.html');
  assert.match(src, /@media\s*\(orientation:\s*portrait\)/, 'geometry keeps the portrait→landscape hint');
});

// ── Layer 4: native baseline permits portrait (not landscape-only) ────────
const FIXTURE_PLIST = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
  '<plist version="1.0">',
  '<dict>',
  '\t<key>CFBundleName</key>',
  '\t<string>App</string>',
  '</dict>',
  '</plist>',
  ''
].join('\n');

test('iOS patch permits portrait (default) + landscape, not landscape-only', () => {
  const out = patchPlist(FIXTURE_PLIST);
  const iphone = out.match(/<key>UISupportedInterfaceOrientations<\/key>\s*<array>([\s\S]*?)<\/array>/);
  assert.ok(iphone, 'UISupportedInterfaceOrientations present');
  assert.match(iphone[1], /UIInterfaceOrientationPortrait/, 'portrait is permitted');
  assert.match(iphone[1], /UIInterfaceOrientationLandscapeLeft/, 'landscape stays permitted for geometry');
  assert.ok(
    iphone[1].indexOf('Portrait') < iphone[1].indexOf('LandscapeLeft'),
    'portrait is listed first (the app default)'
  );
  // iPad mirrors the iPhone policy.
  assert.match(out, /UISupportedInterfaceOrientations~ipad<\/key>\s*<array>[\s\S]*?UIInterfaceOrientationPortrait/);
  // Brand + full-screen invariants preserved.
  assert.match(out, /CFBundleDisplayName<\/key>\s*<string>Flightglass<\/string>/, 'display name preserved');
  assert.match(out, /UIRequiresFullScreen<\/key>\s*<true\/>/, 'full-screen preserved');
});

test('Android patch defaults MainActivity to portrait, not sensorLandscape', () => {
  const fixture =
    '<manifest><application>' +
    '<activity android:name=".MainActivity" android:screenOrientation="sensorLandscape" android:exported="true">' +
    '</activity></application></manifest>';
  const out = patchManifest(fixture);
  assert.match(out, /android:screenOrientation="portrait"/, 'MainActivity defaults to portrait');
  assert.doesNotMatch(out, /sensorLandscape/, 'the landscape lock is gone');
  assert.match(out, /android:name="\.MainActivity"/, 'MainActivity element preserved');
});

// ── Surface manifest: the shipping impact surface is measured in portrait ──
test('range (impact) surface is portrait with selectors that exist in impact.html', () => {
  const manifest = JSON.parse(read('config/flightglass-surfaces.json'));
  const range = manifest.surfaces.find((s) => s.id === 'range');
  assert.ok(range, 'range surface present');
  assert.equal(range.route, 'impact.html', 'range is the shipping impact screen');
  assert.ok(
    range.viewportIds.length > 0 && range.viewportIds.every((v) => v.startsWith('portrait')),
    'range is audited in portrait viewports only'
  );
  const impact = read('impact.html');
  for (const sel of range.requiredSelectors) {
    assert.match(sel, /^#[\w-]+$/, `${sel} is an id selector`);
    assert.match(impact, new RegExp(`id="${sel.slice(1)}"`), `impact.html must contain ${sel}`);
  }
});
