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
import { selectOutcome } from '../impact-outcome.js';

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

const openWithRafProbe = async reducedMotion => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion,
  });
  await context.addInitScript(() => {
    const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
    let callbacks = 0;
    window.requestAnimationFrame = callback => nativeRequestAnimationFrame(timestamp => {
      callbacks += 1;
      callback(timestamp);
    });
    window.__rangeRafCallbacks = () => callbacks;
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(`page:${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console:${message.text()}`);
  });
  await page.goto(`${baseUrl}/impact.html`, { waitUntil: 'networkidle' });
  await page.locator('#stage').waitFor();
  return { context, page, errors };
};

const station = async (page, name) => {
  const selector = page.locator('.stations button', { hasText: new RegExp(`^${name}$`) });
  if (!await selector.isVisible()) await page.getByRole('button', { name: /^Change input$/i }).click();
  await selector.click();
};
const noFavicon = errors => errors.filter(error => !error.includes('favicon'));
const visibleRangeIds = page => page.locator('#panel input[type="range"]:visible')
  .evaluateAll(nodes => nodes.map(node => node.id).sort());
const renderedTracerBounds = page => page.locator('#scene').evaluate(canvas => {
  const context = canvas.getContext('2d');
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  let minX = pixels.width;
  let minY = pixels.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < pixels.height; y++) {
    for (let x = 0; x < pixels.width; x++) {
      const index = (y * pixels.width + x) * 4;
      if (pixels.data[index + 3] <= 128) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  const width = maxX >= minX ? maxX - minX + 1 : 0;
  const height = maxY >= minY ? maxY - minY + 1 : 0;
  return {
    canvasWidth: pixels.width,
    canvasHeight: pixels.height,
    widthRatio: width / pixels.width,
    heightRatio: height / pixels.height,
    leftGapRatio: minX / pixels.width,
    rightGapRatio: (pixels.width - maxX - 1) / pixels.width,
    topGapRatio: minY / pixels.height,
    bottomGapRatio: (pixels.height - maxY - 1) / pixels.height,
  };
});

test('Range idles under reduced motion while live input and normal camera motion still render',
  { timeout: 60_000 }, async () => {
    const reduced = await openWithRafProbe('reduce');
    await reduced.page.waitForTimeout(120);
    const reducedIdleStart = await reduced.page.evaluate(() => window.__rangeRafCallbacks());
    await reduced.page.waitForTimeout(300);
    const reducedIdleEnd = await reduced.page.evaluate(() => window.__rangeRafCallbacks());
    assert.ok(reducedIdleEnd - reducedIdleStart <= 1,
      `reduced-motion Range must stop rendering while idle; saw ${reducedIdleEnd - reducedIdleStart} frames`);

    const carryBefore = await reduced.page.locator('#fCarryNum').textContent();
    await reduced.page.getByRole('button', { name: /^Change input$/i }).click();
    await reduced.page.locator('#sl-speed').fill('110');
    await reduced.page.waitForFunction(previous => document.querySelector('#fCarryNum')?.textContent !== previous,
      carryBefore, { timeout: 500 });
    await reduced.page.waitForTimeout(80);
    const changedFrame = await reduced.page.locator('#scene').evaluate(canvas => canvas.toDataURL());
    const reducedSettleStart = await reduced.page.evaluate(() => window.__rangeRafCallbacks());
    await reduced.page.waitForTimeout(1000);
    const settledFrame = await reduced.page.locator('#scene').evaluate(canvas => canvas.toDataURL());
    const reducedSettleEnd = await reduced.page.evaluate(() => window.__rangeRafCallbacks());
    assert.equal(settledFrame, changedFrame,
      'reduced-motion Range must hold the final live-input frame');
    assert.ok(reducedSettleEnd - reducedSettleStart <= 1,
      `reduced-motion Range must settle after live input; saw ${reducedSettleEnd - reducedSettleStart} frames`);
    assert.deepEqual(noFavicon(reduced.errors), []);
    await reduced.context.close();

    const normal = await openWithRafProbe('no-preference');
    await normal.page.evaluate(() => {
      window.__impact.capture = true;
      window.__impact.trace.length = 0;
      window.__impact.setStation(1);
    });
    await normal.page.waitForTimeout(360);
    const motion = await normal.page.evaluate(() => ({
      callbacks: window.__rangeRafCallbacks(),
      stations: window.__impact.trace.map(sample => sample.station),
      station: window.__impact.state.station,
    }));
    assert.ok(motion.callbacks >= 4, `normal motion must keep rendering; saw ${motion.callbacks} frames`);
    assert.ok(new Set(motion.stations.map(value => value.toFixed(3))).size >= 3,
      'normal camera motion must render intermediate stations');
    assert.ok(motion.station > 0.9, `normal camera motion must approach Side; got ${motion.station}`);
    assert.deepEqual(noFavicon(normal.errors), []);
    await normal.context.close();
  });

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

test('Shot is the calm default; telemetry opens only on request', { timeout: 60_000 }, async () => {
  const { page, errors } = await open();
  await page.locator('#stage').waitFor();
  assert.equal(await page.locator('#stage').getAttribute('data-range-mode'), 'shot');
  assert.equal(await page.locator('#shotBrief').isVisible(), true);
  assert.match(await page.locator('#shotLine').textContent(), /Starts .* finishes/i);
  assert.equal(await page.locator('#outcomeBoard').isVisible(), false);
  assert.equal(await page.locator('#parameterRail').count(), 0);
  await page.getByRole('button', { name: /^Details$/i }).click();
  assert.equal(await page.locator('#stage').getAttribute('data-range-mode'), 'details');
  assert.equal(await page.locator('#detailReadouts .chip:visible').count(), 4);
  assert.deepEqual(noFavicon(errors), []);
  await page.close();
});

test('Shot annotations stay clear of the compact evidence brief', { timeout: 60_000 }, async () => {
  const readCollisions = page => page.evaluate(() => {
    const brief = document.querySelector('#shotBrief').getBoundingClientRect();
    return [...document.querySelectorAll('#annoLabels .annoLabel')]
      .filter(label => {
        const style = getComputedStyle(label);
        const rect = label.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden'
          && rect.width > 0 && rect.height > 0;
      })
      .map(label => ({ text: label.textContent.trim(), rect: label.getBoundingClientRect().toJSON() }))
      .filter(({ rect }) => rect.left < brief.right && rect.right > brief.left
        && rect.top < brief.bottom && rect.bottom > brief.top);
  });
  const readLabelViolations = page => page.evaluate(() => {
    const layer = document.querySelector('#annoLabels').getBoundingClientRect();
    const labels = [...document.querySelectorAll('#annoLabels .annoLabel')]
      .filter(label => {
        const style = getComputedStyle(label);
        const rect = label.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden'
          && rect.width > 0 && rect.height > 0;
      })
      .map(label => ({ text: label.textContent.trim(), rect: label.getBoundingClientRect().toJSON() }));
    const outOfBounds = labels.filter(({ rect }) => rect.left < layer.left - 0.5
      || rect.right > layer.right + 0.5 || rect.top < layer.top - 0.5
      || rect.bottom > layer.bottom + 0.5);
    const overlaps = [];
    for (let a = 0; a < labels.length; a++) for (let b = a + 1; b < labels.length; b++) {
      const x = labels[a].rect;
      const y = labels[b].rect;
      if (x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top) {
        overlaps.push([labels[a].text, labels[b].text]);
      }
    }
    return { outOfBounds, overlaps };
  });

  for (const viewport of [
    { width: 375, height: 812 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ]) {
    const { page, errors } = await open(viewport);
    await page.locator('#stage').waitFor();
    await page.waitForFunction(() => document.querySelectorAll('#annoLabels .annoLabel').length > 0);
    const collisions = await readCollisions(page);
    assert.deepEqual(collisions, [], `${viewport.width}×${viewport.height}: labels clear the shot brief`);

    if (viewport.width === 430) {
      await page.evaluate(() => { window.__impact.state.attack = 15; });
      await page.waitForTimeout(80);
      assert.deepEqual(await readCollisions(page), [], '430×932 high-Attack labels clear the shot brief');
    }

    if (viewport.width === 375) {
      await page.evaluate(() => {
        Object.assign(window.__impact.state, {
          speed: 150, face: -15, path: 15, attack: -15, dynLoft: 25,
        });
        window.__impact.setRangeMode('change');
        window.__impact.setStation(2, false);
        window.__impact.setRangeMode('shot');
      });
      await page.waitForTimeout(80);
      assert.deepEqual(await readCollisions(page), [],
        '375×812 extreme Top → Shot labels clear the shot brief');
      assert.deepEqual(await readLabelViolations(page), { outOfBounds: [], overlaps: [] },
        '375×812 extreme Top → Shot labels stay separate and inside the annotation layer');

      await page.evaluate(() => {
        Object.assign(window.__impact.state, {
          speed: 150, face: 15, path: -15, attack: 0, dynLoft: 25,
        });
        window.__impact.setRangeMode('change');
        window.__impact.setStation(2, false);
        window.__impact.setRangeMode('shot');
      });
      await page.waitForTimeout(80);
      assert.deepEqual(await readLabelViolations(page), { outOfBounds: [], overlaps: [] },
        '375×812 mirrored extreme keeps every rendered label inside the annotation layer');
    }
    assert.deepEqual(noFavicon(errors), []);
    await page.close();
  }
});

test('the pin control reads Pin comparison', { timeout: 60_000 }, async () => {
  const { page } = await open();
  await page.locator('#stage').waitFor();
  const fab = page.getByRole('button', { name: /^Pin comparison$/i });
  assert.equal(await fab.count(), 1);
  assert.equal(await fab.getAttribute('aria-label'), 'Pin comparison');
  await page.close();
});

test('Carry is a permanent large left-side readout in every lens', { timeout: 60_000 }, async () => {
  const { page, errors } = await open({ width: 430, height: 932 });
  await page.locator('#stage').waitFor();
  const expected = Math.round(selectOutcome({
    speed: 90, face: 2, path: 0, attack: 3, dynLoft: 24,
  }).m.carry);

  for (const lens of [
    { name: 'FLIGHT', station: 0 },
    { name: 'SIDE', station: 1 },
    { name: 'TOP', station: 2 },
  ]) {
    await page.evaluate(value => window.__impact.setStation(value, false), lens.station);
    await page.waitForTimeout(80);
    const readout = await page.locator('#fCarryStack').evaluate(node => {
      const stage = document.querySelector('#stage').getBoundingClientRect();
      const rect = node.getBoundingClientRect();
      const value = node.querySelector('#fCarryNum');
      return {
        text: value.textContent.trim(),
        fontSize: Number.parseFloat(getComputedStyle(value).fontSize),
        left: rect.left - stage.left,
        visible: rect.width > 0 && rect.height > 0,
      };
    });
    assert.equal(readout.visible, true, `${lens.name}: Carry must remain visible`);
    assert.equal(readout.text, String(expected), `${lens.name}: Carry must show the live outcome`);
    assert.ok(readout.fontSize >= 36, `${lens.name}: Carry must be a large readout`);
    assert.ok(readout.left >= 8 && readout.left <= 20, `${lens.name}: Carry must stay on the left`);
  }

  await page.evaluate(() => { window.__impact.state.speed = 95; });
  await page.waitForTimeout(80);
  const updated = Math.round(selectOutcome({
    speed: 95, face: 2, path: 0, attack: 3, dynLoft: 24,
  }).m.carry);
  assert.equal(await page.locator('#fCarryNum').textContent(), String(updated));
  assert.deepEqual(noFavicon(errors), []);
  await page.close();
});

test('Pin comparison crosses to the left without covering Carry when a tracer reaches it', { timeout: 60_000 }, async () => {
  // The in-app browser's visible content area is substantially shorter than
  // the physical phone screen once its address and action bars are present.
  const { page, errors } = await open({ width: 430, height: 740 });
  await page.locator('#stage').waitFor();

  const setTopShot = values => page.evaluate(next => {
    Object.assign(window.__impact.state, next);
    window.__impact.setStation(2, false);
  }, values);
  const layout = () => page.evaluate(() => {
    const pin = document.querySelector('#pinFab');
    const carry = document.querySelector('#fCarryStack');
    const pinRect = pin.getBoundingClientRect();
    const carryRect = carry.getBoundingClientRect();
    return {
      side: pin.dataset.side,
      overlapsCarry: pinRect.left < carryRect.right && pinRect.right > carryRect.left
        && pinRect.top < carryRect.bottom && pinRect.bottom > carryRect.top,
    };
  });

  await setTopShot({ speed: 95, dynLoft: 24, attack: 3, face: -15, path: 0 });
  await page.waitForTimeout(160);
  assert.equal((await layout()).side, 'right', 'a left tracer leaves the right-side Pin clear');

  await setTopShot({ speed: 95, dynLoft: 24, attack: 3, face: 15, path: 0 });
  await page.waitForTimeout(240);
  const moved = await layout();
  const rightShot = selectOutcome({ speed: 95, dynLoft: 24, attack: 3, face: 15, path: 0 });
  const evidence = await page.evaluate(points => {
    const stage = document.querySelector('#stage').getBoundingClientRect();
    const pin = document.querySelector('#pinFab').getBoundingClientRect();
    const projected = points.map(point => window.__impact.projectPoint(point)).filter(Boolean);
    return {
      rightZone: { x: stage.width - 12 - pin.width, y: 12, w: pin.width, h: pin.height },
      tracer: {
        minX: Math.min(...projected.map(point => point.x)),
        maxX: Math.max(...projected.map(point => point.x)),
        minY: Math.min(...projected.map(point => point.y)),
        maxY: Math.max(...projected.map(point => point.y)),
      },
      labels: [...document.querySelectorAll('#annoLabels .annoLabel:not([hidden])')].map(label => {
        const rect = label.getBoundingClientRect();
        return {
          text: label.textContent,
          x: rect.left - stage.left,
          y: rect.top - stage.top,
          w: rect.width,
          h: rect.height,
        };
      }),
    };
  }, rightShot.path);
  assert.equal(moved.side, 'left', `a right tracer moves Pin to the opposite side ${JSON.stringify(evidence)}`);
  assert.equal(moved.overlapsCarry, false, 'the left Pin position must sit clear of Carry');

  const relocated = await page.evaluate(points => {
    const stage = document.querySelector('#stage').getBoundingClientRect();
    const pin = document.querySelector('#pinFab').getBoundingClientRect();
    const zone = {
      x0: pin.left - stage.left - 6,
      y0: pin.top - stage.top - 6,
      x1: pin.right - stage.left + 6,
      y1: pin.bottom - stage.top + 6,
    };
    return points.map(point => window.__impact.projectPoint(point)).filter(Boolean)
      .some(point => point.x >= zone.x0 && point.x <= zone.x1
        && point.y >= zone.y0 && point.y <= zone.y1);
  }, rightShot.path);
  assert.equal(relocated, false, 'the relocated Pin must clear the active tracer');

  await setTopShot({ speed: 95, dynLoft: 24, attack: 3, face: -15, path: 0 });
  let returned = await layout();
  for (let waited = 0; returned.side !== 'right' && waited < 900; waited += 60) {
    await page.waitForTimeout(60);
    returned = await layout();
  }
  assert.equal(returned.side, 'right', 'Pin returns right within 900 ms after the collision clears');

  // A pinned comparison is drawn as a ghost tracer and must reserve the same
  // HUD space as the active shot. Keep the live shot clear on the left while
  // the ghost alone crosses the canonical right-hand Pin position.
  await page.setViewportSize({ width: 430, height: 650 });
  await page.evaluate(({ active, ghostParams, ghostOutcome }) => {
    Object.assign(window.__impact.state, active);
    window.__impact.state.pins.splice(0, window.__impact.state.pins.length, {
      params: ghostParams,
      outcome: ghostOutcome,
    });
    window.__impact.setStation(2, false);
  }, {
    active: { speed: 95, dynLoft: 24, attack: 3, face: -15, path: 0 },
    ghostParams: { speed: 95, dynLoft: 24, attack: 3, face: 15, path: 0 },
    ghostOutcome: rightShot,
  });
  await page.waitForTimeout(240);
  const ghostMoved = await layout();
  assert.equal(ghostMoved.side, 'left', 'a ghost tracer also moves Pin to the opposite side');
  assert.equal(ghostMoved.overlapsCarry, false, 'the ghost-triggered fallback must sit clear of Carry');

  await page.evaluate(() => { window.__impact.state.pins.splice(0); });
  assert.deepEqual(noFavicon(errors), []);
  await page.close();
});

test('Flight is a Change lens, while Shot remains the default surface', { timeout: 60_000 }, async () => {
  const { page, errors } = await open();
  await page.locator('#stage').waitFor();
  assert.equal(await page.locator('#stseg').isVisible(), false);
  assert.equal(await page.locator('#stage').getAttribute('data-range-mode'), 'shot');
  await page.getByRole('button', { name: /^Change input$/i }).click();
  assert.deepEqual(
    (await page.locator('#stseg button').allTextContents()).map(value => value.trim()),
    ['TOP', 'SIDE', 'FLIGHT'],
  );
  const flight = page.getByRole('button', { name: /^FLIGHT$/i });
  assert.equal(await flight.getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#stage').getAttribute('data-lens'), 'outcome');
  assert.equal(await page.locator('#stage').getAttribute('data-tracer'), 'on');
  assert.equal(await page.locator('#replayFlight').count(), 0);
  assert.equal(await page.locator('#stseg button', { hasText: /^OUTCOME$/i }).count(), 0);
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

    await station(page, 'FLIGHT');
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
    assert.equal(restored.tracer, 'on');
    assert.ok(restored.canvasBottom <= restored.stageBottom, 'Flight canvas remains contained by the stage');
    assert.ok(restored.labelLayerBottom <= restored.stageBottom, 'Flight label layer remains contained by the stage');

    assert.deepEqual(noFavicon(errors), []);
    await page.close();
  });
}

test('settled Side and Top use the available tracer canvas', { timeout: 60_000 }, async () => {
  const { page, errors } = await open({ width: 390, height: 844 });
  await page.locator('#stage').waitFor();
  const failures = [];

  for (const lens of [
    { name: 'SIDE', station: 1, minWidth: 0.68, minHeight: 0.29 },
    { name: 'TOP', station: 2, minWidth: 0.24, minHeight: 0.60 },
  ]) {
    await page.evaluate(stationValue => window.__impact.setStation(stationValue, false), lens.station);
    await page.waitForTimeout(100);
    const bounds = await renderedTracerBounds(page);
    if (bounds.widthRatio < lens.minWidth) failures.push(`${lens.name}: tracer is too narrow ${JSON.stringify(bounds)}`);
    if (bounds.heightRatio < lens.minHeight) failures.push(`${lens.name}: tracer is too short ${JSON.stringify(bounds)}`);
    if (bounds.bottomGapRatio > 0.12) failures.push(`${lens.name}: tracer sits too high ${JSON.stringify(bounds)}`);
  }

  assert.deepEqual(failures, []);
  assert.deepEqual(noFavicon(errors), []);
  await page.close();
});

test('Side and Top remain framed from 60 to 150 mph', { timeout: 60_000 }, async () => {
  const { page, errors } = await open({ width: 390, height: 844 });
  await page.locator('#stage').waitFor();
  const failures = [];

  for (const speed of [60, 90, 110, 130, 150]) {
    await page.evaluate(value => { window.__impact.state.speed = value; }, speed);
    for (const lens of [{ name: 'SIDE', station: 1 }, { name: 'TOP', station: 2 }]) {
      await page.evaluate(stationValue => window.__impact.setStation(stationValue, false), lens.station);
      await page.waitForTimeout(150);
      const bounds = await renderedTracerBounds(page);
      const id = `${lens.name} ${speed} mph`;
      if (bounds.leftGapRatio < 0.02 || bounds.rightGapRatio < 0.02) {
        failures.push(`${id}: tracer clips horizontally ${JSON.stringify(bounds)}`);
      }
      if (bounds.topGapRatio < 0.02 || bounds.bottomGapRatio < 0.02) {
        failures.push(`${id}: tracer clips vertically ${JSON.stringify(bounds)}`);
      }
      if (bounds.bottomGapRatio > 0.14) {
        failures.push(`${id}: tracer sits too high ${JSON.stringify(bounds)}`);
      }
    }
  }

  assert.deepEqual(failures, []);
  assert.deepEqual(noFavicon(errors), []);
  await page.close();
});

test('animated Outcome travel keeps the tracer visible into Side and Top', { timeout: 60_000 }, async () => {
  const { page, errors } = await open({ width: 390, height: 844 });
  await page.locator('#stage').waitFor();
  const failures = [];

  for (const lens of [{ name: 'SIDE', station: 1 }, { name: 'TOP', station: 2 }]) {
    await page.evaluate(() => window.__impact.setStation(0, false));
    await page.waitForTimeout(50);
    const immediate = await page.evaluate(stationValue => {
      window.__impact.setStation(stationValue);
      return {
        tracer: document.querySelector('#stage').dataset.tracer,
        impact: window.__impact.projectPoint({ x: 0, y: 0, z: 0 }),
      };
    }, lens.station);
    if (immediate.tracer !== 'on' || !immediate.impact) {
      failures.push(`${lens.name}: impact is missing when tracer turns on ${JSON.stringify(immediate)}`);
    }
    for (let frame = 0; frame < 12; frame++) {
      await page.waitForTimeout(24);
      const bounds = await renderedTracerBounds(page);
      const impact = await page.evaluate(() => window.__impact.projectPoint({ x: 0, y: 0, z: 0 }));
      if (bounds.widthRatio < 0.05 || bounds.heightRatio < 0.05) {
        failures.push(`${lens.name} frame ${frame}: tracer disappeared ${JSON.stringify(bounds)}`);
      }
      if (!impact || impact.x < 0 || impact.x > bounds.canvasWidth || impact.y < 0 || impact.y > bounds.canvasHeight) {
        failures.push(`${lens.name} frame ${frame}: impact left the canvas ${JSON.stringify(impact)}`);
      }
    }
  }

  assert.deepEqual(failures, []);
  assert.deepEqual(noFavicon(errors), []);
  await page.close();
});

test('extreme live trajectories remain projected inside Side and Top', { timeout: 60_000 }, async () => {
  const { page, errors } = await open({ width: 390, height: 844 });
  await page.locator('#stage').waitFor();
  const failures = [];
  const scenarios = [
    { name: 'historical overflow', speed: 130, dynLoft: 24, attack: 3, face: 2.2, path: -12.4 },
    { name: 'wide miss', speed: 150, dynLoft: 24, attack: 3, face: 15, path: -15 },
    { name: 'high apex', speed: 150, dynLoft: 50, attack: -15, face: 0, path: 0 },
  ];

  for (const scenario of scenarios) {
    await page.evaluate(values => Object.assign(window.__impact.state, values), scenario);
    const outcome = selectOutcome(scenario);
    for (const lens of [{ name: 'SIDE', station: 1 }, { name: 'TOP', station: 2 }]) {
      await page.evaluate(stationValue => window.__impact.setStation(stationValue, false), lens.station);
      await page.waitForTimeout(100);
      const projection = await page.evaluate(points => {
        const canvas = document.querySelector('#scene');
        return {
          width: canvas.clientWidth,
          height: canvas.clientHeight,
          points: points.map(point => window.__impact.projectPoint(point)),
        };
      }, outcome.path);
      const outside = projection.points.filter(point => !point
        || point.x < 8 || point.x > projection.width - 8
        || point.y < 8 || point.y > projection.height - 8);
      if (outside.length) {
        failures.push(`${scenario.name} ${lens.name}: ${outside.length}/${projection.points.length} path points outside`);
      }
    }
  }

  assert.deepEqual(failures, []);
  assert.deepEqual(noFavicon(errors), []);
  await page.close();
});

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
  await page.getByRole('button', { name: /^Change input$/i }).click();
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

test('Change keeps all five values visible and every parameter editable', { timeout: 60_000 }, async () => {
  const { page } = await open();
  await page.locator('#stage').waitFor();
  await page.getByRole('button', { name: /^Change input$/i }).click();
  assert.equal(await page.locator('#parameterRail button').count(), 5);
  assert.equal(await page.locator('#spVal').getAttribute('aria-valuenow'), null);
  assert.equal(await page.locator('.controlValue').getAttribute('aria-valuenow'), null,
    'the read-only output must not expose unsupported range semantics');
  assert.equal(await page.locator('.controlValue').getAttribute('aria-valuetext'), null,
    'the real range input owns slider value semantics');
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

test('Shot evidence updates immediately after a controlled change', { timeout: 60_000 }, async () => {
  const { page, errors } = await open();
  await page.locator('#stage').waitFor();
  const beforeText = await page.locator('#shotProof').textContent();
  await page.getByRole('button', { name: /^Change input$/i }).click();
  await page.locator('#sl-speed').fill('110');
  await page.waitForFunction(previous => {
    const element = document.querySelector('#shotProof');
    return element?.textContent !== previous;
  }, beforeText, { timeout: 500 });
  assert.notEqual(await page.locator('#shotProof').textContent(), beforeText);
  assert.deepEqual(noFavicon(errors), []);
  await page.close();
});

test('screen-reader telemetry debounces rapid changes to the final shot', { timeout: 60_000 }, async () => {
  const { page } = await open();
  await page.locator('#stage').waitFor();
  await page.getByRole('button', { name: /^Change input$/i }).click();
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
  for (const name of ['TOP', 'SIDE', 'FLIGHT']) {
    await station(page, name);
    await page.waitForTimeout(300);
    const labels = (await page.locator('#annoLabels').textContent()) || '';
    assert.doesNotMatch(labels, /target/i, `no TARGET in ${name}`);
  }
  await page.close();
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 375, height: 812 },
  { width: 430, height: 740 },
]) {
  test(`primary controls stay contained at ${viewport.width}×${viewport.height}`, { timeout: 60_000 }, async () => {
    const { page, errors } = await open(viewport);
    await page.locator('#stage').waitFor();
    for (const name of ['FLIGHT', 'SIDE', 'TOP']) {
      await station(page, name);
      await page.waitForTimeout(100);
      const result = await page.evaluate(() => {
        const visible = [...document.querySelectorAll(
          '#panel, #panel input[type="range"], #outcomeBoard, #outcomeBoard .chip, #fCarryStack, #pinFab',
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
