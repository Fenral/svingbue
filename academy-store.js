import {
  ACADEMY_EXPERIENCES, ACADEMY_MASTERY_XP, CONCEPT_OWNER, experienceById
} from './academy-curriculum.js';

export const ACADEMY_STORE_KEY = 'strikearc.academy.v1';
const VOICE_MODES = new Set(['unset','voice','captions','off']);
const iso = value => typeof value === 'string' || Number.isFinite(value) ? value : null;
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const array = value => Array.isArray(value) ? [...value] : [];
const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const unique = values => [...new Set(values)];

function legacyLessonSeed() {
  return { read:false, quizBest:0, quizAttempts:0, perfect:false, completed:false, completedAt:null, diagramTouched:false, quizBestCorrect:0, quizLen:0, mastered:false };
}

export function normalizeVoicePreferences(raw = {}) {
  const source = object(raw) ? raw : {};
  const legacyMode = source.voiceEnabled === false
    ? 'off'
    : source.voiceEnabled === true && source.captionsEnabled !== false ? 'voice' : 'unset';
  const mode = VOICE_MODES.has(source.mode) ? source.mode : legacyMode;
  const volume = Number.isFinite(source.volume) ? Math.min(1, Math.max(0, source.volume)) : 1;
  return {
    ...clone(source),
    ...(source.mode !== undefined && !VOICE_MODES.has(source.mode) ? { unrecognizedMode:source.mode } : {}),
    mode,
    packId:typeof source.packId === 'string' && source.packId ? source.packId : 'control-room-en-us-v1',
    locale:typeof source.locale === 'string' && source.locale ? source.locale : 'en-US',
    volume,
    seen:object(source.seen) ? clone(source.seen) : {},
    updatedAt:iso(source.updatedAt)
  };
}

function freshEvidence(raw = {}) {
  const source = object(raw) ? raw : {};
  return {
    ...clone(source),
    surfacesSeen:unique(array(source.surfacesSeen).filter(Number.isInteger).filter(value => value >= 0 && value <= 5)),
    instrumentTouched:Boolean(source.instrumentTouched),
    mythsResolved:unique(array(source.mythsResolved).filter(value => typeof value === 'string' || Number.isInteger(value))),
    knowledgeBestCorrect:Number.isInteger(source.knowledgeBestCorrect) && source.knowledgeBestCorrect >= 0 ? source.knowledgeBestCorrect : 0,
    knowledgeTotal:Number.isInteger(source.knowledgeTotal) && source.knowledgeTotal > 0 ? source.knowledgeTotal : 5,
    liveTransferPassed:Boolean(source.liveTransferPassed),
    liveTransferEvidence:object(source.liveTransferEvidence) ? clone(source.liveTransferEvidence) : null
  };
}

function experienceSeed(definition) {
  return {
    schemaVersion:1,
    contentVersion:definition.contentVersion,
    status:'not-started',
    surface:0,
    unlockedSurfaces:[0],
    startedAt:null,
    lastVisitedAt:null,
    masteredAt:null,
    reviewEligible:false,
    placementPassed:false,
    legacyEvidence:[],
    evidence:freshEvidence(),
    activeAttempt:null,
    acceptedAttemptId:null
  };
}

export function createAcademySeed() {
  const lessons = {};
  for (const conceptId of Object.keys(CONCEPT_OWNER)) lessons[conceptId] = legacyLessonSeed();
  return {
    version:1, xp:0, lessons, unlocked:[], badges:[], lastOpened:null,
    academySchemaVersion:1,
    experiences:Object.fromEntries(ACADEMY_EXPERIENCES.map(item => [item.id, experienceSeed(item)])),
    rewardLedger:{},
    academyHome:{ goalId:null, exploreExpanded:false, lastExperienceId:null },
    preferences:{ voice:normalizeVoicePreferences() },
    migration:{ academyOutcomeV1Applied:false, appliedAt:null, diagnostics:[] }
  };
}

function meaningfulLesson(lesson) {
  return Boolean(lesson && (lesson.read || lesson.diagramTouched || lesson.completed || lesson.mastered
    || Number(lesson.quizAttempts) > 0 || Number(lesson.quizBest) > 0 || Number(lesson.quizBestCorrect) > 0));
}

function legitimateBackspinMastery(lesson) {
  return Boolean(lesson?.mastered === true || lesson?.journey?.lastSubmission?.accepted === true
    || lesson?.journey?.lastSubmission?.result === 'accepted');
}

