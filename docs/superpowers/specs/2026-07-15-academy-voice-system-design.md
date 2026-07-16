# Flightglass Academy — Voice System Design

**Status:** Normative shared-system specification

**Date:** 2026-07-15

**Scope:** native Academy voice character, consent, semantic cue manifests,
local playback, captions, Replay, Voice Off, screen synchronization,
repetition suppression, accessibility, offline behavior and future voice packs

**Implementation placement:** mandatory companion inside Academy Batch 0; every
later experience supplies authored cues to this shared system

**Does not authorize:** runtime text generation, cloud playback, microphone or
speech recognition, a separate web product, changed mastery behavior or voice
as a substitute for visible/accessible content

---

## 1. Product decision

Academy voice is a concise **laboratory guide**, not an audiobook, chatbot,
coach persona or screen reader.

Its job is to make the interactive instrument easier to enter:

1. name the new question;
2. direct attention to one important control, relation or outcome;
3. occasionally state what a genuinely new observation proved;
4. offer recovery help without nagging.

It does not read the page aloud. Every essential fact, instruction, value and
mastery condition remains visible and represented in the accessible DOM.

The first voice pack is pre-authored, prerecorded, bundled with the native app
and available offline. No runtime API, token, synthesis request or network
connection is required.

The system is deliberately quiet. Once Voice has been chosen, a new surface
may speak one entry cue once. An unchanged revisit, backward navigation,
restored session or repeated slider state remains silent. Replay is always the
learner's choice.

---

## 2. Why this can succeed — and how it can fail

Voice can make Flightglass feel like a coherent instrument rather than a set of
screens. It can also become the fastest way to make Academy annoying.

The concept succeeds when:

- the learner understands where to look before touching a control;
- the cue makes the changing screen easier to read instead of competing with
  it;
- silence is the normal state after the first useful orientation;
- Voice Off is immediate, global and remembered;
- Replay gives control back to the learner;
- captions make every cue inspectable without audio;
- voice failure never changes progress, truth or navigation.

It fails when:

- every route change speaks regardless of whether content is new;
- the voice praises routine actions or narrates slider scrubbing;
- spoken text duplicates a paragraph already visible;
- a stale cue continues after the learner has moved on;
- the voice sounds like a movie parody, wellness coach or synthetic assistant;
- screen highlights animate independently of the words;
- a missing file blocks the Academy surface;
- a learner must listen to pass mastery.

No engagement metric may justify breaking these boundaries.

---

## 3. Voice identity: Control Room

### 3.1 Character

Internal character name: **Control Room**.

The target is an adult American female laboratory/control-room voice with the
assurance of a modern aerospace or research facility announcement:

- calm, precise and observant;
- technically confident without sounding superior;
- warm enough to feel human, never intimate or chatty;
- restrained under success and neutral under failure;
- clear at low phone volume;
- recognizable without performing science-fiction theatre.

The voice never imitates a named actor or a protected film character. “American
movie laboratory over the loudspeaker” is a direction for clarity and
atmosphere, not an instruction to copy a specific performance.

### 3.2 Performance direction

| Dimension | Required direction | Reject |
|---|---|---|
| Dialect | General American, internationally intelligible | strong regional caricature |
| Pace | normally 145–165 words per minute | rushed disclaimer delivery or slow meditation cadence |
| Pitch | grounded middle register | breathy intimacy, exaggerated low authority or bright assistant chirp |
| Rhythm | one deliberate emphasis on the learner's current object | equal emphasis on every noun |
| Emotion | composed curiosity; quiet certainty after evidence | hype, celebration shouting or disappointment |
| Pauses | short pause between question and consequence | dramatic trailer pauses |
| Numbers | measured and unambiguous | compressed strings of values |
| Technical terms | natural, prepared pronunciation | spelling uncertainty or robotic segmentation |

### 3.3 Signature without fatigue

The “lab speaker” association comes from performance and concise writing, not
heavy audio effects.

Required processing:

- dry, close and intelligible recording;
- light compression only for stable phone playback;
- no audible reverb, room echo, radio crackle or permanent loudspeaker filter;
- no chime before every cue;
- no background music under instructional speech;
- no stereo movement or spatial trick that competes with the instrument.

A literal PA effect would be memorable for the first minute and tiring by the
tenth lesson. The restraint is intentional.

### 3.4 Pronunciation ledger

The pack owns one reviewed pronunciation ledger. At minimum:

