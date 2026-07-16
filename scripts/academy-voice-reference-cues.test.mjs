import test from 'node:test';
import assert from 'node:assert/strict';
import { ACADEMY_BACKSPIN_CUES, ACADEMY_HOME_CUES } from '../academy-voice-reference-cues.js';
import { countCueWords, validateAcademyCueSet } from '../academy-voice-manifest.js';

test('Home owns exactly three invariant approved semantic cues',()=>{
  assert.equal(ACADEMY_HOME_CUES.cues.length,3);assert.equal(validateAcademyCueSet(ACADEMY_HOME_CUES).valid,true);
  assert.ok(ACADEMY_HOME_CUES.cues.every(cue=>countCueWords(cue.text)>=12&&countCueWords(cue.text)<=24));
  assert.ok(ACADEMY_HOME_CUES.cues.every(cue=>!/[<>]/.test(cue.text)));
  assert.equal(ACADEMY_HOME_CUES.cues.find(cue=>cue.cueId.includes('recommendation')).text,'Your next experiment is ready. The recommendation follows from the evidence you have already earned.');
});

test('Backspin reference owns the eight approved amendment cues without dynamic claims',()=>{
  assert.equal(ACADEMY_BACKSPIN_CUES.cues.length,8);assert.equal(validateAcademyCueSet(ACADEMY_BACKSPIN_CUES).valid,true);
  assert.ok(ACADEMY_BACKSPIN_CUES.cues.every(cue=>countCueWords(cue.text)>=12&&countCueWords(cue.text)<=24));
  assert.match(ACADEMY_BACKSPIN_CUES.cues.find(cue=>cue.cueId.endsWith('s4.entry')).text,/both gates/i);
  assert.doesNotMatch(ACADEMY_BACKSPIN_CUES.cues.find(cue=>cue.cueId.endsWith('s4.entry')).text,/caused|stopping/i);
});
