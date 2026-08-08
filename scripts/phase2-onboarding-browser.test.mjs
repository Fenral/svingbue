import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdirSync, readFile, readFileSync } from 'node:fs';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CONTEXT_KEY,
  buildGuidedShot,
  createDefaultContext,
  deriveNextExperiment,
} from '../sa-v1-context.js';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require('../tools/node_modules/playwright-core');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const AXE_SOURCE = readFileSync(resolve(ROOT, 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
const WEBKIT = process.env.FG_ENGINE === 'webkit' || process.argv.includes('--project=webkit');
const ENGINE = WEBKIT ? 'webkit' : 'chromium';
const FIXTURE = Object.freeze({ club: '7iron', start: 'right', curve: 'right', flight: 'neutral' });
const EVIDENCE_DIR = join(ROOT, 'outputs', 'flightglass-gates', 'phase2-browser');
const CONTROLLED_CLOCK_START_MS = Date.UTC(2026, 0, 1, 12);

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
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const file = resolve(ROOT, relative);
    const prefix = `${ROOT}${sep}`.toLowerCase();
    if (file.toLowerCase() !== ROOT.toLowerCase()
        && !`${file}${sep}`.toLowerCase().startsWith(prefix)) {
      response.writeHead(403).end();
      return;
    }
    readFile(file, (error, data) => {
      if (error) {
        response.writeHead(404).end();
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
  viewport = { width: 430, height: 932 },
  storedContext,
  reducedMotion = 'no-preference',
  skipSplash = true,
  localStorageThrows = false,
  controlSplashClock = false,
} = {}) {
  const browserContext = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    reducedMotion,
  });
  const page = await browserContext.newPage();
  if (controlSplashClock) {
    await page.clock.install({ time: CONTROLLED_CLOCK_START_MS });
    await page.clock.pauseAt(CONTROLLED_CLOCK_START_MS + 1_000);
  }
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  if (localStorageThrows) {
    await page.addInitScript(() => {
      const calls = { getItem: 0, setItem: 0, removeItem: 0 };
      const blockedStorage = Object.freeze({
        getItem() {
          calls.getItem += 1;
          throw new DOMException('Local storage is unavailable', 'SecurityError');
        },
        setItem() {
          calls.setItem += 1;
          throw new DOMException('Local storage is unavailable', 'SecurityError');
        },
        removeItem() {
          calls.removeItem += 1;
          throw new DOMException('Local storage is unavailable', 'SecurityError');
        },
      });
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        value: blockedStorage,
      });
      Object.defineProperty(window, '__blockedStorageCalls', {
        configurable: false,
        value: calls,
      });
    });
  }
  if (storedContext !== undefined) {
    await page.addInitScript(([key, value]) => {
      localStorage.setItem(key, value);
    }, [CONTEXT_KEY, JSON.stringify(storedContext)]);
  }
  await page.goto(`${baseUrl}/index.html`, {
    waitUntil: controlSplashClock ? 'commit' : 'networkidle',
  });
  if (skipSplash) await finishSplash(page);
  if (!controlSplashClock) await page.evaluate(() => document.fonts.ready);
  return { browserContext, page, errors };
}

async function finishSplash(page, { keyboard = false, clockAdvanceMs = 0 } = {}) {
  const splash = page.locator('#saSplash');
  if (keyboard) {
    await splash.waitFor({ state: 'visible' });
    assert.equal(
      await page.locator('#saSplashSkip').evaluate(element => element === document.activeElement),
      true,
    );
    await page.keyboard.press('Enter');
  } else {
    const skipped = await page.evaluate(() => {
      const currentSplash = document.getElementById('saSplash');
      const skip = document.getElementById('saSplashSkip');
      if (!currentSplash || !skip) return false;
      skip.click();
      return true;
    });
    if (!skipped) return false;
  }
  if (clockAdvanceMs) await page.clock.runFor(clockAdvanceMs);
  await splash.waitFor({ state: 'detached' });
  return true;
}

async function stored(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), CONTEXT_KEY);
}

async function currentStep(page) {
  return Number(await page.locator('#onboarding').getAttribute('data-current-step'));
}

async function capture(page, name) {
  await page.screenshot({
    path: join(EVIDENCE_DIR, `${ENGINE}--${name}.png`),
    fullPage: false,
    animations: 'disabled',
  });
}

