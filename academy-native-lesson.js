import sa from './sa-haptics.js';
import { trajectorySamples } from './impact-flight.js';
import {
  INITIAL_BACKSPIN_STATE,
  BACKSPIN_PARAMS,
  solveBackspinState,
  advanceMission,
  backspinSensitivity,
  buildCauseChain,
  realWorldRange,
  passesStoppingFlightTarget
} from './academy-backspin-model.js';
import { formatNumber, formatValue, formatSigned, speakValue } from './academy-readout-format.js';
import { pushSettledTrace, ghostRenderPlan } from './academy-trace-state.js';

const SURFACES = Object.freeze([
  { key:'mission', label:'Mission', next:'Enter the Spin Lab' },
  { key:'lab', label:'Lab', next:'Explore influence' },
  { key:'influence', label:'Influence', next:'Test the myths' },
  { key:'myths', label:'Myths', next:'Start Mastery Check' },
  { key:'mastery', label:'Mastery', next:'View result' },
  { key:'result', label:'Result', next:'Continue' }
]);

const PARAMETER_KEYS = Object.freeze(['dynamicLoft', 'attackAngle', 'ballSpeed']);

// Law 13: the trace is an instrument. Carry and apex scale against fixed
// engine-derived references (the maxima over the parameter corners), so
// different states draw honestly different arcs and ghosts become readable.
const TRACE_REFERENCE = (() => {
  let carry = 1;
  let apex = 1;
  for (const dynamicLoft of [BACKSPIN_PARAMS.dynamicLoft.min, BACKSPIN_PARAMS.dynamicLoft.max]) {
    for (const attackAngle of [BACKSPIN_PARAMS.attackAngle.min, BACKSPIN_PARAMS.attackAngle.max]) {
      for (const ballSpeed of [BACKSPIN_PARAMS.ballSpeed.min, BACKSPIN_PARAMS.ballSpeed.max]) {
        try {
          const solved = solveBackspinState({ dynamicLoft, attackAngle, ballSpeed });
          carry = Math.max(carry, solved.carryM);
          apex = Math.max(apex, solved.apexM);
        } catch {
          // Non-finite corners are simply excluded from the reference.
        }
      }
    }
  }
  return Object.freeze({ carry, apex });
})();

