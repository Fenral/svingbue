import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAcademySeed } from '../academy-store.js';

const require=createRequire(import.meta.url),{chromium,webkit}=require('../tools/node_modules/playwright-core');
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const WEBKIT=process.env.FG_ENGINE==='webkit'||process.argv.includes('--project=webkit');
const mime=file=>({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2'}[extname(file)]||'application/octet-stream');
let server,browser,baseUrl;

test.before(async()=>{
  server=createServer((request,response)=>{
    const path=decodeURIComponent(new URL(request.url,'http://x').pathname).replace(/^\/+/, '')||'index.html';
    const file=resolve(ROOT,path),prefix=`${ROOT}${sep}`.toLowerCase();
    if(!`${file}${sep}`.toLowerCase().startsWith(prefix)){response.writeHead(403).end();return;}
    readFile(file,(error,data)=>{if(error){response.writeHead(404).end();return;}response.writeHead(200,{'Content-Type':mime(file),'Cache-Control':'no-store'});response.end(data);});
  });
  await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
  baseUrl=`http://127.0.0.1:${server.address().port}`;
  browser=WEBKIT?await webkit.launch({headless:true}):await chromium.launch({channel:'msedge',headless:true}).catch(()=>chromium.launch({channel:'chrome',headless:true}));
});
test.after(async()=>{await browser?.close();await new Promise(ok=>server?.close(ok));});

function master(seed,id){
  const experience=seed.experiences[id];experience.acceptedAttemptId=`seed:${id}`;experience.masteredAt='2026-07-15T10:00:00Z';
  experience.evidence.knowledgeBestCorrect=5;experience.evidence.knowledgeTotal=5;experience.evidence.liveTransferPassed=true;experience.evidence.liveTransferEvidence={seed:true};return seed;
}
function prereq(seed=createAcademySeed()){return master(seed,'low-point');}
function masterySeed({xp=0}={}){
  const seed=prereq(),experience=seed.experiences['strike-depth'];seed.xp=xp;experience.surface=4;experience.unlockedSurfaces=[0,1,2,3,4];experience.startedAt='2026-07-15T10:00:00Z';
  experience.evidence.contactHeight={
    lab:{lowPointZ:-.002,prediction:0,predictionCorrect:true,deltaConfirmed:true,aboveCenter:true,lowReturned:true},
    proof:{stage:'plane',value:0,directSeen:[-.006,-.002,.002],liftSeen:[.02,.06,.105,.15],groundSeen:[.02,.105],compensationSeen:[0,1],planeSeen:true},
    myths:[true,true,true,true,true],mythAnswers:[1,1,1,1,1],masteryAnswers:[null,null,null,null],masteryIndex:0,
  };
  return seed;
}
async function open(hash='#/experience/strike-depth',viewport={width:430,height:932},seed=null,reducedMotion='no-preference'){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(`pageerror: ${error.message}`));page.on('console',message=>{if(message.type()==='error')errors.push(`console: ${message.text()}`);});
  if(seed)await page.addInitScript(value=>{if(!localStorage.getItem('strikearc.academy.v1'))localStorage.setItem('strikearc.academy.v1',JSON.stringify(value));},seed);
  await page.goto(`${baseUrl}/academy.html${hash}`,{waitUntil:'networkidle'});return{context,page,errors};
}
const setRange=(page,selector,value)=>page.locator(selector).evaluate((element,next)=>{element.value=String(next);element.dispatchEvent(new Event('input',{bubbles:true}));},value);
async function answers(page,list){for(let index=0;index<4;index++){await page.locator(`[data-mastery-answer="${list[index]}"]`).click();await page.locator('[data-action="next"]').click();}}

test('preview and legacy strike-depth route use native Contact Height truth',async()=>{
  const{context,page,errors}=await open();
  assert.equal(await page.locator('#contactHeightExperience').count(),1);
  assert.equal((await page.locator('h1').textContent()).trim(),'Move contact. Keep the direction.');
  assert.match(await page.locator('.low-point__prereq').textContent(),/PREVIEW/);
  assert.match(await page.locator('.contact-height__ledger').textContent(),/ARC HEIGHT AT BOTTOM/);
  assert.match(await page.locator('.contact-height__attack').textContent(),/UNCHANGED/);
  await page.evaluate(()=>{location.hash='#/lesson/strike-depth';});
  await page.locator('[data-sheet-title]').filter({hasText:'Contact Height'}).waitFor();
  assert.match(await page.locator('[data-sheet-body]').textContent(),/modeled clubhead path point/);
  assert.deepEqual(errors,[]);await context.close();
});

test('S0–S3 prove one-to-one height lift budget ground order and boundaries',async()=>{
  const{context,page,errors}=await open('#/experience/strike-depth',{width:430,height:932},prereq(),'reduce');const lesson=page.locator('#contactHeightExperience');
  await lesson.locator('[data-primary]').click();await lesson.locator('[data-lab-prediction="0"]').click();
  await setRange(page,'[data-contact-lab]',.003);assert.match(await lesson.locator('.contact-height__attack').textContent(),/−4\.110°/);
  await setRange(page,'[data-contact-lab]',.02);assert.match(await lesson.locator('.low-point__readouts').textContent(),/ABOVE BALL CENTER/);
  await setRange(page,'[data-contact-lab]',-.002);assert.match(await lesson.locator('.low-point__stages').textContent(),/D · RETURN/);
  await lesson.locator('[data-action="next"]').click();
  for(const value of[-.006,-.002,.002])await lesson.locator(`[data-proof-value="${value}"]`).click();
  await lesson.locator('[data-proof-stage="lift"]').click();for(const value of[.02,.06,.105,.15])await lesson.locator(`[data-proof-value="${value}"]`).click();
  await lesson.locator('[data-proof-stage="ground"]').click();for(const value of[.02,.105])await lesson.locator(`[data-proof-value="${value}"]`).click();assert.match(await lesson.locator('.low-point__proof-read').textContent(),/AFTER BALL/);
  await lesson.locator('[data-proof-stage="compensation"]').click();for(const value of[0,1])await lesson.locator(`[data-proof-value="${value}"]`).click();
  await lesson.locator('[data-proof-stage="plane"]').click();await lesson.locator('[data-plane-note]').click();await lesson.locator('[data-action="next"]').click();
  for(let index=0;index<5;index++){await lesson.locator('[data-myth-answer="1"]').click();await lesson.locator('[data-action="next"]').click();}
  assert.equal(await lesson.getAttribute('data-surface'),'4');assert.equal(await lesson.locator('.academy-voice__control').count(),1);assert.equal(await lesson.locator('.academy-voice__control').isVisible(),true);
  const metrics=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,min:Math.min(...[...document.querySelectorAll('#contactHeightExperience button,#contactHeightExperience input')].filter(element=>element.offsetParent).map(element=>element.getBoundingClientRect().height))}));
  assert.equal(metrics.overflow,false);assert.ok(metrics.min>=44);assert.deepEqual(errors,[]);await context.close();
});

