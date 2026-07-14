# Flightglass autonomous implementation instructions

Read `docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md` completely before changing
any file. It is the product and UX source of truth. Then read
`docs/flightglass-autopilot/STATUS.md` to find the first incomplete phase.

## Start gate

Run:

```powershell
npm run claude:ready
```

Do not implement while this command fails. Diagnose the failure, preserve the
evidence and repair the control package first.

## Autonomous work loop

For the first incomplete phase:

1. Read every normative reference named for that phase in the master plan.
2. Run the existing baseline for only that surface with
   `node scripts/flightglass-ux-audit.mjs --mode baseline --surface <id> --motion both`.
3. Create a timestamped backup under `.sa-backups/` before editing shipping
   files. This folder has no Git metadata, so the backup is the rollback unit.
4. Write or extend a failing automated acceptance test before implementation.
5. Make the smallest cohesive implementation that satisfies the phase.
6. Run the focused tests, brand verifier and focused Playwright audit.
7. Inspect screenshots at all manifest viewports. Do not claim a visual pass
   from DOM metrics alone.
8. Update `docs/flightglass-autopilot/STATUS.md` with evidence, score and any
   documented assumption.
9. Continue to the next phase without asking the owner when every gate passes.

## Decision policy

Do not ask questions already answered by the master plan. When ordinary
ambiguity remains, preserve truth, preserve the dominant job, remove
simultaneous UI, make feedback live, choose the simpler native interaction,
record the assumption and continue.

Stop only under the five conditions in the master plan's autonomy protocol.
Do not stop for taste preferences, minor copy choices, normal test failures or
decisions between recent mocks when a primary reference is already named.

## Locked boundaries

- Never change `no.strikearc.app`.
- Never change App Store Connect ID `6768449250`.
- Never rename the three `strikearc_pro_*` RevenueCat product IDs.
- Never migrate existing `strikearc.academy.*` storage keys.
- Do not change golf physics output without a failing regression test and
  explicit authorization.
- Do not generate new imagery. Existing local assets, CSS, Canvas and SVG are
  the first implementation path.
- The owner granted release authorization on 2026-07-13. Read
  `docs/flightglass-autopilot/RELEASE-AUTHORIZATION.md`. Publish to GitHub,
  Vercel and the configured app stores only after every Phase 8 gate passes;
  no second approval is required inside those boundaries.
- Do not introduce Supabase or OpenAI merely because connectors are available.

## Model and effort routing (instrument-gates order §3)

- Delegate to the `fg-mekaniker` subagent for all pure command runs —
  test suites, `npm run copy-web`, `brand:verify`, harness screenshot
  capture, file moves, `.sa-backups` — anything with machine-readable
  pass/fail output. Never for code changes, design judgment or debugging.
- Delegate to the `fg-dommer` subagent for ALL quality judgment against the
  locked evidence manifest (`config/evidence/instrument-laws.json`) and for
  pairwise blind comparisons. The main thread never scores its own work.
- Judge prompts must never contain: target scores, previous scores, hopes,
  or any reference to who built the work. Only the manifest path and
  artifact paths.
- Everything else — architecture, implementation, debugging, synthesis —
  runs in the main session at maximum capability. When in doubt, main
  session.
- Derived scoring only: judges deliver PASS/FAIL JSON to
  `scripts/derive-score.mjs`; a number is derived, never asserted. NO-GO on
  any critical failure overrides every score.

## Required commands

```powershell
npm run test:ux
npm run ux:manifest
npm run ux:baseline
npm run ux:verify
npm run brand:verify
npm run copy-web
```

`ux:baseline` records current findings and is allowed to complete with UX
improvements listed. `ux:verify` is the strict gate and fails on runtime,
overflow or missing-essential-selector criticals.

## Completion language

Only say a phase is complete after fresh verification output and screenshot
inspection. A numerical score above 90 never overrides a critical failure.

## GitHub travel checkpoints

This working folder is connected to `Fenral/svingbue`. Keep all autonomous WIP
on `agent/travel-sync`; do not push it directly to `main`.

Push a checkpoint after every completed design specification or implementation
phase, before any pause or handoff, and whenever meaningful changes have been
local for roughly 45 minutes during a long session. Before pushing:

1. Update `docs/flightglass-autopilot/STATUS.md` when its evidence changed.
2. Update `docs/SESSION-HANDOFF.md` with current verification and the exact next
   action.
3. Inspect the staged scope and scan it for credentials or secrets.
4. Run the smallest relevant verification and record any failure honestly.
5. Commit and push `agent/travel-sync` without force.

Checkpoint publication is only for travel continuity. It does not count as a
release and does not bypass the Phase 8 gates for `main`, Vercel or app stores.
Never commit ignored dependencies, generated bundles, store exports or local
backup directories.
