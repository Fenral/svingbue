import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

export const EXPECTED_REPOSITORY = 'Fenral/svingbue';
export const EXPECTED_WORKFLOW = 'Flightglass v1 release gate';
export const EXPECTED_WORKFLOW_PATH = '.github/workflows/v1-release-gate.yml';
export const EXPECTED_VERCEL_PROJECT_ID = 'prj_ghY32ypKS3kXfmTM3BCRzfl5ptqC';
export const EXPECTED_VERCEL_PROJECT_NAME = 'svingbue';
export const PREVIEW_EVIDENCE_SCHEMA = 'flightglass.vercel-preview-evidence.v1';

const SHA_PATTERN = /^[0-9a-f]{40}$/;
const RUN_ID_PATTERN = /^[1-9][0-9]*$/;
const DEPLOYMENT_ID_PATTERN = /^dpl_[A-Za-z0-9]{20,}$/;
const STATUS_MARKER = '__FLIGHTGLASS_HTTP_STATUS__:';
const PROTECTION_PATTERN = /(?:Vercel\s+Authentication|Authentication\s+Required|Log\s+in\s+to\s+Vercel|Deployment\s+Protection|This\s+deployment\s+is\s+protected|_vercel_sso_nonce|vercel\.com\/login|sso-api)/i;

export const PUBLIC_ROUTE_CONTRACTS = Object.freeze([
  Object.freeze({ path: '/', status: 200, patterns: [/<title[^>]*>\s*Flightglass\s*[—-]\s*Understand the numbers\s*<\/title>/i, /See what every number changes\./i] }),
  Object.freeze({ path: '/privacy.html', status: 200, patterns: [/<title[^>]*>\s*Privacy Policy\s*[—-]\s*Flightglass/i] }),
  Object.freeze({ path: '/terms.html', status: 200, patterns: [/<title[^>]*>\s*Terms of Use\s*[—-]\s*Flightglass/i, /Store price/i, /Lifetime is not offered to new customers in this version\./i] }),
  Object.freeze({ path: '/support.html', status: 200, patterns: [/How can we help\?/i, /Contact Flightglass/i] }),
  Object.freeze({
    path: '/sa-paywall.js',
    status: 200,
    patterns: [/Flightglass Pro paywall/i, /Restore purchases/i, /Store price unavailable/i],
    forbiddenPatterns: [/\bLifetime\b/i, /\b(?:save|saving|savings)\b/i, /\b\d+(?:\.\d+)?\s*%/i],
  }),
]);

export const PRIVATE_SENTINEL_PATHS = Object.freeze([
  '/codemagic.yaml',
  '/package.json',
  '/vercel.json',
  '/scripts/store-screenshots.mjs',
  '/academy.html',
  '/geometry.html',
]);

export class PreviewEvidenceError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PreviewEvidenceError';
  }
}

