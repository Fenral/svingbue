// Shared visual-regression harness (instrument-gates Task 15, EV-REG-01).
// Captures all six Backspin surfaces in a deterministic driven state at both
// target viewports, both motion modes and on both engines, and diffs PNG
// pairs with sharp (already a repo devDependency — no new tooling).
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs';
import { mkdirSync, readdirSync, existsSync } from 'node:fs';
import { dirname, extname, resolve, sep, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require('../../tools/node_modules/playwright-core');
const sharp = require('sharp');

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const BASELINE_DIR = join(ROOT, 'outputs', 'visreg-baselines');
export const CURRENT_DIR = join(ROOT, 'outputs', 'flightglass-visreg', 'current');
export const DIFF_THRESHOLD_PCT = 0.1;

export const ENGINES = ['chromium', 'webkit'];
const VIEWPORTS = [
  { tag: '430x932', width: 430, height: 932 },
  { tag: '375x812', width: 375, height: 812 }
];
const MOTIONS = ['no-preference', 'reduce'];
const SURFACE_NAMES = ['0-mission', '1-lab', '2-influence', '3-myths', '4-mastery', '5-result'];
const MYTH_ANSWERS = [1, 1, 2];
const MASTERY_ANSWERS = [0, 1, 0, 2];
const PASS_TARGET = { state: { dynamicLoft: 30, attackAngle: -3, ballSpeed: 120 }, rpm: 7128, landing: 54.4 };
const SETTLE_MS = 800;

export function expectedShotNames() {
  const names = [];
  for (const engine of ENGINES) {
    for (const viewport of VIEWPORTS) {
      for (const motion of MOTIONS) {
        for (const surface of SURFACE_NAMES) {
          names.push(`${engine}--${viewport.tag}--${motion === 'reduce' ? 'reduced' : 'normal'}--${surface}.png`);
        }
      }
    }
  }
  return names;
}

function contentType(file) {
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.json': 'application/json',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
  }[extname(file).toLowerCase()] || 'application/octet-stream';
}

async function startServer() {
  const rootPrefix = `${resolve(ROOT)}${sep}`.toLowerCase();
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const file = resolve(ROOT, relative);
    if (!`${file}${sep}`.toLowerCase().startsWith(rootPrefix)) {
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
  await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
  return server;
}

// Canvas AA must rasterize identically across capture sessions, so Chromium
// runs on deterministic software rendering (GPU raster jitters run-to-run).
const CHROMIUM_DETERMINISTIC_ARGS = [
  '--disable-gpu',
  '--force-color-profile=srgb',
  '--disable-lcd-text',
  '--font-render-hinting=none',
  '--force-device-scale-factor=1',
  '--hide-scrollbars',
];

async function launchEngine(engineName) {
  if (engineName === 'webkit') return webkit.launch({ headless: true });
  const failures = [];
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel, headless: true, args: CHROMIUM_DETERMINISTIC_ARGS });
    } catch (error) {
      failures.push(`${channel}: ${error.message}`);
    }
  }
  throw new Error(`Could not launch Chromium.\n${failures.join('\n')}`);
}

async function waitSurface(page, value) {
  await page.waitForFunction(
    (expected) => document.querySelector('#nativeLesson')?.getAttribute('data-surface') === expected,
    value,
    { timeout: 8000 }
  );
}

