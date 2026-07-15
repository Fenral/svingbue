import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs';
import { dirname,extname,resolve,sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAcademySeed } from '../academy-store.js';

const require=createRequire(import.meta.url);
const { chromium,webkit }=require('../tools/node_modules/playwright-core');
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const WEBKIT=process.env.FG_ENGINE==='webkit' || process.argv.includes('--project=webkit');
const mime=file=>({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'}[extname(file)]||'application/octet-stream');
let server,browser,baseUrl;

test.before(async()=>{
  server=createServer((request,response)=>{
    const path=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname).replace(/^\/+/, '')||'index.html';
    const file=resolve(ROOT,path);const prefix=`${ROOT}${sep}`.toLowerCase();
    if(!`${file}${sep}`.toLowerCase().startsWith(prefix)){response.writeHead(403).end();return;}
    readFile(file,(error,data)=>{if(error){response.writeHead(404).end();return;}response.writeHead(200,{'Content-Type':mime(file),'Cache-Control':'no-store'});response.end(data);});
  });
  await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
  baseUrl=`http://127.0.0.1:${server.address().port}`;
  browser=WEBKIT?await webkit.launch({headless:true}):await chromium.launch({channel:'msedge',headless:true}).catch(()=>chromium.launch({channel:'chrome',headless:true}));
});
test.after(async()=>{await browser?.close();await new Promise(ok=>server?.close(ok));});

async function open(hash='#/experience/start-line',viewport={width:430,height:932},seed=null){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'no-preference'});const page=await context.newPage();const errors=[];
  page.on('pageerror',error=>errors.push(`pageerror: ${error.message}`));page.on('console',message=>{if(message.type()==='error')errors.push(`console: ${message.text()}`);});
  if(seed)await page.addInitScript(value=>{if(!localStorage.getItem('strikearc.academy.v1'))localStorage.setItem('strikearc.academy.v1',JSON.stringify(value));},seed);
  await page.goto(`${baseUrl}/academy.html${hash}`,{waitUntil:'networkidle'});
  return {context,page,errors};
}

const setRange=(page,selector,value)=>page.locator(selector).evaluate((input,next)=>{input.value=String(next);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));},value);

function masterySeed({xp=0,attemptNumber=0}={}){
  const seed=createAcademySeed();const experience=seed.experiences['start-line'];seed.xp=xp;
  experience.surface=4;experience.unlockedSurfaces=[0,1,2,3,4];experience.startedAt='2026-07-15T10:00:00.000Z';experience.lastVisitedAt=experience.startedAt;
  experience.evidence.startLine={ mission:{built:true,loftRestored:true},myths:[true,true,true],mythAnswers:[2,1,1],masteryAnswers:[null,null,null,null],masteryIndex:0,attemptNumber };
  return seed;
}

async function answerKnowledge(page,answers){
  for(let index=0;index<4;index+=1){
    await page.locator(`[data-mastery-choice="${answers[index]}"]`).click();
    await page.locator('[data-action="next"]').click();
  }
}

async function passBlendTransfer(page,{matched=false}={}){
  if(matched){
    await setRange(page,'[data-transfer-face]',1.5);await setRange(page,'[data-transfer-path]',1.5);
    await page.locator('[data-transfer-lock]').click();
    await page.locator('[data-transfer-prediction="fixed"]').click();
  }else{
    await setRange(page,'[data-transfer-face]',2);await setRange(page,'[data-transfer-path]',-2);
    await page.locator('[data-transfer-lock]').click();
    await page.locator('[data-transfer-prediction="toward-path"]').click();
    await setRange(page,'[data-transfer-face]',2.5);
  }
  await page.locator('[data-transfer-submit]').click();
}

