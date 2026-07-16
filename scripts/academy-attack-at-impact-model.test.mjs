import test from 'node:test';
import assert from 'node:assert/strict';
import {solveFlight} from '../impact-flight.js';
import {deriveImpact} from '../swing-parameters-and-impact.js';
import {attackFlightState,attackGeometryState,evaluateAttackTransfer} from '../academy-attack-at-impact-model.js';

const close=(actual,expected,tolerance=1e-12)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} != ${expected}`);

test('five flight fixtures retain protected-engine raw truth',()=>{
  const expected=new Map([[-6,[36,17.1,118.43999999999998,170.53717282524318]],[-4,[34,17.6,119.15999999999998,171.78047839101941]],[0,[30,18.6,120.6,174.25003295134613]],[4,[26,19.6,122.03999999999999,176.69500033835328]],[6,[24,20.1,122.75999999999999,177.9075560709316]]]);
  for(const[attack,values]of expected){const state=attackFlightState(attack),engine=solveFlight({faceAngle:0,clubPath:0,dynamicLoft:30,attackAngle:attack,clubSpeed:90,club:'7iron'});assert.equal(state.spinLoft,engine.spinLoft);assert.equal(state.launchAngle,engine.launchAngle);assert.equal(state.ballSpeed,engine.ballSpeed);assert.equal(state.carry,engine.carry);close(state.spinLoft,values[0]);close(state.launchAngle,values[1]);close(state.ballSpeed,values[2]);close(state.carry,values[3]);}
});

test('per-degree flight sensitivity is exact and signed',()=>{const a=attackFlightState(-4),b=attackFlightState(-3);assert.equal(b.spinLoft-a.spinLoft,-1);assert.equal(b.launchAngle-a.launchAngle,.25);assert.deepEqual(a.held,{faceAngle:0,clubPath:0,dynamicLoft:30,clubSpeed:90,club:'7iron'});});

test('six geometry fixtures retain deriveImpact output without copied tangent math',()=>{const rows=[[-.06,2.347354349071378,-1.6447813188975091],[-.02,.7822568842680283,-.5477845484484096],[0,0,0],[.02,-.7822568842680283,.5477845484484096],[.105,-4.110245535124602,2.884190020209084],[.15,-5.8770447150409,4.133228290376627]];for(const[x,attack,path]of rows){const state=attackGeometryState({lowPointX:x}),raw=deriveImpact({view:'face',radius:1.2,planeAngle:55,swingDirection:0,lowPoint:{x,y:0,z:0}});close(state.attackAngle,attack);close(state.clubPath,path);assert.equal(state.attackAngle,Object.is(raw.attackAngle,-0)?0:raw.attackAngle);assert.equal(state.clubPath,Object.is(raw.clubPath,-0)?0:raw.clubPath);}});

test('vertical translation leaves derived Attack invariant',()=>{const baseline=attackGeometryState({lowPointX:.105,lowPointZ:0});for(const z of[-.08,-.01,.04,.12])assert.equal(attackGeometryState({lowPointX:.105,lowPointZ:z}).attackAngle,baseline.attackAngle);});

test('two-state live gate accepts descending then ascending learner geometry',()=>{const result=evaluateAttackTransfer({descendingInput:{lowPointX:.105},ascendingInput:{lowPointX:-.06},descendingLabel:'descending',ascendingLabel:'ascending',descendingInteracted:true,ascendingInteracted:true});assert.equal(result.passed,true);assert.equal(result.descendingPassed,true);assert.equal(result.ascendingPassed,true);assert.equal(result.labelsPassed,true);assert.equal(result.heldPassed,true);assert.equal(result.directAngleControlUsed,false);});

test('every raw transfer boundary and provenance condition fails independently',()=>{const base={descendingInput:{lowPointX:.105},ascendingInput:{lowPointX:-.06},descendingLabel:'descending',ascendingLabel:'ascending',descendingInteracted:true,ascendingInteracted:true};for(const patch of[{descendingInput:{lowPointX:.075}},{descendingInput:{lowPointX:.14}},{ascendingInput:{lowPointX:-.025}},{ascendingInput:{lowPointX:-.08}},{descendingLabel:'ascending'},{ascendingLabel:'descending'},{descendingInteracted:false},{ascendingInteracted:false},{directAngleControlUsed:true},{presetInjected:true},{descendingInput:{lowPointX:.105,planeAngle:54}},{ascendingInput:{lowPointX:-.06,radius:1.1}},{descendingInput:{lowPointX:.105,swingDirection:1}},{ascendingInput:{lowPointX:-.06,lowPointZ:.01}}])assert.equal(evaluateAttackTransfer({...base,...patch}).passed,false,JSON.stringify(patch));});

test('invalid geometry fails closed and exact zero normalizes',()=>{assert.equal(Object.is(attackGeometryState({lowPointX:0}).attackAngle,-0),false);for(const bad of[NaN,Infinity,-Infinity,.3])assert.throws(()=>attackGeometryState({lowPointX:bad}));assert.equal(evaluateAttackTransfer({}).passed,false);});
