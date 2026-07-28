/**
 * SHARED SHEET ACCESSIBILITY — one implementation for every Academy experience.
 *
 * Thirteen experience modules were built in parallel on 2026-07-15, each with
 * its own `openSheet`/`closeSheet`, and all thirteen got the same three things
 * wrong: `aria-modal="true"` with no background inertness, no Tab trap, and a
 * focus restore written as `trigger?.focus?.()` — which guards null but sails
 * straight through the two cases that actually happen.
 *
 * Two correct implementations already existed in this repo and neither was
 * copied. This module is those two, merged:
 *   - background inertness  ← academy-native-lesson.js:1918
 *   - Tab trap + guarded restore  ← academy.html:1762-1818
 *
 * `npm run verify:dialogs` enforces that any file declaring aria-modal="true"
 * either does this work itself or imports this module.
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/* getClientRects() rather than offsetParent: a fixed-position sheet mid-
   transition still has a positioned offsetParent, so that check would pass
   elements the user cannot reach. */
const focusablesIn = el =>
  [...el.querySelectorAll(FOCUSABLE)].filter(e => !e.hidden && e.getClientRects().length);

/**
 * Open a sheet: inert everything in `main` except the sheet and its scrim,
 * reveal both, and move focus inside.
 *
 * Inerts the SIBLINGS, never `main` itself — the sheet is a child of `main`,
 * so `main.inert = true` would inert the dialog along with the background.
 *
 * @returns the element to restore focus to on close, or null when there is no
 *   safe one. `document.body` is deliberately rejected: `.focus()` on it is a
 *   silent no-op, so returning it produces a restore that looks like it worked
 *   and leaves the user nowhere. A cold deep-link hits exactly that path.
 */
export function openSheetA11y(main, sheet, trigger) {
  if (!main || !sheet) return null;
  const scrim = main.querySelector('[data-sheet-scrim]');
  for (const el of main.children) {
    if (el !== sheet && el !== scrim) el.inert = true;
  }
  if (scrim) scrim.hidden = false;
  sheet.hidden = false;
  (focusablesIn(sheet)[0] || sheet).focus();

  const candidate = trigger || document.activeElement;
  return candidate instanceof HTMLElement && candidate !== document.body ? candidate : null;
}

/**
 * Close a sheet and put focus somewhere real.
 *
 * `fallback` is used when the trigger no longer exists — it is detached after
 * any `innerHTML` re-render, and absent entirely on a cold deep-link where the
 * user arrived from outside the app. Pass the lesson's `<h1>`; it is always in
 * the DOM and matches what `focusMainHeading` does on warm routes. Passing
 * nothing re-creates the bug this module exists to fix.
 */
export function closeSheetA11y(main, sheet, trigger, fallback) {
  if (!sheet || sheet.hidden) return;
  sheet.hidden = true;
  const scrim = main?.querySelector('[data-sheet-scrim]');
  if (scrim) scrim.hidden = true;
  if (main) for (const el of main.children) el.inert = false;

  const target = trigger?.isConnected ? trigger : fallback;
  if (target?.isConnected) target.focus();
}

/**
 * Wrap Tab at both ends of the sheet. Call from the keydown listener the
 * experience already binds to its lesson element.
 *
 * Inertness alone stops the pointer and the virtual cursor, but Tab order is
 * computed before inert applies in some engines, so the trap is belt and
 * braces — and it is what makes `aria-modal="true"` honest on the keyboard.
 */
export function trapSheetTab(event, sheet) {
  if (event.key !== 'Tab' || !sheet || sheet.hidden) return;
  const f = focusablesIn(sheet);
  if (!f.length) {
    event.preventDefault();
    sheet.focus();
    return;
  }
  const first = f[0];
  const last = f[f.length - 1];
  if (document.activeElement === sheet) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Teardown safety. Once open() sets inert on the background, a module destroyed
 * while its sheet is open would leave the NEXT view inert and unreachable.
 */
export function releaseSheetInertness(main) {
  if (!main) return;
  for (const el of main.children) el.inert = false;
}
