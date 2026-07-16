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
const REVIEWED_DURATION_EXCEPTIONS = new Map([
  ['academy.contact-height.s2.entry', 'Reviewed at 8.1 seconds: one complete technical sentence, clear at low volume, with no removable pause or redundant wording.'],
  ['academy.plane-coupling.s0.entry', 'Reviewed at 8.1 seconds: the model-boundary warning remains intact and the explicit Flight glass pronunciation is clear.']
]);

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

export const STRESS_CUE_IDS = Object.freeze([
  'academy.home.orient',
  'academy.backspin.s1.build',
  'academy.backspin.s4.entry',
  'academy.start-line.s1.entry',
  'academy.carry-side.s1.cancel',
  'academy.attack.s2.entry',
  'academy.speed-transfer.s1.speed',
  'academy.plane-coupling.s0.entry'
]);

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

export const REFINEMENT_DIRECTIONS = Object.freeze({
  target: 'Preserve this voice identity, General American accent, grounded middle register and technical clarity. Make the delivery subtly more restrained and lower-energy, with softer emphatic peaks, natural short pauses and a calm 150 to 155 words-per-minute control-room cadence. Keep it dry, close-mic, confident and clear at low phone volume. Never breathy, intimate, chirpy or robotic.',
  theatrical: 'Preserve the appealing voice identity, General American accent and grounded timbre. Remove theatrical and dramatic delivery: shorten trailer-like pauses, flatten heightened stakes, reduce performative emphasis and use a calm 150 to 155 words-per-minute laboratory control-room cadence. Keep restrained warmth, precise diction, dry close-mic clarity and low fatigue. Never intimate, breathy, futuristic or chirpy.'
});

export const ALTERNATIVE_DIRECTIONS = Object.freeze({
  nordicLabLead: 'Adult female Nordic laboratory lead speaking near-native international English with only a faint Scandinavian cadence. Grounded lower-middle register, understated warmth, quiet confidence and precise scientific diction. Calm 150 to 155 words per minute, natural short pauses and dry close-mic clarity at low phone volume. Distinctly human and observant, never strongly accented, breathy, intimate, theatrical, chirpy or assistant-like.',
  flightDirector: 'Mature General American female aerospace flight director. Calm under pressure, concise, authoritative without severity and exceptionally clear. Grounded middle register, restrained emphasis, clipped but natural technical phrasing, 150 to 155 words per minute and dry close-mic delivery. Trustworthy over long sessions, never cinematic, militaristic, futuristic, breathy, chatty or robotic.',
  performanceScientist: 'Adult female elite golf performance scientist speaking General American English. Observant, practical and technically fluent with subtle athletic energy and humane curiosity. Clear grounded register, restrained warmth, concise 150 to 155 words-per-minute delivery and natural short pauses. Sounds like a scientist beside the player, never a motivational coach, virtual assistant, broadcaster, intimate narrator or theatrical character.'
});

export const BRITISH_SYSTEMS_ENGINEER_DIRECTION = 'Mature British female systems engineer with a neutral contemporary Southern British accent. Grounded lower-middle register, calm authority, restrained warmth and precise technical diction. Natural and unhurried at low phone volume. Never posh, theatrical, BBC-like, breathy, maternal or assistant-like.';

export const PACE_REFINEMENT_DIRECTION = 'Preserve this exact voice identity, mature character, accent, authority and grounded timbre. Slow the delivery to 150 to 160 words per minute with deliberate but natural short pauses between ideas. Keep the energy controlled, the warmth restrained and the technical diction exceptionally clear at low phone volume. Do not make the voice softer, older, breathier, theatrical, coachy or robotic; change pacing and emphasis, not identity.';

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

export function stressVoiceCatalog() {
  const byId = new Map(academyVoiceCatalog().map(cue => [cue.cueId, cue]));
  const cues = STRESS_CUE_IDS.map(cueId => byId.get(cueId));
  if (cues.some(cue => !cue)) throw new Error('Academy voice stress catalog references a missing cue.');
  return cues;
}

