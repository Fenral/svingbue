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
| _None_ | — | — | — |

## Queue / free to take

- Academy curriculum build — batches defined in
  `docs/superpowers/plans/2026-07-15-academy-outcome-curriculum-rollout.md`.
  Each batch has a spec/plan pair under `docs/superpowers/{specs,plans}/`.
  Build through the gate pipeline in `academy-completion-loop.md`.
  Owner instruction on 2026-07-15 authorized the curriculum source
  implementation, which is now complete. New-module pairwise, licensed-audio,
  native-platform and device/human gates remain release/acceptance holds in
  `STATUS.md`; they may not be reported as passed or waived.
- Ready surfaces (Home, Range, Visualise, Outcome, Compare, Strike Window,
  Paywall) — mocks + decision docs exist; each still needs its own plan/spec
  pair before build.

## Done / handed off

- Academy distinct Voice exploration round 3 — `agent/academy-codex`; Nordic
  Lab Lead, Flight Director and Performance Scientist each produced three
  provenance-blind `R3-*` candidates on identical copy. The resume-safe
  `voice:explore` and round-three selection path are documented and covered by
  the green 28-test Voice suite. Final blind selection remains pending.

- Academy Voice refinement round 2 — `agent/academy-codex`; B and E were
  recorded as round-one finalists, each received one subtle ElevenLabs Remix,
  and six unique `R2-*` candidates were generated under ignored local
  provenance. The resumable `voice:refine` and round-two `voice:select` paths
  are documented and covered by the green 27-test Voice suite. Final blind
  selection and full 102-cue generation remain pending.

- Flightglass model/effort routing — `agent/academy-codex`; the normal route is
  Terra/medium, Luna/low owns lightweight deterministic work, and Sol/high is
  reserved for consequential architecture, protected boundaries, release and
  paid external actions. Local `flightglass-{luna,terra,sol}` Codex profiles
  were created and parsed successfully; model choice remains fixed within an
  already-running thread.

- Academy ElevenLabs voice-production tooling — `agent/academy-codex`; all 102
  exact cues are inventoried, three blind Voice Design directions and a
  resumable full-pack generator are implemented, provider credentials/raw work
  are ignored, paid calls require two explicit flags, and FFmpeg processing,
  metadata and hash generation are covered by the green foundation suite. No
  paid call or final audio asset was produced; Creator account/key setup and the
  listening/rights gates remain owner-controlled.

- Academy Backspin visual acceptance and control hardening —
  `agent/academy-codex`; the current generation won 8/8 valid balanced blind
  pairs, all 48 baselines were deliberately approved, two independent visual
  suites passed with a maximum 0.099% difference, and the Apex annotation is
  deterministic without a threshold relaxation. Brand, autopilot, focused
  Chromium/WebKit and performance gates are green. New-module pairwise,
  licensed audio, native-platform and device/human gates remain open.

- Academy curriculum final convergence — `agent/academy-codex`, source through
  `46ff9a0` and final test compatibility through `2b601b3`; all 13 core
  experiences plus the optional Plane Coupling lab are implemented. The full
  Academy and UX matrices and both performance engines pass. Native platform
  creation, licensed female audio, visual-baseline/pairwise approval and human
  device gates remain explicitly fail-closed in `STATUS.md` and
  `SESSION-HANDOFF.md`.

- Academy Batch 14 optional Plane Coupling MODEL LAB — `agent/academy-codex`,
  commit `46ff9a0`; protected geometry adapters, separate no-reward exploration
  storage, six caption cues and both browser engines green.

- Academy Batch 13 Wind source implementation — `agent/academy-codex`, commit
  `c536826`; immutable engine baseline, along/across first-order estimates,
  two-state mastery, seven voice cues and both browser engines green.

- Academy Batch 12 Air Density source implementation — `agent/academy-codex`,
  commit `6d66a3e`; immutable engine baseline, combined air proxy, same-shot
  mastery, eight voice cues and both browser engines green.
- Academy Batch 11 Carry source implementation — `agent/academy-codex`, commit
  `360dcfb`; protected Carry/Total adapter, shared-plane mastery, seven voice
  cues and both browser engines green.
- Academy Batch 10 Speed Transfer source implementation —
  `agent/academy-codex`, commit `301efcd`; protected transfer adapter,
  equal-Ball-Speed live mastery, seven voice cues and both browser engines green.
- Academy Batch 9 Flight Height & Descent source implementation —
  `agent/academy-codex`, commit `5263fb2`; protected profile adapter, same-Apex
  live mastery, grandfather path, six voice cues and both browser engines green.
- Academy Batch 8 Backspin compatibility amendment — `agent/academy-codex`,
  commit `915f300`; exact truth/result/router copy, grandfather migration and
  both browser engines are green. Licensed-audio and external visual gates remain.
- Academy Batch 7 Delivered Loft & Launch source implementation —
  `agent/academy-codex`, commit `76eae59`; protected flight adapter, native
  three-arrow S0–S5/equal-launch mastery/voice and regressions are green.
  External pairwise, licensed-audio and device/human gates remain.
- Academy Batch 6 Contact Height source implementation —
  `agent/academy-codex`, commit `3d82aa2`; protected point-path/ground adapters,
  native S0–S5/two-height invariant mastery/voice and regressions are green.
  External pairwise, licensed-audio and device/human gates remain.
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
