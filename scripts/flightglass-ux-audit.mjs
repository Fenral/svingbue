#!/usr/bin/env node
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdirSync, readFile, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadManifest,
  validateManifest,
  evaluateSnapshot,
  countBlockingFindings,
  normalizeResourceErrors,
  shouldIgnoreResourceFailure,
  reportFileStem,
  renderMarkdownReport
} from './lib/flightglass-ux.mjs';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = join(ROOT, 'config', 'flightglass-surfaces.json');

function parseArgs(argv) {
  const options = {
    mode: 'baseline',
    manifestOnly: false,
    json: false,
    motion: 'normal',
    surfaceIds: []
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--manifest-only') options.manifestOnly = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--mode') options.mode = argv[++index];
    else if (arg.startsWith('--mode=')) options.mode = arg.split('=')[1];
    else if (arg === '--motion') options.motion = argv[++index];
    else if (arg.startsWith('--motion=')) options.motion = arg.split('=')[1];
    else if (arg === '--surface') options.surfaceIds.push(argv[++index]);
    else if (arg.startsWith('--surface=')) options.surfaceIds.push(arg.split('=')[1]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!['baseline', 'verify'].includes(options.mode)) {
    throw new Error('--mode must be baseline or verify');
  }
  if (!['normal', 'reduced', 'both'].includes(options.motion)) {
    throw new Error('--motion must be normal, reduced or both');
  }
  return options;
}

function contentType(file) {
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
    '.glb': 'model/gltf-binary'
  }[extname(file).toLowerCase()] || 'application/octet-stream';
}

async function startStaticServer() {
  const rootPrefix = `${resolve(ROOT)}${sep}`.toLowerCase();
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const file = resolve(ROOT, relative);
    if (`${file}${sep}`.toLowerCase().startsWith(rootPrefix) === false && file.toLowerCase() !== resolve(ROOT).toLowerCase()) {
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

async function launchBrowser() {
  let chromium;
  try {
    ({ chromium } = require('../tools/node_modules/playwright-core'));
  } catch (error) {
    throw new Error('Playwright Core is missing. Run npm ci --prefix tools.', { cause:error });
  }

  try {
    return await chromium.launch({ channel: 'msedge', headless: true });
  } catch {
    return chromium.launch({ channel: 'chrome', headless: true });
  }
}

async function inspectPage(page, requiredSelectors) {
  return page.evaluate((selectors) => {
    const isVisible = (element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      for (let current = element; current; current = current.parentElement) {
        const style = getComputedStyle(current);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      }
      return true;
    };
    const selectorFor = (element) => {
      if (element.id) return `#${element.id}`;
      const classes = [...element.classList].slice(0, 2).map((name) => `.${name}`).join('');
      return `${element.tagName.toLowerCase()}${classes}`;
    };

    const missingSelectors = selectors.filter((selector) => {
      const element = document.querySelector(selector);
      return !element || !isVisible(element);
    });
    const horizontalOverflowPx = Math.max(0, Math.ceil(document.documentElement.scrollWidth - innerWidth));
    const interactive = [...document.querySelectorAll('a,button,input,select,textarea,[role="button"],[role="slider"],[tabindex]:not([tabindex="-1"])')]
      .filter((element) => isVisible(element) && !element.disabled && element.getAttribute('aria-hidden') !== 'true');
    const smallTargets = interactive
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        if (rect.right <= 0 || rect.left >= innerWidth || rect.bottom <= 0 || rect.top >= innerHeight) return null;
        if (element.tagName === 'A' && style.display === 'inline') return null;
        return { selector: selectorFor(element), width: Math.round(rect.width), height: Math.round(rect.height) };
      })
      .filter(Boolean)
      .filter((target) => target.width < 44 || target.height < 44)
      .slice(0, 60);

    const clippedText = [...document.body.querySelectorAll('*')]
      .filter((element) => {
        if (!isVisible(element) || element.children.length > 0 || !element.textContent.trim()) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const visuallyHidden = rect.width <= 2 && rect.height <= 2
          && (style.clip !== 'auto' || style.clipPath !== 'none');
        if (visuallyHidden) return false;
        const clips = ['hidden', 'clip'].includes(style.overflow) || ['hidden', 'clip'].includes(style.overflowX) || style.textOverflow === 'ellipsis';
        return clips && (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1);
      })
      .map((element) => ({ selector: selectorFor(element), text: element.textContent.trim().slice(0, 100) }))
      .slice(0, 60);

    return { horizontalOverflowPx, missingSelectors, smallTargets, clippedText };
  }, requiredSelectors);
}

async function installFixtureStorage(browserContext, fixture) {
  const entries = fixture?.storage || [];
  await browserContext.addInitScript((fixtureEntries) => {
    for (const entry of fixtureEntries) {
      const storage = entry.area === 'session' ? window.sessionStorage : window.localStorage;
      storage.setItem(entry.key, entry.value);
    }
  }, entries);
}

async function runFixtureActions(page, fixture) {
  for (const action of fixture?.actions || []) {
    if (action.type === 'click') {
      await page.locator(action.selector).click({ timeout: 5000 });
    } else if (action.type === 'wait') {
      await page.waitForTimeout(action.ms);
    }
  }
}

