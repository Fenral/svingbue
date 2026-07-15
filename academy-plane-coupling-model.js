import { RADIUS, effectiveLpx, deriveImpact, clubBallContact } from './swing-parameters-and-impact.js';

const finite=(value,label)=>{const number=Number(value);if(!Number.isFinite(number))throw new TypeError(`${label} must be finite`);return number;};
const ranged=(value,min,max,label)=>{const number=finite(value,label);if(number<min||number>max)throw new RangeError(`${label} is outside the lab range`);return number;};
const clean=value=>Object.is(value,-0)||Math.abs(value)<1e-13?0:value;
export const PLANE_COUPLING_HELD=Object.freeze({radius:RADIUS,lowPointZ:-.002,targetEffectiveCm:10.5});

export function exchangeRateCmPerDegree(planeAngle,{radius=RADIUS}={}){
  const plane=ranged(planeAngle,45,70,'Swing Plane'),r=ranged(radius,.5,2,'Radius');
  return clean(r*Math.cos(plane*Math.PI/180)*Math.PI/180*100);
}

export function solvePlaneCouplingState(input={}){
  const planeAngle=ranged(input.planeAngle??45,45,70,'Swing Plane');
  const swingDirection=ranged(input.swingDirection??0,-8,8,'Swing Direction');
  const rawLowPointCm=ranged(input.rawLowPointCm??10.5,-5,25,'Set Low Point');
  const radius=ranged(input.radius??PLANE_COUPLING_HELD.radius,.5,2,'Radius');
  const lowPointZ=ranged(input.lowPointZ??PLANE_COUPLING_HELD.lowPointZ,-.05,.05,'Low Point z');
  const engineState={view:'face',radius,planeAngle,swingDirection,lowPoint:{x:rawLowPointCm/100,y:0,z:lowPointZ}};
  const effective=effectiveLpx(engineState),impact=deriveImpact(engineState),contact=clubBallContact(engineState);
  if(![effective,impact.attackAngle,impact.clubPath,contact.clubZ].every(Number.isFinite))throw new RangeError('Coupling geometry must be finite');
  const rate=exchangeRateCmPerDegree(planeAngle,{radius}),directionShiftCm=effective*100-rawLowPointCm;
  return Object.freeze({
    planeAngle,swingDirection,rawLowPointCm:clean(rawLowPointCm),exchangeRateCmPerDegree:rate,
    directionShiftCm:clean(directionShiftCm),effectiveLowPointCm:clean(effective*100),
    attackAngle:clean(impact.attackAngle),clubPath:clean(impact.clubPath),contactHeightMm:clean(contact.clubZ*1000),
    engineState:Object.freeze(engineState),held:Object.freeze({radius,lowPointZ})
  });
}

export function requiredRawLowPointCm({planeAngle,swingDirection,targetEffectiveCm=PLANE_COUPLING_HELD.targetEffectiveCm,radius=RADIUS}={}){
  return clean(finite(targetEffectiveCm,'Target effective Low Point')+finite(swingDirection,'Swing Direction')*exchangeRateCmPerDegree(planeAngle,{radius}));
}

export function evaluatePlaneCouplingCheck({rawLowPointCm,rawInteracted=false,modelAcknowledged=false,editableFields=['rawLowPointCm'],presetInjected=false}={}){
  try{
    const state=solvePlaneCouplingState({planeAngle:45,swingDirection:4,rawLowPointCm});
    const targetPassed=Math.abs(state.effectiveLowPointCm-PLANE_COUPLING_HELD.targetEffectiveCm)<=.2;
    const provenancePassed=Boolean(rawInteracted)&&!presetInjected&&Array.isArray(editableFields)&&editableFields.length===1&&editableFields[0]==='rawLowPointCm';
    const labelPassed=modelAcknowledged===true;
    return Object.freeze({passed:targetPassed&&provenancePassed&&labelPassed,targetPassed,provenancePassed,labelPassed,presetInjected:Boolean(presetInjected),state});
  }catch(error){return Object.freeze({passed:false,reason:'invalid-input',error:error.message});}
}

export const PLANE_COUPLING_FIXTURES=Object.freeze({
  exchangeRates:Object.freeze({45:1.480960979386122,55:1.201295679141773,70:.7163253131010995}),
  compensation:Object.freeze({45:16.42384391754449,55:15.305182716567092,70:13.365301252404396})
});
