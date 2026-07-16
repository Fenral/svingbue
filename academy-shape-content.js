import { ACADEMY_VOICE_LOCALE, ACADEMY_VOICE_PACK_ID, defineAcademyCueSet } from './academy-voice-manifest.js';

const deepFreeze=value=>{if(!value||typeof value!=='object'||Object.isFrozen(value))return value;Object.values(value).forEach(deepFreeze);return Object.freeze(value);};

export const SHAPE_CONTENT=deepFreeze({
  experienceId:'shape',contentVersion:1,title:'Shape',conceptIds:['spin-axis','curve'],prerequisiteExperienceIds:['start-line'],primaryOutcome:'Shape',
  surfaces:[
    {id:'mission',eyebrow:'START LINE & SHAPE · 2 OF 3',title:'Keep the start. Change the bend.',body:'Three shots can begin on the same line and fly three different shapes. Make one straight, one left and one right—without moving its +1.0° start.'},
    {id:'lab',eyebrow:'SAME START · DIFFERENT GAP',title:'Same start. Different gap.',body:'Begin with Face and Path matched. Then separate them while the Launch gate stays fixed.'},
    {id:'influence',eyebrow:'MECHANISM · AMPLIFIER',title:'One mechanism. One amplifier.',body:'Face and Path form one gap. Carry does a different job: it changes how many sideways yards the modeled tilt can accumulate.'},
    {id:'myths',eyebrow:'PREDICT · TEST · BOUND',title:'Test the story, not just the number.',body:'Run three predictions, then keep the model boundary visible.'},
    {id:'mastery',eyebrow:'4 OF 5 + LIVE TRANSFER',title:'Prove you can separate start from shape.',body:'Hold one start line and create opposite modeled shapes yourself.'},
    {id:'result',eyebrow:'SHAPE EVIDENCE',title:'You separated start from bend.',body:'The result keeps knowledge, live control and model limits separate.'}
  ],
  lab:{
    prediction:{prompt:'Face +1.0° and Path +1.0°. What shape do you expect?',choices:['Straight','Bends left','Bends right'],answerIndex:0,explanation:'Equal does not mean on target. It means no modeled gap—and therefore no modeled curve.'},
    right:{prompt:'Set Face to +2.0° and Path to −2.0°.',explanation:'Same +1.0° start. The +4.0° gap creates +6.0° modeled axis and 14.9 yards right curve.'},
    left:{prompt:'Set Face to 0.0° and Path to +4.0°.',explanation:'Same +1.0° start. The gap reversed, so the modeled axis and curve reversed.'},
    reflection:{prompt:'What stayed the same?',choices:['Launch Direction and Carry','Face-to-Path and Spin Axis','Face Angle and Club Path'],answerIndex:0}
  },
  influence:{gapPrompt:'Which change has the larger direct effect on Face-to-Path?',gapChoices:['Neither; equal degrees change the difference equally','Face, because it leads Launch Direction','Path, because curve follows Path'],gapAnswerIndex:0,amplifierPrompt:'What changed at launch?',amplifierChoices:['Not the modeled Spin Axis; Carry changed the curve yards','Spin Axis increased with speed','The app switched clubs'],amplifierAnswerIndex:0},
  myths:[
    {id:'path-alone',claim:'An in-to-out Path automatically creates a left-bending shot.',prompt:'Do matched +4°/+4° and 0°/+4° both bend left?',choices:['Yes, Path is +4° in both','No. Only the state with a negative gap bends left'],answerIndex:1,explanation:'Path is one component of the gap. Matched Face and Path produce zero modeled Curve.'},
    {id:'backspin',claim:'If Backspin rises, this model must curve more.',prompt:'Is Backspin an input to the current Curve formula?',choices:['Yes, more Backspin always means more Curve','No. This formula uses Carry and modeled Spin Axis'],answerIndex:1,explanation:'Real flight depends on the full spin vector and aerodynamics. This smaller formula does not use Backspin magnitude.'},
    {id:'complete-cause',claim:'Once Face-to-Path is known, real curve is fully determined.',prompt:'Does this centered-contact model tell the whole real story?',choices:['Yes, the phone has measured contact','No. Impact location and gear effect remain outside it'],answerIndex:1,explanation:'Centered contact is held. Gear effect and impact location are not modeled; wind belongs to a later experience.'}
  ],
  masteryTasks:[
    {id:'definition',kind:'choice',prompt:'Face is +2.5°. Path is −1.5°. What is Face-to-Path?',choices:['+4.0°','+1.0°','−4.0°'],answerIndex:0,evidence:'Applied Face Angle minus Club Path.'},
    {id:'direction',kind:'choice',prompt:'Face-to-Path is −3.0°. What does Flightglass predict?',choices:['Negative Spin Axis and left Curve','Positive Spin Axis and right Curve','No Curve because Path is positive'],answerIndex:0,evidence:'Used the model sign convention.'},
    {id:'zero-gate',kind:'choice',prompt:'Face is +3.0° and Path is +3.0°. The ball begins right. What shape appears?',choices:['Straight from its rightward start','A draw back to target','A fade farther right'],answerIndex:0,evidence:'Recognized the matched zero-curve gate.'},
    {id:'boundary',kind:'choice',prompt:'A real wood shot curves differently after a toe strike. Which explanation is honest?',choices:['Impact location and gear effect are not modeled here','The Face-to-Path definition stops applying','Wind changed launch Spin Axis'],answerIndex:0,evidence:'Kept a real cause outside this engine boundary.'},
    {id:'live-transfer',kind:'live-transfer',mandatory:true,prompt:'Keep Launch at +1.0° ±0.1°. Create at least 10 yards left, then at least 10 yards right Curve.'}
  ],
  sheets:{
    'face-to-path':{title:'Face-to-Path',tags:['DEFINITION','≈ REAL WORLD'],body:'Face-to-Path is Face Angle minus Club Path. For centered contact, the gap is a major clue to expected curvature, not the whole real-world story.'},
    'spin-axis':{title:'Spin Axis',tags:['MODEL'],body:'Spin Axis describes launch spin tilt. Flightglass transforms Face-to-Path into a modeled axis; its multiplier and clamp are teaching-model choices, not a measured launch value.'},
    curve:{title:'Curve',tags:['MODEL'],body:'Curve is sideways movement from the Launch Direction line to the carry point. It is not Offline, which is measured from the target line.'},
    influence:{title:'Different jobs, not one percentage',tags:['MODEL','HELD'],body:'Face and Path create one direct gap. The model maps that gap to Spin Axis. Carry amplifies the sideways yards; Launch Direction stays a held reference.'},
    limits:{title:'What this Shape Lab holds still',tags:['HELD','NOT MODELED'],body:'The lab assumes centered contact and calm air. It does not model impact location, gear effect, full 3-D spin, dynamic lie or wind. Backspin is not an input to this Curve equation.'}
  }
});