| Term | Direction |
|---|---|
| Face Angle | stress `Face`; do not merge into one phrase |
| Club Path | short, distinct `Path` |
| Face-to-Path | `face to path`, not `face two path` |
| Dynamic Loft | equal clarity on both words |
| Spin Loft | do not pronounce as `spin loss` |
| Launch Direction | stress the outcome, `Direction` |
| Backspin | one word |
| Apex | standard American `AY-pex` |
| rpm | say `R P M`, unless a reviewed cue explicitly says revolutions per minute |
| mph | say miles per hour in authored audio |
| signed degree | say `minus two degrees` / `plus one degree`; never `negative` unless teaching the sign |

The text manifest remains the caption source of truth even when recorded speech
expands an abbreviation for natural delivery.

---

## 4. First-use consent and global modes

Surprise autoplay is not acceptable in a native app used at a range, in public
or with other audio playing.

The first Academy visit with an unset preference shows a compact, non-modal
choice before any automatic cue:

```text
VOICE GUIDE

Flightglass can briefly guide each new Academy screen.

Voice + captions
Captions only
Off
```

No option is preselected. The Academy remains usable before and after the
choice. Choosing Voice may immediately play the current surface's entry cue;
choosing either other mode does not.

### 4.1 Modes

| Mode | Automatic audio | Captions | Replay audio | Visible content |
|---|---:|---:|---:|---:|
| `unset` | no | choice prompt only | no | complete |
| `voice` | eligible cues only | yes | yes | complete |
| `captions` | no | eligible cues once | disabled with `Captions only` label | complete |
| `off` | no | no automatic cue strip | disabled until mode changes | complete |

Captions are mandatory whenever voice audio plays. Version 1 does not offer
audio-without-captions because that creates another state to test while making
the product less inspectable.

### 4.2 Voice control

The Academy header exposes a labelled control showing one of:

- `Voice on`;
- `Captions only`;
- `Voice off`.

It opens a one-level settings sheet with the three modes and a short sample.
The state is never communicated by an icon alone.

Changing to Captions or Off:

- stops current audio within 150 ms;
- clears pending visual beats;
- never changes the current instrument, route or progress;
- persists immediately in the existing Academy store;
- never resumes the interrupted line automatically when Voice is turned on
  again. Replay remains available when the cue strip is still present.

---

## 5. When she speaks

### 5.1 Cue jobs

Every authored cue has exactly one job:

| Job | Trigger | Purpose | Automatic in v1 |
|---|---|---|---:|
| `orient` | first eligible entry to a new surface signature | name the question or distinction | yes |
| `cue` | first eligible entry where one action needs attention | point to one control/comparison | yes |
| `consequence` | first newly demonstrated proof or mastery event | state what the observed change proved | rare, yes |
| `recovery` | repeated failed attempt or extended uncertainty | offer one actionable hint | no; show `Hear a hint` |

An experience has no more than six possible surface-entry cues and no more than
two authored event cues. The total hard limit remains eight cue signatures per
experience.

### 5.2 Eligible automatic entry

An entry cue may play only when all are true:

1. mode is `voice`;
2. the semantic surface is fully mounted;
3. the cue signature has not been seen automatically;
4. the route epoch still matches the cue request;
5. no other cue is playing;
6. the app is foregrounded and has audio focus;
7. screen-reader-active state is not `true`;
8. the learner has not already begun manipulating the instrument;
9. the asset exists and can start locally.

Caption-only mode uses the same eligibility and repetition ledger but shows the
caption without starting audio.

### 5.3 Consequence cues

A consequence cue is allowed only for genuinely new evidence, for example:

- the first time Start Line reaches the guided +1.0° gate;
- the first time the learner proves the loft-dependent split;
- the first time a mandatory live-transfer task passes;
- a new Home recommendation after saved mastery changes the journey.

It does not fire for:

- every slider threshold crossing;
- returning to a previously earned Result;
- changing tabs;
- opening and closing information sheets;
- repeated correct quiz answers;
- a value that merely rounds differently on screen.

If another cue ended less than five seconds earlier, the consequence appears
as visual/caption evidence only. It is not queued for later speech.

### 5.4 Recovery

Recovery is learner-triggered in version 1. After two failed attempts or a
surface-defined inactivity threshold, the UI may reveal:

```text
Hear a hint
```

The hint speaks only after activation. It never auto-plays because an inactive
learner may be reading, thinking or discussing the screen with someone else.

### 5.5 Surfaces that stay silent

