import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  buildCommandPlan,
  classifyChanges,
  containsPotentialSecret,
  inspectTextIntegrity,
  resolveRequestedLevel
} from './lib/flightglass-change-gate.mjs';

const ids = (assessment) => buildCommandPlan(assessment).map((control) => control.id);
const cli = fileURLToPath(new URL('./flightglass-change-gate.mjs', import.meta.url));
const browserSpotSource = readFileSync(
  new URL('./flightglass-browser-spot.mjs', import.meta.url),
  'utf8'
);

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

test('shared browser runtime promotes to B and covers the four shipping routes in two engines', () => {
  const assessment = classifyChanges(['sa-p3.css']);
  assert.equal(assessment.level, 'B');
  assert.deepEqual(assessment.routes, [
    'academy.html', 'geometry.html', 'impact.html', 'index.html'
  ]);
  assert.deepEqual(ids(assessment), ['home-contract', 'chromium-spot', 'webkit-spot']);
});

test('one non-Home shipping route is level B and remains focused', () => {
  const assessment = classifyChanges(['academy.html']);
  assert.equal(assessment.level, 'B');
  assert.deepEqual(assessment.routes, ['academy.html']);
  assert.deepEqual(ids(assessment), ['home-contract', 'chromium-spot', 'webkit-spot']);
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
  assert.deepEqual(ids(assessment), [
    'gate-contract', 'home-contract', 'chromium-spot', 'webkit-spot', 'native-copy'
  ]);
});

test('native and protected release files are always level C', () => {
  for (const file of ['capacitor.config.ts', 'sa-iap.js', 'codemagic.yaml', 'package-lock.json']) {
    assert.equal(classifyChanges([file]).level, 'C', file);
  }
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
