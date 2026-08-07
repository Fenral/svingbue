# Flightglass v1 release record

Status: **SOURCE CANDIDATE IN PROGRESS — native, human and store-account gates
remain pending**

This is the durable handoff for Flightglass 1.0.0. It separates automated
source evidence from the observations and account state that automation cannot
prove. A green source gate is necessary, but it is not App Store authorization.

## Exact candidate record

The canonical exact-SHA record is [GitHub PR #18](https://github.com/Fenral/svingbue/pull/18).
Before any production deploy, Codemagic archive or App Store submission, its
body MUST name all of the following from the same candidate:

- the full 40-character candidate commit;
- the successful `Flightglass v1 release gate` run URL for that commit;
- the local `npm run verify:v1:release` result and duration;
- production and full dependency-audit results;
- changed-file credential-scan result; and
- every external gate that is still pending.

The previous workflow run associated with source checkpoint
`5999da325a0060e9d8abaa43f4aff78d0008d9d0` reported 269/269 passing tests in
GitHub run
[`31181474031`](https://github.com/Fenral/svingbue/actions/runs/31181474031),
but that workflow checked out GitHub's synthetic PR merge commit rather than
the exact checkpoint SHA. It is retained as an audit trail only and is
superseded by the current exact-SHA release gate. Never select it merely because
its old check is green.

## Automated prerequisite contract

For a new candidate:

1. Run `npm run verify:change -- --base <explicit-base-sha> --level C
   --no-report` locally. Level C performs diff-integrity, added-secret and
   protected-identifier checks before running `verify:v1:release` exactly once.
2. Push the exact commit and require its GitHub `verify` job to pass. For pull
   requests, the workflow checks out `github.event.pull_request.head.sha`; for
   push and manual dispatch it checks out `github.sha`. It fetches full history,
   asserts that checked-out `HEAD` equals that expected candidate, resolves the
   exact PR base or pre-push commit and invokes the same level-C change gate.
   Manual dispatch requires an explicit 40-character, non-zero `base_sha`
   input. Missing, truncated and all-zero base identities fail closed for every
   event; the workflow never substitutes `HEAD^`.
3. Run `npm audit --audit-level=high` and `npm audit --omit=dev
   --audit-level=high`, and record both results alongside the change-gate
   controls.
4. Record the exact outputs in PR #18 before any release action.

`npm run verify:v1:release` tests the evidence checker; it does not invent
participant or device observations. The moderated onboarding checker must be
run separately with the expected candidate SHA and signed build identity after
all ten sessions are recorded. The physical-iPhone checklist must also be
completed from direct observation.

## Rollback record

Repository baseline recorded on 2026-08-07:

- `origin/main`: `184140a2ff5834f23510662f8c442b8a8c03d36c`
- open release work: `agent/page-overview`, PR #18

Production web baseline inspected through the authenticated Vercel CLI on
2026-08-07:

- production deployment: `dpl_BKJgyzjJWn1QtSFrtgFGKS7b69dv`
- immutable deployment URL:
  `https://svingbue-n0oa6oywm-sivert-s-projects.vercel.app`
- production alias: `https://svingbue.vercel.app`

The alias still serves the older Night Ladder product, old legal copy and no
`support.html`. Re-inspect the alias immediately before deployment. If its
deployment ID has changed, update the exact record in PR #18 before proceeding.

Web rollback procedure:

1. Promote the pre-deploy production deployment recorded above (or the newer
   ID recorded in PR #18) back to the production alias in Vercel.
2. Verify Home, Terms, Privacy and Support over HTTPS.
3. Revert the release through a new GitHub PR. Do not force-push or reset
   `main`.

Native rollback boundary:

- before review: reject/expire the bad TestFlight candidate and build a new
  incremented build from a fixed commit;
- during App Review: remove the candidate from review before replacing it;
- after release: use App Store Connect's owner-controlled release controls and
  submit a corrected incremented build. Do not mutate product identifiers or
  revoke shared signing certificates as a rollback shortcut.

## Gates that remain external

- `main` currently has no branch-protection rule or ruleset; do not merge
  without explicitly confirming the exact candidate's green `verify` check;
- RevenueCat public iOS key, Apple In-App Purchase Key and Issuer ID;
- Monthly/Annual current Offering and legacy Lifetime restore mapping;
- persistent Apple signing and a successful TestFlight archive;
- Paid Apps Agreement, tax, banking and remaining App Store account fields;
- real sandbox cancel, error, purchase, subscription restore and Lifetime
  restore on the exact signed candidate;
- the 12-row physical-iPhone checklist; and
- ten moderated first-time onboarding sessions with at least 8/10 unassisted,
  median at most 90 seconds and no launch blocker.

The release remains pending until those rows contain evidence rather than
`PENDING`.
