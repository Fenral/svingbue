import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdirSync, readFile, readFileSync } from 'node:fs';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require('../tools/node_modules/playwright-core');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const AXE_SOURCE = readFileSync(resolve(ROOT, 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
const WEBKIT = process.env.FG_ENGINE === 'webkit' || process.argv.includes('--project=webkit');
const ENGINE = WEBKIT ? 'webkit' : 'chromium';
const EVIDENCE_DIR = join(ROOT, 'outputs', 'flightglass-gates', 'phase4-paywall');
const IAP_TEST_MODULE = `
export const ENTITLEMENT_ID = 'pro';
export const PRODUCT_IDS = Object.freeze({
  monthly: 'strikearc_pro_monthly',
  annual: 'strikearc_pro_annual',
  lifetime: 'strikearc_pro_lifetime',
});
export const PURCHASE_STATUS = Object.freeze({
  SUCCESS: 'success', CANCELLED: 'cancelled', PENDING: 'pending',
  ERROR: 'error', UNAVAILABLE: 'unavailable', NOT_FOUND: 'not-found',
});
let pro = false;
let offeringCallCount = 0;
export const init = async () => 'ready';
export const isNative = () => true;
export const isPro = () => pro;
export const getConfigurationStatus = () => 'ready';
export async function getOfferings() {
  const call = offeringCallCount++;
  const spec = window.__iapOfferingsSequence?.[call] || {};
  if (spec.delayMs) await new Promise(resolve => setTimeout(resolve, spec.delayMs));
  if (spec.reject) throw new Error('simulated offerings failure');
  const monthlyPrice = Object.hasOwn(spec, 'monthlyPrice') ? spec.monthlyPrice : 'kr 99';
  const annualPrice = Object.hasOwn(spec, 'annualPrice') ? spec.annualPrice : 'kr 590';
  const annualMonthlyPrice = Object.hasOwn(spec, 'annualMonthlyPrice') ? spec.annualMonthlyPrice : 'kr 49';
  return {
    monthly: monthlyPrice ? { product: { identifier: PRODUCT_IDS.monthly, priceString: monthlyPrice } } : null,
    annual: annualPrice ? { product: { identifier: PRODUCT_IDS.annual, priceString: annualPrice, pricePerMonthString: annualMonthlyPrice } } : null,
    lifetime: { product: { identifier: PRODUCT_IDS.lifetime, priceString: 'kr 1 490' } },
  };
}
export async function purchaseDetailed(tier) {
  if (!['monthly', 'annual'].includes(tier)) return { status: PURCHASE_STATUS.UNAVAILABLE };
  const mode = window.__iapMode;
  if (mode === 'delayed-success') {
    await new Promise(resolve => setTimeout(resolve, window.__iapDelayMs || 150));
    pro = true;
    return { status: PURCHASE_STATUS.SUCCESS };
  }
  if (mode === 'success') { pro = true; return { status: PURCHASE_STATUS.SUCCESS }; }
  if (mode === 'cancelled') return { status: PURCHASE_STATUS.CANCELLED };
  if (mode === 'pending') return { status: PURCHASE_STATUS.PENDING };
  if (mode === 'unavailable') return { status: PURCHASE_STATUS.UNAVAILABLE };
  return { status: PURCHASE_STATUS.ERROR };
}
export async function restoreDetailed() {
  const mode = window.__iapMode;
  if (mode === 'delayed-restore-success') {
    await new Promise(resolve => setTimeout(resolve, window.__iapDelayMs || 150));
    pro = true;
    return { status: PURCHASE_STATUS.SUCCESS };
  }
  if (mode === 'restore-success') { pro = true; return { status: PURCHASE_STATUS.SUCCESS }; }
  if (mode === 'restore-not-found') return { status: PURCHASE_STATUS.NOT_FOUND };
  if (mode === 'restore-unavailable') return { status: PURCHASE_STATUS.UNAVAILABLE };
  return { status: PURCHASE_STATUS.ERROR };
}
export const purchase = async tier => (await purchaseDetailed(tier)).status === PURCHASE_STATUS.SUCCESS;
export const restore = async () => (await restoreDetailed()).status === PURCHASE_STATUS.SUCCESS;
window.__sa = window.__sa || {};
window.__sa.iap = { init, isNative, isPro, getOfferings, purchase, purchaseDetailed, restore, restoreDetailed, getConfigurationStatus };
`;
let server;
let browser;
let baseUrl;

function contentType(file) {
  return {
    '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8', '.png': 'image/png',
    '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2',
  }[extname(file).toLowerCase()] || 'application/octet-stream';
}

async function open({
  viewport = { width: 375, height: 812 },
  reducedMotion = 'no-preference',
  route = 'impact.html?sa_debug=paywall',
  waitForPaywall = true,
  accessUsage = null,
  skipOpening = false,
  offeringsSequence = null,
} = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion });
  const page = await context.newPage();
  await page.addInitScript(({ accessUsage: usage, skipOpening: skip, offeringsSequence: offeringSpecs }) => {
    window.__iapMode = 'cancelled';
    window.__iapOfferingsSequence = offeringSpecs;
    if (skip) sessionStorage.setItem('sa.opening.v1', '1');
    if (usage) {
      const now = new Date();
      const pad = value => String(value).padStart(2, '0');
      const localDay = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const shots = usage.shots || 0;
      const experiments = usage.experiments || 0;
      const answers = usage.answers || 0;
      localStorage.setItem('sa.access.v1', JSON.stringify({
        version: 1,
        usage: {
          'instrument-shot': shots,
          'instrument-identifiers': usage.identities || Array.from({ length: shots }, (_, index) => `seed-shot-${index}`),
          'guided-experiment': experiments,
          'guide-answer': {
            localDay,
            count: answers,
            identifiers: Array.from({ length: answers }, (_, index) => `seed-question-${index}`),
          },
        },
        completedResults: shots + experiments + answers,
      }));
    }
    // Exercise native-only access policy while the dedicated HTTP server
    // supplies a test-only IAP module instead of mutating shipping source.
    window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios' };
    window.CapacitorCustomPlatform = { name: 'ios' };
  }, { accessUsage, skipOpening, offeringsSequence });
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message} @ ${page.url()}`));
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  await page.goto(`${baseUrl}/${route}`, { waitUntil: 'networkidle' });
  if (waitForPaywall) await page.locator('.sa-pw-scrim[open]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  return { context, page, errors };
}

async function reopen(page) {
  await page.evaluate(() => { void window.__sa.paywall.open('instrument-shot'); });
  await page.locator('.sa-pw-scrim[open]').waitFor();
}

async function capture(page, name) {
  await page.screenshot({ path: join(EVIDENCE_DIR, `${ENGINE}--${name}.png`), fullPage: false, animations: 'disabled' });
}

async function settleDocumentAnimations(page, timeoutMs = 1_500) {
  await page.evaluate(timeout => new Promise((resolveAnimations, rejectAnimations) => {
    const timeoutId = setTimeout(
      () => rejectAnimations(new Error(`Document animations did not settle within ${timeout} ms.`)),
      timeout,
    );
    new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame)))
      .then(() => Promise.allSettled(document.getAnimations().map(animation => animation.finished)))
      .then(() => {
        clearTimeout(timeoutId);
        resolveAnimations();
      });
  }), timeoutMs);
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
      nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary })),
    }));
  assert.deepEqual(serious, []);
}

async function layout(page) {
  await page.locator('.sa-pw-card').evaluate(async node => {
    await Promise.all(node.getAnimations().map(animation => animation.finished));
  });
  return page.evaluate(() => {
    // The native radio controls are intentionally 1×1 and sit inside a full-row
    // label. Audit the actual pointer target instead of the hidden input box.
    const visible = [...document.querySelectorAll('.sa-pw-scrim button, .sa-pw-scrim a, .sa-pw-scrim .sa-pw-plan')]
      .filter(node => { const r = node.getBoundingClientRect(), s = getComputedStyle(node); return r.width && r.height && s.display !== 'none'; });
    return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, small: visible
      .map(node => { const r = node.getBoundingClientRect(); return [node.textContent.trim() || node.getAttribute('aria-label'), r.width, r.height]; })
      .filter(([, width, height]) => width < 44 || height < 44) };
  });
}

test.before(async () => {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  server = createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    if (path === '/sa-iap.js') {
      response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(IAP_TEST_MODULE);
      return;
    }
    const file = resolve(ROOT, path === '/' ? 'impact.html' : path.replace(/^\/+/, ''));
    const prefix = `${ROOT}${sep}`.toLowerCase();
    if (file.toLowerCase() !== ROOT.toLowerCase() && !`${file}${sep}`.toLowerCase().startsWith(prefix)) return response.writeHead(403).end();
    readFile(file, (error, data) => error ? response.writeHead(404).end() : response.writeHead(200, { 'Content-Type': contentType(file), 'Cache-Control': 'no-store' }).end(data));
  });
  await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  browser = WEBKIT
    ? await webkit.launch({ headless: true })
    : await chromium.launch({ channel: 'msedge', headless: true })
      .catch(() => chromium.launch({ channel: 'chrome', headless: true }))
      .catch(() => chromium.launch({ headless: true }));
});
test.after(async () => { await browser?.close(); await new Promise(resolveClose => server?.close(resolveClose)); });

for (const viewport of [{ width: 375, height: 812 }, { width: 932, height: 430 }]) {
  test(`${ENGINE}: native paywall renders localized monthly and annual choices at ${viewport.width}x${viewport.height}`, async () => {
    const { context, page, errors } = await open({ viewport });
    assert.equal(await page.evaluate(() => window.Capacitor.isNativePlatform()), true);
    assert.equal(await page.locator('.sa-pw-plan').count(), 2);
    assert.equal(await page.locator('input[name="sa-pw-plan"]').count(), 2);
    const planText = await page.locator('.sa-pw-plan').allTextContents().then(items => items.join(' '));
    assert.match(planText, /Monthly[\s\S]*kr 99/i);
    assert.match(planText, /Annual[\s\S]*kr 49 per month[\s\S]*kr 590/i);
    assert.equal(await page.locator('.sa-pw-scrim').innerText().then(text => /lifetime/i.test(text)), false);
    assert.equal(await page.getByRole('dialog', { name: /keep comparing what you learn/i }).count(), 1);
    assert.equal(await page.getByRole('radio').count(), 2);
    assert.equal(await page.locator('.sa-pw-scrim').getByRole('status').count(), 1);
    const facts = await layout(page);
    assert.ok(facts.overflow <= 1); assert.deepEqual(facts.small, []);
    if (viewport.width === 375) await assertNoSeriousAxe(page);
    await capture(page, `${viewport.width}x${viewport.height}--native`);
    assert.deepEqual(errors, []); await context.close();
  });
}

test(`${ENGINE}: unresolved offerings stay neutral while localized StoreKit prices pass through`, async () => {
  const unresolved = await open({
    offeringsSequence: [{ monthlyPrice: null, annualPrice: null }],
  });
  assert.deepEqual(
    await unresolved.page.locator('.sa-pw-price__amount').allTextContents(),
    ['Store price', 'Store price'],
  );
  assert.deepEqual(
    await unresolved.page.locator('.sa-pw-price__amount').evaluateAll(nodes => nodes.map(node => node.dataset.priceSource)),
    ['unresolved', 'unresolved'],
  );
  assert.doesNotMatch(await unresolved.page.locator('.sa-pw-scrim').innerText(), /\b(?:NOK|kr)\s*[\d.,]/i);
  assert.equal(await unresolved.page.locator('.sa-pw-cta').textContent(), 'Store price unavailable');
  assert.deepEqual(unresolved.errors, []);
  await unresolved.context.close();

  const localized = await open({
    offeringsSequence: [{ monthlyPrice: '€11.99', annualPrice: null }],
  });
  assert.deepEqual(
    await localized.page.locator('.sa-pw-price__amount').allTextContents(),
    ['€11.99', 'Store price'],
  );
  assert.equal(await localized.page.locator('.sa-pw-cta').textContent(), 'Continue — €11.99 per month');
  assert.deepEqual(localized.errors, []);
  await localized.context.close();
});

test(`${ENGINE}: the three shipping value moments gate after the free allowance and resume after unlock`, async () => {
  const range = await open({
    route: 'impact.html',
    waitForPaywall: false,
    accessUsage: { shots: 10 },
  });
  await range.page.getByRole('button', { name: 'Pin comparison' }).click();
  await range.page.locator('.sa-pw-scrim[open]').waitFor();
  assert.equal(await range.page.evaluate(() => window.__sa.paywall.state().source), 'instrument-shot');
  assert.match(await range.page.locator('#sa-pw-body').textContent(), /ten free Range comparisons are complete/i);
  await range.page.evaluate(() => { window.__iapMode = 'success'; });
  await range.page.locator('.sa-pw-cta').click();
  await range.page.locator('.sa-pw-scrim').waitFor({ state: 'hidden' });
  await range.page.getByText(/Comparison pinned\./).waitFor();
  assert.deepEqual(range.errors, []);
  await range.context.close();

  const guide = await open({
    route: 'jarvis.html',
    waitForPaywall: false,
    accessUsage: { answers: 5 },
  });
  await guide.page.locator('[data-guide-topic="direction"]').click();
  await guide.page.locator('[data-question-id="curve-right"]').click();
  await guide.page.locator('.sa-pw-scrim[open]').waitFor();
  assert.equal(await guide.page.evaluate(() => window.__sa.paywall.state().source), 'guide-answer');
  assert.match(await guide.page.locator('#sa-pw-body').textContent(), /free guided answers are complete/i);
  await guide.page.evaluate(() => { window.__iapMode = 'success'; });
  await guide.page.locator('.sa-pw-cta').click();
  await guide.page.locator('.sa-pw-scrim').waitFor({ state: 'hidden' });
  await guide.page.waitForFunction(() => document.body.dataset.guideView === 'answer');
  assert.deepEqual(guide.errors, []);
  await guide.context.close();

  const firstStudio = await open({
    viewport: { width: 932, height: 430 },
    route: 'impact-studio.html?guided=experiment',
    waitForPaywall: false,
  });
  await firstStudio.page.locator('#guidedExperimentCue:visible').waitFor();
  assert.match(await firstStudio.page.locator('#guidedExperimentCopy').textContent(), /Change Low Point X/i);
  assert.equal(
    await firstStudio.page.locator('button[data-mechanics-mode="arc"]').getAttribute('aria-pressed'),
    'true',
    'the guided handoff opens Arc Inputs',
  );
  assert.equal(await firstStudio.page.evaluate(() => {
    return JSON.parse(localStorage.getItem('sa.access.v1') || '{}').usage?.['guided-experiment'] || 0;
  }), 0, 'opening the guided Mechanics experiment does not consume it');
  await firstStudio.page.locator('#arc-low-point').evaluate(input => {
    input.value = String(Number(input.value) + Number(input.step || 0.5));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  assert.equal(await firstStudio.page.evaluate(() => {
    return JSON.parse(localStorage.getItem('sa.access.v1') || '{}').usage?.['guided-experiment'] || 0;
  }), 0, 'live input alone does not consume before the control commits');
  await firstStudio.page.locator('#arc-low-point').evaluate(input => {
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await firstStudio.page.waitForFunction(() => document.body.dataset.guidedExperiment === 'complete');
  assert.match(await firstStudio.page.locator('#guidedExperimentState').textContent(), /EXPERIMENT COMPLETE/i);
  assert.equal(await firstStudio.page.evaluate(() => {
    return JSON.parse(localStorage.getItem('sa.access.v1')).usage['guided-experiment'];
  }), 1);
  await capture(firstStudio.page, '932x430--guided-studio');
  assert.deepEqual(firstStudio.errors, []);
  await firstStudio.context.close();

  const studio = await open({
    viewport: { width: 932, height: 430 },
    route: 'impact-studio.html?guided=experiment',
    accessUsage: { experiments: 1 },
  });
  assert.equal(await studio.page.evaluate(() => window.__sa.paywall.state().source), 'guided-experiment');
  assert.match(await studio.page.locator('#sa-pw-body').textContent(), /first guided Mechanics experiment is complete/i);
  assert.equal(new URL(studio.page.url()).searchParams.get('guided'), 'experiment');
  assert.equal(await studio.page.locator('#guidedExperimentCue').isHidden(), true);
  await studio.page.evaluate(() => { window.__iapMode = 'success'; });
  await studio.page.locator('.sa-pw-cta').click();
  await studio.page.locator('.sa-pw-scrim').waitFor({ state: 'hidden' });
  await studio.page.locator('#guidedExperimentCue:visible').waitFor();
  assert.equal(await studio.page.evaluate(() => document.body.dataset.guidedExperiment), 'active');
  assert.equal(
    await studio.page.locator('button[data-mechanics-mode="arc"]').getAttribute('aria-pressed'),
    'true',
    'purchase resume returns to the Arc Inputs experiment',
  );
  assert.deepEqual(studio.errors, []);
  await studio.context.close();
});

test(`${ENGINE}: a previously counted Range setup can be re-pinned without spending another comparison`, async () => {
  const identity = 'shot:90.00:2.00:0.00:3.00:24.00';
  const { context, page, errors } = await open({
    route: 'impact.html',
    waitForPaywall: false,
    accessUsage: {
      shots: 10,
      identities: [identity, ...Array.from({ length: 9 }, (_, index) => `seed-shot-${index}`)],
    },
  });
  const pin = page.locator('#pinFab');
  await pin.click();
  await page.getByText(/Comparison pinned\. Pro options open on the next new comparison\./).waitFor();
  assert.equal(await page.locator('.sa-pw-scrim').isVisible(), false);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('sa.access.v1')).usage['instrument-shot']), 10);
  await pin.click();
  await page.getByText(/This setup is already pinned\./).waitFor();
  assert.deepEqual(errors, []);
  await context.close();
});

test(`${ENGINE}: keyboard plan selection and a successful purchase unlock Pro and return focus`, async () => {
  const { context, page, errors } = await open();
  const dialog = page.locator('.sa-pw-scrim');
  await page.getByRole('button', { name: 'Close Pro options' }).click();
  await dialog.waitFor({ state: 'hidden' });
  await page.evaluate(() => {
    const opener = document.createElement('button');
    opener.id = 'purchase-opener';
    opener.textContent = 'Open Pro';
    document.body.append(opener);
    opener.focus();
    window.__iapMode = 'success';
    void window.__sa.paywall.open('instrument-shot');
  });
  await page.locator('.sa-pw-scrim[open]').waitFor();
  const monthly = page.getByRole('radio', { name: /Monthly/i });
  await page.waitForFunction(() => !document.querySelector('input[value="monthly"]')?.disabled);
  await monthly.focus();
  await page.keyboard.press('Space');
  assert.equal(await monthly.isChecked(), true);
  const cta = page.getByRole('button', { name: /Continue.*kr 99 per month/i });
  await cta.focus();
  await page.keyboard.press('Enter');
  await dialog.waitFor({ state: 'hidden' });
  await page.waitForFunction(() => document.activeElement?.id === 'purchase-opener');
  assert.equal(await page.evaluate(() => window.__sa.iap.isPro()), true);
  assert.deepEqual(errors, []);
  await context.close();
});

test(`${ENGINE}: a delayed store confirmation cannot dismiss or lose the gated action`, async () => {
  const { context, page, errors } = await open({
    route: 'impact.html',
    waitForPaywall: false,
    accessUsage: { shots: 10 },
  });
  const dialog = page.locator('.sa-pw-scrim');
  await page.getByRole('button', { name: 'Pin comparison' }).click();
  await page.locator('.sa-pw-scrim[open]').waitFor();
  await page.waitForFunction(() => !document.querySelector('.sa-pw-cta')?.disabled);
  await page.evaluate(() => {
    window.__iapMode = 'delayed-success';
    window.__iapDelayMs = 1_000;
  });
  await page.locator('.sa-pw-cta').click();
  await page.waitForFunction(() => window.__sa.paywall.state().busy === true);

  assert.equal(await page.getByRole('button', { name: 'Close Pro options' }).isDisabled(), true);
  await page.keyboard.press('Escape');
  assert.equal(await dialog.isVisible(), true);
  assert.equal(await page.evaluate(() => window.__sa.paywall.close()), false);
  assert.match(await page.locator('.sa-pw-status').textContent(), /store confirmation is still open/i);

  await dialog.waitFor({ state: 'hidden' });
  await page.getByText(/Comparison pinned\./).waitFor();
  assert.equal(await page.evaluate(() => window.__sa.iap.isPro()), true);
  assert.deepEqual(errors, []);
  await context.close();
});

test(`${ENGINE}: delayed restore owns the dialog until unlock, then resumes the gated action and returns focus`, async () => {
  const { context, page, errors } = await open({
    route: 'impact.html',
    waitForPaywall: false,
    accessUsage: { shots: 10 },
  });
  const pin = page.getByRole('button', { name: 'Pin comparison' });
  const dialog = page.locator('.sa-pw-scrim');
  await pin.focus();
  await page.keyboard.press('Enter');
  await page.locator('.sa-pw-scrim[open]').waitFor();
  await page.waitForFunction(() => !document.querySelector('.sa-pw-link')?.disabled);
  await page.evaluate(() => {
    window.__iapMode = 'delayed-restore-success';
    window.__iapDelayMs = 1_000;
  });
  await page.getByRole('button', { name: 'Restore purchases' }).click();
  await page.waitForFunction(() => window.__sa.paywall.state().busy === true);

  assert.equal(await page.getByRole('button', { name: 'Close Pro options' }).isDisabled(), true);
  await page.keyboard.press('Escape');
  assert.equal(await dialog.isVisible(), true);
  assert.equal(await page.evaluate(() => window.__sa.paywall.close()), false);
  assert.match(await page.locator('.sa-pw-status').textContent(), /store confirmation is still open/i);

  await dialog.waitFor({ state: 'hidden' });
  await page.getByText(/Comparison pinned\./).waitFor();
  await page.waitForFunction(() => document.activeElement?.id === 'pinFab');
  assert.equal(await page.evaluate(() => window.__sa.iap.isPro()), true);
  assert.equal(await page.evaluate(() => window.__sa.paywall.state().busy), false);
  assert.deepEqual(errors, []);
  await context.close();
});

for (const [firstMode, expectedCopy] of [
  ['cancelled', 'Purchase cancelled. Nothing was charged.'],
  ['error', 'The store could not complete the purchase. Check your connection and try again.'],
]) {
  test(`${ENGINE}: ${firstMode} purchase can retry and resume the original gated action`, async () => {
    const { context, page, errors } = await open({
      route: 'impact.html',
      waitForPaywall: false,
      accessUsage: { shots: 10 },
    });
    const pin = page.getByRole('button', { name: 'Pin comparison' });
    const dialog = page.locator('.sa-pw-scrim');
    await pin.focus();
    await page.keyboard.press('Enter');
    await page.locator('.sa-pw-scrim[open]').waitFor();
    await page.waitForFunction(() => !document.querySelector('.sa-pw-cta')?.disabled);

    await page.evaluate(mode => { window.__iapMode = mode; }, firstMode);
    await page.locator('.sa-pw-cta').click();
    assert.equal(await page.locator('.sa-pw-status').textContent(), expectedCopy);
    assert.equal(await dialog.isVisible(), true);
    assert.equal(await page.evaluate(() => window.__sa.iap.isPro()), false);
    assert.equal(await page.evaluate(() => window.__sa.paywall.state().source), 'instrument-shot');
    assert.equal(await page.getByText(/Comparison pinned\./).count(), 0);

    await page.evaluate(() => { window.__iapMode = 'success'; });
    await page.locator('.sa-pw-cta').click();
    await dialog.waitFor({ state: 'hidden' });
    await page.getByText(/Comparison pinned\./).waitFor();
    await page.waitForFunction(() => document.activeElement?.id === 'pinFab');
    assert.equal(await page.evaluate(() => window.__sa.iap.isPro()), true);
    assert.deepEqual(errors, []);
    await context.close();
  });
}

test(`${ENGINE}: a stale delayed offering cannot overwrite a newly opened paywall session`, async () => {
  const { context, page, errors } = await open({
    offeringsSequence: [
      { delayMs: 800, monthlyPrice: 'OLD MONTHLY', annualPrice: 'OLD ANNUAL', annualMonthlyPrice: 'OLD MONTH' },
      { monthlyPrice: 'NEW MONTHLY', annualPrice: null },
    ],
  });
  const dialog = page.locator('.sa-pw-scrim');
  await page.getByRole('button', { name: 'Close Pro options' }).click();
  await dialog.waitFor({ state: 'hidden' });

  await page.evaluate(() => {
    const opener = document.createElement('button');
    opener.id = 'fresh-session-opener';
    opener.textContent = 'Open new session';
    document.body.append(opener);
    opener.focus();
    void window.__sa.paywall.open('guide-answer');
  });
  await page.locator('.sa-pw-scrim[open]').waitFor();
  const monthly = page.getByRole('radio', { name: /Monthly/i });
  const annual = page.getByRole('radio', { name: /Annual/i });
  await page.waitForFunction(() => !document.querySelector('input[value="monthly"]')?.disabled);
  assert.equal(await monthly.isChecked(), true);
  assert.equal(await monthly.isDisabled(), false);
  assert.equal(await annual.isDisabled(), true);
  assert.match(await page.locator('#sa-pw-title').textContent(), /Keep digging into the model/i);
  assert.match(await page.locator('.sa-pw-cta').textContent(), /NEW MONTHLY per month/i);

  await page.waitForTimeout(1_000);
  assert.equal(await monthly.isChecked(), true);
  assert.equal(await monthly.isDisabled(), false);
  assert.equal(await annual.isDisabled(), true);
  assert.match(await page.locator('.sa-pw-cta').textContent(), /NEW MONTHLY per month/i);
  assert.doesNotMatch(await dialog.innerText(), /OLD MONTHLY|OLD ANNUAL|OLD MONTH/);
  assert.equal(await page.evaluate(() => window.__sa.paywall.state().source), 'guide-answer');
  assert.deepEqual(errors, []);
  await context.close();
});

test(`${ENGINE}: Home exposes keyboard-accessible restore and legal access without a price wall`, async () => {
  const { context, page, errors } = await open({
    route: 'index.html',
    waitForPaywall: false,
    skipOpening: true,
  });
  await page.locator('#onboarding[open]').waitFor();
  await page.getByRole('button', { name: 'Not now' }).click();
  await page.locator('#onboarding').waitFor({ state: 'hidden' });
  await page.waitForFunction(() => document.activeElement?.id === 'startFirstShot');
  const opener = page.getByRole('button', { name: 'Purchases and legal' });
  await opener.press('Enter');
  const center = page.locator('#accessCenter[open]');
  await center.waitFor();
  await page.waitForFunction(() => document.activeElement?.id === 'accessCenterTitle');
  assert.equal(await center.getByRole('link').count(), 2);
  assert.doesNotMatch(await center.innerText(), /kr\s*\d|choose a plan/i);
  await center.getByRole('link', { name: 'Terms of Use' }).click();
  await page.waitForURL(/\/terms\.html$/);
  assert.match(await page.locator('h1').textContent(), /Terms of Use/);
  await settleDocumentAnimations(page);
  await page.getByRole('link', { name: 'Back' }).click();
  await page.waitForURL(/\/index\.html$/);
  await page.waitForFunction(() => document.activeElement?.id === 'homeMain');
  const returnedOpener = page.getByRole('button', { name: 'Purchases and legal' });
  await returnedOpener.press('Enter');
  await center.waitFor();
  await page.waitForFunction(() => document.activeElement?.id === 'accessCenterTitle');
  await page.evaluate(() => { window.__iapMode = 'restore-success'; });
  const restore = center.getByRole('button', { name: 'Restore purchases' });
  await restore.press('Enter');
  await page.getByText('Flightglass Pro restored.').waitFor();
  assert.equal(await page.evaluate(() => window.__sa.iap.isPro()), true);
  await assertNoSeriousAxe(page);
  await capture(page, '375x812--home-access');
  await page.keyboard.press('Escape');
  await center.waitFor({ state: 'hidden' });
  await page.waitForFunction(() => document.activeElement?.id === 'openAccessCenter');
  assert.deepEqual(errors, []);
  await context.close();
});

test(`${ENGINE}: cancellation, pending, error, restore, Escape, focus return, and reduced motion remain truthful`, async () => {
  const { context, page, errors } = await open({ reducedMotion: 'reduce' });
  const dialog = page.locator('.sa-pw-scrim');
  const cta = page.locator('.sa-pw-cta');
  for (const [mode, copy] of [
    ['cancelled', 'Purchase cancelled. Nothing was charged.'],
    ['pending', 'Purchase pending. Pro will unlock when your store confirms payment.'],
    ['unavailable', 'Store access is unavailable in this build. Try again after the app store connection is configured.'],
    ['error', 'The store could not complete the purchase. Check your connection and try again.'],
  ]) {
    await page.evaluate(next => { window.__iapMode = next; }, mode);
    await cta.click();
    assert.equal(await page.locator('.sa-pw-status').textContent(), copy);
  }
  for (const [mode, copy] of [
    ['restore-not-found', 'No Flightglass Pro purchase was found for this store account.'],
    ['restore-unavailable', 'Store access is unavailable in this build. Try again after the app store connection is configured.'],
    ['restore-error', 'The store could not check purchases. Check your connection and try again.'],
  ]) {
    await page.evaluate(next => { window.__iapMode = next; }, mode);
    await page.getByRole('button', { name: 'Restore purchases' }).click();
    assert.equal(await page.locator('.sa-pw-status').textContent(), copy);
  }
  await page.evaluate(() => { window.__iapMode = 'restore-success'; });
  await page.getByRole('button', { name: 'Restore purchases' }).click();
  await dialog.waitFor({ state: 'hidden' });
  await page.evaluate(() => { const button = document.createElement('button'); button.id = 'phase4-opener'; document.body.append(button); button.focus(); });
  await reopen(page);
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(await page.evaluate(() => document.activeElement.id), 'phase4-opener');
  assert.equal(await page.evaluate(() => document.getAnimations().filter(item => item.playState === 'running').length), 0);
  await capture(page, '375x812--reduced');
  assert.deepEqual(errors, []); await context.close();
});
