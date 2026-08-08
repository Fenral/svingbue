/* Flightglass Pro paywall.
   The caller owns the value-moment decision. This module owns a truthful,
   accessible purchase surface and never opens itself on cold launch. */

import * as saIap from './sa-iap.js';
import { track } from './sa-analytics.js';

const PLANS = Object.freeze([
  Object.freeze({ id: 'monthly', name: 'Monthly', fallback: 'kr 99', period: 'per month' }),
  Object.freeze({ id: 'annual', name: 'Annual', fallback: 'kr 590', period: 'per year', recommended: true }),
]);

const SOURCE_COPY = Object.freeze({
  'instrument-shot': Object.freeze({
    title: 'Keep comparing what you learn.',
    body: 'Your ten free Range comparisons are complete. Pro keeps the next comparison available.',
  }),
  'guided-experiment': Object.freeze({
    title: 'Take the next experiment deeper.',
    body: 'Your first guided Mechanics experiment is complete. Pro unlocks the next controlled comparison.',
  }),
  'guide-answer': Object.freeze({
    title: 'Keep digging into the model.',
    body: 'Today\'s free guided answers are complete. Pro keeps every question and live comparison available.',
  }),
  'pro-history': Object.freeze({
    title: 'History is not available yet.',
    body: 'Flightglass does not sell future history tools in this build. Range, Guide and Mechanics Lab remain available within their free limits.',
  }),
  default: Object.freeze({
    title: 'Keep the whole model open.',
    body: 'Unlock unlimited Range comparisons, guided answers and deeper Mechanics experiments.',
  }),
});

const el = (tag, className, attrs = {}) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  return node;
};

function checkIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'm4 10 3.5 3.5L16 5');
  svg.append(path);
  return svg;
}

function closeIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('aria-hidden', 'true');
  for (const d of ['M5 5l10 10', 'M15 5 5 15']) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

function buildPaywall() {
  const dialog = el('dialog', 'sa-pw-scrim', {
    'aria-labelledby': 'sa-pw-title',
    'aria-describedby': 'sa-pw-body',
  });
  const card = el('div', 'sa-pw-card');
  const close = el('button', 'sa-pw-close', { type: 'button', 'aria-label': 'Close Pro options' });
  close.append(closeIcon());

  const main = el('div', 'sa-pw-main');
  const story = el('section', 'sa-pw-story');
  const brand = el('div', 'sa-pw-brand', { 'aria-label': 'Flightglass Pro' });
  const brandName = el('span', 'sa-pw-wordmark');
  brandName.textContent = 'FLIGHTGLASS';
  const pro = el('span', 'sa-pw-pro');
  pro.textContent = 'PRO';
  brand.append(brandName, pro);

  const title = el('h2', 'sa-pw-title', { id: 'sa-pw-title', tabindex: '-1' });
  const body = el('p', 'sa-pw-body', { id: 'sa-pw-body' });
  const features = el('ul', 'sa-pw-features');
  for (const text of [
    'Unlimited Range comparisons',
    'Unlimited guided Guide answers',
    'Unlimited guided Mechanics experiments',
  ]) {
    const item = document.createElement('li');
    item.append(checkIcon(), document.createTextNode(text));
    features.append(item);
  }
  story.append(brand, title, body, features);

  const purchase = el('section', 'sa-pw-purchase', { 'aria-label': 'Choose a Pro plan' });
  const plans = el('fieldset', 'sa-pw-plans');
  const legend = document.createElement('legend');
  legend.textContent = 'Choose a plan';
  plans.append(legend);

  const inputs = {};
  const prices = {};
  const planNotes = {};
  for (const plan of PLANS) {
    const label = el('label', `sa-pw-plan${plan.recommended ? ' is-recommended' : ''}`);
    if (plan.recommended) {
      const badge = el('span', 'sa-pw-recommended');
      badge.textContent = 'RECOMMENDED';
      label.append(badge);
    }
    const input = el('input', null, { type: 'radio', name: 'sa-pw-plan', value: plan.id });
    if (plan.recommended) input.checked = true;
    inputs[plan.id] = input;
    const surface = el('span', 'sa-pw-plan__surface');
    const radio = el('span', 'sa-pw-radio', { 'aria-hidden': 'true' });
    const copy = el('span', 'sa-pw-plan__copy');
    const name = el('strong', 'sa-pw-plan__name');
    name.textContent = plan.name;
    const note = el('small', 'sa-pw-plan__note');
    note.textContent = plan.recommended ? 'Billed yearly' : 'Billed monthly';
    planNotes[plan.id] = note;
    copy.append(name, note);
    const price = el('span', 'sa-pw-price');
    const amount = el('strong', 'sa-pw-price__amount');
    amount.textContent = plan.fallback;
    const period = el('small', 'sa-pw-price__period');
    period.textContent = plan.period;
    price.append(amount, period);
    prices[plan.id] = amount;
    surface.append(radio, copy, price);
    label.append(input, surface);
    plans.append(label);
  }

  const cta = el('button', 'sa-pw-cta', { type: 'button' });
  const renewal = el('p', 'sa-pw-renewal');
  renewal.textContent = 'Subscriptions renew automatically until cancelled in your store settings.';
  const status = el('p', 'sa-pw-status', { role: 'status', 'aria-live': 'polite' });
  const legal = el('nav', 'sa-pw-legal', { 'aria-label': 'Purchase support and legal' });
  const restore = el('button', 'sa-pw-link', { type: 'button' });
  restore.textContent = 'Restore purchases';
  const terms = el('a', 'sa-pw-link', { href: './terms.html' });
  terms.textContent = 'Terms';
  const privacy = el('a', 'sa-pw-link', { href: './privacy.html' });
  privacy.textContent = 'Privacy';
  legal.append(restore, terms, privacy);
  purchase.append(plans, cta, renewal, status, legal);
  main.append(story, purchase);
  card.append(close, main);
  dialog.append(card);
  return { dialog, card, close, title, body, inputs, prices, planNotes, cta, status, restore, purchase };
}

