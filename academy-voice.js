import { cueSignature, validateAcademyCue } from './academy-voice-manifest.js';

export function createAcademyVoiceController({
  getPreferences, setMode, markSeen, createAudio,
  getScreenReaderState = () => 'unknown', getForegroundState = () => true,
  now = () => Date.now(), onCaption = () => {}, onPlayback = () => {}, onDiagnostic = () => {}
} = {}) {
  let routeEpoch = 0;
  let active = null;
  let lastCue = null;
  let lastCueEndedAt = -Infinity;
  let destroyed = false;
  let state = { status:'idle', routeEpoch, caption:null, cueId:null, reason:null, preferenceRequired:false, replayAvailable:false };
  const publish = patch => { state = { ...state, ...patch, routeEpoch }; onPlayback({ ...state }); return { ...state }; };
  const preferences = () => getPreferences?.() || { mode:'unset', seen:{} };

  function stop(reason = 'stopped', { keepCaption = true } = {}) {
    if (active?.audio) {
      try { active.audio.pause?.(); active.audio.currentTime = 0; } catch { /* best-effort local stop */ }
      try { active.audio.remove?.(); } catch { /* optional fake/browser cleanup */ }
    }
    if (active) lastCueEndedAt = now();
    active = null;
    return publish({ status:'idle', reason, caption:keepCaption ? state.caption : null, cueId:keepCaption ? state.cueId : null, replayAvailable:Boolean(keepCaption && lastCue) });
  }

  function enterRoute() {
    routeEpoch += 1;
    stop('route', { keepCaption:false });
    lastCue = null;
    return routeEpoch;
  }

  function caption(cue, reason, replayAvailable = true) {
    lastCue = cue;
    onCaption({ cue, text:cue.text, reason, visible:true });
    publish({ status:reason === 'playing' ? 'playing' : 'caption', caption:cue.text, cueId:cue.cueId, reason, replayAvailable });
  }

  function remember(cue, delivery) {
    try { markSeen?.(cueSignature(cue), delivery); }
    catch (error) { onDiagnostic({ code:'seen-save-failed', cueId:cue.cueId, message:error.message }); }
  }

  function startAudio(cue, epoch, { automatic }) {
    if (epoch !== routeEpoch || destroyed) return publish({ status:'idle', reason:'stale-route' });
    let audio;
    try { audio = createAudio?.(cue.asset, cue); }
    catch (error) {
      onDiagnostic({ code:'asset-unavailable', cueId:cue.cueId, message:error.message });
      if (automatic) remember(cue, 'asset-unavailable');
      caption(cue, 'asset-unavailable', false);
      return { played:false, reason:'asset-unavailable' };
    }
    if (!audio || !cue.asset) {
      if (automatic) remember(cue, 'asset-unavailable');
      caption(cue, 'asset-unavailable', false);
      return { played:false, reason:'asset-unavailable' };
    }
    active = { cue, audio, epoch, automatic };
    if (automatic) remember(cue, 'played');
    caption(cue, 'playing');
    const finish = reason => {
      if (active?.audio !== audio) return;
      active = null; lastCueEndedAt = now(); publish({ status:'idle', reason, replayAvailable:true });
    };
    audio.addEventListener?.('ended', () => finish('ended'), { once:true });
    audio.addEventListener?.('error', () => finish('audio-error'), { once:true });
    try {
      const result = audio.play?.();
      if (result?.catch) result.catch(error => {
        onDiagnostic({ code:'playback-rejected', cueId:cue.cueId, message:error?.message });
        if (active?.audio === audio) { active = null; caption(cue, 'playback-rejected'); }
      });
    } catch (error) {
      active = null; onDiagnostic({ code:'playback-rejected', cueId:cue.cueId, message:error.message }); caption(cue, 'playback-rejected');
      return { played:false, reason:'playback-rejected' };
    }
    return { played:true, reason:'playing' };
  }

  function deliverAutomatic(cue, { epoch = routeEpoch } = {}) {
    validateAcademyCue(cue);
    if (destroyed || epoch !== routeEpoch) return { played:false, reason:'stale-route' };
    const pref = preferences();
    if (pref.mode === 'unset') {
      publish({ status:'preference-required', preferenceRequired:true, reason:'preference-unset' });
      return { played:false, reason:'preference-unset', requestPreference:true };
    }
    if (pref.mode === 'off') return { played:false, reason:'off' };
    const signature = cueSignature(cue);
    if (pref.seen?.[signature]) return { played:false, reason:'seen' };
    if (active) return { played:false, reason:'busy-discarded' };
    if (!getForegroundState()) return { played:false, reason:'foreground-loss' };
    const screenReader = getScreenReaderState();
    const pacedConsequence = cue.job === 'consequence' && now() - lastCueEndedAt < 5000;
    if (pref.mode === 'captions' || screenReader === true || pacedConsequence) {
      const reason = screenReader === true ? 'screen-reader-suppressed' : pacedConsequence ? 'paced-caption-only' : 'caption-only';
      caption(cue, reason, Boolean(cue.asset)); remember(cue, 'caption-only');
      return { played:false, reason };
    }
    return startAudio(cue, epoch, { automatic:true });
  }

  function offerRecovery(cue) {
    validateAcademyCue(cue);
    if (cue.job !== 'recovery') throw new TypeError('Recovery offer requires a recovery cue');
    lastCue = cue; publish({ status:'recovery-offer', cueId:cue.cueId, caption:null, reason:'recovery-offer', replayAvailable:true });
    return { offered:true };
  }

  function replay(cue = lastCue) {
    if (!cue) return { played:false, reason:'no-cue' };
    validateAcademyCue(cue);
    stop('replay-restart', { keepCaption:false });
    const pref = preferences();
    if (pref.mode === 'off') return { played:false, reason:'off' };
    if (pref.mode === 'captions' || getScreenReaderState() === true) { caption(cue, 'caption-only', Boolean(cue.asset)); return { played:false, reason:'caption-only' }; }
    return startAudio(cue, routeEpoch, { automatic:false });
  }

  function setVoiceMode(mode) {
    if (!['voice','captions','off'].includes(mode)) throw new TypeError(`Invalid voice mode: ${mode}`);
    if (mode !== 'voice' || active) stop(`mode-${mode}`, { keepCaption:mode !== 'off' });
    setMode?.(mode);
    publish({ preferenceRequired:false, reason:`mode-${mode}`, caption:mode === 'off' ? null : state.caption });
    return mode;
  }

  function destroy() { if (destroyed) return; destroyed = true; stop('destroyed', { keepCaption:false }); }
  return { enterRoute, deliverAutomatic, offerRecovery, replay, stop, setVoiceMode, getState:() => ({ ...state }), destroy };
}
