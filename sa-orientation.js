/* ══════════════════════════════════════════════════════════════════════════
   sa-orientation.js — Flightglass shared per-screen orientation lock
   Imported with `<script type="module">` from each shipping page.

   Product rule: the app is PORTRAIT by default; geometry is the one LANDSCAPE
   screen. Each page owns its orientation and asserts it on load
   (index/impact/academy → lockPortrait, geometry → lockLandscape). Because the
   pages are separate documents, a full-page navigation into geometry rotates
   to landscape and navigating back rotates to portrait.

   Platform (mirrors sa-haptics.js):
     • window.Capacitor?.isNativePlatform() → resolve ScreenOrientation
       through Capacitor's native-injected registerPlugin bridge. The static
       www payload has no bundler, so this module intentionally has no bare
       npm imports.
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

import './sa-app-shell.js';

let nativePlugin = null;

function capacitorBridge() {
  try {
    return typeof window !== 'undefined' ? window.Capacitor : null;
  } catch (e) {
    return null;
  }
}

function isNative() {
  try {
    const capacitor = capacitorBridge();
    return !!(capacitor && capacitor.isNativePlatform && capacitor.isNativePlatform());
  } catch (e) {
    return false;
  }
}

export function resolveScreenOrientationPlugin(capacitor = capacitorBridge()) {
  if (nativePlugin) return nativePlugin;
  if (!capacitor) return null;

  try {
    // Capacitor.Plugins keeps older native shells working; registerPlugin is
    // the canonical Capacitor 7 bridge exposed inside the native WebView.
    const registered = capacitor.Plugins && capacitor.Plugins.ScreenOrientation;
    if (registered) {
      nativePlugin = registered;
      return nativePlugin;
    }
    if (typeof capacitor.isPluginAvailable === 'function'
        && !capacitor.isPluginAvailable('ScreenOrientation')) {
      return null;
    }
    if (typeof capacitor.registerPlugin === 'function') {
      nativePlugin = capacitor.registerPlugin('ScreenOrientation');
      return nativePlugin || null;
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function lock(orientation) {
  if (!isNative()) return; // web: CSS rotate-hint is the fallback, never force-rotate
  const plugin = resolveScreenOrientationPlugin();
  if (!plugin || typeof plugin.lock !== 'function') return;
  try {
    await plugin.lock({ orientation });
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
