import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  ALTERNATIVE_DIRECTIONS,
  AUDITION_LINES,
  PACE_REFINEMENT_DIRECTION,
  VOICE_DIRECTIONS,
  academyVoiceCatalog,
  academyVoiceInventory,
  buildFfmpegArgs,
  createAuditionRequests,
  createAlternativeRequests,
  createPaceRefinementRequest,
  createRefinementRequests,
  createTtsRequest,
  loadElevenLabsApiKey,
  main,
  paidExecutionRequested,
  productionSpeed,
  safeCueStem,
  selectionProvenanceFile,
  speakableText,
  stableCueSeed
} from './academy-voice-production.mjs';

test('production inventory is derived from all 102 exact caption cues', () => {
  const inventory = academyVoiceInventory();
  assert.equal(inventory.packId, 'control-room-en-us-v1');
  assert.equal(inventory.cueCount, 102);
  assert.equal(inventory.wordCount, 1546);
  assert.equal(inventory.ownerCount, 15);
  assert.equal(inventory.estimatedMinutesAt155Wpm, 10);
  assert.ok(inventory.spokenCharacters > inventory.captionCharacters);
});

test('every cue receives one unique verifier-safe local asset path', () => {
  const catalog = academyVoiceCatalog();
  const paths = new Set(catalog.map(cue => cue.relativeAssetPath));
  assert.equal(paths.size, 102);
  for (const cue of catalog) {
    assert.match(cue.relativeAssetPath, /^[a-z0-9_-]+\/[a-z0-9_-]+\.m4a$/);
    assert.equal(cue.relativeAssetPath.includes('..'), false);
  }
  assert.equal(safeCueStem('academy.backspin.s2.entry'), 'backspin-s2-entry');
  assert.throws(() => safeCueStem('...'));
});

test('audition stage compares target, theatrical and generic directions on identical copy', () => {
  const requests = createAuditionRequests();
  assert.deepEqual(requests.map(request => request.direction), ['target', 'theatrical', 'generic']);
  assert.equal(Object.keys(VOICE_DIRECTIONS).length, 3);
  assert.equal(AUDITION_LINES.length, 3);
  assert.ok(requests[0].body.text.length >= 100 && requests[0].body.text.length <= 1000);
  assert.equal(new Set(requests.map(request => request.body.text)).size, 1);
  assert.equal(requests.some(request => 'xi-api-key' in request.body), false);
});

test('refinement stage preserves B and E identity while correcting different delivery risks', () => {
  const requests = createRefinementRequests([
    { blindLabel: 'B', direction: 'target', generatedVoiceId: 'generated-b' },
    { blindLabel: 'E', direction: 'theatrical', generatedVoiceId: 'generated-e' }
  ]);
  assert.deepEqual(requests.map(request => request.sourceLabel), ['B', 'E']);
  assert.deepEqual(requests.map(request => request.generatedVoiceId), ['generated-b', 'generated-e']);
  assert.equal(new Set(requests.map(request => request.body.text)).size, 1);
  assert.match(requests[0].body.voice_description, /restrained|emphatic/i);
  assert.match(requests[1].body.voice_description, /theatrical|dramatic/i);
  assert.equal(requests.every(request => request.body.auto_generate_text === false), true);
  assert.equal(requests.every(request => request.body.text.length >= 100 && request.body.text.length <= 1000), true);
  assert.equal(requests.every(request => request.body.loudness <= 0.1), true);
  assert.equal(requests.some(request => 'xi-api-key' in request.body), false);
});

test('alternative round explores three distinct Flightglass brand voices on identical copy', () => {
  const requests = createAlternativeRequests();
  assert.deepEqual(requests.map(request => request.direction), ['nordicLabLead', 'flightDirector', 'performanceScientist']);
  assert.equal(Object.keys(ALTERNATIVE_DIRECTIONS).length, 3);
  assert.equal(new Set(requests.map(request => request.body.text)).size, 1);
  assert.equal(new Set(requests.map(request => request.body.voice_description)).size, 3);
  assert.equal(requests.every(request => request.body.loudness <= 0.1), true);
  assert.equal(requests.some(request => 'xi-api-key' in request.body), false);
});

