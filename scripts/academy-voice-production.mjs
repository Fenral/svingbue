#!/usr/bin/env node
import { createHash, randomInt } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACADEMY_BACKSPIN_CUES, ACADEMY_HOME_CUES } from '../academy-voice-reference-cues.js';
import { START_LINE_CUES } from '../academy-start-line-content.js';
import { SHAPE_CUES } from '../academy-shape-content.js';
import { CARRY_SIDE_CUES } from '../academy-carry-side-content.js';
import { ATTACK_AT_IMPACT_CUES } from '../academy-attack-at-impact-content.js';
import { LOW_POINT_CUES } from '../academy-low-point-content.js';
import { CONTACT_HEIGHT_CUES } from '../academy-contact-height-content.js';
import { DELIVERED_LOFT_LAUNCH_CUES } from '../academy-delivered-loft-launch-content.js';
import { FLIGHT_HEIGHT_DESCENT_CUES } from '../academy-flight-height-descent-content.js';
import { SPEED_TRANSFER_CUES } from '../academy-speed-transfer-content.js';
import { CARRY_CUES } from '../academy-carry-content.js';
import { AIR_DENSITY_CUES } from '../academy-air-density-content.js';
import { WIND_CUES } from '../academy-wind-content.js';
import { PLANE_COUPLING_CUES } from '../academy-plane-coupling-content.js';
import { countCueWords } from '../academy-voice-manifest.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PACK_ID = 'control-room-en-us-v1';
const API_BASE = 'https://api.elevenlabs.io';
const WORK_ROOT = resolve(ROOT, '.voice-production', PACK_ID);
const ASSET_ROOT = resolve(ROOT, 'assets', 'audio', 'academy', PACK_ID);
const MODEL_ID = 'eleven_multilingual_v2';
const SOURCE_FORMAT = 'mp3_44100_192';

const CUE_SETS = [
  ACADEMY_HOME_CUES,
  ACADEMY_BACKSPIN_CUES,
  START_LINE_CUES,
  SHAPE_CUES,
  CARRY_SIDE_CUES,
  ATTACK_AT_IMPACT_CUES,
  LOW_POINT_CUES,
  CONTACT_HEIGHT_CUES,
  DELIVERED_LOFT_LAUNCH_CUES,
  FLIGHT_HEIGHT_DESCENT_CUES,
  SPEED_TRANSFER_CUES,
  CARRY_CUES,
  AIR_DENSITY_CUES,
  WIND_CUES,
  PLANE_COUPLING_CUES
];

export const AUDITION_LINES = Object.freeze([
  ACADEMY_HOME_CUES.cues.find(cue => cue.cueId === 'academy.home.orient').text,
  ACADEMY_BACKSPIN_CUES.cues.find(cue => cue.cueId === 'academy.backspin.s2.entry').text,
  ACADEMY_BACKSPIN_CUES.cues.find(cue => cue.cueId === 'academy.backspin.s5.pass').text
]);

export const VOICE_DIRECTIONS = Object.freeze({
  target: 'Adult General American female laboratory control-room narrator. Calm, precise, observant and technically confident without superiority. Grounded middle register, restrained warmth, clear at low phone volume, concise and low-fatigue. Dry close-mic delivery. Never intimate, breathy, chatty, theatrical, futuristic or chirpy.',
  theatrical: 'Adult General American female cinematic science-fiction command-center narrator. Dramatic authority, pronounced trailer pauses, heightened stakes and theatrical emphasis. This is an intentionally more theatrical comparison candidate.',
  generic: 'Adult General American female virtual-assistant narrator. Bright, polished, friendly, evenly emphasized and conventionally helpful. This is an intentionally generic assistant comparison candidate.'
});

const sha256 = value => createHash('sha256').update(value).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const sleep = ms => new Promise(resolveSleep => setTimeout(resolveSleep, ms));
const ensureDir = directory => mkdirSync(directory, { recursive: true });
const writeJson = (path, value) => { ensureDir(dirname(path)); writeFileSync(path, json(value)); };

