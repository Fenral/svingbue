// Genererer tabell «Cost of One Degree — Yards Offline per Degree of Open Face».
// Rader = klubbpreset, kolonner = faceAngle +1..+4 (clubPath 0). Celle = offline (yd).
// Motoren leses kun, aldri endret. Kjør: node outputs/agent-scan/gen-face-error-cost-by-club.mjs
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', '..');
const { solveFlight } = await import(pathToFileURL(path.join(root, 'impact-flight.js')).href);

const ROWS = [
  { id: 'driver', label: 'Driver',  dynamicLoft: 14, attackAngle:  2, clubSpeed: 110 },
  { id: '5iron',  label: '5-iron',  dynamicLoft: 22, attackAngle: -3, clubSpeed:  95 },
  { id: '7iron',  label: '7-iron',  dynamicLoft: 30, attackAngle: -4, clubSpeed:  90 },
  { id: 'pw',     label: 'PW',      dynamicLoft: 44, attackAngle: -6, clubSpeed:  78 },
];
const FACES = [1, 2, 3, 4];
const r = (n, d = 1) => Number(n.toFixed(d));

// Flagg som motoren ikke selv rapporterer: stille metning + domenegate.
const flags = (f) => {
  const out = [];
  if (f.signedVerticalSpinLoftDeg <= 0) out.push('out-of-domain:spin-loft');
  if (f.spinRpmRaw > f.totalSpinRpm) out.push(`spin-clamped:${r(f.spinRpmRaw, 0)}->9000`);
  if (f.smashEff === 1.52 || f.smashEff === 1.15) out.push(`smash-clamped:${f.smashEff}`);
  if (f.landingAngle !== f.landingRaw) out.push(`landing-clamped:${r(f.landingRaw)}->${r(f.landingAngle)}`);
  if (f.carry === 0) out.push('no-flight:launchAngle<=0');
  if (f.aerodynamicDiagnostics?.extrapolated) out.push('aero-extrapolated');
  return out;
};

const rows = ROWS.map((row) => {
  const call = (faceAngle) =>
    solveFlight({ dynamicLoft: row.dynamicLoft, attackAngle: row.attackAngle, clubSpeed: row.clubSpeed, faceAngle, clubPath: 0 });
  const base = call(0);
  const cells = FACES.map((faceAngle) => {
    const f = call(faceAngle);
    // Vaktpost: offline må være start-ledd + curve. Fanger feil feltmapping.
    if (Math.abs(f.carry * Math.sin(f.startDirection * Math.PI / 180) + f.curve - f.offline) > 1e-9)
      throw new Error(`offline-identitet brutt: ${row.id} face +${faceAngle}`);
    return {
      faceAngle,
      offlineYd: r(f.offline),
      curveYd: r(f.curve),
      startDirectionDeg: r(f.startDirection, 2),
      spinAxisDeg: r(f.spinAxis, 1),
      carryYd: r(f.carry),
      shape: f.shape,
      flags: flags(f),
    };
  });
  return {
    ...row,
    startFaceW: r(base.startFaceW, 2),
    baseline: { carryYd: r(base.carry), offlineYd: r(base.offline), backspinRpm: r(base.backspin, 0), launchAngleDeg: r(base.launchAngle), shape: base.shape, flags: flags(base) },
    cells,
    yardsPerDegree: r(cells[0].offlineYd),          // offline ved +1°
    linearityRatio: r(cells[3].offlineYd / cells[0].offlineYd, 2), // 4° / (4 × 1°) hvis ~4 = lineær
  };
});

const out = {
  id: 'face-error-cost-by-club',
  title: 'Cost of One Degree — Yards Offline per Degree of Open Face',
  generatedAt: new Date().toISOString(),
  engine: 'impact-flight.js solveFlight (frosset, uendret)',
  units: { offline: 'yd from target line', carry: 'yd', angles: 'deg' },
  fixed: { clubPath: 0, faceAngleSign: '+ = open = right for RHP' },
  columns: FACES.map((f) => `+${f}°`),
  rows,
  notes: [
    'offline = carry·sin(startDirection) + curve. Begge ledd vokser med face-error; derfor er skalering med face nesten lineær.',
    'startFaceW = clamp(0.90 − 0.005·dynamicLoft, 0.60, 0.88) — motorens egen face-taper. Driver 0.83 → PW 0.68.',
    'Alle fire rader er inDomain (dynamicLoft − attackAngle > 0). Ingen tom celle.',
    'aero-extrapolated er normaltilstanden i denne motoren (94 % av slider-domenet), ikke en feil.',
  ],
};

writeFileSync(path.join(import.meta.dirname, 'tabell-face-error-cost-by-club.json'), JSON.stringify(out, null, 2) + '\n');

// Konsollmatrise
console.log('club     faceW  carry0   +1°    +2°    +3°    +4°   yd/deg  ratio4/1  flags');
for (const row of rows) {
  const c = row.cells.map((x) => String(x.offlineYd).padStart(6)).join(' ');
  console.log(
    row.label.padEnd(8),
    String(row.startFaceW).padStart(5),
    String(row.baseline.carryYd).padStart(6),
    c,
    String(row.yardsPerDegree).padStart(7),
    String(row.linearityRatio).padStart(9),
    ' ',
    [...new Set(row.cells.flatMap((x) => x.flags))].join(',') || '-'
  );
}
console.log('\nDetaljer pr celle:');
for (const row of rows) for (const c of row.cells)
  console.log(`${row.label.padEnd(8)} +${c.faceAngle}°  offline ${String(c.offlineYd).padStart(5)}  = start ${String(r(c.carryYd * Math.sin(c.startDirectionDeg * Math.PI / 180))).padStart(5)} + curve ${String(c.curveYd).padStart(5)}  carry ${c.carryYd}  spinAxis ${c.spinAxisDeg}  ${c.shape}`);
