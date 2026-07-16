import test from 'node:test';
import assert from 'node:assert/strict';
import { clubBallContact, deriveImpact } from '../swing-parameters-and-impact.js';
import { evaluateContactHeightTransfer, solveContactHeightState } from '../academy-contact-height-model.js';

const close=(actual,expected,tolerance=1e-12)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} != ${expected}`);
const raw=(x=.105,z=-.002)=>({view:'face',radius:1.2,planeAngle:55,swingDirection:0,lowPoint:{x,y:0,z}});

test('nine z fixtures retain protected clubZ and exact Attack invariance',()=>{
  const fixtures=[
    [-.01,-.006229790013189361],[-.006,-.002229790013189361],[-.004,-.00022979001318936074],
    [-.002,.0017702099868106393],[0,.0037702099868106393],[.002,.005770209986810639],
    [.01,.013770209986810639],[.02,.02377020998681064],[.03,.033770209986810636],
  ];
  for(const[z,clubZ]of fixtures){
    const state=solveContactHeightState({lowPointZ:z});
    assert.equal(state.contactHeight,clubBallContact(raw(.105,z)).clubZ);
    assert.equal(state.attackAngle,deriveImpact(raw(.105,z)).attackAngle);
    close(state.contactHeight,clubZ);
    assert.equal(state.attackAngle,-4.110245535124602);
  }
});

test('every millimeter of z translates Contact Height exactly one millimeter',()=>{
  const values=[-.006,-.002,.002,.01].map(lowPointZ=>solveContactHeightState({lowPointZ}));
  for(let index=1;index<values.length;index++){
    close(values[index].contactHeight-values[index-1].contactHeight,values[index].lowPointZ-values[index-1].lowPointZ,1e-15);
    close(values[index].arcLift,values[0].arcLift,1e-15);
  }
});

test('four x fixtures preserve lift budget and verified ground-entry order',()=>{
  const fixtures=[
    [.02,.0001365348229583291,-.001863465177041671,-.0565098481482532],
    [.06,.0012294969829213503,-.0007705030170786498,-.01650984814825321],
    [.105,.0037702099868106393,.0017702099868106393,.02849015185174679],
    [.15,.007709785334312279,.005709785334312279,.07349015185174679],
  ];
  for(const[x,lift,height,entry]of fixtures){
    const state=solveContactHeightState({lowPointX:x,lowPointZ:-.002});
    close(state.arcLift,lift);close(state.contactHeight,height);close(state.groundEntryX,entry);
    assert.equal(state.groundEntryOrder,entry<0?'before-ball':'after-ball');
  }
});

test('no ground crossing is fabricated when the modeled bottom is not below ground',()=>{
  for(const lowPointZ of[0,.002,.03]){
    const state=solveContactHeightState({lowPointZ});
    assert.equal(state.groundEntryX,null);assert.equal(state.groundEntryOrder,'none');
  }
  assert.equal(solveContactHeightState({lowPointZ:-.01}).groundEntryOrder,'before-ball');
});

test('compensation pair holds height within 0.02 mm while Attack differs',()=>{
  const a=solveContactHeightState({lowPointX:.105,lowPointZ:-.004});
  const b=solveContactHeightState({lowPointX:.13,lowPointZ:-.006});
  assert.ok(Math.abs(a.contactHeightMm-b.contactHeightMm)<=.02);
  assert.ok(Math.abs(a.attackAngle-b.attackAngle)>.9);
});

test('live gate accepts two raw height windows at one invariant Attack',()=>{
  const result=evaluateContactHeightTransfer({
    lowInput:{lowPointZ:-.002},highInput:{lowPointZ:.02},lowInteracted:true,highInteracted:true,
    lowAcknowledgesBottomBelow:true,highLabel:'above-center',
  });
  assert.equal(result.passed,true);assert.equal(result.low.contactHeight,.0017702099868106393);
  assert.equal(result.high.contactHeight,.02377020998681064);assert.equal(result.attackPassed,true);
});

test('every raw provenance and held-state near miss fails independently',()=>{
  const base={lowInput:{lowPointZ:-.002},highInput:{lowPointZ:.02},lowInteracted:true,highInteracted:true,lowAcknowledgesBottomBelow:true,highLabel:'above-center'};
  for(const patch of[
    {lowInput:{lowPointZ:-.004}},{highInput:{lowPointZ:.015}},{lowInteracted:false},{highInteracted:false},
    {lowAcknowledgesBottomBelow:false},{highLabel:'below-center'},{editableFields:['lowPointZ','lowPointX']},
    {presetInjected:true},{lowInput:{lowPointZ:-.002,lowPointX:.1}},{highInput:{lowPointZ:.02,planeAngle:54}},
    {highInput:{lowPointZ:.02,swingDirection:1}},{lowInput:{lowPointZ:-.002,radius:1.1}},
  ])assert.equal(evaluateContactHeightTransfer({...base,...patch}).passed,false,JSON.stringify(patch));
  for(const value of[NaN,Infinity,.08])assert.throws(()=>solveContactHeightState({lowPointZ:value}));
  assert.equal(evaluateContactHeightTransfer({}).passed,false);
});
