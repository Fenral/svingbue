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
New-Item -ItemType Directory -Force -Path "$phoneEvidenceRoot/iap-review"
Copy-Item docs/phase2-phone-checklist.md "$phoneEvidenceRoot/phone-release-evidence.md"
```

Complete only the copied `phone-release-evidence.md`. Evidence cells accept one
relative file beneath `$phoneEvidenceRoot` or one public HTTPS URL with no
credentials, query string or fragment. Use an index file when a row needs
multiple artifacts, and list each artifact as a Markdown link in that index.
The validator recursively validates and hashes those linked files; it rejects
missing files, its own generated attestation, paths that escape the evidence
root, and symbolic-link or junction indirection. Inline and reference-style
Markdown links are both followed into the recursive evidence snapshot.

## Pass rule

This gate passes only when:

- one exact signed candidate is identified below and its GitHub release gate is
  green;
- every required physical-device row is `PASS` on that candidate;
- exactly two native IAP Review screenshots prove the selected Monthly and
  Annual plans from the exact TestFlight build and live Store offering;
- a real Apple sandbox Monthly **or** Annual purchase grants RevenueCat
  entitlement `pro`;
- cancellation and a store/network error remain locked and recover cleanly;
- Restore Purchases recovers a current subscription after a clean install;
- the hidden Lifetime compatibility mapping remains attached to `pro` and
  absent from the v1 paywall; do not require a Lifetime restore transaction
  while the owner-confirmed buyer cohort is zero; and
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
| Lifetime buyer cohort status | NONE - owner confirmed 2026-08-09 |
| Evidence folder or release-record link | PENDING |

Never record an Apple ID, password, public SDK key, receipt, transaction ID,
order number or full RevenueCat customer identifier in the repository. Use an
alias such as `SUB-A`; keep credentials in the approved secret manager. If the
owner later discovers a historic Lifetime purchase, pause release and add a
non-identifying compatibility tester alias plus a real restore row.

## Preconditions — stop if any fail

Record `PASS` or `FAIL`; do not replace missing external configuration with a
mock.

| # | Precondition | Result | Evidence / note |
|---:|---|---|---|
| 1 | The installed version/build matches the candidate record and exact commit. | PENDING | PENDING |
| 2 | GitHub's full release gate is green for that commit. | PENDING | PENDING |
| 3 | The build is signed for `no.strikearc.app` and installs/launches normally. | PENDING | PENDING |
| 4 | The native build received a valid iOS RevenueCat public SDK key at build time; no key is committed. | PENDING | PENDING |
| 5 | RevenueCat has Apple's In-App Purchase Key (`.p8`) and matching Issuer ID; neither value is committed or bundled in the app. | PENDING | PENDING |
| 6 | App Store Connect Monthly and Annual products are available to the sandbox. | PENDING | PENDING |
| 7 | RevenueCat's current Offering maps Monthly and Annual to entitlement `pro`. | PENDING | PENDING |
| 8 | The hidden legacy Lifetime compatibility mapping to `pro` is present, Lifetime is absent from the Offering, and no buyer cohort is known. | PENDING | PENDING |
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
| 5 | Product-map links open Outcome, Studio and Guide in separate fresh attempts, with the bottom navigation and Back path usable. | PENDING | PENDING | PENDING |
| 6 | Home, Outcome, Studio and Guide each render and respond in portrait without horizontal overflow, clipped primary actions or unusable controls. | PENDING | PENDING | PENDING |
| 7 | Rotate through every orientation the app permits; content reflows or the native lock is respected without a stuck/blank surface. | PENDING | PENDING | PENDING |
| 8 | Background for at least 30 seconds during an edited Outcome state, resume, and confirm the app remains responsive and does not corrupt the state. | PENDING | PENDING | PENDING |
| 9 | Enable iOS Reduced Motion, cold-launch and repeat opening, onboarding resume and route navigation with no essential information removed. | PENDING | PENDING | PENDING |
| 10 | With VoiceOver on, reach the product map and Home Restore Purchases control; focus order, labels and activation are usable and status changes are announced. | PENDING | PENDING | PENDING |
| 11 | Increase Dynamic Type to the largest practical accessibility size and verify legal/support and purchase controls remain reachable without hidden content. | PENDING | PENDING | PENDING |
| 12 | Open Privacy and Terms from the native purchase/legal surface and return successfully; separately open the public Support URL over HTTPS and confirm it loads. | PENDING | PENDING | PENDING |

## Apple sandbox purchase and restore protocol

Use genuine named value moments. Do not use `sa_debug`, a browser purchase
adapter, direct storage edits or a RevenueCat dashboard override in candidate
evidence.

Use one non-identifying sandbox tester alias:

- `SUB-A`: no pre-existing Flightglass entitlement; used for cancellation,
  error, purchase and current-subscription restore.

If switching sandbox accounts does not produce a clean RevenueCat identity,
delete the app and reinstall the exact same TestFlight build, or use a second
physical iPhone on the same candidate. Record which method was used.

### A. Live offering and cancellation — `SUB-A`

1. Start from a clean install and confirm the user is Free.
2. Complete a genuine value moment until the app opens the Pro surface (for
   example the 11th new Outcome comparison, second guided Studio experiment or
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

### E. Lifetime compatibility — no buyer cohort

The owner confirmed on 2026-08-09 that no customer has purchased Lifetime.
Verify configuration only: the hidden `strikearc_pro_lifetime` compatibility
product remains attached to entitlement `pro` in RevenueCat and is absent from
the current Offering. Do not fabricate a transaction or tester.

If the owner later discovers a historic Lifetime purchase, this assumption is
invalid. Add a real clean-install restore row and require it to pass before App
Review.

### Required native IAP Review screenshot bundle - final gate

Create this exact local bundle beneath the external evidence root for every new
candidate SHA and build number:

```text
iap-review/index.md
iap-review/strikearc_pro_monthly.png
iap-review/strikearc_pro_annual.png
```

These are the two App Review Screenshot upload candidates: one screenshot with
Monthly selected and one with Annual selected. Do not add Lifetime or substitute
the public App Store gallery. Browser, simulator, composited and
`synthetic-native` preflight captures are rehearsal only and cannot satisfy the
final native IAP Review screenshot gate. Capture both final files on a physical
iPhone from the exact TestFlight build after its live Apple Store offering and
localized prices have loaded.

Before capture on iOS 26, choose **Settings > General > Screen Capture > SDR**;
Apple documents SDR screenshots as PNG and HDR screenshots as HEIC. The
validator requires each exact file to contain exact PNG binary data with its PNG
signature, `IHDR`, image data and `IEND`, a valid CRC for every PNG chunk, and no
bytes after `IEND`. A full Sharp decode must succeed, so corrupt, truncated,
trailing or otherwise undecodable files fail. Every capture must be opaque
without alpha or transparency.

`iPhone model` and both IAP `Device` cells must use one exact canonical model
name from this native portrait-pixel map:

| Canonical physical device | Required PNG width x height |
|---|---:|
| iPhone 14 | `1170x2532` |
| iPhone 14 Plus | `1284x2778` |
| iPhone 14 Pro | `1179x2556` |
| iPhone 14 Pro Max | `1290x2796` |
| iPhone 15 | `1179x2556` |
| iPhone 15 Plus | `1290x2796` |
| iPhone 15 Pro | `1179x2556` |
| iPhone 15 Pro Max | `1290x2796` |
| iPhone 16 | `1179x2556` |
| iPhone 16 Plus | `1290x2796` |
| iPhone 16 Pro | `1206x2622` |
| iPhone 16 Pro Max | `1320x2868` |
| iPhone 16e | `1170x2532` |
| iPhone 17 | `1206x2622` |
| iPhone 17 Pro | `1206x2622` |
| iPhone 17 Pro Max | `1320x2868` |
| iPhone Air | `1260x2736` |

Each final artifact must be an untouched, full-screen portrait PNG captured on
that recorded physical iPhone and must exactly match its mapped native pixels.
Cropped, resized, rotated, exported, simulator, browser, composited or merely
App-Store-compatible substitute dimensions fail. An unlisted model fails closed
until its Apple tech-spec resolution is explicitly added and tested. The map is
based on Apple's model tech specs and
[layout reference](https://developer.apple.com/design/human-interface-guidelines/layout).
Exact equality is this project's conservative untouched-capture evidence
contract; Apple's
[App Store screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)
describe acceptable upload buckets, not physical-source proof.

Each decoded screenshot must also meet the documented visual-complexity floor:
at least 16 sampled colors, luma standard deviation `10.0`, and luma entropy
`1.0 bit`. A blank, uniform or obviously content-free image fails. These checks
bind plausible image content to the bundle, but capture provenance remains
operator-attested and is not cryptographically proven.

Create `iap-review/index.md` with exactly this schema and two rows. Replace every
`PENDING` cell; keep the capture-source text exact:

```markdown
# Flightglass native IAP Review evidence

