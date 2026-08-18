import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import {
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const { chromium } = require('../tools/node_modules/playwright-core');
const playwrightPackage = require('../tools/node_modules/playwright-core/package.json');
const playwrightBrowsers = require('../tools/node_modules/playwright-core/browsers.json');
const execFileAsync = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FULL_SHA_PATTERN = /^[0-9a-f]{40}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const chromiumDescriptor = playwrightBrowsers.browsers.find(browser => browser.name === 'chromium');

if (!chromiumDescriptor) throw new Error('Installed playwright-core has no pinned Chromium descriptor.');

export const EVIDENCE_LABEL = 'synthetic-native preflight — not final TestFlight/StoreKit evidence';
export const WATERMARK_TEXT = 'SYNTHETIC-NATIVE — DO NOT SUBMIT — NOT TESTFLIGHT/STOREKIT EVIDENCE';
export const SYNTHETIC_OUTPUT_DIRECTORY = 'synthetic-native-do-not-submit';
export const MANIFEST_FILE = 'synthetic-native-do-not-submit-manifest.json';

export const PINNED_BROWSER = Object.freeze({
  distribution: 'Playwright-managed Chromium',
  playwrightCoreVersion: playwrightPackage.version,
  revision: chromiumDescriptor.revision,
  browserVersion: chromiumDescriptor.browserVersion,
});

export const CAPTURE_CONTRACT = Object.freeze({
  viewportCss: Object.freeze({ width: 430, height: 932 }),
  deviceScaleFactor: 3,
  outputPixels: Object.freeze({ width: 1290, height: 2796 }),
  reducedMotion: 'reduce',
  colorScheme: 'dark',
  locale: 'nb-NO',
  timezoneId: 'Europe/Oslo',
  nativePlatformFixture: 'ios',
  iapModuleIntercept: '/sa-iap.js',
});

export const CAPTURE_SOURCE_PATHS = Object.freeze([
  'impact.html',
  'sa-view-transition-guard.js',
  'sa-p3.css',
  'sa.css',
  'sa-app-shell.css',
  'sa-paywall.css',
  'impact-camera.js',
  'impact-framing.js',
  'impact-outcome.js',
  'impact-annotate.js',
  'sa-haptics.js',
  'sa-access.js',
  'sa-analytics.js',
  'sa-paywall.js',
  'sa-orientation.js',
  'sa-app-shell.js',
  'sa-range-context.js',
  'sa-v1-context.js',
  'impact-flight.js',
  'flightglass-3d-spin-model.js',
  'assets/range-night-3d-33.png',
  'vendor/fonts/Inter-Regular.woff2',
  'vendor/fonts/Inter-Medium.woff2',
  'vendor/fonts/Inter-SemiBold.woff2',
  'vendor/fonts/Inter-Bold.woff2',
  'vendor/fonts/SpaceGrotesk-Medium.woff2',
  'vendor/fonts/SpaceGrotesk-SemiBold.woff2',
  'vendor/fonts/SpaceGrotesk-Bold.woff2',
  'vendor/fonts/IBMPlexMono-Regular.woff2',
  'vendor/fonts/IBMPlexMono-Medium.woff2',
  'vendor/fonts/IBMPlexMono-SemiBold.woff2',
]);

const CAPTURE_HTTP_PATHS = new Set([
  ...CAPTURE_SOURCE_PATHS.map(path => `/${path}`),
  CAPTURE_CONTRACT.iapModuleIntercept,
]);

const PLANS = Object.freeze([
  Object.freeze({
    id: 'monthly',
    productId: 'strikearc_pro_monthly',
    price: 'kr 99',
    cta: 'Continue — kr 99 per month',
    file: 'synthetic-native-do-not-submit-monthly.png',
  }),
  Object.freeze({
    id: 'annual',
    productId: 'strikearc_pro_annual',
    price: 'kr 499',
    cta: 'Continue — kr 499 per year',
    file: 'synthetic-native-do-not-submit-annual.png',
  }),
]);

export const IAP_FIXTURE_SOURCE = `
export const ENTITLEMENT_ID = 'pro';
export const PRODUCT_IDS = Object.freeze({
  monthly: 'strikearc_pro_monthly',
  annual: 'strikearc_pro_annual',
});
export const PURCHASE_STATUS = Object.freeze({
  SUCCESS: 'success',
  CANCELLED: 'cancelled',
  PENDING: 'pending',
  ERROR: 'error',
  UNAVAILABLE: 'unavailable',
  NOT_FOUND: 'not-found',
});
export const init = async () => 'ready';
export const isNative = () => true;
export const isPro = () => false;
export const getConfigurationStatus = () => 'ready';
export async function getOfferings() {
  return {
    monthly: { product: { identifier: PRODUCT_IDS.monthly, priceString: 'kr 99' } },
    annual: { product: {
      identifier: PRODUCT_IDS.annual,
      priceString: 'kr 499',
      pricePerMonthString: 'kr 42',
    } },
  };
}
export const purchaseDetailed = async () => ({ status: PURCHASE_STATUS.CANCELLED });
export const restoreDetailed = async () => ({ status: PURCHASE_STATUS.NOT_FOUND });
export const purchase = async () => false;
export const restore = async () => false;
globalThis.__sa = globalThis.__sa || {};
globalThis.__sa.iap = {
  init,
  isNative,
  isPro,
  getOfferings,
  purchase,
  purchaseDetailed,
  restore,
  restoreDetailed,
  getConfigurationStatus,
};
`;

class PreflightError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'PreflightError';
  }
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function requireFullSha(candidate) {
  if (!FULL_SHA_PATTERN.test(String(candidate || ''))) {
    throw new PreflightError('--candidate must be exactly one 40-character lowercase hexadecimal commit SHA.');
  }
  return candidate;
}

