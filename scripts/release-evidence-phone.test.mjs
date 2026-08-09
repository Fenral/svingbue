import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  CANONICAL_PRECONDITIONS,
  CANONICAL_SMOKE_REQUIREMENTS,
  EvidenceError,
  attestationFileName,
  evaluatePhoneEvidence,
  maskHiddenMarkdown,
  parseCliArguments,
  runCli,
} from './release-evidence-phone.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CURRENT_COMMIT = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: REPO_ROOT,
  encoding: 'utf8',
}).trim();
const PARENT_COMMIT = execFileSync('git', ['rev-parse', 'HEAD^'], {
  cwd: REPO_ROOT,
  encoding: 'utf8',
}).trim();
const COMMIT_TIMESTAMP = execFileSync('git', ['show', '-s', '--format=%cI', 'HEAD'], {
  cwd: REPO_ROOT,
  encoding: 'utf8',
}).trim();
const PACKAGE_VERSION = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')).version;
const BUILD = `${PACKAGE_VERSION} (42)`;
const RUN_ID = '31221030000';
const RUN_URL = `https://github.com/Fenral/svingbue/actions/runs/${RUN_ID}`;
const MINUTE_MS = 60_000;
const COMMIT_TIME = Date.parse(COMMIT_TIMESTAMP);

function timestampAfterCommit(minutes) {
  return new Date(COMMIT_TIME + (minutes * MINUTE_MS)).toISOString().replace('.000Z', 'Z');
}

const AUTOMATED_COMPLETION_TIMESTAMP = timestampAfterCommit(5);
const PHYSICAL_TEST_START_TIMESTAMP = timestampAfterCommit(10);
const SMOKE_TIMESTAMPS = Array.from({ length: 12 }, (_, index) => timestampAfterCommit(11 + index));
const PURCHASE_TIMESTAMPS = Array.from({ length: 6 }, (_, index) => timestampAfterCommit(30 + index));
const REVIEWER_TIMESTAMP = timestampAfterCommit(40);
const FIXED_NOW = Date.parse(timestampAfterCommit(60));
const TEMP_BASE = mkdtempSync(join(tmpdir(), 'flightglass-phone-evidence-'));

after(() => rmSync(TEMP_BASE, { recursive: true, force: true }));

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function makeEvidenceRoot() {
  const root = mkdtempSync(join(TEMP_BASE, 'case-'));
  writeFileSync(join(root, 'record-index.md'), 'Flightglass physical-device evidence index.\n\n[Supplementary video](supplementary.mov)\n');
  writeFileSync(join(root, 'supplementary.mov'), 'supplementary-video-placeholder');
  for (let index = 1; index <= 9; index += 1) {
    writeFileSync(join(root, `precondition-${index}.log`), `Precondition ${index} verified.\n`);
  }
  for (let index = 1; index <= 12; index += 1) {
    writeFileSync(join(root, `smoke-${index}.png`), `binary-placeholder-${index}`);
  }
  for (const flow of [
    'Live Offering', 'Cancel', 'Error + recovery', 'Purchase',
    'Relaunch persistence', 'Clean-install restore',
  ]) {
    const name = slug(flow);
    writeFileSync(join(root, `${name}-device.png`), `device-placeholder-${name}`);
    writeFileSync(join(root, `${name}-store.log`), `${flow} corroborated without account identifiers.\n`);
  }
  return root;
}

