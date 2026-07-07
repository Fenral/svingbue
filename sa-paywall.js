/* ══════════════════════════════════════════════════════════════════════════
   sa-paywall.js — StrikeArc hard-paywall overlay (freemium: 10 free shots).
   Import with `<script type="module">` from geometry.html / impact.html — the
   overlay DOM is built and appended to document.body AS A SIDE EFFECT of the
   import, so callers need no markup of their own, just:

     import { openPaywall, closePaywall } from './sa-paywall.js';
     if (saShots.shouldGate()) { openPaywall('shot-gate'); return; }

   Ported from the approved paywall-mock.html (<main class="paywall"> — hook
   copy + 3-tier ladder + CTA + legal row) — the mock's .stage/.device phone
   frame and .notes/.caption annotation strip are NOT part of the app and are
   dropped here. The full-screen scrim / open-class / Esc-to-close / restore
   focus-on-close pattern is reused from impact.html's #flightScrim overlay
   (see openFlight/closeFlight there); focus-trapping follows sa-firstrun.js's
   trapFocus() convention.

   Public API:
     openPaywall(source)   → open the paywall. `source` is an optional free-
                             text string (e.g. 'shot-gate', 'menu') logged for
                             debugging only — it has no behavioural effect.
     closePaywall()        → dismiss. Dismissable via ✕ / Esc / backdrop tap —
                             the caller's gate (sa-shots.shouldGate()) is
                             untouched, so the NEXT blocked play re-opens this.

   Pricing / purchase flow (contract with sa-iap.js):
     • On open, the 3 tier prices are populated from
       (await saIap.getOfferings())[tier].priceString (RevenueCat package →
       product.priceString), falling back to kr 59 / kr 149 / kr 349 when
       offerings are unavailable (web build, RC not configured, network error).
     • "Unlock Pro" → saIap.purchase(selectedTier). If that resolves true, the
       'pro' entitlement is already active (sa-iap pushed it into sa-shots),
       so we just closePaywall() — the gate unlocks itself.
     • "Restore Purchases" → saIap.restore(); closes on success, otherwise
       shows an inline status line (the paywall stays open).

   a11y: role="dialog" + aria-modal + aria-labelledby the h1; Esc closes; focus
   is trapped inside the card while open (Tab/Shift+Tab wrap); focus returns to
   whatever had it before openPaywall() was called; prefers-reduced-motion
   drops the open/close transitions (see sa-paywall.css).

   window.__sa.paywall exposes { open, close } for console testing on web.
   ══════════════════════════════════════════════════════════════════════════ */

import * as saIap from './sa-iap.js';

const FOCUSABLE_SEL =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const TIERS = [
  { id: 'monthly', cls: 'sa-pw-tier sa-pw-decoy', name: 'Monthly', sub: 'Billed every month', period: '/ month', fallback: 'kr 59' },
  { id: 'annual', cls: 'sa-pw-tier sa-pw-hero', name: 'Annual', period: '/ year', fallback: 'kr 149', badge: 'BEST VALUE', checked: true },
  { id: 'lifetime', cls: 'sa-pw-tier', name: 'Lifetime', sub: 'Pay once — yours forever', period: 'one-time', fallback: 'kr 349' },
];

// ── tiny DOM builder helpers (same shape as sa-firstrun.js's el()) ─────────
function el(tag, cls, attrs) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (attrs) {
    for (const k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) node.setAttribute(k, attrs[k]);
    }
  }
  return node;
}

function checkIcon() {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2.4');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', 'M20 6 9 17l-5-5');
  svg.appendChild(path);
  return svg;
}

