# Flightglass handoff — review request (Cowork reviewer → Claude Code)

## Protocol (read this first)
This file was written into the repo by the Cowork reviewer over the device bridge. It is a
one-file message channel between two Claude sessions:

- **You (Claude Code):** read this request, do the work, and WRITE YOUR ANSWER to
  `handoff/review-response.md` in this same folder — plain markdown, actual numbers,
  copy-pasteable. Do not answer only in your terminal; the reviewer reads the *file*, not
  your session. When finished, tell the human "response written" so they can nudge the
  reviewer.
- **The reviewer (Cowork):** reads `handoff/review-response.md` back over the bridge and
  verifies.
- A human still triggers each side. That gate is intentional for this read-only, owner-gated
  engine.

Context: engine branch `engine/physics-3d-spin-recal` (HEAD was `e7d3133`). This is the
**merge-ready verification** after the cleanup pass (regression fix, failing tests, npm test,
content/doc purge). If that cleanup pass has NOT been run yet, say so at the top of your
response and answer only the items you can.

---

## Report back (write answers into handoff/review-response.md)

1. REGRESSION (impact-outcome.js:90)
   - What you changed it to (should gate on signedVerticalSpinLoftDeg).
   - scripts/impact-outcome.test.mjs: now X/9 (must be 9/9).

2. LESSON TEST RECALIBRATION
   - academy-wind-model.test.mjs: now X/5, and the recalibrated window/content values you set.
   - academy-carry-side-model.test.mjs: now X/6, and the values.
   - Confirm you recalibrated the LESSONS to the settled engine, and did NOT move the engine.

3. FULL npm test
   - Does `npm test` now COMPLETE? Pass/fail counts and wall-clock time.
   - What the hang was and how you fixed it.
   - Confirm the four engine suites (impact-flight-calculated-spin, impact-flight-3d-spin,
     flightglass-3d-spin-model, engine-driver-acceptance) are now in npm test.

4. CONTENT PURGE (paste before → after)
   - academy.html:689 and :2958 — the old "spinLoft*ballSpeed*1.8 (engine)" text and worked
     numbers (2070/7099/9000) are gone; what replaced them, and confirm the new numbers are
     reproduced from the current engine.
   - academy-backspin-model.js:52-54 floor-labeling fix.
   - impact-flight.js:297-300 and :332 comment corrections.
   - copy-web rerun: paste a grep of www/impact-flight.js proving the old fitted spin
     (spinLoft*ballSpeed*spinK / 1500 floor) is GONE.

5. UI CONSUMERS
   - List every surface reading spinAxis / curve / offline that you checked, and what you
     changed on each (or "no change needed" with why).

6. DOCS
   - Confirm docs/ENGINE-CHANGE-REPORT.md, docs/systemkontrakt.md (spinAxisGain,
     OFFLINE_CAP_FRAC, backspin formula) now match the current engine.

7. CLEANUP
   - Confirm impact-flight.BEFORE.mjs, scripts/engine-3d-measure.mjs, outputs/engine-3d-*
     are deleted.

8. INVARIANTS — paste the actual current values:
   - Neutral (100/loft25/attack-3/face0/path0): spinLoft, spinAxis, curve, backspin.
   - Driver (100/loft11/attack1/face3/path0/'driver'): totalSpin, displayed backspin,
     spinAxis, carry, ballSpeed, smash.
   - Driver-vs-hybrid tilt ratio.
   (Expected unchanged: spinLoft = dynLoft − attack, tilt 0, curve 0; 7i backspin ~6706;
   driver totalSpin ~2587 / backspin ~2478 / tilt 16.5° / carry & smash bit-identical;
   tilt ratio ~2.52x.)

9. STATE + OPEN
   - Latest commit hash; every file changed in this pass.
   - Anything from the merge-ready list you could NOT complete, stated plainly.