export function parseCliArguments(argv = process.argv.slice(2)) {
  let candidate = null;
  const seen = new Set();
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag !== '--candidate') {
      throw new PreflightError(`Unknown argument "${flag}". Usage: --candidate <full-sha>.`);
    }
    if (seen.has(flag)) throw new PreflightError('Argument "--candidate" may only be provided once.');
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--') || value.trim() === '') {
      throw new PreflightError('Argument "--candidate" requires a value.');
    }
    candidate = value.trim();
    seen.add(flag);
    index += 1;
  }
  if (!candidate) throw new PreflightError('Missing required --candidate. Usage: --candidate <full-sha>.');
  return { candidate: requireFullSha(candidate) };
}

async function commandOutput(executable, args, { cwd, label }) {
  try {
    const { stdout } = await execFileAsync(executable, args, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
      windowsHide: true,
    });
    return stdout.trim();
  } catch (error) {
    const detail = String(error?.stderr || error?.message || '').trim();
    throw new PreflightError(`${label} failed${detail ? `: ${detail}` : '.'}`, { cause: error });
  }
}

async function gitOutput(root, args, label) {
  return commandOutput('git', args, { cwd: root, label });
}

export async function validateCandidate({ candidate, root = ROOT }) {
  requireFullSha(candidate);
  const status = await gitOutput(root, ['status', '--porcelain=v1', '--untracked-files=all'], 'git status');
  if (status) {
    throw new PreflightError('Candidate working tree must be clean before IAP review screenshot capture.');
  }
  const head = await gitOutput(root, ['rev-parse', '--verify', 'HEAD'], 'git rev-parse HEAD');
  if (!FULL_SHA_PATTERN.test(head)) {
    throw new PreflightError('Checked-out HEAD is not an exact 40-character SHA-1 commit.');
  }
  if (candidate !== head) {
    throw new PreflightError(`--candidate ${candidate} does not exactly equal checked-out HEAD ${head}.`);
  }
  return head;
}

export async function createCandidateWebSnapshot({ candidate, root = ROOT, workspaceDirectory }) {
  requireFullSha(candidate);
  if (!workspaceDirectory) throw new PreflightError('A candidate snapshot workspace is required.');
  await mkdir(workspaceDirectory, { recursive: true });
  const snapshotDirectory = join(workspaceDirectory, 'candidate-web');
  const archivePath = join(workspaceDirectory, 'candidate-web.tar');
  try {
    await mkdir(snapshotDirectory, { recursive: false });
  } catch (error) {
    if (error?.code !== 'EEXIST') throw error;
    throw new PreflightError(`Candidate snapshot directory already exists: ${snapshotDirectory}`, { cause: error });
  }

  try {
    await commandOutput('git', [
      '-c',
      'core.autocrlf=false',
      'archive',
      '--format=tar',
      `--output=${archivePath}`,
      candidate,
      '--',
      ...CAPTURE_SOURCE_PATHS,
    ], {
      cwd: root,
      label: `git archive ${candidate}`,
    });
    await commandOutput('tar', ['-xf', archivePath, '-C', snapshotDirectory], {
      cwd: workspaceDirectory,
      label: 'candidate archive extraction',
    });
  } finally {
    await rm(archivePath, { force: true });
  }

  for (const relativePath of CAPTURE_SOURCE_PATHS) {
    const file = join(snapshotDirectory, ...relativePath.split('/'));
    let metadata;
    try {
      metadata = await lstat(file);
    } catch (error) {
      throw new PreflightError(`Candidate snapshot is missing required paywall asset: ${relativePath}`, { cause: error });
    }
    if (!metadata.isFile() || metadata.isSymbolicLink()) {
      throw new PreflightError(`Candidate snapshot asset must be a regular file: ${relativePath}`);
    }
  }
  return snapshotDirectory;
}

