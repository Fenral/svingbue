/* ══════════════════════════════════════════════════════════════════════════
   sa-iap.js — StrikeArc in-app-purchase module (RevenueCat, ESM).
   Imported with `<script type="module">` from the paywall UI.

   Ported from Ryddy's src/lib/iap.js (repo Fenral/ukeplan-olufsborg7), adapted
   to StrikeArc's 3-tier freemium design (monthly / annual / lifetime, no
   trial) and to this repo's no-bundler / vendored-import conventions.

   Platform:
     • web (no window.Capacitor.isNativePlatform()) → NEVER calls
       Purchases.configure. init() just pushes pro=false into sa-shots and
       returns. This keeps the Vercel preview build free of any RC traffic.
     • native (Capacitor iOS/Android) → Purchases.configure() with a
       platform-specific API key, a customerInfo listener keeps sa-shots'
       `_pro` flag (and a localStorage cache) in sync with the "pro"
       entitlement at all times — including renewals/expiries that happen
       while the app is in the background.

   Imports are RELATIVE ONLY (never a bare specifier / import map) — a bare
   import crashes the native Capacitor WKWebView. See vendor/revenuecat/.

   Public API (contract — see NATIVE.md / task spec):
     ENTITLEMENT_ID          'pro'
     init()                  async, idempotent-ish (safe to call once at boot)
     isPro()                 boolean, mirrors sa-shots.isPro()
     getOfferings()          async → {monthly?, annual?, lifetime?} | null
     purchase(tier)          async → boolean (true iff 'pro' active after)
     restore()               async → boolean (true iff 'pro' active after)

   window.__sa.iap exposes the same 5 functions for console testing.
   ══════════════════════════════════════════════════════════════════════════ */

import { Purchases, LOG_LEVEL } from './vendor/revenuecat/purchases.esm.js';
import * as saShots from './sa-shots.js';

export const ENTITLEMENT_ID = 'pro';

// RevenueCat public SDK keys — PLACEHOLDERS. The RevenueCat "StrikeArc"
// project does not exist yet; replace these once it's created (RevenueCat
// dashboard → Project settings → API keys → Public app-specific key).
// NEVER put a secret/private RevenueCat key here — only the public SDK key.
const API_KEY_IOS = 'appl_REPLACE_ME';
const API_KEY_ANDROID = 'goog_REPLACE_ME';

// Product identifiers as configured in App Store Connect / Play Console and
// mirrored in the RevenueCat offering.
const PRODUCT_ID = {
  monthly: 'strikearc_pro_monthly',
  annual: 'strikearc_pro_annual',
  lifetime: 'strikearc_pro_lifetime',
};

const CACHE_KEY = 'sa_pro_v1';

let _pluginReady = false;
let _cachedOfferings = null;

function isNative() {
  return !!(typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}

function cachePro(active) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ active: !!active, t: Date.now() }));
  } catch (e) { /* storage full/blocked → ignore, in-memory state still correct */ }
}

/** true iff the RevenueCat entitlements payload has ENTITLEMENT_ID active. */
function entitlementActive(customerInfo) {
  return !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
}

function applyCustomerInfo(customerInfo) {
  const active = entitlementActive(customerInfo);
  saShots.setPro(active);
  cachePro(active);
  return active;
}

/**
 * init — call once at app boot. Web: no-op fallback (pro=false, no RC
 * traffic). Native: configure RevenueCat with the platform's public SDK key,
 * wire a customerInfo listener so entitlement changes (purchase, renewal,
 * expiry, restore from another device) always flow into sa-shots, and fetch
 * the current customerInfo once to establish known state at launch. Never
 * throws — any RC/plugin failure degrades gracefully to pro=false.
 */
export async function init() {
  if (!isNative()) {
    saShots.setPro(false);
    return;
  }

  try {
    const platform = window.Capacitor.getPlatform ? window.Capacitor.getPlatform() : 'web';
    const apiKey = platform === 'ios' ? API_KEY_IOS : API_KEY_ANDROID;

    await Purchases.configure({ apiKey });
    _pluginReady = true;

    try {
      await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
    } catch (e) { /* older platform without setLogLevel — non-fatal */ }

    try {
      await Purchases.addCustomerInfoUpdateListener((info) => {
        applyCustomerInfo(info);
      });
    } catch (e) { /* listener registration failed — entitlement still checked below/on purchase/restore */ }

    try {
      const { customerInfo } = await Purchases.getCustomerInfo();
      applyCustomerInfo(customerInfo);
    } catch (e) {
      // Keep whatever cached pro-state sa-shots already has rather than
      // forcing false — a transient network failure shouldn't lock out an
      // already-entitled user.
    }
  } catch (e) {
    _pluginReady = false;
    saShots.setPro(false);
  }
}

/** Mirrors sa-shots' current pro flag — the single source of truth. */
export function isPro() {
  return saShots.isPro();
}

/**
 * getOfferings — fetch the current RevenueCat offering and map its packages
 * to {monthly, annual, lifetime} by product identifier. Returns null on web,
 * if RC isn't configured, or on any fetch error.
 */
export async function getOfferings() {
  if (!isNative() || !_pluginReady) return null;
  try {
    const res = await Purchases.getOfferings();
    _cachedOfferings = res;
    const pkgs = res?.current?.availablePackages || [];
    const out = {};
    for (const [tier, productId] of Object.entries(PRODUCT_ID)) {
      out[tier] = pkgs.find((p) => p?.product?.identifier === productId) || undefined;
    }
    return out;
  } catch (e) {
    return null;
  }
}

async function findPackage(tier) {
  const offerings = await getOfferings();
  return offerings ? offerings[tier] : null;
}

/**
 * purchase — buy the given tier ('monthly'|'annual'|'lifetime'). Resolves to
 * whether the 'pro' entitlement is active afterwards. Never throws — a
 * cancelled purchase or any RC error resolves to `false` rather than
 * rejecting, so callers never need a try/catch around this.
 */
export async function purchase(tier) {
  if (!isNative() || !_pluginReady) return false;
  try {
    const aPackage = await findPackage(tier);
    if (!aPackage) return false;
    const res = await Purchases.purchasePackage({ aPackage });
    return applyCustomerInfo(res?.customerInfo);
  } catch (e) {
    // User cancellation or store error — must not throw uncaught.
    return isPro();
  }
}

/**
 * restore — restore prior purchases. Resolves to whether 'pro' is active
 * afterwards. Never throws.
 */
export async function restore() {
  if (!isNative() || !_pluginReady) return false;
  try {
    const res = await Purchases.restorePurchases();
    return applyCustomerInfo(res?.customerInfo);
  } catch (e) {
    return isPro();
  }
}

// Convenience for testing from the console / native debug builds.
if (typeof window !== 'undefined') {
  window.__sa = window.__sa || {};
  window.__sa.iap = { init, isPro, getOfferings, purchase, restore };
}
