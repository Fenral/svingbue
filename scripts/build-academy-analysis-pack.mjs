import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import {
  existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync
} from 'node:fs';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { ACADEMY_EXPERIENCES } from '../academy-curriculum.js';
import {
  ACADEMY_STORE_KEY, PLANE_COUPLING_EXPLORATION_KEY,
  createAcademySeed, normalizeAcademyStore
} from '../academy-store.js';

const require = createRequire(import.meta.url);
const { chromium } = require('../tools/node_modules/playwright-core');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_ROOT = resolve(ROOT, 'outputs', 'academy-analysis');
const RAW_ROOT = resolve(OUTPUT_ROOT, 'screenshots', 'raw');
const SNAPSHOT_PATH = resolve(OUTPUT_ROOT, 'ACADEMY-SOURCE-SNAPSHOT.txt');
const REPORT_PATH = resolve(OUTPUT_ROOT, 'FLIGHTGLASS-ACADEMY-ANALYSIS.html');
const MANIFEST_PATH = resolve(OUTPUT_ROOT, 'academy-analysis-manifest.json');
const DOC_SCREENSHOTS = resolve(ROOT, 'docs', 'academy-analysis', 'screenshots');
const VIEWPORT = Object.freeze({ width:430, height:932 });
const SURFACE_COUNT = 6;
const CAPTURE_DATE = '2026-07-17T00:00:00.000Z';

const CONTENT_MODULES = Object.freeze({
  'start-line':['../academy-start-line-content.js', 'START_LINE_CONTENT'],
  shape:['../academy-shape-content.js', 'SHAPE_CONTENT'],
  'shot-pattern':['../academy-carry-side-content.js', 'CARRY_SIDE_CONTENT'],
  'attack-at-impact':['../academy-attack-at-impact-content.js', 'ATTACK_AT_IMPACT_CONTENT'],
  'low-point':['../academy-low-point-content.js', 'LOW_POINT_CONTENT'],
  'strike-depth':['../academy-contact-height-content.js', 'CONTACT_HEIGHT_CONTENT'],
  'delivered-loft-launch':['../academy-delivered-loft-launch-content.js', 'DELIVERED_LOFT_LAUNCH_CONTENT'],
  'flight-height-descent':['../academy-flight-height-descent-content.js', 'FLIGHT_HEIGHT_DESCENT_CONTENT'],
  'speed-transfer':['../academy-speed-transfer-content.js', 'SPEED_TRANSFER_CONTENT'],
  carry:['../academy-carry-content.js', 'CARRY_CONTENT'],
  'air-density':['../academy-air-density-content.js', 'AIR_DENSITY_CONTENT'],
  wind:['../academy-wind-content.js', 'WIND_CONTENT'],
  'plane-coupling-lab':['../academy-plane-coupling-content.js', 'PLANE_COUPLING_CONTENT']
});

const BACKSPIN_SURFACES = Object.freeze([
  ['mission', 'Mission'], ['lab', 'Lab'], ['influence', 'Influence'],
  ['myths', 'Myths'], ['mastery', 'Mastery Check'], ['result', 'Result']
].map(([id, title]) => Object.freeze({ id, title })));

const DIRECT_DEPENDENCIES = Object.freeze([
  'impact-flight.js',
  'swing-parameters-and-impact.js',
  'sa-haptics.js',
  'sa-p3.css',
  'geo3d-mock/groundcontact.js'
]);

const SUPPORT_FILES = Object.freeze([
  'config/academy-voice-pack.json',
  'config/flightglass-surfaces.json',
  'package.json'
]);

const RESULT_EVIDENCE_KEYS = Object.freeze({
  'start-line':'startLine', shape:'shape', 'shot-pattern':'carrySide',
  'attack-at-impact':'attackAtImpact', 'low-point':'lowPoint',
  'strike-depth':'contactHeight', 'delivered-loft-launch':'deliveredLaunch',
  'flight-height-descent':'flightHeightDescent', 'speed-transfer':'speedTransfer',
  carry:'carryExperience', 'air-density':'airDensity', wind:'windExperience'
});

