import { ACADEMY_EXPERIENCES, ACADEMY_FAMILIES, ACADEMY_GOALS, CORE_EXPERIENCE_IDS } from './academy-curriculum.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const STATUS = Object.freeze({ mastered:'Mastered', practiced:'Practiced', 'not-started':'Not started' });

export function buildAcademyHomeViewModel({ store, recommendation }) {
  const core = CORE_EXPERIENCE_IDS.map(id => store.experiences[id]);
  const mastered = core.filter(item => item?.status === 'mastered').length;
  const practiced = core.filter(item => item?.status === 'practiced').length;
  const cards = ACADEMY_EXPERIENCES.map(definition => {
    const state = store.experiences[definition.id] || {};
    return {
      id:definition.id, title:definition.title, familyId:definition.familyId, core:definition.core, optional:Boolean(definition.optional),
      status:state.status || 'not-started', statusText:STATUS[state.status] || STATUS['not-started'],
      route:`#/experience/${definition.id}`, reviewEligible:Boolean(state.reviewEligible)
    };
  });
  return {
    title:'Learn the shot by outcome',
    intro:'Choose what you want to control. Each experience connects the important inputs to visible flight evidence.',
    recommendation:{ ...recommendation },
    selectedGoalId:store.academyHome?.goalId || null,
    goals:ACADEMY_GOALS.map(goal => ({ ...goal, selected:goal.id === store.academyHome?.goalId })),
    progress:{ mastered, practiced, total:13, label:`${mastered} of 13 core experiences mastered`, practicedLabel:`${practiced} practiced` },
    families:ACADEMY_FAMILIES.filter(family => family.id !== 'model-labs').map(family => ({ ...family, experiences:cards.filter(card => card.familyId === family.id) })),
    optional:cards.find(card => card.optional),
    xp:store.xp,
    badges:[...(store.badges || [])]
  };
}

