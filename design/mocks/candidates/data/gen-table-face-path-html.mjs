// Renders design/mocks/candidates/table-face-path-outcome-matrix.html
// Every number comes from tabell-face-path-outcome-matrix.json, which is
// itself written by gen-face-path-outcome-matrix.mjs from impact-flight.js.
// Nothing here is transcribed by hand. Run:
//   node outputs/agent-scan/gen-face-path-outcome-matrix.mjs
//   node outputs/agent-scan/gen-table-face-path-html.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const data = JSON.parse(readFileSync(resolve(here, 'tabell-face-path-outcome-matrix.json'), 'utf8'));
const out = resolve(root, 'design', 'mocks', 'candidates', 'table-face-path-outcome-matrix.html');

const { rowsFaceAngleDeg: FACE, colsClubPathDeg: PATH, cells, sensitivity, fixedInputs } = data;
const at = (f, p) => cells.find((c) => c.faceAngle === f && c.clubPath === p);

// ---- derived facts used in the prose (never typed by hand) -----------------
const abs = (n) => Math.abs(n);
const maxOff = Math.max(...cells.map((c) => abs(c.offline)));
const carrySpread = Math.max(...cells.map((c) => c.carry)) - Math.min(...cells.map((c) => c.carry));
const ratio = abs(sensitivity.offlineYdPerDegFace / sensitivity.offlineYdPerDegPath);
const curvePerDeg = cells
  .filter((c) => c.faceToPath !== 0)
  .map((c) => abs(c.curve / c.faceToPath));
const curveLo = Math.min(...curvePerDeg);
const curveHi = Math.max(...curvePerDeg);
const straight = cells.filter((c) => c.offline === 0);
if (straight.length !== 1) throw new Error(`expected exactly one on-target cell, got ${straight.length}`);

// tick track geometry: shared +/-24 yd scale, 2.6%..97.4% of a 4.4em track
const SPAN = 24;
const TRACK_EM = 3.7;
const xPct = (off) => 50 + (off / SPAN) * 48;
const dxEm = (off) => (((50 - xPct(off)) / 100) * TRACK_EM).toFixed(3);

const oneDp = (n) => n.toFixed(1);
const deg = (n) => (n < 0 ? '−' : '') + abs(n) + '°';

const faceWord = (f) => (f === 0 ? 'square' : f < 0 ? 'closed' : 'open');
const pathWord = (p) => (p === 0 ? 'neutral' : p < 0 ? 'out-in' : 'in-out');
const faceSr = (f) => (f === 0 ? 'Face square' : `Face ${abs(f)} degrees ${f < 0 ? 'closed' : 'open'}`);
const pathSr = (p) =>
  p === 0 ? 'Path neutral' : `Path ${abs(p)} degrees ${p < 0 ? 'out-to-in' : 'in-to-out'}`;

// ---- markup ---------------------------------------------------------------
const thead = `        <tr>
          <td class="corner"><span aria-hidden="true"><i><b>Face</b>&#8201;&#8595;</i><i><b>Path</b>&#8201;&#8594;</i></span></td>
${PATH.map(
  (p) => `          <th scope="col"><span aria-hidden="true"><b>${deg(p)}</b><em>${pathWord(
    p
  )}</em></span><span class="sr">${pathSr(p)}</span></th>`
).join('\n')}
        </tr>`;

