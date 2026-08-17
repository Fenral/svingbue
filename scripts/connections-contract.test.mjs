import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(join(ROOT, file), 'utf8');

test('Connections is an immersive, portrait v1 route with an explicit Home exit', () => {
  const html = read('connections.html');
  const guard = html.indexOf('<script src="./sa-view-transition-guard.js"></script>');
  const firstStylesheet = html.indexOf('rel="stylesheet"');

  assert.ok(guard >= 0 && guard < firstStylesheet, 'transition guard must run before styles');
  assert.match(html, /<body\b[^>]*data-sa-route="connections"/);
  assert.match(html, /<a\b[^>]*id="back"[^>]*href="\.\/index\.html"[^>]*aria-label="Back to home"/);
  assert.match(html, /href="\.\/sa-p3\.css"/);
  assert.match(html, /href="\.\/connections\.css"/);
  assert.match(html, /from '\.\/sa-orientation\.js'/);
  assert.match(html, /lockPortrait\s*\(\s*\)/);
  assert.doesNotMatch(html, /data-sa-shell|sa-app-shell\.css/);
});

test('the complete parameter map remains directly navigable', () => {
  const html = read('connections.html');
  for (const label of [
    'Swing Plane', 'Swing Direction', 'Low Point', 'Ball Position', 'Arc Height',
    'Attack Angle', 'Club Path', 'Club Face', 'Dynamic Loft', 'Club Speed', 'Strike',
    'Spin Loft', 'Spin Axis', 'Launch Direction', 'Launch Angle', 'Ball Speed',
    'Backspin', 'Curve', 'Apex', 'Carry', 'Landing Angle', 'Carry Side', 'Total',
  ]) {
    assert.match(html, new RegExp(`label:'${label}'`), `${label} must remain in the map`);
  }
  assert.match(html, /className='node sa-focus'/, 'every parameter is rendered as a focusable control');
  assert.doesNotMatch(html, /\.disabled\s*=/, 'filtering must not disable parameter navigation');
});

test('relationship truth and relative-strength semantics stay explicit', () => {
  const html = read('connections.html');

  for (const edge of [
    "['ballposition','lowpoint'",
    "['lowpoint','attack'",
    "['attack','spinloft'",
    "['spinloft','ballspeed'",
    "['spinloft','landingangle'",
    "['carry','side'",
  ]) assert.ok(html.includes(edge), `missing verified edge: ${edge}`);

  for (const falseEdge of [
    "['strike','ballspeed'",
    "['backspin','carry'",
    "['backspin','apex'",
    "['backspin','landingangle'",
    "['apex','landingangle'",
  ]) assert.equal(html.includes(falseEdge), false, `unsupported edge returned: ${falseEdge}`);

  assert.match(html, /Relative here/);
  assert.match(html, /primary:'Primary',contributing:'Supports',contextual:'Varies',variable:'Varies'/);
});

test('page styling consumes P3 tokens and preserves mobile accessibility', () => {
  const css = read('connections.css');
  const html = read('connections.html');

  assert.doesNotMatch(css, /#[\da-f]{3,8}\b/i, 'page CSS must not create a private hardcoded palette');
  assert.doesNotMatch(css, /@font-face|\b(?:Arial|Helvetica|system-ui|sans-serif|serif|monospace)\b/i,
    'page CSS must use canonical font roles');
  assert.match(css, /min-height:44px/);
  assert.match(css, /width:48px;height:48px/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /orientation:landscape/);
  assert.match(html, /Rotate your phone to portrait/i);
});
