import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile, readFileSync } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require=createRequire(import.meta.url);
const { chromium, webkit }=require('../tools/node_modules/playwright-core');
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const axeSource=readFileSync(resolve(ROOT,'node_modules','axe-core','axe.min.js'),'utf8');
const WEBKIT=process.env.FG_ENGINE==='webkit' || process.argv.includes('--project=webkit');
let server,browser,baseUrl;
const type=file=>({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'}[extname(file)]||'application/octet-stream');

test.before(async()=>{
  server=createServer((request,response)=>{
    const path=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname).replace(/^\/+/, '')||'index.html';
    const file=resolve(ROOT,path);const prefix=`${ROOT}${sep}`.toLowerCase();
    if(!`${file}${sep}`.toLowerCase().startsWith(prefix)){response.writeHead(403).end();return;}
    readFile(file,(error,data)=>{if(error){response.writeHead(404).end();return;}response.writeHead(200,{'Content-Type':type(file),'Cache-Control':'no-store'});response.end(data);});
  });
  await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
  baseUrl=`http://127.0.0.1:${server.address().port}`;
  browser=WEBKIT?await webkit.launch({headless:true}):await chromium.launch({channel:'msedge',headless:true}).catch(()=>chromium.launch({channel:'chrome',headless:true}));
});
test.after(async()=>{await browser?.close();await new Promise(ok=>server?.close(ok));});

async function open(viewport,{stored=null,reducedMotion='no-preference'}={}){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion});const page=await context.newPage();const errors=[];
  page.on('pageerror',error=>errors.push(`pageerror: ${error.message}`));page.on('console',message=>{if(message.type()==='error')errors.push(`console: ${message.text()}`);});
  if(stored!==null)await page.addInitScript(value=>localStorage.setItem('strikearc.academy.v1',value),typeof stored==='string'?stored:JSON.stringify(stored));
  await page.goto(`${baseUrl}/academy.html#/academy`,{waitUntil:'networkidle'});
  return {context,page,errors};
}

for(const viewport of [{width:430,height:932},{width:375,height:812}]){
  test(`fresh outcome Home is honest, operable and fits ${viewport.width}x${viewport.height}`,async()=>{
    const {context,page,errors}=await open(viewport);
    assert.equal(await page.locator('h1').count(),1);assert.equal((await page.locator('h1').textContent()).trim(),'Learn the shot by outcome');
    assert.equal(await page.locator('[data-home-primary]').count(),1);assert.equal(await page.locator('[data-experience-id]').count(),13);
    assert.equal(await page.locator('.academy-progress__meter').getAttribute('aria-valuemax'),'13');
    assert.match(await page.locator('#academy-progress-title').textContent(),/0 of 13/);
    assert.equal(await page.locator('input[name="academy-goal"]').count(),4);
    const metrics=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,primary:document.querySelector('[data-home-primary]').getBoundingClientRect().height,voice:document.querySelector('[data-academy-voice-settings]').getBoundingClientRect().height}));
    assert.ok(metrics.scrollWidth<=metrics.clientWidth);assert.ok(metrics.primary>=44);assert.ok(metrics.voice>=44);
    const progressTrigger=page.locator('[data-home-progress]');await progressTrigger.click();
    assert.equal((await page.locator('#sheet-title').textContent()).trim(),'Outcome progress');
    assert.match(await page.locator('#sheet').textContent(),/0 of 13 core experiences mastered/);
    await page.locator('#sheet [data-sheet-close]').click();await page.waitForFunction(()=>document.activeElement?.matches('[data-home-progress]'));
    assert.equal(await progressTrigger.evaluate(element=>element===document.activeElement),true);
    await page.addScriptTag({content:axeSource});const axe=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa']}}));
    assert.deepEqual(axe.violations.filter(item=>['critical','serious'].includes(item.impact)).map(item=>item.id),[]);
    assert.deepEqual(errors,[]);await context.close();
  });
}

test('explicit Captions choice persists, shows exact local cue and keeps navigation live',async()=>{
  const {context,page,errors}=await open({width:430,height:932});
  assert.equal(await page.locator('[data-academy-voice-choice]').isVisible(),true);
  await page.locator('[data-voice-mode="captions"]').click();
  assert.equal(await page.locator('[data-academy-voice-caption]').isVisible(),true);
  assert.match(await page.locator('[data-academy-voice-text]').textContent(),/^Choose the outcome you want to control\./);
  const mode=await page.evaluate(()=>JSON.parse(localStorage.getItem('strikearc.academy.v1')).preferences.voice.mode);assert.equal(mode,'captions');
  await page.locator('input[name="academy-goal"][value="distance"]').check();
  assert.equal(await page.locator('input[name="academy-goal"][value="distance"]').isChecked(),true);
  assert.deepEqual(errors,[]);await context.close();
});

test('canonical Backspin uses the shared host and legacy articles remain reachable',async()=>{
  const {context,page,errors}=await open({width:430,height:932});
  await page.evaluate(()=>{location.hash='#/experience/backspin';});await page.locator('#nativeLesson').waitFor();
  assert.equal(await page.locator('#nativeLesson').getAttribute('data-lesson'),'backspin');
  await page.evaluate(()=>{location.hash='#/lesson/carry';});await page.locator('.lesson h1').waitFor();
  assert.equal((await page.locator('.lesson h1').textContent()).trim(),'Carry');
  assert.deepEqual(errors,[]);await context.close();
});

test('Backspin uses shared voice consent, surface cues and semantic targets without blocking the lesson',async()=>{
  const {context,page,errors}=await open({width:430,height:932});
  await page.locator('[data-voice-mode="captions"]').click();
  await page.evaluate(()=>{location.hash='#/experience/backspin';});await page.locator('#nativeLesson').waitFor();
  assert.equal(await page.locator('[data-academy-voice-settings]').count(),1);
  assert.match(await page.locator('[data-academy-voice-text]').textContent(),/^Backspin is an outcome\./);
  await page.locator('[data-action="next"]').click();
  assert.match(await page.locator('[data-academy-voice-text]').textContent(),/^Dynamic Loft minus Attack/);
  const setLabValue=value=>page.locator('#labRange').evaluate((input,next)=>{input.value=String(next);input.dispatchEvent(new Event('input',{bubbles:true}));},value);
  await setLabValue(50);
  assert.match(await page.locator('[data-academy-voice-text]').textContent(),/^The gap is larger\./);
  await setLabValue(10);
  assert.match(await page.locator('[data-academy-voice-text]').textContent(),/^A smaller gap lowers raw rpm\./);
  assert.equal(await page.locator('#nativeLesson').getAttribute('data-surface'),'1');
  assert.deepEqual(errors,[]);await context.close();
});

test('corrupt legacy storage is not overwritten merely by opening Home',async()=>{
  const corrupt='{broken';const {context,page}=await open({width:375,height:812},{stored:corrupt});
  assert.equal(await page.locator('.academy-home__storage-warning').isVisible(),true);
  assert.equal(await page.evaluate(()=>localStorage.getItem('strikearc.academy.v1')),corrupt);
  await context.close();
});
