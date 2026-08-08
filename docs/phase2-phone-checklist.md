# Flightglass v1 physical-iPhone release evidence

Status: **PENDING — automated phone emulation is green; no physical-iPhone or
native sandbox purchase evidence is recorded here**

This is the hands-on gate for the exact signed iPhone candidate. Browser
emulation cannot prove safe areas, native lifecycle, Apple purchase sheets,
RevenueCat entitlement delivery or restore behavior.

Android is outside the iPhone v1 release gate. An Android smoke test may be
recorded separately, but it cannot substitute for the required iPhone run.

## Immutable template and working copy

This committed file is the immutable `PENDING` template. Never enter completed
results, tester details or evidence paths here. For each signed candidate, copy
it to an ignored working directory and place every local screenshot, video and
log beneath the same evidence root:

```powershell
$candidateSha = git rev-parse HEAD
$buildIdentity = "1.0.0 (42)"
$phoneEvidenceRoot = "outputs/release-evidence/phone/$candidateSha-42"
New-Item -ItemType Directory -Force -Path $phoneEvidenceRoot
Copy-Item docs/phase2-phone-checklist.md "$phoneEvidenceRoot/phone-release-evidence.md"
```

Complete only the copied `phone-release-evidence.md`. Evidence cells accept one
relative file beneath `$phoneEvidenceRoot` or one public HTTPS URL with no
credentials, query string or fragment. Use an index file when a row needs
multiple artifacts, and list each artifact as a Markdown link in that index.
The validator recursively validates and hashes those linked files; it rejects
missing files, its own generated attestation and paths that escape the evidence
root.

## Pass rule

This gate passes only when:

- one exact signed candidate is identified below and its GitHub release gate is
  green;
- every required physical-device row is `PASS` on that candidate;
- a real Apple sandbox Monthly **or** Annual purchase grants RevenueCat
  entitlement `pro`;
- cancellation and a store/network error remain locked and recover cleanly;
- Restore Purchases recovers a current subscription after a clean install;
- Restore Purchases recovers an existing Lifetime owner while Lifetime remains
  absent from the v1 paywall; and
- no unresolved crash, data-loss, purchase, accessibility or layout blocker
  remains.

Do not infer purchase success from a browser adapter, a RevenueCat dashboard
entry alone or a green automated test.

## Candidate and environment record — required before testing

| Field | Required value |
|---|---|
| Test date/time and timezone | PENDING |
| Tester initials / role | PENDING |
| Candidate commit SHA | PENDING |
| GitHub release-gate run URL | PENDING |
| App version and build number | PENDING |
| Distribution source | PENDING — TestFlight or signed release archive |
| iPhone model | PENDING |
| iOS version | PENDING |
| Device language / region | PENDING |
| Display Zoom / text size | PENDING |
| Reduced Motion state(s) tested | PENDING |
| Network(s) tested | PENDING |
| RevenueCat project / Offering identifier | PENDING |
| RevenueCat entitlement identifier | `pro` — verify, do not edit |
| Storefront country | PENDING |
| Fresh subscription tester alias | PENDING — non-identifying label only |
| Existing Lifetime tester alias | PENDING — non-identifying label only |
| Evidence folder or release-record link | PENDING |

Never record an Apple ID, password, public SDK key, receipt, transaction ID,
order number or full RevenueCat customer identifier in the repository. Use
aliases such as `SUB-A` and `LIFE-B`; keep credentials in the approved secret
manager.

## Preconditions — stop if any fail

Record `PASS` or `FAIL`; do not replace missing external configuration with a
mock.

| # | Precondition | Result | Evidence / note |
|---:|---|---|---|
| 1 | The installed version/build matches the candidate record and exact commit. | PENDING | PENDING |
| 2 | GitHub's full release gate is green for that commit. | PENDING | PENDING |
| 3 | The build is signed for `no.strikearc.app` and installs/launches normally. | PENDING | PENDING |
| 4 | The native build received a valid iOS RevenueCat public SDK key at build time; no key is committed. | PENDING | PENDING |
| 5 | RevenueCat has Apple's In-App Purchase Key (`.p8`), Key ID and matching Issuer ID; none is committed or bundled in the app. | PENDING | PENDING |
| 6 | App Store Connect Monthly and Annual products are available to the sandbox. | PENDING | PENDING |
| 7 | RevenueCat's current Offering maps Monthly and Annual to entitlement `pro`. | PENDING | PENDING |
| 8 | The legacy Lifetime product still maps to `pro` for an existing owner, but is not offered for sale. | PENDING | PENDING |
| 9 | Paid Apps Agreement, tax and banking are active for the candidate account. | PENDING | PENDING |

Any `FAIL` leaves the gate pending and must be resolved before purchase testing.

## Physical-iPhone core smoke

