import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONTEXT_KEY,
  buildGuidedShot,
  createDefaultContext,
} from '../sa-v1-context.js';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require('../tools/node_modules/playwright-core');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WEBKIT = process.env.FG_ENGINE === 'webkit' || process.argv.includes('--project=webkit');
const ENGINE = WEBKIT ? 'webkit' : 'chromium';
const INTENTS = ['compare-model', 'explore-topic', 'saved-setup'];
const TOPICS = ['conditions', 'direction', 'distance', 'impact', 'launch-spin', 'model-limits'];
const LAB_INPUTS = ['attack', 'dynLoft', 'face', 'path', 'speed'];

let server;
let browser;
let baseUrl;

function contentType(file) {
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.woff2': 'font/woff2',
  }[extname(file).toLowerCase()] || 'application/octet-stream';
}

test.before(async () => {
  server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const file = resolve(ROOT, pathname === '/' ? 'jarvis.html' : pathname.replace(/^\/+/, ''));
    const prefix = `${ROOT}${sep}`.toLowerCase();
    if (file.toLowerCase() !== ROOT.toLowerCase()
        && !`${file}${sep}`.toLowerCase().startsWith(prefix)) {
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
        'Cache-Control': 'no-store',
      });
      response.end(data);
    });
  });
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  if (WEBKIT) browser = await webkit.launch({ headless: true });
  else {
    browser = await chromium.launch({ channel: 'msedge', headless: true })
      .catch(() => chromium.launch({ channel: 'chrome', headless: true }))
      .catch(() => chromium.launch({ headless: true }));
  }
});

test.after(async () => {
  await browser?.close();
  await new Promise(resolveClose => server?.close(resolveClose));
});

async function open({
  path = '/jarvis.html',
  viewport = { width: 390, height: 844 },
  reducedMotion = 'no-preference',
  persistedContext = null,
  persistedRaw = null,
} = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion });
  const page = await context.newPage();
  if (persistedRaw !== null) {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
      key: CONTEXT_KEY,
      value: persistedRaw,
    });
  } else if (persistedContext) {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
      key: CONTEXT_KEY,
      value: JSON.stringify(persistedContext),
    });
  }
  page.setDefaultTimeout(3_000);
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') {
      const location = message.location();
      errors.push(`console: ${message.text()} @ ${location.url || 'unknown'}`);
    }
  });
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`response ${response.status()}: ${response.url()}`);
  });
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return { context, page, errors };
}

async function values(page, selector, attribute) {
  return page.locator(selector).evaluateAll(
    (nodes, name) => nodes.map(node => node.getAttribute(name)).sort(),
    attribute,
  );
}

async function assertBrowse(page) {
  assert.equal(await page.locator('body').getAttribute('data-sa-route'), 'jarvis');
  assert.equal(await page.locator('body').getAttribute('data-guide-view'), 'browse');
  assert.equal(await page.getByRole('heading', { name: 'Flightglass Guide', exact: true }).count(), 1);
  assert.equal(await page.locator('[data-guide-panel="browse"]').isVisible(), true);
  assert.equal(await page.locator('[data-guide-panel="answer"]').isHidden(), true);
  assert.equal(await page.locator('[data-guide-panel="lab"]').isHidden(), true);
  assert.deepEqual(await values(page, '[data-guide-intent]', 'data-guide-intent'), INTENTS);
  assert.deepEqual(await values(page, '[data-guide-topic]', 'data-guide-topic'), TOPICS);
  assert.equal(await page.locator('[data-guide-intent]:visible').count(), 3);
  assert.equal(await page.locator('[data-guide-topic]:visible').count(), 6);
  assert.equal(await page.locator('#guideStatus[role="status"][aria-live="polite"]').count(), 1);
}

async function layoutFacts(page) {
  return page.evaluate(() => {
    const visible = [...document.querySelectorAll(
      'button, a[href], input[type="range"], [role="button"], [role="slider"]',
    )].filter(element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden'
        && rect.width > 0 && rect.height > 0;
    });
    return {
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      smallTargets: visible.map(element => {
        const rect = element.getBoundingClientRect();
        return {
          name: element.getAttribute('aria-label') || element.textContent.trim(),
          width: Math.round(rect.width * 10) / 10,
          height: Math.round(rect.height * 10) / 10,
        };
      }).filter(({ width, height }) => width < 44 || height < 44),
      outsideX: visible.map(element => {
        const rect = element.getBoundingClientRect();
        return {
          name: element.getAttribute('aria-label') || element.textContent.trim(),
          left: rect.left,
          right: rect.right,
        };
      }).filter(({ left, right }) => left < -1 || right > innerWidth + 1),
    };
  });
}

async function assertNoTextEntry(page) {
  assert.equal(await page.locator(
    'input:not([type="range"]):not([type="hidden"]), textarea, '
      + '[contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]',
  ).count(), 0);
}

