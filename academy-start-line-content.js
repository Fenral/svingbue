import { ACADEMY_VOICE_LOCALE, ACADEMY_VOICE_PACK_ID, defineAcademyCueSet } from './academy-voice-manifest.js';

const deepFreeze=value=>{
  if (!value || typeof value!=='object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
};

export const START_LINE_CONTENT=deepFreeze({
  experienceId:'start-line',
  contentVersion:1,
  title:'Start Line',
  conceptIds:['face-angle','club-path','start-direction'],
  prerequisiteExperienceIds:[],
  primaryOutcome:'Launch Direction',
  signConvention:'Positive starts right; negative starts left · HELD · RH',
  surfaces:[
    { id:'mission',eyebrow:'ACADEMY · DIRECTION',title:'Start Line',body:'Launch Direction is the horizontal angle the ball starts from the target line. It does not include curve.',mission:'Set +1.0°, then hold it when delivered loft changes.',action:'Enter the Direction Lab' },
    { id:'lab',eyebrow:'BUILD +1.0°',title:'Direction Lab',body:'Move Face to +2.0°. Path and delivered loft stay held.',caption:'INITIAL DIRECTION · CURVE EXCLUDED',action:'Prove the loft modifier' },
    { id:'influence',eyebrow:'MODEL · SHARE',title:'The split is not fixed',body:'Face and path stay unchanged. Predict what happens when delivered loft rises to 46°.',action:'Open the myth experiments' },
    { id:'myths',eyebrow:'PREDICT · RUN · EXPLAIN',title:'Useful shortcut, bounded model',body:'Resolve three predictions about the blend, the changing split and what remains outside this model.',action:'Open Mastery Check' },
    { id:'mastery',eyebrow:'4 OF 5 + LIVE TRANSFER',title:'Mastery Check',body:'Rebuild the target when the held delivered loft changes.',action:'Submit evidence' },
    { id:'result',eyebrow:'START LINE EVIDENCE',title:'Your start-line read',body:'Your result separates knowledge from the mandatory live transfer.',action:'Return to Academy' }
  ],
  influenceRoles:[
    { label:'Face Angle',role:'DRIVES',detail:'larger share here' },
    { label:'Club Path',role:'DRIVES',detail:'smaller share here' },
    { label:'Delivered Loft',role:'MODIFIES',detail:'changes the split' }
  ],
  myths:[
    { id:'path-alone',prompt:'Face +2°, Path −2°, Mid 30°. Where does the ball start?',choices:['On the face at +2°','On the path at −2°','Between them, closer to face'],answerIndex:2,explanation:'The engine returns +1.0°: Face contributes +1.5° and Path contributes −0.5°.' },
    { id:'fixed-split',prompt:'Is Launch Direction always a 75/25 face–path split?',choices:['Yes, for every full shot','No. The model split changes with delivered loft','Only Ball Speed changes it'],answerIndex:1,explanation:'The current model face share is 83.5% at 13°, 75% at 30° and 67% at 46°.' },
    { id:'boundary',prompt:'Do Face, Path and this loft taper explain every real start line?',choices:['Yes, if the strike is centered','No. Dynamic lie, impact location and full 3-D collision can also matter','Only wind is missing'],answerIndex:1,explanation:'Dynamic lie, strike location, bulge and roll, gear effect and collision deflection are not modeled.' }
  ],
  masteryTasks:[
    { id:'definition',kind:'choice',prompt:'What does Launch Direction measure?',choices:['Where the ball finishes after curve','The vertical angle the ball climbs','The initial horizontal direction from the target line','The direction the clubhead travels'],answerIndex:2,explanation:'Launch Direction is measured immediately after separation. Curve and wind belong later in the flight.' },
    { id:'direct-blend',kind:'choice',prompt:'Face is +2.0°, Path is −2.0° and delivered loft is 30°. What does this model return?',choices:['About +1.0°','Exactly +2.0°','Exactly −2.0°','0.0°'],answerIndex:0,explanation:'At 30° the model uses 75% Face and 25% Path: +1.5° plus −0.5° = +1.0°.' },
    { id:'modifier',kind:'choice',prompt:'Face and Path stay +2.0° and −2.0°. Delivered loft rises from 30° to 46°. What happens in this model?',choices:['It moves closer to Face','It moves toward Path because Path receives a larger share','It stays fixed because loft is only vertical','It becomes Curve'],answerIndex:1,explanation:'The face share falls from 75% to 67%, moving Launch Direction from +1.0° to about +0.7°.' },
    { id:'boundary',kind:'choice',prompt:'Which factor is materially real but absent from this live Launch Direction model?',choices:['Face Angle','Club Path','Dynamic Loft taper','Dynamic Lie and impact location'],answerIndex:3,explanation:'The live model uses Face, Path and a Dynamic Loft taper. Dynamic Lie, strike location and full collision behavior remain outside it.' },
    { id:'live-transfer',kind:'live-transfer',mandatory:true,prompt:'Create the hidden target, predict the held-loft shift, then restore the same Launch Direction.',tolerance:.1 }
  ],
  sheets:{
    'launch-direction':{ title:'Launch Direction',tags:['DEFINITION'],body:"Launch Direction is the ball's initial horizontal direction relative to the target line, measured immediately after it leaves the face. Positive is right and negative is left under Flightglass's current right-handed convention. It does not include curve, wind drift or where the ball finally lands." },
    'face-angle':{ title:'Face Angle',tags:['DEFINITION','MODEL'],body:"Face Angle is where the face points horizontally at the impact location. It is not Club Path or the face's address position. This model gives it the larger share across the available delivered-loft range, without turning that into a universal diagnosis or swing prescription." },
    'club-path':{ title:'Club Path',tags:['DEFINITION'],body:"Club Path is the horizontal direction the clubhead's geometric center moves through impact. Positive is in-to-out and negative is out-to-in under the current right-handed convention. It contributes directly to Launch Direction." },
    'delivered-loft':{ title:'Delivered Loft and the split',tags:['MODEL'],body:'Flightglass reduces the face share as Dynamic Loft rises: 83.5% at 13°, 75% at 30° and 67% at 46°. These are model weights, not universal club rules. Real impact is three-dimensional; this horizontal taper currently uses Dynamic Loft alone.' },
    'model-limits':{ title:'Model limits',tags:['HELD','NOT MODELED'],body:'The instrument holds centered contact, target line and the current right-handed sign convention. It does not simulate Dynamic Lie, impact location, bulge and roll, gear effect or collision-induced face movement. Low, Mid and High are delivered-loft comparisons inside the existing 7-iron engine.' }
  }
});

const voiceBase={ packId:ACADEMY_VOICE_PACK_ID,locale:ACADEMY_VOICE_LOCALE,contentVersion:1,autoplay:true,interruptions:['route','foreground-loss','model-input'],asset:null };
export const START_LINE_CUES=defineAcademyCueSet({ ownerId:'start-line',cues:[
  { ...voiceBase,cueId:'academy.start-line.s0.entry',surfaceId:'start-line-s0',job:'orient',trigger:'surface-entry',text:'Start line is a blend. Face leads, path contributes, and delivered loft changes the split.',beats:[{targetId:'start-line-blend-vectors',atMs:0,emphasis:'connector'}] },
  { ...voiceBase,cueId:'academy.start-line.s1.entry',surfaceId:'start-line-s1',job:'cue',trigger:'surface-entry',text:'Move the face to plus two. Watch the launch ray settle between face and path.',beats:[{targetId:'start-line-face-control',atMs:0,emphasis:'outline'},{targetId:'start-line-launch-gate',atMs:1800,emphasis:'static-label'}] },
  { ...voiceBase,cueId:'academy.start-line.s2.entry',surfaceId:'start-line-s2',job:'cue',trigger:'surface-entry',text:'Same face, same path. More delivered loft gives path a larger share in this model.',beats:[{targetId:'start-line-loft-share',atMs:0,emphasis:'connector'}] },
  { ...voiceBase,cueId:'academy.start-line.s3.entry',surfaceId:'start-line-s3',job:'cue',trigger:'surface-entry',text:'Predict first. The model will separate a useful shortcut from a fixed rule.',beats:[{targetId:'start-line-myth-choices',atMs:0,emphasis:'outline'}] },
  { ...voiceBase,cueId:'academy.start-line.s4.entry',surfaceId:'start-line-s4',job:'cue',trigger:'surface-entry',text:'The labels are gone. Rebuild the target when the held loft changes.',beats:[{targetId:'start-line-mastery-gate',atMs:0,emphasis:'outline'}] },
  { ...voiceBase,cueId:'academy.start-line.s5.pass',surfaceId:'start-line-s5',job:'consequence',trigger:'mastery-first',text:'You can control start line and explain when the face-path split changes.',beats:[{targetId:'start-line-result-evidence',atMs:0,emphasis:'static-label'}] }
] });

export function startLineCue(cueId) { return START_LINE_CUES.cues.find(cue=>cue.cueId===cueId) || null; }
