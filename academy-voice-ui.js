const LABELS = Object.freeze({ unset:'Choose voice', voice:'Voice on', captions:'Captions only', off:'Voice off' });

export function buildVoiceUiViewModel(controllerState = {}, mode = 'unset') {
  const caption = typeof controllerState.caption === 'string' ? controllerState.caption : null;
  return {
    mode,
    controlLabel:LABELS[mode] || LABELS.unset,
    preferenceRequired:mode === 'unset' || Boolean(controllerState.preferenceRequired),
    caption,
    showCaption:Boolean(caption),
    replayAvailable:Boolean(controllerState.replayAvailable && caption),
    replayLabel:mode === 'captions' ? 'Show cue' : 'Replay',
    replayDisabledReason:controllerState.reason === 'asset-unavailable' ? 'Audio unavailable' : null,
    status:controllerState.status || 'idle'
  };
}

export function mountAcademyVoiceUi({ root, controller, getMode = () => 'unset', onModeChange = () => {}, showInlineChoice = true } = {}) {
  if (!root) throw new TypeError('Academy voice UI root is required');
  root.innerHTML = `<div class="academy-voice" data-academy-voice>
    <button type="button" class="academy-voice__control" data-academy-voice-settings aria-haspopup="dialog">Choose voice</button>
    <section class="academy-voice__choice" data-academy-voice-choice aria-labelledby="academy-voice-choice-title" hidden>
      <p class="academy-voice__eyebrow">CONTROL ROOM</p><h2 id="academy-voice-choice-title">How should Academy guide you?</h2>
      <p>Prerecorded local cues. Captions always stay available with voice.</p>
      <div role="group" aria-label="Academy voice preference">
        <button type="button" data-voice-mode="voice">Voice + captions</button>
        <button type="button" data-voice-mode="captions">Captions only</button>
        <button type="button" data-voice-mode="off">Off</button>
      </div>
    </section>
    <section class="academy-voice__caption" data-academy-voice-caption aria-live="off" hidden>
      <p data-academy-voice-text></p><div><button type="button" data-academy-voice-replay>Replay</button><button type="button" data-academy-voice-close>Close caption</button></div>
    </section>
    <div class="academy-voice__scrim" data-academy-voice-scrim hidden></div>
    <section class="academy-voice__sheet" data-academy-voice-sheet role="dialog" aria-modal="true" aria-labelledby="academy-voice-sheet-title" hidden>
      <div class="academy-voice__sheet-head"><div><p class="academy-voice__eyebrow">ACADEMY SETTINGS</p><h2 id="academy-voice-sheet-title">Control Room voice</h2></div><button type="button" data-academy-voice-sheet-close aria-label="Close voice settings">Close</button></div>
      <fieldset><legend>Guidance mode</legend>
        <label><input type="radio" name="voice-mode" value="voice"> <span><strong>Voice + captions</strong><small>Local prerecorded cues with exact captions.</small></span></label>
        <label><input type="radio" name="voice-mode" value="captions"> <span><strong>Captions only</strong><small>Show every cue without audio.</small></span></label>
        <label><input type="radio" name="voice-mode" value="off"> <span><strong>Off</strong><small>No automatic voice or cue captions.</small></span></label>
      </fieldset>
    </section>
  </div>`;
  const el = selector => root.querySelector(selector);
  const opener=el('[data-academy-voice-settings]'), choice=el('[data-academy-voice-choice]'), caption=el('[data-academy-voice-caption]'), text=el('[data-academy-voice-text]'), replay=el('[data-academy-voice-replay]'), sheet=el('[data-academy-voice-sheet]'), scrim=el('[data-academy-voice-scrim]');
  let lastFocus = null; const listeners=[];
  const listen=(target,event,fn)=>{target?.addEventListener(event,fn);listeners.push(()=>target?.removeEventListener(event,fn));};
  const closeSheet=()=>{sheet.hidden=true;scrim.hidden=true;lastFocus?.focus?.();};
  const selectMode=mode=>{controller.setVoiceMode(mode);onModeChange(mode);choice.hidden=true;closeSheet();update(controller.getState());};
  listen(opener,'click',()=>{lastFocus=opener;sheet.hidden=false;scrim.hidden=false;(sheet.querySelector(`input[value="${getMode()}"]`) || sheet.querySelector('input'))?.focus();});
  root.querySelectorAll('[data-voice-mode]').forEach(button=>listen(button,'click',()=>selectMode(button.dataset.voiceMode)));
  root.querySelectorAll('input[name="voice-mode"]').forEach(input=>listen(input,'change',()=>selectMode(input.value)));
  listen(el('[data-academy-voice-sheet-close]'),'click',closeSheet);listen(scrim,'click',closeSheet);
  listen(replay,'click',()=>{controller.replay();update(controller.getState());});
  listen(el('[data-academy-voice-close]'),'click',()=>{caption.hidden=true;});
  const update=state=>{
    const vm=buildVoiceUiViewModel(state,getMode()); opener.textContent=vm.controlLabel;
    choice.hidden=!showInlineChoice || !vm.preferenceRequired; caption.hidden=!vm.showCaption; text.textContent=vm.caption || '';
    replay.textContent=vm.replayLabel; replay.disabled=Boolean(vm.replayDisabledReason); replay.title=vm.replayDisabledReason || '';
    root.querySelectorAll('input[name="voice-mode"]').forEach(input=>{input.checked=input.value===vm.mode;});
  };
  update(controller.getState());
  return { update, destroy(){listeners.splice(0).forEach(fn=>fn());root.innerHTML='';} };
}
