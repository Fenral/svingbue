/**
 * IMPACT · OUTCOME SELECTOR — STUB (Økt B).
 *
 * FLATEN er kontrakt (docs/systemkontrakt.md §3.3 / §8): `selectOutcome(state)`
 * er det eneste stedet UI-koden henter avledede tall fra, og det eneste stedet
 * yards→meter noensinne skjer. Økt E bytter INNMATEN i denne filen mot den
 * ekte motoren (`solveFlight` i ./impact-flight.js) uten å endre signaturen
 * eller `Outcome`-formen. Ingen annen fil skal kalle `solveFlight` eller
 * multiplisere med YD2M.
 *
 * Innmaten under er mock-fysikk portert fra design/mocks/impact-kamera.html
 * (linje 211–231) KUN som plassholder, uttrykt direkte i verdensmeter og i
 * repoets Z-up-konvensjon (+X nedslag, +Y høyre, +Z høyde — §1.4). Den er
 * merket og grep-bar: K5-gaten (Økt E/F) skal finne null `MOCK_STUB`-treff
 * i produksjonskode når motorbindingen er gjort.
 */

const MOCK_STUB = true; // K5-grep-markør: Økt E sletter stubben og denne linjen.

const RAD = Math.PI / 180;
const M2YD = 1 / 0.9144; // kun for å fylle raw-speilet i stubben
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Liten LRU (ikke én-slot): tegneløkken leser live + inntil 3 pins per frame,
// og en én-slot-memo ville trashe mellom dem. 8 slots dekker det med margin.
const memo = new Map();
const MEMO_MAX = 8;

/**
 * state → Outcome (frosset form, §3.3):
 *   raw  — motorens felt uendret (yards/mph); stubben speiler metertallene.
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

  const p = state;
  const sf = (p.speed || 130) / 130;
  const launchDir = 0.8 * p.face + 0.2 * p.path;
  const curve = 5.1 * (p.face - p.path) * sf;
  const apex = clamp((8 + 0.8 * p.dynLoft + 0.9 * p.attack) * Math.sqrt(sf), 4, 60);
  const carry = clamp((212 - 0.25 * Math.abs(p.face - p.path) - Math.abs(p.attack - 3) * 0.8) * sf, 15, 245);
  const side = carry * Math.tan(launchDir * RAD) + curve;
  const total = carry + 5;
  const launchAng = Math.max(0.5, 0.72 * p.dynLoft - 0.05 * p.attack);
  const spinLoft = p.dynLoft - p.attack;
  const smash = clamp(1.39 - 0.002 * Math.abs(p.face - p.path) - 0.003 * Math.abs(p.attack - 3), 1.2, 1.47);
  const ballSpeed = (p.speed || 130) * smash;
  const backspin = Math.round(1.85 * Math.max(2, Math.abs(spinLoft)) * ballSpeed);
  const spinAxis = clamp(1.5 * (p.face - p.path), -38, 38);
  const landAng = clamp(32 + apex * 0.45, 32, 60);

  // Banegeometri i verdensmeter (§2.4-skaleringen, her direkte i meter):
  // x = nedslag, y = sideveis (startlinje + t²-kurve), z = høyde.
  const N = 64;
  const path = new Array(N);
  const tanDir = Math.tan(launchDir * RAD);
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    path[i] = Object.freeze({
      x: carry * t,
      y: carry * t * tanDir + curve * t * t,
      z: apex * 4 * t * (1 - t),
    });
  }

  const outcome = Object.freeze({
    raw: Object.freeze({
      // speiler solveFlight-feltene stubben kan fylle (yards/mph)
      startDirection: launchDir, spinAxis, curve: curve * M2YD, offline: side * M2YD,
      launchAngle: launchAng, spinLoft, backspin, landingAngle: landAng,
      smash, ballSpeed, carry: carry * M2YD, total: total * M2YD,
    }),
    m: Object.freeze({ carry, total, apex, curve, side }),
    deg: Object.freeze({ launchDir, spinAxis, launchAng, spinLoft, landAng }),
    misc: Object.freeze({ backspin, ballSpeed, smash }),
    path: Object.freeze(path),
    physical: Object.freeze({
      inDomain: spinLoft > 0,
      reason: spinLoft > 0 ? null : 'spin-loft',
    }),
  });

  memo.set(key, outcome);
  if (memo.size > MEMO_MAX) memo.delete(memo.keys().next().value);
  return outcome;
}
