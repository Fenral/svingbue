import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  EvidenceError,
  evaluateEvidence,
  listDirtySourceEntries,
  median,
  packageVersionAtCommit,
  parseCliArguments,
  parseEvidence,
  runCli,
  summarizeEvidence,
  validateEvidenceMetadata,
  validatePendingTemplate,
} from './release-evidence-onboarding.mjs';

const REPO_ROOT = process.cwd();
const CURRENT_COMMIT = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: REPO_ROOT,
  encoding: 'utf8',
}).trim();
const PREVIOUS_COMMIT = execFileSync('git', ['rev-parse', 'HEAD^'], {
  cwd: REPO_ROOT,
  encoding: 'utf8',
}).trim();
const PACKAGE_VERSION = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')).version;
const BUILD = `${PACKAGE_VERSION} (42)`;
const RUN_URL = 'https://github.com/Fenral/svingbue/actions/runs/31221030000';
const NOW = new Date('2026-08-08T12:00:00Z');

function passingRow(index, seconds = 59 + index) {
  return [`P${String(index).padStart(2, '0')}`, 'Y', String(seconds), 'Y', 'N', 'PASS', 'PASS', `Hesitation ${index}; Outcome`];
}

function failedRow(index, seconds = '180+') {
  return [`P${String(index).padStart(2, '0')}`, 'N', String(seconds), 'N', 'Y', 'FAIL', 'FAIL', `Stopped at step ${index}; Studio`];
}

function derivedSummary(rows) {
  const summary = summarizeEvidence(rows.map(([id, map, seconds, loft, help, truth, result, notes]) => ({
    id, map, seconds, loft, help, truth, result, notes,
  })));
  const medianValue = Number.isInteger(summary.medianSeconds)
    ? String(summary.medianSeconds)
    : summary.medianSeconds.toFixed(1);
  return {
    valid: `${summary.validSessions} / 10`,
    unassisted: `${summary.unassistedCompletions} / 10`,
    times: summary.qualifyingTimes.join(', '),
    median: `${medianValue} seconds`,
    quantitative: summary.quantitativePass ? 'PASS' : 'FAIL',
  };
}

function completedEvidence({
  commit = CURRENT_COMMIT,
  build = BUILD,
  runUrl = RUN_URL,
  rows = Array.from({ length: 10 }, (_, index) => passingRow(index + 1)),
  status = '**PASS — completed and reviewed**',
  studyRange = '2026-08-07T09:30:00+02:00 — 2026-08-07T12:00:00+02:00',
  evidenceRootRecord = '.',
  summaryOverrides = {},
} = {}) {
  const calculated = { ...derivedSummary(rows), ...summaryOverrides };
  return [
    '# Phase 2 moderated onboarding release gate',
    '',
    `Status: ${status}`,
    '',
    '## Release rule',
    '',
    'The onboarding gate passes only when all of the following are true:',
    '',
    '1. exactly 10 eligible first-time participants have valid session records;',
    '2. at least 8 of 10 reach the product map without help;',
    '3. the median completion time of those unassisted completions is 90 seconds or',
    '   less; and',
    '4. no unresolved launch-blocking defect was observed.',
    '',
    'An unassisted completion requires `Map = Y`, `Loft = Y`, `Help = N` and',
    '`Truth = PASS` in the result table.',
    '',
    '## Candidate record — completed copy',
    '',
    '| Field | Required value |',
    '|---|---|',
    `| Study date(s) and timezone | ${studyRange} |`,
    `| Candidate commit SHA | ${commit} |`,
    `| GitHub release-gate run URL | ${runUrl} |`,
    `| App version and build number | ${build} |`,
    '| Distribution source | TestFlight |',
    '| Default language / locale | English / en-NO |',
    '| Facilitator | SV / research facilitator |',
    `| Evidence folder or release-record link | ${evidenceRootRecord} |`,
    '',
    '## Session identity and evidence log',
    '',
    '| ID | Timestamp (ISO 8601 with offset) | Device and OS | App version (build) | Commit | Facilitator | Evidence / defect reference |',
    '|---|---|---|---|---|---|---|',
    ...rows.map((row, index) => {
      const minute = String(index).padStart(2, '0');
      return `| ${row[0]} | 2026-08-07T10:${minute}:00+02:00 | iPhone 15 / iOS 26 | ${build} | ${commit} | SV | sessions/${row[0]}.log |`;
    }),
    '',
    '## Result table',
    '',
    '| ID | Map | Seconds | Loft | Help | Truth | Result | First hesitation / comprehension / next destination |',
    '|---|---|---:|---|---|---|---|---|',
    ...rows.map(row => `| ${row.join(' | ')} |`),
    '',
    '## Calculation and verdict',
    '',
    '| Summary field | Recorded result |',
    '|---|---|',
    `| Valid sessions | ${calculated.valid} |`,
    `| Unassisted completions | ${calculated.unassisted} |`,
    `| Sorted qualifying times | ${calculated.times} |`,
    `| Median qualifying time | ${calculated.median} |`,
    '| Most common first hesitation | None observed |',
    '| Most requested next destination | Outcome |',
    '| Unresolved launch-blocking defects | 0 |',
    `| Quantitative verdict | ${calculated.quantitative} |`,
    '| Final release-gate verdict | **PASS** |',
    '| Reviewer and review timestamp | RK / release reviewer — 2026-08-07T11:00:00+02:00 |',
    '',
  ].join('\n');
}

