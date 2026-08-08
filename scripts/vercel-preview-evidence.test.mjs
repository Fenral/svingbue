import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  EXPECTED_REPOSITORY,
  EXPECTED_VERCEL_PROJECT_ID,
  EXPECTED_VERCEL_PROJECT_NAME,
  EXPECTED_WORKFLOW,
  EXPECTED_WORKFLOW_PATH,
  PRIVATE_SENTINEL_PATHS,
  PUBLIC_ROUTE_CONTRACTS,
  assertSafeDeployCommand,
  buildDeployCommand,
  buildDeploymentMetadata,
  deploymentApiUrl,
  fetchDeploymentRecord,
  main,
  normalizeDeploymentUrl,
  parseCliArguments,
  parseCurlResponse,
  parseDeployOutput,
  readProjectLink,
  requireVercelBypassSecret,
  requireVercelToken,
  runVercelPreviewEvidence,
  validateGitHubRun,
  validateHttpCheck,
  validateInspection,
  validateOptions,
  validateProjectLink,
} from './vercel-preview-evidence.mjs';

const CANDIDATE = '6a1d742b47a35af24c430c10b431d2f66a985f72';
const BASE = '184140a2ff5834f23510662f8c442b8a8c03d36c';
const RUN_ID = '31227779080';
const DEPLOYMENT_ID = 'dpl_1234567890abcdefghijklmnopqrstuv';
const URL = 'https://svingbue-preview-sha-sivert-s-projects.vercel.app';
const ORG_ID = 'team_h4up7e7MJowOqFql2os0052T';
const TOKEN = 'vercel_test_token_never_logged_1234567890';
const BYPASS_SECRET = 'vercel_existing_bypass_secret_never_logged';

function ghRun(overrides = {}) {
  return {
    id: Number(RUN_ID),
    name: EXPECTED_WORKFLOW,
    path: EXPECTED_WORKFLOW_PATH,
    head_sha: CANDIDATE,
    event: 'pull_request',
    status: 'completed',
    conclusion: 'success',
    html_url: `https://github.com/${EXPECTED_REPOSITORY}/actions/runs/${RUN_ID}`,
    run_attempt: 1,
    updated_at: '2026-08-08T01:30:00Z',
    repository: { full_name: EXPECTED_REPOSITORY },
    pull_requests: [{
      number: 18,
      url: `https://api.github.com/repos/${EXPECTED_REPOSITORY}/pulls/18`,
      base: { sha: BASE, repo: { url: `https://api.github.com/repos/${EXPECTED_REPOSITORY}` } },
      head: { sha: CANDIDATE, repo: { url: `https://api.github.com/repos/${EXPECTED_REPOSITORY}` } },
    }],
    ...overrides,
  };
}

function githubSummary() {
  return validateGitHubRun(ghRun(), { candidate: CANDIDATE, base: BASE, runId: RUN_ID });
}

function options(mode = 'verify') {
  return mode === 'deploy'
    ? {
      mode,
      candidate: CANDIDATE,
      base: BASE,
      runId: RUN_ID,
      confirmation: CANDIDATE,
      deploymentId: null,
      url: null,
    }
    : {
      mode,
      candidate: CANDIDATE,
      base: BASE,
      runId: RUN_ID,
      confirmation: null,
      deploymentId: DEPLOYMENT_ID,
      url: URL,
    };
}

function routeResponse(pathname, override = {}) {
  const bodies = {
    '/': '<!doctype html><title>Flightglass — Understand the numbers</title><h1>See what every number changes.</h1>',
    '/impact-studio.html': '<!doctype html><title>Flightglass · Mechanics Lab</title><body data-sa-route="studio"><button>Impact Inputs</button><button>Arc Inputs</button><section aria-label="Live outcomes"></section>',
    '/impact.html': '<!doctype html><title>Range Replay — Outcome, Side and Top</title><section id="outcomeBoard" aria-label="All live shot outcomes"><h1>LIVE OUTCOME</h1><span>REPLAY &amp; COMPARE</span></section><button aria-label="Pin comparison">Pin comparison</button>',
    '/jarvis.html': '<!doctype html><title>Flightglass Guide</title><body data-sa-route="jarvis"><p>Choose the question. See what the model knows.</p><section data-guide-panel="browse"><h2>What do you want to understand?</h2><p>Start broad, then open one precise question.</p></section>',
    '/privacy.html': '<title>Privacy Policy — Flightglass</title>',
    '/terms.html': '<title>Terms of Use — Flightglass</title><p>Store price</p><p>Lifetime is not offered to new customers in this version.</p>',
    '/support.html': '<title>Support — Flightglass</title><h1>How can we help?</h1><strong>Contact Flightglass</strong>',
    '/sa-paywall.js': '/* Flightglass Pro paywall */\nbutton.textContent="Restore purchases";\nmessage="Store price unavailable";',
  };
  const status = override.status ?? (PRIVATE_SENTINEL_PATHS.includes(pathname) ? 404 : 200);
  const body = override.body ?? bodies[pathname] ?? 'Not Found';
  return `${body}\n__FLIGHTGLASS_HTTP_STATUS__:${status}\n`;
}

