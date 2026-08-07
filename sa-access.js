// Flightglass v1 access policy.
//
// authorize() is a read-only preflight. consume() is called only after the
// requested result has completed and increments local free usage only when
// { completed: true } is supplied. RevenueCat remains the authority for Pro;
// callers pass its current entitlement as { pro: true }.

export const ACCESS_STATE_KEY = 'sa.access.v1';
export const ACCESS_STATE_VERSION = 1;

export const ACCESS_MOMENTS = Object.freeze([
  'instrument-shot',
  'guided-experiment',
  'guide-answer',
  'pro-history',
]);

export const FREE_LIMITS = Object.freeze({
  'instrument-shot': 10,
  'guided-experiment': 1,
  'guide-answer': 5,
  'pro-history': 0,
});

const MOMENT_SET = new Set(ACCESS_MOMENTS);
const CONSUMABLE_MOMENTS = new Set([
  'instrument-shot',
  'guided-experiment',
  'guide-answer',
]);

const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isCount = value => Number.isSafeInteger(value) && value >= 0;
const pad = value => String(value).padStart(2, '0');
const IDENTIFIER = /^[a-z0-9][a-z0-9._:-]{0,63}$/i;

function dateFrom(value) {
  if (value instanceof Date) return new Date(value.getTime());
  if (value === undefined) return new Date();
  return new Date(value);
}

/** A local-calendar key, intentionally not UTC: the Guide allowance resets at local midnight. */
export function localDayKey(value) {
  const date = dateFrom(value);
  if (Number.isNaN(date.getTime())) throw new TypeError('now must be a valid date');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function defaultState(day) {
  return {
    version: ACCESS_STATE_VERSION,
    usage: {
      'instrument-shot': 0,
      'instrument-identifiers': [],
      'guided-experiment': 0,
      'guide-answer': {
        localDay: day,
        count: 0,
        identifiers: [],
      },
    },
    completedResults: 0,
  };
}

function normalizeState(value, day) {
  if (!isObject(value)
    || value.version !== ACCESS_STATE_VERSION
    || !isObject(value.usage)
    || !isCount(value.usage['instrument-shot'])
    || !isCount(value.usage['guided-experiment'])
    || !isObject(value.usage['guide-answer'])
    || typeof value.usage['guide-answer'].localDay !== 'string'
    || !isCount(value.usage['guide-answer'].count)
    || !isCount(value.completedResults)) {
    return defaultState(day);
  }

  const guide = value.usage['guide-answer'];
  const instrumentIdentifiers = Array.isArray(value.usage['instrument-identifiers'])
    && value.usage['instrument-identifiers'].every(item => typeof item === 'string' && IDENTIFIER.test(item))
    ? [...new Set(value.usage['instrument-identifiers'])].slice(0, FREE_LIMITS['instrument-shot'])
    : [];
  const identifiers = Array.isArray(guide.identifiers)
    && guide.identifiers.every(item => typeof item === 'string' && IDENTIFIER.test(item))
    ? [...new Set(guide.identifiers)].slice(0, FREE_LIMITS['guide-answer'])
    : [];
  return {
    version: ACCESS_STATE_VERSION,
    usage: {
      'instrument-shot': value.usage['instrument-shot'],
      'instrument-identifiers': instrumentIdentifiers,
      'guided-experiment': value.usage['guided-experiment'],
      'guide-answer': {
        localDay: day,
        count: guide.localDay === day ? guide.count : 0,
        identifiers: guide.localDay === day ? identifiers : [],
      },
    },
    completedResults: value.completedResults,
  };
}

function storageOrNull(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage || null;
  } catch (_) {
    return null;
  }
}

function readState(storage, day) {
  const target = storageOrNull(storage);
  if (!target || typeof target.getItem !== 'function') return defaultState(day);
  try {
    const raw = target.getItem(ACCESS_STATE_KEY);
    return raw ? normalizeState(JSON.parse(raw), day) : defaultState(day);
  } catch (_) {
    return defaultState(day);
  }
}

function writeState(storage, state) {
  const target = storageOrNull(storage);
  if (!target || typeof target.setItem !== 'function') return false;
  try {
    target.setItem(ACCESS_STATE_KEY, JSON.stringify(state));
    return true;
  } catch (_) {
    // Local usage is deliberately fail-soft. Store entitlement still owns Pro.
    return false;
  }
}

function detectedNative() {
  try {
    return Boolean(globalThis.window?.Capacitor?.isNativePlatform?.());
  } catch (_) {
    return false;
  }
}

function environment(options = {}) {
  const day = localDayKey(options.now);
  return {
    day,
    native: typeof options.native === 'boolean' ? options.native : detectedNative(),
    pro: options.pro === true,
    identity: typeof options.identity === 'string' && IDENTIFIER.test(options.identity)
      ? options.identity
      : null,
    storage: storageOrNull(options.storage),
  };
}

function assertMoment(moment) {
  if (!MOMENT_SET.has(moment)) throw new TypeError(`Unknown access moment: ${String(moment)}`);
}

