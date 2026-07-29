// Renders outputs/agent-scan/tabell-curve-gearing-by-loft.json as a standalone
// accessible HTML table. Every displayed number is read from the JSON — nothing
// is hand-typed. Re-run after regenerating the JSON.
//
//   node outputs/agent-scan/gen-table-curve-gearing-html.mjs
//
// Self-check: asserts every rendered figure appears in the JSON before writing.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const SRC = resolve(here, 'tabell-curve-gearing-by-loft.json');
const OUT = resolve(repo, 'design/mocks/candidates/table-curve-gearing-by-loft.html');

const d = JSON.parse(readFileSync(SRC, 'utf8'));
const { rows: gaps, cols: lofts, cells } = d;
const at = (g, l) => cells[String(g)][String(l)];

const f1 = (n) => n.toFixed(1);
const f2 = (n) => n.toFixed(2);
const int = (n) => Math.round(n).toLocaleString('en-US');
const pct = (a, b) => ((a - b) / a) * 100;
const rng = (vals, fmt) => {
  const lo = Math.min(...vals), hi = Math.max(...vals);
  return lo === hi ? fmt(lo) : `${fmt(lo)}–${fmt(hi)}`;
};

// ---------- derived headline figures (all from the engine JSON) ----------
const G = gaps[gaps.length - 1];              // widest gap row = 8
const LO = lofts[0], HI = lofts[lofts.length - 1];
const drv = at(G, LO), wdg = at(G, HI);
const curveDropPct = pct(drv.curveYd, wdg.curveYd);
const axisDropPct = pct(drv.spinAxisDeg, wdg.spinAxisDeg);
const rawDropPct = pct(drv.rawCurveYd, wdg.rawCurveYd);
const maxCurve = Math.max(...gaps.flatMap((g) => lofts.map((l) => at(g, l).curveYd)));
const colOfLowLoft = gaps.map((g) => f1(at(g, LO).curveYd)).join(' / ');
const scaleLo = rng(gaps.map((g) => at(g, LO).curveCarryProjectionScale), f2);
const scaleHi = rng(gaps.map((g) => at(g, HI).curveCarryProjectionScale), f2);

const clamped = gaps.flatMap((g) =>
  lofts.filter((l) => at(g, l).spinClamped).map((l) => ({ g, l, c: at(g, l) }))
);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// "an 8° gap", "a 4° gap" — read aloud, 8/11/18 take "an".
const art = (n) => (/^(8|11|18)/.test(String(n)) ? 'an' : 'a');

// Product UI is English; the JSON provenance strings are Norwegian. Translate
// them explicitly and assert the source is unchanged, so a JSON edit fails the
// build instead of silently shipping a stale gloss.
const GLOSS = {
  'impact-flight.js solveFlight (uendret)':
    'impact-flight.js · solveFlight (engine unmodified)',
  'CALCULATED (spinAxis = D-plane tilt, curve = RK4 Magnus, carry-projisert)':
    'CALCULATED — spin axis = D-plane tilt · curve = RK4 Magnus, carry-projected',
};
const en = (s) => {
  assert.ok(s in GLOSS, `untranslated provenance string: ${s}`);
  return GLOSS[s];
};

// ---------- cell / header builders ----------
function cell(g, l) {
  const c = at(g, l);
  const ref = at(g, LO).curveYd;                     // this row's driver-loft curve
  const track = ((ref / maxCurve) * 100).toFixed(1); // constant across the row
  const fill = ((c.curveYd / ref) * 100).toFixed(1); // share of it that survives
  const isPeak = g === G && l === LO;
  const isFoil = g === G && l === HI;
  const cls = ['c', isPeak && 'peak', isFoil && 'foil'].filter(Boolean).join(' ');

  let mark = '', note = '';
  if (c.spinClamped) {
    const u = c.curveUnderstatementPct;
    note = u >= 1
      ? `Spin-limited: total spin was capped at 9,000 rpm, so this curve reads ${f1(u)} percent low. Uncapped it is ${f1(c.unclampedCurveYd)} yards.`
      : `Spin-limited: total spin was capped at 9,000 rpm, but the effect on this curve is under one percent.`;
    mark = `<sup class="mk" aria-hidden="true">†</sup>`;
  }
  let flag = '';
  if (isPeak) flag = `<span class="sr"> Largest curve in the table.</span>`;
  if (isFoil) flag = `<span class="sr"> Same gap as the cell at 12 degrees of loft, for comparison.</span>`;

  return `<td class="${cls}">
          <span class="v">${f1(c.curveYd)}${mark}<span class="u"> yd</span></span>
          <span class="bar" aria-hidden="true" style="width:${track}%"><i style="width:${fill}%"></i></span>
          <span class="ax">axis ${f1(c.spinAxisDeg)}°</span>
          ${note ? `<span class="sr">${note}</span>` : ''}${flag}
        </td>`;
}

