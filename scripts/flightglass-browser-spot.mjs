#!/usr/bin/env node
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFile, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VIEWPORTS = Object.freeze([
  { id: 'portrait-compact', width: 375, height: 812 },
  { id: 'landscape-compact', width: 812, height: 375 }
]);
const PHASE1_VIEWPORTS = Object.freeze([
  { id: 'portrait-compact', width: 375, height: 812 },
  { id: 'portrait-large', width: 430, height: 932 },
  { id: 'landscape-compact', width: 812, height: 375 },
  { id: 'landscape-large', width: 932, height: 430 }
]);
const PHASE1_ROUTES = Object.freeze([
  'index.html',
  'impact.html',
  'impact-studio.html',
  'jarvis.html'
]);
const PHASE1_MOTIONS = Object.freeze([
  { id: 'motion', value: 'no-preference' },
  { id: 'reduced', value: 'reduce' }
]);
const REQUIRED_SELECTORS = Object.freeze({
  'index.html': [
    'body[data-home-experience="learning-tour"]',
    '[data-home-main]',
    '#homeEmpty',
    '#onboarding'
  ]
});

function parseArgs(argv) {
  const options = { engine: 'chromium', routes: [], json: false, phase1: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--engine') options.engine = argv[++index];
    else if (arg.startsWith('--engine=')) options.engine = arg.slice('--engine='.length);
    else if (arg === '--route') options.routes.push(argv[++index]);
    else if (arg.startsWith('--route=')) options.routes.push(arg.slice('--route='.length));
    else if (arg === '--json') options.json = true;
    else if (arg === '--phase1') options.phase1 = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!['chromium', 'webkit'].includes(options.engine)) {
    throw new Error('--engine must be chromium or webkit');
  }
  return options;
}

function normalizedRoute(route) {
  return String(route || '').trim().replaceAll('\\', '/').replace(/^\.\//, '');
}

function validateRoutes(inputRoutes, fallbackRoutes = ['index.html']) {
  const routes = [...new Set((inputRoutes.length ? inputRoutes : fallbackRoutes).map(normalizedRoute))];
  for (const route of routes) {
    if (!route || route.startsWith('/') || route.includes('..') || !/\.html$/i.test(route)) {
      throw new Error(`Unsafe or unsupported route: ${route}`);
    }
    if (!existsSync(join(ROOT, route))) throw new Error(`Missing route file: ${route}`);
  }
  return routes;
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
  const root = resolve(ROOT);
  const rootPrefix = `${root}${sep}`.toLowerCase();
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const file = resolve(root, relative);
    const lower = file.toLowerCase();
    if (lower !== root.toLowerCase() && !`${file}${sep}`.toLowerCase().startsWith(rootPrefix)) {
      response.writeHead(403).end('forbidden');
      return;
    }
    readFile(file, (error, data) => {
      if (error) {
        response.writeHead(404).end('not found');
        return;
      }
      response.writeHead(200, { 'Content-Type': contentType(file), 'Cache-Control': 'no-store' });
      response.end(request.method === 'HEAD' ? undefined : data);
    });
  });
  await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
  return server;
}

async function launch(engineName) {
  let chromium;
  let webkit;
  try {
    ({ chromium, webkit } = require('../tools/node_modules/playwright-core'));
  } catch (error) {
    throw new Error('Playwright Core is missing. Run npm ci --prefix tools.', { cause: error });
  }

  if (engineName === 'webkit') return webkit.launch({ headless: true });
  try {
    return await chromium.launch({ channel: 'msedge', headless: true });
  } catch {
    return chromium.launch({ channel: 'chrome', headless: true });
  }
}

function ignoredResource(url = '') {
  try {
    return new URL(url).pathname === '/favicon.ico';
  } catch {
    return false;
  }
}