function fail(message) {
  throw new PreviewEvidenceError(message);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function commandResult(result) {
  return {
    status: Number.isInteger(result?.status) ? result.status : null,
    stdout: String(result?.stdout ?? ''),
    stderr: String(result?.stderr ?? ''),
    error: result?.error ?? null,
  };
}

function executableForWindows(bin, args, environment, platform) {
  if (platform !== 'win32' || !['npm', 'vercel'].includes(bin)) return { executable: bin, args };
  const executable = environment.ComSpec || 'cmd.exe';
  return { executable, args: ['/d', '/s', '/c', `${bin}.cmd`, ...args] };
}

export function defaultCommandRunner(bin, args, options = {}) {
  const environment = options.env ?? process.env;
  const invocation = executableForWindows(bin, args, environment, process.platform);
  return spawnSync(invocation.executable, invocation.args, {
    cwd: options.cwd,
    env: environment,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  });
}

function requireSuccess(run, bin, args, { cwd, label, env }) {
  const result = commandResult(run(bin, args, { cwd, env }));
  if (result.error || result.status !== 0) {
    fail(`${label} failed closed (exit ${result.status ?? 'spawn error'}).`);
  }
  return result.stdout;
}

function parseStrictJson(text, label) {
  try {
    const value = JSON.parse(String(text || '').trim());
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be a JSON object.`);
    return value;
  } catch (error) {
    if (error instanceof PreviewEvidenceError) throw error;
    fail(`${label} did not return strict JSON.`);
  }
}

function requireFullSha(value, flag) {
  if (!SHA_PATTERN.test(String(value || ''))) fail(`${flag} must be one full lowercase 40-character commit SHA.`);
  return value;
}

function requireRunId(value) {
  if (!RUN_ID_PATTERN.test(String(value || ''))) fail('--run-id must be a positive GitHub Actions run ID.');
  return String(value);
}

export function normalizeDeploymentUrl(value) {
  const raw = String(value || '');
  const candidate = raw.startsWith('https://') ? raw : `https://${raw}`;
  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    fail('--url must be an exact HTTPS Vercel deployment URL.');
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password
      || parsed.port || parsed.pathname !== '/' || parsed.search || parsed.hash
      || !/^[a-z0-9-]+\.vercel\.app$/i.test(parsed.hostname)) {
    fail('--url must be an exact credential-free HTTPS *.vercel.app origin without a path, query or fragment.');
  }
  return `https://${parsed.hostname.toLowerCase()}`;
}

export function parseCliArguments(argv) {
  const values = [...argv];
  const modeFlags = values.filter(value => value === '--deploy' || value === '--verify');
  if (modeFlags.length !== 1) fail('Choose exactly one mode: --deploy or --verify.');

  const options = {
    mode: modeFlags[0].slice(2),
    candidate: null,
    base: null,
    runId: null,
    confirmation: null,
    deploymentId: null,
    url: null,
  };
  const valueFlags = new Map([
    ['--candidate', 'candidate'],
    ['--base', 'base'],
    ['--run-id', 'runId'],
    ['--confirm-preview-deploy', 'confirmation'],
    ['--deployment-id', 'deploymentId'],
    ['--url', 'url'],
  ]);
  const seen = new Set(modeFlags);

  for (let index = 0; index < values.length; index += 1) {
    const flag = values[index];
    if (flag === '--deploy' || flag === '--verify') continue;
    const key = valueFlags.get(flag);
    if (!key) fail(`Unknown argument "${flag}".`);
    if (seen.has(flag)) fail(`Argument "${flag}" may only be provided once.`);
    const value = values[index + 1];
    if (value === undefined || value.startsWith('--')) fail(`Argument "${flag}" requires a value.`);
    seen.add(flag);
    options[key] = value;
    index += 1;
  }

  return validateOptions(options);
}

export function validateOptions(input) {
  const options = { ...input };
  if (!['deploy', 'verify'].includes(options.mode)) fail('Mode must be deploy or verify.');
  options.candidate = requireFullSha(options.candidate, '--candidate');
  options.base = requireFullSha(options.base, '--base');
  options.runId = requireRunId(options.runId);
  if (options.base === options.candidate) fail('--base must be a distinct ancestor of --candidate.');

  if (options.mode === 'deploy') {
    if (options.confirmation !== options.candidate) {
      fail('--confirm-preview-deploy must exactly equal the full --candidate SHA.');
    }
    if (options.deploymentId || options.url) fail('--deploy discovers deployment identity; do not pass --deployment-id or --url.');
  } else {
    if (options.confirmation !== null && options.confirmation !== undefined) {
      fail('--confirm-preview-deploy is only valid with --deploy.');
    }
    if (!DEPLOYMENT_ID_PATTERN.test(String(options.deploymentId || ''))) {
      fail('--deployment-id must be an exact Vercel dpl_ deployment ID.');
    }
    options.url = normalizeDeploymentUrl(options.url);
  }
  return Object.freeze(options);
}

function normalizeRepositoryRemote(value) {
  const remote = String(value || '').trim().replace(/\.git$/i, '');
  const match = remote.match(/^(?:https:\/\/github\.com\/|ssh:\/\/git@github\.com\/|git@github\.com:)([^/]+\/[^/]+)$/i);
  return match ? match[1] : null;
}

export function validateGitHubRun(payload, { candidate, base, runId }) {
  if (String(payload?.id ?? '') !== String(runId)) fail('GitHub run ID does not match --run-id.');
  if (payload?.repository?.full_name !== EXPECTED_REPOSITORY) fail(`GitHub run must belong to ${EXPECTED_REPOSITORY}.`);
  if (payload?.name !== EXPECTED_WORKFLOW || payload?.path !== EXPECTED_WORKFLOW_PATH) {
    fail(`GitHub run must use ${EXPECTED_WORKFLOW} at ${EXPECTED_WORKFLOW_PATH}.`);
  }
  if (payload?.head_sha !== candidate) fail('GitHub run head SHA does not match --candidate.');
  if (payload?.event !== 'pull_request') fail('GitHub run must be the exact pull_request release-gate run.');
  if (payload?.status !== 'completed' || payload?.conclusion !== 'success') {
    fail('GitHub run must be completed successfully.');
  }
  const expectedUrl = `https://github.com/${EXPECTED_REPOSITORY}/actions/runs/${runId}`;
  if (payload?.html_url !== expectedUrl) fail('GitHub run URL is not the exact repository/run URL.');
  if (!Number.isInteger(payload?.run_attempt) || payload.run_attempt < 1) fail('GitHub run attempt is missing or invalid.');
  if (!Number.isFinite(Date.parse(payload?.updated_at || ''))) fail('GitHub run completion timestamp is missing or invalid.');
  const repositoryApi = `https://api.github.com/repos/${EXPECTED_REPOSITORY}`;
  const matchingPullRequests = Array.isArray(payload?.pull_requests)
    ? payload.pull_requests.filter(pullRequest => Number.isInteger(pullRequest?.number)
      && pullRequest.number > 0
      && pullRequest.url === `${repositoryApi}/pulls/${pullRequest.number}`
      && pullRequest.base?.repo?.url === repositoryApi
      && pullRequest.head?.repo?.url === repositoryApi
      && pullRequest.base?.sha === base
      && pullRequest.head?.sha === candidate)
    : [];
  if (matchingPullRequests.length !== 1) {
    fail('GitHub run must bind exactly one canonical pull request with the supplied base and candidate SHAs.');
  }
  const pullRequest = matchingPullRequests[0];
  return Object.freeze({
    id: String(runId),
    name: payload.name,
    path: payload.path,
    url: payload.html_url,
    headSha: payload.head_sha,
    attempt: payload.run_attempt,
    completedAt: payload.updated_at,
    event: payload.event,
    pullRequest: Object.freeze({
      number: pullRequest.number,
      url: `https://github.com/${EXPECTED_REPOSITORY}/pull/${pullRequest.number}`,
      baseSha: pullRequest.base.sha,
      headSha: pullRequest.head.sha,
    }),
  });
}

export function buildDeploymentMetadata({ candidate, base, runId }, githubRun) {
  return Object.freeze({
    flightglassCandidateSha: candidate,
    flightglassBaseSha: base,
    flightglassGithubRunId: String(runId),
    flightglassGithubRunUrl: githubRun.url,
    flightglassRepository: EXPECTED_REPOSITORY,
    flightglassWorkflow: EXPECTED_WORKFLOW,
    flightglassGithubEvent: githubRun.event,
    flightglassPullRequest: String(githubRun.pullRequest.number),
  });
}

export function buildDeployCommand(metadata) {
  const args = ['deploy', '.', '--yes', '--no-color'];
  for (const [key, value] of Object.entries(metadata)) args.push('--meta', `${key}=${value}`);
  const command = Object.freeze({ bin: 'vercel', args: Object.freeze(args) });
  assertSafeDeployCommand(command, metadata);
  return command;
}

export function assertSafeDeployCommand(command, metadata) {
  if (command?.bin !== 'vercel' || command?.args?.[0] !== 'deploy') fail('Preview deployment must use vercel deploy.');
  const args = [...command.args];
  const forbidden = args.some(arg => {
    const lower = String(arg).toLowerCase();
    return lower === '--prod' || lower.startsWith('--prod=') || lower === '--target'
      || lower.startsWith('--target=') || lower === '--skip-domain' || lower === 'promote'
      || lower === '--token' || lower.startsWith('--token=');
  });
  if (forbidden) fail('Preview deploy command contains a production, promotion, domain or token flag.');
  for (const required of ['.', '--yes', '--no-color']) {
    if (!args.includes(required)) fail(`Preview deploy command is missing ${required}.`);
  }
  const actualMetadata = new Map();
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== '--meta') continue;
    const pair = String(args[index + 1] || '');
    const separator = pair.indexOf('=');
    if (separator <= 0) fail('Every --meta flag must carry one key=value pair.');
    const key = pair.slice(0, separator);
    if (actualMetadata.has(key)) fail(`Duplicate deployment metadata key: ${key}.`);
    actualMetadata.set(key, pair.slice(separator + 1));
    index += 1;
  }
  if (actualMetadata.size !== Object.keys(metadata).length) fail('Preview deploy metadata set is incomplete.');
  for (const [key, value] of Object.entries(metadata)) {
    if (actualMetadata.get(key) !== value) fail(`Preview deploy metadata mismatch for ${key}.`);
  }
  return true;
}

