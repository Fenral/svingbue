/* ══════════════════════════════════════════════════════════════════════════
   diagnose-engine.js — "Diagnose My Shot" inverse-diagnosis runtime.
   ---------------------------------------------------------------------------
   Pure/deterministic reverse map over the harness's diagnose-map.json, plus a
   thin verification layer that imports impact-flight.js DIRECTLY so every ember
   flight drawn on screen is a byte-identical solveFlight() solve — never ML,
   never invented physics. The map supplies the priors (grid-count shares); the
   engine supplies the real trajectory of each cluster representative.

   Contract: docs/diagnose-spec.md §2.1. Everything here is pure except
   loadMap / persistStat / handoff (I/O). No deps beyond impact-flight.js.
   ══════════════════════════════════════════════════════════════════════════ */

import { solveFlight, trajectorySamples, shapeLabel } from './impact-flight.js';

/* ── map vocabulary (EXACT strings — §3.1) ──────────────────────────────── */
const DIST_SCALE = ['Long (gained distance)', 'Full (normal distance)', 'Slight loss', 'Noticeable loss'];
const HEIGHT_SCALE = ['Low', 'Normal', 'High', 'Ballooned'];
const SEVERITY_SWAP = { Slice: 'Fade', Fade: 'Slice', Hook: 'Draw', Draw: 'Hook' };

/* ── loadMap: fetch + module-scope cache ─────────────────────────────────── */
let _mapCache = null;
export async function loadMap(url = './diagnose-map.json') {
  if (_mapCache) return _mapCache;
  const res = await fetch(url);
  if (!res.ok) throw new Error('diagnose map fetch failed: ' + res.status);
  _mapCache = await res.json();
  return _mapCache;
}
export function _setMapCacheForTest(m) { _mapCache = m; } // node smoke-test hook

/* ── descriptorKey: EXACT map strings, never free-typed ──────────────────── */
export function descriptorKey({ curve, startLine, height, distanceLoss }) {
  return `${curve}||${startLine}||${height}||${distanceLoss}`;
}

/* ── lookup: exact, else nearest (distance ±1 → height ±1 → severity swap) ── */
export function lookup(map, descriptor) {
  const inv = map.inverseMap;
  const key = descriptorKey(descriptor);
  if (inv[key]) return { entry: inv[key], exact: true };

  const nearest = [];
  const seen = new Set([key]);
  const tryCand = (desc, changed) => {
    if (nearest.length >= 3) return;
    const k = descriptorKey(desc);
    if (seen.has(k)) return;
    seen.add(k);
    if (inv[k]) nearest.push({ descriptor: { ...desc }, changed });
  };

  // 1. distanceLoss ±1 step
  const di = DIST_SCALE.indexOf(descriptor.distanceLoss);
  if (di >= 0) for (const s of [1, -1]) {
    const ni = di + s;
    if (ni >= 0 && ni < DIST_SCALE.length) tryCand({ ...descriptor, distanceLoss: DIST_SCALE[ni] }, 'distance');
  }
  // 2. height ±1 step
  const hi = HEIGHT_SCALE.indexOf(descriptor.height);
  if (hi >= 0) for (const s of [1, -1]) {
    const ni = hi + s;
    if (ni >= 0 && ni < HEIGHT_SCALE.length) tryCand({ ...descriptor, height: HEIGHT_SCALE[ni] }, 'height');
  }
  // 3. curve severity swap (Slice↔Fade, Hook↔Draw)
  if (SEVERITY_SWAP[descriptor.curve]) tryCand({ ...descriptor, curve: SEVERITY_SWAP[descriptor.curve] }, 'severity');

  return { entry: null, nearest: nearest.slice(0, 3) };
}

