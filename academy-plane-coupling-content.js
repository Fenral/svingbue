import { defineAcademyCueSet,ACADEMY_VOICE_LOCALE,ACADEMY_VOICE_PACK_ID } from './academy-voice-manifest.js';

export const PLANE_COUPLING_CONTENT=Object.freeze({
  experienceId:'plane-coupling-lab',conceptIds:['plane-coupling'],prerequisiteExperienceIds:['low-point','strike-depth'],qualifier:'MODEL LAB',
  surfaces:[
    {id:'invitation',eyebrow:'EXPLORE THE PHYSICS · OPTIONAL',title:'Why are “set” and “effective” Low Point different?',body:"Flightglass's rigid-plane engine couples Swing Direction, plane and Low Point. Explore the exact app formula without treating it as compulsory golf truth."},
    {id:'rate',eyebrow:'MODEL MATH · FIXED RADIUS',title:'Plane sets the rate.',body:'Compare the current fixed-plane exchange rate, then apply the same direction at two planes.'},
    {id:'compensation',eyebrow:'MODEL GEOMETRY · TWO PATHS',title:'Preserve the effective result.',body:'Move set Low Point to compensate direction, then keep the second plane path visible.'},
    {id:'boundary',eyebrow:'MODEL LAB · NOT A DIAGNOSIS',title:'Know what the formula does not prove.',body:'Separate implementation literacy from measured parameters, player diagnosis and prescription.'},
    {id:'check',eyebrow:'OPTIONAL UNDERSTANDING CHECK',title:'Verify the transform.',body:'Resolve three distinctions, then preserve effective Low Point with one learner-created raw value.'},
    {id:'result',eyebrow:'MODEL LAB · COMPLETE',title:"You can read Flightglass's coupling.",body:'This records model literacy. Core Academy mastery, rewards and recommendations remain unchanged.'}
  ],
  rateSteps:[
    {prompt:'Which fixed plane has the larger centimeters-per-degree shift?',choices:['45°','70°','They are identical'],answerIndex:0,reveal:'45° → 1.48 cm/° · 70° → 0.72 cm/°'},
    {prompt:'At 45° and +4° direction, what happens?',choices:['Effective Low Point shifts back 5.92 cm','Raw and effective stay equal','Only z changes'],answerIndex:0,reveal:'+10.50 − 5.92 = +4.58 cm effective'},
    {prompt:'At 70° with the same raw x and direction, what changed most directly?',choices:['The exchange rate became smaller','The radius changed','Swing Direction became Club Path'],answerIndex:0,reveal:'+10.50 − 2.87 = +7.63 cm effective'}
  ],
  compensationStages:[
    {id:'flat',label:'45° COMPENSATE',copy:'Direction +4°. Set about +16.42 cm to preserve effective +10.50 cm.'},
    {id:'steep',label:'70° COMPENSATE',copy:'Direction +4°. Set about +13.37 cm because cosine made the exchange rate smaller.'},
    {id:'two-paths',label:'TWO PLANE PATHS',copy:'Compensation preserves effective place; plane still changes tangent decomposition through sin(plane) and cos(plane).'},
    {id:'distinction',label:'DIRECTION ≠ PATH',copy:'Swing Direction is the modeled plane-base direction. Club Path is the instantaneous horizontal tangent at impact.'}
  ],
  myths:[
    {claim:'Direction only changes Club Path.',choices:['True','False in this model'],answerIndex:1,explanation:'Direction also changes effective Low Point through effectiveLpx().'},
    {claim:'The exact rate is a launch-monitor law.',choices:['True','False'],answerIndex:1,explanation:'External sources define the parameter concepts, not this fixed-engine transform.'},
    {claim:'Set Low Point is always the effective value.',choices:['True','Only when the direction shift is zero'],answerIndex:1,explanation:'A nonzero direction can separate the set and effective values.'},
    {claim:'Swing Direction equals Club Path.',choices:['True','False'],answerIndex:1,explanation:'Plane-base direction and the impact tangent are different model quantities.'},
    {claim:'Plane has one contribution percentage.',choices:['True','False · two causal paths'],answerIndex:1,explanation:'It sets the exchange rate and also changes tangent decomposition; those are not additive shares.'}
  ],
  checkItems:[
    {prompt:'Positive Swing Direction does what to effective Low Point here?',choices:['Subtracts from it','Adds to it','Changes only z'],answerIndex:0},
    {prompt:'Which fixed plane shifts more per direction degree?',choices:['45°','70°','Neither'],answerIndex:0},
    {prompt:'Swing Direction and Club Path are:',choices:['Different model quantities','Always identical','Names for Launch Direction'],answerIndex:0}
  ],
  sheets:{
    set:{title:'Set Low Point',tags:['MODEL INPUT'],body:'The x value stored in lowPoint.x before the current engine applies direction and plane coupling.'},
    effective:{title:'Effective Low Point',tags:['MODEL OUTPUT'],body:'The x value consumed by thetaAtImpact(), deriveImpact() and clubBallContact() after coupling.'},
    direction:{title:'Swing Direction',tags:['≈ REAL WORLD DEFINITION'],body:'The plane-base direction over a measured swing segment. It is not Club Path.'},
    plane:{title:'Swing Plane',tags:['≈ REAL WORLD + HELD MODEL'],body:'The vertical plane angle. This lab keeps plane and the 1.20 m radius rigid through the arc.'},
    path:{title:'Club Path',tags:['MODEL OUTPUT'],body:'The instantaneous horizontal clubhead direction at impact, derived here from direction, plane and arc position.'},
    why:{title:'Why no mastery badge',tags:['MODEL LAB'],body:'The exact coupling is not independently validated as a universal player law. Exploration never changes core mastery.'},
    sources:{title:'Sources',tags:['PARAMETER DEFINITIONS ONLY'],body:'TrackMan Swing Direction, Swing Plane, Low Point Distance, Low Point Side and Club Path definitions. They do not validate effectiveLpx().'}
  },
  requiredLabels:['MODEL LAB','CURRENT FLIGHTGLASS GEOMETRY','SWING DIRECTION · NOT CLUB PATH','SET LOW POINT','DIRECTION SHIFT','EFFECTIVE LOW POINT','MODEL OUTPUT','NOT MODELED','NO MASTERY BADGE','NO SWING PRESCRIPTION']
});

