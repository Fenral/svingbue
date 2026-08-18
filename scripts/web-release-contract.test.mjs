import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const www = join(root, 'www');

function filesBelow(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory()
      ? filesBelow(join(directory, entry.name), relative)
      : [relative];
  });
}

test('Vercel publishes only the explicit Flightglass v1 artifact', () => {
  const config = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
  assert.equal(config.buildCommand, 'npm run build:web');
  assert.equal(config.outputDirectory, 'www');

  const build = spawnSync(process.execPath, ['scripts/copy-web.mjs'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);

  for (const required of [
    'index.html',
    'connections.html',
    'impact.html',
    'impact-studio.html',
    'jarvis.html',
    'support.html',
    'privacy.html',
    'terms.html'
  ]) {
    assert.equal(existsSync(join(www, required)), true, `${required} must ship`);
  }

  const files = filesBelow(www);
  for (const forbidden of [
    'codemagic.yaml',
    'package.json',
    'vercel.json',
    'academy.html',
    'geometry.html'
  ]) {
    assert.equal(files.includes(forbidden), false, `${forbidden} must stay private`);
  }
  assert.equal(files.some((file) => /^(?:docs|scripts|tools|\.github)\//.test(file)), false);
});

test('public web responses receive the minimum anti-embedding and privacy headers', () => {
  const config = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
  const headers = Object.fromEntries(config.headers[0].headers.map(({ key, value }) => [key, value]));
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['X-Frame-Options'], 'DENY');
  assert.equal(headers['Referrer-Policy'], 'strict-origin-when-cross-origin');
  assert.match(headers['Permissions-Policy'], /camera=\(\)/);
});
