import { ACADEMY_EXPERIENCES, ACADEMY_GOALS, CORE_EXPERIENCE_IDS, experienceById } from './academy-curriculum.js';

const REASONS = Object.freeze({
  continue:'Continue from your latest saved surface',
  repair:'Knowledge is ready; live transfer still needs evidence',
  review:'Earlier lesson evidence is ready for a short review',
  start:'Ready to begin',
  prerequisite:'This builds the evidence needed for your selected goal',
  explore:'All 13 core experiences are mastered'
});

const mastered = (store, id) => store?.experiences?.[id]?.status === 'mastered';
const goalFor = store => ACADEMY_GOALS.find(goal => goal.id === store?.academyHome?.goalId) || null;
const orderFor = store => goalFor(store)?.experienceIds || ACADEMY_EXPERIENCES.filter(item => item.core).map(item => item.id);
const indexOf = (order, id) => { const index = order.indexOf(id); return index < 0 ? Number.MAX_SAFE_INTEGER : index; };
const visited = value => {
  const stamp = Date.parse(value || '');
  return Number.isFinite(stamp) ? stamp : 0;
};

export function canEnterMastery(experienceId, store) {
  const experience = experienceById(experienceId);
  if (!experience) return { allowed:false, missingPrerequisiteIds:[], placementAvailable:false };
  const acceptedBackspinBypass = experienceId === 'flight-height-descent' && mastered(store, 'backspin');
  const missingPrerequisiteIds = experience.prerequisiteExperienceIds.filter(id =>
    !mastered(store, id) && !(acceptedBackspinBypass && id === 'delivered-loft-launch'));
  const placementPassed = Boolean(store?.experiences?.[experienceId]?.placementPassed);
  return { allowed:missingPrerequisiteIds.length === 0 || placementPassed, missingPrerequisiteIds, placementAvailable:missingPrerequisiteIds.length > 0 && !placementPassed };
}

function action(kind, experience, reasonCode = kind, surface) {
  const labelPrefix = { continue:'Continue', repair:'Repair', review:'Review', start:'Start' }[kind];
  return {
    kind, experienceId:experience.id, title:experience.title,
    label:kind === 'start' ? `Start with ${experience.title}` : `${labelPrefix} ${experience.title}`,
    reason:REASONS[reasonCode], reasonCode,
    route:`#/experience/${experience.id}/surface/${Number.isInteger(surface) ? surface : kind === 'review' || kind === 'repair' ? 4 : 0}`
  };
}

function earliestMissingPrerequisite(experienceId, store, seen = new Set()) {
  if (seen.has(experienceId)) return null;
  seen.add(experienceId);
  const experience = experienceById(experienceId);
  for (const dependency of experience?.prerequisiteExperienceIds || []) {
    if (mastered(store, dependency)) continue;
    return earliestMissingPrerequisite(dependency, store, seen) || experienceById(dependency);
  }
  return null;
}

export function selectAcademyAction(store) {
  if (CORE_EXPERIENCE_IDS.every(id => mastered(store, id))) return { kind:'explore', experienceId:null, label:'Explore the physics', reason:REASONS.explore, reasonCode:'explore', route:'#/explore' };
  const order = orderFor(store);
  const goal = goalFor(store);
  const flightHeight = experienceById('flight-height-descent');
  if ((!goal || goal.id === 'launch-flight') && store?.lastOpened === 'backspin' && mastered(store, 'backspin')
      && !mastered(store, 'flight-height-descent') && canEnterMastery('flight-height-descent', store).allowed) {
    return action('start', flightHeight);
  }
  const partials = order.map(id => experienceById(id)).filter(Boolean).filter(item => {
    const state = store?.experiences?.[item.id];
    if (state?.status !== 'practiced') return false;
    const total = state.evidence?.knowledgeTotal || 5;
    return !(state.evidence?.knowledgeBestCorrect / total >= 0.8 && !state.evidence?.liveTransferPassed);
  }).sort((a,b) => visited(store.experiences[b.id].lastVisitedAt) - visited(store.experiences[a.id].lastVisitedAt) || indexOf(order,a.id) - indexOf(order,b.id));
  if (partials[0]) return action('continue', partials[0], 'continue', store.experiences[partials[0].id].surface);
  const repairs = order.map(id => experienceById(id)).filter(Boolean).filter(item => {
    const state = store?.experiences?.[item.id];
    const total = state?.evidence?.knowledgeTotal || 5;
    return state?.status !== 'mastered' && state?.evidence?.knowledgeBestCorrect / total >= 0.8 && !state?.evidence?.liveTransferPassed;
  }).sort((a,b) => visited(store.experiences[b.id].lastVisitedAt) - visited(store.experiences[a.id].lastVisitedAt) || indexOf(order,a.id) - indexOf(order,b.id));
  if (repairs[0]) return action('repair', repairs[0]);
  const review = order.map(id => experienceById(id)).find(item => item && store?.experiences?.[item.id]?.reviewEligible && canEnterMastery(item.id, store).allowed && !mastered(store,item.id));
  if (review) return action('review', review);
  for (const id of order) {
    const item = experienceById(id);
    if (!item || mastered(store,id)) continue;
    if (canEnterMastery(id, store).allowed) return action('start', item);
    const prerequisite = earliestMissingPrerequisite(id, store);
    if (prerequisite) return action('start', prerequisite, 'prerequisite');
  }
  const root = ACADEMY_EXPERIENCES.find(item => item.core && !item.prerequisiteExperienceIds.length && !mastered(store,item.id));
  return root ? action('start', root) : { kind:'explore', experienceId:null, label:'Explore the physics', reason:REASONS.explore, reasonCode:'explore', route:'#/explore' };
}