function completedEvidence({
  commit = CURRENT_COMMIT,
  build = BUILD,
  runUrl = RUN_URL,
} = {}) {
  const candidateRows = [
    ['Test date/time and timezone', PHYSICAL_TEST_START_TIMESTAMP],
    ['Tester initials / role', 'RK / release reviewer'],
    ['Candidate commit SHA', commit],
    ['GitHub release-gate run URL', runUrl],
    ['App version and build number', build],
    ['Distribution source', 'TestFlight'],
    ['iPhone model', 'iPhone 15 Pro'],
    ['iOS version', '18.6'],
    ['Device language / region', 'Norwegian / Norway'],
    ['Display Zoom / text size', 'Standard / accessibility large'],
    ['Reduced Motion state(s) tested', 'Off and On'],
    ['Network(s) tested', 'Wi-Fi and offline recovery'],
    ['RevenueCat project / Offering identifier', 'Flightglass / current'],
    ['RevenueCat entitlement identifier', 'pro'],
    ['Storefront country', 'Norway'],
    ['Fresh subscription tester alias', 'SUB-A'],
    ['Lifetime buyer cohort status', 'NONE - owner confirmed 2026-08-09'],
    ['Evidence folder or release-record link', 'record-index.md'],
  ];
  const preconditions = CANONICAL_PRECONDITIONS.map((requirement, index) =>
    `| ${index + 1} | ${requirement} | PASS | precondition-${index + 1}.log |`);
  const smoke = CANONICAL_SMOKE_REQUIREMENTS.map((requirement, index) => {
    return `| ${index + 1} | ${requirement} | PASS | ${SMOKE_TIMESTAMPS[index]} | smoke-${index + 1}.png |`;
  });
  const purchaseRows = [
    ['Live Offering', 'SUB-A', 'Monthly + Annual visible; Lifetime hidden'],
    ['Cancel', 'SUB-A', 'Annual'],
    ['Error + recovery', 'SUB-A', 'Annual'],
    ['Purchase', 'SUB-A', 'Annual to pro'],
    ['Relaunch persistence', 'SUB-A', 'pro'],
    ['Clean-install restore', 'SUB-A', 'Current subscription to pro'],
  ].map(([flow, alias, plan], index) => {
    const name = slug(flow);
    return `| ${flow} | ${alias} | ${plan} | PASS | ${PURCHASE_TIMESTAMPS[index]} | ${name}-device.png | ${name}-store.log | Observed as expected |`;
  });

  return `# Flightglass v1 physical-iPhone release evidence

Status: **PASS - exact candidate evidence complete**

## Candidate and environment record — required before testing

| Field | Required value |
|---|---|
${candidateRows.map(([field, value]) => `| ${field} | ${value} |`).join('\n')}

## Preconditions — stop if any fail

| # | Precondition | Result | Evidence / note |
|---:|---|---|---|
${preconditions.join('\n')}

## Physical-iPhone core smoke

| # | Required action and success criterion | Result | Timestamp | Evidence / defect reference |
|---:|---|---|---|---|
${smoke.join('\n')}

## Purchase evidence record

| Flow | Tester alias | Plan / entitlement | Result | Timestamp | Device evidence | RevenueCat / App Store corroboration | Notes / issue |
|---|---|---|---|---|---|---|---|
${purchaseRows.join('\n')}

## Automated phone prerequisite

| Engine | 375x812 normal | 375x812 reduced | 430x932 normal | 430x932 reduced | Run URL / timestamp |
|---|---|---|---|---|---|
| Chromium | PASS | PASS | PASS | PASS | ${runUrl} - ${AUTOMATED_COMPLETION_TIMESTAMP} |
| WebKit | PASS | PASS | PASS | PASS | ${runUrl} - ${AUTOMATED_COMPLETION_TIMESTAMP} |

## Final handoff

| Summary field | Recorded result |
|---|---|
| Exact candidate identity verified | PASS |
| Required core-smoke rows passed | 12 / 12 |
| Required purchase/restore rows passed | 6 / 6 |
| Unresolved launch-blocking defects | 0 |
| Physical-iPhone gate verdict | PASS |
| Reviewer and review timestamp | RK - ${REVIEWER_TIMESTAMP} |
`;
}

function fixture(options) {
  const root = makeEvidenceRoot();
  const markdown = completedEvidence(options);
  const recordPath = join(root, 'phone-release-evidence.md');
  writeFileSync(recordPath, markdown);
  return { root, markdown, recordPath };
}

function replaceOnce(source, from, to) {
  assert.ok(source.includes(from), `fixture does not contain: ${from}`);
  return source.replace(from, to);
}

function hideFirstTableInSection(markdown, heading, style) {
  const sectionStart = markdown.indexOf(heading);
  assert.notEqual(sectionStart, -1, `fixture does not contain section: ${heading}`);
  const tableStart = markdown.indexOf('|', sectionStart);
  assert.notEqual(tableStart, -1, `fixture does not contain a table after: ${heading}`);
  const table = /^(?:\|[^\r\n]*(?:\r?\n|$))+/.exec(markdown.slice(tableStart))?.[0];
  assert.ok(table, `fixture table could not be extracted after: ${heading}`);
  const hidden = style === 'fence'
    ? `\`\`\`markdown\n${table}\`\`\`\n`
    : `<!--\n${table}-->\n`;
  return `${markdown.slice(0, tableStart)}${hidden}${markdown.slice(tableStart + table.length)}`;
}

function templateTableRows(markdown, heading) {
  const start = markdown.indexOf(heading);
  assert.notEqual(start, -1, `missing template heading ${heading}`);
  const remainder = markdown.slice(start + heading.length);
  const nextHeading = remainder.search(/\r?\n##\s/);
  const block = remainder.slice(0, nextHeading < 0 ? remainder.length : nextHeading);
  return block
    .split(/\r?\n/)
    .filter(line => /^\s*\|/.test(line))
    .slice(2)
    .map(line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim()));
}

function expectEvidenceError(callback, kind, pattern) {
  assert.throws(callback, error => {
    assert.ok(error instanceof EvidenceError);
    assert.equal(error.kind, kind);
    assert.match(error.message, pattern);
    return true;
  });
}

function evaluate(markdown, root, options = {}) {
  return evaluatePhoneEvidence(markdown, {
    cwd: REPO_ROOT,
    evidenceRoot: root,
    now: FIXED_NOW,
    ...options,
  });
}

