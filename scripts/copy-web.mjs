#!/usr/bin/env node
// scripts/copy-web.mjs
//
// Assembles the clean `www/` directory that Capacitor packages into the
// native iOS app. This repo's root doubles as the live Vercel site (which
// must keep serving index.html/geometry.html/impact.html and every sibling
// dev-mock file exactly as-is), so we do NOT point Capacitor at the repo
// root. Instead this script copies only the "shipping" web assets into a
// disposable `www/` folder that mirrors the three real app pages + the
// paywall's terms/privacy pages.
//
// Run: node scripts/copy-web.mjs   (also wired as `npm run copy-web`)
//
// Strategy: explicit ALLOWLIST of top-level HTML entry points (only the
// three real app pages — every *-mock.html / *-glass.html / design-system
// / presentation / calibration variant is deliberately left out), plus an
// allowlist of asset directories, plus a DENYLIST-by-extension/name sweep
// over remaining top-level files (all *.js and *.css at the repo root,
// excluding anything on the denylist).

import { readdirSync, statSync, rmSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { join, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const WWW = join(ROOT, 'www');

// --- 1. Explicit allowlist: the only HTML pages that ship in the native app.
// terms.html + privacy.html: linked from the paywall's legal row
// (sa-paywall.js → ./terms.html / ./privacy.html) — Apple requires these to
// resolve inside the native app, so they ship alongside the three app pages.
const ALLOWED_HTML_FILES = [
  'index.html',
  'geometry.html',
  'impact.html',
  'academy.html',
  'terms.html',
  'privacy.html'
];

// --- 2. Explicit allowlist: asset/module directories copied wholesale.
const ALLOWED_DIRS = ['vendor', 'assets', 'geo3d'];

// --- 3. Top-level directories that must NEVER be copied into www/, even if
//     they happen to contain .js/.css files at some depth (defense in depth —
//     none of these are in ALLOWED_DIRS above, but this also stops us from
//     accidentally recursing into them from the root sweep below).
const DENYLIST_DIRS = new Set([
  'node_modules', 'ios', 'android', 'www', 'tools', 'docs', 'scripts',
  '.git', '.sa-backups', '.vercel', 'resources', 'store-assets',
]);

// --- 4. Top-level files that must NEVER be copied, matched by exact name,
//     suffix pattern, or extension. This is what keeps throwaway mocks and
//     tooling config out of the native bundle.
const DENYLIST_EXACT_FILES = new Set([
  'capacitor.config.ts',
  'capacitor.config.js',
  'codemagic.yaml',
  'package.json',
  'package-lock.json',
  'NATIVE.md',
]);

function isDenylistedFile(name) {
  const lower = name.toLowerCase();
  if (DENYLIST_EXACT_FILES.has(name)) return true;
  if (lower.endsWith('.md')) return true;
  if (lower.startsWith('package') && lower.endsWith('.json')) return true;
  if (lower === 'capacitor.config.ts' || lower === 'capacitor.config.js') return true;
  if (lower === 'codemagic.yaml' || lower === 'codemagic.yml') return true;
  // Throwaway HTML mock/demo files — never ship these to the native app.
  if (lower.endsWith('.mock.html')) return true;
  if (lower.endsWith('-mock.html')) return true;
  if (lower === 'club-calibration.html') return true;
  return false;
}

function log(msg) {
  console.log(`[copy-web] ${msg}`);
}

// --- Step 1: wipe and recreate www/ so stale files never linger.
if (existsSync(WWW)) {
  rmSync(WWW, { recursive: true, force: true });
  log('removed existing www/');
}
mkdirSync(WWW, { recursive: true });
log('created fresh www/');

// --- Step 2: copy the allowed HTML entry points.
for (const file of ALLOWED_HTML_FILES) {
  const src = join(ROOT, file);
  if (!existsSync(src)) {
    throw new Error(`[copy-web] required file missing: ${file}`);
  }
  cpSync(src, join(WWW, file));
  log(`copied ${file}`);
}

// --- Step 3: copy the allowed asset/module directories wholesale.
for (const dir of ALLOWED_DIRS) {
  const src = join(ROOT, dir);
  if (!existsSync(src)) {
    throw new Error(`[copy-web] required directory missing: ${dir}`);
  }
  cpSync(src, join(WWW, dir), { recursive: true });
  log(`copied ${dir}/`);
}

// --- Step 4: sweep top-level *.js and *.css files (denylist-filtered).
const topLevelEntries = readdirSync(ROOT);
let jsAndCssCount = 0;
for (const name of topLevelEntries) {
  const full = join(ROOT, name);
  const stat = statSync(full);

  if (stat.isDirectory()) continue; // directories are handled explicitly above
  if (ALLOWED_HTML_FILES.includes(name)) continue; // already copied

  const ext = extname(name).toLowerCase();
  if (ext !== '.js' && ext !== '.css') continue; // only sweep JS/CSS at root

  if (isDenylistedFile(name)) {
    log(`skipped (denylisted): ${name}`);
    continue;
  }

  cpSync(full, join(WWW, name));
  jsAndCssCount += 1;
  log(`copied ${name}`);
}
log(`copied ${jsAndCssCount} top-level *.js/*.css file(s)`);

// --- Step 5: sanity guards — never let known-bad things slip into www/.
const forbiddenInWww = ['node_modules', 'ios', 'android', 'tools', 'docs', 'scripts', '.git'];
for (const bad of forbiddenInWww) {
  if (existsSync(join(WWW, bad))) {
    throw new Error(`[copy-web] SANITY CHECK FAILED: www/${bad} exists and must not.`);
  }
}

log('done. www/ is ready for `npx cap sync ios`.');