const MASTERED_RESULT = Object.freeze({
  status:'mastered', knowledgeCorrect:5, liveTransferPassed:true, xpAwarded:120,
  directBlend:true, loftModifier:true, modelBoundary:true, definition:true,
  zeroGate:true, boundary:true, references:true, signed:true, sign:true,
  influence:true, units:true, order:true, modifier:true, direct:true, lift:true,
  compensation:true, loft:true, attack:true, inference:true, apexInputs:true,
  landingPaths:true, arithmetic:true, modelPath:true
});

const sha256 = value => createHash('sha256').update(value).digest('hex');
const posix = value => value.replaceAll('\\', '/');
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
})[character]);
const escapeXml = escapeHtml;
const sourceHead = () => execFileSync('git', ['rev-parse', 'HEAD'], { cwd:ROOT, encoding:'utf8' }).trim();

function ensureDirectories() {
  [OUTPUT_ROOT, RAW_ROOT, DOC_SCREENSHOTS].forEach(path => mkdirSync(path, { recursive:true }));
}

function sourceFiles() {
  const runtime = readdirSync(ROOT, { withFileTypes:true })
    .filter(entry => entry.isFile() && (entry.name === 'academy.html' || /^academy-.*\.(?:js|css)$/i.test(entry.name)))
    .map(entry => entry.name);
  const scripts = readdirSync(resolve(ROOT, 'scripts'), { withFileTypes:true })
    .filter(entry => entry.isFile() && (/^academy-.*\.mjs$/i.test(entry.name) || entry.name === 'verify-academy-voice-pack.mjs'))
    .map(entry => `scripts/${entry.name}`);
  const categories = new Map([
    ...runtime.map(path => [path, 'runtime']),
    ...DIRECT_DEPENDENCIES.map(path => [path, 'direct-dependency']),
    ...SUPPORT_FILES.map(path => [path, 'configuration']),
    ...scripts.map(path => [path, 'tests-and-tooling'])
  ]);
  return [...categories.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([path, category]) => {
      const absolute = resolve(ROOT, path);
      if (!existsSync(absolute)) throw new Error(`Academy analysis source is missing: ${path}`);
      const buffer = readFileSync(absolute);
      if (buffer.includes(0)) throw new Error(`Academy analysis source is not text: ${path}`);
      return Object.freeze({
        path:posix(path), category, bytes:buffer.length,
        lines:buffer.toString('utf8').split(/\r?\n/).length,
        hash:sha256(buffer), text:buffer.toString('utf8')
      });
    });
}

function buildSnapshot(entries, head) {
  const counts = Object.fromEntries([...new Set(entries.map(entry => entry.category))]
    .map(category => [category, entries.filter(entry => entry.category === category).length]));
  const header = [
    'FLIGHTGLASS ACADEMY SOURCE SNAPSHOT',
    `Generated: ${new Date().toISOString()}`,
    `Source commit: ${head}`,
    `Files: ${entries.length}`,
    `Categories: ${JSON.stringify(counts)}`,
    '',
    'SCOPE',
    '- Canonical Academy runtime HTML, JavaScript and CSS.',
    '- Direct physics, geometry, haptics and shared-style dependencies.',
    '- Academy voice/surface configuration plus package commands.',
    '- Academy tests, browser contracts, voice tooling and verifier.',
    '- Excludes binary audio, www/ copies, historical mocks, plans and generated evidence.',
    '',
    'FILE INDEX (category | bytes | lines | sha256 | path)',
    ...entries.map(entry => `${entry.category} | ${entry.bytes} | ${entry.lines} | ${entry.hash} | ${entry.path}`),
    ''
  ];
  const body = entries.flatMap(entry => [
    `===== BEGIN FILE: ${entry.path} =====`, entry.text,
    `===== END FILE: ${entry.path} =====`, ''
  ]);
  writeFileSync(SNAPSHOT_PATH, [...header, ...body].join('\n'), 'utf8');
  return { path:posix(relative(ROOT, SNAPSHOT_PATH)), bytes:statSync(SNAPSHOT_PATH).size, counts };
}

async function experienceCatalog() {
  const catalog = [];
  for (const definition of ACADEMY_EXPERIENCES) {
    let surfaces;
    if (definition.id === 'backspin') {
      surfaces = BACKSPIN_SURFACES;
    } else {
      const [modulePath, exportName] = CONTENT_MODULES[definition.id] || [];
      if (!modulePath) throw new Error(`Missing content mapping for ${definition.id}`);
      const module = await import(modulePath);
      surfaces = module[exportName]?.surfaces;
    }
    if (!Array.isArray(surfaces) || surfaces.length !== SURFACE_COUNT) {
      throw new Error(`${definition.id} must expose exactly ${SURFACE_COUNT} surfaces`);
    }
    catalog.push(Object.freeze({
      ...definition,
      surfaces:Object.freeze(surfaces.map((surface, index) => Object.freeze({
        index, id:surface.id || `surface-${index}`, title:surface.title || `Surface ${index}`
      })))
    }));
  }
  return Object.freeze(catalog);
}

