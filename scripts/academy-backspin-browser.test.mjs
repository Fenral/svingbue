import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile, readFileSync } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require('../tools/node_modules/playwright-core');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Engine project selection (instrument-gates Task 13): the shipped app runs
// in WKWebView, so the full gate must also run on the WebKit engine.
// Select it with `--project=webkit` (direct file run) or FG_ENGINE=webkit
// (node --test wrapper), e.g. `npm run test:webkit`.
const WEBKIT_PROJECT = process.argv.includes('--project=webkit')
  || process.env.FG_ENGINE === 'webkit';
const STORE_KEY = 'strikearc.academy.v1';

const NATIVE_BACKSPIN_SELECTORS = [
  '#backspinTruth',
  '#flightCanvas',
  '#labRange',
  '#missionStageBuild',
  '#missionStageCut',
  '#causeChain',
  '#influenceBars',
  '#realWorldRegister',
  '#mythExperiment',
  '#masteryTask',
  '#nativeLessonResult',
  '#lessonSheet',
  '[data-step="mission"]',
  '[data-step="lab"]',
  '[data-step="influence"]',
  '[data-step="myths"]',
  '[data-step="mastery"]',
  '[data-step="result"]'
];

const CARRY_ANSWERS = [1, 2, 1, 1, 1];
const BACKSPIN_VIEWPORTS = [
  { width: 430, height: 932 },
  { width: 375, height: 812 }
];
const EXPECTED_BACKSPIN_PARAMS = {
  dynamicLoft: { label:'Dynamic loft', min:10, max:48, step:1, unit:'\u00B0' },
  attackAngle: { label:'Attack angle', min:-8, max:6, step:1, unit:'\u00B0' },
  ballSpeed: { label:'Ball speed', min:90, max:175, step:1, unit:' mph' }
};

const EXPECTED_MYTH_EXPERIMENTS = [
  {
    prompt:'Where is backspin actually created?',
    choices:['Ground interaction', 'Face friction and spin loft'],
    answerIndex:1
  },
  {
    prompt:'Dynamic loft rises 4\u00B0, but attack angle also rises 4\u00B0. What happens to backspin?',
    choices:['More', 'Same', 'Less'],
    answerIndex:1
  },
  {
    prompt:'At fixed ball speed, what does this model show when spin rises past the iron window?',
    choices:['Carry grows', 'Carry falls', 'Carry stays while apex and landing change'],
    answerIndex:2
  }
];

const EXPECTED_MASTERY_TASKS = [
  {
    id:'definition',
    kind:'choice',
    prompt:'Spin loft equals:',
    choices:[
      'Dynamic loft \u2212 attack angle',
      'Dynamic loft + attack angle',
      'Club speed \u00d7 face angle'
    ],
    answerIndex:0
  },
  {
    id:'compare',
    kind:'engine-compare',
    prompt:'Which delivery produces more backspin?',
    choices:['Delivery A', 'Delivery B'],
    answerIndex:1,
    outputs:[
      { side:'left', rpm:6048, spinLoft:28 },
      { side:'right', rpm:8208, spinLoft:38 }
    ]
  },
  {
    id:'reduce',
    kind:'engine-compare',
    prompt:'From 30\u00b0 loft and \u22121\u00b0 attack, which attack-angle change reduces spin loft?',
    choices:['Change attack to +3\u00b0', 'Change attack to \u22125\u00b0'],
    answerIndex:0,
    outputs:[
      { side:'left', rpm:5832, spinLoft:27 },
      { side:'right', rpm:7560, spinLoft:35 }
    ]
  },
  {
    id:'honesty',
    kind:'choice',
    prompt:'The Wet range is:',
    choices:[
      'A solveFlight output',
      'A measured value from this phone',
      'A sourced real-world estimate'
    ],
    answerIndex:2
  },
  {
    id:'target',
    kind:'lab-target',
    prompt:'Create 6,800\u20137,400 rpm with landing angle at or above 50\u00b0.'
  }
];

const EXPECTED_MASTERY_ABILITIES = [
  'Define spin loft',
  'Compare model deliveries',
  'Reduce spin loft',
  'Separate estimates from simulator truth',
  'Build a stopping flight'
];

const MASTERY_TARGET_FIXTURES = Object.freeze({
  highSpin:{
    state:{ dynamicLoft:34, attackAngle:-4, ballSpeed:120 },
    rpm:8208,
    landing:60
  },
  shallowLanding:{
    state:{ dynamicLoft:15, attackAngle:-8, ballSpeed:170 },
    rpm:7038,
    landing:33.3
  },
  pass:{
    state:{ dynamicLoft:30, attackAngle:-3, ballSpeed:120 },
    rpm:7128,
    landing:54.4
  }
});
const LEGACY_STORE = {
  version: 1,
  xp: 0,
  lessons: {
    carry: {
      read: false,
      quizBest: 0,
      quizAttempts: 0,
      perfect: false,
      completed: false,
      completedAt: null,
      diagramTouched: false,
      legacyLessonField: { source: 'pre-native-academy' }
    }
  },
  unlocked: ['carry'],
  badges: [],
  lastOpened: null,
  legacyStoreField: { keep: true }
};

let server;
let browser;
let baseUrl;
const contexts = new Set();
const pages = new Set();

function contentType(file) {
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
  }[extname(file).toLowerCase()] || 'application/octet-stream';
}

async function startStaticServer() {
  const rootPrefix = `${resolve(ROOT)}${sep}`.toLowerCase();
  const localServer = createServer((request, response) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    } catch {
      response.writeHead(400).end('bad request');
      return;
    }

    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const file = resolve(ROOT, relative);
    const insideRoot = `${file}${sep}`.toLowerCase().startsWith(rootPrefix)
      || file.toLowerCase() === ROOT.toLowerCase();
    if (!insideRoot) {
      response.writeHead(403).end('forbidden');
      return;
    }

    readFile(file, (error, data) => {
      if (error) {
        response.writeHead(404).end('not found');
        return;
      }
      response.writeHead(200, {
        'Content-Type': contentType(file),
        'Cache-Control': 'no-store'
      });
      response.end(data);
    });
  });

  await new Promise((resolveListen, rejectListen) => {
    localServer.once('error', rejectListen);
    localServer.listen(0, '127.0.0.1', () => {
      localServer.off('error', rejectListen);
      resolveListen();
    });
  });
  return localServer;
}

async function launchLocalBrowser() {
  if (WEBKIT_PROJECT) {
    try {
      return await webkit.launch({ headless: true });
    } catch (error) {
      throw new Error(
        'Could not launch the WebKit engine. Install it with '
        + `"node tools/node_modules/playwright-core/cli.js install webkit".\n${error.message}`
      );
    }
  }
  const failures = [];
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel, headless: true });
    } catch (error) {
      failures.push(`${channel}: ${error.message}`);
    }
  }
  throw new Error(`Could not launch a local Edge or Chrome browser.\n${failures.join('\n')}`);
}

async function closeServer(localServer) {
  if (!localServer) return;
  localServer.closeAllConnections?.();
  if (!localServer.listening) return;
  await new Promise((resolveClose, rejectClose) => {
    localServer.close(error => error ? rejectClose(error) : resolveClose());
  });
}

async function storedAcademy(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORE_KEY);
}

async function waitForStored(page, expected) {
  await page.waitForFunction(
    ({ key, attempts, best }) => {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const carry = JSON.parse(raw).lessons?.carry;
      return carry?.quizAttempts === attempts && carry?.quizBest === best;
    },
    { key: STORE_KEY, ...expected },
    { timeout: 5_000 }
  );
  return storedAcademy(page);
}

async function answer(page, questionIndex, optionIndex) {
  await page.locator(`.opt[data-q="${questionIndex}"][data-o="${optionIndex}"]`).click();
}
function observeRuntimeErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('requestfailed', request => {
    errors.push(`requestfailed: ${request.url()} (${request.failure()?.errorText || 'unknown'})`);
  });
  page.on('response', response => {
    if (response.status() >= 400) {
      errors.push(`response:${response.status()}: ${response.url()}`);
    }
  });
  return errors;
}

async function openFreshBackspinPage(viewport, { beforeGoto, reducedMotion='reduce' } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion });
  contexts.add(context);
  const page = await context.newPage();
  pages.add(page);
  const runtimeErrors = observeRuntimeErrors(page);
  if (typeof beforeGoto === 'function') await beforeGoto(page);
  await page.goto(`${baseUrl}/academy.html#/lesson/backspin`, { waitUntil:'networkidle' });
  const root = page.locator('#nativeLesson');
  await root.waitFor({ timeout:5_000 });
  return { page, root, runtimeErrors };
}

async function assertEventuallyRootSurface(page, root, expected) {
  await page.waitForFunction(
    value => document.querySelector('#nativeLesson')?.getAttribute('data-surface') === value,
    expected,
    { timeout:3_000 }
  );
  assert.equal(await root.getAttribute('data-surface'), expected);
}

async function enterSpinLab(page, root) {
  await root.getByRole('button', { name:'Enter the Spin Lab' }).click();
  await assertEventuallyRootSurface(page, root, '1');
}

async function selectBackspinParameter(root, key) {
  const button = root.locator(`[data-param="${key}"]`);
  if (await button.getAttribute('aria-checked') !== 'true') await button.click();
  assert.equal(await button.getAttribute('aria-checked'), 'true');
}

async function setRange(page, selector, value) {
  await page.locator(selector).evaluate((element, next) => {
    element.value = String(next);
    element.dispatchEvent(new Event('input', { bubbles:true }));
  }, value);
}

async function setBackspinParameter(page, root, key, value) {
  await selectBackspinParameter(root, key);
  await setRange(page, '#labRange', value);
}

async function rangeContract(root) {
  return root.locator('#labRange').evaluate(element => ({
    min:Number(element.min),
    max:Number(element.max),
    step:Number(element.step),
    value:Number(element.value),
    ariaLabel:element.getAttribute('aria-label'),
    ariaValueText:element.getAttribute('aria-valuetext')
  }));
}

function assertRangeContract(actual, expected, value) {
  assert.equal(actual.min, expected.min);
  assert.equal(actual.max, expected.max);
  assert.equal(actual.step, expected.step);
  assert.equal(actual.value, value);
  assert.equal(actual.ariaLabel, expected.label);
  assert.equal(actual.ariaValueText, `${value}${expected.unit}`);
}

async function assertFitsViewport(locator, viewport, label) {
  const box = await locator.boundingBox();
  assert.ok(box, `${label} must have a rendered bounding box`);
  assert.ok(box.x >= -1, `${label} starts outside the viewport: ${JSON.stringify(box)}`);
  assert.ok(box.y >= -1, `${label} starts above the viewport: ${JSON.stringify(box)}`);
  assert.ok(box.x + box.width <= viewport.width + 1,
    `${label} overflows viewport width: ${JSON.stringify(box)}`);
  assert.ok(box.y + box.height <= viewport.height + 1,
    `${label} overflows viewport height: ${JSON.stringify(box)}`);
}

async function assertSpinBand(root, label) {
  const band = root.getByText(label, { exact:true });
  assert.equal(await band.count(), 1, `Spin Lab must expose the "${label}" band exactly once`);
  assert.equal(await band.isVisible(), true, `Spin band "${label}" must be visible`);
}

async function waitForBackspinJourney(page, expected) {
  await page.waitForFunction(
    ({ key, expected:target }) => {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const lesson = JSON.parse(raw).lessons?.backspin;
      const journey = lesson?.journey;
      if (!lesson || !journey) return false;
      if (target.surface !== undefined && journey.surface !== target.surface) return false;
      if (target.built !== undefined && journey.mission?.built !== target.built) return false;
      if (target.cut !== undefined && journey.mission?.cut !== target.cut) return false;
      if (target.myths !== undefined
        && JSON.stringify(journey.myths) !== JSON.stringify(target.myths)) return false;
      if (target.diagramTouched !== undefined && lesson.diagramTouched !== target.diagramTouched) {
        return false;
      }
      return true;
    },
    { key:STORE_KEY, expected },
    { timeout:5_000 }
  );
  return (await storedAcademy(page)).lessons.backspin;
}


async function completeMissionAndEnterInfluence(page, root) {
  await enterSpinLab(page, root);
  await setBackspinParameter(page, root, 'dynamicLoft', 30);
  await waitForBackspinJourney(page, { surface:1, built:true, cut:false });
  await setBackspinParameter(page, root, 'dynamicLoft', 10);
  await waitForBackspinJourney(page, { surface:1, built:true, cut:true });

  await setBackspinParameter(page, root, 'dynamicLoft', 25);
  await setBackspinParameter(page, root, 'attackAngle', -3);
  await setBackspinParameter(page, root, 'ballSpeed', 120);
  await page.waitForFunction(() =>
    document.querySelector('#backspinTruth')?.textContent.replaceAll(',', '').trim() === '6048'
  );

  const next = root.locator('.native-lesson__navigation [data-action="next"]');
  assert.equal(await next.isDisabled(), false);
  assert.notEqual(await next.getAttribute('aria-disabled'), 'true');
  await next.click();
  await assertEventuallyRootSurface(page, root, '2');
}

async function completeMissionAndEnterMyths(page, root) {
  await completeMissionAndEnterInfluence(page, root);
  const next = root.locator('.native-lesson__navigation [data-action="next"]');
  assert.equal(await next.isDisabled(), false);
  await next.click();
  await assertEventuallyRootSurface(page, root, '3');
}

async function completeMythsAndEnterMastery(page, root) {
  await completeMissionAndEnterMyths(page, root);
  const completed = [false, false, false];
  for (let index = 0; index < EXPECTED_MYTH_EXPERIMENTS.length; index += 1) {
    const expected = EXPECTED_MYTH_EXPERIMENTS[index];
    await root.locator(`#mythExperiment [data-myth-choice="${expected.answerIndex}"]`).click();
    completed[index] = true;
    await waitForBackspinJourney(page, { surface:3, myths:[...completed] });
    await root.locator('[data-myth-next]').click();
    if (index < EXPECTED_MYTH_EXPERIMENTS.length - 1) {
      await page.waitForFunction(
        next => document.querySelector('#mythExperiment')?.dataset.experimentIndex === String(next),
        index + 1
      );
    }
  }
  await assertEventuallyRootSurface(page, root, '4');
  await page.waitForFunction(key => {
    const journey = JSON.parse(localStorage.getItem(key))?.lessons?.backspin?.journey;
    return journey?.surface === 4
      && typeof journey.masteryAttemptId === 'string'
      && journey.masteryAttemptId.length > 0
      && journey.lastSubmission === null;
  }, STORE_KEY);
  return root.locator('#masteryTask').getAttribute('data-attempt');
}

async function waitForMasteryTask(page, root, index) {
  await page.waitForFunction(
    expected => document.querySelector('#masteryTask')?.dataset.masteryIndex === String(expected),
    index,
    { timeout:3_000 }
  );
  return root.locator('#masteryTask');
}

async function assertMasteryTask(page, root, index) {
  const expected = EXPECTED_MASTERY_TASKS[index];
  const task = await waitForMasteryTask(page, root, index);
  assert.equal(await task.getAttribute('data-mastery-task'), expected.id);
  assert.equal(await task.getAttribute('data-mastery-index'), String(index));
  assert.equal(await task.getAttribute('data-mastery-kind'), expected.kind);
  assert.equal(await task.getAttribute('data-submitted'), 'false');
  assert.ok((await task.getAttribute('data-attempt'))?.length > 0);
  assert.equal(
    (await task.locator('[data-mastery-prompt]').textContent()).replace(/\s+/g, ' ').trim(),
    expected.prompt
  );
  assert.equal(
    (await root.locator('[data-mastery-step]').textContent()).replace(/\s+/g, ' ').trim(),
    `Task ${index + 1} / 5`
  );

  if (expected.choices) {
    for (let choiceIndex = 0; choiceIndex < expected.choices.length; choiceIndex += 1) {
      await assertMinimumTarget(task.locator('[data-mastery-choice]').nth(choiceIndex),
        `Mastery task ${index + 1} choice ${choiceIndex + 1}`);
    }
    assert.deepEqual(
      await task.locator('[data-mastery-choice]').evaluateAll(buttons => buttons.map(button => ({
        index:Number(button.getAttribute('data-mastery-choice')),
        text:button.textContent.replace(/\s+/g, ' ').trim(),
        role:button.getAttribute('role')
      }))),
      expected.choices.map((text, choiceIndex) => ({ index:choiceIndex, text, role:'radio' }))
    );
  }
  if (expected.outputs) {
    assert.equal(await task.locator('[data-mastery-comparison]').isHidden(), true,
      'Engine outputs must stay hidden until the comparison is answered');
  }
  return task;
}

async function answerMasteryChoice(page, task, choiceIndex, { keyboard=false } = {}) {
  const choices = task.locator('[data-mastery-choice]');
  const choice = choices.nth(choiceIndex);
  if (keyboard) {
    await choices.first().focus();
    for (let index = 0; index < choiceIndex; index += 1) {
      await page.keyboard.press('ArrowRight');
    }
    assert.equal(await choice.evaluate(element => document.activeElement === element), true);
    await page.keyboard.press('Space');
  } else {
    await choice.click();
  }
  await task.locator('[data-mastery-feedback]').waitFor({ state:'visible' });
  assert.equal(await choice.getAttribute('aria-checked'), 'true');
  return choice;
}

async function assertMasteryComparison(task, expected) {
  const comparison = task.locator('[data-mastery-comparison]');
  assert.equal(await comparison.isVisible(), true);
  assert.deepEqual(
    await comparison.locator('[data-mastery-engine-output]').evaluateAll(outputs => outputs.map(output => ({
      side:output.getAttribute('data-mastery-engine-output'),
      rpm:Number(output.getAttribute('data-rpm')),
      spinLoft:Number(output.getAttribute('data-spin-loft'))
    }))),
    expected.outputs
  );
}

async function advanceMasteryTask(page, root, nextIndex) {
  const next = root.locator('[data-mastery-next]');
  assert.equal(await next.isDisabled(), false);
  assert.notEqual(await next.getAttribute('aria-disabled'), 'true');
  await next.click();
  if (nextIndex < EXPECTED_MASTERY_TASKS.length) {
    await waitForMasteryTask(page, root, nextIndex);
    await page.waitForFunction(() => {
      const task = document.querySelector('#masteryTask');
      return task?.contains(document.activeElement);
    });
  }
}

async function answerMasteryChoices(page, root, answers, { keyboardTask=-1 } = {}) {
  for (let index = 0; index < 4; index += 1) {
    const task = await assertMasteryTask(page, root, index);
    await answerMasteryChoice(page, task, answers[index], { keyboard:index === keyboardTask });
    if (EXPECTED_MASTERY_TASKS[index].outputs) {
      await assertMasteryComparison(task, EXPECTED_MASTERY_TASKS[index]);
    }
    await advanceMasteryTask(page, root, index + 1);
  }
  return assertMasteryTask(page, root, 4);
}

async function setMasteryTargetState(page, root, state) {
  for (const key of Object.keys(EXPECTED_BACKSPIN_PARAMS)) {
    const chip = root.locator(`[data-mastery-param="${key}"]`);
    if (await chip.getAttribute('aria-checked') !== 'true') await chip.click();
    await setRange(page, '#masteryTargetRange', state[key]);
  }
}

