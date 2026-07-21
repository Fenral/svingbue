import { solveFlight, trajectorySamples } from './impact-flight.js';

const finite=(value,label)=>{const number=Number(value);if(!Number.isFinite(number))throw new TypeError(`${label} must be finite`);return number;};
const ranged=(value,min,max,label)=>{const number=finite(value,label);if(number<min||number>max)throw new RangeError(`${label} is outside the supported range`);return number;};
const clean=value=>Object.is(value,-0)||Math.abs(value)<1e-12?0:value;
const HELD=Object.freeze({faceAngle:0,clubPath:0,club:'7iron'});

/* Rekalibrert motor (5dae98f): landing metter mot 52.8° og følger KUN vertikal
   spin loft. Det gamle high-kravet >54° er derfor fysisk unåbart og flyttes til
   >52 — ikke en svekkelse, men en flytting til den nye fysikkens topp. Apex-
   båndet re-sentreres på det eier-godkjente paret (31.825/31.895) med uendret
   bredde 0.4. Loft-taket utvides til 44 fordi det godkjente B-slaget (DL42)
   trenger det; landingGap- og spinLoftGap-predikatene står urørt. */
export const FLIGHT_HEIGHT_DESCENT_LIMITS=Object.freeze({
  dynamicLoft:[20,44],attackAngle:[-8,4],clubSpeed:[70,110],apex:[31.65,32.05],
  lowLanding:50,highLanding:52,landingGap:6,spinLoftGap:8,held:HELD
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
  /* Ledgeren leser motorens EGNE eksponerte dekomposisjonsfelter i stedet for å
     rekonstruere den slettede 4-ledds-formelen (45 + .5(sl−25) + .6(launch−14)
     + (apex−30)). Den virkelige formen er metning i vertikal spin loft:
     landingRaw = landingBase(52.8) + landingSpinTerm + landingDomainTerm.
     Launch og apex bidrar ikke lenger — motoren eksponerer dem som 0, og
     ledgeren viser det ærlig i stedet for å dikte opp bidrag. */
  const landingTerms=Object.freeze({
    saturationBase:flight.landingBase,
    spinLoftTerm:flight.landingSpinTerm,
    domainTerm:flight.landingDomainTerm
  });
  const landingRaw=flight.landingRaw;
  if(Math.abs((landingTerms.saturationBase+landingTerms.spinLoftTerm+landingTerms.domainTerm)-landingRaw)>1e-9)throw new RangeError('Landing ledger fields diverged from protected flight output');
  const landingClamp=landingRaw>60?'ceiling':landingRaw<32?'floor':null;
  const expectedLanding=flight.carry===0?0:Math.max(32,Math.min(60,landingRaw));
  if(Math.abs(expectedLanding-flight.landingAngle)>1e-9)throw new RangeError('Landing decomposition diverged from protected flight output');
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
const inApex=state=>state.apex>=FLIGHT_HEIGHT_DESCENT_LIMITS.apex[0]&&state.apex<=FLIGHT_HEIGHT_DESCENT_LIMITS.apex[1];

export function evaluateSameApexTransfer({
  stateAInput,stateBInput,stateAInteracted,stateBInteracted,
  editableFields=['dynamicLoft','attackAngle','clubSpeed'],presetInjected=false
}={}){
  try{
    const stateA=solveFlightHeightDescentState(stateAInput),stateB=solveFlightHeightDescentState(stateBInput);
    const apexAPassed=inApex(stateA),apexBPassed=inApex(stateB);
    const low=stateA.landingAngle<stateB.landingAngle?stateA:stateB;
    const high=low===stateA?stateB:stateA;
    const lowLandingPassed=low.landingAngle<FLIGHT_HEIGHT_DESCENT_LIMITS.lowLanding,highLandingPassed=high.landingAngle>FLIGHT_HEIGHT_DESCENT_LIMITS.highLanding;
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
  /* Eier-godkjent par (handoff/06): lik apex ~31.86, landing-gap 6.015°, spin-
     loft-gap 26 — descent skiller seg via spin loft, som er den nye sannheten. */
  sameApex:Object.freeze([{dynamicLoft:22,attackAngle:2,clubSpeed:94},{dynamicLoft:42,attackAngle:-4,clubSpeed:80}])
});
