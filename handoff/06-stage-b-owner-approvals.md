# Flightglass handoff 06 — Stage B owner approvals (RECORDED, implementation pending)

Date: 2026-07-21. Recorded by the terminal agent directly from the owner's answers.
Baseline: `3a5e5d8` (mechanical pins done; suites backspin 11/14, speed-transfer 2/5,
carry 2/5, delivered-loft 2/7, flight-height 0/7; engine gate 62/62, verifier 0 hits).

## Owner decisions — verbatim outcome

1. **All four equal-X replacement pairs from handoff/05: APPROVED as proposed.**
   - Delivered Loft: `A(30,+2)` / `B(33,−5)` — equal launch ~16.6°, spin-loft gap 10.
   - Carry: `A(22,+2,cs88)` / `B(42,−4,cs102)` — equal carry ~183.8, landing gap 6.0°.
   - Flight Height: `A(22,+2,cs94)` / `B(42,−4,cs80)` — equal apex ~31.9, landing gap 6.0°.
   - Speed Transfer: `A(cs82,sl22)` / `B(cs91,sl41)` — equal ball ~118.0, smash gap 0.14.
   Predicates preserved or tightened; bands re-centered on the new pair values
   (carry ~183.8, apex ~31.85, ball ~117.95, launch ~16.6; descent-gap predicates ~6°,
   not the old ≥12).

2. **Backspin mastery: repoint the exemplar delivery to `(32,−3,120)` = 7319 rpm.**
   The band `[6800,7400]` and the landing ≥50° requirement stay UNTOUCHED. Only the
   demonstration delivery moves. (Reachability verified: DL31→6915, DL32→7319.)

3. **All three reframes: APPROVED.**
   (a) carry-steady test uses in-domain lofts 20 vs 48 (not 10 vs 48);
   (b) lesson copy "0.62°/loft" → "≈0.56°/loft near a 7-iron — and it varies with loft"
       (engine slope at 30°: 0.5641);
   (c) upper-smash clamp fixture moves to spin loft 5 so it genuinely reaches the 1.52 cap
       (old fixture now tops at 1.5037 and never clamps).

Also pre-authorized by handoff/05's "safe mechanical" list (no further approval needed):
the Flight Height landing-ledger adapter rebuild onto the engine's real saturation
decomposition (`landingBase` 52.8, `landingSpinTerm`, `landingDomainTerm`).

## Implementation order for the continuing session

1. Flight-height ledger adapter rebuild (model file) + apex pin regen → suite green
   except the same-apex pair, then apply pair B3 above.
2. Apply the four pairs: model fixtures + limits/bands + tests. Re-measure every pinned
   number fresh from `solveFlight` at full float precision (1e-9 tolerances).
3. Backspin mastery exemplar `(32,−3,120)` in model fixture + tests; carry-steady lofts
   20/48; speed-transfer clamp fixture sl5; delivered-loft slope assert 0.5641… + copy.
4. Lesson copy + voice/text regeneration for the five touched lessons; then
   `test:academy` + `test:webkit` browser evidence.
5. `npm test` full — must be COMPLETELY green (the two pre-existing voice failures were
   NOT visible in the last full run baseline… verify; if they persist and are out of
   scope per the order, surface to owner before merge rather than deciding alone).
6. Only on full green: `git switch -c integration/physics-3d-spin-final origin/main`,
   `git merge --no-ff origin/engine/physics-3d-spin-recal`, push, PR, non-force merge
   per the exact sequence in handoff/04-response §Stage B.
7. Write `handoff/06-stage-b-response.md` (this file records approvals; the response
   records outcomes + merge SHA).

## Doctrine reminders binding the implementation

- No tolerance, mastery gate or protected physics may be weakened to reach green.
- Engine files are frozen: `impact-flight.js`, `flightglass-3d-spin-model.js`,
  `swing-parameters-and-impact.js`, `driver-flight.mjs`.
- `verify:academy-formulas` must stay 0 hits; `test:engine` must stay 62/62.
- Every new displayed number must be a live engine output, re-derived, never copied
  from this document without re-measuring.
