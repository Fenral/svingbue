function browserEnvironment() {
  if (typeof window === 'undefined') return {};
  return {
    capacitor: window.Capacitor,
    screenOrientation: window.screen?.orientation,
    addEventListener: window.addEventListener.bind(window),
    removeEventListener: window.removeEventListener.bind(window),
  };
}

export function createOrientationController(environment = browserEnvironment()) {
  const {
    capacitor,
    screenOrientation,
    addEventListener,
    removeEventListener,
  } = environment;
  let activeMode = 'unsupported';
  let plugin = null;

  function nativePlugin() {
    if (!capacitor?.isNativePlatform?.()) return null;
    if (plugin) return plugin;
    plugin = capacitor.Plugins?.ScreenOrientation || capacitor.registerPlugin?.('ScreenOrientation') || null;
    return plugin;
  }

  async function lock(orientation) {
    const native = nativePlugin();
    if (native?.lock) {
      await native.lock({ orientation });
      activeMode = 'native';
      return activeMode;
    }
    if (screenOrientation?.lock) {
      try {
        await screenOrientation.lock(orientation);
        activeMode = 'web';
        return activeMode;
      } catch {
        activeMode = 'unsupported';
      }
    }
    return activeMode;
  }

  async function release() {
    if (activeMode === 'native' && nativePlugin()?.unlock) {
      await nativePlugin().unlock();
      return 'native';
    }
    if (activeMode === 'web' && screenOrientation?.unlock) {
      try { screenOrientation.unlock(); } catch { /* progressive enhancement */ }
      return 'web';
    }
    return 'unsupported';
  }

  async function install(orientation) {
    await lock(orientation);
    const onPageHide = () => release();
    addEventListener?.('pagehide', onPageHide);
    return () => removeEventListener?.('pagehide', onPageHide);
  }

  return freezeController({ lock, release, install });
}

function freezeController(controller) {
  return Object.freeze(controller);
}

