/* ══════════════════════════════════════════════════════════════════════════
   diagnose-engine-v2.js — "Diagnose My Shot" v2 coach-interview runtime.
   ---------------------------------------------------------------------------
   Implements EXACTLY the findings §6 API over diagnose-map-v2.json (per-club
   grids: 7iron + driver). Pure/deterministic reverse map + a thin verification
   layer importing impact-flight.js DIRECTLY so every ember flight is a
   byte-identical solveFlight() solve — never ML, never invented physics. The
   map supplies priors (grid-count shares) + per-cluster conditioning stats +
   per-club meta.bands (edges/labels/anchor copy, never free-typed); the engine
   supplies the real trajectory of each cluster representative and the
   Bayes-in-place reweighting proven in findings §2.

   Contracts: docs/diagnose-spec-v2.md (delta) over docs/diagnose-spec.md (v1),
   API surface = docs/diagnose-harness-v2-findings.md §6. Everything here is
   pure except loadMapV2 / persistStat / handoff (I/O). Deps: impact-flight.js.
   ══════════════════════════════════════════════════════════════════════════ */

import { solveFlight, trajectorySamples, shapeLabel } from './impact-flight.js';

/* ── map vocabulary (EXACT strings — v1 §3.1) ────────────────────────────── */
const DIST_SCALE   = ['Long (gained distance)', 'Full (normal distance)', 'Slight loss', 'Noticeable loss'];
const HEIGHT_SCALE = ['Low', 'Normal', 'High', 'Ballooned'];
const SEVERITY_SWAP = { Slice: 'Fade', Fade: 'Slice', Hook: 'Draw', Draw: 'Hook' };

/* ── loadMapV2: fetch + module-scope cache ───────────────────────────────── */
let _mapCache = null;
export async function loadMapV2(url = './diagnose-map-v2.json') {
  if (_mapCache) return _mapCache;
  const res = await fetch(url);
  if (!res.ok) throw new Error('diagnose map v2 fetch failed: ' + res.status);
  _mapCache = await res.json();
  return _mapCache;
}
export function _setMapCacheForTest(m) { _mapCache = m; } // node smoke-test hook

/* ── clubMap: select a club's sub-map — throws on unknown club ───────────── */
export function clubMap(map, club) {
  const cm = map && map.clubs && map.clubs[club];
  if (!cm) throw new Error('unknown club: ' + club);
  return cm;
}

/* ── descriptorKey: EXACT map strings, never free-typed ──────────────────── */
export function descriptorKey({ curve, startLine, height, distanceLoss }) {
  return `${curve}||${startLine}||${height}||${distanceLoss}`;
}

/* ── lookup(clubMap, descriptor): exact, else nearest ─────────────────────
   relaxation order (unchanged from v1): distanceLoss ±1 → height ±1 → curve
   severity swap (Slice↔Fade, Hook↔Draw). Returns {entry,exact,key} or
   {entry:null,nearest:[{descriptor,changed,key}…≤3],key}. */
export function lookup(cm, descriptor) {
  const inv = cm.inverseMap;
  const key = descriptorKey(descriptor);
  if (inv[key]) return { entry: inv[key], exact: true, key };

  const nearest = [];
  const seen = new Set([key]);
  const tryCand = (desc, changed) => {
    if (nearest.length >= 3) return;
    const k = descriptorKey(desc);
    if (seen.has(k)) return;
    seen.add(k);
    if (inv[k]) nearest.push({ descriptor: { ...desc }, changed, key: k });
  };

  const di = DIST_SCALE.indexOf(descriptor.distanceLoss);
  if (di >= 0) for (const s of [1, -1]) {
    const ni = di + s;
    if (ni >= 0 && ni < DIST_SCALE.length) tryCand({ ...descriptor, distanceLoss: DIST_SCALE[ni] }, 'distance');
  }
  const hi = HEIGHT_SCALE.indexOf(descriptor.height);
  if (hi >= 0) for (const s of [1, -1]) {
    const ni = hi + s;
    if (ni >= 0 && ni < HEIGHT_SCALE.length) tryCand({ ...descriptor, height: HEIGHT_SCALE[ni] }, 'height');
  }
  if (SEVERITY_SWAP[descriptor.curve]) tryCand({ ...descriptor, curve: SEVERITY_SWAP[descriptor.curve] }, 'severity');

  return { entry: null, nearest: nearest.slice(0, 3), key };
}

