import { ACADEMY_VOICE_LOCALE, ACADEMY_VOICE_PACK_ID, defineAcademyCueSet } from './academy-voice-manifest.js';

const freeze=value=>{
  if(!value||typeof value!=='object'||Object.isFrozen(value))return value;
  Object.values(value).forEach(freeze);
  return Object.freeze(value);
};

export const CONTACT_HEIGHT_CONTENT=freeze({
  experienceId:'strike-depth',
  contentVersion:1,
  title:'Contact Height',
  internalLabel:'Strike Depth',
  conceptIds:['strike-depth'],
  prerequisiteExperienceIds:['low-point'],
  primaryOutcome:'modeled clubhead-path height at the ball',
  requiredLabels:[
    'LOW POINT DISTANCE +10.5 CM AHEAD',
    'ARC HEIGHT AT BOTTOM −2.0 MM',
    'MODELED CONTACT HEIGHT +1.8 MM ABOVE GROUND',
    'MODEL GEOMETRY · POINT PATH, NOT FACE IMPACT',
    'ATTACK −4.1° · UNCHANGED',
  ],
  surfaces:[
    {id:'mission',eyebrow:'STRIKE & CONTACT · 3 OF 3',title:'Move contact. Keep the direction.',body:'Raise or lower the modeled arc. Watch the path point move at the ball while Attack Angle stays exactly the same.'},
    {id:'lab',eyebrow:'MODEL GEOMETRY · CONTACT WINDOW',title:'Translate the arc.',body:'Bottom height plus arc lift gives the modeled path-point height at the ball.'},
    {id:'influence',eyebrow:'DIRECT HEIGHT · LIFT BUDGET',title:'Two coordinates build one height.',body:'Vertical height moves contact directly. Low Point distance changes how far the rigid arc rises before the ball.'},
    {id:'boundary',eyebrow:'POINT PATH · FLAT GROUND',title:'A point model is not a divot.',body:'This instrument separates coordinates cleanly without simulating a clubface, sole, collision or turf deformation.'},
    {id:'mastery',eyebrow:'4 OF 5 + LIVE INVARIANCE',title:'Prove you can move height without rotating direction.',body:'Change only vertical arc height. Capture one low path and one above-center path at the same Attack.'},
    {id:'result',eyebrow:'CONTACT HEIGHT EVIDENCE',title:'You separated contact height from Attack.',body:'One-to-one translation, the Low Point lift budget and two live heights are verified.'},
  ],
  lab:{
    prediction:{prompt:'The bottom is 2.0 mm below ground and the arc rises 3.8 mm before the ball. Where is the path point?',choices:['About 1.8 mm above ground','About 5.8 mm below ground','Exactly at the ball center'],answerIndex:0},
    steps:[
      'Read bottom height plus arc lift as one signed ledger.',
      'Raise the modeled bottom by exactly 5 mm.',
      'Move Contact Height above the modeled ball center at 21.3 mm.',
      'Return Contact Height to 1–5 mm above ground.',
    ],
  },
  proof:{
    direct:[-.006,-.002,.002],
    lift:[.02,.06,.105,.15],
    ground:[.02,.105],
    compensation:[{lowPointX:.105,lowPointZ:-.004},{lowPointX:.13,lowPointZ:-.006}],
  },
  myths:[
    {id:'steeper',claim:'Deeper means steeper.',choices:['True','False. Height moves while Attack stays unchanged'],answerIndex:1,explanation:'At fixed x and plane, Contact Height moves 40 mm across the sweep while Attack remains −4.110°.'},
    {id:'crossing',claim:'No ground crossing means ascending.',choices:['True','False. A descending tangent can sit above ground'],answerIndex:1,explanation:'At z 0 mm the modeled path has no below-ground crossing and Attack is still descending.'},
    {id:'band',claim:'The quality band is measured truth.',choices:['True','False. It is a secondary app classification'],answerIndex:1,explanation:'Chosen point-path thresholds are not launch-monitor measurements or a physical contact model.'},
    {id:'face',claim:'Contact Height is face Impact Height.',choices:['True','False. It is path-point height at the ball position'],answerIndex:1,explanation:'The current geometry contains no face, sole or collision on which to locate real impact.'},
    {id:'same',claim:'Same modeled height means the same strike.',choices:['True','False. x and z can compensate while Attack differs'],answerIndex:1,explanation:'Similar modeled height can come from different Low Point distances, bottom heights and Attack Angles.'},
  ],
  masteryTasks:[
    {id:'direct',kind:'choice',prompt:'At fixed x and plane, z rises 7 mm. What happens?',choices:['Contact Height rises 7 mm; Attack is unchanged','Attack steepens 7°','Contact Height stays fixed'],answerIndex:0,evidence:'1:1 translation'},
    {id:'lift',kind:'choice',prompt:'Why can moving Low Point farther ahead raise the path point at the ball?',choices:["The rigid arc has risen farther from its bottom before reaching the ball",'Attack is an independent height force','Club Speed lifts the path'],answerIndex:0,evidence:'Lift budget'},
    {id:'compensation',kind:'choice',prompt:'Two states have nearly equal Contact Height. What may still differ?',choices:['Low Point Distance and Attack Angle','Nothing in the geometry','Only color'],answerIndex:0,evidence:'Compensation'},
    {id:'boundary',kind:'choice',prompt:'What does Flightglass Contact Height measure?',choices:['A point on the modeled path at the ball position','Real impact location on the clubface','Physical divot depth after turf deformation'],answerIndex:0,evidence:'Point-model boundary'},
    {id:'live',kind:'live-transfer',mandatory:true,prompt:'Capture 1.0–5.0 mm, then 22.0–26.0 mm, with Attack −4.110° in both.'},
  ],
  sheets:{
    height:{title:'Contact Height',tags:['MODEL GEOMETRY'],body:"Flightglass Contact Height is the vertical position of its modeled clubhead path point when it reaches the ball's target-line position."},
    bottom:{title:'Arc Height at Bottom',tags:['MODEL INPUT'],body:'lowPoint.z moves the entire arc up or down relative to the flat ground plane. Negative is below ground; positive is above.'},
    lift:{title:'Arc lift to the ball',tags:['MODEL GEOMETRY'],body:'Low Point Distance and plane determine how far the rigid circular path rises from its bottom before it reaches the ball.'},
    attack:{title:'Contact Height versus Attack',tags:['POSITION','DIRECTION'],body:'Contact Height is a position in millimeters. Attack is tangent direction in degrees. Vertical translation changes the first and leaves the second invariant here.'},
    ground:{title:'Ground crossing',tags:['MODEL FLAT-GROUND CROSSING'],body:'The model can order entry, ball and exit on a flat plane, but cannot simulate a sole cutting, bouncing or deforming turf.'},
    bands:{title:'Current quality bands',tags:['SECONDARY APP CLASSIFICATION'],body:'Pure, Thin, Fat, Duff and Whiff use chosen point-path thresholds. Academy does not use them as physical truth or mastery evidence.'},
    face:{title:'Not face Impact Height',tags:['≈ REAL WORLD, NOT THIS OUTPUT'],body:'A launch monitor may locate a ball strike on a real clubface. Flightglass Contact Height is not that measurement.'},
    limits:{title:'Model limits',tags:['HELD','NOT MODELED'],body:'Fixed radius and plane; point clubhead; rigid flat ground; fixed ball radius. No face, sole, shaft, collision, turf, friction, speed or spin response.'},
    sources:{title:'Sources',tags:['DEFINITION SOURCES'],body:'TrackMan definitions distinguish Low Point Height, Low Point Distance, Attack Angle and real Impact Height. Numeric fixtures here are current Flightglass model outputs.'},
  },
});

