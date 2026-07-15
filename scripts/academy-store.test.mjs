import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACADEMY_STORE_KEY, createAcademySeed, migrateOutcomeAcademy, acceptExperienceAttempt,
  createAcademyStorage, normalizeVoicePreferences, setVoiceMode, markVoiceCueSeen
} from '../academy-store.js';

const NOW = '2026-07-15T10:00:00.000Z';

test('fresh outcome migration is additive and idempotent', () => {
  const source = { version:1, xp:77, lessons:{ carry:{ read:true, futureLessonField:'keep' }, 'future-concept':{ completed:true } }, unlocked:['carry'], badges:['first-light'], futureTopLevel:{ keep:true } };
  const original = structuredClone(source);
  const once = migrateOutcomeAcademy(source, { now:NOW });
  const twice = migrateOutcomeAcademy(once, { now:'2026-07-16T10:00:00.000Z' });
  assert.deepEqual(source, original);
  assert.equal(once.xp, 77);
  assert.deepEqual(once.badges, ['first-light']);
  assert.deepEqual(once.unlocked, ['carry']);
  assert.deepEqual(once.lessons['future-concept'], { completed:true });
  assert.deepEqual(once.futureTopLevel, { keep:true });
  assert.equal(once.experiences.carry.status, 'practiced');
  assert.equal(once.experiences.carry.reviewEligible, false);
  assert.deepEqual(twice, once);
});

test('completed merged concepts become review eligible but never mastered', () => {
  const seed = createAcademySeed();
  for (const id of ['club-speed','smash','ball-speed']) seed.lessons[id].completed = true;
  const next = migrateOutcomeAcademy(seed, { now:NOW });
  assert.equal(next.experiences['speed-transfer'].status, 'practiced');
  assert.equal(next.experiences['speed-transfer'].reviewEligible, true);
  assert.equal(next.experiences['speed-transfer'].evidence.liveTransferPassed, false);
});

test('Shape legacy aliases migrate additively to Practiced and only both enable review', () => {
  const one = createAcademySeed(); one.lessons['spin-axis'].completed = true;
  const oneNext = migrateOutcomeAcademy(one, { now:NOW });
  assert.equal(oneNext.experiences.shape.status, 'practiced');assert.equal(oneNext.experiences.shape.reviewEligible, false);assert.deepEqual(oneNext.experiences.shape.legacyEvidence, ['spin-axis']);
  const both = createAcademySeed(); both.lessons['spin-axis'].completed = true;both.lessons.curve.completed = true;
  const bothNext = migrateOutcomeAcademy(both, { now:NOW });
  assert.equal(bothNext.experiences.shape.status, 'practiced');assert.equal(bothNext.experiences.shape.reviewEligible, true);assert.equal(bothNext.experiences.shape.acceptedAttemptId, null);
});

test('legacy Offline completion becomes reviewable Carry Side without mastery or reward', () => {
  const seed=createAcademySeed();seed.lessons.offline.completed=true;
  const next=migrateOutcomeAcademy(seed,{now:NOW});const experience=next.experiences['shot-pattern'];
  assert.equal(experience.status,'practiced');assert.equal(experience.reviewEligible,true);assert.deepEqual(experience.legacyEvidence,['offline']);assert.equal(experience.acceptedAttemptId,null);assert.equal(next.xp,0);
});

test('legacy Attack Angle completion becomes reviewable without silent mastery or reward', () => {
  const seed=createAcademySeed();seed.lessons['attack-angle'].completed=true;seed.lessons['attack-angle'].quizBestCorrect=5;
  const next=migrateOutcomeAcademy(seed,{now:NOW});const experience=next.experiences['attack-at-impact'];
  assert.equal(experience.status,'practiced');assert.equal(experience.reviewEligible,true);assert.deepEqual(experience.legacyEvidence,['attack-angle']);assert.equal(experience.acceptedAttemptId,null);assert.equal(experience.evidence.liveTransferPassed,false);assert.equal(next.xp,0);
});