/* ── consolidateStories: group clusters by face+path; attack lives inside ─── */
export function consolidateStories(entry, attackFilter = null) {
  let clusters = entry.clusters;
  let filtered = false;
  let filterEmpty = false;

  if (attackFilter) {
    const kept = clusters.filter(c => attackFilter.has(c.cause.attack));
    if (kept.length) { clusters = kept; filtered = true; }
    else { filterEmpty = true; }   // §3.3: keep unfiltered, tell the truth in the UI
  }

  // group by face|path band
  const groups = new Map();
  for (const c of clusters) {
    const gk = c.cause.face + '||' + c.cause.path;
    let g = groups.get(gk);
    if (!g) { g = { face: c.cause.face, path: c.cause.path, cs: [] }; groups.set(gk, g); }
    g.cs.push(c);
  }

  let stories = [...groups.values()].map(g => {
    const sorted = g.cs.slice().sort((a, b) => b.priorPct - a.priorPct);
    return {
      face: g.face,
      path: g.path,
      pct: +sorted.reduce((s, c) => s + c.priorPct, 0).toFixed(2),
      gridCount: sorted.reduce((s, c) => s + c.gridCount, 0),
      rep: sorted[0].representative,               // highest-prior cluster's representative
      variants: sorted.map(c => ({ attack: c.cause.attack, pct: c.priorPct, rep: c.representative })),
    };
  });

  // renormalize the surviving stored clusters to 100 after a divot filter
  if (filtered) {
    const sum = stories.reduce((s, st) => s + st.pct, 0) || 1;
    stories = stories.map(st => ({
      ...st,
      pct: +(st.pct / sum * 100).toFixed(2),
      variants: st.variants.map(v => ({ ...v, pct: +(v.pct / sum * 100).toFixed(2) })),
    }));
  }

  stories.sort((a, b) => b.pct - a.pct);

  const shown = stories.slice(0, 3);
  const shownClusters = shown.reduce((s, st) => s + st.variants.length, 0);
  const shownPct = shown.reduce((s, st) => s + st.pct, 0);
  const clusterCount = filtered ? clusters.length : entry.clusterCount;
  const gridCount = filtered ? clusters.reduce((s, c) => s + c.gridCount, 0) : entry.gridCount;

  return {
    stories,
    otherCount: Math.max(0, clusterCount - shownClusters),
    otherPct: Math.max(0, +(100 - shownPct).toFixed(1)),
    clusterCount,
    gridCount,
    filtered,
    filterEmpty,
  };
}

/* ── needsFollowUp: only skip the divot Q when the top story is decisive ──── */
export function needsFollowUp(stories) {
  if (!stories || !stories.length) return false;
  const top = stories[0];
  if (!(top.pct >= 60)) return true;
  if (!top.variants.length) return true;
  return !((top.variants[0].pct / top.pct) >= 0.7);
}

/* ── divotFilter: divot answer → allowed attack bands (§2.1/§3.3) ─────────── */
export function divotFilter(answer) {
  switch (answer) {
    case 'deep': return new Set(['steep descending']);
    case 'brushed': return new Set(['moderate descending', 'level']);
    case 'none': return new Set(['level', 'ascending']);
    default: return null; // 'unsure'
  }
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
   5×5 (face band × path band) generated in the spec's plain voice. Never a
   percentage. The six §6.3 exemplars are reproduced verbatim. */
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
  'face angle': 'Where the clubface points at impact, relative to your target line.',
  'club path': 'The direction the clubhead is actually travelling through impact.',
};

/* ── storyBody: three beats (what happened · why · terms taught) as parts.
   Returns [{t:'text',v}|{t:'term',v,def}] so the UI renders the real terms as
   dotted-underline definition toggles. `curve` is the descriptor's curve. */
export function storyBody(story, curve) {
  const rep = story.rep;
  const gap = rep.faceAngle - rep.clubPath;          // + = face right of path → curves right
  const shapeWord = { Slice: 'slice', Hook: 'hook', Fade: 'fade', Draw: 'draw' }[curve] || 'shape';
  const face = { t: 'term', v: 'face angle', def: TERMS['face angle'] };
  const path = { t: 'term', v: 'club path', def: TERMS['club path'] };

  if (gap > 1) {
    // curves right (slice / fade)
    return [
      { t: 'text', v: 'Your clubface pointed right of the direction the club was travelling. The ball starts close to where the face points, then curves away from the path — that gap is the whole ' + shapeWord + '. The face direction is your ' },
      face,
      { t: 'text', v: '; the travel direction is your ' },
      path,
      { t: 'text', v: '.' },
    ];
  }
  if (gap < -1) {
    // curves left (hook / draw)
    return [
      { t: 'text', v: 'Your clubface pointed left of the direction the club was travelling. The ball starts near where the face points, then curves the other way from the path — that gap is the whole ' + shapeWord + '. The face direction is your ' },
      face,
      { t: 'text', v: '; the travel direction is your ' },
      path,
      { t: 'text', v: '.' },
    ];
  }
  // matched (push / pull / straight): little curve, the start line is the story
  const side = rep.faceAngle > 0.5 ? 'right' : rep.faceAngle < -0.5 ? 'left' : 'at the target';
  return [
    { t: 'text', v: 'Your face and path pointed almost the same way — only a couple of degrees apart — so the ball flew fairly straight. It just started ' + side + ' because both the ' },
    face,
    { t: 'text', v: ' and the ' },
    path,
    { t: 'text', v: ' aimed there.' },
  ];
}