test('4/5 knowledge without two live heights remains Practiced',async()=>{
  const{context,page,errors}=await open('#/experience/strike-depth/surface/4',{width:430,height:932},masterySeed({xp:20}));
  await answers(page,[0,0,0,0]);await page.locator('[data-finish]').click();assert.match(await page.locator('[data-result-status]').textContent(),/needs repair/);
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('strikearc.academy.v1')));
  assert.equal(stored.xp,20);assert.equal(stored.experiences['strike-depth'].status,'practiced');assert.equal(stored.experiences['strike-depth'].evidence.knowledgeBestCorrect,4);
  assert.deepEqual(errors,[]);await context.close();
});

test('raw near misses reject then two invariant height windows master once',async()=>{
  const{context,page,errors}=await open('#/experience/strike-depth/surface/4',{width:375,height:812},masterySeed({xp:20}));
  await answers(page,[0,0,0,1]);
  await setRange(page,'[data-live-contact]',-.004);await page.locator('[data-live-low-ack]').click();assert.equal(await page.locator('[data-capture]').isDisabled(),true);assert.match(await page.locator('[data-live-feedback]').textContent(),/1\.0–5\.0 mm/);
  await setRange(page,'[data-live-contact]',-.002);await page.locator('[data-capture]').click();assert.match(await page.locator('.low-point__captures').textContent(),/\+1\.8 MM/);
  await setRange(page,'[data-live-contact]',.015);await page.locator('[data-live-high-label="above-center"]').click();assert.equal(await page.locator('[data-capture]').isDisabled(),true);
  await setRange(page,'[data-live-contact]',.02);await page.locator('[data-capture]').click();assert.equal((await page.locator('[data-result-status]').textContent()).trim(),'You separated contact height from Attack.');
  let stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('strikearc.academy.v1')));assert.equal(stored.xp,140);assert.equal(stored.experiences['strike-depth'].status,'mastered');assert.equal(stored.experiences['strike-depth'].evidence.knowledgeBestCorrect,4);
  const evidence=stored.experiences['strike-depth'].evidence.liveTransferEvidence;assert.equal(evidence.low.contactHeight,.0017702099868106393);assert.equal(evidence.high.contactHeight,.02377020998681064);assert.equal(evidence.attackPassed,true);assert.equal(evidence.editablePassed,true);
  await page.reload({waitUntil:'networkidle'});stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('strikearc.academy.v1')));assert.equal(stored.xp,140);assert.equal((await page.locator('[data-result-status]').textContent()).trim(),'You separated contact height from Attack.');
  assert.deepEqual(errors,[]);await context.close();
});