async function waitForMasteryReadout(page, expected) {
  await page.waitForFunction(target => {
    const rpm = document.querySelector('[data-mastery-rpm]');
    const landing = document.querySelector('[data-mastery-landing]');
    const rpmValue = Number(rpm?.getAttribute('data-value')
      || rpm?.textContent.replaceAll(',', '').match(/[\d.]+/)?.[0]);
    const landingValue = Number(landing?.getAttribute('data-value')
      || landing?.textContent.match(/[\d.]+/)?.[0]);
    return rpmValue === target.rpm && landingValue === target.landing;
  }, expected);
}

async function submitMasteryTarget(root) {
  const submit = root.locator('[data-action="submit-mastery-target"][data-mastery-target-submit]');
  assert.equal(await submit.isDisabled(), false, 'Target submission must always be available');
  await submit.click();
  const feedback = root.locator('[data-mastery-target-feedback]');
  await feedback.waitFor({ state:'visible' });
  return feedback;
}

async function installAtomicResultTracker(page) {
  await page.evaluate(key => {
    window.__academyResultWrites = [];
    window.__academyResultSurfaces = [];
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function patchedSetItem(storageKey, value) {
      if (storageKey === key) {
        const parsed = JSON.parse(value);
        const journey = parsed.lessons?.backspin?.journey;
        window.__academyResultWrites.push({
          surface:journey?.surface,
          hasSubmission:Boolean(journey?.lastSubmission),
          attempts:journey?.masteryAttempts,
          xp:parsed.xp
        });
      }
      return original.call(this, storageKey, value);
    };
    const lesson = document.querySelector('#nativeLesson');
    const observer = new MutationObserver(() => {
      if (lesson?.dataset.surface === '5') {
        const parsed = JSON.parse(localStorage.getItem(key));
        const journey = parsed.lessons?.backspin?.journey;
        window.__academyResultSurfaces.push({
          hasSubmission:Boolean(journey?.lastSubmission),
          attempts:journey?.masteryAttempts,
          xp:parsed.xp
        });
      }
    });
    observer.observe(lesson, { attributes:true, attributeFilter:['data-surface'] });
    window.__academyResultObserver = observer;
  }, STORE_KEY);
}

async function atomicResultContract(page) {
  await page.waitForTimeout(0);
  return page.evaluate(() => ({
    writes:window.__academyResultWrites || [],
    surfaces:window.__academyResultSurfaces || []
  }));
}

async function assertMasteryViewport(page, root, viewport, surfaceIndex, content, label) {
  const surface = root.locator(`.native-lesson__surface[data-surface="${surfaceIndex}"]`);
  await assertFitsViewport(surface, viewport, `${label} surface`);
  await assertTypeFloor(content, 10, label);

  const small = await surface.locator('a, button, input, [role="button"]').evaluateAll(elements =>
    elements.filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
    }).map(element => ({
      text:(element.textContent || element.getAttribute('aria-label') || '').trim(),
      width:element.getBoundingClientRect().width,
      height:element.getBoundingClientRect().height
    }))
  );
  assert.deepEqual(small, [], `${label} controls must be at least 44px`);

  const dimensions = await surface.evaluate(element => ({
    scrollHeight:element.scrollHeight,
    clientHeight:element.clientHeight,
    scrollWidth:element.scrollWidth,
    clientWidth:element.clientWidth
  }));
  assert.ok(dimensions.scrollHeight <= dimensions.clientHeight + 1,
    `${label} must fit ${viewport.width}x${viewport.height} vertically: ${JSON.stringify(dimensions)}`);
  assert.ok(dimensions.scrollWidth <= dimensions.clientWidth + 1,
    `${label} must not expose horizontal user-scroll: ${JSON.stringify(dimensions)}`);

  const documentScroll = await page.evaluate(() => ({
    left:document.documentElement.scrollLeft,
    top:document.documentElement.scrollTop,
    width:innerWidth,
    scrollWidth:document.documentElement.scrollWidth
  }));
  assert.equal(documentScroll.left, 0);
  assert.equal(documentScroll.top, 0);
  assert.ok(documentScroll.scrollWidth <= documentScroll.width + 1,
    `${label} must not widen the document: ${JSON.stringify(documentScroll)}`);
}

async function assertMythExperiment(root, {
  index,
  prompt,
  choices,
  answered=false,
  correct
}) {
  const experiment = root.locator('#mythExperiment');
  assert.equal(await experiment.getAttribute('data-experiment-index'), String(index));
  assert.equal(await experiment.getAttribute('data-answered'), String(answered));
  if (correct === undefined) {
    assert.equal(await experiment.getAttribute('data-correct'), null);
  } else {
    assert.equal(await experiment.getAttribute('data-correct'), String(correct));
  }
  assert.equal((await experiment.locator('h3').textContent()).trim(), prompt);
  assert.deepEqual(
    await experiment.locator('[data-myth-choice]').evaluateAll(buttons => buttons.map(button => ({
      index:Number(button.getAttribute('data-myth-choice')),
      text:button.textContent.replace(/\s+/g, ' ').trim(),
      role:button.getAttribute('role')
    }))),
    choices.map((text, choiceIndex) => ({ index:choiceIndex, text, role:'radio' }))
  );
  return experiment;
}

async function mythRunContract(experiment, run) {
  return experiment.locator(`[data-myth-run="${run}"]`).evaluate(element => ({
    rpm:Number(element.dataset.rpm),
    rawRpm:Number(element.dataset.rawRpm),
    spinLoft:Number(element.dataset.spinLoft),
    carry:Number(element.dataset.carry),
    apex:Number(element.dataset.apex),
    landing:Number(element.dataset.landing),
    displayLimit:element.dataset.displayLimit || null
  }));
}

async function assertMythNavigationGate(root, blocked) {
  const next = root.locator('.native-lesson__navigation [data-action="next"][data-myth-next]');
  assert.equal(await next.isDisabled(), blocked);
  assert.equal(await next.getAttribute('aria-disabled'), String(blocked));
}

async function assertMasteryStepGate(root, locked) {
  const step = root.locator('[data-step="mastery"]');
  assert.equal(await step.getAttribute('aria-disabled'), String(locked));
  assert.equal(await step.evaluate(element => element.inert), locked);
}

async function assertMinimumTarget(locator, label) {
  const box = await locator.boundingBox();
  assert.ok(box, `${label} must have a rendered bounding box`);
  assert.ok(box.width >= 44, `${label} is narrower than 44px: ${JSON.stringify(box)}`);
  assert.ok(box.height >= 44, `${label} is shorter than 44px: ${JSON.stringify(box)}`);
}
async function assertTypeFloor(locator, minimum, label) {
  const violations = await locator.locator('*').evaluateAll((elements, floor) => elements.filter(element => {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0 || !element.textContent?.trim()) return false;
    return Number.parseFloat(getComputedStyle(element).fontSize) < floor;
  }).map(element => ({
    tag:element.tagName.toLowerCase(),
    className:typeof element.className === 'string' ? element.className : '',
    text:element.textContent.replace(/\s+/g, ' ').trim().slice(0, 80),
    fontSize:getComputedStyle(element).fontSize
  })), minimum);
  assert.deepEqual(violations, [], `${label} must keep every visible text element at or above ${minimum}px`);
}


async function showInfluenceForState(page, root, state, expectedRpm) {
  await root.locator('[data-step="lab"]').click();
  await assertEventuallyRootSurface(page, root, '1');
  for (const key of Object.keys(EXPECTED_BACKSPIN_PARAMS)) {
    await setBackspinParameter(page, root, key, state[key]);
  }
  await page.waitForFunction(
    value => document.querySelector('#backspinTruth')
      ?.textContent.replaceAll(',', '').trim() === String(value),
    expectedRpm
  );
  await root.locator('.native-lesson__navigation [data-action="next"]').click();
  await assertEventuallyRootSurface(page, root, '2');
  await page.waitForTimeout(350);
}

async function influenceContract(root) {
  return root.locator('#influenceBars [data-influence]').evaluateAll(rows => rows.map(row => ({
    key:row.getAttribute('data-influence'),
    text:row.querySelector('small')?.textContent.replace(/\s+/g, ' ').trim() || ''
  })));
}

async function hapticCount(page, kind) {
  return page.evaluate(async target => {
    const module = await import('/sa-haptics.js');
    return module.default._log.filter(entry => entry.kind === target).length;
  }, kind);
}

async function assertAboveNavigation(locator, navigation, label) {
  const [box, navBox] = await Promise.all([locator.boundingBox(), navigation.boundingBox()]);
  assert.ok(box, `${label} must be rendered`);
  assert.ok(navBox, 'sticky navigation must be rendered');
  assert.ok(
    box.y + box.height <= navBox.y + 1,
    `${label} must remain above sticky navigation: ${JSON.stringify({ box, navBox })}`
  );
}
async function finishMasteryAttempt(page, root, {
  answers,
  targetFixtures,
  keyboardTask=-1,
  trackAtomic=false,
  inspectTarget,
  beforeTarget
}) {
  const targetTask = await answerMasteryChoices(page, root, answers, { keyboardTask });
  const attemptId = await targetTask.getAttribute('data-attempt');
  if (beforeTarget) await beforeTarget(targetTask);
  for (let index = 0; index < targetFixtures.length; index += 1) {
    const fixture = targetFixtures[index];
    await setMasteryTargetState(page, root, fixture.state);
    await waitForMasteryReadout(page, fixture);
    const feedback = await submitMasteryTarget(root);
    if (inspectTarget) await inspectTarget({ index, fixture, feedback, task:targetTask });
  }

  if (trackAtomic) await installAtomicResultTracker(page);
  const hapticsBefore = await hapticLog(page);
  await advanceMasteryTask(page, root, 5);
  await assertEventuallyRootSurface(page, root, '5');
  await page.waitForFunction(key => {
    const journey = JSON.parse(localStorage.getItem(key))?.lessons?.backspin?.journey;
    return journey?.surface === 5
      && journey?.lastSubmission?.attemptId === journey?.masteryAttemptId;
  }, STORE_KEY);
  await page.waitForTimeout(50);
  return {
    attemptId,
    store:await storedAcademy(page),
    hapticsBefore,
    hapticsAfter:await hapticLog(page),
    atomic:trackAtomic ? await atomicResultContract(page) : null
  };
}
async function hapticLog(page) {
  return page.evaluate(async () => {
    const module = await import('/sa-haptics.js');
    return module.default._log.map(entry => entry.kind);
  });
}

async function assertNativeResult(root, {
  attemptId,
  mastered,
  correct,
  xp,
  abilities,
  rank
}) {
  const result = root.locator('#nativeLessonResult');
  assert.equal(await result.getAttribute('data-result-mastered'), String(mastered));
  assert.equal(await result.getAttribute('data-attempt'), attemptId);
  assert.equal(
    (await result.locator('[data-result-score]').textContent()).replace(/\s+/g, ' ').trim(),
    `${correct} / 5`
  );
  assert.equal(
    (await result.locator('[data-result-xp]').textContent()).replace(/\s+/g, ' ').trim(),
    `+${xp} XP`
  );
  assert.deepEqual(
    await result.locator('[data-result-ability]').allTextContents()
      .then(values => values.map(value => value.replace(/\s+/g, ' ').trim())),
    abilities
  );
  const rankNode = result.locator('[data-result-rank]');
  if (rank) {
    assert.equal(await rankNode.isVisible(), true);
    assert.match((await rankNode.textContent()).replace(/\s+/g, ' ').trim(), rank);
  } else {
    assert.equal(await rankNode.isHidden(), true,
      'Rank must stay hidden unless persisted XP crossed a real threshold');
  }

  const eyebrow = (await result.locator('[data-result-eyebrow]').textContent()).trim().toUpperCase();
  assert.equal(eyebrow, mastered ? 'BACKSPIN MASTERED' : 'BACKSPIN COMPLETE');
  if (mastered) {
    assert.equal(
      (await result.locator('[data-result-copy]').textContent()).replace(/\s+/g, ' ').trim(),
      'You can separate spin loft from \u201chitting down\u201d and control a shot\'s stopping flight in the Flightglass model.'
    );
    assert.equal(await result.locator('[data-action="next-lesson"]').isVisible(), true);
  } else {
    assert.match(await result.locator('[data-result-copy]').textContent(),
      new RegExp(`${correct} of 5.*Retry for mastery \\(4/5\\)`, 'i'));
    assert.equal(await result.locator('[data-action="retry-mastery"]').isVisible(), true);
    assert.equal(await result.locator('[data-action="next-lesson"]').count(), 0);
  }
  assert.equal(await result.locator('[data-action="back-to-path"]').isVisible(), true);
  return result;
}

function expectedTaskResults(correctIndexes) {
  return EXPECTED_MASTERY_TASKS.map((_, index) => ({
    resolved:correctIndexes.includes(index),
    firstTry:correctIndexes.includes(index)
  }));
}

function seededMasteryStore({ xp=0, attemptId='seeded-mastery-attempt' } = {}) {
  return {
    version:1,
    xp,
    lessons:{
      backspin:{
        read:false,
        quizBest:0,
        quizAttempts:0,
        perfect:false,
        completed:false,
        completedAt:null,
        diagramTouched:false,
        quizBestCorrect:0,
        quizLen:0,
        mastered:false,
        journey:{
          surface:4,
          mission:{ built:true, cut:true },
          myths:[true, true, true],
          masteryBest:0,
          masteryAttempts:0,
          masteryAttemptId:attemptId,
          lastSubmission:null
        }
      }
    },
    unlocked:['backspin'],
    badges:[],
    lastOpened:'backspin'
  };
}

async function auditNativeSurface(page, root, viewport, surfaceIndex, label) {
  assert.equal(await root.getAttribute('data-surface'), String(surfaceIndex));
  const surface = root.locator(`.native-lesson__surface[data-surface="${surfaceIndex}"]`);
  await assertFitsViewport(surface, viewport, `${label} active surface`);
  await assertFitsViewport(root.locator('.native-lesson__header'), viewport, `${label} header`);
  await assertFitsViewport(root.locator('.native-lesson__navigation'), viewport, `${label} navigation`);
  await assertTypeFloor(surface, 10, `${label} type`);
  await assertTypeFloor(root.locator('.native-lesson__header'), 10, `${label} header type`);
  await assertTypeFloor(root.locator('.native-lesson__navigation'), 10, `${label} navigation type`);

  const documentState = await page.evaluate(() => ({
    left:document.documentElement.scrollLeft,
    top:document.documentElement.scrollTop,
    width:innerWidth,
    height:innerHeight,
    scrollWidth:document.documentElement.scrollWidth,
    scrollHeight:document.documentElement.scrollHeight
  }));
  assert.equal(documentState.left, 0, `${label} document scrollLeft`);
  assert.equal(documentState.top, 0, `${label} document scrollTop`);
  assert.ok(documentState.scrollWidth <= documentState.width + 1,
    `${label} widened the document: ${JSON.stringify(documentState)}`);
  assert.ok(documentState.scrollHeight <= documentState.height + 1,
    `${label} made the document vertically scrollable: ${JSON.stringify(documentState)}`);

  const surfaceState = await surface.evaluate(element => ({
    left:element.scrollLeft,
    top:element.scrollTop,
    scrollWidth:element.scrollWidth,
    clientWidth:element.clientWidth,
    scrollHeight:element.scrollHeight,
    clientHeight:element.clientHeight,
    overflowX:getComputedStyle(element).overflowX,
    overflowY:getComputedStyle(element).overflowY
  }));
  assert.equal(surfaceState.left, 0, `${label} surface scrollLeft`);
  assert.equal(surfaceState.top, 0, `${label} surface scrollTop`);
  assert.ok(surfaceState.scrollWidth <= surfaceState.clientWidth + 1,
    `${label} has hidden horizontal overflow: ${JSON.stringify(surfaceState)}`);
  assert.ok(surfaceState.scrollHeight <= surfaceState.clientHeight + 1,
    `${label} has hidden vertical overflow: ${JSON.stringify(surfaceState)}`);

  const lessonScroll = await root.evaluate(element => ({
    left:element.scrollLeft,
    top:element.scrollTop,
    overflowX:getComputedStyle(element).overflowX,
    overflowY:getComputedStyle(element).overflowY
  }));
  assert.equal(lessonScroll.left, 0);
  assert.equal(lessonScroll.top, 0);
  assert.match(lessonScroll.overflowX, /hidden|clip/);
  assert.match(lessonScroll.overflowY, /hidden|clip/);

  const small = await root.locator('a, button, input, [role="button"]').evaluateAll(elements =>
    elements.filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
    }).map(element => ({
      text:(element.textContent || element.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim(),
      width:element.getBoundingClientRect().width,
      height:element.getBoundingClientRect().height
    }))
  );
  assert.deepEqual(small, [], `${label} has undersized interactive targets`);
}

async function tabToSelector(page, selector, { reverse=false, limit=120 } = {}) {
  const key = reverse ? 'Shift+Tab' : 'Tab';
  for (let index = 0; index < limit; index += 1) {
    const matched = await page.evaluate(target =>
      document.activeElement instanceof Element && document.activeElement.matches(target),
    selector);
    if (matched) return;
    await page.keyboard.press(key);
  }
  const active = await page.evaluate(() => ({
    tag:document.activeElement?.tagName,
    id:document.activeElement?.id,
    className:document.activeElement?.className,
    text:document.activeElement?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 80)
  }));
  assert.fail(`Keyboard traversal did not reach ${selector}: ${JSON.stringify(active)}`);
}

async function assertKeyboardFocus(page, selector, label) {
  const focus = await page.evaluate(target => {
    const element = document.activeElement;
    if (!(element instanceof HTMLElement) || !element.matches(target)) return { matched:false };
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      matched:true,
      focusVisible:element.matches(':focus-visible'),
      width:rect.width,
      height:rect.height,
      visibility:style.visibility,
      display:style.display,
      outlineStyle:style.outlineStyle,
      outlineWidth:style.outlineWidth,
      boxShadow:style.boxShadow
    };
  }, selector);
  assert.equal(focus.matched, true, `${label} must own focus`);
  assert.equal(focus.focusVisible, true, `${label} must expose :focus-visible`);
  assert.ok(focus.width > 0 && focus.height > 0, `${label} must be rendered`);
  assert.notEqual(focus.visibility, 'hidden');
  assert.notEqual(focus.display, 'none');
  const visiblyStyled = (focus.outlineStyle !== 'none' && focus.outlineWidth !== '0px')
    || focus.boxShadow !== 'none';
  assert.equal(visiblyStyled, true, `${label} needs a visible focus treatment`);
}

async function pressKey(page, key, times) {
  for (let index = 0; index < times; index += 1) await page.keyboard.press(key);
}

