#!/usr/bin/env node
// Assemble the smallest self-contained shipping payload for Flightglass v1.
// The repository root also hosts prototypes and v2 Academy source, so every
// shipping file is explicitly allowlisted. Never publish the repository root.

import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPT_DIR, '..');
const WWW = join(ROOT, 'www');

// Only these app surfaces are reachable in the native v1 bundle. Legal pages
// remain local so the purchase sheet never depends on network availability.
const ALLOWED_HTML_FILES = [
  'index.html',
  'impact.html',
  'impact-studio.html',
  'jarvis.html',
  'support.html',
  'terms.html',
  'privacy.html',
];

const ALLOWED_TOP_LEVEL_FILES = [
  'guide-engine.js',
  'guide-knowledge.js',
  'flightglass-3d-spin-model.js',
  'impact-annotate.js',
  'impact-camera.js',
  'impact-flight.js',
  'impact-framing.js',
  'impact-outcome.js',
  'jarvis.css',
  'jarvis.js',
  'sa-access.js',
  'sa-analytics.js',
  'sa-app-shell.css',
  'sa-app-shell.js',
  'sa-view-transition-guard.js',
  'sa-haptics.js',
  'sa-home.css',
  'sa-home.js',
  'sa-iap-config.js',
  'sa-iap.js',
  'sa-opening.js',
  'sa-orientation.js',
  'sa-p3.css',
  'sa-paywall.css',
  'sa-paywall.js',
  'sa-range-context.js',
  'sa-shots.js',
  'sa-v1-context.js',
  'sa.css',
  'swing-parameters-and-impact.js',
];

const ALLOWED_ASSET_FILES = [
  'assets/flightglass-lockup.svg',
  'assets/flightglass-mark-micro.svg',
  'assets/onboarding/guide.webp',
  'assets/onboarding/outcome.webp',
  'assets/onboarding/studio.webp',
  'assets/range-night-3d-33.png',
  'assets/impact-studio/ball.png',
  'assets/impact-studio/bg-dtl.png',
  'assets/impact-studio/driver-head.png',
  'assets/impact-studio/glint.png',
  'assets/impact-studio/iron-head.png',
  'assets/impact-studio/sky-face.png',
  'assets/impact-studio/tee.png',
  'assets/impact-studio/turf.png',
];

const ALLOWED_VENDOR_FILES = [
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
  'vendor/revenuecat/purchases.esm.js',
];

function log(message) {
  console.log(`[copy-web] ${message}`);
}

function copyRequired(relativePath) {
  const source = join(ROOT, relativePath);
  const target = join(WWW, relativePath);
  if (!existsSync(source)) throw new Error(`[copy-web] required file missing: ${relativePath}`);
  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target);
}

if (existsSync(WWW)) {
  rmSync(WWW, { recursive: true, force: true });
  log('removed existing www/');
}
mkdirSync(WWW, { recursive: true });

const groups = [
  ['HTML', ALLOWED_HTML_FILES],
  ['app source', ALLOWED_TOP_LEVEL_FILES],
  ['assets', ALLOWED_ASSET_FILES],
  ['vendor dependencies', ALLOWED_VENDOR_FILES],
];
for (const [label, files] of groups) {
  for (const file of files) copyRequired(file);
  log(`copied ${files.length} allowlisted ${label} file(s)`);
}

for (const forbidden of [
  'academy.html',
  'geometry.html',
  'geo3d',
  'node_modules',
  'scripts',
  'tools',
  'assets/audio',
  'assets/palette-previews',
  'vendor/three',
]) {
  if (existsSync(join(WWW, forbidden))) {
    throw new Error(`[copy-web] sanity check failed: www/${forbidden} must not ship.`);
  }
}

log('done. www/ is ready for `npx cap sync ios`.');
