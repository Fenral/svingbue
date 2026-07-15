# Academy Outcome Curriculum Rollout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Execute the complete outcome-led Flightglass Academy rollout safely, one independently accepted batch at a time, without module-by-module owner approval pauses.

**Architecture:** Land shared Home/store/route/voice infrastructure first, then register exactly one new experience or compatibility amendment per batch. Each batch owns a pure model adapter, content manifest, dedicated instrument, live-transfer gate, migration coverage and fresh acceptance evidence; protected engines remain single sources of truth.

**Tech Stack:** Static ES modules and CSS inside the Capacitor native package, localStorage v1 compatibility, local audio cues, Node test runner, Playwright/WebKit Academy harness, existing UX/perf/visual-evidence pipeline.

**Normative blueprint:** `docs/superpowers/specs/2026-07-15-academy-outcome-curriculum-blueprint.md`

**Cross-curriculum gate:** `docs/superpowers/specs/2026-07-15-academy-cross-curriculum-acceptance-audit.md`

---

## 1. Authorization and operating rule

The owner authorized the full planning program and later implementation may run
through these accepted plans without asking for approval between modules.

That autonomy does not expand release or mutation authority. Stop only for:

1. incompatible normative sources that materially change learner behavior;
2. a required physics-output change without a failing regression and explicit
   new authorization;
3. missing credentials or a production/staging/billing/security action;
4. the same verification failure after three root-cause-driven attempts;
5. a required asset that cannot be replaced locally without changing product
   direction;
6. an acceptance requirement that cannot be evidenced as written;
7. legacy progress/XP loss, duplicate reward or accepted Backspin regression;
8. protected-file modification inside an Academy batch.

Do not stop for copy choices, fixture selection, ordinary refactoring, local
test repair, renderer implementation or moving to the next accepted batch.

---

## 2. Artifact inventory and exact pairings

Every implementation row has an accepted design source and a task-by-task plan.

| Batch | Experience | Design specification | Implementation plan |
|---:|---|---|---|
| 0 | Academy Home/store/shared host | `specs/2026-07-15-academy-home-store-migration-design.md` | `plans/2026-07-15-academy-home-store-migration.md` |
| 1 | Start Line | `specs/2026-07-15-academy-start-line-design.md` | `plans/2026-07-15-academy-start-line.md` |
| 2 | Shape | `specs/2026-07-15-academy-shape-design.md` | `plans/2026-07-15-academy-shape.md` |
| 3 | Carry Side (`shot-pattern`) | `specs/2026-07-15-academy-shot-pattern-design.md` | `plans/2026-07-15-academy-carry-side.md` |
| 4 | Up or Down at Impact | `specs/2026-07-15-academy-attack-at-impact-design.md` | `plans/2026-07-15-academy-attack-at-impact.md` |
| 5 | Low Point | `specs/2026-07-15-academy-low-point-design.md` | `plans/2026-07-15-academy-low-point.md` |
| 6 | Contact Height (`strike-depth`) | `specs/2026-07-15-academy-strike-depth-design.md` | `plans/2026-07-15-academy-contact-height.md` |
| 7 | Delivered Loft & Launch | `specs/2026-07-15-academy-delivered-loft-launch-design.md` | `plans/2026-07-15-academy-delivered-loft-launch.md` |
| 8 | Backspin compatibility amendment | `specs/2026-07-15-academy-backspin-curriculum-amendment.md` plus accepted base spec | `plans/2026-07-15-academy-backspin-amendment.md` |
| 9 | Flight Height & Descent | `specs/2026-07-15-academy-flight-height-descent-design.md` | `plans/2026-07-15-academy-flight-height-descent.md` |
| 10 | Speed Transfer | `specs/2026-07-15-academy-speed-transfer-design.md` | `plans/2026-07-15-academy-speed-transfer.md` |
| 11 | Carry | `specs/2026-07-15-academy-carry-design.md` | `plans/2026-07-15-academy-carry.md` |
| 12 | Air Density | `specs/2026-07-15-academy-air-density-design.md` | `plans/2026-07-15-academy-air-density.md` |
| 13 | Wind | `specs/2026-07-15-academy-wind-design.md` | `plans/2026-07-15-academy-wind.md` |
| 14 | Plane Coupling optional MODEL LAB | `specs/2026-07-15-academy-plane-coupling-lab-design.md` | `plans/2026-07-15-academy-plane-coupling-lab.md` |

