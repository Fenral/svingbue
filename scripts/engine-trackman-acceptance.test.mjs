import test from 'node:test';
import assert from 'node:assert/strict';
import { solveFlight } from '../impact-flight.js';
import { selectOutcome } from '../impact-outcome.js';

// Current authoritative source checked 2026-07-21:
// TrackMan, "Trackman Tour Averages", published 2024-05-02. The official
// PGA image is labelled 2023 and is still the current downloadable tour asset.
// https://www.trackman.com/blog/golf/introducing-updated-tour-averages
//
// TrackMan publishes Club Speed, Attack Angle, Ball Speed, Smash, Launch,
// Spin, Max Height, Land Angle and Carry for the full bag. It does NOT publish
// full-bag Dynamic Loft or Total in that asset. The dynamic-loft values below
// are therefore Flightglass reference-delivery inputs, not TrackMan facts.
// No Total target is fabricated; Total is protected separately by ordering and
// monotonicity contracts until an authoritative current source is available.
const TRACKMAN_SOURCE = Object.freeze({
  title: 'Trackman Tour Averages',
  published: '2024-05-02',
  dataYear: 2023,
  checked: '2026-07-21',
  url: 'https://www.trackman.com/blog/golf/introducing-updated-tour-averages',
});

// Six rows are the fit set. The interleaved six HOLDOUT rows may be used only
// for validation; implementation constants must not be fitted to them.
const TOUR_ROWS = Object.freeze([
  { set:'fit', club:'driver', label:'Driver', clubSpeed:115, attackAngle:-0.9, dynamicLoft:11, ballSpeed:171, smash:1.49, launchAngle:10.4, backspin:2545, apex:35, landingAngle:39, carry:282 },
  { set:'fit', club:'3wood', label:'3-wood', clubSpeed:110, attackAngle:-2.3, dynamicLoft:15, ballSpeed:162, smash:1.47, launchAngle:9.3, backspin:3663, apex:32, landingAngle:44, carry:249 },
  { set:'holdout', club:'5wood', label:'5-wood', clubSpeed:106, attackAngle:-2.5, dynamicLoft:18, ballSpeed:156, smash:1.47, launchAngle:9.7, backspin:4322, apex:33, landingAngle:48, carry:236 },
  { set:'holdout', club:'hybrid', label:'Hybrid', clubSpeed:102, attackAngle:-2.4, dynamicLoft:20, ballSpeed:149, smash:1.47, launchAngle:10.2, backspin:4587, apex:31, landingAngle:49, carry:231 },
  { set:'holdout', club:'3iron', label:'3-iron', clubSpeed:100, attackAngle:-2.5, dynamicLoft:22, ballSpeed:145, smash:1.46, launchAngle:10.3, backspin:4404, apex:30, landingAngle:48, carry:218 },
  { set:'holdout', club:'4iron', label:'4-iron', clubSpeed:98, attackAngle:-2.9, dynamicLoft:23.5, ballSpeed:140, smash:1.44, launchAngle:10.8, backspin:4782, apex:31, landingAngle:49, carry:209 },
  { set:'fit', club:'5iron', label:'5-iron', clubSpeed:96, attackAngle:-3.4, dynamicLoft:25, ballSpeed:135, smash:1.41, launchAngle:11.9, backspin:5280, apex:33, landingAngle:50, carry:199 },
  { set:'holdout', club:'6iron', label:'6-iron', clubSpeed:94, attackAngle:-3.7, dynamicLoft:27.5, ballSpeed:130, smash:1.39, launchAngle:14.0, backspin:6204, apex:32, landingAngle:50, carry:188 },
  { set:'fit', club:'7iron', label:'7-iron', clubSpeed:92, attackAngle:-3.9, dynamicLoft:30, ballSpeed:123, smash:1.34, launchAngle:16.1, backspin:7124, apex:34, landingAngle:51, carry:176 },
  { set:'holdout', club:'8iron', label:'8-iron', clubSpeed:89, attackAngle:-4.2, dynamicLoft:33.5, ballSpeed:118, smash:1.33, launchAngle:17.8, backspin:8078, apex:33, landingAngle:51, carry:164 },
  { set:'fit', club:'9iron', label:'9-iron', clubSpeed:87, attackAngle:-4.3, dynamicLoft:37, ballSpeed:112, smash:1.29, launchAngle:20.0, backspin:8793, apex:32, landingAngle:52, carry:152 },
  { set:'fit', club:'pw', label:'PW', clubSpeed:84, attackAngle:-4.7, dynamicLoft:43, ballSpeed:104, smash:1.24, launchAngle:23.7, backspin:9316, apex:32, landingAngle:52, carry:142 },
]);

const BANDS = Object.freeze({
  carry: Object.freeze({ unit:'percent', green:3, amber:6 }),
  ballSpeed: Object.freeze({ unit:'percent', green:2, amber:4 }),
  smash: Object.freeze({ unit:'absolute', green:0.02, amber:0.04 }),
  apex: Object.freeze({ unit:'percent', green:5, amber:10 }),
  backspin: Object.freeze({ unit:'percent', green:5, amber:10 }),
  launchAngle: Object.freeze({ unit:'degrees', green:1, amber:2 }),
  landingAngle: Object.freeze({ unit:'degrees', green:2, amber:4 }),
});

function solveRow(row) {
  return solveFlight({
    clubSpeed: row.clubSpeed,
    dynamicLoft: row.dynamicLoft,
    attackAngle: row.attackAngle,
    faceAngle: 0,
    clubPath: 0,
  });
}

function metricError(actual, target, band) {
  return band.unit === 'percent'
    ? Math.abs((actual / target - 1) * 100)
    : Math.abs(actual - target);
}

