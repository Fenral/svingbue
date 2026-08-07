# Flightglass v1 Technical Product Specification

Status: normative draft for v1 execution

Updated: 2026-08-06

Product UI language: English

Planning language: Norwegian is allowed

This document converts the current product decisions into small, verifiable
phases. It supersedes older scope only for the v1 surfaces named here. Protected
physics, purchase identifiers and Academy storage remain governed by
`AGENTS.md` and `CLAUDE.md`.

## 1. Product objective

Flightglass v1 is an interactive explainer for golfers:

> Make launch-monitor-style numbers visible, explain their relationship, and
> give the golfer one useful variable to explore next.

The first release MUST feel like one native app, not a collection of HTML
demos. The memorable product promise is the existing Flightglass line:
**See why it flew.**

### V1 user loop

1. Open the app, pass the skippable Flightglass opening and see one obvious
   learning action on Home.
2. Complete the four-step product tour: Outcome proof, Studio proof, one live
   engine relationship and the product map.
3. Open Outcome and manipulate the five delivery inputs in real time.
4. Inspect cause and effect in Impact Studio.
5. Ask Guide one predefined question about a selected model setup or topic.

## 2. Stack and safety boundary

V1 MUST keep the existing stack:

- static multi-page HTML, CSS and JavaScript modules;
- Capacitor 7 for native packaging;
- the current deterministic flight and impact engines;
- RevenueCat integration and existing protected product identifiers;
- local, versioned browser storage for the first usable release.

The native iOS deployment target is 16.4. CI MUST patch both the generated
Xcode project and Podfile to this target after Capacitor sync because shipping
v1 uses native modal dialogs, `color-mix()` and dynamic viewport units.

V1 MUST NOT migrate to Next.js merely because the example Definition of Done
used Next.js. A framework rewrite would not prove product value and would make
the current physics, native wrapper and test harness harder to verify.

Supabase is allowed only when a phase has a concrete need for accounts,
cross-device sync, server-side entitlements or remote history. No Supabase
schema work may begin without a project reference. Schema changes MUST then use
checked-in migrations, never ad hoc dashboard SQL. No service-role key may
reach the client.

The following boundaries remain protected:

- bundle ID `no.strikearc.app`;
- App Store Connect ID `6768449250`;
- RevenueCat products `strikearc_pro_monthly`,
  `strikearc_pro_annual`, `strikearc_pro_lifetime`;
- existing `strikearc.academy.*` storage keys;
- all physics outputs unless a separate authorized regression task exists.

## 3. Information architecture

### Public web

- A public animated marketing landing page is explicitly deferred by the owner.
  It is not a blocker for the native v1 release and MUST NOT be added to the
  Capacitor payload by implication.
- `privacy.html`, `terms.html` and `support.html` remain public web destinations
  for store listing, legal and customer-support requirements.
- When the marketing landing is resumed after v1, it has one job: explain
  **See why it flew** and open the app. Motion MUST support hierarchy, use at
  most two signature sequences and provide complete reduced-motion parity.

### App shell

The native app has four primary destinations:

| Destination | Route | Dominant job |
|---|---|---|
| Home | `index.html` | Tell the golfer what to do next |
| Range | `impact.html` | Change one input and see flight immediately |
| Impact Studio | `impact-studio.html` | Understand one cause/effect relationship |
| Jarvis | `jarvis.html` | Choose one guided question and get one next action |

Every destination MUST expose the same shared app identity, current-location
state, safe-area behavior, focus treatment and route semantics. Range may use a
compact/overlay form of the shared navigation to protect the full-screen
instrument, but the route must remain directly accessible without a hamburger.

Home MUST be an app home, not a generative scene. Its content is deterministic
and state-driven:

- first use: `See how Flightglass works` and the four-step learning tour;
- completed tour with no saved setup: `Open live Outcome`;
- compatible legacy saved setup: most recent model and one next experiment;
- no setup context: an honest fixed-example or model label;
- no Lab, Academy, Outcome or mock routes in v1 navigation.

## 4. Shared state contract

