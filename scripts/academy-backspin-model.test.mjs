import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_BACKSPIN_STATE,
  BACKSPIN_PARAMS,
  BACKSPIN_LIMITS,
  solveBackspinState,
  advanceMission,
  backspinSensitivity,
  buildCauseChain,
  realWorldRange,
  passesStoppingFlightTarget
} from '../academy-backspin-model.js';

test('initial state requires the learner to perform both mission stages', () => {
  const solved = solveBackspinState(INITIAL_BACKSPIN_STATE);
  assert.equal(solved.rpm, 4609);
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

/* Den gamle motoren klemte lavspinn opp til 1500 rpm, og leksjonen underviste
   det som en «model floor». Gulvet er slettet: spinnet går kontinuerlig mot
   null med spinn-loften. Testen pinner den nye sannheten — displayet FØLGER
   modellen hele veien ned — så et framtidig gulv ikke kan snike seg inn igjen. */
test('low spin has no floor: the display tracks the model all the way down', () => {
  const state = { dynamicLoft:10, attackAngle:6, ballSpeed:90 };
  const solved = solveBackspinState(state);
  const sensitivity = backspinSensitivity(state);
  assert.equal(solved.rpm, 449, 'spinn under det gamle gulvet vises som det er');
  assert.equal(solved.rawRpm, solved.rpm, 'ingenting klemmes: vist = rå');
  assert.equal(solved.displayCapped, false);
  assert.equal(solved.noFloor, true);
  assert.equal(solved.displayLimit, 'no-floor');
  assert.equal(solved.displayFloored, undefined, 'feltet skal være borte, ikke bare usant');
  // Sensitiviteten er synlig, ikke skjult bak en klemme — motsatt av taket.
  assert.equal(sensitivity.dynamicLoft.displayDelta, sensitivity.dynamicLoft.rawDelta);
  assert.notEqual(sensitivity.dynamicLoft.rawDelta, 0);
});

test('only the ceiling is a real bound; the low end is labelled as having none', () => {
  const ceiling = solveBackspinState({ dynamicLoft:39.0534, attackAngle:0, ballSpeed:125 });
  const lowEnd = solveBackspinState({ dynamicLoft:19.2005, attackAngle:6, ballSpeed:90 });
  assert.equal(ceiling.rawRpm, 9000);
  assert.equal(ceiling.displayLimit, 'ceiling');
  assert.equal(lowEnd.rawRpm, 1500);
  assert.equal(lowEnd.displayLimit, 'no-floor');
  assert.equal(lowEnd.rpm, lowEnd.rawRpm, 'ved den gamle gulvverdien klemmes ingenting lenger');
  assert.equal(BACKSPIN_LIMITS.min, undefined, 'det finnes ingen nedre grense å eksponere');
  assert.equal(BACKSPIN_LIMITS.max, 9000);
});

test('cause chain reports actual engine deltas', () => {
  const before = { dynamicLoft:30, attackAngle:-3, ballSpeed:120 };
  const after = { ...before, dynamicLoft:31 };
  const chain = buildCauseChain(before, after, 'dynamicLoft');
  assert.equal(chain.inputDelta, 1);
  assert.equal(chain.spinLoftDelta, 1);
  assert.equal(chain.rpmDelta, 430);
  assert.equal(chain.rawRpmDelta, 430);
  assert.match(chain.speech, /backspin plus 430 rpm/i);
});

test('cause chain separates a clamped display from the underlying model delta', () => {
  // Godt innenfor taket i begge ender, så displayet står helt stille (rpmDelta 0)
  // mens modellen fortsetter å stige. Det er hele poenget med tak-halvdelen.
  const before = { dynamicLoft:46, attackAngle:-8, ballSpeed:160 };
  const after = { ...before, dynamicLoft:47 };
  const chain = buildCauseChain(before, after, 'dynamicLoft');
  assert.equal(chain.rpmDelta, 0);
  assert.equal(chain.rawRpmDelta, 362);
  assert.equal(chain.displayLimit, 'ceiling');
  assert.match(chain.speech, /displayed backspin unchanged at 9000 rpm/i);
  assert.match(chain.speech, /underlying model plus 362 rpm/i);
});

/* Kontrasten som bærer leksjonen: i toppen fryser displayet, i bunnen gjør det
   det IKKE. Den gamle motoren frøs begge ender, og leksjonen sa det. */
test('cause chain keeps moving at the low end — there is no floor to freeze it', () => {
  const before = { dynamicLoft:11, attackAngle:6, ballSpeed:90 };
  const after = { ...before, dynamicLoft:10 };
  const chain = buildCauseChain(before, after, 'dynamicLoft');
  assert.equal(chain.rpmDelta, -112, 'displayet beveger seg — ingen klemme');
  assert.equal(chain.rawRpmDelta, -112);
  assert.equal(chain.rpmDelta, chain.rawRpmDelta, 'vist og rå er identiske under gulvhøyden');
  assert.equal(chain.displayLimit, 'no-floor');
  assert.match(chain.speech, /backspin minus 112 rpm/i);
  assert.doesNotMatch(chain.speech, /unchanged/i, 'ingenting står stille her');
  assert.doesNotMatch(chain.speech, /floor reached/i, 'gulvet finnes ikke lenger');
  assert.doesNotMatch(chain.speech, /1500|1,500/, 'den gamle gulvverdien skal aldri leses opp');
});

test('the current engine holds carry steady at fixed ball speed', () => {
  // DL20 i stedet for DL10: under launch-domenet flyr ikke ballen, så carry er
  // bare konstant INNENFOR domenet. Begge loftene her er godt innenfor.
  const low = solveBackspinState({ dynamicLoft:20, attackAngle:-3, ballSpeed:120 });
  const high = solveBackspinState({ dynamicLoft:48, attackAngle:-3, ballSpeed:120 });
  assert.equal(low.carryM, high.carryM);
});

test('real-world range remains separate from simulator truth', () => {
  assert.deepEqual(realWorldRange(7128, [0.80, 0.85]), { low:5702, high:6059 });
});

test('mastery target is evaluated from the live engine state', () => {
  assert.equal(passesStoppingFlightTarget({ dynamicLoft:32, attackAngle:-3, ballSpeed:120 }), true);
  assert.equal(passesStoppingFlightTarget({ dynamicLoft:10, attackAngle:-3, ballSpeed:120 }), false);
  assert.equal(passesStoppingFlightTarget({ dynamicLoft:NaN, attackAngle:-3, ballSpeed:120 }), false);
});

test('Backspin and Landing are independent gates evaluated from the same final state', () => {
  const finalState={ dynamicLoft:32, attackAngle:-3, ballSpeed:120 };
  const solved=solveBackspinState(finalState);
  const gates={ backspin:solved.rpm>=6800&&solved.rpm<=7400, landing:solved.landingAngle>=50 };
  assert.deepEqual(gates,{backspin:true,landing:true});
  assert.equal(passesStoppingFlightTarget(finalState),gates.backspin&&gates.landing);
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