function usedFor(moment, state) {
  if (moment === 'guide-answer') return state.usage['guide-answer'].count;
  if (moment === 'pro-history') return 0;
  return state.usage[moment];
}

function decisionFor(moment, state, env) {
  const used = usedFor(moment, state);
  const limit = FREE_LIMITS[moment];
  const demonstratedValue = state.completedResults > 0;

  if (env.pro) {
    return {
      moment,
      allowed: true,
      shouldPaywall: false,
      reason: 'pro-bypass',
      limit,
      used,
      remaining: null,
      consumeAfterCompletion: false,
    };
  }

  // Browser builds are evaluation previews. Only a native shell may hard-gate.
  if (!env.native) {
    return {
      moment,
      allowed: true,
      shouldPaywall: false,
      reason: 'web-preview',
      limit,
      used,
      remaining: null,
      consumeAfterCompletion: false,
    };
  }

  if (moment === 'pro-history') {
    return {
      moment,
      allowed: false,
      shouldPaywall: demonstratedValue,
      reason: demonstratedValue ? 'pro-only' : 'value-required',
      limit,
      used,
      remaining: 0,
      consumeAfterCompletion: false,
    };
  }

  const completedIdentifiers = moment === 'guide-answer'
    ? state.usage['guide-answer'].identifiers
    : moment === 'instrument-shot' ? state.usage['instrument-identifiers'] : [];
  if (env.identity && completedIdentifiers.includes(env.identity)) {
    return {
      moment,
      allowed: true,
      shouldPaywall: false,
      reason: 'already-consumed',
      limit,
      used,
      remaining: Math.max(0, limit - used),
      consumeAfterCompletion: false,
    };
  }

  const remaining = Math.max(0, limit - used);
  const allowed = remaining > 0;
  return {
    moment,
    allowed,
    shouldPaywall: !allowed && demonstratedValue,
    reason: allowed ? 'free' : 'limit-reached',
    limit,
    used,
    remaining,
    consumeAfterCompletion: allowed,
  };
}

function viewOf(state, env) {
  return {
    version: ACCESS_STATE_VERSION,
    platform: env.native ? 'native' : 'web-preview',
    pro: env.pro,
    demonstratedValue: state.completedResults > 0,
    completedResults: state.completedResults,
    usage: {
      'instrument-shot': state.usage['instrument-shot'],
      'guided-experiment': state.usage['guided-experiment'],
      'guide-answer': {
        localDay: state.usage['guide-answer'].localDay,
        count: state.usage['guide-answer'].count,
      },
    },
    limits: { ...FREE_LIMITS },
  };
}

/** Return current access state without mutating usage. */
export function snapshot(options = {}) {
  const env = environment(options);
  return viewOf(readState(env.storage, env.day), env);
}

/** Read-only permission check for one named value moment. */
export function authorize(moment, options = {}) {
  assertMoment(moment);
  const env = environment(options);
  const state = readState(env.storage, env.day);
  return decisionFor(moment, state, env);
}

/**
 * Consume one free use after a completed result.
 *
 * Calling this before completion, on a denied moment, for Pro, or on web never
 * changes storage. This keeps slider starts, cancelled work and failed renders
 * from spending an allowance.
 */
export function consume(moment, options = {}) {
  assertMoment(moment);
  const env = environment(options);
  const state = readState(env.storage, env.day);
  const decision = decisionFor(moment, state, env);

  if (options.completed !== true) {
    return {
      ...decision,
      consumed: false,
      reason: 'result-incomplete',
      state: viewOf(state, env),
    };
  }

  if (!decision.allowed || !CONSUMABLE_MOMENTS.has(moment)
    || env.pro || !env.native || decision.reason === 'already-consumed') {
    return {
      ...decision,
      consumed: false,
      state: viewOf(state, env),
    };
  }

  const next = normalizeState(state, env.day);
  if (moment === 'guide-answer') {
    next.usage['guide-answer'].count += 1;
    if (env.identity) next.usage['guide-answer'].identifiers.push(env.identity);
  } else {
    next.usage[moment] += 1;
    if (moment === 'instrument-shot' && env.identity) {
      next.usage['instrument-identifiers'].push(env.identity);
    }
  }
  next.completedResults += 1;
  writeState(env.storage, next);

  return {
    moment,
    allowed: true,
    shouldPaywall: false,
    reason: 'consumed',
    limit: FREE_LIMITS[moment],
    used: usedFor(moment, next),
    remaining: Math.max(0, FREE_LIMITS[moment] - usedFor(moment, next)),
    consumeAfterCompletion: false,
    consumed: true,
    state: viewOf(next, env),
  };
}

if (typeof window !== 'undefined') {
  window.__sa = window.__sa || {};
  window.__sa.access = {
    authorize,
    consume,
    snapshot,
    moments: ACCESS_MOMENTS,
    limits: FREE_LIMITS,
  };
}
