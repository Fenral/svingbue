#!/usr/bin/env node
// Capture the shipping v1 product and compose deterministic store artwork.
// Output is intentionally limited to appstore/: Apple 1290x2796, Play
// 1080x1920, a 1024x500 Play feature graphic, and a review contact sheet.

import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import {
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const { chromium } = require('../tools/node_modules/playwright-core');
const fontkit = require('fontkit');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'appstore');
const PLAY_OUT = join(OUT, 'play');
const WORK = join(OUT, '.capture-work');

const APPLE = { width: 1290, height: 2796 };
const PLAY = { width: 1080, height: 1920 };
const CONTEXT_KEY = 'sa.v1.context';
const TYPE = Object.freeze({
  ui: fontkit.openSync(join(ROOT, 'vendor', 'fonts', 'Inter-Bold.woff2')),
  display: fontkit.openSync(join(ROOT, 'vendor', 'fonts', 'SpaceGrotesk-Bold.woff2')),
});

function emptyContext({ complete = false, dismissed = false } = {}) {
  return {
    version: 1,
    onboarding: {
      complete,
      step: complete ? 4 : 1,
      dismissed,
      labLoft: 24,
      goal: null,
      handedness: null,
      experience: null,
      draftShot: { club: null, start: null, curve: null, flight: null },
    },
    currentShot: null,
    lastExperiment: null,
    jarvis: { selectedQuestionId: null, recommendedRoute: null },
  };
}

const SHOTS = [
  {
    id: 'outcome',
    file: '01.png',
    route: 'impact.html',
    viewport: { width: 430, height: 932 },
    eyebrow: 'LIVE OUTCOME',
    title: ['Replay the setup.', 'Compare the outcome.'],
    subtitle: 'Range keeps a modelled setup and its flight values together.',
    ready: '#outcomeBoard',
  },
  {
    id: 'studio',
    file: '02.png',
    route: 'impact-studio.html',
    viewport: { width: 932, height: 430 },
    eyebrow: 'MECHANICS LAB',
    title: ['Trace cause to strike.', 'Watch flight respond.'],
    subtitle: 'Impact or Arc Inputs update contact and six outcomes.',
    ready: 'main.mechanics',
    landscape: true,
  },
  {
    id: 'guide',
    file: '03.png',
    route: 'jarvis.html?topic=launch-spin&question=backspin',
    viewport: { width: 430, height: 932 },
    eyebrow: 'FLIGHTGLASS GUIDE',
    title: ['Ask a precise', 'golf question.'],
    subtitle: 'Get a short answer, evidence and model limits.',
    ready: '[data-guide-panel="answer"]:not([hidden])',
  },
  {
    id: 'home',
    file: '04.png',
    route: 'index.html',
    viewport: { width: 430, height: 932 },
    eyebrow: 'FLIGHTGLASS',
    title: ['See how the', 'numbers connect.'],
    subtitle: 'One model connects impact, launch and flight.',
    ready: '#homeEmpty:not([hidden])',
  },
  {
    id: 'onboarding',
    file: '05.png',
    route: 'index.html',
    viewport: { width: 430, height: 932 },
    eyebrow: 'INTERACTIVE ONBOARDING',
    title: ['Learn by changing', 'one number.'],
    subtitle: 'Watch launch, spin loft and backspin move together.',
    ready: '#onboarding[open]',
    onboarding: true,
  },
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function startServer() {
  return new Promise((accept, reject) => {
    const server = createServer(async (request, response) => {
      try {
        const url = new URL(request.url, 'http://127.0.0.1');
        let file = normalize(join(ROOT, decodeURIComponent(url.pathname)));
        if (!file.startsWith(ROOT)) {
          response.writeHead(403).end('forbidden');
          return;
        }
        if (url.pathname === '/') file = join(ROOT, 'index.html');
        if (url.pathname === '/favicon.ico') {
          response.writeHead(204).end();
          return;
        }
        const body = await readFile(file);
        response.writeHead(200, {
          'content-type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
          'cache-control': 'no-store',
        });
        response.end(body);
      } catch {
        response.writeHead(404).end('not found');
      }
    });
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => accept(server));
  });
}