const voiceBase={packId:ACADEMY_VOICE_PACK_ID,locale:ACADEMY_VOICE_LOCALE,contentVersion:1,autoplay:true,interruptions:['route','foreground-loss','model-input'],asset:null};
export const SHAPE_CUES=defineAcademyCueSet({ownerId:'shape',cues:[
  {...voiceBase,cueId:'academy.shape.s0.entry',surfaceId:'shape-s0',job:'orient',trigger:'surface-entry',text:'Keep the same start line. Now make the flight bend left, right, or not at all.',beats:[{targetId:'shape-three-traces',atMs:0,emphasis:'connector'}]},
  {...voiceBase,cueId:'academy.shape.s1.entry',surfaceId:'shape-s1',job:'cue',trigger:'surface-entry',text:'Match Face and Path first. The flight starts right, but it does not bend.',beats:[{targetId:'shape-gap-controls',atMs:0,emphasis:'outline'}]},
  {...voiceBase,cueId:'academy.shape.s1.separated',surfaceId:'shape-s1',job:'consequence',trigger:'proof-first',text:'The start stayed fixed. The gap changed, so the modeled shape changed.',beats:[{targetId:'shape-curve-bracket',atMs:0,emphasis:'connector'}]},
  {...voiceBase,cueId:'academy.shape.s1.reversed',surfaceId:'shape-s1',job:'consequence',trigger:'proof-first',text:'Reverse the gap, and the modeled curve reverses while the separate start line remains visible.',beats:[{targetId:'shape-axis-puck',atMs:0,emphasis:'static-label'}]},
  {...voiceBase,cueId:'academy.shape.s2.entry',surfaceId:'shape-s2',job:'cue',trigger:'surface-entry',text:'The gap sets the modeled tilt. Carry changes how far that tilt can move the ball sideways.',beats:[{targetId:'shape-causal-chain',atMs:0,emphasis:'connector'}]},
  {...voiceBase,cueId:'academy.shape.s3.boundary',surfaceId:'shape-s3',job:'consequence',trigger:'proof-first',text:'Face-to-Path is powerful, but centered contact is an assumption—not a fact measured by this phone.',beats:[{targetId:'shape-boundary-chips',atMs:0,emphasis:'outline'}]},
  {...voiceBase,cueId:'academy.shape.s4.entry',surfaceId:'shape-s4',job:'cue',trigger:'surface-entry',text:'Hold the same start, create opposite gaps, and build both modeled shapes yourself.',beats:[{targetId:'shape-mastery-gate',atMs:0,emphasis:'outline'}]},
  {...voiceBase,cueId:'academy.shape.s5.pass',surfaceId:'shape-s5',job:'consequence',trigger:'mastery-first',text:'You held the start and changed the shape. Next, combine both to explain the landing side.',beats:[{targetId:'shape-result-evidence',atMs:0,emphasis:'static-label'}]}
]});

export function shapeCue(cueId){return SHAPE_CUES.cues.find(cue=>cue.cueId===cueId)||null;}
