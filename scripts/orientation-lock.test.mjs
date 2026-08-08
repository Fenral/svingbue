// scripts/orientation-lock.test.mjs
//
// Acceptance: the app is portrait by default; geometry is the one landscape
// screen. This is enforced at three layers, all asserted here:
//   1. Shared runtime modules resolve native plugins through Capacitor's
//      injected bridge, guarded so the web build is a no-op.
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
import {
  IOS_DEPLOYMENT_TARGET,
  patchPlist,
  patchPodfileDeploymentTarget,
  patchXcodeDeploymentTarget,
} from './ios-landscape.mjs';
import { patchManifest } from './android-landscape.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

const PORTRAIT_PAGES = ['index.html', 'impact.html', 'academy.html'];

function moduleSpecifiers(source) {
  const specifiers = [];
  for (const pattern of [
    /\b(?:import|export)\s+(?:[^'";]*?\sfrom\s*)?['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ]) {
    for (const match of source.matchAll(pattern)) specifiers.push(match[1]);
  }
  return specifiers;
}

async function importSource(relativePath, { withoutAppShell = false } = {}) {
  let source = read(relativePath);
  if (withoutAppShell) source = source.replace("import './sa-app-shell.js';", '');
  source += `\n//# sourceURL=${relativePath}?test=${Date.now()}-${Math.random()}`;
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

async function withWindow(mockWindow, run) {
  const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, 'window');
  const previousWindow = globalThis.window;
  globalThis.window = mockWindow;
  try {
    return await run();
  } finally {
    if (hadWindow) globalThis.window = previousWindow;
    else delete globalThis.window;
  }
}

// ── Layer 1: shared runtime module ────────────────────────────────────────
test('shipping native helpers contain no browser-unresolvable bare imports', () => {
  for (const file of ['sa-orientation.js', 'sa-haptics.js']) {
    const specifiers = moduleSpecifiers(read(file));
    assert.ok(
      specifiers.every(specifier => specifier.startsWith('./') || specifier.startsWith('../') || specifier.startsWith('/')),
      `${file} contains a bare browser import: ${specifiers.join(', ')}`,
    );
  }
});

test('sa-orientation.js resolves ScreenOrientation from the native-injected bridge', () => {
  const src = read('sa-orientation.js');
  assert.match(src, /registerPlugin\('ScreenOrientation'\)/, 'must target the ScreenOrientation plugin');
  assert.match(src, /isNativePlatform/, 'must guard on native so the web build is a no-op');
  assert.match(src, /export\s+(?:const|function|async function)\s+lockPortrait/, 'exports lockPortrait');
  assert.match(src, /export\s+(?:const|function|async function)\s+lockLandscape/, 'exports lockLandscape');
  assert.match(src, /plugin\.lock\(\s*\{\s*orientation/, 'calls ScreenOrientation.lock({ orientation })');
});

test('native ScreenOrientation proxy receives portrait and landscape locks', async () => {
  const registrations = [];
  const availabilityChecks = [];
  const calls = [];
  const screenOrientation = {
    async lock(options) { calls.push(options); },
  };
  const Capacitor = {
    isNativePlatform: () => true,
    isPluginAvailable(name) {
      availabilityChecks.push(name);
      return true;
    },
    registerPlugin(name) {
      registrations.push(name);
      return screenOrientation;
    },
  };

  await withWindow({ Capacitor }, async () => {
    const orientation = await importSource('sa-orientation.js', { withoutAppShell: true });
    await orientation.lockPortrait();
    await orientation.lockLandscape();
  });

  assert.deepEqual(availabilityChecks, ['ScreenOrientation']);
  assert.deepEqual(registrations, ['ScreenOrientation'], 'native proxy is registered once and cached');
  assert.deepEqual(calls, [
    { orientation: 'portrait' },
    { orientation: 'landscape' },
  ]);
});

test('native Haptics proxy receives canonical Capacitor enum strings', async () => {
  const registrations = [];
  const availabilityChecks = [];
  const calls = [];
  const hapticsPlugin = {
    async impact(options) { calls.push(['impact', options]); },
    async notification(options) { calls.push(['notification', options]); },
    async selectionStart() { calls.push(['selectionStart']); },
    async selectionChanged() { calls.push(['selectionChanged']); },
    async selectionEnd() { calls.push(['selectionEnd']); },
  };
  const Capacitor = {
    isNativePlatform: () => true,
    isPluginAvailable(name) {
      availabilityChecks.push(name);
      return true;
    },
    registerPlugin(name) {
      registrations.push(name);
      return hapticsPlugin;
    },
  };
  const localStorage = {
    getItem: () => null,
    setItem: () => {},
  };

  await withWindow({ Capacitor, localStorage }, async () => {
    const { default: haptics } = await importSource('sa-haptics.js');
    haptics.impact('light');
    haptics.impact('medium');
    haptics.impact('heavy');
    haptics.notify('success');
    haptics.notify('warning');
    haptics.notify('error');
    haptics.selectionStart();
    haptics.selectionChanged();
    haptics.selectionEnd();
    await Promise.resolve();
  });

  assert.deepEqual(availabilityChecks, ['Haptics']);
  assert.deepEqual(registrations, ['Haptics'], 'native proxy is registered once and cached');
  assert.deepEqual(calls, [
    ['impact', { style: 'LIGHT' }],
    ['impact', { style: 'MEDIUM' }],
    ['impact', { style: 'HEAVY' }],
    ['notification', { type: 'SUCCESS' }],
    ['notification', { type: 'WARNING' }],
    ['notification', { type: 'ERROR' }],
    ['selectionStart'],
    ['selectionChanged'],
    ['selectionEnd'],
  ]);
});

// ── Layer 2 + 3: per-screen wiring + web fallback ─────────────────────────
test('web helpers remain honest no-ops and never register native plugins', async () => {
  const registrations = [];
  const debugCalls = [];
  const originalDebug = console.debug;
  let haptics;
  const Capacitor = {
    isNativePlatform: () => false,
    registerPlugin(name) { registrations.push(name); },
  };
  const localStorage = {
    getItem: () => null,
    setItem: () => {},
  };

  console.debug = (...args) => debugCalls.push(args);
  try {
    await withWindow({ Capacitor, localStorage }, async () => {
      const orientation = await importSource('sa-orientation.js', { withoutAppShell: true });
      await orientation.lockPortrait();
      await orientation.lockLandscape();
      ({ default: haptics } = await importSource('sa-haptics.js'));
      await haptics._fireImpact('light');
      await haptics._fireNotify('success');
      await haptics._fireSelection('selectionChanged');
    });
  } finally {
    console.debug = originalDebug;
  }

  assert.deepEqual(registrations, []);
  assert.deepEqual(
    haptics._log.map(entry => entry.kind),
    ['impact:light', 'notify:success', 'selectionChanged'],
  );
  assert.equal(debugCalls.length, 3, 'web no-ops remain observable to the test harness');
});

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

test('v1 Guide defaults to portrait and Studio locks landscape', () => {
  const guide = read('jarvis.js');
  assert.match(guide, /sa-orientation\.js/, 'Guide imports the orientation module');
  assert.match(guide, /lockPortrait\s*\(/, 'Guide calls lockPortrait()');
  const studio = read('impact-studio.html');
  assert.match(studio, /sa-orientation\.js/, 'Studio imports the orientation module');
  assert.match(studio, /lockLandscape\s*\(/, 'Studio calls lockLandscape()');
});

test('iOS build patch enforces the WebView baseline required by shipping v1 UI', () => {
  assert.equal(IOS_DEPLOYMENT_TARGET, '16.4');
  const project = [
    'IPHONEOS_DEPLOYMENT_TARGET = 14.0;',
    'TARGETED_DEVICE_FAMILY = "1,2";',
    'IPHONEOS_DEPLOYMENT_TARGET = 15.0;',
    'TARGETED_DEVICE_FAMILY = "1,2";',
  ].join('\n');
  const patchedProject = patchXcodeDeploymentTarget(project);
  assert.doesNotMatch(patchedProject, /DEPLOYMENT_TARGET = (?:14|15)/);
  assert.equal(
    patchedProject.match(/IPHONEOS_DEPLOYMENT_TARGET = 16\.4;/g)?.length,
    2,
  );
  assert.equal(
    patchedProject.match(/TARGETED_DEVICE_FAMILY = 1;/g)?.length,
    2,
    'the v1 App Store binary is phone-only',
  );
  assert.equal(
    patchPodfileDeploymentTarget("platform :ios, '14.0'\nuse_frameworks!"),
    "platform :ios, '16.4'\nuse_frameworks!",
  );
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