async function nativeSemanticSnapshot(root) {
  return root.evaluate(lesson => {
    const compact = element => (element?.textContent || '').replace(/\s+/g, ' ').trim();
    const data = element => [...(element?.attributes || [])]
      .filter(attribute => attribute.name.startsWith('data-'))
      .map(attribute => [attribute.name, attribute.value])
      .sort(([left], [right]) => left.localeCompare(right));
    const range = lesson.querySelector('#labRange');
    const experiment = lesson.querySelector('#mythExperiment');
    const nullableAttribute = (element, name) => element?.hasAttribute(name)
      ? element.getAttribute(name)
      : null;

    return {
      surface:lesson.dataset.surface,
      modelStatus:lesson.dataset.modelStatus,
      mission:{
        built:lesson.querySelector('#missionStageBuild')?.dataset.complete,
        cut:lesson.querySelector('#missionStageCut')?.dataset.complete,
        count:compact(lesson.querySelector('[data-mission-count]'))
      },
      steps:[...lesson.querySelectorAll('[data-step]')].map(step => ({
        key:step.dataset.step,
        current:step.getAttribute('aria-current'),
        disabled:step.getAttribute('aria-disabled'),
        inert:step.inert,
        tabIndex:step.tabIndex
      })),
      lab:{
        activeParam:lesson.querySelector('[data-param][aria-checked="true"]')?.dataset.param || null,
        range:range ? {
          value:range.value,
          min:range.min,
          max:range.max,
          step:range.step,
          label:range.getAttribute('aria-label'),
          valueText:range.getAttribute('aria-valuetext')
        } : null,
        truth:compact(lesson.querySelector('#backspinTruth')),
        spinLoft:compact(lesson.querySelector('[data-spin-loft]')),
        carry:compact(lesson.querySelector('[data-carry]')),
        height:compact(lesson.querySelector('[data-apex]')),
        landing:compact(lesson.querySelector('[data-landing]')),
        cause:compact(lesson.querySelector('#causeChain'))
      },
      influence:[...lesson.querySelectorAll('#influenceBars [data-influence]')].map(row => ({
        key:row.dataset.influence,
        expanded:row.getAttribute('aria-expanded'),
        label:compact(row),
        detail:compact(row.nextElementSibling?.matches('[data-influence-detail]')
          ? row.nextElementSibling
          : null)
      })),
      myth:{
        index:experiment?.dataset.experimentIndex || null,
        id:experiment?.dataset.experimentId || null,
        answered:experiment?.dataset.answered || null,
        correct:nullableAttribute(experiment, 'data-correct'),
        prompt:compact(experiment?.querySelector('[data-myth-prompt]')),
        choices:[...(experiment?.querySelectorAll('[data-myth-choice]') || [])].map(choice => ({
          index:choice.dataset.mythChoice,
          checked:choice.getAttribute('aria-checked'),
          disabled:choice.getAttribute('aria-disabled'),
          outcome:choice.dataset.outcome,
          text:compact(choice)
        })),
        evidence:compact(experiment?.querySelector('[data-myth-evidence]')),
        runs:[...(experiment?.querySelectorAll('[data-myth-run]') || [])].map(run => ({
          kind:run.dataset.mythRun,
          rpm:run.dataset.rpm,
          rawRpm:run.dataset.rawRpm,
          spinLoft:run.dataset.spinLoft,
          carry:run.dataset.carry,
          apex:run.dataset.apex,
          landing:run.dataset.landing,
          displayLimit:run.dataset.displayLimit,
          text:compact(run)
        })),
        metrics:[...(experiment?.querySelectorAll('[data-myth-metric]') || [])].map(metric => ({
          kind:metric.dataset.mythMetric,
          data:data(metric),
          text:compact(metric)
        }))
      }
    };
  });
}

async function runMotionJourney(reducedMotion) {
  const { page, root, runtimeErrors } = await openFreshBackspinPage(
    { width:430, height:932 },
    { reducedMotion }
  );
  await enterSpinLab(page, root);
  const immediateCause = await page.evaluate(() => {
    const range = document.querySelector('#labRange');
    range.value = '26';
    range.dispatchEvent(new Event('input', { bubbles:true }));
    return document.querySelector('#causeChain')?.textContent.replace(/\s+/g, ' ').trim() || '';
  });
  await page.waitForFunction(() => {
    const cause = document.querySelector('#causeChain')?.textContent || '';
    return /Dynamic loft/i.test(cause) && !/Move one input/i.test(cause);
  });
  const lab = await nativeSemanticSnapshot(root);

  await setBackspinParameter(page, root, 'dynamicLoft', 30);
  await waitForBackspinJourney(page, { surface:1, built:true, cut:false });
  await page.waitForTimeout(350);
  await setBackspinParameter(page, root, 'dynamicLoft', 10);
  await waitForBackspinJourney(page, { surface:1, built:true, cut:true });
  await page.waitForTimeout(350);
  await setBackspinParameter(page, root, 'dynamicLoft', 25);
  await page.waitForFunction(() =>
    document.querySelector('#backspinTruth')?.textContent.replaceAll(',', '').trim() === '6048'
  );
  await page.waitForTimeout(350);

  const toInfluence = await root.locator('.native-lesson__navigation [data-action="next"]').evaluate(button => {
    const lesson = document.querySelector('#nativeLesson');
    const before = lesson?.dataset.surface;
    button.click();
    const pagerStyle = getComputedStyle(lesson.querySelector('[data-native-pager]'));
    return {
      before,
      after:lesson?.dataset.surface,
      transitionProperty:pagerStyle.transitionProperty,
      transitionDuration:pagerStyle.transitionDuration
    };
  });
  await assertEventuallyRootSurface(page, root, '2');
  const influence = await nativeSemanticSnapshot(root);

  const toMyths = await root.locator('.native-lesson__navigation [data-action="next"]').evaluate(button => {
    const lesson = document.querySelector('#nativeLesson');
    const before = lesson?.dataset.surface;
    button.click();
    const pagerStyle = getComputedStyle(lesson.querySelector('[data-native-pager]'));
    return {
      before,
      after:lesson?.dataset.surface,
      transitionProperty:pagerStyle.transitionProperty,
      transitionDuration:pagerStyle.transitionDuration
    };
  });
  await assertEventuallyRootSurface(page, root, '3');

  const firstAnswer = EXPECTED_MYTH_EXPERIMENTS[0].answerIndex;
  const mythReveal = await root.locator(`[data-myth-choice="${firstAnswer}"]`).evaluate(button => {
    button.click();
    const evidence = document.querySelector('#mythExperiment [data-myth-evidence]');
    const rows = [...document.querySelectorAll('#mythExperiment [data-myth-run] li')];
    return {
      reveal:evidence?.dataset.reveal || null,
      metricCount:rows.length,
      metrics:rows.map(row => {
        const style = getComputedStyle(row);
        return {
          text:(row.textContent || '').replace(/\s+/g, ' ').trim(),
          animationName:style.animationName,
          opacity:style.opacity
        };
      })
    };
  });
  await waitForBackspinJourney(page, { surface:3, myths:[true, false, false] });
  const myth = await nativeSemanticSnapshot(root);

  return {
    page,
    root,
    runtimeErrors,
    immediateCause,
    reduced:await root.getAttribute('data-reduced-motion'),
    lab,
    influence,
    myth,
    toInfluence,
    toMyths,
    mythReveal
  };
}
test('browser contract has only executable and specifically named cases', () => {
  const source = readFileSync(fileURLToPath(import.meta.url), 'utf8');
  const skippedSyntax = new RegExp('\\btest\\s*\\.\\s*skip\\b|\\.\\s*skip\\s*\\(');
  assert.doesNotMatch(source, skippedSyntax);

  const names = [...source.matchAll(/\btest\(\s*(?:'([^']+)'|"([^"]+)"|`([^`]+)`)/g)]
    .map(match => match[1] || match[2] || match[3]);
  assert.ok(names.length >= 1);
  for (const name of names) {
    assert.doesNotMatch(name, /place(?:holder)|\btodo\b|\btbd\b|coming soon|implement me/i);
  }
});
test('the harness launches the engine selected by the webkit project flag', () => {
  assert.equal(browser.browserType().name(), WEBKIT_PROJECT ? 'webkit' : 'chromium');
});

test('safe-area environment variables resolve without horizontal scroll on this engine',
  { timeout: 30_000 }, async () => {
    const { page, root, runtimeErrors } = await openFreshBackspinPage({ width: 430, height: 932 });
    assert.equal(
      await page.evaluate(() => CSS.supports('padding-bottom: env(safe-area-inset-bottom)')),
      true,
      'safe-area env() must be supported by the shipping engine'
    );
    const navigation = root.locator('.native-lesson__navigation');
    await navigation.waitFor();
    assert.match(
      await navigation.evaluate(element => getComputedStyle(element).paddingBottom),
      /^\d+(?:\.\d+)?px$/,
      'safe-area padding must compute to a concrete pixel value'
    );
    assert.equal(await page.evaluate(() => document.documentElement.scrollLeft), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollTop), 0);
    assert.deepEqual(runtimeErrors, []);
  });
test.before(async () => {
  server = await startStaticServer();
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    browser = await launchLocalBrowser();
  } catch (error) {
    await closeServer(server);
    server = undefined;
    throw error;
  }
});

test.after(async () => {
  for (const page of pages) {
    if (!page.isClosed()) await page.close().catch(() => {});
  }
  pages.clear();
  for (const context of contexts) {
    await context.close().catch(() => {});
  }
  contexts.clear();
  if (browser) await browser.close().catch(() => {});
  await closeServer(server);
});

test('native Backspin production route renders its stable six-surface shell', { timeout: 30_000 }, async () => {
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    reducedMotion: 'reduce'
  });
  contexts.add(context);

  const page = await context.newPage();
  pages.add(page);
  const runtimeErrors = observeRuntimeErrors(page);

  await page.goto(`${baseUrl}/academy.html#/lesson/backspin`, { waitUntil: 'networkidle' });
  const root = page.locator('#nativeLesson');
  await root.waitFor({ timeout: 5_000 });

  assert.equal(await root.evaluate(element => element.tagName), 'SECTION');
  assert.equal(await root.getAttribute('data-lesson'), 'backspin');
  assert.equal(await root.getAttribute('data-surface'), '0');
  assert.equal(
    await root.locator('[data-step="mission"]').getAttribute('aria-current'),
    'step'
  );

  for (const selector of NATIVE_BACKSPIN_SELECTORS) {
    assert.equal(
      await root.locator(selector).count(),
      1,
      `${selector} must exist exactly once inside #nativeLesson`
    );
  }

  await page.waitForTimeout(100);
  assert.deepEqual(runtimeErrors, []);
});

for (const viewport of BACKSPIN_VIEWPORTS) {
  const viewportLabel = `${viewport.width}x${viewport.height}`;

  test(`Backspin Spin Lab fits ${viewportLabel} and follows the model contract`, { timeout:45_000 }, async () => {
    const { page, root, runtimeErrors } = await openFreshBackspinPage(viewport);

    assert.equal(await root.getAttribute('data-surface'), '0');
    assert.equal(await root.locator('#missionStageBuild').getAttribute('data-complete'), 'false');
    assert.equal(await root.locator('#missionStageCut').getAttribute('data-complete'), 'false');
    assert.match(await root.locator('#missionStageBuild').textContent(), /7,000 rpm/i);
    assert.match(await root.locator('#missionStageCut').textContent(), /3,500 rpm/i);

    await enterSpinLab(page, root);
    const initialJourney = await waitForBackspinJourney(page, {
      surface:1,
      built:false,
      cut:false
    });
    assert.deepEqual(initialJourney.journey.mission, { built:false, cut:false });

    for (const [selector, label] of [
      ['#backspinTruth', 'Backspin truth'],
      ['#flightCanvas', 'Flight canvas'],
      ['#labRange', 'Lab range'],
      ['.native-lesson__navigation', 'Sticky lesson navigation'],
      ['.native-lesson__next', 'Sticky next action']
    ]) {
      const locator = root.locator(selector);
      assert.equal(await locator.isVisible(), true, `${label} must be visible at ${viewportLabel}`);
      await assertFitsViewport(locator, viewport, label);
    }

    const modelParams = await page.evaluate(async () => {
      const { BACKSPIN_PARAMS } = await import('./academy-backspin-model.js');
      return BACKSPIN_PARAMS;
    });
    assert.deepEqual(modelParams, EXPECTED_BACKSPIN_PARAMS,
      'Browser controls and tests must consume the exported BACKSPIN_PARAMS contract');

    const defaults = { dynamicLoft:25, attackAngle:-3, ballSpeed:120 };
    for (const key of Object.keys(EXPECTED_BACKSPIN_PARAMS)) {
      await selectBackspinParameter(root, key);
      assertRangeContract(
        await rangeContract(root),
        EXPECTED_BACKSPIN_PARAMS[key],
        defaults[key]
      );
    }

    const initialBand = root.getByText('Iron spin window', { exact:true });
    const initialBandCount = await initialBand.count();
    const initialBandVisible = initialBandCount === 1 && await initialBand.isVisible();

    await setBackspinParameter(page, root, 'dynamicLoft', 26);
    await page.waitForFunction(() => {
      const text = document.querySelector('#causeChain')?.textContent || '';
      return !text.includes('Move one input') && /Dynamic loft/i.test(text);
    }, undefined, { timeout:2_000 });
    const causeText = await root.locator('#causeChain').textContent();
    assert.match(causeText, /Dynamic loft/i);
    assert.match(causeText, /Spin loft/i);
    assert.match(causeText, /Backspin/i);
    assert.match(causeText, /Apex/i);

    const exposedGhostCount = await root.locator(
      '[data-flight-ghost], #flightGhost, .native-lesson__flight-ghost'
    ).count();
    assert.ok(exposedGhostCount <= 1, `Lab exposes ${exposedGhostCount} ghost trajectories`);

    await setBackspinParameter(page, root, 'dynamicLoft', 48);
    await setBackspinParameter(page, root, 'attackAngle', -8);
    await setBackspinParameter(page, root, 'ballSpeed', 160);
    await page.waitForFunction(() =>
      document.querySelector('#backspinTruth')?.textContent.replaceAll(',', '').trim() === '9000'
    );
    assert.equal((await root.locator('#backspinTruth').textContent()).trim(), '9,000');
    const limit = root.locator('[data-engine-limit]');
    assert.equal(await limit.isVisible(), true);
    assert.equal((await limit.textContent()).trim(), 'Display limit');
    assert.match(await limit.getAttribute('aria-label'), /9,000 rpm ceiling/i);
    const highBand = root.getByText('High-spin delivery', { exact:true });
    const highBandCount = await highBand.count();
    const highBandVisible = highBandCount === 1 && await highBand.isVisible();

    await setBackspinParameter(page, root, 'dynamicLoft', 10);
    await setBackspinParameter(page, root, 'attackAngle', 6);
    await setBackspinParameter(page, root, 'ballSpeed', 90);
    await page.waitForFunction(() =>
      document.querySelector('#backspinTruth')?.textContent.replaceAll(',', '').trim() === '1500'
    );
    assert.equal((await root.locator('#backspinTruth').textContent()).trim(), '1,500');
    assert.equal(await limit.isVisible(), true);
    assert.equal((await limit.textContent()).trim(), 'Model floor');
    const floorLabel = await limit.getAttribute('aria-label');
    assert.match(floorLabel, /1,500 rpm/i);
    assert.doesNotMatch(floorLabel, /9,000 rpm/i);
    const lowBand = root.getByText('Low-spin delivery', { exact:true });
    const lowBandCount = await lowBand.count();
    const lowBandVisible = lowBandCount === 1 && await lowBand.isVisible();

    assert.equal(initialBandCount, 1, 'Initial 6,048 rpm state needs one Iron spin window label');
    assert.equal(initialBandVisible, true, 'Initial Iron spin window label must be visible');
    assert.equal(highBandCount, 1, 'Ceiling state needs one High-spin delivery label');
    assert.equal(highBandVisible, true, 'High-spin delivery label must be visible');
    assert.equal(lowBandCount, 1, 'Floor state needs one Low-spin delivery label');
    assert.equal(lowBandVisible, true, 'Low-spin delivery label must be visible');

    await page.waitForTimeout(150);
    assert.deepEqual(runtimeErrors, []);
  });

  test(`Backspin ordered mission gates and restores progress at ${viewportLabel}`, { timeout:45_000 }, async () => {
    const { page, root, runtimeErrors } = await openFreshBackspinPage(viewport);

    assert.equal(await root.locator('#missionStageBuild').getAttribute('data-complete'), 'false');
    assert.equal(await root.locator('#missionStageCut').getAttribute('data-complete'), 'false');
    await enterSpinLab(page, root);
    await waitForBackspinJourney(page, { surface:1, built:false, cut:false });

    await setBackspinParameter(page, root, 'dynamicLoft', 10);
    await page.waitForFunction(() => {
      const value = Number((document.querySelector('#backspinTruth')?.textContent || '').replaceAll(',', ''));
      return value > 0 && value < 3500;
    });
    const lowBeforeBuild = await waitForBackspinJourney(page, {
      surface:1,
      built:false,
      cut:false,
      diagramTouched:true
    });
    assert.equal(lowBeforeBuild.journey.mission.built, false);
    assert.equal(lowBeforeBuild.journey.mission.cut, false,
      'Dropping below 3,500 rpm before building must not credit the cut stage');
    assert.equal(lowBeforeBuild.diagramTouched, true,
      'Native Lab interaction must preserve diagramTouched badge compatibility');
    assert.equal(await root.locator('#missionStageBuild').getAttribute('data-complete'), 'false');
    assert.equal(await root.locator('#missionStageCut').getAttribute('data-complete'), 'false');

    const next = root.locator('.native-lesson__navigation [data-action="next"]');
    const nextIsGated = await next.isDisabled()
      || await next.getAttribute('aria-disabled') === 'true';
    if (!nextIsGated) await next.click();
    await page.waitForTimeout(100);
    assert.equal(await root.getAttribute('data-surface'), '1',
      'Influence must stay gated until build and cut are both complete');
    assert.equal(await root.locator('[data-step="influence"]').getAttribute('aria-disabled'), 'true');

    await setBackspinParameter(page, root, 'dynamicLoft', 30);
    const built = await waitForBackspinJourney(page, {
      surface:1,
      built:true,
      cut:false,
      diagramTouched:true
    });
    assert.equal(built.journey.mission.built, true);
    assert.equal(built.journey.mission.cut, false);
    assert.equal(await root.locator('#missionStageBuild').getAttribute('data-complete'), 'true');
    assert.equal(await root.locator('#missionStageCut').getAttribute('data-complete'), 'false');

    await setBackspinParameter(page, root, 'dynamicLoft', 10);
    const completed = await waitForBackspinJourney(page, {
      surface:1,
      built:true,
      cut:true,
      diagramTouched:true
    });
    assert.deepEqual(completed.journey.mission, { built:true, cut:true });
    assert.equal(await root.locator('#missionStageCut').getAttribute('data-complete'), 'true');

    assert.notEqual(await next.getAttribute('aria-disabled'), 'true');
    assert.equal(await next.isDisabled(), false);
    await next.click();
    await assertEventuallyRootSurface(page, root, '2');
    const influenceJourney = await waitForBackspinJourney(page, {
      surface:2,
      built:true,
      cut:true,
      diagramTouched:true
    });
    assert.equal(influenceJourney.journey.surface, 2);

    await page.reload({ waitUntil:'networkidle' });
    await root.waitFor({ timeout:5_000 });
    assert.equal(await root.getAttribute('data-surface'), '2');
    assert.equal(await root.locator('[data-step="influence"]').getAttribute('aria-current'), 'step');
    assert.equal(await root.locator('#missionStageBuild').getAttribute('data-complete'), 'true');
    assert.equal(await root.locator('#missionStageCut').getAttribute('data-complete'), 'true');
    const restored = (await storedAcademy(page)).lessons.backspin;
    assert.deepEqual(restored.journey.mission, { built:true, cut:true });
    assert.equal(restored.journey.surface, 2);
    assert.equal(restored.diagramTouched, true);

    await page.waitForTimeout(150);
    assert.deepEqual(runtimeErrors, []);
  });
}