function createHarness({
  mode = 'verify',
  github = ghRun(),
  inspect = {},
  listMutator = value => value,
  routeMutator = (pathname, value) => value,
  commandMutator = null,
} = {}) {
  const calls = [];
  const fetchCalls = [];
  const temp = mkdtempSync(join(tmpdir(), 'flightglass-preview-'));
  const normalizedOptions = validateOptions(options(mode));
  const summary = validateGitHubRun(github, normalizedOptions);
  const metadata = buildDeploymentMetadata(normalizedOptions, summary);
  fs.mkdirSync(join(temp, '.vercel'), { recursive: true });
  fs.writeFileSync(join(temp, '.vercel', 'project.json'), JSON.stringify({
    projectId: EXPECTED_VERCEL_PROJECT_ID,
    orgId: ORG_ID,
    projectName: EXPECTED_VERCEL_PROJECT_NAME,
  }));
  let statusCalls = 0;
  const run = (bin, args, commandOptions = {}) => {
    calls.push({ bin, args: [...args], env: commandOptions.env });
    if (commandMutator) {
      const changed = commandMutator({ bin, args: [...args], calls, statusCalls });
      if (changed) {
        if (bin === 'git' && args[0] === 'status') statusCalls += 1;
        return changed;
      }
    }
    if (bin === 'git' && args[0] === 'status') {
      statusCalls += 1;
      return { status: 0, stdout: '' };
    }
    if (bin === 'git' && args[0] === 'rev-parse' && args[1] === 'HEAD') return { status: 0, stdout: `${CANDIDATE}\n` };
    if (bin === 'git' && args[0] === 'rev-parse') return { status: 0, stdout: `${BASE}\n` };
    if (bin === 'git' && args[0] === 'merge-base') return { status: 0, stdout: '' };
    if (bin === 'git' && args[0] === 'remote') return { status: 0, stdout: 'https://github.com/Fenral/svingbue.git\n' };
    if (bin === 'gh') return { status: 0, stdout: JSON.stringify(github) };
    if (bin === 'npm') return { status: 0, stdout: 'web build green' };
    if (bin === 'vercel' && args[0] === 'deploy') {
      return { status: 0, stdout: `${URL}\n` };
    }
    if (bin === 'vercel' && args[0] === 'curl') {
      return { status: 0, stdout: routeMutator(args[1], routeResponse(args[1]), args) };
    }
    throw new Error(`Unexpected command: ${bin} ${args.join(' ')}`);
  };
  const fetchImpl = async (url, init) => {
    fetchCalls.push({ url, init });
    const payload = listMutator({
      id: DEPLOYMENT_ID,
      url: URL,
      target: null,
      readyState: 'READY',
      createdAt: 1786152600000,
      alias: [],
      projectId: EXPECTED_VERCEL_PROJECT_ID,
      meta: metadata,
      ...inspect,
    });
    return { status: 200, json: async () => payload };
  };
  return {
    calls,
    fetchCalls,
    temp,
    run,
    fetchImpl,
    normalizedOptions,
    cleanup: () => rmSync(temp, { recursive: true, force: true }),
  };
}

function runtime(harness, extra = {}) {
  return {
    cwd: harness.temp,
    run: harness.run,
    fetchImpl: harness.fetchImpl,
    env: { VERCEL_TOKEN: TOKEN, VERCEL_AUTOMATION_BYPASS_SECRET: BYPASS_SECRET },
    outputRoot: join(harness.temp, 'evidence'),
    ...extra,
  };
}

function deployCalls(calls) {
  return calls.filter(call => call.bin === 'vercel' && call.args[0] === 'deploy');
}