// ── build: hook (left column — the pitch) ───────────────────────────────────
function buildHook() {
  const hook = el('section', 'sa-pw-hook');

  const brand = el('div', 'sa-pw-brand');
  const wordmark = el('span', 'sa-pw-wordmark');
  wordmark.textContent = 'STRIKEARC';
  const pill = el('span', 'sa-pw-pill');
  pill.textContent = 'PRO';
  brand.append(wordmark, pill);

  // h2, not h1: the host page (impact.html/geometry.html) already has an h1.
  // tabindex="-1" makes it a valid initial-focus target per APG dialog pattern
  // (a static, non-interactive element) without adding it to the Tab order.
  const h1 = el('h2', 'sa-pw-title', { id: 'sa-pw-title', tabindex: '-1' });
  h1.appendChild(document.createTextNode("You've played your "));
  const accent = el('span', 'sa-pw-accent');
  accent.textContent = '10 free shots';
  h1.append(accent, document.createTextNode('.'));

  const sub = el('p', 'sa-pw-sub');
  sub.textContent = 'Keep exploring exactly how every swing shapes the shot.';

  const features = el('ul', 'sa-pw-features');
  [
    'Unlimited shots & swings',
    'Full 3D flight replay',
    'Compare shots with ghosts',
    'Every parameter unlocked',
    'Face-zoom impact replay',
  ].forEach((label) => {
    const li = document.createElement('li');
    li.appendChild(checkIcon());
    li.appendChild(document.createTextNode(label));
    features.appendChild(li);
  });

  const foot = el('p', 'sa-pw-foot');
  foot.textContent = 'One instrument. Every ball-flight law, made visible.';

  hook.append(brand, h1, sub, features, foot);
  return { hook, titleEl: h1 };
}

// ── build: ladder (right column — plans + CTA + legal) ──────────────────────
// Returns the section plus every element later code needs to read/write.
function buildLadder() {
  const ladder = el('section', 'sa-pw-ladder');
  const form = document.createElement('form');
  form.addEventListener('submit', (e) => e.preventDefault());

  const fieldset = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.textContent = 'Choose a plan';
  fieldset.appendChild(legend);

  const tierInputs = {};
  const priceEls = {};

  TIERS.forEach((t) => {
    const label = el('label', t.cls);

    if (t.badge) {
      const badge = el('span', 'sa-pw-badge', { 'aria-hidden': 'true' });
      badge.textContent = t.badge;
      label.appendChild(badge);
    }

    const input = el('input', null, { type: 'radio', name: 'sa-pw-plan', value: t.id });
    if (t.checked) input.checked = true;
    tierInputs[t.id] = input;

    const radio = el('span', 'sa-pw-radio', { 'aria-hidden': 'true' });

    const textWrap = document.createElement('span');
    const nameEl = el('span', 'sa-pw-name');
    nameEl.textContent = t.name;
    const subEl = el('span', 'sa-pw-tsub');
    if (t.id === 'annual') {
      const save = el('span', 'sa-pw-save');
      save.textContent = 'Save 79%';
      subEl.append(save, document.createTextNode(' vs monthly'));
    } else {
      subEl.textContent = t.sub;
    }
    textWrap.append(nameEl, subEl);

    const left = el('span', 'sa-pw-left');
    left.append(radio, textWrap);

    const priceEl = el('span', 'sa-pw-price');
    const priceMain = document.createTextNode(t.fallback);
    const priceSmall = document.createElement('small');
    priceSmall.textContent = t.period;
    priceEl.append(priceMain, priceSmall);
    priceEls[t.id] = { mainNode: priceMain, fallback: t.fallback };

    const box = el('span', 'sa-pw-box');
    box.append(left, priceEl);

    label.append(input, box);
    fieldset.appendChild(label);
  });

  form.appendChild(fieldset);

  const cta = el('button', 'sa-pw-cta', { type: 'button' });
  cta.textContent = 'Unlock Pro';

  const fineprint = el('p', 'sa-pw-fineprint');
  fineprint.textContent = 'Annual & Monthly auto-renew until cancelled in Settings. Lifetime is a one-time purchase.';

  const status = el('p', 'sa-pw-status', { 'aria-live': 'polite', role: 'status' });

  const legal = el('p', 'sa-pw-legal');
  const restoreBtn = el('button', 'sa-pw-link', { type: 'button' });
  restoreBtn.textContent = 'Restore Purchases';
  const termsLink = el('a', 'sa-pw-link', { href: './terms.html' });
  termsLink.textContent = 'Terms of Use';
  const privacyLink = el('a', 'sa-pw-link', { href: './privacy.html' });
  privacyLink.textContent = 'Privacy Policy';
  legal.append(restoreBtn, termsLink, privacyLink);

  form.append(cta, fineprint, status, legal);
  ladder.appendChild(form);

  return { ladder, tierInputs, priceEls, cta, status, restoreBtn, termsLink, privacyLink };
}