test('Backspin clamps inconsistent legacy Influence progress back to the Lab gate', { timeout:30_000 }, async () => {
  const context = await browser.newContext({
    viewport:{ width:430, height:932 },
    reducedMotion:'reduce'
  });
  contexts.add(context);
  const legacyJourney = {
    version:1,
    xp:0,
    lessons:{
      backspin:{
        read:false,
        diagramTouched:false,
        journey:{
          surface:2,
          mission:{ built:false, cut:false },
          myths:[false, false, false],
          masteryBest:0,
          masteryAttempts:0,
          masteryAttemptId:null,
          lastSubmission:null
        }
      }
    },
    unlocked:['backspin'],
    badges:[],
    lastOpened:'backspin'
  };
  await context.addInitScript(({ key, value }) => {
    localStorage.setItem(key, value);
  }, { key:STORE_KEY, value:JSON.stringify(legacyJourney) });

  const page = await context.newPage();
  pages.add(page);
  const runtimeErrors = observeRuntimeErrors(page);
  await page.goto(`${baseUrl}/academy.html#/lesson/backspin`, { waitUntil:'networkidle' });
  const root = page.locator('#nativeLesson');
  await root.waitFor({ timeout:5_000 });
  const clamped = await waitForBackspinJourney(page, { surface:1, built:false, cut:false });
  assert.equal(clamped.journey.surface, 1,
    'The repaired Lab gate must replace the inconsistent stored surface');


  assert.equal(await root.getAttribute('data-surface'), '1',
    'Stored surface 2 cannot bypass an incomplete ordered mission');
  assert.equal(await root.locator('[data-step="lab"]').getAttribute('aria-current'), 'step');
  assert.equal(await root.locator('[data-step="influence"]').getAttribute('aria-disabled'), 'true');
  assert.equal(await root.locator('.native-lesson__surface[data-surface="2"]').getAttribute('aria-hidden'), 'true');
  assert.equal(await root.locator('#missionStageBuild').getAttribute('data-complete'), 'false');
  assert.equal(await root.locator('#missionStageCut').getAttribute('data-complete'), 'false');
  assert.deepEqual(runtimeErrors, []);
});

test('Backspin Influence preserves exact sensitivity through near-clamp, ceiling and floor states', { timeout:60_000 }, async () => {
  const { page, root, runtimeErrors } = await openFreshBackspinPage({ width:375, height:812 });
  await completeMissionAndEnterInfluence(page, root);

  assert.deepEqual(await influenceContract(root), [
    { key:'dynamicLoft', text:'+216 rpm / degree' },
    { key:'attackAngle', text:'\u2212216 rpm / degree' },
    { key:'ballSpeed', text:'+50 rpm / mph' }
  ]);
  const influenceSurface = root.locator('.native-lesson__surface[data-surface="2"]');
  assert.equal(await influenceSurface.locator('input[type="range"]').count(), 0,
    'Influence must not introduce a second free slider');

  await showInfluenceForState(page, root, {
    dynamicLoft:38,
    attackAngle:-3,
    ballSpeed:120
  }, 8856);
  const nearClamp = await influenceContract(root);
  assert.equal(
    nearClamp.find(row => row.key === 'dynamicLoft')?.text,
    '+216 rpm / degree',
    'Near the ceiling, sensitivity must use normalized raw +216 rather than clipped +144'
  );
  const nearBars = root.locator('#influenceBars');
  const nearNote = root.locator('#influenceLimitNote');
  assert.match(await nearBars.getAttribute('aria-description'), /Underlying model sensitivity.*one-unit sample.*display limit/i);
  assert.equal(await nearBars.getAttribute('aria-describedby'), 'influenceLimitNote');
  assert.equal(await nearNote.isVisible(), true);
  assert.match(await nearNote.textContent(), /one-unit sample reaches a display limit/i);
  assert.match(
    await root.locator('[data-influence="dynamicLoft"]').getAttribute('aria-label'),
    /underlying model sensitivity.*sample reaches a display limit/i
  );

  await showInfluenceForState(page, root, {
    dynamicLoft:48,
    attackAngle:-8,
    ballSpeed:160
  }, 9000);
  const truth = root.locator('#backspinTruth');
  const limit = root.locator('#backspinLimit');
  assert.equal((await truth.textContent()).trim(), '9,000');
  assert.equal(await limit.getAttribute('hidden'), null);
  assert.equal((await limit.textContent()).trim(), 'Display limit');
  assert.match(await limit.getAttribute('aria-label'), /9,000 rpm ceiling/i);

  const bars = root.locator('#influenceBars');
  assert.match(
    await bars.getAttribute('aria-description'),
    /Underlying model sensitivity.*display capped at 9,000 rpm/i
  );
  const ceilingContract = await influenceContract(root);
  assert.deepEqual(ceilingContract.map(row => row.key), [
    'dynamicLoft',
    'attackAngle',
    'ballSpeed'
  ]);
  for (const row of ceilingContract) {
    const magnitude = Number(row.text.match(/[\d,]+/)?.[0].replaceAll(',', ''));
    assert.ok(magnitude > 0, `${row.key} must retain non-zero raw sensitivity at the ceiling`);
  }

  await root.locator('#influenceBars [data-influence="dynamicLoft"]').click();
  const comparison = root.locator('[data-influence-comparison="dynamicLoft"]');
  assert.equal(await comparison.isVisible(), true);
  assert.equal(await comparison.getAttribute('data-base-value'), '48');
  assert.equal(await comparison.getAttribute('data-sample-value'), '47',
    'The maximum endpoint must sample the in-range -1 state');
  assert.equal(await comparison.getAttribute('data-sample-direction'), '-1');
  assert.equal(await comparison.getAttribute('data-normalized-delta'), '288',
    'The in-range -1 sample must be normalized to the equivalent +1 direction');
  assert.match(await comparison.textContent(), /Equivalent \+1\u00b0 sensitivity:\s*\+288 rpm/i);
  assert.equal(await influenceSurface.locator('input[type="range"]').count(), 0);
  await root.locator('[data-lie="wet"]').click();
  const navigation = root.locator('.native-lesson__navigation');
  const fitNodes = [
    { locator:comparison, label:'expanded A/B comparison' },
    { locator:root.locator('#influenceLimitNote'), label:'display-limit explanation' },
    { locator:root.locator('#realWorldRegister'), label:'real-world register' }
  ];
  for (const item of fitNodes) {
    await assertAboveNavigation(item.locator, navigation, item.label);
  }
  const dimensions = await influenceSurface.evaluate(element => ({ scrollHeight:element.scrollHeight, clientHeight:element.clientHeight }));
  assert.ok(
    dimensions.scrollHeight <= dimensions.clientHeight + 1,
    `Influence must fit 375x812 without hidden overflow: ${JSON.stringify(dimensions)}`
  );

  await showInfluenceForState(page, root, {
    dynamicLoft:10,
    attackAngle:6,
    ballSpeed:90
  }, 1500);
  assert.equal((await truth.textContent()).trim(), '1,500');
  assert.equal(await limit.getAttribute('hidden'), null);
  assert.equal((await limit.textContent()).trim(), 'Model floor');
  assert.match(await limit.getAttribute('aria-label'), /1,500 rpm/i);
  assert.doesNotMatch(await limit.getAttribute('aria-label'), /9,000 rpm/i);
  const floorDescription = await bars.getAttribute('aria-description');
  assert.match(floorDescription, /Underlying model sensitivity.*display floored at 1,500 rpm/i);
  assert.doesNotMatch(floorDescription, /9,000 rpm/i);
  for (const row of await influenceContract(root)) {
    const magnitude = Number(row.text.match(/[\d,]+/)?.[0].replaceAll(',', ''));
    assert.ok(magnitude > 0, `${row.key} must retain non-zero raw sensitivity at the floor`);
  }

  await page.waitForTimeout(350);
  assert.deepEqual(runtimeErrors, []);
});

