const OPENING_SESSION_KEY = 'sa.opening.v1';
const OPENING_DURATION_MS = 1450;
const OPENING_LEAVE_MS = 1150;
const REDUCED_DURATION_MS = 150;
const SAFETY_TIMEOUT_MS = 1600;

function hasOpenedThisSession() {
  try {
    return sessionStorage.getItem(OPENING_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberOpening() {
  try {
    sessionStorage.setItem(OPENING_SESSION_KEY, '1');
  } catch {
    // The opening remains a transient enhancement when storage is unavailable.
  }
}

function clearPrepaintFallback() {
  if (window.__saOpeningFallback) {
    clearTimeout(window.__saOpeningFallback);
    delete window.__saOpeningFallback;
  }
}

function detachSplash(splash) {
  clearPrepaintFallback();
  document.documentElement.removeAttribute('data-sa-opening');
  if (splash?.open && typeof splash.close === 'function') splash.close();
  splash?.remove();
}

export function runOpeningSplash() {
  const splash = document.getElementById('saSplash');
  if (!splash) return Promise.resolve({ shown: false });

  const prepaintPending = document.documentElement.dataset.saOpening === 'pending';
  if (!prepaintPending || hasOpenedThisSession()) {
    detachSplash(splash);
    return Promise.resolve({ shown: false });
  }

  // Once the module has claimed the opening, its safety timer owns cleanup.
  // The inline fallback remains only for the case where this module never runs.
  clearPrepaintFallback();
  rememberOpening();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  return new Promise(resolve => {
    let settled = false;
    let ending = false;
    let leaveTimer;
    let finishTimer;
    let safetyTimer;

    const cleanup = reason => {
      if (settled) return;
      settled = true;
      clearTimeout(leaveTimer);
      clearTimeout(finishTimer);
      clearTimeout(safetyTimer);
      splash.removeEventListener('click', skip);
      splash.removeEventListener('cancel', cancel);
      detachSplash(splash);
      resolve({ shown: true, reason });
    };

    const finishEarly = reason => {
      if (ending || settled) return;
      ending = true;
      clearTimeout(leaveTimer);
      clearTimeout(finishTimer);
      splash.classList.add('is-leaving');
      finishTimer = setTimeout(() => cleanup(reason), reducedMotion ? 0 : 110);
    };

    function skip() {
      finishEarly('skipped');
    }

    function cancel(event) {
      event.preventDefault();
      finishEarly('skipped');
    }

    splash.addEventListener('click', skip);
    splash.addEventListener('cancel', cancel);
    splash.classList.toggle('is-reduced', reducedMotion);
    splash.classList.add('is-running');

    if (!splash.open) {
      if (typeof splash.showModal === 'function') splash.showModal();
      else splash.setAttribute('open', '');
    }

    requestAnimationFrame(() => {
      document.getElementById('saSplashSkip')?.focus({ preventScroll: true });
    });

    if (!reducedMotion) {
      leaveTimer = setTimeout(() => splash.classList.add('is-leaving'), OPENING_LEAVE_MS);
    }
    finishTimer = setTimeout(
      () => cleanup(reducedMotion ? 'reduced-motion' : 'completed'),
      reducedMotion ? REDUCED_DURATION_MS : OPENING_DURATION_MS,
    );
    safetyTimer = setTimeout(() => cleanup('safety-timeout'), SAFETY_TIMEOUT_MS);
  });
}

export { OPENING_SESSION_KEY };
