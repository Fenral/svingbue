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

test('release pack fails closed on remaining human fatigue, device and VoiceOver gates',()=>{
  const report=verifyAcademyVoicePack({config,mode:'release'});
  assert.equal(report.pass,false);assert.equal(report.missing.length,0);assert.equal(report.hashMismatches.length,0);
  assert.ok(report.errors.includes('fatigue-listen-not-approved'));
  assert.ok(report.errors.includes('device-playback-not-approved'));
  assert.ok(report.errors.includes('voiceover-not-approved'));
  assert.ok(!report.errors.includes('rights-not-approved'));
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
