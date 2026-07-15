# Flightglass Academy — Home, Store and Migration Design

**Status:** Normative shared-infrastructure specification

**Date:** 2026-07-15

**Scope:** native Academy Home, outcome-experience registry, route aliases,
journey selection, progress state, idempotent legacy migration, rewards, voice
event infrastructure and Backspin compatibility

**Required before:** every new experience implementation

**Does not authorize:** production physics changes, remote voice generation,
web-product work, reward-economy changes or implementing more than one
experience in a later batch

---

## 1. Product decision

Academy Home becomes an outcome-led coach, not a catalogue of 24 equally
important parameter articles.

The first fold answers three questions:

1. What am I learning to control?
2. What is the single best next action from my stored evidence?
3. What have I Practiced versus actually Mastered?

The full physics constellation remains available under **Explore the physics**.
It is secondary because the dependency map is useful for exploration but poor
as the default decision surface.

The migration is additive. Existing data under `strikearc.academy.v1` is never
discarded, recomputed downward or replaced with a new key. All current
Backspin behavior remains available while the shared infrastructure is
introduced.

---

## 2. Success criteria

The shared batch succeeds only when:

- the registry contains exactly 13 core experiences and one optional MODEL LAB;
- all 24 legacy IDs resolve to exactly one owner;
- Home displays one dominant Continue, Repair, Review or Start action;
- `Not started`, `Practiced` and `Mastered` are semantically distinct;
- preview is available without prerequisites while mastery entry enforces the
  pedagogical graph or a passed placement challenge;
- a migrated legacy completion becomes Practiced evidence, never invented live
  mastery;
- accepted existing Backspin mastery remains Mastered and is never relocked;
- repeated migration produces byte-equivalent semantic state and no XP/reward
  change;
- no legacy route, XP total, badge, attempt or timestamp disappears;
- 13 core experiences—not 24 concepts and not the optional lab—form the
  completion denominator;
- local voice cues obey once-per-signature, global mute, caption and failure-
  safe behavior;
- the existing Backspin native lesson passes its complete regression suite and
  visual gates after extraction;
- `impact-flight.js` and `swing-parameters-and-impact.js` remain byte-identical.

An attractive Home cannot compensate for state loss, a false mastery state or
a broken Backspin route.

---

## 3. Current-state findings

The current Academy has useful production behavior but combines too many jobs
inside `academy.html`:

- 24 long-form concept records and a legacy `LESSONS` registry;
- graph rendering and a hardcoded tier path;
- seed/load/save/migration logic;
- unlock and `next` rules;
- route parsing;
- XP, badge and lesson state;
- legacy article rendering;
- environment chain logic;
- the special Backspin native mount.

Current storage is version 1:

```text
strikearc.academy.v1
```

The current loader safely fills missing lesson records but drops unknown lesson
IDs because it rebuilds `lessons` only from the active `LESSON_IDS`. The new
loader must preserve all historical lesson keys, including future/unknown ones,
while normalizing the 24 known IDs.

Current path logic also contains two rules that cannot survive:

- one universal graph-derived unlock model;
- hardcoded `altitude → wind → temperature` progression.

The existing Backspin native module already provides proven S0–S5 behavior,
journey restoration, idempotent mastery submission and accessibility. The
shared batch adapts it; it does not visually rewrite it.

---

## 4. Module boundaries

The shared implementation creates small, pure modules and leaves rendering at
the edge.

### 4.1 `academy-curriculum.js`

Owns immutable curriculum facts:

- experience registry;
- concept-owner map;
- prerequisite graph;
- goal journeys;
- legacy route aliases;
- core/optional completion membership;
- learner-visible titles and family labels;
- renderer keys and specification versions.

It contains no DOM, localStorage, XP mutation or physics formula.

### 4.2 `academy-store.js`

Owns pure state construction and migration plus a thin storage adapter:

- seed state;
- normalize/migrate state;
- read/write with the unchanged key;
- experience-evidence updates;
- mastery/reward transactions;
- voice preferences/signatures;
- migration diagnostics.

