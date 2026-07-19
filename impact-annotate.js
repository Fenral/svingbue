/**
 * IMPACT · ANNOTATE — ESM module (named exports).
 * Ren transform: (Outcome, station, basis) → primitiver. Ingen DOM, ingen
 * canvas-kall — kalleren (impact.html) tegner. Pure functions, no deps.
 *
 * Kontrakt: docs/systemkontrakt.md §7 (flate), §8 (fileier). Reglene selv
 * (tallterskler, rekkefølge) står i design/orders/impact-kamera.md §3 og
 * gjentas ikke som prosa her — hver konstant under er merket med hvilken
 * ordre-linje den porterer.
 *
 * Verdenskonvensjon (låst, §1.4): Z-up meter, +X nedslag, +Y høyre, +Z høyde.
 * `outcome` kommer fra ./impact-outcome.js (selectOutcome) — denne modulen
 * kaller aldri solveFlight og multipliserer aldri med YD2M (§3.3/A7).
 *
 * `hotKey` (4. param, additiv — ikke del av den låste §5.3/§7-signaturen på
 * de tre første parameterne, men nødvendig for §3 sitt hot-state-krav, som
 * er transient UI-interaksjon [hvilken slider dras / nylig endret speed] og
 * derfor ikke kan avledes fra outcome/station/basis alene): 'face'|'path'|
 * 'attack'|'dynLoft'|'speed'|null. Utelates → alt kaldt, ingen atferdsendring
 * for eksisterende kallere.
 */

import { project } from './impact-camera.js';

const RAD = Math.PI / 180;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const smoothstep = t => t * t * (3 - 2 * t);
const fmtDeg = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + '°';
const sign = v => Math.sign(v) || 1;

// ordre §3 "Etikettplassering" — tallterskler, verbatim.
const SPAN_THRESHOLD = 74;   // px, regel 1
const LABEL_GAP = 10;        // px, avstand fra endepunkt til etikett-senter
const LABEL_DY = -15;        // px, regel 3: "midtpunkt, 15 px over linjen"
const NUDGE_GAP = 3;         // px, kollisjonsregisterets vertikale luft
const MAX_NUDGE_ITER = 3;    // maks iterasjoner
const LABEL_H = 19;          // px, smallLabel-høyde (samme stil på alt her)

// ordre §3 "stats-keep-out (x < 246 px, y 88–356 px)" — eksportert slik
// kalleren har ett sted å hente det normative tallet fra, ikke en kopi.
export const MEASURE_KEEPOUT = Object.freeze({ x0: 0, y0: 88, x1: 246, y1: 356 });

function estWidth(label) {
  // Ingen canvas-measureText her (K: ingen canvas-kall) — grov, deterministisk
  // bredde-heuristikk. Avgjør ikke kaskade-grenen (den styres av span/keepOut,
  // ikke av denne bredden alene bortsett fra som offset), kun visuell nudge.
  return Math.max(30, label.length * 6.3 + 16);
}

/**
 * Genererer en polylinje for en hårstrekbue: gen(aRad, m) → world point,
 * a fra 0..angMagRad i `steps` inkrementer, projisert med `project`.
 * Returnerer null når vinkelen er for liten til å tegnes (ordre-grammatikk:
 * buer under ~0.3° tegnes ikke — porter av mockens hairArc-guard).
 */
function buildArc(basis, gen, angDeg, steps = 18) {
  if (Math.abs(angDeg) < 0.3) return null;
  const angMag = Math.abs(angDeg) * RAD;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const a = (angMag * i) / steps;
    const q = project(gen(a, 1), basis);
    if (q) pts.push(q);
  }
  if (pts.length < 2) return null;
  const t0 = project(gen(0, 0.955), basis);
  const t1 = project(gen(0, 1.045), basis);
  const tick = t0 && t1 ? [t0, t1] : null;
  const labelAnchor = project(gen(angMag * 0.5, 1.3), basis);
  return { points: pts, tick, labelAnchor };
}

/**
 * (Outcome, station, basis) → Primitive[] — §7/§5.3-signaturen, uendret.
 * `basis` er det impact-camera.js sin buildBasis() returnerer; projeksjonen
 * gjøres med `project` (importert fra samme modul, §5.3) — ingen DOM/canvas,
 * kun ren geometri. `hotKey` er den additive 4. parameteren, se toppkommentar.
 */
