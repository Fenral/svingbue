import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const iapUrl = pathToFileURL(resolve(ROOT, 'sa-iap.js')).href;
const accessUrl = pathToFileURL(resolve(ROOT, 'sa-access.js')).href;
const iapSource = readFileSync(resolve(ROOT, 'sa-iap.js'), 'utf8');
const shotsSource = readFileSync(resolve(ROOT, 'sa-shots.js'), 'utf8');
const termsSource = readFileSync(resolve(ROOT, 'terms.html'), 'utf8');
const privacySource = readFileSync(resolve(ROOT, 'privacy.html'), 'utf8');
const entitlement = active => ({ customerInfo: { entitlements: { active: active ? { pro: {} } : {} } } });

function installNative(adapter) {
  globalThis.window = {
    Capacitor: {
      isNativePlatform: () => true,
      getPlatform: () => 'ios',
    },
  };
  globalThis.__SA_IAP_NODE_TEST_ADAPTER__ = adapter;
}

function adapter({ offerings = [], purchase, restore, configure } = {}) {
  return {
    isConfigured: async () => ({ isConfigured: false }),
    configure: configure || (async () => {}),
    setLogLevel: async () => {},
    addCustomerInfoUpdateListener: async () => {},
    getCustomerInfo: async () => entitlement(false),
    getOfferings: async () => ({ current: { availablePackages: offerings } }),
    purchasePackage: purchase || (async () => entitlement(true)),
    restorePurchases: restore || (async () => entitlement(false)),
  };
}

async function freshIap(label, options) {
  installNative(adapter(options));
  return import(`${iapUrl}?phase4=${label}-${Date.now()}-${Math.random()}`);
}

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(key) || null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

test('protected product IDs and the hidden lifetime offering remain mapped for entitlement continuity', async () => {
  const iap = await freshIap('products');
  assert.deepEqual(iap.PRODUCT_IDS, {
    monthly: 'strikearc_pro_monthly',
    annual: 'strikearc_pro_annual',
    lifetime: 'strikearc_pro_lifetime',
  });
  const offerings = iap.mapOfferings({ current: { availablePackages: [
    { product: { identifier: iap.PRODUCT_IDS.monthly } },
    { product: { identifier: iap.PRODUCT_IDS.annual } },
    { product: { identifier: iap.PRODUCT_IDS.lifetime } },
  ] } });
  assert.equal(offerings.monthly.product.identifier, iap.PRODUCT_IDS.monthly);
  assert.equal(offerings.annual.product.identifier, iap.PRODUCT_IDS.annual);
  assert.equal(offerings.lifetime.product.identifier, iap.PRODUCT_IDS.lifetime);
});

test('shipping browsers expose no injectable purchase-adapter entitlement seam', () => {
  assert.doesNotMatch(iapSource, /__SA_IAP_TEST_ADAPTER__/);
  assert.match(iapSource, /process\.versions\?\.node/);
  assert.match(iapSource, /__SA_IAP_NODE_TEST_ADAPTER__/);
  assert.doesNotMatch(shotsSource, /(?:window|globalThis)\.__saShots/);
});

test('linked legal copy matches the two-tier paywall and preserves lifetime only for restoration', () => {
  assert.doesNotMatch(termsSource, /kr\s*(?:59|149|349)|Save\s*79%|available in three tiers/i);
  assert.match(termsSource, /two auto-renewing tiers/i);
  assert.match(termsSource, /Lifetime is not offered to new customers/i);
  assert.match(termsSource, /unlimited Range comparisons/i);
  assert.doesNotMatch(privacySource, /shot history/i);
  assert.doesNotMatch(privacySource, /buy (?:a |the )?lifetime unlock/i);
  assert.match(privacySource, /restore a previous lifetime unlock/i);
  assert.doesNotMatch(`${termsSource}\n${privacySource}`, /sa_pw_reopen/);
});

test('a lifetime owner restores through the protected Pro entitlement', async () => {
  const iap = await freshIap('lifetime-restore', {
    restore: async () => entitlement(true),
  });
  assert.deepEqual(await iap.restoreDetailed(), { status: iap.PURCHASE_STATUS.SUCCESS });
  assert.equal(iap.isPro(), true);
});

