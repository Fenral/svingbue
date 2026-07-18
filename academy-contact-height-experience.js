/* academy-contact-height-experience.js — S1: Contact Height på kamera-standarden.
   Scene-first instrument (delt skall), direkte manipulasjon, Pin+Δ, kompakte
   kunnskapssteg i arket, live-gate (lav/høy bane, uendret Attack) → mastery.

   K1-KONTRAKT: scenen bygges ÉN gang; all input oppdaterer in-place
   (textContent/attributter/SVG-attributter). innerHTML kun ved mount og
   flatebytte i arket. persist() debounces til gestslutt / 300 ms stille.

   Kildetags: /* engine * / = motorverdi via solveContactHeightState
   (impact-flight-motoren), /* engine-derived * / = konstant fra motorens
   grenser, /* mock * / = ren viewport-/presentasjonsskalering. */
import { CONTACT_HEIGHT_CONTENT } from './academy-contact-height-content.js';
import { evaluateContactHeightTransfer, solveContactHeightState } from './academy-contact-height-model.js';
import { featureEnabled } from './academy-feature-flags.js';
import {
  mountInstrumentShell, makeNumberTween, makeDebouncedPersist,
  bindVerticalDrag, buildSliderRow, runMasteryChoreography, instrumentHaptics,
} from './academy-instrument-shell.js';

const clean = v => Math.abs(v) < 1e-12 ? 0 : v;
const signed = (v, unit, dp = 1) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(clean(v)).toFixed(dp)}${unit}`;
const attemptId = () => `contact-height-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const Z_MIN = -.01, Z_MAX = .03, Z_STEP = .001; /* engine-derived: CONTACT_HEIGHT_LIMITS-domenet */
const XP_AWARD = 120;                            /* engine-derived: ACADEMY_MASTERY_XP (store) */
const STRIKE_ACCENT = '#8ee8d0';                 /* familieaksent --lp-green (academy-contact-height.css) */
/* scene-skalering — alt under er /* mock */
const VB_W = 390, VB_H = 300, GROUND_Y = 214, BALL_X = 195, S = 2.2 /* px per mm */, X_CM = 5.2;
const BALL_R_MM = 21.3; /* engine-derived: BALL_RADIUS_M */

function restore(source = {}) {
  const v2 = source.evidence?.contactHeight?.v2 || {};
  return {
    phase: ['explore', 'knowledge', 'live', 'result'].includes(v2.phase) ? v2.phase : 'explore',
    z: Number.isFinite(v2.z) ? Math.min(Z_MAX, Math.max(Z_MIN, v2.z)) : -.002,
    answers: Array.from({ length: 4 }, (_, i) => Number.isInteger(v2.answers?.[i]) ? v2.answers[i] : null),
    qIndex: Number.isInteger(v2.qIndex) ? Math.min(3, Math.max(0, v2.qIndex)) : 0,
    transfer: v2.transfer && typeof v2.transfer === 'object' ? structuredClone(v2.transfer) : null,
    lastResult: v2.lastResult || null,
    attemptId: source.activeAttempt?.attemptId || v2.attemptId || null,
    attemptNumber: Number.isInteger(v2.attemptNumber) ? v2.attemptNumber : 0,
    knowledgeBestCorrect: Number.isInteger(source.evidence?.knowledgeBestCorrect) ? source.evidence.knowledgeBestCorrect : 0,
  };
}

