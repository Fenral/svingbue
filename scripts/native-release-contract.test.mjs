import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PLACEHOLDER_KEYS,
  configureNativeIap,
  configuredForPlatform,
  renderConfig,
  validPublicSdkKey,
} from './configure-native-iap.mjs';
import { GENERATED_IOS_ASSETS, generateIosAssets } from './generate-ios-assets.mjs';
import { verifyGeneratedIosAssets } from './verify-generated-ios-assets.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => readFileSync(join(ROOT, relativePath), 'utf8');

function scriptStepOffset(yaml, name) {
  const offset = yaml.indexOf(`- name: ${name}`);
  assert.notEqual(offset, -1, `Codemagic is missing the ${name} step`);
  return offset;
}

function assertStepOrder(yaml, names) {
  const offsets = names.map(name => scriptStepOffset(yaml, name));
  for (let index = 1; index < offsets.length; index += 1) {
    assert.ok(
      offsets[index - 1] < offsets[index],
      `Codemagic must run ${names[index - 1]} before ${names[index]}`,
    );
  }
}

test('RevenueCat public-key injection validates platform prefixes and placeholders', () => {
  assert.equal(validPublicSdkKey('ios', 'appl_release_public_12345'), true);
  assert.equal(validPublicSdkKey('android', 'goog_release_public_12345'), true);
  assert.equal(validPublicSdkKey('ios', PLACEHOLDER_KEYS.ios), false);
  assert.equal(validPublicSdkKey('ios', 'goog_wrong_platform_12345'), false);
  assert.equal(configuredForPlatform(renderConfig({
    ios: 'appl_release_public_12345',
    android: PLACEHOLDER_KEYS.android,
  }), 'ios'), true);
});