function githubRun(overrides = {}, workflowOverrides = {}) {
  return {
    run: {
      name: 'Flightglass v1 release gate',
      status: 'completed',
      conclusion: 'success',
      head_sha: CURRENT_COMMIT,
      html_url: RUN_URL,
      updated_at: '2026-08-07T07:15:00Z',
      repository: { full_name: 'Fenral/svingbue' },
      workflow_id: 123456,
      ...overrides,
    },
    workflow: {
      id: 123456,
      name: 'Flightglass v1 release gate',
      path: '.github/workflows/v1-release-gate.yml',
      state: 'active',
      ...workflowOverrides,
    },
  };
}

function createEvidenceWorkspace(markdown = completedEvidence()) {
  const directory = mkdtempSync(join(tmpdir(), 'flightglass-onboarding-evidence-'));
  const sessions = join(directory, 'sessions');
  mkdirSync(sessions);
  for (let index = 1; index <= 10; index += 1) {
    const id = `P${String(index).padStart(2, '0')}`;
    writeFileSync(join(sessions, `${id}.log`), `${id} moderated session evidence; no defect observed.\n`, 'utf8');
  }
  const file = join(directory, 'onboarding-uat.md');
  writeFileSync(file, markdown, 'utf8');
  return { directory, file };
}

function canonicalOriginRepository() {
  return 'Fenral/svingbue';
}

function context(workspace, overrides = {}) {
  return {
    cwd: REPO_ROOT,
    evidenceRoot: workspace.directory,
    evidenceFile: workspace.file,
    githubRun: githubRun(),
    originRepositoryLookup: canonicalOriginRepository,
    now: NOW,
    ...overrides,
  };
}

function expectEvidenceError(fn, kind, pattern) {
  assert.throws(fn, error => {
    assert.ok(error instanceof EvidenceError);
    assert.equal(error.kind, kind);
    assert.match(error.message, pattern);
    return true;
  });
}

function replaceOnce(markdown, from, to) {
  assert.equal(markdown.includes(from), true, `Fixture does not contain: ${from}`);
  return markdown.replace(from, to);
}

function hideSectionTable(markdown, heading, opening, closing) {
  const headingStart = markdown.indexOf(heading);
  assert.notEqual(headingStart, -1, `Fixture does not contain heading: ${heading}`);
  const tableStart = markdown.indexOf('|', headingStart);
  const nextHeading = markdown.indexOf('\n## ', tableStart);
  assert.notEqual(tableStart, -1, `Fixture does not contain a table after: ${heading}`);
  assert.notEqual(nextHeading, -1, `Fixture does not contain a later H2 after: ${heading}`);
  return `${markdown.slice(0, tableStart)}${opening}\n${markdown.slice(tableStart, nextHeading)}\n${closing}${markdown.slice(nextHeading)}`;
}

function withWorkspace(markdown, callback) {
  const workspace = createEvidenceWorkspace(markdown);
  try {
    return callback(workspace);
  } finally {
    rmSync(workspace.directory, { recursive: true, force: true });
  }
}

test('accepts an exact-candidate, reviewed onboarding record', () => {
  withWorkspace(completedEvidence(), (workspace) => {
    const result = evaluateEvidence(completedEvidence(), context(workspace));
    assert.equal(result.candidateCommit, CURRENT_COMMIT);
    assert.equal(result.candidateBuild, BUILD);
    assert.equal(result.validSessions, 10);
    assert.equal(result.unassistedCompletions, 10);
    assert.equal(result.medianSeconds, 64.5);
    assert.equal(result.finalReleaseVerdict, 'PASS');
    assert.equal(result.artifacts.length, 10);
  });
});

test('allows exactly eight unassisted passes and derives their median only', () => {
  const rows = [
    ...Array.from({ length: 8 }, (_, index) => passingRow(index + 1, 70 + index)),
    failedRow(9),
    failedRow(10, '175'),
  ];
  const markdown = completedEvidence({ rows });
  withWorkspace(markdown, (workspace) => {
    const result = evaluateEvidence(markdown, context(workspace));
    assert.equal(result.unassistedCompletions, 8);
    assert.deepEqual(result.qualifyingTimes, [70, 71, 72, 73, 74, 75, 76, 77]);
    assert.equal(result.medianSeconds, 73.5);
  });
});

test('CLI requires explicit full HEAD, build, file, and evidence root arguments', () => {
  for (const [argv, pattern] of [
    [['node', 'script'], /--candidate/],
    [['node', 'script', '--candidate', CURRENT_COMMIT], /--build/],
    [['node', 'script', '--candidate', CURRENT_COMMIT, '--build', BUILD], /--file/],
    [['node', 'script', '--candidate', CURRENT_COMMIT, '--build', BUILD, '--file', 'copy.md'], /--evidence-root/],
    [['node', 'script', '--candidate', CURRENT_COMMIT.slice(0, 12), '--build', BUILD, '--file', 'copy.md', '--evidence-root', 'evidence'], /full 40-character/],
    [['node', 'script', '--candidate', CURRENT_COMMIT, '--build', PACKAGE_VERSION, '--file', 'copy.md', '--evidence-root', 'evidence'], /numeric build/],
  ]) expectEvidenceError(() => parseCliArguments(argv), 'invalid', pattern);
});

test('CLI rejects duplicate and unknown arguments', () => {
  expectEvidenceError(
    () => parseCliArguments(['node', 'script', '--candidate', CURRENT_COMMIT, '--candidate', CURRENT_COMMIT, '--build', BUILD, '--file', 'x', '--evidence-root', 'y']),
    'invalid',
    /only be provided once/,
  );
  expectEvidenceError(
    () => parseCliArguments(['node', 'script', '--bogus', 'x']),
    'invalid',
    /Unknown argument/,
  );
});

