import {
  buildGuidedShot,
  deriveNextExperiment,
  readContext,
  updateContext,
} from './sa-v1-context.js';

const byId = id => document.getElementById(id);
const onboarding = byId('onboarding');
const onboardingScroll = onboarding.querySelector('.onboarding-scroll');
const steps = [...onboarding.querySelectorAll('[data-onboarding-step]')];
const form = byId('onboardingForm');
const live = byId('onboardingLive');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let context = readContext();

function setContext(patch) {
  context = updateContext(patch);
  return context;
}

function selected(name) {
  return form.elements.namedItem(name)?.value || null;
}

function setRadio(name, value) {
  for (const input of form.querySelectorAll(`input[name="${name}"]`)) {
    input.checked = input.value === value;
  }
}

function restoreChoices() {
  for (const field of ['goal', 'handedness', 'experience']) {
    setRadio(field, context.onboarding[field]);
  }
  for (const field of ['club', 'start', 'curve', 'flight']) {
    setRadio(field, context.onboarding.draftShot[field]);
  }
}

function titleCase(value) {
  return String(value || '').replace(/^./, character => character.toUpperCase());
}

function signed(value, suffix = '') {
  const number = Number(value) || 0;
  const sign = number < 0 ? '−' : number > 0 ? '+' : '';
  return `${sign}${Math.abs(number).toFixed(1)}${suffix}`;
}

function lateral(value, unit = 'm') {
  const number = Number(value) || 0;
  if (Math.abs(number) < .05) return `On line`;
  return `${Math.abs(number).toFixed(1)} ${unit} ${number > 0 ? 'right' : 'left'}`;
}

function relativeDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Saved model';
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return 'Today';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

function flightGeometry(result) {
  const startX = 160;
  const startY = 160;
  const startOffset = Math.max(-48, Math.min(48, Number(result.startDirectionDeg) * 9));
  const finishOffset = Math.max(-112, Math.min(112, Number(result.offlineM) * 4.2));
  const curveOffset = Math.max(-44, Math.min(44, Number(result.curveM) * 3.2));
  const endX = Math.round(startX + finishOffset);
  const controlOneX = Math.round(startX + startOffset);
  const controlTwoX = Math.round(startX + finishOffset * .55 - curveOffset * .32);
  return {
    d: `M${startX} ${startY} C${controlOneX} 116 ${controlTwoX} 68 ${endX} 28`,
    endX,
    endY: 28,
  };
}

function drawShot(prefix, shot, animate = true) {
  if (!shot?.result) return;
  const svg = byId(`${prefix}ShotSvg`);
  const path = byId(`${prefix}ShotPath`);
  const underlay = byId(`${prefix}ShotUnderlay`);
  const ball = byId(`${prefix}ShotBall`);
  if (!svg || !path || !underlay || !ball) return;

  const geometry = flightGeometry(shot.result);
  path.setAttribute('d', geometry.d);
  underlay.setAttribute('d', geometry.d);
  ball.setAttribute('cx', String(geometry.endX));
  ball.setAttribute('cy', String(geometry.endY));
  svg.querySelector('desc').textContent = `Modelled flight: started ${shot.result.startLabel}, curved ${shot.result.curveLabel}, finished ${shot.result.finishLabel}.`;

  svg.classList.remove('is-drawing');
  if (animate && !reducedMotion) {
    requestAnimationFrame(() => svg.classList.add('is-drawing'));
  }
}

function experimentFor(shot) {
  if (context.lastExperiment?.sourceShotId === shot.id) return context.lastExperiment;
  const experiment = deriveNextExperiment(shot);
  setContext({ lastExperiment: experiment });
  return experiment;
}

function renderHome() {
  const hasShot = Boolean(context.currentShot);
  const empty = byId('homeEmpty');
  const returning = byId('homeReturning');
  empty.hidden = hasShot;
  returning.hidden = !hasShot;
  document.body.dataset.homeState = hasShot ? 'returning' : 'empty';

  if (!hasShot) {
    const resumable = context.onboarding.step > 1 && !context.onboarding.complete;
    byId('emptyEyebrow').textContent = resumable ? 'Setup saved' : 'Your first model';
    byId('emptyTitle').textContent = resumable ? 'Pick up where you left off.' : 'See why it flew.';
    byId('emptyBody').textContent = resumable
      ? 'Your choices are still here. Continue from the exact step you left.'
      : 'Choose a few things you noticed. Flightglass turns them into a shot model you can test.';
    byId('startFirstShot').textContent = resumable ? 'Continue your first shot' : 'Run your first shot';
    return;
  }

  const shot = context.currentShot;
  const result = shot.result;
  const experiment = experimentFor(shot);
  byId('shotTime').textContent = relativeDate(shot.createdAt);
  byId('shotTime').dateTime = shot.createdAt;
  byId('shotSummary').textContent = `Started ${result.startLabel} · curved ${result.curveLabel}`;
  byId('shotCarry').textContent = `${result.carryM.toFixed(1)} m`;
  byId('shotFinish').textContent = lateral(result.offlineM);
  byId('experimentInstruction').textContent = experiment.instruction;
  byId('resumeReturningSetup').hidden = context.onboarding.complete;
  drawShot('home', shot, false);
}

