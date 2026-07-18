import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAnnotations, placeLabels, statsFlip, cometPoint, MEASURE_KEEPOUT } from '../impact-annotate.js';
import { rigAt, buildBasis } from '../impact-camera.js';
import { selectOutcome } from '../impact-outcome.js';

// Portrait-ish phone canvas — impact.html sizes the scene to stage.clientWidth/
// Height (typically portrait), not the landscape 960×540 impact-camera.test.mjs
// uses for pure camera-math checks. Annotation pixel thresholds (§3) are
// screen-space, so tests that assert on them need a realistic viewport.
const VBOX = { w: 390, h: 780 };
const DEFAULTS = { face: 2.0, path: 0.0, attack: 3.0, dynLoft: 24, speed: 130 };

function basisAt(station) {
  return buildBasis(rigAt(station), VBOX);
}
function annotationsAt(station, params = DEFAULTS, hotKey = null) {
  const outcome = selectOutcome(params);
  return buildAnnotations(outcome, station, basisAt(station), hotKey);
}
function byKind(prims, kind) {
  return prims.filter(p => p.kind === kind);
}

// ── S1 · etikett-kaskaden — syntetiske geometricaser (ordre §3 "Etikettplassering") ──

test('S1 · kort spenn (< 74 px) → etikett ved ytre ende, horisontalt forskjøvet', () => {
  const A = { x: 100, y: 200 }; // indre
  const B = { x: 140, y: 205 }; // ytre, span = ~40.3 px < 74
  const prims = [{ kind: 'dimline', points: [A, B], label: '3 m curve', tone: 'measure', alpha: 1 }];
  const [placed] = placeLabels(prims, null, VBOX);
  assert.equal(placed.labelPos.y, B.y, 'kort spenn: y låst til ytre endepunkt (B)');
  assert.ok(placed.labelPos.x > B.x, 'kort spenn: forskjøvet UT fra B (B er til høyre for A her)');
});

test('S1 · kort spenn med B til venstre for A: forskyvningen følger retningen, ikke en fast side', () => {
  const A = { x: 140, y: 200 };
  const B = { x: 100, y: 205 }; // span < 74, men B ligger til VENSTRE for A
  const prims = [{ kind: 'dimline', points: [A, B], label: '3 m curve', tone: 'measure', alpha: 1 }];
  const [placed] = placeLabels(prims, null, VBOX);
  assert.ok(placed.labelPos.x < B.x, 'forskyvningen skal peke videre bort fra A, dvs. mot venstre her');
});

test('S1 · venstreskudd i mellomsonen: midtpunkt i stats-keep-out OG stats til venstre → indre (høyre) ende', () => {
  // Målespenn stort nok til å unngå regel 1 (>74 px), midtpunkt havner inni
  // MEASURE_KEEPOUT (x<246, y 88..356) — simulerer et venstreskudd sin
  // offline-brakett midtveis i skjermen mens stats-blokken står til venstre.
  const A = { x: 60, y: 150 };
  const B = { x: 160, y: 150 }; // span=100 px, midtpunkt (110,150-15=135) inni keepOut
  const prims = [{ kind: 'dimline', points: [A, B], label: '31 m L', tone: 'measure', alpha: 1 }];
  const [placed] = placeLabels(prims, MEASURE_KEEPOUT, VBOX);
  // indre (høyre) ende = A eller B med størst x → her B (x=160)
  assert.equal(placed.labelPos.y, B.y);
  assert.ok(placed.labelPos.x > B.x, 'etikett skal sitte til høyre for det indre endepunktet');
});

test('S1 · når stats står til høyre (keepOut=null) faller samme geometri tilbake til midtpunkt-regelen', () => {
  const A = { x: 60, y: 150 };
  const B = { x: 160, y: 150 };
  const prims = [{ kind: 'dimline', points: [A, B], label: '31 m L', tone: 'measure', alpha: 1 }];
  const [placed] = placeLabels(prims, null, VBOX);
  assert.equal(placed.labelPos.x, (A.x + B.x) / 2);
  assert.equal(placed.labelPos.y, (A.y + B.y) / 2 - 15);
});

