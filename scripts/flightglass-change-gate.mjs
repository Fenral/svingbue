#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import {
  buildCommandPlan,
  classifyChanges,
  containsPotentialSecret,
  inspectTextIntegrity,
  resolveRequestedLevel
} from './lib/flightglass-change-gate.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROTECTED_IDENTIFIERS = Object.freeze([
  ['capacitor.config.ts', "appId: 'no.strikearc.app'"],
  ['sa-iap.js', "monthly: 'strikearc_pro_monthly'"],
  ['sa-iap.js', "annual: 'strikearc_pro_annual'"],
  ['sa-iap.js', "lifetime: 'strikearc_pro_lifetime'"],
  ['academy.html', "const STORE_KEY = 'strikearc.academy.v1'"],
  ['academy.html', "const NUDGE_KEY = 'strikearc.academy.nudge'"],
  ['codemagic.yaml', 'APP_STORE_APPLE_ID: 6768449250']
]);

function parseArgs(argv) {
  const options = {
    base: '',
    requestedLevel: '',
    allowDowngrade: false,
    reason: '',
    dryRun: false,
    json: false,
    report: true,
    files: []
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--base') options.base = argv[++index];
    else if (arg.startsWith('--base=')) options.base = arg.slice('--base='.length);
    else if (arg === '--level') options.requestedLevel = argv[++index];
    else if (arg.startsWith('--level=')) options.requestedLevel = arg.slice('--level='.length);
    else if (arg === '--allow-downgrade') options.allowDowngrade = true;
    else if (arg === '--reason') options.reason = argv[++index];
    else if (arg.startsWith('--reason=')) options.reason = arg.slice('--reason='.length);
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--no-report') options.report = false;
    else if (arg === '--file') options.files.push(argv[++index]);
    else if (arg.startsWith('--file=')) options.files.push(arg.slice('--file='.length));
    else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log(`Flightglass risk-based change gate

Usage:
  npm run verify:change -- [options]

Options:
  --base <ref>             Git base for committed changes
  --file <path>            Classify explicit planned file; repeatable
  --level A|B|C            Promote, or request a documented downgrade
  --allow-downgrade        Required before selecting a lower level
  --reason <text>          Required downgrade rationale; minimum 20 characters
  --dry-run                Explain classification without running controls
  --json                   Print plan or result as JSON
  --no-report              Do not write the local timing report
`);
}

function runGit(args, options = {}) {
  const result = spawnSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: options.inherit ? 'inherit' : 'pipe'
  });
  if (result.status !== 0 && !options.allowFailure) {
    const detail = String(result.stderr || result.stdout || '').trim();
    throw new Error(`git ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`);
  }
  return result;
}

