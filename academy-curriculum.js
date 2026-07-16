const freezeRecord = value => Object.freeze({
  ...value,
  conceptIds:Object.freeze([...(value.conceptIds || [])]),
  prerequisiteExperienceIds:Object.freeze([...(value.prerequisiteExperienceIds || [])]),
  recommendedContextIds:Object.freeze([...(value.recommendedContextIds || [])])
});

export const ACADEMY_FAMILIES = Object.freeze([
  { id:'direction', title:'Direction' },
  { id:'strike', title:'Strike' },
  { id:'flight', title:'Flight' },
  { id:'distance', title:'Distance' },
  { id:'conditions', title:'Conditions' },
  { id:'model-labs', title:'Advanced model labs' }
].map(Object.freeze));

export const ACADEMY_EXPERIENCES = Object.freeze([
  ['start-line','Start Line','direction',['face-angle','club-path','start-direction'],[],true,'start-line',1],
  ['shape','Shape','direction',['spin-axis','curve'],['start-line'],true,'shape',1],
  ['shot-pattern','Carry Side','direction',['offline'],['start-line','shape'],true,'shot-pattern',1],
  ['attack-at-impact','Up or Down at Impact','strike',['attack-angle'],[],true,'attack-at-impact',1],
  ['low-point','Low Point','strike',['low-point'],['attack-at-impact'],true,'low-point',1],
  ['strike-depth','Contact Height','strike',['strike-depth'],['low-point'],true,'strike-depth',1],
  ['delivered-loft-launch','Delivered Loft & Launch','flight',['dynamic-loft','launch-angle'],['attack-at-impact'],true,'delivered-loft-launch',1],
  ['backspin','Backspin','flight',['spin-loft','backspin'],['delivered-loft-launch','attack-at-impact'],true,'backspin-native',2],
  ['flight-height-descent','Flight Height & Descent','flight',['apex','landing-angle'],['delivered-loft-launch','backspin'],true,'flight-height-descent',1],
  ['speed-transfer','Speed Transfer','distance',['club-speed','smash','ball-speed'],[],true,'speed-transfer',1],
  ['carry','Carry','distance',['carry','total'],['speed-transfer'],true,'carry',1],
  ['air-density','Air Density','conditions',['altitude','temperature'],['carry'],true,'air-density',1],
  ['wind','Wind','conditions',['wind'],['carry','shot-pattern'],true,'wind',1],
  ['plane-coupling-lab','Plane Coupling','model-labs',['plane-coupling'],['low-point','strike-depth'],false,'plane-coupling-lab',1]
].map(([id,title,familyId,conceptIds,prerequisiteExperienceIds,core,rendererKey,contentVersion]) => freezeRecord({
  id,title,familyId,conceptIds,prerequisiteExperienceIds,recommendedContextIds:id === 'plane-coupling-lab' ? ['shape'] : [],
  core,optional:!core,rendererKey,contentVersion
})));

export const ACADEMY_GOALS = Object.freeze([
  { id:'direction-control', title:'Control direction', experienceIds:['start-line','shape','shot-pattern','wind'] },
  { id:'strike-contact', title:'Understand contact', experienceIds:['attack-at-impact','low-point','strike-depth'] },
  { id:'launch-flight', title:'Control launch and flight', experienceIds:['attack-at-impact','delivered-loft-launch','backspin','flight-height-descent'] },
  { id:'distance', title:'Understand distance', experienceIds:['speed-transfer','carry','air-density','wind'] }
].map(goal => Object.freeze({ ...goal, experienceIds:Object.freeze([...goal.experienceIds]) })));

export const CONCEPT_OWNER = Object.freeze(Object.fromEntries(
  ACADEMY_EXPERIENCES.flatMap(experience => experience.conceptIds.map(conceptId => [conceptId, experience.id]))
));

export const CORE_EXPERIENCE_IDS = Object.freeze(ACADEMY_EXPERIENCES.filter(item => item.core).map(item => item.id));
export const ACADEMY_MASTERY_XP = 120;

const EXPERIENCE_MAP = new Map(ACADEMY_EXPERIENCES.map(item => [item.id, item]));

export function experienceById(id) { return EXPERIENCE_MAP.get(id) || null; }
export function ownerForConcept(conceptId) { return CONCEPT_OWNER[conceptId] || null; }
export function prerequisitesFor(experienceId) { return experienceById(experienceId)?.prerequisiteExperienceIds || Object.freeze([]); }

export function validateAcademyCurriculum(experiences = ACADEMY_EXPERIENCES, goals = ACADEMY_GOALS) {
  const errors = [];
  const ids = new Set();
  const renderers = new Set();
  const concepts = new Set();
  for (const item of experiences) {
    if (!item?.id || ids.has(item.id)) errors.push(`duplicate-or-missing-experience:${item?.id || 'unknown'}`);
    ids.add(item?.id);
    if (!item?.rendererKey || renderers.has(item.rendererKey)) errors.push(`duplicate-or-missing-renderer:${item?.rendererKey || item?.id}`);
    renderers.add(item?.rendererKey);
    if (!Number.isInteger(item?.contentVersion) || item.contentVersion < 1) errors.push(`invalid-content-version:${item?.id}`);
    for (const concept of item?.conceptIds || []) {
      if (!concept || concepts.has(concept)) errors.push(`duplicate-or-missing-concept:${concept || item?.id}`);
      concepts.add(concept);
    }
  }
  if (experiences.filter(item => item.core).length !== 13) errors.push('core-count');
  if (experiences.filter(item => item.optional).length !== 1) errors.push('optional-count');
  if (concepts.size !== 24) errors.push('concept-count');
  for (const item of experiences) {
    for (const dependency of [...(item.prerequisiteExperienceIds || []), ...(item.recommendedContextIds || [])]) {
      if (!ids.has(dependency)) errors.push(`unknown-dependency:${item.id}:${dependency}`);
      if (dependency === item.id) errors.push(`self-dependency:${item.id}`);
    }
    if (item.core && (item.prerequisiteExperienceIds || []).some(id => experiences.find(candidate => candidate.id === id)?.optional)) {
      errors.push(`optional-gates-core:${item.id}`);
    }
  }
  const visiting = new Set();
  const visited = new Set();
  const walk = id => {
    if (visiting.has(id)) { errors.push(`cycle:${id}`); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    (experiences.find(item => item.id === id)?.prerequisiteExperienceIds || []).forEach(walk);
    visiting.delete(id); visited.add(id);
  };
  [...ids].forEach(walk);
  for (const goal of goals) {
    if (!goal?.id || !(goal.experienceIds || []).length) errors.push(`invalid-goal:${goal?.id || 'unknown'}`);
    for (const id of goal?.experienceIds || []) if (!ids.has(id)) errors.push(`unknown-goal-experience:${goal.id}:${id}`);
  }
  return { valid:errors.length === 0, errors };
}
