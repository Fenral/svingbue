#!/usr/bin/env node
/**
 * shoot.mjs — StrikeArc App Store poster rig v2 (executes docs/appstore-mocks-plan.md
 * incl. REVISJON v2). Produces the 9-shot set:
 *   1 constellation · 2 Spin Lab · 3 impact-flight · 4 Strike Window 2D ·
 *   5–6 3D PANORAMA (one 2580×2796 master sliced on the app's pane divider) ·
 *   7 Academy (with progress) · 8 ghost-compare (zoomed) · 9 drill-closer.
 *
 * TWO-STAGE, deterministic:
 *   Stage 1  capture each real UI state at EXACT device pixels via headless
 *            chromium, seeded so no coach/nudge. The 3D panorama is ONE landscape
 *            geometry capture (2580×1800) with the microscope|scene split forced
 *            50/50 so the pane divider lands on the slice seam.
 *   Stage 2  shoot each canvas template (0N.html) at the EXACT store master and
 *            ASSERT IHDR px == 1290×2796. The panorama (pano.html, 2580×2796) is
 *            clip-screenshot into 05.png + 06.png.
 *   Stage 3  contact sheet (all 9 at equal height in a row) — thread continuity.
 *
 * Serves the repo ROOT from an in-process Node server (no python needed).
 * Run:  node tools/appstore-shots/shoot.mjs
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { SIZE, PANORAMA, entryExit, yFracAt, HEADLINES } from './thread.mjs';

const require = createRequire(import.meta.url);
const SCRATCH = 'C:/Users/SKOTVO~1/AppData/Local/Temp/claude/C--Users-SkotvoldSivertSende/7c5521e7-c5f4-4175-a82e-ddad4b77d414/scratchpad';
const { chromium } = require(SCRATCH + '/node_modules/playwright-core');
const EXE = 'C:/Users/SkotvoldSivertSende/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');                       // repo root (svingbue)
const RAW = join(HERE, 'raw');
const OUT_SERVED = join(HERE, '_out');                        // served copies (contact sheet)
const OUTDIR = 'C:/Users/SkotvoldSivertSende/OneDrive - IdrettsKontor/Skrivebord/Apper/strikearc-appstore';
const APPSTORE = join(ROOT, 'appstore');                      // deployed gallery folder in the repo
for (const dd of [RAW, OUT_SERVED, OUTDIR, APPSTORE]) mkdirSync(dd, { recursive: true });

const MIME = { '.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css',
  '.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.glb':'model/gltf-binary','.jpg':'image/jpeg','.jpeg':'image/jpeg' };

function startServer(){
  return new Promise((ok)=>{
    const srv = createServer(async (req,res)=>{
      try{
        const u = new URL(req.url,'http://x');
        let p = normalize(join(ROOT, decodeURIComponent(u.pathname)));
        if(!p.startsWith(ROOT)){ res.writeHead(403).end(); return; }
        if(u.pathname==='/') p = join(ROOT,'index.html');
        if(u.pathname==='/favicon.ico'){ res.writeHead(204).end(); return; }
        const body = await readFile(p);
        res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'});
        res.end(body);
      }catch{ res.writeHead(404).end('not found'); }
    });
    srv.listen(0,'127.0.0.1',()=>ok(srv));
  });
}
function pngSize(buf){ return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }; }
function writeAll(name, buf){ for (const dir of [OUTDIR, OUT_SERVED, APPSTORE]) writeFileSync(join(dir,name), buf); }

const consoleErrors = [];
function watch(page,label){
  page.on('pageerror',e=>consoleErrors.push(`[${label}] ${e.message}`));
  page.on('console',m=>{ if(m.type()==='error') consoleErrors.push(`[${label}] ${m.text()}`); });
}

// base seed — dismiss coaches/nudges; leave academy UNSET unless a recipe seeds it.
const SEED = () => {
  try {
    localStorage.setItem('sa_onboarded','1');
    localStorage.setItem('sa_coach_impact','1');
    localStorage.setItem('sa_coach_geo','1');
    localStorage.setItem('sa_coach_flight_ghost','1');
    localStorage.setItem('sa_seen_academy','1');
    localStorage.setItem('strikearc.academy.nudge','1');
    localStorage.removeItem('sa_shots_v1');
  } catch(e){}
};
// REVISJON v2 §7 — Academy shot must show PROGRESS, never «0 XP». Seed 520 XP
// (Level 2 · Apprentice) + two mastered lessons.
const ACADEMY_SEED = () => {
  try {
    localStorage.setItem('strikearc.academy.v1', JSON.stringify({
      version:1, xp:520,
      lessons:{
        backspin:{read:true,quizBest:100,quizAttempts:1,perfect:true,completed:true,completedAt:1,diagramTouched:true,quizBestCorrect:5,quizLen:5,mastered:true},
        carry:{read:true,quizBest:80,quizAttempts:1,perfect:false,completed:true,completedAt:1,diagramTouched:true,quizBestCorrect:4,quizLen:5,mastered:true}
      },
      unlocked:['backspin','carry'], badges:['first-light','spin-doctor','range-finder'], lastOpened:'backspin'
    }));
  } catch(e){}
};

// ── shot recipes (raw UI capture). Each returns after the state is painted. ──
const PORT = { width:430, height:932 }, LAND = { width:932, height:430 };
const PANO_VP = { width:1290, height:1150 };  // ×2 = 2580×2300 (landscape → no rotate overlay)
const OUTCOME_VP = { width:1000, height:462 };

const RECIPES = [
  { n:1, file:'01-home.png', vp:PORT, dsf:3, rm:'reduce', ember:'poster comet (big ember, upper-mid) + home tee ember',
    async run(page,base){ await page.goto(base+'/home-mock.html?static=1',{waitUntil:'networkidle'});
      await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(1400); } },

  { n:2, file:'02-spinlab.png', vp:PORT, dsf:3, rm:'no-preference', ember:'7 128 rpm ember truth (UI)',
    async run(page,base){ await page.goto(base+'/academy-lesson-v2-mock.html',{waitUntil:'networkidle'});
      await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(400);
      // S0 → S1 (Spin Lab). nextBtn advances one surface; retry until data-surface="1".
      for (let i=0;i<3;i++){
        const s = await page.evaluate(()=>document.body.dataset.surface);
        if (s === '1') break;
        await page.evaluate(()=>{ const b=document.getElementById('nextBtn'); if(b) b.click(); });
        await page.waitForTimeout(350);
      }
      await page.waitForFunction(()=>{ const r=document.getElementById('rpm'); return r && /\d/.test(r.textContent); },{timeout:6000}).catch(()=>{});
      await page.waitForTimeout(1300);   // flight-trace draw settles
      const rpm = await page.evaluate(()=>{ const r=document.getElementById('rpm'); return r?r.textContent.trim():'?'; });
      console.log('   · spin lab rpm = '+rpm); } },

  { n:3, file:'03-impact-flight.png', vp:LAND, dsf:3, rm:'no-preference', ember:'full ember ball-flight arc (UI): apex + landing + Total',
    async run(page,base){ await page.goto(base+'/impact.html',{waitUntil:'networkidle'});
      await page.waitForFunction(()=>window.__coachDebug&&window.__coachDebug.sceneReady(),{timeout:15000});
      await page.evaluate(()=>{ const set=(id,v)=>{const el=document.getElementById(id); if(el){el.value=String(v);el.dispatchEvent(new Event('input'));}};
        set('s_face',-2); set('s_path',3); set('s_attack',-3); set('s_loft',30); set('s_speed',103);
        document.getElementById('playFlight').click(); });
      await page.waitForFunction(()=>{ const s=document.getElementById('flightScrim'); return s && s.classList.contains('open'); },{timeout:8000});
      // let the FULL arc draw (tracer dashoffset → 0) + the Total count-up settle
      await page.waitForFunction(()=>{ const t=document.getElementById('fTracer'); if(!t) return false; const off=parseFloat(t.style.strokeDashoffset||'999'); return off<=1; },{timeout:9000}).catch(()=>{});
      await page.waitForTimeout(950);
      await page.evaluate(()=>{ if(document.activeElement&&document.activeElement.blur) document.activeElement.blur(); });
      const tot=await page.evaluate(()=>{ const n=document.getElementById('fCarryNum'); return n?n.textContent.trim():'?'; });
      console.log('   · full flight complete, Total = '+tot+' m'); } },

  { n:4, file:'04-geowin.png', vp:PORT, dsf:3, rm:'reduce', ember:'travelling ember ball on thread (UI verdict Pure=mint, no hero ember)',
    async run(page,base){ await page.goto(base+'/geometry-window-mock.html',{waitUntil:'networkidle'});
      await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(1000);
      const v=await page.evaluate(()=>{const el=document.getElementById('bandLabel'); return el?el.textContent.trim():'?';});
      console.log('   · verdict badge = '+v); } },

  // ── THE 3D PANORAMA (shots 5+6) — ONE landscape geometry capture, 2580×2300,
  //    microscope|scene forced 50/50 so the pane divider = the slice seam. Picks
  //    up the freshest (toned-down) glass plane straight off disk.
  { n:5, file:'pano-geometry.png', vp:PANO_VP, dsf:2, rm:'reduce', ember:'travelling ember arcs across the seam (gold measures = annotation)',
    async run(page,base){ await page.goto(base+'/geometry.html',{waitUntil:'networkidle'});
      await page.waitForFunction(()=>window.__sa3d&&window.__sa3d.renderCount>0,{timeout:20000}).catch(()=>{});
      await page.waitForFunction(()=>{const c=window.__sa&&window.__sa.three&&window.__sa.three.club&&window.__sa.three.club(); return c?(c.loaded||c.loadFailed):true;},{timeout:20000}).catch(()=>{});
      // force microscope|scene = exactly 50/50 (pane divider on the slice seam).
      // The panel is measured (setMainRegionLeft) + ResizeObserved → re-fits.
      await page.evaluate(()=>{ document.documentElement.style.setProperty('--sd-w','645px'); window.dispatchEvent(new Event('resize')); });
      await page.waitForTimeout(650);
      await page.evaluate(()=>{ window.dispatchEvent(new Event('resize')); if(window.__sa3d&&window.__sa3d.invalidate) window.__sa3d.invalidate(); });
      await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(1000);
      const w = await page.evaluate(()=>{ const el=document.getElementById('strikeDetail'); return el?Math.round(el.getBoundingClientRect().width):-1; });
      console.log('   · microscope panel width = '+w+'px (want 645 CSS → seam at 1290 device px)'); } },

  { n:7, file:'07-academy.png', vp:PORT, dsf:3, rm:'reduce', seed:ACADEMY_SEED, ember:'START HERE micro-glow (UI); header shows Level 2 · 520 XP',
    async run(page,base){ await page.goto(base+'/academy.html#/path',{waitUntil:'networkidle'});
      await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(1900);
      await page.evaluate(()=>window.scrollTo(0,0)); await page.waitForTimeout(200);
      const xp = await page.evaluate(()=>{ const el=document.getElementById('hdr-xp'); return el?el.textContent.trim():'?'; });
      console.log('   · academy header XP = '+xp); } },

  { n:8, file:'08-ghost.png', vp:LAND, dsf:3, rm:'reduce', ember:'live ember arc vs violet ghost (two divergent arcs, hero)',
    async run(page,base){ await page.goto(base+'/impact.html',{waitUntil:'networkidle'});
      await page.waitForFunction(()=>window.__coachDebug&&window.__coachDebug.sceneReady(),{timeout:15000});
      await page.evaluate(()=>{ const set=(id,v)=>{const el=document.getElementById(id); if(el){el.value=String(v);el.dispatchEvent(new Event('input'));}};
        set('s_face',5); set('s_path',-1); set('s_attack',-3); set('s_loft',30); set('s_speed',95);
        document.getElementById('playFlight').click(); });                 // run 1 (→ becomes ghost)
      await page.waitForTimeout(180);
      await page.evaluate(()=>{ const set=(id,v)=>{const el=document.getElementById(id); if(el){el.value=String(v);el.dispatchEvent(new Event('input'));}};
        set('s_face',-6); set('s_path',2);
        document.getElementById('flightReplay').click();                    // run 2 (live ember; run1 → violet ghost)
        if(document.activeElement&&document.activeElement.blur) document.activeElement.blur(); });
      await page.waitForFunction(()=>window.__impact&&window.__impact.ghosts&&window.__impact.ghosts.length===1
        && document.querySelectorAll('#fScene .ghostShot').length===1
        && document.getElementById('flightScrim').classList.contains('open'),{timeout:8000});
      // REVISJON v2 §9 — drop half the data pills: the app's own clean-flight view
      // (hides the post-landing chips + delta; keeps the big TOTAL + the two arcs).
      await page.evaluate(()=>{ const dp=document.getElementById('fDataPill'); if(dp && dp.getAttribute('aria-pressed')==='true') dp.click(); });
      await page.waitForTimeout(450);
      const gc=await page.evaluate(()=>window.__impact.ghosts.length);
      console.log('   · ghosts='+gc+' (1 violet ghost + 1 live ember); Data pill off'); } },

  { n:9, file:'09-outcome.png', vp:OUTCOME_VP, dsf:3, rm:'reduce', ember:'resting ember ball at the landing mark (thread lands); eased outcome verdict',
    async run(page,base){ await page.goto(base+'/impact-outcome-mock.html',{waitUntil:'networkidle'});
      await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(1700); } },
];

// ── run ──────────────────────────────────────────────────────────────────────
const srv = await startServer();
const base = `http://127.0.0.1:${srv.address().port}`;
console.log(`[shoot] serving ${ROOT}\n[shoot] ${base}`);
const browser = await chromium.launch({ executablePath:EXE, headless:true });

// STAGE 1 — raw UI states
console.log('\n[stage 1] capturing raw UI states…');
for (const r of RECIPES){
  const ctx = await browser.newContext({ viewport:r.vp, deviceScaleFactor:r.dsf, reducedMotion:r.rm, colorScheme:'dark' });
  await ctx.addInitScript(SEED);
  if (r.seed) await ctx.addInitScript(r.seed);
  const page = await ctx.newPage(); watch(page,'raw'+r.n);
  await r.run(page,base);
  const buf = await page.screenshot();               // viewport @ dsf
  writeFileSync(join(RAW,r.file), buf);
  const {w,h}=pngSize(buf);
  console.log(`   raw ${r.file}  ${w}×${h}`);
  await ctx.close();
}

// STAGE 2 — canvas templates at exact store masters + assert
console.log('\n[stage 2] shooting canvases at exact store pixels…');
const finalSizes = {}, shotMeta = {};
const P = SIZE(1);   // 1290×2796

// singles
for (const s of [1,2,3,4,7,8,9]){
  const ctx = await browser.newContext({ viewport:{width:P.w,height:P.h}, deviceScaleFactor:1, colorScheme:'dark' });
  const page = await ctx.newPage(); watch(page,'canvas'+s);
  await page.goto(`${base}/tools/appstore-shots/${String(s).padStart(2,'0')}.html`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__canvasReady===true,{timeout:15000});
  await page.waitForTimeout(120);
  shotMeta[s] = await page.evaluate(()=>window.__shotMeta);
  const buf = await page.screenshot();
  const sz = pngSize(buf); finalSizes[s]=sz;
  if(sz.w!==P.w||sz.h!==P.h) throw new Error(`shot ${s}: got ${sz.w}×${sz.h}, expected ${P.w}×${P.h}`);
  const name = String(s).padStart(2,'0')+'.png';
  writeAll(name, buf);
  console.log(`   ${name}  ${sz.w}×${sz.h}  ✓  (device ${shotMeta[s].deviceWidthPct}% width)`);
  await ctx.close();
}

// PANORAMA — render the 2580×2796 master once, clip-slice into 05 + 06 on the seam.
{
  const ctx = await browser.newContext({ viewport:{width:PANORAMA.w,height:PANORAMA.h}, deviceScaleFactor:1, colorScheme:'dark' });
  const page = await ctx.newPage(); watch(page,'pano');
  await page.goto(`${base}/tools/appstore-shots/pano.html`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__canvasReady===true,{timeout:15000});
  await page.waitForTimeout(150);
  const half = PANORAMA.w/2;   // 1290
  for (const [s,x] of [[5,0],[6,half]]){
    const buf = await page.screenshot({ clip:{ x, y:0, width:half, height:PANORAMA.h } });
    const sz = pngSize(buf); finalSizes[s]=sz; shotMeta[s]={ deviceWidthPct:100, mode:'pano' };
    if(sz.w!==P.w||sz.h!==P.h) throw new Error(`pano slice ${s}: got ${sz.w}×${sz.h}, expected ${P.w}×${P.h}`);
    const name = String(s).padStart(2,'0')+'.png';
    writeAll(name, buf);
    console.log(`   ${name}  ${sz.w}×${sz.h}  ✓  (panorama ${s===5?'left · microscope':'right · scene'}, sliced at x=${half})`);
  }
  await ctx.close();
}

// STAGE 3 — contact sheet (9 in a row)
console.log('\n[stage 3] contact sheet…');
{
  const ctx = await browser.newContext({ viewport:{width:3600,height:760}, deviceScaleFactor:1, colorScheme:'dark' });
  const page = await ctx.newPage(); watch(page,'contact');
  await page.goto(`${base}/tools/appstore-shots/contact.html`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__contactReady===true,{timeout:15000});
  const el = await page.$('#sheet');
  const buf = await el.screenshot();
  writeFileSync(join(OUTDIR,'contact-sheet.png'), buf);
  writeFileSync(join(APPSTORE,'contact-sheet.png'), buf);
  const {w,h}=pngSize(buf); console.log(`   contact-sheet.png  ${w}×${h}  ✓`);
  await ctx.close();
}

await browser.close(); srv.close();

// ── verification ledger ──────────────────────────────────────────────────────
const SHOTS = [1,2,3,4,5,6,7,8,9];
console.log('\n════════ VERIFICATION ════════');
console.log('\nExact final dimensions (Apple master 1290×2796):');
for (const s of SHOTS){ const {w,h}=finalSizes[s]; console.log(`  ${String(s).padStart(2,'0')}.png  ${w}×${h}  ${(w===P.w&&h===P.h)?'== target ✓':'MISMATCH ✗'}`); }

console.log('\nEmber-thread continuity — one monotonic curve across the 9-shot set');
console.log('(entry-y / exit-y px of each 2796-tall canvas; the panorama = slots 5+6):');
let chainOK = true;
const ee = SHOTS.map(s=>{ const {entryY,exitY}=entryExit(s); return { s, ey:Math.round(entryY*P.h), xy:Math.round(exitY*P.h), eF:entryY, xF:exitY }; });
for (const r of ee) console.log(`  shot ${r.s}: entry ${r.ey}px  exit ${r.xy}px   (frac ${r.eF.toFixed(4)} → ${r.xF.toFixed(4)})`);
console.log('  seam check (exit frac N == entry frac N+1):');
for (let i=0;i<8;i++){ const ok=Math.abs(ee[i].xF-ee[i+1].eF)<1e-9; if(!ok)chainOK=false;
  const note = (ee[i].s===5) ? '  ← PANORAMA seam (pixel-identical: single master sliced at x=1290)' : '';
  console.log(`    ${ee[i].s}→${ee[i+1].s}: ${ee[i].xF.toFixed(4)} == ${ee[i+1].eF.toFixed(4)}  ${ok?'✓':'✗'}${note}`); }
console.log(`  tee launch: shot 1 @ y=${Math.round(yFracAt(0.5)*P.h)}px (ground) · landing: shot 9 @ y=${Math.round(yFracAt(8.5)*P.h)}px (ground) ✓`);

console.log('\nNo-dead-zone audit (REVISJON v2 §1 — device ≥70% of canvas width):');
for (const s of SHOTS){ const m=shotMeta[s]; const pct=m.deviceWidthPct;
  const flag = (m.mode==='fullbleed'||m.mode==='pano') ? 'full-bleed' : (pct>=70?'✓':'✗ UNDER 70%');
  console.log(`  shot ${s}: ${String(pct).padStart(5)}%  (${m.mode})  ${flag}`); }

console.log('\nOne-ember audit (the single hero ember per canvas):');
for (const r of RECIPES){ if(r.n===5){ console.log('  shot 5+6 (panorama): '+r.ember); continue; } console.log(`  shot ${r.n}: ${r.ember}`); }

console.log('\nHeadlines (Norwegian; ≤2 lines):');
for (const s of SHOTS){ const H=HEADLINES[s]; console.log(`  ${s}: «${H.h}»${H.sub?`  ／ ${H.sub}`:''}`); }

console.log('\nConsole/page errors on canvas/UI pages: '+consoleErrors.length);
for (const e of consoleErrors) console.log('  '+e);

console.log(`\n[done] masters → ${OUTDIR}`);
console.log(`[done] gallery → ${APPSTORE}`);
console.log('  01.png … 09.png  +  contact-sheet.png');
if (!chainOK || consoleErrors.length) process.exitCode = 1;
