// canvas.js — builds one poster canvas from <body data-*> + thread.mjs (v2).
// Loaded as <script type="module">. Sets window.__canvasReady when fonts + UI
// image are painted so the rig can screenshot deterministically, and
// window.__shotMeta so the rig can assert device width (no-dead-zone check).
import { SIZE, PANORAMA, HEADLINES, threadPathD, panoramaPathD, ballAt } from './thread.mjs';

const body = document.body;
const shot = +body.dataset.shot;
const mode = body.dataset.mode || 'port';          // fullbleed|port|land|pano
const tilt = parseFloat(body.dataset.tilt || '0');
const emberMode = body.dataset.ember || 'ui';      // 'ui' or 'ball'
const uiSrc = body.dataset.ui;                      // raw UI screenshot
const isPano = mode === 'pano';
const { w, h } = isPano ? PANORAMA : SIZE(shot);
const orient = isPano ? 'pano' : 'port';
const UI_ASPECT_PORT = 430 / 932;                  // captured portrait UI
const UI_ASPECT_LAND = 932 / 430;                  // captured landscape UI
const PANO_UI_TOP = 440, PANO_UI_H = 2300;         // panorama band (matches raw 2580×2300)

// ── stage ───────────────────────────────────────────────────────────────────
const stage = document.createElement('div');
stage.className = 'stage';
stage.dataset.orient = orient;
stage.style.width = w + 'px';
stage.style.height = h + 'px';
document.body.appendChild(stage);

// ── seeded star-dust ─────────────────────────────────────────────────────────
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
(function stars(){
  const c = document.createElement('canvas'); c.id='stars'; c.width=w; c.height=h;
  stage.appendChild(c);
  const g = c.getContext('2d'); const rnd = mulberry32(0x5A1C * shot + 97);
  const n = Math.round(w*h/24000);
  for(let i=0;i<n;i++){
    const x=rnd()*w, y=rnd()*h*0.72;               // keep stars in the upper sky
    const r=rnd()*1.7+0.5; const a=(rnd()*0.6+0.15)*(1-y/(h*0.9));
    g.beginPath(); g.arc(x,y,r,0,7); g.fillStyle=`rgba(230,228,246,${a.toFixed(3)})`; g.fill();
    if(rnd()>0.985){ g.beginPath(); g.arc(x,y,r*2.4,0,7); g.fillStyle=`rgba(157,139,255,${(a*0.5).toFixed(3)})`; g.fill(); }
  }
})();

// horizon glow
const hz = document.createElement('div'); hz.className='horizon'; stage.appendChild(hz);

// ── device / UI ──────────────────────────────────────────────────────────────
function fit(availW, availH, aspect){            // aspect = screenW/screenH
  let sw = availH*aspect, sh = availH;
  if (sw > availW){ sw = availW; sh = availW/aspect; }
  return { sw:Math.round(sw), sh:Math.round(sh) };
}
let deviceWidthPx = w;                            // for __shotMeta (fullbleed/pano fill the frame)

