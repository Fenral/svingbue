import {
  deriveNextExperiment,
  readContext,
  updateContext,
} from './sa-v1-context.js';
import { solveFlight } from './impact-flight.js';
import { runOpeningSplash } from './sa-opening.js';
import * as saIap from './sa-iap.js';
import { track } from './sa-analytics.js';

const byId = id => document.getElementById(id);
const onboarding = byId('onboarding');
const onboardingScroll = onboarding.querySelector('.onboarding-scroll');
const steps = [...onboarding.querySelectorAll('[data-onboarding-step]')];
const live = byId('onboardingLive');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const labLoft = byId('onboardingLoft');
const accessCenter = byId('accessCenter');
const iapReady = saIap.init();
const LAB_INPUT = Object.freeze({
  clubSpeed: 90,
  faceAngle: 2,
  clubPath: 0,
  attackAngle: 3,
});
let context = readContext();
labLoft.value = String(context.onboarding.labLoft);

function setContext(patch) {
  context = updateContext(patch);
  return context;
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
    const completed = context.onboarding.complete;
    byId('emptyEyebrow').textContent = completed
      ? 'Ready to explore'
      : resumable ? 'Tour saved' : 'Understand the numbers';
    byId('emptyTitle').textContent = completed
      ? 'Read the whole shot.'
      : resumable ? 'Pick up where you left off.' : 'See what every number changes.';
    byId('emptyBody').textContent = completed
      ? 'Open the live model and change speed, face, path, attack or delivered loft.'
      : resumable
        ? 'Continue from the exact product view you left.'
        : 'Explore how speed, face, path, attack and delivered loft shape the same shot.';
    byId('startFirstShot').textContent = completed
      ? 'Open live Outcome'
      : resumable ? 'Continue the tour' : 'See how Flightglass works';
    byId('resumeSetup').hidden = !completed;
    if (completed) byId('resumeSetup').textContent = 'Review how it works';
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

function renderLab({ announce = false, persist = false } = {}) {
  const dynamicLoft = Number(labLoft.value);
  const result = solveFlight({ ...LAB_INPUT, dynamicLoft });
  const progress = (dynamicLoft - Number(labLoft.min))
    / (Number(labLoft.max) - Number(labLoft.min));

  byId('labLoftValue').textContent = `${dynamicLoft.toFixed(1)}°`;
  byId('labLaunch').textContent = `${result.launchAngle.toFixed(1)}°`;
  byId('labSpinLoft').textContent = `${result.spinLoft.toFixed(1)}°`;
  byId('labBackspin').textContent = `${Math.round(result.backspin)} rpm`;
  labLoft.style.setProperty('--lab-progress', `${(progress * 100).toFixed(1)}%`);
  if (persist) {
    setContext({ onboarding: { labLoft: dynamicLoft } });
    track('onboarding_lab_changed', { changeKey: 'dynamicLoft', value: dynamicLoft });
  }

  const lab = byId('onboardingLab');
  lab.classList.remove('is-updating');
  if (!reducedMotion) requestAnimationFrame(() => lab.classList.add('is-updating'));

  if (announce) {
    live.textContent = `Delivered loft ${dynamicLoft.toFixed(0)} degrees. Launch ${result.launchAngle.toFixed(1)} degrees, spin loft ${result.spinLoft.toFixed(1)} degrees, backspin ${Math.round(result.backspin)} rpm.`;
  }
}

function stepLab(delta) {
  const next = Math.max(Number(labLoft.min), Math.min(Number(labLoft.max), Number(labLoft.value) + delta));
  labLoft.value = String(next);
  renderLab({ announce: true, persist: true });
}

function renderStep(step, { focus = true, announce = true } = {}) {
  const safeStep = Math.max(1, Math.min(4, Number(step) || 1));
  for (const section of steps) {
    const active = Number(section.dataset.onboardingStep) === safeStep;
    section.hidden = !active;
    section.classList.remove('is-entering');
    if (active && !reducedMotion) {
      requestAnimationFrame(() => {
        section.classList.add('is-entering');
        section.addEventListener('animationend', () => section.classList.remove('is-entering'), { once: true });
      });
    }
  }
  byId('onboardingProgress').textContent = `Step ${safeStep} of 4`;
  byId('onboardingProgressBar').style.transform = `scaleX(${safeStep * .25})`;
  byId('onboardingBack').hidden = safeStep === 1;
  onboarding.dataset.currentStep = String(safeStep);
  onboardingScroll.scrollTop = 0;
  if (safeStep === 3) renderLab();

  const heading = onboarding.querySelector(`[data-onboarding-step="${safeStep}"] h2`);
  if (announce) live.textContent = `Step ${safeStep} of 4. ${heading?.textContent || ''}`;
  if (focus && heading) requestAnimationFrame(() => heading.focus({ preventScroll: true }));
}

function goToStep(step) {
  setContext({ onboarding: { step, dismissed: false } });
  renderStep(context.onboarding.step);
}

function openOnboarding() {
  const step = context.onboarding.step;
  setContext({ onboarding: { step, dismissed: false } });
  document.body.dataset.onboardingActive = 'true';
  if (!onboarding.open) {
    if (typeof onboarding.showModal === 'function') onboarding.showModal();
    else onboarding.setAttribute('open', '');
  }
  renderStep(step, { focus: true, announce: true });
  track('onboarding_started', { step });
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

byId('startFirstShot').addEventListener('click', () => {
  if (context.onboarding.complete) {
    window.location.assign('./impact.html');
    return;
  }
  openOnboarding();
});
byId('resumeSetup').addEventListener('click', () => {
  setContext({ onboarding: { step: 1, dismissed: false } });
  openOnboarding();
});
byId('resumeReturningSetup').addEventListener('click', openOnboarding);
byId('beginOnboarding').addEventListener('click', () => goToStep(2));
byId('continueTour').addEventListener('click', () => goToStep(3));
byId('continueFromLab').addEventListener('click', () => goToStep(4));
byId('onboardingBack').addEventListener('click', () => goToStep(context.onboarding.step - 1));
byId('onboardingLater').addEventListener('click', () => closeOnboarding({ complete: context.onboarding.complete }));
byId('finishOnboarding').addEventListener('click', () => {
  track('onboarding_completed', { step: 4, completed: true });
  closeOnboarding({ complete: true });
});

labLoft.addEventListener('input', () => renderLab());
labLoft.addEventListener('change', () => renderLab({ announce: true, persist: true }));
byId('labLoftDown').addEventListener('click', () => stepLab(-1));
byId('labLoftUp').addEventListener('click', () => stepLab(1));

for (const link of onboarding.querySelectorAll('[data-complete-onboarding]')) {
  link.addEventListener('click', () => {
    setContext({ onboarding: { complete: true, dismissed: true, step: 4 } });
    track('onboarding_completed', { step: 4, completed: true });
  });
}

let accessCenterOpener = null;
byId('openAccessCenter').addEventListener('click', () => {
  accessCenterOpener = document.activeElement;
  byId('restoreHomeStatus').textContent = '';
  accessCenter.showModal();
  requestAnimationFrame(() => byId('accessCenterTitle').focus({ preventScroll: true }));
});
accessCenter.addEventListener('click', event => {
  if (event.target === accessCenter) accessCenter.close();
});
accessCenter.addEventListener('close', () => {
  const target = accessCenterOpener;
  accessCenterOpener = null;
  if (target?.isConnected) requestAnimationFrame(() => target.focus({ preventScroll: true }));
});
byId('restoreHomePurchases').addEventListener('click', async () => {
  const button = byId('restoreHomePurchases');
  const status = byId('restoreHomeStatus');
  button.disabled = true;
  status.textContent = 'Checking your store account…';
  await iapReady;
  const result = await saIap.restoreDetailed();
  button.disabled = false;
  if (result.status === saIap.PURCHASE_STATUS.SUCCESS) {
    status.textContent = 'Flightglass Pro restored.';
    track('restore_completed', { route: 'home', restored: true });
  } else if (result.status === saIap.PURCHASE_STATUS.NOT_FOUND) {
    status.textContent = 'No Flightglass Pro purchase was found for this store account.';
  } else if (result.status === saIap.PURCHASE_STATUS.UNAVAILABLE) {
    status.textContent = saIap.isNative()
      ? 'Store access is unavailable in this build. Try again after the app store connection is configured.'
      : 'Open the native iOS or Android app to restore purchases.';
  } else {
    status.textContent = 'The store could not check purchases. Check your connection and try again.';
  }
});

onboarding.addEventListener('cancel', event => {
  event.preventDefault();
  closeOnboarding({ complete: context.onboarding.complete });
});

renderHome();
renderLab();
await runOpeningSplash();

if (!context.onboarding.complete && !context.onboarding.dismissed) {
  requestAnimationFrame(openOnboarding);
} else {
  requestAnimationFrame(() => byId('homeMain')?.focus({ preventScroll: true }));
}

window.__flightglassHome = Object.freeze({
  getContext: () => readContext(),
  openOnboarding,
});
