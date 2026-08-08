import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPT_DIR, '..');

const ROUTES = Object.freeze([
  { id: 'home', file: 'index.html', href: './index.html', shell: 'orientation' },
  { id: 'range', file: 'impact.html', href: './impact.html', shell: 'orientation' },
  { id: 'studio', file: 'impact-studio.html', href: './impact-studio.html', shell: 'direct' },
  { id: 'jarvis', file: 'jarvis.html', href: './jarvis.html', shell: 'direct' },
]);

const APPROVED_PAGE_CSS_LITERALS = new Map([
  ['index.html', new Set()],
  // Active Impact work owns these two legacy rotate-overlay fallbacks. The
  // shell supplies the runtime accessibility fix without changing that file.
  ['impact.html', new Set(['#0a0d13', '#e8eaed'])],
  ['impact-studio.html', new Set(['#8a5a2b'])],
  ['jarvis.html', new Set()],
]);

const SYSTEM_FONT_PATTERN =
  /\b(?:-apple-system|BlinkMacSystemFont|Segoe UI|Roboto|Helvetica|Arial|system-ui|ui-(?:sans-serif|serif|monospace))\b/i;
const COLOR_LITERAL =
  /#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch|color)\([^)]*\)/gi;

function read(relativePath) {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

function pageCss(html) {
  const blocks = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((match) => match[1]);
  const attributes = [...html.matchAll(/\bstyle\s*=\s*(["'])([\s\S]*?)\1/gi)]
    .map((match) => match[2]);

  return [...blocks, ...attributes]
    .join('\n')
    .replaceAll(/\/\*[\s\S]*?\*\//g, '');
}

function stylesheetHrefs(html) {
  return [...html.matchAll(/<link\b(?=[^>]*\brel=["']stylesheet["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1]);
}

test('shared app-shell assets exist and define the accessibility contract', () => {
  for (const file of ['sa-app-shell.css', 'sa-app-shell.js']) {
    assert.ok(existsSync(join(ROOT, file)), `missing shared shell asset: ${file}`);
  }

  const css = read('sa-app-shell.css');
  assert.match(css, /min-(?:width|height):\s*44px/);
  assert.match(css, /env\(safe-area-inset-(?:top|right|bottom|left)\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);

  const runtime = read('sa-app-shell.js');
  assert.match(runtime, /data-sa-shell/);
  assert.match(runtime, /aria-current/);
  assert.match(runtime, /\binert\b/);
  for (const route of ROUTES) {
    assert.match(runtime, new RegExp(`id:\\s*['"]${route.id}['"]`));
    assert.match(runtime, new RegExp(`href:\\s*['"]${route.href.replace('.', '\\.')}['"]`));
  }
});

test('each v1 route loads canonical tokens and the shared shell', () => {
  const sharedCss = read('sa.css');
  const orientation = read('sa-orientation.js');

  assert.match(sharedCss, /@import\s+(?:url\()?['"]?\.\/sa-app-shell\.css/);
  assert.match(orientation, /import\s+['"]\.\/sa-app-shell\.js['"]/);

  for (const route of ROUTES) {
    const html = read(route.file);
    const styles = stylesheetHrefs(html);
    assert.ok(styles.includes('./sa-p3.css'), `${route.file} must load sa-p3.css`);

    if (route.id === 'range') {
      assert.ok(styles.includes('./sa.css'), 'Range must load the shared CSS bootstrap');
    } else {
      assert.ok(styles.includes('./sa-app-shell.css'), `${route.file} must load the shell stylesheet`);
    }

    if (route.shell === 'orientation') {
      assert.match(html, /from\s+['"]\.\/sa-orientation\.js['"]/);
    } else {
      assert.match(
        html,
        /<script\b(?=[^>]*\btype=["']module["'])(?=[^>]*\bsrc=["']\.\/sa-app-shell\.js["'])[^>]*><\/script>/i,
      );
    }

    if (route.id !== 'range') {
      assert.match(html, new RegExp(`<body\\b(?=[^>]*\\bdata-sa-route=["']${route.id}["'])`, 'i'));
    }
  }
});

test('shipping pages do not redeclare canonical tokens or use system font stacks', () => {
  const canonicalTokens = new Set(
    [...read('sa-p3.css').matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]),
  );

  for (const route of ROUTES) {
    const css = pageCss(read(route.file));
    assert.doesNotMatch(css, SYSTEM_FONT_PATTERN, `${route.file} must use canonical font tokens`);

    const declarations = [...css.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]);
    const duplicated = declarations.filter((token) => canonicalTokens.has(token));
    assert.deepEqual(
      duplicated,
      [],
      `${route.file} redeclares canonical tokens: ${duplicated.join(', ')}`,
    );
  }

  assert.doesNotMatch(
    read('impact-studio.html'),
    /(?:var\(|CSS\(['"])(?:--attack|--path|--plane|--depth|--strike)\b/,
    'Impact Studio must consume semantic --q-* parameter aliases',
  );
});

test('shipping page CSS contains only approved hardcoded colour literals', () => {
  for (const route of ROUTES) {
    const literals = [...pageCss(read(route.file)).matchAll(COLOR_LITERAL)]
      .map((match) => match[0].toLowerCase());
    const approved = APPROVED_PAGE_CSS_LITERALS.get(route.file);
    const unapproved = literals.filter((literal) => !approved.has(literal));

    assert.deepEqual(
      unapproved,
      [],
      `${route.file} has unapproved page-CSS colours: ${[...new Set(unapproved)].join(', ')}`,
    );
  }
});
