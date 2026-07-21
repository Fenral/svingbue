import test from 'node:test';import assert from 'node:assert/strict';
import { solveFlight } from '../impact-flight.js';
import { evaluateEqualLaunchTransfer, solveDeliveredLoftLaunchState } from '../academy-delivered-loft-launch-model.js';
const close=(actual,expected,tolerance=1e-9)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} != ${expected}`);
const raw=(dynamicLoft,attackAngle)=>solveFlight({dynamicLoft,attackAngle,faceAngle:0,clubPath:0,clubSpeed:90,club:'7iron'});

test('base loft-plus-four and attack-plus-four retain protected flight truth',()=>{
  for(const[loft,attack,expected]of[[30,-4,[17.6,34,119.16,7188.7075826204955,32.69,54.35]],[34,-4,[20.08,38,117.72,7914.639632461662,35.46,60]],[30,0,[18.6,30,120.6,6427.752872043161,34.07,54.33]]]){
    const state=solveDeliveredLoftLaunchState({dynamicLoft:loft,attackAngle:attack}),engine=raw(loft,attack);
    for(const key of['launchAngle','spinLoft','ballSpeed','backspin','carry','apex','landingAngle'])assert.equal(state[key],engine[key]);
    close(state.launchAngle,expected[0]);close(state.spinLoft,expected[1]);close(state.ballSpeed,expected[2]);close(state.backspin,expected[3]);close(state.apex,expected[4],.02);close(state.landingAngle,expected[5],.02);
  }
});

test('per-degree sensitivities preserve Launch hierarchy and opposite Spin Loft signs',()=>{
  const base=solveDeliveredLoftLaunchState({dynamicLoft:30,attackAngle:-4}),loft=solveDeliveredLoftLaunchState({dynamicLoft:31,attackAngle:-4}),attack=solveDeliveredLoftLaunchState({dynamicLoft:30,attackAngle:-3});
  close(loft.launchAngle-base.launchAngle,.62,1e-12);assert.equal(loft.spinLoft-base.spinLoft,1);
  close(attack.launchAngle-base.launchAngle,.25,1e-12);assert.equal(attack.spinLoft-base.spinLoft,-1);
});

test('equal-launch pair retains distinct downstream engine outputs',()=>{
  const low=solveDeliveredLoftLaunchState({dynamicLoft:28,attackAngle:5}),high=solveDeliveredLoftLaunchState({dynamicLoft:32,attackAngle:-5});
  close(low.launchAngle,18.61,1e-12);close(high.launchAngle,18.59,1e-12);assert.equal(low.spinLoft,23);assert.equal(high.spinLoft,37);
  close(low.ballSpeed,123.12);close(high.ballSpeed,118.08);close(low.backspin,5023.046266687192);close(high.backspin,7736.636487008601);
  close(low.carry,178.51,.01);close(high.carry,169.91,.01);close(low.landingAngle,51.17,.01);close(high.landingAngle,57.49,.01);
});

test('landing clamp metadata is explicit and never inferred as universal physics',()=>{
  assert.equal(solveDeliveredLoftLaunchState({dynamicLoft:34,attackAngle:-4}).landingClamp,'ceiling');
  assert.equal(solveDeliveredLoftLaunchState({dynamicLoft:30,attackAngle:-4}).landingClamp,null);
});

test('live evaluator accepts two raw equal-launch states with opposite Attack and a wide Spin Loft gap',()=>{
  const result=evaluateEqualLaunchTransfer({stateAInput:{dynamicLoft:28,attackAngle:5},stateBInput:{dynamicLoft:32,attackAngle:-5},stateAInteracted:true,stateBInteracted:true});
  assert.equal(result.passed,true);assert.equal(result.spinLoftGap,14);assert.equal(result.oppositeSigns,true);
});

test('raw edge states pass and rounded out-of-range state fails',()=>{
  const edgeA={dynamicLoft:28,attackAngle:4.16},edgeB={dynamicLoft:32,attackAngle:-5};
  assert.equal(solveDeliveredLoftLaunchState(edgeA).launchAngle,18.4);
  assert.equal(evaluateEqualLaunchTransfer({stateAInput:edgeA,stateBInput:edgeB,stateAInteracted:true,stateBInteracted:true}).passed,true);
  const rounded={dynamicLoft:28,attackAngle:4.159};assert.ok(solveDeliveredLoftLaunchState(rounded).launchAngle<18.4);
  assert.equal(evaluateEqualLaunchTransfer({stateAInput:rounded,stateBInput:edgeB,stateAInteracted:true,stateBInteracted:true}).passed,false);
});

test('gap sign provenance held state and invalid inputs fail independently',()=>{
  const base={stateAInput:{dynamicLoft:28,attackAngle:5},stateBInput:{dynamicLoft:32,attackAngle:-5},stateAInteracted:true,stateBInteracted:true};
  for(const patch of[{stateAInput:{dynamicLoft:27,attackAngle:5}},{stateBInput:{dynamicLoft:33,attackAngle:-5}},{stateAInput:{dynamicLoft:30,attackAngle:0}},{stateBInput:{dynamicLoft:30,attackAngle:0}},{stateAInteracted:false},{stateBInteracted:false},{presetInjected:true},{editableFields:['dynamicLoft']},{stateAInput:{dynamicLoft:28,attackAngle:5,clubSpeed:91}},{stateBInput:{dynamicLoft:32,attackAngle:-5,faceAngle:1}}])assert.equal(evaluateEqualLaunchTransfer({...base,...patch}).passed,false,JSON.stringify(patch));
  for(const value of[NaN,Infinity,60])assert.throws(()=>solveDeliveredLoftLaunchState({dynamicLoft:value}));assert.equal(evaluateEqualLaunchTransfer({}).passed,false);
});
