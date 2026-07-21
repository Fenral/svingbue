import{ACADEMY_VOICE_LOCALE,ACADEMY_VOICE_PACK_ID,defineAcademyCueSet}from'./academy-voice-manifest.js';
const freeze=value=>{if(!value||typeof value!=='object'||Object.isFrozen(value))return value;Object.values(value).forEach(freeze);return Object.freeze(value);};

export const FLIGHT_HEIGHT_DESCENT_CONTENT=freeze({
  experienceId:'flight-height-descent',contentVersion:1,title:'Flight Height & Descent',conceptIds:['apex','landing-angle'],
  prerequisiteExperienceIds:['delivered-loft-launch','backspin'],primaryOutcome:'Apex and Landing Angle',
  requiredLabels:['PROFILE SCHEMATIC · NUMERIC OUTPUTS AUTHORITATIVE','APEX · HEIGHT ABOVE LAUNCH ELEVATION','LANDING · DOWN TO HORIZON AT EQUAL ELEVATION','BACKSPIN RPM · NOT USED BY THIS FLIGHT FIT','LANDING ANGLE ≠ STOPPING DISTANCE'],
  surfaces:[
    {id:'mission',eyebrow:'LAUNCH, SPIN & DESCENT · 4 OF 4',title:'Same peak. Different return.',body:'Apex tells how high the model climbs. Landing Angle tells how it returns to launch elevation. Build the same peak with two different descents.'},
    {id:'lab',eyebrow:'FLIGHT PROFILE LAB · MODEL',title:'What raises the peak?',body:'Launch Angle and Ball Speed set modeled Apex. Descent also reads Spin Loft and Launch.'},
    {id:'decomposition',eyebrow:'LANDING RAW · PATH LEDGER',title:'Follow the paths into descent.',body:'Vertical Spin Loft is the ONLY driver: Landing saturates toward 52.8° as spin loft grows. Launch and Ball Speed shape Apex, not descent.'},
    {id:'boundary',eyebrow:'REAL FLIGHT · MODEL BOUNDARY',title:'A flight profile is not a stopping promise.',body:'Separate fitted height and return angle from real spin, surface, bounce and roll.'},
    {id:'mastery',eyebrow:'4 OF 5 + LIVE PROFILE',title:'Prove you can separate height from descent.',body:'Match the raw Apex band twice, then build materially different unclamped Landing Angles.'},
    {id:'result',eyebrow:'FLIGHT HEIGHT & DESCENT EVIDENCE',title:'You separated peak height from return angle.',body:'Launch, spin and descent evidence is complete.'}
  ],
  lab:{
    launchPrediction:{prompt:'If Launch rises while Spin Loft and Ball Speed stay fixed, what happens to Apex?',choices:['It rises in this model','It must fall','Backspin rpm decides'],answerIndex:0},
    speedPrediction:{prompt:'Does each equal Club Speed step add the same Apex height?',choices:['No. The Ball Speed fit saturates','Yes. Every step adds equal height','Only Landing changes'],answerIndex:0},
    landingReference:{prompt:'What is the reference for Landing Angle?',choices:['The horizon at the equal-elevation carry point','The club face at impact','The slope of the ground'],answerIndex:0},
    separateOutcomes:{prompt:'Does a 33 yd Apex uniquely determine Landing Angle?',choices:['No. Spin Loft and Launch also enter the Landing fit','Yes. Apex is the only input','Yes, if Backspin matches'],answerIndex:0}
  },
  decompositionStages:[
    {id:'ledger',label:'BASE LEDGER',copy:'The fit anchor is neutral. Spin Loft and Launch enter directly; Apex is the mediator.'},
    {id:'launch',label:'LAUNCH · TWO PATHS',copy:'Launch changes LandingRaw directly and also changes the Apex mediator. These are paths, not independent shares.'},
    {id:'speed',label:'BALL SPEED · INDIRECT',copy:'Ball Speed does not reach Landing at all — it shapes Apex and Carry, while descent follows spin loft alone.'},
    {id:'spin',label:'SPIN LOFT · DIRECT',copy:'+1° Spin Loft adds +0.5° LandingRaw directly. Simultaneous Ball Speed/Apex change remains disclosed.'},
    {id:'clamp',label:'MODEL CLAMP',copy:'Landing saturates toward 52.8° and never reaches it — 52.448° at the steepest lesson delivery. The old 60° ceiling is gone.'}
  ],
  myths:[
    {claim:'Same Apex means same Landing.',choices:['True','False'],answerIndex:1,explanation:'False. The verified pair shares Apex within 0.001 yd and differs 6.63° in Landing.'},
    {claim:'More Backspin rpm makes current Apex higher.',choices:['True','Not in the current Flightglass equation'],answerIndex:1,explanation:'Real Spin Rate affects trajectory. The current Apex and Landing fits omit the calculated rpm value.'},
    {claim:'Landing Angle tells the distance where the ball stops.',choices:['True','False'],answerIndex:1,explanation:'Real stopping also depends on landing speed, Spin Rate, surface, slope, bounce and roll. Flightglass does not calculate stopping distance.'},
    {claim:'60° is the physical maximum Landing Angle.',choices:['True','False. It is the current app clamp'],answerIndex:1,explanation:'Raw fitted change remains visible behind the 60° display ceiling.'},
    {claim:'Higher and steeper are always better.',choices:['True','False. It depends on shot, conditions and intent'],answerIndex:1,explanation:'Academy teaches modeled outcomes, not a universal target or delivery prescription.'}
  ],
  masteryTasks:[
    {kind:'choice',prompt:'Apex is:',choices:['Maximum trajectory height above launch elevation','Launch Angle at impact','Landing speed'],answerIndex:0,evidence:'Apex definition'},
    {kind:'choice',prompt:'Which values enter current Flightglass Apex?',choices:['Ball Speed and Launch Angle','Backspin rpm and Landing Angle','Spin Axis and Curve'],answerIndex:0,evidence:'Apex inputs'},
    {kind:'choice',prompt:'Which Landing statement is complete?',choices:['Spin Loft and Launch enter directly; Apex also enters as a mediator','Apex alone determines Landing','Backspin rpm is the only Landing input'],answerIndex:0,evidence:'Landing paths'},
    {kind:'choice',prompt:'Landing Angle is 55°. What can the app honestly conclude?',choices:['The modeled trajectory returns at 55° to the horizon at equal elevation','The ball will stop within a known distance','The turf is firm'],answerIndex:0,evidence:'Stopping boundary'},
    {kind:'live-transfer',mandatory:true,prompt:'Build two Apex 31.65–32.05 yd states: Landing below 50° and above 52°, at least 6° apart.'}
  ],
  sheets:{
    apex:{title:'Apex',tags:['≈ REAL WORLD DEFINITION','MODEL OUTPUT'],body:'Maximum vertical height of the modeled trajectory above launch elevation.'},
    landing:{title:'Landing Angle',tags:['≈ REAL WORLD DEFINITION','MODEL OUTPUT'],body:'Downward trajectory angle relative to the horizon when the modeled ball returns to launch elevation.'},
    apexInputs:{title:'What sets modeled Apex',tags:['MODEL / FIT'],body:'Current Flightglass uses Ball Speed and Launch Angle. Ball Speed uses a saturating fit; Launch multiplies it through a clamped factor.'},
    landingPaths:{title:'What sets modeled Landing',tags:['MODEL / FIT'],body:'Spin Loft and Launch enter directly. Apex enters as mediator. Launch also changed Apex, so it has two paths. Ball Speed reaches Landing through Apex.'},
    backspin:{title:'Missing Backspin loop',tags:['MODEL BOUNDARY'],body:'Real Spin Rate affects trajectory. Flightglass calculates Backspin but does not use that rpm in current Apex or Landing equations.'},
    clamps:{title:'Landing clamps',tags:['MODEL CLAMPS'],body:'Landing display is clamped to 32°–60°. Raw fitted Landing remains available. These bounds are not physical maxima or minima.'},
    stopping:{title:'Not stopping distance',tags:['NOT MODELED HERE'],body:'Landing Angle is one input to bounce and roll. Real stopping also depends on landing speed, Spin Rate, surface, slope and collision. This lesson does not calculate stopping distance.'},
    limits:{title:'Model limits',tags:['HELD','NOT MODELED'],body:'One 7-iron preset, calm air, equal elevation and fitted trajectory. No Spin Rate feedback, detailed aerodynamics, ground or surface.'},
    sources:{title:'Sources',tags:['DEFINITION SOURCES'],body:'TrackMan Height (Apex), Landing Angle, Ball Speed, Launch Angle and Spin Rate parameter definitions. Exact fits, decomposition and clamps are Flightglass model claims.'}
  }
});

