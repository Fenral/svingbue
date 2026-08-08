/**
 * IMPACT · PORTRAIT BROWSER
 *
 * Browser-level contracts for the live Outcome surface and the restored
 * Side/Top teaching controls. Rendering craft is reviewed from screenshots;
 * this suite proves structure, state flow, accessibility, and containment.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONTEXT_KEY, buildGuidedShot, createDefaultContext, deriveNextExperiment,
} from '../sa-v1-context.js';

const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WEBKIT = process.env.FG_ENGINE === 'webkit' || process.argv.includes('--project=webkit');
let server, browser, baseUrl;

const contentType = file => ({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}[extname(file).toLowerCase()] || 'application/octet-stream');

before(async () => {
  server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const file = resolve(ROOT, pathname === '/' ? 'impact.html' : pathname.replace(/^\/+/, ''));
    if (file.toLowerCase() !== ROOT.toLowerCase()
      && !`${file}${sep}`.toLowerCase().startsWith(`${ROOT}${sep}`.toLowerCase())) {
      response.writeHead(403).end('forbidden');
      return;
    }
    readFile(file, (error, data) => {
      if (error) {
        response.writeHead(404).end('not found');
        return;
      }
      response.writeHead(200, { 'Content-Type': contentType(file), 'Cache-Control': 'no-store' });
      response.end(data);
    });
  });
  await new Promise(resolveReady => server.listen(0, '127.0.0.1', resolveReady));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const { chromium, webkit } = require('../tools/node_modules/playwright-core');
  if (WEBKIT) browser = await webkit.launch({ headless: true });
  else {
    try {
      browser = await chromium.launch({ channel: 'msedge', headless: true });
    } catch {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    }
  }
});

after(async () => {
  await browser?.close();
  await new Promise(resolveClosed => server?.close(resolveClosed));
});

const open = async (viewport = { width: 390, height: 844 }) => {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', error => errors.push(`page:${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console:${message.text()}`);
  });
  await page.goto(`${baseUrl}/impact.html`, { waitUntil: 'networkidle' });
  return { page, errors };
};

const station = (page, name) => page.locator('.stations button', {
  hasText: new RegExp(`^${name}$`),
}).click();
const noFavicon = errors => errors.filter(error => !error.includes('favicon'));
const visibleRangeIds = page => page.locator('#panel input[type="range"]:visible')
  .evaluateAll(nodes => nodes.map(node => node.id).sort());

test('top strip is a single back-to-menu control', { timeout: 60_000 }, async () => {
  const { page, errors } = await open();
  await page.locator('#stage').waitFor();
  const back = page.locator('a.ts-back');
  assert.equal(await back.count(), 1);
  assert.match(await back.getAttribute('href'), /index\.html$/);
  assert.equal(await page.locator('.modnav').count(), 0);
  assert.equal(await page.locator('.ts-title').count(), 0);
  assert.equal(await page.getByRole('link', { name: /geometry/i }).count(), 0);
  assert.deepEqual(noFavicon(errors), []);
  await page.close();
});

test('all thirteen outcomes are visible by default', { timeout: 60_000 }, async () => {
  const { page, errors } = await open();
  await page.locator('#stage').waitFor();
  await page.waitForTimeout(200);
  const metrics = await page.locator('#outcomeBoard .chip:visible').evaluateAll(nodes =>
    nodes.map(node => node.dataset.metric).sort());
  assert.deepEqual(metrics, [
    'apex', 'backspin', 'ballSpeed', 'carry', 'curve', 'landingAng', 'launchAng',
    'launchDir', 'side', 'smash', 'spinAxis', 'spinLoft', 'total',
  ]);
  assert.equal(await page.locator('#outcomeBoard').isVisible(), true);
  assert.deepEqual(noFavicon(errors), []);
  await page.close();
});

test('the pin control reads Pin comparison', { timeout: 60_000 }, async () => {
  const { page } = await open();
  await page.locator('#stage').waitFor();
  const fab = page.getByRole('button', { name: /^Pin comparison$/i });
  assert.equal(await fab.count(), 1);
  assert.equal(await fab.getAttribute('aria-label'), 'Pin comparison');
  await page.close();
});

test('Outcome is the default lens and replaces Flight / 3D Range', { timeout: 60_000 }, async () => {
  const { page, errors } = await open();
  await page.locator('#stage').waitFor();
  assert.deepEqual(
    (await page.locator('#stseg button').allTextContents()).map(value => value.trim()),
    ['TOP', 'SIDE', 'OUTCOME'],
  );
  const outcome = page.getByRole('button', { name: /^OUTCOME$/i });
  assert.equal(await outcome.getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#stage').getAttribute('data-lens'), 'outcome');
  assert.equal(await page.locator('#stage').getAttribute('data-tracer'), 'off');
  assert.equal(await page.locator('#replayFlight').count(), 0);
  assert.equal(await page.locator('#stseg button', { hasText: /^(FLIGHT|3D RANGE)$/i }).count(), 0);
  assert.deepEqual(noFavicon(errors), []);
  await page.close();
});

test('Side and Top restore their dedicated D-plane controls', { timeout: 60_000 }, async () => {
  const { page } = await open();
  await page.locator('#stage').waitFor();
  await station(page, 'SIDE');
  assert.equal(await page.locator('#stage').getAttribute('data-tracer'), 'on');
  assert.deepEqual(await visibleRangeIds(page), ['sl-attack', 'sl-dynLoft']);
  assert.match(await page.locator('#paneTitle').textContent(), /launch plane/i);
  await page.locator('#topSpeedVal').focus();
  await page.keyboard.press('End');
  assert.equal(await page.evaluate(() => window.__impact.state.speed), 150);
  await page.keyboard.press('Home');
  assert.equal(await page.evaluate(() => window.__impact.state.speed), 30);
  await page.keyboard.press('ArrowUp');
  assert.equal(await page.evaluate(() => window.__impact.state.speed), 31);
  await station(page, 'TOP');
  assert.deepEqual(await visibleRangeIds(page), ['sl-face', 'sl-path']);
  assert.match(await page.locator('#paneTitle').textContent(), /direction plane/i);
  await page.close();
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 375, height: 812 },
  { width: 800, height: 1280 },
]) {
  test(`Side and Top reserve the editor footprint at ${viewport.width}×${viewport.height}`, { timeout: 60_000 }, async () => {
    const { page, errors } = await open(viewport);
    await page.locator('#stage').waitFor();

    for (const name of ['SIDE', 'TOP']) {
      await station(page, name);
      await page.waitForTimeout(150);
      const geometry = await page.evaluate(() => {
        const panel = document.querySelector('#panel').getBoundingClientRect();
        const canvas = document.querySelector('#scene').getBoundingClientRect();
        const labelLayer = document.querySelector('#annoLabels').getBoundingClientRect();
        const labelsBehindPanel = [...document.querySelectorAll('#annoLabels .annoLabel:not([hidden])')]
          .map(label => ({ text: label.textContent, rect: label.getBoundingClientRect().toJSON() }))
          .filter(({ rect }) => rect.bottom > panel.top - 1);
        return {
          panelTop: panel.top,
          canvasBottom: canvas.bottom,
          labelLayerBottom: labelLayer.bottom,
          labelsBehindPanel,
        };
      });

      assert.ok(
        geometry.canvasBottom <= geometry.panelTop - 1,
        `${name}: tracer canvas must stop above the editor (${geometry.canvasBottom} > ${geometry.panelTop})`,
      );
      assert.ok(
        geometry.labelLayerBottom <= geometry.panelTop - 1,
        `${name}: annotation layer must stop above the editor`,
      );
      assert.deepEqual(geometry.labelsBehindPanel, [], `${name}: measurement labels clear the editor`);
    }

    await station(page, 'OUTCOME');
    await page.waitForTimeout(150);
    const restored = await page.evaluate(() => {
      const stage = document.querySelector('#stage').getBoundingClientRect();
      const canvas = document.querySelector('#scene').getBoundingClientRect();
      const labelLayer = document.querySelector('#annoLabels').getBoundingClientRect();
      return {
        stageBottom: stage.bottom,
        canvasBottom: canvas.bottom,
        labelLayerBottom: labelLayer.bottom,
        tracer: document.querySelector('#stage').dataset.tracer,
      };
    });
    assert.equal(restored.tracer, 'off');
    assert.ok(Math.abs(restored.canvasBottom - restored.stageBottom) <= 1, 'Outcome restores the full canvas');
    assert.ok(Math.abs(restored.labelLayerBottom - restored.stageBottom) <= 1, 'Outcome restores the full label layer');

    assert.deepEqual(noFavicon(errors), []);
    await page.close();
  });
}

test('guided experiment hydration refreshes all five visible values', { timeout: 60_000 }, async () => {
  const { page } = await open();
  const shot = buildGuidedShot({ club: '7iron', start: 'right', curve: 'left', flight: 'high' }, Date.UTC(2026, 7, 7));
  const experiment = deriveNextExperiment(shot);
  const context = { ...createDefaultContext(), currentShot: shot, lastExperiment: experiment };
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: CONTEXT_KEY, value: context,
  });
  await page.goto(`${baseUrl}/impact.html?guided=experiment`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.body.dataset.saGuidedRange === 'experiment');
  const hydrated = {
    speed: experiment.inputs.clubSpeed,
    face: experiment.inputs.faceAngle,
    path: experiment.inputs.clubPath,
    attack: experiment.inputs.attackAngle,
    dynLoft: experiment.inputs.dynamicLoft,
  };
  await page.waitForFunction(values => Object.entries(values).every(([key, expected]) => {
    const text = document.querySelector(`#parameterRail [data-param="${key}"] .paramValue`)?.textContent || '';
    return text.includes(key === 'speed' ? String(Math.round(expected)) : Math.abs(expected).toFixed(1));
  }), hydrated);
  for (const [key, expected] of Object.entries(hydrated)) {
    const text = await page.locator(`#parameterRail [data-param="${key}"] .paramValue`).textContent();
    assert.match(text, new RegExp(key === 'speed' ? `${Math.round(expected)}\\s*mph` : `${Math.abs(expected).toFixed(1)}°`));
  }
  await page.close();
});

test('Outcome keeps all five values visible and every parameter editable', { timeout: 60_000 }, async () => {
  const { page } = await open();
  await page.locator('#stage').waitFor();
  assert.equal(await page.locator('#parameterRail button').count(), 5);
  assert.equal(await page.locator('#spVal').getAttribute('aria-valuenow'), null);
  const edits = { speed: 107, face: -4.2, path: 3.1, attack: -2.4, dynLoft: 30.5 };
  for (const [key, value] of Object.entries(edits)) {
    const selector = page.locator(`#parameterRail button[data-param="${key}"]`);
    assert.equal(await selector.locator('.paramValue').count(), 1, `${key} has a visible value`);
    await selector.click();
    const input = page.locator(`#sl-${key}`);
    assert.equal(await input.isVisible(), true, `${key} has a real range input`);
    const box = await input.boundingBox();
    assert.ok(box && box.height >= 44, `${key} has a 44px interaction rail`);
    await input.fill(String(value));
    const stateValue = await page.evaluate(param => window.__impact.state[param], key);
    assert.ok(Math.abs(stateValue - value) < 0.001, `${key} updates state`);
    assert.equal(await page.locator('#parameterRail .paramValue').count(), 5);
  }
  await page.close();
});

test('Outcome chips update immediately and visibly', { timeout: 60_000 }, async () => {
  const { page, errors } = await open();
  await page.locator('#stage').waitFor();
  const chip = page.locator('.chip[data-metric="ballSpeed"]:visible').first();
  const beforeText = await chip.textContent();
  const signature = locator => locator.evaluate(element => {
    const box = getComputedStyle(element);
    const value = getComputedStyle(element.querySelector('.v'));
    return [box.backgroundColor, box.borderColor, box.boxShadow, box.transform, value.color].join('|');
  });
  const beforeVisual = await signature(chip);
  await page.locator('#sl-speed').fill('110');
  await page.waitForFunction(previous => {
    const element = document.querySelector('.chip[data-metric="ballSpeed"]');
    return element?.textContent !== previous && element.dataset.changed === 'true';
  }, beforeText, { timeout: 500 });
  assert.notEqual(await chip.textContent(), beforeText);
  assert.notEqual(await signature(chip), beforeVisual);
  assert.deepEqual(noFavicon(errors), []);
  await page.close();
});

test('screen-reader telemetry debounces rapid changes to the final shot', { timeout: 60_000 }, async () => {
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
      await new Promise(resolveDelay => setTimeout(resolveDelay, 45));
    }
    await new Promise(resolveDelay => setTimeout(resolveDelay, 450));
    observer.disconnect();
    return mutations;
  });
  assert.ok(mutationCount <= 2, `expected one settled announcement, saw ${mutationCount}`);
  await page.close();
});

test('no TARGET label appears in any lens', { timeout: 60_000 }, async () => {
  const { page } = await open();
  await page.locator('#stage').waitFor();
  for (const name of ['TOP', 'SIDE', 'OUTCOME']) {
    await station(page, name);
    await page.waitForTimeout(300);
    const labels = (await page.locator('#annoLabels').textContent()) || '';
    assert.doesNotMatch(labels, /target/i, `no TARGET in ${name}`);
  }
  await page.close();
});

for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 812 }]) {
  test(`primary controls stay contained at ${viewport.width}×${viewport.height}`, { timeout: 60_000 }, async () => {
    const { page, errors } = await open(viewport);
    await page.locator('#stage').waitFor();
    for (const name of ['OUTCOME', 'SIDE', 'TOP']) {
      await station(page, name);
      await page.waitForTimeout(100);
      const result = await page.evaluate(() => {
        const visible = [...document.querySelectorAll(
          '#panel, #panel input[type="range"], #outcomeBoard, #outcomeBoard .chip',
        )].filter(element => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden'
            && rect.width > 0 && rect.height > 0;
        });
        return {
          overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          outside: visible.map(element => ({
            id: element.id || element.dataset.metric || element.className,
            rect: element.getBoundingClientRect().toJSON(),
          })).filter(({ rect }) => rect.left < -1 || rect.right > innerWidth + 1
            || rect.top < -1 || rect.bottom > innerHeight + 1),
        };
      });
      assert.ok(result.overflowX <= 1, `${name}: no horizontal overflow`);
      assert.deepEqual(result.outside, [], `${name}: primary controls stay onscreen`);
    }
    assert.deepEqual(noFavicon(errors), []);
    await page.close();
  });
}