async function hashCandidateWebSnapshot(webRoot) {
  const hash = createHash('sha256');
  hash.update('flightglass-iap-preflight-candidate-web-v1\0');
  for (const relativePath of CAPTURE_SOURCE_PATHS) {
    hash.update(relativePath);
    hash.update('\0');
    hash.update(await readFile(join(webRoot, ...relativePath.split('/'))));
    hash.update('\0');
  }
  return hash.digest('hex');
}

function contentType(path) {
  return {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
  }[extname(path).toLowerCase()] || 'application/octet-stream';
}

function pathIsInside(root, path) {
  const local = relative(root, path);
  return local !== '..' && !local.startsWith(`..${sep}`) && !isAbsolute(local);
}

const SERVER_HEADERS = Object.freeze({
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'self' data:; connect-src 'none'; font-src 'self'; frame-src 'none'; img-src 'self' data:; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; base-uri 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
});

export async function startLocalServer({ root = ROOT } = {}) {
  const servingRoot = resolve(root);
  const server = createServer(async (request, response) => {
    try {
      if (!['GET', 'HEAD'].includes(request.method || 'GET')) {
        response.writeHead(405, { Allow: 'GET, HEAD' }).end();
        return;
      }
      let pathname;
      try {
        pathname = decodeURIComponent(new URL(request.url || '/', 'http://127.0.0.1').pathname);
      } catch {
        response.writeHead(400).end();
        return;
      }
      const hasDotSegment = pathname.split('/').some(segment => segment.startsWith('.'));
      if (hasDotSegment || !CAPTURE_HTTP_PATHS.has(pathname)) {
        response.writeHead(404, SERVER_HEADERS).end();
        return;
      }
      if (pathname === CAPTURE_CONTRACT.iapModuleIntercept) {
        response.writeHead(200, {
          ...SERVER_HEADERS,
          'Content-Type': 'text/javascript; charset=utf-8',
        });
        response.end(request.method === 'HEAD' ? undefined : IAP_FIXTURE_SOURCE);
        return;
      }

      const localPath = pathname.replace(/^\/+/, '');
      const file = resolve(servingRoot, localPath);
      if (!pathIsInside(servingRoot, file)) {
        response.writeHead(403).end();
        return;
      }
      try {
        const metadata = await lstat(file);
        if (!metadata.isFile() || metadata.isSymbolicLink()) {
          response.writeHead(404, SERVER_HEADERS).end();
          return;
        }
        const data = await readFile(file);
        response.writeHead(200, {
          ...SERVER_HEADERS,
          'Content-Type': contentType(file),
        });
        response.end(request.method === 'HEAD' ? undefined : data);
      } catch {
        response.writeHead(404).end();
      }
    } catch {
      if (!response.headersSent) response.writeHead(500);
      response.end();
    }
  });

  await new Promise((resolveListen, rejectListen) => {
    const reject = error => rejectListen(error);
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolveListen();
    });
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    await new Promise(resolveClose => server.close(resolveClose));
    throw new PreflightError('Local IAP preflight server did not bind a TCP port.');
  }
  let closed = false;
  return Object.freeze({
    origin: `http://127.0.0.1:${address.port}`,
    close: async () => {
      if (closed) return;
      closed = true;
      await new Promise((resolveClose, rejectClose) => {
        server.close(error => (error ? rejectClose(error) : resolveClose()));
      });
    },
  });
}

