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

Flightglass v1 is a practice translator for golfers:

> Show what the shot did, explain the likely relationship, and give the golfer
> one useful thing to test next.

The first release MUST feel like one native app, not a collection of HTML
demos. The memorable product promise is the existing Flightglass line:
**See why it flew.**

### V1 user loop

1. Open Home and see one obvious next action.
2. Open Range and manipulate one shot model.
3. Inspect cause and effect in Impact Studio.
4. Ask Jarvis one guided, predefined question about the current shot.
5. Return to Range with one experiment to try.

## 2. Stack and safety boundary

V1 MUST keep the existing stack:

- static multi-page HTML, CSS and JavaScript modules;
- Capacitor 7 for native packaging;
- the current deterministic flight and impact engines;
- RevenueCat integration and existing protected product identifiers;
- local, versioned browser storage for the first usable release.

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

- `landing.html`: animated marketing landing page, web-only.
- The landing page has one job: explain **See why it flew** and open the app.
- Motion MUST support hierarchy, use at most two signature sequences and have a
  complete `prefers-reduced-motion` state.
- Generated media is not required. Existing assets, CSS, SVG and Canvas are the
  first implementation path.

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

Home MUST be an app home, not a generative scene. The existing visual world may
remain as atmosphere, but its content is deterministic and state-driven:

- first use: `Run your first shot`;
- returning user: most recent shot and one next experiment;
- no shot context: honest demo label;
- no Lab, Academy, Outcome or mock routes in v1 navigation.

## 4. Shared state contract

A small shared module MUST own a versioned context object. Proposed key:
`sa.v1.context`.

