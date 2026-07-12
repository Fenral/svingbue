// thread.mjs — SINGLE SOURCE OF TRUTH for the StrikeArc App Store poster series (v2).
// The whole 9-shot gallery is ONE golf-ball flight: a faint dashed ember thread
// launches at the tee in shot 1, arcs edge-to-edge through every canvas, apexes
// ACROSS the two 3D-panorama slots (shots 5–6), and lands in shot 9. Continuity
// law (verified by the rig):
//   thread exit-fraction of shot N === entry-fraction of shot N+1.
// Fractions are of each canvas's OWN height, so seams line up when the gallery is
// laid out at equal height (the contact sheet). ESM — imported by both shoot.mjs
// (Node) and canvas.js (browser <script type=module>); no Node-only APIs.
//
// v2 changes (REVISJON v2): 8→9 shots, ALL PORTRAIT (the old landscape 3D shot
// became the two-slot PANORAMA). New parabola: apex at X=4.5 (mid-panorama), tee
// in shot 1, landing in shot 9. Thread constants live here; the visual weight
// (thicker ×~1.7 + warm glow) lives in canvas.css.

// ── Apple store pixel masters (Apple rejects ±1px) ──────────────────────────
export const PORTRAIT  = { w: 1290, h: 2796 };
export const SIZE = (_shot) => PORTRAIT;               // every shot is portrait now
// Panorama master: two portrait slots wide, sliced on the app's own pane divider.
export const PANORAMA = { w: 2580, h: 2796 };

// ── Palette (dusk canvas system + Ultraviolet-Ember tokens) ─────────────────
export const PAL = {
  bgTop:   '#0A0818',   // dusk ramp top
  bgBot:   '#241B44',   // dusk ramp bottom
  ink:     '#EDEAF7',   // headline ink-white
  muted:   '#A79FC7',   // Inter subline muted violet
  ember:   '#FF8A4D',   // the hero heat
  emberHot:'#FFF3E8',   // white-hot tip
  violet:  '#9D8BFF',   // secondary chrome
  gold:    '#E3C468',   // annotation / etched-instrument
};

// ── The flight parabola ─────────────────────────────────────────────────────
// Global X runs 0..9; shot i occupies X in [i-1, i]. Apex at X=4.5 (the middle of
// the panorama, which spans X in [4,6] = shots 5+6). Height h(X) in [0,1]; A=4.0
// puts h=0 (ground) at X=0.5 (the tee, in shot 1) and X=8.5 (the landing, shot 9).
const APEX_X = 4.5, A = 4.0;
const Y_GROUND = 0.82, Y_APEX = 0.24;   // fractions of canvas height
const clamp01 = (v) => Math.max(0, Math.min(1, v));

export const heightAt = (X) => clamp01(1 - Math.pow((X - APEX_X) / A, 2));
export const yFracAt  = (X) => Y_GROUND - heightAt(X) * (Y_GROUND - Y_APEX);

export const TEE_X = 0.5;   // launch point (shot 1, local x = 0.5)
export const LAND_X = 8.5;  // landing point (shot 9, local x = 0.5)

// Entry (left edge, X=i-1) and exit (right edge, X=i) height-fraction per shot.
export function entryExit(shot) {
  return { entryY: yFracAt(shot - 1), exitY: yFracAt(shot) };
}

// Core sampler: X in [x0,x1] mapped so global-X `originX` sits at localX 0 and
// `spanX` global units fill `width` px. Returns {x,y} points in PIXELS.
function samplePts(x0, x1, originX, spanX, width, height, steps) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const X = x0 + (x1 - x0) * (i / steps);
    pts.push({ x: ((X - originX) / spanX) * width, y: yFracAt(X) * height });
  }
  return pts;
}

// Smooth SVG path "d" (Catmull-Rom→Bézier) through sampled points.
function pathFromPoints(p) {
  if (p.length < 2) return '';
  let d = `M ${p[0].x.toFixed(2)} ${p[0].y.toFixed(2)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

// One shot's thread segment (points, px). Shot 1 starts at the tee (X=0.5); shot 9
// ends at the landing (X=8.5) — otherwise the full left→right edge span.
export function threadPoints(shot, width, height, steps = 48) {
  const x0 = shot === 1 ? TEE_X : shot - 1;
  const x1 = shot === 9 ? LAND_X : shot;
  return samplePts(x0, x1, shot - 1, 1, width, height, steps);
}
export function threadPathD(shot, width, height, steps = 48) {
  return pathFromPoints(threadPoints(shot, width, height, steps));
}

// THE PANORAMA (shots 5+6 as ONE 2580-wide master): X in [4,6] across the full
// width. Drawn ONCE, then the PNG is sliced at x=width/2 → the seam is guaranteed
// pixel-identical between the two slots. Apex (X=4.5) sits at x = width/4.
export function panoramaPathD(width, height, steps = 96) {
  return pathFromPoints(samplePts(4, 6, 4, 2, width, height, steps));
}

// Point (px) where a shot's single travelling ember ball sits ON the thread.
// Used where the UI itself carries no hero ember (shot 4 / shot 9 landing).
export function ballAt(shot, width, height, atX) {
  const X = atX ?? (shot - 0.5);
  return { x: (X - (shot - 1)) * width, y: yFracAt(X) * height };
}

// The nine Norwegian headlines (REVISJON v2: outcome language, substance sublines
// on 2/3/7, Fraunces stays the "ikke enda en golf-app" signature). English UI in
// the shots; Norwegian headlines for den nysgjerrige norske golferen.
export const HEADLINES = {
  1: { h: 'Golf, etter mørkets frembrudd.', sub: '' },
  2: { h: 'Lek med ekte fysikk.',           sub: 'Dra — modellen svarer live.' },
  3: { h: 'Se hvorfor. Ikke gjett.',        sub: 'Ekte D-Plane-fysikk.' },
  4: { h: 'Modellér treffet ditt.',         sub: '' },
  5: { h: 'Mikroskopet for svingen din.',   sub: '' },   // panorama · left  (the strike)
  6: { h: 'Se svingen i 3D.',               sub: '' },   // panorama · right (the flight)
  7: { h: 'Lær instrumentet.',              sub: '24 leksjoner.' },
  8: { h: 'Sammenlign. Forstå. Gjenta.',    sub: '' },
  9: { h: 'Kveldens drill venter.',         sub: '' },
};

export const SHOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
// Panorama occupies these two slots (one master → two slices).
export const PANO_SLOTS = [5, 6];
