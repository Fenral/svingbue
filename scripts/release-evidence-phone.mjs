#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const CANONICAL_PRECONDITIONS = Object.freeze([
  'The installed version/build matches the candidate record and exact commit.',
  "GitHub's full release gate is green for that commit.",
  'The build is signed for no.strikearc.app and installs/launches normally.',
  'The native build received a valid iOS RevenueCat public SDK key at build time; no key is committed.',
  "RevenueCat has Apple's In-App Purchase Key (.p8), Key ID and matching Issuer ID; none is committed or bundled in the app.",
  'App Store Connect Monthly and Annual products are available to the sandbox.',
  "RevenueCat's current Offering maps Monthly and Annual to entitlement pro.",
  'The legacy Lifetime product still maps to pro for an existing owner, but is not offered for sale.',
  'Paid Apps Agreement, tax and banking are active for the candidate account.',
]);

export const CANONICAL_SMOKE_REQUIREMENTS = Object.freeze([
  'Cold launch shows a complete safe-area layout with no blank frame, clipped control or status-bar/home-indicator collision.',
  'Skip the opening, background/foreground the app, then relaunch; the opening does not replay in the same app session.',
  'On fresh state, each Not now point resumes the same onboarding step after relaunch.',
  'Moving Delivered Loft visibly updates Launch Angle, Spin Loft and Backspin together; the tour creates no personal profile or currentShot.',
  'Product-map links open Range/Outcome, Mechanics Lab and Guide in separate fresh attempts, with the bottom navigation and Back path usable.',
  'Home, Range/Outcome, Mechanics and Guide each render and respond in portrait without horizontal overflow, clipped primary actions or unusable controls.',
  'Mechanics Lab works in portrait and landscape without a forced-rotate overlay; every other permitted orientation reflows or respects its native lock without a stuck/blank surface.',
  'Background for at least 30 seconds during an edited Outcome state, resume, and confirm the app remains responsive and does not corrupt the state.',
  'Enable iOS Reduced Motion, cold-launch and repeat opening, onboarding resume and route navigation with no essential information removed.',
  'With VoiceOver on, reach the product map and Home Restore Purchases control; focus order, labels and activation are usable and status changes are announced.',
  'Increase Dynamic Type to the largest practical accessibility size and verify legal/support and purchase controls remain reachable without hidden content.',
  'Open Privacy and Terms from the native purchase/legal surface and return successfully; separately open the public Support URL over HTTPS and confirm it loads.',
]);

const EXPECTED_PRECONDITIONS = Object.freeze(
  CANONICAL_PRECONDITIONS.map((_, index) => String(index + 1)),
);
const EXPECTED_SMOKE_ROWS = Object.freeze(
  CANONICAL_SMOKE_REQUIREMENTS.map((_, index) => String(index + 1)),
);
const EXPECTED_PURCHASE_FLOWS = Object.freeze([
  'Live Offering',
  'Cancel',
  'Error + recovery',
  'Purchase',
  'Relaunch persistence',
  'Clean-install restore',
  'Legacy restore',
]);
const EXPECTED_ENGINES = Object.freeze(['Chromium', 'WebKit']);
const REQUIRED_CANDIDATE_FIELDS = Object.freeze([
  'Test date/time and timezone',
  'Tester initials / role',
  'Candidate commit SHA',
  'GitHub release-gate run URL',
  'App version and build number',
  'Distribution source',
  'iPhone model',
  'iOS version',
  'Device language / region',
  'Display Zoom / text size',
  'Reduced Motion state(s) tested',
  'Network(s) tested',
  'RevenueCat project / Offering identifier',
  'RevenueCat entitlement identifier',
  'Storefront country',
  'Fresh subscription tester alias',
  'Existing Lifetime tester alias',
  'Evidence folder or release-record link',
]);
const REQUIRED_SUMMARY_FIELDS = Object.freeze([
  'Exact candidate identity verified',
  'Required core-smoke rows passed',
  'Required purchase/restore rows passed',
  'Unresolved launch-blocking defects',
  'Physical-iPhone gate verdict',
  'Reviewer and review timestamp',
]);
const ISO_TIMESTAMP_PATTERN = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2}))/;
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;
const EXPECTED_WORKFLOW_NAME = 'Flightglass v1 release gate';
const EXPECTED_WORKFLOW_PATH = '.github/workflows/v1-release-gate.yml';
const CANONICAL_REPOSITORY = 'Fenral/svingbue';
const CANONICAL_TEMPLATE = path.join('docs', 'phase2-phone-checklist.md');
const CANONICAL_H1 = '# Flightglass v1 physical-iPhone release evidence';
const CANONICAL_H2_HEADINGS = Object.freeze([
  '## Candidate and environment record — required before testing',
  '## Preconditions — stop if any fail',
  '## Physical-iPhone core smoke',
  '## Purchase evidence record',
  '## Automated phone prerequisite',
  '## Final handoff',
]);
const ATTESTATION_PREFIX = 'flightglass-phone-evidence-attestation';
const LEGACY_ATTESTATION_NAME = `${ATTESTATION_PREFIX}.json`;
const BINARY_EVIDENCE_EXTENSIONS = new Set([
  '.gif', '.heic', '.jpeg', '.jpg', '.mov', '.mp4', '.pdf', '.png', '.webp', '.zip',
]);

