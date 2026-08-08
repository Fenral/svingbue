import test from 'node:test';
import assert from 'node:assert/strict';
import { closeSync, existsSync, openSync, readFileSync, readdirSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const www = join(root, 'www');
const copyWebLock = join(tmpdir(), `flightglass-copy-web-${basename(root)}.lock`);

function withCopyWebLock(run) {
  const deadline = Date.now() + 15_000;
  let descriptor;
  while (descriptor === undefined) {
    try {
      descriptor = openSync(copyWebLock, 'wx');
    } catch (error) {
      if (error.code !== 'EEXIST' || Date.now() >= deadline) throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25);
    }
  }
  try {
    return run();
  } finally {
    closeSync(descriptor);
    unlinkSync(copyWebLock);
  }
}

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

  const build = withCopyWebLock(() => spawnSync(process.execPath, ['scripts/copy-web.mjs'], {
    cwd: root,
    encoding: 'utf8'
  }));
  assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);

  for (const required of [
    'index.html',
    'impact.html',
    'impact-studio.html',
    'jarvis.html',
    'support.html',
    'privacy.html',
    'terms.html'
  ]) {
    assert.equal(existsSync(join(www, required)), true, `${required} must ship`);
  }

  for (const dependency of [
    'impact-studio.css',
    'impact-mechanics-model.js',
    'geometry-controller.js',
  ]) {
    assert.equal(existsSync(join(root, dependency)), true, `${dependency} root source must exist`);
    assert.equal(existsSync(join(www, dependency)), true, `${dependency} must ship`);
    assert.deepEqual(
      readFileSync(join(www, dependency)),
      readFileSync(join(root, dependency)),
      `${dependency} must be byte-identical in the web artifact`,
    );
  }

  assert.equal(
    existsSync(join(www, 'assets', 'impact-studio')),
    false,
    'retired Impact Studio imagery must not ship',
  );

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
