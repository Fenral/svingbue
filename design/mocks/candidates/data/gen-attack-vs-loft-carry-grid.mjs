// Genererer ekte motortall for datatabellen «attack-vs-loft-carry-grid».
// Skriver outputs/agent-scan/tabell-attack-vs-loft-carry-grid.json
// Kjør:  node outputs/agent-scan/gen-attack-vs-loft-carry-grid.mjs
import { writeFileSync } from 'node:fs';
import { solveFlight } from 'file:///C:/Users/SkotvoldSivertSende/svingbue/impact-flight.js';

const ATTACK = [-5, -3, -1, 1, 3, 5, 7];               // 7 kolonner
const PRESETS = [
  { id: 'driver', label: 'Driver', clubSpeed: 110, lofts: [8, 11, 14, 17, 20] },
  { id: 'iron',   label: 'Iron',   clubSpeed: 90,  lofts: [16, 23, 31, 38, 46] },
];

const r1 = (n) => Math.round(n * 10) / 10;

function cell(dynamicLoft, attackAngle, clubSpeed) {
  const f = solveFlight({ dynamicLoft, attackAngle, clubSpeed, clubPath: 0, faceAngle: 0 });
  const flags = [];
  // Nivå 3 – domenegaten i impact-outcome.js: dynamicLoft − attackAngle > 0
  if (!(f.signedVerticalSpinLoftDeg > 0)) flags.push('out-of-domain:spin-loft');
  // Nivå 2 – no-flight-guarden
  if (f.carry === 0) flags.push('out-of-domain:no-flight');
  // Nivå 4 – stille metning
  if (f.spinRpmRaw > f.totalSpinRpm) flags.push('clamped:spin-9000');
  if (f.smashEff === f.smashMaximum) flags.push('clamped:smash-max');
  if (f.smashEff === f.smashMinimum) flags.push('clamped:smash-min');
  if (f.landingAngle !== f.landingRaw) flags.push('clamped:landing-angle');
  // Carry-rampen under full launch — forklarer at loft-kolonnen ikke er monoton
  if (f.carryLaunchEfficiency < 1) flags.push('ramp:below-full-launch');
  // Golf-plausibilitet (IKKE motorgrenser — se rapport)
  if (f.backspin < 1500) flags.push('implausible:backspin-under-1500');
  if (f.curveCarryProjectionScale > 1.3) flags.push('unreliable:carry-vs-rk4-divergence');
  return {
    attackAngle, dynamicLoft,
    carry: r1(f.carry), total: r1(f.total), backspin: Math.round(f.backspin),
    launchAngle: r1(f.launchAngle), spinLoft: r1(f.spinLoft), apex: r1(f.apex),
    smash: Math.round(f.smash * 1000) / 1000,
    spinRpmRaw: Math.round(f.spinRpmRaw),
    carryLaunchEfficiency: Math.round(f.carryLaunchEfficiency * 10000) / 10000,
    rk4CarryYd: r1(f.curveFlightCarryYd),
    flags,
  };
}

const presets = PRESETS.map((p) => ({
  ...p,
  rows: p.lofts.map((loft) => ({ dynamicLoft: loft, cells: ATTACK.map((a) => cell(loft, a, p.clubSpeed)) })),
}));
// Jern slås nedadgående fra bakken; positiv AoA finnes praktisk talt ikke off the turf.
for (const c of presets[1].rows.flatMap((r) => r.cells)) if (c.attackAngle > 0) c.flags.push('implausible:ascending-iron-strike');

// --- selvsjekk: identiteter + de påstandene bestillingen bygger på ---
const drv = presets[0].rows.find((r) => r.dynamicLoft === 14).cells;
const lo = drv[0].carry, hi = drv[6].carry;                       // AoA −5 vs +7
const at1 = (l) => presets[0].rows.find((r) => r.dynamicLoft === l).cells[3].carry; // AoA +1
console.assert(hi - lo > 20, `attack-spenn for lite: ${hi - lo}`);
console.assert(Math.abs(at1(8) - at1(20)) < hi - lo, 'loft-spenn skal være flatere enn attack-spenn');
const chk = solveFlight({ dynamicLoft: 14, attackAngle: 3, clubSpeed: 110, clubPath: 0, faceAngle: 0 });
console.assert(Math.abs(chk.total - chk.carry * (1 + chk.rollFrac)) < 1e-9, 'total-identitet brutt');

const out = {
  id: 'attack-vs-loft-carry-grid',
  generatedAt: new Date().toISOString(),
  source: 'impact-flight.js solveFlight() — re-derivert, ikke kopiert',
  call: 'solveFlight({ dynamicLoft: row, attackAngle: col, clubSpeed: preset, clubPath: 0, faceAngle: 0 })',
  units: { carry: 'yd', total: 'yd', backspin: 'rpm', apex: 'yd', angles: 'deg', clubSpeed: 'mph' },
  sourceTags: { carry: 'ESTIMATE', total: 'ESTIMATE', backspin: 'CALCULATED', launchAngle: 'ESTIMATE', spinLoft: 'CALCULATED' },
  attackAngles: ATTACK,
  presets,
  spans: {
    driverLoft14AttackSpanYd: r1(hi - lo),            // 8 -> 20 langs attack-aksen
    driverAttackPlus1LoftSpanFullBandYd: r1(Math.max(...[8, 11, 14, 17, 20].map(at1)) - Math.min(...[8, 11, 14, 17, 20].map(at1))),
    driverAttackPlus1LoftSpanL10toL18Yd: r1(
      solveFlight({ dynamicLoft: 10, attackAngle: 1, clubSpeed: 110, clubPath: 0, faceAngle: 0 }).carry -
      solveFlight({ dynamicLoft: 18, attackAngle: 1, clubSpeed: 110, clubPath: 0, faceAngle: 0 }).carry),
    note: 'Loft-kolonnen er IKKE monoton: carry topper ved loft ~10 (der carryLaunchEfficiency naar 1.0) og faller paa begge sider. «Loft er flatt» gjelder kun L10-L18.',
  },
};
const path = 'C:/Users/SkotvoldSivertSende/svingbue/outputs/agent-scan/tabell-attack-vs-loft-carry-grid.json';
writeFileSync(path, JSON.stringify(out, null, 2));

for (const p of presets) {
  console.log(`\n=== ${p.label} @ ${p.clubSpeed} mph — carry/total yd (backspin rpm) ===`);
  console.log('loft  ' + ATTACK.map((a) => String(a > 0 ? `+${a}` : a).padStart(16)).join(''));
  for (const row of p.rows) {
    console.log(
      String(row.dynamicLoft).padStart(4) + '  ' +
      row.cells.map((c) => `${c.carry}/${c.total} (${c.backspin})${c.flags.length ? '*' : ''}`.padStart(16)).join('')
    );
  }
}
const flagged = presets.flatMap((p) => p.rows.flatMap((r) => r.cells.filter((c) => c.flags.length).map((c) => `${p.id} L${c.dynamicLoft} A${c.attackAngle}: ${c.flags.join(',')} (raw spin ${c.spinRpmRaw})`)));
console.log('\n=== flagg (' + flagged.length + ') ===\n' + (flagged.join('\n') || 'ingen'));
console.log(`\nattack-spenn L14: ${r1(hi - lo)} yd (${lo} -> ${hi}) | loft-spenn @A+1: ${at1(8)} -> ${at1(20)}`);
console.log('skrev ' + path);