test('native package configuration fails closed, then injects only the requested platform', () => {
  const root = mkdtempSync(join(tmpdir(), 'flightglass-native-iap-'));
  const www = join(root, 'www');
  mkdirSync(www);
  const target = join(www, 'sa-iap-config.js');
  writeFileSync(target, renderConfig(PLACEHOLDER_KEYS), 'utf8');

  try {
    assert.throws(
      () => configureNativeIap({ platform: 'ios', key: '', root }),
      /refusing to create a purchase-disabled release build/,
    );
    configureNativeIap({
      platform: 'ios',
      key: 'appl_release_public_12345',
      root,
    });
    const configured = readFileSync(target, 'utf8');
    assert.equal(configuredForPlatform(configured, 'ios'), true);
    assert.equal(configuredForPlatform(configured, 'android'), false);
    assert.doesNotThrow(() => configureNativeIap({ platform: 'ios', root, checkOnly: true }));
    assert.throws(
      () => configureNativeIap({ platform: 'android', root, checkOnly: true }),
      /android RevenueCat public SDK key is missing/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('shipping IAP module reads generated configuration instead of embedding release keys', () => {
  const sourceConfig = read('sa-iap-config.js');
  const iap = read('sa-iap.js');
  assert.match(sourceConfig, /appl_REPLACE_ME/);
  assert.match(sourceConfig, /goog_REPLACE_ME/);
  assert.match(iap, /from '\.\/sa-iap-config\.js'/);
  assert.doesNotMatch(iap, /const PUBLIC_KEYS/);
});

test('Codemagic is manual-only and refuses ambiguous billing or build-number state', () => {
  const yaml = read('codemagic.yaml');
  const pkg = JSON.parse(read('package.json'));
  assert.doesNotMatch(yaml, /^\s+triggering:/m, 'TestFlight must be started manually');
  assert.match(yaml, /- revenuecat-flightglass/);
  assert.match(yaml, /npm run verify:v1:source/);
  assert.match(yaml, /npm run configure:iap:ios/);
  assert.match(yaml, /npm run verify:iap:ios/);
  assert.match(yaml, /node scripts\/generate-ios-assets\.mjs/);
  assert.doesNotMatch(yaml, /capacitor-assets/);
  assert.match(yaml, /node scripts\/verify-generated-ios-assets\.mjs/);
  assert.match(yaml, /ios_signing:[\s\S]*distribution_type: app_store[\s\S]*bundle_identifier: \*bundle_id/);
  assert.match(yaml, /^\s+node:\s+24\s*$/m);
  assert.match(yaml, /xcode: 26\.6/);
  assert.doesNotMatch(yaml, /openssl genrsa|fetch-signing-files|certificate-key|--create/);
  assert.doesNotMatch(yaml, /certificates delete|Revoke old Distribution certs/);
  assert.doesNotMatch(yaml, /falling back to 0|LATEST=0/);
  assert.match(yaml, /refusing an ambiguous upload[\s\S]*?exit 1/);
  assert.match(read('.gitignore'), /^ios\/$/m);
  assert.match(pkg.devDependencies.typescript, /^\^5\.9\./,
    'capacitor.config.ts requires TypeScript on a clean native build machine');
});

test('Codemagic preserves configured www through sync, patching, asset verification, and build', () => {
  const yaml = read('codemagic.yaml');
  const steps = [
    'Assemble www/ from web source (denylist mocks/tooling)',
    'Inject and verify the RevenueCat iOS public key',
    'Add the iOS platform',
    'Sync web assets + plugins into the iOS project',
    'Patch iOS orientation, display name, and minimum OS',
    'Inject Info.plist export-compliance answer',
    'Generate app icons/splash from resources/',
    'Verify generated app icons/splash',
    'Build .ipa',
  ];
  assertStepOrder(yaml, steps);

  const configureOffset = scriptStepOffset(yaml, 'Inject and verify the RevenueCat iOS public key');
  const syncOffset = scriptStepOffset(yaml, 'Sync web assets + plugins into the iOS project');
  const configuredWwwInterval = yaml.slice(configureOffset, syncOffset);
  assert.doesNotMatch(
    configuredWwwInterval,
    /npm run copy-web|\bnpx cap copy\b|\brm\s+-rf\s+www\b/i,
    'www must not be regenerated after RevenueCat configuration and before cap sync',
  );
});

test('generated iOS assets are verified against the committed launch sources', async () => {
  const { IOS_ASSETS, meanAbsolutePixelDifference } = await import('./verify-generated-ios-assets.mjs');
  assert.deepEqual(IOS_ASSETS.map(asset => asset.source), [
    'resources/icon.png',
    'resources/splash.png',
    'resources/splash.png',
    'resources/splash.png',
  ]);
  assert.equal(meanAbsolutePixelDifference(Buffer.from([0, 20]), Buffer.from([2, 18])), 2);
  assert.equal(
    meanAbsolutePixelDifference(Buffer.from([0]), Buffer.from([0, 1])),
    Number.POSITIVE_INFINITY,
  );
  assert.deepEqual(GENERATED_IOS_ASSETS.splash, [
    'ios/App/App/Assets.xcassets/Splash.imageset/Default@1x~universal~anyany.png',
    'ios/App/App/Assets.xcassets/Splash.imageset/Default@2x~universal~anyany.png',
    'ios/App/App/Assets.xcassets/Splash.imageset/Default@3x~universal~anyany.png',
  ]);

  const root = mkdtempSync(join(tmpdir(), 'flightglass-ios-assets-'));
  try {
    mkdirSync(join(root, 'resources'));
    cpSync(join(ROOT, 'resources', 'icon.png'), join(root, 'resources', 'icon.png'));
    cpSync(join(ROOT, 'resources', 'splash.png'), join(root, 'resources', 'splash.png'));
    const generated = await generateIosAssets(root);
    const iconDirectory = join(root, 'ios/App/App/Assets.xcassets/AppIcon.appiconset');
    const splashDirectory = join(root, 'ios/App/App/Assets.xcassets/Splash.imageset');

    assert.deepEqual(generated.icon, join(root, GENERATED_IOS_ASSETS.icon));
    assert.deepEqual(
      generated.splash,
      GENERATED_IOS_ASSETS.splash.map(path => join(root, path)),
    );
    for (const path of [generated.icon, ...generated.splash]) {
      assert.ok(existsSync(path), `asset generator did not write ${path}`);
    }

    assert.deepEqual(JSON.parse(readFileSync(join(iconDirectory, 'Contents.json'), 'utf8')), {
      images: [{
        filename: 'AppIcon-512@2x.png',
        idiom: 'universal',
        platform: 'ios',
        size: '1024x1024',
      }],
      info: { author: 'xcode', version: 1 },
    });
    assert.deepEqual(JSON.parse(readFileSync(join(splashDirectory, 'Contents.json'), 'utf8')), {
      images: GENERATED_IOS_ASSETS.splash.map((path, index) => ({
        filename: path.split('/').at(-1),
        idiom: 'universal',
        scale: `${index + 1}x`,
      })),
      info: { author: 'xcode', version: 1 },
    });

    const results = await verifyGeneratedIosAssets(root);
    assert.equal(results.length, 4);
    assert.ok(results.every(result => result.difference <= 3));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('GitHub runs the exact candidate through the full risk gate without fabricating human evidence', () => {
  const workflow = read('.github/workflows/v1-release-gate.yml');
  const pkg = JSON.parse(read('package.json'));
  assert.match(
    workflow,
    /uses: actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7\.0\.1/,
  );
  assert.match(
    workflow,
    /uses: actions\/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7\.0\.0/,
  );
  assert.match(
    workflow,
    /uses: actions\/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7\.0\.1/,
  );
  assert.doesNotMatch(workflow, /uses: actions\/(?:checkout|setup-node|upload-artifact)@v4/);
  assert.match(workflow, /pull_request:[\s\S]*branches: \[main\]/);
  assert.match(workflow, /pull_request\.head\.sha \|\| github\.sha/);
  assert.match(workflow, /workflow_dispatch:[\s\S]*base_sha:[\s\S]*required: true[\s\S]*type: string/);
  assert.match(workflow, /pull_request\.base\.sha \|\| github\.event_name == 'push' && github\.event\.before \|\| inputs\.base_sha/);
  assert.match(workflow, /ref: \$\{\{ github\.event_name == 'pull_request' && github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/);
  assert.match(workflow, /fetch-depth: 0/);
  assert.match(workflow, /actual_candidate="\$\(git rev-parse HEAD\)"/);
  assert.match(workflow, /\[\[ "\$actual_candidate" != "\$expected_candidate" \]\]/);
  assert.match(workflow, /\[\[ ! "\$base_candidate" =~ \^\[0-9a-f\]\{40\}\$ \|\| "\$base_candidate" =~ \^0\+\$ \]\]/);
  assert.doesNotMatch(workflow, /actual_candidate\}\^/);
  assert.match(workflow, /git fetch --no-tags origin "\$base_candidate"/);
  assert.match(workflow, /FLIGHTGLASS_BASE_SHA=\$resolved_base/);
  assert.match(workflow, /npm run verify:change -- --base "\$FLIGHTGLASS_BASE_SHA" --level C(?:\s|$)/);
  assert.doesNotMatch(workflow, /verify:change[^\n]*--no-report/);
  assert.match(workflow, /npm audit --audit-level=high/);
  assert.match(workflow, /npm audit --omit=dev --audit-level=high/);
  assert.match(workflow, /npm audit --prefix tools --audit-level=high/);
  assert.match(workflow, /name: Write immutable release evidence manifest[\s\S]*if: always\(\)[\s\S]*release-evidence-manifest\.json/);
  assert.match(workflow, /npm-audit-all\.json/);
  assert.match(workflow, /npm-audit-production\.json/);
  assert.match(workflow, /npm-audit-tools\.json/);
  assert.match(workflow, /path: \$\{\{ runner\.temp \}\}\/flightglass-v1-evidence\//);
  assert.match(workflow, /if-no-files-found: error/);
  assert.match(workflow, /name: Upload immutable release evidence[\s\S]*if: always\(\)/);
  assert.match(workflow, /retention-days: 30/);
  assert.equal([...workflow.matchAll(/npm run verify:change/g)].length, 1);
  assert.doesNotMatch(workflow, /npm run test:gate/);
  assert.doesNotMatch(workflow, /npm run verify:v1:release/);
  assert.match(workflow, /playwright-core install --with-deps chromium webkit/);

  const release = pkg.scripts['verify:v1:release'];
  for (const required of [
    'verify:v1:source',
    'test:phase2:chromium',
    'test:phase2:webkit',
    'test:phase2:phone',
    'test:guide:chromium',
    'test:guide:webkit',
    'test:studio',
    'test:phase4:chromium',
    'test:phase4:webkit',
  ]) assert.match(release, new RegExp(required.replaceAll(':', '\\:')));

  const source = pkg.scripts['verify:v1:source'];
  for (const required of [
    'test:gate',
    'test:native-release',
    'test:store-release',
    'test:release-evidence',
  ]) assert.match(source, new RegExp(required.replaceAll(':', '\\:')));
  assert.equal(
    pkg.scripts['verify:v1:onboarding-evidence'],
    'node scripts/release-evidence-onboarding.mjs',
  );
  assert.doesNotMatch(
    release,
    /verify:v1:onboarding-evidence/,
    'automated CI must not imply that pending human observations passed',
  );

  const nativeGuide = read('NATIVE.md');
  assert.match(nativeGuide, /Geometry\/`geo3d`[\s\S]*denied/);
  assert.doesNotMatch(nativeGuide, /`vendor\/`, `assets\/`, `geo3d\/`/);
});