function renderResult() {
  const shot = context.currentShot;
  if (!shot) return;
  const result = shot.result;
  const experiment = experimentFor(shot);

  byId('onboardingRelationship').textContent = result.relationship;
  byId('resultStart').textContent = `${signed(result.startDirectionDeg, '°')} · ${titleCase(result.startLabel)}`;
  byId('resultCurve').textContent = lateral(result.curveM);
  byId('resultCarry').textContent = `${result.carryM.toFixed(1)} m`;
  byId('resultFinish').textContent = lateral(result.offlineM);
  byId('firstExperiment').textContent = `First test: ${experiment.instruction}`;
  drawShot('onboarding', shot);
}

function renderStep(step, { focus = true, announce = true } = {}) {
  const safeStep = Math.max(1, Math.min(4, Number(step) || 1));
  if (safeStep === 4 && !context.currentShot) {
    setContext({ onboarding: { step: 3 } });
    return renderStep(3, { focus, announce });
  }

  for (const section of steps) {
    section.hidden = Number(section.dataset.onboardingStep) !== safeStep;
  }
  byId('onboardingProgress').textContent = `Step ${safeStep} of 4`;
  byId('onboardingProgressBar').style.width = `${safeStep * 25}%`;
  byId('onboardingBack').hidden = safeStep === 1;
  onboarding.dataset.currentStep = String(safeStep);
  onboardingScroll.scrollTop = 0;
  if (safeStep === 4) renderResult();

  const heading = onboarding.querySelector(`[data-onboarding-step="${safeStep}"] h2`);
  if (announce) live.textContent = `Step ${safeStep} of 4. ${heading?.textContent || ''}`;
  if (focus && heading) requestAnimationFrame(() => heading.focus({ preventScroll: true }));
}

function goToStep(step) {
  setContext({ onboarding: { step, dismissed: false } });
  renderStep(context.onboarding.step);
}

function openOnboarding() {
  let step = context.onboarding.step;
  if (step === 4 && !context.currentShot) step = 3;
  setContext({ onboarding: { step, dismissed: false } });
  restoreChoices();
  document.body.dataset.onboardingActive = 'true';
  if (!onboarding.open) {
    if (typeof onboarding.showModal === 'function') onboarding.showModal();
    else onboarding.setAttribute('open', '');
  }
  renderStep(step, { focus: true, announce: true });
}

function closeOnboarding({ complete = false } = {}) {
  setContext({ onboarding: { complete, dismissed: true } });
  document.body.removeAttribute('data-onboarding-active');
  if (onboarding.open && typeof onboarding.close === 'function') onboarding.close();
  else onboarding.removeAttribute('open');
  renderHome();

  const focusTarget = context.currentShot ? byId('tryExperiment') : byId('startFirstShot');
  requestAnimationFrame(() => focusTarget?.focus({ preventScroll: true }));
}

function draftShot() {
  return {
    club: selected('club'),
    start: selected('start'),
    curve: selected('curve'),
    flight: selected('flight'),
  };
}

function createShot(selections) {
  const shot = buildGuidedShot(selections);
  const experiment = deriveNextExperiment(shot);
  context = updateContext({
    onboarding: {
      step: 4,
      dismissed: false,
      draftShot: selections,
    },
    currentShot: shot,
    lastExperiment: experiment,
  });
  renderHome();
  renderStep(4);
}

form.addEventListener('change', event => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== 'radio') return;

  if (['goal', 'handedness', 'experience'].includes(input.name)) {
    setContext({ onboarding: { [input.name]: input.value } });
  }
  if (['club', 'start', 'curve', 'flight'].includes(input.name)) {
    setContext({ onboarding: { draftShot: { [input.name]: input.value } } });
    byId('guidedValidation').hidden = true;
  }
});

for (const button of form.querySelectorAll('[data-skip-field]')) {
  button.addEventListener('click', () => {
    const field = button.dataset.skipField;
    setRadio(field, null);
    setContext({ onboarding: { [field]: null } });
    live.textContent = `${button.closest('fieldset').querySelector('legend').textContent.trim()} skipped.`;
    button.closest('fieldset').nextElementSibling?.querySelector('input, button')?.focus();
  });
}

byId('startFirstShot').addEventListener('click', openOnboarding);
byId('resumeSetup').addEventListener('click', openOnboarding);
byId('resumeReturningSetup').addEventListener('click', openOnboarding);
byId('beginOnboarding').addEventListener('click', () => goToStep(2));
byId('continueProfile').addEventListener('click', () => goToStep(3));
byId('onboardingBack').addEventListener('click', () => goToStep(context.onboarding.step - 1));
byId('onboardingLater').addEventListener('click', () => closeOnboarding({ complete: context.onboarding.complete }));
byId('finishOnboarding').addEventListener('click', () => closeOnboarding({ complete: true }));

byId('showShot').addEventListener('click', () => {
  const selections = draftShot();
  if (Object.values(selections).some(value => !value)) {
    byId('guidedValidation').hidden = false;
    byId('guidedValidation').focus?.();
    return;
  }
  createShot(selections);
});

byId('useNeutralShot').addEventListener('click', () => {
  const neutral = { club: '7iron', start: 'straight', curve: 'straight', flight: 'neutral' };
  for (const [name, value] of Object.entries(neutral)) setRadio(name, value);
  createShot(neutral);
});

byId('tryFirstChange').addEventListener('click', () => {
  setContext({ onboarding: { complete: true, dismissed: true } });
});

onboarding.addEventListener('cancel', event => {
  event.preventDefault();
  closeOnboarding({ complete: context.onboarding.complete });
});

renderHome();
restoreChoices();

if (!context.onboarding.complete && !context.onboarding.dismissed) {
  requestAnimationFrame(openOnboarding);
}

window.__flightglassHome = Object.freeze({
  getContext: () => readContext(),
  openOnboarding,
});
