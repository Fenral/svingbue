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
const WEBKIT = process.env.FG_ENGINE === 'webkit' || process.argv.includes('--project=webkit');
const ENGINE = WEBKIT ? 'webkit' : 'chromium';
const EVIDENCE_DIR = join(ROOT, 'outputs', 'flightglass-gates', 'impact-studio');

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
    if (pathname === '/favicon.ico') {
      response.writeHead(204).end();
      return;
    }
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

async function open({ viewport, reducedMotion = 'no-preference' }) {
  const browserContext = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion });
  const page = await browserContext.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') {
      const source = message.location().url;
      errors.push(`console: ${message.text()}${source ? ` (${source})` : ''}`);
    }
  });
  await page.goto(`${baseUrl}/impact-studio.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return { browserContext, page, errors };
}

async function capture(page, name) {
  await page.screenshot({
    path: join(EVIDENCE_DIR, `${ENGINE}--${name}.png`),
    fullPage: false,
    animations: 'disabled',
  });
}

async function layoutFacts(page) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
}

async function currentView(page) {
  return page.locator('#stage').getAttribute('data-view');
}

async function lowPointFacts(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('#scene');
    const stage = document.querySelector('#stage');
    const [view, xRaw, yRaw, opacityRaw] = stage.dataset.lowPointMarker.split(',');
    const [instrumentView, surveyDepthRaw, instrumentKind] = stage.dataset.lowPointInstrument.split(',');
    const x = Number(xRaw), y = Number(yRaw), opacity = Number(opacityRaw);
    const scaleX = canvas.width / canvas.getBoundingClientRect().width;
    const scaleY = canvas.height / canvas.getBoundingClientRect().height;
    const pixel = [...canvas.getContext('2d').getImageData(
      Math.round(x * scaleX), Math.round(y * scaleY), 1, 1,
    ).data];
    return { view, x, y, opacity, width:canvas.getBoundingClientRect().width,
      height:canvas.getBoundingClientRect().height, pixel, instrumentView,
      surveyDepth:Number(surveyDepthRaw), instrumentKind };
  });
}

function assertVisibleLowPoint(facts, expectedView) {
  assert.equal(facts.view, expectedView);
  assert.equal(facts.opacity, 1, 'Low Point marker must never dim');
  assert.ok(facts.x >= 7 && facts.x <= facts.width - 7,
    `Low Point x is outside the scene: ${facts.x} / ${facts.width}`);
  assert.ok(facts.y >= 7 && facts.y <= facts.height - 7,
    `Low Point y is outside the scene: ${facts.y} / ${facts.height}`);
  assert.ok(facts.pixel[0] > 180 && facts.pixel[2] > 130 && facts.pixel[0] > facts.pixel[1] + 30,
    `Low Point centre is not visibly attack-pink: ${facts.pixel.join(',')}`);
  assert.equal(facts.instrumentView, expectedView);
  assert.equal(facts.instrumentKind, 'aperture-survey',
    'Low Point must use the open aperture + turf survey instrument');
  assert.ok(Number.isFinite(facts.surveyDepth) && facts.surveyDepth >= 0,
    `Low Point turf survey depth is invalid: ${facts.surveyDepth}`);
}

test(`${ENGINE}: canvas outcome plates cannot cover the physical teaching geometry`, () => {
  for (const relative of ['impact-studio.html', 'design/mocks/impact-studio.html']) {
    const source = readFileSync(join(ROOT, relative), 'utf8');
    assert.doesNotMatch(source, /plateLabel\('ATTACK ANGLE/);
    assert.doesNotMatch(source, /plateLabel\('CLUB PATH/);
    assert.doesNotMatch(source, /dataset\.lowPointPlate/);
  }
});

test(`${ENGINE}: Studio camera announces its destination and contact stays reachable`, async () => {
  const { browserContext, page, errors } = await open({ viewport: { width: 812, height: 375 } });
  await page.locator('#stage').waitFor();
  assert.equal((await page.locator('#viewCap').textContent()).trim(), 'DTL');
  assert.equal(await currentView(page), 'face');

  const contactButton = page.locator('#btnContact');
  assert.equal(await contactButton.count(), 1, 'Studio needs a dedicated third Strike rail control');
  const contactBox = await contactButton.boundingBox();
  assert.ok(contactBox.width >= 44 && contactBox.height >= 44, 'Strike rail target must be at least 44px');
  const insetMaxBox = await page.locator('#insetMax').boundingBox();
  assert.ok(insetMaxBox.width >= 44 && insetMaxBox.height >= 44, 'contact-zone expansion target must be at least 44px');

  await page.locator('#btnView').click();
  assert.equal(await currentView(page), 'dtl');
  assert.equal((await page.locator('#viewCap').textContent()).trim(), 'FO');
  assert.equal(await page.locator('#inset').isVisible(), true, 'Strike preview remains available in DTL');
  const toast = page.locator('.view-toast');
  await toast.waitFor({ state: 'visible' });
  assert.match((await toast.textContent()).trim(), /DOWN THE LINE/i);
  await capture(page, 'dtl-toast--812x375');
  await page.waitForTimeout(950);
  const toastState = await toast.evaluate(element => {
    const style = getComputedStyle(element);
    return { opacity: Number(style.opacity), hidden: element.hidden, ariaHidden: element.getAttribute('aria-hidden') };
  });
  assert.ok(toastState.hidden || toastState.ariaHidden === 'true' || toastState.opacity === 0,
    'view feedback should fade away after it has confirmed the new mode');

  await contactButton.click();
  assert.equal(await currentView(page), 'dtl', 'Strike preserves the selected Geometry perspective');
  assert.equal(await page.locator('#inset').evaluate(element => element.classList.contains('inset--max')), true);
  assert.equal(await contactButton.getAttribute('aria-label'), 'Close Strike contact zone');
  await capture(page, 'contact-inspection--812x375');
  await page.locator('#insetMax').click();
  assert.equal(await page.locator('#inset').evaluate(element => element.classList.contains('inset--max')), false);
  assert.equal(await contactButton.getAttribute('aria-label'), 'Open Strike contact zone');
  assert.deepEqual(errors, []);
  await browserContext.close();
});

for (const viewport of [{ width: 568, height: 320 }, { width: 812, height: 375 }, { width: 932, height: 430 }]) {
  test(`${ENGINE}: Studio has no horizontal overflow at ${viewport.width}x${viewport.height}`, async () => {
    const { browserContext, page, errors } = await open({ viewport });
    const layout = await layoutFacts(page);
    assert.ok(layout.scrollWidth <= layout.clientWidth,
      `horizontal overflow at ${viewport.width}x${viewport.height}: ${layout.scrollWidth} > ${layout.clientWidth}`);
    const stageBox = await page.locator('#stage').boundingBox();
    const contactBox = await page.locator('#btnContact').boundingBox();
    assert.ok(contactBox.y + contactBox.height <= stageBox.y + stageBox.height + 1,
      `contact rail escapes the stage at ${viewport.width}x${viewport.height}`);
    const controlsBox = await page.locator('.controls').boundingBox();
    const sliderBox = await page.locator('.sliderZone').boundingBox();
    const navBox = await page.locator('.sa-app-nav').boundingBox();
    assert.ok(controlsBox.y + controlsBox.height <= navBox.y + 1,
      `Studio controls overlap the app navigation at ${viewport.width}x${viewport.height}`);
    assert.ok(sliderBox.y + sliderBox.height <= navBox.y + 1,
      `Studio slider overlaps the app navigation at ${viewport.width}x${viewport.height}`);
    await capture(page, `face--${viewport.width}x${viewport.height}`);
    assert.deepEqual(errors, []);
    await browserContext.close();
  });
}

test(`${ENGINE}: Studio honors reduced motion after settling`, async () => {
  const { browserContext, page, errors } = await open({
    viewport: { width: 812, height: 375 },
    reducedMotion: 'reduce',
  });
  await page.waitForTimeout(350);
  assert.equal(await page.locator('#range').getAttribute('aria-label'), 'Ball position');
  const running = await page.evaluate(() => document.getAnimations()
    .filter(animation => animation.playState === 'running').length);
  assert.equal(running, 0);
  await page.locator('#range').fill('5');
  await page.waitForTimeout(80);
  const firstFrame = await page.locator('#scene').evaluate(canvas => canvas.toDataURL());
  await page.waitForTimeout(1100);
  const settledFrame = await page.locator('#scene').evaluate(canvas => canvas.toDataURL());
  assert.equal(settledFrame, firstFrame,
    'reduced motion must render the final Studio state without a timed canvas fade');
  await capture(page, 'face--812x375--reduce');
  assert.deepEqual(errors, []);
  await browserContext.close();
});

test(`${ENGINE}: ghost club teaches turf entry before impact`, async () => {
  const { browserContext, page, errors } = await open({ viewport: { width: 812, height: 375 } });
  await page.locator('#stage').waitFor();
  await page.locator('#range').evaluate(element => {
    element.value = '20';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForFunction(() => document.querySelector('#stage')?.dataset.ghostAnchor === 'entry');
  assert.equal(await page.locator('#stage').getAttribute('data-ghost-anchor'), 'entry');
  await page.locator('.chip[data-p="arc"]').click();
  await page.locator('#range').evaluate(element => {
    element.value = '5';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForFunction(() => document.querySelector('#stage')?.dataset.ghostAnchor === 'impact');
  assert.equal(await page.locator('#stage').getAttribute('data-ghost-anchor'), 'impact');
  assert.deepEqual(errors, []);
  await browserContext.close();
});

test(`${ENGINE}: swing arc keeps an opaque Low Point marker through live changes`, async () => {
  const { browserContext, page, errors } = await open({ viewport: { width: 812, height: 375 } });
  await page.waitForFunction(() => document.querySelector('#stage')?.dataset.lowPointMarker?.startsWith('face,'));

  for (const value of ['-20', '20']) {
    await page.locator('.chip[data-p="low"]').click();
    await page.locator('#range').evaluate((element, next) => {
      element.value = next;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
    await page.locator('.chip[data-p="plane"]').click();
    await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
    assertVisibleLowPoint(await lowPointFacts(page), 'face');
  }
  await capture(page, 'persistent-low-point-face--812x375');

  await page.locator('#btnView').click();
  await page.waitForFunction(() => document.querySelector('#stage')?.dataset.lowPointMarker?.startsWith('dtl,'));
  assertVisibleLowPoint(await lowPointFacts(page), 'dtl');
  await capture(page, 'persistent-low-point-dtl--812x375');
  assert.deepEqual(errors, []);
  await browserContext.close();
});

test(`${ENGINE}: desktop DTL frames the arc and plane glass`, async () => {
  const { browserContext, page, errors } = await open({ viewport: { width: 1680, height: 1050 } });
  await page.locator('#btnView').click();
  await page.locator('.chip[data-p="plane"]').click();
  await page.waitForTimeout(700);
  await capture(page, 'dtl-plane--1680x1050');
  const layout = await layoutFacts(page);
  assert.ok(layout.scrollWidth <= layout.clientWidth);
  assert.deepEqual(errors, []);
  await browserContext.close();
});
