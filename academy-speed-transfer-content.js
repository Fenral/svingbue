import{ACADEMY_VOICE_LOCALE,ACADEMY_VOICE_PACK_ID,defineAcademyCueSet}from'./academy-voice-manifest.js';
const freeze=value=>{if(!value||typeof value!=='object'||Object.isFrozen(value))return value;Object.values(value).forEach(freeze);return Object.freeze(value);};

export const SPEED_TRANSFER_CONTENT=freeze({
  experienceId:'speed-transfer',contentVersion:1,title:'Speed Transfer',conceptIds:['club-speed','smash','ball-speed'],prerequisiteExperienceIds:[],primaryOutcome:'Ball Speed',
  requiredLabels:['CLUB SPEED · DEFINITION','SMASH · MODELED TRANSFER RATIO','BALL SPEED · DEFINITION','ONE 7-IRON PRESET · MODEL','MODEL LIMIT REACHED','IMPACT LOCATION · NOT MODELED','SMASH HAS NO PERCENT UNIT'],
  surfaces:[
    {id:'mission',eyebrow:'SPEED & DISTANCE · 1 OF 2',title:'Different transfers. One outcome.',body:'See how Club Speed and a modeled transfer ratio become Ball Speed—and what that ratio cannot diagnose.'},
    {id:'lab',eyebrow:'TRANSFER LAB · DEFINITION + MODEL',title:'Build the speed equation.',body:'Name the measured speeds, derive the ratio, then change one input at a time.'},
    {id:'influence',eyebrow:'EQUAL-OUTPUT PROOF · LIVE MODEL',title:'Multiplication, not shares.',body:'Make two different CLUB → RATIO paths meet one Ball Speed ruler.'},
    {id:'boundary',eyebrow:'COLLISION BOUNDARY · NOT MODELED',title:'Know what the ratio cannot see.',body:'Separate a modeled speed ratio from energy, centeredness and equipment diagnosis.'},
    {id:'mastery',eyebrow:'4 OF 5 + LIVE TRANSFER',title:'Prove the outcome does not reveal the delivery.',body:'Match ~117.95 mph twice with two genuinely different, unclamped transfers.'},
    {id:'result',eyebrow:'SPEED TRANSFER EVIDENCE',title:'Transfer understood.',body:'Measured speed, modeled ratio and Ball Speed are now separate in your evidence.'}
  ],
  lab:[
    {id:'club',prompt:'Which number is measured just before the club first touches the ball?',choices:['Club Speed','Smash','Ball Speed'],answerIndex:0,reveal:'CLUB SPEED · geometric-center speed just before first contact · DEFINITION'},
    {id:'ball',prompt:'Which number is the speed of the ball just after impact?',choices:['Spin Loft','Club Speed','Ball Speed'],answerIndex:2,reveal:'BALL SPEED · post-impact speed · DEFINITION'},
    {id:'ratio',prompt:'If Ball Speed is 119.52 mph and Club Speed is 90 mph, what is Smash?',choices:['0.752','1.328','29.52 mph'],answerIndex:1,reveal:'119.52 ÷ 90 = 1.328 · DEFINITION · NO PERCENT UNIT'},
    {id:'club-change',prompt:'At held modeled Smash, 90 → 100 mph Club Speed makes Ball Speed:',choices:['Higher','Lower','The same'],answerIndex:0,reveal:'Club Speed +10.00 mph · Smash +0.000 · Ball Speed +13.28 mph'},
    {id:'loft-change',prompt:'At 90 mph, moving Spin Loft 25° → 45° makes the modeled ratio:',choices:['Narrower','Wider','Unchanged'],answerIndex:0,reveal:'Spin Loft +20° · Smash 1.360 → 1.280 · Ball Speed 122.40 → 115.20 mph'}
  ],
  influenceStages:[
    {id:'multiply',label:'MULTIPLY',copy:'Club Speed and Smash do not own separate shares of Ball Speed. One is multiplied by the other.'},
    {id:'speed',label:'LOCAL SPEED',copy:'+1 mph Club Speed → +1.328 mph Ball Speed · FOR THIS STATE · MODEL'},
    {id:'ratio',label:'LOCAL RATIO',copy:'+1° Spin Loft → −0.004 Smash → −0.36 mph Ball Speed · FOR THIS STATE · MODEL'},
    {id:'equal',label:'EQUAL OUTPUT',copy:'82 × 1.438 = 117.94 mph · 91 × 1.296 = 117.96 mph'},
    {id:'ports',label:'BOUNDARY PORTS',copy:'Impact location, effective mass and face/ball collision are real-world factors this solve does not model.'}
  ],
  myths:[
    {claim:'Club Speed is energy.',choices:['True','False'],answerIndex:1,explanation:'False. It is a speed measurement. Energy also requires mass and a collision model.'},
    {claim:'Smash is percent energy transferred.',choices:['True','False'],answerIndex:1,explanation:'False. Smash is Ball Speed divided by Club Speed; it has no percent unit.'},
    {claim:'Low Smash proves an off-center hit.',choices:['True','Not in this model'],answerIndex:1,explanation:'Impact location is not an input to the current Flightglass transfer solve.'},
    {claim:'More Club Speed always creates more Ball Speed.',choices:['Always','Only if the ratio does not fall enough to offset it'],answerIndex:1,explanation:'A lower ratio can offset a faster club. Compare the equal-output pair.'},
    {claim:'1.52 is a universal physical maximum.',choices:['True','False · current preset bound'],answerIndex:1,explanation:'It is the upper model clamp for the one shipped 7-iron preset.'}
  ],
  masteryTasks:[
    {kind:'choice',prompt:'Smash Factor is:',choices:['The percentage of energy transferred','Ball Speed divided by Club Speed','Impact distance from face center','Club Speed divided by Ball Speed'],answerIndex:1,evidence:'Ratio definition'},
    {kind:'choice',prompt:'Club Speed is 90 mph and Smash is 1.328. Ball Speed is:',choices:['67.77 mph','91.33 mph','119.52 mph','132.80 mph'],answerIndex:2,evidence:'Product arithmetic'},
    {kind:'choice',prompt:'What changes current Flightglass Smash before a clamp?',choices:['Impact location','Simplified Spin Loft','Face Angle','Wind'],answerIndex:1,evidence:'Model path'},
    {kind:'choice',prompt:'A Flightglass state shows Smash 1.28. What can you conclude?',choices:['The strike was on the toe','Most energy was lost','The model returned a 1.28 speed ratio','The golfer needs a different shaft'],answerIndex:2,evidence:'Inference boundary'},
    {kind:'live-transfer',mandatory:true,prompt:'Save two unclamped states at 117.85–118.05 mph, at least 5 mph, 15° Spin Loft and 0.06 Smash apart; compare them and state the inference limit.'}
  ],
  sheets:{
    clubSpeed:{title:'Club Speed',tags:['DEFINITION','MEASURED INPUT'],body:'Linear speed of the clubhead geometric center immediately before first contact. It is a scalar speed—not energy, effort or technique.'},
    smash:{title:'Smash Factor',tags:['DEFINITION','MODEL OUTPUT'],body:'Ball Speed divided by Club Speed. Current Flightglass changes it through simplified Spin Loft and clamps it for one 7-iron preset. It is not centeredness.'},
    ballSpeed:{title:'Ball Speed',tags:['DEFINITION','PRIMARY OUTCOME'],body:'Speed immediately after impact. The displayed identity is Club Speed × Smash. It does not reveal which delivery created it.'},
    influence:{title:'What changes the outcome',tags:['MULTIPLICATIVE','FOR THIS STATE'],body:'Club Speed is the scale; modeled Smash is the multiplier; simplified Spin Loft modifies Smash. Dynamic Loft and Attack are components of that gap, not extra shares.'},
    equal:{title:'Equal output',tags:['LIVE PROOF','INFERENCE LIMIT'],body:'82 mph at 22° and 91 mph at 41° both return ~117.95 mph. Ball Speed alone cannot identify the delivery.'},
    limits:{title:'Model limits',tags:['ONE 7-IRON PRESET','NOT MODELED'],body:'Impact location, effective mass, face flexibility, shaft dynamics, friction, ball construction and measured collision efficiency are outside this solve.'},
    sources:{title:'Sources',tags:['DEFINITION SOURCES'],body:'TrackMan Club Speed, Smash Factor, Ball Speed and Smash Index definitions. Exact response and clamps are Flightglass model claims.'}
  }
});

