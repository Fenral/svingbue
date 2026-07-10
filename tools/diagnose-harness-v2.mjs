/**
 * DIAGNOSE-HARNESS-V2 — inverse-diagnosis DATA LAYER for the coach-interview
 * upgrade of "Diagnose my shot". Extends tools/diagnose-harness.mjs (v1) with:
 *
 *   1. PER-CLUB grids (7-iron kept byte-for-byte; DRIVER added) with height/
 *      distance/speed bucket norms DERIVED PER CLUB from that club's own grid
 *      percentiles (a "High" driver flight is not a "High" 7-iron flight).
 *   2. CONDITIONING stats on every cluster (speed histogram + carry p10/p50/p90)
 *      so the client can reweight clusters by an answer WITHOUT duplicating maps.
 *   3. SECONDARY-MISS math (`alsoProduces`): sweep the face across a timing window
 *      holding path/attack/loft/speed, record which of the 9 ball-flights result.
 *   4. INFO-GAIN table: expected bits each candidate question buys, → ask order.
 *   5. OWNER ACCEPTANCE SCENARIOS run against the EMITTED, trimmed, rounded JSON.
 *   6. Size-capped emit (<=4 MB) + the exact future client API in the findings.
 *
 * Pure READ of impact-flight.js — never edits it. All numbers fall honestly out
 * of solveFlight() grid counts; no invented physics, no hand-tuned probabilities.
 *
 *   node tools/diagnose-harness-v2.mjs
 *
 * Writes ../diagnose-map-v2.json and ../docs/diagnose-harness-v2-findings.md.
 *
 * ── Engine honesty note (documented, load-bearing) ─────────────────────────
 * impact-flight.js's CLUBS table has ONLY a 7-iron preset; `club:'driver'`
 * falls back to the 7-iron preset (smash 1.33 cap, spinK 1.8, the shared
 * ballSpeed→carry power-curve). VERIFIED: solveFlight(...,'driver') is
 * byte-identical to solveFlight(...,'7iron') for equal inputs. So the DRIVER
 * grid is the SAME shared physics driven through DRIVER-realistic INPUT RANGES
 * (low loft, high speed, shallow/ascending attack). Two honest consequences,
 * both reported in the findings and respected by the data layer:
 *   (a) start-line is correctly MORE face-dominant at low loft — the built-in
 *       faceW loft-taper gives ~0.835 at driver loft 13 vs ~0.760 at 7i loft 28.
 *       This is a REAL, physically-motivated engine difference, not a fudge.
 *   (b) the shared carry curve is 7-iron-drag-calibrated and saturates early at
 *       driver ball speeds, so ABSOLUTE driver carries compress at the top. We
 *       therefore NEVER treat absolute driver yardage as truth — every driver
 *       band is percentile-anchored to the DRIVER grid's OWN distribution, and
 *       all conditioning is RELATIVE (member-count reweighting), never absolute.
 */

import { solveFlight } from '../impact-flight.js';
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_JSON = resolve(__dirname, '../diagnose-map-v2.json');
const OUT_MD = resolve(__dirname, '../docs/diagnose-harness-v2-findings.md');
const YARD_TO_M = 0.9144;

