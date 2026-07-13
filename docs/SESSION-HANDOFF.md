# Flightglass session handoff

Updated: 2026-07-13

## Repository checkpoint

- Remote: `Fenral/svingbue`
- Working branch: `agent/travel-sync`
- Purpose: recoverable travel copy of design, analysis, source and verification
  evidence. This branch is not a release branch.
- Repository visibility: private, verified on 2026-07-13.

Durable chat
decisions are now recorded in `docs/CHAT-DECISIONS.md`, and the original
identity concept pages are preserved in `docs/concepts/flightglass/`.

## Execution state

Phase 0 of the autonomous implementation package is complete. The next coded
phase is Phase 1, Home / Floodlights. Read
`docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md` and
`docs/flightglass-autopilot/STATUS.md` before implementation.

Backspin has a separate 96-97 reference-lesson design and implementation plan:

- `docs/superpowers/specs/2026-07-13-backspin-96-97-design.md`
- `docs/superpowers/plans/2026-07-13-backspin-reference-lesson.md`

## Academy design decision in progress

The current recommendation, still awaiting final owner approval, is:

- make Academy home a goal-led coach with one dominant Continue/Start action;
- move the full physics constellation to a secondary Explore surface;
- separate physical relations, learning prerequisites and recommended journeys;
- consolidate the 24 stored topic IDs into about 16 learner-visible experiences
  while preserving IDs and storage compatibility; and
- use no more than four to six assessed transfer bridges instead of a general
  network of related-module links.

Do not convert this recommendation into production work until the owner has
approved the Academy architecture.

## Exact next actions

1. Obtain the owner's Academy architecture approval when Academy planning
   resumes.
2. For coded execution, run `npm run claude:ready` and begin Phase 1 only when
   the gate passes.
3. Update this file and push a new travel checkpoint before any pause.