export function deriveExperienceStatus(experience) {
  const evidence = freshEvidence(experience?.evidence);
  const total = evidence.knowledgeTotal;
  const knowledgePassed = total > 0 && evidence.knowledgeBestCorrect / total >= 0.8;
  if (experience?.acceptedAttemptId && evidence.liveTransferPassed && (knowledgePassed || String(experience.acceptedAttemptId).startsWith('legacy:backspin:'))) return 'mastered';
  if (experience?.startedAt || experience?.lastVisitedAt || experience?.activeAttempt || experience?.reviewEligible
    || array(experience?.legacyEvidence).length || evidence.surfacesSeen.length || evidence.instrumentTouched
    || evidence.mythsResolved.length || evidence.knowledgeBestCorrect > 0 || evidence.liveTransferPassed) return 'practiced';
  return 'not-started';
}

function normalizeExperience(raw, definition, lessons, now, ledger) {
  const source = object(raw) ? raw : {};
  const base = experienceSeed(definition);
  const legacyEvidence = unique([
    ...array(source.legacyEvidence).filter(value => definition.conceptIds.includes(value)),
    ...definition.conceptIds.filter(id => meaningfulLesson(lessons[id]))
  ]);
  const allLegacyComplete = definition.conceptIds.every(id => lessons[id]?.completed === true || lessons[id]?.mastered === true);
  const evidence = freshEvidence(source.evidence);
  let acceptedAttemptId = typeof source.acceptedAttemptId === 'string' ? source.acceptedAttemptId : null;
  let masteredAt = iso(source.masteredAt);
  if (definition.id === 'backspin' && legitimateBackspinMastery(lessons.backspin)) {
    acceptedAttemptId ||= 'legacy:backspin:native-v1';
    evidence.liveTransferPassed = true;
    evidence.liveTransferEvidence ||= { kind:'grandfathered-backspin-v1', source:'lessons.backspin', migratedAt:now };
    masteredAt ||= lessons.backspin.completedAt || now;
    ledger['legacy:backspin:native-v1'] ||= { experienceId:'backspin', xpAwarded:0, reason:'historical reward already reflected in store.xp' };
  }
  const next = {
    ...base, ...clone(source), schemaVersion:1, contentVersion:definition.contentVersion,
    surface:Number.isInteger(source.surface) ? Math.min(5, Math.max(0, source.surface)) : 0,
    unlockedSurfaces:unique([0, ...array(source.unlockedSurfaces).filter(Number.isInteger).filter(value => value >= 0 && value <= 5)]).sort((a,b) => a-b),
    startedAt:iso(source.startedAt), lastVisitedAt:iso(source.lastVisitedAt), masteredAt,
    reviewEligible:Boolean(source.reviewEligible || allLegacyComplete),
    placementPassed:Boolean(source.placementPassed), legacyEvidence, evidence,
    activeAttempt:object(source.activeAttempt) ? clone(source.activeAttempt) : null,
    acceptedAttemptId
  };
  if (definition.optional) {
    next.acceptedAttemptId = null;
    next.masteredAt = null;
  }
  next.status = deriveExperienceStatus(next);
  return next;
}

export function normalizeAcademyStore(raw, { now = new Date().toISOString(), migrate = true } = {}) {
  const base = createAcademySeed();
  const source = object(raw) ? clone(raw) : {};
  const lessons = { ...base.lessons, ...(object(source.lessons) ? source.lessons : {}) };
  const rewardLedger = object(source.rewardLedger) ? clone(source.rewardLedger) : {};
  const existingExperiences = object(source.experiences) ? source.experiences : {};
  const experiences = Object.fromEntries(ACADEMY_EXPERIENCES.map(definition => [
    definition.id, normalizeExperience(existingExperiences[definition.id], definition, lessons, now, rewardLedger)
  ]));
  const home = object(source.academyHome) ? source.academyHome : {};
  const preferences = object(source.preferences) ? source.preferences : {};
  const migration = object(source.migration) ? source.migration : {};
  return {
    ...base, ...source,
    version:1,
    xp:Number.isFinite(source.xp) ? source.xp : 0,
    lessons,
    unlocked:array(source.unlocked),
    badges:array(source.badges),
    lastOpened:source.lastOpened ?? null,
    academySchemaVersion:1,
    experiences,
    rewardLedger,
    academyHome:{ ...clone(home), goalId:typeof home.goalId === 'string' ? home.goalId : null, exploreExpanded:Boolean(home.exploreExpanded), lastExperienceId:typeof home.lastExperienceId === 'string' ? home.lastExperienceId : null },
    preferences:{ ...clone(preferences), voice:normalizeVoicePreferences(preferences.voice || source.voice || {}) },
    migration:{ ...clone(migration), academyOutcomeV1Applied:migrate ? true : Boolean(migration.academyOutcomeV1Applied), appliedAt:migrate ? (migration.appliedAt || now) : (migration.appliedAt || null), diagnostics:array(migration.diagnostics) }
  };
}

