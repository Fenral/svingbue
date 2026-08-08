# Flightglass Guide Implementation Plan

## 1. Lock truth before UI

- Add the fail-closed Guide adapter and fixtures.
- Add the frozen guided question catalog and capability-gap rubric.
- Verify exact metric accessors against `selectOutcome`.

Proof: focused Node tests for valid, empty, corrupt, domain, no-flight, capped
spin and single-variable sweep states.

## 2. Lock the interaction contract

- Add static markup/token/no-free-text checks.
- Add mobile and desktop browser journeys for browse, deep link, answer, lab,
  history, invalid fallback, reduced motion and touch targets.

Proof: tests are red against the old Jarvis and green only after replacement.

## 3. Build the Guide surface

- Replace `jarvis.html`; add `jarvis.css` and `jarvis.js`.
- Mount three intents, six-topic hierarchy, question rows, evidence lens,
  disclosures, exact tables and one-variable lab.
- Rename visible Home and shell copy from Jarvis to Guide while retaining the
  route id and filename.

Proof: focused contract tests plus manual keyboard navigation.

## 4. Inspect the real render

- Capture Chromium and WebKit at 390x844 and 1440x900.
- Inspect density, contrast, clipping, target size, focus, real copy, empty and
  unsupported states in one batched round.
- Run the Impeccable detector once and apply one focused repair batch.

Proof: zero critical browser findings and accepted final screenshots.

## 5. Integrate and hand off

- Wire focused scripts into the v1 gate.
- Run `npm run copy-web`, then verify root/`www` parity.
- Run `npm run verify:v1` and `npm run verify:change`.
- Update coordination/status evidence and commit locally with co-author credit.

Proof: clean phase-scoped gates, no protected-key changes and one review-ready
commit. Do not push or deploy without explicit owner approval.
