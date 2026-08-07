# Phase 2 learning-onboarding usability check

Status: awaiting moderated sessions

This is the human acceptance gate for the final Phase 2 Definition of Done.
Automated tests prove navigation, engine truth, accessibility and persistence;
they cannot prove that a first-time golfer understands the learning flow or
wants to explore the product without help.

## Pass rule

- At least 8 of 10 first-time participants reach the product map without help.
- Median time from the first tour screen to the product map is 90 seconds or
  less.
- A participant must change Delivered Loft at least once before continuing from
  the live relationship step.
- A hint, explanation of a control, instruction to scroll or naming the next
  button counts as help.

The comprehension prompts below are diagnostic evidence. They do not replace
the 8-of-10 and 90-second release gate and must not be coached into a pass.

## Session setup

1. Use a supported phone, preferably a physical device. The 375x812 browser
   viewport is the fallback when a device is unavailable.
2. Clear local-storage key `sa.v1.context` and session-storage key
   `sa.opening.v1` before each participant.
3. Start from a cold launch. Allow the participant to watch or skip the opening
   without commenting on either choice.
4. Read only: "Use Flightglass to understand what launch-monitor numbers
   change. Think aloud."
5. Start timing when `The numbers tell the story.` is visible.
6. Stop timing when `Three ways to understand a shot.` and the
   three-destination product map are visible.
7. Do not teach the product during the timed attempt. Record the first point of
   hesitation, any help and whether the participant used `Not now` or Back.

## Completion and truth checks

For an unassisted completion, verify from observation or the local context that:

- the participant viewed all four steps;
- the participant changed the fixed example's Delivered Loft at least once;
- Launch Angle, Spin Loft and Backspin changed while the control moved;
- no personal golf/profile answer was requested;
- no `currentShot` was created by the tour.

After stopping the timer, ask these questions without suggesting an answer:

1. "Which input did you change, and which outcomes reacted?"
2. "Where would you go to change all five delivery inputs?"
3. "Where would you go to inspect impact geometry?"
4. "What would you open next if you had five more minutes? Why?"

Record answers in notes. Expected understanding is Delivered Loft affecting
Launch Angle, Spin Loft and Backspin; Outcome for all five inputs; Studio for
impact geometry. The final question captures product investment, not technical
correctness.

## Evidence table

Do not mark the phase complete until all ten rows contain observed results.

| Participant | Finished | Seconds | Changed loft | Help given | Comprehension / first hesitation / next destination |
|---|---:|---:|---:|---:|---|
| P01 |  |  |  |  |  |
| P02 |  |  |  |  |  |
| P03 |  |  |  |  |  |
| P04 |  |  |  |  |  |
| P05 |  |  |  |  |  |
| P06 |  |  |  |  |  |
| P07 |  |  |  |  |  |
| P08 |  |  |  |  |  |
| P09 |  |  |  |  |  |
| P10 |  |  |  |  |  |

Median: pending

Unassisted completions: pending / 10

Comprehension summary: pending

Most requested next destination: pending

Verdict: pending

## Automated evidence already closed

Fresh 2026-08-07 evidence before the moderated gate:

- focused onboarding journeys: 9/9 Chromium and 9/9 WebKit;
- v1 shipping/native contracts: 48/48;
- automated phone matrix: 4/4 Chromium and 4/4 WebKit;
- first/returning launch, every resume point, Back and `Not now` covered;
- fixed-example values recompute through the shipping engine;
- the tour creates no `currentShot`;
- keyboard, focus, reduced motion, 44 px targets and both portrait targets
  covered;
- the Outcome, Studio and Guide previews are registered, reproducible captures
  of shipping routes.

These checks remain prerequisites, but Phase 2 stays open until the ten human
rows above produce a passing verdict.