function validGithubRun(overrides = {}) {
  return {
    id: Number(RUN_ID),
    name: 'Flightglass v1 release gate',
    status: 'completed',
    conclusion: 'success',
    head_sha: CURRENT_COMMIT,
    html_url: RUN_URL,
    updated_at: AUTOMATED_COMPLETION_TIMESTAMP,
    repository: { full_name: 'Fenral/svingbue' },
    workflow_id: 777,
    ...overrides,
  };
}

function validGithubWorkflow(overrides = {}) {
  return {
    id: 777,
    name: 'Flightglass v1 release gate',
    path: '.github/workflows/v1-release-gate.yml',
    state: 'active',
    ...overrides,
  };
}

function cliArgs({ candidate = CURRENT_COMMIT, build = BUILD, recordPath, root }) {
  return [
    'node', 'script',
    '--candidate', candidate,
    '--build', build,
    '--file', recordPath,
    '--evidence-root', root,
  ];
}

function runFixtureCli(fix, {
  candidate = CURRENT_COMMIT,
  build = BUILD,
  run = validGithubRun(),
  workflow = validGithubWorkflow(),
  origin = 'https://github.com/Fenral/svingbue.git',
} = {}) {
  const output = [];
  const errors = [];
  const code = runCli({
    argv: cliArgs({ candidate, build, recordPath: fix.recordPath, root: fix.root }),
    cwd: REPO_ROOT,
    now: FIXED_NOW,
    queryGithubRun: () => run,
    queryGithubWorkflow: () => workflow,
    resolveGitOrigin: () => origin,
    stdout: value => output.push(value),
    stderr: value => errors.push(value),
  });
  return { code, output, errors };
}

test('accepts a complete exact-candidate physical-iPhone record', () => {
  const fix = fixture();
  const result = evaluate(fix.markdown, fix.root);
  assert.equal(result.candidateCommit, CURRENT_COMMIT);
  assert.equal(result.candidateBuild, BUILD);
  assert.equal(result.preconditionsPassed, 9);
  assert.equal(result.smokeRowsPassed, 12);
  assert.equal(result.purchaseRowsPassed, 6);
  assert.equal(result.automatedCellsPassed, 8);
  assert.equal(result.verdict, 'PASS');
  assert.equal(result.referencedFiles.length, 35);
});

test('CLI requires explicit candidate, build, completed file, and evidence root', () => {
  for (const [flag, partial] of [
    ['--candidate', ['--build', BUILD, '--file', 'record.md', '--evidence-root', 'evidence']],
    ['--build', ['--candidate', CURRENT_COMMIT, '--file', 'record.md', '--evidence-root', 'evidence']],
    ['--file', ['--candidate', CURRENT_COMMIT, '--build', BUILD, '--evidence-root', 'evidence']],
    ['--evidence-root', ['--candidate', CURRENT_COMMIT, '--build', BUILD, '--file', 'record.md']],
  ]) {
    expectEvidenceError(
      () => parseCliArguments(['node', 'script', ...partial]),
      'invalid',
      new RegExp(`Missing required ${flag}`),
    );
  }
});

test('CLI requires a canonical positive App Store build number', () => {
  for (const build of [`${PACKAGE_VERSION} (0)`, `${PACKAGE_VERSION} (01)`]) {
    expectEvidenceError(
      () => parseCliArguments(cliArgs({ build, recordPath: 'record.md', root: 'evidence' })),
      'invalid',
      /build number must be at least 1 with no leading zero/,
    );
  }
});

test('CLI binds the candidate to checked-out HEAD and package.json version', () => {
  const fix = fixture();
  const headMismatch = runFixtureCli(fix, { candidate: PARENT_COMMIT });
  assert.equal(headMismatch.code, 2);
  assert.match(headMismatch.errors.join('\n'), /HEAD .* does not match candidate/);

  const versionMismatch = runFixtureCli(fix, { build: '9.9.9 (42)' });
  assert.equal(versionMismatch.code, 2);
  assert.match(versionMismatch.errors.join('\n'), /does not match package\.json version/);
});

test('CLI globally pins the recorded run and git origin to Fenral/svingbue', async (t) => {
  const otherUrl = `https://github.com/OtherOrg/other-repo/actions/runs/${RUN_ID}`;
  await t.test('recorded fork URL', () => {
    const fix = fixture({ runUrl: otherUrl });
    const result = runFixtureCli(fix);
    assert.equal(result.code, 2);
    assert.match(result.errors.join('\n'), /canonical GitHub repository Fenral\/svingbue/);
  });
  await t.test('fork origin even when the record is canonical', () => {
    const fix = fixture();
    const result = runFixtureCli(fix, { origin: 'git@github.com:OtherOrg/other-repo.git' });
    assert.equal(result.code, 2);
    assert.match(result.errors.join('\n'), /git origin must be the canonical GitHub repository Fenral\/svingbue/);
  });
});

