import {
  GUIDE_QUESTIONS,
  GUIDE_TOPICS,
  evaluateGuideCapability,
  getGuideQuestion,
  getGuideTopic,
  listGuideQuestions,
} from './guide-knowledge.js';
import {
  createOneVariableSweep,
  getGuideMetric,
  normalizeGuideInput,
  resolveGuideContext,
} from './guide-engine.js';
import { readContext, updateContext } from './sa-v1-context.js';
import { authorize, consume } from './sa-access.js';
import * as saIap from './sa-iap.js';
import { track } from './sa-analytics.js';
import { lockPortrait } from './sa-orientation.js';

lockPortrait();

const iapReady = saIap.init();
const showPaywall = async moment => (await import('./sa-paywall.js')).openPaywall(moment);

const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ILLUSTRATIVE_INPUT = Object.freeze({
  face: 2,
  path: -1,
  attack: -3,
  dynLoft: 25,
  speed: 85,
});

const PARAMS = Object.freeze({
  speed: Object.freeze({ label: 'Club speed', short: 'Speed', min: 30, max: 150, step: 1, unit: 'mph' }),
  face: Object.freeze({ label: 'Face angle', short: 'Face', min: -15, max: 15, step: .5, unit: 'deg' }),
  path: Object.freeze({ label: 'Club path', short: 'Path', min: -15, max: 15, step: .5, unit: 'deg' }),
  attack: Object.freeze({ label: 'Attack angle', short: 'Attack', min: -15, max: 15, step: .5, unit: 'deg' }),
  dynLoft: Object.freeze({ label: 'Dynamic loft', short: 'Loft', min: 0, max: 50, step: .5, unit: 'deg' }),
});
const CONTEXT_INPUT_KEYS = Object.freeze({
  speed: 'clubSpeed',
  face: 'faceAngle',
  path: 'clubPath',
  attack: 'attackAngle',
  dynLoft: 'dynamicLoft',
});

const METRICS = Object.freeze({
  faceAngle: Object.freeze({ label: 'Face angle', source: 'input', key: 'face', unit: 'deg' }),
  clubPath: Object.freeze({ label: 'Club path', source: 'input', key: 'path', unit: 'deg' }),
  attackAngle: Object.freeze({ label: 'Attack angle', source: 'input', key: 'attack', unit: 'deg' }),
  dynamicLoft: Object.freeze({ label: 'Dynamic loft', source: 'input', key: 'dynLoft', unit: 'deg' }),
  clubSpeed: Object.freeze({ label: 'Club speed', source: 'input', key: 'speed', unit: 'mph' }),
  startDirection: Object.freeze({ label: 'Start direction', source: 'outcome', key: 'launch_direction_deg', unit: 'deg' }),
  launchDirection: Object.freeze({ label: 'Start direction', source: 'outcome', key: 'launch_direction_deg', unit: 'deg' }),
  spinAxis: Object.freeze({ label: 'Spin axis', source: 'outcome', key: 'spin_axis_deg', unit: 'deg' }),
  curve: Object.freeze({ label: 'Curve', source: 'outcome', key: 'curve_m', unit: 'm' }),
  side: Object.freeze({ label: 'Final side', source: 'outcome', key: 'side_m', unit: 'm' }),
  launchAngle: Object.freeze({ label: 'Launch angle', source: 'outcome', key: 'launch_angle_deg', unit: 'deg' }),
  spinLoft: Object.freeze({ label: 'Spin loft', source: 'outcome', key: 'spin_loft_deg', unit: 'deg' }),
  landingAngle: Object.freeze({ label: 'Landing angle', source: 'outcome', key: 'landing_angle_deg', unit: 'deg' }),
  backspin: Object.freeze({ label: 'Backspin', source: 'outcome', key: 'backspin_rpm', unit: 'rpm' }),
  ballSpeed: Object.freeze({ label: 'Ball speed', source: 'outcome', key: 'ball_speed_mph', unit: 'mph' }),
  smash: Object.freeze({ label: 'Smash', source: 'outcome', key: 'smash', unit: 'ratio' }),
  carry: Object.freeze({ label: 'Carry', source: 'outcome', key: 'carry_m', unit: 'm' }),
  total: Object.freeze({ label: 'Total', source: 'outcome', key: 'total_m', unit: 'm' }),
  apex: Object.freeze({ label: 'Apex', source: 'outcome', key: 'apex_m', unit: 'm' }),
});

