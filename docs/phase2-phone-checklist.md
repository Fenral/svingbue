# Phase 2 phone evidence checklist

Status: automated phone matrix passed; physical-device and moderated usability
gates remain pending.

## What the automated matrix proves

Run `npm run test:phase2:phone`. It executes the same journey in Chromium and
WebKit at `375x812` and `430x932`, with a fresh browser-storage partition for
each case. It records screenshots under
`outputs/flightglass-gates/phase2-phone-uat/` and verifies:

- the opening can be skipped on the normal-motion path and does not replay in
  the same app session;
- reduced motion starts without a running opening animation;
- `Not now` persists the current tour step and resumes it after reload;
- all four tour steps are reachable, including the live delivered-loft lab;
- the final tour cards navigate to Outcome, Studio, and Guide; and
- each phone viewport has no horizontal overflow and no application
  page/console errors. Chromium's browser-owned `Transition was skipped`
  rejection during the Guide cross-document view transition is recorded but
  excluded from this app-runtime assertion; it remains a follow-up item.

This is deterministic device-viewport evidence, not a claim about user
comprehension or completion speed on physical phones.

## Run record

Before treating the automated rows as current evidence, record the date, commit
or working-tree state, and both browser results here.

| Engine | 375x812 normal | 375x812 reduced | 430x932 normal | 430x932 reduced | Result/date |
|---|---|---|---|---|---|
| Chromium | PASS | PASS | PASS | PASS | 4/4 · 2026-08-07 |
| WebKit | PASS | PASS | PASS | PASS | 4/4 · 2026-08-07 |

## Physical-phone smoke check

Run this after the automated matrix, on one current iPhone and one current
Android device if available. It is a release-supporting smoke check, not a
substitute for the moderated study.

- [ ] Clear `sa.v1.context` and `sa.opening.v1`, then launch Home.
- [ ] Skip the opening; reload once and confirm it does not replay.
- [ ] Start the tour, use `Not now` on steps 1, 2, 3, and 4 in separate fresh
  attempts, then confirm the same step resumes after relaunch.
- [ ] Move the delivered-loft control on step 3 and confirm the three modelled
  values update together.
- [ ] From step 4, open Outcome, Studio, and Guide in separate fresh attempts.
- [ ] Repeat the basic opening, resume, and navigation path with reduced motion
  enabled in the operating system.
- [ ] Record device, OS, browser/webview, build, result, and any assistive
  technology observations in the handoff evidence.

## Still required: moderated new-user gate

This checklist cannot satisfy the Phase 2 moderated usability criterion. Keep
`docs/phase2-onboarding-uat.md` as the source record for ten first-time
participants. Phase 2 remains pending until at least 8 of 10 participants reach
the product map without help and the median time is 90 seconds or less.