export function buildAnnotations(outcome, station, basis, hotKey = null) {
  const s = station;
  const P = (x, y, z) => project({ x, y, z }, basis);
  const primitives = [];

  const hotDir = hotKey === 'face' || hotKey === 'path';
  const hotCurve = hotDir || hotKey === 'speed';
  const hotLaunch = hotKey === 'attack' || hotKey === 'dynLoft';

  const carry = outcome.m.carry;
  const side = outcome.m.side;
  const curve = outcome.m.curve;
  const apex = outcome.m.apex;
  const launchDir = outcome.deg.launchDir;
  const launchAng = outcome.deg.launchAng;
  const landAng = outcome.deg.landAng;
  const tanDir = Math.tan(launchDir * RAD);
  const path = outcome.path;

  // ── Apex (ordre §3 SIDE "Apex = gulldot på banens visuelle topp") ──
  if (s < 1.4) {
    let best = null, bestY = Infinity;
    for (let i = 4; i < path.length - 4; i++) {
      const q = project(path[i], basis);
      if (q && q.y < bestY) { bestY = q.y; best = q; }
    }
    if (best) {
      primitives.push({
        kind: 'apex', points: [best], tone: 'measure', alpha: 1,
        label: s < 1.35 ? `Apex ${Math.round(apex)} m` : null,
        labelAnchor: { x: best.x, y: best.y - 26 },
      });
    }
  }

  // ── TOP · retningsplanet (ordre §3 TOP, fader inn > ~1.25) ──
  const topA = smoothstep(clamp((s - 1.25) / 0.75, 0, 1));
  if (topA > 0.03) {
    const straightEnd = { x: carry, y: carry * tanDir, z: 0 };
    const landing = { x: carry, y: side, z: 0 };

    // kurve-sjikt: flate mellom startlinjen og faktisk bane
    const bandPts = [];
    let q = P(0, 0, 0); if (q) bandPts.push(q);
    for (let i = 1; i < path.length; i++) { q = P(path[i].x, path[i].y, 0); if (q) bandPts.push(q); }
    for (let i = path.length - 1; i >= 0; i--) { q = P(path[i].x, path[i].x * tanDir, 0); if (q) bandPts.push(q); }
    if (bandPts.length >= 3) {
      primitives.push({
        kind: 'band', points: bandPts, tone: 'measure',
        alphaFrom: 0.02 * topA, alphaTo: (hotCurve ? 0.34 : 0.20) * topA,
      });
    }

    // avviks-ticks ved 35/60/80 % (kurven vokser med t² — spinn virker over tid)
    const tickAlpha = topA * (hotCurve ? 0.95 : 0.6);
    for (const t of [0.35, 0.6, 0.8]) {
      const i = Math.round(t * (path.length - 1));
      const a = P(path[i].x, path[i].x * tanDir, 0);
      const b = P(path[i].x, path[i].y, 0);
      if (a && b) primitives.push({ kind: 'tick', points: [a, b], tone: 'measure', alpha: tickAlpha });
    }

    // startlinje (rett referanse, stiplet)
    const s0 = P(0, 0, 0), s1 = P(straightEnd.x, straightEnd.y, 0);
    if (s0 && s1) primitives.push({ kind: 'line', points: [s0, s1], tone: 'measure', alpha: topA * 0.75, dashed: true });

    // retningsbue ved ballen (r 26 m), uten etikett
    const dirArc = buildArc(basis,
      (a, m) => ({ x: Math.cos(a) * 26 * m, y: Math.sin(a) * 26 * m * sign(launchDir), z: 0 }),
      launchDir);
    if (dirArc) {
      primitives.push({
        kind: 'arc', points: dirArc.points, tick: dirArc.tick,
        tone: 'measure', alpha: topA, hot: hotDir, label: null, labelAnchor: null,
      });
      // «Launch dir ±X.X°»-etikett ligger på startlinjen ved ~52 % av carry
      if (topA > 0.1) {
        const lp = P(0.52 * straightEnd.x, 0.52 * straightEnd.y, 0);
        if (lp) primitives.push({
          kind: 'label', points: [lp], tone: 'measure', alpha: topA, hot: hotDir,
          label: `Launch dir ${fmtDeg(launchDir)}`, labelAnchor: lp,
        });
      }
    }

    // kurvemål — skjules når |curve| < 3 m
    if (Math.abs(curve) >= 3) {
      const a = P(straightEnd.x, straightEnd.y, 0), b = P(landing.x, landing.y, 0);
      if (a && b) primitives.push({
        kind: 'dimline', points: [a, b], tone: 'measure', alpha: topA, hot: hotCurve,
        label: `${Math.abs(Math.round(curve))} m curve`,
      });
    }

    // offline-brakett ved z = carry + 12
    {
      const a = P(carry + 12, 0, 0), b = P(carry + 12, side, 0);
      if (a && b) primitives.push({
        kind: 'dimline', points: [a, b], tone: 'measure', alpha: topA, hot: false,
        label: `${Math.abs(Math.round(side))} m ${side >= 0 ? 'R' : 'L'}`,
      });
    }
  }

  // ── SIDE · launchplanet (ordre §3 SIDE, bell rundt skalar 1) ──
  const sideA = smoothstep(clamp(1 - Math.abs(s - 1) * 1.7, 0, 1));
  if (sideA > 0.03) {
    // SIDE: launch/land angle as a clean labelled chip. buildArc still supplies
    // the anchor placement and the <0.3° guard; we render only the label — no
    // arc stroke rising into the chip (eier-ønske), full word «angle».
    const launchArc = buildArc(basis,
      (a, m) => ({ x: Math.cos(a) * 24 * m, y: 0, z: Math.sin(a) * 24 * m }),
      launchAng);
    if (launchArc) primitives.push({
      kind: 'label', tone: 'measure', alpha: sideA, hot: hotLaunch,
      label: `Launch angle ${launchAng.toFixed(1)}°`, labelAnchor: launchArc.labelAnchor,
    });

    const p2 = path[path.length - 1];
    const landArc = buildArc(basis,
      (a, m) => ({ x: p2.x - Math.cos(a) * 18 * m, y: p2.y, z: Math.sin(a) * 18 * m }),
      landAng);
    if (landArc) primitives.push({
      kind: 'label', tone: 'measure', alpha: sideA * 0.95, hot: hotLaunch,
      label: `Land angle ${Math.round(landAng)}°`, labelAnchor: landArc.labelAnchor,
    });
  }

  return primitives;
}