const ui = buildPaywall();
if (document.body) document.body.append(ui.dialog);
else document.addEventListener('DOMContentLoaded', () => document.body.append(ui.dialog), { once: true });

let selectedPlan = 'annual';
let source = 'default';
let opener = null;
let busy = false;
let offeringGeneration = 0;
let availablePlans = { monthly: false, annual: false };
let outcomePromise = null;
let resolveOutcome = null;

function contentFor(value) {
  return SOURCE_COPY[value] || SOURCE_COPY.default;
}

function priceFor(plan) {
  return ui.prices[plan]?.textContent || PLANS.find((item) => item.id === plan)?.fallback || '';
}

function updateCta() {
  const available = availablePlans[selectedPlan];
  ui.cta.textContent = selectedPlan === 'annual'
    ? `Continue — ${priceFor('annual')} per year`
    : `Continue — ${priceFor('monthly')} per month`;
  if (!available) {
    ui.cta.textContent = saIap.isNative() ? 'Store price unavailable' : 'Available in the mobile app';
  }
  ui.cta.disabled = busy || !available;
}

function setBusy(next) {
  busy = next;
  ui.purchase.setAttribute('aria-busy', String(next));
  ui.close.disabled = next;
  ui.close.setAttribute('aria-disabled', String(next));
  ui.restore.disabled = next;
  for (const [plan, input] of Object.entries(ui.inputs)) input.disabled = next || !availablePlans[plan];
  updateCta();
}

function packageProduct(aPackage) {
  return aPackage?.product || aPackage || null;
}

function applyOfferings(offerings) {
  availablePlans = { monthly: false, annual: false };
  for (const plan of PLANS) {
    const product = packageProduct(offerings?.[plan.id]);
    availablePlans[plan.id] = Boolean(product?.priceString);
    ui.prices[plan.id].textContent = product?.priceString || plan.fallback;
    ui.prices[plan.id].dataset.priceSource = product?.priceString ? 'store' : 'fallback';
    if (!product?.priceString) {
      ui.planNotes[plan.id].textContent = plan.id === 'annual'
        ? 'Billed yearly · store price shown at checkout'
        : 'Billed monthly · store price shown at checkout';
    } else if (plan.id === 'annual') {
      ui.planNotes.annual.textContent = product?.pricePerMonthString
        ? `${product.pricePerMonthString} per month · billed yearly`
        : 'Billed yearly';
    } else {
      ui.planNotes.monthly.textContent = 'Billed monthly';
    }
  }
  if (!availablePlans[selectedPlan]) {
    const fallbackPlan = availablePlans.annual ? 'annual' : availablePlans.monthly ? 'monthly' : selectedPlan;
    selectedPlan = fallbackPlan;
    ui.inputs[fallbackPlan].checked = true;
  }
  setBusy(busy);
  updateCta();
}

for (const [plan, input] of Object.entries(ui.inputs)) {
  input.addEventListener('change', () => {
    if (!input.checked) return;
    selectedPlan = plan;
    updateCta();
  });
}

ui.close.addEventListener('click', () => closePaywall());
ui.dialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closePaywall();
});
ui.dialog.addEventListener('click', (event) => {
  if (event.target === ui.dialog) closePaywall();
});