export function parseDeployOutput(text) {
  const raw = String(text || '').trim();
  if (raw.startsWith('{')) {
    const payload = parseStrictJson(raw, 'vercel deploy');
    let deployment = payload;
    if (Object.hasOwn(payload, 'status') || Object.hasOwn(payload, 'deployment')) {
      if (payload.status !== 'ok' || !payload.deployment || typeof payload.deployment !== 'object'
          || Array.isArray(payload.deployment)) {
        fail('vercel deploy returned an invalid agent JSON envelope.');
      }
      deployment = payload.deployment;
      if (!DEPLOYMENT_ID_PATTERN.test(String(deployment.id || ''))) {
        fail('vercel deploy agent JSON is missing a valid deployment ID.');
      }
    }
    const deploymentId = deployment.id == null ? null : String(deployment.id);
    if (deploymentId !== null && !DEPLOYMENT_ID_PATTERN.test(deploymentId)) {
      fail('vercel deploy returned an invalid deployment ID.');
    }
    return Object.freeze({ deploymentId, url: normalizeDeploymentUrl(deployment.url) });
  }
  const lines = raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length !== 1) fail('vercel deploy must return exactly one deployment URL on stdout.');
  return Object.freeze({ deploymentId: null, url: normalizeDeploymentUrl(lines[0]) });
}

