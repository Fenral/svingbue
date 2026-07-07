#!/usr/bin/env node
// scripts/android-landscape.mjs
//
// Patches android/app/src/main/AndroidManifest.xml AFTER `npx cap add android`
// has generated the Android project (in CI — the android/ folder is never
// committed; see .gitignore). Mirrors scripts/ios-landscape.mjs.
//
// What it does:
//   Sets android:screenOrientation="sensorLandscape" on the .MainActivity
//   <activity> element — both landscape rotations allowed, portrait never,
//   regardless of the device's rotation-lock setting. This is the Android
//   equivalent of the iOS UISupportedInterfaceOrientations landscape-only
//   patch.
//
// Idempotent: re-running when the attribute is already correct produces no
// diff and does not rewrite the file. If the attribute exists with a
// different value, it is replaced. Does NOT assume attribute order or the
// exact android:configChanges list Capacitor generates.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MANIFEST_PATH = join(ROOT, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

function log(msg) {
  console.log(`[android-landscape] ${msg}`);
}

if (!existsSync(MANIFEST_PATH)) {
  console.error(
    `[android-landscape] ERROR: ${MANIFEST_PATH} does not exist.\n` +
    `This script must run AFTER "npx cap add android" has generated the\n` +
    `Android project (CI step in .github/workflows/android-debug.yml).`
  );
  process.exit(1);
}

let xml = readFileSync(MANIFEST_PATH, 'utf8');
const original = xml;

// Find every <activity ...> opening tag, pick the one for .MainActivity.
// Attributes may span multiple lines; never assume order.
const activityTagRe = /<activity\b[\s\S]*?>/g;
const tags = xml.match(activityTagRe) || [];
const mainTag = tags.find((t) => t.includes('android:name=".MainActivity"'));

if (!mainTag) {
  console.error('[android-landscape] ERROR: no <activity> with android:name=".MainActivity" found in AndroidManifest.xml.');
  process.exit(1);
}

const ORIENTATION = 'sensorLandscape';
let newTag;
if (/android:screenOrientation="[^"]*"/.test(mainTag)) {
  newTag = mainTag.replace(
    /android:screenOrientation="[^"]*"/,
    `android:screenOrientation="${ORIENTATION}"`
  );
} else {
  newTag = mainTag.replace(
    /^<activity\b/,
    `<activity\n            android:screenOrientation="${ORIENTATION}"`
  );
}

xml = xml.replace(mainTag, newTag);
log(`set .MainActivity android:screenOrientation -> ${ORIENTATION}`);

if (xml === original) {
  log('no changes needed (already patched) — manifest untouched on disk.');
} else {
  writeFileSync(MANIFEST_PATH, xml, 'utf8');
  log(`wrote ${MANIFEST_PATH}`);
}

log('done.');