export function openPaywall(nextSource = 'default') {
  if (ui.dialog.open) return outcomePromise;
  source = nextSource;
  opener = document.activeElement;
  const content = contentFor(source);
  ui.title.textContent = content.title;
  ui.body.textContent = content.body;
  ui.status.textContent = '';
  setBusy(false);
  applyOfferings(null);
  ui.dialog.showModal();
  requestAnimationFrame(() => ui.title.focus({ preventScroll: true }));
  track('paywall_seen', { moment: source });

  outcomePromise = new Promise((resolve) => {
    resolveOutcome = resolve;
  });

  const generation = ++offeringGeneration;
  void saIap.getOfferings().then((offerings) => {
    if (ui.dialog.open && generation === offeringGeneration) {
      applyOfferings(offerings);
      if (!offerings) {
        ui.status.textContent = saIap.isNative()
          ? 'Store pricing is unavailable. Check your connection or try Restore.'
          : 'Purchases are available in the native iOS or Android app.';
      }
    }
  }).catch(() => {
    if (ui.dialog.open && generation === offeringGeneration) {
      applyOfferings(null);
      ui.status.textContent = saIap.isNative()
        ? 'Store pricing is unavailable. Check your connection or try Restore.'
        : 'Purchases are available in the native iOS or Android app.';
    }
  });

  return outcomePromise;
}

export function closePaywall(outcome = { status: 'dismissed' }) {
  if (!ui.dialog.open) return;
  // A store sheet can settle after the user returns to this dialog. Resolving
  // the caller as dismissed while that request is in flight loses the gated
  // action even when RevenueCat grants Pro a moment later. Keep one owner for
  // the outcome until the store returns success, cancellation, pending or an
  // error. The close control is disabled too; this guard also covers Escape,
  // scrim clicks and programmatic close attempts.
  if (busy && outcome?.status === 'dismissed') {
    ui.status.textContent = 'Your store confirmation is still open. Finish or cancel it before closing.';
    return false;
  }
  offeringGeneration += 1;
  ui.dialog.close();
  ui.status.textContent = '';
  setBusy(false);
  const target = opener;
  opener = null;
  if (target?.isConnected) requestAnimationFrame(() => target.focus({ preventScroll: true }));
  const settle = resolveOutcome;
  outcomePromise = null;
  resolveOutcome = null;
  settle?.(outcome);
  return true;
}

ui.cta.addEventListener('click', async () => {
  if (busy) return;
  if (!availablePlans[selectedPlan]) return;
  setBusy(true);
  ui.status.textContent = 'Opening your store…';
  track('purchase_started', { tier: selectedPlan, moment: source });
  const result = await saIap.purchaseDetailed(selectedPlan);

  if (result.status === saIap.PURCHASE_STATUS.SUCCESS) {
    track('purchase_completed', { tier: selectedPlan, moment: source });
    closePaywall({ status: 'unlocked', method: 'purchase' });
    return;
  }

  setBusy(false);
  if (result.status === saIap.PURCHASE_STATUS.CANCELLED) {
    ui.status.textContent = 'Purchase cancelled. Nothing was charged.';
  } else if (result.status === saIap.PURCHASE_STATUS.PENDING) {
    ui.status.textContent = 'Purchase pending. Pro will unlock when your store confirms payment.';
  } else if (result.status === saIap.PURCHASE_STATUS.UNAVAILABLE) {
    ui.status.textContent = saIap.isNative()
      ? 'Store access is unavailable in this build. Try again after the app store connection is configured.'
      : 'Purchases are available in the native iOS or Android app.';
  } else {
    ui.status.textContent = 'The store could not complete the purchase. Check your connection and try again.';
  }
});

ui.restore.addEventListener('click', async () => {
  if (busy) return;
  setBusy(true);
  ui.status.textContent = 'Checking your store account…';
  const result = await saIap.restoreDetailed();
  setBusy(false);

  if (result.status === saIap.PURCHASE_STATUS.SUCCESS) {
    track('restore_completed', { moment: source });
    closePaywall({ status: 'unlocked', method: 'restore' });
  } else if (result.status === saIap.PURCHASE_STATUS.NOT_FOUND) {
    ui.status.textContent = 'No Flightglass Pro purchase was found for this store account.';
  } else if (result.status === saIap.PURCHASE_STATUS.UNAVAILABLE) {
    ui.status.textContent = saIap.isNative()
      ? 'Store access is unavailable in this build. Try again after the app store connection is configured.'
      : 'Open the native iOS or Android app to restore purchases.';
  } else {
    ui.status.textContent = 'The store could not check purchases. Check your connection and try again.';
  }
});

if (typeof window !== 'undefined') {
  window.__sa = window.__sa || {};
  window.__sa.paywall = {
    open: openPaywall,
    close: closePaywall,
    state: () => ({ open: ui.dialog.open, source, selectedPlan, busy }),
  };
}

// Local visual/browser harness only. Never active on production web or native.
if (isLocalHarness()) {
  const params = new URLSearchParams(location.search);
  if (params.get('sa_debug') === 'paywall') {
    const openDebug = () => openPaywall(params.get('source') || 'instrument-shot');
    if (document.readyState === 'complete') setTimeout(openDebug, 0);
    else addEventListener('load', openDebug, { once: true });
  }
}

function isLocalHarness() {
  const localHost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  return localHost && location.protocol === 'http:' && Boolean(location.port);
}