export function migrateOutcomeAcademy(raw, options) { return normalizeAcademyStore(raw, options); }

function invalidAttempt(submission, definition) {
  return !object(submission) || !definition || definition.optional || typeof submission.attemptId !== 'string' || !submission.attemptId
    || !Number.isInteger(submission.contentVersion) || !Number.isInteger(submission.knowledgeCorrect)
    || !Number.isInteger(submission.knowledgeTotal) || submission.knowledgeTotal <= 0 || submission.knowledgeCorrect < 0
    || submission.knowledgeCorrect > submission.knowledgeTotal || typeof submission.liveTransferPassed !== 'boolean';
}

export function acceptExperienceAttempt(rawStore, submission, { now = new Date().toISOString(), xpAward = ACADEMY_MASTERY_XP } = {}) {
  const store = normalizeAcademyStore(rawStore, { now });
  const definition = experienceById(submission?.experienceId);
  const current = definition ? store.experiences[definition.id] : null;
  const fail = reason => ({ store, accepted:false, duplicate:reason === 'duplicate', reason, xpAwarded:0, experience:current });
  if (invalidAttempt(submission, definition)) return fail('invalid');
  if (submission.contentVersion !== definition.contentVersion) return fail('stale-content');
  if (store.rewardLedger[submission.attemptId] || current.acceptedAttemptId === submission.attemptId) return fail('duplicate');
  if (current.acceptedAttemptId) return fail('duplicate');
  if (submission.knowledgeCorrect / submission.knowledgeTotal < 0.8) return fail('knowledge-gate');
  if (!submission.liveTransferPassed || !object(submission.liveTransferEvidence)) return fail('live-gate');
  const next = clone(store);
  next.rewardLedger[submission.attemptId] = { experienceId:definition.id, xpAwarded:xpAward, acceptedAt:now, contentVersion:definition.contentVersion };
  const target = next.experiences[definition.id];
  target.acceptedAttemptId = submission.attemptId;
  target.masteredAt = now;
  target.activeAttempt = null;
  target.evidence.knowledgeBestCorrect = Math.max(target.evidence.knowledgeBestCorrect, submission.knowledgeCorrect);
  target.evidence.knowledgeTotal = submission.knowledgeTotal;
  target.evidence.liveTransferPassed = true;
  target.evidence.liveTransferEvidence = clone(submission.liveTransferEvidence);
  target.status = 'mastered';
  next.xp += xpAward;
  return { store:next, accepted:true, duplicate:false, reason:'accepted', xpAwarded:xpAward, experience:clone(target) };
}

export function createAcademyStorage({ storage, now = () => new Date().toISOString() } = {}) {
  let state = createAcademySeed();
  let loadDiagnostic = null;
  const load = () => {
    const raw = storage?.getItem?.(ACADEMY_STORE_KEY);
    if (!raw) { state = normalizeAcademyStore(state, { now:now() }); return { state:clone(state), diagnostic:null }; }
    try { state = normalizeAcademyStore(JSON.parse(raw), { now:now() }); loadDiagnostic = null; }
    catch (error) { state = createAcademySeed(); loadDiagnostic = { code:'invalid-json', message:error.message, recoverable:true }; }
    return { state:clone(state), diagnostic:loadDiagnostic };
  };
  const save = next => {
    const normalized = normalizeAcademyStore(next, { now:now() });
    try { storage?.setItem?.(ACADEMY_STORE_KEY, JSON.stringify(normalized)); state = normalized; loadDiagnostic = null; return { ok:true, state:clone(state) }; }
    catch (error) { state = normalized; return { ok:false, state:clone(state), error }; }
  };
  return { load, save, getState:() => clone(state) };
}

export function setVoiceMode(rawStore, mode, { now = new Date().toISOString() } = {}) {
  if (!VOICE_MODES.has(mode) || mode === 'unset') throw new TypeError(`Invalid voice mode: ${mode}`);
  const next = normalizeAcademyStore(rawStore, { now });
  next.preferences.voice = { ...next.preferences.voice, mode, updatedAt:now };
  return next;
}

export function markVoiceCueSeen(rawStore, signature, delivery, { now = new Date().toISOString() } = {}) {
  if (typeof signature !== 'string' || !signature) throw new TypeError('Voice signature is required');
  const next = normalizeAcademyStore(rawStore, { now });
  const prior = next.preferences.voice.seen[signature];
  next.preferences.voice.seen[signature] = { firstSeenAt:prior?.firstSeenAt || now, lastDelivery:delivery, lastSeenAt:now };
  return next;
}
