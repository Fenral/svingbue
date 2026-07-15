# Flightglass Academy — Air Density Experience Design

**Status:** Normative design specification, 2026-07-15. Ready for an
implementation plan after the shared Academy curriculum/store migration spec
exists.

**Experience ID:** `air-density`

**Learner-visible title:** **Air Density**

**Owned legacy concepts:** `altitude`, `temperature`

**Primary job:** apply a clearly separated post-solve estimate to one immutable
engine shot

**Goal family:** Playing conditions

**Prerequisite:** Carry

**Normative inputs:**

- `docs/superpowers/specs/2026-07-15-academy-outcome-curriculum-blueprint.md`
- `docs/superpowers/specs/2026-07-15-academy-carry-design.md`
- `docs/superpowers/specs/2026-07-15-academy-flight-height-descent-design.md`
- the current Academy post-solve air layer in `academy.html`
- `impact-flight.js`

## 1. Learner promise

Teach altitude and temperature as two inputs to one approximate air-density
layer, while keeping impact and engine outputs visibly immutable.

The experience succeeds only when the learner can:

1. distinguish the same launch result from a changed flight environment;
2. explain that altitude and temperature act through one density proxy rather
   than as unrelated yard bonuses;
3. identify altitude as an elevation input and temperature in Kelvin ratio;
4. compute the direction of change for colder/warmer and lower/higher states;
5. explain why thinner air changes both drag and lift in real flight;
6. identify the current 0.70 conversion as a heuristic, not a physical law;
7. keep Club Speed, Ball Speed, Launch, Spin Loft and launch Backspin unchanged;
8. distinguish engine Carry/Apex from estimated air-adjusted Carry/Apex;
9. name pressure/weather variation, humidity and full aerodynamics as omitted;
   and
10. build two air states with one unchanged engine shot and materially different
    estimated trajectories.

## 2. Non-goals

- Do not call the current proxy a weather forecast or trajectory solver.
- Do not call `fAltitude` measured density.
- Do not say altitude or air temperature changes current launch Ball Speed.
- Do not mix cold-ball material response into the numeric air layer.
- Do not claim humidity is zero in reality; it is held/not modeled here.
- Do not claim thinner air only reduces drag. It also reduces aerodynamic lift.
- Do not alter current Spin Axis, Curve or Backspin rpm in the estimate.
- Do not add wind controls; Wind is a separate experience.
- Do not teach a universal “club up/down” rule or exact course adjustment.
- Do not award separate Altitude and Temperature mastery/rewards.
- Do not change `impact-flight.js`.

## 3. Legacy-content verdict

The legacy environment lessons correctly keep the swing-side solve unchanged
and mark their results EST. Their main structural failure is separation:
Altitude and Temperature are taught as sequential modules even though both feed
one multiplicative density layer. The shared Carry instrument also quietly
keeps a humidity factor and can make the 15°C baseline slightly non-neutral.

### Retain, rewritten

- altitude and temperature affect the air after launch;
- a fixed launch state remains fixed;
- warmer/high-elevation states generally reduce density;
- colder/low-elevation states generally increase density;
- drag and aerodynamic lift both depend on density;
- the current UI adjustment is a post-solve estimate;
- baseline and estimated traces must be compared directly.

### Reject from learner-facing copy

- “Altitude only changes the air” without noting actual pressure/weather
  variation at the same elevation;
- “3% density per 1000 ft” as an exact atmosphere law;
- “70% of density loss becomes yards” as universal physics;
- guaranteed yardage or club-selection rules;
- claims that current Curve becomes smaller at altitude; it is not adjusted;
- numerical cold-ball Ball Speed changes; no ball-temperature model exists;
- separate causal ranking of Altitude, Temperature and Density as three causes;
- humidity claims in core mastery.

### Consolidation rule

- legacy `altitude` and `temperature` become owned sheets inside `air-density`;
- neither remains a core card;
- both stay individually named, controlled and assessed;
- one combined live gate earns one reward.

## 4. Definition and truth contract

### 4.1 Baseline engine shot

