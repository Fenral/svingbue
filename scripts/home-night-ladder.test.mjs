import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const home = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const homeCss = readFileSync(new URL('../sa-home.css', import.meta.url), 'utf8');
const opening = readFileSync(new URL('../sa-opening.js', import.meta.url), 'utf8');
const manifest = JSON.parse(readFileSync(new URL('../config/flightglass-surfaces.json', import.meta.url), 'utf8'));

test('shipping Home is the state-driven learning entry, not Night Ladder', () => {
  assert.match(home, /<body[^>]+data-home-experience=["']learning-tour["']/);
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
  assert.match(home, /id=["']startFirstShot["'][^>]*>\s*See how Flightglass works/i);
  assert.match(home, /id=["']resumeSetup["'][^>]+hidden/);
  assert.match(home, /id=["']tryExperiment["'][^>]*>\s*Try this in Range/i);
  assert.match(home, /id=["']shotTruth["'][^>]*>\s*Modelled shot/i);
  assert.match(home, /href=["']\.\/jarvis\.html["'][^>]*>\s*Open Flightglass Guide/i);
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

test('Home owns one local, skippable cold-start opening before onboarding', () => {
  assert.equal([...home.matchAll(/id=["']saSplash["']/g)].length, 1);
  assert.match(home, /id=["']saSplashSkip["'][^>]+aria-label=["']Skip opening animation["']/i);
  assert.match(home, /class=["']opening-splash__instrument["'][^>]+viewBox=["']0 0 390 560["']/i);
  assert.match(home, /class=["']opening-splash__trajectory["'][^>]+pathLength=["']1["']/i);
  assert.match(home, /src=["']\.\/assets\/flightglass-lockup\.svg["']/i);
  assert.doesNotMatch(home, /<video\b|https?:\/\//i);

  assert.match(opening, /sessionStorage\.setItem\(OPENING_SESSION_KEY, '1'\)/);
  assert.match(opening, /OPENING_DURATION_MS = 1450/);
  assert.match(opening, /REDUCED_DURATION_MS = 150/);
  assert.match(opening, /addEventListener\('cancel', cancel\)/);
  assert.match(homeCss, /@media \(prefers-reduced-motion: reduce\)[\s\S]+\.opening-splash__trajectory/);
});

test('learning tour uses real product proof and one bounded model without personal intake', () => {
  for (const asset of ['outcome.webp', 'studio.webp', 'guide.webp']) {
    assert.match(home, new RegExp(`src=["']\\.\\/assets\\/onboarding\\/${asset}["']`, 'i'));
  }
  assert.match(home, /id=["']onboardingLoft["'][^>]+type=["']range["']/i);
  assert.match(home, /id=["']labLaunch["']/);
  assert.match(home, /id=["']labSpinLoft["']/);
  assert.match(home, /id=["']labBackspin["']/);
  assert.match(home, /onboarding-lab__status[^>]*>[\s\S]*Modelled/i);
  assert.match(home, /Launch angle[\s\S]*Estimate[\s\S]*Spin loft[\s\S]*Geometry[\s\S]*Backspin[\s\S]*Calculated/i);
  assert.doesNotMatch(home, /onboarding-lab__outcomes["'][^>]*aria-live/i);
  assert.match(home, /id=["']openLiveModel["'][^>]+href=["']\.\/impact\.html["']/i);
  assert.doesNotMatch(home, /type=["']radio["']|Your goal|Handedness|What did you see\?/i);
  assert.doesNotMatch(home, /my first shot|my swing|show my shot/i);
  assert.doesNotMatch(home, /Build a model of your golf shot|First shot/i);
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
    '../sa-opening.js',
    '../sa-v1-context.js',
    '../impact-flight.js',
    '../assets/onboarding/outcome.webp',
    '../assets/onboarding/studio.webp',
    '../assets/onboarding/guide.webp',
  ]) {
    assert.ok(existsSync(new URL(asset, import.meta.url)), `missing local asset ${asset}`);
  }
});

test('Home audit covers the two target portrait sizes and both motion modes', () => {
  const surface = manifest.surfaces.find(({ id }) => id === 'home');
  assert.ok(surface);
  assert.deepEqual(surface.viewportIds, ['portrait-wide', 'portrait-compact']);
  assert.deepEqual(surface.requiredSelectors, [
    'body[data-home-experience="learning-tour"]',
    '[data-home-main]',
    '#homeEmpty',
    '#onboarding',
  ]);
  assert.equal(surface.primaryJob, 'Understand familiar launch-monitor inputs, see one modelled relationship, and choose where to explore it.');
});
