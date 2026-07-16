import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const home = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const manifest = JSON.parse(readFileSync(new URL('../config/flightglass-surfaces.json', import.meta.url), 'utf8'));

test('shipping Home uses the selected Night Ladder world', () => {
  assert.match(home, /data-home-direction=["']night-ladder["']/);
  assert.match(home, /class=["'][^"']*scene[^"']*shell/);
  assert.match(home, /class=["'][^"']*flight/);
  assert.match(home, /Walk the(?:<br>)?shot\./);
  assert.doesNotMatch(home, /Portrait study/i);
});

test('Night Ladder exposes only shipping destinations', () => {
  for (const destination of [
    './impact.html',
    './impact.html?play=1',
    './geometry.html',
    './academy.html'
  ]) {
    assert.match(home, new RegExp(`href=["']${destination.replace(/[.?]/g, '\\$&')}["']`));
  }

  assert.doesNotMatch(home, /href=["'][^"']*(?:-mock|\.mock)\.html/i);
  assert.match(home, /aria-label=["']Flightglass destinations["']/);
});

test('Night Ladder preserves honest state, accessibility and local assets', () => {
  for (const key of [
    'sa.stat.flight',
    'sa.stat.geometry',
    'sa.stat.outcome',
    'strikearc.academy.v1',
    'sa.home.last'
  ]) {
    assert.ok(home.includes(key), `missing state contract ${key}`);
  }

  for (const asset of [
    '../assets/range-night-3d-33.png',
    '../assets/flightglass-mark-micro.svg',
    '../assets/flightglass-lockup.svg'
  ]) {
    assert.ok(existsSync(new URL(asset, import.meta.url)), `missing local asset ${asset}`);
  }

  assert.match(home, /30\s*\*\s*864e5/);
  assert.match(home, /prefers-reduced-motion:\s*reduce/);
  assert.match(home, /min-height:\s*56px/);
  assert.match(home, /font-variant-numeric:\s*tabular-nums/);
  assert.match(home, /Demo shot/i);
});

test('Home audit covers portrait and landscape Night Ladder states', () => {
  const surface = manifest.surfaces.find(({ id }) => id === 'home');
  assert.ok(surface);
  assert.deepEqual(surface.viewportIds, [
    'portrait-wide',
    'portrait-compact',
    'landscape-wide',
    'landscape-compact'
  ]);
  assert.deepEqual(surface.requiredSelectors, [
    'body[data-home-direction="night-ladder"]',
    '.scene',
    '.flight',
    '.place--primary'
  ]);
});
