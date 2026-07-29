// Derives every number for the data table "Same Carry, Different Ceiling — the Apex Window"
// (id: apex-window-equal-carry) straight from the frozen engine. No number is copied.
//
// Run:  node C:\Users\SkotvoldSivertSende\svingbue\outputs\agent-scan\gen-apex-window-equal-carry.mjs
//
// Grid: one constant spin-loft diagonal. dynamicLoft - attackAngle === 34 for every row,
// clubSpeed fixed at 95 mph, clubPath = faceAngle = 0 (engine defaults).

import { solveFlight } from 'file:///C:/Users/SkotvoldSivertSende/svingbue/impact-flight.js';
import { writeFileSync } from 'node:fs';

const OUT = 'C:\\Users\\SkotvoldSivertSende\\svingbue\\outputs\\agent-scan\\tabell-apex-window-equal-carry.json';

const SPIN_LOFT = 34;
const CLUB_SPEED = 95;
const LOFTS = [22, 28, 34, 40];          // grid exactly as ordered
const LOFTS_FIXED = [24, 28, 34, 40];    // same grid, first row lifted above the launch-efficiency knee

const r = (v, n = 2) => Number(v.toFixed(n));

const build = (dynamicLoft) => {
  const attackAngle = dynamicLoft - SPIN_LOFT;
  const f = solveFlight({ dynamicLoft, attackAngle, clubSpeed: CLUB_SPEED });

  // Domain / clamp detection (motor-api.md §4). The engine never says so itself.
  const flags = [];
  if (!(f.signedVerticalSpinLoftDeg > 0)) flags.push('out-of-domain:spin-loft');   // §4.3
  if (f.launchAngle <= 0) flags.push('out-of-domain:no-flight');                    // §4.2
  if (f.spinRpmRaw > f.totalSpinRpm) flags.push('clamped:total-spin-9000');         // §4.4
  if (f.smashEff === 1.52 || f.smashEff === 1.15) flags.push('clamped:smash');
  if (f.landingAngle !== f.landingRaw) flags.push('clamped:landing-angle');
  if (f.carryLaunchEfficiency < 1) flags.push('below-full-launch-efficiency');

  return {
    deliveredLoftDeg: dynamicLoft,
    attackAngleDeg: attackAngle,
    apexYd: r(f.apex, 1),
    // shared-footnote candidates — proven identical or not by the check below
    carryYd: r(f.carry),
    landingAngleDeg: r(f.landingAngle),
    backspinRpm: Math.round(f.backspin),
    ballSpeedMph: r(f.ballSpeed),
    smash: r(f.smashEff, 4),
    totalYd: r(f.total),
    // why apex moves and the rest does not
    launchAngleDeg: r(f.launchAngle),
    spinLoft3dDeg: r(f.spinLoft, 4),
    signedVerticalSpinLoftDeg: r(f.signedVerticalSpinLoftDeg, 4),
    carryLaunchEfficiency: r(f.carryLaunchEfficiency, 6),
    apexBallSpeedTermYd: r(f.apexBallSpeedTerm, 3),
    apexLaunchTermYd: r(f.apexLaunchTerm, 3),
    flags,
    raw: {
      carry: f.carry, apex: f.apex, landingAngle: f.landingAngle,
      backspin: f.backspin, ballSpeed: f.ballSpeed, smashEff: f.smashEff,
      launchAngle: f.launchAngle, spinLoft: f.spinLoft, spinRpmRaw: f.spinRpmRaw,
      landingRaw: f.landingRaw, rollFrac: f.rollFrac,
      carryFullLaunchAtDeg: f.carryFullLaunchAtDeg,
    },
  };
};

const rows = LOFTS.map(build);
const rowsFixed = LOFTS_FIXED.map(build);

