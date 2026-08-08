import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
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

test('product and release copy preserve the Mechanics authority boundary', () => {
  const product = read('PRODUCT.md');
  const technical = read('TECH_SPEC.md');
  const listing = read('docs/store-listing.md');
  const reviewer = read('docs/app-review-notes.md');
  const support = read('support.html');
  const range = read('impact.html');

  for (const source of [product, technical, listing, reviewer]) {
    assert.match(source, /Mechanics Lab/i);
    assert.match(source, /Range(?:\s*\/\s*Outcome|\/Outcome|[^\r\n]{0,40}(?:replay|comparison))/i);
    assert.match(source, /(?:Face(?: Angle)?[^\r\n]{0,80}(?:Club )?Path[^\r\n]{0,80}Attack[^\r\n]{0,80}(?:Dynamic )?Loft|Impact Inputs)/i);
    assert.match(source, /(?:Low Point X[^\r\n]{0,100}Low Point (?:Height|Y)|Arc Inputs)/i);
  }

  assert.match(technical, /Start, Curve, Launch, Backspin, Apex and\s+Carry/);
  assert.match(technical, /Browser preview does not consume access/i);
  assert.match(technical, /portrait and landscape without a rotate overlay/i);
  assert.match(listing, /browser preview does not consume this access state/i);
  assert.doesNotMatch(listing, /Impact Studio/i);

  assert.match(range, /default replay\/comparison surface/i);
  assert.doesNotMatch(range, /default cause\/effect surface/i);
  assert.match(support, /Mechanics Lab adapts to portrait and landscape/i);
  assert.doesNotMatch(support, /rotate your (?:phone|device)|uses landscape|needs landscape/i);
});

test('the bounded onboarding example remains a fixed Delivered Loft demonstration', () => {
  const home = read('index.html');
  const homeRuntime = read('sa-home.js');

  assert.match(home, /This is a fixed example/i);
  assert.match(home, /id="onboardingLoft"[^>]+value="24"/i);
  assert.match(home, /Only delivered loft changes\. Speed, face, path and attack stay fixed\./i);
  assert.match(homeRuntime, /clubSpeed:\s*90/);
  assert.match(homeRuntime, /faceAngle:\s*2/);
  assert.match(homeRuntime, /clubPath:\s*0/);
  assert.match(homeRuntime, /attackAngle:\s*3/);
  assert.doesNotMatch(home, /my swing|your technique|fix your/i);
});

test('Mechanics design finish evidence preserves the bounded detector and reviewer record', () => {
  const evidence = read('docs/mechanics-design-finish-evidence.md');

  assert.match(evidence, /Detector invocations:\s*\*\*exactly `1`\*\*/,
    'the durable record pins the detector to one invocation');
  assert.match(evidence, /Detector rerun after fixes:\s*\*\*No\*\*/,
    'the durable record prohibits claiming a detector rerun');
  assert.match(evidence, /239060970425fdeae2802d74f41601caafb4ae7c/,
    'the detector resolution points to the real immutable token commit');
  assert.match(evidence, /detect\.mjs --json impact-studio\.html impact-studio\.css design\/mocks\/impact-studio\.html index\.html jarvis\.html/,
    'the one detector command is reproducibly identified without running it');

  for (const token of [
    '--mechanics-black-absolute',
    '--mechanics-black-focus',
    '--mechanics-black-contact',
    '--mechanics-black-depth',
    '--mechanics-black-float',
    '--mechanics-radius-indicator',
    '--mechanics-radius-track',
    '--mechanics-radius-compact',
    '--mechanics-radius-switch',
    '--mechanics-type-floor',
    '--mechanics-type-detail',
    '--mechanics-type-control',
    '--mechanics-type-compact-data',
    '--mechanics-type-touch-data',
  ]) {
    assert.match(evidence, new RegExp(token), `${token} resolution is documented`);
  }

  assert.match(evidence, /first provenance-blind finish review returned \*\*CHANGES\*\*/);
  assert.match(evidence, /6a9ecf717cec17413dbb9ed4117136842e5746bf/,
    'the one reviewer-fix batch is immutable');
  assert.match(evidence, /pair 1 winner was \*\*A\*\* and pair 2 winner was \*\*B\*\*/);
  for (const [dimension, score] of [
    ['Product fit', 98],
    ['Causal legibility', 96],
    ['Hierarchy', 94],
    ['Responsive integrity', 95],
    ['Accessibility', 96],
    ['Brand specificity', 97],
    ['Non-generic craft', 96],
  ]) {
    assert.match(evidence, new RegExp(`\\| ${dimension} \\| ${score} \\|`),
      `${dimension} score is preserved`);
  }
  assert.match(evidence, /All critical requirements were green/);
  assert.match(evidence, /No material design finding remains open/);

  for (const path of ['assets/onboarding/studio.webp', 'appstore/contact-sheet.png']) {
    assert.equal(existsSync(join(ROOT, path)), true, `${path} is durable tracked visual evidence`);
  }
  for (const artifactPath of [
    'change-gate/impact-studio/chromium--932x430--normal--delivery.png',
    'change-gate/impact-studio/chromium--932x430--normal--arc.png',
    'change-gate/impact-studio/webkit--430x932--reduced--delivery.png',
    'change-gate/impact-studio/webkit--430x932--reduced--arc.png',
  ]) {
    assert.match(evidence, new RegExp(artifactPath.replaceAll('.', '\\.')),
      `${artifactPath} is bound to the CI artifact`);
  }
  assert.match(evidence, /actions\/runs\/31234474478\/artifacts\/9014962682/);
  assert.match(evidence, /sha256:d8b70ab0b334e2fb18d741db3ae20764fa33a6450e5e512ff37b5795a1ca22c3/);
});
