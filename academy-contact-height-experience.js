import { CONTACT_HEIGHT_CONTENT } from './academy-contact-height-content.js';
import { evaluateContactHeightTransfer, solveContactHeightState } from './academy-contact-height-model.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const clean=value=>Math.abs(value)<1e-12?0:value;
const signed=(value,unit,dp=1)=>`${value>0?'+':value<0?'−':''}${Math.abs(clean(value)).toFixed(dp)}${unit}`;
const attemptId=()=>`contact-height-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
const CUES=['academy.contact-height.s0.entry','academy.contact-height.s1.entry','academy.contact-height.s2.entry',null,'academy.contact-height.s4.live',null];

function restore(source={}){
  const evidence=source.evidence?.contactHeight||{};
  const lab=evidence.lab||{};
  const proof=evidence.proof||{};
  return{
    surface:Number.isInteger(source.surface)?source.surface:0,
    unlocked:new Set([0,...(source.unlockedSurfaces||[])]),
    lab:{
      lowPointZ:Number.isFinite(lab.lowPointZ)?lab.lowPointZ:-.002,
      prediction:Number.isInteger(lab.prediction)?lab.prediction:null,
      predictionCorrect:Boolean(lab.predictionCorrect),
      deltaConfirmed:Boolean(lab.deltaConfirmed),
      aboveCenter:Boolean(lab.aboveCenter),
      lowReturned:Boolean(lab.lowReturned),
    },
    proof:{
      stage:['direct','lift','ground','compensation','plane'].includes(proof.stage)?proof.stage:'direct',
      value:Number.isFinite(proof.value)?proof.value:-.002,
      directSeen:new Set(proof.directSeen||[]),
      liftSeen:new Set(proof.liftSeen||[]),
      groundSeen:new Set(proof.groundSeen||[]),
      compensationSeen:new Set(proof.compensationSeen||[]),
      planeSeen:Boolean(proof.planeSeen),
    },
    myths:Array.from({length:5},(_,index)=>Boolean(evidence.myths?.[index])),
    mythAnswers:Array.from({length:5},(_,index)=>Number.isInteger(evidence.mythAnswers?.[index])?evidence.mythAnswers[index]:null),
    masteryAnswers:Array.from({length:4},(_,index)=>Number.isInteger(evidence.masteryAnswers?.[index])?evidence.masteryAnswers[index]:null),
    masteryIndex:Number.isInteger(evidence.masteryIndex)?Math.min(4,Math.max(0,evidence.masteryIndex)):0,
    transfer:evidence.transfer&&typeof evidence.transfer==='object'?structuredClone(evidence.transfer):null,
    attemptId:source.activeAttempt?.attemptId||evidence.attemptId||null,
    attemptNumber:Number.isInteger(evidence.attemptNumber)?evidence.attemptNumber:0,
    knowledgeBestCorrect:Number.isInteger(source.evidence?.knowledgeBestCorrect)?source.evidence.knowledgeBestCorrect:0,
    lastResult:evidence.lastResult||null,
  };
}

export function mountContactHeightExperience(options={}){
  const{
    root,state:stored={},conceptId=null,prerequisiteMet=false,saveProgress=()=>{},submitMastery=()=>null,
    nextAction=()=>({label:'Back to Academy',route:'#/academy'}),navigate=()=>{},voiceTargets,
    onVoiceSurface=()=>{},onVoiceInterrupt=()=>{},onVoiceMilestone=()=>{},
  }=options;
  if(!(root instanceof HTMLElement))throw new TypeError('Contact Height root is required');
  const progress=restore(stored);
  let mythIndex=progress.myths.findIndex(value=>!value);if(mythIndex<0)mythIndex=4;
  let destroyed=false,sheetTrigger=null;
  const cleanups=[];
  const listen=(target,event,handler,opts)=>{target?.addEventListener(event,handler,opts);cleanups.push(()=>target?.removeEventListener(event,handler,opts));};

  const persist=(extra={})=>saveProgress({
    surface:progress.surface,
    unlockedSurfaces:[...progress.unlocked].sort((a,b)=>a-b),
    ...extra,
    evidence:{
      ...(stored.evidence||{}),
      contactHeight:{
        lab:{...progress.lab},
        proof:{...progress.proof,directSeen:[...progress.proof.directSeen],liftSeen:[...progress.proof.liftSeen],groundSeen:[...progress.proof.groundSeen],compensationSeen:[...progress.proof.compensationSeen]},
        myths:[...progress.myths],mythAnswers:[...progress.mythAnswers],masteryAnswers:[...progress.masteryAnswers],
        masteryIndex:progress.masteryIndex,transfer:progress.transfer?structuredClone(progress.transfer):null,
        attemptId:progress.attemptId,attemptNumber:progress.attemptNumber,lastResult:progress.lastResult,
      },
      surfacesSeen:[...new Set([...(stored.evidence?.surfacesSeen||[]),progress.surface])],
      instrumentTouched:progress.lab.predictionCorrect||progress.lab.deltaConfirmed||Boolean(stored.evidence?.instrumentTouched),
      ...extra.evidence,
    },
  });

  function makeAttempt({advance=false}={}){
    if(advance)progress.attemptNumber+=1;
    progress.attemptId=attemptId();progress.masteryIndex=0;progress.masteryAnswers=[null,null,null,null];
    progress.transfer={phase:'low',input:{lowPointZ:0},interacted:false,lowAcknowledgesBottomBelow:false,highLabel:null,low:null,high:null,evaluation:null,captures:[]};
    persist({activeAttempt:{attemptId:progress.attemptId,contentVersion:1}});
  }
  function ensureAttempt(){if(progress.attemptId&&progress.transfer)return;makeAttempt();}
  const currentSurface=()=>CONTACT_HEIGHT_CONTENT.surfaces[progress.surface];
  const intro=()=>`<p class="low-point__eyebrow">${currentSurface().eyebrow}</p><h1 id="contactHeightTitle">${currentSurface().title}</h1><p class="low-point__lede">${currentSurface().body}</p>`;

  function instrument(state,{compact=false}={}){
    const ballX=94,groundY=112,scale=1.35,centerY=groundY-21.3*scale;
    const contactY=Math.max(30,Math.min(154,groundY-state.contactHeightMm*scale));
    const bottomY=Math.max(34,Math.min(154,groundY-state.bottomHeightMm*scale));
    const lowX=Math.max(132,Math.min(216,ballX+state.effectiveCm*5.2));
    const radians=state.attackAngle*Math.PI/180,length=42,dx=Math.cos(radians)*length,dy=Math.sin(radians)*length;
    const entryX=state.groundEntryCm===null?null:Math.max(14,Math.min(226,ballX+state.groundEntryCm*4));
    const ground=state.groundRelation==='above-ground'?'ABOVE GROUND':state.groundRelation==='below-ground'?'BELOW GROUND':'AT GROUND';
    const center=state.ballCenterRelation==='above-center'?'ABOVE BALL CENTER':state.ballCenterRelation==='below-center'?'BELOW BALL CENTER':'AT BALL CENTER';
    return `<div class="low-point__instrument contact-height__window" data-voice-target="contact-height-window">
      <svg viewBox="0 0 240 180" role="img" aria-label="Modeled Contact Height ${signed(state.contactHeightMm,' millimeters')}, ${ground.toLowerCase()}; Attack ${signed(state.attackAngle,' degrees')}, unchanged">
        <line class="ch-ground" x1="12" y1="${groundY}" x2="228" y2="${groundY}"/><text x="14" y="108">FLAT GROUND · MODEL</text>
        <circle class="ch-ball" cx="${ballX}" cy="${centerY.toFixed(1)}" r="${(21.3*scale).toFixed(1)}"/><line class="ch-center" x1="${ballX-31}" y1="${centerY.toFixed(1)}" x2="${ballX+31}" y2="${centerY.toFixed(1)}"/><text x="${ballX-30}" y="${(centerY-3).toFixed(1)}">BALL CENTER 21.3 MM</text>
        <path class="ch-arc" d="M18 ${(contactY-12).toFixed(1)} Q ${lowX.toFixed(1)} ${(bottomY+30).toFixed(1)} 226 ${(contactY-18).toFixed(1)}"/>
        <line class="ch-tangent" x1="${(ballX-dx).toFixed(1)}" y1="${(contactY+dy).toFixed(1)}" x2="${(ballX+dx).toFixed(1)}" y2="${(contactY-dy).toFixed(1)}"/>
        <circle class="ch-contact" data-voice-target="contact-height-point" cx="${ballX}" cy="${contactY.toFixed(1)}" r="5"/>
        <line class="ch-height" x1="${ballX-10}" y1="${groundY}" x2="${ballX-10}" y2="${contactY.toFixed(1)}"/><text x="${ballX-14}" y="${((groundY+contactY)/2).toFixed(1)}" text-anchor="end">CONTACT</text>
        <line class="ch-z" x1="${lowX.toFixed(1)}" y1="${groundY}" x2="${lowX.toFixed(1)}" y2="${bottomY.toFixed(1)}"/><circle class="ch-bottom" cx="${lowX.toFixed(1)}" cy="${bottomY.toFixed(1)}" r="4"/><text x="${lowX.toFixed(1)}" y="169" text-anchor="middle">ARC BOTTOM</text>
        ${entryX===null?'':`<g class="ch-entry"><line x1="${entryX.toFixed(1)}" y1="104" x2="${entryX.toFixed(1)}" y2="120"/><text x="${entryX.toFixed(1)}" y="128" text-anchor="middle">ENTRY</text></g>`}
      </svg>
      <div class="contact-height__attack"><small>ATTACK · MODEL INVARIANT</small><strong>${signed(state.attackAngle,'°',3)} · UNCHANGED</strong></div>
      ${compact?'':`<div class="low-point__readouts"><span><small>MODELED CONTACT HEIGHT</small><strong>${signed(state.contactHeightMm,' MM')} · ${ground}</strong></span><span><small>BALL-CENTER REFERENCE</small><strong>${signed(state.ballCenterOffsetMm,' MM')} · ${center}</strong></span></div>
      <div class="contact-height__ledger" data-voice-target="contact-height-ledger"><span>ARC HEIGHT AT BOTTOM <strong>${signed(state.bottomHeightMm,' MM')}</strong></span><span>ARC LIFT TO BALL <strong>${signed(state.arcLiftMm,' MM')}</strong></span><span>MODELED CONTACT HEIGHT <strong>${signed(state.contactHeightMm,' MM')}</strong></span></div>
      <div class="contact-height__ground">${entryX===null?'GROUND SEQUENCE · NONE IN MODELED WINDOW':`GROUND ENTRY ${signed(state.groundEntryCm,' CM')} · ${state.groundEntryOrder==='before-ball'?'BEFORE BALL':'AFTER BALL'}`}</div>`}
    </div>`;
  }

  function choice(item,key,selected=null){
    return `<div class="low-point__task"><h2>${item.prompt}</h2><div role="radiogroup">${item.choices.map((label,index)=>`<button role="radio" data-${key}="${index}" aria-checked="${selected===index}" ${selected!==null?'disabled':''}>${label}</button>`).join('')}</div></div>`;
  }

  function missionHtml(){
    const state=solveContactHeightState({lowPointZ:-.002});
    return `<section class="low-point__surface" aria-labelledby="contactHeightTitle">${intro()}${instrument(state)}<div class="low-point__mission"><small>ONE ATTACK · TWO HEIGHTS</small><strong>A · 1–5 MM ABOVE GROUND</strong><strong>B · 22–26 MM ABOVE GROUND</strong></div><p class="low-point__truth">MODEL GEOMETRY · POINT PATH, NOT FACE IMPACT</p>${!prerequisiteMet?'<p class="low-point__prereq">PREVIEW · Master Low Point before the live gate unlocks.</p>':''}<button class="low-point__primary" data-primary>Enter Contact Height Lab</button><button class="low-point__secondary" data-review-low-point>Review Low Point</button></section>`;
  }

  function labHtml(){
    const lab=progress.lab,state=solveContactHeightState({lowPointZ:lab.lowPointZ});
    const complete=lab.predictionCorrect&&lab.deltaConfirmed&&lab.aboveCenter&&lab.lowReturned;
    const prompt=!lab.predictionCorrect?choice(CONTACT_HEIGHT_CONTENT.lab.prediction,'lab-prediction',lab.prediction):'';
    const feedback=!lab.predictionCorrect?'Resolve the signed height ledger.'
      :!lab.deltaConfirmed?'Raise the bottom from −2 mm to +3 mm.'
      :!lab.aboveCenter?'Raise the path point above the 21.3 mm modeled ball center.'
      :!lab.lowReturned?'Return Contact Height to 1–5 mm above ground.'
      :'One-to-one translation verified. Attack never rotated.';
    return `<section class="low-point__surface" aria-labelledby="contactHeightTitle">${intro()}${instrument(state)}<label class="low-point__range"><span>Arc Height at Bottom</span><output>${signed(state.bottomHeightMm,' MM')}</output><input data-contact-lab type="range" min="-.01" max=".03" step=".001" value="${lab.lowPointZ}" aria-label="Arc Height at Bottom" aria-valuetext="${signed(state.bottomHeightMm,' millimeters')}"></label><div class="low-point__stages"><span data-done="${lab.predictionCorrect}">A · LEDGER</span><span data-done="${lab.deltaConfirmed}">B · +5 MM</span><span data-done="${lab.aboveCenter}">C · CENTER</span><span data-done="${lab.lowReturned}">D · RETURN</span></div>${prompt||`<p class="low-point__feedback">${feedback}</p>`}${complete?'<p class="low-point__truth">1 MM BOTTOM MOVEMENT → 1 MM CONTACT HEIGHT · ATTACK UNCHANGED</p>':''}</section>`;
  }

  function proofState(){
    const proof=progress.proof;
    if(proof.stage==='direct')return solveContactHeightState({lowPointZ:proof.value});
    if(proof.stage==='lift'||proof.stage==='ground')return solveContactHeightState({lowPointX:proof.value,lowPointZ:-.002});
    if(proof.stage==='compensation'){
      const pair=CONTACT_HEIGHT_CONTENT.proof.compensation[Math.max(0,Math.min(1,proof.value))];
      return solveContactHeightState(pair);
    }
    return solveContactHeightState({lowPointZ:-.002});
  }
  function proofValues(){
    const proof=progress.proof;
    if(proof.stage==='direct')return CONTACT_HEIGHT_CONTENT.proof.direct;
    if(proof.stage==='lift')return CONTACT_HEIGHT_CONTENT.proof.lift;
    if(proof.stage==='ground')return CONTACT_HEIGHT_CONTENT.proof.ground;
    if(proof.stage==='compensation')return [0,1];
    return [];
  }
  function proofHtml(){
    const proof=progress.proof,state=proofState(),values=proofValues();
    const explanation=proof.stage==='direct'?'DIRECT · 1 MM → 1 MM · Attack invariant'
      :proof.stage==='lift'?'x changes how far the rigid arc rises before the ball.'
      :proof.stage==='ground'?`MODEL FLAT-GROUND CROSSING · ${state.groundEntryOrder.replaceAll('-',' ').toUpperCase()}`
      :proof.stage==='compensation'?'Nearly the same height; different x, z and Attack.'
      :'Plane changes both tangent and arc lift. It is held in the core live gate.';
    return `<section class="low-point__surface" data-voice-target="contact-height-roles" aria-labelledby="contactHeightTitle">${intro()}<div class="contact-height__proof-tabs" role="tablist">${[['direct','Z · DIRECT'],['lift','X · LIFT'],['ground','GROUND ORDER'],['compensation','COMPENSATION'],['plane','PLANE NOTE']].map(([id,label])=>`<button role="tab" aria-selected="${proof.stage===id}" data-proof-stage="${id}">${label}</button>`).join('')}</div><div class="low-point__mode">${explanation}</div>${instrument(state,{compact:true})}${values.length?`<div class="low-point__proof-values" role="radiogroup">${values.map(value=>`<button role="radio" aria-checked="${proof.value===value}" data-proof-value="${value}">${proof.stage==='direct'?signed(value*1000,' MM'):proof.stage==='compensation'?`STATE ${value===0?'A':'B'}`:signed(value*100,' CM')}</button>`).join('')}</div>`:'<button class="low-point__secondary" data-plane-note>Confirm held-plane note</button>'}<div class="low-point__proof-read"><strong>CONTACT ${signed(state.contactHeightMm,' MM')} · ATTACK ${signed(state.attackAngle,'°')}</strong><span>${explanation}</span></div><div class="low-point__sheet-links"><button data-sheet="lift">Read lift budget</button><button data-sheet="ground">Ground-model boundary</button></div></section>`;
  }

  function boundaryHtml(){
    const myth=CONTACT_HEIGHT_CONTENT.myths[mythIndex],answered=progress.myths[mythIndex],selected=progress.mythAnswers[mythIndex];
    return `<section class="low-point__surface" aria-labelledby="contactHeightTitle">${intro()}<div class="low-point__task"><small>EXPERIMENT ${mythIndex+1} OF 5</small><blockquote>“${myth.claim}”</blockquote><div role="radiogroup">${myth.choices.map((label,index)=>`<button role="radio" data-myth-answer="${index}" aria-checked="${selected===index}" ${answered?'disabled':''}>${label}</button>`).join('')}</div>${answered?`<div class="low-point__reveal"><strong>${selected===myth.answerIndex?'Boundary held':'Review the boundary'}</strong><p>${myth.explanation}</p>${mythIndex===4?`<div class="low-point__chips" data-voice-target="contact-height-boundaries"><span>POINT PATH · NOT FACE IMPACT</span><span>FLAT GROUND · NOT TURF</span><span>QUALITY BANDS · SECONDARY ONLY</span></div>${!prerequisiteMet?'<p class="low-point__prereq">Master Low Point to unlock live mastery.</p>':''}`:''}</div>`:''}</div></section>`;
  }

  function masteryHtml(){
    const task=CONTACT_HEIGHT_CONTENT.masteryTasks[progress.masteryIndex];
    if(progress.masteryIndex<4){
      const selected=progress.masteryAnswers[progress.masteryIndex];
      return `<section class="low-point__surface" aria-labelledby="contactHeightTitle">${intro()}<p class="low-point__count">Task ${progress.masteryIndex+1} of 5 · Knowledge</p>${choice(task,'mastery-answer',selected)}${selected!==null?`<p class="low-point__feedback">${selected===task.answerIndex?'Confirmed.':'Repair this evidence after the attempt.'}</p>`:''}</section>`;
    }
    const transfer=progress.transfer,state=solveContactHeightState(transfer.input),low=transfer.phase==='low';
    const rangePassed=low?state.contactHeight>=.001&&state.contactHeight<=.005:state.contactHeight>=.022&&state.contactHeight<=.026;
    const labelPassed=low?transfer.lowAcknowledgesBottomBelow:transfer.highLabel==='above-center';
    const ready=rangePassed&&labelPassed&&transfer.interacted;
    const feedback=!transfer.interacted?'Move only Arc Height at Bottom.'
      :!rangePassed?(low?'Place raw Contact Height inside 1.0–5.0 mm.':'Place raw Contact Height inside 22.0–26.0 mm.')
      :!labelPassed?(low?'Acknowledge that the modeled bottom may remain below ground.':'Identify the path point as above modeled ball center.')
      :'Raw height and invariant Attack gates are ready.';
    return `<section class="low-point__surface" data-voice-target="contact-height-live" aria-labelledby="contactHeightTitle">${intro()}<div class="low-point__mode">MODEL GEOMETRY · ARC HEIGHT ONLY</div><p class="low-point__count">${low?'A · CONTACT 1.0–5.0 MM':'B · CONTACT 22.0–26.0 MM'} · ATTACK −4.110°</p>${instrument(state)}<label class="low-point__range"><span>Arc Height at Bottom</span><output>${signed(state.bottomHeightMm,' MM')}</output><input data-live-contact type="range" min="-.01" max=".03" step=".001" value="${transfer.input.lowPointZ}" aria-label="Live Arc Height at Bottom" aria-valuetext="${signed(state.bottomHeightMm,' millimeters')}"></label>${low?`<div class="low-point__label-choice" role="radiogroup"><button role="radio" data-live-low-ack aria-checked="${transfer.lowAcknowledgesBottomBelow}">The modeled bottom may still be below ground</button></div>`:`<div class="low-point__label-choice" role="radiogroup"><button role="radio" data-live-high-label="above-center" aria-checked="${transfer.highLabel==='above-center'}">Path point is above modeled ball center</button><button role="radio" data-live-high-label="below-center" aria-checked="${transfer.highLabel==='below-center'}">Path point is below modeled ball center</button></div>`}<p data-live-feedback>${feedback}</p>${transfer.captures.length?`<div class="low-point__captures">${transfer.captures.map(capture=>`<span>${capture.label}<strong>${signed(capture.contactHeightMm,' MM')} · ${signed(capture.attackAngle,'°',3)}</strong></span>`).join('')}</div>`:''}<button class="low-point__primary" data-capture ${ready?'':'disabled'}>${low?'Capture low path':'Capture above-center path and submit'}</button><button class="low-point__secondary" data-finish>Finish without live invariance</button></section>`;
  }

  function resultHtml(){
    const result=progress.lastResult||{},mastered=result.status==='mastered'||stored.status==='mastered',next=nextAction();
    const rows=[['1:1 translation',result.direct],['Lift budget',result.lift],['Compensation',result.compensation],['Point-model boundary',result.boundary],['Live invariance',result.liveTransferPassed]];
    return `<section class="low-point__surface" data-voice-target="contact-height-result" aria-labelledby="contactHeightTitle"><p class="low-point__eyebrow">CONTACT HEIGHT · ${mastered?'MASTERED':'NOT YET'}</p><h1 id="contactHeightTitle" data-result-status>${mastered?'You separated contact height from Attack.':'One height relationship needs repair.'}</h1><p class="low-point__lede">${mastered?'Two raw heights at one unchanged Attack are verified.':'The evidence names the exact relationship to rebuild.'}</p><div class="low-point__result"><strong>${result.knowledgeCorrect??0}/5</strong><span>KNOWLEDGE + LIVE</span>${result.xpAwarded?`<small>+${result.xpAwarded} XP</small>`:''}</div><div class="low-point__evidence">${rows.map(([label,passed])=>`<div><span>${label}</span><strong data-state="${passed?'verified':'repair'}">${passed?'verified':'repair'}</strong></div>`).join('')}</div>${!mastered?'<button class="low-point__secondary" data-retry>Retry mastery</button>':''}<button class="low-point__secondary" data-plane-lab>Explore Plane Coupling</button><button class="low-point__primary" data-result-next="${esc(next.route)}">${esc(next.label)}</button></section>`;
  }

  const page=()=>[missionHtml,labHtml,proofHtml,boundaryHtml,masteryHtml,resultHtml][progress.surface]();
  function sheetHtml(){return `<div class="low-point__scrim" data-sheet-scrim hidden></div><aside class="low-point__sheet" role="dialog" aria-modal="true" aria-labelledby="contactHeightSheetTitle" hidden><p data-sheet-tags></p><h2 id="contactHeightSheetTitle" data-sheet-title></h2><p data-sheet-body></p><button data-sheet-close>Close</button></aside>`;}
  function proofComplete(){const proof=progress.proof;return proof.directSeen.size===3&&proof.liftSeen.size===4&&proof.groundSeen.size===2&&proof.compensationSeen.size===2&&proof.planeSeen;}
  function nextBlocked(){
    if(progress.surface===1){const lab=progress.lab;return!(lab.predictionCorrect&&lab.deltaConfirmed&&lab.aboveCenter&&lab.lowReturned);}
    if(progress.surface===2)return!proofComplete();
    if(progress.surface===3)return!progress.myths[mythIndex]||(mythIndex===4&&!prerequisiteMet);
    if(progress.surface===4)return progress.masteryIndex>=4||progress.masteryAnswers[progress.masteryIndex]===null;
    return false;
  }
  function shell(body){
    const nextLabel=progress.surface===5?'Done':progress.surface===4&&progress.masteryIndex===4?'Live gate':'Next';
    return `<main id="contactHeightExperience" class="low-point contact-height" data-surface="${progress.surface}" data-experience="strike-depth"><header class="low-point__header"><button data-action="back" aria-label="Back to Academy">←</button><div><small>ACADEMY · STRIKE</small><strong>Contact Height</strong></div><span>POINT PATH · MODEL</span></header><div class="low-point__voice" data-academy-voice-slot></div><div class="low-point__body">${body}</div>${progress.surface>0?`<nav class="low-point__nav"><button data-action="previous">Back</button><div>${[0,1,2,3,4,5].map(index=>`<button data-surface-target="${index}" aria-label="Step ${index+1} of 6" aria-current="${index===progress.surface?'step':'false'}" ${!progress.unlocked.has(index)?'disabled':''}></button>`).join('')}</div><button data-action="next" ${nextBlocked()?'disabled':''}>${nextLabel}${nextLabel==='Next'?' →':''}</button></nav>`:''}${sheetHtml()}</main>`;
  }

  function openSheet(key,trigger=null){
    const content=CONTACT_HEIGHT_CONTENT.sheets[key];if(!content)return;
    const lesson=root.querySelector('#contactHeightExperience'),sheet=lesson.querySelector('.low-point__sheet');sheetTrigger=trigger||document.activeElement;
    sheet.querySelector('[data-sheet-tags]').textContent=content.tags.join(' · ');sheet.querySelector('[data-sheet-title]').textContent=content.title;sheet.querySelector('[data-sheet-body]').textContent=content.body;
    lesson.querySelector('[data-sheet-scrim]').hidden=false;sheet.hidden=false;sheet.querySelector('[data-sheet-close]').focus();
  }
  function closeSheet(){
    const lesson=root.querySelector('#contactHeightExperience'),sheet=lesson?.querySelector('.low-point__sheet');if(sheet)sheet.hidden=true;
    const scrim=lesson?.querySelector('[data-sheet-scrim]');if(scrim)scrim.hidden=true;sheetTrigger?.focus?.();sheetTrigger=null;
  }
  function registerVoice(){
    const map={
      'contact-height-window':'[data-voice-target="contact-height-window"]','contact-height-ledger':'[data-voice-target="contact-height-ledger"]',
      'contact-height-point':'[data-voice-target="contact-height-point"]','contact-height-roles':'[data-voice-target="contact-height-roles"]',
      'contact-height-boundaries':'[data-voice-target="contact-height-boundaries"]','contact-height-live':'[data-voice-target="contact-height-live"]',
      'contact-height-result':'[data-voice-target="contact-height-result"]',
    };
    for(const[id,selector]of Object.entries(map)){
      if(!voiceTargets?.register||!root.querySelector(selector))continue;
      try{cleanups.push(voiceTargets.register(id,{setEmphasis:({kind})=>{const element=root.querySelector(selector);if(element)element.dataset.voiceEmphasis=kind;},clear:()=>{const element=root.querySelector(selector);if(element)delete element.dataset.voiceEmphasis;}}));}catch{}
    }
  }
  function render({announce=true}={}){
    if(destroyed)return;if(progress.surface===4)ensureAttempt();
    const voiceSlot=root.querySelector('[data-academy-voice-slot]');root.innerHTML=shell(page());
    const nextVoiceSlot=root.querySelector('[data-academy-voice-slot]');if(voiceSlot?.hasChildNodes()&&nextVoiceSlot)nextVoiceSlot.replaceWith(voiceSlot);
    wire();registerVoice();if(announce)onVoiceSurface(progress.surface,CUES[progress.surface]);
  }
  function setSurface(index){if(!progress.unlocked.has(index))return;progress.surface=index;if(index===4)ensureAttempt();persist();render();}
  const score=live=>CONTACT_HEIGHT_CONTENT.masteryTasks.slice(0,4).reduce((sum,task,index)=>sum+(progress.masteryAnswers[index]===task.answerIndex?1:0),0)+(live&&progress.transfer?.evaluation?.passed?1:0);
  function submit(){
    const transfer=progress.transfer;if(!transfer.evaluation)transfer.evaluation={passed:false,reason:'incomplete-transfer'};
    const live=Boolean(transfer.evaluation.passed),correct=score(true),evidence={attemptId:progress.attemptId,...structuredClone(transfer.evaluation)};
    progress.knowledgeBestCorrect=Math.max(progress.knowledgeBestCorrect,correct);
    persist({activeAttempt:{attemptId:progress.attemptId,contentVersion:1},evidence:{knowledgeBestCorrect:progress.knowledgeBestCorrect,knowledgeTotal:5,liveTransferPassed:live,liveTransferEvidence:evidence}});
    const result=submitMastery({experienceId:'strike-depth',attemptId:progress.attemptId,contentVersion:1,knowledgeCorrect:correct,knowledgeTotal:5,liveTransferPassed:live,liveTransferEvidence:evidence})||{accepted:false,xpAwarded:0,experience:{status:'practiced'}};
    progress.lastResult={status:result.experience?.status||'practiced',knowledgeCorrect:correct,liveTransferPassed:live,xpAwarded:result.xpAwarded||0,direct:progress.masteryAnswers[0]===0,lift:progress.masteryAnswers[1]===0,compensation:progress.masteryAnswers[2]===0,boundary:progress.masteryAnswers[3]===0};
    progress.surface=5;progress.unlocked.add(5);progress.attemptId=null;
    persist({activeAttempt:null,status:result.experience?.status||'practiced',evidence:{knowledgeBestCorrect:progress.knowledgeBestCorrect,knowledgeTotal:5,liveTransferPassed:live,liveTransferEvidence:evidence}});
    if(result.accepted)onVoiceMilestone('academy.contact-height.s5.pass');render();
  }

  function wire(){
    const lesson=root.querySelector('#contactHeightExperience');
    listen(lesson,'click',event=>{
      const target=event.target.closest('button');if(!target||target.disabled)return;
      if(target.dataset.sheet){openSheet(target.dataset.sheet,target);return;}
      if(target.dataset.sheetClose!==undefined){closeSheet();return;}
      if(target.dataset.primary!==undefined){progress.unlocked.add(1);setSurface(1);return;}
      if(target.dataset.reviewLowPoint!==undefined){navigate('#/experience/low-point');return;}
      if(target.dataset.labPrediction!==undefined){progress.lab.prediction=Number(target.dataset.labPrediction);progress.lab.predictionCorrect=progress.lab.prediction===0;persist();render({announce:false});return;}
      if(target.dataset.proofStage){progress.proof.stage=target.dataset.proofStage;if(progress.proof.stage==='direct')progress.proof.value=-.002;else if(progress.proof.stage==='lift'||progress.proof.stage==='ground')progress.proof.value=.105;else progress.proof.value=0;persist();render({announce:false});return;}
      if(target.dataset.proofValue!==undefined){
        const value=Number(target.dataset.proofValue),proof=progress.proof;proof.value=value;
        if(proof.stage==='direct')proof.directSeen.add(value);else if(proof.stage==='lift')proof.liftSeen.add(value);else if(proof.stage==='ground')proof.groundSeen.add(value);else if(proof.stage==='compensation')proof.compensationSeen.add(value);
        if(proofComplete())progress.unlocked.add(3);persist();render({announce:false});return;
      }
      if(target.dataset.planeNote!==undefined){progress.proof.planeSeen=true;if(proofComplete())progress.unlocked.add(3);persist();render({announce:false});return;}
      if(target.dataset.mythAnswer!==undefined){progress.mythAnswers[mythIndex]=Number(target.dataset.mythAnswer);progress.myths[mythIndex]=true;if(mythIndex===4){if(prerequisiteMet)progress.unlocked.add(4);onVoiceMilestone('academy.contact-height.s3.boundary');}persist();render({announce:false});return;}
      if(target.dataset.masteryAnswer!==undefined){progress.masteryAnswers[progress.masteryIndex]=Number(target.dataset.masteryAnswer);persist();render({announce:false});return;}
      if(target.dataset.liveLowAck!==undefined){progress.transfer.lowAcknowledgesBottomBelow=true;persist();render({announce:false});return;}
      if(target.dataset.liveHighLabel){progress.transfer.highLabel=target.dataset.liveHighLabel;persist();render({announce:false});return;}
      if(target.dataset.capture!==undefined){
        const transfer=progress.transfer,state=solveContactHeightState(transfer.input),low=transfer.phase==='low';
        const range=low?state.contactHeight>=.001&&state.contactHeight<=.005:state.contactHeight>=.022&&state.contactHeight<=.026;
        const label=low?transfer.lowAcknowledgesBottomBelow:transfer.highLabel==='above-center';if(!range||!label||!transfer.interacted)return;
        const captured={input:{...transfer.input},lowPointX:state.lowPointX,lowPointZ:state.lowPointZ,radius:state.input.radius,planeAngle:state.input.planeAngle,swingDirection:state.input.swingDirection,contactHeight:state.contactHeight,contactHeightMm:state.contactHeightMm,attackAngle:state.attackAngle,ballCenterRelation:state.ballCenterRelation,label:low?'LOW PATH':'ABOVE CENTER'};
        transfer.captures.push(captured);
        if(low){transfer.low=captured;transfer.phase='high';transfer.input={lowPointZ:0};transfer.interacted=false;persist();render({announce:false});}
        else{transfer.high=captured;transfer.evaluation=evaluateContactHeightTransfer({lowInput:transfer.low.input,highInput:transfer.high.input,lowInteracted:true,highInteracted:true,lowAcknowledgesBottomBelow:transfer.lowAcknowledgesBottomBelow,highLabel:transfer.highLabel});submit();}
        return;
      }
      if(target.dataset.finish!==undefined){submit();return;}
      if(target.dataset.retry!==undefined){progress.surface=4;makeAttempt({advance:true});render();return;}
      if(target.dataset.planeLab!==undefined){navigate('#/experience/plane-coupling-lab');return;}
      if(target.dataset.surfaceTarget!==undefined){setSurface(Number(target.dataset.surfaceTarget));return;}
      if(target.dataset.action==='back'){navigate('#/academy');return;}
      if(target.dataset.action==='previous'){setSurface(Math.max(0,progress.surface-1));return;}
      if(target.dataset.action==='next'){
        if(progress.surface===3&&mythIndex<4){mythIndex+=1;render({announce:false});return;}
        if(progress.surface===3&&!prerequisiteMet)return;
        if(progress.surface===4&&progress.masteryIndex<4){progress.masteryIndex+=1;persist();render({announce:false});return;}
        if(progress.surface===5){navigate('#/academy');return;}
        progress.unlocked.add(progress.surface+1);setSurface(progress.surface+1);return;
      }
      if(target.dataset.resultNext)navigate(target.dataset.resultNext);
    });
    listen(lesson,'input',event=>{
      const target=event.target;
      if(target.matches('[data-contact-lab]')){
        const value=target.valueAsNumber;if(!Number.isFinite(value))return;
        const wasAbove=progress.lab.aboveCenter;progress.lab.lowPointZ=value;
        const state=solveContactHeightState({lowPointZ:value});
        if(progress.lab.predictionCorrect&&Math.abs(value-.003)<=1e-12)progress.lab.deltaConfirmed=true;
        if(progress.lab.deltaConfirmed&&state.contactHeight>.0213)progress.lab.aboveCenter=true;
        if(progress.lab.aboveCenter&&state.contactHeight>=.001&&state.contactHeight<=.005)progress.lab.lowReturned=true;
        if(!wasAbove&&progress.lab.aboveCenter)onVoiceMilestone('academy.contact-height.s1.center');
        if(progress.lab.predictionCorrect&&progress.lab.deltaConfirmed&&progress.lab.aboveCenter&&progress.lab.lowReturned)progress.unlocked.add(2);
        onVoiceInterrupt('model-input');persist();render({announce:false});return;
      }
      if(target.matches('[data-live-contact]')){
        const value=target.valueAsNumber;if(!Number.isFinite(value)||value<-.01||value>.03)return;
        progress.transfer.input={lowPointZ:value};progress.transfer.interacted=true;onVoiceInterrupt('model-input');persist();render({announce:false});
      }
    });
    listen(lesson,'keydown',event=>{if(event.key==='Escape'&&!lesson.querySelector('.low-point__sheet')?.hidden){event.preventDefault();closeSheet();}});
    listen(lesson.querySelector('[data-sheet-scrim]'),'click',closeSheet);
  }

  render();
  if(conceptId==='strike-depth')queueMicrotask(()=>{if(!destroyed)openSheet('height');});
  return()=>{destroyed=true;cleanups.splice(0).forEach(fn=>{try{fn();}catch{}});root.innerHTML='';};
}
