/**
 * DIAGNOSE-HARNESS — numerical foundation for "Diagnose my shot" reverse
 * diagnosis. Grid-searches impact-flight.js's solveFlight() over realistic
 * amateur delivery ranges, classifies every result into the DESCRIPTORS a
 * curious golfer would actually use (shape, height, distance-loss, start
 * line), then inverts that map: descriptor-tuple -> the delivery regions
 * (CAUSE CLUSTERS) that produce it, ranked by how much of the grid they cover
 * (a volume-based prior / relative likelihood).
 *
 * Pure read of impact-flight.js — never edits it. Run with:
 *   node tools/diagnose-harness.mjs
 * Writes ../diagnose-map.json (repo root) and prints a findings summary.
 *
 * ── Why these bins, in one paragraph ────────────────────────────────────────
 * solveFlight's own math shows shape (curve + start line) is a pure function
 * of faceAngle & clubPath — attackAngle/dynamicLoft/clubSpeed never appear in
 * startDirection or spinAxis. So shape descriptors can only ever narrow
 * face/path; height & distance-loss (which DO depend on attack/loft/speed via
 * launchAngle -> apex/carry) are the only descriptors that touch the other
 * three inputs. That split drives every decision below: cause-cluster keys
 * for shape-only symptoms use (faceBand, pathBand); once height and
 * distance-loss are added to the symptom, attackBand joins the key too
 * (dynamicLoft/clubSpeed are reported as representative numbers, not key
 * dimensions — see findings for why they stay under-constrained).
 */

import { solveFlight } from '../impact-flight.js';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '../diagnose-map.json');

