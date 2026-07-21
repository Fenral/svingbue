import { solveFlight } from './impact-flight.js';

const finite=(value,label)=>{const number=Number(value);if(!Number.isFinite(number))throw new TypeError(`${label} must be finite`);return number;};
const ranged=(value,min,max,label)=>{const number=finite(value,label);if(number<min||number>max)throw new RangeError(`${label} is outside the supported range`);return number;};
const HELD=Object.freeze({attackAngle:0,faceAngle:0,clubPath:0,club:'7iron'});
const EPSILON=1e-10;

function engineAt(clubSpeed,spinLoft){
  return solveFlight({clubSpeed,dynamicLoft:spinLoft,attackAngle:HELD.attackAngle,faceAngle:HELD.faceAngle,clubPath:HELD.clubPath,club:HELD.club});
}

// The protected Smash model is read directly off solveFlight's exposed
// coefficients — the adapter still owns no duplicate calibration constants. The
// previous local two-point line assumed Smash was linear in spin loft; the
// recalibrated Smash is quadratic, so that line threw for every delivery away
// from the 30° sample. Reading the live quadratic terms tracks the model across
// the whole spin-loft range.

export const SPEED_TRANSFER_LIMITS=Object.freeze({
  clubSpeed:[70,115],spinLoft:[5,80],coreSpinLoft:[20,50],ballSpeed:[130.46,130.66],
  clubSpeedGap:5,spinLoftGap:15,smashGap:.06,ballSpeedGap:.1,held:HELD
});

export function solveSpeedTransferState(input={}){
  const clubSpeed=ranged(input.clubSpeed??90,...SPEED_TRANSFER_LIMITS.clubSpeed,'Club Speed');
  const spinLoft=ranged(input.spinLoft??33,...SPEED_TRANSFER_LIMITS.spinLoft,'Spin Loft');
  const club=input.club??HELD.club;if(club!==HELD.club)throw new RangeError('Only the held 7-iron preset is supported');
  const flight=engineAt(clubSpeed,spinLoft);
  const smash=flight.ballSpeed/clubSpeed;
  const UPPER_SMASH=flight.smashMaximum,LOWER_SMASH=flight.smashMinimum;
  const smashRaw=flight.smashModelIntercept+flight.smashSpinLoftLinear*flight.spinLoft+flight.smashSpinLoftQuadratic*flight.spinLoft**2;
  const smashClamp=Math.abs(smash-UPPER_SMASH)<=EPSILON&&smashRaw>=UPPER_SMASH-EPSILON?'upper':Math.abs(smash-LOWER_SMASH)<=EPSILON&&smashRaw<=LOWER_SMASH+EPSILON?'lower':null;
  const expected=Math.max(LOWER_SMASH,Math.min(UPPER_SMASH,smashRaw));
  if(!Number.isFinite(smash)||Math.abs(smash-expected)>EPSILON||Math.abs(flight.spinLoft-spinLoft)>EPSILON)throw new RangeError('Transfer adapter diverged from protected flight output');
  return Object.freeze({
    input:Object.freeze({clubSpeed,spinLoft,club}),held:HELD,clubSpeed,spinLoft,
    smashRaw,smash,smashClamp,modelLimitReached:Boolean(smashClamp),ballSpeed:flight.ballSpeed,
    carry:flight.carry,backspin:flight.backspin,launchAngle:flight.launchAngle,
    equation:Object.freeze({clubSpeed,multiplier:smash,ballSpeed:flight.ballSpeed}),
    signature:`${clubSpeed.toFixed(6)}:${spinLoft.toFixed(6)}:${club}`
  });
}

export function evaluateEqualBallSpeedTransfer({
  stateAInput,stateBInput,stateAInteracted=false,stateBInteracted=false,
  compareOpened=false,inferenceSelected=null,presetInjected=false
}={}){
  try{
    const stateA=solveSpeedTransferState(stateAInput),stateB=solveSpeedTransferState(stateBInput);
    const targetA=stateA.ballSpeed>=130.46&&stateA.ballSpeed<=130.66;
    const targetB=stateB.ballSpeed>=130.46&&stateB.ballSpeed<=130.66;
    const clubSpeedGap=Math.abs(stateA.clubSpeed-stateB.clubSpeed),spinLoftGap=Math.abs(stateA.spinLoft-stateB.spinLoft),smashGap=Math.abs(stateA.smash-stateB.smash),ballSpeedGap=Math.abs(stateA.ballSpeed-stateB.ballSpeed);
    const distinct=stateA.signature!==stateB.signature;
    const unclamped=!stateA.modelLimitReached&&!stateB.modelLimitReached;
    const interactionPassed=Boolean(stateAInteracted)&&Boolean(stateBInteracted)&&!presetInjected;
    const comparePassed=Boolean(compareOpened);
    const inferencePassed=inferenceSelected==='ball-speed-alone-does-not-reveal-delivery';
    const passed=targetA&&targetB&&clubSpeedGap>=5&&spinLoftGap>=15&&smashGap>=.06&&ballSpeedGap<=.1&&distinct&&unclamped&&interactionPassed&&comparePassed&&inferencePassed;
    return Object.freeze({passed,targetA,targetB,clubSpeedGap,spinLoftGap,smashGap,ballSpeedGap,distinct,unclamped,interactionPassed,comparePassed,inferencePassed,presetInjected:Boolean(presetInjected),stateA,stateB});
  }catch(error){return Object.freeze({passed:false,reason:'invalid-input',error:error.message});}
}

export const SPEED_TRANSFER_FIXTURES=Object.freeze({
  primary:Object.freeze([[80,33],[90,33],[100,33],[90,25],[90,45]].map(([clubSpeed,spinLoft])=>Object.freeze({clubSpeed,spinLoft}))),
  equal:Object.freeze([{clubSpeed:96,spinLoft:25},{clubSpeed:102,spinLoft:45}]),
  clamps:Object.freeze([{clubSpeed:90,spinLoft:10},{clubSpeed:90,spinLoft:77.5}])
});
