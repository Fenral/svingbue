import test from 'node:test';
import assert from 'node:assert/strict';
import { START_LINE_CONTENT, START_LINE_CUES } from '../academy-start-line-content.js';
import { validateAcademyCue } from '../academy-voice-manifest.js';

test('Start Line manifest owns exact identity, concepts and six surfaces',()=>{
  assert.equal(START_LINE_CONTENT.experienceId,'start-line');
  assert.equal(START_LINE_CONTENT.title,'Start Line');
  assert.deepEqual(START_LINE_CONTENT.conceptIds,['face-angle','club-path','start-direction']);
  assert.deepEqual(START_LINE_CONTENT.prerequisiteExperienceIds,[]);
  assert.deepEqual(START_LINE_CONTENT.surfaces.map(surface=>surface.id),['mission','lab','influence','myths','mastery','result']);
});

test('content freezes five mastery tasks with varied answer positions and mandatory live transfer',()=>{
  assert.equal(START_LINE_CONTENT.masteryTasks.length,5);
  assert.deepEqual(START_LINE_CONTENT.masteryTasks.slice(0,4).map(task=>task.answerIndex),[2,0,1,3]);
  assert.equal(START_LINE_CONTENT.masteryTasks[4].kind,'live-transfer');
  assert.equal(START_LINE_CONTENT.masteryTasks[4].mandatory,true);
});

test('all required sheets and truth registers are present',()=>{
  assert.deepEqual(Object.keys(START_LINE_CONTENT.sheets),['launch-direction','face-angle','club-path','delivered-loft','model-limits']);
  const tags=new Set(Object.values(START_LINE_CONTENT.sheets).flatMap(sheet=>sheet.tags));
  assert.deepEqual([...tags].sort(),['DEFINITION','HELD','MODEL','NOT MODELED']);
});

test('six local voice cues have stable semantic targets and remain within 12–24 words',()=>{
  assert.equal(START_LINE_CUES.cues.length,6);
  for (const cue of START_LINE_CUES.cues) {
    assert.equal(validateAcademyCue(cue).valid,true);
    const words=cue.text.trim().split(/\s+/).length;
    assert.ok(words>=12 && words<=24,`${cue.cueId}: ${words}`);
    assert.ok(cue.beats.length>=1);
    assert.equal(cue.asset,null);
  }
});

test('learner copy avoids fixed-law, technique and downstream-outcome claims',()=>{
  const visible=JSON.stringify({surfaces:START_LINE_CONTENT.surfaces,sheets:START_LINE_CONTENT.sheets,mastery:START_LINE_CONTENT.masteryTasks});
  for (const forbidden of [/fix the face first/i,/blame the face/i,/universal 75\/25/i,/85\/15 rule/i,/driver case/i,/wedge case/i,/shot pattern/i,/dispersion/i]) {
    assert.doesNotMatch(visible,forbidden);
  }
  assert.doesNotMatch(START_LINE_CONTENT.surfaces.map(surface=>surface.title).join(' '),/Start Direction/i);
});
