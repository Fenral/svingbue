// EV-MOT-01 (law 12): truth answers immediately. p95 pointermove→paint must
// stay under 16.7 ms across ≥200 synthetic drag events over the Lab slider,
// on Chromium AND WebKit. Desktop measurement is a proxy — the physical
// iPhone session is a §6 human checkpoint.
//
// Method (sharpened in-test per the Task 20 rule; the manifest's
// "perf-harness JSON-rapport" is unchanged): the lesson renderer performs
// ALL truth work synchronously inside the input handler (solve → DOM →
// canvas in renderLab()), so the honest per-event cost is the synchronous
// dispatch plus a forced style/layout flush. The original rAF-delta variant
// only measured vsync cadence, not work: Chromium reported p50 = p95 =
// exactly one 60 Hz frame (16.7 ms) even though the handler cost was far
// below budget, and headless WebKit has no stable vsync at all. For each
// synthetic drag step we dispatch a real pointermove + the value/input
// mutation, then read offsetHeight to force style+layout before stopping
// the clock. p50/p95/p99 per engine are written to outputs/flightglass-perf/.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, extname, resolve, sep, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require('../tools/node_modules/playwright-core');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPORT_DIR = join(ROOT, 'outputs', 'flightglass-perf');
const DRAG_EVENTS = 220;
const P95_BUDGET_MS = 16.7;

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

let server;
let baseUrl;

test.before(async () => {
  const rootPrefix = `${resolve(ROOT)}${sep}`.toLowerCase();
  server = createServer((request, response) => {
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
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  mkdirSync(REPORT_DIR, { recursive: true });
});

test.after(async () => {
  if (!server) return;
  server.closeAllConnections?.();
  await new Promise((resolveClose) => server.close(resolveClose));
});

async function launchEngine(engineName) {
  if (engineName === 'webkit') return webkit.launch({ headless: true });
  const failures = [];
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel, headless: true });
    } catch (error) {
      failures.push(`${channel}: ${error.message}`);
    }
  }
  throw new Error(`Could not launch Chromium.\n${failures.join('\n')}`);
}

function percentile(sortedSamples, fraction) {
  const index = Math.min(
    sortedSamples.length - 1,
    Math.ceil(fraction * sortedSamples.length) - 1
  );
  return sortedSamples[Math.max(0, index)];
}

async function measureEngine(engineName) {
  const browser = await launchEngine(engineName);
  try {
    const context = await browser.newContext({ viewport: { width: 430, height: 932 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto(`${baseUrl}/academy.html#/lesson/backspin`, { waitUntil: 'networkidle' });
    const root = page.locator('#nativeLesson');
    await root.waitFor({ timeout: 5000 });
    await root.getByRole('button', { name: 'Enter the Spin Lab' }).click();
    await page.waitForFunction(
      () => document.querySelector('#nativeLesson')?.getAttribute('data-surface') === '1'
    );
    const loft = root.locator('[data-param="dynamicLoft"]');
    if (await loft.getAttribute('aria-checked') !== 'true') await loft.click();
    await page.locator('#labRange').waitFor();

    const samples = await page.evaluate(async (count) => {
      const range = document.querySelector('#labRange');
      const rect = range.getBoundingClientRect();
      const min = Number(range.min);
      const max = Number(range.max);
      const span = max - min;
      const durations = [];
      // Warm-up frames so font/canvas first-paint costs are not measured.
      for (let frame = 0; frame < 10; frame += 1) {
        await new Promise((resolveFrame) => requestAnimationFrame(resolveFrame));
      }
      for (let index = 0; index < count; index += 1) {
        const fraction = (index % span) / span;
        const value = min + Math.round(fraction * span);
        const started = performance.now();
        range.dispatchEvent(new PointerEvent('pointermove', {
          bubbles: true,
          pointerType: 'touch',
          clientX: rect.x + fraction * rect.width,
          clientY: rect.y + rect.height / 2
        }));
        range.value = String(value);
        range.dispatchEvent(new Event('input', { bubbles: true }));
        // The handler solved the model and painted the canvas synchronously;
        // force the remaining style/layout flush before stopping the clock.
        void document.body.offsetHeight;
        durations.push(performance.now() - started);
        if (index % 30 === 29) {
          // Yield occasionally so the engine can run timers/GC between bursts,
          // keeping the sample representative of a real continuous drag.
          await new Promise((resolveFrame) => requestAnimationFrame(resolveFrame));
        }
      }
      return durations;
    }, DRAG_EVENTS);

    await context.close();
    assert.deepEqual(pageErrors, [], `page errors during ${engineName} drag synthesis`);
    assert.ok(samples.length >= 200, 'the budget requires at least 200 synthetic drag events');

    const sorted = [...samples].sort((a, b) => a - b);
    const report = {
      engine: engineName,
      surface: 'academy-lesson/lab',
      events: samples.length,
      budgetMsP95: P95_BUDGET_MS,
      p50: Math.round(percentile(sorted, 0.50) * 100) / 100,
      p95: Math.round(percentile(sorted, 0.95) * 100) / 100,
      p99: Math.round(percentile(sorted, 0.99) * 100) / 100,
      max: Math.round(sorted[sorted.length - 1] * 100) / 100,
      capturedAt: new Date().toISOString()
    };
    writeFileSync(
      join(REPORT_DIR, `input-to-paint--${engineName}.json`),
      `${JSON.stringify(report, null, 2)}\n`
    );
    return report;
  } finally {
    await browser.close().catch(() => {});
  }
}

test('Lab drag input→paint p95 stays under 16.7 ms on Chromium', { timeout: 120_000 }, async () => {
  const report = await measureEngine('chromium');
  assert.ok(
    report.p95 < P95_BUDGET_MS,
    `chromium p95 ${report.p95} ms exceeds the ${P95_BUDGET_MS} ms budget (p50 ${report.p50}, p99 ${report.p99})`
  );
});

test('Lab drag input→paint p95 stays under 16.7 ms on WebKit', { timeout: 120_000 }, async () => {
  const report = await measureEngine('webkit');
  assert.ok(
    report.p95 < P95_BUDGET_MS,
    `webkit p95 ${report.p95} ms exceeds the ${P95_BUDGET_MS} ms budget (p50 ${report.p50}, p99 ${report.p99})`
  );
});