export function speakableText(text) {
  return String(text)
    .replace(/\bFlightglass\b/g, 'Flight glass')
    .replace(/\bflightglass\b/g, 'flight glass')
    .replace(/\brpm\b/gi, 'R P M');
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

export function createRefinementRequests(finalists) {
  if (!Array.isArray(finalists) || finalists.length !== 2) throw new TypeError('Voice refinement requires exactly two finalists.');
  const text = AUDITION_LINES.join(' ');
  return finalists.map((finalist, index) => {
    const sourceLabel = String(finalist.blindLabel || '').toUpperCase();
    const direction = REFINEMENT_DIRECTIONS[finalist.direction];
    if (!/^[A-Z]$/.test(sourceLabel) || !direction || !finalist.generatedVoiceId) throw new TypeError('Voice refinement finalist is incomplete.');
    return {
      sourceLabel,
      sourceDirection: finalist.direction,
      generatedVoiceId: finalist.generatedVoiceId,
      body: {
        voice_description: direction,
        text,
        auto_generate_text: false,
        loudness: 0.05,
        seed: 5201 + index,
        guidance_scale: 3
      }
    };
  });
}

export function createAlternativeRequests() {
  const text = AUDITION_LINES.join(' ');
  return Object.entries(ALTERNATIVE_DIRECTIONS).map(([direction, voiceDescription], index) => ({
    direction,
    body: {
      voice_description: voiceDescription,
      text,
      auto_generate_text: false,
      loudness: 0.05,
      quality: 0.9,
      seed: 6301 + index,
      guidance_scale: 3
    }
  }));
}

export function createBritishVoiceDesignRequest() {
  return {
    direction: 'britishSystemsEngineer',
    body: {
      voice_description: BRITISH_SYSTEMS_ENGINEER_DIRECTION,
      text: AUDITION_LINES.join(' '),
      auto_generate_text: false,
      loudness: 0.05,
      quality: 0.9,
      seed: 8501,
      guidance_scale: 4
    }
  };
}

export function createPaceRefinementRequest(candidate) {
  const sourceLabel = String(candidate?.blindLabel || '').toUpperCase();
  if (!/^R3-[A-I]$/.test(sourceLabel) || !candidate?.direction || !candidate?.generatedVoiceId) {
    throw new TypeError('Pace refinement requires one complete R3 candidate.');
  }
  return {
    sourceLabel,
    sourceDirection: candidate.direction,
    generatedVoiceId: candidate.generatedVoiceId,
    body: {
      voice_description: PACE_REFINEMENT_DIRECTION,
      text: AUDITION_LINES.join(' '),
      auto_generate_text: false,
      loudness: 0.05,
      seed: 7401,
      guidance_scale: 4
    }
  };
}

export function stableCueSeed(cueId) {
  return Number.parseInt(sha256(cueId).slice(0, 8), 16);
}

export function productionSpeed(value = 1) {
  const speed = Number(value);
  if (!Number.isFinite(speed) || speed < 0.7 || speed > 1.2) throw new TypeError('Academy voice speed must be between 0.7 and 1.2.');
  return speed;
}

export function selectionMatches(existing, { candidate, speed }) {
  return String(existing?.blindCandidate || '').toUpperCase() === String(candidate || '').toUpperCase()
    && productionSpeed(existing?.ttsSpeed || 1) === productionSpeed(speed || 1)
    && Boolean(existing?.voiceId);
}

export function reusableDesignedVoice(progress, candidate) {
  if (candidate?.sourceDirection !== 'britishSystemsEngineer' || !Number.isInteger(candidate?.variant)) return null;
  const voice = progress?.baseVoices?.find(item => item.variant === candidate.variant);
  return voice?.voiceId ? { voiceId: voice.voiceId, voiceName: voice.voiceName } : null;
}

export function createTtsRequest(cue, { speed = 1 } = {}) {
  return {
    text: speakableText(cue.text),
    model_id: MODEL_ID,
    voice_settings: {
      stability: 0.78,
      similarity_boost: 0.75,
      style: 0.05,
      use_speaker_boost: true,
      speed: productionSpeed(speed)
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

async function exploreAlternativeVoices() {
  const explorationRoot = resolve(WORK_ROOT, 'alternative-round-3');
  const auditionRoot = resolve(explorationRoot, 'auditions');
  const blindRoot = resolve(explorationRoot, 'blind');
  const privateRoot = resolve(WORK_ROOT, 'private');
  const provenancePath = resolve(privateRoot, 'alternative-round-3-provenance.json');
  ensureDir(auditionRoot); ensureDir(blindRoot); ensureDir(privateRoot);
  if (existsSync(provenancePath)) {
    const existing = JSON.parse(readFileSync(provenancePath, 'utf8'));
    return {
      existing: true,
      candidateCount: existing.candidates.length,
      blindDirectory: relative(ROOT, blindRoot).replaceAll('\\', '/'),
      paidProviderCalls: 0
    };
  }

  const key = requireApiKey();
  const candidates = [];
  for (const request of createAlternativeRequests()) {
    const response = await providerRequest(`/v1/text-to-voice/create-previews?output_format=${SOURCE_FORMAT}`, { key, body: request.body });
    for (const [index, preview] of response.previews.entries()) {
      const path = resolve(auditionRoot, `source-${request.direction}-${index + 1}.mp3`);
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
  const mapping = shuffled(candidates).map((candidate, index) => ({ blindLabel: `R3-${String.fromCharCode(65 + index)}`, ...candidate }));
  for (const candidate of mapping) {
    copyFileSync(resolve(WORK_ROOT, candidate.sourceFile), resolve(blindRoot, `${candidate.blindLabel}.mp3`));
  }
  writeJson(provenancePath, {
    schemaVersion: 1,
    round: 3,
    createdAt: new Date().toISOString(),
    provider: 'ElevenLabs',
    directions: Object.keys(ALTERNATIVE_DIRECTIONS),
    candidates: mapping
  });
  writeJson(resolve(blindRoot, 'instructions.json'), {
    schemaVersion: 1,
    round: 3,
    criteria: ['distinct Flightglass identity', 'clarity at low phone volume', 'technical trust', 'low fatigue'],
    auditionLines: AUDITION_LINES,
    verdictTemplate: { winner: null, identity: null, clarity: null, trust: null, lowFatigue: null, notes: '' },
    warning: 'Do not open ../../private/alternative-round-3-provenance.json until the round-three verdict is recorded.'
  });
  return {
    candidateCount: mapping.length,
    blindDirectory: relative(ROOT, blindRoot).replaceAll('\\', '/'),
    paidProviderCalls: createAlternativeRequests().length
  };
}

function paceRefinementLabel(args) {
  const label = String(argumentValue(args, '--candidate') || '').toUpperCase();
  if (!/^R3-[A-I]$/.test(label)) throw new Error('Refine exactly one round-three label with --candidate R3-D.');
  return label;
}

async function refineVoicePace(args) {
  const roundThreePath = resolve(WORK_ROOT, 'private', 'alternative-round-3-provenance.json');
  if (!existsSync(roundThreePath)) throw new Error('Run the round-three exploration stage first.');
  const sourceLabel = paceRefinementLabel(args);
  const roundThree = JSON.parse(readFileSync(roundThreePath, 'utf8'));
  const sourceCandidate = roundThree.candidates.find(item => item.blindLabel === sourceLabel);
  if (!sourceCandidate) throw new Error(`Round-three candidate ${sourceLabel} does not exist.`);
  const request = createPaceRefinementRequest(sourceCandidate);

  const refinementRoot = resolve(WORK_ROOT, 'pace-refinement-round-4');
  const auditionRoot = resolve(refinementRoot, 'auditions');
  const blindRoot = resolve(refinementRoot, 'blind');
  const privateRoot = resolve(WORK_ROOT, 'private');
  const progressPath = resolve(privateRoot, 'pace-refinement-round-4-progress.json');
  const provenancePath = resolve(privateRoot, 'pace-refinement-round-4-provenance.json');
  ensureDir(auditionRoot); ensureDir(blindRoot); ensureDir(privateRoot);

  if (existsSync(provenancePath)) {
    const existing = JSON.parse(readFileSync(provenancePath, 'utf8'));
    if (existing.sourceCandidate !== sourceLabel) throw new Error('Existing pace refinement belongs to a different round-three candidate.');
    return {
      existing: true,
      candidateCount: existing.candidates.length,
      blindDirectory: relative(ROOT, blindRoot).replaceAll('\\', '/'),
      paidProviderCalls: 0
    };
  }

  writeJson(resolve(blindRoot, 'round-3-finalist.json'), {
    schemaVersion: 1,
    recordedAt: new Date().toISOString(),
    finalist: sourceLabel,
    requestedChange: 'Preserve identity; slow to 150-160 words per minute with natural pauses and controlled warmth.'
  });

  const key = requireApiKey();
  const progress = existsSync(progressPath)
    ? JSON.parse(readFileSync(progressPath, 'utf8'))
    : { schemaVersion: 1, sourceCandidate: sourceLabel, baseVoice: null, candidates: [] };
  if (progress.sourceCandidate !== sourceLabel) throw new Error('Existing pace-refinement progress belongs to a different candidate.');
  let paidProviderCalls = 0;

  if (!progress.baseVoice) {
    const created = await providerRequest('/v1/text-to-voice', {
      key,
      body: {
        voice_name: `Flightglass ${sourceLabel} Pace Base`,
        voice_description: ALTERNATIVE_DIRECTIONS[sourceCandidate.direction] || PACE_REFINEMENT_DIRECTION,
        generated_voice_id: request.generatedVoiceId,
        labels: { accent: 'American', age: 'adult', gender: 'female', use_case: 'education', stage: 'temporary-pace-finalist' }
      }
    });
    progress.baseVoice = { voiceId: created.voice_id, voiceName: created.name };
    writeJson(progressPath, progress);
  }

  if (progress.candidates.length === 0) {
    const response = await providerRequest(`/v1/text-to-voice/${encodeURIComponent(progress.baseVoice.voiceId)}/remix?output_format=${SOURCE_FORMAT}`, {
      key,
      body: request.body
    });
    paidProviderCalls += 1;
    for (const [index, preview] of response.previews.entries()) {
      const path = resolve(auditionRoot, `source-${sourceLabel}-${index + 1}.mp3`);
      writeFileSync(path, Buffer.from(preview.audio_base_64, 'base64'));
      progress.candidates.push({
        sourceLabel,
        sourceDirection: request.sourceDirection,
        variant: index + 1,
        generatedVoiceId: preview.generated_voice_id,
        durationSeconds: preview.duration_secs,
        mediaType: preview.media_type,
        sourceFile: relative(WORK_ROOT, path).replaceAll('\\', '/'),
        refinementDescriptionSha256: sha256(request.body.voice_description),
        auditionTextSha256: sha256(request.body.text)
      });
    }
    writeJson(progressPath, progress);
  }

  const mapping = shuffled(progress.candidates).map((candidate, index) => ({ blindLabel: `R4-${String.fromCharCode(65 + index)}`, ...candidate }));
  for (const candidate of mapping) {
    copyFileSync(resolve(WORK_ROOT, candidate.sourceFile), resolve(blindRoot, `${candidate.blindLabel}.mp3`));
  }
  writeJson(provenancePath, {
    schemaVersion: 1,
    round: 4,
    createdAt: new Date().toISOString(),
    provider: 'ElevenLabs',
    sourceCandidate: sourceLabel,
    candidates: mapping
  });
  writeJson(resolve(blindRoot, 'instructions.json'), {
    schemaVersion: 1,
    round: 4,
    criteria: ['preserved R3 identity', '150-160 words per minute', 'natural pauses', 'technical trust', 'low fatigue'],
    auditionLines: AUDITION_LINES,
    verdictTemplate: { winner: null, identity: null, pace: null, trust: null, lowFatigue: null, notes: '' },
    warning: 'Do not open ../../private/pace-refinement-round-4-provenance.json until the round-four verdict is recorded.'
  });
  return {
    candidateCount: mapping.length,
    blindDirectory: relative(ROOT, blindRoot).replaceAll('\\', '/'),
    paidProviderCalls,
    temporaryBaseVoicesCreated: 1
  };
}

async function createPacePreview(args) {
  const sourceLabel = paceRefinementLabel(args);
  const speed = productionSpeed(argumentValue(args, '--speed') || 0.8);
  const progressPath = resolve(WORK_ROOT, 'private', 'pace-refinement-round-4-progress.json');
  if (!existsSync(progressPath)) throw new Error('Run pace refinement once to create the temporary R3 base voice.');
  const progress = JSON.parse(readFileSync(progressPath, 'utf8'));
  if (progress.sourceCandidate !== sourceLabel || !progress.baseVoice?.voiceId) {
    throw new Error(`The temporary pace base does not belong to ${sourceLabel}.`);
  }
  const previewRoot = resolve(WORK_ROOT, 'pace-refinement-round-4', 'speed-previews');
  const speedToken = speed.toFixed(2).replace('.', '_');
  const previewPath = resolve(previewRoot, `${sourceLabel}-speed-${speedToken}.mp3`);
  ensureDir(previewRoot);
  if (existsSync(previewPath)) {
    return {
      existing: true,
      candidate: sourceLabel,
      speed,
      previewFile: relative(ROOT, previewPath).replaceAll('\\', '/'),
      paidProviderCalls: 0
    };
  }
  const text = AUDITION_LINES.join(' ');
  const key = requireApiKey();
  const audio = await providerRequest(`/v1/text-to-speech/${encodeURIComponent(progress.baseVoice.voiceId)}?output_format=${SOURCE_FORMAT}`, {
    key,
    body: createTtsRequest({ cueId: `academy.voice.pace-preview.${sourceLabel.toLowerCase()}`, text }, { speed }),
    audio: true
  });
  writeFileSync(previewPath, audio);
  return {
    candidate: sourceLabel,
    speed,
    previewFile: relative(ROOT, previewPath).replaceAll('\\', '/'),
    paidProviderCalls: 1
  };
}

async function createBritishSystemsEngineerAudition(args) {
  requireTool('ffmpeg'); requireTool('ffprobe');
  const speed = productionSpeed(argumentValue(args, '--speed') || 0.8);
  const roundRoot = resolve(WORK_ROOT, 'british-systems-engineer-round-5');
  const designRoot = resolve(roundRoot, 'voice-design');
  const ttsRoot = resolve(roundRoot, 'tts');
  const normalizedRoot = resolve(roundRoot, 'normalized');
  const blindRoot = resolve(roundRoot, 'blind');
  const privateRoot = resolve(WORK_ROOT, 'private');
  const progressPath = resolve(privateRoot, 'british-systems-engineer-round-5-progress.json');
  const provenancePath = resolve(privateRoot, 'british-systems-engineer-round-5-provenance.json');
  ensureDir(designRoot); ensureDir(ttsRoot); ensureDir(normalizedRoot); ensureDir(blindRoot); ensureDir(privateRoot);

  if (existsSync(provenancePath)) {
    const existing = JSON.parse(readFileSync(provenancePath, 'utf8'));
    if (existing.ttsSpeed !== speed) throw new Error('Existing British audition uses a different TTS speed.');
    return {
      existing: true,
      candidateCount: existing.candidates.length,
      britishCandidates: existing.candidates.filter(item => item.comparisonRole === 'british-challenger').length,
      controlCandidate: 'R3-D',
      speed,
      blindDirectory: relative(ROOT, blindRoot).replaceAll('\\', '/'),
      paidProviderCalls: 0
    };
  }

  const roundThreePath = resolve(privateRoot, 'alternative-round-3-provenance.json');
  const controlRawPath = resolve(WORK_ROOT, 'pace-refinement-round-4', 'speed-previews', 'R3-D-speed-0_80.mp3');
  if (!existsSync(roundThreePath) || !existsSync(controlRawPath)) throw new Error('R3-D at speed 0.8 is required as the blind control.');
  const roundThree = JSON.parse(readFileSync(roundThreePath, 'utf8'));
  const controlSource = roundThree.candidates.find(item => item.blindLabel === 'R3-D');
  if (!controlSource?.generatedVoiceId) throw new Error('R3-D private provenance is incomplete.');

  const key = requireApiKey();
  const progress = existsSync(progressPath)
    ? JSON.parse(readFileSync(progressPath, 'utf8'))
    : { schemaVersion: 1, ttsSpeed: speed, designCandidates: [], baseVoices: [], ttsCandidates: [] };
  if (progress.ttsSpeed !== speed) throw new Error('Existing British audition progress uses a different TTS speed.');
  let paidProviderCalls = 0;

  if (progress.designCandidates.length === 0) {
    const request = createBritishVoiceDesignRequest();
    const response = await providerRequest(`/v1/text-to-voice/create-previews?output_format=${SOURCE_FORMAT}`, { key, body: request.body });
    paidProviderCalls += 1;
    for (const [index, preview] of response.previews.entries()) {
      const sourcePath = resolve(designRoot, `british-${index + 1}.mp3`);
      writeFileSync(sourcePath, Buffer.from(preview.audio_base_64, 'base64'));
      progress.designCandidates.push({
        variant: index + 1,
        generatedVoiceId: preview.generated_voice_id,
        sourceFile: relative(WORK_ROOT, sourcePath).replaceAll('\\', '/'),
        voiceDescriptionSha256: sha256(request.body.voice_description),
        auditionTextSha256: sha256(request.body.text)
      });
    }
    writeJson(progressPath, progress);
  }

  const comparisonText = AUDITION_LINES.join(' ');
  for (const candidate of progress.designCandidates) {
    let baseVoice = progress.baseVoices.find(item => item.variant === candidate.variant);
    if (!baseVoice) {
      const created = await providerRequest('/v1/text-to-voice', {
        key,
        body: {
          voice_name: `Flightglass British Systems Engineer ${candidate.variant}`,
          voice_description: BRITISH_SYSTEMS_ENGINEER_DIRECTION,
          generated_voice_id: candidate.generatedVoiceId,
          labels: { accent: 'British', age: 'adult', gender: 'female', use_case: 'education', stage: 'temporary-british-audition' }
        }
      });
      baseVoice = { variant: candidate.variant, voiceId: created.voice_id, voiceName: created.name };
      progress.baseVoices.push(baseVoice);
      writeJson(progressPath, progress);
    }

    if (progress.ttsCandidates.some(item => item.variant === candidate.variant)) continue;
    const rawPath = resolve(ttsRoot, `british-${candidate.variant}-speed-${speed.toFixed(2).replace('.', '_')}.mp3`);
    const normalizedPath = resolve(normalizedRoot, `british-${candidate.variant}.m4a`);
    const audio = await providerRequest(`/v1/text-to-speech/${encodeURIComponent(baseVoice.voiceId)}?output_format=${SOURCE_FORMAT}`, {
      key,
      body: createTtsRequest({ cueId: 'academy.voice.british-comparison', text: comparisonText }, { speed }),
      audio: true
    });
    paidProviderCalls += 1;
    writeFileSync(rawPath, audio);
    processAudio(rawPath, normalizedPath);
    progress.ttsCandidates.push({
      comparisonRole: 'british-challenger',
      sourceDirection: 'britishSystemsEngineer',
      variant: candidate.variant,
      generatedVoiceId: candidate.generatedVoiceId,
      ttsSpeed: speed,
      sourceFile: relative(WORK_ROOT, rawPath).replaceAll('\\', '/'),
      comparisonFile: relative(WORK_ROOT, normalizedPath).replaceAll('\\', '/')
    });
    writeJson(progressPath, progress);
  }

  const controlNormalizedPath = resolve(normalizedRoot, 'r3-d-control.m4a');
  if (!existsSync(controlNormalizedPath)) processAudio(controlRawPath, controlNormalizedPath);
  const controlCandidate = {
    comparisonRole: 'r3-d-control',
    sourceLabel: 'R3-D',
    sourceDirection: controlSource.direction,
    generatedVoiceId: controlSource.generatedVoiceId,
    ttsSpeed: speed,
    sourceFile: relative(WORK_ROOT, controlRawPath).replaceAll('\\', '/'),
    comparisonFile: relative(WORK_ROOT, controlNormalizedPath).replaceAll('\\', '/')
  };
  const mapping = shuffled([...progress.ttsCandidates, controlCandidate]).map((candidate, index) => ({ blindLabel: `R5-${String.fromCharCode(65 + index)}`, ...candidate }));
  for (const candidate of mapping) {
    copyFileSync(resolve(WORK_ROOT, candidate.comparisonFile), resolve(blindRoot, `${candidate.blindLabel}.m4a`));
  }
  writeJson(provenancePath, {
    schemaVersion: 1,
    round: 5,
    createdAt: new Date().toISOString(),
    provider: 'ElevenLabs',
    ttsSpeed: speed,
    controlCandidate: 'R3-D',
    candidates: mapping
  });
  writeJson(resolve(blindRoot, 'instructions.json'), {
    schemaVersion: 1,
    round: 5,
    criteria: ['distinct Flightglass identity', 'technical clarity', 'authority without distance', 'low fatigue', 'no posh or assistant affect'],
    auditionLines: AUDITION_LINES,
    verdictTemplate: { winner: null, identity: null, clarity: null, authority: null, lowFatigue: null, notes: '' },
    warning: 'Do not open ../../private/british-systems-engineer-round-5-provenance.json until the round-five verdict is recorded.'
  });
  return {
    candidateCount: mapping.length,
    britishCandidates: progress.ttsCandidates.length,
    controlCandidate: 'R3-D',
    speed,
    blindDirectory: relative(ROOT, blindRoot).replaceAll('\\', '/'),
    paidProviderCalls,
    temporaryBaseVoicesCreated: progress.baseVoices.length
  };
}

function argumentValue(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
}

function refinementLabels(args) {
  const labels = String(argumentValue(args, '--finalists') || 'B,E').toUpperCase().split(',').map(label => label.trim()).filter(Boolean);
  if (labels.length !== 2 || new Set(labels).size !== 2 || labels.some(label => !/^[A-Z]$/.test(label))) {
    throw new Error('Refine exactly two round-one labels with --finalists B,E.');
  }
  return labels;
}

async function refineVoices(args) {
  const roundOnePath = resolve(WORK_ROOT, 'private', 'provenance-map.json');
  if (!existsSync(roundOnePath)) throw new Error('Run the round-one audition stage first.');
  const labels = refinementLabels(args);
  const roundOne = JSON.parse(readFileSync(roundOnePath, 'utf8'));
  const finalists = labels.map(label => roundOne.candidates.find(item => item.blindLabel === label));
  if (finalists.some(item => !item)) throw new Error(`Round-one finalists ${labels.join(',')} do not all exist.`);

  const refinementRoot = resolve(WORK_ROOT, 'refinement-round-2');
  const auditionRoot = resolve(refinementRoot, 'auditions');
  const blindRoot = resolve(refinementRoot, 'blind');
  const privateRoot = resolve(WORK_ROOT, 'private');
  const progressPath = resolve(privateRoot, 'refinement-round-2-progress.json');
  const provenancePath = resolve(privateRoot, 'refinement-round-2-provenance.json');
  ensureDir(auditionRoot); ensureDir(blindRoot); ensureDir(privateRoot);

  if (existsSync(provenancePath)) {
    const existing = JSON.parse(readFileSync(provenancePath, 'utf8'));
    return {
      existing: true,
      candidateCount: existing.candidates.length,
      blindDirectory: relative(ROOT, blindRoot).replaceAll('\\', '/'),
      paidProviderCalls: 0
    };
  }

  writeJson(resolve(blindRoot, 'round-1-finalists.json'), {
    schemaVersion: 1,
    recordedAt: new Date().toISOString(),
    finalists: labels,
    criteria: ['clarity at low phone volume', 'technical trust', 'low fatigue', 'Control Room fit'],
    note: 'Round-one provenance was opened only after these finalists were recorded.'
  });

  const key = requireApiKey();
  const progress = existsSync(progressPath)
    ? JSON.parse(readFileSync(progressPath, 'utf8'))
    : { schemaVersion: 1, finalists: labels, baseVoices: [], candidates: [] };
  if (progress.finalists.join(',') !== labels.join(',')) throw new Error('Existing refinement progress belongs to different finalists.');
  const requests = createRefinementRequests(finalists);
  let paidProviderCalls = 0;

  for (const request of requests) {
    let baseVoice = progress.baseVoices.find(item => item.sourceLabel === request.sourceLabel);
    if (!baseVoice) {
      const created = await providerRequest('/v1/text-to-voice', {
        key,
        body: {
          voice_name: `Flightglass Finalist ${request.sourceLabel} Base`,
          voice_description: VOICE_DIRECTIONS[request.sourceDirection],
          generated_voice_id: request.generatedVoiceId,
          labels: { accent: 'American', age: 'adult', gender: 'female', use_case: 'education', stage: 'temporary-finalist' }
        }
      });
      baseVoice = { sourceLabel: request.sourceLabel, voiceId: created.voice_id, voiceName: created.name };
      progress.baseVoices.push(baseVoice);
      writeJson(progressPath, progress);
    }

    if (progress.candidates.some(item => item.sourceLabel === request.sourceLabel)) continue;
    const response = await providerRequest(`/v1/text-to-voice/${encodeURIComponent(baseVoice.voiceId)}/remix?output_format=${SOURCE_FORMAT}`, {
      key,
      body: request.body
    });
    paidProviderCalls += 1;
    for (const [index, preview] of response.previews.entries()) {
      const path = resolve(auditionRoot, `source-${request.sourceLabel}-${index + 1}.mp3`);
      writeFileSync(path, Buffer.from(preview.audio_base_64, 'base64'));
      progress.candidates.push({
        sourceLabel: request.sourceLabel,
        sourceDirection: request.sourceDirection,
        variant: index + 1,
        generatedVoiceId: preview.generated_voice_id,
        durationSeconds: preview.duration_secs,
        mediaType: preview.media_type,
        sourceFile: relative(WORK_ROOT, path).replaceAll('\\', '/'),
        refinementDescriptionSha256: sha256(request.body.voice_description),
        auditionTextSha256: sha256(request.body.text)
      });
    }
    writeJson(progressPath, progress);
  }

  const mapping = shuffled(progress.candidates).map((candidate, index) => ({ blindLabel: `R2-${String.fromCharCode(65 + index)}`, ...candidate }));
  for (const candidate of mapping) {
    copyFileSync(resolve(WORK_ROOT, candidate.sourceFile), resolve(blindRoot, `${candidate.blindLabel}.mp3`));
  }
  writeJson(provenancePath, {
    schemaVersion: 1,
    round: 2,
    createdAt: new Date().toISOString(),
    provider: 'ElevenLabs',
    roundOneFinalists: labels,
    candidates: mapping
  });
  writeJson(resolve(blindRoot, 'instructions.json'), {
    schemaVersion: 1,
    round: 2,
    criteria: ['clarity at low phone volume', 'technical trust', 'low fatigue', 'Control Room fit'],
    auditionLines: AUDITION_LINES,
    verdictTemplate: { winner: null, clarity: null, trust: null, lowFatigue: null, notes: '' },
    warning: 'Do not open ../../private/refinement-round-2-provenance.json until the round-two verdict is recorded.'
  });
  return {
    candidateCount: mapping.length,
    blindDirectory: relative(ROOT, blindRoot).replaceAll('\\', '/'),
    paidProviderCalls,
    temporaryBaseVoicesCreated: progress.baseVoices.length
  };
}

export function selectionProvenanceFile(candidate) {
  const label = String(candidate || '').toUpperCase();
  if (!/^(?:[A-Z]|R2-[A-F]|R3-[A-I]|R4-[A-C]|R5-[A-D])$/.test(label)) throw new Error('Select one blind label from rounds 1-5, for example --candidate R5-A.');
  if (label.startsWith('R5-')) return 'british-systems-engineer-round-5-provenance.json';
  if (label.startsWith('R4-')) return 'pace-refinement-round-4-provenance.json';
  if (label.startsWith('R3-')) return 'alternative-round-3-provenance.json';
  return label.startsWith('R2-') ? 'refinement-round-2-provenance.json' : 'provenance-map.json';
}

async function selectVoice(args) {
  const label = String(argumentValue(args, '--candidate') || '').toUpperCase();
  const selectedPath = resolve(WORK_ROOT, 'private', 'selected-voice.json');
  if (existsSync(selectedPath)) {
    const existing = JSON.parse(readFileSync(selectedPath, 'utf8'));
    const requestedSpeed = productionSpeed(argumentValue(args, '--speed') || existing.ttsSpeed || 1);
    if (!selectionMatches(existing, { candidate: label, speed: requestedSpeed })) {
      throw new Error(`Final voice is already selected as ${existing.blindCandidate} at speed ${existing.ttsSpeed}.`);
    }
    return { existing: true, selected: true, blindCandidate: label, voiceId: existing.voiceId, ttsSpeed: requestedSpeed, next: 'npm run voice:generate -- --execute --confirm-paid-api' };
  }
  const provenancePath = resolve(WORK_ROOT, 'private', selectionProvenanceFile(label));
  if (!existsSync(provenancePath)) throw new Error('Run the audition stage first.');
  const provenance = JSON.parse(readFileSync(provenancePath, 'utf8'));
  const candidate = provenance.candidates.find(item => item.blindLabel === label);
  if (!candidate) throw new Error(`Blind candidate ${label} does not exist.`);
  const ttsSpeed = productionSpeed(argumentValue(args, '--speed') || candidate.ttsSpeed || 1);
  const sourceDirection = candidate.direction || candidate.sourceDirection;
  const voiceDescription = sourceDirection === 'britishSystemsEngineer'
    ? BRITISH_SYSTEMS_ENGINEER_DIRECTION
    : ALTERNATIVE_DIRECTIONS[sourceDirection] || VOICE_DIRECTIONS[sourceDirection] || VOICE_DIRECTIONS.target;
  const britishProgressPath = resolve(WORK_ROOT, 'private', 'british-systems-engineer-round-5-progress.json');
  const reusable = existsSync(britishProgressPath)
    ? reusableDesignedVoice(JSON.parse(readFileSync(britishProgressPath, 'utf8')), candidate)
    : null;
  const selected = reusable
    ? { voice_id: reusable.voiceId, name: reusable.voiceName }
    : await providerRequest('/v1/text-to-voice', {
      key: requireApiKey(),
      body: {
        voice_name: 'Flightglass Control Room',
        voice_description: voiceDescription,
        generated_voice_id: candidate.generatedVoiceId,
        labels: { accent: sourceDirection === 'britishSystemsEngineer' ? 'British' : 'American', age: 'adult', gender: 'female', use_case: 'education' },
        played_not_selected_voice_ids: provenance.candidates.filter(item => item.generatedVoiceId !== candidate.generatedVoiceId).map(item => item.generatedVoiceId)
      }
    });
  const record = {
    schemaVersion: 1,
    selectedAt: new Date().toISOString(),
    provider: 'ElevenLabs',
    blindCandidate: label,
    sourceDirection,
    refinementSourceLabel: candidate.sourceLabel || null,
    generatedVoiceId: candidate.generatedVoiceId,
    voiceId: selected.voice_id,
    voiceName: selected.name,
    reusedAuditionVoice: Boolean(reusable),
    ttsSpeed,
    modelId: MODEL_ID,
    sourceFormat: SOURCE_FORMAT
  };
  writeJson(selectedPath, record);
  return { selected: true, blindCandidate: label, voiceId: record.voiceId, ttsSpeed, reusedAuditionVoice: record.reusedAuditionVoice, next: 'npm run voice:generate -- --execute --confirm-paid-api' };
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
  const record = {
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
  const durationReviewNote = REVIEWED_DURATION_EXCEPTIONS.get(cue.cueId);
  if (durationReviewNote) {
    record.reviewedDurationException = true;
    record.durationReviewNote = durationReviewNote;
  }
  return record;
}

async function generatePack(args) {
  requireTool('ffmpeg'); requireTool('ffprobe');
  const selectedPath = resolve(WORK_ROOT, 'private', 'selected-voice.json');
  if (!existsSync(selectedPath)) throw new Error('Select a blind audition winner before full generation.');
  const selected = JSON.parse(readFileSync(selectedPath, 'utf8'));
  const key = requireApiKey();
  const requestedLimit = Number(argumentValue(args, '--limit'));
  const allCues = academyVoiceCatalog();
  const stressRequested = args.includes('--stress');
  const cues = stressRequested ? stressVoiceCatalog() : Number.isInteger(requestedLimit) && requestedLimit > 0 ? allCues.slice(0, requestedLimit) : allCues;
  const rawRoot = resolve(WORK_ROOT, 'raw');
  const records = [];
  ensureDir(rawRoot); ensureDir(ASSET_ROOT);
  for (const [index, cue] of cues.entries()) {
    const rawPath = resolve(rawRoot, `${cue.stem}.mp3`);
    const finalPath = resolve(ASSET_ROOT, cue.relativeAssetPath);
    if (!existsSync(finalPath) || args.includes('--reprocess')) {
      if (!existsSync(rawPath)) {
        const audio = await providerRequest(`/v1/text-to-speech/${encodeURIComponent(selected.voiceId)}?output_format=${SOURCE_FORMAT}`, { key, body: createTtsRequest(cue, { speed: selected.ttsSpeed || 1 }), audio: true });
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
    rightsStatus: 'approved-for-distribution',
    rightsEvidence: {
      providerPlan: 'ElevenLabs Creator (owner-confirmed before generation)',
      generatedDuringPaidPlan: true,
      retrievedAt: '2026-07-16',
      sources: [
        'https://elevenlabs.io/terms-of-use',
        'https://elevenlabs.io/docs/overview/administration/billing',
        'https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform'
      ],
      basis: 'Paid-plan speech output may be used commercially; Flightglass owns the cue copy and uses a generated Voice Design identity, not a cloned third-party voice.'
    },
    voiceIdentityStatus: 'approved-owner-blind-r5-a',
    humanFatigueStatus: 'pending-owner-five-minute-fatigue-listen',
    devicePlaybackStatus: 'pending-physical-device-and-audio-route-check',
    voiceOverStatus: 'pending-ios-voiceover-check',
    selectionEvidence: { blindWinner:'R5-A', comparisonControl:'R5-D / R3-D', selectedAt:selected.selectedAt, ttsSpeed:selected.ttsSpeed || 1 },
    productionGuide: 'Mature British female systems engineer; neutral contemporary Southern British accent; grounded lower-middle register; calm authority, restrained warmth and precise technical diction at speed 0.8. Never posh, theatrical, BBC-like, breathy, maternal or assistant-like.',
    provider: { name: 'ElevenLabs', voiceId: selected.voiceId, modelId: MODEL_ID, ttsSpeed: selected.ttsSpeed || 1, generatedUnderPaidPlan: true },
    assets: records
  };
  const manifestPath = resolve(WORK_ROOT, 'academy-voice-pack.generated.json');
  writeJson(manifestPath, config);
  if (!stressRequested && records.length === allCues.length) {
    writeJson(resolve(ROOT, 'config', 'academy-voice-pack.json'), config);
  }
  return {
    generatedAssets: records.length,
    expectedAssets: allCues.length,
    stress: stressRequested,
    complete: records.length === allCues.length,
    manifest: relative(ROOT, manifestPath).replaceAll('\\', '/'),
    releaseStatus: 'PENDING HUMAN FATIGUE, PHYSICAL-DEVICE AND VOICEOVER REVIEW'
  };
}

function dryRun(command, args) {
  const inventory = academyVoiceInventory();
  if (command === 'audition') return { dryRun: true, command, paidProviderCalls: 3, characters: createAuditionRequests().reduce((sum, request) => sum + request.body.text.length, 0), executeWith: 'npm run voice:audition -- --execute --confirm-paid-api' };
  if (command === 'explore') return {
    dryRun: true,
    command,
    directions: Object.keys(ALTERNATIVE_DIRECTIONS),
    paidProviderCalls: 3,
    characters: createAlternativeRequests().reduce((sum, request) => sum + request.body.text.length, 0),
    expectedBlindCandidates: 9,
    executeWith: 'npm run voice:explore -- --execute --confirm-paid-api'
  };
  if (command === 'refine') {
    const finalists = refinementLabels(args);
    return {
      dryRun: true,
      command,
      finalists,
      temporaryVoiceCreations: 2,
      paidProviderCalls: 2,
      characters: AUDITION_LINES.join(' ').length * 2,
      expectedBlindCandidates: 6,
      executeWith: `npm run voice:refine -- --finalists ${finalists.join(',')} --execute --confirm-paid-api`
    };
  }
  if (command === 'pace-refine') {
    const candidate = paceRefinementLabel(args);
    return {
      dryRun: true,
      command,
      candidate,
      temporaryVoiceCreations: 1,
      paidProviderCalls: 1,
      characters: AUDITION_LINES.join(' ').length,
      expectedBlindCandidates: 3,
      executeWith: `npm run voice:pace-refine -- --candidate ${candidate} --execute --confirm-paid-api`
    };
  }
  if (command === 'pace-preview') {
    const candidate = paceRefinementLabel(args);
    const speed = productionSpeed(argumentValue(args, '--speed') || 0.8);
    return {
      dryRun: true,
      command,
      candidate,
      speed,
      paidProviderCalls: 1,
      characters: AUDITION_LINES.join(' ').length,
      executeWith: `npm run voice:pace-preview -- --candidate ${candidate} --speed ${speed} --execute --confirm-paid-api`
    };
  }
  if (command === 'british-audition') {
    const speed = productionSpeed(argumentValue(args, '--speed') || 0.8);
    return {
      dryRun: true,
      command,
      candidateCount: 4,
      britishCandidates: 3,
      controlCandidate: 'R3-D',
      speed,
      temporaryVoiceCreations: 3,
      paidProviderCalls: 4,
      characters: AUDITION_LINES.join(' ').length * 4,
      executeWith: `npm run voice:british-audition -- --speed ${speed} --execute --confirm-paid-api`
    };
  }
  if (command === 'select') {
    const candidate = String(argumentValue(args, '--candidate') || 'A').toUpperCase();
    const speed = productionSpeed(argumentValue(args, '--speed') || 1);
    return { dryRun: true, command, candidate, speed, externalMutation: 'Creates the selected designed voice in the ElevenLabs account', executeWith: `npm run voice:select -- --candidate ${candidate} --speed ${speed} --execute --confirm-paid-api` };
  }
  if (command === 'generate') {
    const stressRequested = args.includes('--stress');
    const cues = stressRequested ? stressVoiceCatalog() : academyVoiceCatalog();
    return {
      dryRun: true,
      command,
      stress: stressRequested,
      paidProviderCalls: cues.length,
      spokenCharacters: cues.reduce((total, cue) => total + speakableText(cue.text).length, 0),
      resumeSafe: true,
      executeWith: stressRequested ? 'npm run voice:stress -- --execute --confirm-paid-api' : 'npm run voice:generate -- --execute --confirm-paid-api'
    };
  }
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
  if (!['audition', 'explore', 'refine', 'pace-refine', 'pace-preview', 'british-audition', 'select', 'generate'].includes(command)) throw new Error(`Unknown Academy voice-production command: ${command}`);
  if (!paidExecutionRequested(args)) return dryRun(command, args);
  if (command === 'audition') return createAuditions();
  if (command === 'explore') return exploreAlternativeVoices();
  if (command === 'refine') return refineVoices(args);
  if (command === 'pace-refine') return refineVoicePace(args);
  if (command === 'pace-preview') return createPacePreview(args);
  if (command === 'british-audition') return createBritishSystemsEngineerAudition(args);
  if (command === 'select') return selectVoice(args);
  return generatePack(args);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().then(result => console.log(json(result).trimEnd())).catch(error => { console.error(error.message); process.exitCode = 1; });
}