A small shared module MUST own a versioned context object. Proposed key:
`sa.v1.context`.

```js
{
  version: 1,
  onboarding: {
    complete: false,
    step: 1,
    dismissed: false,
    labLoft: 24,
    // retained only for backward-compatible reads; the v1 tour does not ask
    // for or write personal golf/profile answers
    goal: "straighter|distance|contact|trajectory|null",
    handedness: "right|left|null",
    experience: "new|improving|experienced|null",
    draftShot: {
      club: "driver|7iron|wedge|null",
      start: "left|straight|right|null",
      curve: "left|straight|right|null",
      flight: "low|neutral|high|null"
    }
  },
  currentShot: null,
  lastExperiment: null,
  jarvis: {
    selectedQuestionId: null,
    recommendedRoute: null
  }
}
```

The adapter MUST:

- validate version and shape before returning data;
- fail safely when storage is unavailable or malformed;
- never overwrite protected Academy keys;
- treat the engine output as authoritative;
- allow Range, Studio and Jarvis to read the same optional shot context;
- preserve current screen defaults when context is absent.

The v1 learning tour MUST write only `complete`, `step`, `dismissed` and the
fixed-example `labLoft` under `onboarding`. It MUST NOT ask for goal,
handedness, experience or a description of the golfer's own shot, and it MUST
NOT create or replace `currentShot`. The remaining onboarding properties and
the guided-shot helpers are compatibility readers for contexts created by an
earlier build.

## 5. Flightglass Guide v1

Flightglass Guide replaces the Jarvis product name. The route remains
`jarvis.html` for compatibility. Guide is a guided index into the shipping
Flightglass models, not generic chat, a measured-shot feed or an AI diagnosis.

It MUST:

- expose predefined question buttons only;
- have no text field, keyboard composer or hidden free-text API path;
- label stored onboarding context as a `Saved guided model setup`; it MUST NOT
  be described as the user's current, latest or measured shot;
- use deterministic answer templates and existing engine facts in v1;
- distinguish Range-modelled output, Studio geometry, bounded estimates and
  unsupported real-world variables with visible truth labels;
- recompute every shown output from the five saved delivery inputs instead of
  trusting a serialized result;
- reject or disclose out-of-domain, no-flight and capped-spin states;
- cite at least one visible input or model output when a saved setup exists;
- end with exactly one next action or one bounded one-variable comparison;
- deep-link to Range or Impact Studio with the context preserved.

The initial library is outcome-first. It MUST provide the three entry intents
`Saved setup`, `Explore a topic` and `Compare the model`, followed by the six
topics Direction, Impact, Launch & spin, Distance, Conditions and Model limits.
It MUST include at least 20 predefined questions covering the common start,
curve, face/path, height, carry, strike, spin, speed and model-trust intents.
Impact, weather, equipment and fitting questions may be indexed even when the
shipping model cannot calculate them, but their answer MUST state the gap and
classify it as one of:

1. answerable by the shipping model now;
2. feasible as a bounded new model;
3. dependent on external data or calibration;
4. rejected because a precise answer would be unsupported.

Live Guide labs MUST expose all five Range inputs, change only one input at a
time and name the other four held constants. They MUST show before/current
values and exact deltas. The adapter MUST NOT claim that a candidate is
recommended, improved, optimal, personalized or club-calibrated. A spin lab may
show calculated backspin and true 3-D spin loft, but v1 has no validated
optimal-spin-by-speed band.

Jarvis answers MAY use a small comparison table or a conceptual illustration
when that makes the relationship easier to understand. Tables MUST preserve
exact model values. Any illustration that suggests angles, path, face or ball
flight MUST be rendered from deterministic data; generated imagery is allowed
only for clearly non-metric concepts and MUST be labelled illustrative.

OpenAI or another model MUST NOT be introduced for v1 Guide. Guided questions
can prove demand without latency, cost, privacy risk or invented golf advice.

## 6. Opening and onboarding

