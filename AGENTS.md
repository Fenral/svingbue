# Flightglass autonomous agent instructions

Read `CLAUDE.md` completely before changing project files. It contains the
implementation gates, protected identifiers and release boundaries for this
repository.

## Scope before code

Read the files that will change and state the intended outcome, non-goals and
fresh evidence required for completion. Preserve existing work and keep the
diff limited to the requested outcome.

Classify planned files before editing:

```powershell
npm run verify:change -- --dry-run --file <planned-file>
```

Repeat `--file` for every planned file. After editing, run:

```powershell
npm run verify:change
```

The command selects level A (focused), B (risk-triggered) or C (complete
current-main gate), explains the selection and records timing under
`outputs/flightglass-gates/`. Never silently select a lower level. A downgrade
requires explicit owner authorization, `--allow-downgrade` and a concrete
`--reason`. Promote any change with `--level C` when wider evidence is useful.

## Protected boundaries

- Never change app ID `no.strikearc.app`.
- Never change App Store Connect ID `6768449250`.
- Never rename the three `strikearc_pro_*` RevenueCat product IDs.
- Never migrate existing `strikearc.academy.*` storage keys.
- Do not change golf physics output without a failing regression test and
  explicit authorization.

The change gate checks these identifiers on every non-dry run.

## GitHub travel checkpoints

Keep work available from the owner's travel computer on the remote branch
`agent/travel-sync` in `Fenral/svingbue`.

Create a checkpoint:

- after each completed design specification or implementation phase;
- before pausing, stopping or handing work to another agent; and
- when meaningful source or documentation changes have remained local for
  roughly 45 minutes during a long-running session.

For every checkpoint:

1. Update `docs/flightglass-autopilot/STATUS.md` when phase state or evidence
   changed.
2. Update `docs/SESSION-HANDOFF.md` with the current result, unresolved risks,
   verification state and exact next action.
3. Inspect `git status` and scan the intended files for credentials or secrets.
4. Run the smallest relevant verification. A WIP checkpoint may contain a
   documented failing test, but must never be described as complete.
5. Commit the intended files with a concise message and push
   `agent/travel-sync` to `origin`.

Never force-push, push checkpoint work directly to `main`, commit credentials,
or add ignored dependencies, generated bundles, store exports or local backup
directories. A travel checkpoint is a recoverability action, not authorization
to deploy to Vercel or publish to an app store.

## Multi-agent coordination (Codex and Claude share this repo)

More than one agent (Claude Code and Codex) may work this repo. They coordinate
through git and one shared file — never through a live channel. To avoid
colliding edits and divergent runs:

1. **One agent per branch.** Never two agents on the same branch/working tree at
   once. Codex works on its own branch (e.g. `agent/academy-codex`); do not
   commit onto another agent's active branch.
2. **Claim work in `docs/flightglass-autopilot/COORDINATION.md` before starting.**
   Read it first. If another agent owns the files or batch you intend to touch,
   take a different batch or wait. Update the file when you start and when you
   finish. It is the mutex.
3. **Clean tree before handing off.** Commit (or stash) your changes and push
   before another agent picks up. A dirty tree inherited mid-edit is the main
   cause of collisions.
4. **One owner of shared docs at a time.** `STATUS.md`, `SESSION-HANDOFF.md` and
   `COORDINATION.md` must not be edited by two agents concurrently.

## Acceptance model (summary — full detail in CLAUDE.md)

A numeric score is a derived byproduct and tripwire, never a target to aim for.
Acceptance of any surface or lesson is four evidence gates: zero critical
defects, every category floor cleared, all critical checks pass, and pairwise-
blind won against the previous generation. Figures like `90+` or `96-97` are the
score expected to fall out once the gates pass, not the goal. Build through the
gate pipeline in `docs/flightglass-autopilot/academy-completion-loop.md`; the
Backspin lesson (Tasks 1-20, STUDIO-GRADE) is the proven reference shell.

## Verification and Git

- Use `npm run test:home` for focused Home contracts.
- Run the browser spot when user-visible runtime behavior changes.
- Generated reports and screenshots under `outputs/flightglass-gates/` are
  local evidence and must not be committed.
- Do not push, merge to `main`, deploy or publish without explicit owner
  authorization.
- AI commits include `Co-Authored-By: Codex <noreply@openai.com>`.