/* ── consolidateStories: group clusters by face|path; attack lives inside ───
   Accepts an entry object ({clusters, clusterCount, gridCount, otherPct,
   otherClusterCount}) for the BASELINE (true all-delivery shares + the folded
   <1% tail carried as otherPct), or a bare cluster array after a reweight
   (survivors already renormalized to 100 — the <1% tail is set aside, per
   findings §5). Returns { stories(sorted desc), otherPct, otherClusterCount,
   clusterCount, gridCount }. */
export function consolidateStories(entry) {
  const isArray = Array.isArray(entry);
  const clusters = isArray ? entry : entry.clusters;

  const groups = new Map();
  for (const c of clusters) {
    const gk = c.cause.face + '||' + c.cause.path;
    let g = groups.get(gk);
    if (!g) { g = { face: c.cause.face, path: c.cause.path, cs: [] }; groups.set(gk, g); }
    g.cs.push(c);
  }
  const stories = [...groups.values()].map(g => {
    const sorted = g.cs.slice().sort((a, b) => b.priorPct - a.priorPct);
    return {
      face: g.face,
      path: g.path,
      pct: +sorted.reduce((s, c) => s + c.priorPct, 0).toFixed(2),
      gridCount: sorted.reduce((s, c) => s + (c.gridCount || 0), 0),
      rep: sorted[0].representative,
      variants: sorted.map(c => ({ attack: c.cause.attack, pct: c.priorPct, rep: c.representative })),
    };
  });
  stories.sort((a, b) => b.pct - a.pct);

  const shown = stories.slice(0, 3);
  const shownClusterN = shown.reduce((s, st) => s + st.variants.length, 0);
  const shownPct = shown.reduce((s, st) => s + st.pct, 0);

  // totals: for a baseline entry use the stored bucket totals (they include the
  // folded <1% tail); for a reweighted array compute from the survivors.
  const totalClusterCount = isArray ? clusters.length : (entry.clusterCount ?? clusters.length);
  const totalGridCount    = isArray ? clusters.reduce((s, c) => s + (c.gridCount || 0), 0) : (entry.gridCount ?? 0);

  return {
    stories,
    otherPct: Math.max(0, +(100 - shownPct).toFixed(1)),
    otherClusterCount: Math.max(0, totalClusterCount - shownClusterN),
    clusterCount: totalClusterCount,
    gridCount: totalGridCount,
  };
}

/* ══ CONDITIONING PIPELINE (Bayes-in-place, findings §2) ═══════════════════
   posterior(cluster) ∝ prior(cluster) × P(answer | cluster), then renormalize
   the survivors to 100. Because prior = count/symptomTotal and P = countInBand
   /count, the product renormalizes to countInBand/Σ countInBand — identical to
   re-filtering the grid to the answered band and re-counting (findings §2 proof).
   Each returns a NEW cluster array with priorPct renormalized to 100. */

export function reweight(clusters, wOf) {
  const weighted = clusters.map(c => ({ c, w: c.priorPct * wOf(c) }));
  const sum = weighted.reduce((s, x) => s + x.w, 0);
  if (!(sum > 0)) return clusters.map(c => ({ ...c })); // degenerate → unchanged copy
  return weighted.map(({ c, w }) => ({ ...c, priorPct: +(w / sum * 100).toFixed(2) }));
}

// speed answer → P = speedHist[band]/100 (member fraction in that band).
export function reweightSpeed(clusters, band) {
  if (band !== 'slow' && band !== 'mid' && band !== 'fast') return clusters.map(c => ({ ...c })); // 'unsure' = no filter
  return reweight(clusters, c => ((c.speedHist && c.speedHist[band]) || 0) / 100);
}