if (mode === 'fullbleed') {
  const fb = document.createElement('div'); fb.className='fullbleed';
  const img = new Image(); img.src=uiSrc; img.decoding='sync'; fb.appendChild(img);
  stage.appendChild(fb);
} else if (isPano) {
  // The landscape two-pane geometry as a full-width band; the app's OWN pane
  // divider is centred at x=w/2 = the slice seam (guaranteed pixel-identical
  // between the two slots). Fades top/bottom into the dusk. Raw = 2580×1800.
  const band = document.createElement('div'); band.className='pano-ui';
  band.style.top = PANO_UI_TOP+'px'; band.style.height = PANO_UI_H+'px';
  const img = new Image(); img.src=uiSrc; img.decoding='sync'; band.appendChild(img);
  stage.appendChild(band);
  devGlow(w/2, PANO_UI_TOP + PANO_UI_H*0.5, w*0.92, PANO_UI_H*0.95);
} else if (mode === 'port'){
  const pad = 16;
  const box = { top: 500, bottom: h-176, cx: w/2 };
  const { sw, sh } = fit(w-150, box.bottom-box.top, UI_ASPECT_PORT);
  const cy = (box.top+box.bottom)/2;
  devGlow(box.cx, cy, sw*1.28, sh*1.4);
  const d = mkDevice('device--port', sw, sh, pad);
  place(d, box.cx, cy, tilt);
  deviceWidthPx = sw + pad*2;
} else if (mode === 'land'){
  // REVISJON v2 §1 — kill the dead zone: enlarge (~96% width), pull toward centre,
  // and lay a LARGE bright violet glow POOL beneath so the landscape UI is anchored
  // in a pool of light, not floating in void. data-zoom (>1) grows screen height +
  // object-fit:cover crops top/bottom to make the arc read bigger.
  const pad = 15;
  const zoom = parseFloat(body.dataset.zoom || '1.15');
  const cy = body.dataset.devcy ? +body.dataset.devcy : 1320;
  const sw = Math.round(Math.min(w-56, 1234));
  const sh = Math.round(sw / UI_ASPECT_LAND * zoom);
  // a wide pool centred just below the device, bleeding down toward the horizon
  devGlow(w/2, cy + sh*0.62, sw*1.9, sh*3.0, 0.34);
  devGlow(w/2, cy, sw*1.15, sh*1.5, 0.22);          // tight halo hugging the frame
  const d = mkDevice('device--land', sw, sh, pad);
  place(d, w/2, cy, tilt);
  deviceWidthPx = sw + pad*2;
}
function mkDevice(cls, sw, sh, pad){
  const d = document.createElement('div'); d.className='device '+cls;
  d.style.width=(sw+pad*2)+'px'; d.style.padding=pad+'px';
  const sc = document.createElement('div'); sc.className='screen';
  sc.style.width=sw+'px'; sc.style.height=sh+'px';
  const img = new Image(); img.src=uiSrc; img.decoding='sync';
  sc.appendChild(img); d.appendChild(sc); stage.appendChild(d);
  return d;
}
function place(el, cx, cy, deg){
  el.style.left = cx+'px'; el.style.top = cy+'px';
  el.style.transform = `translate(-50%,-50%) rotate(${deg}deg)`;
}
// soft violet spotlight so a device doesn't float in pure void
function devGlow(cx, cy, gw, gh, op){
  const o = op == null ? 0.26 : op;
  const g = document.createElement('div');
  g.style.cssText = `position:absolute;z-index:3;left:${cx}px;top:${cy}px;`+
    `width:${gw}px;height:${gh}px;transform:translate(-50%,-50%);pointer-events:none;`+
    `background:radial-gradient(50% 50% at 50% 50%, rgba(157,139,255,${o}), rgba(157,139,255,${(o*0.28).toFixed(3)}) 46%, transparent 70%);filter:blur(26px);`;
  stage.appendChild(g);
}

// ── ember flight-thread (behind the device, over full-bleed / panorama) ──────
const NS='http://www.w3.org/2000/svg';
const svg=document.createElementNS(NS,'svg'); svg.setAttribute('class','thread');
svg.setAttribute('viewBox',`0 0 ${w} ${h}`); svg.setAttribute('width',w); svg.setAttribute('height',h);
const d = isPano ? panoramaPathD(w, h) : threadPathD(shot, w, h);
for (const cls of ['glow','trail']){ const p=document.createElementNS(NS,'path'); p.setAttribute('d',d); p.setAttribute('class',cls); svg.appendChild(p); }
stage.appendChild(svg);
if (mode==='fullbleed') svg.style.zIndex='3';    // over the app art
else if (isPano) svg.style.zIndex='5';           // ember arcs over the 3D band

