#!/usr/bin/env node
// scripts/android-landscape.mjs
//
// Patches android/app/src/main/AndroidManifest.xml AFTER `npx cap add android`
// has generated the Android project (in CI — the android/ folder is never
// committed; see .gitignore). Mirrors scripts/ios-landscape.mjs.
//
// Orientation model (see sa-orientation.js): the app is PORTRAIT by default;
// geometry is the one landscape screen, flipped at runtime by the
// @capacitor/screen-orientation plugin (which calls setRequestedOrientation and
// overrides the manifest default per screen). So the manifest only needs to set
// the LAUNCH default to portrait; the plugin handles the geometry flip.
// (Historically this locked android:screenOrientation="sensorLandscape"; the
// filename is kept for CI continuity.)
//
// What it does:
//   Sets android:screenOrientation="portrait" on the .MainActivity <activity>
//   element — the app launches portrait; the runtime plugin rotates geometry
//   to landscape and back.
//
// Idempotent: re-running when the attribute is already correct produces no
// diff and does not rewrite the file. If the attribute exists with a
// different value, it is replaced. Does NOT assume attribute order or the
// exact android:configChanges list Capacitor generates.
//
// The pure transform is exported as `patchManifest(xml)` for unit tests; the
// file-touching CLI runs only when this module is the entry point.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MANIFEST_PATH = join(ROOT, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

const ORIENTATION = 'portrait';

function log(msg) {
  console.log(`[android-landscape] ${msg}`);
}

/**
 * Pure transform: given AndroidManifest.xml, return it with .MainActivity's
 * android:screenOrientation set to ORIENTATION. Throws if no .MainActivity is
 * present. Exported for unit tests.
 */
export function patchManifest(xml) {
  // Find every <activity ...> opening tag, pick the one for .MainActivity.
  // Attributes may span multiple lines; never assume order.
  const activityTagRe = /<activity\b[\s\S]*?>/g;
  const tags = xml.match(activityTagRe) || [];
  const mainTag = tags.find((t) => t.includes('android:name=".MainActivity"'));

  if (!mainTag) {
    throw new Error('no <activity> with android:name=".MainActivity" found in AndroidManifest.xml.');
  }

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

  return xml.replace(mainTag, newTag);
}

function runCli() {
  if (!existsSync(MANIFEST_PATH)) {
    console.error(
      `[android-landscape] ERROR: ${MANIFEST_PATH} does not exist.\n` +
      `This script must run AFTER "npx cap add android" has generated the\n` +
      `Android project (CI step in .github/workflows/android-debug.yml).`
    );
    process.exit(1);
  }

  const original = readFileSync(MANIFEST_PATH, 'utf8');
  let xml;
  try {
    xml = patchManifest(original);
  } catch (err) {
    console.error(`[android-landscape] ERROR: ${err.message}`);
    process.exit(1);
  }

  log(`set .MainActivity android:screenOrientation -> ${ORIENTATION}`);

  if (xml === original) {
    log('no changes needed (already patched) — manifest untouched on disk.');
  } else {
    writeFileSync(MANIFEST_PATH, xml, 'utf8');
    log(`wrote ${MANIFEST_PATH}`);
  }

  log('done.');
}

// Run the file-touching CLI only when invoked directly (not when imported).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
