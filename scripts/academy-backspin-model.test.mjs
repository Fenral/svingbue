import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_BACKSPIN_STATE,
  BACKSPIN_PARAMS,
  solveBackspinState,
  advanceMission,
  backspinSensitivity,
  buildCauseChain,
  realWorldRange,
  passesStoppingFlightTarget
} from '../academy-backspin-model.js';

test('initial state requires the learner to perform both mission stages', () => {
  const solved = solveBackspinState(INITIAL_BACKSPIN_STATE);
  assert.equal(solved.rpm, 6048);
  assert.equal(solved.spinLoft, 28);
  assert.deepEqual(advanceMission({ built:false, cut:false }, solved.rpm), {
    built:false, cut:false, complete:false, event:null
  });
});

test('cut is credited only after build', () => {
  const lowFirst = advanceMission({ built:false, cut:false }, 2808);
  assert.equal(lowFirst.cut, false);
  const built = advanceMission(lowFirst, 7128);
  assert.equal(built.built, true);
  assert.equal(built.event, 'built');
  const cut = advanceMission(built, 2808);
  assert.deepEqual(cut, { built:true, cut:true, complete:true, event:'cut' });
});

test('display clamp never erases underlying sensitivity', () => {
  const state = { dynamicLoft:48, attackAngle:-8, ballSpeed:160 };
  const solved = solveBackspinState(state);
  const sensitivity = backspinSensitivity(state);
  assert.equal(solved.rpm, 9000);
  assert.equal(solved.displayCapped, true);
  assert.equal(solved.displayLimit, 'ceiling');
  assert.ok(solved.rawRpm > 9000);
  assert.ok(sensitivity.dynamicLoft.rawDelta > 0);
  assert.ok(sensitivity.attackAngle.rawDelta < 0);
  assert.ok(sensitivity.ballSpeed.rawDelta > 0);
});

test('the lower model floor is distinct from the upper display cap', () => {
  const state = { dynamicLoft:10, attackAngle:6, ballSpeed:90 };
  const solved = solveBackspinState(state);
  const sensitivity = backspinSensitivity(state);
  assert.equal(solved.rpm, 1500);
  assert.equal(solved.rawRpm, 648);
  assert.equal(solved.displayCapped, false);
  assert.equal(solved.displayFloored, true);
  assert.equal(solved.displayLimit, 'floor');
  assert.notEqual(sensitivity.dynamicLoft.rawDelta, 0);
});

test('exact display bounds remain labelled as limits', () => {
  const ceiling = solveBackspinState({ dynamicLoft:40, attackAngle:0, ballSpeed:125 });
  const floor = solveBackspinState({ dynamicLoft:15.25925925925926, attackAngle:6, ballSpeed:90 });
  assert.equal(ceiling.rawRpm, 9000);
  assert.equal(ceiling.displayLimit, 'ceiling');
  assert.equal(floor.rawRpm, 1500);
  assert.equal(floor.displayLimit, 'floor');
});

test('cause chain reports actual engine deltas', () => {
  const before = { dynamicLoft:30, attackAngle:-3, ballSpeed:120 };
  const after = { ...before, dynamicLoft:31 };
  const chain = buildCauseChain(before, after, 'dynamicLoft');
  assert.equal(chain.inputDelta, 1);
  assert.equal(chain.spinLoftDelta, 1);
  assert.equal(chain.rpmDelta, 216);
  assert.equal(chain.rawRpmDelta, 216);
  assert.match(chain.speech, /backspin plus 216 rpm/i);
});

test('cause chain separates a clamped display from the underlying model delta', () => {
  const before = { dynamicLoft:40, attackAngle:0, ballSpeed:125 };
  const after = { ...before, dynamicLoft:41 };
  const chain = buildCauseChain(before, after, 'dynamicLoft');
  assert.equal(chain.rpmDelta, 0);
  assert.equal(chain.rawRpmDelta, 225);
  assert.equal(chain.displayLimit, 'ceiling');
  assert.match(chain.speech, /displayed backspin unchanged at 9000 rpm/i);
  assert.match(chain.speech, /underlying model plus 225 rpm/i);
});

