# PHYSICS HUNT — launch direction bug (own session, /effort xhigh, NO design work)

**Owner's prescription (2026-07-11):** one deep thread, not many broad. This is a root-cause hunt through the whole calculation chain — the session must hold the chain in its head. Whole context window for this alone; no design noise in the same session. Do NOT parallelize with agent fans.

## THE BUG
The simulator gives **launch direction ≈ +21.4°** where the physics says **≈ +8°** for the same delivery. Scale of error ≈ 2.7×, sign correct — smells like a units/weights error, not noise.

**First step: REPRODUCE precisely.** Scan `solveFlight` over face/path grids and compare `launchDir`(or startDir) against the D-plane expectation: initial ball direction ≈ **~85% face + ~15% path** for mid-loft clubs (research anchor; ~75/25 for driver-lofts, ~90/10 for wedges). Identify exactly which input state yields +21.4 vs expected +8 — the owner saw it in the app UI (impact.html consumes `solveFlight` directly).

## PRIME SUSPECTS (owner's list — check in this order)
1. **Angle conversion** — a deg/rad mixup anywhere in the start-direction chain.
2. **The D-plane formula** — how face and path combine into start direction (weights, or accidentally using face-to-path where face-to-target belongs).
3. **A sign error** somewhere in the chain that gets compensated elsewhere (making both errors invisible until they meet).
4. **Face/path combination** — e.g. startDir = face + k·(face−path) with wrong k or wrong reference frame.
Note 2.7× ≈ what you'd get if something adds face + path + face·k, or if a component meant to be fractional (0.85) is applied as ×1 plus another full term.

## RELATED FINDING (secondary, same hunt if cheap)
ØKT-2A engine probe (2026-07-11): the engine's Pure zone for low-point HEIGHT lives at **+1.0…+2.0 cm** (default Pure = +1.6 cm), i.e. the engine treats lowH as the sweet-spot-path bottom height where +1.6 is ideal ball-first contact — while the design side assumed jitter-around-0 (±1.5 thresholds). Verify this semantic is INTENDED in `swing-parameters-and-impact.js`; if it's a hidden offset bug it may share a root with the above. Corner case found: lowH −1.1 cm + low point +20 cm ahead → engine says Thin (arc has risen above ground at the ball) while sequence reads turf-first.

## FILES
- `impact-flight.js` — flight solver (solveFlight). THE fix likely lives here. This session MAY edit it — that is its purpose. (The byte-identical law binds UI sessions, not this one.)
- `swing-parameters-and-impact.js` — geometry→impact derivation (deriveImpact etc.). Shared by geometry surfaces.
- Consumers auto-follow (all surfaces call the engine live; no UI edits needed) — but re-run their number-parity checks after the fix.

## ENGINE HISTORY (don't regress these)
- FIX F (2026-07-02): carry = 0.232·bs^1.389 / (1+(bs/195)^8) — anchors: club 40→~48 m, 90→~160 m, 130→~197 m.
- FIX G: curve quadratic in carry: clamp(carry²·spinAxis/12000, ±0.6·carry) — 90 mph axis −6 → ~14 m.
- FIX H: APEX_MAX 44 / APEX_TAU 85 — 90 mph ≈ 30 m apex.
- FIX I: effectiveLpx plane-coupled (R·cos(plane) per degree of swing dir).
- FIX L: arc always meets the ball (lateral compensation in lpWorld) — deriveImpact must stay translation-invariant.
- Default 90 mph regression: carry ≈160 m · apex ≈30 m · land ≈50° · spin ≈7500 rpm.

## VERIFICATION CONTRACT (no fix ships without)
1. Failing test FIRST: a node harness asserting the D-plane expectation on the repro state (fails on current code).
2. Minimal formula fix — one change at a time, no while-here refactors.
3. Regression table 40/70/90/110/130 mph: carry/apex/land/spin anchors above hold (±small documented drift).
4. Invariants: monotonicity (speed↑→carry↑), offline = carry·sin(startDir)+curve identity, NaN-grid over the full input space, curve sign follows spin axis.
5. Start-direction law: startDir tracks ~85% face / ~15% path across a face×path grid (report the achieved ratio).
6. Cross-surface parity: impact.html chips, academy-lesson-v2-mock rpm/carry byte-parity re-run, diagnose engine asserts (?dev=1), geometry checkAlign3d — all green after the fix.
7. Headless rig pattern: `python -m http.server <port> & node <script>; kill` in ONE command; chromium at C:/Users/SkotvoldSivertSende/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe.

## WHAT NOT TO DO
No aero rewrite, no new model — minimal correction of the wrong link. No design/UI changes. No engine constants tuning beyond what the root cause requires. If the hunt concludes the +8° expectation itself is wrong (i.e. the engine is right), that is a VALID outcome — document why with the D-plane math and stop.