async function settleStepEntry(page, step, timeoutMs = 1_000) {
  const section = page.locator(`[data-onboarding-step="${step}"]:not([hidden])`);
  await section.evaluate((element, timeout) => new Promise((resolveEntry, rejectEntry) => {
    const timeoutId = setTimeout(
      () => rejectEntry(new Error(`Onboarding step ${element.dataset.onboardingStep} did not settle within ${timeout} ms.`)),
      timeout,
    );
    requestAnimationFrame(() => requestAnimationFrame(() => {
      Promise.allSettled(element.getAnimations().map(animation => animation.finished))
        .then(() => {
          clearTimeout(timeoutId);
          resolveEntry();
        });
    }));
  }), timeoutMs);
}

async function assertNoPreValueFriction(page) {
  const text = await page.locator('body').innerText();
  assert.doesNotMatch(text, /sign[ -]?in|create account|enable notifications|upgrade to pro|choose a plan/i);
}

async function assertNoSeriousAxe(page) {
  await page.addScriptTag({ content: AXE_SOURCE });
  const result = await page.evaluate(() => axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  }));
  const serious = result.violations
    .filter(item => ['critical', 'serious'].includes(item.impact))
    .map(item => ({
      id: item.id,
      nodes: item.nodes.map(node => ({
        target: node.target,
        summary: node.failureSummary,
      })),
    }));
  assert.deepEqual(serious, []);
}

async function layoutFacts(page) {
  return page.evaluate(() => {
    const visible = [...document.querySelectorAll('button, a, input')]
      .filter(element => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== 'hidden' && style.display !== 'none'
          && rect.width > 0 && rect.height > 0;
      });
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      smallTargets: visible
        .map(element => {
          const rect = element.getBoundingClientRect();
          return {
            label: element.getAttribute('aria-label') || element.textContent.trim() || element.name,
            width: rect.width,
            height: rect.height,
          };
        })
        .filter(({ width, height }) => width < 44 || height < 44),
    };
  });
}

async function assertOnboardingAnchored(page) {
  const position = await page.locator('#onboarding').evaluate(dialog => {
    const dialogRect = dialog.getBoundingClientRect();
    const topBarRect = dialog.querySelector('.onboarding-top').getBoundingClientRect();
    return {
      dialogTop: dialogRect.top,
      dialogBottom: dialogRect.bottom,
      topBarTop: topBarRect.top,
    };
  });
  assert.equal(position.dialogTop, 0);
  assert.equal(position.dialogBottom, await page.evaluate(() => innerHeight));
  assert.ok(position.topBarTop >= 0);
}

test(`${ENGINE}: cold opening is keyboard-skippable, hands focus to onboarding, and does not replay in one app session`, async () => {
  const { browserContext, page, errors } = await open({
    viewport: { width: 390, height: 844 },
    skipSplash: false,
    controlSplashClock: true,
  });
  await page.locator('#saSplash[open].is-running').waitFor();
  await page.clock.runFor(20);
  assert.equal(await page.locator('#saSplash').count(), 1);
  assert.equal(await page.locator('#onboarding').getAttribute('open'), null);
  assert.equal(await page.locator('#saSplashSkip').getAttribute('aria-label'), 'Skip opening animation');
  const skipRect = await page.locator('#saSplashSkip').boundingBox();
  assert.ok(skipRect.width >= 44 && skipRect.height >= 44);
  await page.evaluate(() => document.fonts.ready);
  await capture(page, 'opening--390x844');
  await finishSplash(page, { keyboard: true, clockAdvanceMs: 200 });
  await page.locator('#onboarding[open]').waitFor();
  assert.equal(await currentStep(page), 1);
  await page.waitForFunction(() => document.activeElement?.id === 'stepOneTitle');
  assert.equal(await page.evaluate(() => sessionStorage.getItem('sa.opening.v1')), '1');

  await page.reload({ waitUntil: 'networkidle' });
  await page.clock.runFor(20);
  await page.locator('#saSplash').waitFor({ state: 'detached' });
  await page.locator('#onboarding[open]').waitFor();
  assert.equal(await page.locator('#saSplash').count(), 0);
  assert.equal(await currentStep(page), 1);
  assert.deepEqual(errors, []);
  await browserContext.close();
});