function seededAcademy({ complete = false } = {}) {
  const seed = createAcademySeed();
  seed.preferences.voice.mode = 'off';
  seed.preferences.voice.updatedAt = CAPTURE_DATE;
  if (!complete) return normalizeAcademyStore(seed, { now:CAPTURE_DATE });
  seed.xp = ACADEMY_EXPERIENCES.filter(item => item.core).length * 120;
  seed.lastOpened = 'backspin';
  seed.academyHome.goalId = 'launch-flight';
  seed.academyHome.lastExperienceId = 'backspin';
  for (const definition of ACADEMY_EXPERIENCES) {
    const experience = seed.experiences[definition.id];
    experience.surface = 5;
    experience.unlockedSurfaces = [0, 1, 2, 3, 4, 5];
    experience.startedAt = CAPTURE_DATE;
    experience.lastVisitedAt = CAPTURE_DATE;
    experience.reviewEligible = true;
    experience.evidence.surfacesSeen = [0, 1, 2, 3, 4, 5];
    experience.evidence.instrumentTouched = true;
    experience.evidence.knowledgeBestCorrect = 5;
    experience.evidence.knowledgeTotal = 5;
    experience.evidence.liveTransferPassed = true;
    experience.evidence.liveTransferEvidence = { kind:'analysis-capture', passed:true };
    if (definition.core) {
      experience.acceptedAttemptId = `analysis:${definition.id}`;
      experience.masteredAt = CAPTURE_DATE;
    }
  }
  const backspinAttemptId = 'analysis:backspin-native';
  seed.lessons.backspin.journey = {
    surface:5, mission:{ built:true, cut:true }, myths:[true, true, true],
    masteryBest:5, masteryAttempts:1, masteryAttemptId:backspinAttemptId,
    lastSubmission:{
      attemptId:backspinAttemptId,
      summary:{
        correct:5, total:5, threshold:4, mastered:true, totalDelta:120,
        taskResults:Array.from({ length:5 }, () => ({ resolved:true, firstTry:true }))
      }
    }
  };
  seed.explorations[PLANE_COUPLING_EXPLORATION_KEY] = {
    ...seed.explorations[PLANE_COUPLING_EXPLORATION_KEY],
    status:'explored', previouslyExplored:true, completedAt:CAPTURE_DATE,
    attempts:1, acceptedAttemptId:'analysis:plane-coupling-lab',
    itemsAnswered:[0, 1, 2], boundaryAcknowledged:true
  };
  return normalizeAcademyStore(seed, { now:CAPTURE_DATE });
}

function mimeType(path) {
  return ({
    '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
    '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
    '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg',
    '.jpeg':'image/jpeg', '.woff2':'font/woff2', '.m4a':'audio/mp4'
  })[extname(path).toLowerCase()] || 'application/octet-stream';
}

async function staticServer() {
  const prefix = `${ROOT}${sep}`.toLowerCase();
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname).replace(/^\/+/, '') || 'index.html';
    const file = resolve(ROOT, pathname);
    if (!`${file}${sep}`.toLowerCase().startsWith(prefix) || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404).end(); return;
    }
    response.writeHead(200, { 'Content-Type':mimeType(file), 'Cache-Control':'public, max-age=3600' });
    response.end(readFileSync(file));
  });
  await new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolvePromise);
  });
  return { server, baseUrl:`http://127.0.0.1:${server.address().port}` };
}

async function launchBrowser() {
  for (const options of [{ channel:'msedge', headless:true }, { channel:'chrome', headless:true }, { headless:true }]) {
    try { return await chromium.launch(options); } catch (error) {
      if (!options.channel) throw error;
    }
  }
  throw new Error('Chromium could not be launched');
}