const TRUTH = Object.freeze({
  'engine-calculated': Object.freeze({ value: 'range-modelled', label: 'Range modelled' }),
  'engine-derived': Object.freeze({ value: 'range-modelled', label: 'Range modelled' }),
  'geometry-calculated': Object.freeze({ value: 'studio-geometry', label: 'Studio geometry' }),
  'heuristic-estimate': Object.freeze({ value: 'estimate', label: 'Estimate' }),
  'external-reference': Object.freeze({ value: 'estimate', label: 'External reference' }),
  unsupported: Object.freeze({ value: 'not-modelled', label: 'Not modelled' }),
});

const GAP = Object.freeze({
  'answer-now': Object.freeze({ title: 'Available now', copy: 'The shipping model can answer this bounded relationship.', label: 'Now' }),
  'bounded-model': Object.freeze({ title: 'Can be added as a bounded model', copy: 'This needs named inputs and a separately tested model before it can become a calculated answer.', label: 'Buildable' }),
  'external-data': Object.freeze({ title: 'Needs external data or calibration', copy: 'This answer needs measured inputs, validated reference data or a trusted external source.', label: 'External' }),
  'reject-false-precision': Object.freeze({ title: 'Should not be guessed', copy: 'The current evidence cannot support a precise answer. Guide keeps the boundary visible.', label: 'No false precision' }),
});

const DEFAULT_OUTPUTS = Object.freeze(['startDirection', 'curve', 'carry', 'backspin']);

const dom = {
  body: document.body,
  main: document.querySelector('#guideMain'),
  source: document.querySelector('#guideSource'),
  status: document.querySelector('#guideStatus'),
  panels: new Map([...document.querySelectorAll('[data-guide-panel]')].map(node => [node.dataset.guidePanel, node])),
  intents: [...document.querySelectorAll('[data-guide-intent]')],
  topics: [...document.querySelectorAll('[data-guide-topic]')],
  questionList: document.querySelector('#guideQuestionList'),
  questionCount: document.querySelector('#guideQuestionCount'),
  traceLive: document.querySelector('#guideTraceLive'),
  apertureValue: document.querySelector('#guideApertureValue'),
  apertureDesc: document.querySelector('#guideApertureDesc'),
  backToBrowse: document.querySelector('#guideBackToBrowse'),
  answerTopic: document.querySelector('#guideAnswerTopic'),
  answerPrompt: document.querySelector('#guideAnswerPrompt'),
  answerTitle: document.querySelector('#guideAnswerTitle'),
  answerBullets: document.querySelector('#guideAnswerBullets'),
  truthTier: document.querySelector('#guideTruthTier'),
  metricRows: document.querySelector('#guideMetricRows'),
  modelGap: document.querySelector('#guideModelGap'),
  gapTitle: document.querySelector('#guideGapTitle'),
  gapCopy: document.querySelector('#guideGapCopy'),
  gapStatus: document.querySelector('#guideGapStatus'),
  boundary: document.querySelector('#guideBoundaryCopy'),
  cause: document.querySelector('.guide-cause'),
  causeStart: document.querySelector('#guideCauseStart'),
  causeCurve: document.querySelector('#guideCauseCurve'),
  causeFinish: document.querySelector('#guideCauseFinish'),
  causeStartLabel: document.querySelector('#guideCauseLabelStart'),
  causeFinishLabel: document.querySelector('#guideCauseLabelFinish'),
  openLab: document.querySelector('#guideOpenLab'),
  actionLabel: document.querySelector('#guideActionLabel'),
  answerRoute: document.querySelector('#guideAnswerRoute'),
  backToAnswer: document.querySelector('#guideBackToAnswer'),
  labTitle: document.querySelector('#guideLabTitle'),
  labDescription: document.querySelector('#guideLabDescription'),
  labSource: document.querySelector('#guideLabSource'),
  params: [...document.querySelectorAll('[data-lab-param]')],
  slider: document.querySelector('#guideLabSlider'),
  sliderLabel: document.querySelector('#guideSliderLabel'),
  sliderOutput: document.querySelector('#guideSliderOutput'),
  sliderMin: document.querySelector('#guideSliderMin'),
  sliderMax: document.querySelector('#guideSliderMax'),
  heldCopy: document.querySelector('#guideHeldCopy'),
  outcomes: [...document.querySelectorAll('[data-lab-outcome]')],
  chartLine: document.querySelector('#guideChartLine'),
  chartPoint: document.querySelector('#guideChartPoint'),
  chartSummary: document.querySelector('#guideChartSummary'),
  chartDesc: document.querySelector('#guideChartDesc'),
  deltaRows: document.querySelector('#guideDeltaRows'),
  reset: document.querySelector('#guideLabReset'),
  openRange: document.querySelector('#guideOpenRange'),
};