test('CLI requires exactly one explicit mode and complete mode-specific identity', () => {
  assert.throws(() => parseCliArguments([]), /exactly one mode/i);
  assert.throws(() => parseCliArguments(['--deploy', '--verify']), /exactly one mode/i);
  assert.throws(() => parseCliArguments(['--verify', '--candidate']), /requires a value/i);
  assert.throws(() => parseCliArguments([
    '--verify', '--candidate', CANDIDATE, '--candidate', CANDIDATE,
    '--base', BASE, '--run-id', RUN_ID, '--deployment-id', DEPLOYMENT_ID, '--url', URL,
  ]), /only be provided once/i);
  assert.throws(() => parseCliArguments([
    '--verify', '--candidate', CANDIDATE, '--base', BASE, '--run-id', RUN_ID,
    '--deployment-id', DEPLOYMENT_ID, '--url', URL, '--prod',
  ]), /Unknown argument/i);
});

test('deploy authorization is one exact full candidate SHA and invalid input spawns nothing', async () => {
  const calls = [];
  await assert.rejects(() => runVercelPreviewEvidence({ ...options('deploy'), confirmation: BASE }, {
    run: (...args) => calls.push(args),
  }), /exactly equal/i);
  assert.deepEqual(calls, []);
  assert.throws(() => validateOptions({ ...options('deploy'), candidate: CANDIDATE.slice(0, 39) }), /full lowercase 40/i);
  assert.throws(() => validateOptions({ ...options('deploy'), base: CANDIDATE }), /distinct ancestor/i);
  assert.throws(() => validateOptions({ ...options('deploy'), deploymentId: DEPLOYMENT_ID }), /discovers deployment identity/i);
});

test('verify mode requires exact deployment ID and credential-free Vercel origin', () => {
  assert.equal(normalizeDeploymentUrl('example.vercel.app'), 'https://example.vercel.app');
  for (const url of [
    'http://example.vercel.app',
    'https://user:pass@example.vercel.app',
    'https://example.vercel.app/path',
    'https://example.vercel.app?x=1',
    'https://example.com',
  ]) assert.throws(() => normalizeDeploymentUrl(url), /exact|credential-free/i, url);
  assert.throws(() => validateOptions({ ...options(), deploymentId: 'svingbue.vercel.app' }), /exact Vercel/i);
  assert.throws(() => validateOptions({ ...options(), confirmation: CANDIDATE }), /only valid/i);
});

test('deploy command carries exact evidence metadata and has no production, promotion, domain or token flag', () => {
  const metadata = buildDeploymentMetadata(validateOptions(options('deploy')), githubSummary());
  const command = buildDeployCommand(metadata);
  assert.equal(command.bin, 'vercel');
  assert.deepEqual(command.args.slice(0, 4), ['deploy', '.', '--yes', '--no-color']);
  for (const forbidden of ['--prod', '--target', '--target=production', '--skip-domain', 'promote', '--token']) {
    assert.equal(command.args.includes(forbidden), false, forbidden);
  }
  for (const [key, value] of Object.entries(metadata)) {
    assert.ok(command.args.includes(`${key}=${value}`), key);
  }
  for (const unsafe of [
    ['deploy', '.', '--yes', '--no-color', '--prod'],
    ['deploy', '.', '--yes', '--no-color', '--target', 'production'],
    ['deploy', '.', '--yes', '--no-color', '--skip-domain'],
    ['promote', URL],
  ]) assert.throws(() => assertSafeDeployCommand({ bin: 'vercel', args: unsafe }, metadata), /production|promotion|deploy/i);
});

test('plain deploy output is one exact URL; JSON remains a strict optional fallback', () => {
  assert.deepEqual(parseDeployOutput(`${URL}\n`), { deploymentId: null, url: URL });
  assert.deepEqual(parseDeployOutput(JSON.stringify({ id: DEPLOYMENT_ID, url: URL })), {
    deploymentId: DEPLOYMENT_ID, url: URL,
  });
  assert.deepEqual(parseDeployOutput(JSON.stringify({
    status: 'ok',
    deployment: { id: DEPLOYMENT_ID, url: URL, readyState: 'BUILDING' },
    message: 'Deployed successfully',
    next: 'Inspect the deployment',
  })), { deploymentId: DEPLOYMENT_ID, url: URL });
  assert.throws(() => parseDeployOutput(`Building\n${URL}\n`), /exactly one deployment URL/i);
  assert.throws(() => parseDeployOutput('{}'), /exact HTTPS Vercel deployment URL/i);
  assert.throws(() => parseDeployOutput(JSON.stringify({
    status: 'error', deployment: { id: DEPLOYMENT_ID, url: URL },
  })), /invalid agent JSON envelope/i);
  assert.throws(() => parseDeployOutput(JSON.stringify({
    status: 'ok', deployment: { url: URL },
  })), /missing a valid deployment ID/i);
});

