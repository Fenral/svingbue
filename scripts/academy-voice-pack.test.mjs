import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { verifyAcademyVoicePack } from './verify-academy-voice-pack.mjs';

const config=JSON.parse(readFileSync(resolve('config/academy-voice-pack.json'),'utf8'));

test('development pack verifies every local licensed Academy master',()=>{
  const report=verifyAcademyVoicePack({config,mode:'development'});
  assert.equal(report.pass,true);assert.equal(report.cueCount,102);assert.equal(report.assetCount,102);assert.equal(report.captionOnly.length,0);assert.equal(report.rightsStatus,'approved-for-distribution');
});

test('release pack passes once every human gate is approved',()=>{
  // Owner signed off rights, US-2 voice identity, fatigue listen, physical-device
  // audio-route check and iOS VoiceOver on 2026-07-20.
  const report=verifyAcademyVoicePack({config,mode:'release'});
  assert.deepEqual(report.errors,[]);
  assert.equal(report.missing.length,0);assert.equal(report.hashMismatches.length,0);assert.equal(report.durationOutliers.length,0);
  assert.equal(report.pass,true);
});

test('release mode still fails closed when any approval regresses',()=>{
  // Keeps the fail-closed coverage that the passing test above would otherwise
  // silently drop: flipping any single gate must block release with its own error.
  const gates=[
    ['rightsStatus','rights-not-approved'],
    ['voiceIdentityStatus','voice-identity-not-approved'],
    ['humanFatigueStatus','fatigue-listen-not-approved'],
    ['devicePlaybackStatus','device-playback-not-approved'],
    ['voiceOverStatus','voiceover-not-approved']
  ];
  for(const [key,error] of gates){
    const report=verifyAcademyVoicePack({config:{...config,[key]:'pending-regression'},mode:'release'});
    assert.equal(report.pass,false,`${key} must block release`);
    assert.ok(report.errors.includes(error),`${key} must report ${error}`);
  }
});

test('remote, escaping and orphan records never pass',()=>{
  const bad={...config,assets:[{cueId:'orphan',path:'https://provider.test/a.m4a'}]};
  const report=verifyAcademyVoicePack({config:bad,mode:'development'});
  assert.equal(report.pass,false);assert.ok(report.orphaned.includes('orphan'));
});

test('a valid local master cannot be rebound to the wrong runtime cue',()=>{
  const [first,second,...rest]=config.assets;
  const rebound={...second,cueId:first.cueId,captionSha256:first.captionSha256};
  const report=verifyAcademyVoicePack({config:{...config,assets:[rebound,...rest]},mode:'development'});
  assert.equal(report.pass,false);assert.ok(report.errors.includes(`asset-binding:${first.cueId}`));
});
