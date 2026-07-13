#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadManifest, validateManifest } from './lib/flightglass-ux.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const json = process.argv.includes('--json');
const failures = [];

const requiredFiles = [
  'CLAUDE.md',
  '.claude/commands/flightglass-autopilot.md',
  'docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md',
  'docs/flightglass-autopilot/README.md',
  'docs/flightglass-autopilot/STATUS.md',
  'docs/flightglass-autopilot/RELEASE-AUTHORIZATION.md',
  'config/flightglass-surfaces.json',
  'scripts/flightglass-ux-audit.mjs',
  'scripts/flightglass-ux.test.mjs',
  'scripts/lib/flightglass-ux.mjs',
  'outputs/flightglass-brand/identity-proof.png'
];
for (const file of requiredFiles) {
  if (!existsSync(join(ROOT, file))) failures.push(`missing required file: ${file}`);
}

const packageJson = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const requiredScripts = {
  'ux:manifest': 'node scripts/flightglass-ux-audit.mjs --manifest-only',
  'ux:baseline': 'node scripts/flightglass-ux-audit.mjs --mode baseline --motion both',
  'ux:verify': 'node scripts/flightglass-ux-audit.mjs --mode verify --motion both',
  'claude:ready': 'npm run brand:verify && npm run test:ux && node scripts/verify-claude-autopilot.mjs'
};
const uxTestCommand = packageJson.scripts?.['test:ux'] || '';
if (!uxTestCommand.startsWith('node --test ') ||
    !uxTestCommand.includes('scripts/flightglass-ux.test.mjs')) {
  failures.push('package script test:ux must run scripts/flightglass-ux.test.mjs with node --test');
}
for (const [name, command] of Object.entries(requiredScripts)) {
  if (packageJson.scripts?.[name] !== command) failures.push(`package script ${name} must equal: ${command}`);
}

const manifestPath = join(ROOT, 'config', 'flightglass-surfaces.json');
if (existsSync(manifestPath)) {
  const validation = validateManifest(loadManifest(manifestPath), ROOT);
  failures.push(...validation.errors);
}

const controlDocs = [
  'CLAUDE.md',
  '.claude/commands/flightglass-autopilot.md',
  'docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md',
  'docs/flightglass-autopilot/README.md',
  'docs/flightglass-autopilot/STATUS.md',
  'docs/flightglass-autopilot/RELEASE-AUTHORIZATION.md'
];
for (const file of controlDocs.filter((item) => existsSync(join(ROOT, item)))) {
  const body = readFileSync(join(ROOT, file), 'utf8');
  if (/\b(?:TBD|TODO|FIXME)\b|fill in details|implement later/i.test(body)) {
    failures.push(`${file}: unresolved placeholder language`);
  }
}

const releaseAuthorization = existsSync(join(ROOT, 'docs/flightglass-autopilot/RELEASE-AUTHORIZATION.md'))
  ? readFileSync(join(ROOT, 'docs/flightglass-autopilot/RELEASE-AUTHORIZATION.md'), 'utf8')
  : '';
if (!releaseAuthorization.includes('Owner approval: granted on 2026-07-13.')) {
  failures.push('release authorization must record the owner approval date');
}
if (!releaseAuthorization.includes('All Phase 8 gates must pass')) {
  failures.push('release authorization must remain conditional on every Phase 8 gate');
}

const protectedChecks = [
  ['capacitor.config.ts', "appId: 'no.strikearc.app'"],
  ['sa-iap.js', "monthly: 'strikearc_pro_monthly'"],
  ['sa-iap.js', "annual: 'strikearc_pro_annual'"],
  ['sa-iap.js', "lifetime: 'strikearc_pro_lifetime'"],
  ['academy.html', "const STORE_KEY = 'strikearc.academy.v1'"],
  ['academy.html', "const NUDGE_KEY = 'strikearc.academy.nudge'"],
  ['codemagic.yaml', 'APP_STORE_APPLE_ID: 6768449250']
];
for (const [file, token] of protectedChecks) {
  if (!readFileSync(join(ROOT, file), 'utf8').includes(token)) {
    failures.push(`${file}: protected identifier changed: ${token}`);
  }
}

const payload = {
  valid: failures.length === 0,
  requiredFiles: requiredFiles.length,
  protectedIdentifiers: protectedChecks.length,
  failures
};

if (json) process.stdout.write(`${JSON.stringify(payload)}\n`);
else if (failures.length) {
  console.error(`Claude autopilot verification failed (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
} else {
  console.log(`Claude autopilot ready (${requiredFiles.length} files, ${protectedChecks.length} protected identifiers).`);
}

if (failures.length) process.exit(1);