- information sheets on open;
- ordinary backward navigation;
- unchanged Home revisits;
- restored sessions on the same surface;
- focus movement;
- slider scrubbing and stepper repeats;
- loading, saving and reward counting;
- failure banners already announced by native accessibility semantics.

---

## 6. Word count and writing contract

### 6.1 Hard limits

- 12–24 written words per cue;
- normally 3–8 seconds recorded duration;
- one sentence preferred, two short sentences permitted;
- one primary idea;
- no more than one new technical term unless the screen defines both;
- no more than one spoken number group unless the fixed comparison requires it;
- no cue invented at runtime.

The existing 99 experience cues already pass the 12–24-word audit. Home owns
three additional shared cues outside the per-experience count.

### 6.2 Voice is not read-aloud

The cue may overlap a visible phrase when that phrase is the truth being
emphasized, but it must not recite the visible paragraph.

Good:

> Move the face to plus two. Watch the launch ray settle between face and path.

Poor:

> Launch Direction is the horizontal angle the ball starts from the target
> line. It does not include curve.

The first directs attention. The second merely reads Mission copy.

### 6.3 Language rules

- use plain verbs: `move`, `hold`, `compare`, `predict`, `restore`, `notice`;
- name the visible object exactly as the UI names it;
- state MODEL boundaries directly;
- prefer `this model` over universal golf claims;
- never say `I`, `we`, `great job`, `awesome`, `easy` or `you failed`;
- never prescribe swing technique unless a later authorized coaching product
  owns that job;
- never promise distance, stopping or contact quality from a model that does
  not calculate it;
- never turn model coefficients into percentages of real-world causality.

### 6.4 Dynamic language

Prerecorded experience cues contain no runtime values that may vary. Fixed
fixture values are allowed when the cue belongs to that exact authored state.

Home recommendation speech uses one invariant approved cue and never speaks a
dynamic title/reason. The cue directs attention to the coach card; the visible
card owns the exact experience title and stored-evidence explanation. It does
not splice words or synthesize free-form language at runtime.

---

## 7. Semantic cue manifest

Voice is driven by semantic manifests, never DOM order or improvised selectors.

```js
{
  cueId: 'start-line.s1.entry',
  contentVersion: 1,
  packId: 'control-room-en-us-v1',
  locale: 'en-US',
  job: 'cue',
  trigger: { type: 'surface-entry', surface: 's1' },
  text: 'Move the face to plus two. Watch the launch ray settle between face and path.',
  asset: 'assets/audio/academy/control-room-en-us-v1/start-line/s1-entry.m4a',
  autoplay: true,
  beats: [
    { atMs: 0, targetId: 'face-control', emphasis: 'outline' },
    { atMs: 1450, targetId: 'launch-ray', emphasis: 'trace' }
  ],
  interruptOn: ['route', 'foreground-loss', 'model-input'],
  caption: { persist: 'until-deliberate-action' }
}
```

Required fields:

- stable cue ID;
- integer content version;
- locale and pack ID;
- one allowed job;
- one allowed trigger;
- exact caption text;
- local relative asset path when audio exists;
- autoplay boolean;
- one to three semantic visual beats;
- interruption policy;
- caption persistence.

Forbidden fields:

- remote URL;
- arbitrary CSS selector;
- runtime prompt;
- provider/model identifier;
- mastery mutation;
- function that generates prose;
- callback that changes physics input.

Signature:

```text
<packId>:<locale>:<cueId>:<contentVersion>
```

Visual styling changes do not increment `contentVersion`. Change it only when
the spoken/captioned meaning, eligibility or synchronized target changes
materially.

---

## 8. Playback and interruption state machine

```text
idle
  → eligible
  → caption-visible
  → starting
  → playing
  → completed

eligible → suppressed
starting/playing → interrupted
starting → asset-unavailable
```

There is no automatic playback queue.

### 8.1 Arbitration rules

1. user-triggered Stop/Voice Off wins immediately;
2. route change invalidates every request from the previous route epoch;
3. a new automatic cue never interrupts a playing cue;
4. a new automatic cue rejected for overlap is discarded, not queued;
5. touching an active model control stops speech within 150 ms and leaves the
   caption available;
6. backgrounding or losing audio focus stops speech and clears visual beats;
7. foregrounding never resumes stale narration;
8. Replay first stops the current instance, rewinds and starts the same cue;
9. Replay never changes automatic history;
10. playback errors never retry in a loop.

### 8.2 Seen versus heard

The automatic repetition ledger records `seen` when the eligible caption is
presented, not only when audio completes. This prevents a denied or missing
asset from trying to interrupt the learner on every revisit.

