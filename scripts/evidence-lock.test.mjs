// Evaluation-infrastructure contract for the instrument-gates work order
// (docs/superpowers/plans/2026-07-14-instrument-gates.md).
//
// 1. The evidence manifest exists, is structurally valid and is LOCKED: its
//    canonical SHA-256 must match config/evidence/instrument-laws.lock. Any
//    post-lock edit to the manifest fails this suite (§4: the manifest is
//    never changed after locking).
// 2. derive-score.mjs turns judge PASS/FAIL results into {tier, score,
//    criticalFailures, findings}. NO-GO on any critical failure regardless of
//    score; STUDIO-GRADE requires every requirement passed AND the pairwise
//    blind comparison won.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveScore, canonicalManifestHash } from './derive-score.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = join(ROOT, 'config', 'evidence', 'instrument-laws.json');
const lockPath = join(ROOT, 'config', 'evidence', 'instrument-laws.lock');

const EXPECTED_IDS = [
  'EV-TYPO-01', 'EV-TYPO-02', 'EV-TYPO-03', 'EV-TYPO-04',
  'EV-MOT-01', 'EV-MOT-02', 'EV-MOT-03', 'EV-MOT-04',
  'EV-REN-01', 'EV-REN-02', 'EV-REN-03',
  'EV-NAT-01', 'EV-NAT-02', 'EV-NAT-03', 'EV-NAT-04',
  'EV-REG-01', 'EV-GATE-01'
];

function loadManifest() {
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

test('evidence manifest exists with all 17 requirements and ordered weights', () => {
  const manifest = loadManifest();
  assert.deepEqual(manifest.requirements.map((entry) => entry.id), EXPECTED_IDS);
  for (const entry of manifest.requirements) {
    assert.equal(typeof entry.claim, 'string');
    assert.ok(entry.claim.length > 0, `${entry.id} needs a claim`);
    assert.equal(typeof entry.verify, 'string');
    assert.ok(entry.verify.length > 0, `${entry.id} needs a verification method`);
    assert.equal(typeof entry.critical, 'boolean');
    assert.equal(entry.weight, entry.critical ? 8 : 4,
      `${entry.id} weight must follow critical=8 / non-critical=4`);
  }
});

test('evidence manifest is locked: canonical SHA-256 matches the lock file', () => {
  const raw = readFileSync(manifestPath, 'utf8');
  const lock = readFileSync(lockPath, 'utf8').trim();
  assert.match(lock, /^[0-9a-f]{64}$/, 'lock must be a SHA-256 hex digest');
  assert.equal(canonicalManifestHash(raw), lock,
    'instrument-laws.json changed after locking — the manifest is immutable (§4); '
    + 'sharpen the verification method in tests instead');
});

test('the canonical hash ignores line-ending rewrites but not content edits', () => {
  const raw = readFileSync(manifestPath, 'utf8');
  const crlf = raw.replaceAll('\n', '\r\n');
  assert.equal(canonicalManifestHash(crlf), canonicalManifestHash(raw));
  const edited = JSON.parse(raw);
  edited.requirements[0].weight = 4;
  assert.notEqual(canonicalManifestHash(JSON.stringify(edited)), canonicalManifestHash(raw));
});

function judgeResults(overrides = {}) {
  const manifest = loadManifest();
  return manifest.requirements.map((entry) => ({
    id: entry.id,
    result: overrides[entry.id] || 'PASS',
    evidence: `synthetic evidence for ${entry.id}`
  }));
}

test('derive-score: all passed + pairwise won derives STUDIO-GRADE at 100', () => {
  const verdict = deriveScore(loadManifest(), judgeResults(), { pairwiseWon: true });
  assert.equal(verdict.tier, 'STUDIO-GRADE');
  assert.equal(verdict.score, 100);
  assert.deepEqual(verdict.criticalFailures, []);
  assert.deepEqual(verdict.findings, []);
});

test('derive-score: one critical failure is NO-GO regardless of score', () => {
  const verdict = deriveScore(loadManifest(), judgeResults({ 'EV-REG-01': 'FAIL' }), {
    pairwiseWon: true
  });
  assert.equal(verdict.tier, 'NO-GO');
  assert.deepEqual(verdict.criticalFailures, ['EV-REG-01']);
  assert.ok(verdict.score > 90, 'a high derived score must never rescue a critical failure');
  assert.equal(verdict.findings.length, 1);
  assert.equal(verdict.findings[0].critical, true);
});

test('derive-score: non-critical failures keep SHIPPBAR and weight the score down', () => {
  const verdict = deriveScore(
    loadManifest(),
    judgeResults({ 'EV-TYPO-03': 'FAIL', 'EV-NAT-03': 'FAIL' }),
    { pairwiseWon: true }
  );
  assert.equal(verdict.tier, 'SHIPPBAR');
  assert.deepEqual(verdict.criticalFailures, []);
  // total weight = 10 critical * 8 + 7 non-critical * 4 = 108; failed 8 → 100/108
  assert.equal(verdict.score, Math.round((100 / 108) * 10000) / 100);
  assert.equal(verdict.findings.length, 2);
});

test('derive-score: STUDIO-GRADE requires the pairwise comparison to be won', () => {
  const verdict = deriveScore(loadManifest(), judgeResults(), { pairwiseWon: false });
  assert.equal(verdict.tier, 'SHIPPBAR');
  assert.equal(verdict.score, 100);
});

test('derive-score: refuses incomplete or unknown judge coverage', () => {
  const manifest = loadManifest();
  assert.throws(() => deriveScore(manifest, judgeResults().slice(1)), /missing/i);
  assert.throws(
    () => deriveScore(manifest, [...judgeResults(), { id: 'EV-FAKE-99', result: 'PASS' }]),
    /unknown/i
  );
  assert.throws(
    () => deriveScore(manifest, judgeResults({ 'EV-MOT-01': 'MAYBE' })),
    /PASS|FAIL/
  );
});

test('lock helper: sha256 of canonical JSON matches node crypto directly', () => {
  const raw = readFileSync(manifestPath, 'utf8');
  const expected = createHash('sha256')
    .update(JSON.stringify(JSON.parse(raw)))
    .digest('hex');
  assert.equal(canonicalManifestHash(raw), expected);
});
