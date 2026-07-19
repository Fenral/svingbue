import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let server, browser, baseUrl;

const contentType = file => ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[extname(file).toLowerCase()] || 'application/octet-stream');

before(async () => {
  server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const file = resolve(ROOT, pathname === '/' ? 'impact.html' : pathname.replace(/^\/+/, ''));
    if (file.toLowerCase() !== ROOT.toLowerCase() && !`${file}${sep}`.toLowerCase().startsWith(`${ROOT}${sep}`.toLowerCase())) {
      response.writeHead(403).end('forbidden'); return;
    }
    readFile(file, (error, data) => {
      if (error) { response.writeHead(404).end('not found'); return; }
      response.writeHead(200, { 'Content-Type': contentType(file), 'Cache-Control': 'no-store' });
      response.end(data);
    });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const { chromium } = require('../tools/node_modules/playwright-core');
  try { browser = await chromium.launch({ channel: 'msedge', headless: true }); }
  catch { browser = await chromium.launch({ channel: 'chrome', headless: true }); }
});
after(async () => { await browser?.close(); await new Promise(r => server?.close(r)); });

const open = async (viewport = { width: 390, height: 844 }) => {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', e => errors.push(`page:${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`console:${m.text()}`); });
  await page.goto(`${baseUrl}/impact.html`, { waitUntil: 'networkidle' });
  return { page, errors };
};
const station = (page, name) => page.locator('.stations button', { hasText: new RegExp(`^${name}$`) }).click();

test('top strip is a single back-to-menu control; the Geometry/Impact tabs are gone', { timeout: 60_000 }, async () => {
  const { page, errors } = await open();
  await page.locator('#stage').waitFor();
  const back = page.locator('a.ts-back');
  assert.equal(await back.count(), 1);
  assert.match(await back.getAttribute('href'), /index\.html$/);
  assert.equal(await page.locator('.modnav').count(), 0);
  assert.equal(await page.getByRole('link', { name: /geometry/i }).count(), 0);
  assert.equal(await page.locator('.ts-title').count(), 0);
  assert.deepEqual(errors.filter(e => !e.includes('favicon')), []);
  await page.close();
});

test('the Δ text block is gone but carry and offline still fill', { timeout: 60_000 }, async () => {
  const { page, errors } = await open();
  await page.locator('#stage').waitFor();
  assert.equal(await page.locator('#fDelta').count(), 0);
  await page.waitForTimeout(300);
  assert.match(await page.locator('#fCarryNum').textContent(), /\d/);
  assert.match(await page.locator('#fHeroOffNum').textContent(), /\d/);
  assert.doesNotMatch(await page.locator('.flightCarry').textContent(), /previous pin|Δ vs/i);
  assert.deepEqual(errors.filter(e => !e.includes('favicon')), []);
  await page.close();
});

test('the save control reads "Lock shot", not "Pin"', { timeout: 60_000 }, async () => {
  const { page } = await open();
  await page.locator('#stage').waitFor();
  assert.equal(await page.getByRole('button', { name: 'Lock shot' }).count(), 1);
  assert.equal(await page.getByRole('button', { name: /^⊙?\s*Pin$/ }).count(), 0);
  await page.close();
});

test('the speed value enlarges the number, keeps mph small, and steps live', { timeout: 60_000 }, async () => {
  const { page } = await open();
  await page.locator('#stage').waitFor();
  const num = page.locator('#spNum');
  await num.waitFor();
  assert.match(await num.textContent(), /^\d+$/, 'the number span holds just the digits');
  const [numPx, unitPx] = await page.evaluate(() => [
    parseFloat(getComputedStyle(document.querySelector('.speedctl .spnum')).fontSize),
    parseFloat(getComputedStyle(document.querySelector('.speedctl .spu')).fontSize),
  ]);
  assert.ok(numPx > unitPx, `number (${numPx}px) is larger than the mph unit (${unitPx}px)`);
  // the stepper updates the visible number and the accessible value together
  const before = Number(await num.textContent());
  await page.locator('#spPlus').click();
  const after = Number(await num.textContent());
  assert.equal(after, before + 1, 'plus increments the number');
  assert.equal(await page.locator('#spVal').getAttribute('aria-valuetext'), `${after} mph`, 'aria-valuetext tracks the number');
  await page.close();
});

test('the speed control and Lock shot never overlap across phone widths', { timeout: 60_000 }, async () => {
  for (const width of [430, 414, 393, 390, 375, 360]) {
    const { page } = await open({ width, height: 812 });
    await page.locator('#stage').waitFor();
    const gap = await page.evaluate(() => {
      const sp = document.querySelector('.speedctl').getBoundingClientRect();
      const pin = document.querySelector('.pinfab').getBoundingClientRect();
      return Math.round(pin.left - sp.right);
    });
    assert.ok(gap >= 4, `speed↔Lock gap at ${width}px is ${gap}px (need ≥4)`);
    await page.close();
  }
});

test('collapse is available: the grab handle toggles the pane', { timeout: 60_000 }, async () => {
  const { page } = await open();
  await page.locator('#stage').waitFor();
  const grab = page.locator('#grab');
  assert.equal(await grab.count(), 1);
  const collapsed = () => page.locator('#panel').evaluate(el => el.classList.contains('collapsed'));
  assert.equal(await collapsed(), false);
  await grab.click();
  assert.equal(await collapsed(), true);
  await grab.click();
  assert.equal(await collapsed(), false);
  await page.close();
});

test('the angle sliders carry a center/midpoint tick in the track', { timeout: 60_000 }, async () => {
  const { page } = await open();
  await page.locator('#stage').waitFor();
  await station(page, 'TOP');
  await page.locator('.sl input[type="range"]').first().waitFor();
  // getComputedStyle(el, '::-webkit-slider-runnable-track') returns the host
  // element's style in Chromium, not the pseudo's, so read the applied rule
  // straight from the CSSOM. Chromium parses only the -webkit- track pseudo
  // (it drops the unknown ::-moz-range-track rule from cssRules), so the moz
  // half is confirmed against the served source below.
  const webkitTrack = await page.evaluate(() => {
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch { continue; }
      for (const rule of rules) {
        if (rule.selectorText && /\.sl input\[type="range"\]::-webkit-slider-runnable-track/.test(rule.selectorText)) {
          return { hasGradient: /gradient/.test(rule.cssText), centred: /calc\(50%/.test(rule.cssText) };
        }
      }
    }
    return null;
  });
  assert.ok(webkitTrack, 'the -webkit- track pseudo rule is parsed and applied');
  assert.ok(webkitTrack.hasGradient, 'the -webkit- track layers a gradient tick');
  assert.ok(webkitTrack.centred, 'the -webkit- track centres the tick at 50%');
  // Firefox/native draws through ::-moz-range-track; confirm that half is authored too.
  const source = await (await fetch(`${baseUrl}/impact.html`)).text();
  assert.match(source, /::-moz-range-track\{[^}]*linear-gradient\(90deg,[^}]*calc\(50%/, 'the -moz- track carries the same centred gradient tick');
  await page.close();
});

test('TOP shows the two direction sliders (face + path) with no horizontal overflow', { timeout: 60_000 }, async () => {
  const { page, errors } = await open({ width: 375, height: 812 });
  await page.locator('#stage').waitFor();
  await station(page, 'TOP');
  assert.equal(await page.locator('.sl input[type="range"]').count(), 2);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `no horizontal overflow (got ${overflow})`);
  assert.deepEqual(errors.filter(e => !e.includes('favicon')), []);
  await page.close();
});
