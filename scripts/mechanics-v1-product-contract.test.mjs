import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => readFileSync(join(ROOT, relativePath), 'utf8');

test('Mechanics Lab is the one complete cause-to-strike-to-flight authority', () => {
  const mechanics = read('impact-studio.html');

  assert.match(mechanics, /<title>[^<]*Mechanics Lab[^<]*<\/title>/i);
  assert.match(mechanics, /<h1[^>]*>Mechanics Lab<\/h1>/i);
  assert.match(mechanics, /<main[^>]+class="mechanics"[^>]+data-mechanics-mode="delivery"/i);
  assert.match(mechanics, /data-mechanics-mode="delivery"[^>]*>Impact Inputs<\/button>/i);
  assert.match(mechanics, /data-mechanics-mode="arc"[^>]*>Arc Inputs<\/button>/i);

  for (const id of [
    'delivery-face',
    'delivery-path',
    'delivery-attack',
    'delivery-loft',
    'arc-low-point',
    'arc-height',
    'arc-direction',
    'arc-plane',
  ]) {
    assert.match(mechanics, new RegExp(`id=["']${id}["']`), `${id} is a live Mechanics control`);
  }

  for (const outcome of ['start', 'curve', 'launch', 'backspin', 'apex', 'carry']) {
    assert.match(
      mechanics,
      new RegExp(`data-outcome=["']${outcome}["']`),
      `${outcome} remains in the shared flight instrument`,
    );
  }

  assert.doesNotMatch(mechanics, /id=["']stage["']|class=["'][^"']*view-pill/i,
    'the retired Studio scene must not compete with Mechanics');
  assert.doesNotMatch(
    mechanics,
    /\b(?:coach(?:ing)?|diagnos(?:e|is)|fix your|improve your|personal(?:ized|ised)?|technique)\b/i,
    'Mechanics explains model causality without coaching or personal-golf claims',
  );
});

test('Mechanics retains internal studio compatibility and the v1 lifecycle hooks', () => {
  const mechanics = read('impact-studio.html');

  assert.match(mechanics, /<body[^>]+data-sa-route="studio"/i,
    'analytics and access keep the internal studio route id');
  assert.match(mechanics, /href="\.\/sa-app-shell\.css"/);
  assert.match(mechanics, /href="\.\/sa-paywall\.css"/);
  assert.match(mechanics, /from ['"]\.\/sa-access\.js['"]/);
  assert.match(mechanics, /\bauthorize\s*\(/);
  assert.match(mechanics, /\bconsume\s*\(/);
  assert.match(mechanics, /from ['"]\.\/sa-analytics\.js['"]/);
  assert.match(mechanics, /\btrack\(['"]experiment_started['"]/);
  assert.match(mechanics, /\btrack\(['"]experiment_completed['"]/);
  assert.match(mechanics, /import\(['"]\.\/sa-paywall\.js['"]\)/);
  assert.match(mechanics, /guidedExperiment/,
    'the Guide handoff keeps the guided experiment compatibility contract');
  assert.match(mechanics, /src="\.\/sa-app-shell\.js"/);
  assert.match(mechanics, /unlockOrientation\s*\(/,
    'Mechanics releases the native orientation lock for adaptive use');
  assert.doesNotMatch(mechanics, /lockLandscape\s*\(|rotate your (?:phone|device)/i);
});

test('Home, Guide and commerce use visible Mechanics naming', () => {
  const home = read('index.html');
  const guide = read('jarvis.js');
  const paywall = read('sa-paywall.js');

  assert.match(home, />Mechanics(?: Lab)?<\/strong>|>Mechanics Lab<\/span>/i);
  assert.doesNotMatch(home, />Impact Studio<|>Studio<\/strong>/i);

  assert.match(guide, /Open Mechanics Lab/);
  assert.match(guide, /recommendedRoute:\s*[^\r\n]*['"]studio['"]/,
    'Guide keeps the internal studio compatibility value');
  assert.doesNotMatch(guide, /Open Impact Studio/);

  assert.match(paywall, /guided Mechanics experiment/i);
  assert.match(paywall, /Mechanics experiments/i);
  assert.doesNotMatch(paywall, /guided Studio|Studio experiments/i);
});
