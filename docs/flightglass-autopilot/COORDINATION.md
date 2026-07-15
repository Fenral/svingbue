# Agent coordination — read this before you start

This repo may be worked by more than one agent (Claude Code and Codex). There is
no live channel between chats; this file is the shared mutex. **Read it first,
claim your work, update it when you start and finish.** Rules live in `AGENTS.md`
(§ Multi-agent coordination).

The one hard rule: **one agent per branch, never two on the same working tree at
once.** If the files or batch you want are claimed below, take another batch or
wait.

## Active now

| Agent | Branch | Working on | Since |
|-------|--------|-----------|-------|

## Queue / free to take

- Academy curriculum build — batches defined in
  `docs/superpowers/plans/2026-07-15-academy-outcome-curriculum-rollout.md`.
  Each batch has a spec/plan pair under `docs/superpowers/{specs,plans}/`.
  Build through the gate pipeline in `academy-completion-loop.md`.
  Owner instruction on 2026-07-15 authorizes the remaining curriculum source
  implementation to continue sequentially. Batch 0 visreg/pairwise,
  licensed-audio and device/human gates remain release/acceptance holds in
  `STATUS.md`; they may not be reported as passed or waived.
- Ready surfaces (Home, Range, Visualise, Outcome, Compare, Strike Window,
  Paywall) — mocks + decision docs exist; each still needs its own plan/spec
  pair before build.

## Done / handed off

- Academy Batch 5 Low Point source implementation — `agent/academy-codex`,
  commit `3a7d9e2`; raw/effective Low Point model, native S0–S5/two-event
  mastery/voice, persistent shared voice controls and regressions are green.
  External pairwise, licensed-audio and device/human gates remain.
- Academy Batch 4 Up or Down at Impact source implementation —
  `agent/academy-codex`, commit `4902562`; protected-engine adapters, native
  S0–S5/two-tangent mastery/voice and regressions are green. External pairwise,
  licensed-audio and device/human gates remain.
- Academy Batch 3 Carry Side source implementation — `agent/academy-codex`,
  commit `a4d075d`; model/content/native S0–S5/two-flight mastery/voice and
  regressions are green. External pairwise, licensed-audio and device/human
  gates remain.
- Academy Batch 2 Shape source implementation — `agent/academy-codex`, commit
  `7ea653b`; model/content/native S0–S5/two-capture mastery/voice and regressions
  are green. External pairwise, licensed-audio and device/human gates remain.
- Academy Batch 1 Start Line source implementation — `agent/academy-codex`,
  commit `3ba5a83`; model/content/native S0–S5/mastery/voice and regressions are
  green. External pairwise, licensed-audio and device/human gates remain open.
- Academy Batch 0 implementation — `agent/academy-codex`, native Home/store/
  registry/router/voice/host plus Backspin voice integration. Automated source
  work is handed off; acceptance remains held on the explicit external/visual
  gates in `STATUS.md`.
- Backspin lesson — Tasks 1-20, STUDIO-GRADE, committed and pushed.
- Geometry 3D — un-broken (vendored `three.module.js`, commit `5e22f97`),
  renders again; not yet raised to 90+.

## How to claim

1. Add yourself to **Active now** with your branch and the exact files/batch.
2. Create/checkout your own branch (do not commit onto another agent's branch).
3. When done: move your row to **Done / handed off**, commit, push.
4. Never edit `STATUS.md`, `SESSION-HANDOFF.md` or this file at the same time as
   another agent.
