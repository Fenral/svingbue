import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files = [
  'home-portrait-1.html',
  'home-portrait-2.html',
  'home-portrait-3.html',
];

test('portrait directions are current-brand, portrait-native entry surfaces', async () => {
  for (const file of files) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(source, /Flightglass/i, `${file} must name Flightglass`);
    assert.match(source, /375|430/, `${file} must explicitly account for a portrait target width`);
    assert.match(source, /prefers-reduced-motion/, `${file} must include reduced-motion parity`);
    assert.match(source, /viewport-fit=cover/, `${file} must respect native safe areas`);
    assert.doesNotMatch(source, /StrikeArc|STRIKEARC/, `${file} must not expose the retired product name`);
  }
});

test('every portrait direction exposes the product territories without an account gate', async () => {
  for (const file of files) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    for (const territory of ['Range', 'Outcome', 'Lab', 'Academy']) {
      assert.match(source, new RegExp(territory, 'i'), `${file} must expose ${territory}`);
    }
    assert.doesNotMatch(source, /sign[ -]?in|log[ -]?in|create account/i, `${file} must stay instant-access`);
  }
});
