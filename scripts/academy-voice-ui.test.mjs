import test from 'node:test';
import assert from 'node:assert/strict';
import { buildVoiceUiViewModel } from '../academy-voice-ui.js';

test('voice UI exposes visible mode labels and exact persistent captions', () => {
  assert.equal(buildVoiceUiViewModel({},'unset').preferenceRequired,true);
  assert.equal(buildVoiceUiViewModel({},'voice').controlLabel,'Voice on');
  assert.equal(buildVoiceUiViewModel({},'captions').controlLabel,'Captions only');
  assert.equal(buildVoiceUiViewModel({},'off').controlLabel,'Voice off');
  const vm=buildVoiceUiViewModel({caption:'Exact approved cue.',replayAvailable:true,status:'caption'},'captions');
  assert.equal(vm.showCaption,true); assert.equal(vm.replayLabel,'Show cue'); assert.equal(vm.caption,'Exact approved cue.');
});

test('missing assets keep the caption and explain disabled Replay',()=>{
  const vm=buildVoiceUiViewModel({caption:'Still visible.',replayAvailable:false,reason:'asset-unavailable'},'voice');
  assert.equal(vm.caption,'Still visible.');assert.equal(vm.replayDisabledReason,'Audio unavailable');
});