// The whole premise of the table: along the diagonal these must agree.
// Tolerance 1e-9 relative — the 3-D spin vector path leaves ~1e-11 float noise on backspin,
// which is not a physical difference. A real break (carry) is orders of magnitude larger.
const SHARED = ['carry', 'landingAngle', 'backspin', 'ballSpeed', 'smashEff'];
const same = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a));
const identityOf = (set) => Object.fromEntries(
  SHARED.map((k) => [k, set.every((row) => same(row.raw[k], set[0].raw[k]))]),
);
const identical = identityOf(rows);
const premiseHolds = SHARED.every((k) => identical[k]);
const identicalFixed = identityOf(rowsFixed);

// Exact delivered loft where carryLaunchEfficiency reaches 1 on this diagonal
// (launchAngle === carryFullLaunchAtDeg). Below it, carry drops and "same carry" is false.
let lo = 1, hi = SPIN_LOFT + 20;
for (let i = 0; i < 200; i++) {
  const m = (lo + hi) / 2;
  if (solveFlight({ dynamicLoft: m, attackAngle: m - SPIN_LOFT, clubSpeed: CLUB_SPEED }).carryLaunchEfficiency < 1) lo = m;
  else hi = m;
}
const kneeLoftDeg = hi;

const apexes = rows.map((row) => row.raw.apex);
const apexesFixed = rowsFixed.map((row) => row.raw.apex);
const doc = {
  id: 'apex-window-equal-carry',
  title: 'Same Carry, Different Ceiling — the Apex Window',
  generatedAt: new Date().toISOString(),
  generator: 'outputs/agent-scan/gen-apex-window-equal-carry.mjs',
  engine: 'impact-flight.js solveFlight({dynamicLoft, attackAngle, clubSpeed}) — clubPath/faceAngle default 0',
  constants: {
    spinLoftDeg: SPIN_LOFT,
    clubSpeedMph: CLUB_SPEED,
    clubPathDeg: 0,
    faceAngleDeg: 0,
    note: 'Every row satisfies deliveredLoft - attackAngle = 34 deg exactly.',
  },
  cellMetric: { field: 'apexYd', unit: 'yd', tag: 'ESTIMATE' },
  rows,
  sharedFootnote: {
    premiseHolds,
    identical,
    carryYd: r(rows[1].raw.carry),
    landingAngleDeg: r(rows[1].raw.landingAngle),
    backspinRpm: Math.round(rows[1].raw.backspin),
    ballSpeedMph: r(rows[1].raw.ballSpeed),
    smash: r(rows[1].raw.smashEff, 4),
    text: `${r(rows[1].raw.carry)} yd carry · ${r(rows[1].raw.landingAngle)}° landing angle · ${Math.round(rows[1].raw.backspin)} rpm backspin. Only apex moves.`,
    warning: premiseHolds ? null
      : `Row ${rows[0].deliveredLoftDeg}° breaks the shared footnote: carry ${r(rows[0].raw.carry)} yd, not ${r(rows[1].raw.carry)} yd. Do not publish this grid with a single carry figure. Use recommendedGrid instead.`,
  },
  apexSpread: {
    minYd: r(Math.min(...apexes), 1),
    maxYd: r(Math.max(...apexes), 1),
    rangeYd: r(Math.max(...apexes) - Math.min(...apexes), 1),
  },
  equalCarryKnee: {
    deliveredLoftDeg: r(kneeLoftDeg, 6),
    attackAngleDeg: r(kneeLoftDeg - SPIN_LOFT, 6),
    why: 'carryLaunchEfficiency = min(launchAngle / carryFullLaunchAtDeg, 1), carryFullLaunchAtDeg = 10. Below this delivered loft the diagonal no longer holds carry constant, because launchAngle drops under 10 deg. Equal carry is therefore a property of the diagonal ONLY above this knee.',
  },
  recommendedGrid: {
    reason: `The ordered grid starts at 22 deg, which is below the ${r(kneeLoftDeg, 3)} deg knee, so its carry is 4.84 yd short and the shared footnote would be false. Lifting the first row to 24 deg restores the premise and changes nothing else.`,
    premiseHolds: SHARED.every((k) => identicalFixed[k]),
    identical: identicalFixed,
    rows: rowsFixed,
    sharedFootnote: {
      carryYd: r(rowsFixed[0].raw.carry),
      landingAngleDeg: r(rowsFixed[0].raw.landingAngle),
      backspinRpm: Math.round(rowsFixed[0].raw.backspin),
      ballSpeedMph: r(rowsFixed[0].raw.ballSpeed),
      smash: r(rowsFixed[0].raw.smashEff, 4),
      text: `${r(rowsFixed[0].raw.carry)} yd carry · ${r(rowsFixed[0].raw.landingAngle)}° landing angle · ${Math.round(rowsFixed[0].raw.backspin)} rpm backspin. Only apex moves.`,
    },
    apexSpread: {
      minYd: r(Math.min(...apexesFixed), 1),
      maxYd: r(Math.max(...apexesFixed), 1),
      rangeYd: r(Math.max(...apexesFixed) - Math.min(...apexesFixed), 1),
    },
  },
  domain: {
    engineDomain: 'All rows inside impact-outcome.js gate (signedVerticalSpinLoftDeg = 34 > 0). No clamp, no no-flight row.',
    outOfEngineDomainRows: rows.filter((row) => row.flags.some((s) => s.startsWith('out-of-domain'))).map((row) => row.deliveredLoftDeg),
    clampedRows: rows.filter((row) => row.flags.some((s) => s.startsWith('clamped'))).map((row) => row.deliveredLoftDeg),
    aerodynamics: 'PREMIUM_TOUR_CLASS_AERO reports extrapolated:true for every row (normal state for this engine — motor-api.md §4.5), not an error.',
  },
  golfPlausibility: {
    // Engine-valid is not the same as a swing a golfer can make. Flagged per row, not hidden.
    plausible: [28, 34],
    strained: [22, 24, 40],
    note: 'Delivered loft 34 deg / attack 0 deg and 28 deg / -6 deg are ordinary mid-iron deliveries. 22-24 deg / -10 to -12 deg is a very steep punch (attack angles past about -8 deg are rare off turf). 40 deg / +6 deg cannot be produced off the ground with a mid-iron; it reads as a teed or launched-up delivery. All are inside the engine domain and correctly computed - they are outside the normal player window, so the table must label the outer rows as extremes, not as recommendations.',
  },
};

