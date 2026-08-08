import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  CHANGE_GATE_ROUTES,
  buildCommandPlan,
  classifyChanges,
  containsPotentialSecret,
  inspectTextIntegrity,
  resolveRequestedLevel
} from './lib/flightglass-change-gate.mjs';
import { controlInvocation } from './flightglass-change-gate.mjs';

const ids = (assessment) => buildCommandPlan(assessment).map((control) => control.id);
const cli = fileURLToPath(new URL('./flightglass-change-gate.mjs', import.meta.url));
const browserSpotSource = readFileSync(
  new URL('./flightglass-browser-spot.mjs', import.meta.url),
  'utf8'
);
const releaseWorkflowSource = readFileSync(
  new URL('../.github/workflows/v1-release-gate.yml', import.meta.url),
  'utf8'
);

test('Windows invokes npm controls through cmd instead of spawning npm.cmd directly', () => {
  assert.deepEqual(controlInvocation({
    bin: 'npm',
    args: ['run', 'verify:v1:release']
  }, {
    platform: 'win32',
    environment: { ComSpec: 'C:\\Windows\\System32\\cmd.exe' },
    nodeExecutable: 'C:\\Program Files\\nodejs\\node.exe'
  }), {
    executable: 'C:\\Windows\\System32\\cmd.exe',
    args: ['/d', '/s', '/c', 'npm.cmd', 'run', 'verify:v1:release']
  });

  assert.deepEqual(controlInvocation({
    bin: 'npm',
    args: ['run', 'verify:v1:release']
  }, {
    platform: 'linux',
    environment: {},
    nodeExecutable: '/usr/bin/node'
  }), {
    executable: 'npm',
    args: ['run', 'verify:v1:release']
  });
});

test('documentation-only changes stay at level A without runtime work', () => {
  const assessment = classifyChanges(['docs/notes.md']);
  assert.equal(assessment.level, 'A');
  assert.deepEqual(assessment.routes, []);
  assert.deepEqual(ids(assessment), []);
});

test('Home changes receive the focused level A contract and Chromium runtime spot', () => {
  const assessment = classifyChanges(['index.html']);
  assert.equal(assessment.level, 'A');
  assert.deepEqual(assessment.routes, ['index.html']);
  assert.deepEqual(ids(assessment), ['home-contract', 'chromium-spot']);
});

test('shared browser runtime promotes to B and covers the actual four v1 routes in two engines', () => {
  const assessment = classifyChanges(['sa-p3.css']);
  assert.equal(assessment.level, 'B');
  assert.deepEqual(assessment.routes, [
    'impact-studio.html', 'impact.html', 'index.html', 'jarvis.html'
  ]);
  assert.deepEqual(ids(assessment), ['home-contract', 'chromium-spot', 'webkit-spot']);
});

test('Studio and Guide changes stay focused on their shipping routes', () => {
  const assessment = classifyChanges([
    'assets/impact-studio/turf.png',
    'impact-studio.html',
    'jarvis.css',
    'jarvis.html'
  ]);
  assert.equal(assessment.level, 'B');
  assert.deepEqual(assessment.routes, ['impact-studio.html', 'jarvis.html']);
  assert.deepEqual(ids(assessment), ['home-contract', 'chromium-spot', 'webkit-spot']);
});

test('the v1 route map excludes retired Geometry and Academy surfaces', () => {
  assert.deepEqual(CHANGE_GATE_ROUTES, [
    'index.html', 'impact.html', 'impact-studio.html', 'jarvis.html'
  ]);

  const assessment = classifyChanges([
    'academy.html',
    'geometry.html',
    'geo3d/scene.js'
  ]);
  assert.equal(assessment.level, 'B');
  assert.deepEqual(assessment.routes, []);
  assert.ok(assessment.tags.includes('non-shipping'));
  assert.deepEqual(ids(assessment), ['gate-contract']);
});

test('the protected geometry engine now maps only to shipping Impact Studio', () => {
  const assessment = classifyChanges(['swing-parameters-and-impact.js']);
  assert.equal(assessment.level, 'C');
  assert.deepEqual(assessment.routes, ['impact-studio.html']);
});

test('control-system changes test the gate without running product browsers', () => {
  const assessment = classifyChanges(['AGENTS.md', 'scripts/flightglass-change-gate.mjs']);
  assert.equal(assessment.level, 'B');
  assert.deepEqual(ids(assessment), ['gate-contract']);
});

test('the browser harness runs one real WebKit Home spot when it changes', () => {
  const assessment = classifyChanges(['scripts/flightglass-browser-spot.mjs']);
  assert.equal(assessment.level, 'B');
  assert.deepEqual(ids(assessment), ['gate-contract', 'chromium-spot', 'webkit-spot']);
});

