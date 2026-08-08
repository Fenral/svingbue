import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('../tools/node_modules/playwright-core');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = resolve(ROOT, 'outputs', 'guide');

function contentType(file) {
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.woff2': 'font/woff2',
  }[extname(file).toLowerCase()] || 'application/octet-stream';
}

const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  const file = resolve(ROOT, pathname === '/' ? 'jarvis.html' : pathname.replace(/^\/+/, ''));
  const prefix = `${ROOT}${sep}`.toLowerCase();
  if (file.toLowerCase() !== ROOT.toLowerCase() && !`${file}${sep}`.toLowerCase().startsWith(prefix)) {
    response.writeHead(403).end('forbidden');
    return;
  }
  try {
    const data = await readFile(file);
    response.writeHead(200, { 'Content-Type': contentType(file), 'Cache-Control': 'no-store' });
    response.end(data);
  } catch {
    response.writeHead(404).end('not found');
  }
});

await new Promise((accept, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', accept);
});

const baseUrl = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'msedge', headless: true })
  .catch(() => chromium.launch({ channel: 'chrome', headless: true }));

await mkdir(OUTPUT, { recursive: true });

async function ready(page, path) {
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
}

async function captureMobile() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await ready(page, '/jarvis.html');
  await page.screenshot({ path: resolve(OUTPUT, 'guide-browse-mobile.png'), fullPage: true });

  await page.locator('[data-guide-topic="direction"]').click();
  await page.locator('[data-question-id="curve-right"]').click();
  await page.locator('[data-guide-panel="answer"]:visible').waitFor();
  await page.screenshot({ path: resolve(OUTPUT, 'guide-answer-mobile.png'), fullPage: true });

  await page.locator('[data-open-lab]').click();
  await page.locator('[data-guide-panel="lab"]:visible').waitFor();
  const slider = page.locator('input[data-lab-slider]:visible');
  await slider.fill(String(Number(await slider.inputValue()) + 1));
  await page.waitForTimeout(380);
  await page.screenshot({ path: resolve(OUTPUT, 'guide-lab-mobile.png'), fullPage: true });
  await context.close();
}

async function captureDesktop() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await ready(page, '/jarvis.html?topic=launch-spin&question=backspin');
  await page.locator('[data-guide-panel="answer"]:visible').waitFor();
  await page.screenshot({ path: resolve(OUTPUT, 'guide-answer-desktop.png'), fullPage: true });
  await page.locator('[data-open-lab]').click();
  await page.locator('[data-guide-panel="lab"]:visible').waitFor();
  const slider = page.locator('input[data-lab-slider]:visible');
  await slider.fill(String(Number(await slider.inputValue()) + 2));
  await page.waitForTimeout(380);
  await page.screenshot({ path: resolve(OUTPUT, 'guide-lab-desktop.png'), fullPage: true });
  await context.close();
}

try {
  await captureMobile();
  await captureDesktop();
  process.stdout.write(`${OUTPUT}\n`);
} finally {
  await browser.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