function lerpN(a, b, t) { return a + (b - a) * t; }

/**
 * Deterministisk etikett-kaskade (ordre §3 "Etikettplassering") +
 * kollisjonsregister. Stateless per kall — ingen tilstand mellom frames
 * (docs/systemkontrakt.md §7). `keepOut` er `{x0,y0,x1,y1}` når stats-
 * blokken står til venstre (regel 2 kan da slå inn), ellers `null`/`undefined`
 * (statsRight === true → regel 2 gjelder aldri, jf. ordre "OG stats står til
 * venstre"). Fast tegnerekkefølge er den rekkefølgen `primitives` allerede
 * står i (buildAnnotations returnerer apex → TOP → SIDE, dvs.
 * "grid → bane-etiketter" — ordre §3).
 */
export function placeLabels(primitives, keepOut, vbox) {
  const rects = [];
  const out = [];
  for (const prim of primitives) {
    if (!prim.label) { out.push(prim); continue; }
    const base = prim.kind === 'dimline'
      ? dimlineAnchor(prim.points[0], prim.points[1], prim.label, keepOut)
      : prim.labelAnchor;
    if (!base) { out.push(prim); continue; }
    const w = estWidth(prim.label);
    const placed = nudge(base, w, LABEL_H, rects);
    rects.push({ x: placed.x - w / 2, y: placed.y - LABEL_H / 2, w, h: LABEL_H });
    out.push({ ...prim, labelPos: placed });
  }
  return out; // vbox reservert for kaller-side off-screen-clamp; ikke i bruk (§3 spesifiserer ikke skjermkant-atferd)
}

/** ordre §3, regel 1–3, verbatim på A (indre/nær) → B (ytre/fjern). */
function dimlineAnchor(A, B, label, keepOut) {
  const lw = estWidth(label);
  const span = Math.hypot(B.x - A.x, B.y - A.y);
  if (span < SPAN_THRESHOLD) {
    const dx = sign(B.x - A.x);
    return { x: B.x + dx * (lw / 2 + LABEL_GAP), y: B.y };
  }
  const midX = (A.x + B.x) / 2;
  const midY = (A.y + B.y) / 2 + LABEL_DY;
  if (keepOut && (midX - lw / 2) < keepOut.x1 && midY > keepOut.y0 && midY < keepOut.y1) {
    const R = A.x >= B.x ? A : B;
    return { x: R.x + lw / 2 + LABEL_GAP, y: R.y };
  }
  return { x: midX, y: midY };
}

/** ordre §3: "kollisjonsregister per frame, vertikal nudge vekk fra overlapp, maks 3 iterasjoner". */
function nudge(pos, w, h, rects) {
  let { x, y } = pos;
  for (let k = 0; k < MAX_NUDGE_ITER; k++) {
    let moved = false;
    for (const r of rects) {
      if (x - w / 2 < r.x + r.w && x + w / 2 > r.x && y - h / 2 < r.y + r.h && y + h / 2 > r.y) {
        y = y <= r.y + r.h / 2 ? r.y - h / 2 - NUDGE_GAP : r.y + r.h + h / 2 + NUDGE_GAP;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return { x, y };
}

/**
 * Stats-flip (ordre §3 "Stats-flip"): hysterese-reduksjon, ren funksjon av
 * (forrige tilstand, station, side i meter) → ny tilstand. impact.html sin
 * `updateStats` kaller denne i stedet for å duplisere hysteresen inline —
 * én kilde for regelen, testbar uten DOM/canvas.
 */
export function statsFlip(prevRight, station, sideM) {
  if (!prevRight) return station > 1.1 && sideM < -28;
  return !(station < 0.9 || sideM > -14);
}

/**
 * Komet (ordre §3 "Komet"): ~2.9 s syklus + pause, kontinuerlig langs aktiv
 * bane. Ren funksjon av (Outcome, now) → verdenspunkt | null (null i pause-
 * fasen). Kalleren projiserer og tegner; kalleren sjekker også
 * `prefers-reduced-motion` FØR den kaller denne (ordre: "→ av" er en
 * on/off-beslutning på kallersiden, ikke en parameter her).
 */
export function cometPoint(outcome, now) {
  const cyc = (now / 2900) % 1.3;
  if (cyc > 1) return null;
  const t = smoothstep(cyc);
  const path = outcome.path;
  const idx = Math.min(path.length - 1, Math.floor(t * (path.length - 1)));
  return path[idx];
}