```js
{
  version: 1,
  onboarding: {
    complete: false,
    goal: "straighter|distance|contact|trajectory|null",
    handedness: "right|left|null",
    experience: "new|improving|experienced|null"
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

## 5. Jarvis v1

Jarvis is guided help, not generic chat.

It MUST:

- expose predefined question buttons only;
- have no text field, keyboard composer or hidden free-text API path;
- scope answers to the current or explicitly selected shot;
- use deterministic answer templates and existing engine facts in v1;
- distinguish hypotheses from diagnoses;
- cite at least one visible input or observation when shot context exists;
- end with exactly one recommended action;
- deep-link to Range or Impact Studio with the context preserved.

Initial question library:

1. Why did it start right?
2. Why did it curve right?
3. What should I change first?
4. Give me a 10-ball test.
5. What does Impact Studio show here?
6. What is one thing I can ignore for now?

Jarvis answers MAY use a small comparison table or a conceptual illustration
when that makes the relationship easier to understand. Tables MUST preserve
exact model values. Any illustration that suggests angles, path, face or ball
flight MUST be rendered from deterministic data; generated imagery is allowed
only for clearly non-metric concepts and MUST be labelled illustrative.

OpenAI or another model MUST NOT be introduced for v1 Jarvis. Guided questions
can prove demand without latency, cost, privacy risk or invented golf advice.

## 6. Onboarding

Onboarding MUST deliver the first useful flight before asking for an account,
notifications or payment.

Target: a new golfer completes the flow in 90 seconds or less.

Flow:

1. Promise: `See why it flew.` One sentence explaining that Flightglass is a
   learning model, not a measurement device or human coach.
2. Personalize: choose one goal, handedness and experience level. Every question
   has a visible Skip path.
3. Guided first shot: select a club and three plain-language observations:
   start direction, curve and height/strike.
4. Aha: render the shot, explain one relationship and offer `Try one change`.
5. Only after the aha may the app offer optional sign-in or notifications.

Onboarding MUST be resumable, keyboard/screen-reader operable, safe at both
target portrait sizes and fully usable with reduced motion.

## 7. Monetization

The v1 model is freemium with value before price.

### Free

- complete onboarding and first guided shot;
- Home and the core Range flight model;
- 10 instrument shots, using the existing meter;
- the first guided Impact Studio experiment;
- a bounded daily Jarvis allowance;
- restore purchases and legal routes always available.

### Pro

- unlimited instrument shots;
- unlimited guided Jarvis answers;
- saved experiments and complete history/trends;
- deeper Impact Studio comparisons;
- later cross-device sync when that phase exists.

Current product pricing remains `kr 99` monthly and `kr 590` annually, with
Annual visually recommended. The UI MUST NOT display a savings statement that
is mathematically inconsistent with live store prices. Existing lifetime
buyers remain entitled; the lifetime product ID is preserved but the tier is
not shown on the v1 paywall.

The paywall MUST appear only after one of these value moments:

- the 11th instrument shot;
- the second premium experiment;
- the user explicitly opens a Pro-only history/Jarvis capability.

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

## 9. Analytics and success measures

The app MUST define an event interface before choosing a remote analytics
vendor. Events may initially be captured locally/no-op in development.

Required events:

- `onboarding_started`, `onboarding_completed`;
- `first_shot_completed`, `shot_saved`;
- `impact_opened`, `experiment_started`, `experiment_completed`;
- `jarvis_question_selected`, `jarvis_answer_seen`;
- `paywall_seen`, `purchase_started`, `purchase_completed`, `restore_completed`.

Events MUST NOT contain free-form text or personally identifying shot notes.

Beta learning targets, not release gates:

- at least 80% of moderated new users complete the first result unassisted;
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

### Phase 2: Onboarding and app Home

Objective: deliver a useful first shot in 90 seconds without account friction.

- [ ] First launch opens the four-step onboarding; returning launch does not.
- [ ] Skip and resume work at every step.
- [ ] The guided first shot produces a deterministic Range result.
- [ ] Home shows first-shot CTA when empty and latest-shot/next experiment when
  context exists.
- [ ] No sign-in, notification or paywall appears before the first result.
- [ ] All states pass keyboard, screen reader, reduced motion and target-size
  checks.
- [ ] Moderated usability evidence: at least 8 of 10 new users finish without
  help and median completion is 90 seconds or less.

Stop condition: print `PHASE 2 DONE` and stop.

### Phase 3: Contextual guided Jarvis

Objective: close the Range to explanation to experiment loop without free text.

- [ ] Jarvis offers only the six approved predefined questions.
- [ ] There is no input/textarea/contenteditable or free-text request path.
- [ ] Every question has tested empty-shot and current-shot answers.
- [ ] Shot answers cite visible context, avoid certainty language and end with
  one action.
- [ ] Jarvis to Range/Studio navigation preserves context and defaults safely
  when context is missing or corrupt.
- [ ] All question/state combinations pass deterministic contract tests.

Stop condition: print `PHASE 3 DONE` and stop.

### Phase 4: Monetization and optional account sync

Objective: charge after demonstrated value and preserve existing purchases.

- [ ] Free/Pro entitlements are enforced at named value moments only.
- [ ] Monthly/Annual offerings come from RevenueCat; fallbacks are truthful.
- [ ] Savings copy is mathematically consistent with live prices.
- [ ] Existing lifetime entitlement restores even though lifetime is hidden.
- [ ] Purchase, cancel, error and restore paths are keyboard/screen-reader
  accessible and browser-tested.
- [ ] If cross-device sync is included, a Supabase project reference is set,
  migrations are checked in, RLS is enabled and service-role credentials remain
  server-only. Otherwise Supabase remains out of this phase.

Stop condition: print `PHASE 4 DONE` and stop.

### Phase 5: Animated landing and release convergence

Objective: separate marketing from the deterministic app Home and prove the
complete v1.

- [ ] `landing.html` communicates the product and one CTA in five seconds.
- [ ] Motion has at most two signature sequences and full reduced-motion parity.
- [ ] Landing is excluded from the Capacitor app payload unless explicitly
  required by native navigation.
- [ ] All protected identifiers and physics fixtures remain unchanged.
- [ ] All route, accessibility, orientation, copy, purchase and browser gates
  pass from a clean clone.
- [ ] A final before/after contact sheet and manual device checklist exist.

Stop condition: print `PHASE 5 DONE`; do not publish without the repository's
release gates and authorization.

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