// ── build: full overlay (scrim > card > close + <main>) ──────────────────────
function buildOverlay() {
  const scrim = el('div', 'sa-pw-scrim', {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'sa-pw-title',
  });
  const card = el('div', 'sa-pw-card');
  const closeBtn = el('button', 'sa-pw-close', { type: 'button', 'aria-label': 'Close' });
  closeBtn.textContent = '✕';

  const main = el('main', 'sa-pw-main');
  const { hook, titleEl } = buildHook();
  const laddered = buildLadder();
  main.append(hook, laddered.ladder);

  card.append(closeBtn, main);
  scrim.appendChild(card);

  return Object.assign({ scrim, card, closeBtn, titleEl }, laddered);
}

const {
  scrim, card, closeBtn, titleEl, tierInputs, priceEls, cta, status, restoreBtn, termsLink, privacyLink,
} = buildOverlay();

// Mount immediately (module scripts run after the DOM is parsed, but guard
// anyway in case this ever gets imported before <body> exists).
if (document.body) {
  document.body.appendChild(scrim);
} else {
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(scrim), { once: true });
}

// ── state ────────────────────────────────────────────────────────────────
let selectedTier = TIERS.find((t) => t.checked).id; // 'annual'
let lastFocus = null;
let currentSource = null;
let busy = false;     // guards overlapping purchase/restore taps
let openGen = 0;      // invalidates a stale getOfferings() response after close/reopen

function ctaLabelFor(tier) {
  const price = (priceEls[tier] && priceEls[tier].mainNode.textContent) || '';
  if (tier === 'monthly') return `Continue — ${price}/mo`;
  if (tier === 'lifetime') return `Unlock Pro — ${price} once`;
  return `Unlock Pro — ${price}/yr`; // annual
}

function refreshCtaLabel() {
  cta.textContent = ctaLabelFor(selectedTier);
}

Object.keys(tierInputs).forEach((id) => {
  tierInputs[id].addEventListener('change', () => {
    if (tierInputs[id].checked) {
      selectedTier = id;
      refreshCtaLabel();
    }
  });
});

// ── focus trap (Tab/Shift+Tab wrap within the card) ─────────────────────────
function getFocusable() {
  return Array.prototype.slice
    .call(card.querySelectorAll(FOCUSABLE_SEL))
    .filter((n) => n.offsetParent !== null || n === document.activeElement);
}

function trapFocus(e) {
  if (e.key !== 'Tab') return;
  const items = getFocusable();
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first || !card.contains(document.activeElement)) {
      e.preventDefault();
      last.focus();
    }
  } else if (document.activeElement === last || !card.contains(document.activeElement)) {
    e.preventDefault();
    first.focus();
  }
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    closePaywall();
    return;
  }
  trapFocus(e);
}

function onScrimClick(e) {
  if (e.target === scrim) closePaywall(); // backdrop tap dismisses, same as flightScrim
}
scrim.addEventListener('click', onScrimClick);
closeBtn.addEventListener('click', () => closePaywall());

// ── background inertness ────────────────────────────────────────────────
// aria-modal alone is unreliable (historically ignored by some AT in virtual-
// cursor mode) — `inert` is the robust way to keep the rest of the page out
// of the accessibility tree and off the Tab order while the dialog is open.
let inertedSiblings = [];
function setBackgroundInert(on) {
  if (on) {
    inertedSiblings = Array.prototype.slice.call(document.body.children)
      .filter((n) => n !== scrim && !n.inert);
    inertedSiblings.forEach((n) => { n.inert = true; });
  } else {
    inertedSiblings.forEach((n) => { n.inert = false; });
    inertedSiblings = [];
  }
}

// ── initial-focus helper (see the MEASURED BUG note inside openPaywall) ────
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function focusAfterOpenTransition(target) {
  const doFocus = () => { try { target.focus({ preventScroll: true }); } catch (e) { /* ignore */ } };
  if (reduceMotion) {
    // sa-paywall.css strips the transition entirely under reduced motion —
    // "open" is visible/opaque the instant the class is added, so a single
    // frame is enough (no transition to wait out).
    requestAnimationFrame(doFocus);
    return;
  }
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    scrim.removeEventListener('transitionend', onEnd);
    doFocus();
  };
  const onEnd = (e) => { if (e.target === scrim) finish(); };
  scrim.addEventListener('transitionend', onEnd);
  setTimeout(finish, 300); // safety net — matches + slightly exceeds the .25s CSS duration
}

// ── open / close ────────────────────────────────────────────────────────
/**
 * Open the paywall. `source` is an optional string identifying what triggered
 * it (e.g. 'shot-gate', 'menu') — used only for a debug log line.
 */