async function captureJobs({ browser, baseUrl, seed, jobs }) {
  const context = await browser.newContext({
    viewport:VIEWPORT, deviceScaleFactor:1, colorScheme:'dark', reducedMotion:'reduce'
  });
  const page = await context.newPage();
  const errors = [];
  let activeJob = null;
  page.on('pageerror', error => errors.push(`${activeJob}: pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`${activeJob}: console: ${message.text()}`);
  });
  const captures = [];
  try {
    activeJob = 'bootstrap';
    await page.goto(`${baseUrl}/academy.html?capture=bootstrap#/academy`, { waitUntil:'load', timeout:45_000 });
    for (const job of jobs) {
      activeJob = job.id;
      const before = errors.length;
      try {
        const jobSeed = structuredClone(seed);
        if (job.experienceId && Number.isInteger(job.surface)) {
          const experience = jobSeed.experiences?.[job.experienceId];
          if (!experience) throw new Error(`Missing capture state for ${job.experienceId}`);
          experience.surface = job.surface;
          experience.unlockedSurfaces = [0, 1, 2, 3, 4, 5];
          const resultEvidenceKey = RESULT_EVIDENCE_KEYS[job.experienceId];
          if (job.surface === 5 && resultEvidenceKey) {
            experience.evidence[resultEvidenceKey] = {
              ...(experience.evidence[resultEvidenceKey] || {}),
              lastResult:{ ...MASTERED_RESULT }
            };
          }
        }
        await page.evaluate(({ key, nudgeKey, value }) => {
          localStorage.clear();
          localStorage.setItem(key, JSON.stringify(value));
          localStorage.setItem(nudgeKey, '1');
        }, { key:ACADEMY_STORE_KEY, nudgeKey:'strikearc.academy.nudge', value:jobSeed });
        await page.goto(`${baseUrl}/academy.html?capture=${encodeURIComponent(job.id)}${job.route}`, { waitUntil:'load', timeout:45_000 });
        await page.locator('body').waitFor({ state:'visible', timeout:15_000 });
        await page.waitForFunction(expected => location.hash === expected, job.route, { timeout:10_000 });
        await page.waitForFunction(() => (document.querySelector('#app')?.childElementCount || 0) > 0, null, { timeout:15_000 });
        if (Number.isInteger(job.surface)) {
          await page.waitForFunction(surface => {
            const active = document.querySelector('#app > main[data-surface], #nativeLesson[data-surface]');
            return Number(active?.dataset.surface) === surface;
          }, job.surface, { timeout:15_000 });
        } else {
          await page.locator('[data-academy-home]').waitFor({ state:'attached', timeout:15_000 });
        }
      } catch (error) {
        throw new Error(`${job.id}: ${error.message}`, { cause:error });
      }
      await page.evaluate(async () => {
        if (document.fonts?.ready) await document.fonts.ready;
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(180);
      const bodyText = (await page.locator('body').innerText()).trim();
      if (bodyText.length < 40) throw new Error(`${job.id} rendered insufficient text`);
      const path = resolve(RAW_ROOT, `${job.id}.png`);
      await page.screenshot({ path, fullPage:false, animations:'disabled' });
      const metadata = await sharp(path).metadata();
      const stats = await sharp(path).stats();
      if (metadata.width !== VIEWPORT.width || metadata.height !== VIEWPORT.height || stats.entropy < 0.5) {
        throw new Error(`${job.id} produced an invalid ${metadata.width}x${metadata.height} capture (entropy ${stats.entropy})`);
      }
      if (errors.length !== before) throw new Error(errors.slice(before).join('\n'));
      captures.push(Object.freeze({
        ...job, path:posix(relative(ROOT, path)), width:metadata.width, height:metadata.height,
        sha256:sha256(readFileSync(path)), entropy:Number(stats.entropy.toFixed(3))
      }));
    }
  } finally {
    await context.close();
  }
  return captures;
}

function svgText({ width, height, title, subtitle = '', titleSize = 28, align = 'start' }) {
  const anchor = align === 'center' ? 'middle' : 'start';
  const x = align === 'center' ? width / 2 : 18;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <text x="${x}" y="${subtitle ? 35 : Math.round(height * 0.65)}" text-anchor="${anchor}" fill="#f5f2ed" font-family="Arial, sans-serif" font-size="${titleSize}" font-weight="700">${escapeXml(title)}</text>
    ${subtitle ? `<text x="${x}" y="62" text-anchor="${anchor}" fill="#9ba9a4" font-family="Arial, sans-serif" font-size="15">${escapeXml(subtitle)}</text>` : ''}
  </svg>`);
}

async function contactSheet({ id, title, captures }) {
  const columns = Math.min(3, captures.length);
  const rows = Math.ceil(captures.length / columns);
  const imageWidth = 360;
  const imageHeight = 780;
  const cellWidth = 390;
  const cellHeight = 842;
  const headerHeight = 92;
  const footerHeight = 42;
  const width = 30 + columns * cellWidth;
  const height = headerHeight + rows * cellHeight + footerHeight;
  const composites = [{
    input:svgText({ width, height:headerHeight, title, subtitle:'430×932 · Chromium · reduced motion · Voice off' }),
    left:0, top:0
  }];
  for (const [index, capture] of captures.entries()) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const left = 15 + column * cellWidth;
    const top = headerHeight + row * cellHeight;
    const resized = await sharp(resolve(ROOT, capture.path))
      .resize({ width:imageWidth, height:imageHeight, fit:'contain', background:'#07060c' })
      .png().toBuffer();
    composites.push({
      input:svgText({ width:imageWidth, height:42, title:capture.label, titleSize:17 }),
      left, top
    });
    composites.push({ input:resized, left, top:top + 42 });
  }
  composites.push({
    input:svgText({ width, height:footerHeight, title:'Representative initial state per canonical surface', titleSize:14, align:'center' }),
    left:0, top:height - footerHeight
  });
  const path = resolve(DOC_SCREENSHOTS, `${id}.jpg`);
  await sharp({ create:{ width, height, channels:3, background:'#07060c' } })
    .composite(composites)
    .jpeg({ quality:82, chromaSubsampling:'4:4:4' })
    .toFile(path);
  const metadata = await sharp(path).metadata();
  return Object.freeze({
    id, title, path:posix(relative(ROOT, path)), width:metadata.width, height:metadata.height,
    sha256:sha256(readFileSync(path)), captureIds:captures.map(capture => capture.id)
  });
}

async function captureAcademy(catalog, head) {
  const { server, baseUrl } = await staticServer();
  const browser = await launchBrowser();
  try {
    const freshHomeJobs = [{ id:'home--new-learner', route:'#/academy', label:'New learner' }];
    const completeJobs = [
      { id:'home--full-progress', route:'#/academy', label:'Full progress' },
      ...catalog.flatMap(experience => experience.surfaces.map(surface => ({
        id:`${experience.id}--s${surface.index}--${surface.id}`,
        route:`#/experience/${experience.id}/surface/${surface.index}`,
        label:`S${surface.index} · ${surface.title}`,
        experienceId:experience.id, surface:surface.index, surfaceId:surface.id
      })))
    ];
    const fresh = await captureJobs({ browser, baseUrl, seed:seededAcademy(), jobs:freshHomeJobs });
    const complete = await captureJobs({ browser, baseUrl, seed:seededAcademy({ complete:true }), jobs:completeJobs });
    const captures = [...fresh, ...complete];
    const groups = [{
      id:'academy-home', title:'Academy Home',
      captures:captures.filter(capture => capture.id.startsWith('home--'))
    }, ...catalog.map(experience => ({
      id:experience.id, title:experience.title,
      captures:captures.filter(capture => capture.experienceId === experience.id)
    }))];
    const contactSheets = [];
    for (const group of groups) contactSheets.push(await contactSheet(group));
    const manifest = {
      schemaVersion:1, generatedAt:new Date().toISOString(), sourceHead:head,
      viewport:{ ...VIEWPORT, deviceScaleFactor:1 }, engine:'Chromium', reducedMotion:true,
      voiceMode:'off', canonicalScreenCount:1 + catalog.length * SURFACE_COUNT,
      capturedStateCount:captures.length, contactSheetCount:contactSheets.length,
      captures, contactSheets
    };
    writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    return manifest;
  } finally {
    await browser.close();
    await new Promise(resolvePromise => server.close(resolvePromise));
  }
}

