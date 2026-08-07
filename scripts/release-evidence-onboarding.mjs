#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const EXPECTED_IDS = Object.freeze(
  Array.from({ length: 10 }, (_, index) => `P${String(index + 1).padStart(2, '0')}`),
);

export class EvidenceError extends Error {
  constructor(kind, message) {
    super(message);
    this.name = 'EvidenceError';
    this.kind = kind;
  }
}

function tableSection(markdown) {
  return section(markdown, '## Result table');
}

function section(markdown, heading) {
  const start = markdown.indexOf(heading);
  if (start < 0) {
    throw new EvidenceError('invalid', `Missing "${heading}" section.`);
  }

  const nextHeading = markdown.indexOf('\n## ', start + 4);
  return markdown.slice(start, nextHeading < 0 ? markdown.length : nextHeading);
}

function cells(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(value => value.trim());
}

function isPlaceholder(value) {
  const normalized = value.trim();
  return normalized === ''
    || /\b(?:PENDING|TBD|TBC|TODO|UNKNOWN|UNSET|NULL)\b/i.test(normalized)
    || /(?:^|[\s(])N\/A(?=$|[\s),:;-])/i.test(normalized)
    || /^-+$/.test(normalized);
}

function assertParticipantIds(rows, label) {
  const ids = rows.map(row => row.id);
  const uniqueIds = new Set(ids);
  const missing = EXPECTED_IDS.filter(id => !uniqueIds.has(id));
  const unexpected = [...uniqueIds].filter(id => !EXPECTED_IDS.includes(id));

  if (rows.length !== 10 || uniqueIds.size !== rows.length || missing.length || unexpected.length) {
    throw new EvidenceError(
      'invalid',
      `${label} must contain P01-P10 exactly once. Missing: ${missing.join(', ') || 'none'}; unexpected/duplicate rows: ${unexpected.join(', ') || (uniqueIds.size !== rows.length ? 'present' : 'none')}.`,
    );
  }
}

function validCommit(value) {
  return /^[0-9a-f]{7,40}$/i.test(value);
}

function validIsoTimestamp(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match || Number.isNaN(Date.parse(value))) return false;

  const [, year, month, day, hour, minute, second = '00'] = match;
  const parts = [year, month, day, hour, minute, second].map(Number);
  const calendar = new Date(Date.UTC(
    parts[0],
    parts[1] - 1,
    parts[2],
    parts[3],
    parts[4],
    parts[5],
  ));
  return calendar.getUTCFullYear() === parts[0]
    && calendar.getUTCMonth() === parts[1] - 1
    && calendar.getUTCDate() === parts[2]
    && calendar.getUTCHours() === parts[3]
    && calendar.getUTCMinutes() === parts[4]
    && calendar.getUTCSeconds() === parts[5];
}

export function candidateCommitExists(commit, cwd = process.cwd()) {
  return resolveCommit(commit, cwd) !== null;
}