export function validateProjectLink(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) fail('.vercel/project.json must contain one JSON object.');
  if (payload.projectId !== EXPECTED_VERCEL_PROJECT_ID || payload.projectName !== EXPECTED_VERCEL_PROJECT_NAME) {
    fail(`Vercel link must target ${EXPECTED_VERCEL_PROJECT_NAME} (${EXPECTED_VERCEL_PROJECT_ID}).`);
  }
  if (!/^[A-Za-z0-9_-]{8,}$/.test(String(payload.orgId || ''))) fail('Vercel project link has an invalid orgId.');
  return Object.freeze({ projectId: payload.projectId, projectName: payload.projectName, orgId: payload.orgId });
}

export function validateInspection(payload, { deploymentId, url }, { metadata, project }) {
  if (!DEPLOYMENT_ID_PATTERN.test(String(payload?.id || ''))) fail('Vercel API response has an invalid deployment ID.');
  if (deploymentId && payload.id !== deploymentId) fail('Vercel inspection ID does not match the requested deployment.');
  const inspectedUrl = normalizeDeploymentUrl(payload?.url);
  if (inspectedUrl !== url) fail('Vercel inspection URL does not match the requested deployment URL.');
  if (payload?.readyState !== 'READY') fail('Vercel deployment is not READY.');
  if (String(payload?.target || '').toLowerCase() === 'production') fail('Vercel deployment is production, not a preview.');
  const returnedProjectId = payload.projectId ?? payload.project?.id;
  if (returnedProjectId !== project.projectId) fail('Vercel deployment belongs to the wrong project.');
  for (const [key, value] of Object.entries(metadata)) {
    if (payload.meta?.[key] !== value) fail(`Vercel deployment metadata mismatch for ${key}.`);
  }
  if (!Array.isArray(payload?.alias)) fail('Vercel deployment alias list is missing or invalid.');
  if (!payload.alias.every(alias => typeof alias === 'string' && /^[a-z0-9.-]+$/i.test(alias))) {
    fail('Vercel deployment alias list contains an invalid hostname.');
  }
  const aliases = payload.alias.map(alias => alias.toLowerCase());
  if (aliases.includes('svingbue.vercel.app')) fail('Preview deployment is already attached to the production alias.');
  return Object.freeze({
    id: payload.id,
    url,
    readyState: payload.readyState,
    target: payload.target ?? null,
    createdAt: payload.createdAt ?? null,
  });
}

