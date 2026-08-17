import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require('../tools/node_modules/playwright-core');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const USE_WEBKIT = process.argv.includes('--project=webkit');
const contentType = (file) => ({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
}[extname(file)] || 'application/octet-stream');

let server;
let browser;
let baseUrl;

test.before(async () => {
  server = createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
      .replace(/^\/+/, '') || 'index.html';
    const file = resolve(ROOT, path);
    const rootPrefix = `${ROOT}${sep}`.toLowerCase();
    if (!`${file}${sep}`.toLowerCase().startsWith(rootPrefix)) {
      response.writeHead(403).end();
      return;
    }
    readFile(file, (error, data) => {
      if (error) {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, { 'Content-Type': contentType(file), 'Cache-Control': 'no-store' });
      response.end(data);
    });
  });
  await new Promise((resolveReady, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveReady);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  browser = USE_WEBKIT
    ? await webkit.launch({ headless: true })
    : await chromium.launch({ channel: 'msedge', headless: true })
      .catch(() => chromium.launch({ channel: 'chrome', headless: true }));
});

test.after(async () => {
  await browser?.close();
  await new Promise((resolveClose) => server?.close(resolveClose));
});

test('all parameters remain visible and directly selectable on a phone', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(`${baseUrl}/connections.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const initial = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('.node')];
    const labels = nodes.map((node) => node.querySelector('span'));
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden'
        && Number(style.opacity) > 0.45 && rect.width > 0 && rect.height > 0;
    };
    return {
      nodeCount: nodes.length,
      labels: labels.map((label) => label?.textContent.trim()),
      allLabelsVisible: labels.every(visible),
      allEnabled: nodes.every((node) => !node.disabled),
      minTarget: Math.min(...nodes.map((node) => Math.min(
        node.getBoundingClientRect().width,
        node.getBoundingClientRect().height,
      ))),
      overflowX: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      overflowY: Math.max(0, document.documentElement.scrollHeight - innerHeight),
      shellPresent: Boolean(document.querySelector('[data-sa-shell]')),
      backPath: new URL(document.querySelector('#back').href).pathname,
      selected: document.querySelector('.node.selected')?.dataset.id,
    };
  });

  assert.equal(initial.nodeCount, 23);
  assert.equal(new Set(initial.labels).size, 23);
  assert.equal(initial.allLabelsVisible, true);
  assert.equal(initial.allEnabled, true);
  assert.ok(initial.minTarget >= 44, `smallest node target was ${initial.minTarget}px`);
  assert.equal(initial.overflowX, 0);
  assert.equal(initial.overflowY, 0);
  assert.equal(initial.shellPresent, false);
  assert.equal(initial.backPath, '/index.html');
  assert.equal(initial.selected, 'attack');

  await page.locator('.node[data-id="speed"]').click();
  await page.locator('#effects').click();
  assert.equal(await page.locator('#detail-title').textContent(), 'Club Speed');
  assert.equal(await page.locator('#effects').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.node').count(), 23);
  assert.equal(await page.locator('.node:disabled').count(), 0);
  assert.ok(Number.parseInt(await page.locator('#status').textContent(), 10) <= 7);

  assert.deepEqual(consoleErrors, []);
  assert.deepEqual(pageErrors, []);
  await page.close();
});

test('reduced motion keeps the same information without a traveling signal', async () => {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  await page.goto(`${baseUrl}/connections.html`, { waitUntil: 'networkidle' });

  const state = await page.evaluate(() => ({
    nodes: document.querySelectorAll('.node').length,
    activeSignals: [...document.querySelectorAll('.signal.active')].map((signal) => ({
      animationName: getComputedStyle(signal).animationName,
      dasharray: getComputedStyle(signal).strokeDasharray,
    })),
    detail: document.querySelector('#detail-list').textContent.trim(),
  }));

  assert.equal(state.nodes, 23);
  assert.ok(state.detail.length > 0);
  assert.ok(state.activeSignals.length > 0);
  assert.ok(state.activeSignals.every((signal) => signal.animationName === 'none'));
  await page.close();
});
