# Flightglass handoff 04 — final landing response (Fable 5, technical owner)

Date: 2026-07-21
Reviewer role: final technical owner of the Flightglass flight physics.
Branch / worktree under review: `engine/physics-3d-spin-recal` / `.worktrees/physics-3d-spin`.
HEAD reviewed: `1a84b8047de8cf2a24f8e06aae5110abe2398198`.
Protected engine commit: `5dae98f942b488e7cfab19b0a96b63631750db38`.
Protected module SHA-256: `A602805F618C1C1489AD7C7CACC67771A92F29D6B0EC4C1CDC8A18107A8B5DF5`.

---

## FINAL VERDICT: GOOD ENOUGH TO LAND

The recalibrated flight model is honestly good enough to land as the Flightglass
engine, with the limitations documented below explicitly accepted for this
version. The verdict is about the **engine/model**: its physics is sound, its
errors against the current TrackMan reference are small and bounded, the
protected 3-D module is byte-identical, and the honesty doctrine is upheld
(every displayed number is a live output, unmodelled quantities are labelled
`ESTIMATE`, no fabricated Total, no fake carry for a ball that does not fly).

This verdict does **not** mean the repository is merged. Merging the engine
branch to `main` is gated — correctly, and by the owner's own condition
("fullfør merge *når alle obligatoriske porter er grønne*") — on one remaining
piece of **non-physics** work: 30 downstream Academy lesson/model contracts
still encode formulas this recalibration deleted, so the repository-wide gate
(`npm test` / `test:ux`) is RED. That is Stage B integration work, not a defect
in the flight model. The physics is landing-ready; the product merge is not yet,
and I identify precisely what stands between them below.

Boundary I will not blur: I verified this from an independent read-only clone of
the published branch. I have **no push/PR/merge credentials and no terminal on
the owner's machine**, so I cannot and did not run `git push`, open the PR, or
merge. I completed every step available to me — full Stage A verification, the
final decision, the known-limits ruling, and the exact Stage B command sequence
a terminal agent must run on the owner's machine. I am not reporting a merge
that did not happen.

---

## Stage A — verification of the published protected engine commit

Every check below was run fresh against a clean checkout at HEAD
`1a84b80`. The engine and Academy suites are dependency-free pure ESM
(`node:*` builtins + local engine files only), so they run without
`node_modules`.

### A.1 Commit identity, protection, and scope

| Check | Expected | Observed | Result |
|---|---|---|---|
| HEAD | `1a84b80…` | `1a84b8047de8cf2a24f8e06aae5110abe2398198` | PASS |
| Protected commit is ancestor of HEAD | yes | `git merge-base --is-ancestor` → yes | PASS |
| Commits above protected commit | docs only | 1 commit `1a84b80` = handoff/04 only (39 lines) | PASS |
| Protected module SHA-256 | `A602805F…8B5DF5` | `A602805F618C1C1489AD7C7CACC67771A92F29D6B0EC4C1CDC8A18107A8B5DF5` | PASS |
| Protected module touched by engine commit | no | `git show 5dae98f -- flightglass-3d-spin-model.js` empty | PASS |

Engine commit `5dae98f` file scope (matches the locked scope in handoff/04 exactly):

- Modified: `impact-flight.js`, `package.json`,
  `scripts/impact-flight-3d-spin.test.mjs`,
  `scripts/impact-flight-calculated-spin.test.mjs`.
- Renamed for honest provenance (git `R`):
  `scripts/engine-driver-acceptance.mjs → scripts/driver-flight-reference.mjs`,
  `scripts/engine-driver-acceptance.test.mjs → scripts/driver-flight-reference.test.mjs`.
- Added: `scripts/engine-trackman-acceptance.test.mjs`,
  `scripts/impact-flight-domain-coherence.test.mjs`, and the two handoff docs.
- No Academy / model / UI / fixture / mock file in scope. Confirmed.

### A.2 Mandatory gates

| Gate | Command | Result |
|---|---|---|
| Formula contamination | `node scripts/verify-academy-formulas.mjs` | **0 hits** across 28 files / 9 dead signatures |
| Full engine suite | `test:engine` (7 files, `--test-concurrency=1`) | **62 / 62 pass, 0 fail** |
| Protected 3-D model | `flightglass-3d-spin-model.test.mjs` | **21 / 21 pass** |
| Domain coherence (new) | `impact-flight-domain-coherence.test.mjs` | **2 / 2 pass** |
| Focused Academy baseline | 5 model suites | **8 / 38 pass** — exactly the documented baseline |

