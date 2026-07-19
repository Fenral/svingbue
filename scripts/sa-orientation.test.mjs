import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrientationController } from '../sa-orientation.js';

test('native bridge registers ScreenOrientation and requests portrait', async () => {
  const calls = [];
  const plugin = {
    async lock(options) { calls.push(['lock', options]); },
    async unlock() { calls.push(['unlock']); },
  };
  const registered = [];
  const capacitor = {
    isNativePlatform: () => true,
    Plugins: {},
    registerPlugin(name) { registered.push(name); this.Plugins[name] = plugin; return plugin; },
  };
  const controller = createOrientationController({ capacitor });
  assert.equal(await controller.lock('portrait'), 'native');
  assert.deepEqual(registered, ['ScreenOrientation']);
  assert.deepEqual(calls, [['lock', { orientation: 'portrait' }]]);
  assert.equal(await controller.release(), 'native');
  assert.deepEqual(calls.at(-1), ['unlock']);
});

test('web uses the browser orientation API when available', async () => {
  const calls = [];
  const screenOrientation = {
    async lock(value) { calls.push(['lock', value]); },
    unlock() { calls.push(['unlock']); },
  };
  const controller = createOrientationController({
    capacitor: { isNativePlatform: () => false },
    screenOrientation,
  });
  assert.equal(await controller.lock('portrait'), 'web');
  assert.equal(await controller.release(), 'web');
  assert.deepEqual(calls, [['lock', 'portrait'], ['unlock']]);
});

test('unsupported browsers fail open and never block page rendering', async () => {
  const controller = createOrientationController({});
  assert.equal(await controller.lock('portrait'), 'unsupported');
  assert.equal(await controller.release(), 'unsupported');
});

test('install releases the route lock on pagehide and cleanup removes the listener', async () => {
  let pagehide = null;
  const removed = [];
  const calls = [];
  const controller = createOrientationController({
    screenOrientation: {
      async lock(value) { calls.push(['lock', value]); },
      unlock() { calls.push(['unlock']); },
    },
    addEventListener(type, handler) { assert.equal(type, 'pagehide'); pagehide = handler; },
    removeEventListener(type, handler) { removed.push([type, handler]); },
  });
  const cleanup = await controller.install('portrait');
  assert.equal(typeof cleanup, 'function');
  await pagehide();
  assert.deepEqual(calls, [['lock', 'portrait'], ['unlock']]);
  cleanup();
  assert.deepEqual(removed, [['pagehide', pagehide]]);
});