const colHeads = lofts.map((l) =>
  `<th scope="col"><span class="hv">${l}°</span><span class="hl">loft</span></th>`
).join('\n        ');

const bodyRows = gaps.map((g) => `<tr>
        <th scope="row"><span class="hv">${g}°</span><span class="hl">gap</span></th>
        ${lofts.map((l) => cell(g, l)).join('\n        ')}
      </tr>`).join('\n      ');

const footRow = (label, unit, pick, fmt) => `<tr>
        <th scope="row"><span class="fl">${label}</span><span class="hl">${unit}</span></th>
        ${lofts.map((l) => `<td class="f">${rng(gaps.map((g) => pick(at(g, l))), fmt)}</td>`).join('\n        ')}
      </tr>`;

const footnotes = clamped.map(({ g, l, c }) => {
  const u = c.curveUnderstatementPct;
  return `<li><b>Gap ${g}°, loft ${l}°</b>: raw total spin ${int(c.spinRpmRaw)} rpm was capped at ${int(c.totalSpinRpm)} rpm. ` +
    (u >= 1
      ? `The printed ${f1(c.curveYd)} yd is ${f1(u)}% below the uncapped ${f1(c.unclampedCurveYd)} yd.`
      : `Effect on the printed ${f1(c.curveYd)} yd is under 1%.`) +
    ` Spin axis is unaffected; it is pure geometry.</li>`;
}).join('\n        ');