// absolute carry ±band metres → P = CDF(v+band) − CDF(v−band) from carryM{p10,p50,p90}.
function carryCDF(carryM, v) {
  const { p10, p50, p90 } = carryM;
  const s1 = (0.5 - 0.1) / Math.max(1e-6, (p50 - p10)); // slope of the p10→p50 segment
  const s2 = (0.9 - 0.5) / Math.max(1e-6, (p90 - p50)); // slope of the p50→p90 segment
  if (v <= p10) return Math.max(0, 0.1 + s1 * (v - p10)); // extrapolate below p10 toward 0
  if (v <= p50) return 0.1 + s1 * (v - p10);
  if (v <= p90) return 0.5 + s2 * (v - p50);
  return Math.min(1, 0.9 + s2 * (v - p90));               // extrapolate above p90 toward 1
}
export function reweightCarry(clusters, metres, band = 10) {
  return reweight(clusters, c => {
    if (!c.carryM) return 1;
    return Math.max(0, carryCDF(c.carryM, metres + band) - carryCDF(c.carryM, metres - band));
  });
}

// secondary-miss → P = startLineMix[Left|Straight|Right]/100 (Laplace-floored).
const SECONDARY_KEY = { pulls: 'Left', straights: 'Straight', pushes: 'Right' };
export function reweightSecondary(clusters, ans) {
  const key = SECONDARY_KEY[ans];
  if (!key) return clusters.map(c => ({ ...c }));
  return reweight(clusters, c => Math.max(0.1, (c.startLineMix && c.startLineMix[key]) || 0) / 100);
}

// divot → allowed attack bands (v1 filter).
export function divotFilter(answer) {
  switch (answer) {
    case 'deep':    return new Set(['steep descending']);
    case 'brushed': return new Set(['moderate descending', 'level']);
    case 'none':    return new Set(['level', 'ascending']);
    default:        return null; // 'unsure'
  }
}
// divot → hard-filter attack band; empty ⇒ keep all, {empty:true} (say so, v1 §3.3).
export function applyDivot(clusters, answer) {
  const filt = divotFilter(answer);
  if (!filt) return { clusters: clusters.map(c => ({ ...c })), empty: false };
  const kept = clusters.filter(c => filt.has(c.cause.attack));
  if (!kept.length) return { clusters: clusters.map(c => ({ ...c })), empty: true };
  const sum = kept.reduce((s, c) => s + c.priorPct, 0) || 1;
  return { clusters: kept.map(c => ({ ...c, priorPct: +(c.priorPct / sum * 100).toFixed(2) })), empty: false };
}

/* ── needsFollowUp: only decisive when top story ≥60 AND top variant ≥0.7 ─── */
export function needsFollowUp(stories) {
  if (!stories || !stories.length) return false;
  const top = stories[0];
  if (!(top.pct >= 60)) return true;
  if (!top.variants.length) return true;
  return !((top.variants[0].pct / top.pct) >= 0.7);
}

/* ── confidenceLabel: two-register honesty, never a fake 95% ──────────────── */
export function confidenceLabel(pct) {
  let label;
  if (pct >= 45) label = 'Most likely';
  else if (pct >= 25) label = 'Strong candidate';
  else if (pct >= 10) label = 'Also fits';
  else label = 'Outside chance';
  const n = Math.max(1, Math.round(pct / 10));
  return { label, n, text: `about ${n} in 10 matching deliveries` };
}

/* ── storyTitle: the CERTAIN register — assert the face↔path relationship ───
   5×5 (face band × path band) in the spec's plain voice. Never a percentage. */