test('S1 · normaltilfelle: span ≥ 74 px, midtpunkt utenfor keep-out → midtpunkt, 15 px over linjen', () => {
  const A = { x: 400, y: 300 };
  const B = { x: 600, y: 300 }; // span=200, midtpunkt x=500 > keepOut.x1=246
  const prims = [{ kind: 'dimline', points: [A, B], label: '18 m curve', tone: 'measure', alpha: 1 }];
  const [placed] = placeLabels(prims, MEASURE_KEEPOUT, VBOX);
  assert.equal(placed.labelPos.x, 500);
  assert.equal(placed.labelPos.y, 300 - 15);
});

test('S1 · kollisjonsregister: overlappende etiketter nudges vertikalt vekk, maks 3 iterasjoner, deterministisk', () => {
  const prims = [
    { kind: 'apex', points: [{ x: 300, y: 200 }], label: 'Apex 30 m', labelAnchor: { x: 300, y: 200 } },
    { kind: 'target', points: [], label: 'TARGET', labelAnchor: { x: 300, y: 201 } }, // nær-identisk anker
  ];
  const out1 = placeLabels(prims, null, VBOX);
  const out2 = placeLabels(prims, null, VBOX); // samme input igjen — stateless per kall (ingen jitter)
  assert.notEqual(out1[0].labelPos.y, out1[1].labelPos.y, 'de to etikettene må skilles vertikalt');
  assert.deepEqual(out1.map(p => p.labelPos), out2.map(p => p.labelPos), 'samme input → identisk resultat (ingen jitter)');
});

test('S1 · primitiver uten label går uendret gjennom placeLabels', () => {
  const prims = [{ kind: 'tick', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], tone: 'measure', alpha: 0.5, label: null }];
  const [out] = placeLabels(prims, null, VBOX);
  assert.equal(out.labelPos, undefined);
  assert.equal(out, prims[0]);
});

// ── S2 · stats-flip — automatisert sveip, ingen oscillering ved terskelen ──

test('S2 · flip inn ved station > 1.1 og side < −28, forblir av under det', () => {
  assert.equal(statsFlip(false, 1.2, -30), true);
  assert.equal(statsFlip(false, 1.0, -30), false, 'station må være > 1.1');
  assert.equal(statsFlip(false, 1.2, -20), false, 'side må være < −28');
});

test('S2 · hysterese: forblir true til station < 0.9 ELLER side > −14', () => {
  assert.equal(statsFlip(true, 1.0, -20), true, 'mellom 0.9 og 1.1, side mellom -28 og -14: hysterese holder true');
  assert.equal(statsFlip(true, 0.85, -20), false, 'station < 0.9 slår av');
  assert.equal(statsFlip(true, 1.0, -10), false, 'side > -14 slår av');
});

test('S2 · monotont sveip over station-terskelen: nøyaktig én overgang hver vei, ingen chatter', () => {
  const side = -30; // fast, godt innenfor flip-sonen når station er høy nok
  let right = false;
  let transitions = 0;
  for (let s = 0; s <= 2; s += 0.001) {
    const next = statsFlip(right, s, side);
    if (next !== right) transitions++;
    right = next;
  }
  assert.equal(transitions, 1, `sveip opp 0→2 skal gi nøyaktig 1 overgang, fikk ${transitions}`);
  assert.equal(right, true);
  for (let s = 2; s >= 0; s -= 0.001) {
    const next = statsFlip(right, s, side);
    if (next !== right) transitions++;
    right = next;
  }
  assert.equal(transitions, 2, 'sveip ned igjen skal gi totalt 2 overganger (opp + ned), ingen ekstra chatter');
  assert.equal(right, false);
});

test('S2 · monotont sveip over side-terskelen ved fast høy station: nøyaktig én overgang hver vei', () => {
  const station = 2;
  // start ved side=0 der right=false er den korrekte "hvilende" tilstanden
  // (station>1.1 er sann, men side<-28 er usann) — sveip NEDOVER inn i
  // flip-sonen først, så tilbake, slik at ingen kunstig overgang oppstår av
  // at startpunktet allerede lå inni sonen (samme prinsipp som station-sveipet).
  let right = false;
  let transitions = 0;
  for (let side = 0; side >= -50; side -= 0.05) {
    const next = statsFlip(right, station, side);
    if (next !== right) transitions++;
    right = next;
  }
  assert.equal(transitions, 1, `sveip 0→-50 skal gi nøyaktig 1 overgang, fikk ${transitions}`);
  assert.equal(right, true);
  for (let side = -50; side <= 0; side += 0.05) {
    const next = statsFlip(right, station, side);
    if (next !== right) transitions++;
    right = next;
  }
  assert.equal(transitions, 2, 'sveip tilbake 0 skal gi totalt 2 overganger, ingen ekstra chatter');
  assert.equal(right, false);
});

