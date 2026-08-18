import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  access,
  appendFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

import {
  CAPTURE_SOURCE_PATHS,
  CAPTURE_CONTRACT,
  EVIDENCE_LABEL,
  MANIFEST_FILE,
  PINNED_BROWSER,
  SYNTHETIC_OUTPUT_DIRECTORY,
  WATERMARK_TEXT,
  captureSyntheticNativePreflight,
  createCandidateWebSnapshot,
  parseCliArguments,
  publishStagedEvidence,
  runCli,
  startLocalServer,
  validateCandidate,
} from './capture-iap-review-screenshots.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CANDIDATE = 'a'.repeat(40);

async function withTempDirectory(run) {
  const directory = await mkdtemp(join(tmpdir(), 'flightglass-iap-preflight-'));
  try {
    return await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true }).trim();
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function createCandidateRepository(directory) {
  git(directory, ['init', '--quiet']);
  git(directory, ['config', 'core.autocrlf', 'false']);
  await writeFile(join(directory, '.gitignore'), 'outputs/\n', 'utf8');
  for (const relativePath of CAPTURE_SOURCE_PATHS) {
    const file = join(directory, ...relativePath.split('/'));
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, `candidate:${relativePath}\n`, 'utf8');
  }
  git(directory, ['add', '.gitignore', ...CAPTURE_SOURCE_PATHS]);
  git(directory, [
    '-c', 'user.name=Flightglass Test',
    '-c', 'user.email=flightglass@example.invalid',
    '-c', 'commit.gpgSign=false',
    'commit', '--quiet', '--no-gpg-sign', '-m', 'candidate',
  ]);
  return git(directory, ['rev-parse', 'HEAD']);
}

test('CLI accepts exactly one lowercase 40-character --candidate', () => {
  assert.deepEqual(parseCliArguments(['--candidate', CANDIDATE]), { candidate: CANDIDATE });
  assert.throws(() => parseCliArguments([]), /Missing required --candidate/);
  assert.throws(() => parseCliArguments(['--candidate', 'abc']), /40-character lowercase hexadecimal/);
  assert.throws(() => parseCliArguments(['--candidate', CANDIDATE.toUpperCase()]), /lowercase hexadecimal/);
  assert.throws(
    () => parseCliArguments(['--candidate', CANDIDATE, '--candidate', CANDIDATE]),
    /may only be provided once/,
  );
  assert.throws(() => parseCliArguments(['--candidate', CANDIDATE, '--output', 'elsewhere']), /Unknown argument/);
});

test('candidate validation requires the exact clean SHA-1 HEAD', async () => {
  await withTempDirectory(async directory => {
    git(directory, ['init', '--quiet']);
    git(directory, ['config', 'core.autocrlf', 'false']);
    await writeFile(join(directory, 'tracked.txt'), 'candidate\n', 'utf8');
    git(directory, ['add', 'tracked.txt']);
    git(directory, [
      '-c', 'user.name=Flightglass Test',
      '-c', 'user.email=flightglass@example.invalid',
      '-c', 'commit.gpgSign=false',
      'commit', '--quiet', '--no-gpg-sign', '-m', 'candidate',
    ]);
    const head = git(directory, ['rev-parse', 'HEAD']);

    assert.equal(await validateCandidate({ candidate: head, root: directory }), head);
    await assert.rejects(
      validateCandidate({ candidate: '0'.repeat(40), root: directory }),
      /does not exactly equal checked-out HEAD/,
    );

    await appendFile(join(directory, 'tracked.txt'), 'dirty\n', 'utf8');
    await assert.rejects(
      validateCandidate({ candidate: head, root: directory }),
      /working tree must be clean/,
    );
  });
});