test(`${ENGINE}: reduced-motion opening reaches the same returning Home without running animation`, async () => {
  const shot = buildGuidedShot(FIXTURE, Date.parse('2026-08-06T12:00:00.000Z'));
  const storedContext = {
    ...createDefaultContext(),
    onboarding: {
      ...createDefaultContext().onboarding,
      complete: true,
      step: 4,
      dismissed: true,
      draftShot: { ...FIXTURE },
    },
    currentShot: shot,
    lastExperiment: deriveNextExperiment(shot),
  };
  const { browserContext, page, errors } = await open({
    storedContext,
    reducedMotion: 'reduce',
    skipSplash: false,
  });
  await page.locator('#saSplash').waitFor({ state: 'detached', timeout: 750 });
  assert.equal(await page.locator('#onboarding').getAttribute('open'), null);
  assert.equal(await page.locator('#homeReturning').isVisible(), true);
  await page.waitForFunction(() => document.activeElement?.id === 'homeMain');
  assert.equal(await page.locator('#homeMain').evaluate(element => element === document.activeElement), true);
  const running = await page.evaluate(() => document.getAnimations()
    .filter(animation => animation.playState === 'running').length);
  assert.equal(running, 0);
  assert.deepEqual(errors, []);
  await browserContext.close();
});

for (const viewport of [{ width: 390, height: 844 }, { width: 390, height: 700 }]) {
  test(`${ENGINE}: Outcome proof keeps every outcome row at ${viewport.width}×${viewport.height}`, async () => {
    const { browserContext, page, errors } = await open({ viewport });
    await page.locator('#onboarding[open]').waitFor();
    const crop = await page.locator('.product-proof--outcome').evaluate(figure => {
      const viewportElement = figure.querySelector('.product-proof__viewport');
      const image = figure.querySelector('img');
      const viewportRect = viewportElement.getBoundingClientRect();
      const scale = Math.max(
        viewportRect.width / image.naturalWidth,
        viewportRect.height / image.naturalHeight,
      );
      const visibleSourceHeight = viewportRect.height / scale;
      const yPercent = Number.parseFloat(getComputedStyle(image).objectPosition.split(/\s+/).at(-1)) / 100;
      const sourceTop = (image.naturalHeight - visibleSourceHeight) * yPercent;
      return {
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        sourceTop,
        sourceBottom: sourceTop + visibleSourceHeight,
      };
    });
    assert.equal(crop.naturalWidth, 750);
    assert.equal(crop.naturalHeight, 1624);
    // DPR2 source boundaries in the canonical 375×812 capture: Outcome starts
    // at y=148 and ends at y=630; the input deck does not start until y=988.
    assert.ok(crop.sourceTop <= 148, `Outcome heading clipped: ${JSON.stringify(crop)}`);
    assert.ok(crop.sourceBottom >= 630, `Distance outcomes clipped: ${JSON.stringify(crop)}`);
    assert.ok(crop.sourceBottom < 988, `Input panel steals proof focus: ${JSON.stringify(crop)}`);
    assert.deepEqual(errors, []);
    await browserContext.close();
  });
}

