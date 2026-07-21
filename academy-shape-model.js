import { solveFlight } from './impact-flight.js';

const FACE_PATH_LIMIT=6;
const SPEED_MIN=70;
const SPEED_MAX=110;
const START_TARGET=1;
const START_TOLERANCE=.1;
// Rekalibrert til 3-D-spinn-motoren (var 10 mot gammel kurve 14.9 = 0.67).
// 6.5 mot ny kurve 9.59 bevarer samme forhold OG samme utfall per leveranse:
// path 2 (5.6) blokkeres, path 4 (9.6) godkjennes, path 4 @70 (4.3) blokkeres.
const CURVE_THRESHOLD=6.5;

function finite(value,label){const number=Number(value);if(!Number.isFinite(number))throw new TypeError(`${label} must be finite`);return number;}
function ranged(value,min,max,label){const number=finite(value,label);if(number<min||number>max)throw new RangeError(`${label} is outside the supported range`);return number;}
const clean=value=>Object.is(value,-0)||Math.abs(value)<1e-12?0:value;

export function solveShapeState(input={}){
  const faceAngle=ranged(input.faceAngle,-FACE_PATH_LIMIT,FACE_PATH_LIMIT,'Face Angle');
  const clubPath=ranged(input.clubPath,-FACE_PATH_LIMIT,FACE_PATH_LIMIT,'Club Path');
  const clubSpeed=ranged(input.clubSpeed??90,SPEED_MIN,SPEED_MAX,'Club Speed');
  const flight=solveFlight({faceAngle,clubPath,dynamicLoft:30,attackAngle:-3,clubSpeed,club:'7iron'});
  return Object.freeze({
    faceAngle:flight.faceAngle,clubPath:flight.clubPath,clubSpeed,faceToPath:clean(faceAngle-clubPath),
    launchDirection:clean(flight.startDirection),spinAxis:clean(flight.spinAxis),carry:flight.carry,curve:clean(flight.curve),
    held:Object.freeze({dynamicLoft:30,attackAngle:-3,club:'7iron',contact:'centered',air:'calm'})
  });
}

export function evaluateShapeTransfer({leftInput,rightInput,leftInteracted,rightInteracted,presetInjected=false,target=START_TARGET,tolerance=START_TOLERANCE,curveThreshold=CURVE_THRESHOLD}={}){
  try{
    const targetValue=finite(target,'Target');const safeTolerance=finite(tolerance,'Tolerance');const threshold=finite(curveThreshold,'Curve threshold');
    if(safeTolerance<0||threshold<0)throw new RangeError('Transfer limits must not be negative');
    const left=solveShapeState(leftInput);const right=solveShapeState(rightInput);
    const leftLaunchPassed=Math.abs(left.launchDirection-targetValue)<=safeTolerance+1e-12;
    const rightLaunchPassed=Math.abs(right.launchDirection-targetValue)<=safeTolerance+1e-12;
    const leftCurvePassed=left.curve<=-threshold+1e-12;const rightCurvePassed=right.curve>=threshold-1e-12;
    const oppositeSigns=left.faceToPath<0&&right.faceToPath>0;
    const interactionPassed=Boolean(leftInteracted)&&Boolean(rightInteracted)&&!presetInjected;
    return Object.freeze({
      passed:leftLaunchPassed&&rightLaunchPassed&&leftCurvePassed&&rightCurvePassed&&oppositeSigns&&interactionPassed,
      leftLaunchPassed,rightLaunchPassed,leftCurvePassed,rightCurvePassed,oppositeSigns,interactionPassed,presetInjected:Boolean(presetInjected),
      target:targetValue,tolerance:safeTolerance,curveThreshold:threshold,
      left:Object.freeze({input:{...leftInput},output:left}),right:Object.freeze({input:{...rightInput},output:right})
    });
  }catch(error){return Object.freeze({passed:false,reason:'invalid-input',error:error.message});}
}

export const SHAPE_MODEL_LIMITS=Object.freeze({facePath:[-FACE_PATH_LIMIT,FACE_PATH_LIMIT],clubSpeed:[SPEED_MIN,SPEED_MAX],startTarget:START_TARGET,startTolerance:START_TOLERANCE,curveThreshold:CURVE_THRESHOLD});