function xml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function outlinedText(value, { font, x, y, size, fill, letterSpacing = 0 }) {
  const scale = size / font.unitsPerEm;
  const run = font.layout(value);
  let cursor = x;
  const paths = [];
  for (let index = 0; index < run.glyphs.length; index += 1) {
    const glyph = run.glyphs[index];
    const position = run.positions[index];
    if (glyph.id) {
      paths.push(`<path d="${glyph.path.toSVG()}" transform="translate(${cursor} ${y}) scale(${scale} ${-scale})"/>`);
    }
    cursor += position.xAdvance * scale + letterSpacing;
  }
  return `<g fill="${fill}">${paths.join('')}</g>`;
}

function marketingSvg(shot, size, compact = false) {
  const scale = size.width / APPLE.width;
  const x = Math.round(84 * scale);
  const eyebrowY = Math.round((compact ? 88 : 108) * scale);
  const titleY = Math.round((compact ? 190 : 242) * scale);
  const titleGap = Math.round((compact ? 82 : 100) * scale);
  const subtitleY = titleY + titleGap * shot.title.length + Math.round(34 * scale);
  const eyebrowSize = Math.round((compact ? 24 : 28) * scale);
  const titleSize = Math.round((compact ? 68 : 82) * scale);
  const subtitleSize = Math.round((compact ? 29 : 32) * scale);
  const eyebrow = outlinedText(shot.eyebrow, {
    font: TYPE.ui, x: x + Math.round(23 * scale), y: eyebrowY, size: eyebrowSize,
    fill: '#b9a9f5', letterSpacing: Math.round(5 * scale),
  });
  const title = shot.title.map((line, index) => outlinedText(line, {
    font: TYPE.display, x, y: titleY + titleGap * index, size: titleSize, fill: '#f6f2ff',
    letterSpacing: Math.round(-2 * scale),
  })).join('');
  const subtitle = outlinedText(shot.subtitle, {
    font: TYPE.ui, x, y: subtitleY, size: subtitleSize, fill: '#aca4bd',
  });
  return Buffer.from(`<svg width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="ember" cx="94%" cy="8%" r="65%"><stop stop-color="#ff8655" stop-opacity=".20"/><stop offset="1" stop-color="#ff8655" stop-opacity="0"/></radialGradient>
      <radialGradient id="violet" cx="10%" cy="50%" r="80%"><stop stop-color="#8d72ff" stop-opacity=".15"/><stop offset="1" stop-color="#8d72ff" stop-opacity="0"/></radialGradient>
      <linearGradient id="base" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#09070f"/><stop offset=".58" stop-color="#100b1b"/><stop offset="1" stop-color="#08070d"/></linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#base)"/>
    <rect width="100%" height="100%" fill="url(#violet)"/>
    <rect width="100%" height="100%" fill="url(#ember)"/>
    <circle cx="${x}" cy="${eyebrowY - Math.round(8 * scale)}" r="${Math.max(4, Math.round(6 * scale))}" fill="#ff7a45"/>
    ${eyebrow}
    ${title}
    ${subtitle}
  </svg>`);
}