Paths in the table are relative to `docs/superpowers/`.

Backspin also retains:

- `docs/superpowers/specs/2026-07-13-backspin-96-97-design.md`;
- `docs/superpowers/plans/2026-07-13-backspin-reference-lesson.md`;
- `docs/superpowers/plans/2026-07-14-instrument-gates.md`.

The amendment may narrow/correct curriculum truth but may not silently discard
the accepted base behavior.

---

## 3. Required execution order

Execute in this exact order:

```text
0  Home/store/registry/router/voice/host + Backspin regression
1  Start Line
2  Shape
3  Carry Side
4  Up or Down at Impact
5  Low Point
6  Contact Height
7  Delivered Loft & Launch
8  Backspin compatibility amendment
9  Flight Height & Descent
10 Speed Transfer
11 Carry
12 Air Density
13 Wind
14 Plane Coupling optional MODEL LAB
```

Why this order:

- Batch 0 owns every shared state/route/reward decision and must stabilize
  before any new renderer writes progress.
- Direction proceeds cause → bend → final carry-plane integration.
- Strike proceeds tangent → bottom → vertical contact coordinate.
- Flight proceeds delivery → accepted spin reference → trajectory integration.
- Distance proceeds speed transfer → current Carry boundary.
- Conditions proceed immutable shot → density estimate → vector wind estimate.
- Plane Coupling is last because it is optional, model-specific and must never
  become a hidden core dependency.

Do not parallelize production implementation across batches. Shared files such
as `academy.html`, curriculum/store modules, package scripts and ledgers would
otherwise create ambiguous acceptance and merge risk.

---

## 4. Batch state machine

Every batch moves through:

```text
ready → executing → local-gates → evidence-review → accepted
                                     ↘ repair ↗
                                     ↘ escalated
```

Definitions:

- `ready`: all dependencies accepted, spec/plan present, clean intended scope;
- `executing`: TDD tasks in the experience plan are in progress;
- `local-gates`: focused then full clean verification runs;
- `evidence-review`: screenshots, accessibility, pairwise and judge evidence;
- `repair`: a named failed gate is being fixed from root cause;
- `accepted`: every applicable gate has fresh evidence and ledgers are
  committed/pushed;
- `escalated`: one of Section 1's true stop conditions is met.

Do not call a batch complete because code was written, tests “should pass,” a
derived score is high or another agent reports success.

---

## 5. Preflight before Batch 0

### Task 1: Confirm repository state

Run:

```powershell
git branch --show-current
git status --short
git log -5 --oneline
```

Expected branch: `agent/travel-sync`. Preserve unrelated working files. Never
use destructive reset/checkout.

### Task 2: Read the normative set

Read completely:

1. this rollout index;
2. Academy blueprint;
3. cross-curriculum audit;
4. Home/store spec and plan;
5. `docs/flightglass-autopilot/STATUS.md`;
6. `docs/SESSION-HANDOFF.md`;
7. `docs/flightglass-autopilot/academy-completion-loop.md`;
8. `AGENTS.md` and `CLAUDE.md`.

Before each later batch, read that row's full spec and plan plus the previous
batch's final STATUS entry.

### Task 3: Establish clean baseline evidence

Run:

```powershell
npm run test:academy
npm run claude:ready
npm run test:perf
npm run test:visreg
Get-FileHash impact-flight.js -Algorithm SHA256
Get-FileHash swing-parameters-and-impact.js -Algorithm SHA256
Get-FileHash diagnose-engine.js -Algorithm SHA256
Get-FileHash diagnose-engine-v2.js -Algorithm SHA256
```

Record exact totals and hashes. If baseline is red before the batch, diagnose
and document it; do not attribute it to new work.

### Task 4: Verify the planning inventory