writeFileSync(OUT, JSON.stringify(doc, null, 2) + '\n');

// Console proof
const table = (label, set, ident) => {
  console.log(`\n${label}   (spin loft ${SPIN_LOFT} deg | club speed ${CLUB_SPEED} mph | path 0 | face 0)`);
  console.log('loft  attack   apex    carry   landing  backspin  launch  smash    flags');
  for (const row of set) {
    console.log(
      String(row.deliveredLoftDeg).padStart(4),
      String(row.attackAngleDeg).padStart(7),
      String(row.apexYd).padStart(6),
      String(row.carryYd).padStart(8),
      String(row.landingAngleDeg).padStart(8),
      String(row.backspinRpm).padStart(9),
      String(row.launchAngleDeg).padStart(7),
      String(row.smash).padStart(7),
      ' ',
      row.flags.join(',') || '-',
    );
  }
  console.log('  identical(1e-9):', JSON.stringify(ident), '=> premiseHolds', SHARED.every((k) => ident[k]));
};

table('ORDERED GRID 22/28/34/40', rows, identical);
console.log('  apex spread:', JSON.stringify(doc.apexSpread));
table('RECOMMENDED GRID 24/28/34/40', rowsFixed, identicalFixed);
console.log('  apex spread:', JSON.stringify(doc.recommendedGrid.apexSpread));
console.log(`\nequal-carry knee: delivered loft ${r(kneeLoftDeg, 6)} deg (attack ${r(kneeLoftDeg - SPIN_LOFT, 6)} deg) — below this, carry is no longer constant on the diagonal.`);
console.log('wrote', OUT);