All exported mutators return a new normalized state or a clearly documented
transaction result. DOM code must not mutate nested store objects directly.

### 4.3 `academy-router.js`

Owns parsing and alias resolution:

- Academy Home routes;
- canonical outcome-experience routes;
- all legacy concept routes;
- concept-sheet intent;
- malformed/unknown fallback;
- last-valid-surface restoration intent.

It does not choose the pedagogical next action.

### 4.4 `academy-journey-router.js`

Owns deterministic recommendation and mastery-entry decisions:

- `Continue` partial work;
- `Repair` missing mandatory transfer;
- `Review` migrated prior evidence;
- `Start` the next unmet experience in the active goal journey;
- placement challenge availability;
- all-mastered state.

It consumes registry + normalized state and returns data, never markup.

### 4.5 `academy-voice.js`

Owns semantic cue arbitration and local playback:

- cue manifests and stable signatures;
- once-per-content-version suppression;
- global enabled/muted preference;
- captions and Replay;
- no overlap and no stale queue;
- screen-reader suppression hook;
- missing/corrupt audio fallback;
- local voice-pack selection.

It receives already-approved text. It never invents or paraphrases physics at
runtime.

### 4.6 `academy-home.js`

Owns Home markup and interactions from a supplied view model:

- primary action;
- goal-family chooser;
- 13-experience progress;
- family rails;
- Explore the physics entry;
- migration explanation sheet;
- focus, reduced motion and safe-area behavior.

### 4.7 `academy-experience-host.js`

Owns renderer registration and lifecycle:

- map `rendererKey` to mount function;
- destroy the active experience before route change;
- pass normalized experience state and callbacks;
- normalize Back/Continue navigation through the journey router;
- fail visibly when a renderer is unavailable;
- prevent one renderer from hardcoding a universal next lesson.

The host is not a generic instrument renderer. Each experience retains its own
visual proof.

---

## 5. Canonical curriculum registry

The registry is ordered for display within families, not used as a hidden
linear unlock list.