const base={packId:ACADEMY_VOICE_PACK_ID,locale:ACADEMY_VOICE_LOCALE,contentVersion:1,autoplay:true,interruptions:['route','foreground-loss','model-input'],asset:null};
export const CONTACT_HEIGHT_CUES=defineAcademyCueSet({ownerId:'strike-depth',cues:[
  {...base,cueId:'academy.contact-height.s0.entry',surfaceId:'contact-height-s0',job:'orient',trigger:'surface-entry',text:'Slide the whole curve up or down. Where it meets the ball travels with it, because a pure lift never tilts the curve.',beats:[{targetId:'contact-height-window',atMs:0,emphasis:'outline'}]},
  {...base,cueId:'academy.contact-height.s1.entry',surfaceId:'contact-height-s1',job:'cue',trigger:'surface-entry',text:'Lift everything and the meeting point rises the same amount — the rise to the ball is fixed by the shape.',beats:[{targetId:'contact-height-ledger',atMs:0,emphasis:'connector'}]},
  {...base,cueId:'academy.contact-height.s1.center',surfaceId:'contact-height-s1',job:'consequence',trigger:'proof-first',text:'You just crossed the middle of the ball — and the steepness never moved, because translating a curve cannot rotate it.',beats:[{targetId:'contact-height-point',atMs:0,emphasis:'static-label'}]},
  {...base,cueId:'academy.contact-height.s2.entry',surfaceId:'contact-height-s2',job:'cue',trigger:'surface-entry',text:'Lifting everything moves the strike directly; sliding the low spot forward changes how much rise happens on the way. Two levers, one steepness.',beats:[{targetId:'contact-height-roles',atMs:0,emphasis:'connector'}]},
  {...base,cueId:'academy.contact-height.s3.boundary',surfaceId:'contact-height-s3',job:'consequence',trigger:'proof-first',text:'This model separates coordinates cleanly. It does not simulate a clubface, turf deformation, or a real divot.',beats:[{targetId:'contact-height-boundaries',atMs:0,emphasis:'outline'}]},
  {...base,cueId:'academy.contact-height.s4.live',surfaceId:'contact-height-s4',job:'cue',trigger:'surface-entry',text:'Hold every other lever still and move only the vertical one — prove the steepness stays put while the meeting point travels.',beats:[{targetId:'contact-height-live',atMs:0,emphasis:'outline'}]},
  {...base,cueId:'academy.contact-height.s5.pass',surfaceId:'contact-height-s5',job:'consequence',trigger:'mastery-first',text:'You moved the strike without tipping the swing — the steepness belonged to the shape, never to the height.',beats:[{targetId:'contact-height-result',atMs:0,emphasis:'static-label'}]},
]});

export const contactHeightCue=id=>CONTACT_HEIGHT_CUES.cues.find(cue=>cue.cueId===id)||null;
