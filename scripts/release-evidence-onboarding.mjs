#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const EXPECTED_IDS = Object.freeze(
  Array.from({ length: 10 }, (_, index) => `P${String(index + 1).padStart(2, '0')}`),
);
const EXPECTED_REPOSITORY = 'Fenral/svingbue';
const EXPECTED_WORKFLOW = 'Flightglass v1 release gate';
const EXPECTED_WORKFLOW_PATH = '.github/workflows/v1-release-gate.yml';
const TEMPLATE_PATH = path.join('docs', 'phase2-onboarding-uat.md');
const CANDIDATE_FIELDS = Object.freeze([
  'Study date(s) and timezone',
  'Candidate commit SHA',
  'GitHub release-gate run URL',
  'App version and build number',
  'Distribution source',
  'Default language / locale',
  'Facilitator',
  'Evidence folder or release-record link',
]);
const SUMMARY_FIELDS = Object.freeze([
  'Valid sessions',
  'Unassisted completions',
  'Sorted qualifying times',
  'Median qualifying time',
  'Most common first hesitation',
  'Most requested next destination',
  'Unresolved launch-blocking defects',
  'Quantitative verdict',
  'Final release-gate verdict',
  'Reviewer and review timestamp',
]);
const CANONICAL_REQUIREMENTS = Object.freeze([
  'exactly 10 eligible first-time participants have valid session records;',
  'at least 8 of 10 reach the product map without help;',
  'the median completion time of those unassisted completions is 90 seconds or less; and',
  'no unresolved launch-blocking defect was observed.',
  'An unassisted completion requires `Map = Y`, `Loft = Y`, `Help = N` and `Truth = PASS` in the result table.',
]);
const ISO_TIMESTAMP_SOURCE = String.raw`\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})`;
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;
const TEXT_EVIDENCE_EXTENSIONS = new Set(['.csv', '.json', '.log', '.md', '.txt']);
const CANONICAL_H1 = 'Phase 2 moderated onboarding release gate';
const REQUIRED_H2_HEADINGS = Object.freeze([
  'Release rule',
  'Candidate record',
  'Session identity and evidence log',
  'Result table',
  'Calculation and verdict',
]);
const MAX_SENSITIVE_DECODE_LAYERS = 4;
const MAX_NESTED_JSON_STRINGS = 4;
const MAX_JSON_DEPTH = 64;
const MAX_JSON_NODES = 10_000;
const MAX_SENSITIVE_SCAN_ITEMS = 10_000;
const SENSITIVE_PATTERNS = Object.freeze([
  { pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, label: 'an email address or Apple account' },
  { pattern: /-----BEGIN [^-]*(?:PRIVATE KEY|CERTIFICATE)-----/i, label: 'key or certificate material' },
  { pattern: /\b(?:appl|goog|amazon|rcb|sk|pk)_[A-Za-z0-9_-]{8,}\b/, label: 'an SDK or API key' },
  { pattern: /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/, label: 'a signed token' },
  { pattern: /\b\d{15,}\b/, label: 'a transaction, order, or account-like identifier' },
  { pattern: /[?&](?:access_?token|api_?key|secret|receipt|transaction|account)=/i, label: 'a sensitive URL query parameter' },
  {
    pattern: /\b(?:apple\s*id|account(?:\s+(?:id|email))?|tester\s+email|receipt(?:\s+(?:id|data))?|transaction(?:\s+id)?|order\s+(?:id|number)|issuer\s+id|key\s+id|customer\s+id|password|private\s+key|api\s+key|sdk\s+key)\s*(?::|=|#|\bis\b)\s*(?!redacted\b|hidden\b|omitted\b|not\s+(?:recorded|exposed)\b|none\b)[^\s|,;]{4,}/i,
    label: 'a sensitive account, receipt, transaction, or key value',
  },
  { pattern: /\b[A-Za-z0-9+/]{80,}={0,2}\b/, label: 'long encoded data that may be a receipt or key' },
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
  return String(value ?? '').replace(/[*_`]/g, '').trim();
}

function normalizedProse(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function isPlaceholder(value) {
  const clean = normalized(value);
  return clean === ''
    || /\b(?:PENDING|TBD|TBC|TODO|UNKNOWN|UNSET|NULL|PLACEHOLDER|CHANGEME|CHANGE-ME)\b/i.test(clean)
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

function decodeHtmlEntities(value) {
  const named = {
    amp: '&',
    apos: "'",
    colon: ':',
    commat: '@',
    equals: '=',
    num: '#',
    percnt: '%',
    period: '.',
    quot: '"',
    sol: '/',
  };
  return value
    .replace(/&#(?:x([0-9a-f]{1,6})|([0-9]{1,7}));?/gi, (entity, hexadecimal, decimal) => {
      const codePoint = Number.parseInt(hexadecimal ?? decimal, hexadecimal ? 16 : 10);
      if (!Number.isInteger(codePoint)
        || codePoint < 1
        || codePoint > 0x10ffff
        || (codePoint >= 0xd800 && codePoint <= 0xdfff)) return entity;
      return String.fromCodePoint(codePoint);
    })
    .replace(/&([a-z]+);/gi, (entity, name) => named[name.toLowerCase()] ?? entity);
}

function decodePercentEncoding(value) {
  return value.replace(/(?:%[0-9a-f]{2})+/gi, (encoded) => {
    try {
      return decodeURIComponent(encoded);
    } catch {
      // Preserve invalid non-ASCII bytes, but still expose ASCII delimiters such
      // as %40 so one malformed byte cannot hide an address from the scanner.
      return encoded.replace(/%([0-9a-f]{2})/gi, (byte, hexadecimal) => {
        const value = Number.parseInt(hexadecimal, 16);
        return value <= 0x7f ? String.fromCharCode(value) : byte;
      });
    }
  });
}

function decodeJsonEscapes(value) {
  let decoded = '';
  for (let index = 0; index < value.length;) {
    if (value[index] !== '\\' || index + 1 >= value.length) {
      decoded += value[index];
      index += 1;
      continue;
    }
    const escape = value[index + 1];
    if (escape === 'u' && /^[0-9a-f]{4}$/i.test(value.slice(index + 2, index + 6))) {
      decoded += String.fromCharCode(Number.parseInt(value.slice(index + 2, index + 6), 16));
      index += 6;
      continue;
    }
    const simple = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
    if (Object.hasOwn(simple, escape)) {
      decoded += simple[escape];
      index += 2;
      continue;
    }
    decoded += value[index];
    index += 1;
  }
  return decoded;
}

function decodeSensitiveLayer(value) {
  return decodeHtmlEntities(decodePercentEncoding(decodeJsonEscapes(value)));
}

function parsedJsonStrings(value, location) {
  const trimmed = value.trim();
  if (!/^[{[\"]/.test(trimmed)) return [];
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return [];
  }
  const strings = [];
  const stack = [{ value: parsed, depth: 0 }];
  let visited = 0;
  while (stack.length) {
    const current = stack.pop();
    visited += 1;
    if (visited > MAX_JSON_NODES) {
      throw new EvidenceError('invalid', `${location} JSON exceeds the safe sensitive-data scan size.`);
    }
    if (typeof current.value === 'string') {
      strings.push(current.value);
      continue;
    }
    if (current.value === null || typeof current.value !== 'object') continue;
    if (current.depth >= MAX_JSON_DEPTH) {
      throw new EvidenceError('invalid', `${location} JSON exceeds the safe sensitive-data scan depth.`);
    }
    if (Array.isArray(current.value)) {
      for (const child of current.value) stack.push({ value: child, depth: current.depth + 1 });
      continue;
    }
    for (const [key, child] of Object.entries(current.value)) {
      strings.push(key);
      stack.push({ value: child, depth: current.depth + 1 });
    }
  }
  return strings;
}

function assertNoSensitiveData(value, location) {
  const queue = [{ value: String(value ?? ''), jsonLayers: 0 }];
  const seen = new Set();
  let scannedItems = 0;
  while (queue.length) {
    const item = queue.shift();
    if (seen.has(item.value)) continue;
    seen.add(item.value);
    scannedItems += 1;
    if (scannedItems > MAX_SENSITIVE_SCAN_ITEMS) {
      throw new EvidenceError('invalid', `${location} exceeds the safe sensitive-data scan size.`);
    }

    let decoded = item.value;
    for (let layer = 0; layer <= MAX_SENSITIVE_DECODE_LAYERS; layer += 1) {
      for (const { pattern, label } of SENSITIVE_PATTERNS) {
        if (pattern.test(decoded)) {
          throw new EvidenceError(
            'sensitive',
            `${location} appears to contain ${label}. Remove it and keep only a non-identifying reference.`,
          );
        }
      }

      const jsonStrings = parsedJsonStrings(decoded, location);
      if (jsonStrings.length) {
        if (item.jsonLayers >= MAX_NESTED_JSON_STRINGS) {
          throw new EvidenceError('invalid', `${location} JSON string nesting exceeds the safe sensitive-data scan depth.`);
        }
        for (const stringValue of jsonStrings) {
          queue.push({ value: stringValue, jsonLayers: item.jsonLayers + 1 });
        }
      }

      const next = decodeSensitiveLayer(decoded);
      if (next === decoded) break;
      if (layer === MAX_SENSITIVE_DECODE_LAYERS) {
        throw new EvidenceError('invalid', `${location} encoding exceeds the safe sensitive-data scan depth.`);
      }
      decoded = next;
    }
  }
}

function maskNonRenderedMarkdown(markdown) {
  const parts = markdown.split(/(\r?\n)/);
  const visible = [];
  let fence = null;
  let htmlComment = false;
  for (let index = 0; index < parts.length; index += 2) {
    const line = parts[index];
    const newline = parts[index + 1] ?? '';
    if (fence) {
      const fenceMatch = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
      if (fenceMatch) {
        const marker = fenceMatch[1];
        if (marker[0] === fence.character
          && marker.length >= fence.length
          && /^[ \t]*$/.test(line.slice(fenceMatch[0].length))) fence = null;
      }
      visible.push(' '.repeat(line.length), newline);
      continue;
    }

    if (!htmlComment) {
      const fenceMatch = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
      if (fenceMatch) {
        const marker = fenceMatch[1];
        const rest = line.slice(fenceMatch[0].length);
        if (marker[0] === '~' || !rest.includes('`')) {
          fence = { character: marker[0], length: marker.length };
          visible.push(' '.repeat(line.length), newline);
          continue;
        }
      }
    }

    let cursor = 0;
    let maskedLine = '';
    while (cursor < line.length) {
      if (htmlComment) {
        const commentEnd = line.indexOf('-->', cursor);
        if (commentEnd < 0) {
          maskedLine += ' '.repeat(line.length - cursor);
          cursor = line.length;
        } else {
          maskedLine += ' '.repeat(commentEnd + 3 - cursor);
          cursor = commentEnd + 3;
          htmlComment = false;
        }
      } else {
        const commentStart = line.indexOf('<!--', cursor);
        if (commentStart < 0) {
          maskedLine += line.slice(cursor);
          cursor = line.length;
        } else {
          maskedLine += line.slice(cursor, commentStart);
          cursor = commentStart;
          htmlComment = true;
        }
      }
    }
    visible.push(maskedLine, newline);
  }
  return visible.join('');
}