```js
export const ACADEMY_EXPERIENCES = Object.freeze([
  {
    id: 'start-line',
    title: 'Start Line',
    familyId: 'direction',
    conceptIds: ['face-angle', 'club-path', 'start-direction'],
    prerequisiteExperienceIds: [],
    recommendedContextIds: [],
    core: true,
    rendererKey: 'start-line',
    contentVersion: 1
  },
  {
    id: 'shape',
    title: 'Shape',
    familyId: 'direction',
    conceptIds: ['spin-axis', 'curve'],
    prerequisiteExperienceIds: ['start-line'],
    recommendedContextIds: [],
    core: true,
    rendererKey: 'shape',
    contentVersion: 1
  },
  {
    id: 'shot-pattern',
    title: 'Carry Side',
    familyId: 'direction',
    conceptIds: ['offline'],
    prerequisiteExperienceIds: ['start-line', 'shape'],
    recommendedContextIds: [],
    core: true,
    rendererKey: 'shot-pattern',
    contentVersion: 1
  },
  {
    id: 'attack-at-impact',
    title: 'Up or Down at Impact',
    familyId: 'strike',
    conceptIds: ['attack-angle'],
    prerequisiteExperienceIds: [],
    recommendedContextIds: [],
    core: true,
    rendererKey: 'attack-at-impact',
    contentVersion: 1
  },
  {
    id: 'low-point',
    title: 'Low Point',
    familyId: 'strike',
    conceptIds: ['low-point'],
    prerequisiteExperienceIds: ['attack-at-impact'],
    recommendedContextIds: [],
    core: true,
    rendererKey: 'low-point',
    contentVersion: 1
  },
  {
    id: 'strike-depth',
    title: 'Contact Height',
    familyId: 'strike',
    conceptIds: ['strike-depth'],
    prerequisiteExperienceIds: ['low-point'],
    recommendedContextIds: [],
    core: true,
    rendererKey: 'strike-depth',
    contentVersion: 1
  },
  {
    id: 'delivered-loft-launch',
    title: 'Delivered Loft & Launch',
    familyId: 'flight',
    conceptIds: ['dynamic-loft', 'launch-angle'],
    prerequisiteExperienceIds: ['attack-at-impact'],
    recommendedContextIds: [],
    core: true,
    rendererKey: 'delivered-loft-launch',
    contentVersion: 1
  },
  {
    id: 'backspin',
    title: 'Backspin',
    familyId: 'flight',
    conceptIds: ['spin-loft', 'backspin'],
    prerequisiteExperienceIds: ['delivered-loft-launch', 'attack-at-impact'],
    recommendedContextIds: [],
    core: true,
    rendererKey: 'backspin-native',
    contentVersion: 2
  },
  {
    id: 'flight-height-descent',
    title: 'Flight Height & Descent',
    familyId: 'flight',
    conceptIds: ['apex', 'landing-angle'],
    prerequisiteExperienceIds: ['delivered-loft-launch', 'backspin'],
    recommendedContextIds: [],
    core: true,
    rendererKey: 'flight-height-descent',
    contentVersion: 1
  },
  {
    id: 'speed-transfer',
    title: 'Speed Transfer',
    familyId: 'distance',
    conceptIds: ['club-speed', 'smash', 'ball-speed'],
    prerequisiteExperienceIds: [],
    recommendedContextIds: [],
    core: true,
    rendererKey: 'speed-transfer',
    contentVersion: 1
  },
  {
    id: 'carry',
    title: 'Carry',
    familyId: 'distance',
    conceptIds: ['carry', 'total'],
    prerequisiteExperienceIds: ['speed-transfer'],
    recommendedContextIds: [],
    core: true,
    rendererKey: 'carry',
    contentVersion: 1
  },
  {
    id: 'air-density',
    title: 'Air Density',
    familyId: 'conditions',
    conceptIds: ['altitude', 'temperature'],
    prerequisiteExperienceIds: ['carry'],
    recommendedContextIds: [],
    core: true,
    rendererKey: 'air-density',
    contentVersion: 1
  },
  {
    id: 'wind',
    title: 'Wind',
    familyId: 'conditions',
    conceptIds: ['wind'],
    prerequisiteExperienceIds: ['carry', 'shot-pattern'],
    recommendedContextIds: [],
    core: true,
    rendererKey: 'wind',
    contentVersion: 1
  },
  {
    id: 'plane-coupling-lab',
    title: 'Plane Coupling',
    familyId: 'model-labs',
    conceptIds: ['plane-coupling'],
    prerequisiteExperienceIds: ['low-point', 'strike-depth'],
    recommendedContextIds: ['shape'],
    core: false,
    optional: true,
    rendererKey: 'plane-coupling-lab',
    contentVersion: 1
  }
]);
```

Registry validation is a startup/test concern. A bad registry must fail tests;
production Home should show a recoverable unavailable state rather than crash
the native shell.

Required validation:

- unique experience IDs;
- unique renderer keys unless explicitly aliased;
- exactly 13 `core: true`;
- exactly one optional lab;
- exactly 24 unique concept IDs;
- no unknown prerequisite or recommended-context ID;
- no self-dependency;
- acyclic prerequisite graph;
- every core experience reachable from at least one root;
- no optional experience is a prerequisite of a core experience;
- every content version is a positive integer.

---

## 6. Goal journeys

Goal journeys recommend order; they never rewrite prerequisites.

```js
export const ACADEMY_GOALS = Object.freeze([
  {
    id: 'direction-control',
    title: 'Control direction',
    experienceIds: ['start-line', 'shape', 'shot-pattern', 'wind']
  },
  {
    id: 'strike-contact',
    title: 'Understand contact',
    experienceIds: ['attack-at-impact', 'low-point', 'strike-depth']
  },
  {
    id: 'launch-flight',
    title: 'Control launch and flight',
    experienceIds: [
      'attack-at-impact',
      'delivered-loft-launch',
      'backspin',
      'flight-height-descent'
    ]
  },
  {
    id: 'distance',
    title: 'Understand distance',
    experienceIds: ['speed-transfer', 'carry', 'air-density', 'wind']
  }
]);
```

