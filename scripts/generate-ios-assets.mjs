import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

export const GENERATED_IOS_ASSETS = Object.freeze({
  icon: 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png',
  splash: Object.freeze([
    'ios/App/App/Assets.xcassets/Splash.imageset/Default@1x~universal~anyany.png',
    'ios/App/App/Assets.xcassets/Splash.imageset/Default@2x~universal~anyany.png',
    'ios/App/App/Assets.xcassets/Splash.imageset/Default@3x~universal~anyany.png',
  ]),
});

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function requireDimensions(path, width, height, label) {
  const metadata = await sharp(path).metadata();
  if (metadata.width !== width || metadata.height !== height) {
    throw new Error(`${label} must be ${width}x${height}; got ${metadata.width}x${metadata.height}.`);
  }
}

export async function generateIosAssets(root = process.cwd()) {
  const iconSource = resolve(root, 'resources/icon.png');
  const splashSource = resolve(root, 'resources/splash.png');
  await Promise.all([
    requireDimensions(iconSource, 1024, 1024, 'resources/icon.png'),
    requireDimensions(splashSource, 2732, 2732, 'resources/splash.png'),
  ]);

  const iconTarget = resolve(root, GENERATED_IOS_ASSETS.icon);
  const splashTargets = GENERATED_IOS_ASSETS.splash.map(path => resolve(root, path));
  const iconDirectory = dirname(iconTarget);
  const splashDirectory = dirname(splashTargets[0]);
  mkdirSync(iconDirectory, { recursive: true });
  mkdirSync(splashDirectory, { recursive: true });

  await sharp(iconSource)
    .resize(1024, 1024)
    .flatten({ background: '#07060C' })
    .png()
    .toFile(iconTarget);
  await Promise.all(splashTargets.map(target => (
    sharp(splashSource).resize(2732, 2732).png().toFile(target)
  )));

  writeJson(resolve(iconDirectory, 'Contents.json'), {
    images: [{
      filename: 'AppIcon-512@2x.png',
      idiom: 'universal',
      platform: 'ios',
      size: '1024x1024',
    }],
    info: { author: 'xcode', version: 1 },
  });
  writeJson(resolve(splashDirectory, 'Contents.json'), {
    images: GENERATED_IOS_ASSETS.splash.map((path, index) => ({
      filename: path.split('/').at(-1),
      idiom: 'universal',
      scale: `${index + 1}x`,
    })),
    info: { author: 'xcode', version: 1 },
  });

  return { icon: iconTarget, splash: splashTargets };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    await generateIosAssets();
    console.log('Generated the verified Flightglass iOS icon and launch image set.');
  } catch (error) {
    console.error(`iOS asset generation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
