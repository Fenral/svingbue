#!/usr/bin/env node
/**
 * ENGINE CLAIM VERIFIER — the second missing seam gate
 *
 * WHY THIS EXISTS
 *
 * The 3-D spin recalibration replaced five fitted expressions in the engine.
 * The engine change was gated hard. The content that TAUGHT those expressions
 * was never re-derived, and 209 adversarially-confirmed defects came out of
 * that gap — including quiz answers marked correct against formulas the engine
 * no longer contains.
 *
 * `verify-academy-formulas.mjs` stayed green through all of it, because it is a
 * denylist: it bans five named dead strings and never asks whether a formula
 * the prose ATTRIBUTES to the engine is actually the engine's. A denylist can
 * only catch what somebody remembered to add.
 *
 * WHAT THIS CHECKS
 *
 * Two mechanisms, deliberately different in kind:
 *
 *   1. COEFFICIENT MEMBERSHIP (broad, leaky, zero maintenance)
 *      Any number with two or more decimals inside a sentence that claims
 *      engine authority must appear somewhere in the engine source. A fitted
 *      coefficient that exists nowhere in the engine is being taught from
 *      memory or from a deleted version.
 *
 *   2. EXECUTABLE CLAIMS (narrow, exact, needs maintenance)
 *      `config/engine-claims.json` maps a claim to a real engine call and an
 *      expected value. This gate RUNS them. A claim that drifts fails here with
 *      the measured difference, not a guess.
 *
 * WHAT THIS DOES NOT CATCH — read this before trusting it
 *
 * Mechanism 1 is roughly half-blind and always will be. Measured against the
 * sixteen coefficients known to have been taught wrongly, it catches seven:
 * 0.004, 1.389, 0.232, 210, 1.42, 1.8, 12000. It MISSES 1.46, 0.62, 0.25, 45,
 * 52.8, 1.5 — every one of them because the same digits appear elsewhere in the
 * engine as an unrelated constant. `1.46` was the dead smash intercept; the
 * engine contains `1.46` in a different role, so membership passes.
 *
 * Only mechanism 2 closes that. Every claim moved into engine-claims.json is a
 * claim that can no longer rot silently. The registry starts small on purpose —
 * it grows as content is migrated, and its size is an honest measure of how
 * much of the corpus is actually verified rather than merely unflagged.
 *
 * Do not report this gate as proof the content is correct. It is proof that a
 * specific, enumerated set of claims is correct.
 *
 * Exit 0 = every registered claim holds and no orphan coefficient found.
 * Run: node scripts/verify-engine-claims.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const ENGINE_FILES = [
  'impact-flight.js',
  'flightglass-3d-spin-model.js',
  'swing-parameters-and-impact.js',
  'driver-flight.mjs',
];

/* Shipping Academy content only — the same scope verify-academy-formulas uses,
   so the two gates agree on what "shipping" means. */
const isContent = rel =>
  rel === 'academy.html' ||
  /^academy-[a-z0-9-]+-(content|model)\.js$/.test(rel) ||
  rel === 'academy-native-lesson.js';

/* A sentence claims engine authority when it says so. These are the phrasings
   the corpus actually uses — collected from the confirmed findings, not
   invented. Prose that merely states a number is out of scope: teaching a
   rounded figure is legitimate, claiming it IS the engine's is not. */
const AUTHORITY = /\b(this app's engine|the engine|engine (?:carry|smash|launch|spin|baseline|output|value)|sourced|Grounded in the engine|Wolfram-checked engine|solveFlight)\b/i;

const engineSource = ENGINE_FILES
  .filter(f => existsSync(join(ROOT, f)))
  .map(f => readFileSync(join(ROOT, f), 'utf8'))
  .join('\n');

const engineNumbers = new Set(
  [...engineSource.matchAll(/-?\d+(?:\.\d+)?(?:e-?\d+)?/g)].map(m => m[0].replace(/^-/, ''))
);

const findings = [];

/* ── Mechanism 1 ────────────────────────────────────────────────────────── */

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.git', 'www', 'outputs', 'design', 'docs', 'scripts', 'ios', 'android'].includes(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(html|js)$/.test(name)) out.push(full);
  }
  return out;
}

for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  if (!isContent(rel)) continue;
  const src = readFileSync(file, 'utf8');

  /* Split on sentence-ish boundaries so a number is judged against the claim it
     actually sits in, not against a paragraph that happens to mention "engine"
     three sentences away. */
  src.split(/(?<=[.!?"])\s+|","|\\n/).forEach(sentence => {
    if (!AUTHORITY.test(sentence)) return;
    for (const m of sentence.matchAll(/\b\d+\.\d{2,}\b/g)) {
      const n = m[0];
      if (engineNumbers.has(n)) continue;
      /* Trailing-zero and truncation variants: 1.50 for 1.5, 1.544 for
         1.544034400161688. A prose figure rounded from a real constant is
         legitimate teaching, not a stale coefficient. */
      if ([...engineNumbers].some(e => e.startsWith(n) || n.startsWith(e.slice(0, n.length)))) continue;
      findings.push({
        rel,
        rule: 'orphan-coefficient',
        detail: `${n} is presented as engine truth but appears nowhere in the engine`,
        context: sentence.replace(/\s+/g, ' ').trim().slice(0, 160),
      });
    }
  });
}

/* ── Mechanism 2 ────────────────────────────────────────────────────────── */

const REGISTRY = join(ROOT, 'config', 'engine-claims.json');
let registered = 0;

if (existsSync(REGISTRY)) {
  const claims = JSON.parse(readFileSync(REGISTRY, 'utf8')).claims || [];
  const engine = await import(`file://${join(ROOT, 'impact-flight.js').replace(/\\/g, '/')}`);
  registered = claims.length;

  for (const c of claims) {
    let actual;
    try {
      actual = Function('engine', `"use strict"; return (${c.expression});`)(engine);
    } catch (err) {
      findings.push({
        rel: 'config/engine-claims.json',
        rule: 'claim-threw',
        detail: `${c.id}: ${err.message}`,
        context: c.expression,
      });
      continue;
    }
    const tol = c.tolerance ?? 1e-9;
    if (!Number.isFinite(actual) || Math.abs(actual - c.expected) > tol) {
      findings.push({
        rel: c.taughtIn || 'config/engine-claims.json',
        rule: 'claim-drifted',
        detail: `${c.id}: content teaches ${c.expected}, engine now gives ${actual} (delta ${(actual - c.expected).toPrecision(4)}, tolerance ${tol})`,
        context: c.expression,
      });
    }
  }
}

/* ── Report ─────────────────────────────────────────────────────────────── */

console.log(
  `verify-engine-claims: ${registered} registered claim(s) re-derived, ` +
  `${findings.length} finding(s)\n`
);

if (!findings.length) {
  console.log('Every registered claim holds. Note this proves those claims only —');
  console.log('coefficient membership is roughly half-blind by construction. See the');
  console.log('header of this file for exactly what it cannot see.');
  process.exit(0);
}

const byRule = new Map();
for (const f of findings) {
  if (!byRule.has(f.rule)) byRule.set(f.rule, []);
  byRule.get(f.rule).push(f);
}
for (const [rule, list] of byRule) {
  console.log(`── ${rule} (${list.length})`);
  for (const f of list) {
    console.log(`   ${f.rel}  ${f.detail}`);
    console.log(`      …${f.context}…`);
  }
  console.log('');
}
process.exit(1);