Diagnostic state may separately record `played`, `completed`, `interrupted` or
`asset-unavailable`. These diagnostics never affect mastery.

### 8.3 Audio overlap

At most one `HTMLAudioElement`/native audio instance exists per Academy host.
Creating a new instance destroys the prior one. Two voices can never overlap,
including after rapid Replay taps.

---

## 9. Synchronized screen behavior

Voice and screen form one semantic cue. Audio never runs as an unrelated layer.

### 9.1 Beat contract

- one to three beats per cue;
- one emphasized semantic target at a time;
- beats use authored millisecond offsets from the final audio file;
- target IDs are registered by the surface renderer;
- an emphasis may be `outline`, `connector`, `trace` or `static-label`;
- emphasis never changes a model input, truth value, focus or mastery state;
- the screen remains fully operable while audio plays.

### 9.2 Visual restraint

Allowed:

- outline the active Face control;
- illuminate one contribution connector;
- emphasize the authoritative Launch ray;
- resolve one static relationship label.

Rejected:

- dimming the entire screen behind a spotlight;
- moving focus automatically between controls;
- animating readout digits;
- pulsing every card;
- changing colors without a text/shape equivalent;
- blocking touch until narration ends;
- replaying the whole surface transition.

Reduced motion shows the final static emphasis for the beat duration. No
learner loses information when all cue motion is disabled.

### 9.3 Missing target

If an authored target is absent:

- audio/caption may remain available;
- no fallback selector is guessed;
- the controller records `target-unavailable`;
- the surface does not crash;
- content-contract tests fail before release.

---

## 10. Captions

Captions are exact, persistent and part of the cue—not transient toast text.

Required behavior:

- show the complete cue text when delivery begins;
- keep it visible until the next deliberate action, route change or explicit
  close;
- preserve Replay whenever a caption is dismissed from reading flow;
- never cover the primary truth, active control or sticky navigation;
- wrap at 200% text without horizontal scrolling;
- use the same punctuation and terminology as the manifest;
- remain visible when an audio file fails;
- never use karaoke-style word highlighting;
- optionally emphasize one semantic clause when its visual beat begins, but
  the full text stays readable.

Accessibility semantics:

- automatic captions are not an assertive live region;
- screen-reader-active state suppresses automatic audio;
- user-triggered Replay may announce the caption politely;
- the caption strip appears after the surface heading in DOM reading order;
- Close, Replay and Voice settings have explicit labels;
- caption text is never the only copy of an essential instruction.

---

## 11. Replay

Every delivered cue exposes `Replay` in a stable location.

Replay:

- is at least 44×44 CSS pixels;
- is reachable by keyboard/switch navigation;
- restarts the selected cue from the beginning;
- replays the same synchronized visual beats;
- does not change automatic seen/heard history;
- does not award evidence, XP or completion;
- is disabled with a visible reason when the local asset is missing;
- becomes `Show cue` in Captions-only mode and restores the caption without
  pretending audio played;
- remains discoverable after the caption is closed.

Rapid repeated activation produces one restarted instance, never stacked audio.

---

## 12. Repetition and annoyance prevention

### 12.1 Automatic repetition rules

An automatic cue plays/shows at most once per signature for the current Academy
profile.

It does not become new because of:

- backward navigation;
- app relaunch;
- session restore;
- switching away and back;
- changing viewport/orientation;
- closing a sheet;
- visual redesign;
- replaying the cue;
- changing an unrelated preference.

It may become new because of:

- a new authored cue ID;
- a material content-version change;
- a different locale/voice pack explicitly selected;
- the approved first mastery-return consequence when new saved evidence changes
  the journey;
- a once-only new mastery/consequence event.

### 12.2 Competence taper

- Not started: eligible entry cue on each new surface.
- Practiced: unchanged surface entries remain suppressed; `Hear a hint` remains
  available.
- Mastered: no automatic Lab/Influence/Myths cues on review unless content
  version changed; Mission/Result remain silent; Replay stays available.

The learner hears less as evidence grows.

### 12.3 Session pacing

- never more than one automatic cue in a surface transition;
- never more than one spoken event cue within five seconds;
- no deferred backlog;
- no audio after the learner has entered a new route;
- no generic praise between surfaces.

---

## 13. State and migration

Voice state lives additively inside `strikearc.academy.v1`. No new top-level
storage key replaces the existing store.