async function setRange(page, selector, value) {
  await page.locator(selector).evaluate((element, next) => {
    element.value = String(next);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

async function setParam(page, root, key, value) {
  const button = root.locator(`[data-param="${key}"]`);
  if (await button.getAttribute('aria-checked') !== 'true') await button.click();
  await setRange(page, '#labRange', value);
}

// The lab trace canvas settles asynchronously (300ms settle timer + phosphor
// ghost set), so a fixed wait can catch it mid-settle and jitter the diff
// run-to-run. Poll the canvas bitmap until two reads match: the render is
// deterministic once settled, so this makes the *capture* deterministic too.
async function waitForCanvasStable(page, { pollMs = 120, stableReads = 3, timeoutMs = 6000 } = {}) {
  const readSignature = () => page.evaluate(() => {
    const canvas = document.querySelector('#nativeLesson canvas');
    if (!canvas || !canvas.width) return 'none';
    try { return canvas.toDataURL('image/png'); } catch { return 'blocked'; }
  });
  let previous = await readSignature();
  let matches = 1;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await page.waitForTimeout(pollMs);
    const current = await readSignature();
    matches = current === previous ? matches + 1 : 1;
    previous = current;
    if (matches >= stableReads) return;
  }
}

// Drives the deterministic six-surface walk and screenshots each surface.
async function walkAndShoot(page, root, shot) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(SETTLE_MS);
  await shot('0-mission');

  await root.getByRole('button', { name: 'Enter the Spin Lab' }).click();
  await waitSurface(page, '1');
  await setParam(page, root, 'dynamicLoft', 30);
  await page.waitForTimeout(150);
  await setParam(page, root, 'dynamicLoft', 10);
  await page.waitForTimeout(150);
  await setParam(page, root, 'dynamicLoft', 25);
  await setParam(page, root, 'attackAngle', -3);
  await setParam(page, root, 'ballSpeed', 120);
  await page.waitForFunction(() =>
    document.querySelector('#backspinTruth')?.textContent.replaceAll(',', '').trim() === '6048');
  await page.waitForTimeout(SETTLE_MS);
  await page.waitForFunction(() => {
    const lesson = document.querySelector('#nativeLesson');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    return lesson?.dataset.ghostCount === (reduced ? '1' : '2');
  }, undefined, { timeout: 4000 });
  await waitForCanvasStable(page);
  await shot('1-lab');

  const next = root.locator('.native-lesson__navigation [data-action="next"]');
  await next.click();
  await waitSurface(page, '2');
  await page.waitForTimeout(SETTLE_MS);
  await shot('2-influence');

  await next.click();
  await waitSurface(page, '3');
  await page.waitForTimeout(SETTLE_MS);
  await shot('3-myths');

  for (let index = 0; index < MYTH_ANSWERS.length; index += 1) {
    await root.locator(`#mythExperiment [data-myth-choice="${MYTH_ANSWERS[index]}"]`).click();
    await page.waitForTimeout(200);
    await root.locator('[data-myth-next]').click();
    if (index < MYTH_ANSWERS.length - 1) {
      await page.waitForFunction(
        (nextIndex) => document.querySelector('#mythExperiment')?.dataset.experimentIndex === String(nextIndex),
        index + 1
      );
    }
  }
  await waitSurface(page, '4');
  await page.waitForTimeout(SETTLE_MS);
  await shot('4-mastery');

  for (let index = 0; index < 4; index += 1) {
    await page.waitForFunction(
      (expected) => document.querySelector('#masteryTask')?.dataset.masteryIndex === String(expected),
      index
    );
    await root.locator('[data-mastery-choice]').nth(MASTERY_ANSWERS[index]).click();
    await root.locator('[data-mastery-feedback]').waitFor({ state: 'visible' });
    await root.locator('[data-mastery-next]').click();
  }
  await page.waitForFunction(
    () => document.querySelector('#masteryTask')?.dataset.masteryIndex === '4'
  );
  for (const key of ['dynamicLoft', 'attackAngle', 'ballSpeed']) {
    const chip = root.locator(`[data-mastery-param="${key}"]`);
    if (await chip.getAttribute('aria-checked') !== 'true') await chip.click();
    await setRange(page, '#masteryTargetRange', PASS_TARGET.state[key]);
  }
  await page.waitForFunction((target) => {
    const rpm = document.querySelector('[data-mastery-rpm]');
    const landing = document.querySelector('[data-mastery-landing]');
    return Number(rpm?.getAttribute('data-value')) === target.rpm
      && Number(landing?.getAttribute('data-value')) === target.landing;
  }, PASS_TARGET);
  await root.locator('[data-action="submit-mastery-target"][data-mastery-target-submit]').click();
  await root.locator('[data-mastery-target-feedback]').waitFor({ state: 'visible' });
  await root.locator('[data-mastery-next]').click();
  await waitSurface(page, '5');
  await page.waitForTimeout(SETTLE_MS);
  await shot('5-result');
}

export async function captureAll(outDir, { engines = ENGINES } = {}) {
  mkdirSync(outDir, { recursive: true });
  const server = await startServer();
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const runtimeErrors = [];
  try {
    for (const engineName of engines) {
      const browser = await launchEngine(engineName);
      try {
        for (const viewport of VIEWPORTS) {
          for (const motion of MOTIONS) {
            const tag = `${engineName}--${viewport.tag}--${motion === 'reduce' ? 'reduced' : 'normal'}`;
            const context = await browser.newContext({
              viewport: { width: viewport.width, height: viewport.height },
              reducedMotion: motion
            });
            const page = await context.newPage();
            page.on('pageerror', (error) => runtimeErrors.push(`${tag}: ${error.message}`));
            await page.goto(`${baseUrl}/academy.html#/lesson/backspin`, { waitUntil: 'networkidle' });
            const root = page.locator('#nativeLesson');
            await root.waitFor({ timeout: 8000 });
            await walkAndShoot(page, root, (name) =>
              page.screenshot({
                path: join(outDir, `${tag}--${name}.png`),
                animations: 'disabled',
                caret: 'hide'
              }));
            await context.close();
          }
        }
      } finally {
        await browser.close().catch(() => {});
      }
    }
  } finally {
    server.closeAllConnections?.();
    await new Promise((resolveClose) => server.close(resolveClose));
  }
  return { runtimeErrors };
}

export async function diffPng(baselinePath, candidatePath, { channelTolerance = 4 } = {}) {
  const [a, b] = await Promise.all([
    sharp(baselinePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(candidatePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  ]);
  if (a.info.width !== b.info.width || a.info.height !== b.info.height) {
    return { comparable: false, diffPct: 100 };
  }
  const totalPixels = a.info.width * a.info.height;
  let diffPixels = 0;
  for (let offset = 0; offset < a.data.length; offset += 4) {
    if (
      Math.abs(a.data[offset] - b.data[offset]) > channelTolerance
      || Math.abs(a.data[offset + 1] - b.data[offset + 1]) > channelTolerance
      || Math.abs(a.data[offset + 2] - b.data[offset + 2]) > channelTolerance
      || Math.abs(a.data[offset + 3] - b.data[offset + 3]) > channelTolerance
    ) {
      diffPixels += 1;
    }
  }
  return {
    comparable: true,
    diffPixels,
    totalPixels,
    diffPct: Math.round((diffPixels / totalPixels) * 100 * 1000) / 1000
  };
}

export function baselineInventory() {
  if (!existsSync(BASELINE_DIR)) return [];
  return readdirSync(BASELINE_DIR).filter((name) => name.endsWith('.png')).sort();
}
