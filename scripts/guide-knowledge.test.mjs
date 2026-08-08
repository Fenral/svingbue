import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GUIDE_TOPICS,
  GUIDE_QUESTIONS,
  getGuideTopic,
  getGuideQuestion,
  listGuideQuestions,
  evaluateGuideCapability,
} from '../guide-knowledge.js';

const TOPIC_IDS = new Set(['direction', 'impact', 'launch-spin', 'distance', 'conditions', 'model-limits']);
const GAP_CLASSES = new Set(['answer-now', 'bounded-model', 'external-data', 'reject-false-precision']);
const TRUTH_TIERS = new Set(['engine-calculated', 'engine-derived', 'geometry-calculated', 'heuristic-estimate', 'external-reference', 'instructional-target', 'unsupported']);

test('Guide has six stable topics and at least twenty concrete golfer questions', () => {
  assert.deepEqual(new Set(GUIDE_TOPICS.map(topic => topic.id)), TOPIC_IDS);
  assert.ok(GUIDE_QUESTIONS.length >= 20);
  assert.equal(new Set(GUIDE_QUESTIONS.map(question => question.id)).size, GUIDE_QUESTIONS.length, 'question ids must be unique');
});

test('Every Guide question has a complete deterministic answer contract', () => {
  for (const question of GUIDE_QUESTIONS) {
    assert.ok(TOPIC_IDS.has(question.topicId), `${question.id} has a known topic`);
    assert.ok(question.prompt.length >= 8, `${question.id} has a concrete prompt`);
    assert.ok(Array.isArray(question.tags) && question.tags.length >= 2, `${question.id} has search-like tags`);
    assert.ok(question.shortAnswer.length >= 18, `${question.id} has a concise answer`);
    assert.ok(Array.isArray(question.bullets) && question.bullets.length >= 2 && question.bullets.length <= 3, `${question.id} has 2–3 evidence bullets`);
    assert.ok(TRUTH_TIERS.has(question.truthTier), `${question.id} declares a truth tier`);
    assert.ok(question.boundary.length >= 18, `${question.id} declares its model boundary`);
    assert.ok(question.nextAction.length >= 4, `${question.id} offers one next action`);
    assert.ok(Array.isArray(question.metricIds) && question.metricIds.length >= 1, `${question.id} names applicable metrics`);
    assert.ok(GAP_CLASSES.has(question.gapClass), `${question.id} classifies capability`);
  }
});

test('Guide explicitly represents every capability outcome', () => {
  const represented = new Set(GUIDE_QUESTIONS.map(question => question.gapClass));
  assert.deepEqual(represented, GAP_CLASSES);
});

test('Live labs exist only for answers that the current engine can support', () => {
  for (const question of GUIDE_QUESTIONS) {
    if (!question.lab) continue;
    assert.equal(question.gapClass, 'answer-now', `${question.id} cannot offer an unsupported lab`);
    assert.ok(Array.isArray(question.lab.inputIds) && question.lab.inputIds.length >= 1, `${question.id} lab has live inputs`);
    assert.ok(Array.isArray(question.lab.outputIds) && question.lab.outputIds.length >= 1, `${question.id} lab has live outputs`);
  }
});

test('Guide copy does not promise free text, personal diagnosis, or an optimization claim', () => {
  const visibleCopy = GUIDE_QUESTIONS.flatMap(question => [question.prompt, question.shortAnswer, ...question.bullets, question.boundary, question.nextAction, ...question.tags]).join(' ').toLowerCase();
  for (const forbidden of ['free text', 'type your question', 'diagnose your swing', 'personal diagnosis', 'optimal spin', 'best spin for you', 'guaranteed']) {
    assert.equal(visibleCopy.includes(forbidden), false, `forbidden claim: ${forbidden}`);
  }
});

test('Topic, question, filter and capability utilities are safe and deterministic', () => {
  assert.equal(getGuideTopic('direction')?.title, 'Direction');
  assert.equal(getGuideTopic('unknown'), null);
  assert.equal(getGuideQuestion('curve-right')?.topicId, 'direction');
  assert.equal(getGuideQuestion('unknown'), null);
  assert.ok(listGuideQuestions({ topicId: 'impact' }).every(question => question.topicId === 'impact'));
  assert.deepEqual(listGuideQuestions({ topicId: 'unknown' }), []);
  assert.equal(evaluateGuideCapability('curve-right').status, 'answer-now');
  assert.equal(evaluateGuideCapability('gear-effect').status, 'bounded-model');
  assert.equal(evaluateGuideCapability('personal-club-fit').status, 'external-data');
  assert.equal(evaluateGuideCapability('body-fault').status, 'reject-false-precision');
  assert.equal(evaluateGuideCapability('unknown').status, 'unknown');
});