test('canonical and three legacy concept routes share one Start Line renderer and concept sheet',async()=>{
  const {context,page,errors}=await open();
  assert.equal(await page.locator('#startLineExperience').count(),1);
  for(const [concept,title] of [['face-angle','Face Angle'],['club-path','Club Path'],['start-direction','Launch Direction']]){
    await page.evaluate(id=>{location.hash=`#/lesson/${id}`;},concept);
    await page.locator('#startLineExperience').waitFor();
    assert.equal((await page.locator('h1').textContent()).trim(),'Start Line');
    assert.equal((await page.locator('[data-start-line-sheet-title]').textContent()).trim(),title);
    await page.locator('[data-start-line-sheet-close]').click();
  }
  assert.deepEqual(errors,[]);await context.close();
});

test('S0–S3 build, modifier prediction, restore and myths use the departure instrument only',async()=>{
  const {context,page,errors}=await open();const lesson=page.locator('#startLineExperience');
  assert.equal(await lesson.locator('[data-start-line-primary]').count(),1);
  assert.equal(await lesson.locator('[data-curve-trace],[data-landing-point]').count(),0);
  await lesson.locator('[data-start-line-primary]').click();
  assert.equal(await lesson.getAttribute('data-surface'),'1');
  assert.equal(await lesson.locator('[data-launch-direction]').textContent(),'−0.5°');
  await setRange(page,'#startLineRange',2);
  assert.equal(await lesson.locator('[data-launch-direction]').textContent(),'+1.0°');
  assert.equal(await lesson.locator('[data-mission-built]').getAttribute('data-complete'),'true');
  await lesson.locator('[data-action="next"]').click();
  assert.equal(await lesson.getAttribute('data-surface'),'2');
  assert.equal(await lesson.locator('[data-loft-case="high"]').getAttribute('aria-checked'),'false');
  await lesson.locator('[data-start-line-prediction="toward-path"]').click();
  assert.equal(await lesson.locator('[data-face-share]').textContent(),'67%');
  assert.equal(await lesson.locator('[data-launch-direction]').textContent(),'+0.7°');
  await setRange(page,'#startLineRange',2.5);
  assert.equal(await lesson.locator('[data-loft-restored]').getAttribute('data-complete'),'true');
  await lesson.locator('[data-action="next"]').click();
  assert.equal(await lesson.getAttribute('data-surface'),'3');
  for(const index of [2,1,1]){
    await lesson.locator(`[data-myth-choice="${index}"]`).click();
    await lesson.locator('[data-action="next"]').click();
  }
  assert.equal(await lesson.getAttribute('data-surface'),'4');
  const metrics=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,minTarget:Math.min(...[...document.querySelectorAll('#startLineExperience button,#startLineExperience input')].filter(el=>el.offsetParent).map(el=>el.getBoundingClientRect().height))}));
  assert.ok(metrics.scrollWidth<=metrics.clientWidth);assert.ok(metrics.minTarget>=44);
  assert.deepEqual(errors,[]);await context.close();
});

test('4/5 without live transfer stays Practiced and records no XP',async()=>{
  const {context,page,errors}=await open('#/experience/start-line/surface/4',{width:430,height:932},masterySeed({xp:25}));
  await answerKnowledge(page,[2,0,1,3]);
  assert.equal(await page.locator('[data-transfer-fixture]').getAttribute('data-transfer-fixture'),'blend-mid-high');
  await page.locator('[data-transfer-submit]').click();
  assert.equal(await page.locator('#startLineExperience').getAttribute('data-surface'),'5');
  assert.equal((await page.locator('[data-result-status]').textContent()).trim(),'START LINE PRACTICED');
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('strikearc.academy.v1')));
  assert.equal(stored.xp,25);assert.equal(stored.experiences['start-line'].status,'practiced');assert.equal(stored.experiences['start-line'].evidence.knowledgeBestCorrect,4);assert.equal(stored.experiences['start-line'].evidence.liveTransferPassed,false);
  assert.deepEqual(errors,[]);await context.close();
});