test('CLI queries and validates exact workflow, terminal success, head SHA, and API repository', async (t) => {
  const cases = [
    ['run ID', { id: 99 }, /run ID does not match/],
    ['workflow name', { name: 'Some other workflow' }, /run name must be exactly/],
    ['completion', { status: 'in_progress', conclusion: null }, /completed with conclusion success/],
    ['conclusion', { conclusion: 'failure' }, /completed with conclusion success/],
    ['head SHA', { head_sha: PARENT_COMMIT }, /head_sha does not match/],
    ['repository', { repository: { full_name: 'OtherOrg/other-repo' } }, /canonical GitHub repository Fenral\/svingbue/],
    ['HTML URL', { html_url: 'https://github.com/Fenral/svingbue/actions/runs/99' }, /html_url does not match/],
    ['missing workflow ID', { workflow_id: undefined }, /canonical workflow_id/],
  ];
  for (const [name, overrides, pattern] of cases) {
    await t.test(name, () => {
      const fix = fixture();
      const result = runFixtureCli(fix, { run: validGithubRun(overrides) });
      assert.equal(result.code, 2);
      assert.match(result.errors.join('\n'), pattern);
      assert.equal(existsSync(join(fix.root, attestationFileName({
        candidateCommit: CURRENT_COMMIT,
        appVersion: PACKAGE_VERSION,
        buildNumber: '42',
      }))), false);
    });
  }
});

test('CLI binds the run workflow ID to the canonical workflow file', async (t) => {
  const cases = [
    ['workflow ID', { id: 778 }, /workflow ID does not match/],
    ['workflow path', { path: '.github/workflows/other.yml' }, /must come from \.github\/workflows\/v1-release-gate\.yml/],
    ['workflow name', { name: 'Lookalike gate' }, /must come from \.github\/workflows\/v1-release-gate\.yml/],
    ['workflow state', { state: 'disabled_manually' }, /must be active/],
  ];
  for (const [name, workflow, pattern] of cases) {
    await t.test(name, () => {
      const fix = fixture();
      const result = runFixtureCli(fix, {
        workflow: validGithubWorkflow(workflow),
      });
      assert.equal(result.code, 2);
      assert.match(result.errors.join('\n'), pattern);
    });
  }
});

test('rejects edited precondition and smoke requirement text', () => {
  const fix = fixture();
  const changedPrecondition = replaceOnce(
    fix.markdown,
    CANONICAL_PRECONDITIONS[3],
    'A mock RevenueCat key was used for the build.',
  );
  expectEvidenceError(
    () => evaluate(changedPrecondition, fix.root),
    'invalid',
    /Precondition 4 requirement text/,
  );

  const changedSmoke = replaceOnce(
    fix.markdown,
    CANONICAL_SMOKE_REQUIREMENTS[9],
    'VoiceOver was not tested.',
  );
  expectEvidenceError(
    () => evaluate(changedSmoke, fix.root),
    'invalid',
    /Core-smoke row 10 requirement text/,
  );
});

test('binds the release record to the owner-confirmed zero Lifetime buyer cohort', () => {
  const fix = fixture();
  const changed = replaceOnce(
    fix.markdown,
    '| Lifetime buyer cohort status | NONE - owner confirmed 2026-08-09 |',
    '| Lifetime buyer cohort status | Existing buyer LIFE-B |',
  );
  expectEvidenceError(
    () => evaluate(changed, fix.root),
    'invalid',
    /Lifetime buyer cohort status/,
  );
  assert.doesNotMatch(fix.markdown, /Existing Lifetime tester alias|Legacy restore/);
});

test('rejects duplicate canonical headings and any second global Status line', async (t) => {
  const headings = [
    '# Flightglass v1 physical-iPhone release evidence',
    '## Candidate and environment record — required before testing',
    '## Preconditions — stop if any fail',
    '## Physical-iPhone core smoke',
    '## Purchase evidence record',
    '## Automated phone prerequisite',
    '## Final handoff',
  ];
  for (const heading of headings) {
    await t.test(heading, () => {
      const fix = fixture();
      expectEvidenceError(
        () => evaluate(`${fix.markdown}\n${heading}\nStatus: FAIL\n`, fix.root),
        'invalid',
        /must appear exactly once/,
      );
    });
  }
  await t.test('appended second Status FAIL', () => {
    const fix = fixture();
    expectEvidenceError(
      () => evaluate(`${fix.markdown}\nStatus: FAIL\n`, fix.root),
      'invalid',
      /global Status: line must appear exactly once/,
    );
  });
  await t.test('alternate duplicate Final handoff suffix', () => {
    const fix = fixture();
    expectEvidenceError(
      () => evaluate(`${fix.markdown}\n## Final handoff appended\n| Physical-iPhone gate verdict | FAIL |\n`, fix.root),
      'invalid',
      /without an alternate duplicate/,
    );
  });
});