test(`${ENGINE}: learning tour uses real product proof, a live engine lab, and no personal setup`, async () => {
  const { browserContext, page, errors } = await open();
  await page.locator('#onboarding[open]').waitFor();
  assert.equal(await currentStep(page), 1);
  assert.equal(await page.locator('#onboardingProgress').textContent(), 'Step 1 of 4');
  await assertNoPreValueFriction(page);
  assert.equal(await page.locator('#onboarding input[type="radio"]').count(), 0);
  assert.equal(await page.locator('.onboarding-lab__outcomes[aria-live]').count(), 0);
  assert.equal(await page.locator('.onboarding-lab__status').textContent(), 'Modelled');
  assert.deepEqual(
    await page.locator('.onboarding-lab__outcomes dt small').allTextContents(),
    ['Estimate', 'Geometry', 'Calculated'],
  );
  assert.equal(await page.locator('.product-proof--outcome img').evaluate(image => image.naturalWidth > 0), true);
  await capture(page, 'step-1--430x932');

  await page.locator('#beginOnboarding').click();
  assert.equal(await currentStep(page), 2);
  await page.waitForFunction(() => document.querySelector('.product-proof--studio img')?.naturalWidth > 0);
  assert.equal(await page.locator('.product-proof--studio img').evaluate(image => image.naturalWidth > 0), true);
  await capture(page, 'step-2--430x932');

  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#onboarding[open]').waitFor();
  assert.equal(await currentStep(page), 2);
  await page.locator('#continueTour').click();
  assert.equal(await currentStep(page), 3);

  const before = await page.locator('.onboarding-lab__outcomes').innerText();
  await page.locator('#onboardingLoft').evaluate(input => {
    input.value = '30';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  assert.equal(await page.locator('#labLoftValue').textContent(), '30.0°');
  assert.notEqual(await page.locator('.onboarding-lab__outcomes').innerText(), before);
  assert.match(await page.locator('#labBackspin').textContent(), /^\d+ rpm$/);
  assert.equal((await stored(page)).currentShot, null);
  await page.locator('#onboardingBack').click();
  assert.equal(await currentStep(page), 2);
  await page.locator('#continueTour').click();
  assert.equal(await currentStep(page), 3);
  assert.equal(await page.locator('#onboardingLoft').inputValue(), '30');
  assert.equal((await stored(page)).onboarding.labLoft, 30);
  await capture(page, 'step-3--430x932');

  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#onboarding[open]').waitFor();
  assert.equal(await currentStep(page), 3);
  assert.equal(await page.locator('#onboardingLoft').inputValue(), '30');
  assert.equal(await page.locator('#labLaunch').textContent(), '16.9°');
  assert.equal(await page.locator('#labSpinLoft').textContent(), '27.1°');
  assert.equal(await page.locator('#labBackspin').textContent(), '4593 rpm');
  await page.locator('#labLoftUp').click();
  assert.equal(await page.locator('#onboardingLoft').inputValue(), '31');
  await page.locator('#continueFromLab').click();
  assert.equal(await currentStep(page), 4);
  await settleStepEntry(page, 4);
  assert.deepEqual(
    await page.locator('.product-map__item strong').allTextContents(),
    ['Outcome', 'Studio', 'Guide'],
  );
  assert.equal((await stored(page)).currentShot, null);
  await assertNoPreValueFriction(page);
  await assertNoSeriousAxe(page);
  await capture(page, 'step-4--430x932');

  await page.locator('#finishOnboarding').click();
  assert.equal(await page.locator('#onboarding').getAttribute('open'), null);
  assert.equal(await page.locator('#homeEmpty').isVisible(), true);
  assert.equal(await page.locator('#startFirstShot').textContent(), 'Open live Outcome');
  await capture(page, 'home-learning--430x932');

  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('#onboarding').getAttribute('open'), null);
  assert.equal(await page.locator('#homeEmpty').isVisible(), true);
  await page.locator('#startFirstShot').click();
  await page.waitForURL(/impact\.html$/);
  await page.waitForFunction(() => Boolean(window.__impact));
  assert.deepEqual(errors, []);
  await browserContext.close();
});

test(`${ENGINE}: onboarding remains usable with throwing localStorage and completes in volatile state`, async () => {
  const { browserContext, page, errors } = await open({
    viewport: { width: 390, height: 844 },
    localStorageThrows: true,
  });

  await page.locator('#onboarding[open]').waitFor();
  assert.equal(await currentStep(page), 1);
  assert.equal(await page.locator('#stepOneTitle').isVisible(), true);

  const storageErrors = await page.evaluate(() => {
    const calls = [
      () => localStorage.getItem('probe'),
      () => localStorage.setItem('probe', 'value'),
      () => localStorage.removeItem('probe'),
    ];
    return calls.map(call => {
      try {
        call();
        return null;
      } catch (error) {
        return error.name;
      }
    });
  });
  assert.deepEqual(storageErrors, ['SecurityError', 'SecurityError', 'SecurityError']);

  await page.locator('#beginOnboarding').click();
  assert.equal(await currentStep(page), 2);
  await page.locator('#continueTour').click();
  assert.equal(await currentStep(page), 3);
  await page.locator('#labLoftUp').click();
  assert.equal(await page.locator('#onboardingLoft').inputValue(), '25');
  await page.locator('#continueFromLab').click();
  assert.equal(await currentStep(page), 4);

  const beforeCompletion = await page.evaluate(() => window.__flightglassHome.getContext());
  assert.equal(beforeCompletion.onboarding.step, 4);
  assert.equal(beforeCompletion.onboarding.labLoft, 25);
  assert.equal(beforeCompletion.onboarding.complete, false);

  await page.locator('#finishOnboarding').click();
  assert.equal(await page.locator('#onboarding').getAttribute('open'), null);
  assert.equal(await page.locator('#homeEmpty').isVisible(), true);
  assert.equal(await page.locator('#startFirstShot').textContent(), 'Open live Outcome');

  const afterCompletion = await page.evaluate(() => ({
    context: window.__flightglassHome.getContext(),
    calls: { ...window.__blockedStorageCalls },
  }));
  assert.equal(afterCompletion.context.onboarding.complete, true);
  assert.equal(afterCompletion.context.onboarding.dismissed, true);
  assert.equal(afterCompletion.context.onboarding.step, 4);
  assert.equal(afterCompletion.context.onboarding.labLoft, 25);
  assert.ok(afterCompletion.calls.getItem > 0);
  assert.ok(afterCompletion.calls.setItem > 0);
  assert.ok(afterCompletion.calls.removeItem > 0);
  assert.deepEqual(errors, []);
  await browserContext.close();
});

test(`${ENGINE}: Not now preserves and resumes every learning-tour step`, async () => {
  const { browserContext, page, errors } = await open({ viewport: { width: 375, height: 812 } });
  await page.locator('#onboarding[open]').waitFor();

  const advance = new Map([
    [1, '#beginOnboarding'],
    [2, '#continueTour'],
    [3, '#continueFromLab'],
  ]);

  for (const step of [1, 2, 3, 4]) {
    assert.equal(await currentStep(page), step);
    await capture(page, `step-${step}--375x812`);
    const layout = await layoutFacts(page);
    assert.ok(layout.scrollWidth <= layout.clientWidth);
    assert.deepEqual(layout.smallTargets, []);
    await page.locator('#onboardingLater').click();
    assert.equal(await page.locator('#onboarding').getAttribute('open'), null);
    if (step === 1) await capture(page, 'home-empty--375x812');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#onboarding').getAttribute('open'), null);
    await page.locator('#startFirstShot').click();
    assert.equal(await currentStep(page), step);
    if (advance.has(step)) await page.locator(advance.get(step)).click();
  }

  assert.equal(await currentStep(page), 4);
  await assertOnboardingAnchored(page);
  await page.locator('#finishOnboarding').click();
  assert.equal(await page.locator('#homeEmpty').isVisible(), true);
  assert.equal((await stored(page)).currentShot, null);
  assert.equal((await stored(page)).onboarding.complete, true);
  assert.deepEqual(errors, []);
  await browserContext.close();
});

test(`${ENGINE}: onboarding is keyboard reachable and keeps focus in the modal task`, async () => {
  const { browserContext, page, errors } = await open({ viewport: { width: 375, height: 812 } });
  await page.locator('#onboarding[open]').waitFor();
  await page.waitForFunction(() => document.activeElement?.id === 'stepOneTitle');
  assert.equal(await page.locator('#stepOneTitle').evaluate(element => element === document.activeElement), true);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('#beginOnboarding').evaluate(element => element === document.activeElement), true);
  await page.keyboard.press('Enter');
  assert.equal(await currentStep(page), 2);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.querySelector('#onboarding').contains(document.activeElement)), true);
  assert.deepEqual(errors, []);
  await browserContext.close();
});