Assert all 15 rows' files exist and the 14 experience specs still reconcile
24/24 concept ownership with no duplicate. A missing artifact is a planning
blocker; do not improvise from legacy article copy.

---

## 6. Standard TDD loop inside every experience batch

Follow the experience plan's exact tasks. At minimum:

1. write failing pure model/estimate/geometry fixture test;
2. run and observe the intended failure;
3. implement the smallest adapter over the protected single source;
4. run focused test to green;
5. write failing content/voice/truth test;
6. implement frozen content manifest;
7. write failing S0–S3 browser behavior test;
8. implement the dedicated instrument and CSS;
9. write failing S4/S5 gate, near-miss, restore and duplicate-reward tests;
10. implement mastery only through shared store transaction;
11. add legacy migration/route fixtures;
12. run focused tests, then full Academy/UX/WebKit/perf/visual gates;
13. collect fresh human/judge/pairwise evidence where applicable;
14. update STATUS/HANDOFF;
15. secret scan, diff check, stage intended files only, commit and push;
16. start the next batch automatically only after acceptance.

Every model/estimate test compares against raw values before display rounding.
Every live gate has at least one passing fixture and one separate near miss per
threshold class.

---

## 7. Shared implementation contracts

### 7.1 Physics integrity

- Import protected engine outputs; do not paste their constants into renderers.
- Pure adapters may calculate documented post-solve Air/Wind estimates only in
  the owning conditions modules.
- Formula changes require a failing regression, explicit authorization and a
  separate physics change—not an Academy batch.
- Hash all protected files at the end of each batch.

### 7.2 One dominant job

Each experience must preserve its spec's dominant learner question. Shared
shell elements may be reused; instruments may not be flattened into one generic
bar chart, generic article or generic trajectory.

### 7.3 State and rewards

- Keep `strikearc.academy.v1`.
- Preserve legacy lesson records and unknown fields.
- Practiced is not Mastered.
- 4/5 knowledge plus mandatory live transfer is the core mastery rule.
- One experience, one accepted attempt, at most one reward.
- Plane Coupling writes exploration only.
- Existing Backspin accepted mastery is grandfathered.

### 7.4 Navigation

- Preview always open.
- Prerequisites/placement gate S4, not information.
- Host/router decides next action.
- No renderer hardcodes universal next.
- All 24 legacy routes resolve to owner experience/sheet.

### 7.5 Voice

- Local semantic cue manifest only; no runtime generation/network/token need.
- 12–24 words, no more than eight signatures per experience.
- One automatic entry cue per surface at most.
- Rare consequence/recovery cue only on genuinely new evidence.
- Captions/Replay/global mute/screen-reader suppression/failure-safe content.
- Missing audio cannot block Academy or mastery.

### 7.6 Native accessibility

- 430×932 and 375×812 including safe areas.
- ≥44×44 CSS-pixel targets.
- 200% text.
- keyboard/switch parity and deterministic focus return.
- DOM truth for every SVG/canvas value.
- reduced motion preserves final evidence.
- sign/word/shape in addition to color.

---

## 8. Gate-based acceptance

Acceptance per batch requires all four independent gates:

1. **Zero critical defects** in runtime, physics/content truth, migration,
   rewards or accessibility.
2. **All critical evidence checks PASS** against the locked manifests and
   experience-specific laws.
3. **Every category floor clears individually:** accessibility, motion, truth,
   information architecture, mobile/native behavior and state integrity.
4. **Pairwise-blind preference** against the relevant previous-generation
   article/path surface.

A derived score is recorded only as a byproduct/tripwire. It cannot offset a
failed gate and is not an optimization target.

The optional Plane Coupling comparison judges model literacy and boundary
clarity; its failure does not revoke 13-core Academy completion.

---

## 9. Verification commands and evidence

At each batch's clean gate, run from root:

```powershell
npm run copy-web
npm run brand:verify
npm run test:academy
npm run test:ux
npm run test:webkit
npm run test:perf
npm run test:visreg
node scripts/verify-claude-autopilot.mjs
```

Also run the batch's focused model/content/browser/migration test files named in
its plan.