async function launchChromium() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    const detail = String(error?.message || error).split(/\r?\n/, 1)[0];
    throw new PreflightError(
      `Pinned Playwright Chromium revision ${PINNED_BROWSER.revision} is unavailable. Run playwright-core install chromium. ${detail}`,
      { cause: error },
    );
  }
  const actualVersion = browser.version();
  if (actualVersion !== PINNED_BROWSER.browserVersion) {
    await browser.close().catch(() => {});
    throw new PreflightError(
      `Pinned Chromium version mismatch: expected ${PINNED_BROWSER.browserVersion}, found ${actualVersion}.`,
    );
  }
  return { browser, distribution: PINNED_BROWSER.distribution };
}

function assertRuntimeEnvironment(runtime) {
  const expected = CAPTURE_CONTRACT;
  const checks = [
    [runtime.width === expected.viewportCss.width, `viewport width ${runtime.width}`],
    [runtime.height === expected.viewportCss.height, `viewport height ${runtime.height}`],
    [runtime.deviceScaleFactor === expected.deviceScaleFactor, `device scale factor ${runtime.deviceScaleFactor}`],
    [runtime.reducedMotion === true, 'reduced motion is not active'],
    [runtime.dark === true, 'dark color scheme is not active'],
    [runtime.locale === expected.locale, `locale ${runtime.locale}`],
    [runtime.timezoneId === expected.timezoneId, `timezone ${runtime.timezoneId}`],
    [runtime.native === true, 'Capacitor native fixture is not active'],
    [runtime.platform === expected.nativePlatformFixture, `native platform ${runtime.platform}`],
  ];
  const failed = checks.find(([passed]) => !passed);
  if (failed) throw new PreflightError(`Deterministic capture environment mismatch: ${failed[1]}.`);
}

async function settlePage(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame)));
  });
}

async function stabilizeObscuredRangeGlass(page) {
  // The live Range action sits behind the modal scrim. Its backdrop-filter
  // samples GPU-composited canvas pixels and can vary by a few values between
  // otherwise identical Chromium runs. Hide only that obscured control so the
  // purchase surface remains authentic and its pixels stay reproducible.
  await page.addStyleTag({ content: `
    #pinFab {
      visibility: hidden !important;
      transition: none !important;
    }
  ` });
}

async function addSyntheticEvidenceWatermark(page) {
  await page.addStyleTag({ content: `
    #sa-synthetic-native-watermark {
      position: fixed;
      z-index: 2147483647;
      inset: 0 0 auto 0;
      box-sizing: border-box;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 6px;
      border-block-end: 2px solid #1a1200;
      background: rgb(255, 196, 0);
      color: #1a1200;
      font: 600 8px/1 'IBM Plex Mono', monospace;
      letter-spacing: .02em;
      text-align: center;
      white-space: nowrap;
      pointer-events: none;
    }
  ` });
  await page.evaluate(text => {
    const watermark = document.createElement('div');
    watermark.id = 'sa-synthetic-native-watermark';
    watermark.dataset.evidenceKind = 'synthetic-native-do-not-submit';
    watermark.setAttribute('aria-hidden', 'true');
    watermark.textContent = text;
    document.querySelector('.sa-pw-scrim')?.append(watermark);
  }, WATERMARK_TEXT);
}

async function readPaywallState(page) {
  return page.evaluate(() => {
    const dialog = document.querySelector('.sa-pw-scrim');
    const card = document.querySelector('.sa-pw-card');
    const cta = document.querySelector('.sa-pw-cta');
    const watermark = document.querySelector('#sa-synthetic-native-watermark');
    const fullyInsideViewport = element => {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      const tolerance = 0.5;
      return rect.width > 0
        && rect.height > 0
        && rect.left >= -tolerance
        && rect.top >= -tolerance
        && rect.right <= innerWidth + tolerance
        && rect.bottom <= innerHeight + tolerance;
    };
    const plans = [...document.querySelectorAll('.sa-pw-plan')].map(label => {
      const input = label.querySelector('input[name="sa-pw-plan"]');
      const price = label.querySelector('.sa-pw-price__amount');
      return {
        id: input?.value || null,
        checked: Boolean(input?.checked),
        disabled: Boolean(input?.disabled),
        price: price?.textContent?.trim() || '',
        priceSource: price?.dataset.priceSource || '',
      };
    });
    return {
      dialogOpen: Boolean(dialog?.open),
      dialogText: dialog?.innerText || '',
      plans,
      radioCount: document.querySelectorAll('input[name="sa-pw-plan"]').length,
      selectedPlan: globalThis.__sa?.paywall?.state?.().selectedPlan || null,
      cta: cta?.textContent?.trim() || '',
      ctaDisabled: Boolean(cta?.disabled),
      paywallFullyInsideViewport: fullyInsideViewport(card),
      ctaFullyInsideViewport: fullyInsideViewport(cta),
      syntheticWatermarkVisible: fullyInsideViewport(watermark)
        && watermark?.textContent === 'SYNTHETIC-NATIVE — DO NOT SUBMIT — NOT TESTFLIGHT/STOREKIT EVIDENCE'
        && getComputedStyle(watermark).visibility === 'visible'
        && getComputedStyle(watermark).display !== 'none',
    };
  });
}