const TITLE = {
  'strongly closed': {
    'strongly out-to-in': 'Face shut, but the path came across it',
    'slightly out-to-in': 'Face shut, inside your path',
    'neutral': 'Face shut, path down the line',
    'slightly in-to-out': 'Face shut, swinging slightly out to the right',
    'strongly in-to-out': 'Face shut, swinging out to the right',
  },
  'slightly closed': {
    'strongly out-to-in': 'Across path, face just right of it',
    'slightly out-to-in': 'Face and path both a touch left',
    'neutral': 'Face a touch shut, path fine',
    'slightly in-to-out': 'Face a touch shut to a path going right',
    'strongly in-to-out': 'Face a touch shut, swinging out to the right',
  },
  'square': {
    'strongly out-to-in': 'Square face, but swinging across',
    'slightly out-to-in': 'Square face, path slightly across',
    'neutral': 'Square face, path down the line',
    'slightly in-to-out': 'Square face, path slightly out to the right',
    'strongly in-to-out': 'Square face, but swinging out to the right',
  },
  'slightly open': {
    'strongly out-to-in': 'Face a touch open, swinging across it',
    'slightly out-to-in': 'Face a touch open to an across path',
    'neutral': 'Face a touch open, path fine',
    'slightly in-to-out': 'Face and path both a touch right',
    'strongly in-to-out': 'Path out to the right, face just inside it',
  },
  'strongly open': {
    'strongly out-to-in': 'Face open, swinging across it',
    'slightly out-to-in': 'Face open to a slightly across path',
    'neutral': 'Face open, path down the line',
    'slightly in-to-out': 'Face open, still right of your path',
    'strongly in-to-out': 'Face and path both aimed right',
  },
};
export function storyTitle(story) {
  return (TITLE[story.face] && TITLE[story.face][story.path]) || 'Face and path in an unusual mix';
}

/* ── term definitions taught inline (real terms, precision non-negotiable) ── */
export const TERMS = {
  'face angle':  'Where the clubface points at impact, relative to your target line.',
  'club path':   'The direction the clubhead is actually travelling through impact.',
  'spin loft':   'The gap between where the club is moving and where its face points — dynamic loft minus attack angle. More spin loft means more backspin, a higher, shorter, softer-landing shot.',
  'attack angle':'How steeply the club is moving up or down at impact. Minus is descending, plus is on the way up.',
};

/* ── storyBody: three beats (what happened · why · terms taught) as parts. ── */
export function storyBody(story, curve) {
  const rep = story.rep;
  const gap = rep.faceAngle - rep.clubPath;          // + = face right of path → curves right
  const shapeWord = { Slice: 'slice', Hook: 'hook', Fade: 'fade', Draw: 'draw' }[curve] || 'shape';
  const face = { t: 'term', v: 'face angle', def: TERMS['face angle'] };
  const path = { t: 'term', v: 'club path', def: TERMS['club path'] };

  if (gap > 1) {
    return [
      { t: 'text', v: 'Your clubface pointed right of the direction the club was travelling. The ball starts close to where the face points, then curves away from the path — that gap is the whole ' + shapeWord + '. The face direction is your ' },
      face, { t: 'text', v: '; the travel direction is your ' }, path, { t: 'text', v: '.' },
    ];
  }
  if (gap < -1) {
    return [
      { t: 'text', v: 'Your clubface pointed left of the direction the club was travelling. The ball starts near where the face points, then curves the other way from the path — that gap is the whole ' + shapeWord + '. The face direction is your ' },
      face, { t: 'text', v: '; the travel direction is your ' }, path, { t: 'text', v: '.' },
    ];
  }
  const side = rep.faceAngle > 0.5 ? 'right' : rep.faceAngle < -0.5 ? 'left' : 'at the target';
  return [
    { t: 'text', v: 'Your face and path pointed almost the same way — only a couple of degrees apart — so the ball flew fairly straight. It just started ' + side + ' because both the ' },
    face, { t: 'text', v: ' and the ' }, path, { t: 'text', v: ' aimed there.' },
  ];
}

/* ── spinLoftOf: dynamicLoft − attackAngle (already stored as rep.spinLoft) ── */
export function spinLoftOf(rep) {
  return (rep && rep.spinLoft != null) ? rep.spinLoft : (rep.dynamicLoft - rep.attackAngle);
}

