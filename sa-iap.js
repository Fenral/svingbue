/* Flightglass RevenueCat adapter.
   This module is the only place that knows about the native purchase SDK.
   Shipping UI consumes structured outcomes so cancellation is never presented
   as an error and missing store configuration never becomes a fake purchase. */

import {
  Purchases as RevenueCatPurchases,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
} from './vendor/revenuecat/purchases.esm.js';
import * as saShots from './sa-shots.js';

export const ENTITLEMENT_ID = 'pro';
export const PRODUCT_IDS = Object.freeze({
  monthly: 'strikearc_pro_monthly',
  annual: 'strikearc_pro_annual',
  lifetime: 'strikearc_pro_lifetime',
});

// Public app-specific SDK keys only. These placeholders deliberately keep a
// native build purchase-disabled until the real RevenueCat project is wired.
const PUBLIC_KEYS = Object.freeze({
  ios: 'appl_REPLACE_ME',
  android: 'goog_REPLACE_ME',
});

export const PURCHASE_STATUS = Object.freeze({
  SUCCESS: 'success',
  CANCELLED: 'cancelled',
  PENDING: 'pending',
  ERROR: 'error',
  UNAVAILABLE: 'unavailable',
  NOT_FOUND: 'not-found',
});

let pluginReady = false;
let initPromise = null;
let configurationStatus = 'not-initialized';
let cachedPackages = null;

// Node contract tests may inject a purchase adapter. Browsers and Capacitor do
// not expose Node's process.versions.node, so this seam cannot become a native
// entitlement path in a shipping WebView.
function purchaseAdapter() {
  const nodeRuntime = typeof process !== 'undefined' && Boolean(process.versions?.node);
  if (nodeRuntime && globalThis.__SA_IAP_NODE_TEST_ADAPTER__) {
    return globalThis.__SA_IAP_NODE_TEST_ADAPTER__;
  }
  return RevenueCatPurchases;
}

function isTestAdapter(adapter) {
  return adapter !== RevenueCatPurchases;
}

export function isNative() {
  return Boolean(
    typeof window !== 'undefined'
    && window.Capacitor?.isNativePlatform?.(),
  );
}

function configuredKey(platform, adapter) {
  if (isTestAdapter(adapter)) return 'test_public_sdk_key';
  return PUBLIC_KEYS[platform] || '';
}

function keyIsReady(key) {
  return Boolean(key && !key.includes('REPLACE_ME'));
}

/** True when the RevenueCat payload grants the protected Pro entitlement.
 * Lifetime owners restore through the same entitlement; the product itself
 * remains hidden from the v1 paywall rather than being deleted here. */
export function entitlementActive(customerInfo) {
  return Boolean(customerInfo?.entitlements?.active?.[ENTITLEMENT_ID]);
}

function applyCustomerInfo(customerInfo) {
  const active = entitlementActive(customerInfo);
  saShots.setPro(active);
  return active;
}

async function initialize() {
  if (!isNative()) {
    configurationStatus = 'web-preview';
    saShots.setPro(false);
    return configurationStatus;
  }

  const adapter = purchaseAdapter();
  const platform = window.Capacitor?.getPlatform?.() || 'web';
  const apiKey = configuredKey(platform, adapter);
  if (!keyIsReady(apiKey)) {
    configurationStatus = 'configuration-missing';
    pluginReady = false;
    saShots.setPro(false);
    return configurationStatus;
  }

  try {
    let alreadyConfigured = false;
    try { alreadyConfigured = Boolean((await adapter.isConfigured?.())?.isConfigured); } catch (_) {}
    if (!alreadyConfigured) await adapter.configure({ apiKey });
    pluginReady = true;
    configurationStatus = 'ready';

    try { await adapter.setLogLevel?.({ level: LOG_LEVEL.WARN }); } catch (_) {}
    try {
      await adapter.addCustomerInfoUpdateListener?.((info) => applyCustomerInfo(info));
    } catch (_) {}

    try {
      const result = await adapter.getCustomerInfo();
      applyCustomerInfo(result?.customerInfo);
    } catch (_) {
      // RevenueCat maintains its own customer-info cache. A transient fetch
      // failure must not overwrite an entitlement already delivered by its
      // listener during this session.
    }
  } catch (_) {
    pluginReady = false;
    configurationStatus = 'sdk-error';
    saShots.setPro(false);
  }
  return configurationStatus;
}