test('ignored Vercel link, local token and existing bypass secret fail closed before any command', async (t) => {
  const harness = createHarness({ mode: 'deploy' });
  t.after(harness.cleanup);
  assert.deepEqual(readProjectLink(harness.temp), {
    projectId: EXPECTED_VERCEL_PROJECT_ID,
    projectName: EXPECTED_VERCEL_PROJECT_NAME,
    orgId: ORG_ID,
  });
  assert.equal(requireVercelToken({ VERCEL_TOKEN: TOKEN }), TOKEN);
  assert.throws(() => requireVercelToken({}), /VERCEL_TOKEN/i);
  assert.equal(requireVercelBypassSecret({ VERCEL_AUTOMATION_BYPASS_SECRET: BYPASS_SECRET }), BYPASS_SECRET);
  assert.throws(() => requireVercelBypassSecret({}), /VERCEL_AUTOMATION_BYPASS_SECRET/i);
  assert.throws(() => validateProjectLink({
    projectId: 'prj_wrong', projectName: 'svingbue', orgId: ORG_ID,
  }), /must target/i);

  const calls = [];
  await assert.rejects(() => runVercelPreviewEvidence(harness.normalizedOptions, {
    cwd: harness.temp,
    run: (...args) => calls.push(args),
    fetchImpl: harness.fetchImpl,
    env: {},
  }), /VERCEL_TOKEN/i);
  assert.deepEqual(calls, []);

  await assert.rejects(() => runVercelPreviewEvidence(harness.normalizedOptions, {
    cwd: harness.temp,
    run: (...args) => calls.push(args),
    fetchImpl: harness.fetchImpl,
    env: { VERCEL_TOKEN: TOKEN },
  }), /VERCEL_AUTOMATION_BYPASS_SECRET/i);
  assert.deepEqual(calls, []);
});

test('GitHub run validation binds repository, workflow, PR base, candidate, completion and URL', () => {
  const cases = [
    [{ repository: { full_name: 'attacker/svingbue' } }, /belong/i],
    [{ name: 'Other workflow' }, /must use/i],
    [{ path: '.github/workflows/other.yml' }, /must use/i],
    [{ head_sha: BASE }, /head SHA/i],
    [{ event: 'workflow_dispatch' }, /pull_request release-gate run/i],
    [{ pull_requests: [] }, /bind exactly one canonical pull request/i],
    [{ pull_requests: [{
      number: 18,
      url: `https://api.github.com/repos/${EXPECTED_REPOSITORY}/pulls/18`,
      base: { sha: CANDIDATE, repo: { url: `https://api.github.com/repos/${EXPECTED_REPOSITORY}` } },
      head: { sha: CANDIDATE, repo: { url: `https://api.github.com/repos/${EXPECTED_REPOSITORY}` } },
    }] }, /supplied base and candidate SHAs/i],
    [{ status: 'in_progress' }, /completed successfully/i],
    [{ conclusion: 'failure' }, /completed successfully/i],
    [{ html_url: `https://github.com/${EXPECTED_REPOSITORY}/actions/runs/1` }, /exact repository\/run URL/i],
  ];
  for (const [override, expected] of cases) {
    assert.throws(() => validateGitHubRun(ghRun(override), { candidate: CANDIDATE, base: BASE, runId: RUN_ID }), expected);
  }
});