For each row, record `PASS` or `FAIL`, an ISO 8601 timestamp with UTC offset and
a screenshot/video/log reference when useful. A failure needs reproduction
steps and an issue link. Do not simply tick a box.

| # | Required action and success criterion | Result | Timestamp | Evidence / defect reference |
|---:|---|---|---|---|
| 1 | Cold launch shows a complete safe-area layout with no blank frame, clipped control or status-bar/home-indicator collision. | PENDING | PENDING | PENDING |
| 2 | Skip the opening, background/foreground the app, then relaunch; the opening does not replay in the same app session. | PENDING | PENDING | PENDING |
| 3 | On fresh state, each `Not now` point resumes the same onboarding step after relaunch. | PENDING | PENDING | PENDING |
| 4 | Moving Delivered Loft visibly updates Launch Angle, Spin Loft and Backspin together; the tour creates no personal profile or `currentShot`. | PENDING | PENDING | PENDING |
| 5 | Product-map links open Range/Outcome, Mechanics Lab and Guide in separate fresh attempts, with the bottom navigation and Back path usable. | PENDING | PENDING | PENDING |
| 6 | Home, Range/Outcome, Mechanics and Guide each render and respond in portrait without horizontal overflow, clipped primary actions or unusable controls. | PENDING | PENDING | PENDING |
| 7 | Mechanics Lab works in portrait and landscape without a forced-rotate overlay; every other permitted orientation reflows or respects its native lock without a stuck/blank surface. | PENDING | PENDING | PENDING |
| 8 | Background for at least 30 seconds during an edited Outcome state, resume, and confirm the app remains responsive and does not corrupt the state. | PENDING | PENDING | PENDING |
| 9 | Enable iOS Reduced Motion, cold-launch and repeat opening, onboarding resume and route navigation with no essential information removed. | PENDING | PENDING | PENDING |
| 10 | With VoiceOver on, reach the product map and Home Restore Purchases control; focus order, labels and activation are usable and status changes are announced. | PENDING | PENDING | PENDING |
| 11 | Increase Dynamic Type to the largest practical accessibility size and verify legal/support and purchase controls remain reachable without hidden content. | PENDING | PENDING | PENDING |
| 12 | Open Privacy and Terms from the native purchase/legal surface and return successfully; separately open the public Support URL over HTTPS and confirm it loads. | PENDING | PENDING | PENDING |

## Apple sandbox purchase and restore protocol

Use genuine named value moments. Do not use `sa_debug`, a browser purchase
adapter, direct storage edits or a RevenueCat dashboard override in candidate
evidence.

Use at least two non-identifying sandbox tester aliases:

- `SUB-A`: no pre-existing Flightglass entitlement; used for cancellation,
  error, purchase and current-subscription restore;
- `LIFE-B`: an account that already owns the legacy Lifetime product; used only
  for compatibility restore.

If switching sandbox accounts does not produce a clean RevenueCat identity,
delete the app and reinstall the exact same TestFlight build, or use a second
physical iPhone on the same candidate. Record which method was used.

### A. Live offering and cancellation — `SUB-A`

1. Start from a clean install and confirm the user is Free.
2. Complete a genuine value moment until the app opens the Pro surface (for
   example the 11th new Range comparison, second guided Mechanics experiment or
   sixth same-day Guide answer).
3. Confirm only Monthly and Annual are visible, prices and periods come from the
   live Apple sandbox, legal/renewal copy is readable, and Lifetime is absent.
4. Start one plan purchase, cancel in Apple's purchase sheet, and return to the
   app.
5. Success means the app remains Free, shows a non-alarming cancellation state,
   does not consume or falsely resume the gated action, and permits retry.

### B. Store/network error and recovery — `SUB-A`

1. After live offerings have loaded, disable network connectivity and attempt a
   purchase or offering refresh.
2. Success means no `pro` entitlement appears, the UI exits its busy state,
   explains that the store could not complete the purchase and remains usable.
3. Restore connectivity, retry, and confirm the purchase surface recovers
   without restarting the device.

If the Apple sandbox cannot produce the intended error deterministically,
record `BLOCKED`, the exact attempted method and evidence. Do not relabel a
cancelled transaction as an error.

### C. Successful purchase — `SUB-A`

1. Select Monthly or Annual and complete Apple's sandbox purchase sheet.
2. Success means RevenueCat reports active entitlement `pro`, the paywall closes,
   the originally gated action resumes exactly once, and Pro access remains
   after force-quit/relaunch.
3. Confirm no Lifetime sales option appears before or after purchase.

### D. Current-subscription restore after clean install — `SUB-A`

1. Delete the app, reinstall the exact same candidate build and verify its
   version/build again.
2. Without purchasing again, open **Restore purchases** from Home's always-
   available purchase/legal surface.
