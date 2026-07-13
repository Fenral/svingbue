# Flightglass autonomous agent instructions

Read `CLAUDE.md` completely before changing project files. It contains the
implementation gates, protected identifiers and release boundaries for this
repository.

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
