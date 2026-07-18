/**
 * IMPACT · OUTCOME SELECTOR — ekte motorbinding (Økt E).
 *
 * Kontrakt (docs/systemkontrakt.md §3.3 / §8 / A7): `selectOutcome(state)` er
 * det ENESTE stedet som kaller solveFlight, og det eneste stedet yards→meter
 * noensinne skjer. Ingen annen fil kaller solveFlight eller multipliserer med
 * YD2M. Rendering, chips, annotasjoner og hero leser samme frosne `Outcome`.
 *
 * Ingen ny fysikk her: alle 12 outcome-verdier er 1:1-felter fra solveFlight
 * (§2.3), og banegeometrien er motorens egen trajectorySamples skalert til
 * verdensmeter med den eneste lovlige skaleringen (§2.4):
 *   x = d·carry_m · y = pts.x·offline_m · z = h·apex_m   (Z-up, §1.4)
 *
 * Ekstremverdi-policy (§4, A8): input klemmes aldri utover sliderens eget
 * område; motorens interne klemmer (§2.5) står urørt. Én invariant:
 * physical.inDomain = (spinLoft > 0) — negativ spin loft er det eneste stedet
 * motoren rapporterer feil fortegnsbetydning (abs() gjør topspin til backspin).
 * Predikatet utvides ikke.
 */

import { solveFlight, trajectorySamples } from './impact-flight.js';

const YD2M = 0.9144; // eneste yards→meter-konvertering i hele UI-koden (§1.5)

// Liten LRU (ikke én-slot): tegneløkken leser live + inntil 3 pins per frame,
// og en én-slot-memo ville trashe mellom dem. 8 slots dekker det med margin.
const memo = new Map();
const MEMO_MAX = 8;

/**
 * state → Outcome (frosset form, §3.3):
 *   raw  — solveFlight(...) uendret (yards/mph), for breakdown-forklaringer.
 *   m    — meter, konvertert ÉN gang: carry, total, apex, curve, side.
 *   deg  — launchDir, spinAxis, launchAng, spinLoft, landAng.
 *   misc — backspin (rpm), ballSpeed (mph), smash.
 *   path — banegeometri i verdensmeter, ferdig skalert ({x,y,z}[], Z-up).
 *   physical — { inDomain, reason } (§4: inDomain = spinLoft > 0).
 *
 * Memoisert på de fem parametrene; `station` påvirker aldri resultatet (§3.4).
 */
export function selectOutcome(state) {
  const key = [state.face, state.path, state.attack, state.dynLoft, state.speed].join('|');
  const hit = memo.get(key);
  if (hit) { memo.delete(key); memo.set(key, hit); return hit; }

  // §2.2-signaturen — merk feltnavnene: state.face→faceAngle, state.path→clubPath.
  const raw = solveFlight({
    clubPath: state.path,
    faceAngle: state.face,
    attackAngle: state.attack,
    dynamicLoft: state.dynLoft,
    clubSpeed: state.speed,
  });

  const carryM = raw.carry * YD2M;
  const offlineM = raw.offline * YD2M;
  const apexM = raw.apex * YD2M;

  // §2.4: normaliserte samples → verdensmeter (Z-up: +X nedslag, +Y høyre, +Z høyde)
  const samples = trajectorySamples(raw);
  const path = samples.map(p => Object.freeze({
    x: p.d * carryM,
    y: p.x * offlineM,
    z: p.h * apexM,
  }));

  const outcome = Object.freeze({
    raw: Object.freeze(raw),
    m: Object.freeze({
      carry: carryM,
      total: raw.total * YD2M,
      apex: apexM,
      curve: raw.curve * YD2M,
      side: offlineM,
    }),
    deg: Object.freeze({
      launchDir: raw.startDirection,
      spinAxis: raw.spinAxis,
      launchAng: raw.launchAngle,
      spinLoft: raw.spinLoft,
      landAng: raw.landingAngle,
    }),
    misc: Object.freeze({
      backspin: raw.backspin,
      ballSpeed: raw.ballSpeed,
      smash: raw.smash,
    }),
    path: Object.freeze(path),
    physical: Object.freeze({
      inDomain: raw.spinLoft > 0,
      reason: raw.spinLoft > 0 ? null : 'spin-loft',
    }),
  });

  memo.set(key, outcome);
  if (memo.size > MEMO_MAX) memo.delete(memo.keys().next().value);
  return outcome;
}
