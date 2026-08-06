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
      .catch(() => chromium.launch({ channel: 'chrome', headless: true }));
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
} = {}) {
  const browserContext = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    reducedMotion,
  });
  const page = await browserContext.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  if (storedContext !== undefined) {
    await page.addInitScript(([key, value]) => {
      localStorage.setItem(key, value);
    }, [CONTEXT_KEY, JSON.stringify(storedContext)]);
  }
  await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return { browserContext, page, errors };
}

async function stored(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), CONTEXT_KEY);
}

async function currentStep(page) {
  return Number(await page.locator('#onboarding').getAttribute('data-current-step'));
}

async function checkChoice(page, name, value) {
  const input = page.locator(`input[name="${name}"][value="${value}"]`);
  await input.locator('..').click();
  assert.equal(await input.isChecked(), true);
}

async function capture(page, name) {
  await page.screenshot({
    path: join(EVIDENCE_DIR, `${ENGINE}--${name}.png`),
    fullPage: false,
    animations: 'disabled',
  });
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
    .map(item => item.id);
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

test(`${ENGINE}: cold launch resumes choices, returns an exact result, and hydrates Range`, async () => {
  const { browserContext, page, errors } = await open();
  await page.locator('#onboarding[open]').waitFor();
  assert.equal(await currentStep(page), 1);
  assert.equal(await page.locator('#onboardingProgress').textContent(), 'Step 1 of 4');
  await assertNoPreValueFriction(page);
  await capture(page, 'step-1--430x932');

  await page.locator('#beginOnboarding').click();
  assert.equal(await currentStep(page), 2);
  await checkChoice(page, 'goal', 'straighter');
  await checkChoice(page, 'handedness', 'right');
  await checkChoice(page, 'experience', 'improving');
  assert.equal((await stored(page)).onboarding.goal, 'straighter');
  await capture(page, 'step-2--430x932');

  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#onboarding[open]').waitFor();
  assert.equal(await currentStep(page), 2);
  assert.equal(await page.locator('input[name="goal"][value="straighter"]').isChecked(), true);
  await page.locator('#continueProfile').click();
  assert.equal(await currentStep(page), 3);

  for (const [name, value] of Object.entries(FIXTURE)) await checkChoice(page, name, value);
  assert.deepEqual((await stored(page)).onboarding.draftShot, FIXTURE);
  await capture(page, 'step-3--430x932');

  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#onboarding[open]').waitFor();
  assert.equal(await currentStep(page), 3);
  for (const [name, value] of Object.entries(FIXTURE)) {
    assert.equal(await page.locator(`input[name="${name}"][value="${value}"]`).isChecked(), true);
  }

  await page.locator('#showShot').click();
  assert.equal(await currentStep(page), 4);
  const resultContext = await stored(page);
  assert.equal(resultContext.currentShot.modelled, true);
  assert.equal(
    await page.locator('#resultCarry').textContent(),
    `${resultContext.currentShot.result.carryM.toFixed(1)} m`,
  );
  assert.equal(
    await page.locator('#resultFinish').textContent(),
    resultContext.currentShot.result.offlineM > 0
      ? `${resultContext.currentShot.result.offlineM.toFixed(1)} m right`
      : `${Math.abs(resultContext.currentShot.result.offlineM).toFixed(1)} m left`,
  );
  await assertNoPreValueFriction(page);
  await assertNoSeriousAxe(page);
  await capture(page, 'step-4--430x932');

  await page.locator('#finishOnboarding').click();
  assert.equal(await page.locator('#onboarding').getAttribute('open'), null);
  assert.equal(await page.locator('#homeReturning').isVisible(), true);
  await capture(page, 'home-returning--430x932');

  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('#onboarding').getAttribute('open'), null);
  assert.equal(await page.locator('#homeReturning').isVisible(), true);
  await page.locator('#tryExperiment').click();
  await page.waitForURL(/impact\.html\?guided=experiment/);
  await page.waitForFunction(() => document.body.dataset.saGuidedRange === 'experiment');

  const hydrated = await page.evaluate(() => ({
    faceAngle: window.__impact.state.face,
    clubPath: window.__impact.state.path,
    attackAngle: window.__impact.state.attack,
    dynamicLoft: window.__impact.state.dynLoft,
    clubSpeed: window.__impact.state.speed,
  }));
  const { clubPath, faceAngle, attackAngle, dynamicLoft, clubSpeed } = resultContext.lastExperiment.inputs;
  assert.deepEqual(hydrated, { clubPath, faceAngle, attackAngle, dynamicLoft, clubSpeed });
  assert.deepEqual(errors, []);
  await browserContext.close();
});

test(`${ENGINE}: Not now preserves and resumes every onboarding step`, async () => {
  const { browserContext, page, errors } = await open({ viewport: { width: 375, height: 812 } });
  await page.locator('#onboarding[open]').waitFor();

  for (const step of [1, 2, 3]) {
    assert.equal(await currentStep(page), step);
    await capture(page, `step-${step}--375x812`);
    const layout = await layoutFacts(page);
    assert.ok(layout.scrollWidth <= layout.clientWidth);
    assert.deepEqual(layout.smallTargets, []);
    if (step === 2) {
      const skipChoiceOverlaps = await page.evaluate(() => {
        const overlaps = (first, second) => (
          first.left < second.right && first.right > second.left
          && first.top < second.bottom && first.bottom > second.top
        );
        return [...document.querySelectorAll('[data-context-field]')]
          .filter(fieldset => {
            const skip = fieldset.querySelector('.skip-answer').getBoundingClientRect();
            return [...fieldset.querySelectorAll('.choice-grid label')]
              .some(label => overlaps(skip, label.getBoundingClientRect()));
          }).length;
      });
      assert.equal(skipChoiceOverlaps, 0);
    }
    await page.locator('#onboardingLater').click();
    assert.equal(await page.locator('#onboarding').getAttribute('open'), null);
    if (step === 1) await capture(page, 'home-empty--375x812');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#onboarding').getAttribute('open'), null);
    await page.locator('#startFirstShot').click();
    assert.equal(await currentStep(page), step);
    await page.locator(step === 1 ? '#beginOnboarding' : step === 2 ? '#continueProfile' : '#useNeutralShot').click();
  }

  assert.equal(await currentStep(page), 4);
  await assertOnboardingAnchored(page);
  await capture(page, 'step-4--375x812');
  await page.locator('#onboardingLater').click();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('#onboarding').getAttribute('open'), null);
  assert.equal(await page.locator('#homeReturning').isVisible(), true);
  assert.equal(await page.locator('#resumeReturningSetup').isVisible(), true);
  await page.locator('#resumeReturningSetup').click();
  assert.equal(await currentStep(page), 4);
  assert.deepEqual(errors, []);
  await browserContext.close();
});

test(`${ENGINE}: onboarding is keyboard reachable and keeps focus in the modal task`, async () => {
  const { browserContext, page, errors } = await open({ viewport: { width: 375, height: 812 } });
  await page.locator('#onboarding[open]').waitFor();
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
