import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ios = readFileSync(new URL('./ios-landscape.mjs', import.meta.url), 'utf8');
const android = readFileSync(new URL('./android-landscape.mjs', import.meta.url), 'utf8');
const nativeDoc = readFileSync(new URL('../NATIVE.md', import.meta.url), 'utf8');

test('iOS platform advertises both portrait and landscape for route-level locking', () => {
  for (const orientation of [
    'UIInterfaceOrientationPortrait',
    'UIInterfaceOrientationPortraitUpsideDown',
    'UIInterfaceOrientationLandscapeLeft',
    'UIInterfaceOrientationLandscapeRight',
  ]) assert.match(ios, new RegExp(`'${orientation}'`));
  assert.match(ios, /SUPPORTED_ORIENTATIONS/);
});

test('Android allows the sensor while the active route owns its orientation', () => {
  assert.match(android, /const ORIENTATION = 'fullSensor'/);
  assert.doesNotMatch(android, /const ORIENTATION = 'sensorLandscape'/);
});

test('native documentation records portrait Impact and progressive web fallback', () => {
  assert.match(nativeDoc, /Impact requests portrait/i);
  assert.match(nativeDoc, /route-level/i);
  assert.match(nativeDoc, /sa-orientation\.js/);
});