export function parseCurlResponse(text) {
  const raw = String(text || '');
  const markerIndex = raw.lastIndexOf(`\n${STATUS_MARKER}`);
  if (markerIndex < 0) fail('vercel curl did not emit the required HTTP status marker.');
  const body = raw.slice(0, markerIndex);
  const tail = raw.slice(markerIndex + 1).trim();
  const match = tail.match(new RegExp(`^${STATUS_MARKER}([0-9]{3})$`));
  if (!match) fail('vercel curl emitted an invalid HTTP status marker.');
  return Object.freeze({ status: Number(match[1]), body });
}

export function validateHttpCheck(contract, response) {
  if (PROTECTION_PATTERN.test(response.body)) fail(`${contract.path} returned a Vercel login/protection surface.`);
  if (response.status !== contract.status) fail(`${contract.path} returned HTTP ${response.status}; expected ${contract.status}.`);
  for (const pattern of contract.patterns || []) {
    if (!pattern.test(response.body)) fail(`${contract.path} is missing required Flightglass content.`);
  }
  for (const pattern of contract.forbiddenPatterns || []) {
    if (pattern.test(response.body)) fail(`${contract.path} contains forbidden release copy.`);
  }
  return Object.freeze({
    path: contract.path,
    status: response.status,
    bytes: Buffer.byteLength(response.body, 'utf8'),
    bodySha256: sha256(response.body),
  });
}

function gitOutput(run, cwd, args, label, environment) {
  return requireSuccess(run, 'git', args, { cwd, label, env: environment }).trim();
}

function assertCleanExactHead(run, cwd, candidate, environment) {
  const status = gitOutput(run, cwd, ['status', '--porcelain=v1', '--untracked-files=all'], 'git status', environment);
  if (status) fail('Candidate source tree must be clean before preview evidence work.');
  const head = gitOutput(run, cwd, ['rev-parse', 'HEAD'], 'git rev-parse HEAD', environment);
  if (head !== candidate) fail('Current HEAD does not exactly equal --candidate.');
}

function verifySourceAndRun(run, cwd, options, environment) {
  assertCleanExactHead(run, cwd, options.candidate, environment);
  const base = gitOutput(run, cwd, ['rev-parse', '--verify', `${options.base}^{commit}`], 'git base resolution', environment);
  if (base !== options.base) fail('--base did not resolve to the exact supplied commit.');
  const ancestor = commandResult(run('git', ['merge-base', '--is-ancestor', options.base, options.candidate], { cwd, env: environment }));
  if (ancestor.error || ancestor.status !== 0) fail('--base must be a full distinct ancestor of --candidate.');
  const remote = normalizeRepositoryRemote(gitOutput(run, cwd, ['remote', 'get-url', 'origin'], 'git origin', environment));
  if (remote !== EXPECTED_REPOSITORY) fail(`origin must be the exact ${EXPECTED_REPOSITORY} GitHub repository.`);

  const githubPayload = parseStrictJson(requireSuccess(
    run,
    'gh',
    ['api', `repos/${EXPECTED_REPOSITORY}/actions/runs/${options.runId}`],
    { cwd, label: 'GitHub release-gate lookup', env: environment },
  ), 'GitHub release-gate lookup');
  return validateGitHubRun(githubPayload, options);
}

function curlCommand(pathname, deploymentId) {
  return [
    'curl', pathname,
    '--deployment', deploymentId,
    '--',
    '--silent',
    '--show-error',
    '--max-time', '30',
    '--request', 'GET',
    '--write-out', `\\n${STATUS_MARKER}%{http_code}\\n`,
  ];
}