export class EvidenceError extends Error {
  constructor(kind, message) {
    super(message);
    this.name = 'EvidenceError';
    this.kind = kind;
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalized(value) {
  return String(value).replace(/[*`]/g, '').trim();
}

function isPlaceholder(value) {
  const clean = normalized(value);
  return clean === ''
    || /\b(?:PENDING|TBD|TBC|TODO|UNKNOWN|UNSET|PLACEHOLDER|CHANGEME|CHANGE-ME)\b/i.test(clean)
    || /(?:^|[\s(])N\/A(?=$|[\s),:;-])/i.test(clean)
    || /^(?:none|no evidence|not recorded)$/i.test(clean)
    || /^-+$/.test(clean)
    || /^<[^>]+>$/.test(clean);
}

function assertComplete(value, location) {
  if (isPlaceholder(value)) {
    throw new EvidenceError('incomplete', `${location} is missing or still contains a placeholder.`);
  }
}

function assertNoGateState(value, location) {
  const state = normalized(value).match(/\b(PENDING|BLOCKED|FAIL)\b/i)?.[1];
  if (state) {
    throw new EvidenceError(
      'incomplete',
      `${location} contains ${state.toUpperCase()}; every required recorded result must be PASS.`,
    );
  }
}

const HTML_ENTITY_VALUES = Object.freeze({
  amp: '&', apos: "'", colon: ':', commat: '@', equals: '=', gt: '>', hyphen: '-',
  lowbar: '_', lt: '<', num: '#', period: '.', plus: '+', quest: '?', quot: '"', sol: '/',
});

function decodeHtmlEntities(value) {
  return value.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z][a-z0-9]+);/gi, (entity, body) => {
    if (body[0] !== '#') return HTML_ENTITY_VALUES[body.toLowerCase()] ?? entity;
    const hexadecimal = body[1]?.toLowerCase() === 'x';
    const codePoint = Number.parseInt(body.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
    if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return entity;
    try {
      return String.fromCodePoint(codePoint);
    } catch {
      return entity;
    }
  });
}

function decodePercentEncoding(value) {
  return value.replace(/(?:%[0-9a-f]{2})+/gi, encoded => {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return encoded;
    }
  });
}

function decodeJsonEscapes(value) {
  return value
    .replace(/\\u(d[89ab][0-9a-f]{2})\\u(d[c-f][0-9a-f]{2})/gi, (encoded, high, low) => {
      const highCode = Number.parseInt(high, 16);
      const lowCode = Number.parseInt(low, 16);
      return String.fromCodePoint(0x10000 + ((highCode - 0xd800) * 0x400) + (lowCode - 0xdc00));
    })
    .replace(/\\u([0-9a-f]{4})/gi, (_, hexadecimal) => String.fromCharCode(Number.parseInt(hexadecimal, 16)))
    .replace(/\\(["\\/bfnrt])/g, (_, escaped) => ({
      '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t',
    })[escaped]);
}

function flattenJsonForScanning(value) {
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  const fragments = [];
  const stack = [{ key: '$', value: parsed }];
  while (stack.length) {
    const current = stack.pop();
    if (current.value !== null && typeof current.value === 'object') {
      for (const [key, child] of Object.entries(current.value)) {
        fragments.push(key);
        stack.push({ key, value: child });
      }
    } else {
      fragments.push(`${current.key}: ${String(current.value)}`);
    }
  }
  return fragments.join('\n');
}

function sensitiveScanVariants(value) {
  const variants = new Set();
  const queue = [];
  const add = candidate => {
    if (typeof candidate !== 'string' || variants.has(candidate)) return;
    variants.add(candidate);
    queue.push(candidate);
  };
  add(String(value));
  while (queue.length && variants.size < 128) {
    const current = queue.shift();
    add(current.replace(/[*`]/g, ''));
    add(current.replace(/["']/g, '').replace(/[{}[\],]/g, ' '));
    add(decodeHtmlEntities(current));
    add(decodePercentEncoding(current));
    add(decodeJsonEscapes(current));
    add(flattenJsonForScanning(current.trim()));
    for (const line of current.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (/^(?:\{|\[|")/.test(trimmed)) add(flattenJsonForScanning(trimmed));
    }
  }
  return variants;
}

function assertNoSensitiveData(value, location) {
  const variants = sensitiveScanVariants(value);
  const sensitivePatterns = [
    { pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, label: 'an email address or Apple account' },
    { pattern: /-----BEGIN [^-]*(?:PRIVATE KEY|CERTIFICATE)-----/i, label: 'key or certificate material' },
    { pattern: /\b(?:appl|goog|amazon|rcb|sk|pk)_[A-Za-z0-9_-]{8,}\b/i, label: 'an SDK or API key' },
    { pattern: /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/, label: 'a signed token' },
    { pattern: /\b\d{15,}\b/, label: 'a transaction, order, or account-like identifier' },
    { pattern: /[?&](?:access_?token|api_?key|secret|receipt|transaction|account)=/i, label: 'a sensitive URL query parameter' },
    {
      pattern: /\b(?:apple\s*id|account(?:\s+(?:id|email))?|tester\s+email|receipt(?:\s+(?:id|data))?|transaction(?:\s+id)?|order\s+(?:id|number)|issuer\s+id|key\s+id|customer\s+id|password|private\s+key|api\s+key|sdk\s+key)\s*(?::|=|#|\bis\b)\s*(?!redacted\b|hidden\b|omitted\b|not\s+(?:recorded|exposed)\b|none\b)[^\s|,;]{4,}/i,
      label: 'a sensitive account, receipt, transaction, or key value',
    },
    { pattern: /\b[A-Za-z0-9+/]{80,}={0,2}\b/, label: 'long encoded data that may be a receipt or key' },
  ];

  for (const { pattern, label } of sensitivePatterns) {
    if ([...variants].some(variant => pattern.test(variant))) {
      throw new EvidenceError(
        'sensitive',
        `${location} appears to contain ${label}. Remove it and keep only a non-identifying alias or evidence reference.`,
      );
    }
  }
}

function assertRecorded(value, location) {
  assertComplete(value, location);
  assertNoGateState(value, location);
  assertNoSensitiveData(value, location);
}

function section(markdown, headingPrefix) {
  const expression = new RegExp(`^${escapeRegExp(headingPrefix)}(?:\\s|$).*`, 'm');
  const match = expression.exec(markdown);
  if (!match) throw new EvidenceError('invalid', `Missing "${headingPrefix}" section.`);
  const start = match.index;
  const rest = markdown.slice(start + match[0].length);
  const nextHeading = /\n##\s/.exec(rest);
  return markdown.slice(start, nextHeading ? start + match[0].length + nextHeading.index : markdown.length);
}

function cells(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(value => value.trim());
}

function parseTable(markdown, headingPrefix, expectedHeaders) {
  const lines = section(markdown, headingPrefix)
    .split(/\r?\n/)
    .filter(line => /^\s*\|/.test(line));
  if (lines.length < 2) {
    throw new EvidenceError('invalid', `${headingPrefix} is missing its Markdown table.`);
  }
  const headers = cells(lines[0]);
  if (headers.length !== expectedHeaders.length
    || headers.some((header, index) => normalized(header) !== expectedHeaders[index])) {
    throw new EvidenceError(
      'invalid',
      `${headingPrefix} must use columns: ${expectedHeaders.join(' | ')}.`,
    );
  }
  const divider = cells(lines[1]);
  if (divider.length !== expectedHeaders.length
    || divider.some(value => !/^:?-{3,}:?$/.test(value))) {
    throw new EvidenceError('invalid', `${headingPrefix} has a malformed Markdown table divider.`);
  }
  return lines.slice(2).map((line, index) => {
    const values = cells(line);
    if (values.length !== expectedHeaders.length) {
      throw new EvidenceError(
        'invalid',
        `${headingPrefix} row ${index + 1} has ${values.length} columns; expected ${expectedHeaders.length}.`,
      );
    }
    return values;
  });
}

function assertExactKeys(rows, expected, label) {
  const keys = rows.map(row => row[0]);
  const counts = new Map();
  for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
  const missing = expected.filter(key => !counts.has(key));
  const unexpected = [...counts.keys()].filter(key => !expected.includes(key));
  const duplicates = [...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key);
  if (rows.length !== expected.length || missing.length || unexpected.length || duplicates.length) {
    throw new EvidenceError(
      'invalid',
      `${label} must contain ${expected.join(', ')} exactly once. Missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}; duplicates: ${duplicates.join(', ') || 'none'}.`,
    );
  }
}

function assertCanonicalText(rows, canonical, label) {
  for (const row of rows) {
    const index = Number(row[0]) - 1;
    if (normalized(row[1]) !== normalized(canonical[index])) {
      throw new EvidenceError(
        'invalid',
        `${label} ${row[0]} requirement text must exactly match the immutable checklist template.`,
      );
    }
  }
}

function validIsoTimestamp(value) {
  const match = new RegExp(`^${ISO_TIMESTAMP_PATTERN.source}$`).exec(value);
  if (!match || Number.isNaN(Date.parse(value))) return false;
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(value);
  if (!parts) return false;
  const [, year, month, day, hour, minute, second = '00'] = parts;
  const numbers = [year, month, day, hour, minute, second].map(Number);
  const calendar = new Date(Date.UTC(
    numbers[0], numbers[1] - 1, numbers[2], numbers[3], numbers[4], numbers[5],
  ));
  return calendar.getUTCFullYear() === numbers[0]
    && calendar.getUTCMonth() === numbers[1] - 1
    && calendar.getUTCDate() === numbers[2]
    && calendar.getUTCHours() === numbers[3]
    && calendar.getUTCMinutes() === numbers[4]
    && calendar.getUTCSeconds() === numbers[5];
}

function requireIsoTimestamp(value, location) {
  const clean = normalized(value);
  if (!validIsoTimestamp(clean)) {
    throw new EvidenceError(
      'invalid',
      `${location} must be a valid ISO 8601 timestamp with Z or a UTC offset.`,
    );
  }
  return clean;
}

function extractIsoTimestamp(value, location) {
  const timestamp = String(value).match(ISO_TIMESTAMP_PATTERN)?.[1];
  if (!timestamp || !validIsoTimestamp(timestamp)) {
    throw new EvidenceError(
      'invalid',
      `${location} must include a valid ISO 8601 timestamp with Z or a UTC offset.`,
    );
  }
  return timestamp;
}

function validFullCommit(value) {
  return /^[0-9a-f]{40}$/i.test(value);
}

function parseBuildIdentity(value, location = 'Build identity') {
  const clean = normalized(value);
  const match = /^v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\s+\((\d+)\)$/.exec(clean);
  if (!match) {
    throw new EvidenceError(
      'invalid',
      `${location} must use the exact format "<package-version> (<numeric-build>)", for example "1.0.0 (42)".`,
    );
  }
  if (!/^[1-9]\d*$/.test(match[2])) {
    throw new EvidenceError('invalid', `${location} build number must be at least 1 with no leading zero.`);
  }
  return { version: match[1], buildNumber: match[2], display: `${match[1]} (${match[2]})` };
}

function validAlias(value) {
  return /^[A-Za-z0-9][A-Za-z0-9_-]{1,31}$/.test(normalized(value));
}

function parseGithubRunUrl(value, location) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new EvidenceError('invalid', `${location} must be an HTTPS GitHub Actions run URL.`);
  }
  const match = /^\/([^/]+)\/([^/]+)\/actions\/runs\/(\d+)\/?$/.exec(url.pathname);
  if (url.protocol !== 'https:'
    || url.hostname !== 'github.com'
    || !match
    || url.username
    || url.password
    || url.port
    || url.search
    || url.hash) {
    throw new EvidenceError(
      'invalid',
      `${location} must match https://github.com/<owner>/<repo>/actions/runs/<run-id> with no credentials, port, query or fragment.`,
    );
  }
  return {
    url: url.href.replace(/\/$/, ''),
    owner: match[1],
    repo: match[2],
    runId: match[3],
    fullName: `${match[1]}/${match[2]}`,
  };
}

function extractGithubRunUrl(value, location) {
  const candidate = String(value).match(/https:\/\/github\.com\/[^\s|]+/i)?.[0];
  if (!candidate) {
    throw new EvidenceError('invalid', `${location} must include an HTTPS GitHub Actions run URL.`);
  }
  return parseGithubRunUrl(candidate.replace(/[),.;]+$/, ''), location);
}

function isPrivateIp(hostname) {
  if (!isIP(hostname)) return false;
  return /^127\.|^10\.|^192\.168\.|^169\.254\.|^0\.|^::1$|^fc|^fd|^fe80/i.test(hostname)
    || /^172\.(?:1[6-9]|2\d|3[01])\./.test(hostname);
}

function assertSafeHttpsUrl(value, location) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new EvidenceError('invalid', `${location} must be an existing evidence file or safe HTTPS URL.`);
  }
  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== 'https:'
    || url.username
    || url.password
    || (url.port && url.port !== '443')
    || url.search
    || url.hash
    || hostname === 'localhost'
    || hostname.endsWith('.local')
    || isPrivateIp(hostname)
    || (!isIP(hostname) && !hostname.includes('.'))) {
    throw new EvidenceError(
      'invalid',
      `${location} uses an unsafe evidence URL; require public HTTPS with no credentials, query or fragment.`,
    );
  }
  assertNoSensitiveData(url.href, location);
  return url.href.replace(/\/$/, '');
}

function stripMarkdownLink(value) {
  const clean = normalized(value);
  const match = /^\[[^\]]+\]\(([^)]+)\)$/.exec(clean);
  return match ? match[1].trim() : clean;
}