The module first calls current `solveFlight()` with the selected delivery. That
result is immutable while the learner edits environment:

```text
Club Speed
Ball Speed
Dynamic Loft
Attack Angle
Launch Angle
Spin Loft
Backspin
engine Carry
engine Apex
engine Landing
```

All are displayed as `ENGINE` / current model values.

### 4.2 Air-density proxy

The combined experience uses exactly two environment controls:

```text
fAltitude = 1 − 0.030 × (AltitudeFeet / 1000)

fTemperature = 288.15 / (273.15 + TemperatureC)

DensityProxy = fAltitude × fTemperature
```

`288.15 K` represents the 15°C reference. `DensityProxy = 1` at 0 ft and
15°C.

Registers:

- conversion Celsius → Kelvin: `DEFINITION`;
- inverse absolute-temperature relation at held pressure: `≈ REAL WORLD`;
- linear altitude factor: `EST PROXY`;
- multiplied proxy: `EST PROXY`, not kg/m³.

The learner label is always **Density proxy**, never **air density measured**.

### 4.3 Post-solve estimate

```text
AirMultiplier = 1 + 0.70 × (1 − DensityProxy)

EstimatedCarry = engineCarry × AirMultiplier

EstimatedApex = engineApex × AirMultiplier
```

Truth register: `EST AIR`.

The same multiplier on Carry and Apex is a deliberately simple UI heuristic.
It does not separately integrate drag, lift, speed decay, Spin Rate or flight
time.

### 4.4 What does not change

Environment interaction must leave these exact:

- Club Speed;
- Ball Speed;
- Smash;
- Dynamic Loft;
- Attack Angle;
- Launch Angle;
- Spin Loft;
- Backspin rpm;
- Start Direction;
- Spin Axis;
- engine Carry/Apex/Landing.

The estimated trace is a second layer. It never overwrites the baseline object
or its chips.

### 4.5 Combined cause, not double count

Altitude and Temperature are inputs to one DensityProxy. The causal diagram is:

```text
Altitude ─────┐
              ├→ DensityProxy → AirMultiplier → estimated Carry/Apex
Temperature ──┘
```

Do not add an independent “Density” bonus after applying both factors.

### 4.6 Local influence examples

At the normative engine baseline (Carry 172.4001 yd, Apex 33.0360 yd):

| Environment | Density proxy | Multiplier | Est Carry | Est Apex |
|---|---:|---:|---:|---:|
| 0 ft, 15°C | 1.000000 | 1.000000 | 172.40 yd | 33.04 yd |
| 1000 ft, 15°C | 0.970000 | 1.021000 | 176.02 yd | 33.73 yd |
| 0 ft, 25°C | 0.966460 | 1.023478 | 176.45 yd | 33.81 yd |
| 8000 ft, 15°C | 0.760000 | 1.168000 | 201.36 yd | 38.59 yd |
| 0 ft, −5°C | 1.074585 | 0.947790 | 163.40 yd | 31.31 yd |
| 0 ft, 40°C | 0.920166 | 1.055884 | 182.03 yd | 34.88 yd |

Copy:

> Importance depends on the change being compared. In this proxy, +1000 ft and
> +10°C from baseline are both material and similar for this shot; the full
> altitude control spans more than one typical temperature step.

Do not convert this table into universal percentage advice.

### 4.7 Mandatory contrast fixture

Engine state: DL30°, AA−3°, Club Speed 90 mph.

Immutable engine values:

- Ball Speed 119.52 mph;
- Launch 17.85°;
- Spin Loft 33°;
- Backspin 7099.49 rpm;
- Carry 172.4001 yd;
- Apex 33.0360 yd.

Air state A:

```text
0 ft · 5°C
DensityProxy 1.035952
AirMultiplier 0.974834
EstimatedCarry 168.0614 yd
EstimatedApex 32.2046 yd
```

Air state B:

```text
5000 ft · 25°C
DensityProxy 0.821491
AirMultiplier 1.124956
EstimatedCarry 193.9425 yd
EstimatedApex 37.1640 yd
```