test('purchase and restore APIs expose cancellation, pending, error, and not-found as structured states', async () => {
  const monthly = { product: { identifier: 'strikearc_pro_monthly', priceString: 'kr 99' } };
  for (const [label, purchase, expected] of [
    ['cancelled', async () => { throw { readableErrorCode: 'PURCHASE_CANCELLED_ERROR' }; }, 'cancelled'],
    ['pending', async () => { throw { readableErrorCode: 'PAYMENT_PENDING_ERROR' }; }, 'pending'],
    ['error', async () => { throw new Error('store unavailable'); }, 'error'],
  ]) {
    const iap = await freshIap(label, { offerings: [monthly], purchase });
    assert.deepEqual(await iap.purchaseDetailed('monthly'), { status: expected });
  }
  const iap = await freshIap('not-found', { restore: async () => entitlement(false) });
  assert.deepEqual(await iap.restoreDetailed(), { status: iap.PURCHASE_STATUS.NOT_FOUND });
});

test('a cancelled or failed purchase can retry against the same offering and eventually unlock Pro', async () => {
  const monthly = { product: { identifier: 'strikearc_pro_monthly', priceString: 'kr 99' } };
  let attempts = 0;
  let offeringFetches = 0;
  const iap = await freshIap('purchase-retry', {
    offerings: [monthly],
    purchase: async ({ aPackage }) => {
      assert.equal(aPackage, monthly);
      attempts += 1;
      if (attempts === 1) throw { readableErrorCode: 'PURCHASE_CANCELLED_ERROR' };
      if (attempts === 2) throw new Error('transient store failure');
      return entitlement(true);
    },
  });
  globalThis.__SA_IAP_NODE_TEST_ADAPTER__.getOfferings = async () => {
    offeringFetches += 1;
    return { current: { availablePackages: [monthly] } };
  };

  assert.deepEqual(await iap.purchaseDetailed('monthly'), { status: iap.PURCHASE_STATUS.CANCELLED });
  assert.deepEqual(await iap.purchaseDetailed('monthly'), { status: iap.PURCHASE_STATUS.ERROR });
  assert.deepEqual(await iap.purchaseDetailed('monthly'), { status: iap.PURCHASE_STATUS.SUCCESS });
  assert.equal(iap.isPro(), true);
  assert.equal(attempts, 3);
  assert.equal(offeringFetches, 1);
});

test('placeholder production keys are an explicit external configuration blocker, never a fake store capability', async () => {
  globalThis.window = { Capacitor: { isNativePlatform: () => true, getPlatform: () => 'ios' } };
  delete globalThis.__SA_IAP_NODE_TEST_ADAPTER__;
  const iap = await import(`${iapUrl}?phase4=placeholder-${Date.now()}-${Math.random()}`);
  assert.equal(await iap.init(), 'configuration-missing');
  assert.equal(iap.getConfigurationStatus(), 'configuration-missing');
  assert.equal(await iap.getOfferings(), null);
  assert.deepEqual(await iap.purchaseDetailed('annual'), { status: iap.PURCHASE_STATUS.UNAVAILABLE });
  assert.deepEqual(await iap.restoreDetailed(), { status: iap.PURCHASE_STATUS.UNAVAILABLE });
});

test('a transient RevenueCat initialization failure can retry without an app restart', async () => {
  let attempts = 0;
  const iap = await freshIap('retry-sdk', {
    configure: async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('native bridge starting');
    },
  });
  assert.equal(await iap.init(), 'sdk-error');
  assert.equal(await iap.init(), 'ready');
  assert.equal(attempts, 2);
});

test('access quotas are native-only, completion-bound, and bypassed only by an active Pro entitlement', async () => {
  const access = await import(`${accessUrl}?phase4=${Date.now()}-${Math.random()}`);
  const storage = new MemoryStorage();
  assert.equal(access.FREE_LIMITS['instrument-shot'], 10);
  assert.equal(access.FREE_LIMITS['guided-experiment'], 1);
  assert.equal(access.FREE_LIMITS['guide-answer'], 5);
  assert.equal(access.authorize('pro-history', { native: true, storage }).allowed, false);
  assert.equal(access.consume('guided-experiment', { native: true, storage, completed: false }).consumed, false);
  assert.equal(access.consume('guided-experiment', { native: true, storage, completed: true }).consumed, true);
  assert.equal(access.authorize('guided-experiment', { native: true, storage }).allowed, false);
  assert.equal(access.authorize('guided-experiment', { native: true, pro: true, storage }).reason, 'pro-bypass');
});