test('Backspin real-world register stays separate, sourced and keyboard accessible', { timeout:60_000 }, async () => {
  const { page, root, runtimeErrors } = await openFreshBackspinPage({ width:375, height:812 });
  await completeMissionAndEnterInfluence(page, root);

  const clean = root.locator('[data-lie="clean"]');
  const wet = root.locator('[data-lie="wet"]');
  const flyer = root.locator('[data-lie="flyer"]');
  const register = root.locator('#realWorldRegister');
  const band = root.locator('#realWorldBand[data-real-world-band]');
  const truthBefore = (await root.locator('#backspinTruth').textContent()).trim();
  const inputBefore = await root.locator('#labRange').inputValue();
  const hapticsBeforeWet = await hapticCount(page, 'selectionChanged');

  assert.equal(await clean.getAttribute('aria-checked'), 'true');
  assert.equal(await clean.getAttribute('tabindex'), '0');
  assert.equal(await register.isHidden(), true);
  assert.equal(await band.isHidden(), true);
  assert.equal(await band.getAttribute('data-layer'), 'real-world-estimate');

  await clean.focus();
  await clean.press('ArrowRight');
  assert.equal(await wet.getAttribute('aria-checked'), 'true');
  assert.equal(await wet.getAttribute('tabindex'), '0');
  assert.equal(await clean.getAttribute('aria-checked'), 'false');
  assert.equal(await wet.evaluate(element => document.activeElement === element), true);
  assert.equal(await hapticCount(page, 'selectionChanged'), hapticsBeforeWet + 1);
  await wet.click();
  assert.equal(await hapticCount(page, 'selectionChanged'), hapticsBeforeWet + 1,
    'Selecting the active lie again must not duplicate haptics');

  assert.equal(await register.isVisible(), true);
  const wetRegister = (await register.textContent()).replace(/\s+/g, ' ').trim();
  assert.match(wetRegister, /\u2248 4,838\u20135,141 rpm/);
  assert.equal(await band.getAttribute('data-low'), '4838');
  assert.equal(await band.getAttribute('data-high'), '5141');
  assert.match(wetRegister, /Wet face \/ ball/);
  assert.match(wetRegister, /Real-world estimate/);
  assert.match(wetRegister, /Andrew Rice, 2013/);
  assert.match(wetRegister, /not the simulator/i);
  assert.equal((await root.locator('#backspinTruth').textContent()).trim(), truthBefore);
  assert.equal(await root.locator('#labRange').inputValue(), inputBefore);

  assert.equal(await band.isVisible(), true);
  assert.equal(await band.getAttribute('data-layer'), 'real-world-estimate');
  assert.equal(await band.getAttribute('aria-hidden'), 'true');
  const registerLabel = await register.getAttribute('aria-label');
  assert.match(registerLabel, /Approximate real-world estimate/i);
  assert.match(registerLabel, /Andrew Rice, 2013/);
  assert.match(registerLabel, /not the simulator/i);
  const bandStyle = await register.evaluate(element => {
    const style = getComputedStyle(element);
    const probe = document.createElement('span');
    probe.style.color = 'var(--secondary-line)';
    element.append(probe);
    const semanticColor = getComputedStyle(probe).color;
    probe.remove();
    return { borderStyle:style.borderTopStyle, borderColor:style.borderTopColor, semanticColor };
  });
  assert.equal(bandStyle.borderStyle, 'dashed');
  assert.equal(bandStyle.borderColor, bandStyle.semanticColor);
  await root.locator('[data-step="lab"]').click();
  await assertEventuallyRootSurface(page, root, '1');
  const echo = root.locator('#realWorldEcho[data-real-world-echo]');
  assert.equal(await echo.isVisible(), true);
  const echoBefore = (await echo.textContent()).replace(/\s+/g, ' ').trim();
  assert.match(echoBefore, /\u2248 4,838\u20135,141 rpm/);
  assert.match(echoBefore, /Andrew Rice, 2013.*not the simulator/i);
  assert.equal((await root.locator('#backspinTruth').textContent()).trim(), truthBefore);
  await setBackspinParameter(page, root, 'dynamicLoft', 26);
  await page.waitForFunction(() => document.querySelector('#backspinTruth')?.textContent.replaceAll(',', '').trim() === '6264');
  assert.match((await echo.textContent()).replace(/\s+/g, ' ').trim(), /\u2248 5,011\u20135,324 rpm/);
  await setBackspinParameter(page, root, 'dynamicLoft', 25);
  await page.waitForFunction(() => document.querySelector('#backspinTruth')?.textContent.replaceAll(',', '').trim() === '6048');
  await selectBackspinParameter(root, 'ballSpeed');
  assert.equal(await root.locator('#labRange').inputValue(), inputBefore);
  await root.locator('[data-step="influence"]').click();
  await assertEventuallyRootSurface(page, root, '2');

  await register.click();
  const sheet = root.locator('#lessonSheet');
  await sheet.waitFor({ state:'visible' });
  assert.equal(await sheet.getAttribute('aria-modal'), 'true');
  await page.waitForFunction(() => document.activeElement?.id === 'lessonSheet');
  assert.equal(await sheet.evaluate(element => element.scrollTop), 0);
  assert.equal((await sheet.locator('#lessonSheetTitle').textContent()).trim(), 'Wet face / ball');
  const sheetCopy = (await sheet.locator('[data-sheet-body]').textContent()).replace(/\s+/g, ' ').trim();
  assert.match(sheetCopy, /\u2248 4,838\u20135,141 rpm/);
  assert.match(sheetCopy, /Andrew Rice, "Wedges and Water", 2013/);
  assert.match(sheetCopy, /corroborated by MyGolfSpy Wet Wedge Test, 2022/);
  assert.match(sheetCopy, /not the simulator/i);
  const [sheetBox, titleBox] = await Promise.all([sheet.boundingBox(), sheet.locator('#lessonSheetTitle').boundingBox()]);
  assert.ok(sheetBox && titleBox);
  assert.ok(titleBox.y >= sheetBox.y && titleBox.y + titleBox.height <= sheetBox.y + sheetBox.height);
  await page.waitForFunction(() => {
    const image = document.querySelector('#lessonSheet [data-real-world-image]');
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
  });
  const sourceImage = await sheet.locator('[data-real-world-image]').evaluate(image => ({
    naturalWidth:image.naturalWidth,
    pathname:new URL(image.currentSrc || image.src).pathname
  }));
  assert.ok(sourceImage.naturalWidth > 0);
  assert.equal(sourceImage.pathname, '/assets/rw-backspin-green-bite.jpg');

  const sheetFocusable = sheet.locator(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
    'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  const focusableCount = await sheetFocusable.count();
  assert.ok(focusableCount >= 1);
  const firstFocusable = sheetFocusable.first();
  const lastFocusable = sheetFocusable.nth(focusableCount - 1);
  await page.keyboard.press('Tab');
  assert.equal(await firstFocusable.evaluate(element => document.activeElement === element), true);
  await sheet.focus();
  await page.keyboard.press('Shift+Tab');
  assert.equal(await lastFocusable.evaluate(element => document.activeElement === element), true);
  await lastFocusable.focus();
  await page.keyboard.press('Tab');
  assert.equal(await firstFocusable.evaluate(element => document.activeElement === element), true);
  await firstFocusable.focus();
  await page.keyboard.press('Shift+Tab');
  assert.equal(await lastFocusable.evaluate(element => document.activeElement === element), true);

  await page.keyboard.press('Escape');
  await sheet.waitFor({ state:'hidden' });
  assert.equal(await register.evaluate(element => document.activeElement === element), true,
    'Escape must return focus to the segment that opened the source sheet');

  const hapticsBeforeFlyer = await hapticCount(page, 'selectionChanged');
  await wet.press('ArrowRight');
  assert.equal(await flyer.getAttribute('aria-checked'), 'true');
  assert.equal(await flyer.getAttribute('tabindex'), '0');
  assert.equal(await flyer.evaluate(element => document.activeElement === element), true);
  assert.equal(await hapticCount(page, 'selectionChanged'), hapticsBeforeFlyer + 1);
  const flyerRegister = (await register.textContent()).replace(/\s+/g, ' ').trim();
  assert.match(flyerRegister, /\u2248 2,117\u20134,234 rpm/);
  assert.equal(await band.getAttribute('data-low'), '2117');
  assert.equal(await band.getAttribute('data-high'), '4234');
  assert.match(flyerRegister, /Flyer lie/);
  assert.match(flyerRegister, /Real-world estimate/);
  assert.match(flyerRegister, /USGA \/ Pate, 2020/);
  assert.match(flyerRegister, /not the simulator/i);
  assert.equal((await root.locator('#backspinTruth').textContent()).trim(), truthBefore);
  assert.equal(await root.locator('#labRange').inputValue(), inputBefore);

  const hapticsBeforeClean = await hapticCount(page, 'selectionChanged');
  await flyer.press('Home');
  assert.equal(await clean.getAttribute('aria-checked'), 'true');
  assert.equal(await clean.getAttribute('tabindex'), '0');
  assert.equal(await clean.evaluate(element => document.activeElement === element), true);
  assert.equal(await hapticCount(page, 'selectionChanged'), hapticsBeforeClean + 1);
  assert.equal(await register.isHidden(), true);
  assert.equal(await band.isHidden(), true);
  assert.equal((await root.locator('#backspinTruth').textContent()).trim(), truthBefore);
  assert.equal(await root.locator('#labRange').inputValue(), inputBefore);

  await root.locator('[data-step="lab"]').click();
  await assertEventuallyRootSurface(page, root, '1');
  assert.equal(await echo.isHidden(), true);


  await page.waitForTimeout(150);
  assert.deepEqual(runtimeErrors, []);
});


test('Backspin source sheet degrades cleanly when its optional image cannot decode', { timeout:60_000 }, async () => {
  const { page, root, runtimeErrors } = await openFreshBackspinPage(
    { width:375, height:812 },
    {
      beforeGoto: page => page.route('**/assets/rw-backspin-green-bite.jpg', route => route.fulfill({
        status:200,
        contentType:'image/jpeg',
        body:'not-an-image'
      }))
    }
  );
  await completeMissionAndEnterInfluence(page, root);
  await root.locator('[data-lie="wet"]').click();
  await root.locator('#realWorldRegister').click();

  const sheet = root.locator('#lessonSheet');
  await sheet.waitFor({ state:'visible' });
  await page.waitForFunction(() => !document.querySelector('#lessonSheet [data-real-world-media]'));
  assert.equal(await sheet.locator('[data-real-world-media]').count(), 0);
  assert.equal(await sheet.locator('[data-real-world-image]').count(), 0);
  assert.equal(await sheet.locator('figcaption').count(), 0);
  assert.equal((await sheet.locator('#lessonSheetTitle').textContent()).trim(), 'Wet face / ball');
  const sheetCopy = (await sheet.locator('[data-sheet-body]').textContent()).replace(/\s+/g, ' ').trim();
  assert.match(sheetCopy, /\u2248 4,838\u20135,141 rpm/);
  assert.match(sheetCopy, /Andrew Rice, "Wedges and Water", 2013/);
  assert.match(sheetCopy, /not the simulator/i);
  assert.equal(await sheet.locator('[data-sheet-close]').isVisible(), true);

  await page.keyboard.press('Escape');
  await sheet.waitFor({ state:'hidden' });
  await page.waitForTimeout(100);
  assert.deepEqual(runtimeErrors, []);
});


test('Backspin myth predictions reveal exact engine runs and varied supported answers', { timeout:90_000 }, async () => {
  const { page, root, runtimeErrors } = await openFreshBackspinPage({ width:375, height:812 });
  await completeMissionAndEnterMyths(page, root);

  const answerPositions = EXPECTED_MYTH_EXPERIMENTS.map(experiment => experiment.answerIndex);
  assert.deepEqual(answerPositions, [1, 1, 2]);
  assert.ok(new Set(answerPositions).size > 1,
    'The supported response must not occupy one detectable position in every experiment');

  const completed = [false, false, false];
  for (let index = 0; index < EXPECTED_MYTH_EXPERIMENTS.length; index += 1) {
    const expected = EXPECTED_MYTH_EXPERIMENTS[index];
    const experiment = await assertMythExperiment(root, { index, ...expected });
    assert.equal(await experiment.locator('[data-myth-evidence]').isHidden(), true);
    await assertMythNavigationGate(root, true);

    await assertMasteryStepGate(root, true);
    await experiment.locator(`[data-myth-choice="${expected.answerIndex}"]`).click();
    completed[index] = true;
    await waitForBackspinJourney(page, { surface:3, myths:[...completed] });
    await assertMythExperiment(root, { index, ...expected, answered:true, correct:true });
    assert.equal(await experiment.locator('[data-myth-evidence]').isVisible(), true);
    assert.equal(await experiment.locator('[data-myth-verdict]').isVisible(), true);
    assert.equal(await experiment.locator('[data-myth-verdict]').getAttribute('data-correct'), 'true');
    assert.equal(await experiment.locator('[data-myth-explanation]').isVisible(), true);
    await assertMythNavigationGate(root, false);

    const before = await mythRunContract(experiment, 'before');
    await assertMasteryStepGate(root, index < EXPECTED_MYTH_EXPERIMENTS.length - 1);
    const after = await mythRunContract(experiment, 'after');
    assert.equal(await experiment.locator('[data-myth-run="before"] li').count(), 3);
    assert.equal(await experiment.locator('[data-myth-run="after"] li').count(), 3);

    if (index === 0) {
      assert.deepEqual(
        { rpm:before.rpm, spinLoft:before.spinLoft },
        { rpm:7128, spinLoft:33 }
      );
      assert.deepEqual(
        { rpm:after.rpm, spinLoft:after.spinLoft },
        { rpm:7776, spinLoft:36 }
      );
      assert.match(await experiment.locator('[data-myth-explanation]').textContent(),
        /ground adds no spin.*spin is created while the ball is on the face/i);
    } else if (index === 1) {
      assert.deepEqual(
        { rpm:before.rpm, rawRpm:before.rawRpm, spinLoft:before.spinLoft },
        { rpm:7128, rawRpm:7128, spinLoft:33 }
      );
      assert.deepEqual(
        { rpm:after.rpm, rawRpm:after.rawRpm, spinLoft:after.spinLoft },
        { rpm:7128, rawRpm:7128, spinLoft:33 }
      );
      assert.match(await experiment.locator('[data-myth-explanation]').textContent(),
        /Spin loft remains 33\u00B0.*same backspin/i);
    } else {
      assert.deepEqual(
        {
          rpm:before.rpm,
          rawRpm:before.rawRpm,
          carry:before.carry,
          apex:before.apex,
          landing:before.landing,
          displayLimit:before.displayLimit
        },
        { rpm:7128, rawRpm:7128, carry:158, apex:30, landing:54.4, displayLimit:'none' }
      );
      assert.deepEqual(
        {
          rpm:after.rpm,
          rawRpm:after.rawRpm,
          carry:after.carry,
          apex:after.apex,
          landing:after.landing,
          displayLimit:after.displayLimit
        },
        { rpm:9000, rawRpm:10368, carry:158, apex:40, landing:60, displayLimit:'ceiling' }
      );
      const cappedBackspin = experiment.locator(
        '[data-myth-run="after"] [data-myth-metric="backspin"]'
      );
      assert.equal(await cappedBackspin.getAttribute('data-rpm'), '9000');
      assert.equal(await cappedBackspin.getAttribute('data-raw-rpm'), '10368');
      assert.equal(await cappedBackspin.getAttribute('data-display-limit'), 'ceiling');
      assert.match(await cappedBackspin.textContent(), /9,000 rpm/i);
      assert.match(await cappedBackspin.textContent(), /Raw 10,368 rpm/i);
      assert.match(await cappedBackspin.textContent(), /display ceiling/i);
      assert.match(await experiment.locator('[data-myth-explanation]').textContent(),
        /holds carry steady.*Real excess-spin shots can balloon.*not modeled here/i);
    }

    const localNext = root.locator('[data-myth-next]');
    if (index < EXPECTED_MYTH_EXPERIMENTS.length - 1) {
      assert.match((await localNext.textContent()).trim(), /Next Experiment/i);
      await localNext.click();
      await page.waitForFunction(
        next => document.querySelector('#mythExperiment')?.dataset.experimentIndex === String(next),
        index + 1
      );
    } else {
      assert.match((await localNext.textContent()).trim(), /Start Mastery Check/i);
    }
  }

  assert.equal(await root.locator('[data-step="mastery"]').getAttribute('aria-disabled'), 'false');
  await root.locator('[data-myth-next]').click();
  await assertEventuallyRootSurface(page, root, '4');
  await page.waitForTimeout(100);
  assert.deepEqual(runtimeErrors, []);
});

test('wrong myth predictions still complete, persist, reload and remain inspectable', { timeout:90_000 }, async () => {
  const { page, root, runtimeErrors } = await openFreshBackspinPage({ width:375, height:812 });
  await completeMissionAndEnterMyths(page, root);

  let experiment = await assertMythExperiment(root, {
    index:0,
    ...EXPECTED_MYTH_EXPERIMENTS[0]
  });
  await experiment.locator('[data-myth-choice="0"]').click();
  await waitForBackspinJourney(page, { surface:3, myths:[true, false, false] });
  await assertMythExperiment(root, {
    index:0,
    ...EXPECTED_MYTH_EXPERIMENTS[0],
    answered:true,
    correct:false
  });
  assert.equal(await experiment.locator('[data-myth-evidence]').isVisible(), true);
  assert.match(await experiment.locator('[data-myth-verdict]').textContent(), /Not quite/i);
  assert.equal(await experiment.locator('[data-myth-verdict]').getAttribute('data-correct'), 'false');
  assert.deepEqual(
    { rpm:(await mythRunContract(experiment, 'before')).rpm, rpmAfter:(await mythRunContract(experiment, 'after')).rpm },
    { rpm:7128, rpmAfter:7776 }
  );

  await root.locator('[data-myth-next]').click();
  await page.waitForFunction(() => document.querySelector('#mythExperiment')?.dataset.experimentIndex === '1');
  await page.reload({ waitUntil:'networkidle' });
  await root.waitFor({ timeout:5_000 });
  await assertEventuallyRootSurface(page, root, '3');
  await assertMythExperiment(root, {
    index:1,
    ...EXPECTED_MYTH_EXPERIMENTS[1]
  });

  const globalBack = root.locator('.native-lesson__navigation [data-action="previous"]');
  const globalNext = root.locator('.native-lesson__navigation [data-action="next"]');
  await globalBack.click();
  experiment = root.locator('#mythExperiment');
  await page.waitForFunction(() => document.querySelector('#mythExperiment')?.dataset.experimentIndex === '0');
  assert.equal(await experiment.getAttribute('data-answered'), 'true');
  assert.equal(await experiment.locator('[data-myth-evidence]').isVisible(), true);
  assert.equal(await experiment.locator('[data-myth-verdict]').getAttribute('data-correct'), 'unknown');

  await globalNext.click();
  await page.waitForFunction(() => document.querySelector('#mythExperiment')?.dataset.experimentIndex === '1');
  experiment = root.locator('#mythExperiment');
  await experiment.locator('[data-myth-choice="0"]').click();
  await waitForBackspinJourney(page, { surface:3, myths:[true, true, false] });
  assert.equal(await experiment.getAttribute('data-correct'), 'false');
  assert.equal(await experiment.locator('[data-myth-evidence]').isVisible(), true);

  await root.locator('[data-myth-next]').click();
  await page.waitForFunction(() => document.querySelector('#mythExperiment')?.dataset.experimentIndex === '2');
  experiment = root.locator('#mythExperiment');
  await experiment.locator('[data-myth-choice="0"]').click();
  await waitForBackspinJourney(page, { surface:3, myths:[true, true, true] });
  assert.equal(await experiment.getAttribute('data-correct'), 'false');
  assert.equal(await experiment.locator('[data-myth-evidence]').isVisible(), true);
  assert.equal(await root.locator('[data-step="mastery"]').getAttribute('aria-disabled'), 'false');

  await page.reload({ waitUntil:'networkidle' });
  await root.waitFor({ timeout:5_000 });
  await assertEventuallyRootSurface(page, root, '3');
  experiment = root.locator('#mythExperiment');
  assert.equal(await experiment.getAttribute('data-experiment-index'), '2');
  assert.equal(await experiment.getAttribute('data-answered'), 'true');
  assert.equal(await experiment.locator('[data-myth-evidence]').isVisible(), true);
  assert.match((await root.locator('[data-myth-next]').textContent()).trim(), /Start Mastery Check/i);
  await assertMythNavigationGate(root, false);

  await globalBack.click();
  await page.waitForFunction(() => document.querySelector('#mythExperiment')?.dataset.experimentIndex === '1');
  assert.equal(await experiment.getAttribute('data-answered'), 'true');
  assert.equal(await experiment.locator('[data-myth-evidence]').isVisible(), true);
  await globalBack.click();
  await page.waitForFunction(() => document.querySelector('#mythExperiment')?.dataset.experimentIndex === '0');
  assert.equal(await experiment.getAttribute('data-answered'), 'true');
  assert.equal(await experiment.locator('[data-myth-evidence]').isVisible(), true);

  await globalNext.click();
  await page.waitForFunction(() => document.querySelector('#mythExperiment')?.dataset.experimentIndex === '1');
  await globalNext.click();
  await page.waitForFunction(() => document.querySelector('#mythExperiment')?.dataset.experimentIndex === '2');
  await globalNext.click();
  await assertEventuallyRootSurface(page, root, '4');
  await waitForBackspinJourney(page, { surface:4, myths:[true, true, true] });
  await page.waitForTimeout(100);
  assert.deepEqual(runtimeErrors, []);
});

test('myth prediction radios support keyboard roving, one haptic and 375px target fit', { timeout:90_000 }, async () => {
  const viewport = { width:375, height:812 };
  const { page, root, runtimeErrors } = await openFreshBackspinPage(viewport);
  await completeMissionAndEnterMyths(page, root);

  const surface = root.locator('.native-lesson__surface[data-surface="3"]');
  const navigation = root.locator('.native-lesson__navigation');
  const completed = [false, false, false];

  for (let index = 0; index < EXPECTED_MYTH_EXPERIMENTS.length; index += 1) {
    const expected = EXPECTED_MYTH_EXPERIMENTS[index];
    const experiment = await assertMythExperiment(root, { index, ...expected });
    const group = experiment.getByRole('radiogroup', { name:'Prediction choices' });
    assert.equal(await group.count(), 1);
    const choices = group.locator('[data-myth-choice]');
    assert.equal(await choices.count(), expected.choices.length);
    assert.deepEqual(
      await choices.evaluateAll(buttons => buttons.map(button => button.getAttribute('tabindex'))),
      ['0', ...Array(expected.choices.length - 1).fill('-1')]
    );
    assert.deepEqual(
      await choices.evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-checked'))),
      Array(expected.choices.length).fill('false')
    );
    for (let choiceIndex = 0; choiceIndex < expected.choices.length; choiceIndex += 1) {
      await assertMinimumTarget(choices.nth(choiceIndex), `Experiment ${index + 1} choice ${choiceIndex + 1}`);
    }

    if (index === 0) {
      await choices.first().focus();
      await choices.first().press('ArrowRight');
      assert.equal(await choices.nth(1).evaluate(element => document.activeElement === element), true);
      assert.deepEqual(
        await choices.evaluateAll(buttons => buttons.map(button => button.getAttribute('tabindex'))),
        ['-1', '0']
      );
      assert.equal(await experiment.getAttribute('data-answered'), 'false');
    }

    const hapticsBefore = await hapticCount(page, 'impact:light');
    const supported = choices.nth(expected.answerIndex);
    await supported.focus();
    await supported.press('Space');
    completed[index] = true;
    await waitForBackspinJourney(page, { surface:3, myths:[...completed] });
    await page.waitForFunction(
      choiceIndex => document.activeElement?.getAttribute('data-myth-choice') === String(choiceIndex),
      expected.answerIndex
    );
    assert.equal(await supported.getAttribute('tabindex'), '0');
    const focusState = await supported.evaluate(element => ({
      active:document.activeElement === element,
      focusVisible:element.matches(':focus-visible'),
      boxShadow:getComputedStyle(element).boxShadow
    }));
    assert.equal(focusState.active, true);
    assert.equal(focusState.focusVisible, true);
    assert.notEqual(focusState.boxShadow, 'none');
    assert.equal(await hapticCount(page, 'impact:light'), hapticsBefore + 1);
    await supported.evaluate(button => button.click());
    assert.equal(await hapticCount(page, 'impact:light'), hapticsBefore + 1,
      'An answered prediction must not emit a second impact:light haptic');
    assert.equal(await experiment.getAttribute('data-answered'), 'true');
    assert.equal(await experiment.getAttribute('data-correct'), 'true');
    assert.equal(await supported.getAttribute('aria-checked'), 'true');

    const evidence = experiment.locator('[data-myth-evidence]');
    assert.equal(await evidence.isVisible(), true);
    await assertAboveNavigation(experiment, navigation, `Experiment ${index + 1}`);
    await assertTypeFloor(experiment, 10, `Experiment ${index + 1}`);
    await assertMinimumTarget(root.locator('[data-myth-next]'), `Experiment ${index + 1} next action`);
    const cardDimensions = await experiment.evaluate(element => ({
      scrollHeight:element.scrollHeight,
      clientHeight:element.clientHeight,
      scrollWidth:element.scrollWidth,
      clientWidth:element.clientWidth
    }));
    assert.ok(cardDimensions.scrollHeight <= cardDimensions.clientHeight + 1,
      `Experiment ${index + 1} card must not require internal vertical scrolling: ${JSON.stringify(cardDimensions)}`);
    assert.ok(cardDimensions.scrollWidth <= cardDimensions.clientWidth + 1,
      `Experiment ${index + 1} card must not require internal horizontal scrolling: ${JSON.stringify(cardDimensions)}`);
    const dimensions = await surface.evaluate(element => ({
      scrollHeight:element.scrollHeight,
      clientHeight:element.clientHeight,
      scrollWidth:element.scrollWidth,
      clientWidth:element.clientWidth
    }));
    assert.ok(dimensions.scrollHeight <= dimensions.clientHeight + 1,
      `Experiment ${index + 1} must fit 375x812 without hidden vertical overflow: ${JSON.stringify(dimensions)}`);
    assert.ok(dimensions.scrollWidth <= dimensions.clientWidth + 1,
      `Experiment ${index + 1} must fit without horizontal user-scroll: ${JSON.stringify(dimensions)}`);
    const documentWidth = await page.evaluate(() => ({ width:innerWidth, scrollWidth:document.documentElement.scrollWidth }));
    assert.ok(documentWidth.scrollWidth <= documentWidth.width + 1,
      `Myth surface must not widen the document: ${JSON.stringify(documentWidth)}`);

    if (index < EXPECTED_MYTH_EXPERIMENTS.length - 1) {
      await root.locator('[data-myth-next]').click();
      await page.waitForFunction(
        next => document.querySelector('#mythExperiment')?.dataset.experimentIndex === String(next),
        index + 1
      );
    }
  }

  await page.waitForTimeout(100);
  assert.deepEqual(runtimeErrors, []);
});

test('myth evidence also fits the 430x932 reference viewport', { timeout:90_000 }, async () => {
  const viewport = { width:430, height:932 };
  const { page, root, runtimeErrors } = await openFreshBackspinPage(viewport);
  await completeMissionAndEnterMyths(page, root);
  const surface = root.locator('.native-lesson__surface[data-surface="3"]');
  const navigation = root.locator('.native-lesson__navigation');
  const completed = [false, false, false];

  for (let index = 0; index < EXPECTED_MYTH_EXPERIMENTS.length; index += 1) {
    const expected = EXPECTED_MYTH_EXPERIMENTS[index];
    const experiment = await assertMythExperiment(root, { index, ...expected });
    const choices = experiment.locator('[data-myth-choice]');
    for (let choiceIndex = 0; choiceIndex < expected.choices.length; choiceIndex += 1) {
      await assertMinimumTarget(choices.nth(choiceIndex), `430px experiment ${index + 1} choice ${choiceIndex + 1}`);
    }
    await choices.nth(expected.answerIndex).click();
    completed[index] = true;
    await waitForBackspinJourney(page, { surface:3, myths:[...completed] });
    assert.equal(await experiment.locator('[data-myth-evidence]').isVisible(), true);
    await assertAboveNavigation(experiment, navigation, `430px experiment ${index + 1}`);
    await assertTypeFloor(experiment, 10, `430px experiment ${index + 1}`);
    await assertMinimumTarget(root.locator('[data-myth-next]'), `430px experiment ${index + 1} next action`);
    const card = await experiment.evaluate(element => ({
      scrollHeight:element.scrollHeight, clientHeight:element.clientHeight,
      scrollWidth:element.scrollWidth, clientWidth:element.clientWidth
    }));
    assert.ok(card.scrollHeight <= card.clientHeight + 1,
      `430px experiment ${index + 1} must not require internal vertical scrolling: ${JSON.stringify(card)}`);
    assert.ok(card.scrollWidth <= card.clientWidth + 1,
      `430px experiment ${index + 1} must not require internal horizontal scrolling: ${JSON.stringify(card)}`);
    const surfaceDimensions = await surface.evaluate(element => ({
      scrollHeight:element.scrollHeight, clientHeight:element.clientHeight,
      scrollWidth:element.scrollWidth, clientWidth:element.clientWidth
    }));
    assert.ok(surfaceDimensions.scrollHeight <= surfaceDimensions.clientHeight + 1);
    assert.ok(surfaceDimensions.scrollWidth <= surfaceDimensions.clientWidth + 1);

    if (index === 0) {
      const [verdictFont, headingFont] = await Promise.all([
        experiment.locator('[data-myth-verdict]').evaluate(element => getComputedStyle(element).fontFamily),
        experiment.locator('h3').evaluate(element => getComputedStyle(element).fontFamily)
      ]);
      assert.equal(verdictFont, headingFont, 'The verdict stamp must use the display voice');
    }
    if (index < EXPECTED_MYTH_EXPERIMENTS.length - 1) {
      await root.locator('[data-myth-next]').click();
      await page.waitForFunction(
        next => document.querySelector('#mythExperiment')?.dataset.experimentIndex === String(next),
        index + 1
      );
    }
  }

  const documentWidth = await page.evaluate(() => ({ width:innerWidth, scrollWidth:document.documentElement.scrollWidth }));
  assert.ok(documentWidth.scrollWidth <= documentWidth.width + 1);
  await page.waitForTimeout(100);
  assert.deepEqual(runtimeErrors, []);
});

test('Backspin Mastery keeps one stable attempt, submits atomically and upgrades 3/5 to 4/5 once', { timeout:240_000 }, async () => {
  const viewport = { width:430, height:932 };
  const { page, root, runtimeErrors } = await openFreshBackspinPage(viewport);
  const firstAttemptId = await completeMythsAndEnterMastery(page, root);
  assert.ok(firstAttemptId);

  let stored = await storedAcademy(page);
  assert.equal(stored.lessons.backspin.journey.masteryAttemptId, firstAttemptId);
  assert.equal(stored.lessons.backspin.journey.lastSubmission, null);

  await root.locator('.native-lesson__navigation [data-action="previous"]').click();
  await assertEventuallyRootSurface(page, root, '3');
  stored = await storedAcademy(page);
  assert.equal(stored.lessons.backspin.journey.masteryAttemptId, firstAttemptId,
    'Backward navigation must retain the active mastery attempt');
  await root.locator('[data-myth-next]').click();
  await assertEventuallyRootSurface(page, root, '4');
  assert.equal(await root.locator('#masteryTask').getAttribute('data-attempt'), firstAttemptId);

  await page.reload({ waitUntil:'networkidle' });
  await root.waitFor({ timeout:5_000 });
  await assertEventuallyRootSurface(page, root, '4');
  assert.equal(await root.locator('#masteryTask').getAttribute('data-attempt'), firstAttemptId,
    'Reloading S4 must restore the same active attempt');
  stored = await storedAcademy(page);
  assert.equal(stored.lessons.backspin.journey.masteryAttemptId, firstAttemptId);
  assert.equal(stored.lessons.backspin.journey.lastSubmission, null);

  const initialTask = await assertMasteryTask(page, root, 0);
  await assertMasteryViewport(page, root, viewport, 4, initialTask, '430px Mastery task 1');

  const firstRun = await finishMasteryAttempt(page, root, {
    answers:[0, 1, 0, 0],
    targetFixtures:[
      MASTERY_TARGET_FIXTURES.highSpin,
      MASTERY_TARGET_FIXTURES.shallowLanding
    ],
    keyboardTask:1,
    trackAtomic:true,
    inspectTarget:async ({ index, fixture, feedback, task }) => {
      assert.equal(await task.locator('[data-mastery-rpm]').getAttribute('data-value'), String(fixture.rpm));
      assert.equal(await task.locator('[data-mastery-landing]').getAttribute('data-value'), String(fixture.landing));
      const copy = (await feedback.textContent()).replace(/\s+/g, ' ').trim();
      if (index === 0) {
        assert.match(copy, /8,208 rpm/);
        assert.match(copy, /60(?:\.0)?\u00b0/);
        assert.match(copy, /6,800.*7,400|lower.*spin/i,
          'High-spin failure must name the unmet rpm condition without a slider recipe');
      } else {
        assert.match(copy, /7,038 rpm/);
        assert.match(copy, /33\.3\u00b0/);
        assert.match(copy, /50\u00b0|landing/i,
          'Shallow-landing failure must name the unmet landing condition');
      }
      assert.doesNotMatch(copy, /set dynamic loft|set attack angle|recipe/i);
    }
  });
  assert.equal(firstRun.attemptId, firstAttemptId);

  assert.ok(firstRun.atomic.writes.length >= 1);
  assert.ok(firstRun.atomic.writes.every(write => write.surface !== 5 || write.hasSubmission),
    `No persisted bare S5 is allowed: ${JSON.stringify(firstRun.atomic.writes)}`);
  assert.ok(firstRun.atomic.surfaces.length >= 1);
  assert.ok(firstRun.atomic.surfaces.every(snapshot => snapshot.hasSubmission),
    `S5 must never render before its summary is persisted: ${JSON.stringify(firstRun.atomic.surfaces)}`);

  const firstNavigationHaptics = firstRun.hapticsAfter.slice(firstRun.hapticsBefore.length);
  assert.ok(firstNavigationHaptics.filter(kind => kind === 'notify:success').length <= 1,
    `Mastery commit may emit at most one success notification: ${firstNavigationHaptics}`);
  assert.ok(firstNavigationHaptics.every(kind => kind === 'notify:success'),
    `S4 to S5 navigation must add no decorative haptic: ${firstNavigationHaptics}`);

  stored = firstRun.store;
  const lesson = stored.lessons.backspin;
  const journey = lesson.journey;
  const firstSummary = journey.lastSubmission.summary;
  assert.equal(stored.xp, 100);
  assert.equal(lesson.read, true);
  assert.equal(lesson.quizAttempts, 1);
  assert.equal(lesson.quizBest, 60);
  assert.equal(lesson.quizBestCorrect, 3);
  assert.equal(lesson.completed, true);
  assert.equal(lesson.mastered, false);
  assert.equal(lesson.perfect, false);
  assert.equal(journey.surface, 5);
  assert.equal(journey.masteryBest, 3);
  assert.equal(journey.masteryAttempts, 1);
  assert.equal(journey.masteryAttemptId, firstAttemptId);
  assert.equal(journey.lastSubmission.attemptId, firstAttemptId);
  assert.equal(firstSummary.correct, 3);
  assert.equal(firstSummary.threshold, 4);
  assert.equal(firstSummary.mastered, false);
  assert.equal(firstSummary.delta, 60);
  assert.equal(firstSummary.readDelta, 40);
  assert.equal(firstSummary.totalDelta, 100);
  assert.equal(firstSummary.storeXp, 100);
  assert.equal(firstSummary.leveledUp, false);
  assert.deepEqual(firstSummary.taskResults, expectedTaskResults([0, 1, 2]));
  assert.deepEqual(stored.badges, ['first-light', 'spin-doctor']);

  const firstResult = await assertNativeResult(root, {
    attemptId:firstAttemptId,
    mastered:false,
    correct:3,
    xp:100,
    abilities:EXPECTED_MASTERY_ABILITIES.slice(0, 3)
  });
  await assertMasteryViewport(page, root, viewport, 5, firstResult, '430px 3-of-5 Result');

  const rawBeforeReload = await page.evaluate(key => localStorage.getItem(key), STORE_KEY);
  const beforeReloadState = JSON.parse(rawBeforeReload);
  await page.reload({ waitUntil:'networkidle' });
  await root.waitFor({ timeout:5_000 });
  await assertEventuallyRootSurface(page, root, '5');
  await page.waitForTimeout(300);
  const rawAfterReload = await page.evaluate(key => localStorage.getItem(key), STORE_KEY);
  assert.equal(rawAfterReload, rawBeforeReload,
    'Reloading Result must be byte-identical and must not resubmit');
  const afterReloadState = JSON.parse(rawAfterReload);
  assert.equal(afterReloadState.xp, beforeReloadState.xp);
  assert.equal(afterReloadState.lessons.backspin.quizAttempts,
    beforeReloadState.lessons.backspin.quizAttempts);
  assert.deepEqual(afterReloadState.badges, beforeReloadState.badges);
  assert.deepEqual(afterReloadState.unlocked, beforeReloadState.unlocked);
  assert.deepEqual(afterReloadState.lessons.backspin.journey.lastSubmission,
    beforeReloadState.lessons.backspin.journey.lastSubmission);
  await assertNativeResult(root, {
    attemptId:firstAttemptId,
    mastered:false,
    correct:3,
    xp:100,
    abilities:EXPECTED_MASTERY_ABILITIES.slice(0, 3)
  });

  await root.locator('.native-lesson__navigation [data-action="previous"]').click();
  await assertEventuallyRootSurface(page, root, '4');
  const submittedTask = root.locator('#masteryTask');
  assert.equal(await submittedTask.getAttribute('data-submitted'), 'true');
  assert.equal(await submittedTask.getAttribute('data-attempt'), firstAttemptId);
  assert.equal(await submittedTask.locator('[data-mastery-submitted]').isVisible(), true);
  assert.equal(await submittedTask.locator(
    '[data-mastery-choice], [data-mastery-param], [data-mastery-range], [data-mastery-target-submit]'
  ).count(), 0, 'A submitted S4 must expose no mutable controls');
  const beforeViewResult = await hapticLog(page);
  const submittedSummary = JSON.stringify((await storedAcademy(page))
    .lessons.backspin.journey.lastSubmission.summary);
  await submittedTask.locator('[data-action="view-result"]').click();
  await assertEventuallyRootSurface(page, root, '5');
  assert.deepEqual(await hapticLog(page), beforeViewResult,
    'Viewing an already-submitted Result is navigation and must not emit a haptic');
  let afterView = await storedAcademy(page);
  assert.equal(afterView.xp, 100);
  assert.equal(afterView.lessons.backspin.quizAttempts, 1);
  assert.equal(JSON.stringify(afterView.lessons.backspin.journey.lastSubmission.summary), submittedSummary);

  await root.locator('[data-action="retry-mastery"]').click();
  await assertEventuallyRootSurface(page, root, '4');
  await page.waitForFunction(({ key, previous }) => {
    const journey = JSON.parse(localStorage.getItem(key))?.lessons?.backspin?.journey;
    return journey?.surface === 4
      && typeof journey.masteryAttemptId === 'string'
      && journey.masteryAttemptId !== previous
      && journey.lastSubmission === null;
  }, { key:STORE_KEY, previous:firstAttemptId });
  const retryAttemptId = await root.locator('#masteryTask').getAttribute('data-attempt');
  assert.notEqual(retryAttemptId, firstAttemptId);
  stored = await storedAcademy(page);
  assert.equal(stored.xp, 100);
  assert.equal(stored.lessons.backspin.quizAttempts, 1);
  assert.equal(stored.lessons.backspin.journey.masteryAttempts, 1);
  assert.equal(stored.lessons.backspin.journey.masteryBest, 3);

  const retryRun = await finishMasteryAttempt(page, root, {
    answers:[0, 1, 0, 2],
    targetFixtures:[MASTERY_TARGET_FIXTURES.shallowLanding],
    keyboardTask:3
  });
  assert.equal(retryRun.attemptId, retryAttemptId);
  assert.deepEqual(retryRun.hapticsAfter, retryRun.hapticsBefore,
    'A retry with no newly earned badge or unlock must add no result-navigation haptic');

  stored = retryRun.store;
  const retriedLesson = stored.lessons.backspin;
  const retrySummary = retriedLesson.journey.lastSubmission.summary;
  assert.equal(stored.xp, 120);
  assert.equal(retriedLesson.quizAttempts, 2);
  assert.equal(retriedLesson.quizBest, 80);
  assert.equal(retriedLesson.quizBestCorrect, 4);
  assert.equal(retriedLesson.mastered, true);
  assert.equal(retriedLesson.perfect, false);
  assert.equal(retriedLesson.journey.masteryBest, 4);
  assert.equal(retriedLesson.journey.masteryAttempts, 2);
  assert.equal(retriedLesson.journey.masteryAttemptId, retryAttemptId);
  assert.equal(retrySummary.correct, 4);
  assert.equal(retrySummary.delta, 20);
  assert.equal(retrySummary.readDelta, 0);
  assert.equal(retrySummary.totalDelta, 20);
  assert.equal(retrySummary.storeXp, 120);
  assert.equal(retrySummary.leveledUp, false);
  assert.deepEqual(retrySummary.taskResults, expectedTaskResults([0, 1, 2, 3]));
  assert.deepEqual(stored.badges, ['first-light', 'spin-doctor']);

  await assertNativeResult(root, {
    attemptId:retryAttemptId,
    mastered:true,
    correct:4,
    xp:20,
    abilities:EXPECTED_MASTERY_ABILITIES.slice(0, 4)
  });

  const beforeLockedNext = await hapticLog(page);
  await root.locator('[data-action="next-lesson"]').click();
  await page.waitForFunction(() => location.hash === '#/path');
  await page.waitForTimeout(350);
  assert.deepEqual(await hapticLog(page), beforeLockedNext,
    'Locked next-lesson fallback is navigation and must not emit a haptic');
  assert.match(await page.locator('#live').textContent(),
    /Launch Angle unlocks after .*Dynamic Loft.*Attack Angle.*Returning to the Academy path/i);
  stored = await storedAcademy(page);
  assert.equal(stored.lastOpened, 'backspin');

  assert.deepEqual(runtimeErrors, []);
});
test('fresh 4/5 mastery earns 120 XP and keeps the 375px keyboard/range contract', { timeout:180_000 }, async () => {
  const viewport = { width:375, height:812 };
  const { page, root, runtimeErrors } = await openFreshBackspinPage(viewport);
  const attemptId = await completeMythsAndEnterMastery(page, root);
  const firstTask = await assertMasteryTask(page, root, 0);
  await assertMasteryViewport(page, root, viewport, 4, firstTask, '375px Mastery task 1');

  const run = await finishMasteryAttempt(page, root, {
    answers:[0, 1, 0, 2],
    targetFixtures:[MASTERY_TARGET_FIXTURES.shallowLanding],
    keyboardTask:2,
    beforeTarget:async targetTask => {
      const chips = targetTask.locator('[data-mastery-param]');
      assert.equal(await chips.count(), 3);
      assert.equal(await targetTask.locator('#masteryTargetRange[data-mastery-range]').count(), 1);
      assert.equal(await targetTask.locator('[data-action="submit-mastery-target"]').isDisabled(), false);
      for (let index = 0; index < 3; index += 1) {
        await assertMinimumTarget(chips.nth(index), `375px target parameter ${index + 1}`);
      }
      await assertMinimumTarget(targetTask.locator('#masteryTargetRange'), '375px mastery range');
      await assertMinimumTarget(targetTask.locator('[data-action="submit-mastery-target"]'),
        '375px target submit');

      assertRangeContract(
        await targetTask.locator('#masteryTargetRange').evaluate(element => ({
          min:Number(element.min),
          max:Number(element.max),
          step:Number(element.step),
          value:Number(element.value),
          ariaLabel:element.getAttribute('aria-label'),
          ariaValueText:element.getAttribute('aria-valuetext')
        })),
        EXPECTED_BACKSPIN_PARAMS.dynamicLoft,
        25
      );

      await chips.first().focus();
      await page.keyboard.press('ArrowRight');
      const attack = targetTask.locator('[data-mastery-param="attackAngle"]');
      assert.equal(await attack.getAttribute('aria-checked'), 'true');
      assert.equal(await attack.evaluate(element => document.activeElement === element), true);
      assertRangeContract(
        await targetTask.locator('#masteryTargetRange').evaluate(element => ({
          min:Number(element.min),
          max:Number(element.max),
          step:Number(element.step),
          value:Number(element.value),
          ariaLabel:element.getAttribute('aria-label'),
          ariaValueText:element.getAttribute('aria-valuetext')
        })),
        EXPECTED_BACKSPIN_PARAMS.attackAngle,
        -3
      );

      const range = targetTask.locator('#masteryTargetRange');
      await range.focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await range.inputValue(), '-2');
      assert.equal(await range.getAttribute('aria-valuetext'), '-2\u00b0');
      const focusState = await range.evaluate(element => ({
        active:document.activeElement === element,
        focusVisible:element.matches(':focus-visible'),
        boxShadow:getComputedStyle(element).boxShadow
      }));
      assert.equal(focusState.active, true);
      assert.equal(focusState.focusVisible, true);
      assert.notEqual(focusState.boxShadow, 'none');
      await assertMasteryViewport(page, root, viewport, 4, targetTask, '375px target mini-lab');
    }
  });

  assert.equal(run.attemptId, attemptId);
  const resultHaptics = run.hapticsAfter.slice(run.hapticsBefore.length);
  assert.ok(resultHaptics.filter(kind => kind === 'notify:success').length <= 1);
  assert.ok(resultHaptics.every(kind => kind === 'notify:success'));

  const stored = run.store;
  const lesson = stored.lessons.backspin;
  const summary = lesson.journey.lastSubmission.summary;
  assert.equal(stored.xp, 120);
  assert.equal(lesson.quizAttempts, 1);
  assert.equal(lesson.quizBest, 80);
  assert.equal(lesson.quizBestCorrect, 4);
  assert.equal(lesson.completed, true);
  assert.equal(lesson.mastered, true);
  assert.equal(lesson.perfect, false);
  assert.equal(lesson.journey.masteryBest, 4);
  assert.equal(lesson.journey.masteryAttempts, 1);
  assert.equal(summary.correct, 4);
  assert.equal(summary.delta, 80);
  assert.equal(summary.readDelta, 40);
  assert.equal(summary.totalDelta, 120);
  assert.equal(summary.storeXp, 120);
  assert.equal(summary.leveledUp, false);
  assert.deepEqual(summary.taskResults, expectedTaskResults([0, 1, 2, 3]));

  const result = await assertNativeResult(root, {
    attemptId,
    mastered:true,
    correct:4,
    xp:120,
    abilities:EXPECTED_MASTERY_ABILITIES.slice(0, 4)
  });
  await page.waitForFunction(() =>
    document.querySelector('#nativeLessonResult')?.contains(document.activeElement)
    || document.querySelector('.native-lesson__surface[data-surface="5"]') === document.activeElement
  );
  await assertMasteryViewport(page, root, viewport, 5, result, '375px 4-of-5 Result');
  assert.deepEqual(runtimeErrors, []);
});
test('fresh 5/5 mastery earns 190 XP, persists every ability and follows unlocked prerequisites', { timeout:180_000 }, async () => {
  const viewport = { width:430, height:932 };
  const { page, root, runtimeErrors } = await openFreshBackspinPage(viewport);
  const attemptId = await completeMythsAndEnterMastery(page, root);

  const run = await finishMasteryAttempt(page, root, {
    answers:[0, 1, 0, 2],
    targetFixtures:[MASTERY_TARGET_FIXTURES.pass],
    keyboardTask:0,
    inspectTarget:async ({ fixture, feedback, task }) => {
      assert.equal(await task.locator('[data-mastery-rpm]').getAttribute('data-value'), String(fixture.rpm));
      assert.equal(await task.locator('[data-mastery-landing]').getAttribute('data-value'), String(fixture.landing));
      const copy = (await feedback.textContent()).replace(/\s+/g, ' ').trim();
      assert.match(copy, /7,128 rpm/);
      assert.match(copy, /54\.4\u00b0/);
      assert.match(copy, /target|stopping flight|complete/i);
    }
  });

  const stored = run.store;
  const lesson = stored.lessons.backspin;
  const summary = lesson.journey.lastSubmission.summary;
  assert.equal(stored.xp, 190);
  assert.equal(lesson.quizAttempts, 1);
  assert.equal(lesson.quizBest, 150);
  assert.equal(lesson.quizBestCorrect, 5);
  assert.equal(lesson.completed, true);
  assert.equal(lesson.mastered, true);
  assert.equal(lesson.perfect, true);
  assert.equal(lesson.journey.masteryBest, 5);
  assert.equal(lesson.journey.masteryAttempts, 1);
  assert.equal(summary.correct, 5);
  assert.equal(summary.perfect, true);
  assert.equal(summary.delta, 150);
  assert.equal(summary.readDelta, 40);
  assert.equal(summary.totalDelta, 190);
  assert.equal(summary.storeXp, 190);
  assert.equal(summary.leveledUp, false);
  assert.deepEqual(summary.taskResults, expectedTaskResults([0, 1, 2, 3, 4]));
  assert.deepEqual(stored.badges, ['first-light', 'spin-doctor', 'flawless']);

  const result = await assertNativeResult(root, {
    attemptId,
    mastered:true,
    correct:5,
    xp:190,
    abilities:EXPECTED_MASTERY_ABILITIES
  });
  await assertMasteryViewport(page, root, viewport, 5, result, '430px perfect Result');

  await page.evaluate(key => {
    const saved = JSON.parse(localStorage.getItem(key));
    saved.lessons['dynamic-loft'].completed = true;
    saved.lessons['attack-angle'].completed = true;
    localStorage.setItem(key, JSON.stringify(saved));
  }, STORE_KEY);
  await page.reload({ waitUntil:'networkidle' });
  await root.waitFor({ timeout:5_000 });
  await assertEventuallyRootSurface(page, root, '5');
  await assertNativeResult(root, {
    attemptId,
    mastered:true,
    correct:5,
    xp:190,
    abilities:EXPECTED_MASTERY_ABILITIES
  });

  const beforeUnlockedNext = await hapticLog(page);
  await root.locator('[data-action="next-lesson"]').click();
  await page.waitForFunction(() => location.hash === '#/lesson/launch-angle');
  await page.locator('.view.lesson h1').waitFor();
  assert.equal((await page.locator('.view.lesson h1').textContent()).trim(), 'Launch Angle');
  assert.equal(await page.locator('#nativeLesson').count(), 0);
  assert.deepEqual(await hapticLog(page), beforeUnlockedNext,
    'An unlocked next-lesson navigation must not emit a haptic');
  assert.equal((await storedAcademy(page)).lastOpened, 'launch-angle');
  assert.deepEqual(runtimeErrors, []);
});
test('persisted XP crosses the real 400 threshold only on the 300-to-420 mastery commit', { timeout:120_000 }, async () => {
  const viewport = { width:375, height:812 };
  const attemptId = 'rank-threshold-attempt';
  const seeded = seededMasteryStore({ xp:300, attemptId });
  const { page, root, runtimeErrors } = await openFreshBackspinPage(viewport, {
    beforeGoto:async targetPage => {
      await targetPage.addInitScript(({ key, value }) => {
        localStorage.setItem(key, value);
      }, { key:STORE_KEY, value:JSON.stringify(seeded) });
    }
  });
  await assertEventuallyRootSurface(page, root, '4');
  assert.equal(await root.locator('#masteryTask').getAttribute('data-attempt'), attemptId);

  const run = await finishMasteryAttempt(page, root, {
    answers:[0, 1, 0, 2],
    targetFixtures:[MASTERY_TARGET_FIXTURES.shallowLanding]
  });
  const stored = run.store;
  const summary = stored.lessons.backspin.journey.lastSubmission.summary;
  assert.equal(stored.xp, 420);
  assert.equal(summary.correct, 4);
  assert.equal(summary.delta, 80);
  assert.equal(summary.readDelta, 40);
  assert.equal(summary.totalDelta, 120);
  assert.equal(summary.storeXp, 420);
  assert.equal(summary.leveledUp, true);
  assert.equal(summary.levelInfo.lvl, 2);
  assert.equal(summary.levelInfo.title, 'Apprentice');
  assert.deepEqual(summary.taskResults, expectedTaskResults([0, 1, 2, 3]));

  const result = await assertNativeResult(root, {
    attemptId,
    mastered:true,
    correct:4,
    xp:120,
    abilities:EXPECTED_MASTERY_ABILITIES.slice(0, 4),
    rank:/Level 2.*Apprentice|Apprentice.*Level 2/i
  });
  await assertMasteryViewport(page, root, viewport, 5, result, '375px threshold-crossing Result');
  assert.deepEqual(runtimeErrors, []);
});
test('a wrong mastery choice can be corrected without losing its non-first-try truth', { timeout:120_000 }, async () => {
  const attemptId = 'choice-retry-attempt';
  const seeded = seededMasteryStore({ attemptId });
  const { page, root, runtimeErrors } = await openFreshBackspinPage({ width:430, height:932 }, {
    beforeGoto:async targetPage => {
      await targetPage.addInitScript(({ key, value }) => {
        localStorage.setItem(key, value);
      }, { key:STORE_KEY, value:JSON.stringify(seeded) });
    }
  });

  let task = await assertMasteryTask(page, root, 0);
  await answerMasteryChoice(page, task, 1);
  assert.equal(await task.locator('[data-mastery-choice="0"]').isDisabled(), false,
    'A wrong choice must remain retryable inside the active attempt');
  await answerMasteryChoice(page, task, 0);
  assert.equal(await task.locator('[data-mastery-choice="0"]').getAttribute('aria-checked'), 'true');
  await advanceMasteryTask(page, root, 1);

  const wrongAnswers = [null, 0, 1, 0];
  for (let index = 1; index < 4; index += 1) {
    task = await assertMasteryTask(page, root, index);
    await answerMasteryChoice(page, task, wrongAnswers[index]);
    await advanceMasteryTask(page, root, index + 1);
  }
  task = await assertMasteryTask(page, root, 4);
  await setMasteryTargetState(page, root, MASTERY_TARGET_FIXTURES.shallowLanding.state);
  await waitForMasteryReadout(page, MASTERY_TARGET_FIXTURES.shallowLanding);
  await submitMasteryTarget(root);
  await advanceMasteryTask(page, root, 5);
  await assertEventuallyRootSurface(page, root, '5');
  await page.waitForFunction(key =>
    Boolean(JSON.parse(localStorage.getItem(key))?.lessons?.backspin?.journey?.lastSubmission),
  STORE_KEY);

  const stored = await storedAcademy(page);
  const summary = stored.lessons.backspin.journey.lastSubmission.summary;
  assert.equal(stored.xp, 50);
  assert.equal(summary.correct, 1);
  assert.equal(summary.delta, 10);
  assert.equal(summary.readDelta, 40);
  assert.equal(summary.totalDelta, 50);
  assert.deepEqual(summary.taskResults, [
    { resolved:true, firstTry:false },
    { resolved:false, firstTry:false },
    { resolved:false, firstTry:false },
    { resolved:false, firstTry:false },
    { resolved:false, firstTry:false }
  ]);
  await assertNativeResult(root, {
    attemptId,
    mastered:false,
    correct:1,
    xp:50,
    abilities:EXPECTED_MASTERY_ABILITIES.slice(0, 1)
  });
  assert.deepEqual(runtimeErrors, []);
});
test('invalid persisted Result repairs to a fresh active Mastery attempt without rewards', { timeout:60_000 }, async () => {
  const activeAttemptId = 'repair-active-attempt';
  const seeded = seededMasteryStore({ xp:77, attemptId:activeAttemptId });
  Object.assign(seeded.lessons.backspin.journey, {
    surface:5,
    masteryBest:3,
    masteryAttempts:2,
    lastSubmission:{
      attemptId:'stale-other-attempt',
      summary:{
        correct:5,
        total:5,
        mastered:true,
        totalDelta:190,
        taskResults:expectedTaskResults([0, 1, 2, 3, 4])
      }
    }
  });

  const { page, root, runtimeErrors } = await openFreshBackspinPage({ width:430, height:932 }, {
    beforeGoto:async targetPage => {
      await targetPage.addInitScript(({ key, value }) => {
        localStorage.setItem(key, value);
      }, { key:STORE_KEY, value:JSON.stringify(seeded) });
    }
  });

  await assertEventuallyRootSurface(page, root, '4');
  const task = await assertMasteryTask(page, root, 0);
  assert.equal(await task.getAttribute('data-attempt'), activeAttemptId);
  assert.equal(await task.getAttribute('data-submitted'), 'false');
  assert.deepEqual(
    await task.locator('[data-mastery-choice]').evaluateAll(buttons =>
      buttons.map(button => button.getAttribute('aria-checked'))),
    ['false', 'false', 'false']
  );
  assert.equal(await task.locator('[data-mastery-feedback]').isHidden(), true);
  assert.equal(await root.locator('[data-step="result"]').getAttribute('aria-disabled'), 'true');

  const stored = await storedAcademy(page);
  const lesson = stored.lessons.backspin;
  assert.equal(stored.xp, 77);
  assert.equal(lesson.read, false);
  assert.equal(lesson.quizAttempts, 0);
  assert.equal(lesson.completed, false);
  assert.equal(lesson.mastered, false);
  assert.equal(lesson.journey.surface, 4);
  assert.equal(lesson.journey.masteryAttemptId, activeAttemptId);
  assert.equal(lesson.journey.masteryBest, 3);
  assert.equal(lesson.journey.masteryAttempts, 2);
  assert.equal(lesson.journey.lastSubmission, null);
  assert.deepEqual(await hapticLog(page), [],
    'Repairing corrupt progress must not emit mastery or reward haptics');
  assert.deepEqual(runtimeErrors, []);
});
for (const viewport of BACKSPIN_VIEWPORTS) {
  test(`all six Backspin surfaces fit ${viewport.width}x${viewport.height} with native target sizes`,
    { timeout:240_000 }, async () => {
      const { page, root, runtimeErrors } = await openFreshBackspinPage(viewport);
      await auditNativeSurface(page, root, viewport, 0, 'Mission');

      await enterSpinLab(page, root);
      await auditNativeSurface(page, root, viewport, 1, 'Spin Lab');

      await setBackspinParameter(page, root, 'dynamicLoft', 30);
      await waitForBackspinJourney(page, { surface:1, built:true, cut:false });
      await setBackspinParameter(page, root, 'dynamicLoft', 10);
      await waitForBackspinJourney(page, { surface:1, built:true, cut:true });
      await root.locator('.native-lesson__navigation [data-action="next"]').click();
      await assertEventuallyRootSurface(page, root, '2');
      await auditNativeSurface(page, root, viewport, 2, 'Influence');

      await root.locator('.native-lesson__navigation [data-action="next"]').click();
      await assertEventuallyRootSurface(page, root, '3');
      await auditNativeSurface(page, root, viewport, 3, 'Myths');

      const completed = [false, false, false];
      for (let index = 0; index < EXPECTED_MYTH_EXPERIMENTS.length; index += 1) {
        const expected = EXPECTED_MYTH_EXPERIMENTS[index];
        await root.locator(`#mythExperiment [data-myth-choice="${expected.answerIndex}"]`).click();
        completed[index] = true;
        await waitForBackspinJourney(page, { surface:3, myths:[...completed] });
        await root.locator('[data-myth-next]').click();
        if (index < EXPECTED_MYTH_EXPERIMENTS.length - 1) {
          await page.waitForFunction(
            next => document.querySelector('#mythExperiment')?.dataset.experimentIndex === String(next),
            index + 1
          );
        }
      }
      await assertEventuallyRootSurface(page, root, '4');
      await auditNativeSurface(page, root, viewport, 4, 'Mastery Check');

      await finishMasteryAttempt(page, root, {
        answers:[0, 1, 0, 2],
        targetFixtures:[MASTERY_TARGET_FIXTURES.shallowLanding]
      });
      await auditNativeSurface(page, root, viewport, 5, 'Result');
      assert.deepEqual(runtimeErrors, []);
    });
}
test('Backspin completes its required learning actions with keyboard input only', { timeout:180_000 }, async () => {
  const { page, root, runtimeErrors } = await openFreshBackspinPage({ width:375, height:812 });

  const missionAction = '.native-lesson__navigation [data-action="next"]';
  await tabToSelector(page, missionAction);
  await assertKeyboardFocus(page, missionAction, 'Mission action');
  await page.keyboard.press('Enter');
  await assertEventuallyRootSurface(page, root, '1');
  await page.waitForFunction(() => document.activeElement?.matches('.native-lesson__surface[data-surface="1"]'));
  await assertKeyboardFocus(page, '.native-lesson__surface[data-surface="1"]', 'Spin Lab surface');


  await tabToSelector(page, '[data-param="dynamicLoft"]');
  await assertKeyboardFocus(page, '[data-param="dynamicLoft"]', 'Dynamic-loft parameter');
  await page.keyboard.press('ArrowRight');
  assert.equal(await root.locator('[data-param="attackAngle"]').getAttribute('aria-checked'), 'true');
  await assertKeyboardFocus(page, '[data-param="attackAngle"]', 'Attack-angle parameter');

  await tabToSelector(page, '#labRange');
  await assertKeyboardFocus(page, '#labRange', 'Spin Lab range');
  assert.equal(await root.locator('#labRange').inputValue(), '-3');
  await page.keyboard.press('ArrowRight');
  assert.equal(await root.locator('#labRange').inputValue(), '-2');
  await assertKeyboardFocus(page, '#labRange', 'Changed Spin Lab range');

  await tabToSelector(page, '[data-sheet="spinLoft"]', { reverse:true });
  await assertKeyboardFocus(page, '[data-sheet="spinLoft"]', 'Spin-loft sheet opener');
  await page.keyboard.press('Enter');
  await root.locator('#lessonSheet').waitFor({ state:'visible' });
  await page.waitForFunction(() => document.activeElement?.id === 'lessonSheet');
  await assertKeyboardFocus(page, '#lessonSheet', 'Open sheet dialog');
  await page.keyboard.press('Tab');
  await assertKeyboardFocus(page, '#lessonSheet [data-sheet-close]', 'Sheet close action');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() =>
    document.querySelector('#lessonSheet')?.contains(document.activeElement)), true);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(() =>
    document.querySelector('#lessonSheet')?.contains(document.activeElement)), true);
  await page.keyboard.press('Escape');
  await root.locator('#lessonSheet').waitFor({ state:'hidden' });
  await assertKeyboardFocus(page, '[data-sheet="spinLoft"]', 'Returned sheet opener');

  await tabToSelector(page, '[data-param="attackAngle"]');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await root.locator('[data-param="dynamicLoft"]').getAttribute('aria-checked'), 'true');
  await assertKeyboardFocus(page, '[data-param="dynamicLoft"]', 'Restored dynamic-loft parameter');
  await tabToSelector(page, '#labRange');
  await pressKey(page, 'ArrowRight', 7);
  await waitForBackspinJourney(page, { surface:1, built:true, cut:false });
  await pressKey(page, 'ArrowLeft', 19);
  await waitForBackspinJourney(page, { surface:1, built:true, cut:true });
  await assertKeyboardFocus(page, '#labRange', 'Mission-complete range');

  const lessonNext = '.native-lesson__navigation [data-action="next"]';
  await tabToSelector(page, lessonNext);
  await assertKeyboardFocus(page, lessonNext, 'Influence navigation');
  await page.keyboard.press('Enter');
  await assertEventuallyRootSurface(page, root, '2');
  await page.waitForFunction(() => document.activeElement?.matches('.native-lesson__surface[data-surface="2"]'));
  await assertKeyboardFocus(page, '.native-lesson__surface[data-surface="2"]', 'Influence surface');

  await tabToSelector(page, lessonNext);
  await assertKeyboardFocus(page, lessonNext, 'Myths navigation');
  await page.keyboard.press('Enter');
  await assertEventuallyRootSurface(page, root, '3');
  await page.waitForFunction(() => document.activeElement?.matches('.native-lesson__surface[data-surface="3"]'));
  await assertKeyboardFocus(page, '.native-lesson__surface[data-surface="3"]', 'Myths surface');


  for (let index = 0; index < EXPECTED_MYTH_EXPERIMENTS.length; index += 1) {
    const expected = EXPECTED_MYTH_EXPERIMENTS[index];
    await tabToSelector(page, '[data-myth-choice="0"]');
    await assertKeyboardFocus(page, '[data-myth-choice="0"]', `Myth ${index + 1} first choice`);
    await pressKey(page, 'ArrowRight', expected.answerIndex);
    const supported = `[data-myth-choice="${expected.answerIndex}"]`;
    await assertKeyboardFocus(page, supported, `Myth ${index + 1} supported choice`);
    await page.keyboard.press('Space');
    await root.locator('[data-myth-evidence]').waitFor({ state:'visible' });
    await page.waitForFunction(selector => document.activeElement?.matches(selector), supported);
    await assertKeyboardFocus(page, supported, `Myth ${index + 1} answered choice`);
    await tabToSelector(page, '[data-myth-next]');
    await assertKeyboardFocus(page, '[data-myth-next]', `Myth ${index + 1} next action`);
    await page.keyboard.press('Enter');
    if (index < EXPECTED_MYTH_EXPERIMENTS.length - 1) {
      await page.waitForFunction(
        next => document.querySelector('#mythExperiment')?.dataset.experimentIndex === String(next),
        index + 1
      );
      await page.waitForFunction(() => document.activeElement?.matches('[data-myth-prompt]'));
      await assertKeyboardFocus(page, '[data-myth-prompt]', `Myth ${index + 2} prompt`);
    }
  }

  await assertEventuallyRootSurface(page, root, '4');
  await page.waitForFunction(() => document.activeElement?.matches('[data-mastery-prompt]'));
  await assertKeyboardFocus(page, '[data-mastery-prompt]', 'Mastery prompt');
  await tabToSelector(page, '[data-mastery-choice="0"]');
  await assertKeyboardFocus(page, '[data-mastery-choice="0"]', 'Mastery definition choice');
  await page.keyboard.press('Space');
  await root.locator('[data-mastery-feedback]').waitFor({ state:'visible' });
  await page.waitForFunction(() => document.activeElement?.matches('[data-mastery-choice="0"]'));
  await assertKeyboardFocus(page, '[data-mastery-choice="0"]', 'Answered mastery choice');
  assert.equal(await root.locator('[data-mastery-choice="0"]').getAttribute('aria-checked'), 'true');
  assert.deepEqual(runtimeErrors, []);
});
test('normal and reduced motion produce equivalent Backspin learning state', { timeout:180_000 }, async () => {
  const normal = await runMotionJourney('no-preference');
  const reduced = await runMotionJourney('reduce');

  assert.equal(normal.reduced, 'false');
  assert.equal(reduced.reduced, 'true');
  assert.match(normal.immediateCause, /Move one input/i,
    'Normal motion keeps the 300ms cause-chain settle');
  assert.match(reduced.immediateCause, /Dynamic loft/i,
    'Reduced motion settles the cause chain in the input event');

  assert.deepEqual(reduced.lab, normal.lab, 'Spin Lab semantics must not depend on motion preference');
  assert.deepEqual(reduced.influence, normal.influence,
    'Influence ordering and values must not depend on motion preference');
  assert.deepEqual(reduced.myth, normal.myth,
    'Myth choices, engine runs, metrics and navigation state must remain equivalent');

  for (const [label, transition, expected] of [
    ['Influence', reduced.toInfluence, { before:'1', after:'2' }],
    ['Myths', reduced.toMyths, { before:'2', after:'3' }]
  ]) {
    assert.deepEqual({ before:transition.before, after:transition.after }, expected,
      `${label} must become current in the same reduced-motion event`);
    assert.equal(transition.transitionProperty, 'none',
      `${label} pager transition must be disabled for reduced motion`);
  }

  assert.equal(normal.mythReveal.reveal, 'sequence');
  assert.equal(reduced.mythReveal.reveal, 'instant');
  assert.equal(reduced.mythReveal.metricCount, 6);
  assert.equal(reduced.mythReveal.metrics.length, 6);
  for (const metric of reduced.mythReveal.metrics) {
    assert.ok(metric.text.length > 0, 'Reduced motion must reveal populated myth metrics immediately');
    assert.equal(metric.animationName, 'none');
    assert.equal(metric.opacity, '1');
  }
  assert.deepEqual(normal.runtimeErrors, []);
  assert.deepEqual(reduced.runtimeErrors, []);
});
test('Backspin keeps full in-memory progression when Academy storage throws', { timeout:120_000 }, async () => {
  const { page, root, runtimeErrors } = await openFreshBackspinPage({ width:430, height:932 }, {
    beforeGoto:async targetPage => {
      await targetPage.addInitScript(key => {
        const nativeGet = Storage.prototype.getItem;
        const nativeSet = Storage.prototype.setItem;
        const probe = { getCalls:0, setCalls:0 };
        Object.defineProperty(window, '__academyStorageProbe', { value:probe });
        Storage.prototype.getItem = function guardedGetItem(storageKey) {
          if (storageKey === key) {
            probe.getCalls += 1;
            throw new DOMException('Academy storage unavailable', 'SecurityError');
          }
          return nativeGet.call(this, storageKey);
        };
        Storage.prototype.setItem = function guardedSetItem(storageKey, value) {
          if (storageKey === key) {
            probe.setCalls += 1;
            throw new DOMException('Academy storage unavailable', 'SecurityError');
          }
          return nativeSet.call(this, storageKey, value);
        };
      }, STORE_KEY);
    }
  });

  assert.ok((await page.evaluate(() => window.__academyStorageProbe.getCalls)) >= 1,
    'Academy load must exercise the throwing getItem path');
  await enterSpinLab(page, root);
  await setBackspinParameter(page, root, 'dynamicLoft', 30);
  await page.waitForFunction(() =>
    document.querySelector('#missionStageBuild')?.dataset.complete === 'true'
  );
  await setBackspinParameter(page, root, 'dynamicLoft', 10);
  await page.waitForFunction(() =>
    document.querySelector('#missionStageBuild')?.dataset.complete === 'true'
      && document.querySelector('#missionStageCut')?.dataset.complete === 'true'
  );

  const next = root.locator('.native-lesson__navigation [data-action="next"]');
  assert.equal(await next.isDisabled(), false);
  await next.click();
  await assertEventuallyRootSurface(page, root, '2');
  await page.waitForFunction(() => window.__academyStorageProbe.setCalls >= 1);

  await page.evaluate(() => { location.hash = '#/path'; });
  await page.waitForFunction(() => location.hash === '#/path' && !document.querySelector('#nativeLesson'));
  await page.evaluate(() => { location.hash = '#/lesson/backspin'; });
  await root.waitFor({ state:'visible', timeout:5_000 });
  await assertEventuallyRootSurface(page, root, '2');
  assert.equal(await root.locator('#missionStageBuild').getAttribute('data-complete'), 'true');
  assert.equal(await root.locator('#missionStageCut').getAttribute('data-complete'), 'true');

  const probe = await page.evaluate(() => ({ ...window.__academyStorageProbe }));
  assert.ok(probe.getCalls >= 1);
  assert.ok(probe.setCalls >= 1);
  assert.deepEqual(runtimeErrors, []);
});
test('Backspin keeps finite model truth and mission progress when canvas context is unavailable',
  { timeout:90_000 }, async () => {
    const { page, root, runtimeErrors } = await openFreshBackspinPage({ width:375, height:812 }, {
      beforeGoto:async targetPage => {
        await targetPage.addInitScript(() => {
          const nativeGetContext = HTMLCanvasElement.prototype.getContext;
          const probe = { calls:0 };
          Object.defineProperty(window, '__academyCanvasProbe', { value:probe });
          HTMLCanvasElement.prototype.getContext = function guardedGetContext(type, ...args) {
            if (this.id === 'flightCanvas') {
              probe.calls += 1;
              return null;
            }
            return nativeGetContext.call(this, type, ...args);
          };
        });
      }
    });

    await page.waitForFunction(() => document.querySelector('#nativeLesson')?.dataset.canvasMode === 'fallback');
    assert.equal(await root.locator('#flightCanvas').isHidden(), true);
    assert.equal(await root.locator('#flightFallback').isVisible(), true);
    assert.ok((await page.evaluate(() => window.__academyCanvasProbe.calls)) >= 1);

    await enterSpinLab(page, root);
    const readouts = await root.evaluate(lesson => [
      '#backspinTruth', '[data-spin-loft]', '[data-carry]', '[data-apex]', '[data-landing]'
    ].map(selector => Number((lesson.querySelector(selector)?.textContent || '')
      .replaceAll(',', '').replace(/[^\d.-]/g, ''))));
    assert.equal(readouts.length, 5);
    assert.ok(readouts.every(Number.isFinite), `Canvas fallback exposed invalid readouts: ${readouts}`);

    await setBackspinParameter(page, root, 'dynamicLoft', 30);
    await page.waitForFunction(() =>
      document.querySelector('#missionStageBuild')?.dataset.complete === 'true'
    );
    await setBackspinParameter(page, root, 'dynamicLoft', 10);
    await page.waitForFunction(() =>
      document.querySelector('#missionStageCut')?.dataset.complete === 'true'
    );
    const next = root.locator('.native-lesson__navigation [data-action="next"]');
    assert.equal(await next.isDisabled(), false);
    await next.click();
    await assertEventuallyRootSurface(page, root, '2');
    assert.equal(await root.locator('#influenceBars [data-influence]').count(), 3);
    assert.equal(await root.getAttribute('data-canvas-mode'), 'fallback');
    assert.deepEqual(runtimeErrors, []);
  });