test('raw near miss cannot lock Phase A; valid 4/5 plus two-phase transfer masters once',async()=>{
  const {context,page,errors}=await open('#/experience/start-line/surface/4',{width:430,height:932},masterySeed({xp:25}));
  await answerKnowledge(page,[2,0,1,0]);
  await setRange(page,'[data-transfer-face]',2.14);await setRange(page,'[data-transfer-path]',-2);
  assert.equal((await page.locator('[data-transfer-launch]').textContent()).trim(),'+1.1°');
  assert.equal(await page.locator('[data-transfer-lock]').isDisabled(),true);
  await setRange(page,'[data-transfer-face]',2);await page.locator('[data-transfer-lock]').click();
  assert.equal(await page.locator('[data-transfer-phase]').textContent(),'PHASE B · PREDICT');
  await page.locator('[data-transfer-prediction="toward-path"]').click();await setRange(page,'[data-transfer-face]',2.5);
  await page.locator('[data-transfer-submit]').click();
  assert.equal((await page.locator('[data-result-status]').textContent()).trim(),'START LINE MASTERED');
  let stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('strikearc.academy.v1')));
  assert.equal(stored.xp,145);assert.equal(stored.experiences['start-line'].status,'mastered');assert.equal(stored.experiences['start-line'].evidence.knowledgeBestCorrect,4);assert.equal(stored.experiences['start-line'].evidence.liveTransferPassed,true);
  assert.equal(stored.experiences['start-line'].evidence.liveTransferEvidence.phaseAPassed,true);assert.equal(stored.experiences['start-line'].evidence.liveTransferEvidence.phaseBPassed,true);
  await page.reload({waitUntil:'networkidle'});stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('strikearc.academy.v1')));
  assert.equal(stored.xp,145);assert.equal((await page.locator('[data-result-status]').textContent()).trim(),'START LINE MASTERED');
  assert.deepEqual(errors,[]);await context.close();
});

test('deterministic matched fixture passes its no-change exception',async()=>{
  const {context,page,errors}=await open('#/experience/start-line/surface/4',{width:375,height:812},masterySeed({attemptNumber:1}));
  await answerKnowledge(page,[2,0,1,3]);
  assert.equal(await page.locator('[data-transfer-fixture]').getAttribute('data-transfer-fixture'),'matched-mid-low');
  await passBlendTransfer(page,{matched:true});
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('strikearc.academy.v1')));
  assert.equal(stored.experiences['start-line'].evidence.liveTransferEvidence.matchedException,true);assert.equal(stored.xp,120);
  assert.deepEqual(errors,[]);await context.close();
});

test('3/5 plus live remains Practiced; retry gets a new deterministic fixture and can master',async()=>{
  const {context,page,errors}=await open('#/experience/start-line/surface/4',{width:430,height:932},masterySeed());
  const firstAttempt=await page.evaluate(()=>JSON.parse(localStorage.getItem('strikearc.academy.v1')).experiences['start-line'].activeAttempt.attemptId);
  await answerKnowledge(page,[2,0,0,0]);await passBlendTransfer(page);
  assert.equal((await page.locator('[data-result-status]').textContent()).trim(),'START LINE PRACTICED');
  let stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('strikearc.academy.v1')));assert.equal(stored.xp,0);assert.equal(stored.experiences['start-line'].evidence.knowledgeBestCorrect,3);
  await page.locator('[data-mastery-retry]').click();
  assert.equal(await page.locator('[data-transfer-fixture]').count(),0);
  await answerKnowledge(page,[2,0,1,3]);
  assert.equal(await page.locator('[data-transfer-fixture]').getAttribute('data-transfer-fixture'),'matched-mid-low');
  stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('strikearc.academy.v1')));assert.notEqual(stored.experiences['start-line'].activeAttempt.attemptId,firstAttempt);
  await passBlendTransfer(page,{matched:true});
  stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('strikearc.academy.v1')));assert.equal(stored.xp,120);assert.equal(stored.experiences['start-line'].status,'mastered');
  assert.deepEqual(errors,[]);await context.close();
});