export async function openPaywall(source) {
  if (scrim.classList.contains('open')) return; // already open — ignore re-entrant calls
  const gen = ++openGen;
  currentSource = source || null;
  lastFocus = document.activeElement;
  status.textContent = '';
  refreshCtaLabel(); // show fallback/last-known pricing instantly, no flash of "Unlock Pro"
  setBackgroundInert(true);
  scrim.classList.add('open');
  document.addEventListener('keydown', onKeydown);
  console.debug('[paywall] open', { source: currentSource });

  // Initial focus goes to the (static, tabindex="-1") title, per the APG
  // dialog pattern — so AT announces the headline + pitch before the plan
  // list, instead of jumping straight to "Annual, radio, 2 of 3".
  //
  // MEASURED BUG: .sa-pw-scrim fades in via a .25s opacity/visibility
  // transition (sa-paywall.css). Calling .focus() a single rAF after adding
  // the "open" class silently no-ops — verified against a live page: the
  // element only becomes reliably focusable once that transition has
  // actually finished, not merely scheduled. A single requestAnimationFrame
  // (or even a forced synchronous reflow) fires well before that. Wait for
  // the real transitionend instead, with a safety-net timeout matching the
  // CSS duration (covers prefers-reduced-motion, where the transition is
  // removed entirely and transitionend never fires — the timeout is what
  // actually delivers focus in that case, immediately since it still fires
  // on schedule with no transition running).
  focusAfterOpenTransition(titleEl);

  let offerings = null;
  try { offerings = await saIap.getOfferings(); } catch (e) { offerings = null; }
  if (gen !== openGen) return; // a later open()/close() superseded this fetch

  TIERS.forEach((t) => {
    const pkg = offerings && offerings[t.id];
    const priceString = pkg && (pkg.priceString || (pkg.product && pkg.product.priceString));
    priceEls[t.id].mainNode.textContent = priceString || priceEls[t.id].fallback;
  });
  refreshCtaLabel();
}