function markdownHeadings(markdown) {
  const headings = [];
  for (const line of maskNonRenderedMarkdown(markdown).split(/\r?\n/)) {
    const match = /^(#{1,6})[ \t]+(.+?)[ \t]*$/.exec(line);
    if (!match) continue;
    headings.push({ level: match[1].length, text: match[2].replace(/[ \t]+#+[ \t]*$/, '') });
  }
  return headings;
}

function validateCanonicalDocumentStructure(markdown) {
  const headings = markdownHeadings(markdown);
  const h1 = headings.filter(heading => heading.level === 1);
  if (h1.length !== 1 || h1[0].text !== CANONICAL_H1) {
    throw new EvidenceError('invalid', `Evidence must contain exactly one canonical H1: "# ${CANONICAL_H1}".`);
  }
  for (const required of REQUIRED_H2_HEADINGS) {
    const matches = headings.filter(heading => heading.level === 2
      && new RegExp(`^${escapeRegExp(required)}(?:\\s|$)`).test(heading.text));
    if (matches.length !== 1) {
      throw new EvidenceError('invalid', `Evidence must contain exactly one canonical H2 beginning "## ${required}".`);
    }
  }
}

function section(markdown, headingPrefix) {
  const visible = maskNonRenderedMarkdown(markdown);
  const expression = new RegExp(`^${escapeRegExp(headingPrefix)}(?:\\s|$).*`, 'm');
  const match = expression.exec(visible);
  if (!match) throw new EvidenceError('invalid', `Missing "${headingPrefix}" section.`);
  const start = match.index;
  const remainder = visible.slice(start + match[0].length);
  const nextHeading = /\n##\s/.exec(remainder);
  return visible.slice(start, nextHeading ? start + match[0].length + nextHeading.index : visible.length);
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

function assertExactKeys(rows, expectedKeys, label) {
  const keys = rows.map(row => row[0]);
  const counts = new Map();
  for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
  const missing = expectedKeys.filter(key => !counts.has(key));
  const unexpected = [...counts.keys()].filter(key => !expectedKeys.includes(key));
  const duplicates = [...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key);
  if (rows.length !== expectedKeys.length || missing.length || unexpected.length || duplicates.length) {
    throw new EvidenceError(
      'invalid',
      `${label} must contain every required key exactly once. Missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}; duplicates: ${duplicates.join(', ') || 'none'}.`,
    );
  }
}

function validFullCommit(value) {
  return /^[0-9a-f]{40}$/i.test(value);
}

function parseBuild(value) {
  const match = /^(\d+\.\d+\.\d+)\s+\(([1-9]\d*)\)$/.exec(normalized(value));
  if (!match) return null;
  return { version: match[1], buildNumber: Number(match[2]) };
}

function validIsoTimestamp(value) {
  const pattern = new RegExp(`^(${ISO_TIMESTAMP_SOURCE})$`);
  const match = pattern.exec(value);
  if (!match || Number.isNaN(Date.parse(value))) return false;
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(value);
  const [, year, month, day, hour, minute, second = '00'] = dateParts;
  const parts = [year, month, day, hour, minute, second].map(Number);
  const calendar = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]));
  return calendar.getUTCFullYear() === parts[0]
    && calendar.getUTCMonth() === parts[1] - 1
    && calendar.getUTCDate() === parts[2]
    && calendar.getUTCHours() === parts[3]
    && calendar.getUTCMinutes() === parts[4]
    && calendar.getUTCSeconds() === parts[5];
}

function timestampMs(value, location, now) {
  if (!validIsoTimestamp(value)) {
    throw new EvidenceError('invalid', `${location} must be ISO 8601 and include Z or a UTC offset.`);
  }
  const milliseconds = Date.parse(value);
  if (milliseconds > now.getTime() + FUTURE_TOLERANCE_MS) {
    throw new EvidenceError('invalid', `${location} cannot be in the future.`);
  }
  return milliseconds;
}

function extractTimestamps(value, location, now) {
  const timestamps = [...value.matchAll(new RegExp(ISO_TIMESTAMP_SOURCE, 'g'))].map(match => match[0]);
  if (timestamps.length !== 2) {
    throw new EvidenceError(
      'invalid',
      `${location} must record exactly two ISO 8601 timestamps (study start and end).`,
    );
  }
  const [start, end] = timestamps.map(timestamp => timestampMs(timestamp, location, now));
  if (start > end) throw new EvidenceError('invalid', `${location} ends before it starts.`);
  return { start, end, timestamps };
}

export function resolveCommit(commit, cwd = process.cwd()) {
  if (!validFullCommit(commit)) return null;
  const result = spawnSync('git', ['rev-parse', '--verify', `${commit}^{commit}`], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  if (result.status !== 0) return null;
  const resolved = result.stdout.trim().toLowerCase();
  return validFullCommit(resolved) ? resolved : null;
}

export function candidateCommitExists(commit, cwd = process.cwd()) {
  return resolveCommit(commit, cwd) !== null;
}

function resolveHead(cwd) {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' });
  const head = result.status === 0 ? result.stdout.trim().toLowerCase() : '';
  if (!validFullCommit(head)) {
    throw new EvidenceError('invalid', 'Cannot resolve the repository HEAD commit.');
  }
  return head;
}

function resolveOriginRepository(cwd) {
  const result = spawnSync('git', ['remote', 'get-url', 'origin'], { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new EvidenceError('invalid', 'Cannot resolve the Git origin remote.');
  const remote = result.stdout.trim();
  const match = /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([^/]+)\/([^/]+?)(?:\.git)?\/?$/i.exec(remote);
  if (!match) throw new EvidenceError('invalid', 'Git origin must be a GitHub repository URL.');
  return `${match[1]}/${match[2]}`;
}

export function packageVersionAtCommit(cwd, commit) {
  const result = spawnSync('git', ['show', `${commit}:package.json`], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  if (result.status !== 0) {
    throw new EvidenceError('invalid', `Cannot read package.json from candidate commit ${commit}.`);
  }
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    throw new EvidenceError('invalid', 'Candidate package.json is not valid JSON.');
  }
  if (!/^\d+\.\d+\.\d+$/.test(parsed.version ?? '')) {
    throw new EvidenceError('invalid', 'Candidate package.json must contain a semantic app version.');
  }
  return parsed.version;
}

function parseGithubRunUrl(value, location) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new EvidenceError('invalid', `${location} must be an HTTPS GitHub Actions run URL.`);
  }
  const match = /^\/([^/]+)\/([^/]+)\/actions\/runs\/(\d+)\/?$/.exec(url.pathname);
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' || !match || url.search || url.hash) {
    throw new EvidenceError(
      'invalid',
      `${location} must match https://github.com/<owner>/<repo>/actions/runs/<run-id> with no query or fragment.`,
    );
  }
  return {
    url: url.href.replace(/\/$/, ''),
    owner: match[1],
    repo: match[2],
    fullName: `${match[1]}/${match[2]}`,
    runId: match[3],
  };
}

function validateCanonicalRequirements(markdown) {
  const releaseRule = normalizedProse(section(markdown, '## Release rule'));
  for (const requirement of CANONICAL_REQUIREMENTS) {
    if (!releaseRule.includes(requirement)) {
      throw new EvidenceError(
        'invalid',
        `Release rule must retain the canonical requirement: "${requirement}"`,
      );
    }
  }
}

function validateTopLevelStatus(markdown) {
  const matches = [...maskNonRenderedMarkdown(markdown).matchAll(/^Status:\s*(.+)$/gmi)];
  if (matches.length !== 1) {
    throw new EvidenceError('invalid', 'Evidence must contain exactly one top-level Status record.');
  }
  const status = normalized(matches[0][1]);
  if (/\b(?:PENDING|BLOCKED|FAIL)\b/i.test(status)) {
    throw new EvidenceError('incomplete', 'Top-level Status must be PASS for completed evidence.');
  }
  if (!/^PASS(?:\b|\s|—|-)/i.test(status)) {
    throw new EvidenceError('invalid', 'Top-level Status must begin with PASS.');
  }
}

function safeHttpsLocator(value, location) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const unsafeHost = host === 'localhost'
    || host.endsWith('.local')
    || /^127\./.test(host)
    || /^10\./.test(host)
    || /^192\.168\./.test(host)
    || /^172\.(?:1[6-9]|2\d|3[01])\./.test(host)
    || /^\[?(?:fc|fd|fe80):/i.test(host);
  if (url.protocol !== 'https:'
    || !host.includes('.')
    || unsafeHost
    || url.username
    || url.password
    || url.search
    || url.hash) {
    throw new EvidenceError(
      'invalid',
      `${location} must be a credential-free public HTTPS URL without query parameters or a local evidence path.`,
    );
  }
  return url.href.replace(/\/$/, '');
}

function isWithin(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function markdownArtifactLinks(markdown) {
  const links = [];
  const pattern = /!?\[[^\]]*\]\((?:<([^>]+)>|([^\s)]+))(?:\s+["'][^"']*["'])?\)/g;
  for (const match of markdown.matchAll(pattern)) links.push(match[1] ?? match[2]);
  return links;
}

function validateEvidenceReference(reference, location, evidenceRoot, state, baseDirectory = evidenceRoot) {
  assertComplete(reference, location);
  const remote = safeHttpsLocator(reference, location);
  if (remote) {
    if (/\.attestation(?:\.json)?$|\.sha256$/i.test(new URL(remote).pathname)) {
      throw new EvidenceError('invalid', `${location} cannot reference an attestation or checksum.`);
    }
    const key = `https:${remote.toLowerCase()}`;
    if (!state.artifacts.has(key)) {
      state.artifacts.set(key, { reference: remote, type: 'https', sha256: null });
    }
    return;
  }
  if (reference.startsWith('#')) return;
  if (path.isAbsolute(reference) || reference.includes('\0')) {
    throw new EvidenceError('invalid', `${location} must use a relative path inside --evidence-root.`);
  }
  const candidate = path.resolve(baseDirectory, reference);
  if (!isWithin(evidenceRoot, candidate)) {
    throw new EvidenceError('invalid', `${location} escapes --evidence-root.`);
  }
  let realFile;
  try {
    realFile = fs.realpathSync(candidate);
  } catch {
    throw new EvidenceError('invalid', `${location} does not exist: ${reference}`);
  }
  if (!isWithin(evidenceRoot, realFile) || !fs.statSync(realFile).isFile()) {
    throw new EvidenceError('invalid', `${location} must resolve to a file inside --evidence-root.`);
  }
  if (realFile === state.evidenceFile
    || /\.attestation(?:\.json)?$|\.sha256$/i.test(path.basename(realFile))) {
    throw new EvidenceError('invalid', `${location} cannot reference the evidence record, an attestation, or a checksum.`);
  }
  const key = `file:${realFile.toLowerCase()}`;
  if (state.artifacts.has(key)) return;
  const data = fs.readFileSync(realFile);
  if (data.byteLength > 25 * 1024 * 1024) {
    throw new EvidenceError('invalid', `${location} exceeds the 25 MB evidence-file limit.`);
  }
  const extension = path.extname(realFile).toLowerCase();
  const rootRelative = path.relative(evidenceRoot, realFile).replaceAll('\\', '/');
  state.artifacts.set(key, { reference: rootRelative, type: 'file', sha256: sha256(data) });
  if (TEXT_EVIDENCE_EXTENSIONS.has(extension)) {
    const text = data.toString('utf8');
    assertNoSensitiveData(text, `${location} contents`);
    if (extension === '.md') {
      for (const linked of markdownArtifactLinks(text)) {
        validateEvidenceReference(
          linked,
          `${location} linked artifact "${linked}"`,
          evidenceRoot,
          state,
          path.dirname(realFile),
        );
      }
    }
    if (extension === '.json') {
      let index;
      try {
        index = JSON.parse(text);
      } catch {
        index = null;
      }
      if (index && Object.hasOwn(index, 'artifacts')) {
        if (!Array.isArray(index.artifacts) || index.artifacts.some(item => typeof item !== 'string')) {
          throw new EvidenceError('invalid', `${location} JSON artifacts index must contain only string references.`);
        }
        for (const linked of index.artifacts) {
          validateEvidenceReference(
            linked,
            `${location} linked artifact "${linked}"`,
            evidenceRoot,
            state,
            path.dirname(realFile),
          );
        }
      }
    }
  }
}

function assertEvidenceRootRecord(value, evidenceFile, evidenceRoot) {
  assertComplete(value, 'Candidate field "Evidence folder or release-record link"');
  const remote = safeHttpsLocator(value, 'Evidence folder or release-record link');
  if (remote) return;
  const recordedRoot = path.resolve(path.dirname(evidenceFile), value);
  let realRecordedRoot;
  try {
    realRecordedRoot = fs.realpathSync(recordedRoot);
  } catch {
    throw new EvidenceError('invalid', 'Evidence folder or release-record link does not exist.');
  }
  if (realRecordedRoot !== evidenceRoot) {
    throw new EvidenceError(
      'invalid',
      'Evidence folder or release-record link must resolve to the exact --evidence-root.',
    );
  }
}

export function validateEvidenceMetadata(markdown, {
  cwd = process.cwd(),
  evidenceRoot,
  evidenceFile,
  now = new Date(),
} = {}) {
  assertNoSensitiveData(markdown, 'Evidence Markdown');
  validateCanonicalDocumentStructure(markdown);
  validateTopLevelStatus(markdown);
  validateCanonicalRequirements(markdown);
  if (!evidenceRoot || !evidenceFile) {
    throw new EvidenceError('invalid', 'Evidence validation requires explicit evidenceRoot and evidenceFile paths.');
  }

  const candidateRows = parseTable(markdown, '## Candidate record', ['Field', 'Required value']);
  assertExactKeys(candidateRows, CANDIDATE_FIELDS, 'Candidate record');
  const candidate = new Map(candidateRows);
  for (const [field, value] of candidateRows) assertComplete(value, `Candidate field "${field}"`);

  const candidateCommit = normalized(candidate.get('Candidate commit SHA')).toLowerCase();
  const head = resolveHead(cwd);
  if (!validFullCommit(candidateCommit)) {
    throw new EvidenceError('invalid', 'Candidate commit SHA must be the full 40-character hexadecimal SHA.');
  }
  if (resolveCommit(candidateCommit, cwd) !== head) {
    throw new EvidenceError('invalid', 'Candidate commit SHA must equal the full checked-out HEAD commit.');
  }

  const candidateBuild = normalized(candidate.get('App version and build number'));
  const parsedBuild = parseBuild(candidateBuild);
  const currentPackageVersion = packageVersionAtCommit(cwd, candidateCommit);
  if (!parsedBuild || parsedBuild.version !== currentPackageVersion) {
    throw new EvidenceError(
      'invalid',
      `App version and build number must use package version ${currentPackageVersion} plus a positive numeric build.`,
    );
  }

  const originRepository = resolveOriginRepository(cwd);
  if (originRepository.toLowerCase() !== EXPECTED_REPOSITORY.toLowerCase()) {
    throw new EvidenceError(
      'invalid',
      `Git origin must be exactly ${EXPECTED_REPOSITORY}; found ${originRepository}.`,
    );
  }
  const releaseRun = parseGithubRunUrl(
    normalized(candidate.get('GitHub release-gate run URL')),
    'GitHub release-gate run URL',
  );
  if (releaseRun.fullName.toLowerCase() !== originRepository.toLowerCase()) {
    throw new EvidenceError('invalid', 'GitHub release-gate run URL must belong to the exact origin repository.');
  }

  const studyRange = extractTimestamps(
    candidate.get('Study date(s) and timezone'),
    'Study date(s) and timezone',
    now,
  );
  assertEvidenceRootRecord(candidate.get('Evidence folder or release-record link'), evidenceFile, evidenceRoot);

  const identityRows = parseTable(
    markdown,
    '## Session identity and evidence log',
    ['ID', 'Timestamp (ISO 8601 with offset)', 'Device and OS', 'App version (build)', 'Commit', 'Facilitator', 'Evidence / defect reference'],
  );
  assertExactKeys(identityRows, EXPECTED_IDS, 'Session identity and evidence log');
  const sessions = identityRows.map(([id, timestamp, device, build, commit, facilitator, evidence]) => ({
    id, timestamp, device, build, commit, facilitator, evidence,
  }));
  const seenTimestamps = new Set();
  for (const session of sessions) {
    for (const key of ['timestamp', 'device', 'build', 'commit', 'facilitator', 'evidence']) {
      assertComplete(session[key], `${session.id} ${key}`);
    }
    const time = timestampMs(session.timestamp, `${session.id} timestamp`, now);
    if (time < studyRange.start || time > studyRange.end) {
      throw new EvidenceError('invalid', `${session.id} timestamp must fall inside the recorded study range.`);
    }
    if (seenTimestamps.has(time)) {
      throw new EvidenceError('invalid', 'Every participant session must have a unique timestamp.');
    }
    seenTimestamps.add(time);
    if (session.build !== candidateBuild) {
      throw new EvidenceError('invalid', `${session.id} build does not match the candidate build.`);
    }
    if (normalized(session.commit).toLowerCase() !== candidateCommit) {
      throw new EvidenceError('invalid', `${session.id} commit must be the full candidate HEAD SHA.`);
    }
  }

  return {
    candidateCommit,
    candidateBuild,
    buildNumber: parsedBuild.buildNumber,
    originRepository,
    releaseRun,
    studyRange,
    identityRows: sessions,
  };
}

export function parseEvidence(markdown) {
  const rows = parseTable(
    markdown,
    '## Result table',
    ['ID', 'Map', 'Seconds', 'Loft', 'Help', 'Truth', 'Result', 'First hesitation / comprehension / next destination'],
  );
  assertExactKeys(rows, EXPECTED_IDS, 'Result table');
  return rows.map(([id, map, seconds, loft, help, truth, result, notes]) => ({
    id, map, seconds, loft, help, truth, result, notes,
  }));
}

function expectValue(row, key, allowed) {
  const value = normalized(row[key]).toUpperCase();
  if (!allowed.includes(value)) {
    throw new EvidenceError(
      isPlaceholder(row[key]) ? 'incomplete' : 'invalid',
      `${row.id} ${key} must be ${allowed.join(' or ')}, found "${row[key]}".`,
    );
  }
  return value;
}

function completionSeconds(row, map) {
  if (map === 'Y') {
    if (!/^\d+$/.test(row.seconds) || Number(row.seconds) < 1 || Number(row.seconds) > 180) {
      throw new EvidenceError(
        isPlaceholder(row.seconds) ? 'incomplete' : 'invalid',
        `${row.id} Seconds must be a whole number from 1 through 180 when Map = Y.`,
      );
    }
    return Number(row.seconds);
  }
  if (row.seconds === '180+') return null;
  if (/^\d+$/.test(row.seconds) && Number(row.seconds) >= 1 && Number(row.seconds) <= 180) return null;
  throw new EvidenceError(
    isPlaceholder(row.seconds) ? 'incomplete' : 'invalid',
    `${row.id} Seconds must be 1-180 or 180+ when Map = N.`,
  );
}

export function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function summarizeEvidence(rows) {
  const evaluated = rows.map((row) => {
    const map = expectValue(row, 'map', ['Y', 'N']);
    const loft = expectValue(row, 'loft', ['Y', 'N']);
    const help = expectValue(row, 'help', ['Y', 'N']);
    const truth = expectValue(row, 'truth', ['PASS', 'FAIL']);
    const recordedResult = expectValue(row, 'result', ['PASS', 'FAIL']);
    assertComplete(row.notes, `${row.id} notes`);
    const seconds = completionSeconds(row, map);
    const derivedResult = map === 'Y' && loft === 'Y' && help === 'N' && truth === 'PASS'
      ? 'PASS'
      : 'FAIL';
    if (recordedResult !== derivedResult) {
      throw new EvidenceError(
        'invalid',
        `${row.id} Result is ${recordedResult}, but the recorded fields derive ${derivedResult}.`,
      );
    }
    return { ...row, secondsValue: seconds, derivedResult };
  });
  const qualifyingTimes = evaluated
    .filter(row => row.derivedResult === 'PASS')
    .map(row => row.secondsValue)
    .sort((a, b) => a - b);
  const medianSeconds = median(qualifyingTimes);
  const unassistedCompletions = qualifyingTimes.length;
  return {
    validSessions: evaluated.length,
    unassistedCompletions,
    qualifyingTimes,
    medianSeconds,
    quantitativePass: unassistedCompletions >= 8 && medianSeconds <= 90,
  };
}

function displayMedian(value) {
  if (value === null) return 'not available';
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function validateReleaseSummary(markdown, quantitative, { now = new Date(), lastSessionAt = 0 } = {}) {
  const rows = parseTable(markdown, '## Calculation and verdict', ['Summary field', 'Recorded result']);
  assertExactKeys(rows, SUMMARY_FIELDS, 'Calculation and verdict');
  const summary = new Map(rows.map(([field, value]) => [field, normalized(value)]));
  for (const [field, value] of summary) assertComplete(value, `Summary field "${field}"`);

  const expected = new Map([
    ['Valid sessions', `${quantitative.validSessions} / 10`],
    ['Unassisted completions', `${quantitative.unassistedCompletions} / 10`],
    ['Sorted qualifying times', quantitative.qualifyingTimes.join(', ')],
    ['Median qualifying time', `${displayMedian(quantitative.medianSeconds)} seconds`],
    ['Quantitative verdict', quantitative.quantitativePass ? 'PASS' : 'FAIL'],
  ]);
  for (const [field, expectedValue] of expected) {
    if (summary.get(field).toUpperCase() !== expectedValue.toUpperCase()) {
      throw new EvidenceError(
        'invalid',
        `${field} is "${summary.get(field)}", but participant rows derive "${expectedValue}".`,
      );
    }
  }
  if (summary.get('Unresolved launch-blocking defects') !== '0') {
    throw new EvidenceError('incomplete', 'Unresolved launch-blocking defects must be 0.');
  }
  if (!quantitative.quantitativePass) {
    throw new EvidenceError('incomplete', 'Participant rows must derive a quantitative PASS.');
  }
  if (summary.get('Final release-gate verdict').toUpperCase() !== 'PASS') {
    throw new EvidenceError('incomplete', 'Final release-gate verdict must be PASS.');
  }

  const reviewerValue = summary.get('Reviewer and review timestamp');
  const timestampMatch = reviewerValue.match(new RegExp(ISO_TIMESTAMP_SOURCE));
  if (!timestampMatch) {
    throw new EvidenceError('invalid', 'Reviewer and review timestamp must include reviewer initials/role and an ISO 8601 timestamp.');
  }
  const reviewer = reviewerValue.replace(timestampMatch[0], '').replace(/[—–-]/g, '').trim();
  if (!/^[A-Za-z][A-Za-z0-9 /._-]{1,39}$/.test(reviewer)) {
    throw new EvidenceError('invalid', 'Reviewer and review timestamp must include reviewer initials or role before the timestamp.');
  }
  const reviewerAt = timestampMs(timestampMatch[0], 'Reviewer timestamp', now);
  if (reviewerAt < lastSessionAt) {
    throw new EvidenceError('invalid', 'Reviewer timestamp cannot precede the final participant session.');
  }
  return {
    unresolvedLaunchBlockers: 0,
    quantitativeVerdict: 'PASS',
    finalReleaseVerdict: 'PASS',
    reviewer,
    reviewerAt,
    releaseGatePass: true,
  };
}

function validateGithubRun(githubEvidence, candidate, now) {
  const run = githubEvidence?.run;
  const workflow = githubEvidence?.workflow;
  if (!run || typeof run !== 'object' || !workflow || typeof workflow !== 'object') {
    throw new EvidenceError('invalid', 'GitHub Actions API did not return a release-gate run record.');
  }
  if (run.name !== EXPECTED_WORKFLOW) {
    throw new EvidenceError('invalid', `GitHub run must use workflow "${EXPECTED_WORKFLOW}".`);
  }
  if (run.status !== 'completed' || run.conclusion !== 'success') {
    throw new EvidenceError('incomplete', 'GitHub release-gate run must be completed with conclusion success.');
  }
  if (!Number.isSafeInteger(run.workflow_id)
    || run.workflow_id < 1
    || workflow.id !== run.workflow_id
    || workflow.name !== EXPECTED_WORKFLOW
    || workflow.path !== EXPECTED_WORKFLOW_PATH
    || workflow.state !== 'active') {
    throw new EvidenceError(
      'invalid',
      `GitHub workflow_id must resolve to active workflow path "${EXPECTED_WORKFLOW_PATH}".`,
    );
  }
  if (String(run.head_sha ?? '').toLowerCase() !== candidate.candidateCommit) {
    throw new EvidenceError('invalid', 'GitHub release-gate run head_sha must match the exact candidate HEAD.');
  }
  if (String(run.repository?.full_name ?? '').toLowerCase() !== candidate.originRepository.toLowerCase()) {
    throw new EvidenceError('invalid', 'GitHub release-gate API record must belong to the exact origin repository.');
  }
  const apiUrl = parseGithubRunUrl(run.html_url ?? '', 'GitHub API run html_url');
  if (apiUrl.runId !== candidate.releaseRun.runId
    || apiUrl.fullName.toLowerCase() !== candidate.releaseRun.fullName.toLowerCase()) {
    throw new EvidenceError('invalid', 'GitHub API run record must match the recorded release-gate run URL.');
  }
  const completedAt = timestampMs(run.updated_at ?? '', 'GitHub release-gate completion timestamp', now);
  if (completedAt > candidate.studyRange.start) {
    throw new EvidenceError('invalid', 'GitHub release-gate run must complete before moderated sessions begin.');
  }
  return {
    name: run.name,
    status: run.status,
    conclusion: run.conclusion,
    headSha: candidate.candidateCommit,
    completedAt: run.updated_at,
    workflowId: run.workflow_id,
    workflowPath: workflow.path,
  };
}

function validateEvidenceReferences(metadata, evidenceRoot, evidenceFile) {
  const references = metadata.identityRows.map(row => row.evidence);
  const normalizedReferences = references.map(reference => normalized(reference).toLowerCase());
  if (new Set(normalizedReferences).size !== references.length) {
    throw new EvidenceError('invalid', 'Every participant must have a unique evidence reference.');
  }
  const state = { evidenceFile, artifacts: new Map() };
  for (const row of metadata.identityRows) {
    validateEvidenceReference(
      row.evidence,
      `${row.id} Evidence / defect reference`,
      evidenceRoot,
      state,
    );
  }
  return [...state.artifacts.values()].sort((left, right) => left.reference.localeCompare(right.reference));
}

export function evaluateEvidence(markdown, {
  cwd = process.cwd(),
  evidenceRoot,
  evidenceFile,
  githubRun,
  now = new Date(),
} = {}) {
  const metadata = validateEvidenceMetadata(markdown, { cwd, evidenceRoot, evidenceFile, now });
  const github = validateGithubRun(githubRun, metadata, now);
  const quantitative = summarizeEvidence(parseEvidence(markdown));
  const lastSessionAt = Math.max(...metadata.identityRows.map(row => Date.parse(row.timestamp)));
  const releaseSummary = validateReleaseSummary(markdown, quantitative, { now, lastSessionAt });
  const artifacts = validateEvidenceReferences(metadata, evidenceRoot, evidenceFile);
  return { ...metadata, ...quantitative, ...releaseSummary, github, artifacts };
}

function ghApi(endpoint, cwd) {
  const result = spawnSync('gh', ['api', endpoint], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    const detail = result.stderr.trim() || 'gh api failed';
    throw new EvidenceError('invalid', `Could not verify GitHub release-gate run: ${detail}`);
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new EvidenceError('invalid', 'GitHub Actions API returned invalid JSON.');
  }
}

function fetchGithubRun(releaseRun, cwd) {
  const run = ghApi(
    `repos/${releaseRun.owner}/${releaseRun.repo}/actions/runs/${releaseRun.runId}`,
    cwd,
  );
  if (!Number.isSafeInteger(run.workflow_id) || run.workflow_id < 1) {
    throw new EvidenceError('invalid', 'GitHub Actions run is missing a valid workflow_id.');
  }
  const workflow = ghApi(
    `repos/${releaseRun.owner}/${releaseRun.repo}/actions/workflows/${run.workflow_id}`,
    cwd,
  );
  return { run, workflow };
}

function resolveEvidencePaths(cwd, options) {
  const evidenceRootCandidate = path.resolve(cwd, options.evidenceRoot);
  const evidenceFileCandidate = path.resolve(cwd, options.file);
  let evidenceRoot;
  let evidenceFile;
  try {
    evidenceRoot = fs.realpathSync(evidenceRootCandidate);
  } catch {
    throw new EvidenceError('invalid', `Evidence root does not exist: ${evidenceRootCandidate}`);
  }
  if (!fs.statSync(evidenceRoot).isDirectory()) {
    throw new EvidenceError('invalid', `Evidence root must be a directory: ${evidenceRoot}`);
  }
  try {
    evidenceFile = fs.realpathSync(evidenceFileCandidate);
  } catch {
    throw new EvidenceError('invalid', `Evidence file does not exist: ${evidenceFileCandidate}`);
  }
  if (!fs.statSync(evidenceFile).isFile() || !isWithin(evidenceRoot, evidenceFile)) {
    throw new EvidenceError('invalid', 'Evidence file must be a file inside --evidence-root.');
  }
  const immutableTemplate = path.resolve(cwd, TEMPLATE_PATH);
  if (evidenceFile === immutableTemplate) {
    throw new EvidenceError(
      'invalid',
      'The tracked PENDING template is immutable. Copy it into the evidence root and pass the copied record with --file.',
    );
  }
  return { evidenceRoot, evidenceFile };
}

export function listDirtySourceEntries(cwd = process.cwd()) {
  const result = spawnSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  if (result.status !== 0) {
    throw new EvidenceError('invalid', 'Cannot inspect the candidate source-tree status.');
  }
  return result.stdout.split(/\r?\n/).map(line => line.trimEnd()).filter(Boolean);
}

function assertCleanSourceTree(cwd, sourceTreeStatus) {
  const dirty = sourceTreeStatus(cwd);
  if (!Array.isArray(dirty)) {
    throw new EvidenceError('invalid', 'Source-tree status validator returned an invalid result.');
  }
  if (dirty.length) {
    throw new EvidenceError(
      'invalid',
      `Candidate source tree must be clean; ignored evidence is allowed. Dirty entries: ${dirty.slice(0, 5).join(', ')}${dirty.length > 5 ? ', …' : ''}`,
    );
  }
}

export function validatePendingTemplate(cwd = process.cwd()) {
  const templatePath = path.join(cwd, TEMPLATE_PATH);
  let markdown;
  try {
    markdown = fs.readFileSync(templatePath, 'utf8');
  } catch {
    throw new EvidenceError('invalid', `Cannot read immutable onboarding template: ${templatePath}`);
  }
  const expectedStatus = 'Status: **PENDING — no moderated participant results are recorded**';
  if (!markdown.split(/\r?\n/).includes(expectedStatus)) {
    throw new EvidenceError('invalid', 'Immutable onboarding template Status must remain the canonical PENDING value.');
  }
  validateCanonicalRequirements(markdown);
  const tables = [
    {
      heading: '## Candidate record',
      headers: ['Field', 'Required value'],
      keys: CANDIDATE_FIELDS,
    },
    {
      heading: '## Session identity and evidence log',
      headers: ['ID', 'Timestamp (ISO 8601 with offset)', 'Device and OS', 'App version (build)', 'Commit', 'Facilitator', 'Evidence / defect reference'],
      keys: EXPECTED_IDS,
    },
    {
      heading: '## Result table',
      headers: ['ID', 'Map', 'Seconds', 'Loft', 'Help', 'Truth', 'Result', 'First hesitation / comprehension / next destination'],
      keys: EXPECTED_IDS,
    },
    {
      heading: '## Calculation and verdict',
      headers: ['Summary field', 'Recorded result'],
      keys: SUMMARY_FIELDS,
    },
  ];
  for (const table of tables) {
    const rows = parseTable(markdown, table.heading, table.headers);
    assertExactKeys(rows, table.keys, `${table.heading} immutable template`);
    for (const [key, ...values] of rows) {
      for (const value of values) {
        if (!/\bPENDING\b/i.test(normalized(value))) {
          throw new EvidenceError(
            'invalid',
            `${table.heading} immutable template cell ${key} must remain PENDING.`,
          );
        }
      }
    }
  }
  return true;
}

function writeAttestation({ cwd, outputRoot, evidenceFile, summary, now }) {
  const directory = path.resolve(outputRoot ?? path.join(cwd, 'outputs'), 'release-evidence', 'onboarding');
  fs.mkdirSync(directory, { recursive: true });
  const recordData = fs.readFileSync(evidenceFile);
  const buildSlug = summary.candidateBuild.replace(/[^A-Za-z0-9.-]+/g, '-').replace(/-+$/g, '');
  const baseName = `onboarding-${summary.candidateCommit}-${buildSlug}.attestation`;
  const jsonPath = path.join(directory, `${baseName}.json`);
  const checksumPath = path.join(directory, `${baseName}.sha256`);
  const attestation = {
    schema: 'flightglass.onboarding-evidence-attestation.v1',
    generatedAt: now.toISOString(),
    algorithm: 'SHA-256',
    candidate: {
      repository: summary.originRepository,
      commit: summary.candidateCommit,
      build: summary.candidateBuild,
    },
    releaseGate: {
      url: summary.releaseRun.url,
      workflow: summary.github.name,
      workflowId: summary.github.workflowId,
      workflowPath: summary.github.workflowPath,
      status: summary.github.status,
      conclusion: summary.github.conclusion,
      completedAt: summary.github.completedAt,
    },
    evidenceRecord: {
      path: path.relative(cwd, evidenceFile).replaceAll('\\', '/'),
      sha256: sha256(recordData),
    },
    artifacts: summary.artifacts,
    result: {
      validSessions: summary.validSessions,
      unassistedCompletions: summary.unassistedCompletions,
      medianSeconds: summary.medianSeconds,
      unresolvedLaunchBlockers: summary.unresolvedLaunchBlockers,
      verdict: summary.finalReleaseVerdict,
      reviewer: summary.reviewer,
    },
  };
  const json = `${JSON.stringify(attestation, null, 2)}\n`;
  fs.writeFileSync(jsonPath, json, { encoding: 'utf8', flag: 'wx' });
  const checksum = sha256(Buffer.from(json));
  fs.writeFileSync(checksumPath, `${checksum}  ${path.basename(jsonPath)}\n`, { encoding: 'utf8', flag: 'wx' });
  return { jsonPath, checksumPath, checksum };
}

export function parseCliArguments(argv = process.argv) {
  const values = argv.slice(2);
  const options = { candidate: null, build: null, file: null, evidenceRoot: null };
  const allowed = ['--candidate', '--build', '--file', '--evidence-root'];
  const seen = new Set();
  for (let index = 0; index < values.length; index += 1) {
    const flag = values[index];
    if (!allowed.includes(flag)) {
      throw new EvidenceError(
        'invalid',
        `Unknown argument "${flag}". Usage: --candidate <full-sha> --build <version/build> --file <copy.md> --evidence-root <directory>.`,
      );
    }
    if (seen.has(flag)) throw new EvidenceError('invalid', `Argument "${flag}" may only be provided once.`);
    const value = values[index + 1];
    if (value === undefined || value.startsWith('--') || value.trim() === '') {
      throw new EvidenceError('invalid', `Argument "${flag}" requires a value.`);
    }
    seen.add(flag);
    options[flag === '--evidence-root' ? 'evidenceRoot' : flag.slice(2)] = value.trim();
    index += 1;
  }
  for (const [key, flag] of [
    ['candidate', '--candidate'],
    ['build', '--build'],
    ['file', '--file'],
    ['evidenceRoot', '--evidence-root'],
  ]) {
    if (!options[key]) throw new EvidenceError('invalid', `Missing required ${flag}.`);
  }
  if (!validFullCommit(options.candidate)) {
    throw new EvidenceError('invalid', '--candidate must be the full 40-character hexadecimal HEAD SHA.');
  }
  if (!parseBuild(options.build)) {
    throw new EvidenceError('invalid', '--build must contain a semantic version and positive numeric build, for example "1.0.0 (42)".');
  }
  return options;
}

export function runCli({
  argv = process.argv,
  cwd = process.cwd(),
  stdout = message => console.log(message),
  stderr = message => console.error(message),
  githubRunLookup = fetchGithubRun,
  sourceTreeStatus = listDirtySourceEntries,
  now = new Date(),
  outputRoot,
} = {}) {
  try {
    const options = parseCliArguments(argv);
    validatePendingTemplate(cwd);
    assertCleanSourceTree(cwd, sourceTreeStatus);
    const head = resolveHead(cwd);
    if (options.candidate.toLowerCase() !== head) {
      throw new EvidenceError('invalid', `--candidate must equal the full checked-out HEAD SHA ${head}.`);
    }
    const build = parseBuild(options.build);
    const currentVersion = packageVersionAtCommit(cwd, head);
    if (build.version !== currentVersion) {
      throw new EvidenceError('invalid', `--build must use package version ${currentVersion}.`);
    }
    const { evidenceRoot, evidenceFile } = resolveEvidencePaths(cwd, options);
    const markdown = fs.readFileSync(evidenceFile, 'utf8');
    const metadata = validateEvidenceMetadata(markdown, { cwd, evidenceRoot, evidenceFile, now });
    if (metadata.candidateCommit !== head) {
      throw new EvidenceError('invalid', 'Recorded candidate does not match --candidate and HEAD.');
    }
    if (metadata.candidateBuild !== normalized(options.build)) {
      throw new EvidenceError('invalid', `Recorded build "${metadata.candidateBuild}" does not match --build "${options.build}".`);
    }
    const githubRun = githubRunLookup(metadata.releaseRun, cwd);
    const summary = evaluateEvidence(markdown, {
      cwd, evidenceRoot, evidenceFile, githubRun, now,
    });
    const attestation = writeAttestation({ cwd, outputRoot, evidenceFile, summary, now });

    stdout(`Evidence file: ${evidenceFile}`);
    stdout(`Candidate: ${summary.candidateBuild} @ ${summary.candidateCommit}`);
    stdout(`Verified workflow: ${summary.github.name} (${summary.github.conclusion})`);
    stdout(`Valid sessions: ${summary.validSessions}/10`);
    stdout(`Unassisted completions: ${summary.unassistedCompletions}/10`);
    stdout(`Median qualifying time: ${displayMedian(summary.medianSeconds)} seconds`);
    stdout(`Onboarding release-evidence verdict: ${summary.finalReleaseVerdict}`);
    stdout(`SHA-256 attestation: ${attestation.jsonPath}`);
    stdout(`Attestation checksum: ${attestation.checksum}`);
    return 0;
  } catch (error) {
    if (error instanceof EvidenceError) {
      const label = error.kind === 'sensitive'
        ? 'SENSITIVE DATA'
        : error.kind === 'incomplete' ? 'PENDING' : 'INVALID';
      stderr(`${label}: ${error.message}`);
      return 2;
    }
    if (error?.code === 'EEXIST') {
      stderr('INVALID: Attestation already exists for this candidate/build. Preserve it or remove it only when intentionally restarting the evidence run.');
      return 2;
    }
    throw error;
  }
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFile)) {
  process.exitCode = runCli();
}
