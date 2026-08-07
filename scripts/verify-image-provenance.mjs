#!/usr/bin/env node
/**
 * IMAGE PROVENANCE VERIFIER — the gate that makes generated imagery safe here.
 *
 * WHY
 *
 * The Academy shipped five deleted engine formulas in its prose for three
 * months. Nothing re-derived the numbers, so nothing noticed. A picture is a
 * claim about the physics exactly like a sentence is, and it rots the same
 * way — except worse in two respects: nobody greps an image, and a reader
 * believes a picture faster than a paragraph.
 *
 * So an image that depicts a physical quantity must say which engine state it
 * came from. This gate re-runs that state and fails when the numbers move.
 *
 * WHAT IT CHECKS
 *
 *   1. Every image referenced from shipping explanatory content is either
 *      registered in config/image-provenance.json or explicitly declared
 *      atmospheric.
 *   2. Every registered image's `state` is fed to solveFlight, and every
 *      number the image claims to show is re-derived and compared.
 *   3. Atmospheric images must not claim geometry — the declaration carries a
 *      `depicts` list, and the geometry words are refused there.
 *   4. Every image has non-empty alt text in the registry. An unlabelled
 *      illustration is invisible to the reader who most needs the explanation.
 *
 * WHAT IT DOES NOT CHECK
 *
 * It cannot look at the pixels. If the registry says a picture shows a 30°
 * dynamic loft and the picture actually shows 45°, this gate is happy. It
 * verifies that the CLAIM is current, not that the ART is faithful. Faithfulness
 * is a human review, and the registry's `visualCheck` field is where the person
 * who looked at it records that they did.
 *
 * Exit 0 = every image claim still matches the engine.
 * Run: node scripts/verify-image-provenance.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY = join(ROOT, 'config', 'image-provenance.json');

const CONTENT = rel =>
  rel === 'index.html' ||
  rel === 'academy.html' ||
  /^academy-[a-z0-9-]+-(content|experience)\.js$/.test(rel) ||
  rel === 'academy-native-lesson.js' ||
  rel === 'academy-home.js';

/* A word that promises geometry. An atmospheric image may not use these — if it
   shows a face angle or a trajectory it is making a claim and needs provenance. */
const GEOMETRY_WORDS = /\b(swing|club ?face|clubhead|impact|trajectory|ball ?flight|shaft|loft|attack angle|low ?point|spin|path|strike|divot|address|backswing|downswing|follow ?through)\b/i;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.git', 'www', 'outputs', 'ios', 'android', '.sa-backups'].includes(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const findings = [];

/* ── collect every image referenced from shipping content ──────────────── */
const referenced = new Map();
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  if (!CONTENT(rel)) continue;
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/(?:src|href|url\()\s*=?\s*["'(]?([^"')\s]+\.(?:png|jpe?g|webp|avif|gif))/gi)) {
    const p = m[1].replace(/^\.\//, '');
    if (!referenced.has(p)) referenced.set(p, []);
    referenced.get(p).push(rel);
  }
}

if (!existsSync(REGISTRY)) {
  if (referenced.size) {
    console.log(`verify-image-provenance: ${referenced.size} image(s) referenced but no registry exists.`);
    for (const [p, files] of referenced) console.log(`   ${p}  (from ${files.join(', ')})`);
    console.log('\nCreate config/image-provenance.json. See scripts/verify-image-provenance.mjs for the shape.');
    process.exit(1);
  }
  console.log('verify-image-provenance: no images referenced from shipping explanatory content, no registry needed.');
  process.exit(0);
}

const reg = JSON.parse(readFileSync(REGISTRY, 'utf8'));
const entries = reg.images || [];
const byPath = new Map(entries.map(e => [e.path, e]));

for (const [p, files] of referenced) {
  if (!byPath.has(p)) {
    findings.push({
      rule: 'unregistered-image',
      detail: `${p} is used in ${files.join(', ')} but has no provenance entry`,
      fix: 'Add it to config/image-provenance.json — either with an engine `state` it derives from, or with "atmospheric": true if it depicts no physical quantity.',
    });
  }
}

const engine = await import(`file://${join(ROOT, 'impact-flight.js').replace(/\\/g, '/')}`);

for (const e of entries) {
  if (!e.alt || !e.alt.trim()) {
    findings.push({ rule: 'missing-alt', detail: `${e.path} has no alt text`, fix: 'An unlabelled illustration is invisible to the reader who most needs the explanation. Describe what it shows, not that it is an image.' });
  }

  if (e.atmospheric) {
    const claim = `${e.alt || ''} ${e.depicts || ''} ${e.prompt || ''}`;
    const hit = claim.match(GEOMETRY_WORDS);
    if (hit) {
      findings.push({
        rule: 'atmospheric-claims-geometry',
        detail: `${e.path} is declared atmospheric but its description says "${hit[0]}"`,
        fix: 'If it shows a swing, a face, a ball at impact or a trajectory it is making a claim about the physics. Give it an engine `state` and drop "atmospheric", or regenerate it without the geometry.',
      });
    }
    continue;
  }

  if (!e.state) {
    findings.push({ rule: 'no-engine-state', detail: `${e.path} is not atmospheric but declares no engine state`, fix: 'Add `state` (the solveFlight inputs) and `shows` (the numbers the image displays), or mark it atmospheric.' });
    continue;
  }

  let out;
  try { out = engine.solveFlight(e.state); }
  catch (err) { findings.push({ rule: 'state-threw', detail: `${e.path}: ${err.message}`, fix: 'The declared state is not a valid engine input.' }); continue; }

  for (const [field, claimed] of Object.entries(e.shows || {})) {
    const actual = out[field];
    if (typeof actual !== 'number') {
      findings.push({ rule: 'unknown-field', detail: `${e.path} claims to show "${field}", which the engine does not return`, fix: 'Use a field name solveFlight actually returns.' });
      continue;
    }
    const tol = (e.tolerance && e.tolerance[field]) ?? 0.05;
    if (Math.abs(actual - claimed) > tol) {
      findings.push({
        rule: 'image-claim-drifted',
        detail: `${e.path} shows ${field} = ${claimed}, engine now gives ${actual.toFixed(4)} (delta ${(actual - claimed).toPrecision(3)}, tolerance ${tol})`,
        fix: 'The engine moved under this picture. Regenerate the image, or correct the claim if the image was always wrong.',
      });
    }
  }
}

const registered = entries.length;
const atmospheric = entries.filter(e => e.atmospheric).length;

if (!findings.length) {
  console.log(`verify-image-provenance: ${registered} image(s) registered (${atmospheric} atmospheric, ${registered - atmospheric} engine-derived), all claims current.`);
  console.log('Note this verifies the CLAIM, not the ART — it cannot see the pixels. Faithfulness is the `visualCheck` field and a human.');
  process.exit(0);
}

console.log(`verify-image-provenance: ${findings.length} finding(s)\n`);
const byRule = new Map();
for (const f of findings) { if (!byRule.has(f.rule)) byRule.set(f.rule, []); byRule.get(f.rule).push(f); }
for (const [rule, list] of byRule) {
  console.log(`── ${rule} (${list.length})`);
  console.log(`   FIX: ${list[0].fix}`);
  for (const f of list) console.log(`   ${f.detail}`);
  console.log('');
}
process.exit(1);