Wind may appear in two goals because recommendation is not ownership. If Wind's
mastery prerequisites are missing, the action points to the earliest missing
prerequisite while the Wind preview remains available.

The initial goal is not forced. A fresh user sees three root choices with a
single recommended starter based on available app evidence. Choosing a goal is
reversible and does not alter progress.

---

## 7. Store schema

The top-level version remains `1`. Additive objects are normalized on read.

```js
{
  version: 1,
  xp: 0,
  lessons: {
    // every legacy record preserved, including unknown future keys
  },
  unlocked: [],
  badges: [],
  lastOpened: null,

  academySchemaVersion: 1,
  experiences: {
    'start-line': {
      schemaVersion: 1,
      contentVersion: 1,
      status: 'not-started',
      surface: 0,
      unlockedSurfaces: [0],
      startedAt: null,
      lastVisitedAt: null,
      masteredAt: null,
      reviewEligible: false,
      placementPassed: false,
      legacyEvidence: [],
      evidence: {
        surfacesSeen: [],
        instrumentTouched: false,
        mythsResolved: [],
        knowledgeBestCorrect: 0,
        knowledgeTotal: 5,
        liveTransferPassed: false,
        liveTransferEvidence: null
      },
      activeAttempt: null,
      acceptedAttemptId: null
    }
  },
  rewardLedger: {},
  academyHome: {
    goalId: null,
    exploreExpanded: false,
    lastExperienceId: null
  },
  academyVoice: {
    enabled: true,
    captionsEnabled: true,
    packId: 'control-room-en-us-v1',
    playedSignatures: {},
    updatedAt: null
  },
  migration: {
    academyOutcomeV1Applied: false,
    appliedAt: null,
    diagnostics: []
  }
}
```

`status` is derived and normalized:

- `mastered` when an accepted attempt satisfies both knowledge and mandatory
  live evidence, or accepted existing Backspin mastery is grandfathered;
- `practiced` when any meaningful surface/instrument/legacy evidence exists;
- `not-started` otherwise.

Do not let arbitrary stored `status: 'mastered'` bypass evidence validation.
Grandfathered Backspin is represented by explicit migration evidence.

---

## 8. Legacy preservation and migration

### 8.1 Non-destructive load

The normalizer begins with the parsed object and preserves unknown top-level and
`lessons` keys. Known fields receive defaults and type guards. Invalid JSON
returns a fresh seed plus a recoverable diagnostic; it cannot silently overwrite
the corrupt source until the user creates a new state-changing event.

### 8.2 Concept evidence conversion

For each owner experience:

- each known legacy `completed` or `mastered` record adds its ID to
  `legacyEvidence`;
- any legacy evidence makes the experience `practiced`;
- all owned concepts complete makes `reviewEligible: true`;
- `reviewEligible` offers a shortened review but never sets
  `liveTransferPassed`;
- legacy `read`, `diagramTouched` or quiz attempts without completion still
  count as Practiced evidence but not full review eligibility;
- no existing lesson object is rewritten to mirror the experience state.

### 8.3 Backspin grandfathering

Backspin becomes Mastered when the existing accepted native evidence proves its
gate, including any current legitimate `lessons.backspin.mastered` state and
accepted journey/mastery result.

Migration writes:

```js
evidence.liveTransferPassed = true;
evidence.liveTransferEvidence = {
  kind: 'grandfathered-backspin-v1',
  source: 'lessons.backspin',
  migratedAt: '<timestamp>'
};
acceptedAttemptId = 'legacy:backspin:native-v1';
```

It also seeds a zero-value ledger guard:

```js
rewardLedger['legacy:backspin:native-v1'] = {
  experienceId: 'backspin',
  xpAwarded: 0,
  reason: 'historical reward already reflected in store.xp'
};
```

This prevents a second experience reward without subtracting or reconstructing
historical XP.

