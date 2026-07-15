# Academy Backspin Compatibility Amendment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate the accepted Backspin reference lesson into the outcome curriculum, correct its truth/route/voice boundaries and preserve every accepted interaction and mastered user.

**Architecture:** Make the smallest targeted changes to existing Backspin content/host callbacks and tests. Reuse `academy-backspin-model.js` and `academy-native-lesson.js`; do not create a second Spin Loft experience, retune physics or redesign the STUDIO-GRADE instrument.

**Tech Stack:** Existing Backspin ES modules/CSS, shared Academy registry/store/voice/host, current Node/browser/visual gates.

**Normative specs:** `docs/superpowers/specs/2026-07-13-backspin-96-97-design.md` and `docs/superpowers/specs/2026-07-15-academy-backspin-curriculum-amendment.md`

---

## Laws

- This is an amendment, not a redesign.
- Keep target 6,800–7,400 rpm and independent Landing Angle ≥50°.
- Do not claim Backspin rpm causes current Carry/Apex/Landing; the engine does
  not feed rpm back into those fits.
- Never relock accepted existing mastery or duplicate its reward.
- Remove hardcoded Next: Launch Angle; shared router decides.

### Task 1: Write amendment regression tests before product changes

**Files:** modify `scripts/academy-backspin-model.test.mjs`,
`scripts/academy-backspin-browser.test.mjs`,
`scripts/academy-store-migration.test.mjs`,
`scripts/academy-backspin-content.test.mjs` (create if absent).

**Step 1:** Add all five grandfather fixtures from amendment Section 8.3 and
both `backspin`/`spin-loft` route assertions.

**Step 2:** Add content-truth failures for rpm-causes-flight, stopping guarantee,
downward-strike requirement, one-preset-as-universal, friction/impact-location
omission, hardcoded destination and relock.

**Step 3:** Add S4 assertion that Backspin and Landing are evaluated from the
same final `solveFlight()` state but stored as two independent gate rows.

**Step 4:** Run focused tests. Expected: new alias/copy/router assertions FAIL
while existing accepted behavior remains green.

### Task 2: Apply registry, alias and grandfather integration

**Files:** modify `academy-curriculum.js`, `academy-store.js`,
`academy-experience-host.js`, `academy-native-lesson.js` only where required.

Implement owner concepts `spin-loft` + `backspin`, guided prerequisites for new
users, accepted-user bypass, alias intent and shared recommendation callback.
Seed zero-value reward guard for grandfathered mastery. Run all migration/route/
Backspin tests, commit `feat: integrate Backspin curriculum history`.

### Task 3: Correct copy, result and voice hooks minimally

**Files:** modify `academy-native-lesson.js`, optionally
`academy-native-lesson.css` only for shared caption/replay hooks; update content
tests.

Apply exact amendment copy to S0–S5 and information sheets. Replace fixed next
destination with supplied action. Register eight approved cue signatures with
the shared voice controller; keep caption/replay/mute and screen-reader
suppression. Do not alter layout/instrument styling unless required by a shared
critical accessibility regression.

Run content/model/browser tests and commit `fix: align Backspin curriculum truth`.

### Task 4: Re-prove accepted mastery and state

**Files:** existing Backspin and shared browser/migration tests.

Test 3/5 + valid final state, 4/5 + rpm-only, 4/5 + Landing-only, full pass,
clamp state, reload/partial restore, duplicate attempt, prior mastered without
new prerequisites, below-mastery complete, Spin-Loft-only and both legacy IDs.
Assert XP/history/attempts unchanged and one canonical reward. Commit tests if
needed with `test: verify Backspin compatibility amendment`.

### Task 5: Re-run full STUDIO-GRADE acceptance

Run original instrument-gate suite, Backspin model/browser, full Academy UX/
WebKit/perf, visual captures normal/reduced at both target viewports, accessibility
critical/serious scan, pairwise comparison and protected hashes. A previous
score is not evidence for this change. Update STATUS/HANDOFF with fresh paths.
Stage only intended files, commit `docs: accept Backspin curriculum amendment`,
push. Stop before Flight Height & Descent if Backspin loses any critical gate,
category floor, pairwise preference or protected identity.
