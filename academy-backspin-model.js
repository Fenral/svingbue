import { solveFlight } from './impact-flight.js';

const YD_TO_M = 0.9144;

export const INITIAL_BACKSPIN_STATE = Object.freeze({
  dynamicLoft: 25,
  attackAngle: -3,
  ballSpeed: 120
});

export const BACKSPIN_LIMITS = Object.freeze({ min:1500, max:9000 });
export const BACKSPIN_PARAMS = Object.freeze({
  dynamicLoft: Object.freeze({ label:'Dynamic loft', min:10, max:48, step:1, unit:'\u00B0' }),
  attackAngle: Object.freeze({ label:'Attack angle', min:-8, max:6, step:1, unit:'\u00B0' }),
  ballSpeed: Object.freeze({ label:'Ball speed', min:90, max:175, step:1, unit:' mph' })
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeBackspinState(state) {
  const normalized = {};
  for (const [key, contract] of Object.entries(BACKSPIN_PARAMS)) {
    const value = Number(state?.[key]);
    if (!Number.isFinite(value)) throw new RangeError(key + ' must be finite');
    normalized[key] = clamp(value, contract.min, contract.max);
  }
  return normalized;
}

export function backspinEngineInput(state) {
  const { dynamicLoft, attackAngle, ballSpeed } = normalizeBackspinState(state);
  const spinLoft = dynamicLoft - attackAngle;
  const smashEff = clamp(1.46 - 0.004 * spinLoft, 1.15, 1.42);
  return {
    club: '7iron',
    clubPath: 0,
    faceAngle: 0,
    dynamicLoft,
    attackAngle,
    clubSpeed: ballSpeed / smashEff
  };
}

export function solveBackspinState(state) {
  const flight = solveFlight(backspinEngineInput(state));
  const rpm = Math.round(flight.backspin);
  const rawRpm = Math.round(flight.spinRpmRaw);
  const required = [rpm, rawRpm, flight.spinLoft, flight.ballSpeed, flight.carry, flight.apex, flight.landingAngle];
  if (!required.every(Number.isFinite)) throw new RangeError('Backspin model returned a non-finite value');
  const displayLimit = rawRpm >= BACKSPIN_LIMITS.max
    ? 'ceiling'
    : rawRpm <= BACKSPIN_LIMITS.min ? 'floor' : null;
  return {
    flight,
    rpm,
    rawRpm,
    displayLimit,
    displayCapped: displayLimit === 'ceiling',
    displayFloored: displayLimit === 'floor',
    spinLoft: Math.round(flight.spinLoft),
    ballSpeed: Math.round(flight.ballSpeed),
    carryM: Math.round(flight.carry * YD_TO_M),
    apexM: Math.round(flight.apex * YD_TO_M),
    landingAngle: Number(flight.landingAngle.toFixed(1))
  };
}

export function advanceMission(current, rpm) {
  const next = { built:!!current?.built, cut:!!current?.cut };
  let event = null;
  if (!Number.isFinite(rpm)) return { ...next, complete:next.built && next.cut, event };
  if (!next.built && rpm >= 7000) {
    next.built = true;
    event = 'built';
  } else if (next.built && !next.cut && rpm <= 3500) {
    next.cut = true;
    event = 'cut';
  }
  return { ...next, complete:next.built && next.cut, event };
}

function finiteDifference(state, key) {
  const normalized = normalizeBackspinState(state);
  const contract = BACKSPIN_PARAMS[key];
  const direction = normalized[key] >= contract.max ? -1 : 1;
  const base = solveBackspinState(normalized);
  const changed = solveBackspinState({
    ...normalized,
    [key]: normalized[key] + direction * contract.step
  });
  return {
    displayDelta: (changed.rpm - base.rpm) / direction,
    rawDelta: (changed.rawRpm - base.rawRpm) / direction
  };
}

export function backspinSensitivity(state) {
  return {
    dynamicLoft: finiteDifference(state, 'dynamicLoft'),
    attackAngle: finiteDifference(state, 'attackAngle'),
    ballSpeed: finiteDifference(state, 'ballSpeed')
  };
}

const INPUT_LABELS = {
  dynamicLoft: 'Dynamic loft',
  attackAngle: 'Attack angle',
  ballSpeed: 'Ball speed'
};

function signedSpeech(value, unit) {
  const direction = value >= 0 ? 'plus' : 'minus';
  return direction + ' ' + Math.abs(value) + ' ' + unit;
}

function signedVisual(value) {
  return (value >= 0 ? '+' : '\u2212') + Math.abs(value);
}

export function buildCauseChain(beforeState, afterState, activeKey) {
  const before = solveBackspinState(beforeState);
  const after = solveBackspinState(afterState);
  const inputDelta = Number(afterState[activeKey]) - Number(beforeState[activeKey]);
  const spinLoftDelta = after.spinLoft - before.spinLoft;
  const rpmDelta = after.rpm - before.rpm;
  const rawRpmDelta = after.rawRpm - before.rawRpm;
  const apexDelta = after.apexM - before.apexM;
  const displayLimit = after.displayLimit;
  const inputUnit = activeKey === 'ballSpeed' ? 'mph' : 'degrees';
  const limitLabel = displayLimit === 'ceiling' ? 'display ceiling' : 'model floor';
  const limitedDisplay = rpmDelta === 0 && rawRpmDelta !== 0 && displayLimit;
  const backspinVisual = limitedDisplay
    ? 'Backspin display unchanged at ' + after.rpm + ' rpm (' + limitLabel + ')'
    : 'Backspin ' + signedVisual(rpmDelta) + ' rpm';
  const backspinSpeech = limitedDisplay
    ? 'displayed backspin unchanged at ' + after.rpm + ' rpm; ' + limitLabel +
      ' reached; underlying model ' + signedSpeech(rawRpmDelta, 'rpm')
    : 'backspin ' + signedSpeech(rpmDelta, 'rpm');
  return {
    activeKey,
    inputDelta,
    spinLoftDelta,
    rpmDelta,
    displayRpmDelta: rpmDelta,
    rawRpmDelta,
    displayLimit,
    apexDelta,
    visual: [
      INPUT_LABELS[activeKey] + ' ' + signedVisual(inputDelta) +
        (activeKey === 'ballSpeed' ? ' mph' : '\u00B0'),
      'Spin loft ' + signedVisual(spinLoftDelta) + '\u00B0',
      backspinVisual,
      'Apex ' + signedVisual(apexDelta) + ' m'
    ],
    speech: INPUT_LABELS[activeKey] + ' ' + signedSpeech(inputDelta, inputUnit) + ', ' +
      'spin loft ' + signedSpeech(spinLoftDelta, 'degrees') + ', ' +
      backspinSpeech + ', ' +
      'apex ' + signedSpeech(apexDelta, 'metres') + '.'
  };
}

export function realWorldRange(rpm, keepRange) {
  return {
    low: Math.round(rpm * keepRange[0]),
    high: Math.round(rpm * keepRange[1])
  };
}

export function passesStoppingFlightTarget(state) {
  try {
    const solved = solveBackspinState(state);
    return solved.rpm >= 6800 && solved.rpm <= 7400 && solved.landingAngle >= 50;
  } catch {
    return false;
  }
}