### 8.4 Optional Plane Coupling

Legacy `plane-coupling` completion becomes `practiced`/`explored` evidence.
It cannot become core mastery, increment the 13 denominator or write a reward.

### 8.5 Idempotence

Running migration twice must preserve:

- exact XP;
- exact legacy lesson data and unknown keys;
- badges/unlocks;
- mastered timestamps;
- accepted attempt IDs;
- reward-ledger cardinality;
- semantic experience evidence;
- goal and voice preferences.

`appliedAt` is written only on first successful migration. Re-normalization does
not update timestamps merely because the app opened.

### 8.6 Required golden profiles

1. Fresh profile.
2. Invalid/corrupt JSON.
3. One partially read legacy concept.
4. One completed constituent of a merged experience.
5. Every constituent complete but no new transfer.
6. Accepted native Backspin mastered.
7. Backspin completed but not legitimately mastered.
8. High-XP profile with all 24 legacy lessons complete.
9. Unknown future lesson and top-level fields.
10. Partially completed new outcome experience.
11. Already migrated state normalized again.
12. Reward ledger containing an accepted attempt.

---

## 9. Mastery and reward transaction

Experience modules submit one immutable attempt:

```js
{
  attemptId: 'uuid-or-stable-random-id',
  experienceId: 'start-line',
  contentVersion: 1,
  knowledgeCorrect: 4,
  knowledgeTotal: 5,
  liveTransferPassed: true,
  liveTransferEvidence: {
    fixtureIds: ['capture-a', 'capture-b'],
    rawStates: [{}, {}],
    evaluatedAt: 0
  }
}
```

Acceptance requires:

```text
knowledgeCorrect / knowledgeTotal ≥ 0.8
AND liveTransferPassed = true
AND contentVersion = current registry version
AND attemptId has not been accepted before
```

The store, not the renderer, decides acceptance and reward. A renderer receives:

```js
{
  accepted: true | false,
  duplicate: true | false,
  reason: 'accepted' | 'knowledge-gate' | 'live-gate' |
          'stale-content' | 'duplicate' | 'invalid',
  xpAwarded: number,
  experience: normalizedExperienceState
}
```

Reward amount remains the current Academy product decision until a separate
economy audit changes it. The shared implementation must expose a registry
field/constant but cannot silently rebalance XP.

Transactions are synchronous in memory and call `saveNow()` before showing an
earned result. A background/termination event cannot display Mastered before
persistence.

---

## 10. Route contract

### 10.1 Canonical routes

```text
#/academy                         → Academy Home
#/path                            → Academy Home alias
#/experience/<experience-id>      → last valid surface or S0
#/experience/<id>/surface/<0..5>  → requested valid surface
#/explore                         → physics constellation
```

### 10.2 Legacy aliases

```text
#/lesson/<legacy-concept-id>
```

resolves to its owner experience with a `conceptId` intent. Examples:

```text
#/lesson/face-angle    → Start Line + Face Angle sheet
#/lesson/club-path     → Start Line + Club Path sheet
#/lesson/spin-loft     → Backspin + Spin Loft sheet
#/lesson/total         → Carry + Illustrative Total sheet
#/lesson/temperature   → Air Density + Temperature sheet
#/lesson/offline       → Carry Side overview/sheet
#/lesson/backspin      → Backspin last valid surface
```

Unknown routes return Home with a non-blocking announcement. They do not seed a
fake experience or discard the bad hash before diagnostics can record it.

### 10.3 Preview versus mastery entry

Opening an experience is always allowed. If prerequisites are absent:

- S0–S3 preview remains usable;
- owned concept sheets remain available;
- S4 shows the exact missing prerequisite list and a `Preview placement
  challenge` action when applicable;
- the learner can return without state loss;
- existing mastered users never see a relock.

---

## 11. Recommendation algorithm

`selectAcademyAction(state, registry, now)` returns one action object:

```js
{
  kind: 'continue' | 'repair' | 'review' | 'start' | 'explore',
  experienceId: 'shape',
  label: 'Continue Shape',
  reason: 'Live transfer not yet passed',
  route: '#/experience/shape/surface/4'
}
```

Priority order:

1. a valid partial experience visited most recently within the active journey;
2. a knowledge-passed experience missing only its mandatory live transfer;
3. a `reviewEligible` experience whose prerequisites/placement permit S4;
4. the first unmet experience in the selected goal journey whose prerequisites
   are mastered;
5. the earliest unmet prerequisite needed by the selected goal;
6. a root experience selected from app evidence;
7. Explore when all 13 core experiences are mastered.

Tie-breaking is deterministic:

1. active goal order;
2. most recent valid visit for Continue/Repair;
3. registry display order;
4. lexical ID only as a final invariant fallback.

Reasons may use only stored evidence. Prohibited reasons include inferred swing
faults, claimed skill level or invented performance diagnosis.

---

## 12. Academy Home information architecture

### 12.1 First fold

Header:

```text
FLIGHTGLASS ACADEMY
Learn the shot by outcome
```

Intro:

```text
Choose what you want to control. Each experience connects the important inputs
to one visible ball-flight or contact outcome.
```

Primary coach card:

```text
CONTINUE / REPAIR / REVIEW / START
<Experience title>
<Evidence-based reason>
[Primary action]
```

Examples:

- `Continue Low Point · Surface 3 of 6`;
- `Repair Backspin · Live transfer not yet passed`;
- `Review Speed Transfer · Three earlier concepts already completed`;
- `Start Start Line · First step in Control direction`.

No carousel. One dominant action is visible without horizontal swiping.

### 12.2 Goal chooser

Below the primary card:

```text
YOUR GOAL
Control direction
Understand contact
Control launch and flight
Understand distance
```

The active goal is a single-select radio/segmented group with accessible text.
Changing it updates the recommendation explanation but not progress.

### 12.3 Progress

```text
ACADEMY MASTERY
3 of 13 Mastered
5 Practiced
```

Do not count an endowed/fake lesson as mastered. Prior app familiarity may be a
separate `Flightglass used before` note but never changes the denominator or
progressbar value.

Progress semantics:

- `aria-valuemin="0"`;
- `aria-valuemax="13"`;
- `aria-valuenow` equals truly Mastered core experiences;
- `aria-valuetext` separately names Mastered and Practiced counts.

### 12.4 Family rails

Each family is a vertical section, not an equal node maze:

- Start line & shape;
- Strike & contact;
- Launch, spin & descent;
- Speed & distance;
- Playing conditions.

Experience cards show:

- title;
- one learner question;
- `Not started`, `Practiced` or `Mastered` text and icon;
- prerequisite note only when mastery is gated;
- `Preview`, `Continue`, `Review` or `Open` action;
- no XP number as the dominant affordance.

The optional MODEL LAB appears after core families under **Advanced model labs**
with `Optional · Does not affect Academy mastery`.

### 12.5 Explore the physics

Secondary action:

```text
Explore the physics
See how the 24 measurements and model quantities connect.
```

The constellation distinguishes three edge types and never derives one from
another:

- physical/model dependency;
- learning prerequisite;
- recommended goal journey.

Default view shows physical/model dependencies. A labelled filter changes edge
type. Legacy concepts open information sheets inside their owner experience;
they do not masquerade as separate mastery modules.

---

## 13. Home visual direction

Use Flightglass's existing dark instrument language and typography. Do not
create a generic dashboard, course-card marketplace or gamified map.

Differentiation anchor: **the outcome horizon**.

- The coach card contains one restrained horizon/range line.
- The selected family's outcomes sit as small calibrated marks on that line.
- The recommended outcome receives one Ember trace pulse on first reveal.
- Other families remain quiet labels, not colorful badges.
- Reduced motion shows the final Ember mark immediately.

Hierarchy:

1. primary coach action;
2. outcome/goal choice;
3. mastery evidence;
4. family browse;
5. Explore physics;
6. XP/badges in a secondary progress sheet.

