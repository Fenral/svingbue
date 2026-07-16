#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const read = (file) => readFileSync(join(ROOT, file), 'utf8');
const expect = (condition, message) => { if (!condition) failures.push(message); };

const visibleFiles = [
  'index.html', 'academy.html', 'appstore/index.html', 'sa-firstrun.js',
  'sa-paywall.js', 'privacy.html', 'terms.html', 'capacitor.config.ts',
  'scripts/ios-landscape.mjs', '.github/workflows/android-debug.yml',
  'codemagic.yaml', 'package.json'
];

for (const file of visibleFiles) {
  const body = read(file);
  expect(!/StrikeArc|STRIKEARC/.test(body), `${file}: visible StrikeArc name remains`);
}

const protectedChecks = [
  ['capacitor.config.ts', "appId: 'no.strikearc.app'"],
  ['sa-iap.js', "monthly: 'strikearc_pro_monthly'"],
  ['sa-iap.js', "annual: 'strikearc_pro_annual'"],
  ['sa-iap.js', "lifetime: 'strikearc_pro_lifetime'"],
  ['academy.html', "const STORE_KEY = 'strikearc.academy.v1'"],
  ['academy.html', "const NUDGE_KEY = 'strikearc.academy.nudge'"],
  ['codemagic.yaml', 'APP_STORE_APPLE_ID: 6768449250']
];
for (const [file, token] of protectedChecks) {
  expect(read(file).includes(token), `${file}: protected identifier changed: ${token}`);
}

const expectedAssets = [
  'assets/logo.svg', 'assets/flightglass-symbol-light.svg',
  'assets/flightglass-symbol-dark.svg', 'assets/flightglass-mark-micro.svg',
  'assets/flightglass-wordmark.svg', 'assets/flightglass-lockup.svg',
  'resources/icon.svg', 'resources/splash.svg'
];
for (const file of expectedAssets) {
  expect(existsSync(join(ROOT, file)), `${file}: missing`);
}

for (const file of expectedAssets.filter((file) => existsSync(join(ROOT, file)))) {
  const svg = read(file);
  expect(!/#22E3D6|#0F8F8A|#7CF5EC/i.test(svg), `${file}: legacy cyan remains`);
  expect(!/<filter|<linearGradient|<radialGradient/i.test(svg), `${file}: logo recognition depends on effects`);
}

if (existsSync(join(ROOT, 'assets/logo.svg'))) {
  const logo = read('assets/logo.svg');
  expect(logo.includes('#07060C'), 'assets/logo.svg: Ink is missing');
  expect(logo.includes('#F5F2ED'), 'assets/logo.svg: Glass is missing');
  expect(logo.includes('#FF8A4D'), 'assets/logo.svg: Trace is missing');
  expect(/aria-label="Flightglass"/.test(logo), 'assets/logo.svg: accessible label is missing');
}

const pngChecks = [
  ['resources/icon.png', 1024, 1024],
  ['resources/splash.png', 2732, 2732]
];
for (const [file, width, height] of pngChecks) {
  if (!existsSync(join(ROOT, file))) {
    failures.push(`${file}: missing`);
    continue;
  }
  const meta = await sharp(join(ROOT, file)).metadata();
  expect(meta.width === width && meta.height === height,
    `${file}: expected ${width}x${height}, got ${meta.width}x${meta.height}`);
}

expect(read('capacitor.config.ts').includes("appName: 'Flightglass'"),
  'capacitor.config.ts: appName is not Flightglass');
expect(read('scripts/ios-landscape.mjs').includes("'CFBundleDisplayName', 'Flightglass'"),
  'iOS display name is not Flightglass');

if (failures.length) {
  console.error(`Flightglass verification failed (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('Flightglass brand verification passed.');