const SHEETS = Object.freeze({
  mission: {
    eyebrow:'Mission',
    title:'Build, then cut',
    body:`<p>First build at least <strong>7,000 rpm</strong>. After that stage is credited, cut the same 7-iron model below <strong>3,500 rpm</strong>.</p><p>The low-spin stage is a delivery experiment. It is not a driver simulation.</p><p>Flightglass calculates Backspin as an outcome. The current flight fit does not feed that rpm value back into Carry, Apex or Landing Angle.</p>`
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
  wet: Object.freeze({
    label:'Wet face / ball', keep:[0.80, 0.85], source:'Andrew Rice, 2013',
    frac:'\u2248 15\u201320% less spin',
    line:'Water cuts friction \u2014 <b>15\u201320% less spin</b>, higher launch.',
    intro:'<span class="sa-em--ink">\u2248 15\u201320% less spin</span>, higher launch on wedge shots. These are external estimates for the Real-world layer \u2014 <span class="sa-em--ink">not the simulator</span>, which has no lie model.',
    test:'TrackMan, 54\u00B0 wedge, 50-yd shots: dry 6,603 rpm @ 25.4\u00B0 \u2192 wet ball 5,291 rpm @ 30.1\u00B0 (\u221220%). Urethane covers retain more wet spin than ionomer.',
    sourceFull:'Andrew Rice, "Wedges and Water", 2013 \u00B7 corroborated by MyGolfSpy Wet Wedge Test, 2022.'
  }),
  flyer: Object.freeze({
    label:'Flyer lie', keep:[0.35, 0.70], source:'USGA / Pate, 2020',
    frac:'\u2248 30\u201365% less spin',
    line:'Grass cuts friction \u2014 <b>spin drops a third to over half</b>.',
    intro:'<span class="sa-em--ink">\u2248 30\u201365% less spin</span>, launch up ~2\u00B0, longer carry and rollout. External estimates for the Real-world layer \u2014 <span class="sa-em--ink">not the simulator</span>.',
    test:'8-iron from light rough spun ~2,469 rpm vs a ~7,000\u20138,000 rpm baseline (\u224865% drop), yet carried farther. Grass between face and ball kills friction.',
    sourceFull:'USGA Spin Generation groove research 2006\u201307 (via Dave Pelz / Into The Grain); Bryan Pate Golf TrackMan test, 2020; Andrew Rice via Golf.com.'
  })
});

const MYTH_EXPERIMENTS = Object.freeze([
  Object.freeze({
    id:'ground',
    prompt:'Where is backspin actually created?',
    choices:Object.freeze(['Ground interaction', 'Face friction and spin loft']),
    answerIndex:1,
    before:Object.freeze({ dynamicLoft:30, attackAngle:-3, ballSpeed:120 }),
    after:Object.freeze({ dynamicLoft:30, attackAngle:-6, ballSpeed:120 }),
    explanation:'The ground adds no spin. A downward strike can widen spin loft and improve ball-first contact, but spin is created while the ball is on the face.'
  }),
  Object.freeze({
    id:'loft-alone',
    prompt:'Dynamic loft rises 4\u00B0, but attack angle also rises 4\u00B0. What happens to backspin?',
    choices:Object.freeze(['More', 'Same', 'Less']),
    answerIndex:1,
    before:Object.freeze({ dynamicLoft:30, attackAngle:-3, ballSpeed:120 }),
    after:Object.freeze({ dynamicLoft:34, attackAngle:1, ballSpeed:120 }),
    explanation:'Spin loft remains 33\u00B0, so this engine returns the same backspin.'
  }),
  Object.freeze({
    id:'more-is-better',
    prompt:'At fixed ball speed, what does this model show when spin rises past the iron window?',
    choices:Object.freeze(['Carry grows', 'Carry falls', 'Carry stays while apex and landing change']),
    answerIndex:2,
    before:Object.freeze({ dynamicLoft:30, attackAngle:-3, ballSpeed:120 }),
    after:Object.freeze({ dynamicLoft:44, attackAngle:-4, ballSpeed:120 }),
    explanation:'More engine Backspin does not numerically cause more current-engine Carry. Real spin affects flight; this fitted app model currently keeps rpm output and flight trajectory partly decoupled.'
  })
]);

const MASTERY_TASKS = Object.freeze([
  Object.freeze({
    id:'definition', kind:'choice', prompt:'Spin loft equals:',
    choices:Object.freeze(['Dynamic loft \u2212 attack angle', 'Dynamic loft + attack angle', 'Club speed \u00d7 face angle']),
    answerIndex:0, ability:'Define spin loft'
  }),
  Object.freeze({
    id:'compare', kind:'engine-compare', prompt:'Which delivery produces more backspin?',
    left:Object.freeze({ dynamicLoft:26, attackAngle:-2, ballSpeed:120 }),
    right:Object.freeze({ dynamicLoft:34, attackAngle:-4, ballSpeed:120 }),
    choices:Object.freeze(['Delivery A', 'Delivery B']), answerIndex:1,
    ability:'Compare model deliveries'
  }),
  Object.freeze({
    id:'reduce', kind:'engine-compare',
    prompt:'From 30\u00b0 loft and \u22121\u00b0 attack, which attack-angle change reduces spin loft?',
    left:Object.freeze({ dynamicLoft:30, attackAngle:3, ballSpeed:120 }),
    right:Object.freeze({ dynamicLoft:30, attackAngle:-5, ballSpeed:120 }),
    choices:Object.freeze(['Change attack to +3\u00b0', 'Change attack to \u22125\u00b0']), answerIndex:0,
    ability:'Reduce spin loft'
  }),
  Object.freeze({
    id:'honesty', kind:'choice', prompt:'The Wet range is:',
    choices:Object.freeze(['A solveFlight output', 'A measured value from this phone', 'A sourced real-world estimate']),
    answerIndex:2, ability:'Separate estimates from simulator truth'
  }),
  Object.freeze({
    id:'target', kind:'lab-target',
    prompt:'Create 6,800\u20137,400 rpm and keep modeled Landing Angle at or above 50\u00b0. Both are gates from the final live solveFlight() state.',
    ability:'Meet Backspin and Landing gates independently'
  })
]);

const MASTERY_TARGET_INITIAL = Object.freeze({ dynamicLoft:25, attackAngle:-3, ballSpeed:120 });
let masteryAttemptFallback = 0;

const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const clampSurface = value => Math.max(0, Math.min(SURFACES.length - 1,
  Number.isFinite(Number(value)) ? Math.floor(Number(value)) : 0));


function normalizeMasteryResults(summary) {
  const results = summary?.taskResults;
  if (!Array.isArray(results) || results.length !== MASTERY_TASKS.length) return null;
  return results.map(result => ({
    resolved:Boolean(result?.resolved),
    firstTry:Boolean(result?.resolved && result?.firstTry)
  }));
}

function isValidMasterySubmission(attemptId, submission) {
  if (!attemptId || submission?.attemptId !== attemptId || !submission?.summary) return false;
  const results = normalizeMasteryResults(submission.summary);
  if (!results || Number(submission.summary.total) !== MASTERY_TASKS.length) return false;
  const correct = results.filter(result => result.resolved).length;
  return Number(submission.summary.correct) === correct;
}

function createMasteryAttemptId() {
  try {
    const id = globalThis.crypto?.randomUUID?.();
    if (typeof id === 'string' && id) return id;
  } catch {}
  masteryAttemptFallback += 1;
  return `backspin-${Date.now().toString(36)}-${masteryAttemptFallback.toString(36)}`;
}

function sensitivityValue(delta) {
  return delta.displayDelta !== delta.rawDelta ? delta.rawDelta : delta.displayDelta;
}

function signedNumber(value) {
  return formatSigned(Math.round(value));
}

function influenceUnit(key) {
  return key === 'ballSpeed' ? 'rpm / mph' : 'rpm / degree';
}
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
          <strong data-readout>${formatNumber(safeXp)} XP</strong><span>Lv ${levelNumber} · ${levelTitle}</span>
        </div>
      </header>

      <div class="native-lesson__voice-slot" data-academy-voice-slot></div>

      <div class="native-lesson__pager" data-native-pager>
        <section class="native-lesson__surface native-lesson__surface--mission" data-surface="0" tabindex="-1" aria-labelledby="nativeMissionTitle">
          <div class="native-lesson__mission-copy">
            <p class="native-lesson__eyebrow">Academy · Flight</p>
            <h1 id="nativeMissionTitle">Backspin</h1>
            <p class="native-lesson__lede">Backspin is an outcome. Build the delivered-face-to-travel gap, then see how Ball Speed scales it.</p>
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
              <p class="native-lesson__support">One 7-iron preset · centered, clean/dry contact. Friction, grooves, moisture, strike location and ball/face properties are not modeled.</p>
            </div>
          </div>
        </section>

        <section class="native-lesson__surface native-lesson__surface--lab" data-surface="1" tabindex="-1" aria-labelledby="nativeLabTitle">
          <div class="native-lesson__surface-heading">
            <div><p class="native-lesson__eyebrow">7-iron · live engine</p><h2 id="nativeLabTitle">Spin Lab</h2></div>
            <button type="button" class="native-lesson__mission-pill" data-sheet="mission">Mission <span data-mission-count data-readout>0 / 2</span></button>
          </div>
          <div class="native-lesson__lab-visual">
            <canvas id="flightCanvas" aria-hidden="true"></canvas>
            <div id="flightFallback" class="native-lesson__flight-fallback" hidden aria-hidden="true">
              <svg viewBox="0 0 320 120" preserveAspectRatio="none"><path d="M8 108 C 82 18, 218 12, 312 108"/></svg>
            </div>
            <div class="native-lesson__truth">
              <span>Backspin</span>
              <output id="backspinTruth" data-readout>—</output><small>rpm</small>
              <div id="backspinBand" class="native-lesson__spin-band" data-band="iron">Iron spin window</div>
              <button type="button" class="native-lesson__truth-chip" data-sheet="spinLoft"><span id="labSpinLoft" data-spin-loft data-readout>—</span> spin loft</button>
            </div>
            <button type="button" id="backspinLimit" class="native-lesson__limit-chip" data-engine-limit hidden></button>
            <div id="realWorldEcho" class="native-lesson__real-world-echo" data-real-world-echo
              data-layer="real-world-estimate" hidden role="img">
              <strong data-real-world-echo-value data-readout></strong>
              <small data-real-world-echo-condition></small>
              <small data-real-world-echo-source></small>
            </div>
            <span class="native-lesson__trace-annotation" data-trace-annotation hidden aria-hidden="true">Apex <b data-annotation-value data-readout></b></span>
          </div>
          <div class="native-lesson__outcomes" aria-label="Engine outcomes">
            <button type="button" data-sheet="carry"><span>Carry</span><strong id="labCarry" data-carry data-readout>—</strong></button>
            <div><span>Height</span><strong id="labHeight" data-apex data-readout>—</strong></div>
            <div><span>Landing</span><strong id="labLanding" data-landing data-readout>—</strong></div>
          </div>
          <div class="native-lesson__lab-controls">
            <div class="native-lesson__chips" id="labParamTabs" role="radiogroup" aria-label="Choose an input">${paramButtons}</div>
            <label class="native-lesson__range-label" for="labRange"><span data-range-label>Dynamic loft</span><output data-range-value data-readout>25°</output></label>
            <input id="labRange" type="range" aria-describedby="causeChain">
            <div id="causeChain" class="native-lesson__cause" data-readout aria-label="Cause chain">Move one input to reveal the cause chain.</div>
          </div>
        </section>

        <section class="native-lesson__surface" data-surface="2" tabindex="-1" aria-labelledby="nativeInfluenceTitle">
          <div class="native-lesson__surface-heading">
            <div><p class="native-lesson__eyebrow">Current lab state</p><h2 id="nativeInfluenceTitle">Influence</h2></div>
            <span class="native-lesson__stamp" data-influence-stamp>Model roles</span>
          </div>
          <p class="native-lesson__support">SPIN LOFT · DIRECT GEOMETRIC DRIVER — Dynamic Loft and Attack are its components. BALL SPEED · MULTIPLICATIVE SCALER. FRICTION / STRIKE CONDITIONS · HELD OR NOT MODELED.</p>
          <div id="influenceBars" class="native-lesson__influence" role="group" aria-label="Backspin model roles and sensitivity"></div>
          <p id="influenceLimitNote" class="native-lesson__influence-limit" hidden></p>
          <div class="native-lesson__lie-control" role="radiogroup" aria-label="Surface condition">
            <button type="button" role="radio" data-lie="clean" aria-checked="true" tabindex="0">Clean</button>
            <button type="button" role="radio" data-lie="wet" aria-checked="false" tabindex="-1">Wet</button>
            <button type="button" role="radio" data-lie="flyer" aria-checked="false" tabindex="-1">Flyer</button>
          </div>
          <button type="button" id="realWorldRegister" class="native-lesson__real-world" data-sheet="realWorld" hidden>
            <span id="realWorldBand" class="native-lesson__real-world-band" data-real-world-band
              data-layer="real-world-estimate" aria-hidden="true">
              <span>Real-world estimate</span><strong data-real-world-band-value data-readout></strong>
              <small data-real-world-band-condition></small>
              <small data-real-world-band-source></small>
            </span>
          </button>
        </section>

        <section class="native-lesson__surface" data-surface="3" tabindex="-1" aria-labelledby="nativeMythsTitle">
          <div class="native-lesson__surface-heading">
            <div><p class="native-lesson__eyebrow">Predict · run · explain</p><h2 id="nativeMythsTitle">Myth experiments</h2></div>
            <span class="native-lesson__stamp" data-myth-count>0 / 3</span>
          </div>
          <div id="mythExperiment" class="native-lesson__experiment"
            data-experiment-index="0" data-answered="false"></div>
        </section>

        <section class="native-lesson__surface" data-surface="4" tabindex="-1" aria-labelledby="nativeMasteryTitle">
          <div class="native-lesson__surface-heading">
            <div><p class="native-lesson__eyebrow">4 of 5 to master</p><h2 id="nativeMasteryTitle">Mastery Check</h2></div>
            <span class="native-lesson__stamp" data-mastery-step>Task 1 / 5</span>
          </div>
          <div id="masteryTask" class="native-lesson__mastery-task" data-mastery-task
            data-mastery-index="0" data-mastery-kind="choice" data-submitted="false">
          </div>
        </section>

        <section class="native-lesson__surface native-lesson__surface--result" data-surface="5" tabindex="-1" aria-labelledby="nativeResultTitle">
          <div id="nativeLessonResult" class="native-lesson__result" data-result-mastered="false" data-result-status="pending">
            <p class="native-lesson__eyebrow" data-result-eyebrow>Backspin result</p>
            <h2 id="nativeResultTitle" tabindex="-1">Your Backspin evidence</h2>
            <p data-result-copy>Complete the Mastery Check to see the ability you demonstrated.</p>
            <div class="native-lesson__result-summary" data-result-summary hidden>
              <strong data-result-score data-readout>0 / 5</strong>
              <span data-result-xp data-readout>+0 XP</span>
              <span data-result-rank hidden></span>
            </div>
            <div class="native-lesson__result-abilities" data-result-abilities hidden></div>
            <div class="native-lesson__result-preview" data-result-next-preview hidden>
              <span data-result-next-kicker>Next</span>
              <strong data-result-next-title>Continue your Academy goal</strong>
              <small data-result-next-copy></small>
            </div>
            <div class="native-lesson__result-actions">
              <button type="button" class="native-lesson__primary-action" data-action="next-lesson" hidden>Continue</button>
              <button type="button" class="native-lesson__primary-action" data-action="retry-mastery" hidden>Retry the check</button>
              <button type="button" class="native-lesson__secondary-action" data-action="back-to-path">Return to current goal</button>
            </div>
          </div>
        </section>
      </div>

      <div class="native-lesson__aperture" data-aperture hidden aria-hidden="true">
        <svg viewBox="0 0 96 96" focusable="false">
          <circle cx="48" cy="48" r="40" />
          <circle cx="48" cy="48" r="22" />
          <path d="M48 8 A40 40 0 0 1 82.6 68" />
        </svg>
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
    <aside id="lessonSheet" class="native-sheet" role="dialog" aria-modal="true" aria-labelledby="lessonSheetTitle" tabindex="-1" hidden>
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
    nextAction,
    onAnnounce,
    onDiagramTouched,
    onEngage,
    voiceTargets,
    onVoiceSurface,
    onVoiceMilestone,
    onVoiceInterrupt
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
    onDiagramTouched:callback(typeof onDiagramTouched === 'function' ? onDiagramTouched : onEngage),
    onVoiceSurface:callback(onVoiceSurface),
    onVoiceMilestone:callback(onVoiceMilestone),
    onVoiceInterrupt:callback(onVoiceInterrupt)
  };
  const getNextAction = typeof nextAction === 'function'
    ? nextAction
    : () => ({ label:'Return to current goal', route:'#/academy', title:'Academy Home', reason:'' });
  const cleanups = [];
  const timers = new Set();
  const frames = new Set();
  let destroyed = false;
  let settleTimer = null;
  let settleAnnounceTimer = null;
  let announceTimer = null;
  const announcementQueue = [];
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
    ghostTraces:[],
    lastValidSolved:initialSolved,
    mission:{ built:Boolean(journey?.mission?.built), cut:Boolean(journey?.mission?.built && journey?.mission?.cut) },
    myths:[false, false, false].map((value, index) => Boolean(journey?.myths?.[index] ?? value)),
    mythIndex:0,
    mythAnswers:Array(MYTH_EXPERIMENTS.length).fill(null),
    mastery:Array(MASTERY_TASKS.length).fill(null),
    masteryIndex:0,
    masteryAttemptId:journey?.masteryAttemptId || null,
    lastSubmission:journey?.lastSubmission || null,
    masteryTargetInput:{ ...MASTERY_TARGET_INITIAL },
    masteryTargetParam:'dynamicLoft',
    masteryTargetSolved:null,
    submitting:false,
    activeParam:'dynamicLoft',
    lie:'clean',
    influenceParam:null
  };
  const loadedSubmissionValid = isValidMasterySubmission(state.masteryAttemptId, state.lastSubmission);
  if (loadedSubmissionValid) {
    state.mastery = normalizeMasteryResults(state.lastSubmission.summary).map(result => ({
      correct:result.resolved,
      answerCount:result.firstTry ? 1 : 2
    }));
  } else {
    state.lastSubmission = null;
  }
  const normalizedLegacySurface = !(state.mission.built && state.mission.cut) && requestedSurface > 1;
  const firstUnfinishedMyth = state.myths.findIndex(value => !value);
  state.mythIndex = firstUnfinishedMyth >= 0 ? firstUnfinishedMyth : MYTH_EXPERIMENTS.length - 1;
  const normalizedIncompleteMythSurface = !normalizedLegacySurface &&
    requestedSurface > 3 && firstUnfinishedMyth >= 0;
  const normalizedInvalidResultSurface = !normalizedLegacySurface && !normalizedIncompleteMythSurface &&
    requestedSurface === 5 && !loadedSubmissionValid;
  if (normalizedLegacySurface) state.surface = 1;
  else if (normalizedIncompleteMythSurface) state.surface = 3;
  else if (normalizedInvalidResultSurface) state.surface = 4;
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

  const voiceTargetSelectors = Object.freeze({
    'backspin-spin-loft-chain':['.native-lesson__mission-card', '#causeChain'],
    'backspin-ball-speed':['.native-lesson__mission-card', '[data-param="ballSpeed"]'],
    'backspin-raw-rpm':['#backspinTruth'],
    'backspin-clamp-state':['.native-lesson__truth'],
    'backspin-held-assumption':['#causeChain'],
    'backspin-influence-roles':['#influenceBars'],
    'backspin-model-boundary':['#mythExperiment'],
    'backspin-mastery-gates':['#masteryTask'],
    'backspin-next-preview':['[data-result-next-preview]']
  });
  if (voiceTargets?.register) {
    for (const [id, selectors] of Object.entries(voiceTargetSelectors)) {
      const elements = selectors.flatMap(selector => [...lesson.querySelectorAll(selector)]);
      const clear = () => elements.forEach(element => {
        delete element.dataset.voiceEmphasis;
        delete element.dataset.voiceStatic;
      });
      const unregister = voiceTargets.register(id, {
        setEmphasis:({ kind, reducedMotion }) => {
          clear();
          const emphasized = elements.find(element => element.closest('.native-lesson__surface')?.getAttribute('aria-hidden') === 'false') || elements[0] || null;
          if (emphasized) {
            emphasized.dataset.voiceEmphasis = kind;
            emphasized.dataset.voiceStatic = String(reducedMotion);
          }
        },
        clear
      });
      cleanups.push(() => { clear(); unregister(); });
    }
  }

  function prefersReducedMotion() {
    try {
      return typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }

  function focusProgrammatically(target, focusOptions = { preventScroll:true }) {
    if (!(target instanceof HTMLElement) || destroyed || !target.isConnected) return;
    lesson.querySelectorAll('[data-programmatic-focus="true"]').forEach(element => {
      element.removeAttribute('data-programmatic-focus');
    });
    target.dataset.programmaticFocus = 'true';
    try { target.focus(focusOptions); } catch { target.focus(); }
  }

  function safeHaptic(method, ...args) {
    try {
      if (typeof sa?.[method] === 'function') return sa[method](...args);
    } catch {
      // Haptics are progressive enhancement and must never interrupt the lesson.
    }
    return undefined;
  }

  function setModelStatus(status) {
    lesson.dataset.modelStatus = status;
  }

  function rejectModelUpdate({ announceFailure=true } = {}) {
    setModelStatus('error');
    if (announceFailure) announce('Model could not update');
  }

  function showFlightFallback() {
    canvas.hidden = true;
    fallback.hidden = false;
    lesson.dataset.canvasMode = 'fallback';
  }

  function showFlightCanvas() {
    canvas.hidden = false;
    fallback.hidden = true;
    lesson.dataset.canvasMode = 'canvas';
  }

  lesson.dataset.reducedMotion = String(prefersReducedMotion());
  setModelStatus(initialSolved ? 'ready' : 'error');

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

  function flushAnnouncement() {
    announceTimer = null;
    const message = announcementQueue.shift();
    if (!message) return;
    try { callbacks.onAnnounce(message); } catch {
      // The renderer remains usable if the host live-region callback fails.
    }
    if (announcementQueue.length) {
      announceTimer = later(flushAnnouncement, 120);
    }
  }

  function announce(message) {
    const text = String(message || '').trim();
    if (!text) return;
    if (announcementQueue[announcementQueue.length - 1] === text) return;
    announcementQueue.push(text);
    if (announceTimer === null) {
      announceTimer = later(flushAnnouncement, 120);
    }
  }

  function persistJourney(patch, journeyOptions = {}) {
    try {
      const result = callbacks.onJourney(patch, journeyOptions);
      if (result && typeof result.catch === 'function') {
        result.catch(() => undefined);
      }
      return result;
    } catch {
      return null;
    }
  }

  function markDiagramTouched() {
    if (diagramTouched) return;
    diagramTouched = true;
    try { callbacks.onDiagramTouched(); } catch {
      // Engagement telemetry must not block model interaction.
    }
  }

  function safeSolve(input, { announceFailure=true } = {}) {
    try {
      const candidate = Object.fromEntries(PARAMETER_KEYS.map(key => [key, Number(input?.[key])]));
      const solved = solveBackspinState(candidate);
      state.input = candidate;
      state.lastValidInput = { ...candidate };
      state.lastValidSolved = solved;
      setModelStatus('ready');
      return solved;
    } catch {
      state.input = { ...state.lastValidInput };
      if (range && BACKSPIN_PARAMS[state.activeParam]) {
        range.value = String(state.input[state.activeParam]);
      }
      rejectModelUpdate({ announceFailure });
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
    if (destroyed) return false;
    if (!solved) {
      showFlightFallback();
      return false;
    }
    try {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      const context = canvas.getContext('2d');
      if (!context) throw new TypeError('Canvas context unavailable');
      const ratio = Math.min(2, Number(window.devicePixelRatio) || 1);
      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      const styles = getComputedStyle(lesson);
      const padX = 14;
      const baseY = height - 17;
      const plotWidth = width - padX * 2;
      const plotHeight = Math.max(42, height - 48);
      const accentColor = styles.getPropertyValue('--accent').trim() || '#FF8A4D';
      const secondaryColor = styles.getPropertyValue('--secondary').trim() || '#9D8BFF';
      const lineColor = styles.getPropertyValue('--line').trim() || 'rgba(255,255,255,.1)';
      // Law 13 scale: each trace spans carry/apex relative to the fixed
      // engine reference, so states and ghosts compare honestly.
      const carrySpan = (trace) => plotWidth * (trace.carryM / TRACE_REFERENCE.carry);
      const apexSpan = (trace) => plotHeight * (trace.apexM / TRACE_REFERENCE.apex);
      const draw = (trace, stroke, lineWidth, dashed=false) => {
        const points = trajectorySamples(trace.flight, 48);
        if (!Array.isArray(points) || !points.length || points.some(point =>
          !Number.isFinite(point?.d) || !Number.isFinite(point?.h))) {
          throw new RangeError('Trajectory returned a non-finite point');
        }
        if (!Number.isFinite(trace.carryM) || !Number.isFinite(trace.apexM)) {
          throw new RangeError('Trace scale requires finite carry and apex');
        }
        context.beginPath();
        context.setLineDash(dashed ? [5, 7] : []);
        points.forEach((point, index) => {
          const x = padX + point.d * carrySpan(trace);
          const y = baseY - point.h * apexSpan(trace);
          if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
        });
        context.strokeStyle = stroke;
        context.lineWidth = lineWidth;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.stroke();
      };
      // Tick ruler on the baseline: one tick per 25 m of the reference span.
      context.setLineDash([]);
      context.strokeStyle = lineColor;
      context.lineWidth = 1;
      for (let meters = 0; meters <= TRACE_REFERENCE.carry; meters += 25) {
        const x = padX + (meters / TRACE_REFERENCE.carry) * plotWidth;
        context.beginPath();
        context.moveTo(x, baseY + 0.5);
        context.lineTo(x, baseY - 3.5);
        context.stroke();
      }
      // Law 12: phosphor ghosts — previous settled states decay on the trace
      // only. Reduced motion keeps the single static comparison ghost.
      const reducedMotion = prefersReducedMotion();
      const ghostCandidates = reducedMotion
        ? [state.previousSettled]
        : [state.previousSettled, ...state.ghostTraces]
          .filter(ghost => ghost !== solved);
      const ghostPlan = ghostRenderPlan(ghostCandidates, { reducedMotion });
      const ghostColor = styles.getPropertyValue('--ghost').trim() || '#A7A0C4';
      for (const ghost of ghostPlan) {
        context.globalAlpha = ghost.opacity;
        draw(ghost.trace, ghostColor, 1.5, ghost.dashed);
      }
      context.globalAlpha = 1;
      lesson.dataset.ghostCount = String(ghostPlan.length);
      draw(solved, accentColor, 2.5);
      context.setLineDash([]);
      context.beginPath();
      context.moveTo(padX, baseY + .5);
      context.lineTo(width - padX, baseY + .5);
      context.strokeStyle = lineColor;
      context.lineWidth = 1;
      context.stroke();
      // The landing point is the only marker on the trace.
      const landingX = padX + carrySpan(solved);
      context.beginPath();
      context.arc(landingX, baseY, 3.5, 0, Math.PI * 2);
      context.fillStyle = accentColor;
      context.fill();
      // Annotation right: one dashed violet leader at the apex; its value is
      // engine truth and therefore renders in ember (never violet), with the
      // Height readout as its always-announced DOM twin.
      const apexX = padX + 0.52 * carrySpan(solved);
      const apexY = baseY - apexSpan(solved);
      context.setLineDash([3, 5]);
      context.strokeStyle = secondaryColor;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(apexX, apexY - 5);
      context.lineTo(apexX, apexY - 20);
      context.stroke();
      context.setLineDash([]);
      const annotation = lesson.querySelector('[data-trace-annotation]');
      if (annotation) {
        annotation.hidden = false;
        annotation.querySelector('[data-annotation-value]').textContent =
          formatValue(solved.apexM, ' m');
        annotation.style.left = `${Math.round(apexX - annotation.offsetWidth / 2)}px`;
        annotation.style.top = `${Math.round(Math.max(6, apexY - 42))}px`;
      }
      lesson.dataset.traceSignature = 'ruler,landing,annotation';
      showFlightCanvas();
      return true;
    } catch {
      showFlightFallback();
      return false;
    }
  }
  function renderLab() {
    const solved = safeSolve(state.input, { announceFailure:false }) || state.lastValidSolved;
    if (!solved) {
      showFlightFallback();
      return;
    }
    lesson.querySelector('#backspinTruth').textContent = formatNumber(solved.rpm);
    lesson.querySelector('[data-spin-loft]').textContent = formatValue(solved.spinLoft, '°');
    lesson.querySelector('[data-carry]').textContent = formatValue(solved.carryM, ' m');
    lesson.querySelector('[data-apex]').textContent = formatValue(solved.apexM, ' m');
    lesson.querySelector('[data-landing]').textContent = formatValue(solved.landingAngle, '°');
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
    range.setAttribute('aria-valuetext', speakValue(state.input[state.activeParam], parameter.unit));
    lesson.querySelector('[data-range-label]').textContent = parameter.label;
    lesson.querySelector('[data-range-value]').textContent =
      formatValue(state.input[state.activeParam], parameter.unit);
    lesson.querySelectorAll('[data-param]').forEach(button => {
      const active = button.dataset.param === state.activeParam;
      button.setAttribute('aria-checked', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    drawTrajectory(solved);
    renderRealWorld(solved.rpm);
  }

  function renderInfluence() {
    let sensitivity;
    const solved = safeSolve(state.input);
    try {
      sensitivity = backspinSensitivity(state.input);
      const finite = PARAMETER_KEYS.every(key =>
        Number.isFinite(sensitivity?.[key]?.displayDelta) && Number.isFinite(sensitivity?.[key]?.rawDelta));
      if (!finite) throw new RangeError('Sensitivity returned a non-finite value');
    } catch {
      sensitivity = null;
      rejectModelUpdate();
    }
    const container = lesson.querySelector('#influenceBars');
    const limitNote = lesson.querySelector('#influenceLimitNote');
    if (!sensitivity || !solved) {
      container.textContent = 'Sensitivity unavailable.';
      limitNote.hidden = true;
      return;
    }
    const ranked = PARAMETER_KEYS.map(key => {
      const delta = sensitivity[key];
      const value = sensitivityValue(delta);
      return { key, value, delta, usesRaw:delta.displayDelta !== delta.rawDelta };
    }).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    const peak = Math.max(1, ...ranked.map(item => Math.abs(item.value)));
    container.innerHTML = ranked.map((item, index) => {
      const magnitude = Math.round(Math.abs(item.value));
      const direction = item.value >= 0 ? '+' : '−';
      const unit = item.key === 'ballSpeed' ? 'rpm / mph' : 'rpm / degree';
      return `<button type="button" class="native-lesson__influence-row" data-influence="${item.key}">
        <span class="native-lesson__rank">${index + 1}</span>
        <span class="native-lesson__influence-label">${BACKSPIN_PARAMS[item.key].label}<small data-readout>${direction}${formatNumber(magnitude)} ${unit}</small></span>
        <span class="native-lesson__bar" aria-hidden="true"><i style="width:${Math.max(8, Math.round(Math.abs(item.value) / peak * 100))}%"></i></span>
      </button>`;
    }).join('');
    container.dataset.limit = solved.displayLimit || 'none';
    container.querySelectorAll('[data-influence]').forEach(button => {
      const key = button.dataset.influence;
      const item = ranked.find(candidate => candidate.key === key);
      const contract = BACKSPIN_PARAMS[key];
      if (!item || !contract) return;
      const detailId = `influenceDetail-${key}`;
      const expanded = state.influenceParam === key;
      const direction = item.value >= 0 ? 'Increases' : 'Decreases';
      const rawExplanation = item.usesRaw
        ? ' Uses underlying model sensitivity because the one-unit sample reaches a display limit.'
        : '';
      button.dataset.influenceParam = key;
      button.setAttribute('aria-expanded', String(expanded));
      if (expanded) button.setAttribute('aria-controls', detailId);
      else button.removeAttribute('aria-controls');
      button.setAttribute('aria-label', `${contract.label}. ${direction} backspin by ${formatNumber(Math.round(Math.abs(item.value)))} ${influenceUnit(key)}.${rawExplanation} ${expanded ? 'Hide' : 'Show'} A/B comparison.`);
      const valueNode = button.querySelector('.native-lesson__influence-label small');
      if (valueNode) valueNode.textContent = `${signedNumber(item.value)} ${influenceUnit(key)}`;

      const baseInput = { ...state.lastValidInput };
      const sampleDirection = baseInput[key] >= contract.max ? -1 : 1;
      const sampleInput = { ...baseInput, [key]:baseInput[key] + sampleDirection * contract.step };
      const base = solved;
      const normalizedDisplay = item.delta.displayDelta;
      const normalizedRaw = item.delta.rawDelta;
      const normalized = normalizedDisplay !== normalizedRaw ? normalizedRaw : normalizedDisplay;
      const sample = {
        rpm:base.rpm + normalizedDisplay * sampleDirection,
        rawRpm:base.rawRpm + normalizedRaw * sampleDirection
      };
      const inputSuffix = key === 'ballSpeed' ? ' mph' : contract.unit;
      const rawBase = base.rawRpm !== base.rpm
        ? `<small data-readout>Raw ${formatNumber(base.rawRpm)} rpm</small>` : '';
      const rawSample = sample.rawRpm !== sample.rpm
        ? `<small data-readout>Raw ${formatNumber(sample.rawRpm)} rpm</small>` : '';
      const rawCopy = normalizedDisplay !== normalizedRaw
        ? ' (underlying raw model; displayed value is limited)'
        : '';
      if (expanded) button.insertAdjacentHTML('afterend', `<div id="${detailId}" class="native-lesson__influence-detail"
        data-influence-detail="${key}" data-influence-comparison="${key}"
        data-base-value="${baseInput[key]}" data-sample-value="${sampleInput[key]}"
        data-normalized-delta="${normalized}" data-display-delta="${normalizedDisplay}"
        data-raw-delta="${normalizedRaw}" data-sample-direction="${sampleDirection}"
        role="region" aria-label="${escapeHtml(contract.label)} A/B engine comparison">
        <div class="native-lesson__influence-states">
          <div data-influence-a><span>A &middot; ${escapeHtml(contract.label)} <span data-readout>${escapeHtml(formatValue(baseInput[key], inputSuffix))}</span></span><strong data-readout>${formatNumber(base.rpm)} rpm</strong>${rawBase}</div>
          <div data-influence-b><span>B &middot; ${escapeHtml(contract.label)} <span data-readout>${escapeHtml(formatValue(sampleInput[key], inputSuffix))}</span></span><strong data-readout>${formatNumber(sample.rpm)} rpm</strong>${rawSample}</div>
        </div>
        <p data-influence-effect data-readout>Equivalent +1${escapeHtml(inputSuffix)} sensitivity: ${signedNumber(normalized)} rpm${rawCopy}.</p>
      </div>`);
    });
    const usesRaw = ranked.some(item => item.usesRaw);
    container.dataset.rawSensitivity = String(usesRaw);
    const limitCopy = solved.displayLimit === 'ceiling'
      ? 'Underlying model sensitivity \u00B7 display capped at 9,000 rpm'
      : solved.displayLimit === 'floor'
        ? 'Underlying model sensitivity \u00B7 display floored at 1,500 rpm'
        : usesRaw
          ? 'Underlying model sensitivity \u00B7 a one-unit sample reaches a display limit'
          : '';
    limitNote.hidden = !limitCopy;
    limitNote.textContent = limitCopy;
    container.setAttribute('aria-description', limitCopy || 'Simulator sensitivity at the current state.');
    if (limitCopy) container.setAttribute('aria-describedby', 'influenceLimitNote');
    else container.removeAttribute('aria-describedby');
    renderRealWorld(solved.rpm);
  }

  function renderRealWorld(rpm) {
    const register = lesson.querySelector('#realWorldRegister');
    const band = lesson.querySelector('#realWorldBand');
    const echo = lesson.querySelector('#realWorldEcho');
    const stamp = lesson.querySelector('[data-influence-stamp]');
    lesson.querySelectorAll('[data-lie]').forEach(button => {
      const active = button.dataset.lie === state.lie;
      button.setAttribute('aria-checked', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    if (state.lie === 'clean') {
      stamp.textContent = 'Simulator ranking';
      register.hidden = true;
      register.removeAttribute('aria-label');
      band.removeAttribute('data-low');
      band.removeAttribute('data-high');
      band.removeAttribute('data-source');
      band.removeAttribute('data-condition');
      band.querySelector('[data-real-world-band-value]').textContent = '';
      band.querySelector('[data-real-world-band-condition]').textContent = '';
      band.querySelector('[data-real-world-band-source]').textContent = '';
      echo.hidden = true;
      echo.removeAttribute('aria-label');
      echo.removeAttribute('data-condition');
      echo.querySelector('[data-real-world-echo-value]').textContent = '';
      echo.querySelector('[data-real-world-echo-condition]').textContent = '';
      echo.querySelector('[data-real-world-echo-source]').textContent = '';
      return;
    }
    stamp.textContent = 'Real-world estimate active';
    const estimate = LIE_ESTIMATES[state.lie];
    const rangeEstimate = realWorldRange(rpm, estimate.keep);
    register.hidden = false;
    const rangeCopy = `\u2248 ${formatNumber(rangeEstimate.low)}\u2013${formatNumber(rangeEstimate.high)} rpm`;
    const semanticCopy = `Approximate real-world estimate for ${estimate.label}: ${formatNumber(rangeEstimate.low)} to ${formatNumber(rangeEstimate.high)} rpm. Source: ${estimate.source}; not the simulator.`;
    register.setAttribute('aria-label', `${semanticCopy} Open source sheet.`);
    band.dataset.low = String(rangeEstimate.low);
    band.dataset.high = String(rangeEstimate.high);
    band.dataset.source = estimate.source;
    band.dataset.condition = state.lie;
    band.querySelector('[data-real-world-band-value]').textContent = rangeCopy;
    band.querySelector('[data-real-world-band-condition]').textContent = estimate.label;
    band.querySelector('[data-real-world-band-source]').textContent = `Real-world estimate \u00B7 ${estimate.source} \u00B7 not the simulator`;
    echo.hidden = false;
    echo.dataset.condition = state.lie;
    echo.setAttribute('aria-label', semanticCopy);
    echo.querySelector('[data-real-world-echo-value]').textContent = rangeCopy;
    echo.querySelector('[data-real-world-echo-condition]').textContent = estimate.label;
    echo.querySelector('[data-real-world-echo-source]').textContent = `${estimate.source} \u00B7 not the simulator`;
  }

  function mythRunAttributes(solved) {
    return `data-rpm="${solved.rpm}" data-raw-rpm="${solved.rawRpm}" ` +
      `data-spin-loft="${solved.spinLoft}" data-carry="${solved.carryM}" ` +
      `data-apex="${solved.apexM}" data-landing="${solved.landingAngle}" ` +
      `data-display-limit="${solved.displayLimit || 'none'}"`;
  }

  function mythBackspinMetric(solved) {
    const limit = solved.displayLimit === 'ceiling'
      ? `<small>Raw ${formatNumber(solved.rawRpm)} rpm \u00B7 display ceiling</small>`
      : '<small>Engine output</small>';
    return `<span class="native-lesson__myth-metric-value" data-myth-metric="backspin"
      data-rpm="${solved.rpm}" data-raw-rpm="${solved.rawRpm}"
      data-display-limit="${solved.displayLimit || 'none'}">
      <strong data-readout>${formatNumber(solved.rpm)} rpm</strong>${limit}</span>`;
  }

  function mythMetricRows(experiment, input, solved) {
    if (experiment.id !== 'more-is-better') {
      return `
        <li style="--myth-beat:0"><span><b>01</b> Delivery</span>
          <strong data-myth-metric="delivery" data-dynamic-loft="${input.dynamicLoft}"
            data-attack-angle="${input.attackAngle}" data-ball-speed="${input.ballSpeed}">
            ${input.dynamicLoft}\u00B0 / ${input.attackAngle >= 0 ? '+' : '\u2212'}${Math.abs(input.attackAngle)}\u00B0</strong></li>
        <li style="--myth-beat:1"><span><b>02</b> Spin loft</span>
          <strong data-myth-metric="spin-loft">${solved.spinLoft}\u00B0</strong></li>
        <li style="--myth-beat:2"><span><b>03</b> Backspin</span>${mythBackspinMetric(solved)}</li>`;
    }
    return `
      <li style="--myth-beat:0"><span><b>01</b> Backspin</span>${mythBackspinMetric(solved)}</li>
      <li style="--myth-beat:1"><span><b>02</b> Carry</span>
        <strong data-myth-metric="carry">${solved.carryM} m</strong></li>
      <li class="native-lesson__myth-shape" style="--myth-beat:2"><span><b>03</b> Flight shape</span>
        <span class="native-lesson__myth-shape-values">
          <strong data-myth-metric="apex">${solved.apexM} m apex</strong>
          <strong data-myth-metric="landing">${solved.landingAngle}\u00B0 landing</strong>
        </span></li>`;
  }

  function renderMythRun(kind, experiment, input, solved) {
    const label = kind === 'before' ? 'Run A' : 'Run B';
    const signedAttack = `${input.attackAngle >= 0 ? '+' : '\u2212'}${Math.abs(input.attackAngle)}\u00B0`;
    return `<article class="native-lesson__myth-run" data-myth-run="${kind}" ${mythRunAttributes(solved)}>
      <header><span>${label}</span><small>${input.dynamicLoft}\u00B0 loft \u00B7 ${signedAttack} attack \u00B7 ${input.ballSpeed} mph</small></header>
      <ol>${mythMetricRows(experiment, input, solved)}</ol>
    </article>`;
  }

  function solveMythRuns(experiment) {
    try {
      const runs = {
        before:solveBackspinState(experiment.before),
        after:solveBackspinState(experiment.after)
      };
      setModelStatus('ready');
      return runs;
    } catch {
      setModelStatus('error');
      return null;
    }
  }

  function mythEvidence(experiment, { animate=false, runs=null } = {}) {
    const solvedRuns = runs || solveMythRuns(experiment);
    if (!solvedRuns) {
      return `<div class="native-lesson__myth-evidence" data-myth-evidence role="region" aria-label="Engine evidence unavailable">
        <p class="native-lesson__myth-explanation">Engine evidence is temporarily unavailable.</p>
      </div>`;
    }
    const { before, after } = solvedRuns;
    return `<div class="native-lesson__myth-evidence" data-myth-evidence
      data-reveal="${animate ? 'sequence' : 'instant'}" role="region" aria-label="Two real engine runs">
      <p class="native-lesson__myth-evidence-label">Two real engine runs</p>
      <div class="native-lesson__myth-runs">
        ${renderMythRun('before', experiment, experiment.before, before)}
        ${renderMythRun('after', experiment, experiment.after, after)}
      </div>
      <p class="native-lesson__myth-explanation" data-myth-explanation>${escapeHtml(experiment.explanation)}</p>
    </div>`;
  }

  function renderMyth({ animate=false, runs=null } = {}) {
    const complete = state.myths.filter(Boolean).length;
    const index = Math.max(0, Math.min(MYTH_EXPERIMENTS.length - 1, state.mythIndex));
    const experiment = MYTH_EXPERIMENTS[index];
    const selected = state.mythAnswers[index];
    const answered = state.myths[index];
    const correct = selected === experiment.answerIndex;
    const experimentNode = lesson.querySelector('#mythExperiment');
    lesson.querySelector('[data-myth-count]').textContent = `${complete} / ${MYTH_EXPERIMENTS.length}`;
    experimentNode.dataset.experimentIndex = String(index);
    experimentNode.dataset.experimentId = experiment.id;
    experimentNode.dataset.answered = String(answered);
    if (selected === null) experimentNode.removeAttribute('data-correct');
    else experimentNode.dataset.correct = String(correct);

    const choices = experiment.choices.map((choice, choiceIndex) => {
      const isSelected = selected === choiceIndex;
      const isAnswer = answered && choiceIndex === experiment.answerIndex;
      const outcome = isSelected ? (correct ? 'correct' : 'incorrect') : (isAnswer ? 'answer' : 'idle');
      const answerLabel = isAnswer ? ' Engine-supported answer.' : '';
      const selectedLabel = isSelected && !correct ? ' Your prediction; not supported by the runs.' : '';
      return `<button type="button" role="radio" data-myth-choice="${choiceIndex}"
        data-outcome="${outcome}" aria-checked="${isSelected}" aria-disabled="${answered}"
        aria-label="${escapeHtml(choice + answerLabel + selectedLabel)}"
        tabindex="${answered ? (isSelected ? '0' : '-1') : (choiceIndex === 0 ? '0' : '-1')}">
        ${escapeHtml(choice)}</button>`;
    }).join('');

    const verdict = answered
      ? `<p class="native-lesson__myth-verdict" data-myth-verdict data-correct="${selected === null ? 'unknown' : correct}">
          ${selected === null ? 'Evidence revealed' : (correct ? 'Prediction confirmed' : 'Not quite \u2014 run the evidence')}</p>`
      : '';
    experimentNode.innerHTML = `
      <p class="native-lesson__experiment-number">Experiment ${index + 1} of ${MYTH_EXPERIMENTS.length}</p>
      <h3 tabindex="-1" data-myth-prompt>${escapeHtml(experiment.prompt)}</h3>
      <div class="native-lesson__myth-choices" data-choice-count="${experiment.choices.length}"
        role="radiogroup" aria-label="Prediction choices">${choices}</div>
      ${verdict}
      ${answered ? mythEvidence(experiment, { animate, runs }) : '<div data-myth-evidence hidden></div>'}`;
  }

  function mythAnnouncement(experiment, correct, { before, after }) {
    const verdict = correct ? 'Prediction confirmed.' : 'Not quite. Follow the engine evidence.';
    if (experiment.id === 'ground') {
      return `${verdict} Spin loft changes from ${before.spinLoft} to ${after.spinLoft} degrees and backspin changes from ${formatNumber(before.rpm)} to ${formatNumber(after.rpm)} rpm.`;
    }
    if (experiment.id === 'loft-alone') {
      const spinLoft = before.spinLoft === after.spinLoft
        ? `stays at ${after.spinLoft} degrees` : `changes from ${before.spinLoft} to ${after.spinLoft} degrees`;
      const backspin = before.rpm === after.rpm
        ? `stays at ${formatNumber(after.rpm)} rpm` : `changes from ${formatNumber(before.rpm)} to ${formatNumber(after.rpm)} rpm`;
      return `${verdict} Spin loft ${spinLoft} and backspin ${backspin}.`;
    }
    const raw = after.displayLimit && after.rawRpm !== after.rpm
      ? ` Raw model spin is ${formatNumber(after.rawRpm)} rpm at the ${after.displayLimit}.` : '';
    const carry = before.carryM === after.carryM
      ? `stays at ${after.carryM} metres` : `changes from ${before.carryM} to ${after.carryM} metres`;
    const apex = before.apexM === after.apexM
      ? `stays at ${after.apexM} metres` : `changes from ${before.apexM} to ${after.apexM} metres`;
    const landing = before.landingAngle === after.landingAngle
      ? `stays at ${after.landingAngle} degrees` : `changes from ${before.landingAngle} to ${after.landingAngle} degrees`;
    return `${verdict} Displayed backspin changes from ${formatNumber(before.rpm)} to ${formatNumber(after.rpm)} rpm.${raw} Carry ${carry}, apex ${apex}, and landing ${landing}.`;
  }

  function answerMyth(choiceIndex) {
    const index = state.mythIndex;
    const experiment = MYTH_EXPERIMENTS[index];
    if (!experiment || state.myths[index] || !Number.isInteger(choiceIndex) ||
        choiceIndex < 0 || choiceIndex >= experiment.choices.length) return;
    const runs = solveMythRuns(experiment);
    if (!runs) {
      announce('Model could not update');
      return;
    }
    const correct = choiceIndex === experiment.answerIndex;
    state.mythAnswers[index] = choiceIndex;
    state.myths[index] = true;
    persistJourney({ myths:[...state.myths] }, { immediate:true });
    safeHaptic('impact', 'light');
    if (state.myths.every(Boolean)) state.unlockedSurface = Math.max(state.unlockedSurface, 4);
    renderMyth({ animate:!prefersReducedMotion(), runs });
    updateStepper();
    updateSurfaceNavigation();
    announce(mythAnnouncement(experiment, correct, runs));
    if (experiment.id === 'more-is-better') callbacks.onVoiceMilestone('model-boundary');
    nextFrame(() => focusProgrammatically(lesson.querySelector(`[data-myth-choice="${choiceIndex}"]`)));
  }


  function hasSubmittedMastery() {
    return isValidMasterySubmission(state.masteryAttemptId, state.lastSubmission);
  }

  function ensureMasteryAttempt() {
    if (typeof state.masteryAttemptId === 'string' && state.masteryAttemptId) return false;
    state.masteryAttemptId = createMasteryAttemptId();
    state.lastSubmission = null;
    state.mastery = Array(MASTERY_TASKS.length).fill(null);
    state.masteryIndex = 0;
    state.masteryTargetInput = { ...MASTERY_TARGET_INITIAL };
    state.masteryTargetParam = 'dynamicLoft';
    state.masteryTargetSolved = null;
    persistJourney({ surface:4, masteryAttemptId:state.masteryAttemptId, lastSubmission:null }, { immediate:true });
    return true;
  }

  function solveMasteryInput(input) {
    try {
      const solved = solveBackspinState(input);
      setModelStatus('ready');
      return solved;
    } catch {
      rejectModelUpdate();
      return null;
    }
  }

  function masteryProgress() {
    const completed = state.mastery.filter(Boolean).length;
    const items = MASTERY_TASKS.map((task, index) => {
      const record = state.mastery[index];
      const status = record ? (record.correct ? 'correct' : 'attempted') : 'open';
      return `<span data-mastery-progress-item="${index}" data-status="${status}"
        aria-label="Task ${index + 1}: ${status}">${index + 1}</span>`;
    }).join('');
    return `<div class="native-lesson__mastery-progress" data-mastery-progress
      aria-label="${completed} of ${MASTERY_TASKS.length} tasks answered">${items}</div>`;
  }

  function masteryComparison(task, record) {
    if (task.kind !== 'engine-compare' || !record) return '<div data-mastery-comparison hidden></div>';
    const runs = record.runs;
    if (!runs?.left || !runs?.right) {
      return '<div data-mastery-comparison data-revealed="true"><p>Engine evidence unavailable.</p></div>';
    }
    const delivery = (side, label, input, solved) => `
      <article class="native-lesson__mastery-run" data-mastery-engine-output="${side}"
        data-rpm="${solved.rpm}" data-spin-loft="${solved.spinLoft}"
        data-landing="${solved.landingAngle}">
        <span>${label} &middot; <span data-readout>${formatValue(input.dynamicLoft, '\u00b0')}</span> loft / <span data-readout>${formatSigned(input.attackAngle, '\u00b0')}</span> attack</span>
        <strong data-readout>${formatNumber(solved.rpm)} rpm</strong>
        <small data-readout>${formatValue(solved.spinLoft, '\u00b0')} spin loft</small>
      </article>`;
    return `<div class="native-lesson__mastery-comparison" data-mastery-comparison
      data-revealed="true" aria-label="Revealed engine outputs">
      ${delivery('left', 'Delivery A', task.left, runs.left)}
      ${delivery('right', 'Delivery B', task.right, runs.right)}
    </div>`;
  }

  function masteryChoiceTask(task, record) {
    const locked = Boolean(record?.correct);
    const choices = task.choices.map((choice, choiceIndex) => {
      const selected = record?.selected === choiceIndex;
      const supported = Boolean(record) && choiceIndex === task.answerIndex;
      const outcome = selected ? (record.correct ? 'correct' : 'incorrect') : (supported ? 'answer' : 'idle');
      const activeTab = locked ? selected : (selected || (!record && choiceIndex === 0));
      return `<button type="button" role="radio" data-mastery-choice="${choiceIndex}"
        data-outcome="${outcome}" aria-checked="${selected}" aria-disabled="${locked}"
        tabindex="${activeTab ? '0' : '-1'}">${escapeHtml(choice)}</button>`;
    }).join('');
    const feedback = !record ? '' : record.correct
      ? 'Engine-supported answer. This task is resolved.'
      : `Not yet. ${escapeHtml(task.choices[task.answerIndex])} is supported here. Try again, or continue with this result.`;
    return `
      <div class="native-lesson__mastery-choices" role="radiogroup"
        aria-label="Task ${state.masteryIndex + 1} choices">${choices}</div>
      ${masteryComparison(task, record)}
      <p class="native-lesson__mastery-feedback" data-mastery-feedback
        data-correct="${record ? String(record.correct) : 'unanswered'}" ${record ? '' : 'hidden'}>${feedback}</p>`;
  }

  function masteryTargetFailure(solved) {
    const unmet = [];
    if (solved.rpm < 6800) unmet.push({ distance:(6800 - solved.rpm) / 600, copy:'Raise backspin to at least 6,800 rpm.' });
    if (solved.rpm > 7400) unmet.push({ distance:(solved.rpm - 7400) / 600, copy:'Lower backspin to no more than 7,400 rpm.' });
    if (solved.landingAngle < 50) unmet.push({ distance:(50 - solved.landingAngle) / 5, copy:'Raise landing angle to at least 50\u00b0.' });
    unmet.sort((a, b) => a.distance - b.distance);
    return unmet[0]?.copy || 'Submit this state again.';
  }

  function masteryTargetTask(record) {
    const solved = solveMasteryInput(state.masteryTargetInput);
    if (solved) state.masteryTargetSolved = solved;
    const shown = solved || state.masteryTargetSolved;
    const locked = Boolean(record?.correct);
    const parameter = BACKSPIN_PARAMS[state.masteryTargetParam];
    const chips = PARAMETER_KEYS.map(key => {
      const active = key === state.masteryTargetParam;
      return `<button type="button" role="radio" data-mastery-param="${key}"
        aria-checked="${active}" aria-disabled="${locked}"
        tabindex="${active ? '0' : '-1'}">${escapeHtml(BACKSPIN_PARAMS[key].label)}</button>`;
    }).join('');
    const verdict = !record ? '' : record.correct
      ? `Target met: ${formatNumber(record.solved.rpm)} rpm and ${record.solved.landingAngle}\u00b0 landing.`
      : `Current submitted result: ${formatNumber(record.solved.rpm)} rpm and ${record.solved.landingAngle}\u00b0 landing. ${masteryTargetFailure(record.solved)}`;
    return `
      <div class="native-lesson__mastery-target" data-mastery-target data-locked="${locked}">
        <div class="native-lesson__mastery-target-readout" aria-label="Two independent gates from one live model state">
          <div data-mastery-gate="backspin"><span>Backspin · independent gate</span><strong data-mastery-rpm data-readout data-value="${shown?.rpm ?? ''}">${shown ? formatNumber(shown.rpm) : '\u2014'} rpm</strong></div>
          <div data-mastery-gate="landing"><span>Landing · independent gate</span><strong data-mastery-landing data-readout data-value="${shown?.landingAngle ?? ''}">${shown ? formatNumber(shown.landingAngle) : '\u2014'}\u00b0</strong></div>
        </div>
        <p class="native-lesson__support" data-mastery-gate-truth>Both rows are independent gates from this live solveFlight state.</p>
        <div class="native-lesson__mastery-params" role="radiogroup" aria-label="Choose target input">${chips}</div>
        <label class="native-lesson__range-label" for="masteryTargetRange">
          <span data-mastery-range-label>${escapeHtml(parameter.label)}</span>
          <output data-mastery-range-value data-readout>${formatValue(state.masteryTargetInput[state.masteryTargetParam], parameter.unit)}</output>
        </label>
        <input id="masteryTargetRange" data-mastery-range type="range"
          min="${parameter.min}" max="${parameter.max}" step="${parameter.step}"
          value="${state.masteryTargetInput[state.masteryTargetParam]}"
          aria-label="${escapeHtml(parameter.label)}"
          aria-valuetext="${escapeHtml(speakValue(state.masteryTargetInput[state.masteryTargetParam], parameter.unit))}"
          ${locked ? 'disabled' : ''}>
        <p class="native-lesson__mastery-target-feedback" data-mastery-target-feedback tabindex="-1"
          data-correct="${record ? String(record.correct) : 'unanswered'}" ${record ? '' : 'hidden'}>${verdict}</p>
        <button type="button" class="native-lesson__target-submit"
          data-action="submit-mastery-target" data-mastery-target-submit
          ${locked ? 'disabled' : ''}>${record && !record.correct ? 'Submit adjusted state' : 'Submit target state'}</button>
      </div>`;
  }

  function renderMastery() {
    const taskNode = lesson.querySelector('#masteryTask');
    const submitted = hasSubmittedMastery();
    taskNode.dataset.attempt = state.masteryAttemptId || '';
    taskNode.dataset.attemptId = state.masteryAttemptId || '';
    taskNode.dataset.submitted = String(submitted);
    taskNode.dataset.answered = String(state.mastery.filter(Boolean).length);
    if (submitted) {
      const summary = state.lastSubmission.summary;
      taskNode.dataset.masteryTask = 'submitted';
      taskNode.dataset.taskId = 'submitted';
      taskNode.dataset.taskIndex = String(state.masteryIndex);
      taskNode.dataset.masteryIndex = String(state.masteryIndex);
      taskNode.dataset.masteryKind = 'submitted';
      lesson.querySelector('[data-mastery-step]').textContent = 'Submitted';
      taskNode.innerHTML = `
        <p class="native-lesson__experiment-number">Attempt submitted</p>
        <h3 data-mastery-submitted tabindex="-1">This attempt is locked.</h3>
        <p>${Math.max(0, Number(summary.correct) || 0)} of ${MASTERY_TASKS.length} tasks were resolved. Results cannot be changed after submission.</p>
        ${masteryProgress()}
        <button type="button" class="native-lesson__primary-action" data-action="view-result">View result</button>`;
      return;
    }
    const index = Math.max(0, Math.min(MASTERY_TASKS.length - 1, state.masteryIndex));
    const task = MASTERY_TASKS[index];
    const record = state.mastery[index];
    taskNode.dataset.masteryTask = task.id;
    taskNode.dataset.masteryIndex = String(index);
    taskNode.dataset.taskId = task.id;
    taskNode.dataset.taskIndex = String(index);
    taskNode.dataset.masteryKind = task.kind;
    lesson.querySelector('[data-mastery-step]').textContent = `Task ${index + 1} / ${MASTERY_TASKS.length}`;
    const body = task.kind === 'lab-target' ? masteryTargetTask(record) : masteryChoiceTask(task, record);
    const continueAction = record
      ? `<button type="button" class="native-lesson__mastery-next" data-mastery-next
          data-action="${record.correct ? 'next-mastery-task' : 'continue-mastery-wrong'}">${record.correct
            ? (index === MASTERY_TASKS.length - 1 ? 'View result' : 'Next task')
            : 'Continue with this result'}</button>`
      : '';
    taskNode.innerHTML = `
      <p class="native-lesson__experiment-number">Task ${index + 1} of ${MASTERY_TASKS.length}</p>
      <h3 data-mastery-prompt tabindex="-1">${escapeHtml(task.prompt)}</h3>
      ${body}
      ${masteryProgress()}
      ${continueAction}`;
    taskNode.dataset.submitting = String(state.submitting);
    taskNode.querySelectorAll('button, input').forEach(control => {
      if (state.submitting) control.disabled = true;
    });
  }


  function updateHeaderFromSummary(summary) {
    const progress = lesson.querySelector('.native-lesson__progress');
    const summaryXp = Number.isFinite(Number(summary?.storeXp))
      ? Math.max(0, Math.floor(Number(summary.storeXp))) : Math.max(0, Math.floor(Number(xp) || 0));
    const displayXp = Math.max(Math.max(0, Math.floor(Number(xp) || 0)), summaryXp);
    const summaryLevel = summary?.levelInfo || {};
    const useSummaryLevel = summaryXp >= Number(xp || 0);
    const levelNumber = Math.max(1, Math.floor(Number(useSummaryLevel
      ? (summaryLevel.lvl ?? summaryLevel.number) : level?.number) || 1));
    const levelTitle = String(useSummaryLevel
      ? (summaryLevel.title || level?.title || 'Rookie') : (level?.title || 'Rookie'));
    progress.setAttribute('aria-label', `${displayXp} XP, level ${levelNumber}, ${levelTitle}`);
    progress.querySelector('strong').textContent = `${formatNumber(displayXp)} XP`;
    progress.querySelector('span').textContent = `Lv ${levelNumber} \u00b7 ${levelTitle}`;
  }

  function resultMastered(summary) {
    const correct = Math.max(0, Number(summary?.correct) || 0);
    const threshold = Math.max(1, Number(summary?.threshold) || 4);
    return Boolean(summary?.mastered) && correct >= threshold;
  }

  function renderResult() {
    const result = lesson.querySelector('#nativeLessonResult');
    const summary = hasSubmittedMastery() ? state.lastSubmission.summary : null;
    const summaryNode = result.querySelector('[data-result-summary]');
    const actions = result.querySelector('.native-lesson__result-actions');
    result.dataset.attempt = state.masteryAttemptId || '';
    result.dataset.attemptId = state.masteryAttemptId || '';
    if (!summary) {
      result.dataset.resultMastered = 'false';
      result.dataset.resultStatus = 'pending';
      summaryNode.hidden = true;
      result.querySelector('[data-result-abilities]').hidden = true;
      result.querySelector('[data-result-next-preview]').hidden = true;
      actions.innerHTML = '<button type="button" class="native-lesson__secondary-action" data-action="back-to-path">Return to current goal</button>';
      return;
    }
    const correct = Math.max(0, Number(summary.correct) || 0);
    const total = MASTERY_TASKS.length;
    const mastered = resultMastered(summary);
    const xpDelta = Math.max(0, Number(summary.totalDelta ?? summary.delta) || 0);
    const taskResults = normalizeMasteryResults(summary) || [];
    const abilities = MASTERY_TASKS
      .filter((task, index) => taskResults[index]?.resolved)
      .map(task => `<li data-result-ability>${escapeHtml(task.ability)}</li>`)
      .join('');
    const abilitiesNode = result.querySelector('[data-result-abilities]');
    const rank = result.querySelector('[data-result-rank]');
    result.dataset.resultMastered = String(mastered);
    result.dataset.resultStatus = mastered ? 'mastered' : 'complete';
    result.querySelector('[data-result-eyebrow]').textContent = mastered ? 'Backspin mastered' : 'Backspin complete';
    result.querySelector('[data-result-copy]').textContent = mastered
      ? 'You can build Spin Loft from delivered face and travel, then use Ball Speed to create a requested Backspin state in the Flightglass model.'
      : `${correct} of ${total} on the mastery check. Retry for mastery (4/5).`;
    summaryNode.hidden = false;
    summaryNode.querySelector('[data-result-score]').textContent = `${correct} / ${total}`;
    summaryNode.querySelector('[data-result-xp]').textContent = `+${formatNumber(xpDelta)} XP`;
    rank.hidden = !summary.leveledUp;
    rank.textContent = summary.leveledUp
      ? `Level ${summary.levelInfo?.lvl ?? summary.levelInfo?.number ?? ''} \u00b7 ${summary.levelInfo?.title || ''}`.trim()
      : '';
    abilitiesNode.hidden = false;
    abilitiesNode.innerHTML = mastered
      ? `<strong>VERIFIED</strong><ul>
          <li data-result-ability>Spin Loft components separated</li>
          <li data-result-ability>Backspin target created live</li>
          <li data-result-ability>Landing Angle gate met independently</li>
        </ul>`
      : `<strong>Abilities demonstrated</strong>${abilities
        ? `<ul>${abilities}</ul>`
        : '<p>No ability checks demonstrated yet.</p>'}`;
    const preview = result.querySelector('[data-result-next-preview]');
    preview.hidden = !mastered;
    let destination;
    try { destination = getNextAction() || {}; } catch { destination = {}; }
    const destinationLabel = String(destination.label || 'Return to current goal');
    const destinationTitle = String(destination.title || destinationLabel);
    if (mastered) {
      preview.querySelector('[data-result-next-title]').textContent = destinationTitle;
      preview.querySelector('[data-result-next-copy]').textContent = String(destination.preview || destination.reason || 'Continue from Academy Home.');
    }
    actions.innerHTML = mastered
      ? `<button type="button" class="native-lesson__primary-action" data-action="next-lesson">${escapeHtml(destinationLabel)}</button>
         <button type="button" class="native-lesson__secondary-action" data-action="back-to-path">Return to current goal</button>`
      : `<button type="button" class="native-lesson__primary-action" data-action="retry-mastery">Retry the check</button>
         <button type="button" class="native-lesson__secondary-action" data-action="back-to-path">Return to current goal</button>`;
    updateHeaderFromSummary(summary);
  }

  function answerMasteryChoice(choiceIndex) {
    if (state.submitting || hasSubmittedMastery()) return;
    const task = MASTERY_TASKS[state.masteryIndex];
    if (!task || task.kind === 'lab-target' || !Number.isInteger(choiceIndex) ||
        choiceIndex < 0 || choiceIndex >= task.choices.length) return;
    const prior = state.mastery[state.masteryIndex];
    if (prior?.correct) return;
    let runs = prior?.runs || null;
    if (task.kind === 'engine-compare' && !runs) {
      const left = solveMasteryInput(task.left);
      const right = solveMasteryInput(task.right);
      if (!left || !right) return;
      runs = { left, right };
    }
    const correct = choiceIndex === task.answerIndex;
    state.mastery[state.masteryIndex] = {
      selected:choiceIndex,
      correct,
      answerCount:(prior?.answerCount || 0) + 1,
      runs
    };
    renderMastery();
    updateSurfaceNavigation();
    announce(correct
      ? `Task ${state.masteryIndex + 1} resolved.`
      : `Task ${state.masteryIndex + 1} is not resolved. Try again, or continue with this result.`);
    nextFrame(() => focusProgrammatically(lesson.querySelector(`[data-mastery-choice="${choiceIndex}"]`)));
  }

  function selectMasteryTargetParameter(key) {
    if (!PARAMETER_KEYS.includes(key) || state.mastery[4]?.correct || state.submitting || hasSubmittedMastery()) return;
    state.masteryTargetParam = key;
    renderMastery();
    focusProgrammatically(lesson.querySelector(`[data-mastery-param="${key}"]`));
  }

  function updateMasteryTargetInput(input) {
    callbacks.onVoiceInterrupt('model-input');
    if (!(input instanceof HTMLInputElement) || state.mastery[4]?.correct || state.submitting || hasSubmittedMastery()) return;
    const key = state.masteryTargetParam;
    const value = input.valueAsNumber;
    if (!Number.isFinite(value)) {
      rejectModelUpdate();
      return;
    }
    const solved = solveMasteryInput({ ...state.masteryTargetInput, [key]:value });
    if (!solved) return;
    state.masteryTargetInput = { ...state.masteryTargetInput, [key]:value };
    state.masteryTargetSolved = solved;
    input.setAttribute('aria-valuetext', speakValue(value, BACKSPIN_PARAMS[key].unit));
    const valueNode = lesson.querySelector('[data-mastery-range-value]');
    if (valueNode) valueNode.textContent = formatValue(value, BACKSPIN_PARAMS[key].unit);
    const rpm = lesson.querySelector('[data-mastery-rpm]');
    const landing = lesson.querySelector('[data-mastery-landing]');
    if (rpm) {
      rpm.dataset.value = String(solved.rpm);
      rpm.textContent = `${formatNumber(solved.rpm)} rpm`;
    }
    if (landing) {
      landing.dataset.value = String(solved.landingAngle);
      landing.textContent = `${solved.landingAngle}\u00b0`;
    }
    markDiagramTouched();
    safeHaptic('tick', `mastery-${key}`);
  }

  function submitMasteryTarget() {
    if (state.submitting || hasSubmittedMastery() || state.mastery[4]?.correct) return;
    const solved = solveMasteryInput(state.masteryTargetInput);
    if (!solved) return;
    const prior = state.mastery[4];
    const correct = passesStoppingFlightTarget(state.masteryTargetInput);
    state.mastery[4] = {
      correct,
      answerCount:(prior?.answerCount || 0) + 1,
      solved,
      input:{ ...state.masteryTargetInput }
    };
    renderMastery();
    updateSurfaceNavigation();
    announce(correct
      ? `Stopping-flight target met at ${formatNumber(solved.rpm)} rpm and ${solved.landingAngle} degrees landing.`
      : `Target not met. ${formatNumber(solved.rpm)} rpm and ${solved.landingAngle} degrees landing. ${masteryTargetFailure(solved)}`);
    nextFrame(() => focusProgrammatically(lesson.querySelector('[data-mastery-target-feedback]')));
  }

  function normalizedCurrentMasteryResults() {
    return MASTERY_TASKS.map((task, index) => {
      const record = state.mastery[index];
      return {
        resolved:Boolean(record?.correct),
        firstTry:Boolean(record?.correct && record.answerCount === 1)
      };
    });
  }

  async function submitMasteryAttempt() {
    if (state.submitting) return;
    if (hasSubmittedMastery()) {
      setSurface(5, { persist:true, immediate:true, unlock:true });
      return;
    }
    if (!state.mastery.every(Boolean)) {
      announce('Answer every mastery task before opening Result.');
      return;
    }
    ensureMasteryAttempt();
    const attemptId = state.masteryAttemptId;
    const results = normalizedCurrentMasteryResults();
    state.submitting = true;
    renderMastery();
    updateSurfaceNavigation();
    try {
      const returned = await Promise.resolve(callbacks.onSubmit({ attemptId, results }));
      if (destroyed) return;
      if (!returned || typeof returned !== 'object') throw new TypeError('Mastery summary is required');
      const summary = { ...returned, taskResults:normalizeMasteryResults(returned) || results };
      const submission = { attemptId, summary };
      if (!isValidMasterySubmission(attemptId, submission)) throw new TypeError('Mastery summary is invalid');
      state.lastSubmission = submission;
      state.submitting = false;
      state.unlockedSurface = Math.max(state.unlockedSurface, 5);
      renderMastery();
      renderResult();
      updateStepper();
      updateSurfaceNavigation();
      const mastered = resultMastered(summary);
      announce(`Backspin ${mastered ? 'mastered' : 'complete'}. ${summary.correct} of ${MASTERY_TASKS.length}. Plus ${Math.max(0, Number(summary.totalDelta ?? summary.delta) || 0)} XP.`);
      if (mastered) callbacks.onVoiceMilestone('mastery-pass');
      setSurface(5, { persist:false, unlock:true });
    } catch {
      if (destroyed) return;
      state.submitting = false;
      renderMastery();
      updateSurfaceNavigation();
      announce('Result could not be saved. Try again.');
    }
  }

  function advanceMasteryTask() {
    if (state.submitting) return;
    if (hasSubmittedMastery()) {
      setSurface(5, { persist:true, immediate:true, unlock:true });
      return;
    }
    if (!state.mastery[state.masteryIndex]) {
      announce(state.masteryIndex === 4 ? 'Submit a target state first.' : 'Choose an answer first.');
      return;
    }
    if (state.masteryIndex < MASTERY_TASKS.length - 1) {
      state.masteryIndex += 1;
      renderMastery();
      updateSurfaceNavigation();
      nextFrame(() => focusProgrammatically(lesson.querySelector('[data-mastery-prompt]')));
      return;
    }
    void submitMasteryAttempt();
  }

  function retryMastery() {
    const summary = hasSubmittedMastery() ? state.lastSubmission.summary : null;
    if (summary && resultMastered(summary)) return;
    state.masteryAttemptId = createMasteryAttemptId();
    state.lastSubmission = null;
    state.mastery = Array(MASTERY_TASKS.length).fill(null);
    state.masteryIndex = 0;
    state.masteryTargetInput = { ...MASTERY_TARGET_INITIAL };
    state.masteryTargetParam = 'dynamicLoft';
    state.masteryTargetSolved = null;
    state.submitting = false;
    state.unlockedSurface = Math.min(state.unlockedSurface, 4);
    persistJourney({ surface:4, masteryAttemptId:state.masteryAttemptId, lastSubmission:null }, { immediate:true });
    renderMastery();
    renderResult();
    setSurface(4, { persist:false, unlock:true });
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
    const label = next.querySelector('[data-next-label]');
    const atStart = state.surface === 0;
    const missionBlocked = state.surface === 1 && !(state.mission.built && state.mission.cut);
    const mythBlocked = state.surface === 3 && !state.myths[state.mythIndex];
    const masteryBlocked = state.surface === 4 && !hasSubmittedMastery() && !state.mastery[state.masteryIndex];
    const blocked = missionBlocked || mythBlocked || masteryBlocked || state.submitting;
    previous.setAttribute('aria-disabled', String(atStart || state.submitting));
    previous.disabled = atStart || state.submitting;
    next.setAttribute('aria-disabled', String(blocked));
    next.disabled = blocked;
    next.toggleAttribute('data-myth-next', state.surface === 3);
    if (missionBlocked) {
      next.title = 'Complete both mission stages to continue';
      label.textContent = 'Complete the mission';
    } else if (mythBlocked) {
      next.title = 'Make a prediction to reveal the engine runs';
      label.textContent = 'Make a prediction';
    } else if (state.submitting) {
      next.title = 'Saving mastery result';
      label.textContent = 'Saving result\u2026';
    } else if (masteryBlocked) {
      next.title = state.masteryIndex === 4 ? 'Submit a target state first' : 'Choose an answer first';
      label.textContent = state.masteryIndex === 4 ? 'Submit a target state' : 'Choose an answer';
    } else if (state.surface === 4) {
      next.title = '';
      label.textContent = hasSubmittedMastery()
        ? 'View result'
        : (state.masteryIndex < MASTERY_TASKS.length - 1 ? 'Next task' : 'View result');
    } else if (state.surface === 5) {
      next.title = '';
      let destination;
      try { destination = getNextAction() || {}; } catch { destination = {}; }
      label.textContent = resultMastered(state.lastSubmission?.summary)
        ? String(destination.label || 'Return to current goal')
        : 'Retry the check';
    } else {
      next.title = '';
      label.textContent = state.surface === 3 && state.mythIndex < MYTH_EXPERIMENTS.length - 1
        ? 'Next Experiment' : SURFACES[state.surface].next;
    }
  }

  function runSurfaceTransition() {
    if (destroyed) return;
    if (prefersReducedMotion()) {
      lesson.dataset.lastTransition = 'fade';
      const active = lesson.querySelector(`.native-lesson__surface[data-surface="${state.surface}"]`);
      try {
        active?.animate?.([{ opacity: 0.55 }, { opacity: 1 }], { duration: 150, easing: 'ease-out' });
      } catch {
        // The fade is progressive enhancement; truth is already live.
      }
      return;
    }
    lesson.dataset.lastTransition = 'aperture';
    const overlay = lesson.querySelector('[data-aperture]');
    if (!overlay || typeof overlay.animate !== 'function') return;
    overlay.hidden = false;
    try {
      const animation = overlay.animate([
        { opacity: 0, transform: 'scale(.55) rotate(-40deg)' },
        { opacity: 1, transform: 'scale(1) rotate(0deg)', offset: 0.45 },
        { opacity: 0, transform: 'scale(1.22) rotate(18deg)' }
      ], { duration: 340, easing: 'cubic-bezier(.22, .72, .2, 1)' });
      const hide = () => { overlay.hidden = true; };
      animation.addEventListener('finish', hide);
      animation.addEventListener('cancel', hide);
    } catch {
      overlay.hidden = true;
    }
  }

  function setSurface(index, {
    focus=true,
    persist=true,
    immediate=false,
    unlock=false
  } = {}) {
    const target = clampSurface(index);
    if (target > 1 && !(state.mission.built && state.mission.cut)) return false;
    if (target > 3 && !state.myths.every(Boolean)) return false;
    if (target === 5 && !hasSubmittedMastery()) return false;
    if (target === 4 && !hasSubmittedMastery()) ensureMasteryAttempt();
    if (target === 4) renderMastery();
    if (unlock) state.unlockedSurface = Math.max(state.unlockedSurface, target);
    if (target > state.unlockedSurface) return false;
    if (target === 3 && state.surface !== 3) {
      const unfinished = state.myths.findIndex(value => !value);
      state.mythIndex = unfinished >= 0 ? unfinished : MYTH_EXPERIMENTS.length - 1;
      renderMyth();
    }
    const from = state.surface;
    state.surface = target;
    lesson.dataset.surface = String(target);
    pager.style.setProperty('--surface-x', `${target * -16.6666667}%`);
    lesson.querySelectorAll('.native-lesson__surface').forEach((surface, surfaceIndex) => {
      const active = surfaceIndex === target;
      surface.inert = !active;
      surface.setAttribute('aria-hidden', String(!active));
    });
    // Law 12: one signature transition. It starts only after the inert/
    // aria-hidden state has flipped synchronously, so focus and AT state
    // never wait on decoration (a11y review M1).
    if (from !== target) runSurfaceTransition();
    updateStepper();
    updateSurfaceNavigation();
    if (persist) persistJourney({ surface:target }, { immediate });
    if (target === 5) renderResult();
    if (focus) nextFrame(() => {
      if (target === 4) {
        focusProgrammatically(lesson.querySelector('[data-mastery-prompt], [data-mastery-submitted]'));
      } else if (target === 5) {
        focusProgrammatically(lesson.querySelector('#nativeResultTitle'));
      } else {
        focusProgrammatically(lesson.querySelector(`.native-lesson__surface[data-surface="${target}"]`));
      }
    });
    if (target === 1) nextFrame(() => drawTrajectory(state.lastValidSolved));
    if (target === 2) renderInfluence();
    callbacks.onVoiceSurface(target, { from, initial:from === target });
    return true;
  }

  function goNext() {
    if (state.surface === 1 && !(state.mission.built && state.mission.cut)) {
      announce('Complete both mission stages to continue.');
      return;
    }
    if (state.surface === 3) {
      if (!state.myths[state.mythIndex]) {
        announce('Make a prediction to reveal the engine runs.');
        return;
      }
      if (state.mythIndex < MYTH_EXPERIMENTS.length - 1) {
        state.mythIndex += 1;
        renderMyth();
        updateSurfaceNavigation();
        nextFrame(() => focusProgrammatically(lesson.querySelector('[data-myth-prompt]')));
        return;
      }
      if (!state.myths.every(Boolean)) {
        announce('Complete every myth experiment to continue.');
        return;
      }
    }
    if (state.surface === 4) {
      advanceMasteryTask();
      return;
    }
    if (state.surface === 5) {
      if (resultMastered(state.lastSubmission?.summary)) callbacks.onNextLesson();
      else retryMastery();
      return;
    }
    setSurface(state.surface + 1, { unlock:true, immediate:true });
  }

  function goPrevious() {
    if (state.surface === 3 && state.mythIndex > 0) {
      state.mythIndex -= 1;
      renderMyth();
      updateSurfaceNavigation();
      nextFrame(() => focusProgrammatically(lesson.querySelector('[data-myth-prompt]')));
      return;
    }
    if (state.surface > 0) setSurface(state.surface - 1, { immediate:true });
  }

  function focusableInSheet() {
    return [...sheet.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter(element => !element.hidden && element.getClientRects().length > 0);
  }

  function realWorldSheetContent() {
    const estimate = LIE_ESTIMATES[state.lie];
    const solved = state.lastValidSolved;
    if (!estimate || !solved) return SHEETS.realWorld;
    const rangeEstimate = realWorldRange(solved.rpm, estimate.keep);
    const rangeCopy = `\u2248 ${formatNumber(rangeEstimate.low)}\u2013${formatNumber(rangeEstimate.high)} rpm`;
    return {
      eyebrow:'Real-world estimate',
      title:estimate.label,
      body:`<p>${estimate.intro}</p>
        <div class="native-sheet__estimate" data-real-world-sheet-estimate>
          <span>Real-world estimate &middot; ${escapeHtml(estimate.source)}</span>
          <strong>${rangeCopy}</strong><small>${escapeHtml(estimate.label)} &middot; not the simulator</small>
        </div>
        <p class="native-sheet__estimate-line">${estimate.line}</p>
        <figure class="native-sheet__media" data-real-world-media>
          <img src="assets/rw-backspin-green-bite.jpg" data-real-world-image alt="A golf ball biting and checking up on a green">
          <figcaption>Reality: the ball bites. Spin loft is <em>why</em> \u2014 a bad lie is why it sometimes will not.</figcaption>
        </figure>
        <p class="native-sheet__not-simulator">Real-world estimate \u2014 not the simulator</p>
        <div class="native-sheet__evidence"><strong>Test</strong><p>${escapeHtml(estimate.test)}</p></div>
        <div class="native-sheet__evidence"><strong>Source</strong><p>${escapeHtml(estimate.sourceFull)}</p></div>`
    };
  }

  function openSheet(key, opener=document.activeElement) {
    const content = key === 'realWorld' ? realWorldSheetContent() : SHEETS[key];
    if (!content || !sheet.hidden) return;
    lastFocus = opener instanceof HTMLElement ? opener : null;
    sheet.querySelector('[data-sheet-eyebrow]').textContent = content.eyebrow;
    sheet.querySelector('[data-sheet-body]').innerHTML = content.body;
    sheet.querySelector('#lessonSheetTitle').textContent = content.title;
    sheet.scrollTop = 0;
    frame.inert = true;
    sheetScrim.hidden = false;
    sheet.removeAttribute('data-media-state');
    const realWorldImage = sheet.querySelector('[data-real-world-image]');
    if (realWorldImage) {
      const removeMedia = () => {
        if (!sheet.contains(realWorldImage)) return;
        realWorldImage.closest('[data-real-world-media]')?.remove();
        sheet.dataset.mediaState = 'unavailable';
      };
      sheet.dataset.mediaState = 'loading';
      listen(realWorldImage, 'load', () => {
        if (sheet.contains(realWorldImage)) sheet.dataset.mediaState = 'image';
      }, { once:true });
      listen(realWorldImage, 'error', removeMedia, { once:true });
      try {
        if (realWorldImage.complete) {
          if (realWorldImage.naturalWidth === 0) removeMedia();
          else sheet.dataset.mediaState = 'image';
        }
      } catch {
        removeMedia();
      }
    }
    sheet.hidden = false;
    nextFrame(() => {
      sheetScrim.classList.add('is-open');
      sheet.classList.add('is-open');
      sheet.scrollTop = 0;
      focusProgrammatically(sheet);
    });
  }

  function finishSheetClose({ restoreFocus=true } = {}) {
    sheet.hidden = true;
    sheetScrim.hidden = true;
    frame.inert = false;
    if (restoreFocus && lastFocus?.isConnected) focusProgrammatically(lastFocus);
    lastFocus = null;
  }

  function closeSheet({ immediate=false, restoreFocus=true } = {}) {
    if (sheet.hidden) return;
    sheetScrim.classList.remove('is-open');
    sheet.classList.remove('is-open');
    if (immediate || prefersReducedMotion()) {
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

  function settleInput(parameterKey = pendingSettleParam, { announceChain = true } = {}) {
    const solved = safeSolve(state.input);
    if (!solved) return;
    try {
      const chain = buildCauseChain(beforeSettled, state.input, parameterKey);
      const cause = lesson.querySelector('#causeChain');
      const causeSentence = `Dynamic Loft ${formatValue(state.input.dynamicLoft, '\u00b0')} minus Attack ${formatSigned(state.input.attackAngle, '\u00b0')} gives Spin Loft ${formatValue(solved.spinLoft, '\u00b0')}. At Ball Speed ${formatValue(state.input.ballSpeed, ' mph')}, Flightglass returns ${formatNumber(solved.rpm)} rpm of Backspin.`;
      cause.innerHTML = `<span>${escapeHtml(causeSentence)}</span><span>Separate current flight fit: Apex ${escapeHtml(formatValue(solved.apexM, ' m'))}; rpm is not fed back.</span>`;
      state.lastChainSpeech = causeSentence;
      if (announceChain) announce(causeSentence);
    } catch {
      rejectModelUpdate();
      return;
    }
    if (state.previousSettled && state.previousSettled !== solved) {
      state.ghostTraces = pushSettledTrace(state.ghostTraces, state.previousSettled);
    }
    state.previousSettled = solved;
    beforeSettled = { ...state.input };
    renderLab();
    renderInfluence();
  }

  function handleRangeInput() {
    callbacks.onVoiceInterrupt('model-input');
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
      safeHaptic('notify', 'success');
      announce(mission.event === 'built' ? 'Build stage complete. Now cut the spin below 3,500 rpm.' : 'Mission complete. You built and cut the spin.');
      callbacks.onVoiceMilestone(mission.event);
      if (mission.complete) state.unlockedSurface = Math.max(state.unlockedSurface, 2);
      renderMission();
      updateStepper();
      updateSurfaceNavigation();
    } else {
      safeHaptic('tick', activeParamAtInput);
    }
    renderLab();
    cancelLater(settleTimer);
    settleTimer = null;
    pendingSettleParam = activeParamAtInput;
    if (prefersReducedMotion()) {
      // Reduced motion settles the visuals immediately, but announcements
      // are debounced to the settled state in BOTH motion modes — a held
      // arrow key must never flood the live region (EV-NAT-03).
      settleInput(activeParamAtInput, { announceChain: false });
      cancelLater(settleAnnounceTimer);
      settleAnnounceTimer = later(() => {
        settleAnnounceTimer = null;
        if (state.lastChainSpeech) announce(state.lastChainSpeech);
      }, 300);
    } else {
      settleTimer = later(() => { settleTimer = null; settleInput(activeParamAtInput); }, 300);
    }
  }

  function selectLie(key) {
    if (key !== 'clean' && !LIE_ESTIMATES[key]) return;
    if (state.lie === key) return;
    state.lie = key;
    safeHaptic('selectionChanged');
    const solved = state.lastValidSolved;
    if (solved) renderRealWorld(solved.rpm);
    announce(key === 'clean'
      ? 'Real-world layer off. Simulator ranking.'
      : `${LIE_ESTIMATES[key].label}. Real-world estimate active, ${LIE_ESTIMATES[key].frac}, not the simulator.`);
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
    listen(lesson, 'focusout', event => {
      if (event.target instanceof HTMLElement) {
        event.target.removeAttribute('data-programmatic-focus');
      }
    });

    listen(lesson, 'click', event => {
      const target = event.target.closest('button');
      if (!target || target.inert || target.getAttribute('aria-disabled') === 'true') return;
      if (target.dataset.masteryChoice !== undefined) {
        answerMasteryChoice(Number(target.dataset.masteryChoice));
        return;
      }
      if (target.dataset.masteryParam) {
        selectMasteryTargetParameter(target.dataset.masteryParam);
        return;
      }
      if (target.dataset.action === 'submit-mastery-target') {
        submitMasteryTarget();
        return;
      }
      if (target.dataset.masteryNext !== undefined) {
        advanceMasteryTask();
        return;
      }
      if (target.dataset.mythChoice !== undefined) {
        answerMyth(Number(target.dataset.mythChoice));
        return;
      }
      if (target.dataset.sheet) {
        openSheet(target.dataset.sheet, target);
        return;
      }
      if (target.dataset.param) {
        selectParameter(target.dataset.param, { openIfActive:true });
        return;
      }
      if (target.dataset.influenceParam) {
        const key = target.dataset.influenceParam;
        const willExpand = state.influenceParam !== key;
        state.influenceParam = willExpand ? key : null;
        renderInfluence();
        focusProgrammatically(lesson.querySelector(`[data-influence-param="${key}"]`));
        announce(`${BACKSPIN_PARAMS[key].label} A/B comparison ${willExpand ? 'shown' : 'hidden'}.`);
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
      else if (target.dataset.action === 'retry-mastery') retryMastery();
      else if (target.dataset.action === 'view-result') setSurface(5, { immediate:true, unlock:true });
      else if (target.dataset.action === 'next-lesson' && resultMastered(state.lastSubmission?.summary)) callbacks.onNextLesson();
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
          if (document.activeElement === sheet) {
            event.preventDefault();
            (event.shiftKey ? last : first).focus();
          } else if (event.shiftKey && document.activeElement === first) {
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
      const mythChoice = event.target.closest('[data-myth-choice]');
      const masteryChoice = event.target.closest('[data-mastery-choice]');
      const masteryParam = event.target.closest('[data-mastery-param]');
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
      } else if (mythChoice) {
        const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (keys.includes(event.key)) {
          event.preventDefault();
          const buttons = [...lesson.querySelectorAll('[data-myth-choice]')];
          moveRovingFocus(buttons, mythChoice, event.key);
          const focused = document.activeElement;
          buttons.forEach(button => { button.tabIndex = button === focused ? 0 : -1; });
        }
      } else if (masteryChoice) {
        const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (keys.includes(event.key)) {
          event.preventDefault();
          const buttons = [...lesson.querySelectorAll('[data-mastery-choice]')];
          moveRovingFocus(buttons, masteryChoice, event.key);
          const focused = document.activeElement;
          buttons.forEach(button => { button.tabIndex = button === focused ? 0 : -1; });
        }
      } else if (masteryParam) {
        const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (keys.includes(event.key)) {
          event.preventDefault();
          const buttons = [...lesson.querySelectorAll('[data-mastery-param]')];
          moveRovingFocus(buttons, masteryParam, event.key);
          const focused = document.activeElement;
          if (focused?.dataset.masteryParam) selectMasteryTargetParameter(focused.dataset.masteryParam);
        }
      }
    });

    listen(range, 'pointerdown', () => safeHaptic('selectionStart'));
    listen(range, 'input', handleRangeInput);
    listen(range, 'change', () => safeHaptic('selectionEnd'));
    listen(range, 'pointerup', () => safeHaptic('selectionEnd'));
    listen(range, 'pointercancel', () => safeHaptic('selectionEnd'));
    listen(range, 'blur', () => safeHaptic('selectionEnd'));

    listen(lesson, 'pointerdown', event => {
      const masteryRange = event.target.closest?.('[data-mastery-range]');
      if (masteryRange) safeHaptic('selectionStart');
    });
    listen(lesson, 'input', event => {
      const masteryRange = event.target.closest?.('[data-mastery-range]');
      if (masteryRange) updateMasteryTargetInput(masteryRange);
    });
    ['change', 'pointerup', 'pointercancel', 'focusout'].forEach(eventName => {
      listen(lesson, eventName, event => {
        if (event.target.closest?.('[data-mastery-range]')) safeHaptic('selectionEnd');
      });
    });

    listen(sheetScrim, 'click', () => closeSheet());
    listen(sheet, 'touchstart', event => {
      const target = event.target instanceof Element ? event.target : null;
      const canDismiss = sheet.scrollTop <= 0 && target?.closest('.native-sheet__grab, .native-sheet__eyebrow, .native-sheet__title');
      touchStartY = canDismiss ? event.touches?.[0]?.clientY ?? null : null;
    }, { passive:true });
    listen(sheet, 'touchmove', event => {
      const y = event.touches?.[0]?.clientY;
      if (sheet.scrollTop > 0) {
        touchStartY = null;
        return;
      }
      if (touchStartY !== null && Number.isFinite(y) && y - touchStartY > 70) {
        touchStartY = null;
        closeSheet();
      }
    }, { passive:true });

    let resizeObserver = null;
    if ('ResizeObserver' in window) {
      try {
        resizeObserver = new window.ResizeObserver(() => {
          if (!destroyed) drawTrajectory(state.lastValidSolved);
        });
        resizeObserver.observe(canvas);
      } catch {
        try { resizeObserver?.disconnect(); } catch { /* Fall through to window resize. */ }
        resizeObserver = null;
      }
    }
    if (resizeObserver) {
      cleanups.push(() => resizeObserver.disconnect());
    } else {
      listen(window, 'resize', () => {
        if (!destroyed) drawTrajectory(state.lastValidSolved);
      });
    }
  }

  wireLesson();
  renderAll();
  setSurface(state.surface, { focus:false, persist:false });
  if (normalizedLegacySurface) persistJourney({ surface:1 }, { immediate:true });
  else if (normalizedIncompleteMythSurface) persistJourney({ surface:3 }, { immediate:true });
  else if (normalizedInvalidResultSurface) persistJourney({
    surface:4,
    masteryAttemptId:state.masteryAttemptId,
    lastSubmission:null
  }, { immediate:true });

  return () => {
    if (destroyed) return;
    destroyed = true;
    lesson.dataset.destroyed = 'true';
    closeSheet({ immediate:true, restoreFocus:false });
    cleanups.splice(0).forEach(fn => {
      try { fn(); } catch { /* Continue deterministic cleanup. */ }
    });
    timers.forEach(clearTimeout);
    timers.clear();
    settleTimer = null;
    announceTimer = null;
    announcementQueue.length = 0;
    frames.forEach(cancelAnimationFrame);
    frames.clear();
    safeHaptic('selectionEnd');
    lastFocus = null;
    touchStartY = null;
    if (lesson.parentElement === root) lesson.remove();
  };
}