export function mountContactHeightExperience(options = {}) {
  const {
    root, state: stored = {}, conceptId = null, prerequisiteMet = false, saveProgress = () => {},
    submitMastery = () => null, nextAction = () => ({ label: 'Back to Academy', route: '#/academy' }),
    navigate = () => {}, voiceTargets,
    onVoiceSurface = () => {}, onVoiceInterrupt = () => {}, onVoiceMilestone = () => {},
  } = options;
  if (!(root instanceof HTMLElement)) throw new TypeError('Contact Height root is required');

  if (!featureEnabled('strike-depth')) {
    root.innerHTML = '<main class="ai-shell"><section class="ai-sheet" style="margin:auto;border-radius:16px"><p class="ai-feedback">Contact Height is not available yet.</p></section></main>';
    return () => { root.innerHTML = ''; };
  }

  const progress = restore(stored);
  let destroyed = false, pinned = null;
  const cleanups = [];
  const listen = (t, e, h, o) => { t.addEventListener(e, h, o); cleanups.push(() => t.removeEventListener(e, h, o)); };

  const persistNow = (extra = {}) => saveProgress({
    surface: progress.phase === 'result' ? 5 : progress.phase === 'live' ? 4 : progress.phase === 'knowledge' ? 3 : 1,
    ...(progress.lastResult?.status ? { status: progress.lastResult.status } : {}),
    ...extra,
    evidence: {
      ...(stored.evidence || {}),
      contactHeight: {
        ...(stored.evidence?.contactHeight || {}),
        v2: {
          phase: progress.phase, z: progress.z, answers: [...progress.answers], qIndex: progress.qIndex,
          transfer: progress.transfer ? structuredClone(progress.transfer) : null,
          lastResult: progress.lastResult, attemptId: progress.attemptId, attemptNumber: progress.attemptNumber,
        },
      },
      instrumentTouched: true,
      /* mastered-evidens må følge HVER persist — appens deriveExperienceStatus
         regner status fra evidensen i payloaden, og et senere persist uten
         disse feltene degraderer mastered → practiced. */
      ...(progress.knowledgeBestCorrect > 0 ? { knowledgeBestCorrect: progress.knowledgeBestCorrect, knowledgeTotal: 5 } : {}),
      ...(progress.lastResult?.liveTransferPassed ? { liveTransferPassed: true } : {}),
      ...extra.evidence,
    },
  });
  const persist = makeDebouncedPersist(persistNow); /* K1: gestslutt / 300 ms */

  /* ── skall + scene (bygges ÉN gang) ─────────────────────────────────────── */
  const shell = mountInstrumentShell(root, {
    kicker: 'ACADEMY · STRIKE · CONTACT HEIGHT',
    heroLabel: 'MODELED CONTACT HEIGHT', heroUnit: 'mm',
    sectionLabel: 'INPUT · STRIKE PLANE', hint: 'drag scene vertically',
    pinLabel: 'Pin', onBack: () => navigate('#/academy'),
  });
  const { slot } = shell;

  const svgNS = 'http://www.w3.org/2000/svg';
  const canvas = slot('canvas');
  canvas.innerHTML = `
  <svg viewBox="0 0 ${VB_W} ${VB_H}" preserveAspectRatio="xMidYMid meet" role="img" data-voice-target="contact-height-window" aria-label="Rigid swing arc over a flat modeled ground. Dragging translates the arc vertically; contact height changes while attack stays unchanged.">
    <text x="14" y="${GROUND_Y - 8}">FLAT GROUND · MODEL</text>
    <line data-ref="ground" x1="10" y1="${GROUND_Y}" x2="${VB_W - 10}" y2="${GROUND_Y}" stroke="rgba(247,248,251,.5)" stroke-width="1.2"/>
    <circle data-ref="ball" cx="${BALL_X}" cy="${GROUND_Y - BALL_R_MM * S}" r="${(BALL_R_MM * S).toFixed(1)}" fill="rgba(121,217,255,.05)" stroke="rgba(247,248,251,.72)" stroke-width="1.4"/>
    <line data-ref="centerline" x1="${BALL_X - BALL_R_MM * S - 14}" y1="${GROUND_Y - BALL_R_MM * S}" x2="${BALL_X + BALL_R_MM * S + 14}" y2="${GROUND_Y - BALL_R_MM * S}" stroke="rgba(121,217,255,.55)" stroke-width="1" stroke-dasharray="3 2"/>
    <text x="${BALL_X + BALL_R_MM * S + 18}" y="${GROUND_Y - BALL_R_MM * S + 3}">BALL CENTER</text>
    <g data-ref="ghostG" opacity="0"><path data-ref="ghostArc" fill="none" stroke="var(--ghost,#A7A0C4)" stroke-width="1.6" stroke-dasharray="5 4"/><circle data-ref="ghostContact" r="4.5" fill="none" stroke="var(--ghost,#A7A0C4)" stroke-width="1.4"/></g>
    <g data-ref="arcG"><path data-ref="arc" fill="none" stroke="${STRIKE_ACCENT}" stroke-width="2.2"/></g>
    <g data-ref="entryG" opacity="0"><line data-ref="entryLine" y1="${GROUND_Y - 9}" y2="${GROUND_Y + 9}" stroke="var(--lp-amber,#ffc27a)" stroke-width="1.6"/><text data-ref="entryText" y="${GROUND_Y + 22}" text-anchor="middle">ENTRY</text></g>
    <g data-ref="dimG" class="ai-dim-g">
      <line data-ref="dimLine" class="ai-dim" x1="${BALL_X - 58}" x2="${BALL_X - 58}" y1="${GROUND_Y}"/>
      <line data-ref="dimCapA" class="ai-dim" x1="${BALL_X - 64}" x2="${BALL_X - 52}" y1="${GROUND_Y}" y2="${GROUND_Y}"/>
      <line data-ref="dimCapB" class="ai-dim" x1="${BALL_X - 64}" x2="${BALL_X - 52}"/>
      <text data-ref="dimText" class="ai-dim-text" x="${BALL_X - 66}" text-anchor="end"></text>
    </g>
    <circle data-ref="contact" data-voice-target="contact-height-point" r="5" fill="var(--lp-amber,#ffc27a)" stroke="#071016" stroke-width="1.5"/>
    <g data-ref="attackChip">
      <rect class="ai-anno-chip" x="${VB_W - 178}" y="14" width="164" height="34" rx="9"/>
      <text x="${VB_W - 166}" y="28">ATTACK · INVARIANT</text>
      <text data-ref="attackText" class="ai-anno-chip-text" x="${VB_W - 166}" y="41"></text>
    </g>
  </svg>`;
  const ref = name => canvas.querySelector(`[data-ref="${name}"]`);
  const refs = Object.fromEntries(['arcG', 'arc', 'ghostG', 'ghostArc', 'ghostContact', 'contact', 'dimLine', 'dimCapB', 'dimText', 'attackText', 'entryG', 'entryLine', 'entryText'].map(n => [n, ref(n)]));

  /* rigid buegeometri tegnet ÉN gang for z=0; deretter KUN transform-translasjon */
  const base = solveContactHeightState({ lowPointZ: 0 }); /* engine */
  const lowX = BALL_X + base.lowPointX * 100 * X_CM;      /* mock-skala på x */
  const yAt = mm => GROUND_Y - mm * S;
  refs.arc.setAttribute('d',
    `M 16 ${(yAt(base.contactHeightMm) - 66).toFixed(1)} Q ${lowX.toFixed(1)} ${(yAt(base.bottomHeightMm) + 58).toFixed(1)} ${VB_W - 16} ${(yAt(base.contactHeightMm) - 84).toFixed(1)}`);
  refs.ghostArc.setAttribute('d', refs.arc.getAttribute('d'));

  const heroTween = makeNumberTween(slot('hero-value'), v => signed(v, '', 1)); /* ~160 ms ease-out */

  let state = solveContactHeightState({ lowPointZ: progress.z }); /* engine */
  let sceneRaf = 0;
  function paintScene() {
    sceneRaf = 0;
    const dyPx = -(state.input.lowPointZ - 0) * 1000 * S; /* rigid translasjon */
    refs.arcG.setAttribute('transform', `translate(0 ${dyPx.toFixed(2)})`);
    const cy = yAt(state.contactHeightMm);
    refs.contact.setAttribute('cx', BALL_X); refs.contact.setAttribute('cy', cy.toFixed(1));
    refs.dimLine.setAttribute('y2', cy.toFixed(1));
    refs.dimCapB.setAttribute('y1', cy.toFixed(1)); refs.dimCapB.setAttribute('y2', cy.toFixed(1));
    refs.dimText.setAttribute('y', ((GROUND_Y + cy) / 2 + 3).toFixed(1));
    refs.dimText.textContent = signed(state.contactHeightMm, ' MM');
    refs.attackText.textContent = `${signed(state.attackAngle, '°', 3)} · UNCHANGED`; /* engine-invariant */
    if (state.groundEntryCm === null) refs.entryG.setAttribute('opacity', '0');
    else {
      const ex = BALL_X + state.groundEntryCm * X_CM;
      refs.entryG.setAttribute('opacity', '1');
      refs.entryLine.setAttribute('x1', ex.toFixed(1)); refs.entryLine.setAttribute('x2', ex.toFixed(1));
      refs.entryText.setAttribute('x', ex.toFixed(1));
      refs.entryText.textContent = state.groundEntryOrder === 'before-ball' ? 'ENTRY · BEFORE BALL' : 'ENTRY · AFTER BALL';
    }
    heroTween(state.contactHeightMm);
    slot('hero-secondary').textContent = `${signed(state.ballCenterOffsetMm, ' mm')} · ${state.ballCenterRelation === 'above-center' ? 'ABOVE' : state.ballCenterRelation === 'below-center' ? 'BELOW' : 'AT'} BALL CENTER`;
    updateDelta(); updatePhaseLive();
  }
  const requestScene = () => { if (!sceneRaf) sceneRaf = requestAnimationFrame(paintScene); };

  /* ── Pin + Δ ────────────────────────────────────────────────────────────── */
  function updateDelta() {
    const delta = slot('delta');
    if (!pinned) { delta.hidden = true; return; }
    delta.hidden = false;
    slot('delta-line').textContent =
      `${signed(state.contactHeightMm - pinned.contactHeightMm, ' mm', 1)} contact · Δ attack ${signed(state.attackAngle - pinned.attackAngle, '°', 3)}`;
  }
  listen(slot('pin'), 'click', () => {
    pinned = { z: state.input.lowPointZ, contactHeightMm: state.contactHeightMm, attackAngle: state.attackAngle };
    slot('pin').setAttribute('aria-pressed', 'true'); slot('pin').textContent = 'Re-pin';
    const dyPx = -pinned.z * 1000 * S;
    refs.ghostG.setAttribute('opacity', '1');
    refs.ghostArc.setAttribute('transform', `translate(0 ${dyPx.toFixed(2)})`);
    refs.ghostContact.setAttribute('cx', BALL_X); refs.ghostContact.setAttribute('cy', yAt(pinned.contactHeightMm).toFixed(1));
    instrumentHaptics.capture(); updateDelta();
  });

  /* ── input: slider (sekundær) + vertikal drag (primær) — K1-rene ────────── */
  const setZ = (z, { fromSlider = false } = {}) => {
    z = Math.min(Z_MAX, Math.max(Z_MIN, Math.round(z / Z_STEP) * Z_STEP));
    if (z === progress.z) return;
    progress.z = z;
    state = solveContactHeightState({ lowPointZ: z }); /* engine */
    if (!fromSlider && sliderRow) { sliderRow.input.value = z; }
    if (sliderRow) { sliderRow.setFill(z); sliderRow.output.textContent = signed(state.bottomHeightMm, ' MM'); sliderRow.input.setAttribute('aria-valuetext', signed(state.bottomHeightMm, ' millimeters')); }
    if (progress.phase === 'live' && progress.transfer) { progress.transfer.input = { lowPointZ: z }; progress.transfer.interacted = true; }
    onVoiceInterrupt('model-input');
    requestScene(); persist.request();
  };
  bindVerticalDrag(slot('scene'), {
    onDelta: dy => setZ(progress.z - dy / (S * 1000)), /* drag opp = bue opp; mock-skala */
    onEnd: () => persist.flush(),
  });

  /* ── sheet-faser (innerHTML KUN her — flatebytte, aldri i input-sti) ────── */
  const sheet = slot('sheet');
  let sliderRow = null;
  const knowledgeDone = () => progress.answers.every((a, i) => a !== null);
  const knowledgeScore = () => CONTACT_HEIGHT_CONTENT.masteryTasks.slice(0, 4).reduce((s, t, i) => s + (progress.answers[i] === t.answerIndex ? 1 : 0), 0);

  function mountSlider(container) {
    sliderRow = buildSliderRow(container, {
      id: 'arc-bottom', label: 'Arc height at bottom', dot: STRIKE_ACCENT,
      min: Z_MIN, max: Z_MAX, step: Z_STEP, value: progress.z,
      ariaLabel: 'Arc height at bottom',
    });
    sliderRow.output.textContent = signed(state.bottomHeightMm, ' MM');
    listen(sliderRow.input, 'input', () => {
      const v = sliderRow.input.valueAsNumber;
      if (Number.isFinite(v)) setZ(v, { fromSlider: true });
    });
    listen(sliderRow.input, 'change', () => persist.flush());
  }

  function setPhase(phase, { announce = true } = {}) {
    progress.phase = phase; sliderRow = null;
    if (phase === 'explore') {
      sheet.innerHTML = `
        <div data-slider></div>
        <div class="ai-chiprow">
          <span class="ai-chip ai-chip--read" data-band="low">A · 1–5 MM ABOVE GROUND</span>
          <span class="ai-chip ai-chip--read" data-band="high">B · 22–26 MM ABOVE GROUND</span>
        </div>
        <p class="ai-feedback">One rigid arc. Translate it vertically — the gold dimension is the proof; the tangent chip never moves.</p>
        <button class="ai-primary" data-start>Start mastery</button>
        ${prerequisiteMet ? '' : '<p class="ai-count">PREVIEW · master Low Point before the live gate unlocks</p>'}`;
      mountSlider(sheet.querySelector('[data-slider]'));
      sheet.querySelector('[data-start]').addEventListener('click', () => setPhase('knowledge'));
      if (announce) onVoiceSurface(0, 'academy.contact-height.s0.entry');
    }
    if (phase === 'knowledge') {
      const task = CONTACT_HEIGHT_CONTENT.masteryTasks[progress.qIndex];
      const selected = progress.answers[progress.qIndex];
      sheet.innerHTML = `
        <p class="ai-count">KNOWLEDGE ${progress.qIndex + 1} OF 4</p>
        <p class="ai-question"></p>
        <div class="ai-chiprow" role="radiogroup" data-choices></div>
        <p class="ai-feedback" data-fb hidden></p>
        <button class="ai-primary" data-next hidden>${progress.qIndex < 3 ? 'Next question' : 'To the live gate'}</button>`;
      sheet.querySelector('.ai-question').textContent = task.prompt;
      const choices = sheet.querySelector('[data-choices]');
      task.choices.forEach((label, index) => {
        const b = document.createElement('button');
        b.className = 'ai-chip'; b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', String(selected === index)); b.textContent = label;
        b.addEventListener('click', () => {
          if (progress.answers[progress.qIndex] !== null) return;
          progress.answers[progress.qIndex] = index;
          instrumentHaptics.answer();
          choices.querySelectorAll('button').forEach((x, i) => x.setAttribute('aria-checked', String(i === index)));
          const fb = sheet.querySelector('[data-fb]');
          fb.hidden = false; fb.textContent = index === task.answerIndex ? 'Confirmed.' : 'Noted — this one counts against the gate.';
          sheet.querySelector('[data-next]').hidden = false;
          persist.request();
        });
        choices.appendChild(b);
      });
      if (selected !== null) { sheet.querySelector('[data-fb]').hidden = false; sheet.querySelector('[data-next]').hidden = false; }
      sheet.querySelector('[data-next]').addEventListener('click', () => {
        if (progress.qIndex < 3) { progress.qIndex += 1; setPhase('knowledge', { announce: false }); }
        else if (prerequisiteMet) startLive();
        else setPhase('explore', { announce: false });
        persist.request();
      });
    }
    if (phase === 'live') {
      const low = progress.transfer.phase === 'low';
      sheet.innerHTML = `
        <section data-voice-target="contact-height-live">
        <p class="ai-count">LIVE · ${low ? 'A · PLACE CONTACT 1.0–5.0 MM' : 'B · PLACE CONTACT 22.0–26.0 MM'} · ATTACK HELD</p>
        <div data-slider></div>
        <div class="ai-chiprow" role="radiogroup" data-ack></div>
        <p class="ai-feedback" data-live-fb></p>
        <button class="ai-primary" data-capture disabled>${low ? 'Capture low path' : 'Capture high path & submit'}</button>
        </section>`;
      mountSlider(sheet.querySelector('[data-slider]'));
      const ack = sheet.querySelector('[data-ack]');
      const mk = (label, key, val) => {
        const b = document.createElement('button');
        b.className = 'ai-chip'; b.setAttribute('role', 'radio'); b.dataset[key] = val; b.textContent = label;
        b.setAttribute('aria-checked', 'false'); ack.appendChild(b); return b;
      };
      if (low) mk('The modeled bottom may still be below ground', 'ack', 'below');
      else { mk('Path point is above modeled ball center', 'hi', 'above-center'); mk('Path point is below modeled ball center', 'hi', 'below-center'); }
      ack.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.ack) progress.transfer.lowAcknowledgesBottomBelow = true;
        if (b.dataset.hi) progress.transfer.highLabel = b.dataset.hi;
        ack.querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', String(x === b || (b.dataset.ack && x.dataset.ack))));
        instrumentHaptics.answer(); updatePhaseLive(); persist.request();
      });
      sheet.querySelector('[data-capture]').addEventListener('click', onCapture);
      updatePhaseLive();
      if (announce) onVoiceSurface(4, 'academy.contact-height.s4.live');
    }
    if (phase === 'result') {
      const r = progress.lastResult || {}, mastered = r.status === 'mastered';
      const next = nextAction();
      sheet.innerHTML = `
        <section data-voice-target="contact-height-result">
        <p class="ai-count">CONTACT HEIGHT · ${mastered ? 'MASTERED' : 'NOT YET'}</p>
        <p class="ai-question">${mastered ? 'You separated contact height from Attack.' : 'One height relationship needs repair.'}</p>
        <p class="ai-feedback">Knowledge + live: <strong>${r.knowledgeCorrect ?? 0}/5</strong>${r.xpAwarded ? ` · +${r.xpAwarded} XP` : ''}</p>
        ${mastered ? '' : '<button class="ai-secondary" data-retry>Retry mastery</button>'}
        <button class="ai-primary" data-done></button>
        </section>`;
      const done = sheet.querySelector('[data-done]');
      done.textContent = next.label; done.addEventListener('click', () => navigate(next.route));
      sheet.querySelector('[data-retry]')?.addEventListener('click', () => {
        progress.attemptNumber += 1; progress.attemptId = attemptId();
        progress.answers = [null, null, null, null]; progress.qIndex = 0; progress.transfer = null;
        setPhase('knowledge'); persist.request();
      });
    }
    registerVoice(); persist.request();
  }

  function startLive() {
    progress.attemptId = progress.attemptId || attemptId();
    progress.transfer = { phase: 'low', input: { lowPointZ: progress.z }, interacted: false, lowAcknowledgesBottomBelow: false, highLabel: null, low: null, high: null, evaluation: null };
    persistNow({ activeAttempt: { attemptId: progress.attemptId, contentVersion: 1 } });
    setPhase('live');
  }

  function liveReady() {
    if (progress.phase !== 'live' || !progress.transfer) return false;
    const t = progress.transfer, low = t.phase === 'low';
    const inBand = low ? state.contactHeight >= .001 && state.contactHeight <= .005
      : state.contactHeight >= .022 && state.contactHeight <= .026;
    const label = low ? t.lowAcknowledgesBottomBelow : t.highLabel === 'above-center';
    return inBand && label && t.interacted;
  }
  let wasAbove = false;
  function updatePhaseLive() {
    if (!wasAbove && state.ballCenterRelation === 'above-center') { wasAbove = true; onVoiceMilestone('academy.contact-height.s1.center'); }
    const lowChip = sheet.querySelector('[data-band="low"]'), highChip = sheet.querySelector('[data-band="high"]');
    if (lowChip) lowChip.dataset.hit = String(state.contactHeight >= .001 && state.contactHeight <= .005);
    if (highChip) highChip.dataset.hit = String(state.contactHeight >= .022 && state.contactHeight <= .026);
    const btn = sheet.querySelector('[data-capture]'); if (!btn) return;
    btn.disabled = !liveReady();
    const fb = sheet.querySelector('[data-live-fb]');
    if (fb) {
      const t = progress.transfer, low = t.phase === 'low';
      fb.textContent = !t.interacted ? 'Move only the vertical arc height.'
        : !(low ? state.contactHeight >= .001 && state.contactHeight <= .005 : state.contactHeight >= .022 && state.contactHeight <= .026)
          ? (low ? 'Place raw contact height inside 1.0–5.0 mm.' : 'Place raw contact height inside 22.0–26.0 mm.')
        : !(low ? t.lowAcknowledgesBottomBelow : t.highLabel === 'above-center') ? 'Answer the label check below.'
        : 'Gate ready — capture it.';
    }
  }

  function onCapture() {
    const t = progress.transfer; if (!liveReady()) return;
    const captured = { input: { ...t.input } };
    instrumentHaptics.capture();
    if (t.phase === 'low') { t.low = captured; t.phase = 'high'; t.interacted = false; setZ(0); setPhase('live', { announce: false }); persist.flush(); return; }
    t.high = captured;
    t.evaluation = evaluateContactHeightTransfer({ lowInput: t.low.input, highInput: t.high.input, lowInteracted: true, highInteracted: true, lowAcknowledgesBottomBelow: t.lowAcknowledgesBottomBelow, highLabel: t.highLabel }); /* engine */
    const live = Boolean(t.evaluation.passed), correct = knowledgeScore() + (live ? 1 : 0);
    const evidence = { attemptId: progress.attemptId, ...structuredClone(t.evaluation) };
    progress.knowledgeBestCorrect = Math.max(progress.knowledgeBestCorrect, correct);
    const result = submitMastery({ experienceId: 'strike-depth', attemptId: progress.attemptId, contentVersion: 1, knowledgeCorrect: correct, knowledgeTotal: 5, liveTransferPassed: live, liveTransferEvidence: evidence }) || { accepted: false, xpAwarded: 0, experience: { status: 'practiced' } };
    progress.lastResult = { status: result.experience?.status || 'practiced', knowledgeCorrect: correct, liveTransferPassed: live, xpAwarded: result.xpAwarded || 0 };
    progress.attemptId = null;
    persistNow({ activeAttempt: null, status: result.experience?.status || 'practiced', evidence: { knowledgeBestCorrect: progress.knowledgeBestCorrect, knowledgeTotal: 5, liveTransferPassed: live, liveTransferEvidence: evidence } });
    if (result.accepted) {
      runMasteryChoreography(slot, { xp: result.xpAwarded || XP_AWARD });
      instrumentHaptics.mastery();
      onVoiceMilestone('academy.contact-height.s5.pass');
    }
    setPhase('result', { announce: false });
  }

  /* ── voice-targets (in-place emphasis) ──────────────────────────────────── */
  function registerVoice() {
    const map = {
      'contact-height-window': '[data-voice-target="contact-height-window"]',
      'contact-height-point': '[data-voice-target="contact-height-point"]',
      'contact-height-live': '[data-voice-target="contact-height-live"]',
      'contact-height-result': '[data-voice-target="contact-height-result"]',
    };
    for (const [id, selector] of Object.entries(map)) {
      if (!voiceTargets?.register || !root.querySelector(selector)) continue;
      try {
        cleanups.push(voiceTargets.register(id, {
          setEmphasis: ({ kind }) => { const e = root.querySelector(selector); if (e) e.dataset.voiceEmphasis = kind; },
          clear: () => { const e = root.querySelector(selector); if (e) delete e.dataset.voiceEmphasis; },
        }));
      } catch {}
    }
  }

  /* verifikasjonshook (headless akseptanse) */
  window.__aiContactHeight = {
    get z() { return progress.z; }, get phase() { return progress.phase; },
    get state() { return { contactHeightMm: state.contactHeightMm, bottomHeightMm: state.bottomHeightMm, arcLiftMm: state.arcLiftMm, attackAngle: state.attackAngle }; },
    get pinned() { return pinned; },
  };

  setPhase(progress.phase === 'live' && !progress.transfer ? 'explore' : progress.phase, { announce: true });
  paintScene();
  return () => {
    destroyed = true; persist.flush();
    cleanups.splice(0).forEach(fn => { try { fn(); } catch {} });
    delete window.__aiContactHeight;
    root.innerHTML = '';
  };
}