for (const viewport of [{ width: 375, height: 812 }, { width: 430, height: 932 }]) {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    test(`${ENGINE}: returning Home fits ${viewport.width}x${viewport.height} with ${reducedMotion} motion`, async () => {
      const shot = buildGuidedShot(FIXTURE, Date.parse('2026-08-06T12:00:00.000Z'));
      const storedContext = {
        ...createDefaultContext(),
        onboarding: {
          ...createDefaultContext().onboarding,
          complete: true,
          step: 4,
          dismissed: true,
          draftShot: { ...FIXTURE },
        },
        currentShot: shot,
        lastExperiment: deriveNextExperiment(shot),
      };
      const { browserContext, page, errors } = await open({ viewport, storedContext, reducedMotion });
      assert.equal(await page.locator('#onboarding').getAttribute('open'), null);
      assert.equal(await page.locator('#homeReturning').isVisible(), true);
      const displayType = await page.locator('#returningTitle').evaluate(element => ({
        family: getComputedStyle(element).fontFamily,
        weight: getComputedStyle(element).fontWeight,
        loaded: document.fonts.check('700 34px "Space Grotesk"'),
      }));
      assert.match(displayType.family, /Space Grotesk/i);
      assert.equal(displayType.weight, '700');
      assert.equal(displayType.loaded, true);
      const layout = await layoutFacts(page);
      assert.ok(layout.scrollWidth <= layout.clientWidth);
      assert.deepEqual(layout.smallTargets, []);
      if (reducedMotion === 'reduce') {
        const running = await page.evaluate(() => document.getAnimations()
          .filter(animation => animation.playState === 'running').length);
        assert.equal(running, 0);
      }
      await assertNoSeriousAxe(page);
      await capture(page, `home-returning--${viewport.width}x${viewport.height}--${reducedMotion}`);
      await page.locator('#tryExperiment').scrollIntoViewIfNeeded();
      const overlap = await page.evaluate(() => {
        const control = document.querySelector('#tryExperiment').getBoundingClientRect();
        const nav = document.querySelector('[data-sa-shell]').getBoundingClientRect();
        return control.bottom > nav.top && control.top < nav.bottom;
      });
      assert.equal(overlap, false, 'the primary Home action must clear the bottom navigation');
      assert.deepEqual(errors, []);
      await browserContext.close();
    });
  }
}
