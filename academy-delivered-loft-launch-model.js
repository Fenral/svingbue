import { solveFlight } from './impact-flight.js';

const finite=(value,label)=>{const number=Number(value);if(!Number.isFinite(number))throw new TypeError(`${label} must be finite`);return number;};
const ranged=(value,min,max,label)=>{const number=finite(value,label);if(number<min||number>max)throw new RangeError(`${label} is outside the supported range`);return number;};
const clean=value=>Object.is(value,-0)||Math.abs(value)<1e-12?0:value;
const HELD=Object.freeze({faceAngle:0,clubPath:0,clubSpeed:90,club:'7iron'});

export function solveDeliveredLoftLaunchState(input={}){
  const dynamicLoft=ranged(input.dynamicLoft??30,16,44,'Dynamic Loft');
  const attackAngle=ranged(input.attackAngle??-4,-8,6,'Attack Angle');
  const faceAngle=ranged(input.faceAngle??HELD.faceAngle,-8,8,'Face Angle');
  const clubPath=ranged(input.clubPath??HELD.clubPath,-8,8,'Club Path');
  const clubSpeed=ranged(input.clubSpeed??HELD.clubSpeed,30,150,'Club Speed');
  const club=input.club??HELD.club;if(club!==HELD.club)throw new RangeError('Only the held 7-iron preset is supported');
  const flight=solveFlight({dynamicLoft,attackAngle,faceAngle,clubPath,clubSpeed,club});
  const required=['launchAngle','spinLoft','ballSpeed','backspin','carry','apex','landingAngle','startDirection'];
  if(!required.every(key=>Number.isFinite(flight[key])))throw new RangeError('Delivered Loft and Launch outputs must be finite');
  return Object.freeze({
    dynamicLoft:clean(flight.dynamicLoft),attackAngle:clean(flight.attackAngle),launchAngle:clean(flight.launchAngle),
    spinLoft:clean(flight.spinLoft),ballSpeed:flight.ballSpeed,backspin:flight.backspin,carry:flight.carry,
    apex:flight.apex,landingAngle:flight.landingAngle,startDirection:clean(flight.startDirection),
    loftContribution:clean(.62*flight.dynamicLoft),attackContribution:clean(.25*flight.attackAngle),
    landingClamp:flight.landingAngle===60?'ceiling':flight.landingAngle===32?'floor':null,
    // Kun taket igjen. Det gamle 1500-gulvet er slettet fra motoren, så en
    // `===1500`-gren her kunne aldri bli sann og påsto en klemme som ikke skjer.
    backspinClamp:flight.backspin===9000?'ceiling':null,
    input:Object.freeze({dynamicLoft,attackAngle,faceAngle,clubPath,clubSpeed,club}),held:HELD,
  });
}

const heldState=state=>state.input.faceAngle===HELD.faceAngle&&state.input.clubPath===HELD.clubPath&&state.input.clubSpeed===HELD.clubSpeed&&state.input.club===HELD.club;
export function evaluateEqualLaunchTransfer({stateAInput,stateBInput,stateAInteracted,stateBInteracted,editableFields=['dynamicLoft','attackAngle'],presetInjected=false}={}){
  try{
    const stateA=solveDeliveredLoftLaunchState(stateAInput),stateB=solveDeliveredLoftLaunchState(stateBInput);
    const stateAPassed=stateA.launchAngle>=18.4&&stateA.launchAngle<=18.8;
    const stateBPassed=stateB.launchAngle>=18.4&&stateB.launchAngle<=18.8;
    const spinLoftGap=Math.abs(stateA.spinLoft-stateB.spinLoft),gapPassed=spinLoftGap>=10;
    const oppositeSigns=(stateA.attackAngle>0&&stateB.attackAngle<0)||(stateA.attackAngle<0&&stateB.attackAngle>0);
    const distinct=Math.abs(stateA.dynamicLoft-stateB.dynamicLoft)>1e-12||Math.abs(stateA.attackAngle-stateB.attackAngle)>1e-12;
    const heldPassed=heldState(stateA)&&heldState(stateB);
    const editablePassed=Array.isArray(editableFields)&&editableFields.length===2&&editableFields.includes('dynamicLoft')&&editableFields.includes('attackAngle');
    const interactionPassed=Boolean(stateAInteracted)&&Boolean(stateBInteracted)&&!presetInjected;
    return Object.freeze({passed:stateAPassed&&stateBPassed&&gapPassed&&oppositeSigns&&distinct&&heldPassed&&editablePassed&&interactionPassed,stateAPassed,stateBPassed,spinLoftGap,gapPassed,oppositeSigns,distinct,heldPassed,editablePassed,interactionPassed,presetInjected:Boolean(presetInjected),stateA,stateB});
  }catch(error){return Object.freeze({passed:false,reason:'invalid-input',error:error.message});}
}

export const DELIVERED_LOFT_LAUNCH_LIMITS=Object.freeze({dynamicLoft:[16,44],attackAngle:[-8,6],launch:[18.4,18.8],spinLoftGap:10,held:HELD});
