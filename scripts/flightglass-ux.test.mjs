import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  loadManifest,
  validateManifest,
  evaluateSnapshot,
  normalizeResourceErrors,
  shouldIgnoreResourceFailure,
  reportFileStem,
  renderMarkdownReport
} from './lib/flightglass-ux.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = join(ROOT, 'config', 'flightglass-surfaces.json');

test('manifest defines every owner-named surface with a 90+ target', () => {
  const manifest = loadManifest(manifestPath);
  const result = validateManifest(manifest, ROOT);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(
    manifest.surfaces.map((surface) => surface.id),
    [
      'home', 'range', 'visualise', 'outcome', 'compare',
      'geometry-3d', 'strike-window-2d', 'academy-overview',
      'academy-lesson', 'paywall'
    ]
  );
  assert.ok(manifest.surfaces.every((surface) => surface.targetScore >= 90));
});

test('manifest maps every surface to existing files and target viewports', () => {
  const manifest = loadManifest(manifestPath);
  const result = validateManifest(manifest, ROOT);
  assert.equal(result.errors.length, 0);
  assert.ok(manifest.surfaces.every((surface) => surface.viewportIds.length >= 1));
  assert.ok(manifest.surfaces.every((surface) => surface.references.length >= 1));
});

test('Backspin reference lesson targets 96 before Academy rollout', () => {
  const manifest = loadManifest(manifestPath);
  const lesson = manifest.surfaces.find((surface) => surface.id === 'academy-lesson');
  assert.equal(lesson.targetScore, 96);
  // EV-NAT-04: the audit contract covers Mission, Lab, Mastery AND Result.
  assert.deepEqual(lesson.requiredSelectors, [
    '#nativeLesson',
    '#missionStageBuild',
    '#backspinTruth',
    '#labRange',
    '#masteryTask',
    '#nativeLessonResult'
  ]);
});

test('copy-web ships the Backspin lesson assets and never the mock', () => {
  const copyResult = spawnSync(process.execPath, [join(ROOT, 'scripts', 'copy-web.mjs')], {
    encoding: 'utf8'
  });
  assert.equal(copyResult.status, 0, copyResult.stderr || copyResult.stdout);
  for (const file of [
    'academy.html',
    'academy-backspin-model.js',
    'academy-lesson-journey.js',
    'academy-native-lesson.js',
    'academy-native-lesson.css'
  ]) {
    assert.equal(existsSync(join(ROOT, 'www', file)), true, `${file} must ship`);
  }
  assert.equal(existsSync(join(ROOT, 'www', 'academy-lesson-v2-mock.html')), false);
});

test('instrument typography tokens: one font pair, no ad-hoc families in lesson CSS', () => {
  // EV-TYPO-04: the font pair lives once in the token file; the lesson
  // stylesheet may only reference tokens (var(...)) or inherit.
  const lessonCss = readFileSync(join(ROOT, 'academy-native-lesson.css'), 'utf8');
  const literalFamilies = [...lessonCss.matchAll(/font-family\s*:\s*([^;}]+)[;}]/g)]
    .map((match) => match[1].trim().replace(/\s*!important$/, ''))
    .filter((value) => !value.startsWith('var(') && value !== 'inherit');
  assert.deepEqual(literalFamilies, [],
    'lesson CSS must not declare ad-hoc font stacks — use the token file');

  const tokens = readFileSync(join(ROOT, 'sa-p3.css'), 'utf8');
  assert.equal([...tokens.matchAll(/--font-ui\s*:/g)].length, 1,
    'exactly one UI font definition in the token file');
  assert.equal([...tokens.matchAll(/--font-mono\s*:/g)].length, 1,
    'exactly one truth mono definition in the token file');
});

test('instrument render signature: no glow, gradient, shadow or filter in the lesson', () => {
  // EV-REN-01: the trace is an instrument, not an illustration. Elevation
  // and rings are drawn with borders/outlines, bands with solid plates.
  const lessonCss = readFileSync(join(ROOT, 'academy-native-lesson.css'), 'utf8');
  for (const forbidden of ['box-shadow', 'text-shadow', '-gradient(', 'backdrop-filter', 'filter:']) {
    assert.equal(lessonCss.includes(forbidden), false,
      `"${forbidden}" must not appear in lesson CSS`);
  }
  const rendererSource = readFileSync(join(ROOT, 'academy-native-lesson.js'), 'utf8');
  assert.doesNotMatch(rendererSource,
    /createLinearGradient|createRadialGradient|shadowBlur|shadowColor|context\.filter/,
    'canvas code must not paint gradients, glows or filters');
});