test('cause chain also labels an unchanged display at the model floor', () => {
  const before = { dynamicLoft:11, attackAngle:6, ballSpeed:90 };
  const after = { ...before, dynamicLoft:10 };
  const chain = buildCauseChain(before, after, 'dynamicLoft');
  assert.equal(chain.rpmDelta, 0);
  assert.equal(chain.rawRpmDelta, -162);
  assert.equal(chain.displayLimit, 'floor');
  assert.match(chain.speech, /displayed backspin unchanged at 1500 rpm/i);
  assert.match(chain.speech, /model floor reached; underlying model minus 162 rpm/i);
});

test('the current engine holds carry steady at fixed ball speed', () => {
  const low = solveBackspinState({ dynamicLoft:10, attackAngle:-3, ballSpeed:120 });
  const high = solveBackspinState({ dynamicLoft:48, attackAngle:-3, ballSpeed:120 });
  assert.equal(low.carryM, high.carryM);
});

test('real-world range remains separate from simulator truth', () => {
  assert.deepEqual(realWorldRange(7128, [0.80, 0.85]), { low:5702, high:6059 });
});

test('mastery target is evaluated from the live engine state', () => {
  assert.equal(passesStoppingFlightTarget({ dynamicLoft:30, attackAngle:-3, ballSpeed:120 }), true);
  assert.equal(passesStoppingFlightTarget({ dynamicLoft:10, attackAngle:-3, ballSpeed:120 }), false);
  assert.equal(passesStoppingFlightTarget({ dynamicLoft:NaN, attackAngle:-3, ballSpeed:120 }), false);
});

test('phosphor trace state keeps at most two ghosts with falling opacity (EV-MOT-03)', async () => {
  const { MAX_GHOSTS, GHOST_OPACITIES, pushSettledTrace, ghostRenderPlan } =
    await import('../academy-trace-state.js');
  assert.equal(MAX_GHOSTS, 2);
  assert.equal(GHOST_OPACITIES.length, MAX_GHOSTS);
  assert.ok(GHOST_OPACITIES[0] > GHOST_OPACITIES[1],
    'ghost opacity must fall monotonically with age');
  assert.ok(GHOST_OPACITIES[1] > 0);

  const first = { flight: { id: 1 } };
  const second = { flight: { id: 2 } };
  const third = { flight: { id: 3 } };
  let ghosts = pushSettledTrace([], first);
  ghosts = pushSettledTrace(ghosts, second);
  ghosts = pushSettledTrace(ghosts, third);
  assert.equal(ghosts.length, MAX_GHOSTS, 'a third settle evicts the oldest ghost');
  assert.deepEqual(ghosts.map((ghost) => ghost.flight.id), [3, 2], 'newest first');
  assert.equal(pushSettledTrace(ghosts, null), ghosts, 'settles without flight are ignored');

  const plan = ghostRenderPlan(ghosts);
  assert.equal(plan.length, 2);
  assert.ok(plan[0].opacity > plan[1].opacity);
  assert.ok(plan.every((entry) => entry.dashed), 'ghosts stay dashed so they never read as live truth');

  const reducedPlan = ghostRenderPlan(ghosts, { reducedMotion: true });
  assert.equal(reducedPlan.length, 1,
    'reduced motion keeps a single static comparison ghost, no phosphor pair');
  assert.equal(reducedPlan[0].opacity, 1, 'the reduced-motion ghost does not decay');
});

test('readout formatter owns U+2212, grouping and unit suffixes (EV-TYPO-03)', async () => {
  const { MINUS, formatNumber, formatValue, formatSigned } =
    await import('../academy-readout-format.js');
  assert.equal(MINUS, '−');
  assert.equal(formatNumber(6048), '6,048');
  assert.equal(formatNumber(-3), '−3');
  assert.equal(formatNumber(46.3), '46.3');
  assert.equal(formatNumber(-1234.5), '−1,234.5');
  assert.equal(formatValue(-3, '°'), '−3°');
  assert.equal(formatValue(120, ' mph'), '120 mph');
  assert.equal(formatValue(6048, ' rpm'), '6,048 rpm');
  assert.equal(formatSigned(216, ' rpm'), '+216 rpm');
  assert.equal(formatSigned(-216, ' rpm'), '−216 rpm');
  assert.equal(formatSigned(0, ''), '+0');
  for (const value of [formatNumber(-7), formatValue(-8, '°'), formatSigned(-50, ' rpm')]) {
    assert.doesNotMatch(value, /-/, 'visible values never use the ASCII hyphen');
  }
});