test('hidden Markdown masking preserves length, line breaks, and visible offsets', () => {
  const source = [
    'visible-before',
    '```markdown',
    'hidden-emoji-🔒',
    '```',
    'visible-middle',
    '<!-- hidden-comment-🔑',
    'still-hidden --> visible-after-comment',
    'visible-after',
  ].join('\r\n');
  const masked = maskHiddenMarkdown(source);
  assert.equal(masked.length, source.length);
  assert.deepEqual(
    [...masked.matchAll(/\r\n/g)].map(match => match.index),
    [...source.matchAll(/\r\n/g)].map(match => match.index),
  );
  for (const visible of ['visible-before', 'visible-middle', 'visible-after-comment', 'visible-after']) {
    assert.equal(masked.indexOf(visible), source.indexOf(visible));
  }
  assert.doesNotMatch(masked, /hidden-emoji|hidden-comment|still-hidden/);
});

test('a PASS record hidden in a fence or HTML comment is not evidence', async (t) => {
  for (const [name, wrap] of [
    ['fenced record', markdown => `\`\`\`markdown\n${markdown}\n\`\`\`\n`],
    ['commented record', markdown => `<!--\n${markdown}\n-->\n`],
  ]) {
    await t.test(name, () => {
      const fix = fixture();
      expectEvidenceError(
        () => evaluate(wrap(fix.markdown), fix.root),
        'invalid',
        /must appear exactly once/,
      );
    });
  }
});

test('a hidden required Status or table cannot satisfy the release record', async (t) => {
  await t.test('comment-hidden Status', () => {
    const fix = fixture();
    const hidden = replaceOnce(
      fix.markdown,
      'Status: **PASS - exact candidate evidence complete**',
      '<!-- Status: **PASS - exact candidate evidence complete** -->',
    );
    expectEvidenceError(() => evaluate(hidden, fix.root), 'invalid', /global Status: line must appear exactly once/);
  });
  await t.test('fence-hidden Status', () => {
    const fix = fixture();
    const hidden = replaceOnce(
      fix.markdown,
      'Status: **PASS - exact candidate evidence complete**',
      '```text\nStatus: **PASS - exact candidate evidence complete**\n```',
    );
    expectEvidenceError(() => evaluate(hidden, fix.root), 'invalid', /global Status: line must appear exactly once/);
  });

  const tableHeadings = [
    '## Candidate and environment record — required before testing',
    '## Preconditions — stop if any fail',
    '## Physical-iPhone core smoke',
    '## Purchase evidence record',
    '## Automated phone prerequisite',
    '## Final handoff',
  ];
  for (const [index, heading] of tableHeadings.entries()) {
    await t.test(heading, () => {
      const fix = fixture();
      const hidden = hideFirstTableInSection(fix.markdown, heading, index % 2 ? 'comment' : 'fence');
      expectEvidenceError(
        () => evaluate(hidden, fix.root),
        'invalid',
        /missing its Markdown table/,
      );
    });
  }
});

test('rejects negated or ambiguous purchase and restore outcomes', async (t) => {
  const cases = [
    ['Live Offering', 'Monthly + Annual visible; Lifetime hidden', 'Monthly and Annual not visible; Lifetime hidden', /Live Offering plan/],
    ['Cancel', '| Cancel | SUB-A | Annual |', '| Cancel | SUB-A | Chosen live plan |', /Cancel plan/],
    ['Error recovery', '| Error + recovery | SUB-A | Annual |', '| Error + recovery | SUB-A | Store failed |', /Error \+ recovery plan/],
    ['Purchase', 'Annual to pro', 'Annual did not grant pro', /Purchase plan/],
    ['Relaunch', '| Relaunch persistence | SUB-A | pro |', '| Relaunch persistence | SUB-A | pro missing |', /Relaunch persistence entitlement/],
    ['Clean restore', 'Current subscription to pro', 'Current subscription denied pro', /Clean-install restore/],
  ];
  for (const [name, from, to, pattern] of cases) {
    await t.test(name, () => {
      const fix = fixture();
      const changed = replaceOnce(fix.markdown, from, to);
      expectEvidenceError(() => evaluate(changed, fix.root), 'invalid', pattern);
    });
  }
});

test('requires every evidence cell to resolve inside the evidence root or to safe HTTPS', () => {
  const fix = fixture();
  const missing = replaceOnce(fix.markdown, 'smoke-8.png', 'missing-smoke.png');
  expectEvidenceError(() => evaluate(missing, fix.root), 'invalid', /missing evidence file/);

  const outside = join(dirname(fix.root), 'outside-evidence.log');
  writeFileSync(outside, 'Outside root.\n');
  const traversal = replaceOnce(fix.markdown, 'precondition-2.log', '../outside-evidence.log');
  expectEvidenceError(() => evaluate(traversal, fix.root), 'invalid', /escapes the evidence root/);

  const unsafe = replaceOnce(fix.markdown, 'smoke-2.png', 'http://example.com/smoke-2.png');
  expectEvidenceError(() => evaluate(unsafe, fix.root), 'invalid', /relative file inside the evidence root|unsafe evidence URL/);

  const safe = replaceOnce(fix.markdown, 'smoke-2.png', 'https://evidence.example.com/smoke-2.png');
  const result = evaluate(safe, fix.root);
  assert.ok(result.externalUrls.includes('https://evidence.example.com/smoke-2.png'));
});