export function safeCueStem(cueId) {
  const stem = String(cueId).toLowerCase().replace(/^academy\./, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!stem || stem.includes('..')) throw new TypeError(`Unsafe Academy voice cue id: ${cueId}`);
  return stem;
}

export function academyVoiceCatalog() {
  return CUE_SETS.flatMap(set => set.cues.map(cue => {
    const stem = safeCueStem(cue.cueId);
    const relativeAssetPath = `${set.ownerId}/${stem}.m4a`;
    return Object.freeze({ ...cue, ownerId: set.ownerId, stem, relativeAssetPath });
  }));
}

export function speakableText(text) {
  return String(text).replace(/\brpm\b/gi, 'R P M');
}

export function academyVoiceInventory() {
  const cues = academyVoiceCatalog();
  const captionCharacters = cues.reduce((total, cue) => total + cue.text.length, 0);
  const spokenCharacters = cues.reduce((total, cue) => total + speakableText(cue.text).length, 0);
  return {
    packId: PACK_ID,
    locale: 'en-US',
    cueCount: cues.length,
    wordCount: cues.reduce((total, cue) => total + countCueWords(cue.text), 0),
    captionCharacters,
    spokenCharacters,
    estimatedMinutesAt155Wpm: Number((cues.reduce((total, cue) => total + countCueWords(cue.text), 0) / 155).toFixed(1)),
    ownerCount: CUE_SETS.length,
    apiCallsForFullGeneration: cues.length,
    sourceFormat: SOURCE_FORMAT,
    shippingFormat: 'AAC-LC m4a, mono, 48 kHz, 80 kbps'
  };
}

export function createAuditionRequests() {
  const text = AUDITION_LINES.join(' ');
  return Object.entries(VOICE_DIRECTIONS).map(([direction, voiceDescription], index) => ({
    direction,
    body: {
      voice_description: voiceDescription,
      text,
      auto_generate_text: false,
      loudness: 0.25,
      quality: 0.9,
      seed: 4101 + index,
      guidance_scale: 4
    }
  }));
}

export function stableCueSeed(cueId) {
  return Number.parseInt(sha256(cueId).slice(0, 8), 16);
}

export function createTtsRequest(cue) {
  return {
    text: speakableText(cue.text),
    model_id: MODEL_ID,
    voice_settings: {
      stability: 0.78,
      similarity_boost: 0.75,
      style: 0.05,
      use_speaker_boost: true,
      speed: 1
    },
    seed: stableCueSeed(cue.cueId),
    apply_text_normalization: 'on'
  };
}

export function buildFfmpegArgs(inputPath, outputPath) {
  const filters = [
    'silenceremove=start_periods=1:start_duration=0.01:start_threshold=-50dB:stop_periods=-1:stop_duration=0.01:stop_threshold=-50dB',
    'adelay=60:all=1',
    'apad=pad_dur=0.12',
    'loudnorm=I=-18:TP=-1:LRA=7'
  ].join(',');
  return ['-y', '-hide_banner', '-loglevel', 'error', '-i', inputPath, '-af', filters, '-map_metadata', '-1', '-ac', '1', '-ar', '48000', '-c:a', 'aac', '-profile:a', 'aac_low', '-b:a', '80k', '-movflags', '+faststart', outputPath];
}

export function paidExecutionRequested(args) {
  return args.includes('--execute') && args.includes('--confirm-paid-api');
}

