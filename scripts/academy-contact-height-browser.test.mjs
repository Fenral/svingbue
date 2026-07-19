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

async function open(hash='#/experience/strike-depth',viewport={width:430,height:932},seed=null,reducedMotion='no-preference'){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(`pageerror: ${error.message}`));page.on('console',message=>{if(message.type()==='error')errors.push(`console: ${message.text()}`);});
  if(seed)await page.addInitScript(value=>{if(!localStorage.getItem('strikearc.academy.v1'))localStorage.setItem('strikearc.academy.v1',JSON.stringify(value));},seed);
  await page.goto(`${baseUrl}/academy.html${hash}`,{waitUntil:'networkidle'});return{context,page,errors};
}
// The camera-standard slider dedups when the value is unchanged, so a value that
// equals the current one never flips the "interacted" flag. Nudge first, then land.
const setSlider=(page,value)=>page.locator('input[type=range]').evaluate((el,next)=>{el.value=String(next);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
const land=async(page,value)=>{await setSlider(page,value+.004);await setSlider(page,value);};
const hook=page=>page.evaluate(()=>window.__aiContactHeight?{phase:window.__aiContactHeight.phase,z:window.__aiContactHeight.z,ch:window.__aiContactHeight.state.contactHeightMm,atk:window.__aiContactHeight.state.attackAngle}:null);
// masteryTasks[0..3].answerIndex are all 0 → the correct knowledge choice is the first chip.
async function answerKnowledge(page,{correct=true}={}){
  for(let i=0;i<4;i++){
    await page.locator('[data-choices] button').nth(correct?0:1).click();
    await page.locator('[data-next]').click();
  }
}
async function passLiveGate(page){
  await land(page,-.002);await page.locator('[data-ack="below"]').click();await page.locator('[data-capture]').click();
  await land(page,.02);await page.locator('[data-hi="above-center"]').click();await page.locator('[data-capture]').click();
}

test('strike-depth route renders the camera-standard Contact Height instrument with the held-Attack invariant',async()=>{
  const{context,page,errors}=await open();
  assert.equal(await page.locator('main.ai-shell').count(),1);
  assert.match(await page.locator('[data-slot="kicker"]').textContent(),/CONTACT HEIGHT/);
  assert.equal(await page.locator('[data-voice-target="contact-height-window"]').count(),1);
  assert.match(await page.locator('[data-ref="attackText"]').textContent(),/−4\.110° · UNCHANGED/);
  assert.match(await page.locator('[data-slot="hero-label"]').textContent(),/MODELED CONTACT HEIGHT/);
  // preview banner while the live gate is still locked (no prerequisite)
  assert.match(await page.locator('.ai-shell').textContent(),/PREVIEW/);
  assert.deepEqual(errors,[]);await context.close();
});

test('dragging the arc moves Contact Height one-to-one while Attack stays exactly invariant',async()=>{
  const{context,page,errors}=await open('#/experience/strike-depth',{width:430,height:932},prereq(),'reduce');
  await page.locator('[data-start]').click();       // into knowledge
  // jump back to the scene by finishing knowledge is not needed — the scene slider lives on every phase's sheet.
  // exercise the shared slider on the live gate after knowledge:
  await answerKnowledge(page);
  const lowRead=(await land(page,-.002),await hook(page));
  const highRead=(await land(page,.02),await hook(page));
  assert.ok(Math.abs(lowRead.ch-1.77)<.2,`low contact ~1.77mm, got ${lowRead.ch}`);
  assert.ok(Math.abs(highRead.ch-23.77)<.2,`high contact ~23.77mm, got ${highRead.ch}`);
  assert.equal(lowRead.atk,highRead.atk); // the invariant: Attack never moved between two very different heights
  assert.ok(Math.abs(lowRead.atk+4.1097)<1e-3,`Attack held near −4.110°, got ${lowRead.atk}`);
  assert.deepEqual(errors,[]);await context.close();
});

test('explore → 4 knowledge → live gate awards mastery once, records the invariant, and survives reload',async()=>{
  const{context,page,errors}=await open('#/experience/strike-depth',{width:375,height:812},prereq());
  await page.locator('[data-start]').click();
  await answerKnowledge(page);
  // near-miss first: wrong band leaves capture disabled
  await land(page,-.008);await page.locator('[data-ack="below"]').click();
  assert.equal(await page.locator('[data-capture]').isDisabled(),true);
  assert.match(await page.locator('[data-live-fb]').textContent(),/1\.0–5\.0 mm/);
  await passLiveGate(page);
  assert.equal((await page.locator('.ai-question').textContent()).trim(),'You separated contact height from Attack.');
  let stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('strikearc.academy.v1')));
  assert.equal(stored.xp,120);assert.equal(stored.experiences['strike-depth'].status,'mastered');
  const evidence=stored.experiences['strike-depth'].evidence.liveTransferEvidence;
  assert.equal(evidence.low.contactHeight,.0017702099868106393);
  assert.equal(evidence.high.contactHeight,.02377020998681064);
  assert.equal(evidence.attackPassed,true);assert.equal(evidence.editablePassed,true);
  // no overflow / 44px targets on the small viewport
  const metrics=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,min:Math.min(...[...document.querySelectorAll('main.ai-shell button,main.ai-shell input')].filter(el=>el.offsetParent).map(el=>el.getBoundingClientRect().height))}));
  assert.equal(metrics.overflow,false);assert.ok(metrics.min>=44);
  // mastered state persists across reload and does not degrade to practiced
  await page.reload({waitUntil:'networkidle'});
  stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('strikearc.academy.v1')));
  assert.equal(stored.xp,120);assert.equal(stored.experiences['strike-depth'].status,'mastered');
  assert.deepEqual(errors,[]);await context.close();
});
