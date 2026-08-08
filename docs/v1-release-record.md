# Flightglass v1 release record

Status: **SOURCE CANDIDATE IN PROGRESS — native, human and store-account gates
remain pending**

This is the durable handoff for Flightglass 1.0.0. It separates automated
source evidence from the observations and account state that automation cannot
prove. A green source gate is necessary, but it is not App Store authorization.

## Exact candidate record

The release execution record is
[GitHub PR #19](https://github.com/Fenral/svingbue/pull/19). The inherited
source release is [GitHub PR #18](https://github.com/Fenral/svingbue/pull/18),
green and stable at `3abbd4fcc65c939cc2d0e35ea03866add3540aa5`. PR #18 is
source evidence, not the canonical execution record for this release.

The reviewed Mechanics code-and-asset checkpoint is
`c47113bb23a3fb274277fe869dea925a6fa0a928`. Integration, design review, local
Level C and exact-head GitHub proof have been completed for frozen checkpoints.
This tracked document necessarily changes `HEAD`, so it MUST NOT claim its own
commit as the final candidate. After the last tracked commit, the authoritative
final exact candidate SHA, base, matching GitHub run and artifact digest are
bound post-commit in the PR #19 body and an immutable PR comment backed by the
matching GitHub artifact. That external record, not a self-reference here, is
the exact-SHA execution authority.

The required `Co-Authored-By: Codex <noreply@openai.com>` trailer applies to
new first-parent commits created on `agent/mechanics-v1-convergence`. Source
commits `9a9b060f54495245a42fb8fed89d2fd5ba0f74f4` and
`3abbd4fcc65c939cc2d0e35ea03866add3540aa5` are preserved ancestry from PR #18
and were intentionally not rewritten; their historical trailer state does not
violate the integration-branch requirement.

Before any production deploy, Codemagic archive or App Store submission, the
PR #19 body MUST name all of the following from the same candidate:

- the full 40-character candidate commit;
- the successful `Flightglass v1 release gate` run URL for that commit;
- the local `npm run verify:v1:release` result and duration;
- production and full dependency-audit results;
- changed-file credential-scan result; and
- every external gate that is still pending.

Automated proof recorded for the reviewed `c47113b` checkpoint:

- independent finish reviewer: `PASS`; Product fit 98, causal legibility 96,
  hierarchy 94, responsive integrity 95, accessibility 96, brand 97 and
  non-generic craft 96;
- protected engine: 72/72; protected-physics diff is empty;
- Mechanics Lab: 10/10 source contracts, 9/9 Chromium and 9/9 WebKit;
- Range plus Phase 2: latest 67/67;
- release-evidence contracts: 204/204;
- image provenance: 4/4; store release: 8/8;
- dependency audits: 0 vulnerabilities for the full app, production-only app
  and browser/build tools; and
- 32 Mechanics viewport/mode/motion captures with 0 critical UX findings.

These completed results do not turn a later documentation commit into an exact
green candidate by themselves. The post-commit PR #19 body, immutable PR
comment and matching GitHub artifact must bind the final SHA to the completed
local Level C and exact-head GitHub evidence. Exact-SHA Vercel preview evidence
and all account, native-device and human gates remain `PENDING`.

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

1. Run `npm run verify:change -- --base <explicit-base-sha> --level C`
   locally. Level C performs diff-integrity, added-secret and
   protected-identifier checks before running `verify:v1:release` exactly once,
   and writes a timing report that records the inner control's result and
   duration.
2. Push the exact commit and require its GitHub `verify` job to pass. For pull
   requests, the workflow checks out `github.event.pull_request.head.sha`; for
   push and manual dispatch it checks out `github.sha`. It fetches full history,
   asserts that checked-out `HEAD` equals that expected candidate, resolves the
   exact PR base or pre-push commit and invokes the same level-C change gate.
   Manual dispatch requires an explicit 40-character, non-zero `base_sha`
   input. Missing, truncated and all-zero base identities fail closed for every
   event; the workflow never substitutes `HEAD^`.
3. Run `npm audit --audit-level=high`, `npm audit --omit=dev
   --audit-level=high` and `npm audit --prefix tools --audit-level=high`.
   Record the full app, production app and build/browser-tool results separately
   alongside the change-gate controls.
4. Record the exact outputs in PR #19 before any release action.

`npm run verify:v1:release` tests the evidence checkers; it does not invent
participant or device observations. Keep both committed documents as immutable
`PENDING` templates.

After all ten moderated sessions, copy the onboarding template and evidence to
an ignored `outputs/release-evidence/onboarding/<candidate>/` directory, then
run:

```powershell
npm run verify:v1:onboarding-evidence -- --candidate <full-40-character-sha> --build "<package-version> (<build>)" --file <evidence-root>/onboarding-uat.md --evidence-root <evidence-root>
```

Exit code `0` emits an `onboarding-<candidate>-<build>.attestation.json` file
and matching `.sha256` checksum bound to the clean candidate, successful GitHub
run, completed study record and recursively referenced evidence. Preserve and
link the record, evidence, attestation and checksum from PR #19.

The physical-iPhone checklist must likewise be copied to an ignored
`outputs/release-evidence/phone/<candidate>-<build>/` working directory,
completed from direct observation and checked with:

```powershell
npm run verify:v1:phone-evidence -- --candidate <full-40-character-sha> --build "<package-version> (<build>)" --file <evidence-root>/phone-release-evidence.md --evidence-root <evidence-root>
```

Exit code `0` emits a candidate/build-specific
`flightglass-phone-evidence-attestation-<candidate>-v<version>-b<build>.json`
whose SHA-256 payload binds the exact candidate, build, successful GitHub
release-gate run, completed record and recursively linked evidence-index files.
It cannot overwrite an earlier attestation. The completed record, media/logs
and attestation remain external to the candidate and MUST all be uploaded to
the approved release-evidence store and linked in PR #19 before release
authorization.

## Rollback record

Repository baseline recorded on 2026-08-08:

- `origin/main`: `184140a2ff5834f23510662f8c442b8a8c03d36c`
- release execution work: `agent/mechanics-v1-convergence`, PR #19
- inherited source release: `agent/page-overview`, PR #18 at
  `3abbd4fcc65c939cc2d0e35ea03866add3540aa5`

Production web baseline inspected through the authenticated Vercel CLI on
2026-08-07:

- production deployment: `dpl_BKJgyzjJWn1QtSFrtgFGKS7b69dv`
- immutable deployment URL:
  `https://svingbue-n0oa6oywm-sivert-s-projects.vercel.app`
- production alias: `https://svingbue.vercel.app`

The alias still serves the older Night Ladder product, old legal copy and no
`support.html`. Re-inspect the alias immediately before deployment. If its
deployment ID has changed, update the exact record in PR #19 before proceeding.

The Vercel project is currently CLI-deployed and has no Git repository link.
Merging `main` does not publish it. Before promotion:

1. assert a clean checkout whose `HEAD` equals the PR head and whose exact
   `pull_request` GitHub release-gate run is green and reports the same PR base
   and head SHAs;
2. export a local `VERCEL_TOKEN` and an existing
   `VERCEL_AUTOMATION_BYPASS_SECRET` without committing or printing either,
   confirm ignored `.vercel/project.json` names project
   `prj_ghY32ypKS3kXfmTM3BCRzfl5ptqC`, and create the preview only through the
   fail-closed command below. The confirmation value MUST exactly equal the
   full candidate SHA:

   ```powershell
   npm run verify:v1:vercel-preview -- --deploy --candidate <full-40-character-sha> --base <full-distinct-ancestor-sha> --run-id <successful-github-run-id> --confirm-preview-deploy <same-full-candidate-sha>
   ```

   The command runs `npm run build:web`, rechecks clean exact `HEAD`, and calls
   a non-production `vercel deploy` with
   `flightglassCandidateSha=<40-char SHA>`, base, run URL, repository and
   workflow metadata. It never passes `--prod`, `--target production`,
   `--skip-domain`, `promote` or a token on the command line.
3. verify an existing preview without creating another deployment by naming
   both immutable identities explicitly:

   ```powershell
   npm run verify:v1:vercel-preview -- --verify --candidate <full-40-character-sha> --base <full-distinct-ancestor-sha> --run-id <successful-github-run-id> --deployment-id <dpl_id> --url <https://exact-preview.vercel.app>
   ```

   The verifier reads deployment ID, URL, project, `READY` state, non-production
   target and every metadata value from Vercel's authenticated v13 deployment
   API. It then uses the existing bypass secret for authenticated, read-only
   `vercel curl` checks for exact Flightglass
   content on Home, Privacy, Terms, Support and `sa-paywall.js`; a Vercel login
   or protection page returning 200 is a failed preview check. Successful
   verification exclusively creates a candidate/deployment-specific JSON
   attestation and `.sha256` checksum under ignored
   `outputs/release-evidence/vercel-preview/`. Existing evidence is never
   overwritten; link both files from PR #19.
4. require semantic `200` checks for Home, Mechanics Lab, Range / Outcome,
   Flightglass Guide, Privacy, Terms, Support and the paywall script. Require
   `404` for the private sentinels `/codemagic.yaml`, `/package.json`,
   `/vercel.json`, `/scripts/store-screenshots.mjs`, `/academy.html`,
   `/geometry.html`, `/page-overview.html`,
   `/design/mocks/impact-studio.html`, `/docs/v1-release-record.md` and
   `/tools/package.json`;
5. confirm Monthly and Annual use `Store price`, with no Lifetime sale or
   percentage-savings claim. The verifier requires `/codemagic.yaml`,
   `/package.json`, `/vercel.json`, `/scripts/store-screenshots.mjs`,
   `/academy.html` and `/geometry.html` to return 404; and
6. after every mandatory external gate is complete, promote that exact
   deployment and repeat the semantic route and sentinel checks against the
   public alias without Vercel authentication.

Preview status at this documentation checkpoint: `PENDING`. The project ID is
known, but neither `VERCEL_TOKEN` nor `VERCEL_AUTOMATION_BYPASS_SECRET` is
available in the local environment. No preview deployment, deployment ID,
public URL result or preview attestation is claimed.

The public GitHub Pages site currently presents deferred Academy-v2 material
and has no working Support, Privacy or Terms routes. Before public launch,
disable that Pages deployment or replace it with an owner-approved redirect or
`noindex` holding surface. It must not be presented as the Flightglass v1 app or
used for store URLs.

Web rollback procedure:

1. Promote the pre-deploy production deployment recorded above (or the newer
   ID recorded in PR #19) back to the production alias in Vercel.
2. Verify Home, Terms, Privacy and Support over HTTPS by expected Flightglass
   title/content as well as HTTP status.
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
- localized StoreKit prices plus real sandbox cancel, error, purchase,
  subscription restore and Lifetime restore on the exact signed candidate;
- the 12-row physical-iPhone checklist;
- ten moderated first-time onboarding sessions with at least 8/10 unassisted,
  median at most 90 seconds and no launch blocker;
- an exact-SHA Vercel preview with a green public URL matrix, followed by an
  explicit promotion because merge does not deploy this project; and
- retirement or containment of the stale public GitHub Pages Academy surface.

All real native/payment/device/human rows remain `PENDING`: RevenueCat and App
Store account mutation, signed TestFlight archive/upload, sandbox purchase and
restore paths, real purchase or other paid action, physical-iPhone checks and
moderated onboarding sessions. The stale GitHub Pages surface, Vercel preview,
production promotion and App Store submission also remain `PENDING`, not
`PASS`.

One consolidated owner authorization is required immediately before any of
these irreversible or externally visible actions: merge to `main`, production
promotion, GitHub Pages containment, TestFlight upload, RevenueCat/App Store
mutation, real purchase or paid action, and App Store submission. Source tests,
draft-PR evidence and read-only checks do not grant that authorization.

The release remains pending until every required row contains real evidence
rather than `PENDING`.
