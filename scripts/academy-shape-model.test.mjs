import test from 'node:test';
import assert from 'node:assert/strict';
import { solveFlight } from '../impact-flight.js';
import { evaluateShapeTransfer, solveShapeState } from '../academy-shape-model.js';

const fixtures=[
  ['matched',1,1,90],['right',2,-2,90],['left',0,4,90],['low',2,-2,70],['high',2,-2,110]
];

test('Shape adapter mirrors five protected-engine fixtures without duplicating transforms',()=>{
  for(const [id,faceAngle,clubPath,clubSpeed] of fixtures){
    const actual=solveShapeState({faceAngle,clubPath,clubSpeed});const expected=solveFlight({faceAngle,clubPath,clubSpeed,dynamicLoft:30,attackAngle:-3,club:'7iron'});
    assert.equal(actual.faceToPath,faceAngle-clubPath,id);assert.equal(actual.launchDirection,expected.startDirection,id);assert.equal(actual.spinAxis,expected.spinAxis,id);assert.equal(actual.carry,expected.carry,id);assert.equal(actual.curve,expected.curve,id);
  }
});

test('central straight, right and left fixtures share raw Launch Direction; curving costs a little Carry',()=>{
  const states=fixtures.slice(0,3).map(([,faceAngle,clubPath,clubSpeed])=>solveShapeState({faceAngle,clubPath,clubSpeed}));
  assert.ok(states.every(state=>Math.abs(state.launchDirection-1)<1e-12));
  // 3-D spin loft: face-to-path-glipa legger seg på spinn-loften, så kurving koster
  // litt lengde. Den gamle fittede modellen ga alle tre eksakt lik carry; nå deler de
  // to speilede formene carry eksakt, mens det rette slaget bærer marginalt lenger.
  assert.ok(Math.abs(states[1].carry-states[2].carry)<1e-12,'speilede former deler carry eksakt');
  assert.ok(states[0].carry>states[1].carry,'rett slag bærer lenger enn kurvet');
  assert.ok(states[0].carry-states[1].carry<0.5,'men forskjellen er marginal');
  // 3-D-motoren gir den geometrisk eksakte tilten (6.3219) der den gamle fittede
  // gainen ga akkurat 6. Invarianten er den samme: null i midten, speilet ut.
  const axis=states.map(state=>state.spinAxis);
  assert.ok(Math.abs(axis[0])<1e-12,'matched har null spin axis');
  assert.ok(Math.abs(axis[1]-6.3218865915)<1e-9,'right spin axis');
  assert.ok(Math.abs(axis[2]+6.3218865915)<1e-9,'left speiler right');
  assert.deepEqual(states.map(state=>Math.sign(state.curve)),[0,1,-1]);
});

test('speed amplifies Curve while launch Spin Axis remains unchanged',()=>{
  const states=[70,90,110].map(clubSpeed=>solveShapeState({faceAngle:2,clubPath:-2,clubSpeed}));
  // Poenget i leksjonen: fart forsterker Curve, men rører ikke Spin Axis.
  const axis=states.map(state=>state.spinAxis);
  assert.ok(axis.every(v=>Math.abs(v-axis[0])<1e-12),'spin axis er uendret av fart');
  assert.ok(Math.abs(axis[0]-6.3218865915)<1e-9,'spin axis magnitude');
  assert.ok(states[0].curve<states[1].curve&&states[1].curve<states[2].curve);
});

test('two-shape transfer accepts the verified learner-built left then right pair',()=>{
  const result=evaluateShapeTransfer({leftInput:{faceAngle:0,clubPath:4,clubSpeed:90},rightInput:{faceAngle:2,clubPath:-2,clubSpeed:90},leftInteracted:true,rightInteracted:true});
  assert.equal(result.passed,true);assert.equal(result.left.output.launchDirection,1);assert.equal(result.right.output.launchDirection,1);assert.equal(result.oppositeSigns,true);
});

test('every raw transfer gate fails independently, including rounded-looking near misses',()=>{
  const base={leftInput:{faceAngle:0,clubPath:4,clubSpeed:90},rightInput:{faceAngle:2,clubPath:-2,clubSpeed:90},leftInteracted:true,rightInteracted:true};
  assert.equal(evaluateShapeTransfer({...base,leftInput:{faceAngle:.14,clubPath:4,clubSpeed:90}}).leftLaunchPassed,false);
  assert.equal(evaluateShapeTransfer({...base,rightInput:{faceAngle:2.14,clubPath:-2,clubSpeed:90}}).rightLaunchPassed,false);
  assert.equal(evaluateShapeTransfer({...base,leftInput:{faceAngle:.5,clubPath:2.5,clubSpeed:90}}).leftCurvePassed,false);
  assert.equal(evaluateShapeTransfer({...base,rightInput:{faceAngle:1.5,clubPath:-.5,clubSpeed:90}}).rightCurvePassed,false);
  assert.equal(evaluateShapeTransfer({...base,rightInput:{faceAngle:0,clubPath:4,clubSpeed:90}}).oppositeSigns,false);
  assert.equal(evaluateShapeTransfer({...base,leftInteracted:false}).interactionPassed,false);
  assert.equal(evaluateShapeTransfer({...base,presetInjected:true}).passed,false);
});

test('invalid and non-finite adapter inputs fail closed and negative zero is normalized',()=>{
  assert.throws(()=>solveShapeState({faceAngle:7,clubPath:0,clubSpeed:90}),RangeError);assert.throws(()=>solveShapeState({faceAngle:NaN,clubPath:0,clubSpeed:90}),TypeError);
  assert.equal(Object.is(solveShapeState({faceAngle:0,clubPath:0,clubSpeed:90}).faceToPath,-0),false);
  assert.equal(evaluateShapeTransfer({}).passed,false);
});
