import test from 'node:test';
import assert from 'node:assert/strict';
import { ACADEMY_VOICE_LOCALE, ACADEMY_VOICE_PACK_ID, countCueWords, cueSignature, defineAcademyCue, defineAcademyCueSet, validateAcademyCue } from '../academy-voice-manifest.js';

const cue = overrides => ({
  cueId:'start-line.s1.entry', contentVersion:1, packId:ACADEMY_VOICE_PACK_ID, locale:ACADEMY_VOICE_LOCALE,
  job:'cue', trigger:'surface-entry', autoplay:true,
  text:'Move the face to plus two. Watch the launch ray settle between face and path.',
  asset:'assets/audio/academy/control-room-en-us-v1/start-line/s1-entry.m4a',
  surfaceId:'start-line-s1', beats:[{ targetId:'face-control', atMs:0, emphasis:'outline' }],
  interruptions:['route','foreground-loss','model-input'], ...overrides
});

test('semantic cue validation freezes stable plain-data signatures', () => {
  const frozen = defineAcademyCue(cue());
  assert.equal(Object.isFrozen(frozen), true);
  assert.equal(countCueWords(frozen.text), 15);
  assert.equal(cueSignature(frozen), 'control-room-en-us-v1:en-US:start-line.s1.entry:1');
  assert.equal(validateAcademyCue(frozen).valid, true);
});

test('manifest rejects remote assets, selectors, bad budgets and runtime generation', () => {
  assert.throws(() => validateAcademyCue(cue({ asset:'https://provider.test/a.m4a' })), /local-asset/);
  assert.throws(() => validateAcademyCue(cue({ beats:[{ targetId:'#face', atMs:0, emphasis:'outline' }] })), /semantic-target/);
  assert.throws(() => validateAcademyCue(cue({ text:'Too short for this controlled cue.' })), /word-budget/);
  assert.throws(() => validateAcademyCue(cue({ provider:'runtime' })), /forbidden-field/);
  assert.throws(() => validateAcademyCue(cue({ job:'recovery', trigger:'recovery-offer', autoplay:true })), /recovery-autoplay/);
});

test('cue sets enforce eight signatures and one automatic entry per surface', () => {
  assert.throws(() => defineAcademyCueSet({ ownerId:'x', cues:[cue(), cue({ cueId:'start-line.s1.other' })] }), /duplicate-surface-entry/);
  assert.throws(() => defineAcademyCueSet({ ownerId:'x', cues:Array.from({ length:9 }, (_,i) => cue({ cueId:`cue.${i}`, surfaceId:`surface-${i}` })) }), /exceeds 8/);
});
