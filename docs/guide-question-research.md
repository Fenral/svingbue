# Flightglass Guide — question research

**Purpose:** a durable, implementation-ready record of the golfer questions
behind the guided v1 catalog. This is a qualitative review of recurring
community discussions and launch-monitor reference material, **not** a
statistical survey: it does not count posts, votes, skill levels or markets.
Frequency below means “repeated across the reviewed material”, not population
prevalence.

## What golfers repeatedly ask

| Cluster | Representative concrete questions | Guide response shape |
|---|---|---|
| Start and curve | “Why did it start right?”, “Why did it start right then move farther right?”, “Should I look at face or path first?” | Separate **start** from **curve**, then bind face/path to the current Range state. |
| Contact and low point | “Why was that fat?”, “Why was it thin?”, “Where did the club meet the ground?” | Use the Strike Window geometry, with an explicit boundary that it is not face-impact measurement. |
| Launch and spin | “Why is it too high/low?”, “What is dynamic loft?”, “What changes spin?” | Explain delivery → launch/spin relationship, then offer the live variable model. Never turn this into an individual target number. |
| Speed and distance | “Why did I lose carry?”, “What do ball speed and smash mean?”, “Carry or total?” | Prioritise ball speed, launch, carry and total in that reading order. |
| Conditions and trust | “How much does wind/altitude change it?”, “Why do monitor numbers disagree?” | Clearly label estimate layers and missing environmental/device inputs. |
| Limits and debates | “Is it gear effect?”, “Which shaft/ball?”, “What body move caused it?”, “What exact number should I chase?” | Answer the boundary directly, say what data is missing, and avoid a guessed diagnosis or recommendation. |

The grouping agrees with reference definitions: launch direction is distinct
from curvature; face/path, dynamic loft, spin loft, attack angle and low point
are separate measures; and ball-speed/smash/carry are not interchangeable.

## Frozen v1 catalog (28 guided questions)

All v1 paths are button-led; there is no free-text interpretation route. An
item can appear in v1 even when its answer is a clear model boundary.

| Topic | v1 question IDs / user-facing question | Capability route |
|---|---|---|
| Direction | `curve-right`, `curve-left`, `start-right`, `start-left`, `start-right-more-right`, `start-left-more-left`, `start-right-back-left`, `start-left-back-right`, `face-path`, `face-or-path-first` | Add now: existing face/path → start/spin-axis/curve outcome. |
| Impact | `fat-contact`, `thin-contact`, `low-point`, `attack-angle` | Add now: existing geometry and delivery explanation, with a contact-measurement boundary. |
| Launch & spin | `ball-too-high`, `ball-too-low`, `ballooning`, `dynamic-loft-spin-loft`, `backspin` | Add now: existing delivered-loft/attack/speed → launch/spin outputs. No personal target band. |
| Distance | `lost-carry`, `ball-speed-smash`, `carry-total` | Add now: existing speed-transfer and distance outputs. |
| Conditions | `altitude-temperature`, `wind` | Boundary in v1; present only as labelled estimate/addability paths, not as hidden Range truth. |
| Model limits | `gear-effect`, `personal-club-fit`, `body-fault`, `personal-target` | Boundary in v1; route to new model/data requirement or refuse false precision. |

The first four groups make up the live, engine-backed learning surface. The
last two deliberately make uncertainty useful: a golfer can find the specific
question quickly and see why the answer needs more than the five Range inputs.

## Later queue — do not present as current engine truth

| Need surfaced by a real question | Minimum addition before it can be a live answer | Classification |
|---|---|---|
| Heel/toe strike and gear effect | Face-impact location, clubhead bulge/roll, centre of gravity and a validated clubhead model. | Needs new inputs / calibration. |
| Exact club, shaft or ball recommendation | Measured player delivery, strike pattern, club/shaft/ball specification data and a fitting decision model. | External data + calibration. |
| Precise course wind/altitude adjustment | User location, current weather, course elevation, ball aero and club/ball validation. | External data + calibration. |
| Rollout and stopping prediction | Surface firmness, slope, grass/green data, landing state and a calibrated bounce/roll model. | Needs new inputs / calibration. |
| “What body move caused this?” | Video or motion capture plus a separate, uncertainty-aware coaching interpretation model. | Reject from v1; inverse inference is non-unique. |
| One exact personal launch/spin target | Club, ball speed, strike, environment and objective-specific external reference data; even then show a sourced range and assumptions. | Reject as a universal answer; add only with declared calibration. |
| Device disagreement / monitor accuracy | Device make/model/setup, ball type, measured-vs-calculated field provenance and repeatability data. | External data + calibration. |