The app opening MUST establish the Flightglass instrument identity without
delaying access to the product. It runs at most once per browser/app session,
may be skipped immediately by pointer, Enter or Escape, and has a short
reduced-motion equivalent. Failure or unavailable session storage MUST reveal
Home safely; the opening MUST never leave a blank or permanently blocked app.

Onboarding is a product-understanding tour, not a golfer profile or an intake
of the user's own swing. It MUST demonstrate why the five familiar delivery
inputs matter before asking for an account, notifications or payment.

Target: a new golfer reaches the product map in 90 seconds or less.

Flow:

1. Outcome proof: show a real captured Outcome surface and explain that speed,
   face, path, attack and delivered loft tell the shot's story.
2. Studio proof: show a real captured Impact Studio surface and name two causal
   pairs: Face + Path -> start/curve; Attack + Loft -> launch/spin.
3. Live relationship: use a clearly labelled fixed 7-iron example at 90 mph.
   Let the learner change Delivered Loft from 16-34 degrees and recompute Launch
   Angle, Spin Loft and Backspin through the unchanged shipping engine.
4. Product map: show real Outcome, Studio and Guide previews with one concise
   job for each, then offer `Open the live model`.

The screenshots MUST be reproducible captures of shipping routes, not invented
launch-monitor data. The live example MUST NOT be described as measured,
personal, recommended or optimal. The flow MUST NOT create `currentShot`.

Every step MUST have a visible `Not now` path. Progress and the example loft
MUST resume after dismissal. Back navigation, keyboard/screen-reader operation,
44 px targets, both target portrait sizes and reduced motion are required.

## 7. Monetization

The v1 model is freemium with value before price.

### Free

- complete the learning tour and use its fixed live relationship;
- Home and the core Range flight model;
- 10 distinct Range comparisons, pinned through the existing comparison control;
- the first guided Impact Studio experiment;
- five unique Flightglass Guide answers per local calendar day;
- restore purchases and legal routes always available.

### Pro

- unlimited Range comparisons;
- unlimited guided Flightglass Guide answers;
- unlimited guided Impact Studio experiments;
- later cross-device sync when that phase exists.

Current product pricing remains `kr 99` monthly and `kr 590` annually, with
Annual visually recommended. The UI MUST NOT display a savings statement that
is mathematically inconsistent with live store prices. Existing lifetime
buyers remain entitled; the lifetime product ID is preserved but the tier is
not shown on the v1 paywall.

The paywall MUST appear only after one of these value moments:

- the 11th distinct Range comparison;
- the second guided Impact Studio experiment;
- the sixth unique Guide answer in the same local calendar day.

It MUST NOT appear on cold launch or before the first completed result.

## 8. Design-system contract

The design system applies to **shipping v1 surfaces**, not the repository's
historical mocks and evidence pages.

### Sources of truth

1. Product laws and protected boundaries in `CLAUDE.md` and the master plan.
2. One canonical token implementation in `sa-p3.css`.
3. Shared app-shell and interaction rules in a small shared stylesheet/module.
4. Screen-specific CSS only for unique composition and instrument geometry.

### Required consolidation

- one UI grotesque and one mono truth face across all four routes;
- one render value per semantic token across routes;
- a documented spacing scale rather than one-off spacing values;
- violet reserved for structure/state;
- ember reserved for live truth or the single primary action;
- gold reserved for earned status;
- no decorative glow, grain or gradient without a named product-law purpose;
- no local token mirrors in shipping pages;
- one 44 px navigation/focus/safe-area contract;
- one reduced-motion contract;
- no hardcoded parameter color when a semantic token exists.

Explanatory tables and illustrations follow the same truth boundary: HTML
tables are preferred for exact comparisons, SVG/Canvas is used for measurable
geometry, and generative image tools such as Nano Banana Pro may be used only
for non-metric conceptual art when the tool is available.

Impact Studio is the first migration target because it currently duplicates an
older token family and uses system fonts. Range and the canonical token file are
temporarily excluded from edits while another active branch owns them.