Estimated Carry difference: 25.8812 yd. Engine Carry difference: exactly zero.

### 4.8 Causal-completeness inventory

| Role | Treatment |
|---|---|
| Environmental inputs | Altitude and air temperature |
| Composite mediator | DensityProxy |
| Estimate gain | 0.70 heuristic |
| Estimated outcomes | Carry and Apex only |
| Immutable launch result | all impact/launch chips and engine trajectory |
| Held | humidity, pressure beyond altitude proxy, wind, ball temperature |
| Not adjusted | Curve, Offline, Landing, Total, Backspin rpm |
| Not modeled | full atmosphere, drag/lift integration, gusts, course elevation change |

## 5. Instrument design

### 5.1 Design direction

**Aesthetic:** quiet atmospheric test chamber inside a native aerospace lab.

**Purpose:** make layer separation more memorable than the yardage gain.

**Differentiation anchor:** the solid engine shot is sealed behind a vertical
glass partition labeled **LAUNCH LOCKED**; only a dashed air trace beyond that
partition changes as the chamber thins or densifies.

DFII:

| Dimension | Score |
|---|---:|
| Aesthetic impact | 5 |
| Context fit | 5 |
| Implementation feasibility | 5 |
| Performance safety | 5 |
| Consistency risk | 3 |
| **DFII** | **17 − 3 = 14** |

### 5.2 Visual layers

1. locked launch capsule with immutable chips;
2. solid baseline trajectory;
3. dashed estimated trajectory;
4. density-proxy vertical gauge centered on 1.000;
5. separate Altitude and Temperature input tabs feeding one gauge;
6. two-state compare rail.

No particle fog, full-screen weather animation or decorative turbulence.

### 5.3 Controls

- Altitude: 0–8000 ft, step 100;
- Air temperature: −5–40°C, step 1;
- state A/B save;
- reset: `0 ft · 15°C reference`.

Delivery controls appear only in a collapsed **Change baseline shot** sheet. In
the core sequence they are fixed at DL30/AA−3/CS90 to keep environment causality
legible.

### 5.4 Readouts

Always show two columns:

| Engine baseline | EST air layer |
|---|---|
| Carry | Estimated Carry |
| Apex | Estimated Apex |
| Ball Speed | Density proxy |
| Launch | Air multiplier |
| Backspin | Delta from engine |

The right column may never omit `EST`.

## 6. Surface-by-surface specification

### S0 — Mission

Kicker:

> PLAYING CONDITIONS · AIR

Title:

> Air Density

Promise:

> Keep the launch locked. Change the air around it.

Mission:

> Produce two estimated flights from one identical engine shot.

Boundary strip:

> POST-SOLVE ESTIMATE · NOT A WEATHER FORECAST · IMPACT OUTPUTS LOCKED

Primary action:

> Enter air chamber

Voice, first visit only:

> “The strike is sealed. Altitude and temperature change only the estimated air
> layer after launch.”

### S1 — Air Chamber

#### Step A — Lock launch

The learner holds the lock control for one deliberate confirmation. Announce:

> LAUNCH LOCKED · 119.52 mph · 17.85° · 7099 rpm

Voice:

> “These launch numbers will not move while you change the chamber.”

#### Step B — Change altitude

Predict denser/thinner/same, then move 0 → 1000 ft at 15°C.

Reveal:

> Altitude factor 1.000 → 0.970 · EST PROXY
>
> Engine Carry 172.40 → 172.40 yd
>
> Estimated Carry 172.40 → 176.02 yd

#### Step C — Change temperature

Reset altitude. Predict, then move 15 → 25°C.

Reveal:

> Temperature factor 1.000 → 0.96646 · EST PROXY
>
> Engine Carry 172.40 → 172.40 yd
>
> Estimated Carry 172.40 → 176.45 yd

Voice:

> “Warmer air lowered this proxy. Ball speed and launch stayed fixed.”

#### Step D — Combine them

Set 5000 ft and 25°C.

Reveal the multiplication:

> 0.850000 × 0.966460 = 0.821491 density proxy
>
> 1 + 0.70 × (1 − 0.821491) = 1.124956
>
> 172.4001 × 1.124956 = 193.9425 yd · EST AIR

Copy:

> Altitude and temperature combine before the estimate. Density is not a third
> bonus.

Completion requires each control changed separately before combination.

### S2 — Influence and same-shot proof

#### Stage 1 — One mediator

Show the two-input causal diagram. Tapping DensityProxy highlights both inputs,
not a third independent control.

#### Stage 2 — Relative influence

Show the six verified fixtures. Learner sorts them from highest to lowest
DensityProxy, then predicted Carry.

Correct extreme order:

> 0 ft/−5°C · densest → 0 ft/15°C → 0 ft/40°C → 8000 ft/15°C · thinnest

Copy:

> The ordering belongs to this proxy and these ranges. Actual weather also
> depends on atmospheric pressure and humidity.

#### Stage 3 — Same engine, two estimates

Save A at 0 ft/5°C and B at 5000 ft/25°C.

The solid engine trace remains visually identical. Dashed estimates separate.

Readout:

> ENGINE DIFFERENCE · 0.00 yd
>
> EST AIR DIFFERENCE · 25.88 yd

Voice:

> “Same engine shot. Different estimate. Do not move the cause back into the
> strike.”

#### Stage 4 — Drag and lift nuance

Copy:

> Thinner air reduces drag, which can help distance. It also reduces aerodynamic
> lift. The 0.70 multiplier compresses both effects into one heuristic.

The UI shows opposing DRAG and LIFT arrows merging into `0.70 EST`, not a full
force simulation.

#### Stage 5 — Omitted conditions

Reveal:

- pressure/weather variation · NOT MODELED;
- humidity · HELD;
- ball temperature/material response · NOT MODELED;
- wind · SEPARATE EXPERIENCE;
- slope/elevation to landing · NOT MODELED.

### S3 — Myths and boundary

#### Myth 1 — “Altitude makes Ball Speed higher”

> Not in this model. The same impact produces the same launch Ball Speed.

#### Myth 2 — “Warm air and a warm ball are the same effect”

> False. This numeric layer changes air temperature only. Ball material response
> is not modeled.

#### Myth 3 — “Thinner air means the same percentage more Carry”

> False. The 0.70 conversion is a heuristic that acknowledges competing drag
> and lift effects.

#### Myth 4 — “Altitude and Temperature add two separate bonuses”

> False. Their factors multiply into one density proxy before one estimate.

#### Myth 5 — “This is a course forecast”

> False. It omits actual pressure, humidity, wind, slope and full flight
> integration.

Boundary card:

> ENGINE · solid · unchanged
>
> AIR ESTIMATE · dashed · altitude + temperature proxy
>
> REAL WEATHER · pressure + humidity + wind + local variation · not solved

### S4 — Mastery Check

#### Task 1 — Layer

> When only Altitude changes, which engine value changes?

- Ball Speed;
- Backspin;
- Launch Angle;
- none of them; only the post-solve estimate changes. **correct**

#### Task 2 — Temperature

> At held pressure, warmer air generally has:

- a lower density ratio; **correct**
- a higher launch Ball Speed in this module;
- more Backspin rpm;
- no relation to density.

#### Task 3 — Composite

> Altitude, Temperature and DensityProxy are:

- three independent yard bonuses;
- two inputs feeding one mediator; **correct**
- three engine inputs;
- wind components.

#### Task 4 — Boundary

> What does the 0.70 constant represent?

- a universal atmosphere law;
- TrackMan's measured percentage for every club;
- Flightglass's post-solve estimate gain; **correct**
- humidity.

#### Task 5 — Live same-shot transfer, mandatory

Target:

> Hold the engine shot and create at least 25 yards of estimated-air separation.

Acceptance:

- state A: 0 ft and 4–6°C;
- state B: 4900–5100 ft and 24–26°C;
- engine Ball Speed difference 0.00 mph;
- engine Launch difference 0.00°;
- engine Backspin difference 0 rpm;
- engine Carry difference below 0.01 yd;
- Estimated Carry difference 25.0–26.8 yd;
- DensityProxy difference at least 0.20;
- learner opens the drag/lift nuance;
- learner selects: “The estimate changed after launch.”

