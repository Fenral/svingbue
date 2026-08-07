import { accessSync, constants } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import sharp from 'sharp';

const SPLASH_TARGETS = Object.freeze([
  'ios/App/App/Assets.xcassets/Splash.imageset/Default@1x~universal~anyany.png',
  'ios/App/App/Assets.xcassets/Splash.imageset/Default@2x~universal~anyany.png',
  'ios/App/App/Assets.xcassets/Splash.imageset/Default@3x~universal~anyany.png',
]);

export const IOS_ASSETS = Object.freeze([
  Object.freeze({
    label: 'App icon',
    source: 'resources/icon.png',
    generated: 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png',
    width: 1024,
    height: 1024,
  }),
  ...SPLASH_TARGETS.map((generated, index) => Object.freeze({
    label: `Launch image ${index + 1}x`,
    source: 'resources/splash.png',
    generated,
    width: 2732,
    height: 2732,
  })),
]);

export function meanAbsolutePixelDifference(left, right) {
  if (left.length !== right.length) return Number.POSITIVE_INFINITY;
  let total = 0;
  for (let index = 0; index < left.length; index += 1) {
    total += Math.abs(left[index] - right[index]);
  }
  return total / left.length;
}

async function rawRgba(path) {
  return sharp(path).ensureAlpha().raw().toBuffer();
}

export async function verifyGeneratedIosAssets(root = process.cwd()) {
  const results = [];
  for (const asset of IOS_ASSETS) {
    const source = resolve(root, asset.source);
    const generated = resolve(root, asset.generated);
    accessSync(source, constants.R_OK);
    accessSync(generated, constants.R_OK);

    const [sourceMeta, generatedMeta] = await Promise.all([
      sharp(source).metadata(),
      sharp(generated).metadata(),
    ]);
    for (const [name, metadata] of [['source', sourceMeta], ['generated', generatedMeta]]) {
      if (metadata.width !== asset.width || metadata.height !== asset.height) {
        throw new Error(`${asset.label} ${name} must be ${asset.width}x${asset.height}; got ${metadata.width}x${metadata.height}.`);
      }
    }

    const [sourcePixels, generatedPixels] = await Promise.all([
      rawRgba(source),
      rawRgba(generated),
    ]);
    const difference = meanAbsolutePixelDifference(sourcePixels, generatedPixels);
    // Re-encoding can introduce tiny channel differences. A wrong source or a
    // blank launch image is orders of magnitude above this conservative gate.
    if (!Number.isFinite(difference) || difference > 3) {
      throw new Error(`${asset.label} does not match ${asset.source} (mean channel difference ${difference.toFixed(2)}).`);
    }
    results.push({ label: asset.label, difference });
  }
  return results;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    const results = await verifyGeneratedIosAssets();
    for (const result of results) {
      console.log(`Verified ${result.label} (mean channel difference ${result.difference.toFixed(2)}).`);
    }
  } catch (error) {
    console.error(`iOS asset verification failed: ${error.message}`);
    process.exitCode = 1;
  }
}