test('candidate web snapshot serves committed allowlisted bytes instead of the live worktree', async () => {
  await withTempDirectory(async directory => {
    const candidate = await createCandidateRepository(directory);
    await writeFile(join(directory, 'impact.html'), 'uncommitted drift\n', 'utf8');
    const workspaceDirectory = join(directory, 'snapshot-workspace');
    await mkdir(workspaceDirectory);

    const webRoot = await createCandidateWebSnapshot({ candidate, root: directory, workspaceDirectory });

    const committedImpact = execFileSync('git', ['show', `${candidate}:impact.html`], {
      cwd: directory,
      windowsHide: true,
    });
    assert.equal((await readFile(join(webRoot, 'impact.html'))).equals(committedImpact), true);
    assert.equal(await pathExists(join(webRoot, '.git')), false);
    assert.deepEqual(
      (await readdir(webRoot, { recursive: true })).some(path => String(path).startsWith('.')),
      false,
    );
  });
});

test('CLI deletes staging and refuses publication when the candidate drifts during capture', async () => {
  await withTempDirectory(async directory => {
    const candidate = await createCandidateRepository(directory);
    const targetDirectory = join(
      directory,
      'outputs',
      'release-evidence',
      'iap-review',
      SYNTHETIC_OUTPUT_DIRECTORY,
      candidate,
    );

    await assert.rejects(
      runCli({
        argv: ['--candidate', candidate],
        root: directory,
        capture: async ({ stageDirectory }) => {
          await mkdir(stageDirectory);
          await writeFile(join(stageDirectory, MANIFEST_FILE), '{}\n', 'utf8');
          await appendFile(join(directory, 'impact.html'), 'drift during capture\n', 'utf8');
        },
      }),
      /working tree must be clean/,
    );

    assert.equal(await pathExists(targetDirectory), false);
    const workspaceRoot = dirname(targetDirectory);
    assert.deepEqual(await readdir(workspaceRoot), []);
  });
});

test('local server exposes only the paywall allowlist and intercepts only exact /sa-iap.js', async () => {
  await withTempDirectory(async directory => {
    await mkdir(join(directory, 'nested'));
    await writeFile(join(directory, 'sa-iap.js'), 'disk iap module', 'utf8');
    await writeFile(join(directory, 'sa-paywall.js'), 'allowlisted disk module', 'utf8');
    await writeFile(join(directory, 'other.js'), 'disk other module', 'utf8');
    await writeFile(join(directory, 'nested', 'sa-iap.js'), 'nested disk module', 'utf8');
    await writeFile(join(directory, '.env'), 'secret', 'utf8');
    const server = await startLocalServer({ root: directory });
    try {
      const fixtureResponse = await fetch(`${server.origin}/sa-iap.js`);
      assert.match(fixtureResponse.headers.get('content-security-policy'), /connect-src 'none'/);
      assert.match(fixtureResponse.headers.get('content-security-policy'), /default-src 'self' data:/);
      const fixtureSource = await fixtureResponse.text();
      assert.doesNotMatch(fixtureSource, /disk iap module/);
      const fixture = await import(`data:text/javascript;base64,${Buffer.from(fixtureSource).toString('base64')}`);
      const offering = await fixture.getOfferings();
      assert.equal(fixture.isNative(), true);
      assert.deepEqual(Object.keys(offering), ['monthly', 'annual']);
      assert.deepEqual(offering.monthly.product, {
        identifier: 'strikearc_pro_monthly',
        priceString: 'kr 99',
      });
      assert.deepEqual(offering.annual.product, {
        identifier: 'strikearc_pro_annual',
        priceString: 'kr 499',
        pricePerMonthString: 'kr 42',
      });
      assert.equal(Object.hasOwn(offering, 'lifetime'), false);

      assert.equal(await fetch(`${server.origin}/sa-paywall.js`).then(response => response.text()), 'allowlisted disk module');
      assert.equal((await fetch(`${server.origin}/other.js`)).status, 404);
      assert.equal((await fetch(`${server.origin}/nested/sa-iap.js`)).status, 404);
      assert.equal((await fetch(`${server.origin}/.env`)).status, 404);
    } finally {
      await server.close();
    }
  });
});