/** Idempotent native setup; safe to await from every shipping route. */
export function init() {
  if (!initPromise) initPromise = initialize();
  return initPromise;
}

export function getConfigurationStatus() {
  return configurationStatus;
}

export function isPro() {
  return saShots.isPro();
}

export function mapOfferings(response) {
  const packages = response?.current?.availablePackages || [];
  const mapped = {};
  for (const [tier, productId] of Object.entries(PRODUCT_IDS)) {
    mapped[tier] = packages.find((item) => item?.product?.identifier === productId);
  }
  return mapped;
}

/** Returns RevenueCat packages for all protected IDs, including lifetime for
 * entitlement continuity. UI is responsible for rendering only monthly and
 * annual. */
export async function getOfferings() {
  await init();
  if (!isNative() || !pluginReady) return null;
  try {
    cachedPackages = mapOfferings(await purchaseAdapter().getOfferings());
    return cachedPackages;
  } catch (_) {
    return null;
  }
}

function isCancellation(error) {
  const code = String(error?.code ?? error?.errorCode ?? '');
  const readable = String(error?.readableErrorCode ?? '');
  return error?.userCancelled === true
    || code === String(PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR)
    || readable === 'PURCHASE_CANCELLED_ERROR';
}

function isPending(error) {
  const code = String(error?.code ?? error?.errorCode ?? '');
  const readable = String(error?.readableErrorCode ?? '');
  return code === String(PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR)
    || readable === 'PAYMENT_PENDING_ERROR';
}

export async function purchaseDetailed(tier) {
  await init();
  if (!['monthly', 'annual'].includes(tier) || !isNative() || !pluginReady) {
    return { status: PURCHASE_STATUS.UNAVAILABLE };
  }

  const offerings = cachedPackages || await getOfferings();
  const aPackage = offerings?.[tier];
  if (!aPackage) return { status: PURCHASE_STATUS.UNAVAILABLE };

  try {
    const result = await purchaseAdapter().purchasePackage({ aPackage });
    if (applyCustomerInfo(result?.customerInfo)) {
      return { status: PURCHASE_STATUS.SUCCESS };
    }
    return { status: PURCHASE_STATUS.ERROR };
  } catch (error) {
    if (isCancellation(error)) return { status: PURCHASE_STATUS.CANCELLED };
    if (isPending(error)) return { status: PURCHASE_STATUS.PENDING };
    return { status: PURCHASE_STATUS.ERROR };
  }
}

export async function restoreDetailed() {
  await init();
  if (!isNative() || !pluginReady) {
    return { status: PURCHASE_STATUS.UNAVAILABLE };
  }
  try {
    const result = await purchaseAdapter().restorePurchases();
    return applyCustomerInfo(result?.customerInfo)
      ? { status: PURCHASE_STATUS.SUCCESS }
      : { status: PURCHASE_STATUS.NOT_FOUND };
  } catch (_) {
    return { status: PURCHASE_STATUS.ERROR };
  }
}

// Backwards-compatible boolean methods for the legacy non-v1 geometry page.
export async function purchase(tier) {
  return (await purchaseDetailed(tier)).status === PURCHASE_STATUS.SUCCESS;
}

export async function restore() {
  return (await restoreDetailed()).status === PURCHASE_STATUS.SUCCESS;
}

if (typeof window !== 'undefined') {
  window.__sa = window.__sa || {};
  window.__sa.iap = {
    init,
    isPro,
    getOfferings,
    purchase,
    purchaseDetailed,
    restore,
    restoreDetailed,
    getConfigurationStatus,
  };
}