test('dirty worktree, wrong HEAD, non-ancestor base and wrong origin all prevent deploy', async (t) => {
  const cases = [
    ['dirty', ({ bin, args }) => bin === 'git' && args[0] === 'status' ? { status: 0, stdout: '?? secret.txt\n' } : null],
    ['head', ({ bin, args }) => bin === 'git' && args[0] === 'rev-parse' && args[1] === 'HEAD' ? { status: 0, stdout: `${BASE}\n` } : null],
    ['ancestor', ({ bin, args }) => bin === 'git' && args[0] === 'merge-base' ? { status: 1, stdout: '' } : null],
    ['origin', ({ bin, args }) => bin === 'git' && args[0] === 'remote' ? { status: 0, stdout: 'https://github.com/attacker/svingbue.git\n' } : null],
  ];
  for (const [name, commandMutator] of cases) {
    const harness = createHarness({ mode: 'deploy', commandMutator });
    t.after(harness.cleanup);
    await assert.rejects(() => runVercelPreviewEvidence(harness.normalizedOptions, runtime(harness)), /clean|HEAD|ancestor|origin/i, name);
    assert.equal(deployCalls(harness.calls).length, 0, name);
  }
});

test('a wrong or unsuccessful GitHub run prevents build and deployment', async (t) => {
  for (const github of [ghRun({ head_sha: BASE }), ghRun({ conclusion: 'failure' })]) {
    const harness = createHarness();
    t.after(harness.cleanup);
    harness.run = ((original) => (bin, args) => {
      if (bin === 'gh') return { status: 0, stdout: JSON.stringify(github) };
      return original(bin, args);
    })(harness.run);
    await assert.rejects(() => runVercelPreviewEvidence(options('deploy'), runtime(harness)), /head SHA|completed successfully/i);
    assert.equal(harness.calls.some(call => call.bin === 'npm'), false);
    assert.equal(deployCalls(harness.calls).length, 0);
  }
});

test('deploy runs build:web first and rechecks clean exact HEAD before any preview creation', async (t) => {
  const harness = createHarness({ mode: 'deploy' });
  t.after(harness.cleanup);
  const result = await runVercelPreviewEvidence(harness.normalizedOptions, runtime(harness, {
    now: new Date('2026-08-08T02:00:00Z'),
  }));
  const buildIndex = harness.calls.findIndex(call => call.bin === 'npm' && call.args.join(' ') === 'run build:web');
  const deployIndex = harness.calls.findIndex(call => call.bin === 'vercel' && call.args[0] === 'deploy');
  assert.ok(buildIndex > -1 && deployIndex > buildIndex);
  assert.equal(harness.calls.filter(call => call.bin === 'git' && call.args[0] === 'status').length, 2);
  assert.equal(harness.calls.filter(call => call.bin === 'git' && call.args[0] === 'rev-parse' && call.args[1] === 'HEAD').length, 2);
  assert.equal(result.verification.deployment.id, DEPLOYMENT_ID);
  const curlCalls = harness.calls.filter(call => call.bin === 'vercel' && call.args[0] === 'curl');
  assert.ok(curlCalls.length > 0);
  assert.equal(curlCalls.every(call => call.args.includes(DEPLOYMENT_ID) && !call.args.includes(null)), true);
  const unprivilegedCalls = harness.calls.filter(call => ['git', 'gh', 'npm'].includes(call.bin));
  assert.ok(unprivilegedCalls.length > 0);
  assert.equal(unprivilegedCalls.every(call => !Object.keys(call.env || {}).some(key => key.toLowerCase().startsWith('vercel_'))), true);
  const privilegedCalls = harness.calls.filter(call => call.bin === 'vercel');
  assert.ok(privilegedCalls.length > 0);
  assert.equal(privilegedCalls.every(call => call.env?.VERCEL_TOKEN === TOKEN), true);
  assert.equal(privilegedCalls.every(call => call.env?.VERCEL_AUTOMATION_BYPASS_SECRET === BYPASS_SECRET), true);
});

test('build failure or a build-created tracked change cannot reach vercel deploy', async (t) => {
  const failedBuild = createHarness({
    mode: 'deploy',
    commandMutator: ({ bin }) => bin === 'npm' ? { status: 1, stdout: '' } : null,
  });
  t.after(failedBuild.cleanup);
  await assert.rejects(() => runVercelPreviewEvidence(failedBuild.normalizedOptions, runtime(failedBuild)), /build:web.*failed closed/i);
  assert.equal(deployCalls(failedBuild.calls).length, 0);

  const dirtyAfterBuild = createHarness({
    mode: 'deploy',
    commandMutator: ({ bin, args, statusCalls }) => bin === 'git' && args[0] === 'status' && statusCalls === 1
      ? { status: 0, stdout: ' M package.json\n' }
      : null,
  });
  t.after(dirtyAfterBuild.cleanup);
  await assert.rejects(() => runVercelPreviewEvidence(dirtyAfterBuild.normalizedOptions, runtime(dirtyAfterBuild)), /must be clean/i);
  assert.equal(deployCalls(dirtyAfterBuild.calls).length, 0);
});

