import { solveFlight } from './impact-flight.js';

const FACE_PATH_MIN=-10;
const FACE_PATH_MAX=10;
const LOFT_MIN=13;
const LOFT_MAX=46;
const TARGET_TOLERANCE=.10;

function finite(value,label) {
  const number=Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${label} must be finite`);
  return number;
}

function inRange(value,min,max,label) {
  const number=finite(value,label);
  if (number<min || number>max) throw new RangeError(`${label} is outside the supported range`);
  return number;
}

export function solveStartLineState(input={}) {
  const faceAngle=inRange(input.faceAngle,FACE_PATH_MIN,FACE_PATH_MAX,'Face Angle');
  const clubPath=inRange(input.clubPath,FACE_PATH_MIN,FACE_PATH_MAX,'Club Path');
  const dynamicLoft=inRange(input.dynamicLoft,LOFT_MIN,LOFT_MAX,'Dynamic Loft');
  const flight=solveFlight({ faceAngle,clubPath,dynamicLoft,attackAngle:-3,clubSpeed:90,club:'7iron' });
  const faceShare=flight.startFaceW;
  const faceContribution=faceShare*flight.faceAngle;
  const pathContribution=(1-faceShare)*flight.clubPath;
  return Object.freeze({
    faceAngle:flight.faceAngle,
    clubPath:flight.clubPath,
    dynamicLoft:flight.dynamicLoft,
    launchDirection:flight.startDirection,
    faceShare,
    pathShare:1-faceShare,
    faceContribution,
    pathContribution,
    held:Object.freeze({ attackAngle:-3,clubSpeed:90,targetLine:0,handedness:'RH',contact:'centered' })
  });
}

export function predictStartLineShift(input,nextDynamicLoft) {
  const before=solveStartLineState(input);
  const after=solveStartLineState({ ...input,dynamicLoft:nextDynamicLoft });
  if (Math.abs(after.launchDirection-before.launchDirection)<1e-12) return 'fixed';
  return Math.abs(after.launchDirection-before.faceAngle)<Math.abs(before.launchDirection-before.faceAngle)
    ? 'toward-face'
    : 'toward-path';
}

const inside=(value,target,tolerance=TARGET_TOLERANCE)=>Math.abs(value-target)<=tolerance+1e-12;

export function evaluateStartLineTransfer({ target,phaseAInput,switchedLoft,prediction,phaseBInput,changedAfterSwitch,tolerance=TARGET_TOLERANCE }={}) {
  try {
    const targetValue=finite(target,'Target');
    const safeTolerance=finite(tolerance,'Tolerance');
    if (safeTolerance<0) throw new RangeError('Tolerance is outside the supported range');
    const phaseA=solveStartLineState(phaseAInput);
    const switched=solveStartLineState({ ...phaseAInput,dynamicLoft:switchedLoft });
    const phaseB=solveStartLineState(phaseBInput);
    if (phaseB.dynamicLoft!==switched.dynamicLoft) throw new RangeError('Phase B must keep the switched loft held');
    const expectedPrediction=predictStartLineShift(phaseAInput,switchedLoft);
    const matchedException=Math.abs(phaseA.faceAngle-phaseA.clubPath)<1e-12;
    const phaseAPassed=inside(phaseA.launchDirection,targetValue,safeTolerance);
    const predictionPassed=prediction===expectedPrediction;
    const restoreInputPassed=matchedException || Boolean(changedAfterSwitch);
    const phaseBPassed=inside(phaseB.launchDirection,targetValue,safeTolerance);
    return Object.freeze({
      passed:phaseAPassed && predictionPassed && restoreInputPassed && phaseBPassed,
      phaseAPassed,predictionPassed,restoreInputPassed,phaseBPassed,matchedException,expectedPrediction,
      target:targetValue,tolerance:safeTolerance,
      phaseA:Object.freeze({ input:{...phaseAInput},launchDirection:phaseA.launchDirection }),
      switched:Object.freeze({ dynamicLoft:switched.dynamicLoft,launchDirection:switched.launchDirection }),
      phaseB:Object.freeze({ input:{...phaseBInput},launchDirection:phaseB.launchDirection })
    });
  } catch (error) {
    return Object.freeze({ passed:false,reason:'invalid-input',error:error.message });
  }
}

export const START_LINE_MODEL_LIMITS=Object.freeze({ facePath:[FACE_PATH_MIN,FACE_PATH_MAX],dynamicLoft:[LOFT_MIN,LOFT_MAX],targetTolerance:TARGET_TOLERANCE });