Mastery requires 4/5 knowledge tasks and the live gate.

### S5 — Result

Title:

> Air layer understood

Summary:

> You combined altitude and temperature into one estimate without changing the
> strike that entered the air.

Evidence:

- `ENGINE` launch values unchanged;
- `EST PROXY` altitude and temperature combined;
- `LIVE` 25+ yd estimate separation;
- `BOUNDARY` pressure, humidity, wind and full aerodynamics not inferred.

Primary journey action:

> Continue to Wind

Secondary:

- Replay chamber;
- Review formula;
- Return to Academy.

Voice, once on new mastery:

> “Air layer confirmed. Next, separate wind's distance effect from its sideways
> drift.”

## 7. Information sheets

### 7.1 Altitude

- elevation input in feet;
- current linear factor;
- proxy versus real pressure/density;
- immutable impact outputs.

### 7.2 Temperature

- Celsius/Kelvin conversion;
- 15°C reference;
- air temperature versus ball temperature;
- held-pressure qualifier.

### 7.3 Density Proxy

- multiplicative structure;
- reference state;
- not kg/m³;
- no double count.

### 7.4 Air Multiplier

- exact current estimate formula;
- 0.70 heuristic;
- same scaling on estimated Carry and Apex;
- no Curve/Landing/Total adjustment.

### 7.5 Drag and lift

- both depend on density in real flight;
- opposing implications;
- no full numerical integration here.

### 7.6 Same shot

Show the two mandatory states and unchanged launch ledger.

### 7.7 Sources

- TrackMan normalization for wind, altitude and temperature:
  `https://support.trackmangolf.com/hc/en-us/articles/6976656064283-General-Normalization-Optimizer-Feature-in-TPS`
- TrackMan normalized Shot Analysis versus environmental Virtual Golf:
  `https://support.trackmangolf.com/hc/en-us/articles/36723121620891-TPS-Distance-Difference-in-Shot-Analysis-vs-Virtual-Golf`
- TrackMan Carry definition:
  `https://support.trackmangolf.com/hc/en-us/articles/39726543090971-Parameters-Carry-Tee-to-Green`
- TrackMan Height/Apex definition:
  `https://support.trackmangolf.com/hc/en-us/articles/39726869324699-Parameters-Height-Apex`
- NOAA U.S. Standard Atmosphere 1976, used only as real-atmosphere context:
  `https://www.ngdc.noaa.gov/stp/space-weather/online-publications/miscellaneous/us-standard-atmosphere-1976/us-standard-atmosphere_st76-1562_noaa.pdf`

## 8. Voice and synchronized UI

| Trigger | Voice line | Visual companion |
|---|---|---|
| S0 first visit | “The strike is sealed. Altitude and temperature change only the estimated air layer after launch.” | launch partition locks |
| Launch lock | “These launch numbers will not move while you change the chamber.” | immutable chips pin |
| Altitude | “Higher altitude lowered the proxy. The solid engine flight stayed fixed.” | altitude feeds gauge |
| Temperature | “Warmer air lowered this proxy. Ball speed and launch stayed fixed.” | temperature feeds same gauge |
| Combined | “Two inputs, one density proxy, one estimated layer.” | connectors merge |
| Same-shot success | “Same engine shot. Different estimate. Do not move the cause back into the strike.” | dashed traces split |
| Drag/lift | “Thinner air reduces drag and lift. This multiplier compresses both into an estimate.” | opposing arrows merge |
| Mastery | “Air layer confirmed. Next, separate wind's distance effect from its sideways drift.” | Wind route appears |

Shared voice suppression, caption, replay and persistence rules apply.

## 9. State, compatibility and rewards

```text
experienceId: air-density
ownedConceptIds: [altitude, temperature]
```

Migration:

- preserve both legacy concept records and all XP/history;
- either legacy route opens its owned sheet inside Air Density;
- one concept complete → prefill that definition only;
- both complete → `reviewEligible`; still require combined live gate;
- existing unlock remains available;
- one canonical mastery/reward;
- no Temperature-after-Wind legacy chain;
- migration idempotent;
- no stored environment value is allowed to overwrite the engine baseline.

## 10. Accessibility, motion and haptics

- Solid/dashed traces also carry ENGINE/EST text labels.
- Density gauge includes numeric value and denser/thinner language.
- Every formula has a spoken linear form and a table alternative.
- Altitude and temperature are announced with units and effect direction.
- State A/B summaries list unchanged engine fields before estimate fields.
- Dynamic announcements occur on control commit only.
- Reduced motion replaces chamber/trace animation with static compare states.
- Minimum targets 44×44 pt; focus order follows inputs → mediator → estimate.
- Voice is suppressed when a screen reader is active.
- Haptic: light on state save, success on valid same-shot pair; none on scrubbing.

## 11. Failure and edge states

### Baseline solver unavailable

Disable live estimate and mastery; preserve sheets/progress; never synthesize a
baseline.

### Invalid temperature

Reject non-finite values before Kelvin conversion. No NaN/Infinity readout.

### Proxy outside designed range

Controls prevent values outside 0–8000 ft and −5–40°C. Imported values are
clamped for preview but cannot earn mastery until deliberately reset in range.

### Estimate mistaken for engine output

Tests fail if the baseline object is mutated or if an EST value appears in an
ENGINE chip.

### Offline/no source access

The native lesson remains functional; source sheets show cached citations.
Internet is never required for mastery.

## 12. Verification contract

### 12.1 Numeric tests

At engine Carry 172.4000503 / Apex 33.0359896:

- 0 ft/15°C → proxy 1, multiplier 1, unchanged estimate;
- 1000 ft/15°C → .97, 1.021, Carry 176.02045;
- 0 ft/25°C → .96645984, 1.02347812, Carry 176.44768;
- 8000 ft/15°C → .76, 1.168, Carry 201.36326;
- 0 ft/−5°C → 1.07458512, .94779042, Carry 163.39912;
- 0 ft/40°C → .92016605, 1.05588376, Carry 182.03441;
- 0 ft/5°C → Carry 168.06138, Apex 32.20460;
- 5000 ft/25°C → Carry 193.94254, Apex 37.16405;
- paired estimated Carry difference 25.88116;
- every engine field byte/value-equivalent across air changes.

### 12.2 Native behavior tests

- launch lock precedes air controls;
- individual controls precede combination;
- state compare restores exactly;
- baseline reset exactly 0 ft/15°C;
- no wind/humidity control;
- no engine-chip mutation;
- voice/captions/replay/screen-reader behavior;
- reduced motion;
- app background/foreground;
- native-only, no web fallback.

### 12.3 Content-truth tests

Fail if copy:

- calls DensityProxy measured density;
- claims altitude changes Ball Speed or Backspin;
- numerically changes ball response with temperature;
- calls 0.70 universal physics;
- counts altitude, temperature and density as independent effects;
- says only drag changes;
- changes Curve/Offline/Landing/Total in this layer;
- includes wind or humidity in mastery;
- promises exact course yardage.

### 12.4 Acceptance evidence

Require zero critical defects, all category floors, all critical checks,
pairwise-blind win against the separate legacy lessons, exact fixtures,
accessibility evidence, migration evidence and unchanged protected-engine hash.
Scores remain derived indicators.

## 13. Implementation boundary

Implementation may build the combined native instrument and a post-solve
Academy estimate function outside the protected flight solver.

It may not:

- change `impact-flight.js`;
- insert environment into impact/launch outputs;
- add a hidden humidity factor;
- alter Curve, Offline, Landing or Total;
- present the estimate as normalized launch-monitor parity;
- split Altitude and Temperature back into separate reward modules;
- add network-dependent weather.

A physically integrated environment solver is a future calibration project and
must replace, not silently coexist with, this proxy after its own acceptance
package passes.
