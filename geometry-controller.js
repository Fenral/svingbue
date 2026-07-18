/**
 * GEOMETRY P1 — controller plane (systemkontrakt-geometry.md §3).
 * Pure functions between the UI and the motor. NO physics here: the
 * direction→low-point coupling lives INSIDE the motor (effectiveLpx) —
 * this module only mirrors/inverts it so the UI can display and clamp.
 *
 * UI semantics (kontrakt §3.1): the shown/controlled "LOW POINT X" is
 * uiLow ≡ effectiveLpx(state) in cm. The stored motor input stays
 * state.lowPoint.x (the golfer's stance).
 */

import {
  RADIUS, clamp, effectiveLpx, LP_AHEAD_MIN, LP_AHEAD_MAX,
} from './swing-parameters-and-impact.js';

export const UI_LOW_MAX_CM = 15;

// 0-detent snap windows per lens (ordre §Segmentkontroll). Plane: none.
export const DETENT = { plane: 0, dir: 0.35, low: 0.9, arc: 0.3 };

// clubContext lookup (kontrakt §6) — ALL club-dependent logic reads from
// here, no iron assumptions in components. Driver stays behind the flag
// (toggle not rendered in P1); values ready for the asset landing.
// Iron pure zone binds to the MOTOR constants (+2..+15 cm) — kontrakt §4
// flags the mock's +2..+10 as superseded by the motor.
export const CLUBS = {
  iron:   { pureZoneCm: [LP_AHEAD_MIN * 100, LP_AHEAD_MAX * 100], teeCm: 0 },
  driver: { pureZoneCm: [-12, -3], teeCm: 3 },
};

// Spring smoothing (kontrakt §5): time-based τ so 120 Hz matches the mock's
// 0.18/frame@60Hz response. alpha = 1 − exp(−dt/τ).
export const TAU_MS = 84;
export const springAlpha = dtMs => 1 - Math.exp(-dtMs / TAU_MS);

// The motor's own coupling coefficient, m per degree of swingDirection —
// derived from the same expression effectiveLpx uses (R·cosφ·π/180), never
// a second formula tuned independently.
export const towPerDegM = (planeAngle, radius = RADIUS) =>
  radius * Math.cos((planeAngle * Math.PI) / 180) * (Math.PI / 180);

// uiLow (cm) — the shown/controlled LOW POINT X (kontrakt §3.1).
export const uiLowCm = state => effectiveLpx(state) * 100;

// Inverse: the stance lowPoint.x (m) that makes effectiveLpx equal uiLow.
export const lowXForUiLow = (uiLowCmVal, state) =>
  uiLowCmVal / 100 + state.swingDirection * towPerDegM(state.planeAngle, state.radius);

// Rail clamp (kontrakt §3.1): uiLow is clamped to ±15 cm in the controller;
// when the limit is hit under direction/plane drag the CALLER writes
// lowXForUiLow(result.uiLow) back into state.lowPoint.x and emits the
// rail pulse. The motor is never touched.
export function clampUiLow(uiLowCmVal) {
  const c = clamp(uiLowCmVal, -UI_LOW_MAX_CM, UI_LOW_MAX_CM);
  return { uiLow: c, railed: c !== uiLowCmVal };
}

// 0-detent: values inside the window snap to exactly 0.
export const detentSnap = (v, win) => (win > 0 && Math.abs(v) <= win ? 0 : v);
