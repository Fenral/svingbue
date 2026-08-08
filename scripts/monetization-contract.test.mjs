import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ACCESS_STATE_KEY,
  ACCESS_STATE_VERSION,
  FREE_LIMITS,
  authorize,
  consume,
  localDayKey,
  snapshot,
} from '../sa-access.js';
import {
  ALLOWED_EVENTS,
  ANALYTICS_STATE_KEY,
  ANALYTICS_STATE_VERSION,
  createAnalytics,
} from '../sa-analytics.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => readFileSync(join(ROOT, relativePath), 'utf8');

class MemoryStorage {
  constructor(seed = {}) {
    this.values = new Map(Object.entries(seed));
    this.writes = [];
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.writes.push(key);
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

const DAY_ONE = new Date(2026, 7, 7, 12, 0, 0);
const DAY_TWO = new Date(2026, 7, 8, 0, 1, 0);
const nativeFree = (storage, now = DAY_ONE) => ({ storage, now, native: true, pro: false });

test('the paywall defers every unresolved amount to the localized store price', () => {
  const paywall = read('sa-paywall.js');

  assert.match(paywall, /const STORE_PRICE_PLACEHOLDER = 'Store price';/);
  assert.match(paywall, /product\?\.priceString \|\| STORE_PRICE_PLACEHOLDER/);
  assert.match(paywall, /product\?\.priceString \? 'store' : 'unresolved'/);
  assert.doesNotMatch(paywall, /\b(?:NOK|kr)\s*[\d.,]/i);
});

test('cold native state exposes value before price and does not mutate on authorize', () => {
  const storage = new MemoryStorage();

  assert.deepEqual(snapshot(nativeFree(storage)), {
    version: ACCESS_STATE_VERSION,
    platform: 'native',
    pro: false,
    demonstratedValue: false,
    completedResults: 0,
    usage: {
      'instrument-shot': 0,
      'guided-experiment': 0,
      'guide-answer': { localDay: localDayKey(DAY_ONE), count: 0 },
    },
    limits: { ...FREE_LIMITS },
  });

  assert.equal(authorize('instrument-shot', nativeFree(storage)).allowed, true);
  assert.equal(authorize('guided-experiment', nativeFree(storage)).allowed, true);
  assert.equal(authorize('guide-answer', nativeFree(storage)).allowed, true);
  assert.deepEqual(authorize('pro-history', nativeFree(storage)), {
    moment: 'pro-history',
    allowed: false,
    shouldPaywall: false,
    reason: 'value-required',
    limit: 0,
    used: 0,
    remaining: 0,
    consumeAfterCompletion: false,
  });
  assert.equal(storage.writes.length, 0, 'authorization is read-only');
});

test('usage is consumed only after a completed result', () => {
  const storage = new MemoryStorage();
  const options = nativeFree(storage);

  const started = authorize('instrument-shot', options);
  assert.equal(started.consumeAfterCompletion, true);
  assert.equal(consume('instrument-shot', { ...options, completed: false }).consumed, false);
  assert.equal(snapshot(options).usage['instrument-shot'], 0);

  const finished = consume('instrument-shot', { ...options, completed: true });
  assert.equal(finished.consumed, true);
  assert.equal(finished.persistence, 'persistent');
  assert.equal(finished.used, 1);
  assert.equal(finished.remaining, 9);
  assert.equal(finished.shouldPaywall, false, 'a completed free result never opens a paywall');
  assert.equal(snapshot(options).demonstratedValue, true);
  assert.equal(authorize('pro-history', options).shouldPaywall, true);
});

test('native quota remains enforced in volatile memory when storage writes fail', () => {
  const seeded = {
    version: ACCESS_STATE_VERSION,
    usage: {
      'instrument-shot': 9,
      'instrument-identifiers': [],
      'guided-experiment': 0,
      'guide-answer': { localDay: localDayKey(DAY_ONE), count: 0, identifiers: [] },
    },
    completedResults: 9,
  };
  const storage = {
    getItem(key) {
      return key === ACCESS_STATE_KEY ? JSON.stringify(seeded) : null;
    },
    setItem() {
      throw new Error('storage became read-only');
    },
  };
  const options = nativeFree(storage);

  const tenth = consume('instrument-shot', { ...options, completed: true });
  assert.equal(tenth.consumed, true);
  assert.equal(tenth.persistence, 'volatile');
  assert.equal(tenth.used, 10);

  const eleventh = authorize('instrument-shot', options);
  assert.equal(eleventh.allowed, false);
  assert.equal(eleventh.used, 10);
  assert.equal(eleventh.shouldPaywall, true);
  assert.equal(snapshot(options).completedResults, 10);
});

test('native free users receive exactly ten Range comparisons before the eleventh gate', () => {
  const storage = new MemoryStorage();
  const options = nativeFree(storage);

  for (let index = 0; index < 10; index += 1) {
    assert.equal(authorize('instrument-shot', options).allowed, true);
    assert.equal(consume('instrument-shot', { ...options, completed: true }).consumed, true);
  }

  const eleventh = authorize('instrument-shot', options);
  assert.equal(eleventh.allowed, false);
  assert.equal(eleventh.used, 10);
  assert.equal(eleventh.remaining, 0);
  assert.equal(eleventh.shouldPaywall, true);
  assert.equal(consume('instrument-shot', { ...options, completed: true }).consumed, false);
  assert.equal(snapshot(options).usage['instrument-shot'], 10);
});

test('pinning the same Range setup twice does not spend another comparison', () => {
  const storage = new MemoryStorage();
  const options = { ...nativeFree(storage), identity: 'shot:2.00:0.00:3.00:24.00:90.00' };

  assert.equal(consume('instrument-shot', { ...options, completed: true }).consumed, true);
  assert.equal(authorize('instrument-shot', options).reason, 'already-consumed');
  assert.equal(consume('instrument-shot', { ...options, completed: true }).consumed, false);
  assert.equal(snapshot(options).usage['instrument-shot'], 1);
});

test('the second guided Studio experiment is the first gated experiment', () => {
  const storage = new MemoryStorage();
  const options = nativeFree(storage);

  assert.equal(consume('guided-experiment', { ...options, completed: true }).consumed, true);
  const second = authorize('guided-experiment', options);
  assert.equal(second.allowed, false);
  assert.equal(second.shouldPaywall, true);
  assert.equal(second.used, 1);
});

test('Guide allows five completed answers per local calendar day and resets at local midnight', () => {
  const storage = new MemoryStorage();
  const firstDay = nativeFree(storage, DAY_ONE);

  for (let index = 0; index < 5; index += 1) {
    assert.equal(consume('guide-answer', { ...firstDay, completed: true }).consumed, true);
  }
  assert.equal(authorize('guide-answer', firstDay).allowed, false);
  assert.equal(authorize('guide-answer', firstDay).shouldPaywall, true);

  const secondDay = nativeFree(storage, DAY_TWO);
  const reset = authorize('guide-answer', secondDay);
  assert.equal(reset.allowed, true);
  assert.equal(reset.used, 0);
  assert.equal(reset.remaining, 5);
  assert.equal(snapshot(secondDay).completedResults, 5, 'daily reset preserves demonstrated value');
  assert.equal(consume('guide-answer', { ...secondDay, completed: true }).used, 1);
});

test('reopening the same guided answer does not spend the daily allowance twice', () => {
  const storage = new MemoryStorage();
  const options = { ...nativeFree(storage), identity: 'curve-right' };

  assert.equal(consume('guide-answer', { ...options, completed: true }).consumed, true);
  const reopened = authorize('guide-answer', options);
  assert.equal(reopened.allowed, true);
  assert.equal(reopened.reason, 'already-consumed');
  assert.equal(reopened.consumeAfterCompletion, false);
  assert.equal(consume('guide-answer', { ...options, completed: true }).consumed, false);
  assert.equal(snapshot(options).usage['guide-answer'].count, 1);
});

test('Pro and web preview bypass every gate without consuming local allowance', () => {
  const exhausted = {
    version: ACCESS_STATE_VERSION,
    usage: {
      'instrument-shot': 10,
      'guided-experiment': 1,
      'guide-answer': { localDay: localDayKey(DAY_ONE), count: 5 },
    },
    completedResults: 16,
  };

  for (const options of [
    { storage: new MemoryStorage({ [ACCESS_STATE_KEY]: JSON.stringify(exhausted) }), now: DAY_ONE, native: true, pro: true },
    { storage: new MemoryStorage({ [ACCESS_STATE_KEY]: JSON.stringify(exhausted) }), now: DAY_ONE, native: false, pro: false },
  ]) {
    for (const moment of Object.keys(FREE_LIMITS)) {
      const decision = authorize(moment, options);
      assert.equal(decision.allowed, true, `${moment} bypasses`);
      assert.equal(decision.shouldPaywall, false, `${moment} never prompts in bypass mode`);
      assert.equal(consume(moment, { ...options, completed: true }).consumed, false);
    }
    assert.deepEqual(snapshot(options).usage, exhausted.usage);
  }
});

test('corrupt and wrong-version access storage fail safely to a fresh allowance', () => {
  for (const value of [
    '{broken',
    JSON.stringify({ version: 999, usage: {}, completedResults: 200 }),
    JSON.stringify({
      version: ACCESS_STATE_VERSION,
      usage: {
        'instrument-shot': -1,
        'guided-experiment': 0,
        'guide-answer': { localDay: localDayKey(DAY_ONE), count: 0 },
      },
      completedResults: 0,
    }),
  ]) {
    const storage = new MemoryStorage({ [ACCESS_STATE_KEY]: value });
    const state = snapshot(nativeFree(storage));
    assert.equal(state.usage['instrument-shot'], 0);
    assert.equal(state.usage['guided-experiment'], 0);
    assert.equal(state.usage['guide-answer'].count, 0);
    assert.equal(state.demonstratedValue, false);
    assert.equal(authorize('instrument-shot', nativeFree(storage)).allowed, true);
  }
});

test('unknown access moments fail closed at the API boundary', () => {
  assert.throws(() => authorize('cold-launch', nativeFree(new MemoryStorage())), /Unknown access moment/);
  assert.throws(() => consume('free-text', { ...nativeFree(new MemoryStorage()), completed: true }), /Unknown access moment/);
});

test('the analytics interface accepts exactly the TECH_SPEC event allowlist', () => {
  assert.deepEqual(ALLOWED_EVENTS, [
    'onboarding_started',
    'onboarding_completed',
    'onboarding_lab_changed',
    'live_model_opened',
    'shot_saved',
    'impact_opened',
    'experiment_started',
    'experiment_completed',
    'jarvis_question_selected',
    'jarvis_answer_seen',
    'paywall_seen',
    'purchase_started',
    'purchase_completed',
    'restore_completed',
  ]);

  const analytics = createAnalytics();
  for (const event of ALLOWED_EVENTS) assert.equal(analytics.track(event), true, event);
  assert.equal(analytics.track('screen_view'), false);
  assert.equal(analytics.track('first_shot_completed'), false);
  assert.deepEqual(analytics.snapshot(), {
    version: ANALYTICS_STATE_VERSION,
    mode: 'noop',
    events: [],
  });
});

test('local analytics stores bounded structured metadata and rejects free text or PII', () => {
  const storage = new MemoryStorage();
  const analytics = createAnalytics({
    mode: 'local',
    storage,
    now: () => '2026-08-07T10:00:00.000Z',
    maxEvents: 2,
  });

  assert.equal(analytics.track('impact_opened', { route: 'outcome', platform: 'native' }), true);
  assert.equal(analytics.track('paywall_seen', {
    moment: 'instrument-shot',
    count: 10,
    limit: 10,
    remaining: 0,
  }), true);
  assert.equal(analytics.track('purchase_started', { tier: 'annual' }), true);

  for (const properties of [
    { note: 'I hit it thin today' },
    { email: 'golfer@example.com' },
    { prompt: 'Why did my shot slice?' },
    { questionId: 'contains spaces and free text' },
    { route: { nested: 'payload' } },
  ]) {
    assert.equal(analytics.track('jarvis_answer_seen', properties), false);
  }

  const state = analytics.snapshot();
  assert.equal(state.events.length, 2, 'local evidence is bounded');
  assert.deepEqual(state.events.map(event => event.name), ['paywall_seen', 'purchase_started']);
  assert.equal(state.events[0].at, '2026-08-07T10:00:00.000Z');
  assert.equal(JSON.stringify(state).includes('golfer@example.com'), false);
  assert.equal(storage.writes.every(key => key === ANALYTICS_STATE_KEY), true);
});

test('corrupt local analytics storage resets without leaking the invalid payload', () => {
  const storage = new MemoryStorage({ [ANALYTICS_STATE_KEY]: '{broken' });
  const analytics = createAnalytics({ mode: 'local', storage });
  assert.deepEqual(analytics.snapshot().events, []);
  assert.equal(analytics.track('onboarding_started', { step: 1 }), true);
  assert.deepEqual(analytics.snapshot().events.map(event => event.name), ['onboarding_started']);
});