Academy baseline split (matches handoff/03 and handoff/04 line-for-line):
Backspin 5 pass / 9 fail, Carry 1 / 4, Delivered Loft & Launch 1 / 6,
Flight Height & Descent 0 / 7, Speed Transfer 1 / 4 → 8 pass, 30 fail.

### A.3 Review of the `impact-flight.js` final-pass delta (6-item checklist)

1. **`carryLaunchEfficiency` reuse — PASS.** `carryLaunchEfficiency =
   sqrt(clamp(max(0, launchAngle) / CARRY_FULL_LAUNCH_AT_DEG, 0, 1))` with
   `CARRY_FULL_LAUNCH_AT_DEG = 10`. It multiplies carry (`carry =
   carryBallSpeedFit · efficiency`) **and both** Apex terms
   (`apexBallSpeedTerm`, `apexLaunchTerm`). One low-launch domain guard, reused,
   as specified.
2. **Ledgers reconcile — PASS.** `apex = apexBallSpeedTerm + apexLaunchTerm`
   exactly; both terms are exposed. Landing: `landingRaw = landingBase (52.8) +
   landingSpinTerm + landingDomainTerm`; `landingLaunchTerm` and
   `landingApexTerm` are exposed as `0` (honest: the old decomposition fields
   are retained for compatibility but now describe the saturation form). The
   exposed coefficients equal the ones the code computes with.
3. **Raw / diagnostic fields returned — PASS.** `spinRpmRaw` (pre-clamp),
   `carryLaunchEfficiency`, `landingDomainTerm`, `landingRaw`, `apexLaunchFactor`
   and the full coefficient set are on the return object. Removed diagnostics
   `apexMax`, `apexTau`, `smashPresetCap` are confirmed **absent** — no hidden
   per-club preset or smash cap survives.
4. **Only expected snapshots moved — PASS (with a precision on the record).**
   Both neutral characterization snapshots in `impact-flight-3d-spin.test.mjs`
   were regenerated (7-iron and low-loft driver), because the whole longitudinal
   path was recalibrated. They remain **exact `assert.deepEqual` pins**, not
   widened tolerances. (The earlier working note of a single "32.573 → 31.416"
   Apex change was an imprecise paraphrase; ground truth is 7-iron Apex
   33.036 → 31.021 and low-loft-driver Apex 20.787 → 31.416, with every sibling
   output moving coherently.) The smash assertion was rewritten to consume the
   **exposed** coefficients and a new guard was added — "face/path must not apply
   across-bag spin calibration twice" — which is a strengthening.