test('verify mode never builds or deploys and still performs exact source/run preflight', async (t) => {
  const harness = createHarness();
  t.after(harness.cleanup);
  await runVercelPreviewEvidence(harness.normalizedOptions, runtime(harness));
  assert.equal(harness.calls.some(call => call.bin === 'npm'), false);
  assert.equal(deployCalls(harness.calls).length, 0);
  assert.equal(harness.calls.filter(call => call.bin === 'gh').length, 1);
});

test('inspection must be READY, non-production and match exact ID and URL', () => {
  const identity = { deploymentId: DEPLOYMENT_ID, url: URL };
  const normalized = validateOptions(options());
  const metadata = buildDeploymentMetadata(normalized, githubSummary());
  const project = { projectId: EXPECTED_VERCEL_PROJECT_ID, projectName: EXPECTED_VERCEL_PROJECT_NAME, orgId: ORG_ID };
  const base = {
    id: DEPLOYMENT_ID, url: URL, readyState: 'READY', target: null, alias: [],
    projectId: EXPECTED_VERCEL_PROJECT_ID, meta: metadata,
  };
  for (const [override, expected] of [
    [{ id: 'dpl_abcdefghijklmnopqrstuvwxyz123456' }, /ID does not match/i],
    [{ url: 'other-preview.vercel.app' }, /URL does not match/i],
    [{ readyState: 'BUILDING' }, /not READY/i],
    [{ target: 'production' }, /production/i],
    [{ projectId: 'prj_wrong' }, /wrong project/i],
    [{ meta: { ...metadata, flightglassBaseSha: CANDIDATE } }, /metadata mismatch/i],
    [{ alias: ['svingbue.vercel.app'] }, /production alias/i],
    [{ alias: undefined }, /alias list is missing or invalid/i],
    [{ alias: 'svingbue.vercel.app' }, /alias list is missing or invalid/i],
    [{ alias: [{ hostname: 'svingbue.vercel.app' }] }, /invalid hostname/i],
  ]) assert.throws(() => validateInspection({ ...base, ...override }, identity, { metadata, project }), expected);
});

test('official Vercel API binds project, team, token, deployment and all metadata without CLI JSON', async (t) => {
  const harness = createHarness();
  t.after(harness.cleanup);
  await runVercelPreviewEvidence(harness.normalizedOptions, runtime(harness));
  assert.equal(harness.fetchCalls.length, 1);
  const request = harness.fetchCalls[0];
  assert.equal(request.url, `https://api.vercel.com/v13/deployments/${DEPLOYMENT_ID}?teamId=${ORG_ID}`);
  assert.equal(request.init.headers.Authorization, `Bearer ${TOKEN}`);
  assert.equal(request.init.redirect, 'error');
  assert.ok(request.init.signal instanceof AbortSignal);
  assert.equal(request.init.signal.aborted, false);
  assert.equal(harness.calls.some(call => call.bin === 'vercel' && ['inspect', 'list'].includes(call.args[0])), false);
  assert.equal(harness.calls.some(call => call.args.some(arg => String(arg).includes(TOKEN))), false);
});

test('Vercel API request rejects transport, status and JSON failures without revealing its token', async () => {
  const project = { projectId: EXPECTED_VERCEL_PROJECT_ID, projectName: EXPECTED_VERCEL_PROJECT_NAME, orgId: ORG_ID };
  const identity = { deploymentId: DEPLOYMENT_ID, url: URL };
  assert.equal(deploymentApiUrl(identity, project), `https://api.vercel.com/v13/deployments/${DEPLOYMENT_ID}?teamId=${ORG_ID}`);
  await assert.rejects(() => fetchDeploymentRecord({
    identity, project, token: TOKEN, fetchImpl: async () => { throw new Error(TOKEN); },
  }), error => !error.message.includes(TOKEN) && /failed closed/i.test(error.message));
  await assert.rejects(() => fetchDeploymentRecord({
    identity, project, token: TOKEN, fetchImpl: async () => ({ status: 401, json: async () => ({}) }),
  }), /HTTP 401/i);
  await assert.rejects(() => fetchDeploymentRecord({
    identity, project, token: TOKEN, fetchImpl: async () => ({ status: 200, json: async () => { throw new Error('bad'); } }),
  }), /did not return JSON/i);
});