test('snapshot evaluation separates critical failures from improvement findings', () => {
  const result = evaluateSnapshot({
    httpStatus: 200,
    consoleErrors: [],
    pageErrors: [],
    horizontalOverflowPx: 0,
    missingSelectors: [],
    clippedText: [{ selector: '.secondary', text: 'Secondary label' }],
    smallTargets: [{ selector: '.tiny', width: 31, height: 31 }]
  });

  assert.equal(result.critical.length, 0);
  assert.equal(result.improvements.length, 2);

  const broken = evaluateSnapshot({
    httpStatus: 500,
    consoleErrors: ['boom'],
    pageErrors: [],
    horizontalOverflowPx: 18,
    missingSelectors: ['#model'],
    clippedText: [],
    smallTargets: []
  });
  assert.equal(broken.critical.length, 4);
});

test('snapshot evaluation reports failed resource URLs as critical evidence', () => {
  const result = evaluateSnapshot({
    httpStatus: 200,
    consoleErrors: [],
    pageErrors: [],
    resourceErrors: [{ status: 404, url: 'http://127.0.0.1/missing.glb' }],
    horizontalOverflowPx: 0,
    missingSelectors: [],
    clippedText: [],
    smallTargets: []
  });
  assert.deepEqual(result.critical, ['1 failed resource request(s)']);
});

test('resource failures are deduplicated by URL while preserving the strongest evidence', () => {
  const result = normalizeResourceErrors([
    { status: 0, url: 'http://127.0.0.1/vendor/three.js', error: 'net::ERR_ABORTED' },
    { status: 404, url: 'http://127.0.0.1/vendor/three.js' },
    { status: 404, url: 'http://127.0.0.1/missing.glb' }
  ]);
  assert.deepEqual(result, [
    { status: 404, url: 'http://127.0.0.1/vendor/three.js' },
    { status: 404, url: 'http://127.0.0.1/missing.glb' }
  ]);
});

test('browser favicon probes are ignored by the product audit', () => {
  assert.equal(shouldIgnoreResourceFailure('http://127.0.0.1:4173/favicon.ico'), true);
  assert.equal(shouldIgnoreResourceFailure('http://127.0.0.1:4173/missing.glb'), false);
});

test('focused audits cannot overwrite the full baseline report', () => {
  assert.equal(reportFileStem('baseline', []), 'baseline-report');
  assert.equal(reportFileStem('baseline', ['home']), 'baseline--home-report');
  assert.equal(
    reportFileStem('verify', ['compare', 'geometry-3d']),
    'verify--compare+geometry-3d-report'
  );
});

test('the same failed resource is not counted again as a console error', () => {
  const result = evaluateSnapshot({
    httpStatus: 200,
    consoleErrors: [{ text: 'Failed to load resource', url: 'http://127.0.0.1/missing.glb' }],
    pageErrors: [],
    resourceErrors: [{ status: 404, url: 'http://127.0.0.1/missing.glb' }],
    horizontalOverflowPx: 0,
    missingSelectors: [],
    clippedText: [],
    smallTargets: []
  });
  assert.deepEqual(result.critical, ['1 failed resource request(s)']);
});

test('markdown report names scores, criticals and screenshot evidence', () => {
  const markdown = renderMarkdownReport({
    generatedAt: '2026-07-13T09:00:00.000Z',
    mode: 'baseline',
    results: [{
      surfaceId: 'home',
      viewportId: 'landscape-wide',
      baselineScore: 67,
      targetScore: 90,
      screenshot: 'baseline/home--landscape-wide.png',
      critical: [],
      improvements: ['1 target below 44 px'],
      snapshot: {
        resourceErrors: [{ status: 404, url: 'http://127.0.0.1/missing.glb' }]
      }
    }]
  });

  assert.match(markdown, /Home/);
  assert.match(markdown, /67 -> 90/);
  assert.match(markdown, /home--landscape-wide\.png/);
  assert.match(markdown, /1 target below 44 px/);
  assert.match(markdown, /404 .*missing\.glb/);
});

test('audit CLI validates the manifest without launching a browser', () => {
  const run = spawnSync(
    process.execPath,
    ['scripts/flightglass-ux-audit.mjs', '--manifest-only', '--json'],
    { cwd: ROOT, encoding: 'utf8' }
  );
  assert.equal(run.status, 0, run.stderr);
  const payload = JSON.parse(run.stdout);
  assert.equal(payload.valid, true);
  assert.equal(payload.surfaceCount, 10);
  assert.equal(payload.viewportCount, 4);
});

test('Claude autopilot verifier approves the complete control package', () => {
  const run = spawnSync(
    process.execPath,
    ['scripts/verify-claude-autopilot.mjs', '--json'],
    { cwd: ROOT, encoding: 'utf8' }
  );
  assert.equal(run.status, 0, run.stderr);
  const payload = JSON.parse(run.stdout);
  assert.equal(payload.valid, true);
  assert.ok(payload.requiredFiles >= 8);
  assert.equal(payload.protectedIdentifiers, 7);
});
