// sa-shots.js — StrikeArc freemium "free shots" gate.
//
// Design (locked): the app is free for the first 10 "shots", then a HARD
// paywall. One shot = one PLAYED ball-flight (impact.html) OR one PLAYED
// swing (geometry.html). Slider drags do NOT count; replays of the SAME shot
// do NOT count (the caller decides "is this a new shot" before recordShot()).
// A single global counter is shared across both pages (same localStorage
// origin), so 6 flights in Impact + 4 swings in Geometry = 10 used.
//
// The counter is a SOFT gate stored in localStorage: the REAL entitlement is
// RevenueCat's server-side "pro" (set via setPro() from sa-iap.js). If the
// counter is ever evicted/reset, a free user merely re-earns 10 free shots —
// no PAID content leaks, because unlimited access is granted by `_pro`, not by
// the counter. On the web build (svingbue.vercel.app) there is no StoreKit, so
// sa-iap never flips _pro and the paywall/nudge simply never trigger there —
// EXCEPT we also expose isWeb() so callers can suppress gating entirely off
// native (keeps the marketing/preview site fully open).

const KEY = 'sa_shots_v1';
export const FREE_LIMIT = 10;
const NUDGE_REMAINING = 2; // start showing "N free shots left" when <= 2 remain (i.e. from shot 8)

// Pro state is pushed in by sa-iap.js (RevenueCat entitlement "pro"). Defaults
// to false; on the web build it stays false but isWeb() short-circuits gating.
let _pro = false;

/** Called by sa-iap.js whenever the RevenueCat "pro" entitlement changes. */
export function setPro(v) { _pro = !!v; }
export function isPro() { return _pro; }

/** True on the Vercel web build (no Capacitor native shell) — gating is OFF there. */
export function isWeb() {
  return !(typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}

export function shotsUsed() {
  try {
    const n = parseInt(localStorage.getItem(KEY) || '0', 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch (e) { return 0; }
}

export function remaining() {
  return Math.max(0, FREE_LIMIT - shotsUsed());
}

/**
 * Record one consumed shot. No-op for pro users, on the web build, or once the
 * limit is already reached (the gate stops further plays anyway). Returns the
 * new used-count. Callers MUST only call this for a genuinely NEW shot (not a
 * replay of identical parameters) — see impact.html noteFlight()/isNewRun.
 */
export function recordShot() {
  if (_pro || isWeb()) return shotsUsed();
  const n = shotsUsed() + 1;
  try { localStorage.setItem(KEY, String(n)); } catch (e) { /* storage full/blocked → stay soft */ }
  return n;
}

/** True when the next NEW shot must be blocked by the paywall. */
export function shouldGate() {
  if (_pro || isWeb()) return false;
  return shotsUsed() >= FREE_LIMIT;
}

/**
 * True when the discreet "N free shots left" nudge pill should show — only in
 * the tail of the free window (from shot 8), never for pro users / on web, and
 * never once gated (remaining 0 → the paywall is what shows instead).
 */
export function shouldNudge() {
  if (_pro || isWeb()) return false;
  const left = remaining();
  return left >= 1 && left <= NUDGE_REMAINING;
}

/** Reset the free counter (dev/testing, or after a successful unlock). */
export function reset() {
  try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
}

// Convenience for non-module callers / quick console testing.
if (typeof window !== 'undefined') {
  window.__saShots = { FREE_LIMIT, setPro, isPro, isWeb, shotsUsed, remaining, recordShot, shouldGate, shouldNudge, reset };
}