test('browser inspection excludes targets covered by a blocking layer', () => {
  assert.match(browserSpotSource, /document\.elementFromPoint/);
  assert.match(browserSpotSource, /element\.contains\(hit\)/);
  assert.match(browserSpotSource, /activeModal\.contains\(element\)/);
  assert.match(browserSpotSource, /scopedSet\.has\(peer\)/);
});

test('physics changes are C and use the complete current-main plan once', () => {
  const assessment = classifyChanges(['impact-flight.js']);
  assert.equal(assessment.level, 'C');
  assert.deepEqual(ids(assessment), ['v1-release']);
  assert.equal(buildCommandPlan(assessment)[0].display, 'npm run verify:v1:release');
});

test('payment, native and protected release files are always level C', () => {
  for (const file of [
    'capacitor.config.ts',
    'codemagic.yaml',
    'package-lock.json',
    'sa-access.js',
    'sa-iap.js',
    'sa-iap-config.js',
    'sa-paywall.css',
    'sa-paywall.js',
    'sa-shots.js',
    'package.json',
    'scripts/configure-native-iap.mjs',
    'scripts/monetization-contract.test.mjs',
    'scripts/native-release-contract.test.mjs',
    'scripts/phase4-iap-contract.test.mjs',
    'scripts/phase4-paywall-browser.test.mjs',
    'scripts/release-evidence-onboarding.mjs',
    'scripts/release-evidence-onboarding.test.mjs',
    'scripts/release-evidence-phone.mjs',
    'scripts/release-evidence-phone.test.mjs',
    'scripts/vercel-preview-evidence.mjs',
    'scripts/vercel-preview-evidence.test.mjs',
    'scripts/store-release-contract.test.mjs',
    'scripts/store-screenshots.mjs',
    'scripts/web-release-contract.test.mjs',
    'tools/package-lock.json',
    'tools/package.json',
    'vercel.json'
  ]) {
    assert.equal(classifyChanges([file]).level, 'C', file);
  }
});