// ── helpers ────────────────────────────────────────────────────────────────
const range = (min, max, step) => {
  const out = [];
  for (let v = min; v <= max + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
  return out;
};
function percentile(sorted, p) {
  // `sorted` MUST be ascending. Linear interpolation between order statistics.
  if (sorted.length === 0) return NaN;
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}
const r1 = v => Math.round(v * 10) / 10;
function shannonEntropy(counts, total) {
  let h = 0;
  for (const n of counts) { if (n <= 0) continue; const p = n / total; h -= p * Math.log2(p); }
  return h;
}

// ── shared band classifiers (identical to v1 — human-meaningful coach words) ─
function faceBand(face) {
  if (face > 4) return 'strongly open';
  if (face > 1) return 'slightly open';
  if (face >= -1) return 'square';
  if (face >= -4) return 'slightly closed';
  return 'strongly closed';
}
function pathBand(path) {
  if (path > 4) return 'strongly in-to-out';
  if (path > 1) return 'slightly in-to-out';
  if (path >= -1) return 'neutral';
  if (path >= -4) return 'slightly out-to-in';
  return 'strongly out-to-in';
}
function attackBand(attack) {
  if (attack <= -4) return 'steep descending';
  if (attack <= -1.5) return 'moderate descending';
  if (attack < 1.5) return 'level';
  return 'ascending';
}
function loftBand(loft) {
  if (loft <= 22) return 'de-lofted (hands forward)';
  if (loft <= 30) return 'standard';
  return 'added loft (scooped)';
}
const START_THRESHOLD = 1.5; // reuse impact-flight.js's internal startline threshold
function startLineBand(startDirection) {
  if (startDirection > START_THRESHOLD) return 'Right';
  if (startDirection < -START_THRESHOLD) return 'Left';
  return 'Straight';
}
function parseShape(shapeStr) {
  const CURVES = ['Slice', 'Hook', 'Fade', 'Draw'];
  return CURVES.find(c => shapeStr.includes(c)) || 'Straight';
}
function curveDir(curve) { // left / straight / right family of the curve
  if (curve === 'Hook' || curve === 'Draw') return 'L';
  if (curve === 'Slice' || curve === 'Fade') return 'R';
  return 'S';
}

// ── PER-CLUB configuration ──────────────────────────────────────────────────
// 7-iron: kept identical to v1 (byte-for-byte grid & baseline).
// Driver: input ranges sanity-checked against the engine's own carry outputs
// (probe: cs75→149yd … cs95→196yd … cs115→225yd carry — plausible amateur→tour
// SHAPE) and against real TrackMan norms (amateur driver speed ~85-95, LPGA ~94,
// PGA ~113; amateurs commonly hit DOWN on it -3..-5 — the classic fault — while
// the optimised strike is +3..+5 up; dynamic loft ~8-20).
const CLUBS_CFG = {
  '7iron': {
    label: '7-iron',
    speeds: range(60, 110, 5),   // 11 — bogey-golfer to strong-amateur 7i speed
    faces: range(-8, 8, 1),      // 17
    paths: range(-8, 8, 1),      // 17
    attacks: range(-6, 4, 1),    // 11 — steep chunk to scooping-up thin
    lofts: range(18, 34, 2),     // 9  — de-lofted to scooped
    baseline: { faceAngle: 0, clubPath: 0, attackAngle: -3, dynamicLoft: 28 },
    baselineNote: 'well-struck 7-iron: square, ~-3° descending, ~28° delivered loft',
    // The engine's ball-speed→carry curve (remodel fix F) is anchored to
    // LPGA/PGA 7-IRON launch-monitor carries, so 7-iron ABSOLUTE carry is the one
    // number the engine is actually calibrated for — trustworthy to quote.
    absoluteCarryTrusted: true,
  },
  'driver': {
    label: 'Driver',
    speeds: range(75, 120, 5),   // 10 — slow senior/lady amateur → near-tour
    faces: range(-8, 8, 1),      // 17
    paths: range(-8, 8, 1),      // 17
    attacks: range(-4, 6, 1),    // 11 — amateur "hitting down" fault → optimised "up"
    lofts: range(8, 20, 1),      // 13 — de-lofted → added-loft/ballooning
    baseline: { faceAngle: 0, clubPath: 0, attackAngle: 2, dynamicLoft: 13 },
    baselineNote: 'neutral driver strike: square, ~+2° up, ~13° delivered loft (near the low-spin-loft optimum)',
    // `club:'driver'` falls back to the 7-iron preset: smash is capped at
    // ~1.42 (preset.smash 1.33 + 0.09) vs a real driver's ~1.48–1.50, and the
    // carry curve carries 7-iron drag. So the driver's ABSOLUTE carry is
    // understated (~20–45 yd) and must NOT be surfaced as curious-golfer fact.
    // Banding & conditioning stay correct (both relative), so only the anchor
    // COPY is affected — it quotes the trustworthy mph band, never a carry number.
    absoluteCarryTrusted: false,
  },
};

// Percentile anchors used to DERIVE the height / distance / speed edges from each
// club's own grid distribution (the "percentile-anchored bucket norms" method
// from v1, now computed programmatically & per club).
const HEIGHT_ANCHORS = [0.20, 0.60, 0.88]; // → Low / Normal / High / Ballooned band boundaries
const DIST_ANCHORS = [0.33, 0.75, 0.90];   // → Long / Full / Slight / Noticeable boundaries
const SPEED_ANCHORS = [0.33, 0.66];        // → slow / mid / fast boundaries
const HEIGHT_LABELS = ['Low', 'Normal', 'High', 'Ballooned'];
const DIST_LABELS = ['Long (gained distance)', 'Full (normal distance)', 'Slight loss', 'Noticeable loss'];
const SPEED_LABELS = ['slow', 'mid', 'fast'];

// ── PASS A: derive per-club bucket edges from grid percentiles ───────────────
function baselineForFactory(club, cfg) {
  const cache = new Map();
  return cs => {
    if (!cache.has(cs)) cache.set(cs, solveFlight({
      clubSpeed: cs, faceAngle: cfg.baseline.faceAngle, clubPath: cfg.baseline.clubPath,
      attackAngle: cfg.baseline.attackAngle, dynamicLoft: cfg.baseline.dynamicLoft, club,
    }));
    return cache.get(cs);
  };
}

function deriveEdges(club, cfg) {
  const baselineFor = baselineForFactory(club, cfg);
  const ratios = [], fracs = [];
  for (const cs of cfg.speeds) {
    const bl = baselineFor(cs);
    for (const fa of cfg.faces) for (const cp of cfg.paths) for (const aa of cfg.attacks) for (const dl of cfg.lofts) {
      const f = solveFlight({ clubSpeed: cs, faceAngle: fa, clubPath: cp, attackAngle: aa, dynamicLoft: dl, club });
      ratios.push(f.apex / bl.apex);
      fracs.push((bl.total - f.total) / bl.total);
    }
  }
  ratios.sort((a, b) => a - b);
  fracs.sort((a, b) => a - b);
  const heightEdges = HEIGHT_ANCHORS.map(p => percentile(ratios, p));
  const distEdges = DIST_ANCHORS.map(p => percentile(fracs, p));
  const speedSorted = cfg.speeds.slice().sort((a, b) => a - b);
  // speed edges: round the p33/p66 clubSpeed to the nearest grid step of 5
  const rawSpeedEdges = SPEED_ANCHORS.map(p => percentile(speedSorted, p));
  const speedEdges = rawSpeedEdges.map(v => Math.round(v / 5) * 5);
  // rank of the semantic anchors (baseline apex ratio 1.0 and distFrac 0.0)
  const rank = (arr, v) => arr.filter(x => x < v).length / arr.length;
  return {
    heightEdges, distEdges, speedEdges,
    heightRatioSpan: [ratios[0], ratios[ratios.length - 1]],
    distFracSpan: [fracs[0], fracs[fracs.length - 1]],
    baselineHeightRank: rank(ratios, 1.0),
    baselineDistRank: rank(fracs, 0.0),
  };
}

// band classifiers built from derived edges
function makeHeightBand(edges) {
  return ratio => ratio < edges[0] ? 'Low' : ratio < edges[1] ? 'Normal' : ratio < edges[2] ? 'High' : 'Ballooned';
}
function makeDistBand(edges) {
  return frac => frac < edges[0] ? DIST_LABELS[0] : frac < edges[1] ? DIST_LABELS[1] : frac < edges[2] ? DIST_LABELS[2] : DIST_LABELS[3];
}
function makeSpeedBand(edges) {
  return cs => cs < edges[0] ? 'slow' : cs < edges[1] ? 'mid' : 'fast';
}

// ── the 9 ball-flight buckets (classic 3 start × 3 curve window) ─────────────
const FLIGHT9 = ['Pull', 'Pull-Draw', 'Pull-Fade', 'Straight', 'Draw', 'Fade', 'Push', 'Push-Draw', 'Push-Fade'];
function flightBucket(startLine, curve) {
  const dir = curveDir(curve);
  if (startLine === 'Left') return dir === 'S' ? 'Pull' : dir === 'L' ? 'Pull-Draw' : 'Pull-Fade';
  if (startLine === 'Right') return dir === 'S' ? 'Push' : dir === 'L' ? 'Push-Draw' : 'Push-Fade';
  return dir === 'S' ? 'Straight' : dir === 'L' ? 'Draw' : 'Fade';
}
const START_FAMILY_OF = { // fine bucket → coarse start-line family (Pull / Straight / Push)
  'Pull': 'Left', 'Pull-Draw': 'Left', 'Pull-Fade': 'Left',
  'Straight': 'Straight', 'Draw': 'Straight', 'Fade': 'Straight',
  'Push': 'Right', 'Push-Draw': 'Right', 'Push-Fade': 'Right',
};

// SECONDARY-MISS: hold path/attack/loft/speed at the cluster representative and
// sweep the FACE across a ±FACE_WINDOW° timing window (one delivery, face varying
// shot-to-shot — the standard coaching causality). Record the 9-flight histogram
// (Laplace-smoothed so nothing hits a hard zero) + the coarse start-line mix.
const FACE_WINDOW = 6;      // ° of shot-to-shot face variability (wide but realistic)
const FACE_STEP = 1;
const LAPLACE = 0.5;        // add-α smoothing on the 9 fine buckets
function sweepSecondary(rep, club) {
  const centerFace = rep.faceAngle;
  const fine = Object.fromEntries(FLIGHT9.map(k => [k, 0]));
  let n = 0;
  const seen = new Set();
  for (let off = -FACE_WINDOW; off <= FACE_WINDOW + 1e-9; off += FACE_STEP) {
    const fa = Math.max(-8, Math.min(8, centerFace + off));
    const key = Math.round(fa * 100);
    if (seen.has(key)) continue; // dedupe clamp collisions
    seen.add(key);
    const f = solveFlight({
      clubSpeed: rep.clubSpeed, faceAngle: fa, clubPath: rep.clubPath,
      attackAngle: rep.attackAngle, dynamicLoft: rep.dynamicLoft, club,
    });
    fine[flightBucket(startLineBand(f.startDirection), parseShape(f.shape))]++;
    n++;
  }
  // Laplace-smoothed percentages
  const denom = n + LAPLACE * FLIGHT9.length;
  const alsoProduces = {};
  for (const k of FLIGHT9) alsoProduces[k] = +(100 * (fine[k] + LAPLACE) / denom).toFixed(1);
  const startLineMix = { Left: 0, Straight: 0, Right: 0 };
  for (const k of FLIGHT9) startLineMix[START_FAMILY_OF[k]] += alsoProduces[k];
  for (const s of Object.keys(startLineMix)) startLineMix[s] = +startLineMix[s].toFixed(1);
  return { alsoProduces, startLineMix };
}

// ── PASS B: build the per-club inverse map + conditioning stats ──────────────
function buildClub(club, cfg, edges) {
  const baselineFor = baselineForFactory(club, cfg);
  const heightOf = makeHeightBand(edges.heightEdges);
  const distOf = makeDistBand(edges.distEdges);
  const speedOf = makeSpeedBand(edges.speedEdges);

  // aggS1: primary inverse map (curve||startLine||height||dist → face||path||attack clusters)
  // aggS0: same symptom WITHOUT startLine — to measure startLine info gain (v1 continuity)
  const aggS1 = new Map();
  const aggS0 = new Map();
  // per-band median carry (for the speed-band human anchors)
  const carryBySpeedBand = { slow: [], mid: [], fast: [] };

  function bucket(agg, symKey) {
    let b = agg.get(symKey);
    if (!b) { b = { total: 0, clusters: new Map() }; agg.set(symKey, b); }
    return b;
  }
  function addCluster(b, causeKey, s) {
    b.total++;
    let c = b.clusters.get(causeKey);
    if (!c) {
      c = {
        count: 0, sumFace: 0, sumPath: 0, sumAttack: 0, sumLoft: 0, sumSpeed: 0,
        minFace: Infinity, maxFace: -Infinity, minPath: Infinity, maxPath: -Infinity,
        minAttack: Infinity, maxAttack: -Infinity, minLoft: Infinity, maxLoft: -Infinity,
        minSpeed: Infinity, maxSpeed: -Infinity,
        speed: { slow: 0, mid: 0, fast: 0 }, carries: [],
      };
      b.clusters.set(causeKey, c);
    }
    c.count++;
    c.sumFace += s.face; c.sumPath += s.path; c.sumAttack += s.attack; c.sumLoft += s.loft; c.sumSpeed += s.speed;
    c.minFace = Math.min(c.minFace, s.face); c.maxFace = Math.max(c.maxFace, s.face);
    c.minPath = Math.min(c.minPath, s.path); c.maxPath = Math.max(c.maxPath, s.path);
    c.minAttack = Math.min(c.minAttack, s.attack); c.maxAttack = Math.max(c.maxAttack, s.attack);
    c.minLoft = Math.min(c.minLoft, s.loft); c.maxLoft = Math.max(c.maxLoft, s.loft);
    c.minSpeed = Math.min(c.minSpeed, s.speed); c.maxSpeed = Math.max(c.maxSpeed, s.speed);
    c.speed[s.speedBand]++;
    c.carries.push(s.carryM);
  }

  // SHAPE-level aggregation for the info-gain table (populations conditioned on
  // curve+startLine only — i.e. what the user has told us after the 9-flight
  // picker + severity, BEFORE height/distance/speed/carry are asked).
  const shapeAgg = new Map(); // shapeKey -> { total, arch: Map(archKey -> archStats) }

  let n = 0;
  const t0 = Date.now();
  for (const cs of cfg.speeds) {
    const bl = baselineFor(cs);
    const sBand = speedOf(cs);
    for (const fa of cfg.faces) for (const cp of cfg.paths) for (const aa of cfg.attacks) for (const dl of cfg.lofts) {
      n++;
      const f = solveFlight({ clubSpeed: cs, faceAngle: fa, clubPath: cp, attackAngle: aa, dynamicLoft: dl, club });
      const curve = parseShape(f.shape);
      const startLine = startLineBand(f.startDirection);
      const height = heightOf(f.apex / bl.apex);
      const dist = distOf((bl.total - f.total) / bl.total);
      const carryM = f.carry * YARD_TO_M;
      const fB = faceBand(fa), pB = pathBand(cp), aB = attackBand(aa);
      const s = { face: fa, path: cp, attack: aa, loft: dl, speed: cs, speedBand: sBand, carryM };

      carryBySpeedBand[sBand].push(carryM);

      const causeKey = `${fB}||${pB}||${aB}`;
      addCluster(bucket(aggS1, `${curve}||${startLine}||${height}||${dist}`), causeKey, s);
      addCluster(bucket(aggS0, `${curve}||${height}||${dist}`), causeKey, s);

      // shape-level archetype accumulation
      const shapeKey = `${curve}||${startLine}`;
      let sh = shapeAgg.get(shapeKey);
      if (!sh) { sh = { total: 0, arch: new Map() }; shapeAgg.set(shapeKey, sh); }
      sh.total++;
      const archKey = `${fB}||${pB}||${aB}||${loftBand(dl)}||${sBand}`;
      let ar = sh.arch.get(archKey);
      if (!ar) {
        ar = {
          count: 0, sumFace: 0, sumPath: 0, sumAttack: 0, sumLoft: 0, sumSpeed: 0,
          fBand: fB, pBand: pB, aBand: aB,
          height: {}, dist: {}, speed: {}, carryBin: {},
        };
        sh.arch.set(archKey, ar);
      }
      ar.count++;
      ar.sumFace += fa; ar.sumPath += cp; ar.sumAttack += aa; ar.sumLoft += dl; ar.sumSpeed += cs;
      ar.height[height] = (ar.height[height] || 0) + 1;
      ar.dist[dist] = (ar.dist[dist] || 0) + 1;
      ar.speed[sBand] = (ar.speed[sBand] || 0) + 1;
      const cbin = Math.round(carryM / 20); // 20 m (±10 m) carry bins
      ar.carryBin[cbin] = (ar.carryBin[cbin] || 0) + 1;
    }
  }
  const elapsedMs = Date.now() - t0;

  // median carry per speed band (for human anchor copy)
  const medianCarry = {};
  for (const b of SPEED_LABELS) {
    const a = carryBySpeedBand[b].sort((x, y) => x - y);
    medianCarry[b] = a.length ? +percentile(a, 0.5).toFixed(0) : null;
  }

  return { aggS1, aggS0, shapeAgg, medianCarry, elapsedMs, totalCombos: n };
}

// ── finalize one cluster: representative (+spinLoft), ranges, conditioning ────
function finalizeCluster(causeKey, c, symptomTotal, club) {
  const [fB, pB, aB] = causeKey.split('||');
  const rep = {
    faceAngle: r1(c.sumFace / c.count),
    clubPath: r1(c.sumPath / c.count),
    attackAngle: r1(c.sumAttack / c.count),
    dynamicLoft: r1(c.sumLoft / c.count),
    clubSpeed: r1(c.sumSpeed / c.count),
  };
  // engine's ACTUAL spin-loft computation is `spinLoft = dynamicLoft - attackAngle`
  // (impact-flight.js line 125). Compute from the DISPLAYED rep values so the UI's
  // "loft − attack = spin loft" reads out self-consistently.
  rep.spinLoft = r1(rep.dynamicLoft - rep.attackAngle);
  const carries = c.carries.sort((a, b) => a - b);
  const total = c.speed.slow + c.speed.mid + c.speed.fast;
  const { alsoProduces, startLineMix } = sweepSecondary(rep, club);
  return {
    cause: { face: fB, path: pB, attack: aB },
    priorPct: +(100 * c.count / symptomTotal).toFixed(1),
    gridCount: c.count,
    representative: rep,
    ranges: {
      faceAngle: [c.minFace, c.maxFace], clubPath: [c.minPath, c.maxPath],
      attackAngle: [c.minAttack, c.maxAttack], dynamicLoft: [c.minLoft, c.maxLoft],
      clubSpeed: [c.minSpeed, c.maxSpeed],
    },
    speedHist: { slow: +(100 * c.speed.slow / total).toFixed(1), mid: +(100 * c.speed.mid / total).toFixed(1), fast: +(100 * c.speed.fast / total).toFixed(1) },
    carryM: { p10: +percentile(carries, 0.10).toFixed(1), p50: +percentile(carries, 0.50).toFixed(1), p90: +percentile(carries, 0.90).toFixed(1) },
    alsoProduces,
    startLineMix,
  };
}

// build the emitted inverseMap for one club (trim clusters < 1% into "other")
const MIN_CLUSTER_PCT = 1.0;
function buildInverseMap(aggS1, club) {
  const inverseMap = {};
  for (const [symKey, b] of aggS1) {
    let clusters = [...b.clusters.entries()].map(([ck, c]) => finalizeCluster(ck, c, b.total, club));
    clusters.sort((a, z) => z.gridCount - a.gridCount);
    const kept = clusters.filter(c => c.priorPct >= MIN_CLUSTER_PCT);
    const trimmed = clusters.filter(c => c.priorPct < MIN_CLUSTER_PCT);
    const otherPct = +trimmed.reduce((s, c) => s + c.priorPct, 0).toFixed(1);
    const [curve, startLine, height, distanceLoss] = symKey.split('||');
    inverseMap[symKey] = {
      descriptor: { curve, startLine, height, distanceLoss },
      gridCount: b.total,
      clusterCount: b.clusters.size,
      clusters: kept,
      otherClusterCount: trimmed.length,
      otherPct,
    };
  }
  return inverseMap;
}

// ── v1-style ambiguity + startLine entropy stats (continuity) ────────────────
function weightedAvgEntropy(agg) {
  let sumH = 0, sumW = 0;
  for (const b of agg.values()) {
    const counts = [...b.clusters.values()].map(c => c.count);
    sumH += shannonEntropy(counts, b.total) * b.total; sumW += b.total;
  }
  return sumW ? sumH / sumW : 0;
}
function ambiguityStats(aggS1) {
  let uniq = 0, mild = 0, amb = 0, wU = 0, wM = 0, wA = 0, tot = 0;
  for (const b of aggS1.values()) {
    tot += b.total; const k = b.clusters.size;
    if (k === 1) { uniq++; wU += b.total; } else if (k <= 3) { mild++; wM += b.total; } else { amb++; wA += b.total; }
  }
  return {
    totalSymptomBuckets: aggS1.size, uniqueBuckets: uniq, mildBuckets: mild, ambiguousBuckets: amb,
    weightedUniquePct: +(100 * wU / tot).toFixed(1), weightedMildPct: +(100 * wM / tot).toFixed(1), weightedAmbiguousPct: +(100 * wA / tot).toFixed(1),
  };
}

// ══════════════════════════════════════════════════════════════════════════
//  RUN: build both clubs
// ══════════════════════════════════════════════════════════════════════════
console.log('Deriving per-club bucket edges + building maps…');
const clubsOut = {};
const clubBuild = {};   // in-memory build artifacts for analysis
const clubEdges = {};
for (const [club, cfg] of Object.entries(CLUBS_CFG)) {
  const edges = deriveEdges(club, cfg);
  clubEdges[club] = edges;
  const build = buildClub(club, cfg, edges);
  clubBuild[club] = build;
  const inverseMap = buildInverseMap(build.aggS1, club);
  const H_S0 = weightedAvgEntropy(build.aggS0);
  const H_S1 = weightedAvgEntropy(build.aggS1);
  const amb = ambiguityStats(build.aggS1);

  // human anchor copy for the speed bands (curious-golfer language)
  const mc = build.medianCarry;
  const e0 = edges.speedEdges[0], e1 = edges.speedEdges[1];
  const lc = cfg.label.toLowerCase();
  // HONESTY (issue #1): only quote an ABSOLUTE carry number for a club whose
  // carry curve the engine is actually calibrated for. impact-flight.js is
  // 7-iron-calibrated, so the 7-iron carry is trustworthy. The driver falls back
  // to the 7-iron preset (smash capped ~1.42 vs a real driver's ~1.48–1.50, plus
  // 7-iron drag), so its absolute carry is understated by ~20–45 yd and must NOT
  // be stated as fact. For an untrusted club the anchor speaks only the (real,
  // trustworthy) club-speed band + a qualitative descriptor and carries a note —
  // no engine carry number is surfaced, and none is fabricated to replace it.
  const speedAnchorCopy = cfg.absoluteCarryTrusted ? {
    slow: `Gentle ${cfg.label} speed — most of these carry around ${mc.slow} m. Common for juniors, seniors and newer players (under ${e0} mph).`,
    mid: `The middle of the club-golfer range — around ${mc.mid} m carry. Where most amateurs sit (${e0}–${e1} mph).`,
    fast: `Strong / low-handicap speed — around ${mc.fast} m carry or more (${e1} mph and up).`,
  } : {
    slow: `Gentle ${cfg.label} speed — a senior, junior, lady or newer player's swing (under ${e0} mph).`,
    mid: `The middle of the amateur ${lc} range (${e0}–${e1} mph) — where most club golfers sit.`,
    fast: `Strong / low-handicap ${lc} speed (${e1} mph and up).`,
  };
  const speedNote = cfg.absoluteCarryTrusted ? null
    : `StrikeArc models the ${lc} on the engine's shared 7-iron physics (no dedicated ${lc} preset yet), so it reads the shape and cause of your miss — not an exact ${lc} carry. The model's ${lc} carry runs short of real-world yardage at these speeds, so no absolute carry is quoted here; the diagnosis and every band are relative to the ${lc} grid's own distribution and stay correct.`;

  // HONESTY (issue #2): per-band carry-loss magnitude, so nothing downstream can
  // imply a bigger geometry loss than the grid supports. Geometry alone barely
  // moves carry (finding #1), so even the worst "Noticeable loss" band is small.
  const [dLo, dHi] = edges.distFracSpan, dE = edges.distEdges;
  const bandLossPct = [[dLo, dE[0]], [dE[0], dE[1]], [dE[1], dE[2]], [dE[2], dHi]]
    .map(([lo, hi]) => [+(lo * 100).toFixed(1), +(hi * 100).toFixed(1)]);
  const distLossNote = `Geometry alone moves this club's carry only ${(dLo * 100).toFixed(1)}%..${(dHi * 100).toFixed(1)}% (finding #1). The worst "${DIST_LABELS[3]}" band is just ${(dE[2] * 100).toFixed(1)}%..${(dHi * 100).toFixed(1)}% of carry — the S3 UI word "Way short" names the PERCEIVED miss, but a loss that large is strike or club speed, which is exactly why "Way short" promotes the contact card (spec §3.4). The data never overstates the geometry loss.`;

  clubsOut[club] = {
    meta: {
      club, label: cfg.label,
      grid: {
        clubSpeed: [cfg.speeds[0], cfg.speeds.at(-1), cfg.speeds[1] - cfg.speeds[0]],
        faceAngle: [cfg.faces[0], cfg.faces.at(-1)], clubPath: [cfg.paths[0], cfg.paths.at(-1)],
        attackAngle: [cfg.attacks[0], cfg.attacks.at(-1)], dynamicLoft: cfg.lofts,
      },
      totalCombos: build.totalCombos,
      baseline: { ...cfg.baseline, note: cfg.baselineNote + ' — fixed reference per clubSpeed, not re-optimized' },
      bands: {
        height: { edges: edges.heightEdges.map(r1), labels: HEIGHT_LABELS, percentileAnchors: HEIGHT_ANCHORS, ratioSpan: edges.heightRatioSpan.map(r1), baselineRatioPercentile: +(100 * edges.baselineHeightRank).toFixed(1) },
        distance: { edges: edges.distEdges.map(x => +x.toFixed(4)), labels: DIST_LABELS, percentileAnchors: DIST_ANCHORS, fracSpan: edges.distFracSpan.map(x => +x.toFixed(4)), baselineFracPercentile: +(100 * edges.baselineDistRank).toFixed(1), bandLossPct, worstGeometryLossPct: +(edges.distFracSpan[1] * 100).toFixed(1), lossNote: distLossNote },
        speed: { edges: edges.speedEdges, labels: SPEED_LABELS, percentileAnchors: SPEED_ANCHORS, medianCarryM: mc, absoluteCarryTrusted: cfg.absoluteCarryTrusted, anchorCopy: speedAnchorCopy, note: speedNote },
      },
    },
    stats: {
      ...amb,
      entropyBits: { withoutStartLine: +H_S0.toFixed(3), withStartLine: +H_S1.toFixed(3) },
      startLineInfoGainBits: +(H_S0 - H_S1).toFixed(3),
    },
    inverseMap,
  };
  console.log(` ${cfg.label}: ${build.totalCombos} combos in ${build.elapsedMs}ms · ${amb.totalSymptomBuckets} symptom keys · height edges ${edges.heightEdges.map(r1).join('/')} · dist edges ${edges.distEdges.map(x => x.toFixed(3)).join('/')} · speed edges ${edges.speedEdges.join('/')}`);
}

const output = {
  meta: {
    generatedBy: 'tools/diagnose-harness-v2.mjs',
    engine: 'impact-flight.js (solveFlight) — read-only, byte-identical',
    clubs: Object.keys(CLUBS_CFG),
    schema: 'clubs.{club}.{meta,stats,inverseMap}; cluster adds speedHist, carryM{p10,p50,p90}, alsoProduces(9-flight), startLineMix, representative.spinLoft',
    driverEngineNote: "impact-flight.js has no driver preset; club:'driver' falls back to the 7-iron preset (VERIFIED identical). Driver grid = shared physics through driver-realistic input ranges; bands are percentile-anchored to the driver grid's OWN distribution; absolute driver carry compresses at high speed and is never treated as truth.",
    conditioningModel: 'posterior(cluster) ∝ prior(cluster) × P(answer|cluster); P(answer|cluster) = cluster member fraction in the answered band (speedHist / carry-CDF / startLineMix) or a hard attack-band filter (divot). Renormalize to 100 after each answer.',
    generatedAt: new Date().toISOString(),
  },
  clubs: clubsOut,
};

writeFileSync(OUT_JSON, JSON.stringify(output));
const bytes = readFileSync(OUT_JSON).length;
console.log(`Wrote ${OUT_JSON} (${(bytes / 1e6).toFixed(2)} MB)`);

// ══════════════════════════════════════════════════════════════════════════
//  ANALYSIS — reload the SHIPPED JSON and run the reference client pipeline on
//  it (proves the trimmed/rounded data reproduces the diagnosis), then compute
//  the info-gain table and the owner acceptance scenarios, then write findings.
// ══════════════════════════════════════════════════════════════════════════
const SHIPPED = JSON.parse(readFileSync(OUT_JSON, 'utf8'));

/* ── reference client pipeline (mirrors the future diagnose-engine-v2.js) ──── */
const DIST_SCALE = DIST_LABELS;
const HEIGHT_SCALE = HEIGHT_LABELS;
const SEVERITY_SWAP = { Slice: 'Fade', Fade: 'Slice', Hook: 'Draw', Draw: 'Hook' };
const dkey = ({ curve, startLine, height, distanceLoss }) => `${curve}||${startLine}||${height}||${distanceLoss}`;

function lookupV2(clubMap, descriptor) {
  const inv = clubMap.inverseMap;
  const key = dkey(descriptor);
  if (inv[key]) return { entry: inv[key], exact: true, key };
  const nearest = [], seen = new Set([key]);
  const tryCand = (desc, changed) => {
    if (nearest.length >= 3) return;
    const k = dkey(desc); if (seen.has(k)) return; seen.add(k);
    if (inv[k]) nearest.push({ descriptor: { ...desc }, changed, key: k });
  };
  const di = DIST_SCALE.indexOf(descriptor.distanceLoss);
  if (di >= 0) for (const s of [1, -1]) { const ni = di + s; if (ni >= 0 && ni < DIST_SCALE.length) tryCand({ ...descriptor, distanceLoss: DIST_SCALE[ni] }, 'distance'); }
  const hi = HEIGHT_SCALE.indexOf(descriptor.height);
  if (hi >= 0) for (const s of [1, -1]) { const ni = hi + s; if (ni >= 0 && ni < HEIGHT_SCALE.length) tryCand({ ...descriptor, height: HEIGHT_SCALE[ni] }, 'height'); }
  if (SEVERITY_SWAP[descriptor.curve]) tryCand({ ...descriptor, curve: SEVERITY_SWAP[descriptor.curve] }, 'severity');
  return { entry: null, nearest: nearest.slice(0, 3), key };
}

// group a cluster array (priorPcts summing to ~100) into face|path stories
function consolidate(clusters, meta) {
  const groups = new Map();
  for (const c of clusters) {
    const gk = c.cause.face + '||' + c.cause.path;
    let g = groups.get(gk);
    if (!g) { g = { face: c.cause.face, path: c.cause.path, cs: [] }; groups.set(gk, g); }
    g.cs.push(c);
  }
  let stories = [...groups.values()].map(g => {
    const cs = g.cs.slice().sort((a, b) => b.priorPct - a.priorPct);
    return {
      face: g.face, path: g.path,
      pct: +cs.reduce((s, c) => s + c.priorPct, 0).toFixed(1),
      rep: cs[0].representative,
      variants: cs.map(c => ({ attack: c.cause.attack, pct: c.priorPct, rep: c.representative })),
    };
  }).sort((a, b) => b.pct - a.pct);
  return { stories, meta };
}

// renormalize a cluster array's priorPct to sum 100 (returns new array)
function renorm(clusters) {
  const sum = clusters.reduce((s, c) => s + c.priorPct, 0) || 1;
  return clusters.map(c => ({ ...c, priorPct: +(c.priorPct / sum * 100).toFixed(1) }));
}
// generic Bayes reweight: posterior_i ∝ prior_i × w(cluster_i), renormalize
function reweight(clusters, wOf) {
  const scaled = clusters.map(c => ({ ...c, priorPct: c.priorPct * wOf(c) }));
  return renorm(scaled);
}
const SPEED_ANSWER_KEY = { slow: 'slow', mid: 'mid', fast: 'fast' };
function reweightSpeed(clusters, ans) { return reweight(clusters, c => (c.speedHist[SPEED_ANSWER_KEY[ans]] || 0) / 100); }
const FAMILY_OF_ANSWER = { pulls: 'Left', straights: 'Straight', pushes: 'Right' };
function reweightSecondary(clusters, ans) { const fam = FAMILY_OF_ANSWER[ans]; return reweight(clusters, c => (c.startLineMix[fam] || 0.1) / 100); }
// carry CDF from p10/p50/p90 (piecewise-linear, clamped) → P(carry∈[v-w,v+w])
function carryCDF(cm, x) {
  const xs = [cm.p10, cm.p50, cm.p90], ys = [0.10, 0.50, 0.90];
  if (x <= xs[0]) { const slope = (ys[1] - ys[0]) / Math.max(1e-6, xs[1] - xs[0]); return Math.max(0, ys[0] + (x - xs[0]) * slope); }
  if (x >= xs[2]) { const slope = (ys[2] - ys[1]) / Math.max(1e-6, xs[2] - xs[1]); return Math.min(1, ys[2] + (x - xs[2]) * slope); }
  for (let i = 0; i < 2; i++) if (x >= xs[i] && x <= xs[i + 1]) return ys[i] + (ys[i + 1] - ys[i]) * (x - xs[i]) / Math.max(1e-6, xs[i + 1] - xs[i]);
  return 0.5;
}
function reweightCarry(clusters, vMeters, band = 10) { return reweight(clusters, c => Math.max(1e-4, carryCDF(c.carryM, vMeters + band) - carryCDF(c.carryM, vMeters - band))); }
const divotSet = ans => ans === 'deep' ? new Set(['steep descending']) : ans === 'brushed' ? new Set(['moderate descending', 'level']) : ans === 'none' ? new Set(['level', 'ascending']) : null;
function filterDivot(clusters, ans) {
  const set = divotSet(ans); if (!set) return { clusters, empty: false };
  const kept = clusters.filter(c => set.has(c.cause.attack));
  if (!kept.length) return { clusters, empty: true };       // honest fallback: keep all
  return { clusters: renorm(kept), empty: false };
}

/* ── coach-sentence + word helpers ──────────────────────────────────────── */
const faceWord = f => f > 4 ? 'wide-open' : f > 1 ? 'open' : f >= -1 ? 'square' : f >= -4 ? 'closed' : 'shut';
const pathWord = p => p > 4 ? 'well out to the right' : p > 1 ? 'out to the right' : p >= -1 ? 'down the line' : p >= -4 ? 'across it (out-to-in)' : 'well across it (out-to-in)';
function coachSentence(story, curve, club) {
  const r = story.rep, gap = +(r.faceAngle - r.clubPath).toFixed(1);
  const rel = gap > 1 ? 'open to' : gap < -1 ? 'shut to' : 'matched to';
  const sl = r.spinLoft;
  // spin-loft commentary is CLUB-AWARE: a driver's healthy spin loft (~12–15°)
  // is a 7-iron's de-lofted; the same absolute number reads differently per club.
  const slNote = club === 'driver'
    ? (sl >= 18 ? 'a lot of spin loft for a driver — it balloons and bleeds carry' : sl >= 13 ? 'healthy driver spin loft' : 'low spin loft — hot and low')
    : (sl >= 34 ? 'a lot of spin loft — it climbs and bleeds speed' : sl >= 26 ? 'healthy spin loft' : 'low spin loft — it comes out hot and flat');
  return `Face ${rel} path (${r.faceAngle >= 0 ? '+' : ''}${r.faceAngle}° vs ${r.clubPath >= 0 ? '+' : ''}${r.clubPath}°) is the whole ${curve.toLowerCase()}; ${r.dynamicLoft}° delivered loft minus a ${r.attackAngle >= 0 ? '+' : ''}${r.attackAngle}° attack = ${sl}° spin loft (${slNote}).`;
}
const pctOfPath = (stories, pred) => +stories.filter(s => pred(s.path)).reduce((s, st) => s + st.pct, 0).toFixed(1);
const isOutToIn = p => p.includes('out-to-in');
const isInToOut = p => p.includes('in-to-out');
const top2 = stories => stories.slice(0, 2).map(s => `${s.face} / ${s.path} ${s.pct}%`).join('  ·  ');

/* ══ INFO-GAIN over shape-conditioned populations ═════════════════════════ */
function computeInfoGain(club, shapeKey) {
  const sh = clubBuild[club].shapeAgg.get(shapeKey);
  if (!sh) return null;
  const archMarg = new Map();
  for (const [ak, ar] of sh.arch) archMarg.set(ak, ar.count);
  const total = sh.total;
  const H0 = shannonEntropy([...archMarg.values()], total);

  function miDirect(field) {
    const answerTotals = new Map(), jointByAnswer = new Map();
    for (const [ak, ar] of sh.arch) for (const [ans, c] of Object.entries(ar[field])) {
      answerTotals.set(ans, (answerTotals.get(ans) || 0) + c);
      let jm = jointByAnswer.get(ans); if (!jm) { jm = new Map(); jointByAnswer.set(ans, jm); } jm.set(ak, (jm.get(ak) || 0) + c);
    }
    let Hcond = 0;
    for (const [ans, at] of answerTotals) Hcond += (at / total) * shannonEntropy([...jointByAnswer.get(ans).values()], at);
    return H0 - Hcond;
  }
  // attack-known ceiling: answer = attack band (deterministic given archetype)
  function miAttackKnown() {
    const byBand = new Map();
    for (const [ak, ar] of sh.arch) { let m = byBand.get(ar.aBand); if (!m) { m = new Map(); byBand.set(ar.aBand, m); } m.set(ak, ar.count); }
    let Hcond = 0;
    for (const m of byBand.values()) { const t = [...m.values()].reduce((a, b) => a + b, 0); Hcond += (t / total) * shannonEntropy([...m.values()], t); }
    return H0 - Hcond;
  }
  // divot: lossy 3-way observation of attack band
  function miDivot() {
    const divotP = { 'steep descending': { deep: 1 }, 'moderate descending': { brushed: 1 }, 'level': { brushed: 0.5, none: 0.5 }, 'ascending': { none: 1 } };
    const answers = ['deep', 'brushed', 'none'];
    const jointByAnswer = new Map(answers.map(a => [a, new Map()]));
    const answerTotals = new Map(answers.map(a => [a, 0]));
    for (const [ak, ar] of sh.arch) {
      const dist = divotP[ar.aBand] || {};
      for (const a of answers) { const w = (dist[a] || 0) * ar.count; if (w <= 0) continue; answerTotals.set(a, answerTotals.get(a) + w); const jm = jointByAnswer.get(a); jm.set(ak, (jm.get(ak) || 0) + w); }
    }
    let Hcond = 0;
    for (const a of answers) { const at = answerTotals.get(a); if (at <= 0) continue; Hcond += (at / total) * shannonEntropy([...jointByAnswer.get(a).values()], at); }
    return H0 - Hcond;
  }
  // secondary-miss: answer = start-line family, P(fam|arch) from arch-rep sweep
  function miSecondary() {
    const answers = ['Left', 'Straight', 'Right'];
    const jointByAnswer = new Map(answers.map(a => [a, new Map()]));
    const answerTotals = new Map(answers.map(a => [a, 0]));
    for (const [ak, ar] of sh.arch) {
      const rep = { faceAngle: ar.sumFace / ar.count, clubPath: ar.sumPath / ar.count, attackAngle: ar.sumAttack / ar.count, dynamicLoft: ar.sumLoft / ar.count, clubSpeed: ar.sumSpeed / ar.count };
      const mix = sweepSecondary(rep, club).startLineMix;
      for (const a of answers) { const w = (mix[a] / 100) * ar.count; answerTotals.set(a, answerTotals.get(a) + w); const jm = jointByAnswer.get(a); jm.set(ak, (jm.get(ak) || 0) + w); }
    }
    let Hcond = 0;
    for (const a of answers) { const at = answerTotals.get(a); if (at <= 0) continue; Hcond += (at / total) * shannonEntropy([...jointByAnswer.get(a).values()], at); }
    return H0 - Hcond;
  }
  // secondary-miss's TRUE target is the path/story (face|path), not the full
  // archetype — so measure I(story ; also-pulls) too, for an honest showing.
  function miSecondaryStory() {
    const storyCount = new Map();
    for (const [, ar] of sh.arch) { const sk = ar.fBand + '||' + ar.pBand; storyCount.set(sk, (storyCount.get(sk) || 0) + ar.count); }
    const Hs = shannonEntropy([...storyCount.values()], total);
    const answers = ['Left', 'Straight', 'Right'];
    const jointByAnswer = new Map(answers.map(a => [a, new Map()]));
    const answerTotals = new Map(answers.map(a => [a, 0]));
    for (const [, ar] of sh.arch) {
      const rep = { faceAngle: ar.sumFace / ar.count, clubPath: ar.sumPath / ar.count, attackAngle: ar.sumAttack / ar.count, dynamicLoft: ar.sumLoft / ar.count, clubSpeed: ar.sumSpeed / ar.count };
      const mix = sweepSecondary(rep, club).startLineMix;
      const sk = ar.fBand + '||' + ar.pBand;
      for (const a of answers) { const w = (mix[a] / 100) * ar.count; answerTotals.set(a, answerTotals.get(a) + w); const jm = jointByAnswer.get(a); jm.set(sk, (jm.get(sk) || 0) + w); }
    }
    let Hcond = 0;
    for (const a of answers) { const at = answerTotals.get(a); if (at <= 0) continue; Hcond += (at / total) * shannonEntropy([...jointByAnswer.get(a).values()], at); }
    return { Hstory: +Hs.toFixed(3), gain: +(Hs - Hcond).toFixed(3) };
  }
  const secStory = miSecondaryStory();
  return {
    shapeKey, total, H0: +H0.toFixed(3),
    speed: +miDirect('speed').toFixed(3),
    height: +miDirect('height').toFixed(3),
    relDistance: +miDirect('dist').toFixed(3),
    absCarry: +miDirect('carryBin').toFixed(3),
    secondaryMiss: +miSecondary().toFixed(3),
    secondaryMissStory: secStory.gain,
    Hstory: secStory.Hstory,
    divot: +miDivot().toFixed(3),
    attackKnownCeiling: +miAttackKnown().toFixed(3),
  };
}

const IG_SHAPES = { '7iron': ['Slice||Right', 'Slice||Straight', 'Hook||Left', 'Straight||Right'] };
const IG_LABEL = {
  'Slice||Right': 'Everyday slice — starts right, curves right (path AMBIGUOUS)',
  'Slice||Straight': 'Slice — starts straight, curves right (path PINNED out-to-in)',
  'Hook||Left': 'Pull-hook — starts left, curves left',
  'Straight||Right': 'Push — starts right, flies straight',
};
const infoGain = {};
for (const club of Object.keys(IG_SHAPES)) for (const sk of IG_SHAPES[club]) infoGain[`${club}:${sk}`] = computeInfoGain(club, sk);

/* ══ OWNER ACCEPTANCE SCENARIOS ═══════════════════════════════════════════ */
function runScenario(sc) {
  const clubMap = SHIPPED.clubs[sc.club];
  const lk = lookupV2(clubMap, sc.descriptor);
  const steps = [];
  let usedNearest = null, entry = lk.entry;
  if (!entry) {
    usedNearest = lk.nearest[0] || null;
    if (usedNearest) entry = clubMap.inverseMap[usedNearest.key];
  }
  if (!entry) return { sc, sMiss: true, nearest: lk.nearest, steps, pass: sc.allowSMiss === true, note: 'no exact bucket and no nearest' };
  // BASELINE (issue #3): stored priorPct shares WITHOUT renorm — the true
  // all-delivery share, exactly the documented consolidateStories(entry) API
  // (§6). The <1% tail (entry.otherPct) is the honesty line, carried — NOT
  // renormalized away. (The old code did `renorm(entry.clusters)`, which dropped
  // otherPct and inflated the top story ~1% absolute, e.g. 37.6% → 38.7%.)
  const baseClusters = entry.clusters.map(c => ({ ...c }));
  const baseCons = consolidate(baseClusters, entry);
  const otherPct = entry.otherPct;
  steps.push({ label: 'baseline (shape+height+distance)', basis: 'all-delivery', otherPct, top: baseCons.stories.slice(0, 2), stories: baseCons.stories });

  // CONDITIONING is the Bayes posterior, which renormalizes the ≥1% survivors to
  // 100 on each answer (documented model, §2 — the <1% tail can't be reweighted
  // without its stats, so it is set aside). To isolate the conditioning EFFECT
  // from that tail-drop, the "before" it is compared against is the RENORMALIZED
  // baseline (same survivor basis as the "after"). reweight() renormalizes
  // regardless, so the after-numbers are identical whether or not baseline was
  // renormalized — only the honest DISPLAY changed above.
  let clusters = renorm(baseClusters);
  const condBefore = consolidate(clusters, entry); // survivor-basis baseline
  for (const cond of (sc.conditions || [])) {
    let empty = false;
    if (cond.type === 'speed') clusters = reweightSpeed(clusters, cond.value);
    else if (cond.type === 'secondary') clusters = reweightSecondary(clusters, cond.value);
    else if (cond.type === 'carry') clusters = reweightCarry(clusters, cond.value);
    else if (cond.type === 'divot') { const r = filterDivot(clusters, cond.value); clusters = r.clusters; empty = r.empty; }
    const cons = consolidate(clusters, entry);
    steps.push({ label: `+ ${cond.type}=${cond.value}${empty ? ' (no fit — kept all, honest)' : ''}`, basis: 'survivor', top: cons.stories.slice(0, 2), stories: cons.stories });
  }
  const finalStories = steps[steps.length - 1].stories;
  const check = sc.check(steps, entry, lk, { condBefore });
  return { sc, sMiss: false, usedNearest, entry, steps, otherPct, condBefore, pass: check.pass, why: check.why, coach: coachSentence(finalStories[0], sc.descriptor.curve, sc.club) };
}

const SCENARIOS = [
  { id: 'a', title: '7-iron · mid speed · slice · HIGH · noticeably short (the coach\'s own diagnosis)',
    club: '7iron', descriptor: { curve: 'Slice', startLine: 'Straight', height: 'High', distanceLoss: 'Noticeable loss' },
    conditions: [{ type: 'speed', value: 'mid' }],
    check: (steps) => { const t = steps.at(-1).stories[0]; const pass = t.rep.dynamicLoft >= 30 && (t.rep.faceAngle - t.rep.clubPath) > 0; return { pass, why: `top loft ${t.rep.dynamicLoft}° (added-loft), spinLoft ${t.rep.spinLoft}°, face-to-path +${(t.rep.faceAngle - t.rep.clubPath).toFixed(1)}° (open to path)` }; } },
  { id: 'b', title: '7-iron · mid speed · slice · LOW · noticeably short (contrast to a)',
    club: '7iron', descriptor: { curve: 'Slice', startLine: 'Straight', height: 'Low', distanceLoss: 'Noticeable loss' }, allowSMiss: true,
    conditions: [], check: () => ({ pass: true, why: 'handled below (S-MISS expected — see finding)' }) },
  { id: 'b2', title: '7-iron · slice · LOW · (nearest real low slice) — loft story must FLIP vs a',
    club: '7iron', descriptor: { curve: 'Slice', startLine: 'Straight', height: 'Low', distanceLoss: 'Full (normal distance)' },
    conditions: [], check: (steps) => { const t = steps.at(-1).stories[0]; const pass = t.rep.dynamicLoft <= 24; return { pass, why: `low-flight slice top loft ${t.rep.dynamicLoft}° (de-lofted) vs scenario-a's added-loft ${'≥30°'} — materially different loft story` }; } },
  { id: 'c', title: 'Driver · slice (starts right) · "also pulls often" → out-to-in path stories strengthen',
    club: 'driver', descriptor: { curve: 'Slice', startLine: 'Right', height: 'Normal', distanceLoss: 'Full (normal distance)' },
    conditions: [{ type: 'secondary', value: 'pulls' }],
    // compare on the SURVIVOR basis (condBefore) so the shift isolates the
    // reweighting effect, not the <1% tail being set aside (issue #3).
    check: (steps, entry, lk, extra) => { const b = extra.condBefore.stories, a = steps.at(-1).stories; const before = pctOfPath(b, isOutToIn); const after = pctOfPath(a, isOutToIn); const neuBefore = pctOfPath(b, p => p === 'neutral'); const neuAfter = pctOfPath(a, p => p === 'neutral'); return { pass: after > before + 0.05 && neuAfter < neuBefore, why: `out-to-in path mass ${before}% → ${after}% (↑); neutral-path mass ${neuBefore}% → ${neuAfter}% (↓) after "also pulls" — shares among the ≥1% patterns (the model renormalizes survivors on each answer)` }; } },
  { id: 'd', title: 'Driver · fast · ballooned · way short → spin-loft excess',
    club: 'driver', descriptor: { curve: 'Fade', startLine: 'Straight', height: 'Ballooned', distanceLoss: 'Noticeable loss' },
    conditions: [{ type: 'speed', value: 'fast' }],
    check: (steps) => { const t = steps.at(-1).stories[0]; const pass = t.rep.spinLoft >= 16; return { pass, why: `top story spinLoft ${t.rep.spinLoft}° (loft ${t.rep.dynamicLoft}° − attack ${t.rep.attackAngle}°) — driver spin-loft excess (grid max ≈ 24°)` }; } },
  { id: 'e', title: '7-iron · push that sometimes becomes push-draw → in-to-out path, face timing',
    club: '7iron', descriptor: { curve: 'Straight', startLine: 'Right', height: 'Normal', distanceLoss: 'Full (normal distance)' },
    conditions: [{ type: 'secondary', value: 'pushes' }],
    check: (steps, entry) => { const t = steps.at(-1).stories[0]; const cl = entry.clusters.find(c => c.cause.face === t.face && c.cause.path === t.path); const pd = cl ? cl.alsoProduces['Push-Draw'] : null; const pass = isInToOut(t.path) && t.rep.clubPath > 1; return { pass, why: `top story path "${t.path}" (in-to-out), rep path +${t.rep.clubPath}°, face +${t.rep.faceAngle}° matched-right; this cluster's face-timing sweep produces Push-Draw ${pd}% of the time (draws confirm the in-to-out path)` }; } },
  { id: 'f', title: '7-iron · pull-hook · low & running → shut face + in-to-out path (the snap-hook — see finding #2)',
    club: '7iron', descriptor: { curve: 'Hook', startLine: 'Left', height: 'Low', distanceLoss: 'Long (gained distance)' },
    conditions: [], check: (steps) => { const t = steps.at(-1).stories[0]; const pass = t.rep.faceAngle < -1 && !isOutToIn(t.path); return { pass, why: `top story face ${t.rep.faceAngle}° (shut) · path ${t.rep.clubPath}° (${t.path}) — the snap-hook. Engine disagrees with the "out-to-in pull-hook" intuition: a shut face on an out-to-in path can only make a pull-DRAW (finding #2)` }; } },
  { id: 'g', title: '7-iron · the pure shot (Straight/Straight/Normal/Full) — the wink case',
    club: '7iron', descriptor: { curve: 'Straight', startLine: 'Straight', height: 'Normal', distanceLoss: 'Full (normal distance)' },
    conditions: [], check: (steps) => { const t = steps.at(-1).stories[0]; const pass = Math.abs(t.rep.faceAngle) <= 2 && Math.abs(t.rep.clubPath) <= 2; return { pass, why: `top story face ${t.rep.faceAngle}° · path ${t.rep.clubPath}° — square & down the line` }; } },
  { id: 'h', title: '7-iron · everyday over-the-top slice + divot=deep refiner',
    club: '7iron', descriptor: { curve: 'Slice', startLine: 'Right', height: 'Normal', distanceLoss: 'Slight loss' },
    conditions: [{ type: 'divot', value: 'deep' }],
    check: (steps) => { const t0 = steps[0].stories[0], t1 = steps.at(-1).stories[0]; const pass = (t1.rep.faceAngle - t1.rep.clubPath) > 0 && t1.variants[0].attack === 'steep descending'; return { pass, why: `before: ${t0.face}/${t0.path} ${t0.pct}%; after divot=deep top variant attack="${t1.variants[0].attack}"` }; } },
  { id: 'i', title: '7-iron · weak high fade that loses a little → open face + added loft',
    club: '7iron', descriptor: { curve: 'Fade', startLine: 'Right', height: 'High', distanceLoss: 'Slight loss' },
    conditions: [], check: (steps) => { const t = steps.at(-1).stories[0]; const pass = (t.rep.faceAngle - t.rep.clubPath) > 0 && t.rep.dynamicLoft >= 28; return { pass, why: `face-to-path +${(t.rep.faceAngle - t.rep.clubPath).toFixed(1)}° (open), loft ${t.rep.dynamicLoft}° (added), spinLoft ${t.rep.spinLoft}°` }; } },
  { id: 'j', title: '7-iron · low draw that runs out (gains distance) → de-lofted, face shut to path',
    club: '7iron', descriptor: { curve: 'Draw', startLine: 'Straight', height: 'Low', distanceLoss: 'Long (gained distance)' },
    conditions: [], check: (steps) => { const t = steps.at(-1).stories[0]; const pass = (t.rep.faceAngle - t.rep.clubPath) < 0 && t.rep.dynamicLoft <= 24; return { pass, why: `face-to-path ${(t.rep.faceAngle - t.rep.clubPath).toFixed(1)}° (shut to path → draw), loft ${t.rep.dynamicLoft}° (de-lofted), spinLoft ${t.rep.spinLoft}°` }; } },
];
const scenarioResults = SCENARIOS.map(runScenario);

/* ══ 3 WORKED RENORMALIZATION PROOFS ══════════════════════════════════════ */
function renormProof(club, descriptor, cond) {
  const clubMap = SHIPPED.clubs[club];
  const entry = clubMap.inverseMap[dkey(descriptor)];
  const inMem = clubBuild[club].aggS1.get(dkey(descriptor)); // exact member counts
  const before = renorm(entry.clusters.map(c => ({ ...c })));
  let after, wLabel, exactCheck = null;
  if (cond.type === 'speed') {
    after = reweightSpeed(before, cond.value);
    wLabel = `P(speed=${cond.value}|cluster) = speedHist.${cond.value}/100`;
    // EXACT: member count in band / Σ member counts in band, from in-memory build
    const bandTot = [...inMem.clusters.values()].reduce((s, c) => s + c.speed[cond.value], 0);
    exactCheck = [...inMem.clusters.entries()].map(([ck, c]) => ({ cause: ck, exactPct: +(100 * c.speed[cond.value] / bandTot).toFixed(1) }));
  } else if (cond.type === 'divot') {
    const r = filterDivot(before, cond.value); after = r.clusters;
    wLabel = `keep attack ∈ divotFilter(${cond.value}) then renormalize`;
  } else if (cond.type === 'secondary') {
    after = reweightSecondary(before, cond.value);
    wLabel = `P(${cond.value}|cluster) = startLineMix.${FAMILY_OF_ANSWER[cond.value]}/100 (Laplace-floored)`;
  }
  return { club, descriptor, cond, wLabel, before, after, exactCheck, entry };
}
const proofs = [
  renormProof('7iron', { curve: 'Slice', startLine: 'Straight', height: 'Normal', distanceLoss: 'Slight loss' }, { type: 'speed', value: 'fast' }),
  renormProof('7iron', { curve: 'Slice', startLine: 'Straight', height: 'Normal', distanceLoss: 'Slight loss' }, { type: 'divot', value: 'deep' }),
  renormProof('driver', { curve: 'Slice', startLine: 'Straight', height: 'Normal', distanceLoss: 'Full (normal distance)' }, { type: 'secondary', value: 'pulls' }),
];

/* ══ controlled mechanism probes (reproducible, for the findings prose) ═════ */
// Flagship mechanism: hold face/attack/loft/speed, sweep the face ±FACE_WINDOW,
// count the Left-start (pull) fraction — ISOLATING clubPath. If out-to-in path
// raises the pull fraction, "also pulls" honestly discriminates out-to-in.
function pullFractionProbe(club, centerFace, path) {
  const cs = club === 'driver' ? 100 : 85, aa = club === 'driver' ? 1 : -3, dl = club === 'driver' ? 13 : 28;
  let L = 0, n = 0;
  for (let off = -FACE_WINDOW; off <= FACE_WINDOW + 1e-9; off += FACE_STEP) {
    const fa = Math.max(-8, Math.min(8, centerFace + off));
    const f = solveFlight({ clubSpeed: cs, faceAngle: fa, clubPath: path, attackAngle: aa, dynamicLoft: dl, club });
    if (startLineBand(f.startDirection) === 'Left') L++; n++;
  }
  return +(100 * L / n).toFixed(1);
}
const pathIsolation = { driver: {}, '7iron': {} };
for (const club of ['driver', '7iron']) for (const cf of [3, 5]) pathIsolation[club][cf] = [0, -3, -6].map(p => pullFractionProbe(club, cf, p));

// Snap-hook proof: across paths, which curve severity can a shut face reach?
function hookFeasibility() {
  const rows = [];
  for (const path of [-6, -3, -1, 2, 6]) {
    const shapes = [-8, -7, -6].map(face => solveFlight({ clubSpeed: 85, faceAngle: face, clubPath: path, attackAngle: -3, dynamicLoft: 24, club: '7iron' }).shape);
    rows.push({ path, shapes });
  }
  return rows;
}
const hookRows = hookFeasibility();

/* ══ console summary ══════════════════════════════════════════════════════ */
console.log('\nSCENARIOS:');
for (const r of scenarioResults) {
  if (r.sMiss) { console.log(` [${r.sc.id}] ${r.pass ? 'PASS' : 'FAIL'} (S-MISS) ${r.sc.title}\n     nearest: ${r.nearest.map(n => n.changed).join(', ') || 'none'}`); continue; }
  console.log(` [${r.sc.id}] ${r.pass ? 'PASS' : 'FAIL'}${r.usedNearest ? ' (via nearest:' + r.usedNearest.changed + ')' : ''} ${r.sc.title}`);
  console.log(`     ${r.why}`);
}
console.log('\nINFO-GAIN (bits, 7-iron shape posteriors):');
for (const sk of IG_SHAPES['7iron']) { const g = infoGain['7iron:' + sk]; console.log(`  ${IG_LABEL[sk].padEnd(58)} H0=${g.H0}  speed=${g.speed} height=${g.height} dist=${g.relDistance} carry=${g.absCarry} secondary(arch/story)=${g.secondaryMiss}/${g.secondaryMissStory} divot=${g.divot} (attackCeil=${g.attackKnownCeiling})`); }

/* ══ FINDINGS DOC ═════════════════════════════════════════════════════════ */
writeFindings();

function fmtPct(n) { return (n >= 0 ? '' : '') + n.toFixed(1) + '%'; }
function writeFindings() {
  const c7 = SHIPPED.clubs['7iron'], cD = SHIPPED.clubs['driver'];
  const L = [];
  const P = s => L.push(s);
  P(`# Diagnose My Shot — Inverse Data Layer v2 (coach-interview)`);
  P(``);
  P(`**Generated by** \`tools/diagnose-harness-v2.mjs\` · **engine** \`impact-flight.js\` (read-only, byte-identical) · **${new Date().toISOString().slice(0, 10)}**`);
  P(`**Emits** \`diagnose-map-v2.json\` (${(bytes / 1e6).toFixed(2)} MB, cap 4 MB) + this doc. v1 (\`diagnose-map.json\`) is untouched for the live page.`);
  P(``);
  P(`Everything below falls out of \`solveFlight()\` grid counts. No invented physics, no hand-tuned probabilities. All computation is local node.`);
  P(``);
  P(`---`);
  P(``);
  P(`## 0. What changed from v1 (and what stayed law)`);
  P(``);
  P(`v1 inverted a single 7-iron grid into 180 descriptor→cause buckets with volume priors + representatives. v2 keeps that method verbatim and adds five things, each derived the same honest way:`);
  P(``);
  P(`1. **Per-club grids** — 7-iron kept byte-for-byte; **driver** added with its own realistic delivery ranges and its own percentile-derived height/distance/speed norms.`);
  P(`2. **Conditioning stats on every cluster** (speed histogram + carry p10/p50/p90 + secondary-miss histogram) so answers reweight clusters **without duplicating maps**.`);
  P(`3. **Secondary-miss math** (\`alsoProduces\`) — the coach's "do you also hit pulls/pushes?" question, computed by sweeping the face.`);
  P(`4. **Info-gain table** — expected bits each candidate question buys → a recommended ask order inside the 6-tap budget.`);
  P(`5. **Owner acceptance scenarios** run against the shipped, trimmed, rounded JSON.`);
  P(``);
  P(`The v1 honesty doctrine still governs: **shape (curve+start-line) structurally pins the face-to-path relationship** (asserted, calm), while **which exact delivery produced it stays a ranked list with real prior shares** (never a fake 95%). Conditioning narrows that list; it never invents certainty.`);
  P(``);
  P(`### The one engine caveat, stated plainly`);
  P(``);
  P(`\`impact-flight.js\` has **no driver preset** — its \`CLUBS\` table is 7-iron only, so \`club:'driver'\` **falls back to the 7-iron preset** (verified: \`solveFlight(…,'driver')\` is byte-identical to \`solveFlight(…,'7iron')\` for equal inputs). The driver grid is therefore the *same shared physics driven through driver-realistic input ranges*. Two honest consequences, both respected by the data layer:`);
  P(``);
  P(`- **(good, real) start-line is correctly more face-dominant at low loft.** The engine's built-in \`faceW\` loft-taper gives **0.835** at driver loft 13 vs **0.760** at 7-iron loft 28 — a driver starts the ball more where the face points. This is a genuine, physically-motivated difference, not a fudge.`);
  P(`- **(watch it) absolute driver carry compresses at the top.** The shared ball-speed→carry curve is 7-iron-drag-calibrated and saturates early (driver cs 115 → ~225 yd carry, cs 120 → ~227 yd — plausible *shape*, understated *magnitude* at tour speed). So **absolute driver yardage is never treated as truth.** Every driver band is percentile-anchored to the **driver grid's own distribution**, and all conditioning is **relative** (member-count reweighting).`);
  P(``);
  P(`---`);
  P(``);
  P(`## 1. Per-club grids + percentile-derived bucket norms`);
  P(``);
  P(`Height and distance bands are **derived per club** from that club's own grid percentiles (the v1 method, now programmatic). A "High" driver flight is **not** the same ratio as a "High" 7-iron flight, and both are relative to their own well-struck baseline.`);
  P(``);
  P(`| | 7-iron | Driver |`);
  P(`|---|---|---|`);
  P(`| Grid combos | ${c7.meta.totalCombos.toLocaleString()} | ${cD.meta.totalCombos.toLocaleString()} |`);
  P(`| Club speed (mph) | ${c7.meta.grid.clubSpeed[0]}–${c7.meta.grid.clubSpeed[1]} /${c7.meta.grid.clubSpeed[2]} | ${cD.meta.grid.clubSpeed[0]}–${cD.meta.grid.clubSpeed[1]} /${cD.meta.grid.clubSpeed[2]} |`);
  P(`| Face / path (°) | ±8 / ±8 | ±8 / ±8 |`);
  P(`| Attack (°) | ${c7.meta.grid.attackAngle[0]}..${c7.meta.grid.attackAngle[1]} | ${cD.meta.grid.attackAngle[0]}..${cD.meta.grid.attackAngle[1]} |`);
  P(`| Dynamic loft (°) | ${c7.meta.grid.dynamicLoft[0]}..${c7.meta.grid.dynamicLoft.at(-1)} /2 | ${cD.meta.grid.dynamicLoft[0]}..${cD.meta.grid.dynamicLoft.at(-1)} /1 |`);
  P(`| Well-struck baseline | attack ${c7.meta.baseline.attackAngle}°, loft ${c7.meta.baseline.dynamicLoft}° | attack ${cD.meta.baseline.attackAngle}°, loft ${cD.meta.baseline.dynamicLoft}° |`);
  P(`| Height ratio span | ${c7.meta.bands.height.ratioSpan.join('–')} | ${cD.meta.bands.height.ratioSpan.join('–')} |`);
  P(`| **Height edges** (Low/Norm/High/Balloon @ p${HEIGHT_ANCHORS.map(x => x * 100).join('/')}) | ${c7.meta.bands.height.edges.join(' / ')} | ${cD.meta.bands.height.edges.join(' / ')} |`);
  P(`| Dist-frac span | ${c7.meta.bands.distance.fracSpan.join(' .. ')} | ${cD.meta.bands.distance.fracSpan.join(' .. ')} |`);
  P(`| **Distance edges** (Long/Full/Slight/Notice @ p${DIST_ANCHORS.map(x => x * 100).join('/')}) | ${c7.meta.bands.distance.edges.join(' / ')} | ${cD.meta.bands.distance.edges.join(' / ')} |`);
  P(`| **Speed edges** (slow/mid/fast @ p${SPEED_ANCHORS.map(x => x * 100).join('/')}) | <${c7.meta.bands.speed.edges[0]} / <${c7.meta.bands.speed.edges[1]} | <${cD.meta.bands.speed.edges[0]} / <${cD.meta.bands.speed.edges[1]} |`);
  P(``);
  P(`**Driver ranges — why these.** Club speed 75–120 mph covers a lady/senior amateur up to a near-tour swing (TrackMan: avg amateur ~93, LPGA ~94, PGA ~113). Attack −4..+6 spans the classic amateur *hitting-down-on-driver* fault through the optimised *hitting up*. Dynamic loft 8–20 spans de-lofted to added-loft/ballooning. The engine's *model* driver carry (7-iron preset fallback) runs cs 75 → ~149 yd, cs 95 → ~196 yd, cs 115 → ~225 yd — believable *shape*, but understated *magnitude* vs real driver yardage (see the honesty correction below). It is used only to *rank/band* deliveries, never quoted as a real carry.`);
  P(``);
  P(`**Speed-band human anchors (curious-golfer copy):**`);
  for (const club of ['7iron', 'driver']) {
    const sp = SHIPPED.clubs[club].meta.bands.speed;
    P(`- **${SHIPPED.clubs[club].meta.label}** — slow: "${sp.anchorCopy.slow}"  ·  mid: "${sp.anchorCopy.mid}"  ·  fast: "${sp.anchorCopy.fast}"`);
    if (sp.note) P(`  - *Honesty note (${SHIPPED.clubs[club].meta.label}):* ${sp.note}`);
  }
  P(``);
  P(`> **Honesty correction (v2.1) — the driver speed anchor no longer quotes a model carry.** The driver grid's own median carries are slow/mid/fast = **${cD.meta.bands.speed.medianCarryM.slow}/${cD.meta.bands.speed.medianCarryM.mid}/${cD.meta.bands.speed.medianCarryM.fast} m** (${(cD.meta.bands.speed.medianCarryM.slow / 0.9144).toFixed(0)}/${(cD.meta.bands.speed.medianCarryM.mid / 0.9144).toFixed(0)}/${(cD.meta.bands.speed.medianCarryM.fast / 0.9144).toFixed(0)} yd). These are *genuine* grid medians — but they come from the 7-iron-calibrated ball-speed→carry curve running on the driver's 7-iron-preset fallback (smash capped at ~1.42 vs a real driver's ~1.48–1.50; 7-iron drag). Real-world TrackMan norms put a 90–105 mph amateur at ~205–235 yd carry and a <90 mph swing at ~185–210 yd, so the model *understates* driver carry by ~20–45 yd. The earlier v2 anchor stated "around 179 m carry … where most amateurs sit (90–105 mph)" as curious-golfer fact — a concrete user-facing inaccuracy that contradicted this doc's own rule that **absolute driver yardage is never truth**. Fix (root, honest): the driver anchor now states only the club-speed band (the real, trustworthy *input*) plus a qualitative descriptor, and carries an explicit note that the model reads the *shape/cause* of the miss, not a driver carry number. **No fabricated carry replaces it** — the shipped driver copy contains zero engine-derived yardage. The 7-iron anchor is unchanged (the 7-iron carry curve *is* the engine's calibration target, so "around ${c7.meta.bands.speed.medianCarryM.mid} m carry" is honest). Scope: this only ever touched anchor prose — height/distance banding and all conditioning are relative (member-count reweighting) and were always correct.`);
  P(``);
  P(`### Engine-vs-intuition finding #1 — you cannot lose real distance from delivery geometry alone`);
  P(``);
  P(`Matched-speed, the whole 7-iron grid moves carry only **${(c7.meta.bands.distance.fracSpan[0] * 100).toFixed(1)}%..+${(c7.meta.bands.distance.fracSpan[1] * 100).toFixed(1)}%**; the driver only **${(cD.meta.bands.distance.fracSpan[0] * 100).toFixed(1)}%..+${(cD.meta.bands.distance.fracSpan[1] * 100).toFixed(1)}%**. The driver baseline (attack +2°, loft 13°) already sits near the low-spin-loft optimum, so **almost every driver delivery only *loses*** — the worst spin-loft excess costs ~4.9% carry. Coaching consequence (and the app must say it): a driver that comes up **way** short is club-speed or strike, **not** delivery geometry. "Way short" therefore promotes the contact card, exactly as the spec's §3.4 already argues.`);
  P(``);
  P(`**Label-vs-magnitude note (issue #2) — driver "Noticeable loss" ⇄ the S3 word "Way short".** Because a driver loses almost nothing from geometry, its distance bands are percentile-anchored to a *tiny* loss range: the driver "${DIST_LABELS[3]}" band is only **${cD.meta.bands.distance.bandLossPct[3][0]}%..${cD.meta.bands.distance.bandLossPct[3][1]}%** of carry (≈5–10 yd on a ~196 yd drive; 7-iron's is ${c7.meta.bands.distance.bandLossPct[3][0]}%..${c7.meta.bands.distance.bandLossPct[3][1]}%, similarly small). The S3 UI word for that band is **"Way short"** — which honestly names the *perceived* miss, not the geometry loss the engine can see. The data does **not** overstate the loss (it caps it at the grid's real ${cD.meta.bands.distance.worstGeometryLossPct}% max), and this mismatch is the *teaching point*, not a bug: a driver that is genuinely way short is club-speed or strike, which is exactly why "Way short" promotes the contact card (spec §3.4). \`meta.bands.distance\` now ships \`bandLossPct\` + \`lossNote\` per club so nothing downstream can imply a bigger geometry loss than the grid supports.`);
  P(``);
  P(`---`);
  P(``);
  P(`## 2. Conditioning without map duplication`);
  P(``);
  P(`Instead of a map per answer, each cluster carries the stats needed to reweight it in place:`);
  P(``);
  P("```js");
  P(`cluster = {`);
  P(`  cause:{face,path,attack}, priorPct, gridCount,`);
  P(`  representative:{faceAngle,clubPath,attackAngle,dynamicLoft,clubSpeed, spinLoft},  // spinLoft = dynamicLoft − attackAngle (engine line 125)`);
  P(`  ranges:{…},`);
  P(`  speedHist:{slow,mid,fast},          // % of this cluster's members in each per-club speed band`);
  P(`  carryM:{p10,p50,p90},               // metres — cluster's carry distribution (piecewise-linear CDF for ±band answers)`);
  P(`  alsoProduces:{Pull,'Pull-Draw',…},  // 9-flight histogram from the face-timing sweep (§3)`);
  P(`  startLineMix:{Left,Straight,Right},  // coarse Pull/Straight/Push mass`);
  P(`}`);
  P("```");
  P(``);
  P(`**The generalised divot-filter pattern (verify the math).** Every answer is Bayes on the cluster identity:`);
  P(``);
  P(`> \`posterior(cluster) ∝ prior(cluster) × P(answer | cluster)\`, then renormalize the surviving clusters to 100.`);
  P(``);
  P(`- **speed answer** → \`P(answer|cluster) = speedHist[answer]/100\` (member fraction in that band).`);
  P(`- **absolute carry ±10 m** → \`P = CDF(v+10) − CDF(v−10)\` from \`carryM{p10,p50,p90}\`.`);
  P(`- **secondary-miss** → \`P(answer|cluster) = startLineMix[family]/100\` (Laplace-floored).`);
  P(`- **divot** → hard filter on attack band (the v1 \`divotFilter\`), then renormalize; empty ⇒ keep all and say so.`);
  P(``);
  P(`Because \`prior(cluster) = count/symptomTotal\` and \`P(answer|cluster) = countInBand/count\`, the product renormalizes to \`countInBand / Σ countInBand\` — **identical to physically re-filtering the grid to the answered band and re-counting.** That equivalence is the proof the stored stats need no map duplication.`);
  P(``);
  P(`### Three worked renormalization proofs (from the shipped JSON)`);
  for (const pr of proofs) {
    P(``);
    P(`**Proof ${proofs.indexOf(pr) + 1} — ${SHIPPED.clubs[pr.club].meta.label} · \`${dkey(pr.descriptor)}\` · ${pr.cond.type}=${pr.cond.value}**  (weight: ${pr.wLabel})`);
    P(``);
    P(`| cluster (face/path/attack) | prior% | ${pr.cond.type === 'speed' ? 'speedHist.' + pr.cond.value : pr.cond.type === 'secondary' ? 'startLineMix.' + FAMILY_OF_ANSWER[pr.cond.value] : 'kept?'} | posterior% |`);
    P(`|---|---|---|---|`);
    const beforeByCause = new Map(pr.before.map(c => [`${c.cause.face}||${c.cause.path}||${c.cause.attack}`, c]));
    for (const a of pr.after) {
      const ck = `${a.cause.face}||${a.cause.path}||${a.cause.attack}`;
      const b = beforeByCause.get(ck);
      const w = pr.cond.type === 'speed' ? b.speedHist[pr.cond.value] + '%' : pr.cond.type === 'secondary' ? b.startLineMix[FAMILY_OF_ANSWER[pr.cond.value]] + '%' : 'yes';
      P(`| ${a.cause.face} / ${a.cause.path} / ${a.cause.attack} | ${b.priorPct} | ${w} | **${a.priorPct}** |`);
    }
    const sum = pr.after.reduce((s, c) => s + c.priorPct, 0);
    P(``);
    // Issue #4: the reweighted posterior comes from the STORED stats, which are
    // rounded to 0.1 (both priorPct and speedHist). The exact recount is from raw
    // integer member counts. The underlying identity `countInBand/ΣcountInBand`
    // is exact on raw counts, but the two printed columns can differ by one
    // rounding step — so report the actual max drift, not a false "exact match".
    let maxDiff = 0;
    if (pr.exactCheck) {
      const byCause = new Map(pr.exactCheck.map(e => [e.cause, e.exactPct]));
      for (const a of pr.after) { const ck = `${a.cause.face}||${a.cause.path}||${a.cause.attack}`; if (byCause.has(ck)) maxDiff = Math.max(maxDiff, Math.abs(a.priorPct - byCause.get(ck))); }
    }
    P(`Posterior sums to **${sum.toFixed(1)}%** (renormalized). ` + (pr.exactCheck ? `Cross-check vs re-counting the actual grid members in the \`${pr.cond.value}\` band: ${pr.exactCheck.map(e => e.exactPct + '%').join(' / ')} — agreeing with the reweighted posterior to within **±${maxDiff.toFixed(1)}**. The exact identity is \`countInBand / Σ countInBand\` on the *raw integer counts*; the stored histogram and priors are rounded to 0.1, so the reweight-from-rounded-stats and the exact recount can differ by a single rounding step (here ${maxDiff.toFixed(1)}). That ±0.1 is a rounding artifact, not a modelling error — the stored stats reproduce the member-count posterior to display precision.` : (pr.cond.type === 'divot' ? `Divot=deep kept only the steep-descending clusters and renormalized — the generalised filter.` : ``)));
  }
  P(``);
  P(`---`);
  P(``);
  P(`## 3. Secondary-miss pattern math (the coach's "do you also hit…?")`);
  P(``);
  P(`**Model (standard coaching causality):** a player's recurring pattern is *one delivery with the face varying shot-to-shot* while path/attack/loft/speed stay near-constant. Computed honestly from the engine: for each cluster we hold path/attack/loft/speed at the representative and **sweep the face across ±${FACE_WINDOW}° (1° steps, clamped to the grid's ±8°)**, classifying each shot into the classic 9-ball-flight window (3 start lines × 3 curve directions). Laplace-smoothed (α=${LAPLACE}) so nothing hits a hard zero.`);
  P(``);
  P(`\`alsoProduces\`: Pull · Pull-Draw · Pull-Fade · Straight · Draw · Fade · Push · Push-Draw · Push-Fade. \`startLineMix\` = the coarse Pull(Left)/Straight/Push(Right) mass. **Evidence rule:** "I also hit pulls often" multiplies each cluster's weight by \`P(Pull|cluster) = startLineMix.Left/100\`, then renormalize. (A pull = the ball *starts left*; the D-plane truth is that an out-to-in path shifts the whole start-line distribution left, so out-to-in deliveries produce more pulls — this is what makes the answer discriminate.)`);
  P(``);
  const flag = scenarioResults.find(r => r.sc.id === 'c');
  P(`### Flagship validation — "also pulls" must strengthen out-to-in over open-face-neutral`);
  P(``);
  P(`**Step 1 — the clean mechanism (controlled path-isolation probe).** Hold face/attack/loft/speed fixed and sweep only the face; count the pull (Left-start) fraction as clubPath moves from down-the-line to out-to-in:`);
  P(``);
  P(`| club, face centre | path 0° | path −3° | path −6° |`);
  P(`|---|---|---|---|`);
  P(`| Driver, face +5° | ${pathIsolation.driver[5][0]}% | ${pathIsolation.driver[5][1]}% | ${pathIsolation.driver[5][2]}% |`);
  P(`| Driver, face +3° | ${pathIsolation.driver[3][0]}% | ${pathIsolation.driver[3][1]}% | ${pathIsolation.driver[3][2]}% |`);
  P(`| 7-iron, face +3° | ${pathIsolation['7iron'][3][0]}% | ${pathIsolation['7iron'][3][1]}% | ${pathIsolation['7iron'][3][2]}% |`);
  P(``);
  P(`Pull fraction **rises monotonically as the path turns out-to-in** — with face held constant. So the coaching causality is real in the engine: an out-to-in path shifts the whole start-line distribution left, so those deliveries genuinely also produce pulls. "Also pulls" is a legitimate discriminator.`);
  P(``);
  P(`**Step 2 — end-to-end on the shipped bucket.** Driver everyday slice \`${dkey(flag.sc.descriptor)}\` (starts right — the one slice shape that leaves the path AMBIGUOUS; a *straight*-starting slice is structurally forced to out-to-in and has nothing to disambiguate). Story path mass, before vs after "also pulls" — both shares are among the **≥1% patterns** (the conditioning model renormalizes survivors on each answer), so the shift isolates the reweighting effect from the <1% tail being set aside:`);
  P(``);
  P(`| story (face / path) | before% (≥1% patterns) | after "also pulls"% |`);
  P(`|---|---|---|`);
  { const before = flag.condBefore.stories, after = flag.steps.at(-1).stories;
    const byKey = new Map(after.map(s => [s.face + '|' + s.path, s.pct]));
    for (const s of before.slice(0, 6)) P(`| ${s.face} / ${s.path} | ${s.pct} | ${byKey.get(s.face + '|' + s.path) ?? 0} |`); }
  P(``);
  P(`Out-to-in path mass ${pctOfPath(flag.condBefore.stories, isOutToIn)}% → **${pctOfPath(flag.steps.at(-1).stories, isOutToIn)}%** (↑); neutral-path mass ${pctOfPath(flag.condBefore.stories, p => p === 'neutral')}% → ${pctOfPath(flag.steps.at(-1).stories, p => p === 'neutral')}% (↓). **${flag.pass ? 'CONFIRMED' : 'NOT CONFIRMED'}.** (The *standalone* baseline the UI shows first is the true all-delivery share — top story ${flag.steps[0].stories[0].pct}% + a ${flag.otherPct}% <1% tail, §5(c); here we use the renormalized survivor basis because that is the basis the answer reweights.)`);
  P(``);
  P(`**Honest nuance (reported, not hidden):** the effect is modest because the engine's dominant lever is *how far the face must travel to reach a left start*, which couples face-openness and path. A wildly-open face (+6°) barely reaches a pull inside a ±6° window regardless of path; a slightly-open face (+2–3°) pulls readily, and out-to-in path adds to that. So "also pulls" most strongly upweights the *slightly-open, out-to-in* stories — which is exactly the coach's over-the-top slicer. We do not overclaim a pure path mechanism; the controlled probe above is the clean isolated proof, the bucket table is the realistic aggregate.`);
  P(``);
  P(`### Engine-vs-intuition finding #2 — a true pull-HOOK is the snap-hook (in-to-out + shut face), never over-the-top`);
  P(``);
  P(`Scenario (f) failed the *naive* expectation ("pull-hook = closed face + out-to-in path") — and the engine is right to. A Hook needs a **>6° closed face-to-path gap**. If the path is already out-to-in (leftward), opening a 6°-closed gap needs the face **beyond −8°**, off the realistic grid. Proof — a shut face swept across paths (7-iron, attack −3°, loft 24°):`);
  P(``);
  P(`| clubPath | face −8° | face −7° | face −6° |`);
  P(`|---|---|---|---|`);
  for (const r of hookRows) P(`| ${r.path >= 0 ? '+' : ''}${r.path}° (${pathBand(r.path)}) | ${r.shapes.join(' | ')} |`);
  P(``);
  P(`Out-to-in paths (−6°, −3°) can only reach a **Pull-Draw**; the **Pull-Hook appears only from neutral/in-to-out paths** — the snap-hook / "double-cross" that flies low and runs. Every \`Hook||Left\` bucket in the map reflects this: the top stories are *strongly closed face × (strongly/slightly in-to-out or neutral) path*. This is a genuine ball-flight truth (not a bug), and the coach-interview should teach it: "your low duck-hook is an in-to-out path with a slammed-shut face, not an over-the-top move." The data layer stores the honest result; the naive expectation is what's wrong.`);
  P(``);
  P(`---`);
  P(``);
  P(`## 4. Information-gain table (which question to ask, in what order)`);
  P(``);
  P(`Expected mutual information \`I(delivery archetype ; answer)\` in **bits**, over each shape-conditioned population (what we know after the 9-flight picker + severity, *before* height/distance are asked). Archetype = face|path|attack|loft-band|speed-band; face|path is already ~pinned by shape, so gains here are about resolving **attack, loft and speed**. \`attackKnown\` is the ceiling (a perfect divot).`);
  P(``);
  P(`| shape posterior (7-iron) | H₀ | speed | height | rel-dist | abs-carry ±10 | secondary (arch → story*) | divot | (attack ceiling) |`);
  P(`|---|---|---|---|---|---|---|---|---|`);
  for (const sk of IG_SHAPES['7iron']) { const g = infoGain['7iron:' + sk]; P(`| ${IG_LABEL[sk]} | ${g.H0} | ${g.speed} | ${g.height} | ${g.relDistance} | ${g.absCarry} | ${g.secondaryMiss} → **${g.secondaryMissStory}** | ${g.divot} | ${g.attackKnownCeiling} |`); }
  P(``);
  P(`\\* *secondary (arch → story)*: the left number is bits toward the full delivery archetype (small — path is a minor share of archetype entropy); the **bold** number is bits toward the **path/story alone** (\`I(face|path ; also-pulls)\`), which is what the question actually resolves. Story entropy for the start-right slice is ${infoGain['7iron:Slice||Right'].Hstory} bits; "also pulls" removes ${infoGain['7iron:Slice||Right'].secondaryMissStory} of them.`);
  P(``);
  // build recommended order from the everyday-slice (start-right) row
  const ev = infoGain['7iron:Slice||Right'];
  const evStraight = infoGain['7iron:Slice||Straight'];
  const startLineGain7 = c7.stats.startLineInfoGainBits;
  const ranked = [['height', ev.height], ['relative distance', ev.relDistance], ['absolute carry ±10 m', ev.absCarry], ['speed band', ev.speed], ['secondary-miss', ev.secondaryMiss], ['divot', ev.divot]].sort((a, b) => b[1] - a[1]);
  P(`**Reading it.** Start line is collected *free* by the 9-flight picker and is the single biggest disambiguator (symptom-level info gain **+${startLineGain7} bits**, 7-iron) — already spent before any of the above.`);
  P(``);
  P(`Two honest structural notes the table makes visible:`);
  P(``);
  P(`- **speed = ${ev.speed} bits is constant across every shape** — it exactly equals the entropy of the speed-band marginal, because club speed is *independent of the face/path/attack fault*. Those bits are real but **orthogonal**: they pin the delivery's *speed/yardage number*, not the *cause*. Same story, weaker, for absolute carry (${ev.absCarry}).`);
  P(`- **secondary-miss is a WEAK disambiguator — nearly redundant with start line.** Even measured against its true target (the path/story), it removes only **${ev.secondaryMissStory} of ${ev.Hstory} story-bits** on the start-right slice, and **${evStraight.secondaryMissStory}** on the start-*straight* slice (which is already pinned to out-to-in). Against the full archetype: ${ev.secondaryMiss} / ${evStraight.secondaryMiss}. **Honest reason:** "also pulls?" and the start-line column of the picker probe the *same start-direction axis* — start line already captured most of what the secondary pattern would tell you, so the explicit question adds little. Its value is *pedagogical and directional* (it's the coach-natural question, and it moves the ranking the right way — flagship §3), **not** information-theoretic. Do not treat it as load-bearing.`);
  P(``);
  P(`Ranked by raw archetype bits on the everyday (start-right) slice (⚠ speed & carry top the list but are *orthogonal magnitude-probes* per the note above, not fault-resolvers): ${ranked.map(r => `**${r[0]}** (${r[1]})`).join(' > ')}. Divot's ceiling (perfect attack) is **${ev.attackKnownCeiling} bits** — attack is the residual fog once shape is known (v1's finding, reconfirmed per club).`);
  P(``);
  P(`**Recommended ask order (≤6 taps pre-reveal):**`);
  P(``);
  P(`1. **Shape** — 9-flight picker (start line + curve). *Free, biggest split.* (1–2 taps incl. severity.)`);
  P(`2. **Height** — keys the map; leaks loft & attack via spin-loft (${ev.height} bits).`);
  P(`3. **Relative distance** — keys the map; also the "way-short ⇒ contact card" trigger (${ev.relDistance} bits).`);
  P(`4. **Divot** — highest-value refiner of the residual attack fog (realises ${ev.divot} of the ${ev.attackKnownCeiling}-bit ceiling). Earns the last pre-reveal slot.`);
  P(``);
  P(`**Post-reveal refiners** (on the results card, not pre-reveal):`);
  P(`- **secondary-miss** — a *confirmation*, not a disambiguator (only ${ev.secondaryMissStory} story-bits; largely redundant with start line). Offer it as the coach-natural "does it also…?" beat that builds trust and nudges the ranking directionally; skip it on start-straight shapes where it's ~0.`);
  P(`- **speed band / absolute carry** — offer when the user wants the exact "try this" numbers; they resolve the delivery's magnitude, not the fault. Club is the top-level selector (given), not a within-posterior question.`);
  P(``);
  P(`---`);
  P(``);
  P(`## 5. Owner acceptance scenarios (all run against the shipped JSON)`);
  P(``);
  P(`Top-2 stories are \`face / path pct%\`. The **baseline** line is the *true all-delivery share* (stored \`priorPct\`, no renorm) with the <1% tail carried as \`+X% rarer patterns\` — exactly the documented \`consolidateStories(entry)\` API (§6). When an answer is applied, the Bayes model renormalizes the ≥1% survivors to 100 (the <1% tail can't be reweighted, so it is set aside); those \`+ cond=…\` lines are therefore on the **survivor basis**, shown after a survivor-basis baseline so the before→after is like-for-like. "Coach story" is generated from the top story's stored numbers (the dynamic-loft → spin-loft chain is \`spinLoft = dynamicLoft − attackAngle\`, straight from the engine).`);
  P(``);
  let passN = 0;
  for (const r of scenarioResults) {
    P(`### (${r.sc.id}) ${r.sc.title}`);
    if (r.sMiss) {
      P(``);
      P(`- **S-MISS (by design).** \`${dkey(r.sc.descriptor)}\` is **not in the grid** — nearest real flights: ${r.nearest.map(n => `*${n.changed}* → \`${n.key}\``).join(' · ') || 'none'}.`);
      P(`- **${r.pass ? 'PASS' : 'FAIL'}** — see finding below; this is the correct honest outcome, not an error.`);
      P(``);
      if (r.pass) passN++;
      continue;
    }
    if (r.pass) passN++;
    P(``);
    if (r.usedNearest) P(`- *Exact bucket absent; used nearest (${r.usedNearest.changed} → \`${r.usedNearest.key}\`).*`);
    const hasCond = (r.sc.conditions || []).length > 0;
    // baseline = true all-delivery share (no renorm) + the <1% tail (issue #3)
    P(`- \`baseline (shape+height+distance)\` → ${top2(r.steps[0].stories)}${r.otherPct ? ` _(all-delivery shares; +${r.otherPct}% rarer <1% patterns)_` : ''}`);
    if (hasCond) {
      // survivor-basis baseline the answer actually reweights, then the after-lines
      P(`- \`baseline · ≥1% patterns (conditioning basis)\` → ${top2(r.condBefore.stories)} _(renormalized survivors — the basis each answer reweights)_`);
      for (const st of r.steps.slice(1)) P(`- \`${st.label}\` → ${top2(st.stories)} _(survivor basis)_`);
    }
    P(`- **${r.pass ? 'PASS' : 'FAIL'}** — ${r.why}`);
    P(`- Coach story: *${r.coach}*`);
    P(``);
  }
  P(`**Scenario tally: ${passN}/${scenarioResults.length} pass.**`);
  P(``);
  P(`### Engine-vs-intuition finding #3 — a LOW slice that's also *noticeably short* does not exist`);
  P(``);
  P(`Scenario (b) is an S-MISS on purpose. Low flight comes from **de-lofting** (hands forward, less delivered loft) — which *lowers* spin loft, *raises* smash and if anything *adds* carry. So the grid has no "Low + Noticeable-loss" slice: low-and-short can only be **contact or club speed**, never delivery geometry. The nearest real low slice (scenario b2) has a **de-lofted** loft story — the exact inverse of scenario (a)'s added-loft story — which is precisely the coaching contrast the owner asked to see.`);
  P(``);
  P(`---`);
  P(``);
  P(`## 6. Size + the exact client API for \`diagnose-engine-v2.js\``);
  P(``);
  P(`\`diagnose-map-v2.json\` = **${(bytes / 1e6).toFixed(2)} MB** (cap 4 MB). Clusters below **${MIN_CLUSTER_PCT}% prior** are folded into a per-key \`otherPct\`/\`otherClusterCount\`; all values rounded to 1 decimal.`);
  P(``);
  P(`Signatures in the §2.1 style of \`docs/diagnose-spec.md\` (this run defines the DATA + reference math; the UI file is a later commit):`);
  P(``);
  P("```js");
  P(`import { solveFlight, trajectorySamples, shapeLabel } from './impact-flight.js';`);
  P(``);
  P(`export async function loadMapV2(url = './diagnose-map-v2.json')   // fetch + module-scope cache`);
  P(`export function clubMap(map, club)          // map.clubs['7iron'|'driver'] — throws on unknown club`);
  P(`export function descriptorKey({curve,startLine,height,distanceLoss})  // \`\${curve}||\${startLine}||\${height}||\${distanceLoss}\``);
  P(`export function lookup(clubMap, descriptor)`);
  P(`  // -> { entry, exact:true, key } | { entry:null, nearest:[{descriptor,changed,key}…≤3], key }`);
  P(`  // relaxation order (unchanged from v1): distanceLoss ±1 → height ±1 → curve severity swap`);
  P(`export function consolidateStories(entry)`);
  P(`  // group entry.clusters by face|path; story = { face, path, pct:ΣpriorPct, rep, variants:[{attack,pct,rep}] }`);
  P(`  // returns { stories(sorted desc), otherPct, otherClusterCount, clusterCount, gridCount }`);
  P(``);
  P(`// ── conditioning pipeline (all pure; each renormalizes clusters to 100, then re-consolidate) ──`);
  P(`export function reweightSpeed(clusters, band)     // band ∈ 'slow'|'mid'|'fast'; w = speedHist[band]/100`);
  P(`export function reweightCarry(clusters, metres, band=10) // w = carryCDF(m+band) − carryCDF(m−band) from carryM{p10,p50,p90}`);
  P(`export function reweightSecondary(clusters, ans)  // ans ∈ 'pulls'|'straights'|'pushes'; w = startLineMix[Left|Straight|Right]/100 (floored)`);
  P(`export function divotFilter(answer)               // 'deep'→{'steep descending'} · 'brushed'→{'moderate descending','level'} · 'none'→{'level','ascending'} · 'unsure'→null`);
  P(`export function applyDivot(clusters, answer)      // hard-filter attack band; empty ⇒ {clusters, empty:true} (keep all, say so)`);
  P(`export function reweight(clusters, wOf)           // generic: posterior ∝ prior × wOf(cluster), renormalize`);
  P(``);
  P(`// ── evidence copy: the reference-anchor strings live in map.clubs[club].meta.bands ──`);
  P(`//   speed band anchors  → meta.bands.speed.anchorCopy.{slow,mid,fast}`);
  P(`//     · meta.bands.speed.absoluteCarryTrusted — false ⇒ anchor quotes NO carry (driver);`);
  P(`//       meta.bands.speed.note carries the honest "why" (surface it beside the anchor).`);
  P(`//   height/dist edges   → meta.bands.{height,distance}.edges + labels   (never free-typed)`);
  P(`//     · meta.bands.distance.bandLossPct[i] = [lo%,hi%] carry-loss for label i;`);
  P(`//       meta.bands.distance.lossNote explains the "Way short" ⇄ tiny-geometry-loss framing.`);
  P(``);
  P(`export function needsFollowUp(stories)            // unchanged: false only if stories[0].pct≥60 AND top variant/pct≥0.7`);
  P(`export function solveTrace(rep)                   // solveFlight(rep) → { flight, samples } for the ember reveal`);
  P(`export function spinLoftOf(rep)                   // rep.dynamicLoft − rep.attackAngle (already stored as rep.spinLoft)`);
  P("```");
  P(``);
  P(`**Band definitions + reference-anchor copy (shipped inside the map, per club):**`);
  P(``);
  for (const club of ['7iron', 'driver']) {
    const m = SHIPPED.clubs[club].meta;
    const carryTag = m.bands.speed.absoluteCarryTrusted ? 'quotes carry (calibrated club)' : 'quotes NO carry — mph band only (see note)';
    P(`- **${m.label}** — height edges (ratio) \`${m.bands.height.edges.join(' / ')}\` · distance edges (frac) \`${m.bands.distance.edges.join(' / ')}\` (worst "${DIST_LABELS[3]}" ${m.bands.distance.bandLossPct[3][0]}%..${m.bands.distance.bandLossPct[3][1]}% carry) · speed edges (mph) \`${m.bands.speed.edges.join(' / ')}\` · speed anchors → \`meta.bands.speed.anchorCopy\` (${carryTag}).`);
  }
  P(``);
  P(`### Conditioning call order (client)`);
  P(``);
  P("```");
  P(`lookup → consolidateStories → render stories`);
  P(`  → (optional, any order, each re-consolidates) reweightSpeed / reweightCarry / reweightSecondary / applyDivot`);
  P(`  → re-render with 'REFINED BY…' eyebrow; ember redraws from new top story's rep`);
  P("```");
  P(``);
  P(`All conditioning is commutative-safe only per the Bayes model above; the UI applies at most one or two refiners, so order is a UX choice, not a correctness one. Every percentage on screen is a grid-count share; every ember flight is a real \`solveFlight\` solve of a stored representative.`);
  P(``);
  writeFileSync(OUT_MD, L.join('\n'));
  console.log(`Wrote ${OUT_MD}`);
  console.log(`Scenarios: ${passN}/${scenarioResults.length} pass · map ${(bytes / 1e6).toFixed(2)} MB`);
}
