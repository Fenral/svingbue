/**
 * IMPACT · PORTRAIT BROWSER — DOM-observerbare krav for den minimale
 * carry-only toppen (eierordre 2026-07-22). Kjører impact.html i en ekte
 * headless-nettleser over HTTP (ESM krever http, ikke file://) og verifiserer:
 *   - topstrip er én tilbake-til-meny-kontroll; See the Shot / Geometry / Impact borte
 *   - avlesningen er KUN carry (offline + Δ fjernet), CARRY-tallet fylles fortsatt
 *   - Pin heter «Save shot»
 *   - speed er en ekte, synlig slider og starter på 90 mph
 *   - 3D Range er standardlinse og kan replayes
 *   - én instrumentrail har 0-/referansepunkt og live outcomes
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
const WEBKIT = process.env.FG_ENGINE === 'webkit' || process.argv.includes('--project=webkit');
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
  const { chromium, webkit } = require('../tools/node_modules/playwright-core');
  if (WEBKIT) browser = await webkit.launch({ headless: true });
  else {
    try { browser = await chromium.launch({ channel: 'msedge', headless: true }); }
    catch { browser = await chromium.launch({ channel: 'chrome', headless: true }); }
  }
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

test('club speed is a discoverable native range with precision controls', { timeout: 60_000 }, async () => {
  const { page } = await open();
  await page.locator('#stage').waitFor();
  const range = page.locator('#sl-speed');
  assert.equal(await range.count(), 1, 'speed uses a real range input');
  assert.equal(await range.getAttribute('type'), 'range');
  assert.equal(await range.getAttribute('min'), '30');
  assert.equal(await range.getAttribute('max'), '150');
  const val = page.locator('#spVal');
  assert.match(await val.textContent(), /^90\s*mph/i, 'starter på 90 mph');
  assert.equal(await val.getAttribute('aria-valuenow'), '90', 'aria matcher 90');
  assert.equal(await page.locator('#controlMinus').count(), 1, 'precision decrement remains available');
  assert.equal(await page.locator('#controlPlus').count(), 1, 'precision increment remains available');
  await page.close();
});

test('3D Range is the default lens and Replay restarts the visible ball flight', { timeout: 60_000 }, async () => {
  const { page, errors } = await open();
  await page.locator('#stage').waitFor();
  const range = page.getByRole('button', { name: /^3D Range$/i });
  assert.equal(await range.getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#stage').getAttribute('data-lens'), 'range');
  const replay = page.locator('#replayFlight');
  assert.equal(await replay.count(), 1);
  await replay.click();
  assert.equal(await page.evaluate(() => window.__impact.replayCount), 1);
  assert.deepEqual(noFavicon(errors), [], 'ingen runtime-feil');
  await page.close();
});

test('Replay leaves the accessibility tree in analytical lenses', { timeout: 60_000 }, async () => {
  const { page } = await open();
  await page.locator('#stage').waitFor();
  await station(page, 'SIDE');
  await page.waitForTimeout(250);
  assert.equal(await page.locator('#replayFlight').isHidden(), true, 'Replay is hidden in SIDE');
  await station(page, 'TOP');
  await page.waitForTimeout(250);
  assert.equal(await page.locator('#replayFlight').isHidden(), true, 'Replay is hidden in TOP');
  await station(page, '3D RANGE');
  await page.waitForTimeout(250);
  assert.equal(await page.locator('#replayFlight').isVisible(), true, 'Replay returns in 3D Range');
  await page.close();
});

test('the vector rail exposes five inputs and truthful reference marks', { timeout: 60_000 }, async () => {
  const { page } = await open();
  await page.locator('#stage').waitFor();
  assert.equal(await page.locator('#parameterRail button').count(), 5);
  for (const [key, label] of [['face', '0°'], ['path', '0°'], ['attack', '0°'], ['dynLoft', '25° reference']]) {
    await page.locator(`#parameterRail button[data-param="${key}"]`).click();
    assert.equal(await page.locator('#controlReference').textContent(), label);
    const box = await page.locator('#activeControl input[type="range"]').boundingBox();
    assert.ok(box && box.height >= 44, `${key} has a 44px interaction rail`);
  }
  const before = await page.locator('#sl-dynLoft').inputValue();
  await page.locator('#controlPlus').focus();
  await page.keyboard.press('Enter');
  assert.ok(Number(await page.locator('#sl-dynLoft').inputValue()) > Number(before), 'precision controls work from the keyboard');
  await page.close();
});

test('left telemetry stays live for spin loft, ball speed and backspin', { timeout: 60_000 }, async () => {
  const { page, errors } = await open();
  await page.locator('#stage').waitFor();
  const rail = page.locator('#outcomeRail');
  await rail.waitFor();
  const before = await page.locator('#liveBallSpeed').textContent();
  await page.locator('#parameterRail button[data-param="speed"]').click();
  await page.locator('#sl-speed').fill('110');
  await page.waitForTimeout(80);
  const after = await page.locator('#liveBallSpeed').textContent();
  assert.notEqual(after, before, 'ball speed updates with the active input');
  assert.notEqual(await page.locator('#activeControl').evaluate(el => el.style.getPropertyValue('--fill-width')), '0%',
    'the directional fill grows from the 90 mph reference');
  assert.match(await page.locator('#liveSpinLoft').textContent(), /°$/);
  assert.match(await page.locator('#liveBackspin').textContent(), /rpm$/i);
  assert.match(after, /mph$/i);
  assert.deepEqual(noFavicon(errors), [], 'ingen runtime-feil');
  await page.close();
});

test('screen-reader telemetry debounces rapid slider changes to the final shot', { timeout: 60_000 }, async () => {
  const { page } = await open();
  await page.locator('#stage').waitFor();
  const mutationCount = await page.evaluate(async () => {
    const live = document.getElementById('fCarryLive');
    const input = document.getElementById('sl-speed');
    let mutations = 0;
    const observer = new MutationObserver(() => { mutations += 1; });
    observer.observe(live, { childList: true, characterData: true, subtree: true });
    for (const value of [92, 96, 101, 106, 110]) {
      input.value = String(value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 45));
    }
    await new Promise(resolve => setTimeout(resolve, 450));
    observer.disconnect();
    return mutations;
  });
  assert.ok(mutationCount <= 2, `expected one settled announcement, saw ${mutationCount}`);
  await page.close();
});

test('no TARGET label appears in the scene at any station', { timeout: 60_000 }, async () => {
  const { page } = await open();
  await page.locator('#stage').waitFor();
  for (const s of ['TOP', 'SIDE', '3D RANGE']) {
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