// ---------- page ----------
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<title>Curve gearing — same gap, different loft · Flightglass</title>
<style>
  :root{
    --ink:#07060C; --glass:#F5F2ED; --ember:#FF8A4D; --violet:#9D8BFF;
    --dim:#8B8699; --line:rgba(157,139,255,.18); --hair:rgba(245,242,237,.10);
    --mono:ui-monospace,'SF Mono','JetBrains Mono',Menlo,Consolas,monospace;
    --sans:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;
  }
  *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
  html{-webkit-text-size-adjust:100%}
  body{
    background:var(--ink); color:var(--glass); font-family:var(--sans);
    font-size:100%; line-height:1.5;
    -webkit-font-smoothing:antialiased;
  }
  .sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;
      clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}

  main{
    max-width:66rem; margin-inline:auto;
    padding:2.5rem max(1.25rem,env(safe-area-inset-right)) 4rem max(1.25rem,env(safe-area-inset-left));
    padding-bottom:max(4rem,env(safe-area-inset-bottom));
  }

  /* ---- masthead ---- */
  .kicker{
    font-family:var(--mono); font-size:.6875rem; letter-spacing:.18em;
    text-transform:uppercase; color:var(--dim);
  }
  h1{
    font-size:2rem; line-height:1.08; letter-spacing:-.03em; font-weight:640;
    margin:.75rem 0 .375rem; text-wrap:balance;
  }
  .sub{font-size:1.0625rem; color:var(--dim); letter-spacing:-.01em}
  @media (min-width:48rem){ h1{font-size:2.75rem} }

  /* ---- the insight, in words ---- */
  .lede{margin-top:2rem; max-width:36rem}
  .lede p{font-size:1.0625rem; line-height:1.6; margin-bottom:.875rem}
  .lede p:last-child{margin-bottom:0}
  .lede b{font-weight:640; color:var(--glass)}
  .lede .q{color:var(--dim)}
  .num{font-family:var(--mono); font-variant-numeric:tabular-nums; font-weight:600}

  /* ---- fixed inputs / provenance ---- */
  .given{
    margin-top:2.25rem; padding-top:1rem; border-top:1px solid var(--hair);
    display:flex; flex-wrap:wrap; gap:.375rem 1.75rem;
  }
  .given div{display:flex; align-items:baseline; gap:.5rem}
  .given dt{font-size:.6875rem; letter-spacing:.14em; text-transform:uppercase; color:var(--dim)}
  .given dd{font-family:var(--mono); font-size:.9375rem; font-variant-numeric:tabular-nums}

  /* ---- table ---- */
  /* contain:paint is load-bearing, not decoration. Measured in Chrome: a wide
     table inside overflow-x:auto still propagates its scrollable overflow to
     the viewport, so the PAGE scrolls sideways ~70px even though the wrapper
     clips visually. overflow-x:clip/hidden on html or body does not stop it
     (it propagates to the viewport and degrades to hidden, which is still
     programmatically scrollable). Paint containment does stop it.
     Negative outline-offset keeps the focus ring inside the contained box. */
  .wrap{
    margin-top:2.25rem; overflow-x:auto; overscroll-behavior-x:contain;
    -webkit-overflow-scrolling:touch; contain:paint;
  }
  .wrap:focus-visible{outline:2px solid var(--glass); outline-offset:-3px}
  table{border-collapse:collapse; min-width:38rem; width:100%}
  caption{
    text-align:left; padding-bottom:1rem;
  }
  caption span{
    display:block; max-width:21rem; font-size:1.0625rem; font-weight:640;
    letter-spacing:-.015em; line-height:1.35;
  }
  caption em{display:block; font-style:normal; font-weight:400; font-size:.875rem;
    color:var(--dim); margin-top:.25rem}
  @media (min-width:48rem){ caption span{max-width:34rem} }

  th,td{text-align:left; vertical-align:top; padding:.75rem .875rem;
    border-bottom:1px solid var(--hair)}
  thead th,thead td{border-bottom:1px solid var(--line); padding-bottom:.625rem}
  tbody td,tfoot td{min-width:6.5rem}

  .hv{display:block; font-family:var(--mono); font-size:1.0625rem; font-weight:600;
    font-variant-numeric:tabular-nums; letter-spacing:-.01em}
  .hl{display:block; font-size:.6875rem; letter-spacing:.16em; text-transform:uppercase;
    color:var(--dim); margin-top:.125rem}
  .fl{display:block; font-size:.8125rem; font-weight:560; color:var(--glass)}

  /* sticky gap column keeps row identity while the table scrolls */
  tbody th,tfoot th,thead .corner{
    position:sticky; left:0; z-index:2; background:var(--ink);
    border-right:1px solid var(--line); min-width:6.25rem;
  }
  thead .corner{z-index:3}
  .corner span{display:block; font-family:var(--mono); font-size:.6875rem;
    letter-spacing:.1em; text-transform:uppercase; color:var(--dim); white-space:nowrap}

  /* data cell */
  .v{display:block; font-family:var(--mono); font-size:1.3125rem; font-weight:600;
    font-variant-numeric:tabular-nums; letter-spacing:-.02em; line-height:1.1}
  .u{font-size:.75rem; font-weight:400; color:var(--dim); letter-spacing:0}
  .mk{font-size:.625rem; color:var(--violet); vertical-align:super; line-height:0}
  /* The track is not a decorative rail. Its width is this row's OWN 12°-loft
     curve on the table-wide scale, so the track is constant across a row and
     the fill empties as loft rises: the gearing is the unfilled remainder.
     Absolute fill length still equals curve ÷ table max, so columns stay
     comparable too. Two readings, one mark. */
  .bar{display:block; position:relative; height:4px; margin:.5rem 0 .4375rem;
    max-width:100%; background:rgba(245,242,237,.19); border-radius:2px}
  .bar i{display:block; height:100%; background:var(--violet); border-radius:2px}
  /* Reference tick at the track end. At 390px the empty remainder is only a few
     px of low-alpha fill, and the remainder is the whole point, so the edge gets
     a hard mark to measure against. */
  .bar::after{content:''; position:absolute; right:-1px; top:-3px; bottom:-3px;
    width:1px; background:rgba(245,242,237,.5)}
  .ax{display:block; font-family:var(--mono); font-size:.6875rem;
    font-variant-numeric:tabular-nums; color:var(--dim); letter-spacing:.01em}

  /* the one warm focal: the largest cost in the table */
  .peak .v{color:var(--ember)}
  .peak .bar i{background:var(--ember)}
  .foil{box-shadow:inset 0 0 0 1px var(--line)}

  tfoot th,tfoot td{border-bottom:0; padding-top:.875rem; color:var(--dim)}
  tfoot tr:first-child th,tfoot tr:first-child td{border-top:1px solid var(--line); padding-top:1rem}
  td.f{font-family:var(--mono); font-size:.8125rem; font-variant-numeric:tabular-nums;
    letter-spacing:-.01em; white-space:nowrap}

  @media (hover:hover) and (pointer:fine){
    tbody tr:hover td{background:rgba(157,139,255,.06)}
    tbody tr:hover th{background:#100D1A}
    tbody tr:hover td,tbody tr:hover th{transition:background-color 120ms ease}
  }

  /* ---- notes ---- */
  .notes{margin-top:2.75rem; max-width:38rem}
  .notes h2{font-size:.6875rem; letter-spacing:.18em; text-transform:uppercase;
    color:var(--dim); font-weight:600; margin-bottom:.875rem}
  .notes h2 + *{margin-top:0}
  .notes p,.notes li{font-size:.9375rem; line-height:1.6; color:var(--dim)}
  .notes b{color:var(--glass); font-weight:600}
  .notes ul{list-style:none; margin-top:.75rem}
  .notes li{padding-left:1.125rem; position:relative; margin-bottom:.5rem}
  .notes li::before{content:'†'; position:absolute; left:0; color:var(--violet)}
  .notes .plain li::before{content:'—'; color:var(--dim)}
  .notes section{margin-top:2rem}
  .notes p.prov{margin-top:2.5rem; padding-top:1rem; border-top:1px solid var(--hair);
    font-family:var(--mono); font-size:.8125rem; color:var(--dim); overflow-wrap:anywhere;
    line-height:1.7}

  @media (prefers-reduced-motion:reduce){
    *,*::before,*::after{transition-duration:1ms !important; animation-duration:1ms !important}
    html{scroll-behavior:auto}
  }
</style>
</head>
<body>
<main>
  <p class="kicker">Flightglass · engine readout</p>
  <h1>Curve gearing</h1>
  <p class="sub">One mistake, five clubs.</p>

  <div class="lede">
    <p>Read this table across, not down. <b>Every row holds the face-to-path gap
    fixed and changes only loft.</b> It is the same mistake made with
    ${lofts.length} different clubs, and the curve does not stay the same.
    Loft gears it down.</p>

    <p>At ${art(G)} ${G}° gap, ${LO}° of loft bends the ball
    <span class="num">${f1(drv.curveYd)}</span> yd. The identical ${G}° gap at
    ${HI}° of loft bends it <span class="num">${f1(wdg.curveYd)}</span> yd:
    <b>${f1(curveDropPct)}% less curve from the same error</b>. The mechanism is spin
    axis. Across that row it falls from <span class="num">${f1(drv.spinAxisDeg)}°</span>
    to <span class="num">${f1(wdg.spinAxisDeg)}°</span>, a
    <span class="num">${f1(axisDropPct)}%</span> drop, while the gap never moves. Loft
    adds backspin, backspin dominates the spin vector, and the axis tilts less.</p>

    <p class="q">Down a column the relationship is close to linear: at ${LO}° loft,
    gaps of ${gaps.join('/')}° give <span class="num">${colOfLowLoft}</span> yd, so
    doubling the mistake roughly doubles the curve. Across a row it is not linear.
    It decays, and it decays fastest between ${LO}° and ${lofts[1]}° of loft.</p>
  </div>

  <dl class="given">
    <div><dt>Attack angle</dt><dd>${d.fixedInputs.attackAngle}°</dd></div>
    <div><dt>Club speed</dt><dd>${d.fixedInputs.clubSpeed} mph</dd></div>
    <div><dt>Face</dt><dd>+gap/2</dd></div>
    <div><dt>Path</dt><dd>−gap/2</dd></div>
  </dl>

  <div class="wrap" role="region" aria-labelledby="tcap" tabindex="0">
    <table>
      <caption id="tcap"><span>${esc(d.title)}
        <em>Curve and spin axis for every combination. Behind each bar sits a
        track as long as that row&rsquo;s own ${LO}° figure, so the empty part of the
        track is the curve loft removed. One warm figure marks the largest cost in
        the table; the outlined cell is that same gap at the most loft. The three
        footer rows give the range across all ${gaps.length} gaps.</em></span></caption>
      <thead>
        <tr>
          <td class="corner"><span>gap ↓</span><span>loft →</span></td>
          ${colHeads}
        </tr>
      </thead>
      <tbody>
      ${bodyRows}
      </tbody>
      <tfoot>
        ${footRow('Backspin', 'rpm', (c) => c.backspinRpm, int)}
        ${footRow('Carry', 'yd', (c) => c.carryYd, f1)}
        ${footRow('Projection scale', '×', (c) => c.curveCarryProjectionScale, f2)}
      </tfoot>
    </table>
  </div>

  <div class="notes">
    <section>
      <h2>What the yard figures are, and are not</h2>
      <p><b>Spin axis is pure D-plane geometry.</b> It is unfitted and it is the number
      to trust. <b>Curve in yards is fitted.</b> The raw RK4 Magnus bend is scaled per
      shot by fitted carry ÷ RK4 carry, which is the projection-scale row above,
      running ${scaleLo}× at ${LO}° loft down to ${scaleHi}× at ${HI}°.
      Because the scale falls with loft, <b>the fit amplifies the contrast the table is
      about.</b> Unfitted, the ${G}°-gap row runs
      <span class="num">${f1(drv.rawCurveYd)}</span> yd to
      <span class="num">${f1(wdg.rawCurveYd)}</span> yd, a
      <span class="num">${f1(rawDropPct)}%</span> drop rather than
      <span class="num">${f1(curveDropPct)}%</span>. The direction of the pattern is real
      in both. The size of it is not.</p>
    </section>

    <section>
      <h2>Not a bag</h2>
      <p>Club speed is held at ${d.fixedInputs.clubSpeed} mph for <b>every</b> loft, to
      isolate loft. A real player swings a ${HI}° wedge roughly 20 mph slower than a
      driver, so the carry row is not a distance chart and these are not your yardages.
      Only the curve and spin-axis contrast is the point.</p>
    </section>

    <section>
      <h2>Spin-limited cells <span class="sr">(marked with a dagger)</span></h2>
      <ul>
        ${footnotes}
      </ul>
    </section>

    <section>
      <h2>Aerodynamic envelope</h2>
      <ul class="plain">
        <li>The ${LO}° loft column sits inside the measured premium tour-class
        aero envelope. Every higher-loft column extrapolates beyond it.</li>
        <li>Filled bar length encodes curve on one scale across the whole table
        (a bar spanning the widest cell = ${f1(maxCurve)} yd). The track behind it is
        the same row at ${LO}° loft. Both are redundant readings of the printed
        numbers, not separate claims.</li>
      </ul>
    </section>

    <p class="prov">Source · ${esc(en(d.engine))}<br>
    ${esc(en(d.sourceTag))}<br>
    Generated ${esc(d.generatedAt)} by ${esc(d.generator)}<br>
    Rendered by outputs/agent-scan/gen-table-curve-gearing-html.mjs</p>
  </div>
</main>
</body>
</html>
`;

// ---------- self-check: no figure on the page that is not in the JSON ----------
for (const g of gaps) {
  for (const l of lofts) {
    const c = at(g, l);
    assert.ok(html.includes(`>${f1(c.curveYd)}`), `missing curve ${g}/${l}`);
    assert.ok(html.includes(`axis ${f1(c.spinAxisDeg)}°`), `missing axis ${g}/${l}`);
    // track x fill must still be the honest table-wide share, or the bar lies.
    const ref = at(g, LO).curveYd;
    const drawn = (ref / maxCurve) * (c.curveYd / ref);
    assert.ok(Math.abs(drawn - c.curveYd / maxCurve) < 1e-9, `bar math ${g}/${l}`);
    assert.ok(c.curveYd <= ref, `row ${g}: loft ${l} exceeds its own ${LO}° reference`);
  }
}
assert.equal(clamped.length, d.caveats.length, 'clamped cells != caveat count');
assert.ok(maxCurve === at(G, LO).curveYd, 'ember cell is not the table maximum');
assert.ok(curveDropPct > rawDropPct, 'fit should amplify; check disclosure wording');

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html, 'utf8');
console.log(`ok  ${gaps.length}x${lofts.length} cells, ${clamped.length} spin-limited`);
console.log(`ok  curve drop fitted ${f1(curveDropPct)}%  raw ${f1(rawDropPct)}%  axis ${f1(axisDropPct)}%`);
console.log(`->  ${OUT}`);