// ── Grid ranges (amateur-realistic, 7-iron — the only calibrated club in
// impact-flight.js's CLUBS table; driver is a TODO stub there, so a
// "per-club" range for now just means "the 7-iron's own believable band").
const CLUB = '7iron';
const range = (min, max, step) => {
  const out = [];
  for (let v = min; v <= max + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
  return out;
};
const CLUB_SPEEDS = range(60, 110, 5);   // 11 — bogey-golfer to strong-amateur 7i speed
const FACE_ANGLES = range(-8, 8, 1);     // 17 — well past "obvious miss" both ways
const CLUB_PATHS = range(-8, 8, 1);      // 17
const ATTACK_ANGLES = range(-6, 4, 1);   // 11 — steep chunk to scooping-up thin
const DYN_LOFTS = range(18, 34, 2);      // 9  — de-lofted (hands forward) to scooped/added

// ── "Well-struck baseline" per club speed — the single reference every combo
// is compared against for height/distance-loss. Fixed, not re-optimized per
// speed, because "well-struck" for a 7-iron has a known real shape (square,
// ~-3deg descending, ~28deg delivered loft) — searching for whatever
// maximizes carry in the grid would pick unrealistic loft/attack outliers
// and call THAT "well-struck", which it isn't.
const BASELINE_FACE = 0, BASELINE_PATH = 0, BASELINE_ATTACK = -3, BASELINE_LOFT = 28;
const baselineCache = new Map();
function baselineFor(clubSpeed) {
  if (!baselineCache.has(clubSpeed)) {
    baselineCache.set(clubSpeed, solveFlight({
      clubSpeed, faceAngle: BASELINE_FACE, clubPath: BASELINE_PATH,
      attackAngle: BASELINE_ATTACK, dynamicLoft: BASELINE_LOFT, club: CLUB,
    }));
  }
  return baselineCache.get(clubSpeed);
}

// ── Band classifiers (human-meaningful, named the way a coach would say them) ─
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
function speedBand(speed) {
  if (speed < 80) return 'slow';
  if (speed < 95) return 'mid';
  return 'fast';
}

// startLine from startDirection using the SAME threshold impact-flight.js's
// own shapeLabel() uses internally (1.5deg) — reuse the number, not a guess.
const START_THRESHOLD = 1.5;
function startLineBand(startDirection) {
  if (startDirection > START_THRESHOLD) return 'Right';
  if (startDirection < -START_THRESHOLD) return 'Left';
  return 'Straight';
}

// curve + push/pull, parsed from the engine's OWN shapeLabel() output
// (flight.shape) so this never drifts from the single source of truth.
function parseShape(shapeStr) {
  const CURVES = ['Slice', 'Hook', 'Fade', 'Draw'];
  const curve = CURVES.find(c => shapeStr.includes(c)) || 'Straight';
  return curve;
}

// NOTE on thresholds below: they are CALIBRATED TO THIS ENGINE'S OWN ACHIEVABLE
// RANGE, not to golf-course intuition. A grid probe (see findings) showed
// apex/baseline-apex only spans ~0.74-1.21 across the whole amateur grid, and
// speed-normalized distance-loss only spans about -8.8%..+4.9% (carry is a
// function of ballSpeed ALONE — solveFlight has no launch-angle drag term —
// and ballSpeed's spinLoft-driven smash swing is narrow). Using "textbook"
// cutoffs (e.g. 30% = "severe") would leave those bands permanently empty and
// silently collapse the whole grid into one or two buckets. These cutoffs are
// percentile-informed (roughly quartile splits of the grid's own distribution)
// so all bands are meaningfully populated. This narrow range is itself a
// reported finding, not just a tuning detail — see findings summary.
function heightBand(ratio) {
  if (ratio < 0.85) return 'Low';
  if (ratio < 1.05) return 'Normal';
  if (ratio < 1.15) return 'High';
  return 'Ballooned';
}
function distLossBand(frac) {
  if (frac < -0.03) return 'Long (gained distance)';
  if (frac < 0.01) return 'Full (normal distance)'; // 0.01 not 0.00: keeps an exact-baseline (frac=0) shot inside "Full"
  if (frac < 0.02) return 'Slight loss';
  return 'Noticeable loss';
}

// ── Cluster aggregator: symptomKey -> Map(causeKey -> stats) ───────────────
function makeAgg() {
  return new Map();
}
function addSample(agg, symptomKey, causeKey, sample) {
  let bucket = agg.get(symptomKey);
  if (!bucket) { bucket = { total: 0, clusters: new Map() }; agg.set(symptomKey, bucket); }
  bucket.total++;
  let c = bucket.clusters.get(causeKey);
  if (!c) {
    c = {
      count: 0,
      sumFace: 0, sumPath: 0, sumAttack: 0, sumLoft: 0, sumSpeed: 0,
      minFace: Infinity, maxFace: -Infinity,
      minPath: Infinity, maxPath: -Infinity,
      minAttack: Infinity, maxAttack: -Infinity,
      minLoft: Infinity, maxLoft: -Infinity,
      minSpeed: Infinity, maxSpeed: -Infinity,
    };
    bucket.clusters.set(causeKey, c);
  }
  c.count++;
  c.sumFace += sample.face; c.sumPath += sample.path; c.sumAttack += sample.attack;
  c.sumLoft += sample.loft; c.sumSpeed += sample.speed;
  c.minFace = Math.min(c.minFace, sample.face); c.maxFace = Math.max(c.maxFace, sample.face);
  c.minPath = Math.min(c.minPath, sample.path); c.maxPath = Math.max(c.maxPath, sample.path);
  c.minAttack = Math.min(c.minAttack, sample.attack); c.maxAttack = Math.max(c.maxAttack, sample.attack);
  c.minLoft = Math.min(c.minLoft, sample.loft); c.maxLoft = Math.max(c.maxLoft, sample.loft);
  c.minSpeed = Math.min(c.minSpeed, sample.speed); c.maxSpeed = Math.max(c.maxSpeed, sample.speed);
}

function shannonEntropy(counts, total) {
  let h = 0;
  for (const n of counts) {
    if (n === 0) continue;
    const p = n / total;
    h -= p * Math.log2(p);
  }
  return h;
}

// ── Main grid pass ───────────────────────────────────────────────────────
// aggS1: PRIMARY inverse map — symptom = curve+startLine+height+distanceLoss,
//        cause key = faceBand|pathBand|attackBand. This is what ships in
//        diagnose-map.json.
// aggS0: symptom WITHOUT startLine (curve+height+distanceLoss only) — used
//        to measure startLine's information gain.
// aggS2: symptom = S1 + attackBand-as-known (i.e. "if contact feel could
//        perfectly reveal attack angle") — cause key = faceBand|pathBand
//        only. Used as a generous UPPER BOUND on what a contact-feel
//        question could ever buy the flight diagnosis (see decision below).
const aggS0 = makeAgg();
const aggS1 = makeAgg();
const aggS2 = makeAgg();

let n = 0;
const t0 = Date.now();
for (const clubSpeed of CLUB_SPEEDS) {
  const baseline = baselineFor(clubSpeed);
  for (const faceAngle of FACE_ANGLES) {
    for (const clubPath of CLUB_PATHS) {
      for (const attackAngle of ATTACK_ANGLES) {
        for (const dynamicLoft of DYN_LOFTS) {
          n++;
          const flight = solveFlight({ clubSpeed, faceAngle, clubPath, attackAngle, dynamicLoft, club: CLUB });

          const curve = parseShape(flight.shape);
          const startLine = startLineBand(flight.startDirection);
          const hRatio = flight.apex / baseline.apex;
          const height = heightBand(hRatio);
          const dFrac = (baseline.total - flight.total) / baseline.total;
          const distLoss = distLossBand(dFrac);

          const fBand = faceBand(faceAngle);
          const pBand = pathBand(clubPath);
          const aBand = attackBand(attackAngle);
          const lBand = loftBand(dynamicLoft);
          const sBand = speedBand(clubSpeed);

          const sample = { face: faceAngle, path: clubPath, attack: attackAngle, loft: dynamicLoft, speed: clubSpeed };

          // S0: no start line
          const symS0 = `${curve}||${height}||${distLoss}`;
          addSample(aggS0, symS0, `${fBand}||${pBand}||${aBand}`, sample);

          // S1: primary map (curve+startLine+height+distanceLoss)
          const symS1 = `${curve}||${startLine}||${height}||${distLoss}`;
          addSample(aggS1, symS1, `${fBand}||${pBand}||${aBand}`, sample);

          // S2: S1 + attackBand folded into the symptom (contact-feel ceiling)
          const symS2 = `${symS1}||attack:${aBand}||loft:${lBand}||speed:${sBand}`;
          addSample(aggS2, symS2, `${fBand}||${pBand}`, sample);
        }
      }
    }
  }
}
const elapsedMs = Date.now() - t0;

// ── Build the PRIMARY inverse map (from aggS1) ──────────────────────────────
const MAX_CLUSTERS_PER_SYMPTOM = 6;
const inverseMap = {};
for (const [symptomKey, bucket] of aggS1) {
  const clusters = [...bucket.clusters.entries()]
    .map(([causeKey, c]) => {
      const [fBand, pBand, aBand] = causeKey.split('||');
      return {
        cause: { face: fBand, path: pBand, attack: aBand },
        priorPct: +(100 * c.count / bucket.total).toFixed(2),
        gridCount: c.count,
        representative: {
          faceAngle: +(c.sumFace / c.count).toFixed(1),
          clubPath: +(c.sumPath / c.count).toFixed(1),
          attackAngle: +(c.sumAttack / c.count).toFixed(1),
          dynamicLoft: +(c.sumLoft / c.count).toFixed(1),
          clubSpeed: +(c.sumSpeed / c.count).toFixed(1),
        },
        ranges: {
          faceAngle: [c.minFace, c.maxFace],
          clubPath: [c.minPath, c.maxPath],
          attackAngle: [c.minAttack, c.maxAttack],
          dynamicLoft: [c.minLoft, c.maxLoft],
          clubSpeed: [c.minSpeed, c.maxSpeed],
        },
      };
    })
    .sort((a, b) => b.gridCount - a.gridCount)
    .slice(0, MAX_CLUSTERS_PER_SYMPTOM);
  const [curve, startLine, height, distLoss] = symptomKey.split('||');
  inverseMap[symptomKey] = {
    descriptor: { curve, startLine, height, distanceLoss: distLoss },
    gridCount: bucket.total,
    clusterCount: bucket.clusters.size,
    clusters,
  };
}

// ── Uniqueness / ambiguity stats over aggS1 ─────────────────────────────────
let uniqueBuckets = 0, mildBuckets = 0, ambiguousBuckets = 0;
let weightedUnique = 0, weightedMild = 0, weightedAmbiguous = 0, grandTotal = 0;
for (const bucket of aggS1.values()) {
  grandTotal += bucket.total;
  const k = bucket.clusters.size;
  if (k === 1) { uniqueBuckets++; weightedUnique += bucket.total; }
  else if (k <= 3) { mildBuckets++; weightedMild += bucket.total; }
  else { ambiguousBuckets++; weightedAmbiguous += bucket.total; }
}
const totalBuckets = aggS1.size;

// ── Information-gain style comparison: S0 (no start line) vs S1 (+ start
// line) vs S2 (+ start line + attack/loft/speed fully known, the contact-feel
// ceiling) ───────────────────────────────────────────────────────────────
function weightedAvgEntropy(agg) {
  let sumH = 0, sumW = 0;
  for (const bucket of agg.values()) {
    const counts = [...bucket.clusters.values()].map(c => c.count);
    const h = shannonEntropy(counts, bucket.total);
    sumH += h * bucket.total;
    sumW += bucket.total;
  }
  return sumW ? sumH / sumW : 0;
}
function weightedAvgClusterCount(agg) {
  let sumK = 0, sumW = 0;
  for (const bucket of agg.values()) {
    sumK += bucket.clusters.size * bucket.total;
    sumW += bucket.total;
  }
  return sumW ? sumK / sumW : 0;
}

const H_S0 = weightedAvgEntropy(aggS0);
const H_S1 = weightedAvgEntropy(aggS1);
const H_S2 = weightedAvgEntropy(aggS2);
const K_S0 = weightedAvgClusterCount(aggS0);
const K_S1 = weightedAvgClusterCount(aggS1);
const K_S2 = weightedAvgClusterCount(aggS2);

const startLineGainBits = H_S0 - H_S1;
const contactCeilingGainBits = H_S1 - H_S2;

// ── Spot-check classic shots ────────────────────────────────────────────────
const spotChecks = [
  { name: 'Slice', input: { clubSpeed: 85, faceAngle: 4, clubPath: -6, attackAngle: -3, dynamicLoft: 28 } },
  { name: 'Pull-hook', input: { clubSpeed: 90, faceAngle: -6, clubPath: 1, attackAngle: -3, dynamicLoft: 26 } },
  { name: 'Push', input: { clubSpeed: 90, faceAngle: 5, clubPath: 5, attackAngle: -3, dynamicLoft: 28 } },
  { name: 'Ballooned fade (weak/high, not a bladed "thin")', input: { clubSpeed: 80, faceAngle: 3, clubPath: -1, attackAngle: 3, dynamicLoft: 33 } },
  { name: 'Low hook', input: { clubSpeed: 90, faceAngle: -8, clubPath: 2, attackAngle: -6, dynamicLoft: 18 } },
  { name: 'Straight-but-short (steep attack robs distance, no shape fault)', input: { clubSpeed: 90, faceAngle: 0, clubPath: 0, attackAngle: -6, dynamicLoft: 30 } },
];
const spotResults = spotChecks.map(({ name, input }) => {
  const flight = solveFlight({ ...input, club: CLUB });
  const baseline = baselineFor(input.clubSpeed);
  const curve = parseShape(flight.shape);
  const startLine = startLineBand(flight.startDirection);
  const height = heightBand(flight.apex / baseline.apex);
  const distLoss = distLossBand((baseline.total - flight.total) / baseline.total);
  const symptomKey = `${curve}||${startLine}||${height}||${distLoss}`;
  const entry = inverseMap[symptomKey];
  const topCluster = entry && entry.clusters[0];
  return {
    name, input, engineShapeLabel: flight.shape, symptomKey,
    descriptor: { curve, startLine, height, distanceLoss: distLoss },
    topCause: topCluster ? topCluster.cause : null,
    topClusterPriorPct: topCluster ? topCluster.priorPct : null,
    representative: topCluster ? topCluster.representative : null,
    clusterCountForSymptom: entry ? entry.clusterCount : null,
  };
});

// ── Write output ─────────────────────────────────────────────────────────
const output = {
  meta: {
    generatedBy: 'tools/diagnose-harness.mjs',
    engine: 'impact-flight.js (solveFlight) — read-only, byte-identical',
    club: CLUB,
    gridDimensions: {
      clubSpeed: CLUB_SPEEDS, faceAngle: [FACE_ANGLES[0], FACE_ANGLES.at(-1)],
      clubPath: [CLUB_PATHS[0], CLUB_PATHS.at(-1)], attackAngle: [ATTACK_ANGLES[0], ATTACK_ANGLES.at(-1)],
      dynamicLoft: DYN_LOFTS,
    },
    totalCombos: n,
    baseline: { faceAngle: BASELINE_FACE, clubPath: BASELINE_PATH, attackAngle: BASELINE_ATTACK, dynamicLoft: BASELINE_LOFT, note: 'fixed reference per clubSpeed, not re-optimized' },
    generatedAt: new Date().toISOString(),
  },
  stats: {
    totalSymptomBuckets: totalBuckets,
    uniqueBuckets, mildBuckets, ambiguousBuckets,
    weightedUniquePct: +(100 * weightedUnique / grandTotal).toFixed(1),
    weightedMildPct: +(100 * weightedMild / grandTotal).toFixed(1),
    weightedAmbiguousPct: +(100 * weightedAmbiguous / grandTotal).toFixed(1),
    entropyBits: { withoutStartLine: +H_S0.toFixed(3), withStartLine: +H_S1.toFixed(3), withStartLinePlusAttackKnown: +H_S2.toFixed(3) },
    avgClusterCount: { withoutStartLine: +K_S0.toFixed(2), withStartLine: +K_S1.toFixed(2), withStartLinePlusAttackKnown: +K_S2.toFixed(2) },
    startLineInfoGainBits: +startLineGainBits.toFixed(3),
    contactFeelCeilingGainBits: +contactCeilingGainBits.toFixed(3),
  },
  spotChecks: spotResults,
  inverseMap,
};

// Compact (no pretty-print indent) per spec — this is a data file for the
// app/tooling to consume, not a hand-edited doc. ~180 symptom buckets x up to
// 6 clusters keeps it well under a MB even so.
writeFileSync(OUT_PATH, JSON.stringify(output));

// ── Console findings summary ────────────────────────────────────────────
console.log(`Grid: ${n} combos in ${elapsedMs}ms`);
console.log(`Symptom buckets: ${totalBuckets} (unique=${uniqueBuckets}, mild=${mildBuckets}, ambiguous=${ambiguousBuckets})`);
console.log(`Weighted by grid volume: unique=${output.stats.weightedUniquePct}% mild=${output.stats.weightedMildPct}% ambiguous=${output.stats.weightedAmbiguousPct}%`);
console.log(`Entropy (bits, lower=better): no-startLine=${H_S0.toFixed(3)}  +startLine=${H_S1.toFixed(3)}  +startLine+attack-known=${H_S2.toFixed(3)}`);
console.log(`Avg cause-clusters/bucket: no-startLine=${K_S0.toFixed(2)}  +startLine=${K_S1.toFixed(2)}  +startLine+attack-known=${K_S2.toFixed(2)}`);
console.log(`startLine info gain: ${startLineGainBits.toFixed(3)} bits | contact-feel ceiling gain: ${contactCeilingGainBits.toFixed(3)} bits`);
console.log('');
console.log('Spot-checks:');
for (const s of spotResults) {
  console.log(`- ${s.name}: engine="${s.engineShapeLabel}" descriptor=${JSON.stringify(s.descriptor)}`);
  console.log(`  top cause: ${JSON.stringify(s.topCause)} (${s.topClusterPriorPct}% of ${s.clusterCountForSymptom} clusters) rep=${JSON.stringify(s.representative)}`);
}
console.log('');
console.log(`Wrote ${OUT_PATH}`);
