import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { verifyAcademyVoicePack } from './verify-academy-voice-pack.mjs';

const config=JSON.parse(readFileSync(resolve('config/academy-voice-pack.json'),'utf8'));

test('development pack truthfully reports caption-ready Academy cues',()=>{
  const report=verifyAcademyVoicePack({config,mode:'development'});
  assert.equal(report.pass,true);assert.equal(report.cueCount,17);assert.equal(report.assetCount,0);assert.equal(report.captionOnly.length,17);assert.equal(report.rightsStatus,'pending-final-licensed-assets');
});

test('release pack fails closed until licensed verified assets exist',()=>{
  const report=verifyAcademyVoicePack({config,mode:'release'});
  assert.equal(report.pass,false);assert.equal(report.missing.length,17);assert.ok(report.errors.includes('rights-not-approved'));
});

test('remote, escaping and orphan records never pass',()=>{
  const bad={...config,assets:[{cueId:'orphan',path:'https://provider.test/a.m4a'}]};
  const report=verifyAcademyVoicePack({config:bad,mode:'development'});
  assert.equal(report.pass,false);assert.ok(report.orphaned.includes('orphan'));
});
