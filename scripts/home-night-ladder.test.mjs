import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const home = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const manifest = JSON.parse(readFileSync(new URL('../config/flightglass-surfaces.json', import.meta.url), 'utf8'));

test('shipping Home is the state-driven first-shot app, not Night Ladder', () => {
  assert.match(home, /<body[^>]+data-home-experience=["']first-shot["']/);
  assert.match(home, /<main[^>]+data-home-main/);
  assert.match(home, /id=["']homeEmpty["']/);
  assert.match(home, /id=["']homeReturning["'][^>]+hidden/);
  assert.match(home, /href=["']\.\/sa-home\.css["']/);
  assert.match(home, /src=["']\.\/sa-home\.js["']/);

  assert.doesNotMatch(home, /night[- ]ladder/i);
  assert.doesNotMatch(home, /range-night-3d-33\.png/);
  assert.doesNotMatch(home, /class=["'][^"']*\bplace\b/);
  assert.doesNotMatch(home, /Flightglass destinations/);
});

test('Home has exactly one primary next action in each state', () => {
  assert.match(home, /id=["']startFirstShot["'][^>]*>\s*Run your first shot/i);
  assert.match(home, /id=["']resumeSetup["'][^>]+hidden/);
  assert.match(home, /id=["']tryExperiment["'][^>]*>\s*Try this in Range/i);
  assert.match(home, /id=["']shotTruth["'][^>]*>\s*Modelled shot/i);
  assert.match(home, /href=["']\.\/jarvis\.html["'][^>]*>\s*Ask Jarvis/i);
});

test('the focused onboarding exposes four semantic, resumable steps', () => {
  assert.match(home, /<dialog[^>]+id=["']onboarding["'][^>]+aria-labelledby=["']onboardingTitle["']/);
  for (const step of [1, 2, 3, 4]) {
    assert.match(home, new RegExp(`data-onboarding-step=["']${step}["']`));
  }
  assert.match(home, /id=["']onboardingProgress["'][^>]*>\s*Step 1 of 4/i);
  assert.match(home, /id=["']onboardingLater["'][^>]*>\s*Not now/i);
  assert.match(home, /id=["']onboardingBack["']/);
  assert.match(home, /id=["']onboardingLive["'][^>]+aria-live=["']polite["']/);
  assert.doesNotMatch(home, /<input[^>]+type=["']text["']/i);
  assert.doesNotMatch(home, /<textarea\b/i);
});

test('guided questions use buttons and radio groups without pre-value friction', () => {
  for (const legend of [
    'Your goal',
    'Handedness',
    'Experience',
    'Club',
    'Start direction',
    'Curve',
    'Flight',
  ]) {
    assert.match(home, new RegExp(`<legend[^>]*>\\s*${legend}\\s*<`, 'i'));
  }
  assert.match(home, /class=["'][^"']*skip-answer[^"']*["'][^>]*>\s*Skip/i);
  assert.match(home, /id=["']showShot["'][^>]*>\s*Show my shot/i);
  assert.match(home, /id=["']onboardingResultTable["']/);

  assert.doesNotMatch(home, /sign[ -]?in|create account|enable notifications|paywall|upgrade to pro/i);
});

test('Home ships only local, canonical assets required by Phase 2', () => {
  for (const asset of [
    '../assets/flightglass-mark-micro.svg',
    '../assets/flightglass-lockup.svg',
    '../sa-p3.css',
    '../sa-app-shell.css',
    '../sa-home.css',
    '../sa-home.js',
    '../sa-v1-context.js',
  ]) {
    assert.ok(existsSync(new URL(asset, import.meta.url)), `missing local asset ${asset}`);
  }
});

test('Home audit covers the two target portrait sizes and both motion modes', () => {
  const surface = manifest.surfaces.find(({ id }) => id === 'home');
  assert.ok(surface);
  assert.deepEqual(surface.viewportIds, ['portrait-wide', 'portrait-compact']);
  assert.deepEqual(surface.requiredSelectors, [
    'body[data-home-experience="first-shot"]',
    '[data-home-main]',
    '#homeEmpty',
    '#onboarding',
  ]);
  assert.equal(surface.primaryJob, 'Run the first useful shot or continue one bounded experiment.');
});
