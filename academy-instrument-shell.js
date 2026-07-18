/* academy-instrument-shell.js — S1: delt Academy-instrumentskall (kamera-standard).
   Mønster fra Impact-flaten (strikearc-kamera): scene-first (~60 % viewport),
   hero-avlesning øverst venstre, Pin+Δ, bottom sheet med grab-handle, semantiske
   slidere, direkte manipulasjon (vertikal drag i scenen er primær input).

   K1-KONTRAKT (ufravikelig): skallet monterer statisk DOM ÉN gang og eksponerer
   in-place-oppdatering (textContent/attributter). INGEN innerHTML i noen
   input-sti. Event-lyttere bindes én gang. persist() debounces til gestslutt.
   Tall tweener ~160 ms ease-out; alt dør under prefers-reduced-motion. */
import saHaptics from './sa-haptics.js';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── skjelett (monteres ÉN gang per flate) ────────────────────────────────── */
export function mountInstrumentShell(root, { title, kicker, heroLabel, heroUnit, sectionLabel, hint = 'drag scene vertically', pinLabel = 'Pin', onBack = null }) {
  const el = document.createElement('main');
  el.className = 'ai-shell';
  el.innerHTML = `
    <section class="ai-scene" data-slot="scene">
      <div class="ai-topline">
        ${onBack ? '<button class="ai-back" data-slot="back" aria-label="Back to Academy">←</button>' : ''}
        <span class="ai-kicker" data-slot="kicker"></span>
        <button class="ai-pin" data-slot="pin" aria-pressed="false"></button>
      </div>
      <header class="ai-hero">
        <small data-slot="hero-label"></small>
        <div class="ai-hero__value"><strong data-slot="hero-value">—</strong><span data-slot="hero-unit"></span></div>
        <div class="ai-hero__secondary" data-slot="hero-secondary"></div>
        <div class="ai-delta" data-slot="delta" hidden>
          <small>Δ vs previous pin</small>
          <span data-slot="delta-line"></span>
        </div>
      </header>
      <div class="ai-canvas" data-slot="canvas"></div>
      <div class="ai-cascade" data-slot="cascade" aria-hidden="true" hidden>
        <span></span><span></span><span></span><span></span><span></span>
        <strong class="ai-cascade__xp" data-slot="cascade-xp"></strong>
      </div>
    </section>
    <section class="ai-sheet">
      <div class="ai-sheet__grab" aria-hidden="true"></div>
      <div class="ai-voice" data-academy-voice-slot></div>
      <header class="ai-sheet__head">
        <span class="ai-eyebrow" data-slot="section-label"></span>
        <span class="ai-hint" data-slot="hint"></span>
      </header>
      <div class="ai-sheet__body" data-slot="sheet"></div>
    </section>`;
  const slot = name => el.querySelector(`[data-slot="${name}"]`);
  slot('kicker').textContent = kicker || title || '';
  slot('hero-label').textContent = heroLabel || '';
  slot('hero-unit').textContent = heroUnit || '';
  slot('section-label').textContent = sectionLabel || '';
  slot('hint').textContent = hint;
  slot('pin').textContent = pinLabel;
  if (onBack) slot('back').addEventListener('click', onBack);
  root.appendChild(el);
  return { el, slot };
}

/* ── talltween ~160 ms ease-out (K1: kun textContent) ─────────────────────── */
export function makeNumberTween(el, format) {
  let raf = 0, current = null;
  return function to(target) {
    if (raf) cancelAnimationFrame(raf);
    if (reduced() || current === null || !Number.isFinite(current)) {
      current = target; el.textContent = format(target); return;
    }
    const from = current, t0 = performance.now(), DUR = 160;
    const tick = now => {
      const k = Math.min(1, (now - t0) / DUR), e = 1 - (1 - k) ** 3; /* ease-out */
      current = from + (target - from) * e;
      el.textContent = format(current);
      raf = k < 1 ? requestAnimationFrame(tick) : 0;
    };
    raf = requestAnimationFrame(tick);
  };
}

