import sa from './sa-haptics.js';
import { trajectorySamples } from './impact-flight.js';
import {
  INITIAL_BACKSPIN_STATE,
  BACKSPIN_PARAMS,
  solveBackspinState,
  advanceMission,
  backspinSensitivity,
  buildCauseChain,
  realWorldRange
} from './academy-backspin-model.js';

const SURFACES = Object.freeze([
  { key:'mission', label:'Mission', next:'Enter the Spin Lab' },
  { key:'lab', label:'Lab', next:'Explore influence' },
  { key:'influence', label:'Influence', next:'Test the myths' },
  { key:'myths', label:'Myths', next:'Start Mastery Check' },
  { key:'mastery', label:'Mastery', next:'View result' },
  { key:'result', label:'Result', next:'Next: Launch Angle' }
]);

const PARAMETER_KEYS = Object.freeze(['dynamicLoft', 'attackAngle', 'ballSpeed']);
const NUMBER = new Intl.NumberFormat('en-US');

const SHEETS = Object.freeze({
  mission: {
    eyebrow:'Mission',
    title:'Build, then cut',
    body:`<p>First build at least <strong>7,000 rpm</strong>. After that stage is credited, cut the same 7-iron model below <strong>3,500 rpm</strong>.</p><p>The low-spin stage is a delivery experiment. It is not a driver simulation.</p>`
  },
  spinLoft: {
    eyebrow:'Model term',
    title:'Spin loft',
    body:`<p>Spin loft is the gap between dynamic loft and attack angle at impact.</p><p class="native-sheet__formula">spin loft = dynamic loft − attack angle</p><p>This lesson uses the app’s 7-iron engine and a centred strike. The full three-dimensional relationship also depends on face-to-path geometry.</p>`
  },
  dynamicLoft: {
    eyebrow:'Input',
    title:'Dynamic loft',
    body:`<p>The loft delivered at impact. It is the dominant geometric lever at fixed speed and strike conditions.</p><p>More dynamic loft usually widens spin loft in this lab; less loft narrows it.</p>`
  },
  attackAngle: {
    eyebrow:'Input',
    title:'Attack angle',
    body:`<p>The vertical direction of the clubhead at impact. Negative is downward; positive is upward.</p><p>Changing attack angle changes spin loft, but “hitting down” does not create spin in the ground.</p>`
  },
  ballSpeed: {
    eyebrow:'Input',
    title:'Ball speed',
    body:`<p>The speed of the ball immediately after impact. The control is mapped through the same smash relationship used by the engine.</p>`
  },
  displayCeiling: {
    eyebrow:'Engine limit',
    title:'9,000 rpm display ceiling',
    body:`<p><strong>9,000 rpm is the interface ceiling.</strong> The displayed engine value stays capped there.</p><p>Underlying model sensitivity; display capped at 9,000 rpm. Influence uses the engine's raw intermediate beyond the cap.</p>`
  },
  modelFloor: {
    eyebrow:'Engine limit',
    title:'1,500 rpm model floor',
    body:`<p><strong>1,500 rpm is the model floor.</strong> The displayed engine value stays at that floor.</p><p>Influence uses the engine's raw intermediate when the lower bound hides a visible change.</p>`
  },
  carry: {
    eyebrow:'Model output',
    title:'Carry',
    body:`<p>In this Flightglass model, fixed ball speed holds carry steady while spin changes height and landing. Real high-spin shots can balloon; that effect is not modeled here.</p>`
  },
  realWorld: {
    eyebrow:'Estimate layer',
    title:'Real-world spin retention',
    body:`<p>This sourced range is an approximate real-world layer. It never changes the simulator output and must not be read as a second engine truth.</p>`
  }
});

const LIE_ESTIMATES = Object.freeze({
  wet: { label:'Wet face / ball', keep:[0.80, 0.85], source:'Andrew Rice, 2013' },
  flyer: { label:'Flyer lie', keep:[0.35, 0.70], source:'USGA / Pate, 2020' }
});

const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const clampSurface = value => Math.max(0, Math.min(SURFACES.length - 1,
  Number.isFinite(Number(value)) ? Math.floor(Number(value)) : 0));

const callback = value => typeof value === 'function' ? value : () => undefined;

function spinBand(rpm) {
  if (rpm >= 8000) return { key:'high', label:'High-spin delivery' };
  if (rpm >= 5500) return { key:'iron', label:'Iron spin window' };
  return { key:'low', label:'Low-spin delivery' };
}

function initialUnlockedSurface(journey, surface) {
  let unlocked = surface;
  if (journey?.mission?.built && journey?.mission?.cut) unlocked = Math.max(unlocked, 2);
  if (journey?.myths?.some(Boolean)) unlocked = Math.max(unlocked, 3);
  if (journey?.myths?.every(Boolean)) unlocked = Math.max(unlocked, 4);
  if (journey?.masteryAttemptId) unlocked = Math.max(unlocked, 4);
  if (journey?.lastSubmission) unlocked = 5;
  return clampSurface(unlocked);
}