test('a true missing Backspin JPG removes the whole media block and preserves sheet content',
  { timeout:120_000 }, async () => {
    const { page, root, runtimeErrors } = await openFreshBackspinPage({ width:430, height:932 });
    const missingUrl = `${baseUrl}/assets/__missing-backspin.jpg`;
    const imageUrl = `${baseUrl}/assets/rw-backspin-green-bite.jpg`;
    const fetched = [];
    await page.route('**/assets/rw-backspin-green-bite.jpg', async route => {
      const response = await route.fetch({ url:missingUrl });
      fetched.push({ status:response.status(), url:response.url() });
      await route.fulfill({ response });
    });

    await completeMissionAndEnterInfluence(page, root);
    await root.locator('[data-lie="wet"]').click();
    await root.locator('#realWorldRegister').click();
    const sheet = root.locator('#lessonSheet');
    await sheet.waitFor({ state:'visible' });
    await page.waitForFunction(() =>
      document.querySelector('#lessonSheet')?.dataset.mediaState === 'unavailable'
    );

    assert.deepEqual(fetched, [{ status:404, url:missingUrl }]);
    assert.equal(await sheet.locator('[data-real-world-media]').count(), 0);
    assert.equal(await sheet.locator('[data-real-world-image]').count(), 0);
    assert.equal(await sheet.locator('figcaption').count(), 0);
    assert.equal((await sheet.locator('#lessonSheetTitle').textContent()).trim(), 'Wet face / ball');
    assert.match(await sheet.locator('[data-sheet-body]').textContent(), /not the simulator/i);
    assert.equal(await sheet.locator('[data-sheet-close]').isVisible(), true);

    await page.keyboard.press('Escape');
    await sheet.waitFor({ state:'hidden' });
    await page.waitForTimeout(100);
    const expectedResponse = `response:404: ${imageUrl}`;
    const responseErrors = runtimeErrors.filter(entry => entry.startsWith('response:'));
    assert.deepEqual(responseErrors, [expectedResponse],
      `Only the deliberately missing image may return HTTP 404: ${JSON.stringify(runtimeErrors)}`);
    const expectedConsole = 'console: Failed to load resource: the server responded with a status of 404 (Not Found)';
    const remaining = runtimeErrors.filter(entry => entry !== expectedResponse);
    assert.ok(remaining.length <= 1 && remaining.every(entry => entry === expectedConsole),
      `The known image 404 must be the only console exception: ${JSON.stringify(runtimeErrors)}`);
  });
