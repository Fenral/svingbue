// Genererer ekte motortall for datatabellen «Face and Path — Where the Ball Finishes».
// Rader = faceAngle -4..+4, kolonner = clubPath -4..+4, steg 2. Fast 7-jern-levering.
// Kjør: node outputs/agent-scan/gen-face-path-outcome-matrix.mjs
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', '..');
const { solveFlight } = await import(pathToFileURL(path.join(root, 'impact-flight.js')).href);

const AXIS = [-4, -2, 0, 2, 4];
const FIXED = { dynamicLoft: 30, attackAngle: -4, clubSpeed: 90 };
const r3 = (n) => Math.round(n * 1000) / 1000;

const cells = [];
for (const faceAngle of AXIS) {
  for (const clubPath of AXIS) {
    const f = solveFlight({ ...FIXED, faceAngle, clubPath });
    // Domenegate slik impact-outcome.js definerer den + de stille klemmene motoren ikke rapporterer.
    const notes = [];
    if (f.spinRpmRaw > f.totalSpinRpm) notes.push(`spin clamped ${r3(f.spinRpmRaw)} -> ${f.totalSpinRpm} rpm`);
    if (f.smashEff === 1.52 || f.smashEff === 1.15) notes.push(`smash pinned at ${f.smashEff}`);
    if (f.landingAngle !== f.landingRaw) notes.push(`landing angle clamped ${r3(f.landingRaw)} -> ${r3(f.landingAngle)} deg`);
    cells.push({
      faceAngle, clubPath,
      faceToPath: r3(f.faceToPath),
      offline: r3(f.offline),
      shape: f.shape,
      startDirection: r3(f.startDirection),
      curve: r3(f.curve),
      carry: r3(f.carry),
      spinAxis: r3(f.spinAxis),
      totalSpinRpm: r3(f.totalSpinRpm),
      inDomain: f.signedVerticalSpinLoftDeg > 0,
      outOfDomainReason: f.signedVerticalSpinLoftDeg > 0 ? null : 'spin-loft',
      aeroExtrapolated: f.aerodynamicDiagnostics.extrapolated,
      notes,
    });
  }
}

// Sensitivitet langs hver akse ved den andre = 0, lest ut av de faktiske cellene.
const at = (faceAngle, clubPath) => cells.find((c) => c.faceAngle === faceAngle && c.clubPath === clubPath);
const sensitivity = {
  offlineYdPerDegFace: r3((at(4, 0).offline - at(-4, 0).offline) / 8),
  offlineYdPerDegPath: r3((at(0, 4).offline - at(0, -4).offline) / 8),
};

const out = {
  id: 'face-path-outcome-matrix',
  title: 'Face and Path — Where the Ball Finishes',
  engine: 'impact-flight.js solveFlight',
  generatedBy: 'outputs/agent-scan/gen-face-path-outcome-matrix.mjs',
  fixedInputs: FIXED,
  units: { offline: 'yd right of target line (+ = right)', curve: 'yd', carry: 'yd', angles: 'deg' },
  rowsFaceAngleDeg: AXIS,
  colsClubPathDeg: AXIS,
  sensitivity,
  cellsOutOfDomain: cells.filter((c) => !c.inDomain).map((c) => ({ faceAngle: c.faceAngle, clubPath: c.clubPath, reason: c.outOfDomainReason })),
  aeroNote: 'PREMIUM_TOUR_CLASS_AERO validity envelope: every cell is extrapolated (spin parameter above ceiling for a 7-iron). Informational, not a blocker.',
  cells,
};

const dest = path.join(import.meta.dirname, 'tabell-face-path-outcome-matrix.json');
writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');

// Konsollmatrise for øyekontroll
console.log(`fixed: ${JSON.stringify(FIXED)}`);
console.log('offline yd / shape   (rows = face, cols = path)\n');
console.log('face\\path'.padEnd(10) + AXIS.map((p) => String(p).padStart(18)).join(''));
for (const faceAngle of AXIS) {
  const row = AXIS.map((clubPath) => {
    const c = at(faceAngle, clubPath);
    return `${c.offline.toFixed(1)} ${c.shape}`.padStart(18);
  }).join('');
  console.log(String(faceAngle).padEnd(10) + row);
}
console.log(`\nsensitivity: ${sensitivity.offlineYdPerDegFace} yd/deg face, ${sensitivity.offlineYdPerDegPath} yd/deg path`);
console.log(`out of domain: ${out.cellsOutOfDomain.length} of ${cells.length}`);
console.log(`cells with clamp notes: ${cells.filter((c) => c.notes.length).length}`);
console.log(`spin range: ${Math.min(...cells.map((c) => c.totalSpinRpm))} .. ${Math.max(...cells.map((c) => c.totalSpinRpm))} rpm`);
console.log(`carry range: ${Math.min(...cells.map((c) => c.carry))} .. ${Math.max(...cells.map((c) => c.carry))} yd`);
// selvsjekk: identiteten offline = carry*sin(start) + curve må holde i hver celle
for (const c of cells) {
  const lhs = c.carry * Math.sin((c.startDirection * Math.PI) / 180) + c.curve;
  if (Math.abs(lhs - c.offline) > 0.02) throw new Error(`identity broke at face ${c.faceAngle} path ${c.clubPath}: ${lhs} vs ${c.offline}`);
}
console.log('identity offline === carry*sin(start) + curve: OK for all 25 cells');
console.log(`wrote ${dest}`);