```js
preferences: {
  voice: {
    mode: 'unset', // 'voice' | 'captions' | 'off'
    packId: 'control-room-en-us-v1',
    locale: 'en-US',
    volume: 1,
    seen: {
      '<signature>': {
        firstSeenAt: 0,
        lastDelivery: 'played' // caption-only | interrupted | asset-unavailable
      }
    }
  }
}
```

Migration rules:

- absent voice state becomes `unset`, never silently On;
- an existing `voiceEnabled:false` becomes `off`;
- `voiceEnabled:true` plus `captionsEnabled:true` becomes `voice`;
- unknown voice fields are preserved;
- repeated migration is semantically byte-equivalent;
- changing pack or locale does not delete prior seen history;
- seen history may prune obsolete content versions only after the replacement
  version has been delivered;
- no voice state is stored in an experience mastery record;
- no audio blob is stored in localStorage.

Voice preference and automatic history must survive app restart. Diagnostics
may remain in memory or bounded local debug state.

---

## 14. Local audio pack

First pack ID and path remain:

```text
control-room-en-us-v1
assets/audio/academy/control-room-en-us-v1/
```

Suggested structure:

```text
home/orient.m4a
home/recommend-start-line.m4a
start-line/s0-entry.m4a
start-line/s1-entry.m4a
...
backspin/s5-result.m4a
```

Asset contract:

- AAC-LC `.m4a`, mono, 48 kHz;
- target 64–96 kbps;
- integrated loudness target approximately −18 LUFS;
- true peak at or below −1 dBTP;
- leading silence below 120 ms;
- trailing silence below 250 ms;
- no clipping, audible gate, room echo or music;
- asset duration recorded in the manifest verifier;
- file hash included in the build-time pack report;
- captions and cue IDs validated before packaging.

Batch 0 requires complete Home and accepted Backspin reference assets before
Voice mode is called production-ready. Each later experience adds only its own
approved files during its implementation batch.

Audio may be produced by a licensed human actor or an offline/build-time voice
service. Rights, reuse terms and voice identity must be documented. Runtime
synthesis and provider calls remain forbidden.

---

## 15. Future voice packs

Future voices are realistic only if content and voice identity stay separate.

Each future pack must:

- implement the same semantic cue IDs;
- ship its own locale, text/caption review, assets, timing beats and hashes;
- pass the same word, duration, truth and accessibility gates;
- preserve the learner's selected mode;
- never change Academy mastery or content logic;
- be selected explicitly, never rotated as an experiment without consent.

Adding a second voice is mainly an asset-production and QA cost, not a new
runtime architecture. Translation is more expensive because every caption,
golf term, number and timing beat must be revalidated. A cosmetic voice swap in
the same language is cheaper but still requires the full audio-pack gate.

Version 1 ships one excellent voice. A voice marketplace, downloads, celebrity
voices and per-lesson characters are explicitly out of scope.

---

## 16. Native lifecycle, accessibility and privacy

### 16.1 Native lifecycle

- package assets locally through the existing Capacitor bundle;
- respect OS media volume, Bluetooth/headphone routing and audio-focus loss;
- background/page hide stops audio;
- foreground does not resume automatically;
- phone call, Siri/assistant or other audio interruption stops cleanly;
- Voice Off remains Off after termination/relaunch;
- no audio begins before the Academy surface and preference are ready.

### 16.2 Screen readers

The controller receives a tri-state accessibility signal:

```text
true | false | unknown
```

- `true`: automatic audio is suppressed;
- `false`: normal eligibility applies;
- `unknown`: explicit first-use consent governs; the product never claims it
  detected a screen reader;
- manual Replay remains available after deliberate selection;
- captions never use assertive announcements that fight VoiceOver/TalkBack.

The packaged host may later supply native iOS/Android detection without
changing cue or renderer contracts. Detection failure is not treated as
`false`.

### 16.3 Privacy

Academy voice:

- never opens the microphone;
- never performs speech recognition;
- never sends cue text, progress or audio to a provider;
- never requires an account;
- never infers emotion or attention;
- may record bounded local diagnostics for delivery reason only;
- requires separate authorization before any remote voice analytics exist.

---

## 17. Reference interaction: Start Line S1

First eligible entry with mode `voice`:

1. Direction Lab mounts with Face, Path and Launch Direction visible.
2. Caption strip appears.
3. Control Room says:

   > Move the face to plus two. Watch the launch ray settle between face and path.

4. `Face control` receives a static/outlined emphasis.
5. At `Watch the launch ray`, emphasis moves to the authoritative Launch ray.
6. Audio ends. Caption and Replay remain.

