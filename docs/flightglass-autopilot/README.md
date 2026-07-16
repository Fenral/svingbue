# Flightglass Claude Code autopilot

Start with:

1. `../../CLAUDE.md`
2. `../FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md`
3. `STATUS.md`
4. `../../config/flightglass-surfaces.json`

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

QA evidence is written to `outputs/flightglass-ux/`. Baseline reports describe
the current product. Verify reports are strict implementation gates.

No new image generation is part of the active plan. Apple/Google store capture
automation remains in the existing screenshot workflow and is exercised during
the final convergence phase.

The owner's conditional release approval is recorded in
`RELEASE-AUTHORIZATION.md`. It becomes actionable only after all Phase 8 gates
pass.
