/* ══════════════════════════════════════════════════════════════════════════
   sa-haptics.js — Flightglass shared haptics module (Stage 4, ESM singleton)
   Imported with `<script type="module">` from geometry.html / impact.html.

   Per Apple HIG: haptics mark physical events and detents, never decoration.

   Platform:
     • window.Capacitor?.isNativePlatform() → resolve Haptics through
       Capacitor's native-injected registerPlugin bridge. The static www
       payload has no bundler, so this module intentionally has no bare npm
       imports.
     • otherwise → NO-OP that pushes {t, kind} into a ring buffer (sa._log,
       max 50) + console.debug('[haptic]', kind). NEVER calls navigator.vibrate.
     • Never throws if Capacitor is absent / not ready.

   Rate limiting:
     • MIN_TICK_MS = 70 per key — coalesces multiple detent crossings within
       one input event into ONE tick.
     • band(key) beats tick(key) within a 120ms window for the SAME key: a
       band pulse suppresses any tick for that key that would otherwise fire
       in that window.

   Public API (default export, singleton):
     enabled                → boolean, persisted in localStorage 'sa_haptics' (default true)
     setEnabled(v)          → void
     impact(style)           'light' | 'medium' | 'heavy'
     notify(type)             'success' | 'warning' | 'error'
     selectionStart()        idempotent — no-op if a session is already open
     selectionChanged()
     selectionEnd()           closes the session opened by selectionStart()
     tick(key)                rate-limited selectionChanged() per key
     band(key)                a band-change pulse = impact('light') that
                               suppresses any tick(key) within the same 120ms window
   ══════════════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'sa_haptics';
const MIN_TICK_MS = 70;
const BAND_SUPPRESS_MS = 120;
const LOG_MAX = 50;
const IMPACT_STYLE = Object.freeze({
  light: 'LIGHT',
  medium: 'MEDIUM',
  heavy: 'HEAVY',
});
const NOTIFICATION_TYPE = Object.freeze({
  success: 'SUCCESS',
  warning: 'WARNING',
  error: 'ERROR',
});

function capacitorBridge() {
  try {
    return typeof window !== 'undefined' ? window.Capacitor : null;
  } catch (e) {
    return null;
  }
}

export function resolveHapticsPlugin(capacitor = capacitorBridge()) {
  if (!capacitor) return null;
  try {
    const registered = capacitor.Plugins && capacitor.Plugins.Haptics;
    if (registered) return registered;
    if (typeof capacitor.isPluginAvailable === 'function'
        && !capacitor.isPluginAvailable('Haptics')) {
      return null;
    }
    if (typeof capacitor.registerPlugin === 'function') {
      return capacitor.registerPlugin('Haptics') || null;
    }
  } catch (e) {
    return null;
  }
  return null;
}

function safeGetItem(key) {
  try { return window.localStorage.getItem(key); } catch (e) { return null; }
}
function safeSetItem(key, val) {
  try { window.localStorage.setItem(key, val); return true; } catch (e) { return false; }
}

class SAHaptics {
  constructor() {
    const stored = safeGetItem(STORAGE_KEY);
    this.enabled = stored === null ? true : stored === '1';
    this._log = [];               // ring buffer, non-native no-op path
    this._nativePlugin = null;    // cached native-injected Capacitor proxy
    this._selectionOpen = false;  // selectionStart/selectionEnd session guard
    this._lastTick = Object.create(null);   // key -> timestamp of last tick
    this._lastBand = Object.create(null);   // key -> timestamp of last band pulse
  }

  setEnabled(v) {
    this.enabled = !!v;
    safeSetItem(STORAGE_KEY, this.enabled ? '1' : '0');
  }

  // ── platform detection / native bridge ──────────────────────────────────
  _isNative() {
    try {
      const capacitor = capacitorBridge();
      return !!(capacitor && capacitor.isNativePlatform && capacitor.isNativePlatform());
    }
    catch (e) { return false; }
  }

  _loadNative() {
    if (this._nativePlugin) return this._nativePlugin;
    this._nativePlugin = resolveHapticsPlugin();
    return this._nativePlugin;
  }

  // logs into the ring buffer + console.debug (non-native path)
  _log_(kind) {
    this._log.push({ t: performance.now(), kind });
    if (this._log.length > LOG_MAX) this._log.shift();
    console.debug('[haptic]', kind);
  }

  // ── core dispatch: never throws, never touches navigator.vibrate ───────
  async _fireImpact(style) {
    if (!this.enabled) return;
    if (!this._isNative()) {
      this._log_('impact:' + style);
      return;
    }
    const plugin = this._loadNative();
    if (!plugin || typeof plugin.impact !== 'function') return;
    try {
      await plugin.impact({ style: IMPACT_STYLE[style] });
    } catch (e) { /* best-effort physical feedback: never throw */ }
  }

  async _fireNotify(type) {
    if (!this.enabled) return;
    if (!this._isNative()) {
      this._log_('notify:' + type);
      return;
    }
    const plugin = this._loadNative();
    if (!plugin || typeof plugin.notification !== 'function') return;
    try {
      await plugin.notification({ type: NOTIFICATION_TYPE[type] });
    } catch (e) { /* best-effort physical feedback: never throw */ }
  }

  async _fireSelection(kind) {
    if (!this.enabled) return;
    if (!this._isNative()) {
      this._log_(kind);
      return;
    }
    const plugin = this._loadNative();
    if (!plugin || typeof plugin[kind] !== 'function') return;
    try {
      await plugin[kind]();
    } catch (e) { /* best-effort physical feedback: never throw */ }
  }

  // ── public API ───────────────────────────────────────────────────────────
  impact(style) {
    if (style !== 'light' && style !== 'medium' && style !== 'heavy') return;
    this._fireImpact(style);
  }

  notify(type) {
    if (type !== 'success' && type !== 'warning' && type !== 'error') return;
    this._fireNotify(type);
  }

  selectionStart() {
    if (this._selectionOpen) return;   // idempotent
    this._selectionOpen = true;
    this._fireSelection('selectionStart');
  }

  selectionChanged() {
    this._fireSelection('selectionChanged');
  }

  selectionEnd() {
    if (!this._selectionOpen) return;
    this._selectionOpen = false;
    this._fireSelection('selectionEnd');
  }

  // rate-limited selectionChanged per key: MIN_TICK_MS between ticks for the
  // same key, and multiple crossings coalesced within one input event collapse
  // to one tick naturally via the timestamp gate. A band pulse on the same key
  // within BAND_SUPPRESS_MS beats (suppresses) the tick.
  tick(key) {
    const now = performance.now();
    const lastBand = this._lastBand[key] || -Infinity;
    if (now - lastBand < BAND_SUPPRESS_MS) return;   // band beats tick within the window
    const last = this._lastTick[key] || -Infinity;
    if (now - last < MIN_TICK_MS) return;
    this._lastTick[key] = now;
    this.selectionChanged();
  }

  // a band-change pulse = impact('light') that suppresses any tick(key) for
  // the same key within the following 120ms window.
  band(key) {
    const now = performance.now();
    this._lastBand[key] = now;
    this.impact('light');
  }
}

const sa = new SAHaptics();
export default sa;
