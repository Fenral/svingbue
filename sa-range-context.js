import { isRangeInputs, rangeInputsFromContext, readContext } from './sa-v1-context.js';

const INPUT_MAP = Object.freeze({
  faceAngle: 'face',
  clubPath: 'path',
  attackAngle: 'attack',
  dynamicLoft: 'dynLoft',
  clubSpeed: 'speed',
});

export function guidedModeFromSearch(search = '') {
  const mode = new URLSearchParams(String(search)).get('guided');
  return mode === 'shot' || mode === 'experiment' ? mode : null;
}

export function applyRangeInputs(state, inputs, doc = globalThis.document) {
  if (!state || !isRangeInputs(inputs)) return false;
  for (const [inputKey, stateKey] of Object.entries(INPUT_MAP)) {
    state[stateKey] = inputs[inputKey];
  }

  const speed = doc?.getElementById?.('spVal');
  if (speed) {
    speed.textContent = `${state.speed} mph`;
  }

  for (const [inputKey, stateKey] of Object.entries(INPUT_MAP)) {
    if (stateKey === 'speed') continue;
    const slider = doc?.getElementById?.(`sl-${stateKey}`);
    if (!slider) continue;
    slider.value = String(state[stateKey]);
    const EventConstructor = doc.defaultView?.Event || globalThis.Event;
    if (typeof EventConstructor === 'function') {
      slider.dispatchEvent(new EventConstructor('input', { bubbles: true }));
    }
  }

  return true;
}

function nextFrame(win) {
  return new Promise(resolve => {
    if (typeof win?.requestAnimationFrame === 'function') win.requestAnimationFrame(resolve);
    else setTimeout(resolve, 0);
  });
}

export async function mountGuidedRangeContext(doc = globalThis.document) {
  const win = doc?.defaultView || globalThis.window;
  const mode = guidedModeFromSearch(win?.location?.search || '');
  if (!mode) return false;

  const context = readContext(win?.localStorage);
  const inputs = rangeInputsFromContext(context, mode === 'experiment');
  if (!inputs) return false;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const api = win?.__impact;
    if (api?.state && applyRangeInputs(api.state, inputs, doc)) {
      api.guidedContext = Object.freeze({
        mode,
        sourceShotId: context.currentShot?.id || null,
        inputs: Object.freeze({ ...inputs }),
      });
      doc.body.dataset.saGuidedRange = mode;
      doc.dispatchEvent(new win.CustomEvent('sa:guided-range-ready', {
        detail: { mode, sourceShotId: context.currentShot?.id || null },
      }));
      return true;
    }
    await nextFrame(win);
  }

  return false;
}