function outcomeFor(input) {
  const normalized = normalizeGuideInput(input);
  return createOneVariableSweep(normalized, 'face', [normalized.face])[0].outcome;
}

const storedContext = readContext(window.localStorage);
const storedResolution = resolveGuideContext(storedContext);
const hasSavedSetup = storedResolution.status === 'ready';
const baselineInput = Object.freeze({ ...(hasSavedSetup ? storedResolution.input : ILLUSTRATIVE_INPUT) });
const baselineOutcome = hasSavedSetup ? storedResolution.outcome : outcomeFor(baselineInput);

const state = {
  selectedTopic: null,
  selectedQuestion: null,
  view: 'browse',
  baselineInput,
  currentInput: { ...baselineInput },
  baselineOutcome,
  currentOutcome: baselineOutcome,
  activeParam: 'face',
};

function announce(message, { visible = false } = {}) {
  dom.status.textContent = message;
  dom.status.dataset.visible = String(visible);
}

function emit(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function signed(value, digits = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  if (Math.abs(number) < 10 ** (-digits) / 2) return Number(0).toFixed(digits);
  return `${number > 0 ? '+' : '−'}${Math.abs(number).toFixed(digits)}`;
}

function formatValue(value, unit) {
  if (!Number.isFinite(Number(value))) return 'Not modelled';
  if (unit === 'deg') return `${signed(value)}°`;
  if (unit === 'rpm') return `${Math.round(value).toLocaleString('en-US')} rpm`;
  if (unit === 'mph') return `${Number(value).toFixed(1)} mph`;
  if (unit === 'm') return `${signed(value)} m`;
  if (unit === 'ratio') return Number(value).toFixed(2);
  return Number(value).toFixed(1);
}

function formatParam(key, value) {
  const param = PARAMS[key];
  return param.unit === 'mph' ? `${Math.round(value)} mph` : `${signed(value)}°`;
}

function metricValue(definition, input, outcome) {
  if (definition.source === 'input') return input[definition.key];
  return getGuideMetric(outcome, definition.key);
}

function metricDefinition(id) {
  return METRICS[id] ?? null;
}

function setView(view, { focus = true } = {}) {
  state.view = view;
  dom.body.dataset.guideView = view;
  for (const [name, panel] of dom.panels) panel.hidden = name !== view;
  if (!focus) return;
  const focusTarget = view === 'browse' ? document.querySelector('#guideBrowseTitle')
    : view === 'answer' ? dom.backToBrowse
      : dom.backToAnswer;
  requestAnimationFrame(() => {
    focusTarget?.focus?.({ preventScroll: true });
    dom.panels.get(view)?.scrollIntoView({ block: 'start', behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
  });
}

function urlFor(topicId = null, questionId = null) {
  const url = new URL(location.href);
  url.search = '';
  if (topicId) url.searchParams.set('topic', topicId);
  if (questionId) url.searchParams.set('question', questionId);
  return url;
}

function writeHistory(topicId, questionId, mode = 'push', view = questionId ? 'answer' : 'browse') {
  const url = urlFor(topicId, questionId);
  const payload = { topic: topicId, question: questionId, view };
  if (mode === 'replace') history.replaceState(payload, '', url);
  else history.pushState(payload, '', url);
}

function capabilityLabel(gapClass) {
  return {
    'answer-now': 'Modelled now',
    'bounded-model': 'Buildable model',
    'external-data': 'External data',
    'reject-false-precision': 'No false precision',
  }[gapClass] ?? 'Model boundary';
}

function renderQuestions(topicId) {
  const questions = listGuideQuestions({ topicId });
  dom.questionList.replaceChildren();
  dom.questionList.hidden = false;
  for (const question of questions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'guide-question';
    button.dataset.questionId = question.id;
    button.setAttribute('aria-pressed', String(state.selectedQuestion?.id === question.id));
    const prompt = document.createElement('span');
    prompt.textContent = question.prompt;
    const capability = document.createElement('span');
    capability.textContent = capabilityLabel(question.gapClass);
    button.append(prompt, capability);
    button.addEventListener('click', () => openQuestion(question, { historyMode: 'push' }));
    dom.questionList.append(button);
  }
}

function selectTopic(topicId, { historyMode = 'push', announceSelection = true } = {}) {
  const topic = getGuideTopic(topicId);
  if (!topic) return false;
  state.selectedTopic = topic;
  for (const button of dom.topics) button.setAttribute('aria-expanded', String(button.dataset.guideTopic === topicId));
  renderQuestions(topicId);
  if (historyMode) writeHistory(topicId, null, historyMode);
  if (announceSelection) announce(`${topic.title}: ${listGuideQuestions({ topicId }).length} guided questions.`);
  return true;
}

function visibleMetrics(question) {
  const requested = question.metricIds.map(metricDefinition).filter(Boolean);
  if (requested.length >= 3) return requested.slice(0, 5);
  const fallback = ['faceAngle', 'clubPath', 'startDirection', 'curve'].map(metricDefinition);
  return [...requested, ...fallback].filter((item, index, items) => items.indexOf(item) === index).slice(0, 5);
}

function renderMetricRows(question) {
  dom.metricRows.replaceChildren();
  const truth = TRUTH[question.truthTier] ?? TRUTH.unsupported;
  for (const definition of visibleMetrics(question)) {
    const row = document.createElement('tr');
    const label = document.createElement('th');
    label.scope = 'row';
    label.textContent = definition.label;
    const value = document.createElement('td');
    value.textContent = formatValue(metricValue(definition, state.currentInput, state.currentOutcome), definition.unit);
    const source = document.createElement('td');
    source.textContent = definition.source === 'input' ? 'Model input' : truth.label;
    row.append(label, value, source);
    dom.metricRows.append(row);
  }
}

function renderCause(question) {
  const show = question.gapClass === 'answer-now' && question.truthTier !== 'geometry-calculated';
  dom.cause.hidden = !show;
  if (!show) return;
  const start = getGuideMetric(state.currentOutcome, 'launch_direction_deg');
  const side = getGuideMetric(state.currentOutcome, 'side_m');
  const startY = 92 - Math.max(-10, Math.min(10, start)) * 4.2;
  const finishY = 92 - Math.max(-20, Math.min(20, side)) * 2.6;
  dom.causeStart.setAttribute('d', `M48 92L248 ${startY.toFixed(1)}`);
  dom.causeCurve.setAttribute('d', `M248 ${startY.toFixed(1)}Q466 ${(Math.min(startY, finishY) - 54).toFixed(1)} 672 ${finishY.toFixed(1)}`);
  dom.causeFinish.setAttribute('cy', finishY.toFixed(1));
  dom.causeStartLabel.textContent = `Start ${formatValue(start, 'deg')}`;
  dom.causeFinishLabel.textContent = `Finish ${formatValue(side, 'm')}`;
  resolveTrace(dom.causeCurve);
}

function renderGap(question) {
  const capability = evaluateGuideCapability(question.id);
  const gap = GAP[capability.status] ?? GAP['reject-false-precision'];
  dom.modelGap.dataset.modelGap = capability.status;
  dom.gapTitle.textContent = gap.title;
  dom.gapCopy.textContent = gap.copy;
  dom.gapStatus.textContent = gap.label;
}

function renderAnswer(question) {
  const topic = getGuideTopic(question.topicId);
  const truth = TRUTH[question.truthTier] ?? TRUTH.unsupported;
  dom.answerTopic.textContent = topic?.title ?? 'Guide';
  dom.truthTier.dataset.truthTier = truth.value;
  dom.truthTier.textContent = truth.label;
  dom.answerPrompt.textContent = question.prompt;
  dom.answerTitle.textContent = question.shortAnswer;
  dom.answerBullets.replaceChildren(...question.bullets.map((text) => {
    const item = document.createElement('li');
    item.textContent = text;
    return item;
  }));
  dom.boundary.textContent = question.boundary;
  renderMetricRows(question);
  renderCause(question);
  renderGap(question);

  const canLab = question.gapClass === 'answer-now' && Boolean(question.lab);
  dom.openLab.hidden = !canLab;
  dom.answerRoute.hidden = canLab;
  if (canLab) {
    dom.actionLabel.textContent = question.nextAction;
  } else {
    const geometry = question.truthTier === 'geometry-calculated' || question.topicId === 'impact';
    dom.answerRoute.href = geometry ? './impact-studio.html?guided=experiment' : './impact.html';
    dom.answerRoute.querySelector('span').textContent = geometry ? 'Open Impact Studio' : question.nextAction;
  }
}

function persistQuestion(question) {
  try {
    updateContext({ jarvis: { selectedQuestionId: question.id, recommendedRoute: question.topicId === 'impact' ? 'studio' : 'range' } }, window.localStorage);
  } catch (_) {
    // Storage is optional. The current guided interaction remains complete.
  }
}

async function openQuestion(question, { historyMode = 'push', focus = true } = {}) {
  if (!question) return;
  track('jarvis_question_selected', { questionId: question.id });
  await iapReady;
  const access = authorize('guide-answer', { pro: saIap.isPro(), identity: question.id });
  if (!access.allowed) {
    if (access.shouldPaywall) await showPaywall('guide-answer');
    if (!saIap.isPro()) return false;
  }
  if (!state.selectedTopic || state.selectedTopic.id !== question.topicId) {
    selectTopic(question.topicId, { historyMode: null, announceSelection: false });
  }
  state.selectedQuestion = question;
  renderQuestions(question.topicId);
  renderAnswer(question);
  persistQuestion(question);
  if (historyMode) writeHistory(question.topicId, question.id, historyMode);
  setView('answer', { focus });
  announce(`${question.prompt} Answer ready. ${capabilityLabel(question.gapClass)}.`);
  consume('guide-answer', { pro: saIap.isPro(), identity: question.id, completed: true });
  track('jarvis_answer_seen', { questionId: question.id });
  emit('guide_answer_seen', { questionId: question.id, topicId: question.topicId, gapClass: question.gapClass });
  return true;
}

function sourceCopy() {
  return hasSavedSetup ? 'Saved guided model setup' : 'Illustrative model';
}

function updateAperture() {
  const path = state.currentOutcome?.path;
  if (!Array.isArray(path) || path.length < 2) return;
  const maxX = Math.max(...path.map(point => point.x), 1);
  const maxZ = Math.max(...path.map(point => point.z), 1);
  const points = path.filter((_, index) => index % 2 === 0 || index === path.length - 1);
  const d = points.map((point, index) => {
    const x = 28 + (point.x / maxX) * 664;
    const y = 144 - (point.z / maxZ) * 106;
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join('');
  dom.traceLive.setAttribute('d', d);
  dom.apertureValue.textContent = `${formatValue(state.currentOutcome.m.carry, 'm')} carry · ${formatValue(state.currentOutcome.deg.launchAng, 'deg')} launch`;
  dom.apertureDesc.textContent = `${sourceCopy()}. The model path carries ${state.currentOutcome.m.carry.toFixed(1)} metres with a ${state.currentOutcome.deg.launchAng.toFixed(1)} degree launch angle.`;
  resolveTrace(dom.traceLive);
}

function resolveTrace(element) {
  if (REDUCED_MOTION || !element?.animate) return;
  element.getAnimations().forEach(animation => animation.cancel());
  element.animate(
    [
      { strokeDasharray: '1', strokeDashoffset: '1', filter: 'blur(2px)' },
      { strokeDasharray: '1', strokeDashoffset: '0', filter: 'blur(0)' },
    ],
    { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' },
  );
}

function paramNamesExcept(active) {
  return Object.entries(PARAMS).filter(([key]) => key !== active).map(([, value]) => value.short.toLowerCase());
}

function setActiveParam(key, { resetValue = true } = {}) {
  if (!PARAMS[key]) return;
  state.activeParam = key;
  if (resetValue) {
    state.currentInput = { ...state.baselineInput };
    state.currentOutcome = state.baselineOutcome;
  }
  const param = PARAMS[key];
  dom.slider.min = String(param.min);
  dom.slider.max = String(param.max);
  dom.slider.step = String(param.step);
  dom.slider.value = String(state.currentInput[key]);
  dom.sliderLabel.textContent = param.label;
  dom.sliderOutput.value = formatParam(key, state.currentInput[key]);
  dom.sliderOutput.textContent = formatParam(key, state.currentInput[key]);
  dom.sliderMin.textContent = formatParam(key, param.min);
  dom.sliderMax.textContent = formatParam(key, param.max);
  dom.heldCopy.textContent = `${paramNamesExcept(key).join(', ')} are held constant.`;
  for (const button of dom.params) {
    const active = button.dataset.labParam === key;
    button.setAttribute('aria-pressed', String(active));
    button.querySelector('small').textContent = active ? 'Active model input' : 'Held constant';
  }
  renderLab();
}

function labOutputIds() {
  const ids = state.selectedQuestion?.lab?.outputIds ?? DEFAULT_OUTPUTS;
  const supported = ids.filter(id => metricDefinition(id));
  return [...supported, ...DEFAULT_OUTPUTS].filter((id, index, values) => values.indexOf(id) === index).slice(0, 4);
}

function deltaFor(definition) {
  const before = metricValue(definition, state.baselineInput, state.baselineOutcome);
  const current = metricValue(definition, state.currentInput, state.currentOutcome);
  return { before, current, delta: current - before };
}

function renderParamValues() {
  for (const button of dom.params) {
    const key = button.dataset.labParam;
    button.querySelector('[data-lab-value]').textContent = formatParam(key, state.currentInput[key]);
  }
  dom.sliderOutput.value = formatParam(state.activeParam, state.currentInput[state.activeParam]);
  dom.sliderOutput.textContent = formatParam(state.activeParam, state.currentInput[state.activeParam]);
}

function renderOutcomes() {
  const ids = labOutputIds();
  ids.forEach((id, index) => {
    const definition = metricDefinition(id);
    const result = deltaFor(definition);
    const chip = dom.outcomes[index];
    chip.querySelector('span').textContent = definition.label;
    chip.querySelector('strong').textContent = formatValue(result.current, definition.unit);
    chip.querySelector('small').textContent = `Δ ${formatValue(result.delta, definition.unit)}`;
  });
}

function renderDeltaTable() {
  dom.deltaRows.replaceChildren();
  for (const id of labOutputIds()) {
    const definition = metricDefinition(id);
    const result = deltaFor(definition);
    const row = document.createElement('tr');
    const label = document.createElement('th');
    label.scope = 'row';
    label.textContent = definition.label;
    const before = document.createElement('td');
    before.textContent = formatValue(result.before, definition.unit);
    const current = document.createElement('td');
    current.textContent = formatValue(result.current, definition.unit);
    const delta = document.createElement('td');
    delta.textContent = formatValue(result.delta, definition.unit);
    row.append(label, before, current, delta);
    dom.deltaRows.append(row);
  }
}

function safeSweepValues(key) {
  const param = PARAMS[key];
  const values = Array.from({ length: 9 }, (_, index) => param.min + (param.max - param.min) * index / 8);
  const rounded = values.map(value => Math.round(value / param.step) * param.step);
  const points = [];
  for (const value of [...new Set(rounded)]) {
    try {
      points.push(createOneVariableSweep(state.baselineInput, key, [value])[0]);
    } catch (_) {
      // A graph never bridges an out-of-domain or no-flight candidate.
    }
  }
  return points;
}

function renderChart() {
  const primary = metricDefinition(labOutputIds()[0]);
  const points = safeSweepValues(state.activeParam).map(point => ({
    input: point.value,
    value: metricValue(primary, point.input, point.outcome),
  }));
  if (points.length < 2) {
    dom.chartLine.setAttribute('d', 'M52 204H684');
    dom.chartSummary.textContent = 'This comparison crosses the model boundary. Choose a smaller range.';
    return;
  }
  const xMin = Math.min(...points.map(point => point.input));
  const xMax = Math.max(...points.map(point => point.input));
  const yMin = Math.min(...points.map(point => point.value));
  const yMax = Math.max(...points.map(point => point.value));
  const xFor = value => 52 + ((value - xMin) / Math.max(xMax - xMin, 1)) * 632;
  const yFor = value => 204 - ((value - yMin) / Math.max(yMax - yMin, 1)) * 166;
  const d = points.map((point, index) => `${index ? 'L' : 'M'}${xFor(point.input).toFixed(1)} ${yFor(point.value).toFixed(1)}`).join('');
  dom.chartLine.setAttribute('d', d);
  const currentValue = metricValue(primary, state.currentInput, state.currentOutcome);
  dom.chartPoint.setAttribute('cx', xFor(state.currentInput[state.activeParam]).toFixed(1));
  dom.chartPoint.setAttribute('cy', yFor(currentValue).toFixed(1));
  dom.chartSummary.textContent = `${PARAMS[state.activeParam].label} changes ${primary.label.toLowerCase()} from ${formatValue(yMin, primary.unit)} to ${formatValue(yMax, primary.unit)} across valid sampled states.`;
  dom.chartDesc.textContent = `${primary.label} is plotted while only ${PARAMS[state.activeParam].label.toLowerCase()} changes. The other four model inputs remain held constant.`;
  resolveTrace(dom.chartLine);
}

function renderLab() {
  renderParamValues();
  renderOutcomes();
  renderDeltaTable();
  renderChart();
  updateAperture();
  prepareRangeHandoff();
}

function prepareRangeHandoff() {
  if (!hasSavedSetup) {
    dom.openRange.href = './impact.html';
    return;
  }
  const context = readContext(window.localStorage);
  const shot = context.currentShot;
  const changeKey = CONTEXT_INPUT_KEYS[state.activeParam];
  if (!shot || !changeKey) {
    dom.openRange.href = './impact.html';
    return;
  }
  const delta = state.currentInput[state.activeParam] - state.baselineInput[state.activeParam];
  const experiment = {
    id: `${shot.id}:guide:${changeKey}:${state.currentInput[state.activeParam]}`,
    sourceShotId: shot.id,
    changeKey,
    delta,
    instruction: `Guide comparison: ${PARAMS[state.activeParam].label} ${formatParam(state.activeParam, state.currentInput[state.activeParam])}. Keep the other four inputs unchanged.`,
    inputs: {
      ...shot.inputs,
      clubPath: state.currentInput.path,
      faceAngle: state.currentInput.face,
      attackAngle: state.currentInput.attack,
      dynamicLoft: state.currentInput.dynLoft,
      clubSpeed: state.currentInput.speed,
    },
  };
  const saved = updateContext({ lastExperiment: experiment }, window.localStorage);
  dom.openRange.href = saved.lastExperiment ? './impact.html?guided=experiment' : './impact.html';
}

function openLab({ historyMode = 'push' } = {}) {
  const question = state.selectedQuestion ?? getGuideQuestion('backspin');
  if (!question?.lab || question.gapClass !== 'answer-now') return;
  state.selectedQuestion = question;
  state.currentInput = { ...state.baselineInput };
  state.currentOutcome = state.baselineOutcome;
  dom.labTitle.textContent = question.lab.title;
  dom.labDescription.textContent = 'Move one input. The other four stay held so the relationship remains readable.';
  dom.labSource.textContent = sourceCopy();
  setActiveParam(question.lab.defaultActiveInput || 'face', { resetValue: true });
  if (historyMode) writeHistory(question.topicId, question.id, historyMode, 'lab');
  setView('lab');
  announce(`${question.lab.title} ready. One input is active; four are held constant.`);
  emit('guide_lab_opened', { questionId: question.id, labId: question.lab.id });
}

function applySliderValue(value) {
  const numeric = Number(value);
  try {
    const point = createOneVariableSweep(state.baselineInput, state.activeParam, [numeric])[0];
    state.currentInput = { ...point.input };
    state.currentOutcome = point.outcome;
    renderLab();
    announce(`${PARAMS[state.activeParam].label} ${formatParam(state.activeParam, numeric)}. Outcomes updated.`);
  } catch (_) {
    dom.slider.value = String(state.currentInput[state.activeParam]);
    announce('That value crosses the model boundary. The last valid comparison is still shown.', { visible: true });
  }
}

function resetLab() {
  state.currentInput = { ...state.baselineInput };
  state.currentOutcome = state.baselineOutcome;
  setActiveParam(state.activeParam, { resetValue: false });
  announce('Comparison reset to the starting model.');
}

function showBrowse({ historyMode = 'push', focus = true } = {}) {
  if (historyMode) writeHistory(state.selectedTopic?.id ?? null, null, historyMode);
  setView('browse', { focus });
  announce(state.selectedTopic ? `${state.selectedTopic.title} questions.` : 'Choose a guided entry point or topic.');
}

async function handleIntent(intent) {
  if (intent === 'saved-setup') {
    selectTopic('direction', { historyMode: 'push' });
    if (hasSavedSetup) {
      await openQuestion(getGuideQuestion('face-path'), { historyMode: 'push' });
    } else {
      announce('No saved guided setup yet. Explore the illustrative model or build one from Home.', { visible: true });
    }
    return;
  }
  if (intent === 'compare-model') {
    const question = getGuideQuestion('backspin');
    selectTopic(question.topicId, { historyMode: null, announceSelection: false });
    if (await openQuestion(question, { historyMode: 'push', focus: false })) {
      openLab({ historyMode: 'push' });
    }
    return;
  }
  selectTopic('direction', { historyMode: 'push' });
  dom.questionList.querySelector('button')?.focus();
}

async function syncFromUrl({ focus = false } = {}) {
  const params = new URLSearchParams(location.search);
  const topicId = params.get('topic');
  const questionId = params.get('question');
  const question = questionId ? getGuideQuestion(questionId) : null;
  const topic = topicId ? getGuideTopic(topicId) : null;

  if (question && question.topicId === topicId) {
    selectTopic(topicId, { historyMode: null, announceSelection: false });
    const opened = await openQuestion(question, { historyMode: null, focus });
    if (opened && history.state?.view === 'lab' && question.lab && question.gapClass === 'answer-now') {
      openLab({ historyMode: null });
    }
    return;
  }
  if (topic && !questionId) {
    state.selectedQuestion = null;
    selectTopic(topicId, { historyMode: null, announceSelection: false });
    setView('browse', { focus });
    announce(`${topic.title}: ${listGuideQuestions({ topicId }).length} guided questions.`);
    return;
  }
  if (topicId || questionId) {
    history.replaceState({}, '', urlFor());
    announce('That Guide link was not available. The full guided index is shown instead.', { visible: true });
  }
  state.selectedTopic = null;
  state.selectedQuestion = null;
  for (const button of dom.topics) button.setAttribute('aria-expanded', 'false');
  dom.questionList.hidden = true;
  dom.questionList.replaceChildren();
  setView('browse', { focus });
}

for (const button of dom.topics) {
  button.addEventListener('click', () => selectTopic(button.dataset.guideTopic, { historyMode: 'push' }));
}
for (const button of dom.intents) {
  button.addEventListener('click', () => handleIntent(button.dataset.guideIntent));
}
for (const button of dom.params) {
  button.addEventListener('click', () => setActiveParam(button.dataset.labParam));
}

dom.backToBrowse.addEventListener('click', () => showBrowse({ historyMode: 'push' }));
dom.backToAnswer.addEventListener('click', () => {
  renderAnswer(state.selectedQuestion);
  setView('answer');
  announce(`${state.selectedQuestion.prompt} Answer ready.`);
});
dom.openLab.addEventListener('click', () => openLab({ historyMode: 'push' }));
dom.slider.addEventListener('input', event => applySliderValue(event.currentTarget.value));
dom.reset.addEventListener('click', resetLab);
window.addEventListener('popstate', () => { void syncFromUrl({ focus: true }); });

dom.answerRoute.addEventListener('click', async (event) => {
  const href = dom.answerRoute.getAttribute('href') || '';
  if (!href.includes('impact-studio.html?guided=experiment')) return;
  event.preventDefault();
  await iapReady;
  const access = authorize('guided-experiment', { pro: saIap.isPro() });
  if (access.allowed) window.location.assign(href);
  else if (access.shouldPaywall) {
    await showPaywall('guided-experiment');
    if (saIap.isPro()) window.location.assign(href);
  }
});

dom.questionCount.textContent = `${GUIDE_QUESTIONS.length} guided questions`;
dom.source.textContent = sourceCopy();
dom.labSource.textContent = sourceCopy();
if (!hasSavedSetup && storedResolution.status !== 'no-flight') {
  announce('The saved setup is outside the supported model state. An illustrative model is shown safely.', { visible: true });
}
updateAperture();
await syncFromUrl({ focus: false });

// Keep exported catalog imports visible to bundlers and contract checks while
// making the topic count an honest runtime assertion.
if (GUIDE_TOPICS.length !== dom.topics.length) {
  announce('Guide topics could not be loaded completely. Reload the page.', { visible: true });
}
