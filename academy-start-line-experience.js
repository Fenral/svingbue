import { START_LINE_CONTENT } from './academy-start-line-content.js';
import { evaluateStartLineTransfer, predictStartLineShift, solveStartLineState } from './academy-start-line-model.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const signed=(value,dp=1)=>`${value>0?'+':value<0?'−':''}${Math.abs(value).toFixed(dp)}°`;
const attemptId=()=>`start-line-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
const SURFACE_CUES=['academy.start-line.s0.entry','academy.start-line.s1.entry','academy.start-line.s2.entry','academy.start-line.s3.entry','academy.start-line.s4.entry',null];
const CONCEPT_SHEETS={ 'face-angle':'face-angle','club-path':'club-path','start-direction':'launch-direction' };
const MASTERY_FIXTURES=Object.freeze([
  Object.freeze({ id:'blend-mid-high',target:1,switchedLoft:46,start:Object.freeze({faceAngle:0,clubPath:0,dynamicLoft:30}) }),
  Object.freeze({ id:'matched-mid-low',target:1.5,switchedLoft:13,start:Object.freeze({faceAngle:0,clubPath:0,dynamicLoft:30}) }),
  Object.freeze({ id:'blend-mid-low',target:-1,switchedLoft:13,start:Object.freeze({faceAngle:0,clubPath:0,dynamicLoft:30}) })
]);

function persistedState(source={}) {
  const custom=source.evidence?.startLine || {};
  return {
    surface:Number.isInteger(source.surface)?source.surface:0,
    unlocked:new Set([0,...(source.unlockedSurfaces||[])]),
    mission:{ built:Boolean(custom.mission?.built),loftRestored:Boolean(custom.mission?.loftRestored) },
    myths:Array.from({length:3},(_,index)=>Boolean(custom.myths?.[index])),
    mythAnswers:Array.from({length:3},(_,index)=>Number.isInteger(custom.mythAnswers?.[index])?custom.mythAnswers[index]:null),
    optionalProofs:{ matchedInvariant:Boolean(custom.optionalProofs?.matchedInvariant) },
    masteryAnswers:Array.from({length:4},(_,index)=>Number.isInteger(custom.masteryAnswers?.[index])?custom.masteryAnswers[index]:null),
    masteryIndex:Number.isInteger(custom.masteryIndex)?clamp(custom.masteryIndex,0,4):0,
    transfer:custom.transfer && typeof custom.transfer==='object'?structuredClone(custom.transfer):null,
    attemptId:source.activeAttempt?.attemptId || custom.attemptId || null,
    attemptNumber:Number.isInteger(custom.attemptNumber)&&custom.attemptNumber>=0?custom.attemptNumber:0,
    knowledgeBestCorrect:Number.isInteger(source.evidence?.knowledgeBestCorrect)?source.evidence.knowledgeBestCorrect:0,
    lastResult:custom.lastResult || null
  };
}

export function mountStartLineExperience(options={}) {
  const { root,state:stored={},conceptId=null,saveProgress=()=>{},submitMastery=()=>null,nextAction=()=>({label:'Back to Academy',route:'#/academy'}),navigate=()=>{},voiceTargets,onVoiceSurface=()=>{},onVoiceInterrupt=()=>{},onVoiceMilestone=()=>{} }=options;
  if (!(root instanceof HTMLElement)) throw new TypeError('Start Line root is required');
  const progress=persistedState(stored);
  let input={ faceAngle:0,clubPath:-2,dynamicLoft:30 };
  let activeParam='faceAngle';
  let prediction=null;
  let mythIndex=progress.myths.findIndex(value=>!value);if(mythIndex<0)mythIndex=2;
  let destroyed=false;
  let sheetTrigger=null;
  let lastSettled=solveStartLineState(input);
  let settleTimer=null;
  const cleanups=[];

  const persist=(extra={})=>{
    const evidence={ ...(stored.evidence||{}),startLine:{
      mission:{...progress.mission},myths:[...progress.myths],mythAnswers:[...progress.mythAnswers],
      optionalProofs:{...progress.optionalProofs},masteryAnswers:[...progress.masteryAnswers],masteryIndex:progress.masteryIndex,
      transfer:progress.transfer?structuredClone(progress.transfer):null,attemptId:progress.attemptId,attemptNumber:progress.attemptNumber,lastResult:progress.lastResult
    },surfacesSeen:[...new Set([...(stored.evidence?.surfacesSeen||[]),progress.surface])],instrumentTouched:progress.mission.built||Boolean(stored.evidence?.instrumentTouched),...extra.evidence };
    return saveProgress({ surface:progress.surface,unlockedSurfaces:[...progress.unlocked].sort((a,b)=>a-b),...extra,evidence });
  };
  const listen=(target,event,handler,opts)=>{target?.addEventListener(event,handler,opts);cleanups.push(()=>target?.removeEventListener(event,handler,opts));};
  const surface=()=>START_LINE_CONTENT.surfaces[progress.surface];
  const solve=()=>solveStartLineState(input);
  const activeSurface=()=>root.querySelector('[data-start-line-surface]');

  function createMasteryAttempt({advance=false}={}) {
    if(advance)progress.attemptNumber+=1;
    const fixture=MASTERY_FIXTURES[progress.attemptNumber%MASTERY_FIXTURES.length];
    progress.attemptId=attemptId();
    progress.masteryIndex=0;
    progress.masteryAnswers=[null,null,null,null];
    progress.transfer={
      fixtureId:fixture.id,target:fixture.target,switchedLoft:fixture.switchedLoft,phase:'build',
      input:{...fixture.start},phaseAInput:null,prediction:null,changedAfterSwitch:false,evaluation:null
    };
    progress.lastResult=null;
    input={...fixture.start};
    persist({ activeAttempt:{ attemptId:progress.attemptId,fixtureId:fixture.id,contentVersion:START_LINE_CONTENT.contentVersion } });
  }

  function ensureMasteryAttempt() {
    if(progress.attemptId&&progress.transfer){input={...progress.transfer.input};return;}
    createMasteryAttempt();
  }

  function knowledgeCorrect(includeTransfer=false) {
    const choices=START_LINE_CONTENT.masteryTasks.slice(0,4);
    const correct=choices.reduce((total,task,index)=>total+(progress.masteryAnswers[index]===task.answerIndex?1:0),0);
    return correct+(includeTransfer&&progress.transfer?.evaluation?.passed?1:0);
  }

  function departureSvg(model,{ ghost=null }={}) {
    const endX=angle=>50+angle*5;
    const ray=(kind,angle,y=16)=>`<line data-${kind}-ray x1="50" y1="78" x2="${endX(angle)}" y2="${y}"/>`;
    return `<svg class="start-line__instrument" viewBox="0 0 100 92" role="img" aria-label="Face, Path and Launch Direction departure instrument">
      <line class="start-line__target" x1="50" y1="4" x2="50" y2="88"/><line class="start-line__ruler" x1="10" y1="12" x2="90" y2="12"/>
      ${ghost?`<line class="start-line__ghost" x1="50" y1="78" x2="${endX(ghost.launchDirection)}" y2="16"/>`:''}
      <g class="start-line__vectors" data-voice-target="start-line-blend-vectors">${ray('path',model.clubPath,20)}${ray('face',model.faceAngle,18)}${ray('launch',model.launchDirection,12)}</g>
      <circle cx="50" cy="78" r="2.5"/><text x="50" y="90" text-anchor="middle">TARGET · 0°</text>
    </svg>`;
  }

  function readouts(model) {
    return `<div class="start-line__readouts" aria-label="Live model terms">
      <button type="button" data-sheet="launch-direction"><span>Launch Direction</span><strong data-launch-direction>${signed(model.launchDirection)}</strong><small>MODEL · INITIAL</small></button>
      <div><span>Face contribution</span><strong data-face-contribution>${signed(model.faceContribution)}</strong></div>
      <div><span>Path contribution</span><strong data-path-contribution>${signed(model.pathContribution)}</strong></div>
      <div><span>Face share</span><strong data-face-share>${Math.round(model.faceShare*100)}%</strong><small>MODEL</small></div>
    </div>`;
  }

  function controls(model,{loftLocked=false,hints=true}={}) {
    const key=activeParam;const value=input[key];
    return `<div class="start-line__controls" data-voice-target="start-line-face-control">
      <div class="start-line__tabs" role="radiogroup" aria-label="Choose direct input">
        ${[['faceAngle','Face Angle'],['clubPath','Club Path']].map(([id,label])=>`<button type="button" role="radio" data-start-line-param="${id}" aria-checked="${id===key}" tabindex="${id===key?0:-1}">${label}</button>`).join('')}
      </div>
      <label for="startLineRange"><span>${key==='faceAngle'?'Face Angle':'Club Path'}</span><output>${signed(value)}</output></label>
      <input id="startLineRange" type="range" min="-10" max="10" step="0.5" value="${value}" aria-valuetext="${signed(value)}">
      <div class="start-line__held" data-voice-target="start-line-loft-share"><span>${input.dynamicLoft===13?'LOW':input.dynamicLoft===46?'HIGH':'MID'} ${input.dynamicLoft}°</span><small>${loftLocked?'HELD · LOCKED':'HELD · DELIVERED LOFT'}</small></div>
      ${hints?`<p class="start-line__cause" data-start-line-cause>Face ${Math.round(model.faceShare*100)}% + Path ${Math.round(model.pathShare*100)}% = ${signed(model.launchDirection)}</p>`:''}
    </div>`;
  }

  function missionHtml() {
    const model=solveStartLineState({faceAngle:2,clubPath:-2,dynamicLoft:30});
    return `<section class="start-line__surface start-line__mission" data-start-line-surface aria-labelledby="startLineTitle">
      <p class="start-line__eyebrow">${surface().eyebrow}</p><h1 id="startLineTitle">${surface().title}</h1><p class="start-line__lede">${surface().body}</p>
      ${departureSvg(model)}<div class="start-line__mission-card"><small>MISSION</small><strong>${surface().mission}</strong><span>MID 30° · HELD</span></div>
      <button class="start-line__primary" type="button" data-start-line-primary>${surface().action}</button>
    </section>`;
  }

  function labHtml() {
    const model=solve();
    return `<section class="start-line__surface" data-start-line-surface aria-labelledby="startLineTitle">
      <p class="start-line__eyebrow">${surface().eyebrow}</p><h1 id="startLineTitle">${surface().title}</h1><p class="start-line__lede">${surface().body}</p>
      <div data-voice-target="start-line-launch-gate">${departureSvg(model,{ghost:lastSettled})}</div><p class="start-line__instrument-label">${surface().caption}</p>
      ${readouts(model)}${controls(model)}
      <div class="start-line__verdict" data-mission-built data-complete="${progress.mission.built}">${progress.mission.built?'<strong>TARGET HELD</strong><span>Face and Path terms resolve to +1.0°.</span>':'<strong>BUILD +1.0°</strong><span>Reach the raw target once to continue.</span>'}</div>
    </section>`;
  }

  function influenceHtml() {
    const model=solve();const revealed=prediction!==null||progress.mission.loftRestored;
    return `<section class="start-line__surface" data-start-line-surface aria-labelledby="startLineTitle">
      <p class="start-line__eyebrow">${surface().eyebrow}</p><h1 id="startLineTitle">${surface().title}</h1><p class="start-line__lede">${surface().body}</p>
      <div class="start-line__prediction" data-revealed="${revealed}"><p>Face +2.0°, Path −2.0°. What happens at High 46°?</p>
        <div role="radiogroup" aria-label="Predict Launch Direction shift">${[['toward-face','Starts farther right'],['fixed','Stays +1.0°'],['toward-path','Moves toward path']].map(([id,label])=>`<button type="button" role="radio" data-start-line-prediction="${id}" aria-checked="${prediction===id}">${label}</button>`).join('')}</div></div>
      <div class="start-line__lofts" role="radiogroup" aria-label="Delivered loft case">${[['low',13],['mid',30],['high',46]].map(([id,value])=>`<button type="button" role="radio" data-loft-case="${id}" data-loft="${value}" aria-checked="${input.dynamicLoft===value}" ${!revealed?'disabled':''}>${id.toUpperCase()} ${value}°</button>`).join('')}</div>
      ${departureSvg(model,{ghost:solveStartLineState({faceAngle:2,clubPath:-2,dynamicLoft:30})})}${readouts(model)}
      <div class="start-line__roles">${START_LINE_CONTENT.influenceRoles.map(role=>`<div><span>${role.label}</span><strong>${role.role}</strong><small>${role.detail}</small></div>`).join('')}</div>
      ${revealed?controls(model,{loftLocked:true}):''}
      <div class="start-line__verdict" data-loft-restored data-complete="${progress.mission.loftRestored}">${progress.mission.loftRestored?'<strong>RESTORED +1.0°</strong><span>High loft stayed held while a direct input changed.</span>':'<strong>RESTORE +1.0°</strong><span>Predict first, then use Face or Path.</span>'}</div>
    </section>`;
  }

  function mythsHtml() {
    const myth=START_LINE_CONTENT.myths[mythIndex];const answered=progress.myths[mythIndex];const selected=progress.mythAnswers[mythIndex];
    return `<section class="start-line__surface" data-start-line-surface aria-labelledby="startLineTitle">
      <p class="start-line__eyebrow">${surface().eyebrow}</p><h1 id="startLineTitle">${surface().title}</h1><p class="start-line__lede">Experiment ${mythIndex+1} of 3</p>
      <div class="start-line__myth" data-voice-target="start-line-myth-choices"><h2>${myth.prompt}</h2><div role="radiogroup" aria-label="Prediction choices">${myth.choices.map((choice,index)=>`<button type="button" role="radio" data-myth-choice="${index}" aria-checked="${selected===index}" ${answered?'disabled':''}>${choice}</button>`).join('')}</div>
      ${answered?`<div class="start-line__evidence"><strong>${selected===myth.answerIndex?'Prediction confirmed':'Evidence revealed'}</strong><p>${myth.explanation}</p></div>`:''}</div>
    </section>`;
  }

  function masteryHtml() {
    const task=START_LINE_CONTENT.masteryTasks[progress.masteryIndex];
    if(progress.masteryIndex<4){
      const selected=progress.masteryAnswers[progress.masteryIndex];
      return `<section class="start-line__surface" data-start-line-surface data-voice-target="start-line-mastery-gate" aria-labelledby="startLineTitle">
        <p class="start-line__eyebrow">${surface().eyebrow}</p><h1 id="startLineTitle">${surface().title}</h1><p class="start-line__lede">Task ${progress.masteryIndex+1} of 5 · Knowledge</p>
        <div class="start-line__mastery-card"><small>CHOOSE ONE</small><h2>${task.prompt}</h2><div role="radiogroup" aria-label="${esc(task.prompt)}">
          ${task.choices.map((choice,index)=>`<button type="button" role="radio" data-mastery-choice="${index}" aria-checked="${selected===index}" ${selected!==null?'disabled':''}>${choice}</button>`).join('')}
        </div>${selected!==null?`<div class="start-line__mastery-explain" data-answer-correct="${selected===task.answerIndex}"><strong>${selected===task.answerIndex?'Confirmed':'Review the model'}</strong><p>${task.explanation}</p></div>`:''}</div>
      </section>`;
    }
    const transfer=progress.transfer;const model=solveStartLineState(transfer.input);const inside=Math.abs(model.launchDirection-transfer.target)<=.1+1e-12;
    const phaseLabel=transfer.phase==='build'?'PHASE A · BUILD':transfer.phase==='predict'?'PHASE B · PREDICT':'PHASE B · RESTORE';
    const canAdjust=transfer.phase!=='predict';
    return `<section class="start-line__surface" data-start-line-surface data-voice-target="start-line-mastery-gate" aria-labelledby="startLineTitle">
      <p class="start-line__eyebrow">${surface().eyebrow}</p><h1 id="startLineTitle">Live transfer</h1><p class="start-line__lede">Task 5 of 5 · Build, predict, restore</p>
      <div class="start-line__transfer" data-transfer-fixture="${transfer.fixtureId}">
        <div class="start-line__transfer-head"><span data-transfer-phase>${phaseLabel}</span><strong>Target ${signed(transfer.target)}</strong><small>${transfer.phase==='build'?'MID 30° · HELD':`${transfer.switchedLoft===13?'LOW':'HIGH'} ${transfer.switchedLoft}° · HELD`}</small></div>
        ${departureSvg(model)}
        <div class="start-line__transfer-readout"><span>Launch Direction</span><strong data-transfer-launch>${signed(model.launchDirection)}</strong><small data-transfer-gate data-inside="${inside}">${inside?'INSIDE ±0.10°':'BUILD TO ±0.10°'}</small></div>
        ${transfer.phase==='predict'?`<div class="start-line__transfer-predict"><p>Delivered loft changed. Before adjusting Face or Path, predict the shift.</p><div role="radiogroup" aria-label="Predict held-loft shift">${[['toward-face','Moves toward Face'],['fixed','Stays fixed'],['toward-path','Moves toward Path']].map(([id,label])=>`<button type="button" role="radio" data-transfer-prediction="${id}" aria-checked="false">${label}</button>`).join('')}</div></div>`:`<div class="start-line__transfer-controls">
          <label><span>Face Angle</span><output>${signed(transfer.input.faceAngle)}</output><input data-transfer-face type="range" min="-10" max="10" step="0.01" value="${transfer.input.faceAngle}" aria-valuetext="${signed(transfer.input.faceAngle)}" ${canAdjust?'':'disabled'}></label>
          <label><span>Club Path</span><output>${signed(transfer.input.clubPath)}</output><input data-transfer-path type="range" min="-10" max="10" step="0.01" value="${transfer.input.clubPath}" aria-valuetext="${signed(transfer.input.clubPath)}" ${canAdjust?'':'disabled'}></label>
        </div>`}
        ${transfer.phase==='build'?`<button type="button" class="start-line__transfer-lock" data-transfer-lock ${inside?'':'disabled'}>Lock Phase A</button>`:''}
        ${transfer.phase==='restore'?`<p class="start-line__transfer-prediction-lock">Prediction locked · ${esc(transfer.prediction)}</p>`:''}
        <button type="button" class="start-line__transfer-submit" data-transfer-submit>${transfer.phase==='restore'?'Submit evidence':'Finish without transfer'}</button>
      </div>
    </section>`;
  }

  function resultHtml() {
    const next=nextAction();const result=progress.lastResult||{};const mastered=result.status==='mastered'||stored.status==='mastered';
    const rows=[
      ['Direct blend',result.directBlend?'demonstrated':'review'],['Loft modifier',result.loftModifier?'demonstrated':'review'],
      ['Model boundary',result.modelBoundary?'demonstrated':'review'],['Live transfer',result.liveTransferPassed?'passed':'retry']
    ];
    return `<section class="start-line__surface start-line__result" data-start-line-surface data-voice-target="start-line-result-evidence" aria-labelledby="startLineTitle">
      <p class="start-line__eyebrow">${surface().eyebrow}</p><h1 id="startLineTitle" data-result-status>START LINE ${mastered?'MASTERED':'PRACTICED'}</h1>
      <p class="start-line__lede">${mastered?'You controlled Launch Direction and preserved it when the modeled face–path split changed.':'You can separate Face, Path and Launch Direction. Re-run the loft-change target to prove transfer.'}</p>
      <div class="start-line__result-score"><strong>${result.knowledgeCorrect??0}/5</strong><span>KNOWLEDGE + TRANSFER</span>${result.xpAwarded?`<small>+${result.xpAwarded} XP</small>`:''}</div>
      <div class="start-line__evidence-list">${rows.map(([label,value])=>`<div><span>${label}</span><strong data-state="${value}">${value}</strong></div>`).join('')}</div>
      ${!mastered?'<button type="button" class="start-line__retry" data-mastery-retry>Retry Mastery Check</button>':''}
      <button type="button" class="start-line__primary" data-result-next="${esc(next.route)}">${esc(next.label)}</button>
    </section>`;
  }

  function sheetHtml() {
    return `<div class="start-line__scrim" data-start-line-sheet-scrim hidden></div><aside class="start-line__sheet" role="dialog" aria-modal="true" aria-labelledby="startLineSheetTitle" hidden><div><p data-start-line-sheet-tags></p><h2 id="startLineSheetTitle" data-start-line-sheet-title></h2><p data-start-line-sheet-body></p><button type="button" data-start-line-sheet-close>Close</button></div></aside>`;
  }

  function shellHtml(body) {
    return `<main id="startLineExperience" class="start-line" data-surface="${progress.surface}" data-experience="start-line">
      <header class="start-line__header"><button type="button" data-action="back" aria-label="Back to Academy">←</button><div><small>ACADEMY · DIRECTION</small><strong>Start Line</strong></div><span>HELD · RH</span></header>
      <div class="start-line__voice-slot" data-academy-voice-slot></div><div class="start-line__body">${body}</div>
      ${progress.surface>0?`<nav class="start-line__nav"><button type="button" data-action="previous" ${progress.surface===0?'disabled':''}>Back</button><div>${[0,1,2,3,4,5].map(index=>`<button type="button" data-surface-target="${index}" aria-label="Step ${index+1} of 6" aria-current="${index===progress.surface?'step':'false'}" ${!progress.unlocked.has(index)?'disabled':''}></button>`).join('')}</div><button type="button" data-action="next" ${nextBlocked()?'disabled':''}>${progress.surface===5?'Done':'Next'} →</button></nav>`:''}
      ${sheetHtml()}</main>`;
  }

  function nextBlocked() {
    if (progress.surface===1) return !progress.mission.built;
    if (progress.surface===2) return !progress.mission.loftRestored;
    if (progress.surface===3) return !progress.myths[mythIndex];
    if (progress.surface===4) return progress.masteryIndex>=4 || progress.masteryAnswers[progress.masteryIndex]===null;
    return false;
  }

  function openSheet(key,trigger=null) {
    const content=START_LINE_CONTENT.sheets[key];if(!content)return;
    const lesson=root.querySelector('#startLineExperience');const sheet=lesson.querySelector('.start-line__sheet');sheetTrigger=trigger||document.activeElement;
    sheet.querySelector('[data-start-line-sheet-tags]').textContent=content.tags.join(' · ');sheet.querySelector('[data-start-line-sheet-title]').textContent=content.title;sheet.querySelector('[data-start-line-sheet-body]').textContent=content.body;
    lesson.querySelector('[data-start-line-sheet-scrim]').hidden=false;sheet.hidden=false;sheet.querySelector('[data-start-line-sheet-close]').focus();
  }
  function closeSheet() { const lesson=root.querySelector('#startLineExperience');lesson?.querySelector('.start-line__sheet')?.setAttribute('hidden','');const scrim=lesson?.querySelector('[data-start-line-sheet-scrim]');if(scrim)scrim.hidden=true;sheetTrigger?.focus?.();sheetTrigger=null; }

  function render({announceSurface=true}={}) {
    if(destroyed)return;
    if(progress.surface===4)ensureMasteryAttempt();
    const body=[missionHtml,labHtml,influenceHtml,mythsHtml,masteryHtml,resultHtml][progress.surface]();
    const voiceSlot=root.querySelector('[data-academy-voice-slot]');root.innerHTML=shellHtml(body);const nextVoiceSlot=root.querySelector('[data-academy-voice-slot]');if(voiceSlot?.hasChildNodes()&&nextVoiceSlot)nextVoiceSlot.replaceWith(voiceSlot);wire();registerVoiceTargets();
    if(announceSurface)onVoiceSurface(progress.surface,SURFACE_CUES[progress.surface]);
  }

  function setSurface(index) {
    if(!progress.unlocked.has(index))return false;progress.surface=index;
    if(index===1)input={faceAngle:progress.mission.built?2:0,clubPath:-2,dynamicLoft:30};
    if(index===2)input={faceAngle:2,clubPath:-2,dynamicLoft:progress.mission.loftRestored?46:30};
    if(index===4)ensureMasteryAttempt();
    persist();render();return true;
  }

  function settle(before,after,label) {
    clearTimeout(settleTimer);settleTimer=setTimeout(()=>{
      const cause=root.querySelector('[data-start-line-cause]');if(!cause)return;
      const delta=after.launchDirection-before.launchDirection;
      cause.textContent=`${label} changed · Launch Direction ${signed(before.launchDirection)} → ${signed(after.launchDirection,Math.abs(delta)<.05?2:1)}.`;
    },300);
  }

  function handleInput(range) {
    onVoiceInterrupt('model-input');const value=range.valueAsNumber;if(!Number.isFinite(value))return;
    const before=solve();try{input={...input,[activeParam]:value};const after=solve();lastSettled=before;
      if(progress.surface===1 && activeParam==='faceAngle' && Math.abs(input.faceAngle-2)<1e-9 && input.clubPath===-2 && Math.abs(after.launchDirection-1)<=.05){progress.mission.built=true;progress.unlocked.add(2);persist();}
      if(progress.surface===2 && input.dynamicLoft===46 && prediction!==null && Math.abs(after.launchDirection-1)<=.05){progress.mission.loftRestored=true;progress.unlocked.add(3);persist();}
      render({announceSurface:false});settle(before,after,activeParam==='faceAngle'?'Face':'Path');
    }catch{input={...input,[activeParam]:before[activeParam]};}
  }

  function handleTransferInput(range) {
    onVoiceInterrupt('model-input');
    const value=range.valueAsNumber;if(!Number.isFinite(value)||value<-10||value>10)return;
    const key=range.matches('[data-transfer-face]')?'faceAngle':'clubPath';
    const before=progress.transfer.input[key];progress.transfer.input={...progress.transfer.input,[key]:value};input={...progress.transfer.input};
    if(progress.transfer.phase==='restore'&&Math.abs(value-before)>1e-12)progress.transfer.changedAfterSwitch=true;
    render({announceSurface:false});
  }

  function submitMasteryAttempt() {
    const transfer=progress.transfer;
    if(transfer.phase==='restore'){
      transfer.evaluation=evaluateStartLineTransfer({
        target:transfer.target,phaseAInput:transfer.phaseAInput,switchedLoft:transfer.switchedLoft,
        prediction:transfer.prediction,phaseBInput:transfer.input,changedAfterSwitch:transfer.changedAfterSwitch,tolerance:.1
      });
    }else transfer.evaluation={passed:false,reason:'incomplete-transfer'};
    const correct=knowledgeCorrect(true);const livePassed=Boolean(transfer.evaluation?.passed);
    const liveEvidence={ fixtureId:transfer.fixtureId,attemptId:progress.attemptId,...structuredClone(transfer.evaluation) };
    const previousBest=progress.knowledgeBestCorrect;progress.knowledgeBestCorrect=Math.max(previousBest,correct);
    persist({
      activeAttempt:{ attemptId:progress.attemptId,fixtureId:transfer.fixtureId,contentVersion:START_LINE_CONTENT.contentVersion },
      evidence:{ knowledgeBestCorrect:progress.knowledgeBestCorrect,knowledgeTotal:5,liveTransferPassed:livePassed,liveTransferEvidence:liveEvidence }
    });
    const result=submitMastery({
      experienceId:'start-line',attemptId:progress.attemptId,contentVersion:START_LINE_CONTENT.contentVersion,
      knowledgeCorrect:correct,knowledgeTotal:5,liveTransferPassed:livePassed,liveTransferEvidence:liveEvidence
    })||{accepted:false,reason:'unavailable',xpAwarded:0,experience:{status:'practiced'}};
    progress.lastResult={
      status:result.experience?.status||'practiced',reason:result.reason,knowledgeCorrect:correct,liveTransferPassed:livePassed,
      xpAwarded:result.xpAwarded||0,directBlend:progress.masteryAnswers[1]===START_LINE_CONTENT.masteryTasks[1].answerIndex,
      loftModifier:progress.masteryAnswers[2]===START_LINE_CONTENT.masteryTasks[2].answerIndex,
      modelBoundary:progress.masteryAnswers[3]===START_LINE_CONTENT.masteryTasks[3].answerIndex
    };
    progress.surface=5;progress.unlocked.add(5);progress.attemptId=null;
    persist({
      activeAttempt:null,status:result.experience?.status||'practiced',
      evidence:{ knowledgeBestCorrect:progress.knowledgeBestCorrect,knowledgeTotal:5,liveTransferPassed:livePassed,liveTransferEvidence:liveEvidence }
    });
    if(result.accepted)onVoiceMilestone('academy.start-line.s5.pass');
    render();
  }

  function wire() {
    const lesson=root.querySelector('#startLineExperience');
    listen(lesson,'click',event=>{
      const target=event.target.closest('button');if(!target||target.disabled)return;
      if(target.dataset.sheet){openSheet(target.dataset.sheet,target);return;}
      if(target.dataset.startLineSheetClose!==undefined){closeSheet();return;}
      if(target.dataset.startLinePrimary!==undefined){progress.unlocked.add(1);setSurface(1);return;}
      if(target.dataset.startLineParam){activeParam=target.dataset.startLineParam;render({announceSurface:false});root.querySelector(`[data-start-line-param="${activeParam}"]`)?.focus();return;}
      if(target.dataset.startLinePrediction){prediction=target.dataset.startLinePrediction;input={faceAngle:2,clubPath:-2,dynamicLoft:46};render({announceSurface:false});return;}
      if(target.dataset.loft){if(prediction===null)return;input={...input,dynamicLoft:Number(target.dataset.loft)};render({announceSurface:false});return;}
      if(target.dataset.mythChoice!==undefined){const answer=Number(target.dataset.mythChoice);progress.mythAnswers[mythIndex]=answer;progress.myths[mythIndex]=true;if(progress.myths.every(Boolean))progress.unlocked.add(4);persist();render({announceSurface:false});return;}
      if(target.dataset.masteryChoice!==undefined){progress.masteryAnswers[progress.masteryIndex]=Number(target.dataset.masteryChoice);persist();render({announceSurface:false});return;}
      if(target.dataset.transferLock!==undefined){
        const model=solveStartLineState(progress.transfer.input);if(Math.abs(model.launchDirection-progress.transfer.target)>.1+1e-12)return;
        progress.transfer.phaseAInput={...progress.transfer.input};progress.transfer.phase='predict';progress.transfer.input={...progress.transfer.input,dynamicLoft:progress.transfer.switchedLoft};input={...progress.transfer.input};persist();render({announceSurface:false});return;
      }
      if(target.dataset.transferPrediction){progress.transfer.prediction=target.dataset.transferPrediction;progress.transfer.phase='restore';progress.transfer.changedAfterSwitch=false;persist();render({announceSurface:false});return;}
      if(target.dataset.transferSubmit!==undefined){submitMasteryAttempt();return;}
      if(target.dataset.masteryRetry!==undefined){progress.surface=4;progress.unlocked.add(4);createMasteryAttempt({advance:true});render();return;}
      if(target.dataset.surfaceTarget!==undefined){setSurface(Number(target.dataset.surfaceTarget));return;}
      if(target.dataset.action==='back'){navigate('#/academy');return;}
      if(target.dataset.action==='previous'){setSurface(Math.max(0,progress.surface-1));return;}
      if(target.dataset.action==='next'){
        if(progress.surface===3 && mythIndex<2){mythIndex+=1;render({announceSurface:false});return;}
        if(progress.surface===4 && progress.masteryIndex<4){progress.masteryIndex+=1;persist();render({announceSurface:false});return;}
        if(progress.surface===5){navigate('#/academy');return;}
        progress.unlocked.add(progress.surface+1);setSurface(progress.surface+1);return;
      }
      if(target.dataset.resultNext){navigate(target.dataset.resultNext);}
    });
    listen(lesson,'input',event=>{if(event.target.matches('#startLineRange'))handleInput(event.target);if(event.target.matches('[data-transfer-face],[data-transfer-path]'))handleTransferInput(event.target);});
    listen(lesson,'keydown',event=>{if(event.key==='Escape'&&!lesson.querySelector('.start-line__sheet')?.hidden){event.preventDefault();closeSheet();}});
    listen(lesson.querySelector('[data-start-line-sheet-scrim]'),'click',closeSheet);
  }

  function registerVoiceTargets() {
    const selectors={
      'start-line-blend-vectors':'[data-voice-target="start-line-blend-vectors"]','start-line-face-control':'[data-voice-target="start-line-face-control"]','start-line-launch-gate':'[data-voice-target="start-line-launch-gate"]','start-line-loft-share':'[data-voice-target="start-line-loft-share"]','start-line-myth-choices':'[data-voice-target="start-line-myth-choices"]','start-line-mastery-gate':'[data-voice-target="start-line-mastery-gate"]','start-line-result-evidence':'[data-voice-target="start-line-result-evidence"]'
    };
    for(const [id,selector] of Object.entries(selectors)){
      if(!voiceTargets?.register||!root.querySelector(selector))continue;
      try{const unregister=voiceTargets.register(id,{setEmphasis:({kind,reducedMotion})=>{const el=root.querySelector(selector);if(el){el.dataset.voiceEmphasis=kind;el.dataset.voiceStatic=String(reducedMotion);}},clear:()=>{const el=root.querySelector(selector);if(el){delete el.dataset.voiceEmphasis;delete el.dataset.voiceStatic;}}});cleanups.push(unregister);}catch{/* target already registered for this render epoch */}
    }
  }

  render();
  if(conceptId&&CONCEPT_SHEETS[conceptId])queueMicrotask(()=>{if(!destroyed)openSheet(CONCEPT_SHEETS[conceptId]);});
  return ()=>{destroyed=true;clearTimeout(settleTimer);cleanups.splice(0).forEach(fn=>{try{fn();}catch{}});root.innerHTML='';};
}