test('rejects the generated attestation as an evidence input', () => {
  const fix = fixture();
  const generatedName = attestationFileName({
    candidateCommit: CURRENT_COMMIT,
    appVersion: PACKAGE_VERSION,
    buildNumber: '42',
  });
  writeFileSync(join(fix.root, generatedName), '{}\n');
  const selfReference = replaceOnce(
    fix.markdown,
    'precondition-3.log',
    generatedName,
  );
  expectEvidenceError(
    () => evaluate(selfReference, fix.root),
    'invalid',
    /must not reference the generated attestation itself/,
  );
});

test('scans the entire completed Markdown for sensitive data', () => {
  const fix = fixture();
  const contaminated = `${fix.markdown}\nTester contact: private@example.com\n`;
  expectEvidenceError(
    () => evaluate(contaminated, fix.root),
    'sensitive',
    /email address or Apple account/,
  );
});

test('scans referenced text and log evidence for sensitive data', () => {
  const fix = fixture();
  writeFileSync(join(fix.root, 'precondition-6.log'), 'transaction **ID**: 100000123456789\n');
  expectEvidenceError(
    () => evaluate(fix.markdown, fix.root),
    'sensitive',
    /Referenced evidence file "precondition-6\.log"/,
  );
});

test('rejects NUL-bearing or non-UTF-8-looking text evidence', () => {
  const fix = fixture();
  writeFileSync(join(fix.root, 'precondition-6.log'), Buffer.from('tester@example.com', 'utf16le'));
  expectEvidenceError(
    () => evaluate(fix.markdown, fix.root),
    'invalid',
    /UTF-8 text without NUL bytes/,
  );
});

test('decodes layered HTML, percent, and JSON bypass probes before sensitive scanning', async (t) => {
  const probes = [
    ['numeric HTML entities', 'Tester: private&#64;example&#46;com', /email address or Apple account/],
    ['nested named and numeric HTML entities', 'Tester: private&amp;#x40;example&amp;#46;com', /email address or Apple account/],
    ['nested percent encoding', 'Tester: private%2540example%252ecom', /email address or Apple account/],
    ['JSON Unicode value', '{"tester":"private\\u0040example\\u002ecom"}', /email address or Apple account/],
    ['JSON Unicode key with sensitive value', '{"pass\\u0077ord":"hunter2-secret"}', /sensitive account, receipt, transaction, or key value/],
  ];
  for (const [name, probe, pattern] of probes) {
    await t.test(name, () => {
      const fix = fixture();
      expectEvidenceError(
        () => evaluate(`${fix.markdown}\n${probe}\n`, fix.root),
        'sensitive',
        pattern,
      );
    });
  }
});

test('decodes sensitive JSON values in referenced text evidence', () => {
  const fix = fixture();
  writeFileSync(
    join(fix.root, 'precondition-6.log'),
    '{"account_email":"private\\u0040example\\u002ecom"}\n',
  );
  expectEvidenceError(
    () => evaluate(fix.markdown, fix.root),
    'sensitive',
    /Referenced evidence file "precondition-6\.log"/,
  );
});

test('rejects future and incoherent evidence timelines', async (t) => {
  const cases = [
    [
      'future observation',
      `${SMOKE_TIMESTAMPS[2]} | smoke-3.png`,
      `${timestampAfterCommit(66)} | smoke-3.png`,
      /in the future/,
    ],
    [
      'observation before test start',
      `${SMOKE_TIMESTAMPS[0]} | smoke-1.png`,
      `${timestampAfterCommit(9)} | smoke-1.png`,
      /must not predate the recorded test start/,
    ],
    [
      'non-chronological smoke',
      `${SMOKE_TIMESTAMPS[5]} | smoke-6.png`,
      `${SMOKE_TIMESTAMPS[3]} | smoke-6.png`,
      /Core-smoke timestamps must be chronological/,
    ],
    [
      'review before observations',
      `RK - ${REVIEWER_TIMESTAMP}`,
      `RK - ${PURCHASE_TIMESTAMPS[4]}`,
      /must not predate any recorded observation/,
    ],
  ];
  for (const [name, from, to, pattern] of cases) {
    await t.test(name, () => {
      const fix = fixture();
      const changed = replaceOnce(fix.markdown, from, to);
      expectEvidenceError(() => evaluate(changed, fix.root), 'invalid', pattern);
    });
  }
});