async function chooseDirectionQuestion(page) {
  await page.locator('[data-guide-topic="direction"]').click();
  await page.locator('[data-question-id="curve-right"]').click();
  await page.locator('[data-guide-panel="answer"]:visible').waitFor();
}

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`${ENGINE}: Guide browse renders without entry fields or overflow at ${viewport.width}x${viewport.height}`, async () => {
    const { context, page, errors } = await open({ viewport });
    await assertBrowse(page);
    await assertNoTextEntry(page);
    const layout = await layoutFacts(page);
    assert.ok(layout.overflowX <= 1, `horizontal overflow: ${layout.overflowX}px`);
    assert.deepEqual(layout.outsideX, []);
    assert.deepEqual(layout.smallTargets, []);
    assert.deepEqual(errors, []);
    await context.close();
  });
}

test(`${ENGINE}: a guided answer opens and participates in browser back and forward history`, async () => {
  const { context, page, errors } = await open();
  await chooseDirectionQuestion(page);

  const selected = new URL(page.url());
  assert.equal(selected.searchParams.get('topic'), 'direction');
  assert.equal(selected.searchParams.get('question'), 'curve-right');
  assert.equal(await page.locator('body').getAttribute('data-guide-view'), 'answer');
  assert.ok(await page.locator('[data-guide-panel="answer"]').innerText().then(text => text.trim().length > 40));
  assert.ok(await page.locator('[data-truth-tier]:visible').count() >= 1);
  assert.ok((await page.locator('#guideStatus').innerText()).trim().length > 0);

  await page.goBack();
  await page.waitForFunction(() => new URL(location.href).searchParams.get('question') === null);
  assert.equal(await page.locator('[data-guide-panel="browse"]').isVisible(), true);

  await page.goForward();
  await page.waitForFunction(() => new URL(location.href).searchParams.get('question') === 'curve-right');
  assert.equal(await page.locator('[data-guide-panel="answer"]').isVisible(), true);
  assert.deepEqual(errors, []);
  await context.close();
});

test(`${ENGINE}: a valid topic and question deep link opens the deterministic answer`, async () => {
  const { context, page, errors } = await open({
    path: '/jarvis.html?topic=direction&question=curve-right',
  });
  await page.locator('[data-guide-panel="answer"]:visible').waitFor();
  assert.equal(await page.locator('body').getAttribute('data-guide-view'), 'answer');
  assert.equal(await page.locator('[data-question-id="curve-right"]').getAttribute('aria-pressed'), 'true');
  assert.ok(await page.locator('[data-truth-tier]:visible').count() >= 1);
  assert.deepEqual(errors, []);
  await context.close();
});

test(`${ENGINE}: invalid deep links fail safely to browse`, async () => {
  const { context, page, errors } = await open({
    path: '/jarvis.html?topic=not-a-topic&question=not-a-question',
  });
  await assertBrowse(page);
  assert.equal(await page.locator('[data-question-id][aria-pressed="true"]').count(), 0);
  assert.doesNotMatch(await page.locator('body').innerText(), /not-a-topic|not-a-question/i);
  assert.deepEqual(errors, []);
  await context.close();
});

test(`${ENGINE}: corrupt saved context falls back to an illustrative answer`, async () => {
  const { context, page, errors } = await open({
    path: '/jarvis.html?topic=direction&question=curve-right',
    persistedRaw: '{broken-context',
  });
  await page.locator('[data-guide-panel="answer"]:visible').waitFor();
  assert.equal((await page.locator('#guideSource').innerText()).trim(), 'Illustrative model');
  assert.equal(await page.locator('[data-model-gap="answer-now"]:visible').count(), 1);
  assert.deepEqual(errors, []);
  await context.close();
});

