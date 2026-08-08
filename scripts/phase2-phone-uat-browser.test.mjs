import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdirSync, readFile } from 'node:fs';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require('../tools/node_modules/playwright-core');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WEBKIT = process.env.FG_ENGINE === 'webkit' || process.argv.includes('--project=webkit');
const ENGINE = WEBKIT ? 'webkit' : 'chromium';
const EVIDENCE_DIR = join(ROOT, 'outputs', 'flightglass-gates', 'phase2-phone-uat');
const PROFILES = Object.freeze([
  { viewport: { width: 375, height: 812 }, reducedMotion: 'no-preference', destination: 'Outcome' },
  { viewport: { width: 375, height: 812 }, reducedMotion: 'reduce', destination: 'Studio' },
  { viewport: { width: 430, height: 932 }, reducedMotion: 'no-preference', destination: 'Guide' },
  { viewport: { width: 430, height: 932 }, reducedMotion: 'reduce', destination: 'Outcome' },
]);

let server;
let browser;
let baseUrl;

function contentType(file) {
  return {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
  }[extname(file).toLowerCase()] || 'application/octet-stream';
}

function profileName({ viewport, reducedMotion }) {
  return `${viewport.width}x${viewport.height}--${reducedMotion === 'reduce' ? 'reduced' : 'normal'}`;
}

async function capture(page, name) {
  await page.screenshot({
    path: join(EVIDENCE_DIR, `${ENGINE}--${name}.png`),
    fullPage: false,
    animations: 'disabled',
  });
}

async function openFresh(profile) {
  const browserContext = await browser.newContext({
    viewport: profile.viewport,
    deviceScaleFactor: 1,
    reducedMotion: profile.reducedMotion,
  });
  const page = await browserContext.newPage();
  await page.addInitScript(() => {
    window.__phase2PhoneStorageWasFresh = localStorage.length === 0;
  });
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return { browserContext, page, errors };
}

async function currentStep(page) {
  return Number(await page.locator('#onboarding').getAttribute('data-current-step'));
}

async function finishOpening(page, reducedMotion) {
  const splash = page.locator('#saSplash');
  if (reducedMotion) {
    await splash.waitFor({ state: 'detached', timeout: 1000 });
    return;
  }

  await splash.waitFor({ state: 'visible' });
  // The opening intentionally moves and removes its own controls. Dispatch the
  // same click without Playwright waiting for CSS stability until the element
  // completes naturally and detaches.
  await page.locator('#saSplashSkip').dispatchEvent('click');
  await splash.waitFor({ state: 'detached' });
  assert.equal(await page.evaluate(() => sessionStorage.getItem('sa.opening.v1')), '1');
}

async function assertPhoneLayout(page) {
  const facts = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  assert.ok(facts.scrollWidth <= facts.clientWidth, 'phone viewport must not horizontally overflow');
}

async function assertDestination(page, destination) {
  if (destination === 'Outcome') {
    await page.waitForURL(/impact\.html$/);
    await page.waitForFunction(() => Boolean(window.__impact));
    assert.equal(await page.locator('body').getAttribute('data-sa-route'), 'range');
    return;
  }
  if (destination === 'Studio') {
    await page.waitForURL(/impact-studio\.html$/);
    assert.equal(await page.locator('body').getAttribute('data-sa-route'), 'studio');
    return;
  }
  await page.waitForURL(/jarvis\.html$/);
  assert.equal(await page.locator('body').getAttribute('data-sa-route'), 'jarvis');
  await page.locator('#guideBrowseTitle').waitFor();
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
      response.writeHead(200, { 'Content-Type': contentType(file), 'Cache-Control': 'no-store' });
      response.end(data);
    });
  });
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  browser = WEBKIT
    ? await webkit.launch({ headless: true })
    : await chromium.launch({ channel: 'msedge', headless: true })
      .catch(() => chromium.launch({ channel: 'chrome', headless: true }))
      .catch(() => chromium.launch({ headless: true }));
});

test.after(async () => {
  await browser?.close();
  await new Promise(resolveClose => server?.close(resolveClose));
});

for (const profile of PROFILES) {
  test(`${ENGINE}: fresh phone UAT completes and resumes all four steps on ${profileName(profile)}`, async () => {
    const { browserContext, page, errors } = await openFresh(profile);
    assert.equal(await page.evaluate(() => window.__phase2PhoneStorageWasFresh), true);
    await finishOpening(page, profile.reducedMotion === 'reduce');
    await page.locator('#onboarding[open]').waitFor();

    assert.equal(await currentStep(page), 1);
    await assertPhoneLayout(page);
    await capture(page, `${profileName(profile)}--step-1`);
    await page.locator('#beginOnboarding').click();

    assert.equal(await currentStep(page), 2);
    await page.locator('#onboardingLater').click();
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('#saSplash').waitFor({ state: 'detached' });
    assert.equal(await page.locator('#onboarding').getAttribute('open'), null);
    await page.locator('#startFirstShot').click();

    assert.equal(await currentStep(page), 2);
    await assertPhoneLayout(page);
    await capture(page, `${profileName(profile)}--step-2-resumed`);
    await page.locator('#continueTour').click();

    assert.equal(await currentStep(page), 3);
    await page.locator('#labLoftUp').click();
    assert.match(await page.locator('#labBackspin').textContent(), /^\d+ rpm$/);
    await assertPhoneLayout(page);
    await capture(page, `${profileName(profile)}--step-3`);
    await page.locator('#continueFromLab').click();

    assert.equal(await currentStep(page), 4);
    assert.deepEqual(
      await page.locator('.product-map__item strong').allTextContents(),
      ['Outcome', 'Studio', 'Guide'],
    );
    await assertPhoneLayout(page);
    await capture(page, `${profileName(profile)}--step-4`);
    if (profile.reducedMotion === 'reduce') {
      const running = await page.evaluate(() => document.getAnimations()
        .filter(animation => animation.playState === 'running').length);
      assert.equal(running, 0);
    }

    // Let the diagnostic screenshot's animation disabling settle before
    // starting a cross-document view transition.
    await page.waitForTimeout(350);
    await page.locator('.product-map__item', { hasText: profile.destination }).click();
    await assertDestination(page, profile.destination);
    // Chromium occasionally surfaces the browser-owned cross-document view
    // transition cancellation as an unhandled page error. The destination has
    // already loaded at this point; retain every product/runtime error.
    const applicationErrors = errors.filter(error => !error.includes('Transition was skipped'));
    assert.deepEqual(applicationErrors, []);
    await browserContext.close();
  });
}
