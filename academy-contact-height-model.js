import {
  BALL_RADIUS_M,
  PLANE_DEFAULT,
  RADIUS,
  arcPosition,
  clubBallContact,
  deriveImpact,
  effectiveLpx,
} from './swing-parameters-and-impact.js';
import { groundCrossingTheta0 } from './geo3d-mock/groundcontact.js';

const finite=(value,label)=>{
  const number=Number(value);
  if(!Number.isFinite(number))throw new TypeError(`${label} must be finite`);
  return number;
};
const ranged=(value,min,max,label)=>{
  const number=finite(value,label);
  if(number<min||number>max)throw new RangeError(`${label} is outside the supported range`);
  return number;
};
const clean=value=>Object.is(value,-0)||Math.abs(value)<1e-14?0:value;
const HELD=Object.freeze({lowPointX:.105,radius:RADIUS,planeAngle:PLANE_DEFAULT,swingDirection:0});

export function solveContactHeightState(input={}){
  const lowPointX=ranged(input.lowPointX??HELD.lowPointX,-.2,.2,'Low Point Distance');
  const lowPointZ=ranged(input.lowPointZ??-.002,-.05,.05,'Arc Height at Bottom');
  const radius=ranged(input.radius??HELD.radius,.5,2,'Radius');
  const planeAngle=ranged(input.planeAngle??HELD.planeAngle,30,80,'Plane');
  const swingDirection=ranged(input.swingDirection??HELD.swingDirection,-12,12,'Swing Direction');
  const engineState={view:'face',radius,planeAngle,swingDirection,lowPoint:{x:lowPointX,y:0,z:lowPointZ}};
  const effectiveLowPoint=effectiveLpx(engineState);
  const contact=clubBallContact(engineState);
  const impact=deriveImpact(engineState);
  const theta0=groundCrossingTheta0(engineState);
  const groundEntry=theta0===null?null:arcPosition(-theta0,engineState);
  if(![effectiveLowPoint,contact.clubZ,contact.offset,impact.attackAngle,impact.clubPath].every(Number.isFinite)){
    throw new RangeError('Contact Height geometry must be finite');
  }
  const entryX=groundEntry&&Number.isFinite(groundEntry.x)?clean(groundEntry.x):null;
  return Object.freeze({
    lowPointX:clean(lowPointX),
    lowPointCm:clean(lowPointX*100),
    effectiveLowPoint:clean(effectiveLowPoint),
    effectiveCm:clean(effectiveLowPoint*100),
    lowPointZ:clean(lowPointZ),
    bottomHeightMm:clean(lowPointZ*1000),
    arcLift:clean(contact.clubZ-lowPointZ),
    arcLiftMm:clean((contact.clubZ-lowPointZ)*1000),
    contactHeight:clean(contact.clubZ),
    contactHeightMm:clean(contact.clubZ*1000),
    ballCenterOffset:clean(contact.offset),
    ballCenterOffsetMm:clean(contact.offset*1000),
    ballCenterRelation:contact.clubZ>BALL_RADIUS_M?'above-center':contact.clubZ<BALL_RADIUS_M?'below-center':'at-center',
    groundRelation:contact.clubZ>0?'above-ground':contact.clubZ<0?'below-ground':'at-ground',
    attackAngle:clean(impact.attackAngle),
    clubPath:clean(impact.clubPath),
    groundEntryX:entryX,
    groundEntryCm:entryX===null?null:clean(entryX*100),
    groundEntryOrder:entryX===null?'none':entryX<0?'before-ball':entryX>0?'after-ball':'at-ball',
    input:Object.freeze({lowPointX,lowPointZ,radius,planeAngle,swingDirection}),
    held:HELD,
  });
}

const heldState=state=>state.input.lowPointX===HELD.lowPointX
  &&state.input.radius===HELD.radius
  &&state.input.planeAngle===HELD.planeAngle
  &&state.input.swingDirection===HELD.swingDirection;

export function evaluateContactHeightTransfer({
  lowInput,
  highInput,
  lowInteracted,
  highInteracted,
  lowAcknowledgesBottomBelow,
  highLabel,
  editableFields=['lowPointZ'],
  presetInjected=false,
}={}){
  try{
    const low=solveContactHeightState(lowInput);
    const high=solveContactHeightState(highInput);
    const reference=solveContactHeightState({lowPointZ:0});
    const lowPassed=low.contactHeight>=.001&&low.contactHeight<=.005;
    const highPassed=high.contactHeight>=.022&&high.contactHeight<=.026;
    const attackPassed=Math.abs(low.attackAngle-reference.attackAngle)<=1e-12
      &&Math.abs(high.attackAngle-reference.attackAngle)<=1e-12
      &&Math.abs(low.attackAngle-high.attackAngle)<=1e-12;
    const labelsPassed=lowAcknowledgesBottomBelow===true&&highLabel==='above-center'
      &&high.ballCenterRelation==='above-center'&&low.lowPointZ<0;
    const heldPassed=heldState(low)&&heldState(high);
    const editablePassed=Array.isArray(editableFields)&&editableFields.length===1&&editableFields[0]==='lowPointZ';
    const interactionPassed=Boolean(lowInteracted)&&Boolean(highInteracted)&&!presetInjected;
    const distinct=Math.abs(high.contactHeight-low.contactHeight)>1e-12;
    return Object.freeze({
      passed:lowPassed&&highPassed&&attackPassed&&labelsPassed&&heldPassed&&editablePassed&&interactionPassed&&distinct,
      lowPassed,highPassed,attackPassed,labelsPassed,heldPassed,editablePassed,interactionPassed,distinct,
      presetInjected:Boolean(presetInjected),referenceAttack:reference.attackAngle,low,high,
    });
  }catch(error){
    return Object.freeze({passed:false,reason:'invalid-input',error:error.message});
  }
}

export const CONTACT_HEIGHT_LIMITS=Object.freeze({
  lowWindow:[.001,.005],
  highWindow:[.022,.026],
  ballRadius:BALL_RADIUS_M,
  held:HELD,
});