/* ── spinLoftBand: qualitative band computed FROM THE CLUB GRID, not hardcoded.
   The grid's dynamic-loft array + attack [min,max] give the club's spin-loft
   range [loftMin−attackMax, loftMax−attackMin]. Cut points at 0.44 / 0.77 of
   that range reproduce every findings coach-story qualifier (7-iron: 23.8 low,
   26–33 healthy, ≥34 a lot; driver: 13 healthy, 20 a lot ≈ approaching grid
   max 24). Returns 'low' | 'healthy' | 'alot'. */
export function spinLoftBand(spinLoft, clubMeta) {
  const grid = clubMeta.grid;
  const lofts = grid.dynamicLoft;
  const loftMin = Math.min(...lofts), loftMax = Math.max(...lofts);
  const aMin = grid.attackAngle[0], aMax = grid.attackAngle[1];
  const slMin = loftMin - aMax, slMax = loftMax - aMin;
  const f = (spinLoft - slMin) / Math.max(1e-6, (slMax - slMin));
  if (f < 0.44) return 'low';
  if (f > 0.77) return 'alot';
  return 'healthy';
}

/* ── coachStory: the owner's dynamic-loft→spin-loft chain, spoken by the
   physics (spec v2 §2). Parts array so `spin loft` renders as a taught term
   (violet, tap-to-define) and the spin-loft number is emphasised. The
   qualifier phrasing is per-club, band-driven, and matches the findings
   voice verbatim. */
const SPINLOFT_QUALIFIER = {
  '7iron':  { low: 'low spin loft — it comes out hot and flat',
              healthy: 'healthy spin loft',
              alot: 'a lot of spin loft: it climbs and bleeds speed' },
  'driver': { low: 'low driver spin loft — it comes out hot and low',
              healthy: 'healthy driver spin loft',
              alot: 'a lot of spin loft for a driver: it balloons and bleeds carry' },
};
function fmtNum(v) {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}
function signedNum(v) {
  const r = Math.round(v * 10) / 10;
  const body = Number.isInteger(Math.abs(r)) ? String(Math.abs(r)) : Math.abs(r).toFixed(1);
  return (r < 0 ? '−' : '+') + body; // U+2212 minus / plus, tabular-nums friendly
}
export function coachStory(story, clubMeta) {
  const rep = story.rep;
  const loft = rep.dynamicLoft, attack = rep.attackAngle, sl = spinLoftOf(rep);
  const band = spinLoftBand(sl, clubMeta);
  const qualifier = (SPINLOFT_QUALIFIER[clubMeta.club] || SPINLOFT_QUALIFIER['7iron'])[band];
  return [
    { t: 'text', v: `${fmtNum(loft)}° delivered loft minus a ${signedNum(attack)}° attack = ` },
    { t: 'strong', v: `${fmtNum(sl)}°` },
    { t: 'text', v: ' ' },
    { t: 'term', v: 'spin loft', def: TERMS['spin loft'] },
    { t: 'text', v: ` — ${qualifier}.` },
  ];
}

/* ── deliveryPhrases: signed numbers → golfer words (readout + cards, §6.4) ─ */
export function deliveryPhrases(rep) {
  const f = rep.faceAngle, p = rep.clubPath, a = rep.attackAngle, l = rep.dynamicLoft, s = rep.clubSpeed;
  return {
    face:  f > 0 ? `${Math.abs(f).toFixed(1)}° open` : f < 0 ? `${Math.abs(f).toFixed(1)}° closed` : 'square',
    path:  p < 0 ? `${Math.abs(p).toFixed(1)}° out-to-in` : p > 0 ? `${Math.abs(p).toFixed(1)}° in-to-out` : 'down the line',
    attack: a < 0 ? `${Math.abs(a).toFixed(1)}° down` : a > 0 ? `${Math.abs(a).toFixed(1)}° up` : 'level',
    loft:  `${l.toFixed(1)}° loft`,
    speed: `${Math.round(s)} mph`,
  };
}