Do not put a large 24-node constellation above the recommendation. Do not show
more than one pulsing target. Do not use decorative golf-course imagery.

---

## 14. Voice event contract

### 14.1 First voice pack

Target character: calm American female laboratory/control-room voice, concise
and technically confident. It is not theatrical, motivationally needy or a
screen reader.

The first pack is local and versioned:

```text
assets/audio/academy/control-room-en-us-v1/
```

No runtime network, API token or generative call is permitted. Audio production
may happen separately; the product logic uses semantic cues and works caption-
only when assets are absent.

### 14.2 Cue identity

```js
{
  cueId: 'academy.home.recommendation.first',
  contentVersion: 1,
  packId: 'control-room-en-us-v1',
  text: 'Start with the outcome you want to control. Your next experiment is ready.',
  visualTarget: 'home-primary-action',
  job: 'orient',
  auto: true
}
```

Signature:

```text
<packId>:<cueId>:<contentVersion>
```

Changing a route, revisiting unchanged content or focusing controls does not
create a new signature.

### 14.3 Arbitration

- one automatic cue at a time;
- no stale queue after route/control changes;
- never interrupt VoiceOver/screen-reader speech;
- automatic entry cue at most once per signature;
- consequence cue only on first meaningful proof state;
- repeated failure may offer a visible `Hear a hint` rather than auto-speaking;
- Replay is user-triggered and does not change played history;
- global mute stops current audio immediately and persists;
- backgrounding pauses/stops; foregrounding never resumes stale narration;
- missing asset returns `{played:false, reason:'asset-unavailable'}` while caption
  and content remain intact.

### 14.4 Home cues

Home has at most three authored signatures:

| Cue | Trigger | Text | Synchronized target |
|---|---|---|---|
| Orient | first migrated/new Home visit | “Choose the outcome you want to control. Flightglass will connect the important inputs and remember the evidence you earn.” | outcome horizon and goal chooser settle |
| Recommend | first new recommendation signature | “Your next experiment is <title>. <short stored-evidence reason>.” | one primary coach card outline |
| Mastery return | first return after new mastery | “That evidence is saved. Your next recommendation now follows from the outcome you just mastered.” | completed state resolves, next action appears |

The dynamic recommendation line uses approved title + approved reason fragments,
not free-form language generation. Every possible fragment has a content-truth
test and visible caption.

---

## 15. Accessibility and native behavior

- Native Capacitor package only; no separate web product work.
- Target viewports: 430×932 and 375×812 with safe areas.
- Every action target at least 44×44 CSS pixels.
- Primary action appears before browse sections in DOM and visual order.
- Goal chooser uses native radio semantics or equivalent fully labelled group.
- Family headings create a valid heading outline.
- Status always has text and icon, never color alone.
- Explore graph has an equivalent list/relationship sheet; canvas/SVG is not
  the only source of truth.
- Focus moves to the route heading after user navigation, not first paint.
- Closing any sheet restores focus to its opener.
- 200% text keeps recommendation title, reason and primary action available.
- Reduced motion removes trace/pulse motion and preserves final evidence.
- Voice captions are visible, dismissible from reading flow only when replay
  remains reachable, and never placed in the assertive live region.
- Offline, failed audio or denied autoplay does not change Academy navigation.

---

## 16. Failure and recovery states

### Invalid storage

Show Home with fresh in-memory progress and a non-blocking sheet:

```text
Academy progress could not be read on this device. Nothing has been overwritten.
Start a new Academy session or retry after reopening the app.
```

Do not auto-save the seed over corrupt JSON.

### Storage write failure

Keep the current surface usable and show:

```text
Progress is not saved yet. Keep the app open and try again.
```

Never show an earned Mastered result until `saveNow` succeeds.

### Missing renderer

Preview card remains available. Opening shows:

```text
This experience is planned but not installed in this build.
```

No fake mastery, crash or route loop.

### Missing voice asset

Show caption and Replay disabled with `Audio unavailable`. Do not fall back to
uncontrolled browser/system speech that changes voice or pronunciation.