function frameSvg(width, height, radius, strokeWidth = 2) {
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${strokeWidth / 2}" y="${strokeWidth / 2}" width="${width - strokeWidth}" height="${height - strokeWidth}" rx="${radius}" fill="none" stroke="#4d425f" stroke-width="${strokeWidth}"/>
  </svg>`);
}

async function rounded(buffer, width, height, radius) {
  const mask = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" rx="${radius}" fill="white"/></svg>`);
  return sharp(buffer)
    .resize(width, height, { fit: 'cover', position: 'top' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function writeOpaquePng(image, output) {
  await image
    .flatten({ background: '#08070d' })
    .removeAlpha()
    .toColourspace('srgb')
    .png({ compressionLevel: 9 })
    .toFile(output);
}

async function portraitArtwork(shot, capture, size, output) {
  const compact = size.height < 2300;
  const scale = size.width / APPLE.width;
  const frameX = Math.round((compact ? 128 : 154) * scale);
  const frameY = Math.round((compact ? 430 : 670) * scale);
  const frameWidth = size.width - frameX * 2;
  const availableHeight = size.height - frameY - Math.round((compact ? 42 : 70) * scale);
  const naturalHeight = Math.round(frameWidth * shot.viewport.height / shot.viewport.width);
  const frameHeight = Math.min(availableHeight, naturalHeight);
  const radius = Math.round(42 * scale);
  const image = await rounded(capture, frameWidth, frameHeight, radius);

  await writeOpaquePng(sharp({
    create: { width: size.width, height: size.height, channels: 4, background: '#08070d' },
  }).composite([
    { input: marketingSvg(shot, size, compact), left: 0, top: 0 },
    { input: image, left: frameX, top: frameY },
    { input: frameSvg(frameWidth, frameHeight, radius), left: frameX, top: frameY },
  ]), output);
}

async function studioArtwork(shot, capture, size, output) {
  const compact = size.height < 2300;
  const scale = size.width / APPLE.width;
  const fullX = Math.round(64 * scale);
  const fullY = Math.round((compact ? 485 : 760) * scale);
  const fullWidth = size.width - fullX * 2;
  const fullHeight = Math.round(fullWidth * shot.viewport.height / shot.viewport.width);
  const radius = Math.round(34 * scale);
  const full = await rounded(capture, fullWidth, fullHeight, radius);

  const sourceMeta = await sharp(capture).metadata();
  // Show the contact scene only. A partial parameter rail or clipped controls
  // would look like a rendering defect in a store screenshot.
  const cropLeft = 0;
  const cropTop = Math.round(sourceMeta.height * .14);
  const cropWidth = Math.round(sourceMeta.width * .88);
  const cropHeight = Math.round(sourceMeta.height * .45);
  const detailWidth = Math.round(size.width * .84);
  const detailHeight = Math.round(detailWidth * cropHeight / cropWidth);
  const detailX = Math.round((size.width - detailWidth) / 2);
  const detailY = fullY + fullHeight + Math.round(76 * scale);
  const detailRaw = await sharp(capture)
    .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
    .toBuffer();
  const detail = await rounded(detailRaw, detailWidth, detailHeight, radius);

  await writeOpaquePng(sharp({
    create: { width: size.width, height: size.height, channels: 4, background: '#08070d' },
  }).composite([
    { input: marketingSvg(shot, size, compact), left: 0, top: 0 },
    { input: full, left: fullX, top: fullY },
    { input: frameSvg(fullWidth, fullHeight, radius), left: fullX, top: fullY },
    { input: detail, left: detailX, top: detailY },
    { input: frameSvg(detailWidth, detailHeight, radius), left: detailX, top: detailY },
  ]), output);
}

async function buildFeature(capture) {
  const width = 1024;
  const height = 500;
  const image = await sharp(capture)
    .resize(700, height, { fit: 'cover', position: 'top' })
    .modulate({ brightness: .72, saturation: .9 })
    .png()
    .toBuffer();
  const overlay = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#08070d"/><stop offset=".48" stop-color="#0d0a16" stop-opacity=".97"/><stop offset=".82" stop-color="#0d0a16" stop-opacity=".3"/><stop offset="1" stop-color="#0d0a16" stop-opacity=".08"/></linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <circle cx="72" cy="112" r="7" fill="#ff7a45"/>
    ${outlinedText('FLIGHTGLASS', { font: TYPE.ui, x: 94, y: 122, size: 24, fill: '#b9a9f5', letterSpacing: 5 })}
    ${outlinedText('See why it flew.', { font: TYPE.display, x: 68, y: 232, size: 61, fill: '#f6f2ff', letterSpacing: -2 })}
    ${outlinedText('Understand the numbers behind the shot.', { font: TYPE.ui, x: 70, y: 285, size: 27, fill: '#aca4bd' })}
  </svg>`);
  await writeOpaquePng(sharp({ create: { width, height, channels: 4, background: '#08070d' } })
    .composite([
      { input: image, left: width - 700, top: 0 },
      { input: overlay, left: 0, top: 0 },
    ]), join(OUT, 'feature-graphic.png'));
}

async function buildContactSheet() {
  const thumbWidth = 354;
  const thumbHeight = 768;
  const gap = 34;
  const left = 80;
  const top = 110;
  const width = 1290;
  const height = 1770;
  const composites = [];
  for (let index = 0; index < SHOTS.length; index += 1) {
    const row = index < 3 ? 0 : 1;
    const column = row === 0 ? index : index - 3;
    const rowCount = row === 0 ? 3 : 2;
    const rowWidth = rowCount * thumbWidth + (rowCount - 1) * gap;
    const rowLeft = Math.round((width - rowWidth) / 2);
    const thumb = await sharp(join(OUT, SHOTS[index].file))
      .resize(thumbWidth, thumbHeight, { fit: 'cover', position: 'top' })
      .png()
      .toBuffer();
    composites.push({
      input: thumb,
      left: rowLeft + column * (thumbWidth + gap),
      top: top + row * (thumbHeight + 78),
    });
  }
  const label = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#07060c"/>
    ${outlinedText('FLIGHTGLASS · V1 STORE SET', { font: TYPE.ui, x: 400, y: 64, size: 32, fill: '#f6f2ff', letterSpacing: 1 })}
  </svg>`);
  await writeOpaquePng(sharp({ create: { width, height, channels: 4, background: '#07060c' } })
    .composite([{ input: label, left: 0, top: 0 }, ...composites])
    , join(OUT, 'contact-sheet.png'));
}

function writeGallery() {
  const figures = SHOTS.map((shot, index) => `
    <figure>
      <img src="./${shot.file}" alt="Store screenshot ${index + 1}: ${xml(shot.title.join(' '))}">
      <figcaption>${index + 1}. <strong>${xml(shot.title.join(' '))}</strong> — ${xml(shot.subtitle)}</figcaption>
    </figure>`).join('');
  writeFileSync(join(OUT, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Flightglass v1 store assets</title>
<style>body{margin:0 auto;max-width:720px;padding:30px 18px 80px;background:#07060c;color:#f6f2ff;font:15px/1.5 Inter,Arial,sans-serif}h1{margin:0 0 6px;font-size:26px}.intro{color:#aaa2bc;margin:0 0 28px}.status{display:inline-block;color:#ff9a6d;border:1px solid #5b3b36;border-radius:999px;padding:3px 10px;font-size:12px;letter-spacing:.08em}figure{margin:28px 0 42px}img{display:block;width:100%;height:auto;border:1px solid #3a3149;border-radius:18px;background:#0b0912}figcaption{margin-top:10px;color:#aaa2bc}strong{color:#f6f2ff}.contact img{border-radius:10px}.links a{color:#b29aff;margin-right:16px}</style>
</head><body><span class="status">CURRENT V1 · UPLOAD SET</span><h1>Flightglass store artwork</h1>
<p class="intro">Five current-product screenshots. Apple files are exactly 1290×2796. Google Play files are in <code>play/</code> at 1080×1920; the feature graphic is 1024×500.</p>
<p class="links"><a href="./contact-sheet.png">Contact sheet</a><a href="./feature-graphic.png">Play feature graphic</a></p>
<figure class="contact"><img src="./contact-sheet.png" alt="Contact sheet of all five current Flightglass screenshots"><figcaption>Current v1 set — Range, Mechanics Lab, Guide, Home and interactive onboarding.</figcaption></figure>
${figures}</body></html>`, 'utf8');
}

function pngSize(file) {
  const buffer = readFileSync(file);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function assertSize(file, expected) {
  const actual = pngSize(file);
  if (actual.width !== expected.width || actual.height !== expected.height) {
    throw new Error(`${file}: ${actual.width}x${actual.height}; expected ${expected.width}x${expected.height}`);
  }
}

const server = await startServer();
const base = `http://127.0.0.1:${server.address().port}`;
mkdirSync(OUT, { recursive: true });
mkdirSync(PLAY_OUT, { recursive: true });
// The previous gallery had nine legacy StrikeArc/Academy upload candidates.
// Keep the upload root unambiguous: only the five current v1 files remain.
for (const stale of ['06.png', '07.png', '08.png', '09.png']) {
  rmSync(join(OUT, stale), { force: true });
}
rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });

const storedContext = emptyContext({ complete: true, dismissed: true });

let browser;
try {
  browser = await chromium.launch({ channel: 'msedge', headless: true });
} catch {
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    browser = await chromium.launch({ headless: true });
  }
}

const consoleErrors = [];
const captures = new Map();
try {
  for (const spec of SHOTS) {
    const context = await browser.newContext({
      viewport: spec.viewport,
      deviceScaleFactor: 2,
      reducedMotion: 'reduce',
      colorScheme: 'dark',
    });
    const contextValue = spec.onboarding ? emptyContext() : storedContext;
    await context.addInitScript(({ key, value }) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        localStorage.setItem('sa_coach_impact', '1');
        localStorage.setItem('sa_coach_geo', '1');
        localStorage.setItem('sa_coach_flight_ghost', '1');
        sessionStorage.setItem('sa.opening.v1', '1');
      } catch {}
    }, { key: CONTEXT_KEY, value: contextValue });
    const page = await context.newPage();
    page.on('pageerror', error => consoleErrors.push(`${spec.id}: ${error.message}`));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(`${spec.id}: ${message.text()}`);
    });
    await page.goto(`${base}/${spec.route}`, { waitUntil: 'networkidle' });
    await page.locator(spec.ready).waitFor({ state: 'visible', timeout: 20_000 });
    if (spec.onboarding) {
      await page.locator('#beginOnboarding').click();
      await page.locator('#continueTour').click();
      await page.locator('[data-onboarding-step="3"]:not([hidden])').waitFor({ state: 'visible' });
      await page.locator('#onboardingLoft').fill('30');
    }
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(spec.landscape ? 700 : 350);
    const capture = await page.screenshot({ type: 'png', animations: 'disabled' });
    captures.set(spec.id, capture);
    await sharp(capture).png({ compressionLevel: 9 }).toFile(join(WORK, `${spec.id}.png`));
    await context.close();
  }

  for (const spec of SHOTS) {
    const capture = captures.get(spec.id);
    const composer = spec.landscape ? studioArtwork : portraitArtwork;
    await composer(spec, capture, APPLE, join(OUT, spec.file));
    await composer(spec, capture, PLAY, join(PLAY_OUT, spec.file));
  }
  await buildFeature(captures.get('studio'));
  await buildContactSheet();
  writeGallery();

  for (const spec of SHOTS) {
    assertSize(join(OUT, spec.file), APPLE);
    assertSize(join(PLAY_OUT, spec.file), PLAY);
  }
  assertSize(join(OUT, 'feature-graphic.png'), { width: 1024, height: 500 });

  if (consoleErrors.length) {
    throw new Error(`Browser console errors:\n${consoleErrors.join('\n')}`);
  }
  console.log(`Generated ${SHOTS.length} Apple and ${SHOTS.length} Play screenshots in ${OUT}`);
  console.log('Apple: 1290x2796 · Play: 1080x1920 · feature: 1024x500 · 0 browser errors');
} finally {
  rmSync(WORK, { recursive: true, force: true });
  await browser?.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