export function mountAcademyHome({ root, viewModel, callbacks = {}, voiceTargets } = {}) {
  if (!root) throw new TypeError('Academy Home root is required');
  const vm = viewModel;
  root.innerHTML = `<div class="academy-home" data-academy-home>
    <header class="academy-home__strip">
      <a class="sa-strip__home" href="./index.html" aria-label="Flightglass Home"><img src="./assets/flightglass-mark-micro.svg" alt=""></a>
      <span class="academy-home__wordmark">FLIGHTGLASS ACADEMY</span>
      <button type="button" class="academy-home__quiet-action" data-home-progress aria-label="Open Academy progress">${vm.progress.mastered}/13</button>
    </header>
    <section class="academy-home__hero" aria-labelledby="academy-home-title">
      <div class="academy-home__horizon" aria-hidden="true"><span></span><i></i></div>
      <p class="academy-home__kicker">ACADEMY · OUTCOME CONTROL</p>
      <h1 id="academy-home-title">${esc(vm.title)}</h1>
      <p class="academy-home__intro">${esc(vm.intro)}</p>
    </section>
    <div data-academy-voice-slot></div>
    <section class="academy-coach" aria-labelledby="academy-coach-title" data-voice-target="home-primary-action">
      <div class="academy-coach__signal" aria-hidden="true"></div>
      <p class="academy-coach__eyebrow">CONTROL ROOM · NEXT EVIDENCE</p>
      <h2 id="academy-coach-title">${esc(vm.recommendation.label)}</h2>
      <p>${esc(vm.recommendation.reason)}</p>
      <button type="button" class="academy-coach__action" data-home-primary>${esc(vm.recommendation.label)}</button>
    </section>
    <section class="academy-goals" aria-labelledby="academy-goals-title" data-voice-target="home-goal-chooser">
      <div class="academy-section-heading"><div><p class="academy-home__kicker">YOUR TARGET</p><h2 id="academy-goals-title">What do you want to control?</h2></div><p>Change this any time. Progress stays the same.</p></div>
      <div class="academy-goals__options" role="radiogroup" aria-labelledby="academy-goals-title">
        ${vm.goals.map(goal => `<label class="academy-goal"><input type="radio" name="academy-goal" value="${esc(goal.id)}" ${goal.selected ? 'checked' : ''}><span>${esc(goal.title)}</span></label>`).join('')}
      </div>
    </section>
    <section class="academy-progress" aria-labelledby="academy-progress-title" data-voice-target="home-mastery-evidence">
      <div class="academy-progress__copy"><p class="academy-home__kicker">EVIDENCE</p><h2 id="academy-progress-title">${esc(vm.progress.label)}</h2><p>${esc(vm.progress.practicedLabel)} · optional labs excluded</p></div>
      <div class="academy-progress__meter" role="progressbar" aria-label="Core Academy mastery" aria-valuemin="0" aria-valuemax="13" aria-valuenow="${vm.progress.mastered}"><span style="--academy-progress:${(vm.progress.mastered / 13) * 100}%"></span></div>
    </section>
    <div class="academy-families">
      ${vm.families.map((family,index) => `<section class="academy-family" aria-labelledby="academy-family-${esc(family.id)}">
        <div class="academy-family__heading"><span>${String(index + 1).padStart(2,'0')}</span><h2 id="academy-family-${esc(family.id)}">${esc(family.title)}</h2></div>
        <div class="academy-family__rows">${family.experiences.map(card => `<a class="academy-experience" href="${esc(card.route)}" data-experience-id="${esc(card.id)}"><span class="academy-experience__mark" aria-hidden="true"></span><span class="academy-experience__copy"><strong>${esc(card.title)}</strong><small>${esc(card.statusText)}${card.reviewEligible && card.status !== 'mastered' ? ' · review ready' : ''}</small></span><span class="academy-experience__arrow" aria-hidden="true">→</span></a>`).join('')}</div>
      </section>`).join('')}
    </div>
    <section class="academy-lab" aria-labelledby="academy-lab-title">
      <p class="academy-home__kicker">ADVANCED MODEL LAB</p><h2 id="academy-lab-title">${esc(vm.optional.title)}</h2>
      <p>Optional exploration. It does not affect Academy mastery.</p>
      <a href="${esc(vm.optional.route)}">Open model lab <span aria-hidden="true">→</span></a>
    </section>
    <a class="academy-explore" href="#/explore"><span><small>REFERENCE LIBRARY</small><strong>Explore the physics</strong></span><span aria-hidden="true">→</span></a>
  </div>`;
  const cleanups = [];
  const listen = (target,event,handler) => { target?.addEventListener(event,handler); cleanups.push(() => target?.removeEventListener(event,handler)); };
  listen(root.querySelector('[data-home-primary]'), 'click', () => callbacks.onNavigate?.(vm.recommendation.route));
  listen(root.querySelector('[data-home-progress]'), 'click', event => callbacks.onOpenProgress?.(event.currentTarget));
  root.querySelectorAll('input[name="academy-goal"]').forEach(input => listen(input, 'change', () => callbacks.onGoalChange?.(input.value)));
  root.querySelectorAll('[data-experience-id]').forEach(link => listen(link, 'click', event => { if (!callbacks.onNavigate) return; event.preventDefault(); callbacks.onNavigate(link.getAttribute('href')); }));
  const registrations = [];
  root.querySelectorAll('[data-voice-target]').forEach(element => {
    const id = element.dataset.voiceTarget;
    if (!voiceTargets?.register) return;
    registrations.push(voiceTargets.register(id, { setEmphasis:({ kind, reducedMotion }) => { element.dataset.voiceEmphasis=kind; element.dataset.voiceStatic=String(reducedMotion); }, clear:() => { delete element.dataset.voiceEmphasis; delete element.dataset.voiceStatic; } }));
  });
  return () => { cleanups.splice(0).forEach(fn => fn()); registrations.splice(0).forEach(fn => fn()); if (root.querySelector('[data-academy-home]')) root.innerHTML=''; };
}