export function readProjectLink(cwd, fsApi = fs) {
  const target = path.join(cwd, '.vercel', 'project.json');
  let text;
  try {
    text = fsApi.readFileSync(target, 'utf8');
  } catch {
    fail('Missing ignored .vercel/project.json; link the exact Vercel project before continuing.');
  }
  return validateProjectLink(parseStrictJson(text, '.vercel/project.json'));
}

export function requireVercelToken(environment) {
  const token = environment?.VERCEL_TOKEN;
  if (typeof token !== 'string' || token.length < 20 || token.trim() !== token || /\s/.test(token)) {
    fail('Set a valid local VERCEL_TOKEN before preview verification or deployment.');
  }
  return token;
}

export function requireVercelBypassSecret(environment) {
  const secret = environment?.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (typeof secret !== 'string' || secret.length < 16 || secret.trim() !== secret || /\s/.test(secret)) {
    fail('Set an existing local VERCEL_AUTOMATION_BYPASS_SECRET before preview verification or deployment.');
  }
  return secret;
}

export function deploymentApiUrl(identity, project) {
  const identifier = identity.deploymentId || new URL(identity.url).hostname;
  return `https://api.vercel.com/v13/deployments/${encodeURIComponent(identifier)}?teamId=${encodeURIComponent(project.orgId)}`;
}

