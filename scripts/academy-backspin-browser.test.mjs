import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('../tools/node_modules/playwright-core');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
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
  return errors;
}

async function openFreshBackspinPage(viewport, { beforeGoto } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion:'reduce' });
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
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`);
  });
  page.on('requestfailed', request => {
    runtimeErrors.push(`requestfailed: ${request.url()} (${request.failure()?.errorText || 'unknown'})`);
  });

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
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`);
  });
  page.on('requestfailed', request => {
    runtimeErrors.push(`requestfailed: ${request.url()} (${request.failure()?.errorText || 'unknown'})`);
  });

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
