/**
 * Mechanics Lab browser contract.
 *
 * This is intentionally the RED half of Task 2. It describes the public DOM,
 * live-input, accessibility, motion, and responsive behavior that replaces the
 * legacy Impact Studio surface. Rendering quality remains a screenshot concern.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdirSync, readFile, readFileSync } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium, webkit } = require('../tools/node_modules/playwright-core');
const WEBKIT = process.env.FG_ENGINE === 'webkit' || process.argv.includes('--project=webkit');
const ENGINE = WEBKIT ? 'webkit' : 'chromium';
const EVIDENCE_DIR = resolve(ROOT, 'outputs', 'flightglass-gates', 'impact-studio');
const STUDIO_SOURCE = readFileSync(resolve(ROOT, 'impact-studio.html'), 'utf8');
const OUTCOMES = ['start', 'curve', 'launch', 'backspin', 'apex', 'carry'];
const DELIVERY_INPUTS = ['delivery-face', 'delivery-path', 'delivery-attack', 'delivery-loft'];
const ARC_INPUTS = ['arc-low-point', 'arc-height', 'arc-direction', 'arc-plane'];
const PERSISTENT_CONTROL_NAMES = [
  { role: 'link', name: 'Home' },
  { role: 'button', name: 'Impact Inputs' },
  { role: 'button', name: 'Arc Inputs' },
  { role: 'button', name: 'Reset active inputs' },
];
const MODE_CONTROL_NAMES = {
  delivery: [
    { role: 'slider', name: 'Face Angle' },
    { role: 'slider', name: 'Club Path' },
    { role: 'slider', name: 'Attack Angle' },
    { role: 'slider', name: 'Dynamic Loft' },
  ],
  arc: [
    { role: 'slider', name: 'Low Point X' },
    { role: 'slider', name: 'Low Point Height' },
    { role: 'slider', name: 'Swing Direction' },
    { role: 'slider', name: 'Swing Plane' },
    { role: 'button', name: 'Use in Impact Inputs' },
  ],
};
const SCENARIOS = [
  { label: '932x430, normal motion', viewport: { width: 932, height: 430 }, reducedMotion: 'no-preference' },
  { label: '812x375, normal motion', viewport: { width: 812, height: 375 }, reducedMotion: 'no-preference' },
  { label: '430x932, normal motion', viewport: { width: 430, height: 932 }, reducedMotion: 'no-preference' },
  { label: '375x812, normal motion', viewport: { width: 375, height: 812 }, reducedMotion: 'no-preference' },
  { label: '932x430, reduced motion', viewport: { width: 932, height: 430 }, reducedMotion: 'reduce' },
  { label: '812x375, reduced motion', viewport: { width: 812, height: 375 }, reducedMotion: 'reduce' },
  { label: '430x932, reduced motion', viewport: { width: 430, height: 932 }, reducedMotion: 'reduce' },
  { label: '375x812, reduced motion', viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' },
];

mkdirSync(EVIDENCE_DIR, { recursive: true });

let server;
let browser;
let baseUrl;

const contentType = file => ({
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
}[extname(file).toLowerCase()] || 'application/octet-stream');

before(async () => {
  const canvasAnnotationSizes = [...STUDIO_SOURCE.matchAll(/context\.font\s*=\s*`600 (\d+)px/g)]
    .map(match => Number(match[1]));
  assert.deepEqual(canvasAnnotationSizes, [10, 10, 10],
    'all three Canvas UI annotations use the documented 10px type floor');
  assert.doesNotMatch(STUDIO_SOURCE, /context\.font\s*=\s*`[^`]*\b(?:8|9)px/,
    'Canvas UI annotations never fall below the documented 10px type floor');

  server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const relativePath = pathname === '/' ? 'impact-studio.html' : pathname.replace(/^\/+/, '');
    const file = resolve(ROOT, relativePath);
    const rootPrefix = `${ROOT}${sep}`.toLowerCase();

    if (file.toLowerCase() !== ROOT.toLowerCase()
      && !`${file}${sep}`.toLowerCase().startsWith(rootPrefix)) {
      response.writeHead(403).end('forbidden');
      return;
    }

    readFile(file, (error, data) => {
      if (error) {
        response.writeHead(404).end('not found');
        return;
      }
      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': contentType(file),
      });
      response.end(data);
    });
  });

  await new Promise((accept, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', accept);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  if (WEBKIT) browser = await webkit.launch({ headless: true });
  else {
    browser = await chromium.launch({ channel: 'msedge', headless: true })
      .catch(() => chromium.launch({ channel: 'chrome', headless: true }))
      .catch(() => chromium.launch({ headless: true }));
  }
});

after(async () => {
  await browser?.close();
  await new Promise(accept => server?.close(accept));
});

async function open({ viewport, reducedMotion }) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    reducedMotion,
  });
  const page = await context.newPage();
  const errors = [];

  page.setDefaultTimeout(5_000);
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });

  await page.goto(`${baseUrl}/impact-studio.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return { context, page, errors };
}

const trimmedText = locator => locator.textContent().then(value => value?.trim() || '');

async function captureState(page, scenario, mode) {
  const motion = scenario.reducedMotion === 'reduce' ? 'reduced' : 'normal';
  const viewport = `${scenario.viewport.width}x${scenario.viewport.height}`;
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.evaluate(() => new Promise(requestAnimationFrame));
  await page.screenshot({
    path: resolve(EVIDENCE_DIR, `${ENGINE}--${viewport}--${motion}--${mode}.png`),
    fullPage: false,
    animations: 'disabled',
  });
}

async function assertMode(page, mode) {
  const root = page.locator('main.mechanics');
  const activeButton = page.locator(`button[data-mechanics-mode="${mode}"]`);
  const inactiveMode = mode === 'delivery' ? 'arc' : 'delivery';
  const inactiveButton = page.locator(`button[data-mechanics-mode="${inactiveMode}"]`);

  assert.equal(await root.count(), 1, 'one Mechanics Lab root exists');
  assert.equal(await root.getAttribute('data-mechanics-mode'), mode, `root authority is ${mode}`);
  assert.equal(await activeButton.count(), 1, `${mode} mode has one semantic button`);
  assert.equal(await activeButton.getAttribute('aria-pressed'), 'true', `${mode} button is pressed`);
  assert.equal(await inactiveButton.getAttribute('aria-pressed'), 'false', `${inactiveMode} button is not pressed`);
}

async function assertPersistentFlightAndOutcomes(page) {
  const flight = page.locator('#flight-canvas');
  assert.equal(await flight.count(), 1, 'the persistent flight canvas exists');
  assert.equal(await flight.isVisible(), true, 'the flight remains visible in the active mode');
  const flightBox = await flight.boundingBox();
  assert.ok(flightBox && flightBox.width > 0 && flightBox.height > 0, 'the flight canvas has rendered size');

  assert.equal(await page.locator('[data-outcome]').count(), OUTCOMES.length,
    'the telemetry rail contains exactly six outcomes');
  for (const outcome of OUTCOMES) {
    const readout = page.locator(`[data-outcome="${outcome}"]`);
    assert.equal(await readout.count(), 1, `${outcome} has one readout`);
    assert.equal(await readout.isVisible(), true, `${outcome} stays visible`);
    assert.match(await trimmedText(readout), /\d/, `${outcome} is a live numeric value`);
  }

  const cause = page.locator('[data-cause]');
  assert.equal(await cause.count(), 1, 'one factual causal sentence exists');
  assert.match(await trimmedText(cause), /Face|Path|Attack|loft|Low point|direction|plane/i,
    'the causal sentence names a mechanics input');
}

async function assertInputSet(page, ids) {
  for (const id of ids) {
    const input = page.locator(`#${id}`);
    assert.equal(await input.count(), 1, `#${id} exists`);
    assert.equal(await input.isVisible(), true, `#${id} is visible in its authority mode`);
    assert.equal(await input.evaluate(element => element.matches('input, select, textarea')), true,
      `#${id} uses a native keyboard-operable form control`);
  }
}

async function assertVisibleControlContract(page, label) {
  const controls = page.locator([
    'main.mechanics button',
    'main.mechanics input',
    'main.mechanics select',
    'main.mechanics textarea',
    'main.mechanics a[href]',
  ].join(','));
  const audit = await controls.evaluateAll(elements => elements
    .filter(element => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return box.width > 0 && box.height > 0
        && style.display !== 'none' && style.visibility !== 'hidden';
    })
    .map(element => {
      const box = element.getBoundingClientRect();
      return {
        name: element.getAttribute('aria-label')
          || element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 60)
          || element.id
          || element.tagName.toLowerCase(),
        disabled: Boolean(element.disabled),
        tabIndex: element.tabIndex,
        height: box.height,
      };
    }));

  assert.ok(audit.length >= 7, `${label} exposes its four inputs and persistent actions`);
  for (const control of audit) {
    assert.equal(control.disabled, false, `${label}: ${control.name} is enabled`);
    assert.ok(control.tabIndex >= 0, `${label}: ${control.name} is reachable by keyboard`);
    assert.ok(control.height >= 44,
      `${label}: ${control.name} target is ${control.height.toFixed(1)}px high; expected at least 44px`);
  }

  // Focusing every visible item catches custom controls that merely resemble
  // buttons but are not actually focusable. Activation is exercised below.
  for (let index = 0; index < await controls.count(); index += 1) {
    const control = controls.nth(index);
    if (await control.isVisible()) {
      await control.focus();
      assert.equal(await control.evaluate(element => document.activeElement === element), true,
        `${label}: visible control ${index + 1} accepts keyboard focus`);
    }
  }
}

async function assertAccessibleControlNames(page, mode, label) {
  const expected = [...PERSISTENT_CONTROL_NAMES, ...MODE_CONTROL_NAMES[mode]];
  const mechanics = page.locator('main.mechanics');
  const visibleControls = page.locator([
    'main.mechanics button:visible',
    'main.mechanics input:visible',
    'main.mechanics select:visible',
    'main.mechanics textarea:visible',
    'main.mechanics a[href]:visible',
  ].join(','));

  assert.equal(await visibleControls.count(), expected.length,
    `${label}: every visible interactive Mechanics control is covered by the accessible-name contract`);
  for (const { role, name } of expected) {
    const control = mechanics.getByRole(role, { name, exact: true });
    assert.equal(await control.count(), 1,
      `${label}: ${role} "${name}" resolves through Playwright's accessible-name algorithm`);
    assert.equal(await control.isVisible(), true, `${label}: ${role} "${name}" is visible`);
  }
}

async function assertKeyboardFocusVisible(page, selector, label) {
  const target = page.locator(selector);
  assert.equal(await target.count(), 1, `${label}: focus target exists`);

  await page.evaluate(() => {
    document.body.setAttribute('tabindex', '-1');
    document.body.focus();
  });

  const tabLimit = await page.locator([
    'main.mechanics button',
    'main.mechanics input',
    'main.mechanics select',
    'main.mechanics textarea',
    'main.mechanics a[href]',
  ].join(',')).count() + 2;
  let reached = false;
  for (let step = 0; step < tabLimit; step += 1) {
    await page.keyboard.press('Tab');
    reached = await target.evaluate(element => document.activeElement === element);
    if (reached) break;
  }

  const focus = await target.evaluate(element => {
    const style = getComputedStyle(element);
    return {
      active: document.activeElement === element,
      focusVisible: element.matches(':focus-visible'),
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      boxShadow: style.boxShadow,
    };
  });
  await page.evaluate(() => document.body.removeAttribute('tabindex'));

  assert.equal(reached && focus.active, true, `${label}: keyboard traversal reaches ${selector}`);
  assert.equal(focus.focusVisible, true, `${label}: ${selector} matches :focus-visible after Tab`);
  const visiblyStyled = (focus.outlineStyle !== 'none' && focus.outlineWidth !== '0px')
    || focus.boxShadow !== 'none';
  assert.equal(visiblyStyled, true,
    `${label}: computed focus treatment is visible (outline=${focus.outlineStyle} ${focus.outlineWidth}; box-shadow=${focus.boxShadow})`);
}

async function assertNoOverflow(page, label) {
  const widths = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  assert.ok(widths.document <= widths.viewport + 1,
    `${label}: document overflows horizontally by ${widths.document - widths.viewport}px`);
  assert.ok(widths.body <= widths.viewport + 1,
    `${label}: body overflows horizontally by ${widths.body - widths.viewport}px`);
}

async function assertLiveRegionsSeparated(page, label) {
  const audit = await page.evaluate(() => {
    const box = selector => {
      const rect = document.querySelector(selector)?.getBoundingClientRect();
      return rect ? { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left } : null;
    };
    const values = [...document.querySelectorAll('[data-outcome]')].map(output => {
      const cell = output.closest('.telemetry__cell');
      const outputRect = output.getBoundingClientRect();
      const cellRect = cell.getBoundingClientRect();
      return {
        name: output.dataset.outcome,
        fitsText: output.scrollWidth <= output.clientWidth + 1,
        contained: outputRect.left >= cellRect.left - 1
          && outputRect.right <= cellRect.right + 1
          && outputRect.top >= cellRect.top - 1
          && outputRect.bottom <= cellRect.bottom + 1,
        cell: { top: cellRect.top, right: cellRect.right, bottom: cellRect.bottom, left: cellRect.left },
      };
    });
    return {
      viewport: { width: innerWidth, height: innerHeight },
      facts: box('.facts'),
      trajectory: box('.instrument__trajectory'),
      telemetry: box('.telemetry'),
      shell: box('.sa-app-nav'),
      values,
    };
  });

  assert.ok(audit.facts && audit.trajectory && audit.telemetry && audit.shell,
    `${label}: trajectory, facts, telemetry and shell exist`);
  assert.ok(audit.shell.top >= -1 && audit.shell.bottom <= audit.viewport.height + 1,
    `${label}: shell stays visible inside the ${audit.viewport.width}×${audit.viewport.height} viewport`);
  assert.ok(audit.telemetry.top >= -1 && audit.telemetry.bottom <= audit.viewport.height + 1,
    `${label}: complete telemetry strip stays inside the viewport`);
  assert.ok(audit.trajectory.bottom <= audit.telemetry.top + 1,
    `${label}: trajectory ends before telemetry starts`);
  assert.ok(audit.trajectory.right <= audit.facts.left + 1 || audit.facts.right <= audit.trajectory.left + 1,
    `${label}: trajectory and Cause Trace occupy distinct horizontal regions`);
  assert.ok(audit.facts.bottom <= audit.telemetry.top + 1,
    `${label}: Cause Trace ends at ${audit.facts.bottom.toFixed(1)} before telemetry starts at ${audit.telemetry.top.toFixed(1)}`);
  assert.ok(audit.telemetry.bottom <= audit.shell.top + 1,
    `${label}: telemetry ends at ${audit.telemetry.bottom.toFixed(1)} before shell starts at ${audit.shell.top.toFixed(1)}`);
  for (const value of audit.values) {
    assert.equal(value.fitsText, true, `${label}: ${value.name} text fits inside its own cell`);
    assert.equal(value.contained, true, `${label}: ${value.name} remains inside its own cell`);
  }

  const rows = new Map();
  for (const value of audit.values) {
    const key = Math.round(value.cell.top);
    rows.set(key, [...(rows.get(key) || []), value]);
  }
  for (const row of rows.values()) {
    row.sort((left, right) => left.cell.left - right.cell.left);
    for (let index = 1; index < row.length; index += 1) {
      assert.ok(row[index - 1].cell.right <= row[index].cell.left + 1,
        `${label}: ${row[index - 1].name} and ${row[index].name} cells do not collide`);
    }
  }
}

async function assertPortraitInstrumentAboveEvidence(page, scenario, mode) {
  if (scenario.viewport.width > 480) return;

  const audit = await page.evaluate(() => {
    const rect = selector => {
      const box = document.querySelector(selector)?.getBoundingClientRect();
      return box ? {
        top: box.top,
        right: box.right,
        bottom: box.bottom,
        left: box.left,
        width: box.width,
        height: box.height,
      } : null;
    };
    const facts = rect('.facts');
    const trajectory = rect('.instrument__trajectory');
    return {
      instrument: rect('.instrument'),
      lenses: [...document.querySelectorAll('.instrument__lens')].map(lens => {
        const box = lens.getBoundingClientRect();
        const canvas = lens.querySelector('canvas');
        return {
          top: box.top,
          bottom: box.bottom,
          width: box.width,
          height: box.height,
          canvasWidth: canvas?.width || 0,
          canvasHeight: canvas?.height || 0,
        };
      }),
      evidenceTop: Math.min(facts?.top ?? Infinity, trajectory?.top ?? Infinity),
    };
  });

  assert.ok(audit.instrument && audit.instrument.width > 0 && audit.instrument.height > 0,
    `${scenario.label}, ${mode}: the paired instrument has rendered size`);
  assert.ok(audit.instrument.bottom <= audit.evidenceTop + 1,
    `${scenario.label}, ${mode}: instrument ends at ${audit.instrument.bottom.toFixed(1)} before evidence starts at ${audit.evidenceTop.toFixed(1)}`);
  assert.equal(audit.lenses.length, 2, `${scenario.label}, ${mode}: both mechanics lenses render`);
  for (const [index, lens] of audit.lenses.entries()) {
    assert.ok(lens.width > 0 && lens.height > 0,
      `${scenario.label}, ${mode}: lens ${index + 1} has rendered size`);
    assert.ok(lens.bottom <= audit.evidenceTop + 1,
      `${scenario.label}, ${mode}: lens ${index + 1} stays above the evidence row`);
    assert.ok(lens.canvasWidth > 0 && lens.canvasHeight > 0,
      `${scenario.label}, ${mode}: lens ${index + 1} Canvas has drawable dimensions`);
  }
}

async function assertCompactReference(page, scenario, mode) {
  const reference = page.locator('.compact-reference');
  const compact = scenario.viewport.width <= 480 || scenario.viewport.height <= 500;
  const shouldShow = compact && mode === 'arc';

  assert.equal(await reference.isVisible(), shouldShow,
    `${scenario.label}, ${mode}: compact reference visibility follows Arc-only compact semantics`);
  if (!shouldShow) return;

  const text = await trimmedText(reference);
  assert.ok(text.includes('7-iron') && text.includes('90 mph'),
    `${scenario.label}, ${mode}: compact Arc reference explicitly names 7-iron and 90 mph`);
  const audit = await reference.evaluate(element => {
    const box = element.getBoundingClientRect();
    const facts = element.closest('.facts').getBoundingClientRect();
    return {
      insideFacts: box.left >= facts.left - 1 && box.right <= facts.right + 1
        && box.top >= facts.top - 1 && box.bottom <= facts.bottom + 1,
      insideViewport: box.left >= -1 && box.right <= innerWidth + 1
        && box.top >= -1 && box.bottom <= innerHeight + 1,
      unclipped: element.scrollWidth <= element.clientWidth + 1
        && element.scrollHeight <= element.clientHeight + 1,
      width: box.width,
      height: box.height,
    };
  });
  assert.ok(audit.width > 0 && audit.height > 0,
    `${scenario.label}, ${mode}: compact Arc reference has rendered size`);
  assert.equal(audit.insideFacts, true,
    `${scenario.label}, ${mode}: compact Arc reference stays inside Cause Trace`);
  assert.equal(audit.insideViewport, true,
    `${scenario.label}, ${mode}: compact Arc reference stays inside the viewport`);
  assert.equal(audit.unclipped, true,
    `${scenario.label}, ${mode}: compact Arc reference is not clipped`);
}

async function assertArcFactsContained(page, label) {
  const rows = await page.evaluate(() => {
    const facts = document.querySelector('.facts').getBoundingClientRect();
    return [...document.querySelectorAll('#arc-facts .derived-grid__row')].map(row => {
      const term = row.querySelector('dt');
      const value = row.querySelector('dd');
      const inspect = element => {
        const rect = element.getBoundingClientRect();
        return {
          text: element.textContent.trim(),
          visible: rect.width > 0 && rect.height > 0,
          insideFacts: rect.left >= facts.left - 1 && rect.right <= facts.right + 1
            && rect.top >= facts.top - 1 && rect.bottom <= facts.bottom + 1,
          insideViewport: rect.left >= -1 && rect.right <= innerWidth + 1
            && rect.top >= -1 && rect.bottom <= innerHeight + 1,
        };
      };
      return { term: inspect(term), value: inspect(value) };
    });
  });

  assert.deepEqual(rows.map(row => row.term.text), ['Derived Attack', 'Derived Path', 'Contact'],
    `${label}: Arc facts expose Attack, Path and Contact in that causal order`);
  for (const row of rows) {
    for (const item of [row.term, row.value]) {
      assert.equal(item.visible, true, `${label}: ${item.text} is visible`);
      assert.equal(item.insideFacts, true, `${label}: ${item.text} stays inside Cause Trace`);
      assert.equal(item.insideViewport, true, `${label}: ${item.text} stays inside the viewport`);
    }
  }
}

async function runCoreContract(page, scenario) {
  const impactButton = page.getByRole('button', { name: 'Impact Inputs', exact: true });
  const arcButton = page.getByRole('button', { name: 'Arc Inputs', exact: true });

  await assertMode(page, 'delivery');
  assert.equal(await impactButton.count(), 1, 'Impact Inputs is the direct-delivery authority');
  await assertInputSet(page, DELIVERY_INPUTS);
  await assertPersistentFlightAndOutcomes(page);
  await assertVisibleControlContract(page, 'Impact Inputs');
  await assertAccessibleControlNames(page, 'delivery', `${scenario.label}, Impact Inputs`);
  await assertKeyboardFocusVisible(page, '#delivery-face', `${scenario.label}, Impact Inputs`);
  await assertNoOverflow(page, `${scenario.label}, Impact Inputs`);
  await assertLiveRegionsSeparated(page, `${scenario.label}, Impact Inputs`);
  await assertPortraitInstrumentAboveEvidence(page, scenario, 'Impact Inputs');
  await assertCompactReference(page, scenario, 'delivery');
  await captureState(page, scenario, 'delivery');

  const start = page.locator('[data-outcome="start"]');
  const curve = page.locator('[data-outcome="curve"]');
  const initialStart = await trimmedText(start);
  const initialCurve = await trimmedText(curve);
  const face = page.locator('#delivery-face');
  await face.fill('4');
  assert.notEqual(await trimmedText(start), initialStart, 'Face Angle changes Start immediately');
  assert.notEqual(await trimmedText(curve), initialCurve, 'Face Angle changes Curve immediately');
  assert.equal(await page.locator('#flight-canvas').isVisible(), true, 'flight stays visible while editing Face Angle');

  const faceValue = await face.inputValue();
  const keyboardStart = await trimmedText(start);
  await face.focus();
  await page.keyboard.press('ArrowUp');
  assert.notEqual(await face.inputValue(), faceValue, 'Face Angle responds to arrow keys');
  assert.notEqual(await trimmedText(start), keyboardStart, 'keyboard input updates outcomes live');

  await arcButton.focus();
  await page.keyboard.press('Enter');
  await assertMode(page, 'arc');
  await assertInputSet(page, ARC_INPUTS);
  await assertPersistentFlightAndOutcomes(page);
  await assertVisibleControlContract(page, 'Arc Inputs');
  await assertAccessibleControlNames(page, 'arc', `${scenario.label}, Arc Inputs`);
  await assertKeyboardFocusVisible(page, '#arc-low-point', `${scenario.label}, Arc Inputs`);
  await assertNoOverflow(page, `${scenario.label}, Arc Inputs`);
  await assertLiveRegionsSeparated(page, `${scenario.label}, Arc Inputs`);
  await assertArcFactsContained(page, `${scenario.label}, Arc Inputs`);
  await assertPortraitInstrumentAboveEvidence(page, scenario, 'Arc Inputs');
  await assertCompactReference(page, scenario, 'arc');
  await captureState(page, scenario, 'arc');

  const derivedAttack = page.locator('[data-derived="attack"]');
  const derivedPath = page.locator('[data-derived="path"]');
  assert.equal(await derivedAttack.isVisible(), true, 'Arc Inputs exposes derived Attack Angle');
  assert.equal(await derivedPath.isVisible(), true, 'Arc Inputs exposes derived Club Path');
  assert.match(await trimmedText(derivedAttack), /\d/, 'derived Attack Angle is numeric');
  assert.match(await trimmedText(derivedPath), /\d/, 'derived Club Path is numeric');

  const initialDerivedPath = await trimmedText(derivedPath);
  await page.locator('#arc-direction').fill('4');
  assert.notEqual(await trimmedText(derivedPath), initialDerivedPath,
    'Swing Direction updates derived Club Path immediately');

  const handedAttack = await trimmedText(derivedAttack);
  const handedPath = await trimmedText(derivedPath);
  const handoff = page.getByRole('button', { name: 'Use in Impact Inputs', exact: true });
  assert.equal(await handoff.count(), 1, 'Arc Inputs exposes an explicit handoff');
  await handoff.focus();
  await page.keyboard.press('Enter');

  await assertMode(page, 'delivery');
  assert.equal(await trimmedText(page.locator('#delivery-attack-value')), handedAttack,
    'handoff populates Delivery Attack Angle from the arc');
  assert.equal(await trimmedText(page.locator('#delivery-path-value')), handedPath,
    'handoff populates Delivery Club Path from the arc');
  await assertPersistentFlightAndOutcomes(page);
  await assertNoOverflow(page, `${scenario.label}, handed-off Impact Inputs`);

  assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
    scenario.reducedMotion === 'reduce', `${scenario.label}: browser motion preference reaches the page`);
}

for (const scenario of SCENARIOS) {
  test(`Mechanics Lab live browser contract: ${scenario.label}`, { timeout: 30_000 }, async () => {
    const { context, page, errors } = await open(scenario);
    try {
      await runCoreContract(page, scenario);
      await page.evaluate(() => new Promise(requestAnimationFrame));
      assert.deepEqual(errors, [], `${scenario.label}: no page or console errors`);
    } finally {
      await context.close();
    }
  });
}

async function portraitViewportAudit(page) {
  return page.evaluate(() => {
    const viewport = { width: innerWidth, height: innerHeight };
    const inspect = (element, name, boxElement = element) => {
      const rect = boxElement.getBoundingClientRect();
      const style = getComputedStyle(boxElement);
      const inViewport = style.display !== 'none'
        && style.visibility !== 'hidden'
        && rect.width > 0
        && rect.height > 0
        && rect.left >= 0
        && rect.top >= 0
        && rect.right <= innerWidth
        && rect.bottom <= innerHeight;
      return {
        name,
        inViewport,
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
      };
    };

    const items = [...document.querySelectorAll('[data-outcome]')].map(output => inspect(
      output,
      output.dataset.outcome,
      output.closest('.telemetry__cell') || output,
    ));
    const cause = document.querySelector('[data-cause]');
    items.push(inspect(cause, 'cause'));

    return {
      viewport,
      items,
      offscreen: items.filter(item => !item.inViewport),
    };
  });
}

function assertPortraitDockInViewport(audit, state) {
  const positions = audit.offscreen
    .map(item => `${item.name} top=${item.top} bottom=${item.bottom}`)
    .join('; ');
  assert.equal(audit.offscreen.length, 0,
    `${state}: ${audit.offscreen.length} live items are outside the ${audit.viewport.width}×${audit.viewport.height} viewport (${positions})`);
  assert.equal(audit.items.filter(item => item.name !== 'cause' && item.inViewport).length, OUTCOMES.length,
    `${state}: all six live outcome boxes remain in the viewport`);
}

test('portrait keeps the live outcome dock and active cause above the fold', { timeout: 30_000 }, async () => {
  const scenario = {
    label: 'portrait live dock',
    viewport: { width: 430, height: 932 },
    reducedMotion: 'no-preference',
  };
  const { context, page, errors } = await open(scenario);

  try {
    await assertMode(page, 'delivery');
    const start = page.locator('[data-outcome="start"]');
    const initialStart = await trimmedText(start);
    await page.locator('#delivery-face').fill('4');
    assert.notEqual(await trimmedText(start), initialStart,
      'a portrait Delivery slider updates its outcome live');
    await page.evaluate(() => new Promise(requestAnimationFrame));
    assertPortraitDockInViewport(await portraitViewportAudit(page), 'portrait Delivery after Face Angle input');

    await page.getByRole('button', { name: 'Arc Inputs', exact: true }).click();
    await page.locator('#arc-direction').fill('4');
    await assertMode(page, 'arc');
    assert.match(await trimmedText(page.locator('[data-derived="attack"]')), /\d/,
      'derived Attack remains available in Arc Inputs');
    assert.match(await trimmedText(page.locator('[data-derived="path"]')), /\d/,
      'derived Path remains available in Arc Inputs');
    await page.evaluate(() => new Promise(requestAnimationFrame));
    assertPortraitDockInViewport(await portraitViewportAudit(page), 'portrait Arc after Swing Direction input');
    assert.deepEqual(errors, [], 'portrait live dock has no page or console errors');
  } finally {
    await context.close();
  }
});
