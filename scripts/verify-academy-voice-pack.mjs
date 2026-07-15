#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACADEMY_BACKSPIN_CUES, ACADEMY_HOME_CUES } from '../academy-voice-reference-cues.js';
import { START_LINE_CUES } from '../academy-start-line-content.js';
import { SHAPE_CUES } from '../academy-shape-content.js';
import { ACADEMY_VOICE_LOCALE, ACADEMY_VOICE_PACK_ID } from '../academy-voice-manifest.js';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sha=value=>createHash('sha256').update(value).digest('hex');
const inside=(root,file)=>`${resolve(file)}${sep}`.toLowerCase().startsWith(`${resolve(root)}${sep}`.toLowerCase());

export function verifyAcademyVoicePack({ root=ROOT, config, cues=[...ACADEMY_HOME_CUES.cues,...ACADEMY_BACKSPIN_CUES.cues,...START_LINE_CUES.cues,...SHAPE_CUES.cues], mode='development' }={}){
  const errors=[];const records=Array.isArray(config?.assets)?config.assets:[];const byCue=new Map();
  if(config?.packId!==ACADEMY_VOICE_PACK_ID)errors.push('pack-id');
  if(config?.locale!==ACADEMY_VOICE_LOCALE)errors.push('locale');
  if(typeof config?.rightsStatus!=='string'||!config.rightsStatus)errors.push('rights-metadata');
  if(typeof config?.productionGuide!=='string'||!config.productionGuide)errors.push('production-guide');
  for(const record of records){
    if(!record||typeof record.cueId!=='string'||byCue.has(record.cueId)){errors.push(`duplicate-or-invalid:${record?.cueId||'unknown'}`);continue;}
    byCue.set(record.cueId,record);
  }
  const missing=[];const hashMismatches=[];const durationOutliers=[];const captionOnly=[];
  for(const cue of cues){
    const record=byCue.get(cue.cueId);
    if(!record){captionOnly.push(cue.cueId);if(mode==='release')missing.push(cue.cueId);continue;}
    if(typeof record.path!=='string'||!/^assets\/audio\/academy\/control-room-en-us-v1\/[a-z0-9/_-]+\.m4a$/i.test(record.path)){errors.push(`asset-path:${cue.cueId}`);continue;}
    const file=resolve(root,record.path);
    if(!inside(resolve(root,'assets/audio/academy/control-room-en-us-v1'),file)){errors.push(`asset-escape:${cue.cueId}`);continue;}
    if(!existsSync(file)||readFileSync(file).length===0){missing.push(cue.cueId);continue;}
    if(!Number.isFinite(record.durationSeconds)||(record.durationSeconds<3||record.durationSeconds>8)&&record.reviewedDurationException!==true)durationOutliers.push(cue.cueId);
    if(!['leadingSilenceMs','trailingSilenceMs','integratedLufs','truePeakDbtp'].every(key=>Number.isFinite(record[key])))errors.push(`audio-review:${cue.cueId}`);
    if(record.sha256!==sha(readFileSync(file)))hashMismatches.push(cue.cueId);
    if(record.captionSha256!==sha(cue.text))errors.push(`caption-hash:${cue.cueId}`);
  }
  const known=new Set(cues.map(cue=>cue.cueId));const orphaned=[...byCue.keys()].filter(id=>!known.has(id));
  if(mode==='release'&&config?.rightsStatus!=='approved-for-distribution')errors.push('rights-not-approved');
  return {packId:config?.packId,locale:config?.locale,cueCount:cues.length,assetCount:records.length,captionOnly,missing,orphaned,hashMismatches,durationOutliers,rightsStatus:config?.rightsStatus,mode,pass:errors.length===0&&missing.length===0&&orphaned.length===0&&hashMismatches.length===0&&durationOutliers.length===0,errors};
}

if(process.argv[1]&&resolve(process.argv[1])===resolve(fileURLToPath(import.meta.url))){
  const mode=process.argv.includes('--mode')?process.argv[process.argv.indexOf('--mode')+1]:'development';
  const config=JSON.parse(readFileSync(resolve(ROOT,'config/academy-voice-pack.json'),'utf8'));
  const report=verifyAcademyVoicePack({config,mode});console.log(JSON.stringify(report,null,2));if(!report.pass)process.exitCode=1;
}