const base={packId:ACADEMY_VOICE_PACK_ID,locale:ACADEMY_VOICE_LOCALE,contentVersion:1,autoplay:true,interruptions:['route','foreground-loss','model-input'],asset:null};
export const FLIGHT_HEIGHT_DESCENT_CUES=defineAcademyCueSet({ownerId:'flight-height-descent',cues:[
  {...base,cueId:'academy.flight-height.s0.entry',surfaceId:'flight-height-s0',job:'orient',trigger:'surface-entry',text:'Apex and descent are related, but one does not determine the other. Build the same peak twice.',beats:[{targetId:'flight-height-profile',atMs:0,emphasis:'outline'}]},
  {...base,cueId:'academy.flight-height.s1.entry',surfaceId:'flight-height-s1',job:'cue',trigger:'surface-entry',text:'Launch and Ball Speed set modeled height. Descent also reads Spin Loft and Launch, so Apex is only one part.',beats:[{targetId:'flight-height-apex-paths',atMs:0,emphasis:'connector'}]},
  {...base,cueId:'academy.flight-height.s2.entry',surfaceId:'flight-height-s2',job:'cue',trigger:'surface-entry',text:'Vertical Spin Loft enters alone. Launch and Ball Speed change the flight height, never its descent angle.',beats:[{targetId:'flight-height-landing-paths',atMs:0,emphasis:'connector'}]},
  {...base,cueId:'academy.flight-height.s3.entry',surfaceId:'flight-height-s3',job:'consequence',trigger:'surface-entry',text:'Real spin and surface matter. This fitted profile cannot promise where the ball stops after landing.',beats:[{targetId:'flight-height-boundaries',atMs:0,emphasis:'outline'}]},
  {...base,cueId:'academy.flight-height.s4.entry',surfaceId:'flight-height-s4',job:'cue',trigger:'surface-entry',text:'Match the peak twice. Then separate descent through Spin Loft, Launch, and the Apex path.',beats:[{targetId:'flight-height-live',atMs:0,emphasis:'outline'}]},
  {...base,cueId:'academy.flight-height.s5.pass',surfaceId:'flight-height-s5',job:'consequence',trigger:'mastery-first',text:'You matched height and changed descent. The launch, spin, and descent journey is complete.',beats:[{targetId:'flight-height-result',atMs:0,emphasis:'static-label'}]}
]});
export const flightHeightDescentCue=id=>FLIGHT_HEIGHT_DESCENT_CUES.cues.find(cue=>cue.cueId===id)||null;
