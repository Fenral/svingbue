# Flightglass autopilot

Execute the Flightglass redesign autonomously from the repository root.

1. Read `CLAUDE.md`.
2. Read `docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md` completely.
3. Read `docs/flightglass-autopilot/STATUS.md` and select the first incomplete
   phase, or use the phase supplied in `$ARGUMENTS` when it is not already
   complete.
4. Run `npm run claude:ready` before editing.
5. Follow the backup, test-first, implementation, Playwright, screenshot and
   status-update loop from `CLAUDE.md`.
6. Do not ask for decisions locked in the master plan and do not generate new
   imagery.
7. Continue through later phases only after the current phase passes all gates.
8. Stop only under the five explicit autonomy stop conditions.

At every checkpoint report evidence, not confidence: commands, exit codes,
critical counts, viewport coverage, protected-ID count and the updated score.