## Capability / addability rubric

Use this gate for every new Guide question before it becomes a button or a live
lab:

| Result | When it is allowed | UI contract |
|---|---|---|
| **Add now** | It follows from current Range inputs (`face`, `path`, `attack`, `dynLoft`, `speed`) or existing Strike geometry, and uses an already-derived metric. | “Range modelled” or “Studio geometry” badge; a live lab may be offered. |
| **Needs new inputs/data/calibration** | The causal factor is real but absent from the five-input model (e.g. strike location, clubhead geometry, environment, course surface or device provenance). | State missing inputs; no live lab until a bounded model and regression fixtures exist. |
| **Reject false precision** | The request asks to infer a unique body cause, medical advice, exact equipment prescription, or universal personal target from insufficient data. | Say the model cannot establish it; offer the nearest supported relationship, without an invented answer. |

Implementation rule: only `answer-now` catalog items may expose an
interactive lab. `bounded-model` and `external-data` are backlog signals;
`reject-false-precision` is a deliberate product boundary, not a failed search.

## Sources

Authoritative references inform definitions and terminology:

- [Trackman: launch direction](https://www.trackman.com/blog/golf/what-is-launch-direction)
- [Trackman: face to path](https://www.trackman.com/blog/golf/face-to-path)
- [Trackman: club-data definitions](https://www.trackman.com/blog/golf/club-data-definitions)
- [Trackman: 40+ parameter definitions](https://www.trackman.com/blog/golf/40-trackman-parameters)
- [Trackman: spin loft](https://www.trackman.com/blog/golf/spin-loft)
- [Trackman: low point](https://www.trackman.com/fr/blog/golf/low-point)
- [Trackman: attack angle](https://www.trackman.com/ko/blog/golf/attack-angle)
- [Trackman: dynamic loft](https://www.trackman.com/it/blog/golf/dynamic-loft)
- [Trackman: spin rate](https://www.trackman.com/blog/golf/3-steps-to-improve-your-spin-rate-in-golf)
- [FlightScope: environmental optimizer](https://flightscope.com/blogs/blogs/understanding-flightscopes-environmental-optimizer)
- [Titleist: altitude and ball performance](https://www.titleist.com/teamtitleist/gb/b/weblog/posts/the-effect-of-altitude-on-golf-ball-performance-535904389)
- [Foresight: measured versus calculated data](https://www.foresightsports.com/pages/what-we-measure)

Representative community discussions supplied the wording and boundary cases
(not quantitative evidence):

- [Face/path numbers that conflict with observed spin](https://www.reddit.com/r/golf/comments/1d7leqc)
- [Which launch-monitor metrics matter in practice?](https://www.reddit.com/r/golf/comments/191phs7)
- [Face/path and launch-monitor capability discussion](https://www.reddit.com/r/Golfsimulator/comments/1imn6pf)
- [Why a zero face-to-path reading can still hook](https://www.reddit.com/r/GolfSwing/comments/1rylwlx)
- [Questions about target launch values by club](https://www.reddit.com/r/golf/comments/1usza1b/help_understanding_optimal_launch_angles_for/)

### Caveats

- Community posts are useful for language and confusion patterns, not for
  authoritative physics or medical/coaching claims.
- Vendor definitions are used to name metrics; Flightglass still labels its
  own engine outputs and does not claim a vendor device measurement.
- The current Range solve has five delivery inputs. It does not contain live
  weather, ball construction, lie, moisture, face-impact location, gear effect
  or individual club calibration. Those omissions are product-visible limits.
