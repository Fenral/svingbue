import { solveFlight, trajectorySamples } from './impact-flight.js';

const finite=(value,label)=>{const number=Number(value);if(!Number.isFinite(number))throw new TypeError(`${label} must be finite`);return number;};
const ranged=(value,min,max,label)=>{const number=finite(value,label);if(number<min||number>max)throw new RangeError(`${label} is outside the supported range`);return number;};
const clean=value=>Object.is(value,-0)||Math.abs(value)<1e-12?0:value;
const HELD=Object.freeze({faceAngle:0,clubPath:0,club:'7iron'});

export const FLIGHT_HEIGHT_DESCENT_LIMITS=Object.freeze({
  dynamicLoft:[20,38],attackAngle:[-8,4],clubSpeed:[70,110],apex:[31.3,31.7],
  lowLanding:50,highLanding:54,landingGap:6,spinLoftGap:8,held:HELD
});

export function solveFlightHeightDescentState(input={}){
  const dynamicLoft=ranged(input.dynamicLoft??30,...FLIGHT_HEIGHT_DESCENT_LIMITS.dynamicLoft,'Dynamic Loft');
  const attackAngle=ranged(input.attackAngle??-3,...FLIGHT_HEIGHT_DESCENT_LIMITS.attackAngle,'Attack Angle');
  const clubSpeed=ranged(input.clubSpeed??90,...FLIGHT_HEIGHT_DESCENT_LIMITS.clubSpeed,'Club Speed');
  const faceAngle=ranged(input.faceAngle??0,-8,8,'Face Angle');
  const clubPath=ranged(input.clubPath??0,-8,8,'Club Path');
  const club=input.club??'7iron';if(club!=='7iron')throw new RangeError('Only the held 7-iron preset is supported');
  const flight=solveFlight({dynamicLoft,attackAngle,clubSpeed,faceAngle,clubPath,club});
  const required=['launchAngle','spinLoft','ballSpeed','backspin','carry','apex','landingAngle'];
  if(!required.every(key=>Number.isFinite(flight[key])))throw new RangeError('Flight profile outputs must be finite');
  const landingTerms=Object.freeze({
    fitAnchor:45,
    spinLoftDirect:.5*(flight.spinLoft-25),
    launchDirect:.6*(flight.launchAngle-14),
    apexMediator:flight.apex-30
  });
  const landingRaw=Object.values(landingTerms).reduce((sum,value)=>sum+value,0);
  const landingClamp=landingRaw>60?'ceiling':landingRaw<32?'floor':null;
  if(Math.abs(Math.max(32,Math.min(60,landingRaw))-flight.landingAngle)>1e-9)throw new RangeError('Landing decomposition diverged from protected flight output');
  return Object.freeze({
    input:Object.freeze({dynamicLoft,attackAngle,clubSpeed,faceAngle,clubPath,club}),held:HELD,
    dynamicLoft:clean(flight.dynamicLoft),attackAngle:clean(flight.attackAngle),clubSpeed,
    launchAngle:clean(flight.launchAngle),spinLoft:clean(flight.spinLoft),ballSpeed:flight.ballSpeed,
    backspin:flight.backspin,carry:flight.carry,apex:flight.apex,landingAngle:flight.landingAngle,
    landingRaw,landingTerms,landingClamp,
    profile:Object.freeze(trajectorySamples(flight,32).map(point=>Object.freeze({d:point.d,h:point.h})))
  });
}

const held=state=>state.input.faceAngle===0&&state.input.clubPath===0&&state.input.club==='7iron';
const inApex=state=>state.apex>=31.3&&state.apex<=31.7;

export function evaluateSameApexTransfer({
  stateAInput,stateBInput,stateAInteracted,stateBInteracted,
  editableFields=['dynamicLoft','attackAngle','clubSpeed'],presetInjected=false
}={}){
  try{
    const stateA=solveFlightHeightDescentState(stateAInput),stateB=solveFlightHeightDescentState(stateBInput);
    const apexAPassed=inApex(stateA),apexBPassed=inApex(stateB);
    const low=stateA.landingAngle<stateB.landingAngle?stateA:stateB;
    const high=low===stateA?stateB:stateA;
    const lowLandingPassed=low.landingAngle<50,highLandingPassed=high.landingAngle>54;
    const landingGap=Math.abs(stateA.landingAngle-stateB.landingAngle),landingGapPassed=landingGap>=6;
    const spinLoftGap=Math.abs(stateA.spinLoft-stateB.spinLoft),spinLoftGapPassed=spinLoftGap>=8;
    const differentSpeed=Math.abs(stateA.clubSpeed-stateB.clubSpeed)>1e-12;
    const unclamped=stateA.landingClamp===null&&stateB.landingClamp===null;
    const distinct=['dynamicLoft','attackAngle','clubSpeed'].some(key=>Math.abs(stateA.input[key]-stateB.input[key])>1e-12);
    const heldPassed=held(stateA)&&held(stateB);
    const editablePassed=Array.isArray(editableFields)&&editableFields.length===3&&['dynamicLoft','attackAngle','clubSpeed'].every(key=>editableFields.includes(key));
    const interactionPassed=Boolean(stateAInteracted)&&Boolean(stateBInteracted)&&!presetInjected;
    const passed=apexAPassed&&apexBPassed&&lowLandingPassed&&highLandingPassed&&landingGapPassed&&spinLoftGapPassed&&differentSpeed&&unclamped&&distinct&&heldPassed&&editablePassed&&interactionPassed;
    return Object.freeze({passed,apexAPassed,apexBPassed,lowLandingPassed,highLandingPassed,landingGap,landingGapPassed,spinLoftGap,spinLoftGapPassed,differentSpeed,unclamped,distinct,heldPassed,editablePassed,interactionPassed,presetInjected:Boolean(presetInjected),stateA,stateB});
  }catch(error){return Object.freeze({passed:false,reason:'invalid-input',error:error.message});}
}

export const FLIGHT_HEIGHT_DESCENT_FIXTURES=Object.freeze({
  launch:Object.freeze([{dynamicLoft:26,attackAngle:-7,clubSpeed:90},{dynamicLoft:30,attackAngle:-3,clubSpeed:90},{dynamicLoft:34,attackAngle:1,clubSpeed:90}]),
  speed:Object.freeze([{dynamicLoft:30,attackAngle:-3,clubSpeed:70},{dynamicLoft:30,attackAngle:-3,clubSpeed:90},{dynamicLoft:30,attackAngle:-3,clubSpeed:110}]),
  sameApex:Object.freeze([{dynamicLoft:25,attackAngle:-3,clubSpeed:105},{dynamicLoft:31,attackAngle:-7,clubSpeed:85}])
});