async function inspectPage(page, requiredSelectors, phase1 = false) {
  return page.evaluate(async ({ selectors, phase1Mode }) => {
    const interactiveSelector = [
      'a',
      'button',
      'input',
      'select',
      'textarea',
      '[role="button"]',
      '[role="slider"]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const modalCandidates = [...document.querySelectorAll(
      'dialog[open], [role="dialog"][aria-modal="true"], [role="alertdialog"][aria-modal="true"]'
    )].filter((element) => visible(element));
    const activeModal = modalCandidates.find((modal) => modal.contains(document.activeElement))
      || modalCandidates.at(-1)
      || null;
    const candidates = [...document.querySelectorAll(interactiveSelector)]
      .filter((element) => visible(element)
        && !element.matches(':disabled')
        && element.getAttribute('aria-disabled') !== 'true'
        && !element.closest('[aria-hidden="true"], [inert]'));
    const scoped = activeModal
      ? candidates.filter((element) => activeModal.contains(element))
      : candidates;
    const scopedSet = new Set(scoped);
    const reachable = (element) => {
      const rect = element.getBoundingClientRect();
      const left = Math.max(0, rect.left);
      const top = Math.max(0, rect.top);
      const right = Math.min(innerWidth, rect.right);
      const bottom = Math.min(innerHeight, rect.bottom);
      if (right <= left || bottom <= top) return false;

      const insetX = (right - left) * 0.2;
      const insetY = (bottom - top) * 0.2;
      const points = [
        [(left + right) / 2, (top + bottom) / 2],
        [left + insetX, top + insetY],
        [right - insetX, top + insetY],
        [left + insetX, bottom - insetY],
        [right - insetX, bottom - insetY]
      ];
      return points.some(([x, y]) => {
        const hit = document.elementFromPoint(x, y);
        if (!hit) return false;
        if (hit === element || element.contains(hit)) return true;
        const peer = hit.closest?.(interactiveSelector);
        return Boolean(peer && scopedSet.has(peer));
      });
    };
    const selectorFor = (element) => {
      if (element.id) return `#${element.id}`;
      const classes = [...element.classList].slice(0, 2).map((name) => `.${name}`).join('');
      return `${element.tagName.toLowerCase()}${classes}`;
    };
    const interactive = scoped.filter((element) => reachable(element));
    const targetFor = (element) => {
      const rect = element.getBoundingClientRect();
      return {
        selector: selectorFor(element),
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      };
    };
    const targets = interactive.map(targetFor);
    const overlaps = [];
    for (let left = 0; left < targets.length; left += 1) {
      for (let right = left + 1; right < targets.length; right += 1) {
        const a = targets[left];
        const b = targets[right];
        const overlapWidth = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const overlapHeight = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (overlapWidth > 1 && overlapHeight > 1) {
          overlaps.push({ a: a.selector, b: b.selector, overlapWidth, overlapHeight });
        }
      }
    }

    const localLinks = [...document.querySelectorAll('a[href]')]
      .map((anchor) => anchor.href)
      .filter((href) => href.startsWith(location.origin) && !href.includes('#'));
    const linkResults = await Promise.all([...new Set(localLinks)].map(async (href) => {
      try {
        const response = await fetch(href, { method: 'HEAD', cache: 'no-store' });
        return { href, status: response.status };
      } catch (error) {
        return { href, status: 0, error: error.message };
      }
    }));

    const shell = document.querySelector('[data-sa-shell]');
    const shellLinks = shell ? [...shell.querySelectorAll('a[data-sa-route-link]')] : [];
    const currentLinks = shellLinks.filter((link) => link.getAttribute('aria-current') === 'page');
    const shellTargets = shellLinks.filter((link) => interactive.includes(link)).map(targetFor);
    const outsideShellTargets = shell
      ? interactive.filter((element) => !shell.contains(element)).map(targetFor)
      : [];
    const navControlOverlaps = [];
    for (const navTarget of shellTargets) {
      for (const controlTarget of outsideShellTargets) {
        const overlapWidth = Math.min(navTarget.right, controlTarget.right)
          - Math.max(navTarget.left, controlTarget.left);
        const overlapHeight = Math.min(navTarget.bottom, controlTarget.bottom)
          - Math.max(navTarget.top, controlTarget.top);
        if (overlapWidth > 1 && overlapHeight > 1) {
          navControlOverlaps.push({
            nav: navTarget.selector,
            control: controlTarget.selector,
            overlapWidth,
            overlapHeight
          });
        }
      }
    }

    const orientationOverlay = document.querySelector('.rotate');
    const overlayVisible = Boolean(orientationOverlay && visible(orientationOverlay));
    let orientationOverlayState = null;
    if (overlayVisible) {
      const rect = orientationOverlay.getBoundingClientRect();
      const leaking = [...document.querySelectorAll(interactiveSelector)]
        .filter((element) => visible(element)
          && element.tabIndex >= 0
          && !orientationOverlay.contains(element)
          && !element.closest('[aria-hidden="true"], [inert]'))
        .map(selectorFor);
      orientationOverlayState = {
        role: orientationOverlay.getAttribute('role'),
        ariaModal: orientationOverlay.getAttribute('aria-modal'),
        coversViewport: rect.left <= 1 && rect.top <= 1
          && rect.right >= innerWidth - 1 && rect.bottom >= innerHeight - 1,
        leaking
      };
    }

    return {
      missingSelectors: selectors.filter((selector) => !document.querySelector(selector)),
      htmlOverflowX: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      bodyOverflowX: Math.max(0, document.body.scrollWidth - innerWidth),
      smallTargets: targets
        .filter((target) => target.width < 44 || target.height < 44)
        .map(({ selector, width, height }) => ({ selector, width, height })),
      overlaps,
      brokenLinks: linkResults.filter((result) => result.status < 200 || result.status >= 400),
      shellLinkCount: shellLinks.length,
      shellCurrentCount: currentLinks.length,
      shellCurrentRoute: currentLinks[0]?.dataset.saRouteLink || null,
      declaredRoute: document.body.dataset.saRoute || null,
      smallShellTargets: shellTargets
        .filter((target) => target.width < 44 || target.height < 44)
        .map(({ selector, width, height }) => ({ selector, width, height })),
      navControlOverlaps,
      orientationOverlayState,
      phase1Mode
    };
  }, { selectors: requiredSelectors, phase1Mode: phase1 });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const routes = validateRoutes(options.routes, options.phase1 ? PHASE1_ROUTES : ['index.html']);
  const viewports = options.phase1 ? PHASE1_VIEWPORTS : VIEWPORTS;
  const motions = options.phase1
    ? PHASE1_MOTIONS
    : [{ id: 'motion', value: 'no-preference' }];
  const outputDir = join(
    ROOT,
    'outputs',
    'flightglass-gates',
    options.phase1 ? 'phase1-browser' : 'browser-spot'
  );
  mkdirSync(outputDir, { recursive: true });
  const server = await startStaticServer();
  const browser = await launch(options.engine);
  const base = `http://127.0.0.1:${server.address().port}`;
  const results = [];

  try {
    for (const route of routes) {
      for (const viewport of viewports) {
        for (const motion of motions) {
          const page = await browser.newPage({
            viewport: { width: viewport.width, height: viewport.height },
            reducedMotion: motion.value
          });
        const consoleErrors = [];
        const pageErrors = [];
        const resourceErrors = [];
        page.on('console', (message) => {
          if (message.type() === 'error' && !ignoredResource(message.location().url)) {
            consoleErrors.push(message.text());
          }
        });
        page.on('pageerror', (error) => pageErrors.push(error.message));
        page.on('response', (response) => {
          if (response.request().method() !== 'HEAD'
              && response.status() >= 400
              && !ignoredResource(response.url())) {
            resourceErrors.push({ url: response.url(), status: response.status() });
          }
        });
        page.on('requestfailed', (request) => {
          if (request.method() !== 'HEAD' && !ignoredResource(request.url())) {
            resourceErrors.push({
              url: request.url(),
              status: 0,
              error: request.failure()?.errorText || ''
            });
          }
        });

          const response = await page.goto(`${base}/${route}`, {
            waitUntil: 'load',
            timeout: 20_000
          });
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(route === 'index.html' ? 1600 : 800);
          const inspection = await inspectPage(
            page,
            REQUIRED_SELECTORS[route] || ['body'],
            options.phase1
          );
          const routeSlug = route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
          const screenshot = join(
            outputDir,
            options.phase1
              ? `${routeSlug}--${viewport.id}--${motion.id}--${options.engine}.png`
              : `${routeSlug}--${viewport.id}--${options.engine}.png`
          );
          await page.screenshot({ path: screenshot, fullPage: false, animations: 'disabled' });
          await page.close();

          const critical = [];
          if (!response || response.status() < 200 || response.status() >= 400) {
            critical.push(`HTTP ${response?.status() ?? 'missing'}`);
          }
          if (consoleErrors.length) critical.push(`${consoleErrors.length} console error(s)`);
          if (pageErrors.length) critical.push(`${pageErrors.length} page error(s)`);
          if (resourceErrors.length) critical.push(`${resourceErrors.length} resource error(s)`);
          if (inspection.missingSelectors.length) {
            critical.push(`missing selector(s): ${inspection.missingSelectors.join(', ')}`);
          }
          if (inspection.htmlOverflowX > 1 || inspection.bodyOverflowX > 1) {
            critical.push('horizontal overflow');
          }
          if (inspection.overlaps.length) {
            critical.push(`${inspection.overlaps.length} overlapping target pair(s)`);
          }
          if (inspection.brokenLinks.length) {
            critical.push(`${inspection.brokenLinks.length} broken local link(s)`);
          }
          if (options.phase1) {
            if (inspection.shellLinkCount !== 4) {
              critical.push(`shell links (${inspection.shellLinkCount}/4)`);
            }
            if (inspection.shellCurrentCount !== 1
                || inspection.shellCurrentRoute !== inspection.declaredRoute) {
              critical.push(`shell current route (${inspection.shellCurrentCount}/1)`);
            }
            if (inspection.smallShellTargets.length) {
              critical.push(`${inspection.smallShellTargets.length} undersized shell target(s)`);
            }
            if (inspection.navControlOverlaps.length) {
              critical.push(`${inspection.navControlOverlaps.length} shell/control overlap(s)`);
            }
            const overlay = inspection.orientationOverlayState;
            if (overlay && (overlay.role !== 'dialog'
                || overlay.ariaModal !== 'true'
                || !overlay.coversViewport
                || overlay.leaking.length)) {
              critical.push('orientation overlay accessibility contract');
            }
          }

          results.push({
            route,
            viewportId: viewport.id,
            motion: motion.value,
            engine: options.engine,
            httpStatus: response?.status() ?? null,
            consoleErrors,
            pageErrors,
            resourceErrors,
            ...inspection,
            screenshot,
            critical
          });
        }
      }
    }
  } finally {
    await browser.close();
    await new Promise((resolveClose) => server.close(resolveClose));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    engine: options.engine,
    mode: options.phase1 ? 'phase1' : 'spot',
    routes,
    cases: results.length,
    criticalCount: results.reduce((count, result) => count + result.critical.length, 0),
    results
  };
  const reportPath = join(outputDir, `report--${options.engine}.json`);
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  if (options.json) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  else {
    const label = options.phase1 ? 'Phase 1' : 'spot';
    console.log(`Flightglass ${options.engine} ${label}: ${report.cases} case(s), ${report.criticalCount} critical finding(s).`);
  }
  if (report.criticalCount) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