| Screenshot | Product ID | Selected plan | Localized price | Candidate SHA | Build number | Device | Timestamp | Capture source |
|---|---|---|---|---|---|---|---|---|
| [strikearc_pro_monthly.png](strikearc_pro_monthly.png) | strikearc_pro_monthly | Monthly | NOK 99 | PENDING | PENDING | PENDING | PENDING | Captured from the exact TestFlight build and live Store offering |
| [strikearc_pro_annual.png](strikearc_pro_annual.png) | strikearc_pro_annual | Annual | NOK 499 | PENDING | PENDING | PENDING | PENDING | Captured from the exact TestFlight build and live Store offering |
```

`Candidate SHA`, numeric `Build number` and `Device` must exactly match the
completed candidate record. `Localized price` must be exactly `NOK 99` for
Monthly and `NOK 499` for Annual; any other observed currency or price leaves the
gate closed until the release contract is deliberately updated. `Timestamp`
must be ISO 8601 with `Z` or a UTC offset. The two screenshot files must have
distinct SHA-256 hashes. The validator follows the index links relative to
`iap-review/` and recursively includes the index and both images in the
candidate/build attestation. It retains the validated bytes and SHA-256 for
every local evidence file, then immediately before attestation rereads each path
and fails if its target or bytes changed; attestation hashes come from the
retained validated snapshots.

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
| Required purchase/restore rows passed | PENDING / 6 |
| Unresolved launch-blocking defects | PENDING |
| Physical-iPhone gate verdict | **PENDING** |
| Reviewer and review timestamp | PENDING |

The verdict is `PASS` only when every prerequisite, all 12 core-smoke rows and
all 6 purchase/restore rows pass on the exact candidate, and no launch blocker
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
release-evidence store and link all three from PR #23. The attestation protects
integrity; it does not replace the direct observations or reviewer.