export async function fetchDeploymentRecord({ identity, project, token, fetchImpl }) {
  if (typeof fetchImpl !== 'function') fail('A fetch implementation is required for Vercel API verification.');
  let response;
  try {
    response = await fetchImpl(deploymentApiUrl(identity, project), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    fail('Vercel deployment API request failed closed.');
  }
  if (!response || response.status !== 200) fail(`Vercel deployment API returned HTTP ${response?.status ?? 'unknown'}.`);
  let payload;
  try {
    payload = await response.json();
  } catch {
    fail('Vercel deployment API did not return JSON.');
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) fail('Vercel deployment API returned an invalid payload.');
  return payload;
}

async function verifyDeployment(run, cwd, options, githubRun, identity, api, environment) {
  const metadata = buildDeploymentMetadata(options, githubRun);
  const inspectionPayload = await fetchDeploymentRecord({ ...api, identity });
  const deployment = validateInspection(inspectionPayload, identity, { metadata, project: api.project });
  const verifiedIdentity = Object.freeze({ deploymentId: deployment.id, url: deployment.url });

  const checks = [];
  for (const contract of PUBLIC_ROUTE_CONTRACTS) {
    const output = requireSuccess(run, 'vercel', curlCommand(contract.path, verifiedIdentity.deploymentId), {
      cwd,
      label: `Vercel route check ${contract.path}`,
      env: environment,
    });
    checks.push(validateHttpCheck(contract, parseCurlResponse(output)));
  }
  for (const pathname of PRIVATE_SENTINEL_PATHS) {
    const output = requireSuccess(run, 'vercel', curlCommand(pathname, verifiedIdentity.deploymentId), {
      cwd,
      label: `Vercel sentinel check ${pathname}`,
      env: environment,
    });
    checks.push(validateHttpCheck({ path: pathname, status: 404, patterns: [] }, parseCurlResponse(output)));
  }
  return Object.freeze({ deployment, metadata, checks: Object.freeze(checks) });
}

export function createAttestationPayload({ options, githubRun, verification, now }) {
  const timestamp = now instanceof Date ? now : new Date(now);
  if (!Number.isFinite(timestamp.getTime())) fail('Attestation timestamp is invalid.');
  const unsigned = {
    schema: PREVIEW_EVIDENCE_SCHEMA,
    createdAt: timestamp.toISOString(),
    candidateCommit: options.candidate,
    baseCommit: options.base,
    repository: EXPECTED_REPOSITORY,
    releaseGate: githubRun,
    deployment: verification.deployment,
    deploymentMetadata: verification.metadata,
    httpChecks: verification.checks,
  };
  return Object.freeze({ ...unsigned, attestationSha256: sha256(JSON.stringify(unsigned)) });
}

export function writeAttestation({ cwd, options, githubRun, verification, now, fsApi = fs, outputRoot }) {
  const payload = createAttestationPayload({ options, githubRun, verification, now });
  const root = outputRoot ?? path.join(cwd, 'outputs', 'release-evidence', 'vercel-preview');
  const directory = path.join(root, options.candidate);
  fsApi.mkdirSync(directory, { recursive: true });
  const stem = `flightglass-vercel-preview-${options.candidate}-${verification.deployment.id}.attestation`;
  const jsonPath = path.join(directory, `${stem}.json`);
  const checksumPath = path.join(directory, `${stem}.sha256`);
  if (fsApi.existsSync(jsonPath) || fsApi.existsSync(checksumPath)) {
    fail('Preview attestation already exists; immutable evidence is never overwritten.');
  }
  const data = `${JSON.stringify(payload, null, 2)}\n`;
  const checksum = sha256(data);
  fsApi.writeFileSync(jsonPath, data, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  fsApi.writeFileSync(checksumPath, `${checksum}  ${path.basename(jsonPath)}\n`, {
    encoding: 'utf8', flag: 'wx', mode: 0o600,
  });
  return Object.freeze({ jsonPath, checksumPath, checksum, payload });
}

export async function runVercelPreviewEvidence(input, dependencies = {}) {
  const options = validateOptions(input);
  const cwd = path.resolve(dependencies.cwd ?? process.cwd());
  const run = dependencies.run ?? defaultCommandRunner;
  const now = dependencies.now ?? new Date();
  const fsApi = dependencies.fsApi ?? fs;
  const project = readProjectLink(cwd, fsApi);
  const privilegedEnvironment = { ...(dependencies.env ?? process.env) };
  const token = requireVercelToken(privilegedEnvironment);
  requireVercelBypassSecret(privilegedEnvironment);
  const unprivilegedEnvironment = { ...privilegedEnvironment };
  for (const key of Object.keys(unprivilegedEnvironment)) {
    if (key.toLowerCase().startsWith('vercel_')) delete unprivilegedEnvironment[key];
  }
  const fetchImpl = dependencies.fetchImpl ?? globalThis.fetch;

  const githubRun = verifySourceAndRun(run, cwd, options, unprivilegedEnvironment);
  let identity;
  if (options.mode === 'deploy') {
    requireSuccess(run, 'npm', ['run', 'build:web'], {
      cwd, label: 'npm run build:web', env: unprivilegedEnvironment,
    });
    assertCleanExactHead(run, cwd, options.candidate, unprivilegedEnvironment);
    const metadata = buildDeploymentMetadata(options, githubRun);
    const command = buildDeployCommand(metadata);
    const output = requireSuccess(run, command.bin, [...command.args], {
      cwd, label: 'Vercel preview deployment', env: privilegedEnvironment,
    });
    identity = parseDeployOutput(output);
  } else {
    identity = Object.freeze({ deploymentId: options.deploymentId, url: options.url });
  }

  const verification = await verifyDeployment(run, cwd, options, githubRun, identity, {
    project, token, fetchImpl,
  }, privilegedEnvironment);
  const attestation = writeAttestation({
    cwd,
    options,
    githubRun,
    verification,
    now,
    fsApi,
    outputRoot: dependencies.outputRoot,
  });
  return Object.freeze({ options, githubRun, verification, attestation });
}

export async function main(argv = process.argv.slice(2), dependencies = {}) {
  try {
    const options = parseCliArguments(argv);
    const result = await runVercelPreviewEvidence(options, dependencies);
    const stdout = dependencies.stdout ?? console.log;
    stdout(`Vercel preview evidence: PASS (${result.verification.deployment.id})`);
    stdout(`Preview URL: ${result.verification.deployment.url}`);
    stdout(`Attestation: ${result.attestation.jsonPath}`);
    stdout(`SHA-256: ${result.attestation.checksum}`);
    return 0;
  } catch (error) {
    const stderr = dependencies.stderr ?? console.error;
    stderr(`Vercel preview evidence: FAIL — ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

const modulePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(modulePath)) {
  process.exitCode = await main();
}