function gitLines(args) {
  const result = runGit(args, { allowFailure: true });
  if (result.status !== 0) return [];
  return String(result.stdout || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function refExists(ref) {
  return runGit(['rev-parse', '--verify', '--quiet', ref], { allowFailure: true }).status === 0;
}

function detectBase(explicitBase) {
  if (explicitBase) {
    if (!refExists(explicitBase)) throw new Error(`Unknown Git base: ${explicitBase}`);
    return explicitBase;
  }
  if (process.env.GITHUB_BASE_REF && refExists(`origin/${process.env.GITHUB_BASE_REF}`)) {
    return `origin/${process.env.GITHUB_BASE_REF}`;
  }
  const upstream = runGit(
    ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'],
    { allowFailure: true }
  );
  if (upstream.status === 0 && String(upstream.stdout).trim()) return String(upstream.stdout).trim();
  if (refExists('origin/main')) return 'origin/main';
  return 'HEAD';
}

function untrackedSourceFiles() {
  return gitLines(['ls-files', '--others', '--exclude-standard'])
    .filter((file) => !file.replaceAll('\\', '/').startsWith('outputs/'));
}

function changedFiles(baseRef) {
  const files = new Set();
  if (baseRef && baseRef !== 'HEAD') {
    for (const file of gitLines(['diff', '--name-only', '--diff-filter=ACMR', `${baseRef}...HEAD`])) {
      files.add(file);
    }
  }
  for (const file of gitLines(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD'])) files.add(file);
  for (const file of gitLines(['diff', '--cached', '--name-only', '--diff-filter=ACMR'])) files.add(file);
  for (const file of untrackedSourceFiles()) files.add(file);
  return [...files];
}

function readWorkspaceText(file) {
  const absolute = resolve(ROOT, file);
  const rootPrefix = `${resolve(ROOT)}${sep}`.toLowerCase();
  if (!absolute.toLowerCase().startsWith(rootPrefix)) {
    throw new Error(`Refusing to inspect a file outside the repository: ${file}`);
  }
  const content = readFileSync(absolute);
  return content.includes(0) ? '' : content.toString('utf8');
}

function diffText(baseRef) {
  const chunks = [];
  if (baseRef && baseRef !== 'HEAD') {
    const committed = runGit(['diff', '--unified=0', `${baseRef}...HEAD`], { allowFailure: true });
    if (committed.status === 0) chunks.push(String(committed.stdout || ''));
  }
  for (const args of [
    ['diff', '--unified=0', 'HEAD'],
    ['diff', '--cached', '--unified=0']
  ]) {
    const result = runGit(args, { allowFailure: true });
    if (result.status === 0) chunks.push(String(result.stdout || ''));
  }
  return chunks.join('\n');
}

function verifyDiffIntegrity(baseRef) {
  const checks = [
    ['diff', '--check'],
    ['diff', '--cached', '--check']
  ];
  if (baseRef && baseRef !== 'HEAD') checks.push(['diff', '--check', `${baseRef}...HEAD`]);
  for (const args of checks) runGit(args, { inherit: true });

  for (const file of untrackedSourceFiles()) {
    const findings = inspectTextIntegrity(readWorkspaceText(file));
    if (findings.length) {
      const detail = findings.map((finding) => `${file}:${finding.line}: ${finding.reason}`).join('\n');
      throw new Error(`Untracked source integrity check failed:\n${detail}`);
    }
  }
}

function verifyNoSecrets(baseRef) {
  const added = diffText(baseRef)
    .split(/\r?\n/)
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .join('\n');
  const untracked = untrackedSourceFiles().map((file) => readWorkspaceText(file)).join('\n');
  if (containsPotentialSecret(`${added}\n${untracked}`)) {
    throw new Error('Potential credential or private key found in added diff or untracked source.');
  }
}

function verifyProtectedIdentifiers() {
  const failures = [];
  for (const [file, token] of PROTECTED_IDENTIFIERS) {
    if (!readWorkspaceText(file).includes(token)) failures.push(`${file}: ${token}`);
  }
  if (failures.length) {
    throw new Error(`Protected identifier changed or missing:\n${failures.join('\n')}`);
  }
}

function executableFor(bin) {
  if (bin === 'node') return process.execPath;
  if (bin === 'npm') return process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return bin;
}

function executeControl(item, level) {
  const started = performance.now();
  console.log(`\n[${level}] ${item.label}\n    ${item.display}`);
  const result = spawnSync(executableFor(item.bin), item.args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, FG_CHANGE_GATE_LEVEL: level }
  });
  const durationMs = Math.round((performance.now() - started) * 100) / 100;
  return {
    id: item.id,
    label: item.label,
    command: item.display,
    durationMs,
    exitCode: result.status ?? 1,
    status: result.status === 0 ? 'PASS' : 'FAIL',
    error: result.error?.message || ''
  };
}

function writeReport(report) {
  const directory = join(ROOT, 'outputs', 'flightglass-gates');
  mkdirSync(directory, { recursive: true });
  const stamp = report.generatedAt.replace(/[:.]/g, '-');
  const file = join(directory, `${stamp}--level-${report.effectiveLevel}.json`);
  writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
  return file;
}

function publicPlan(baseRef, assessment, resolution, plan) {
  return {
    baseRef,
    detectedLevel: resolution.detectedLevel,
    effectiveLevel: resolution.effectiveLevel,
    downgraded: resolution.downgraded,
    downgradeReason: resolution.reason,
    files: assessment.files,
    ignoredEvidenceFiles: assessment.ignoredEvidenceFiles,
    routes: assessment.routes,
    tags: assessment.tags,
    reasons: assessment.reasons,
    controls: [
      { id: 'diff-integrity', label: 'Git diff and untracked-source integrity', builtIn: true },
      { id: 'secret-scan', label: 'Added and untracked-source credential scan', builtIn: true },
      { id: 'protected-identifiers', label: 'Seven locked application identifiers', builtIn: true },
      ...plan.map(({ id, label, display }) => ({ id, label, command: display }))
    ]
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const baseRef = detectBase(options.base);
  const assessment = classifyChanges(options.files.length ? options.files : changedFiles(baseRef));
  const resolution = resolveRequestedLevel(assessment.level, options.requestedLevel, {
    allowDowngrade: options.allowDowngrade,
    reason: options.reason
  });
  const effectiveAssessment = { ...assessment, ...resolution, level: resolution.effectiveLevel };
  const plan = buildCommandPlan(effectiveAssessment);
  const visiblePlan = publicPlan(baseRef, assessment, resolution, plan);

  if (options.dryRun) {
    if (options.json) process.stdout.write(`${JSON.stringify(visiblePlan, null, 2)}\n`);
    else {
      console.log(`Flightglass change gate: ${resolution.effectiveLevel} (detected ${resolution.detectedLevel})`);
      console.log(`Base: ${baseRef}`);
      console.log(`Files: ${assessment.files.length}; ignored generated evidence: ${assessment.ignoredEvidenceFiles.length}`);
      for (const reason of assessment.reasons) console.log(`- ${reason.level} ${reason.file}: ${reason.reason}`);
      console.log('Controls:');
      visiblePlan.controls.forEach((item) => console.log(`- ${item.id}: ${item.command || item.label}`));
    }
    return;
  }

  const started = performance.now();
  const controls = [];
  let status = 'PASS';
  const runBuiltIn = (id, label, fn) => {
    const controlStarted = performance.now();
    try {
      fn();
      controls.push({
        id,
        label,
        durationMs: Math.round((performance.now() - controlStarted) * 100) / 100,
        exitCode: 0,
        status: 'PASS'
      });
    } catch (error) {
      controls.push({
        id,
        label,
        durationMs: Math.round((performance.now() - controlStarted) * 100) / 100,
        exitCode: 1,
        status: 'FAIL',
        error: error.message
      });
      throw error;
    }
  };

  try {
    runBuiltIn('diff-integrity', 'Git diff and untracked-source integrity', () => verifyDiffIntegrity(baseRef));
    runBuiltIn('secret-scan', 'Added and untracked-source credential scan', () => verifyNoSecrets(baseRef));
    runBuiltIn('protected-identifiers', 'Seven locked application identifiers', verifyProtectedIdentifiers);
    for (const item of plan) {
      const result = executeControl(item, resolution.effectiveLevel);
      controls.push(result);
      if (result.status === 'FAIL') {
        status = 'FAIL';
        break;
      }
    }
  } catch (error) {
    status = 'FAIL';
    console.error(error.message);
  }

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    ...visiblePlan,
    controls,
    totalDurationMs: Math.round((performance.now() - started) * 100) / 100,
    status
  };
  const reportFile = options.report ? writeReport(report) : '';

  if (options.json) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  else {
    console.log(`\nFlightglass change gate ${status}: level ${resolution.effectiveLevel}, ${controls.length} controls, ${report.totalDurationMs} ms.`);
    if (reportFile) console.log(`Timing report: ${reportFile}`);
  }

  if (status !== 'PASS') process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
