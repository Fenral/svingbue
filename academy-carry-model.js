import{solveFlight,trajectorySamples}from'./impact-flight.js';
const finite=(value,label)=>{const number=Number(value);if(!Number.isFinite(number))throw new TypeError(`${label} must be finite`);return number;};
const ranged=(value,min,max,label)=>{const number=finite(value,label);if(number<min||number>max)throw new RangeError(`${label} is outside the supported range`);return number;};
const HELD=Object.freeze({faceAngle:0,clubPath:0,club:'7iron'});
/* Re-sentrert på det eier-godkjente paret (handoff/06): carry ~183.83, ball
   ~127.63. Landing-gapet flyttes 12->6 som godkjent — descent følger nå spin
   loft og metter mot 52.8, så 12+ grader er unåbart ved lik carry. totalGap
   følger samme kjede (roll speiler landing) og re-sentreres 3->1.5; launch- og
   apex-gapene står urørt. Loft-taket 44 rommer det godkjente B-slaget (DL42). */
export const CARRY_LIMITS=Object.freeze({dynamicLoft:[20,44],attackAngle:[-6,6],clubSpeed:[70,115],carry:[183.7,183.9],ballSpeed:[127.5,127.75],launchGap:8,apexGap:9,landingGap:6,totalGap:1.5,lowLanding:48,highLanding:52,held:HELD});

export function solveCarryState(input={}){
  const dynamicLoft=ranged(input.dynamicLoft??30,...CARRY_LIMITS.dynamicLoft,'Dynamic Loft'),attackAngle=ranged(input.attackAngle??-3,...CARRY_LIMITS.attackAngle,'Attack Angle'),clubSpeed=ranged(input.clubSpeed??90,...CARRY_LIMITS.clubSpeed,'Club Speed');
  const faceAngle=ranged(input.faceAngle??0,-8,8,'Face Angle'),clubPath=ranged(input.clubPath??0,-8,8,'Club Path'),club=input.club??'7iron';if(club!=='7iron')throw new RangeError('Only the held 7-iron preset is supported');
  const flight=solveFlight({dynamicLoft,attackAngle,clubSpeed,faceAngle,clubPath,club});
  const required=['ballSpeed','carry','launchAngle','apex','landingAngle','landingRaw','rollFrac','roll','total','backspin'];if(!required.every(key=>Number.isFinite(flight[key])))throw new RangeError('Carry outputs must be finite');
  const landingClamp=flight.landingRaw>60?'ceiling':flight.landingRaw<32?'floor':null;
  return Object.freeze({input:Object.freeze({dynamicLoft,attackAngle,clubSpeed,faceAngle,clubPath,club}),held:HELD,dynamicLoft,attackAngle,clubSpeed,spinLoft:flight.spinLoft,ballSpeed:flight.ballSpeed,carry:flight.carry,launchAngle:flight.launchAngle,apex:flight.apex,landingAngle:flight.landingAngle,landingRaw:flight.landingRaw,landingClamp,rollFraction:flight.rollFrac,roll:flight.roll,total:flight.total,backspin:flight.backspin,profile:Object.freeze(trajectorySamples(flight,32).map(point=>Object.freeze({d:point.d,h:point.h}))),signature:`${dynamicLoft.toFixed(6)}:${attackAngle.toFixed(6)}:${clubSpeed.toFixed(6)}:${faceAngle.toFixed(6)}:${clubPath.toFixed(6)}:${club}`});
}

export function evaluateEqualCarryTransfer({stateAInput,stateBInput,stateAInteracted=false,stateBInteracted=false,inferenceSelected=null,presetInjected=false}={}){
  try{const stateA=solveCarryState(stateAInput),stateB=solveCarryState(stateBInput),inCarry=state=>state.carry>=CARRY_LIMITS.carry[0]&&state.carry<=CARRY_LIMITS.carry[1],inBall=state=>state.ballSpeed>=CARRY_LIMITS.ballSpeed[0]&&state.ballSpeed<=CARRY_LIMITS.ballSpeed[1];
    const carryA=inCarry(stateA),carryB=inCarry(stateB),ballA=inBall(stateA),ballB=inBall(stateB),launchGap=Math.abs(stateA.launchAngle-stateB.launchAngle),apexGap=Math.abs(stateA.apex-stateB.apex),landingGap=Math.abs(stateA.landingAngle-stateB.landingAngle),totalGap=Math.abs(stateA.total-stateB.total),distinct=stateA.signature!==stateB.signature;
    const low=stateA.landingAngle<stateB.landingAngle?stateA:stateB,high=low===stateA?stateB:stateA,lowLanding=low.landingAngle<CARRY_LIMITS.lowLanding,highClamp=high.landingAngle>CARRY_LIMITS.highLanding,interactionPassed=Boolean(stateAInteracted)&&Boolean(stateBInteracted)&&!presetInjected,inferencePassed=inferenceSelected==='equal-current-carry-does-not-prove-equal-real-carry';
    const heldPassed=[stateA,stateB].every(state=>state.input.faceAngle===0&&state.input.clubPath===0&&state.input.club==='7iron');
    const passed=carryA&&carryB&&ballA&&ballB&&launchGap>=CARRY_LIMITS.launchGap&&apexGap>=CARRY_LIMITS.apexGap&&landingGap>=CARRY_LIMITS.landingGap&&totalGap>=CARRY_LIMITS.totalGap&&lowLanding&&highClamp&&distinct&&interactionPassed&&inferencePassed&&heldPassed;
    return Object.freeze({passed,carryA,carryB,ballA,ballB,launchGap,apexGap,landingGap,totalGap,lowLanding,highClamp,distinct,interactionPassed,inferencePassed,heldPassed,presetInjected:Boolean(presetInjected),stateA,stateB});
  }catch(error){return Object.freeze({passed:false,reason:'invalid-input',error:error.message});}
}
export const CARRY_FIXTURES=Object.freeze({speed:Object.freeze([70,90,110].map(clubSpeed=>Object.freeze({dynamicLoft:30,attackAngle:-3,clubSpeed}))),/* Eier-godkjent par (handoff/06): lik carry ~183.83 via ULIK levering — descent
   skiller 6.01 grader fordi spin loft-gapet er 26. */equal:Object.freeze([{dynamicLoft:22,attackAngle:2,clubSpeed:88},{dynamicLoft:42,attackAngle:-4,clubSpeed:102}])});