/* ── debounced persist: gestslutt (pointerup) eller 300 ms stille ─────────── */
export function makeDebouncedPersist(fn, quietMs = 300) {
  let timer = 0;
  const flush = () => { if (timer) { clearTimeout(timer); timer = 0; fn(); } };
  const request = () => { if (timer) clearTimeout(timer); timer = setTimeout(() => { timer = 0; fn(); }, quietMs); };
  return { request, flush };
}

/* ── vertikal drag i scenen (primær input) — pointer capture, RAF-koalesert ─ */
export function bindVerticalDrag(surface, { onDelta, onStart = () => {}, onEnd = () => {} }) {
  let active = null, pending = 0, raf = 0;
  const flushMove = () => { raf = 0; if (active && pending) { const dy = pending; pending = 0; onDelta(dy); } };
  surface.addEventListener('pointerdown', e => {
    if (e.button) return;
    active = { id: e.pointerId, y: e.clientY };
    try { surface.setPointerCapture(e.pointerId); } catch { /* pointer alt sluppet */ }
    onStart();
  });
  surface.addEventListener('pointermove', e => {
    if (!active || e.pointerId !== active.id) return;
    pending += e.clientY - active.y; active.y = e.clientY;
    if (!raf) raf = requestAnimationFrame(flushMove);
  });
  const end = e => { if (active && e.pointerId === active.id) { active = null; pending = 0; onEnd(); } };
  surface.addEventListener('pointerup', end);
  surface.addEventListener('pointercancel', end);
}

/* ── semantisk slider-rad (bygges én gang; oppdateres in-place) ───────────── */
export function buildSliderRow(container, { id, label, dot, min, max, step, value, ariaLabel }) {
  const row = document.createElement('label');
  row.className = 'ai-sliderrow';
  row.innerHTML = `
    <span class="ai-sliderrow__head">
      <span class="ai-sliderrow__dot" style="--dot:${dot}"></span>
      <span class="ai-sliderrow__label"></span>
      <output class="ai-sliderrow__value"></output>
    </span>
    <input type="range" data-instrument-input="${id}">`;
  row.querySelector('.ai-sliderrow__label').textContent = label;
  const input = row.querySelector('input');
  Object.assign(input, { min, max, step, value });
  input.setAttribute('aria-label', ariaLabel || label);
  input.style.setProperty('--track', dot);
  container.appendChild(row);
  const output = row.querySelector('output');
  /* spor-fyll fra nullanker til thumb */
  const zeroPct = 100 * (0 - min) / (max - min);
  const setFill = v => {
    const pct = 100 * (v - min) / (max - min);
    const [a, b] = pct >= zeroPct ? [zeroPct, pct] : [pct, zeroPct];
    input.style.setProperty('--fill-a', a.toFixed(2) + '%');
    input.style.setProperty('--fill-b', b.toFixed(2) + '%');
  };
  setFill(Number(value));
  return { row, input, output, setFill };
}

/* ── mestringskoreografi: rolig gullkaskade + XP — ingen konfetti ─────────── */
export function runMasteryChoreography(slot, { xp }) {
  const cascade = slot('cascade');
  slot('cascade-xp').textContent = `+${xp} XP`;
  cascade.hidden = false;
  if (reduced()) { cascade.dataset.state = 'settled'; return; }
  cascade.dataset.state = '';
  requestAnimationFrame(() => requestAnimationFrame(() => { cascade.dataset.state = 'run'; }));
}

/* ── delt haptikk-commit-hook (gjenbruker sa-haptics-grammatikken) ────────── */
export const instrumentHaptics = {
  answer: () => saHaptics.tick('academy-answer'),   /* myth-/kunnskapssvar */
  capture: () => saHaptics.impact('medium'),        /* bevis-capture */
  mastery: () => saHaptics.band('academy-mastery'), /* mestring */
};
