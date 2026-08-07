import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import test from 'node:test';

import {
  EvidenceError,
  candidateCommitExists,
  evaluateEvidence,
  median,
  parseCliArguments,
  parseEvidence,
  runCli,
  summarizeEvidence,
  validateReleaseSummary,
} from './release-evidence-onboarding.mjs';

const CURRENT_COMMIT = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const PREVIOUS_COMMIT = execFileSync('git', ['rev-parse', 'HEAD^'], { encoding: 'utf8' }).trim();
const CURRENT_BUILD = '1.0.0 (42)';
const SCRIPT_PATH = fileURLToPath(new URL('./release-evidence-onboarding.mjs', import.meta.url));

function markdownFor(rows, {
  blockers = '0',
  quantitativeVerdict = 'PASS',
  finalVerdict = 'PASS',
} = {}) {
  return [
    '# Evidence fixture',
    '',
    '## Candidate record — fill before session P01',
    '',
    '| Field | Required value |',
    '|---|---|',
    '| Study date(s) and timezone | 2026-08-07 Europe/Oslo |',
    '| Candidate commit SHA | 5999da3 |',
    '| App version and build number | 1.0.0 (42) |',
    '| Distribution source | TestFlight |',
    '| Default language / locale | English / en-NO |',
    '| Facilitator | QA |',
    '| Evidence folder or release-record link | release-record-42 |',
    '',
    '## Session identity and evidence log',
    '',
    '| ID | Timestamp | Device | Build | Commit | Facilitator | Evidence |',
    '|---|---|---|---|---|---|---|',
    ...rows.map((row, index) => `| ${row[0]} | 2026-08-07T10:${String(index).padStart(2, '0')}:00+02:00 | iPhone 15 / iOS 26 | 1.0.0 (42) | 5999da3 | QA | none — no defect |`),
    '',
    '## Result table',
    '',
    '| ID | Map | Seconds | Loft | Help | Truth | Result | Notes |',
    '|---|---|---:|---|---|---|---|---|',
    ...rows.map(row => `| ${row.join(' | ')} |`),
    '',
    '## Calculation and verdict',
    '',
    '| Summary field | Recorded result |',
    '|---|---|',
    '| Valid sessions | 10 / 10 |',
    '| Unassisted completions | 10 / 10 |',
    '| Sorted qualifying times | 60, 61, 62, 63, 64, 65, 66, 67, 68, 69 |',
    '| Median qualifying time | 64.5 seconds |',
    '| Most common first hesitation | none |',
    '| Most requested next destination | Outcome |',
    `| Unresolved launch-blocking defects | ${blockers} |`,
    `| Quantitative verdict | ${quantitativeVerdict} |`,
    `| Final release-gate verdict | **${finalVerdict}** |`,
  ].join('\n').replaceAll('5999da3', CURRENT_COMMIT);
}

function passingRow(index, seconds) {
  return [`P${String(index).padStart(2, '0')}`, 'Y', String(seconds), 'Y', 'N', 'PASS', 'PASS', 'observed'];
}

function failedRow(index) {
  return [`P${String(index).padStart(2, '0')}`, 'N', '180+', 'N', 'N', 'FAIL', 'FAIL', 'did not reach map'];
}

test('calculates an even-count median without rounding', () => {
  assert.equal(median([80, 91]), 85.5);
});

test('passes exactly eight unassisted completions with median at most 90 seconds', () => {
  const times = [50, 60, 70, 90, 90, 110, 120, 130];
  const rows = [
    ...times.map((seconds, index) => passingRow(index + 1, seconds)),
    failedRow(9),
    failedRow(10),
  ];
  const summary = summarizeEvidence(parseEvidence(markdownFor(rows)));

  assert.equal(summary.unassistedCompletions, 8);
  assert.equal(summary.medianSeconds, 90);
  assert.equal(summary.quantitativePass, true);
});

test('validates candidate, device, timestamp and build evidence before evaluating the gate', () => {
  const rows = Array.from({ length: 10 }, (_, index) => passingRow(index + 1, 60 + index));
  const summary = evaluateEvidence(markdownFor(rows));

  assert.equal(summary.candidateCommit, CURRENT_COMMIT);
  assert.equal(summary.candidateBuild, '1.0.0 (42)');
  assert.equal(summary.identityRows.length, 10);
  assert.equal(summary.quantitativePass, true);
  assert.equal(summary.unresolvedLaunchBlockers, 0);
  assert.equal(summary.finalReleaseVerdict, 'PASS');
  assert.equal(summary.releaseGatePass, true);
});

