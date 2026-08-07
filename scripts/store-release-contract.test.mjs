import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => readFileSync(join(ROOT, relativePath), 'utf8');

async function assertImage(relativePath, width, height, { opaque = false } = {}) {
  const path = join(ROOT, relativePath);
  assert.equal(existsSync(path), true, `${relativePath} is missing`);
  const metadata = await sharp(path).metadata();
  assert.equal(metadata.width, width, `${relativePath} width`);
  assert.equal(metadata.height, height, `${relativePath} height`);
  if (opaque) {
    assert.equal(metadata.hasAlpha, false, `${relativePath} must not contain alpha`);
    assert.equal(metadata.channels, 3, `${relativePath} must be opaque RGB`);
  }
}

test('the public support surface covers purchase recovery and local-data rights', () => {
  const support = read('support.html');
  assert.match(support, /<title>Support\s*[—-]\s*Flightglass<\/title>/);
  assert.match(support, /Restore purchases/i);
  assert.match(support, /cancel a subscription/i);
  assert.match(support, /Deleting Flightglass does not cancel an active subscription/i);
  assert.match(support, /local preferences stay on the device/i);
  assert.match(support, /href="\.\/terms\.html"/);
  assert.match(support, /href="\.\/privacy\.html"/);
  assert.match(support, /href="mailto:[^"?\s]+@[^"?\s]+(?:\?[^"\s]*)?"/i);
});

test('the store pack describes current v1 without claiming Academy or an Android release', () => {
  const listing = read('docs/store-listing.md');
  assert.match(listing, /Outcome model/i);
  assert.match(listing, /Impact Studio/i);
  assert.match(listing, /Flightglass Guide/i);
  assert.match(listing, /marketing landing page is deferred/i);
  assert.match(listing, /Android remains a separate release track/i);
  assert.match(listing, /https:\/\/svingbue\.vercel\.app\/support\.html/);
  assert.doesNotMatch(listing, /24 lessons|Academy is included|signed Android release/i);
});

test('the committed store gallery contains exactly five current upload candidates', async () => {
  for (let number = 1; number <= 5; number += 1) {
    const name = String(number).padStart(2, '0');
    await assertImage(`appstore/${name}.png`, 1290, 2796, { opaque: true });
    await assertImage(`appstore/play/${name}.png`, 1080, 1920, { opaque: true });
  }
  await assertImage('appstore/feature-graphic.png', 1024, 500, { opaque: true });

  for (let number = 6; number <= 9; number += 1) {
    const name = String(number).padStart(2, '0');
    assert.equal(existsSync(join(ROOT, 'appstore', `${name}.png`)), false,
      `legacy appstore/${name}.png must not remain an upload candidate`);
  }

  const gallery = read('appstore/index.html');
  const generator = read('scripts/store-screenshots.mjs');
  assert.doesNotMatch(gallery, /StrikeArc|Academy|24 lessons/i);
  assert.doesNotMatch(generator, /route:\s*['"](?:academy|geometry)\.html['"]/i);
  for (const route of ['index.html', 'impact.html', 'impact-studio.html', 'jarvis.html']) {
    assert.match(generator, new RegExp(route.replace('.', '\\.')));
  }

  const ids = [...generator.matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual(ids.slice(0, 5), ['outcome', 'studio', 'guide', 'home', 'onboarding']);
});

test('public support and legal pages respect safe areas and retain 44px navigation targets', () => {
  for (const page of ['support.html', 'privacy.html', 'terms.html']) {
    const source = read(page);
    assert.match(source, /viewport-fit=cover/, `${page} opts into safe-area viewport fitting`);
    assert.match(source, /(?:\.top|header\.top)\s*\{[\s\S]*?safe-area-inset-top[\s\S]*?safe-area-inset-right[\s\S]*?safe-area-inset-bottom[\s\S]*?safe-area-inset-left/, `${page} header protects every safe edge`);
    assert.match(source, /main\s*\{[\s\S]*?safe-area-inset-top[\s\S]*?safe-area-inset-right[\s\S]*?safe-area-inset-bottom[\s\S]*?safe-area-inset-left/, `${page} content protects every safe edge`);
    assert.match(source, /footer(?:\.page-foot)?\s*\{[\s\S]*?safe-area-inset-right[\s\S]*?safe-area-inset-bottom[\s\S]*?safe-area-inset-left/, `${page} footer protects side and home-indicator edges`);
    assert.match(source, /\.back[^}]*min-height:44px/, `${page} back target is at least 44px tall`);
    assert.match(source, /footer[^}]*a\s*\{[^}]*min-height:44px/, `${page} footer links are at least 44px tall`);
  }

  const support = read('support.html');
  assert.match(support, /\.quick-card\s*\{[^}]*min-height:112px/, 'support quick paths have generous touch targets');
  assert.match(support, /summary\s*\{[^}]*min-height:54px/, 'support FAQ controls have generous touch targets');

  for (const page of ['privacy.html', 'terms.html']) {
    const source = read(page);
    assert.match(source, /nav\.toc li a\s*\{[^}]*min-height:44px/, `${page} table-of-contents links are at least 44px tall`);
  }
});
