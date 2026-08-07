import { solveFlight } from './impact-flight.js';

export const CONTEXT_KEY = 'sa.v1.context';
export const CONTEXT_VERSION = 1;

const YARD_TO_METRE = 0.9144;
const GOALS = new Set(['straighter', 'distance', 'contact', 'trajectory']);
const HANDEDNESS = new Set(['right', 'left']);
const EXPERIENCE = new Set(['new', 'improving', 'experienced']);
const CLUBS = new Set(['driver', '7iron', 'wedge']);
const STARTS = new Set(['left', 'straight', 'right']);
const CURVES = new Set(['left', 'straight', 'right']);
const FLIGHTS = new Set(['low', 'neutral', 'high']);

const CLUB_PRESETS = Object.freeze({
  driver: Object.freeze({ club: 'driver', clubSpeed: 98, dynamicLoft: 14, attackAngle: 2 }),
  '7iron': Object.freeze({ club: '7iron', clubSpeed: 80, dynamicLoft: 31, attackAngle: -4 }),
  wedge: Object.freeze({ club: 'wedge', clubSpeed: 70, dynamicLoft: 46, attackAngle: -6 }),
});

const START_FACE = Object.freeze({ left: -3, straight: 0, right: 3 });
const CURVE_PATH_OFFSET = Object.freeze({ left: 3, straight: 0, right: -3 });
const FLIGHT_ADJUSTMENT = Object.freeze({
  low: Object.freeze({ dynamicLoft: -4, attackAngle: -1 }),
  neutral: Object.freeze({ dynamicLoft: 0, attackAngle: 0 }),
  high: Object.freeze({ dynamicLoft: 4, attackAngle: 1 }),
});
const RANGE_LIMITS = Object.freeze({
  clubPath: Object.freeze([-15, 15]),
  faceAngle: Object.freeze([-15, 15]),
  attackAngle: Object.freeze([-15, 15]),
  dynamicLoft: Object.freeze([0, 50]),
  clubSpeed: Object.freeze([30, 150]),
});
const EXPERIMENT_KEYS = new Set(['faceAngle', 'clubPath', 'attackAngle', 'dynamicLoft', 'clubSpeed']);

const roundOne = value => Math.round(Number(value) * 10) / 10;
const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const finite = value => typeof value === 'number' && Number.isFinite(value);
const enumOrNull = (value, choices) => choices.has(value) ? value : null;
const stringOrNull = value => typeof value === 'string' && value.trim() ? value : null;

function cloneJSON(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return null;
  }
}

function storageOrNull(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage || null;
  } catch (_) {
    return null;
  }
}

export function isRangeInputs(value) {
  if (!isObject(value) || !CLUBS.has(value.club)) return false;
  return Object.entries(RANGE_LIMITS).every(([key, [minimum, maximum]]) => (
    finite(value[key]) && value[key] >= minimum && value[key] <= maximum
  ));
}

function validResult(value) {
  return isObject(value)
    && typeof value.shape === 'string'
    && finite(value.carryM)
    && finite(value.totalM)
    && finite(value.offlineM)
    && finite(value.curveM)
    && finite(value.startDirectionDeg)
    && finite(value.launchAngleDeg)
    && finite(value.faceToPathDeg);
}

function validShot(value) {
  return isObject(value)
    && typeof value.id === 'string'
    && typeof value.createdAt === 'string'
    && value.source === 'guided-onboarding'
    && value.modelled === true
    && isRangeInputs(value.inputs)
    && validResult(value.result);
}

function validExperiment(value) {
  return isObject(value)
    && typeof value.id === 'string'
    && typeof value.sourceShotId === 'string'
    && EXPERIMENT_KEYS.has(value.changeKey)
    && typeof value.instruction === 'string'
    && isRangeInputs(value.inputs);
}

export function createDefaultContext() {
  return {
    version: CONTEXT_VERSION,
    onboarding: {
      complete: false,
      step: 1,
      dismissed: false,
      labLoft: 24,
      goal: null,
      handedness: null,
      experience: null,
      draftShot: {
        club: null,
        start: null,
        curve: null,
        flight: null,
      },
    },
    currentShot: null,
    lastExperiment: null,
    jarvis: {
      selectedQuestionId: null,
      recommendedRoute: null,
    },
  };
}

// Safari private mode and embedded WebViews can expose localStorage while
// throwing on reads or writes. Preserve validated state for the lifetime of
// the current document so consecutive onboarding choices do not erase one
// another. WeakMap keeps injected/test storage owners isolated and collectible.
const volatileContexts = new WeakMap();
const dirtyStorageTargets = new WeakSet();
let fallbackContext = createDefaultContext();

