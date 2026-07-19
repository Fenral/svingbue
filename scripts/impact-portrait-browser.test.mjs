import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let server;
let browser;
let baseUrl;

function contentType(file) {
  return {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
  }[extname(file).toLowerCase()] || 'application/octet-stream';
}

before(async () => {
  server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const file = resolve(ROOT, pathname === '/' ? 'impact.html' : pathname.replace(/^\/+/, ''));
    const prefix = `${ROOT}${sep}`.toLowerCase();
    if (file.toLowerCase() !== ROOT.toLowerCase() && !`${file}${sep}`.toLowerCase().startsWith(prefix)) {
      response.writeHead(403).end('forbidden'); return;
    }
    readFile(file, (error, data) => {
      if (error) { response.writeHead(404).end('not found'); return; }
      response.writeHead(200, { 'Content-Type': contentType(file), 'Cache-Control': 'no-store' });
      response.end(data);
    });
  });
  await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const { chromium } = require('../tools/node_modules/playwright-core');
  try { browser = await chromium.launch({ channel: 'msedge', headless: true }); }
  catch { browser = await chromium.launch({ channel: 'chrome', headless: true }); }
});

after(async () => {
  await browser?.close();
  await new Promise(resolveClose => server?.close(resolveClose));
});

test('portrait Impact keeps the model, one control and full-width chips together',
  { timeout: 60_000 }, async () => {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
    const errors = [];
    page.on('pageerror', error => errors.push(`page:${error.message}`));
    page.on('console', message => { if (message.type() === 'error') errors.push(`console:${message.text()}`); });
    await page.goto(`${baseUrl}/impact.html`, { waitUntil: 'networkidle' });

    const shell = page.locator('[data-impact-layout="portrait-range"]');
    await shell.waitFor();
    assert.equal(await page.locator('.impact-control').count(), 1);
    assert.equal(await page.locator('.control-helper').count(), 0);

    const visibleLabels = async () => page.locator('.parameter-chip:visible').allTextContents();
    assert.deepEqual(await visibleLabels(), ['Face', 'Path', 'Dyn. loft', 'Attack', 'Speed']);

    const spacing = await page.locator('.parameters').evaluate(container => {
      const chips = [...container.querySelectorAll('.parameter-chip:not([hidden])')];
      const outer = container.getBoundingClientRect();
      const boxes = chips.map(chip => chip.getBoundingClientRect());
      return {
        leftGap: boxes[0].left - outer.left,
        rightGap: outer.right - boxes.at(-1).right,
        widths: boxes.map(box => box.width),
        heights: boxes.map(box => box.height),
        overflow: container.scrollWidth - container.clientWidth,
      };
    });
    assert.ok(Math.abs(spacing.leftGap) <= 1 && Math.abs(spacing.rightGap) <= 1);
    assert.ok(Math.max(...spacing.widths) - Math.min(...spacing.widths) <= 1);
    assert.ok(spacing.heights.every(height => height >= 44));
    assert.ok(spacing.overflow <= 1);

    await page.getByRole('button', { name: 'Top view' }).click();
    assert.deepEqual(await visibleLabels(), ['Face', 'Path', 'Speed']);
    await page.getByRole('button', { name: 'Side view' }).click();
    assert.deepEqual(await visibleLabels(), ['Dyn. loft', 'Attack', 'Speed']);
    await page.waitForTimeout(500);
    const labelBounds = await page.locator('.annoLabel:not([hidden])').evaluateAll((labels) => {
      const stage = document.querySelector('#stage').getBoundingClientRect();
      return labels.map(label => {
        const box = label.getBoundingClientRect();
        return { left: box.left - stage.left, right: stage.right - box.right };
      });
    });
    assert.ok(labelBounds.every(box => box.left >= -1 && box.right >= -1), 'annotation labels stay inside the stage');

    await page.getByRole('button', { name: 'Speed parameter' }).click();
    const control = page.locator('.impact-control');
    await control.fill('121');
    await page.getByRole('button', { name: 'Flight view' }).click();
    assert.equal(await control.inputValue(), '121');
    assert.equal(await page.locator('.parameter-chip[aria-pressed="true"]').textContent(), 'Speed');

    const documentMetrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      dockBottom: document.querySelector('.control-dock').getBoundingClientRect().bottom,
      viewportHeight: innerHeight,
    }));
    assert.ok(documentMetrics.scrollWidth <= documentMetrics.clientWidth);
    assert.ok(documentMetrics.dockBottom <= documentMetrics.viewportHeight + 1);
    assert.deepEqual(errors.filter(error => !error.includes('favicon.ico')), []);
    await page.close();
  });