test('the GitHub release workflow verifies the exact event candidate through the real level-C gate', () => {
  assert.match(
    releaseWorkflowSource,
    /uses: actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7\.0\.1/
  );
  assert.match(
    releaseWorkflowSource,
    /uses: actions\/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7\.0\.0/
  );
  assert.match(
    releaseWorkflowSource,
    /uses: actions\/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7\.0\.1/
  );
  assert.match(releaseWorkflowSource, /node-version: 24/);
  assert.match(releaseWorkflowSource, /npm audit --audit-level=high/);
  assert.match(releaseWorkflowSource, /npm audit --omit=dev --audit-level=high/);
  assert.match(releaseWorkflowSource, /npm audit --prefix tools --audit-level=high/);
  assert.match(releaseWorkflowSource, /npm-audit-all\.json/);
  assert.match(releaseWorkflowSource, /npm-audit-production\.json/);
  assert.match(releaseWorkflowSource, /npm-audit-tools\.json/);
  assert.match(releaseWorkflowSource, /name: Write immutable release evidence manifest[\s\S]*if: always\(\)[\s\S]*release-evidence-manifest\.json/);
  assert.match(releaseWorkflowSource, /steps:\s*\{[\s\S]*checkout: \$checkout[\s\S]*auditTools: \$auditTools/);
  assert.match(releaseWorkflowSource, /name: Upload immutable release evidence[\s\S]*if: always\(\)/);
  assert.match(releaseWorkflowSource, /name: flightglass-v1-release-evidence-\$\{\{ github\.run_id \}\}/);
  assert.match(releaseWorkflowSource, /path: \$\{\{ runner\.temp \}\}\/flightglass-v1-evidence\//);
  assert.match(releaseWorkflowSource, /if-no-files-found: error/);
  assert.match(releaseWorkflowSource, /retention-days: 30/);
  assert.doesNotMatch(
    releaseWorkflowSource,
    /uses: actions\/(?:checkout|setup-node|upload-artifact)@v4/,
    'the release gate must not return to the retired Node 20 action runtime'
  );
  assert.match(
    releaseWorkflowSource,
    /EXPECTED_CANDIDATE_SHA: \$\{\{ github\.event_name == 'pull_request' && github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/
  );
  assert.match(
    releaseWorkflowSource,
    /EXPECTED_BASE_SHA: \$\{\{ github\.event_name == 'pull_request' && github\.event\.pull_request\.base\.sha \|\| github\.event_name == 'push' && github\.event\.before \|\| inputs\.base_sha \}\}/
  );
  assert.match(releaseWorkflowSource, /workflow_dispatch:[\s\S]*base_sha:[\s\S]*required: true[\s\S]*type: string/);
  assert.match(releaseWorkflowSource, /ref: \$\{\{ github\.event_name == 'pull_request' && github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/);
  assert.match(releaseWorkflowSource, /fetch-depth: 0/);
  assert.match(releaseWorkflowSource, /actual_candidate="\$\(git rev-parse HEAD\)"/);
  assert.match(releaseWorkflowSource, /\[\[ "\$actual_candidate" != "\$expected_candidate" \]\]/);
  assert.match(releaseWorkflowSource, /\[\[ ! "\$base_candidate" =~ \^\[0-9a-f\]\{40\}\$ \|\| "\$base_candidate" =~ \^0\+\$ \]\]/);
  assert.doesNotMatch(releaseWorkflowSource, /actual_candidate\}\^/);
  assert.match(releaseWorkflowSource, /git cat-file -e "\$\{base_candidate\}\^\{commit\}"/);
  assert.match(releaseWorkflowSource, /git fetch --no-tags origin "\$base_candidate"/);
  assert.match(
    releaseWorkflowSource,
    /npm run verify:change -- --base "\$FLIGHTGLASS_BASE_SHA" --level C(?:\s|$)/
  );
  assert.doesNotMatch(
    releaseWorkflowSource,
    /verify:change[^\n]*--no-report/,
    'the failure artifact step requires the change gate to write its timing report'
  );
  assert.equal(
    [...releaseWorkflowSource.matchAll(/npm run verify:change/g)].length,
    1,
    'the workflow must invoke the complete risk gate exactly once'
  );
  assert.doesNotMatch(releaseWorkflowSource, /npm run test:gate/);
  assert.doesNotMatch(
    releaseWorkflowSource,
    /npm run verify:v1:release/,
    'the level-C change gate must be the only path to the complete release suite'
  );
});

test('generated output evidence never raises the change level', () => {
  const assessment = classifyChanges([
    'docs/notes.md',
    'outputs/flightglass-gates/report.json'
  ]);
  assert.equal(assessment.level, 'A');
  assert.deepEqual(assessment.files, ['docs/notes.md']);
  assert.deepEqual(assessment.ignoredEvidenceFiles, ['outputs/flightglass-gates/report.json']);
});

test('a lower manual level is rejected unless explicitly justified', () => {
  assert.throws(
    () => resolveRequestedLevel('C', 'A', { allowDowngrade: false, reason: '' }),
    /downgrade/i
  );
  assert.throws(
    () => resolveRequestedLevel('C', 'B', { allowDowngrade: true, reason: 'short' }),
    /reason/i
  );
  assert.equal(resolveRequestedLevel('A', 'C').effectiveLevel, 'C');
});

test('every command plan has unique controls', () => {
  for (const files of [['index.html'], ['sa-p3.css'], ['impact-flight.js']]) {
    const plan = ids(classifyChanges(files));
    assert.equal(new Set(plan).size, plan.length, files.join(','));
  }
});

test('untracked-source helpers detect credentials and integrity defects', () => {
  const assembledCredential = `${['api', 'key'].join('_')} = "${'x'.repeat(20)}"`;
  assert.equal(containsPotentialSecret(assembledCredential), true);
  assert.equal(containsPotentialSecret('api_key = process.env.FLIGHTGLASS_API_KEY'), false);
  assert.deepEqual(inspectTextIntegrity('clean\n'), []);
  assert.deepEqual(inspectTextIntegrity('bad  \n<<<<<<< HEAD\n'), [
    { line: 1, reason: 'trailing whitespace' },
    { line: 2, reason: 'unresolved merge marker' }
  ]);
});

test('CLI dry-run explains shared-runtime level B as JSON', () => {
  const result = spawnSync(process.execPath, [
    cli, '--dry-run', '--json', '--no-report', '--file', 'sa-p3.css'
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.detectedLevel, 'B');
  assert.equal(payload.effectiveLevel, 'B');
  assert.ok(payload.reasons.some((reason) => reason.reason.includes('shared browser runtime')));
  assert.ok(payload.controls.some((control) => control.id === 'webkit-spot'));
});

test('successful CLI reports bind the evidence to exact candidate and base commits', () => {
  const result = spawnSync(process.execPath, [
    cli, '--json', '--no-report', '--level', 'A', '--file', 'docs/release-evidence.md'
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.match(payload.candidateSha, /^[0-9a-f]{40}$/);
  assert.match(payload.resolvedBaseSha, /^[0-9a-f]{40}$/);
  assert.ok(Array.isArray(payload.controls));
  assert.equal(payload.status, 'PASS');
});