export function resolveCommit(commit, cwd = process.cwd()) {
  if (!validCommit(commit)) return null;
  const result = spawnSync('git', ['rev-parse', '--verify', `${commit}^{commit}`], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  if (result.status !== 0) return null;
  const resolved = result.stdout.trim().toLowerCase();
  return /^[0-9a-f]{40}$/.test(resolved) ? resolved : null;
}

export function validateEvidenceMetadata(markdown, cwd = process.cwd()) {
  const candidateRows = section(markdown, '## Candidate record')
    .split(/\r?\n/)
    .filter(line => /^\|/.test(line))
    .map(cells)
    .filter(values => values.length === 2 && values[0] !== 'Field' && !/^[-:]+$/.test(values[0]));
  const candidate = new Map(candidateRows);
  const requiredCandidateFields = [
    'Study date(s) and timezone',
    'Candidate commit SHA',
    'App version and build number',
    'Distribution source',
    'Default language / locale',
    'Facilitator',
    'Evidence folder or release-record link',
  ];

  for (const field of requiredCandidateFields) {
    const value = candidate.get(field);
    if (value === undefined) {
      throw new EvidenceError('invalid', `Candidate record is missing "${field}".`);
    }
    if (isPlaceholder(value)) {
      throw new EvidenceError('incomplete', `Candidate record field "${field}" is still pending.`);
    }
  }

  const candidateCommit = candidate.get('Candidate commit SHA');
  const candidateBuild = candidate.get('App version and build number');
  if (!validCommit(candidateCommit)) {
    throw new EvidenceError('invalid', 'Candidate commit SHA must be 7-40 hexadecimal characters.');
  }
  const resolvedCandidateCommit = resolveCommit(candidateCommit, cwd);
  if (!resolvedCandidateCommit) {
    throw new EvidenceError(
      'invalid',
      `Candidate commit ${candidateCommit} does not resolve to a commit in this repository.`,
    );
  }

  const identityRows = section(markdown, '## Session identity and evidence log')
    .split(/\r?\n/)
    .filter(line => /^\|\s*P\d{2}\s*\|/.test(line))
    .map((line) => {
      const values = cells(line);
      if (values.length !== 7) {
        throw new EvidenceError(
          'invalid',
          `Expected 7 columns in ${values[0] || 'identity row'}, found ${values.length}.`,
        );
      }
      const [id, timestamp, device, build, commit, facilitator, evidence] = values;
      return { id, timestamp, device, build, commit, facilitator, evidence };
    });

  assertParticipantIds(identityRows, 'Session identity table');
  for (const row of identityRows) {
    for (const key of ['timestamp', 'device', 'build', 'commit', 'facilitator', 'evidence']) {
      if (isPlaceholder(row[key])) {
        throw new EvidenceError('incomplete', `${row.id} ${key} is still pending.`);
      }
    }
    if (!validIsoTimestamp(row.timestamp)) {
      throw new EvidenceError(
        'invalid',
        `${row.id} timestamp must be ISO 8601 and include Z or a UTC offset.`,
      );
    }
    if (!validCommit(row.commit)) {
      throw new EvidenceError('invalid', `${row.id} commit must be a 7-40 character SHA.`);
    }
    const resolvedParticipantCommit = resolveCommit(row.commit, cwd);
    if (!resolvedParticipantCommit || resolvedParticipantCommit !== resolvedCandidateCommit) {
      throw new EvidenceError(
        'invalid',
        `${row.id} commit does not resolve to the candidate commit.`,
      );
    }
    if (row.build !== candidateBuild) {
      throw new EvidenceError('invalid', `${row.id} build does not match the candidate build.`);
    }
  }

  return {
    candidateCommit,
    candidateBuild,
    identityRows,
  };
}

export function parseEvidence(markdown) {
  const rows = tableSection(markdown)
    .split(/\r?\n/)
    .filter(line => /^\|\s*P\d{2}\s*\|/.test(line))
    .map((line) => {
      const values = cells(line);
      if (values.length !== 8) {
        throw new EvidenceError(
          'invalid',
          `Expected 8 columns in ${values[0] || 'participant row'}, found ${values.length}.`,
        );
      }

      const [id, map, seconds, loft, help, truth, result, notes] = values;
      return { id, map, seconds, loft, help, truth, result, notes };
    });

  assertParticipantIds(rows, 'Result table');

  return rows.sort((a, b) => a.id.localeCompare(b.id));
}

function expectValue(row, key, allowed) {
  const value = row[key].toUpperCase();
  if (!allowed.includes(value)) {
    throw new EvidenceError(
      value === 'PENDING' || value === '' ? 'incomplete' : 'invalid',
      `${row.id} ${key} must be ${allowed.join(' or ')}, found "${row[key]}".`,
    );
  }
  return value;
}

function completionSeconds(row, map) {
  if (map === 'Y') {
    if (!/^\d+$/.test(row.seconds) || Number(row.seconds) <= 0) {
      throw new EvidenceError(
        row.seconds.toUpperCase() === 'PENDING' || row.seconds === '' ? 'incomplete' : 'invalid',
        `${row.id} Seconds must be a positive integer when Map = Y.`,
      );
    }
    return Number(row.seconds);
  }

  if (row.seconds === '180+') return null;
  if (/^\d+$/.test(row.seconds) && Number(row.seconds) > 0) return null;
  throw new EvidenceError(
    row.seconds.toUpperCase() === 'PENDING' || row.seconds === '' ? 'incomplete' : 'invalid',
    `${row.id} Seconds must be elapsed whole seconds or 180+ when Map = N.`,
  );
}

export function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function summarizeEvidence(rows) {
  const evaluated = rows.map((row) => {
    const map = expectValue(row, 'map', ['Y', 'N']);
    const loft = expectValue(row, 'loft', ['Y', 'N']);
    const help = expectValue(row, 'help', ['Y', 'N']);
    const truth = expectValue(row, 'truth', ['PASS', 'FAIL']);
    const recordedResult = expectValue(row, 'result', ['PASS', 'FAIL']);
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
  const quantitativePass = unassistedCompletions >= 8 && medianSeconds <= 90;

  return {
    validSessions: evaluated.length,
    unassistedCompletions,
    qualifyingTimes,
    medianSeconds,
    quantitativePass,
  };
}

function normalizedRecordedValue(value) {
  return value.replace(/[*_`]/g, '').trim();
}

export function validateReleaseSummary(markdown, quantitativePass) {
  const rows = section(markdown, '## Calculation and verdict')
    .split(/\r?\n/)
    .filter(line => /^\|/.test(line))
    .map(cells)
    .filter(values => values.length === 2
      && values[0] !== 'Summary field'
      && !/^[-:]+$/.test(values[0]));
  const summary = new Map();
  for (const [field, value] of rows) {
    if (summary.has(field)) {
      throw new EvidenceError('invalid', `Summary field "${field}" is duplicated.`);
    }
    summary.set(field, value);
  }

  const requiredFields = [
    'Unresolved launch-blocking defects',
    'Quantitative verdict',
    'Final release-gate verdict',
  ];
  for (const field of requiredFields) {
    const value = summary.get(field);
    if (value === undefined) {
      throw new EvidenceError('invalid', `Summary is missing "${field}".`);
    }
    if (isPlaceholder(value)) {
      throw new EvidenceError('incomplete', `Summary field "${field}" is still pending.`);
    }
  }

  const blockersValue = normalizedRecordedValue(summary.get('Unresolved launch-blocking defects'));
  if (!/^\d+$/.test(blockersValue)) {
    throw new EvidenceError(
      'invalid',
      'Unresolved launch-blocking defects must be recorded as a non-negative integer.',
    );
  }
  const unresolvedLaunchBlockers = Number(blockersValue);

  const quantitativeVerdict = normalizedRecordedValue(summary.get('Quantitative verdict')).toUpperCase();
  if (!['PASS', 'FAIL'].includes(quantitativeVerdict)) {
    throw new EvidenceError('invalid', 'Quantitative verdict must be PASS or FAIL.');
  }
  const derivedQuantitativeVerdict = quantitativePass ? 'PASS' : 'FAIL';
  if (quantitativeVerdict !== derivedQuantitativeVerdict) {
    throw new EvidenceError(
      'invalid',
      `Quantitative verdict is ${quantitativeVerdict}, but the participant rows derive ${derivedQuantitativeVerdict}.`,
    );
  }

  const finalReleaseVerdict = normalizedRecordedValue(summary.get('Final release-gate verdict')).toUpperCase();
  if (!['PASS', 'FAIL'].includes(finalReleaseVerdict)) {
    throw new EvidenceError('invalid', 'Final release-gate verdict must be PASS or FAIL.');
  }
  if (finalReleaseVerdict === 'PASS'
    && (!quantitativePass || unresolvedLaunchBlockers !== 0)) {
    throw new EvidenceError(
      'invalid',
      'Final release-gate verdict cannot be PASS unless the quantitative gate passes and unresolved launch-blocking defects is 0.',
    );
  }

  return {
    unresolvedLaunchBlockers,
    quantitativeVerdict,
    finalReleaseVerdict,
    releaseGatePass: quantitativePass
      && unresolvedLaunchBlockers === 0
      && finalReleaseVerdict === 'PASS',
  };
}

export function evaluateEvidence(markdown, cwd = process.cwd()) {
  const metadata = validateEvidenceMetadata(markdown, cwd);
  const quantitative = summarizeEvidence(parseEvidence(markdown));
  return {
    ...metadata,
    ...quantitative,
    ...validateReleaseSummary(markdown, quantitative.quantitativePass),
  };
}

function displayMedian(value) {
  if (value === null) return 'not available';
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function runCli({
  argv = process.argv,
  cwd = process.cwd(),
  stdout = message => console.log(message),
  stderr = message => console.error(message),
} = {}) {
  try {
    const options = parseCliArguments(argv);
    const evidencePath = path.resolve(cwd, options.file);
    const expectedCommit = resolveCommit(options.candidate, cwd);
    if (!expectedCommit) {
      throw new EvidenceError(
        'invalid',
        `Expected candidate ${options.candidate} does not resolve to a commit in this repository.`,
      );
    }

    const markdown = fs.readFileSync(evidencePath, 'utf8');
    const summary = evaluateEvidence(markdown, cwd);
    const recordedCommit = resolveCommit(summary.candidateCommit, cwd);
    if (!recordedCommit) {
      throw new EvidenceError(
        'invalid',
        `Candidate commit ${summary.candidateCommit} does not exist in this repository.`,
      );
    }
    if (recordedCommit !== expectedCommit) {
      throw new EvidenceError(
        'invalid',
        `Recorded candidate ${summary.candidateCommit} does not match expected candidate ${options.candidate}.`,
      );
    }
    if (summary.candidateBuild !== options.build) {
      throw new EvidenceError(
        'invalid',
        `Recorded build "${summary.candidateBuild}" does not match expected build "${options.build}".`,
      );
    }
    const quantitativeVerdict = summary.quantitativePass ? 'PASS' : 'FAIL';
    const releaseVerdict = summary.releaseGatePass ? 'PASS' : 'FAIL';

    stdout(`Evidence file: ${evidencePath}`);
    stdout(`Expected candidate: ${options.build} @ ${expectedCommit}`);
    stdout(`Recorded candidate: ${summary.candidateBuild} @ ${recordedCommit}`);
    stdout(`Valid sessions: ${summary.validSessions}/10`);
    stdout(`Unassisted completions: ${summary.unassistedCompletions}/10`);
    stdout(`Sorted qualifying times: ${summary.qualifyingTimes.join(', ') || 'none'}`);
    stdout(`Median qualifying time: ${displayMedian(summary.medianSeconds)} seconds`);
    stdout(`Quantitative verdict: ${quantitativeVerdict}`);
    stdout(`Unresolved launch-blocking defects: ${summary.unresolvedLaunchBlockers}`);
    stdout(`Recorded final release-gate verdict: ${summary.finalReleaseVerdict}`);
    stdout(`Onboarding release-evidence verdict: ${releaseVerdict}`);

    return summary.releaseGatePass ? 0 : 1;
  } catch (error) {
    if (error instanceof EvidenceError) {
      const label = error.kind === 'incomplete' ? 'PENDING' : 'INVALID';
      stderr(`${label}: ${error.message}`);
      return 2;
    }
    throw error;
  }
}

export function parseCliArguments(argv = process.argv) {
  const values = argv.slice(2);
  const options = {
    candidate: null,
    build: null,
    file: 'docs/phase2-onboarding-uat.md',
  };
  const seen = new Set();

  for (let index = 0; index < values.length; index += 1) {
    const flag = values[index];
    if (!['--candidate', '--build', '--file'].includes(flag)) {
      throw new EvidenceError(
        'invalid',
        `Unknown argument "${flag}". Usage: --candidate <sha> --build <version/build> [--file <path>].`,
      );
    }
    if (seen.has(flag)) {
      throw new EvidenceError('invalid', `Argument "${flag}" may only be provided once.`);
    }
    const value = values[index + 1];
    if (value === undefined || value.startsWith('--') || value.trim() === '') {
      throw new EvidenceError('invalid', `Argument "${flag}" requires a value.`);
    }
    seen.add(flag);
    options[flag.slice(2)] = value.trim();
    index += 1;
  }

  for (const flag of ['candidate', 'build']) {
    if (!options[flag]) {
      throw new EvidenceError(
        'invalid',
        `Missing required --${flag}. Usage: --candidate <sha> --build <version/build> [--file <path>].`,
      );
    }
  }
  if (!validCommit(options.candidate)) {
    throw new EvidenceError('invalid', '--candidate must be a 7-40 character hexadecimal commit SHA.');
  }

  return options;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFile)) {
  process.exitCode = runCli();
}
