/* ══════════════════════════════════════════════════════════════════════════
   sa-firstrun.js — StrikeArc shared first-run / coaching module (FOUNDATION)
   Loaded with `defer` from index.html, geometry.html, impact.html.

   Phase A defines window.SA only. It does NOT auto-run anything — later phases
   call SA.onboarding(...) / SA.coachMarks(...) with their own content + triggers.

   Public API:
     SA.seen(key)                          → boolean (was this key marked seen?)
     SA.markSeen(key)                       → void
     SA.onboarding(cards, opts)             → swipeable intro overlay (modal a11y)
     SA.coachMarks(steps, opts)             → spotlight walkthrough

   Storage keys used by the app: sa_onboarded, sa_coach_geo, sa_coach_impact.
   All localStorage access is wrapped — storage being unavailable is non-fatal.
   Motion uses GSAP when present, otherwise falls back to CSS classes from sa.css.
   ══════════════════════════════════════════════════════════════════════════ */
(function (global) {
  "use strict";

  var doc = global.document;
  var hasGSAP = function () { return typeof global.gsap !== "undefined"; };
  var prefersReduced = function () {
    try { return global.matchMedia("(prefers-reduced-motion: reduce)").matches; }
    catch (e) { return false; }
  };

  /* ── localStorage helpers (resilient to storage being unavailable) ─────── */
  function safeGet(key) {
    try { return global.localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, val) {
    try { global.localStorage.setItem(key, val); return true; } catch (e) { return false; }
  }
  function seen(key) { return safeGet(key) === "1"; }
  function markSeen(key) { return safeSet(key, "1"); }

  /* ── focus-trap utility ─────────────────────────────────────────────────── */
  var FOCUSABLE =
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
    'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function focusables(root) {
    return Array.prototype.slice.call(root.querySelectorAll(FOCUSABLE))
      .filter(function (el) { return el.offsetParent !== null || el === doc.activeElement; });
  }

  function trapFocus(root, e) {
    if (e.key !== "Tab") return;
    var f = focusables(root);
    if (!f.length) { e.preventDefault(); return; }
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function el(tag, cls, attrs) {
    var node = doc.createElement(tag);
    if (cls) node.className = cls;
    if (attrs) for (var k in attrs) if (attrs.hasOwnProperty(k)) node.setAttribute(k, attrs[k]);
    return node;
  }

  function animIn(node) {
    if (prefersReduced()) return;
    if (hasGSAP()) {
      global.gsap.from(node, { opacity: 0, y: 12, duration: 0.28, ease: "power2.out" });
    } else {
      node.classList.add("sa-anim");
    }
  }

  function animOut(node, done) {
    if (prefersReduced() || !hasGSAP()) { done(); return; }
    global.gsap.to(node, { opacity: 0, duration: 0.2, ease: "power1.in", onComplete: done });
  }

  /* ── SA.onboarding(cards, { storageKey, onDone }) ───────────────────────── */
  /* cards: [{ title, body, art }]  (art = optional SVG markup string)         */
  function onboarding(cards, opts) {
    cards = cards || [];
    opts = opts || {};
    if (!cards.length) { if (opts.onDone) opts.onDone(); return null; }

    var idx = 0;
    var lastFocus = doc.activeElement;

    var overlay = el("div", "sa-overlay", {
      role: "dialog", "aria-modal": "true", "aria-label": opts.label || "Welcome to StrikeArc"
    });
    var card = el("div", "sa-card");
    var art = el("div", "sa-card-art", { "aria-hidden": "true" });
    var h = el("h2", null, { id: "sa-onb-title" });
    var body = el("div", "sa-card-body");
    var p = el("p");
    overlay.setAttribute("aria-labelledby", "sa-onb-title");
    body.appendChild(p);

    var dots = el("div", "sa-dots", { "aria-hidden": "true" });
    var dotEls = cards.map(function () { var d = el("span", "sa-dot"); dots.appendChild(d); return d; });

    var actions = el("div", "sa-actions");
    var skip = el("button", "sa-btn sa-btn-ghost", { type: "button" });
    skip.textContent = "Skip";
    var spacer = el("span", "sa-spacer");
    var back = el("button", "sa-btn sa-btn-ghost", { type: "button" });
    back.textContent = "Back";
    var next = el("button", "sa-btn sa-btn-primary", { type: "button" });

    actions.appendChild(skip);
    actions.appendChild(spacer);
    actions.appendChild(back);
    actions.appendChild(next);

    card.appendChild(art);
    card.appendChild(h);
    card.appendChild(body);
    card.appendChild(dots);
    card.appendChild(actions);
    overlay.appendChild(card);

    function render() {
      var c = cards[idx];
      art.innerHTML = c.art || "";
      art.style.display = c.art ? "" : "none";
      h.textContent = c.title || "";
      p.textContent = c.body || "";
      dotEls.forEach(function (d, i) { d.classList.toggle("is-active", i === idx); });
      back.style.visibility = idx === 0 ? "hidden" : "visible";
      next.textContent = idx === cards.length - 1 ? "Get started" : "Next";
    }

    function go(n) {
      if (n < 0 || n >= cards.length) return;
      idx = n; render();
    }

    function close(done) {
      doc.removeEventListener("keydown", onKey, true);
      animOut(overlay, function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
        if (done && opts.onDone) opts.onDone();
      });
    }

    function finish() {
      if (opts.storageKey) markSeen(opts.storageKey);
      close(true);
    }

    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); finish(); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); idx < cards.length - 1 ? go(idx + 1) : finish(); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); return; }
      trapFocus(overlay, e);
    }

    skip.addEventListener("click", finish);
    back.addEventListener("click", function () { go(idx - 1); });
    next.addEventListener("click", function () { idx < cards.length - 1 ? go(idx + 1) : finish(); });

    /* swipe (touch) */
    var sx = null;
    overlay.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    overlay.addEventListener("touchend", function (e) {
      if (sx == null) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) < 44) return;
      if (dx < 0) { idx < cards.length - 1 ? go(idx + 1) : finish(); } else { go(idx - 1); }
    }, { passive: true });

    render();
    doc.body.appendChild(overlay);
    doc.addEventListener("keydown", onKey, true);
    animIn(overlay);
    next.focus();

    return { close: function () { close(false); }, next: function () { go(idx + 1); } };
  }

  /* ── SA.coachMarks(steps, { storageKey, onDone }) ───────────────────────── */
  /* steps: [{ selector, title, body }]                                        */
  function coachMarks(steps, opts) {
    steps = steps || [];
    opts = opts || {};
    if (!steps.length) { if (opts.onDone) opts.onDone(); return null; }

    var idx = 0;
    var lastFocus = doc.activeElement;
    var reduced = prefersReduced();

    var spotlight = el("div", "sa-spotlight", { "aria-hidden": "true" });
    var bubble = el("div", "sa-coach", {
      role: "dialog", "aria-modal": "true"
    });
    var arrow = el("div", "sa-coach-arrow", { "aria-hidden": "true" });
    // step/h/p are each their own aria-live region: after the FIRST render,
    // focus stays on whichever Next/Back button was clicked (not on the
    // bubble), so without aria-live here a step's title+body change silently.
    var step = el("div", "sa-step", { "aria-live": "polite", "aria-atomic": "true" });
    var h = el("h3", null, { id: "sa-coach-title", "aria-live": "polite", "aria-atomic": "true" });
    var p = el("p", null, { "aria-live": "polite", "aria-atomic": "true" });
    bubble.setAttribute("aria-labelledby", "sa-coach-title");

    var actions = el("div", "sa-actions");
    var skip = el("button", "sa-btn sa-btn-ghost", { type: "button" });
    skip.textContent = "Skip";
    var spacer = el("span", "sa-spacer");
    var back = el("button", "sa-btn sa-btn-ghost", { type: "button" });
    back.textContent = "Back";
    var next = el("button", "sa-btn sa-btn-primary", { type: "button" });

    actions.appendChild(skip);
    actions.appendChild(spacer);
    actions.appendChild(back);
    actions.appendChild(next);

    bubble.appendChild(arrow);
    bubble.appendChild(step);
    bubble.appendChild(h);
    bubble.appendChild(p);
    bubble.appendChild(actions);

    function positionFor(target) {
      var pad = 8;
      var r = target.getBoundingClientRect();
      // spotlight box
      spotlight.style.top = (r.top - pad) + "px";
      spotlight.style.left = (r.left - pad) + "px";
      spotlight.style.width = (r.width + pad * 2) + "px";
      spotlight.style.height = (r.height + pad * 2) + "px";

      // bubble placement: below the target if room, else above
      var bw = bubble.offsetWidth || 300, bh = bubble.offsetHeight || 140;
      var vw = global.innerWidth, vh = global.innerHeight;
      var below = (r.bottom + 14 + bh) <= vh;
      var top = below ? (r.bottom + 14) : (r.top - 14 - bh);
      var left = r.left + r.width / 2 - bw / 2;
      left = Math.max(10, Math.min(left, vw - bw - 10));
      bubble.style.top = top + "px";
      bubble.style.left = left + "px";

      // arrow
      var ax = r.left + r.width / 2 - left - 7;
      ax = Math.max(12, Math.min(ax, bw - 26));
      arrow.style.left = ax + "px";
      if (below) { arrow.style.top = "-7px"; arrow.style.bottom = ""; arrow.style.transform = "rotate(45deg)"; }
      else { arrow.style.bottom = "-7px"; arrow.style.top = ""; arrow.style.transform = "rotate(225deg)"; }
    }

    function render() {
      var s = steps[idx];
      var target = null;
      try { target = doc.querySelector(s.selector); } catch (e) { target = null; }
      step.textContent = "Step " + (idx + 1) + " of " + steps.length;
      h.textContent = s.title || "";
      p.textContent = s.body || "";
      back.style.visibility = idx === 0 ? "hidden" : "visible";
      next.textContent = idx === steps.length - 1 ? "Done" : "Next";
      if (opts.onStep) opts.onStep(idx);

      if (target) {
        spotlight.hidden = false;
        try { target.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" }); } catch (e) {}
        positionFor(target);
      } else {
        // no target on this page → center the bubble, hide the spotlight
        spotlight.hidden = true;
        bubble.style.top = "50%"; bubble.style.left = "50%";
        bubble.style.transform = "translate(-50%,-50%)";
        arrow.style.display = "none";
      }
    }

    function go(n) {
      if (n < 0 || n >= steps.length) return;
      idx = n; arrow.style.display = ""; bubble.style.transform = ""; render();
    }

    function close(done) {
      doc.removeEventListener("keydown", onKey, true);
      global.removeEventListener("resize", onResize);
      if (spotlight.parentNode) spotlight.parentNode.removeChild(spotlight);
      var fin = function () {
        if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
        if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
        if (done && opts.onDone) opts.onDone();
      };
      animOut(bubble, fin);
    }

    function finish() {
      if (opts.storageKey) markSeen(opts.storageKey);
      close(true);
    }

    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); finish(); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); idx < steps.length - 1 ? go(idx + 1) : finish(); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); return; }
      trapFocus(bubble, e);
    }

    function onResize() { render(); }

    skip.addEventListener("click", finish);
    back.addEventListener("click", function () { go(idx - 1); });
    next.addEventListener("click", function () { idx < steps.length - 1 ? go(idx + 1) : finish(); });

    doc.body.appendChild(spotlight);
    doc.body.appendChild(bubble);
    render();
    doc.addEventListener("keydown", onKey, true);
    global.addEventListener("resize", onResize);
    animIn(bubble);
    next.focus();

    return { close: function () { close(false); }, index: function () { return idx; } };
  }

  /* ── expose ─────────────────────────────────────────────────────────────── */
  global.SA = {
    seen: seen,
    markSeen: markSeen,
    onboarding: onboarding,
    coachMarks: coachMarks
  };
})(window);
