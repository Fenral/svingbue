/* ══════════════════════════════════════════════════════════════════════════
   sa-orientation.js — Flightglass shared per-screen orientation lock
   Imported with `<script type="module">` from each shipping page.

   Product rule: the app is PORTRAIT by default; geometry is the one LANDSCAPE
   screen. Each page owns its orientation and asserts it on load
   (index/impact/academy → lockPortrait, geometry → lockLandscape). Because the
   pages are separate documents, a full-page navigation into geometry rotates
   to landscape and navigating back rotates to portrait.

   Platform (mirrors sa-haptics.js):
     • window.Capacitor?.isNativePlatform() → lazy dynamic-import
       '@capacitor/screen-orientation' and call the real plugin, which flips
       the device via the native bridge (iOS UIInterfaceOrientation /
       Android setRequestedOrientation).
     • otherwise (web: Vercel, mobile Safari/Chrome) → NO-OP. The Web
       Orientation Lock API only works in fullscreen/installed-PWA contexts and
       throws elsewhere, so we never call it; the per-page CSS rotate-hint
       (`@media (orientation:…)`) is the honest web fallback instead.
     • Never throws if Capacitor is absent / not ready.

   The native baseline (scripts/ios-landscape.mjs, scripts/android-landscape.mjs)
   must permit BOTH portrait and landscape for these runtime locks to take —
   iOS will not rotate to an orientation missing from
   UISupportedInterfaceOrientations.

   Public API (named exports):
     lockPortrait()   → Promise<void>  lock the device to portrait (native)
     lockLandscape()  → Promise<void>  lock the device to landscape (native)
   ══════════════════════════════════════════════════════════════════════════ */

let nativeMod = null;      // cached @capacitor/screen-orientation module
let nativeLoading = null;  // in-flight import promise (dedupes concurrent calls)

function isNative() {
  try {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  } catch (e) {
    return false;
  }
}

function loadNative() {
  if (nativeMod) return Promise.resolve(nativeMod);
  if (!nativeLoading) {
    nativeLoading = import('@capacitor/screen-orientation')
      .then((mod) => { nativeMod = mod; return mod; })
      .catch(() => null); // plugin missing / not ready → stay a no-op
  }
  return nativeLoading;
}

async function lock(orientation) {
  if (!isNative()) return; // web: CSS rotate-hint is the fallback, never force-rotate
  try {
    const mod = await loadNative();
    if (mod && mod.ScreenOrientation && mod.ScreenOrientation.lock) {
      await mod.ScreenOrientation.lock({ orientation });
    }
  } catch (e) {
    // Orientation is best-effort feedback, never a hard dependency — swallow.
  }
}

export function lockPortrait() {
  return lock('portrait');
}

export function lockLandscape() {
  return lock('landscape');
}

export default { lockPortrait, lockLandscape };