5. **TrackMan bands / holdouts not weakened — PASS.** Bands in
   `engine-trackman-acceptance.test.mjs` are literal frozen data: Carry 3/6 %,
   Ball 2/4 %, Smash 0.02/0.04 abs, Apex 5/10 %, Spin 5/10 %, Launch 1/2°,
   Landing 2/4° — identical to handoff/03. Holdout clubs are evaluated by the
   test only; no per-row/per-club lookup exists in the engine.
   The `impact-flight-calculated-spin.test.mjs` spin anchors were **re-sourced**,
   not loosened to force green: the old model-internal 7-iron pin (6793.9 rpm,
   ±150) is obsolete because spin was deliberately recalibrated down; the new
   anchor is the published 2023 PGA 5-iron (5280 rpm) scaled to the fixture
   speed = 5500 rpm, ±300 rpm (≈5.5 %, aligned with the suite's 5 % spin band).
   The engine's actual value 5371.7 rpm sits 128 rpm inside — 172 rpm of margin.
   Driver total spin was re-derived from the 2023 PGA driver (2545 rpm) scaled by
   speed and sin(spin loft) per Penner, ±200 rpm; actual 1967.6 rpm sits 24 rpm
   inside — 176 rpm of margin (and the old fixed `[2000, 2600]` window would now
   *fail*, confirming these are re-anchors, not pads). The driver-bends-more
   guard thresholds (`tiltRatio ≥ 2.3`, `|sideRatio − 1| < 0.25`,
   `|offline| < 30`) are unchanged.
6. **Commit scope matches — PASS.** See A.1.

### A.4 Independent physics probes (my own, not the suite's)

- **No-flight guard (headline fix).** Delivery `DL 2°, AA −12°` → launch −1.21°
  → carry 0.00 yd, landing 0.00°, roll 0.00. No fabricated flight for a ball
  that does not fly. A normal 7-iron (`DL 25, AA −3, 100 mph`) flies:
  carry 208.4 yd, landing 49.6°.
- **Exact square-flight zeros preserved.** Square face/path →
  `curve = side = spinAxis = launchDirection = 0` exactly.
- **`physical.inDomain` edge, confirmed as documented.** `inDomain`
  (`impact-outcome.js`) is `signedVerticalSpinLoftDeg > 0`, i.e. spin-loft
  positivity — not launch positivity. So it can read `true` on a negative-launch
  delivery. The real protection is the carry→0 guard (verified above); `inDomain`
  is a secondary advisory flag. This matches the limit the audit already
  declared. Accepted.

Stage A conclusion: the published engine commit is exactly what handoff/03–04
claim it is. Every mandatory engine gate is green, the protected physics is
untouched, the scope is clean, and nothing was weakened to reach green.

---

## Known limits accepted at landing

Each limit is classified `ACCEPTED FOR THIS VERSION` (honest, documented, does
not block the engine landing) or `BLOCKS`. Nine physics limits + the Academy
state are ruled below.

1. **Sparse, composite, elite-only calibration (12 TrackMan rows).**
   ACCEPTED. Passing 12 reference rows is a sanity band, not proof across
   arbitrary slider space. Declared in-test and in the audit. The model is
   monotone and continuous, so behaviour between anchors is controlled, not
   wild.
2. **Empirical Carry / Apex / Landing (not an integrated flight).**
   ACCEPTED. Labelled `ESTIMATE`. Carry is origin-zero, strictly monotone in
   ball speed at fixed delivery, and fades continuously to zero below the
   ~10° launch domain. Apex is zero at zero speed. Landing is a smooth
   saturation, zero at zero speed. Modest and honest.
3. **No independent useful-spin Carry response at matched speed + launch.**
   ACCEPTED. Carry responds to ball speed and the launch domain, not to spin as
   a third independent lever at fixed speed/launch. This is exactly why the
   Academy "equal-carry, different-spin" fixture can no longer be reproduced —
   an honest consequence, quantified in handoff/03, not a hidden failure.
4. **Deferred lift saturation / high-spin RK4 over-carry tail (9–22 % iron
   excess).** ACCEPTED (deferred). Feeding the raw RK4 longitudinal result into
   shipping output now would replace bounded TrackMan error with a known
   monotone 9–22 % iron excess, and would require editing the protected aero
   module plus a new independent aero validation set. Correct to defer.
5. **`0 → 32°` Landing transition at the flight boundary.** ACCEPTED. Landing is
   clamped to `[32, 60]` while airborne and set to `0` when there is no flight.
   The only discontinuity is at the carry = 0 boundary — a genuine regime change
   (the ball does not fly). For every real airborne shot Landing is continuous.
   Showing 0 rather than a floor of 32° on a non-flying delivery is the honest
   choice.
6. **`physical.inDomain` true for some negative-launch deliveries.** ACCEPTED.
   `inDomain` tracks vertical-spin-loft positivity, not launch positivity, so it
   is not a perfect "will it fly" flag. The carry→0 guard is the real protection
   and works (probe A.4). Cosmetic advisory edge, documented.
7. **Tiny raw RK4 launch-height artifacts.** ACCEPTED. Sub-visual, confined to
   the raw diagnostic path, never surfaced as shipping output.
8. **Retained carry-projection / target-side approximation.** ACCEPTED
   (deferred). The endpoint `start displacement + projected curve` is a
   compatibility transform with a measurable lateral effect (representative
   curve ratio `1.66118 = raw-RK4 1.45827 × projection 1.13915`). Removing it
   changes protected curve behaviour and needs explicit lateral-migration
   approval. Declared, quantified.
9. **Centered-strike only; gear effect and ball position unapplied.** ACCEPTED.
   The model solves centered impact; off-centre gear effect is not modelled and
   ball position is not yet a parameter (owner has said it will be added).
   Declared as a scope boundary, not a hidden inaccuracy.

Additional declared limits, all ACCEPTED: the 9,000 rpm total-spin ceiling
(PW reference 9,316 rpm passes at −3.39 % but cannot equal the anchor; raising
the ceiling was neither needed to clear RED nor justified by this data); the
public source not publishing Dynamic Loft or Total (DL treated as an explicit
Flightglass assumption, Total never fabricated); and the driver/6-iron
identifiability conflict (a five-input model cannot simultaneously reproduce the
separately-published DL rows — quantified, not hidden).

**The one BLOCKS item — and it blocks the *merge*, not the model:**

- **Academy is not recalibrated: 30 downstream lesson/model contracts are RED.**
  BLOCKS the Stage B merge to `main` (because `npm test` / `test:ux` fails), and
  therefore blocks calling the repository landed. It does **not** block the
  engine-model verdict: these REDs are stale downstream contracts that still
  invert or reconstruct formulas this pass deleted (the `0.62·loft + 0.25·attack`
  launch, the linear-smash inverse, the old carry curve, the
  `45 + 0.5(spinLoft−25)+…` landing decomposition), not physics errors. Each is
  quantified in handoff/03. Clearing it is a separately-authorized,
  lesson-by-lesson fixture/predicate migration — bounded, non-physics, and
  expressly forbidden to shortcut by widening a mastery tolerance or editing a
  protected scenario to recover green.

---

## Stage B — integration status and the exact protocol to finish it

Stage B asks for a **full-green** integration branch
`integration/physics-3d-spin-final`, a PR to `main`, and a non-force merge. Its
precondition — *all mandatory gates green* — is **not met**: the 30 Academy REDs
keep `npm test` red. So under the owner's own rule ("merge når alle
obligatoriske porter er grønne"), the merge must **not** happen yet. The blocking
gate is the Academy migration, and neither weakening a gate nor moving a
protected Academy scenario to force green is permitted.

Separately, I cannot execute the git/PR/merge steps from this cloud sandbox
regardless (no write credentials, no terminal on the owner's machine). Below is
the exact sequence for a terminal agent running in the worktree on the owner's
machine. Run the light steps to confirm the current state; do **not** run the
merge until the Academy gate is green.

```bash
# 0. Confirm you are on the verified engine tip.
git -C .worktrees/physics-3d-spin fetch origin
git -C .worktrees/physics-3d-spin rev-parse HEAD
# expect 1a84b8047de8cf2a24f8e06aae5110abe2398198
git -C .worktrees/physics-3d-spin rev-parse origin/engine/physics-3d-spin-recal
# expect the same SHA

# 1. Re-verify the engine gate is green and the protected module is intact.
npm run verify:academy-formulas          # expect 0 hits
npm run test:engine                       # expect 62/62
git diff --exit-code -- flightglass-3d-spin-model.js   # expect clean
#   sha256 flightglass-3d-spin-model.js == A602805F…8B5DF5

# 2. Build the integration branch off main, bring the engine in.
git fetch origin
git switch -c integration/physics-3d-spin-final origin/main
git merge --no-ff origin/engine/physics-3d-spin-recal

# 3. GATE — Academy migration. Do NOT proceed past here until green.
#    Migrate the 30 stale contracts lesson-by-lesson (Backspin, Carry,
#    Delivered Loft & Launch, Flight Height & Descent, Speed Transfer):
#    update each stale solveFlight-derived target/formula to the new engine
#    output, PRESERVING or TIGHTENING the existing mastery predicate. Do not
#    widen a tolerance. Do not edit a protected scenario to recover green.
#    Then regenerate the voice/text and browser evidence for the touched lessons.
npm test                                  # must reach green (engine + test:ux)

# 4. Only when npm test is green: open the PR and merge without force.
git push -u origin integration/physics-3d-spin-final
gh pr create --base main --head integration/physics-3d-spin-final \
  --title "Land recalibrated 3-D spin flight engine + Academy sync" \
  --body  "Engine 62/62; protected module byte-identical (A602805F…); Academy contracts migrated to the new outputs; npm test green."
# after review:
git switch main && git pull --ff-only
git merge --no-ff integration/physics-3d-spin-final
git push origin main
```

If the owner wants the engine to land **without** waiting on the full Academy
migration, the only honest way to do that is an explicit, authorized decision to
land the engine commit while treating the Academy lessons as a tracked,
temporarily-disabled follow-up — which changes what "landed" means and must be
the owner's call, not a silent gate bypass. I am not taking that decision for
them; the default per the contract is to migrate Academy first, then merge.

---

## Mandatory stop conditions — none tripped

Protected SHA matches; engine gates green; TrackMan suite has no RED; Academy is
exactly the documented 8/38 (not a new regression); no tolerance, mastery gate,
or protected physics was weakened; no protected/Academy/UI/fixture file was
edited on the engine branch; no holdout fitting. The only reason the merge is not
executed is the correct one: the Academy gate is not yet green, and that step —
plus the push/PR/merge itself — runs on the owner's machine, not in this
sandbox.

## Bottom line

The flight model is **good enough to land**, honestly, with the limits above
accepted. The engine commit is verified, protected physics is intact, and the
truth doctrine holds. The remaining work before the repository can merge to
`main` is the Academy downstream migration (30 stale, non-physics contracts) —
bounded and specified above — followed by the git push/PR/merge, which must be
executed on the owner's machine because this reviewer has no write access there.