test('rejects a physical test record dated before the candidate commit', () => {
  const fix = fixture();
  const beforeCommit = new Date(Date.parse(COMMIT_TIMESTAMP) - 60_000).toISOString().replace('.000Z', 'Z');
  const changed = replaceOnce(
    fix.markdown,
    PHYSICAL_TEST_START_TIMESTAMP,
    beforeCommit,
  );
  expectEvidenceError(
    () => evaluate(changed, fix.root),
    'invalid',
    /must not start before the candidate commit exists/,
  );
});

test('rejects a GitHub run timestamp after physical testing starts', () => {
  const fix = fixture();
  const result = runFixtureCli(fix, {
    run: validGithubRun({ updated_at: timestampAfterCommit(11) }),
  });
  assert.equal(result.code, 2);
  assert.match(result.errors.join('\n'), /must complete before physical testing starts/);
});

test('requires the automated matrix timestamp to equal the verified run completion', () => {
  const fix = fixture();
  const changed = fix.markdown.replaceAll(
    AUTOMATED_COMPLETION_TIMESTAMP,
    timestampAfterCommit(4),
  );
  writeFileSync(fix.recordPath, changed);
  const result = runFixtureCli(fix);
  assert.equal(result.code, 2);
  assert.match(result.errors.join('\n'), /must identify the exact GitHub run completion time/);
});

test('keeps the committed checklist PENDING and rejects it as a completed record', () => {
  const templatePath = join(REPO_ROOT, 'docs', 'phase2-phone-checklist.md');
  const template = readFileSync(templatePath, 'utf8');
  assert.match(template, /^Status:\s*\*\*PENDING/m);
  const semanticTemplate = template.replace(/[*`]/g, '');
  for (const [index, requirement] of CANONICAL_PRECONDITIONS.entries()) {
    assert.ok(
      semanticTemplate.includes(`| ${index + 1} | ${requirement} | PENDING |`),
      `immutable template precondition ${index + 1} drifted`,
    );
  }
  for (const [index, requirement] of CANONICAL_SMOKE_REQUIREMENTS.entries()) {
    assert.ok(
      semanticTemplate.includes(`| ${index + 1} | ${requirement} | PENDING |`),
      `immutable template smoke row ${index + 1} drifted`,
    );
  }
  const candidateRows = templateTableRows(template, '## Candidate and environment record');
  assert.equal(candidateRows.length, 18);
  for (const [field, value] of candidateRows) {
    if (field === 'RevenueCat entitlement identifier') {
      assert.equal(value.replace(/[*`]/g, ''), 'pro — verify, do not edit');
    } else if (field === 'Lifetime buyer cohort status') {
      assert.equal(value, 'NONE - owner confirmed 2026-08-09');
    } else {
      assert.match(value, /PENDING/, `candidate template field ${field} must stay PENDING`);
    }
  }
  const preconditionRows = templateTableRows(template, '## Preconditions');
  assert.equal(preconditionRows.length, 9);
  for (const [id, , result, evidence] of preconditionRows) {
    assert.equal(result, 'PENDING', `precondition ${id} result must stay PENDING`);
    assert.equal(evidence, 'PENDING', `precondition ${id} evidence must stay PENDING`);
  }
  const smokeRows = templateTableRows(template, '## Physical-iPhone core smoke');
  assert.equal(smokeRows.length, 12);
  for (const [id, , result, timestamp, evidence] of smokeRows) {
    assert.deepEqual([result, timestamp, evidence], ['PENDING', 'PENDING', 'PENDING'], `smoke ${id} must stay PENDING`);
  }
  const purchaseRows = templateTableRows(template, '## Purchase evidence record');
  assert.equal(purchaseRows.length, 6);
  for (const [flow, , , result, timestamp, device, store, notes] of purchaseRows) {
    assert.deepEqual(
      [result, timestamp, device, store, notes],
      ['PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING'],
      `${flow} editable cells must stay PENDING`,
    );
  }
  const automatedRows = templateTableRows(template, '## Automated phone prerequisite');
  assert.equal(automatedRows.length, 2);
  for (const [engine, ...editable] of automatedRows) {
    assert.deepEqual(editable, ['PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING'], `${engine} matrix must stay PENDING`);
  }
  const handoffRows = templateTableRows(template, '## Final handoff');
  assert.equal(handoffRows.length, 6);
  for (const [field, value] of handoffRows) {
    assert.match(value, /PENDING/, `final handoff ${field} must stay PENDING`);
  }
  const fix = fixture();
  expectEvidenceError(
    () => evaluatePhoneEvidence(template, {
      cwd: REPO_ROOT,
      evidenceRoot: fix.root,
      now: FIXED_NOW,
    }),
    'incomplete',
    /Top-level Status/,
  );

  const errors = [];
  const code = runCli({
    argv: cliArgs({ recordPath: templatePath, root: join(REPO_ROOT, 'docs') }),
    cwd: REPO_ROOT,
    now: FIXED_NOW,
    queryGithubRun: () => validGithubRun(),
    queryGithubWorkflow: () => validGithubWorkflow(),
    stdout: () => {},
    stderr: value => errors.push(value),
  });
  assert.equal(code, 2);
  assert.match(errors.join('\n'), /template is immutable/);
});

