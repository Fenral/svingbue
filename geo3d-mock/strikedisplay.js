/**
 * SIDE-LAYER strike-height DISPLAY classification — MOCK round 3 (task 2).
 *
 * The production engine's strikeQuality() band boundaries stay untouched
 * (swing-parameters-and-impact.js is byte-identical, shared with impact.html).
 * This module re-maps the CONTACT HEIGHT to golfer-honest DISPLAY bands for
 * every mock surface that shows a verdict (strike-detail inset chip + foot,
 * face-zoom freeze chip, #sceneData live region, ball tick, impact FX).
 *
 * WHY (owner report, round 3, confirmed by a numeric truth table over the
 * real engine — see the round-3 task report):
 *   (a) The engine's Pure window spans clubZ ∈ [0, 1.0r] (r = ball radius):
 *       a club whose sweet spot passes 0.6 mm above the TURF (contact at the
 *       very bottom of the ball, "21 mm low") still read PURE. Real pure is
 *       ball-first and only slightly below the ball's centre — a near-sole
 *       scrape is a thin/skulled strike.
 *   (b) The engine calls clubZ > 1.4r "Whiff (no contact)" — but the ball's
 *       top is at 2.0r, so for clubZ ∈ (1.4r, 2.0r] the face still visibly
 *       overlaps the ball (the inset drew the contact line ON the ball while
 *       the label said "no contact"). A genuine miss is only clubZ > 2.0r.
 *
 * DISPLAY bands (h = clubBallContact().clubZ, r = BALL_RADIUS_M;
 * ball centre at 1.0r, ball top at 2.0r):
 *   h < −25 mm            → Duff  (club digs deep behind the ball)
 *   −25 mm ≤ h < 0        → Fat   (turf before ball)
 *   0 ≤ h < r − 10 mm     → Thin  (contact very low on the ball — scraped/skulled)
 *   r − 10 mm ≤ h ≤ r + 3 mm
 *        with low point ahead (engine window +2..+15 cm) → Pure
 *        with low point behind the ball (xLP < 0)        → Fat (ground-first)
 *        with low point ahead but outside the window     → Thin (shallow)
 *   r + 3 mm < h ≤ 1.5r   → Thin  (contact above centre — bladed)
 *   1.5r < h ≤ 2.0r       → Top   (topped — catches the top half of the ball)
 *   h > 2.0r              → Whiff (the face never overlaps the ball — the ONLY
 *                                  band displayed as "no contact")
 *
 * pct is still COMPUTED by the engine (harmless — used for the ball-tick
 * colour ramp) but is never DISPLAYED anywhere in this mock (task 1).
 */
import { clubBallContact, strikeQuality, effectiveLpx, BALL_RADIUS_M } from '../swing-parameters-and-impact.js';

export const PURE_LO_M = BALL_RADIUS_M - 0.010; // contact >10 mm below centre = too low for pure
export const PURE_HI_M = BALL_RADIUS_M + 0.003; // contact >3 mm above centre = thin
export const TOP_LO_M  = BALL_RADIUS_M * 1.5;   // contact in the ball's top quarter = topped
export const MISS_M    = BALL_RADIUS_M * 2;     // sweet-spot path clears the ball entirely

// mirror of the engine's (non-exported) low-point-ahead window — keep in sync.
const LP_AHEAD_MIN = 0.02;
const LP_AHEAD_MAX = 0.15;

// colours reuse the engine's palette (textColor tuned for ≥4.5:1 on #0A0E12);
// Top joins the red family — it is the worst contact short of a miss.
const STYLE = {
  Pure:  { color: '#22C55E', textColor: '#4ADE80' },
  Thin:  { color: '#EAB308', textColor: '#FBBF24' },
  Fat:   { color: '#A16207', textColor: '#FBBF24' },
  Top:   { color: '#DC2626', textColor: '#F87171' },
  Duff:  { color: '#DC2626', textColor: '#F87171' },
  Whiff: { color: '#DC2626', textColor: '#F87171' },
};
const LABEL = { Pure: 'Pure', Thin: 'Thin', Fat: 'Fat', Top: 'Topped', Duff: 'Duff', Whiff: 'Whiff' };
// the fx layer (geo3d-mock/fx.js) only knows the engine's five band names;
// a topped strike is real ball contact, so it fires the Thin choreography.
const FX_BAND = { Pure: 'Pure', Thin: 'Thin', Fat: 'Fat', Top: 'Thin', Duff: 'Duff', Whiff: 'Whiff' };

export function strikeDisplay(state) {
  const sq = strikeQuality(state); // engine verdict (pct kept for colour ramps)
  const ct = clubBallContact(state);
  const h = ct.clubZ;
  const xLP = effectiveLpx(state);
  const lpAhead = xLP >= LP_AHEAD_MIN && xLP <= LP_AHEAD_MAX;
  let band;
  if (h < -0.025) band = 'Duff';
  else if (h < 0) band = 'Fat';
  else if (h > MISS_M) band = 'Whiff';
  else if (h > TOP_LO_M) band = 'Top';
  else if (h > PURE_HI_M) band = 'Thin';
  else if (xLP < 0) band = 'Fat';           // ground-first tendency (engine logic)
  else if (h < PURE_LO_M) band = 'Thin';    // very low on the ball — never pure
  else if (!lpAhead) band = 'Thin';         // shallow: low point not ahead enough
  else band = 'Pure';
  const contact = band !== 'Whiff';
  return {
    band,                               // display band key: Pure|Thin|Fat|Top|Duff|Whiff
    label: LABEL[band],                 // sentence-case for the inset chip/foot
    chip: LABEL[band].toUpperCase(),    // face-zoom freeze chip (label alone — no %)
    announce: band === 'Whiff' ? 'whiff, no contact' : LABEL[band].toLowerCase(),
    contact,                            // false ONLY when the face never overlaps the ball
    fxBand: FX_BAND[band],
    color: STYLE[band].color,
    textColor: STYLE[band].textColor,
    clubZ: h,
    offset: ct.offset,
    offsetRatio: ct.offsetRatio,
    missMm: contact ? null : (h - MISS_M) * 1000, // clearance above the ball top
    engineBand: sq.band,
    pct: sq.pct,                        // computed, never displayed
  };
}
