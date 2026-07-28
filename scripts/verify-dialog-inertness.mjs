#!/usr/bin/env node
/**
 * DIALOG INERTNESS VERIFIER — the missing seam gate
 *
 * WHY THIS EXISTS
 *
 * On 2026-07-15 twelve Academy experience modules were built in parallel, one
 * commit each, on the same day. All twelve emit
 *
 *     <aside role="dialog" aria-modal="true" hidden>
 *
 * and not one of them makes the background inert, traps Tab, or guards the
 * focus restore. Twelve independent authors made the same three mistakes
 * because nothing asserted the contract — while TWO correct implementations
 * already existed in this repo (`academy.html`'s shared sheet and
 * `academy-native-lesson.js`) and neither was copied.
 *
 * `aria-modal="true"` is a PROMISE to assistive technology: the rest of the
 * page is not there. A screen reader honours it and confines its virtual
 * cursor to the dialog. A keyboard user, meanwhile, Shift+Tabs straight out
 * into the page behind. The two groups get contradictory models of the same
 * UI, and the screen reader user cannot discover that the background is live.
 *
 * Every per-file test in this repo was green through all of it, because every
 * test checked a file against itself. This gate checks a file against a
 * contract that spans files. That is the class of defect it exists to catch.
 *
 * THE CONTRACT
 *
 * A file that declares `aria-modal="true"` must also do at least one of:
 *   - set `.inert` on something (real background inertness, the strongest form)
 *   - handle Tab (a focus trap)
 *   - delegate both to a shared helper it imports
 *
 * and its focus restore, if it has one, must be guarded — a bare
 * `trigger?.focus?.()` is not defensive. Optional chaining only guards
 * null/undefined; it sails straight through the two failure modes that
 * actually happen: a detached node after an innerHTML re-render, and
 * document.body, on which .focus() is a silent no-op.
 *
 * SCOPE: shipping UI only. Deliberately NOT scanned:
 *   - scripts/*.test.mjs      tests legitimately assert the broken shapes
 *   - *-mock.html             design references, not routed
 *   - design/mocks/**         candidates under review
 *   - www/**                  build output, a copy of the above
 *
 * Exit 0 = every modal dialog honours its own promise.
 * Exit 1 = a dialog lies to assistive technology.
 * Run: node scripts/verify-dialog-inertness.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'www', 'ios', 'android', 'outputs', '.sa-backups',
  'dist', 'build', '.voice-production', 'appstore', 'handoff',
]);

const skipFile = rel =>
  rel.includes(`design${sep}mocks`) ||
  rel.includes(`${sep}test`) ||
  /\.test\.(mjs|js)$/.test(rel) ||
  /-mock\.html$/.test(rel) ||
  /^app-mock-\d+\.html$/.test(rel) ||   // App Store comps: referenced by nothing, absent from www/
  /^scripts[\\/]/.test(rel);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(html|js|mjs)$/.test(name)) out.push(full);
  }
  return out;
}

/* Written as a template literal in most of these files, so match the attribute
   pair loosely rather than assuming quoting or attribute order. */
const DECLARES_MODAL = /aria-modal\s*=\s*(["'`]?)true\1/;
const SETS_MODAL_DYNAMICALLY = /setAttribute\(\s*['"`]aria-modal['"`]\s*,\s*[^)]*true/;

/* Any of these satisfies the contract. A shared helper counts: the point is
   that the behaviour exists, not that it is inlined. */
const HAS_INERT = /\.inert\s*=|\binert\b\s*=\s*(true|false)|\[inert\]|toggleAttribute\(\s*['"`]inert['"`]/;
const HAS_TAB_TRAP = /['"`]Tab['"`]|\.key\s*===\s*['"`]Tab['"`]|keyCode\s*===\s*9/;
const IMPORTS_SHEET_HELPER = /from\s*['"`]\.\/academy-sheet-a11y\.js['"`]/;

/* The bare optional-call restore. Looks defensive, guards nothing that fails. */
const UNGUARDED_RESTORE = /(\w+)\?\.focus\?\.\(\s*\)/g;
const HAS_CONNECTED_GUARD = /isConnected|document\.contains\(/;

const findings = [];

for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  if (skipFile(rel)) continue;

  const src = readFileSync(file, 'utf8');
  const declaresModal = DECLARES_MODAL.test(src) || SETS_MODAL_DYNAMICALLY.test(src);
  if (!declaresModal) continue;

  const satisfied =
    HAS_INERT.test(src) || HAS_TAB_TRAP.test(src) || IMPORTS_SHEET_HELPER.test(src);

  if (!satisfied) {
    const line = src.slice(0, src.search(DECLARES_MODAL)).split('\n').length;
    findings.push({
      file: rel,
      line,
      rule: 'modal-without-inertness',
      says: 'declares aria-modal="true" but never makes the background inert and never traps Tab',
      instead:
        'A screen reader believes the background is gone; a keyboard user Tabs straight into it. ' +
        'Either set inert on the background siblings and trap Tab (see academy-native-lesson.js, ' +
        'which does both), or drop to aria-modal="false" and be honest about it (see academy.html ' +
        'line 653, where the node preview is deliberately non-modal and correctly declared).',
    });
  }

  const restores = [...src.matchAll(UNGUARDED_RESTORE)];
  if (restores.length && !HAS_CONNECTED_GUARD.test(src)) {
    const idx = restores[0].index;
    findings.push({
      file: rel,
      line: src.slice(0, idx).split('\n').length,
      rule: 'unguarded-focus-restore',
      says: `${restores[0][0]} restores focus with no isConnected or body guard`,
      instead:
        'Optional chaining only guards null/undefined. It passes straight through the two cases ' +
        'that actually occur: a node detached by an innerHTML re-render, and document.body, where ' +
        '.focus() is a silent no-op — both leave the user on <body> with no announcement. ' +
        'Guard with isConnected (academy-native-lesson.js:1955) or document.contains (academy.html:1818).',
    });
  }
}

if (!findings.length) {
  console.log('verify-dialog-inertness: every aria-modal dialog honours its promise.');
  process.exit(0);
}

const byRule = new Map();
for (const f of findings) {
  if (!byRule.has(f.rule)) byRule.set(f.rule, []);
  byRule.get(f.rule).push(f);
}

console.log(`verify-dialog-inertness: ${findings.length} DIALOG CONTRACT VIOLATION(S)\n`);
for (const [rule, list] of byRule) {
  console.log(`── ${rule} (${list.length}) — ${list[0].says}`);
  console.log(`   FIX: ${list[0].instead}`);
  for (const f of list) console.log(`   ${f.file}:${f.line}`);
  console.log('');
}
console.log('aria-modal="true" is a promise to assistive technology. Keep it or stop making it.');
process.exit(1);