/** Dismiss the paywall. The shot-counter gate is untouched by design. */
export function closePaywall() {
  if (!scrim.classList.contains('open')) return;
  openGen++; // invalidate any in-flight getOfferings() from this open
  scrim.classList.remove('open');
  setBackgroundInert(false);
  document.removeEventListener('keydown', onKeydown);
  status.textContent = '';
  const toFocus = lastFocus;
  lastFocus = null;
  currentSource = null;
  if (toFocus && toFocus.isConnected && typeof toFocus.focus === 'function') {
    try { toFocus.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  }
}

// ── purchase / restore ──────────────────────────────────────────────────
cta.addEventListener('click', async () => {
  if (busy) return;
  busy = true;
  const prevLabel = cta.textContent;
  cta.disabled = true;
  cta.textContent = 'Processing…';
  status.textContent = '';

  let unlocked = false;
  try { unlocked = await saIap.purchase(selectedTier); } catch (e) { unlocked = false; }
  busy = false;

  if (unlocked) {
    // sa-iap already pushed pro=true into sa-shots — the gate is unlocked.
    closePaywall();
    return;
  }
  cta.disabled = false;
  cta.textContent = prevLabel;
  status.textContent = "Purchase didn't complete — please try again.";
});

restoreBtn.addEventListener('click', async () => {
  if (busy) return;
  busy = true;
  const prevLabel = restoreBtn.textContent;
  restoreBtn.disabled = true;
  restoreBtn.textContent = 'Restoring…';
  status.textContent = '';

  let restored = false;
  try { restored = await saIap.restore(); } catch (e) { restored = false; }
  busy = false;
  restoreBtn.disabled = false;
  restoreBtn.textContent = prevLabel;

  if (restored) {
    closePaywall();
  } else {
    status.textContent = 'No previous purchase found for this account.';
  }
});

// Terms/Privacy are real same-webview navigations (./terms.html, ./privacy.html).
// Before leaving, remember to re-open the paywall when the user comes BACK via
// the legal pages' in-page Back link — otherwise a native user (no browser
// chrome) who taps Terms lands on a dead-end and loses the paywall they were on.
// The pages' Back link uses history.back(); on return this module re-opens.
function rememberReopen(){ try { sessionStorage.setItem('sa_pw_reopen', currentSource || '1'); } catch (e) {} }
termsLink.addEventListener('click', rememberReopen);
privacyLink.addEventListener('click', rememberReopen);

// On return from a legal page (fresh load OR bfcache restore), re-open the
// paywall if we flagged it on the way out.
function maybeReopenFromLegal(){
  let flag = null;
  try { flag = sessionStorage.getItem('sa_pw_reopen'); } catch (e) { flag = null; }
  if (!flag) return;
  try { sessionStorage.removeItem('sa_pw_reopen'); } catch (e) {}
  openPaywall(flag === '1' ? 'legal-return' : flag);
}
window.addEventListener('pageshow', maybeReopenFromLegal);

// Convenience for console testing on web (mirrors sa-iap.js's window.__sa.*).
if (typeof window !== 'undefined') {
  window.__sa = window.__sa || {};
  window.__sa.paywall = { open: openPaywall, close: closePaywall };
}

/* ── REVIEWER / DEBUG TRIGGER ────────────────────────────────────────────────
   Two discreet, zero-UI ways to force-open this paywall WITHOUT consuming any
   of the 10 free shots (App Review needs a direct path — see
   docs/app-review-notes.md):
     1. URL param  ?sa_debug=paywall  → opens on load (web builds / probes).
     2. Long-press (1.5 s) on the "?" Help button (#helpBtn on impact.html and
        geometry.html) → works in the native app, where there is no URL bar.
   Neither path reads or writes sa-shots state — gate logic for normal users
   is byte-identical. No on-screen affordance is added (P1: say less). */
const REVIEWER_LONG_PRESS_MS = 1500;
const REVIEWER_SLOP_PX = 12;

(function initReviewerTrigger() {
  // (1) URL param — open once the page has fully loaded.
  let fromUrl = false;
  try {
    fromUrl = new URLSearchParams(window.location.search).get('sa_debug') === 'paywall';
  } catch (e) { fromUrl = false; }
  if (fromUrl) {
    const openNow = () => openPaywall('reviewer-url');
    if (document.readyState === 'complete') setTimeout(openNow, 0);
    else window.addEventListener('load', openNow, { once: true });
  }

  // (2) Long-press on #helpBtn.
  const btn = document.getElementById('helpBtn');
  if (!btn) return; // page without a Help button — the URL param still works

  // iOS long-press otherwise selects the "?" glyph / shows the callout.
  btn.style.webkitUserSelect = 'none';
  btn.style.userSelect = 'none';
  btn.style.webkitTouchCallout = 'none';

  let timer = null;
  let startX = 0;
  let startY = 0;
  let suppressNextClick = false;

  function cancelPress() {
    if (timer) { clearTimeout(timer); timer = null; }
  }

  btn.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary) return;
    startX = e.clientX; startY = e.clientY;
    cancelPress();
    timer = setTimeout(() => {
      timer = null;
      // The release still dispatches a click (which the pages wire to the
      // walkthrough replay) — swallow exactly that one. openPaywall() inerts
      // the button synchronously, so the click usually never dispatches; the
      // flag is belt-and-suspenders, self-clearing so it can't eat a later
      // legitimate Help tap.
      suppressNextClick = true;
      setTimeout(() => { suppressNextClick = false; }, 800);
      openPaywall('reviewer');
    }, REVIEWER_LONG_PRESS_MS);
  });
  btn.addEventListener('pointermove', (e) => {
    if (timer && (Math.abs(e.clientX - startX) > REVIEWER_SLOP_PX ||
                  Math.abs(e.clientY - startY) > REVIEWER_SLOP_PX)) cancelPress();
  });
  btn.addEventListener('pointerup', cancelPress);
  btn.addEventListener('pointercancel', cancelPress);
  btn.addEventListener('pointerleave', cancelPress);

  // Android Chrome fires contextmenu on touch long-press — keep it silent
  // while a press is being timed or right after it completed.
  btn.addEventListener('contextmenu', (e) => {
    if (timer || suppressNextClick) e.preventDefault();
  });

  // Swallow the post-long-press click at the DOCUMENT capture phase. NOTE:
  // at the target element, listeners run in REGISTRATION order regardless of
  // the capture flag, and the pages registered their click→walkthrough
  // handler first (impact.html ~:4210, geometry.html :1434) — so a capture
  // listener on the button itself would fire too late. Document capture runs
  // strictly before any target listener.
  document.addEventListener('click', (e) => {
    if (!suppressNextClick) return;
    if (e.target === btn || btn.contains(e.target)) {
      e.preventDefault();
      e.stopPropagation();
    }
    suppressNextClick = false; // one-shot
  }, true);
})();