function lessonTemplate({ xp, level, state }) {
  const safeXp = Math.max(0, Math.floor(Number(xp) || 0));
  const levelNumber = Math.max(1, Math.floor(Number(level?.number) || 1));
  const levelTitle = escapeHtml(level?.title || 'Rookie');
  const stepper = SURFACES.map((surface, index) => `
    <button type="button" class="native-lesson__step" data-step="${surface.key}"
      data-surface-target="${index}" aria-label="Step ${index + 1} of 6: ${surface.label}"
      aria-current="${index === state.surface ? 'step' : 'false'}" tabindex="${index === state.surface ? '0' : '-1'}">
      <span class="native-lesson__step-dot" aria-hidden="true"></span>
      <span class="native-lesson__step-label">${surface.label}</span>
    </button>`).join('');

  const paramButtons = PARAMETER_KEYS.map((key, index) => `
    <button type="button" class="native-lesson__chip" data-param="${key}"
      role="radio" aria-checked="${index === 0 ? 'true' : 'false'}"
      tabindex="${index === 0 ? '0' : '-1'}">${BACKSPIN_PARAMS[key].label}</button>`).join('');

  return `
  <section id="nativeLesson" class="native-lesson" data-lesson="backspin" data-surface="${state.surface}">
    <div class="native-lesson__frame">
      <header class="native-lesson__header">
        <button type="button" class="native-lesson__icon-button" data-action="back-to-path" aria-label="Back to Academy path">
          <span aria-hidden="true">←</span>
        </button>
        <div class="native-lesson__header-title">
          <span>Academy · Flight</span><strong>Backspin</strong>
        </div>
        <div class="native-lesson__progress" aria-label="${safeXp} XP, level ${levelNumber}, ${levelTitle}">
          <strong>${NUMBER.format(safeXp)} XP</strong><span>Lv ${levelNumber} · ${levelTitle}</span>
        </div>
      </header>

      <div class="native-lesson__pager" data-native-pager>
        <section class="native-lesson__surface native-lesson__surface--mission" data-surface="0" tabindex="-1" aria-labelledby="nativeMissionTitle">
          <div class="native-lesson__mission-copy">
            <p class="native-lesson__eyebrow">Academy · Flight</p>
            <h1 id="nativeMissionTitle">Backspin</h1>
            <p class="native-lesson__lede">Backspin is the ball's backward rotation that creates lift and helps a shot hold its flight.</p>
            <div class="native-lesson__mission-card" aria-labelledby="nativeMissionLabel">
              <div class="native-lesson__card-heading">
                <p id="nativeMissionLabel">Your mission</p>
                <button type="button" class="native-lesson__info-button" data-sheet="mission" aria-label="About this mission">i</button>
              </div>
              <strong>Build 7,000+ rpm, then cut it below 3,500.</strong>
              <div class="native-lesson__mission-stages" role="list">
                <div id="missionStageBuild" class="native-lesson__mission-stage" role="listitem" data-complete="false">
                  <span aria-hidden="true"></span><p><strong>Build the spin</strong><small>Reach 7,000 rpm</small></p>
                </div>
                <div id="missionStageCut" class="native-lesson__mission-stage" role="listitem" data-complete="false">
                  <span aria-hidden="true"></span><p><strong>Cut it in half</strong><small>Then drop below 3,500 rpm</small></p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="native-lesson__surface native-lesson__surface--lab" data-surface="1" tabindex="-1" aria-labelledby="nativeLabTitle">
          <div class="native-lesson__surface-heading">
            <div><p class="native-lesson__eyebrow">7-iron · live engine</p><h2 id="nativeLabTitle">Spin Lab</h2></div>
            <button type="button" class="native-lesson__mission-pill" data-sheet="mission">Mission <span data-mission-count>0 / 2</span></button>
          </div>
          <div class="native-lesson__lab-visual">
            <canvas id="flightCanvas" aria-hidden="true"></canvas>
            <div id="flightFallback" class="native-lesson__flight-fallback" hidden aria-hidden="true">
              <svg viewBox="0 0 320 120" preserveAspectRatio="none"><path d="M8 108 C 82 18, 218 12, 312 108"/></svg>
            </div>
            <div class="native-lesson__truth">
              <span>Backspin</span>
              <output id="backspinTruth">—</output><small>rpm</small>
              <div id="backspinBand" class="native-lesson__spin-band" data-band="iron">Iron spin window</div>
              <button type="button" class="native-lesson__truth-chip" data-sheet="spinLoft"><span id="labSpinLoft" data-spin-loft>—</span> spin loft</button>
            </div>
            <button type="button" id="backspinLimit" class="native-lesson__limit-chip" data-engine-limit hidden></button>
          </div>
          <div class="native-lesson__outcomes" aria-label="Engine outcomes">
            <button type="button" data-sheet="carry"><span>Carry</span><strong id="labCarry" data-carry>—</strong></button>
            <div><span>Height</span><strong id="labHeight" data-apex>—</strong></div>
            <div><span>Landing</span><strong id="labLanding" data-landing>—</strong></div>
          </div>
          <div class="native-lesson__lab-controls">
            <div class="native-lesson__chips" id="labParamTabs" role="radiogroup" aria-label="Choose an input">${paramButtons}</div>
            <label class="native-lesson__range-label" for="labRange"><span data-range-label>Dynamic loft</span><output data-range-value>25°</output></label>
            <input id="labRange" type="range" aria-describedby="causeChain">
            <div id="causeChain" class="native-lesson__cause" aria-label="Cause chain">Move one input to reveal the cause chain.</div>
          </div>
        </section>

        <section class="native-lesson__surface" data-surface="2" tabindex="-1" aria-labelledby="nativeInfluenceTitle">
          <div class="native-lesson__surface-heading">
            <div><p class="native-lesson__eyebrow">Current lab state</p><h2 id="nativeInfluenceTitle">Influence</h2></div>
            <span class="native-lesson__stamp">Simulator ranking</span>
          </div>
          <p class="native-lesson__support">How much each input moves backspin by one unit here.</p>
          <div id="influenceBars" class="native-lesson__influence" role="group" aria-label="Backspin sensitivity ranked"></div>
          <div class="native-lesson__lie-control" role="radiogroup" aria-label="Surface condition">
            <button type="button" role="radio" data-lie="clean" aria-checked="true" tabindex="0">Clean</button>
            <button type="button" role="radio" data-lie="wet" aria-checked="false" tabindex="-1">Wet</button>
            <button type="button" role="radio" data-lie="flyer" aria-checked="false" tabindex="-1">Flyer</button>
          </div>
          <button type="button" id="realWorldRegister" class="native-lesson__real-world" data-sheet="realWorld" hidden></button>
        </section>

        <section class="native-lesson__surface" data-surface="3" tabindex="-1" aria-labelledby="nativeMythsTitle">
          <div class="native-lesson__surface-heading">
            <div><p class="native-lesson__eyebrow">Predict · run · explain</p><h2 id="nativeMythsTitle">Myth experiments</h2></div>
            <span class="native-lesson__stamp" data-myth-count>0 / 3</span>
          </div>
          <div id="mythExperiment" class="native-lesson__experiment">
            <p class="native-lesson__experiment-number">Experiment 1 of 3</p>
            <h3>Where is backspin actually created?</h3>
            <p>Make a prediction, then compare two engine runs.</p>
            <div class="native-lesson__prediction-placeholder" aria-label="Prediction controls prepared for the experiment">
              <span>Ground interaction</span><span>Face friction and spin loft</span>
            </div>
          </div>
        </section>

        <section class="native-lesson__surface" data-surface="4" tabindex="-1" aria-labelledby="nativeMasteryTitle">
          <div class="native-lesson__surface-heading">
            <div><p class="native-lesson__eyebrow">4 of 5 to master</p><h2 id="nativeMasteryTitle">Mastery Check</h2></div>
            <span class="native-lesson__stamp">Task 1 / 5</span>
          </div>
          <div id="masteryTask" class="native-lesson__mastery-task">
            <p>Five short tasks check spin-loft reasoning, model honesty and a live stopping-flight target.</p>
            <div class="native-lesson__mastery-preview" aria-hidden="true"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>
          </div>
        </section>

        <section class="native-lesson__surface native-lesson__surface--result" data-surface="5" tabindex="-1" aria-labelledby="nativeResultTitle">
          <div id="nativeLessonResult" class="native-lesson__result">
            <p class="native-lesson__eyebrow" data-result-eyebrow>Backspin result</p>
            <h2 id="nativeResultTitle">Your stopping-flight read</h2>
            <p data-result-copy>Complete the Mastery Check to see the ability you demonstrated.</p>
            <div class="native-lesson__result-summary" data-result-summary hidden></div>
            <button type="button" class="native-lesson__secondary-action" data-action="back-to-path">Back to path</button>
          </div>
        </section>
      </div>

      <nav class="native-lesson__navigation" aria-label="Lesson surfaces">
        <div class="native-lesson__stepper" role="toolbar" aria-label="Lesson progress">${stepper}</div>
        <div class="native-lesson__nav-actions">
          <button type="button" class="native-lesson__previous" data-action="previous"><span aria-hidden="true">←</span><span>Back</span></button>
          <button type="button" class="native-lesson__next" data-action="next"><span data-next-label>${SURFACES[state.surface].next}</span><span aria-hidden="true">→</span></button>
        </div>
      </nav>
    </div>

    <div class="native-sheet__scrim" data-sheet-scrim hidden></div>
    <aside id="lessonSheet" class="native-sheet" role="dialog" aria-modal="true" aria-labelledby="lessonSheetTitle" hidden>
      <div class="native-sheet__grab" aria-hidden="true"></div>
      <p class="native-sheet__eyebrow" data-sheet-eyebrow>Learn more</p>
      <h2 id="lessonSheetTitle" class="native-sheet__title">Learn more</h2>
      <div class="native-sheet__body" data-sheet-body></div>
      <button type="button" class="native-sheet__close" data-sheet-close>Close</button>
    </aside>
  </section>`;
}

