import test from 'node:test';
import assert from 'node:assert/strict';
import { freshLessonJourney, mergeLessonJourney } from '../academy-lesson-journey.js';

test('a legacy lesson receives the complete native journey shape', () => {
  assert.deepEqual(mergeLessonJourney(undefined), {
    surface: 0,
    mission: { built: false, cut: false },
    myths: [false, false, false],
    masteryBest: 0,
    masteryAttempts: 0,
    masteryAttemptId: null,
    lastSubmission: null
  });
});

test('partial progress deep-merges without shared nested state', () => {
  const first = mergeLessonJourney({
    surface: 2,
    mission: { built: true },
    myths: [true]
  });
  const second = freshLessonJourney();

  assert.deepEqual(first.mission, { built: true, cut: false });
  assert.deepEqual(first.myths, [true, false, false]);

  first.mission.cut = true;
  first.myths[1] = true;
  assert.equal(second.mission.cut, false);
  assert.deepEqual(second.myths, [false, false, false]);
});

test('journey counters and surfaces are normalized into their supported ranges', () => {
  const merged = mergeLessonJourney({
    surface: 99,
    masteryBest: 99,
    masteryAttempts: -4
  });

  assert.equal(merged.surface, 5);
  assert.equal(merged.masteryBest, 5);
  assert.equal(merged.masteryAttempts, 0);
});

test('a committed submission survives migration as an idempotency record', () => {
  const summary = {
    correct: 4,
    total: 5,
    mastered: true,
    delta: 80,
    readDelta: 40,
    totalDelta: 120,
    storeXp: 480
  };
  const merged = mergeLessonJourney({
    masteryAttemptId: 'attempt-7',
    lastSubmission: { attemptId: 'attempt-7', summary }
  });

  assert.deepEqual(merged.lastSubmission, { attemptId: 'attempt-7', summary });
  assert.notEqual(merged.lastSubmission.summary, summary);
});

test('invalid idempotency records are discarded during migration', () => {
  assert.equal(mergeLessonJourney({ lastSubmission: { attemptId: '', summary: {} } }).lastSubmission, null);
  assert.equal(mergeLessonJourney({ lastSubmission: { attemptId: 'attempt-1' } }).lastSubmission, null);
});