test('Backspin route changes cancel a pending settle and close an open native sheet',
  { timeout:120_000 }, async () => {
    const { page, root, runtimeErrors } = await openFreshBackspinPage(
      { width:430, height:932 },
      { reducedMotion:'no-preference' }
    );
    await enterSpinLab(page, root);

    await page.evaluate(() => {
      const lesson = document.querySelector('#nativeLesson');
      const range = lesson.querySelector('#labRange');
      window.__detachedBackspin = lesson;
      window.__detachedCause = lesson.querySelector('#causeChain');
      window.__detachedSheet = lesson.querySelector('#lessonSheet');
      window.__detachedFrame = lesson.querySelector('.native-lesson__frame');
      range.value = '26';
      range.dispatchEvent(new Event('input', { bubbles:true }));
      window.__detachedCauseBefore = window.__detachedCause.textContent;
      location.hash = '#/path';
    });
    await page.waitForFunction(() => location.hash === '#/path' && !document.querySelector('#nativeLesson'));
    await page.waitForTimeout(500);

    const settleCleanup = await page.evaluate(() => ({
      connected:window.__detachedBackspin.isConnected,
      destroyed:window.__detachedBackspin.dataset.destroyed,
      causeBefore:window.__detachedCauseBefore,
      causeAfter:window.__detachedCause.textContent,
      sheetHidden:window.__detachedSheet.hidden,
      frameInert:window.__detachedFrame.inert,
      live:(document.querySelector('#live')?.textContent || '').trim(),
      appInert:document.querySelector('#app')?.inert,
      activeConnected:document.activeElement?.isConnected
    }));
    assert.deepEqual(settleCleanup, {
      connected:false,
      destroyed:'true',
      causeBefore:'Move one input to reveal the cause chain.',
      causeAfter:'Move one input to reveal the cause chain.',
      sheetHidden:true,
      frameInert:false,
      live:'',
      appInert:false,
      activeConnected:true
    });

    await page.evaluate(() => { location.hash = '#/lesson/backspin'; });
    await root.waitFor({ state:'visible', timeout:5_000 });
    await assertEventuallyRootSurface(page, root, '1');
    const opener = root.locator('[data-sheet="spinLoft"]');
    await opener.click();
    await root.locator('#lessonSheet').waitFor({ state:'visible' });
    await page.waitForFunction(() => document.activeElement?.id === 'lessonSheet');
    await page.evaluate(() => {
      window.__detachedSheetLesson = document.querySelector('#nativeLesson');
      window.__detachedSheetOpener = document.querySelector('[data-sheet="spinLoft"]');
      location.hash = '#/path';
    });
    await page.waitForFunction(() => location.hash === '#/path' && !document.querySelector('#nativeLesson'));
    await page.waitForTimeout(400);

    const sheetCleanup = await page.evaluate(() => {
      const lesson = window.__detachedSheetLesson;
      const sheet = lesson.querySelector('#lessonSheet');
      const frame = lesson.querySelector('.native-lesson__frame');
      return {
        connected:lesson.isConnected,
        destroyed:lesson.dataset.destroyed,
        openerConnected:window.__detachedSheetOpener.isConnected,
        openerOwnsFocus:document.activeElement === window.__detachedSheetOpener,
        sheetHidden:sheet.hidden,
        frameInert:frame.inert,
        appInert:document.querySelector('#app')?.inert,
        activeConnected:document.activeElement?.isConnected
      };
    });
    assert.deepEqual(sheetCleanup, {
      connected:false,
      destroyed:'true',
      openerConnected:false,
      openerOwnsFocus:false,
      sheetHidden:true,
      frameInert:false,
      appInert:false,
      activeConnected:true
    });
    assert.deepEqual(runtimeErrors, []);
  });