function assertPaywallState(state, expectedPlan) {
  const expectedPlans = PLANS.map(plan => ({
    id: plan.id,
    checked: plan.id === expectedPlan.id,
    disabled: false,
    price: plan.price,
    priceSource: 'store',
  }));
  if (!state.dialogOpen) throw new PreflightError('Paywall dialog is not open.');
  if (state.radioCount !== 2 || state.plans.length !== 2) {
    throw new PreflightError(`Expected exactly two Monthly/Annual plans; found ${state.plans.length}.`);
  }
  if (JSON.stringify(state.plans) !== JSON.stringify(expectedPlans)) {
    throw new PreflightError(`Paywall plan contract mismatch: ${JSON.stringify(state.plans)}.`);
  }
  if (/lifetime/i.test(state.dialogText)) throw new PreflightError('Lifetime is visible in the synthetic IAP preflight.');
  if (state.selectedPlan !== expectedPlan.id) {
    throw new PreflightError(`Expected ${expectedPlan.id} selected; found ${state.selectedPlan}.`);
  }
  if (state.cta !== expectedPlan.cta) {
    throw new PreflightError(`Expected CTA "${expectedPlan.cta}"; found "${state.cta}".`);
  }
  if (state.ctaDisabled) throw new PreflightError(`CTA is disabled for the store-priced ${expectedPlan.id} plan.`);
  if (!state.paywallFullyInsideViewport) {
    throw new PreflightError('The complete paywall card is not inside the 430x932 capture viewport.');
  }
  if (!state.ctaFullyInsideViewport) {
    throw new PreflightError('The purchase CTA is not fully inside the 430x932 capture viewport.');
  }
  if (!state.syntheticWatermarkVisible) {
    throw new PreflightError('The synthetic-native do-not-submit watermark is not fully visible.');
  }
}

async function normalizeScreenshot(input, output) {
  await sharp(input)
    .flatten({ background: '#07060c' })
    .removeAlpha()
    .toColourspace('srgb')
    .withIccProfile('srgb')
    .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
    .toFile(output);
  const metadata = await sharp(output).metadata();
  const expected = CAPTURE_CONTRACT.outputPixels;
  if (
    metadata.format !== 'png'
    || metadata.width !== expected.width
    || metadata.height !== expected.height
    || metadata.space !== 'srgb'
    || metadata.hasAlpha !== false
    || !metadata.icc?.byteLength
  ) {
    throw new PreflightError(`Normalized PNG contract failed for ${output}: ${JSON.stringify({
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      space: metadata.space,
      hasAlpha: metadata.hasAlpha,
      iccBytes: metadata.icc?.byteLength || 0,
    })}.`);
  }
  return metadata;
}

async function prepareEmptyStage(stageDirectory) {
  try {
    await mkdir(stageDirectory, { recursive: false });
  } catch (error) {
    if (error?.code !== 'EEXIST') throw error;
    const entries = await readdir(stageDirectory);
    if (entries.length > 0) throw new PreflightError(`Staging directory must be empty: ${stageDirectory}`);
  }
}