test('API project or metadata mismatch stops before any route request or attestation', async (t) => {
  for (const inspect of [
    { projectId: 'prj_wrong' },
    { meta: { flightglassCandidateSha: BASE } },
  ]) {
    const harness = createHarness({ inspect });
    t.after(harness.cleanup);
    await assert.rejects(() => runVercelPreviewEvidence(harness.normalizedOptions, runtime(harness)), /wrong project|metadata mismatch/i);
    assert.equal(harness.calls.some(call => call.bin === 'vercel' && call.args[0] === 'curl'), false);
    assert.equal(fs.existsSync(join(harness.temp, 'evidence')), false);
  }
});

test('vercel curl uses curl flags and checks every public route and private sentinel', async (t) => {
  const harness = createHarness();
  t.after(harness.cleanup);
  const result = await runVercelPreviewEvidence(harness.normalizedOptions, runtime(harness));
  const calls = harness.calls.filter(call => call.bin === 'vercel' && call.args[0] === 'curl');
  assert.equal(calls.length, PUBLIC_ROUTE_CONTRACTS.length + PRIVATE_SENTINEL_PATHS.length);
  for (const call of calls) {
    assert.ok(call.args.includes('--deployment'));
    assert.ok(call.args.includes(DEPLOYMENT_ID));
    assert.equal(call.args.includes('--yes'), false);
    assert.ok(call.args.includes('--silent'));
    assert.ok(call.args.includes('--write-out'));
    const writeOut = call.args[call.args.indexOf('--write-out') + 1];
    assert.equal(writeOut, '\\n__FLIGHTGLASS_HTTP_STATUS__:%{http_code}\\n');
    assert.doesNotMatch(writeOut, /[\r\n]/);
  }
  assert.deepEqual(result.verification.checks.map(check => check.path), [
    ...PUBLIC_ROUTE_CONTRACTS.map(contract => contract.path), ...PRIVATE_SENTINEL_PATHS,
  ]);
});

test('preview route inventory covers every v1 public surface and representative private source sentinel', () => {
  assert.deepEqual(PUBLIC_ROUTE_CONTRACTS.map(contract => contract.path), [
    '/',
    '/impact-studio.html',
    '/impact.html',
    '/jarvis.html',
    '/privacy.html',
    '/terms.html',
    '/support.html',
    '/sa-paywall.js',
  ]);
  assert.deepEqual(PRIVATE_SENTINEL_PATHS, [
    '/codemagic.yaml',
    '/package.json',
    '/vercel.json',
    '/scripts/store-screenshots.mjs',
    '/academy.html',
    '/geometry.html',
    '/page-overview.html',
    '/design/mocks/impact-studio.html',
    '/docs/v1-release-record.md',
    '/tools/package.json',
  ]);
});

test('HTTP parser and semantic checks reject missing status, login bodies and weak 200 responses', () => {
  assert.deepEqual(parseCurlResponse('hello\n__FLIGHTGLASS_HTTP_STATUS__:200\n'), { status: 200, body: 'hello' });
  assert.throws(() => parseCurlResponse('hello'), /status marker/i);
  assert.throws(() => parseCurlResponse('hello\n__FLIGHTGLASS_HTTP_STATUS__:20x'), /invalid HTTP status/i);
  const home = PUBLIC_ROUTE_CONTRACTS[0];
  assert.throws(() => validateHttpCheck(home, { status: 200, body: '<title>Log in to Vercel</title> Deployment Protection' }), /login\/protection/i);
  assert.throws(() => validateHttpCheck(home, { status: 200, body: '<title>Something else</title>' }), /missing required/i);
  assert.throws(() => validateHttpCheck(home, { status: 200, body: '<title>Flightglass — Old page</title>See what every number changes.' }), /missing required/i);
  for (const pathname of ['/impact-studio.html', '/impact.html', '/jarvis.html']) {
    const contract = PUBLIC_ROUTE_CONTRACTS.find(candidate => candidate.path === pathname);
    assert.ok(contract, `${pathname} has a semantic preview contract`);
    assert.throws(
      () => validateHttpCheck(contract, { status: 200, body: '<!doctype html><title>Flightglass</title><main>OK</main>' }),
      /missing required/i,
      `${pathname} rejects a generic 200 fallback`,
    );
  }
  const guide = PUBLIC_ROUTE_CONTRACTS.find(contract => contract.path === '/jarvis.html');
  const guideBody = parseCurlResponse(routeResponse('/jarvis.html')).body;
  for (const forbidden of [
    '<textarea aria-label="Ask"></textarea>',
    '<div contenteditable="true"></div>',
    '<input type="text">',
    '<input type="search">',
  ]) {
    assert.throws(
      () => validateHttpCheck(guide, { status: 200, body: `${guideBody}${forbidden}` }),
      /forbidden release (?:copy|UI)/i,
    );
  }
  const paywall = PUBLIC_ROUTE_CONTRACTS.find(contract => contract.path === '/sa-paywall.js');
  const paywallBody = parseCurlResponse(routeResponse('/sa-paywall.js')).body;
  for (const forbidden of ['Lifetime purchase', 'Save with Annual', '20% off']) {
    assert.throws(() => validateHttpCheck(paywall, { status: 200, body: `${paywallBody} ${forbidden}` }), /forbidden release copy/i);
  }
  assert.throws(() => validateHttpCheck({ path: '/package.json', status: 404, patterns: [] }, { status: 200, body: '{}' }), /expected 404/i);
});