test('fails the quantitative gate when the median is over 90 seconds', () => {
  const times = [60, 70, 80, 90, 91, 100, 110, 120];
  const rows = [
    ...times.map((seconds, index) => passingRow(index + 1, seconds)),
    failedRow(9),
    failedRow(10),
  ];
  const summary = summarizeEvidence(parseEvidence(markdownFor(rows)));

  assert.equal(summary.medianSeconds, 90.5);
  assert.equal(summary.quantitativePass, false);
});

test('handles ten valid non-completions without inventing a median', () => {
  const rows = Array.from({ length: 10 }, (_, index) => failedRow(index + 1));
  const summary = summarizeEvidence(parseEvidence(markdownFor(rows)));

  assert.equal(summary.unassistedCompletions, 0);
  assert.equal(summary.medianSeconds, null);
  assert.equal(summary.quantitativePass, false);
});

test('rejects a recorded result that disagrees with observed fields', () => {
  const rows = Array.from({ length: 10 }, (_, index) => passingRow(index + 1, 70 + index));
  rows[0][4] = 'Y';

  assert.throws(
    () => summarizeEvidence(parseEvidence(markdownFor(rows))),
    error => error instanceof EvidenceError
      && error.kind === 'invalid'
      && /derive FAIL/.test(error.message),
  );
});