// ── the single travelling ember ball (only where UI has no hero ember) ───────
if (emberMode === 'ball'){
  const bx = body.dataset.ballx ? parseFloat(body.dataset.ballx) : undefined;
  const pt = ballAt(shot, w, h, bx);
  // landing mark: an ember divot ring the ball rests in (shot 9's touchdown) —
  // REVISJON v2 §8: enlarged landing glow.
  if (body.dataset.landmark === '1'){
    const ring = document.createElement('div');
    ring.style.cssText = `position:absolute;z-index:5;left:${pt.x}px;top:${pt.y}px;`+
      `width:200px;height:74px;border-radius:50%;transform:translate(-50%,-50%);`+
      `border:2px solid rgba(255,138,77,.5);box-shadow:0 0 80px 20px rgba(255,138,77,.34);`+
      `background:radial-gradient(50% 100% at 50% 50%, rgba(255,138,77,.20), transparent 72%);`;
    stage.appendChild(ring);
  }
  const b = document.createElement('div'); b.className='flyball';
  b.style.left = pt.x+'px'; b.style.top = pt.y+'px';
  stage.appendChild(b);
}

// ── SHOT 1 COMET (REVISJON v2 §7) — big, bright, lifted into upper-mid ────────
if (body.dataset.comet === '1'){
  const cx = (body.dataset.cometx ? parseFloat(body.dataset.cometx) : 0.60) * w;
  const cy = (body.dataset.comety ? parseFloat(body.dataset.comety) : 0.44) * h;
  const scale = parseFloat(body.dataset.cometscale || '1');
  const c = document.createElement('div'); c.className='comet';
  c.style.left = cx+'px'; c.style.top = cy+'px'; c.style.transform = `translate(-50%,-50%) scale(${scale})`;
  c.innerHTML = `<div class="tail"></div><div class="head"></div>`;
  stage.appendChild(c);
}

// ── headline(s) + subline ─────────────────────────────────────────────────────
if (isPano){
  const hl = document.createElement('div'); hl.className='headline pano-l'; hl.textContent = HEADLINES[5].h; stage.appendChild(hl);
  const hr = document.createElement('div'); hr.className='headline pano-r'; hr.textContent = HEADLINES[6].h; stage.appendChild(hr);
} else {
  const HL = HEADLINES[shot];
  const head = document.createElement('div'); head.className='headline'; head.textContent = HL.h; stage.appendChild(head);
  if (HL.sub){
    const sub = document.createElement('div'); sub.className='subline'; sub.textContent = HL.sub;
    stage.appendChild(sub);
    // drop the subline just below the headline block once it has laid out
    requestAnimationFrame(()=>{ const r=head.getBoundingClientRect(); sub.style.top = (r.bottom + 24)+'px'; });
  }
}

// ── «Tonight at the range» invite card (shot 9 only) ─────────────────────────
if (body.dataset.invite === '1'){
  const card = document.createElement('div'); card.className='invite';
  card.innerHTML = `<div class="eyebrow">Tonight at the range</div>
    <div class="line">One drill. One number to beat.</div>
    <div class="cta">Try it <span aria-hidden="true">→</span></div>`;
  stage.appendChild(card);
}

// ── wordmark signature (skip on full-bleed / panorama — the app carries its own) ─
if (mode !== 'fullbleed' && !isPano){
  const wm = document.createElement('div'); wm.className='wordmark';
  wm.innerHTML = `<svg class="arc" viewBox="0 0 40 40" aria-hidden="true"><path d="M6 30 Q20 4 34 30"/><circle cx="20" cy="12" r="3.6"/></svg><span>StrikeArc</span>`;
  stage.appendChild(wm);
}

// grain on top
const grain = document.createElement('div'); grain.className='grain'; stage.appendChild(grain);

// measurement hook (no-dead-zone audit): device width as % of canvas width
window.__shotMeta = { shot, mode, canvasW:w, deviceWidthPx, deviceWidthPct:+(deviceWidthPx/w*100).toFixed(1) };

// ── readiness ────────────────────────────────────────────────────────────────
(async function ready(){
  try { await document.fonts.ready; } catch(e){}
  const imgs = [...stage.querySelectorAll('img')];
  await Promise.all(imgs.map(im => im.complete && im.naturalWidth ? Promise.resolve()
    : new Promise(res => { im.onload=res; im.onerror=res; })));
  await new Promise(r => requestAnimationFrame(()=>requestAnimationFrame(r)));
  window.__canvasReady = true;
})();