test('capture emits two exact opaque sRGB review-size states and an explicit synthetic manifest', {
  timeout: 60_000,
}, async () => {
  await withTempDirectory(async directory => {
    const candidate = git(ROOT, ['rev-parse', 'HEAD']);
    const snapshotWorkspace = join(directory, 'candidate-snapshot');
    await mkdir(snapshotWorkspace);
    const webRoot = await createCandidateWebSnapshot({
      candidate,
      root: ROOT,
      workspaceDirectory: snapshotWorkspace,
    });
    const stageDirectory = join(directory, 'stage');
    const result = await captureSyntheticNativePreflight({
      candidate,
      webRoot,
      stageDirectory,
    });
    const manifest = JSON.parse(await readFile(join(stageDirectory, MANIFEST_FILE), 'utf8'));

    assert.equal(manifest.label, EVIDENCE_LABEL);
    assert.equal(manifest.candidate, candidate);
    assert.equal(manifest.finalTestFlightOrStoreKitEvidence, false);
    assert.equal(manifest.watermark, WATERMARK_TEXT);
    assert.equal(manifest.environment.chromiumDistribution, 'Playwright-managed Chromium');
    assert.equal(manifest.environment.playwrightCoreVersion, PINNED_BROWSER.playwrightCoreVersion);
    assert.equal(manifest.environment.chromiumRevision, PINNED_BROWSER.revision);
    assert.equal(manifest.environment.chromiumVersion, PINNED_BROWSER.browserVersion);
    assert.match(manifest.environment.chromiumVersion, /^\d+\.\d+/);
    assert.equal(manifest.environment.chromiumVersion, result.chromiumVersion);
    assert.deepEqual(manifest.environment.viewportCss, { width: 430, height: 932 });
    assert.equal(manifest.environment.deviceScaleFactor, 3);
    assert.deepEqual(manifest.environment.outputPixels, { width: 1290, height: 2796 });
    assert.equal(manifest.environment.reducedMotion, 'reduce');
    assert.equal(manifest.environment.colorScheme, 'dark');
    assert.equal(manifest.environment.locale, 'nb-NO');
    assert.equal(manifest.environment.timezoneId, 'Europe/Oslo');
    assert.equal(manifest.environment.nativePlatformFixture, 'ios');
    assert.equal(manifest.environment.iapModuleIntercept, '/sa-iap.js');
    assert.deepEqual(manifest.captureAssertions, {
      paywallFullyInsideViewport: true,
      ctaFullyInsideViewport: true,
      syntheticWatermarkVisible: true,
      externalNetworkAttempts: 0,
    });
    assert.deepEqual(manifest.offering, {
      monthly: { productId: 'strikearc_pro_monthly', price: 'kr 99' },
      annual: { productId: 'strikearc_pro_annual', price: 'kr 499' },
      lifetimeVisible: false,
    });
    assert.deepEqual(
      manifest.artifacts.map(({ plan, file, cta }) => ({ plan, file, cta })),
      [
        {
          plan: 'monthly',
          file: 'synthetic-native-do-not-submit-monthly.png',
          cta: 'Continue — kr 99 per month',
        },
        {
          plan: 'annual',
          file: 'synthetic-native-do-not-submit-annual.png',
          cta: 'Continue — kr 499 per year',
        },
      ],
    );

    for (const artifact of manifest.artifacts) {
      const bytes = await readFile(join(stageDirectory, artifact.file));
      const metadata = await sharp(bytes).metadata();
      assert.equal(artifact.sha256, createHash('sha256').update(bytes).digest('hex'));
      assert.match(artifact.sha256, /^[0-9a-f]{64}$/);
      assert.equal(artifact.bytes, bytes.byteLength);
      assert.equal(metadata.format, 'png');
      assert.equal(metadata.width, CAPTURE_CONTRACT.outputPixels.width);
      assert.equal(metadata.height, CAPTURE_CONTRACT.outputPixels.height);
      assert.equal(metadata.space, 'srgb');
      assert.equal(metadata.hasAlpha, false);
      assert.ok(metadata.icc?.byteLength > 0, `${artifact.file} must embed an sRGB ICC profile`);
      const watermarkPixel = await sharp(bytes)
        .extract({ left: 6, top: 6, width: 1, height: 1 })
        .removeAlpha()
        .raw()
        .toBuffer();
      assert.deepEqual([...watermarkPixel], [255, 196, 0], `${artifact.file} must visibly carry the warning banner`);
    }

    const repeatDirectory = join(directory, 'repeat-stage');
    await captureSyntheticNativePreflight({
      candidate,
      webRoot,
      stageDirectory: repeatDirectory,
    });
    for (const artifact of manifest.artifacts) {
      assert.equal(
        (await readFile(join(stageDirectory, artifact.file))).equals(
          await readFile(join(repeatDirectory, artifact.file)),
        ),
        true,
        `${artifact.file} must be byte-identical across fresh captures`,
      );
    }
    assert.equal(
      (await readFile(join(stageDirectory, MANIFEST_FILE))).equals(
        await readFile(join(repeatDirectory, MANIFEST_FILE)),
      ),
      true,
      `${MANIFEST_FILE} must be byte-identical across fresh captures`,
    );
  });
});

