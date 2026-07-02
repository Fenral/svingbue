#!/usr/bin/env node
// One-off local helper (not part of CI) to rasterize resources/*.svg into
// PNGs using sharp, since sharp installed cleanly on this Windows machine.
// Not referenced by codemagic.yaml or package.json scripts — CI regenerates
// icons itself via `npx @capacitor/assets generate`, which can also consume
// the .svg sources directly. This file exists purely so we could produce
// resources/icon.png and resources/splash.png for local verification.
import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const RES = join(ROOT, 'resources');

async function main() {
  // Render directly at the target pixel size (density derived so the SVG's
  // own viewBox units map 1:1 to output pixels) rather than rendering huge
  // and downscaling — avoids resize-related seam/banding artifacts from
  // sharp's tiled resize path on very large intermediate rasters.
  await sharp(join(RES, 'icon.svg'), { density: 72 })
    .resize(1024, 1024, { fit: 'fill' })
    .png()
    .toFile(join(RES, 'icon.png'));
  console.log('wrote resources/icon.png (1024x1024)');

  await sharp(join(RES, 'splash.svg'), { density: 72 })
    .resize(2732, 2732, { fit: 'fill' })
    .png()
    .toFile(join(RES, 'splash.png'));
  console.log('wrote resources/splash.png (2732x2732)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