The Impact Studio Low Point marker is a measurement instrument, not a generic
status dot. The exact point MUST remain visible above the swing arc, use the
Contact/Low Point semantic color, align its open aperture to the local arc
tangent and use a fine datum line/tick when projected depth needs explanation.
Only a brief update echo may animate; the settled marker persists under reduced
motion and is drawn after competing geometry. No marker treatment may alter the
underlying impact equations.

## 9. Analytics and success measures

The app MUST define an event interface before choosing a remote analytics
vendor. Events may initially be captured locally/no-op in development.

Required events:

- `onboarding_started`, `onboarding_completed`;
- `onboarding_lab_changed`, `live_model_opened`, `shot_saved`;
- `impact_opened`, `experiment_started`, `experiment_completed`;
- `jarvis_question_selected`, `jarvis_answer_seen`;
- `paywall_seen`, `purchase_started`, `purchase_completed`, `restore_completed`.

Events MUST NOT contain free-form text or personally identifying shot notes.

Beta learning targets, not release gates:

- at least 80% of moderated new users complete the learning tour unassisted;
- at least 40% of activated users complete three shots in seven days;
- at least 25% of activated users return in week two.

## 10. Execution loop

Set exactly one `PHASE` before coding. Work on no other phase.

For each unchecked Definition of Done item:

1. PLAN: name one item and the evidence that will prove it.
2. IMPLEMENT: make the smallest cohesive change for that item.
3. VERIFY: run the proof. A visual claim requires a screenshot inspection.
4. REPORT: record files, command/output and the item now checked.
5. STOP CHECK: stop when the phase is complete. Do not begin the next phase.

No item is complete because code exists. It is complete only when its named
evidence passes fresh.

## 11. Delivery phases and Definition of Done

### Phase 0: Control recovery and shipping parity

Objective: establish a truthful v1 baseline before UI expansion.

- [x] `npm run verify:v1` passes for the four shipping v1 routes without running
  Academy v2 controls.
- [x] The Capacitor web allowlist contains Home, Range, Impact Studio, Jarvis
  and the required legal pages; Academy and other v2/legacy entry points are
  excluded.
- [x] `npm run copy-web` produces byte-identical root/`www` copies for all four
  v1 routes and their required local dependencies.
- [x] A focused v1 shipping-contract test fails before the copy fix and passes
  after it.
- [x] Chromium and WebKit open Home, Range, Studio and Jarvis with zero critical
  runtime findings.

Verification record, 2026-08-06:

- `npm run test:v1`: 0/3 before the fix; 3/3 after the fix.
- `npm run verify:v1`: brand, Home and v1 shipping contracts passed.
- `node scripts/flightglass-browser-spot.mjs --engine chromium --route
  index.html --route impact.html --route impact-studio.html --route
  jarvis.html`: 8 cases, 0 critical findings.
- The equivalent WebKit command: 8 cases, 0 critical findings.

Stop condition met: `PHASE 0 DONE`. Do not begin Phase 1 automatically.

### Phase 1: One app shell and one design system

Objective: make the four v1 routes read as one app without changing physics.

- [x] One shared shell contract defines brand, route state, 44 px navigation,
  safe areas, focus and reduced motion.
- [x] Home, Range, Studio and Jarvis load the canonical token layer.
- [x] Impact Studio has no local token mirror or system-font fallback.
- [x] Every route identifies current location and can reach the other v1 routes.
- [x] Shared navigation does not obscure Range controls at target viewports.
- [x] Automated source tests reject shipping-page token duplication and
  unapproved color literals.
- [x] Screenshots pass at 375x812, 430x932, 812x375 and 932x430, normal and
  reduced motion, in Chromium and WebKit.

Verification record, 2026-08-06:

- `npm run verify:phase1`: brand, Home and seven v1 contracts passed.
- Chromium: 32 route/viewport/motion cases, 0 critical findings.
- WebKit: 32 route/viewport/motion cases, 0 critical findings.
- Representative normal/reduced screenshots were inspected manually; one Home
  content collision found in the first WebKit pass was corrected and re-run.

Stop condition met: `PHASE 1 DONE`. Do not begin Phase 2 automatically.