function isWithin(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function evidenceContext(evidenceRoot) {
  if (!evidenceRoot) {
    throw new EvidenceError('invalid', 'An explicit evidence root is required to validate evidence references.');
  }
  let root;
  try {
    root = fs.realpathSync(evidenceRoot);
  } catch {
    throw new EvidenceError('invalid', `Evidence root does not exist: ${path.resolve(evidenceRoot)}`);
  }
  if (!fs.statSync(root).isDirectory()) {
    throw new EvidenceError('invalid', `Evidence root must be a directory: ${root}`);
  }
  return { root, referencedFiles: new Map(), externalUrls: new Set() };
}

function validateEvidenceReference(value, location, context) {
  assertRecorded(value, location);
  const reference = stripMarkdownLink(value);
  if (/^https:/i.test(reference)) {
    const url = assertSafeHttpsUrl(reference, location);
    context.externalUrls.add(url);
    return { kind: 'url', value: url };
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(reference) || path.isAbsolute(reference)) {
    throw new EvidenceError(
      'invalid',
      `${location} must be a relative file inside the evidence root or a safe HTTPS URL.`,
    );
  }
  const candidate = path.resolve(context.root, reference);
  let real;
  try {
    real = fs.realpathSync(candidate);
  } catch {
    throw new EvidenceError('invalid', `${location} references a missing evidence file: ${reference}`);
  }
  if (!isWithin(context.root, real)) {
    throw new EvidenceError('invalid', `${location} escapes the evidence root: ${reference}`);
  }
  const stat = fs.statSync(real);
  if (!stat.isFile()) {
    throw new EvidenceError('invalid', `${location} must reference an evidence file, not a directory: ${reference}`);
  }
  const relative = path.relative(context.root, real).split(path.sep).join('/');
  const basename = path.basename(relative).toLowerCase();
  if (basename === LEGACY_ATTESTATION_NAME.toLowerCase()
    || (basename.startsWith(`${ATTESTATION_PREFIX}-`) && basename.endsWith('.json'))) {
    throw new EvidenceError(
      'invalid',
      `${location} must not reference the generated attestation itself.`,
    );
  }
  context.referencedFiles.set(relative, real);
  return { kind: 'file', value: relative };
}

function scanReferencedTextFiles(context) {
  const scanned = new Set();
  for (const [relative, absolute] of context.referencedFiles) {
    if (scanned.has(relative)) continue;
    scanned.add(relative);
    const extension = path.extname(relative).toLowerCase();
    if (BINARY_EVIDENCE_EXTENSIONS.has(extension)) continue;
    const stat = fs.statSync(absolute);
    if (stat.size > 10 * 1024 * 1024) {
      throw new EvidenceError('invalid', `Referenced text evidence is larger than 10 MiB: ${relative}`);
    }
    const content = fs.readFileSync(absolute, 'utf8');
    if (content.includes('\0')) {
      throw new EvidenceError(
        'invalid',
        `Referenced text evidence must be UTF-8 text without NUL bytes: ${relative}`,
      );
    }
    assertNoSensitiveData(content, `Referenced evidence file "${relative}"`);
    if (extension === '.md' || extension === '.markdown') {
      for (const match of content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
        const target = match[1].trim();
        if (!target || target.startsWith('#')) continue;
        validateEvidenceReference(target, `Evidence index "${relative}" link`, context);
      }
    }
  }
}

function gitResult(cwd, args) {
  return spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function gitOutput(cwd, args, location) {
  const result = gitResult(cwd, args);
  if (result.status !== 0) {
    throw new EvidenceError('invalid', `${location}: ${result.stderr.trim() || 'git command failed'}`);
  }
  return result.stdout.trim();
}

export function resolveCommit(commit, cwd = process.cwd()) {
  if (!validFullCommit(commit)) return null;
  const result = gitResult(cwd, ['rev-parse', '--verify', `${commit}^{commit}`]);
  if (result.status !== 0) return null;
  const resolved = result.stdout.trim().toLowerCase();
  return validFullCommit(resolved) ? resolved : null;
}

function parseGithubOrigin(value) {
  const clean = value.trim();
  const https = /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i.exec(clean);
  const scp = /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i.exec(clean);
  const ssh = /^ssh:\/\/git@github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i.exec(clean);
  const match = https || scp || ssh;
  if (!match) {
    throw new EvidenceError('invalid', 'git origin must be a GitHub repository URL.');
  }
  return { owner: match[1], repo: match[2], fullName: `${match[1]}/${match[2]}` };
}

function assertCanonicalRepository(repository, location) {
  if (String(repository?.fullName).toLowerCase() !== CANONICAL_REPOSITORY.toLowerCase()) {
    throw new EvidenceError(
      'invalid',
      `${location} must be the canonical GitHub repository ${CANONICAL_REPOSITORY}.`,
    );
  }
}

function maskCharacters(buffer, source, start, end) {
  for (let index = start; index < end; index += 1) {
    if (source[index] !== '\r' && source[index] !== '\n') buffer[index] = ' ';
  }
}

export function maskHiddenMarkdown(markdown) {
  const source = String(markdown);
  const masked = source.split('');
  let offset = 0;
  let fence = null;
  let insideComment = false;

  while (offset < source.length) {
    const lineStart = offset;
    let lineEnd = lineStart;
    while (lineEnd < source.length && source[lineEnd] !== '\r' && source[lineEnd] !== '\n') lineEnd += 1;
    let nextLine = lineEnd;
    if (source[nextLine] === '\r') nextLine += 1;
    if (source[nextLine] === '\n') nextLine += 1;
    const line = source.slice(lineStart, lineEnd);

    if (fence) {
      maskCharacters(masked, source, lineStart, lineEnd);
      const closingFence = new RegExp(
        `^ {0,3}${escapeRegExp(fence.character)}{${fence.length},}[\\t ]*$`,
      );
      if (closingFence.test(line)) fence = null;
      offset = nextLine;
      continue;
    }

    if (!insideComment) {
      const openingFence = /^ {0,3}(`{3,}|~{3,}).*$/.exec(line);
      if (openingFence) {
        fence = { character: openingFence[1][0], length: openingFence[1].length };
        maskCharacters(masked, source, lineStart, lineEnd);
        offset = nextLine;
        continue;
      }
    }

    let cursor = lineStart;
    if (insideComment) {
      const close = source.indexOf('-->', cursor);
      if (close < 0 || close >= lineEnd) {
        maskCharacters(masked, source, cursor, lineEnd);
        offset = nextLine;
        continue;
      }
      maskCharacters(masked, source, cursor, close + 3);
      cursor = close + 3;
      insideComment = false;
    }

    while (cursor < lineEnd) {
      const open = source.indexOf('<!--', cursor);
      if (open < 0 || open >= lineEnd) break;
      const close = source.indexOf('-->', open + 4);
      if (close < 0 || close >= lineEnd) {
        maskCharacters(masked, source, open, lineEnd);
        insideComment = true;
        break;
      }
      maskCharacters(masked, source, open, close + 3);
      cursor = close + 3;
    }
    offset = nextLine;
  }

  return masked.join('');
}

function validateCanonicalStructure(markdown) {
  const lines = String(markdown).split(/\r?\n/).map(line => line.trim());
  const requiredHeadings = [CANONICAL_H1, ...CANONICAL_H2_HEADINGS];
  for (const heading of requiredHeadings) {
    const structuralPrefix = heading.split(' — ')[0];
    const matches = lines.filter(line => line === structuralPrefix || line.startsWith(`${structuralPrefix} `));
    if (matches.length !== 1 || matches[0] !== heading) {
      throw new EvidenceError('invalid', `${heading} must appear exactly once and without an alternate duplicate.`);
    }
  }
  const statusCount = lines.filter(line => /^Status\s*:/i.test(line)).length;
  if (statusCount !== 1) {
    throw new EvidenceError('invalid', 'A global Status: line must appear exactly once.');
  }
}

function validateTopLevelStatus(markdown) {
  const match = /^Status:\s*(.+)$/mi.exec(section(markdown, CANONICAL_H1));
  if (!match) throw new EvidenceError('invalid', 'Missing top-level Status record.');
  const status = normalized(match[1]);
  assertNoGateState(status, 'Top-level Status');
  if (!/^PASS(?:\b|\s|—|-)/i.test(status)) {
    throw new EvidenceError('invalid', 'Top-level Status must begin with PASS when evidence is complete.');
  }
}

function validateCandidate(markdown, cwd, context) {
  const rows = parseTable(markdown, '## Candidate and environment record', ['Field', 'Required value']);
  assertExactKeys(rows, REQUIRED_CANDIDATE_FIELDS, 'Candidate and environment record');
  const record = new Map(rows);
  for (const [field, value] of rows) assertRecorded(value, `Candidate field "${field}"`);

  const candidateCommit = normalized(record.get('Candidate commit SHA')).toLowerCase();
  if (!validFullCommit(candidateCommit)) {
    throw new EvidenceError('invalid', 'Candidate commit SHA must be the full 40-character hexadecimal SHA.');
  }
  const resolvedCandidate = resolveCommit(candidateCommit, cwd);
  if (!resolvedCandidate) {
    throw new EvidenceError('invalid', `Candidate commit ${candidateCommit} does not resolve in this repository.`);
  }
  const commitTimestamp = requireIsoTimestamp(
    gitOutput(cwd, ['show', '-s', '--format=%cI', resolvedCandidate], 'Cannot resolve candidate commit time'),
    'Candidate commit timestamp',
  );
  const candidateBuild = parseBuildIdentity(
    record.get('App version and build number'),
    'App version and build number',
  );
  const testTimestamp = requireIsoTimestamp(
    record.get('Test date/time and timezone'),
    'Test date/time and timezone',
  );
  const releaseRun = parseGithubRunUrl(
    normalized(record.get('GitHub release-gate run URL')),
    'GitHub release-gate run URL',
  );
  assertCanonicalRepository(releaseRun, 'Recorded GitHub release-gate run');
  context.externalUrls.add(releaseRun.url);
  const distribution = normalized(record.get('Distribution source'));
  if (!/^(?:TestFlight|signed release archive)$/i.test(distribution)) {
    throw new EvidenceError('invalid', 'Distribution source must be TestFlight or signed release archive.');
  }
  if (normalized(record.get('RevenueCat entitlement identifier')) !== 'pro') {
    throw new EvidenceError('invalid', 'RevenueCat entitlement identifier must be exactly "pro".');
  }
  const freshAlias = normalized(record.get('Fresh subscription tester alias'));
  const lifetimeAlias = normalized(record.get('Existing Lifetime tester alias'));
  if (!validAlias(freshAlias) || !validAlias(lifetimeAlias)) {
    throw new EvidenceError(
      'invalid',
      'Sandbox tester aliases must be 2-32 non-identifying letters, numbers, underscores, or hyphens.',
    );
  }
  if (freshAlias.toLowerCase() === lifetimeAlias.toLowerCase()) {
    throw new EvidenceError('invalid', 'Fresh and Lifetime sandbox tester aliases must be different.');
  }
  validateEvidenceReference(
    record.get('Evidence folder or release-record link'),
    'Candidate field "Evidence folder or release-record link"',
    context,
  );
  return {
    candidateCommit: resolvedCandidate,
    candidateBuild: candidateBuild.display,
    buildIdentity: candidateBuild,
    releaseRun,
    freshAlias,
    lifetimeAlias,
    testTimestamp,
    commitTimestamp,
  };
}

function validatePreconditions(markdown, context) {
  const rows = parseTable(markdown, '## Preconditions', ['#', 'Precondition', 'Result', 'Evidence / note']);
  assertExactKeys(rows, EXPECTED_PRECONDITIONS, 'Preconditions');
  assertCanonicalText(rows, CANONICAL_PRECONDITIONS, 'Precondition');
  for (const [id, , result, evidence] of rows) {
    assertRecorded(result, `Precondition ${id} Result`);
    if (normalized(result).toUpperCase() !== 'PASS') {
      throw new EvidenceError('incomplete', `Precondition ${id} Result must be PASS.`);
    }
    validateEvidenceReference(evidence, `Precondition ${id} Evidence / note`, context);
  }
  return rows.length;
}

function validateSmokeRows(markdown, context) {
  const rows = parseTable(
    markdown,
    '## Physical-iPhone core smoke',
    ['#', 'Required action and success criterion', 'Result', 'Timestamp', 'Evidence / defect reference'],
  );
  assertExactKeys(rows, EXPECTED_SMOKE_ROWS, 'Physical-iPhone core smoke');
  assertCanonicalText(rows, CANONICAL_SMOKE_REQUIREMENTS, 'Core-smoke row');
  const timestamps = [];
  for (const [id, , result, timestamp, evidence] of rows) {
    assertRecorded(result, `Core-smoke row ${id} Result`);
    if (normalized(result).toUpperCase() !== 'PASS') {
      throw new EvidenceError('incomplete', `Core-smoke row ${id} Result must be PASS.`);
    }
    timestamps.push(requireIsoTimestamp(timestamp, `Core-smoke row ${id} Timestamp`));
    validateEvidenceReference(evidence, `Core-smoke row ${id} Evidence`, context);
  }
  return { count: rows.length, timestamps };
}

function validatePurchaseRows(markdown, candidate, context) {
  const rows = parseTable(
    markdown,
    '## Purchase evidence record',
    ['Flow', 'Tester alias', 'Plan / entitlement', 'Result', 'Timestamp', 'Device evidence', 'RevenueCat / App Store corroboration', 'Notes / issue'],
  );
  assertExactKeys(rows, EXPECTED_PURCHASE_FLOWS, 'Purchase evidence record');
  const timestamps = [];
  for (const [flow, alias, plan, result, timestamp, deviceEvidence, corroboration, notes] of rows) {
    for (const [field, value] of [
      ['Tester alias', alias], ['Plan / entitlement', plan], ['Result', result], ['Notes / issue', notes],
    ]) assertRecorded(value, `${flow} ${field}`);
    if (normalized(result).toUpperCase() !== 'PASS') {
      throw new EvidenceError('incomplete', `${flow} Result must be PASS.`);
    }
    timestamps.push(requireIsoTimestamp(timestamp, `${flow} Timestamp`));
    validateEvidenceReference(deviceEvidence, `${flow} Device evidence`, context);
    validateEvidenceReference(corroboration, `${flow} RevenueCat / App Store corroboration`, context);
    const expectedAlias = flow === 'Legacy restore' ? candidate.lifetimeAlias : candidate.freshAlias;
    if (normalized(alias) !== expectedAlias) {
      throw new EvidenceError('invalid', `${flow} tester alias must match candidate alias "${expectedAlias}".`);
    }
  }
  const plans = new Map(rows.map(row => [row[0], normalized(row[2])]));
  if (plans.get('Live Offering') !== 'Monthly + Annual visible; Lifetime hidden') {
    throw new EvidenceError(
      'invalid',
      'Live Offering plan must be exactly "Monthly + Annual visible; Lifetime hidden".',
    );
  }
  for (const flow of ['Cancel', 'Error + recovery']) {
    if (!/^(?:Monthly|Annual)$/.test(plans.get(flow))) {
      throw new EvidenceError('invalid', `${flow} plan must be exactly Monthly or Annual.`);
    }
  }
  if (!/^(?:Monthly|Annual) (?:to|→) pro$/.test(plans.get('Purchase'))) {
    throw new EvidenceError('invalid', 'Purchase plan must record exactly Monthly or Annual to pro.');
  }
  if (plans.get('Relaunch persistence') !== 'pro') {
    throw new EvidenceError('invalid', 'Relaunch persistence entitlement must be exactly pro.');
  }
  if (!/^Current subscription (?:to|→) pro$/.test(plans.get('Clean-install restore'))) {
    throw new EvidenceError('invalid', 'Clean-install restore must record exactly Current subscription to pro.');
  }
  if (!/^Lifetime (?:to|→) pro$/.test(plans.get('Legacy restore'))) {
    throw new EvidenceError('invalid', 'Legacy restore must record exactly Lifetime to pro.');
  }
  return { count: rows.length, timestamps };
}

function validateAutomatedMatrix(markdown, candidate, context) {
  const rows = parseTable(
    markdown,
    '## Automated phone prerequisite',
    ['Engine', '375x812 normal', '375x812 reduced', '430x932 normal', '430x932 reduced', 'Run URL / timestamp'],
  );
  assertExactKeys(rows, EXPECTED_ENGINES, 'Automated phone prerequisite');
  const timestamps = [];
  let passCells = 0;
  for (const [engine, ...values] of rows) {
    const [normalSmall, reducedSmall, normalLarge, reducedLarge, evidence] = values;
    for (const [label, value] of [
      ['375x812 normal', normalSmall], ['375x812 reduced', reducedSmall],
      ['430x932 normal', normalLarge], ['430x932 reduced', reducedLarge],
    ]) {
      assertRecorded(value, `${engine} ${label}`);
      if (normalized(value).toUpperCase() !== 'PASS') {
        throw new EvidenceError('incomplete', `${engine} ${label} must be PASS.`);
      }
      passCells += 1;
    }
    assertRecorded(evidence, `${engine} Run URL / timestamp`);
    const run = extractGithubRunUrl(evidence, `${engine} Run URL / timestamp`);
    const timestamp = extractIsoTimestamp(evidence, `${engine} Run URL / timestamp`);
    assertSafeHttpsUrl(run.url, `${engine} Run URL / timestamp`);
    context.externalUrls.add(run.url);
    timestamps.push(timestamp);
    if (run.owner.toLowerCase() !== candidate.releaseRun.owner.toLowerCase()
      || run.repo.toLowerCase() !== candidate.releaseRun.repo.toLowerCase()
      || run.runId !== candidate.releaseRun.runId) {
      throw new EvidenceError('invalid', `${engine} automated run URL must match the exact release-gate run.`);
    }
  }
  return { count: passCells, timestamps };
}

function validateFinalHandoff(markdown) {
  const rows = parseTable(markdown, '## Final handoff', ['Summary field', 'Recorded result']);
  assertExactKeys(rows, REQUIRED_SUMMARY_FIELDS, 'Final handoff');
  const summary = new Map(rows);
  for (const [field, value] of rows) assertRecorded(value, `Final handoff "${field}"`);
  if (normalized(summary.get('Exact candidate identity verified')).toUpperCase() !== 'PASS') {
    throw new EvidenceError('incomplete', 'Exact candidate identity verified must be PASS.');
  }
  if (!/^12\s*\/\s*12$/.test(normalized(summary.get('Required core-smoke rows passed')))) {
    throw new EvidenceError('invalid', 'Required core-smoke rows passed must be recorded as 12 / 12.');
  }
  if (!/^7\s*\/\s*7$/.test(normalized(summary.get('Required purchase/restore rows passed')))) {
    throw new EvidenceError('invalid', 'Required purchase/restore rows passed must be recorded as 7 / 7.');
  }
  if (normalized(summary.get('Unresolved launch-blocking defects')) !== '0') {
    throw new EvidenceError('incomplete', 'Unresolved launch-blocking defects must be 0.');
  }
  if (normalized(summary.get('Physical-iPhone gate verdict')).toUpperCase() !== 'PASS') {
    throw new EvidenceError('incomplete', 'Physical-iPhone gate verdict must be PASS.');
  }
  const reviewer = normalized(summary.get('Reviewer and review timestamp'));
  const timestamp = extractIsoTimestamp(reviewer, 'Reviewer and review timestamp');
  if (reviewer.replace(timestamp, '').replace(/[-—,:@]/g, '').trim().length < 2) {
    throw new EvidenceError('invalid', 'Reviewer and review timestamp must include a reviewer plus the timestamp.');
  }
  return { unresolvedBlockers: 0, verdict: 'PASS', reviewerTimestamp: timestamp };
}

function assertNotFuture(timestamp, location, now) {
  if (Date.parse(timestamp) > now + FUTURE_TOLERANCE_MS) {
    throw new EvidenceError('invalid', `${location} is in the future.`);
  }
}

function assertMonotonic(timestamps, label) {
  for (let index = 1; index < timestamps.length; index += 1) {
    if (Date.parse(timestamps[index]) < Date.parse(timestamps[index - 1])) {
      throw new EvidenceError('invalid', `${label} timestamps must be chronological.`);
    }
  }
}

function validateTimeline({ candidate, smoke, purchase, automated, finalHandoff, now }) {
  const commitTime = Date.parse(candidate.commitTimestamp);
  const testStart = Date.parse(candidate.testTimestamp);
  const reviewer = Date.parse(finalHandoff.reviewerTimestamp);
  const observations = [...smoke.timestamps, ...purchase.timestamps];
  for (const [location, timestamps] of [
    ['Candidate test time', [candidate.testTimestamp]],
    ['Candidate commit time', [candidate.commitTimestamp]],
    ['Automated phone prerequisite', automated.timestamps],
    ['Physical-iPhone core smoke', smoke.timestamps],
    ['Purchase evidence', purchase.timestamps],
    ['Reviewer timestamp', [finalHandoff.reviewerTimestamp]],
  ]) {
    for (const timestamp of timestamps) assertNotFuture(timestamp, location, now);
  }
  if (testStart < commitTime) {
    throw new EvidenceError('invalid', 'Physical testing must not start before the candidate commit exists.');
  }
  if (automated.timestamps.some(timestamp => Date.parse(timestamp) < commitTime)) {
    throw new EvidenceError('invalid', 'Automated prerequisite timestamps must not predate the candidate commit.');
  }
  if (automated.timestamps.some(timestamp => Date.parse(timestamp) > testStart)) {
    throw new EvidenceError('invalid', 'Automated prerequisite timestamps must not be after physical testing starts.');
  }
  if (observations.some(timestamp => Date.parse(timestamp) < testStart)) {
    throw new EvidenceError('invalid', 'Physical and purchase observations must not predate the recorded test start.');
  }
  assertMonotonic(smoke.timestamps, 'Core-smoke');
  assertMonotonic(purchase.timestamps, 'Purchase-flow');
  if (reviewer < Math.max(testStart, ...observations.map(Date.parse))) {
    throw new EvidenceError('invalid', 'Reviewer timestamp must not predate any recorded observation.');
  }
}

export function evaluatePhoneEvidence(markdown, {
  cwd = process.cwd(),
  evidenceRoot,
  now = Date.now(),
} = {}) {
  const visibleMarkdown = maskHiddenMarkdown(markdown);
  validateCanonicalStructure(visibleMarkdown);
  assertNoSensitiveData(markdown, 'Completed phone evidence Markdown');
  const context = evidenceContext(evidenceRoot);
  validateTopLevelStatus(visibleMarkdown);
  const candidate = validateCandidate(visibleMarkdown, cwd, context);
  const preconditionsPassed = validatePreconditions(visibleMarkdown, context);
  const smoke = validateSmokeRows(visibleMarkdown, context);
  const purchase = validatePurchaseRows(visibleMarkdown, candidate, context);
  const automated = validateAutomatedMatrix(visibleMarkdown, candidate, context);
  const finalHandoff = validateFinalHandoff(visibleMarkdown);
  validateTimeline({ candidate, smoke, purchase, automated, finalHandoff, now });
  scanReferencedTextFiles(context);
  return {
    ...candidate,
    preconditionsPassed,
    smokeRowsPassed: smoke.count,
    purchaseRowsPassed: purchase.count,
    automatedCellsPassed: automated.count,
    unresolvedBlockers: finalHandoff.unresolvedBlockers,
    verdict: finalHandoff.verdict,
    reviewerTimestamp: finalHandoff.reviewerTimestamp,
    evidenceRoot: context.root,
    referencedFiles: [...context.referencedFiles.entries()].map(([relative, absolute]) => ({ relative, absolute })),
    externalUrls: [...context.externalUrls].sort(),
    automatedTimestamps: automated.timestamps,
  };
}

const CLI_USAGE = '--candidate <full-sha> --build "<version> (<build>)" --file <completed-record> --evidence-root <directory>';

export function parseCliArguments(argv = process.argv) {
  const values = argv.slice(2);
  const options = { candidate: null, build: null, file: null, evidenceRoot: null };
  const flagMap = new Map([
    ['--candidate', 'candidate'], ['--build', 'build'], ['--file', 'file'], ['--evidence-root', 'evidenceRoot'],
  ]);
  const seen = new Set();
  for (let index = 0; index < values.length; index += 1) {
    const flag = values[index];
    if (!flagMap.has(flag)) {
      throw new EvidenceError('invalid', `Unknown argument "${flag}". Usage: ${CLI_USAGE}.`);
    }
    if (seen.has(flag)) throw new EvidenceError('invalid', `Argument "${flag}" may only be provided once.`);
    const value = values[index + 1];
    if (value === undefined || value.startsWith('--') || value.trim() === '') {
      throw new EvidenceError('invalid', `Argument "${flag}" requires a value.`);
    }
    seen.add(flag);
    options[flagMap.get(flag)] = value.trim();
    index += 1;
  }
  for (const [flag, key] of flagMap) {
    if (!options[key]) throw new EvidenceError('invalid', `Missing required ${flag}. Usage: ${CLI_USAGE}.`);
  }
  if (!validFullCommit(options.candidate)) {
    throw new EvidenceError('invalid', '--candidate must be the full 40-character hexadecimal commit SHA.');
  }
  parseBuildIdentity(options.build, '--build');
  return options;
}

export function queryGithubRunWithGh({ owner, repo, runId, cwd = process.cwd() }) {
  const result = spawnSync('gh', ['api', `repos/${owner}/${repo}/actions/runs/${runId}`], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    throw new EvidenceError(
      'invalid',
      `Could not query GitHub release-gate run ${runId}: ${result.stderr.trim() || 'gh api failed'}`,
    );
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new EvidenceError('invalid', `GitHub release-gate run ${runId} returned invalid JSON.`);
  }
}

export function queryGithubWorkflowWithGh({ owner, repo, workflowId, cwd = process.cwd() }) {
  const result = spawnSync('gh', ['api', `repos/${owner}/${repo}/actions/workflows/${workflowId}`], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    throw new EvidenceError(
      'invalid',
      `Could not query GitHub workflow ${workflowId}: ${result.stderr.trim() || 'gh api failed'}`,
    );
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new EvidenceError('invalid', `GitHub workflow ${workflowId} returned invalid JSON.`);
  }
}

function validateGithubRun(run, { candidate, repository, now }) {
  if (!run || typeof run !== 'object') {
    throw new EvidenceError('invalid', 'GitHub release-gate query returned no run record.');
  }
  if (String(run.id) !== candidate.releaseRun.runId) {
    throw new EvidenceError('invalid', 'GitHub API run ID does not match the recorded release-gate URL.');
  }
  if (run.name !== EXPECTED_WORKFLOW_NAME) {
    throw new EvidenceError('invalid', `GitHub run name must be exactly "${EXPECTED_WORKFLOW_NAME}".`);
  }
  if (!Number.isSafeInteger(run.workflow_id) || run.workflow_id <= 0) {
    throw new EvidenceError('invalid', 'GitHub run must identify its canonical workflow_id.');
  }
  if (run.status !== 'completed' || run.conclusion !== 'success') {
    throw new EvidenceError('incomplete', 'GitHub release-gate run must be completed with conclusion success.');
  }
  if (String(run.head_sha).toLowerCase() !== candidate.candidateCommit) {
    throw new EvidenceError('invalid', 'GitHub release-gate run head_sha does not match the exact candidate.');
  }
  const apiRepository = { fullName: String(run.repository?.full_name) };
  assertCanonicalRepository(apiRepository, 'GitHub API repository');
  if (apiRepository.fullName.toLowerCase() !== repository.fullName.toLowerCase()) {
    throw new EvidenceError('invalid', 'GitHub API repository does not match git origin.');
  }
  const apiUrl = parseGithubRunUrl(run.html_url, 'GitHub API html_url');
  assertCanonicalRepository(apiUrl, 'GitHub API html_url repository');
  if (apiUrl.fullName.toLowerCase() !== repository.fullName.toLowerCase()
    || apiUrl.runId !== candidate.releaseRun.runId) {
    throw new EvidenceError('invalid', 'GitHub API html_url does not match the recorded repository and run ID.');
  }
  const completedAt = requireIsoTimestamp(run.updated_at, 'GitHub release-gate updated_at');
  assertNotFuture(completedAt, 'GitHub release-gate updated_at', now);
  if (Date.parse(completedAt) > Date.parse(candidate.testTimestamp)) {
    throw new EvidenceError('invalid', 'GitHub release gate must complete before physical testing starts.');
  }
  if (candidate.automatedTimestamps.some(timestamp => Date.parse(timestamp) !== Date.parse(completedAt))) {
    throw new EvidenceError(
      'invalid',
      'Automated phone prerequisite timestamps must identify the exact GitHub run completion time.',
    );
  }
  return {
    id: candidate.releaseRun.runId,
    name: run.name,
    status: run.status,
    conclusion: run.conclusion,
    headSha: candidate.candidateCommit,
    completedAt,
    url: apiUrl.url,
    workflowId: String(run.workflow_id),
  };
}

function validateGithubWorkflow(workflow, githubRun) {
  if (!workflow || typeof workflow !== 'object') {
    throw new EvidenceError('invalid', 'GitHub workflow query returned no workflow record.');
  }
  if (String(workflow.id) !== githubRun.workflowId) {
    throw new EvidenceError('invalid', 'GitHub workflow ID does not match the release-gate run.');
  }
  if (workflow.name !== EXPECTED_WORKFLOW_NAME || workflow.path !== EXPECTED_WORKFLOW_PATH) {
    throw new EvidenceError(
      'invalid',
      `GitHub run must come from ${EXPECTED_WORKFLOW_PATH} named "${EXPECTED_WORKFLOW_NAME}".`,
    );
  }
  if (workflow.state !== 'active') {
    throw new EvidenceError('invalid', 'Canonical GitHub release workflow must be active.');
  }
  return { ...githubRun, workflowPath: workflow.path };
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function relativeEvidencePath(root, absolute, location) {
  const relative = path.relative(root, absolute);
  if (!isWithin(root, absolute)) {
    throw new EvidenceError('invalid', `${location} must be inside the evidence root.`);
  }
  return relative.split(path.sep).join('/');
}

function buildAttestation({ summary, repository, githubRun, evidencePath, markdown, now }) {
  const files = summary.referencedFiles
    .map(({ relative, absolute }) => {
      const data = fs.readFileSync(absolute);
      return { path: relative, bytes: data.byteLength, sha256: sha256(data) };
    })
    .sort((left, right) => left.path.localeCompare(right.path));
  const record = {
    path: relativeEvidencePath(summary.evidenceRoot, evidencePath, 'Completed evidence record'),
    bytes: Buffer.byteLength(markdown),
    sha256: sha256(markdown),
  };
  const evidenceManifest = {
    record,
    files,
    externalUrls: summary.externalUrls,
  };
  const payload = {
    schemaVersion: 1,
    kind: 'flightglass-v1-physical-iphone-evidence',
    generatedAt: new Date(now).toISOString(),
    repository: repository.fullName,
    candidateCommit: summary.candidateCommit,
    appVersion: summary.buildIdentity.version,
    buildNumber: summary.buildIdentity.buildNumber,
    build: summary.candidateBuild,
    releaseGate: githubRun,
    evidence: evidenceManifest,
    evidenceBundleSha256: sha256(JSON.stringify(evidenceManifest)),
  };
  return { ...payload, attestationSha256: sha256(JSON.stringify(payload)) };
}

export function attestationFileName({ candidateCommit, appVersion, buildNumber }) {
  if (!validFullCommit(candidateCommit)
    || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(appVersion)
    || !/^[1-9]\d*$/.test(buildNumber)) {
    throw new EvidenceError('invalid', 'Cannot derive an attestation filename from an invalid candidate or build.');
  }
  return `${ATTESTATION_PREFIX}-${candidateCommit.toLowerCase()}-v${appVersion}-b${buildNumber}.json`;
}

function writeAttestation(attestation, evidenceRoot) {
  const target = path.join(evidenceRoot, attestationFileName(attestation));
  try {
    fs.writeFileSync(target, `${JSON.stringify(attestation, null, 2)}\n`, {
      encoding: 'utf8', flag: 'wx', mode: 0o600,
    });
  } catch (error) {
    if (error?.code === 'EEXIST') {
      throw new EvidenceError(
        'invalid',
        `Attestation already exists and is immutable for this exact candidate and build: ${target}`,
      );
    }
    throw new EvidenceError('invalid', `Could not write attestation ${target}: ${error.message}`);
  }
  return target;
}

function ensureExternalEvidenceLocation({ cwd, evidencePath, evidenceRoot }) {
  const repositoryRoot = fs.realpathSync(gitOutput(cwd, ['rev-parse', '--show-toplevel'], 'Cannot resolve repository root'));
  const canonical = path.resolve(repositoryRoot, CANONICAL_TEMPLATE);
  if (path.resolve(evidencePath) === canonical) {
    throw new EvidenceError(
      'invalid',
      `The canonical ${CANONICAL_TEMPLATE} template is immutable; validate a completed copy under an ignored evidence root.`,
    );
  }
  if (!isWithin(evidenceRoot, evidencePath)) {
    throw new EvidenceError('invalid', 'The completed evidence record must be inside --evidence-root.');
  }
  if (isWithin(repositoryRoot, evidencePath)) {
    const relative = path.relative(repositoryRoot, evidencePath);
    const ignored = gitResult(repositoryRoot, ['check-ignore', '-q', '--', relative]);
    if (ignored.status !== 0) {
      throw new EvidenceError(
        'invalid',
        'Completed phone evidence must be outside the candidate: use an ignored outputs/release-evidence/phone directory.',
      );
    }
  }
}

export function runCli({
  argv = process.argv,
  cwd = process.cwd(),
  stdout = message => console.log(message),
  stderr = message => console.error(message),
  queryGithubRun = queryGithubRunWithGh,
  queryGithubWorkflow = queryGithubWorkflowWithGh,
  resolveGitOrigin = currentCwd => gitOutput(
    currentCwd,
    ['remote', 'get-url', 'origin'],
    'Cannot resolve git origin',
  ),
  now = Date.now(),
} = {}) {
  try {
    const options = parseCliArguments(argv);
    const expectedCommit = resolveCommit(options.candidate, cwd);
    if (!expectedCommit) {
      throw new EvidenceError('invalid', `Expected candidate ${options.candidate} does not resolve in this repository.`);
    }
    const head = gitOutput(cwd, ['rev-parse', 'HEAD'], 'Cannot resolve HEAD').toLowerCase();
    if (head !== expectedCommit) {
      throw new EvidenceError('invalid', `Checked-out HEAD ${head} does not match candidate ${expectedCommit}.`);
    }
    let packageRecord;
    try {
      packageRecord = JSON.parse(gitOutput(
        cwd,
        ['show', `${expectedCommit}:package.json`],
        'Cannot read candidate package.json',
      ));
    } catch {
      throw new EvidenceError(
        'invalid',
        `Cannot read package version from candidate ${expectedCommit}.`,
      );
    }
    const expectedBuild = parseBuildIdentity(options.build, '--build');
    if (expectedBuild.version !== packageRecord.version) {
      throw new EvidenceError(
        'invalid',
        `--build version ${expectedBuild.version} does not match package.json version ${packageRecord.version}.`,
      );
    }
    const repository = parseGithubOrigin(resolveGitOrigin(cwd));
    assertCanonicalRepository(repository, 'git origin');
    const rootContext = evidenceContext(path.resolve(cwd, options.evidenceRoot));
    const evidenceRoot = rootContext.root;
    const requestedEvidencePath = path.resolve(cwd, options.file);
    let evidencePath;
    let markdown;
    try {
      evidencePath = fs.realpathSync(requestedEvidencePath);
      if (!fs.statSync(evidencePath).isFile()) throw new Error('not a file');
      markdown = fs.readFileSync(evidencePath, 'utf8');
    } catch {
      throw new EvidenceError('invalid', `Evidence file does not exist or is not a file: ${requestedEvidencePath}`);
    }
    ensureExternalEvidenceLocation({ cwd, evidencePath, evidenceRoot });
    const summary = evaluatePhoneEvidence(markdown, { cwd, evidenceRoot, now });
    if (summary.candidateCommit !== expectedCommit) {
      throw new EvidenceError(
        'invalid',
        `Recorded candidate ${summary.candidateCommit} does not match expected candidate ${expectedCommit}.`,
      );
    }
    if (summary.candidateBuild !== expectedBuild.display) {
      throw new EvidenceError(
        'invalid',
        `Recorded build "${summary.candidateBuild}" does not match expected build "${expectedBuild.display}".`,
      );
    }
    if (summary.releaseRun.fullName.toLowerCase() !== repository.fullName.toLowerCase()) {
      throw new EvidenceError('invalid', 'Recorded GitHub run repository does not match git origin.');
    }
    const runRecord = queryGithubRun({
      owner: repository.owner,
      repo: repository.repo,
      runId: summary.releaseRun.runId,
      cwd,
    });
    if (runRecord && typeof runRecord.then === 'function') {
      throw new EvidenceError('invalid', 'queryGithubRun must return a GitHub run record synchronously.');
    }
    const validatedRun = validateGithubRun(runRecord, { candidate: summary, repository, now });
    const workflowRecord = queryGithubWorkflow({
      owner: repository.owner,
      repo: repository.repo,
      workflowId: validatedRun.workflowId,
      cwd,
    });
    if (workflowRecord && typeof workflowRecord.then === 'function') {
      throw new EvidenceError('invalid', 'queryGithubWorkflow must return a GitHub workflow record synchronously.');
    }
    const githubRun = validateGithubWorkflow(workflowRecord, validatedRun);
    const attestation = buildAttestation({
      summary, repository, githubRun, evidencePath, markdown, now,
    });
    const attestationPath = writeAttestation(attestation, evidenceRoot);

    stdout(`Evidence file: ${evidencePath}`);
    stdout(`Candidate: ${summary.candidateBuild} @ ${summary.candidateCommit}`);
    stdout(`Verified release-gate run: ${summary.releaseRun.url}`);
    stdout(`Preconditions: ${summary.preconditionsPassed}/9 PASS`);
    stdout(`Physical-iPhone core smoke: ${summary.smokeRowsPassed}/12 PASS`);
    stdout(`Apple sandbox purchase/restore: ${summary.purchaseRowsPassed}/7 PASS`);
    stdout(`Automated phone matrix: ${summary.automatedCellsPassed}/8 PASS`);
    stdout(`Unresolved launch-blocking defects: ${summary.unresolvedBlockers}`);
    stdout(`Attestation: ${attestationPath}`);
    stdout(`Attestation SHA-256: ${attestation.attestationSha256}`);
    stdout(`Physical-iPhone release-evidence verdict: ${summary.verdict}`);
    return 0;
  } catch (error) {
    if (error instanceof EvidenceError) {
      const label = error.kind === 'sensitive'
        ? 'SENSITIVE DATA'
        : error.kind === 'incomplete' ? 'PENDING' : 'INVALID';
      stderr(`${label}: ${error.message}`);
      return 2;
    }
    throw error;
  }
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFile)) {
  process.exitCode = runCli();
}
