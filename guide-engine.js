/**
 * Flightglass Guide's deliberately small read-only boundary around the
 * shipping ball-flight outcome.  Guide is allowed to explain the model and
 * compare valid deliveries; it is not allowed to adjust, fit or supplement
 * physics on its own.
 */

import { selectOutcome } from './impact-outcome.js';
import { validateContext, rangeInputsFromContext } from './sa-v1-context.js';

const INPUT_LIMITS = Object.freeze({
  face: Object.freeze([-15, 15]),
  path: Object.freeze([-15, 15]),
  attack: Object.freeze([-15, 15]),
  dynLoft: Object.freeze([0, 50]),
  speed: Object.freeze([30, 150]),
});

const INPUT_KEYS = Object.freeze(Object.keys(INPUT_LIMITS));

const METRICS = Object.freeze({
  carry_m: outcome => outcome.m.carry,
  total_m: outcome => outcome.m.total,
  apex_m: outcome => outcome.m.apex,
  curve_m: outcome => outcome.m.curve,
  side_m: outcome => outcome.m.side,
  launch_direction_deg: outcome => outcome.deg.launchDir,
  spin_axis_deg: outcome => outcome.deg.spinAxis,
  launch_angle_deg: outcome => outcome.deg.launchAng,
  spin_loft_deg: outcome => outcome.deg.spinLoft,
  landing_angle_deg: outcome => outcome.deg.landAng,
  backspin_rpm: outcome => outcome.misc.backspin,
  ball_speed_mph: outcome => outcome.misc.ballSpeed,
  smash: outcome => outcome.misc.smash,
  // This is an outcome relationship, rather than a parallel start-line fit.
  start_side_m: outcome => outcome.m.side - outcome.m.curve,
  // Dot-path aliases make the authoritative Outcome shape available without
  // leaking implementation-specific unit labels into every Guide question.
  'm.carry': outcome => outcome.m.carry,
  'm.total': outcome => outcome.m.total,
  'm.apex': outcome => outcome.m.apex,
  'm.curve': outcome => outcome.m.curve,
  'm.side': outcome => outcome.m.side,
  'deg.launchDir': outcome => outcome.deg.launchDir,
  'deg.spinAxis': outcome => outcome.deg.spinAxis,
  'deg.launchAng': outcome => outcome.deg.launchAng,
  'deg.spinLoft': outcome => outcome.deg.spinLoft,
  'deg.landAng': outcome => outcome.deg.landAng,
  'misc.backspin': outcome => outcome.misc.backspin,
  'misc.ballSpeed': outcome => outcome.misc.ballSpeed,
  'misc.smash': outcome => outcome.misc.smash,
});

function requireFiniteNumber(value, key) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`Guide input ${key} must be a finite number`);
  }
  return value;
}

/**
 * Returns a new five-field object only when it is already inside the existing
 * Range controls.  There is intentionally no parsing, rounding or clamping:
 * that would create a value a golfer did not choose.
 */
export function normalizeGuideInput(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Guide input must be an object');
  }

  const input = {};
  for (const key of INPUT_KEYS) {
    const number = requireFiniteNumber(value[key], key);
    const [minimum, maximum] = INPUT_LIMITS[key];
    if (number < minimum || number > maximum) {
      throw new RangeError(`Guide input ${key} must be between ${minimum} and ${maximum}`);
    }
    input[key] = number;
  }
  return Object.freeze(input);
}

function guideInputFromRangeInputs(input) {
  return normalizeGuideInput({
    face: input.faceAngle,
    path: input.clubPath,
    attack: input.attackAngle,
    dynLoft: input.dynamicLoft,
    speed: input.clubSpeed,
  });
}

function statusForOutcome(outcome) {
  if (!outcome.physical.inDomain) return 'out-of-domain-spin-loft';
  if (!(outcome.raw.carry > 0) || !(outcome.deg.launchAng > 0) || outcome.path.length < 2) return 'no-flight';
  if (outcome.raw.totalSpinRpm >= outcome.raw.maxTotalSpinRpm) return 'spin-output-ceiling';
  return 'ready';
}

/**
 * Resolves persisted onboarding state through the same source used by Range.
 * Stored result summaries are deliberately ignored: a Guide answer always
 * recalculates selectOutcome from the persisted five delivery inputs.
 */
export function resolveGuideContext(context, { useExperiment = false } = {}) {
  const safeContext = validateContext(context);
  const rangeInput = rangeInputsFromContext(safeContext, useExperiment === true);
  if (!rangeInput) return Object.freeze({
    status: 'no-flight',
    input: null,
    outcome: null,
    source: null,
  });

  try {
    const input = guideInputFromRangeInputs(rangeInput);
    const outcome = selectOutcome(input);
    return Object.freeze({
      status: statusForOutcome(outcome),
      input: Object.freeze(input),
      outcome,
      source: useExperiment === true ? 'guided-experiment' : 'guided-onboarding',
    });
  } catch (_) {
    // Context validation should prevent this branch. Keeping it explicit means
    // malformed local storage cannot manufacture a partial or guessed answer.
    return Object.freeze({
      status: 'no-flight',
      input: null,
      outcome: null,
      source: null,
    });
  }
}

/**
 * Reads one explicitly approved Guide value from Outcome. Unknown fields are
 * errors so a content addition cannot quietly become a made-up metric.
 */
export function getGuideMetric(outcome, metricId) {
  if (!outcome || typeof outcome !== 'object') {
    throw new TypeError('A Guide Outcome is required');
  }
  const reader = METRICS[metricId];
  if (!reader) throw new RangeError(`Unknown Guide metric: ${metricId}`);
  return reader(outcome);
}

/**
 * Builds a graph-ready series by varying exactly one input.  A series is
 * all-or-nothing: one invalid/no-flight/out-of-domain value rejects the sweep
 * rather than concealing a discontinuity in a polished chart.
 */
export function createOneVariableSweep(input, key, values) {
  const base = normalizeGuideInput(input);
  if (!INPUT_KEYS.includes(key)) throw new RangeError(`Unknown Guide input: ${key}`);
  if (!Array.isArray(values) || values.length === 0) {
    throw new TypeError('Guide sweep values must be a non-empty array');
  }
  if (new Set(values).size !== values.length) {
    throw new RangeError('Guide sweep values must be unique');
  }

  return values.map((value) => {
    const candidate = normalizeGuideInput({ ...base, [key]: value });
    const outcome = selectOutcome(candidate);
    const status = statusForOutcome(outcome);
    if (status !== 'ready') {
      throw new RangeError(`Guide sweep value ${value} is ${status}`);
    }
    return Object.freeze({
      value,
      input: Object.freeze(candidate),
      outcome,
      status,
    });
  });
}
