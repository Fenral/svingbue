// Vendor-independent Flightglass analytics boundary.
//
// The default singleton is a validating no-op. A caller may explicitly create
// a local recorder for development evidence; no network transport, user ID,
// free text or arbitrary metadata is accepted by this module.

export const ANALYTICS_STATE_KEY = 'sa.analytics.v1';
export const ANALYTICS_STATE_VERSION = 1;

export const ALLOWED_EVENTS = Object.freeze([
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

const EVENT_SET = new Set(ALLOWED_EVENTS);
const ACCESS_MOMENTS = new Set([
  'instrument-shot',
  'guided-experiment',
  'guide-answer',
  'pro-history',
]);
const ROUTES = new Set(['home', 'outcome', 'studio', 'guide', 'paywall', 'legal']);
const TIERS = new Set(['monthly', 'annual', 'lifetime']);
const PLATFORMS = new Set(['web', 'web-preview', 'native', 'ios', 'android']);
const RESULTS = new Set(['success', 'cancelled', 'error', 'restored']);
const REASONS = new Set([
  'free',
  'limit-reached',
  'pro-only',
  'value-required',
  'web-preview',
  'pro-bypass',
  'result-incomplete',
  'already-consumed',
]);
const CHANGE_KEYS = new Set([
  'faceAngle',
  'clubPath',
  'attackAngle',
  'dynamicLoft',
  'clubSpeed',
]);
const IDENTIFIER = /^[a-z0-9][a-z0-9._:-]{0,63}$/i;

const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const finite = value => typeof value === 'number' && Number.isFinite(value);
const count = value => Number.isSafeInteger(value) && value >= 0;

const PROPERTY_VALIDATORS = Object.freeze({
  moment: value => ACCESS_MOMENTS.has(value),
  route: value => ROUTES.has(value),
  tier: value => TIERS.has(value),
  platform: value => PLATFORMS.has(value),
  result: value => RESULTS.has(value),
  reason: value => REASONS.has(value),
  changeKey: value => CHANGE_KEYS.has(value),
  questionId: value => typeof value === 'string' && IDENTIFIER.test(value),
  step: value => Number.isInteger(value) && value >= 1 && value <= 20,
  count,
  limit: count,
  remaining: count,
  value: finite,
  previousValue: finite,
  delta: finite,
  pro: value => typeof value === 'boolean',
  completed: value => typeof value === 'boolean',
  restored: value => typeof value === 'boolean',
});

function sanitizeProperties(properties) {
  if (properties === undefined) return {};
  if (!isObject(properties)) return null;

  const clean = {};
  for (const [key, value] of Object.entries(properties)) {
    const validate = PROPERTY_VALIDATORS[key];
    if (!validate || !validate(value)) return null;
    clean[key] = value;
  }
  return clean;
}

function storageOrNull(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage || null;
  } catch (_) {
    return null;
  }
}

function defaultState() {
  return { version: ANALYTICS_STATE_VERSION, events: [] };
}

function validStoredEvent(event) {
  if (!isObject(event)
    || event.version !== ANALYTICS_STATE_VERSION
    || !EVENT_SET.has(event.name)
    || typeof event.at !== 'string'
    || Number.isNaN(Date.parse(event.at))) return false;
  return sanitizeProperties(event.properties) !== null;
}

function readState(storage) {
  if (!storage || typeof storage.getItem !== 'function') return defaultState();
  try {
    const raw = storage.getItem(ANALYTICS_STATE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!isObject(parsed)
      || parsed.version !== ANALYTICS_STATE_VERSION
      || !Array.isArray(parsed.events)
      || !parsed.events.every(validStoredEvent)) return defaultState();
    return {
      version: ANALYTICS_STATE_VERSION,
      events: parsed.events.map(event => ({
        version: ANALYTICS_STATE_VERSION,
        name: event.name,
        at: event.at,
        properties: { ...event.properties },
      })),
    };
  } catch (_) {
    return defaultState();
  }
}

function writeState(storage, state) {
  if (!storage || typeof storage.setItem !== 'function') return false;
  try {
    storage.setItem(ANALYTICS_STATE_KEY, JSON.stringify(state));
    return true;
  } catch (_) {
    return false;
  }
}

function timestamp(now) {
  try {
    const value = typeof now === 'function' ? now() : now;
    const date = value === undefined ? new Date() : new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  } catch (_) {
    return new Date().toISOString();
  }
}

/** Create a validating no-op or bounded local development recorder. */
export function createAnalytics({ mode = 'noop', storage, now, maxEvents = 100 } = {}) {
  const captureLocally = mode === 'local';
  const target = storageOrNull(storage);
  const bound = Number.isSafeInteger(maxEvents) && maxEvents > 0 ? maxEvents : 100;

  return Object.freeze({
    mode: captureLocally ? 'local' : 'noop',

    track(name, properties) {
      if (!EVENT_SET.has(name)) return false;
      const clean = sanitizeProperties(properties);
      if (clean === null) return false;
      if (!captureLocally) return true;

      const state = readState(target);
      state.events.push({
        version: ANALYTICS_STATE_VERSION,
        name,
        at: timestamp(now),
        properties: clean,
      });
      state.events = state.events.slice(-bound);
      writeState(target, state);
      return true;
    },

    snapshot() {
      const state = captureLocally ? readState(target) : defaultState();
      return {
        version: ANALYTICS_STATE_VERSION,
        mode: captureLocally ? 'local' : 'noop',
        events: state.events.map(event => ({
          ...event,
          properties: { ...event.properties },
        })),
      };
    },

    clear() {
      if (!captureLocally || !target || typeof target.removeItem !== 'function') return;
      try { target.removeItem(ANALYTICS_STATE_KEY); } catch (_) { /* no-op */ }
    },
  });
}

const defaultAnalytics = createAnalytics();

export const track = (name, properties) => defaultAnalytics.track(name, properties);
export const analyticsSnapshot = () => defaultAnalytics.snapshot();
export const clearAnalytics = () => defaultAnalytics.clear();

if (typeof window !== 'undefined') {
  window.__sa = window.__sa || {};
  window.__sa.analytics = {
    track,
    snapshot: analyticsSnapshot,
    clear: clearAnalytics,
    allowedEvents: ALLOWED_EVENTS,
  };
}
