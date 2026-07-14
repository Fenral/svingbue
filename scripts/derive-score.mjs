#!/usr/bin/env node
// Derives tier + score from independent judge results against the locked
// evidence manifest (instrument-gates work order §2/§4). A number is never
// judged — it is derived: score = 100 × (passed weight / total weight).
// NO-GO on any critical failure regardless of score. STUDIO-GRADE requires
// every requirement passed AND the pairwise blind comparison won.
//
// CLI: node scripts/derive-score.mjs <judge-results.json> [--pairwise-won]
//   <judge-results.json> is an array of {id, result: 'PASS'|'FAIL', evidence}
//   covering every manifest requirement exactly once. Output JSON is printed
//   to stdout: {tier, score, criticalFailures, findings}.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Canonical hash: stable across line-ending rewrites (git autocrlf), strict
// on any content edit. Used by the lock file and its enforcement test.
export function canonicalManifestHash(rawJson) {
  return createHash('sha256').update(JSON.stringify(JSON.parse(rawJson))).digest('hex');
}

export function deriveScore(manifest, judgeResults, { pairwiseWon = false } = {}) {
  const byId = new Map(manifest.requirements.map((entry) => [entry.id, entry]));
  const seen = new Set();

  for (const result of judgeResults) {
    if (!byId.has(result.id)) {
      throw new Error(`unknown requirement id in judge results: ${result.id}`);
    }
    if (seen.has(result.id)) {
      throw new Error(`duplicate judge result for ${result.id}`);
    }
    if (result.result !== 'PASS' && result.result !== 'FAIL') {
      throw new Error(`judge result for ${result.id} must be PASS or FAIL, got: ${result.result}`);
    }
    seen.add(result.id);
  }
  const missing = manifest.requirements.filter((entry) => !seen.has(entry.id));
  if (missing.length > 0) {
    throw new Error(`judge results missing requirement(s): ${missing.map((m) => m.id).join(', ')}`);
  }

  const totalWeight = manifest.requirements.reduce((sum, entry) => sum + entry.weight, 0);
  let passedWeight = 0;
  const findings = [];
  for (const result of judgeResults) {
    const requirement = byId.get(result.id);
    if (result.result === 'PASS') {
      passedWeight += requirement.weight;
    } else {
      findings.push({
        id: requirement.id,
        claim: requirement.claim,
        critical: requirement.critical,
        evidence: result.evidence ?? null
      });
    }
  }
  findings.sort((a, b) => Number(b.critical) - Number(a.critical) || a.id.localeCompare(b.id));

  const criticalFailures = findings.filter((finding) => finding.critical).map((finding) => finding.id);
  const score = Math.round((100 * passedWeight / totalWeight) * 100) / 100;

  let tier;
  if (criticalFailures.length > 0) {
    tier = 'NO-GO';
  } else if (findings.length === 0 && pairwiseWon) {
    tier = 'STUDIO-GRADE';
  } else {
    tier = 'SHIPPBAR';
  }

  return { tier, score, criticalFailures, findings };
}

const invokedDirectly = process.argv[1]
  && import.meta.url === new URL(`file:///${process.argv[1].replaceAll('\\', '/')}`).href;
if (invokedDirectly) {
  const [resultsPath] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
  if (!resultsPath) {
    console.error('usage: node scripts/derive-score.mjs <judge-results.json> [--pairwise-won]');
    process.exit(2);
  }
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
  const manifest = JSON.parse(readFileSync(join(ROOT, 'config', 'evidence', 'instrument-laws.json'), 'utf8'));
  const judgeResults = JSON.parse(readFileSync(resultsPath, 'utf8'));
  const verdict = deriveScore(manifest, judgeResults, {
    pairwiseWon: process.argv.includes('--pairwise-won')
  });
  console.log(JSON.stringify(verdict, null, 2));
  process.exit(verdict.tier === 'NO-GO' ? 1 : 0);
}