/* ── attack band → golfer words (variant rows, §6.6) ─────────────────────── */
export function attackWord(band) {
  return {
    'steep descending': 'steep, digging',
    'moderate descending': 'normal, downward',
    'level': 'flat, level',
    'ascending': 'on the way up',
  }[band] || band;
}

/* ── solveTrace: the ember reveal — a REAL solveFlight solve of the rep ─────
   Driver reps run through the SAME shared physics (impact-flight.js has no
   driver preset; solveFlight(…,'driver') is byte-identical to '7iron'), so the
   ember shape is honest and no club field is needed. */
export function solveTrace(rep) {
  const flight = solveFlight(rep);
  return { flight, samples: trajectorySamples(flight, 48) };
}

/* ── sketchTrace: canonical NON-engine sketch (v1 §5.4) — the user's memory.
   Gains a club parameter (spec v2 §4): canonical carry scales to the club
   (7i base 150 m, driver base 205 m), curve offset scales with it, and the
   driver flies a flatter apex ratio. Deliberately independent of solveFlight
   so the ember reveal is real work, not a mirror. No driver numbers are ever
   surfaced from these metres — they only set the sketch's on-screen shape. */
const SKETCH_START = { Left: -4, Straight: 0, Right: 4 };                                   // deg
const SKETCH_CARRY_FRAC = { 'Long (gained distance)': 1.067, 'Full (normal distance)': 1.0, 'Slight loss': 0.947, 'Noticeable loss': 0.88 };
const SKETCH_APEX = { Low: 18, Normal: 30, High: 38, Ballooned: 44 };                       // m (7-iron base)
const SKETCH_CURVE = { Hook: -28, Draw: -12, Straight: 0, Fade: 12, Slice: 28 };            // m lateral (7-iron base)
const SKETCH_BASE = { '7iron': { carry: 150, apexK: 1.0 }, 'driver': { carry: 205, apexK: 1.15 } };

export function sketchGeometry(descriptor, club = '7iron') {
  const base = SKETCH_BASE[club] || SKETCH_BASE['7iron'];
  const scale = base.carry / 150;
  const startDeg = SKETCH_START[descriptor.startLine] ?? 0;
  const carryM = base.carry * (SKETCH_CARRY_FRAC[descriptor.distanceLoss] ?? 1.0);
  const apexM = (SKETCH_APEX[descriptor.height] ?? 30) * base.apexK;
  const curveM = (SKETCH_CURVE[descriptor.curve] ?? 0) * scale;
  const apexFrac = descriptor.height === 'Ballooned' ? 0.58 : 0.52;
  const startTan = Math.tan(startDeg * Math.PI / 180);
  const offlineM = startTan * carryM + curveM;
  return { startDeg, carryM, apexM, curveM, apexFrac, startTan, offlineM };
}
export function sketchTrace(descriptor, club = '7iron', n = 48) {
  const g = sketchGeometry(descriptor, club);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const d = i / n;
    let h;
    if (d <= g.apexFrac) { const u = d / g.apexFrac; h = 1 - (1 - u) * (1 - u); }
    else { const u = (d - g.apexFrac) / (1 - g.apexFrac); h = 1 - u * u; }
    const lat = g.startTan * (d * g.carryM) + g.curveM * d * d;
    const x = g.offlineM !== 0 ? lat / g.offlineM : 0;
    pts.push({ d, h: Math.max(0, Math.min(1, h)), x });
  }
  pts.carryM = g.carryM; pts.apexM = g.apexM; pts.offlineM = g.offlineM;
  return pts;
}

/* ── persistStat: the home card's live value (v1 §2.3 + v2 "club" field) ──── */
export function persistStat(result) {
  try {
    localStorage.setItem('sa.stat.diagnose', JSON.stringify({
      ts: Date.now(), club: result.club, shape: result.shape, story: result.story,
      face: result.face, path: result.path,
    }));
  } catch (e) { /* private mode / quota — non-fatal */ }
}

/* ── handoff: write the localStorage seed AND the mirrored query string (§2.4).
   Returns the deep-link URL. Params = the speed-matched representative. */