const weakTarget = target => Boolean(target)
  && (typeof target === 'object' || typeof target === 'function');

function cachedContext(target) {
  if (weakTarget(target)) {
    return volatileContexts.get(target) || null;
  }
  return fallbackContext;
}

function rememberContext(target, value) {
  const safe = validateContext(value);
  if (weakTarget(target)) {
    volatileContexts.set(target, safe);
  } else {
    fallbackContext = safe;
  }
  return safe;
}

export function validateContext(value) {
  if (!isObject(value) || value.version !== CONTEXT_VERSION) {
    return createDefaultContext();
  }

  const defaults = createDefaultContext();
  const onboarding = isObject(value.onboarding) ? value.onboarding : {};
  const jarvis = isObject(value.jarvis) ? value.jarvis : {};
  const rawStep = Number(onboarding.step);
  const currentShot = validShot(value.currentShot) ? cloneJSON(value.currentShot) : null;
  const lastExperiment = currentShot
    && validExperiment(value.lastExperiment)
    && value.lastExperiment.sourceShotId === currentShot.id
    ? cloneJSON(value.lastExperiment)
    : null;

  return {
    version: CONTEXT_VERSION,
    onboarding: {
      complete: onboarding.complete === true,
      step: Number.isInteger(rawStep) && rawStep >= 1 && rawStep <= 4
        ? rawStep
        : defaults.onboarding.step,
      dismissed: onboarding.dismissed === true,
      labLoft: Number.isInteger(onboarding.labLoft)
        && onboarding.labLoft >= 16
        && onboarding.labLoft <= 34
        ? onboarding.labLoft
        : defaults.onboarding.labLoft,
      goal: enumOrNull(onboarding.goal, GOALS),
      handedness: enumOrNull(onboarding.handedness, HANDEDNESS),
      experience: enumOrNull(onboarding.experience, EXPERIENCE),
      draftShot: {
        club: enumOrNull(onboarding.draftShot?.club, CLUBS),
        start: enumOrNull(onboarding.draftShot?.start, STARTS),
        curve: enumOrNull(onboarding.draftShot?.curve, CURVES),
        flight: enumOrNull(onboarding.draftShot?.flight, FLIGHTS),
      },
    },
    currentShot,
    lastExperiment,
    jarvis: {
      selectedQuestionId: stringOrNull(jarvis.selectedQuestionId),
      recommendedRoute: ['range', 'studio'].includes(jarvis.recommendedRoute)
        ? jarvis.recommendedRoute
        : null,
    },
  };
}

export function readContext(storage) {
  const target = storageOrNull(storage);
  if (!target || typeof target.getItem !== 'function') {
    return validateContext(cachedContext(target));
  }

  // Once a write fails, the persisted value is older than the validated
  // in-memory context. Keep reading that volatile owner until a later write
  // succeeds; otherwise a readable-but-unwritable store can roll back the
  // user's next onboarding choice to stale disk state.
  if (weakTarget(target) && dirtyStorageTargets.has(target)) {
    return validateContext(cachedContext(target));
  }

  try {
    const raw = target.getItem(CONTEXT_KEY);
    if (raw) return rememberContext(target, JSON.parse(raw));
    return validateContext(cachedContext(target));
  } catch (_) {
    return validateContext(cachedContext(target));
  }
}

function mergeContext(current, patch) {
  const next = {
    ...current,
    ...(isObject(patch) ? patch : {}),
    version: CONTEXT_VERSION,
    onboarding: {
      ...current.onboarding,
      ...(isObject(patch?.onboarding) ? patch.onboarding : {}),
      draftShot: {
        ...current.onboarding.draftShot,
        ...(isObject(patch?.onboarding?.draftShot) ? patch.onboarding.draftShot : {}),
      },
    },
    jarvis: {
      ...current.jarvis,
      ...(isObject(patch?.jarvis) ? patch.jarvis : {}),
    },
  };
  return validateContext(next);
}

export function updateContext(patch, storage) {
  const target = storageOrNull(storage);
  const next = rememberContext(target, mergeContext(readContext(target), patch));

  if (target && typeof target.setItem === 'function') {
    try {
      target.setItem(CONTEXT_KEY, JSON.stringify(next));
      if (weakTarget(target)) dirtyStorageTargets.delete(target);
    } catch (_) {
      // Private mode and embedded browsers may disable storage. The validated
      // in-memory result still keeps the current interaction usable.
      if (weakTarget(target)) dirtyStorageTargets.add(target);
    }
  } else if (weakTarget(target)) {
    dirtyStorageTargets.add(target);
  }

  return next;
}