test('CLI emits a SHA-256 attestation bound to candidate, build, run, record, and evidence files', () => {
  const fix = fixture();
  const result = runFixtureCli(fix);
  assert.equal(result.code, 0, result.errors.join('\n'));
  const attestationName = attestationFileName({
    candidateCommit: CURRENT_COMMIT,
    appVersion: PACKAGE_VERSION,
    buildNumber: '42',
  });
  const attestationPath = join(fix.root, attestationName);
  assert.equal(existsSync(attestationPath), true);
  const originalAttestationText = readFileSync(attestationPath, 'utf8');
  const attestation = JSON.parse(originalAttestationText);
  assert.equal(attestation.candidateCommit, CURRENT_COMMIT);
  assert.equal(attestation.appVersion, PACKAGE_VERSION);
  assert.equal(attestation.buildNumber, '42');
  assert.equal(attestation.releaseGate.name, 'Flightglass v1 release gate');
  assert.equal(attestation.releaseGate.headSha, CURRENT_COMMIT);
  assert.equal(attestation.releaseGate.id, RUN_ID);
  assert.match(attestation.evidence.record.sha256, /^[0-9a-f]{64}$/);
  assert.match(attestation.evidenceBundleSha256, /^[0-9a-f]{64}$/);
  assert.equal(attestation.evidence.files.length, 35);

  const { attestationSha256, ...payload } = attestation;
  assert.equal(
    attestationSha256,
    createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
  );
  assert.match(result.output.join('\n'), /Physical-iPhone release-evidence verdict: PASS/);
  assert.match(result.output.join('\n'), /Attestation SHA-256: [0-9a-f]{64}/);

  writeFileSync(join(fix.root, 'supplementary.mov'), 'changed-supplementary-video');
  const secondRun = runFixtureCli(fix);
  assert.equal(secondRun.code, 2);
  assert.match(secondRun.errors.join('\n'), /already exists and is immutable/);
  assert.equal(readFileSync(attestationPath, 'utf8'), originalAttestationText);

  const nextBuild = `${PACKAGE_VERSION} (43)`;
  writeFileSync(fix.recordPath, completedEvidence({ build: nextBuild }));
  const nextBuildRun = runFixtureCli(fix, { build: nextBuild });
  assert.equal(nextBuildRun.code, 0, nextBuildRun.errors.join('\n'));
  const nextBuildName = attestationFileName({
    candidateCommit: CURRENT_COMMIT,
    appVersion: PACKAGE_VERSION,
    buildNumber: '43',
  });
  assert.notEqual(nextBuildName, attestationName);
  assert.equal(existsSync(join(fix.root, nextBuildName)), true);

  const otherCandidateName = attestationFileName({
    candidateCommit: PARENT_COMMIT,
    appVersion: PACKAGE_VERSION,
    buildNumber: '42',
  });
  assert.notEqual(otherCandidateName, attestationName);
});

test('CLI reports a missing completed record without querying GitHub', () => {
  const root = makeEvidenceRoot();
  let queried = false;
  const errors = [];
  const code = runCli({
    argv: cliArgs({ recordPath: join(root, 'missing.md'), root }),
    cwd: REPO_ROOT,
    now: FIXED_NOW,
    queryGithubRun: () => {
      queried = true;
      return validGithubRun();
    },
    queryGithubWorkflow: () => validGithubWorkflow(),
    stdout: () => {},
    stderr: value => errors.push(value),
  });
  assert.equal(code, 2);
  assert.equal(queried, false);
  assert.match(errors.join('\n'), /Evidence file does not exist or is not a file/);
});

test('a completed record copied under a non-ignored repository path is rejected', () => {
  const source = fixture();
  const trackedLikeRoot = join(REPO_ROOT, 'phone-evidence-test-output');
  mkdirSync(trackedLikeRoot, { recursive: true });
  const recordPath = join(trackedLikeRoot, 'phone-release-evidence.md');
  copyFileSync(source.recordPath, recordPath);
  try {
    const errors = [];
    const code = runCli({
      argv: cliArgs({ recordPath, root: trackedLikeRoot }),
      cwd: REPO_ROOT,
      now: FIXED_NOW,
      queryGithubRun: () => validGithubRun(),
      queryGithubWorkflow: () => validGithubWorkflow(),
      stdout: () => {},
      stderr: value => errors.push(value),
    });
    assert.equal(code, 2);
    assert.match(errors.join('\n'), /must be outside the candidate/);
  } finally {
    rmSync(trackedLikeRoot, { recursive: true, force: true });
  }
});
