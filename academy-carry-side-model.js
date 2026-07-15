import { solveFlight } from './impact-flight.js';

const radians=degrees=>degrees*Math.PI/180;
const finite=(value,label)=>{const number=Number(value);if(!Number.isFinite(number))throw new TypeError(`${label} must be finite`);return number;};
const ranged=(value,min,max,label)=>{const number=finite(value,label);if(number<min||number>max)throw new RangeError(`${label} is outside the supported range`);return number;};
const clean=value=>Object.is(value,-0)||Math.abs(value)<1e-12?0:value;

export function solveCarrySideState(input={}){
  const faceAngle=ranged(input.faceAngle,-6,6,'Face Angle'),clubPath=ranged(input.clubPath,-6,6,'Club Path');
  const flight=solveFlight({faceAngle,clubPath,dynamicLoft:30,attackAngle:-3,clubSpeed:90,club:'7iron'});
  const startSide=clean(flight.carry*Math.sin(radians(flight.startDirection))),carrySide=clean(flight.offline);
  if(Math.abs(startSide+flight.curve-carrySide)>1e-9)throw new RangeError('Carry Side composition disagrees with the protected engine');
  return Object.freeze({faceAngle:flight.faceAngle,clubPath:flight.clubPath,launchDirection:clean(flight.startDirection),startSide,curve:clean(flight.curve),carrySide,offline:flight.offline,carry:flight.carry,held:Object.freeze({dynamicLoft:30,attackAngle:-3,clubSpeed:90,club:'7iron',contact:'centered',air:'calm'})});
}

export function composeCarrySide({launchDirection,curve,carry=172.4}={}){
  const launch=ranged(launchDirection,-4,4,'Launch Direction'),curveYards=ranged(curve,-20,20,'Curve'),carryYards=ranged(carry,1,400,'Carry');
  const startSide=clean(carryYards*Math.sin(radians(launch)));
  return Object.freeze({mode:'outcome-level-composer',launchDirection:launch,startSide,curve:clean(curveYards),carrySide:clean(startSide+curveYards),carry:carryYards});
}

export function evaluateCarrySideTransfer({stateAInput,stateBInput,stateAInteracted,stateBInteracted,presetInjected=false,tolerance=.5}={}){
  try{const safeTolerance=finite(tolerance,'Tolerance');if(safeTolerance<0)throw new RangeError('Tolerance must not be negative');const a=solveCarrySideState(stateAInput),b=solveCarrySideState(stateBInput);
    const stateAPassed=a.launchDirection>=1.5&&a.curve<=-4&&Math.abs(a.carrySide)<=safeTolerance+1e-12;
    const stateBPassed=b.launchDirection<=-1.5&&b.curve>=4&&Math.abs(b.carrySide)<=safeTolerance+1e-12;
    const distinct=Math.abs(a.faceAngle-b.faceAngle)>1e-12||Math.abs(a.clubPath-b.clubPath)>1e-12;
    const interactionPassed=Boolean(stateAInteracted)&&Boolean(stateBInteracted)&&!presetInjected;
    return Object.freeze({passed:stateAPassed&&stateBPassed&&distinct&&interactionPassed,stateAPassed,stateBPassed,distinct,interactionPassed,presetInjected:Boolean(presetInjected),tolerance:safeTolerance,stateA:Object.freeze({input:{...stateAInput},output:a}),stateB:Object.freeze({input:{...stateBInput},output:b})});
  }catch(error){return Object.freeze({passed:false,reason:'invalid-input',error:error.message});}
}

export const CARRY_SIDE_LIMITS=Object.freeze({facePath:[-6,6],composerLaunch:[-4,4],composerCurve:[-20,20],masteryTolerance:.5});