### Stale content version

Preserve prior mastery. Mark review evidence as stale only when a later content
migration explicitly requires it; never relock by default.

### Unknown legacy concept

Return Home, retain the route in diagnostics and announce `Academy topic not
found`. Do not create an owner dynamically.

---

## 17. Testing contract

### 17.1 Registry tests

- exact 14 experiences / 13 core;
- exact 24 concept IDs;
- exact ownership map;
- exact prerequisite graph;
- graph acyclic/reachable;
- optional lab never gates core;
- goals reference known experiences;
- no renderer/title/content-version omissions.

### 17.2 Migration tests

Run all 12 golden profiles from Section 8.6 and assert:

- legacy object preservation;
- unknown key preservation;
- exact XP/badges/unlocks/timestamps;
- Practiced versus Mastered conversion;
- Backspin grandfathering;
- reward guard;
- idempotent second pass;
- no write on parse failure.

### 17.3 Reward tests

- 3/5 + live fails knowledge gate;
- 4/5 without live fails live gate;
- 4/5 + live passes;
- 5/5 + live passes;
- duplicate attempt awards zero;
- different attempt after mastery awards zero;
- stale content version fails safely;
- optional lab cannot submit reward;
- save failure prevents accepted UI result;
- high-XP and fresh profiles retain reachable ranks.

### 17.4 Router/journey tests

- canonical routes;
- all 24 legacy aliases;
- malformed fallback;
- partial-surface restore;
- preview without prerequisites;
- S4 mastery gate;
- placement bypass;
- recommendation priority and deterministic ties;
- no hardcoded old environment chain;
- all-mastered Explore action.

### 17.5 Voice tests

- once per signature;
- new content version plays once;
- Replay does not mutate automatic history;
- mute persists;
- no overlap/stale queue;
- screen-reader suppression;
- background/foreground cancellation;
- missing asset caption fallback;
- approved dynamic reason fragments only;
- Home cue count at most three, experience cue budget at most eight.

### 17.6 Browser/native tests

- Home at 430×932 and 375×812;
- fresh, migrated, partial, all-mastered and invalid-store states;
- normal/reduced motion;
- 200% text;
- keyboard-only goal change and route entry;
- VoiceOver/manual semantic pass on physical iPhone;
- sheet focus return;
- Backspin old and canonical routes;
- Backspin S0–S5 restoration and mastery;
- packaged `www/` parity after `npm run copy-web`.

---

## 18. Acceptance evidence and stop conditions

The shared batch is accepted only with:

1. zero critical state, migration, reward, runtime, accessibility or content
   defects;
2. all pure registry/store/router/voice tests passing;
3. all current Backspin Academy tests passing;
4. fresh screenshots of Home states at both target viewports, normal and
   reduced motion;
5. keyboard and screen-reader evidence;
6. idempotent golden migration output;
7. `npm run copy-web` parity and native packaged smoke test;
8. byte identity for both protected physics files;
9. pairwise-blind preference against the current path Home;
10. committed STATUS/HANDOFF evidence paths.

Stop the rollout before Start Line if any of these occur:

- legacy state or XP cannot be preserved;
- Backspin regression fails;
- Home can display false Mastered state;
- duplicate reward remains possible;
- a renderer owns global next/prerequisite logic;
- voice blocks or competes with assistive speech;
- protected physics changes;
- a production implementation batch begins to include a second experience.

---

## 19. Implementation boundary

The shared batch may create the modules in Section 4, extract store/router/Home
logic from `academy.html`, adapt Backspin mounting and add tests/CSS. It must not:

- implement Start Line or any other new experience;
- redesign the accepted Backspin instrument;
- delete legacy article content;
- remove legacy lesson records or routes;
- change physics equations;
- add remote services, accounts, analytics or cloud voice;
- alter reward amounts/rank thresholds without a separate economy decision;
- add a web product or server architecture.

Once this batch independently passes, later plans may implement exactly one
experience each against the stable registry/store/host interfaces.
