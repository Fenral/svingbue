import test from 'node:test';import assert from 'node:assert/strict';
import { solveFlight } from '../impact-flight.js';
import { evaluateEqualLaunchTransfer, solveDeliveredLoftLaunchState } from '../academy-delivered-loft-launch-model.js';
const close=(actual,expected,tolerance=1e-9)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} != ${expected}`);
const raw=(dynamicLoft,attackAngle)=>solveFlight({dynamicLoft,attackAngle,faceAngle:0,clubPath:0,clubSpeed:90,club:'7iron'});

test('base loft-plus-four and attack-plus-four retain protected flight truth',()=>{
  for(const[loft,attack,expected]of[[30,-4,[15.132746047638626,34,121.86486024421572,7022.424968423964,30.601307608265742,50.96613204626033]],[34,-4,[17.53355305622561,38,118.96457225252563,8263.041405050224,32.157734750133805,51.52944362495104]],[30,0,[16.132746047638626,30,124.57804700596083,5437.0078056025895,32.279160642841774,50.15307166388131]]]){
    const state=solveDeliveredLoftLaunchState({dynamicLoft:loft,attackAngle:attack}),engine=raw(loft,attack);
    for(const key of['launchAngle','spinLoft','ballSpeed','backspin','carry','apex','landingAngle'])assert.equal(state[key],engine[key]);
    close(state.launchAngle,expected[0]);close(state.spinLoft,expected[1]);close(state.ballSpeed,expected[2]);close(state.backspin,expected[3]);close(state.apex,expected[4],.02);close(state.landingAngle,expected[5],.02);
  }
});

test('per-degree sensitivities preserve Launch hierarchy and opposite Spin Loft signs',()=>{
  const base=solveDeliveredLoftLaunchState({dynamicLoft:30,attackAngle:-4}),loft=solveDeliveredLoftLaunchState({dynamicLoft:31,attackAngle:-4}),attack=solveDeliveredLoftLaunchState({dynamicLoft:30,attackAngle:-3});
  close(loft.launchAngle-base.launchAngle,0.5641276405281062,1e-9);assert.equal(loft.spinLoft-base.spinLoft,1);
  close(attack.launchAngle-base.launchAngle,.25,1e-12);assert.equal(attack.spinLoft-base.spinLoft,-1);
});

test('equal-launch pair retains distinct downstream engine outputs',()=>{
  // Eier-godkjent par (handoff/06): lik launch ~16.64, spin-loft-gap 10.
  const low=solveDeliveredLoftLaunchState({dynamicLoft:30,attackAngle:2}),high=solveDeliveredLoftLaunchState({dynamicLoft:33,attackAngle:-5});
  close(low.launchAngle,16.632746047638626);close(high.launchAngle,16.647277192460223);assert.equal(low.spinLoft,28);assert.equal(high.spinLoft,38);
  close(low.ballSpeed,125.864477425604);close(high.ballSpeed,118.96457225252563);close(low.backspin,4834.536848226549);close(high.backspin,8263.041405050224);
  close(low.carry,180.38286474188666);close(high.carry,167.15153227088757);close(low.landingAngle,49.619984446597776);close(high.landingAngle,51.52944362495104);
});

test('landing clamp metadata is explicit and never inferred as universal physics',()=>{
  // Rekalibrert: landing metter mot 52.8 — 60-taket er unåbart, ingen klemme.
  assert.equal(solveDeliveredLoftLaunchState({dynamicLoft:34,attackAngle:-4}).landingClamp,null);
  assert.equal(solveDeliveredLoftLaunchState({dynamicLoft:30,attackAngle:-4}).landingClamp,null);
});

test('live evaluator accepts two raw equal-launch states with opposite Attack and a wide Spin Loft gap',()=>{
  const result=evaluateEqualLaunchTransfer({stateAInput:{dynamicLoft:30,attackAngle:2},stateBInput:{dynamicLoft:33,attackAngle:-5},stateAInteracted:true,stateBInteracted:true});
  assert.equal(result.passed,true);assert.equal(result.spinLoftGap,10);assert.equal(result.oppositeSigns,true);
});

test('raw edge states pass and rounded out-of-range state fails',()=>{
  const edgeA={dynamicLoft:28,attackAngle:5.453444040721237},edgeB={dynamicLoft:33,attackAngle:-5};
  assert.equal(solveDeliveredLoftLaunchState(edgeA).launchAngle,16.44);
  assert.equal(evaluateEqualLaunchTransfer({stateAInput:edgeA,stateBInput:edgeB,stateAInteracted:true,stateBInteracted:true}).passed,true);
  const rounded={dynamicLoft:28,attackAngle:5.45};assert.ok(solveDeliveredLoftLaunchState(rounded).launchAngle<16.44);
  assert.equal(evaluateEqualLaunchTransfer({stateAInput:rounded,stateBInput:edgeB,stateAInteracted:true,stateBInteracted:true}).passed,false);
});

test('gap sign provenance held state and invalid inputs fail independently',()=>{
  const base={stateAInput:{dynamicLoft:30,attackAngle:2},stateBInput:{dynamicLoft:33,attackAngle:-5},stateAInteracted:true,stateBInteracted:true};
  for(const patch of[{stateAInput:{dynamicLoft:27,attackAngle:5}},{stateBInput:{dynamicLoft:34,attackAngle:-5}},{stateAInput:{dynamicLoft:30,attackAngle:0}},{stateBInput:{dynamicLoft:30,attackAngle:0}},{stateAInteracted:false},{stateBInteracted:false},{presetInjected:true},{editableFields:['dynamicLoft']},{stateAInput:{dynamicLoft:28,attackAngle:5,clubSpeed:91}},{stateBInput:{dynamicLoft:32,attackAngle:-5,faceAngle:1}}])assert.equal(evaluateEqualLaunchTransfer({...base,...patch}).passed,false,JSON.stringify(patch));
  for(const value of[NaN,Infinity,60])assert.throws(()=>solveDeliveredLoftLaunchState({dynamicLoft:value}));assert.equal(evaluateEqualLaunchTransfer({}).passed,false);
});