async function runAudit(manifest, options) {
  const selected = options.surfaceIds.length
    ? manifest.surfaces.filter((surface) => options.surfaceIds.includes(surface.id))
    : manifest.surfaces;
  const unknown = options.surfaceIds.filter((id) => !manifest.surfaces.some((surface) => surface.id === id));
  if (unknown.length) throw new Error(`Unknown surface id(s): ${unknown.join(', ')}`);

  const motionModes = options.motion === 'both' ? ['normal', 'reduced'] : [options.motion];
  const outputRoot = join(ROOT, 'outputs', 'flightglass-ux', options.mode);
  mkdirSync(outputRoot, { recursive: true });

  const server = await startStaticServer();
  const browser = await launchBrowser();
  const base = `http://127.0.0.1:${server.address().port}`;
  const results = [];

  try {
    for (const surface of selected) {
      for (const viewportId of surface.viewportIds) {
        for (const motion of motionModes) {
          const viewport = manifest.viewports[viewportId];
          const browserContext = await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height },
            reducedMotion: motion === 'reduced' ? 'reduce' : 'no-preference'
          });
          await installFixtureStorage(browserContext, surface.fixture);
          const page = await browserContext.newPage();
          const consoleErrors = [];
          const pageErrors = [];
          const resourceErrors = [];
          page.on('console', (message) => {
            if (message.type() === 'error') {
              const location = message.location();
              if (shouldIgnoreResourceFailure(location.url)) return;
              consoleErrors.push({
                text: message.text(),
                url: location.url || '',
                line: location.lineNumber ?? null,
                column: location.columnNumber ?? null
              });
            }
          });
          page.on('pageerror', (error) => pageErrors.push(error.message));
          page.on('response', (resourceResponse) => {
            if (resourceResponse.status() >= 400 && !shouldIgnoreResourceFailure(resourceResponse.url())) {
              resourceErrors.push({
                status: resourceResponse.status(),
                url: resourceResponse.url()
              });
            }
          });
          page.on('requestfailed', (request) => {
            if (shouldIgnoreResourceFailure(request.url())) return;
            resourceErrors.push({
              status: 0,
              url: request.url(),
              error: request.failure()?.errorText || 'request failed'
            });
          });

          const response = await page.goto(`${base}/${surface.route}`, { waitUntil: 'load', timeout: 20000 });
          await runFixtureActions(page, surface.fixture);
          await page.waitForTimeout(250);
          const requiredSelectors = [
            ...surface.requiredSelectors,
            ...(surface.requiredSelectorsByMotion?.[motion] || []),
          ];
          const inspection = await inspectPage(page, requiredSelectors);
          const snapshot = {
            httpStatus: response?.status(),
            consoleErrors,
            pageErrors,
            resourceErrors: normalizeResourceErrors(resourceErrors),
            ...inspection
          };
          const evaluation = evaluateSnapshot(snapshot);
          const basename = `${surface.id}--${viewportId}--${motion}`;
          const screenshotFile = join(outputRoot, `${basename}.png`);
          await page.screenshot({ path: screenshotFile, fullPage: false });
          await browserContext.close();

          results.push({
            surfaceId: surface.id,
            label: surface.label,
            viewportId,
            motion,
            baselineScore: surface.baselineScore,
            targetScore: surface.targetScore,
            screenshot: `${options.mode}/${basename}.png`,
            ...evaluation,
            snapshot
          });
          process.stdout.write(`audited ${surface.id} / ${viewportId} / ${motion}\n`);
        }
      }
    }
  } finally {
    await browser.close();
    await new Promise((resolveClose) => server.close(resolveClose));
  }

  const report = { generatedAt: new Date().toISOString(), mode: options.mode, results };
  const reportRoot = join(ROOT, 'outputs', 'flightglass-ux');
  const reportStem = reportFileStem(options.mode, options.surfaceIds);
  writeFileSync(join(reportRoot, `${reportStem}.json`), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(join(reportRoot, `${reportStem}.md`), renderMarkdownReport(report));
  return report;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const manifest = loadManifest(MANIFEST_PATH);
  const validation = validateManifest(manifest, ROOT);
  if (validation.errors.length) {
    throw new Error(`Manifest validation failed:\n- ${validation.errors.join('\n- ')}`);
  }
  if (options.manifestOnly) {
    const payload = {
      valid: true,
      surfaceCount: manifest.surfaces.length,
      viewportCount: Object.keys(manifest.viewports).length,
      warnings: validation.warnings
    };
    process.stdout.write(options.json ? `${JSON.stringify(payload)}\n` : `Flightglass UX manifest valid (${payload.surfaceCount} surfaces, ${payload.viewportCount} viewports).\n`);
    return;
  }

  const report = await runAudit(manifest, options);
  const criticalCount = report.results.reduce((total, result) => total + result.critical.length, 0);
  const improvementCount = report.results.reduce((total, result) => total + result.improvements.length, 0);
  const blockingCount = countBlockingFindings(report, options.mode);
  process.stdout.write(`Flightglass UX ${options.mode} complete: ${report.results.length} captures, ${criticalCount} critical and ${improvementCount} design-floor finding(s).\n`);
  if (blockingCount > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
