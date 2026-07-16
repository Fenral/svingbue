import test from 'node:test';
import assert from 'node:assert/strict';
import { solveFlight } from '../impact-flight.js';
import { evaluateStartLineTransfer, predictStartLineShift, solveStartLineState } from '../academy-start-line-model.js';

const fixtures = [
  [{ faceAngle:0, clubPath:-2, dynamicLoft:30 }, { faceShare:.75, launchDirection:-.5 }],
  [{ faceAngle:2, clubPath:-2, dynamicLoft:30 }, { faceShare:.75, launchDirection:1 }],
  [{ faceAngle:2, clubPath:-2, dynamicLoft:13 }, { faceShare:.835, launchDirection:1.34 }],
  [{ faceAngle:2, clubPath:-2, dynamicLoft:46 }, { faceShare:.67, launchDirection:.68 }],
  [{ faceAngle:2.5, clubPath:-2, dynamicLoft:46 }, { faceShare:.67, launchDirection:1.015 }],
  [{ faceAngle:3, clubPath:3, dynamicLoft:13 }, { faceShare:.835, launchDirection:3 }],
  [{ faceAngle:3, clubPath:3, dynamicLoft:46 }, { faceShare:.67, launchDirection:3 }]
];

test('Start Line adapter mirrors all seven protected-engine fixtures and contribution terms',()=>{
  for (const [input, expected] of fixtures) {
    const actual=solveStartLineState(input);
    const direct=solveFlight({ ...input, attackAngle:-3, clubSpeed:90, club:'7iron' });
    assert.ok(Math.abs(actual.launchDirection-direct.startDirection)<1e-9);
    assert.ok(Math.abs(actual.faceShare-direct.startFaceW)<1e-9);
    assert.ok(Math.abs(actual.faceShare-expected.faceShare)<1e-9);
    assert.ok(Math.abs(actual.launchDirection-expected.launchDirection)<1e-9);
    assert.ok(Math.abs(actual.faceContribution+actual.pathContribution-actual.launchDirection)<1e-12);
  }
});

test('matched Face and Path are invariant across the delivered-loft cases',()=>{
  for (const loft of [13,30,46]) assert.equal(solveStartLineState({faceAngle:3,clubPath:3,dynamicLoft:loft}).launchDirection,3);
  assert.equal(predictStartLineShift({faceAngle:3,clubPath:3,dynamicLoft:30},46),'fixed');
});

test('transfer uses raw tolerance, direction prediction and a real post-switch input change',()=>{
  const passed=evaluateStartLineTransfer({
    target:1,
    phaseAInput:{faceAngle:2,clubPath:-2,dynamicLoft:30},
    switchedLoft:46,
    prediction:'toward-path',
    phaseBInput:{faceAngle:2.5,clubPath:-2,dynamicLoft:46},
    changedAfterSwitch:true
  });
  assert.equal(passed.passed,true);
  assert.equal(passed.expectedPrediction,'toward-path');

  assert.equal(evaluateStartLineTransfer({
    target:1,
    phaseAInput:{faceAngle:2,clubPath:-2,dynamicLoft:30},
    switchedLoft:46,
    prediction:'toward-face',
    phaseBInput:{faceAngle:2.5,clubPath:-2,dynamicLoft:46},
    changedAfterSwitch:true
  }).passed,false);
  assert.equal(evaluateStartLineTransfer({
    target:1,
    phaseAInput:{faceAngle:2,clubPath:-2,dynamicLoft:30},
    switchedLoft:46,
    prediction:'toward-path',
    phaseBInput:{faceAngle:2.5,clubPath:-2,dynamicLoft:46},
    changedAfterSwitch:false
  }).passed,false);
});

test('matched exception needs no meaningless restore input while raw near misses fail',()=>{
  const matched=evaluateStartLineTransfer({
    target:3,
    phaseAInput:{faceAngle:3,clubPath:3,dynamicLoft:30},
    switchedLoft:46,
    prediction:'fixed',
    phaseBInput:{faceAngle:3,clubPath:3,dynamicLoft:46},
    changedAfterSwitch:false
  });
  assert.equal(matched.passed,true);
  assert.equal(matched.matchedException,true);

  const faceOutside=(1.1001+.5)/.75;
  const nearMiss=evaluateStartLineTransfer({
    target:1,
    phaseAInput:{faceAngle:faceOutside,clubPath:-2,dynamicLoft:30},
    switchedLoft:46,
    prediction:'toward-path',
    phaseBInput:{faceAngle:2.5,clubPath:-2,dynamicLoft:46},
    changedAfterSwitch:true
  });
  assert.equal(nearMiss.phaseAPassed,false);
  assert.equal(nearMiss.passed,false);
});

test('non-finite and out-of-domain inputs fail closed',()=>{
  assert.throws(()=>solveStartLineState({faceAngle:Infinity,clubPath:0,dynamicLoft:30}),/finite/);
  assert.throws(()=>solveStartLineState({faceAngle:11,clubPath:0,dynamicLoft:30}),/range/);
  assert.equal(evaluateStartLineTransfer({target:1,phaseAInput:{faceAngle:NaN,clubPath:0,dynamicLoft:30},switchedLoft:46,prediction:'fixed',phaseBInput:{faceAngle:0,clubPath:0,dynamicLoft:46},changedAfterSwitch:true}).passed,false);
});