test('a non-finite Spin Lab input preserves the last valid truth without mission credit',
  { timeout:90_000 }, async () => {
    const { page, root, runtimeErrors } = await openFreshBackspinPage({ width:375, height:812 });
    await enterSpinLab(page, root);
    await waitForBackspinJourney(page, { surface:1, built:false, cut:false, diagramTouched:false });

    const labContract = () => root.evaluate(lesson => ({
      truth:lesson.querySelector('#backspinTruth')?.textContent.trim(),
      range:lesson.querySelector('#labRange')?.value,
      rangeValueText:lesson.querySelector('#labRange')?.getAttribute('aria-valuetext'),
      cause:lesson.querySelector('#causeChain')?.textContent.replace(/\s+/g, ' ').trim(),
      built:lesson.querySelector('#missionStageBuild')?.dataset.complete,
      cut:lesson.querySelector('#missionStageCut')?.dataset.complete,
      count:lesson.querySelector('[data-mission-count]')?.textContent.trim(),
      nextDisabled:lesson.querySelector('.native-lesson__navigation [data-action="next"]')?.disabled,
      nextAriaDisabled:lesson.querySelector('.native-lesson__navigation [data-action="next"]')
        ?.getAttribute('aria-disabled')
    }));
    const before = await labContract();
    const storeBefore = await storedAcademy(page);
    const hapticsBefore = await hapticLog(page);

    await page.evaluate(() => {
      const range = document.querySelector('#labRange');
      Object.defineProperty(range, 'valueAsNumber', { configurable:true, get:() => Number.NaN });
      range.dispatchEvent(new Event('input', { bubbles:true }));
    });
    await page.waitForFunction(() =>
      document.querySelector('#nativeLesson')?.dataset.modelStatus === 'error'
        && document.querySelector('#live')?.textContent.trim() === 'Model could not update'
    );

    assert.deepEqual(await labContract(), before);
    assert.deepEqual(await storedAcademy(page), storeBefore);
    assert.deepEqual(await hapticLog(page), hapticsBefore);
    const lesson = (await storedAcademy(page)).lessons.backspin;
    assert.deepEqual(lesson.journey.mission, { built:false, cut:false });
    assert.equal(lesson.diagramTouched, false);
    assert.deepEqual(runtimeErrors, []);
  });
test('a non-finite Mastery target input cannot alter readouts or receive target credit',
  { timeout:120_000 }, async () => {
    const seeded = seededMasteryStore({ attemptId:'nonfinite-target-attempt' });
    const { page, root, runtimeErrors } = await openFreshBackspinPage({ width:430, height:932 }, {
      beforeGoto:async targetPage => {
        await targetPage.addInitScript(({ key, value }) => {
          localStorage.setItem(key, value);
        }, { key:STORE_KEY, value:JSON.stringify(seeded) });
      }
    });
    await assertEventuallyRootSurface(page, root, '4');
    await answerMasteryChoices(page, root, [0, 1, 0, 2]);
    await page.waitForTimeout(500);

    const targetContract = () => root.evaluate(lesson => {
      const task = lesson.querySelector('#masteryTask');
      const range = lesson.querySelector('#masteryTargetRange');
      const feedback = lesson.querySelector('[data-mastery-target-feedback]');
      const next = lesson.querySelector('[data-mastery-next]');
      return {
        taskAnswered:task?.dataset.answered,
        range:range?.value,
        rangeValueText:range?.getAttribute('aria-valuetext'),
        shownValue:lesson.querySelector('[data-mastery-range-value]')?.textContent.trim(),
        rpmData:lesson.querySelector('[data-mastery-rpm]')?.dataset.value,
        rpmText:lesson.querySelector('[data-mastery-rpm]')?.textContent.trim(),
        landingData:lesson.querySelector('[data-mastery-landing]')?.dataset.value,
        landingText:lesson.querySelector('[data-mastery-landing]')?.textContent.trim(),
        targetLocked:lesson.querySelector('[data-mastery-target]')?.dataset.locked,
        feedbackHidden:feedback?.hidden,
        feedbackCorrect:feedback?.dataset.correct,
        nextDisabled:next?.disabled,
        nextAriaDisabled:next?.getAttribute('aria-disabled'),
        progress:[...lesson.querySelectorAll('[data-mastery-progress-item]')]
          .map(item => item.dataset.status)
      };
    });
    const before = await targetContract();
    assert.equal(before.taskAnswered, '4');
    assert.equal(before.feedbackHidden, true);
    assert.equal(before.feedbackCorrect, 'unanswered');
    const storeBefore = await storedAcademy(page);
    const hapticsBefore = await hapticLog(page);

    await page.evaluate(() => {
      const range = document.querySelector('#masteryTargetRange');
      Object.defineProperty(range, 'valueAsNumber', { configurable:true, get:() => Number.NaN });
      range.dispatchEvent(new Event('input', { bubbles:true }));
    });
    await page.waitForFunction(() =>
      document.querySelector('#nativeLesson')?.dataset.modelStatus === 'error'
        && document.querySelector('#live')?.textContent.trim() === 'Model could not update'
    );

    assert.deepEqual(await targetContract(), before);
    assert.deepEqual(await storedAcademy(page), storeBefore);
    assert.deepEqual(await hapticLog(page), hapticsBefore);
    assert.deepEqual(runtimeErrors, []);
  });
test('generic Carry preserves legacy rewards and storage across 3/5, 4/5 and reload', { timeout: 30_000 }, async () => {
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    reducedMotion: 'reduce'
  });
  contexts.add(context);
  await context.addInitScript(({ key, value }) => {
    if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
  }, { key: STORE_KEY, value: JSON.stringify(LEGACY_STORE) });

  const page = await context.newPage();
  pages.add(page);
  const runtimeErrors = observeRuntimeErrors(page);

  await page.goto(`${baseUrl}/academy.html#/lesson/carry`, { waitUntil: 'networkidle' });
  await page.locator('#quizMount .q').first().waitFor();
  assert.equal((await page.locator('.view.lesson h1').textContent()).trim(), 'Carry');
  assert.equal(await page.locator('#nativeLesson').count(), 0);
  assert.equal(await page.locator('#quizMount .q').count(), 5);

  for (let question = 0; question < CARRY_ANSWERS.length; question += 1) {
    const correct = CARRY_ANSWERS[question];
    const option = question < 3 ? correct : (correct + 1) % 4;
    await answer(page, question, option);
  }
  await page.locator('#finishBtn.ready').click();
  await page.locator('#completionMount .completion').waitFor();
  assert.equal((await page.locator('#completionMount .ck').textContent()).trim(), 'Module complete');
  assert.equal((await page.locator('#completionMount h2').textContent()).trim(), 'Carry complete');

  const completed = await waitForStored(page, { attempts: 1, best: 60 });
  assert.equal(completed.xp, 100, '40 read XP plus three first-try answers');
  assert.equal(completed.lessons.carry.read, true);
  assert.equal(completed.lessons.carry.completed, true);
  assert.equal(completed.lessons.carry.mastered, false);
  assert.equal(completed.lessons.carry.quizBestCorrect, 3);
  assert.equal(completed.lessons.carry.quizLen, 5);
  assert.equal(completed.lessons.carry.quizAttempts, 1);
  assert.equal(completed.lessons.carry.quizBest, 60);
  assert.deepEqual(completed.legacyStoreField, LEGACY_STORE.legacyStoreField);
  assert.deepEqual(
    completed.lessons.carry.legacyLessonField,
    LEGACY_STORE.lessons.carry.legacyLessonField
  );

  await page.locator('[data-retry="3"]').click();
  await answer(page, 3, CARRY_ANSWERS[3]);
  await page.locator('#finishBtn.ready').click();
  assert.equal((await page.locator('#completionMount .ck').textContent()).trim(), 'Module mastered');
  assert.equal((await page.locator('#completionMount h2').textContent()).trim(), 'Carry mastered');

  const mastered = await waitForStored(page, { attempts: 2, best: 70 });
  assert.equal(mastered.xp, 110, 'read XP is not repeated and only the improved quiz best is awarded');
  assert.equal(mastered.lessons.carry.read, true);
  assert.equal(mastered.lessons.carry.completed, true);
  assert.equal(mastered.lessons.carry.mastered, true);
  assert.equal(mastered.lessons.carry.quizBestCorrect, 4);
  assert.equal(mastered.lessons.carry.quizAttempts, 2);
  assert.equal(mastered.lessons.carry.quizBest, 70);
  assert.equal(mastered.lessons.carry.perfect, false);
  assert.deepEqual(mastered.legacyStoreField, LEGACY_STORE.legacyStoreField);
  assert.deepEqual(
    mastered.lessons.carry.legacyLessonField,
    LEGACY_STORE.lessons.carry.legacyLessonField
  );

  const beforeReload = await page.evaluate(key => localStorage.getItem(key), STORE_KEY);
  const beforeReloadState = JSON.parse(beforeReload);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#quizMount .q').first().waitFor();
  await page.waitForTimeout(250);
  const afterReload = await page.evaluate(key => localStorage.getItem(key), STORE_KEY);
  const afterReloadState = JSON.parse(afterReload);

  assert.equal(afterReload, beforeReload, 'opening the completed generic lesson must not submit again');
  assert.equal(afterReloadState.xp, beforeReloadState.xp);
  assert.equal(
    afterReloadState.lessons.carry.quizAttempts,
    beforeReloadState.lessons.carry.quizAttempts
  );
  assert.deepEqual(afterReloadState.badges, beforeReloadState.badges);
  assert.deepEqual(afterReloadState.unlocked, beforeReloadState.unlocked);
  assert.deepEqual(afterReloadState.legacyStoreField, LEGACY_STORE.legacyStoreField);
  assert.deepEqual(
    afterReloadState.lessons.carry.legacyLessonField,
    LEGACY_STORE.lessons.carry.legacyLessonField
  );
  assert.deepEqual(runtimeErrors, []);
});