Evidence package must name:

- commit before/after;
- exact command and test totals;
- focused raw fixture result;
- pass and near-miss live-gate state;
- migration/duplicate-reward profile;
- 430×932 and 375×812 normal/reduced captures;
- accessibility scan and keyboard trace;
- pairwise inputs/result;
- independent judge outputs if required by active manifest;
- packaged root/`www/` parity;
- protected-file hashes;
- outstanding owner-only device/human gates.

Flaky fixed-time waits are not acceptance. Wait for observable state or make the
test deterministic.

---

## 10. Git and checkpoint discipline

Within a batch, use the small commits prescribed by its plan. At batch close:

```powershell
git diff --check
git status --short
git diff --name-only
git add <explicit intended files only>
git diff --cached --check
git commit -m "docs: accept Academy <experience>"
git push origin agent/travel-sync
```

Before commit:

- scan staged content for secrets;
- assert no protected file is staged;
- exclude unrelated `outputs/`, root chat briefs and `scripts/workflows/`;
- preserve user changes;
- record the batch state in STATUS/HANDOFF.

Never use `--no-verify`, force push, destructive reset or broad `git add .` in a
dirty worktree.

---

## 11. Cross-batch regression matrix

Every later batch rechecks the earlier invariant most likely to be harmed:

| New batch | Mandatory earlier regression |
|---|---|
| Any batch | Home recommendation/progress, Backspin route/mastery, migration idempotence |
| Shape | Start Line same-start and loft modifier |
| Carry Side | Start Line + Shape signed composition |
| Low Point | Attack geometry/sign |
| Contact Height | Attack z invariance + Low Point event order |
| Delivered Loft & Launch | Attack sign/meaning |
| Backspin amendment | full original STUDIO-GRADE package |
| Flight Height & Descent | Delivered Loft/Spin Loft paths + Backspin grandfather |
| Carry | Speed Transfer equal-Ball-Speed fixture |
| Air Density | Carry baseline frozen |
| Wind | Carry baseline + Carry Side endpoint preserved |
| Plane Coupling | core count/XP/recommendation byte-equivalent before/after exploration |

If an earlier accepted critical invariant regresses, the current batch is not
accepted even when its own focused tests pass.

---

## 12. Completion definitions

### Core Academy implemented

Core is implemented only when Batches 0–13 are accepted and:

- Academy Home shows 13 core experiences;
- all 24 legacy concepts route correctly;
- every core experience independently passed its live gate and acceptance;
- a fresh and migrated high-XP profile can complete without reward loss/dup;
- all owner-only §6 gates are either completed or explicitly collected as
  release blockers;
- STATUS/HANDOFF contains exact evidence and protected hashes.

### Optional lab implemented

Batch 14 is separately accepted. It does not affect core completion.

### Release ready

Release readiness additionally requires the owner's physical-iPhone performance
session, manual VoiceOver pass, five-person five-second test and explicit release
authorization. Implementation autonomy does not waive these gates.

---

## 13. Ready-to-run Claude Code handoff

Use this exact operational handoff:

```text
Repository: C:\Users\SkotvoldSivertSende\svingbue
Branch: agent/travel-sync

Read completely:
1. docs/superpowers/plans/2026-07-15-academy-outcome-curriculum-rollout.md
2. docs/superpowers/specs/2026-07-15-academy-outcome-curriculum-blueprint.md
3. docs/superpowers/specs/2026-07-15-academy-cross-curriculum-acceptance-audit.md
4. docs/flightglass-autopilot/STATUS.md
5. docs/SESSION-HANDOFF.md

Start with Batch 0 and its exact spec/plan pair. Execute every task TDD-first.
Implement one batch at a time. Do not ask for module approval between accepted
batches. Stop only on the rollout index's explicit escalation conditions.
Never modify protected physics inside an Academy batch. Use gate acceptance,
not a numeric score target. Update STATUS/HANDOFF, commit and push every accepted
batch before continuing.
```

The implementation process must not infer authorization to deploy production or
release stores. It may complete local/native implementation and evidence within
the accepted plan scope.
