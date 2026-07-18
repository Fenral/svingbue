import { carryYd } from './flight-core.mjs';
const k = { cd0:0.275, cd2:0.686, cl1:2.2, clmax:0.49, tau:24.167 };
const sOptT = v => -0.160373*v*v + 26.838228*v + 1655.45;
const aOptT = v => 0.000772*v*v - 0.313676*v + 36.3045;
function windowOpt(ballMph){
  // fine grid; optimum = carry-weighted centroid of the plateau (within 0.3 yd of max)
  let max = -1; const pts = [];
  for (let a = 7; a <= 19; a += 0.25) for (let s = 1600; s <= 3600; s += 25){
    const c = carryYd(ballMph, a, s, k);
    pts.push([a, s, c]);
    if (c > max) max = c;
  }
  let wa = 0, ws = 0, W = 0, sLo = 1e9, sHi = -1e9;
  for (const [a, s, c] of pts) if (c >= max - 0.3){
    const w = c - (max - 0.3);
    wa += a * w; ws += s * w; W += w;
    if (s < sLo) sLo = s; if (s > sHi) sHi = s;
  }
  return { a: wa / W, s: ws / W, c: max, sLo, sHi };
}
console.log('--- ACCEPTANCE · plateau-centroid ---');
let pass = 0;
const rows = [];
for (let v = 85; v <= 125; v += 5){
  const o = windowOpt(v * 1.48);
  const ds = o.s - sOptT(v), da = o.a - aOptT(v);
  const ok = Math.abs(ds) <= 150 && Math.abs(da) <= 1;
  if (ok) pass++;
  rows.push({ v, spin: Math.round(o.s), launch: +o.a.toFixed(1), carry: +o.c.toFixed(1), win: [o.sLo, o.sHi] });
  console.log(v, '| spin', Math.round(o.s), '(', (ds>0?'+':'')+Math.round(ds), ') | launch', o.a.toFixed(2), '(', (da>0?'+':'')+da.toFixed(2), ') | carry', o.c.toFixed(1), '| plateau', o.sLo+'-'+o.sHi, '|', ok?'PASS':'FAIL');
}
console.log(pass + '/9 PASS');
// monotonicity + interior-optimum guards
let mono = true, prev = 0;
for (let v = 85; v <= 125; v += 5){ const c = windowOpt(v*1.48).c; if (c <= prev) mono = false; prev = c; }
console.log('carry monotone in speed:', mono);
const edge = windowOpt(105*1.48);
console.log('interior optimum (not at grid edge):', edge.sLo > 1600 && edge.sHi < 3600 && edge.a > 7 && edge.a < 19);
console.log(JSON.stringify(rows));