export function mountNativeBackspinLesson(options = {}) {
  const {
    root,
    xp = 0,
    level = { number:1, title:'Rookie' },
    journey = {},
    onJourney,
    onSubmit,
    onBack,
    onNextLesson,
    onAnnounce,
    onDiagramTouched,
    onEngage
  } = options;

  if (typeof HTMLElement === 'undefined' || !(root instanceof HTMLElement)) {
    throw new TypeError('root must be an HTMLElement');
  }

  const callbacks = {
    onJourney:callback(onJourney),
    onSubmit:callback(onSubmit),
    onBack:callback(onBack),
    onNextLesson:callback(onNextLesson),
    onAnnounce:callback(onAnnounce),
    onDiagramTouched:callback(typeof onDiagramTouched === 'function' ? onDiagramTouched : onEngage)
  };
  const cleanups = [];
  const timers = new Set();
  const frames = new Set();
  let destroyed = false;
  let settleTimer = null;
  let announceTimer = null;
  let pendingAnnouncement = '';
  let beforeSettled = { ...INITIAL_BACKSPIN_STATE };
  let pendingSettleParam = 'dynamicLoft';
  let lastFocus = null;
  let touchStartY = null;
  let diagramTouched = false;

  let initialSolved = null;
  try {
    initialSolved = solveBackspinState(INITIAL_BACKSPIN_STATE);
  } catch {
    // The renderer keeps its DOM fallback if the shared model is unavailable.
  }
  const requestedSurface = clampSurface(journey?.surface);
  const state = {
    surface:requestedSurface,
    unlockedSurface:0,
    input:{ ...INITIAL_BACKSPIN_STATE },
    lastValidInput:{ ...INITIAL_BACKSPIN_STATE },
    previousSettled:null,
    lastValidSolved:initialSolved,
    mission:{ built:Boolean(journey?.mission?.built), cut:Boolean(journey?.mission?.built && journey?.mission?.cut) },
    myths:[false, false, false].map((value, index) => Boolean(journey?.myths?.[index] ?? value)),
    mastery:[],
    masteryAttemptId:journey?.masteryAttemptId || null,
    lastSubmission:journey?.lastSubmission || null,
    activeParam:'dynamicLoft',
    lie:'clean'
  };
  const normalizedLegacySurface = !(state.mission.built && state.mission.cut) && requestedSurface > 1;
  if (normalizedLegacySurface) state.surface = 1;
  state.unlockedSurface = initialUnlockedSurface(state, state.surface);

  root.innerHTML = lessonTemplate({ xp, level, state });
  const lesson = root.querySelector('#nativeLesson');
  const frame = lesson.querySelector('.native-lesson__frame');
  const pager = lesson.querySelector('[data-native-pager]');
  const sheet = lesson.querySelector('#lessonSheet');
  const sheetScrim = lesson.querySelector('[data-sheet-scrim]');
  const range = lesson.querySelector('#labRange');
  const canvas = lesson.querySelector('#flightCanvas');
  const fallback = lesson.querySelector('#flightFallback');

  function listen(target, event, handler, eventOptions) {
    target?.addEventListener(event, handler, eventOptions);
    cleanups.push(() => target?.removeEventListener(event, handler, eventOptions));
  }

  function later(handler, delay) {
    const id = setTimeout(() => {
      timers.delete(id);
      if (!destroyed) handler();
    }, delay);
    timers.add(id);
    return id;
  }

  function cancelLater(id) {
    if (id === null || id === undefined) return;
    clearTimeout(id);
    timers.delete(id);
  }

  function nextFrame(handler) {
    const id = requestAnimationFrame(() => {
      frames.delete(id);
      if (!destroyed) handler();
    });
    frames.add(id);
    return id;
  }

  function announce(message) {
    const text = String(message || '').trim();
    if (!text) return;
    pendingAnnouncement = text;
    cancelLater(announceTimer);
    announceTimer = later(() => {
      callbacks.onAnnounce(pendingAnnouncement);
    }, 120);
  }

  function persistJourney(patch, journeyOptions = {}) {
    return callbacks.onJourney(patch, journeyOptions);
  }

  function markDiagramTouched() {
    if (diagramTouched) return;
    diagramTouched = true;
    callbacks.onDiagramTouched();
  }

  function safeSolve(input, { announceFailure=true } = {}) {
    try {
      const candidate = Object.fromEntries(PARAMETER_KEYS.map(key => [key, Number(input?.[key])]));
      const solved = solveBackspinState(candidate);
      state.input = candidate;
      state.lastValidInput = { ...candidate };
      state.lastValidSolved = solved;
      return solved;
    } catch {
      state.input = { ...state.lastValidInput };
      if (range && BACKSPIN_PARAMS[state.activeParam]) {
        range.value = String(state.input[state.activeParam]);
      }
      if (announceFailure) announce('Model could not update');
      return null;
    }
  }

  function renderMission() {
    const build = lesson.querySelector('#missionStageBuild');
    const cut = lesson.querySelector('#missionStageCut');
    build.dataset.complete = String(state.mission.built);
    cut.dataset.complete = String(state.mission.cut);
    build.setAttribute('aria-label', `Build the spin: ${state.mission.built ? 'complete' : 'not complete'}`);
    cut.setAttribute('aria-label', `Cut it in half: ${state.mission.cut ? 'complete' : 'not complete'}`);
    lesson.querySelector('[data-mission-count]').textContent = `${Number(state.mission.built) + Number(state.mission.cut)} / 2`;
  }

  function drawTrajectory(solved) {
    if (!solved) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    let context;
    try { context = canvas.getContext('2d'); } catch { context = null; }
    if (!context) {
      canvas.hidden = true;
      fallback.hidden = false;
      return;
    }
    canvas.hidden = false;
    fallback.hidden = true;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    const styles = getComputedStyle(lesson);
    const padX = 14;
    const baseY = height - 17;
    const draw = (flight, stroke, lineWidth, dashed=false) => {
      const points = trajectorySamples(flight, 48);
      context.beginPath();
      context.setLineDash(dashed ? [5, 7] : []);
      points.forEach((point, index) => {
        const x = padX + point.d * (width - padX * 2);
        const y = baseY - point.h * Math.max(42, height - 48);
        if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
      });
      context.strokeStyle = stroke;
      context.lineWidth = lineWidth;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.stroke();
    };
    if (state.previousSettled?.flight) draw(state.previousSettled.flight, styles.getPropertyValue('--ghost').trim() || '#A7A0C4', 1.5, true);
    draw(solved.flight, styles.getPropertyValue('--accent').trim() || '#FF8A4D', 2.5);
    context.setLineDash([]);
    context.beginPath();
    context.moveTo(padX, baseY + .5);
    context.lineTo(width - padX, baseY + .5);
    context.strokeStyle = styles.getPropertyValue('--line').trim() || 'rgba(255,255,255,.1)';
    context.lineWidth = 1;
    context.stroke();
  }

  function renderLab() {
    const solved = safeSolve(state.input, { announceFailure:false }) || state.lastValidSolved;
    if (!solved) return;
    lesson.querySelector('#backspinTruth').textContent = NUMBER.format(solved.rpm);
    lesson.querySelector('[data-spin-loft]').textContent = `${solved.spinLoft}°`;
    lesson.querySelector('[data-carry]').textContent = `${solved.carryM} m`;
    lesson.querySelector('[data-apex]').textContent = `${solved.apexM} m`;
    lesson.querySelector('[data-landing]').textContent = `${solved.landingAngle}°`;
    const band = spinBand(solved.rpm);
    const bandNode = lesson.querySelector('#backspinBand');
    bandNode.dataset.band = band.key;
    bandNode.textContent = band.label;

    const limit = lesson.querySelector('#backspinLimit');
    if (solved.displayLimit === 'ceiling') {
      limit.hidden = false;
      limit.dataset.sheet = 'displayCeiling';
      limit.textContent = 'Display limit';
      limit.setAttribute('aria-label', 'Display limit: 9,000 rpm ceiling. Open explanation.');
    } else if (solved.displayLimit === 'floor') {
      limit.hidden = false;
      limit.dataset.sheet = 'modelFloor';
      limit.textContent = 'Model floor';
      limit.setAttribute('aria-label', 'Model floor: 1,500 rpm. Open explanation.');
    } else {
      limit.hidden = true;
      limit.removeAttribute('data-sheet');
    }

    const parameter = BACKSPIN_PARAMS[state.activeParam];
    range.min = String(parameter.min);
    range.max = String(parameter.max);
    range.step = String(parameter.step);
    range.value = String(state.input[state.activeParam]);
    range.setAttribute('aria-label', parameter.label);
    range.setAttribute('aria-valuetext', `${state.input[state.activeParam]}${parameter.unit}`);
    lesson.querySelector('[data-range-label]').textContent = parameter.label;
    lesson.querySelector('[data-range-value]').textContent = `${state.input[state.activeParam]}${parameter.unit}`;
    lesson.querySelectorAll('[data-param]').forEach(button => {
      const active = button.dataset.param === state.activeParam;
      button.setAttribute('aria-checked', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    drawTrajectory(solved);
  }

  function renderInfluence() {
    let sensitivity;
    const solved = safeSolve(state.input, { announceFailure:false });
    try { sensitivity = backspinSensitivity(state.input); } catch { sensitivity = null; }
    const container = lesson.querySelector('#influenceBars');
    if (!sensitivity || !solved) {
      container.textContent = 'Sensitivity unavailable.';
      return;
    }
    const ranked = PARAMETER_KEYS.map(key => {
      const delta = sensitivity[key];
      const value = solved.displayLimit ? delta.rawDelta : delta.displayDelta;
      return { key, value };
    }).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    const peak = Math.max(1, ...ranked.map(item => Math.abs(item.value)));
    container.innerHTML = ranked.map((item, index) => {
      const magnitude = Math.round(Math.abs(item.value));
      const direction = item.value >= 0 ? '+' : '−';
      const unit = item.key === 'ballSpeed' ? 'rpm / mph' : 'rpm / degree';
      return `<button type="button" class="native-lesson__influence-row" data-influence="${item.key}">
        <span class="native-lesson__rank">${index + 1}</span>
        <span class="native-lesson__influence-label">${BACKSPIN_PARAMS[item.key].label}<small>${direction}${NUMBER.format(magnitude)} ${unit}</small></span>
        <span class="native-lesson__bar" aria-hidden="true"><i style="width:${Math.max(8, Math.round(Math.abs(item.value) / peak * 100))}%"></i></span>
      </button>`;
    }).join('');
    container.dataset.limit = solved.displayLimit || 'none';
    container.setAttribute('aria-description', solved.displayLimit === 'ceiling'
      ? 'Underlying model sensitivity; display capped at 9,000 rpm.'
      : solved.displayLimit === 'floor'
        ? 'Underlying model sensitivity; display floored at 1,500 rpm.'
        : 'Simulator sensitivity at the current state.');
    renderRealWorld(solved.rpm);
  }

  function renderRealWorld(rpm) {
    const register = lesson.querySelector('#realWorldRegister');
    lesson.querySelectorAll('[data-lie]').forEach(button => {
      const active = button.dataset.lie === state.lie;
      button.setAttribute('aria-checked', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    if (state.lie === 'clean') {
      register.hidden = true;
      register.textContent = '';
      return;
    }
    const estimate = LIE_ESTIMATES[state.lie];
    const rangeEstimate = realWorldRange(rpm, estimate.keep);
    register.hidden = false;
    register.innerHTML = `<span>Real-world layer</span><strong>≈ ${NUMBER.format(rangeEstimate.low)}–${NUMBER.format(rangeEstimate.high)} rpm</strong><small>${estimate.label} · Real-world estimate · ${estimate.source} · not the simulator</small>`;
  }

  function renderMyth() {
    const complete = state.myths.filter(Boolean).length;
    lesson.querySelector('[data-myth-count]').textContent = `${complete} / 3`;
  }

  function renderMastery() {
    const task = lesson.querySelector('#masteryTask');
    task.dataset.attempt = state.masteryAttemptId || '';
    task.dataset.answered = String(state.mastery.length);
  }

  function renderResult() {
    const result = lesson.querySelector('#nativeLessonResult');
    const summary = state.lastSubmission?.summary;
    const summaryNode = result.querySelector('[data-result-summary]');
    if (!summary) {
      summaryNode.hidden = true;
      return;
    }
    const correct = Math.max(0, Number(summary.correct) || 0);
    const total = Math.max(1, Number(summary.total) || 5);
    result.querySelector('[data-result-eyebrow]').textContent = summary.mastered ? 'Backspin mastered' : 'Backspin complete';
    result.querySelector('[data-result-copy]').textContent = summary.mastered
      ? 'You can separate spin loft from “hitting down” and control a shot’s stopping flight in the Flightglass model.'
      : `${correct} of ${total} on the mastery check. Retry for mastery (4/5).`;
    summaryNode.hidden = false;
    summaryNode.textContent = `${correct} / ${total}${Number(summary.totalDelta || summary.delta) ? ` · +${Number(summary.totalDelta || summary.delta)} XP` : ''}`;
  }

  function renderAll() {
    renderMission();
    renderLab();
    renderInfluence();
    renderMyth();
    renderMastery();
    renderResult();
  }

  function updateStepper() {
    lesson.querySelectorAll('[data-surface-target]').forEach(button => {
      const index = Number(button.dataset.surfaceTarget);
      const current = index === state.surface;
      const locked = index > state.unlockedSurface;
      button.setAttribute('aria-current', current ? 'step' : 'false');
      button.setAttribute('aria-disabled', String(locked));
      button.tabIndex = current ? 0 : -1;
      button.inert = locked;
    });
  }

  function updateSurfaceNavigation() {
    const previous = lesson.querySelector('[data-action="previous"]');
    const next = lesson.querySelector('.native-lesson__navigation [data-action="next"]');
    const atStart = state.surface === 0;
    const missionBlocked = state.surface === 1 && !(state.mission.built && state.mission.cut);
    previous.setAttribute('aria-disabled', String(atStart));
    previous.disabled = atStart;
    next.setAttribute('aria-disabled', String(missionBlocked));
    next.disabled = missionBlocked;
    next.title = missionBlocked ? 'Complete both mission stages to continue' : '';
    next.querySelector('[data-next-label]').textContent = missionBlocked ? 'Complete the mission' : SURFACES[state.surface].next;
  }

  function setSurface(index, {
    focus=true,
    persist=true,
    immediate=false,
    unlock=false
  } = {}) {
    const target = clampSurface(index);
    if (target > 1 && !(state.mission.built && state.mission.cut)) return false;
    if (unlock) state.unlockedSurface = Math.max(state.unlockedSurface, target);
    if (target > state.unlockedSurface) return false;
    state.surface = target;
    lesson.dataset.surface = String(target);
    pager.style.setProperty('--surface-x', `${target * -16.6666667}%`);
    lesson.querySelectorAll('.native-lesson__surface').forEach((surface, surfaceIndex) => {
      const active = surfaceIndex === target;
      surface.inert = !active;
      surface.setAttribute('aria-hidden', String(!active));
    });
    updateStepper();
    updateSurfaceNavigation();
    if (persist) persistJourney({ surface:target }, { immediate });
    if (focus) nextFrame(() => lesson.querySelector(`.native-lesson__surface[data-surface="${target}"]`)?.focus());
    if (target === 1) nextFrame(() => drawTrajectory(state.lastValidSolved));
    return true;
  }

  function goNext() {
    if (state.surface === 1 && !(state.mission.built && state.mission.cut)) {
      announce('Complete both mission stages to continue.');
      return;
    }
    if (state.surface === SURFACES.length - 1) {
      callbacks.onNextLesson();
      return;
    }
    setSurface(state.surface + 1, { unlock:true, immediate:true });
  }

  function goPrevious() {
    if (state.surface > 0) setSurface(state.surface - 1, { immediate:true });
  }

  function focusableInSheet() {
    return [...sheet.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter(element => !element.hidden && element.getClientRects().length > 0);
  }

  function openSheet(key, opener=document.activeElement) {
    const content = SHEETS[key];
    if (!content || !sheet.hidden) return;
    lastFocus = opener instanceof HTMLElement ? opener : null;
    sheet.querySelector('[data-sheet-eyebrow]').textContent = content.eyebrow;
    sheet.querySelector('[data-sheet-body]').innerHTML = content.body;
    sheet.querySelector('#lessonSheetTitle').textContent = content.title;
    frame.inert = true;
    sheetScrim.hidden = false;
    sheet.hidden = false;
    nextFrame(() => {
      sheetScrim.classList.add('is-open');
      sheet.classList.add('is-open');
      sheet.querySelector('[data-sheet-close]')?.focus();
    });
  }

  function finishSheetClose({ restoreFocus=true } = {}) {
    sheet.hidden = true;
    sheetScrim.hidden = true;
    frame.inert = false;
    if (restoreFocus && lastFocus?.isConnected) lastFocus.focus();
    lastFocus = null;
  }

  function closeSheet({ immediate=false, restoreFocus=true } = {}) {
    if (sheet.hidden) return;
    sheetScrim.classList.remove('is-open');
    sheet.classList.remove('is-open');
    if (immediate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finishSheetClose({ restoreFocus });
    } else {
      later(() => finishSheetClose({ restoreFocus }), 260);
    }
  }

  function selectParameter(key, { openIfActive=false } = {}) {
    if (!PARAMETER_KEYS.includes(key)) return;
    if (key === state.activeParam && openIfActive) {
      openSheet(key, lesson.querySelector(`[data-param="${key}"]`));
      return;
    }
    if (settleTimer !== null) {
      cancelLater(settleTimer);
      settleTimer = null;
      settleInput(pendingSettleParam);
    }
    state.activeParam = key;
    renderLab();
    lesson.querySelector(`[data-param="${key}"]`)?.focus();
  }

  function settleInput(parameterKey = pendingSettleParam) {
    const solved = safeSolve(state.input);
    if (!solved) return;
    try {
      const chain = buildCauseChain(beforeSettled, state.input, parameterKey);
      const cause = lesson.querySelector('#causeChain');
      cause.innerHTML = chain.visual.map(item => `<span>${escapeHtml(item)}</span>`).join('<span aria-hidden="true">→</span>');
      announce(chain.speech);
    } catch {
      announce('Model could not update');
      return;
    }
    state.previousSettled = solved;
    beforeSettled = { ...state.input };
    renderLab();
  }

  function handleRangeInput() {
    const activeParamAtInput = state.activeParam;
    const value = range.valueAsNumber;
    const settledGhost = state.previousSettled || state.lastValidSolved;
    const solved = safeSolve({ ...state.input, [activeParamAtInput]:value });
    if (!solved) return;
    if (!state.previousSettled) state.previousSettled = settledGhost;
    markDiagramTouched();
    const mission = advanceMission(state.mission, solved.rpm);
    if (mission.event) {
      state.mission = { built:mission.built, cut:mission.cut };
      persistJourney({ mission:{ ...state.mission } }, { immediate:true });
      sa.notify('success');
      announce(mission.event === 'built' ? 'Build stage complete. Now cut the spin below 3,500 rpm.' : 'Mission complete. You built and cut the spin.');
      if (mission.complete) state.unlockedSurface = Math.max(state.unlockedSurface, 2);
      renderMission();
      updateStepper();
      updateSurfaceNavigation();
    } else {
      sa.tick(activeParamAtInput);
    }
    renderLab();
    renderInfluence();
    cancelLater(settleTimer);
    pendingSettleParam = activeParamAtInput;
    settleTimer = later(() => { settleTimer = null; settleInput(activeParamAtInput); }, 300);
  }

  function selectLie(key) {
    if (key !== 'clean' && !LIE_ESTIMATES[key]) return;
    state.lie = key;
    const solved = safeSolve(state.input, { announceFailure:false });
    if (solved) renderRealWorld(solved.rpm);
  }

  function moveRovingFocus(buttons, current, key) {
    const enabled = buttons.filter(button => button.getAttribute('aria-disabled') !== 'true' && !button.inert);
    const position = enabled.indexOf(current);
    if (position < 0) return;
    let next = position;
    if (key === 'ArrowRight' || key === 'ArrowDown') next = (position + 1) % enabled.length;
    else if (key === 'ArrowLeft' || key === 'ArrowUp') next = (position - 1 + enabled.length) % enabled.length;
    else if (key === 'Home') next = 0;
    else if (key === 'End') next = enabled.length - 1;
    else return;
    enabled[next]?.focus();
  }

  function wireLesson() {
    listen(lesson, 'click', event => {
      const target = event.target.closest('button');
      if (!target || target.inert || target.getAttribute('aria-disabled') === 'true') return;
      if (target.dataset.sheet) {
        openSheet(target.dataset.sheet, target);
        return;
      }
      if (target.dataset.param) {
        selectParameter(target.dataset.param, { openIfActive:true });
        return;
      }
      if (target.dataset.lie) {
        selectLie(target.dataset.lie);
        return;
      }
      if (target.dataset.surfaceTarget !== undefined) {
        setSurface(Number(target.dataset.surfaceTarget), { immediate:true });
        return;
      }
      if (target.dataset.action === 'next') goNext();
      else if (target.dataset.action === 'previous') goPrevious();
      else if (target.dataset.action === 'back-to-path') callbacks.onBack();
      else if (target.dataset.sheetClose !== undefined) closeSheet();
    });

    listen(lesson, 'keydown', event => {
      if (!sheet.hidden) {
        if (event.key === 'Escape') {
          event.preventDefault();
          closeSheet();
          return;
        }
        if (event.key === 'Tab') {
          const focusable = focusableInSheet();
          if (!focusable.length) {
            event.preventDefault();
            sheet.focus();
            return;
          }
          const first = focusable[0];
          const last = focusable.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
        return;
      }

      const step = event.target.closest('[data-surface-target]');
      const param = event.target.closest('[data-param]');
      const lie = event.target.closest('[data-lie]');
      if (step) {
        const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (keys.includes(event.key)) {
          event.preventDefault();
          moveRovingFocus([...lesson.querySelectorAll('[data-surface-target]')], step, event.key);
        }
      } else if (param) {
        const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (keys.includes(event.key)) {
          event.preventDefault();
          const buttons = [...lesson.querySelectorAll('[data-param]')];
          moveRovingFocus(buttons, param, event.key);
          const focused = document.activeElement;
          if (focused?.dataset.param) selectParameter(focused.dataset.param);
        }
      } else if (lie) {
        const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (keys.includes(event.key)) {
          event.preventDefault();
          const buttons = [...lesson.querySelectorAll('[data-lie]')];
          moveRovingFocus(buttons, lie, event.key);
          const focused = document.activeElement;
          if (focused?.dataset.lie) selectLie(focused.dataset.lie);
        }
      }
    });

    listen(range, 'pointerdown', () => sa.selectionStart());
    listen(range, 'input', handleRangeInput);
    listen(range, 'change', () => sa.selectionEnd());
    listen(range, 'pointerup', () => sa.selectionEnd());
    listen(range, 'pointercancel', () => sa.selectionEnd());
    listen(range, 'blur', () => sa.selectionEnd());

    listen(sheetScrim, 'click', () => closeSheet());
    listen(sheet, 'touchstart', event => {
      touchStartY = event.touches?.[0]?.clientY ?? null;
    }, { passive:true });
    listen(sheet, 'touchmove', event => {
      const y = event.touches?.[0]?.clientY;
      if (touchStartY !== null && Number.isFinite(y) && y - touchStartY > 70) {
        touchStartY = null;
        closeSheet();
      }
    }, { passive:true });

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() => drawTrajectory(state.lastValidSolved));
      observer.observe(canvas);
      cleanups.push(() => observer.disconnect());
    } else {
      listen(window, 'resize', () => drawTrajectory(state.lastValidSolved));
    }
  }

  wireLesson();
  renderAll();
  setSurface(state.surface, { focus:false, persist:false });
  if (normalizedLegacySurface) persistJourney({ surface:1 }, { immediate:true });

  return () => {
    if (destroyed) return;
    destroyed = true;
    closeSheet({ immediate:true, restoreFocus:false });
    cleanups.splice(0).forEach(fn => fn());
    timers.forEach(clearTimeout);
    timers.clear();
    frames.forEach(cancelAnimationFrame);
    frames.clear();
    sa.selectionEnd();
    if (lesson.parentElement === root) lesson.remove();
  };
}
