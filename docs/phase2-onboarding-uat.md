# Phase 2 moderated onboarding release gate

Status: **PENDING — no moderated participant results are recorded**

This is the human acceptance gate for the Phase 2 onboarding. Automated tests
prove navigation, engine truth, accessibility, persistence and phone-sized
layout; they cannot prove that a first-time user understands the learning flow
without coaching.

## Release rule

The onboarding gate passes only when all of the following are true:

1. exactly 10 eligible first-time participants have valid session records;
2. at least 8 of 10 reach the product map without help;
3. the median completion time of those unassisted completions is 90 seconds or
   less; and
4. no unresolved launch-blocking defect was observed.

An unassisted completion requires `Map = Y`, `Loft = Y`, `Help = N` and
`Truth = PASS` in the result table. Do not count a participant who merely
reaches the final screen after being coached.

Do not mark Phase 2 complete from an automated run, an internal team walkthrough
or fewer than ten valid first-time sessions.

## Immutable template and evidence-record lifecycle

This tracked document is an immutable `PENDING` template. Never enter participant
results here and never change its top-level status to `PASS`.

For each release candidate:

1. Create a new untracked folder under
   `outputs/release-evidence/onboarding/<full-candidate-sha>/`.
2. Copy this template into that folder as `onboarding-uat.md`; place every local
   screenshot, recording, text note or log below the same folder.
3. Complete only the copied record. Keep this tracked template unchanged.
4. Run the checker with explicit `--file` and `--evidence-root` paths. A passing
   run writes a JSON attestation and matching `.sha256` checksum below
   `outputs/release-evidence/onboarding/`.

The checker refuses this tracked template, evidence records outside the supplied
root, a dirty source tree, an older commit/build and a second attestation for the
same candidate/build. Files ignored by Git (including the evidence root under
`outputs/`) do not make the source tree dirty. Preserve the completed copy,
evidence files, JSON attestation and checksum as one release-evidence set.

## Candidate record — fill before session P01

Freeze one candidate for all ten sessions. If the build or onboarding changes,
start a new ten-person run rather than combining results. Record the study start
and end as exactly two ISO 8601 timestamps with UTC offsets. The full candidate
SHA must equal the checked-out `HEAD`; the semantic version must equal
`package.json`, followed by a positive numeric build such as `1.0.0 (42)`.

| Field | Required value |
|---|---|
| Study date(s) and timezone | PENDING |
| Candidate commit SHA | PENDING |
| GitHub release-gate run URL | PENDING |
| App version and build number | PENDING |
| Distribution source | PENDING — for example TestFlight or signed local build |
| Default language / locale | PENDING |
| Facilitator | PENDING — role or initials only |
| Evidence folder or release-record link | PENDING — use `.` when the copied record is in the evidence root |

Use participant IDs only (`P01`–`P10`). Do not put names, email addresses,
Apple IDs, faces or other personal data in committed evidence.

## Participant eligibility

A participant is eligible only when they:

- have not used Flightglass before;
- have not seen the onboarding screens, screenshots or test script;
- can use the test phone without physical assistance; and
- are not a contributor who already knows the intended route.

Golf knowledge is not required. Record it only as a broad optional note such as
`new to launch monitors` or `familiar with launch monitors`; do not collect a
profile of the participant's own golf.

## Phone-friendly facilitator card

Keep this section open on a second phone or print it. Use the same words and
timing boundaries in every session.

### Before each participant

1. Confirm the installed version/build and candidate SHA match the candidate
   record above.
2. Reset `sa.v1.context` and `sa.opening.v1`, then cold-launch the app. A clean
   app install may be used when those stores cannot be inspected safely.
3. Confirm no earlier participant's state is visible.
4. Open a stopwatch, but do not start it during the opening animation.
5. Read exactly: **“Use Flightglass to understand what launch-monitor numbers
   change. Think aloud.”**
6. Allow the participant to watch or skip the opening without comment.

### Timed attempt