const base={packId:ACADEMY_VOICE_PACK_ID,locale:ACADEMY_VOICE_LOCALE,contentVersion:1,autoplay:true,interruptions:['route','foreground-loss','model-input'],asset:null};
export const SPEED_TRANSFER_CUES=defineAcademyCueSet({ownerId:'speed-transfer',cues:[
  {...base,cueId:'academy.speed-transfer.s0.entry',surfaceId:'speed-transfer-s0',job:'orient',trigger:'surface-entry',text:'Club speed supplies the scale. The transfer ratio decides how much ball speed this model returns.',beats:[{targetId:'speed-transfer-ledger',atMs:0,emphasis:'outline'}]},
  {...base,cueId:'academy.speed-transfer.s1.ratio',surfaceId:'speed-transfer-s1',job:'cue',trigger:'proof-first',text:'Smash is a speed ratio between Ball Speed and Club Speed, not an energy percentage.',beats:[{targetId:'speed-transfer-equation',atMs:0,emphasis:'connector'}]},
  {...base,cueId:'academy.speed-transfer.s1.speed',surfaceId:'speed-transfer-s1-speed',job:'consequence',trigger:'proof-first',text:'The ratio held. Ten more club miles per hour returned thirteen point two eight more ball speed.',beats:[{targetId:'speed-transfer-ball',atMs:0,emphasis:'trace'}]},
  {...base,cueId:'academy.speed-transfer.s1.loft',surfaceId:'speed-transfer-s1-loft',job:'consequence',trigger:'proof-first',text:'Club speed held. The model narrowed the transfer ratio as the delivery gap grew.',beats:[{targetId:'speed-transfer-ratio',atMs:0,emphasis:'outline'}]},
  {...base,cueId:'academy.speed-transfer.s2.equal',surfaceId:'speed-transfer-s2',job:'consequence',trigger:'proof-first',text:'Different speed and ratio. Same ball speed. The outcome alone cannot tell you which delivery created it.',beats:[{targetId:'speed-transfer-compare',atMs:0,emphasis:'connector'}]},
  {...base,cueId:'academy.speed-transfer.s3.boundary',surfaceId:'speed-transfer-s3',job:'cue',trigger:'surface-entry',text:'Impact location is real, but this transfer model cannot see or measure it.',beats:[{targetId:'speed-transfer-ports',atMs:0,emphasis:'outline'}]},
  {...base,cueId:'academy.speed-transfer.s5.pass',surfaceId:'speed-transfer-s5',job:'consequence',trigger:'mastery-first',text:'Transfer confirmed. Next, test what this ball speed does and does not do to carry.',beats:[{targetId:'speed-transfer-result',atMs:0,emphasis:'static-label'}]}
]});
export const speedTransferCue=id=>SPEED_TRANSFER_CUES.cues.find(cue=>cue.cueId===id)||null;
