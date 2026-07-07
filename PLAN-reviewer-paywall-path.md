# PLAN: Reviewer-reachable paywall — hidden bypass trigger + App Review notes file
One-line goal: let an App Store reviewer open the paywall immediately (no 10 real shots), and give Sivert a paste-ready ASC "App Review Information > Notes" document.

## Goal
An App Review tester can open StrikeArc, go to either instrument page, press-and-hold the "?" Help button for 1.5 s, and the real paywall opens — same overlay, same StoreKit flow, zero change to the shot counter or gate logic normal users hit. A second path, `?sa_debug=paywall`, force-opens the paywall on load for web probes and automated verification. `docs/app-review-notes.md` exists with verbatim text Sivert pastes into App Store Connect. Bonus fix found during exploration: `terms.html`/`privacy.html` (linked from the paywall's legal row) actually ship in the native `www/` bundle instead of 404-ing.

## Why now (leverage)
- `sa-shots.js:20` `FREE_LIMIT = 10`, `shouldGate()` at `:61-64` — hard gate, and grep confirms the ONLY callers of `openPaywall()` are the two gate sites (`impact.html:3542`, `geometry.html:1125`) plus the console hook `window.__sa.paywall` (`sa-paywall.js:467`). A reviewer must play 10 real swings to ever see the paywall → classic "we could not locate the in-app purchase" rejection.
- `docs/` contains only `NATIVE.md`-style internal audits (`native-readiness-2026-07-02.md`) — no reviewer notes exist.
- Found while reading `scripts/copy-web.mjs:29`: `ALLOWED_HTML_FILES = ['index.html', 'geometry.html', 'impact.html']` — but `sa-paywall.js:201-204` links `./terms.html` and `./privacy.html`. In the native app those are dead links (404 inside WKWebView). Apple requires functional Terms of Use (EULA) + Privacy Policy links on auto-renewable-subscription paywalls → this alone is a rejection. Both files are fully self-contained (inline CSS, data-URI favicon — verified), so shipping them is a 1-line change.
- RevenueCat keys are placeholders (`sa-iap.js:42-43` `appl_REPLACE_ME`) — but `purchase()`/`restore()`/`getOfferings()` already degrade gracefully (return `false`/`null`, never throw), and `sa-paywall.js` falls back to `kr 59 / kr 149 / kr 349` price strings. The reviewer path is therefore fully demonstrable pre-keys. No sa-iap changes needed.

## Exact files to touch
- `C:/Users/SkotvoldSivertSende/OneDrive - IdrettsKontor/Skrivebord/Apper/svingbue/sa-paywall.js` — append one self-contained "reviewer trigger" block at end of file (URL param + long-press on `#helpBtn`). This is the ONLY code file that changes for the trigger: both pages already import it as a side-effect module.
- `C:/Users/SkotvoldSivertSende/OneDrive - IdrettsKontor/Skrivebord/Apper/svingbue/scripts/copy-web.mjs` — add `'terms.html', 'privacy.html'` to `ALLOWED_HTML_FILES`.
- `C:/Users/SkotvoldSivertSende/OneDrive - IdrettsKontor/Skrivebord/Apper/svingbue/docs/app-review-notes.md` — NEW file, paste-ready ASC notes (content given verbatim in step 4).

Files that must NOT change:
- `sa-shots.js` — the trigger never reads/writes the counter; zero edits.
- `sa-iap.js` — keys are Sivert-only; graceful degradation already correct.
- `impact.html`, `geometry.html`, `index.html` — no markup, no on-screen text (P1: pages must not say MORE). `#helpBtn` already exists on both instrument pages (`impact.html:829`, `geometry.html:391`).
- `codemagic.yaml` — publishing block `:191-198` stays untouched; the doc explains where notes go (ASC UI, not CI).
- `sa-firstrun.js`, `sa-paywall.css`, `swing-parameters-and-impact.js`, `impact-flight.js`, anything in `geo3d/`, `vendor/`, `www/` (www/ is CI-generated — never hand-edit).

## Pre-flight
1. Read `sa-paywall.js` in full — you will append after its last block (`window.__sa.paywall = { open: openPaywall, close: closePaywall };`, line ~467). Note: `openPaywall(source)` is already re-entrant-safe (`sa-paywall.js:358`) and `source` is debug-log-only.
2. Confirm both pages import it: `impact.html:1280` and `geometry.html:495` (`import { openPaywall } from './sa-paywall.js';`).
3. Confirm `#helpBtn` exists in static markup BEFORE the module scripts run: `impact.html:829`, `geometry.html:391`. Its click is wired to the walkthrough replay at `impact.html:4210` and `geometry.html:1434` — the long-press must swallow the click that follows it.
4. Confirm `openPaywall` inerts the background (`setBackgroundInert`, `sa-paywall.js:318-327`) and focuses the title only after the scrim's .25 s `transitionend` (`focusAfterOpenTransition`, `:331-350`). DO NOT touch this.
5. Local server: from the repo root run `python -m http.server 8099`. Probe URLs: `http://localhost:8099/impact.html`, `http://localhost:8099/geometry.html`.
6. In every headless probe, seed localStorage BEFORE asserting (navigate once, then): `localStorage.setItem('sa_onboarded','1'); localStorage.setItem('sa_coach_impact','1'); localStorage.setItem('sa_coach_geo','1');` then reload. (Keys per `sa-firstrun.js:14`.)
7. Note `isWeb()` (`sa-shots.js:32`) keeps gating OFF on web — the trigger must work regardless (it calls `openPaywall` directly, bypassing `shouldGate`).

## Implementation order

### Step 1 — sa-paywall.js: append the reviewer trigger block
Anchor: the file currently ends with
```js
if (typeof window !== 'undefined') {
  window.__sa = window.__sa || {};
  window.__sa.paywall = { open: openPaywall, close: closePaywall };
}
```
Append AFTER that block (keep it as-is), exactly:

```js
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
```
After this step both pages fully work with zero visual change; verify by loading each page — 0 console errors.

### Step 2 — scripts/copy-web.mjs: ship terms + privacy in the native bundle
Anchor (line 29):
```js
const ALLOWED_HTML_FILES = ['index.html', 'geometry.html', 'impact.html'];
```
Change to:
```js
// terms.html + privacy.html: linked from the paywall's legal row
// (sa-paywall.js → ./terms.html / ./privacy.html) — Apple requires these to
// resolve inside the native app, so they ship alongside the three app pages.
const ALLOWED_HTML_FILES = ['index.html', 'geometry.html', 'impact.html', 'terms.html', 'privacy.html'];
```
Then run `npm run copy-web` from the repo root and confirm `www/terms.html` and `www/privacy.html` exist and `www/docs` does NOT.

### Step 3 — update the file-header comment in copy-web.mjs (accuracy)
Anchor (line 14, inside the header comment): `three real app pages`. Change that phrase to `three real app pages + the paywall's terms/privacy pages`. Nothing else in the comment changes.

### Step 4 — create docs/app-review-notes.md
New file, exact content (verbatim — Sivert pastes the fenced block into ASC):

````markdown
# App Review notes — StrikeArc (no.strikearc.app, Apple ID 6768449250)

Paste the block below into **App Store Connect → StrikeArc → the version being
submitted → App Review Information → Notes**. (This is set per-version in the
ASC web UI — it is NOT part of codemagic.yaml; the CI publishing block at
codemagic.yaml:191-198 only submits builds to TestFlight.)

```
REVIEWER NOTES — StrikeArc

ORIENTATION
- The app is LANDSCAPE-ONLY by design (it is a swing/ball-flight instrument).
  Hold the device in landscape; in portrait a "Rotate your phone to landscape"
  prompt is shown.

ACCOUNT
- No account, sign-in, or demo credentials are required. All features work
  offline after install.

FREE TIER / PAYWALL
- The app is free for the first 10 played shots (a "shot" = playing a ball
  flight on the "See the Shot" screen or playing a swing on the "Swing
  Geometry" screen). After 10 shots, a hard paywall offers StrikeArc Pro.

HOW TO REACH THE PAYWALL IMMEDIATELY (tester shortcut)
1. From the home menu, open either instrument screen ("See the Shot" or
   "Swing Geometry").
2. PRESS AND HOLD the round "?" Help button for about 2 seconds
   ("See the Shot": top-right corner; "Swing Geometry": right-hand control
   rail). The paywall opens directly.
   With VoiceOver on: double-tap and hold the "?" button for about 2 seconds.
3. This shortcut only opens the same paywall screen normal users see at the
   10-shot limit — it does not alter pricing, entitlements, or the purchase
   flow.

IN-APP PURCHASES (RevenueCat + StoreKit)
- strikearc_pro_monthly  — auto-renewable subscription, 1 month
- strikearc_pro_annual   — auto-renewable subscription, 1 year
- strikearc_pro_lifetime — non-consumable (one-time)
- "Restore Purchases", Terms of Use (EULA) and Privacy Policy links are in the
  paywall's bottom row.
```

## Pre-submission checklist (Sivert — outside this repo)
- [ ] Create the RevenueCat "StrikeArc" project and replace the placeholder
      keys in sa-iap.js:42-43 (`appl_REPLACE_ME` / `goog_REPLACE_ME`). Until
      then the paywall shows fallback prices (kr 59 / 149 / 349) and purchase
      taps show "Purchase didn't complete — please try again." — fine for
      TestFlight, NOT for App Store review.
- [ ] Create the three IAP products in ASC with the exact product IDs above
      and attach them to the SAME version submission as the binary (first-time
      IAPs are reviewed together with the app version).
- [ ] Paste the notes block above into App Review Information → Notes.
- [ ] Paid Apps Agreement must be Active (Agreements, Tax, and Banking).
- [ ] Optional: add a beta group to codemagic.yaml publishing
      (commented stub at codemagic.yaml:195-197) — unrelated to review notes.
````

### Step 5 — verify, then batch-commit
Run the full Acceptance criteria below. Commit everything in ONE commit (never push a doc-only commit alone — every push to main triggers a full Codemagic iOS build). Per standing instruction, commit locally and STOP before `git push` unless a push has been requested for a batch.

## Edge cases a weaker model would miss
- **Click-after-long-press**: releasing a long-press still dispatches `click`, and `#helpBtn`'s click replays the walkthrough (`impact.html:4210`, `geometry.html:1434`). At-target listeners fire in registration order REGARDLESS of the capture flag, so a capture listener on the button itself does NOT beat the earlier-registered handler — the suppressor must sit on `document` in the capture phase (as written in Step 1).
- **Inert eats the click**: `openPaywall()` synchronously inerts every `body` child except the scrim (`sa-paywall.js:318-327`), including `.topstrip`/`.controls` → the release-click on the now-inert button often never dispatches. That is why `suppressNextClick` self-clears after 800 ms — a sticky flag would swallow the NEXT legitimate Help tap after the paywall closes.
- **Do not "fix" initial focus**: focus must wait for the scrim's .25 s `transitionend` (`focusAfterOpenTransition`, `sa-paywall.js:331-350`) — a bare `requestAnimationFrame` focus silently fails (measured bug, documented in-file). The trigger calls `openPaywall()` and touches nothing else.
- **No bare imports / no new files in the module graph**: native WKWebView crashes on bare specifiers. The trigger lives INSIDE `sa-paywall.js` (already imported relatively by both pages) — do not create a new module and do not add import-map entries.
- **`www/` is generated**: never hand-edit `www/`; `scripts/copy-web.mjs` rebuilds it in CI (`codemagic.yaml` step 2). Root `*.md` files are denylisted (`copy-web.mjs:58`), so `docs/app-review-notes.md` and this PLAN file can never leak into the native bundle (`docs/` and root `.md` are both excluded).
- **Web gating is OFF by design** (`isWeb()`, `sa-shots.js:32-34`): you cannot test the shot-gate itself on localhost — only the forced-open paywall. Do not "enable" gating on web to test.
- **`?play=1` already exists on impact.html** (`impact.html:4213`, auto-opens the flight overlay and skips first-run coach arming) — `?sa_debug=paywall` must not collide with it; both params can coexist in one URL, and the trigger reads only its own key.
- **First-run overlays on a cold profile**: without seeded localStorage, `sa-firstrun.js` opens onboarding/coach marks on load; with `?sa_debug=paywall` the paywall then inerts them mid-flow. Acceptable (it's a debug path), but PROBES must always seed `sa_onboarded` / `sa_coach_impact` / `sa_coach_geo` first for deterministic asserts.
- **Do not mutate the counter**: no calls to `saShots.recordShot()` / `reset()` / `setPro()` anywhere in the trigger. The bypass demonstrates the paywall; it must not grant or consume anything (`sa_shots_v1` stays byte-identical).
- **impact.html flight overlay inert pattern**: `openFlight()` inerts `.topstrip` + `#stage` specifically (`impact.html:3881-3883`) — while the flight overlay is open, `#helpBtn` is inert and the long-press is dead there. The reviewer instruction therefore says "from the instrument screen", not from the flight overlay. Do not add a second trigger inside the overlay.
- **Coach-mark STEPS selectors**: no DOM elements are added/removed by this plan, so `sa-firstrun.js` STEPS stay valid — verify the walkthrough still runs (tap "?" normally) after the change.
- **OneDrive + node_modules**: search with Grep/ripgrep tools only; recursive shell `find`/`grep` over the repo times out.
- **CRLF warnings from git are benign** on this machine.
- **geometry.html invariants** must still hold after any change (we touch no geometry code, but verify anyway): `window.__sa.checkAlign3d(5).pass === true`, render-on-demand (`renderCount` static over 1.5 s idle), 0 console errors at 900x470 AND 844x390.

## Accessibility requirements
- The long-press is a hidden shortcut, not a user feature — it must NOT be announced: no new aria attributes, no title change, no visible affordance on `#helpBtn` (its existing `aria-label="Replay the walkthrough"` stays byte-identical). It is a reviewer-only debug affordance and is exempt from input-parity requirements: the real, fully AT-reachable user path to the identical paywall is the 10-shot gate (`shouldGate()`, `sa-shots.js:61-64`), which every user — including keyboard/AT users — reaches through ordinary use. Do not justify conformance via the `?sa_debug=paywall` URL param either: the native app has no URL bar (see Step 1's comment), so that path is unreachable to native AT users and cannot serve as the conformance path.
- `terms.html` / `privacy.html` become user-reachable inside the native app for the first time in Step 2 (linked from the paywall's legal row) — each page must have: `<html lang="...">` set, a descriptive `<title>`, a single logical heading structure (one `h1`, no skipped levels), body text at AA contrast, a `<meta name="viewport">` that permits pinch-zoom (no `user-scalable=no` / `maximum-scale=1`), and pass an accesslint audit (`mcp__plugin_accesslint_accesslint__audit_html` or `audit_live`) with zero violations. Critically, each page must have a visible in-page Back link/mechanism (not reliance on browser chrome): the WKWebView shell has no back button, so a user — especially a keyboard/AT user — who follows the legal link from the paywall is otherwise stranded on a dead-end page with no way back to the paywall or instrument screen.
- The paywall dialog itself already satisfies the gate: `role="dialog"` + `aria-modal="true"` + `aria-labelledby="sa-pw-title"` (`sa-paywall.js:215-219`), background `inert`, focus trapped, Esc/backdrop/✕ close, focus restored to the pre-open element — the trigger must enter through `openPaywall()` so all of this applies unchanged. After a long-press open, `lastFocus` is `#helpBtn` (or `body`), so close returns focus there — verify.
- Touch target: `#helpBtn` on impact.html is 30px visual + `::after{inset:-7px}` hit-area extension (`impact.html:104-105`) = 44px effective — unchanged. Do not shrink it.
- Reduced motion: `focusAfterOpenTransition` already branches on `prefers-reduced-motion` (`sa-paywall.js:330-339`); the trigger adds no animation of its own — nothing to do, but run one probe with reduced motion emulated (paywall must open instantly and still receive focus).
- Live regions: paywall status line is `aria-live="polite" role="status"` (`sa-paywall.js:196`) — untouched. The trigger must not write to any live region (no announcement of the bypass).
- Contrast: no new visible UI → no new contrast surface. Cyan `#22E3D6` on `#0A0E12` remains reserved for existing elements.
- `user-select:none` / `touch-callout:none` are applied to `#helpBtn` only (prevents the iOS text-selection callout from hijacking the long-press) — this does not affect AT interaction with a button.

## Acceptance criteria
Server: `python -m http.server 8099` from the repo root. Use chrome-devtools MCP; viewport via `resize_page`. For EVERY probe, first navigate to the page, run `localStorage.setItem('sa_onboarded','1'); localStorage.setItem('sa_coach_impact','1'); localStorage.setItem('sa_coach_geo','1'); localStorage.removeItem('sa_shots_v1');` and reload.

1. URL-param path (impact): navigate `http://localhost:8099/impact.html?sa_debug=paywall`, wait 1 s, then
   `document.querySelector('.sa-pw-scrim').classList.contains('open')` → `true`.
2. Same for `http://localhost:8099/geometry.html?sa_debug=paywall` → `true`.
3. Counter untouched: with the paywall open from (1), `localStorage.getItem('sa_shots_v1')` → `null`.
4. Close paths: `window.__sa.paywall.close()` → `document.querySelector('.sa-pw-scrim').classList.contains('open')` → `false`; background un-inerted: `document.querySelector('.topstrip').inert` → `false`.
5. Long-press path (impact, plain URL `http://localhost:8099/impact.html`): run
   ```js
   (async () => {
     const btn = document.getElementById('helpBtn');
     const r = btn.getBoundingClientRect();
     const opts = { bubbles: true, cancelable: true, isPrimary: true, pointerId: 1,
                    clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
     btn.dispatchEvent(new PointerEvent('pointerdown', opts));
     await new Promise(res => setTimeout(res, 1700));
     btn.dispatchEvent(new PointerEvent('pointerup', opts));
     return {
       open: document.querySelector('.sa-pw-scrim').classList.contains('open'),
       coach: !!document.querySelector('.sa-coach'),
       shots: localStorage.getItem('sa_shots_v1'),
     };
   })()
   ```
   → `{ open: true, coach: false, shots: null }`.
6. Short-press still replays the walkthrough (no regression): after closing the paywall, `document.getElementById('helpBtn').click()`, wait 500 ms → `!!document.querySelector('.sa-coach')` → `true` (then close it via its Skip button or reload).
7. Slop cancel: repeat (5) but dispatch a `pointermove` with `clientX` +40 px between down and up → `open: false`.
8. Repeat (5) on `geometry.html` → `open: true, coach: false`.
9. 0 console errors (`list_console_messages`) on both pages, at BOTH 844x390 and 740x416, with and without `?sa_debug=paywall`.
10. Visual check at 844x390 and 740x416: both pages are pixel-identical to before in normal use (no new visible element, `#helpBtn` looks unchanged); paywall renders correctly when triggered.
11. Geometry invariants (page was not edited, but verify): `window.__sa.checkAlign3d(5).pass` → `true`; `window.__sa.three.renderCount()` unchanged across a 1.5 s idle; 0 console errors at 900x470.
12. Focus behavior: after long-press open, wait 400 ms → `document.activeElement.id` → `'sa-pw-title'`; after Esc, `document.activeElement.id` → `'helpBtn'`.
13. Reduced motion: emulate `prefers-reduced-motion: reduce`, open via `?sa_debug=paywall` → scrim open instantly, `document.activeElement.id === 'sa-pw-title'` within 400 ms.
14. Build assembly: `npm run copy-web` → output lists `copied terms.html` and `copied privacy.html`; `www/terms.html` and `www/privacy.html` exist; `www/docs` does not exist; no `.md` file anywhere under `www/` (`Get-ChildItem www -Recurse -Filter *.md` → empty).
15. `docs/app-review-notes.md` exists, contains the exact product IDs `strikearc_pro_monthly` / `strikearc_pro_annual` / `strikearc_pro_lifetime`, the long-press instruction (including the VoiceOver variant), and the landscape instruction.
16. `terms.html` and `privacy.html` each: have `<html lang>` set, a non-empty descriptive `<title>`, exactly one `h1` with no skipped heading levels, a zoom-permitting viewport meta (no `user-scalable=no` / `maximum-scale=1`), and 0 violations from an accesslint audit (`audit_html`).
17. Each page has a visible in-page Back link/mechanism: navigate to `terms.html` (and separately `privacy.html`) directly, locate the Back control via `take_snapshot`, activate it, and confirm it returns to the paywall with the paywall open (`.sa-pw-scrim` has class `open`) and, where reachable, the underlying instrument page state intact (no reload-induced reset).

## Out of scope
- Replacing the RevenueCat placeholder keys (`sa-iap.js:42-43`) — Sivert-only, via the RevenueCat dashboard.
- Creating IAP products / pasting notes in App Store Connect — Sivert's manual step; the doc tells him where.
- Any change to `codemagic.yaml` (signing, publishing, beta groups), `sa-shots.js` gate values, paywall pricing/copy/layout, first-run/coach-mark flows, or the ghost/flight UX (P2 is a separate work item).
- Any visible "debug"/"reviewer" UI, settings entry, or on-screen hint (violates P1).
- Android reviewer path polish (Play Store is planned, not active).
- Pushing to main — commit locally, batch with the next code change per standing instruction.