test('reports untouched PENDING rows as incomplete evidence', () => {
  const rows = Array.from(
    { length: 10 },
    (_, index) => [`P${String(index + 1).padStart(2, '0')}`, 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING'],
  );

  assert.throws(
    () => summarizeEvidence(parseEvidence(markdownFor(rows))),
    error => error instanceof EvidenceError && error.kind === 'incomplete',
  );
});

test('rejects a participant record from a different candidate commit', () => {
  const rows = Array.from({ length: 10 }, (_, index) => passingRow(index + 1, 60 + index));
  const markdown = markdownFor(rows).replace(
    `| P04 | 2026-08-07T10:03:00+02:00 | iPhone 15 / iOS 26 | 1.0.0 (42) | ${CURRENT_COMMIT} |`,
    '| P04 | 2026-08-07T10:03:00+02:00 | iPhone 15 / iOS 26 | 1.0.0 (42) | abcdef0 |',
  );

  assert.throws(
    () => evaluateEvidence(markdown),
    error => error instanceof EvidenceError
      && error.kind === 'invalid'
      && /does not resolve to the candidate commit/.test(error.message),
  );
});

test('rejects a fabricated full SHA that merely shares the candidate prefix', () => {
  const rows = Array.from({ length: 10 }, (_, index) => passingRow(index + 1, 60 + index));
  const forgedCommit = `${CURRENT_COMMIT.slice(0, 7)}${'f'.repeat(33)}`;
  const markdown = markdownFor(rows).replace(
    `| P04 | 2026-08-07T10:03:00+02:00 | iPhone 15 / iOS 26 | 1.0.0 (42) | ${CURRENT_COMMIT} |`,
    `| P04 | 2026-08-07T10:03:00+02:00 | iPhone 15 / iOS 26 | 1.0.0 (42) | ${forgedCommit} |`,
  );

  assert.equal(candidateCommitExists(forgedCommit), false);
  assert.throws(
    () => evaluateEvidence(markdown),
    error => error instanceof EvidenceError
      && error.kind === 'invalid'
      && /does not resolve to the candidate commit/.test(error.message),
  );
});

test('rejects a participant record from a different candidate build', () => {
  const rows = Array.from({ length: 10 }, (_, index) => passingRow(index + 1, 60 + index));
  const markdown = markdownFor(rows).replace(
    '| P06 | 2026-08-07T10:05:00+02:00 | iPhone 15 / iOS 26 | 1.0.0 (42) |',
    '| P06 | 2026-08-07T10:05:00+02:00 | iPhone 15 / iOS 26 | 1.0.0 (43) |',
  );

  assert.throws(
    () => evaluateEvidence(markdown),
    error => error instanceof EvidenceError
      && error.kind === 'invalid'
      && /build does not match/.test(error.message),
  );
});

test('rejects placeholder metadata instead of producing a false pass', () => {
  const rows = Array.from({ length: 10 }, (_, index) => passingRow(index + 1, 60 + index));
  for (const placeholder of ['TBD - collect later', 'N/A - not recorded', 'TODO']) {
    const markdown = markdownFor(rows).replace(
      '| P02 | 2026-08-07T10:01:00+02:00 | iPhone 15 / iOS 26 |',
      `| P02 | 2026-08-07T10:01:00+02:00 | ${placeholder} |`,
    );

    assert.throws(
      () => evaluateEvidence(markdown),
      error => error instanceof EvidenceError
        && error.kind === 'incomplete'
        && /P02 device/.test(error.message),
      placeholder,
    );
  }
});

test('rejects normalized impossible calendar dates', () => {
  const rows = Array.from({ length: 10 }, (_, index) => passingRow(index + 1, 60 + index));
  const markdown = markdownFor(rows).replace(
    '2026-08-07T10:02:00+02:00',
    '2026-02-31T10:02:00+02:00',
  );

  assert.throws(
    () => evaluateEvidence(markdown),
    error => error instanceof EvidenceError
      && error.kind === 'invalid'
      && /P03 timestamp/.test(error.message),
  );
});

test('requires the candidate SHA to exist in the current repository', () => {
  assert.equal(candidateCommitExists(CURRENT_COMMIT), true);
  assert.equal(candidateCommitExists('deadbee'), false);
});

test('requires explicit candidate and build CLI arguments', () => {
  assert.throws(
    () => parseCliArguments(['node', SCRIPT_PATH]),
    error => error instanceof EvidenceError
      && error.kind === 'invalid'
      && /Missing required --candidate/.test(error.message),
  );
  assert.throws(
    () => parseCliArguments(['node', SCRIPT_PATH, '--candidate', CURRENT_COMMIT]),
    error => error instanceof EvidenceError
      && error.kind === 'invalid'
      && /Missing required --build/.test(error.message),
  );
});

test('summary must record a quantitative verdict matching the derived rows', () => {
  assert.throws(
    () => validateReleaseSummary(markdownFor([], { quantitativeVerdict: 'FAIL', finalVerdict: 'FAIL' }), true),
    error => error instanceof EvidenceError
      && error.kind === 'invalid'
      && /rows derive PASS/.test(error.message),
  );
});

test('summary rejects pending or non-numeric blocker records', () => {
  for (const blockers of ['PENDING', 'FAIL']) {
    assert.throws(
      () => validateReleaseSummary(markdownFor([], { blockers }), true),
      error => error instanceof EvidenceError
        && (blockers === 'PENDING' ? error.kind === 'incomplete' : error.kind === 'invalid'),
      blockers,
    );
  }
});

test('summary rejects pending final verdict and inconsistent PASS', () => {
  assert.throws(
    () => validateReleaseSummary(markdownFor([], { finalVerdict: 'PENDING' }), true),
    error => error instanceof EvidenceError && error.kind === 'incomplete',
  );
  assert.throws(
    () => validateReleaseSummary(markdownFor([], { blockers: '1', finalVerdict: 'PASS' }), true),
    error => error instanceof EvidenceError
      && error.kind === 'invalid'
      && /cannot be PASS/.test(error.message),
  );
});

test('CLI verifies only the explicitly expected candidate and build', () => {
  const root = mkdtempSync(join(tmpdir(), 'flightglass-evidence-cli-'));
  const rows = Array.from({ length: 10 }, (_, index) => passingRow(index + 1, 60 + index));
  const validPath = join(root, 'valid.md');
  const pendingPath = join(root, 'pending.md');
  writeFileSync(validPath, markdownFor(rows), 'utf8');
  writeFileSync(pendingPath, markdownFor(rows, { finalVerdict: 'PENDING' }), 'utf8');

  try {
    const output = [];
    const errors = [];
    assert.equal(runCli({
      argv: [
        'node',
        SCRIPT_PATH,
        '--candidate',
        CURRENT_COMMIT,
        '--build',
        CURRENT_BUILD,
        '--file',
        validPath,
      ],
      cwd: process.cwd(),
      stdout: line => output.push(line),
      stderr: line => errors.push(line),
    }), 0);
    assert.match(output.join('\n'), /Quantitative verdict: PASS/);
    assert.match(output.join('\n'), /Onboarding release-evidence verdict: PASS/);
    assert.deepEqual(errors, []);

    assert.equal(runCli({
      argv: [
        'node',
        SCRIPT_PATH,
        '--candidate',
        CURRENT_COMMIT,
        '--build',
        CURRENT_BUILD,
        '--file',
        pendingPath,
      ],
      cwd: process.cwd(),
      stdout: line => output.push(line),
      stderr: line => errors.push(line),
    }), 2);
    assert.match(errors.at(-1), /^PENDING:/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('CLI rejects stale candidate evidence and a mismatched build identity', () => {
  const root = mkdtempSync(join(tmpdir(), 'flightglass-evidence-identity-'));
  const rows = Array.from({ length: 10 }, (_, index) => passingRow(index + 1, 60 + index));
  const evidencePath = join(root, 'valid.md');
  writeFileSync(evidencePath, markdownFor(rows), 'utf8');

  try {
    const errors = [];
    assert.equal(runCli({
      argv: [
        'node', SCRIPT_PATH,
        '--candidate', PREVIOUS_COMMIT,
        '--build', CURRENT_BUILD,
        '--file', evidencePath,
      ],
      cwd: process.cwd(),
      stdout: () => {},
      stderr: line => errors.push(line),
    }), 2);
    assert.match(errors.at(-1), /does not match expected candidate/);

    assert.equal(runCli({
      argv: [
        'node', SCRIPT_PATH,
        '--candidate', CURRENT_COMMIT,
        '--build', '1.0.0 (43)',
        '--file', evidencePath,
      ],
      cwd: process.cwd(),
      stdout: () => {},
      stderr: line => errors.push(line),
    }), 2);
    assert.match(errors.at(-1), /does not match expected build/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('CLI returns failure when blockers remain or the recorded final verdict is FAIL', () => {
  const root = mkdtempSync(join(tmpdir(), 'flightglass-evidence-gate-'));
  const rows = Array.from({ length: 10 }, (_, index) => passingRow(index + 1, 60 + index));
  const blockersPath = join(root, 'blockers.md');
  const finalFailPath = join(root, 'final-fail.md');
  writeFileSync(blockersPath, markdownFor(rows, { blockers: '1', finalVerdict: 'FAIL' }), 'utf8');
  writeFileSync(finalFailPath, markdownFor(rows, { finalVerdict: 'FAIL' }), 'utf8');
  const argvFor = file => [
    'node', SCRIPT_PATH,
    '--candidate', CURRENT_COMMIT,
    '--build', CURRENT_BUILD,
    '--file', file,
  ];

  try {
    assert.equal(runCli({
      argv: argvFor(blockersPath),
      cwd: process.cwd(),
      stdout: () => {},
      stderr: () => {},
    }), 1);
    assert.equal(runCli({
      argv: argvFor(finalFailPath),
      cwd: process.cwd(),
      stdout: () => {},
      stderr: () => {},
    }), 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('real CLI entry point enforces identity arguments and emits a release PASS', () => {
  const root = mkdtempSync(join(tmpdir(), 'flightglass-evidence-process-'));
  const rows = Array.from({ length: 10 }, (_, index) => passingRow(index + 1, 60 + index));
  const evidencePath = join(root, 'valid.md');
  writeFileSync(evidencePath, markdownFor(rows), 'utf8');

  try {
    const result = spawnSync(process.execPath, [
      SCRIPT_PATH,
      '--candidate', CURRENT_COMMIT,
      '--build', CURRENT_BUILD,
      '--file', evidencePath,
    ], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Expected candidate:/);
    assert.match(result.stdout, /Onboarding release-evidence verdict: PASS/);

    const missingIdentity = spawnSync(process.execPath, [SCRIPT_PATH, '--file', evidencePath], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    assert.equal(missingIdentity.status, 2);
    assert.match(missingIdentity.stderr, /Missing required --candidate/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