function classify(error, band) {
  if (error <= band.green) return 'GREEN';
  if (error <= band.amber) return 'AMBER';
  return 'RED';
}

function redFindings(rows) {
  const findings = [];
  for (const row of rows) {
    const flight = solveRow(row);
    for (const [metric, band] of Object.entries(BANDS)) {
      const error = metricError(flight[metric], row[metric], band);
      if (classify(error, band) === 'RED') {
        findings.push(
          `${row.label} ${metric}: actual=${flight[metric].toFixed(6)} ` +
          `target=${row[metric]} error=${error.toFixed(3)} ${band.unit}`
        );
      }
    }
  }
  return findings;
}

test('TrackMan source and fit/holdout split are explicit', () => {
  assert.equal(TRACKMAN_SOURCE.published, '2024-05-02');
  assert.equal(TOUR_ROWS.filter(row => row.set === 'fit').length, 6);
  assert.equal(TOUR_ROWS.filter(row => row.set === 'holdout').length, 6);
  assert.deepEqual(BANDS, {
    carry: { unit:'percent', green:3, amber:6 },
    ballSpeed: { unit:'percent', green:2, amber:4 },
    smash: { unit:'absolute', green:0.02, amber:0.04 },
    apex: { unit:'percent', green:5, amber:10 },
    backspin: { unit:'percent', green:5, amber:10 },
    launchAngle: { unit:'degrees', green:1, amber:2 },
    landingAngle: { unit:'degrees', green:2, amber:4 },
  });
});

test('shipping solveFlight has no RED TrackMan chip on the fit set', () => {
  assert.deepEqual(redFindings(TOUR_ROWS.filter(row => row.set === 'fit')), []);
});

test('shipping solveFlight has no RED TrackMan chip on the untouched holdout set', () => {
  assert.deepEqual(redFindings(TOUR_ROWS.filter(row => row.set === 'holdout')), []);
});

test('five-field solveFlight, optional club label and selectOutcome are longitudinally identical', () => {
  const metrics = [
    'carry', 'total', 'ballSpeed', 'smash', 'apex', 'backspin',
    'launchAngle', 'landingAngle', 'curve', 'offline', 'spinAxis', 'startDirection',
  ];
  for (const row of TOUR_ROWS) {
    const fiveField = solveRow(row);
    const labelled = solveFlight({
      clubSpeed: row.clubSpeed,
      dynamicLoft: row.dynamicLoft,
      attackAngle: row.attackAngle,
      faceAngle: 0,
      clubPath: 0,
      club: row.club,
    });
    const selected = selectOutcome({
      speed: row.clubSpeed,
      dynLoft: row.dynamicLoft,
      attack: row.attackAngle,
      face: 0,
      path: 0,
    }).raw;
    for (const metric of metrics) {
      assert.equal(labelled[metric], fiveField[metric], `${row.label} labelled ${metric}`);
      assert.equal(selected[metric], fiveField[metric], `${row.label} selectOutcome ${metric}`);
    }
  }
});

test('square face/path keeps every lateral chip exactly zero across the bag', () => {
  for (const row of TOUR_ROWS) {
    const flight = solveRow(row);
    assert.equal(flight.curve, 0, `${row.label} CURVE`);
    assert.equal(flight.offline, 0, `${row.label} SIDE`);
    assert.equal(flight.spinAxis, 0, `${row.label} SPIN AXIS`);
    assert.equal(flight.startDirection, 0, `${row.label} LAUNCH DIR`);
  }
});

test('protected spin geometry invariants remain exact', () => {
  const neutralInput = {
    clubSpeed:100, dynamicLoft:25, attackAngle:-3,
    faceAngle:0, clubPath:0, club:'7iron',
  };
  const neutral = solveFlight(neutralInput);
  assert.equal(neutral.spinLoft, neutralInput.dynamicLoft - neutralInput.attackAngle);

  const driver = solveFlight({
    clubSpeed:100, dynamicLoft:11, attackAngle:1,
    faceAngle:3, clubPath:0, club:'driver',
  });
  const hybrid = solveFlight({
    clubSpeed:100, dynamicLoft:22, attackAngle:-3,
    faceAngle:3, clubPath:0, club:'7iron',
  });
  const tiltRatio = driver.spinAxis / hybrid.spinAxis;
  assert.ok(Math.abs(tiltRatio - 2.518538000504215) <= 1e-12, `tilt ratio ${tiltRatio}`);
});

test('carry and Total are strictly monotone in club speed at fixed delivery', () => {
  const speeds = [60, 75, 90, 105, 120, 135, 150];
  const flights = speeds.map(clubSpeed => solveFlight({
    clubSpeed, dynamicLoft:30, attackAngle:-3,
    faceAngle:0, clubPath:0, club:'7iron',
  }));
  for (let i = 1; i < flights.length; i += 1) {
    assert.ok(flights[i].ballSpeed > flights[i - 1].ballSpeed, `ball speed at ${speeds[i]} mph`);
    assert.ok(flights[i].carry > flights[i - 1].carry, `carry at ${speeds[i]} mph`);
    assert.ok(flights[i].total > flights[i - 1].total, `Total at ${speeds[i]} mph`);
    assert.ok(flights[i].total >= flights[i].carry, `Total >= Carry at ${speeds[i]} mph`);
  }
});

test('zero club speed produces no flight, spin or rollout', () => {
  const flight = solveFlight({
    clubSpeed: 0,
    dynamicLoft: 30,
    attackAngle: -3,
    faceAngle: 0,
    clubPath: 0,
  });
  for (const metric of [
    'ballSpeed', 'carry', 'total', 'apex', 'landingAngle', 'landingRaw',
    'backspin', 'totalSpinRpm', 'curve', 'offline', 'rollFrac', 'roll',
  ]) assert.equal(flight[metric], 0, metric);
});
