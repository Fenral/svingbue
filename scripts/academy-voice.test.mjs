import test from 'node:test';
import assert from 'node:assert/strict';
import { createAcademyVoiceController } from '../academy-voice.js';
import { ACADEMY_VOICE_LOCALE, ACADEMY_VOICE_PACK_ID, cueSignature } from '../academy-voice-manifest.js';

const makeCue = overrides => ({
  cueId:'home.orient', contentVersion:1, packId:ACADEMY_VOICE_PACK_ID, locale:ACADEMY_VOICE_LOCALE,
  job:'orient', trigger:'surface-entry', autoplay:true,
  text:'Choose the outcome you want to control. Flightglass will connect important inputs and remember the evidence you earn.',
  asset:'assets/audio/academy/control-room-en-us-v1/home/orient.m4a', surfaceId:'home',
  beats:[{ targetId:'home-goal-chooser', atMs:0, emphasis:'outline' }], interruptions:['route','foreground-loss','model-input'], ...overrides
});

function fixture({ mode = 'voice', screenReader = false, asset = true } = {}) {
  let prefs = { mode, seen:{} }; let clock = 10000; const captions = []; const diagnostics = []; const audios = []; const seenCalls = [];
  const createAudio = asset ? () => {
    const listeners = {}; const audio = { currentTime:0, plays:0, pauses:0, play(){ this.plays++; return Promise.resolve(); }, pause(){ this.pauses++; }, addEventListener(type,fn){ listeners[type]=fn; }, finish(){ listeners.ended?.(); } };
    audios.push(audio); return audio;
  } : () => null;
  const controller = createAcademyVoiceController({
    getPreferences:() => structuredClone(prefs),
    setMode:value => { prefs.mode=value; },
    markSeen:(signature,delivery) => { seenCalls.push([signature,delivery]); prefs.seen[signature]={ lastDelivery:delivery }; },
    createAudio, getScreenReaderState:() => screenReader, getForegroundState:() => true, now:() => clock,
    onCaption:value => captions.push(value), onDiagnostic:value => diagnostics.push(value)
  });
  return { controller, get prefs(){ return prefs; }, captions, diagnostics, audios, seenCalls, advance:ms => { clock += ms; } };
}

test('unset requests explicit choice and Off stays silent', () => {
  const unset = fixture({ mode:'unset' });
  assert.equal(unset.controller.deliverAutomatic(makeCue()).reason, 'preference-unset');
  assert.equal(unset.audios.length, 0);
  unset.controller.setVoiceMode('off');
  assert.equal(unset.controller.deliverAutomatic(makeCue()).reason, 'off');
  assert.equal(unset.captions.length, 0);
});

test('first eligible voice cue plays once with no overlap or stale queue', () => {
  const fx = fixture(); const cue = makeCue();
  assert.equal(fx.controller.deliverAutomatic(cue).played, true);
  assert.equal(fx.controller.deliverAutomatic(makeCue({ cueId:'home.recommend' })).reason, 'busy-discarded');
  assert.equal(fx.audios.length, 1);
  fx.audios[0].finish();
  assert.equal(fx.controller.deliverAutomatic(cue).reason, 'seen');
  const epoch = fx.controller.enterRoute();
  assert.equal(fx.controller.deliverAutomatic(makeCue({ cueId:'home.new' }), { epoch:epoch - 1 }).reason, 'stale-route');
});

test('captions and screen-reader suppression preserve exact text without audio', () => {
  const captions = fixture({ mode:'captions' }); const cue = makeCue();
  assert.equal(captions.controller.deliverAutomatic(cue).reason, 'caption-only');
  assert.equal(captions.captions[0].text, cue.text);
  assert.equal(captions.audios.length, 0);
  const reader = fixture({ screenReader:true });
  assert.equal(reader.controller.deliverAutomatic(cue).reason, 'screen-reader-suppressed');
  assert.equal(reader.audios.length, 0);
});

test('content version is eligible once and Replay never changes automatic history', () => {
  const fx = fixture(); const first = makeCue();
  fx.controller.deliverAutomatic(first); fx.audios[0].finish();
  const calls = fx.seenCalls.length;
  fx.controller.replay();
  assert.equal(fx.seenCalls.length, calls);
  fx.audios.at(-1).finish();
  assert.equal(fx.controller.deliverAutomatic(makeCue({ contentVersion:2 })).played, true);
  assert.notEqual(cueSignature(first), cueSignature(makeCue({ contentVersion:2 })));
});

test('model input, route and Voice Off stop the single audio instance', () => {
  const fx = fixture(); fx.controller.deliverAutomatic(makeCue());
  fx.controller.stop('model-input'); assert.equal(fx.audios[0].pauses, 1);
  fx.controller.replay(); fx.controller.setVoiceMode('off');
  assert.equal(fx.audios[1].pauses, 1); assert.equal(fx.prefs.mode, 'off');
});

test('missing local audio remains caption-ready and marks the signature once', () => {
  const fx = fixture({ asset:false });
  const result = fx.controller.deliverAutomatic(makeCue({ asset:null }));
  assert.equal(result.reason, 'asset-unavailable');
  assert.equal(fx.captions.length, 1);
  assert.equal(fx.seenCalls.length, 1);
});
