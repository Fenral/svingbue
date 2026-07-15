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
| Codex | `agent/academy-codex` | Batch 0 — Academy Home/store/registry/router/voice/host + Backspin regression | 2026-07-15 |

## Queue / free to take

- Academy curriculum build — batches defined in
  `docs/superpowers/plans/2026-07-15-academy-outcome-curriculum-rollout.md`.
  Each batch has a spec/plan pair under `docs/superpowers/{specs,plans}/`.
  Build through the gate pipeline in `academy-completion-loop.md`.
- Ready surfaces (Home, Range, Visualise, Outcome, Compare, Strike Window,
  Paywall) — mocks + decision docs exist; each still needs its own plan/spec
  pair before build.

## Done / handed off

- Implementation-to-verification control audit — docs-only decision support,
  completed on `codex/process-control-audit`.
- Backspin lesson — Tasks 1-20, STUDIO-GRADE, committed and pushed.
- Geometry 3D — un-broken (vendored `three.module.js`, commit `5e22f97`),
  renders again; not yet raised to 90+.

## How to claim

1. Add yourself to **Active now** with your branch and the exact files/batch.
2. Create/checkout your own branch (do not commit onto another agent's branch).
3. When done: move your row to **Done / handed off**, commit, push.
4. Never edit `STATUS.md`, `SESSION-HANDOFF.md` or this file at the same time as
   another agent.
