import test from 'node:test';import assert from 'node:assert/strict';
import{solveFlight}from'../impact-flight.js';
import{evaluateSameApexTransfer,FLIGHT_HEIGHT_DESCENT_FIXTURES as F,solveFlightHeightDescentState}from'../academy-flight-height-descent-model.js';
const close=(actual,expected,tolerance=1e-9)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} != ${expected}`);

test('low base and high Launch fixtures retain protected Apex and Landing truth',()=>{
  const expected=[[14.37,28.861856982015755,48.08385698201576,null],[17.85,33.03598955407673,54.34598955407673,null],[21.33,37.2101221261377,60,'ceiling']];
  F.launch.forEach((input,index)=>{const state=solveFlightHeightDescentState(input),engine=solveFlight({...input,faceAngle:0,clubPath:0,club:'7iron'});for(const key of['launchAngle','spinLoft','ballSpeed','backspin','carry','apex','landingAngle'])assert.equal(state[key],engine[key]);close(state.launchAngle,expected[index][0]);close(state.apex,expected[index][1]);close(state.landingAngle,expected[index][2]);assert.equal(state.landingClamp,expected[index][3]);});
});

test('equal Club Speed steps narrow Apex gain through the protected saturating fit',()=>{
  const states=F.speed.map(solveFlightHeightDescentState);close(states[0].apex,29.101835422247337);close(states[1].apex,33.03598955407673);close(states[2].apex,35.91436286040158);assert.ok(states[1].apex-states[0].apex>states[2].apex-states[1].apex);
});

test('base Landing ledger sums exactly to raw protected Landing',()=>{
  const state=solveFlightHeightDescentState(F.launch[1]);assert.equal(state.landingTerms.fitAnchor,45);assert.equal(state.landingTerms.spinLoftDirect,4);close(state.landingTerms.launchDirect,2.31);close(state.landingTerms.apexMediator,3.0359895540767283);close(Object.values(state.landingTerms).reduce((a,b)=>a+b,0),state.landingRaw);assert.equal(state.landingRaw,state.landingAngle);
});

test('high Launch exposes raw 60.608 degrees behind the 60 degree app clamp',()=>{
  const state=solveFlightHeightDescentState(F.launch[2]);close(state.landingRaw,60.608122126137694);assert.equal(state.landingAngle,60);assert.equal(state.landingClamp,'ceiling');
});

test('same-Apex fixtures preserve raw inputs outputs and materially different descent',()=>{
  const[a,b]=F.sameApex.map(solveFlightHeightDescentState);close(a.apex,31.489978187329836);close(b.apex,31.489711842155668);close(a.landingAngle,48.43997818732984);close(b.landingAngle,55.071711842155665);assert.ok(Math.abs(a.apex-b.apex)<.001);assert.ok(Math.abs(a.landingAngle-b.landingAngle)>6.6);
});

test('live evaluator requires both raw Apex bands and every independent descent gate',()=>{
  const base={stateAInput:F.sameApex[0],stateBInput:F.sameApex[1],stateAInteracted:true,stateBInteracted:true};const result=evaluateSameApexTransfer(base);assert.equal(result.passed,true);assert.equal(result.apexAPassed,true);assert.equal(result.apexBPassed,true);assert.equal(result.lowLandingPassed,true);assert.equal(result.highLandingPassed,true);assert.ok(result.landingGap>=6);assert.ok(result.spinLoftGap>=8);assert.equal(result.differentSpeed,true);assert.equal(result.unclamped,true);
  for(const patch of[{stateAInteracted:false},{stateBInteracted:false},{presetInjected:true},{editableFields:['dynamicLoft','attackAngle']},{stateAInput:{dynamicLoft:25,attackAngle:-3,clubSpeed:90}},{stateBInput:{dynamicLoft:30,attackAngle:-3,clubSpeed:105}},{stateBInput:F.sameApex[0]},{stateBInput:{dynamicLoft:34,attackAngle:1,clubSpeed:90}}])assert.equal(evaluateSameApexTransfer({...base,...patch}).passed,false,JSON.stringify(patch));
});

test('invalid controls fail closed and profile points remain finite schematic evidence',()=>{
  for(const value of[NaN,Infinity,50])assert.throws(()=>solveFlightHeightDescentState({dynamicLoft:value}));assert.equal(evaluateSameApexTransfer({}).passed,false);const state=solveFlightHeightDescentState();assert.equal(state.profile.length,33);assert.ok(state.profile.every(point=>Number.isFinite(point.d)&&Number.isFinite(point.h)));
});
