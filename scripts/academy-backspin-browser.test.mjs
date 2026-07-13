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