test('S2 · terskelbåndet (-28..-14 og 0.9..1.1) er obligatorisk hysterese, ikke en enkelt grense', () => {
  // side=-20 og station=1.0 ligger MIDT i begge båndene: resultatet må avhenge
  // utelukkende av forrige tilstand, ikke "resette" til én kanonisk verdi.
  assert.equal(statsFlip(false, 1.0, -20), false);
  assert.equal(statsFlip(true, 1.0, -20), true);
});

// ── buildAnnotations — stasjonsgating og §3-innhold (smoke/integrasjon) ──

test('buildAnnotations · TOP-elementer er fraværende under skalar ~1.25, til stede ved 2', () => {
  const atFlight = annotationsAt(0);
  const atTop = annotationsAt(2);
  assert.equal(byKind(atFlight, 'band').length, 0, 'ingen kurve-sjikt i FLIGHT');
  assert.ok(byKind(atTop, 'band').length >= 1, 'kurve-sjikt til stede i TOP');
  assert.ok(byKind(atTop, 'arc').some(a => a.label === null), 'retningsbuen (uten etikett) til stede i TOP');
});

test('buildAnnotations · SIDE-elementer (launch/land-buer) er til stede rundt skalar 1, fraværende ved 0 og 2', () => {
  const atFlight = annotationsAt(0);
  const atSide = annotationsAt(1);
  const atTop = annotationsAt(2);
  const sideArcs = a => byKind(a, 'arc').filter(x => typeof x.label === 'string');
  assert.equal(sideArcs(atFlight).length, 0);
  assert.equal(sideArcs(atTop).length, 0);
  assert.ok(sideArcs(atSide).length >= 1, 'Launch/Land-buer til stede ved SIDE');
  assert.ok(sideArcs(atSide).some(a => a.label.startsWith('Launch ')));
  assert.ok(sideArcs(atSide).some(a => a.label.startsWith('Land ')));
});

test('buildAnnotations · kurvemål skjules når |curve| < 3 m', () => {
  // face≈path gir curve nær 0 i mock-stubben
  const straight = annotationsAt(2, { face: 0.5, path: 0.4, attack: 3.0, dynLoft: 24, speed: 130 });
  const curved = annotationsAt(2, { face: 10, path: -5, attack: 3.0, dynLoft: 24, speed: 130 });
  const hasCurveDim = a => byKind(a, 'dimline').some(d => d.label.endsWith('m curve'));
  assert.equal(hasCurveDim(straight), false);
  assert.equal(hasCurveDim(curved), true);
});

test('buildAnnotations · offline-brakett har alltid en etikett i TOP (uansett fortegn på side)', () => {
  const a = annotationsAt(2);
  const off = byKind(a, 'dimline').find(d => /m (R|L)$/.test(d.label));
  assert.ok(off, 'offline-brakett-etikett skal finnes');
});

test('buildAnnotations · apex-dot til stede for skalar < 1.4, fraværende ved 1.4 og over; etikett dør ved 1.35', () => {
  for (const s of [0, 0.35, 0.7, 1.0, 1.35]) {
    const a = annotationsAt(s);
    assert.ok(byKind(a, 'apex').length >= 1, `apex mangler ved skalar ${s}`);
  }
  const apexAt2 = byKind(annotationsAt(2), 'apex');
  assert.equal(apexAt2.length, 0, 'apex-dot skal ikke finnes ved skalar 2 (>= 1.4)');
  const apexAt135 = byKind(annotationsAt(1.35), 'apex')[0];
  assert.equal(apexAt135.label, null, 'apex-etikett skal være borte ved 1.35 (label-grense < 1.35)');
});

test('buildAnnotations · TARGET-etikett er alltid til stede (alpha=1) utenfor TOP (topBlend=0)', () => {
  for (const s of [0, 0.5, 1]) {
    const target = byKind(annotationsAt(s), 'target')[0];
    assert.ok(target, `TARGET mangler ved skalar ${s}`);
    assert.equal(target.label, 'TARGET');
    assert.equal(target.alpha, 1);
  }
});