test(`${ENGINE}: the live lab keeps five inputs visible while one slider changes the outcome`, async () => {
  const { context, page, errors } = await open({
    path: '/jarvis.html?topic=direction&question=curve-right',
  });
  await page.locator('[data-guide-panel="answer"]:visible').waitFor();
  await page.locator('[data-open-lab]').click();
  await page.locator('[data-guide-panel="lab"]:visible').waitFor();

  assert.equal(await page.locator('body').getAttribute('data-guide-view'), 'lab');
  assert.deepEqual(await values(page, '[data-lab-param]', 'data-lab-param'), LAB_INPUTS);
  assert.equal(await page.locator('[data-lab-param] [data-lab-value]:visible').count(), 5);
  assert.equal(await page.locator('input[type="range"][data-lab-slider]:visible').count(), 1);
  assert.equal(await page.locator('#guideLabReset').isVisible(), true);
  assert.match(await page.locator('#guideOpenRange').getAttribute('href'), /impact\.html/);

  const slider = page.locator('input[type="range"][data-lab-slider]:visible');
  const initialValue = await slider.inputValue();
  const before = await page.locator('[data-lab-outcome]:visible').allTextContents();
  const range = await slider.evaluate(element => ({
    min: Number(element.min),
    max: Number(element.max),
    step: Number(element.step || 1),
    value: Number(element.value),
  }));
  const nextValue = range.value + range.step <= range.max
    ? range.value + range.step
    : range.value - range.step;
  await slider.fill(String(nextValue));
  await page.waitForFunction(previous => {
    const current = [...document.querySelectorAll('[data-lab-outcome]')]
      .filter(element => getComputedStyle(element).display !== 'none')
      .map(element => element.textContent);
    return JSON.stringify(current) !== JSON.stringify(previous);
  }, before);
  assert.notDeepEqual(await page.locator('[data-lab-outcome]:visible').allTextContents(), before);

  await page.locator('#guideLabReset').click();
  assert.equal(await page.locator('input[type="range"][data-lab-slider]:visible').inputValue(), initialValue);
  const layout = await layoutFacts(page);
  assert.ok(layout.overflowX <= 1);
  assert.deepEqual(layout.outsideX, []);
  assert.deepEqual(layout.smallTargets, []);
  await assertNoTextEntry(page);
  assert.deepEqual(errors, []);
  await context.close();
});

test(`${ENGINE}: bounded model gaps are explicit`, async () => {
  const { context, page, errors } = await open({
    path: '/jarvis.html?topic=model-limits&question=gear-effect',
  });
  await page.locator('[data-guide-panel="answer"]:visible').waitFor();
  assert.equal(await page.locator('[data-model-gap]:visible').count(), 1);
  assert.ok((await page.locator('[data-model-gap]:visible').innerText()).trim().length >= 12);
  assert.deepEqual(errors, []);
  await context.close();
});

test(`${ENGINE}: a saved Guide comparison hands exactly one selected input to Range`, async () => {
  const shot = buildGuidedShot(
    { club: '7iron', start: 'right', curve: 'right', flight: 'neutral' },
    Date.parse('2026-08-07T03:00:00.000Z'),
  );
  const persistedContext = { ...createDefaultContext(), currentShot: shot };
  const { context, page, errors } = await open({
    path: '/jarvis.html?topic=launch-spin&question=backspin',
    persistedContext,
  });
  await page.locator('[data-guide-panel="answer"]:visible').waitFor();
  await page.locator('[data-open-lab]').click();
  await page.locator('[data-lab-param="attack"]').click();
  const slider = page.locator('input[data-lab-slider]:visible');
  const before = Number(await slider.inputValue());
  await slider.fill(String(before + .5));

  assert.match(await page.locator('#guideOpenRange').getAttribute('href'), /impact\.html\?guided=experiment/);
  const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), CONTEXT_KEY);
  assert.equal(stored.lastExperiment.changeKey, 'attackAngle');
  assert.equal(stored.lastExperiment.inputs.attackAngle, before + .5);
  assert.equal(stored.lastExperiment.inputs.faceAngle, shot.inputs.faceAngle);
  assert.equal(stored.lastExperiment.inputs.clubPath, shot.inputs.clubPath);
  assert.equal(stored.lastExperiment.inputs.dynamicLoft, shot.inputs.dynamicLoft);
  assert.equal(stored.lastExperiment.inputs.clubSpeed, shot.inputs.clubSpeed);
  assert.deepEqual(errors, []);
  await context.close();
});

test(`${ENGINE}: shared Studio navigation preserves the saved Guide setup`, async () => {
  const shot = buildGuidedShot(
    { club: '7iron', start: 'left', curve: 'left', flight: 'neutral' },
    Date.parse('2026-08-07T03:05:00.000Z'),
  );
  const persistedContext = { ...createDefaultContext(), currentShot: shot };
  const { context, page, errors } = await open({
    path: '/jarvis.html?topic=impact&question=attack-angle',
    viewport: { width: 844, height: 390 },
    persistedContext,
  });
  await page.locator('[data-guide-panel="answer"]:visible').waitFor();
  await page.locator('[data-sa-route-link="studio"]').click();
  await page.waitForURL(/impact-studio\.html$/);
  const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), CONTEXT_KEY);
  assert.equal(stored.currentShot.id, shot.id);
  assert.deepEqual(stored.currentShot.inputs, shot.inputs);
  assert.deepEqual(errors, []);
  await context.close();
});

test(`${ENGINE}: reduced motion preserves the Guide state without running animation`, async () => {
  const { context, page, errors } = await open({ reducedMotion: 'reduce' });
  await assertBrowse(page);
  assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
  await page.waitForTimeout(100);
  assert.equal(
    await page.evaluate(() => document.getAnimations()
      .filter(animation => animation.playState === 'running').length),
    0,
  );
  assert.deepEqual(errors, []);
  await context.close();
});
