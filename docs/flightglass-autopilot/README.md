# Flightglass Claude Code autopilot

Start with:

1. `../../CLAUDE.md`
2. `../FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md`
3. `STATUS.md`
4. `../../config/flightglass-surfaces.json`
5. `../../CHANGELOG.md`

From a fresh clone, install both locked dependency trees before running a gate:

```powershell
npm ci
npm ci --prefix tools
```

Browser audits use an installed Microsoft Edge first, with Google Chrome as
a fallback.

Run `npm run claude:ready`, then invoke the Claude Code command
`/flightglass-autopilot`. The command accepts an optional phase instruction,
but the status file normally selects the next phase automatically.

QA evidence is written to `outputs/flightglass-ux/`. The current V1 baseline is
`baseline-report.json` / `baseline-report.md`: 19 registered product states,
76 captures across two viewport sizes and normal/reduced motion, zero critical
findings and zero design-floor findings (regenerated 2026-08-18). Run
`npm run ux:baseline` to refresh this evidence and `npm run ux:verify` for the
strict implementation gate.

Directories named `task5` through `task8` are explicitly historical Academy v2
evidence. They are not part of the current V1 baseline or release claim.

No new image generation is part of the active plan. Apple/Google store capture
automation remains in the existing screenshot workflow and is exercised during
the final convergence phase.

The owner's conditional release approval is recorded in
`RELEASE-AUTHORIZATION.md`. It becomes actionable only after all Phase 8 gates
pass.