test('browser preflight runs only in GitHub after pinned Playwright Chromium installation', async () => {
  const packageManifest = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'));
  const toolsLock = JSON.parse(await readFile(join(ROOT, 'tools', 'package-lock.json'), 'utf8'));
  const workflow = await readFile(join(ROOT, '.github', 'workflows', 'v1-release-gate.yml'), 'utf8');
  const codemagic = await readFile(join(ROOT, 'codemagic.yaml'), 'utf8');
  const ignore = await readFile(join(ROOT, '.gitignore'), 'utf8');
  const command = 'npm run test:iap-review-preflight';

  assert.equal(
    packageManifest.scripts['test:iap-review-preflight'],
    'node --test scripts/capture-iap-review-screenshots.test.mjs',
  );
  assert.doesNotMatch(packageManifest.scripts['test:release-evidence'], /capture-iap-review-screenshots/);
  assert.doesNotMatch(packageManifest.scripts['verify:v1:source'], /test:iap-review-preflight/);
  assert.equal(packageManifest.scripts['capture:iap-review-screenshots'], undefined);
  assert.equal(
    packageManifest.scripts['capture:iap-review-synthetic-native-do-not-submit'],
    'node scripts/capture-iap-review-screenshots.mjs',
  );
  assert.match(ignore, /^outputs\/release-evidence\/iap-review\/synthetic-native-do-not-submit\/$/m);
  assert.equal(toolsLock.packages['node_modules/playwright-core'].version, PINNED_BROWSER.playwrightCoreVersion);
  assert.ok(workflow.indexOf('npm ci --prefix tools') < workflow.indexOf('playwright-core install --with-deps chromium'));
  assert.ok(workflow.indexOf('playwright-core install --with-deps chromium') < workflow.indexOf(command));
  assert.equal(workflow.split(command).length - 1, 1);
  assert.doesNotMatch(codemagic, /test:iap-review-preflight/);
});

test('publication creates once, reuses byte-identical evidence, and refuses changed bytes', async () => {
  await withTempDirectory(async directory => {
    const target = join(directory, CANDIDATE);
    const makeStage = async (name, annualBytes = 'annual') => {
      const stage = join(directory, name);
      await mkdir(stage);
      await writeFile(join(stage, 'synthetic-native-do-not-submit-monthly.png'), 'monthly', 'utf8');
      await writeFile(join(stage, 'synthetic-native-do-not-submit-annual.png'), annualBytes, 'utf8');
      await writeFile(join(stage, MANIFEST_FILE), '{"immutable":true}\n', 'utf8');
      return stage;
    };

    const first = await makeStage('stage-first');
    assert.deepEqual(await publishStagedEvidence({ stageDirectory: first, targetDirectory: target }), {
      status: 'created',
      directory: target,
    });

    const identical = await makeStage('stage-identical');
    assert.deepEqual(await publishStagedEvidence({ stageDirectory: identical, targetDirectory: target }), {
      status: 'byte-identical',
      directory: target,
    });
    assert.equal(await pathExists(identical), false);

    const changed = await makeStage('stage-changed', 'changed annual');
    await assert.rejects(
      publishStagedEvidence({ stageDirectory: changed, targetDirectory: target }),
      /Refusing to overwrite immutable IAP preflight evidence/,
    );
    assert.equal(await readFile(join(target, 'synthetic-native-do-not-submit-annual.png'), 'utf8'), 'annual');
  });
});