1. Start the stopwatch when **“Start with what flew.”** is fully visible.
2. Do not point, explain a control, tell them to scroll, name a destination or
   name the next button.
3. Let Back and `Not now` behave naturally. `Not now` before reaching the map
   is not a completion for this attempt.
4. Stop the stopwatch when **“Three ways to understand a shot.”** and all three
   product destinations are visible.
5. Record whole elapsed seconds without rounding down.
6. If the product map is not reached after 180 seconds, stop the attempt and
   record `Map = N`, `Seconds = 180+` and the first hesitation.

An incoming call, emergency or unrelated interruption may invalidate a session;
record the reason and recruit a replacement. An app crash, frozen control,
unreadable layout or navigation failure is a product failure and must not be
discarded as an interruption.

## What counts as help

Set `Help = Y` if, before the map appears, the facilitator or another person:

- identifies where to tap, swipe or scroll;
- explains what a label or control means;
- tells the participant what the next step or destination is;
- confirms a guess in a way that changes the participant's action; or
- touches the test device for them.

Repeating the single scripted opening sentence is also help. Clarifying an
unrelated device interruption is not help, but must be noted. Silence, neutral
encouragement such as “keep thinking aloud”, and asking “what are you looking
for?” without suggesting an action are permitted.

## Post-timer truth check

Set `Truth = PASS` only when observation and the saved local context confirm all
five statements:

- all four onboarding steps were viewed;
- Delivered Loft was changed at least once on the live relationship step;
- Launch Angle, Spin Loft and Backspin visibly changed while the control moved;
- the onboarding requested no personal golf/profile answer; and
- the onboarding created no `currentShot`.

If any statement is false or cannot be verified, set `Truth = FAIL` and name
the failed statement in the notes. Set `Loft = Y` only for an observed change,
not for touching the unchanged control.

## Diagnostic questions — after timing has stopped

Ask without suggesting an answer. These answers diagnose copy or hierarchy;
they do not turn an assisted/failed attempt into a pass.

1. “Which input did you change, and which outcomes reacted?”
2. “Where would you go to replay and compare a modelled setup?”
3. “Where would you go to trace inputs through strike to flight?”
4. “What would you open next if you had five more minutes? Why?”

Expected understanding is Delivered Loft affecting Launch Angle, Spin Loft and
Backspin in the bounded example; Range/Outcome for replay and comparison; and
Mechanics Lab for the causal chain. The last question measures product pull,
not correctness.

## Session identity and evidence log

Fill every field. A screenshot/video reference is optional unless a defect is
observed; a written timestamp, device, build and result are mandatory. Obtain
consent before recording a screen and never record the participant's face or
voice by default.

| ID | Timestamp (ISO 8601 with offset) | Device and OS | App version (build) | Commit | Facilitator | Evidence / defect reference |
|---|---|---|---|---|---|---|
| P01 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| P02 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| P03 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| P04 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| P05 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| P06 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| P07 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| P08 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| P09 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| P10 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |

Every participant needs a unique evidence reference. Use either a relative path
to an existing file inside `--evidence-root` or a credential-free public HTTPS
URL without query parameters. The checker hashes local files and scans the whole
Markdown record plus referenced `.txt`, `.log`, `.md`, `.json` and `.csv` files
for account data, email addresses, keys, tokens, receipts and transaction IDs.
When a referenced Markdown index links to more artifacts, or a JSON index has an
`artifacts` string array, those files are resolved and hashed recursively. A
record cannot reference itself, its attestation or its checksum.

## Result table

Use only `Y`/`N`, integer seconds from 1 through 180 (`180+` when the map was not
reached), and `PASS`/`FAIL`. `Map = Y` is invalid above 180 seconds. Keep notes
free of the `|` character so the evidence checker can parse the table.

| ID | Map | Seconds | Loft | Help | Truth | Result | First hesitation / comprehension / next destination |
|---|---|---:|---|---|---|---|---|
| P01 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| P02 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| P03 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| P04 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| P05 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| P06 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| P07 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| P08 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| P09 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| P10 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |

`Result` is `PASS` only when `Map = Y`, `Loft = Y`, `Help = N` and
`Truth = PASS`; otherwise it is `FAIL`.

## Calculation and verdict

Run the deterministic checker after all ten rows are filled. This example creates
the required untracked copy first:

```powershell
$flightglassCandidate = git rev-parse HEAD
$flightglassEvidenceRoot = "outputs/release-evidence/onboarding/$flightglassCandidate"
New-Item -ItemType Directory -Force $flightglassEvidenceRoot
Copy-Item docs/phase2-onboarding-uat.md "$flightglassEvidenceRoot/onboarding-uat.md"
# Complete only the copied file and add each referenced evidence artifact.
npm run verify:v1:onboarding-evidence -- --candidate $flightglassCandidate --build "1.0.0 (42)" --file "$flightglassEvidenceRoot/onboarding-uat.md" --evidence-root $flightglassEvidenceRoot
```

Replace `1.0.0 (42)` with the exact version/build identity installed on every
test phone. All four identity arguments are required. The checker resolves the
explicitly supplied full SHA in Git, requires it to be `HEAD`, binds the GitHub
Actions URL to the exact `origin` repository, and queries the `gh` API. The run
must be the **Flightglass v1 release gate** workflow, `completed` with conclusion
`success`; its `workflow_id` must resolve to the active
`.github/workflows/v1-release-gate.yml` path; and its `head_sha` must equal the
candidate. The package version is read from that committed candidate rather
than mutable working-tree files. Do not reuse a successful evidence file for a
newer commit or build.

The checker also requires a complete candidate record plus coherent, non-future
timestamps, device, build, full commit SHA and unique evidence for all ten IDs.
It derives each row's result, valid-session count, unassisted count, sorted times,
median and quantitative verdict, then rejects every summary value that disagrees.
The reviewer must sign with initials/role and a timestamp at or after the final
participant session.

Manual cross-check:

1. List the seconds for rows whose derived result is `PASS`.
2. Sort those values smallest to largest.
3. With an odd count, take the middle value. With an even count, average the two
   middle values (for eight values, average positions four and five).
4. The quantitative gate passes only when the count is at least 8 and the
   median is at most 90 seconds.

If fewer than eight participants complete unassisted, the gate fails regardless
of the median. Never enter a made-up completion time for a non-completer.

| Summary field | Recorded result |
|---|---|
| Valid sessions | PENDING / 10 |
| Unassisted completions | PENDING / 10 |
| Sorted qualifying times | PENDING |
| Median qualifying time | PENDING seconds |
| Most common first hesitation | PENDING |
| Most requested next destination | PENDING |
| Unresolved launch-blocking defects | PENDING |
| Quantitative verdict | PENDING |
| Final release-gate verdict | **PENDING** |
| Reviewer and review timestamp | PENDING |

Before the final check, replace every summary placeholder with the observed or
derived value. `0` unresolved launch blockers, a quantitative `PASS`, a final
`PASS` and reviewer signoff are mandatory. Exit code `0` is possible only when
candidate, build, repository, release workflow, participant evidence and every
derived summary value agree. Pending, contradictory or sensitive evidence is
rejected without writing an attestation.

## Existing automated prerequisite evidence

The repository release gate already covers the onboarding journeys in Chromium
and WebKit, the two phone viewports, skip/resume, Back, `Not now`, the fixed
engine relationship, zero `currentShot` creation, reduced motion, focus,
44-pixel targets and native capture contracts. Re-run the repository's release
gate on the exact candidate commit before the moderated sessions.

Those automated checks and `npm run verify:v1:release` are prerequisites only.
They deliberately unit-test the evidence checker without pretending that empty
human rows pass. This document remains pending until ten real participant
records satisfy the release rule above and
the identity-bound `npm run verify:v1:onboarding-evidence -- --candidate ...
--build ... --file ... --evidence-root ...` command exits successfully and its
SHA-256 attestation is preserved with the copied evidence record.