function buildManifest({
  candidate,
  candidateSnapshotSha256,
  chromiumVersion,
  chromiumDistribution,
  artifacts,
  captureAssertions,
}) {
  return {
    schemaVersion: 1,
    immutable: true,
    label: EVIDENCE_LABEL,
    finalTestFlightOrStoreKitEvidence: false,
    watermark: WATERMARK_TEXT,
    candidate,
    hashAlgorithm: 'sha256',
    source: {
      kind: 'exact-candidate git archive snapshot',
      candidateSnapshotSha256,
      servedAssetAllowlist: [...CAPTURE_SOURCE_PATHS],
    },
    environment: {
      engine: 'Chromium',
      chromiumVersion,
      chromiumDistribution,
      playwrightCoreVersion: PINNED_BROWSER.playwrightCoreVersion,
      chromiumRevision: PINNED_BROWSER.revision,
      viewportCss: { ...CAPTURE_CONTRACT.viewportCss },
      deviceScaleFactor: CAPTURE_CONTRACT.deviceScaleFactor,
      outputPixels: { ...CAPTURE_CONTRACT.outputPixels },
      reducedMotion: CAPTURE_CONTRACT.reducedMotion,
      colorScheme: CAPTURE_CONTRACT.colorScheme,
      locale: CAPTURE_CONTRACT.locale,
      timezoneId: CAPTURE_CONTRACT.timezoneId,
      nativePlatformFixture: CAPTURE_CONTRACT.nativePlatformFixture,
      iapModuleIntercept: CAPTURE_CONTRACT.iapModuleIntercept,
      iapFixtureSha256: sha256(IAP_FIXTURE_SOURCE),
      captureStabilization: 'hide the obscured live Range glass action',
      networkPolicy: 'same-origin allowlist only; external HTTP(S) and WebSocket requests blocked',
    },
    offering: {
      monthly: { productId: PLANS[0].productId, price: PLANS[0].price },
      annual: { productId: PLANS[1].productId, price: PLANS[1].price },
      lifetimeVisible: false,
    },
    captureAssertions,
    artifacts,
  };
}

