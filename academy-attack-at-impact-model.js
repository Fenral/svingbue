import {solveFlight} from './impact-flight.js';
import {RADIUS,PLANE_DEFAULT,deriveImpact,effectiveLpx} from './swing-parameters-and-impact.js';

const finite=(value,label)=>{const number=Number(value);if(!Number.isFinite(number))throw new TypeError(`${label} must be finite`);return number;};
const ranged=(value,min,max,label)=>{const number=finite(value,label);if(number<min||number>max)throw new RangeError(`${label} is outside the supported range`);return number;};
const clean=value=>Object.is(value,-0)||Math.abs(value)<1e-12?0:value;
const heldGeometry=Object.freeze({radius:RADIUS,planeAngle:PLANE_DEFAULT,swingDirection:0,lowPointZ:0});

export function attackFlightState(attackAngle){
  const attack=ranged(attackAngle,-8,8,'Attack Angle');
  const flight=solveFlight({faceAngle:0,clubPath:0,dynamicLoft:30,attackAngle:attack,clubSpeed:90,club:'7iron'});
  return Object.freeze({attackAngle:clean(flight.attackAngle),spinLoft:clean(flight.spinLoft),launchAngle:clean(flight.launchAngle),ballSpeed:flight.ballSpeed,carry:flight.carry,held:Object.freeze({faceAngle:0,clubPath:0,dynamicLoft:30,clubSpeed:90,club:'7iron'})});
}

export function attackGeometryState(input={}){
  const radius=ranged(input.radius??heldGeometry.radius,.5,2,'Radius'),planeAngle=ranged(input.planeAngle??heldGeometry.planeAngle,30,80,'Plane'),swingDirection=ranged(input.swingDirection??heldGeometry.swingDirection,-12,12,'Swing Direction'),lowPointX=ranged(input.lowPointX,-.2,.2,'Low Point'),lowPointZ=ranged(input.lowPointZ??heldGeometry.lowPointZ,-.2,.2,'Vertical depth');
  const engineState={view:'face',radius,planeAngle,swingDirection,lowPoint:{x:lowPointX,y:0,z:lowPointZ}};
  const output=deriveImpact(engineState),effectiveLowPoint=effectiveLpx(engineState);
  if(!Number.isFinite(output.attackAngle)||!Number.isFinite(output.clubPath)||!Number.isFinite(effectiveLowPoint))throw new RangeError('Geometry output must be finite');
  return Object.freeze({attackAngle:clean(output.attackAngle),clubPath:clean(output.clubPath),effectiveLowPoint:clean(effectiveLowPoint),input:Object.freeze({lowPointX,lowPointZ,radius,planeAngle,swingDirection}),held:Object.freeze({...heldGeometry})});
}

const exactHeld=state=>state.input.radius===heldGeometry.radius&&state.input.planeAngle===heldGeometry.planeAngle&&state.input.swingDirection===heldGeometry.swingDirection&&state.input.lowPointZ===heldGeometry.lowPointZ;
export function evaluateAttackTransfer({descendingInput,ascendingInput,descendingLabel,ascendingLabel,descendingInteracted,ascendingInteracted,directAngleControlUsed=false,presetInjected=false}={}){
  try{const descending=attackGeometryState(descendingInput),ascending=attackGeometryState(ascendingInput);const descendingPassed=descending.attackAngle>=-5&&descending.attackAngle<=-3;const ascendingPassed=ascending.attackAngle>=1&&ascending.attackAngle<=3;const labelsPassed=descendingLabel==='descending'&&ascendingLabel==='ascending';const interactionPassed=Boolean(descendingInteracted)&&Boolean(ascendingInteracted)&&!presetInjected;const heldPassed=exactHeld(descending)&&exactHeld(ascending);const distinct=Math.abs(descending.effectiveLowPoint-ascending.effectiveLowPoint)>1e-12;return Object.freeze({passed:descendingPassed&&ascendingPassed&&labelsPassed&&interactionPassed&&heldPassed&&distinct&&!directAngleControlUsed,descendingPassed,ascendingPassed,labelsPassed,interactionPassed,heldPassed,distinct,directAngleControlUsed:Boolean(directAngleControlUsed),presetInjected:Boolean(presetInjected),descending,ascending});}catch(error){return Object.freeze({passed:false,reason:'invalid-input',error:error.message});}
}

export const ATTACK_AT_IMPACT_LIMITS=Object.freeze({outcomeAngle:[-8,8],lowPointX:[-.2,.2],descending:[-5,-3],ascending:[1,3],held:heldGeometry});