export function handoff(rep, label) {
  const r1 = v => +(+v).toFixed(1);
  const params = {
    clubSpeed: r1(rep.clubSpeed), faceAngle: r1(rep.faceAngle), clubPath: r1(rep.clubPath),
    attackAngle: r1(rep.attackAngle), dynamicLoft: r1(rep.dynamicLoft),
  };
  try {
    localStorage.setItem('sa.handoff.delivery', JSON.stringify({
      v: 1, ts: Date.now(), source: 'diagnose', label, params,
    }));
  } catch (e) { /* non-fatal */ }
  const qs = `?from=diagnose&speed=${params.clubSpeed}&face=${params.faceAngle}` +
    `&path=${params.clubPath}&attack=${params.attackAngle}&loft=${params.dynamicLoft}`;
  return './impact-viz-mock.html' + qs;
}

/* ══ DEV ASSERTS (?dev=1) — the acceptance tests baked into the page ════════
   Reproduce findings scenarios (a)(c)(f)(g) from the shipped JSON. Pure; runs
   against the loaded map. Logs a pass/fail table; returns {passed,failed,rows}.
   Also node-callable (import + _setMapCacheForTest + devAsserts(map)). */
function approx(a, b, tol) { return Math.abs(a - b) <= tol; }
export function devAsserts(map) {
  const rows = [];
  const check = (name, cond, detail) => { rows.push({ name, pass: !!cond, detail }); };

  const cm7 = clubMap(map, '7iron');
  const cmd = clubMap(map, 'driver');

  // (a) 7-iron · Slice||Straight||High||Noticeable loss · speed=mid → added-loft slice
  try {
    const r = lookup(cm7, { curve: 'Slice', startLine: 'Straight', height: 'High', distanceLoss: 'Noticeable loss' });
    const base = consolidateStories(r.entry);
    const conditioned = consolidateStories(reweightSpeed(r.entry.clusters, 'mid'));
    const top = conditioned.stories[0];
    check('(a) exact bucket exists', r.exact, r.key);
    check('(a) top story slightly open / strongly out-to-in',
      top.face === 'slightly open' && top.path === 'strongly out-to-in', `${top.face} / ${top.path}`);
    check('(a) top pct ≈ 71.8 after speed=mid', approx(top.pct, 71.8, 0.6), top.pct.toFixed(1) + '%');
    check('(a) rep added-loft ~33 / spinLoft ~38 / f2p ~+9.5',
      approx(top.rep.dynamicLoft, 33, 0.6) && approx(spinLoftOf(top.rep), 38, 0.6) && approx(top.rep.faceAngle - top.rep.clubPath, 9.5, 0.6),
      `loft ${top.rep.dynamicLoft} spinLoft ${spinLoftOf(top.rep)} f2p ${(top.rep.faceAngle - top.rep.clubPath).toFixed(1)}`);
    check('(a) spin-loft band = a lot', spinLoftBand(spinLoftOf(top.rep), cm7.meta) === 'alot', spinLoftBand(spinLoftOf(top.rep), cm7.meta));
    check('(a) baseline top ≈ 71 (pre-speed)', approx(base.stories[0].pct, 71, 0.6), base.stories[0].pct.toFixed(1) + '%');
  } catch (e) { check('(a) threw', false, String(e)); }

  // (c) Driver · Slice||Right||Normal||Full · secondary=pulls → out-to-in mass ↑
  try {
    const r = lookup(cmd, { curve: 'Slice', startLine: 'Right', height: 'Normal', distanceLoss: 'Full (normal distance)' });
    const base = consolidateStories(r.entry);
    const cond = consolidateStories(reweightSecondary(r.entry.clusters, 'pulls'));
    const otiBefore = base.stories.filter(s => s.path.includes('out-to-in')).reduce((a, s) => a + s.pct, 0);
    const otiAfter = cond.stories.filter(s => s.path.includes('out-to-in')).reduce((a, s) => a + s.pct, 0);
    // normalize to survivor basis (base clusters sum to <100 because of the <1% folded tail)
    const baseSum = base.stories.reduce((a, s) => a + s.pct, 0);
    const otiBeforeSurv = otiBefore / baseSum * 100;
    check('(c) exact bucket exists', r.exact, r.key);
    check('(c) baseline top strongly open / strongly out-to-in ≈ 37.6',
      base.stories[0].face === 'strongly open' && base.stories[0].path === 'strongly out-to-in' && approx(base.stories[0].pct, 37.6, 0.6),
      `${base.stories[0].face}/${base.stories[0].path} ${base.stories[0].pct}%`);
    check('(c) out-to-in mass rises after "also pulls" (survivor basis 86.2→87.5)',
      otiAfter > otiBeforeSurv && approx(otiBeforeSurv, 86.2, 1.0) && approx(otiAfter, 87.5, 1.0),
      `${otiBeforeSurv.toFixed(1)} → ${otiAfter.toFixed(1)}`);
    check('(c) driver spin-loft healthy (~13.2)', spinLoftBand(spinLoftOf(base.stories[0].rep), cmd.meta) === 'healthy', String(spinLoftOf(base.stories[0].rep)));
  } catch (e) { check('(c) threw', false, String(e)); }

  // (f) 7-iron · Hook||Left||Low||Long → shut face + in-to-out path (snap-hook)
  try {
    const r = lookup(cm7, { curve: 'Hook', startLine: 'Left', height: 'Low', distanceLoss: 'Long (gained distance)' });
    const base = consolidateStories(r.entry);
    const top = base.stories[0];
    check('(f) exact bucket exists', r.exact, r.key);
    check('(f) top story strongly closed / strongly in-to-out ≈ 39',
      top.face === 'strongly closed' && top.path === 'strongly in-to-out' && approx(top.pct, 39, 1.0), `${top.face}/${top.path} ${top.pct}%`);
    check('(f) rep shut face −6.5 on in-to-out +6.5 (snap-hook, not over-the-top)',
      approx(top.rep.faceAngle, -6.5, 0.6) && approx(top.rep.clubPath, 6.5, 0.6), `face ${top.rep.faceAngle} path ${top.rep.clubPath}`);
    check('(f) low spin loft (~23.8)', spinLoftBand(spinLoftOf(top.rep), cm7.meta) === 'low', String(spinLoftOf(top.rep)));
  } catch (e) { check('(f) threw', false, String(e)); }

  // (g) 7-iron · the pure shot (Straight/Straight/Normal/Full) → square & down the line
  try {
    const r = lookup(cm7, { curve: 'Straight', startLine: 'Straight', height: 'Normal', distanceLoss: 'Full (normal distance)' });
    const base = consolidateStories(r.entry);
    const top = base.stories[0];
    check('(g) exact bucket exists', r.exact, r.key);
    check('(g) top story square / neutral ≈ 100',
      top.face === 'square' && top.path === 'neutral' && approx(top.pct, 100, 0.6), `${top.face}/${top.path} ${top.pct}%`);
    check('(g) rep square face 0 / path 0', approx(top.rep.faceAngle, 0, 0.3) && approx(top.rep.clubPath, 0, 0.3), `face ${top.rep.faceAngle} path ${top.rep.clubPath}`);
  } catch (e) { check('(g) threw', false, String(e)); }

  const failed = rows.filter(r => !r.pass);
  if (typeof console !== 'undefined') {
    console.groupCollapsed(`[diagnose-v2 dev asserts] ${rows.length - failed.length}/${rows.length} passed`);
    for (const row of rows) console[row.pass ? 'info' : 'error'](`${row.pass ? 'PASS' : 'FAIL'} — ${row.name}`, row.detail || '');
    console.groupEnd();
    if (failed.length) console.error('[diagnose-v2 dev asserts] FAILURES', failed.map(f => f.name));
  }
  return { passed: rows.length - failed.length, failed: failed.length, rows };
}

/* re-export for callers that want the engine label without a second import */
export { shapeLabel };
