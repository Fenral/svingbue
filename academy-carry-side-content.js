import {ACADEMY_VOICE_LOCALE,ACADEMY_VOICE_PACK_ID,defineAcademyCueSet} from './academy-voice-manifest.js';
const deepFreeze=value=>{if(!value||typeof value!=='object'||Object.isFrozen(value))return value;Object.values(value).forEach(deepFreeze);return Object.freeze(value);};
export const CARRY_SIDE_CONTENT=deepFreeze({experienceId:'shot-pattern',contentVersion:1,title:'Carry Side',conceptIds:['offline'],prerequisiteExperienceIds:['start-line','shape'],primaryOutcome:'Carry Side',requiredLabels:['COMPOSITION LAB · OUTCOME-LEVEL','ONE MODELED SHOT · NOT DISPERSION',"Now build the same relationship through the engine's real inputs."],surfaces:[
  {id:'mission',eyebrow:'START LINE & SHAPE · 3 OF 3',title:'Where is the carry point?',body:'Start and bend are different. Carry Side combines them: how far right or left the modeled flight reaches the carry plane.'},
  {id:'composition',eyebrow:'COMPOSITION LAB · OUTCOME-LEVEL',title:'Add signed distances.',body:'First find where the launch line would reach Carry. Then add Curve from that line.'},
  {id:'influence',eyebrow:'REINFORCE · CANCEL · CROSS',title:'Reinforce, cancel, or cross.',body:'Compare three signed ledgers at the same modeled Carry.'},
  {id:'boundary',eyebrow:'ONE MODELED SHOT · NOT DISPERSION',title:'A result is not a diagnosis.',body:'One carry point can hide different paths and cannot describe shot-to-shot variation.'},
  {id:'mastery',eyebrow:'4 OF 5 + LIVE TRANSFER',title:'Prove you can combine start and curve.',body:"Now build the same relationship through the engine's real inputs."},
  {id:'result',eyebrow:'CARRY SIDE EVIDENCE',title:'You combined start and shape.',body:'Carry Side ends at the modeled carry plane, not at a resting point or a multi-shot pattern.'}
],composition:{start:{prompt:'Which side is the no-curve carry marker?',choices:['Right','On the target line','Left'],answerIndex:0},curve:{prompt:'Does this left Curve reinforce or cancel the right Start Side?',choices:['Mostly cancels it','Reinforces it','Cannot affect Carry Side'],answerIndex:0},compare:{prompt:'Same carry side. Same flight?',choices:['No. Similar endpoints can come from different paths','Yes. The endpoint proves the path','Only if Face and Path were zero'],answerIndex:0}},cases:[
  {id:'reinforce',label:'REINFORCE',faceAngle:2,clubPath:-2,copy:'Both terms point right. They reinforce.'},
  {id:'cross',label:'CANCEL + CROSS',faceAngle:0,clubPath:4,copy:'Left Curve is larger than right Start Side. The flight crosses and reaches Carry left.'},
  {id:'start-only',label:'START ONLY',faceAngle:3,clubPath:3,copy:'No Curve does not mean on target. Start Direction alone can create Carry Side.'}
],myths:[
  {id:'neutral',claim:'If Carry Side is zero, Face and Path must both be zero.',choices:['True','False. Different signed parts can nearly cancel'],answerIndex:1,explanation:'The outcome alone does not identify one unique delivery.'},
  {id:'curve',claim:'A straight flight has zero Carry Side.',choices:['True','False. A no-curve flight can launch away from target'],answerIndex:1,explanation:'The +3°/+3° state has zero Curve and about 9.0 yards right Carry Side.'},
  {id:'pattern',claim:'This simulated carry point tells me my dispersion.',choices:['True','False. Dispersion needs multiple shots and variability'],answerIndex:1,explanation:'Wind, strike variability and lateral bounce or roll are not included here.'}
],masteryTasks:[
  {id:'references',kind:'choice',prompt:'Which measurement runs from Launch Direction to the carry point?',choices:['Curve','Carry Side','Launch Direction'],answerIndex:0,evidence:'Distinguished the reference lines.'},
  {id:'signed-sum',kind:'choice',prompt:'Start Side is 6.0 yd right. Curve is 9.0 yd left. Where is Carry Side?',choices:['3.0 yd left','15.0 yd right','3.0 yd right'],answerIndex:0,evidence:'Combined opposite signs and recognized crossing.'},
  {id:'inference',kind:'choice',prompt:'Carry Side is 0.0 yd. What can you conclude?',choices:['Start Side and Curve produced a zero net result','Face and Path were both 0.0°','The flight had no Curve'],answerIndex:0,evidence:'Did not reverse one outcome into a unique cause.'},
  {id:'boundary',kind:'choice',prompt:'Which statement is honest about this result?',choices:['It is a modeled carry-side point, not a multi-shot dispersion or resting position','It predicts the full real landing pattern','It includes lateral bounce, roll and wind'],answerIndex:0,evidence:'Preserved the current model boundary.'},
  {id:'live',kind:'live-transfer',mandatory:true,prompt:'Build a right-start/left-curve flight and its mirror, both within ±0.5 yd Carry Side.'}
],sheets:{
  'carry-side':{title:'Carry Side',tags:['≈ REAL WORLD DEFINITION','MODEL OUTPUT'],body:'Carry Side is perpendicular distance from the target line to the modeled carry point. Positive is right; negative is left.'},
  'start-side':{title:'Start Side at Carry',tags:['MODEL GEOMETRY'],body:'Launch Direction is an angle. Start Side converts it to sideways yards at Carry before Curve is added: Carry × sin(Launch Direction).'},
  curve:{title:'Curve',tags:['MODEL'],body:'Curve is side movement from the Launch Direction line to the carry point. Its reference is the launch line, not the target line.'},
  'total-side':{title:'The carry point is not the resting point',tags:['NOT MODELED'],body:'Total Side would include lateral bounce and roll. Flightglass does not calculate a separate lateral roll result.'},
  dispersion:{title:'A point is not a pattern',tags:['NOT DISPERSION'],body:'Dispersion describes how multiple shots spread. One deterministic state has no shot-to-shot variation or confidence region.'},
  limits:{title:'What this integration holds still',tags:['HELD','NOT MODELED'],body:'Centered contact, calm air and a flat carry plane are held. Wind, variability, target recognition and lateral bounce or roll are not modeled.'}
}});
const base={packId:ACADEMY_VOICE_PACK_ID,locale:ACADEMY_VOICE_LOCALE,contentVersion:1,autoplay:true,interruptions:['route','foreground-loss','model-input'],asset:null};
export const CARRY_SIDE_CUES=defineAcademyCueSet({ownerId:'shot-pattern',cues:[
  {...base,cueId:'academy.carry-side.s0.entry',surfaceId:'carry-side-s0',job:'orient',trigger:'surface-entry',text:'Start and curve can reinforce or cancel. Carry Side shows their combined result at the carry point.',beats:[{targetId:'carry-side-brackets',atMs:0,emphasis:'connector'}]},
  {...base,cueId:'academy.carry-side.s1.entry',surfaceId:'carry-side-s1',job:'cue',trigger:'surface-entry',text:'Project the start line to Carry. Then add Curve from that line.',beats:[{targetId:'carry-side-ledger',atMs:0,emphasis:'outline'}]},
  {...base,cueId:'academy.carry-side.s1.cancel',surfaceId:'carry-side-s1',job:'consequence',trigger:'proof-first',text:'Seven and a half right, then seven point four left. The modeled carry point is nearly centered.',beats:[{targetId:'carry-side-final-marker',atMs:0,emphasis:'static-label'}]},
  {...base,cueId:'academy.carry-side.s1.compare',surfaceId:'carry-side-s1',job:'consequence',trigger:'proof-first',text:'A similar carry point does not mean the flights were the same.',beats:[{targetId:'carry-side-path-compare',atMs:0,emphasis:'trace'}]},
  {...base,cueId:'academy.carry-side.s2.entry',surfaceId:'carry-side-s2',job:'cue',trigger:'surface-entry',text:'Same signs reinforce. Opposite signs cancel. If curve is larger, the flight crosses the target line.',beats:[{targetId:'carry-side-case-ledgers',atMs:0,emphasis:'connector'}]},
  {...base,cueId:'academy.carry-side.s3.boundary',surfaceId:'carry-side-s3',job:'consequence',trigger:'proof-first',text:'A centered carry point can hide very different flights. One modeled point is not a dispersion pattern.',beats:[{targetId:'carry-side-boundary-chips',atMs:0,emphasis:'outline'}]},
  {...base,cueId:'academy.carry-side.s4.entry',surfaceId:'carry-side-s4',job:'cue',trigger:'surface-entry',text:'Build two different paths to the same carry line. The live engine decides the gate.',beats:[{targetId:'carry-side-mastery-gate',atMs:0,emphasis:'outline'}]},
  {...base,cueId:'academy.carry-side.s5.pass',surfaceId:'carry-side-s5',job:'consequence',trigger:'mastery-first',text:'You built different flights to the same carry line. That completes Start Line and Shape.',beats:[{targetId:'carry-side-result-evidence',atMs:0,emphasis:'static-label'}]}
]});
export const carrySideCue=id=>CARRY_SIDE_CUES.cues.find(cue=>cue.cueId===id)||null;