// NB (Økt E, motorbinding): motorens carry er IKKE monoton i klubbfart på
// toppen (drag-saturering i impact-flight.js: 150 mph klubb → kortere carry
// enn 120 mph). Fade-regelen (§3) er en funksjon av CARRY (piksel-klaring),
// så fixturene parametriseres på faktisk carry, ikke på speed.
test('buildAnnotations · TARGET fader i TOP for lang carry, forblir synlig for kort carry (§3 "fader ut ... lang carry")', () => {
  const shortShot = { face: 0, path: 0, attack: 3, dynLoft: 24, speed: 30 };  // kort carry (~37 m)
  const longShot = { face: 0, path: 0, attack: 3, dynLoft: 24, speed: 120 }; // motorens lengste carry (~207 m)
  const shortTarget = byKind(annotationsAt(2, shortShot), 'target')[0];
  const longTargets = byKind(annotationsAt(2, longShot), 'target');
  assert.ok(shortTarget, 'kort carry: TARGET skal være synlig i TOP');
  assert.ok(shortTarget.alpha > 0.5);
  assert.equal(longTargets.length, 0, 'lang carry: TARGET skal være helt faded (alpha ≤ 0.05) i TOP');
});

test('buildAnnotations · TARGET-alpha er monoton i CARRY ved fast TOP-skalar (lengre skudd → mer fade)', () => {
  const shots = [30, 60, 90, 120, 150].map(speed => {
    const params = { face: 0, path: 0, attack: 3, dynLoft: 24, speed };
    const carry = selectOutcome(params).m.carry;
    const t = byKind(annotationsAt(2, params), 'target')[0];
    return { carry, alpha: t ? t.alpha : 0 };
  }).sort((a, b) => a.carry - b.carry); // §3-regelen er i carry; speed→carry er ikke monoton i motoren
  for (let i = 1; i < shots.length; i++) {
    assert.ok(shots[i].alpha <= shots[i - 1].alpha + 1e-9,
      `alpha skal ikke øke med lengre carry: ${shots.map(s => `${s.carry.toFixed(0)}m→${s.alpha.toFixed(2)}`)}`);
  }
});

test('buildAnnotations · hot-state: face-drag setter retningsbue+kurvemål hot, ikke launch/land-buer', () => {
  const cold = annotationsAt(2, { ...DEFAULTS, face: 8, path: -2 }, null);
  const hot = annotationsAt(2, { ...DEFAULTS, face: 8, path: -2 }, 'face');
  const dirArcCold = byKind(cold, 'arc').find(a => a.label === null);
  const dirArcHot = byKind(hot, 'arc').find(a => a.label === null);
  assert.equal(dirArcCold.hot, false);
  assert.equal(dirArcHot.hot, true);
  const curveDimCold = byKind(cold, 'dimline').find(d => d.label.endsWith('m curve'));
  const curveDimHot = byKind(hot, 'dimline').find(d => d.label.endsWith('m curve'));
  assert.equal(curveDimCold.hot, false);
  assert.equal(curveDimHot.hot, true);
  const sideHot = annotationsAt(1, DEFAULTS, 'face');
  assert.ok(byKind(sideHot, 'arc').every(a => a.label === null || a.hot === false), 'face er ikke en launch/land-driver');
});

test('buildAnnotations · null primitives-array-krasj: extreme men gyldige input gir ingen kast', () => {
  assert.doesNotThrow(() => annotationsAt(2, { face: 15, path: -15, attack: 15, dynLoft: 50, speed: 150 }));
  assert.doesNotThrow(() => annotationsAt(0.5, { face: -15, path: 15, attack: -15, dynLoft: 0, speed: 30 }));
});

// ── Komet ──

test('cometPoint · returnerer et banepunkt tidlig i syklusen, null i pausen', () => {
  const outcome = selectOutcome(DEFAULTS);
  const early = cometPoint(outcome, 100);
  assert.ok(early && typeof early.x === 'number');
  const paused = cometPoint(outcome, 2900 * 1.15); // cyc = 1.15 > 1 → pause
  assert.equal(paused, null);
});

test('cometPoint · deterministisk og innenfor banens indeksområde', () => {
  const outcome = selectOutcome(DEFAULTS);
  const a = cometPoint(outcome, 1450);
  const b = cometPoint(outcome, 1450);
  assert.deepEqual(a, b);
});