export async function captureSyntheticNativePreflight({
  candidate,
  webRoot,
  stageDirectory,
}) {
  requireFullSha(candidate);
  if (!webRoot) throw new PreflightError('An exact-candidate web snapshot is required.');
  if (!stageDirectory) throw new PreflightError('A staging directory is required.');
  await prepareEmptyStage(stageDirectory);
  const candidateSnapshotSha256 = await hashCandidateWebSnapshot(webRoot);
  const server = await startLocalServer({ root: webRoot });
  let browser;
  let context;
  try {
    const launched = await launchChromium();
    browser = launched.browser;
    const chromiumVersion = browser.version();
    context = await browser.newContext({
      viewport: { ...CAPTURE_CONTRACT.viewportCss },
      screen: { ...CAPTURE_CONTRACT.viewportCss },
      deviceScaleFactor: CAPTURE_CONTRACT.deviceScaleFactor,
      reducedMotion: CAPTURE_CONTRACT.reducedMotion,
      colorScheme: CAPTURE_CONTRACT.colorScheme,
      locale: CAPTURE_CONTRACT.locale,
      timezoneId: CAPTURE_CONTRACT.timezoneId,
      hasTouch: true,
      isMobile: true,
      serviceWorkers: 'block',
    });
    const externalNetworkAttempts = [];
    await context.route('**/*', async route => {
      const requestUrl = route.request().url();
      let requestOrigin = null;
      try {
        requestOrigin = new URL(requestUrl).origin;
      } catch {
        // A non-URL browser request is never part of this local-only capture.
      }
      if (requestOrigin !== server.origin) {
        externalNetworkAttempts.push(requestUrl);
        await route.abort('blockedbyclient');
        return;
      }
      await route.continue();
    });
    await context.routeWebSocket('**/*', webSocket => {
      externalNetworkAttempts.push(webSocket.url());
      webSocket.close();
    });
    await context.addInitScript(() => {
      sessionStorage.setItem('sa.opening.v1', '1');
      globalThis.Capacitor = {
        isNativePlatform: () => true,
        getPlatform: () => 'ios',
      };
      globalThis.CapacitorCustomPlatform = { name: 'ios' };
    });
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`));
    page.on('console', message => {
      if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`);
    });
    page.on('response', response => {
      if (response.url().startsWith(server.origin) && !response.ok()) {
        runtimeErrors.push(`response: ${response.status()} ${response.url()}`);
      }
    });
    await page.goto(`${server.origin}/impact.html?sa_debug=paywall&source=instrument-shot`, {
      waitUntil: 'networkidle',
    });
    await page.locator('.sa-pw-scrim[open]').waitFor();
    await page.waitForFunction(() => {
      const prices = [...document.querySelectorAll('.sa-pw-price__amount')];
      const inputs = [...document.querySelectorAll('input[name="sa-pw-plan"]')];
      return prices.length === 2
        && prices.every(price => price.dataset.priceSource === 'store')
        && inputs.length === 2
        && inputs.every(input => !input.disabled);
    });
    await stabilizeObscuredRangeGlass(page);
    await addSyntheticEvidenceWatermark(page);
    await settlePage(page);
    const runtime = await page.evaluate(() => ({
      width: innerWidth,
      height: innerHeight,
      deviceScaleFactor: devicePixelRatio,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      dark: matchMedia('(prefers-color-scheme: dark)').matches,
      locale: navigator.language,
      timezoneId: Intl.DateTimeFormat().resolvedOptions().timeZone,
      native: globalThis.Capacitor?.isNativePlatform?.(),
      platform: globalThis.Capacitor?.getPlatform?.(),
    }));
    assertRuntimeEnvironment(runtime);

    const artifacts = [];
    let framingAssertions = null;
    for (const plan of PLANS) {
      await page.locator(`input[name="sa-pw-plan"][value="${plan.id}"]`).check();
      await page.waitForFunction(({ id, cta }) => (
        globalThis.__sa?.paywall?.state?.().selectedPlan === id
        && document.querySelector('.sa-pw-cta')?.textContent?.trim() === cta
      ), { id: plan.id, cta: plan.cta });
      await settlePage(page);
      const state = await readPaywallState(page);
      assertPaywallState(state, plan);
      const currentFramingAssertions = {
        paywallFullyInsideViewport: state.paywallFullyInsideViewport,
        ctaFullyInsideViewport: state.ctaFullyInsideViewport,
        syntheticWatermarkVisible: state.syntheticWatermarkVisible,
      };
      if (framingAssertions && JSON.stringify(framingAssertions) !== JSON.stringify(currentFramingAssertions)) {
        throw new PreflightError(`Capture framing changed between plan states: ${JSON.stringify(currentFramingAssertions)}.`);
      }
      framingAssertions = currentFramingAssertions;
      if (externalNetworkAttempts.length > 0) {
        throw new PreflightError(
          `External network requests are forbidden during capture: ${externalNetworkAttempts.join(' | ')}`,
        );
      }
      if (runtimeErrors.length > 0) {
        throw new PreflightError(`Runtime errors prevent screenshot capture: ${runtimeErrors.join(' | ')}`);
      }

      const rawPath = join(stageDirectory, `.raw-${plan.id}.png`);
      const outputPath = join(stageDirectory, plan.file);
      try {
        await page.screenshot({
          path: rawPath,
          fullPage: false,
          animations: 'disabled',
          caret: 'hide',
          scale: 'device',
          type: 'png',
        });
        await normalizeScreenshot(rawPath, outputPath);
      } finally {
        await rm(rawPath, { force: true });
      }
      const bytes = await readFile(outputPath);
      const artifactHash = sha256(bytes);
      if (!SHA256_PATTERN.test(artifactHash)) throw new PreflightError(`Invalid SHA-256 for ${plan.file}.`);
      artifacts.push({
        plan: plan.id,
        selected: true,
        file: plan.file,
        cta: plan.cta,
        sha256: artifactHash,
        bytes: bytes.byteLength,
        format: 'png',
        width: CAPTURE_CONTRACT.outputPixels.width,
        height: CAPTURE_CONTRACT.outputPixels.height,
        colourSpace: 'srgb',
        opaque: true,
      });
    }

    const manifest = buildManifest({
      candidate,
      candidateSnapshotSha256,
      chromiumVersion,
      chromiumDistribution: launched.distribution,
      artifacts,
      captureAssertions: {
        ...framingAssertions,
        externalNetworkAttempts: externalNetworkAttempts.length,
      },
    });
    await writeFile(join(stageDirectory, MANIFEST_FILE), `${JSON.stringify(manifest, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
      mode: 0o444,
    });
    return { chromiumVersion, manifest, stageDirectory };
  } finally {
    await context?.close().catch(() => {});
    await browser?.close().catch(() => {});
    await server.close().catch(() => {});
  }
}

async function listDirectoryFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, 'en'))) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new PreflightError(`Evidence directories may not contain symlinks: ${relativePath}`);
    if (entry.isDirectory()) files.push(...await listDirectoryFiles(join(directory, entry.name), relativePath));
    else if (entry.isFile()) files.push(relativePath);
    else throw new PreflightError(`Unsupported evidence entry: ${relativePath}`);
  }
  return files;
}

async function directoriesAreByteIdentical(left, right) {
  const [leftFiles, rightFiles] = await Promise.all([
    listDirectoryFiles(left),
    listDirectoryFiles(right),
  ]);
  if (JSON.stringify(leftFiles) !== JSON.stringify(rightFiles)) return false;
  for (const file of leftFiles) {
    const [leftBytes, rightBytes] = await Promise.all([
      readFile(join(left, ...file.split('/'))),
      readFile(join(right, ...file.split('/'))),
    ]);
    if (!leftBytes.equals(rightBytes)) return false;
  }
  return true;
}

async function directoryExists(directory) {
  try {
    return (await lstat(directory)).isDirectory();
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function verifyStagedEvidence({ stageDirectory, candidate }) {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(join(stageDirectory, MANIFEST_FILE), 'utf8'));
  } catch (error) {
    throw new PreflightError(`Staged evidence has no valid ${MANIFEST_FILE}.`, { cause: error });
  }
  if (
    manifest.candidate !== candidate
    || manifest.immutable !== true
    || manifest.label !== EVIDENCE_LABEL
    || manifest.finalTestFlightOrStoreKitEvidence !== false
  ) {
    throw new PreflightError('Staged synthetic-native manifest identity does not match the exact candidate.');
  }

  const expectedArtifactFiles = PLANS.map(plan => plan.file);
  const actualArtifactFiles = manifest.artifacts?.map(artifact => artifact.file);
  if (JSON.stringify(actualArtifactFiles) !== JSON.stringify(expectedArtifactFiles)) {
    throw new PreflightError(`Staged artifact inventory is not exact: ${JSON.stringify(actualArtifactFiles)}.`);
  }
  const stagedFiles = await listDirectoryFiles(stageDirectory);
  const expectedFiles = [...expectedArtifactFiles, MANIFEST_FILE].sort((left, right) => left.localeCompare(right, 'en'));
  if (JSON.stringify(stagedFiles) !== JSON.stringify(expectedFiles)) {
    throw new PreflightError(`Staged evidence contains unexpected files: ${JSON.stringify(stagedFiles)}.`);
  }
  for (const artifact of manifest.artifacts) {
    const bytes = await readFile(join(stageDirectory, artifact.file));
    if (artifact.sha256 !== sha256(bytes) || artifact.bytes !== bytes.byteLength) {
      throw new PreflightError(`Staged artifact hash or byte count changed: ${artifact.file}.`);
    }
  }
}

export async function publishStagedEvidence({ stageDirectory, targetDirectory }) {
  try {
    await rename(stageDirectory, targetDirectory);
    return { status: 'created', directory: targetDirectory };
  } catch (error) {
    if (!await directoryExists(targetDirectory)) throw error;
    if (await directoriesAreByteIdentical(stageDirectory, targetDirectory)) {
      await rm(stageDirectory, { recursive: true, force: true });
      return { status: 'byte-identical', directory: targetDirectory };
    }
    throw new PreflightError(
      `Refusing to overwrite immutable IAP preflight evidence with different bytes: ${targetDirectory}`,
      { cause: error },
    );
  }
}

export async function runCli({
  argv = process.argv.slice(2),
  root = ROOT,
  stdout = message => console.log(message),
  capture = captureSyntheticNativePreflight,
} = {}) {
  const { candidate } = parseCliArguments(argv);
  await validateCandidate({ candidate, root });
  const outputRoot = join(
    root,
    'outputs',
    'release-evidence',
    'iap-review',
    SYNTHETIC_OUTPUT_DIRECTORY,
  );
  const targetDirectory = join(outputRoot, candidate);
  await mkdir(outputRoot, { recursive: true });
  const workspaceDirectory = await mkdtemp(join(outputRoot, `.work-${candidate}-`));
  const stageDirectory = join(workspaceDirectory, 'stage');
  try {
    const webRoot = await createCandidateWebSnapshot({ candidate, root, workspaceDirectory });
    await validateCandidate({ candidate, root });
    await capture({ candidate, webRoot, stageDirectory });
    await validateCandidate({ candidate, root });
    await verifyStagedEvidence({ stageDirectory, candidate });
    await validateCandidate({ candidate, root });
    const publication = await publishStagedEvidence({ stageDirectory, targetDirectory });
    stdout(`${EVIDENCE_LABEL}\n${publication.status}: ${publication.directory}`);
    return publication;
  } finally {
    await rm(workspaceDirectory, { recursive: true, force: true });
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  runCli().catch(error => {
    console.error(`IAP review screenshot preflight failed: ${error.message}`);
    process.exitCode = 1;
  });
}