Instrument follow-up, 2026-08-07: the Studio Low Point disk was replaced by an
exact core, tangent-aligned open aperture, subtle bloom and optional turf datum.
It is drawn last, stays opaque and visible, and uses a 280 ms update echo that
is removed under reduced motion. The unchanged Studio geometry passes 9/9
Chromium and 9/9 WebKit browser cases.

### Phase 2: Onboarding and app Home

Objective: make familiar launch-monitor inputs understandable in 90 seconds
without profile, account or payment friction.

Phase 2 MUST replace the current Night Ladder destination scene in full. The
new `index.html` is a deterministic app start, not an iteration on the existing
world/flight-trace/floating-card layout. Only the Flightglass brand system and
shared four-route bottom navigation carry forward as visual constraints. The
public animated marketing landing remains a separate future web surface.

- [x] First launch opens the four-step onboarding; returning launch does not.
- [x] Skip and resume work at every step.
- [x] A once-per-session opening is immediately skippable and has complete
  reduced-motion and safe-fallback behavior.
- [x] The tour uses reproducible captures of Outcome, Studio and Guide and one
  fixed live Delivered Loft relationship backed by the shipping engine.
- [x] The tour asks for no personal golf data and creates no `currentShot`.
- [x] Home shows a learning CTA when empty, a live-Outcome CTA after completion
  and preserves the compatible latest-setup state when one already exists.
- [x] No sign-in, notification or paywall appears before the product map.
- [x] All states pass keyboard, screen reader, reduced motion and target-size
  checks.
- [ ] Moderated usability evidence: at least 8 of 10 new users finish without
  help and median completion is 90 seconds or less.

Fresh automated verification record (2026-08-07): the focused onboarding
journeys pass 9/9 in Chromium and 9/9 in WebKit. They cover the opening, first
and returning launch, all four resume points, Back and `Not now`, fixed-example
engine truth, zero `currentShot` creation, keyboard/focus behavior, reduced
motion, 44 px targets and 375x812/430x932 layouts. The v1 shipping contracts
  pass 48/48, including byte-identical native copies of the three registered
  onboarding captures. The phone matrix also passes 4/4 Chromium and 4/4
  WebKit scenarios. Representative screenshots were inspected manually. The
moderated 10-user protocol remains open in `docs/phase2-onboarding-uat.md`;
therefore Phase 2 is not yet declared done.

Stop condition: print `PHASE 2 DONE` and stop.

### Phase 3: Flightglass Guide

Objective: make the shipping engine's knowledge quickly discoverable, then
close the saved-setup to explanation to bounded experiment loop without free
text or false precision.

- [x] Guide offers three guided entry intents, six topics and at least 20
  predefined questions based on researched golfer intents.
- [x] There is no input/textarea/contenteditable or free-text request path.
- [x] Every question has a truth tier and capability-gap classification; model
  limits are visible instead of replaced with invented answers.
- [x] Saved-setup answers cite recomputed engine values, avoid diagnosis and
  optimization language and end with one action.
- [x] At least one live lab exposes all five inputs, changes exactly one at a
  time, names held constants and updates exact outcome deltas in real time.
- [x] Guide to Range/Studio navigation preserves context and defaults safely
  when context is missing or corrupt.
- [x] Valid, empty, corrupt, out-of-domain, no-flight and capped-output states
  pass deterministic adapter and browser tests in Chromium and WebKit.
- [x] Mobile and desktop layouts provide 44 px targets, keyboard focus,
  reduced-motion parity, chart text alternatives and no horizontal overflow.

Fresh completion evidence (2026-08-07): 28 researched guided questions ship
across the six topics; 30 deterministic Guide contracts and 22 Chromium/WebKit
browser cases pass. The browser cases include empty/corrupt fallback, saved
one-variable Range handoff, Studio navigation context persistence, 390x844 and
1440x900 containment, reduced motion and target-size checks. The final fresh
Impeccable/Terra review returned `REVIEW-READY` after the 10 px type-floor fix.

Stop condition: print `PHASE 3 DONE` and stop.