const tbody = FACE.map((f, ri) => {
  const tds = PATH.map((p) => {
    const c = at(f, p);
    const on = c.offline === 0;
    const side = on ? '' : c.offline < 0 ? 'L' : 'R';
    const srSide = on ? ' yards — dead straight' : ` yards ${c.offline < 0 ? 'left' : 'right'}`;
    const tint = (0.2 * (abs(c.offline) / maxOff)).toFixed(3);
    return `          <td class="cell${on ? ' anchor' : ''}" style="--tint:${tint};--x:${xPct(
      c.offline
    ).toFixed(2)}%;--dx:${dxEm(c.offline)}em;--d:${ri * 55}ms">
            <span class="val"><span class="num">${oneDp(abs(c.offline))}</span>${
      side ? `<span class="side" aria-hidden="true">${side}</span>` : ''
    }<span class="sr">${srSide}</span></span>
            <span class="shape">${c.shape}</span>
            <span class="track" aria-hidden="true"><i class="tick"></i></span>
          </td>`;
  }).join('\n');
  return `        <tr>
          <th scope="row"><span aria-hidden="true"><b>${deg(f)}</b><em>${faceWord(
    f
  )}</em></span><span class="sr">${faceSr(f)}</span></th>
${tds}
        </tr>`;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>Where the ball finishes &#183; Face and path</title>
<style>
  :root{
    --ink:#07060C; --glass:#F5F2ED; --ember:#FF8A4D; --violet:#9D8BFF;
    --dim:#A79FC0;
    --rule:rgba(157,139,255,.15);
    --mono:ui-monospace,"SF Mono","JetBrains Mono","Cascadia Mono",Menlo,Consolas,monospace;
    --serif:"Iowan Old Style",Palatino,"Palatino Linotype",Georgia,serif;
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
    --pad:clamp(1.1rem,4vw,2.25rem);
    --out:cubic-bezier(.23,1,.32,1);
  }
  *,*::before,*::after{box-sizing:border-box}
  html,body{overflow-x:clip}
  html{-webkit-text-size-adjust:100%}
  body{
    margin:0; background:var(--ink); color:var(--glass);
    font-family:var(--sans); font-size:100%; line-height:1.5;
    -webkit-font-smoothing:antialiased;
  }
  .sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
      clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}

  .page{
    max-width:47rem; margin-inline:auto;
    padding:clamp(2rem,7vw,4.5rem) calc(var(--pad) + env(safe-area-inset-right))
            calc(3rem + env(safe-area-inset-bottom))
            calc(var(--pad) + env(safe-area-inset-left));
  }

  h1{
    font-family:var(--serif); font-weight:400;
    font-size:clamp(2rem,7.5vw,3.15rem); line-height:1.04;
    letter-spacing:-.02em; margin:0 0 1.15rem; text-wrap:balance;
  }
  .lead{
    max-width:66ch; margin:0 0 1rem;
    font-size:clamp(1rem,2.5vw,1.09rem); line-height:1.62; color:#D9D4E4;
  }
  .lead:last-of-type{margin-bottom:0}
  .lead strong{color:var(--glass); font-weight:650}
  .lead em{font-style:italic; color:var(--glass)}
  .q{font-family:var(--mono); font-size:.94em; font-weight:600;
     color:var(--glass); font-variant-numeric:tabular-nums; white-space:nowrap}

  /* ---- table -------------------------------------------------------- */
  .gridwrap{position:relative; margin-top:clamp(2rem,6vw,3.25rem)}
  .scroller{
    container-type:inline-size;
    overflow-x:auto; overscroll-behavior-x:contain;
    -webkit-overflow-scrolling:touch;
    border-top:1px solid var(--rule); border-bottom:1px solid var(--rule);
    scrollbar-width:thin; scrollbar-color:rgba(157,139,255,.45) transparent;
  }
  .scroller::-webkit-scrollbar{height:6px}
  .scroller::-webkit-scrollbar-track{background:transparent}
  .scroller::-webkit-scrollbar-thumb{background:rgba(157,139,255,.45); border-radius:3px}
  .scroller:focus-visible{outline:2px solid var(--violet); outline-offset:3px}
  /* The grid is ~29em wide, so below 34rem it always overflows. Only then is
     an edge fade honest — above it there is nothing hidden to hint at. */
  .swipe{display:none}
  @media (max-width:34rem){
    .gridwrap::after{content:""; position:absolute; top:1px; right:0; bottom:1px;
      width:2.75rem; pointer-events:none;
      background:linear-gradient(to left,var(--ink) 12%,rgba(7,6,12,0))}
    .swipe{display:block; margin:.7rem 0 0; font-size:.75rem; color:var(--dim)}
  }

  table{
    border-collapse:collapse; width:max-content; min-width:100%;
    font-variant-numeric:tabular-nums;
  }
  /* Browsers force a <caption> box to the table's width, so max-width on the
     caption itself is ignored and the text runs off under the scroller's clip.
     Constrain an inner block instead, and pin that to the visible width —
     100vw would count the scrollbar, so measure the scroll container. */
  caption{text-align:left; padding:1.05rem 0 1.2rem;
          font-size:.8125rem; line-height:1.55; color:var(--dim)}
  .capinner{display:block; position:sticky; left:0;
            max-width:min(100%,calc(100vw - 2 * var(--pad) - 1rem));
            max-width:100cqw}
  caption b{color:var(--glass); font-weight:600}

  th,td{padding:.55rem .45rem; text-align:center; vertical-align:top;
        border-bottom:1px solid var(--rule); border-right:1px solid var(--rule)}
  tr>*:last-child{border-right:0}
  tbody tr:last-child>*{border-bottom:0}

  thead th,tbody th,.corner{
    font-family:var(--mono); font-weight:500; white-space:nowrap;
    background:var(--ink); color:var(--dim);
  }
  thead th span[aria-hidden],tbody th span[aria-hidden],.corner span{
    display:flex; flex-direction:column; gap:.14rem; align-items:center;
  }
  thead th b,tbody th b{font-size:.9rem; font-weight:600; color:var(--glass); letter-spacing:.01em}
  thead th em,tbody th em{font-style:normal; font-size:.625rem; letter-spacing:.09em;
                          text-transform:uppercase; color:var(--dim)}

  tbody th[scope=row]{position:sticky; left:0; z-index:2;
                      border-right:1px solid rgba(157,139,255,.3); text-align:center}
  .corner{position:sticky; left:0; z-index:3; text-align:left;
          border-right:1px solid rgba(157,139,255,.3)}
  .corner span{align-items:flex-start; font-size:.625rem; line-height:1.55;
               letter-spacing:.05em; color:var(--violet)}
  .corner i{font-style:normal}
  .corner b{color:var(--glass); font-weight:600}

  .cell{background:rgba(157,139,255,var(--tint,0)); white-space:nowrap}
  .val{display:block; font-family:var(--mono); font-size:.9375rem;
       font-weight:600; letter-spacing:-.01em; line-height:1.15}
  .side{margin-left:.22em; font-size:.72em; font-weight:500; color:var(--violet)}
  .shape{display:block; margin-top:.2rem; font-family:var(--mono);
         font-size:.625rem; letter-spacing:.05em; color:var(--dim)}

  /* a ruler, not a chart: a shared range rule, a subordinate notch at the
     target line, and one dominant mark for this shot's finish. */
  .track{display:block; position:relative; width:${TRACK_EM}em; height:.9em;
         margin:.44rem auto .06rem}
  .track::before{content:""; position:absolute; left:0; right:0; top:.55em;
                 height:1px; background:rgba(157,139,255,.26)}
  .track::after{content:""; position:absolute; left:50%; top:.6em;
                width:1px; height:.3em; margin-left:-.5px;
                background:rgba(157,139,255,.6)}
  .tick{position:absolute; left:var(--x); top:0; width:2px; height:.6em;
        margin-left:-1px; background:var(--glass); border-radius:1px}

  .anchor{box-shadow:inset 0 0 0 1px rgba(255,138,77,.45); background:rgba(255,138,77,.12)}
  .anchor .val{color:var(--ember)}
  .anchor .tick{background:var(--ember)}
  .anchor .track::after{background:rgba(255,138,77,.65)}

  /* one authored moment: the ticks land outward from the target line.
     The default (and reduced-motion) state is the final state. */
  @media (prefers-reduced-motion:no-preference){
    .tick{animation:land 560ms var(--out) both; animation-delay:var(--d,0ms)}
    @keyframes land{from{transform:translateX(var(--dx)); opacity:0}}
  }

  .hint{margin:.9rem 0 0; font-size:.75rem; color:var(--dim)}
  .hint b{color:var(--ember); font-weight:600}

  .prov{margin:clamp(2.25rem,6vw,3.25rem) 0 0; padding-top:1.35rem;
        border-top:1px solid var(--rule); max-width:66ch}
  .prov h2{font-family:var(--sans); font-size:.6875rem; font-weight:600;
           letter-spacing:.16em; text-transform:uppercase; color:var(--dim); margin:0 0 .85rem}
  .prov p{margin:0 0 .7rem; font-size:.8125rem; line-height:1.6; color:var(--dim)}
  .prov p:last-child{margin-bottom:0}
  .prov code{font-family:var(--mono); font-size:.94em; color:#C6BEE0}
</style>
</head>
<body>
<main class="page">

  <h1>Where the ball finishes</h1>

  <p class="lead"><strong>Face angle decides it; club path barely argues.</strong>
  Sweep both from ${abs(FACE[0])}&#176; closed to ${FACE[FACE.length - 1]}&#176; open and hold
  everything else fixed, and each degree of face moves the finish
  <span class="q">${oneDp(sensitivity.offlineYdPerDegFace)}&#8239;yd</span> &#8212; while each
  degree of path moves it only <span class="q">${oneDp(abs(sensitivity.offlineYdPerDegPath))}&#8239;yd</span>,
  in the <em>opposite</em> direction. Face is ${ratio.toFixed(
    1
  )}&#215; stronger and opposite in sign, so the shots that finish
  near the target line run in a shallow diagonal rather than straight down the square-face column:
  2&#176; closed against a 4&#176; out-to-in path still finishes
  <span class="q">${oneDp(abs(at(-2, -4).offline))}&#8239;yd</span> left, and 2&#176; open against a
  4&#176; in-to-out path finishes the same distance right. Square face with a neutral path is the
  only dead-straight shot in the grid.</p>

  <p class="lead">The worst misses sit in opposite <em>corners</em>, not at the edges:
  4&#176; closed against a 4&#176; in-to-out path is
  <span class="q">${oneDp(abs(at(-4, 4).offline))}&#8239;yd</span> left, and its mirror is the same
  distance right. Curve comes only from the gap between face and path &#8212; where they match, along
  the leading diagonal, the ball never bends, it just starts offline and stays there, which is why
  4&#176; closed with a 4&#176; out-to-in path is a dead-straight Pull finishing
  <span class="q">${oneDp(abs(at(-4, -4).offline))}&#8239;yd</span> left. Every degree of gap adds
  roughly <span class="q">${curveLo.toFixed(1)}&#8211;${curveHi.toFixed(1)}&#8239;yd</span> of curve.
  Carry moves <span class="q">${carrySpread.toFixed(
    1
  )}&#8239;yd</span> across all ${cells.length} shots. The whole cost is sideways.</p>

  <div class="gridwrap">
  <div class="scroller" role="region" aria-labelledby="matrix-caption" tabindex="0">
    <table>
      <caption id="matrix-caption"><span class="capinner">
        <b>Face and path &#8212; where the ball finishes.</b>
        Rows are club face angle, columns are club path, both swept
        ${deg(FACE[0])} to ${deg(FACE[FACE.length - 1])}. Each cell is the ball&#8217;s lateral
        finish in yards left or right of the target line, with its shot shape.
        Dynamic loft ${fixedInputs.dynamicLoft}&#176;, attack angle
        ${deg(fixedInputs.attackAngle)}, club speed ${fixedInputs.clubSpeed}&#8239;mph, held fixed.
      </span></caption>
      <thead>
${thead}
      </thead>
      <tbody>
${tbody}
      </tbody>
    </table>
  </div>
  </div>

  <p class="swipe">The face column stays pinned &#8212; scroll the grid sideways for the
  ${deg(PATH[PATH.length - 1])} path column.</p>

  <p class="hint"><b>&#9646;</b> The one ember cell is the only shot in the grid that finishes on the
  target line. Everything else is measured from it.</p>

  <footer class="prov">
    <h2>How these numbers were made</h2>
    <p>All ${cells.length} cells re-derived from <code>${data.engine}</code> in
    <code>impact-flight.js</code> via <code>${data.generatedBy}</code>. No figure on this page is
    transcribed; the page itself is generated from that run. Exact sensitivities:
    <code>${sensitivity.offlineYdPerDegFace > 0 ? '+' : ''}${sensitivity.offlineYdPerDegFace}</code>
    yd per degree of face, <code>${sensitivity.offlineYdPerDegPath}</code> yd per degree of path.</p>
    <p>The mark under each value is a <em>scaled reading, not a measurement</em>: it places the
    finish on a shared &#177;${SPAN}&#8239;yd track shown at identical width in every cell. The
    number above it is the truth; the mark exists so the ${ratio.toFixed(
      1
    )}&#215; step between rows and the small step between columns are visible at a glance.</p>
    <p>Aero validity: ${data.aeroNote}</p>
  </footer>

</main>
</body>
</html>
`;

writeFileSync(out, html, 'utf8');
console.log(`wrote ${out}`);
console.log(`cells=${cells.length} maxOffline=${maxOff.toFixed(3)} carrySpread=${carrySpread.toFixed(3)}`);
console.log(`faceVsPath=${ratio.toFixed(3)}x  curvePerDegGap=${curveLo.toFixed(3)}..${curveHi.toFixed(3)}`);
console.log(`onTargetCells=${straight.length} (face ${straight[0].faceAngle}, path ${straight[0].clubPath})`);