3. Complete Apple's restore flow using `SUB-A`.
4. Success means `pro` returns, the success state is announced, Pro access works
   after relaunch and no duplicate charge is created.

### E. Existing Lifetime restore — `LIFE-B`

1. Use a clean install/identity with the same candidate and the existing
   Lifetime sandbox owner.
2. Confirm Lifetime is still absent from the paywall.
3. Use **Restore purchases** from Home.
4. Success means the legacy purchase grants the same active `pro` entitlement,
   Pro surfaces unlock, and Lifetime remains absent as a purchasable plan.

## Purchase evidence record

Each result must be `PASS`, `FAIL`, `BLOCKED` or `PENDING`. Only `PASS` closes a
required row. Dashboard screenshots may corroborate device evidence but cannot
replace the observed device result.

| Flow | Tester alias | Plan / entitlement | Result | Timestamp | Device evidence | RevenueCat / App Store corroboration | Notes / issue |
|---|---|---|---|---|---|---|---|
| Live Offering | SUB-A | Monthly + Annual visible; Lifetime hidden | PENDING | PENDING | PENDING | PENDING | PENDING |
| Cancel | SUB-A | Chosen live plan | PENDING | PENDING | PENDING | PENDING | PENDING |
| Error + recovery | SUB-A | Chosen live plan | PENDING | PENDING | PENDING | PENDING | PENDING |
| Purchase | SUB-A | PENDING Monthly or Annual → `pro` | PENDING | PENDING | PENDING | PENDING | PENDING |
| Relaunch persistence | SUB-A | `pro` | PENDING | PENDING | PENDING | PENDING | PENDING |
| Clean-install restore | SUB-A | Current subscription → `pro` | PENDING | PENDING | PENDING | PENDING | PENDING |
| Legacy restore | LIFE-B | Lifetime → `pro` | PENDING | PENDING | PENDING | PENDING | PENDING |

For purchase evidence, capture the app state immediately before the Apple sheet,
the app result immediately afterward, and the entitlement state timestamp. Do
not commit a screenshot that exposes the tester account, receipt or transaction
identifier.

## Automated phone prerequisite

Run on the exact candidate commit:

```powershell
npm run test:phase2:phone
```

The matrix covers Chromium and WebKit at `375x812` and `430x932`, normal and
reduced motion, fresh storage, skip/resume, all four steps, product navigation,
horizontal overflow and app console/page errors. Record the fresh run rather
than relying on an old date.

| Engine | 375x812 normal | 375x812 reduced | 430x932 normal | 430x932 reduced | Run URL / timestamp |
|---|---|---|---|---|---|
| Chromium | PENDING | PENDING | PENDING | PENDING | PENDING |
| WebKit | PENDING | PENDING | PENDING | PENDING | PENDING |

This automated matrix is prerequisite evidence, not physical-device evidence.

## Final handoff

| Summary field | Recorded result |
|---|---|
| Exact candidate identity verified | PENDING |
| Required core-smoke rows passed | PENDING / 12 |
| Required purchase/restore rows passed | PENDING / 7 |
| Unresolved launch-blocking defects | PENDING |
| Physical-iPhone gate verdict | **PENDING** |
| Reviewer and review timestamp | PENDING |

The verdict is `PASS` only when every prerequisite, all 12 core-smoke rows and
all 7 purchase/restore rows pass on the exact candidate, and no launch blocker
remains. Link this record from the release PR. Keep
`docs/phase2-onboarding-uat.md` separate: physical smoke does not replace the
ten-person comprehension and completion-time gate.

After completing every table, run the fail-closed evidence validator from the
same repository checkout:

```powershell
npm run verify:v1:phone-evidence -- --candidate $candidateSha --build $buildIdentity --file "$phoneEvidenceRoot/phone-release-evidence.md" --evidence-root $phoneEvidenceRoot
```

Exit code `0` is required. The validator proves checked-out `HEAD`, the package
version stored in that commit, git origin and the completed/successful
`Flightglass v1 release gate` run from
`.github/workflows/v1-release-gate.yml` all identify the same candidate. It
also checks the immutable row text, all required results, evidence-file
boundaries, timestamp coherence and accidental credential/account data in the
full record and referenced UTF-8 text/log files.

A successful run writes
`flightglass-phone-evidence-attestation-<candidate>-v<version>-b<build>.json`
beneath `$phoneEvidenceRoot`. Its SHA-256 payload binds the candidate, build,
verified GitHub run, completed record and every referenced local evidence file.
The validator refuses to overwrite an existing attestation; a new candidate or
build receives a different filename. Keep the completed Markdown, media/logs
and attestation outside the candidate commit. Upload them to the approved
release-evidence store and link all three from PR #18. The attestation protects
integrity; it does not replace the direct observations or reviewer.
