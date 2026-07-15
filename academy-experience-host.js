import { createVoiceTargetRegistry } from './academy-voice-sync.js';

const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));

export function createAcademyExperienceHost({ root, renderers = {}, services = {} } = {}) {
  if (!root) throw new TypeError('Experience host root is required');
  let cleanup = null;
  const voiceTargets = services.voiceTargets || createVoiceTargetRegistry();
  const destroy = () => { if (cleanup) { const fn=cleanup;cleanup=null;fn(); } voiceTargets.clearAll(); };
  const mount = ({ definition, state, conceptId = null, surface = 0 } = {}) => {
    destroy();
    const renderer = definition && renderers[definition.rendererKey];
    if (typeof renderer !== 'function') {
      root.innerHTML = `<main class="academy-unavailable"><p>ACADEMY · PREVIEW</p><h1>${definition?.title || 'Experience unavailable'}</h1><p>This experience is not built yet. Your Academy progress is safe.</p><button type="button" data-academy-host-back>Back to Academy</button></main>`;
      root.querySelector('[data-academy-host-back]')?.addEventListener('click', () => services.navigate?.('#/academy'));
      cleanup = () => { root.innerHTML=''; };
      return { available:false, destroy };
    }
    const input = Object.freeze({ root, definition, state:clone(state), conceptId, surface, voiceTargets,
      navigate:route => services.navigate?.(route),
      submitMastery:submission => services.submitMastery?.(clone(submission)),
      saveProgress:patch => services.saveProgress?.(definition.id, clone(patch)),
      nextAction:() => clone(services.nextAction?.(definition.id))
    });
    cleanup = renderer(input) || (() => {});
    return { available:true, destroy };
  };
  return { mount, destroy, voiceTargets };
}
