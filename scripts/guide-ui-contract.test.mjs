import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INTENTS = ['compare-model', 'explore-topic', 'saved-setup'];
const TOPICS = ['conditions', 'direction', 'distance', 'impact', 'launch-spin', 'model-limits'];
const LAB_INPUTS = ['attack', 'dynLoft', 'face', 'path', 'speed'];

const SYSTEM_FONT_PATTERN =
  /\b(?:-apple-system|BlinkMacSystemFont|Segoe UI|Roboto|Helvetica|Arial|system-ui|ui-(?:sans-serif|serif|monospace))\b/i;
const COLOR_LITERAL =
  /#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch|color)\([^)]*\)/gi;

function read(relativePath) {
  const file = join(ROOT, relativePath);
  return existsSync(file) ? readFileSync(file, 'utf8') : '';
}

function withoutComments(source) {
  return source.replaceAll(/\/\*[\s\S]*?\*\//g, '');
}

function attributeValues(source, attribute) {
  const pattern = new RegExp(`\\b${attribute}\\s*=\\s*["']([^"']+)["']`, 'gi');
  return [...source.matchAll(pattern)].map(match => match[1]);
}

test('Guide ships as dedicated HTML, CSS, and module-JavaScript assets', () => {
  for (const file of ['jarvis.html', 'jarvis.css', 'jarvis.js']) {
    assert.ok(existsSync(join(ROOT, file)), `missing Guide asset: ${file}`);
  }

  const html = read('jarvis.html');
  assert.match(html, /<body\b(?=[^>]*\bdata-sa-route=["']jarvis["'])/i);
  assert.match(html, /<h1\b[^>]*>\s*Flightglass Guide\s*<\/h1>/i);
  assert.doesNotMatch(html, /Ask Jarvis|Jarvis\s*\/\s*v1/i);
  assert.match(
    html,
    /<link\b(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=["']\.\/jarvis\.css["'])[^>]*>/i,
  );
  assert.match(
    html,
    /<script\b(?=[^>]*\btype=["']module["'])(?=[^>]*\bsrc=["']\.\/jarvis\.js["'])[^>]*>\s*<\/script>/i,
  );
  assert.doesNotMatch(html, /<style\b/i, 'Guide styling belongs in jarvis.css');
  assert.doesNotMatch(html, /\bstyle\s*=/i, 'Guide markup must not carry authored inline CSS');
});

test('Guide exposes the complete guided browse, answer, and lab structure', () => {
  const html = read('jarvis.html');
  assert.deepEqual(attributeValues(html, 'data-guide-intent').sort(), INTENTS);
  assert.deepEqual(attributeValues(html, 'data-guide-topic').sort(), TOPICS);
  assert.deepEqual(
    [...new Set(attributeValues(html, 'data-guide-panel'))].sort(),
    ['answer', 'browse', 'lab'],
  );

  assert.match(
    html,
    /<[^>]+(?=[^>]*\bid=["']guideStatus["'])(?=[^>]*\brole=["']status["'])(?=[^>]*\baria-live=["']polite["'])[^>]*>/i,
  );
  assert.match(html, /\bdata-truth-tier(?:\s|=|>)/i);
  assert.match(html, /\bdata-model-gap(?:\s|=|>)/i);
  assert.match(html, /\bid=["']guideLabReset["']/i);
  assert.match(
    html,
    /<a\b(?=[^>]*\bid=["']guideOpenRange["'])(?=[^>]*\bhref=["'][^"']*impact\.html)[^>]*>/i,
  );

  assert.equal(
    /<input\b(?![^>]*\btype=["'](?:range|hidden)["'])/i.test(html),
    false,
    'guided choices must use buttons; only the lab range may use input',
  );
  assert.doesNotMatch(html, /<textarea\b|\bcontenteditable(?:\s|=|>)/i);
});

test('Guide CSS consumes the canonical design system without a local token or colour source', () => {
  const css = withoutComments(read('jarvis.css'));
  assert.ok(css.length > 0, 'jarvis.css must contain the Guide styles');
  assert.doesNotMatch(css, /:root\s*\{/i);
  assert.doesNotMatch(css, SYSTEM_FONT_PATTERN);

  const hardcoded = [...css.matchAll(COLOR_LITERAL)].map(match => match[0].toLowerCase());
  assert.deepEqual(hardcoded, [], `hardcoded Guide colours: ${[...new Set(hardcoded)].join(', ')}`);

  for (const token of ['--bg', '--ink', '--surface', '--accent', '--secondary', '--font-ui', '--font-data']) {
    assert.match(css, new RegExp(`var\\(${token.replace('-', '\\-')}\\)`), `missing canonical token ${token}`);
  }
  assert.match(css, /:focus-visible/);
  assert.match(css, /min-(?:width|height)\s*:\s*44px/);
  assert.match(css, /env\(safe-area-inset-(?:top|right|bottom|left)\)/);
  assert.match(css, /@media\s*\([^)]*prefers-reduced-motion\s*:\s*reduce[^)]*\)/i);
});

test('Guide runtime owns URL history, bounded answers, and the one-variable live lab', () => {
  const source = read('jarvis.js');
  const adapter = read('guide-engine.js');
  assert.ok(source.length > 0, 'jarvis.js must contain the Guide runtime');
  assert.match(source, /from\s+["']\.\/guide-knowledge\.js["']/);
  assert.match(source, /from\s+["']\.\/guide-engine\.js["']/);
  assert.match(source, /\bcreateOneVariableSweep\s*\(/);
  assert.match(adapter, /from\s+["']\.\/impact-outcome\.js["']/);
  assert.match(adapter, /\bselectOutcome\s*\(/);
  assert.match(source, /new\s+URLSearchParams\s*\(/);
  assert.match(source, /\.get\(\s*["']topic["']\s*\)/);
  assert.match(source, /\.get\(\s*["']question["']\s*\)/);
  assert.match(source, /history\.(?:pushState|replaceState)\s*\(/);
  assert.match(source, /addEventListener\(\s*["']popstate["']/);
  assert.match(source, /matchMedia\(\s*["']\(prefers-reduced-motion:\s*reduce\)["']\s*\)/);

  for (const key of LAB_INPUTS) {
    assert.match(source, new RegExp(`["']${key}["']`), `lab omits ${key}`);
  }
  assert.match(source, /guideLabReset/);
  assert.match(source, /guideOpenRange/);
});