test('accepted native Backspin is grandfathered once with a zero-value reward guard', () => {
  const seed = createAcademySeed();
  seed.xp = 420;
  seed.lessons.backspin = { ...seed.lessons.backspin, mastered:true, completed:true, completedAt:'2026-07-13T09:00:00Z' };
  const next = migrateOutcomeAcademy(seed, { now:NOW });
  assert.equal(next.experiences.backspin.status, 'mastered');
  assert.equal(next.experiences.backspin.acceptedAttemptId, 'legacy:backspin:native-v1');
  assert.equal(next.rewardLedger['legacy:backspin:native-v1'].xpAwarded, 0);
  assert.equal(next.xp, 420);
});

test('mastery requires 4/5 plus live transfer and rewards only once', () => {
  const seed = createAcademySeed();
  const base = { attemptId:'attempt-a', experienceId:'start-line', contentVersion:1, knowledgeTotal:5, liveTransferEvidence:{ fixtureIds:['a'] } };
  assert.equal(acceptExperienceAttempt(seed, { ...base, knowledgeCorrect:3, liveTransferPassed:true }, { now:NOW }).reason, 'knowledge-gate');
  assert.equal(acceptExperienceAttempt(seed, { ...base, knowledgeCorrect:4, liveTransferPassed:false }, { now:NOW }).reason, 'live-gate');
  const accepted = acceptExperienceAttempt(seed, { ...base, knowledgeCorrect:4, liveTransferPassed:true }, { now:NOW });
  assert.equal(accepted.accepted, true);
  assert.equal(accepted.xpAwarded, 120);
  assert.equal(accepted.store.experiences['start-line'].status, 'mastered');
  const duplicate = acceptExperienceAttempt(accepted.store, { ...base, knowledgeCorrect:5, liveTransferPassed:true }, { now:NOW });
  assert.equal(duplicate.reason, 'duplicate');
  assert.equal(duplicate.xpAwarded, 0);
  assert.equal(duplicate.store.xp, 120);
});

test('stale and optional mastery submissions are rejected', () => {
  const seed = createAcademySeed();
  const attempt = { attemptId:'x', knowledgeCorrect:5, knowledgeTotal:5, liveTransferPassed:true, liveTransferEvidence:{ fixtureIds:['a'] } };
  assert.equal(acceptExperienceAttempt(seed, { ...attempt, experienceId:'backspin', contentVersion:1 }, { now:NOW }).reason, 'stale-content');
  assert.equal(acceptExperienceAttempt(seed, { ...attempt, experienceId:'plane-coupling-lab', contentVersion:1 }, { now:NOW }).reason, 'invalid');
});

test('corrupt storage is recoverable and is not overwritten during load', () => {
  const writes = [];
  const storage = { getItem:key => key === ACADEMY_STORE_KEY ? '{broken' : null, setItem:(key,value) => writes.push([key,value]) };
  const adapter = createAcademyStorage({ storage, now:() => NOW });
  const loaded = adapter.load();
  assert.equal(loaded.diagnostic.code, 'invalid-json');
  assert.equal(writes.length, 0);
  const saved = adapter.save({ ...loaded.state, xp:10 });
  assert.equal(saved.ok, true);
  assert.equal(writes.length, 1);
});

test('voice migration preserves unknowns, explicit consent and repetition history', () => {
  assert.equal(normalizeVoicePreferences({ voiceEnabled:false }).mode, 'off');
  assert.equal(normalizeVoicePreferences({ voiceEnabled:true, captionsEnabled:true }).mode, 'voice');
  const invalid = normalizeVoicePreferences({ mode:'robot', future:{ keep:true } });
  assert.equal(invalid.mode, 'unset');
  assert.equal(invalid.unrecognizedMode, 'robot');
  assert.deepEqual(invalid.future, { keep:true });
  const selected = setVoiceMode(createAcademySeed(), 'captions', { now:NOW });
  const seen = markVoiceCueSeen(selected, 'pack:en-US:home-orient:1', 'caption-only', { now:NOW });
  assert.equal(seen.preferences.voice.mode, 'captions');
  assert.equal(seen.preferences.voice.seen['pack:en-US:home-orient:1'].lastDelivery, 'caption-only');
});