const base={packId:ACADEMY_VOICE_PACK_ID,locale:ACADEMY_VOICE_LOCALE,contentVersion:1,autoplay:true,interruptions:['route','foreground-loss','model-input'],asset:null};
export const PLANE_COUPLING_CUES=defineAcademyCueSet({ownerId:'plane-coupling-lab',cues:[
  {...base,cueId:'academy.plane-coupling.s0.entry',surfaceId:'plane-coupling-s0',job:'orient',trigger:'surface-entry',text:"This optional lab explains Flightglass's geometry bookkeeping. It is a model transform, not a diagnosis of your swing.",beats:[{targetId:'coupling-qualifier',atMs:0,emphasis:'static-label'}]},
  {...base,cueId:'academy.plane-coupling.s1.entry',surfaceId:'plane-coupling-s1',job:'cue',trigger:'proof-first',text:'A flatter fixed plane has a larger exchange rate. The same direction moves effective Low Point farther.',beats:[{targetId:'coupling-rate',atMs:0,emphasis:'connector'}]},
  {...base,cueId:'academy.plane-coupling.s2.entry',surfaceId:'plane-coupling-s2',job:'consequence',trigger:'proof-first',text:'Compensate set Low Point to preserve the effective place. Plane still changes the tangent through another model path.',beats:[{targetId:'coupling-effective',atMs:0,emphasis:'trace'}]},
  {...base,cueId:'academy.plane-coupling.s3.entry',surfaceId:'plane-coupling-s3',job:'cue',trigger:'surface-entry',text:'Use this formula to understand the app. Do not reverse it into a universal player diagnosis.',beats:[{targetId:'coupling-boundary',atMs:0,emphasis:'outline'}]},
  {...base,cueId:'academy.plane-coupling.s4.entry',surfaceId:'plane-coupling-s4',job:'cue',trigger:'surface-entry',text:'Use the ledger to preserve the effective value. The engine, not the rounded display, decides this check.',beats:[{targetId:'coupling-ledger',atMs:0,emphasis:'connector'}]},
  {...base,cueId:'academy.plane-coupling.s5.complete',surfaceId:'plane-coupling-s5',job:'consequence',trigger:'mastery-first',text:"You can now read the app's set-to-effective transform. Core Academy progress and rewards remain unchanged.",beats:[{targetId:'coupling-result',atMs:0,emphasis:'static-label'}]}
]});
export const planeCouplingCue=id=>PLANE_COUPLING_CUES.cues.find(cue=>cue.cueId===id)||null;