test('a Vercel login page returning 200 or an exposed sentinel writes no attestation', async (t) => {
  for (const [pathname, response] of [
    ['/', routeResponse('/', { body: '<title>Vercel Authentication</title> Log in to Vercel' })],
    ['/package.json', routeResponse('/package.json', { status: 200, body: '{"private":true}' })],
  ]) {
    const harness = createHarness({
      routeMutator: (current, value) => current === pathname ? response : value,
    });
    t.after(harness.cleanup);
    const root = join(harness.temp, 'evidence');
    await assert.rejects(() => runVercelPreviewEvidence(harness.normalizedOptions, runtime(harness, { outputRoot: root })), /login\/protection|expected 404/i);
    assert.equal(fs.existsSync(root), false);
  }
});

test('successful evidence is immutable, exclusive and SHA-256-bound to candidate/run/deployment/checks', async (t) => {
  const harness = createHarness();
  t.after(harness.cleanup);
  const writeOptions = [];
  const fsApi = {
    ...fs,
    writeFileSync(target, data, optionsValue) {
      writeOptions.push(optionsValue);
      return fs.writeFileSync(target, data, optionsValue);
    },
  };
  const root = join(harness.temp, 'evidence');
  const result = await runVercelPreviewEvidence(harness.normalizedOptions, runtime(harness, {
    fsApi,
    outputRoot: root,
    now: new Date('2026-08-08T02:15:00Z'),
  }));
  assert.ok(writeOptions.every(value => value.flag === 'wx' && value.mode === 0o600));
  const jsonText = readFileSync(result.attestation.jsonPath, 'utf8');
  const payload = JSON.parse(jsonText);
  const { attestationSha256, ...unsigned } = payload;
  assert.equal(attestationSha256, createHash('sha256').update(JSON.stringify(unsigned)).digest('hex'));
  assert.equal(payload.candidateCommit, CANDIDATE);
  assert.equal(payload.baseCommit, BASE);
  assert.equal(payload.releaseGate.id, RUN_ID);
  assert.equal(payload.deployment.id, DEPLOYMENT_ID);
  assert.equal(payload.httpChecks.length, 18);
  assert.equal(jsonText.includes(TOKEN), false);
  const checksum = createHash('sha256').update(jsonText).digest('hex');
  assert.equal(readFileSync(result.attestation.checksumPath, 'utf8'), `${checksum}  ${result.attestation.jsonPath.split(/[\\/]/).at(-1)}\n`);
  await assert.rejects(() => runVercelPreviewEvidence(harness.normalizedOptions, runtime(harness, {
    fsApi, outputRoot: root,
  })), /already exists/i);
});

test('main reports failure without spawning when confirmation is missing or mismatched', async () => {
  const calls = [];
  const errors = [];
  const status = await main([
    '--deploy', '--candidate', CANDIDATE, '--base', BASE, '--run-id', RUN_ID,
    '--confirm-preview-deploy', BASE,
  ], {
    run: (...args) => calls.push(args),
    stderr: message => errors.push(message),
  });
  assert.equal(status, 1);
  assert.deepEqual(calls, []);
  assert.match(errors.join('\n'), /exactly equal/i);
});