export function loadElevenLabsApiKey({ env = process.env, root = ROOT } = {}) {
  if (typeof env.ELEVENLABS_API_KEY === 'string' && env.ELEVENLABS_API_KEY.trim()) return env.ELEVENLABS_API_KEY.trim();
  const envFile = resolve(root, '.env.local');
  if (!existsSync(envFile)) return null;
  const match = readFileSync(envFile, 'utf8').match(/^ELEVENLABS_API_KEY\s*=\s*(.+)$/m);
  if (!match) return null;
  return match[1].trim().replace(/^(['"])(.*)\1$/, '$2') || null;
}

function requireApiKey() {
  const key = loadElevenLabsApiKey();
  if (!key) throw new Error('ELEVENLABS_API_KEY is missing. Put it in the ignored .env.local file; never paste it into chat or Git.');
  return key;
}

function run(binary, args) {
  const result = spawnSync(binary, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${binary} failed: ${(result.stderr || result.stdout || '').trim()}`);
  return result;
}

function requireTool(binary) {
  const result = spawnSync(binary, ['-version'], { encoding: 'utf8' });
  if (result.error || result.status !== 0) throw new Error(`${binary} is required for Academy voice production.`);
  return String(result.stdout || result.stderr).split(/\r?\n/)[0];
}

async function providerRequest(path, { key, body, audio = false, attempts = 4 } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': key },
      body: JSON.stringify(body)
    });
    if (response.ok) return audio ? Buffer.from(await response.arrayBuffer()) : response.json();
    const message = (await response.text()).slice(0, 600).replaceAll(key, '[redacted]');
    if (attempt === attempts || (response.status !== 429 && response.status < 500)) throw new Error(`ElevenLabs request failed (${response.status}): ${message}`);
    const retryAfter = Number(response.headers.get('retry-after'));
    await sleep(Math.min(Number.isFinite(retryAfter) ? retryAfter * 1000 : attempt * 1500, 30000));
  }
  throw new Error('ElevenLabs request did not complete.');
}

function shuffled(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = randomInt(index + 1);
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

async function createAuditions() {
  const key = requireApiKey();
  const auditionRoot = resolve(WORK_ROOT, 'auditions');
  const blindRoot = resolve(WORK_ROOT, 'blind');
  const privateRoot = resolve(WORK_ROOT, 'private');
  ensureDir(auditionRoot); ensureDir(blindRoot); ensureDir(privateRoot);
  const candidates = [];
  for (const request of createAuditionRequests()) {
    const response = await providerRequest(`/v1/text-to-voice/create-previews?output_format=${SOURCE_FORMAT}`, { key, body: request.body });
    for (const [index, preview] of response.previews.entries()) {
      const path = resolve(auditionRoot, `${request.direction}-${index + 1}.mp3`);
      writeFileSync(path, Buffer.from(preview.audio_base_64, 'base64'));
      candidates.push({
        direction: request.direction,
        variant: index + 1,
        generatedVoiceId: preview.generated_voice_id,
        durationSeconds: preview.duration_secs,
        mediaType: preview.media_type,
        sourceFile: relative(WORK_ROOT, path).replaceAll('\\', '/'),
        voiceDescriptionSha256: sha256(request.body.voice_description),
        auditionTextSha256: sha256(request.body.text)
      });
    }
  }
  const mapping = shuffled(candidates).map((candidate, index) => ({ blindLabel: String.fromCharCode(65 + index), ...candidate }));
  for (const candidate of mapping) {
    copyFileSync(resolve(WORK_ROOT, candidate.sourceFile), resolve(blindRoot, `${candidate.blindLabel}.mp3`));
  }
  writeJson(resolve(privateRoot, 'provenance-map.json'), { schemaVersion: 1, createdAt: new Date().toISOString(), provider: 'ElevenLabs', candidates: mapping });
  writeJson(resolve(blindRoot, 'instructions.json'), {
    schemaVersion: 1,
    criteria: ['clarity at low phone volume', 'technical trust', 'low fatigue', 'Control Room fit'],
    auditionLines: AUDITION_LINES,
    verdictTemplate: { winner: null, clarity: null, trust: null, lowFatigue: null, notes: '' },
    warning: 'Do not open ../private/provenance-map.json until the blind verdict is recorded.'
  });
  return { candidateCount: mapping.length, blindDirectory: relative(ROOT, blindRoot).replaceAll('\\', '/'), paidProviderCalls: createAuditionRequests().length };
}

function argumentValue(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
}

async function selectVoice(args) {
  const label = String(argumentValue(args, '--candidate') || '').toUpperCase();
  if (!/^[A-Z]$/.test(label)) throw new Error('Select one blind label with --candidate A.');
  const provenancePath = resolve(WORK_ROOT, 'private', 'provenance-map.json');
  if (!existsSync(provenancePath)) throw new Error('Run the audition stage first.');
  const provenance = JSON.parse(readFileSync(provenancePath, 'utf8'));
  const candidate = provenance.candidates.find(item => item.blindLabel === label);
  if (!candidate) throw new Error(`Blind candidate ${label} does not exist.`);
  const key = requireApiKey();
  const selected = await providerRequest('/v1/text-to-voice', {
    key,
    body: {
      voice_name: 'Flightglass Control Room',
      voice_description: VOICE_DIRECTIONS.target,
      generated_voice_id: candidate.generatedVoiceId,
      labels: { accent: 'American', age: 'adult', gender: 'female', use_case: 'education' },
      played_not_selected_voice_ids: provenance.candidates.filter(item => item.generatedVoiceId !== candidate.generatedVoiceId).map(item => item.generatedVoiceId)
    }
  });
  const record = {
    schemaVersion: 1,
    selectedAt: new Date().toISOString(),
    provider: 'ElevenLabs',
    blindCandidate: label,
    sourceDirection: candidate.direction,
    generatedVoiceId: candidate.generatedVoiceId,
    voiceId: selected.voice_id,
    voiceName: selected.name,
    modelId: MODEL_ID,
    sourceFormat: SOURCE_FORMAT
  };
  writeJson(resolve(WORK_ROOT, 'private', 'selected-voice.json'), record);
  return { selected: true, blindCandidate: label, voiceId: record.voiceId, next: 'npm run voice:generate -- --execute --confirm-paid-api' };
}

function processAudio(inputPath, outputPath) {
  ensureDir(dirname(outputPath));
  run('ffmpeg', buildFfmpegArgs(inputPath, outputPath));
}

export function inspectAudio(path) {
  const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', path]);
  const durationSeconds = Number(JSON.parse(probe.stdout).format.duration);
  const loudness = run('ffmpeg', ['-hide_banner', '-nostats', '-i', path, '-af', 'loudnorm=I=-18:TP=-1:LRA=7:print_format=json', '-f', 'null', '-']);
  const blocks = loudness.stderr.match(/\{\s*"input_i"[\s\S]*?\}/g) || [];
  const metrics = blocks.length ? JSON.parse(blocks.at(-1)) : {};
  const silence = run('ffmpeg', ['-hide_banner', '-nostats', '-i', path, '-af', 'silencedetect=noise=-50dB:d=0.01', '-f', 'null', '-']).stderr;
  const events = [...silence.matchAll(/silence_(start|end):\s*([0-9.]+)/g)].map(match => ({ type: match[1], at: Number(match[2]) }));
  let leadingSilenceMs = 0;
  if (events[0]?.type === 'start' && events[0].at <= 0.01 && events[1]?.type === 'end') leadingSilenceMs = Math.round(events[1].at * 1000);
  let trailingSilenceMs = 0;
  const finalStart = [...events].reverse().find(event => event.type === 'start' && event.at < durationSeconds);
  if (finalStart && durationSeconds - finalStart.at <= 0.5) trailingSilenceMs = Math.round((durationSeconds - finalStart.at) * 1000);
  return {
    durationSeconds: Number(durationSeconds.toFixed(3)),
    leadingSilenceMs,
    trailingSilenceMs,
    integratedLufs: Number(metrics.input_i),
    truePeakDbtp: Number(metrics.input_tp)
  };
}

function buildAssetRecord(cue, finalPath, selectedVoice) {
  const bytes = readFileSync(finalPath);
  return {
    cueId: cue.cueId,
    path: relative(ROOT, finalPath).replaceAll('\\', '/'),
    ...inspectAudio(finalPath),
    sha256: sha256(bytes),
    captionSha256: sha256(cue.text),
    provider: 'ElevenLabs',
    voiceId: selectedVoice.voiceId,
    modelId: MODEL_ID,
    generatedAt: new Date().toISOString()
  };
}

async function generatePack(args) {
  requireTool('ffmpeg'); requireTool('ffprobe');
  const selectedPath = resolve(WORK_ROOT, 'private', 'selected-voice.json');
  if (!existsSync(selectedPath)) throw new Error('Select a blind audition winner before full generation.');
  const selected = JSON.parse(readFileSync(selectedPath, 'utf8'));
  const key = requireApiKey();
  const requestedLimit = Number(argumentValue(args, '--limit'));
  const allCues = academyVoiceCatalog();
  const cues = Number.isInteger(requestedLimit) && requestedLimit > 0 ? allCues.slice(0, requestedLimit) : allCues;
  const rawRoot = resolve(WORK_ROOT, 'raw');
  const records = [];
  ensureDir(rawRoot); ensureDir(ASSET_ROOT);
  for (const [index, cue] of cues.entries()) {
    const rawPath = resolve(rawRoot, `${cue.stem}.mp3`);
    const finalPath = resolve(ASSET_ROOT, cue.relativeAssetPath);
    if (!existsSync(finalPath) || args.includes('--reprocess')) {
      if (!existsSync(rawPath)) {
        const audio = await providerRequest(`/v1/text-to-speech/${encodeURIComponent(selected.voiceId)}?output_format=${SOURCE_FORMAT}`, { key, body: createTtsRequest(cue), audio: true });
        writeFileSync(rawPath, audio);
      }
      processAudio(rawPath, finalPath);
    }
    records.push(buildAssetRecord(cue, finalPath, selected));
    writeJson(resolve(WORK_ROOT, 'generation-progress.json'), { generated: index + 1, requested: cues.length, totalPackCues: allCues.length, lastCueId: cue.cueId });
  }
  const config = {
    packId: PACK_ID,
    locale: 'en-US',
    displayName: 'Control Room',
    delivery: 'local-prerecorded-only',
    rightsStatus: 'pending-elevenlabs-commercial-license-evidence',
    voiceIdentityStatus: 'pending-blind-listening-gate',
    productionGuide: 'Calm General American female laboratory/control-room delivery; concise, technically confident, low fatigue; no music or theatrical effects.',
    provider: { name: 'ElevenLabs', voiceId: selected.voiceId, modelId: MODEL_ID, generatedUnderPaidPlan: true },
    assets: records
  };
  const manifestPath = resolve(WORK_ROOT, 'academy-voice-pack.generated.json');
  writeJson(manifestPath, config);
  return {
    generatedAssets: records.length,
    expectedAssets: allCues.length,
    complete: records.length === allCues.length,
    manifest: relative(ROOT, manifestPath).replaceAll('\\', '/'),
    releaseStatus: 'PENDING RIGHTS EVIDENCE AND BLIND LISTENING APPROVAL'
  };
}

function dryRun(command, args) {
  const inventory = academyVoiceInventory();
  if (command === 'audition') return { dryRun: true, command, paidProviderCalls: 3, characters: createAuditionRequests().reduce((sum, request) => sum + request.body.text.length, 0), executeWith: 'npm run voice:audition -- --execute --confirm-paid-api' };
  if (command === 'select') return { dryRun: true, command, candidate: argumentValue(args, '--candidate'), externalMutation: 'Creates the selected designed voice in the ElevenLabs account', executeWith: 'npm run voice:select -- --candidate A --execute --confirm-paid-api' };
  if (command === 'generate') return { dryRun: true, command, paidProviderCalls: inventory.apiCallsForFullGeneration, spokenCharacters: inventory.spokenCharacters, resumeSafe: true, executeWith: 'npm run voice:generate -- --execute --confirm-paid-api' };
  return { dryRun: true, command };
}

export async function main(argv = process.argv.slice(2)) {
  const [command = 'inventory', ...args] = argv;
  if (command === 'inventory') return academyVoiceInventory();
  if (command === 'preflight') return {
    apiKeyAvailable: Boolean(loadElevenLabsApiKey()),
    ffmpeg: requireTool('ffmpeg'),
    ffprobe: requireTool('ffprobe'),
    workRootIgnored: true,
    paidCallMade: false
  };
  if (!['audition', 'select', 'generate'].includes(command)) throw new Error(`Unknown Academy voice-production command: ${command}`);
  if (!paidExecutionRequested(args)) return dryRun(command, args);
  if (command === 'audition') return createAuditions();
  if (command === 'select') return selectVoice(args);
  return generatePack(args);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().then(result => console.log(json(result).trimEnd())).catch(error => { console.error(error.message); process.exitCode = 1; });
}
