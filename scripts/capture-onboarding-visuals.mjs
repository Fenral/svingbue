import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdirSync, readFile } from 'node:fs';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const require = createRequire(import.meta.url);
const { chromium } = require('../tools/node_modules/playwright-core');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = join(ROOT, 'assets', 'onboarding');

const captures = [
  {
    id: 'outcome',
    route: 'impact.html',
    viewport: { width: 375, height: 812 },
    ready: '#outcomeBoard',
  },
  {
    id: 'studio',
    route: 'impact-studio.html',
    viewport: { width: 812, height: 375 },
    ready: 'main.mechanics',
  },
  {
    id: 'guide',
    route: 'jarvis.html',
    viewport: { width: 375, height: 812 },
    ready: '[data-guide-panel="browse"]',
  },
];

function contentType(file) {
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
  }[extname(file).toLowerCase()] || 'application/octet-stream';
}

const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = resolve(ROOT, relative);
  const rootPrefix = `${ROOT}${sep}`.toLowerCase();

  if (file.toLowerCase() !== ROOT.toLowerCase()
      && !`${file}${sep}`.toLowerCase().startsWith(rootPrefix)) {
    response.writeHead(403).end();
    return;
  }

  readFile(file, (error, data) => {
    if (error) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      'Content-Type': contentType(file),
      'Cache-Control': 'no-store',
    });
    response.end(data);
  });
});

await new Promise((resolveListen, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolveListen);
});

const baseUrl = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'msedge', headless: true })
  .catch(() => chromium.launch({ channel: 'chrome', headless: true }));

mkdirSync(OUTPUT, { recursive: true });

try {
  for (const capture of captures) {
    const context = await browser.newContext({
      viewport: capture.viewport,
      deviceScaleFactor: 2,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto(`${baseUrl}/${capture.route}`, { waitUntil: 'networkidle' });
    await page.locator(capture.ready).waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);

    const png = await page.screenshot({ type: 'png' });
    await sharp(png)
      .webp({ quality: 84, effort: 5 })
      .toFile(join(OUTPUT, `${capture.id}.webp`));

    if (errors.length) {
      throw new Error(`${capture.route}: ${errors.join(' | ')}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise(resolveClose => server.close(resolveClose));
}

console.log(`Captured ${captures.length} real app views in ${OUTPUT}`);
