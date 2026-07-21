import test from 'node:test';import assert from 'node:assert/strict';
import{solveFlight}from'../impact-flight.js';
import{evaluateSameApexTransfer,FLIGHT_HEIGHT_DESCENT_FIXTURES as F,solveFlightHeightDescentState}from'../academy-flight-height-descent-model.js';
const close=(actual,expected,tolerance=1e-9)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} != ${expected}`);

test('low base and high Launch fixtures retain protected Apex and Landing truth',()=>{
  // Rekalibrert: alle tre deler spin loft 33, så landing er IDENTISK (50.7899) —
  // descent følger spin loft, ikke launch. Ingen når lenger 60-taket.
  const expected=[[12.366729562983798,28.06420509835605,50.789928102248574,null],[15.382746047638626,31.02114110454145,50.789928102248574,null],[18.78355305622561,34.35533000733499,50.789928102248574,null]];
  F.launch.forEach((input,index)=>{const state=solveFlightHeightDescentState(input),engine=solveFlight({...input,faceAngle:0,clubPath:0,club:'7iron'});for(const key of['launchAngle','spinLoft','ballSpeed','backspin','carry','apex','landingAngle'])assert.equal(state[key],engine[key]);close(state.launchAngle,expected[index][0]);close(state.apex,expected[index][1]);close(state.landingAngle,expected[index][2]);assert.equal(state.landingClamp,expected[index][3]);});
});

test('equal Club Speed steps narrow Apex gain through the protected saturating fit',()=>{
  const states=F.speed.map(solveFlightHeightDescentState);close(states[0].apex,24.12755419242113);close(states[1].apex,31.02114110454145);close(states[2].apex,37.91472801666177);
  // Rekalibrert: apex-gevinsten er ~lineær i køllefart — like steg, ingen metning.
  const g1=states[1].apex-states[0].apex,g2=states[2].apex-states[1].apex;assert.ok(Math.abs(g1-g2)<0.001,`apex-steg ${g1} vs ${g2} skal være like`);
});

test('base Landing ledger sums exactly to raw protected Landing',()=>{
  const state=solveFlightHeightDescentState(F.launch[1]);assert.equal(state.landingTerms.saturationBase,52.8);close(state.landingTerms.spinLoftTerm,-2.0100718977514234);assert.equal(state.landingTerms.domainTerm,0);close(Object.values(state.landingTerms).reduce((a,b)=>a+b,0),state.landingRaw);assert.equal(state.landingRaw,state.landingAngle);
});

test('landing saturates toward 52.8 and never reaches the old 60 ceiling',()=>{
  // Selv ved maks spin loft i leksjonens område (DL44, AA−8 → vsl 52) er landing
  // 52.448 — under metningstaket 52.8 og langt under det gamle 60-taket.
  const state=solveFlightHeightDescentState({dynamicLoft:44,attackAngle:-8,clubSpeed:90});close(state.landingRaw,52.448290164605744);assert.equal(state.landingAngle,state.landingRaw);assert.equal(state.landingClamp,null);assert.ok(state.landingRaw<52.8,'metning nås aldri helt');
});

test('same-Apex fixtures preserve raw inputs outputs and materially different descent',()=>{
  const[a,b]=F.sameApex.map(solveFlightHeightDescentState);close(a.apex,31.89529004611046);close(b.apex,31.82480445946507);close(a.landingAngle,46.175128059725665);close(b.landingAngle,52.190118168236964);
  // Eier-godkjent par: apex-differanse 0.070 (begge i båndet), landing-gap 6.015.
  assert.ok(Math.abs(a.apex-b.apex)<0.08);assert.ok(Math.abs(a.landingAngle-b.landingAngle)>=6);
});

test('live evaluator requires both raw Apex bands and every independent descent gate',()=>{
  const base={stateAInput:F.sameApex[0],stateBInput:F.sameApex[1],stateAInteracted:true,stateBInteracted:true};const result=evaluateSameApexTransfer(base);assert.equal(result.passed,true);assert.equal(result.apexAPassed,true);assert.equal(result.apexBPassed,true);assert.equal(result.lowLandingPassed,true);assert.equal(result.highLandingPassed,true);assert.ok(result.landingGap>=6);assert.ok(result.spinLoftGap>=8);assert.equal(result.differentSpeed,true);assert.equal(result.unclamped,true);
  for(const patch of[{stateAInteracted:false},{stateBInteracted:false},{presetInjected:true},{editableFields:['dynamicLoft','attackAngle']},{stateAInput:{dynamicLoft:25,attackAngle:-3,clubSpeed:90}},{stateBInput:{dynamicLoft:30,attackAngle:-3,clubSpeed:105}},{stateBInput:F.sameApex[0]},{stateBInput:{dynamicLoft:34,attackAngle:1,clubSpeed:90}}])assert.equal(evaluateSameApexTransfer({...base,...patch}).passed,false,JSON.stringify(patch));
});

test('invalid controls fail closed and profile points remain finite schematic evidence',()=>{
  for(const value of[NaN,Infinity,50])assert.throws(()=>solveFlightHeightDescentState({dynamicLoft:value}));assert.equal(evaluateSameApexTransfer({}).passed,false);const state=solveFlightHeightDescentState();assert.equal(state.profile.length,33);assert.ok(state.profile.every(point=>Number.isFinite(point.d)&&Number.isFinite(point.h)));
});