test('candidate package version is read from the exact commit, not the mutable worktree', () => {
  assert.equal(packageVersionAtCommit(REPO_ROOT, CURRENT_COMMIT), PACKAGE_VERSION);
  expectEvidenceError(
    () => packageVersionAtCommit(REPO_ROOT, '0'.repeat(40)),
    'invalid',
    /candidate commit/,
  );
});

test('CLI verifies injected GitHub API data and writes a checked SHA-256 attestation', () => {
  const workspace = createEvidenceWorkspace();
  const outputRoot = mkdtempSync(join(tmpdir(), 'flightglass-attestation-'));
  const output = [];
  let lookupInput;
  try {
    const code = runCli({
      argv: ['node', 'script', '--candidate', CURRENT_COMMIT, '--build', BUILD, '--file', workspace.file, '--evidence-root', workspace.directory],
      cwd: REPO_ROOT,
      stdout: value => output.push(value),
      stderr: value => assert.fail(value),
      githubRunLookup: releaseRun => {
        lookupInput = releaseRun;
        return githubRun();
      },
      sourceTreeStatus: () => [],
      originRepositoryLookup: canonicalOriginRepository,
      now: NOW,
      outputRoot,
    });
    assert.equal(code, 0);
    assert.equal(lookupInput.runId, '31221030000');
    const directory = join(outputRoot, 'release-evidence', 'onboarding');
    const files = readdirSync(directory);
    assert.equal(files.filter(file => file.endsWith('.json')).length, 1);
    assert.equal(files.filter(file => file.endsWith('.sha256')).length, 1);
    const jsonName = files.find(file => file.endsWith('.json'));
    const json = readFileSync(join(directory, jsonName));
    const checksum = readFileSync(join(directory, files.find(file => file.endsWith('.sha256'))), 'utf8').split(/\s+/)[0];
    assert.equal(checksum, crypto.createHash('sha256').update(json).digest('hex'));
    const attestation = JSON.parse(json);
    assert.equal(attestation.algorithm, 'SHA-256');
    assert.equal(attestation.candidate.commit, CURRENT_COMMIT);
    assert.equal(attestation.releaseGate.workflow, 'Flightglass v1 release gate');
    assert.equal(attestation.releaseGate.workflowId, 123456);
    assert.equal(attestation.releaseGate.workflowPath, '.github/workflows/v1-release-gate.yml');
    assert.equal(attestation.artifacts.length, 10);
    assert.match(output.join('\n'), /Onboarding release-evidence verdict: PASS/);
  } finally {
    rmSync(workspace.directory, { recursive: true, force: true });
    rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('CLI refuses the tracked template and records outside the evidence root', () => {
  const errors = [];
  assert.equal(runCli({
    argv: ['node', 'script', '--candidate', CURRENT_COMMIT, '--build', BUILD, '--file', 'docs/phase2-onboarding-uat.md', '--evidence-root', 'docs'],
    cwd: REPO_ROOT,
    stdout: () => {},
    stderr: value => errors.push(value),
    githubRunLookup: () => githubRun(),
    sourceTreeStatus: () => [],
    originRepositoryLookup: canonicalOriginRepository,
    now: NOW,
  }), 2);
  assert.match(errors.join('\n'), /tracked PENDING template is immutable/);

  const workspace = createEvidenceWorkspace();
  const otherRoot = mkdtempSync(join(tmpdir(), 'flightglass-other-root-'));
  try {
    const outsideErrors = [];
    assert.equal(runCli({
      argv: ['node', 'script', '--candidate', CURRENT_COMMIT, '--build', BUILD, '--file', workspace.file, '--evidence-root', otherRoot],
      cwd: REPO_ROOT,
      stdout: () => {},
      stderr: value => outsideErrors.push(value),
      githubRunLookup: () => githubRun(),
      sourceTreeStatus: () => [],
      originRepositoryLookup: canonicalOriginRepository,
      now: NOW,
    }), 2);
    assert.match(outsideErrors.join('\n'), /inside --evidence-root/);
  } finally {
    rmSync(workspace.directory, { recursive: true, force: true });
    rmSync(otherRoot, { recursive: true, force: true });
  }
});

test('CLI refuses a dirty source tree before querying GitHub', () => {
  const workspace = createEvidenceWorkspace();
  const errors = [];
  let queried = false;
  try {
    const code = runCli({
      argv: ['node', 'script', '--candidate', CURRENT_COMMIT, '--build', BUILD, '--file', workspace.file, '--evidence-root', workspace.directory],
      cwd: REPO_ROOT,
      stdout: () => {},
      stderr: value => errors.push(value),
      githubRunLookup: () => {
        queried = true;
        return githubRun();
      },
      sourceTreeStatus: () => [' M impact.html', '?? untracked-source.js'],
      originRepositoryLookup: canonicalOriginRepository,
      now: NOW,
    });
    assert.equal(code, 2);
    assert.equal(queried, false);
    assert.match(errors.join('\n'), /source tree must be clean.*impact\.html/);
  } finally {
    rmSync(workspace.directory, { recursive: true, force: true });
  }
});

test('source-tree inspection excludes ignored evidence but reports changed source', () => {
  const root = mkdtempSync(join(tmpdir(), 'flightglass-clean-tree-'));
  try {
    execFileSync('git', ['init', '--quiet'], { cwd: root });
    execFileSync('git', ['config', 'user.email', 'release-test@example.invalid'], { cwd: root });
    execFileSync('git', ['config', 'user.name', 'Release Test'], { cwd: root });
    writeFileSync(join(root, '.gitignore'), 'outputs/\n', 'utf8');
    writeFileSync(join(root, 'app.txt'), 'committed\n', 'utf8');
    execFileSync('git', ['add', '.gitignore', 'app.txt'], { cwd: root });
    execFileSync('git', ['commit', '--quiet', '-m', 'fixture'], { cwd: root });
    mkdirSync(join(root, 'outputs', 'evidence'), { recursive: true });
    writeFileSync(join(root, 'outputs', 'evidence', 'P01.log'), 'ignored evidence\n', 'utf8');
    assert.deepEqual(listDirtySourceEntries(root), []);
    writeFileSync(join(root, 'app.txt'), 'changed\n', 'utf8');
    assert.deepEqual(listDirtySourceEntries(root), [' M app.txt']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('requires candidate and every participant to use the full checked-out HEAD SHA', () => {
  for (const [markdown, pattern] of [
    [completedEvidence({ commit: CURRENT_COMMIT.slice(0, 12) }), /full 40-character/],
    [completedEvidence({ commit: PREVIOUS_COMMIT }), /checked-out HEAD/],
    [replaceOnce(completedEvidence(), `| P05 | 2026-08-07T10:04:00+02:00 | iPhone 15 / iOS 26 | ${BUILD} | ${CURRENT_COMMIT} |`, `| P05 | 2026-08-07T10:04:00+02:00 | iPhone 15 / iOS 26 | ${BUILD} | ${CURRENT_COMMIT.slice(0, 12)} |`), /P05 commit/],
  ]) {
    withWorkspace(markdown, workspace => expectEvidenceError(
      () => validateEvidenceMetadata(markdown, context(workspace)),
      'invalid',
      pattern,
    ));
  }
});

test('requires package version plus a positive numeric build everywhere', () => {
  for (const badBuild of ['2.0.0 (42)', `${PACKAGE_VERSION} (0)`, `${PACKAGE_VERSION} (01)`, PACKAGE_VERSION]) {
    const markdown = completedEvidence({ build: badBuild });
    withWorkspace(markdown, workspace => expectEvidenceError(
      () => validateEvidenceMetadata(markdown, context(workspace)),
      'invalid',
      /package version|positive numeric build/,
    ));
  }
  const mismatch = replaceOnce(completedEvidence(), `| P03 | 2026-08-07T10:02:00+02:00 | iPhone 15 / iOS 26 | ${BUILD} |`, `| P03 | 2026-08-07T10:02:00+02:00 | iPhone 15 / iOS 26 | ${PACKAGE_VERSION} (43) |`);
  withWorkspace(mismatch, workspace => expectEvidenceError(
    () => validateEvidenceMetadata(mismatch, context(workspace)),
    'invalid',
    /P03 build/,
  ));
});

test('binds the run URL and API record to the exact origin repository', () => {
  const wrongUrl = completedEvidence({ runUrl: 'https://github.com/Fenral/other/actions/runs/31221030000' });
  withWorkspace(wrongUrl, workspace => expectEvidenceError(
    () => validateEvidenceMetadata(wrongUrl, context(workspace)),
    'invalid',
    /exact origin repository/,
  ));

  withWorkspace(completedEvidence(), workspace => expectEvidenceError(
    () => evaluateEvidence(completedEvidence(), context(workspace, {
      githubRun: githubRun({ repository: { full_name: 'Fenral/other' } }),
    })),
    'invalid',
    /exact origin repository/,
  ));
});

test('requires the exact workflow, completed/success, exact head_sha, and exact run identity', async (t) => {
  const cases = [
    ['workflow name', { name: 'Other workflow' }, {}, /workflow "Flightglass v1 release gate"/],
    ['completed status', { status: 'in_progress', conclusion: null }, {}, /completed with conclusion success/],
    ['successful conclusion', { conclusion: 'failure' }, {}, /completed with conclusion success/],
    ['workflow id', { workflow_id: 654321 }, {}, /workflow_id.*active workflow path/],
    ['workflow path', {}, { path: '.github/workflows/other.yml' }, /workflow_id.*active workflow path/],
    ['head sha', { head_sha: PREVIOUS_COMMIT }, {}, /head_sha/],
    ['run URL', { html_url: 'https://github.com/Fenral/svingbue/actions/runs/99' }, {}, /match the recorded/],
    ['completion order', { updated_at: '2026-08-07T08:00:00Z' }, {}, /before moderated sessions/],
  ];
  for (const [name, overrides, workflowOverrides, pattern] of cases) {
    await t.test(name, () => withWorkspace(completedEvidence(), workspace => expectEvidenceError(
      () => evaluateEvidence(completedEvidence(), context(workspace, { githubRun: githubRun(overrides, workflowOverrides) })),
      overrides.status === 'in_progress' || overrides.conclusion === 'failure' ? 'incomplete' : 'invalid',
      pattern,
    )));
  }
});

test('requires a single top-level PASS status and canonical release rules', () => {
  for (const [markdown, kind, pattern] of [
    [completedEvidence({ status: '**PENDING**' }), 'incomplete', /Top-level Status/],
    [`${completedEvidence()}\nStatus: PASS\n`, 'invalid', /exactly one/],
    [replaceOnce(completedEvidence(), 'at least 8 of 10 reach the product map without help;', 'at least 7 of 10 reach the product map without help;'), 'invalid', /canonical requirement/],
    [replaceOnce(completedEvidence(), '`Truth = PASS` in the result table.', '`Truth = FAIL` in the result table.'), 'invalid', /canonical requirement/],
  ]) withWorkspace(markdown, workspace => expectEvidenceError(
    () => validateEvidenceMetadata(markdown, context(workspace)),
    kind,
    pattern,
  ));
});

test('enforces exact candidate, session, result, and summary keys without duplicates', async (t) => {
  const fixtures = [
    ['candidate duplicate', replaceOnce(completedEvidence(), '| Facilitator | SV / research facilitator |', '| Facilitator | SV / research facilitator |\n| Facilitator | RK |'), /Candidate record.*duplicates: Facilitator/],
    ['session unexpected', replaceOnce(completedEvidence(), '| P10 | 2026-08-07T10:09:00+02:00', '| P99 | 2026-08-07T10:09:00+02:00'), /Session identity.*Missing: P10.*unexpected: P99/],
    ['result duplicate', replaceOnce(completedEvidence(), '| P10 | Y | 69 |', '| P09 | Y | 69 |'), /Result table.*duplicates: P09/],
    ['summary duplicate', replaceOnce(completedEvidence(), '| Quantitative verdict | PASS |', '| Quantitative verdict | PASS |\n| Quantitative verdict | PASS |'), /Calculation and verdict.*duplicates/],
  ];
  for (const [name, markdown, pattern] of fixtures) {
    await t.test(name, () => withWorkspace(markdown, workspace => expectEvidenceError(
      () => evaluateEvidence(markdown, context(workspace)),
      'invalid',
      pattern,
    )));
  }
});

test('rejects every mismatched calculated summary value', async (t) => {
  const replacements = [
    ['valid sessions', '| Valid sessions | 10 / 10 |', '| Valid sessions | 9 / 10 |', /Valid sessions/],
    ['unassisted', '| Unassisted completions | 10 / 10 |', '| Unassisted completions | 9 / 10 |', /Unassisted completions/],
    ['sorted times', '| Sorted qualifying times | 60, 61, 62, 63, 64, 65, 66, 67, 68, 69 |', '| Sorted qualifying times | 60, 61 |', /Sorted qualifying times/],
    ['median', '| Median qualifying time | 64.5 seconds |', '| Median qualifying time | 65 seconds |', /Median qualifying time/],
    ['quantitative verdict', '| Quantitative verdict | PASS |', '| Quantitative verdict | FAIL |', /Quantitative verdict/],
  ];
  for (const [name, from, to, pattern] of replacements) {
    await t.test(name, () => {
      const markdown = replaceOnce(completedEvidence(), from, to);
      return withWorkspace(markdown, workspace => expectEvidenceError(
        () => evaluateEvidence(markdown, context(workspace)),
        'invalid',
        pattern,
      ));
    });
  }
});

test('requires zero blockers, final PASS, and a coherent reviewer signoff', async (t) => {
  const cases = [
    ['blocker', '| Unresolved launch-blocking defects | 0 |', '| Unresolved launch-blocking defects | 1 |', 'incomplete', /must be 0/],
    ['final verdict', '| Final release-gate verdict | **PASS** |', '| Final release-gate verdict | FAIL |', 'incomplete', /must be PASS/],
    ['missing reviewer', '| Reviewer and review timestamp | RK / release reviewer — 2026-08-07T11:00:00+02:00 |', '| Reviewer and review timestamp | 2026-08-07T11:00:00+02:00 |', 'invalid', /reviewer initials/],
    ['early review', '2026-08-07T11:00:00+02:00', '2026-08-07T09:59:00+02:00', 'invalid', /cannot precede/],
  ];
  for (const [name, from, to, kind, pattern] of cases) {
    await t.test(name, () => {
      const markdown = replaceOnce(completedEvidence(), from, to);
      return withWorkspace(markdown, workspace => expectEvidenceError(
        () => evaluateEvidence(markdown, context(workspace)),
        kind,
        pattern,
      ));
    });
  }
});

test('rejects future, duplicate, and out-of-range session timestamps', async (t) => {
  const cases = [
    ['future study', completedEvidence({ studyRange: '2026-08-09T09:30:00+02:00 — 2026-08-09T12:00:00+02:00' }), /future/],
    ['reversed study', completedEvidence({ studyRange: '2026-08-07T12:00:00+02:00 — 2026-08-07T09:30:00+02:00' }), /ends before/],
    ['outside study', completedEvidence({ studyRange: '2026-08-07T10:02:00+02:00 — 2026-08-07T12:00:00+02:00' }), /inside the recorded study range/],
    ['duplicate timestamp', replaceOnce(completedEvidence(), '2026-08-07T10:01:00+02:00', '2026-08-07T10:00:00+02:00'), /unique timestamp/],
    ['future reviewer', replaceOnce(completedEvidence(), '2026-08-07T11:00:00+02:00', '2026-08-09T11:00:00+02:00'), /cannot be in the future/],
  ];
  for (const [name, markdown, pattern] of cases) {
    await t.test(name, () => withWorkspace(markdown, workspace => expectEvidenceError(
      () => evaluateEvidence(markdown, context(workspace)),
      'invalid',
      pattern,
    )));
  }
});

test('requires unique evidence references and accepts safe public HTTPS locators', () => {
  const duplicate = replaceOnce(completedEvidence(), 'sessions/P02.log', 'sessions/P01.log');
  withWorkspace(duplicate, workspace => expectEvidenceError(
    () => evaluateEvidence(duplicate, context(workspace)),
    'invalid',
    /unique evidence reference/,
  ));

  const remote = replaceOnce(completedEvidence(), 'sessions/P01.log', 'https://example.com/evidence/P01');
  withWorkspace(remote, (workspace) => {
    const result = evaluateEvidence(remote, context(workspace));
    assert.equal(result.artifacts[0].type, 'https');
    assert.equal(result.artifacts[0].sha256, null);
  });
});

test('recursively hashes every artifact linked from a Markdown evidence index', () => {
  const markdown = replaceOnce(completedEvidence(), 'sessions/P01.log', 'sessions/P01-index.md');
  const workspace = createEvidenceWorkspace(markdown);
  const nested = join(workspace.directory, 'sessions', 'nested');
  mkdirSync(nested);
  writeFileSync(
    join(workspace.directory, 'sessions', 'P01-index.md'),
    '# Session P01 evidence\n\n![Frame](nested/frame.bin)\n\n[Notes](nested/details.log)\n',
    'utf8',
  );
  writeFileSync(join(nested, 'frame.bin'), Buffer.from([1, 2, 3, 4]));
  writeFileSync(join(nested, 'details.log'), 'Observed map without help.\n', 'utf8');
  try {
    const result = evaluateEvidence(markdown, context(workspace));
    const references = result.artifacts.map(artifact => artifact.reference);
    assert.equal(result.artifacts.length, 12);
    assert.ok(references.includes('sessions/P01-index.md'));
    assert.ok(references.includes('sessions/nested/frame.bin'));
    assert.ok(references.includes('sessions/nested/details.log'));
    assert.ok(result.artifacts.every(artifact => artifact.type !== 'file' || /^[0-9a-f]{64}$/.test(artifact.sha256)));
  } finally {
    rmSync(workspace.directory, { recursive: true, force: true });
  }
});

test('rejects evidence-record and attestation self-references', async (t) => {
  const cases = [
    ['evidence record', 'onboarding-uat.md', /cannot reference the evidence record/],
    ['attestation', 'candidate.attestation.json', /cannot reference.*attestation/],
    ['checksum', 'candidate.sha256', /cannot reference.*checksum/],
  ];
  for (const [name, reference, pattern] of cases) {
    await t.test(name, () => {
      const markdown = replaceOnce(completedEvidence(), 'sessions/P01.log', reference);
      const workspace = createEvidenceWorkspace(markdown);
      if (reference !== 'onboarding-uat.md') {
        writeFileSync(join(workspace.directory, reference), '{}\n', 'utf8');
      }
      try {
        expectEvidenceError(
          () => evaluateEvidence(markdown, context(workspace)),
          'invalid',
          pattern,
        );
      } finally {
        rmSync(workspace.directory, { recursive: true, force: true });
      }
    });
  }
});

test('rejects missing, escaping, and unsafe evidence references', async (t) => {
  const cases = [
    ['missing file', 'sessions/P01.log', 'sessions/missing.log', 'invalid', /does not exist/],
    ['path traversal', 'sessions/P01.log', '../outside.log', 'invalid', /escapes --evidence-root/],
    ['plain HTTP', 'sessions/P01.log', 'http://example.com/evidence/P01', 'invalid', /public HTTPS/],
    ['credentialed URL', 'sessions/P01.log', 'https://user:secret@example.com/evidence/P01', 'sensitive', /email address|sensitive URL|account, receipt|key value/],
    ['query secret', 'sessions/P01.log', 'https://example.com/evidence/P01?token=secret', 'invalid', /without query/],
    ['private host', 'sessions/P01.log', 'https://127.0.0.1/evidence/P01', 'invalid', /public HTTPS/],
  ];
  for (const [name, from, to, kind, pattern] of cases) {
    await t.test(name, () => {
      const markdown = replaceOnce(completedEvidence(), from, to);
      return withWorkspace(markdown, workspace => expectEvidenceError(
        () => evaluateEvidence(markdown, context(workspace)),
        kind,
        pattern,
      ));
    });
  }
});

test('scans the entire Markdown record for sensitive material', async (t) => {
  const cases = [
    ['email', 'Outcome |', 'tester@example.com |', /email address/],
    ['SDK key', 'Outcome |', 'appl_abcdefghijk12345 |', /SDK or API key/],
    ['transaction', 'Outcome |', 'transaction ID: 100000123456789 |', /transaction, order/],
    ['receipt', 'Outcome |', 'receipt: AbCdEfGhIjKlMnOpQrStUvWxYz0123456789 |', /sensitive account/],
  ];
  for (const [name, from, to, pattern] of cases) {
    await t.test(name, () => {
      const markdown = replaceOnce(completedEvidence(), from, to);
      return withWorkspace(markdown, workspace => expectEvidenceError(
        () => evaluateEvidence(markdown, context(workspace)),
        'sensitive',
        pattern,
      ));
    });
  }
});

test('rejects encoded email addresses in the whole Markdown record', async (t) => {
  const cases = [
    ['HTML numeric entity', 'name&#64;example.com'],
    ['percent encoding', 'name%40example.com'],
    ['email delimiter next to malformed UTF-8', 'name%FF%40example.com'],
    ['JSON unicode escape', String.raw`{"tester":"name\u0040example.com"}`],
    ['nested JSON unicode escape', String.raw`{"tester":"name\\u0040example.com"}`],
    ['mixed percent and HTML layers', 'name%26%2364%3Bexample.com'],
  ];
  for (const [name, probe] of cases) {
    await t.test(name, () => {
      const markdown = replaceOnce(completedEvidence(), 'Outcome |', `${probe} |`);
      return withWorkspace(markdown, workspace => expectEvidenceError(
        () => evaluateEvidence(markdown, context(workspace)),
        'sensitive',
        /email address/,
      ));
    });
  }
});

test('rejects encoded sensitive values in recursively linked JSON evidence', () => {
  const markdown = replaceOnce(completedEvidence(), 'sessions/P04.log', 'sessions/P04-index.md');
  const workspace = createEvidenceWorkspace(markdown);
  const nested = join(workspace.directory, 'sessions', 'nested');
  mkdirSync(nested);
  writeFileSync(
    join(workspace.directory, 'sessions', 'P04-index.md'),
    '# P04 evidence\n\n[Structured notes](nested/P04.json)\n',
    'utf8',
  );
  writeFileSync(
    join(nested, 'P04.json'),
    String.raw`{"tester":"name\\u0040example.com"}`,
    'utf8',
  );
  try {
    expectEvidenceError(
      () => evaluateEvidence(markdown, context(workspace)),
      'sensitive',
      /linked artifact.*P04\.json.*contents.*email address/,
    );
  } finally {
    rmSync(workspace.directory, { recursive: true, force: true });
  }
});

test('handles malformed encodings safely and fails closed on excessive depth', async (t) => {
  await t.test('malformed JSON and encodings do not crash the scan', () => {
    const markdown = replaceOnce(completedEvidence(), 'sessions/P04.log', 'sessions/P04.json');
    const workspace = createEvidenceWorkspace(markdown);
    writeFileSync(
      join(workspace.directory, 'sessions', 'P04.json'),
      String.raw`{"note":"name%4Zexample and &#xZZ; and \\u0ZZZ"`,
      'utf8',
    );
    try {
      const result = evaluateEvidence(markdown, context(workspace));
      assert.equal(result.finalReleaseVerdict, 'PASS');
    } finally {
      rmSync(workspace.directory, { recursive: true, force: true });
    }
  });

  await t.test('deep JSON is rejected instead of partially scanned', () => {
    const markdown = replaceOnce(completedEvidence(), 'sessions/P04.log', 'sessions/P04.json');
    const workspace = createEvidenceWorkspace(markdown);
    let deeplyNested = { note: 'non-identifying evidence' };
    for (let depth = 0; depth < 70; depth += 1) deeplyNested = { child: deeplyNested };
    writeFileSync(
      join(workspace.directory, 'sessions', 'P04.json'),
      JSON.stringify(deeplyNested),
      'utf8',
    );
    try {
      expectEvidenceError(
        () => evaluateEvidence(markdown, context(workspace)),
        'invalid',
        /safe sensitive-data scan depth/,
      );
    } finally {
      rmSync(workspace.directory, { recursive: true, force: true });
    }
  });

  await t.test('more than four encoding layers are rejected', () => {
    let encodedAt = '%40';
    for (let layer = 0; layer < 5; layer += 1) encodedAt = encodedAt.replaceAll('%', '%25');
    const markdown = replaceOnce(completedEvidence(), 'Outcome |', `name${encodedAt}example.com |`);
    return withWorkspace(markdown, workspace => expectEvidenceError(
      () => evaluateEvidence(markdown, context(workspace)),
      'invalid',
      /encoding exceeds the safe sensitive-data scan depth/,
    ));
  });
});

test('scans referenced text and log evidence for sensitive material', () => {
  const workspace = createEvidenceWorkspace();
  try {
    writeFileSync(join(workspace.directory, 'sessions', 'P04.log'), 'tester@example.com\n', 'utf8');
    expectEvidenceError(
      () => evaluateEvidence(completedEvidence(), context(workspace)),
      'sensitive',
      /P04 Evidence.*contents.*email address/,
    );
  } finally {
    rmSync(workspace.directory, { recursive: true, force: true });
  }
});

test('requires one exact canonical H1 and one of every required H2', async (t) => {
  const duplicateHeadings = [
    ['H1', '# Phase 2 moderated onboarding release gate', /canonical H1/],
    ['Release rule', '## Release rule', /canonical H2.*Release rule/],
    ['Candidate record', '## Candidate record — duplicate', /canonical H2.*Candidate record/],
    ['Session identity', '## Session identity and evidence log', /canonical H2.*Session identity/],
    ['Result table', '## Result table', /canonical H2.*Result table/],
    ['Calculation', '## Calculation and verdict', /canonical H2.*Calculation/],
  ];
  for (const [name, heading, pattern] of duplicateHeadings) {
    await t.test(`rejects appended duplicate ${name}`, () => {
      const markdown = `${completedEvidence()}\n${heading}\n`;
      return withWorkspace(markdown, workspace => expectEvidenceError(
        () => evaluateEvidence(markdown, context(workspace)),
        'invalid',
        pattern,
      ));
    });
  }

  await t.test('rejects a renamed H1', () => {
    const markdown = replaceOnce(
      completedEvidence(),
      '# Phase 2 moderated onboarding release gate',
      '# Onboarding evidence',
    );
    return withWorkspace(markdown, workspace => expectEvidenceError(
      () => evaluateEvidence(markdown, context(workspace)),
      'invalid',
      /canonical H1/,
    ));
  });

  await t.test('ignores heading-like text inside fenced code before canonical sections', () => {
    const markdown = `\`\`\`text\n# Other title\n## Result table\n| fake | table |\n\`\`\`\n${completedEvidence()}`;
    return withWorkspace(markdown, (workspace) => {
      const result = evaluateEvidence(markdown, context(workspace));
      assert.equal(result.finalReleaseVerdict, 'PASS');
    });
  });
});

test('ignores complete records, statuses, and required tables in non-rendered Markdown', async (t) => {
  const record = completedEvidence();
  const hiddenRecords = [
    ['fenced record', `\`\`\`markdown\n${record}\n\`\`\`\n`],
    ['HTML-commented record', `<!--\n${record}\n-->\n`],
  ];
  for (const [name, markdown] of hiddenRecords) {
    await t.test(name, () => withWorkspace(markdown, workspace => expectEvidenceError(
      () => evaluateEvidence(markdown, context(workspace)),
      'invalid',
      /canonical H1/,
    )));
  }

  const passStatus = /^Status:.*$/m.exec(record)?.[0];
  assert.ok(passStatus, 'Fixture must contain a top-level Status record.');
  const hiddenStatuses = [
    ['fenced status', replaceOnce(record, passStatus, `\`\`\`text\n${passStatus}\n\`\`\``)],
    ['HTML-commented status', replaceOnce(record, passStatus, `<!-- ${passStatus} -->`)],
  ];
  for (const [name, markdown] of hiddenStatuses) {
    await t.test(name, () => withWorkspace(markdown, workspace => expectEvidenceError(
      () => evaluateEvidence(markdown, context(workspace)),
      'invalid',
      /exactly one top-level Status/,
    )));
  }

  const hiddenTables = [
    [
      'fenced candidate table',
      hideSectionTable(record, '## Candidate record', '```text', '```'),
      /Candidate record.*missing its Markdown table/,
    ],
    [
      'HTML-commented result table',
      hideSectionTable(record, '## Result table', '<!--', '-->'),
      /Result table.*missing its Markdown table/,
    ],
  ];
  for (const [name, markdown, pattern] of hiddenTables) {
    await t.test(name, () => withWorkspace(markdown, workspace => expectEvidenceError(
      () => evaluateEvidence(markdown, context(workspace)),
      'invalid',
      pattern,
    )));
  }
});

test('Map = Y must finish in 1-180 seconds', async (t) => {
  for (const seconds of ['0', '181', '180+', '-1']) {
    await t.test(seconds, () => {
      const markdown = replaceOnce(
        completedEvidence(),
        '| P01 | Y | 60 | Y | N | PASS | PASS |',
        `| P01 | Y | ${seconds} | Y | N | PASS | PASS |`,
      );
      expectEvidenceError(
        () => summarizeEvidence(parseEvidence(markdown)),
        'invalid',
        /P01 Seconds must be a whole number from 1 through 180/,
      );
    });
  }
});

test('rejects a manually falsified participant Result', () => {
  const markdown = replaceOnce(
    completedEvidence(),
    '| P05 | Y | 64 | Y | N | PASS | PASS |',
    '| P05 | Y | 64 | Y | N | PASS | FAIL |',
  );
  expectEvidenceError(
    () => summarizeEvidence(parseEvidence(markdown)),
    'invalid',
    /P05 Result is FAIL.*derive PASS/,
  );
});

test('rejects placeholders in candidate, session, result notes, and qualitative summary', async (t) => {
  const fixtures = [
    ['candidate', replaceOnce(completedEvidence(), '| Facilitator | SV / research facilitator |', '| Facilitator | PENDING |'), /Candidate field "Facilitator"/],
    ['session', replaceOnce(completedEvidence(), '| iPhone 15 / iOS 26 |', '| TBD |'), /P01 device/],
    ['notes', replaceOnce(completedEvidence(), 'Hesitation 3; Outcome', 'PENDING'), /P03 notes/],
    ['qualitative summary', replaceOnce(completedEvidence(), '| Most requested next destination | Outcome |', '| Most requested next destination | PENDING |'), /Most requested next destination/],
  ];
  for (const [name, markdown, pattern] of fixtures) {
    await t.test(name, () => withWorkspace(markdown, workspace => expectEvidenceError(
      () => evaluateEvidence(markdown, context(workspace)),
      'incomplete',
      pattern,
    )));
  }
});

test('the repository document remains an immutable PENDING template', () => {
  const templatePath = join(REPO_ROOT, 'docs', 'phase2-onboarding-uat.md');
  assert.equal(existsSync(templatePath), true);
  const template = readFileSync(templatePath, 'utf8');
  assert.match(template, /^Status: \*\*PENDING/m);
  assert.doesNotMatch(template, /^Status: \*\*PASS/m);
  assert.equal(validatePendingTemplate(REPO_ROOT), true);

  const root = mkdtempSync(join(tmpdir(), 'flightglass-template-lock-'));
  mkdirSync(join(root, 'docs'));
  writeFileSync(
    join(root, 'docs', 'phase2-onboarding-uat.md'),
    replaceOnce(template, '| P07 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |', '| P07 | PENDING | iPhone | PENDING | PENDING | PENDING | PENDING |'),
    'utf8',
  );
  try {
    expectEvidenceError(
      () => validatePendingTemplate(root),
      'invalid',
      /immutable template cell P07 must remain PENDING/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('median handles odd, even, and empty qualifying sets', () => {
  assert.equal(median([9, 1, 5]), 5);
  assert.equal(median([4, 2, 8, 6]), 5);
  assert.equal(median([]), null);
});