function curriculumRows(catalog) {
  return catalog.map(experience => `<tr>
    <td>${escapeHtml(experience.familyId)}</td><td>${escapeHtml(experience.title)}</td>
    <td><code>${escapeHtml(experience.id)}</code></td>
    <td>${experience.prerequisiteExperienceIds.length ? experience.prerequisiteExperienceIds.map(id => `<code>${escapeHtml(id)}</code>`).join(', ') : 'None'}</td>
    <td>${experience.core ? 'Core · 120 XP' : 'Optional · no XP'}</td>
  </tr>`).join('');
}

function buildHtmlReport({ entries, catalog, manifest, head }) {
  const images = manifest.contactSheets.map(sheet => {
    const base64 = readFileSync(resolve(ROOT, sheet.path)).toString('base64');
    return `<section class="visual"><h3>${escapeHtml(sheet.title)}</h3><img loading="lazy" src="data:image/jpeg;base64,${base64}" alt="${escapeHtml(sheet.title)} Academy contact sheet"></section>`;
  }).join('');
  const indexRows = entries.map(entry => `<tr data-file-row data-path="${escapeHtml(entry.path.toLowerCase())}">
    <td>${escapeHtml(entry.category)}</td><td><a href="#file-${sha256(entry.path).slice(0, 12)}"><code>${escapeHtml(entry.path)}</code></a></td>
    <td>${entry.lines.toLocaleString('en-US')}</td><td>${entry.bytes.toLocaleString('en-US')}</td><td><code>${entry.hash.slice(0, 12)}</code></td>
  </tr>`).join('');
  const code = entries.map(entry => `<details class="source-file" data-source-file data-path="${escapeHtml(entry.path.toLowerCase())}" id="file-${sha256(entry.path).slice(0, 12)}">
    <summary><span>${escapeHtml(entry.path)}</span><small>${escapeHtml(entry.category)} · ${entry.lines.toLocaleString('en-US')} lines · ${entry.bytes.toLocaleString('en-US')} bytes</small></summary>
    <pre><code>${escapeHtml(entry.text)}</code></pre>
  </details>`).join('');
  const runtime = entries.filter(entry => entry.category === 'runtime');
  const tests = entries.filter(entry => entry.category === 'tests-and-tooling');
  const totalBytes = entries.reduce((sum, entry) => sum + entry.bytes, 0);
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Flightglass Academy · complete analysis pack</title>
<style>
:root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#07060c;color:#f5f2ed;--ember:#ff8a4d;--violet:#9d8bff;--muted:#a7aba8;--line:#2a2735}*{box-sizing:border-box}body{margin:0;background:#07060c;color:#f5f2ed}header,main{width:min(1180px,calc(100% - 32px));margin:auto}header{padding:64px 0 32px;border-bottom:1px solid var(--line)}h1{font-size:clamp(2.2rem,7vw,5rem);line-height:.94;letter-spacing:-.055em;margin:.15em 0}.eyebrow{color:var(--ember);font:700 .78rem ui-monospace,monospace;letter-spacing:.18em;text-transform:uppercase}.lede{max-width:72ch;color:#c4c5c3;font-size:1.05rem;line-height:1.65}.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin:28px 0}.fact{padding:16px;border:1px solid var(--line);border-radius:12px;background:#0d0c13}.fact strong{display:block;font:700 1.6rem ui-monospace,monospace;color:var(--violet)}main{padding:28px 0 100px}section{margin:48px 0}h2{font-size:1.8rem;letter-spacing:-.03em;margin:0 0 16px}h3{margin:0 0 12px}.copy{max-width:78ch;color:#c8c9c7;line-height:1.65}.flow{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;align-items:center;margin:24px 0}.flow div{padding:13px 10px;border:1px solid #3e3757;border-radius:10px;text-align:center;background:#100e18}.flow b{color:var(--violet)}table{width:100%;border-collapse:collapse;font-size:.88rem}th,td{text-align:left;padding:10px;border-bottom:1px solid var(--line);vertical-align:top}th{color:#b8b0e5}code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:#e5ddff}.notice{padding:16px;border-left:3px solid var(--ember);background:#120e0c;color:#d9d4cf;line-height:1.55}.visual img{display:block;width:100%;height:auto;border:1px solid var(--line);border-radius:14px;background:#07060c}.visual{margin:34px 0}.source-tools{position:sticky;top:0;z-index:3;padding:12px 0;background:rgba(7,6,12,.94);backdrop-filter:blur(12px)}input{width:100%;min-height:46px;border:1px solid #454052;border-radius:10px;background:#0d0c13;color:#fff;padding:0 14px;font:inherit}.source-file{border:1px solid var(--line);border-radius:10px;margin:8px 0;background:#0b0a10}.source-file summary{cursor:pointer;padding:13px 15px;display:flex;justify-content:space-between;gap:16px}.source-file small{color:var(--muted)}pre{margin:0;padding:18px;overflow:auto;border-top:1px solid var(--line);background:#050509;font:12px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre}a{color:#c9bdff}.hidden{display:none!important}@media(max-width:760px){.flow{grid-template-columns:1fr}.source-file summary{display:block}.source-file small{display:block;margin-top:5px}table{display:block;overflow:auto}}
</style></head><body>
<header><div class="eyebrow">Flightglass · Academy · forensic module pack</div><h1>Learn one physical relationship at a time.</h1>
<p class="lede">Academy is Flightglass's guided golf-physics curriculum. It turns protected engine truths into short, interactive six-surface experiences, then awards mastery only when knowledge and a live transfer task both pass.</p>
<div class="facts"><div class="fact"><strong>13 + 1</strong>core experiences + optional lab</div><div class="fact"><strong>85</strong>canonical screens</div><div class="fact"><strong>24</strong>owned physics concepts</div><div class="fact"><strong>102</strong>local Voice cues</div><div class="fact"><strong>${entries.length}</strong>text source files in this pack</div><div class="fact"><strong>${(totalBytes / 1024 / 1024).toFixed(2)} MB</strong>uncompressed source</div></div>
<p class="lede">Generated from <code>${escapeHtml(head)}</code>. Viewport evidence uses Chromium at 430×932, reduced motion and Voice off. Contact sheets show the representative initial state of every canonical surface; interactive branches are covered by the included tests rather than multiplied into screenshots.</p></header>
<main><section><h2>1. Product and learning model</h2><p class="copy">Academy Home asks what outcome the golfer wants to control, recommends one next experience, and exposes progress by family. Each experience is a paged Mission → Instrument/Lab → Influence → Boundary/Myths → Mastery → Result loop. Canonical routes use <code>#/experience/{id}/surface/{0..5}</code>; 24 legacy <code>#/lesson/{concept}</code> routes resolve to the owning experience without migrating the protected storage key.</p>
<div class="flow"><div><b>Hash route</b><br>canonical or legacy</div><div><b>Curriculum</b><br>owner + prerequisites</div><div><b>Experience host</b><br>one renderer</div><div><b>Model adapter</b><br>protected engine truth</div><div><b>Store + Voice</b><br>evidence, XP, local cue</div></div>
<p class="copy">Core mastery is a shared transaction: 4/5 knowledge plus the module's live transfer gate awards 120 XP once. The optional Plane Coupling lab records exploration separately and never gates a core experience. Voice is local and consent-based; captions and visible truth remain complete when audio is off.</p></section>
<section><h2>2. Architecture inventory</h2><p class="copy">The canonical runtime contains ${runtime.length} files. Most newer experiences use a four-part slice: <code>*-content.js</code>, <code>*-model.js</code>, <code>*-experience.js</code> and <code>*.css</code>. Shared curriculum, router, store, host, journey and Voice modules coordinate the slices. Backspin remains the native reference implementation in <code>academy-native-lesson.js</code>. The largest risk concentration is <code>academy.html</code>, which still combines the shell, 24 legacy content blocks, routing orchestration and older generic lesson machinery.</p>
<table><thead><tr><th>Family</th><th>Experience</th><th>Canonical ID</th><th>Prerequisites</th><th>Reward</th></tr></thead><tbody>${curriculumRows(catalog)}</tbody></table></section>
<section><h2>3. Current evidence boundary</h2><div class="notice">The curriculum is source-complete and previously passed the full 500/500 control gate. The documentation run on 2026-07-17 hit its one-hour shell timeout while still progressing through sequential WebKit, with no assertion failure and no file mutation. This report is not release acceptance. New-module pairwise review, physical-device/audio-route checks, iOS VoiceOver/fatigue evidence and native iOS/Android projects remain open.</div></section>
<section><h2>4. Visual catalog · all canonical pages</h2><p class="copy">Academy Home is shown for a new learner and a fully progressed learner. Every experience then shows S0–S5. Full-size 430×932 PNGs and route metadata are beside this report under <code>outputs/academy-analysis/screenshots/raw/</code>.</p>${images}</section>
<section><h2>5. Complete source snapshot</h2><p class="copy">The embedded source contains all canonical Academy runtime code, direct physics/geometry/haptics dependencies, Voice and surface configuration, package commands, ${tests.length} Academy test/tool files and the strict Voice verifier. Binary M4A files, generated <code>www/</code> copies, historical mocks and planning documents are excluded; the Voice manifest still inventories all 102 binaries by path and hash.</p>
<div class="source-tools"><input id="fileFilter" type="search" placeholder="Filter source files by path or category" aria-label="Filter source files"></div>
<table><thead><tr><th>Category</th><th>Path</th><th>Lines</th><th>Bytes</th><th>SHA-256</th></tr></thead><tbody>${indexRows}</tbody></table>
<div id="sourceFiles">${code}</div></section></main>
<script>const filter=document.getElementById('fileFilter');filter.addEventListener('input',()=>{const query=filter.value.trim().toLowerCase();document.querySelectorAll('[data-file-row],[data-source-file]').forEach(element=>element.classList.toggle('hidden',query&&!element.dataset.path.includes(query)));});</script>
</body></html>`;
  writeFileSync(REPORT_PATH, html, 'utf8');
  return { path:posix(relative(ROOT, REPORT_PATH)), bytes:statSync(REPORT_PATH).size };
}

async function verifyOutputs(entries, catalog) {
  const required = [SNAPSHOT_PATH, REPORT_PATH, MANIFEST_PATH];
  required.forEach(path => { if (!existsSync(path)) throw new Error(`Missing Academy analysis output: ${path}`); });
  const snapshot = readFileSync(SNAPSHOT_PATH, 'utf8');
  for (const entry of entries) {
    if (!snapshot.includes(`| ${entry.hash} | ${entry.path}`) || !snapshot.includes(`===== BEGIN FILE: ${entry.path} =====`)) {
      throw new Error(`Academy source snapshot is stale or incomplete: ${entry.path}`);
    }
  }
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const expectedScreens = 1 + catalog.length * SURFACE_COUNT;
  const expectedStates = 2 + catalog.length * SURFACE_COUNT;
  if (manifest.canonicalScreenCount !== expectedScreens || manifest.capturedStateCount !== expectedStates || manifest.contactSheetCount !== catalog.length + 1) {
    throw new Error(`Academy visual manifest count mismatch: ${JSON.stringify({ expectedScreens, expectedStates, manifest })}`);
  }
  if (manifest.captures.some(capture => capture.width !== VIEWPORT.width || capture.height !== VIEWPORT.height || capture.entropy < 0.5)) {
    throw new Error('Academy visual manifest contains an invalid capture');
  }
  for (const sheet of manifest.contactSheets) {
    const path = resolve(ROOT, sheet.path);
    if (!existsSync(path) || sha256(readFileSync(path)) !== sheet.sha256) throw new Error(`Academy contact sheet mismatch: ${sheet.id}`);
  }
  const report = readFileSync(REPORT_PATH, 'utf8');
  const embeddedImages = (report.match(/data:image\/jpeg;base64,/g) || []).length;
  if (embeddedImages !== manifest.contactSheetCount || entries.some(entry => !report.includes(`data-path="${escapeHtml(entry.path.toLowerCase())}"`))) {
    throw new Error('Self-contained Academy report is missing images or source files');
  }
  return {
    ok:true, sourceFiles:entries.length, canonicalScreens:expectedScreens,
    capturedStates:expectedStates, contactSheets:manifest.contactSheetCount,
    snapshotBytes:statSync(SNAPSHOT_PATH).size, reportBytes:statSync(REPORT_PATH).size
  };
}

export async function main(argv = process.argv.slice(2)) {
  ensureDirectories();
  const entries = sourceFiles();
  const catalog = await experienceCatalog();
  if (argv.includes('--check')) return verifyOutputs(entries, catalog);
  const head = sourceHead();
  const snapshot = buildSnapshot(entries, head);
  const manifest = argv.includes('--snapshot-only')
    ? (existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) : null)
    : await captureAcademy(catalog, head);
  if (!manifest) throw new Error('A visual manifest is required before the self-contained report can be built');
  const report = buildHtmlReport({ entries, catalog, manifest, head });
  const verified = await verifyOutputs(entries, catalog);
  return { snapshot, report, ...verified };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {
    console.error(error.stack || error.message); process.exitCode = 1;
  });
}