/* ── deliveryPhrases: signed numbers → golfer words (readout + cards, §6.4) ─ */
export function deliveryPhrases(rep) {
  const f = rep.faceAngle, p = rep.clubPath, a = rep.attackAngle, l = rep.dynamicLoft, s = rep.clubSpeed;
  return {
    face: f > 0 ? `${Math.abs(f).toFixed(1)}° open` : f < 0 ? `${Math.abs(f).toFixed(1)}° closed` : 'square',
    path: p < 0 ? `${Math.abs(p).toFixed(1)}° out-to-in` : p > 0 ? `${Math.abs(p).toFixed(1)}° in-to-out` : 'down the line',
    attack: a < 0 ? `${Math.abs(a).toFixed(1)}° down` : a > 0 ? `${Math.abs(a).toFixed(1)}° up` : 'level',
    loft: `${l.toFixed(1)}° loft`,
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

/* ── solveTrace: the ember reveal — a REAL solveFlight solve of the rep ───── */
export function solveTrace(rep) {
  const flight = solveFlight(rep);
  return { flight, samples: trajectorySamples(flight, 48) };
}

/* ── sketchTrace: canonical NON-engine sketch (§5.4) — the user's memory.
   Deliberately independent of solveFlight so the reveal is real work. Returns
   the trajectorySamples {d,h,x}[] shape, with absolute metres attached as array
   properties (carryM / apexM / offlineM) so the scene can co-scale it with the
   engine trace. */
const SKETCH_START = { Left: -4, Straight: 0, Right: 4 };                                        // deg
const SKETCH_CARRY = { 'Long (gained distance)': 160, 'Full (normal distance)': 150, 'Slight loss': 142, 'Noticeable loss': 132 }; // m
const SKETCH_APEX = { Low: 18, Normal: 30, High: 38, Ballooned: 44 };                            // m
const SKETCH_CURVE = { Hook: -28, Draw: -12, Straight: 0, Fade: 12, Slice: 28 };                 // m lateral at landing

export function sketchGeometry(descriptor) {
  const startDeg = SKETCH_START[descriptor.startLine] ?? 0;
  const carryM = SKETCH_CARRY[descriptor.distanceLoss] ?? 150;
  const apexM = SKETCH_APEX[descriptor.height] ?? 30;
  const curveM = SKETCH_CURVE[descriptor.curve] ?? 0;
  const apexFrac = descriptor.height === 'Ballooned' ? 0.58 : 0.52;
  const startTan = Math.tan(startDeg * Math.PI / 180);
  const offlineM = startTan * carryM + curveM;   // total lateral at landing
  return { startDeg, carryM, apexM, curveM, apexFrac, startTan, offlineM };
}

export function sketchTrace(descriptor, n = 48) {
  const g = sketchGeometry(descriptor);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const d = i / n;
    let h;
    if (d <= g.apexFrac) { const u = d / g.apexFrac; h = 1 - (1 - u) * (1 - u); }
    else { const u = (d - g.apexFrac) / (1 - g.apexFrac); h = 1 - u * u; }
    const lat = g.startTan * (d * g.carryM) + g.curveM * d * d;   // metres
    const x = g.offlineM !== 0 ? lat / g.offlineM : 0;            // fraction of landing offline
    pts.push({ d, h: Math.max(0, Math.min(1, h)), x });
  }
  pts.carryM = g.carryM; pts.apexM = g.apexM; pts.offlineM = g.offlineM;
  return pts;
}

/* ── persistStat: the future home card's live value (§2.3) ───────────────── */
export function persistStat(result) {
  try {
    localStorage.setItem('sa.stat.diagnose', JSON.stringify({
      ts: Date.now(), shape: result.shape, story: result.story,
      face: result.face, path: result.path,
    }));
  } catch (e) { /* private mode / quota — non-fatal */ }
}

/* ── handoff: write both the localStorage seed AND the mirrored query string
   (§2.4). Returns the deep-link URL. Ball Flight parses this in a later commit;
   until then Diagnose's own reveal carries the moment. */
export function handoff(rep, label) {
  const r1 = v => +(+v).toFixed(1);
  const params = {
    clubSpeed: r1(rep.clubSpeed),
    faceAngle: r1(rep.faceAngle),
    clubPath: r1(rep.clubPath),
    attackAngle: r1(rep.attackAngle),
    dynamicLoft: r1(rep.dynamicLoft),
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

/* re-export for callers that want the engine label without a second import */
export { shapeLabel };
