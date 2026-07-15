import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files = ['home-concept-1.html', 'home-concept-2.html', 'home-concept-3.html'];

test('all three front-page directions present the current Flightglass identity', async () => {
  for (const file of files) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(source, /Flightglass/i, `${file} must name Flightglass`);
    assert.doesNotMatch(source, /StrikeArc|STRIKEARC/, `${file} must not expose the retired product name`);
  }
});

test('all three directions preserve direct, accessible destination links', async () => {
  for (const file of files) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    for (const destination of ['BALL FLIGHT', 'OUTCOME', 'ACADEMY']) {
      assert.match(source, new RegExp(destination, 'i'), `${file} must expose ${destination}`);
    }
    assert.match(source, /prefers-reduced-motion/, `${file} must include reduced-motion parity`);
  }
});