test('pace refinement preserves one R3 identity while explicitly slowing the delivery', () => {
  const request = createPaceRefinementRequest({
    blindLabel: 'R3-D',
    direction: 'flightDirector',
    generatedVoiceId: 'generated-r3-d'
  });
  assert.equal(request.sourceLabel, 'R3-D');
  assert.equal(request.sourceDirection, 'flightDirector');
  assert.equal(request.generatedVoiceId, 'generated-r3-d');
  assert.equal(request.body.text, AUDITION_LINES.join(' '));
  assert.equal(request.body.auto_generate_text, false);
  assert.equal(request.body.loudness <= 0.1, true);
  assert.match(PACE_REFINEMENT_DIRECTION, /preserve.*voice identity/i);
  assert.match(PACE_REFINEMENT_DIRECTION, /150 to 160 words per minute/i);
  assert.match(PACE_REFINEMENT_DIRECTION, /natural.*pauses/i);
  assert.equal('xi-api-key' in request.body, false);
  assert.throws(() => createPaceRefinementRequest({ blindLabel: 'D', generatedVoiceId: 'wrong-round' }));
});

test('round-two selection stays on its separate private provenance map', () => {
  assert.equal(selectionProvenanceFile('B'), 'provenance-map.json');
  assert.equal(selectionProvenanceFile('r2-e'), 'refinement-round-2-provenance.json');
  assert.equal(selectionProvenanceFile('r3-i'), 'alternative-round-3-provenance.json');
  assert.equal(selectionProvenanceFile('r4-c'), 'pace-refinement-round-4-provenance.json');
  assert.throws(() => selectionProvenanceFile('R5-A'));
});

test('TTS request preserves caption truth while expanding spoken rpm', () => {
  const cue = academyVoiceCatalog().find(item => item.cueId === 'academy.backspin.s1.build');
  const request = createTtsRequest(cue);
  assert.match(cue.text, /rpm/);
  assert.doesNotMatch(request.text, /\brpm\b/i);
  assert.match(request.text, /R P M/);
  assert.equal(speakableText(cue.text), request.text);
  assert.equal(request.model_id, 'eleven_multilingual_v2');
  assert.equal(request.seed, stableCueSeed(cue.cueId));
  assert.ok(Number.isInteger(request.seed));
  assert.equal('apiKey' in request, false);
});

test('TTS pace preview and production selection share one bounded speed control', async () => {
  const cue = academyVoiceCatalog().find(item => item.cueId === 'academy.backspin.s1.build');
  const request = createTtsRequest(cue, { speed: 0.8 });
  assert.equal(request.voice_settings.speed, 0.8);
  assert.equal(productionSpeed('0.80'), 0.8);
  assert.throws(() => productionSpeed('0.69'));
  assert.throws(() => productionSpeed('1.21'));
  const preview = await main(['pace-preview', '--candidate', 'R3-D', '--speed', '0.8']);
  assert.deepEqual(preview, {
    dryRun: true,
    command: 'pace-preview',
    candidate: 'R3-D',
    speed: 0.8,
    paidProviderCalls: 1,
    characters: AUDITION_LINES.join(' ').length,
    executeWith: 'npm run voice:pace-preview -- --candidate R3-D --speed 0.8 --execute --confirm-paid-api'
  });
  const selection = await main(['select', '--candidate', 'R3-D', '--speed', '0.8']);
  assert.equal(selection.speed, 0.8);
  assert.match(selection.executeWith, /--candidate R3-D --speed 0\.8/);
});

test('FFmpeg contract targets local mono AAC-LC at 48 kHz without a shell', () => {
  const args = buildFfmpegArgs('raw input.mp3', 'final output.m4a');
  assert.deepEqual(args.slice(0, 5), ['-y', '-hide_banner', '-loglevel', 'error', '-i']);
  assert.ok(args.includes('48000'));
  assert.ok(args.includes('aac_low'));
  assert.ok(args.includes('80k'));
  assert.match(args[args.indexOf('-af') + 1], /loudnorm=I=-18:TP=-1/);
  assert.equal(args.at(-1), 'final output.m4a');
});

test('paid execution requires both explicit safety flags', () => {
  assert.equal(paidExecutionRequested([]), false);
  assert.equal(paidExecutionRequested(['--execute']), false);
  assert.equal(paidExecutionRequested(['--confirm-paid-api']), false);
  assert.equal(paidExecutionRequested(['--execute', '--confirm-paid-api']), true);
});

test('API key loads from process memory first or the ignored local env file', () => {
  const root = mkdtempSync(join(tmpdir(), 'flightglass-voice-'));
  writeFileSync(join(root, '.env.local'), 'ELEVENLABS_API_KEY=local-secret\n');
  assert.equal(loadElevenLabsApiKey({ env: { ELEVENLABS_API_KEY: 'memory-secret' }, root }), 'memory-secret');
  assert.equal(loadElevenLabsApiKey({ env: {}, root }), 'local-secret');
  assert.equal(loadElevenLabsApiKey({ env: {}, root: mkdtempSync(join(tmpdir(), 'flightglass-empty-')) }), null);
});