If the learner touches Face while the line speaks:

- audio stops within 150 ms;
- the model responds immediately;
- caption stays;
- no stale remainder is queued;
- Replay can restore the full cue and beats.

When the +1.0° target is first reached:

- the screen shows engine-derived contribution evidence;
- a consequence cue may speak only if no cue ended in the preceding five
  seconds and the consequence signature is unseen;
- otherwise the evidence appears silently.

Backward navigation to Mission and forward return to Lab does not autoplay the
same cue. Opening S2 for the first time may play its own new entry cue.

---

## 18. Failure behavior

| Failure | Required outcome |
|---|---|
| Asset missing | caption remains; Replay disabled with `Audio unavailable`; mark signature seen |
| Playback rejected | caption remains; no retry loop; Replay may retry after user activation |
| Target missing | audio/caption remain; no guessed selector; diagnostic + failing release test |
| Storage write fails | current mode works in memory; show existing non-blocking save warning |
| Route changes mid-cue | stop, clear beats, discard old epoch |
| App backgrounds | stop; never auto-resume |
| Rapid Replay | one restart; never overlap |
| Voice Off mid-cue | stop within 150 ms; persist Off; no resume |
| Screen reader becomes active | stop automatic audio and clear beats; preserve caption |
| Non-finite model state | voice cannot hide or repair it; existing instrument failure state governs |

No voice failure blocks Academy navigation, mastery submission or reward
idempotency.

---

## 19. Content and system acceptance gates

### 19.1 Manifest gates

- all cue IDs unique;
- all text 12–24 words;
- all recorded durations 3–8 seconds unless explicitly reviewed;
- no experience above eight signatures;
- maximum one automatic entry cue per surface;
- every cue has a valid semantic target and visible caption;
- every asset path is local and exists for Voice-ready builds;
- no remote URL, generation field or arbitrary selector;
- every spoken claim exists visibly/accessibly and passes truth review;
- current inventory remains 99 experience cues plus the approved Home set.

### 19.2 Controller gates

- first eligible cue delivered once;
- unchanged revisit suppressed across reload;
- content-version change eligible once;
- no overlap and no stale queue;
- model input interrupts within 150 ms;
- Voice Off interrupts within 150 ms and persists;
- Replay restarts without mutating automatic history;
- background/foreground does not resume;
- missing asset produces caption-only state;
- screen-reader `true` suppresses automatic audio;
- screen-reader `unknown` is never treated as detected-safe;
- audio/controller failure cannot change progress.

### 19.3 UI and synchronization gates

- cue strip, Replay and Voice control meet 44×44;
- 430×932 and 375×812 fit normal and 200% text;
- captions never cover truth/control/navigation;
- each beat emphasizes the authored target at the authored time;
- reduced motion produces equivalent static evidence;
- keyboard/switch can change mode, Replay, stop and dismiss;
- focus never moves because an audio beat changes;
- VoiceOver/TalkBack walkthrough has no double-speaking automatic cue;
- the screen remains interactive throughout playback.

### 19.4 Audio identity gate

Before the first pack ships:

1. record at least three representative lines: orient, cue and consequence;
2. loudness-normalize them to the asset contract;
3. run a provenance-blind listening comparison against at least one more
   theatrical and one more generic assistant direction;
4. require the selected sample to win for clarity, trust and low fatigue;
5. document rights and reuse terms;
6. lock the selected performance guide for the remaining pack.

This is one voice-identity gate, not module-by-module owner approval.

---

## 20. Rollout contract

This specification narrows and completes:

- Section 10 of the Academy curriculum blueprint;
- Section 14 of the Home/store migration design;
- Task 6 of the Home/store implementation plan;
- Section 7.5 of the Academy rollout index.

Conflict precedence within voice scope:

1. this Voice System design;
2. the experience's authored cue table;
3. Home/store shared behavior;
4. the curriculum blueprint;
5. older voice notes.

Implementation order:

1. shared manifest/schema and repetition ledger in Batch 0;
2. preference/consent, controller, captions, Replay, Voice Off and sync host;
3. Home + accepted Backspin reference integration;
4. one-time reference voice identity and asset gate;
5. each later experience supplies its own frozen cues/assets in its existing
   sequential batch;
6. no later experience may fork the global controller.

Voice System acceptance does not mean the unbuilt Academy experiences are
implemented. It means their authored cues have one safe, native and testable
delivery contract ready before Batch 1.
