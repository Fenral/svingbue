import{solveFlight,trajectorySamples}from'./impact-flight.js';
const finite=(value,label)=>{const number=Number(value);if(!Number.isFinite(number))throw new TypeError(`${label} must be finite`);return number;};
const ranged=(value,min,max,label)=>{const number=finite(value,label);if(number<min||number>max)throw new RangeError(`${label} is outside the supported range`);return number;};
const HELD=Object.freeze({faceAngle:0,clubPath:0,club:'7iron'});
export const CARRY_LIMITS=Object.freeze({dynamicLoft:[20,40],attackAngle:[-6,6],clubSpeed:[70,115],carry:[174.15,174.35],ballSpeed:[120.5,120.7],launchGap:8,apexGap:9,landingGap:12,totalGap:3,held:HELD});

export function solveCarryState(input={}){
  const dynamicLoft=ranged(input.dynamicLoft??30,...CARRY_LIMITS.dynamicLoft,'Dynamic Loft'),attackAngle=ranged(input.attackAngle??-3,...CARRY_LIMITS.attackAngle,'Attack Angle'),clubSpeed=ranged(input.clubSpeed??90,...CARRY_LIMITS.clubSpeed,'Club Speed');
  const faceAngle=ranged(input.faceAngle??0,-8,8,'Face Angle'),clubPath=ranged(input.clubPath??0,-8,8,'Club Path'),club=input.club??'7iron';if(club!=='7iron')throw new RangeError('Only the held 7-iron preset is supported');
  const flight=solveFlight({dynamicLoft,attackAngle,clubSpeed,faceAngle,clubPath,club});
  const required=['ballSpeed','carry','launchAngle','apex','landingAngle','landingRaw','rollFrac','roll','total','backspin'];if(!required.every(key=>Number.isFinite(flight[key])))throw new RangeError('Carry outputs must be finite');
  const landingClamp=flight.landingRaw>60?'ceiling':flight.landingRaw<32?'floor':null;
  return Object.freeze({input:Object.freeze({dynamicLoft,attackAngle,clubSpeed,faceAngle,clubPath,club}),held:HELD,dynamicLoft,attackAngle,clubSpeed,spinLoft:flight.spinLoft,ballSpeed:flight.ballSpeed,carry:flight.carry,launchAngle:flight.launchAngle,apex:flight.apex,landingAngle:flight.landingAngle,landingRaw:flight.landingRaw,landingClamp,rollFraction:flight.rollFrac,roll:flight.roll,total:flight.total,backspin:flight.backspin,profile:Object.freeze(trajectorySamples(flight,32).map(point=>Object.freeze({d:point.d,h:point.h}))),signature:`${dynamicLoft.toFixed(6)}:${attackAngle.toFixed(6)}:${clubSpeed.toFixed(6)}:${faceAngle.toFixed(6)}:${clubPath.toFixed(6)}:${club}`});
}

export function evaluateEqualCarryTransfer({stateAInput,stateBInput,stateAInteracted=false,stateBInteracted=false,inferenceSelected=null,presetInjected=false}={}){
  try{const stateA=solveCarryState(stateAInput),stateB=solveCarryState(stateBInput),inCarry=state=>state.carry>=174.15&&state.carry<=174.35,inBall=state=>state.ballSpeed>=120.5&&state.ballSpeed<=120.7;
    const carryA=inCarry(stateA),carryB=inCarry(stateB),ballA=inBall(stateA),ballB=inBall(stateB),launchGap=Math.abs(stateA.launchAngle-stateB.launchAngle),apexGap=Math.abs(stateA.apex-stateB.apex),landingGap=Math.abs(stateA.landingAngle-stateB.landingAngle),totalGap=Math.abs(stateA.total-stateB.total),distinct=stateA.signature!==stateB.signature;
    const low=stateA.landingAngle<stateB.landingAngle?stateA:stateB,high=low===stateA?stateB:stateA,lowLanding=low.landingAngle<48,highClamp=high.landingAngle===60&&high.landingClamp==='ceiling',interactionPassed=Boolean(stateAInteracted)&&Boolean(stateBInteracted)&&!presetInjected,inferencePassed=inferenceSelected==='equal-current-carry-does-not-prove-equal-real-carry';
    const heldPassed=[stateA,stateB].every(state=>state.input.faceAngle===0&&state.input.clubPath===0&&state.input.club==='7iron');
    const passed=carryA&&carryB&&ballA&&ballB&&launchGap>=8&&apexGap>=9&&landingGap>=12&&totalGap>=3&&lowLanding&&highClamp&&distinct&&interactionPassed&&inferencePassed&&heldPassed;
    return Object.freeze({passed,carryA,carryB,ballA,ballB,launchGap,apexGap,landingGap,totalGap,lowLanding,highClamp,distinct,interactionPassed,inferencePassed,heldPassed,presetInjected:Boolean(presetInjected),stateA,stateB});
  }catch(error){return Object.freeze({passed:false,reason:'invalid-input',error:error.message});}
}
export const CARRY_FIXTURES=Object.freeze({speed:Object.freeze([70,90,110].map(clubSpeed=>Object.freeze({dynamicLoft:30,attackAngle:-3,clubSpeed}))),equal:Object.freeze([{dynamicLoft:25,attackAngle:-5,clubSpeed:90},{dynamicLoft:35,attackAngle:5,clubSpeed:90}])});