### Phase 4: Monetization and optional account sync

Objective: charge after demonstrated value and preserve existing purchases.

- [x] Free/Pro entitlements are enforced at named value moments only.
- [ ] Monthly/Annual offerings come from RevenueCat; fallbacks are truthful.
- [x] Savings copy is mathematically consistent with live prices.
- [ ] Existing lifetime entitlement restores even though lifetime is hidden.
- [x] Purchase, cancel, error and restore paths are keyboard/screen-reader
  accessible and browser-tested.
- [x] If cross-device sync is included, a Supabase project reference is set,
  migrations are checked in, RLS is enabled and service-role credentials remain
  server-only. Otherwise Supabase remains out of this phase.

Fresh source/test evidence (2026-08-07): 23/23 monetization/IAP contracts and
12/12 Chromium plus 12/12 WebKit browser cases pass. The browser cases trigger the
11th Range comparison, second guided Studio experiment and sixth same-day Guide
answer from the actual shipping pages; verify the distinct guided layer,
automatic resumption of each gated action after unlock, no-cost re-pinning of a
previously counted setup, a keyboard-completed successful purchase,
cancel/pending/error, Home and paywall restore, focus return, axe WCAG A/AA,
reduced motion and portrait/landscape containment. Terms, Privacy and paywall
promises now agree; no savings claim or new lifetime tier is shown. Cross-device
sync and Supabase are intentionally absent. No global browser setter can grant
the protected entitlement, and the iOS 16.4 native baseline is enforced by
tested CI transforms.

Phase 4 remains open and must not be labelled done. Production still requires
real RevenueCat public SDK keys, a current Monthly/Annual offering granting the
exact `pro` entitlement, configured store products/agreements, and native
sandbox proof for purchase plus restoration of an existing lifetime customer.

The committed browser/source configuration MUST remain fail-closed. Native
release builds MUST inject the platform-specific public RevenueCat SDK key into
the disposable `www/` package after `copy-web`, using a protected CI
environment variable. A real key MUST NOT be committed to source. Missing or
malformed configuration MUST fail the build before the native platform is
packaged.

Stop condition: print `PHASE 4 DONE` and stop.

### Phase 5: Native release convergence

Objective: prove the complete iPhone v1 and prepare the existing App Store
record without making the deferred marketing landing a release dependency.

- [ ] All protected identifiers and physics fixtures remain unchanged.
- [ ] Source, route, accessibility, orientation, copy, purchase and browser
  release gates pass on the exact candidate commit.
- [ ] Codemagic is manual-only, uses the `resources/` asset sources, refuses an
  ambiguous build number and reuses persistent Apple signing assets without
  revoking team certificates.
- [ ] The iPhone-only native package receives a valid iOS RevenueCat public SDK
  key at build time; no real key exists in the committed source.
- [ ] RevenueCat reports a valid Apple In-App Purchase Key and Issuer ID for
  the App Store app; those credentials never enter Git or the native bundle.
- [ ] Monthly and Annual grant `pro`, existing Lifetime restores, and a native
  sandbox purchase plus restore are recorded against the candidate build.
- [ ] Current App Store metadata, privacy declarations, reviewer notes, support
  URL and current-product screenshots are ready.
- [ ] A final current-product contact sheet, physical-iPhone checklist and the
  Phase 2 moderated onboarding evidence exist.
- [ ] The marketing landing remains deferred and outside the Capacitor payload.

Stop condition: print `PHASE 5 DONE`; do not publish without the repository's
release gates and authorization. A green source tree alone cannot close the
native signing, store-account, sandbox-purchase or human gates.

## 12. Explicit v1 cuts

- generic AI chat;
- Academy and its voice package, which move to v2;
- video or computer-vision swing diagnosis;
- launch-monitor integrations;
- GPS/course tracking;
- social feed or instructor marketplace;
- forced account before value;
- migration to a new frontend framework;
- design-system migration of historical mocks and evidence pages;
- Supabase merely because the connector exists;
- Higgsfield as a runtime or release dependency.
