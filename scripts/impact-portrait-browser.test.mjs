/**
 * IMPACT · PORTRAIT BROWSER — DOM-observerbare krav for den minimale
 * carry-only toppen (eierordre 2026-07-22). Kjører impact.html i en ekte
 * headless-nettleser over HTTP (ESM krever http, ikke file://) og verifiserer:
 *   - topstrip er én tilbake-til-meny-kontroll; See the Shot / Geometry / Impact borte
 *   - avlesningen er KUN carry (offline + Δ fjernet), CARRY-tallet fylles fortsatt
 *   - Pin heter «Save shot»
 *   - speed-steget er flyttet opp i topstrip og starter på 90 mph
 *   - ingen TARGET-etikett i scenen
 *   - ingen horisontal overflow på 390×844 og 375×812
 * Rendering/farge hevdes ikke her — det bekreftes på skjermbilder.
 */
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
const noFavicon = errors => errors.filter(e => !e.includes('favicon'));

test('top strip is a single back-to-menu control; See the Shot / Geometry / Impact are gone', { timeout: 60_000 }, async () => {
  const { page, errors } = await open();
  await page.locator('#stage').waitFor();
  const back = page.locator('a.ts-back');
  assert.equal(await back.count(), 1, 'en ts-back-kontroll');
  assert.match(await back.getAttribute('href'), /index\.html$/, 'back → menyen');
  assert.equal(await page.locator('.modnav').count(), 0, 'modul-fanene borte');
  assert.equal(await page.locator('.ts-title').count(), 0, 'See the Shot-tittel borte');
  assert.equal(await page.getByRole('link', { name: /geometry/i }).count(), 0, 'ingen Geometry-fane');
  assert.deepEqual(noFavicon(errors), [], 'ingen runtime-feil');
  await page.close();
});

test('the readout is carry-only: offline and Δ removed, CARRY still fills', { timeout: 60_000 }, async () => {
  const { page, errors } = await open();
  await page.locator('#stage').waitFor();
  await page.waitForTimeout(300);
  assert.equal(await page.locator('#fDelta').count(), 0, 'Δ-blokken borte');
  assert.equal(await page.locator('#fHeroOffNum').count(), 0, 'offline-tallet borte');
  assert.equal(await page.locator('.flightCarry .offline').count(), 0, 'offline-linja borte');
  assert.match(await page.locator('#fCarryNum').textContent(), /\d/, 'CARRY fylles fortsatt');
  assert.doesNotMatch(await page.locator('.flightCarry').textContent(), /previous pin|Δ|m\s*R|m\s*L/i, 'ingen offline/Δ-rester');
  assert.deepEqual(noFavicon(errors), [], 'ingen runtime-feil');
  await page.close();
});

test('the pin control reads «Save shot», not «Pin»', { timeout: 60_000 }, async () => {
  const { page } = await open();
  await page.locator('#stage').waitFor();
  const fab = page.locator('#pinFab');
  assert.equal(await fab.count(), 1);
  assert.match(await fab.textContent(), /save shot/i, 'ny etikett');
  assert.doesNotMatch(await fab.textContent(), /\bpin\b/i, 'ingen «Pin» igjen');
  await page.close();
});

test('the speed stepper lives in the top strip and starts at 90 mph', { timeout: 60_000 }, async () => {
  const { page } = await open();
  await page.locator('#stage').waitFor();
  assert.equal(await page.locator('.topstrip .speedctl').count(), 1, 'steget er flyttet opp i topstrip');
  const val = page.locator('#spVal');
  assert.match(await val.textContent(), /^90\s*mph/i, 'starter på 90 mph');
  assert.equal(await val.getAttribute('aria-valuenow'), '90', 'aria matcher 90');
  await page.close();
});

test('no TARGET label appears in the scene at any station', { timeout: 60_000 }, async () => {
  const { page } = await open();
  await page.locator('#stage').waitFor();
  for (const s of ['TOP', 'SIDE', 'FLIGHT']) {
    await station(page, s);
    await page.waitForTimeout(350);
    const labels = (await page.locator('#annoLabels').textContent()) || '';
    assert.doesNotMatch(labels, /target/i, `ingen TARGET i ${s}`);
  }
  await page.close();
});

for (const vp of [{ width: 390, height: 844 }, { width: 375, height: 812 }]) {
  test(`no horizontal overflow at ${vp.width}×${vp.height}`, { timeout: 60_000 }, async () => {
    const { page, errors } = await open(vp);
    await page.locator('#stage').waitFor();
    await page.waitForTimeout(250);
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `horisontal overflow ${overflow}px ved ${vp.width}px`);
    assert.deepEqual(noFavicon(errors), [], 'ingen runtime-feil');
    await page.close();
  });
}