function requireChoice(value, choices, label) {
  if (!choices.has(value)) throw new TypeError(`${label} is not a guided preset`);
  return value;
}

function sideLabel(value, threshold = 1) {
  if (value > threshold) return 'right';
  if (value < -threshold) return 'left';
  return 'straight';
}

function relationshipFor(engine) {
  const start = sideLabel(engine.startDirection, 1);
  const curve = sideLabel(engine.curve * YARD_TO_METRE, 0.75);
  const face = engine.faceAngle > 0.5 ? 'right of target'
    : engine.faceAngle < -0.5 ? 'left of target'
      : 'close to the target line';
  const gap = engine.faceToPath > 0.5 ? 'right of the path'
    : engine.faceToPath < -0.5 ? 'left of the path'
      : 'close to the path';
  const curveClause = curve === 'straight' ? 'stays straight' : `curves ${curve}`;

  return `This model starts ${start} because the delivered face is ${face}. `
    + `The face is ${gap}, so it ${curveClause}.`;
}

export function buildGuidedShot(selections, now = Date.now()) {
  const club = requireChoice(selections?.club, CLUBS, 'club');
  const start = requireChoice(selections?.start, STARTS, 'start');
  const curve = requireChoice(selections?.curve, CURVES, 'curve');
  const flight = requireChoice(selections?.flight, FLIGHTS, 'flight');
  const preset = CLUB_PRESETS[club];
  const flightAdjustment = FLIGHT_ADJUSTMENT[flight];
  const faceAngle = START_FACE[start];
  const inputs = {
    clubPath: roundOne(faceAngle + CURVE_PATH_OFFSET[curve]),
    faceAngle: roundOne(faceAngle),
    attackAngle: roundOne(preset.attackAngle + flightAdjustment.attackAngle),
    dynamicLoft: roundOne(preset.dynamicLoft + flightAdjustment.dynamicLoft),
    clubSpeed: preset.clubSpeed,
    club: preset.club,
  };
  const engine = solveFlight(inputs);
  const timestamp = Number.isFinite(Number(now)) ? Number(now) : Date.now();
  const createdAt = new Date(timestamp).toISOString();
  const result = {
    shape: engine.shape,
    carryM: roundOne(engine.carry * YARD_TO_METRE),
    totalM: roundOne(engine.total * YARD_TO_METRE),
    offlineM: roundOne(engine.offline * YARD_TO_METRE),
    curveM: roundOne(engine.curve * YARD_TO_METRE),
    startDirectionDeg: roundOne(engine.startDirection),
    launchAngleDeg: roundOne(engine.launchAngle),
    faceToPathDeg: roundOne(engine.faceToPath),
    startLabel: sideLabel(engine.startDirection, 1),
    curveLabel: sideLabel(engine.curve * YARD_TO_METRE, 0.75),
    finishLabel: sideLabel(engine.offline * YARD_TO_METRE, 0.75),
    relationship: relationshipFor(engine),
  };

  return {
    id: `guided-${timestamp.toString(36)}-${club}-${start}-${curve}-${flight}`,
    createdAt,
    source: 'guided-onboarding',
    modelled: true,
    observations: { club, start, curve, flight },
    inputs,
    result,
  };
}

export function deriveNextExperiment(shot) {
  if (!validShot(shot)) throw new TypeError('A valid guided shot is required');

  const inputs = { ...shot.inputs };
  const start = shot.result.startDirectionDeg;
  const gap = shot.result.faceToPathDeg;
  let delta;
  let instruction;

  if (Math.abs(start) >= 1.5) {
    delta = start > 0 ? -1.5 : 1.5;
    instruction = `Move the face 1.5° less ${start > 0 ? 'right' : 'left'}. Keep the path unchanged.`;
  } else if (Math.abs(gap) >= 0.75) {
    delta = gap > 0 ? -1.5 : 1.5;
    instruction = `Move the face 1.5° closer to the path. Keep every other input unchanged.`;
  } else {
    delta = 1;
    instruction = 'Move the face 1° right. Keep every other input unchanged and compare the start line.';
  }

  inputs.faceAngle = roundOne(inputs.faceAngle + delta);
  return {
    id: `${shot.id}:face:${inputs.faceAngle}`,
    sourceShotId: shot.id,
    changeKey: 'faceAngle',
    delta: roundOne(delta),
    instruction,
    inputs,
  };
}

export function rangeInputsFromContext(context, useExperiment = false) {
  const safe = validateContext(context);
  const candidate = useExperiment ? safe.lastExperiment?.inputs : safe.currentShot?.inputs;
  return isRangeInputs(candidate) ? { ...candidate } : null;
}
