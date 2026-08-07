export const APP_ROUTES = Object.freeze([
  {
    id: 'home',
    label: 'Home',
    href: './index.html',
    file: 'index.html',
    icon: '<path d="M4 10.5 10 5l6 5.5v6H4z"/><path d="M8 16v-4h4v4"/>',
  },
  {
    id: 'range',
    label: 'Range',
    href: './impact.html',
    file: 'impact.html',
    icon: '<path d="M3 16c3-7 7-10 14-12"/><path d="M12 4h5v5"/><circle cx="5" cy="15" r="1.5"/>',
  },
  {
    id: 'studio',
    label: 'Studio',
    href: './impact-studio.html',
    file: 'impact-studio.html',
    icon: '<path d="M4 14h12"/><path d="M7 4v12"/><path d="m10 8 5-3"/><circle cx="10" cy="8" r="1.5"/>',
  },
  {
    id: 'jarvis',
    label: 'Guide',
    href: './jarvis.html',
    file: 'jarvis.html',
    icon: '<circle cx="10" cy="10" r="6"/><path d="M10 2v3M10 15v3M2 10h3M15 10h3"/><circle cx="10" cy="10" r="1.5"/>',
  },
]);

const ORIENTATION = Object.freeze({
  home: 'portrait',
  range: 'portrait',
  studio: 'landscape',
  jarvis: null,
});

function routeFromDocument(doc) {
  const declared = doc.body?.dataset.saRoute;
  if (APP_ROUTES.some((route) => route.id === declared)) return declared;

  const file = new URL(doc.location.href).pathname.split('/').pop() || 'index.html';
  return APP_ROUTES.find((route) => route.file === file)?.id || null;
}

function createNavigation(doc, currentRoute) {
  const nav = doc.createElement('nav');
  nav.className = 'sa-app-nav';
  nav.setAttribute('data-sa-shell', '');
  nav.setAttribute('aria-label', 'Primary navigation');

  for (const route of APP_ROUTES) {
    const link = doc.createElement('a');
    link.className = 'sa-app-nav__link';
    link.href = route.href;
    link.dataset.saRouteLink = route.id;
    link.setAttribute('aria-label', route.label);
    if (route.id === currentRoute) link.setAttribute('aria-current', 'page');
    link.innerHTML = `<svg viewBox="0 0 20 20" aria-hidden="true">${route.icon}</svg><span>${route.label}</span>`;
    nav.appendChild(link);
  }

  return nav;
}

function installOrientationGuard(doc, currentRoute) {
  const expected = ORIENTATION[currentRoute];
  const overlay = doc.querySelector('.rotate');
  if (!expected || !overlay || !doc.defaultView?.matchMedia) return;

  const media = doc.defaultView.matchMedia(`(orientation: ${expected})`);
  const original = {
    role: overlay.getAttribute('role'),
    ariaModal: overlay.getAttribute('aria-modal'),
    tabIndex: overlay.getAttribute('tabindex'),
  };
  const managed = new Map();
  let lastFocus = null;

  const setAttribute = (name, value) => {
    if (value === null) overlay.removeAttribute(name);
    else overlay.setAttribute(name, value);
  };

  const sync = () => {
    const blocked = !media.matches;
    overlay.toggleAttribute('data-sa-orientation-blocked', blocked);

    if (blocked) {
      lastFocus = doc.activeElement;
      setAttribute('role', 'dialog');
      setAttribute('aria-modal', 'true');
      setAttribute('tabindex', '0');

      for (const child of doc.body.children) {
        if (child === overlay || child.tagName === 'SCRIPT') continue;
        if (!managed.has(child)) managed.set(child, child.hasAttribute('inert'));
        child.setAttribute('inert', '');
      }

      doc.defaultView.requestAnimationFrame(() => overlay.focus({ preventScroll: true }));
      return;
    }

    setAttribute('role', original.role);
    setAttribute('aria-modal', original.ariaModal);
    setAttribute('tabindex', original.tabIndex);
    for (const [child, wasInert] of managed) {
      if (!wasInert) child.removeAttribute('inert');
    }
    managed.clear();

    if (lastFocus instanceof doc.defaultView.HTMLElement && lastFocus.isConnected) {
      lastFocus.focus({ preventScroll: true });
    }
    lastFocus = null;
  };

  overlay.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab' || !overlay.hasAttribute('data-sa-orientation-blocked')) return;
    event.preventDefault();
    overlay.focus({ preventScroll: true });
  });
  media.addEventListener?.('change', sync);
  sync();
}

export function mountAppShell(doc = document) {
  if (!doc.body || doc.querySelector('[data-sa-shell]')) return;

  const currentRoute = routeFromDocument(doc);
  if (!currentRoute) return;
  doc.body.dataset.saRoute = currentRoute;
  doc.body.appendChild(createNavigation(doc, currentRoute));
  doc.body.classList.add('sa-shell-ready');
  installOrientationGuard(doc, currentRoute);

  if (currentRoute === 'range') {
    import('./sa-range-context.js')
      .then(({ mountGuidedRangeContext }) => mountGuidedRangeContext(doc))
      .catch(() => {});
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mountAppShell(), { once: true });
  } else {
    mountAppShell();
  }
}
